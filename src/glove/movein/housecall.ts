import { type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { fail } from '../model'
import { dollars } from '../money'
import { exportBundle } from './export-reader'
import { exportMapping, str, list, address, priced, customerFields, jobFields, type Entity } from './export-mapping'

export const HOUSECALL_LISTS = ['customers', 'employees', 'jobs', 'services', 'materials', 'leads'] as const
export const readHousecall = (files: unknown) => exportBundle(files, 'housecallpro', HOUSECALL_LISTS, 'data')
const place = (a: any) => a ? address(a.street, a.street_line_2, a.city, a.state, a.zip, a.country) : ''
/** Housecall monetary fields are integer cents; malformed or absent values never become zero. */
const money = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return fail('IMPORT_AMOUNT', 'Housecall Pro money must be a non-negative safe integer in cents.', null, 400)
  return dollars(value)
}

/** Saved public API responses only; source permissions and future schedules are never activated. */
export function housecallMapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }) {
  const normalize = (r: SourceRecord, used: Set<string>): Entity[] => {
    const o: any = r.payload, out: Entity[] = [], use = (...fields: string[]) => fields.forEach(f => used.add(f))
    const add = (kind: string, id: unknown, value: Record<string, any>, refs?: Entity['refs']) => out.push({ kind, id: str(id), value, refs })
    use('id')
    switch (r.kind) {
      case 'customers':
        use('first_name', 'last_name', 'company', 'email', 'mobile_number', 'home_number', 'work_number', 'addresses', 'do_not_service')
        add('customers', o.id, { ...customerFields(str(o.company) || `${str(o.first_name)} ${str(o.last_name)}`.trim(), str(o.email), str(o.mobile_number || o.home_number || o.work_number), place(list(o.addresses).find(a => a.type === 'billing'))), kind: o.company ? 'business' : 'residential', importedDoNotService: o.do_not_service === true })
        for (const a of list(o.addresses)) {
          if (!str(a.id)) fail('IMPORT_SITE', 'A Housecall Pro address needs its source id.', null, 400)
          add('sites', a.id, { address: place(a), zip: str(a.zip), accessNotes: '', branchId: null }, { customerId: ['customers', str(o.id)] })
        }
        break
      case 'leads': {
        use('number', 'customer', 'address', 'lead_source', 'status', 'pipeline_status', 'lost_at')
        if (!['open', 'won', 'lost'].includes(o.status)) fail('IMPORT_STATUS', 'This Housecall Pro lead status needs an explicit mapping.', null, 400)
        const refs: Entity['refs'] = { customerId: ['customers', str(o.customer?.id)] }
        if (o.address?.id) refs.siteId = ['sites', str(o.address.id)]
        add('enquiries', o.id, { description: `Housecall Pro lead ${str(o.number) || o.id}${o.pipeline_status ? `: ${str(o.pipeline_status)}` : ''}`, source: 'housecallpro', status: o.status === 'open' ? 'new' : o.status, stageAt: null, createdAt: null, contacts: [], importedStatus: o.status, importedLeadSource: str(o.lead_source), importedPipelineStatus: str(o.pipeline_status), ...(o.status === 'lost' ? { lostAt: str(o.lost_at) || null } : {}) }, refs)
        break
      }
      case 'employees':
        use('first_name', 'last_name', 'email', 'mobile_number')
        add('technicians', o.id, { name: `${str(o.first_name)} ${str(o.last_name)}`.trim(), email: str(o.email), phone: str(o.mobile_number), active: true, operatorId: null, branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'services':
      case 'materials':
        use('uuid', 'name', 'description', 'price', 'cost', 'taxable', 'unit_of_measure', 'part_number', 'task_number')
        add('services', `${r.kind}:${r.sourceId}`, { code: str(o.task_number || o.part_number) || `HCP-${r.sourceId}`, name: str(o.name), description: str(o.description), unit: str(o.unit_of_measure) || 'each', unitPrice: money(o.price), unitCost: money(o.cost), tax: o.taxable === true ? 'TAXABLE' : o.taxable === false ? 'FREE' : fail('IMPORT_ITEM', 'A price-book item needs its source taxable flag.', null, 400), kind: r.kind === 'services' ? 'service' : 'material', category: 'Imported from Housecall Pro', checklist: [], components: [], parts: [], images: [], archived: false })
        break
      case 'jobs': {
        use('invoice_number', 'description', 'customer', 'address', 'work_status', 'schedule', 'assigned_employees', 'notes', 'attachments')
        const status = str(o.work_status)
        if (!['needs scheduling','scheduled','in progress','complete rated','complete unrated','user canceled','pro canceled'].includes(status)) fail('IMPORT_STATUS', 'This Housecall Pro job status needs an explicit mapping.', null, 400)
        const done = status.startsWith('complete'), cancelled = status.endsWith('canceled')
        add('jobs', o.id, { ...jobFields(`HCP-${str(o.invoice_number) || o.id}`, str(o.description), done ? 'completed' : cancelled ? 'cancelled' : 'open'), importedStatus: status, ...(o.recurrence_rule ? { importedRecurrence: { active: false, proposal: null, source: { recurrence_rule: o.recurrence_rule, recurrence_number: o.recurrence_number }, reason: 'Source schedule retained; future Housecall Pro rules need review before creating a Glove series.' } } : {}) }, { customerId: ['customers', str(o.customer?.id)], siteId: ['sites', str(o.address?.id)] })
        if (o.schedule?.scheduled_start || o.schedule?.scheduled_end) {
          if (!list(o.assigned_employees).length) fail('IMPORT_TECHNICIAN', 'A scheduled Housecall Pro job needs an exported employee assignment.', null, 400)
          for (const employee of list(o.assigned_employees)) add('visits', `${o.id}:${employee.id}`, { startAt: str(o.schedule.scheduled_start), endAt: str(o.schedule.scheduled_end), status: done ? 'completed' : cancelled ? 'cancelled' : 'booked' }, { jobId: ['jobs', str(o.id)], technicianId: ['technicians', str(employee.id)] })
        }
        for (const note of list(o.notes)) {
          if (!str(note.id)) fail('IMPORT_NOTE', 'A job note needs its source id.', null, 400)
          add('captures', `note:${o.id}:${note.id}`, { kind: 'note', text: str(note.content), visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false }, { jobId: ['jobs', str(o.id)] })
        }
        for (const attachment of list(o.attachments)) {
          if (!str(attachment.id)) fail('IMPORT_ATTACHMENT', 'An attachment needs its source id.', null, 400)
          const name = `attachments/${attachment.id}`, file = bundle.artifacts.find(f => f.name === name)
          add('captures', `attachment:${o.id}:${attachment.id}`, { kind: 'attachment', name: str(attachment.file_name), visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false, bytes: file ? { status: 'retained', artifact: name, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The attachment bytes were not supplied.' } }, { jobId: ['jobs', str(o.id)] })
        }
        break
      }
      case 'job-invoices': {
        use('invoice_number', 'amount', 'subtotal', 'due_amount', 'due_at', 'invoice_date', 'items', 'taxes', 'discounts')
        const items = list(o.items).map(i => {
          if (!Number.isSafeInteger(i.qty_in_hundredths) || i.qty_in_hundredths <= 0) fail('IMPORT_AMOUNT', 'An invoice quantity must be positive integer hundredths.', null, 400)
          return { description: str(i.name) || str(i.description), quantity: (i.qty_in_hundredths / 100).toFixed(2), unitPrice: money(i.unit_price), tax: 'TAXABLE' }
        })
        const tax = list(o.taxes).reduce((sum, t) => { money(t.amount); return sum + t.amount }, 0)
        const gross = priced(items)
        if (gross.lines.some((line, index) => line.total !== money(o.items[index].amount))) fail('IMPORT_INVOICE', 'A source invoice item amount does not match its quantity and unit price.', null, 400)
        const discounts = list(o.discounts).map(d => ({ description: str(d.name) || str(d.description) || 'Imported discount', quantity: '1', unitPrice: d.amount === 0 ? '0.00' : `-${money(d.amount)}`, tax: 'FREE' }))
        const discount = list(o.discounts).reduce((sum, d) => { money(d.amount); return sum + d.amount }, 0)
        money(discount)
        const pricing = priced([...items, ...discounts], money(o.amount), money(tax))
        if (gross.totals.subtotal !== money(o.subtotal) || discount > o.subtotal || Number(o.subtotal) - discount + tax !== o.amount) fail('IMPORT_INVOICE', 'Source invoice lines and taxes do not reconcile to its total.', null, 400)
        const jobId = r.location.artifact.slice('job-invoices-'.length, -5)
        add('invoices', o.id, { number: `HCP-I-${str(o.invoice_number) || o.id}`, status: 'imported', ...pricing, openingBalance: { amount: money(o.due_amount), sourceTotal: money(o.amount), asOf: batch.balanceAsOf, notForPosting: true }, dates: { issuedOn: str(o.invoice_date).slice(0,10), dueOn: str(o.due_at).slice(0,10), termsDays: 0, basis: 'opening balance from Housecall Pro; not a Glove sale' } }, { jobId: ['jobs', jobId] })
        break
      }
    }
    return out
  }
  return exportMapping(bundle, 'HousecallPro', 'housecallpro-v1-2', normalize, batch)
}
