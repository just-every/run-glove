import { branchIdOf } from '../branches'
import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, nextNumber, type Context, type Row, type State } from '../model'
import { lines, totals, thousandths, quantity, cents, dollars, documentDiscount } from '../money'
import { checkDiscount, givenCents } from '../discounts'
import { isMemberDiscount, memberDiscount } from '../agreements'
import { priceTax, taxContext } from '../sales-tax'
import { sources } from '../pipeline'
import type { Handler } from './types'

// Request (with its source, moving new → contacted → quoted → won or lost) → quote revisions → a person approves the exact price → the quote is
// recorded as sent (never claimed as delivered) → the customer's acceptance is
// recorded with how it was given. A changed price is a new revision that needs
// its own approval; an accepted quote is frozen.

const who = (c: Context) => ({ id: c.actor.id, name: c.actor.name, role: c.actor.role })

/** Record a person's decision on agent- or person-prepared work, with the exact version decided. */
export function approval(c: Context, subjectKind: string, subject: Row, label: string, revision: number, preparedBy: unknown, decision: 'approved' | 'declined', note = '') {
  return put(c.s, 'approvals', { id: newId(), version: 1, createdAt: c.now, subjectKind, subjectId: subject.id, subjectLabel: label, revision, preparedBy, approvedBy: who(c), decision, note })
}

/** An agent never decides its own preparation, even after its sign-in is given a person's role. */
export function selfApproval(c: Context, preparedBy: { id: string; role: string }) {
  if (preparedBy.role === 'agent' && preparedBy.id === c.actor.id) fail('SELF_APPROVAL', 'Someone other than the agent that prepared this approves it.')
}

