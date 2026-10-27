/** Xero Accounting API fake at the network boundary; no application decisions are faked. */
export function xeroEdge() {
  const calls = [], data = { Contacts: [], Items: [], Invoices: [], Accounts: [], TaxRates: [] }
  return { calls, data, status: 200, repeatPage: false, failPage: null, async answer(request) {
    const url = new URL(request.url)
    if (url.origin !== 'https://api.xero.com') return null
    calls.push({ method: request.method, path: url.pathname, page: url.searchParams.get('page'), authorization: request.headers.get('authorization'), tenant: request.headers.get('xero-tenant-id') })
    if (request.method !== 'GET') throw new Error('Read-only Xero inspection attempted a write')
    const [, resource, id] = url.pathname.match(/\/2\.0\/([^/]+)(?:\/([^/]+))?$/) ?? []
    const field = { Contacts: 'ContactID', Items: 'ItemID', Invoices: 'InvoiceID' }[resource]
    const page = this.repeatPage ? 1 : Number(url.searchParams.get('page') ?? 1)
    const rows = id ? (data[resource] ?? []).filter(row => row[field] === id) : url.searchParams.has('page') ? (data[resource] ?? []).slice((page - 1) * 100, page * 100) : data[resource] ?? []
    return Response.json({ [resource]: rows }, { status: page === this.failPage ? 503 : this.status })
  } }
}
