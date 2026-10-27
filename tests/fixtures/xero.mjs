/** Xero Accounting API fake at the network boundary; no application decisions are faked. */
export function xeroEdge() {
  const calls = [], data = { Contacts: [], Items: [], Invoices: [], Accounts: [], TaxRates: [], Payments: [] }
  const identities = { Contacts: 'ContactID', Items: 'ItemID', Invoices: 'InvoiceID', Payments: 'PaymentID' }
  return { calls, data, status: 200, reply: null, reject: null, uncertain: false, beforeReply: null, async answer(request) {
    const url = new URL(request.url)
    if (url.origin !== 'https://api.xero.com') return null
    const parts = url.pathname.split('/'), resource = parts[3], id = parts[4]
    const body = request.method === 'GET' ? null : await request.json()
    calls.push({ method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), authorization: request.headers.get('authorization'), tenant: request.headers.get('xero-tenant-id'), idempotencyKey: request.headers.get('idempotency-key'), body })
    if (this.beforeReply) await this.beforeReply(request)
    if (request.method !== 'GET') {
      if (this.reject) return Response.json({ [resource]: [{ ValidationErrors: [{ Message: this.reject }], HasErrors: true }] }, { status: 400 })
      const record = structuredClone(body[resource][0]), identity = identities[resource]
      record[identity] ||= `synthetic-glove-${resource.toLowerCase()}-${data[resource].length + 1}`
      if (resource === 'Contacts') record.Addresses.push({ AddressType: 'STREET', AddressLine1: 'Provider-only street address' })
      if (resource === 'Invoices') { record.Date = `/Date(${Date.parse(record.Date + 'T00:00:00Z')})/`; record.DueDate = `/Date(${Date.parse(record.DueDate + 'T00:00:00Z')})/`; record.TotalTax = Number(record.LineItems.reduce((n, l) => n + l.TaxAmount, 0).toFixed(2)); record.Total = Number((record.LineItems.reduce((n, l) => n + l.LineAmount, 0) + record.TotalTax).toFixed(2)) }
      const previous = data[resource].findIndex(r => r[identity] === record[identity])
      if (previous < 0) data[resource].push(record); else data[resource][previous] = record
      if (this.uncertain) return Response.json({}, { status: 503 })
      return Response.json({ [resource]: [record] })
    }
    if (this.reply) return this.reply(resource, url)
    const rows = data[resource] ?? [], page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('pageSize'))
    return Response.json({ [resource]: id ? rows.filter(r => r[identities[resource]] === id) : page ? rows.slice((page - 1) * size, page * size) : rows }, { status: this.status })
  } }
}
