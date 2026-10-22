import { allow } from '../access'
import { addCalendarDays, invoiceDates } from '../receivables'
import { branchIdOf, branchZone } from '../branches'
import { Problem, fail, text, find, expectVersion, put, bump, event, newId, nextNumber, business, type Context, type Row } from '../model'
import { lines, cents, dollars, signedCents, documentDiscount, type DocumentDiscount, type Line } from '../money'
import { checkDiscount, givenCents } from '../discounts'
import { priceTax } from '../sales-tax'
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
  if (!job.lines.length && !materials.length && !c.s.captures.some(x => x.jobId === job.id && x.kind === 'line')) fail('NO_LINES', 'This service call has no lines yet. Prepare the invoice with explicit lines.')
  if (unpriced.length) fail('UNPRICED_MATERIALS', 'Some recorded materials are not in the price book. Prepare the invoice with explicit lines that price them.', { materials: unpriced.map(m => ({ captureId: m.id, description: m.description, quantity: m.quantity })) })
  // BOOK-005: work a technician added on a service call, at its price-book price.
  const added = c.s.captures.filter(x => x.jobId === job.id && x.kind === 'line')
  return lines([...job.lines, ...added.map(a => {
    const service = find(c.s, 'services', a.serviceId)
    return { description: `${a.description} (added on site, approved by ${a.approval.customerName})`, quantity: a.quantity, unitPrice: service.unitPrice, tax: service.tax, serviceId: service.id }
  }), ...materials.map(m => {
    const service = find(c.s, 'services', m.serviceId)
    return { description: `${m.description} (used on site)`, quantity: m.quantity, unitPrice: service.unitPrice, tax: service.tax, serviceId: service.id }
  })])
}

/** QUOTE-007: a revision keeps its document discount; giving more than the job's accepted discount needs the owner's limit. */
function revision(c: Context, job: Row, priced: Line[], n: number, extra: Record<string, unknown> = {}, discount: DocumentDiscount | null = job.discount ?? null) {
  const totals = priceTax(c.s, job, priced, c.now, job.totals?.taxContext, discount)
  checkDiscount(c, priced, totals, job.totals ? givenCents(job.lines, job.totals) : 0)
  const presented = priced.map(l => { const old = job.lines.find((x: Row) => x.serviceId === l.serviceId && x.description === l.description), item = c.s.services.find(i => i.id === l.serviceId); return { ...l, customerDescription: (l as Line & { customerDescription?: string; images?: Row[] }).customerDescription ?? old?.customerDescription ?? item?.description ?? '', images: structuredClone((l as Line & { customerDescription?: string; images?: Row[] }).images ?? old?.images ?? item?.images ?? []) } })
  return { n, lines: presented, discount, totals, preparedBy: who(c), preparedAt: c.now, approval: null, export: null, ...extra }
}

