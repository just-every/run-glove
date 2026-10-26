import { createHmac, timingSafeEqual } from 'node:crypto'
import { newId, type Row } from './model'
import { providerEvent } from './timeline'
import { digest, isSmsAddress, record, sidPattern } from './sms-shared'

/** Twilio signs the exact external URL and every decoded form field. */
export function verifyTwilioSignature(url: string, form: URLSearchParams, signature: string, authToken: string) {
  if (!/^[A-Za-z0-9+/]{27}=$/.test(signature)) return false
  const names = [...new Set(form.keys())].sort()
  if (names.some(name => form.getAll(name).length !== 1)) return false
  const value = url + names.map(name => name + form.get(name)).join('')
  const expected = createHmac('sha1', authToken).update(value).digest('base64')
  return timingSafeEqual(new TextEncoder().encode(expected), new TextEncoder().encode(signature))
}
const callbackHeaders = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
const rejected = () => Response.json({ ok: false, error: { code: 'SMS_EVENT', message: 'The callback was not accepted.' } }, { status: 401, headers: callbackHeaders })
const acknowledged = () => new Response('<Response></Response>', { headers: { ...callbackHeaders, 'content-type': ['text', 'xml'].join('/') } })
async function boundedForm(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== ['application', 'x-www-form-urlencoded'].join('/')) throw new Error('Invalid form')
  const reader = request.body?.getReader(); if (!reader) throw new Error('Invalid form')
  const parts: Uint8Array[] = []; let size = 0
  for (;;) {
    const part = await reader.read(); if (part.done) break
    size += part.value.length
    if (size > 65536) { await reader.cancel(); throw new Error('Invalid form') }
    parts.push(part.value)
  }
  const bytes = new Uint8Array(size); let offset = 0
  for (const part of parts) { bytes.set(part, offset); offset += part.length }
  return new URLSearchParams(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
}
export type SmsReply = { customerId: string; messageId: string; providerMessageId: string; action: 'confirm' | 'reschedule' | 'decline'; at: string }
/** Optional parent integration adds reply effects to this same guarded batch. */
export type SmsReplyEffects = { guards?: { sql: string; params: unknown[] }[]; statements: D1PreparedStatement[] }
export type SmsReplyHandler = (reply: SmsReply, db: D1Database) => Promise<SmsReplyEffects>

