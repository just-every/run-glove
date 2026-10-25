import { canonicalJson } from '../modules/import-kit/src/d1/index'
import { authority } from './access'
import { business, event, fail, find, newId, oneOf, text, type Context, type Row } from './model'
import { providerEvent } from './timeline'
import { actorRef, connected, smsText, consentReason, kinds, sender, phone, purposeOf, record, sidPattern, type Sms } from './sms-shared'
import { isStatusKind, statusOwnerAuthority, statusPolicy } from './visit-status-policy'

const pending = new WeakMap<Context, { messageId: string; text: string }[]>()

/** Reserve metadata with the command. Bodies exist only in this Context's lifetime. */
export function queueSms(c: Context, m: Sms): Row {
  sender(c, m.kind)
  oneOf(m.kind, kinds, 'kind')
  const sms = connected(c.s), customer = find(c.s, 'customers', m.customerId), to = phone(m.to)
  const reason = consentReason(customer, to, m.kind, c.now)
  if (reason) fail('SMS_CONSENT', 'Customer texts are unavailable for this number or time.', { reason })
  const subjectKind = m.kind === 'inboxReply' ? 'customer' : purposeOf(m.kind) === 'quotes' ? 'quote' : 'visit'
  if (m.subjectKind !== subjectKind) fail('INPUT', 'The text must refer to its customer, quote or visit.', null, 400)
  const subject = find(c.s, subjectCollection(subjectKind), m.subjectId)
  const job = m.jobId ? find(c.s, 'jobs', m.jobId) : null
  if ((subjectKind === 'customer' ? subject.id : subject.customerId ?? job?.customerId) !== customer.id || subjectKind !== 'customer' && (subject.jobId ?? null) !== m.jobId || job && job.customerId !== customer.id) fail('INPUT', 'The text must refer to this customer and job.', null, 400)
  const policy = isStatusKind(m.kind) ? statusPolicy(c, m.kind) : null
  if (policy) {
    const tech = find(c.s, 'technicians', subject.technicianId)
    if (!tech.active || tech.operatorId !== c.actor.id || (m.kind === 'reportReady' ? subject.status !== 'completed' : m.kind === 'arrival' ? subject.status !== 'arrived' : subject.status !== 'booked' || subject.arrival)) fail('FORBIDDEN', 'Only this visit’s current technician triggers its status notice.', null, 403)
    if (m.kind === 'reportReady' && (!m.reportId || !m.reportLinkId || !c.s.serviceReports.some(r => r.id === m.reportId && r.visitId === subject.id) || !c.s.serviceReportLinks.some(l => l.id === m.reportLinkId && l.reportId === m.reportId && !l.revokedAt))) fail('INPUT', 'A completion notice must carry this visit’s current report link.', null, 400)
  }
  const body = smsText(c.s, m.text, m.kind)
  const row = putMessage(c, { id: m.messageId ?? newId(), version: 1, createdAt: c.now, channel: 'sms', direction: 'outbound', kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, customerId: customer.id, jobId: m.jobId, to, from: sms.fromNumber, provider: 'twilio', connectionId: sms.connectionId, ...(subject.startAt ? { visitStartAt: subject.startAt, visitEndAt: subject.endAt, visitTechnicianId: subject.technicianId } : subjectKind === 'quote' ? { quoteRevision: subject.revisions?.at(-1)?.n } : {}), ...(policy ? { statusApprovedAt: policy.approvedAt } : {}), ...(m.eta ? { eta: m.eta } : {}), ...(m.reportId ? { reportId: m.reportId, reportLinkId: m.reportLinkId } : {}), by: actorRef(c) })
  const list = pending.get(c) ?? []; list.push({ messageId: row.id, text: body }); pending.set(c, list)
  event(c, { jobId: m.jobId, subjectKind: 'message', subjectId: row.id, kind: 'sms.queued', summary: `${c.actor.name} queued a customer text through Twilio; delivery is not reported`, data: { messageId: row.id, kind: m.kind, subjectKind: m.subjectKind, subjectId: m.subjectId, provider: 'twilio' } })
  return row
}
function putMessage(c: Context, row: Row) { c.s.messages.push(row); return row }
const subjectCollection = (kind: string) => kind === 'quote' ? 'quotes' as const : kind === 'customer' ? 'customers' as const : 'visits' as const
function subjectReason(row: Row, subject: Row | null, job: Row | null, now: string) {
  if (!subject || subject.erasedAt || job?.erasedAt) return 'subject_removed'
  if ((row.subjectKind === 'customer' ? subject.id : subject.customerId ?? job?.customerId) !== row.customerId || job && job.customerId !== row.customerId) return 'customer_changed'
  if (row.subjectKind === 'customer') return null
  if (row.subjectKind === 'quote') {
    const revision = subject.revisions?.at(-1)
    if (subject.status !== 'sent' || !revision?.approval || revision.n !== row.quoteRevision || !revision.validTo || Date.parse(revision.validTo) <= Date.parse(now) || (subject.customerRequests ?? []).some((r: Row) => r.revision === revision.n)) return 'quote_closed_or_expired'
  } else if (subject.startAt !== row.visitStartAt || subject.endAt !== row.visitEndAt || subject.technicianId !== row.visitTechnicianId || (row.kind === 'reportReady' ? subject.status !== 'completed' : row.kind === 'arrival' ? subject.status !== 'arrived' : row.kind === 'onMyWay' ? subject.status !== 'booked' || subject.arrival || subject.onMyWay?.messageId !== row.id : row.kind === 'cancelled' ? subject.status !== 'cancelled' : subject.status !== 'booked' || Date.parse(subject.startAt) <= Date.parse(now))) return 'visit_changed'
  return null
}