/** Explicit invoice edits default to the referenced item's tax treatment. */
const invoiceLines = (c: Context, value: unknown) => lines(Array.isArray(value) ? value.map(l => ({ ...l, tax: l?.tax ?? c.s.services.find(x => x.id === l?.serviceId)?.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE') })) : value)

const csvCell = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
const auDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

/** Xero's documented sales-invoice import columns (AU), one row per line. */
export const exportColumns = ['*ContactName', 'EmailAddress', 'POAddressLine1', '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType', 'Currency']
// US exports carry recorded tax amounts, rather than asking an AU import to
// recalculate them. Document tax columns are written on the first line only.
export const salesTaxExportColumns = [...exportColumns, 'Branch', 'TaxJurisdiction', 'TaxRate', 'DocumentTaxableSubtotal', 'DocumentTaxAmount', 'DocumentTotal']

/** Shared single-job preparation, including its pricing and approval boundary. */
function prepare(c: Context, p: any) {
  const job = find(c.s, 'jobs', p.jobId)
  if (c.actor.branch && branchIdOf(c.s, job) !== c.actor.branch.id) fail('NOT_FOUND', 'No such job in your branch.', null, 404)
  if (job.status !== 'completed') fail('JOB_STATE', `Invoices are prepared for completed jobs; ${job.number} is ${job.status}.`)
  if (c.s.invoices.some(i => i.jobId === job.id)) fail('DUPLICATE', `${job.number} already has an invoice; revise or correct it.`)
  const billed = p.lines === undefined ? expenseLines(c, job) : []
  const priced = p.lines === undefined ? lines([...suggested(c, job), ...billed.map(b => b.line)]) : invoiceLines(c, p.lines)
  const row = put(c.s, 'invoices', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'invoice', branchIdOf(c.s, job)), branchId: branchIdOf(c.s, job), jobId: job.id, customerId: job.customerId, status: 'draft', revisions: [revision(c, job, priced, 1, {}, p.discount === undefined ? job.discount ?? null : documentDiscount(p.discount))] })
  for (const b of billed) bump(c.s, 'expenses', b.expense, { invoiceId: row.id })
  event(c, { jobId: job.id, subjectKind: 'invoice', subjectId: row.id, kind: 'invoice.prepared', summary: `${row.number} prepared by ${c.actor.name} (${c.actor.role}): $${current(row).totals.total} incl. tax`, data: { revision: 1 } })
  return row
}

export const invoices: Handler = async (c, type, p) => {
  if (['invoice.revise', 'invoice.correct', 'invoice.approve'].includes(type) && c.s.invoices.find(i => i.id === p.invoiceId)?.openingBalance) fail('IMPORTED_INVOICE', 'An imported opening balance is source history, not a new Glove invoice to approve or export.')
  switch (type) {
    case 'invoice.prepareBatch': {
      allow(c.actor, 'invoice.prepare')
      if (!Array.isArray(p.jobIds) || p.jobIds.length < 1 || p.jobIds.length > 50 || p.jobIds.some((id: unknown) => typeof id !== 'string' || !id.trim() || id.length > 100) || new Set(p.jobIds).size !== p.jobIds.length) fail('INPUT', 'Choose 1 to 50 distinct jobIds.', { field: 'jobIds' }, 400)
      const results = p.jobIds.map((jobId: string) => {
        // A refused item must not consume numbers or retain any partial writes.
        const item = { ...c, s: structuredClone(c.s), events: [...c.events], files: [...c.files], sql: [...c.sql] }
        try {
          const invoice = prepare(item, { jobId })
          Object.assign(c, item)
          return { jobId, ok: true, invoice }
        } catch (error) {
          if (!(error instanceof Problem)) throw error
          return { jobId, ok: false, error: { code: error.code, message: error.message, details: error.details } }
        }
      })
      // Even an entirely refused batch records the office's action and can replay.
      event(c, { jobId: null, subjectKind: 'business', subjectId: business(c.s).id, kind: 'invoice.batchPrepared', summary: `${c.actor.name} prepared ${results.filter((r: { ok: boolean }) => r.ok).length} of ${results.length} selected invoices`, data: { prepared: results.filter((r: { ok: boolean }) => r.ok).length, refused: results.filter((r: { ok: boolean }) => !r.ok).length } })
      return { results }
    }
    case 'invoice.prepare': {
      return prepare(c, p)
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
      const next = revision(c, find(c.s, 'jobs', inv.jobId), invoiceLines(c, p.lines), n, { reason, corrects: exported ? { revision: exported.n, exportNumber: exported.export.number, total: exported.totals.total } : null }, p.discount === undefined ? last.discount ?? null : documentDiscount(p.discount))
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
      // A customer that requires a purchase-order number gets none of its invoices approved without one.
      const poNumber = text(p.poNumber, 'poNumber', { optional: true, max: 60 }) || inv.poNumber || ''
      if (!poNumber && find(c.s, 'customers', inv.customerId).requirePo) fail('PO_REQUIRED', 'This customer requires a purchase-order number on its invoices. Enter it to approve.', null, 400)
      const issuedOn = localParts(c.now, branchZone(c.s, find(c.s, 'jobs', inv.jobId))).date
      const dates = invoiceDates(c.s, inv) ?? { issuedOn, dueOn: addCalendarDays(issuedOn, business(c.s).paymentTermsDays), termsDays: business(c.s).paymentTermsDays, basis: 'terms frozen at first approval' }
      const row = bump(c.s, 'invoices', inv, { status: 'approved', dates, ...(poNumber ? { poNumber } : {}), revisions: [...inv.revisions.slice(0, -1), { ...rev, approval: { ...who(c), at: c.now } }] })
      approval(c, 'invoice', row, `${inv.number} revision ${rev.n} · $${rev.totals.total} incl. tax`, rev.n, rev.preparedBy, 'approved')
      event(c, { jobId: inv.jobId, subjectKind: 'invoice', subjectId: inv.id, kind: 'invoice.approved', summary: `${inv.number} revision ${rev.n} approved by ${c.actor.name}${rev.preparedBy.role === 'agent' ? ` (prepared by agent ${rev.preparedBy.name})` : ''}`, data: null })
      return row
    }
    case 'invoice.export': {
      const b = business(c.s), ready = c.s.invoices.filter(i => i.status === 'approved')
      if (!ready.length) fail('NOTHING_TO_EXPORT', 'No approved invoice revision is waiting for export.')
      const number = nextNumber(c, 'export')
      const us = ready.some(inv => (current(inv).totals.currency ?? b.currency) === 'USD')
      const rows: string[][] = []
      const included = ready.map(inv => {
        const rev = current(inv), customer = find(c.s, 'customers', inv.customerId), job = find(c.s, 'jobs', inv.jobId)
        const currency = rev.totals.currency ?? b.currency ?? 'AUD', dates = invoiceDates(c.s, inv)!, date = dates.issuedOn
        const displayDate = currency === 'AUD' ? auDate : (d: string) => `${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}`
        const context = rev.totals.taxContext, breakdown = rev.totals.taxBreakdown ?? []
        const branchId = branchIdOf(c.s, job), branch = c.s.branches.find(x => x.id === branchId)?.name ?? 'Main business'
        const invoiceNumber = rev.corrects ? `${inv.number}-R${rev.n}` : inv.number
        const reference = (inv.poNumber ? `PO ${inv.poNumber} · ` : '') + (rev.corrects ? `${job.number} corrects ${inv.number} rev ${rev.corrects.revision} (${rev.corrects.exportNumber}): ${rev.reason}` : job.number)
        for (const [index, line] of (rev.lines as Line[]).entries()) {
          const taxable = line.tax !== 'FREE' && !context?.exempt && (context?.taxLabor !== false || !line.serviceId || !context.laborServiceIds.includes(line.serviceId))
          const taxType = currency === 'AUD' ? taxable ? 'GST on Income' : 'GST Free Income' : taxable ? context?.jurisdiction || 'No sales tax configured' : 'Tax exempt'
          const row = [customer.name, customer.apEmail || customer.email || '', customer.billingAddress ?? '', invoiceNumber, reference, displayDate(date), displayDate(dates.dueOn), line.description, line.quantity, line.unitPrice, '200', taxType, currency]
          if (us) row.push(branch, index === 0 ? breakdown.map((x: Row) => x.jurisdiction).join('; ') : '', index === 0 ? breakdown.map((x: Row) => x.rate).join('; ') : '', index === 0 ? breakdown.map((x: Row) => x.taxable).join('; ') : '', index === 0 ? rev.totals.gst : '', index === 0 ? rev.totals.total : '')
          rows.push(row)
        }
        // QUOTE-007: the document discount follows its lines, split into its non-taxable and taxable amounts.
        const d = rev.totals.discount
        if (d) for (const [part, taxable] of [[d.nonTaxable, false], [d.taxable, true]] as const) {
          if (cents(part, 'discount') === 0) continue
          const taxType = currency === 'AUD' ? taxable ? 'GST on Income' : 'GST Free Income' : taxable ? context?.jurisdiction || 'No sales tax configured' : 'Tax exempt'
          const row = [customer.name, customer.apEmail || customer.email || '', customer.billingAddress ?? '', invoiceNumber, reference, displayDate(date), displayDate(dates.dueOn), `Discount: ${d.reason} (${d.kind === 'percent' ? `${d.value}%` : `$${d.value}`}) on ${taxable ? 'taxable' : 'non-taxable'} lines`, '1', `-${part}`, '200', taxType, currency]
          if (us) row.push(branch, '', '', '', '', '')
          rows.push(row)
        }
        return { invoiceId: inv.id, revision: rev.n, invoiceNumber, total: rev.totals.total, currency, branchId, taxBreakdown: breakdown }
      })
      const csv = [us ? salesTaxExportColumns : exportColumns, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
      const total = dollars(included.reduce((sum, i) => sum + cents(i.total, 'total'), 0))
      const exported = put(c.s, 'exports', { id: newId(), version: 1, createdAt: c.now, number, format: us ? 'glove-sales-invoice-csv' : 'xero-sales-invoice-csv', invoices: included, total, csv, by: who(c) })
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
