import { bump, business, event, fail, type Context, type Row } from '../model'
import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { qboRequest } from './client'
import { collection, payloadFor } from './payload'
import { assertPriorCompanyResolved, priorOutcomes } from './links'

/** Compare only the explicit fields sent by Glove, ignoring provider-added metadata. */
export function postedMatches(expected: any, remote: any): boolean {
  if (Array.isArray(expected)) return Array.isArray(remote) && expected.length === remote.length && expected.every((v, i) => postedMatches(v, remote[i]))
  if (expected && typeof expected === 'object') return remote && typeof remote === 'object' && Object.entries(expected).filter(([key]) => !['SyncToken', 'sparse'].includes(key)).every(([key, value]) => postedMatches(value, remote[key]))
  return expected === remote
}
export async function reconcile(c: Context, db: D1Database, key: string, kind: string, row: Row, remoteId: string) {
  const connection = business(c.s).qbo
  if (kind === 'payment' && row.qboSync?.phase === 'complete') {
    if (row.qboSync.connectionId === connection.connectionId) {
      if (!row.qboSync.reconciledAt || row.qboSync.remoteId !== remoteId) fail('QBO_RECONCILE', 'This payment already has a confirmed QuickBooks reference.')
      event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'qbo.replayed', summary: `QuickBooks payment ${remoteId} was already reconciled; no new post was sent`, data: { connectionId: connection.connectionId, remoteId } })
      return row.qboSync
    }
    return reconcilePaymentCompany(c, key, row, remoteId)
  }
  if (!['unknown', 'reserved', 'sending'].includes(row.qboSync?.phase) || row.qboSync.connectionId !== connection.connectionId) fail('QBO_RECONCILE', 'Choose an unresolved operation from this QuickBooks company.')
  const operation = await db.prepare('SELECT * FROM glove_qbo_operations WHERE id=? AND record_id=?').bind(row.qboSync.operationId, row.id).first<any>()
  if (!operation || operation.connection_id !== connection.connectionId || operation.kind !== kind) fail('QBO_RECONCILE', 'The durable operation for this record and company is unavailable.')
  const payload = payloadFor(c, kind, row), { SyncToken: _token, ...content } = payload.body
  const contentFingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, kind, id: row.id, body: content }))
  const fingerprint = ['customer', 'service'].includes(kind) ? sha256(`${contentFingerprint}:${row.qbo?.syncToken ?? 'create'}`) : contentFingerprint
  if (fingerprint !== operation.fingerprint) fail('QBO_RECONCILE', 'This record changed after the uncertain send. Restore and review its exact original content before reconciliation.')
  const response = await qboRequest(connection, key, `${payload.resource}/${remoteId}`)
  const remote = response[Object.keys(response).find(k => k.toLowerCase() === payload.resource) ?? '']
  if (String(remote?.Id) !== remoteId || !postedMatches(payload.body, remote)) fail('QBO_RECONCILE', 'This QuickBooks record does not match the exact reserved content. No retry or balance change was made.')
  const outcome = { phase: 'complete', remoteId, operationId: operation.id, connectionId: connection.connectionId, fingerprint, contentFingerprint, reconciledAt: c.now, reconciledBy: c.actor.id, message: 'Owner verified the existing QuickBooks record; no new post was sent.' }
  c.sql.push({ sql: "UPDATE glove_qbo_operations SET phase='complete',remote_id=? WHERE id=?", params: [remoteId, operation.id] })
  bump(c.s, collection(kind), row, { qboSync: outcome, ...(row.qbo?.connectionId === connection.connectionId && remote.SyncToken ? { qbo: { ...row.qbo, syncToken: remote.SyncToken } } : kind === 'customer' && row.qboCreate?.connectionId === connection.connectionId ? { qbo: { remoteId, syncToken: remote.SyncToken, connectionId: connection.connectionId, confirmedAt: row.qboCreate.approvedAt, confirmedBy: row.qboCreate.approvedBy } } : {}) })
  event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'qbo.reconciled', summary: `Owner reconciled QuickBooks ${remoteId}; exact content verified without another post`, data: { remoteId, operationId: operation.id } })
  return outcome
}

/** A prior payment is linked by reading an existing record; migration grants no send authority. */
async function reconcilePaymentCompany(c: Context, key: string, row: Row, remoteId: string) {
  const connection = business(c.s).qbo, previous = row.qboSync
  if (row.kind !== 'payment') fail('QBO_RECONCILE', 'Choose a previously posted invoice payment; refund migration needs separate accounting review.')
  assertPriorCompanyResolved(c)
  if (!connection.linksConfirmedAt) fail('QBO_REVIEW', 'Confirm the current company links before reconciling a previous-company payment.')
  if (c.s.payments.some(other => other.id !== row.id && [other.qboSync, other.qboImported, ...(other.qboSyncHistory ?? [])].some(outcome => outcome?.connectionId === connection.connectionId && outcome.remoteId === remoteId))) fail('QBO_RECONCILE', 'This QuickBooks payment is already linked to another Glove payment.')
  const payload = payloadFor(c, 'payment', row)
  const response = await qboRequest(connection, key, `payment/${remoteId}`), remote = response.Payment
  if (String(remote?.Id) !== remoteId || (remote.CurrencyRef?.value ?? 'USD') !== 'USD' || !postedMatches(payload.body, remote)) fail('QBO_RECONCILE', 'This QuickBooks payment does not match the current customer, amount, reference and exact invoice allocations. No new post or balance change was made.')
  const contentFingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, kind: 'payment', id: row.id, body: payload.body }))
  const outcome = { phase: 'complete', connectionId: connection.connectionId, remoteId, contentFingerprint, reconciledAt: c.now, reconciledBy: c.actor.id, previousConnectionId: previous.connectionId, previousRemoteId: previous.remoteId, message: 'Owner verified the existing payment in this QuickBooks company; no new post was sent.' }
  bump(c.s, 'payments', row, { qboSyncHistory: priorOutcomes(row, connection.connectionId), qboSync: outcome })
  event(c, { jobId: row.jobId ?? null, subjectKind: 'payment', subjectId: row.id, kind: 'qbo.reconciled', summary: `Owner reconciled existing QuickBooks payment ${remoteId} in company ${connection.realmId}; previous company payment ${previous.remoteId} retained; no new post was sent`, data: { provider: 'QuickBooks', connectionId: connection.connectionId, remoteId, previousConnectionId: previous.connectionId, previousRemoteId: previous.remoteId } })
  return outcome
}
