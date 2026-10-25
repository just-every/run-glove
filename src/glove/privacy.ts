import { withdrawSignedQuote } from './privacy-signed-quotes'
import { privacyScope } from './privacy-scope'
export { privacyScope } from './privacy-scope'
import { erasurePreview } from './privacy-preview'
import { customerImportData, privacyTargets } from './privacy-imports'
import { cents, dollars } from './money'
import { formatCsv } from './csv-format'
import { Buffer } from 'node:buffer'
// @ts-expect-error The pinned Base journal is a Worker-compatible JavaScript module.
import { redactionStatements, invalidateTransfersStatements } from '@runeditrun/rer/modules/portability/journal'
import { retireD1ImportCustody, canonicalJson } from '../modules/import-kit/src/d1/index'
import { authority } from './access'
import { collections, event, expectVersion, fail, newId, put, type Context, type Row } from './model'
import { parseCsv } from './csv-format'
import type { Handler } from './commands/types'

export function ownerPrivacy(c: Context) {
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch) fail('FORBIDDEN', 'Only a signed-in owner without branch limits handles whole-customer privacy requests.', null, 403)
}

const pick = (r: Row, keys: string[]) => Object.fromEntries(keys.filter(k => r[k] !== undefined).map(k => [k, r[k]]))
// Retain numeric tax evidence and classifications, never exemption identifiers.
const totals = (t: any) => t ? { ...t, ...(t.discount ? { discount: { ...t.discount, reason: 'Retained discount' } } : {}), taxContext: t.taxContext ? { ...t.taxContext, exemption: null } : undefined } : t
const line = (l: Row) => ({ ...pick(l, ['quantity', 'unitPrice', 'unitCost', 'serviceId', 'tax', 'total', 'gst', 'discount']), description: 'Retained invoice line', customerDescription: '' })
const revision = (r: Row) => ({ ...pick(r, ['n', 'preparedAt', 'preparedBy', 'approval', 'export', 'corrects', 'issuedAt', 'dueAt', 'dueDate', 'issueDate']), lines: r.lines.map(line), totals: totals(r.totals), discount: r.discount ? { ...r.discount, reason: 'Retained discount' } : null })
const sql = (sql: string, ...params: unknown[]) => ({ sql, params })

/** Prepare domain writes; storage.commit publishes them with the import-custody
 * cleanup, role/session/version guards, receipt and restore checkpoint atomically. */
