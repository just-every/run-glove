import { business, event, fail, newId, put, type Context, type Row } from '../model'
import { cents, dollars } from '../money'
import { invoiceBalance } from '../balances'
import { qboRequest } from './client'

export async function pullPayment(c: Context, key: string, remoteId: string) {
  const connection = business(c.s).qbo, remote = (await qboRequest(connection, key, `payment/${remoteId}`)).Payment
  if (String(remote?.Id) !== remoteId || remote.CurrencyRef?.value && remote.CurrencyRef.value !== 'USD') fail('QBO_PAYMENT', 'QuickBooks returned an invalid USD payment.')
  const fingerprint = JSON.stringify({ customer: remote.CustomerRef?.value, total: remote.TotalAmt, lines: remote.Line })
  const prior = c.s.payments.find(r => r.qboImported?.remoteId === remoteId && r.qboImported.connectionId === connection.connectionId)
  if (prior) {
    if (prior.qboImported.fingerprint !== fingerprint) fail('QBO_PAYMENT_CHANGED', 'This imported payment changed in QuickBooks; review its existing allocations before replacing it.')
    event(c, { jobId: prior.jobId, subjectKind: 'payment', subjectId: prior.id, kind: 'qbo.paymentReplayed', summary: 'QuickBooks payment already imported; no balance changed', data: { remoteId } }); return prior
  }
  const customer = c.s.customers.find(r => !r.erasedAt && r.qbo?.remoteId === remote.CustomerRef?.value && r.qbo.connectionId === connection.connectionId) ?? fail('QBO_MAPPING', 'Map this payment’s parent customer first.')
  // A Glove-origin payment is never counted again when read back.
  const sent = c.s.payments.find(r => r.qboSync?.remoteId === remoteId && r.qboSync.connectionId === connection.connectionId)
  if (sent) { event(c, { jobId: sent.jobId, subjectKind: 'payment', subjectId: sent.id, kind: 'qbo.paymentReplayed', summary: 'QuickBooks echoed an already recorded payment', data: { remoteId } }); return sent }
  const effects: { at: string; invoiceId: string; amountCents: number; tipCents: number; taxTotalAmount: string; taxBreakdown: any[] }[] = []
  for (const line of remote.Line ?? []) {
    if (line.LinkedTxn?.length !== 1 || line.LinkedTxn[0].TxnType !== 'Invoice') fail('QBO_PAYMENT', 'Every payment line must apply to exactly one mapped invoice.')
    const invoice = c.s.invoices.find(r => !r.erasedAt && r.customerId === customer.id && r.qboSync?.remoteId === line.LinkedTxn[0].TxnId && r.qboSync.connectionId === connection.connectionId) ?? fail('QBO_MAPPING', 'Every payment allocation needs this parent’s mapped invoice.')
    const amount = cents(String(line.Amount), 'payment allocation'), previous = effects.filter(e => e.invoiceId === invoice.id).reduce((n, e) => n + e.amountCents, 0)
    if (amount <= 0 || amount + previous > (invoiceBalance(c.s, invoice) ?? 0)) fail('QBO_PAYMENT', 'A QuickBooks payment allocation exceeds the unpaid invoice balance.')
    const rev = invoice.revisions.findLast((r: Row) => r.approval)
    effects.push({ at: c.now, invoiceId: invoice.id, amountCents: amount, tipCents: 0, taxTotalAmount: rev.totals.total, taxBreakdown: structuredClone(rev.totals.taxBreakdown ?? []) })
  }
  const amount = effects.reduce((n, e) => n + e.amountCents, 0)
  if (!amount || amount !== cents(String(remote.TotalAmt), 'payment total') || Number(remote.UnappliedAmt ?? 0) !== 0) fail('QBO_PAYMENT', 'The payment total must exactly match its invoice allocations.')
  const first = c.s.invoices.find(r => r.id === effects[0].invoiceId)!
  const row = put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, confirmedAt: c.now, invoiceId: first.id, invoiceNumber: first.number, customerId: customer.id, jobId: first.jobId, branchId: first.branchId ?? null, amount: dollars(amount), currency: 'USD', tip: '0.00', fee: '0.00', method: 'QuickBooks', kind: 'payment', status: 'paid', effects, providerReference: remoteId, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, qboImported: { remoteId, connectionId: connection.connectionId, fingerprint } })
  event(c, { jobId: first.jobId, subjectKind: 'payment', subjectId: row.id, kind: 'qbo.paymentImported', summary: `QuickBooks payment ${remoteId} applied to ${effects.length} invoice allocations`, data: { remoteId, effects } }); return row
}
