import { business, type Row, type State } from './model'
import { cents, dollars } from './money'
import { localParts } from './time'
import { dueVisits } from './agreement-due'
import { receivables } from './receivables'
import { recurringBillingDue } from './recurring-billing'

// The owner's dashboard (REPORT-001) for the business's local today. Today's
// jobs are the jobs with a visit, not canceled, that starts on today's local
// date; each shows the job's own state. Booked today sums the accepted
// revision's total (tax included) of every quote whose acceptance was recorded
// today. Open quotes are drafts, approved and sent quotes, valued at their
// latest revision's total. Unbilled jobs are completed jobs whose invoice has
// not been exported. On the clock lists the technicians with a shift clocked
// in and not out (COST-001), with the timer each is running. Agreements due
// count each included visit due today or earlier and not completed, even
// after booking or term end, until completed or the customer's
// recorded decline (PLAN-004). Tiles for payments and
// receivables arrive with the clauses that keep those records.

export function dashboard(s: State, now: string) {
  const zone = business(s).timezone, date = localParts(now, zone).date
  const today = (iso: unknown) => typeof iso === 'string' && localParts(iso, zone).date === date
  const customer = (id: string) => s.customers.find(c => c.id === id)?.name ?? ''
  const technician = (id: string) => s.technicians.find(t => t.id === id)?.name ?? ''
  const visits = s.visits.filter(v => v.status !== 'cancelled' && today(v.startAt)).sort((a, b) => a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0)
  const jobs = [...new Set(visits.map(v => v.jobId))].flatMap(id => s.jobs.filter(j => j.id === id)).map(j => ({
    id: j.id, number: j.number, title: j.title, customer: customer(j.customerId), status: j.status,
    visits: visits.filter(v => v.jobId === j.id).map(v => ({ id: v.id, start: localParts(v.startAt, zone).time, end: localParts(v.endAt, zone).time, technician: technician(v.technicianId), status: v.status })),
  }))
  const states = Object.fromEntries(['open', 'completed', 'invoiced'].map(state => [state, jobs.filter(j => j.status === state).length]))
  const accepted = s.quotes.filter(q => q.status === 'accepted' && today(q.acceptance?.at))
  const acceptedTotal = (q: Row) => cents((q.acceptance.totals ?? q.revisions.find((r: Row) => r.n === q.acceptance.revision).totals).total, 'total')
  const open = s.quotes.filter(q => ['draft', 'approved', 'sent'].includes(q.status))
  const unbilled = s.jobs.filter(j => j.status === 'completed' || (j.series?.billing && s.invoices.some(i => i.jobId === j.id && i.status === 'draft')))
  const missedBilling = recurringBillingDue(s, now)
  const due = dueVisits(s, date)
  const shifts = s.times.filter(x => x.kind === 'shift' && !x.endAt)
  const timer = (techId: string) => { const t = s.times.find(x => x.technicianId === techId && x.kind !== 'shift' && !x.endAt); return t ? { kind: t.kind, job: s.jobs.find(j => j.id === t.jobId)?.number ?? '' } : null }
  return {
    date, timezone: zone,
    receivables: receivables(s, date).totals,
    ...((s.payments.length > 0 || s.business[0]?.stripe) ? { paidToday: { mode: 'test', total: dollars(s.payments.filter(p => p.mode === 'test' || p.connectionId).flatMap(p => p.effects ?? []).filter(e => today(e.at)).reduce((n, e) => n + e.amountCents, 0)), tips: dollars(s.payments.filter(p => p.mode === 'test' || p.connectionId).flatMap(p => p.effects ?? []).filter(e => today(e.at)).reduce((n, e) => n + e.tipCents, 0)) } } : {}),
    jobs: { count: jobs.length, states, list: jobs },
    booked: { count: accepted.length, total: dollars(accepted.reduce((n, q) => n + acceptedTotal(q), 0)), quotes: accepted.map(q => ({ id: q.id, number: q.number, customer: customer(q.customerId) })) },
    openQuotes: { count: open.length, total: dollars(open.reduce((n, q) => n + cents(q.revisions[q.revisions.length - 1].totals.total, 'total'), 0)) },
    onClock: { count: shifts.length, list: shifts.map(x => ({ technicianId: x.technicianId, technician: technician(x.technicianId), since: x.startAt, timer: timer(x.technicianId) })) },
    agreementsDue: { count: due.length, list: due.map(v => ({ id: v.id, customer: v.customer, plan: v.plan, next: v.due, left: 1 })) },
    ...(s.jobs.some(j => j.series?.billing) ? { recurringBilling: { count: missedBilling.length, list: missedBilling } } : {}),
    unbilled: { count: unbilled.length, list: unbilled.map(j => ({ id: j.id, number: j.number, customer: customer(j.customerId), invoiceId: s.invoices.find(i => i.jobId === j.id && i.status === 'draft')?.id ?? s.invoices.find(i => i.jobId === j.id)?.id ?? null })) },
  }
}
