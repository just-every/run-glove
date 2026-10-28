import { paymentEvent } from './payment-journey.mjs'

import { savedCardsEdge } from './saved-cards-edge.mjs'
export { savedCardsEdge }

export async function registerSavedCard(h, customerId, { scope = 'business', n = 1 } = {}) {
  const edge = savedCardsEdge(h), stripeCustomerId = `cus_synthetic-glove-${n}`, stripeMethodId = `pm_synthetic-glove-${n}`
  edge.customers.set(stripeCustomerId, { id: stripeCustomerId, livemode: false, metadata: { glove_customer_id: customerId } })
  edge.methods.set(stripeMethodId, { id: stripeMethodId, customer: stripeCustomerId, type: 'card', livemode: false, card: { brand: 'visa', last4: '4242' } })
  const customer = (await h.state()).customers.find(c => c.id === customerId)
  const result = await h.command('payment.savedCardRegister', { customerId, version: customer.version, stripeCustomerId, stripeMethodId, scope, source: 'synthetic-glove-6', wording: 'Customer authorizes this business to charge the saved card for approved invoices.', confirmed: true })
  return result.savedCards.find(c => c.stripeMethodId === stripeMethodId)
}

export function savedCardIntent(h, paymentId) {
  return [...h.stripePayments.intents.values()].find(pi => pi.metadata.glove_payment_id === paymentId)
}

export const confirmSavedCard = (h, paymentId, options) => paymentEvent(h, savedCardIntent(h, paymentId), 'payment_intent.succeeded', options)
