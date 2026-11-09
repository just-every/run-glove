import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { scenario } from '../fixtures/scenario.mjs'
import { connectPayments, paymentEvent } from '../fixtures/payment-journey.mjs'
import assert from 'node:assert/strict'
import { installation, morningBriefFixture, morningBriefAt, mailEvents, postEvents, assertTrail, fixedMonthlyReports } from './harness.mjs'

const read = async (h, at = morningBriefAt, options = {}) => {
  const response = await h.request(`/api/glove/brief?at=${at}`, options)
  assert.equal(response.status, 200)
  return response.json()
}
const ordered = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id))
const normalized = sections => Object.fromEntries(Object.entries(sections).map(([key, rows]) => [key, ordered(rows)]))
const item = (kind, id, text, label, href) => ({ kind, id, text, action: { label, href } })
const expected = f => ({
  atRisk: [
    item('atRisk', f.arrived.visit.id, `${f.arrived.job.number} at 6:00 AM for Still Open: Tom Brooks is still on site after the planned end`, 'Open dispatch', '#dispatch'),
    item('atRisk', f.late.visit.id, `${f.late.job.number} at 7:00 AM for Late Arrival: Priya Nair has not arrived 15 minutes after the start`, 'Open dispatch', '#dispatch'),
  ],
  unbilled: [
    item('unbilled', f.noInvoice.job.id, `${f.noInvoice.job.number} for No Invoice is complete with no invoice`, 'Prepare invoice', '#invoices'),
    item('unbilled', f.draftInvoice.job.id, `${f.draftInvoice.job.number} for Draft Invoice is complete and ${f.draft.number} awaits approval`, 'Approve invoice', '#invoices'),
  ],
  overEstimate: [item('overEstimate', f.late.job.id, `${f.late.job.number} for Late Arrival has cost $150.00 against a $100.00 estimate`, 'Review job costs', '#jobs')],
  leads: [
    item('leadWaiting', f.waiting.id, "Waiting Lead's google request has been new for 24 hours", 'Contact the customer', '#quotes'),
    item('leadWaiting', f.contacted.id, "Contacted Lead's google request has been contacted for 24 hours", 'Quote the request', '#quotes'),
  ], agreements: [], overdue: [],
})
const snapshot = async h => ({
  state: await h.state(),
  commands: (await h.db.prepare('SELECT * FROM glove_commands ORDER BY id').all()).results,
  events: (await h.db.prepare('SELECT * FROM glove_events ORDER BY id').all()).results,
})

// Native commands create the normal records. These three retained edge states
// have no current creation command; seed their storage shape, then exercise
// only the production HTTP reader, including its actual Worker restart.
async function retainedEdges(h, f) {
  const visit = { ...f.later.visit, id: 'synthetic-glove-unassigned', technicianId: null }
  const requests = ['scheduled', 'assessed'].map(status => ({ ...f.waiting, id: `synthetic-glove-${status}`, status }))
  for (const [kind, row] of [['visits', visit], ...requests.map(row => ['enquiries', row])]) await h.db.prepare('INSERT INTO glove_records (kind,id,version,data) VALUES (?,?,?,?)').bind(kind, row.id, row.version, JSON.stringify(row)).run()
  return visit
}

async function recordsJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h), unassigned = await retainedEdges(h, f)
    const want = expected(f)
    want.atRisk.push(item('atRisk', unassigned.id, `${f.later.job.number} at 4:00 PM for Later Today: no technician is assigned`, 'Open dispatch', '#dispatch'))
    const before = await snapshot(h), outbound = h.outbound.attempts
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      const brief = await read(h)
      assert.deepEqual([brief.date, brief.timezone, brief.at, brief.preparedBy, brief.notTracked], ['2026-11-09', 'America/Chicago', morningBriefAt, 'Glove, from your records', []])
      for (const section of ['atRisk', 'unbilled', 'overEstimate', 'leads', 'agreements', 'overdue']) assert.deepEqual(ordered(brief.sections[section]), ordered(want[section]), `point ${ { atRisk: 5, unbilled: 6, overEstimate: 7, leads: 8 }[section] ?? 1}: complete ${section} identities, text and links`)
      const early = await read(h, '2026-11-09T13:14:00.000Z')
      assert.deepEqual(early.sections.atRisk, [want.atRisk[2]], 'one minute before both thresholds only the unassigned visit is at risk')
      assert.deepEqual(early.sections.leads, [], 'new and contacted leads just before 24 hours are absent')
      assert.deepEqual(await snapshot(h), before, 'every read preserves state version, domain records, events and saved command outcomes')
    }
    assert.equal(h.outbound.attempts, outbound, 'brief reads make no outbound request, including email, push or model')
    assert.deepEqual([h.email.sent.length, h.pushes.sent.length, h.models.calls.length], [0, 0, 0])
  } finally { await h.close() }
}

