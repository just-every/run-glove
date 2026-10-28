import { fail, business, type Row, type State } from './model'
import { cents, dollars, netCents } from './money'
import { localParts } from './time'
import { approvedInvoices, completers } from './reports'

// TEAM-003, TEAM-006 technician commissions and spiffs. The owner keeps dated rule
// versions: a percent of sold revenue, a percent of completed revenue and a
// fixed spiff per agreement sold, each optional. A credited event takes the
// version in force on its local date (the latest whose "from" is on or before
// it), so a later rule never changes earlier earnings. Sold revenue is an
// accepted quote's accepted total before tax, credited to the technician the
// desk named as its seller, on the local date the acceptance was recorded.
// Completed revenue is REPORT-002, REPORT-004's technician revenue: an invoice's latest
// approved revision before tax, split equally among the technicians who
// completed the job's visits (cent remainder to the first by name), on the
// local date of its first approval. A spiff is credited to the technician
// named as the agreement's seller on the local date it was sold. Each credited
// event's amount is its base × percent rounded half up to the cent.

export type CommissionRule = { from: string; soldPercent: string | null; completedPercent: string | null; agreementSpiff: string | null }
export type Credit = { technicianId: string; date: string; kind: 'sold' | 'completed' | 'agreement'; subjectId: string; label: string; base: string; rate: string; amount: string }

const percent = (v: unknown, name: string) => v == null || v === '' ? null : typeof v === 'string' && /^\d{1,2}(\.\d{1,2})?$/.test(v) && Number(v) < 100 ? String(Number(v)) : fail('INPUT', `${name} is a percent from 0 to 99.99.`, { field: name }, 400)
const dateOk = (v: unknown, name: string) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : fail('INPUT', `Give ${name} as YYYY-MM-DD.`, { field: name }, 400)
/** base cents × percent, rounded half up to the cent. */
const share = (base: number, pct: string) => { const [w, f = ''] = pct.split('.'), bp = Number(w) * 100 + Number(f.padEnd(2, '0')); return Math.floor((base * bp + 5000) / 10000) }

export const commissionRules = (s: State): CommissionRule[] => s.business[0]?.payroll?.commissionRules ?? []

/** A rule version from the owner's settings, replacing any version from the same date. */
export function saveRule(s: State, p: any, today: string): CommissionRule[] {
  const rule: CommissionRule = { from: dateOk(p.from ?? today, 'commissions.from'), soldPercent: percent(p.soldPercent, 'commissions.soldPercent'), completedPercent: percent(p.completedPercent, 'commissions.completedPercent'), agreementSpiff: p.agreementSpiff == null || p.agreementSpiff === '' ? null : dollars(cents(p.agreementSpiff, 'commissions.agreementSpiff')) }
  return [...commissionRules(s).filter(r => r.from !== rule.from), rule].sort((a, b) => a.from.localeCompare(b.from))
}

export const ruleText = (r: CommissionRule) => [r.soldPercent && `${r.soldPercent}% of sold revenue`, r.completedPercent && `${r.completedPercent}% of completed revenue`, r.agreementSpiff && `$${r.agreementSpiff} per agreement sold`].filter(Boolean).join(', ') || 'no commission'

/** Every credited event in the period (local dates, both ends included) under the rule in force on its date. */
export function credits(s: State, from: string, to: string): Credit[] {
  const zone = business(s).timezone, rules = commissionRules(s), out: Credit[] = []
  const inForce = (date: string) => [...rules].reverse().find(r => r.from <= date) ?? null
  const add = (technicianId: string, date: string, kind: Credit['kind'], subjectId: string, label: string, base: number, pct: string | null) => {
    if (pct && base > 0) out.push({ technicianId, date, kind, subjectId, label, base: dollars(base), rate: `${pct}%`, amount: dollars(share(base, pct)) })
  }
  for (const q of s.quotes) {
    const a = q.acceptance
    if (q.status !== 'accepted' || !a?.soldByTechnicianId) continue
    const date = localParts(a.at, zone).date
    if (date < from || date > to) continue
    add(a.soldByTechnicianId, date, 'sold', q.id, `${q.number} sold`, netCents(a.totals ?? q.revisions.find((r: Row) => r.n === a.revision).totals), inForce(date)?.soldPercent ?? null)
  }
  for (const x of approvedInvoices(s, zone, from, to)) {
    const people = completers(s, x.job), total = netCents(x.rev.totals)
    people.forEach((t, i) => add(t.id, x.date, 'completed', x.inv.id, `${x.inv.number} completed`, Math.floor(total / people.length) + (i === 0 ? total % people.length : 0), inForce(x.date)?.completedPercent ?? null))
  }
  for (const a of s.agreements) {
    const spiff = inForce(a.soldOn)?.agreementSpiff
    if (!a.soldByTechnicianId || a.soldOn < from || a.soldOn > to || !spiff) continue
    out.push({ technicianId: a.soldByTechnicianId, date: a.soldOn, kind: 'agreement', subjectId: a.id, label: `${a.plan.name} sold`, base: a.plan.price, rate: `$${spiff}`, amount: spiff })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind))
}

const sum = (list: Credit[], k: 'amount' | 'base') => list.reduce((n, c) => n + cents(c[k], k), 0)

/** One technician's credited events as the payroll file reports them. */
export const summary = (list: Credit[]) => ({
  sold: { revenue: dollars(sum(list.filter(c => c.kind === 'sold'), 'base')), amount: dollars(sum(list.filter(c => c.kind === 'sold'), 'amount')) },
  completed: { revenue: dollars(sum(list.filter(c => c.kind === 'completed'), 'base')), amount: dollars(sum(list.filter(c => c.kind === 'completed'), 'amount')) },
  agreements: { count: list.filter(c => c.kind === 'agreement').length, amount: dollars(sum(list.filter(c => c.kind === 'agreement'), 'amount')) },
  total: dollars(sum(list, 'amount')),
  items: list,
})

export const totalCents = (list: Credit[]) => sum(list, 'amount')
