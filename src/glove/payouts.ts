import { cents, dollars } from './money'
import { fail, type State, type Row } from './model'
import { stripeRequest, paidCents, paymentCashCents } from './payments'

export const providerId = (value: unknown) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value) ? value : fail('INPUT', 'Use a provider reference of at most 200 letters, digits, underscores or hyphens.', null, 400)
export async function payoutSnapshot(key: string, id: string, s: State) {
  const payout = await stripeRequest(key, `payouts/${providerId(id)}?expand[]=balance_transaction`)
  if (payout.id !== id || payout.livemode !== false || payout.currency !== 'usd' || !Number.isSafeInteger(payout.amount) || payout.amount <= 0 || !['paid', 'pending', 'in_transit', 'failed', 'canceled'].includes(payout.status)) fail('PAYOUT_PROVIDER', 'Stripe did not confirm a USD test payout.')
  // Stripe's payout filter is for automatic payouts. For instant/manual payouts,
  // inspect the actual payout debit; never invent source-payment membership.
  if (payout.automatic !== true) {
    const request = s.payouts.find(p => p.providerId === payout.id && ['instantRequest', 'manualAllocation'].includes(p.kind))
    const tx = payout.balance_transaction
    if (!['instant', 'standard'].includes(payout.method) || !tx || typeof tx !== 'object' || tx.currency !== 'usd' || tx.type !== 'payout' || tx.amount !== -payout.amount || !Number.isSafeInteger(tx.fee) || tx.fee < 0 || tx.net !== tx.amount - tx.fee) fail('PAYOUT_PROVIDER', 'Manual payout debit or its Glove confirmation is unavailable; no source membership is inferred.')
    if (!request) return { providerId: payout.id, provider: 'Stripe', mode: 'test', currency: 'USD', method: payout.method, providerStatus: payout.status, amount: dollars(payout.amount), payoutFee: dollars(tx.fee), net: dollars(-tx.net), difference: '0.00', items: [], unmatched: [{ id: payout.id + ':allocation', type: 'manual payout', paymentId: null, providerReference: payout.id, amountCents: tx.amount, feeCents: tx.fee, netCents: tx.net, reason: 'source allocation not reviewed' }], reconciled: false, sourceMembership: 'Stripe does not attribute source payments to manual payouts. The owner must review the books allocation.' }
    const sources = (request!.sourcePaymentIds ?? []).map((id: string) => s.payments.find(p => p.id === id))
    const sourceNet = sources.reduce((n: number, p: Row | undefined) => n + (p ? paymentCashCents(p) - cents(p.fee ?? '0.00', 'fee') : 0), 0)
    const matches = sources.length > 0 && sources.every((p: Row | undefined) => p?.status === 'paid' && p.payoutAllocationId === request!.id) && sourceNet === payout.amount + tx.fee && request!.expectedFee === dollars(tx.fee) && request!.amount === dollars(payout.amount)
    const item = { id: tx.id, type: 'manual payout debit', paymentId: null, providerReference: payout.id, amountCents: tx.amount, feeCents: tx.fee, netCents: tx.net, reason: matches ? null : 'actual amount or fee differs from confirmed preview' }
    return { providerId: payout.id, provider: 'Stripe', mode: 'test', currency: 'USD', method: payout.method, providerStatus: payout.status, amount: dollars(payout.amount), payoutFee: dollars(tx.fee), net: dollars(-tx.net), difference: dollars(-tx.net - payout.amount - cents(request!.expectedFee, 'expected fee')), items: [item, ...sources.filter((p: Row | undefined): p is Row => !!p).map((p: Row) => ({ id: p.id, type: 'owner-allocated source', paymentId: p.id, providerReference: p.providerReference, amountCents: paymentCashCents(p), feeCents: cents(p.fee ?? '0.00', 'fee'), netCents: paymentCashCents(p) - cents(p.fee ?? '0.00', 'fee'), reason: null }))], unmatched: matches ? [] : [item], reconciled: payout.status === 'paid' && matches, sourceMembership: 'Stripe does not attribute source payments to manual Instant Payouts; the owner explicitly allocates source payments/refunds in the books, and this record reconciles that allocation with the actual debit and fee.' }
  }
  const transactions: any[] = [], seen = new Set<string>()
  let after = ''
  for (let page = 0; page < 10; page++) {
    const list = await stripeRequest(key, `balance_transactions?payout=${encodeURIComponent(id)}&limit=100&expand[]=data.source${after ? `&starting_after=${encodeURIComponent(after)}` : ''}`)
    if (!Array.isArray(list.data) || typeof list.has_more !== 'boolean') fail('PAYOUT_PROVIDER', 'Stripe transaction list is incomplete.')
    for (const t of list.data) {
      if (typeof t.id !== 'string' || seen.has(t.id) || ![t.amount, t.fee, t.net].every(Number.isSafeInteger) || t.fee < 0 || t.net !== t.amount - t.fee || t.currency !== payout.currency) fail('PAYOUT_PROVIDER', 'Stripe returned an inconsistent or repeated balance transaction.')
      seen.add(t.id); transactions.push(t)
    }
    if (!list.has_more) break
    if (!list.data.length || page === 9) fail('PAYOUT_LIMIT', 'More than 1,000 transactions or an incomplete page: nothing was marked reconciled.')
    after = list.data.at(-1).id
  }
  const rows = transactions.map(t => {
    const ref = typeof t.source === 'string' ? t.source : t.source?.id
    const p = s.payments.find(p => !p.erasedAt && p.connectionId === s.business[0]?.stripe?.connectionId && p.providerReference === ref && (t.type === 'refund' ? p.kind === 'refund' : !['refund', 'allocation', 'credit'].includes(p.kind)))
    const expected = p ? (t.type === 'refund' ? -1 : 1) * (cents(p.amount, 'payment') + cents(p.tip ?? '0.00', 'tip')) : null
    const reason = !['charge', 'payment', 'refund', 'stripe_fee'].includes(t.type) ? 'unsupported transaction type' : t.type === 'stripe_fee' ? null : !p ? `missing ${t.type === 'refund' ? 'refund' : 'payment'}` : p.status !== 'paid' ? 'payment or refund not confirmed' : p.currency !== 'USD' ? 'currency differs' : expected !== t.amount ? 'gross amount differs' : p.kind !== 'refund' && (p.fee === null || cents(p.fee, 'fee') !== t.fee) ? 'fee differs or is unavailable' : null
    return { id: t.id, type: t.type, paymentId: p?.id ?? null, providerReference: ref ?? null, amountCents: t.amount, feeCents: t.fee, netCents: t.net, reason }
  })
  const net = rows.reduce((n, r) => n + r.netCents, 0)
  const fee = payout.balance_transaction?.fee
  const payoutFee = Number.isSafeInteger(fee) && fee >= 0 ? fee : 0
  // A payout debits the bank amount plus its own fee from the available funds.
  const difference = net - payout.amount - payoutFee
  return { providerId: payout.id, provider: 'Stripe', mode: 'test', currency: 'USD', method: payout.method, providerStatus: payout.status, amount: dollars(payout.amount), payoutFee: dollars(payoutFee), net: dollars(net), difference: dollars(difference), items: rows, unmatched: rows.filter(r => r.reason), reconciled: payout.status === 'paid' && difference === 0 && rows.every(r => !r.reason) }
}
