import { allow, roleSql } from './access'
import { invoiceBalance } from './balances'
import { branchZone } from './branches'
import { deliverMail, isAddress, queueEmail } from './mail'
import { bump, business, event, expectVersion, fail, find, oneOf, text, type Actor, type Context, type Row, type State } from './model'
import { invoiceDates, addCalendarDays } from './receivables'
import { dollars } from './money'
import { load, commit } from './storage'
import { localParts } from './time'
import { quoteFollowups } from './followups'
import type { Handler } from './commands/types'

const kinds = ['confirmation', 'moved', 'cancelled', 'visitReminder', 'paymentReminder', 'quoteFollowup'] as const
export const reminderDefaults = {
  confirmation: 'Your visit is booked for {{date}} at {{time}}.',
  moved: 'Your visit has moved to {{date}} at {{time}}.',
  cancelled: 'Your visit on {{date}} at {{time}} is cancelled.',
  visitReminder: 'Reminder: your visit is {{date}} at {{time}}.',
  paymentReminder: 'Invoice {{number}} has {{amount}} outstanding and is due {{date}}. Contact the office to arrange payment.',
  quoteFollowup: 'Please contact us about quote {{number}}: {{title}}. It is valid through {{date}}.',
}
const fields = new Set(['customer', 'date', 'time', 'number', 'amount', 'title'])
const purposeOf = (kind: string) => kind === 'paymentReminder' ? 'payments' : kind === 'quoteFollowup' ? 'quotes' : 'visits'
const suppressed = (customer: Row) => customer.erasedAt || customer.mergedInto || customer.doNotContact || customer.marketingOptOut || (customer.tags ?? []).some((tag: string) => tag.toLowerCase() === 'do not contact')
const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name })
const ownerOnly = (c: Context, type: string) => {
  allow(c.actor, type)
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch) fail('FORBIDDEN', 'Only the signed-in owner without branch limits manages automatic email.', null, 403)
}
function offsets(value: unknown, name: string, min: number, max: number) {
  if (!Array.isArray(value) || value.length > 6 || value.some(x => !Number.isInteger(x) || x < min || x > max) || new Set(value).size !== value.length) fail('INPUT', `${name} has at most six distinct whole numbers from ${min} to ${max}.`, null, 400)
  return [...(value as number[])].sort((a, b) => a - b)
}
function template(value: unknown) {
  const body = text(value, 'template', { max: 2000 })
  if (/https?:|www\.|[<>]/i.test(body) || [...body.matchAll(/{{(.*?)}}/g)].some(m => !fields.has(m[1])) || /[{}]/.test(body.replace(/{{(.*?)}}/g, ''))) fail('INPUT', 'Use plain text and the supported merge fields; links and markup are unavailable.', null, 400)
  return body
}
export function reminderText(s: State, body: string, values: Record<string, string>) {
  const b = business(s)
  return `${body.replace(/{{(.*?)}}/g, (_, key) => values[key] ?? '')}\n\n${b.name}\n${b.address || ''}\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`
}

