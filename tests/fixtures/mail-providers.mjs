import { randomBytes, randomUUID, generateKeyPairSync, createHmac, sign } from 'node:crypto'
import { snsEvents } from '../api/harness.mjs'

// Only the provider network edge is synthetic; commands and callbacks are real.
export async function connectMail(h, provider) {
  const sns = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:glove-mail', configurationSet: 'glove-outcomes' }
  const secret = 'synthetic-glove-1'
  const apiKey = provider === 'ses' ? JSON.stringify({ accessKeyId: 'SYNTHETICGLOVE0001', secretAccessKey: secret }) : secret
  const connection = { provider, apiKey, fromEmail: ['office', 'example.test'].join('@'), ...(provider === 'ses' ? { sns } : {}) }
  const connected = await h.command('mail.connect', connection)
  const signer = provider === 'ses' ? snsEvents(sns, { days: 30 }) : null
  if (signer) h.email.certificates.set(signer.certUrl, signer.cert)
  return { connection, secret, callback(m, outcome = 'delivered', at = new Date().toISOString()) {
    if (provider === 'postmark') return { raw: JSON.stringify({ RecordType: outcome === 'bounced' ? 'Bounce' : 'Delivery', Type: 'HardBounce', ID: `${m.id}:${outcome}`, MessageID: m.receipt, Recipient: m.to, DeliveredAt: at, Metadata: { glove_delivery_id: m.id } }), headers: { authorization: `Basic ${Buffer.from(`glove:${connected.callbackPassword}`).toString('base64')}` } }
    const type = outcome === 'bounced' ? 'Bounce' : 'Delivery'
    return signer.signed({ eventType: type, mail: { messageId: m.receipt, timestamp: at, destination: [m.to], tags: { 'ses:configuration-set': [sns.configurationSet], glove_delivery_id: [Buffer.from(m.id).toString('base64url')] } }, [type.toLowerCase()]: { timestamp: at, recipients: [m.to], ...(type === 'Bounce' ? { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: m.to }] } : {}) } }, { Timestamp: at })
  } }
}
export const receipt = (h, m) => ({ ...m, receipt: `${({ sendgrid: 'sg', resend: 're', postmark: 'pm', ses: 'ses' })[h.email.sent.at(-1).provider]}-receipt-${h.email.sent.length}` })
export const textOf = sent => sent.provider === 'postmark' ? sent.body.TextBody : sent.provider === 'ses' ? sent.body.Content.Simple.Body.Text.Data : sent.body.content[0].value
export const deliveryIdOf = sent => sent.provider === 'postmark' ? sent.body.Metadata.glove_delivery_id : sent.provider === 'ses' ? Buffer.from(sent.body.EmailTags[0].Value, 'base64url').toString() : sent.body.custom_args.rer_delivery_id

// Postmark's documented Delivery, Bounce and SpamComplaint webhook fields:
// https://postmarkapp.com/developer/webhooks/bounce-webhook
// https://postmarkapp.com/developer/webhooks/delivery-webhook
// https://postmarkapp.com/developer/webhooks/spam-complaint-webhook
export function postmarkOutcome(message, details, at) {
  return {
    MessageStream: 'outbound', ServerID: 23, MessageID: message.receipt,
    Metadata: { glove_delivery_id: message.id },
    ...(details.RecordType === 'Delivery'
      ? { Recipient: message.to, DeliveredAt: at, Details: '250 2.0.0 OK' }
      : { Email: message.to, BouncedAt: at, DumpAvailable: false }),
    ...details,
  }
}

// Real Postmark callback bytes and Basic credentials for the public event door.
export function postmarkCallback(message, password, { at, id, details = {}, headers = {} } = {}) {
  return {
    raw: JSON.stringify(postmarkOutcome(message, { RecordType: 'Delivery', ...(id === undefined ? {} : { ID: id }), ...details }, at)),
    headers: { authorization: `Basic ${Buffer.from(`glove:${password}`).toString('base64')}`, ...headers },
  }
}

