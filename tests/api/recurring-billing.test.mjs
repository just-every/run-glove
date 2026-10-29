// PLAN-005 uses the production HTTP Worker, native sessions and D1. The only
// simulated time is the existing test Worker's boundary clock.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, assertTrail } from './harness.mjs'

const clock = async (h, at) => { const response = await h.request('/__test/clock', { method: 'POST', body: { at } }); assert.equal(response.status, 200) }
const line = (unitPrice = '50.00', tax = 'FREE') => ({ description: 'Preventive maintenance', quantity: '1', unitPrice, tax })
async function fixture(h, at) {
  await h.command('business.save', { name: 'Glove recurring service', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
  const customer = await h.command('customer.save', { name: 'Recurring customer', email: 'customer@example.test' })
  const site = await h.command('site.save', { customerId: customer.id, address: '120 Main Street, Austin TX 78701' })
  const techPerson = await h.person('Robin Field', 'technician'), office = await h.person('Riley Office', 'office'), dispatcher = await h.person('Morgan Dispatch', 'dispatcher'), agent = await h.person('Casey Agent', 'agent')
  const tech = await h.command('technician.save', { name: 'Robin Field', operatorId: techPerson.id })
  const material = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Replacement filter', kind: 'material', unitPrice: '7.00', tax: 'FREE' })
  // Create genuine sessions before moving to historical service months; no
  // session expiry or application permission is rewritten for the journey.
  await clock(h, at)
  const job = async (title, price = '50.00', tax = 'FREE') => h.command('job.create', { customerId: customer.id, siteId: site.id, title, lines: [line(price, tax)] })
  const repeat = (job, billing, extra = {}) => h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-01', rule: { unit: 'week' }, technicianId: tech.id, start: '09:00', end: '10:00', horizonDays: 365, until: '2025-03-31', billing, ...extra })
  const complete = async (job, date, quantity) => {
    const visit = (await h.state()).visits.find(v => v.jobId === job.id && v.local.date === date && v.status === 'booked')
    assert.ok(visit, `booked visit on ${date}`)
    await techPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    if (quantity) await techPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', serviceId: material.id, quantity })
    await techPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Maintenance complete', signoff: { absentReason: 'Property manager away' } })
    return visit
  }
  return { customer, site, tech, techPerson, office, dispatcher, agent, material, job, repeat, complete }
}

test('PLAN-005, PLAN-012, PLAN-013 three months produce exactly three per-visit drafts with their own materials and three fixed monthly drafts, with skips and concurrent replay', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await fixture(h, '2025-01-01T16:00:00Z')
  let perVisit = await b.job('Per-visit PM'), fixed = await b.job('Quarterly PM billed monthly')
  perVisit = await b.repeat(perVisit, { mode: 'per-visit' })
  fixed = await b.repeat(fixed, { mode: 'fixed-monthly', lines: [line('240.00')] }, { date: '2025-01-15', rule: { unit: 'month', interval: 3 }, start: '13:00', end: '14:00' })
  await b.dispatcher.run('series.billing', { jobId: perVisit.id, version: perVisit.version, from: '2025-01-01', billing: { mode: 'per-visit' }, reason: 'Price authority refused' }, { error: 'FORBIDDEN' })
  const visits = []
  visits.push(await b.complete(perVisit, '2025-01-01', '1'))
  await clock(h, '2025-02-01T05:59:00Z')
  await h.scheduled('2025-02-01T05:59:00Z')
  await clock(h, '2025-02-05T16:00:00Z'); visits.push(await b.complete(perVisit, '2025-02-05', '2'))
  await clock(h, '2025-02-12T16:00:00Z'); visits.push(await b.complete(perVisit, '2025-02-12', '3'))
  const skipped = (await h.state()).visits.find(v => v.jobId === perVisit.id && v.local.date === '2025-02-19')
  await b.dispatcher.run('visit.cancel', { visitId: skipped.id, version: skipped.version, reason: 'Customer away' })
  await clock(h, '2025-03-01T05:59:00Z'); await b.office.run('series.billingRun', {})
  await clock(h, '2025-04-01T04:59:00Z')
  await Promise.all([h.scheduled('2025-04-01T04:59:00Z'), h.scheduled('2025-04-01T04:59:00Z')])
  const commandId = randomUUID(), first = await b.office.run('series.billingRun', {}, { commandId })
  assert.deepEqual(await b.office.run('series.billingRun', {}, { commandId }), first)
  const s = await h.state(), each = s.invoices.filter(i => i.jobId === perVisit.id), monthly = s.invoices.filter(i => i.jobId === fixed.id)
  assert.equal(each.length, 3); assert.equal(monthly.length, 3)
  assert.deepEqual(visits.map(v => each.find(i => i.recurring.visitId === v.id).revisions[0].totals.total), ['57.00', '64.00', '71.00'])
  assert.ok(!each.some(i => i.recurring.visitId === skipped.id))
  assert.deepEqual(monthly.map(i => [i.recurring.proposedIssuedOn, i.revisions[0].totals.total]), [['2025-01-31', '240.00'], ['2025-02-28', '240.00'], ['2025-03-31', '240.00']])
  assert.equal(new Set(s.invoices.map(i => i.recurring.key)).size, 6)
  assert.ok(s.invoices.every(i => i.status === 'draft' && !i.revisions[0].approval && !i.dates))
  assert.equal((await h.request('/api/glove/reports/revenue.json?from=2025-01-01&to=2025-03-31').then(r => r.json())).total.revenue, '0.00')
  assert.deepEqual((await h.request('/api/glove/reports/receivables.json?asOf=2025-03-31').then(r => r.json())).totals, [])
  await h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
  await h.command('invoice.prepare', { jobId: perVisit.id }, { error: 'RECURRING_BILLING' })
  assert.equal(h.email.sent.length, 0)
  assert.ok(!(await b.techPerson.state()).jobs.find(j => j.id === perVisit.id).series.billing)
  assert.equal((await h.request('/api/glove/recurring-billing', { as: b.techPerson.cookie })).status, 403)
  await assertTrail(h, ['series.billingChanged', 'invoice.prepared', 'series.billingRun'])
  const branch = await h.command('branch.save', { name: 'North branch', prefix: 'NTH', timezone: 'America/Chicago', zips: [] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  await b.office.run('invoice.approve', { invoiceId: monthly[0].id, version: monthly[0].version, revision: 1 }, { error: 'NOT_FOUND' })
  assert.deepEqual((await h.request('/api/glove/recurring-billing', { as: b.office.cookie }).then(r => r.json())).missed, [])
})

test('PLAN-005, PLAN-012, PLAN-013 monthly approval keeps period-end issuance, later approval-based due date and historical corrections across aging, tax, CSV and QuickBooks', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await fixture(h, '2025-09-30T15:00:00Z')
  const legacy = await b.job('Existing ordinary invoice')
  await h.command('visit.book', { jobId: legacy.id, technicianId: b.tech.id, date: '2025-09-30', start: '08:00', end: '08:30' })
  await b.complete(legacy, '2025-09-30')
  let oldInvoice = await h.command('invoice.prepare', { jobId: legacy.id })
  oldInvoice = await h.command('invoice.approve', { invoiceId: oldInvoice.id, version: oldInvoice.version, revision: 1 })
  const oldExport = await h.command('invoice.export', {}), oldCsv = await h.request(`/api/glove/exports/${oldExport.id}.csv`).then(r => r.text())
  const oldDoor = `/api/glove/invoices/${oldInvoice.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`, oldQbo = await h.request(oldDoor).then(r => r.json())
  await clock(h, '2025-10-01T15:00:00Z')
  await h.command('business.save', { ...(await h.state()).business[0], taxSettings: { jurisdictions: [{ id: 'synthetic-glove-2', name: 'Local sales tax', rate: '10', zips: [], taxLabor: true }], defaultJurisdictionId: 'synthetic-glove-2' } })
  let job = await b.job('Monthly commercial PM', '100.00', 'TAXABLE')
  job = await b.repeat(job, { mode: 'fixed-monthly', lines: [line('240.00', 'TAXABLE')] }, { date: '2025-10-15', rule: { unit: 'month', interval: 3 }, until: '2025-11-30' })
  await clock(h, '2025-11-01T04:59:00Z'); await b.office.run('series.billingRun', {})
  let invoice = (await h.state()).invoices.find(i => i.jobId === job.id)
  assert.equal(invoice.recurring.periodEnd, '2025-10-31')
  await b.techPerson.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'FORBIDDEN' })
  await b.agent.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'FORBIDDEN' })
  await clock(h, '2025-10-30T16:00:00Z')
  await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'BILLING_EARLY' })
  await clock(h, '2025-11-03T18:00:00Z')
  invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  assert.deepEqual([invoice.dates.issuedOn, invoice.dates.dueOn, invoice.dates.approvedOn], ['2025-10-31', '2025-11-17', '2025-11-03'])
  assert.equal(invoice.approvalAt.at, '2025-11-03T18:00:00.000Z')
  const aging = async asOf => (await h.request(`/api/glove/reports/receivables.json?asOf=${asOf}`).then(r => r.json())).customers.flatMap(c => c.invoices).find(i => i.id === invoice.id)
  assert.equal(await aging('2025-11-02'), undefined)
  for (const [date, bucket] of [['2025-11-17', 'current'], ['2025-11-18', '1-30'], ['2025-12-17', '1-30'], ['2025-12-18', '31-60']]) assert.equal((await aging(date)).bucket, bucket)
  const revenue = await h.request('/api/glove/reports/revenue.json?from=2025-10-01&to=2025-10-31').then(r => r.json())
  assert.equal(revenue.total.revenue, '240.00'); assert.equal(revenue.approvedAfterPeriodEnd[0].invoiceId, invoice.id)
  const tax = await h.request('/api/glove/reports/tax.json?from=2025-10-01&to=2025-10-31').then(r => r.json())
  assert.equal(tax.jurisdictions[0].tax, '24.00'); assert.equal(tax.approvedAfterPeriodEnd[0].issuedOn, '2025-10-31')
  const exported = await h.command('invoice.export', {}), csv = await h.request(`/api/glove/exports/${exported.id}.csv`).then(r => r.text())
  assert.ok(csv.includes('10/31/2025,11/17/2025'))
  const qboDoor = `/api/glove/invoices/${invoice.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`
  const qbo = await h.request(qboDoor).then(r => r.json())
  assert.deepEqual([qbo.TxnDate, qbo.DueDate], ['2025-10-31', '2025-11-17'])
  const dates = invoice.dates
  await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 })
  invoice = (await h.state()).invoices.find(i => i.id === invoice.id)
  const correction = await h.command('invoice.correct', { invoiceId: invoice.id, version: invoice.version, reason: 'Approved corrected price', lines: [line('250.00', 'TAXABLE')] })
  await h.command('invoice.approve', { invoiceId: invoice.id, version: correction.version, revision: 2 })
  assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, dates)
  const after = await h.request(qboDoor).then(r => r.json()); assert.deepEqual([after.TxnDate, after.DueDate], [qbo.TxnDate, qbo.DueDate])
  await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 14 })
  await clock(h, '2025-12-01T05:30:00Z'); await b.office.run('series.billingRun', {})
  const november = (await h.state()).invoices.find(i => i.recurring?.periodEnd === '2025-11-30')
  const approved = await h.command('invoice.approve', { invoiceId: november.id, version: november.version, revision: 1 })
  assert.equal(approved.dates.issuedOn, '2025-11-30'); assert.equal(approved.dates.dueOn, '2025-12-14')
  assert.equal(await h.request(`/api/glove/exports/${oldExport.id}.csv`).then(r => r.text()), oldCsv)
  assert.deepEqual(await h.request(oldDoor).then(r => r.json()), oldQbo)
  assert.deepEqual((await h.state()).invoices.find(i => i.id === oldInvoice.id).dates, oldInvoice.dates)
})

