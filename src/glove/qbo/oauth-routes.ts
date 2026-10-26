import { randomBytes, createHash } from 'node:crypto'
import { authority, allow } from '../access'
import { business, event, fail, newId, type Actor, type Context } from '../model'
import { load, commit } from '../storage'
import { providerEvent } from '../timeline'
import { connectCompany } from './connections'
import { readApp } from './oauth-secrets'
import { authorizationEndpoint, callbackPath, tokenExchange } from './oauth-wire'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const headers = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' }
const finish = (origin: string, notice: string) => new Response(null, { status: 303, headers: { ...headers, location: `${origin}/app?qbo=${notice}#team` } })
const context = (s: Awaited<ReturnType<typeof load>>, actor: Actor, origin: string): Context => ({ s: structuredClone(s), actor, commandId: newId(), now: new Date().toISOString(), events: [], sql: [], files: [], origin })

/** This callback connects accounting access to the existing Owner session, never signs a person in. */
export async function oauthRoute(request: Request, db: D1Database, origin: string, actor: Actor) {
  const url = new URL(request.url)
  if (!['/api/glove/qbo/authorize', callbackPath].includes(url.pathname)) return null
  allow(actor, 'qbo.connect')
  if (actor.role !== 'owner' || !actor.sessionId || actor.token || actor.branch || actor.custom) fail('FORBIDDEN', 'Only the signed-in unscoped Owner authorizes QuickBooks.', null, 403)
  if (url.origin !== origin) fail('QBO_AUTH', 'Use the configured installation origin.')
  const stored = await readApp(db), app = stored.app, a = authority(actor)
  if (new URL(origin).protocol !== 'https:' && !(app.mode === 'sandbox' && new URL(origin).protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname))) fail('QBO_AUTH', 'Production QuickBooks authorization requires HTTPS.')
  if (app.redirectUri !== new URL(callbackPath, origin).href) fail('QBO_AUTH', 'Reconfigure the Intuit app for this exact installation origin.')
  if (url.pathname === '/api/glove/qbo/authorize') {
    if (request.method !== 'POST' || request.headers.get('origin') !== origin || url.search) fail('ORIGIN', 'Approve QuickBooks authorization from this installation.', null, 403)
    const form = await request.formData()
    if (form.get('confirm') !== 'yes') fail('QBO_AUTH', 'Explicitly approve connecting this Intuit app.')
    const state = btoa(String.fromCharCode(...randomBytes(32))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''), before = await load(db), c = context(before, actor, origin)
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString()
    const next = JSON.stringify({ ...app, pending: { hash: hash(state), actorId: actor.id, sessionId: actor.sessionId, expiresAt } })
    c.sql.push({ sql: "UPDATE glove_provider_keys SET value=? WHERE provider='quickbooks-oauth' AND value=?", params: [next, stored.value] }, { sql: 'INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN changes()=1 THEN 1 ELSE 0 END)', params: [newId()] })
    event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: 'qbo.authorizationStarted', summary: 'Owner explicitly started Intuit company authorization; no accounting record was sent', data: { mode: app.mode, expiresAt } })
    await commit(db, c, before, 'qbo.connect', hash(app.id + expiresAt), { authorizationStarted: true, expiresAt })
    const location = new URL(authorizationEndpoint)
    for (const [name, value] of Object.entries({ response_type: 'code', client_id: app.clientId, redirect_uri: app.redirectUri, scope: 'com.intuit.quickbooks.accounting', state })) location.searchParams.set(name, value)
    return new Response(null, { status: 303, headers: { ...headers, location: location.href } })
  }
  if (request.method !== 'GET') fail('METHOD', 'Intuit authorization returns through GET.', null, 405)
  const fields = url.searchParams
  if ([...fields.keys()].some(name => fields.getAll(name).length !== 1 || !['state', 'code', 'realmId', 'error', 'error_description'].includes(name))) return finish(origin, 'authorization-refused')
  const state = fields.get('state') ?? '', pending = app.pending
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || !pending || pending.hash !== hash(state) || pending.actorId !== actor.id || pending.sessionId !== actor.sessionId || pending.expiresAt <= new Date().toISOString()) return finish(origin, 'authorization-refused')
  const consumedApp = { ...app }; delete consumedApp.pending
  const consumed = JSON.stringify(consumedApp)
  const claim = await db.prepare(`UPDATE glove_provider_keys SET value=? WHERE provider='quickbooks-oauth' AND value=? AND (${a.sql})`).bind(consumed, stored.value, ...a.params).run()
  if (!claim.meta.changes) return finish(origin, 'authorization-refused')
  const refused = async (notice: string) => {
    await providerEvent(db, { id: `qbo-authorization:${newId()}`, at: new Date().toISOString(), commandId: newId(), provider: 'Intuit OAuth', subjectKind: 'business', subjectId: business(await load(db)).id, kind: 'qbo.authorizationFailed', summary: 'Owner company authorization did not complete; no accounting record was sent', data: { requestedBy: actor.id, mode: app.mode, outcome: notice } }).run()
    return finish(origin, notice)
  }
  if (fields.has('error')) return refused('authorization-denied')
  const code = fields.get('code') ?? '', realmId = fields.get('realmId') ?? ''
  if (!code || code.length > 4096 || /[\x00-\x20\x7f]/.test(code) || !/^\d{1,30}$/.test(realmId)) return refused('authorization-refused')
  try {
    const tokens = await tokenExchange(app, { grant_type: 'authorization_code', code, redirect_uri: app.redirectUri })
    const before = await load(db), c = context(before, actor, origin)
    const row = connectCompany(c, realmId, app.mode, 'oauth', { authorizedAt: c.now, tokenExpiresAt: tokens.expiresAt })
    const next = JSON.stringify({ ...consumedApp, refreshing: undefined, reconnectRequired: false, tokens: { ...tokens, realmId, connectionId: row.qbo.connectionId } })
    c.sql.push({ sql: "UPDATE glove_provider_keys SET value=?,set_by=?,set_at=? WHERE provider='quickbooks-oauth' AND value=?", params: [next, actor.id, c.now, consumed] }, { sql: 'INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN changes()=1 THEN 1 ELSE 0 END)', params: [newId()] }, { sql: "DELETE FROM glove_provider_keys WHERE provider='quickbooks'", params: [] })
    event(c, { jobId: null, subjectKind: 'business', subjectId: row.id, kind: 'qbo.authorized', summary: 'Owner authorized a QuickBooks company; its existing-record link review governs every post', data: { realmId, mode: app.mode, connectionId: row.qbo.connectionId, expiresAt: tokens.expiresAt } })
    await commit(db, c, before, 'qbo.connect', hash(app.id + row.qbo.connectionId), { realmId, mode: app.mode, connectionId: row.qbo.connectionId })
    return finish(origin, 'authorized')
  } catch { return refused('authorization-failed') }
}
