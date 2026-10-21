import { Buffer } from 'node:buffer'
// @ts-expect-error The pinned Base journal is a Worker-compatible JavaScript module.
import { redactionStatements, invalidateTransfersStatements } from '@runeditrun/rer/modules/portability/journal'
import { retireD1ImportCustody, type D1Sql } from '../modules/import-kit/src/d1/index'
import { authority } from './access'
import { importTargets } from './movein/kit'
import { collections, event, expectVersion, fail, newId, put, type Context, type State, type Row } from './model'
import { parseCsv } from './csv-format'
import type { Handler } from './commands/types'

/** DATA-001: close over every merged identity, then over dependent product records.
 * Shared business/price-book/operator records do not become customer records. */
export function privacyScope(s: State, customerId: string) {
  const customers = new Set([customerId])
  for (let changed = true; changed;) {
    changed = false
    for (const c of s.customers) if (c.mergedInto && (customers.has(c.id) || customers.has(c.mergedInto))) for (const id of [c.id, c.mergedInto]) if (!customers.has(id)) { customers.add(id); changed = true }
    for (const m of s.merges) if ([m.survivorId, ...m.mergedIds].some(id => customers.has(id))) for (const id of [m.survivorId, ...m.mergedIds]) if (!customers.has(id)) { customers.add(id); changed = true }
  }
  const ids = new Set(customers), selected = new Set<string>()
  const shared = new Set(['business', 'branches', 'branchAccess', 'services', 'technicians', 'roles', 'grants', 'forms', 'stock', 'rules', 'customFields', 'segments', 'manuals', 'crews', 'plans'])
  const links = ['customerId', 'siteId', 'jobId', 'visitId', 'quoteId', 'enquiryId', 'equipmentId', 'captureId', 'reportId', 'agreementId', 'subjectId', 'survivorId']
  for (let changed = true; changed;) {
    changed = false
    for (const kind of collections) if (!shared.has(kind)) for (const row of s[kind]) if (ids.has(row.id) || links.some(k => ids.has(row[k])) || row.invoices?.some((i: Row) => ids.has(i.invoiceId))) {
      selected.add(`${kind}:${row.id}`)
      if (!ids.has(row.id)) { ids.add(row.id); changed = true }
    }
  }
  const records = Object.fromEntries(collections.map(kind => [kind, s[kind].filter(r => selected.has(`${kind}:${r.id}`))])) as Record<string, Row[]>
  const personal = new Set<string>()
  const strings = (v: unknown): void => { if (typeof v === 'string' && v.length >= 4) personal.add(v); else if (Array.isArray(v)) v.forEach(strings); else if (v && typeof v === 'object') Object.values(v).forEach(strings) }
  for (const c of records.customers) for (const key of ['name', 'contact', 'contacts', 'email', 'apEmail', 'phone', 'billingAddress', 'billingContact', 'abn']) strings(c[key])
  for (const c of records.customers) strings(c.taxExemption?.certificateNumber)
  for (const site of records.sites) for (const key of ['address', 'accessNotes', 'contact', 'contactPhone', 'contactEmail']) strings(site[key])
  const matches = (value: unknown) => { const raw = JSON.stringify(value) ?? ''; return [...ids, ...personal].some(v => raw.includes(v)) }
  for (const kind of collections) if (!shared.has(kind) && !['customers','sites','jobs','invoices','exports','imports'].includes(kind)) for (const row of s[kind]) if (!selected.has(`${kind}:${row.id}`) && matches(row)) { selected.add(`${kind}:${row.id}`); ids.add(row.id); records[kind].push(row) }
  return { customers, ids, selected, records, personal, matches }
}

export function ownerPrivacy(c: Context) {
  if (c.actor.role !== 'owner' || c.actor.token) fail('FORBIDDEN', 'Only the signed-in owner handles customer privacy requests.', null, 403)
}

