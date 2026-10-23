import { invoicePaid } from './payments'
import { branchZone } from './branches'
import { fail, type Row, type State } from './model'
import { cents, dollars } from './money'
import { localParts } from './time'
import { formatCsv } from './csv-format'

// REPORT-003: issue/due dates are frozen at first approval, never at export.
// Older approvals did not retain terms: their computed date is labelled as such.
export const addCalendarDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
export function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) fail('INPUT', 'Give asOf as a real date (YYYY-MM-DD).', null, 400)
  return value
}
export function invoiceDates(s: State, inv: Row) {
  if (inv.dates) return inv.dates as { issuedOn: string; dueOn: string; termsDays: number; basis: string }
  const approval = inv.revisions.find((r: Row) => r.approval)?.approval
  if (!approval) return null
  const job = s.jobs.find(j => j.id === inv.jobId)!
  const issuedOn = localParts(approval.at, branchZone(s, job)).date
  const termsDays = s.business[0]?.paymentTermsDays ?? 14
  return { issuedOn, dueOn: addCalendarDays(issuedOn, termsDays), termsDays, basis: 'due date computed from first approval and current terms' }
}

/** Only newly generated fixed-monthly invoices use the ct period-end exception. */
export function invoiceReportDate(inv: Row, approvalDate: string) {
  return inv.recurring?.mode === 'fixed-monthly' && inv.dates ? inv.dates.issuedOn as string : approvalDate
}
export const agingBuckets = ['current', '1-30', '31-60', '61-90', 'over90'] as const
const emptyBuckets = () => Object.fromEntries(agingBuckets.map(k => [k, 0])) as Record<(typeof agingBuckets)[number], number>
const amounts = (b: ReturnType<typeof emptyBuckets>) => Object.fromEntries(agingBuckets.map(k => [k, dollars(b[k])]))

export function receivables(s: State, asOf: string) {
  calendarDate(asOf)
  const invoices = s.invoices.flatMap(inv => {
    const dates = invoiceDates(s, inv)
    const approved = inv.revisions.filter((r: Row) => r.approval && localParts(r.approval.at, branchZone(s, s.jobs.find(j => j.id === inv.jobId)!)).date <= asOf)
    const opening = inv.openingBalance && inv.openingBalance.asOf <= asOf ? inv.openingBalance : null
    const rev = opening ? inv.revisions[0] : approved.at(-1)
    const gross = opening ? opening.amount : rev?.totals.total
    const balance = gross ? dollars(Math.max(0, cents(gross, 'total') - invoicePaid(s, inv.id, asOf))) : undefined
    if (!rev || !dates || cents(balance, 'balance') <= 0) return []
    const days = Math.round((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${dates.dueOn}T00:00:00Z`)) / 86_400_000)
    const bucket = days <= 0 ? 'current' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : 'over90'
    return [{ id: inv.id, number: inv.number, customerId: inv.customerId, customer: s.customers.find(c => c.id === inv.customerId)?.name ?? '', currency: rev.totals.currency ?? s.business[0]?.currency ?? 'USD', revision: rev.n, ...dates, daysPastDue: Math.max(0, days), bucket, balance: balance as string, reminderState: 'No reminders scheduled', href: `#invoices/${inv.id}` }]
  }).sort((a, b) => a.customer.localeCompare(b.customer) || a.dueOn.localeCompare(b.dueOn) || a.number.localeCompare(b.number))
  const rollup = (rows: typeof invoices) => { const b = emptyBuckets(); for (const inv of rows) b[inv.bucket as keyof typeof b] += cents(inv.balance, 'balance'); return { buckets: amounts(b), total: dollars(Object.values(b).reduce((a, n) => a + n, 0)) } }
  const customers = [...new Set(invoices.map(i => JSON.stringify([i.customerId, i.currency])))].map(key => {
    const list = invoices.filter(i => JSON.stringify([i.customerId, i.currency]) === key)
    return { customerId: list[0].customerId, customer: list[0].customer, currency: list[0].currency, ...rollup(list), invoices: list }
  })
  const totals = [...new Set(invoices.map(i => i.currency))].sort().map(currency => ({ currency, ...rollup(invoices.filter(i => i.currency === currency)) }))
  return { asOf, basis: s.payments.length ? 'Stripe test mode. Balances subtract confirmed payments; pending and returned payments do not reduce balances. No reminders scheduled.' : 'No payments recorded yet. Balances are the latest approved invoice totals and imported opening balances, which are not Glove sales; No reminders scheduled.', customers, totals }
}
export function receivablesCsv(r: ReturnType<typeof receivables>) {
  return formatCsv([['Customer', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Date basis', 'Days past due', 'Bucket', 'Balance', 'Reminder state', 'Invoice link'], ...r.customers.flatMap(c => c.invoices.map(i => [c.customer, i.currency, i.number, String(i.revision), i.issuedOn, i.dueOn, i.basis, String(i.daysPastDue), i.bucket, i.balance, i.reminderState, i.href]))])
}
