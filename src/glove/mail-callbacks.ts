// COMM-001 callback authentication (ct scope-review-66). Only authenticated
// bytes reach normalization, message lookup or durable effects.
import { X509Certificate, verify, timingSafeEqual } from 'node:crypto'
import { verifyWebhook } from '../mail-delivery.mjs'
import type { DeliveryEvent } from '../mail-delivery.mjs'
import { isAddress } from './mail'
import type { Row } from './model'

export const hash = async (value: string | Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? new TextEncoder().encode(value) : value as Uint8Array<ArrayBuffer>)), x => x.toString(16).padStart(2, '0')).join('')
export const password = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('')
export type CallbackAuth = { current_hash: string | null; previous_hash: string | null; previous_until: string | null; verified_at: string | null }
export const callbackAuth = (db: D1Database, namespace: string) => db.prepare('SELECT * FROM glove_mail_callback_auth WHERE namespace=?').bind(namespace).first<CallbackAuth>()
const requireThat: (ok: unknown) => asserts ok = ok => { if (!ok) throw new Error('Invalid callback') }
const id = (value: unknown, max = 1024): string => { requireThat(typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value)); return value }
const date = (value: unknown, now: number, age?: number) => {
  requireThat(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?(?:Z|[+-]\d\d:\d\d)$/.test(value))
  const day = new Date(`${value.slice(0, 10)}T00:00:00Z`), ms = Date.parse(value)
  requireThat(Number.isFinite(ms) && day.toISOString().slice(0, 10) === value.slice(0, 10) && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60 && ms <= now + 300_000 && (age === undefined || ms >= now - age))
  return ms
}
const recipient = (value: unknown) => { requireThat(isAddress(value)); return value }
export function snsSettings(p: any) {
  const region = id(p?.region, 40), topicArn = id(p?.topicArn, 256), configurationSet = id(p?.configurationSet, 64)
  requireThat(/^[a-z]{2}-[a-z]+-\d$/.test(region) && new RegExp(`^arn:aws:sns:${region}:\\d{12}:[A-Za-z0-9_-]+$`).test(topicArn) && /^[A-Za-z0-9_-]+$/.test(configurationSet))
  return { region, topicArn, configurationSet }
}

// Postmark's documented outbound webhook addresses, checked 21 October 2026:
// https://postmarkapp.com/support/article/800-ips-for-firewalls
// Optional and OFF by default; Basic authentication is always required.
const postmarkIPs = new Set(['3.134.147.250', '50.31.156.6', '50.31.156.77', '18.217.206.57'])
export async function basic(request: Request, auth: CallbackAuth | null, allowlist: boolean, now: number) {
  requireThat(new URL(request.url).protocol === 'https:')
  const header = request.headers.get('authorization') ?? ''
  requireThat(/^Basic [A-Za-z0-9+/]+={0,2}$/.test(header) && header.length <= 256)
  const plain = atob(header.slice(6)); requireThat(/^glove:[a-f0-9]{64}$/.test(plain))
  const digest = await hash(plain.slice(6)), candidates = [auth?.current_hash, auth?.previous_until && Date.parse(auth.previous_until) > now ? auth.previous_hash : null]
  let valid = false
  for (const candidate of candidates) if (candidate) valid = timingSafeEqual(new TextEncoder().encode(digest), new TextEncoder().encode(candidate)) || valid
  requireThat(valid && (!allowlist || postmarkIPs.has(request.headers.get('cf-connecting-ip') ?? '')))
}

