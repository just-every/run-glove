import { branchState } from './branch-access'
import { branchIdOf, branchZone } from './branches'
import { fail, type Row, type State } from './model'
import { cents, dollars, netCents } from './money'
import { localParts } from './time'
import { minutes } from './commands/time'
import { costingReport, jobType } from './costing'
import { sourceReport } from './pipeline'
import { formatCsv } from './csv-format'
import { agreementReport } from './agreements'
import { invoiceReportDate } from './receivables'

// Job, revenue, technician, lead, quote and tax reports (REPORT-002), each for
// a period of local dates in the business time zone (bounds inclusive), with
// one filter, as JSON or CSV. Revenue is an invoice's latest person-approved
// revision subtotal before tax, dated by the invoice's first approval. A
// technician's revenue is each such job's revenue split equally among the
// technicians who completed its visits (the cent remainder to the first by
// name); their hours are their clocked shifts that started in the period; a
// callback is a later job at the same site created within 30 days of a visit
// they completed. Lead conversion counts requests made in the period by
// source; the quote win rate is quotes accepted ÷ quotes answered in the
// period. Tax is the approved revisions' tax, by the business's one tax
// jurisdiction today. Margins are COST-004's. Agreements are PLAN-002's: sold
// (by the local date sold), active on the period's last day, and churn.

export const reportKinds = ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax', 'agreements'] as const
export type ReportKind = (typeof reportKinds)[number]
type Filters = { jobType?: string; technicianId?: string; source?: string; branchId?: string }

export const CALLBACK_DAYS = 30
const pct = (n: number, d: number) => { if (!d) return null; const t = Math.floor((2000 * n + d) / (2 * d)); return `${Math.floor(t / 10)}.${t % 10}` }

/** Each invoice once: its latest approved revision, dated by its first approval. */
export function approvedInvoices(s: State, zone: string, from: string, to: string, branchLocal = false) {
  return s.invoices.flatMap(inv => {
    const approved = inv.revisions.filter((r: Row) => r.approval)
    if (!approved.length) return []
    const job = s.jobs.find(j => j.id === inv.jobId)
    const date = invoiceReportDate(inv, localParts(approved[0].approval.at, branchLocal && job ? branchZone(s, job) : zone).date)
    if (date < from || date > to) return []
    return job ? [{ inv, job, rev: approved[approved.length - 1], date }] : []
  })
}

function lateApprovals(rows: ReturnType<typeof approvedInvoices>) {
  const late = rows.filter(x => x.inv.recurring?.mode === 'fixed-monthly' && x.inv.dates?.approvedAfterPeriodEnd).map(x => ({ invoiceId: x.inv.id, number: x.inv.number, issuedOn: x.date, approvedOn: x.inv.dates.approvedOn, dueOn: x.inv.dates.dueOn, label: 'approved after period end' }))
  return late.length ? { approvedAfterPeriodEnd: late } : {}
}

export const completers = (s: State, job: Row) => [...new Set(s.visits.filter(v => v.jobId === job.id && v.status === 'completed').map(v => v.completion?.technicianId ?? v.technicianId))]
  .map(id => s.technicians.find(t => t.id === id)).filter((t): t is Row => !!t).sort((a, b) => a.name.localeCompare(b.name))

function revenue(s: State, zone: string, from: string, to: string, f: Filters) {
  if (f.branchId && f.branchId !== 'main' && !s.branches.some(b => b.id === f.branchId)) fail('NOT_FOUND', 'No such branch.', null, 404)
  const rows = approvedInvoices(s, zone, from, to, true).filter(x => (!f.jobType || jobType(s, x.job) === f.jobType) && (!f.branchId || (branchIdOf(s, x.job) ?? 'main') === f.branchId))
  const sum = (list: typeof rows) => dollars(list.reduce((n, x) => n + netCents(x.rev.totals), 0))
  const months = [...new Set(rows.map(x => x.date.slice(0, 7)))].sort(), types = [...new Set(rows.map(x => jobType(s, x.job)))].sort()
  return {
    ...lateApprovals(rows),
    total: { invoices: rows.length, revenue: sum(rows) },
    byBranch: [...new Set(rows.map(x => branchIdOf(s, x.job) ?? 'main'))].map(branchId => { const list = rows.filter(x => (branchIdOf(s, x.job) ?? 'main') === branchId); return { branchId, branch: s.branches.find(b => b.id === branchId)?.name ?? 'Main business', invoices: list.length, revenue: sum(list) } }).sort((a, b) => a.branch.localeCompare(b.branch)),
    byMonth: months.map(month => { const list = rows.filter(x => x.date.startsWith(month)); return { month, invoices: list.length, revenue: sum(list) } }),
    byJobType: types.map(type => { const list = rows.filter(x => jobType(s, x.job) === type); return { type, invoices: list.length, revenue: sum(list) } }),
  }
}

