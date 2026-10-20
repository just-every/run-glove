import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, type Context, type Row } from '../model'
import { cents, dollars, taxCodes } from '../money'
import { image, assigned } from './field'
import type { Handler } from './types'

// Job expenses (COST-003): supply-house purchases, permits, equipment rental
// and subcontractor bills, each with its vendor, amount, receipt photo and
// whether it is billable. The office sets a billable expense's markup (0% is
// at cost); invoice preparation adds every billable expense not yet invoiced
// as its own line at cost plus markup.

export const categories = ['supply-house purchase', 'permit', 'equipment rental', 'subcontractor bill', 'other'] as const

/** A markup percentage such as "20" or "12.5", as integer basis points (0–100000). */
function markup(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value !== 'string' || !/^\d{1,4}(\.\d{1,2})?$/.test(value)) return fail('INPUT', 'markupPercent is a percentage such as 20 or 12.5.', { field: 'markupPercent' }, 400)
  const [whole, part = ''] = value.split('.')
  const bp = Number(whole) * 100 + Number(part.padEnd(2, '0'))
  return bp <= 100000 ? bp : fail('INPUT', 'markupPercent is at most 1000.', { field: 'markupPercent' }, 400)
}
const percent = (bp: number) => `${Math.floor(bp / 100)}${bp % 100 ? '.' + String(bp % 100).padStart(2, '0').replace(/0$/, '') : ''}`

/** What a billable expense is invoiced at: its amount plus markup, rounded half up to the cent. */
export const billedCents = (e: Row) => Number((BigInt(cents(e.amount, 'amount')) * BigInt(10000 + e.markupBasisPoints) + 5000n) / 10000n)

/** Invoice lines for the job's billable expenses that no invoice carries yet. */
export function expenseLines(c: Context, job: Row) {
  return c.s.expenses.filter(e => e.jobId === job.id && e.billable && !e.invoiceId).map(e => ({ expense: e, line: { description: `${e.vendor}: ${e.description}${e.markupBasisPoints ? ` (cost $${e.amount} + ${percent(e.markupBasisPoints)}%)` : ''}`, quantity: '1', unitPrice: dollars(billedCents(e)), tax: e.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE'), serviceId: null } }))
}

export const expenses: Handler = async (c, type, p) => {
  switch (type) {
    case 'expense.record': {
      const technician = c.actor.role === 'technician'
      if (technician && p.markupPercent !== undefined) fail('PRICE', 'The office sets the markup on a billable expense.')
      const job = technician ? find(c.s, 'jobs', assigned(c, p.visitId).visit.jobId) : find(c.s, 'jobs', p.jobId)
      const id = newId()
      const row = put(c.s, 'expenses', {
        id, version: 1, createdAt: c.now, jobId: job.id, visitId: technician ? p.visitId : null,
        category: oneOf(p.category, categories, 'category'), vendor: text(p.vendor, 'vendor', { max: 200 }), description: text(p.description, 'description', { optional: true, max: 500 }),
        amount: dollars(cents(p.amount, 'amount')), billable: p.billable === true, markupBasisPoints: markup(p.markupPercent), tax: oneOf(p.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE'), taxCodes, 'tax'),
        receipt: p.receipt ? await image(c, p.receipt, id, 'receipt') : null, invoiceId: null,
        recordedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, ...(technician ? { deviceTime: typeof p.deviceTime === 'string' ? p.deviceTime : null } : {}),
      })
      event(c, { jobId: job.id, subjectKind: 'expense', subjectId: row.id, kind: 'expense.recorded', summary: `${c.actor.name} recorded a ${row.category} from ${row.vendor}${technician ? '' : `: $${row.amount}`} (${row.billable ? 'billable' : 'not billable'})${row.receipt ? ' with its receipt' : ''}`, data: null })
      return row
    }
    case 'expense.price': {
      const row = find(c.s, 'expenses', p.expenseId)
      expectVersion(row, p.version)
      if (row.invoiceId) fail('INVOICED', 'This expense is already on an invoice; correct the invoice instead.')
      const priced = bump(c.s, 'expenses', row, { billable: p.billable === true, markupBasisPoints: markup(p.markupPercent), ...(p.tax !== undefined ? { tax: oneOf(p.tax, taxCodes, 'tax') } : {}), pricedBy: { id: c.actor.id, name: c.actor.name }, pricedAt: c.now })
      event(c, { jobId: row.jobId, subjectKind: 'expense', subjectId: row.id, kind: 'expense.priced', summary: `${row.vendor} expense ${priced.billable ? `billable at $${dollars(billedCents(priced))} (${percent(priced.markupBasisPoints)}% markup)` : 'not billable'}, set by ${c.actor.name}`, data: null })
      return priced
    }
  }
}

/** The job's expense cost and what its billable expenses bill at. */
export function jobCost(s: { expenses: Row[] }, job: Row) {
  const rows = s.expenses.filter(e => e.jobId === job.id)
  const sum = (list: Row[], f: (e: Row) => number) => dollars(list.reduce((n, e) => n + f(e), 0))
  const amount = (e: Row) => cents(e.amount, 'amount')
  return {
    jobId: job.id, number: job.number,
    expenses: rows.map(e => ({ id: e.id, category: e.category, vendor: e.vendor, description: e.description, amount: e.amount, billable: e.billable, markupPercent: percent(e.markupBasisPoints), billed: e.billable ? dollars(billedCents(e)) : '0.00', invoiceId: e.invoiceId, receipt: e.receipt })),
    totals: { expenses: sum(rows, amount), billable: sum(rows.filter(e => e.billable), amount), nonBillable: sum(rows.filter(e => !e.billable), amount), billed: sum(rows.filter(e => e.billable), billedCents) },
  }
}
