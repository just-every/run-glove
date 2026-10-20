import { business, type Row, type State } from './model'
import { cents, dollars } from './money'
import { costing } from './costing'
import { localParts, wallTime } from './time'

// AGENT-008: the owner's morning brief, prepared by Glove from its own records
// (no model) for the business's local date at the moment it is read. Read only:
// each item names its record and the screen where a person acts.
// - At risk today: visits on today's local date, not cancelled or completed,
//   with no technician, not arrived 15 minutes after their start, or arrived and
//   still open after their end.
// - Unbilled: completed jobs whose invoice is missing or not yet approved.
// - Over estimate: open jobs whose actual cost exceeds a non-zero estimated cost (COST-004).
// - Leads waiting: requests still new or contacted 24 hours or more after they entered that stage.
// Overdue invoices and agreements due join the brief with PAY-004 and PLAN-004,
// which add those records; until then the brief says they are not tracked.

const late = 15 * 60_000, waiting = 24 * 3_600_000
type Item = { kind: string; id: string; text: string; action: { label: string; href: string } }

export function morningBrief(s: State, at: string) {
  const zone = business(s).timezone, date = localParts(at, zone).date, now = Date.parse(at)
  const customer = (id: string) => s.customers.find(c => c.id === id)?.name ?? ''
  const technician = (id: string | null) => s.technicians.find(t => t.id === id)?.name ?? ''
  const job = (id: string) => s.jobs.find(j => j.id === id)
  const atRisk: Item[] = s.visits.filter(v => !['cancelled', 'completed'].includes(v.status) && localParts(v.startAt, zone).date === date).sort((a, b) => a.startAt < b.startAt ? -1 : 1).flatMap(v => {
    const j = job(v.jobId), label = `${j?.number ?? 'Visit'} at ${wallTime(localParts(v.startAt, zone).time)}`
    const why = !v.technicianId ? 'no technician is assigned' : v.status !== 'arrived' && now >= Date.parse(v.startAt) + late ? `${technician(v.technicianId)} has not arrived 15 minutes after the start` : v.status === 'arrived' && now >= Date.parse(v.endAt) ? `${technician(v.technicianId)} is still on site after the planned end` : null
    return why ? [{ kind: 'atRisk', id: v.id, text: `${label} for ${customer(j?.customerId)}: ${why}`, action: { label: 'Open dispatch', href: '#dispatch' } }] : []
  })
  const unbilled: Item[] = s.jobs.filter(j => j.status === 'completed').flatMap(j => {
    const inv = s.invoices.find(i => i.jobId === j.id)
    if (inv && inv.status !== 'draft') return []
    return [{ kind: 'unbilled', id: j.id, text: `${j.number} for ${customer(j.customerId)} is complete ${inv ? `and ${inv.number} awaits approval` : 'with no invoice'}`, action: { label: inv ? 'Approve invoice' : 'Prepare invoice', href: '#invoices' } }]
  })
  const overEstimate: Item[] = s.jobs.filter(j => j.status === 'open').flatMap(j => {
    const k = costing(s, j), estimate = cents(k.estimate.cost, 'estimate'), actual = cents(k.actual.cost, 'actual')
    return estimate > 0 && actual > estimate ? [{ kind: 'overEstimate', id: j.id, text: `${j.number} for ${customer(j.customerId)} has cost $${dollars(actual)} against a $${dollars(estimate)} estimate`, action: { label: 'Review job costs', href: '#jobs' } }] : []
  })
  const leads: Item[] = s.enquiries.filter((e: Row) => ['new', 'contacted'].includes(e.status) && now - Date.parse(e.stageAt ?? e.createdAt) >= waiting).map((e: Row) => ({
    kind: 'leadWaiting', id: e.id, text: `${customer(e.customerId)}'s ${e.source} request has been ${e.status} for ${Math.floor((now - Date.parse(e.stageAt ?? e.createdAt)) / 3_600_000)} hours`, action: { label: e.status === 'new' ? 'Contact the customer' : 'Quote the request', href: '#quotes' },
  }))
  return { date, timezone: zone, at, preparedBy: 'Glove, from your records', sections: { atRisk, unbilled, overEstimate, leads }, notTracked: ['Overdue invoices arrive with payments (PAY-004).', 'Agreements due arrive with maintenance agreements (PLAN-004).'] }
}
