import { lines, totals } from '../glove/money'
import { instant, localParts } from '../glove/time'
import { collections, type Collection, type Context, type Row, type State } from '../glove/model'
import { invoices } from '../glove/commands/invoices'

// Pacheco Plumbing & HVAC, a six-technician shop in Austin, Texas, on a
// working day: its technicians and three longest-standing clients arrived
// with the ServiceM8 move-in (movein.ts); the rest is authored here. Today's
// board holds eighteen visits (three finished, three on site), Greg Hollis's
// condensate pump job is waiting on a part still on order, five jobs wait for
// a visit and the agent has proposed a slot for the urgent no-heat call.
// Yesterday's finished work is invoiced, approved and exported. Everything is
// stored only in a demo's throwaway database.
type Person = { id: string; name: string; role: string }
export type MovedIn = { customers: Row[]; sites: Row[]; technicians: Row[] }

/** Demo dates in the business's zone, relative to the day the demo starts. */
export function demoClock(now: Date) {
 const zone = 'America/Chicago', today = localParts(now.toISOString(), zone).date
 const day = (offset: number) => new Date(Date.parse(today + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10)
 const at = (offset: number, time = '09:00') => instant(day(offset), time, zone, 'demo date')
 return { zone, day, at }
}

/** Today's board: job number, technician (DEMO_TECHNICIANS order), times, state, customer, contact, address, title, price-book item, kind. */
const board = [
 [1047, 0, '08:00', '10:00', 'completed', 'Linh Nguyen', 'Linh Nguyen', '4105 Park Ln, Austin, TX 78723', 'Drain line clearing', 'DRAIN-CLR', 'job'],
 [1042, 0, '10:15', '12:45', 'booked', 0, '', '', 'Leaking water heater', 'WH-INSTALL', 'job'],
 [1051, 0, '13:00', '15:30', 'booked', 'Joan Cooper', 'Joan Cooper', '8801 Davis Ln, Austin, TX 78749', 'AC tune-up', 'AC-TUNE', 'plan'],
 [1036, 1, '08:00', '10:45', 'arrived', 'Ana Martinez', 'Ana Martinez', '720 W 9th St, Austin, TX 78703', 'Water heater install', 'WH-INSTALL', 'job'],
 [1045, 1, '11:00', '12:30', 'booked', 'Ruth Anderson', 'Ruth Anderson', '2901 Hillcrest Ave, Austin, TX 78757', 'Bathroom repipe quote', '', 'assessment'],
 [1048, 1, '13:00', '15:30', 'booked', 'David Kim', 'David Kim', '1020 Cedar St, Austin, TX 78702', 'Faucet repair', 'FAUCET', 'job'],
 [1038, 2, '08:00', '10:00', 'completed', 'Tom Evans', 'Tom Evans', '5607 Brodie Ln, Austin, TX 78745', 'AC not cooling', 'AC-DIAG', 'job'],
 [1044, 2, '10:30', '12:30', 'booked', 1, '', '', 'Replace condensate pump', 'CPUMP', 'job'],
 [1049, 2, '13:00', '15:00', 'booked', 'Gary Turner', 'Gary Turner', '6400 Wilshire Blvd, Austin, TX 78741', 'Water softener quote', '', 'assessment'],
 [1039, 3, '08:00', '10:45', 'arrived', 2, '', '', 'Maintenance plan visit', 'PLAN-VISIT', 'plan'],
 [1046, 3, '11:00', '13:30', 'booked', 'Rosa Lopez', 'Rosa Lopez', '3407 Menchaca Rd, Austin, TX 78704', 'Pipe repair', 'PIPE-RPR', 'job'],
 [1052, 3, '13:45', '16:00', 'booked', 'Susan Clark', 'Susan Clark', '7800 Shoal Creek Blvd, Austin, TX 78757', 'Water heater flush', 'WH-FLUSH', 'job'],
 [1040, 4, '08:00', '10:00', 'completed', 'Arjun Singh', 'Arjun Singh', '912 W Lynn St, Austin, TX 78703', 'Toilet repair', 'TOILET', 'job'],
 [1053, 4, '14:30', '16:00', 'booked', 'Wright Properties', 'Ellen Wright', '2500 Exposition Blvd, Austin, TX 78703', 'AC tune-up', 'AC-TUNE', 'plan'],
 [1041, 5, '08:30', '10:30', 'arrived', 'Carlos Diaz', 'Carlos Diaz', '6601 McNeil Dr, Austin, TX 78729', 'Tankless water heater quote', '', 'assessment'],
 [1043, 5, '10:45', '13:00', 'booked', 'Megan Parker', 'Megan Parker', '9516 Great Hills Trl, Austin, TX 78759', 'Leak detection', 'LEAK-DET', 'job'],
 [1050, 5, '13:15', '15:45', 'booked', 'Ben Thomas', 'Ben Thomas', '1400 Barton Springs Rd, Austin, TX 78704', 'Kitchen sink install', 'SINK', 'job'],
] as const

/** Jobs waiting for a visit: number, customer, contact, address, title, price-book item, how the job started. */
const waiting = [
 [1054, 'Brooks Family', 'Erin Brooks', '4513 Clawson Rd, Austin, TX 78745', 'No heat', 'FURN-DIAG', 'call'],
 [1055, 'Dana Whitfield', 'Dana Whitfield', '1807 S 5th St, Austin, TX 78704', 'Water heater flush', 'WH-FLUSH', 'quote'],
 [1056, 'Rivera Properties', 'Luis Rivera', '1512 W 6th St, Austin, TX 78703', 'AC tune-up', 'AC-TUNE', 'quote'],
 [1057, 'Rohan Patel', 'Rohan Patel', '9300 Waterford Centre Blvd, Austin, TX 78758', 'Garbage disposal replacement', 'DISPOSAL', 'quote'],
 [1058, 'Maria Garcia', 'Maria Garcia', '4200 Bull Creek Rd, Austin, TX 78731', 'Sewer camera inspection', 'CAMERA', 'quote'],
] as const

/** Yesterday's finished work: number, technician, times, customer, contact, address, title, item, invoice state. */
const yesterday = [
 [1032, 3, '13:00', '15:00', 'Owen Reyes', 'Owen Reyes', '2210 Pearl St, Austin, TX 78705', 'Water heater flush', 'WH-FLUSH', null],
 [1033, 0, '08:00', '10:00', 'Hannah Scott', 'Hannah Scott', '3301 Duval St, Austin, TX 78705', 'Leak detection', 'LEAK-DET', 'exported'],
 [1034, 1, '10:30', '12:30', 'Moore Bakery', 'Kevin Moore', '1100 E 6th St, Austin, TX 78702', 'Drain line clearing', 'DRAIN-CLR', 'approved'],
 [1035, 5, '13:00', '15:00', 'Priscilla Young', 'Priscilla Young', '5700 Burnet Rd, Austin, TX 78756', 'Toilet repair', 'TOILET', 'draft'],
] as const

export async function demoRecords(owner: Person, { zone, day, at }: ReturnType<typeof demoClock>, moved: MovedIn) {
 // Glove edits to moved-in records: the next version, no longer the move-in's revision.
 const updates: [Collection, Row][] = []
 const edit = (kind: Collection, row: Row, fields: Record<string, unknown>): Row => { const next: Row = { ...row, ...fields, version: row.version + 1 }; updates.push([kind, next]); return next }
 const records: [Collection, Row][] = [], events: { id: string; at: string; jobId: string | null; subjectKind: string; subjectId: string; kind: string; summary: string; by: Person }[] = []
 const add = (kind: Collection, id: string, fields: Record<string, unknown>, offset = -4): Row => {
  const row = { id, version: 1, createdAt: at(offset), ...fields }; records.push([kind, row]); return row
 }
 add('business', 'business', { name: 'Pacheco Plumbing & HVAC', abn: '74-3920518', timezone: zone, email: 'office@pachecoplumbing.example', phone: '(512) 555-0142', address: '4100 S Congress Ave, Austin, TX 78745', paymentTermsDays: 30, currency: 'USD', legalName: 'Pacheco Plumbing & HVAC LLC', dba: 'Pacheco Plumbing & HVAC', licenses: [{ trade: 'Plumbing', state: 'TX', number: 'M-41872' }, { trade: 'HVAC', state: 'TX', number: 'TACLA38214C' }], insurance: { carrier: 'The Hartford', policy: 'GL-5520187', expires: '2027-03-31' }, counters: { job: 1058, quote: 124, invoice: 3, export: 0, po: 3 } }, -30)
 const checklist = { 'AC-TUNE': [{ label: 'Replace the filter', required: true }, { label: 'Clear the condensate line', required: true }, { label: 'Check refrigerant pressures', required: true }, { label: 'Test run 10 minutes', required: false }], 'PLAN-VISIT': [{ label: 'Replace the filters', required: true }, { label: 'Check belts and drains', required: true }], 'WH-FLUSH': [{ label: 'Turn off gas or power', required: true }, { label: 'Flush the tank', required: true }, { label: 'Test the relief valve', required: false }] } as Record<string, { label: string; required: boolean }[]>
 // Labor is tax-exempt; the condensate pump is a stocked material bought on purchase orders.
 const items = [
  ['WH-FLUSH', 'Water heater flush', '189.00', 'Water heaters'], ['WH-INSTALL', 'Water heater replacement, 50 gal gas', '1850.00', 'Water heaters'],
  ['AC-TUNE', 'AC tune-up', '129.00', 'HVAC'], ['AC-DIAG', 'AC not cooling diagnosis', '149.00', 'HVAC'], ['CPUMP', 'Condensate pump replacement', '385.00', 'HVAC'],
  ['FURN-DIAG', 'No-heat diagnosis', '129.00', 'HVAC'], ['PLAN-VISIT', 'Maintenance plan visit', '149.00', 'Plans'], ['DRAIN-CLR', 'Drain line clearing', '225.00', 'Plumbing'],
  ['LEAK-DET', 'Leak detection', '295.00', 'Plumbing'], ['FAUCET', 'Faucet repair', '185.00', 'Plumbing'], ['TOILET', 'Toilet repair', '165.00', 'Plumbing'],
  ['PIPE-RPR', 'Pipe repair', '340.00', 'Plumbing'], ['SINK', 'Kitchen sink install', '420.00', 'Plumbing'], ['DISPOSAL', 'Garbage disposal replacement', '365.00', 'Plumbing'],
  ['CAMERA', 'Sewer camera inspection', '275.00', 'Plumbing'],
 ].map(([code, name, unitPrice, category], i) => add('services', `demo-service-${i}`, { code, name, kind: 'service', category, unitPrice, unitCost: '0.00', unit: 'each', tax: 'FREE', checklist: checklist[code] ?? [], archived: false }, -25))
 const pump = add('services', 'demo-material-pump', { code: 'CP-115', name: 'Condensate pump, 115 V', kind: 'material', category: 'HVAC parts', unitPrice: '129.00', unitCost: '68.00', unit: 'each', tax: 'FREE', checklist: [], archived: false }, -25)
 const item = (code: string) => items.find(x => x.code === code)!
 const technicians = moved.technicians.map((t, i) => edit('technicians', t, { operatorId: `demo-person-${i}`, hours: ['mon', 'tue', 'wed', 'thu', 'fri'].map(d => ({ day: d, start: '08:00', end: '16:00' })), skills: [i % 2 ? 'Plumbing' : 'HVAC'] }))
 const vans = technicians.map((t, i) => add('stock', `demo-van-${i}`, { kind: 'van', name: `Van ${[3, 1, 4, 2, 5, 6][i]}`, technicianId: t.id, pars: {}, counts: {}, archived: false }, -20))
 add('stock', 'demo-warehouse', { kind: 'warehouse', name: 'Shop', technicianId: null, pars: { [pump.id]: 2000 }, counts: { [pump.id]: 0 }, archived: false }, -20)

 // Customers and their sites: the three moved in, then one per authored address.
 const places = new Map<string, { customer: Row; site: Row }>()
 moved.customers.forEach((customer, i) => { const site = moved.sites.find(s => s.customerId === customer.id)!; places.set(String(i), { customer, site: i === 1 ? edit('sites', site, { accessNotes: 'Unit is in the attic; ladder in the garage.' }) : site }) })
 const place = (who: string | number, contact: string, address: string) => {
  const key = typeof who === 'number' ? String(who) : address
  if (!places.has(key)) {
   const n = places.size, customer = add('customers', `demo-customer-${n}`, { name: who, kind: /Properties|Bakery|Group/.test(String(who)) ? 'business' : 'residential', contact, email: `${String(contact).toLowerCase().replace(/\s+/g, '.')}@example.com`, phone: `(512) 555-0${String(150 + n).padStart(3, '0')}`, billingAddress: address, abn: '' }, -20)
   places.set(key, { customer, site: add('sites', `demo-site-${n}`, { customerId: customer.id, address, accessNotes: '' }, -20) })
  }
  return places.get(key)!
 }

 const agent = { id: 'demo-assistant', name: 'Glove agent', role: 'agent' }
 let quoteNumber = 101
 /** A job as its source made it: an accepted quote, a service call or an assessment on a request. */
 const job = (number: number, title: string, code: string, kind: string, where: { customer: Row; site: Row }, status: string, offset: number) => {
  const service = code ? item(code) : null
  const priced = service ? lines([{ description: service.name, quantity: '1', unitPrice: service.unitPrice, tax: 'FREE', serviceId: service.id }]) : [], total = totals(priced)
  const base = { number: `J-${number}`, customerId: where.customer.id, siteId: where.site.id, lines: priced, totals: service ? total : null, checklist: (service?.checklist as { label: string; required: boolean }[] ?? []).map((c, n) => ({ id: `demo-check-${number}-${n}`, ...c })), forms: [], equipmentIds: [], status, source: null }
  if (kind === 'assessment') {
   const enquiry = add('enquiries', `demo-enquiry-${number}`, { customerId: where.customer.id, siteId: where.site.id, description: title, source: 'phone', status: 'contacted', stageAt: at(offset - 1), contacts: [], assessmentJobId: `demo-job-${number}`, createdBy: owner }, offset - 2)
   return add('jobs', `demo-job-${number}`, { ...base, kind: 'assessment', enquiryId: enquiry.id, quoteId: null, quoteRevision: null, title: `Assessment: ${title}`, instructions: 'Measure up and photograph the existing setup for the quote.', assessment: { by: owner, at: at(offset - 1) } }, offset)
  }
  if (kind === 'call') return add('jobs', `demo-job-${number}`, { ...base, quoteId: null, quoteRevision: null, title, serviceCall: { enquiryId: null, by: owner, at: at(0, '07:40') } }, 0)
  const n = quoteNumber++, approval = { ...owner, at: at(offset - 2, '10:00') }
  const enquiry = add('enquiries', `demo-enquiry-${number}`, { customerId: where.customer.id, siteId: where.site.id, description: title, source: n % 2 ? 'email' : 'phone', status: 'won', stageAt: at(offset - 1, '10:00'), wonAt: at(offset - 1, '10:00'), wonQuoteId: `demo-quote-${number}`, contacts: [], quoteId: `demo-quote-${number}`, createdBy: owner }, offset - 4)
  add('quotes', `demo-quote-${number}`, { number: `Q-${n}`, customerId: where.customer.id, siteId: where.site.id, enquiryId: enquiry.id, title, status: 'accepted', revisions: [{ n: 1, lines: priced, totals: total, notes: 'Includes labor, standard materials and a written service report.', preparedBy: owner, preparedAt: at(offset - 3), approval }], sent: [{ revision: 1, channel: 'email', note: 'Office recorded the quote sent from their inbox.', recordedBy: owner, at: at(offset - 2, '11:00') }], acceptance: { revision: 1, method: 'phone', customerName: where.customer.contact, note: 'Approved the work and the arrival window.', recordedBy: owner, at: at(offset - 1, '10:00') }, jobId: `demo-job-${number}` }, offset - 3)
  add('approvals', `demo-price-approval-${number}`, { createdAt: approval.at, subjectKind: 'quote', subjectId: `demo-quote-${number}`, subjectLabel: `Q-${n} revision 1 · $${total.total} incl. tax`, revision: 1, preparedBy: owner, approvedBy: owner, decision: 'approved', note: '' }, offset - 2)
  return add('jobs', `demo-job-${number}`, { ...base, quoteId: `demo-quote-${number}`, quoteRevision: 1, title }, offset)
 }
 /** A visit, with what the technician recorded if it started or finished. */
 const visit = (j: Row, techIndex: number, offset: number, start: string, end: string, status: string, plan: boolean) => {
  const technician = technicians[techIndex], by = { id: `demo-person-${techIndex}`, name: technician.name, role: 'technician' }
  const slot = { technicianId: technician.id, startAt: at(offset, start), endAt: at(offset, end), local: { date: day(offset), start, end } }
  const arrival = status !== 'booked' ? { technicianId: technician.id, by, deviceTime: at(offset, start), receivedAt: at(offset, start) } : null
  const completion = status === 'completed' ? { summary: `${j.title} done; tested and left running. Customer walked through the work.`, signoff: { absentReason: 'Customer was at work; the report goes by email.' }, by, deviceTime: at(offset, end), receivedAt: at(offset, end) } : null
  const row = add('visits', `demo-visit-${j.number}`, { jobId: j.id, ...slot, status, ...(plan ? { series: { rev: 1, occurrence: day(offset) } } : {}), assignments: [{ ...slot, by: owner, at: at(offset - 2), reason: plan ? 'Series every 6 months' : 'Confirmed the arrival window with the customer.', reviewedConflicts: [], proposalId: null }], arrival, completion, lateEvidence: [] }, offset - 2)
  if (completion) for (const c of j.checklist) add('captures', `demo-capture-${c.id}`, { kind: 'checklist', visitId: row.id, jobId: j.id, technicianId: technician.id, itemId: c.id, label: c.label, result: 'done', note: '', deviceTime: at(offset, end), receivedAt: at(offset, end), late: false }, offset)
  if (completion) add('captures', `demo-note-${j.number}`, { kind: 'note', visitId: row.id, jobId: j.id, technicianId: technician.id, text: 'Work finished and tested. Recommended the next service in six months.', deviceTime: at(offset, end), receivedAt: at(offset, end), late: false }, offset)
  events.push({ id: `demo-event-${j.number}`, at: at(offset, status === 'completed' ? end : start), jobId: j.id, subjectKind: 'visit', subjectId: row.id, kind: status === 'completed' ? 'visit.completed' : 'visit.booked', by: status === 'completed' ? by : owner, summary: status === 'completed' ? `${j.number} completed by ${technician.name}; service notes recorded` : `${j.number} booked for ${technician.name} ${start}–${end}` })
  return row
 }

 for (const [number, tech, start, end, status, who, contact, address, title, code, kind] of board) {
  const where = typeof who === 'number' ? places.get(String(who))! : place(who, contact, address)
  let j = job(number, title, code, kind === 'plan' ? 'quote' : kind, where, status === 'completed' ? 'completed' : 'open', -1)
  // Plan visits belong to a job that repeats every six months (PLAN-001).
  if (kind === 'plan') { j = { ...j, series: { revisions: [{ n: 1, from: day(0), rule: { unit: 'month', interval: 6, months: null, day: null, nth: null, weekday: null }, start, end, technicianId: technicians[tech].id, by: owner, at: at(-2) }], until: null, horizonDays: 30, through: day(30), missed: [] } }; records[records.findIndex(([, r]) => r.id === j.id)] = ['jobs', j] }
  visit(j, tech, 0, start, end, status, kind === 'plan')
 }
 for (const [number, who, contact, address, title, code, source] of waiting) job(number, title, code, source, place(who, contact, address), 'open', 0)
 for (const [number, tech, start, end, who, contact, address, title, code, invoice] of yesterday) {
  const j = job(number, title, code, 'quote', place(who, contact, address), 'completed', -2)
  visit(j, tech, -1, start, end, 'completed', false)
  if (invoice) add('invoices', `demo-invoice-${number}`, { number: `INV-000${number - 1032}`, jobId: j.id, customerId: j.customerId, status: invoice === 'draft' ? 'draft' : 'approved', revisions: [{ n: 1, lines: j.lines, totals: j.totals, preparedBy: owner, preparedAt: at(-1, '16:00'), approval: invoice === 'draft' ? null : { ...owner, at: at(-1, '16:20') }, export: null }] }, -1)
 }

 // Greg's condensate pump is on order from the supplier for J-1044: sent yesterday, not received.
 add('purchaseOrders', 'demo-po-3', { number: 'PO-0003', status: 'sent', supplier: 'Ferguson Plumbing Supply', supplierEmail: 'austin.orders@ferguson.example', locationId: vans[2].id, jobId: 'demo-job-1044', lines: [{ id: 'demo-po-3-line', serviceId: pump.id, code: pump.code, description: pump.name, unit: 'each', quantity: '1', unitCost: '68.00', total: '68.00', received: '0' }], total: '68.00', note: 'Backordered at the branch; supplier promised the next truck.', sent: { method: 'phone', reference: 'FPS-88213', by: owner, at: at(-1, '15:10') }, receipts: [], by: owner }, -1)
 // Everyone clocked in this morning (COST-001).
 technicians.forEach((t, i) => add('times', `demo-shift-${i}`, { technicianId: t.id, kind: 'shift', visitId: null, jobId: null, startAt: at(0, '07:45'), endAt: null, startReceivedAt: at(0, '07:45'), endReceivedAt: null, original: null, corrections: [] }, 0))
 // The agent's proposal for the urgent no-heat call: Priya's open late morning.
 add('proposals', 'demo-proposal-1054', { kind: 'dispatch', status: 'pending', jobId: 'demo-job-1054', plan: { jobId: 'demo-job-1054', technicianId: technicians[4].id, date: day(0), start: '10:15', end: '12:30' }, rationale: 'Priya is free from 10:00 to 2:30 and is 15 minutes from the Brooks house; the call is marked urgent.', evidence: ['Priya Nair has no visit from 10:00 AM to 2:30 PM today', 'J-1054 is a no-heat service call taken at 7:40 AM'], preparedBy: agent, conflictsWhenPrepared: [] }, 0)
 events.push({ id: 'demo-event-proposal', at: at(0, '07:50'), jobId: 'demo-job-1054', subjectKind: 'proposal', subjectId: 'demo-proposal-1054', kind: 'proposal.prepared', summary: `Glove agent (agent) proposed J-1054 → Priya Nair ${day(0)} 10:15–12:30; waiting for approval`, by: agent })
 add('enquiries', 'demo-open-enquiry', { customerId: places.get('2')!.customer.id, siteId: places.get('2')!.site.id, description: 'Front office restroom faucet drips constantly; please look this week.', source: 'email', status: 'new', stageAt: at(0, '07:20'), contacts: [], createdBy: owner }, 0)

 // Yesterday's export ran through Glove's own export command, when only INV-0001 was approved.
 const s = { version: 0 } as State
 for (const kind of collections) s[kind] = records.filter(([k]) => k === kind).map(([, row]) => row)
 const later = s.invoices.filter(inv => inv.id !== 'demo-invoice-1033')
 s.invoices = s.invoices.filter(inv => !later.includes(inv))
 const c: Context = { s, actor: { id: owner.id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: 0 }, commandId: 'demo-export-1', now: at(-1, '16:30'), events: [], files: [], sql: [] }
 await invoices(c, 'invoice.export', {}, undefined as never)
 s.invoices.push(...later)
 records.splice(0, records.length, ...collections.flatMap(kind => s[kind].map(row => [kind, row] as [Collection, Row])))
 events.push(...c.events.map(e => ({ ...e, at: c.now, by: owner })))
 events.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
 return { records, updates, events }
}