const certificates = new Map<string, { cert: X509Certificate; until: number }>()
const snsHost = (region: string) => `sns.${region}.amazonaws.com`
function pinnedUrl(value: unknown, region: string, certificate: boolean) {
  const url = new URL(id(value, 2048))
  requireThat(url.protocol === 'https:' && url.hostname === snsHost(region) && !url.port && !url.username && !url.password && !url.hash)
  if (certificate) requireThat(/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname) && !url.search)
  return url
}
export type Sns = { envelope: any; subscription: URL | null }
export async function sns(request: Request, raw: Uint8Array, settings: Row, now: number): Promise<Sns> {
  // SNS signs an envelope, so its bounded envelope must be decoded to verify it.
  // No SES payload parsing, message lookup, subscription or arbitrary fetch yet.
  const envelope = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)), e = envelope
  requireThat(e && typeof e === 'object' && ['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation'].includes(e.Type) && request.headers.get('x-amz-sns-message-type') === e.Type && e.TopicArn === settings.topicArn && ['1', '2'].includes(e.SignatureVersion))
  id(e.MessageId, 256); requireThat(typeof e.Message === 'string' && e.Message.length > 0 && e.Message.length <= 1_048_576); date(e.Timestamp, now, 3_600_000)
  const url = pinnedUrl(e.SigningCertURL, settings.region, true)
  let subscription: URL | null = null
  if (e.Type !== 'Notification') {
    id(e.Token, 4096); subscription = pinnedUrl(e.SubscribeURL, settings.region, false)
    requireThat(subscription.pathname === '/' && subscription.searchParams.get('Action') === 'ConfirmSubscription' && subscription.searchParams.get('TopicArn') === settings.topicArn && subscription.searchParams.get('Token') === e.Token && [...subscription.searchParams.keys()].every(k => ['Action', 'TopicArn', 'Token'].includes(k)) && [...subscription.searchParams.keys()].length === 3)
  }
  const fields = e.Type === 'Notification' ? ['Message', 'MessageId', ...(e.Subject === undefined ? [] : ['Subject']), 'Timestamp', 'TopicArn', 'Type'] : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
  const canonical = fields.map(k => `${k}\n${k === 'Message' ? e.Message : id(e[k], 1_048_576)}\n`).join('')
  const signature = id(e.Signature, 2048); requireThat(/^[A-Za-z0-9+/]+={0,2}$/.test(signature))
  let cached = certificates.get(url.href)
  if (!cached || cached.until <= now) {
    const response = await fetch(url, { redirect: 'manual' }); requireThat(response.ok)
    const bytes = new Uint8Array(await response.arrayBuffer()); requireThat(bytes.length <= 32_768)
    const cert = new X509Certificate(bytes)
    requireThat(Date.parse(cert.validFrom) <= now && Date.parse(cert.validTo) >= now && cert.publicKey.asymmetricKeyType === 'rsa')
    cached = { cert, until: Math.min(now + 3_600_000, Date.parse(cert.validTo)) }
    if (certificates.size >= 32) certificates.delete(certificates.keys().next().value!)
    certificates.set(url.href, cached)
  }
  requireThat(verify(e.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256', new TextEncoder().encode(canonical), cached.cert.publicKey, Uint8Array.from(atob(signature), c => c.charCodeAt(0))))
  return { envelope, subscription }
}

export async function authenticate(request: Request, raw: Uint8Array, mail: Row, key: string, auth: CallbackAuth | null, now: number) {
  if (mail.provider === 'postmark') { await basic(request, auth, !!mail.postmarkAllowlist, now); return null }
  if (mail.provider === 'ses') return sns(request, raw, mail.sns, now)
  requireThat(await verifyWebhook({ provider: mail.provider, rawBody: raw, headers: request.headers, key, now }))
  return null
}
const sgStatuses: Record<string, DeliveryEvent['status']> = { processed: 'accepted', deferred: 'deferred', delivered: 'delivered', bounce: 'bounced', dropped: 'rejected', spamreport: 'complained', open: null, click: null, unsubscribe: null, group_unsubscribe: null, group_resubscribe: null }
const reStatuses: Record<string, DeliveryEvent['status']> = { 'email.sent': 'accepted', 'email.delivery_delayed': 'deferred', 'email.delivered': 'delivered', 'email.bounced': 'bounced', 'email.failed': 'failed', 'email.suppressed': 'rejected', 'email.complained': 'complained', 'email.opened': null, 'email.clicked': null }
export async function normalize(raw: Uint8Array, headers: Headers, mail: Row, verified: Sns | null, now: number): Promise<DeliveryEvent[]> {
  let payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))
  if (mail.provider === 'ses') payload = JSON.parse(verified!.envelope.Message)
  const rows = mail.provider === 'sendgrid' ? payload : [payload]
  requireThat(Array.isArray(rows) && rows.length > 0 && rows.length <= 1000)
  return Promise.all(rows.map(async p => {
    requireThat(p && typeof p === 'object' && !Array.isArray(p))
    let eventId: string, providerMessageId: string, type: string, status: DeliveryEvent['status'], occurredAt: number, recipients: string[], deliveryId: string | null = null
    if (mail.provider === 'sendgrid') {
      requireThat(Object.hasOwn(sgStatuses, p.event) && Number.isSafeInteger(p.timestamp) && p.timestamp >= 0 && p.timestamp * 1000 <= now + 300_000)
      eventId = id(p.sg_event_id); providerMessageId = id(p.sg_message_id); type = p.event; status = sgStatuses[type]; occurredAt = p.timestamp * 1000; recipients = [recipient(p.email)]; deliveryId = p.rer_delivery_id === undefined ? null : id(p.rer_delivery_id)
    } else if (mail.provider === 'resend') {
      requireThat(Object.hasOwn(reStatuses, p.type) && Array.isArray(p.data?.to) && p.data.to.length > 0 && p.data.to.length <= 1000)
      eventId = id(headers.get('svix-id')); providerMessageId = id(p.data.email_id); type = p.type; status = reStatuses[type]; occurredAt = date(p.created_at, now); recipients = p.data.to.map(recipient)
    } else if (mail.provider === 'postmark') {
      type = id(p.RecordType); providerMessageId = id(p.MessageID); recipients = [recipient(p.Recipient ?? p.Email)]
      occurredAt = date(p.DeliveredAt ?? p.BouncedAt ?? p.ReceivedAt, now, 7 * 86_400_000)
      if (type === 'Delivery') status = 'delivered'
      else if (type === 'SpamComplaint') status = 'complained'
      else { requireThat(type === 'Bounce' && ['HardBounce', 'SoftBounce'].includes(p.Type)); status = p.Type === 'HardBounce' ? 'bounced' : p.Inactive === true ? 'failed' : 'deferred' }
      eventId = `${type}:${p.ID === undefined ? [providerMessageId, p.Type ?? type, recipients[0], occurredAt].join(':') : id(String(p.ID))}`
      deliveryId = p.Metadata?.glove_delivery_id === undefined ? null : id(p.Metadata.glove_delivery_id)
    } else {
      type = id(p.eventType ?? p.notificationType).replace('Rendering Failure', 'RenderingFailure'); providerMessageId = id(p.mail?.messageId)
      const tags = p.mail?.tags; requireThat(tags?.['ses:configuration-set']?.length === 1 && tags['ses:configuration-set'][0] === mail.sns.configurationSet && tags.glove_delivery_id?.length === 1)
      const tag = id(tags.glove_delivery_id[0], 256); requireThat(/^[A-Za-z0-9_-]+$/.test(tag)); deliveryId = id(atob(tag.replace(/-/g, '+').replace(/_/g, '/')))
      const detail = type === 'RenderingFailure' ? p.failure ?? p.renderingFailure : p[type[0].toLowerCase() + type.slice(1)]
      requireThat(detail && typeof detail === 'object')
      occurredAt = date(detail.timestamp ?? p.mail.timestamp, now)
      recipients = (type === 'Bounce' ? detail.bouncedRecipients?.map((r: any) => r.emailAddress) : type === 'Complaint' ? detail.complainedRecipients?.map((r: any) => r.emailAddress) : detail.recipients ?? p.mail.destination)?.map(recipient)
      requireThat(Array.isArray(recipients) && recipients.length > 0 && recipients.length <= 1000)
      const statuses: Record<string, DeliveryEvent['status']> = { Delivery: 'delivered', DeliveryDelay: 'deferred', Complaint: 'complained', Reject: 'rejected', RenderingFailure: 'rejected' }
      if (type === 'Bounce') { requireThat(['Permanent', 'Transient'].includes(detail.bounceType)); status = detail.bounceType === 'Permanent' ? 'bounced' : 'failed' }
      else { requireThat(Object.hasOwn(statuses, type)); status = statuses[type] }
      eventId = [type, providerMessageId, occurredAt, ...recipients].join(':')
    }
    requireThat(new Set(recipients).size === recipients.length)
    return { provider: mail.provider, tenantId: 'glove', eventNamespace: mail.namespace, eventId, providerMessageId, type, status, occurredAt, recipients, deliveryId, product: null, fingerprint: await hash(JSON.stringify(p)) }
  }))
}
