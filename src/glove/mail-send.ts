// COMM-001: fixed provider endpoints; no owner-controlled fetch destinations.
import { createHmac, createHash } from 'node:crypto'
import { createMailSender, type MailMessage, type MailResult } from '../mail-delivery.mjs'
import type { Row } from './model'
export function sesKey(value: string) {
  const k = JSON.parse(value)
  if (!k || !/^[A-Z0-9]{16,128}$/.test(k.accessKeyId) || typeof k.secretAccessKey !== 'string' || k.secretAccessKey.length < 16 || k.secretAccessKey.length > 256 || (k.sessionToken !== undefined && (typeof k.sessionToken !== 'string' || k.sessionToken.length > 4096))) throw new Error('Invalid SES credential')
  return k as { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
}
const sha = (value: string) => createHash('sha256').update(value).digest('hex')
const hmac = (key: string | Uint8Array, value: string) => createHmac('sha256', key).update(value).digest()
export function customerMailSender(mail: Row, key: string) {
  if (!['postmark', 'ses'].includes(mail.provider)) return createMailSender({ provider: mail.provider, mode: 'production', apiKey: key })
  return { async send(m: MailMessage): Promise<MailResult> {
    let url: string, body: string, headers: Record<string, string>
    if (mail.provider === 'postmark') {
      url = 'https://api.postmarkapp.com/email'
      body = JSON.stringify({ From: m.from, To: m.to.join(','), Subject: m.subject, TextBody: m.text, ...(m.replyTo ? { ReplyTo: m.replyTo } : {}), MessageStream: 'outbound', Metadata: { glove_delivery_id: m.deliveryId } })
      headers = { 'content-type': 'application/json', accept: 'application/json', 'x-postmark-server-token': key }
    } else {
      const k = sesKey(key), region = mail.sns.region, host = `email.${region}.amazonaws.com`, path = '/v2/email/outbound-emails'
      url = `https://${host}${path}`
      body = JSON.stringify({ FromEmailAddress: m.from, Destination: { ToAddresses: m.to }, ...(m.replyTo ? { ReplyToAddresses: [m.replyTo] } : {}), Content: { Simple: { Subject: { Data: m.subject, Charset: 'UTF-8' }, Body: { Text: { Data: m.text, Charset: 'UTF-8' } } } }, ConfigurationSetName: mail.sns.configurationSet, EmailTags: [{ Name: 'glove_delivery_id', Value: btoa(m.deliveryId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }] })
      const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''), day = timestamp.slice(0, 8), scope = `${day}/${region}/ses/aws4_request`
      headers = { 'content-type': 'application/json', host, 'x-amz-date': timestamp, ...(k.sessionToken ? { 'x-amz-security-token': k.sessionToken } : {}) }
      const names = Object.keys(headers).sort(), signed = names.join(';'), canonical = ['POST', path, '', names.map(n => `${n}:${headers[n]}\n`).join(''), signed, sha(body)].join('\n')
      const signing = hmac(hmac(hmac(hmac(`AWS4${k.secretAccessKey}`, day), region), 'ses'), 'aws4_request')
      headers.authorization = `AWS4-HMAC-SHA256 Credential=${k.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${Array.from(hmac(signing, `AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${sha(canonical)}`), x => x.toString(16).padStart(2, '0')).join('')}`
    }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch(url, { method: 'POST', headers, body, redirect: 'manual', signal: controller.signal })
      if (!response.ok) return { provider: mail.provider, status: response.status === 429 ? 'rate_limited' : response.status >= 500 ? 'uncertain' : 'rejected', providerMessageId: null, code: `http_${response.status}` }
      const result = await response.json() as any
      if (mail.provider === 'postmark' && result.ErrorCode !== 0) return { provider: mail.provider, status: 'rejected', providerMessageId: null, code: 'provider_refused' }
      return { provider: mail.provider, status: typeof result.MessageID === 'string' || typeof result.MessageId === 'string' ? 'accepted' : 'uncertain', providerMessageId: result.MessageID ?? result.MessageId ?? null }
    } catch { return { provider: mail.provider, status: 'uncertain', providerMessageId: null, code: 'unconfirmed' } }
    finally { clearTimeout(timer) }
  } }
}
