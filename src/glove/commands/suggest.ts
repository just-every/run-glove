import { fail, find, bump, event, business, type Context, type Row } from '../model'
import { askModel } from '../provider'
import { touched, today } from '../equipment'
import { quotes } from './quotes'
import type { Handler } from './types'

// AGENT-005: from a request, the agent (or the owner or a dispatcher) has the
// owner's model provider draft a good, better and best quote from the price
// book, with the model's reason for each option. The model sees the request's
// description and source, the site's equipment with its age and earlier
// visits' dates and work summaries, the property's past job titles and their
// completion summaries, and the active price book at its prices (never
// costs, the customer's name, contacts or any address, technician names or
// photos). Every line must be an active price-book code; an answer
// naming anything else is refused whole, never repaired. The result is a
// draft quote labelled as drafted by the model; a person approves its prices
// (GLOVE-03) and the agent never sends it.

export const draftedLabel = 'Drafted by the model from the request. A person approves each option\'s price before it is sent.'
const tiers = ['good', 'better', 'best'] as const
const names = { good: 'Good', better: 'Better', best: 'Best' }
const option = { type: 'object', additionalProperties: false, required: ['reason', 'lines'], properties: { reason: { type: 'string' }, lines: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['code', 'quantity'], properties: { code: { type: 'string' }, quantity: { type: 'string' } } } } } }
const schema = { type: 'object', additionalProperties: false, required: ['title', ...tiers], properties: { title: { type: 'string' }, good: option, better: option, best: option } }
const instructions = 'You draft a good, better and best quote for a US home-service business (HVAC, plumbing, electrical) from a customer request, the equipment at the property and its history. Use only items from the price book given, by their code, with a quantity. Good is the smallest sound fix, better adds what the history and equipment age make sensible, best is the most complete. For each option give a short reason a customer would understand, resting only on the request and the recorded history. Give a short job title.'

const bad = (): never => fail('MODEL', 'The model answered outside the requested form.', null, 502)
const fields = (value: unknown, keys: readonly string[]): Row => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return bad()
  const actual = Object.keys(value)
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) return bad()
  return value as Row
}
const words = (v: unknown, max: number) => typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : bad()

/** Whole years from a YYYY, YYYY-MM or YYYY-MM-DD date to a local date, or null. */
export function ageYears(from: string | undefined, on: string): number | null {
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(from ?? '')
  if (!m) return null
  const [y, mo, d] = on.split('-').map(Number), years = y - Number(m[1]) - ((mo * 100 + d) < (Number(m[2] ?? 1) * 100 + Number(m[3] ?? 1)) ? 1 : 0)
  return years >= 0 ? years : null
}

/** What the model may see about a request: no customer identity, address or photos. */
export function requestEvidence(c: Context, enquiry: Row) {
  const s = c.s, on = today(s, c.now)
  const done = (jobIds: Set<string>) => s.visits.filter(v => jobIds.has(v.jobId) && v.status === 'completed' && v.completion).sort((a, b) => a.startAt.localeCompare(b.startAt)).map(v => ({ date: v.local.date, summary: v.completion.summary ?? '' }))
  const equipment = s.equipment.filter(e => e.siteId === enquiry.siteId).map(e => ({
    type: e.type, make: e.make ?? '', model: e.model ?? '', installedOn: e.installedOn ?? '', manufacturedOn: e.manufacturedOn ?? '', ageYears: ageYears(e.installedOn || e.manufacturedOn, on), refrigerant: e.refrigerant ?? '',
    visits: done(new Set(s.jobs.filter(touched(s, e)).map(j => j.id))),
  }))
  const pastJobs = s.jobs.filter(j => j.siteId === enquiry.siteId).map(j => ({ title: j.title, completed: done(new Set([j.id])).map(v => v.summary) }))
  const priceBook = s.services.filter(x => !x.archived).map(x => ({ code: x.code, name: x.name, description: x.description ?? '', unit: x.unit, price: x.unitPrice }))
  return { request: { description: enquiry.description, source: enquiry.source }, equipment, pastJobs, priceBook }
}

export const suggest: Handler = async (c, type, p, db) => {
  if (type !== 'quote.suggest') return undefined
  const enquiry = find(c.s, 'enquiries', p.enquiryId)
  if (!enquiry.siteId) fail('SITE', 'Give the request its site first; the quote is for a property.')
  if (!['new', 'contacted'].includes(enquiry.status)) fail('ENQUIRY_STATE', `This request is already ${enquiry.status}.`)
  const evidence = requestEvidence(c, enquiry)
  if (!evidence.priceBook.length) fail('PRICE_BOOK', 'The price book is empty; a drafted quote uses only its items.')
  const { answer, model } = await askModel(c, db, business(c.s), 'quote_draft', [
    { role: 'system', content: instructions },
    { role: 'user', content: JSON.stringify(evidence) },
  ], schema)
  fields(answer, ['title', ...tiers])
  const items = new Map(c.s.services.filter(x => !x.archived).map(x => [x.code, x]))
  const drafted = tiers.map(tier => {
    const o = fields(answer[tier], ['reason', 'lines'])
    if (!Array.isArray(o.lines) || !o.lines.length || o.lines.length > 20) bad()
    const lines = o.lines.map((l: Row) => {
      fields(l, ['code', 'quantity'])
      const item = items.get(l.code) ?? bad()
      if (typeof l.quantity !== 'string' || !/^\d{1,4}(\.\d{1,3})?$/.test(l.quantity) || Number(l.quantity) <= 0) bad()
      return { serviceId: item.id, description: item.name, quantity: l.quantity, unitPrice: item.unitPrice }
    })
    return { name: names[tier], reason: words(o.reason, 600), lines }
  })
  const quote = await quotes(c, 'quote.draft', { enquiryId: enquiry.id, title: words(answer.title, 200), options: drafted.map(({ name, lines }) => ({ name, lines })) }, db) as Row
  const reasons = drafted.map((d, i) => ({ optionId: quote.revisions[0].options[i].id, name: d.name, reason: d.reason }))
  event(c, { jobId: null, subjectKind: 'quote', subjectId: quote.id, kind: 'quote.suggested', summary: `${c.actor.name} had the model (${model}) draft ${quote.number} from the request: good, better and best from the price book, held as a draft until a person approves the prices`, data: { enquiryId: enquiry.id } })
  return bump(c.s, 'quotes', quote, { drafted: { label: draftedLabel, model, reasons, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } } })
}
