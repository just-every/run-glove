import { createD1EventStore } from '../mail-delivery.mjs'
import { authenticate, callbackAuth, hash, normalize } from './mail-callbacks'
import { providerEvent } from './timeline'
import { providerName } from './mail'
import type { Row } from './model'

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const answer = (body: unknown, status = 200) => Response.json(body, { status, headers })
const limit = 1_048_576
const said: Record<string, string> = { delivered: 'delivered it to', bounced: 'reported a bounce from', complained: 'reported a spam complaint from', deferred: 'is still trying', failed: 'gave up delivering to', rejected: 'refused to send to', accepted: 'accepted the email for' }
// Only rejected unauthenticated traffic consumes this shared transient allowance.
async function reject(request: Request, rejectionLimits: DurableObjectNamespace | undefined, authenticated = false) {
  let status = 401
  if (!authenticated) {
    try {
      if (!rejectionLimits) throw new Error('Rejection allowance unavailable')
      const address = await hash(request.headers.get('cf-connecting-ip') ?? 'unknown')
      const response = await rejectionLimits.get(rejectionLimits.idFromName(address)).fetch('https://mail-rejections.invalid', {
        method: 'POST', body: JSON.stringify({ minute: Math.floor(Date.now() / 60_000) }),
      })
      if (response.status !== 204) status = 429
    } catch { status = 429 }
  }
  console.warn('Customer email callback rejected')
  return answer({ ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } }, status)
}

