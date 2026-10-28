import { fail, text, find, expectVersion, bump, put, event, newId, type Context, type Row, type State } from './model'
import { cents, dollars } from './money'
import { localParts } from './time'
import { formatCsv } from './csv-format'
import type { Handler } from './commands/types'

// DISP-007, DISP-013, DISP-014 subcontractors (as ct approved 19 Oct 11:36Z): a technician record
// the owner marks as a subcontractor carries a 1099 payee name and only the
// last 4 digits of the TIN (a full TIN is never accepted or stored). The
// owner sets the agreed amount on each of their visits; the 1099-NEC totals
// for a calendar year sum the amounts on their completed visits, dated by the
// completion Glove received, in the business time zone. These are totals for
// the owner's filing; Glove files nothing.

export const totalsLabel = 'Totals for your filing, not a filed 1099'
export const NEC_THRESHOLD_CENTS = 60_000

/** The subcontractor part of technician.save: kept when not given, cleared with null. */
export function payee(p: any, current: Row | null) {
  if (p.subcontractor === undefined) return { subcontractor: current?.subcontractor ?? null }
  if (p.subcontractor === null) return { subcontractor: null }
  const tinLast4 = String(p.subcontractor?.tinLast4 ?? '')
  if (!/^\d{4}$/.test(tinLast4)) fail('INPUT', 'subcontractor.tinLast4 is the last 4 digits of the TIN only; Glove never keeps a full TIN.', { field: 'subcontractor.tinLast4' }, 400)
  return { subcontractor: { payeeName: text(p.subcontractor.payeeName, 'subcontractor.payeeName', { max: 200 }), tinLast4 } }
}

export const subcontract: Handler = async (c, type, p) => {
  if (type === 'crew.save') return saveCrew(c, p)
  if (type !== 'visit.agree') return undefined
  const visit = find(c.s, 'visits', p.visitId)
  expectVersion(visit, p.version)
  const tech = find(c.s, 'technicians', visit.technicianId)
  if (!tech.subcontractor) fail('NOT_SUBCONTRACTOR', `${tech.name} is not a subcontractor; agreed amounts are for subcontractors' visits.`)
  if (visit.status === 'cancelled') fail('VISIT_STATE', 'This visit is canceled.')
  const amount = p.amount === null ? null : dollars(cents(p.amount, 'amount'))
  event(c, { jobId: visit.jobId, subjectKind: 'visit', subjectId: visit.id, kind: 'visit.agreed', summary: amount === null ? `${c.actor.name} cleared the agreed amount for ${tech.name}` : `${c.actor.name} agreed $${amount} with ${tech.name} for this visit`, data: null })
  return bump(c.s, 'visits', visit, { agreed: amount === null ? null : { amount, technicianId: tech.id, by: c.actor.name, at: c.now } })
}

/** DISP-007, DISP-013, DISP-014: an owner-named crew of 2 to 10 active technicians or subcontractors. Changing it changes only later bookings. */
function saveCrew(c: Context, p: any) {
  const existing = p.id === undefined ? null : find(c.s, 'crews', p.id)
  if (existing) expectVersion(existing, p.version)
  const ids = Array.isArray(p.memberIds) ? [...new Set(p.memberIds.map(String))] as string[] : []
  if (ids.length < 2 || ids.length > 10) fail('INPUT', 'A crew has 2 to 10 members.', { field: 'memberIds' }, 400)
  for (const id of ids) if (!find(c.s, 'technicians', id).active) fail('TECHNICIAN', 'Every crew member is an active technician or subcontractor.')
  if (new Set(ids.map(id => find(c.s, 'technicians', id).branchId ?? null)).size !== 1) fail('BRANCH', 'Every crew member belongs to the same branch.')
  const fields = { name: text(p.name, 'name', { max: 100 }), memberIds: ids }
  if (c.s.crews.some(x => x.id !== existing?.id && x.name.toLowerCase() === fields.name.toLowerCase())) fail('DUPLICATE', `A crew is already called ${fields.name}.`)
  const row = existing ? bump(c.s, 'crews', existing, { ...fields, updatedAt: c.now }) : put(c.s, 'crews', { id: newId(), version: 1, createdAt: c.now, ...fields })
  event(c, { jobId: null, subjectKind: 'crew', subjectId: row.id, kind: 'crew.saved', summary: `Crew ${row.name}: ${ids.map(id => find(c.s, 'technicians', id).name).join(', ')}`, data: null })
  return row
}

/** One calendar year's 1099-NEC totals, one row per subcontractor with an agreed amount on a completed visit that year. */
export function necTotals(s: State, year: string) {
  if (!/^\d{4}$/.test(year)) fail('INPUT', 'Give the year as year=YYYY.', null, 400)
  const zone = s.business[0]?.timezone ?? 'UTC'
  const rows = s.technicians.filter(t => t.subcontractor).map(t => {
    const visits = s.visits.filter(v => v.status === 'completed' && v.completion && v.agreed?.technicianId === t.id && v.technicianId === t.id && localParts(v.completion.receivedAt, zone).date.startsWith(`${year}-`))
    const total = visits.reduce((n, v) => n + cents(v.agreed.amount, 'amount'), 0)
    return { technicianId: t.id, payeeName: t.subcontractor.payeeName, tinLast4: t.subcontractor.tinLast4, visits: visits.length, total: dollars(total), atOrOver600: total >= NEC_THRESHOLD_CENTS }
  }).filter(r => r.visits > 0)
  return { year, label: totalsLabel, rows }
}

export const necCsv = (r: ReturnType<typeof necTotals>) => formatCsv([['payee', 'tin last 4', 'completed visits', 'total', 'at or over $600', 'note'], ...r.rows.map(x => [x.payeeName, x.tinLast4, String(x.visits), x.total, x.atOrOver600 ? 'yes' : 'no', r.label])])
