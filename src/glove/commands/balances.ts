import { allow } from '../access'
import { business, bump, event, expectVersion, fail, find, newId, oneOf, put, text } from '../model'
import { cents, dollars } from '../money'
import { invoiceBalance } from '../balances'
import { paidCents } from '../payments'
const totalForTax = (inv: any) => inv.revisions.findLast((r: any) => r.approval)?.totals.total ?? inv.openingBalance?.amount
import type { Handler } from './types'

export const balanceCommands: Handler = async (c, type, p, db) => {
  if (!['payment.record', 'payment.credit', 'payment.allocate', 'payment.refund', 'payment.refundRefresh'].includes(type)) return undefined
  allow(c.actor, type)
  if (['payment.refund', 'payment.refundRefresh', 'payment.credit'].includes(type) && c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the owner refunds or grants a credit.', null, 403)
  if (c.actor.token) fail('FORBIDDEN', 'A signed-in person records or refunds money.', null, 403)
  if (type === 'payment.refundRefresh') {
    const row = find(c.s, 'payments', p.refundId); expectVersion(row, p.version)
    if (row.kind !== 'refund' || !row.providerReference || row.status === 'paid') fail('REFUND_STATE', 'Choose a pending provider refund with a retained reference.')
    c.refundId = row.id; c.refundRefresh = true
    event(c, { jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: 'refund.refreshRequested', summary: 'Owner requested the current Stripe refund status; no new refund is sent', data: { refundId: row.id } })
    return row
  }
  const held = type === 'payment.refund' && p.invoiceId === undefined ? find(c.s, 'payments', p.paymentId) : null
  const job = held && find(c.s, 'jobs', held.jobId)
  if (held && (!['deposit', 'financing'].includes(held.kind) || held.invoiceId || !job)) fail('REFUND_STATE', 'Choose a job-held deposit or funded financing payment without an invoice.')
  const inv = held ? { id: null as any, version: job!.version, number: held.invoiceNumber, customerId: held.customerId, jobId: held.jobId, branchId: held.branchId, revisions: [{ approval: true, totals: job!.totals }] } : find(c.s, 'invoices', p.invoiceId); expectVersion(inv, p.version)
  const net = invoiceBalance(c.s, inv)
  if (net === null) fail('INVOICE_STATE', 'Choose an approved invoice or retained opening balance.')
  const currency = inv.revisions.findLast((r: any) => r.approval)?.totals.currency ?? inv.revisions.at(-1).totals.currency ?? business(c.s).currency
  const amount = cents(p.amount, 'amount'), refundTip = type === 'payment.refund' ? cents(p.tip ?? '0.00', 'refund tip') : 0
  if (amount <= 0 && refundTip <= 0) fail('AMOUNT', 'The payment or refund total must be positive.')
  const base = { id: newId(), version: 1, createdAt: c.now, invoiceId: inv.id, invoiceNumber: inv.number, customerId: inv.customerId, jobId: inv.jobId, branchId: inv.branchId ?? null, currency, amount: dollars(amount), tip: '0.00', technicianIds: [], fee: '0.00', by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } }
  const effect = (amountCents: number, invoiceId = inv.id) => ({ at: c.now, invoiceId, amountCents, tipCents: 0 })
  let row
  if (type === 'payment.record' || type === 'payment.credit') {
    const credit = type === 'payment.credit', method = credit ? 'credit' : oneOf(p.method, ['cash', 'check'] as const, 'method')
    row = put(c.s, 'payments', { ...base, kind: credit ? 'credit' : 'payment', method, taxTotalAmount: totalForTax(inv), taxBreakdown: credit ? [] : inv.revisions.findLast((r: any) => r.approval)?.totals.taxBreakdown ?? [], status: 'paid', confirmedAt: c.now, reference: text(p.reference, credit ? 'credit reason' : 'receipt or check reference', { max: 200 }), effects: [effect(amount)] })
  } else if (type === 'payment.allocate') {
    const source = find(c.s, 'invoices', p.sourceInvoiceId); expectVersion(source, p.sourceVersion)
    const sourceNet = invoiceBalance(c.s, source)
    const sourceCurrency = source.revisions.findLast((r: any) => r.approval)?.totals.currency ?? source.revisions.at(-1).totals.currency ?? business(c.s).currency
    if (source.id === inv.id || source.customerId !== inv.customerId || sourceCurrency !== currency || (source.branchId ?? null) !== (inv.branchId ?? null)) fail('ALLOCATION', 'Credit stays with the same customer, currency and branch.')
    if (sourceNet === null || amount > -sourceNet || amount > net!) fail('AMOUNT', 'Allocate no more than the available credit and unpaid target balance.')
    row = put(c.s, 'payments', { ...base, amount: '0.00', allocatedAmount: dollars(amount), kind: 'allocation', sourceInvoiceId: source.id, method: 'credit transfer', status: 'paid', effects: [effect(-amount, source.id), effect(amount)] })
  } else {
    const original = find(c.s, 'payments', p.paymentId); expectVersion(original, p.paymentVersion)
    if (original.invoiceId !== inv.id || original.kind === 'refund' || original.kind === 'credit' || original.kind === 'allocation' || original.status !== 'paid') fail('REFUND_STATE', 'Choose a confirmed original payment on this invoice.')
    if (original.qboImported) fail('QBO_REFUND_STATE', 'This payment was entered in QuickBooks. Refund readback requires reviewed accounting reconciliation.')
    const reserved = c.s.payments.filter(r => r.paymentId === original.id && r.kind === 'refund' && r.status !== 'failed').reduce((n, r) => n + cents(r.amount, 'amount'), 0)
    if (amount > paidCents(original) - reserved) fail('AMOUNT', 'Refunds cannot exceed the original confirmed amount, including pending requests.')
    const reservedTips = c.s.payments.filter(r => r.paymentId === original.id && r.kind === 'refund' && r.status !== 'failed').reduce((n, r) => n + cents(r.tip ?? '0.00', 'refund tip'), 0)
    if (refundTip > cents(original.tip ?? '0.00', 'original tip') - reservedTips) fail('AMOUNT', 'Refund tips cannot exceed the unrefunded original tip.')
    const manual = ['cash', 'check'].includes(original.method)
    if (original.method === 'wisetack') {
      if (original.financeConnectionId !== business(c.s).wisetack?.connectionId || !(await db.prepare("SELECT 1 FROM glove_provider_keys WHERE provider='wisetack'").first())) fail('PAYMENT_SETUP', 'Reconnect the original Wisetack test account before requesting a refund.')
    } else if (!manual && (original.connectionId !== business(c.s).stripe?.connectionId || !(await db.prepare("SELECT 1 FROM glove_provider_keys WHERE provider='stripe-payments'").first()))) fail('PAYMENT_SETUP', 'Reconnect the original Stripe test account before requesting a refund.')
    row = put(c.s, 'payments', { ...base, kind: 'refund', tip: dollars(refundTip), technicianIds: original.technicianIds ?? [], method: original.method, paymentId: original.id, financeConnectionId: original.financeConnectionId ?? null, financeTransactionId: original.method === 'wisetack' ? original.providerReference : null, intentId: original.intentId, connectionId: original.connectionId ?? null, taxTotalAmount: original.taxTotalAmount ?? original.amount, taxBreakdown: original.taxBreakdown ?? [], reason: text(p.reason, 'reason', { max: 200 }), status: manual ? 'paid' : 'reserved', confirmedAt: manual ? c.now : null, effects: manual ? [{ ...effect(-amount), tipCents: -refundTip }] : [] })
    if (!manual) c.refundId = row.id
  }
  event(c, { jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: type === 'payment.refund' ? 'refund.requested' : type === 'payment.allocate' ? 'payment.allocated' : type === 'payment.credit' ? 'payment.credited' : 'payment.recorded', summary: `${c.actor.name}: ${type.slice(8)} $${dollars(amount)} on ${inv.number}; ${row.status === 'reserved' ? 'provider outcome not confirmed' : 'recorded'}`, data: { paymentId: row.id, originalPaymentId: row.paymentId ?? null, invoiceId: inv.id, amount: dollars(amount), tip: row.tip, method: row.method, status: row.status } })
  return row
}
