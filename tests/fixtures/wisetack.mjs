// Official protocol: https://wisetack-sec.us/api/index.html (retrieved 23 October 2026).
// Replaces only Wisetack's network edge. All product authority, records and money math are real.
export function wisetackEdge() {
  const calls = [], transactions = new Map()
  let status = 200
  return { calls, transactions, set status(value) { status = value }, async answer(request) {
    const u = new URL(request.url)
    if (u.origin !== 'https://api.wisetack-sec.us') return null
    const body = request.method === 'POST' ? await request.json() : undefined
    calls.push({ path: u.pathname, method: request.method, body })
    if (status !== 200) return Response.json({ message: 'Synthetic provider unavailable' }, { status })
    const parts = u.pathname.split('/'), merchantId = parts[3], id = parts[5]
    if (request.method === 'POST' && !id) {
      const transactionId = `synthetic-glove-financing-${transactions.size + 1}`
      transactions.set(transactionId, { applicationId: transactionId, purchaseId: body.purchaseId, requestedLoanAmount: body.transactionAmount, approvedLoanAmount: null, settledLoanAmount: '0.00', processingFeeAmount: '0.00', status: 'Pending', offers: null, refunds: [] })
      return Response.json({ transactionId, transactionAmount: body.transactionAmount, paymentLink: `https://wisetack-sec.us/#/synthetic-glove-${transactions.size}`, purchaseId: body.purchaseId })
    }
    const row = transactions.get(id)
    if (!row) return Response.json({}, { status: 404 })
    if (u.pathname.endsWith('/refund')) {
      const refund = { id: `synthetic-glove-finance-refund-${row.refunds.length + 1}`, amount: body.refundAmount, merchantDebitAmount: body.refundAmount, date: new Date().toISOString() }
      row.refunds.push(refund)
      return Response.json({ transactionId: id, merchantId, changedStatus: 'Refunded', refund })
    }
    return Response.json(row)
  } }
}
