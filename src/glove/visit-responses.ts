import { sha256 } from '../modules/import-kit/src/d1/index'
import { allow } from './access'
import { bump, business, event, expectVersion, fail, find, newId, type Context, type Row } from './model'
import { address, queueEmail } from './mail'
import type { Handler } from './commands/types'

export const visitReplyHash = (token: string) => sha256(`glove-visit-response:${token}`)
export const visitReplyHeaders = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }
export const unavailableVisitReply = (): never => fail('VISIT_LINK', 'This visit link is unavailable. Contact the office for the current visit.', null, 404)

/** A person explicitly sends this one schedule; signing and booking authority
 * are never delegated by the response link. The token lives only in that email. */
export const visitResponseCommands: Handler = async (c, type, p) => {
  if (type !== 'visit.replyLink') return undefined
  allow(c.actor, type)
  if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token) fail('FORBIDDEN', 'Only the signed-in unscoped owner sends a visit response link.', null, 403)
  const visit = find(c.s, 'visits', p.visitId); expectVersion(visit, p.version)
  if (visit.status !== 'booked' || Date.parse(visit.startAt) <= Date.parse(c.now) || !visit.notice?.key) fail('VISIT_STATE', 'Choose a future booked visit.', null, 409)
  const job = find(c.s, 'jobs', visit.jobId), customer = find(c.s, 'customers', job.customerId)
  const consent = customer.automaticEmail?.visits
  if (!consent?.enabled || consent.address !== customer.email || customer.doNotContact || customer.marketingOptOut || (customer.tags ?? []).some((tag: string) => tag.toLowerCase() === 'do not contact')) fail('CONSENT', 'Record current customer consent for visit emails before sending.', null, 409)
  const to = address(customer.email, 'customer email')
  const token = 'glv_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const linkId = newId(), expiresAt = new Date(Math.min(Date.parse(c.now) + 7 * 86400000, Date.parse(visit.startAt))).toISOString()
  c.sql.push({ sql: 'DELETE FROM glove_visit_reply_secrets WHERE visit_id=?', params: [visit.id] }, { sql: 'INSERT INTO glove_visit_reply_secrets(link_id,hash,visit_id,notice_key,issuer_id,expires_at) VALUES(?,?,?,?,?,?)', params: [linkId, visitReplyHash(token), visit.id, visit.notice.key, c.actor.id, expiresAt] })
  const b = business(c.s)
  const message = queueEmail(c, { kind: 'visitResponse', subjectKind: 'visit', subjectId: visit.id, customerId: customer.id, jobId: job.id, to, subject: `${b.name}: confirm your visit`, text: `${b.name}\n\n${job.title}\n${visit.local.date} ${visit.local.start} to ${visit.local.end} (${visit.local.timezone ?? b.timezone})\n\nConfirm this time or ask the office to reschedule:\n${c.origin}/visit#token=${token}\n\nA reschedule request does not move or cancel your visit. Anyone with this link can respond; it does not verify identity.\n\nContact the office to stop visit emails.`, label: 'the visit response link' })
  const result = bump(c.s, 'visits', visit, { replyLink: { id: linkId, noticeKey: visit.notice.key, by: { id: c.actor.id, name: c.actor.name }, at: c.now, expiresAt, messageId: message.id } })
  event(c, { jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.replyLink.sent', summary: `${c.actor.name} explicitly emailed the current visit response link; recipient identity is unverified`, data: { linkId, messageId: message.id, expiresAt } })
  return { id: result.id, version: result.version, messageId: message.id, expiresAt }
}

export function visitReplyView(c: Context, visit: Row, linkId: string) {
  const job = find(c.s, 'jobs', visit.jobId)
  const response = (visit.customerResponses ?? []).find((r: Row) => r.noticeKey === visit.notice.key)
  return { business: business(c.s).name, title: job.title, date: visit.local.date, start: visit.local.start, end: visit.local.end, timezone: visit.local.timezone ?? business(c.s).timezone, response: response ? { action: response.action, at: response.at } : null, expiresAt: visit.replyLink?.id === linkId ? visit.replyLink.expiresAt : null }
}
