import { requiredLinks, confirmLinks } from '../qbo/links'
import { allow } from '../access'
import { bump, business, event, expectVersion, fail, find, newId, oneOf, text, type Row } from '../model'
import { canonicalJson, sha256 } from '../../modules/import-kit/src/d1/index'
import { QboError, qboRequest } from '../qbo/client'
import { collection, mapping, payloadFor } from '../qbo/payload'
import { pullPayment } from '../qbo/pull'
import type { Handler } from './types'

const remoteId = (value: unknown) => /^\d{1,30}$/.test(String(value)) ? String(value) : fail('INPUT', 'Use a numeric QuickBooks record ID.', null, 400)
const audit = (c: Parameters<Handler>[0], kind: string, row: Row, summary: string, data: unknown) => event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'qbo.' + summary, summary: `QuickBooks ${summary}`, data })
const handle: Handler = async (c, type, p, db) => {
  if (!type.startsWith('qbo.')) return undefined
  allow(c.actor, type)
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch) fail('FORBIDDEN', 'Only the signed-in unscoped owner manages QuickBooks.', null, 403)
  const b = business(c.s)
  if (type === 'qbo.connect') {
    const previous = b.qbo ?? b.qboPrevious
    const connection = p.key === null ? null : { realmId: remoteId(p.realmId), mode: oneOf(p.mode, ['sandbox'] as const, 'mode'), connectionId: previous?.realmId === p.realmId ? previous.connectionId : newId(), configuredAt: c.now }
    c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='quickbooks'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('quickbooks',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'access token', { max: 4000 }), c.actor.id, c.now] })
    const row = bump(c.s, 'business', b, { qbo: connection ? { ...(previous?.realmId === connection.realmId ? previous : { requiredLinks: requiredLinks(c.s) }), ...connection } : null, qboPrevious: connection ? null : previous ?? null })
    audit(c, 'business', row, connection ? 'connected' : 'disconnected', { realmId: connection?.realmId ?? null, mode: connection?.mode ?? null })
    return row
  }
  if (!b.qbo) fail('QBO_SETUP', 'Connect a QuickBooks sandbox company first.')
  const key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks'").first<{ value: string }>())?.value ?? fail('QBO_SETUP', 'Reconnect QuickBooks after restoring this installation.')
  if (type === 'qbo.confirmLinks') return confirmLinks(c, p.confirm)
  if (type === 'qbo.configure') {
    const refs: Record<string, string> = { taxCodeRef: remoteId(p.taxCodeRef) }
    for (const [field, entity] of [['taxCodeRef', 'taxcode'], ['classRef', 'class'], ['departmentRef', 'department']]) {
      if (field !== 'taxCodeRef' && !p[field]) continue
      const id = remoteId(p[field]); const answer = await qboRequest(b.qbo, key, `${entity}/${id}`)
      const record = answer[Object.keys(answer).find(k => k.toLowerCase() === entity) ?? '']
      if (String(record?.Id) !== id || record.Active === false) fail('QBO_MAPPING', 'Choose an active existing QuickBooks record.')
      refs[field] = id
    }
    const row = bump(c.s, 'business', b, { qbo: { ...b.qbo, taxCodeRef: refs.taxCodeRef, classRef: refs.classRef ?? null, departmentRef: refs.departmentRef ?? null } })
    audit(c, 'business', row, 'configured', refs); return row
  }
  if (type === 'qbo.pull') return pullPayment(c, key, remoteId(p.remoteId))
  const kind = oneOf(p.kind, ['customer', 'site', 'service', 'invoice', 'payment'] as const, 'kind'), records = collection(kind), row = find(c.s, records, p.id)
  if (p.version !== undefined) expectVersion(row, p.version)
  if (type === 'qbo.map') {
    if (!['customer', 'site', 'service', 'invoice'].includes(kind)) fail('QBO_MAPPING', 'Map a customer, property, price-book item or existing invoice.')
    const id = remoteId(p.remoteId), entity = kind === 'service' ? 'item' : kind === 'invoice' ? 'invoice' : 'customer'
    const answer = await qboRequest(b.qbo, key, `${entity}/${id}`), remote = answer[kind === 'service' ? 'Item' : kind === 'invoice' ? 'Invoice' : 'Customer']
    if (String(remote?.Id) !== id || remote.Active === false || typeof remote.SyncToken !== 'string') fail('QBO_MAPPING', 'Choose an active existing QuickBooks record.')
    if (c.s[records].some(r => r.id !== row.id && r.qbo?.connectionId === b.qbo.connectionId && r.qbo.remoteId === id)) fail('QBO_MAPPING', 'This QuickBooks record is already linked.')
    if (kind === 'site') {
      const parent = mapping(c, find(c.s, 'customers', row.customerId))
      if (!remote.Job || remote.ParentRef?.value !== parent.remoteId || remote.BillWithParent !== true) fail('QBO_MAPPING', 'The property must be a sub-customer billed through its mapped parent.')
    } else if (kind === 'customer' && remote.Job) fail('QBO_MAPPING', 'Map the parent customer here and sub-customers on each property.')
    if (kind === 'invoice') {
      const customer = mapping(c, find(c.s, 'customers', row.customerId)), job = c.s.jobs.find(j => j.id === row.jobId), site = c.s.sites.find(x => x.id === job?.siteId), ref = site?.qbo ? mapping(c, site).remoteId : customer.remoteId
      const total = row.openingBalance?.amount ?? row.revisions.findLast((r: Row) => r.approval)?.totals.total
      if (remote.CustomerRef?.value !== ref || remote.DocNumber !== row.number || Number(remote.TotalAmt) !== Number(total)) fail('QBO_MAPPING', 'The existing invoice must match its customer, document number and total exactly.')
    }
    if (kind === 'service' && (!remote.IncomeAccountRef?.value || !['Service', 'NonInventory', 'Inventory'].includes(remote.Type))) fail('QBO_MAPPING', 'Choose an existing sales item with an income account.')
    bump(c.s, 'business', b, { qbo: { ...b.qbo, linksConfirmedAt: null } })
    const result = bump(c.s, records, row, { ...(kind === 'invoice' ? { qboSync: { phase: 'complete', remoteId: id, connectionId: b.qbo.connectionId, mappedAt: c.now } } : {}), qbo: { remoteId: id, syncToken: remote.SyncToken, connectionId: b.qbo.connectionId, ...(remote.IncomeAccountRef ? { incomeAccountRef: remote.IncomeAccountRef.value } : {}) } })
    audit(c, kind, result, 'mapped', { remoteId: id, connectionId: b.qbo.connectionId }); return result
  }
  if (type !== 'qbo.sync' || kind === 'site') fail('COMMAND', 'Unknown QuickBooks command.', null, 400)
  if (['unknown', 'reserved', 'sending'].includes(row.qboSync?.phase)) fail('QBO_UNCERTAIN', 'Reconcile the outstanding QuickBooks operation before sending this record again.')
  if (!b.qbo.linksConfirmedAt) fail('QBO_REVIEW', 'Confirm the verified existing-record links before posting to QuickBooks.')
  const payload = payloadFor(c, kind, row), { SyncToken: _token, ...content } = payload.body
  const fingerprint = sha256(canonicalJson({ connectionId: b.qbo.connectionId, kind, id: row.id, body: content }))
  if (row.qboSync?.phase === 'complete' && row.qboSync.fingerprint === fingerprint) { audit(c, kind, row, 'replayed', { remoteId: row.qboSync.remoteId, phase: 'complete' }); return row.qboSync }
  const existing = await db.prepare("SELECT * FROM glove_qbo_operations WHERE fingerprint=? AND phase <> 'rejected'").bind(fingerprint).first<any>()
  if (existing) { audit(c, kind, row, 'replayed', { operationId: existing.id, remoteId: existing.remote_id, phase: existing.phase }); return { phase: existing.phase, remoteId: existing.remote_id, message: existing.message } }
  if (kind === 'invoice' && row.qboSync?.remoteId) fail('QBO_CORRECTION', 'This invoice is already posted; corrections require reviewed QuickBooks reconciliation.')
  if (kind === 'invoice') {
    if (!/^[A-Za-z0-9-]+$/.test(payload.body.DocNumber)) fail('QBO_NUMBER', 'Use a document number containing letters, digits and hyphens.')
    const query = `SELECT * FROM Invoice WHERE DocNumber = '${payload.body.DocNumber}'`
    const existingInvoices = (await qboRequest(b.qbo, key, `query?query=${encodeURIComponent(query)}`)).QueryResponse?.Invoice ?? []
    if (existingInvoices.length) fail('QBO_EXISTING', 'An invoice with this number already exists in QuickBooks. Verify and link it before posting.')
  }
  const operationId = newId()
  c.sql.push({ sql: "INSERT INTO glove_qbo_operations(id,connection_id,kind,record_id,fingerprint,phase,created_at) VALUES(?,?,?,?,?,'reserved',?)", params: [operationId, b.qbo.connectionId, kind, row.id, fingerprint, c.now] })
  c.qboOperation = { operationId, kind, id: row.id, fingerprint, ...payload }
  bump(c.s, records, row, { qboSync: { phase: 'reserved', connectionId: b.qbo.connectionId, operationId } })
  audit(c, kind, row, 'reserved', { operationId, fingerprint }); return { phase: 'reserved', operationId }
}

export const quickbooks: Handler = async (...args) => {
  try { return await handle(...args) } catch (error) {
    if (error instanceof QboError) return fail('QBO_PROVIDER', error.message, { status: error.status }, 502)
    throw error
  }
}
