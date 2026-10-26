import { fail, find, expectVersion, bump, event, newId, type Actor, type Row, type State } from './model'
import { cents, type Line } from './money'
import { priceTax } from './sales-tax'
import { canonicalJson } from '../modules/import-kit/src/d1/index'
import { formsFor } from './forms'
import { reconcileProgress } from './progress-invoices'
import { quotes } from './commands/quotes'
import { visibleCosts } from './view'
import type { Handler } from './commands/types'

/** Price access is an explicit, current-person grant, separate from the offline day. */
export function fieldQuoteVisit(s: State, actor: Actor, visitId: unknown) {
  if (actor.role !== 'technician' || actor.token) fail('FORBIDDEN', 'Only a signed-in technician uses field pricing.', null, 403)
  const tech = s.technicians.find(t => t.operatorId === actor.id && t.active !== false) ?? fail('FORBIDDEN', 'No active technician is linked to this sign-in.', null, 403)
  if (!tech.fieldPricing?.enabled || tech.fieldPricing.operatorId !== actor.id) fail('FORBIDDEN', 'The owner has not enabled field pricing for you.', null, 403)
  const visit = find(s, 'visits', visitId)
  const job = find(s, 'jobs', visit.jobId)
  if (job.erasedAt || find(s, 'customers', job.customerId).erasedAt || find(s, 'sites', job.siteId).erasedAt || visit.technicianId !== tech.id || visit.status === 'cancelled' || !['open', 'assessed'].includes(job.status)) fail('FORBIDDEN', 'Field pricing requires your current assignment on an open job or completed assessment.', null, 403)
  return { tech, visit, job }
}

/** This online door exposes selling prices and the person's own drafts, never margins. */
export function fieldQuoteView(s: State, actor: Actor, visitId: unknown) {
  const { tech, visit } = fieldQuoteVisit(s, actor, visitId)
  return {
    visitId: visit.id, policy: tech.fieldPricing,
    services: s.services.filter(x => !x.archived).map(({ id, code, name, description, unit, unitPrice, tax }) => ({ id, code, name, description, unit, unitPrice, tax })),
    quotes: s.quotes.filter(q => !q.erasedAt && q.fieldQuote?.technicianId === tech.id && q.fieldQuote?.visitId === visit.id).map(q => visibleCosts(q, actor)),
  }
}