async function authorityJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h)
    const excluded = []
    for (const role of ['office', 'dispatcher', 'technician']) excluded.push(await h.person(`Excluded ${role}`, role))
    const custom = await h.command('role.save', { name: 'Brief reader', permissions: ['customer.save'] })
    excluded.push(await h.person('Excluded Custom', `custom:${custom.id}`))
    const token = await h.command('token.issue', { name: 'Brief integration', role: 'dispatcher' })
    const branch = await h.command('branch.save', { name: 'North', prefix: 'NTH', timezone: 'America/Chicago', zips: [] })
    const scoped = await h.person('North Owner', 'owner')
    const own = await f.job('North Only', f.labor, branch.id)
    const tech = await h.command('technician.save', { name: 'North Technician', branchId: branch.id })
    await h.command('visit.book', { jobId: own.job.id, technicianId: tech.id, date: '2026-11-09', start: '06:00', end: '07:00' })
    await h.command('expense.record', { jobId: own.job.id, category: 'permit', vendor: 'North permit', amount: '175.00', billable: false })
    await h.command('branch.limit', { operatorId: scoped.id, branchId: branch.id })
    // Prime the shared integration-token usage timestamp before comparing domain reads.
    await h.mf.dispatchFetch(h.origin + '/api/glove/brief', { headers: { authorization: `Bearer ${token.token}` } })
    const before = await snapshot(h), outbound = h.outbound.attempts
    for (const person of excluded) {
      const response = await h.request('/api/glove/brief', { as: person.cookie })
      assert.equal(response.status, 403, person.name)
      assert.equal((await response.json()).error.code, 'FORBIDDEN')
      assert.deepEqual(await snapshot(h), before)
    }
    assert.equal((await h.request('/api/glove/brief', { as: '' })).status, 401)
    const tokenRead = await h.mf.dispatchFetch(h.origin + '/api/glove/brief', { headers: { authorization: `Bearer ${token.token}` } })
    assert.equal(tokenRead.status, 403)
    assert.deepEqual(await snapshot(h), before)
    const limited = await read(h, morningBriefAt, { as: scoped.cookie })
    assert.equal(limited.sections.atRisk.length, 1)
    assert.equal(limited.sections.atRisk[0].text, `${own.job.number} at 6:00 AM for North Only: North Technician has not arrived 15 minutes after the start`)
    assert.deepEqual(limited.sections.overEstimate, [item('overEstimate', own.job.id, `${own.job.number} for North Only has cost $175.00 against a $100.00 estimate`, 'Review job costs', '#jobs')])
    for (const section of ['unbilled', 'leads', 'agreements', 'overdue']) assert.deepEqual(limited.sections[section], [])
    const prior = await read(h, '2026-11-09T05:59:00.000Z'), next = await read(h, '2026-11-09T06:00:00.000Z')
    assert.deepEqual([prior.date, next.date], ['2026-11-08', '2026-11-09'])
    assert.deepEqual(prior.sections.atRisk.map(x => x.id), [f.yesterday.visit.id])
    assert.deepEqual(next.sections.atRisk, [], 'at midnight today no assigned visit is late')
    assert.equal((await h.request('/api/glove/brief?at=tomorrow')).status, 400)
    assert.deepEqual(await snapshot(h), before)
    assert.equal(h.outbound.attempts, outbound)
    await h.restart()
    assert.deepEqual(await read(h, morningBriefAt, { as: scoped.cookie }), limited, 'branch-scoped brief survives actual Worker restart')
    const current = await h.request('/api/glove/brief').then(r => r.json())
    assert.deepEqual(current, await read(h), 'an ordinary read uses the pinned runtime instant')
    assert.deepEqual(await snapshot(h), before)
    await h.command('role.set', { operatorId: scoped.id, role: 'office' })
    const revoked = await snapshot(h)
    assert.equal((await h.request('/api/glove/brief', { as: scoped.cookie })).status, 403)
    assert.deepEqual(await snapshot(h), revoked, 'the next read after owner withdrawal is refused without effects')
  } finally { await h.close() }
}

