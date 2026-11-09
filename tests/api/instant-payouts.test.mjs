import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'

const at = '2026-11-09T12:00:00.000Z', seconds = Date.parse(at) / 1000
const dollars = cents => (cents / 100).toFixed(2)
const posts = h => h.stripePayments.calls.filter(c => c.path === '/v1/payouts' && c.method === 'POST')
const confirm = row => ({ payoutId: row.id, version: row.version, confirmAmount: row.amount, confirmFee: row.expectedFee })
const unreachableStripe = { name: 'instant-payout-network-edge', setup(build) {
  build.initialOptions.banner.js += `const payoutNetworkFetch = globalThis.fetch; globalThis.fetch = async (...args) => { const response = await payoutNetworkFetch(...args); if (response.headers.get('x-synthetic-glove-payout-unreachable') === '1') throw new TypeError('Synthetic Stripe unreachable'); return response; };\n`
} }
async function fixture(t, options = {}) {
  const h = await installation({ at, ...options }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC' }); await connectPayments(h)
  let n = 0
  const schedule = async (basisPoints = 150, minimum = '0.50') => h.command('payout.feeSchedule', { version: (await h.state()).business[0].version, basisPoints, minimum, source: 'Owner account-specific test pricing' })
  const update = async (source, changes) => {
    Object.assign(source.pi, changes)
    assert.equal((await paymentEvent(h, source.pi, source.pi.status === 'succeeded' ? 'payment_intent.succeeded' : 'payment_intent.processing', { at: seconds })).status, 200)
    source.payment = (await h.state()).payments.find(p => p.id === source.payment.id)
  }
  const source = async ({ net = 10150, fee = 0, paid = true } = {}) => {
    const date = new Date(Date.UTC(2026, 8, 1 + n++)).toISOString().slice(0, 10)
    const invoice = await paidInvoice(h, b, date)
    const checkout = await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'card', amount: dollars(net + (fee ?? 0)) })
    const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    const result = { invoice, pi, payment: checkout }
    await update(result, { status: paid ? 'succeeded' : 'processing', amount_received: paid ? pi.amount : 0, latest_charge: { id: `synthetic-glove-instant-source-${n}`, created: seconds, status: paid ? 'succeeded' : 'pending', balance_transaction: { fee } } })
    return result
  }
  const preview = async (source, amount = '100.00') => h.command('payout.instantPreview', { amount, destination: 'synthetic-glove-debit-1', paymentIds: [source.payment.id] })
  const refuse = async (type, payload, code, as) => {
    const before = await h.state(), sent = posts(h).length
    const error = await h.command(type, payload, { error: code, ...(as ? { as } : {}) })
    assert.deepEqual(await h.state(), before, `${type} refusal stores nothing`)
    assert.equal(posts(h).length, sent, `${type} refusal sends no payout`)
    return error
  }
  const manual = (id, amount = 10000, fee = 150) => {
    h.stripePayments.payouts.set(id, { id, amount, currency: 'usd', method: 'standard', automatic: false, status: 'paid', livemode: false, balance_transaction: { id: id + '-debit', type: 'payout', currency: 'usd', amount: -amount, fee, net: -amount - fee } })
    return id
  }
  return { h, b, source, update, schedule, preview, refuse, manual }
}
async function trail(h, kinds) {
  const result = await assertTrail(h, kinds)
  const owner = (await h.state()).actor
  for (const kind of kinds) {
    const events = result.activity.filter(e => e.kind === kind)
    assert.ok(events.length, kind)
    for (const e of events) {
      assert.ok(e.commandId && e.at && e.summary)
      if (!['payout.instantProviderOutcome', 'payout.instantUnconfirmed'].includes(kind)) assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [owner.id, owner.name, 'owner', at])
      const saved = result.exported.timeline.find(row => row.id === e.id)
      assert.ok(saved)
      assert.deepEqual([saved.at, saved.command_id, saved.summary], [e.at, e.commandId, e.summary])
    }
  }
  const text = JSON.stringify(result)
  for (const secret of ['synthetic-glove-1', 'synthetic-glove-2']) assert.ok(!text.includes('"' + secret + '"'))
  assert.doesNotMatch(text, /checkout\.stripe\.com|stripe-signature|Bearer synthetic/)
  return result
}