export const fieldQuotes: Handler = async (c, type, p, db) => {
  if (type === 'fieldQuote.apply') {
    if (c.actor.role !== 'owner' || c.actor.custom || c.actor.branch || c.actor.token) fail('FORBIDDEN', 'Only the signed-in unscoped owner applies a field change order.', null, 403)
    const quote = find(c.s, 'quotes', p.quoteId)
    expectVersion(quote, p.version)
    if (quote.fieldQuote?.kind !== 'changeOrder') fail('FIELD_QUOTE', 'Choose an explicitly drafted field change order.', null, 409)
    const job = find(c.s, 'jobs', quote.fieldQuote.jobId)
    expectVersion(job, p.jobVersion)
    if (job.kind === 'assessment' || job.status !== 'open' || job.erasedAt) fail('JOB_STATE', 'Apply a change order to its open source job.', null, 409)
    if (quote.jobId || (job.changeOrders ?? []).some((x: Row) => x.quoteId === quote.id)) fail('DUPLICATE', 'This field quote has already been applied.', null, 409)
    if (quote.customerId !== job.customerId || quote.siteId !== job.siteId) fail('FIELD_QUOTE', 'The field quote must retain its source customer and site.', null, 409)
    const rev = quote.revisions.at(-1), accepted = quote.acceptance
    if (quote.status !== 'accepted' || !rev?.approval || accepted?.revision !== rev.n) fail('NOT_ACCEPTED', 'The current desk-approved revision must be accepted first.', null, 409)
    if (!accepted.signing?.signedCopy || !accepted.signing?.consent) fail('CONSENT_GATE', 'A field change order requires the frozen QUOTE-002 signature and consent evidence.', null, 409)
    if (job.series || job.discount || accepted.discount || rev.deposit) fail('FIELD_QUOTE_REVIEW', 'Recurring billing, discounts and deposits need separate desk reconciliation before application.', null, 409)
    const added: Line[] = accepted.lines
    if (!Array.isArray(added) || !added.length) fail('INPUT', 'The accepted change order has no lines.', null, 400)
    const combined = [...job.lines, ...added]
    if (combined.length > 100) fail('INPUT', 'The amended job must hold 1 to 100 lines.', null, 400)
    const totals = priceTax(c.s, job, combined, c.now, job.totals?.taxContext)
    const extraTotals = priceTax(c.s, job, added, c.now, job.totals?.taxContext)
    if (canonicalJson(extraTotals) !== canonicalJson(accepted.totals)) fail('TAX_REVIEW', 'The accepted change and source job tax must agree before application.', null, 409)
    if (cents(totals.total, 'amended total') !== cents(job.totals.total, 'original total') + cents(accepted.totals.total, 'accepted change')) fail('TAX_REVIEW', 'Combined tax rounding needs desk reconciliation before application.', null, 409)
    const progressReconciliation = reconcileProgress(c, job, quote, totals.total, p.progressReview)
    const serviceIds = added.map(l => l.serviceId).filter(Boolean) as string[]
    const existingForms = new Set((job.forms ?? []).map((f: Row) => `${f.formId}:${f.equipmentId}`))
    const forms = formsFor(c.s, serviceIds, job.equipmentIds ?? []).filter(f => !existingForms.has(`${f.formId}:${f.equipmentId}`))
    const checklist = serviceIds.flatMap(id => c.s.services.find(s => s.id === id)?.checklist ?? []).map(item => ({ id: newId(), ...item }))
    const change = { quoteId: quote.id, revision: rev.n, signatureHash: accepted.signing.signedCopy.sha256, by: c.actor.id, at: c.now }
    const amended = bump(c.s, 'jobs', job, { lines: combined, totals, checklist: [...job.checklist, ...checklist], forms: [...(job.forms ?? []), ...forms], changeOrders: [...(job.changeOrders ?? []), change], ...(progressReconciliation ? { progressReconciliations: [...(job.progressReconciliations ?? []), progressReconciliation] } : {}) })
    bump(c.s, 'quotes', quote, { jobId: job.id })
    event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'fieldQuote.applied', summary: `${quote.number} signed change order applied to ${job.number}; invoice approval remains separate`, data: change })
    if (progressReconciliation) event(c, { jobId: job.id, subjectKind: 'job', subjectId: job.id, kind: 'progress.reconciled', summary: `${job.number} contract cap reviewed by ${c.actor.name}: $${progressReconciliation.priorCap} to $${progressReconciliation.newCap}; earlier invoices retained`, data: progressReconciliation })
    return { id: amended.id, version: amended.version, quoteId: quote.id, ...(progressReconciliation ? { progressReconciliation } : {}) }
  }
  if (type === 'fieldQuote.configure') {
    if (c.actor.role !== 'owner' || c.actor.branch || c.actor.token) fail('FORBIDDEN', 'Only the signed-in unscoped owner enables field pricing.', null, 403)
    const tech = find(c.s, 'technicians', p.technicianId)
    expectVersion(tech, p.version)
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'enabled is true or false.', null, 400)
    const percent = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1000 ? Number(value) : fail('INPUT', 'Price bounds are whole percentages from 0 to 1000.', null, 400)
    const minPercent = percent(p.minPercent), maxPercent = percent(p.maxPercent)
    if (minPercent > maxPercent) fail('INPUT', 'The lower price bound cannot exceed the upper bound.', null, 400)
    if (p.enabled && !tech.operatorId) fail('INPUT', 'Link the technician to a sign-in before enabling field pricing.', null, 400)
    const fieldPricing = { operatorId: tech.operatorId, enabled: p.enabled, minPercent, maxPercent, by: c.actor.id, at: c.now }
    const row = bump(c.s, 'technicians', tech, { fieldPricing })
    event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'fieldQuote.configured', summary: `${tech.name}: field pricing ${p.enabled ? 'enabled' : 'disabled'} by the owner`, data: fieldPricing })
    return { id: row.id, version: row.version, fieldPricing }
  }
  if (type !== 'fieldQuote.draft') return
  const { tech, visit, job } = fieldQuoteVisit(c.s, c.actor, p.visitId)
  if (p.changeOrder !== undefined && typeof p.changeOrder !== 'boolean') fail('INPUT', 'changeOrder is true or false.', null, 400)
  if (p.changeOrder && job.kind === 'assessment') fail('INPUT', 'An assessment produces a new quote, not a change order.', null, 400)
  let outsideRange = false
  const line = (value: any) => {
    const item = find(c.s, 'services', value?.serviceId)
    if (item.archived) fail('INPUT', 'Archived items cannot be added to a field quote.', null, 400)
    const price = value.unitPrice === undefined ? item.unitPrice : value.unitPrice
    const amount = BigInt(cents(price, 'unitPrice')), base = BigInt(cents(item.unitPrice, 'price-book price'))
    if (amount * 100n < base * BigInt(tech.fieldPricing.minPercent) || amount * 100n > base * BigInt(tech.fieldPricing.maxPercent)) outsideRange = true
    // Descriptions, tax and costs always come from the current price book.
    return { serviceId: item.id, description: item.name, quantity: value.quantity, unitPrice: price, tax: item.tax }
  }
  const options = Array.isArray(p.options) && p.options.length > 0 && p.options.length <= 5 ? p.options : fail('INPUT', 'A field quote holds 1 to 5 options.', null, 400)
  const normalized = options.map((option: any) => {
    if (!Array.isArray(option?.lines) || !option.lines.length || option.lines.length > 100) fail('INPUT', 'Each option holds 1 to 100 price-book lines.', null, 400)
    if (option.discount != null) fail('INPUT', 'Field drafts do not grant discount authority.', null, 400)
    return { name: option.name, lines: option.lines.map(line) }
  })
  // Keep the existing assessment carry-over, tax, discount, validity and desk approval path.
  const draft = await quotes(c, 'quote.draft', { customerId: job.customerId, siteId: job.siteId, ...(job.kind === 'assessment' ? { enquiryId: job.enquiryId } : {}), title: p.title, notes: p.notes, options: normalized }, db) as Row
  const row = bump(c.s, 'quotes', draft, { fieldQuote: { kind: p.changeOrder ? 'changeOrder' : 'quote', technicianId: tech.id, visitId: visit.id, jobId: job.id, outsideRange, policy: { minPercent: tech.fieldPricing.minPercent, maxPercent: tech.fieldPricing.maxPercent }, recordedAt: c.now } })
  event(c, { jobId: job.id, subjectKind: 'quote', subjectId: row.id, kind: 'fieldQuote.drafted', summary: `${row.number} field draft by ${tech.name}; desk approval required${outsideRange ? ' (price outside owner range)' : ''}`, data: { technicianId: tech.id, visitId: visit.id, outsideRange } })
  // A replay after withdrawal reveals no customer document or prices.
  return { id: row.id, version: row.version, number: row.number, status: row.status, outsideRange, deskApprovalRequired: true }
}
