import { bump, business, event, fail, type Context, type Row } from '../model'
import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { qboRequest } from './client'
import { collection, payloadFor } from './payload'

/** Compare only the explicit fields sent by Glove, ignoring provider-added metadata. */
export function postedMatches(expected: any, remote: any): boolean {
  if (Array.isArray(expected)) return Array.isArray(remote) && expected.length === remote.length && expected.every((v, i) => postedMatches(v, remote[i]))
  if (expected && typeof expected === 'object') return remote && typeof remote === 'object' && Object.entries(expected).filter(([key]) => !['SyncToken', 'sparse'].includes(key)).every(([key, value]) => postedMatches(value, remote[key]))
  return expected === remote
}
export async function reconcile(c: Context, db: D1Database, key: string, kind: string, row: Row, remoteId: string) {
  const connection = business(c.s).qbo
  if (!['unknown', 'reserved', 'sending'].includes(row.qboSync?.phase) || row.qboSync.connectionId !== connection.connectionId) fail('QBO_RECONCILE', 'Choose an unresolved operation from this QuickBooks company.')
  const operation = await db.prepare('SELECT * FROM glove_qbo_operations WHERE id=? AND record_id=?').bind(row.qboSync.operationId, row.id).first<any>()
  if (!operation || operation.phase === 'sending') fail('QBO_RECONCILE', 'The provider attempt is still in flight or its durable operation is unavailable.')
  const payload = payloadFor(c, kind, row), { SyncToken: _token, ...content } = payload.body
  const contentFingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, kind, id: row.id, body: content }))
  const fingerprint = ['customer', 'service'].includes(kind) ? sha256(`${contentFingerprint}:${row.qbo.syncToken}`) : contentFingerprint
  if (fingerprint !== operation.fingerprint) fail('QBO_RECONCILE', 'This record changed after the uncertain send. Restore and review its exact original content before reconciliation.')
  const response = await qboRequest(connection, key, `${payload.resource}/${remoteId}`)
  const remote = response[Object.keys(response).find(k => k.toLowerCase() === payload.resource) ?? '']
  if (String(remote?.Id) !== remoteId || !postedMatches(payload.body, remote)) fail('QBO_RECONCILE', 'This QuickBooks record does not match the exact reserved content. No retry or balance change was made.')
  const outcome = { phase: 'complete', remoteId, operationId: operation.id, connectionId: connection.connectionId, fingerprint, contentFingerprint, message: 'Owner verified the existing QuickBooks record; no new post was sent.' }
  c.sql.push({ sql: "UPDATE glove_qbo_operations SET phase='complete',remote_id=? WHERE id=?", params: [remoteId, operation.id] })
  bump(c.s, collection(kind), row, { qboSync: outcome, ...(row.qbo && remote.SyncToken ? { qbo: { ...row.qbo, syncToken: remote.SyncToken } } : {}) })
  event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'qbo.reconciled', summary: `Owner reconciled QuickBooks ${remoteId}; exact content verified without another post`, data: { remoteId, operationId: operation.id } })
  return outcome
}
