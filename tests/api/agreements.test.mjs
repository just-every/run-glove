import { connectMail, receipt, textOf, deliveryIdOf } from '../fixtures/mail-providers.mjs'
// PLAN-002 maintenance agreements through the command, agreements, dashboard,
// reports, segment, QuickBooks payload, invoice CSV, Activity and export
// doors: a Comfort Club plan with two included tune-ups and 15% off repairs is
// sold, one tune-up is booked and completed with the plan's inspection form, a
// repair quote takes the member discount as a QUOTE-007 document discount
// carried to the job, invoice, CSV, QuickBooks payload and revenue report.
import { exportedFixture } from '../fixtures/movein.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, assertTrail, mailEvents, postEvents } from './harness.mjs'

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
    // CUST-001: the sale is in the property's history, and a field role's history carries no agreement.
    const sold = (await read(`/api/glove/sites/${site.id}/history`)).entries.filter(e => e.kind === 'agreement')
    assert.deepEqual(sold.map(e => [e.id, e.status, e.label]), [[agreement.id, 'sold', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]])
    assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: person.cookie })).status, 404, 'a technician with no visit there reads no history')
  })

  await t.test('PLAN-002 included visits consume entitlements; AGENT-007 flags only missing accepted frozen forms on twenty completed visits', async () => {
    const job = await dispatcher.run('job.create', { customerId: ellen.id, siteId: site.id, agreementId: agreement.id, title: 'Spring tune-up' })
    assert.deepEqual([job.agreementId, job.lines.map(l => [l.description, l.total]), job.totals.total, job.forms.map(f => f.name)], [agreement.id, [['AC tune-up (included in Comfort Club)', '0.00']], '0.00', ['Comfort Club inspection']])
    await complete(job)
    const [row] = (await read(`/api/glove/agreements?customerId=${ellen.id}`)).agreements
    assert.deepEqual([row.active, row.entitlements.used, row.entitlements.left, row.entitlements.next], [true, 1, 1, monthsBefore(start, -6)], '1 visit left, next six months after the start')
    await maintenanceEvidence()
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
    assert.deepEqual((await read(`/api/glove/sites/${site.id}/history`)).entries.filter(e => e.kind === 'agreement').map(e => [e.id, e.status, e.label]), [[`${agreement.id}:ended`, 'ended', 'Comfort Club ended by Front Office: Moved away'], [agreement.id, 'ended', `Comfort Club sold (phone): ${start} to ${agreement.endDate}, 2 included visits`]], 'the end joins the history, newest first')
    assert.equal((await h.request('/api/glove/agreements', { as: person.cookie })).status, 403)
  })
  assert.ok(ended)
})

