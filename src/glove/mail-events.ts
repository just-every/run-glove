import { createDeliveryEventIntake, createD1EventStore, type DeliveryEvent } from '../mail-delivery.mjs'
import { providerEvent } from './timeline'
import { providerName } from './mail'
import type { Row } from './model'

// COMM-001: POST /api/glove/mail/events is the owner's provider event webhook
// (SendGrid's signed Event Webhook or Resend's Svix-signed webhook). Base's
// intake verifies the signature with the owner's event key, keeps each event
// once and orders each recipient's state; an event is accepted only for a
// message Glove sent to exactly that recipient. Each accepted delivery fact is
// then a provider event on the message's timeline, written once per event.

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const answer = (body: unknown, status = 200) => Response.json(body, { status, headers })
const limit = 1_048_576
const said: Record<string, string> = { delivered: 'delivered it to', bounced: 'reported a bounce from', complained: 'reported a spam complaint from', deferred: 'is still trying', failed: 'gave up delivering to', rejected: 'refused to send to', accepted: 'accepted the email for' }

export async function mailEvents(request: Request, db: D1Database): Promise<Response | null> {
  if (new URL(request.url).pathname !== '/api/glove/mail/events') return null
  if (request.method !== 'POST') return answer({ ok: false, error: { code: 'METHOD', message: 'The provider posts delivery events here.' } }, 405)
  const business = await db.prepare("SELECT data FROM glove_records WHERE kind='business' AND id='business'").first<{ data: string }>()
  const mail = business ? JSON.parse(business.data).mail : null
  const key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='mail-events'").first<{ value: string }>())?.value
  if (!mail || !key) return answer({ ok: false, error: { code: 'MAIL', message: 'Customer email is not connected here.' } }, 404)
  if (Number(request.headers.get('content-length') ?? 0) > limit) return answer({ ok: false, error: { code: 'SIZE', message: 'At most 1 MiB of events at once.' } }, 413)
  const rawBody = new Uint8Array(await request.arrayBuffer())
  if (rawBody.length > limit) return answer({ ok: false, error: { code: 'SIZE', message: 'At most 1 MiB of events at once.' } }, 413)
  const messages = new Map((await db.prepare("SELECT data FROM glove_records WHERE kind='messages'").all<{ data: string }>()).results.map(r => JSON.parse(r.data) as Row).map(m => [m.id, m]))
  const receipts = new Map((await db.prepare("SELECT subject_id AS id,json_extract(data,'$.providerMessageId') AS receipt FROM glove_events WHERE subject_kind='message' AND kind='email.accepted'").all<{ id: string; receipt: string | null }>()).results.filter(r => r.receipt).map(r => [r.receipt!, r.id]))
  const accepted: { event: DeliveryEvent; message: Row }[] = []
  const intake = createDeliveryEventIntake({
    provider: mail.provider, tenantId: 'glove', eventNamespace: mail.namespace, key, store: createD1EventStore({ db }),
    // Read-only: the event must name a message Glove sent through this provider, and only its recipient.
    authorize: async event => {
      const message = messages.get(event.deliveryId ?? '') ?? messages.get(receipts.get(event.providerMessageId) ?? '')
      if (!message || message.provider !== mail.provider || !event.recipients.every(r => r.toLowerCase() === message.to.toLowerCase())) return false
      accepted.push({ event, message })
      return true
    },
  })
  try { await intake.ingestWebhook({ rawBody, headers: request.headers }) }
  catch { return answer({ ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } }, 401) }
  // A replayed event was already kept by the intake; writing its fact again changes nothing.
  for (const { event, message } of accepted) {
    if (!event.status) continue
    const occurredAt = new Date(event.occurredAt).toISOString()
    await providerEvent(db, { id: `mail:${mail.provider}:${event.eventId}:${message.id}`, at: new Date().toISOString(), commandId: `mail-event:${event.eventId}`, provider: providerName(mail.provider), jobId: message.jobId, subjectKind: 'message', subjectId: message.id, kind: `email.${event.status}`, summary: `${providerName(mail.provider)} ${said[event.status] ?? event.status} ${message.to} (${message.subject})`, data: { messageId: message.id, provider: mail.provider, providerMessageId: event.providerMessageId, eventId: event.eventId, status: event.status, occurredAt } }).run()
  }
  return answer({ ok: true, events: accepted.length })
}
