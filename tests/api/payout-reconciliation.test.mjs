import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business } from './harness.mjs'
import { connectPayments, paidInvoice, paymentEvent, instantFunding } from '../fixtures/payment-journey.mjs'

const at = '2026-11-08T12:00:00.000Z', seconds = Date.parse(at) / 1000
const read = async (h, path, as) => {
  const response = await h.request(path, { ...(as ? { as } : {}) })
  assert.equal(response.status, 200)
  return response.json()
}
async function fixture(t) {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD' }); await connectPayments(h)
  let n = 0
  const source = async ({ paid = true, fee = 100 } = {}) => {
    const invoice = await paidInvoice(h, b, `2026-10-${20 + n++}`)
    const checkout = await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'card', amount: '100.00' })
    const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    Object.assign(pi, { status: paid ? 'succeeded' : 'processing', amount_received: paid ? 10000 : 0, latest_charge: { id: `synthetic-glove-source-${n}`, created: seconds, status: paid ? 'succeeded' : 'pending', balance_transaction: { fee } } })
    assert.equal((await paymentEvent(h, pi, paid ? 'payment_intent.succeeded' : 'payment_intent.processing', { at: seconds })).status, 200)
    const payment = (await h.state()).payments.find(p => p.id === checkout.id)
    return { invoice, pi, payment, tx: { id: `synthetic-glove-balance-${n}`, type: 'charge', source: { id: pi.latest_charge.id }, amount: 10000, fee: fee ?? 100, net: 10000 - (fee ?? 100), currency: 'usd' } }
  }
  const register = (id, tx, changes = {}) => {
    h.stripePayments.payouts.set(id, { id, amount: tx.reduce((sum, row) => sum + row.net, 0), currency: 'usd', method: 'standard', automatic: true, status: 'paid', livemode: false, balance_transaction: { fee: 0 }, ...changes })
    h.stripePayments.transactions.set(id, { data: tx, has_more: false })
    return { providerId: id }
  }
  const records = []
  const inspect = async payload => {
    const payments = (await h.state()).payments
    const commandId = randomUUID(), before = h.stripePayments.calls.length
    const result = await h.command('payout.reconcile', payload, { commandId })
    assert.deepEqual((await h.state()).payments, payments, 'inspection never posts or changes a source payment')
    records.push({ type: 'payout.reconcile', payload, commandId, result, calls: h.stripePayments.calls.length - before })
    return result
  }
  const replay = async () => {
    const before = await h.state(), calls = h.stripePayments.calls.length
    for (const row of records) assert.deepEqual(await h.command(row.type, row.payload, { commandId: row.commandId }), row.result)
    assert.deepEqual(await h.state(), before, 'replay preserves retained records and Activity')
    assert.equal(h.stripePayments.calls.length, calls, 'command replay makes no provider call')
  }
  const restart = async () => {
    await replay()
    const before = await h.state()
    await h.restart()
    assert.deepEqual(await h.state(), before, 'actual Worker restart retains exact financial and audit state')
    await replay()
  }
  const unchangedRefusal = async (payload, code) => {
    const before = await h.state()
    const error = await h.command('payout.reconcile', payload, { error: code })
    assert.deepEqual(await h.state(), before, 'refused inspection changes no retained fact or balance')
    return error
  }
  return { h, b, source, register, inspect, records, restart, unchangedRefusal }
}