async function deliveryJourney() {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h), signer = mailEvents('sendgrid')
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-brief-mail', eventKey: signer.eventKey, fromEmail: ['synthetic-glove-office', 'example.test'].join('@') })
    await h.command('mail.morning', { enabled: true, time: '07:15' })
    const brief = await read(h)
    assert.deepEqual(normalized(brief.sections), normalized(expected(f)))
    assert.equal(h.email.sent.length, 0, 'reading with morning mail enabled sends nothing')
    await h.scheduled('2026-11-09T13:14:00.000Z')
    assert.equal(h.email.sent.length, 0)
    await Promise.all([h.scheduled(morningBriefAt), h.scheduled(morningBriefAt)])
    assert.equal(h.email.sent.length, 1)
    const sent = h.email.sent[0], titles = [['overdue', 'Overdue invoices'], ['atRisk', 'At risk today'], ['unbilled', 'Unbilled work'], ['overEstimate', 'Over their cost estimate'], ['leads', 'Leads waiting'], ['agreements', 'Agreement visits due']]
    const text = `Pacheco Plumbing & HVAC morning brief for 2026-11-09, prepared by Glove, from your records. It is read only; open Glove to act on any item.\n\n${titles.map(([key, title]) => `${title}\n${brief.sections[key].map(x => `- ${x.text} (${x.action.label})`).join('\n') || 'Nothing here.'}`).join('\n\n')}\n\n`
    assert.equal(sent.body.content[0].value, text, 'complete email text equals the independently checked public brief at this instant')
    assert.deepEqual([sent.provider, sent.body.custom_args.rer_delivery_id, sent.body.subject], ['sendgrid', 'brief:2026-11-09', 'Morning brief for 2026-11-09 from Pacheco Plumbing & HVAC'])
    assert.equal(sent.to, ['owner', 'example.test'].join('@'))
    assert.equal((await read(h)).emailed.status, 'accepted', 'provider acceptance is not claimed as delivery')
    const trail = await assertTrail(h, ['email.queued', 'email.accepted'])
    const facts = trail.exported.timeline.filter(e => e.subject_kind === 'brief')
    assert.deepEqual(facts.map(e => [e.kind, e.subject_id, JSON.parse(e.data).date]), [['email.queued', 'brief:2026-11-09', '2026-11-09'], ['email.accepted', 'brief:2026-11-09', '2026-11-09']])
    assert.equal(JSON.parse(facts[1].data).providerMessageId, 'sg-receipt-1')
    await h.restart()
    await h.scheduled('2026-11-09T14:00:00.000Z')
    assert.equal(h.email.sent.length, 1, 'later cron after actual Worker restart cannot duplicate this local date')
    assert.deepEqual((await read(h)).sections, brief.sections)
    assert.equal(h.pushes.sent.length, 0)
  } finally { await h.close() }
}

test('AGENT-008 points 1–8: fixed-date owner brief, authority, cron delivery and Worker restart', async () => {
  await recordsJourney()
  await authorityJourney()
  await deliveryJourney()
})

const financialAt = '2026-11-09T16:00:00.000Z'
const json = async (h, path, options = {}) => {
  const response = await h.request(path, options)
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}
const pureBrief = async (h, at, options = {}) => {
  const before = await snapshot(h), attempts = h.outbound.attempts
  const brief = await read(h, at, options)
  assert.deepEqual(await snapshot(h), before, 'opening the brief changes no state version, record, event or saved command outcome')
  assert.equal(h.outbound.attempts, attempts, 'opening the brief makes no email, push or other provider request')
  return brief
}
const overdueItem = (inv, customer, balance, due, currency = 'USD') => item('overdue', inv.id, `${inv.number} for ${customer}: $${balance} ${currency} overdue since ${due}`, 'Review overdue invoice', `#invoices/${inv.id}`)

