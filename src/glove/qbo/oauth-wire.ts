import { fail } from '../model'

// Intuit's published OAuth discovery and official OAuth client use these fixed endpoints.
export const authorizationEndpoint = 'https://appcenter.intuit.com/connect/oauth2'
export const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
export const callbackPath = '/api/glove/qbo/callback'
export type OAuthApp = { id: string; mode: 'sandbox' | 'production'; clientId: string; clientSecret: string; redirectUri: string; pending?: { hash: string; actorId: string; sessionId: string; expiresAt: string }; tokens?: { connectionId: string; realmId: string; accessToken: string; refreshToken: string; expiresAt: string; refreshExpiresAt: string }; refreshing?: string; reconnectRequired?: boolean }

export async function tokenExchange(app: OAuthApp, fields: Record<string, string>) {
  let response: Response
  try { response = await fetch(tokenEndpoint, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { authorization: `Basic ${btoa(`${app.clientId}:${app.clientSecret}`)}`, accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields) }) }
  catch { return fail('QBO_AUTH', 'Intuit did not confirm authorization. Reconnect explicitly; Glove does not repeat a token exchange.', null, 502) }
  let value: any
  try { value = await response.json() } catch { return fail('QBO_AUTH', 'Intuit returned no usable authorization. Reconnect explicitly.', null, 502) }
  const token = (v: unknown): v is string => typeof v === 'string' && /^[\x21-\x7e]{1,16000}$/.test(v)
  const seconds = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v <= 366 * 86400
  if (!response.ok || value.token_type?.toLowerCase() !== 'bearer' || !token(value.access_token) || !token(value.refresh_token) || !seconds(value.expires_in) || !seconds(value.x_refresh_token_expires_in)) fail('QBO_AUTH', 'Intuit refused or did not confirm usable authorization. Reconnect explicitly.', null, 502)
  const now = Date.now()
  return { accessToken: value.access_token as string, refreshToken: value.refresh_token as string, expiresAt: new Date(now + value.expires_in * 1000).toISOString(), refreshExpiresAt: new Date(now + value.x_refresh_token_expires_in * 1000).toISOString() }
}
