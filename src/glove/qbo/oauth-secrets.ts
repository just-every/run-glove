import { authority } from '../access'
import { business, event, expectVersion, fail, newId, oneOf, text, bump, type Context } from '../model'
import { providerEvent } from '../timeline'
import { callbackPath, tokenExchange, type OAuthApp } from './oauth-wire'

export async function readApp(db: D1Database) {
  const row = await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks-oauth'").first<{ value: string }>() ?? fail('QBO_SETUP', 'Configure the Intuit app and authorize this company again after restore.')
  return { value: row.value, app: JSON.parse(row.value) as OAuthApp }
}
export function configureApp(c: Context, p: any) {
  if (!c.actor.sessionId || c.actor.custom || c.actor.reminderRun) fail('FORBIDDEN', 'Only the signed-in unscoped Owner configures the Intuit app.', null, 403)
  const b = business(c.s); expectVersion(b, p.version)
  if (p.confirm !== true) fail('QBO_AUTH', 'Explicitly approve configuring this Intuit app.')
  const origin = new URL(c.origin!)
  const mode = oneOf(p.oauth.mode, ['sandbox', 'production'] as const, 'mode')
  if (origin.protocol !== 'https:' && !(mode === 'sandbox' && origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) fail('QBO_AUTH', 'Production QuickBooks OAuth requires HTTPS; sandbox also accepts a loopback development origin.')
  const app: OAuthApp = { id: newId(), mode, clientId: text(p.oauth.clientId, 'client ID', { max: 1000 }), clientSecret: text(p.oauth.clientSecret, 'client secret', { max: 4000 }), redirectUri: new URL(callbackPath, origin).href }
  if (!/^[\x21-\x7e]+$/.test(app.clientId) || !/^[\x21-\x7e]+$/.test(app.clientSecret) || app.clientId.includes(':')) fail('INPUT', 'Use the Intuit app credentials exactly as issued.', null, 400)
  c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('quickbooks-oauth',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [JSON.stringify(app), c.actor.id, c.now] })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'qbo.appConfigured', summary: 'Owner configured an Intuit app; company authorization and link review remain required', data: { mode: app.mode, redirectUri: app.redirectUri } })
  return bump(c.s, 'business', b, { qboOAuth: { mode: app.mode, redirectUri: app.redirectUri, configuredAt: c.now } })
}

/** Only explicit Owner commands ask for tokens; refresh never triggers a financial request. */
export async function accessToken(db: D1Database, c: Context) {
  const connection = business(c.s).qbo
  if (connection.auth !== 'oauth') return (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks'").first<{ value: string }>())?.value ?? fail('QBO_SETUP', 'Reconnect QuickBooks after restoring this installation.')
  const stored = await readApp(db), app = stored.app, tokens = app.tokens ?? fail('QBO_AUTH', 'Authorize this QuickBooks company again.'), a = authority(c.actor)
  if (!tokens || tokens.connectionId !== connection.connectionId || tokens.realmId !== connection.realmId || app.mode !== connection.mode || app.reconnectRequired) fail('QBO_AUTH', 'Authorize this QuickBooks company again. No accounting record was sent.')
  if (Date.parse(tokens.expiresAt) > Date.now() + 60000) return tokens.accessToken
  if (app.refreshing) fail('QBO_AUTH', 'An earlier token refresh is unresolved. Reconnect explicitly before another provider request.')
  if (Date.parse(tokens.refreshExpiresAt) <= Date.now()) fail('QBO_AUTH', 'QuickBooks authorization expired. Reconnect explicitly.')
  const claimed = JSON.stringify({ ...app, refreshing: newId() })
  const guard = `(${a.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND json_extract(data,'$.qbo.connectionId')=?)`
  const result = await db.prepare(`UPDATE glove_provider_keys SET value=? WHERE provider='quickbooks-oauth' AND value=? AND ${guard}`).bind(claimed, stored.value, ...a.params, connection.connectionId).run()
  if (!result.meta.changes) fail('QBO_AUTH', 'Authorization changed before refresh. Read the current connection and try again.')
  try {
    const fresh = await tokenExchange(app, { grant_type: 'refresh_token', refresh_token: tokens.refreshToken })
    const next = JSON.stringify({ ...app, tokens: { ...tokens, ...fresh } })
    const saved = await db.prepare(`UPDATE glove_provider_keys SET value=?,set_at=? WHERE provider='quickbooks-oauth' AND value=? AND ${guard}`).bind(next, new Date().toISOString(), claimed, ...a.params, connection.connectionId).run()
    if (!saved.meta.changes) fail('QBO_AUTH', 'Authorization or Owner authority changed during refresh. Reconnect explicitly.')
    await providerEvent(db, { id: `qbo-refresh:${newId()}`, at: new Date().toISOString(), commandId: c.commandId, provider: 'Intuit OAuth', subjectKind: 'business', subjectId: business(c.s).id, kind: 'qbo.tokenRefreshed', summary: 'Intuit renewed authorization during an explicit Owner request; no accounting write was triggered', data: { connectionId: connection.connectionId, requestedBy: c.actor.id, expiresAt: fresh.expiresAt } }).run()
    return fresh.accessToken
  } catch (error) {
    await db.prepare("UPDATE glove_provider_keys SET value=? WHERE provider='quickbooks-oauth' AND value=?").bind(JSON.stringify({ ...app, reconnectRequired: true }), claimed).run()
    await providerEvent(db, { id: `qbo-refresh:${newId()}`, at: new Date().toISOString(), commandId: c.commandId, provider: 'Intuit OAuth', subjectKind: 'business', subjectId: business(c.s).id, kind: 'qbo.authorizationFailed', summary: 'Intuit token renewal was not confirmed; explicit company authorization is required before another provider request', data: { connectionId: connection.connectionId, requestedBy: c.actor.id } }).run()
    throw error
  }
}

/** Public metadata never carries tokens or manufactures authorization after restore. */
export async function credentialStatus(db: D1Database, s: Context['s']) {
  const stored = await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks-oauth'").first<{ value: string }>()
  const app = stored ? JSON.parse(stored.value) as OAuthApp : null, connection = s.business[0]?.qbo
  const present = connection?.auth === 'oauth' ? !!app?.tokens && app.tokens.connectionId === connection.connectionId : !!await db.prepare("SELECT 1 AS present FROM glove_provider_keys WHERE provider='quickbooks'").first()
  const state = !connection ? 'disconnected' : !present ? 'reconnect' : connection.auth !== 'oauth' ? 'manual' : app?.reconnectRequired || app?.refreshing ? 'reconnect' : Date.parse(app!.tokens!.refreshExpiresAt) <= Date.now() ? 'expired' : Date.parse(app!.tokens!.expiresAt) <= Date.now() + 60000 ? 'refresh-required' : 'authorized'
  return { appConfigured: !!app, state, ...(app?.tokens && present ? { expiresAt: app.tokens.expiresAt, refreshExpiresAt: app.tokens.refreshExpiresAt } : {}) }
}
