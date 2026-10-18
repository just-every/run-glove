import { fail, text, find, expectVersion, put, bump, event, newId, nextNumber, business, type Context, type Row } from '../model'
import { lines, totals, cents, dollars, type Line } from '../money'
import { localParts } from '../time'
import { approval, selfApproval } from './quotes'
import { expenseLines } from './expenses'
import type { Handler } from './types'

// Invoice preparation for the business's own books: a completed job's
// accepted price plus the materials the technician recorded becomes an
// invoice draft; a person approves the exact revision; an export writes each
// approved revision once into a CSV for the accounting system. A change after
// export is a correction revision that names what it corrects, never an edit
// of the exported one.

const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })
const current = (inv: Row) => inv.revisions[inv.revisions.length - 1]

/** The job's accepted price lines plus field materials priced from the price book (billable expenses join them in invoice.prepare). */
function suggested(c: Context, job: Row): Line[] {
  const materials = c.s.captures.filter(x => x.jobId === job.id && x.kind === 'material')
  const unpriced = materials.filter(m => !m.serviceId)
  if (unpriced.length) fail('UNPRICED_MATERIALS', 'Some recorded materials are not in the price book. Prepare the invoice with explicit lines that price them.', { materials: unpriced.map(m => ({ captureId: m.id, description: m.description, quantity: m.quantity })) })
  return lines([...job.lines, ...materials.map(m => {
    const service = find(c.s, 'services', m.serviceId)
    return { description: `${m.description} (used on site)`, quantity: m.quantity, unitPrice: service.unitPrice, tax: service.tax, serviceId: service.id }
  })])
}

function revision(c: Context, priced: Line[], n: number, extra: Record<string, unknown> = {}) {
  return { n, lines: priced, totals: totals(priced), preparedBy: who(c), preparedAt: c.now, approval: null, export: null, ...extra }
}

const csvCell = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
const auDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
function addDays(date: string, days: number) { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }

/** Xero's documented sales-invoice import columns (AU), one row per line. */
export const exportColumns = ['*ContactName', 'EmailAddress', 'POAddressLine1', '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType', 'Currency']

