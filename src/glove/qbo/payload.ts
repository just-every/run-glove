import { business, fail, find, type Context, type Row } from '../model'
import { qboInvoice } from '../qbo-invoice'
import { cents } from '../money'

const kinds = { customer: 'customers', site: 'sites', service: 'services', invoice: 'invoices', payment: 'payments' } as const
export const collection = (kind: string) => kinds[kind as keyof typeof kinds] ?? fail('INPUT', 'Choose a QuickBooks record kind.', null, 400)
export function mapping(c: Context, row: Row) {
  const connection = business(c.s).qbo
  if (!row.qbo?.remoteId || row.qbo.connectionId !== connection?.connectionId) fail('QBO_MAPPING', 'Link this record to an existing QuickBooks record first.')
  return row.qbo
}
export function invoicePayload(c: Context, invoice: Row) {
  const b = business(c.s), customer = find(c.s, 'customers', invoice.customerId), site = find(c.s, 'sites', find(c.s, 'jobs', invoice.jobId).siteId)
  const parent = mapping(c, customer), child = site.qbo ? mapping(c, site) : parent
  const rev = invoice.revisions.findLast((r: Row) => r.approval)
  if (!rev) fail('NOT_APPROVED', 'Approve this invoice first.')
  if (!b.qbo.taxCodeRef) fail('QBO_MAPPING', 'Map the QuickBooks tax code first.')
  const refs = rev.lines.map((line: Row) => mapping(c, find(c.s, 'services', line.serviceId)).remoteId)
  const payload = qboInvoice(c.s, invoice, { customerRef: child.remoteId, itemRef: refs[0], taxCodeRef: b.qbo.taxCodeRef })
  payload.Line.forEach((line: any, i: number) => { if (line.SalesItemLineDetail) line.SalesItemLineDetail.ItemRef = { value: refs[i] } })
  return { ...payload, ...(b.qbo.classRef ? { ClassRef: { value: b.qbo.classRef } } : {}), ...(b.qbo.departmentRef ? { DepartmentRef: { value: b.qbo.departmentRef } } : {}) }
}
export function payloadFor(c: Context, kind: string, row: Row): { resource: string; body: Record<string, any> } {
  if (kind === 'customer') {
    const m = mapping(c, row)
    return { resource: 'customer', body: { Id: m.remoteId, SyncToken: m.syncToken, sparse: true, DisplayName: row.name, ...(row.email ? { PrimaryEmailAddr: { Address: row.email } } : {}), BillAddr: { Line1: row.billingAddress || '' } } }
  }
  if (kind === 'service') {
    const m = mapping(c, row)
    return { resource: 'item', body: { Id: m.remoteId, SyncToken: m.syncToken, sparse: true, Name: row.code, Description: row.description || row.name, UnitPrice: Number(row.unitPrice) } }
  }
  if (kind === 'invoice') return { resource: 'invoice', body: invoicePayload(c, row) }
  if (kind !== 'payment' || row.status !== 'paid' || row.qboImported || row.currency !== 'USD' || cents(row.tip ?? '0.00', 'tip')) fail('QBO_PAYMENT', 'Choose a confirmed USD payment without a tip; imported payments are never sent back.')
  const customer = mapping(c, find(c.s, 'customers', row.customerId))
  if (row.kind === 'refund') {
    const invoice = find(c.s, 'invoices', row.invoiceId), payload = invoicePayload(c, invoice)
    const total = invoice.revisions.findLast((r: Row) => r.approval).totals.total
    if (row.amount !== total) fail('QBO_REFUND', 'This slice syncs full-invoice refunds only; partial refunds require a reviewed tax allocation.')
    const { DueDate: _due, DocNumber: _number, ...receipt } = payload
    return { resource: 'refundreceipt', body: { ...receipt, TxnDate: (row.confirmedAt ?? row.createdAt).slice(0, 10), PaymentRefNum: row.reference || row.id, TotalAmt: Number(row.amount) } }
  }
  const effects = (row.effects ?? []).filter((e: Row) => e.amountCents > 0)
  if (!effects.length || effects.reduce((n: number, e: Row) => n + e.amountCents, 0) !== cents(row.amount, 'amount')) fail('QBO_PAYMENT', 'Sync only invoice-applied payments with an exact allocation.')
  return { resource: 'payment', body: { CustomerRef: { value: customer.remoteId }, TotalAmt: Number(row.amount), PaymentRefNum: row.reference || row.id, Line: effects.map((e: Row) => {
    const invoice = find(c.s, 'invoices', e.invoiceId ?? row.invoiceId)
    if (invoice.customerId !== row.customerId || !invoice.qboSync?.remoteId || invoice.qboSync.connectionId !== business(c.s).qbo.connectionId) fail('QBO_MAPPING', 'Sync every allocated invoice to this company first.')
    return { Amount: e.amountCents / 100, LinkedTxn: [{ TxnId: invoice.qboSync.remoteId, TxnType: 'Invoice' }] }
  }) } }
}
