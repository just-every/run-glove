import { bump, business, event, expectVersion, fail, find, newId, type Row } from './model'
import type { Handler } from './commands/types'
import { actorRef, digest, isSmsAddress, owner, phone, record } from './sms-shared'
import { verifyTwilioSignature } from './sms-events'
import { queueSms } from './sms-delivery'
import { bookingHash, offeredJob } from './booking-offers'
import { providerEvent } from './timeline'
import { currentStatusOwner, statusOwnerAuthority } from './visit-status-policy'

export const voiceCommands: Handler = async (c, type, p, db) => {
  if (!['voice.configure', 'voice.textBack'].includes(type)) return undefined
  owner(c)
  if (c.actor.reminderRun) fail('FORBIDDEN', 'A scheduled pass cannot configure or send call replies.', null, 403)
  const b = business(c.s)
  if (type === 'voice.textBack') {
    const call = find(c.s, 'conversations', p.callId); expectVersion(call, p.version)
    if (call.provider !== 'twilio' || call.outcome !== 'missed' || call.textBack || !call.customerId) fail('CALL_STATE', 'Choose an unreplied missed call with one known customer.')
    const customer = find(c.s, 'customers', call.customerId)
    if (customer.phone !== call.caller) fail('SMS_CONSENT', 'The caller no longer matches the current customer number.')
    const offer = find(c.s, 'bookingOffers', p.offerId)
    if (offer.customerId !== customer.id || offer.revokedAt || offer.usedAt || offer.expiresAt <= c.now || offer.offeredBy?.id !== c.actor.id) fail('BOOKING_LINK', 'Choose your current booking offer for this customer.')
    offeredJob(c, offer)
    if (typeof p.token !== 'string' || !/^glb_[A-Za-z0-9_-]{43}$/.test(p.token) || !await db.prepare('SELECT 1 AS ok FROM glove_booking_secrets WHERE link_id=? AND hash=?').bind(offer.id, bookingHash(p.token)).first()) fail('BOOKING_LINK', 'Use the original booking offer credential.')
    const message = queueSms(c, { kind: 'missedCall', subjectKind: 'customer', subjectId: customer.id, customerId: customer.id, jobId: offer.jobId, to: call.caller, text: `Sorry we missed your call. Choose a service time: ${c.origin}/book#token=${p.token}`, label: 'the missed-call booking reply' })
    message.voiceCallId = call.id; message.bookingOfferId = offer.id
    event(c, { jobId: offer.jobId, subjectKind: 'conversation', subjectId: call.id, kind: 'voice.textBack', summary: `Owner explicitly requested one missed-call booking text for ${call.providerCallId}; delivery is not confirmed`, data: { customerId: customer.id, messageId: message.id, providerCallId: call.providerCallId, bookingOfferId: offer.id } })
    return bump(c.s, 'conversations', call, { textBack: message.id })
  }
  expectVersion(b, p.version)
  if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
  if (!p.enabled) {
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner disabled incoming call routing', data: { enabled: false } })
    return bump(c.s, 'business', b, { voice: { ...b.voice, enabled: false } })
  }
  if (!b.sms || p.approved !== true) fail('CONSENT', 'Connect the existing Twilio number and explicitly approve its call routing.')
  if (p.recording === true) fail('RECORDING_POLICY', 'Call recording is unavailable pending recording consent and custody approval.')
  if (!Array.isArray(p.phones) || !p.phones.length || p.phones.length > 5) fail('INPUT', 'Choose one to five office and on-call phones in ring order.', null, 400)
  const phones = p.phones.map(phone), forward = p.forward ? phone(p.forward) : null
  if (new Set([...phones, ...(forward ? [forward] : [])]).size !== phones.length + (forward ? 1 : 0) || [...phones, forward].includes(b.sms.fromNumber)) fail('INPUT', 'Use distinct destinations other than the business number.', null, 400)
  const voice = { enabled: true, configId: newId(), connectionId: b.sms.connectionId, phones, forward, recording: false, by: actorRef(c), operatorVersion: c.actor.operatorVersion, branchRevision: c.actor.branchRevision ?? 0, approvedAt: c.now }
  event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner approved ordered office and on-call routing; recording and automatic text-back remain off', data: { enabled: true, destinations: phones.length, forwarding: !!forward, recording: false, automaticTextBack: false } })
  return bump(c.s, 'business', b, { voice })
}

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
const xml = (body = '') => new Response(`<Response>${body}</Response>`, { headers: { ...headers, 'content-type': ['text', 'xml'].join('/') } })
const reject = () => new Response(null, { status: 401, headers })
const esc = (value: string) => value.replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]!))
const callSid = /^CA[0-9a-f]{32}$/i
const terminal = ['completed', 'busy', 'no-answer', 'failed', 'canceled']