/** Called only after command commit. A durable claim precedes exactly one fetch. */
export async function deliverSms(db: D1Database, c: Context) {
  const list = pending.get(c) ?? []; pending.delete(c)
  for (const m of list) {
    const row = await record(db, 'messages', m.messageId)
    if (!row || row.channel !== 'sms' || row.provider !== 'twilio') continue
    const b = await record(db, 'business'), customer = await record(db, 'customers', row.customerId), subject = await record(db, subjectCollection(row.subjectKind), row.subjectId), job = row.jobId ? await record(db, 'jobs', row.jobId) : null
    const sms = b?.sms, now = new Date().toISOString(), key = (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='sms'").first<{ value: string }>())?.value
    const policy = isStatusKind(row.kind) ? b?.visitNotices : null
    const extraSnapshots: [string, Row][] = []
    let statusGuard = { sql: '1', params: [] as unknown[] }, statusCode: string | null = null
    if (isStatusKind(row.kind)) {
      if (!policy?.[row.kind] || policy.approvedAt !== row.statusApprovedAt || canonicalJson(policy) !== canonicalJson(c.s.business[0]?.visitNotices)) statusCode = 'status_policy_changed'
      else {
        statusGuard = statusOwnerAuthority(policy)
        const tech = subject && await record(db, 'technicians', subject.technicianId)
        if (!tech?.active || tech.operatorId !== c.actor.id) statusCode = 'technician_changed'
        else extraSnapshots.push(['technicians', tech])
        if (row.kind === 'onMyWay') {
          const portraitLink = await db.prepare('SELECT file_id FROM glove_status_photo_links WHERE message_id=? AND expires_at>?').bind(row.id, now).first<{ file_id: string }>()
          if (!portraitLink || portraitLink.file_id !== tech?.portrait?.file?.fileId) statusCode = 'portrait_changed'

          if (!tech?.portrait?.enabled || tech.portrait.by !== tech.operatorId || !tech?.locationConsent?.enabled || tech.locationConsent.by !== tech.operatorId || !row.eta?.observedAt) statusCode = 'location_stopped'
          else {
            statusGuard = { sql: `(${statusGuard.sql}) AND EXISTS(SELECT 1 FROM glove_live_locations position JOIN glove_records shift ON shift.kind='times' AND json_extract(shift.data,'$.technicianId')=position.technician_id AND json_extract(shift.data,'$.kind')='shift' AND json_extract(shift.data,'$.endAt') IS NULL JOIN glove_records timer ON timer.kind='times' AND json_extract(timer.data,'$.technicianId')=position.technician_id AND json_extract(timer.data,'$.kind')='travel' AND json_extract(timer.data,'$.visitId')=position.visit_id AND json_extract(timer.data,'$.endAt') IS NULL WHERE position.technician_id=? AND position.visit_id=? AND position.observed_at>=? AND position.observed_at>=? AND position.observed_at>=json_extract(shift.data,'$.startReceivedAt') AND position.observed_at>=json_extract(timer.data,'$.startReceivedAt') AND position.observed_at>=?)`, params: [...statusGuard.params, tech.id, row.subjectId, new Date(Date.parse(now) - 120_000).toISOString(), row.eta.observedAt, tech.locationConsent.at] }
          }
        } else if (row.kind === 'reportReady') {
          const report = await record(db, 'serviceReports', row.reportId), link = await record(db, 'serviceReportLinks', row.reportLinkId)
          if (!report || report.visitId !== row.subjectId || !link || link.reportId !== report.id || link.revokedAt || link.expiresAt <= now) statusCode = 'report_link_unavailable'
          else extraSnapshots.push(['serviceReports', report], ['serviceReportLinks', link])
        }
        if (!statusCode && !await db.prepare(`SELECT 1 AS ok WHERE ${statusGuard.sql}`).bind(...statusGuard.params).first()) statusCode = 'status_authority_or_location_changed'
      }
    }
    let status = 'suppressed', code = c.local ? 'development' : row.kind === 'inboxReply' && !b?.sms?.inboxEnabled ? 'inbox_disabled' : statusCode ?? (row.automationApprovedAt && (!b?.messageAutomation?.enabled || canonicalJson(b.messageAutomation) !== canonicalJson(c.s.business[0]?.messageAutomation)) ? 'automation_changed' : !sms?.enabled || !key || sms.connectionId !== row.connectionId || sms.fromNumber !== row.from ? 'connection_changed' : !customer ? 'customer_removed' : consentReason(customer, row.to, row.kind, now) ?? subjectReason(row, subject, job, now)), providerMessageId: string | null = null
    if (!code && b && customer && subject && key) {
      const a = authority(c.actor), snapshots = [['business', b], ['customers', customer], [subjectCollection(row.subjectKind), subject], ['messages', row], ...(job ? [['jobs', job]] : []), ...extraSnapshots] as [string, Row][]
      const claimed = await db.prepare(`INSERT OR IGNORE INTO glove_sms_attempts(message_id,connection_id,attempted_at) SELECT ?,?,? WHERE (${a.sql}) AND (${statusGuard.sql}) AND ${snapshots.map(() => "EXISTS(SELECT 1 FROM glove_records WHERE kind=? AND id=? AND version=? AND data=?)").join(' AND ')} AND EXISTS(SELECT 1 FROM glove_provider_keys WHERE provider='sms' AND value=?)`).bind(row.id, sms.connectionId, now, ...a.params, ...statusGuard.params, ...snapshots.flatMap(([kind, value]) => [kind, value.id, value.version, JSON.stringify(value)]), key).run()
      if (!claimed.meta.changes) continue
      const callback = new URL('/api/glove/sms/events', sms.origin); callback.searchParams.set('messageId', row.id); callback.searchParams.set('connectionId', sms.connectionId)
      try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sms.accountSid}/Messages.json`, { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { authorization: `Basic ${btoa(`${sms.accountSid}:${key}`)}`, 'content-type': ['application', 'x-www-form-urlencoded'].join('/') }, body: new URLSearchParams({ From: sms.fromNumber, To: row.to, Body: m.text, StatusCallback: callback.href }) })
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
