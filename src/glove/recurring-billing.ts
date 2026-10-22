import { allow } from './access'
import { branchZone } from './branches'
import { addCalendarDays, calendarDate } from './receivables'
import { lines, type Line } from './money'
import { bump, event, expectVersion, fail, find, newId, oneOf, Problem, put, text, type Context, type Row, type State } from './model'
import { localParts } from './time'
import { invoices, prepareRecurringInvoice, suggested } from './commands/invoices'
import { expenseLines } from './commands/expenses'
import type { Handler } from './commands/types'

// PLAN-005's draft/reminder slice. Billing identity survives rule changes,
// retries and concurrent command/cron passes; storage's version guard commits
// that identity and its invoice/reminder together. This module never sends or charges.
export const billingModes = ['per-visit', 'fixed-monthly', 'fixed-after-visit', 'on-close', 'as-needed'] as const
const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })
const day = (c: Context, job: Row) => localParts(c.now, branchZone(c.s, job)).date
const monthStart = (date: string) => `${date.slice(0, 7)}-01`
const nextMonth = (date: string) => { const d = new Date(`${monthStart(date)}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 10) }
const monthEnd = (date: string) => addCalendarDays(nextMonth(date), -1)
const revisions = (job: Row): Row[] => job.series?.billing?.revisions ?? []
const effective = (job: Row, date: string): Row | undefined => revisions(job).filter(r => r.from <= date).at(-1)

/** Owner pricing is explicit; dispatcher scheduling never grants money authority. */
export function configureBilling(c: Context, job: Row, input: any, from: string, reason = '') {
  if (c.actor.role !== 'owner' || c.actor.token) fail('FORBIDDEN', 'A signed-in owner sets recurring prices, pauses and auto-approval.', null, 403)
  if (!job.series) fail('NOT_SERIES', 'Make this job repeat before setting its invoicing rule.')
  calendarDate(from)
  if (from < day(c, job) || from < job.series.revisions[0].from || (revisions(job).at(-1)?.from ?? '') > from) fail('BILLING_DATE', 'Choose today or a later date, on or after the series start and its last billing change. Past billing is kept.')
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INPUT', 'Give a billing rule.', null, 400)
  const mode = oneOf(input.mode, billingModes, 'billing.mode'), fixed = mode.startsWith('fixed-')
  for (const flag of ['paused', 'autoApprove']) if (input[flag] !== undefined && typeof input[flag] !== 'boolean') fail('INPUT', `billing.${flag} is true or false.`, null, 400)
  if (input.autoApprove && !fixed) fail('INPUT', 'Only fixed invoices may have owner auto-approval.', null, 400)
  const sourceLines = input.lines ?? job.lines
  const priceLines = mode === 'as-needed' || (!fixed && Array.isArray(sourceLines) && !sourceLines.length) ? [] : lines(sourceLines, 'billing.lines')
  if (priceLines.some(l => l.discount)) fail('INPUT', 'Use non-negative recurring price lines.', null, 400)
  const rule = { n: (revisions(job).at(-1)?.n ?? 0) + 1, from, mode, lines: priceLines, discount: fixed ? null : structuredClone(job.discount ?? null), paused: input.paused === true, autoApprove: input.autoApprove === true, by: who(c), at: c.now }
  const row = bump(c.s, 'jobs', job, { series: { ...job.series, billing: { revisions: [...revisions(job), rule], missed: job.series.billing?.missed ?? [] } } })
  event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.billingChanged', summary: `${c.actor.name} set ${job.number} billing to ${mode} from ${from}${rule.paused ? ', paused' : ''}${rule.autoApprove ? ', with owner auto-approval of fixed invoices' : ', drafts require approval'}${reason ? `: ${reason}` : ''}`, data: { ruleRevision: rule.n, from, mode, paused: rule.paused, autoApprove: rule.autoApprove, reason } })
  return row
}

type Due = { jobId: string; number: string; key: string; dueDate: string; mode: string; rule: Row; visitId?: string; periodStart?: string; periodEnd?: string }

/** All due occurrences, including ones already fulfilled; no reads write data. */
function occurrences(s: State, job: Row, at: string): Due[] {
  const rules = revisions(job)
  if (!rules.length || job.erasedAt) return []
  const today = localParts(at, branchZone(s, job)).date, out: Due[] = []
  const add = (rule: Row | undefined, key: string, dueDate: string, detail: Partial<Due> = {}) => {
    if (!rule || rule.paused || dueDate > today) return
    out.push({ jobId: job.id, number: job.number, key: `${job.id}:${key}`, dueDate, mode: rule.mode, rule, ...detail })
  }
  // Monthly fixed prices and as-needed office reminders have an explicit
  // month-end schedule, independent of whether a visit took place.
  for (let first = monthStart(rules[0].from); first <= today; first = nextMonth(first)) {
    if (job.series.until && first > job.series.until) break
    const end = monthEnd(first), rule = effective(job, end)
    if (rule && ['fixed-monthly', 'as-needed'].includes(rule.mode)) add(rule, `month:${end}`, end, { periodStart: first < rule.from ? rule.from : first, periodEnd: end })
  }
  for (const visit of s.visits.filter(v => v.jobId === job.id && v.status === 'completed' && !v.completion?.imported)) {
    const date = visit.series?.occurrence ?? visit.local.date, rule = effective(job, date)
    if (rule && ['per-visit', 'fixed-after-visit'].includes(rule.mode) && visit.completion?.receivedAt >= rule.at) add(rule, `visit:${visit.id}`, localParts(visit.completion.receivedAt, branchZone(s, job)).date, { visitId: visit.id })
  }
  if (job.completedAt && ['completed', 'invoiced'].includes(job.status)) {
    const date = localParts(job.completedAt, branchZone(s, job)).date, rule = effective(job, date)
    if (rule?.mode === 'on-close' && job.completedAt >= rule.at) add(rule, 'close', date)
  }
  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.key.localeCompare(b.key))
}

const fulfilled = (s: State, due: Due) => s.invoices.some(i => i.recurring?.key === due.key) || s.notices.some(n => n.recurringBillingKey === due.key)

/** Missed dates remain visible even if a scheduled pass has not run yet. */
export function recurringBillingDue(s: State, at: string) {
  return s.jobs.flatMap(job => occurrences(s, job, at).filter(due => !fulfilled(s, due)).map(({ rule: _rule, ...due }) => ({ ...due, reason: (job.series.billing.missed ?? []).find((m: Row) => m.key === due.key)?.reason ?? 'Billing date passed without an invoice or office reminder' })))
}

async function autoApprove(c: Context, invoice: Row, rule: Row) {
  if (!rule.autoApprove || !invoice.recurring?.mode.startsWith('fixed-') || invoice.recurring.ruleRevision !== rule.n || c.actor.role !== 'owner' || c.actor.token || c.actor.id !== rule.by.id || invoice.status !== 'draft' || invoice.revisions.length !== 1) return
  try {
    const approved = await invoices(c, 'invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, undefined as never) as Row
    const approval = { ...approved.revisions.at(-1).approval, autoRule: { jobId: invoice.jobId, revision: rule.n, grantedBy: rule.by, grantedAt: rule.at } }
    bump(c.s, 'invoices', approved, { approvalAt: approval, autoApprovalRefused: null, revisions: [{ ...approved.revisions[0], approval }] })
    event(c, { jobId: invoice.jobId, subjectKind: 'invoice', subjectId: approved.id, kind: 'invoice.autoApproved', summary: `${approved.number} approved under ${rule.by.name}'s fixed billing rule ${rule.n}`, data: { key: invoice.recurring.key, ruleRevision: rule.n } })
  } catch (error) {
    if (!(error instanceof Problem)) throw error
    if (invoice.autoApprovalRefused?.code === error.code) return
    bump(c.s, 'invoices', invoice, { autoApprovalRefused: { code: error.code, message: error.message, at: c.now } })
    event(c, { jobId: invoice.jobId, subjectKind: 'invoice', subjectId: invoice.id, kind: 'invoice.autoApprovalRefused', summary: `${invoice.number} remains proposed: ${error.message}`, data: { code: error.code, ruleRevision: rule.n } })
  }
}

