import { paymentEvent } from './payment-journey.mjs'

const installed = new WeakMap()
/** Only new Stripe network endpoints; the Worker, commands, sessions and D1 stay real. */
export function savedCardsEdge(h) {
  if (installed.has(h)) return installed.get(h)
  const previous = h.stripePayments.answer.bind(h.stripePayments), customers = new Map(), methods = new Map(), calls = []
  const edge = { customers, methods, calls, unavailable: false, beforeRespond: null, at: null }
  h.stripePayments.answer = async request => {
    const url = new URL(request.url)
    if (url.hostname !== 'api.stripe.com') return previous(request)
    const match = /^\/v1\/customers\/([^/]+)(?:\/payment_methods\/([^/]+))?$/.exec(url.pathname)
    if (match && request.method === 'GET') {
      calls.push({ method: 'GET', path: url.pathname })
      const customer = customers.get(match[1]), method = methods.get(match[2])
      if (!customer || match[2] && (!method || method.customer !== customer.id)) return Response.json({ error: 'synthetic-glove-3' }, { status: 404 })
      return Response.json(match[2] ? method : customer)
    }
    if (url.pathname !== '/v1/payment_intents' || request.method !== 'POST') return previous(request)
    const form = Object.fromEntries(new URLSearchParams(await request.text()))
    calls.push({ method: 'POST', path: url.pathname, form, idempotencyKey: request.headers.get('idempotency-key') })
    const method = methods.get(form.payment_method), customer = customers.get(form.customer)
    if (!method || !customer || method.customer !== customer.id || form.confirm !== 'true' || form.off_session !== 'true' || form['payment_method_types[0]'] !== 'card') return Response.json({ error: 'synthetic-glove-4' }, { status: 400 })
    const n = h.stripePayments.intents.size + 1, id = `pi_synthetic-glove-${n}`
    const intent = { id, customer: customer.id, payment_method: method.id, livemode: false, amount: Number(form.amount), amount_received: Number(form.amount), currency: form.currency, status: 'succeeded', metadata: { glove_payment_id: form['metadata[glove_payment_id]'], glove_connection_id: form['metadata[glove_connection_id]'] }, latest_charge: { id: `ch_synthetic-glove-${n}`, created: Math.floor((edge.at ?? Date.now()) / 1000), status: 'succeeded', balance_transaction: { fee: 100 } } }
    h.stripePayments.intents.set(id, intent)
    if (edge.beforeRespond) await edge.beforeRespond()
    if (edge.unavailable) throw new TypeError('synthetic-glove-5')
    return Response.json(intent)
  }
  installed.set(h, edge)
  return edge
}

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
