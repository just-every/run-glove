import { fail, find, put, event, newId, business, type Row } from '../model'
import { askModel } from '../provider'
import { callbackPack } from '../callbacks'
import type { Handler } from './types'

// AGENT-006: on a callback job (callbacks.ts), the agent, the owner or a
// dispatcher has the owner's model provider prepare a diagnosis checklist and
// parts plan from the unit's gathered history. The model sees the equipment
// and visit evidence only (no customer, contact or address) and must cite the
// pack's own visit and reading references; Glove resolves each citation to the
// recorded reading, and refuses an answer that cites nothing or cites what the
// pack does not hold. The result is advisory: it is labelled so, decides no
// work, and never certifies safety.

export const advisory = 'Advisory only: prepared by an agent from the recorded history. The licensed technician diagnoses and decides the work; this is not a safety certification.'
const cites = { type: 'array', items: { type: 'string' } }
const schema = {
  type: 'object', additionalProperties: false, required: ['checklist', 'parts'],
  properties: {
    checklist: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['step', 'why', 'cites'], properties: { step: { type: 'string' }, why: { type: 'string' }, cites } } },
    parts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['part', 'quantity', 'reason', 'cites'], properties: { part: { type: 'string' }, quantity: { type: 'string' }, reason: { type: 'string' }, cites } } },
  },
}
const instructions = 'You help a licensed HVAC, plumbing or electrical technician prepare for a callback: the customer called back about equipment serviced recently. From the recorded history only, write a short diagnosis checklist (what to check first, and why) and a parts plan (what to bring). Cite the references (V1, R1, …) of the visits and readings each item rests on. Never state that anything is safe; the technician decides.'

const bad = (): never => fail('MODEL', 'The model answered outside the requested form.', null, 502)
const words = (v: unknown, max: number) => typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : bad()

export const callbacks: Handler = async (c, type, p, db) => {
  if (type !== 'callback.prepare') return undefined
  const job = find(c.s, 'jobs', p.jobId)
  if (!job.callback) fail('NOT_CALLBACK', `${job.number} is not a callback: none of its equipment was serviced in the 30 days before it was made.`)
  const pack = callbackPack(c.s, job, c.now)
  const refs = new Map<string, Record<string, unknown>>()
  for (const u of pack.units) for (const v of u.visits) {
    refs.set(v.ref, { ref: v.ref, visitId: v.visitId, date: v.date, technician: v.technician })
    for (const r of v.readings) refs.set(r.ref, { ref: r.ref, visitId: v.visitId, date: v.date, technician: v.technician, form: r.form, label: r.label, value: r.value, unit: r.unit, ...(r.min !== undefined ? { min: r.min, max: r.max, flagged: r.flagged } : {}) })
  }
  const evidence = pack.units.map(u => ({ equipment: u.equipment, manual: u.manual?.title ?? null, visits: u.visits.map(({ ref, date, technician, summary, readings, refrigerant, notes, materials, photos }) => ({ ref, date, technician, summary, readings, refrigerant, notes, materials, photos: photos.map(x => x.caption).filter(Boolean) })) }))
  const { answer, model } = await askModel(c, db, business(c.s), 'callback_diagnosis', [
    { role: 'system', content: instructions },
    { role: 'user', content: JSON.stringify({ callback: { days: pack.days }, units: evidence }) },
  ], schema)
  const resolve = (list: unknown) => {
    if (!Array.isArray(list) || !list.length || list.some(x => typeof x !== 'string' || !refs.has(x))) bad()
    return [...new Set(list as string[])].map(x => refs.get(x)!)
  }
  if (!Array.isArray(answer.checklist) || !answer.checklist.length || !Array.isArray(answer.parts)) bad()
  const checklist = answer.checklist.map((x: Row) => ({ step: words(x?.step, 300), why: words(x?.why, 600), cites: resolve(x?.cites) }))
  const parts = answer.parts.map((x: Row) => ({ part: words(x?.part, 200), quantity: words(x?.quantity, 20), reason: words(x?.reason, 600), cites: resolve(x?.cites) }))
  const row = put(c.s, 'diagnoses', { id: newId(), version: 1, createdAt: c.now, jobId: job.id, equipmentIds: pack.units.map(u => u.equipment.id), visitsGathered: pack.units.flatMap(u => u.visits.map(v => v.visitId)), checklist, parts, advisory, model, preparedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
  event(c, { jobId: job.id, subjectKind: 'diagnosis', subjectId: row.id, kind: 'callback.prepared', summary: `${c.actor.name} prepared a callback checklist (${checklist.length} step${checklist.length === 1 ? '' : 's'}, ${parts.length} part${parts.length === 1 ? '' : 's'}) from ${row.visitsGathered.length} earlier visit${row.visitsGathered.length === 1 ? '' : 's'}; advisory, the technician decides`, data: null })
  return row
}