// All records enter through production commands; only provider answers and
// the pre-PLAN-013 approval implementation are substituted at their boundaries.
test('AGENT-016 points 1–4: opened briefs preserve state and show exact financial and agreement outcomes across local dates and Worker upgrades', async t => {
  await scenario(t, 'point 1: opening is read only and only Owner opt-in permits one provider-confirmed morning email per local date', async ({ after, diagnostic }) => {
    const h = await installation({ at: financialAt }); after(() => h.close())
    await h.command('business.save', { name: 'Brief business', timezone: 'America/Chicago' })
    const office = await h.person('Brief mail Office', 'office')
    const ownerEmail = ['owner', 'example.test'].join('@')
    const signer = mailEvents('sendgrid')
    assert.deepEqual((await pureBrief(h, financialAt)).emailed, { enabled: false })
    const offAttempts = h.outbound.attempts
    await h.scheduled(financialAt)
    assert.equal(h.outbound.attempts, offAttempts, 'cron cannot send before the owner enables morning email')
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-brief-read', eventKey: signer.eventKey, fromEmail: ['brief', 'example.test'].join('@') })
    assert.deepEqual((await pureBrief(h, financialAt)).emailed, { enabled: false }, 'connecting email never opts the owner into morning delivery')
    await h.scheduled(financialAt)
    assert.equal(h.email.sent.length, 0)
    await office.run('mail.morning', { enabled: true, time: '07:00' }, { error: 'FORBIDDEN' })
    assert.deepEqual((await pureBrief(h, financialAt)).emailed, { enabled: false })
    await h.command('mail.morning', { enabled: true, time: '07:00' })
    const baseline = await snapshot(h), attempts = h.outbound.attempts
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      for (const [at, date] of [['2026-11-09T05:59:59.999Z', '2026-11-08'], ['2026-11-09T06:00:00.000Z', '2026-11-09'], [financialAt, '2026-11-09'], ['2026-11-10T06:00:00.000Z', '2026-11-10']]) {
        await h.setTime(at)
        assert.equal((await pureBrief(h, at)).date, date)
      }
    }
    assert.deepEqual(await snapshot(h), baseline)
    assert.equal(h.outbound.attempts, attempts)
    assert.deepEqual([h.email.sent.length, h.pushes.sent.length], [0, 0])
    diagnostic('PROBE AGENT-016 1 read: four brief instants with morning email enabled, before and after restart -> zero provider attempts and identical state, events and outcomes')
    await h.setTime('2026-11-09T12:59:59.999Z')
    await h.scheduled('2026-11-09T12:59:59.999Z')
    assert.equal(h.email.sent.length, 0, 'before 07:00 Chicago there is no delivery')
    const sendAt = '2026-11-09T13:00:00.000Z'
    await h.setTime(sendAt)
    await Promise.all([h.scheduled(sendAt), h.scheduled(sendAt)])
    assert.equal(h.email.sent.length, 1)
    const sent = h.email.sent[0], deliveryId = 'brief:2026-11-09'
    assert.deepEqual([sent.to, sent.body.subject, sent.body.custom_args.rer_delivery_id], [ownerEmail, 'Morning brief for 2026-11-09 from Brief business', deliveryId])
    assert.equal((await pureBrief(h, sendAt)).emailed.status, 'accepted', 'provider acceptance alone never claims delivery')
    const at = Date.parse(sendAt) / 1000
    const event = { email: ownerEmail, timestamp: at, event: 'delivered', sg_event_id: 'synthetic-glove-brief-delivered', sg_message_id: 'sg-receipt-1.filter0001', rer_delivery_id: deliveryId }
    const unsigned = await snapshot(h)
    assert.equal((await postEvents(h, { raw: JSON.stringify([event]), headers: {} })).status, 401)
    assert.deepEqual(await snapshot(h), unsigned, 'an unsigned delivery cannot create a provider fact')
    assert.equal((await postEvents(h, signer.signed([{ ...event, email: ['wrong', 'example.test'].join('@') }], { at }))).status, 401)
    assert.deepEqual(await snapshot(h), unsigned, 'even a signed wrong-recipient delivery changes nothing')
    const callback = signer.signed([event], { at })
    assert.equal((await postEvents(h, callback)).status, 200)
    const delivered = await snapshot(h)
    assert.equal((await postEvents(h, callback)).status, 200)
    assert.deepEqual(await snapshot(h), delivered, 'replaying a confirmed outcome creates no second fact')
    const outcome = (await pureBrief(h, sendAt)).emailed
    assert.deepEqual([outcome.date, outcome.to, outcome.status], ['2026-11-09', ownerEmail, 'delivered'])
    await h.restart()
    for (const instant of ['2026-11-09T14:00:00.000Z', '2026-11-10T05:59:59.999Z', '2026-11-10T06:00:00.000Z']) {
      await h.setTime(instant); await h.scheduled(instant)
      assert.equal(h.email.sent.length, 1, 'restart, later UTC date and next local midnight do not send again')
    }
    const nextAt = '2026-11-10T13:00:00.000Z'
    await h.setTime(nextAt)
    await Promise.all([h.scheduled(nextAt), h.scheduled(nextAt)])
    assert.equal(h.email.sent.length, 2)
    assert.equal(h.email.sent[1].body.custom_args.rer_delivery_id, 'brief:2026-11-10')
    assert.equal((await pureBrief(h, nextAt)).emailed.status, 'accepted')
    await h.command('mail.morning', { enabled: false })
    await h.setTime('2026-11-11T13:00:00.000Z'); await h.scheduled('2026-11-11T13:00:00.000Z')
    assert.equal(h.email.sent.length, 2, 'turning delivery off stops the next local date')
    assert.deepEqual((await pureBrief(h, '2026-11-11T13:00:00.000Z')).emailed, { enabled: false })
    assert.equal(h.pushes.sent.length, 0)
    const { exported } = await assertTrail(h, ['mail.morning', 'email.queued', 'email.accepted', 'email.delivered'])
    assert.deepEqual(exported.timeline.filter(e => e.subject_kind === 'brief').map(e => [e.subject_id, e.kind]), [[deliveryId, 'email.queued'], [deliveryId, 'email.accepted'], [deliveryId, 'email.delivered'], ['brief:2026-11-10', 'email.queued'], ['brief:2026-11-10', 'email.accepted']])
    diagnostic('PROBE AGENT-016 1 delivery: off by default and Office refused; explicit Owner opt-in -> one accepted email per Chicago date, signed recipient-bound delivery, unchanged callback replay, restart deduplication, disable stops and zero pushes')
  })

  await scenario(t, 'point 2: overdue balances include only passed due dates and confirmed net money in the current Owner branch', async ({ after, diagnostic }) => {
    const h = await installation({ at: financialAt }); after(() => h.close())
    await h.command('business.save', { name: 'Brief business', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
    const office = await h.person('Brief Office', 'office'), field = await h.person('Brief Field', 'technician'), scoped = await h.person('Brief Branch Owner', 'owner')
    const tech = await h.command('technician.save', { name: field.name, operatorId: field.id })
    const customer = await h.command('customer.save', { name: 'Main brief customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '10 Main Street' })
    const branch = await h.command('branch.save', { name: 'North brief branch', prefix: 'NBF', timezone: 'America/Chicago', zips: [] })
    const branchCustomer = await h.command('customer.save', { name: 'North brief customer', branchId: branch.id })
    const branchSite = await h.command('site.save', { customerId: branchCustomer.id, address: '20 North Street', branchId: branch.id })
    const branchTech = await h.command('technician.save', { name: 'North brief technician', operatorId: null, branchId: branch.id })
    const northField = await h.person('North Brief Field', 'technician')
    await h.command('technician.save', { ...branchTech, operatorId: northField.id })
    await h.command('branch.limit', { operatorId: scoped.id, branchId: branch.id })
    let nextMinute = 8 * 60
    const make = async (name, approvalDate = '2026-10-25', price = '100.00', north = false, draftOnly = false) => {
      await h.setTime(`${approvalDate}T23:00:00.000Z`)
      const atSite = north ? branchSite : site, person = north ? northField : field
      const job = await h.command('job.create', { customerId: atSite.customerId, siteId: atSite.id, title: name, lines: [{ description: name, quantity: '1', unitPrice: price, tax: 'FREE' }] })
      const clock = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
      const visit = await h.command('visit.book', { jobId: job.id, technicianId: north ? branchTech.id : tech.id, date: approvalDate, start: clock(nextMinute), end: clock(nextMinute + 30) })
      nextMinute += 30
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Service complete', signoff: { absentReason: 'Customer away' } })
      const draft = await office.run('invoice.prepare', { jobId: job.id })
      return draftOnly ? draft : office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    }
    const partial = await make('Partly paid'), overpaid = await make('Overpaid'), allocated = await make('Credit recipient'), credited = await make('Fully credited')
    const refunded = await make('Confirmed refund'), pending = await make('Pending refund'), paid = await make('Fully paid')
    const today = await make('Due today', '2026-10-26'), future = await make('Due tomorrow', '2026-10-27')
    const draft = await make('Unapproved draft', '2026-10-25', '100.00', false, true), north = await make('North overdue', '2026-10-25', '75.25', true)
    for (const inv of [partial, overpaid, allocated, credited, refunded, pending, paid, north]) assert.equal(inv.dates.dueOn, '2026-11-08')
    assert.deepEqual([today.dates.dueOn, future.dates.dueOn], ['2026-11-09', '2026-11-10'])
    await h.setTime('2026-11-08T16:00:00.000Z')
    const record = (inv, method, amount) => office.run('payment.record', { invoiceId: inv.id, version: inv.version, method, amount, reference: `synthetic-glove-${method}-${inv.id}` })
    await record(partial, 'cash', '12.34'); await record(partial, 'check', '7.66')
    await record(overpaid, 'check', '130.00'); await record(paid, 'cash', '100.00')
    await office.run('payment.allocate', { invoiceId: allocated.id, version: allocated.version, sourceInvoiceId: overpaid.id, sourceVersion: overpaid.version, amount: '20.00' })
    await h.command('payment.credit', { invoiceId: credited.id, version: credited.version, amount: '100.00', reference: 'Owner goodwill credit' })
    await connectPayments(h)
    const confirm = async (inv, amount) => {
      const checkout = await h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card', amount })
      const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
      Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: `synthetic-glove-brief-charge-${checkout.id}`, created: Date.parse('2026-11-08T16:00:00.000Z') / 1000, status: 'succeeded', balance_transaction: { fee: 0 } } })
      const before = await snapshot(h)
      assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { signature: false, at: Date.parse('2026-11-08T16:00:00.000Z') / 1000 })).status, 401)
      assert.deepEqual(await snapshot(h), before, 'an unauthenticated outcome cannot reduce the brief balance')
      const eventId = `synthetic-glove-brief-event-${checkout.id}`
      for (let n = 0; n < 2; n++) assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { id: eventId, at: Date.parse('2026-11-08T16:00:00.000Z') / 1000 })).status, 200)
      return (await h.state()).payments.find(p => p.id === checkout.id)
    }
    await confirm(partial, '20.00')
    const original = await confirm(refunded, '100.00'), pendingOriginal = await confirm(pending, '100.00')
    const refund = await h.command('payment.refund', { invoiceId: refunded.id, version: refunded.version, paymentId: original.id, paymentVersion: original.version, amount: '25.00', reason: 'Confirmed return' })
    h.stripePayments.refundStatus = 'pending'
    const pendingRefund = await h.command('payment.refund', { invoiceId: pending.id, version: pending.version, paymentId: pendingOriginal.id, paymentVersion: pendingOriginal.version, amount: '15.00', reason: 'Unconfirmed return' })
    assert.deepEqual([refund.status, pendingRefund.status], ['paid', 'pending'])
    const wants = [[partial, '60.00', '0.00'], [overpaid, '0.00', '10.00'], [allocated, '80.00', '0.00'], [credited, '0.00', '0.00'], [refunded, '25.00', '0.00'], [pending, '0.00', '0.00'], [paid, '0.00', '0.00'], [today, '100.00', '0.00'], [future, '100.00', '0.00'], [north, '75.25', '0.00']]
    const overdue = [[partial, customer.name, '60.00'], [allocated, customer.name, '80.00'], [refunded, customer.name, '25.00'], [north, branchCustomer.name, '75.25']].map(([inv, name, balance]) => overdueItem(inv, name, balance, '2026-11-08'))
    const inspect = async () => {
      await h.setTime(financialAt)
      const brief = await pureBrief(h, financialAt), balances = await json(h, '/api/glove/balances'), aging = await json(h, '/api/glove/reports/receivables.json?asOf=2026-11-09'), dash = await json(h, '/api/glove/dashboard')
      assert.deepEqual(ordered(brief.sections.overdue), ordered(overdue), 'only independently enumerated overdue invoices appear, with exact cents, currency, due date, link and proposed action')
      assert.equal(balances.invoices.length, 10)
      assert.ok(!balances.invoices.some(i => i.id === draft.id))
      for (const [inv, due, credit] of wants) {
        const row = balances.invoices.find(i => i.id === inv.id)
        assert.deepEqual([row.due, row.credit, row.currency, row.href], [due, credit, 'USD', `#invoices/${inv.id}`])
      }
      const rows = aging.customers.flatMap(c => c.invoices)
      assert.deepEqual(ordered(rows).map(i => [i.id, i.balance]), ordered(wants.filter(([, due]) => due !== '0.00').map(([inv, due]) => ({ id: inv.id, balance: due }))).map(i => [i.id, i.balance]))
      assert.deepEqual(ordered(rows.filter(i => i.daysPastDue > 0)).map(i => i.id), ordered(overdue).map(i => i.id))
      assert.deepEqual(aging.totals, [{ currency: 'USD', buckets: { current: '200.00', '1-30': '240.25', '31-60': '0.00', '61-90': '0.00', over90: '0.00' }, total: '440.25' }])
      assert.deepEqual(dash.receivables, aging.totals)
      const limited = await pureBrief(h, financialAt, { as: scoped.cookie })
      assert.deepEqual(limited.sections.overdue, [overdueItem(north, branchCustomer.name, '75.25', '2026-11-08')])
      const beforeMidnight = await pureBrief(h, '2026-11-09T05:59:59.999Z')
      assert.deepEqual(beforeMidnight.sections.overdue, [], 'nothing is overdue on its due date, even if the UTC date is tomorrow')
      const afterMidnight = await pureBrief(h, '2026-11-09T06:00:00.000Z')
      assert.deepEqual(ordered(afterMidnight.sections.overdue), ordered(overdue))
      return { brief, balances, aging, dash, limited }
    }
    const readings = await inspect()
    await h.restart()
    assert.deepEqual(await inspect(), readings, 'all financial readers agree after an actual Worker restart')
    await h.command('role.set', { operatorId: scoped.id, role: 'office' })
    const before = await snapshot(h), attempts = h.outbound.attempts
    assert.equal((await h.request(`/api/glove/brief?at=${financialAt}`, { as: scoped.cookie })).status, 403)
    assert.deepEqual(await snapshot(h), before); assert.equal(h.outbound.attempts, attempts)
    const currentCustomer = (await h.state()).customers.find(c => c.id === customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: currentCustomer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: currentCustomer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    const erasedBrief = await pureBrief(h, financialAt)
    assert.deepEqual(ordered(erasedBrief.sections.overdue), ordered(overdue.map(row => ({ ...row, text: row.text.replace(customer.name, 'Erased customer') }))), 'erasure retains exact anonymous financial balances without exposing the customer name')
    assert.ok(!JSON.stringify(erasedBrief).includes(customer.name))
    const erased = await snapshot(h), erasedAttempts = h.outbound.attempts, erasedCalls = h.stripePayments.calls.length
    const priorIntent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    assert.equal((await paymentEvent(h, priorIntent, 'payment_intent.succeeded', { id: `synthetic-glove-brief-event-${pendingOriginal.id}`, at: Date.parse(financialAt) / 1000 })).status, 200)
    assert.deepEqual(await snapshot(h), erased, 'a replayed capture cannot restore an erased identity or change anonymous balances')
    const readbacks = h.stripePayments.calls.slice(erasedCalls)
    assert.ok(readbacks.every(c => c.method === 'GET'), 'capture replay may verify the provider outcome but cannot make a money-changing request')
    assert.equal(h.outbound.attempts - erasedAttempts, readbacks.length, 'capture replay performs only provider readback, with no mail or push')
    await h.restart()
    assert.deepEqual(await pureBrief(h, financialAt), erasedBrief, 'Worker restart cannot resurrect erased brief data')
    diagnostic('PROBE AGENT-016 2: eleven invoices with manual receipts, TEST installment, allocation, credit and confirmed or pending refunds -> four overdue items totaling 240.25 USD; branch Owner sees only 75.25 USD; aging and tile total 440.25 USD')
    diagnostic('PROBE AGENT-016 2 custody: customer erasure -> same anonymous overdue cents; replayed capture and Worker restart preserve erasure with provider readback only and no money-changing request')
  })

  await scenario(t, 'point 3: due included visits retain agreement and Dispatch links, booked labels and exact completion and decline exclusions', async ({ after, diagnostic }) => {
    const h = await installation({ at: financialAt }); after(() => h.close())
    await h.command('business.save', { name: 'Brief business', timezone: 'America/Chicago' })
    const field = await h.person('Agreement Brief Field', 'technician')
    const tech = await h.command('technician.save', { name: field.name, operatorId: field.id })
    const customer = await h.command('customer.save', { name: 'Included visit customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '30 Club Street' })
    const service = await h.command('service.save', { code: 'BRIEF-CLUB', name: 'Included tune-up', unitPrice: '100.00', tax: 'FREE' })
    const plan = await h.command('plan.save', { name: 'Monthly Club', price: '600.00', termMonths: 6, includedVisits: 6, visitServiceId: service.id, formIds: [] })
    const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: '2026-07-09' })
    const book = async (index, date) => {
      const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, agreementId: agreement.id, agreementVisitIndex: index, title: 'Included tune-up' })
      return h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
    }
    const complete = await book(0, '2026-11-08'), booked = await book(2, '2026-11-10')
    await field.run('visit.arrive', { visitId: complete.id, deviceTime: complete.startAt })
    await field.run('visit.complete', { visitId: complete.id, deviceTime: complete.endAt, summary: 'Tune-up complete', signoff: { absentReason: 'Customer away' } })
    await h.command('agreement.decline', { agreementId: agreement.id, version: agreement.version, index: 1, method: 'phone', customerName: customer.name, reason: 'Customer explicitly skipped this visit' })
    const expectedVisits = [['2', '2026-09-09', true], ['3', '2026-10-09', false], ['4', '2026-11-09', false]]
    const want = expectedVisits.map(([index, due, booked]) => ({ ...item('agreementDue', `${agreement.id}:${index}`, `${customer.name}: Monthly Club visit due ${due}${booked ? ' (booked, awaiting completion)' : ''}`, 'Schedule included visit', '#dispatch'), agreementHref: `#customers/${customer.id}` }))
    const inspect = async () => {
      const due = await json(h, '/api/glove/due-visits?through=2026-11-09'), brief = await pureBrief(h, financialAt)
      assert.deepEqual(due.visits.map(v => [v.id, v.due, v.booked]), expectedVisits.map(([index, due, booked]) => [`${agreement.id}:${index}`, due, booked]))
      assert.equal(due.visits[0].visitId, booked.id)
      assert.deepEqual(brief.sections.agreements, want)
      assert.deepEqual(brief.sections.agreements.map(v => v.id), due.visits.map(v => v.id))
      assert.deepEqual((await pureBrief(h, '2026-11-09T05:59:59.999Z')).sections.agreements, want.slice(0, 2))
      assert.deepEqual((await pureBrief(h, '2026-11-09T06:00:00.000Z')).sections.agreements, want)
      return { due, brief }
    }
    const before = await inspect(); await h.restart(); assert.deepEqual(await inspect(), before)
    diagnostic('PROBE AGENT-016 3: six monthly entitlements with one completed, one declined, one booked and one future -> exactly three due rows, matching due-visits and preserving both links and booked label after restart')
  })

  await scenario(t, 'point 4: actual monthly cron drafts age only after approval and the frozen later-of-period-or-local-approval due date', async ({ after, diagnostic }) => {
    const h = await installation({ at: financialAt }); after(() => h.close())
    const b = await fixedMonthlyReports(h)
    const frozen = ordered(b.approved.map(x => ({ id: x.invoice.id, dates: x.invoice.dates })))
    const inspect = async () => {
      const readings = []
      // Includes generation, late approval, the period-based wrong due date,
      // the exact true due date and the following local midnight for each month.
      for (const date of ['2025-01-30', '2025-01-31', '2025-02-02', '2025-02-03', '2025-02-14', '2025-02-15', '2025-02-16', '2025-02-17', '2025-02-18', '2025-03-14', '2025-03-15', '2025-03-16', '2025-03-17', '2025-03-18', '2025-04-14', '2025-04-15', '2025-04-16', '2025-04-17', '2025-04-18']) {
        const at = `${date}T12:00:00.000Z`, brief = await pureBrief(h, at)
        const expected = b.approved.filter(x => x.approvedOn <= date && x.dueOn < date)
        assert.deepEqual(ordered(brief.sections.overdue), ordered(expected.map(x => overdueItem(x.invoice, x.kind === 'pacific' ? b.branchCustomer.name : b.customer.name, x.gross, x.dueOn))))
        const aging = await json(h, `/api/glove/reports/receivables.json?asOf=${date}`)
        assert.deepEqual(ordered(aging.customers.flatMap(c => c.invoices).filter(i => i.daysPastDue > 0)).map(i => i.id), ordered(brief.sections.overdue).map(i => i.id))
        readings.push(brief)
      }
      for (const x of b.approved.filter(x => x.kind === 'late' || x.kind === 'pacific')) {
        const midnight = x.kind === 'pacific' ? '08:00:00.000Z' : '06:00:00.000Z'
        assert.equal(x.invoice.dates.issuedOn, x.period.end)
        assert.equal(x.invoice.dates.approvedOn, x.approvedOn)
        assert.equal(x.invoice.revisions[0].approval.at, x.approvedAt)
        assert.equal(x.invoice.dates.dueOn, x.dueOn)
        assert.equal(x.invoice.dates.termsDays, 14)
        assert.equal(x.invoice.dates.approvedAfterPeriodEnd, true)
        // The brief's date is business-local; approval's frozen basis is branch-local.
        assert.ok(!(await pureBrief(h, `${x.dueOn}T${midnight}`)).sections.overdue.some(i => i.id === x.invoice.id))
      }
      const drafts = (await h.state()).invoices.filter(i => i.jobId === b.unapproved.id)
      assert.equal(drafts.length, 3)
      assert.ok(drafts.every(i => i.status === 'draft' && !i.dates && !i.revisions[0].approval))
      const far = await pureBrief(h, '2025-07-17T12:00:00.000Z')
      assert.ok(drafts.every(i => !far.sections.overdue.some(row => row.id === i.id)), 'even months-old unapproved drafts never age')
      assert.deepEqual(far.sections.unbilled.filter(i => drafts.some(d => d.id === i.id)).map(i => i.id).sort(), drafts.map(i => i.id).sort())
      assert.deepEqual(ordered((await h.state()).invoices.filter(i => frozen.some(x => x.id === i.id)).map(i => ({ id: i.id, dates: i.dates }))), frozen)
      return readings
    }
    const before = await inspect()
    await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 })
    await h.restart()
    assert.deepEqual(await inspect(), before, 'terms changes and actual Worker restart cannot replace frozen due dates')
    diagnostic('PROBE AGENT-016 4: three actual month-end cron passes, late Chicago and Pacific approvals, due-date boundaries and terms change -> only approved invoices past their frozen due dates appear; three drafts never overdue after restart')
  })

  await scenario(t, 'point 4: a pre-PLAN-013 Worker approval retains its approval-date basis after rebuild and restart', async ({ after, diagnostic }) => {
    let legacy = true
    const h = await installation({ at: financialAt, workerPlugins: [{ name: 'pre-plan-013-approval', setup(build) {
      build.onLoad({ filter: /\/glove\/commands\/invoices\.ts$/ }, async args => {
        if (!legacy) return
        const source = await readFile(args.path, 'utf8')
        const contents = source.replace("const monthly = inv.recurring?.mode === 'fixed-monthly'", 'const monthly = false')
        if (contents === source) throw new Error('Cannot construct the approval-date era Worker')
        return { contents, loader: 'ts', resolveDir: dirname(args.path) }
      })
    } }] }); after(() => h.close())
    await h.command('business.save', { name: 'Legacy brief business', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
    const customer = await h.command('customer.save', { name: 'Legacy monthly customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '40 Legacy Street' })
    const tech = await h.command('technician.save', { name: 'Legacy technician' })
    await h.setTime('2025-01-01T16:00:00.000Z')
    const lines = [{ description: 'Monthly service', quantity: '1', unitPrice: '100.00', tax: 'FREE' }]
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: 'Legacy monthly service', lines })
    await h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-15', rule: { unit: 'month', interval: 3 }, technicianId: tech.id, start: '09:00', end: '10:00', horizonDays: 365, until: '2025-01-31', billing: { mode: 'fixed-monthly', lines } })
    await h.setTime('2025-01-31T08:00:00.000Z'); await h.scheduled('2025-01-31T08:00:00.000Z')
    const draft = (await h.state()).invoices.find(i => i.jobId === job.id)
    assert.equal(draft.recurring.periodEnd, '2025-01-31')
    await h.setTime('2025-02-03T06:30:00.000Z')
    const invoice = await h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    assert.deepEqual(invoice.dates, { issuedOn: '2025-02-03', dueOn: '2025-02-17', termsDays: 14, basis: 'terms frozen at first approval' })
    const inspect = async () => {
      const results = []
      for (const [at, overdue] of [['2025-02-03T12:00:00.000Z', false], ['2025-02-15T12:00:00.000Z', false], ['2025-02-18T05:59:59.999Z', false], ['2025-02-18T06:00:00.000Z', true]]) {
        const brief = await pureBrief(h, at)
        assert.deepEqual(brief.sections.overdue, overdue ? [overdueItem(invoice, customer.name, '100.00', '2025-02-17')] : [])
        results.push(brief)
      }
      assert.deepEqual((await h.state()).invoices.find(i => i.id === invoice.id).dates, invoice.dates)
      return results
    }
    const before = await inspect()
    legacy = false; await h.restart({ rebuild: true })
    assert.deepEqual(await inspect(), before, 'upgrading the actual Worker preserves preexisting approval-date basis')
    await h.restart(); assert.deepEqual(await inspect(), before)
    diagnostic('PROBE AGENT-016 4 legacy: actual era Worker approved January period on February 3 -> issue February 3 and due February 17 retained after current-build upgrade, overdue only at February 18 local midnight')
  })
})
