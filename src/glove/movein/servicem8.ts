import { canonicalJson, sha256, type SourceBundle, type SourceRecord, type ImportMapping, type MappingResult } from '../../modules/import-kit/src/d1/index'
import { Problem, fail } from '../model'
import { cents, dollars, lines, totals } from '../money'
import { calendarDate } from '../receivables'
import { assetMapping } from './servicem8-assets'
import { instant, localParts } from '../time'

// The ServiceM8 move-in kit. Input is the JSON its REST API returns for each
// object list (company.json, companycontact.json, staff.json, job.json,
// jobactivity.json, jobmaterial.json, attachment.json), saved by the owner,
// plus any attachment files they downloaded (attachments/<uuid>, base64).
// Field names follow developer.servicem8.com. Every source object is
// accounted for: mapped, merged into another record, or reported unmapped;
// every ServiceM8 UUID stays on the Glove record it became.

export const MAPPING_VERSION = 'servicem8-v1-1'
/** The journal's name for Glove jobs (movein/kit.ts). */
export const JOB_TARGET = 'workorders'
export const NAMESPACE = 'servicem8'
const kinds = ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'jobpayment', 'attachment', 'asset', 'assettype', 'equipment-map'] as const
type Kind = (typeof kinds)[number]

const used: Record<Kind, string[]> = {
  company: ['uuid', 'active', 'edit_date', 'name', 'abn_number', 'address', 'billing_address', 'is_individual'],
  companycontact: ['uuid', 'active', 'edit_date', 'company_uuid', 'first', 'last', 'email', 'phone', 'mobile', 'is_primary_contact', 'type'],
  staff: ['uuid', 'active', 'edit_date', 'first', 'last', 'email', 'mobile'],
  job: ['uuid', 'active', 'edit_date', 'company_uuid', 'status', 'generated_job_id', 'job_address', 'job_description', 'work_done_description', 'purchase_order_number', 'date', 'quote_date', 'work_order_date', 'completion_date', 'invoice_sent', 'invoice_date', 'total_invoice_amount', 'payment_received'],
  jobactivity: ['uuid', 'active', 'edit_date', 'job_uuid', 'staff_uuid', 'start_date', 'end_date', 'activity_was_scheduled', 'activity_was_recorded'],
  jobmaterial: ['uuid', 'active', 'edit_date', 'job_uuid', 'name', 'quantity', 'price', 'sort_order'],
  jobpayment: ['uuid', 'active', 'edit_date', 'job_uuid', 'amount'],
  asset: [],
  assettype: [],
  'equipment-map': [],
  attachment: ['uuid', 'active', 'edit_date', 'related_object', 'related_object_uuid', 'attachment_name', 'file_type', 'created_by_staff_uuid', 'timestamp'],
}

export type MoveInFile = { name: string; text?: string; base64?: string }

const encoder = new TextEncoder()
const toBase64 = (bytes: Uint8Array) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s) }