export async function mailEvents(request: Request, db: D1Database, rejectionLimits?: DurableObjectNamespace): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/glove/mail/events') return null
  if (request.method !== 'POST') return answer({ ok: false, error: { code: 'METHOD', message: 'The provider posts delivery events here.' } }, 405)
  const business = await db.prepare("SELECT data FROM glove_records WHERE kind='business' AND id='business'").first<{ data: string }>()
  const mail = business ? JSON.parse(business.data).mail : null
  const key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='mail-events'").first<{ value: string }>())?.value
  const connected = await db.prepare("SELECT 1 FROM glove_provider_keys WHERE provider='mail'").first()
  if (!mail || !connected || (!key && !['postmark', 'ses'].includes(mail.provider))) return answer({ ok: false, error: { code: 'MAIL', message: 'Customer email is not connected here.' } }, 404)
  const now = Date.now()
  let authenticated = false
  let rawBody: Uint8Array, verified: Awaited<ReturnType<typeof authenticate>>, events: Awaited<ReturnType<typeof normalize>>
  try {
    if (Number(request.headers.get('content-length') ?? 0) > limit) return reject(request, rejectionLimits)
    rawBody = new Uint8Array(await request.arrayBuffer()); if (rawBody.length > limit) return reject(request, rejectionLimits)
    verified = await authenticate(request, rawBody, mail, key ?? '', await callbackAuth(db, mail.namespace), now)
    authenticated = true
    // A signed SNS control message concerns the pinned subscription, not a
    // customer message. No SubscribeURL can be fetched before verification.
    if (verified && verified.envelope.Type !== 'Notification') {
      const e = verified.envelope, fingerprint = await hash(rawBody)
      const previous = await db.prepare('SELECT fingerprint FROM glove_mail_sns_receipts WHERE namespace=? AND message_id=?').bind(mail.namespace, e.MessageId).first<{ fingerprint: string }>()
      if (previous) { if (previous.fingerprint !== fingerprint) return reject(request, rejectionLimits, true); return answer({ ok: true }) }
      const claimed = await db.prepare('INSERT OR IGNORE INTO glove_mail_sns_receipts(namespace,message_id,fingerprint) VALUES(?,?,?)').bind(mail.namespace, e.MessageId, fingerprint).run()
      if (!claimed.meta.changes) return answer({ ok: true })
      if (e.Type === 'SubscriptionConfirmation') {
        try { const response = await fetch(verified.subscription!, { redirect: 'manual' }); if (!response.ok) throw new Error() }
        catch { await subscriptionFact(db, mail, e.MessageId, 'confirmationFailed'); return answer({ ok: true }) }
      }
      await subscriptionFact(db, mail, e.MessageId, e.Type === 'SubscriptionConfirmation' ? 'confirmed' : 'unsubscribed')
      await markVerified(db, mail.namespace, now)
      return answer({ ok: true })
    }
    events = await normalize(rawBody, request.headers, mail, verified, now)
  } catch { return reject(request, rejectionLimits, authenticated) }
  // Authentication and the whole schema have passed. Only now read messages.
  const messages = new Map((await db.prepare("SELECT data FROM glove_records WHERE kind='messages'").all<{ data: string }>()).results.map(r => JSON.parse(r.data) as Row).map(m => [m.id, m]))
  for (const r of (await db.prepare("SELECT subject_id AS id,data FROM glove_events WHERE subject_kind='brief' AND kind='email.queued'").all<{ id: string; data: string }>()).results) {
    const d = JSON.parse(r.data); messages.set(r.id, { id: r.id, version: 1, kind: 'morningBrief', provider: d.provider, to: d.to, jobId: null, subject: d.subject })
  }
  const receipts = new Map((await db.prepare("SELECT subject_id AS id,json_extract(data,'$.providerMessageId') AS receipt FROM glove_events WHERE subject_kind IN ('message','brief') AND kind='email.accepted'").all<{ id: string; receipt: string | null }>()).results.filter(r => r.receipt).map(r => [r.receipt!, r.id]))
  const matched: { event: typeof events[number]; message: Row }[] = []
  for (const event of events) {
    const message = messages.get(event.deliveryId ?? '') ?? messages.get(receipts.get(event.providerMessageId) ?? '')
    if (!message || message.provider !== mail.provider) continue
    if (!event.recipients.every(r => r.toLowerCase() === message.to.toLowerCase())) return reject(request, rejectionLimits, true)
    matched.push({ event, message })
  }
  // Authenticated-but-unmatched events have NO effect, including no stored ID,
  // verified-at change, warning, Activity row, suppression or subscription.
  if (!matched.length) return answer({ ok: true })
  if (verified) {
    const previous = await db.prepare('SELECT fingerprint FROM glove_mail_sns_receipts WHERE namespace=? AND message_id=?').bind(mail.namespace, verified.envelope.MessageId).first<{ fingerprint: string }>()
    if (previous && previous.fingerprint !== await hash(rawBody)) return reject(request, rejectionLimits, true)
  }
  try { await createD1EventStore({ db }).commit(matched.map(x => x.event)) }
  catch { return reject(request, rejectionLimits, true) }
  // IDs and content are already authenticated and fully authorized. Timeline
  // facts use deterministic IDs, so a replay also repairs an interrupted write.
  for (const { event, message } of matched) {
    if (!event.status) continue
    const occurredAt = new Date(event.occurredAt).toISOString()
    await providerEvent(db, { id: `mail:${mail.provider}:${event.eventId}:${message.id}`, at: new Date().toISOString(), commandId: `mail-event:${event.eventId}`, provider: providerName(mail.provider), jobId: message.jobId, subjectKind: message.kind === 'morningBrief' ? 'brief' : 'message', subjectId: message.id, kind: `email.${event.status}`, summary: `${providerName(mail.provider)} ${said[event.status] ?? event.status} ${message.to} (${message.subject})`, data: { messageId: message.id, provider: mail.provider, providerMessageId: event.providerMessageId, eventId: event.eventId, status: event.status, occurredAt } }).run()
  }
  if (verified) await db.prepare('INSERT OR IGNORE INTO glove_mail_sns_receipts(namespace,message_id,fingerprint) VALUES(?,?,?)').bind(mail.namespace, verified.envelope.MessageId, await hash(rawBody)).run()
  await markVerified(db, mail.namespace, now)
  return answer({ ok: true })
}
const markVerified = (db: D1Database, namespace: string, now: number) => db.prepare('INSERT INTO glove_mail_callback_auth(namespace,verified_at) VALUES(?,?) ON CONFLICT(namespace) DO UPDATE SET verified_at=excluded.verified_at').bind(namespace, new Date(now).toISOString()).run()
async function subscriptionFact(db: D1Database, mail: Row, id: string, status: string) {
  await providerEvent(db, { id: `sns:${mail.namespace}:${id}`, at: new Date().toISOString(), commandId: `sns:${id}`, provider: 'Amazon SES', subjectKind: 'business', subjectId: 'business', kind: `mail.subscription.${status}`, summary: status === 'confirmed' ? 'Amazon SNS confirmed the email-event subscription' : status === 'unsubscribed' ? 'Warning: Amazon SNS cancelled the email-event subscription; reconnect it to receive delivery outcomes' : 'Warning: Amazon SNS subscription confirmation outcome is unknown; check the subscription in AWS', data: { provider: 'ses', status, messageId: id } }).run()
}
