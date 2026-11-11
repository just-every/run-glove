import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'
import { installmentJourney, read as readJson } from './installment-ledger.mjs'

const at = '2026-11-09T12:00:00.000Z'
const read = async (h, path) => {
  const response = await h.request(path)
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}
const posts = h => h.stripePayments.calls.filter(c => c.path === '/v1/refunds' && c.method === 'POST')
const money = async h => ({ payments: (await h.state()).payments, balances: await read(h, '/api/glove/balances') })
const due = async (h, invoice) => (await read(h, '/api/glove/balances')).invoices.find(i => i.id === invoice.id).due
const input = (invoice, payment, amount, tip = '0.00') => ({ invoiceId: invoice.id, version: invoice.version, paymentId: payment.id, paymentVersion: payment.version, amount, tip, reason: 'Customer requested original-method return' })
async function fixture(t, options = {}) {
  const h = await installation({ at, ...options }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC', taxSettings: { jurisdictions: [{ id: 'synthetic-glove-tax', name: 'Sales tax', rate: '10', zips: [], taxLabor: true }], defaultJurisdictionId: 'synthetic-glove-tax' } })
  await connectPayments(h)
  return { h, b }
}
async function source(h, b, method = 'card', date = '2026-10-20', tip = '15.00') {
  const invoice = await paidInvoice(h, b, date)
  const checkout = await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method, tip })
  const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
  Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: `synthetic-glove-charge-${checkout.id}`, created: Date.parse(at) / 1000, status: 'succeeded', balance_transaction: { fee: 100 } } })
  assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: Date.parse(at) / 1000 })).status, 200)
  const payment = (await h.state()).payments.find(p => p.id === checkout.id)
  assert.deepEqual([payment.status, payment.amount, payment.tip, payment.method], ['paid', '207.90', tip, method])
  return { invoice, payment, pi }
}
async function unchanged(h, action) {
  const before = await money(h), calls = h.stripePayments.calls.length
  await action()
  assert.deepEqual(await money(h), before, 'refused command changes no payment or balance')
  assert.equal(h.stripePayments.calls.length, calls, 'refused command makes no provider request')
}
async function trail(h, kinds) {
  const result = await assertTrail(h, kinds)
  const requested = result.activity.filter(e => e.kind === 'refund.requested')
  assert.ok(requested.length)
  for (const event of requested) assert.deepEqual([event.actorName, event.actorRole, event.at], ['Olivia Owner', 'owner', at])
  const refunds = (await h.state()).payments.filter(p => p.kind === 'refund')
  for (const refund of refunds) {
    const exported = result.exported.payments.find(p => p.id === refund.id)
    assert.ok(exported, 'each refund is separately readable in the business export')
    assert.deepEqual([exported.paymentId, exported.method, exported.amount, exported.tip, exported.status], [refund.paymentId, refund.method, refund.amount, refund.tip, refund.status])
  }
  const text = JSON.stringify(result)
  for (const secret of ['synthetic-glove-1', 'synthetic-glove-2']) assert.ok(!text.includes('"' + secret + '"'))
  assert.doesNotMatch(text, /checkout\.stripe\.com|stripe-signature|Bearer synthetic/)
  return result
}