test('PAY-007 point 1: six Checkout payments, a refund, missing source and Instant Payout reconcile to exact cents across restart and replay', async t => {
  const f = await fixture(t), { h, b } = f, sources = []
  for (let n = 0; n < 6; n++) sources.push(await f.source())
  const first = sources[0]
  const refund = await h.command('payment.refund', { invoiceId: first.invoice.id, version: first.invoice.version, paymentId: first.payment.id, paymentVersion: first.payment.version, amount: '10.00', reason: 'Returned part before payout' })
  const tx = [...sources.map(s => s.tx), { id: 'synthetic-glove-refund-balance', type: 'refund', source: refund.providerReference, currency: 'usd', amount: -1000, fee: -20, net: -980 }]
  const payload = f.register('synthetic-glove-six', tx)
  const matched = await f.inspect(payload)
  assert.deepEqual([matched.reconciled, matched.amount, matched.net, matched.difference, matched.payoutFee, matched.unmatched], [true, '584.20', '584.20', '0.00', '0.00', []])
  assert.deepEqual(matched.items.map(i => [i.paymentId, i.amountCents, i.feeCents, i.netCents]), [...sources.map(s => [s.payment.id, 10000, 100, 9900]), [refund.id, -1000, -20, -980]])
  tx.push({ id: 'synthetic-glove-missing-row', type: 'charge', source: 'synthetic-glove-missing-payment', currency: 'usd', amount: 1234, fee: 37, net: 1197 })
  f.register(payload.providerId, tx)
  const missing = await f.inspect(payload)
  assert.deepEqual([missing.reconciled, missing.net, missing.difference, missing.unmatched.map(i => [i.providerReference, i.reason])], [false, '596.17', '0.00', [['synthetic-glove-missing-payment', 'missing payment']]])
  await h.command('payout.feeSchedule', { version: (await h.state()).business[0].version, basisPoints: 150, minimum: '0.50', source: 'Owner recorded test schedule' })
  await h.setTime(null)
  const funding = await instantFunding(h, b)
  await h.setTime(at)
  const preview = await h.command('payout.instantPreview', { amount: '1000.00', destination: 'synthetic-glove-debit-1', paymentIds: [funding.payment.id] })
  const instant = await h.command('payout.instantConfirm', { payoutId: preview.id, version: preview.version, confirmAmount: '1000.00', confirmFee: '15.00' })
  const result = await f.inspect({ providerId: instant.providerId })
  assert.deepEqual([result.reconciled, result.amount, result.payoutFee, result.net, result.difference, result.unmatched], [true, '1000.00', '15.00', '1015.00', '0.00', []])
  assert.match(result.sourceMembership, /owner explicitly allocates/)
  await f.restart()
  const calls = h.stripePayments.calls.length
  const fresh = await f.inspect(payload)
  assert.deepEqual([fresh.reconciled, fresh.items, fresh.unmatched, fresh.net], [missing.reconciled, missing.items, missing.unmatched, missing.net])
  assert.equal(h.stripePayments.calls.length - calls, f.records[1].calls)
})

test('PAY-007 point 2: every inspection and reviewed allocation has attributable secret-free Activity and business export facts', async t => {
  const f = await fixture(t), { h } = f, source = await f.source()
  const automatic = f.register('synthetic-glove-audit-auto', [source.tx])
  await f.inspect(automatic)
  const manual = f.register('synthetic-glove-audit-manual', [], { automatic: false, amount: 9900, balance_transaction: { id: 'synthetic-glove-audit-debit', type: 'payout', currency: 'usd', amount: -9900, fee: 0, net: -9900 } })
  await f.inspect(manual)
  const extra = await f.source()
  h.stripePayments.payouts.get(manual.providerId).amount = 9900
  const payload = { ...manual, paymentIds: [extra.payment.id] }, commandId = randomUUID()
  const allocation = await h.command('payout.allocate', payload, { commandId })
  f.records.push({ type: 'payout.allocate', payload, commandId, result: allocation })
  await f.restart()
  const owner = (await h.state()).actor
  const activity = (await read(h, '/api/glove/activity')).events.filter(e => e.kind === 'payout.reconciled' || e.kind === 'payout.sourcesAllocated')
  const exported = await read(h, '/api/glove/export')
  assert.equal(activity.length, 3)
  for (const event of activity) {
    assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at], [owner.id, owner.name, 'owner', at])
    assert.ok(event.commandId && event.summary)
    assert.ok([automatic.providerId, manual.providerId].some(id => event.summary.includes(id)), 'Activity names the inspected Stripe reference')
    const kept = exported.timeline.find(e => e.id === event.id)
    assert.ok(kept)
    assert.equal(JSON.parse(kept.data).provider, 'Stripe')
    assert.ok([automatic.providerId, manual.providerId].includes(JSON.parse(kept.data).providerReference))
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.summary], [event.actorId, event.actorName, event.actorRole, event.at, event.commandId, event.summary])
  }
  assert.deepEqual(exported.payouts.map(p => p.providerId).sort(), [automatic.providerId, manual.providerId].sort())
  for (const value of [activity, exported]) {
    const text = JSON.stringify(value)
    assert.ok(!text.includes('synthetic-glove-1') && !text.includes('synthetic-glove-2'), 'provider keys are absent')
    assert.ok(!text.includes('checkout.stripe.com') && !text.includes('synthetic-glove-session-'), 'private Checkout material is absent')
  }
})

