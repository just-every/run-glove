import type { Row, State } from './model'
import { cents, dollars } from './money'

// Where requests come from and how far each got (BOOK-003): new → contacted →
// quoted → won, or lost with a reason. The report counts every request by its
// source and sums what it won (the accepted quote revision's total) and what
// was invoiced for it (the latest person-approved invoice revision of the job
// that quote became).

export const sources = ['website', 'google', 'reserve-google', 'phone', 'text', 'angi', 'thumbtack', 'yelp', 'referral', 'repeat customer', 'marketing campaign', 'email', 'in person', 'workiz', 'fieldpulse', 'servicetitan'] as const
export const stages = ['new', 'contacted', 'quoted', 'won', 'lost'] as const

const day = 86_400_000
/** n / d as a percentage to one decimal place, rounded half up, in integer arithmetic. */
function percent(n: number, d: number) {
  if (!d) return '0.0'
  const tenths = Math.floor((2000 * n + d) / (2 * d))
  return `${Math.floor(tenths / 10)}.${tenths % 10}`
}

function wonQuote(s: State, e: Row) {
  return s.quotes.find(q => q.enquiryId === e.id && q.status === 'accepted') ?? null
}

function invoicedCents(s: State, quote: Row | null) {
  return quote?.jobId ? s.invoices.filter(i => i.jobId === quote.jobId).reduce((sum, inv) => {
    const approved = [...inv.revisions].reverse().find((r: Row) => r.approval)
    return sum + (approved ? cents(approved.totals.total, 'total') : 0)
  }, 0) : 0
}

export function sourceReport(s: State, now: string) {
  const rows = new Map(sources.map(source => [source as string, { source, requests: 0, contacted: 0, quoted: 0, won: 0, lost: 0, wonValue: 0, invoiced: 0 }]))
  for (const e of s.enquiries) {
    const r = rows.get(e.source)
    if (!r) continue
    const quote = wonQuote(s, e)
    r.requests++
    if (e.contacts?.length) r.contacted++
    if (s.quotes.some(q => q.enquiryId === e.id)) r.quoted++
    if (e.status === 'won') r.won++
    if (e.status === 'lost') r.lost++
    if (quote) r.wonValue += cents((quote.acceptance.totals ?? quote.revisions.find((v: Row) => v.n === quote.acceptance.revision).totals).total, 'total')
    r.invoiced += invoicedCents(s, quote)
  }
  const used = [...rows.values()].filter(r => r.requests)
  const customer = (id: string) => s.customers.find(c => c.id === id)?.name ?? ''
  return {
    sources: used.map(r => ({ ...r, conversion: percent(r.won, r.requests), wonValue: dollars(r.wonValue), invoiced: dollars(r.invoiced) })),
    total: { requests: used.reduce((n, r) => n + r.requests, 0), won: used.reduce((n, r) => n + r.won, 0), conversion: percent(used.reduce((n, r) => n + r.won, 0), used.reduce((n, r) => n + r.requests, 0)), wonValue: dollars(used.reduce((n, r) => n + r.wonValue, 0)), invoiced: dollars(used.reduce((n, r) => n + r.invoiced, 0)) },
    pipeline: stages.map(stage => ({
      stage,
      requests: s.enquiries.filter(e => e.status === stage).map(e => ({ id: e.id, customer: customer(e.customerId), description: e.description, source: e.source, since: e.stageAt, ageDays: Math.floor((Date.parse(now) - Date.parse(e.stageAt)) / day), lostReason: e.lostReason ?? null })),
    })),
  }
}
