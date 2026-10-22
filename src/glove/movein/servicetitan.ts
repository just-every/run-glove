import { type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { fail } from '../model'
import { exportBundle } from './export-reader'
import { exportMapping, str, list, address, amount, priced, customerFields, jobFields, quoteFields, type Entity } from './export-mapping'

export const SERVICETITAN_LISTS = ['customers', 'contacts', 'locations', 'technicians', 'services', 'materials', 'leads', 'jobs', 'appointments', 'appointment-assignments', 'estimates', 'invoices', 'equipment', 'membership-types', 'invoice-templates', 'memberships', 'recurring-services', 'recurring-service-events'] as const
export const readServiceTitan = (files: unknown) => exportBundle(files, 'servicetitan', SERVICETITAN_LISTS, 'data')
const place = (a: any) => a ? address(a.street, a.unit, a.city, a.state, a.zip, a.country) : ''
const date = (v: unknown) => str(v).slice(0, 10)

/** ServiceTitan V2 saved API response objects, never credentials or an API session. */
export function servicetitanMapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }) {
  const records = (kind: string) => bundle.records.filter(r => r.kind === kind).map(r => r.payload as any)
  const get = (kind: string, id: unknown) => records(kind).find(o => str(o.id) === str(id))
  const normalize = (r: SourceRecord, used: Set<string>): Entity[] => {
    const o: any = r.payload, out: Entity[] = [], use = (...fields: string[]) => fields.forEach(f => used.add(f)); use('id')
    const add = (kind: string, id: unknown, value: Record<string, any>, refs?: Entity['refs']) => out.push({ kind, id: str(id), value, refs })
    const pricing = (items: any[], total?: unknown, tax?: unknown) => priced(items.map(i => ({ description: str(i.displayName) || str(i.skuName) || str(i.description), quantity: str(i.quantity), unitPrice: amount(i.price), tax: i.taxable === false ? 'FREE' : 'TAXABLE' })), total, tax)
    switch (r.kind) {
      case 'customers': {
        use('name', 'type', 'address', 'active', 'doNotMail', 'doNotService')
        const contacts = records('contacts').filter(c => str(c.customerId) === r.sourceId), email = contacts.find(c => c.type === 'Email'), phone = contacts.find(c => ['Phone', 'MobilePhone'].includes(c.type))
        add('customers', o.id, { ...customerFields(str(o.name), str(email?.value), str(phone?.value), place(o.address)), kind: o.type === 'Commercial' ? 'business' : 'residential', archived: o.active === false, doNotContact: o.doNotMail === true, importedDoNotService: o.doNotService === true, contacts: contacts.map(c => ({ name: str(c.memo) || str(c.type), email: c.type === 'Email' ? str(c.value) : '', phone: c.type !== 'Email' ? str(c.value) : '', role: '', sourceId: str(c.id) })) })
        break
      }
      case 'contacts':
        use('customerId', 'type', 'value', 'memo')
        if (!get('customers', o.customerId)) fail('IMPORT_PARENT', 'Contact customer is not in customers.json.', null, 400)
        break
      case 'locations':
        use('customerId', 'name', 'address', 'active')
        add('sites', o.id, { address: place(o.address), zip: str(o.address?.zip), accessNotes: '', name: str(o.name), archived: o.active === false, branchId: null }, { customerId: ['customers', str(o.customerId)] })
        break
      case 'technicians':
        use('name', 'email', 'phoneNumber', 'active')
        add('technicians', o.id, { name: str(o.name), email: str(o.email), phone: str(o.phoneNumber), active: o.active !== false, operatorId: null, branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'services':
      case 'materials':
        use('code', 'displayName', 'description', 'price', 'cost', 'taxable', 'active')
        add('services', `${r.kind}:${o.id}`, { code: str(o.code) || `ST-${r.kind}-${o.id}`, name: str(o.displayName) || str(o.code), description: str(o.description), unit: 'each', unitPrice: amount(o.price), unitCost: amount(o.cost ?? 0), tax: o.taxable === false ? 'FREE' : 'TAXABLE', kind: r.kind === 'services' ? 'service' : 'material', category: 'Imported from ServiceTitan', checklist: [], components: [], parts: [], images: [], archived: o.active === false })
        break
      case 'leads':
        use('customerId', 'locationId', 'summary', 'createdOn')
        add('enquiries', o.id, { description: str(o.summary) || 'ServiceTitan lead', status: 'new', source: 'servicetitan', createdAt: str(o.createdOn) || null, stageAt: str(o.createdOn) || null, contacts: [] }, { customerId: ['customers', str(o.customerId)], ...(o.locationId ? { siteId: ['sites', str(o.locationId)] as [string, string] } : {}) })
        break
      case 'jobs': {
        use('jobNumber', 'customerId', 'locationId', 'jobStatus', 'summary', 'completedOn')
        const status = str(o.jobStatus).toLowerCase()
        if (!['scheduled', 'inprogress', 'in progress', 'hold', 'completed', 'canceled', 'cancelled'].includes(status)) fail('IMPORT_STATUS', 'This ServiceTitan job status needs an explicit mapping.', null, 400)
        const invoice = records('invoices').find(i => str(i.job?.id) === r.sourceId)
        add('jobs', o.id, { ...jobFields(`ST-${str(o.jobNumber) || o.id}`, str(o.summary) || 'ServiceTitan job', status === 'completed' ? 'completed' : ['canceled','cancelled'].includes(status) ? 'cancelled' : 'open', invoice ? pricing(list(invoice.items), invoice.total, invoice.salesTax) : priced([])), description: str(o.summary), completedAt: str(o.completedOn) || null }, { customerId: ['customers', str(o.customerId)], siteId: ['sites', str(o.locationId)] })
        break
      }
      case 'appointments': {
        use('jobId', 'start', 'end', 'status')
        const assignments = records('appointment-assignments').filter(a => str(a.appointmentId) === r.sourceId && a.status !== 'Unassigned')
        if (!assignments.length) fail('IMPORT_TECHNICIAN', 'Appointment has no exported active technician assignment.', null, 400)
        for (const a of assignments) add('visits', `${o.id}:${a.technicianId}`, { startAt: str(o.start), endAt: str(o.end), status: o.status === 'Done' || o.status === 'Completed' ? 'completed' : o.status === 'Canceled' ? 'cancelled' : 'booked' }, { jobId: ['jobs', str(o.jobId)], technicianId: ['technicians', str(a.technicianId)] })
        break
      }
      case 'appointment-assignments':
        use('appointmentId', 'technicianId', 'status')
        if (!get('appointments', o.appointmentId) || !get('technicians', o.technicianId)) fail('IMPORT_PARENT', 'Appointment assignment needs its appointment and technician.', null, 400)
        break
      case 'estimates': {
        use('jobId', 'name', 'summary', 'items')
        const job = get('jobs', o.jobId)
        if (!job) fail('IMPORT_PARENT', 'An estimate needs its job to identify customer and location.', null, 400)
        add('quotes', o.id, { ...quoteFields(`ST-Q-${o.id}`, str(o.name), priced(list(o.items).map(i => ({ description: str(i.description), quantity: str(i.qty), unitPrice: amount(i.unitRate), tax: 'TAXABLE' })))), notes: str(o.summary) }, { customerId: ['customers', str(job.customerId)], siteId: ['sites', str(job.locationId)] })
        break
      }
      case 'invoices':
        use('referenceNumber', 'invoiceDate', 'dueDate', 'subTotal', 'salesTax', 'total', 'balance', 'customer', 'job', 'items')
        add('invoices', o.id, { number: `ST-I-${str(o.referenceNumber) || o.id}`, status: 'imported', ...pricing(list(o.items), o.total, o.salesTax), openingBalance: { amount: amount(o.balance), sourceTotal: amount(o.total), asOf: batch.balanceAsOf, notForPosting: true }, dates: { issuedOn: date(o.invoiceDate), dueOn: date(o.dueDate), termsDays: 0, basis: 'opening balance from ServiceTitan; not a Glove sale' } }, { jobId: ['jobs', str(o.job?.id)], customerId: ['customers', str(o.customer?.id)] })
        break
      case 'equipment':
        use('locationId', 'customerId', 'name', 'installedOn', 'serialNumber', 'memo', 'manufacturer', 'model', 'manufacturerWarrantyEnd', 'serviceProviderWarrantyEnd')
        add('equipment', o.id, { type: str(o.name), make: str(o.manufacturer), model: str(o.model), serial: str(o.serialNumber), installedOn: date(o.installedOn), manufacturerWarrantyUntil: date(o.manufacturerWarrantyEnd), laborWarrantyUntil: date(o.serviceProviderWarrantyEnd), refrigerant: '', location: str(o.memo), photos: [] }, { customerId: ['customers', str(o.customerId)], siteId: ['sites', str(o.locationId)] })
        break
      case 'invoice-templates':
        use('name', 'total', 'items')
        break
      case 'membership-types':
        // The type is retained exactly; each membership's terms are preserved on its agreement.
        use('name')
        break
      case 'memberships': {
        use('customerId', 'locationId', 'membershipTypeId', 'from', 'to', 'duration', 'active', 'status', 'cancellationDate', 'createdOn', 'memo', 'billingTemplateId', 'billingFrequency')
        const type = get('membership-types', o.membershipTypeId)
        if (!type) fail('IMPORT_PARENT', 'Membership type is missing.', null, 400)
        const template = get('invoice-templates', o.billingTemplateId)
        if (!template) fail('IMPORT_MEMBERSHIP', 'Include the membership billing invoice template; its amount must not be guessed.', null, 400)
        const recurring = records('recurring-services').filter(x => str(x.membershipId) === r.sourceId)
        const location = str(o.locationId || recurring[0]?.locationId)
        if (!location) fail('IMPORT_PARENT', 'Membership has no source location or recurring-service location.', null, 400)
        const locations = [...new Set([location, ...recurring.map(x => str(x.locationId))])]
        const events = records('recurring-service-events').filter(e => recurring.some(rs => str(rs.id) === str(e.locationRecurringServiceId))).sort((a,b) => str(a.date).localeCompare(str(b.date)) || str(a.id).localeCompare(str(b.id)))
        if (!o.from) fail('IMPORT_MEMBERSHIP', 'A membership needs its source start date.', null, 400)
        const included = events.map(e => ({ sourceId: str(e.id), recurringServiceId: str(e.locationRecurringServiceId), due: date(e.date), siteId: null, completed: e.status === 'Completed', sourceClosed: e.status === 'Dismissed', name: str(e.locationRecurringServiceName) || str(type.name) }))
        const includedTemplate = get('invoice-templates', recurring[0]?.invoiceTemplateId)
        const includedItem = list(includedTemplate?.items).find(i => i.skuType === 'Service')
        if (!includedItem || !get('services', includedItem.skuId)) fail('IMPORT_MEMBERSHIP', 'Include the recurring-service invoice template and its service SKU so included visits can be booked.', null, 400)
        const service = `services:${includedItem.skuId}`
        add('agreements', o.id, { planId: null, plan: { name: str(type.name), price: amount(template.total), termMonths: o.duration === undefined || o.duration === null ? null : Number(o.duration), includedVisits: included.length, visitServiceId: null, visitServiceName: str(get('services', includedItem.skuId)?.displayName) || str(type.name), repairDiscountPercent: null, priorityBooking: false, sourceBenefitsUnavailable: true, formIds: [] }, startDate: date(o.from), endDate: o.to ? date(o.to) : null, siteIds: Array(locations.length).fill(null), importedInactive: o.active === false || o.status !== 'Active', soldOn: null, sourceCreatedOn: str(o.createdOn), via: 'imported', soldBy: { id: 'import', name: 'ServiceTitan move-in', role: 'import' }, soldByTechnicianId: null, endedAt: str(o.cancellationDate) || null, endedOn: date(o.cancellationDate) || null, endReason: o.active === false ? 'Inactive in ServiceTitan' : null, imported: true, importedEntitlements: included, sourceTerms: { status: o.status, memo: str(o.memo), membershipTypeId: str(o.membershipTypeId), billingFrequency: str(o.billingFrequency), billingTemplateId: str(o.billingTemplateId), priceBasis: 'Source billing template total; not a new sale or an authorization to charge.' } }, { customerId: ['customers', str(o.customerId)], siteId: ['sites', location], 'plan.visitServiceId': ['services', service], ...Object.fromEntries(locations.map((id, i) => [`siteIds.${i}`, ['sites', id] as [string,string]])), ...Object.fromEntries(events.map((event, i) => [`importedEntitlements.${i}.siteId`, ['sites', str(get('recurring-services', event.locationRecurringServiceId)?.locationId)] as [string,string]])) })
        break
      }
      case 'recurring-services':
        use('name', 'locationId', 'membershipId', 'recurrenceType', 'recurrenceInterval', 'recurrenceMonths', 'recurrenceDaysOfWeek', 'recurrenceDaysOfMonth', 'recurrenceWeek', 'recurrenceDayOfNthWeek', 'from', 'to', 'firstVisitComplete', 'jobSummary', 'jobStartTime', 'active', 'invoiceTemplateId')
        add('jobs', `recurring:${o.id}`, { ...jobFields(`ST-R-${o.id}`, str(o.name), 'open'), description: str(o.jobSummary), importedRecurrence: { active: false, source: Object.fromEntries(['id','name','recurrenceType','recurrenceInterval','recurrenceMonths','recurrenceDaysOfWeek','recurrenceDaysOfMonth','recurrenceWeek','recurrenceDayOfNthWeek','from','to','firstVisitComplete','jobStartTime'].filter(k => o[k] !== undefined).map(k => [k,o[k]])), reason: 'Source schedule retained; review and explicitly create a Glove series before generating new bookings.' } }, { siteId: ['sites', str(o.locationId)], ...(o.membershipId ? { importedAgreementId: ['agreements', str(o.membershipId)] as [string,string] } : {}) })
        break
      case 'recurring-service-events':
        use('locationRecurringServiceId', 'status', 'date')
        if (!get('recurring-services', o.locationRecurringServiceId)) fail('IMPORT_PARENT', 'Recurring service event has no recurring service.', null, 400)
        break
      case 'job-notes': {
        use('text', 'createdById', 'createdOn', 'modifiedOn', 'isPinned')
        const jobId = r.location.artifact.slice('job-notes-'.length, -5)
        add('captures', r.sourceId, { kind: 'note', text: str(o.text), importedAuthorId: str(o.createdById), visitId: null, technicianId: null, deviceTime: str(o.createdOn) || null, receivedAt: null, late: false }, { jobId: ['jobs', jobId] })
        break
      }
      case 'job-attachments': {
        use('fileName')
        const jobId = r.location.artifact.slice('job-attachments-'.length, -5), file = bundle.artifacts.find(f => f.name === `attachments/${str(o.fileName)}`)
        add('captures', r.sourceId, { kind: 'attachment', name: str(o.fileName), visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false, bytes: file ? { status: 'retained', artifact: file.name, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The attachment bytes were not supplied.' } }, { jobId: ['jobs', jobId] })
        break
      }
    }
    return out
  }
  return exportMapping(bundle, 'ServiceTitan', 'servicetitan-v2-1', normalize, batch)
}
