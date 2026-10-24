import { authority } from './access'
import { business, event, fail, find, newId, oneOf, text, type Context, type Row } from './model'
import { providerEvent } from './timeline'
import { actorRef, connected, smsText, consentReason, kinds, owner, phone, purposeOf, record, sidPattern, type Sms } from './sms-shared'

const pending = new WeakMap<Context, { messageId: string; text: string }[]>()

/** Reserve metadata with the command. Bodies exist only in this Context's lifetime. */
export function queueSms(c: Context, m: Sms): Row {
  owner(c)
  oneOf(m.kind, kinds, 'kind')
  const sms = connected(c.s), customer = find(c.s, 'customers', m.customerId), to = phone(m.to)
  const reason = consentReason(customer, to, m.kind, c.now)
  if (reason) fail('SMS_CONSENT', 'Customer texts are unavailable for this number or time.', { reason })
  const subject = find(c.s, purposeOf(m.kind) === 'quotes' ? 'quotes' : 'visits', m.subjectId)
  if (m.subjectKind !== (purposeOf(m.kind) === 'quotes' ? 'quote' : 'visit')) fail('INPUT', 'The text must refer to its quote or visit.', null, 400)
  const job = subject.jobId ? find(c.s, 'jobs', subject.jobId) : null
  if ((subject.customerId ?? job?.customerId) !== customer.id || (subject.jobId ?? null) !== m.jobId) fail('INPUT', 'The text must refer to this customer and job.', null, 400)
  const body = smsText(c.s, m.text, m.kind)
  const row = putMessage(c, { id: newId(), version: 1, createdAt: c.now, channel: 'sms', direction: 'outbound', kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, customerId: customer.id, jobId: m.jobId, to, from: sms.fromNumber, provider: 'twilio', connectionId: sms.connectionId, ...(subject.startAt ? { visitStartAt: subject.startAt, visitEndAt: subject.endAt, visitTechnicianId: subject.technicianId } : { quoteRevision: subject.revisions?.at(-1)?.n }), by: actorRef(c) })
  const list = pending.get(c) ?? []; list.push({ messageId: row.id, text: body }); pending.set(c, list)
  event(c, { jobId: m.jobId, subjectKind: 'message', subjectId: row.id, kind: 'sms.queued', summary: `${c.actor.name} queued a customer text through Twilio; delivery is not reported`, data: { messageId: row.id, kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, provider: 'twilio' } })
  return row
}
function putMessage(c: Context, row: Row) { c.s.messages.push(row); return row }
function subjectReason(row: Row, subject: Row | null, job: Row | null, now: string) {
  if (!subject || subject.erasedAt || job?.erasedAt) return 'subject_removed'
  if ((subject.customerId ?? job?.customerId) !== row.customerId) return 'customer_changed'
  if (row.subjectKind === 'quote') {
    const revision = subject.revisions?.at(-1)
    if (subject.status !== 'sent' || !revision?.approval || revision.n !== row.quoteRevision || !revision.validTo || Date.parse(revision.validTo) <= Date.parse(now) || (subject.customerRequests ?? []).some((r: Row) => r.revision === revision.n)) return 'quote_closed_or_expired'
  } else if (subject.startAt !== row.visitStartAt || subject.endAt !== row.visitEndAt || subject.technicianId !== row.visitTechnicianId || (row.kind === 'cancelled' ? subject.status !== 'cancelled' : subject.status !== 'booked' || Date.parse(subject.startAt) <= Date.parse(now))) return 'visit_changed'
  return null
}

