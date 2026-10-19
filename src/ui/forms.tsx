import { useEffect, useRef, useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import type { Queued } from './outbox'
import { shrink } from './photos'

// Custom forms and inspections (FIELD-002): the owner's builder, the phone's
// filling (through the outbox, so it works offline) and the desk's reading of
// a filled form. A question shows only when its condition holds; a reading
// outside its range is flagged.

type QueueFn = (type: string, payload: Record<string, any>, label: string) => void
type Draft = { id: string; label: string; type: string; required: boolean; options: string; unit: string; min: string; max: string; on: string; equals: string }
const types: [string, string][] = [['yesno', 'Yes or no'], ['choice', 'Choice'], ['number', 'Number'], ['reading', 'Reading with range'], ['photo', 'Photo'], ['signature', 'Signature'], ['notes', 'Notes']]
const blank = (): Draft => ({ id: crypto.randomUUID().slice(0, 8), label: '', type: 'yesno', required: false, options: '', unit: '', min: '', max: '', on: '', equals: '' })
const fromForm = (f: Rec): Draft[] => f.questions.map((q: Rec) => ({ ...blank(), id: q.id, label: q.label, type: q.type, required: q.required, options: (q.options ?? []).join(', '), unit: q.unit ?? '', min: q.min ?? '', max: q.max ?? '', on: q.showIf?.questionId ?? '', equals: q.showIf === undefined ? '' : String(q.showIf.equals) }))
const toPayload = (d: Draft[]) => d.map(q => {
  const on = d.find(x => x.id === q.on)
  return { id: q.id, label: q.label, type: q.type, required: q.required, ...(q.type === 'choice' ? { options: q.options.split(',').map(o => o.trim()).filter(Boolean) } : {}), ...(['number', 'reading'].includes(q.type) ? { unit: q.unit } : {}), ...(q.type === 'reading' ? { min: q.min, max: q.max } : {}), ...(on ? { showIf: { questionId: on.id, equals: on.type === 'yesno' ? q.equals === 'true' : q.equals } } : {}) }
})

function Builder({ s, run, form, done }: { s: Glove; run: Run; form: Rec | null; done: () => void }) {
  const [name, setName] = useState(form?.name ?? '')
  const [qs, setQs] = useState<Draft[]>(form ? fromForm(form) : [blank()])
  const [serviceIds, setServiceIds] = useState<string[]>(form?.serviceIds ?? [])
  const [equipmentTypes, setTypes] = useState((form?.equipmentTypes ?? []).join(', '))
  const { error, act } = useAction()
  const set = (i: number, change: Partial<Draft>) => setQs(qs.map((q, j) => j === i ? { ...q, ...change } : q))
  return <form className="form-builder" aria-label={form ? `Edit ${form.name}` : 'New form'} onSubmit={e => { e.preventDefault(); void act(run('form.save', { ...(form ? { id: form.id, version: form.version } : {}), name, questions: toPayload(qs), serviceIds, equipmentTypes: equipmentTypes.split(',').map((t: string) => t.trim()).filter(Boolean) }), done) }}>
    <Field label="Form name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required />}</Field>
    {qs.map((q, i) => { const earlier = qs.slice(0, i).filter(x => ['yesno', 'choice'].includes(x.type)), on = qs.find(x => x.id === q.on); return <fieldset key={q.id} className="question"><legend>Question {i + 1}</legend>
      <div className="form-grid two">
        <Field label="Question">{p => <input {...p} value={q.label} onChange={e => set(i, { label: e.target.value })} required />}</Field>
        <Field label="Answer type">{p => <select {...p} value={q.type} onChange={e => set(i, { type: e.target.value })}>{types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
        {q.type === 'choice' && <Field label="Choices, separated by commas">{p => <input {...p} value={q.options} onChange={e => set(i, { options: e.target.value })} required />}</Field>}
        {['number', 'reading'].includes(q.type) && <Field label="Unit">{p => <input {...p} value={q.unit} onChange={e => set(i, { unit: e.target.value })} required={q.type === 'reading'} />}</Field>}
        {q.type === 'reading' && <><Field label="Lowest in range">{p => <input {...p} inputMode="decimal" value={q.min} onChange={e => set(i, { min: e.target.value })} required />}</Field><Field label="Highest in range">{p => <input {...p} inputMode="decimal" value={q.max} onChange={e => set(i, { max: e.target.value })} required />}</Field></>}
        {earlier.length > 0 && <Field label="Ask only when">{p => <select {...p} value={q.on} onChange={e => set(i, { on: e.target.value, equals: '' })}><option value="">Always ask</option>{earlier.map(x => <option key={x.id} value={x.id}>{x.label || 'Untitled question'}</option>)}</select>}</Field>}
        {on && <Field label="Has the answer">{p => <select {...p} value={q.equals} onChange={e => set(i, { equals: e.target.value })} required><option value="">Choose</option>{on.type === 'yesno' ? <><option value="true">Yes</option><option value="false">No</option></> : on.options.split(',').map(o => o.trim()).filter(Boolean).map(o => <option key={o}>{o}</option>)}</select>}</Field>}
      </div>
      <label className="check-line"><input type="checkbox" checked={q.required} onChange={e => set(i, { required: e.target.checked })} /> Required</label>
      {qs.length > 1 && <button type="button" className="quiet" onClick={() => setQs(qs.filter((_, j) => j !== i).map(x => x.on === q.id ? { ...x, on: '', equals: '' } : x))}>Remove question</button>}
    </fieldset> })}
    <button type="button" onClick={() => setQs([...qs, blank()])}>Add question</button>
    <fieldset><legend>Attach to services</legend>{s.services.filter(x => !x.archived).map(x => <label key={x.id} className="check-line"><input type="checkbox" checked={serviceIds.includes(x.id)} onChange={e => setServiceIds(e.target.checked ? [...serviceIds, x.id] : serviceIds.filter(id => id !== x.id))} /> {x.code} · {x.name}</label>)}</fieldset>
    <Field label="Attach to equipment types, separated by commas" hint="Each unit of these types on a job gets its own copy.">{p => <input {...p} value={equipmentTypes} onChange={e => setTypes(e.target.value)} />}</Field>
    <div className="actions"><button className="primary" type="submit">Save form</button><button type="button" className="quiet" onClick={done}>Cancel</button></div>
    <Problem error={error} />
  </form>
}

/** The owner's forms and the builder. */
export function Forms({ s, run }: { s: Glove; run: Run }) {
  const [editing, setEditing] = useState<string | null>(null)
  const forms = s.forms.filter(f => !f.archived), service = (id: string) => s.services.find(x => x.id === id)?.name
  return <section className="panel" aria-labelledby="forms-title"><h2 id="forms-title">Forms and inspections</h2>
    {forms.length > 0 && <ul className="rows">{forms.map(f => <li key={f.id}><div><strong>{f.name}</strong><p className="muted">{f.questions.length} questions · {[...f.serviceIds.map(service), ...f.equipmentTypes].filter(Boolean).join(', ') || 'not attached'}</p></div><button onClick={() => setEditing(f.id)}>Edit</button></li>)}</ul>}
    {editing ? <Builder key={editing} s={s} run={run} form={s.forms.find(f => f.id === editing) ?? null} done={() => setEditing(null)} /> : <button onClick={() => setEditing('new')}>New form</button>}
  </section>
}

function Pad({ onChange }: { onChange: (base64: string | null) => void }) {
  const pad = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = pad.current!, ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1D1B18'
    let drawing = false
    const at = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height] }
    const down = (e: PointerEvent) => { drawing = true; canvas.setPointerCapture(e.pointerId); const [x, y] = at(e); ctx.beginPath(); ctx.moveTo(x, y) }
    const move = (e: PointerEvent) => { if (!drawing) return; const [x, y] = at(e); ctx.lineTo(x, y); ctx.stroke() }
    const up = () => { if (drawing) onChange(canvas.toDataURL('image/png').split(',')[1]); drawing = false }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up)
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up) }
  }, [onChange])
  return <canvas ref={pad} className="signature" width={600} height={200} aria-label="Signature pad" />
}

