import { snsEvents } from '../api/harness.mjs'

// Only the provider network edge is synthetic; commands and callbacks are real.
export async function connectMail(h, provider) {
  const sns = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:glove-mail', configurationSet: 'glove-outcomes' }
  const secret = 'synthetic-glove-1'
  const apiKey = provider === 'ses' ? JSON.stringify({ accessKeyId: 'SYNTHETICGLOVE0001', secretAccessKey: secret }) : secret
  const connection = { provider, apiKey, fromEmail: 'office@example.test', ...(provider === 'ses' ? { sns } : {}) }
  const connected = await h.command('mail.connect', connection)
  const signer = provider === 'ses' ? snsEvents(sns, { days: 30 }) : null
  if (signer) h.email.certificates.set(signer.certUrl, signer.cert)
  return { connection, secret, callback(m, outcome = 'delivered', at = new Date().toISOString()) {
    if (provider === 'postmark') return { raw: JSON.stringify({ RecordType: outcome === 'bounced' ? 'Bounce' : 'Delivery', Type: 'HardBounce', ID: `${m.id}:${outcome}`, MessageID: m.receipt, Recipient: m.to, DeliveredAt: at, Metadata: { glove_delivery_id: m.id } }), headers: { authorization: `Basic ${Buffer.from(`glove:${connected.callbackPassword}`).toString('base64')}` } }
    const type = outcome === 'bounced' ? 'Bounce' : 'Delivery'
    return signer.signed({ eventType: type, mail: { messageId: m.receipt, timestamp: at, destination: [m.to], tags: { 'ses:configuration-set': [sns.configurationSet], glove_delivery_id: [Buffer.from(m.id).toString('base64url')] } }, [type.toLowerCase()]: { timestamp: at, recipients: [m.to], ...(type === 'Bounce' ? { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: m.to }] } : {}) } }, { Timestamp: at })
  } }
}
export const receipt = (h, m) => ({ ...m, receipt: `${h.email.sent.at(-1).provider === 'postmark' ? 'pm' : 'ses'}-receipt-${h.email.sent.length}` })
export const textOf = sent => sent.provider === 'postmark' ? sent.body.TextBody : sent.provider === 'ses' ? sent.body.Content.Simple.Body.Text.Data : sent.body.content[0].value
export const deliveryIdOf = sent => sent.provider === 'postmark' ? sent.body.Metadata.glove_delivery_id : sent.provider === 'ses' ? Buffer.from(sent.body.EmailTags[0].Value, 'base64url').toString() : sent.body.custom_args.rer_delivery_id
