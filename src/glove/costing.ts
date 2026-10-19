import type { Row, State } from './model'
import { cents, dollars, thousandths } from './money'
import { localParts } from './time'
import { minutes } from './commands/time'
import { jobCost } from './commands/expenses'

// Estimate versus actual job costing (COST-004). Revenue is the latest
// person-approved invoice revision's subtotal before tax, else the accepted
// quote's subtotal. The estimate is each accepted line's unit cost (kept when it
// was priced from the price book) × its quantity. Actual labor is every travel
// and on-job entry's minutes × that technician's loaded cost per hour ÷ 60;
// materials are the price-book materials recorded on the job at their unit cost
// now; expenses and subcontractor bills are COST-003's amounts. Each product is
// rounded half up to the cent; a margin is (revenue − cost) ÷ revenue as a
// percentage to one decimal, rounded half up.

const lineCost = (unitCost: string, q: string) => Math.floor((cents(unitCost, 'unitCost') * thousandths(q, 'quantity') + 500) / 1000)
const laborCost = (rate: string | undefined, mins: number) => Math.floor((cents(rate ?? '0', 'costRate') * mins + 30) / 60)

/** (revenue − cost) ÷ revenue as a percentage to one decimal, rounded half up, in integer arithmetic. */
export function margin(revenue: number, cost: number) {
  if (revenue <= 0) return null
  const n = revenue - cost, neg = n < 0, tenths = Math.floor((2000 * Math.abs(n) + revenue) / (2 * revenue))
  return `${neg ? '-' : ''}${Math.floor(tenths / 10)}.${tenths % 10}`
}

export function revenueOf(s: State, job: Row) {
  const inv = s.invoices.find(i => i.jobId === job.id)
  const approved = inv ? [...inv.revisions].reverse().find((r: Row) => r.approval) : null
  return cents((approved ?? job).totals?.subtotal ?? '0.00', 'subtotal')
}

/** The price-book category of the job's first price-book line: its job type for reports. */
export function jobType(s: State, job: Row) {
  for (const line of job.lines ?? []) { const item = s.services.find(x => x.id === line.serviceId); if (item) return item.category || 'Uncategorized' }
  return 'Uncategorized'
}

export function costing(s: State, job: Row) {
  const revenue = revenueOf(s, job)
  const estimate = (job.lines ?? []).reduce((n: number, l: Row) => n + (l.unitCost ? lineCost(l.unitCost, l.quantity) : 0), 0)
  const uncostedLines = (job.lines ?? []).filter((l: Row) => !l.unitCost).length
  const labor = s.times.filter(x => x.jobId === job.id && x.kind !== 'shift' && x.endAt).map(x => {
    const tech = s.technicians.find(t => t.id === x.technicianId), mins = minutes(x.startAt, x.endAt)
    return { technicianId: x.technicianId, technician: tech?.name ?? '', kind: x.kind, minutes: mins, rate: tech?.costRate ?? null, cost: laborCost(tech?.costRate, mins) }
  })
  const materials = s.captures.filter(x => x.jobId === job.id && x.kind === 'material').map(x => {
    const item = x.serviceId ? s.services.find(i => i.id === x.serviceId) : null
    return { captureId: x.id, description: x.description, quantity: x.quantity, unit: x.unit, unitCost: item?.unitCost ?? null, cost: item?.unitCost ? lineCost(item.unitCost, x.quantity) : 0 }
  })
  const expenseRows = s.expenses.filter(e => e.jobId === job.id)
  const subcontractors = expenseRows.filter(e => e.category === 'subcontractor bill').reduce((n, e) => n + cents(e.amount, 'amount'), 0)
  const expenses = expenseRows.filter(e => e.category !== 'subcontractor bill').reduce((n, e) => n + cents(e.amount, 'amount'), 0)
  const sum = (rows: { cost: number }[]) => rows.reduce((n, r) => n + r.cost, 0)
  const actual = sum(labor) + sum(materials) + expenses + subcontractors
  const em = margin(revenue, estimate), am = margin(revenue, actual)
  return {
    revenue: dollars(revenue),
    estimate: { cost: dollars(estimate), margin: em, uncostedLines },
    actual: { labor: dollars(sum(labor)), materials: dollars(sum(materials)), expenses: dollars(expenses), subcontractors: dollars(subcontractors), cost: dollars(actual), margin: am, laborEntries: labor.map(l => ({ ...l, cost: dollars(l.cost) })), materialEntries: materials.map(m => ({ ...m, cost: dollars(m.cost) })), uncostedMaterials: materials.filter(m => !m.unitCost).length, unratedTime: labor.filter(l => !l.rate).length },
    difference: { cost: dollars(actual - estimate), margin: em && am ? (Math.round((Number(am) - Number(em)) * 10) / 10).toFixed(1) : null },
  }
}

export const jobCosting = (s: State, job: Row) => ({ ...jobCost(s, job), costing: costing(s, job) })

/** Completed jobs by their local completion date in [from, to], rolled up by job type and by technician. */
export function costingReport(s: State, from: string, to: string) {
  const zone = s.business[0]?.timezone ?? 'UTC'
  const jobs = s.jobs.filter(j => j.completedAt && ['completed', 'invoiced'].includes(j.status)).filter(j => { const d = localParts(j.completedAt, zone).date; return d >= from && d <= to })
  const rows = jobs.map(j => { const c = costing(s, j); return { job: j, c, revenue: cents(c.revenue, 'r'), estimate: cents(c.estimate.cost, 'e'), actual: cents(c.actual.cost, 'a') } })
  const roll = (list: typeof rows) => { const r = list.reduce((n, x) => n + x.revenue, 0), e = list.reduce((n, x) => n + x.estimate, 0), a = list.reduce((n, x) => n + x.actual, 0); return { jobs: list.length, revenue: dollars(r), estimatedCost: dollars(e), actualCost: dollars(a), estimatedMargin: margin(r, e), actualMargin: margin(r, a) } }
  const types = [...new Set(rows.map(x => jobType(s, x.job)))].sort()
  const techIds = [...new Set(rows.flatMap(x => x.c.actual.laborEntries.map(l => l.technicianId)))]
  return {
    from, to, total: roll(rows),
    byJobType: types.map(type => ({ type, ...roll(rows.filter(x => jobType(s, x.job) === type)) })),
    byTechnician: techIds.map(id => {
      const entries = rows.flatMap(x => x.c.actual.laborEntries.filter(l => l.technicianId === id))
      return { technicianId: id, technician: entries[0].technician, minutes: entries.reduce((n, l) => n + l.minutes, 0), laborCost: dollars(entries.reduce((n, l) => n + cents(l.cost, 'cost'), 0)), ...roll(rows.filter(x => x.c.actual.laborEntries.some(l => l.technicianId === id))) }
    }),
  }
}
