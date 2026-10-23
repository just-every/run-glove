import { sha256, type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { cents, dollars } from '../money'
import { fail } from '../model'
import { exportBundle } from './export-reader'
import { exportMapping, str, address, amount, customerFields, jobFields, type Entity } from './export-mapping'

export const JOBBER_LISTS = ['clients', 'properties', 'users', 'requests', 'jobs', 'visits', 'invoices'] as const
export const JOBBER_COLUMNS = ['Name', 'Description', 'Unit Price', 'Taxable', 'Category', 'Active']

/** Read saved Jobber GraphQL connections and the documented product export. */
export function readJobber(files: unknown): SourceBundle {
  if (!Array.isArray(files)) return fail('IMPORT_FILES', 'Add saved Jobber responses and products-services.csv.', null, 400)
  // Validate and retain the exact received bytes using the shared custody reader.
  const source = exportBundle(files, 'jobber', JOBBER_LISTS, 'data')
  return source
}

const connection = (value: any): any[] => {
  if (Array.isArray(value)) return value
  if (value?.pageInfo?.hasNextPage) fail('IMPORT_PARSE', 'Save every Jobber connection page separately; an unfinished nested connection cannot be imported.', null, 400)
  if (Array.isArray(value?.nodes)) return value.nodes
  if (Array.isArray(value?.edges)) return value.edges.map((e: any) => e.node)
  if (value !== undefined && value !== null) fail('IMPORT_PARSE', 'Export the complete Jobber connection as nodes or edges.', null, 400)
  return []
}
const place = (a: any) => a ? address(a.street1, a.street2, a.city, a.province, a.postalCode, a.country) : ''
const bool = (v: unknown, label: string) => {
  if (str(v) === 'TRUE') return true
  if (str(v) === 'FALSE') return false
  return fail('IMPORT_FIELD', `${label} must be TRUE or FALSE in the Jobber product export.`, null, 400)
}

export function jobberMapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }) {
  const normalize = (r: SourceRecord, used: Set<string>): Entity[] => {
    const o: any = r.payload, out: Entity[] = []
    const use = (...names: string[]) => names.forEach(n => used.add(n)); use('id')
    const add = (kind: string, id: unknown, value: Record<string, any>, refs?: Entity['refs']) => out.push({ kind, id: str(id), value, refs })
    switch (r.kind) {
      case 'products-services': {
        use(...JOBBER_COLUMNS, 'Unit cost')
        if (!['Service', 'Product'].includes(o.Category)) fail('IMPORT_FIELD', 'Jobber Category must be Service or Product.', null, 400)
        if (!str(o.Name)) fail('IMPORT_FIELD', 'A Jobber product needs a Name.', null, 400)
        add('services', r.sourceId, { code: `JB-${sha256(r.sourceId).slice(0, 12)}`, name: str(o.Name), description: str(o.Description), unit: 'each', unitPrice: amount(o['Unit Price']), ...(o['Unit cost'] === undefined || o['Unit cost'] === '' ? {} : { unitCost: amount(o['Unit cost']) }), tax: bool(o.Taxable, 'Taxable') ? 'TAXABLE' : 'FREE', kind: o.Category === 'Service' ? 'service' : 'material', category: 'Imported from Jobber', checklist: [], components: [], parts: [], images: [], archived: !bool(o.Active, 'Active') })
        break
      }
      case 'clients':
        use('name', 'firstName', 'lastName', 'companyName', 'email', 'phone', 'billingAddress', 'isCompany', 'isArchived')
        add('customers', o.id, { ...customerFields(str(o.name) || str(o.companyName) || address(o.firstName, o.lastName), str(o.email), str(o.phone), place(o.billingAddress)), kind: o.isCompany ? 'business' : 'residential', archived: o.isArchived === true })
        break
      case 'properties':
        use('client', 'address', 'name')
        add('sites', o.id, { address: place(o.address), zip: str(o.address?.postalCode), accessNotes: str(o.name), branchId: null }, { customerId: ['customers', str(o.client?.id)] })
        break
      case 'users':
        use('name', 'email', 'phone', 'status')
        add('technicians', o.id, { name: typeof o.name === 'string' ? o.name : address(o.name?.first, o.name?.last), operatorId: null, email: typeof o.email === 'string' ? o.email : str(o.email?.raw), phone: typeof o.phone === 'string' ? o.phone : str(o.phone?.number), active: str(o.status).toUpperCase() === 'ACTIVE', branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'requests':
        use('client', 'property', 'title', 'contactName', 'email', 'phone', 'createdAt')
        add('enquiries', o.id, { description: str(o.title), source: 'other', status: 'open', createdAt: str(o.createdAt), contact: str(o.contactName), email: str(o.email), phone: str(o.phone), assessmentId: null }, { customerId: ['customers', str(o.client?.id)], siteId: ['sites', str(o.property?.id)] })
        break
      case 'jobs': {
        use('client', 'property', 'title', 'instructions', 'jobNumber', 'jobStatus', 'jobType')
        if (!['ACTIVE', 'REQUIRES_INVOICING', 'LATE', 'UPCOMING', 'UNSCHEDULED'].includes(str(o.jobStatus).toUpperCase())) fail('IMPORT_STATUS', 'This Jobber job status needs review before mapping.', null, 400)
        add('jobs', o.id, { ...jobFields(`JB-${o.jobNumber}`, str(o.title), 'open'), description: str(o.instructions), ...(str(o.jobType).toUpperCase() === 'RECURRING' ? { importedRecurrence: { active: false, reason: 'Future Jobber recurrence definition is not mapped; only exported visits are retained.', source: { jobType: o.jobType }, unmapped: 'Future Jobber recurrence definition is not mapped; only exported visits are retained.' } } : {}) }, { customerId: ['customers', str(o.client?.id)], siteId: ['sites', str(o.property?.id)] })
        break
      }
      case 'invoice-balances':
        use('Invoice #', 'Total ($)', 'Balance ($)', 'Tax amount ($)', 'Issued date', 'Due date')
        if (!bundle.records.some(x => x.kind === 'invoices' && str((x.payload as any).invoiceNumber) === r.sourceId)) fail('IMPORT_PARENT', 'This balance report row has no detailed Jobber invoice.', null, 400)
        break
      case 'invoices': {
        use('invoiceNumber', 'jobs', 'client', 'subject', 'message', 'issuedDate', 'dueDate')
        const jobs = connection(o.jobs)
        if (jobs.length !== 1) fail('IMPORT_PARENT', 'A Jobber invoice must identify exactly one exported job; multi-job invoices need review.', null, 400)
        const candidates = bundle.records.filter(x => x.kind === 'invoices' && str((x.payload as any).invoiceNumber) === str(o.invoiceNumber))
        if (candidates.length !== 1) fail('IMPORT_BALANCE', 'The Jobber invoice number is ambiguous; no balance can be joined safely.', null, 400)
        const reports = bundle.records.filter(x => x.kind === 'invoice-balances' && x.sourceId === str(o.invoiceNumber))
        if (reports.length !== 1) fail('IMPORT_BALANCE', 'Include exactly one matching invoice-balances.csv row for this Jobber invoice number.', null, 400)
        const report: any = reports[0].payload, total = amount(report['Total ($)']), tax = amount(report['Tax amount ($)'])
        const issuedOn = str(o.issuedDate).slice(0, 10), dueOn = str(o.dueDate).slice(0, 10)
        if (issuedOn !== str(report['Issued date']) || dueOn !== str(report['Due date'])) fail('IMPORT_DATE', 'The Jobber invoice dates and balance report dates differ; use one consistent export snapshot with ISO dates.', null, 400)
        const subtotal = cents(total, 'source total') - cents(tax, 'source tax')
        if (subtotal < 0) fail('IMPORT_BALANCE', 'Source tax exceeds the Jobber invoice total.', null, 400)
        add('invoices', o.id, { number: `JB-I-${o.invoiceNumber}`, status: 'imported', lines: [], totals: { subtotal: dollars(subtotal), gst: tax, total, currency: 'USD' }, sourceLinesUnavailable: true, notes: str(o.message), openingBalance: { amount: amount(report['Balance ($)']), asOf: batch.balanceAsOf, sourceTotal: total, notForPosting: true }, dates: { issuedOn, dueOn, termsDays: 0, basis: 'opening balance from Jobber; not a Glove sale' } }, { jobId: ['jobs', str(jobs[0].id)], customerId: ['customers', str(o.client?.id)] })
        break
      }
      case 'visits': {
        use('job', 'client', 'property', 'startAt', 'endAt', 'isComplete', 'assignedUsers')
        const users = connection(o.assignedUsers)
        if (!users.length) fail('IMPORT_TECHNICIAN', 'A scheduled Jobber visit needs its assigned users in the export.', null, 400)
        for (const user of users) add('visits', `${o.id}:${user.id}`, { startAt: o.startAt, endAt: o.endAt, status: o.isComplete ? 'completed' : 'booked' }, { jobId: ['jobs', str(o.job?.id)], technicianId: ['technicians', str(user.id)] })
        break
      }
    }
    return out
  }
  return exportMapping(bundle, 'Jobber', 'jobber-v1-1', normalize, batch)
}
