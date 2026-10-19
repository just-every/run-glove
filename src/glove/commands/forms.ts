import { fail, text, find, expectVersion, put, bump, event, newId } from '../model'
import { questions } from '../forms'
import type { Handler } from './types'

// The owner's custom forms (FIELD-002): questions, and the services and
// equipment types each form attaches to. Archiving stops new jobs taking it.

export const forms: Handler = async (c, type, p) => {
  if (type !== 'form.save') return undefined
  const serviceIds = Array.isArray(p.serviceIds) ? [...new Set(p.serviceIds.map((id: unknown) => find(c.s, 'services', id).id))] : []
  const equipmentTypes = Array.isArray(p.equipmentTypes) ? [...new Set(p.equipmentTypes.map((t: unknown, i: number) => text(t, `equipmentTypes[${i}]`, { max: 100 })))] : []
  const fields = { name: text(p.name, 'name', { max: 200 }), questions: questions(p.questions), serviceIds, equipmentTypes, archived: p.archived === true }
  if (c.s.forms.some(f => f.id !== p.id && !f.archived && f.name.toLowerCase() === fields.name.toLowerCase())) fail('DUPLICATE', `A form named ${fields.name} already exists.`)
  let row
  if (p.id === undefined) row = put(c.s, 'forms', { id: newId(), version: 1, createdAt: c.now, createdBy: c.actor.id, ...fields })
  else { const old = find(c.s, 'forms', p.id); expectVersion(old, p.version); row = bump(c.s, 'forms', old, { ...fields, updatedAt: c.now }) }
  event(c, { jobId: null, subjectKind: 'form', subjectId: row.id, kind: 'form.saved', summary: `${c.actor.name} saved the form ${row.name} (${row.questions.length} questions)`, data: null })
  return row
}
