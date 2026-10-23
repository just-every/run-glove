import { authority, allow } from './access'
import { load, commit } from './storage'
import { business, bump, event, expectVersion, fail, find, newId, put, type Context, type Actor, type Row } from './model'
import { cents, dollars } from './money'
import { sha256, canonicalJson } from '../modules/import-kit/src/d1/index'
import { stripeRequest, stripeKey, paidCents, paymentCashCents } from './payments'
import { providerId } from './payouts'
import { providerEvent } from './timeline'
import type { Handler } from './commands/types'

async function eligible(key: string, destination: string, debit: number) {
  const account = await stripeRequest(key, 'account')
  const cards = await stripeRequest(key, `accounts/${providerId(account.id)}/external_accounts?object=card&limit=100`)
  const card = cards.data?.find((x: any) => x.id === destination && x.object === 'card' && x.funding === 'debit' && x.currency === 'usd' && x.status !== 'errored' && x.available_payout_methods?.includes('instant'))
  if (!card) fail('PAYOUT_ELIGIBILITY', 'Stripe does not list this debit card as eligible for Instant Payouts.')
  const balance = await stripeRequest(key, 'balance')
  if (balance.livemode !== false || !balance.instant_available?.some((b: any) => b.currency === 'usd' && Number.isSafeInteger(b.amount) && b.amount >= debit)) fail('PAYOUT_ELIGIBILITY', 'Stripe test mode does not show enough funds available for an instant payout and its fee.')
}
export const instantPayouts: Handler = async (c, type, p, db) => {
  if (!['payout.instantPreview', 'payout.instantConfirm'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.token || c.actor.branch || c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the signed-in unscoped owner requests an Instant Payout.', null, 403)
  const b = business(c.s), key = await stripeKey(db)
  if (!b.stripe || !key) fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
  if (type === 'payout.instantPreview') {
    const policy = b.payoutFeeSchedule
    if (!policy) fail('PAYOUT_FEE', 'Record your account-specific Stripe fee schedule first; no default or verified fee is invented.')
    const amount = cents(p.amount, 'payout amount'); if (amount <= 0) fail('AMOUNT', 'Payout amount must be positive.')
    const fee = Math.max(cents(policy.minimum, 'minimum fee'), Number((BigInt(amount) * BigInt(policy.basisPoints) + 5000n) / 10000n))
    if (!Array.isArray(p.paymentIds) || !p.paymentIds.length || p.paymentIds.length > 100 || new Set(p.paymentIds).size !== p.paymentIds.length) fail('PAYOUT_ALLOCATION', 'Select 1–100 distinct confirmed Stripe payments/refunds for the owner-reviewed books allocation.')
    const sourcePayments = p.paymentIds.map((id: unknown) => find(c.s, 'payments', id))
    if (sourcePayments.some((x: Row) => x.status !== 'paid' || x.fee === null || x.fee === undefined || x.connectionId !== b.stripe.connectionId || x.currency !== 'USD' || !x.providerReference || x.payoutAllocationId || c.s.payouts.some(r => r.reconciled && r.items?.some((i: Row) => i.paymentId === x.id)))) fail('PAYOUT_ALLOCATION', 'Sources must be confirmed in this test account and not assigned to another payout.')
    const sourceNet = sourcePayments.reduce((n: number, x: Row) => n + paymentCashCents(x) - cents(x.fee ?? '0.00', 'fee'), 0)
    if (sourceNet !== amount + fee) fail('PAYOUT_ALLOCATION', 'Selected source net must equal the bank amount plus the displayed Instant Payout fee.')
    const destination = providerId(p.destination)
    await eligible(key!, destination, amount + fee)
    const row = put(c.s, 'payouts', { id: newId(), version: 1, kind: 'instantRequest', createdAt: c.now, expiresAt: new Date(Date.parse(c.now) + 600000).toISOString(), connectionId: b.stripe.connectionId, currency: 'USD', sourcePaymentIds: sourcePayments.map((x: Row) => x.id), sourceNet: dollars(sourceNet), sourceBasis: 'Owner-reviewed books allocation; Stripe does not attribute source payments to manual payouts', amount: dollars(amount), expectedFee: dollars(fee), destination, feeSource: 'Owner-recorded Stripe account fee schedule; not verified by Glove', feePolicyHash: sha256(canonicalJson(policy)), status: 'preview' })
    event(c, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.instantPreviewed', summary: `Owner reviewed a test Instant Payout of $${row.amount}, expected fee $${row.expectedFee}; nothing sent`, data: { payoutId: row.id, amount: row.amount, expectedFee: row.expectedFee, feeSource: row.feeSource } })
    return row
  }
  const row = find(c.s, 'payouts', p.payoutId); expectVersion(row, p.version)
  if (row.kind !== 'instantRequest' || row.status !== 'preview' || row.expiresAt <= c.now || row.connectionId !== b.stripe.connectionId || row.feePolicyHash !== sha256(canonicalJson(b.payoutFeeSchedule))) fail('PAYOUT_STATE', 'Preview changed or expired. Review a new fee preview.')
  if (p.confirmAmount !== row.amount || p.confirmFee !== row.expectedFee) fail('CONSENT', 'Explicitly confirm the displayed amount and expected fee.', null, 400)
  const sources = row.sourcePaymentIds.map((id: string) => find(c.s, 'payments', id))
  if (sources.some((x: Row) => x.status !== 'paid' || x.payoutAllocationId || x.connectionId !== b.stripe.connectionId || c.s.payouts.some(r => r.reconciled && r.items?.some((i: Row) => i.paymentId === x.id)))) fail('PAYOUT_ALLOCATION', 'Sources changed or were allocated elsewhere; review a new preview.')
  const netNow = sources.reduce((n: number, x: Row) => n + paymentCashCents(x) - cents(x.fee ?? '0.00', 'fee'), 0)
  if (netNow !== cents(row.sourceNet, 'source net')) fail('PAYOUT_ALLOCATION', 'Source net changed; review a new preview.')
  await eligible(key!, row.destination, cents(row.amount, 'amount') + cents(row.expectedFee, 'fee'))
  const reserved = bump(c.s, 'payouts', row, { status: 'reserved', confirmedBy: { id: c.actor.id, name: c.actor.name }, confirmedAt: c.now })
  for (const payment of sources) bump(c.s, 'payments', payment, { payoutAllocationId: row.id })
  c.payoutId = row.id
  event(c, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.instantRequested', summary: `Owner explicitly confirmed test Instant Payout $${row.amount} and expected fee $${row.expectedFee}; provider outcome pending`, data: { payoutId: row.id, amount: row.amount, expectedFee: row.expectedFee } })
  return reserved
}
export async function instantAfterCommit(db: D1Database, c: Context, result: any) {
  const row = c.s.payouts.find(r => r.id === c.payoutId)!, a = authority(c.actor)
  const key = await db.prepare(`SELECT value FROM glove_provider_keys WHERE provider='stripe-payments' AND (${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.stripe.connectionId')=?)`).bind(...a.params, row.connectionId).first<{value:string}>()
  if (!key) return result
  try {
    const response = await stripeRequest(key.value, 'payouts', new URLSearchParams({ amount: String(cents(row.amount, 'amount')), currency: 'usd', method: 'instant', destination: row.destination, 'metadata[glove_payout_id]': row.id }), `glove-payout-${row.id}`)
    if (typeof response.id !== 'string' || response.livemode !== false || response.currency !== 'usd' || response.amount !== cents(row.amount, 'amount') || response.method !== 'instant' || response.destination !== row.destination || !['pending', 'in_transit', 'paid', 'failed', 'canceled'].includes(response.status)) throw Error('Unconfirmed payout')
    for (let retry = 0; retry < 6; retry++) {
      const before = await load(db), current = before.payouts.find(r => r.id === row.id)
      if (!current || current.providerId || current.connectionId !== before.business[0]?.stripe?.connectionId) return current ?? result
      const actor: Actor = { id: 'provider:Stripe', name: 'Stripe', role: 'owner', sessionId: '', operatorVersion: 0, paymentProvider: row.connectionId }
      const next: Context = { s: structuredClone(before), actor, commandId: `payout-result:${row.id}`, now: new Date().toISOString(), events: [], files: [], sql: [] }
      const saved = bump(next.s, 'payouts', current, { providerId: response.id, status: response.status })
      event(next, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.instantProviderOutcome', summary: `Stripe test Instant Payout reports ${response.status}; reconcile its actual fee before considering it matched`, data: { payoutId: row.id, provider: 'Stripe', providerReference: response.id, status: response.status } }); next.events[0].actor.role = 'provider' as any
      try { await commit(db, next, before, 'payout.providerOutcome', sha256(row.id), saved); return saved } catch (error) { if ((await load(db)).version !== before.version) continue; throw error }
    }
  } catch { /* Reservation survives uncertainty; replay never repeats the outbound request. */ }
  await providerEvent(db, { id: `${row.id}:payout-unknown`, at: c.now, commandId: c.commandId, provider: 'Stripe', jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.instantUnconfirmed', summary: 'Instant Payout outcome unknown; inspect Stripe before another request', data: { payoutId: row.id } }).run()
  return result
}