/** Exact received bytes become artifacts; each object in a list file becomes a source record. */
export function readBundle(files: unknown): SourceBundle {
  if (!Array.isArray(files) || !files.length || files.length > 200) return fail('IMPORT_FILES', 'Add between 1 and 200 export files.', null, 400)
  const bundle: SourceBundle = { records: [], artifacts: [], diagnostics: [] }
  let total = 0
  const names = new Set<string>()
  for (const file of files as MoveInFile[]) {
    const name = typeof file?.name === 'string' ? file.name : ''
    if (names.has(name)) fail('IMPORT_FILES', `${name} was added twice.`, null, 400)
    names.add(name)
    const attachment = /^attachments\/[0-9a-f-]{36}$/.exec(name)
    let bytes: Uint8Array
    if (attachment && typeof file.base64 === 'string') {
      try { bytes = Uint8Array.from(atob(file.base64), ch => ch.charCodeAt(0)) } catch { return fail('IMPORT_FILES', `${name} is not base64.`, null, 400) }
    } else if (kinds.some(k => name === `${k}.json`) && typeof file.text === 'string') bytes = encoder.encode(file.text)
    else return fail('IMPORT_FILES', `${name || 'A file'} is not a ServiceM8 list (${kinds.map(k => k + '.json').join(', ')}) or attachments/<uuid>.`, null, 400)
    total += bytes.length
    if (total > 1_400_000) fail('IMPORT_SIZE', 'This move-in is over 1.4 MB. Split it into batches (for example customers and staff first, then jobs by year).', null, 400)
    const artifact = { name, sha256: sha256(bytes), size: bytes.length, original: { status: 'available' as const, base64: toBase64(bytes) } }
    bundle.artifacts.push(artifact)
    if (attachment) continue
    let parsed: unknown
    try { parsed = JSON.parse(file.text!) } catch { return fail('IMPORT_PARSE', `${name} is not valid JSON.`, null, 400) }
    if (!Array.isArray(parsed)) fail('IMPORT_PARSE', `${name} must be the JSON array ServiceM8 returns for that list.`, null, 400)
    const kind = name.slice(0, -5) as Kind
    ;(parsed as any[]).forEach((object, index) => {
      if (!object || typeof object !== 'object' || typeof object.uuid !== 'string') fail('IMPORT_PARSE', `${name} item ${index + 1} has no uuid.`, null, 400)
      bundle.records.push({ namespace: NAMESPACE, kind, sourceId: object.uuid, payload: object, payloadHash: sha256(canonicalJson(object)), artifactHash: artifact.sha256, location: { artifact: name, row: index + 1 } })
    })
  }
  return bundle
}

const source = (kind: Kind, uuid: string) => ({ system: 'ServiceM8', kind, id: uuid })
const importer = { id: 'import', name: 'ServiceM8 move-in', role: 'import' }
const str = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const blankDate = (v: unknown) => !str(v) || str(v).startsWith('0000-00-00')
export const siteId = (companyUuid: string, address: string) => 'sm8-site-' + sha256(canonicalJson([companyUuid, address.toLowerCase().replace(/\s+/g, ' ')])).slice(0, 24)
const id = (uuid: string) => 'sm8-' + uuid

/**
 * Deterministic over the whole bundle and free of batch details, so preview and
 * commit plan identically and an unchanged re-import maps to the same records
 * (the kit then writes nothing again; changed source content is refused).
 */
