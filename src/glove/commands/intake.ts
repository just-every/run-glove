import { allow } from '../access'
import { bump, business, event, expectVersion, fail, find, newId, text } from '../model'
import { configureRequestPhotos } from '../request-photo-policy'
import type { Handler } from './types'

/** Exact browser origins, never a URL containing a path or credential. */
function embedOrigin(value: unknown): string {
  const raw = text(value, 'allowedOrigins', { max: 300 })
  try {
    const u = new URL(raw)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
    if ((u.protocol === 'https:' || u.protocol === 'http:' && local) && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash && u.origin !== 'null') return u.origin
  } catch { /* Refuse malformed origins below. */ }
  return fail('INPUT', 'An embed origin is https://host, without a path or credential (local development may use http).', null, 400)
}

/** BOOK-001 configuration is a signed-in owner's explicit standing authority.
 * The key follows existing installation-private provider custody; it is never
 * returned, put in a business record, or called encrypted storage. */
export const intake: Handler = async (c, type, p, db) => {
  if (!['intake.configure', 'intake.withdrawPhotos'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch) fail('FORBIDDEN', 'Only the signed-in, unscoped owner configures website requests.', null, 403)
  if (type === 'intake.withdrawPhotos') {
    const enquiry = find(c.s, 'enquiries', p.enquiryId)
    expectVersion(enquiry, p.version)
    const consent = enquiry.intake?.photoConsent
    if (!consent || consent.withdrawnAt) fail('PHOTO_CONSENT', 'This request has no active photo permission.')
    if (p.senderRequested !== true) fail('PHOTO_CONSENT', 'Confirm that the sender requested this withdrawal.', null, 400)
    const withdrawal = { withdrawnAt: c.now, withdrawnBy: { id: c.actor.id, name: c.actor.name }, withdrawalReason: text(p.reason, 'reason', { max: 1000 }) }
    const result = bump(c.s, 'enquiries', enquiry, { intake: { ...enquiry.intake, photoConsent: { ...consent, ...withdrawal } } })
    event(c, { jobId: null, subjectKind: 'enquiry', subjectId: enquiry.id, kind: 'intake.photosWithdrawn', summary: `${c.actor.name} recorded the sender's withdrawal of model photo permission`, data: withdrawal })
    return result
  }
  const b = business(c.s)
  expectVersion(b, p.version)
  if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
  if (!Array.isArray(p.allowedOrigins) || p.allowedOrigins.length > 20) fail('INPUT', 'allowedOrigins is a list of at most 20 exact website origins.', null, 400)
  const allowedOrigins = [...new Set<string>(p.allowedOrigins.map(embedOrigin))]
  const siteKey = p.enabled ? text(p.siteKey, 'siteKey', { max: 200 }) : ''
  if (siteKey && !/^[A-Za-z0-9_-]+$/.test(siteKey)) fail('INPUT', 'siteKey is the Turnstile public site key.', null, 400)
  const secret = p.secret === undefined ? null : text(p.secret, 'secret', { max: 1000 })
  if (p.enabled && !secret && !await db.prepare("SELECT 1 FROM glove_provider_keys WHERE provider='turnstile'").first()) fail('INTAKE_KEY', 'Enter the Turnstile secret before enabling website requests.', null, 400)
  if (!p.enabled) c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='turnstile'", params: [] })
  else if (secret) c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('turnstile',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [secret, c.actor.id, c.now] })
  const modelPhotos = p.enabled ? configureRequestPhotos(c, b, p) : { enabled: false }
  const settings = { enabled: p.enabled, siteKey, allowedOrigins, modelPhotos, configId: newId(), updatedAt: c.now, by: { id: c.actor.id, name: c.actor.name } }
  bump(c.s, 'business', b, { intake: settings })
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'intake.configured', summary: `${c.actor.name} ${p.enabled ? 'enabled' : 'disabled'} website requests`, data: { enabled: p.enabled, allowedOrigins, modelPhotosEnabled: modelPhotos.enabled, modelPhotoPolicy: modelPhotos } })
  return settings
}