// Real provider encodings and signatures; only certificate retrieval and mail
// transport are answered by the installation's network edge.
export async function callbackProvider(h, provider, { at }) {
  const sns = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:glove-mail', configurationSet: 'glove-outcomes' }
  const keys = provider === 'sendgrid' ? generateKeyPairSync('ec', { namedCurve: 'prime256v1' }) : null
  const secret = randomBytes(32)
  const eventKey = keys ? keys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64') : `whsec_${secret.toString('base64')}`
  const connection = { provider, apiKey: provider === 'ses' ? JSON.stringify({ accessKeyId: 'synthetic-glove-100'.replaceAll('-', '').toUpperCase(), secretAccessKey: 'synthetic-glove-2' }) : 'synthetic-glove-3', fromEmail: ['office', 'example.test'].join('@'), ...(['sendgrid', 'resend'].includes(provider) ? { eventKey } : {}), ...(provider === 'ses' ? { sns } : {}) }
  const connected = await h.command('mail.connect', connection)
  const signer = provider === 'ses' ? snsEvents(sns, { days: 30 }) : null
  if (signer) h.email.certificates.set(signer.certUrl, signer.cert)
  const signedRaw = (raw, { id = randomUUID() } = {}) => {
    const timestamp = String(Date.parse(at) / 1000)
    const headers = keys ? { 'x-twilio-email-event-webhook-timestamp': timestamp, 'x-twilio-email-event-webhook-signature': sign('sha256', Buffer.from(timestamp + raw), keys.privateKey).toString('base64') }
      : provider === 'resend' ? { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${createHmac('sha256', secret).update(`${id}.${timestamp}.${raw}`).digest('base64')}` }
      : { authorization: `Basic ${Buffer.from(`glove:${connected.callbackPassword}`).toString('base64')}` }
    return { raw, headers }
  }
  const signed = (payload, options = {}) => signer ? signer.signed(payload, { Timestamp: at, ...options }) : signedRaw(JSON.stringify(payload), options)
  const event = (m, { id = randomUUID(), status = 'delivered', at: occurredAt = at, recipients = [m.to] } = {}) => {
    if (provider === 'sendgrid') return recipients.map((email, i) => ({ email, timestamp: Date.parse(occurredAt) / 1000, event: ({ delivered: 'delivered', bounced: 'bounce', complained: 'spamreport', optedOut: 'unsubscribe' })[status], sg_event_id: `${id}:${i}`, sg_message_id: m.receipt, rer_delivery_id: m.id }))
    if (provider === 'resend') return { type: `email.${status}`, created_at: occurredAt, data: { email_id: m.receipt, to: recipients } }
    if (provider === 'postmark') return postmarkOutcome(m, { RecordType: ({ delivered: 'Delivery', bounced: 'Bounce', complained: 'SpamComplaint' })[status], Type: 'HardBounce', ID: id, Recipient: recipients[0] }, occurredAt)
    const type = ({ delivered: 'Delivery', bounced: 'Bounce', complained: 'Complaint' })[status]
    return { eventType: type, mail: { messageId: m.receipt, timestamp: occurredAt, destination: recipients, tags: { 'ses:configuration-set': [sns.configurationSet], glove_delivery_id: [Buffer.from(m.id).toString('base64url')] } }, [type.toLowerCase()]: { timestamp: occurredAt, recipients, ...(type === 'Bounce' ? { bounceType: 'Permanent', bouncedRecipients: recipients.map(emailAddress => ({ emailAddress })) } : {}), ...(type === 'Complaint' ? { complainedRecipients: recipients.map(emailAddress => ({ emailAddress })) } : {}) } }
  }
  const badSignature = input => {
    const headers = { ...input.headers }
    if (provider === 'ses') return { ...input, raw: JSON.stringify({ ...JSON.parse(input.raw), Signature: Buffer.alloc(256).toString('base64') }) }
    if (provider === 'sendgrid') headers['x-twilio-email-event-webhook-signature'] = Buffer.alloc(64).toString('base64')
    if (provider === 'resend') headers['svix-signature'] = `v1,${Buffer.alloc(32).toString('base64')}`
    if (provider === 'postmark') headers.authorization = `Basic ${Buffer.from(`glove:${'0'.repeat(64)}`).toString('base64')}`
    return { ...input, headers }
  }
  return { connection, signer, password: connected.callbackPassword, signed, event, badSignature,
    callback: (m, options) => signed(event(m, options), options),
    malformed: () => signer ? signer.signed(null, { Timestamp: at, Message: '{' }) : signedRaw('{'),
  }
}
