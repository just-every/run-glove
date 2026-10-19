import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'

// Assessment visits on a request (BOOK-006): book one from the request, and
// show on a quote what its request's assessment found.

export function AssessmentForm({ s, run, enquiry, done }: { s: Glove; run: Run; enquiry: Rec; done: () => void }) {
  const [v, setV] = useState({ technicianId: '', date: '', start: '09:00', end: '10:00', instructions: '', formId: '' })
  const [conflicts, setConflicts] = useState<Rec[] | null>(null)
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const send = async (acknowledge?: string[]) => {
    const o = await run('assessment.book', { enquiryId: enquiry.id, technicianId: v.technicianId, date: v.date, start: v.start, end: v.end, instructions: v.instructions, formIds: v.formId ? [v.formId] : [], ...(acknowledge ? { acknowledge } : {}) })
    if (!o.ok && o.error.code === 'CONFLICT_REVIEW') { setConflicts(o.error.details.conflicts); return }
    await act(Promise.resolve(o), done)
  }
  return <form className="panel" aria-label="Book an assessment" onSubmit={e => { e.preventDefault(); void send() }}>
    <h3>Assessment visit</h3>
    <div className="form-grid">
      <Field label="Assessor">{p => <select {...p} value={v.technicianId} onChange={set('technicianId')} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
      <Field label="Assessment date">{p => <input {...p} type="date" value={v.date} onChange={set('date')} required />}</Field>
      <Field label="Starts">{p => <input {...p} type="time" value={v.start} onChange={set('start')} required />}</Field>
      <Field label="Ends">{p => <input {...p} type="time" value={v.end} onChange={set('end')} required />}</Field>
      <Field label="Instructions">{p => <input {...p} value={v.instructions} onChange={set('instructions')} />}</Field>
      <Field label="Form to fill (optional)">{p => <select {...p} value={v.formId} onChange={set('formId')}><option value="">None</option>{s.forms.filter(f => !f.archived).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}</Field>
    </div>
    {conflicts && <div className="notice conflict" role="alert"><ul>{conflicts.map(c => <li key={c.code}>{c.message}</li>)}</ul><button type="button" className="danger" onClick={() => void send(conflicts.map(c => c.code))}>Review and confirm assessment</button></div>}
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Book assessment</button></div>
  </form>
}

export function QuoteAssessment({ quote }: { quote: Rec }) {
  const a = quote.assessment
  if (!a) return null
  return <section aria-label="From the assessment"><h3>From assessment <a href={`#jobs/${a.jobId}`}>{a.number}</a></h3>
    {a.notes.map((n: string, i: number) => <p key={i}>{n}</p>)}
    {a.forms.map((f: Rec, i: number) => <p key={i} className="muted">{f.name}: {f.answers.map((x: Rec) => `${x.label} ${typeof x.value === 'object' ? 'attached' : x.value}${x.unit ? ` ${x.unit}` : ''}`).join(' · ')}</p>)}
    <div className="photos">{a.photos.map((p: Rec) => <figure key={p.fileId} className="photo"><img src={`/api/glove/files/${p.fileId}`} alt={p.caption || 'Assessment photo'} /><figcaption>{p.caption}</figcaption></figure>)}</div>
  </section>
}