/** Signature and account checks precede customer and message reads and every write. */
export async function smsEvents(request: Request, db: D1Database, replyHandler?: SmsReplyHandler): Promise<Response | null> {
  const url = new URL(request.url), incoming = url.pathname === '/api/glove/sms/inbound'
  if (!incoming && url.pathname !== '/api/glove/sms/events') return null
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: callbackHeaders })
  const b = await record(db, 'business'), sms = b?.sms, key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='sms'").first<{ value: string }>())?.value
  if (!sms || !key) return rejected()
  let form: URLSearchParams
  try {
    form = await boundedForm(request)
    if (url.origin !== sms.origin || url.username || url.password || !verifyTwilioSignature(request.url, form, request.headers.get('x-twilio-signature') ?? '', key) || form.get('AccountSid') !== sms.accountSid || !sidPattern.test(form.get('MessageSid') ?? '')) return rejected()
    if (incoming && (url.search || form.get('To') !== sms.fromNumber || !isSmsAddress(form.get('From')))) return rejected()
  } catch { return rejected() }
  const sid = form.get('MessageSid')!, now = new Date().toISOString()
  const fingerprint = digest([...form.entries()].sort(([a], [z]) => a < z ? -1 : a > z ? 1 : 0).map(([k, v]) => `${k.length}:${k}${v.length}:${v}`).join(''))
  const status = incoming ? 'inbound' : form.get('MessageStatus')
  if (!incoming && !['queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed'].includes(status ?? '')) return rejected()
  const receiptId = digest(`${sms.connectionId}:${sid}:${status}`)
  const previous = await db.prepare('SELECT fingerprint FROM glove_sms_receipts WHERE receipt_id=?').bind(receiptId).first<{ fingerprint: string }>()
  if (previous) return previous.fingerprint === fingerprint ? acknowledged() : rejected()
  const version = await db.prepare('SELECT version FROM glove_meta WHERE id=1').first<{ version: number }>()
  const statements: D1PreparedStatement[] = [], changed: { kind: string; row: Row; oldVersion: number }[] = []
  let message: Row, response: SmsReply['action'] | undefined, customer: Row | undefined
  if (incoming) {
    const customers = (await db.prepare("SELECT data FROM glove_records WHERE kind='customers' AND json_extract(data,'$.phone')=?").bind(form.get('From')).all<{ data: string }>()).results.map(r => JSON.parse(r.data) as Row).filter(r => !r.erasedAt && !r.mergedInto)
    if (!customers.length) return acknowledged()
    const word = (form.get('Body') ?? '').trim().toUpperCase(), opt = form.get('OptOutType')
    const action = opt === 'STOP' || ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'REVOKE', 'OPTOUT'].includes(word) ? 'stop' : opt === 'START' || ['START', 'UNSTOP'].includes(word) ? 'start' : opt === 'HELP' || ['HELP', 'INFO'].includes(word) ? 'help' : ['CONFIRM', 'YES'].includes(word) ? 'confirm' : word === 'RESCHEDULE' ? 'reschedule' : ['NO', 'DECLINE'].includes(word) ? 'decline' : 'other'
    // A shared number cannot authorize a visit response for one identity.
    customer = customers.length === 1 ? customers[0] : undefined
    if (['confirm', 'reschedule', 'decline'].includes(action) && customer) response = action as SmsReply['action']
    if (action === 'stop' || action === 'start') for (const row of customers) {
      const automaticSms = { ...row.automaticSms }
      if (action === 'stop') for (const purpose of ['visits', 'quotes', 'payments']) if (automaticSms[purpose]) automaticSms[purpose] = { ...automaticSms[purpose], enabled: false }
      changed.push({ kind: 'customers', oldVersion: row.version, row: { ...row, version: row.version + 1, automaticSms, smsOptOut: { blocked: action === 'stop', address: form.get('From'), at: now, provider: 'twilio' } } })
    }
    message = { id: `sms-inbound:${receiptId}`, version: 1, createdAt: now, channel: 'sms', direction: 'inbound', kind: 'smsReply', reply: action, subjectKind: 'customer', subjectId: customer?.id ?? customers[0].id, customerId: customer?.id ?? customers[0].id, jobId: null, ambiguousSender: !customer, ...(customer && sms.inboxEnabled && sms.enabled && customer.automaticSms?.visits?.enabled && customer.automaticSms.visits.address === form.get('From') ? { body: (form.get('Body') ?? '').slice(0, 1200) } : {}), from: form.get('From'), to: sms.fromNumber, provider: 'twilio', providerMessageId: sid, connectionId: sms.connectionId, by: { id: 'provider:Twilio', name: 'Twilio', role: 'provider' } }
    statements.push(db.prepare("INSERT INTO glove_records(kind,id,version,data) VALUES('messages',?,1,?)").bind(message.id, JSON.stringify(message)))
  } else {
    const found = await record(db, 'messages', url.searchParams.get('messageId') ?? '')
    if (!found) return acknowledged()
    if (url.searchParams.size !== 2 || url.searchParams.get('connectionId') !== sms.connectionId || found.channel !== 'sms' || found.provider !== 'twilio' || found.connectionId !== sms.connectionId || found.from !== sms.fromNumber || form.get('From') !== sms.fromNumber || form.get('To') !== found.to) return rejected()
    const attempt = await db.prepare('SELECT provider_message_id FROM glove_sms_attempts WHERE message_id=? AND connection_id=?').bind(found.id, sms.connectionId).first<{ provider_message_id: string | null }>()
    if (!attempt || attempt.provider_message_id && attempt.provider_message_id !== sid) return rejected()
    message = found
    statements.push(db.prepare('UPDATE glove_sms_attempts SET provider_message_id=? WHERE message_id=? AND (provider_message_id IS NULL OR provider_message_id=?)').bind(sid, message.id, sid))
  }
  const guards: { sql: string; params: unknown[] }[] = [{ sql: "EXISTS(SELECT 1 FROM glove_records WHERE kind='business' AND id=? AND version=? AND data=?) AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='sms' AND value=?) AND (SELECT version FROM glove_meta WHERE id=1)=?", params: [b!.id, b!.version, JSON.stringify(b), key, version?.version] }]
  if (response && customer && replyHandler) {
    const effects = await replyHandler({ customerId: customer.id, messageId: message.id, providerMessageId: sid, action: response, at: now }, db)
    guards.push(...(effects.guards ?? [])); statements.push(...effects.statements)
  }
  for (const item of changed) statements.push(db.prepare('UPDATE glove_records SET version=?,data=?,revision=NULL WHERE kind=? AND id=? AND version=?').bind(item.row.version, JSON.stringify(item.row), item.kind, item.row.id, item.oldVersion))
  statements.push(providerEvent(db, { id: `sms-event:${receiptId}`, at: now, commandId: `sms-event:${receiptId}`, provider: 'Twilio', jobId: message.jobId, subjectKind: 'message', subjectId: message.id, recipientGuard: message.to, kind: incoming ? `sms.received.${message.reply}` : `sms.${status}`, summary: incoming ? `Twilio reported an incoming customer text: ${message.reply}` : `Twilio reported text status: ${status}`, data: { messageId: message.id, provider: 'twilio', providerMessageId: sid, status, ...(incoming ? { action: message.reply } : {}), ...(/^\d{1,8}$/.test(form.get('ErrorCode') ?? '') ? { code: form.get('ErrorCode') } : {}) } }))
  try {
    await db.batch([
      db.prepare(`INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN ${guards.map(g => `(${g.sql})`).join(' AND ')} THEN 1 ELSE 0 END)`).bind(newId(), ...guards.flatMap(g => g.params)),
      db.prepare('INSERT INTO glove_sms_receipts(receipt_id,fingerprint,message_id) VALUES(?,?,?)').bind(receiptId, fingerprint, message.id),
      ...statements,
      db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1'),
      db.prepare('DELETE FROM glove_guard'),
    ])
  } catch {
    const raced = await db.prepare('SELECT fingerprint FROM glove_sms_receipts WHERE receipt_id=?').bind(receiptId).first<{ fingerprint: string }>()
    if (raced?.fingerprint === fingerprint) return acknowledged()
    return new Response(null, { status: 503, headers: callbackHeaders })
  }
  return acknowledged()
}