test('PLAN-004 / AGENT-008 / COMM-001 forty due entitlements survive thirty bookings, cancellations and term end; completion and two recorded customer declines remove only their own visits; eight emailed booking links are delivered; dashboard and brief agree', async t => {
  const h = await installation(); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'CLUB', name: 'Seasonal tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [] })
  const person = await h.person('Luis Ortega Due', 'technician'), dispatcher = await h.person('Dee Due', 'dispatcher')
  const tech = await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date()), start = monthsBefore(today, 7)
  const agreements = []
  for (let i = 0; i < 20; i++) {
    const customer = await h.command('customer.save', { name: `Club member ${i + 1}`, email: `member${i + 1}@example.test` })
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
  const siteHistory = async id => (await read(`/api/glove/sites/${id}/history`)).entries
  const declines = (await siteHistory(first.siteId)).filter(e => e.kind === 'agreement decline')
  assert.deepEqual(declines.map(e => [e.status, e.label]), [['declined', `Comfort Club visit ${first.index + 1} (due ${first.due}) declined by ${first.customer} (phone), recorded by Front Office Due: Replacing the system this year`]], 'CUST-001: the decline is in the property history')
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
  // PLAN-004 / COMM-001: the office emails booking links for the eight outstanding 78701 visits through the owner's
  // provider (SendGrid fake); the provider reports each delivered, and sending links removes nothing from the due list.
  for (const provider of ['sendgrid', 'postmark', 'ses']) {
  const sendgrid = mailEvents('sendgrid')
  const edge = provider === 'sendgrid' ? null : await connectMail(h, provider)
  if (!edge) await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: sendgrid.eventKey, fromEmail: 'office@pacheco.example', fromName: 'Pacheco Plumbing & HVAC' })
  const linkable = (await read('/api/glove/due-visits?area=78701')).visits.filter(v => !v.booked)
  assert.equal(linkable.length, 8)
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(Date.now() + 3 * 86400000)), hour = n => `${String(n).padStart(2, '0')}:00`
  const offers = []
  for (const [i, v] of linkable.entries()) offers.push(await office.run('agreement.offer', { agreementId: v.agreementId, index: v.index, email: true, slots: [{ technicianId: tech.id, date: day, start: hour(8 + i), end: hour(9 + i) }] }))
  const customers = (await h.state()).customers, emailOf = id => customers.find(c => c.id === id).email
  assert.deepEqual(offers.map(o => o.emailed.to), linkable.map(v => emailOf(v.customerId)), 'each link goes to its own customer')
  const links = h.email.sent.slice(-8)
  assert.deepEqual(links.map(m => [m.to, deliveryIdOf(m)]), offers.map(o => [o.emailed.to, o.emailed.messageId]))
  const token = /\/book#token=(glb_[A-Za-z0-9_-]{43})/.exec(textOf(links[0]))[1]
  assert.deepEqual(links.map(m => /#token=(glb_[A-Za-z0-9_-]{43})/.exec(textOf(m))[1]), offers.map(o => o.token), 'each emailed link is the one shown once')
  const opened = await h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${token}` } })
  assert.equal(opened.status, 200, 'the delivered link is the real booking link')
  assert.deepEqual((await opened.json()).offer.slots.map(x => x.start), ['08:00'])
  const at = Math.floor(Date.now() / 1000)
  const delivered = offers.map((o, n) => ({ email: o.emailed.to, timestamp: at, event: 'delivered', sg_event_id: `due-link-${n}`, sg_message_id: `sg-receipt-due-${n}.filter0001`, rer_delivery_id: o.emailed.messageId }))
  if (edge) {
    for (const [n, o] of offers.entries()) {
      const m = { id: o.emailed.messageId, to: o.emailed.to, receipt: `${provider === 'postmark' ? 'pm' : 'ses'}-receipt-${h.email.sent.length - 7 + n}` }
      assert.equal((await postEvents(h, edge.callback(m))).status, 200)
    }
  } else assert.equal((await postEvents(h, sendgrid.signed(delivered))).status, 200)
  const linkStates = (await h.state()).messageStates
  assert.deepEqual(offers.map(o => linkStates[o.emailed.messageId].status), Array(8).fill('delivered'), 'eight delivered booking links')
  const linked = await siteHistory(linkable[0].siteId), linkEmail = linked.find(e => e.kind === 'message')
  assert.ok(linked.some(e => e.kind === 'booking link' && e.status === 'offered' && e.label === `Comfort Club visit ${linkable[0].index + 1}: 1 slot offered by ${offers[0].offeredBy.name}`))
  assert.match(linkEmail.label, /^booking link emailed \(outbound, email, .+ to member\d+@example\.test\)/)
  assert.match(linkEmail.status, /^Delivered/, 'CUST-001 / COMM-007: the emailed booking link is in the property history with its provider-reported state')
  const afterLinks = (await read('/api/glove/due-visits')).visits
  assert.deepEqual(afterLinks.map(v => v.id), remainder.map(v => v.id), 'sending links removes nothing: the due list still shows exactly the remainder')
  assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, remainder.length, 'and the REPORT-001 tile the same number')
  const trail = await assertTrail(h, ['agreement.offer.created', 'email.queued', 'email.accepted', 'email.delivered'])
  // 30 booked by area plus the 8 included jobs the emailed offers created.
  assert.equal(trail.exported.jobs.filter(j => j.agreementVisitIndex !== undefined).length, 38)
  assert.ok(!JSON.stringify(trail.exported).includes(token) && !JSON.stringify(trail.exported).includes('synthetic-glove-1'), 'no bearer or key in the export')
  }
})

test('PLAN-004 and BOOK-002 booking links offer only real slots, act as the offering person, refuse stale choices and expire or revoke without losing due work', async t => {
  const h = await installation({ at: '2030-01-01T12:00:00Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'LINK', name: 'Seasonal tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
  const office = await h.person('Booking Office', 'office'), dispatcher = await h.person('Booking Dispatcher', 'dispatcher'), field = await h.person('Booking Tech', 'technician')
  const tech = await h.command('technician.save', { name: 'Luis Ortega', operatorId: field.id })
  const today = '2030-01-01'
  const date = '2030-01-08'
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
  let bookingClock = Date.parse('2030-01-01T12:00:00Z')
  const publicRequest = async (token, slotId, extra = {}) => {
    await h.request('/__test/clock', { method: 'POST', body: { at: new Date(bookingClock += 1000).toISOString() } })
    return h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${token}`, ...extra }, ...(slotId !== undefined ? { method: 'POST', body: { slotId } } : {}) })
  }
  const view = await publicRequest(link.token).then(r => r.json())
  assert.equal(view.offer.service, service.name, 'native plan links retain the service label instead of the internal included-line description')
  assert.deepEqual(view.offer.slots.map(s => [s.date, s.start, s.timezone]), [[date, '09:00', 'America/Chicago'], [date, '10:00', 'America/Chicago']])
  assert.equal(JSON.stringify(view).includes('Rosa'), false)
  assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401, 'bearer grants no staff or customer-account access')
  assert.equal((await h.request(`/api/glove/public/booking?token=${link.token}`, { as: '' })).status, 404)
  assert.equal((await publicRequest(link.token, view.offer.slots[0].id, { origin: 'https://foreign.example' })).status, 403)
  assert.equal((await publicRequest(link.token, crypto.randomUUID())).status, 409, 'a caller cannot book a slot the office did not offer')
  assert.equal((await h.state()).visits.filter(v => v.jobId === link.jobId).length, 0, 'an unoffered choice books nothing')
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
  const past = '2029-12-31T23:59:59.000Z'
  await h.db.prepare("UPDATE glove_records SET data=json_set(data,'$.expiresAt',?) WHERE kind='bookingOffers' AND id=?").bind(past, expired.id).run()
  assert.equal((await publicRequest(expired.token)).status, 404)
  const authority = await office.run('agreement.offer', payloadFor(3, '13'))
  await h.command('role.set', { operatorId: office.id, role: 'viewer' })
  assert.equal((await publicRequest(authority.token)).status, 404, 'offering person losing booking authority refuses the next choice')
  await h.command('role.set', { operatorId: office.id, role: 'office' })
  const branch = await h.command('branch.save', { name: 'Dallas', timezone: 'America/Chicago', prefix: 'DAL', zips: ['75201'] })
  await h.command('branch.limit', { operatorId: office.id, branchId: branch.id })
  assert.equal((await publicRequest(authority.token)).status, 404, 'current branch authority checked on the public link')
  const linkHistory = async i => (await h.request(`/api/glove/sites/${members[i].site.id}/history`).then(r => r.json())).entries.filter(e => e.kind === 'booking link')
  assert.deepEqual((await linkHistory(0)).map(e => [e.status, e.label]), [['used', 'Comfort Club visit 1: the customer chose a slot'], ['delivery not verified', 'Comfort Club visit 1: recorded by Booking Office as sent by email'], ['offered', 'Comfort Club visit 1: 2 slots offered by Booking Office']], 'CUST-001: offer, outside send and use are in the property history')
  assert.deepEqual((await linkHistory(2)).map(e => e.status).sort(), ['offered', 'offered', 'revoked'], 'a revoked and an expired offer are both on the property')
  const { exported, activity } = await assertTrail(h, ['agreement.offer.created', 'agreement.offer.sentOutside', 'agreement.offer.used', 'agreement.offer.revoked', 'visit.booked'])
  for (const value of [link.token, revoked.token, expired.token, authority.token]) {
    assert.equal(JSON.stringify(exported).includes(value), false)
    assert.equal(JSON.stringify(activity).includes(value), false)
    assert.equal(JSON.stringify(await h.state()).includes(value), false)
    assert.equal(JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results).includes(value), false)
  }
  assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).visits.length, 4, 'first due entitlement of every member remains present')
  // BOOK-002 uses the same revocable bearer, with capacity evaluated across
  // eligible technicians rather than delegating a fixed technician choice.
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2030-01-01T12:00:00Z' } })).status, 200)
  const serviceDate = '2030-01-02'
  const skilled = await h.command('technician.save', { id: tech.id, version: (await h.state()).technicians.find(x => x.id === tech.id).version, name: tech.name, skills: ['hvac'], zips: ['78704'] })
  await h.command('technician.save', { name: 'Unqualified alternative', skills: ['plumbing'] })
  await h.command('service.save', { id: service.id, version: service.version, code: 'LINK', name: service.name, unitPrice: '149.00', tax: 'TAXABLE', requiredSkills: ['hvac'] })
  const serviceJob = await h.command('job.create', { customerId: members[0].customer.id, siteId: members[0].site.id, title: 'Online seasonal tune-up', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '149.00' }] })
  const servicePayload = { jobId: serviceJob.id, slots: [{ date: serviceDate, start: '15:00', end: '16:00', window: { start: '14:00', end: '16:00' } }] }
  await dispatcher.run('booking.offer', servicePayload, { error: 'FORBIDDEN' })
  await h.command('booking.offer', { ...servicePayload, deposit: '50.00' }, { error: 'PAYMENT_POLICY' })
  const serviceCommand = crypto.randomUUID()
  const serviceLink = await h.command('booking.offer', servicePayload, { commandId: serviceCommand })
  assert.equal((await h.command('booking.offer', servicePayload, { commandId: serviceCommand })).token, undefined)
  const occupiedJob = await h.command('job.create', { customerId: members[1].customer.id, siteId: members[1].site.id, title: 'Private competing work' })
  const occupied = await h.command('visit.book', { jobId: occupiedJob.id, technicianId: skilled.id, date: serviceDate, start: '00:00', end: '23:59' })
  const full = await publicRequest(serviceLink.token).then(r => r.json())
  assert.deepEqual(full.offer.slots, [], 'a full day offers no window, despite an unqualified free technician')
  assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 409)
  assert.equal((await h.state()).visits.some(v => v.jobId === serviceJob.id), false)
  await h.command('visit.cancel', { visitId: occupied.id, version: occupied.version, reason: 'Capacity released' })
  const available = await publicRequest(serviceLink.token).then(r => r.json())
  assert.deepEqual(available.offer.slots.map(x => [x.start, x.window]), [['15:00', { start: '14:00', end: '16:00' }]])
  assert.equal(JSON.stringify(available).includes('Private competing work'), false)
  assert.equal(JSON.stringify(available).includes(skilled.id), false, 'no technician identifier is disclosed')
  assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 200)
  assert.equal((await publicRequest(serviceLink.token, serviceLink.slots[0].id)).status, 404, 'single choice cannot book twice')
  const serviceVisit = (await h.state()).visits.filter(v => v.jobId === serviceJob.id)
  assert.equal(serviceVisit.length, 1)
  assert.deepEqual([serviceVisit[0].technicianId, serviceVisit[0].arrivalWindow, serviceVisit[0].local.start], [skilled.id, { start: '14:00', end: '16:00' }, '15:00'])
  assert.match(serviceVisit[0].assignments[0].reason, /^Assigned automatically/)
  assert.ok((await h.state()).notices.some(n => n.visitId === serviceVisit[0].id && n.message.includes('arrange the customer confirmation')))

  const nextJob = await h.command('job.create', { customerId: members[0].customer.id, siteId: members[0].site.id, title: 'Second online tune-up', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '149.00' }] })
  const backupOwner = await h.person('Alternate Owner', 'owner')
  const revokedService = await backupOwner.run('booking.offer', { jobId: nextJob.id, slots: [{ date: serviceDate, start: '17:00', end: '18:00', window: { start: '16:00', end: '18:00' } }] })
  await dispatcher.run('agreement.offerRevoke', { offerId: revokedService.id, version: revokedService.version }, { error: 'FORBIDDEN' })
  assert.equal((await publicRequest(revokedService.token)).status, 200)
  await h.command('role.set', { operatorId: backupOwner.id, role: 'dispatcher' })
  assert.equal((await publicRequest(revokedService.token)).status, 404, 'retaining dispatch authority does not retain service-link ownership')
  await h.command('role.set', { operatorId: backupOwner.id, role: 'owner' })
  await backupOwner.run('agreement.offerRevoke', { offerId: revokedService.id, version: revokedService.version })
  assert.equal((await publicRequest(revokedService.token)).status, 404)
  // Generated windows exclude each independent capacity constraint while
  // unrelated free technicians cannot satisfy the service or area requirement.
  for (const member of members) h.maps.places.set(member.site.address, { lat: 30.26, lng: -97.74 })
  await h.command('maps.connect', { key: 'synthetic-glove-985' })
  const generationDate = '2030-01-09' // Wednesday, pinned independently of runtime time.
  let currentTech = (await h.state()).technicians.find(x => x.id === skilled.id)
  await h.command('technician.save', { id: skilled.id, version: currentTech.version, name: skilled.name, hours: [{ day: 'wed', start: '10:00', end: '16:00' }], timeOff: [{ from: '2030-01-16', to: '2030-01-16', reason: 'Unavailable' }] })
  await h.command('technician.save', { name: 'Qualified outside service area', skills: ['hvac'], zips: ['75201'] })
  await h.command('visit.book', { jobId: occupiedJob.id, technicianId: skilled.id, date: generationDate, start: '11:00', end: '12:00' })
  const calendarUrl = 'https://calendar.google.com/calendar/ical/synthetic-glove-1/basic.ics'
  h.calendars.set(calendarUrl, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'DTSTART:20300109T180000Z', 'DTEND:20300109T190000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'))
  await h.command('technician.calendar', { technicianId: skilled.id, url: calendarUrl })
  await h.command('technician.calendarRead', { technicianId: skilled.id })
  const generate = { date: generationDate, start: '09:00', end: '17:00', durationMinutes: 60, stepMinutes: 60 }
  await dispatcher.run('booking.offer', { jobId: nextJob.id, generate }, { error: 'FORBIDDEN' })
  await h.command('booking.offer', { jobId: nextJob.id, generate, slots: servicePayload.slots }, { error: 'INPUT' })
  for (const invalid of [{ stepMinutes: 0 }, { durationMinutes: 0 }, { date: '2030-02-30' }, { start: '24:00' }, { start: ['09:00'] }, { end: '08:00' }]) await h.command('booking.offer', { jobId: nextJob.id, generate: { ...generate, ...invalid } }, { error: invalid.date ? 'TIME' : 'INPUT' })
  await h.command('booking.offer', { jobId: nextJob.id, generate: { ...generate, date: '2030-01-16' } }, { error: 'NO_TECHNICIAN' })
  const many = await h.command('booking.offer', { jobId: nextJob.id, generate: { ...generate, durationMinutes: 15, stepMinutes: 15 } })
  assert.deepEqual(many.slots.map(x => x.start), ['10:00', '10:15', '10:30', '10:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15'], 'generation returns only the first ten eligible windows, preserving gaps and chronological order')
  const generated = await h.command('booking.offer', { jobId: nextJob.id, generate })
  const expectedWindows = ['10:00', '13:00', '14:00', '15:00']
  assert.deepEqual(generated.slots.map(x => x.start), expectedWindows, 'generation excludes hours, visits, calendar busy time, missing skills and wrong service areas')
  const generatedView = await publicRequest(generated.token).then(r => r.json())
  assert.deepEqual(generatedView.offer.slots.map(x => [x.start, x.window]), [['10:00', { start: '10:00', end: '11:00' }], ['13:00', { start: '13:00', end: '14:00' }], ['14:00', { start: '14:00', end: '15:00' }], ['15:00', { start: '15:00', end: '16:00' }]], 'public door presents the independently expected generated arrival windows')
  const newlyOccupied = await h.command('visit.book', { jobId: occupiedJob.id, technicianId: skilled.id, date: generationDate, start: '10:00', end: '11:00' })
  assert.equal((await publicRequest(generated.token, generated.slots[0].id)).status, 409, 'generated capacity is rechecked at customer choice')
  await h.command('visit.cancel', { visitId: newlyOccupied.id, version: newlyOccupied.version, reason: 'Released' })
  assert.equal((await publicRequest(generated.token, generated.slots[0].id)).status, 200)
  const generatedVisit = (await h.state()).visits.find(v => v.jobId === nextJob.id)
  assert.deepEqual([generatedVisit.technicianId, generatedVisit.local.start, generatedVisit.arrivalWindow], [skilled.id, '10:00', { start: '10:00', end: '11:00' }])
  await travelBookingEvidence()
  const serviceTrail = await assertTrail(h, ['booking.offer.created', 'booking.offer.used'])
  const serviceHistory = (await h.request(`/api/glove/sites/${members[0].site.id}/history`).then(r => r.json())).entries.filter(e => e.kind === 'booking link' && e.label.startsWith(`${service.name} service visit:`))
  assert.deepEqual(serviceHistory.map(e => e.status).sort(), ['offered', 'offered', 'offered', 'offered', 'revoked', 'used', 'used'], 'CUST-001 includes the service booking offer, use and revocation alongside agreement links')
  for (const value of [serviceLink.token, revokedService.token]) {
    assert.equal(JSON.stringify(serviceTrail).includes(value), false)
    assert.equal(JSON.stringify(await h.state()).includes(value), false)
    assert.equal(JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results).includes(value), false)
  }

})