/** Voice callbacks authenticate before reads of caller data or any business effect. */
export async function voiceEvents(request: Request, db: D1Database): Promise<Response | null> {
  const url = new URL(request.url), incoming = url.pathname === '/api/glove/voice/inbound'
  if (!incoming && url.pathname !== '/api/glove/voice/dial') return null
  if (request.method !== 'POST') return new Response(null, { status: 405, headers })
  const b = await record(db, 'business'), sms = b?.sms, policy = b?.voice
  const key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='sms'").first<{ value: string }>())?.value
  if (!sms || !key) return reject()
  let form: URLSearchParams
  try {
    if (request.headers.get('content-type')?.split(';')[0] !== ['application', 'x-www-form-urlencoded'].join('/')) return reject()
    const reader = request.body?.getReader(); if (!reader) return reject()
    const parts: Uint8Array[] = []; let size = 0
    for (;;) {
      const part = await reader.read(); if (part.done) break
      size += part.value.length
      if (size > 16384) { await reader.cancel(); return reject() }
      parts.push(part.value)
    }
    const bytes = new Uint8Array(size); let offset = 0
    for (const part of parts) { bytes.set(part, offset); offset += part.length }
    form = new URLSearchParams(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (url.origin !== sms.origin || url.username || url.password || !verifyTwilioSignature(request.url, form, request.headers.get('x-twilio-signature') ?? '', key) || form.get('AccountSid') !== sms.accountSid || !callSid.test(form.get('CallSid') ?? '') || form.get('To') !== sms.fromNumber || !isSmsAddress(form.get('From'))) return reject()
  } catch { return reject() }
  // Restore imports no provider key; reconnect changes the connection identity.
  const routing = policy?.enabled && policy.connectionId === sms.connectionId && await currentStatusOwner(db, policy)
  if (incoming && !routing) return xml('<Hangup/>')
  const sid = form.get('CallSid')!, id = `voice:${digest(`${sms.accountSid}:${sid}`)}`, old = await record(db, 'conversations', id)
  const now = new Date().toISOString(), route = policy?.phones ? [...policy.phones, ...(policy.forward ? [policy.forward] : [])] : []
  const render = (step: number) => {
    if (step >= route.length) return '<Hangup/>'
    const callback = new URL('/api/glove/voice/dial', sms.origin)
    callback.searchParams.set('callId', id); callback.searchParams.set('step', String(step))
    return `<Dial action="${esc(callback.href)}" method="POST" timeout="20" callerId="${esc(sms.fromNumber)}"><Number>${esc(route[step])}</Number></Dial>`
  }
  const fingerprint = digest([...form.entries()].sort(([a], [z]) => a.localeCompare(z)).map(([k, v]) => `${k.length}:${k}${v.length}:${v}`).join(''))
  let row: Row, response: string, kind: string, receipt: string
  if (incoming) {
    if (url.search || form.get('CallStatus') !== 'ringing') return reject()
    if (old) return old.initialFingerprint === fingerprint ? xml(old.configId === policy.configId && old.outcome === 'ringing' && old.nextStep === 0 ? old.initialResponse : '<Hangup/>') : reject()
    // The saved callback identity survives personal-outcome erasure as an inert tombstone.
    if (await db.prepare('SELECT 1 AS ok FROM glove_commands WHERE id=?').bind(id).first()) return xml('<Hangup/>')
    const matches = (await db.prepare("SELECT data FROM glove_records WHERE kind='customers' AND json_extract(data,'$.phone')=?").bind(form.get('From')).all<{ data: string }>()).results.map(r => JSON.parse(r.data) as Row).filter(c => !c.erasedAt && !c.mergedInto)
    // Never re-create erased customer data or pick an identity at a shared number.
    if (matches.length !== 1) return xml('<Hangup/>')
    response = render(0); kind = 'voice.received'; receipt = 'inbound'
    row = { id, version: 1, createdAt: now, customerId: matches[0].id, jobId: null, kind: 'call', provider: 'twilio', providerCallId: sid, connectionId: sms.connectionId, configId: policy.configId, caller: form.get('From'), direction: 'inbound', outcome: 'ringing', durationSeconds: 0, minutes: 0, recording: null, recordingNotice: 'Not recorded', text: 'Business-number call; recording is off', by: { id: 'provider:Twilio', name: 'Twilio', role: 'provider' }, nextStep: 0, initialFingerprint: fingerprint, initialResponse: response, routeCount: route.length, receipts: {} }
  } else {
    const step = Number(url.searchParams.get('step'))
    if (url.searchParams.size !== 2 || url.searchParams.get('callId') !== id || !Number.isInteger(step) || step < 0 || !old || step >= old.routeCount || old.connectionId !== sms.connectionId || old.caller !== form.get('From') || !callSid.test(form.get('DialCallSid') ?? '') || !terminal.includes(form.get('DialCallStatus') ?? '') || !/^\d{1,5}$/.test(form.get('DialCallDuration') ?? '')) return reject()
    receipt = `dial:${step}`
    const previous = old.receipts[receipt]
    if (previous) return previous.fingerprint === fingerprint ? xml(routing && old.configId === policy.configId && old.outcome === 'ringing' && old.nextStep === step + 1 ? previous.response : '<Hangup/>') : reject()
    if (old.nextStep !== step || old.outcome !== 'ringing') return reject()
    const customer = await record(db, 'customers', old.customerId)
    if (!customer || customer.erasedAt || customer.mergedInto || customer.phone !== old.caller) return xml('<Hangup/>')
    const answered = form.get('DialCallStatus') === 'completed', nextStep = step + 1
    const durationSeconds = Number(form.get('DialCallDuration'))
    const stop = !routing || old.configId !== policy.configId || nextStep >= old.routeCount
    response = answered || stop ? '<Hangup/>' : render(nextStep)
    kind = answered ? 'voice.answered' : stop ? 'voice.missed' : 'voice.routeFailed'
    row = { ...old, version: old.version + 1, nextStep, outcome: answered ? 'answered' : stop ? 'missed' : 'ringing', durationSeconds: old.durationSeconds + durationSeconds, minutes: (old.durationSeconds + durationSeconds) / 60, receipts: { ...old.receipts, [receipt]: { fingerprint, response, providerCallId: form.get('DialCallSid'), status: form.get('DialCallStatus'), durationSeconds } } }
  }
  const customer = await record(db, 'customers', row.customerId)
  if (!customer || customer.erasedAt || customer.mergedInto || customer.phone !== row.caller) return xml('<Hangup/>')
  const meta = await db.prepare('SELECT version FROM glove_meta WHERE id=1').first<{ version: number }>(), a = incoming || response !== '<Hangup/>' ? statusOwnerAuthority(policy) : { sql: '1', params: [] }
  const callGuard = old ? { sql: "EXISTS(SELECT 1 FROM glove_records WHERE kind='conversations' AND id=? AND version=? AND data=?)", params: [id, old.version, JSON.stringify(old)] } : { sql: "NOT EXISTS(SELECT 1 FROM glove_records WHERE kind='conversations' AND id=?)", params: [id] }
  try {
    await db.batch([
      db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (${a.sql}) AND (SELECT version FROM glove_meta WHERE id=1)=? AND EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND id=? AND version=? AND data=?) AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='sms' AND value=?) AND (${callGuard.sql}) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='customers' AND id=? AND version=? AND data=?) THEN 1 ELSE 0 END)`).bind(newId(), ...a.params, meta?.version, b!.id, b!.version, JSON.stringify(b), key, ...callGuard.params, customer.id, customer.version, JSON.stringify(customer)),
      db.prepare("INSERT INTO glove_records(kind,id,version,data) VALUES('conversations',?,?,?) ON CONFLICT(kind,id) DO UPDATE SET version=excluded.version,data=excluded.data,revision=NULL").bind(id, row.version, JSON.stringify(row)),
      ...(incoming ? [db.prepare('INSERT INTO glove_commands(id,actor_id,type,digest,result,created_at) VALUES(?,?,?,?,?,?)').bind(id, 'provider:Twilio', 'voice.callback', fingerprint, JSON.stringify({ ok: true, result: { id, customerId: row.customerId } }), now)] : []),
      providerEvent(db, { id: `${id}:${receipt}`, at: now, commandId: `${id}:${receipt}`, provider: 'Twilio', subjectKind: 'conversation', subjectId: id, kind, summary: kind === 'voice.received' ? `Twilio reported incoming call ${sid}; recording is off` : `Twilio reported call ${sid}: ${row.outcome}, ${row.durationSeconds} seconds; leg ${form.get('DialCallSid')}`, data: { customerId: row.customerId, providerCallId: sid, dialCallId: incoming ? null : form.get('DialCallSid'), status: incoming ? 'ringing' : form.get('DialCallStatus'), durationSeconds: row.durationSeconds, recording: false } }),
      db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1'), db.prepare('DELETE FROM glove_guard'),
    ])
  } catch {
    const raced = await record(db, 'conversations', id)
    const previous = incoming ? raced?.initialFingerprint === fingerprint && raced.initialResponse : raced?.receipts?.[receipt]?.fingerprint === fingerprint && raced.receipts[receipt].response
    if (previous) {
      const latest = await record(db, 'business')
      const permitted = latest?.voice?.enabled && latest.voice.configId === row.configId && latest.sms?.connectionId === sms.connectionId && await currentStatusOwner(db, latest.voice)
      return xml(permitted && raced?.outcome === 'ringing' ? previous : '<Hangup/>')
    }
    return new Response(null, { status: 503, headers })
  }
  return xml(response)
}
