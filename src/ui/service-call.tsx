import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { LinesEditor, blankLine, payloadLines, type LineDraft } from './lines'
import type { Queued } from './outbox'
import { can } from './roles'

// Service calls booked without a quote (BOOK-005): the desk makes the job from
// the customer record or a request, with zero or more lines such as a
// diagnostic fee; on site the technician adds work from the price book with
// the customer's approval, priced when the office prepares the invoice.

type QueueFn = (type: string, payload: Record<string, any>, label: string) => void

export function ServiceCallForm({ s, run, customerId, enquiry, done }: { s: Glove; run: Run; customerId: string; enquiry?: Rec; done?: () => void }) {
  const sites = s.sites.filter(x => x.customerId === customerId)
  const [form, setForm] = useState({ siteId: enquiry?.siteId ?? '', title: enquiry?.description.slice(0, 80) ?? '' })
  const [lines, setLines] = useState<LineDraft[]>([])
  const { error, act } = useAction()
  if (!can(s.actor, 'job.create')) return null
  const label = enquiry ? 'Service call for this request' : 'New service call'
  return <form className="panel" aria-label={label} onSubmit={e => { e.preventDefault(); void act(run('job.create', { ...(enquiry ? { enquiryId: enquiry.id } : { customerId }), siteId: form.siteId || undefined, title: form.title, lines: payloadLines(lines) }), job => { setLines([]); setForm({ ...form, title: '' }); done?.(); window.location.hash = `jobs/${job.id}` }) }}>
    <h2>{label}</h2>
    <p className="muted">A job without a quote: book it on Dispatch; its prices are approved on the invoice.</p>
    <div className="form-grid two">
      <Field label="Service call site">{p => <select {...p} value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })} required><option value="">Choose the site</option>{sites.map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
      <Field label="What the call is for">{p => <input {...p} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />}</Field>
    </div>
    {lines.length > 0 ? <LinesEditor s={s} lines={lines} setLines={setLines} /> : <button type="button" onClick={() => setLines([blankLine()])}>Add a fee line</button>}
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Create service call</button></div>
  </form>
}

/** The phone's added work on a service call: price-book items (no prices shown) with the customer's approval. */
export function PhoneAddedWork({ s, job, visit, queue, queued }: { s: Glove; job: Rec; visit: Rec; queue: QueueFn; queued: Queued[] }) {
  const [v, setV] = useState({ serviceId: '', quantity: '1', customerName: byId(s.customers, job.customerId)?.contact ?? '', method: 'signed' })
  if (!job.serviceCall) return null
  const added = s.captures.filter(x => x.jobId === job.id && x.kind === 'line'), pending = queued.filter(q => q.payload.kind === 'line' && !q.refused)
  const items = s.services.filter(x => x.kind !== 'material')
  return <section className="card added-work" aria-labelledby="added-title">
    <h2 id="added-title" className="section-title">Work added on site</h2>
    {added.map(x => <p key={x.id}>{x.description} × {x.quantity} {x.unit} · approved by {x.approval.customerName} ({x.approval.method})</p>)}
    {pending.map(q => <p key={q.commandId} className="waiting-text">{q.label} · waiting to send</p>)}
    {!added.length && !pending.length && <p className="muted">None yet</p>}
    <form onSubmit={e => { e.preventDefault(); const item = byId(s.services, v.serviceId); queue('visit.capture', { visitId: visit.id, kind: 'line', serviceId: v.serviceId, quantity: v.quantity, approval: { customerName: v.customerName, method: v.method } }, `${item?.name} × ${v.quantity}`); setV({ ...v, serviceId: '', quantity: '1' }) }}>
      <Field label="Work from the price book">{p => <select {...p} value={v.serviceId} onChange={e => setV({ ...v, serviceId: e.target.value })} required><option value="">Choose</option>{items.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}</Field>
      <Field label="How much">{p => <input {...p} inputMode="decimal" value={v.quantity} onChange={e => setV({ ...v, quantity: e.target.value })} required />}</Field>
      <Field label="Approved by">{p => <input {...p} value={v.customerName} onChange={e => setV({ ...v, customerName: e.target.value })} required />}</Field>
      <Field label="How they approved">{p => <select {...p} value={v.method} onChange={e => setV({ ...v, method: e.target.value })}><option value="signed">Signed on this phone</option><option value="verbal">Told me in person</option></select>}</Field>
      <button type="submit">Add work</button>
    </form>
  </section>
}