// Extend the existing included-visit completion flow without another registration.
async function maintenanceEvidence() {
  const h = await installation({ at: '2030-01-01T12:00:00Z' })
  try {
    await h.command('business.save', { name: 'Synthetic Glove Maintenance', timezone: 'UTC' })
    const agent = await h.person('Maintenance Agent', 'agent'), techPerson = await h.person('Maintenance Tech', 'technician'), desk = await h.person('Maintenance Desk', 'dispatcher')
    const tech = await h.command('technician.save', { name: techPerson.name, operatorId: techPerson.id })
    const service = await h.command('service.save', { code: 'MAINT', name: 'Maintenance', unitPrice: '100.00', tax: 'FREE' })
    const form = await h.command('form.save', { name: 'Promised inspection', questions: [{ id: 'checked', label: 'Checked', type: 'yesno' }] })
    const other = await h.command('form.save', { name: 'Promised readings', questions: [{ id: 'checked', label: 'Checked', type: 'yesno' }] })
    const plan = await h.command('plan.save', { name: 'Twenty visits', price: '100.00', termMonths: 12, includedVisits: 20, visitServiceId: service.id, formIds: [form.id, other.id] })
    const customer = await h.command('customer.save', { name: 'Synthetic Maintenance Customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '1 Synthetic Street' })
    const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: '2030-01-01' })
    const jobs = [], visits = [], captures = [], completionReferences = new Map()
    for (let i = 0; i < 20; i++) {
      const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, agreementId: agreement.id, agreementVisitIndex: i, title: `Maintenance ${i + 1}` })
      const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
      const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2030-01-01', start: clock(60 + i * 30), end: clock(90 + i * 30) })
      await techPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      if (i < 9) for (const f of job.forms) captures.push(await techPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'form', formId: f.id, answers: { checked: true } }))
      await techPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Maintenance complete', jobComplete: i !== 9, signoff: { absentReason: 'Customer away' } }, { commandId: `synthetic-glove-completed-${i}` })
      completionReferences.set(visit.id, `synthetic-glove-completed-${i}`)
      if (i === 9) {
        const returnVisit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2030-01-02', start: '08:00', end: '08:30' })
        await techPerson.run('visit.arrive', { visitId: returnVisit.id, deviceTime: returnVisit.startAt })
        for (const f of job.forms) captures.push(await techPerson.run('visit.capture', { visitId: returnVisit.id, deviceTime: returnVisit.startAt, kind: 'form', formId: f.id, answers: { checked: true } }))
        await techPerson.run('visit.complete', { visitId: returnVisit.id, deviceTime: returnVisit.endAt, summary: 'Promised forms on return visit', signoff: { absentReason: 'Customer away' } }, { commandId: 'synthetic-glove-completed-return' })
        completionReferences.set(returnVisit.id, 'synthetic-glove-completed-return')
      }
      jobs.push(job); visits.push(visit)
    }
    const payload = { agreementId: agreement.id }, commandId = 'synthetic-glove-maintenance-1'
    const before = await h.state()
    const checked = await agent.run('agreement.prepare', payload, { commandId })
    assert.equal(checked.checks.length, 20)
    assert.deepEqual(checked.checks.map(x => [x.index, x.status]), Array.from({ length: 20 }, (_, i) => [i, i < 10 ? 'recorded' : 'missing']))
    assert.deepEqual(checked.checks.map(x => x.forms.map(f => f.copyId)), jobs.map(j => j.forms.map(f => f.id)), 'each job keeps distinct frozen copies')
    assert.deepEqual(checked.checks[0].forms.map(f => f.captureIds), captures.slice(0, 2).map(c => [c.id]))
    assert.deepEqual(checked.checks[10].forms.map(f => [f.name, f.formVersion, f.captureIds]), [['Promised inspection', 1, []], ['Promised readings', 1, []]])
    assert.ok(checked.checks.every(x => x.jobId === jobs[x.index].id && completionReferences.has(x.visitId) && x.completionCaptureId === completionReferences.get(x.visitId)))
    assert.deepEqual(await agent.run('agreement.prepare', payload, { commandId }), checked, 'lost-response replay is stable')
    assert.equal((await agent.run('agreement.prepare', payload)).id, checked.id, 'fresh unchanged inspection creates no duplicate')
    const after = await h.state()
    assert.deepEqual([after.jobs, after.visits, after.messages, after.bookingOffers, after.payments], [before.jobs, before.visits, before.messages, before.bookingOffers, before.payments], 'preparation has no operational or outbound effect')
    await techPerson.run('visit.capture', { visitId: visits[10].id, deviceTime: visits[10].endAt, kind: 'form', formId: jobs[0].forms[0].id, answers: { checked: true } }, { error: 'NOT_FOUND' })
    await techPerson.run('visit.capture', { visitId: visits[10].id, deviceTime: visits[10].endAt, kind: 'form', formId: form.id, answers: { checked: true } }, { error: 'NOT_FOUND' })
    // A later template edit cannot replace the promises frozen onto these jobs.
    await h.command('form.save', { id: form.id, version: form.version, name: 'Changed future inspection', questions: [{ id: 'future', label: 'Future', type: 'yesno' }] })
    assert.deepEqual((await agent.run('agreement.prepare', payload)).checks, checked.checks)
    for (const f of jobs[10].forms) await techPerson.run('visit.capture', { visitId: visits[10].id, deviceTime: visits[10].endAt, kind: 'form', formId: f.id, answers: { checked: true } })
    assert.equal((await agent.run('agreement.prepare', payload)).checks[10].status, 'missing', 'unreviewed late evidence is not accepted')
    const late = (await h.state()).visits.find(v => v.id === visits[10].id)
    await desk.run('visit.reviewLateEvidence', { visitId: late.id, version: late.version, note: 'Reviewed genuine maintenance evidence' })
    const projection = await h.request('/api/glove/due-visits').then(r => r.json())
    assert.equal(projection.maintenance.find(v => v.index === 10).preparation.current, false, 'old preparation is visibly stale')
    const refreshed = await agent.run('agreement.prepare', payload)
    assert.equal(refreshed.id, checked.id)
    assert.equal(refreshed.version, checked.version + 1)
    assert.deepEqual(refreshed.checks.filter(x => x.status === 'missing').map(x => x.index), [11, 12, 13, 14, 15, 16, 17, 18, 19])
    assert.ok(refreshed.checks[10].forms.every(f => f.captureIds.length === 1))
    const { activity, exported } = await assertTrail(h, ['agreement.maintenancePrepared'])
    const event = activity.find(e => e.kind === 'agreement.maintenancePrepared' && e.actorId === agent.id)
    assert.equal(event.actorRole, 'agent'); assert.equal(event.subjectId, checked.id)
    assert.equal(exported.agreementChecks.find(r => r.id === checked.id).preparedBy.id, agent.id)
    const trail = exported.timeline.filter(e => e.kind === 'agreement.maintenancePrepared').map(e => JSON.parse(e.data))
    assert.ok(trail.some(e => e.agreementId === agreement.id && e.checks[10].status === 'recorded' && e.effect === refreshed.effect))
    await h.command('agents.pause', { paused: true })
    await agent.run('agreement.prepare', payload, { error: 'PAUSED' })
    await agent.run('agreement.prepare', payload, { commandId, error: 'PAUSED' })
    await h.command('agents.pause', { paused: false })
    await h.command('role.set', { operatorId: agent.id, role: 'viewer' })
    await agent.run('agreement.prepare', payload, { commandId, error: 'FORBIDDEN' })
    await h.command('role.set', { operatorId: agent.id, role: 'agent' })
    const branch = await h.command('branch.save', { name: 'Other branch', prefix: 'OTHER', timezone: 'UTC', zips: [] })
    await h.command('branch.limit', { operatorId: agent.id, branchId: branch.id })
    await agent.run('agreement.prepare', payload, { error: 'NOT_FOUND' })
    await agent.run('agreement.prepare', payload, { commandId, error: 'NOT_FOUND' })
    assert.deepEqual((await h.request('/api/glove/due-visits', { as: agent.cookie }).then(r => r.json())).maintenance, [])
    assert.equal((await agent.state()).agreementChecks.length, 0)
    const scopedCustomer = await h.command('customer.save', { name: 'Other branch customer', branchId: branch.id })
    const scopedSite = await h.command('site.save', { customerId: scopedCustomer.id, address: '2 Synthetic Street', branchId: branch.id })
    const scopedAgreement = await h.command('agreement.sell', { planId: plan.id, customerId: scopedCustomer.id, siteId: scopedSite.id, via: 'phone', startDate: '2030-01-01' })
    assert.deepEqual((await agent.run('agreement.prepare', { agreementId: scopedAgreement.id })).checks, [], 'in-branch preparation remains available')
    await techPerson.run('agreement.prepare', payload, { error: 'FORBIDDEN' })
    assert.equal((await h.request('/api/glove/due-visits', { as: techPerson.cookie })).status, 403)
    assert.equal((await techPerson.state()).agreementChecks.length, 0)
    assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: 'synthetic-glove-unsigned', type: 'agreement.prepare', payload } })).status, 401)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    const erased = await h.request('/api/glove/export').then(r => r.json())
    assert.equal(erased.agreementChecks.some(r => r.id === checked.id), false)
    assert.equal((await h.request('/api/glove/due-visits').then(r => r.json())).maintenance.some(v => v.customerId === customer.id), false)
    const replay = await desk.run('agreement.prepare', { agreementId: scopedAgreement.id })
    assert.ok(replay.id)
    await agent.run('agreement.prepare', payload, { commandId, error: 'ERASED' })
    const erasedEvents = erased.timeline.filter(e => e.subject_id === checked.id)
    assert.ok(erasedEvents.length > 0)
    assert.ok(erasedEvents.every(e => e.summary === 'Customer personal data erased' && e.data === '{}'), 'timeline keeps anonymous references without personal preparation copies')
    // A documented source completion supplies no invented native form proof.
    const files = await exportedFixture('servicetitan')
    const stage = await h.command('import.stage', { format: 'servicetitan', files })
    await h.command('import.commit', { batchId: stage.id, version: stage.version, fingerprint: stage.preview.fingerprint })
    const imported = (await h.state()).agreements.find(a => a.importedEntitlements?.some(v => v.completed))
    assert.ok(imported, 'source fixture includes an explicitly completed entitlement')
    const unknown = await h.command('agreement.prepare', { agreementId: imported.id })
    assert.ok(unknown.checks.length > 0)
    assert.deepEqual(unknown.checks.map(c => [c.index, c.status, c.completionCaptureId, c.forms]), [[0, 'unavailable', null, []]])
  } finally { await h.close() }
}