test('PAY-007 point 3: only a signed-in unscoped Owner inspects positive USD test payouts', async t => {
  const f = await fixture(t), { h, b } = f, source = await f.source()
  const payload = f.register('synthetic-glove-authority', [source.tx])
  const result = await f.inspect(payload)
  assert.deepEqual([result.reconciled, result.currency, result.mode], [true, 'USD', 'test'])
  const custom = await h.person('Custom payout reader', 'viewer')
  const role = await h.command('role.save', { name: 'Payout reports', permissions: ['reports.read', 'export.read', 'payout.reconcile', 'payout.allocate'] })
  await h.command('role.set', { operatorId: custom.id, role: 'custom:' + role.id })
  const scoped = await h.person('Scoped payout Owner', 'owner')
  await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
  const excluded = [b.office, b.dispatcher, b.priyaPerson, custom, scoped]
  for (const person of excluded) {
    const before = await h.state(), calls = h.stripePayments.calls.length
    await person.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
    await person.run('payout.allocate', { ...payload, paymentIds: [source.payment.id] }, { error: 'FORBIDDEN' })
    for (const path of ['/api/glove/state', '/api/glove/activity', '/api/glove/export']) {
      const response = await h.request(path, { as: person.cookie })
      if (response.status === 200) assert.ok(!(await response.text()).includes(payload.providerId), `${person.name} cannot read retained provider facts`)
      else assert.equal(response.status, 403)
    }
    assert.deepEqual(await h.state(), before); assert.equal(h.stripePayments.calls.length, calls)
  }
  const token = await h.command('token.issue', { name: 'Payout integration', role: 'office' })
  const tokenRead = await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${token.token}` } })
  assert.equal(tokenRead.status, 200)
  assert.ok(!(await tokenRead.text()).includes(payload.providerId))
  const attempt = async expected => {
    const before = await h.state(), calls = h.stripePayments.calls.length
    for (const type of ['payout.reconcile', 'payout.allocate']) {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type, payload: { ...payload, paymentIds: [source.payment.id] } } })
      assert.equal(response.status, expected)
    }
    assert.deepEqual(await h.state(), before); assert.equal(h.stripePayments.calls.length, calls)
  }
  await attempt(403)
  await h.command('token.revoke', { tokenId: token.id }); await attempt(401)
  assert.equal((await h.request('/api/glove/commands', { method: 'POST', as: '', body: { type: 'payout.reconcile', commandId: randomUUID(), payload } })).status, 401)
  for (const change of [{ livemode: true }, { currency: 'aud' }, { amount: 0 }, { amount: -1 }]) {
    f.register('synthetic-glove-invalid-payout', [source.tx], change)
    await f.unchangedRefusal({ providerId: 'synthetic-glove-invalid-payout' }, 'PAYOUT_PROVIDER')
  }
  const former = await h.person('Former payout Owner', 'owner'), formerCommand = randomUUID()
  await former.run('payout.reconcile', payload, { commandId: formerCommand })
  await h.command('role.set', { operatorId: former.id, role: 'office' })
  const afterWithdrawal = await h.state(), calls = h.stripePayments.calls.length
  await former.run('payout.reconcile', payload, { error: 'FORBIDDEN' })
  await former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
  assert.deepEqual(await h.state(), afterWithdrawal)
  assert.equal(h.stripePayments.calls.length, calls, 'withdrawn authority cannot inspect or replay provider facts')
  await f.restart()
  await former.run('payout.reconcile', payload, { commandId: formerCommand, error: 'FORBIDDEN' })
})

test('PAY-007 point 4: ten pages reconcile exactly 1000 rows; overflow, incomplete pages, duplicates, inconsistent rows and wrong sources refuse safely', async t => {
  const f = await fixture(t), { h } = f, source = await f.source(), pending = await f.source({ paid: false }), noFee = await f.source({ fee: null })
  const tx = [source.tx, ...Array.from({ length: 999 }, (_, n) => ({ id: `synthetic-glove-fee-${n}`, type: 'stripe_fee', source: null, amount: -1, fee: 0, net: -1, currency: 'usd' }))]
  const payload = f.register('synthetic-glove-thousand', tx)
  const before = h.stripePayments.calls.length, result = await f.inspect(payload)
  assert.deepEqual([result.reconciled, result.items.length, result.amount, result.net, result.difference, result.unmatched], [true, 1000, '89.01', '89.01', '0.00', []])
  const pages = h.stripePayments.calls.slice(before).filter(c => c.path === '/v1/balance_transactions')
  assert.equal(pages.length, 10)
  assert.deepEqual(pages.map(c => [c.limit, c.startingAfter]), Array.from({ length: 10 }, (_, n) => ['100', n === 0 ? null : tx[n * 100 - 1].id]))
  const overflow = f.register('synthetic-glove-overflow', [...tx, { ...tx[1], id: 'synthetic-glove-overflow-row' }])
  await f.unchangedRefusal(overflow, 'PAYOUT_LIMIT')
  const malformed = f.register('synthetic-glove-malformed', [source.tx])
  for (const page of [{ data: [], has_more: true }, { data: [source.tx, source.tx], has_more: false }, { data: [{ ...source.tx, net: 1 }], has_more: false }]) {
    h.stripePayments.balancePages.set(malformed.providerId, new Map([[null, page]]))
    await f.unchangedRefusal(malformed, page.data.length ? 'PAYOUT_PROVIDER' : 'PAYOUT_LIMIT')
  }
  h.stripePayments.balancePages.set(malformed.providerId, new Map([[null, { data: [source.tx], has_more: true }], [source.tx.id, { data: [source.tx], has_more: false }]]))
  await f.unchangedRefusal(malformed, 'PAYOUT_PROVIDER')
  const first = source.payment
  h.stripePayments.refundStatus = 'pending'
  const refund = await h.command('payment.refund', { invoiceId: source.invoice.id, version: source.invoice.version, paymentId: first.id, paymentVersion: first.version, amount: '1.00', reason: 'Pending refund source' })
  for (const [name, row, reason] of [
    ['unsupported', { ...source.tx, type: 'transfer' }, 'unsupported transaction type'],
    ['missing-payment', { ...source.tx, source: 'synthetic-glove-absent' }, 'missing payment'],
    ['missing-refund', { ...source.tx, type: 'refund', source: 'synthetic-glove-absent-refund' }, 'missing refund'],
    ['pending-payment', pending.tx, 'payment or refund not confirmed'],
    ['pending-refund', { ...source.tx, type: 'refund', source: refund.providerReference, amount: -100, fee: 0, net: -100 }, 'payment or refund not confirmed'],
    ['gross', { ...source.tx, amount: 10001, net: 9901 }, 'gross amount differs'],
    ['fee', { ...source.tx, fee: 101, net: 9899 }, 'fee differs or is unavailable'],
    ['unavailable-fee', noFee.tx, 'fee differs or is unavailable'],
  ]) {
    const input = f.register(`synthetic-glove-wrong-${name}`, [row], { amount: Math.max(1, row.net) })
    const outcome = await f.inspect(input)
    assert.equal(outcome.reconciled, false, name)
    assert.deepEqual(outcome.unmatched.map(i => [i.id, i.reason]), [[row.id, reason]], name)
  }
  const foreign = f.register('synthetic-glove-foreign-source', [{ ...source.tx, currency: 'aud' }])
  const error = await f.unchangedRefusal(foreign, 'PAYOUT_PROVIDER')
  assert.match(error.message, /currency differs/)
  await f.restart()
  const count = h.stripePayments.calls.length, fresh = await f.inspect(payload)
  assert.deepEqual([fresh.items, fresh.unmatched, fresh.net, fresh.reconciled], [result.items, result.unmatched, result.net, true])
  assert.equal(h.stripePayments.calls.length - count, 11, 'a fresh inspection still reads exactly ten pages after Worker restart')
})

test('PAY-007 point 5: bank plus payout fee must equal source net exactly and only paid payouts reconcile', async t => {
  const f = await fixture(t), { h } = f, source = await f.source()
  const payload = f.register('synthetic-glove-cent-boundary', [source.tx], { amount: 9875, balance_transaction: { fee: 25 } })
  const payments = (await h.state()).payments
  assert.deepEqual([(await f.inspect(payload)).reconciled, (await f.inspect(payload)).difference], [true, '0.00'])
  for (const [amount, difference] of [[9874, '0.01'], [9876, '-0.01']]) {
    h.stripePayments.payouts.get(payload.providerId).amount = amount
    const row = await f.inspect(payload)
    assert.deepEqual([row.reconciled, row.difference], [false, difference])
  }
  h.stripePayments.payouts.get(payload.providerId).amount = 9875
  for (const status of ['pending', 'in_transit', 'failed', 'canceled']) {
    h.stripePayments.payouts.get(payload.providerId).status = status
    const row = await f.inspect(payload)
    assert.deepEqual([row.providerStatus, row.reconciled, row.difference, row.unmatched], [status, false, '0.00', []])
  }
  assert.deepEqual((await h.state()).payments, payments, 'inspection never changes a payment balance')
  await f.restart()
})

test('PAY-007 point 6: an unavailable payout fee refuses without changing any retained payout', async t => {
  const f = await fixture(t), { h } = f, source = await f.source()
  const payload = f.register('synthetic-glove-fee-required', [source.tx])
  await f.inspect(payload)
  for (const value of [undefined, {}, { fee: null }, { fee: -1 }, { fee: 0.5 }]) {
    h.stripePayments.payouts.get(payload.providerId).balance_transaction = value
    const error = await f.unchangedRefusal(payload, 'PAYOUT_PROVIDER')
    assert.match(error.message, /payout fee; no zero fee is inferred/)
  }
  await f.restart()
  await f.unchangedRefusal(payload, 'PAYOUT_PROVIDER')
})

async function manualFixture(t) {
  const f = await fixture(t), source = await f.source()
  const payload = f.register('synthetic-glove-manual', [], { automatic: false, amount: 9875, balance_transaction: { id: 'synthetic-glove-manual-debit', type: 'payout', amount: -9875, fee: 25, net: -9900, currency: 'usd' } })
  return { ...f, source, payload }
}
test('PAY-007 point 7: a manual payout has no Stripe source attribution before owner review', async t => {
  const f = await manualFixture(t), { h, payload } = f
  const payments = (await h.state()).payments
  const row = await f.inspect(payload)
  assert.deepEqual([row.reconciled, row.items, row.unmatched.map(i => [i.paymentId, i.reason])], [false, [], [[null, 'source allocation not reviewed']]])
  assert.match(row.sourceMembership, /Stripe does not attribute source payments to manual payouts/)
  assert.equal(row.sourcePaymentIds, undefined)
  assert.deepEqual((await h.state()).payments, payments, 'inspection does not allocate available sources')
  await f.restart()
})

test('PAY-007 point 8: only explicit owner books allocation reconciles manual sources and other unreviewed payouts remain unmatched', async t => {
  const f = await manualFixture(t), { h, payload, source } = f
  const unreviewed = f.register('synthetic-glove-unreviewed', [], { ...h.stripePayments.payouts.get(payload.providerId), id: 'synthetic-glove-unreviewed' })
  await f.inspect(payload); await f.inspect(unreviewed)
  const before = await h.state(), calls = h.stripePayments.calls.length
  await h.command('payout.allocate', { ...payload, paymentIds: [] }, { error: 'PAYOUT_ALLOCATION' })
  assert.deepEqual(await h.state(), before)
  assert.equal(h.stripePayments.calls.length, calls + 1, 'only the provider read occurs on invalid allocation')
  const input = { ...payload, paymentIds: [source.payment.id] }, commandId = randomUUID()
  const row = await h.command('payout.allocate', input, { commandId })
  f.records.push({ type: 'payout.allocate', payload: input, commandId, result: row })
  assert.deepEqual([row.reconciled, row.amount, row.payoutFee, row.net, row.sourceNet, row.difference, row.sourcePaymentIds, row.unmatched], [true, '98.75', '0.25', '99.00', '99.00', '0.00', [source.payment.id], []])
  assert.equal(row.items.find(i => i.type === 'owner-allocated source').paymentId, source.payment.id)
  assert.match(row.sourceBasis, /Owner-reviewed books allocation; not a Stripe source attribution/)
  assert.equal((await h.state()).payments.find(p => p.id === source.payment.id).payoutAllocationId, row.id)
  const other = await f.inspect(unreviewed)
  assert.deepEqual([other.reconciled, other.items, other.unmatched[0].reason], [false, [], 'source allocation not reviewed'])
  const allocated = await h.state()
  await h.command('payout.allocate', { ...unreviewed, paymentIds: [source.payment.id] }, { error: 'PAYOUT_ALLOCATION' })
  assert.deepEqual(await h.state(), allocated, 'one source cannot be allocated twice')
  await f.restart()
  const customer = (await h.state()).customers.find(c => c.id === f.b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  const erased = async () => {
    const state = await h.state(), calls = h.stripePayments.calls.length
    const bank = state.payouts.find(p => p.id === row.id)
    assert.deepEqual([bank.amount, bank.payoutFee, bank.net, bank.reconciled], ['98.75', '0.25', '99.00', true])
    assert.ok(bank.sourceDetailsErasedAt)
    await h.command('payout.reconcile', payload, { error: 'ERASED' })
    await h.command('payout.allocate', input, { error: 'ERASED' })
    await h.command('payout.allocate', input, { commandId, error: 'ERASED' })
    assert.deepEqual(await h.state(), state, 'neither fresh inspection nor replay restores erased source details')
    assert.equal(h.stripePayments.calls.length, calls, 'erasure refuses before provider reads')
    for (const value of [state.payouts, await read(h, '/api/glove/activity'), await read(h, '/api/glove/export')]) {
      const text = JSON.stringify(value)
      assert.ok(!text.includes(source.pi.latest_charge.id), 'erased provider source is absent from every retained public projection')
    }
    return state
  }
  const afterErasure = await erased()
  await h.restart()
  assert.deepEqual(await erased(), afterErasure)
})
