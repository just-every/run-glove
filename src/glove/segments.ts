import { fail, type Row, type State } from './model'
import { localParts } from './time'
import { formatCsv } from './csv-format'
import { activeAgreement } from './agreements'

// Customer segments (CUST-004): live customers (never merged-away ones) that
// match every part of a saved filter: all of some tags, none of others, custom
// field conditions (a customer field on the customer, a site field on any of
// its sites), and equipment at one of its sites installed at least N years
// before today (local date). "No agreement" leaves out customers with an
// agreement active today (PLAN-002).

export const ops = ['is', 'over', 'under', 'set', 'unset'] as const
const norm = (t: string) => t.trim().toLowerCase()

function matches(field: Row, value: unknown, op: string, want: unknown) {
  const empty = value === undefined || value === null || value === ''
  if (op === 'set') return !empty
  if (op === 'unset') return empty
  if (empty) return false
  if (op === 'is') return field.type === 'text' || field.type === 'choice' ? norm(String(value)) === norm(String(want)) : String(value) === String(want)
  const [a, b] = field.type === 'number' ? [Number(value), Number(want)] : [String(value), String(want)]
  return op === 'over' ? a > b : a < b
}

export function members(s: State, segment: Row) {
  const f = segment.filter, today = localParts(new Date().toISOString(), s.business[0]?.timezone ?? 'UTC').date
  const cutoff = f.equipmentOlderThanYears ? `${Number(today.slice(0, 4)) - f.equipmentOlderThanYears}${today.slice(4)}` : null
  return s.customers.filter(c => !c.mergedInto).filter(c => {
    const tags = new Set((c.tags ?? []).map(norm)), sites = s.sites.filter(x => x.customerId === c.id)
    if (!(f.tagsAll ?? []).every((t: string) => tags.has(norm(t)))) return false
    if ((f.tagsNone ?? []).some((t: string) => tags.has(norm(t)))) return false
    for (const cond of f.fields ?? []) {
      const field = s.customFields.find(x => x.id === cond.fieldId)
      if (!field) return false
      const ok = field.record === 'customers' ? matches(field, c.custom?.[field.id], cond.op, cond.value) : sites.some(x => matches(field, x.custom?.[field.id], cond.op, cond.value))
      if (!ok) return false
    }
    if (f.noAgreement && activeAgreement(s, c.id, today)) return false
    if (cutoff && !s.equipment.some(e => sites.some(x => x.id === e.siteId) && e.installedOn && e.installedOn <= cutoff)) return false
    return true
  })
}

export const segmentOf = (s: State, id: string) => s.segments.find(x => x.id === id) ?? fail('NOT_FOUND', 'No such segment.', null, 404)

/** The segment's members as CSV: name, email, phone, tags and each customer custom field. */
export function segmentCsv(s: State, segment: Row) {
  const fields = s.customFields.filter(x => x.record === 'customers' && !x.archived)
  return formatCsv([['Name', 'Email', 'Phone', 'Tags', ...fields.map(x => x.label)], ...members(s, segment).map(c => [c.name, c.email ?? '', c.phone ?? '', (c.tags ?? []).join('; '), ...fields.map(x => c.custom?.[x.id] === undefined || c.custom?.[x.id] === null ? '' : String(c.custom[x.id]))])])
}