function technicians(s: State, zone: string, from: string, to: string, f: Filters) {
  const inPeriod = (iso: string) => { const d = localParts(iso, zone).date; return d >= from && d <= to }
  const money = new Map<string, number>()
  for (const x of approvedInvoices(s, zone, from, to)) {
    const people = completers(s, x.job), total = netCents(x.rev.totals)
    people.forEach((t, i) => money.set(t.id, (money.get(t.id) ?? 0) + Math.floor(total / people.length) + (i === 0 ? total % people.length : 0)))
  }
  return {
    technicians: s.technicians.filter(t => !f.technicianId || t.id === f.technicianId).map(t => {
      const done = s.visits.filter(v => v.status === 'completed' && (v.completion?.technicianId ?? v.technicianId) === t.id && v.completion?.receivedAt && inPeriod(v.completion.receivedAt))
      const callbacks = done.filter(v => { const job = s.jobs.find(j => j.id === v.jobId), at = Date.parse(v.completion.receivedAt); return job && s.jobs.some(o => o.id !== job.id && o.siteId === job.siteId && Date.parse(o.createdAt) > at && Date.parse(o.createdAt) - at <= CALLBACK_DAYS * 86_400_000) })
      const shiftMinutes = s.times.filter(x => x.technicianId === t.id && x.kind === 'shift' && x.endAt && inPeriod(x.startAt)).reduce((n, x) => n + minutes(x.startAt, x.endAt), 0)
      return { technicianId: t.id, technician: t.name, revenue: dollars(money.get(t.id) ?? 0), visitsCompleted: done.length, callbacks: callbacks.length, callbackRate: pct(callbacks.length, done.length), hours: (Math.round(shiftMinutes / 6) / 10).toFixed(1) }
    }),
  }
}

function sources(s: State, zone: string, from: string, to: string, f: Filters) {
  const inPeriod = (e: Row) => { const d = localParts(e.createdAt, zone).date; return d >= from && d <= to && (!f.source || e.source === f.source) }
  const r = sourceReport({ ...s, enquiries: s.enquiries.filter(inPeriod) }, new Date().toISOString())
  return { sources: r.sources, total: r.total }
}

function quotes(s: State, zone: string, from: string, to: string, f: Filters) {
  const answered = s.quotes.flatMap(q => { const a = q.acceptance ?? q.declined; if (!a?.at) return []; const d = localParts(a.at, zone).date; return d >= from && d <= to ? [q] : [] })
    .filter(q => !f.source || s.enquiries.find(e => e.id === q.enquiryId)?.source === f.source)
  const won = answered.filter(q => q.status === 'accepted')
  const value = won.reduce((n, q) => n + cents((q.acceptance.totals ?? q.revisions.find((r: Row) => r.n === q.acceptance.revision).totals).total, 'total'), 0)
  return { answered: answered.length, won: won.length, lost: answered.length - won.length, winRate: pct(won.length, answered.length), wonValue: dollars(value) }
}

function tax(s: State, zone: string, from: string, to: string) {
  const rows = approvedInvoices(s, zone, from, to, true)
  const entries = rows.flatMap(x => (x.rev.totals.taxBreakdown ?? [{ branchId: branchIdOf(s, x.job), jurisdictionId: 'GST', jurisdiction: s.business[0]?.taxJurisdiction ?? "GST (the business's tax)", rate: '10', taxable: dollars(x.rev.lines.filter((l: Row) => l.tax !== 'FREE').reduce((n: number, l: Row) => n + cents(l.total, 'line'), 0)), tax: x.rev.totals.gst }]).map((j: Row) => ({ ...j, date: x.date, invoiceId: x.inv.id })))
  const keys = [...new Set(entries.map((j: Row) => JSON.stringify([j.branchId, j.jurisdictionId])))]
  const sum = (list: Row[], k: string) => dollars(list.reduce((n, x) => n + cents(x[k], k), 0))
  return { ...lateApprovals(rows), basis: 'tax on approved invoices; Glove records no payments yet', jurisdictions: keys.map(key => {
    const list = entries.filter((j: Row) => JSON.stringify([j.branchId, j.jurisdictionId]) === key), first = list[0]
    const months = [...new Set(list.map((j: Row) => j.date.slice(0, 7)))].sort()
    return { branchId: first.branchId, branch: s.branches.find(b => b.id === first.branchId)?.name ?? 'Main business', jurisdictionId: first.jurisdictionId, jurisdiction: first.jurisdiction, invoices: new Set(list.map((j: Row) => j.invoiceId)).size, taxable: sum(list, 'taxable'), tax: sum(list, 'tax'), byMonth: months.map(month => { const m = list.filter((j: Row) => j.date.startsWith(month)); return { month, invoices: new Set(m.map((j: Row) => j.invoiceId)).size, tax: sum(m, 'tax') } }) }
  }) }

}

