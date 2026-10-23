import { allow } from '../access'
import { business, bump, event, expectVersion, fail, find, newId, put, text } from '../model'
import { cents, dollars } from '../money'
import { stripeKey, stripeRequest, paidCents, paymentCashCents } from '../payments'
import { payoutSnapshot, providerId } from '../payouts'
import type { Handler } from './types'

export const payouts: Handler = async (c, type, p, db) => {
  if (!['payout.reconcile', 'payout.allocate', 'payment.depositBatch', 'payout.feeSchedule'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.token) fail('FORBIDDEN', 'A signed-in person reviews deposits and payouts.', null, 403)
  if (type === 'payout.feeSchedule') {
    const b = business(c.s); expectVersion(b, p.version)
    if (c.actor.role !== 'owner' || c.actor.branch) fail('FORBIDDEN', 'Only the unscoped owner records the Stripe Instant Payout fee schedule.', null, 403)
    if (!Number.isInteger(p.basisPoints) || p.basisPoints < 0 || p.basisPoints > 10000) fail('INPUT', 'Fee basisPoints is a whole number from 0 to 10000.', null, 400)
    const policy = { basisPoints: p.basisPoints, minimum: dollars(cents(p.minimum, 'minimum fee')), source: text(p.source, 'provider fee schedule source', { max: 200 }), recordedAt: c.now }
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'payout.feeScheduleRecorded', summary: 'Owner recorded an Instant Payout fee schedule; Glove has not verified the pricing with Stripe', data: policy })
    return bump(c.s, 'business', b, { payoutFeeSchedule: policy })
  }
  if (type === 'payment.depositBatch') {
    if (!Array.isArray(p.paymentIds) || !p.paymentIds.length || p.paymentIds.length > 100 || new Set(p.paymentIds).size !== p.paymentIds.length) fail('INPUT', 'Choose 1–100 distinct cash/check payments.', null, 400)
    const payments = p.paymentIds.map((id: unknown) => find(c.s, 'payments', id))
    if (payments.some((x: any) => x.status !== 'paid' || !['cash', 'check'].includes(x.method) || x.kind === 'refund' || x.depositBatchId)) fail('DEPOSIT_BATCH', 'Each selected cash/check payment must be confirmed and not already deposited.')
    if (new Set(payments.map((x: any) => x.currency)).size !== 1 || new Set(payments.map((x: any) => x.branchId ?? null)).size !== 1) fail('DEPOSIT_BATCH', 'A batch has one currency and branch.')
    const row = put(c.s, 'payouts', { id: newId(), version: 1, createdAt: c.now, kind: 'depositBatch', branchId: payments[0].branchId ?? null, currency: payments[0].currency, paymentIds: payments.map((x: any) => x.id), amount: dollars(payments.reduce((n: number, x: any) => n + cents(x.amount, 'amount') - c.s.payments.filter(r => r.kind === 'refund' && r.paymentId === x.id && r.status === 'paid').reduce((a, r) => a + cents(r.amount, 'refund'), 0), 0)), reference: text(p.reference, 'bank deposit reference', { max: 200 }), by: { id: c.actor.id, name: c.actor.name }, status: 'staff-recorded' })
    for (const payment of payments) bump(c.s, 'payments', payment, { depositBatchId: row.id })
    event(c, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.depositBatchRecorded', summary: `Cash/check deposit batch $${row.amount} recorded; no bank confirmation is claimed`, data: { batchId: row.id, paymentIds: row.paymentIds, amount: row.amount, reference: row.reference } })
    return row
  }
  if (c.actor.role !== 'owner' || c.actor.branch) fail('FORBIDDEN', 'Only the unscoped owner reconciles provider-wide payouts.', null, 403)
  const key = await stripeKey(db)
  if (!key || !business(c.s).stripe) fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
  const id = providerId(p.providerId)
  if (type === 'payout.allocate') {
    const provider = await stripeRequest(key!, `payouts/${id}?expand[]=balance_transaction`), tx = provider.balance_transaction
    if (provider.id !== id || provider.livemode !== false || provider.automatic !== false || provider.currency !== 'usd' || !Number.isSafeInteger(provider.amount) || !tx || !Number.isSafeInteger(tx.fee) || tx.fee < 0) fail('PAYOUT_PROVIDER', 'Only a confirmed USD manual test payout takes an owner-reviewed source allocation.')
    if (!Array.isArray(p.paymentIds) || !p.paymentIds.length || p.paymentIds.length > 100 || new Set(p.paymentIds).size !== p.paymentIds.length) fail('PAYOUT_ALLOCATION', 'Select 1–100 distinct confirmed source payments/refunds.')
    const sources = p.paymentIds.map((id: unknown) => find(c.s, 'payments', id))
    if (sources.some((x: any) => x.status !== 'paid' || x.fee === null || x.fee === undefined || x.connectionId !== business(c.s).stripe.connectionId || x.currency !== 'USD' || x.payoutAllocationId || c.s.payouts.some(r => r.reconciled && r.items?.some((i: any) => i.paymentId === x.id)))) fail('PAYOUT_ALLOCATION', 'Sources must be confirmed in this account and not used in another payout.')
    const sourceNet = sources.reduce((n: number, x: any) => n + paymentCashCents(x) - cents(x.fee, 'fee'), 0)
    if (sourceNet !== provider.amount + tx.fee) fail('PAYOUT_ALLOCATION', 'Source net must equal the actual bank payout plus payout fee.')
    const old = c.s.payouts.find(r => r.providerId === id && r.connectionId === business(c.s).stripe.connectionId)
    if (old?.sourcePaymentIds?.length) fail('PAYOUT_ALLOCATION', 'This payout already has a reviewed allocation.')
    const data = { kind: 'manualAllocation', providerId: id, connectionId: business(c.s).stripe.connectionId, sourcePaymentIds: sources.map((x: any) => x.id), amount: dollars(provider.amount), expectedFee: dollars(tx.fee), sourceNet: dollars(sourceNet), sourceBasis: 'Owner-reviewed books allocation; not a Stripe source attribution' }
    const allocation = old ? bump(c.s, 'payouts', old, data) : put(c.s, 'payouts', { id: newId(), version: 1, createdAt: c.now, ...data })
    for (const source of sources) bump(c.s, 'payments', source, { payoutAllocationId: allocation.id })
    const snapshot = await payoutSnapshot(key!, id, c.s)
    const row = bump(c.s, 'payouts', allocation, { ...snapshot, inspectedAt: c.now })
    event(c, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.sourcesAllocated', summary: 'Owner explicitly reviewed manual payout sources for the books; Stripe supplies only the actual debit and fee', data: { payoutId: row.id, provider: 'Stripe', providerReference: id, sourcePaymentIds: row.sourcePaymentIds, sourceNet: row.sourceNet, reconciled: row.reconciled } })
    return row
  }
  const snapshot = await payoutSnapshot(key!, id, c.s)
  const old = c.s.payouts.find(r => r.providerId === id && r.connectionId === business(c.s).stripe.connectionId)
  if (old?.expectedFee && snapshot.payoutFee !== old.expectedFee) { snapshot.reconciled = false; snapshot.unmatched.push({ id: id + ':fee', type: 'payout fee', paymentId: null, providerReference: id, amountCents: 0, feeCents: cents(snapshot.payoutFee, 'fee'), netCents: 0, reason: 'actual payout fee differs from confirmed preview' }) }
  const row = old ? bump(c.s, 'payouts', old, { ...snapshot, inspectedAt: c.now }) : put(c.s, 'payouts', { id: newId(), version: 1, createdAt: c.now, kind: 'stripe', ...snapshot, connectionId: business(c.s).stripe.connectionId, inspectedAt: c.now })
  event(c, { jobId: null, subjectKind: 'payout', subjectId: row.id, kind: 'payout.reconciled', summary: `Stripe test payout inspected: ${row.reconciled ? 'reconciled to the cent' : 'unmatched or not paid'}`, data: { payoutId: row.id, provider: 'Stripe', providerReference: id, amount: row.amount, fee: row.payoutFee, difference: row.difference, unmatched: row.unmatched, reconciled: row.reconciled } })
  return row
}
