import { fail } from '../model'

const identities: Record<string, string> = { Contacts: 'ContactID', Items: 'ItemID', Invoices: 'InvoiceID', Accounts: 'AccountID', TaxRates: 'TaxType' }
/** Fixed read-only Accounting API boundary. A partial company never becomes a review. */
export async function xeroRead(secret: { token: string; tenant: string }, resource: string) {
  if (!identities[resource]) fail('XERO_RESOURCE', 'Choose a supported Xero inspection resource.', null, 400)
  const paged = resource === 'Contacts' || resource === 'Invoices', size = 100
  const rows: any[] = [], ids = new Set<string>()
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  let expectedCount: number | undefined
  try {
    for (let page = 1; page <= 1000; page++) {
      const url = new URL(`https://api.xero.com/api.xro/2.0/${resource}`)
      if (paged) {
        url.searchParams.set('page', String(page)); url.searchParams.set('pageSize', String(size))
        url.searchParams.set('order', `${identities[resource]} ASC`)
        if (resource === 'Contacts') url.searchParams.set('includeArchived', 'true')
      }
      let response: Response
      try {
        response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, accept: 'application/json' } })
      } catch { return fail('XERO_PROVIDER', 'Xero did not confirm the inspection. No accounting write was requested.', null, 502) }
      if (!response.ok) fail('XERO_PROVIDER', `Xero inspection failed (HTTP ${response.status}); reconnect or repair access before inspecting again. No accounting write was requested.`, null, 502)
      let body: any
      try { body = await response.json() } catch { return fail('XERO_PROVIDER', 'Xero returned unreadable inspection data. No accounting write was requested.', null, 502) }
      const result = body?.[resource]
      if (!Array.isArray(result) || result.length > (paged ? size : 100_000)) fail('XERO_LIMIT', 'Xero returned an invalid or oversized company list; no partial review was prepared.')
      if (body.pagination !== undefined) {
        const m = body.pagination
        if (!paged || !m || m.page !== page || m.pageSize !== size || !Number.isSafeInteger(m.itemCount) || m.itemCount < 0 || !Number.isSafeInteger(m.pageCount) || m.pageCount !== Math.ceil(m.itemCount / size) || expectedCount !== undefined && expectedCount !== m.itemCount) fail('XERO_LIMIT', 'Xero pagination changed or is incomplete; read the company again.')
        expectedCount = m.itemCount
        if (result.length !== Math.min(size, Math.max(0, expectedCount! - rows.length))) fail('XERO_LIMIT', 'Xero omitted company records; no partial review was prepared.')
      } else if (expectedCount !== undefined) fail('XERO_LIMIT', 'Xero omitted pagination metadata; no partial review was prepared.')
      for (const row of result) {
        const id = row?.[identities[resource]]
        if (typeof id !== 'string' || !id.trim() || ids.has(id)) fail('XERO_LIMIT', 'Xero returned a repeated or missing record identity; no partial review was prepared.')
        ids.add(id); rows.push(row)
      }
      if (!paged || result.length < size) {
        if (expectedCount !== undefined && rows.length !== expectedCount) fail('XERO_LIMIT', 'Xero omitted company records; no partial review was prepared.')
        return rows
      }
    }
    return fail('XERO_LIMIT', 'This company exceeds the bounded review; no partial review was prepared.')
  } finally { clearTimeout(timer) }
}
