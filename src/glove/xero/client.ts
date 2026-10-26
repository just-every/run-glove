import { fail } from '../model'

const resources = new Set(['Contacts', 'Items', 'Invoices', 'Accounts', 'TaxRates'])
/** Fixed read-only Accounting API boundary. No owner-entered host or outbound write is accepted. */
export async function xeroRead(secret: { token: string; tenant: string }, resource: string) {
  if (!resources.has(resource)) fail('XERO_RESOURCE', 'Choose a supported Xero inspection resource.', null, 400)
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  try {
    let response: Response
    try {
      response = await fetch(`https://api.xero.com/api.xro/2.0/${resource}`, { redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, accept: 'application/json' } })
    } catch { return fail('XERO_PROVIDER', 'Xero did not confirm the inspection. No accounting write was requested.', null, 502) }
    if (!response.ok) fail('XERO_PROVIDER', `Xero inspection failed (HTTP ${response.status}); reconnect or repair access before inspecting again. No accounting write was requested.`, null, 502)
    let body: any
    try { body = await response.json() } catch { return fail('XERO_PROVIDER', 'Xero returned unreadable inspection data. No accounting write was requested.', null, 502) }
    if (!Array.isArray(body?.[resource])) fail('XERO_PROVIDER', 'Xero returned an incomplete inspection response.', null, 502)
    // The first slice cannot claim complete discovery without pagination and reconciliation.
    if (body[resource].length >= 100) fail('XERO_LIMIT', 'This inspection may be incomplete; complete paginated discovery is required before matching this company.')
    return body[resource]
  } finally { clearTimeout(timer) }
}
