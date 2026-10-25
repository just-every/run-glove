import { allow } from './access'
import { locationWork } from './locations'
import { driveTimes, mapsKey } from './maps'
import { bump, business, event, expectVersion, fail, find, newId, Problem, put, text, type Context, type Row } from './model'
import { newReportToken, reportTokenHash } from './service-reports'
import { queueSms } from './sms-delivery'
import { connected, consentReason, owner, smsText } from './sms-shared'
import { currentStatusOwner, guardStatusOwner, statusKinds, statusPolicy, type StatusKind } from './visit-status-policy'
import { reservePortraitLink } from './technician-portraits'
import type { Handler } from './commands/types'

const fields = ['customer', 'technician', 'eta', 'title', 'number']
function template(value: unknown) {
  const body = text(value, 'status template', { max: 800 })
  if (/https?:|www\.|[<>]/i.test(body) || [...body.matchAll(/{{(.*?)}}/g)].some(m => !fields.includes(m[1])) || /[{}]/.test(body.replace(/{{(.*?)}}/g, ''))) fail('INPUT', 'Use the supported status fields and plain text without links.', null, 400)
  return body
}
const merge = (body: string, values: Record<string, string>) => body.replace(/{{(.*?)}}/g, (_, key) => values[key] ?? '')
const previews = (c: Context, templates: Record<string, string>) => Object.fromEntries(statusKinds.map(kind => {
  const suffix = kind === 'onMyWay' ? '\n\nYour technician’s photo (available for two hours):\n[private photo link]' : kind === 'reportReady' ? '\n\nYour seven-day service report link:\n[private report link]' : ''
  return [kind, smsText(c.s, merge(templates[kind], { customer: 'Customer', technician: 'Alex', eta: '10:25 AM (UTC), approximately 15 minutes driving', title: 'Service visit', number: 'JOB-0001' }) + suffix, kind)]
}))

export async function approvedStatusNotice(c: Context, db: D1Database, kind: StatusKind, customer: Row) {
  const policy = statusPolicy(c, kind)
  connected(c.s)
  const reason = consentReason(customer, customer.phone, kind, c.now)
  if (reason) fail('SMS_CONSENT', 'Customer texts are unavailable for this number or time.', { reason })
  if (!await currentStatusOwner(db, policy)) fail('VISIT_NOTICE', 'The owner must approve visit status texts again after their authority changes.')
  return policy
}

