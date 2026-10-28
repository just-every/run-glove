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
  if (!operation || operation.connection_id !== connection.connectionId || operation.kind !== kind || !['reserved', 'sending', 'unknown'].includes(operation.phase)) fail('QBO_RECONCILE', 'The unresolved durable operation is unavailable for this record and company.')
  // A durable sending phase cannot prove failure, even after a Worker restart.
  // Only native invoices gain explicit read-only recovery of this phase.
  if (operation.phase === 'sending' && (kind !== 'invoice' || row.openingBalance || !['approved', 'exported'].includes(row.status))) fail('QBO_RECONCILE', 'Interrupted-send recovery is available only for native approved USD invoices; no retry is authorized.')
  if (operation.phase === 'sending' && !connection.linksConfirmedAt) fail('QBO_REVIEW', 'Confirm the verified existing-record links before verifying this interrupted invoice.')
  const payload = payloadFor(c, kind, row), { SyncToken: _token, ...content } = payload.body
  const contentFingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, kind, id: row.id, body: content }))
  const fingerprint = ['customer', 'service'].includes(kind) ? sha256(`${contentFingerprint}:${row.qbo?.syncToken ?? 'create'}`) : contentFingerprint
  if (fingerprint !== operation.fingerprint) fail('QBO_RECONCILE', 'This record changed after the uncertain send. Restore and review its exact original content before reconciliation.')
  const response = await qboRequest(connection, key, `${payload.resource}/${remoteId}`)
  const remote = response[Object.keys(response).find(k => k.toLowerCase() === payload.resource) ?? '']
  if (String(remote?.Id) !== remoteId || !postedMatches(payload.body, remote) || kind === 'invoice' && Number(remote.TotalAmt) !== Number(row.revisions.findLast((r: Row) => r.approval)?.totals.total)) fail('QBO_RECONCILE', 'This QuickBooks record does not match the exact reserved content. No retry or balance change was made.')
  const outcome = { phase: 'complete', remoteId, operationId: operation.id, connectionId: connection.connectionId, fingerprint, contentFingerprint, message: 'Owner verified the existing QuickBooks record; no new post was sent.' }
  c.sql.push({ sql: "UPDATE glove_qbo_operations SET phase='complete',remote_id=? WHERE id=?", params: [remoteId, operation.id] })
  c.sql.push({ sql: "UPDATE glove_commands SET result=json_set(result,'$.result',json(?)) WHERE type='qbo.sync' AND json_extract(result,'$.result.operationId')=?", params: [JSON.stringify(outcome), operation.id] })
  bump(c.s, collection(kind), row, { qboSync: outcome, ...(row.qbo?.connectionId === connection.connectionId && remote.SyncToken ? { qbo: { ...row.qbo, syncToken: remote.SyncToken } } : kind === 'customer' && row.qboCreate?.connectionId === connection.connectionId ? { qbo: { remoteId, syncToken: remote.SyncToken, connectionId: connection.connectionId, confirmedAt: row.qboCreate.approvedAt, confirmedBy: row.qboCreate.approvedBy } } : {}) })
  event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'qbo.reconciled', summary: `Owner reconciled QuickBooks ${remoteId}; exact content verified without another post`, data: { remoteId, operationId: operation.id } })
  return outcome
}
