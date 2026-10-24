import { load } from './storage'
import { newId, type Row } from './model'
import type { SmsReplyHandler } from './sms-channel'

/** A bare text reply has no visit token. Only one current visit with an actual
 * sent notice can be answered; ambiguity never changes a booking or a job. */
export const prepareSmsVisitReply: SmsReplyHandler = async (reply, db) => {
  if (reply.action === 'decline') return { statements: [] }
  const s = await load(db), customer = s.customers.find(c => c.id === reply.customerId)
  const consent = customer?.automaticSms?.visits
  if (!customer || customer.erasedAt || !consent?.enabled || consent.address !== customer.phone || customer.smsOptOut?.blocked || customer.doNotContact) return { statements: [] }
  const attempted = new Set((await db.prepare('SELECT message_id FROM glove_sms_attempts WHERE provider_message_id IS NOT NULL').all<{ message_id: string }>()).results.map(r => r.message_id))
  const visits = s.visits.filter(v => v.status === 'booked' && !v.erasedAt && v.startAt > reply.at && s.jobs.some(j => j.id === v.jobId && j.customerId === customer.id && !j.erasedAt) && s.messages.some(m => attempted.has(m.id) && m.channel === 'sms' && m.direction === 'outbound' && m.subjectKind === 'visit' && m.subjectId === v.id && m.customerId === customer.id && m.visitStartAt === v.startAt && m.visitEndAt === v.endAt && m.visitTechnicianId === v.technicianId))
  if (visits.length !== 1) return { statements: [] }
  const visit = visits[0], job = s.jobs.find(j => j.id === visit.jobId)!
  if (!visit.notice?.key || (visit.customerResponses ?? []).some((r: Row) => r.noticeKey === visit.notice.key)) return { statements: [] }
  const response = { noticeKey: visit.notice.key, action: reply.action, at: reply.at, identity: 'TWILIO_REPORTED_SENDER_NUMBER', messageId: reply.messageId }
  const changed = { ...visit, version: visit.version + 1, customerResponses: [...(visit.customerResponses ?? []), response] }
  const statements = [db.prepare("UPDATE glove_records SET version=?,data=?,revision=NULL WHERE kind='visits' AND id=? AND version=?").bind(changed.version, JSON.stringify(changed), visit.id, visit.version)]
  let requestId: string | null = null
  if (reply.action === 'reschedule') {
    const enquiry = { id: newId(), version: 1, createdAt: reply.at, stageAt: reply.at, customerId: customer.id, siteId: job.siteId, jobId: job.id, visitId: visit.id, status: 'new', source: 'text', description: `Reschedule requested by text for ${job.number}: ${visit.local.date} ${visit.local.start}. Existing booking remains in place.`, createdBy: { id: 'provider:Twilio', name: 'Twilio-reported sender number', role: 'provider' }, contacts: [] }
    requestId = enquiry.id
    const notice = { id: newId(), version: 1, createdAt: reply.at, to: ['owner', 'dispatcher', 'office'], jobId: job.id, visitId: visit.id, customerId: customer.id, enquiryId: enquiry.id, title: `Reschedule request on ${job.number}`, text: enquiry.description, read: [] }
    statements.push(db.prepare("INSERT INTO glove_records(kind,id,version,data) VALUES('enquiries',?,1,?)").bind(enquiry.id, JSON.stringify(enquiry)), db.prepare("INSERT INTO glove_records(kind,id,version,data) VALUES('notices',?,1,?)").bind(notice.id, JSON.stringify(notice)))
  }
  statements.push(db.prepare("INSERT INTO glove_events(id,sequence,at,actor_id,actor_name,actor_role,command_id,job_id,subject_kind,subject_id,kind,summary,data) VALUES(?,(SELECT COALESCE(MAX(sequence),0)+1 FROM glove_events),?,'provider:Twilio','Twilio','provider',?,?,'visit',?,?,?,?)").bind(newId(), reply.at, reply.messageId, job.id, visit.id, `visit.customer.${reply.action}`, `Twilio-reported sender number ${reply.action === 'confirm' ? 'confirmed the current visit' : 'asked to reschedule; booking unchanged'}`, JSON.stringify({ ...response, requestId })))
  statements.push(db.prepare("UPDATE glove_records SET data=json_set(data,'$.jobId',?,'$.visitId',?) WHERE kind='messages' AND id=?").bind(job.id, visit.id, reply.messageId))
  return { guards: [{ sql: "EXISTS(SELECT 1 FROM glove_records WHERE kind='visits' AND id=? AND version=? AND data=?) AND EXISTS(SELECT 1 FROM glove_records WHERE kind='customers' AND id=? AND version=? AND data=?)", params: [visit.id, visit.version, JSON.stringify(visit), customer.id, customer.version, JSON.stringify(customer)] }], statements }
}
