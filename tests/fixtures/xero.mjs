/** Xero Accounting API fake at the network boundary; no application decisions are faked. */
export function xeroEdge() {
  const calls = [], data = { Contacts: [], Items: [], Invoices: [], Accounts: [], TaxRates: [], Payments: [] }
  const identities = { Contacts: 'ContactID', Items: 'ItemID', Invoices: 'InvoiceID', Payments: 'PaymentID' }
  return { calls, data, allowWrites: false, repeatPage: false, failPage: null, pages: {}, status: 200, reply: null, reject: null, uncertain: false, beforeReply: null, async answer(request) {
    const url = new URL(request.url)
    if (url.origin !== 'https://api.xero.com') return null
    const parts = url.pathname.split('/'), resource = parts[3], id = parts[4]
    if (request.method !== 'GET' && !this.allowWrites) throw new Error('Read-only Xero inspection attempted a write')
    const body = request.method === 'GET' ? null : await request.json()
    calls.push({ method: request.method, path: url.pathname, query: url.search, page: url.searchParams.get('page'), authorization: request.headers.get('authorization'), tenant: request.headers.get('xero-tenant-id'), idempotencyKey: request.headers.get('idempotency-key'), body })
    if (this.beforeReply) await this.beforeReply(request)
    if (request.method !== 'GET') {
      if (this.reject) return Response.json({ [resource]: [{ ValidationErrors: [{ Message: this.reject }], HasErrors: true }] }, { status: 400 })
      const record = structuredClone(body[resource][0]), identity = identities[resource]
      record[identity] ||= `synthetic-glove-${resource.toLowerCase()}-${data[resource].length + 1}`
      if (resource === 'Contacts') record.Addresses.push({ AddressType: 'STREET', AddressLine1: 'Provider-only street address' })
      if (resource === 'Invoices') { record.Date = `/Date(${Date.parse(record.Date + 'T00:00:00Z')})/`; record.DueDate = `/Date(${Date.parse(record.DueDate + 'T00:00:00Z')})/`; record.TotalTax = Number(record.LineItems.reduce((n, l) => n + l.TaxAmount, 0).toFixed(2)); record.Total = Number((record.LineItems.reduce((n, l) => n + l.LineAmount, 0) + record.TotalTax).toFixed(2)); record.AmountDue = record.Total }
      if (resource === 'Payments') {
        const invoice = data.Invoices.find(r => r.InvoiceID === record.Invoice?.InvoiceID)
        if (!invoice || record.Amount <= 0 || record.Amount > invoice.AmountDue) return Response.json({ Payments: [{ ValidationErrors: [{ Message: 'Payment exceeds the invoice balance' }] }] }, { status: 400 })
        record.Invoice = { InvoiceID: invoice.InvoiceID, CurrencyCode: invoice.CurrencyCode, Contact: invoice.Contact }
        record.PaymentType = 'ACCRECPAYMENT'; record.Status = 'AUTHORISED'
        invoice.AmountDue = Number((invoice.AmountDue - record.Amount).toFixed(2))
      }
      const previous = data[resource].findIndex(r => r[identity] === record[identity])
      if (previous < 0) data[resource].push(record); else data[resource][previous] = record
      if (this.uncertain) return Response.json({}, { status: 503 })
      return Response.json({ [resource]: [record] })
    }
    if (this.reply) return this.reply(request)
    const page = this.repeatPage ? 1 : Number(url.searchParams.get('page')), size = Number(url.searchParams.get('pageSize') || 100), rows = this.pages[resource]?.[page - 1] ?? (page ? (data[resource] ?? []).slice((page - 1) * size, page * size) : data[resource] ?? [])
    return Response.json({ [resource]: id ? rows.filter(r => r[identities[resource]] === id) : rows }, { status: page === this.failPage ? 503 : this.status })
  } }
}
