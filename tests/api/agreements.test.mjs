// PLAN-002 maintenance agreements through the command, agreements, dashboard,
// reports, segment, QuickBooks payload, invoice CSV, Activity and export
// doors: a Comfort Club plan with two included tune-ups and 15% off repairs is
// sold, one tune-up is booked and completed with the plan's inspection form, a
// repair quote takes the member discount as a QUOTE-007 document discount
// carried to the job, invoice, CSV, QuickBooks payload and revenue report.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, assertTrail } from './harness.mjs'

const monthsBefore = (date, n) => { const [y, m, d] = date.split('-').map(Number), t = y * 12 + m - 1 - n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}-${String(Math.min(d, 28)).padStart(2, '0')}` }

test('PLAN-002 a plan with two included tune-ups and 15% off repairs is sold, used, discounted, counted due, reported and segmented', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: false }] } })
  const tune = await h.command('service.save', { code: 'TUNE', name: 'AC tune-up', kind: 'service', unitPrice: '149.00', tax: 'TAXABLE' })
  const parts = await h.command('service.save', { code: 'PARTS', name: 'Condenser parts', kind: 'material', unitPrice: '400.00', tax: 'TAXABLE' })
  const labor = await h.command('service.save', { code: 'LABOR', name: 'Repair labor', kind: 'service', unitPrice: '300.00', tax: 'TAXABLE' })
  const form = await h.command('form.save', { name: 'Comfort Club inspection', questions: [{ id: 'filter', label: 'Filter replaced', type: 'yesno' }] })
  const dispatcher = await h.person('Dee Dispatcher', 'dispatcher'), office = await h.person('Front Office', 'office'), person = await h.person('Luis Ortega', 'technician')
  const tech = await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
  const ellen = await h.command('customer.save', { name: 'Ellen Brooks' }), lee = await h.command('customer.save', { name: 'Lee Park' })
  const site = await h.command('site.save', { customerId: ellen.id, address: '10 Service St, Austin TX 78704', zip: '78704' })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date()), start = monthsBefore(today, 7)
  const read = async path => (await h.request(path)).json()
  const club = { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: tune.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [form.id] }
  const repair = [labor, parts].map(x => ({ description: x.name, serviceId: x.id, quantity: '1', unitPrice: x.unitPrice }))
  let hour = 5
  const complete = async job => {
    hour += 1
    const visit = await dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: today, start: `${String(hour).padStart(2, '0')}:00`, end: `${String(hour).padStart(2, '0')}:30` })
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Done', signoff: { absentReason: 'Customer at work' } })
  }
  let agreement, ended

  await t.test('PLAN-002 the owner defines the plan and the desk sells it by phone; one agreement per site and term', async () => {
    await dispatcher.run('plan.save', club, { error: 'FORBIDDEN' })
    const plan = await h.command('plan.save', club)
    assert.deepEqual([plan.price, plan.termMonths, plan.includedVisits, plan.repairDiscountPercent, plan.priorityBooking, plan.formIds], ['228.00', 12, 2, '15', true, [form.id]])
    await person.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start }, { error: 'FORBIDDEN' })
    await office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'quote', startDate: start }, { error: 'NOT_FOUND' })
    agreement = await office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: start })
    assert.deepEqual([agreement.startDate, agreement.plan.name, agreement.via, agreement.soldBy.name], [start, 'Comfort Club', 'phone', 'Front Office'])
    assert.equal(agreement.endDate, new Date(Date.parse(`${monthsBefore(start, -12)}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10), 'the day before the same date twelve months on')
    await office.run('agreement.sell', { planId: plan.id, customerId: ellen.id, siteId: site.id, via: 'phone', startDate: today }, { error: 'AGREEMENT' })
  })

  await t.test('PLAN-002 an included tune-up is booked at $0.00 with the plan\'s inspection form, and its completion counts against the entitlement', async () => {
    const job = await dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'Spring tune-up' })
    assert.deepEqual([job.agreementId, job.lines.map(l => [l.description, l.total]), job.totals.total, job.forms.map(f => f.name)], [agreement.id, [['AC tune-up (included in Comfort Club)', '0.00']], '0.00', ['Comfort Club inspection']])
    await complete(job)
    const [row] = (await read(`/api/glove/agreements?customerId=${ellen.id}`)).agreements
    assert.deepEqual([row.active, row.entitlements.used, row.entitlements.left, row.entitlements.next], [true, 1, 1, monthsBefore(start, -6)], '1 visit left, next six months after the start')
    await dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'Fall tune-up' })
    await dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'One too many' }, { error: 'ENTITLEMENT' })
    const dash = await read('/api/glove/dashboard')
    assert.deepEqual([dash.agreementsDue.count, dash.agreementsDue.list.map(x => [x.customer, x.plan, x.left])], [1, [['Ellen Brooks', 'Comfort Club', 1]]], 'the agreement counts while its second tune-up is due')
  })

  await t.test('PLAN-002 / QUOTE-007 a repair quote takes the member discount, carried to the job, invoice, CSV, QuickBooks payload and revenue', async () => {
    const q = await dispatcher.run('quote.draft', { customerId: ellen.id, siteId: site.id, title: 'Condenser repair', lines: repair })
    const totals = q.revisions[0].totals
    assert.deepEqual([q.revisions[0].options[0].discount, totals.subtotal, totals.discount.amount, totals.discount.nonTaxable, totals.gst, totals.total], [{ kind: 'percent', value: '15', reason: 'Comfort Club member' }, '700.00', '105.00', '105.00', '33.00', '628.00'], 'the dispatcher holds no discount limit, and the member discount is not refused')
    await dispatcher.run('quote.draft', { customerId: ellen.id, siteId: site.id, title: 'Extra off', lines: repair, discount: { kind: 'percent', value: '20', reason: 'Goodwill' } }, { error: 'DISCOUNT_LIMIT' })
    const other = await dispatcher.run('quote.draft', { customerId: lee.id, siteId: (await h.command('site.save', { customerId: lee.id, address: '12 Service St, Austin TX 78704', zip: '78704' })).id, title: 'Same repair', lines: repair })
    assert.equal(other.revisions[0].totals.discount, undefined, 'no agreement, no member discount')
    const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    await dispatcher.run('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Ellen Brooks' })
    const job = await dispatcher.run('job.create', { quoteId: q.id })
    assert.deepEqual(job.discount, { kind: 'percent', value: '15', reason: 'Comfort Club member' })
    await complete(job)
    const inv = await office.run('invoice.prepare', { jobId: job.id })
    assert.equal(inv.revisions[0].totals.total, '628.00')
    const invoice = await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
    const qbo = await read(`/api/glove/invoices/${invoice.id}/quickbooks.json?customerRef=58&itemRef=41&taxCodeRef=7`)
    const line = qbo.Line.find(l => l.DetailType === 'DiscountLineDetail')
    assert.deepEqual([line.Amount, line.DiscountLineDetail, qbo.ApplyTaxAfterDiscount, qbo.TxnTaxDetail.TotalTax], [105, { PercentBased: true, DiscountPercent: 15 }, true, 33])
    const batch = await h.command('invoice.export', {})
    const csv = await h.request(`/api/glove/exports/${batch.id}.csv`).then(r => r.text())
    assert.match(csv, /Discount: Comfort Club member \(15%\) on non-taxable lines,1,-105\.00,/)
    assert.equal((await read(`/api/glove/reports/revenue.json?from=${start}&to=${today}`)).total.revenue, '595.00')
    const call = await office.run('job.create', { customerId: ellen.id, siteId: site.id, title: 'No cooling', lines: [{ description: 'Diagnostic', quantity: '1', unitPrice: '89.00', tax: 'TAXABLE' }] })
    assert.deepEqual([call.discount?.reason, call.totals.discount?.amount], ['Comfort Club member', '13.35'], 'a member\'s service call takes the discount too')
  })

  await t.test('PLAN-002 the agreement report counts the sold agreement and no churn, and a "no agreement" segment leaves the member out', async () => {
    const period = `from=${start}&to=${today}`
    const r = await read(`/api/glove/reports/agreements.json?${period}`)
    assert.deepEqual([r.sold, r.active, r.churn, r.soldValue, r.byPlan], [1, 1, 0, '228.00', [{ plan: 'Comfort Club', sold: 1 }]])
    assert.match(await h.request(`/api/glove/reports/agreements.csv?${period}`).then(x => x.text()), /Comfort Club,1\r\n[\s\S]*churn,0/)
    const segment = await dispatcher.run('segment.save', { name: 'Not on a plan', filter: { noAgreement: true } })
    assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name), ['Lee Park'])
    const [row] = (await read(`/api/glove/agreements?customerId=${ellen.id}`)).agreements
    ended = await office.run('agreement.end', { agreementId: row.id, version: row.version, reason: 'Moved away' })
    assert.deepEqual((await read(`/api/glove/reports/agreements.json?${period}`)).churn, 1)
    assert.deepEqual((await read(`/api/glove/segments/${segment.id}`)).members.map(m => m.name).sort(), ['Ellen Brooks', 'Lee Park'])
    const after = await dispatcher.run('quote.draft', { customerId: ellen.id, siteId: site.id, title: 'After the plan', lines: repair })
    assert.equal(after.revisions[0].totals.discount, undefined, 'an ended agreement gives no discount')
    assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 1, 'PLAN-004 ending a term is not completion or a customer decline')
    const { exported } = await assertTrail(h, ['plan.saved', 'agreement.sold', 'agreement.ended'])
    assert.deepEqual(exported.agreements.map(a => [a.plan.name, a.endReason]), [['Comfort Club', 'Moved away']])
    assert.equal((await h.request('/api/glove/agreements', { as: person.cookie })).status, 403)
  })
  assert.ok(ended)
})

