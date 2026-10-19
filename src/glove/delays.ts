import { conflicts, type Slot } from './commands/dispatch'
import type { Actor, Context, Row, State } from './model'

// AGENT-003 (ct approved 19 October 2026 as pattern-1 DONE): the delay watch
// over today's signals. A booked visit not yet arrived is at risk when its
// technician is still on an earlier visit after that visit's booked end (a
// running job timer, or arrival without completion): Glove expects them free
// at now plus the overrun so far, at least 15 minutes, and flags their later
// visits that day starting before then. A visit is also at risk when a
// purchase order for its job is not fully received. For an overrun, the watch
// offers each other active technician in the job's branch free at the same
// planned time (skills, areas, time off and calendars checked; cancelled
// visits free their slots), then the same technician later the same day
// inside the visit's arrival window. A move that keeps the planned time, or
// stays inside the arrival window, changes no promise to the customer; any
// other move is labelled "customer not yet asked" (COMM-002/COMM-005 carry the
// customer's confirmation by reply; DISP-005 adds technician locations).

const minute = 60_000
export type Option = { technicianId: string; date: string; start: string; end: string; customer: 'unchanged' | 'customer not yet asked'; note: string }
export type Risk = { visitId: string; version: number; jobId: string; number: string; technicianId: string; startAt: string; reasons: string[]; options: Option[] }

const hhmm = (zone: string, iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
const later = (t: string, minutes: number) => { const m = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + minutes; return m >= 24 * 60 ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
const span = (v: Row) => (Date.parse(v.endAt) - Date.parse(v.startAt)) / minute

/** Where a visit could go instead, at an instant offset in minutes from its current slot. */
function candidate(visit: Row, technicianId: string, shift: number): Slot | null {
  const start = later(visit.local.start, shift), end = start && later(start, span(visit))
  if (!start || !end) return null
  return { technicianId, startAt: new Date(Date.parse(visit.startAt) + shift * minute).toISOString(), endAt: new Date(Date.parse(visit.endAt) + shift * minute).toISOString(), local: { ...visit.local, start, end } }
}

/** No conflict at all for this slot; a refusal (another branch, a refused area) means not feasible. */
function feasible(c: Context, job: Row, next: Slot | null, visit: Row) {
  if (!next) return false
  try { return !conflicts(c, job, next, visit).length } catch { return false }
}

export function delayWatch(s: State, actor: Actor, now: string): Risk[] {
  const c = { s, actor, now, events: [], files: [], sql: [], commandId: 'delay-watch' } as unknown as Context
  const at = Date.parse(now), risks = new Map<string, Risk>()
  const add = (v: Row, reason: string) => {
    const job = s.jobs.find(j => j.id === v.jobId)!
    const r: Risk = risks.get(v.id) ?? { visitId: v.id, version: v.version, jobId: v.jobId, number: job.number, technicianId: v.technicianId, startAt: v.startAt, reasons: [], options: [] }
    r.reasons.push(reason); risks.set(v.id, r)
    return r
  }
  const upcoming = (v: Row) => v.status === 'booked' && !v.arrival
  for (const e of s.visits) {
    if (e.status === 'cancelled' || e.completion || Date.parse(e.endAt) >= at) continue
    const timer = s.times.find(t => t.kind === 'job' && t.visitId === e.id && !t.endAt)
    if (!timer && !e.arrival) continue
    const overrun = (at - Date.parse(e.endAt)) / minute, free = at + Math.max(15, overrun) * minute
    const tech = s.technicians.find(t => t.id === e.technicianId)!, earlier = s.jobs.find(j => j.id === e.jobId)!
    for (const v of s.visits.filter(x => x.technicianId === e.technicianId && x.id !== e.id && upcoming(x) && x.local.date === e.local.date && x.startAt >= e.endAt && Date.parse(x.startAt) < free)) {
      const zone = v.local.timezone, r = add(v, `${tech.name} is still on ${earlier.number}, ${Math.round(overrun)} min past its booked end; expected free about ${hhmm(zone, new Date(free).toISOString())}.`)
      const job = s.jobs.find(j => j.id === v.jobId)!
      for (const other of s.technicians.filter(t => t.active && t.id !== v.technicianId)) {
        if (feasible(c, job, candidate(v, other.id, 0), v)) r.options.push({ technicianId: other.id, date: v.local.date, start: v.local.start, end: v.local.end, customer: 'unchanged', note: `${other.name} is free at the same time.` })
      }
      const shift = Math.ceil((free - Date.parse(v.startAt)) / (15 * minute)) * 15, own = candidate(v, v.technicianId, shift)
      const inside = own && v.arrivalWindow && own.local.start >= v.arrivalWindow.start && own.local.start <= v.arrivalWindow.end
      if (own && feasible(c, job, own, v)) r.options.push({ technicianId: v.technicianId, date: own.local.date, start: own.local.start, end: own.local.end, customer: inside ? 'unchanged' : 'customer not yet asked', note: inside ? `${tech.name} later, inside the arrival window.` : `${tech.name} later; outside any promised window.` })
    }
  }
  for (const po of s.purchaseOrders.filter(p => p.jobId && p.status !== 'received')) {
    for (const v of s.visits.filter(x => x.jobId === po.jobId && upcoming(x) && Date.parse(x.startAt) >= at)) add(v, `${po.number} from ${po.supplier} is ${po.status}; reschedule once the parts' arrival is known.`)
  }
  return [...risks.values()].sort((a, b) => a.startAt.localeCompare(b.startAt))
}
