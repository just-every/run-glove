import { useEffect, useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Badge, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import type { Queued } from './outbox'
import { shrink } from './photos'

// Job expenses (COST-003): the desk's list with receipts, billable and markup,
// recording one, and the job's expense cost; the phone records a receipt on
// the visit through its outbox.

const categories = ['supply-house purchase', 'permit', 'equipment rental', 'subcontractor bill', 'other']
const label = (v: string) => v[0].toUpperCase() + v.slice(1)

function Receipt({ e }: { e: Rec }) {
  return e.receipt ? <a href={`/api/glove/files/${e.receipt.fileId}`} target="_blank" rel="noreferrer">Receipt</a> : null
}

function Price({ e, run }: { e: Rec; run: Run }) {
  const [markup, setMarkup] = useState(String(e.markupBasisPoints / 100))
  const { error, act } = useAction()
  return <form className="inline-form" onSubmit={ev => { ev.preventDefault(); void act(run('expense.price', { expenseId: e.id, version: e.version, billable: true, markupPercent: markup })) }}>
    <Field label="Markup %">{p => <input {...p} inputMode="decimal" value={markup} onChange={ev => setMarkup(ev.target.value)} />}</Field>
    <button type="submit">Bill with markup</button>
    {e.billable && <button type="button" className="quiet" onClick={() => act(run('expense.price', { expenseId: e.id, version: e.version, billable: false }))}>Not billable</button>}
    <Problem error={error} />
  </form>
}

/** The desk's expenses on a job, from state and GET /api/glove/jobs/<id>/cost. */
export function JobExpenses({ s, run, job }: { s: Glove; run: Run; job: Rec }) {
  const rows = s.expenses.filter(e => e.jobId === job.id)
  const [cost, setCost] = useState<any>(null)
  const [form, setForm] = useState({ category: 'supply-house purchase', vendor: '', description: '', amount: '', billable: true, markupPercent: '' })
  const { error, act } = useAction()
  const me = s.actor
  useEffect(() => {
    let live = true
    void fetch(`/api/glove/jobs/${job.id}/cost`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(body => { if (live) setCost(body) })
    return () => { live = false }
  }, [job.id, s.version])
  return <>
    <h3>Expenses</h3>
    {!rows.length ? <p className="muted">No expenses recorded.</p> : <ul className="rows">{rows.map(e => <li key={e.id}><div>
      <strong>{e.vendor}</strong> · {label(e.category)}{e.description ? ` · ${e.description}` : ''}
      <p className="muted">{money(e.amount)} · recorded by {e.recordedBy.name} <Receipt e={e} /></p>
      <p><Badge tone={e.billable ? 'blue' : 'grey'}>{e.billable ? (e.markupBasisPoints ? `Billable, ${e.markupBasisPoints / 100}% markup` : 'Billable at cost') : 'Not billable'}</Badge>{e.invoiceId && <> <Badge tone="green">On the invoice</Badge></>}</p>
      {!e.invoiceId && can(me, 'expense.price') && <Price e={e} run={run} />}
    </div></li>)}</ul>}
    {cost && rows.length > 0 && <p>Expense cost <strong>{money(cost.totals.expenses)}</strong> ({money(cost.totals.billable)} billable, {money(cost.totals.nonBillable)} not) · bills at {money(cost.totals.billed)}</p>}
    {can(me, 'expense.record') && <form onSubmit={e => { e.preventDefault(); void act(run('expense.record', { ...form, jobId: job.id, markupPercent: form.billable ? form.markupPercent : '' }), () => setForm({ ...form, vendor: '', description: '', amount: '', markupPercent: '' })) }}>
      <div className="form-grid">
        <Field label="Expense">{p => <select {...p} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{label(c)}</option>)}</select>}</Field>
        <Field label="Vendor">{p => <input {...p} value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} required />}</Field>
        <Field label="What it was for">{p => <input {...p} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />}</Field>
        <Field label="Amount">{p => <input {...p} inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />}</Field>
        {form.billable && <Field label="Markup % (blank bills at cost)">{p => <input {...p} inputMode="decimal" value={form.markupPercent} onChange={e => setForm({ ...form, markupPercent: e.target.value })} />}</Field>}
      </div>
      <label className="check-line"><input type="checkbox" checked={form.billable} onChange={e => setForm({ ...form, billable: e.target.checked })} /> Bill this to the customer</label>
      <Problem error={error} />
      <div className="actions"><button type="submit">Record expense</button></div>
    </form>}
  </>
}

type Queue = (type: string, payload: Record<string, any>, label: string) => void

/** The phone's expense card: a receipt with vendor, amount and whether it is billable, kept in the outbox until sent. */
export function PhoneExpenses({ s, visit, queue, queued }: { s: Glove; visit: Rec; queue: Queue; queued: Queued[] }) {
  const mine = s.expenses.filter(e => e.visitId === visit.id), pending = queued.filter(q => q.type === 'expense.record')
  const empty = { category: 'supply-house purchase', vendor: '', amount: '', billable: true }
  const [form, setForm] = useState(empty), [receipt, setReceipt] = useState<{ mediaType: string; base64: string } | null>(null)
  return <section className="card expenses" aria-labelledby="expenses-title">
    <h2 id="expenses-title" className="section-title">Expenses</h2>
    <div className="material-list">
      {mine.map(e => <div className="material-row" key={e.id}>{e.vendor} · {money(e.amount)} · {e.billable ? 'billable' : 'not billable'}</div>)}
      {pending.map(q => <div className="material-row" key={q.commandId}>{q.label} · waiting to send</div>)}
      {!mine.length && !pending.length && <div className="material-row muted">None recorded</div>}
    </div>
    <form className="material-form" onSubmit={e => { e.preventDefault(); queue('expense.record', { visitId: visit.id, ...form, ...(receipt ? { receipt } : {}) }, `${form.vendor} ${money(form.amount)}`); setForm(empty); setReceipt(null) }}>
      <Field label="Expense">{p => <select {...p} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{label(c)}</option>)}</select>}</Field>
      <Field label="Vendor">{p => <input {...p} value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} required />}</Field>
      <Field label="Amount">{p => <input {...p} inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />}</Field>
      <label className="check-line"><input type="checkbox" checked={form.billable} onChange={e => setForm({ ...form, billable: e.target.checked })} /> Billable to the customer</label>
      <label className="button photo-add">{receipt ? 'Receipt ready' : 'Receipt photo'}<input className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={async e => { const file = e.target.files?.[0]; if (file) setReceipt(await shrink(file)) }} /></label>
      <button type="submit">Add expense</button>
    </form>
  </section>
}
