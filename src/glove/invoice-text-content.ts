import type { Row } from './model'

/** Customer-facing approved document prices, never an outstanding balance or payment link. */
export function invoiceTextContent(invoice: Row) {
  const revision = invoice.revisions.at(-1)
  return [
    `Invoice ${invoice.number} · revision ${revision.n}`,
    ...(invoice.poNumber ? [`Your PO: ${invoice.poNumber}`] : []),
    `Issued ${invoice.dates.issuedOn} · Due ${invoice.dates.dueOn}`,
    ...revision.lines.map((line: Row) => `${line.description}: ${line.quantity} × $${line.unitPrice} = $${line.total}`),
    `Subtotal: $${revision.totals.subtotal}`,
    ...(revision.totals.discount ? [`Document discount: $${revision.totals.discount.amount}`] : []),
    `Tax: $${revision.totals.gst}`,
    `Approved document total: ${revision.totals.currency ?? 'USD'} $${revision.totals.total}`,
    'This is the approved invoice, not a statement of the amount still due. Contact the office with questions.',
  ].join('\n')
}