/** Called inside the existing command/cron atomic context. No payment/send path. */
export async function generateRecurringBilling(c: Context) {
  let prepared = 0, reminders = 0
  for (const job of c.s.jobs.filter(j => j.series?.billing && !j.erasedAt)) {
    for (const due of occurrences(c.s, job, c.now)) {
      if (fulfilled(c.s, due)) {
        const invoice = c.s.invoices.find(i => i.recurring?.key === due.key)
        if (invoice) await autoApprove(c, invoice, due.rule)
        continue
      }
      // A failed price/PO must not leave half an invoice or consume a number.
      const item: Context = { ...c, s: structuredClone(c.s), events: [...c.events], files: [...c.files], sql: [...c.sql] }
      try {
        const currentJob = find(item.s, 'jobs', job.id), rule = due.rule
        if (due.mode === 'as-needed') {
          put(item.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: ['owner', 'office'], jobId: job.id, recurringBillingKey: due.key, billingDate: due.dueDate, message: `${job.number}: review billing due ${due.dueDate}; as-needed rule, no invoice prepared` })
          event(item, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.billingReminder', summary: `${job.number}: office billing reminder for ${due.dueDate}; no invoice prepared`, data: { key: due.key, ruleRevision: rule.n } })
          reminders++
        } else {
          const scoped = due.visitId ? { ...item, s: { ...item.s, expenses: item.s.expenses.filter(e => e.visitId === due.visitId) } } : item
          const extras = due.mode === 'per-visit' || due.mode === 'on-close' ? expenseLines(scoped, currentJob) : []
          const billedCaptures: string[] = item.s.invoices.flatMap(i => i.recurring?.captureIds ?? [])
          const captureIds = due.mode.startsWith('fixed-') ? [] : item.s.captures.filter(x => x.jobId === job.id && (!due.visitId || x.visitId === due.visitId) && ['line', 'material'].includes(x.kind) && !billedCaptures.includes(x.id)).map(x => x.id)
          const priced: Line[] = due.mode.startsWith('fixed-') ? rule.lines : lines([...suggested(item, currentJob, due.visitId, rule.lines, billedCaptures), ...extras.map(e => e.line)])
          const metadata = { key: due.key, mode: due.mode, dueDate: due.dueDate, ruleRevision: rule.n, ruleBy: rule.by, captureIds, ...(due.visitId ? { visitId: due.visitId } : {}), ...(due.periodEnd ? { periodStart: due.periodStart, periodEnd: due.periodEnd, proposedIssuedOn: due.periodEnd } : {}) }
          const invoice = prepareRecurringInvoice(item, currentJob, priced, metadata, rule.discount)
          for (const extra of extras) bump(item.s, 'expenses', find(item.s, 'expenses', extra.expense.id), { invoiceId: invoice.id })
          await autoApprove(item, invoice, rule)
          prepared++
        }
        Object.assign(c, item)
      } catch (error) {
        if (!(error instanceof Problem)) throw error
        const currentJob = find(c.s, 'jobs', job.id), missed: Row[] = currentJob.series.billing.missed ?? []
        if (!missed.some(m => m.key === due.key && m.reason === error.message)) {
          bump(c.s, 'jobs', currentJob, { series: { ...currentJob.series, billing: { ...currentJob.series.billing, missed: [...missed.filter(m => m.key !== due.key), { key: due.key, dueDate: due.dueDate, reason: error.message, code: error.code, at: c.now }] } } })
          event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'series.billingMissed', summary: `${job.number}: billing due ${due.dueDate} needs office review: ${error.message}`, data: { key: due.key, code: error.code } })
        }
      }
    }
  }
  return { prepared, reminders, missed: recurringBillingDue(c.s, c.now) }
}

export const recurringBilling: Handler = async (c, type, p) => {
  if (type === 'series.billing') {
    allow(c.actor, type)
    const job = find(c.s, 'jobs', p.jobId); expectVersion(job, p.version)
    const reason = text(p.reason, 'reason', { max: 500 })
    return configureBilling(c, job, p.billing, calendarDate(p.from), reason)
  }
  if (type === 'series.billingRun') {
    allow(c.actor, type)
    const result = await generateRecurringBilling(c)
    event(c, { jobId: null, subjectKind: 'business', subjectId: c.s.business[0].id, kind: 'series.billingRun', summary: `${c.actor.name} checked recurring billing: ${result.prepared} drafts, ${result.reminders} office reminders`, data: { prepared: result.prepared, reminders: result.reminders, missed: result.missed.length } })
    return result
  }
}
