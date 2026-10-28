import { business, fail, find, type Context, type Row } from '../model'
import { cents, signedCents } from '../money'
import { invoiceDates } from '../receivables'

export const xeroCollection = (kind: string) => ({ customer: 'customers', service: 'services', invoice: 'invoices', payment: 'payments' } as const)[kind as 'customer'] ?? fail('INPUT', 'Choose a customer, sales item, invoice or payment.')
export function xeroMapping(c: Context, row: Row) {
  if (!row.xero?.confirmedAt || row.xero.connectionId !== business(c.s).xeroInspection?.connectionId) fail('XERO_MAPPING', 'Confirm this record’s current Xero link first.')
  return row.xero
}
export function xeroPayload(c: Context, kind: string, row: Row) {
  if (row.erasedAt || row.archived || row.mergedInto) fail('XERO_RECORD', 'Choose a current record.')
  if (kind === 'customer') {
    const m = xeroMapping(c, row)
    return { resource: 'Contacts', identity: 'ContactID', body: { ContactID: m.remoteId, Name: row.name, EmailAddress: row.email || '', Addresses: [{ AddressType: 'POBOX', AddressLine1: row.billingAddress || '' }] } }
  }
  if (kind === 'service') {
    const m = xeroMapping(c, row)
    return { resource: 'Items', identity: 'ItemID', body: { ItemID: m.remoteId, Code: m.code, Name: row.name.slice(0, 50), Description: row.description || row.name, SalesDetails: { UnitPrice: Number(row.unitPrice), AccountCode: m.incomeAccountCode, TaxType: m.taxType } } }
  }
  if (kind !== 'invoice' || row.openingBalance) fail('XERO_INVOICE', 'Imported balances must be linked, never posted as new sales.')
  const revision = row.revisions?.at(-1)
  if (!revision?.approval || !['approved', 'exported'].includes(row.status)) fail('NOT_APPROVED', 'Approve a current invoice before posting.')
  const context = revision.totals.taxContext
  if (revision.totals.currency !== 'USD' || !context) fail('XERO_INVOICE', 'An approved frozen USD tax snapshot is required.')
  const customer = find(c.s, 'customers', row.customerId), contact = xeroMapping(c, customer)
  const job = find(c.s, 'jobs', row.jobId), site = find(c.s, 'sites', job.siteId)
  if (site.customerId !== customer.id || (site.branchId ?? null) !== (customer.branchId ?? null)) fail('XERO_MAPPING', 'The property must belong to this billing customer and branch.')
  const taxed = (l: Row) => l.tax !== 'FREE' && !context.exempt && (context.taxLabor || !context.laborServiceIds.includes(l.serviceId))
  const net = revision.lines.map((l: Row, i: number) => signedCents(l.total, 'line total') - cents(revision.totals.discount?.lines.find((d: Row) => d.line === i + 1)?.amount ?? '0.00', 'discount'))
  const basis = net.reduce((n: number, value: number, i: number) => n + (taxed(revision.lines[i]) ? value : 0), 0)
  // Allocate the frozen document tax cumulatively so rounding never changes a cent.
  let cumulative = 0, assigned = 0
  const tax = cents(revision.totals.gst, 'tax')
  const lines = revision.lines.map((l: Row, i: number) => {
    const m = xeroMapping(c, find(c.s, 'services', l.serviceId))
    cumulative += taxed(l) ? net[i] : 0
    const through = basis ? Number((BigInt(cumulative) * BigInt(tax) * 2n + BigInt(basis)) / (2n * BigInt(basis))) : 0
    const lineTax = through - assigned; assigned = through
    const discount = revision.totals.discount?.lines.find((d: Row) => d.line === i + 1)
    return { ItemCode: m.code, Description: l.description, Quantity: Number(l.quantity), UnitAmount: Number(l.unitPrice), LineAmount: net[i] / 100, ...(discount ? { DiscountAmount: Number(discount.amount) } : {}), AccountCode: m.incomeAccountCode, TaxType: m.taxType, TaxAmount: lineTax / 100, ...(m.tracking?.length ? { Tracking: m.tracking } : {}) }
  })
  const dates = invoiceDates(c.s, row)!
  return { resource: 'Invoices', identity: 'InvoiceID', body: { Type: 'ACCREC', Status: 'AUTHORISED', Contact: { ContactID: contact.remoteId }, CurrencyCode: 'USD', InvoiceNumber: row.number, Date: dates.issuedOn, DueDate: dates.dueOn, Reference: `Property ${site.address}${row.poNumber ? `; PO ${row.poNumber}` : ''}`, LineAmountTypes: 'Exclusive', LineItems: lines }, total: Number(revision.totals.total), tax: Number(revision.totals.gst) }
}

/** Only explicit transport fields participate; provider metadata is ignored. */
export function xeroMatches(expected: any, actual: any): boolean {
  if (Array.isArray(expected)) return Array.isArray(actual) && expected.length === actual.length && expected.every((v, i) => xeroMatches(v, actual[i]))
  if (expected && typeof expected === 'object') return !!actual && Object.entries(expected).every(([k, v]) => k === 'Addresses' && Array.isArray(v) ? v.every(address => Array.isArray(actual[k]) && actual[k].some((candidate: any) => candidate.AddressType === address.AddressType && xeroMatches(address, candidate))) : xeroMatches(v, actual[k + 'String'] ?? actual[k]))
  if (typeof expected === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expected) && typeof actual === 'string') {
    const microsoft = /^\/Date\((\d+)(?:[+-]\d{4})?\)\/$/.exec(actual)
    if (microsoft) return new Date(Number(microsoft[1])).toISOString().slice(0, 10) === expected
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z?$/.test(actual)) return actual.slice(0, 10) === expected
  }
  return expected === actual
}
