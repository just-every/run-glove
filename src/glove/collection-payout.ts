import { cents, dollars } from './money'
import { paymentCashCents } from './payments'
import { business, fail, find, type Context, type Row } from './model'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'

/** Inspect retained facts only: a missing transport outcome is never proof of a missing bank entry. */
export function payoutComparison(c: Context, payout: Row) {
  if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token) fail('FORBIDDEN', 'Only a signed-in Owner without branch limits inspects provider-wide payout comparisons.', null, 403)
  const b = business(c.s)
  if (payout.kind !== 'depositBatch' && payout.connectionId !== b.stripe?.connectionId) fail('RECONCILIATION_STATE', 'Inspect a payout from the current Stripe connection.')
  const ids = [...new Set<string>(payout.kind === 'depositBatch' ? payout.paymentIds : (payout.items ?? []).map((r: Row) => r.paymentId).filter(Boolean))]
  const sources = ids.map(id => find(c.s, 'payments', id))
  if (sources.some(r => r.erasedAt)) fail('RECONCILIATION_STATE', 'Personal source details were erased; inspect the anonymous bank history separately.')
  const issues: { kind: string; reference: string; reason: string }[] = []
  const add = (kind: string, reference: string, reason: string) => issues.push({ kind, reference, reason })
  let sourceNet = 0
  for (const payment of sources) {
    if (payment.status !== 'paid' || payment.currency !== payout.currency) add('source', payment.id, 'Source is not a confirmed payment in the payout currency.')
    const refunds = payout.kind === 'depositBatch' ? c.s.payments.filter(r => r.kind === 'refund' && r.paymentId === payment.id && r.status === 'paid') : []
    const fee = payment.fee
    if (payout.kind !== 'depositBatch' && (fee === undefined || fee === null)) add('fee', payment.id, 'Current source fee is unavailable; no zero fee is inferred.')
    sourceNet += paymentCashCents(payment) - cents(fee ?? '0.00', 'fee') - refunds.reduce((n, r) => n + cents(r.amount, 'refund'), 0)
    const sync = payment.qboSync, imported = payment.qboImported
    if (!b.qbo || !(sync?.connectionId === b.qbo.connectionId && sync.phase === 'complete' || imported?.connectionId === b.qbo.connectionId)) add('books', payment.id, ['reserved', 'sending', 'unknown'].includes(sync?.phase) ? 'Inspect the uncertain books operation; do not resend.' : 'No confirmed payment posting is retained for the current books connection; inspect before proposing a post.')
    for (const effect of payment.effects ?? []) {
      const invoice = c.s.invoices.find(r => r.id === (effect.invoiceId ?? payment.invoiceId))
      if (!invoice || invoice.qboSync?.connectionId !== b.qbo?.connectionId || invoice.qboSync?.phase !== 'complete') add('invoice', effect.invoiceId ?? payment.invoiceId, 'The allocated invoice has no confirmed posting in the current books connection.')
    }
    if (payout.kind !== 'depositBatch') {
      const item = payout.items?.find((r: Row) => r.paymentId === payment.id)
      if (item && (item.amountCents !== paymentCashCents(payment) || item.feeCents !== cents(fee ?? '0.00', 'fee'))) add('sourceChanged', payment.id, 'Current gross or fee differs from the retained provider snapshot; refresh it before any decision.')
    }
  }
  const expected = cents(payout.amount, 'payout amount') + cents(payout.payoutFee ?? '0.00', 'payout fee')
  if (sourceNet !== expected) add('total', payout.id, 'Current source net does not equal the recorded bank amount plus payout fee.')
  for (const item of payout.unmatched ?? []) add('provider', payout.id, item.reason ?? 'Provider source remains unmatched.')
  if (payout.kind !== 'depositBatch' && payout.providerStatus !== 'paid') add('status', payout.id, 'The provider has not confirmed a paid payout.')
  // No deposit or fee transport exists today: explicitly propose inspection, never assert it is absent at the provider.
  add('deposit', payout.id, 'No provider-confirmed deposit posting is retained; inspect the bank and books manually. This is not proof of a missing deposit.')
  if (payout.kind !== 'depositBatch') add('feePosting', payout.id, 'Fee totals are retained payout facts, not confirmed accounting fee postings; inspect the books before any adjustment.')
  return { sourcePaymentIds: ids, fingerprint: sha256(canonicalJson({ payout, sources, invoices: sources.flatMap(p => (p.effects ?? []).map((e: Row) => c.s.invoices.find(i => i.id === (e.invoiceId ?? p.invoiceId)))), connectionId: b.qbo?.connectionId ?? null })), sourceNet: dollars(sourceNet), expectedNet: dollars(expected), difference: dollars(sourceNet - expected), issues, basis: 'Retained provider snapshot and current Glove records only; no fresh bank or books read, posting, credit, refund or transfer.' }
}
