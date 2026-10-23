// Only Stripe's network boundary is replaced. Test credentials are synthetic.
export function stripePaymentsEdge() {
  const sessions = [], intents = new Map(), refunds = new Map(), payouts = new Map(), transactions = new Map(), calls = []
  let status = 200, livemode = false, refundStatus = 'succeeded'
  return { sessions, intents, refunds, payouts, transactions, calls, set refundStatus(value) { refundStatus = value }, set livemode(value) { livemode = value }, set status(value) { status = value }, async answer(request) {
    const url = new URL(request.url)
    if (url.hostname !== 'api.stripe.com' || !(url.pathname.startsWith('/v1/refunds') || url.pathname.startsWith('/v1/payouts') || url.pathname.startsWith('/v1/accounts/') || url.pathname === '/v1/account' || url.pathname === '/v1/balance_transactions' || url.pathname === '/v1/balance' || url.pathname === '/v1/checkout/sessions' || url.pathname.startsWith('/v1/payment_intents/'))) return null
    calls.push({ method: request.method, path: url.pathname, idempotencyKey: request.headers.get('idempotency-key') })
    if (status !== 200) return Response.json({ error: 'synthetic-glove-1' }, { status })
    if (url.pathname === '/v1/refunds') {
      const form = Object.fromEntries(new URLSearchParams(await request.text()))
      const id = `synthetic-glove-refund-${refunds.size + 1}`, pi = intents.get(form.payment_intent)
      const row = { id, payment_intent: pi.id, amount: Number(form.amount), currency: pi.currency, status: refundStatus, metadata: { glove_refund_id: form['metadata[glove_refund_id]'] } }
      refunds.set(id, row); return Response.json(row)
    }
    if (url.pathname.startsWith('/v1/refunds/')) return Response.json(refunds.get(decodeURIComponent(url.pathname.split('/').at(-1))) ?? {})
    if (url.pathname === '/v1/account') return Response.json({ id: 'synthetic-glove-account-1' })
    if (url.pathname.includes('/external_accounts')) return Response.json({ data: [{ id: 'synthetic-glove-debit-1', object: 'card', funding: 'debit', currency: 'usd', status: 'new', available_payout_methods: ['instant', 'standard'] }], has_more: false })
    if (url.pathname === '/v1/balance_transactions') return Response.json(transactions.get(url.searchParams.get('payout')) ?? { data: [], has_more: false })
    if (url.pathname === '/v1/payouts' && request.method === 'POST') {
      const form = Object.fromEntries(new URLSearchParams(await request.text())), amount = Number(form.amount), fee = Math.round(amount * 0.015)
      const id = `synthetic-glove-instant-${payouts.size + 1}`
      const row = { id, amount, currency: 'usd', method: 'instant', automatic: false, destination: form.destination, status: 'paid', livemode, balance_transaction: { id: id + '-debit', type: 'payout', amount: -amount, currency: 'usd', fee, net: -amount - fee } }
      payouts.set(id, row); return Response.json(row)
    }
    if (url.pathname.startsWith('/v1/payouts/')) return Response.json(payouts.get(url.pathname.split('/').at(-1)) ?? {})
    if (url.pathname === '/v1/balance') return Response.json({ object: 'balance', livemode, instant_available: [{ currency: 'usd', amount: 1000000 }] })
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
