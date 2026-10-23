// Only Stripe's network boundary is replaced. Test credentials are synthetic.
export function stripePaymentsEdge() {
  const sessions = [], intents = new Map(), refunds = new Map(), calls = []
  let status = 200, livemode = false, refundStatus = 'succeeded'
  return { sessions, intents, refunds, calls, set refundStatus(value) { refundStatus = value }, set livemode(value) { livemode = value }, set status(value) { status = value }, async answer(request) {
    const url = new URL(request.url)
    if (url.hostname !== 'api.stripe.com' || !(url.pathname.startsWith('/v1/refunds') || url.pathname === '/v1/balance' || url.pathname === '/v1/checkout/sessions' || url.pathname.startsWith('/v1/payment_intents/'))) return null
    calls.push({ method: request.method, path: url.pathname, idempotencyKey: request.headers.get('idempotency-key') })
    if (status !== 200) return Response.json({ error: 'synthetic-glove-1' }, { status })
    if (url.pathname === '/v1/refunds') {
      const form = Object.fromEntries(new URLSearchParams(await request.text()))
      const id = `synthetic-glove-refund-${refunds.size + 1}`, pi = intents.get(form.payment_intent)
      const row = { id, payment_intent: pi.id, amount: Number(form.amount), currency: pi.currency, status: refundStatus, metadata: { glove_refund_id: form['metadata[glove_refund_id]'] } }
      refunds.set(id, row); return Response.json(row)
    }
    if (url.pathname.startsWith('/v1/refunds/')) return Response.json(refunds.get(decodeURIComponent(url.pathname.split('/').at(-1))) ?? {})
    if (url.pathname === '/v1/balance') return Response.json({ object: 'balance', livemode })
    if (url.pathname === '/v1/checkout/sessions') {
      const form = Object.fromEntries(new URLSearchParams(await request.text())), n = sessions.length + 1
      const intentId = `synthetic-glove-intent-${n}`
      const pi = { id: intentId, metadata: { glove_payment_id: form['metadata[glove_payment_id]'], glove_connection_id: form['payment_intent_data[metadata][glove_connection_id]'] }, amount: Number(form['line_items[0][price_data][unit_amount]']) + Number(form['line_items[1][price_data][unit_amount]'] ?? 0), currency: form['line_items[0][price_data][currency]'], amount_received: 0, status: 'requires_payment_method', livemode: false, latest_charge: null }
      intents.set(intentId, pi)
      sessions.push({ form, intentId })
      return Response.json({ livemode, id: `synthetic-glove-session-${n}`, url: `https://checkout.stripe.com/c/pay/synthetic-glove-${n}` })
    }
    return Response.json(intents.get(decodeURIComponent(url.pathname.split('/').at(-1))) ?? {}, { status: 200 })
  } }
}
