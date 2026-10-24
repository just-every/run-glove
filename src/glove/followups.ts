import { bump, event, expectVersion, fail, find, type Context, type Row, type State } from './model'
import { allow } from './access'
import type { Handler } from './commands/types'
import type { Reminder } from './reminders'

export const followupSteps = (policy: Row) => [
  ...(policy.quoteDays ?? []).map((day: number) => ({ day, channel: 'email' as const })),
  ...(policy.quoteTextDays ?? []).map((day: number) => ({ day, channel: 'sms' as const })),
  ...(policy.quoteCallDays ?? []).map((day: number) => ({ day, channel: 'call' as const })),
].sort((a, b) => a.day - b.day || a.channel.localeCompare(b.channel))

/** A follow-up belongs to one sent, approved revision and never carries a bearer. */
export function quoteFollowups(s: State, at: string, policy: Row): Reminder[] {
  return s.quotes.flatMap(q => {
    const revision = q.revisions.at(-1)
    if (q.erasedAt || q.status !== 'sent' || !revision?.approval || !revision.validTo || Date.parse(at) >= Date.parse(revision.validTo) || (q.customerRequests ?? []).some((r: Row) => r.revision === revision.n)) return []
    const sent = q.sent.find((r: Row) => r.revision === revision.n)
    if (!sent) return []
    return followupSteps(policy).filter(({ day }) => Date.parse(at) >= Date.parse(sent.at) + day * 86_400_000).map(({ day, channel }) => ({ key: `quote:${q.id}:${revision.n}:${day}${channel === 'email' ? '' : `:${channel}`}`, channel, kind: 'quoteFollowup', row: q, customerId: q.customerId, jobId: q.jobId ?? null, subjectKind: 'quote', values: { date: revision.validUntil, number: q.number, title: q.title } }))
  })
}

export function quoteFollowupState(s: State, quote: Row, at: string) {
  const revision = quote.revisions.at(-1), policy = s.business[0]?.messageAutomation
  if (quote.status === 'accepted' || quote.status === 'declined' || (quote.customerRequests ?? []).some((r: Row) => r.revision === revision?.n)) return 'Stopped: customer answered'
  if (revision?.validTo && Date.parse(at) >= Date.parse(revision.validTo)) return 'Stopped: quote expired'
  if (!policy?.enabled || !followupSteps(policy).length) return 'No quote follow-ups scheduled'
  if (policy.quoteDays?.length && !s.business[0]?.address?.trim()) return 'Paused: business postal address required for email follow-ups'
  if (policy.quoteDays?.length && !s.business[0]?.mail) return 'Paused: email disconnected'
  if (quote.status !== 'sent') return 'Paused: approved revision must be sent first'
  const customer = s.customers.find(c => c.id === quote.customerId), consent = customer?.automaticEmail?.quotes
  if (!consent?.enabled || consent.address !== customer?.email) return 'Paused: customer consent required'
  const steps = followupSteps(policy)
  const count = steps.filter(({ day, channel }) => {
    const key = `quote:${quote.id}:${revision.n}:${day}${channel === 'email' ? '' : `:${channel}`}`
    return channel === 'call' ? (quote.followupTasks ?? []).some((t: Row) => t.key === key) : s.messages.some(m => m.reminderKey === key)
  }).length
  return `${count} of ${steps.length} quote follow-up steps reserved`
}

/** Internal call tasks never place calls. Answered or expired work stays visible
 * as stopped history instead of inviting a late call. */
export function stopQuoteCallTasks(c: Context) {
  for (const quote of c.s.quotes) {
    const revision = quote.revisions.at(-1)
    if (quote.status === 'sent' && revision?.validTo > c.now && !(quote.customerRequests ?? []).some((r: Row) => r.revision === revision.n)) continue
    if ((quote.followupTasks ?? []).some((t: Row) => t.status === 'open')) bump(c.s, 'quotes', quote, { followupTasks: quote.followupTasks.map((t: Row) => t.status === 'open' ? { ...t, status: 'stopped', stoppedAt: c.now } : t) })
  }
}

export const followupCommands: Handler = async (c, type, p) => {
  if (type !== 'quote.followupComplete') return undefined
  allow(c.actor, type)
  const quote = find(c.s, 'quotes', p.quoteId); expectVersion(quote, p.version)
  const task = (quote.followupTasks ?? []).find((t: Row) => t.key === p.key)
  if (quote.status !== 'sent' || !quote.revisions.at(-1)?.validTo || quote.revisions.at(-1).validTo <= c.now || (quote.customerRequests ?? []).some((r: Row) => r.revision === quote.revisions.at(-1).n) || !task || task.status !== 'open') fail('TASK_STATE', 'Choose an open quote call task.', null, 409)
  const row = bump(c.s, 'quotes', quote, { followupTasks: quote.followupTasks.map((t: Row) => t.key === task.key ? { ...t, status: 'completed', completedAt: c.now, completedBy: { id: c.actor.id, name: c.actor.name } } : t) })
  event(c, { jobId: quote.jobId ?? null, subjectKind: 'quote', subjectId: quote.id, kind: type, summary: `${c.actor.name} completed the quote follow-up call task; no call or delivery is claimed`, data: { key: task.key } })
  return { id: row.id, version: row.version }
}