/** Called only after command commit. A durable claim precedes exactly one fetch. */
export async function deliverSms(db: D1Database, c: Context) {
  const list = pending.get(c) ?? []; pending.delete(c)
  for (const m of list) {
    const row = await record(db, 'messages', m.messageId)
    if (!row || row.channel !== 'sms' || row.provider !== 'twilio') continue
    const b = await record(db, 'business'), customer = await record(db, 'customers', row.customerId), subject = await record(db, row.subjectKind === 'quote' ? 'quotes' : 'visits', row.subjectId), job = row.jobId ? await record(db, 'jobs', row.jobId) : null
    const sms = b?.sms, now = new Date().toISOString(), key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='sms'").first<{ value: string }>())?.value
    let status = 'suppressed', code = c.local ? 'development' : !sms?.enabled || !key || sms.connectionId !== row.connectionId || sms.fromNumber !== row.from ? 'connection_changed' : !customer ? 'customer_removed' : consentReason(customer, row.to, row.kind, now) ?? subjectReason(row, subject, job, now), providerMessageId: string | null = null
    if (!code && b && customer && subject && key) {
      const a = authority(c.actor), snapshots = [['business', b], ['customers', customer], [row.subjectKind === 'quote' ? 'quotes' : 'visits', subject], ['messages', row], ...(job ? [['jobs', job]] : [])] as [string, Row][]
      const claimed = await db.prepare(`INSERT OR IGNORE INTO glove_sms_attempts(message_id,connection_id,attempted_at) SELECT ?,?,? WHERE (${a.sql}) AND ${snapshots.map(() => "EXISTS(SELECT 1 FROM glove_records WHERE kind=? AND id=? AND version=? AND data=?)").join(' AND ')} AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='sms' AND value=?)`).bind(row.id, sms.connectionId, now, ...a.params, ...snapshots.flatMap(([kind, value]) => [kind, value.id, value.version, JSON.stringify(value)]), key).run()
      if (!claimed.meta.changes) continue
      const callback = new URL('/api/glove/sms/events', sms.origin); callback.searchParams.set('messageId', row.id); callback.searchParams.set('connectionId', sms.connectionId)
      try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sms.accountSid}/Messages.json`, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { authorization: `Basic ${btoa(`${sms.accountSid}:${key}`)}`, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ From: sms.fromNumber, To: row.to, Body: m.text, StatusCallback: callback.href }) })
        const value = await response.json().catch(() => null) as any
        if (response.ok && sidPattern.test(value?.sid ?? '') && value.account_sid === sms.accountSid && value.to === row.to && value.from === sms.fromNumber) {
          providerMessageId = value.sid
          await db.prepare("UPDATE glove_sms_attempts SET provider_message_id=? WHERE message_id=? AND (provider_message_id IS NULL OR provider_message_id=?) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='messages' AND id=? AND json_extract(data,'$.to')=?)").bind(providerMessageId, row.id, providerMessageId, row.id, row.to).run()
          status = 'accepted'; code = null
        } else { status = response.status >= 400 && response.status < 500 ? 'rejected' : 'uncertain'; code = Number.isInteger(value?.code) ? String(value.code) : `http_${response.status}` }
      } catch { status = 'uncertain'; code = 'provider_not_confirmed' }
    }
    await db.batch([
      db.prepare("DELETE FROM glove_sms_attempts WHERE message_id=? AND NOT EXISTS(SELECT 1 FROM glove_records WHERE kind='messages' AND id=?)").bind(row.id, row.id),
      db.prepare("DELETE FROM glove_sms_receipts WHERE message_id=? AND NOT EXISTS(SELECT 1 FROM glove_records WHERE kind='messages' AND id=?)").bind(row.id, row.id),
      providerEvent(db, { id: `sms:${row.id}:send`, at: new Date().toISOString(), commandId: c.commandId, provider: 'Twilio', jobId: row.jobId, subjectKind: 'message', subjectId: row.id, recipientGuard: row.to, kind: `sms.${status}`, summary: status === 'accepted' ? 'Twilio accepted the text; delivery is not reported' : status === 'uncertain' ? 'Twilio did not confirm the text; check provider activity before sending again' : status === 'suppressed' ? 'Glove suppressed the text before a provider attempt' : 'Twilio refused the text', data: { messageId: row.id, provider: 'twilio', providerMessageId, status, code } }),
    ])
  }
}

/** Merge into the email map only for rows whose channel is SMS. */
export async function smsMessageStates(db: D1Database, messages: Row[]) {
  const facts = (await db.prepare("SELECT subject_id,kind,at,data FROM glove_events WHERE subject_kind='message' AND actor_role='provider' AND kind LIKE 'sms.%' ORDER BY sequence").all<{ subject_id: string; kind: string; at: string; data: string }>()).results
  const rank: Record<string, number> = { queued: 0, uncertain: 0, accepted: 1, sending: 2, sent: 3, delivered: 4, undelivered: 4, failed: 4, rejected: 4, suppressed: 4 }
  const folded = new Map<string, { status: string; at: string; providerMessageId: string | null }>()
  for (const fact of facts) {
    const status = fact.kind.slice(4)
    if (!(status in rank)) continue
    const data = JSON.parse(fact.data), old = folded.get(fact.subject_id)
    if (!old || rank[status] >= rank[old.status]) folded.set(fact.subject_id, { status, at: fact.at, providerMessageId: data.providerMessageId ?? old?.providerMessageId ?? null })
  }
  return new Map(messages.filter(m => m.channel === 'sms').map(m => {
    const fact = folded.get(m.id), status = m.direction === 'inbound' ? 'received' : fact?.status ?? 'queued'
    const labels: Record<string, string> = { queued: 'Queued; no Twilio answer yet', accepted: 'Accepted by Twilio; delivery is not reported', sending: 'Twilio is sending the text', sent: 'Twilio sent the text to the carrier; delivery is not reported', delivered: 'Delivered, as reported by Twilio', undelivered: 'Twilio reported the text was not delivered', failed: 'Twilio reported the text failed', rejected: 'Twilio refused the text', suppressed: 'Glove suppressed the text before a provider attempt', uncertain: 'Outcome unknown; Twilio did not confirm the text', received: 'Incoming text reported by Twilio' }
    return [m.id, { status, at: fact?.at ?? m.createdAt, providerMessageId: fact?.providerMessageId ?? m.providerMessageId ?? null, text: labels[status], next: ['uncertain', 'queued'].includes(status) ? 'Check Twilio activity before sending again; Glove does not retry.' : null }]
  }))
}
