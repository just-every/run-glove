import { branchZone } from './branches'
import { business, fail, find, text, type Row, type State } from './model'
import { localParts } from './time'
import type { Line } from './money'
import type { TaxContext } from './sales-tax'

export type QboMappings = { customerRef: string; itemRef: string; taxCodeRef: string }
const reference = (value: unknown, field: string) => ({ value: text(value, field, { max: 100 }) })
// QBO uses JSON decimal numbers. Refuse a conversion that cannot preserve the
// stored decimal; all business calculations happened in integer cents already.
function decimal(value: string, places: number) {
  const n = Number(value)
  const [whole, part = ''] = value.split('.')
  const expected = `${whole}.${part.padEnd(places, '0')}`
  if (!Number.isFinite(n) || n.toFixed(places) !== expected) fail('QUICKBOOKS_PRECISION', 'This amount cannot be represented exactly in the QuickBooks payload.', null, 400)
  return n
}

/**
 * A downloadable, explicitly mapped QBO US Invoice; this never posts or syncs.
 * Protocol: https://developer.intuit.com/docs/api/accounting/invoice
 * US line codes TAX/NON mark taxability; the mapped transaction code and
 * TotalTax retain the approved document's combined jurisdiction and tax.
 */
export function qboInvoice(s: State, invoice: Row, mappings: QboMappings) {
  const rev = [...invoice.revisions].reverse().find((r: Row) => r.approval)
  if (!rev) fail('NOT_APPROVED', 'Approve an invoice revision before preparing its QuickBooks payload.')
  const stored = rev.totals.taxContext as TaxContext | undefined
  if (!stored || rev.totals.currency !== 'USD') fail('QUICKBOOKS_CURRENCY', 'This inspection payload is for an approved USD sales-tax revision.', null, 400)
  const context = stored as TaxContext
  const customerRef = reference(mappings.customerRef, 'customerRef'), itemRef = reference(mappings.itemRef, 'itemRef'), taxCodeRef = reference(mappings.taxCodeRef, 'taxCodeRef')
  const job = find(s, 'jobs', invoice.jobId), customer = find(s, 'customers', invoice.customerId), b = business(s)
  const number = rev.corrects ? `${invoice.number}-R${rev.n}` : invoice.number
  if (number.length > 21) fail('QUICKBOOKS_NUMBER', 'This invoice number exceeds QuickBooks’ 21-character document number limit.', null, 400)
  const date = localParts(rev.approval.at, branchZone(s, job)).date
  const due = new Date(`${date}T00:00:00Z`)
  due.setUTCDate(due.getUTCDate() + b.paymentTermsDays)
  return {
    CustomerRef: customerRef, CurrencyRef: { value: 'USD' }, DocNumber: number, TxnDate: date, DueDate: due.toISOString().slice(0, 10),
    BillAddr: { Line1: customer.billingAddress ?? '' }, ShipAddr: { Line1: find(s, 'sites', job.siteId).address },
    PrivateNote: `Glove ${invoice.number} revision ${rev.n}; ${job.number}; ${context.jurisdiction || 'No sales tax configured'} (${context.rate}%)${invoice.poNumber ? `; PO ${invoice.poNumber}` : ''}`,
    Line: (rev.lines as Line[]).map((line, i) => ({
      LineNum: i + 1, Description: line.description, Amount: decimal(line.total, 2), DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: itemRef, Qty: decimal(line.quantity, 3), UnitPrice: decimal(line.unitPrice, 2), TaxCodeRef: { value: line.tax !== 'FREE' && !context.exempt && (context.taxLabor || !line.serviceId || !context.laborServiceIds.includes(line.serviceId)) ? 'TAX' : 'NON' } },
    })),
    TxnTaxDetail: { TxnTaxCodeRef: taxCodeRef, TotalTax: decimal(rev.totals.gst, 2) },
  }
}
