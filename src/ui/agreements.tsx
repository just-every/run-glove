import { useEffect, useState } from 'react'
import { today, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'

// PLAN-002: the owner's maintenance plans, and each customer's agreements with
// included visits used and left and the next due date
// (GET /api/glove/agreements), sold, booked and ended by the desk.

const day = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00Z`))
const blankPlan = { name: '', price: '', termMonths: '12', includedVisits: '2', visitServiceId: '', repairDiscountPercent: '0', priorityBooking: false, formIds: [] as string[] }

export function Plans({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState(blankPlan)
  const { error, act } = useAction()
  const plans = s.plans ?? []
  if (!can(s.actor, 'plan.save') && !plans.length) return null
  const set = (k: keyof typeof blankPlan) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const save = () => act(run('plan.save', { ...form, termMonths: Number(form.termMonths), includedVisits: Number(form.includedVisits) }), () => setForm(blankPlan))
  return <section className="panel" aria-labelledby="plans-title"><h2 id="plans-title">Maintenance plans</h2>
    {!plans.length ? <Empty title="No plans yet">A plan sets its price, term, included visits and member discount on repairs.</Empty>
      : <ul className="rows">{plans.map(p => <li key={p.id}><div><strong>{p.name}</strong> {p.priorityBooking && <Badge tone="gold">priority booking</Badge>}<p className="muted">{money(p.price)} for {p.termMonths} months · {p.includedVisits} × {p.visitServiceName} · {p.repairDiscountPercent}% off repairs</p></div></li>)}</ul>}
    {can(s.actor, 'plan.save') && <form onSubmit={e => { e.preventDefault(); void save() }} aria-label="New plan">
      <div className="form-grid">
        <Field label="Plan name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
        <Field label="Price (USD)">{p => <input {...p} inputMode="decimal" value={form.price} onChange={set('price')} required />}</Field>
        <Field label="Term (months)">{p => <input {...p} inputMode="numeric" value={form.termMonths} onChange={set('termMonths')} />}</Field>
        <Field label="Included visits">{p => <input {...p} inputMode="numeric" value={form.includedVisits} onChange={set('includedVisits')} />}</Field>
        <Field label="Included visit service">{p => <select {...p} value={form.visitServiceId} onChange={set('visitServiceId')} required><option value="">Choose</option>{s.services.filter(x => !x.archived && x.kind !== 'discount').map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}</Field>
        <Field label="Member discount on repairs (%)">{p => <input {...p} inputMode="decimal" value={form.repairDiscountPercent} onChange={set('repairDiscountPercent')} />}</Field>
      </div>
      <p><label className="check-line"><input type="checkbox" checked={form.priorityBooking} onChange={e => setForm({ ...form, priorityBooking: e.target.checked })} /> Priority booking for members</label></p>
      {(s.forms ?? []).filter(f => !f.archived).map(f => <p key={f.id}><label className="check-line"><input type="checkbox" checked={form.formIds.includes(f.id)} onChange={e => setForm({ ...form, formIds: e.target.checked ? [...form.formIds, f.id] : form.formIds.filter(x => x !== f.id) })} /> Every included visit takes the {f.name} form</label></p>)}
      <Problem error={error} />
      <div className="actions"><button type="submit">Add plan</button></div>
    </form>}
  </section>
}

export function CustomerAgreements({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [rows, setRows] = useState<Rec[] | null>(null), [failure, setFailure] = useState('')
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  const sites = s.sites.filter(x => x.customerId === customer.id), plans = (s.plans ?? []).filter(p => !p.archived)
  const [form, setForm] = useState({ planId: '', siteId: '', via: 'phone', quoteId: '', startDate: today(zone), soldBy: '' })
  const { error, act } = useAction()
  useEffect(() => {
    let live = true
    fetch(`/api/glove/agreements?customerId=${encodeURIComponent(customer.id)}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body?.error?.message ?? 'Agreements could not load.'); return body.agreements as Rec[] })
      .then(list => { if (live) { setRows(list); setFailure('') } }, (e: Error) => { if (live) setFailure(e.message) })
    return () => { live = false }
  }, [customer.id, s.version])
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const quotes = s.quotes.filter(q => q.customerId === customer.id && q.status === 'accepted')
  const sell = () => act(run('agreement.sell', { planId: form.planId, customerId: customer.id, siteId: form.siteId || sites[0]?.id, via: form.via, startDate: form.startDate, ...(form.soldBy ? { soldByTechnicianId: form.soldBy } : {}), ...(form.via === 'quote' ? { quoteId: form.quoteId } : {}) }))
  return <section className="panel" aria-label="Agreements"><h3>Agreements</h3>
    {failure && <p className="problem" role="alert">{failure}</p>}
    {rows && (!rows.length ? <Empty title="No agreement">Sell a maintenance plan to give included visits and the member discount.</Empty>
      : <ul className="rows">{rows.map(a => <li key={a.id}><div>
        <strong>{a.plan.name}</strong> <Badge tone={a.active ? 'green' : 'grey'}>{a.active ? 'active' : a.endedAt ? 'ended' : 'not in term'}</Badge>{a.plan.priorityBooking && a.active && <> <Badge tone="gold">priority booking</Badge></>}
        <p>{a.entitlements.left} of {a.entitlements.included} visit{a.entitlements.included === 1 ? '' : 's'} left{a.entitlements.next ? `, next ${day(a.entitlements.next)}` : ''}{a.entitlements.booked ? ` · ${a.entitlements.booked} booked` : ''} · {a.plan.repairDiscountPercent}% off repairs</p>
        <p className="muted">{day(a.startDate)} to {day(a.endDate)} · sold {a.via === 'phone' ? 'by phone' : a.via === 'quote' ? 'on a quote' : 'in person'} by {a.soldBy.name}{a.soldByTechnicianId ? ` (credited to ${s.technicians.find(t => t.id === a.soldByTechnicianId)?.name ?? 'a technician'})` : ''}{a.endReason ? ` · ended: ${a.endReason}` : ''}</p>
      </div>{a.active && <div className="actions">
        {can(s.actor, 'job.create') && a.entitlements.left > a.entitlements.booked && <button type="button" onClick={() => void act(run('job.create', { customerId: customer.id, siteId: a.siteId, agreementId: a.id, title: `${a.plan.visitServiceName} (${a.plan.name})` }), job => { window.location.hash = `jobs/${job.id}` })}>Book an included visit</button>}
        {can(s.actor, 'agreement.end') && <button type="button" onClick={() => { const reason = window.prompt('Why is this agreement ending?'); if (reason) void act(run('agreement.end', { agreementId: a.id, version: a.version, reason })) }}>End agreement</button>}
      </div>}</li>)}</ul>)}
    {can(s.actor, 'agreement.sell') && plans.length > 0 && sites.length > 0 && <form onSubmit={e => { e.preventDefault(); void sell() }} aria-label="Sell a plan">
      <div className="form-grid">
        <Field label="Plan">{p => <select {...p} value={form.planId} onChange={set('planId')} required><option value="">Choose</option>{plans.map(x => <option key={x.id} value={x.id}>{x.name} · {money(x.price)}</option>)}</select>}</Field>
        {sites.length > 1 && <Field label="Site">{p => <select {...p} value={form.siteId} onChange={set('siteId')}>{sites.map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>}
        <Field label="Sold">{p => <select {...p} value={form.via} onChange={set('via')}><option value="phone">By phone</option><option value="in person">In person</option><option value="quote">On an accepted quote</option></select>}</Field>
        {form.via === 'quote' && <Field label="Quote">{p => <select {...p} value={form.quoteId} onChange={set('quoteId')} required><option value="">Choose</option>{quotes.map(q => <option key={q.id} value={q.id}>{q.number} {q.title}</option>)}</select>}</Field>}
        <Field label="Sold by technician (optional)" hint="Credited with the plan's spiff.">{p => <select {...p} value={form.soldBy} onChange={set('soldBy')}><option value="">Nobody</option>{s.technicians.filter(t => t.active !== false).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Starts">{p => <input {...p} type="date" value={form.startDate} onChange={set('startDate')} />}</Field>
      </div>
      <div className="actions"><button type="submit">Sell plan</button></div>
    </form>}
    <Problem error={error} />
  </section>
}
