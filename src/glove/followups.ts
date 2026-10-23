import { type Row, type State } from './model'
import type { Reminder } from './reminders'

/** A follow-up belongs to one sent, approved revision and never carries a bearer. */
export function quoteFollowups(s: State, at: string, policy: Row): Reminder[] {
  return s.quotes.flatMap(q => {
    const revision = q.revisions.at(-1)
    if (q.erasedAt || q.status !== 'sent' || !revision?.approval || !revision.validTo || Date.parse(at) >= Date.parse(revision.validTo) || (q.customerRequests ?? []).some((r: Row) => r.revision === revision.n)) return []
    const sent = q.sent.find((r: Row) => r.revision === revision.n)
    if (!sent) return []
    return policy.quoteDays.filter((day: number) => Date.parse(at) >= Date.parse(sent.at) + day * 86_400_000).map((day: number) => ({ key: `quote:${q.id}:${revision.n}:${day}`, kind: 'quoteFollowup', row: q, customerId: q.customerId, jobId: q.jobId ?? null, subjectKind: 'quote', values: { date: revision.validUntil, number: q.number, title: q.title } }))
  })
}

export function quoteFollowupState(s: State, quote: Row, at: string) {
  const revision = quote.revisions.at(-1), policy = s.business[0]?.messageAutomation
  if (quote.status === 'accepted' || quote.status === 'declined' || (quote.customerRequests ?? []).some((r: Row) => r.revision === revision?.n)) return 'Stopped: customer answered'
  if (revision?.validTo && Date.parse(at) >= Date.parse(revision.validTo)) return 'Stopped: quote expired'
  if (!policy?.enabled || !policy.quoteDays?.length) return 'No quote follow-ups scheduled'
  if (!s.business[0]?.mail) return 'Paused: email disconnected'
  if (quote.status !== 'sent') return 'Paused: approved revision must be sent first'
  const customer = s.customers.find(c => c.id === quote.customerId), consent = customer?.automaticEmail?.quotes
  if (!consent?.enabled || consent.address !== customer?.email) return 'Paused: customer consent required'
  const count = policy.quoteDays.filter((day: number) => s.messages.some(m => m.reminderKey === `quote:${quote.id}:${revision.n}:${day}`)).length
  return `${count} of ${policy.quoteDays.length} quote follow-up steps reserved`
}
