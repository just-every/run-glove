import { lines, totals } from '../glove/money'
import { instant, localParts } from '../glove/time'
import { collections, type Collection, type Context, type Row, type State } from '../glove/model'
import { invoices } from '../glove/commands/invoices'

// Harbour Air and its service/checklist come from tests/api/harness.mjs.
// Its first three clients, their sites and its technicians arrived with the
// ServiceM8 move-in (movein.ts); the rest are authored here. Everything is
// stored only in a demo's throwaway database.
type Person = { id: string; name: string; role: string }
export type MovedIn = { customers: Row[]; sites: Row[]; technicians: Row[] }

/** Demo dates in the business's zone, relative to the day the demo starts. */
export function demoClock(now: Date) {
 const zone = 'Australia/Sydney', today = localParts(now.toISOString(), zone).date
 const day = (offset: number) => new Date(Date.parse(today + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)
 const at = (offset: number, time = '09:00') => instant(day(offset), time, zone, 'demo date')
 return { zone, day, at }
}

export async function demoRecords(owner: Person, { zone, day, at }: ReturnType<typeof demoClock>, moved: MovedIn) {
 // Glove edits to moved-in records: the next version, no longer the move-in's revision.
 const updates: [Collection, Row][] = []
 const edit = (kind: Collection, row: Row, fields: Record<string, unknown>): Row => { const next: Row = { ...row, ...fields, version: row.version + 1 }; updates.push([kind, next]); return next }
 const records: [Collection, Row][] = [], events: { id: string; at: string; jobId: string | null; subjectKind: string; subjectId: string; kind: string; summary: string; by: Person }[] = []
 const add = (kind: Collection, id: string, fields: Record<string, unknown>, offset = -4): Row => {
  const row = { id, version: 1, createdAt: at(offset), ...fields }; records.push([kind, row]); return row
 }
 add('business', 'business', { name: 'Harbour Air & Electrical', abn: '51 824 753 556', timezone: zone, email: 'office@harbourair.example', phone: '02 9555 0100', address: 'Unit 3, 12 Robert St, Rozelle NSW 2039', paymentTermsDays: 14, currency: 'AUD', counters: { job: 1007, quote: 111, invoice: 3, export: 0 } }, -30)
 const checklist = [{ label: 'Isolate power', required: true }, { label: 'Clean filters', required: true }, { label: 'Check refrigerant pressure', required: true }, { label: 'Test run 10 minutes', required: false }]
 const services = [
  ['SPLIT-SVC', 'Split system service', '189.00', 'each'], ['DUCT-SVC', 'Ducted system service', '325.00', 'each'],
  ['R32-KG', 'R32 refrigerant', '95.00', 'kg'], ['FAULT', 'Electrical fault finding', '145.00', 'hour'],
 ].map(([code, name, unitPrice, unit], i) => add('services', `demo-service-${i}`, { code, name, unitPrice, unit, tax: 'GST', checklist: i < 2 ? checklist : [], archived: false }, -25))
 const customers = [
  ['Harbourview Dental', 'Dr Mei Lin', '14 Harbour St, Balmain NSW 2041', 'Reception opens at 8:00; isolate the treatment room first.'],
  ['Balmain Bakehouse', 'Luca Marino', '88 Darling St, Balmain NSW 2041', 'Use the side entrance; avoid the morning bread delivery.'],
  ['Rozelle Physio', 'Emma Chen', '5 Victoria Rd, Rozelle NSW 2039', 'Check in with the practice manager.'],
  ['Birchgrove Early Learning', 'Sarah Patel', '22 Grove St, Birchgrove NSW 2041', 'Sign the visitor register. Work outside nap time.'],
  ['White Bay Studios', 'James Wilson', '42 Mullens St, Balmain NSW 2041', 'Loading bay access from the rear lane.'],
 ].map(([name, contact, address, accessNotes], i) => {
  if (i < moved.customers.length) {
   const customer = moved.customers[i], site = moved.sites.find(s => s.customerId === customer.id)!
   return { customer, site: edit('sites', site, { accessNotes }) }
  }
  const customer = add('customers', `demo-customer-${i}`, { name, contact, email: `accounts@${['harbourview','balmainbakehouse','rozellephysio','birchgrovelearning','whitebaystudios'][i]}.example`, phone: `02 9555 01${10 + i}`, billingAddress: address, abn: '' }, -20 + i)
  const site = add('sites', `demo-site-${i}`, { customerId: customer.id, address, accessNotes }, -20 + i)
  return { customer, site }
 })
 const technicians = moved.technicians.map((t, i) => edit('technicians', t, { operatorId: `demo-person-${i}` }))
 const titles = ['Split system service', 'Bakery air conditioning inspection', 'Treatment room air conditioning', 'Classroom ducted service', 'Studio electrical fault finding', 'Quarterly split system clean', 'Shopfront split system service', 'Split system condition assessment', 'Reception split system service', 'Annual ducted maintenance', 'Workshop electrical fault finding']
 const agent = { id: 'demo-assistant', name: 'Ada · planning assistant', role: 'agent' }
 for (let i = 0; i < titles.length; i++) {
  const { customer, site } = customers[i % customers.length], service = services[i === 3 || i === 9 ? 1 : i === 4 || i === 10 ? 3 : 0]
  const priced = lines([{ description: service.name, quantity: i === 3 ? '2' : '1', unitPrice: service.unitPrice, tax: 'GST', serviceId: service.id }]), total = totals(priced)
  const status = i < 7 ? 'accepted' : ['draft', 'accepted', 'sent', 'draft'][i - 7], preparedBy = i === 7 ? agent : owner
  const approval = status === 'draft' ? null : { ...owner, at: at(-3, '10:00') }
  const enquiry = add('enquiries', `demo-enquiry-${i}`, { customerId: customer.id, siteId: site.id, description: titles[i], channel: i % 2 ? 'email' : 'phone', status: 'quoted', quoteId: `demo-quote-${i}`, createdBy: owner }, -5)
  const quote = add('quotes', `demo-quote-${i}`, { number: `Q-${101 + i}`, customerId: customer.id, siteId: site.id, enquiryId: enquiry.id, title: titles[i], status, revisions: [{ n: 1, lines: priced, totals: total, notes: 'Includes labour, standard service consumables and a written service report.', preparedBy, preparedAt: at(-4), approval }], sent: status === 'sent' || status === 'accepted' ? [{ revision: 1, channel: 'email', note: 'Office recorded the quote sent from their inbox.', recordedBy: owner, at: at(-3, '11:00') }] : [], acceptance: status === 'accepted' ? { revision: 1, method: 'phone', customerName: customer.contact, note: 'Approved the service and access arrangements.', recordedBy: owner, at: at(-2, '10:00') } : null, jobId: i < 7 ? `demo-job-${i}` : null }, -4)
  if (approval) add('approvals', `demo-price-approval-${i}`, { createdAt: approval.at, subjectKind: 'quote', subjectId: quote.id, subjectLabel: `${quote.number} revision 1 · $${total.total} inc GST`, revision: 1, preparedBy, approvedBy: owner, decision: 'approved', note: '' }, -3)
  if (i >= 7) continue
  const completed = i >= 3, offset = completed ? -1 : 0, technician = technicians[i % 3]
  const job = add('jobs', `demo-job-${i}`, { number: `J-${1001 + i}`, quoteId: quote.id, quoteRevision: 1, customerId: customer.id, siteId: site.id, title: titles[i], lines: priced, totals: total, checklist: (service.checklist as typeof checklist).map((item, n) => ({ id: `demo-check-${i}-${n}`, ...item })), status: completed ? 'completed' : 'open', source: null }, -2)
  // J-1007 took Priya's free afternoon yesterday and is still waiting for its invoice.
  const start = i === 6 ? '13:00' : ['08:00', '09:30', '11:00'][i % 3], end = i === 6 ? '14:30' : ['09:30', '11:00', '12:30'][i % 3]
  const slot = { technicianId: technician.id, startAt: at(offset, start), endAt: at(offset, end), local: { date: day(offset), start, end } }
  const arrival = completed || i === 0 ? { technicianId: technician.id, by: { id: `demo-person-${i % 3}`, name: technician.name, role: 'technician' }, deviceTime: at(offset, start), receivedAt: at(offset, start) } : null
  const completion = completed ? { summary: i === 4 ? 'Located a loose terminal, secured the connection and tested circuit operation.' : 'Filters and coils cleaned; operation checked and cooling restored.', signoff: { absentReason: 'Customer requested the report by email; reception confirmed the work.' }, by: { id: `demo-person-${i % 3}`, name: technician.name, role: 'technician' }, deviceTime: at(offset, end), receivedAt: at(offset, end) } : null
  const visit = add('visits', `demo-visit-${i}`, { jobId: job.id, ...slot, status: completed ? 'completed' : arrival ? 'arrived' : 'booked', assignments: [{ ...slot, by: owner, at: at(-2), reason: 'Confirmed access with the customer.', reviewedConflicts: [], proposalId: null }], arrival, completion, lateEvidence: [] }, -2)
  if (completed) {
   for (const item of job.checklist) add('captures', `demo-capture-${item.id}`, { kind: 'checklist', visitId: visit.id, jobId: job.id, technicianId: technician.id, itemId: item.id, label: item.label, result: 'done', note: '', deviceTime: at(-1, start), receivedAt: at(-1, end), late: false }, -1)
   add('captures', `demo-note-${i}`, { kind: 'note', visitId: visit.id, jobId: job.id, technicianId: technician.id, text: i === 4 ? 'Circuit retested under load; no further faults found. Recheck at the next scheduled maintenance visit.' : 'Unit operating normally after service. Recommend the next preventative visit in six months.', deviceTime: at(-1, end), receivedAt: at(-1, end), late: false }, -1)
   if (i < 6) add('invoices', `demo-invoice-${i}`, { number: `INV-000${i - 2}`, jobId: job.id, customerId: customer.id, status: i === 5 ? 'draft' : 'approved', revisions: [{ n: 1, lines: priced, totals: total, preparedBy: owner, preparedAt: i === 3 ? at(-1, '16:00') : at(0, '07:00'), approval: i === 3 ? { ...owner, at: at(-1, '16:20') } : i === 4 ? { ...owner, at: at(0, '07:15') } : null, export: null }] }, i === 3 ? -1 : 0)
  }
  events.push({ id: `demo-event-${i}`, at: at(completed ? -1 : 0, completed ? end : start), jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: completed ? 'visit.completed' : 'visit.booked', by: completed ? { id: `demo-person-${i % 3}`, name: technician.name, role: 'technician' } : owner, summary: completed ? `${job.number} completed by ${technician.name}; service notes recorded` : `${job.number} booked for ${technician.name} ${start}–${end}` })
 }
 add('enquiries', 'demo-open-enquiry', { customerId: customers[2].customer.id, siteId: customers[2].site.id, description: 'Reception air conditioner rattles at startup; please inspect this week.', channel: 'phone', status: 'open', createdBy: owner }, 0)
 // Yesterday's export ran through Glove's own export command, when only INV-0001 was approved.
 const s = { version: 0 } as State
 for (const kind of collections) s[kind] = records.filter(([k]) => k === kind).map(([, row]) => row)
 const later = s.invoices.filter(inv => inv.id !== 'demo-invoice-3')
 s.invoices = s.invoices.filter(inv => !later.includes(inv))
 const c: Context = { s, actor: { id: owner.id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: 0 }, commandId: 'demo-export-1', now: at(-1, '16:30'), events: [], files: [], sql: [] }
 await invoices(c, 'invoice.export', {}, undefined as never)
 s.invoices.push(...later)
 records.splice(0, records.length, ...collections.flatMap(kind => s[kind].map(row => [kind, row] as [Collection, Row])))
 events.push(...c.events.map(e => ({ ...e, at: c.now, by: owner })))
 events.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
 return { records, updates, events }
}
