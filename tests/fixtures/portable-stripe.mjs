import { stripePaymentsEdge } from './stripe-payments.mjs'
import { savedCardsEdge } from './saved-cards-edge.mjs'

// Installed only into each portability journey's scratch Worker entry.
// Domain commands, sessions, D1 and the archive adapter remain unchanged.
export function portableStripe(worker) {
  const upstream = globalThis.fetch, h = { stripePayments: stripePaymentsEdge() }, edge = savedCardsEdge(h)
  const Clock = Date
  let instant = null
  globalThis.Date = class extends Clock {
    constructor(...args) { super(...(args.length ? args : [instant ?? Clock.now()])) }
    static now() { return instant ?? Clock.now() }
  }
  globalThis.fetch = async (input, options) => {
    const request = new Request(input, options), url = new URL(request.url)
    if (url.hostname !== 'api.stripe.com') return upstream(input, options)
    const match = /^\/v1\/customers\/(cus_([^/]+))(?:\/payment_methods\/(pm_[^/]+))?$/.exec(url.pathname)
    if (match) {
      edge.customers.set(match[1], { id: match[1], livemode: false, metadata: { glove_customer_id: match[2] } })
      if (match[3]) edge.methods.set(match[3], { id: match[3], customer: match[1], type: 'card', livemode: false, card: { brand: 'visa', last4: '4242' } })
    }
    return await h.stripePayments.answer(request) ?? Response.json({ error: 'synthetic-glove-80' }, { status: 404 })
  }
  return { ...worker, async fetch(request, env, context) {
    if (new URL(request.url).pathname === '/__portable/stripe') {
      if (request.method === 'POST') { const { at } = await request.json(); instant = at === null ? null : Date.parse(at); edge.at = instant }
      return Response.json({ posts: edge.calls.filter(c => c.method === 'POST').length })
    }
    return worker.fetch(request, env, context)
  } }
}