// Travel extends the existing public booking flow without another registration.
async function travelBookingEvidence() {
  const h = await installation({ at: '2030-01-01T12:00:00Z' })
  try {
    await h.command('business.save', { name: 'Synthetic Glove Travel', timezone: 'UTC' })
    const service = await h.command('service.save', { code: 'TRAVEL', name: 'Travel service', unitPrice: '100.00', tax: 'FREE' })
    const customer = await h.command('customer.save', { name: 'Synthetic Travel Customer' })
    const sites = []
    for (const [i, address] of ['Before Street', 'Service Street', 'After Street'].entries()) {
      h.maps.places.set(address, { lat: i + 1, lng: 1 })
      sites.push(await h.command('site.save', { customerId: customer.id, address }))
    }
    const tech = await h.command('technician.save', { name: 'Travel Technician' })
    const job = await h.command('job.create', { customerId: customer.id, siteId: sites[1].id, title: 'Travel booking', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '100.00' }] })
    const beforeJob = await h.command('job.create', { customerId: customer.id, siteId: sites[0].id, title: 'Private preceding visit' })
    const afterJob = await h.command('job.create', { customerId: customer.id, siteId: sites[2].id, title: 'Private following visit' })
    const date = '2030-01-09'
    await h.command('visit.book', { jobId: beforeJob.id, technicianId: tech.id, date, start: '08:00', end: '09:00' })
    const following = await h.command('visit.book', { jobId: afterJob.id, technicianId: tech.id, date, start: '12:00', end: '13:00' })
    const generate = { date, start: '09:00', end: '12:00', durationMinutes: 60, stepMinutes: 30 }
    await h.command('booking.offer', { jobId: job.id, generate }, { error: 'NO_TECHNICIAN' })
    await h.command('maps.connect', { key: 'synthetic-glove-985' })
    let inbound = '1800s', outbound = '1800s', condition = 'ROUTE_EXISTS', code = 0
    h.maps.routeAnswer = body => body.origins.flatMap((o, i) => body.destinations.map((d, j) => ({ originIndex: i, destinationIndex: j, status: { code }, condition, distanceMeters: 1000, duration: o.waypoint.location.latLng.latitude === 1 ? inbound : outbound })))
    const link = await h.command('booking.offer', { jobId: job.id, generate })
    assert.deepEqual(link.slots.map(x => x.start), ['09:30', '10:00', '10:30'], 'both directed legs fit; exact thirty-minute boundaries are included')
    const request = slotId => h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${link.token}` }, ...(slotId ? { method: 'POST', body: { slotId } } : {}) })
    const starts = async () => (await request().then(r => r.json())).offer.slots.map(x => x.start)
    assert.deepEqual(await starts(), ['09:30', '10:00', '10:30'])
    inbound = '1800.001s'
    assert.deepEqual(await starts(), ['10:00', '10:30'], 'even a fractional second over the inbound gap is refused')
    inbound = '1800s'; outbound = '1800.001s'
    assert.deepEqual(await starts(), ['09:30', '10:00'], 'outbound travel uses the following visit boundary, without rounding down')
    outbound = '3601s'
    assert.deepEqual(await starts(), ['09:30'], 'changed routes invalidate formerly feasible windows')
    assert.equal((await request(link.slots[1].id)).status, 409)
    assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 0, 'travel refusal creates no booking')
    outbound = '1800s'
    for (const unavailable of ['http', 'no-route', 'provider-status', 'malformed']) {
      h.maps.status.routes = unavailable === 'http' ? 503 : undefined
      condition = unavailable === 'no-route' ? 'ROUTE_NOT_FOUND' : 'ROUTE_EXISTS'
      code = unavailable === 'provider-status' ? 7 : 0
      inbound = unavailable === 'malformed' ? 'unknown' : '1800s'
      assert.deepEqual(await starts(), [], `${unavailable} is never zero-minute travel`)
      assert.equal((await request(link.slots[1].id)).status, 409)
    }
    delete h.maps.status.routes; condition = 'ROUTE_EXISTS'; code = 0; inbound = '1800s'
    const currentSite = (await h.state()).sites.find(s => s.id === sites[0].id)
    await h.command('site.save', { ...currentSite, address: 'Unknown Street' })
    assert.deepEqual(await starts(), [], 'an unavailable adjacent location is not invented')
    await h.command('site.save', { ...(await h.state()).sites.find(s => s.id === sites[0].id), address: sites[0].address })
    const changed = await h.command('visit.change', { visitId: following.id, version: following.version, reason: 'Updated following schedule', technicianId: tech.id, date, start: '11:30', end: '12:30' })
    assert.deepEqual(await starts(), ['09:30', '10:00'], 'the current following schedule is rechecked')
    await h.command('visit.change', { visitId: changed.id, version: changed.version, reason: 'Restored following schedule', technicianId: tech.id, date, start: '12:00', end: '13:00' })
    const alternative = await h.command('technician.save', { name: 'Alternative eligible technician' })
    // Longer outbound travel excludes the original technician; another eligible
    // technician with no adjacent stops is a real feasible alternative.
    outbound = '10000s'
    assert.deepEqual(await starts(), ['09:30', '10:00', '10:30'])
    assert.equal((await request(link.slots[1].id)).status, 200)
    const booked = (await h.state()).visits.filter(v => v.jobId === job.id)
    assert.equal(booked.length, 1)
    assert.deepEqual([booked[0].technicianId, booked[0].local.start, booked[0].arrivalWindow], [alternative.id, '10:00', { start: '10:00', end: '11:00' }])
    assert.equal((await request(link.slots[1].id)).status, 404)
  } finally { await h.close() }
}
