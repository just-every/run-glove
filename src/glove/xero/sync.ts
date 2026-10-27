import { bump, business, event, expectVersion, fail, find, newId, oneOf, type Context, type Row } from '../model'
import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { xeroRead } from './client'
import { xeroCollection, xeroMatches, xeroPayload } from './payload'

export async function xeroSync(c: Context, type: string, p: any, db: D1Database, secret: { token: string; tenant: string }) {
  const kind = oneOf(p.kind, ['customer', 'service', 'invoice'] as const, 'kind'), records = xeroCollection(kind), row = find(c.s, records, p.id)
  expectVersion(row, p.version)
  const connection = business(c.s).xeroInspection
  const payload = xeroPayload(c, kind, row)
  const fingerprint = sha256(canonicalJson({ connectionId: connection.connectionId, kind, id: row.id, body: payload.body }))
  const audit = (name: string, data: any) => event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: `xero.${name}`, summary: `Xero ${name}; no customer charge`, data })
  if (type === 'xero.reconcile') {
    if (!['reserved', 'sending', 'unknown'].includes(row.xeroSync?.phase) || row.xeroSync.connectionId !== connection.connectionId) fail('XERO_RECONCILE', 'Choose an unresolved operation in this Xero tenant.')
    const op = await db.prepare('SELECT * FROM glove_xero_operations WHERE id=? AND record_id=?').bind(row.xeroSync.operationId, row.id).first<any>()
    if (!op || op.phase === 'sending' && Date.parse(c.now) - Date.parse(op.created_at) < 60_000 || fingerprint !== op.fingerprint) fail('XERO_RECONCILE', 'The reserved content changed; restore and review it before reconciliation.')
    const remote = (await xeroRead(secret, payload.resource)).find((r: any) => r[payload.identity] === p.remoteId)
    if (!remote || !xeroMatches(payload.body, remote) || kind === 'invoice' && (remote.Total !== payload.total || remote.TotalTax !== payload.tax)) fail('XERO_RECONCILE', 'The provider record must match the exact reserved fields, tax and total.')
    const outcome = { ...row.xeroSync, phase: 'complete', remoteId: p.remoteId, fingerprint, message: 'Owner verified the existing Xero record; no new post.' }
    c.sql.push({ sql: "UPDATE glove_xero_operations SET phase='complete',remote_id=? WHERE id=?", params: [p.remoteId, op.id] })
    bump(c.s, records, row, { xeroSync: outcome }); audit('reconciled', { operationId: op.id, remoteId: p.remoteId }); return outcome
  }
  if (['reserved', 'sending', 'unknown'].includes(row.xeroSync?.phase)) fail('XERO_UNCERTAIN', 'Reconcile the unresolved Xero operation before another send.')
  if (!connection.linksConfirmedAt) fail('XERO_REVIEW', 'Confirm the reviewed existing links before posting.')
  if (row.xeroSync?.phase === 'complete' && row.xeroSync.fingerprint === fingerprint) { audit('replayed', { remoteId: row.xeroSync.remoteId }); return row.xeroSync }
  if (kind === 'invoice' && (row.xero?.remoteId || row.xeroSync?.remoteId)) fail('XERO_CORRECTION', 'This invoice already has a Xero identity; inspect it instead of creating a duplicate.')
  if (kind === 'invoice' && (await xeroRead(secret, 'Invoices')).some(r => r.Type === 'ACCREC' && r.InvoiceNumber === row.number && r.Status !== 'DELETED')) fail('XERO_EXISTING', 'This invoice number already exists; verify and link it before posting.')
  const operationId = newId()
  c.sql.push({ sql: "INSERT INTO glove_xero_operations(id,connection_id,kind,record_id,fingerprint,phase,created_at) VALUES(?,?,?,?,?,'reserved',?)", params: [operationId, connection.connectionId, kind, row.id, fingerprint, c.now] })
  c.xeroOperation = { operationId, kind, id: row.id, fingerprint, ...payload }
  bump(c.s, records, row, { xeroSync: { operationId, connectionId: connection.connectionId, fingerprint, phase: 'reserved' } })
  audit('reserved', { operationId, fingerprint }); return { phase: 'reserved', operationId }
}
