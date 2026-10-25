export type QboConnection = { realmId: string; mode: 'sandbox' | 'production' }

export class QboError extends Error {
  constructor(message: string, public status: number, public rejected: boolean) {
    super(message)
    this.name = 'QboError'
  }
}

const hosts = { sandbox: 'https://sandbox-quickbooks.api.intuit.com', production: 'https://quickbooks.api.intuit.com' }
const invalid = (message: string): never => { throw new QboError(message, 400, true) }

function requestUrl(connection: QboConnection, resource: string, writing: boolean, requestId?: string) {
  if (!connection || typeof connection.realmId !== 'string' || !/^\d{1,30}$/.test(connection.realmId) || !Object.hasOwn(hosts, connection.mode)) invalid('Use a numeric QuickBooks company ID and a supported connection mode.')
  if (typeof resource !== 'string') invalid('Use a QuickBooks entity, entity ID, or query resource.')
  let path = resource
  let query: string | undefined
  if (resource.startsWith('query?')) {
    const params = new URLSearchParams(resource.slice(6))
    if (writing || [...params.keys()].some(key => key !== 'query') || params.getAll('query').length !== 1 || resource.includes('#')) invalid('Use one read-only QuickBooks query.')
    query = params.get('query')!
    if (!/^select\s+(?:\*|count\(\*\))\s+from\s+[a-z]+\b/i.test(query) || /[;\u0000-\u001f]/.test(query)) invalid('Use a single QuickBooks SELECT query.')
    path = 'query'
  } else if (!/^[a-z]+(?:\/\d{1,30})?$/.test(resource) || resource === 'query' || (writing && resource.includes('/'))) {
    invalid('Use a lowercase QuickBooks entity, or an entity and numeric ID for a read.')
  }
  const url = new URL(`${hosts[connection.mode]}/v3/company/${connection.realmId}/${path}`)
  if (query !== undefined) url.searchParams.set('query', query)
  url.searchParams.set('minorversion', '75')
  if (requestId !== undefined) {
    if (!writing || !/^[a-zA-Z0-9._:-]{1,50}$/.test(requestId)) invalid('Use a QuickBooks write request ID of at most 50 letters, digits, periods, underscores, colons or hyphens.')
    url.searchParams.set('requestid', requestId)
  }
  return url
}

/** Return the full Intuit response; callers retain the entity IDs and SyncTokens. */
export async function qboRequest(connection: QboConnection, key: string, resource: string, body?: Record<string, any>, requestId?: string): Promise<any> {
  const writing = body !== undefined
  const url = requestUrl(connection, resource, writing, requestId)
  if (typeof key !== 'string' || !key.trim() || /[\r\n]/.test(key)) invalid('Connect a valid QuickBooks access token before syncing.')
  if (writing && (!body || typeof body !== 'object' || Array.isArray(body))) invalid('Use a QuickBooks JSON object for a write.')
  let serialized: string | undefined
  try { if (writing) serialized = JSON.stringify(body) } catch { invalid('The QuickBooks request must be serializable JSON.') }
  if (writing && serialized === undefined) invalid('The QuickBooks request must be a JSON object.')
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  try {
    let response: Response
    try {
      response = await fetch(url, { method: writing ? 'POST' : 'GET', redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${key}`, accept: 'application/json', ...(writing ? { 'content-type': 'application/json' } : {}) }, ...(writing ? { body: serialized } : {}) })
    } catch { throw new QboError('QuickBooks did not confirm the request. Reconcile the provider outcome before sending again.', 0, false) }
    const refused = response.status >= 400 && response.status < 500 && response.status !== 408
    let value: any
    try { value = await response.json() } catch {
      throw new QboError(refused ? `QuickBooks refused the request (HTTP ${response.status}).` : `QuickBooks returned an unreadable response (HTTP ${response.status}); the outcome is unconfirmed.`, response.status, refused)
    }
    if (!response.ok || value?.Fault) {
      const fault = value?.Fault
      const messages = Array.isArray(fault?.Error) ? fault.Error.map((error: any) => [typeof error?.code === 'string' ? error.code : '', typeof error?.Message === 'string' ? error.Message : '', typeof error?.Detail === 'string' && error.Detail !== error.Message ? error.Detail : ''].filter(Boolean).join(': ')).filter(Boolean) : []
      const message = messages.length ? `QuickBooks: ${messages.join('; ')}` : `QuickBooks did not confirm the request (HTTP ${response.status}).`
      const rejected = refused || (response.ok && ['ValidationFault', 'AuthenticationFault', 'AuthorizationFault'].includes(fault?.type))
      throw new QboError(message.split(key).join('[redacted]').slice(0, 4000), response.status, rejected)
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new QboError('QuickBooks returned no response object; the outcome is unconfirmed.', response.status, false)
    return value
  } finally { clearTimeout(timer) }
}
