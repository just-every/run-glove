import { fail, type Row, type State } from './model'
import { cents, dollars } from './money'
import { localParts } from './time'
import { minutes } from './commands/time'
import { costingReport, jobType } from './costing'
import { sourceReport } from './pipeline'
import { formatCsv } from './csv-format'

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
// jurisdiction today. Margins are COST-004's.

export const reportKinds = ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax'] as const
export type ReportKind = (typeof reportKinds)[number]
type Filters = { jobType?: string; technicianId?: string; source?: string }

export const CALLBACK_DAYS = 30
const pct = (n: number, d: number) => { if (!d) return null; const t = Math.floor((2000 * n + d) / (2 * d)); return `${Math.floor(t / 10)}.${t % 10}` }

/** Each invoice once: its latest approved revision, dated by its first approval. */
function approvedInvoices(s: State, zone: string, from: string, to: string) {
  return s.invoices.flatMap(inv => {
    const approved = inv.revisions.filter((r: Row) => r.approval)
    if (!approved.length) return []
    const date = localParts(approved[0].approval.at, zone).date
    if (date < from || date > to) return []
    const job = s.jobs.find(j => j.id === inv.jobId)
    return job ? [{ inv, job, rev: approved[approved.length - 1], date }] : []
  })
}

const completers = (s: State, job: Row) => [...new Set(s.visits.filter(v => v.jobId === job.id && v.status === 'completed').map(v => v.completion?.technicianId ?? v.technicianId))]
  .map(id => s.technicians.find(t => t.id === id)).filter((t): t is Row => !!t).sort((a, b) => a.name.localeCompare(b.name))

function revenue(s: State, zone: string, from: string, to: string, f: Filters) {
  const rows = approvedInvoices(s, zone, from, to).filter(x => !f.jobType || jobType(s, x.job) === f.jobType)
  const sum = (list: typeof rows) => dollars(list.reduce((n, x) => n + cents(x.rev.totals.subtotal, 'subtotal'), 0))
  const months = [...new Set(rows.map(x => x.date.slice(0, 7)))].sort(), types = [...new Set(rows.map(x => jobType(s, x.job)))].sort()
  return {
    total: { invoices: rows.length, revenue: sum(rows) },
    byMonth: months.map(month => { const list = rows.filter(x => x.date.startsWith(month)); return { month, invoices: list.length, revenue: sum(list) } }),
    byJobType: types.map(type => { const list = rows.filter(x => jobType(s, x.job) === type); return { type, invoices: list.length, revenue: sum(list) } }),
  }
}

function technicians(s: State, zone: string, from: string, to: string, f: Filters) {
  const inPeriod = (iso: string) => { const d = localParts(iso, zone).date; return d >= from && d <= to }
  const money = new Map<string, number>()
  for (const x of approvedInvoices(s, zone, from, to)) {
    const people = completers(s, x.job), total = cents(x.rev.totals.subtotal, 'subtotal')
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
  const b = s.business[0], rows = approvedInvoices(s, zone, from, to)
  const months = [...new Set(rows.map(x => x.date.slice(0, 7)))].sort()
  const sum = (list: typeof rows, k: 'subtotal' | 'gst') => dollars(list.reduce((n, x) => n + cents(x.rev.totals[k], k), 0))
  const jurisdiction = b?.taxJurisdiction ?? 'GST (the business\'s tax)'
  return { basis: 'tax on approved invoices; Glove records no payments yet', jurisdictions: [{ jurisdiction, invoices: rows.length, taxable: sum(rows.filter(x => x.rev.totals.gst !== '0.00'), 'subtotal'), tax: sum(rows, 'gst'), byMonth: months.map(month => { const list = rows.filter(x => x.date.startsWith(month)); return { month, invoices: list.length, tax: sum(list, 'gst') } }) }] }
}

function margins(s: State, from: string, to: string, f: Filters) {
  const r = costingReport(s, from, to)
  return f.jobType ? { ...r, byJobType: r.byJobType.filter(x => x.type === f.jobType), total: r.byJobType.find(x => x.type === f.jobType) ?? { jobs: 0, revenue: '0.00', estimatedCost: '0.00', actualCost: '0.00', estimatedMargin: null, actualMargin: null } } : r
}

export function report(s: State, kind: string, from: string, to: string, f: Filters) {
  if (![from, to].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || from > to) fail('INPUT', 'Give the period as from=YYYY-MM-DD&to=YYYY-MM-DD.', null, 400)
  const zone = s.business[0]?.timezone ?? 'UTC'
  const body = kind === 'revenue' ? revenue(s, zone, from, to, f) : kind === 'technicians' ? technicians(s, zone, from, to, f) : kind === 'sources' ? sources(s, zone, from, to, f)
    : kind === 'quotes' ? quotes(s, zone, from, to, f) : kind === 'margins' ? margins(s, from, to, f) : kind === 'tax' ? tax(s, zone, from, to) : fail('NOT_FOUND', `Reports: ${reportKinds.join(', ')}.`, null, 404)
  return { kind, from, to, filters: f, ...body }
}

/** The report's rows as CSV: the same figures as its JSON. */
export function reportCsv(r: ReturnType<typeof report>) {
  const x = r as any
  const table: string[][] = r.kind === 'revenue' ? [['group', 'key', 'invoices', 'revenue'], ...x.byMonth.map((m: Row) => ['month', m.month, String(m.invoices), m.revenue]), ...x.byJobType.map((m: Row) => ['job type', m.type, String(m.invoices), m.revenue]), ['total', '', String(x.total.invoices), x.total.revenue]]
    : r.kind === 'technicians' ? [['technician', 'revenue', 'visits completed', 'callbacks', 'callback rate', 'hours'], ...x.technicians.map((t: Row) => [t.technician, t.revenue, String(t.visitsCompleted), String(t.callbacks), t.callbackRate ?? '', t.hours])]
    : r.kind === 'sources' ? [['source', 'requests', 'won', 'conversion', 'won value', 'invoiced'], ...x.sources.map((t: Row) => [t.source, String(t.requests), String(t.won), t.conversion, t.wonValue, t.invoiced]), ['total', String(x.total.requests), String(x.total.won), x.total.conversion, x.total.wonValue, x.total.invoiced]]
    : r.kind === 'quotes' ? [['answered', 'won', 'lost', 'win rate', 'won value'], [String(x.answered), String(x.won), String(x.lost), x.winRate ?? '', x.wonValue]]
    : r.kind === 'margins' ? [['job type', 'jobs', 'revenue', 'estimated cost', 'actual cost', 'estimated margin', 'actual margin'], ...x.byJobType.map((t: Row) => [t.type, String(t.jobs), t.revenue, t.estimatedCost, t.actualCost, t.estimatedMargin ?? '', t.actualMargin ?? '']), ['total', String(x.total.jobs), x.total.revenue, x.total.estimatedCost, x.total.actualCost, x.total.estimatedMargin ?? '', x.total.actualMargin ?? '']]
    : [['jurisdiction', 'month', 'invoices', 'tax'], ...x.jurisdictions.flatMap((j: Row) => [...j.byMonth.map((m: Row) => [j.jurisdiction, m.month, String(m.invoices), m.tax]), [j.jurisdiction, 'total', String(j.invoices), j.tax]])]
  return formatCsv(table)
}