/** Owner policy is separate from ordinary reminders; every status kind starts off. */
export const visitStatusNotices: Handler = async (c, type, p, db) => {
  if (!['visitNotice.configure', 'visitNotice.preview', 'visit.onMyWay'].includes(type)) return undefined
  allow(c.actor, type)
  if (type !== 'visit.onMyWay') {
    owner(c)
    if (c.actor.reminderRun) fail('FORBIDDEN', 'Only the signed-in owner approves status notices.', null, 403)
    const templates = Object.fromEntries(statusKinds.map(kind => [kind, template(kind === 'arrival' && p.templates?.arrival === undefined ? '{{technician}} has arrived for {{title}}.' : p.templates?.[kind])]))
    if (type === 'visitNotice.preview') {
      event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: type, summary: 'Owner previewed visit status texts; nothing sent or enabled', data: null })
      return previews(c, templates)
    }
    const b = business(c.s); expectVersion(b, p.version)
    if (typeof p.onMyWay !== 'boolean' || typeof p.reportReady !== 'boolean' || p.arrival !== undefined && typeof p.arrival !== 'boolean' || p.approved !== true) fail('CONSENT', 'Explicitly approve the exact templates and each visit status setting.')
    if ((p.onMyWay || p.arrival || p.reportReady) && !b.sms?.enabled) fail('SMS', 'Connect and explicitly enable registered customer texts first.')
    if (!templates.onMyWay.includes('{{technician}}') || !templates.onMyWay.includes('{{eta}}')) fail('INPUT', 'The on-my-way template must include {{technician}} and {{eta}}.', null, 400)
    const policy = { onMyWay: p.onMyWay, arrival: p.arrival === true, reportReady: p.reportReady, templates, approvedAt: c.now, by: { id: c.actor.id, name: c.actor.name }, operatorVersion: c.actor.operatorVersion, branchRevision: c.actor.branchRevision ?? 0 }
    const row = bump(c.s, 'business', b, { visitNotices: policy })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner approved exact visit status templates, technician-triggered texts and completed-report link sharing', data: policy })
    return { ...row, preview: previews(c, templates) }
  }
  if (c.actor.role !== 'technician' || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Only the currently assigned technician sends an on-my-way notice.', null, 403)
  const visit = find(c.s, 'visits', p.visitId); expectVersion(visit, p.version)
  const tech = c.s.technicians.find(t => t.operatorId === c.actor.id && t.active) ?? fail('TECHNICIAN', 'Your sign-in must be linked to an active technician.', null, 403)
  if (visit.technicianId !== tech.id || visit.status !== 'booked' || visit.arrival) fail('NOT_ASSIGNED', 'Choose your currently booked visit before arrival.', null, 403)
  if (visit.onMyWay?.startAt === visit.startAt && visit.onMyWay?.endAt === visit.endAt && visit.onMyWay?.technicianId === tech.id) fail('VISIT_NOTICE', 'An on-my-way text was already reserved for this booking. Check its outcome with the office.')
  const job = find(c.s, 'jobs', visit.jobId), customer = find(c.s, 'customers', job.customerId), site = find(c.s, 'sites', job.siteId)
  const policy = await approvedStatusNotice(c, db, 'onMyWay', customer), work = locationWork(c.s, tech)
  if (!work || work.visit.id !== visit.id || work.timer.kind !== 'travel') return fail('ETA_UNAVAILABLE', 'Clock in, allow on-clock location and start this visit’s travel timer before sending.')
  const position = await db.prepare('SELECT lat,lng,observed_at FROM glove_live_locations WHERE technician_id=? AND visit_id=?').bind(tech.id, visit.id).first<{ lat: number; lng: number; observed_at: string }>()
  if (!position || Date.parse(c.now) - Date.parse(position.observed_at) > 120_000 || Date.parse(position.observed_at) > Date.parse(c.now) + 10_000 || position.observed_at < work.timer.startReceivedAt || position.observed_at < work.shift.startReceivedAt || position.observed_at < tech.locationConsent.at) return fail('ETA_UNAVAILABLE', 'A fresh on-clock position is needed for the driving estimate.')
  const key = await mapsKey(db, c.s)
  if (!key || !site.location) return fail('ETA_UNAVAILABLE', 'The owner must connect Maps and locate this site before an ETA can be sent.')
  const drive = (await driveTimes(key, [{ from: { lat: position.lat, lng: position.lng }, to: site.location }], AbortSignal.timeout(10_000)))[0]
  if (!drive) return fail('ETA_UNAVAILABLE', 'Maps returned no driving estimate. No text was sent.')
  const arrivalAt = new Date(Date.parse(c.now) + drive.seconds * 1000).toISOString(), zone = customer.automaticSms.visits.timezone
  const eta = `${new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' }).format(new Date(arrivalAt))} (${zone}), approximately ${Math.ceil(drive.seconds / 60)} minutes driving`
  const messageId = newId(), portrait = reservePortraitLink(c, tech, visit, messageId)
  const message = queueSms(c, { messageId, kind: 'onMyWay', subjectKind: 'visit', subjectId: visit.id, customerId: customer.id, jobId: job.id, to: customer.phone, text: merge(policy.templates.onMyWay, { customer: customer.name, technician: tech.name.trim().split(/\s+/)[0], eta, title: job.title, number: job.number }) + portrait, label: 'on-my-way notice', eta: { arrivalAt, seconds: drive.seconds, observedAt: position.observed_at } })
  guardStatusOwner(c, policy)
  const row = bump(c.s, 'visits', visit, { onMyWay: { messageId: message.id, at: c.now, startAt: visit.startAt, endAt: visit.endAt, technicianId: tech.id, arrivalAt, driveSeconds: drive.seconds } })
  event(c, { jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: type, summary: `${tech.name} tapped on my way; one text reserved with a current driving estimate, not a promised arrival`, data: { messageId: message.id, arrivalAt, driveSeconds: drive.seconds } })
  return { id: row.id, version: row.version, messageId: message.id, arrivalAt, driveSeconds: drive.seconds }
}

/** Called only for the report frozen by this visit.complete command. */
export async function queueCompletionNotice(c: Context, report: Row, db: D1Database): Promise<void> {
  if (!business(c.s).visitNotices?.reportReady) return
  const visit = find(c.s, 'visits', report.visitId), tech = find(c.s, 'technicians', visit.technicianId), customer = find(c.s, 'customers', report.customerId)
  if (c.actor.role !== 'technician' || tech.operatorId !== c.actor.id) return
  let policy: any
  try { policy = await approvedStatusNotice(c, db, 'reportReady', customer) }
  catch (error) {
    if (!(error instanceof Problem)) throw error
    event(c, { jobId: report.jobId, subjectKind: 'serviceReport', subjectId: report.id, kind: 'report.notice.suppressed', summary: 'Completed report text was suppressed; customer consent, quiet hours, connection and owner authority must permit it', data: { reason: error.code } })
    return
  }
  const token = newReportToken(), link = put(c.s, 'serviceReportLinks', { id: newId(), version: 1, createdAt: c.now, jobId: report.jobId, reportId: report.id, expiresAt: new Date(Date.parse(c.now) + 7 * 86400000).toISOString(), revokedAt: null })
  c.sql.push({ sql: 'INSERT INTO glove_report_secrets(link_id,hash) VALUES(?,?)', params: [link.id, reportTokenHash(token)] })
  const body = `${merge(policy.templates.reportReady, { customer: customer.name, technician: report.snapshot.visit.technician, eta: '', title: report.snapshot.job.title, number: report.snapshot.job.number })}\n\nYour seven-day service report link:\n${c.origin}/report#token=${token}`
  const message = queueSms(c, { kind: 'reportReady', subjectKind: 'visit', subjectId: visit.id, customerId: customer.id, jobId: report.jobId, to: customer.phone, text: body, label: 'completed report notice', reportId: report.id, reportLinkId: link.id })
  link.texted = { messageId: message.id, at: c.now, by: { id: c.actor.id, name: c.actor.name } }
  guardStatusOwner(c, policy)
  event(c, { jobId: report.jobId, subjectKind: 'serviceReportLink', subjectId: link.id, kind: 'report.link.created', summary: 'Seven-day report link reserved for the owner-approved completion text', data: { reportId: report.id, expiresAt: link.expiresAt, messageId: message.id } })
}
