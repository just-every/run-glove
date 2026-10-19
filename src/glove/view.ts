import { mayRead } from './access'
import type { Actor, Row, State } from './model'

// What each role may read. A technician sees only visits that were ever
// assigned to them, with those jobs' customers, sites, checklists and field
// evidence; prices, quotes, invoices and other people's work stay on the desk.
// Raw move-in files and export CSV bytes never travel in state.

const withoutFiles = (r: Row) => { const { files: _files, ...rest } = r; return rest }
const withoutCsv = (r: Row) => { const { csv: _csv, ...rest } = r; return rest }
/** A price-book item's or line's cost is a margin figure (MONEY-003), like an expense's markup. */
const uncosted = <T extends Row>({ unitCost: _c, ...rest }: T) => rest
const uncostedLines = (r: Row) => ({ ...r, ...(r.lines ? { lines: r.lines.map(uncosted) } : {}), ...(r.revisions ? { revisions: r.revisions.map((v: Row) => ({ ...v, lines: v.lines.map(uncosted) })) } : {}) })
/** A technician's loaded cost per hour is a margin figure too (COST-004). */
const unrated = ({ costRate: _r, ...rest }: Row) => rest
const unpriced = (job: Row) => { const { lines, totals: _totals, ...rest } = job; return { ...rest, lines: lines.map((l: Row) => ({ description: l.description, quantity: l.quantity })) } }

export function visible(s: State, actor: Actor) {
  if (actor.role !== 'technician') {
    // Expense costs and markups are margins: a custom role sees them only with reports.read.
    const margins = mayRead(actor, 'reports')
    return { ...s, imports: s.imports.map(withoutFiles), exports: s.exports.map(withoutCsv), expenses: margins ? s.expenses : [], ...(margins ? {} : { services: s.services.map(uncosted), quotes: s.quotes.map(uncostedLines), jobs: s.jobs.map(uncostedLines), technicians: s.technicians.map(unrated) }) }
  }
  const me = s.technicians.find(t => t.operatorId === actor.id)
  const visits = me ? s.visits.filter(v => v.assignments.some((a: Row) => a.technicianId === me.id)) : []
  const jobIds = new Set(visits.map(v => v.jobId))
  const jobs = s.jobs.filter(j => jobIds.has(j.id))
  const customerIds = new Set(jobs.map(j => j.customerId)), siteIds = new Set(jobs.map(j => j.siteId))
  const technicianIds = new Set(visits.flatMap(v => v.assignments.map((a: Row) => a.technicianId)))
  return {
    version: s.version, business: s.business, services: s.services.filter(x => !x.archived).map(({ unitPrice: _p, unitCost: _c, ...rest }) => rest),
    technicians: s.technicians.filter(t => technicianIds.has(t.id)).map(unrated), customers: s.customers.filter(c => customerIds.has(c.id)).map(({ id, version, name, phone, contact }) => ({ id, version, name, phone, contact })),
    sites: s.sites.filter(x => siteIds.has(x.id)), jobs: jobs.map(unpriced), visits,
    captures: s.captures.filter(x => jobIds.has(x.jobId)), equipment: s.equipment.filter(x => siteIds.has(x.siteId)),
    expenses: s.expenses.filter(x => jobIds.has(x.jobId) && x.recordedBy.id === actor.id),
    times: me ? s.times.filter(x => x.technicianId === me.id) : [], forms: [],
    stock: me ? s.stock.filter(l => l.technicianId === me.id) : [], stockMoves: me ? s.stockMoves.filter(m => s.stock.some(l => l.id === m.locationId && l.technicianId === me.id)) : [],
    enquiries: [], quotes: [], invoices: [], exports: [], proposals: [], approvals: [], imports: [], roles: [], grants: [], merges: [],
  }
}

export const visibleJobIds = (view: { jobs: Row[] }) => new Set(view.jobs.map(j => j.id))