const visibleQuestions = (form: Rec, answers: Record<string, any>) => {
  const shown = new Set<string>()
  return form.questions.filter((q: Rec) => { const ok = !q.showIf || (shown.has(q.showIf.questionId) && answers[q.showIf.questionId] === q.showIf.equals); if (ok) shown.add(q.id); return ok })
}

function Fill({ form, unit, queue, visitId }: { form: Rec; unit: string; queue: QueueFn; visitId: string }) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const set = (id: string, v: any) => setAnswers(a => ({ ...a, [id]: v }))
  const shown = visibleQuestions(form, answers)
  return <form className="form-fill" onSubmit={e => { e.preventDefault(); const ids = new Set(shown.map((q: Rec) => q.id)); queue('visit.capture', { visitId, kind: 'form', formId: form.id, answers: Object.fromEntries(Object.entries(answers).filter(([k, v]) => ids.has(k) && v !== '' && v !== undefined)) }, form.name) }}>
    {shown.map((q: Rec) => <div key={q.id} className="question">
      {q.type === 'yesno' ? <fieldset><legend>{q.label}{q.required ? ' *' : ''}</legend><label className="check-line"><input type="radio" name={`${form.id}-${q.id}`} checked={answers[q.id] === true} onChange={() => set(q.id, true)} required={q.required} /> Yes</label><label className="check-line"><input type="radio" name={`${form.id}-${q.id}`} checked={answers[q.id] === false} onChange={() => set(q.id, false)} /> No</label></fieldset>
        : q.type === 'choice' ? <Field label={q.label}>{p => <select {...p} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} required={q.required}><option value="">Choose</option>{q.options.map((o: string) => <option key={o}>{o}</option>)}</select>}</Field>
        : ['number', 'reading'].includes(q.type) ? <Field label={`${q.label} (${q.unit || 'number'})`} hint={q.type === 'reading' ? `In range ${q.min}–${q.max} ${q.unit}` : undefined}>{p => <input {...p} inputMode="decimal" value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} required={q.required} />}</Field>
        : q.type === 'notes' ? <Field label={q.label}>{p => <textarea {...p} value={answers[q.id] ?? ''} onChange={e => set(q.id, e.target.value)} required={q.required} />}</Field>
        : q.type === 'photo' ? <Field label={q.label}>{p => <input {...p} type="file" accept="image/*" capture="environment" required={q.required} onChange={async e => { const f = e.target.files?.[0]; if (f) set(q.id, await shrink(f)) }} />}</Field>
        : <div><p className="muted">{q.label}</p><Pad onChange={b => set(q.id, b ? { mediaType: 'image/png', base64: b } : '')} /></div>}
    </div>)}
    <button type="submit">Save {form.name}{unit ? ` for ${unit}` : ''}</button>
  </form>
}

