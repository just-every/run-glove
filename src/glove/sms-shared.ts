import { createHash } from 'node:crypto'
import { business, fail, text, type Context, type Row, type State } from './model'
import { isStatusKind, statusPolicy } from './visit-status-policy'

export const accountPattern = /^AC[0-9a-f]{32}$/i, sidPattern = /^SM[0-9a-f]{32}$/i
const visitKinds = ['confirmation', 'moved', 'cancelled', 'visitReminder'] as const
export const kinds = [...visitKinds, 'quoteFollowup', 'onMyWay', 'arrival', 'reportReady', 'inboxReply'] as const
export type Sms = { messageId?: string; kind: typeof kinds[number]; subjectKind: string; subjectId: string; customerId: string; jobId: string | null; to: string; text: string; label: string; reportId?: string; reportLinkId?: string; eta?: { arrivalAt: string; seconds: number; observedAt: string } }
export const isSmsAddress = (v: unknown): v is string => typeof v === 'string' && /^\+[1-9]\d{7,14}$/.test(v)
export const phone = (v: unknown) => isSmsAddress(v) ? v : fail('INPUT', 'Use an international number beginning with + and its country code.', null, 400)
export const digest = (v: string) => createHash('sha256').update(v).digest('hex')
export const purposeOf = (kind: string) => kind === 'quoteFollowup' ? 'quotes' : 'visits'
export const actorRef = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })
export function owner(c: Context) {
  if (c.actor.role !== 'owner' || !c.actor.sessionId && !c.actor.reminderRun || c.actor.token || c.actor.branch || c.actor.custom || c.actor.quoteLink || c.actor.bookingLink || c.actor.websiteIntake || c.actor.paymentProvider || c.actor.leadFeed || c.actor.billingRun || c.actor.visitReply) fail('FORBIDDEN', 'Only the signed-in owner without branch limits manages customer texts.', null, 403)
}
export function sender(c: Context, kind: string) {
  if (isStatusKind(kind)) { statusPolicy(c, kind); return }
  if (kind === 'inboxReply') {
    if (!['owner', 'dispatcher', 'office'].includes(c.actor.role) || !c.actor.sessionId || c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Only signed-in desk staff reply to a customer text.', null, 403)
    return
  }
  owner(c)
}
export function zone(value: unknown) {
  const v = text(value, 'customer time zone', { max: 100 })
  try { new Intl.DateTimeFormat('en-US', { timeZone: v }).format() } catch { fail('INPUT', 'Record a valid customer time zone.', null, 400) }
  return v
}
function quiet(now: string, timezone: string) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hourCycle: 'h23' }).format(new Date(now)))
  return hour < 8 || hour >= 18
}
export function consentReason(customer: Row, to: string, kind: string, now: string) {
  const consent = customer.automaticSms?.[purposeOf(kind)]
  if (customer.erasedAt || customer.mergedInto || customer.doNotContact || customer.marketingOptOut || (customer.tags ?? []).some((t: string) => t.toLowerCase() === 'do not contact')) return 'customer_suppressed'
  if (customer.phone !== to || customer.smsOptOut?.blocked && customer.smsOptOut.address === to) return 'address_changed_or_stopped'
  if (!consent?.enabled || consent.address !== to || !consent.source || !consent.wording || !consent.timezone) return 'no_current_consent'
  try { if (quiet(now, consent.timezone)) return 'quiet_hours' } catch { return 'no_customer_timezone' }
  return null
}
export function connected(s: State) {
  const sms = business(s).sms
  return sms?.provider === 'twilio' && sms.enabled === true ? sms : fail('SMS', 'The owner connects and explicitly enables registered customer texts first.')
}

export async function record(db: D1Database, kind: string, id?: string) {
  const found = id === undefined ? await db.prepare('SELECT data FROM glove_records WHERE kind=? LIMIT 1').bind(kind).first<{ data: string }>() : await db.prepare('SELECT data FROM glove_records WHERE kind=? AND id=?').bind(kind, id).first<{ data: string }>()
  return found ? JSON.parse(found.data) as Row : null
}

/** The same immutable text footer is used in owner previews and actual sends. */
export function smsText(s: State, body: string, kind: string) {
  return `${text(body, 'text', { max: 1200 })}\n\n${text(business(s).name, 'business name', { max: 100 })}\n${visitKinds.includes(kind as typeof visitKinds[number]) ? 'Reply CONFIRM to confirm or RESCHEDULE to ask the office for another time.\n' : ''}Reply STOP to stop texts, HELP for help, START to request texts again.`
}