test('PLAN-004 / AGENT-008 forty due entitlements survive thirty bookings, cancellations and term end; completion and two recorded customer declines remove only their own visits and dashboard and brief agree', async t => {
  const h = await installation(); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'CLUB', name: 'Seasonal tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [] })
  const person = await h.person('Luis Ortega Due', 'technician'), dispatcher = await h.person('Dee Due', 'dispatcher')
  const tech = await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date()), start = monthsBefore(today, 7)
  const agreements = []
  for (let i = 0; i < 20; i++) {
    const customer = await h.command('customer.save', { name: `Club member ${i + 1}` })
    const site = await h.command('site.save', { customerId: customer.id, address: `${i + 1} Comfort St, Austin TX`, zip: i < 15 ? '78704' : '78701' })
    agreements.push(await h.command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: start }))
  }
  const read = async path => (await h.request(path)).json()
  const all = (await read('/api/glove/due-visits')).visits
  assert.equal(all.length, 40)
  assert.equal(new Set(all.map(v => v.id)).size, 40)
  assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 40)
  const area = (await read('/api/glove/due-visits?area=78704')).visits
  assert.equal(area.length, 30)
  const visits = []
  for (let i = 0; i < area.length; i++) {
    const v = area[i], minute = 5 * 60 + i * 30
    const clock = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    const job = await dispatcher.run('job.create', { customerId: v.customerId, siteId: v.siteId, agreementId: v.agreementId, agreementVisitIndex: v.index, title: 'Club tune-up' })
    visits.push(await dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: today, start: clock(minute), end: clock(minute + 30) }))
  }
  const booked = (await read('/api/glove/due-visits')).visits
  assert.deepEqual(booked.map(v => v.id), all.map(v => v.id), 'booking never silently removes due work')
  assert.equal(booked.filter(v => v.booked).length, 30)
  await dispatcher.run('job.create', { customerId: area[0].customerId, siteId: area[0].siteId, agreementId: area[0].agreementId, agreementVisitIndex: area[0].index, title: 'Duplicate' }, { error: 'ENTITLEMENT' })
  // Complete the second entitlement first: its older sibling must keep its identity and due date.
  const target = booked.find(v => v.index === 1 && v.booked), visit = visits.find(v => v.id === target.visitId)
  await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Fall tune-up done', signoff: { absentReason: 'Customer at work' } })
  const remaining = (await read('/api/glove/due-visits')).visits
  assert.deepEqual(remaining.map(v => v.id), all.filter(v => v.id !== target.id).map(v => v.id))
  const sibling = remaining.find(v => v.agreementId === target.agreementId)
  assert.equal(sibling.index, 0); assert.equal(sibling.due, start)
  const cancel = visits.find(v => v.id !== visit.id)
  await dispatcher.run('visit.cancel', { visitId: cancel.id, version: cancel.version, reason: 'Customer needs another day' })
  const cancelled = (await read('/api/glove/due-visits')).visits.find(v => v.visitId === cancel.id)
  assert.equal(cancelled, undefined)
  assert.equal((await read('/api/glove/due-visits')).visits.find(v => v.jobId === cancel.jobId).booked, false)
  const ended = agreements.find(a => a.id === target.agreementId)
  await h.command('agreement.end', { agreementId: ended.id, version: ended.version, reason: 'Term ended' })
  assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 39)
  const expired = (await read('/api/glove/due-visits?through=2099-12-31')).visits
  assert.equal(expired.length, 39, 'term expiry or ending does not erase outstanding visits')
  const seasonal = (await read(`/api/glove/due-visits?from=${start}&through=${start}&area=78704`)).visits
  assert.equal(seasonal.length, 15, 'inclusive season bounds and ZIP filter')
  // PLAN-004 declines: two customers explicitly decline one included visit each; only those two leave the due list.
  const office = await h.person('Front Office Due', 'office')
  const agreementOf = async id => (await read('/api/glove/agreements')).agreements.find(a => a.id === id)
  const open = (await read('/api/glove/due-visits?area=78701')).visits.filter(v => !v.booked)
  const first = open[0], second = open.find(v => v.agreementId !== first.agreementId)
  const live = (await read('/api/glove/due-visits')).visits.find(v => v.booked)
  const answer = { method: 'phone', customerName: first.customer, reason: 'Replacing the system this year' }
  let a1 = await agreementOf(first.agreementId)
  await person.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer }, { error: 'FORBIDDEN' })
  await office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer, method: 'by carrier pigeon' }, { error: 'INPUT' })
  await office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: 2, ...answer }, { error: 'ENTITLEMENT' })
  const liveAgreement = await agreementOf(live.agreementId)
  await office.run('agreement.decline', { agreementId: liveAgreement.id, version: liveAgreement.version, index: live.index, ...answer, customerName: live.customer }, { error: 'BOOKED' })
  const declined1 = await office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer })
  assert.deepEqual(declined1.declines.map(d => [d.index, d.due, d.method, d.customerName, d.reason, d.recordedBy.name, d.recordedBy.role]), [[first.index, first.due, 'phone', first.customer, 'Replacing the system this year', 'Front Office Due', 'office']])
  await office.run('agreement.decline', { agreementId: a1.id, version: a1.version, index: first.index, ...answer }, { error: 'STALE' })
  await office.run('agreement.decline', { agreementId: a1.id, version: declined1.version, index: first.index, ...answer }, { error: 'ENTITLEMENT' })
  const a2 = await agreementOf(second.agreementId)
  await dispatcher.run('agreement.decline', { agreementId: a2.id, version: a2.version, index: second.index, method: 'email reply', customerName: second.customer, reason: 'Skipping the fall visit' })
  await dispatcher.run('job.create', { customerId: first.customerId, siteId: first.siteId, agreementId: first.agreementId, agreementVisitIndex: first.index, title: 'Declined' }, { error: 'ENTITLEMENT' })
  a1 = await agreementOf(first.agreementId)
  assert.deepEqual([a1.entitlements.included, a1.entitlements.used, a1.entitlements.declined, a1.entitlements.left], [2, 0, 1, 1], 'a declined visit is no longer left')
  const remainder = (await read('/api/glove/due-visits')).visits
  assert.deepEqual(remainder.map(v => v.id), remaining.filter(v => v.id !== first.id && v.id !== second.id).map(v => v.id), 'the due list shows exactly the remainder')
  assert.equal(remainder.length, 37)
  assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, remainder.length, 'the REPORT-001 tile counts the same due visits')
  const before = (await h.state()).version
  const brief = await read('/api/glove/brief')
  assert.deepEqual(brief.sections.agreements.map(v => v.id), remainder.map(v => v.id))
  assert.ok(brief.sections.agreements.every(v => v.agreementHref.startsWith('#customers/') && v.action.href === '#dispatch'))
  assert.equal((await h.state()).version, before, 'due reads are read only')
  assert.equal((await h.request('/api/glove/due-visits', { as: person.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/due-visits?through=2026-02-31')).status, 400)
  const { exported } = await assertTrail(h, ['agreement.sold', 'job.created', 'visit.booked', 'job.completed', 'agreement.visitDeclined'])
  assert.equal(exported.jobs.filter(j => j.agreementVisitIndex !== undefined).length, 30)
  assert.deepEqual(exported.agreements.flatMap(a => (a.declines ?? []).map(d => `${a.id}:${d.index}`)).sort(), [first.id, second.id].sort(), 'declines travel in the export')
})

test('PLAN-004 booking links offer only real slots, act as the offering person, refuse stale choices and expire or revoke without losing due work', async t => {
  const h = await installation(); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'LINK', name: 'Seasonal tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
  const office = await h.person('Booking Office', 'office'), dispatcher = await h.person('Booking Dispatcher', 'dispatcher'), field = await h.person('Booking Tech', 'technician')
  const tech = await h.command('technician.save', { name: 'Luis Ortega', operatorId: field.id })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
  const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const members = []
  for (const name of ['Ellen Brooks', 'Rosa Diaz', 'Lee Park', 'Avery Jones']) {
    const customer = await h.command('customer.save', { name, email: `${name.split(' ')[0]}@example.test` })
    const site = await h.command('site.save', { customerId: customer.id, address: `${members.length + 10} Service St, Austin TX`, zip: '78704' })
    const agreement = await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: today })
    members.push({ customer, site, agreement })
  }
  const offered = { date, technicianId: tech.id, start: '09:00', end: '09:30' }
  const payload = { agreementId: members[0].agreement.id, index: 0, slots: [offered, { ...offered, start: '10:00', end: '10:30' }] }
  await field.run('agreement.offer', payload, { error: 'FORBIDDEN' })
  const commandId = crypto.randomUUID()
  const link = await office.run('agreement.offer', payload, { commandId })
  assert.match(link.token, /^glb_/)
  assert.equal(Date.parse(link.expiresAt) - Date.parse(link.createdAt), 14 * 86400000)
  assert.equal((await office.run('agreement.offer', payload, { commandId })).token, undefined, 'secret shown only once, never in replay')
  const secret = await h.db.prepare('SELECT hash FROM glove_booking_secrets WHERE link_id=?').bind(link.id).first()
  assert.ok(secret.hash && !secret.hash.includes(link.token))
  const publicRequest = (token, slotId, extra = {}) => h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${token}`, ...extra }, ...(slotId !== undefined ? { method: 'POST', body: { slotId } } : {}) })
  const view = await publicRequest(link.token).then(r => r.json())
  assert.deepEqual(view.offer.slots.map(s => [s.date, s.start, s.timezone]), [[date, '09:00', 'America/Chicago'], [date, '10:00', 'America/Chicago']])
  assert.equal(JSON.stringify(view).includes('Rosa'), false)
  assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401, 'bearer grants no staff or customer-account access')
  assert.equal((await h.request(`/api/glove/public/booking?token=${link.token}`, { as: '' })).status, 404)
  assert.equal((await publicRequest(link.token, view.offer.slots[0].id, { origin: 'https://foreign.example' })).status, 403)
  // A real booking takes the first offered slot after the customer loaded it.
  const other = members[1]
  const otherJob = await dispatcher.run('job.create', { customerId: other.customer.id, siteId: other.site.id, title: 'Urgent repair' })
  await dispatcher.run('visit.book', { ...offered, jobId: otherJob.id })
  const stale = await publicRequest(link.token, view.offer.slots[0].id)
  assert.equal(stale.status, 409)
  const refusal = await stale.json()
  assert.equal(refusal.error.code, 'SLOT_TAKEN')
  assert.deepEqual(refusal.error.details.offer.slots.map(s => s.start), ['10:00'])
  assert.equal(JSON.stringify(refusal).includes(otherJob.id), false, 'no other customer conflict details on the public door')
  const sent = await office.run('agreement.offerSent', { offerId: link.id, version: link.version, method: 'email' })
  assert.equal(sent.sentOutside.by.id, office.id)
  const picked = view.offer.slots[1].id
  const answers = await Promise.all([publicRequest(link.token, picked), publicRequest(link.token, picked)])
  assert.deepEqual(answers.map(r => r.status).sort(), [200, 404], 'one booking under a simultaneous choice, then revoked')
  assert.equal((await publicRequest(link.token)).status, 404)
  const booked = (await h.state()).visits.filter(v => v.jobId === link.jobId)
  assert.equal(booked.length, 1)
  assert.deepEqual([booked[0].local.start, booked[0].assignments[0].by.id, booked[0].assignments[0].by.role], ['10:00', office.id, 'office'])
  assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).visits.some(v => v.jobId === link.jobId && v.booked), true, 'customer booking keeps the entitlement due until completion')
  const payloadFor = (i, hour) => ({ agreementId: members[i].agreement.id, index: 0, slots: [{ ...offered, start: `${hour}:00`, end: `${hour}:30` }] })
  const revoked = await office.run('agreement.offer', payloadFor(2, '11'))
  await office.run('agreement.offerRevoke', { offerId: revoked.id, version: revoked.version })
  assert.equal((await publicRequest(revoked.token)).status, 404)
  const expired = await office.run('agreement.offer', payloadFor(2, '12'))
  const past = new Date(Date.now() - 1000).toISOString()
  await h.db.prepare("UPDATE glove_records SET data=json_set(data,'$.expiresAt',?) WHERE kind='bookingOffers' AND id=?").bind(past, expired.id).run()
  assert.equal((await publicRequest(expired.token)).status, 404)
  const authority = await office.run('agreement.offer', payloadFor(3, '13'))
  await h.command('role.set', { operatorId: office.id, role: 'viewer' })
  assert.equal((await publicRequest(authority.token)).status, 404, 'offering person losing booking authority refuses the next choice')
  await h.command('role.set', { operatorId: office.id, role: 'office' })
  const branch = await h.command('branch.save', { name: 'Dallas', timezone: 'America/Chicago', prefix: 'DAL', zips: ['75201'] })
  await h.command('branch.limit', { operatorId: office.id, branchId: branch.id })
  assert.equal((await publicRequest(authority.token)).status, 404, 'current branch authority checked on the public link')
  const { exported, activity } = await assertTrail(h, ['agreement.offer.created', 'agreement.offer.sentOutside', 'agreement.offer.used', 'agreement.offer.revoked', 'visit.booked'])
  for (const value of [link.token, revoked.token, expired.token, authority.token]) {
    assert.equal(JSON.stringify(exported).includes(value), false)
    assert.equal(JSON.stringify(activity).includes(value), false)
    assert.equal(JSON.stringify(await h.state()).includes(value), false)
    assert.equal(JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results).includes(value), false)
  }
  assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).visits.length, 4, 'first due entitlement of every member remains present')
})