/** The phone's forms on a visit's job: each copy to fill, or how it was filled. */
export function PhoneForms({ s, job, visit, queue, queued }: { s: Glove; job: Rec; visit: Rec; queue: QueueFn; queued: Queued[] }) {
  if (!job.forms?.length) return null
  const unitLabel = (id: string | null) => { const u = id ? s.equipment.find(e => e.id === id) : null; return u ? [u.type, u.make].filter(Boolean).join(' ') : '' }
  return <>{job.forms.map((f: Rec) => {
    const done = s.captures.find(x => x.kind === 'form' && x.formId === f.id), pending = queued.find(q => q.payload.kind === 'form' && q.payload.formId === f.id && !q.refused), unit = unitLabel(f.equipmentId)
    return <section key={f.id} className="card form-card" aria-label={`${f.name}${unit ? ` · ${unit}` : ''}`}>
      <h2 className="section-title">{f.name}{unit ? ` · ${unit}` : ''}</h2>
      {done ? <FilledForm capture={done} /> : pending ? <p className="waiting-text">Filled on this phone — waiting to send</p> : <Fill form={f} unit={unit} queue={queue} visitId={visit.id} />}
    </section>
  })}</>
}

const shownValue = (a: Rec) => a.type === 'yesno' ? (a.value ? 'Yes' : 'No') : ['photo', 'signature'].includes(a.type) ? null : `${a.value}${a.unit ? ` ${a.unit}` : ''}`

/** A filled form's answers, with out-of-range readings marked. */
export function FilledForm({ capture }: { capture: Rec }) {
  return <div className="filled-form">
    {capture.flagged > 0 && <p className="field-error">{capture.flagged} reading{capture.flagged === 1 ? '' : 's'} out of range</p>}
    <ul className="answers">{capture.answers.map((a: Rec) => <li key={a.questionId} className={a.flagged ? 'flagged' : undefined}>{a.label}: {shownValue(a) ?? <a href={`/api/glove/files/${a.value.fileId}`} target="_blank" rel="noreferrer">{a.type === 'photo' ? 'Photo' : 'Signature'}</a>}{a.flagged ? ` — out of range ${a.min}–${a.max} ${a.unit}` : ''}</li>)}</ul>
  </div>
}
