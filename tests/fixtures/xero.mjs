/** Xero Accounting API fake at the network boundary; no application decisions are faked. */
export function xeroEdge() {
  const calls = [], data = { Contacts: [], Items: [], Invoices: [], Accounts: [], TaxRates: [] }
  return { calls, data, pages: {}, reply: null, beforeReply: null, status: 200, async answer(request) {
    const url = new URL(request.url)
    if (url.origin !== 'https://api.xero.com') return null
    calls.push({ method: request.method, path: url.pathname, query: url.search, authorization: request.headers.get('authorization'), tenant: request.headers.get('xero-tenant-id') })
    if (request.method !== 'GET') throw new Error('Read-only Xero inspection attempted a write')
    const resource = url.pathname.split('/').at(-1)
    if (this.beforeReply) await this.beforeReply(request)
    if (this.reply) return this.reply(request)
    const page = Number(url.searchParams.get('page') || 0)
    const rows = this.pages[resource]?.[page - 1] ?? (page ? (data[resource] ?? []).slice((page - 1) * 100, page * 100) : data[resource] ?? [])
    return Response.json({ [resource]: rows }, { status: this.status })
  } }
}