export const privacy: Handler = async (c, type, p, db) => {
  if (!['privacy.preview', 'privacy.export', 'privacy.erase'].includes(type)) return undefined
  ownerPrivacy(c)
  const customer = c.s.customers.find(x => x.id === p.customerId) ?? fail('NOT_FOUND', 'Choose an existing customer.', null, 404)
  if (customer.erasedAt) fail('ERASED', 'This customer has already been erased.')
  expectVersion(customer, p.version)
  const scope = privacyScope(c.s, customer.id)
  const importedPeers = new Set((await db.prepare('SELECT id FROM glove_records WHERE revision IS NOT NULL').all<{id: string}>()).results.map(r => r.id))
  const preview = await erasurePreview(db, c.s, scope, type === 'privacy.preview' ? c.s.version + 1 : c.s.version)
  if (type === 'privacy.preview') {
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'privacy.preview', summary: 'Customer erasure preview prepared', data: { customerIds: [...scope.customers] } })
    const { fields: _fields, ...visible } = preview
    return visible
  }
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
    const signedCopies = []
    for (const q of scope.records.quotes) if (q.acceptance?.signing?.signedCopy) {
      const chunks = (await db.prepare('SELECT bytes FROM glove_quote_signed_chunks WHERE quote_id=? AND revision=? ORDER BY ordinal').bind(q.id, q.acceptance.revision).all<any>()).results
      signedCopies.push({ id: `${q.id}:signed`, quoteId: q.id, revision: q.acceptance.revision, mediaType: 'text/html', ...q.acceptance.signing.signedCopy, bytes: binary(Buffer.concat(chunks.map(ch => Buffer.from(ch.bytes)))) })
    }
    const imported = await customerImportData(db, scope)
    const records = structuredClone(scope.records)
    records.imports = records.imports.map(r => ({ id: r.id, version: r.version, system: r.system, status: r.status }))
    records.exports = records.exports.map(r => {
      const invoices = r.invoices.filter((i: Row) => scope.ids.has(i.invoiceId)), numbers = new Set(invoices.map((i: Row) => i.invoiceNumber))
      const csv = parseCsv(r.csv), column = csv[0].indexOf('*InvoiceNumber')
      return { ...r, invoices, total: dollars(invoices.reduce((n: number, i: Row) => n + cents(i.total, 'total'), 0)), csv: formatCsv([csv[0], ...csv.slice(1).filter(row => numbers.has(row[column]))]) }
    })
    if (imported.omissions.length) receipt.outcome = 'partial'
    c.reveal = { download: JSON.stringify({ format: 'glove-customer-v1', exportedAt: c.now, customerIds, records, timeline: events, files: [...files.map(f => ({ ...f, bytes: binary(f.bytes) })), ...originals, ...signedCopies], importCustody: imported.custody, importOriginals: imported.originals, omissions: imported.omissions }) }
  } else {
    if (p.confirm !== 'ERASE') fail('CONSENT', 'Confirm ERASE to permanently erase this merged customer group.', null, 400)
    if (p.fingerprint !== preview.fingerprint) fail('STALE_PREVIEW', 'Prepare and review a current erasure preview before confirming.', null, 409)
    const keeps: Record<string, (r: Row) => Row> = {
      customers: r => ({ id: r.id, version: r.version + 1, name: 'Erased customer', erasedAt: c.now, branchId: r.branchId ?? null }),
      sites: r => ({ id: r.id, ...pick(r, ['id', 'customerId', 'branchId']), version: r.version + 1, address: 'Erased address', erasedAt: c.now }),
      jobs: r => ({ id: r.id, ...pick(r, ['id', 'number', 'customerId', 'siteId', 'branchId', 'createdAt', 'completedAt', 'status']), version: r.version + 1, title: 'Erased customer job', lines: r.lines.map(line), totals: totals(r.totals), erasedAt: c.now, checklist: [], forms: [] }),
      invoices: r => ({ id: r.id, ...pick(r, ['id', 'number', 'customerId', 'jobId', 'branchId', 'createdAt', 'status', 'issuedAt', 'dueAt', 'issuedDate', 'dueDate', 'firstApprovedAt', 'dates', 'approvalAt', 'recurring']), version: r.version + 1, revisions: r.revisions.map(revision), erasedAt: c.now }),
      payments: r => ({ id: r.id, ...pick(r, ['invoiceId', 'invoiceNumber', 'jobId', 'customerId', 'branchId', 'createdAt', 'currency', 'amount', 'tip', 'technicianIds', 'fee', 'status', 'confirmedAt', 'taxBreakdown', 'taxTotalAmount', 'kind', 'method', 'mode']), effects: (r.effects ?? []).map((e: Row) => pick(e, ['at', 'amountCents', 'tipCents', 'invoiceId'])), version: r.version + 1, erasedAt: c.now }),
      times: r => ({ id: r.id, ...pick(r, ['id', 'jobId', 'technicianId', 'kind', 'startAt', 'endAt']), version: r.version + 1 }),
      expenses: r => ({ id: r.id, ...pick(r, ['id', 'jobId', 'category', 'amount', 'billable', 'markupBasisPoints', 'tax', 'invoiceId', 'createdAt']), version: r.version + 1, vendor: 'Erased', description: '', receipt: null }),
      purchaseOrders: r => ({ id: r.id, ...pick(r, ['id', 'number', 'jobId', 'status', 'createdAt', 'locationId']), version: r.version + 1, supplier: 'Erased', lines: r.lines.map((l: Row) => ({ ...pick(l, ['id', 'serviceId', 'quantity', 'received', 'unit', 'unitCost']), description: 'Retained material' })) }),
    }
    for (const kind of collections) {
      if (kind === 'exports' || kind === 'privacyRequests') continue
      c.s[kind] = c.s[kind].flatMap(r => {
        if (kind === 'imports' && (scope.matches(r) || preview.sharedOriginals.some(a => a.jobId === r.jobId))) {
          const retired = preview.retiredBatches.some(b => b.jobId === r.jobId)
          return [{ id: r.id, jobId: r.jobId, version: r.version + 1, status: retired ? 'privacy-withdrawn' : r.status, system: r.system, createdAt: r.createdAt, label: retired ? 'Source and Undo withdrawn for customer privacy' : 'Shared original withdrawn; peer Undo remains available', privacyOmissions: preview.sharedOriginals.filter(a => a.jobId === r.jobId).map(a => ({ name: scope.redact(a.name), sha256: a.sha256, peerIds: a.peerIds })) }]
        }
        const sharedSignedCopy = kind === 'quotes' && preview.sharedSignedCopies.find(q => q.quoteId === r.id)
        if (sharedSignedCopy) return [withdrawSignedQuote(r, scope, sharedSignedCopy, c.now)]
        if (kind === 'payouts' && r.items?.some((i: Row) => scope.ids.has(i.paymentId))) return [{ ...scope.redact(r), id: r.id, version: r.version + 1, items: r.items.map((i: Row) => scope.ids.has(i.paymentId) ? { ...scope.redact(i), providerReference: null } : i) }]
        if (kind === 'routes' && scope.matches(r)) return [{ ...scope.redact(r), id: r.id, version: r.version + 1, ...(['queued', 'running', 'ready'].includes(r.status) ? { status: 'discarded', reason: 'Customer personal data erased; prepare a new route.' } : {}) }]
        if (scope.selected.has(`${kind}:${r.id}`)) return keeps[kind] ? [keeps[kind](r)] : []
        return !importedPeers.has(r.id) && scope.matches(r) ? [{ ...scope.redact(r), id: r.id, version: r.version + 1 }] : [r]
      })
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
    for (const visit of scope.records.visits) {
      const technicians = new Set([visit.technicianId, ...(visit.assignments ?? []).map((a: Row) => a.technicianId)])
      for (const technicianId of technicians) {
        const operatorId = c.s.technicians.find(t => t.id === technicianId)?.operatorId
        if (operatorId) c.sql.push(sql('INSERT OR IGNORE INTO glove_privacy_client_fences(operator_id,visit_id,job_id) VALUES(?,?,?)', operatorId, visit.id, visit.jobId))
      }
    }
    c.sql.push(sql('INSERT INTO glove_privacy_guard(id) VALUES(1)'))
    const anonymousId = (value: string) => [...scope.personal].some(p => value.includes(p)) ? `privacy-${newId()}` : value
    for (const e of events) c.sql.push(sql("UPDATE glove_events SET id=?,command_id=?,summary='Customer personal data erased',data='{}',actor_name=CASE WHEN actor_role IN ('customer','quote-link') THEN 'Customer' ELSE actor_name END WHERE id=?", anonymousId(e.id), anonymousId(e.command_id), e.id))
    for (const row of (await db.prepare('SELECT id,result FROM glove_commands').all<any>()).results) if (scope.matches(row.result)) c.sql.push(sql('UPDATE glove_commands SET result=? WHERE id=?', JSON.stringify({ ok: false, error: { code: 'ERASED', message: 'This earlier outcome was erased for customer privacy.' } }), row.id))
    c.sql.push(sql('DELETE FROM glove_quote_signed_chunks WHERE quote_id IN (SELECT value FROM json_each(?))', JSON.stringify([...scope.records.quotes.map(q => q.id), ...preview.sharedSignedCopies.map(q => q.quoteId)])))
    for (const f of files) c.sql.push(sql('DELETE FROM glove_files WHERE id=?', f.id))
    for (const f of certificates) c.sql.push(sql('DELETE FROM glove_tax_certificate_chunks WHERE file_id=?', f.id), sql('DELETE FROM glove_tax_certificates WHERE id=?', f.id))
    for (const id of scope.ids) c.sql.push(sql('DELETE FROM glove_qbo_operations WHERE record_id=?', id))
    for (const payment of scope.records.payments) c.sql.push(sql('DELETE FROM glove_payment_attempts WHERE payment_id=?', payment.id))
    c.sql.push(sql('DELETE FROM glove_status_photo_links WHERE visit_id IN (SELECT value FROM json_each(?))', JSON.stringify(scope.records.visits.map(v => v.id))))
    for (const table of ['glove_sms_attempts', 'glove_sms_receipts']) c.sql.push(sql(`DELETE FROM ${table} WHERE message_id IN (SELECT value FROM json_each(?))`, JSON.stringify([...scope.ids])))
    c.sql.push(sql('DELETE FROM glove_email_stop_secrets WHERE customer_id IN (SELECT value FROM json_each(?))', JSON.stringify([...scope.ids])))
    c.sql.push(sql('DELETE FROM glove_visit_reply_secrets WHERE visit_id IN (SELECT value FROM json_each(?))', JSON.stringify([...scope.ids])))
    for (const table of ['glove_quote_secrets', 'glove_booking_secrets', 'glove_report_secrets']) c.sql.push(sql(`DELETE FROM ${table} WHERE link_id IN (SELECT value FROM json_each(?))`, JSON.stringify([...scope.ids])))
    for (const id of scope.records.jobs.map(j => j.id)) c.sql.push(sql('DELETE FROM glove_companycam_uploads WHERE job_id=?', id))
    const recipients = new Set(scope.records.messages.map(m => m.to).filter(Boolean))
    for (const to of recipients) c.sql.push(sql('DELETE FROM rer_mail_event_states WHERE recipient=?', to))
    for (const row of (await db.prepare('SELECT provider,tenant_id,event_namespace,event_id,event_json FROM rer_mail_event_receipts').all<any>()).results) if (scope.matches(row.event_json)) c.sql.push(sql('DELETE FROM rer_mail_event_receipts WHERE provider=? AND tenant_id=? AND event_namespace=? AND event_id=?', row.provider, row.tenant_id, row.event_namespace, row.event_id))
    c.sql.push(sql('DELETE FROM glove_privacy_guard'))
    const prepared = [...await redactionStatements(db), ...await invalidateTransfersStatements(db)]
    c.privacy = { customerId: customer.id, ids: [...scope.ids], values: [...scope.personal, ...preview.retiredBatches.map(r => r.operationKey)], fields: preview.fields, sourceIds: Object.values(scope.records).flat().flatMap(r => { const source = r.importSource ?? r.source; return source?.system && source?.kind && source?.id ? [canonicalJson([source.system.toLowerCase(), source.kind, String(source.id)])] : [] }), checkpoint: prepared.map((p: any) => ({ sql: p.statement, params: p.params })) }
  }
  put(c.s, 'privacyRequests', receipt)
  event(c, { jobId: null, subjectKind: 'privacyRequest', subjectId: receiptId, kind: `privacy.${receipt.action}`, summary: `Customer privacy ${receipt.action} completed for ${customerIds.length} merged identity/identities`, data: { customerIds, outcome: receipt.outcome } })
  return receipt
}

export async function commitPrivacy(db: D1Database, c: Context, statements: D1PreparedStatement[]) {
  const p = c.privacy!, values = p.values
  const a = authority(c.actor)
  await retireD1ImportCustody({ target: { kind: 'customers', id: p.customerId }, values, related: { source: r => p.sourceIds.includes(canonicalJson([r.namespace, r.kind, r.sourceId])), fields: p.fields, original: bytes => values.some(v => Buffer.from(bytes).includes(Buffer.from(v))) } }, statements.map((p: any) => ({ sql: p.statement, params: p.params })), {
    destination: 'glove', namespace: 'glove-privacy', mappingVersion: '1', operationKey: c.commandId,
    storage: { database: db, targets: privacyTargets(p.ids) }, authorization: { principalId: c.actor.id, predicate: () => ({ sql: a.sql, params: a.params }) }, originalErasurePolicy: 'withdraw-affected-artifacts',
  }, p.checkpoint)
}
