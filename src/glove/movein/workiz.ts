import { type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { fail } from '../model'
import { exportBundle } from './export-reader'
import { exportMapping, str, list, address, amount, priced, customerFields, jobFields, quoteFields, type Entity } from './export-mapping'

export const WORKIZ_LISTS = ['clients', 'users', 'items', 'leads', 'jobs', 'estimates', 'invoices'] as const
export const readWorkiz = (files: unknown) => exportBundle(files, 'workiz', WORKIZ_LISTS, 'data')
const siteKey = (client: unknown, place: string) => `${str(client)}:${place.toLowerCase().replace(/\s+/g, ' ')}`
const place = (a: any) => a ? address(a.address, a.unit, a.city, a.state, a.zipCode ?? a.zipcode, a.country) : ''

/** Workiz CRM API v2 response objects; use detailed job, estimate and invoice responses. */
export function workizMapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }) {
  const normalize = (r: SourceRecord, used: Set<string>): Entity[] => {
    const o: any = r.payload, out: Entity[] = []
    const use = (...names: string[]) => names.forEach(n => used.add(n))
    use('id')
    const add = (kind: string, id: unknown, value: Record<string, any>, refs?: Entity['refs']) => out.push({ kind, id: str(id), value, refs })
    const site = (client: unknown, a: any, fallback?: string) => {
      const location = place(a) || fallback || ''
      if (!location) return fail('IMPORT_SITE', 'The Workiz record needs a service address.', null, 400)
      const k = siteKey(client, location)
      add('sites', k, { address: location, zip: str(a?.zipCode ?? a?.zipcode), accessNotes: '', branchId: null }, { customerId: ['customers', str(client)] })
      return k
    }
    const price = () => priced(list(o.lineItems).map(l => ({ description: str(l.name) || str(l.description), quantity: str(l.quantity), unitPrice: amount(l.price), tax: l.taxable === false ? 'FREE' : 'TAXABLE' })), o.totalPrice ?? o.total, o.taxAmount)
    const children = (jobId: string) => {
      for (const n of list(o.notes)) add('captures', `note:${n.id}`, { kind: 'note', text: str(n.note), visitId: null, technicianId: null, deviceTime: str(n.timestamp) || null, receivedAt: null, late: false, importedAuthor: str(n.techName) }, { jobId: ['jobs', jobId] })
      for (const a of list(o.attachments)) {
        const name = `attachments/${str(a.id)}`, file = bundle.artifacts.find(f => f.name === name)
        add('captures', `attachment:${a.id}`, { kind: 'attachment', name: str(a.name) || 'Workiz attachment', visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false, bytes: file ? { status: 'retained', artifact: name, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The attachment bytes were not supplied.' } }, { jobId: ['jobs', jobId] })
      }
    }
    switch (r.kind) {
      case 'clients': {
        use('firstName', 'lastName', 'fullName', 'companyName', 'email', 'primaryPhone', 'billingAddress', 'clientContacts')
        const people = list(o.clientContacts)
        add('customers', o.id, { ...customerFields(str(o.companyName) || str(o.fullName) || address(o.firstName, o.lastName).replace(', ', ' '), str(o.email), str(o.primaryPhone), str(o.billingAddress)), kind: o.companyName ? 'business' : 'residential', contacts: people.map(c => ({ name: `${str(c.firstName)} ${str(c.lastName)}`.trim(), phone: str(c.phone ?? c.primaryPhone), email: str(c.email), role: '' })) })
        // The customer's default site is separate from job-specific addresses.
        if (place(o) || o.serviceAddress || o.fullAddress) { use('address', 'unit', 'city', 'state', 'zipcode', 'country', 'serviceAddress', 'fullAddress'); site(o.id, o, str(o.serviceAddress) || str(o.fullAddress)) }
        break
      }
      case 'users':
        use('name', 'emailAddress', 'cellPhone', 'active')
        add('technicians', o.id, { name: str(o.name) || 'Workiz staff', operatorId: null, email: str(o.emailAddress), phone: str(o.cellPhone), active: o.active !== false, branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'items':
        use('serialId', 'name', 'description', 'category', 'cost', 'price', 'taxable', 'active', 'type')
        add('services', o.id, { code: `WZ-${str(o.serialId) || str(o.id)}`, name: str(o.name) || 'Workiz item', description: str(o.description), unit: 'each', unitPrice: amount(o.price), unitCost: amount(o.cost ?? 0), tax: o.taxable === false ? 'FREE' : 'TAXABLE', category: str(o.category?.name), kind: o.type === 'service' ? 'service' : 'material', checklist: [], components: [], parts: [], images: [], archived: o.active === false })
        break
      case 'jobs':
      case 'leads': {
        use('clientInfo', 'name', 'description', 'serialId', 'status')
        const client = str(o.clientInfo?.clientId), k = site(client, o.clientInfo?.addressDetails)
        if (r.kind === 'leads') {
          add('enquiries', o.id, { description: str(o.description) || str(o.name) || 'Workiz lead', status: 'new', stageAt: null, createdAt: str(o.createdAt) || null, contacts: [], source: 'workiz' }, { customerId: ['customers', client], siteId: ['sites', k] })
          break
        }
        use('lineItems', 'totalPrice', 'taxAmount', 'date', 'endDate', 'isScheduled', 'team', 'notes', 'attachments')
        const status = str(o.status).toLowerCase()
        if (!['submitted', 'pending', 'in progress', 'done', 'completed', 'paid', 'canceled', 'cancelled'].includes(status)) fail('IMPORT_STATUS', 'This Workiz job status needs an explicit mapping before importing.', null, 400)
        const done = ['done', 'completed', 'paid'].includes(status)
        add('jobs', o.id, { ...jobFields(`WZ-${str(o.serialId) || str(o.id)}`, str(o.name) || str(o.description), done ? 'completed' : ['canceled', 'cancelled'].includes(status) ? 'cancelled' : 'open', price()), description: str(o.description), importedStatus: str(o.status) }, { customerId: ['customers', client], siteId: ['sites', k] })
        if (o.isScheduled && o.date && o.endDate) {
          if (!list(o.team).length) fail('IMPORT_TECHNICIAN', 'A scheduled Workiz job has no exported team members.', null, 400)
          for (const t of list(o.team)) add('visits', `${o.id}:${t.id}`, { startAt: str(o.date), endAt: str(o.endDate), status: done ? 'completed' : ['canceled', 'cancelled'].includes(status) ? 'cancelled' : 'booked' }, { jobId: ['jobs', str(o.id)], technicianId: ['technicians', str(t.id)] })
        }
        children(str(o.id))
        break
      }
      case 'estimates': {
        use('name', 'serialId', 'description', 'clientId', 'jobId', 'lineItems', 'total', 'taxAmount', 'notes')
        const job = bundle.records.find(x => x.kind === 'jobs' && x.sourceId === str(o.jobId))?.payload as any
        if (!job) fail('IMPORT_PARENT', 'An estimate needs its detailed job in jobs.json to identify the service site.', null, 400)
        const k = site(o.clientId, job.clientInfo?.addressDetails)
        add('quotes', o.id, { ...quoteFields(`WZ-Q-${str(o.serialId) || str(o.id)}`, str(o.name), price()), notes: str(o.notes) || str(o.description) }, { customerId: ['customers', str(o.clientId)], siteId: ['sites', k] })
        break
      }
      case 'invoices': {
        use('serialId', 'jobId', 'lineItems', 'totalPrice', 'taxAmount', 'amountDue', 'amountDueDate', 'created', 'notes', 'attachments')
        const dueOn = str(o.amountDueDate).slice(0, 10), issuedOn = str(o.created).slice(0, 10)
        if (!/^\d{4}-\d\d-\d\d$/.test(dueOn) || !/^\d{4}-\d\d-\d\d$/.test(issuedOn)) fail('IMPORT_DATE', 'An invoice needs its source issue and due dates.', null, 400)
        add('invoices', o.id, { number: `WZ-I-${str(o.serialId) || str(o.id)}`, status: 'imported', ...price(), notes: str(o.notes), openingBalance: { amount: amount(o.amountDue), asOf: batch.balanceAsOf, sourceTotal: amount(o.totalPrice), notForPosting: true }, dates: { issuedOn, dueOn, termsDays: 0, basis: 'opening balance from Workiz; not a Glove sale' } }, { jobId: ['jobs', str(o.jobId)] })
        children(str(o.jobId))
        break
      }
    }
    return out
  }
  return exportMapping(bundle, 'Workiz', 'workiz-v2-1', normalize, batch)
}