const pick = (r: Row, keys: string[]) => Object.fromEntries(keys.filter(k => r[k] !== undefined).map(k => [k, r[k]]))
// Retain numeric tax evidence and classifications, never exemption identifiers.
const totals = (t: any) => t ? { ...t, ...(t.discount ? { discount: { ...t.discount, reason: 'Retained discount' } } : {}), taxContext: t.taxContext ? { ...t.taxContext, exemption: null } : undefined } : t
const line = (l: Row) => ({ ...pick(l, ['quantity', 'unitPrice', 'unitCost', 'serviceId', 'tax', 'total', 'gst', 'discount']), description: 'Retained invoice line', customerDescription: '' })
const revision = (r: Row) => ({ ...pick(r, ['n', 'preparedAt', 'approval', 'export', 'corrects', 'issuedAt', 'dueAt', 'dueDate', 'issueDate']), lines: r.lines.map(line), totals: totals(r.totals), discount: r.discount ? { ...r.discount, reason: 'Retained discount' } : null })
const sql = (sql: string, ...params: unknown[]) => ({ sql, params })

/** Prepare domain writes; storage.commit publishes them with the import-custody
 * cleanup, role/session/version guards, receipt and restore checkpoint atomically. */
export const privacy: Handler = async (c, type, p, db) => {
  if (!['privacy.export', 'privacy.erase'].includes(type)) return undefined
  ownerPrivacy(c)
  const customer = c.s.customers.find(x => x.id === p.customerId) ?? fail('NOT_FOUND', 'Choose an existing customer.', null, 404)
  if (customer.erasedAt) fail('ERASED', 'This customer has already been erased.')
  expectVersion(customer, p.version)
  const scope = privacyScope(c.s, customer.id)
  const customerIds = [...scope.customers].sort(), receiptId = newId()
  const events = (await db.prepare('SELECT * FROM glove_events ORDER BY sequence').all<Row>()).results.filter(scope.matches)
  const files = (await db.prepare('SELECT * FROM glove_files').all<any>()).results.filter(f => scope.ids.has(f.capture_id))
  const certificates = (await db.prepare('SELECT * FROM glove_tax_certificates').all<any>()).results.filter(f => scope.customers.has(f.customer_id))
  const receipt = { id: receiptId, version: 1, createdAt: c.now, customerIds, action: type === 'privacy.export' ? 'export' : 'erase', outcome: 'complete', by: { id: c.actor.id, name: c.actor.name }, retained: type === 'privacy.erase' ? 'Anonymous invoices, job costs and tax totals; no customer details or original files.' : null }
  if (type === 'privacy.export') {
    const binary = (bytes: any) => Buffer.from(bytes).toString('base64')
    const originals = []
    for (const f of certificates) {
      const chunks = (await db.prepare('SELECT bytes FROM glove_tax_certificate_chunks WHERE file_id=? ORDER BY ordinal').bind(f.id).all<any>()).results
      originals.push({ ...f, bytes: binary(Buffer.concat(chunks.map(ch => Buffer.from(ch.bytes)))) })
    }
    // The owner already has the full business export. Related import custody is
    // included explicitly; shared source artifacts can contain other customers.
    const imported = (await db.prepare('SELECT * FROM ik_jobs').all<any>()).results.filter(scope.matches)
    const importOriginals = []
    for (const job of imported) {
      const rows = (await db.prepare('SELECT * FROM ik_originals WHERE job_id=?').bind(job.id).all<any>()).results
      const chunks = (await db.prepare('SELECT * FROM ik_d1_original_chunks WHERE job_id=? ORDER BY ordinal').bind(job.id).all<any>()).results
      importOriginals.push(...rows.map(r => ({ ...r, bytes: r.bytes ? binary(r.bytes) : null })), ...chunks.map(r => ({ ...r, bytes: binary(r.bytes) })))
    }
    c.reveal = { download: JSON.stringify({ format: 'glove-customer-v1', exportedAt: c.now, customerIds, records: scope.records, timeline: events, files: [...files.map(f => ({ ...f, bytes: binary(f.bytes) })), ...originals], importCustody: imported, importOriginals }) }
  } else {
    if (p.confirm !== 'ERASE') fail('CONSENT', 'Confirm ERASE to permanently erase this merged customer group.', null, 400)
    const keeps: Record<string, (r: Row) => Row> = {
      customers: r => ({ id: r.id, version: r.version + 1, name: 'Erased customer', erasedAt: c.now, branchId: r.branchId ?? null }),
      sites: r => ({ id: r.id, ...pick(r, ['id', 'customerId', 'branchId']), version: r.version + 1, address: 'Erased address', erasedAt: c.now }),
      jobs: r => ({ id: r.id, ...pick(r, ['id', 'number', 'customerId', 'siteId', 'branchId', 'createdAt', 'completedAt', 'status']), version: r.version + 1, title: 'Erased customer job', lines: r.lines.map(line), totals: totals(r.totals), erasedAt: c.now, checklist: [], forms: [] }),
      invoices: r => ({ id: r.id, ...pick(r, ['id', 'number', 'customerId', 'jobId', 'branchId', 'createdAt', 'status', 'issuedAt', 'dueAt', 'issuedDate', 'dueDate', 'firstApprovedAt']), version: r.version + 1, revisions: r.revisions.map(revision), erasedAt: c.now }),
      times: r => ({ id: r.id, ...pick(r, ['id', 'jobId', 'technicianId', 'kind', 'startAt', 'endAt']), version: r.version + 1 }),
      expenses: r => ({ id: r.id, ...pick(r, ['id', 'jobId', 'category', 'amount', 'billable', 'markupBasisPoints', 'tax', 'invoiceId', 'createdAt']), version: r.version + 1, vendor: 'Erased', description: '', receipt: null }),
      purchaseOrders: r => ({ id: r.id, ...pick(r, ['id', 'number', 'jobId', 'status', 'createdAt', 'locationId']), version: r.version + 1, supplier: 'Erased', lines: r.lines.map((l: Row) => ({ ...pick(l, ['id', 'serviceId', 'quantity', 'received', 'unit', 'unitCost']), description: 'Retained material' })) }),
    }
    for (const kind of collections) {
      if (kind === 'exports') continue
      c.s[kind] = c.s[kind].flatMap(r => scope.selected.has(`${kind}:${r.id}`) ? keeps[kind] ? [keeps[kind](r)] : [] : kind === 'imports' && scope.matches(r) ? [{ id: r.id, version: r.version + 1, status: 'privacy-withdrawn', system: r.system, createdAt: r.createdAt, label: 'Source withdrawn for customer privacy' }] : kind === 'templates' && scope.matches(r) ? [] : [r])
    }
    const invoiceNumbers = new Set(scope.records.invoices.map(i => i.number))
    for (const exported of c.s.exports) if (exported.csv) {
      const rows = parseCsv(exported.csv), head = rows[0]
      const number = head.indexOf('*InvoiceNumber')
      const sensitive = ['*ContactName', 'EmailAddress', 'POAddressLine1', 'Reference', '*Description']
      let changed = false
      for (const row of rows.slice(1)) if (invoiceNumbers.has(row[number])) { changed = true; for (const key of sensitive) { const col = head.indexOf(key); if (col >= 0) row[col] = key === '*ContactName' ? 'Erased customer' : key === '*Description' ? 'Retained invoice line' : '' } }
      if (changed) { exported.csv = rows.map(row => row.map(cell => /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell).join(',')).join('\r\n'); exported.version++ }
    }
    c.sql.push(sql('INSERT INTO glove_privacy_guard(id) VALUES(1)'))
    for (const e of events) c.sql.push(sql("UPDATE glove_events SET summary='Customer personal data erased',data='{}',actor_name=CASE WHEN actor_role IN ('customer','quote-link') THEN 'Customer' ELSE actor_name END WHERE id=?", e.id))
    for (const row of (await db.prepare('SELECT id,result FROM glove_commands').all<any>()).results) if (scope.matches(row.result)) c.sql.push(sql('UPDATE glove_commands SET result=? WHERE id=?', JSON.stringify({ ok: false, error: { code: 'ERASED', message: 'This earlier outcome was erased for customer privacy.' } }), row.id))
    for (const f of files) c.sql.push(sql('DELETE FROM glove_files WHERE id=?', f.id))
    for (const f of certificates) c.sql.push(sql('DELETE FROM glove_tax_certificate_chunks WHERE file_id=?', f.id), sql('DELETE FROM glove_tax_certificates WHERE id=?', f.id))
    for (const table of ['glove_quote_secrets', 'glove_booking_secrets', 'glove_report_secrets']) c.sql.push(sql(`DELETE FROM ${table} WHERE link_id IN (SELECT value FROM json_each(?))`, JSON.stringify([...scope.ids])))
    for (const id of scope.records.jobs.map(j => j.id)) c.sql.push(sql('DELETE FROM glove_companycam_uploads WHERE job_id=?', id))
    const recipients = new Set(scope.records.messages.map(m => m.to).filter(Boolean))
    for (const to of recipients) c.sql.push(sql('DELETE FROM rer_mail_event_states WHERE recipient=?', to))
    for (const row of (await db.prepare('SELECT provider,tenant_id,event_namespace,event_id,event_json FROM rer_mail_event_receipts').all<any>()).results) if (scope.matches(row.event_json)) c.sql.push(sql('DELETE FROM rer_mail_event_receipts WHERE provider=? AND tenant_id=? AND event_namespace=? AND event_id=?', row.provider, row.tenant_id, row.event_namespace, row.event_id))
    c.sql.push(sql('DELETE FROM glove_privacy_guard'))
    const prepared = [...await redactionStatements(db), ...await invalidateTransfersStatements(db)]
    c.privacy = { customerId: customer.id, ids: [...scope.ids], values: [...scope.personal, ...(await db.prepare('SELECT operation_key,plan_json FROM ik_jobs').all<any>()).results.filter(r => scope.matches(r.plan_json)).map(r => r.operation_key)], sourceIds: Object.values(scope.records).flat().map(r => r.source?.id).filter(Boolean), checkpoint: prepared.map((p: any) => ({ sql: p.statement, params: p.params })) }
  }
  put(c.s, 'privacyRequests', receipt)
  event(c, { jobId: null, subjectKind: 'privacyRequest', subjectId: receiptId, kind: `privacy.${receipt.action}`, summary: `Customer privacy ${receipt.action} completed for ${customerIds.length} merged identity/identities`, data: { customerIds, outcome: receipt.outcome } })
  return receipt
}

export async function commitPrivacy(db: D1Database, c: Context, statements: D1PreparedStatement[]) {
  const p = c.privacy!, ids = new Set([...p.ids, ...p.sourceIds]), values = p.values
  const matches = (v: unknown): boolean => typeof v === 'string' ? ids.has(v) || values.some(s => v.includes(s)) : Array.isArray(v) ? v.some(matches) : !!v && typeof v === 'object' && Object.values(v).some(matches)
  const a = authority(c.actor)
  await retireD1ImportCustody({ target: { kind: 'customers', id: p.customerId }, values, related: { source: r => matches(r.payload) || ids.has(r.sourceId), original: bytes => values.some(v => Buffer.from(bytes).includes(Buffer.from(v))) } }, statements.map((p: any) => ({ sql: p.statement, params: p.params })), {
    destination: 'glove', namespace: 'glove-privacy', mappingVersion: '1', operationKey: c.commandId,
    storage: { database: db, targets: importTargets }, authorization: { principalId: c.actor.id, predicate: () => ({ sql: a.sql, params: a.params }) }, originalErasurePolicy: 'withdraw-affected-artifacts',
  }, p.checkpoint)
}
