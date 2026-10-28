import { type SourceBundle, type SourceRecord } from '../../modules/import-kit/src/d1/index'
import { localParts } from '../time'
import { fail } from '../model'
import { exportBundle } from './export-reader'
import { exportMapping, str, list, address, amount, priced, customerFields, jobFields, quoteFields, type Entity } from './export-mapping'
import { fieldpulseRecurrence, recurringColumns } from './fieldpulse-recurrence'

export const FIELDPULSE_LISTS = ['customers', 'locations', 'users', 'items', 'jobs', 'estimates', 'invoices', 'comments', 'assets'] as const
export const readFieldPulse = (files: unknown) => exportBundle(files, 'fieldpulse', FIELDPULSE_LISTS, 'response')
const sourceTime = (value: unknown) => {
  if (typeof value !== 'number' && !/^\d{10,13}$/.test(str(value))) return str(value)
  const ms = Number(value) * (String(value).length <= 10 ? 1000 : 1)
  return Number.isFinite(ms) && Math.abs(ms) < 8.64e15 ? new Date(ms).toISOString() : fail('IMPORT_TIME', 'Invalid FieldPulse timestamp.', null, 400)
}

/** FieldPulse Open API saved responses. Numeric status values follow its published create/update schemas. */
export function fieldpulseMapping(bundle: SourceBundle, batch: { timezone: string; balanceAsOf: string }) {
  const normalize = (r: SourceRecord, used: Set<string>): Entity[] => {
    const o: any = r.payload, out: Entity[] = []
    const use = (...names: string[]) => names.forEach(n => used.add(n)); use('id')
    const add = (kind: string, id: unknown, value: Record<string, any>, refs?: Entity['refs']) => out.push({ kind, id: str(id), value, refs })
    const siteId = (customer: unknown, location?: unknown) => location ? str(location) : `customer:${str(customer)}`
    const customer = (value: unknown) => bundle.records.find(x => x.kind === 'customers' && x.sourceId === str(value))?.payload as any
    const price = () => {
      const components = list(o.line_items).flatMap(l => list(l.line_components).map(c => ({ description: str(c.title) || str(c.description) || str(l.line_title), quantity: str(c.quantity), unitPrice: amount(c.unit_price), tax: c.taxable === false ? 'FREE' : 'TAXABLE' })))
      if (list(o.line_items).some(l => !list(l.line_components).length)) fail('IMPORT_LINES', 'An invoice or estimate line has no exported components.', null, 400)
      return priced(components)
    }
    switch (r.kind) {
      case 'assets': {
        use('title', 'status', 'asset_type', 'is_template', 'customer_id', 'location_id', 'manufacturer', 'model', 'serial_number', 'install_date', 'warranty_expiration', 'labor_warranty_expiration')
        if (o.status !== 'installed' || o.asset_type !== 'customer' || o.is_template === true) fail('IMPORT_EQUIPMENT', 'Only installed customer assets map to installed equipment; source templates, company assets and other states need review.', null, 400)
        if (!o.location_id) fail('IMPORT_EQUIPMENT', 'An installed asset needs its explicit exported location_id; no site is guessed.', null, 400)
        const date = (value: unknown) => {
          if (value === null || value === undefined) return ''
          if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 253402214400) return fail('IMPORT_DATE', 'Asset dates must be source Unix timestamps in seconds.', null, 400)
          return localParts(new Date(value * 1000).toISOString(), batch.timezone).date
        }
        for (const field of ['title', 'manufacturer', 'model', 'serial_number']) if (str(o[field]).length > 100) fail('IMPORT_EQUIPMENT', 'An asset field exceeds the native equipment length; review before importing.', null, 400)
        if (!str(o.title)) fail('IMPORT_EQUIPMENT', 'An installed asset needs its source title.', null, 400)
        add('equipment', o.id, { type: str(o.title), make: str(o.manufacturer), model: str(o.model), serial: str(o.serial_number), installedOn: date(o.install_date), manufacturerWarrantyUntil: date(o.warranty_expiration), laborWarrantyUntil: date(o.labor_warranty_expiration), refrigerant: '', location: '', photos: [] }, { customerId: ['customers', str(o.customer_id)], siteId: ['sites', str(o.location_id)] })
        break
      }
      case 'recurring-jobs': {
        use(...recurringColumns)
        const { parent, recurrence } = fieldpulseRecurrence(o, bundle, batch.timezone)
        add('jobs', `recurring:${r.sourceId}`, { ...jobFields(`FP-R-${r.sourceId}`, str(o.Title), 'open'), importedRecurrence: recurrence }, { customerId: ['customers', str(parent.customer_id)], siteId: ['sites', siteId(parent.customer_id, parent.location_id)] })
        break
      }
      case 'customers': {
        use('display_name', 'first_name', 'last_name', 'company_name', 'email', 'phone', 'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_zip_code', 'service_address_1', 'service_address_2', 'service_address_city', 'service_address_state', 'service_address_zip_code', 'account_type', 'status')
        const billing = address(o.billing_address_1, o.billing_address_2, o.billing_city, o.billing_state, o.billing_zip_code)
        add('customers', o.id, { ...customerFields(str(o.display_name) || str(o.company_name) || `${str(o.first_name)} ${str(o.last_name)}`.trim(), str(o.email), str(o.phone), billing), kind: o.account_type === 'company' ? 'business' : 'residential', archived: o.status === 'inactive' })
        const location = address(o.service_address_1, o.service_address_2, o.service_address_city, o.service_address_state, o.service_address_zip_code)
        if (location) add('sites', siteId(o.id), { address: location, zip: str(o.service_address_zip_code), accessNotes: '', branchId: null }, { customerId: ['customers', str(o.id)] })
        break
      }
      case 'locations':
        use('object_type', 'object_id', 'address_1', 'address_2', 'city', 'state', 'zip_code')
        if (o.object_type !== 'customer') fail('IMPORT_PARENT', 'Only customer locations map to Glove sites.', null, 400)
        add('sites', o.id, { address: address(o.address_1, o.address_2, o.city, o.state, o.zip_code), zip: str(o.zip_code), accessNotes: '', branchId: null }, { customerId: ['customers', str(o.object_id)] })
        break
      case 'users':
        use('first_name', 'last_name', 'email', 'phone')
        add('technicians', o.id, { name: `${str(o.first_name)} ${str(o.last_name)}`.trim() || 'FieldPulse staff', operatorId: null, email: str(o.email), phone: str(o.phone), active: true, branchId: null, skills: [], hours: [], timeOff: [], zips: [] })
        break
      case 'items':
        use('name', 'sku', 'default_description', 'default_unit_price', 'default_unit_cost', 'default_taxable', 'type', 'is_active')
        add('services', o.id, { code: str(o.sku) || `FP-${o.id}`, name: str(o.name), description: str(o.default_description), unit: 'each', unitPrice: amount(o.default_unit_price), unitCost: amount(o.default_unit_cost ?? 0), tax: o.default_taxable === false ? 'FREE' : 'TAXABLE', kind: o.type === 'service' ? 'service' : 'material', category: 'Imported from FieldPulse', checklist: [], components: [], parts: [], images: [], archived: o.is_active === false })
        break
      case 'jobs': {
        use('customer_id', 'location_id', 'job_type', 'subtitle', 'status', 'notes', 'field_notes', 'start_time', 'end_time', 'assignments', 'visits', 'recurring_parent_id')
        if (![1,2,3,4,5,6].includes(Number(o.status))) fail('IMPORT_STATUS', 'This custom FieldPulse job status needs an explicit mapping before importing.', null, 400)
        add('jobs', o.id, { ...jobFields(`FP-${o.id}`, str(o.subtitle) || str(o.job_type), Number(o.status) === 4 ? 'completed' : Number(o.status) === 5 ? 'cancelled' : 'open'), description: str(o.notes), workDone: str(o.field_notes), importedRecurrence: o.recurring_parent_id ? { parentId: str(o.recurring_parent_id), active: false, reason: 'Source occurrences only; no new bookings generated by the import.' } : null }, { customerId: ['customers', str(o.customer_id)], siteId: ['sites', siteId(o.customer_id, o.location_id)] })
        const people = list(o.assignments).flatMap(a => list(a.assigned_members)), visits = list(o.visits).length ? list(o.visits) : o.start_time && o.end_time ? [o] : []
        if (visits.length && !people.length) fail('IMPORT_TECHNICIAN', 'A scheduled FieldPulse job has no exported assigned members.', null, 400)
        for (const [i,v] of visits.entries()) for (const member of people) add('visits', `${o.id}:${str(v.id) || i}:${member}`, { startAt: sourceTime(v.start_time), endAt: sourceTime(v.end_time), status: Number(v.status ?? o.status) === 4 ? 'completed' : Number(v.status ?? o.status) === 5 ? 'cancelled' : 'booked', importedRecurrenceParent: o.recurring_parent_id ? str(o.recurring_parent_id) : null }, { jobId: ['jobs', str(o.id)], technicianId: ['technicians', str(member)] })
        break
      }
      case 'estimates':
      case 'invoices': {
        use('job_id', 'customer_id', 'location_id', 'title', 'notes', 'line_items', 'status')
        const job = bundle.records.find(x => x.kind === 'jobs' && x.sourceId === str(o.job_id))?.payload as any, client = str(o.customer_id ?? job?.customer_id)
        if (!customer(client)) fail('IMPORT_PARENT', 'The invoice or estimate customer is missing.', null, 400)
        if (r.kind === 'estimates') add('quotes', o.id, { ...quoteFields(`FP-Q-${o.id}`, str(o.title), price()), notes: str(o.notes) }, { customerId: ['customers', client], siteId: ['sites', siteId(client, o.location_id ?? job?.location_id)] })
        else {
          const report = bundle.records.find(x => x.kind === 'invoice-balances' && x.sourceId === str(o.id))?.payload as any
          if (!report) fail('IMPORT_BALANCE', 'Include invoice-balances.csv from the FieldPulse invoice report; its #ID must match this invoice id.', null, 400)
          const dueOn = str(report['Due Date']).slice(0, 10), issuedOn = str(report['Invoiced Date']).slice(0, 10)
          if (!/^\d{4}-\d\d-\d\d$/.test(dueOn) || !/^\d{4}-\d\d-\d\d$/.test(issuedOn)) fail('IMPORT_DATE', 'Export invoice report dates as YYYY-MM-DD.', null, 400)
          add('invoices', o.id, { number: `FP-I-${o.id}`, status: 'imported', ...price(), totals: { subtotal: amount(report['Pre-Tax Subtotal']), gst: amount(report.Tax), total: amount(report['Invoice Total']), currency: 'USD' }, notes: str(o.notes), openingBalance: { amount: amount(report['Amount Due']), asOf: batch.balanceAsOf, sourceTotal: amount(report['Invoice Total']), notForPosting: true }, dates: { issuedOn, dueOn, termsDays: 0, basis: 'opening balance from FieldPulse; not a Glove sale' } }, { jobId: ['jobs', str(o.job_id)] })
        }
        for (const c of list(o.line_items).flatMap(l => list(l.line_components))) for (const fileId of list(c.file_ids)) {
          const name = `attachments/${fileId}`, file = bundle.artifacts.find(f => f.name === name)
          add('captures', `attachment:${fileId}`, { kind: 'attachment', name: `FieldPulse attachment ${fileId}`, visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false, bytes: file ? { status: 'retained', artifact: name, sha256: file.sha256, size: file.size } : { status: 'missing', reason: 'The attachment bytes were not supplied.' } }, { jobId: ['jobs', str(o.job_id)] })
        }
        break
      }
      case 'invoice-balances':
        if (!bundle.records.some(x => x.kind === 'invoices' && x.sourceId === r.sourceId)) fail('IMPORT_PARENT', 'This report row has no matching detailed invoice in invoices.json.', null, 400)
        use('#ID', 'Pre-Tax Subtotal', 'Tax', 'Invoice Total', 'Amount Due', 'Invoiced Date', 'Due Date')
        break
      case 'comments':
        use('text', 'commentable_type', 'commentable_id')
        if (o.commentable_type !== 'job') fail('IMPORT_PARENT', 'Only job comments map to Glove job notes; the source comment stays in the journal.', null, 400)
        add('captures', o.id, { kind: 'note', text: str(o.text), visitId: null, technicianId: null, deviceTime: null, receivedAt: null, late: false }, { jobId: ['jobs', str(o.commentable_id)] })
        break
    }
    return out
  }
  return exportMapping(bundle, 'FieldPulse', 'fieldpulse-v1-1', normalize, batch)
}
