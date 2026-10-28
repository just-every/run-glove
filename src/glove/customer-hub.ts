import { allow } from './access'
import { event, fail, type Row } from './model'
import type { Handler } from './commands/types'

/** Preparatory owner inspection only. This is never a customer credential or sign-in. */
export const customerHub: Handler = async (c, type, p) => {
  if (type !== 'customer.hubPreview') return undefined
  allow(c.actor, type)
  if (Object.keys(p).some(k => k !== 'customerId')) fail('INPUT', 'Choose one customer only.', null, 400)
  const customer = c.s.customers.find(r => r.id === p.customerId) ?? fail('NOT_FOUND', 'Customer preview unavailable', null, 404)
  if (customer.mergedInto || customer.erasedAt) fail('NOT_FOUND', 'Customer preview unavailable', null, 404)
  const s = c.s, sites = s.sites.filter(r => r.customerId === customer.id && !r.erasedAt), siteIds = new Set(sites.map(r => r.id))
  const jobs = s.jobs.filter(r => r.customerId === customer.id && siteIds.has(r.siteId) && !r.erasedAt), jobIds = new Set(jobs.map(r => r.id))
  const quoteRows = s.quotes.filter(r => r.customerId === customer.id && siteIds.has(r.siteId) && ['sent', 'accepted', 'declined'].includes(r.status) && r.revisions.at(-1)?.approval)
  const invoiceRows = s.invoices.filter(r => r.customerId === customer.id && jobIds.has(r.jobId) && ['approved', 'exported'].includes(r.status))
  const invoiceIds = new Set(invoiceRows.map(r => r.id))
  const line = (l: Row) => ({ description: l.description, customerDescription: l.customerDescription ?? s.services.find(item => item.id === l.serviceId)?.description ?? '', quantity: l.quantity, unitPrice: l.unitPrice, total: l.total })
  const totals = (r: Row) => ({ subtotal: r.subtotal, tax: r.gst, total: r.total })
  const quotes = quoteRows.map(q => {
    const r = q.revisions.at(-1)
    return { id: q.id, number: q.number, title: q.title, revision: r.n, status: q.status, lines: r.lines.map(line), totals: totals(r.totals) }
  })
  const invoices = invoiceRows.flatMap(i => {
    const r = i.revisions.at(-1)
    return r?.approval ? [{ id: i.id, number: i.number, revision: r.n, status: i.status, dates: i.dates ?? null, lines: r.lines.map(line), totals: totals(r.totals) }] : []
  })
  const visibleInvoiceIds = new Set(invoices.map(i => i.id))
  const result = {
    mode: 'owner-preview', customer: { id: customer.id, name: customer.name },
    actions: { signIn: false, approve: false, pay: false, requestWork: false, renew: false, updateCard: false },
    quotes, invoices,
    visits: s.visits.filter(v => jobIds.has(v.jobId) && v.status !== 'cancelled').map(v => ({ id: v.id, jobId: v.jobId, title: jobs.find(j => j.id === v.jobId)!.title, status: v.status, date: v.local.date, start: v.local.start, end: v.local.end, timezone: v.local.timezone })),
    receipts: s.payments.filter(r => r.customerId === customer.id && invoiceIds.has(r.invoiceId) && visibleInvoiceIds.has(r.invoiceId) && (!r.kind || r.kind === 'payment') && r.status === 'paid').map(r => ({ id: r.id, invoiceId: r.invoiceId, amount: r.amount, currency: r.currency, confirmedAt: r.confirmedAt })),
    reports: s.serviceReports.filter(r => r.customerId === customer.id && jobIds.has(r.jobId) && siteIds.has(r.siteId)).map(r => ({ id: r.id, title: r.snapshot.job.title, completedAt: r.snapshot.visit.completedAt, summary: r.snapshot.summary })),
    equipment: s.equipment.filter(r => siteIds.has(r.siteId)).map(r => ({ id: r.id, siteId: r.siteId, type: r.type, make: r.make, model: r.model, installedOn: r.installedOn })),
    agreements: s.agreements.filter(r => r.customerId === customer.id && siteIds.has(r.siteId)).map(r => ({ id: r.id, name: r.plan.name, startDate: r.startDate, endDate: r.endDate, endedAt: r.endedAt })),
  }
  event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'hub.previewed', summary: 'Owner inspected proposed hub content; no customer access, payment or send enabled', data: { customerId: customer.id, mode: 'owner-preview' } })
  return result
}
