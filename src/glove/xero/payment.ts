import { business, fail, find, type Context, type Row } from '../model'
import { cents } from '../money'
import { branchZone } from '../branches'
import { localParts } from '../time'
import { xeroRead } from './client'
import { xeroMapping, xeroMatches } from './payload'

/** Record an already received payment in the books; never request a customer charge. */
export async function xeroPaymentPayload(c: Context, row: Row, bankAccountId: unknown, secret: { token: string; tenant: string }, verifyAccount: boolean) {
  if (row.status !== 'paid' || row.kind && row.kind !== 'payment' || row.currency !== 'USD' || row.xeroImported || cents(row.tip ?? '0.00', 'tip')) fail('XERO_PAYMENT', 'Choose a confirmed USD receipt without a tip; imported receipts, credits and refunds are not outbound payments.')
  const effects = row.effects ?? []
  if (effects.length !== 1 || !Number.isSafeInteger(effects[0].amountCents) || effects[0].amountCents <= 0 || effects[0].amountCents !== cents(row.amount, 'payment amount') || effects[0].tipCents) fail('XERO_PAYMENT', 'This payment must have one exact positive invoice allocation; grouped receipts require separate accounting review.')
  const invoice = find(c.s, 'invoices', effects[0].invoiceId ?? row.invoiceId)
  const customer = find(c.s, 'customers', row.customerId), contact = xeroMapping(c, customer)
  const connectionId = business(c.s).xeroInspection.connectionId
  const link = invoice.xeroSync?.phase === 'complete' ? invoice.xeroSync : invoice.xero
  if (invoice.erasedAt || customer.erasedAt || invoice.customerId !== customer.id || (invoice.branchId ?? null) !== (row.branchId ?? null) || (customer.branchId ?? null) !== (row.branchId ?? null) || !link?.remoteId || link.connectionId !== connectionId || !invoice.revisions?.findLast((r: Row) => r.approval)) fail('XERO_MAPPING', 'Review this customer and its approved invoice in the current Xero company before recording payment.')
  if (typeof bankAccountId !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(bankAccountId)) fail('XERO_MAPPING', 'Explicitly choose an existing USD Xero payment account.')
  if (verifyAccount) {
    const account = (await xeroRead(secret, 'Accounts', true)).find((a: Row) => a.AccountID === bankAccountId)
    if (!account || account.Status !== 'ACTIVE' || account.CurrencyCode !== 'USD' || account.Type !== 'BANK' && account.EnablePaymentsToAccount !== true) fail('XERO_MAPPING', 'Choose an active USD bank account or an account enabled for payments.')
  }
  return { resource: 'Payments', identity: 'PaymentID', body: { Invoice: { InvoiceID: link.remoteId }, Account: { AccountID: bankAccountId }, Date: localParts(row.confirmedAt, branchZone(c.s, row)).date, Amount: effects[0].amountCents / 100, Reference: row.reference || row.providerReference || row.id, IsReconciled: false }, contactId: contact.remoteId }
}

export function xeroPaymentMatches(body: any, remote: any) {
  // Bank reconciliation may happen later; it is a provider fact, not part of receipt identity.
  const { IsReconciled: _reconciled, ...expected } = body
  return xeroMatches(expected, remote) && remote.Status === 'AUTHORISED' && remote.PaymentType === 'ACCRECPAYMENT'
}
