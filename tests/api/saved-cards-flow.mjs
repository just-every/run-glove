import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'
import { savedCardsEdge, registerSavedCard, savedCardIntent, confirmSavedCard } from '../fixtures/saved-cards.mjs'

export async function savedCardsFlow(t) {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'America/New_York' })
  const invoice = await paidInvoice(h, b, '2026-11-02'), second = await paidInvoice(h, b, '2026-11-03')
  await connectPayments(h)
  const edge = savedCardsEdge(h), card = await registerSavedCard(h, b.customer.id), autopay = await registerSavedCard(h, b.customer.id, { scope: 'autopay', n: 2 })
  const payload = { invoiceId: invoice.id, version: invoice.version, cardId: card.id, amount: invoice.revisions[0].totals.total, confirmed: true }
  const before = edge.calls.filter(c => c.method === 'POST').length
  for (const person of [b.dispatcher, b.priyaPerson, b.agent]) await person.run('payment.savedCardCharge', payload, { error: 'FORBIDDEN' })
  await b.office.run('payment.savedCardRegister', {}, { error: 'FORBIDDEN' })
  await b.office.run('payment.savedCardCharge', { ...payload, cardId: autopay.id }, { error: 'CARD_AUTHORIZATION' })
  await b.office.run('payment.savedCardCharge', { ...payload, cardNumber: 'synthetic-glove-7' }, { error: 'INPUT' })
  assert.equal(edge.calls.filter(c => c.method === 'POST').length, before)
  const method = edge.methods.get(card.stripeMethodId)
  method.customer = 'cus_synthetic-glove-999'
  await b.office.run('payment.savedCardCharge', payload, { error: 'SAVED_CARD' })
  method.customer = card.stripeCustomerId
  const commandId = randomUUID(), payment = await b.office.run('payment.savedCardCharge', payload, { commandId })
  const state = await h.state(), reserved = state.payments.find(p => p.id === payment.id)
  assert.equal(reserved.status, 'reserved')
  assert.equal(reserved.by.id, b.office.id)
  assert.deepEqual(reserved.effects, [], 'even a succeeded create response does not settle funds')
  const balance = async id => {
    const response = await h.request('/api/glove/balances')
    assert.equal(response.status, 200)
    return (await response.json()).invoices.find(i => i.id === id)
  }
  assert.equal((await balance(invoice.id)).due, payload.amount)
  await b.office.run('payment.savedCardCharge', payload, { commandId })
  await b.office.run('payment.savedCardCharge', payload, { error: 'PAYMENT_PENDING' })
  assert.equal(edge.calls.filter(c => c.method === 'POST').length, before + 1)
  const intent = savedCardIntent(h, payment.id)
  assert.equal((await confirmSavedCard(h, payment.id, { signature: false })).status, 401)
  const oldCustomer = intent.customer
  intent.customer = 'cus_synthetic-glove-999'
  assert.equal((await confirmSavedCard(h, payment.id)).status, 401)
  intent.customer = oldCustomer
  const eventId = randomUUID()
  assert.equal((await confirmSavedCard(h, payment.id, { id: eventId })).status, 200)
  assert.equal((await confirmSavedCard(h, payment.id, { id: eventId })).status, 200)
  const settled = (await h.state()).payments.find(p => p.id === payment.id)
  assert.equal(settled.status, 'paid')
  assert.equal(settled.effects.length, 1)
  assert.equal((await balance(invoice.id)).due, '0.00')
  assert.equal(settled.by.id, b.office.id)

  // A lost provider response remains blocked across replay, then reconciles by webhook.
  edge.unavailable = true
  const nextPayload = { ...payload, invoiceId: second.id, version: second.version, amount: second.revisions[0].totals.total }, nextId = randomUUID()
  const uncertain = await h.command('payment.savedCardCharge', nextPayload, { commandId: nextId })
  const posts = edge.calls.filter(c => c.method === 'POST').length
  await h.command('payment.savedCardCharge', nextPayload, { commandId: nextId })
  await h.command('payment.savedCardCharge', nextPayload, { error: 'PAYMENT_PENDING' })
  assert.equal(edge.calls.filter(c => c.method === 'POST').length, posts)
  const declined = savedCardIntent(h, uncertain.id)
  Object.assign(declined, { status: 'requires_payment_method', amount_received: 0, latest_charge: null, last_payment_error: { decline_code: 'insufficient_funds', message: 'synthetic-glove-8' } })
  assert.equal((await paymentEvent(h, declined, 'payment_intent.payment_failed')).status, 200)
  const failed = (await h.state()).payments.find(p => p.id === uncertain.id)
  assert.equal(failed.status, 'failed')
  assert.equal(failed.failureReason, 'Insufficient funds')
  assert.equal((await balance(second.id)).due, nextPayload.amount)

  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('payment.savedCardRevoke', { customerId: customer.id, version: customer.version, cardId: card.id, reason: 'synthetic-glove-9' })
  await h.command('payment.savedCardCharge', nextPayload, { error: 'SAVED_CARD' })
  const trail = await assertTrail(h, ['savedCard.authorized', 'savedCard.revoked', 'payment.savedCardRequested', 'payment.savedCardAccepted', 'payment.savedCardUnconfirmed', 'payment.paid', 'payment.failed'])
  assert.equal(trail.activity.find(e => e.kind === 'payment.savedCardRequested' && e.subjectId === payment.id).actorId, b.office.id)
  assert.doesNotMatch(JSON.stringify(trail.exported), /"synthetic-glove-[128]"|client_secret|cardNumber|stripe-signature/)
}
