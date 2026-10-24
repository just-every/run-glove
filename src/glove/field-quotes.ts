import { fail, find, expectVersion, bump, event, type Actor, type Row, type State } from './model'
import { cents } from './money'
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
  const row = bump(c.s, 'quotes', draft, { fieldQuote: { technicianId: tech.id, visitId: visit.id, jobId: job.id, outsideRange, policy: { minPercent: tech.fieldPricing.minPercent, maxPercent: tech.fieldPricing.maxPercent }, recordedAt: c.now } })
  event(c, { jobId: job.id, subjectKind: 'quote', subjectId: row.id, kind: 'fieldQuote.drafted', summary: `${row.number} field draft by ${tech.name}; desk approval required${outsideRange ? ' (price outside owner range)' : ''}`, data: { technicianId: tech.id, visitId: visit.id, outsideRange } })
  // A replay after withdrawal reveals no customer document or prices.
  return { id: row.id, version: row.version, number: row.number, status: row.status, outsideRange, deskApprovalRequired: true }
}
