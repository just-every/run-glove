import { documentDate } from './document-format'
import { business, bump, event, expectVersion, fail, find, oneOf, text, type Context, type Row, type State } from './model'
import { image } from './commands/field'
import type { Handler } from './commands/types'

export const documentKinds = ['quote', 'invoice', 'report', 'agreement'] as const
export function documentIdentity(s: State) {
  const b = business(s)
  return { name: b.name, legalName: b.legalName ?? '', dba: b.dba ?? '', ein: b.abn ?? '', address: b.address ?? '', phone: b.phone ?? '', email: b.email ?? '', licenses: structuredClone(b.licenses ?? []), insurance: structuredClone(b.insurance ?? null), logo: structuredClone(b.logo ?? null) }
}
export const documentTemplate = (s: State, kind: string) => structuredClone(business(s).documentTemplates?.[kind] ?? { heading: { quote: 'Quote', invoice: 'Invoice', report: 'Service report', agreement: 'Service agreement' }[kind as 'quote'], terms: '', footer: '' })

/** Plain-text template fields never execute HTML, scripts or remote image URLs. */
export const documents: Handler = async (c, type, p) => {
  if (!['document.template', 'document.photo'].includes(type)) return undefined
  if (c.actor.role !== 'owner' || c.actor.token) fail('FORBIDDEN', 'Only the signed-in owner edits document templates and attachments.', null, 403)
  const kind = oneOf(p.kind, documentKinds, 'kind')
  if (type === 'document.template') {
    const b = business(c.s); expectVersion(b, p.version)
    const template = { heading: text(p.heading, 'heading', { max: 120 }), terms: text(p.terms, 'terms', { optional: true, max: 8000 }), footer: text(p.footer, 'footer', { optional: true, max: 2000 }) }
    const row = bump(c.s, 'business', b, { documentTemplates: { ...b.documentTemplates, [kind]: template } })
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: 'document.template', summary: `${c.actor.name} edited the ${kind} document template`, data: { kind } })
    return row
  }
  if (kind === 'report') fail('IMMUTABLE', 'Service report photos are frozen with the completed visit.')
  const collection = { quote: 'quotes', invoice: 'invoices', agreement: 'agreements' }[kind as 'quote' | 'invoice' | 'agreement'] as 'quotes' | 'invoices' | 'agreements'
  const row = find(c.s, collection, p.id); expectVersion(row, p.version)
  if ((row.documentPhotos ?? []).length >= 12) fail('LIMIT', 'A document has at most 12 attached photos.')
  const file = await image(c, p.photo, row.id, 'photo'), caption = text(p.caption, 'caption', { optional: true, max: 300 })
  const next = bump(c.s, collection, row, { documentPhotos: [...(row.documentPhotos ?? []), { file, caption }] })
  event(c, { jobId: row.jobId ?? null, subjectKind: kind, subjectId: row.id, kind: 'document.photo', summary: `${c.actor.name} attached a customer-facing ${kind} document photo`, data: { fileId: file.fileId } })
  return next
}

export function deskDocument(s: State, kind: string, id: string) {
  if (kind === 'invoice') {
    const r = find(s, 'invoices', id), v = r.revisions.at(-1), customer = find(s, 'customers', r.customerId), job = find(s, 'jobs', r.jobId)
    return { kind, business: documentIdentity(s), template: documentTemplate(s, kind), number: r.number, revision: v.n, title: job.title, date: r.dates?.issuedOn ?? v.preparedAt.slice(0,10), due: r.dates?.dueOn ?? '', customer: { name: customer.name, billingAddress: customer.billingAddress ?? '' }, site: { address: s.sites.find(x => x.id === job.siteId)?.address ?? '' }, status: r.status, lines: v.lines.map((l: Row) => ({ description: l.description, customerDescription: l.customerDescription ?? s.services.find(item => item.id === l.serviceId)?.description ?? '', images: l.images ?? [], quantity: l.quantity, unitPrice: l.unitPrice, total: l.total })), totals: { subtotal: v.totals.subtotal, tax: v.totals.gst, total: v.totals.total }, photos: r.documentPhotos ?? [] }
  }
  if (kind === 'agreement') {
    const r = find(s, 'agreements', id), customer = find(s, 'customers', r.customerId), site = find(s, 'sites', r.siteId)
    return { kind, business: documentIdentity(s), template: documentTemplate(s, kind), number: '', title: r.plan.name, date: r.startDate, customer: { name: customer.name }, site: { address: site.address }, status: r.endedAt ? 'ended' : 'sold', lines: [{ description: r.plan.name, customerDescription: `${documentDate(r.startDate)} to ${r.endDate ? documentDate(r.endDate) : 'ongoing'}; ${r.plan.includedVisits} included visits of ${r.plan.visitServiceName}; ${r.plan.sourceBenefitsUnavailable ? 'Source member benefits need review; billing template total only, not a new sale or charge permission.' : `${r.plan.repairDiscountPercent}% member repair discount; priority booking ${r.plan.priorityBooking ? 'included' : 'not included'}.`}`, images: [], quantity: '1', unitPrice: r.plan.price, total: r.plan.price }], totals: { subtotal: r.plan.price, tax: null, total: r.plan.price }, photos: r.documentPhotos ?? [] }
  }
  return fail('NOT_FOUND', 'No such document.', null, 404)
}
