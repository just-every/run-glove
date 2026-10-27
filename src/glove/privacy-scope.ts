import { collections, type State, type Row } from './model'

/** Follow ownership, never a free-text mention, into the erased group. */
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
  const add = (value: unknown) => { if (typeof value === 'string' && value.trim()) personal.add(value) }
  for (const c of records.customers) {
    for (const key of ['name', 'contact', 'email', 'apEmail', 'phone', 'billingAddress', 'billingContact', 'abn']) add(c[key])
    for (const contact of c.contacts ?? []) for (const key of ['name', 'phone', 'email']) add(contact[key])
    add(c.taxExemption?.certificateNumber)
  }
  for (const site of records.sites) for (const key of ['address', 'contact', 'contactPhone', 'contactEmail']) add(site[key])
  for (const enquiry of records.enquiries) for (const key of ['name', 'phone', 'email']) add(enquiry.intake?.contact?.[key])
  // ServiceM8 child lists refer to raw source UUIDs. Include only identities of
  // records already owned by this customer, so payment originals follow their
  // job through customer export and erasure without selecting a peer's rows.
  for (const owned of Object.values(records)) for (const row of owned) if (row.source?.system === 'ServiceM8' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(row.source.id)) add(row.source.id)
  const values = [...ids, ...personal].sort((a, b) => b.length - a.length)
  const matches = (value: unknown): boolean => typeof value === 'string' ? values.some(v => value.includes(v)) : Array.isArray(value) ? value.some(matches) : !!value && typeof value === 'object' && Object.values(value).some(matches)
  const redact = (value: any): any => typeof value === 'string' ? values.reduce((s, v) => s.split(v).join('[erased]'), value) : Array.isArray(value) ? value.map(redact) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v)])) : value
  return { customers, ids, selected, records, personal, matches, redact }
}