function margins(s: State, from: string, to: string, f: Filters) {
  return costingReport(s, from, to, f.jobType)
}

export function report(s: State, kind: string, from: string, to: string, f: Filters) {
  if (![from, to].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || from > to) fail('INPUT', 'Give the period as from=YYYY-MM-DD&to=YYYY-MM-DD.', null, 400)
  if (f.branchId) {
    if (f.branchId !== 'main' && !s.branches.some(b => b.id === f.branchId)) fail('NOT_FOUND', 'No such branch.', null, 404)
    s = branchState(s, { branch: { id: f.branchId === 'main' ? null : f.branchId, version: 0 } } as any)
  }
  const zone = s.business[0]?.timezone ?? 'UTC'
  const body = kind === 'revenue' ? revenue(s, zone, from, to, f) : kind === 'technicians' ? technicians(s, zone, from, to, f) : kind === 'sources' ? sources(s, zone, from, to, f)
    : kind === 'quotes' ? quotes(s, zone, from, to, f) : kind === 'margins' ? margins(s, from, to, f) : kind === 'tax' ? tax(s, zone, from, to) : kind === 'agreements' ? agreementReport(s, from, to) : fail('NOT_FOUND', `Reports: ${reportKinds.join(', ')}.`, null, 404)
  return { kind, from, to, filters: f, ...body }
}

/** The report's rows as CSV: the same figures as its JSON. */
export function reportCsv(r: ReturnType<typeof report>) {
  const x = r as any
  const table: string[][] = r.kind === 'revenue' ? [['group', 'key', 'invoices', 'revenue'], ...x.byMonth.map((m: Row) => ['month', m.month, String(m.invoices), m.revenue]), ...x.byJobType.map((m: Row) => ['job type', m.type, String(m.invoices), m.revenue]), ...x.byBranch.map((m: Row) => ['branch', m.branch, String(m.invoices), m.revenue]), ['total', '', String(x.total.invoices), x.total.revenue]]
    : r.kind === 'technicians' ? [['technician', 'revenue', 'visits completed', 'callbacks', 'callback rate', 'hours'], ...x.technicians.map((t: Row) => [t.technician, t.revenue, String(t.visitsCompleted), String(t.callbacks), t.callbackRate ?? '', t.hours])]
    : r.kind === 'sources' ? [['source', 'requests', 'won', 'conversion', 'won value', 'invoiced'], ...x.sources.map((t: Row) => [t.source, String(t.requests), String(t.won), t.conversion, t.wonValue, t.invoiced]), ['total', String(x.total.requests), String(x.total.won), x.total.conversion, x.total.wonValue, x.total.invoiced]]
    : r.kind === 'agreements' ? [['plan', 'sold'], ...x.byPlan.map((t: Row) => [t.plan, String(t.sold)]), ['total sold', String(x.sold)], ['active at period end', String(x.active)], ['churn', String(x.churn)], ['sold value', x.soldValue]]
    : r.kind === 'quotes' ? [['answered', 'won', 'lost', 'win rate', 'won value'], [String(x.answered), String(x.won), String(x.lost), x.winRate ?? '', x.wonValue]]
    : r.kind === 'margins' ? [['job type', 'jobs', 'revenue', 'estimated cost', 'actual cost', 'estimated margin', 'actual margin'], ...x.byJobType.map((t: Row) => [t.type, String(t.jobs), t.revenue, t.estimatedCost, t.actualCost, t.estimatedMargin ?? '', t.actualMargin ?? '']), ['total', String(x.total.jobs), x.total.revenue, x.total.estimatedCost, x.total.actualCost, x.total.estimatedMargin ?? '', x.total.actualMargin ?? '']]
    : [['branch', 'jurisdiction', 'month', 'invoices', 'tax'], ...x.jurisdictions.flatMap((j: Row) => [...j.byMonth.map((m: Row) => [j.branch, j.jurisdiction, m.month, String(m.invoices), m.tax]), [j.branch, j.jurisdiction, 'total', String(j.invoices), j.tax]])]
  for (const late of x.approvedAfterPeriodEnd ?? []) table.push(r.kind === 'revenue' ? [late.label, `${late.number}: issued ${late.issuedOn}; approved ${late.approvedOn}; due ${late.dueOn}`, '', ''] : [late.label, late.number, `issued ${late.issuedOn}; approved ${late.approvedOn}; due ${late.dueOn}`, '', ''])
  return formatCsv(table)
}