test('PLAN-005, PLAN-012, PLAN-013 forward prices, pauses, fixed after-visit auto-approval, on-close, as-needed and missed price review preserve exactly-once evidence', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await fixture(h, '2025-01-01T16:00:00Z')
  let fixed = await b.job('Fixed after visit'), closed = await b.job('Invoice on close'), reminder = await b.job('Office billing reminder'), unpriced = await b.job('Unpriced material')
  fixed = await b.repeat(fixed, { mode: 'fixed-after-visit', lines: [line('80.00')], autoApprove: true })
  closed = await b.repeat(closed, { mode: 'on-close' }, { start: '10:00', end: '10:30', until: '2025-01-01' })
  reminder = await b.repeat(reminder, { mode: 'as-needed' }, { start: '11:00', end: '11:30' })
  unpriced = await b.repeat(unpriced, { mode: 'per-visit' }, { start: '12:00', end: '12:30' })
  await b.complete(fixed, '2025-01-01')
  await h.scheduled('2025-01-01T16:00:00Z')
  let first = (await h.state()).invoices.find(i => i.jobId === fixed.id)
  assert.equal(first.status, 'approved'); assert.ok(first.approvalAt.autoRule)
  await b.complete(closed, '2025-01-01')
  assert.equal((await h.state()).invoices.filter(i => i.jobId === closed.id).length, 1)
  const missingVisit = (await h.state()).visits.find(v => v.jobId === unpriced.id && v.local.date === '2025-01-01')
  await b.techPerson.run('visit.arrive', { visitId: missingVisit.id, deviceTime: missingVisit.startAt })
  await b.techPerson.run('visit.capture', { visitId: missingVisit.id, deviceTime: missingVisit.startAt, kind: 'material', description: 'Uncatalogued part', quantity: '1' })
  await b.techPerson.run('visit.complete', { visitId: missingVisit.id, deviceTime: missingVisit.endAt, summary: 'Fitted part', signoff: { absentReason: 'Customer away' } })
  const missing = await h.request('/api/glove/recurring-billing').then(r => r.json())
  assert.ok(missing.missed.some(m => m.jobId === unpriced.id && /not in the price book/.test(m.reason)))
  const state = await h.state(), current = state.jobs.find(j => j.id === fixed.id)
  await h.command('series.billing', { jobId: fixed.id, version: current.version, from: '2025-01-08', reason: 'New price from next visit', billing: { mode: 'fixed-after-visit', lines: [line('90.00')], autoApprove: true, paused: true } })
  await clock(h, '2025-01-08T16:00:00Z'); await b.complete(fixed, '2025-01-08')
  assert.equal((await h.state()).invoices.filter(i => i.jobId === fixed.id).length, 1)
  const paused = (await h.state()).jobs.find(j => j.id === fixed.id)
  await h.command('series.billing', { jobId: fixed.id, version: paused.version, from: '2025-01-15', reason: 'Resume billing', billing: { mode: 'fixed-after-visit', lines: [line('90.00')], autoApprove: true } })
  await clock(h, '2025-01-15T16:00:00Z'); await b.complete(fixed, '2025-01-15'); await h.command('series.billingRun', {})
  const invoices = (await h.state()).invoices.filter(i => i.jobId === fixed.id)
  assert.deepEqual(invoices.map(i => i.revisions[0].totals.total), ['80.00', '90.00'])
  assert.deepEqual((await h.state()).invoices.find(i => i.id === first.id), first)
  const latest = (await h.state()).jobs.find(j => j.id === fixed.id)
  await h.command('series.billing', { jobId: fixed.id, version: latest.version, from: '2025-01-01', reason: 'Retrospective change', billing: { mode: 'as-needed' } }, { error: 'BILLING_DATE' })
  await clock(h, '2025-02-01T05:59:00Z'); await h.command('series.billingRun', {}); await h.command('series.billingRun', {})
  const s = await h.state()
  assert.equal(s.notices.filter(n => n.jobId === reminder.id && n.recurringBillingKey).length, 1)
  assert.equal(s.invoices.filter(i => i.jobId === reminder.id).length, 0)
  assert.equal(s.invoices.filter(i => i.jobId === closed.id).length, 1)
  assert.equal(h.email.sent.length, 0)
  await assertTrail(h, ['series.billingReminder', 'series.billingMissed', 'invoice.autoApproved'])
})