test('PAY-026 Owner Instant Payout qualification, reservation and reconciliation', { timeout: 180_000 }, async t => {
await scenario(t, 'PAY-026 point 1: Owner pricing, independent cent boundaries and unsafe previews', async t => {
  const f = await fixture(t), { h, b } = f
  const custom = await h.person('Payout custom', 'viewer')
  const role = await h.command('role.save', { name: 'Instant delegate', permissions: ['payout.feeSchedule', 'payout.instantPreview', 'payout.instantConfirm'] })
  await h.command('role.set', { operatorId: custom.id, role: 'custom:' + role.id })
  const scoped = await h.person('Scoped payout Owner', 'owner')
  await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
  const token = await h.command('token.issue', { name: 'Instant integration', role: 'office' })
  await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${token.token}` } })
  const payload = { version: (await h.state()).business[0].version, basisPoints: 150, minimum: '0.50', source: 'Owner account schedule' }
  for (const person of [b.office, b.dispatcher, custom, scoped]) await f.refuse('payout.feeSchedule', payload, 'FORBIDDEN', person.cookie)
  for (const auth of [{ authorization: `Bearer ${token.token}` }, {}]) {
    const before = await h.state()
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: auth, body: { commandId: randomUUID(), type: 'payout.feeSchedule', payload } })
    assert.equal(response.status, auth.authorization ? 403 : 401)
    assert.deepEqual(await h.state(), before)
  }
  for (const basisPoints of [-1, 10001, 1.5]) await f.refuse('payout.feeSchedule', { ...payload, basisPoints }, 'INPUT')
  for (const minimum of ['-0.01', '1.001', 'NaN', 1, '']) await f.refuse('payout.feeSchedule', { ...payload, minimum }, 'MONEY')
  // Expected fees are independently enumerated cents: just below, at and above half a cent and the minimum crossover.
  for (const [amount, bps, minimum, expected] of [[99, 50, '0.00', 0], [100, 50, '0.00', 1], [101, 50, '0.00', 1], [9999, 100, '1.00', 100], [10000, 100, '1.00', 100], [10050, 100, '1.00', 101], [100, 0, '0.00', 0], [100, 10000, '0.00', 100]]) {
    await f.schedule(bps, minimum)
    const s = await f.source({ net: amount + expected }), p = await f.preview(s, dollars(amount))
    assert.deepEqual([p.amount, p.expectedFee, p.sourceNet, p.status], [dollars(amount), dollars(expected), dollars(amount + expected), 'preview'])
    assert.match(p.feeSource, /Owner-recorded.*not verified by Glove/)
    assert.equal(posts(h).length, 0)
  }
  await f.schedule()
  const s = await f.source(), pending = await f.source({ paid: false }), unknownFee = await f.source({ fee: null })
  const input = { amount: '100.00', destination: 'synthetic-glove-debit-1', paymentIds: [s.payment.id] }
  const ownerPreview = await f.preview(s)
  for (const person of [b.office, b.dispatcher, custom, scoped]) {
    await f.refuse('payout.instantPreview', input, 'FORBIDDEN', person.cookie)
    await f.refuse('payout.instantConfirm', confirm(ownerPreview), 'FORBIDDEN', person.cookie)
  }
  for (const [type, body] of [['payout.instantPreview', input], ['payout.instantConfirm', confirm(ownerPreview)]]) {
    const before = await h.state()
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type, payload: body } })
    assert.equal(response.status, 403)
    assert.deepEqual(await h.state(), before)
  }
  await h.command('token.revoke', { tokenId: token.id })
  assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type: 'payout.instantConfirm', payload: confirm(ownerPreview) } })).status, 401)
  const card = structuredClone(h.stripePayments.instantCards[0])
  for (const cards of [[], [{ ...card, funding: 'credit' }], [{ ...card, available_payout_methods: ['standard'] }]]) {
    h.stripePayments.instantCards = cards
    await f.refuse('payout.instantPreview', input, 'PAYOUT_ELIGIBILITY')
  }
  h.stripePayments.instantCards = [card]; h.stripePayments.instantFunds = 10149
  await f.refuse('payout.instantPreview', input, 'PAYOUT_ELIGIBILITY')
  h.stripePayments.instantFunds = 10150
  for (const paymentIds of [[], Array(101).fill(s.payment.id), [s.payment.id, s.payment.id], [pending.payment.id], [unknownFee.payment.id]]) await f.refuse('payout.instantPreview', { ...input, paymentIds }, 'PAYOUT_ALLOCATION')
  for (const amount of ['99.99', '100.01']) await f.refuse('payout.instantPreview', { ...input, amount }, 'PAYOUT_ALLOCATION')
  const allocated = await f.source()
  await h.command('payout.allocate', { providerId: f.manual('synthetic-glove-used'), paymentIds: [allocated.payment.id] })
  await f.refuse('payout.instantPreview', { ...input, paymentIds: [allocated.payment.id] }, 'PAYOUT_ALLOCATION')
  await connectPayments(h)
  await f.refuse('payout.instantPreview', input, 'PAYOUT_ALLOCATION')
  await trail(h, ['payout.feeScheduleRecorded', 'payout.instantPreviewed'])
})
await scenario(t, 'PAY-026 point 2: explicit amounts and exact clock expiry recheck every mutable prerequisite', async t => {
  const f = await fixture(t), { h, b } = f
  await f.schedule()
  const source = await f.source(), p = await f.preview(source), payload = confirm(p)
  for (const person of [b.office, b.dispatcher]) await f.refuse('payout.instantConfirm', payload, 'FORBIDDEN', person.cookie)
  await f.refuse('payout.instantConfirm', { ...payload, confirmAmount: '99.99' }, 'CONSENT')
  await f.refuse('payout.instantConfirm', { ...payload, confirmFee: '1.49' }, 'CONSENT')
  await h.setTime(p.expiresAt)
  await f.refuse('payout.instantConfirm', payload, 'PAYOUT_STATE')
  await h.setTime(at)
  const changed = await f.preview(source)
  await f.schedule(151)
  await f.refuse('payout.instantConfirm', confirm(changed), 'PAYOUT_STATE')
  await f.schedule()
  const eligibility = await f.preview(source), card = structuredClone(h.stripePayments.instantCards[0])
  h.stripePayments.instantCards = []
  await f.refuse('payout.instantConfirm', confirm(eligibility), 'PAYOUT_ELIGIBILITY')
  h.stripePayments.instantCards = [card]; h.stripePayments.instantFunds = 10149
  await f.refuse('payout.instantConfirm', confirm(eligibility), 'PAYOUT_ELIGIBILITY')
  h.stripePayments.instantFunds = 1000000
  const reference = await f.preview(source), originalReference = source.pi.latest_charge.id
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, id: 'synthetic-glove-changed-charge' } })
  await f.refuse('payout.instantConfirm', confirm(reference), 'PAYOUT_ALLOCATION')
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, id: originalReference } })
  const net = await f.preview(source)
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, balance_transaction: { fee: 1 } } })
  await f.refuse('payout.instantConfirm', confirm(net), 'PAYOUT_ALLOCATION')
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, balance_transaction: { fee: 0 } } })
  const used = await f.preview(source)
  await h.command('payout.allocate', { providerId: f.manual('synthetic-glove-reallocated'), paymentIds: [source.payment.id] })
  await f.refuse('payout.instantConfirm', confirm(used), 'PAYOUT_ALLOCATION')
  const fresh = await f.source(), connection = await f.preview(fresh)
  await connectPayments(h)
  await f.refuse('payout.instantConfirm', confirm(connection), 'PAYOUT_STATE')
  await f.schedule(0, '0.00')
  const knownZero = await f.source({ net: 10000 }), zeroPreview = await f.preview(knownZero)
  await f.update(knownZero, { latest_charge: { ...knownZero.pi.latest_charge, balance_transaction: { fee: null } } })
  await f.refuse('payout.instantConfirm', confirm(zeroPreview), 'PAYOUT_ALLOCATION')
  await f.schedule()
  const timely = await f.source(), allowed = await f.preview(timely)
  await h.setTime(new Date(Date.parse(allowed.expiresAt) - 1).toISOString())
  const sent = await h.command('payout.instantConfirm', confirm(allowed))
  assert.equal(sent.status, 'paid'); assert.equal(posts(h).length, 1)
})
await scenario(t, 'PAY-026 point 3: durable reservation and retained key precede one concurrent request', async t => {
  const f = await fixture(t), { h } = f
  await f.schedule()
  const source = await f.source(), p = await f.preview(source)
  let observed = false, checkpointError
  h.stripePayments.beforePayout = async () => {
    try {
    const state = await h.state(), reserved = state.payouts.find(row => row.id === p.id)
    assert.deepEqual([reserved.status, reserved.amount, reserved.expectedFee, reserved.idempotencyKey], ['reserved', '100.00', '1.50', `glove-payout-${p.id}`])
    assert.equal(state.payments.find(row => row.id === source.payment.id).payoutAllocationId, p.id)
    assert.equal((await (await h.request('/api/glove/activity')).json()).events.filter(e => e.kind === 'payout.instantRequested').length, 1)
    observed = true
    } catch (error) { checkpointError = error; throw error }
  }
  const results = await Promise.all(Array.from({ length: 2 }, () => h.request('/api/glove/commands', { method: 'POST', body: { commandId: randomUUID(), type: 'payout.instantConfirm', payload: confirm(p) } })))
  assert.equal(results.filter(r => r.status === 200).length, 1)
  assert.equal(results.filter(r => r.status >= 400).length, 1)
  if (checkpointError) throw checkpointError
  assert.equal(observed, true); assert.equal(posts(h).length, 1)
  assert.deepEqual(posts(h)[0].form, { amount: '10000', currency: 'usd', method: 'instant', destination: 'synthetic-glove-debit-1', 'metadata[glove_payout_id]': p.id })
  assert.equal(posts(h)[0].idempotencyKey, `glove-payout-${p.id}`)
  await trail(h, ['payout.instantRequested', 'payout.instantProviderOutcome'])
})
await scenario(t, 'PAY-026 point 4: lost and unreachable answers remain reserved through replay, cron and Worker restart', async t => {
  for (const workerPlugins of [[], [unreachableStripe]]) {
    const f = await fixture(t, { workerPlugins }), { h } = f
    await f.schedule()
    const source = await f.source(), p = await f.preview(source), payload = confirm(p), commandId = randomUUID()
    h.stripePayments.payoutResponseLost = true
    const result = await h.command('payout.instantConfirm', payload, { commandId })
    assert.equal(result.status, 'reserved'); assert.equal(result.providerId, undefined)
    assert.equal(h.stripePayments.payouts.size, 1, 'provider accepted the request before its answer was lost')
    for (const restart of [false, true]) {
      if (restart) await h.restart()
      const before = await h.state()
      assert.deepEqual(await h.command('payout.instantConfirm', payload, { commandId }), result)
      await f.refuse('payout.instantConfirm', { ...payload, version: result.version }, 'PAYOUT_STATE')
      for (const minutes of [0, 15, 30]) await h.scheduled(new Date(Date.parse(at) + minutes * 60000).toISOString())
      assert.deepEqual(await h.state(), before)
      assert.equal(posts(h).length, 1)
      assert.equal((await h.state()).payments.find(row => row.id === source.payment.id).payoutAllocationId, p.id)
    }
    const audit = await trail(h, ['payout.instantRequested', 'payout.instantUnconfirmed'])
    assert.match(audit.activity.find(e => e.kind === 'payout.instantUnconfirmed').summary, /outcome unknown/)
    assert.equal(audit.exported.payouts.find(row => row.id === p.id).status, 'reserved')
  }
})
await scenario(t, 'PAY-026 point 5: confirmed sources cannot enter another preview, confirmation or manual allocation', async t => {
  const f = await fixture(t), { h } = f
  await f.schedule()
  const source = await f.source(), first = await f.preview(source), second = await f.preview(source)
  const firstPayload = confirm(first), commandId = randomUUID()
  const sent = await h.command('payout.instantConfirm', firstPayload, { commandId })
  assert.equal(sent.status, 'paid')
  await f.refuse('payout.instantPreview', { amount: '100.00', destination: 'synthetic-glove-debit-1', paymentIds: [source.payment.id] }, 'PAYOUT_ALLOCATION')
  await f.refuse('payout.instantConfirm', confirm(second), 'PAYOUT_ALLOCATION')
  await f.refuse('payout.allocate', { providerId: f.manual('synthetic-glove-other-payout'), paymentIds: [source.payment.id] }, 'PAYOUT_ALLOCATION')
  await h.restart()
  await f.refuse('payout.instantConfirm', confirm(second), 'PAYOUT_ALLOCATION')
  assert.equal(posts(h).length, 1)
  const customer = (await h.state()).customers.find(row => row.id === f.b.customer.id)
  const erasure = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: erasure.fingerprint, confirm: 'ERASE' })
  for (const restart of [false, true]) {
    if (restart) await h.restart()
    const before = await h.state()
    await h.command('payout.instantConfirm', firstPayload, { commandId, error: 'ERASED' })
    await f.refuse('payout.reconcile', { providerId: sent.providerId }, 'ERASED')
    assert.deepEqual(await h.state(), before)
    const exported = await (await h.request('/api/glove/export')).json()
    for (const value of [before.payouts, exported.payouts]) {
      const text = JSON.stringify(value)
      assert.ok(!text.includes(source.payment.id) && !text.includes(source.pi.latest_charge.id), 'erasure removes both reviewed and confirmed source identifiers')
    }
    assert.equal(posts(h).length, 1)
  }
})
await scenario(t, 'PAY-026 point 6: actual debit, original allocation and fee must match the confirmed preview on every inspection', async t => {
  const f = await fixture(t), { h } = f
  await f.schedule()
  const source = await f.source(), p = await f.preview(source), sent = await h.command('payout.instantConfirm', confirm(p))
  const provider = h.stripePayments.payouts.get(sent.providerId), original = structuredClone(provider)
  const inspect = () => h.command('payout.reconcile', { providerId: sent.providerId })
  const matched = await inspect()
  assert.deepEqual([matched.reconciled, matched.amount, matched.payoutFee, matched.net, matched.difference, matched.unmatched], [true, '100.00', '1.50', '101.50', '0.00', []])
  assert.ok(matched.items.some(item => item.paymentId === source.payment.id))
  provider.amount--; provider.balance_transaction.amount++; provider.balance_transaction.net++
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, balance_transaction: { fee: 1 } } })
  for (let n = 0; n < 2; n++) {
    const drift = await inspect()
    assert.equal(drift.reconciled, false, 'repeated inspection cannot replace the confirmed bank amount with provider drift')
    assert.ok(drift.unmatched.some(item => /source allocation differs from confirmed preview/.test(item.reason)))
  }
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, balance_transaction: { fee: 0 } } })
  Object.assign(provider, structuredClone(original))
  provider.balance_transaction.fee++; provider.balance_transaction.net--
  const fee = await inspect()
  assert.equal(fee.reconciled, false)
  assert.ok(fee.unmatched.some(item => item.reason === 'actual payout fee differs from confirmed preview'))
  Object.assign(provider, structuredClone(original))
  provider.amount--; provider.balance_transaction.amount++; provider.balance_transaction.fee++; // Same total debit, different bank amount and fee.
  for (let n = 0; n < 2; n++) {
    const changed = await inspect()
    assert.equal(changed.reconciled, false)
    assert.ok(changed.unmatched.some(item => /actual amount or fee differs from confirmed preview/.test(item.reason)))
  }
  Object.assign(provider, structuredClone(original))
  await f.update(source, { latest_charge: { ...source.pi.latest_charge, status: 'failed' } })
  const sourceMismatch = await inspect()
  assert.equal(sourceMismatch.reconciled, false)
  assert.ok(sourceMismatch.unmatched.some(item => /source/.test(item.reason)), 'changed allocated source availability has a named reason')
  await trail(h, ['payout.reconciled'])
})
})
