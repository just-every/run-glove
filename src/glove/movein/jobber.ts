import { sha256, type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { cents, dollars } from '../money'
import { fail } from '../model'
import { exportBundle } from './export-reader'
import { jobberConnection as connection, jobberNotes } from './jobber-notes'
import { exportMapping, str, list, address, amount, priced, quoteFields, customerFields, jobFields, type Entity } from './export-mapping'

export const JOBBER_LISTS = ['clients', 'properties', 'users', 'requests', 'jobs', 'visits', 'invoices', 'quotes'] as const
export const JOBBER_COLUMNS = ['Name', 'Description', 'Unit Price', 'Taxable', 'Category', 'Active']

/** Read saved Jobber GraphQL connections and the documented product export. */
export function readJobber(files: unknown): SourceBundle {
  if (!Array.isArray(files)) return fail('IMPORT_FILES', 'Add saved Jobber responses and products-services.csv.', null, 400)
  // Validate and retain the exact received bytes using the shared custody reader.
  const source = exportBundle(files, 'jobber', JOBBER_LISTS, 'data')
  return source
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
      case 'clients': {
        use('name', 'firstName', 'lastName', 'companyName', 'email', 'phone', 'billingAddress', 'isCompany', 'isArchived', 'emails', 'phones', 'notes', 'noteAttachments')
        const emails = list(o.emails), phones = list(o.phones)
        const channels = [...emails.map(e => ({ sourceId: str(e.id), name: str(e.description), email: str(e.address), phone: '', role: '', sourceContactId: str(e.contact?.id) })), ...phones.map(p => ({ sourceId: str(p.id), name: str(p.description), email: '', phone: str(p.number), role: '', sourceContactId: str(p.contact?.id) }))]
        if (channels.some(c => !c.sourceId || !c.email && !c.phone)) fail('IMPORT_CONTACT', 'Every exported contact channel needs its source id and address or phone number.', null, 400)
        add('customers', o.id, { ...customerFields(str(o.name) || str(o.companyName) || address(o.firstName, o.lastName), str(o.email) || str(emails.find(e => e.primary)?.address), str(o.phone) || str(phones.find(p => p.primary)?.number), place(o.billingAddress)), kind: o.isCompany ? 'business' : 'residential', archived: o.isArchived === true, contacts: channels, ...jobberNotes(bundle, r) })
        break
      }
      case 'properties':
        use('client', 'address', 'name')
        add('sites', o.id, { address: place(o.address), zip: str(o.address?.postalCode), accessNotes: str(o.name), branchId: null }, { customerId: ['customers', str(o.client?.id)] })
        break
      case 'users':
        use('name', 'email', 'phone', 'status')
        add('technicians', o.id, { name: typeof o.name === 'string' ? o.name : address(o.name?.first, o.name?.last), operatorId: null, email: typeof o.email === 'string' ? o.email : str(o.email?.raw), phone: typeof o.phone === 'string' ? o.phone : str(o.phone?.number), active: str(o.status).toUpperCase() === 'ACTIVE', branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'requests':
        use('client', 'property', 'title', 'contactName', 'email', 'phone', 'createdAt', 'notes', 'noteAttachments')
        add('enquiries', o.id, { description: str(o.title), source: 'other', status: 'new', createdAt: str(o.createdAt), contact: str(o.contactName), email: str(o.email), phone: str(o.phone), assessmentId: null, ...jobberNotes(bundle, r) }, { customerId: ['customers', str(o.client?.id)], siteId: ['sites', str(o.property?.id)] })
        break
      case 'jobs': {
        use('client', 'property', 'title', 'instructions', 'jobNumber', 'jobStatus', 'jobType', 'notes', 'noteAttachments', 'visitSchedule')
        if (!['ACTIVE', 'REQUIRES_INVOICING', 'LATE', 'TODAY', 'UPCOMING', 'ACTION_REQUIRED', 'ON_HOLD', 'UNSCHEDULED', 'ARCHIVED'].includes(str(o.jobStatus).toUpperCase())) fail('IMPORT_STATUS', 'This Jobber job status needs review before mapping.', null, 400)
        add('jobs', o.id, { ...jobFields(`JB-${o.jobNumber}`, str(o.title), str(o.jobStatus).toUpperCase() === 'ARCHIVED' ? 'archived' : 'open'), importedStatus: str(o.jobStatus), description: str(o.instructions), ...(str(o.jobType).toUpperCase() === 'RECURRING' ? { importedRecurrence: { active: false, reason: 'Future Jobber recurrence definition is not mapped; only exported visits are retained.', source: { jobType: o.jobType, ...(o.visitSchedule ? { startDate: str(o.visitSchedule.startDate), endDate: str(o.visitSchedule.endDate), startTime: str(o.visitSchedule.startTime), endTime: str(o.visitSchedule.endTime), calendarRule: str(o.visitSchedule.recurrenceSchedule?.calendarRule), friendly: str(o.visitSchedule.recurrenceSchedule?.friendly) } : {}) }, unmapped: 'Future Jobber recurrence definition is not mapped; only exported visits are retained.' } } : {}) }, { customerId: ['customers', str(o.client?.id)], siteId: ['sites', str(o.property?.id)] })
        const evidence = jobberNotes(bundle, r)
        for (const note of evidence.importedNotes) add('captures', `note:${o.id}:${note.sourceId}`, { kind: 'note', text: note.text, visitId: null, technicianId: null, deviceTime: note.sourceTime, receivedAt: null, late: false, importedNoteId: note.sourceId }, { jobId: ['jobs', str(o.id)] })
        for (const attachment of evidence.importedAttachments) add('captures', `attachment:${o.id}:${attachment.sourceId}`, { kind: 'attachment', name: attachment.name, importedAttachmentId: attachment.sourceId, importedNoteId: attachment.noteId, visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false, bytes: attachment.bytes }, { jobId: ['jobs', str(o.id)] })
        break
      }
      case 'quotes': {
        use('quoteNumber', 'quoteStatus', 'client', 'property', 'title', 'message', 'contractDisclaimer', 'lineItems', 'amounts', 'createdAt', 'notes', 'noteAttachments')
        const items = connection(o.lineItems)
        if (!items.length || items.some(i => i.optional || i.textOnly)) fail('IMPORT_QUOTE', 'Export priced quote lines; optional or text-only source lines need review before mapping.', null, 400)
        const ids = new Set<string>()
        const raw = items.map(i => {
          if (!str(i.id) || ids.has(str(i.id)) || typeof i.taxable !== 'boolean') fail('IMPORT_QUOTE', 'Each quote line needs a unique source id and taxable flag.', null, 400)
          ids.add(str(i.id))
          return { description: address(i.name, i.description), quantity: str(i.quantity), unitPrice: amount(i.unitPrice), tax: i.taxable ? 'TAXABLE' : 'FREE' }
        })
        const gross = priced(raw), a = o.amounts ?? {}
        if (gross.totals.subtotal !== amount(a.subtotal) || gross.lines.some((l, i) => l.total !== amount(items[i].totalPrice))) fail('IMPORT_QUOTE', 'Quote lines do not reconcile to their source subtotal.', null, 400)
        const discount = amount(a.discountAmount), total = amount(a.total), tax = amount(a.taxAmount)
        const pricing = priced([...raw, ...(cents(discount, 'source discount') ? [{ description: 'Imported Jobber document discount', quantity: '1', unitPrice: `-${discount}`, tax: 'FREE' }] : [])], total, tax)
        if (cents(pricing.totals.subtotal, 'subtotal') + cents(tax, 'source tax') !== cents(total, 'source total')) fail('IMPORT_QUOTE', 'Quote discount and tax do not reconcile to its source total.', null, 400)
        pricing.lines.slice(0, items.length).forEach((l, i) => Object.assign(l, { sourceId: str(items[i].id) }))
        if (!str(o.quoteStatus) || !str(o.quoteNumber)) fail('IMPORT_QUOTE', 'A quote needs its source number and status.', null, 400)
        add('quotes', o.id, { ...quoteFields(`JB-Q-${o.quoteNumber}`, str(o.title), pricing), status: 'imported', importedReadOnly: true, importedStatus: str(o.quoteStatus), notes: str(o.message), importedTerms: str(o.contractDisclaimer), sourceCreatedAt: str(o.createdAt) || null, ...jobberNotes(bundle, r) }, { customerId: ['customers', str(o.client?.id)], siteId: ['sites', str(o.property?.id)] })
        break
      }
      case 'invoice-balances':
        use('Invoice #', 'Total ($)', 'Balance ($)', 'Tax amount ($)', 'Issued date', 'Due date')
        if (!bundle.records.some(x => x.kind === 'invoices' && str((x.payload as any).invoiceNumber) === r.sourceId)) fail('IMPORT_PARENT', 'This balance report row has no detailed Jobber invoice.', null, 400)
        break
      case 'invoices': {
        use('invoiceNumber', 'jobs', 'client', 'subject', 'message', 'issuedDate', 'dueDate', 'lineItems', 'amounts', 'notes', 'noteAttachments')
        const jobs = connection(o.jobs)
        if (!jobs.length || new Set(jobs.map(j => str(j.id))).size !== jobs.length) fail('IMPORT_PARENT', 'A Jobber invoice needs its distinct exported jobs.', null, 400)
        for (const job of jobs) {
          const parent = bundle.records.find(r => r.kind === 'jobs' && r.sourceId === str(job.id))?.payload as any
          if (!parent || str(parent.client?.id) !== str(o.client?.id)) fail('IMPORT_PARENT', 'Every Jobber invoice job must belong to its exported client.', null, 400)
        }
        const candidates = bundle.records.filter(x => x.kind === 'invoices' && str((x.payload as any).invoiceNumber) === str(o.invoiceNumber))
        if (candidates.length !== 1) fail('IMPORT_BALANCE', 'The Jobber invoice number is ambiguous; no balance can be joined safely.', null, 400)
        const reports = bundle.records.filter(x => x.kind === 'invoice-balances' && x.sourceId === str(o.invoiceNumber))
        if (reports.length !== 1) fail('IMPORT_BALANCE', 'Include exactly one matching invoice-balances.csv row for this Jobber invoice number.', null, 400)
        const report: any = reports[0].payload, total = amount(report['Total ($)']), tax = amount(report['Tax amount ($)'])
        const issuedOn = str(o.issuedDate).slice(0, 10), dueOn = str(o.dueDate).slice(0, 10)
        if (issuedOn !== str(report['Issued date']) || dueOn !== str(report['Due date'])) fail('IMPORT_DATE', 'The Jobber invoice dates and balance report dates differ; use one consistent export snapshot with ISO dates.', null, 400)
        const subtotal = cents(total, 'source total') - cents(tax, 'source tax')
        if (subtotal < 0) fail('IMPORT_BALANCE', 'Source tax exceeds the Jobber invoice total.', null, 400)
        let pricing: ReturnType<typeof priced> | null = null
        if (o.lineItems !== undefined) {
          const items = connection(o.lineItems)
          const sourceIds = new Set<string>()
          const raw = items.map(i => {
            if (!str(i.id) || sourceIds.has(str(i.id))) fail('IMPORT_INVOICE', 'Every Jobber invoice line needs a unique source id.', null, 400)
            sourceIds.add(str(i.id))
            if (typeof i.taxable !== 'boolean') fail('IMPORT_INVOICE', 'Every Jobber invoice line needs its source taxable flag.', null, 400)
            return { description: address(i.name, i.description), quantity: str(i.quantity), unitPrice: amount(i.unitPrice), tax: i.taxable ? 'TAXABLE' : 'FREE' }
          })
          pricing = priced(raw, total, tax)
          for (const [index, line] of pricing.lines.entries()) {
            if (line.total !== amount(items[index].totalPrice)) fail('IMPORT_INVOICE', 'A Jobber invoice line does not reconcile to its source total.', null, 400)
            Object.assign(line, { sourceId: str(items[index].id) })
          }
          if (o.amounts !== undefined) {
            const a = o.amounts
            if (amount(a.total) !== total || amount(a.taxAmount) !== tax || amount(a.invoiceBalance) !== amount(report['Balance ($)']) || amount(a.subtotal) !== pricing.totals.subtotal) fail('IMPORT_INVOICE', 'The Jobber invoice amounts and balance report do not reconcile.', null, 400)
            const discount = amount(a.discountAmount)
            if (cents(discount, 'source discount')) pricing = priced([...raw, { description: 'Imported Jobber document discount', quantity: '1', unitPrice: `-${discount}`, tax: 'FREE' }], total, tax)
            // Keep source identities on item lines after adding the document discount.
            pricing.lines.slice(0, items.length).forEach((line, index) => Object.assign(line, { sourceId: str(items[index].id) }))
          }
          if (pricing.totals.subtotal !== dollars(subtotal)) fail('IMPORT_INVOICE', 'Jobber invoice lines and discount do not reconcile to the report total before tax.', null, 400)
        }
        add('invoices', o.id, { number: `JB-I-${o.invoiceNumber}`, status: 'imported', importedJobIds: jobs.map(() => null), ...(pricing ?? { lines: [], totals: { subtotal: dollars(subtotal), gst: tax, total, currency: 'USD' }, sourceLinesUnavailable: true }), notes: str(o.message), ...jobberNotes(bundle, r), openingBalance: { amount: amount(report['Balance ($)']), asOf: batch.balanceAsOf, sourceTotal: total, notForPosting: true }, dates: { issuedOn, dueOn, termsDays: 0, basis: 'opening balance from Jobber; not a Glove sale' } }, { jobId: ['jobs', str(jobs[0].id)], customerId: ['customers', str(o.client?.id)], ...Object.fromEntries(jobs.map((j, i) => [`importedJobIds.${i}`, ['jobs', str(j.id)] as [string, string]])) })
        break
      }
      case 'visits': {
        use('job', 'client', 'property', 'startAt', 'endAt', 'isComplete', 'assignedUsers', 'title', 'instructions')
        const users = connection(o.assignedUsers)
        if (o.startAt === null && o.endAt === null) {
          // A source pending visit must never reserve invented dates or capacity.
          add('captures', `unscheduled:${o.id}`, { kind: 'source-visit', importedVisitId: str(o.id), title: str(o.title), instructions: str(o.instructions), sourceComplete: o.isComplete === true, importedAssignments: users.map(u => ({ id: str(u.id) })), visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false }, { jobId: ['jobs', str(o.job?.id)] })
          break
        }
        if (!users.length) fail('IMPORT_TECHNICIAN', 'A scheduled Jobber visit needs its assigned users in the export.', null, 400)
        for (const user of users) add('visits', `${o.id}:${user.id}`, { startAt: o.startAt, endAt: o.endAt, status: o.isComplete ? 'completed' : 'booked' }, { jobId: ['jobs', str(o.job?.id)], technicianId: ['technicians', str(user.id)] })
        break
      }
    }
    return out
  }
  return exportMapping(bundle, 'Jobber', 'jobber-v1-2', normalize, batch)
}