export const invoices: Handler = async (c, type, p) => {
  switch (type) {
    case 'invoice.prepare': {
      const job = find(c.s, 'jobs', p.jobId)
      if (job.status !== 'completed') fail('JOB_STATE', `Invoices are prepared for completed jobs; ${job.number} is ${job.status}.`)
      if (c.s.invoices.some(i => i.jobId === job.id)) fail('DUPLICATE', `${job.number} already has an invoice; revise or correct it.`)
      const billed = p.lines === undefined ? expenseLines(c, job) : []
      const priced = p.lines === undefined ? lines([...suggested(c, job), ...billed.map(b => b.line)]) : lines(p.lines)
      const row = put(c.s, 'invoices', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'invoice'), jobId: job.id, customerId: job.customerId, status: 'draft', revisions: [revision(c, priced, 1)] })
      for (const b of billed) bump(c.s, 'expenses', b.expense, { invoiceId: row.id })
      event(c, { jobId: job.id, subjectKind: 'invoice', subjectId: row.id, kind: 'invoice.prepared', summary: `${row.number} prepared by ${c.actor.name} (${c.actor.role}): $${current(row).totals.total} incl. tax`, data: { revision: 1 } })
      return row
    }
    case 'invoice.revise':
    case 'invoice.correct': {
      const inv = find(c.s, 'invoices', p.invoiceId)
      expectVersion(inv, p.version)
      const correcting = type === 'invoice.correct', last = current(inv)
      if (correcting !== (inv.status === 'exported')) fail('INVOICE_STATE', correcting ? 'Only an exported invoice is corrected; revise this draft instead.' : 'This invoice was exported; record a correction instead of changing it.')
      const reason = text(p.reason, 'reason', { max: 500 })
      const n = inv.revisions.length + 1
      // A draft that follows an export (a correction, or a revision of one) corrects the last exported revision.
      const exported = [...inv.revisions].reverse().find((r: Row) => r.export)
      const next = revision(c, lines(p.lines), n, { reason, corrects: exported ? { revision: exported.n, exportNumber: exported.export.number, total: exported.totals.total } : null })
      const row = bump(c.s, 'invoices', inv, { status: 'draft', revisions: [...inv.revisions, next] })
      event(c, { jobId: inv.jobId, subjectKind: 'invoice', subjectId: inv.id, kind: correcting ? 'invoice.corrected' : 'invoice.revised', summary: correcting ? `${inv.number} correction revision ${n} ($${next.totals.total}) corrects revision ${last.n} exported in ${last.export.number}: ${reason}` : `${inv.number} revision ${n} ($${next.totals.total}): ${reason}`, data: { revision: n } })
      return row
    }
    case 'invoice.approve': {
      const inv = find(c.s, 'invoices', p.invoiceId)
      expectVersion(inv, p.version)
      const rev = current(inv)
      if (inv.status !== 'draft') fail('INVOICE_STATE', `This invoice is ${inv.status}.`)
      if (p.revision !== rev.n) fail('REVISION', `Approve the current revision (${rev.n}).`, { current: rev.n })
      selfApproval(c, rev.preparedBy)
      const row = bump(c.s, 'invoices', inv, { status: 'approved', revisions: [...inv.revisions.slice(0, -1), { ...rev, approval: { ...who(c), at: c.now } }] })
      approval(c, 'invoice', row, `${inv.number} revision ${rev.n} · $${rev.totals.total} incl. tax`, rev.n, rev.preparedBy, 'approved')
      event(c, { jobId: inv.jobId, subjectKind: 'invoice', subjectId: inv.id, kind: 'invoice.approved', summary: `${inv.number} revision ${rev.n} approved by ${c.actor.name}${rev.preparedBy.role === 'agent' ? ` (prepared by agent ${rev.preparedBy.name})` : ''}`, data: null })
      return row
    }
    case 'invoice.export': {
      const b = business(c.s), ready = c.s.invoices.filter(i => i.status === 'approved')
      if (!ready.length) fail('NOTHING_TO_EXPORT', 'No approved invoice revision is waiting for export.')
      const number = nextNumber(c, 'export'), date = localParts(c.now, b.timezone).date
      const rows: string[][] = []
      const included = ready.map(inv => {
        const rev = current(inv), customer = find(c.s, 'customers', inv.customerId), job = find(c.s, 'jobs', inv.jobId)
        const invoiceNumber = rev.corrects ? `${inv.number}-R${rev.n}` : inv.number
        const reference = rev.corrects ? `${job.number} corrects ${inv.number} rev ${rev.corrects.revision} (${rev.corrects.exportNumber}): ${rev.reason}` : job.number
        for (const line of rev.lines as Line[]) rows.push([customer.name, customer.email ?? '', customer.billingAddress ?? '', invoiceNumber, reference, auDate(date), auDate(addDays(date, b.paymentTermsDays)), line.description, line.quantity, line.unitPrice, '200', line.tax === 'GST' ? 'GST on Income' : 'GST Free Income', 'AUD'])
        return { invoiceId: inv.id, revision: rev.n, invoiceNumber, total: rev.totals.total }
      })
      const csv = [exportColumns, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
      const total = dollars(included.reduce((sum, i) => sum + cents(i.total, 'total'), 0))
      const exported = put(c.s, 'exports', { id: newId(), version: 1, createdAt: c.now, number, format: 'xero-sales-invoice-csv', invoices: included, total, csv, by: who(c) })
      for (const inv of ready) {
        const rev = current(inv)
        bump(c.s, 'invoices', inv, { status: 'exported', revisions: [...inv.revisions.slice(0, -1), { ...rev, export: { exportId: exported.id, number, at: c.now } }] })
        const job = find(c.s, 'jobs', inv.jobId)
        if (job.status === 'completed') bump(c.s, 'jobs', job, { status: 'invoiced' })
        event(c, { jobId: inv.jobId, subjectKind: 'invoice', subjectId: inv.id, kind: 'invoice.exported', summary: `${inv.number} revision ${rev.n} exported in ${number} by ${c.actor.name}`, data: { exportId: exported.id } })
      }
      return { id: exported.id, number, invoices: included, total }
    }
  }
}