export const reminderCommands: Handler = async (c, type, p) => {
  if (!['reminder.preview', 'reminder.configure', 'reminder.consent', 'invoice.dispute'].includes(type)) return undefined
  ownerOnly(c, type)
  if (type === 'reminder.preview') {
    const templates = Object.fromEntries(kinds.map(k => [k, template(p.templates?.[k])]))
    event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: type, summary: 'Owner previewed automatic email templates; nothing enabled or sent', data: null })
    return Object.fromEntries(kinds.map(k => [k, reminderText(c.s, templates[k], { customer: 'Customer', date: '2026-11-01', time: '10:00', number: 'Example', amount: '$100.00', title: 'Service' })]))
  }
  if (type === 'reminder.configure') {
    const b = business(c.s); expectVersion(b, p.version)
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
    if (!p.enabled) {
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner turned automatic customer email off', data: { enabled: false } })
      return bump(c.s, 'business', b, { messageAutomation: { ...b.messageAutomation, enabled: false } })
    }
    if (!b.mail || p.approved !== true) fail('CONSENT', 'Connect customer email and explicitly approve every template and schedule first.')
    const templates = Object.fromEntries(kinds.map(k => [k, template(p.templates?.[k])]))
    const policy = { enabled: true, templates, visitHours: offsets(p.visitHours, 'visitHours', 1, 168), paymentDays: offsets(p.paymentDays, 'paymentDays', -30, 90), quoteDays: offsets(p.quoteDays, 'quoteDays', 1, 90), by: who(c), approvedAt: c.now }
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: type, summary: 'Owner approved automatic email templates and schedules; quiet hours are 18:00 to 08:00 in the record branch', data: policy })
    const result = bump(c.s, 'business', b, { messageAutomation: policy })
    return { ...result, preview: Object.fromEntries(kinds.map(k => [k, reminderText(c.s, templates[k], { customer: 'Customer', date: '2026-11-01', time: '10:00', number: 'Example', amount: '$100.00', title: 'Service' })])) }
  }
  if (type === 'reminder.consent') {
    const customer = find(c.s, 'customers', p.customerId); expectVersion(customer, p.version)
    const purpose = oneOf(p.purpose, ['visits', 'payments', 'quotes'] as const, 'purpose')
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
    const address = purpose === 'payments' ? customer.apEmail || customer.email : customer.email
    if (p.enabled && !isAddress(address)) fail('INPUT', 'Record the customer email address first.', null, 400)
    const consent = { enabled: p.enabled, address: p.enabled ? address : null, at: c.now, by: who(c), reference: text(p.reference, 'customer consent or withdrawal reference', { max: 300 }) }
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: type, summary: `Owner recorded ${purpose} email ${p.enabled ? 'consent' : 'withdrawal'}`, data: { purpose, enabled: p.enabled } })
    return bump(c.s, 'customers', customer, { automaticEmail: { ...customer.automaticEmail, [purpose]: consent } })
  }
  const inv = find(c.s, 'invoices', p.invoiceId); expectVersion(inv, p.version)
  if (typeof p.disputed !== 'boolean') fail('INPUT', 'disputed is true or false.', null, 400)
  const dispute = { active: p.disputed, at: c.now, by: who(c), reason: text(p.reason, 'reason', { max: 500 }) }
  event(c, { jobId: inv.jobId, subjectKind: 'invoice', subjectId: inv.id, kind: type, summary: `Owner ${p.disputed ? 'paused reminders for a disputed invoice' : 'resolved the invoice dispute'}`, data: dispute })
  return bump(c.s, 'invoices', inv, { dispute })
}

export type Reminder = { key: string; kind: typeof kinds[number]; row: Row; customerId: string; jobId: string | null; subjectKind: string; values: Record<string, string> }

export function visitReminders(s: State, at: string, policy: Row): Reminder[] {
  return s.visits.flatMap(visit => {
    const job = s.jobs.find(j => j.id === visit.jobId)
    if (!job || job.erasedAt || visit.erasedAt) return []
    const values = { date: visit.local.date, time: `${visit.local.start} (${visit.local.timezone ?? branchZone(s, job)})`, title: job.title, number: job.number }
    const base = { row: visit, customerId: job.customerId, jobId: job.id, subjectKind: 'visit', values }
    const due: Reminder[] = []
    if (visit.notice && visit.notice.at >= policy.approvedAt && (visit.status === 'cancelled' || Date.parse(visit.startAt) > Date.parse(at))) due.push({ ...base, kind: visit.notice.kind, key: `visit:${visit.id}:${visit.notice.key}` })
    if (visit.status === 'booked' && Date.parse(visit.startAt) > Date.parse(at)) for (const hours of policy.visitHours) {
      if (Date.parse(at) >= Date.parse(visit.startAt) - hours * 3_600_000) due.push({ ...base, kind: 'visitReminder', key: `visit:${visit.id}:${visit.startAt}:${hours}` })
    }
    return due
  })
}
export function paymentReminders(s: State, at: string, policy: Row): Reminder[] {
  return s.invoices.flatMap(inv => {
    const balance = invoiceBalance(s, inv), dates = invoiceDates(s, inv)
    if (inv.erasedAt || balance === null || balance <= 0 || inv.dispute?.active || !dates) return []
    const today = localParts(at, branchZone(s, inv)).date
    return policy.paymentDays.filter((day: number) => today >= addCalendarDays(dates.dueOn, day)).map((day: number) => ({ key: `invoice:${inv.id}:${dates.dueOn}:${day}`, kind: 'paymentReminder', row: inv, customerId: inv.customerId, jobId: inv.jobId, subjectKind: 'invoice', values: { date: dates.dueOn, number: inv.number, amount: `${inv.revisions.at(-1).totals.currency ?? business(s).currency} ${dollars(balance)}` } }))
  })
}
export function paymentReminderState(s: State, inv: Row) {
  if (inv.dispute?.active) return 'Stopped: invoice disputed'
  if ((invoiceBalance(s, inv) ?? 1) <= 0) return 'Stopped: zero balance'
  const policy = s.business[0]?.messageAutomation
  if (!policy?.enabled || !policy.paymentDays?.length) return 'No reminders scheduled'
  if (!s.business[0]?.mail) return 'Paused: email disconnected'
  const customer = s.customers.find(c => c.id === inv.customerId), consent = customer?.automaticEmail?.payments
  if (!consent?.enabled || consent.address !== (customer?.apEmail || customer?.email)) return 'Paused: customer consent required'
  const sent = s.messages.filter(m => m.subjectId === inv.id && m.kind === 'paymentReminder').length
  return `${sent} reminder steps reserved; ${policy.paymentDays.length} scheduled steps`
}