// A price-book line keeps the item's unit cost at the time it was priced (MONEY-003).
const priced = (c: Context, value: unknown, name: string) => lines(Array.isArray(value) ? value.map(l => ({ ...l, tax: l?.tax ?? c.s.services.find(x => x.id === l?.serviceId)?.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE') })) : value, name).map(l => { const item = l.serviceId ? c.s.services.find(x => x.id === l.serviceId) : undefined; return item ? { ...l, unitCost: item.unitCost ?? '0.00' } : l })

/**
 * QUOTE-001: a revision holds 1 to 5 options (each its own lines and total) and
 * up to 10 add-ons. `lines` and `totals` are the first option's, so a
 * one-option quote reads as before; the customer's choice decides the job.
 */
function revision(c: Context, record: Row, p: any, n: number) {
  const context = taxContext(c.s, record, c.now)
  const many = p.options !== undefined
  if (many && (!Array.isArray(p.options) || !p.options.length || p.options.length > 5)) fail('INPUT', 'A quote holds 1 to 5 options.', { field: 'options' }, 400)
  if (p.addOns !== undefined && (!Array.isArray(p.addOns) || p.addOns.length > 10)) fail('INPUT', 'A quote holds at most 10 add-ons.', { field: 'addOns' }, 400)
  // QUOTE-007: each option takes its own document discount; add-ons take discount lines only.
  // PLAN-002: an option without its own discount takes an active agreement's member discount, which no role limit refuses.
  const member = memberDiscount(c.s, record.customerId, c.now)
  const options = (many ? p.options : [{ lines: p.lines, discount: p.discount }]).map((o: any, i: number) => { const l = priced(c, o?.lines, many ? `options[${i}].lines` : 'lines'), discount = o?.discount === undefined ? member : documentDiscount(o?.discount, many ? `options[${i}].discount` : 'discount'), t = priceTax(c.s, record, l, c.now, context, discount); checkDiscount(c, l, t, isMemberDiscount(c.s, record.customerId, c.now, discount) ? givenCents([], t) : 0); return { id: `option-${i + 1}`, name: text(o?.name, `options[${i}].name`, { optional: true, max: 100 }) || (many && p.options.length > 1 ? `Option ${i + 1}` : ''), lines: l, discount, totals: t } })
  const addOns = (p.addOns ?? []).map((a: any, i: number) => { const l = priced(c, a?.lines, `addOns[${i}].lines`), t = priceTax(c.s, record, l, c.now, context); checkDiscount(c, l, t); return { id: `addon-${i + 1}`, name: text(a?.name, `addOns[${i}].name`, { max: 100 }), lines: l, totals: t } })
  return { n, lines: options[0].lines, totals: options[0].totals, options, addOns, notes: text(p.notes, 'notes', { optional: true, max: 4000 }), terms: text(p.terms, 'terms', { optional: true, max: 4000 }), templateId: p.templateId ?? null, preparedBy: who(c), preparedAt: c.now, approval: null as null | Record<string, unknown> }
}

/** A revision's options, for revisions made before options existed too. */
export const optionsOf = (rev: Record<string, any>): Record<string, any>[] => rev.options ?? [{ id: 'option-1', name: '', lines: rev.lines, totals: rev.totals }]
const priceLabel = (rev: Record<string, any>) => optionsOf(rev).length > 1 ? optionsOf(rev).map(o => `${o.name} $${o.totals.total}`).join(', ') : `$${rev.totals.total}`

/** A template line follows the price book unless it fixes its price; a custom line always fixes it. */
function templateLines(c: Context, value: unknown, name: string) {
  if (!Array.isArray(value) || !value.length || value.length > 100) return fail('INPUT', `Add between 1 and 100 ${name}.`, { field: name }, 400)
  return value.map((l: any, i: number) => {
    const at = `${name}[${i}]`, item = l?.serviceId ? find(c.s, 'services', l.serviceId) : null
    if (!item && l?.unitPrice === undefined) fail('INPUT', `${at} is a price-book item or fixes its own price.`, { field: `${at}.unitPrice` }, 400)
    return { serviceId: item?.id ?? null, description: text(l?.description, `${at}.description`, { optional: !!item, max: 500 }), quantity: quantity(thousandths(l?.quantity ?? '1', `${at}.quantity`)), ...(l?.unitPrice !== undefined ? { unitPrice: dollars(cents(l.unitPrice, `${at}.unitPrice`)), tax: l?.tax ?? item?.tax ?? (c.s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE') } : {}) }
  })
}

/** A quote payload from a template, at today's price-book prices where the template does not fix them. */
function fromTemplate(c: Context, t: Row) {
  const line = (l: Row) => { const item = l.serviceId ? find(c.s, 'services', l.serviceId) : null; return { description: l.description || item!.name, quantity: l.quantity, unitPrice: l.unitPrice ?? item!.unitPrice, tax: l.tax ?? item!.tax, serviceId: l.serviceId ?? undefined } }
  return { options: t.options.map((o: Row) => ({ name: o.name, lines: o.lines.map(line) })), addOns: t.addOns.map((a: Row) => ({ name: a.name, lines: a.lines.map(line) })), notes: t.notes, terms: t.terms, templateId: t.id }
}

const current = (q: Row) => q.revisions[q.revisions.length - 1]

/** A request still in the pipeline (not yet won or lost), at the version the person saw. */
function openEnquiry(c: Context, p: any) {
  const row = find(c.s, 'enquiries', p.enquiryId)
  expectVersion(row, p.version)
  if (['won', 'lost'].includes(row.status)) fail('ENQUIRY_STATE', `This request is already ${row.status}.`)
  return row
}

function open(c: Context, p: any) {
  const quote = find(c.s, 'quotes', p.quoteId)
  expectVersion(quote, p.version)
  return quote
}

/** BOOK-006: a quote drafted from a request carries its assessment's notes, photos and form results, linked. */
function assessmentOf(s: State, enquiry: Row | null) {
  const job = enquiry ? s.jobs.find(j => j.kind === 'assessment' && j.enquiryId === enquiry.id && j.status === 'assessed') : null
  if (!job) return null
  const got = s.captures.filter(x => x.jobId === job.id)
  return {
    jobId: job.id, number: job.number,
    notes: got.filter(x => x.kind === 'note').map(x => x.text as string),
    photos: got.filter(x => x.kind === 'photo').map(x => ({ fileId: x.file.fileId as string, caption: (x.caption as string) ?? '' })),
    forms: got.filter(x => x.kind === 'form').map(x => ({ name: x.formName as string, answers: x.answers })),
  }
}

export const quotes: Handler = async (c, type, p) => {
  switch (type) {
    case 'enquiry.create': {
      const customer = find(c.s, 'customers', p.customerId), site = p.siteId ? find(c.s, 'sites', p.siteId) : null
      if (site && site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
      const row = put(c.s, 'enquiries', { id: newId(), version: 1, createdAt: c.now, createdBy: who(c), customerId: customer.id, siteId: site?.id ?? null, description: text(p.description, 'description', { max: 4000 }), source: oneOf(p.source ?? 'phone', sources, 'source'), status: 'new', stageAt: c.now, contacts: [] })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.created', summary: `Request from ${customer.name} (${row.source}): ${row.description.slice(0, 80)}`, data: { source: row.source } })
      return row
    }
    case 'enquiry.contact': {
      const row = openEnquiry(c, p)
      const contact = { note: text(p.note, 'note', { optional: true, max: 1000 }), by: who(c), at: c.now }
      const contacted = bump(c.s, 'enquiries', row, { contacts: [...row.contacts, contact], ...(row.status === 'new' ? { status: 'contacted', stageAt: c.now } : {}) })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.contacted', summary: `${c.actor.name} contacted ${find(c.s, 'customers', row.customerId).name} about their request${contact.note ? `: ${contact.note}` : ''}`, data: null })
      return contacted
    }
    case 'enquiry.close': {
      const row = openEnquiry(c, p)
      const lost = bump(c.s, 'enquiries', row, { status: 'lost', stageAt: c.now, lostReason: text(p.reason, 'reason', { max: 500 }), lostAt: c.now, lostBy: who(c) })
      event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'enquiry.lost', summary: `Request lost: ${lost.lostReason}`, data: { reason: lost.lostReason } })
      return lost
    }
    case 'template.save': {
      const many = (v: unknown, name: string, max: number) => Array.isArray(v) && v.length <= max ? v : fail('INPUT', `${name} lists at most ${max}.`, { field: name }, 400)
      const options = many(p.options, 'options', 5)
      if (!options.length) fail('INPUT', 'A template holds 1 to 5 options.', { field: 'options' }, 400)
      const fields = { name: text(p.name, 'name', { max: 200 }), options: options.map((o: any, i: number) => ({ name: text(o?.name, `options[${i}].name`, { optional: true, max: 100 }), lines: templateLines(c, o?.lines, `options[${i}].lines`) })), addOns: many(p.addOns ?? [], 'addOns', 10).map((a: any, i: number) => ({ name: text(a?.name, `addOns[${i}].name`, { max: 100 }), lines: templateLines(c, a?.lines, `addOns[${i}].lines`) })), notes: text(p.notes, 'notes', { optional: true, max: 4000 }), terms: text(p.terms, 'terms', { optional: true, max: 4000 }) }
      if (c.s.templates.some(t => t.id !== p.id && t.name.toLowerCase() === fields.name.toLowerCase())) fail('DUPLICATE', `A template named ${fields.name} already exists.`)
      let row
      if (p.id === undefined) row = put(c.s, 'templates', { id: newId(), version: 1, createdAt: c.now, ...fields })
      else { const old = find(c.s, 'templates', p.id); expectVersion(old, p.version); row = bump(c.s, 'templates', old, { ...fields, updatedAt: c.now }) }
      event(c, { jobId: null, subjectKind: 'template', subjectId: row.id, kind: 'template.saved', summary: `${c.actor.name} saved the quote template ${row.name}`, data: null })
      return row
    }
    case 'quote.draft': {
      if (p.templateId !== undefined) p = { ...p, ...fromTemplate(c, find(c.s, 'templates', p.templateId)) }
      const enquiry = p.enquiryId ? find(c.s, 'enquiries', p.enquiryId) : null
      const customer = find(c.s, 'customers', p.customerId ?? enquiry?.customerId), site = find(c.s, 'sites', p.siteId ?? enquiry?.siteId, 'sites')
      if (site.customerId !== customer.id) fail('SITE', 'That site belongs to another customer.')
      if (enquiry && enquiry.customerId !== customer.id) fail('ENQUIRY', 'That request belongs to another customer.')
      if (enquiry && ['won', 'lost'].includes(enquiry.status)) fail('ENQUIRY_STATE', `This request is already ${enquiry.status}.`)
      const row = put(c.s, 'quotes', { id: newId(), version: 1, createdAt: c.now, number: nextNumber(c, 'quote', branchIdOf(c.s, site)), branchId: branchIdOf(c.s, site), customerId: customer.id, siteId: site.id, enquiryId: enquiry?.id ?? null, title: text(p.title, 'title', { max: 200 }), status: 'draft', revisions: [revision(c, { ...site, siteId: site.id }, p, 1)], sent: [], acceptance: null, jobId: null , assessment: assessmentOf(c.s, enquiry) })
      if (enquiry) bump(c.s, 'enquiries', enquiry, { status: 'quoted', ...(enquiry.status === 'quoted' ? {} : { stageAt: c.now }), quoteId: row.id })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.drafted', summary: `${row.number} drafted by ${c.actor.name} (${c.actor.role}): ${priceLabel(current(row))} incl. tax`, data: { revision: 1 } })
      return row
    }
    case 'quote.revise': {
      const quote = open(c, p)
      if (['accepted', 'declined'].includes(quote.status)) fail('QUOTE_CLOSED', `This quote is ${quote.status}; start a new quote instead.`)
      const next = revision(c, quote, p, quote.revisions.length + 1)
      const row = bump(c.s, 'quotes', quote, { status: 'draft', title: p.title ? text(p.title, 'title', { max: 200 }) : quote.title, revisions: [...quote.revisions, next] })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.revised', summary: `${row.number} revision ${next.n} by ${c.actor.name}: ${priceLabel(next)} incl. tax (needs approval)`, data: { revision: next.n } })
      return row
    }
    case 'quote.approve': {
      const quote = open(c, p), rev = current(quote)
      if (p.revision !== rev.n) fail('REVISION', `Approve the current revision (${rev.n}).`, { current: rev.n })
      if (quote.status !== 'draft') fail('QUOTE_STATE', `This quote is already ${quote.status}.`)
      selfApproval(c, rev.preparedBy)
      const approved = { ...rev, approval: { ...who(c), at: c.now } }
      const row = bump(c.s, 'quotes', quote, { status: 'approved', revisions: [...quote.revisions.slice(0, -1), approved] })
      approval(c, 'quote', row, `${row.number} revision ${rev.n} · ${priceLabel(rev)} incl. tax`, rev.n, rev.preparedBy, 'approved')
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.approved', summary: `${row.number} revision ${rev.n} price approved by ${c.actor.name}${rev.preparedBy.role === 'agent' ? ` (prepared by agent ${rev.preparedBy.name})` : ''}`, data: { revision: rev.n, total: rev.totals.total } })
      return row
    }
    case 'quote.markSent': {
      const quote = open(c, p), rev = current(quote)
      if (!rev.approval) fail('NOT_APPROVED', 'A person approves this revision\'s price before it goes to the customer.')
      if (!['approved', 'sent'].includes(quote.status)) fail('QUOTE_STATE', `This quote is ${quote.status}.`)
      const channel = oneOf(p.channel, ['email', 'printed', 'in person', 'phone'] as const, 'channel')
      const sent = { revision: rev.n, channel, note: text(p.note, 'note', { optional: true, max: 500 }), recordedBy: who(c), at: c.now }
      const row = bump(c.s, 'quotes', quote, { status: 'sent', sent: [...quote.sent, sent] })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: 'quote.sent', summary: `${row.number} revision ${rev.n} recorded as sent by ${channel} (by ${c.actor.name}; delivery is not confirmed)`, data: sent })
      return row
    }
    case 'quote.accept':
    case 'quote.decline': {
      const quote = open(c, p), rev = current(quote)
      if (p.revision !== rev.n) fail('REVISION', `The customer answers the current revision (${rev.n}).`, { current: rev.n })
      if (!rev.approval) fail('NOT_APPROVED', 'Only an approved price can be accepted.')
      if (!['approved', 'sent'].includes(quote.status)) fail('QUOTE_STATE', `This quote is ${quote.status}.`)
      const accepted = type === 'quote.accept'
      const answer: Record<string, unknown> = { revision: rev.n, method: oneOf(p.method, ['signed', 'email reply', 'phone', 'in person'] as const, 'method'), customerName: text(p.customerName, 'customerName', { max: 200 }), note: text(p.note, 'note', { optional: true, max: 1000 }), recordedBy: who(c), at: c.now }
      if (accepted) {
        // QUOTE-001: the customer's choice of one option and any add-ons is what the job carries.
        const options = optionsOf(rev), addOns: Row[] = rev.addOns ?? [], choosing = options.length > 1 || addOns.length > 0
        const option = p.choice?.optionId === undefined ? (choosing ? fail('CHOICE', 'Record which option and add-ons the customer chose.', null, 400) : options[0]) : options.find(o => o.id === p.choice.optionId) ?? fail('CHOICE', 'Choose one of this revision\'s options.', null, 400)
        const addOnIds: string[] = Array.isArray(p.choice?.addOnIds) ? [...new Set(p.choice.addOnIds as string[])] : []
        const chosenAddOns = addOnIds.map(id => addOns.find(a => a.id === id) ?? fail('CHOICE', 'Choose add-ons from this revision.', { addOnId: id }, 400))
        const chosen = [...option.lines, ...chosenAddOns.flatMap(a => a.lines)]
        // QUOTE-007: the chosen option's discount applies to the accepted lines; a percentage re-applies to their subtotal.
        const discount = option.discount ?? null
        // TEAM-003: the technician the desk names as the seller is credited with this sold revenue.
        answer.soldByTechnicianId = p.soldByTechnicianId ? find(c.s, 'technicians', p.soldByTechnicianId).id : null
        Object.assign(answer, { choice: { optionId: option.id, optionName: option.name, addOnIds, addOnNames: chosenAddOns.map(a => a.name) }, lines: chosen, discount, totals: rev.totals.taxContext || discount ? priceTax(c.s, quote, chosen, c.now, rev.totals.taxContext, discount) : totals(chosen) })
      }
      const row = bump(c.s, 'quotes', quote, { status: accepted ? 'accepted' : 'declined', acceptance: accepted ? answer : null, declined: accepted ? null : answer })
      event(c, { jobId: null, subjectKind: 'quote', subjectId: row.id, kind: accepted ? 'quote.accepted' : 'quote.declined', summary: `${row.number} revision ${rev.n} ${accepted ? 'accepted' : 'declined'} by ${answer.customerName} (${answer.method})${accepted && optionsOf(rev).length + (rev.addOns ?? []).length > 1 ? `: ${[(answer.choice as Row).optionName, ...(answer.choice as Row).addOnNames].filter(Boolean).join(' + ')} at $${(answer.totals as Row).total}` : ''}, recorded by ${c.actor.name}`, data: answer })
      const enquiry = accepted && quote.enquiryId ? c.s.enquiries.find(e => e.id === quote.enquiryId) : null
      if (enquiry && enquiry.status !== 'won') {
        bump(c.s, 'enquiries', enquiry, { status: 'won', stageAt: c.now, wonAt: c.now, wonQuoteId: quote.id })
        event(c, { jobId: null, subjectKind: 'enquiry', subjectId: enquiry.id, kind: 'enquiry.won', summary: `Request won with ${row.number} (${enquiry.source})`, data: { quoteId: quote.id } })
      }
      return row
    }
  }
}
