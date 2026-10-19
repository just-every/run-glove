import { fail, text, oneOf, find, expectVersion, put, bump, event, newId, type Context, type Row } from '../model'
import { ops } from '../segments'
import type { Handler } from './types'

// Custom fields, customer tags and saved segments (CUST-004). The owner defines
// fields on customers, sites, jobs and equipment; the desk sets their values and
// a customer's tags, and saves segments (segments.ts computes members).

export const recordKinds = ['customers', 'sites', 'jobs', 'equipment'] as const
const types = ['text', 'number', 'date', 'yes/no', 'choice'] as const

function valueOf(field: Row, v: unknown, name: string) {
  if (v === null || v === undefined || v === '') return null
  switch (field.type) {
    case 'number': return typeof v === 'string' && /^-?\d{1,12}(\.\d{1,4})?$/.test(v) ? v : fail('INPUT', `${field.label} is a number.`, { field: name }, 400)
    case 'date': return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : fail('INPUT', `${field.label} is a date (YYYY-MM-DD).`, { field: name }, 400)
    case 'yes/no': return v === 'yes' || v === 'no' ? v : fail('INPUT', `${field.label} is yes or no.`, { field: name }, 400)
    case 'choice': return field.choices.includes(v) ? v : fail('INPUT', `${field.label} is one of ${field.choices.join(', ')}.`, { field: name }, 400)
    default: return text(v, name, { max: 500 })
  }
}

const tagList = (v: unknown) => {
  if (!Array.isArray(v) || v.length > 20) return fail('INPUT', 'tags is a list of at most 20 tags.', { field: 'tags' }, 400)
  const seen = new Map<string, string>()
  v.forEach((t, i) => { const tag = text(t, `tags[${i}]`, { max: 40 }); if (!seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag) })
  return [...seen.values()]
}

function filterOf(c: Context, f: any) {
  const tags = (v: unknown, name: string) => v === undefined ? [] : Array.isArray(v) && v.length <= 20 ? v.map((t, i) => text(t, `${name}[${i}]`, { max: 40 })) : fail('INPUT', `${name} is a list of tags.`, { field: name }, 400)
  const fields = (Array.isArray(f?.fields) ? f.fields : []).slice(0, 10).map((x: any, i: number) => {
    const field = find(c.s, 'customFields', x?.fieldId)
    if (!['customers', 'sites'].includes(field.record)) fail('INPUT', 'A segment filters on customer and site fields.', { field: `filter.fields[${i}]` }, 400)
    const op = oneOf(x?.op, ops, `filter.fields[${i}].op`)
    return { fieldId: field.id, op, value: op === 'set' || op === 'unset' ? null : valueOf(field, x?.value, `filter.fields[${i}].value`) }
  })
  const years = f?.equipmentOlderThanYears === undefined || f?.equipmentOlderThanYears === null ? null : Number.isInteger(f.equipmentOlderThanYears) && f.equipmentOlderThanYears >= 1 && f.equipmentOlderThanYears <= 50 ? f.equipmentOlderThanYears : fail('INPUT', 'equipmentOlderThanYears is 1 to 50.', { field: 'filter.equipmentOlderThanYears' }, 400)
  return { tagsAll: tags(f?.tagsAll, 'filter.tagsAll'), tagsNone: tags(f?.tagsNone, 'filter.tagsNone'), fields, equipmentOlderThanYears: years, noAgreement: f?.noAgreement === true }
}


function recorded(c: Context, row: Row, subjectKind: string, kind: string, summary: string, data: unknown = null) {
  event(c, { jobId: subjectKind === 'job' ? row.id : null, subjectKind, subjectId: row.id, kind, summary, data })
  return row
}

export const segments: Handler = async (c, type, p) => {
  switch (type) {
    case 'field.save': {
      const kind = oneOf(p.type, types, 'type')
      const choices = kind === 'choice' ? (Array.isArray(p.choices) && p.choices.length >= 2 && p.choices.length <= 20 ? p.choices.map((x: unknown, i: number) => text(x, `choices[${i}]`, { max: 60 })) : fail('INPUT', 'A choice field has 2 to 20 choices.', { field: 'choices' }, 400)) : []
      const fields = { record: oneOf(p.record, recordKinds, 'record'), label: text(p.label, 'label', { max: 80 }), type: kind, choices, archived: p.archived === true }
      if (p.id === undefined) return recorded(c, put(c.s, 'customFields', { id: newId(), version: 1, createdAt: c.now, ...fields }), 'field', 'field.saved', `${c.actor.name} defined custom field ${fields.label}`)
      const row = find(c.s, 'customFields', p.id); expectVersion(row, p.version)
      if (row.record !== fields.record || row.type !== fields.type) fail('INPUT', 'A field keeps its record and type; add a new field instead.', null, 400)
      return recorded(c, bump(c.s, 'customFields', row, fields), 'field', 'field.saved', `${c.actor.name} updated custom field ${fields.label}`)
    }
    case 'record.custom': {
      const kind = oneOf(p.record, recordKinds, 'record'), row = find(c.s, kind, p.id); expectVersion(row, p.version)
      if (!p.values || typeof p.values !== 'object' || Array.isArray(p.values)) fail('INPUT', 'values maps field ids to values.', { field: 'values' }, 400)
      const custom: Record<string, unknown> = { ...(row.custom ?? {}) }
      for (const [id, v] of Object.entries(p.values)) {
        const field = find(c.s, 'customFields', id)
        if (field.record !== kind || field.archived) fail('INPUT', `${field.label} is not a field of ${kind}.`, { field: id }, 400)
        custom[id] = valueOf(field, v, `values.${id}`)
      }
      return recorded(c, bump(c.s, kind, row, { custom }), kind === 'jobs' ? 'job' : kind, 'record.custom', `${c.actor.name} changed custom fields on ${kind}`, { fieldIds: Object.keys(p.values) })
    }
    case 'customer.tags': {
      const row = find(c.s, 'customers', p.customerId); expectVersion(row, p.version)
      return recorded(c, bump(c.s, 'customers', row, { tags: tagList(p.tags) }), 'customer', 'customer.tags', `${c.actor.name} changed customer tags`)
    }
    case 'segment.save': {
      const fields = { name: text(p.name, 'name', { max: 120 }), filter: filterOf(c, p.filter) }
      if (p.id === undefined) return recorded(c, put(c.s, 'segments', { id: newId(), version: 1, createdAt: c.now, by: { id: c.actor.id, name: c.actor.name }, ...fields }), 'segment', 'segment.saved', `${c.actor.name} created segment ${fields.name}`)
      const row = find(c.s, 'segments', p.id); expectVersion(row, p.version)
      return recorded(c, bump(c.s, 'segments', row, fields), 'segment', 'segment.saved', `${c.actor.name} updated segment ${fields.name}`)
    }
  }
}