/** Each cron pass reserves one message at a time under the ordinary version guard.
 * A lost race recomputes next time; a committed uncertain attempt never replays. */
export async function runReminders(db: D1Database, at: string) {
  for (let count = 0; count < 50; count++) {
    const before = await load(db), policy = before.business[0]?.messageAutomation
    if (!policy?.enabled || !before.business[0]?.mail) return
    const id = policy.by.id
    const owner = await db.prepare(`SELECT id,display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(id, id, id).first<{ id: string; name: string; version: number; role: string }>()
    const limit = before.branchAccess.find(b => b.id === id)
    if (!owner || owner.role !== 'owner' || (limit && limit.limited !== false)) return
    const actor: Actor = { id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: owner.version, branchRevision: limit?.version ?? 0, reminderRun: true }
    const c: Context = { s: structuredClone(before), actor, now: at, commandId: `reminder-${crypto.randomUUID()}`, events: [], files: [], sql: [] }
    const candidate = [...visitReminders(c.s, at, policy), ...paymentReminders(c.s, at, policy), ...quoteFollowups(c.s, at, policy)].find(r => {
      if (c.s.messages.some(m => m.reminderKey === r.key)) return false
      const customer = c.s.customers.find(x => x.id === r.customerId), purpose = purposeOf(r.kind), consent = customer?.automaticEmail?.[purpose]
      const address = purpose === 'payments' ? customer?.apEmail || customer?.email : customer?.email
      if (!customer || suppressed(customer) || !consent?.enabled || consent.address !== address || !isAddress(address)) return false
      const time = localParts(new Date().toISOString(), branchZone(c.s, r.row)).time
      return time >= '08:00' && time < '18:00'
    })
    if (!candidate) return
    const customer = find(c.s, 'customers', candidate.customerId), to = purposeOf(candidate.kind) === 'payments' ? customer.apEmail || customer.email : customer.email
    const message = queueEmail(c, { kind: candidate.kind, subjectKind: candidate.subjectKind, subjectId: candidate.row.id, customerId: customer.id, jobId: candidate.jobId, to, subject: `${business(c.s).name}: ${candidate.kind === 'paymentReminder' ? 'payment reminder' : candidate.kind === 'quoteFollowup' ? 'quote follow-up' : 'visit update'}`, text: reminderText(c.s, policy.templates[candidate.kind], { ...candidate.values, customer: customer.name }), label: candidate.kind })
    message.reminderKey = candidate.key
    message.automationApprovedAt = policy.approvedAt
    try { await commit(db, c, before, 'reminder.run', candidate.key, { messageId: message.id }) }
    catch (error) { if ((await load(db)).version !== before.version) continue; throw error }
    // Reload immediately before dispatch. Privacy, consent, payment and decision
    // changes committed while reserving suppress this attempt permanently.
    const current = await load(db), live = current.messages.find(m => m.id === message.id)
    const stillDue = current.business[0]?.messageAutomation?.enabled && [...visitReminders(current, at, policy), ...paymentReminders(current, at, policy), ...quoteFollowups(current, at, policy)].some(r => r.key === candidate.key)
    const recipient = current.customers.find(x => x.id === customer.id), consent = recipient?.automaticEmail?.[purposeOf(candidate.kind)]
    if (!live || !stillDue || !consent?.enabled || consent.address !== to || !recipient || suppressed(recipient) || to !== (purposeOf(candidate.kind) === 'payments' ? recipient.apEmail || recipient.email : recipient.email) || current.version !== c.s.version + 1) continue
    await deliverMail(db, c)
  }
}
