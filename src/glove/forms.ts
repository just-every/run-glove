import { fail, text, newId, type Context, type Row, type State } from './model'
import { image } from './commands/field'

// Custom forms and inspections (FIELD-002). The owner builds a form from
// questions of seven types; a question can show only when an earlier yes/no
// or choice question has a given answer. A form attaches to price-book
// services and to equipment types. A new job takes a copy of every form that
// applies: one per unit the job names whose type the form lists, otherwise one
// for the job when a quoted service lists it. Editing a form never changes a
// job's copy. A reading outside its range (bounds inclusive) is flagged.

export const questionTypes = ['yesno', 'choice', 'number', 'reading', 'photo', 'signature', 'notes'] as const
type Question = { id: string; label: string; type: (typeof questionTypes)[number]; required: boolean; options?: string[]; unit?: string; min?: string; max?: string; showIf?: { questionId: string; equals: string | boolean } }

const decimal = /^-?\d{1,7}(\.\d{1,3})?$/
/** A signed decimal string as integer thousandths. */
const milli = (v: string) => { const neg = v.startsWith('-'), [w, f = ''] = v.replace('-', '').split('.'); return (neg ? -1 : 1) * (Number(w) * 1000 + Number(f.padEnd(3, '0'))) }

export function questions(value: unknown): Question[] {
  if (!Array.isArray(value) || !value.length || value.length > 60) return fail('INPUT', 'A form has between 1 and 60 questions.', { field: 'questions' }, 400)
  const out: Question[] = []
  value.forEach((q: any, i) => {
    const name = `questions[${i}]`
    const type = questionTypes.includes(q?.type) ? q.type as Question['type'] : fail('INPUT', `${name}.type must be one of: ${questionTypes.join(', ')}.`, { field: `${name}.type` }, 400)
    const id = typeof q?.id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(q.id) ? q.id : newId()
    if (out.some(x => x.id === id)) fail('INPUT', `${name}.id repeats an earlier question.`, { field: `${name}.id` }, 400)
    const row: Question = { id, label: text(q?.label, `${name}.label`, { max: 300 }), type, required: q?.required === true }
    if (type === 'choice') {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 20) fail('INPUT', `${name}.options lists 2 to 20 choices.`, { field: `${name}.options` }, 400)
      row.options = q.options.map((o: unknown, j: number) => text(o, `${name}.options[${j}]`, { max: 100 }))
    }
    if (type === 'number' || type === 'reading') row.unit = text(q.unit, `${name}.unit`, { optional: type === 'number', max: 20 })
    if (type === 'reading') {
      for (const bound of ['min', 'max'] as const) if (typeof q[bound] !== 'string' || !decimal.test(q[bound])) fail('INPUT', `${name}.${bound} is a number such as 4.5.`, { field: `${name}.${bound}` }, 400)
      if (milli(q.min) > milli(q.max)) fail('INPUT', `${name}.min is at most max.`, { field: `${name}.min` }, 400)
      row.min = q.min; row.max = q.max
    }
    if (q?.showIf) {
      const on = out.find(x => x.id === q.showIf.questionId)
      if (!on || !['yesno', 'choice'].includes(on.type)) fail('INPUT', `${name}.showIf names an earlier yes/no or choice question.`, { field: `${name}.showIf` }, 400)
      const equals = on!.type === 'yesno' ? q.showIf.equals : q.showIf.equals
      if (on!.type === 'yesno' ? typeof equals !== 'boolean' : !on!.options!.includes(equals)) fail('INPUT', `${name}.showIf.equals is one of that question's answers.`, { field: `${name}.showIf.equals` }, 400)
      row.showIf = { questionId: on!.id, equals }
    }
    out.push(row)
  })
  return out
}

/** The forms a new job takes: per named unit of a listed equipment type, else once for a quoted service that lists it. */
export function formsFor(s: State, serviceIds: string[], equipmentIds: string[]) {
  const units = equipmentIds.map(id => s.equipment.find(e => e.id === id)!).filter(Boolean)
  return s.forms.filter(f => !f.archived).flatMap(f => {
    const types = (f.equipmentTypes as string[]).map(t => t.toLowerCase())
    const matching = units.filter(u => types.includes(String(u.type).toLowerCase()))
    const copy = (equipmentId: string | null) => ({ id: newId(), formId: f.id, formVersion: f.version, name: f.name, questions: f.questions, equipmentId })
    if (matching.length) return matching.map(u => copy(u.id))
    return f.serviceIds.some((id: string) => serviceIds.includes(id)) ? [copy(null)] : []
  })
}

/** Check a filled form against its questions: visible ones answered when required, hidden ones left empty. */
export async function answer(c: Context, form: Row, value: unknown) {
  const given = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fail('INPUT', 'answers maps question ids to answers.', { field: 'answers' }, 400)
  const unknownId = Object.keys(given).find(id => !form.questions.some((q: Question) => q.id === id))
  if (unknownId) fail('INPUT', 'An answer names a question this form does not have.', { questionId: unknownId }, 400)
  const shown = new Set<string>(), answers: Record<string, any>[] = [], open: string[] = []
  for (const q of form.questions as Question[]) {
    const visible = !q.showIf || (shown.has(q.showIf.questionId) && given[q.showIf.questionId] === q.showIf.equals)
    const v = given[q.id], empty = v === undefined || v === null || v === ''
    if (!visible) { if (!empty) fail('INPUT', `"${q.label}" is not asked with these answers; leave it empty.`, { questionId: q.id }, 400); continue }
    shown.add(q.id)
    if (empty) { if (q.required) open.push(q.label); continue }
    const at = `answers.${q.id}`
    let shownValue: unknown, flagged = false
    if (q.type === 'yesno') shownValue = typeof v === 'boolean' ? v : fail('INPUT', `${q.label}: answer yes or no.`, { field: at }, 400)
    else if (q.type === 'choice') shownValue = q.options!.includes(v as string) ? v : fail('INPUT', `${q.label}: choose one of ${q.options!.join(', ')}.`, { field: at }, 400)
    else if (q.type === 'number' || q.type === 'reading') {
      if (typeof v !== 'string' || !decimal.test(v)) fail('INPUT', `${q.label}: a number such as 4.5.`, { field: at }, 400)
      shownValue = v
      if (q.type === 'reading') flagged = milli(v as string) < milli(q.min!) || milli(v as string) > milli(q.max!)
    } else if (q.type === 'notes') shownValue = text(v, at, { max: 4000 })
    else shownValue = await image(c, v, c.commandId, at)
    answers.push({ questionId: q.id, label: q.label, type: q.type, value: shownValue, ...(q.unit ? { unit: q.unit } : {}), ...(q.type === 'reading' ? { min: q.min, max: q.max, flagged } : {}) })
  }
  if (open.length) fail('FORM', 'Answer the required questions.', { open })
  return { answers, flagged: answers.filter(a => a.flagged).length }
}