export function mapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }): ImportMapping {
  const by = (kind: Kind) => bundle.records.filter(r => r.kind === kind)
  const companies = new Map(by('company').map(r => [r.sourceId, r.payload as any]))
  const staff = new Map(by('staff').map(r => [r.sourceId, r.payload as any]))
  const jobs = new Map(by('job').map(r => [r.sourceId, r.payload as any]))
  const jobRecords = new Map(by('job').map(r => [r.sourceId, r]))
  const payments = by('jobpayment').map(r => r.payload as any)
  const contacts = by('companycontact').map(r => r.payload as any)
  const materials = by('jobmaterial').map(r => r.payload as any)
  const files = new Map(bundle.artifacts.filter(a => a.name.startsWith('attachments/')).map(a => [a.name.slice(12), a]))
  const isJob = (j: any) => ['Work Order', 'Completed'].includes(j?.status)
  // A site is written by the first job (in export order) at that company and address.
  const siteOwner = new Map<string, string>()
  for (const r of by('job')) { const j = r.payload as any; if (str(j.job_address) && companies.has(j.company_uuid)) { const key = siteId(j.company_uuid, str(j.job_address)); if (!siteOwner.has(key)) siteOwner.set(key, r.sourceId) } }
  const local = (v: unknown, name: string) => { const [date, time] = str(v).split(' '); const at = instant(date, (time ?? '').slice(0, 5), batch.timezone, name); return { at, ...localParts(at, batch.timezone) } }
  const unmapped = (record: SourceRecord) => Object.entries(record.payload as Record<string, unknown>).filter(([k, v]) => !used[record.kind as Kind].includes(k) && v !== '' && v !== null && v !== '0' && v !== 0).map(([field]) => ({ field, reason: 'not used by Glove' }))

  const equipment = assetMapping(bundle, jobId => rejected.has(jobId))
  function map(record: SourceRecord): MappingResult {
    if (['asset', 'assettype', 'equipment-map'].includes(record.kind)) return equipment(record)
    const o = record.payload as any, extra = unmapped(record), meta = source(record.kind as Kind, o.uuid), edited = blankDate(o.edit_date) ? null : str(o.edit_date)
    switch (record.kind as Exclude<Kind, 'asset' | 'assettype' | 'equipment-map'>) {
      case 'staff':
        return { effects: [{ targetKind: 'technicians', targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, name: `${str(o.first)} ${str(o.last)}`.trim() || 'ServiceM8 staff', operatorId: null, phone: str(o.mobile), email: str(o.email), active: String(o.active) !== '0', source: meta } }], unmapped: extra }
      case 'company': {
        const people = contacts.filter(c => c.company_uuid === o.uuid && String(c.active) !== '0')
        const primary = people.find(c => String(c.is_primary_contact) === '1') ?? people[0]
        return { effects: [{ targetKind: 'customers', targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, name: str(o.name) || 'Unnamed ServiceM8 client', abn: str(o.abn_number), email: str(primary?.email), phone: str(primary?.mobile) || str(primary?.phone), contact: primary ? `${str(primary.first)} ${str(primary.last)}`.trim() : '', contacts: people.map(c => ({ name: `${str(c.first)} ${str(c.last)}`.trim(), email: str(c.email), phone: str(c.mobile) || str(c.phone), type: str(c.type), sourceId: c.uuid })), billingAddress: str(o.billing_address) || str(o.address), archived: String(o.active) === '0', source: meta } }], unmapped: extra }
      }
      case 'companycontact':
        return companies.has(o.company_uuid) ? { effects: [], unmapped: [{ reason: `merged into customer ${id(o.company_uuid)}` }, ...extra] } : { effects: [], rejection: `Contact's client ${o.company_uuid} is not in company.json.` }
      case 'jobmaterial':
        return jobs.has(o.job_uuid) ? { effects: [], unmapped: [{ reason: `merged into the price lines of ${id(o.job_uuid)}` }, ...extra] } : { effects: [], rejection: `Material's job ${o.job_uuid} is not in job.json.` }
      case 'job': {
        if (!companies.has(o.company_uuid)) return { effects: [], rejection: `Job's client ${o.company_uuid} is not in company.json.` }
        const address = str(o.job_address)
        if (!address) return { effects: [], rejection: 'Job has no job_address, so it has no site.' }
        const site = siteId(o.company_uuid, address), effects: MappingResult['effects'] = []
        if (siteOwner.get(site) === o.uuid) effects.push({ targetKind: 'sites', targetId: site, value: { id: site, version: 1, customerId: id(o.company_uuid), address, accessNotes: '', source: { ...meta, kind: 'job_address' } } })
        let priced, importedInvoice
        try {
          const rows = materials.filter(m => m.job_uuid === o.uuid && String(m.active) !== '0').sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          priced = rows.length ? lines(rows.map(m => ({ description: str(m.name) || 'Material', quantity: String(Number(m.quantity)), unitPrice: (Math.round(Number(m.price) * 100) / 100).toFixed(2), tax: 'GST' }))) : []
          if (o.status === 'Completed' && String(o.invoice_sent) === '1' && o.total_invoice_amount !== undefined) {
            if (!bundle.artifacts.some(a => a.name === 'jobpayment.json')) fail('IMPORT_BALANCE', 'Include the complete jobpayment.json list, even when empty, to review the invoice balance.')
            const total = cents(str(o.total_invoice_amount), 'source invoice total'), calculated = totals(priced)
            if (cents(calculated.total, 'priced total') !== total) fail('IMPORT_BALANCE', 'The source invoice total does not match its priced lines and tax; reconcile the export before importing.')
            const paid = payments.filter(p => p.job_uuid === o.uuid && String(p.active) !== '0').reduce((n, p) => n + cents(str(p.amount), 'source payment amount'), 0)
            if (!Number.isSafeInteger(paid) || paid > total) fail('IMPORT_BALANCE', 'Source payments exceed the invoice total; reconcile the export before importing.')
            if (!['0', '1'].includes(String(o.payment_received)) || (String(o.payment_received) === '1') !== (paid === total)) fail('IMPORT_BALANCE', 'Source payment history disagrees with payment_received; reconcile the export before importing.')
            const issuedOn = calendarDate(str(o.invoice_date).slice(0, 10)), snapshot = calendarDate(batch.balanceAsOf)
            if (issuedOn > snapshot) fail('IMPORT_BALANCE', 'The invoice is later than the balance snapshot.')
            importedInvoice = { id: id(o.uuid) + '-invoice', version: 1, importedInvoiceNumber: str(o.generated_job_id), number: `SM8-I-${str(o.generated_job_id) || o.uuid.slice(0, 8)}`, customerId: id(o.company_uuid), jobId: id(o.uuid), status: 'imported', revisions: [{ n: 1, lines: priced, totals: { ...calculated, currency: 'USD' }, notes: str(o.work_done_description), preparedBy: importer, preparedAt: null, approval: null, export: null }], openingBalance: { amount: dollars(total - paid), asOf: snapshot, sourceTotal: dollars(total), notForPosting: true }, dates: { issuedOn, dueOn: snapshot, termsDays: Math.round((Date.parse(snapshot + 'T00:00:00Z') - Date.parse(issuedOn + 'T00:00:00Z')) / 86_400_000), basis: 'ServiceM8 opening balance snapshot; original due date unavailable, no earlier aging inferred' }, source: { ...meta, kind: 'job_invoice' } }
          }
        } catch (error) { if (error instanceof Problem) return { effects: [], rejection: `Job cannot be imported: ${error.message}` }; throw error }
        const number = `SM8-${str(o.generated_job_id) || o.uuid.slice(0, 8)}`, title = (str(o.job_description).split('\n')[0] || 'ServiceM8 job').slice(0, 200)
        const sums = totals(priced)
        if (isJob(o)) {
          const status = o.status === 'Completed' ? (String(o.invoice_sent) === '1' ? 'invoiced' : 'completed') : 'open'
          effects.push({ targetKind: JOB_TARGET, targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, number, quoteId: null, quoteRevision: null, customerId: id(o.company_uuid), siteId: site, title, description: str(o.job_description), workDone: str(o.work_done_description), purchaseOrder: str(o.purchase_order_number), lines: priced, totals: sums, checklist: [], status, completedAt: blankDate(o.completion_date) ? null : str(o.completion_date), invoicedElsewhere: String(o.invoice_sent) === '1', source: meta } })
        } else if (o.status === 'Quote' || o.status === 'Unsuccessful') {
          const declined = o.status === 'Unsuccessful'
          effects.push({ targetKind: 'quotes', targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, number, customerId: id(o.company_uuid), siteId: site, enquiryId: null, title, status: declined ? 'declined' : 'draft', revisions: [{ n: 1, lines: priced, totals: sums, notes: str(o.job_description), preparedBy: importer, preparedAt: blankDate(o.quote_date) ? edited : str(o.quote_date), approval: null }], sent: [], acceptance: null, declined: declined ? { revision: 1, method: 'imported', customerName: '', note: 'Unsuccessful in ServiceM8', recordedBy: importer, at: edited } : null, jobId: null, source: meta } })
        } else return { effects: [], rejection: `ServiceM8 status "${o.status}" is not Quote, Work Order, Unsuccessful or Completed.` }
        if (importedInvoice) effects.push({ targetKind: 'invoices', targetId: importedInvoice.id, value: importedInvoice })
        return { effects, unmapped: extra }
      }
      case 'jobpayment':
        return jobs.has(o.job_uuid) ? { effects: [], unmapped: [{ reason: 'Source payment retained for invoice reconciliation; no new payment or charge is created.' }, ...extra] } : { effects: [], rejection: `Payment's job ${o.job_uuid} is not in job.json.` }
      case 'jobactivity': {
        const job = jobs.get(o.job_uuid)
        if (!job || !companies.has(job.company_uuid) || !str(job.job_address)) return { effects: [], rejection: `Activity's job ${o.job_uuid} was not imported as a job.` }
        if (map(jobRecords.get(o.job_uuid)!).rejection) return { effects: [], rejection: 'The activity belongs to a rejected job.' }
        if (!isJob(job)) return { effects: [], unmapped: [{ reason: 'activity on a quote; quotes have no visits in Glove' }, ...extra] }
        if (!staff.has(o.staff_uuid)) return { effects: [], rejection: `Activity's staff member ${o.staff_uuid} is not in staff.json.` }
        let start, end
        try { start = local(o.start_date, 'start_date'); end = local(o.end_date, 'end_date') } catch (error) { if (error instanceof Problem) return { effects: [], rejection: error.message }; throw error }
        const done = job.status === 'Completed' || String(o.activity_was_recorded) === '1'
        const slot = { technicianId: id(o.staff_uuid), startAt: start.at, endAt: end.at, local: { date: start.date, start: start.time, end: end.time } }
        return { effects: [{ targetKind: 'visits', targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, jobId: id(o.job_uuid), ...slot, status: done ? 'completed' : 'booked', assignments: [{ ...slot, by: importer, at: edited, reason: 'Imported from ServiceM8', reviewedConflicts: [] }], arrival: null, completion: done ? { imported: true, note: 'Done in ServiceM8. The export holds no arrival or customer sign-off evidence.' } : null, lateEvidence: [], source: meta } }], unmapped: extra }
      }
      case 'attachment': {
        if (o.related_object !== 'job' || !isJob(jobs.get(o.related_object_uuid)) || !companies.has(jobs.get(o.related_object_uuid).company_uuid)) return { effects: [], unmapped: [{ reason: `attached to ${o.related_object} ${o.related_object_uuid}, not an imported job` }, ...extra] }
        if (map(jobRecords.get(o.related_object_uuid)!).rejection) return { effects: [], rejection: 'The attachment belongs to a rejected job.' }
        const file = files.get(o.uuid)
        return { effects: [{ targetKind: 'captures', targetId: id(o.uuid), value: { id: id(o.uuid), version: 1, visitId: null, jobId: id(o.related_object_uuid), technicianId: staff.has(o.created_by_staff_uuid) ? id(o.created_by_staff_uuid) : null, kind: 'attachment', name: `${str(o.attachment_name) || 'attachment'}${str(o.file_type)}`, deviceTime: blankDate(o.timestamp) ? null : str(o.timestamp), receivedAt: null, late: false, bytes: file ? { status: 'retained', artifact: file.name, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The file was not included with this move-in.' }, source: meta } }], unmapped: extra }
      }
    }
  }
  const rejected = new Set(by('job').filter(r => map(r).rejection).map(r => r.sourceId))
  siteOwner.clear()
  for (const r of by('job')) if (!rejected.has(r.sourceId)) { const j = r.payload as any, key = siteId(j.company_uuid, str(j.job_address)); if (!siteOwner.has(key)) siteOwner.set(key, r.sourceId) }
  return { version: MAPPING_VERSION, map }
}