test('PAY-008, PAY-027, PAY-028, PAY-029, PAY-030 explicit Owner test charges bind customer permission to a monthly rule and cap, settle once, and stop on withdrawal or rule change', async t => {
  const { connectPayments, paymentEvent } = await import('../fixtures/payment-journey.mjs')
  const { savedCardsEdge, registerSavedCard, savedCardIntent, confirmSavedCard } = await import('../fixtures/saved-cards.mjs')
  const h = await installation(); t.after(() => h.close())
  const scoped = await h.person('Scoped payment Owner', 'owner'), former = await h.person('Former payment Owner', 'owner'), custom = await h.person('Custom payment reader', 'viewer')
  const customRole = await h.command('role.save', { name: 'Payment evidence reader', permissions: ['reports.read', 'export.read'] })
  await h.command('role.set', { operatorId: custom.id, role: 'custom:' + customRole.id })
  await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
  const token = await h.command('token.issue', { name: 'Payment inspection', role: 'office' })
  const b = await fixture(h, '2025-01-01T16:00:00Z')
  await connectPayments(h)
  const edge = savedCardsEdge(h)
  const card = await registerSavedCard(h, b.customer.id, { scope: 'autopay' })
  let job = await b.job('Authorized monthly PM')
  job = await b.repeat(job, { mode: 'fixed-monthly', lines: [line('240.00')], autoApprove: true })
  const partialJob = await b.repeat(await b.job('Partly paid monthly PM'), { mode: 'fixed-monthly', lines: [line('240.00')], autoApprove: true }, { start: '14:00', end: '15:00' })
  const draftJob = await b.repeat(await b.job('Approval required monthly PM'), { mode: 'fixed-monthly', lines: [line('240.00')] }, { start: '12:00', end: '13:00' })
  const unknownJob = await b.repeat(await b.job('Unknown monthly PM'), { mode: 'fixed-monthly', lines: [line('240.00')], autoApprove: true }, { start: '16:00', end: '17:00' })
  const consent = { jobId: job.id, version: job.version, cardId: card.id, maxAmount: '240.00', source: 'synthetic-glove-20', wording: 'Customer permits this monthly PM rule up to $240, using the saved card.', confirmed: true }
  await b.office.run('payment.autopayAuthorize', consent, { error: 'FORBIDDEN' })
  await h.command('payment.autopayAuthorize', { ...consent, confirmed: false }, { error: 'CONSENT' })
  await h.command('payment.autopayAuthorize', { ...consent, maxAmount: '0.00' }, { error: 'AMOUNT' })
  job = await h.command('payment.autopayAuthorize', consent)
  assert.equal((await b.office.state()).jobs.find(j => j.id === job.id).series.billing.autopay, undefined, 'authorization evidence stays owner-only')
  const authorization = job.series.billing.autopay
  assert.deepEqual(job.series.billing.autopayHistory, [authorization])
  assert.equal(authorization.ruleId, job.id)
  assert.equal(authorization.ruleRevision, 1)
  assert.equal(authorization.cadence, 'monthly')
  assert.equal(authorization.customerId, b.customer.id)
  assert.equal(authorization.cardId, card.id)
  assert.equal(authorization.by.id, (await h.state()).actor.id)
  assert.equal(authorization.by.name, 'Olivia Owner')
  assert.equal(authorization.maxAmount, '240.00')
  for (const other of [partialJob, unknownJob, draftJob]) await h.command('payment.autopayAuthorize', { ...consent, jobId: other.id, version: other.version })
  const posts = () => edge.calls.filter(c => c.method === 'POST').length
  const balances = () => h.request('/api/glove/balances').then(r => r.json())
  const refused = async (payload, code, message) => {
    const before = { posts: posts(), payments: (await h.state()).payments, balances: await balances() }
    const error = await h.command('payment.autopayCharge', payload, { error: code })
    if (message) assert.equal(error.message, message)
    assert.equal(posts(), before.posts, 'a refusal makes no provider POST')
    assert.deepEqual((await h.state()).payments, before.payments, 'a refusal reserves no payment')
    assert.deepEqual(await balances(), before.balances, 'a refusal changes no invoice balance')
  }
  let replay
  assert.equal(authorization.at, '2025-01-01T16:00:00.000Z')
  assert.equal(authorization.source, consent.source)
  assert.equal(authorization.wording, consent.wording)
  for (const [month, at] of [['01', '2025-02-01T05:59:00Z'], ['02', '2025-03-01T05:59:00Z'], ['03', '2025-04-01T04:59:00Z']]) {
    await clock(h, at); edge.at = Date.parse(at)
    await h.command('series.billingRun', {})
    const invoice = (await h.state()).invoices.find(i => i.jobId === job.id && i.recurring.periodEnd.startsWith('2025-' + month))
    const payload = { invoiceId: invoice.id, version: invoice.version, cardId: card.id, amount: '240.00', confirmed: true }
    const deniedBefore = { posts: posts(), payments: (await h.state()).payments, balances: await balances() }
    for (const person of [b.office, b.dispatcher, b.agent, b.techPerson, scoped, custom]) {
      for (const [type, input] of [['payment.autopayCharge', payload], ['payment.autopayAuthorize', consent], ['payment.autopayRevoke', { jobId: job.id, version: job.version, reason: 'Unauthorized' }]]) assert.equal((await person.run(type, input, { error: 'FORBIDDEN' })).message, 'Owner access required')
    }
    for (const type of ['payment.autopayAuthorize', 'payment.autopayRevoke', 'payment.autopayCharge']) {
      const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: randomUUID(), type, payload }, headers: { authorization: 'Bearer ' + token.token } })
      assert.equal(response.status, 403)
    }
    assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: randomUUID(), type: 'payment.autopayCharge', payload } })).status, 401)
    assert.equal(posts(), deniedBefore.posts)
    assert.deepEqual((await h.state()).payments, deniedBefore.payments)
    assert.deepEqual(await balances(), deniedBefore.balances, 'all authority refusals leave money unchanged')
    if (month === '01') {
      const draft = (await h.state()).invoices.find(i => i.jobId === draftJob.id)
      await refused({ ...payload, invoiceId: draft.id, version: draft.version }, 'INVOICE_STATE', 'Approve the invoice before charging')
      const inv = (await h.state()).invoices.find(i => i.jobId === partialJob.id)
      await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'check', reference: 'synthetic-glove-21', amount: '1.00' })
      await refused({ ...payload, invoiceId: inv.id, amount: '239.00' }, 'AMOUNT', 'The invoice must be fully unpaid')
      const unknownInvoice = (await h.state()).invoices.find(i => i.jobId === unknownJob.id)
      const unknownPayload = { ...payload, invoiceId: unknownInvoice.id, version: unknownInvoice.version }
      edge.unavailable = true
      const unknownId = randomUUID(), uncertain = await h.command('payment.autopayCharge', unknownPayload, { commandId: unknownId })
      edge.unavailable = false
      const count = posts()
      assert.deepEqual(await h.command('payment.autopayCharge', unknownPayload, { commandId: unknownId }), uncertain)
      await refused(unknownPayload, 'PAYMENT_PENDING', 'A prior payment attempt is unresolved; no further charge was requested')
      assert.equal(posts(), count)
      assert.deepEqual((await h.state()).payments.find(p => p.id === uncertain.id).effects, [])
    }
    const before = edge.calls.filter(c => c.method === 'POST').length
    assert.equal(before, Number(month), 'billing alone never charges beyond the explicit requests')
    await h.command('payment.autopayCharge', { ...payload, amount: '1.00' }, { error: 'AMOUNT' })
    if (month === '01') {
      const attached = edge.methods.get(card.stripeMethodId), originalCustomer = attached.customer
      attached.customer = 'cus_synthetic-glove-99'
      await refused(payload, 'SAVED_CARD')
      attached.customer = originalCustomer
    }
    const commandId = randomUUID()
    if (month === '03') edge.beforeRespond = async () => {
      edge.beforeRespond = null
      const current = (await h.state()).jobs.find(j => j.id === job.id)
      await h.command('payment.autopayRevoke', { jobId: job.id, version: current.version, reason: 'synthetic-glove-22 withdrawal in flight' })
    }
    const [payment, duplicate] = await Promise.all([h.command('payment.autopayCharge', payload, { commandId }), h.command('payment.autopayCharge', payload, { commandId })])
    assert.deepEqual(duplicate, payment, 'concurrent replay has one durable outcome')
    if (month === '01') replay = { payload, commandId, payment }
    await h.command('payment.autopayCharge', payload, { commandId })
    assert.equal(edge.calls.filter(c => c.method === 'POST').length, before + 1)
    assert.equal(payment.autopay.authorizationId, authorization.id)
    assert.equal((await h.state()).payments.find(p => p.id === payment.id).status, 'reserved')
    if (month === '02') {
      const intent = savedCardIntent(h, payment.id)
      Object.assign(intent, { status: 'requires_payment_method', amount_received: 0, latest_charge: null, last_payment_error: { decline_code: 'expired_card' } })
      assert.equal((await paymentEvent(h, intent, 'payment_intent.payment_failed', { at: Date.parse(at) / 1000 })).status, 200)
      await h.command('payment.autopayCharge', payload, { error: 'PAYMENT_PENDING' })
      assert.equal((await h.state()).payments.find(p => p.id === payment.id).failureReason, 'Card expired')
    } else {
      if (month === '03') {
        await refused(payload, 'CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
        assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000, signature: false })).status, 401)
      }
      assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000 })).status, 200)
      assert.equal((await confirmSavedCard(h, payment.id, { at: Date.parse(at) / 1000 })).status, 200)
      assert.equal((await h.state()).payments.find(p => p.id === payment.id).effects.length, 1)
      if (month === '03') {
        const current = (await h.state()).jobs.find(j => j.id === job.id)
        await h.command('payment.autopayAuthorize', { ...consent, version: current.version, source: 'synthetic-glove-23', wording: 'Fresh recorded monthly permission after withdrawal.' })
      }
      await h.command('payment.autopayCharge', payload, { error: 'AMOUNT' })
    }
  }
  let latest = (await h.state()).jobs.find(j => j.id === job.id)
  latest = await h.command('payment.autopayRevoke', { jobId: job.id, version: latest.version, reason: 'Customer withdrew recurring permission' })
  const feb = (await h.state()).invoices.find(i => i.jobId === job.id && i.recurring?.periodEnd === '2025-02-28')
  const failedPayload = { invoiceId: feb.id, version: feb.version, cardId: card.id, amount: '240.00', confirmed: true }
  await refused(failedPayload, 'CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
  latest = await h.command('payment.autopayAuthorize', { ...consent, version: latest.version, maxAmount: '239.99' })
  await refused(failedPayload, 'CARD_AUTHORIZATION', 'The invoice exceeds the authorized USD maximum')
  latest = await h.command('payment.autopayRevoke', { jobId: job.id, version: latest.version, reason: 'Replace maximum with fresh permission' })
  latest = await h.command('payment.autopayAuthorize', { ...consent, version: latest.version })
  const retained = structuredClone(latest.series.billing.autopayHistory)
  assert.equal(new Set(retained.map(a => a.id)).size, 4, 'replacement permissions have distinct identities')
  assert.deepEqual(retained[0], { ...authorization, revokedAt: '2025-04-01T04:59:00.000Z', revokedBy: authorization.by.id, reason: 'synthetic-glove-22 withdrawal in flight' })
  assert.equal(retained[1].source, 'synthetic-glove-23')
  assert.equal(retained[1].wording, 'Fresh recorded monthly permission after withdrawal.')
  assert.equal(retained[1].reason, 'Customer withdrew recurring permission')
  assert.equal(retained[2].maxAmount, '239.99')
  assert.equal(retained[2].reason, 'Replace maximum with fresh permission')
  assert.equal(retained[3].revokedAt, undefined)
  latest = await h.command('series.billing', { jobId: job.id, version: latest.version, from: '2025-04-01', reason: 'Different pricing rule', billing: { mode: 'fixed-monthly', lines: [line('200.00')] } })
  assert.deepEqual(latest.series.billing.autopayHistory, retained, 'billing edits retain all permission evidence')
  await refused(failedPayload, 'CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
  latest = await h.command('series.billing', { jobId: job.id, version: latest.version, from: '2025-04-01', reason: 'Pause collection', billing: { mode: 'fixed-monthly', lines: [line('240.00')], paused: true } })
  await refused(failedPayload, 'CARD_AUTHORIZATION', 'Billing is paused; no charge was requested')
  // A different rule identity never borrows the first job's permission.
  await refused({ ...failedPayload, invoiceId: (await h.state()).invoices.find(i => i.jobId === partialJob.id && i.recurring.periodEnd === '2025-02-28').id, cardId: (await registerSavedCard(h, b.customer.id, { scope: 'autopay', n: 2 })).id }, 'CARD_AUTHORIZATION', 'Fresh customer permission is required for this card and billing rule')
  const answer = h.stripePayments.answer
  let withdrawRole = true
  h.stripePayments.answer = async request => {
    const response = await answer(request)
    if (withdrawRole && request.method === 'GET' && new URL(request.url).pathname.includes('payment_methods')) {
      withdrawRole = false
      await h.command('role.set', { operatorId: former.id, role: 'office' })
    }
    return response
  }
  const authorityInvoice = (await h.state()).invoices.find(i => i.jobId === unknownJob.id && i.recurring.periodEnd === '2025-02-28')
  const authorityBefore = { posts: posts(), payments: (await h.state()).payments, balances: await balances() }
  await former.run('payment.autopayCharge', { ...failedPayload, invoiceId: authorityInvoice.id, version: authorityInvoice.version }, { error: 'AUTH' })
  h.stripePayments.answer = answer
  assert.equal(posts(), authorityBefore.posts)
  assert.deepEqual((await h.state()).payments, authorityBefore.payments, 'changed authority cannot commit a reservation')
  assert.deepEqual(await balances(), authorityBefore.balances)
  await former.run('payment.autopayCharge', replay.payload, { error: 'FORBIDDEN' })
  const count = posts()
  await h.command('payment.autopayCharge', replay.payload, { commandId: replay.commandId })
  assert.equal(posts(), count, 'replay after withdrawal never repeats the request')
  assert.equal(h.email.sent.length, 0)
  const trail = await assertTrail(h, ['autopay.authorized', 'autopay.revoked', 'payment.savedCardRequested', 'payment.paid', 'payment.failed'])
  assert.deepEqual(trail.exported.jobs.find(j => j.id === job.id).series.billing.autopayHistory, retained)
  for (const permission of retained) {
    const authored = trail.exported.timeline.find(e => e.kind === 'autopay.authorized' && JSON.parse(e.data).authorizationId === permission.id)
    assert.ok(authored, 'every distinct permission has an exported Activity event')
    assert.equal(authored.actor_id, permission.by.id)
    assert.equal(authored.at, permission.at)
    if (permission.revokedAt) {
      const withdrawn = trail.exported.timeline.find(e => e.kind === 'autopay.revoked' && JSON.parse(e.data).authorizationId === permission.id)
      assert.ok(withdrawn, 'every withdrawal stays attributable')
      assert.equal(withdrawn.actor_id, permission.revokedBy)
      assert.equal(withdrawn.at, permission.revokedAt)
    }
  }
  for (const person of [b.office, b.dispatcher, scoped, custom]) {
    const state = await person.state()
    assert.equal(state.jobs.find(j => j.id === job.id).series.billing.autopayHistory, undefined)
    for (const payment of state.payments) assert.equal(payment.savedCard?.authorizedAt, undefined)
    for (const saved of state.customers.find(c => c.id === b.customer.id).savedCards ?? []) assert.deepEqual(saved.authorization, { scope: 'autopay' })
    for (const path of ['/api/glove/activity', '/api/glove/export', '/api/glove/jobs/' + job.id + '/timeline']) {
      const response = await h.request(path, { as: person.cookie })
      assert.equal(response.status, person === b.dispatcher && path === '/api/glove/export' ? 403 : 200)
      const body = await response.json(), serialized = JSON.stringify(body)
      assert.ok(!serialized.includes(authorization.wording) && !serialized.includes('synthetic-glove-23'), 'permission evidence is Owner-only on every read door')
      assert.ok(!(body.events ?? body.timeline ?? []).some(e => e.kind.startsWith('autopay.')))
    }
    const current = (await h.state()).customers.find(c => c.id === b.customer.id)
    if (person === b.office) {
      const result = await person.run('customer.save', { ...current, name: current.name })
      assert.equal(result.savedCards[0].authorization.wording, undefined, 'ordinary command outcomes do not expose consent evidence')
    }
  }
  await h.command('token.revoke', { tokenId: token.id })
  assert.equal((await h.request('/api/glove/state', { headers: { authorization: 'Bearer ' + token.token } })).status, 401)
  assert.doesNotMatch(JSON.stringify(trail.exported), /client_secret|cardNumber|stripe-signature/)
  assert.deepEqual((await h.state()).invoices.filter(i => i.jobId === job.id).map(i => [i.dates.issuedOn, i.revisions[0].totals.total]), [['2025-01-31', '240.00'], ['2025-02-28', '240.00'], ['2025-03-31', '240.00']])
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const erased = await h.request('/api/glove/export').then(r => r.json())
  assert.equal(erased.jobs.find(j => j.id === job.id).series, undefined)
  assert.equal(erased.customers.find(c => c.id === customer.id).savedCards, undefined)
  assert.ok(!JSON.stringify(erased).includes(authorization.wording))
  assert.ok(!JSON.stringify(erased).includes('synthetic-glove-23'))
  const recovered = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: replay.commandId, type: 'payment.autopayCharge', payload: replay.payload } }).then(r => r.json())
  assert.equal(recovered.error.code, 'ERASED', 'erasure removes the personal saved result')
  assert.equal(posts(), count)
})
