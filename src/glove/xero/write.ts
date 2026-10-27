import { fail } from '../model'

export class XeroWriteError extends Error {
  constructor(message: string, public rejected = false) { super(message) }
}
/** Fixed Xero endpoint, explicit command and durable idempotency identity only. */
export async function xeroWrite(secret: { token: string; tenant: string }, resource: string, body: any, operationId: string) {
  if (!['Contacts', 'Items', 'Invoices'].includes(resource)) fail('XERO_RESOURCE', 'Unsupported Xero write.')
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
  try {
    let response: Response
    try { response = await fetch(`https://api.xero.com/api.xro/2.0/${resource}`, { method: 'POST', redirect: 'manual', signal: controller.signal, headers: { authorization: `Bearer ${secret.token}`, 'xero-tenant-id': secret.tenant, 'content-type': 'application/json', accept: 'application/json', 'Idempotency-Key': operationId }, body: JSON.stringify({ [resource]: [body] }) }) }
    catch { throw new XeroWriteError('Xero outcome unknown; inspect the existing provider record before sending again.') }
    const rejected = [400, 401, 403, 404, 422, 429].includes(response.status)
    let value: any
    try { value = await response.json() } catch { throw new XeroWriteError(`Xero returned an unreadable response (HTTP ${response.status}).`, rejected) }
    const remote = value?.[resource]?.[0]
    if (!response.ok || remote?.HasErrors || remote?.ValidationErrors?.length) {
      const detail = (remote?.ValidationErrors ?? value?.Elements?.[0]?.ValidationErrors ?? []).map((e: any) => typeof e.Message === 'string' ? e.Message : '').filter(Boolean).join('; ')
      const message = `Xero ${response.status}: ${detail || 'Request was not confirmed.'}`.split(secret.token).join('[redacted]').split(secret.tenant).join('[redacted]').slice(0, 2000)
      throw new XeroWriteError(message, rejected || response.ok && !!remote?.ValidationErrors?.length)
    }
    if (!Array.isArray(value?.[resource]) || value[resource].length !== 1) throw new XeroWriteError('Xero returned no single record; reconcile before sending again.')
    return remote
  } finally { clearTimeout(timer) }
}
