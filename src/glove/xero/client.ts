import { fail } from '../model'

const resources = new Set(['Contacts', 'Items', 'Invoices', 'Accounts', 'TaxRates'])
const identities: Record<string, string> = { Contacts: 'ContactID', Items: 'ItemID', Invoices: 'InvoiceID', Accounts: 'AccountID', TaxRates: 'TaxType' }
const paged = new Set(['Contacts', 'Invoices'])
const incomplete = () => fail('XERO_LIMIT', 'Xero discovery is incomplete or changed while reading; repair access or narrow the company before reviewing links.')

async function request(secret: { token: string; tenant: string }, resource: string, signal: AbortSignal, page?: number) {
  const query = page === undefined ? '' : `?page=${page}&pageSize=100`
  let response: Response
  try {
    response = await fetch(`https://api.xero.com/api.xro/2.0/${resource}${query}`, { redirect: 'manual', signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, accept: 'application/json' } })
  } catch { return fail('XERO_PROVIDER', 'Xero did not confirm the inspection. No accounting write was requested.', null, 502) }
  if (!response.ok) fail('XERO_PROVIDER', `Xero inspection failed (HTTP ${response.status}); reconnect or repair access before inspecting again. No accounting write was requested.`, null, 502)
  let body: any
  try { body = await response.json() } catch { return fail('XERO_PROVIDER', 'Xero returned unreadable inspection data. No accounting write was requested.', null, 502) }
  if (!Array.isArray(body?.[resource])) fail('XERO_PROVIDER', 'Xero returned an incomplete inspection response.', null, 502)
  return body
}

/** Fixed read-only Accounting API boundary. No owner-entered host or outbound write is accepted. */
export async function xeroRead(secret: { token: string; tenant: string }, resource: string, complete = false) {
  if (!resources.has(resource)) fail('XERO_RESOURCE', 'Choose a supported Xero inspection resource.', null, 400)
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  try {
    if (!complete) {
      const body = await request(secret, resource, controller.signal)
      if (body[resource].length >= 100) incomplete()
      return body[resource]
    }
    // Xero documents page and pageSize for Contacts and Invoices, but not Items,
    // Accounts or TaxRates. Do not invent paging for those complete-list doors.
    const rows: any[] = [], seen = new Set<string>()
    let advertisedCount: number | undefined
    for (let page = 1; page <= 50; page++) {
      const body = await request(secret, resource, controller.signal, paged.has(resource) ? page : undefined)
      const batch = body[resource]
      if (batch.length > (paged.has(resource) ? 100 : 5000)) incomplete()
      for (const row of batch) {
        const id = row?.[identities[resource]]
        if (typeof id !== 'string' || !id || seen.has(id)) incomplete()
        seen.add(id); rows.push(row)
      }
      if (paged.has(resource) && body.pagination !== undefined) {
        const meta = body.pagination
        if (!Number.isSafeInteger(meta?.itemCount) || meta.itemCount < 0 || meta.page !== page || meta.pageSize !== 100 || !Number.isSafeInteger(meta.pageCount) || meta.pageCount < 0 || (advertisedCount !== undefined && advertisedCount !== meta.itemCount)) incomplete()
        advertisedCount = meta.itemCount
        if (page >= meta.pageCount) {
          if (rows.length !== advertisedCount) incomplete()
          return rows
        }
        if (batch.length !== 100) incomplete()
      } else if (!paged.has(resource) || batch.length < 100) {
        if (advertisedCount !== undefined && rows.length !== advertisedCount) incomplete()
        return rows
      }
    }
    return incomplete()
  } finally { clearTimeout(timer) }
}
