import { fail } from '../model'

export type XeroSecret = { token: string; tenant: string }
const resources = new Set(['Contacts', 'Items', 'Invoices', 'Accounts', 'TaxRates'])
const identities: Record<string, string> = { Contacts: 'ContactID', Invoices: 'InvoiceID' }
/** Fixed read-only Accounting API boundary. No owner-entered host or outbound write is accepted. */
export async function xeroRead(secret: XeroSecret, resource: string, id?: string) {
  if (!resources.has(resource)) fail('XERO_RESOURCE', 'Choose a supported Xero inspection resource.', null, 400)
  if (id !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) fail('INPUT', 'Use a valid Xero record identity.', null, 400)
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  const paginated = !id && !!identities[resource], rows: any[] = [], seen = new Set<string>()
  try {
    for (let page = 1; page <= 20; page++) {
      let response: Response
      try {
        response = await fetch(`https://api.xero.com/api.xro/2.0/${resource}${id ? '/' + id : paginated ? '?page=' + page : ''}`, { redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, accept: 'application/json' } })
      } catch { return fail('XERO_PROVIDER', 'Xero did not confirm the inspection. No accounting write was requested.', null, 502) }
      if (!response.ok) fail('XERO_PROVIDER', `Xero inspection failed (HTTP ${response.status}); reconnect or repair access before inspecting again. No accounting write was requested.`, null, 502)
      let body: any
      try { body = await response.json() } catch { return fail('XERO_PROVIDER', 'Xero returned unreadable inspection data. No accounting write was requested.', null, 502) }
      if (!Array.isArray(body?.[resource])) fail('XERO_PROVIDER', 'Xero returned an incomplete inspection response.', null, 502)
      const batch = body[resource]
      if (paginated) for (const row of batch) {
        const identity = row?.[identities[resource]]
        if (typeof identity !== 'string' || !identity || seen.has(identity)) fail('XERO_LIMIT', 'Xero inspection pages overlap or lack identities; no partial company review is available.')
        seen.add(identity)
      }
      rows.push(...batch)
      if (paginated && batch.length === 100) continue
      if (batch.length >= 100) fail('XERO_LIMIT', 'This inspection may be incomplete; complete paginated discovery is required before matching this company.')
      return rows
    }
    return fail('XERO_LIMIT', 'Xero inspection exceeds the bounded page limit; no partial company review is available.')
  } finally { clearTimeout(timer) }
}
