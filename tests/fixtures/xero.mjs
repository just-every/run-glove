/** Xero Accounting API fake at the network boundary; no application decisions are faked. */
export function xeroEdge() {
  const calls = [], data = { Contacts: [], Items: [], Invoices: [], Accounts: [], TaxRates: [] }
  return { calls, data, status: 200, reply: null, async answer(request) {
    const url = new URL(request.url)
    if (url.origin !== 'https://api.xero.com') return null
    calls.push({ method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), authorization: request.headers.get('authorization'), tenant: request.headers.get('xero-tenant-id') })
    if (request.method !== 'GET') throw new Error('Read-only Xero inspection attempted a write')
    const resource = url.pathname.split('/').at(-1)
    if (this.reply) return this.reply(resource, url)
    const rows = data[resource] ?? [], page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get('pageSize'))
    return Response.json({ [resource]: page ? rows.slice((page - 1) * size, page * size) : rows }, { status: this.status })
  } }
}
