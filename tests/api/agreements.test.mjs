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
    assert.equal((await read('/api/glove/dashboard')).agreementsDue.count, 0)
    const { exported } = await assertTrail(h, ['plan.saved', 'agreement.sold', 'agreement.ended'])
    assert.deepEqual(exported.agreements.map(a => [a.plan.name, a.endReason]), [['Comfort Club', 'Moved away']])
    assert.equal((await h.request('/api/glove/agreements', { as: person.cookie })).status, 403)
  })
  assert.ok(ended)
})
