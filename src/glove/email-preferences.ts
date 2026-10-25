import { sha256 } from '../modules/import-kit/src/d1/index'
import { bump, event, fail, find, newId, Problem, type Context } from './model'
import { load, commit } from './storage'

export const emailStopHash = (token: string) => sha256(`glove-email-stop:${token}`)
export const emailAddressHash = (email: string) => sha256(`glove-email-stop-address:${email.toLowerCase()}`)
const unavailable = (): never => fail('EMAIL_PREFERENCE', 'This email preference link is unavailable. Contact the business to stop emails.', null, 404)
const headers = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }

/** The footer is mandatory for a nontransactional quote follow-up. No customer
 * address or identity is revealed by its read or withdrawal doors. */
export function quoteEmailFooter(c: Context, customerId: string, address: string, purpose: 'quotes' | 'reviews' = 'quotes') {
  const postal = c.s.business[0]?.address?.trim()
  if (!postal) fail('POSTAL_ADDRESS', 'Record the business postal address before quote follow-up email.', null, 409)
  const token = 'gle_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  c.sql.push({ sql: 'INSERT INTO glove_email_stop_secrets(hash,customer_id,address_hash,purpose,expires_at) VALUES(?,?,?,?,?)', params: [emailStopHash(token), customerId, emailAddressHash(address), purpose, new Date(Date.parse(c.now) + 90 * 86400000).toISOString()] })
  return `\n\nStop ${purpose === 'reviews' ? 'review requests' : 'quote follow-up emails'}:\n${c.origin}/email-preferences#token=${token}\n${c.s.business[0].name}\n${postal}`
}

export async function publicEmailPreferences(request: Request, db: D1Database, origin: string): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/glove/public/email-preferences') return null
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
  try {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, allow: 'GET, POST' } })
    const token = /^Bearer (gle_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token || url.search) unavailable()
    const hash = emailStopHash(token!), key = await db.prepare('SELECT customer_id AS customerId,address_hash AS addressHash,purpose,expires_at AS expiresAt FROM glove_email_stop_secrets WHERE hash=?').bind(hash).first<any>()
    const before = await load(db), customer = before.customers.find(c => c.id === key?.customerId) ?? unavailable(), now = new Date().toISOString()
    if (!key || key.expiresAt <= now || !customer || customer.erasedAt || customer.mergedInto || emailAddressHash(customer.email ?? '') !== key.addressHash) unavailable()
    const purpose = key.purpose as 'quotes' | 'reviews', label = purpose === 'reviews' ? 'review requests' : 'quote follow-up emails'
    const stopped = customer.automaticEmail?.[purpose]?.enabled !== true
    if (request.method === 'GET' || stopped) return json({ available: true, stopped, purpose: label })
    if (request.headers.get('origin') !== new URL(origin).origin) fail('ORIGIN', 'Use this installation to stop emails.', null, 403)
    if (!request.headers.get('content-type')?.includes(['application', 'json'].join('/'))) fail('INPUT', 'Confirm the email preference.', null, 400)
    const raw = await request.text()
    if (raw.length > 100) fail('INPUT', 'Confirm the email preference.', null, 400)
    let body: any
    try { body = JSON.parse(raw) } catch { fail('INPUT', 'Confirm the email preference.', null, 400) }
    if (body?.stop !== true || Object.keys(body).length !== 1) fail('INPUT', 'Confirm the email preference.', null, 400)
    const c: Context = { s: structuredClone(before), actor: { id: 'email-recipient', name: 'Email link recipient (unverified)', role: 'viewer', sessionId: '', operatorVersion: 0, emailStop: { hash, customerId: customer.id } }, commandId: newId(), now, events: [], files: [], sql: [] }
    const live = find(c.s, 'customers', customer.id)
    bump(c.s, 'customers', live, { automaticEmail: { ...live.automaticEmail, [purpose]: { ...live.automaticEmail?.[purpose], enabled: false, at: now, by: { id: 'email-recipient', name: 'Email link recipient (unverified)' }, reference: `Explicit withdrawal using the ${purpose === 'reviews' ? 'review request' : 'quote-follow-up'} email link` } } })
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'reminder.customerWithdrawal', summary: `Email link recipient stopped ${label}; other notice consent unchanged`, data: { purpose, identity: 'LINK_RECIPIENT_UNVERIFIED' } })
    try { await commit(db, c, before, 'reminder.customerWithdrawal', hash, { stopped: true }) }
    catch (error) { if ((await load(db)).version !== before.version || /constraint/i.test(String(error))) fail('PREFERENCE_CHANGED', 'The preference changed. Reopen this link to check its current state.', null, 409); throw error }
    return json({ available: true, stopped: true, purpose: label })
  } catch (error) {
    if (error instanceof Problem) return json({ error: { code: error.code, message: error.message } }, error.status)
    throw error
  }
}