test('PAY-023 original-method refund authority, accounting and recovery', { timeout: 120_000 }, async t => {
await scenario(t, 'PAY-023 point 1: only the current signed-in Owner refunds and original methods enforce the exact remaining principal', async t => {
  const { h, b } = await fixture(t)
  const card = await source(h, b)
  const custom = await h.person('Refund custom', 'viewer')
  const role = await h.command('role.save', { name: 'Refund delegate', permissions: ['payment.refund', 'payment.refundRefresh'] })
  await h.command('role.set', { operatorId: custom.id, role: 'custom:' + role.id })
  const scoped = await h.person('Other branch Owner', 'owner')
  const branch = await h.command('branch.save', { name: 'Other branch', prefix: 'OTH', timezone: 'UTC', zips: [] })
  await h.command('branch.limit', { operatorId: scoped.id, branchId: branch.id })
  const former = await h.person('Former refund Owner', 'owner')
  await h.command('role.set', { operatorId: former.id, role: 'office' })
  const token = await h.command('token.issue', { name: 'Refund inspection', role: 'office' })
  const payload = input(card.invoice, card.payment, '1.00')
  for (const person of [b.office, b.dispatcher, b.priyaPerson, custom, former]) await unchanged(h, () => person.run('payment.refund', payload, { error: 'FORBIDDEN' }))
  await unchanged(h, () => scoped.run('payment.refund', payload, { error: 'NOT_FOUND' }))
  for (const options of [{ as: '' }, { headers: { authorization: 'Bearer ' + token.token } }]) await unchanged(h, async () => {
    const response = await h.request('/api/glove/commands', { ...options, method: 'POST', body: { commandId: randomUUID(), type: 'payment.refund', payload } })
    assert.equal(response.status, options.as === '' ? 401 : 403)
  })
  await h.command('token.revoke', { tokenId: token.id })
  await unchanged(h, async () => assert.equal((await h.request('/api/glove/commands', { method: 'POST', headers: { authorization: 'Bearer ' + token.token }, body: { commandId: randomUUID(), type: 'payment.refund', payload } })).status, 401))
  const first = await h.command('payment.refund', input(card.invoice, card.payment, '50.00'))
  h.stripePayments.refundStatus = 'pending'
  const pending = await h.command('payment.refund', input(card.invoice, card.payment, '20.00'))
  await unchanged(h, () => h.command('payment.refund', input(card.invoice, card.payment, '137.91'), { error: 'AMOUNT' }))
  h.stripePayments.refundStatus = 'succeeded'
  const final = await h.command('payment.refund', { ...input(card.invoice, card.payment, '137.90'), method: 'cash' })
  assert.deepEqual([first.amount, pending.amount, final.amount, final.method], ['50.00', '20.00', '137.90', 'card'])
  assert.equal(await due(h, card.invoice), '187.90', 'pending money never reopens the invoice')
  const ach = await source(h, b, 'ach', '2026-10-21', '0.00')
  const returned = await h.command('payment.refund', { ...input(ach.invoice, ach.payment, '207.90'), method: 'check' })
  assert.deepEqual([returned.method, returned.status, await due(h, ach.invoice)], ['ach', 'paid', '207.90'])
  assert.equal(h.stripePayments.refunds.get(returned.providerReference).payment_intent, ach.pi.id)
  await trail(h, ['refund.requested', 'refund.paid', 'refund.pending'])
})

await scenario(t, 'PAY-023 point 2: tip-only returns lower technician payroll while principal, collected tax and receivables stay exact', async t => {
  const { h, b } = await fixture(t), { invoice, payment } = await source(h, b)
  await b.priyaPerson.run('clock.in', { deviceTime: '2026-11-09T09:00:00Z' })
  await b.priyaPerson.run('clock.out', { deviceTime: '2026-11-09T10:00:00Z' })
  await h.command('timesheet.approve', { technicianId: b.priya.id, weekStart: '2026-11-09' })
  const payroll = () => read(h, '/api/glove/reports/payroll.json?from=2026-11-09&to=2026-11-15')
  assert.equal((await payroll()).people.find(p => p.technicianId === b.priya.id).tips, '15.00')
  await paidInvoice(h, b, '2026-10-21')
  const before = { balances: await read(h, '/api/glove/balances'), tax: await read(h, '/api/glove/reports/tax.json?from=2026-11-09&to=2026-11-15'), tile: (await read(h, '/api/glove/dashboard')).receivables }
  assert.equal(before.tile[0].total, '207.90', 'the unchanged receivables tile includes a real unpaid invoice')
  await unchanged(h, () => h.command('payment.refund', input(invoice, payment, '207.91'), { error: 'AMOUNT' }))
  await unchanged(h, () => h.command('payment.refund', input(invoice, payment, '0.00', '15.01'), { error: 'AMOUNT' }))
  const tip = await h.command('payment.refund', input(invoice, payment, '0.00', '10.00'))
  assert.deepEqual([tip.amount, tip.tip, tip.status], ['0.00', '10.00', 'paid'])
  await unchanged(h, () => h.command('payment.refund', input(invoice, payment, '0.00', '5.01'), { error: 'AMOUNT' }))
  assert.equal((await payroll()).people.find(p => p.technicianId === b.priya.id).tips, '5.00')
  assert.equal(await due(h, invoice), '0.00')
  assert.deepEqual(await read(h, '/api/glove/balances'), before.balances)
  assert.deepEqual(await read(h, '/api/glove/reports/tax.json?from=2026-11-09&to=2026-11-15'), before.tax)
  assert.deepEqual((await read(h, '/api/glove/dashboard')).receivables, before.tile)
  const remaining = await h.command('payment.refund', input(invoice, payment, '0.00', '5.00'))
  assert.equal(remaining.tip, '5.00')
  assert.equal((await payroll()).people.find(p => p.technicianId === b.priya.id).tips, '0.00')
  await trail(h, ['refund.requested', 'refund.paid'])
})

await scenario(t, 'PAY-023 point 3: a later Stripe dispute reverses only the principal and tip left after a partial refund', async t => {
  const { h, b } = await fixture(t), { invoice, payment, pi } = await source(h, b)
  await h.command('payment.refund', input(invoice, payment, '50.00', '5.00'))
  assert.equal(await due(h, invoice), '50.00')
  assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '10.00')
  pi.latest_charge.disputed = true
  const id = randomUUID()
  for (let i = 0; i < 2; i++) assert.equal((await paymentEvent(h, { metadata: pi.metadata, payment_intent: pi.id }, 'charge.dispute.created', { id, at: Date.parse(at) / 1000 })).status, 200)
  assert.equal(await due(h, invoice), '207.90')
  assert.equal((await read(h, '/api/glove/dashboard')).paidToday.tips, '0.00')
  const returned = (await h.state()).payments.find(p => p.id === payment.id)
  assert.equal(returned.status, 'returned')
  assert.deepEqual(returned.effects.filter(e => e.amountCents < 0).map(e => [e.amountCents, e.tipCents]), [[-15790, -1000]])
  const before = await money(h)
  await h.restart()
  assert.deepEqual(await money(h), before)
  await trail(h, ['refund.paid', 'payment.returned'])
})

await scenario(t, 'PAY-023 point 4: manual returns stay offline and durable Stripe reservations fence concurrent requests, replay and Worker restart', async t => {
  const { h, b } = await fixture(t), { invoice, payment } = await source(h, b)
  for (const method of ['cash', 'check']) {
    const original = await b.office.run('payment.record', { invoiceId: invoice.id, version: invoice.version, amount: '10.00', method, reference: 'synthetic-glove-manual-' + method })
    const calls = h.stripePayments.calls.length
    const returned = await h.command('payment.refund', input(invoice, original, '10.00'))
    assert.deepEqual([returned.method, returned.status, returned.paymentId], [method, 'paid', original.id])
    assert.equal(h.stripePayments.calls.length, calls)
  }
  let release, entered
  const paused = new Promise(resolve => { release = resolve }), reached = new Promise(resolve => { entered = resolve })
  t.after(() => release())
  const edge = h.stripePayments.answer.bind(h.stripePayments)
  h.stripePayments.answer = async request => {
    const response = await edge(request)
    if (new URL(request.url).pathname === '/v1/refunds' && request.method === 'POST') { entered(); await paused }
    return response
  }
  const payload = input(invoice, payment, '207.90'), commandId = randomUUID()
  const running = h.command('payment.refund', payload, { commandId })
  await reached
  const reserved = (await h.state()).payments.find(p => p.kind === 'refund' && p.paymentId === payment.id)
  assert.equal(reserved.status, 'reserved')
  assert.deepEqual(reserved.effects, [])
  assert.equal(posts(h).length, 1)
  assert.equal(posts(h)[0].idempotencyKey, 'glove-refund-' + reserved.id)
  await unchanged(h, () => h.command('payment.refund', payload, { error: 'AMOUNT' }))
  await h.command('payment.refund', payload, { commandId })
  assert.equal(posts(h).length, 1)
  release()
  assert.equal((await running).status, 'paid')
  const before = await money(h)
  await h.restart()
  await h.command('payment.refund', payload, { commandId })
  await h.scheduled(at)
  assert.deepEqual(await money(h), before)
  assert.equal(posts(h).length, 1)
  await trail(h, ['refund.requested', 'refund.paid'])
})

// Translate a network-edge sentinel into the fetch rejection an unreachable
// Stripe endpoint gives the Worker. Domain commands and persistence are real.
const unreachableStripe = { name: 'refund-network-edge', setup(build) {
  build.initialOptions.banner.js += `const refundNetworkFetch = globalThis.fetch; globalThis.fetch = async (...args) => { const response = await refundNetworkFetch(...args); if (response.headers.get('x-synthetic-glove-refund-unreachable') === '1') throw new TypeError('Synthetic Stripe unreachable'); return response; };\n`
} }

await scenario(t, 'PAY-023 point 5: pending, failed and unconfirmed linked records never alter balances or resend after replay, cron and restart', async t => {
  const { h, b } = await fixture(t, { workerPlugins: [unreachableStripe] }), { invoice, payment } = await source(h, b)
  const attempts = []
  for (const outcome of ['pending', 'failed', 'http503', 'unreachable']) {
    h.stripePayments.status = outcome === 'http503' ? 503 : 200
    h.stripePayments.refundStatus = outcome === 'failed' ? 'failed' : 'pending'
    if (outcome === 'unreachable') {
      const edge = h.stripePayments.answer.bind(h.stripePayments)
      h.stripePayments.answer = async request => {
        const response = await edge(request)
        return new URL(request.url).pathname === '/v1/refunds' ? new Response(null, { headers: { 'x-synthetic-glove-refund-unreachable': '1' } }) : response
      }
    }
    const payload = input(invoice, payment, '20.00'), commandId = randomUUID()
    const row = await h.command('payment.refund', payload, { commandId })
    assert.deepEqual([row.status, row.paymentId, row.method, row.effects], [outcome === 'pending' ? 'pending' : outcome === 'failed' ? 'failed' : 'reserved', payment.id, 'card', []])
    assert.equal(await due(h, invoice), '0.00')
    attempts.push({ row, payload, commandId })
  }
  assert.equal(new Set(attempts.map(a => a.row.id)).size, 4)
  assert.equal(posts(h).length, 4)
  const before = await money(h)
  for (const restart of [false, true]) {
    if (restart) await h.restart()
    for (const a of attempts) await h.command('payment.refund', a.payload, { commandId: a.commandId })
    await h.scheduled(at)
    assert.deepEqual(await money(h), before)
    assert.equal(posts(h).length, 4)
  }
  await trail(h, ['refund.pending', 'refund.failed', 'refund.unconfirmed'])
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  for (const row of (await h.state()).payments) {
    assert.ok(row.erasedAt)
    for (const key of ['intentId', 'providerReference', 'reason', 'by', 'paymentId']) assert.equal(row[key], undefined, 'erased refund evidence stays unavailable')
  }
  const erased = await h.state(), calls = h.stripePayments.calls.length
  await h.restart()
  for (const a of attempts) await h.command('payment.refund', a.payload, { commandId: a.commandId, error: 'ERASED' })
  await h.scheduled(at)
  assert.deepEqual(await h.state(), erased, 'replay and cron cannot restore erased refund data')
  assert.equal(h.stripePayments.calls.length, calls)
  const exported = await read(h, '/api/glove/export')
  assert.ok(!JSON.stringify(exported).includes('Customer requested original-method return'))
})

await scenario(t, 'PAY-023 point 6: refresh only reads a pending retained reference, confirms once and releases failed reservations', async t => {
  const { h, b } = await fixture(t), { invoice, payment } = await source(h, b, 'ach')
  h.stripePayments.refundStatus = 'pending'
  let pending = await h.command('payment.refund', input(invoice, payment, '50.00'))
  const payload = { refundId: pending.id, version: pending.version }
  await unchanged(h, () => b.office.run('payment.refundRefresh', payload, { error: 'FORBIDDEN' }))
  const count = posts(h).length, start = h.stripePayments.calls.length
  pending = await h.command('payment.refundRefresh', payload)
  assert.equal(pending.status, 'pending')
  assert.deepEqual(h.stripePayments.calls.slice(start).map(c => [c.method, c.path]), [['GET', '/v1/refunds/' + pending.providerReference]])
  assert.equal(await due(h, invoice), '0.00')
  h.stripePayments.refunds.get(pending.providerReference).status = 'succeeded'
  const commandId = randomUUID(), confirm = { refundId: pending.id, version: pending.version }
  pending = await h.command('payment.refundRefresh', confirm, { commandId })
  assert.equal(pending.status, 'paid')
  assert.equal(await due(h, invoice), '50.00')
  await h.restart()
  await h.command('payment.refundRefresh', confirm, { commandId })
  assert.equal(await due(h, invoice), '50.00')
  await unchanged(h, () => h.command('payment.refundRefresh', { refundId: pending.id, version: pending.version }, { error: 'REFUND_STATE' }))
  let failed = await h.command('payment.refund', input(invoice, payment, '157.90'))
  h.stripePayments.refunds.get(failed.providerReference).status = 'failed'
  failed = await h.command('payment.refundRefresh', { refundId: failed.id, version: failed.version })
  assert.equal(failed.status, 'failed')
  assert.equal(await due(h, invoice), '50.00')
  h.stripePayments.refunds.get(failed.providerReference).status = 'succeeded'
  await unchanged(h, () => h.command('payment.refundRefresh', { refundId: failed.id, version: failed.version }, { error: 'REFUND_STATE' }))
  assert.equal(posts(h).length, count + 1, 'refresh never creates another refund')
  h.stripePayments.status = 503
  const unknown = await h.command('payment.refund', input(invoice, payment, '10.00'))
  await unchanged(h, () => h.command('payment.refundRefresh', { refundId: unknown.id, version: unknown.version }, { error: 'REFUND_STATE' }))
  h.stripePayments.status = 200; h.stripePayments.refundStatus = 'succeeded'
  await unchanged(h, () => h.command('payment.refund', input(invoice, payment, '147.91'), { error: 'AMOUNT' }))
  const exact = await h.command('payment.refund', input(invoice, payment, '147.90'))
  assert.equal(exact.status, 'paid', 'failed reservation releases its principal; unresolved reservation retains its principal')
  assert.equal(await due(h, invoice), '197.90')
  await trail(h, ['refund.refreshRequested', 'refund.paid', 'refund.failed', 'refund.unconfirmed'])
})


await scenario(t, 'PAY-004 point 1: three installments and a $50.00 original-card refund keep invoice, customer balance, aging and the receivables tile on one cent ledger through replay and Worker restart', async t => {
  const { h, b } = await fixture(t)
  const journey = await installmentJourney(h, b, { at })
  const snapshot = async () => ({ payments: (await h.state()).payments, balances: await readJson(h, '/api/glove/balances'), aging: await readJson(h, '/api/glove/reports/receivables.json?asOf=2026-12-20'), dashboard: (await readJson(h, '/api/glove/dashboard')).receivables })
  const before = await snapshot(), calls = h.stripePayments.calls.length
  await journey.replay()
  await journey.verify()
  assert.deepEqual(await snapshot(), before, 'replayed commands change nothing')
  assert.equal(h.stripePayments.calls.length, calls, 'replayed commands send no further Stripe request')
  await h.restart()
  await journey.replay()
  await h.scheduled(at)
  await journey.verify()
  assert.deepEqual(await snapshot(), before, 'an actual Worker restart changes nothing')
  assert.equal(h.stripePayments.calls.length, calls, 'restart and cron send no further Stripe request')
  assert.equal(posts(h).length, 1, 'one refund request in the whole journey')
})

await scenario(t, 'PAY-004 point 2: every payment, refund and provider outcome of the journey is in Activity and the business export with its actor or provider and reference, without secrets', async t => {
  const { h, b } = await fixture(t)
  const { card1, card2, check3, refund, reference } = await installmentJourney(h, b, { at })
  const { activity, exported } = await assertTrail(h, ['payment.requested', 'payment.checkoutAccepted', 'payment.paid', 'payment.recorded', 'refund.requested', 'refund.pending', 'refund.paid'])
  const journeyEvents = activity.filter(e => /^(payment|refund)\./.test(e.kind) && e.subjectKind === 'payment')
  const owner = ['Olivia Owner', 'owner'], stripe = ['Stripe', 'provider'], office = ['Olu Office', 'office']
  const expected = [
    [card1, 'payment.requested', owner], [card1, 'payment.checkoutAccepted', stripe], [card1, 'payment.paid', stripe],
    [card2, 'payment.requested', owner], [card2, 'payment.checkoutAccepted', stripe], [card2, 'payment.paid', stripe],
    [check3, 'payment.recorded', office],
    [refund, 'refund.requested', owner], [refund, 'refund.pending', stripe], [refund, 'refund.refreshRequested', owner], [refund, 'refund.paid', stripe],
  ]
  assert.equal(journeyEvents.length, expected.length, 'no payment or refund event is missing or duplicated')
  for (const [row, kind, [actorName, actorRole]] of expected) {
    const events = journeyEvents.filter(e => e.subjectId === row.id && e.kind === kind)
    assert.equal(events.length, 1, `${kind} for ${row.id}`)
    const [event] = events, kept = exported.timeline.find(e => e.id === event.id), data = JSON.parse(kept.data)
    assert.deepEqual([event.actorName, event.actorRole, kept.actor_name, kept.actor_role, kept.subject_id], [actorName, actorRole, actorName, actorRole, row.id])
    const stored = exported.payments.find(p => p.id === row.id)
    if (actorRole === 'provider' && kind !== 'payment.checkoutAccepted') assert.deepEqual([data.provider, data.providerReference], ['Stripe', stored.providerReference], `${kind} carries the provider reference`)
    if (kind === 'refund.requested') assert.deepEqual([data.originalPaymentId, data.method, data.amount], [card1.id, 'card', '50.00'])
    if (kind.startsWith('refund.') && kind !== 'refund.requested' && kind !== 'refund.refreshRequested') assert.equal(data.paymentId, card1.id)
  }
  // The staff check keeps its reference on the exported payment record; no provider claim is made for it.
  const exportedCheck = exported.payments.find(p => p.id === check3.id)
  assert.deepEqual([exportedCheck.reference, exportedCheck.method, exportedCheck.providerReference ?? null], [reference, 'check', null])
  assert.equal(journeyEvents.filter(e => e.subjectId === check3.id).every(e => e.actorRole === 'office'), true)
  for (const [row, stripeReference] of [[card1, card1.providerReference], [card2, card2.providerReference], [refund, refund.providerReference]]) {
    assert.equal(exported.payments.find(p => p.id === row.id).providerReference, stripeReference)
    const text = JSON.stringify(await readJson(h, `/api/glove/payments/${row.id}/timeline`))
    assert.match(text, new RegExp(stripeReference))
    assert.doesNotMatch(text, /synthetic-glove-[12](?![A-Za-z0-9-])|synthetic-glove-session|checkout\.stripe\.com|stripe-signature|Bearer/)
  }
  const everything = JSON.stringify({ activity, exported })
  assert.doesNotMatch(everything, /synthetic-glove-[12](?![A-Za-z0-9-])|synthetic-glove-session|checkout\.stripe\.com|stripe-signature|Bearer|whsec_|sk_test|rk_test/)
  for (const session of h.stripePayments.sessions) assert.ok(!everything.includes(session.id) && !everything.includes(session.url))
})

})
