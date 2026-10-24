import { bump, business, event, expectVersion, fail, find, newId, oneOf, text } from './model'
import type { Handler } from './commands/types'
import { accountPattern, actorRef, owner, phone, zone } from './sms-shared'

/** Private credentials are committed with settings, never returned in outcomes. */
export const smsCommands: Handler = async (c, type, p) => {
  if (!['sms.connect', 'sms.configure', 'sms.consent'].includes(type)) return undefined
  owner(c)
  if (c.actor.reminderRun) fail('FORBIDDEN', 'A scheduled pass cannot change text settings.', null, 403)
  const b = business(c.s)
  if (type === 'sms.consent') {
    const customer = find(c.s, 'customers', p.customerId); expectVersion(customer, p.version)
    const purpose = oneOf(p.purpose, ['visits', 'quotes'] as const, 'purpose')
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
    const address = phone(customer.phone)
    if (p.address !== address) fail('CONSENT', 'Consent must name the current customer number.')
    if (p.enabled && customer.smsOptOut?.blocked && customer.smsOptOut.address === address) fail('CONSENT', 'The customer must send START before the owner records new purpose consent.')
    const consent = { enabled: p.enabled, address, at: c.now, source: text(p.source, 'consent source', { max: 300 }), wording: text(p.wording, 'consent wording', { max: 2000 }), timezone: zone(p.timezone), by: actorRef(c) }
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: type, summary: `Owner recorded ${purpose} text ${p.enabled ? 'consent' : 'withdrawal'}`, data: { purpose, enabled: p.enabled } })
    return bump(c.s, 'customers', customer, { automaticSms: { ...customer.automaticSms, [purpose]: consent } })
  }
  expectVersion(b, p.version)
  if (type === 'sms.configure') {
    if (!b.sms || typeof p.enabled !== 'boolean') fail('INPUT', 'Connect Twilio and set enabled to true or false.', null, 400)
    if (p.enabled && p.approved !== true) fail('CONSENT', 'Explicitly approve enabling registered customer texts first.')
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: `Owner ${p.enabled ? 'enabled' : 'disabled'} customer texts; customer consent and quiet hours remain required`, data: { enabled: p.enabled } })
    return bump(c.s, 'business', b, { sms: { ...b.sms, enabled: p.enabled } })
  }
  if (p.provider === null) {
    c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider='sms'", params: [] })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'sms.disconnected', summary: 'Owner disconnected customer texts', data: null })
    return bump(c.s, 'business', b, { sms: null })
  }
  oneOf(p.provider, ['twilio'] as const, 'provider')
  const accountSid = text(p.accountSid, 'accountSid', { max: 34 }), authToken = text(p.authToken, 'authToken', { max: 32 }), fromNumber = phone(p.fromNumber)
  if (!accountPattern.test(accountSid) || !/^[0-9a-f]{32}$/i.test(authToken) || !/^\+1[2-9]\d{9}$/.test(fromNumber)) fail('INPUT', 'Use the Twilio account, its auth token and a registered US business number.', null, 400)
  const registration = oneOf(p.registration, ['a2p10dlc', 'tollFree'] as const, 'registration')
  if (p.registered !== true || p.live !== true) fail('SMS', 'Confirm the number is already live and its registration or toll-free verification is complete.')
  let origin: URL
  try { origin = new URL(c.origin ?? '') } catch { return fail('INPUT', 'The installation needs its public callback origin.', null, 400) }
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/' || origin.protocol !== 'https:' && !(c.local && origin.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname))) fail('INPUT', 'Use the installation HTTPS origin for Twilio callbacks.', null, 400)
  c.sql.push({ sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('sms',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [authToken, c.actor.id, c.now] })
  const sms = { provider: 'twilio', accountSid, fromNumber, registration, origin: origin.origin, connectionId: newId(), enabled: false, connectedAt: c.now, by: actorRef(c) }
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'sms.connected', summary: 'Owner connected an existing registered US Twilio number; customer texts remain disabled', data: { provider: 'twilio', registration } })
  return bump(c.s, 'business', b, { sms })
}
