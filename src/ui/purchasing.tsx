import { DocumentEmail } from './document-email'
import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Badge, Field, Problem, money, useAction } from './controls'
import { can } from './roles'

// Purchase orders to suppliers (STOCK-002) on the Stock page: raise an order of
// price-book materials for stock or a job, record how it went to the supplier
// (Glove sends nothing itself), and receive it in parts into a van or warehouse.

type Draft = { serviceId: string; quantity: string; unitCost: string }
const methods = [['email', 'Email'], ['portal', 'Supplier portal'], ['phone', 'Phone'], ['in person', 'In person']] as const
const tone = (status: string) => status === 'received' ? 'green' : status === 'draft' ? 'grey' : status === 'sent' ? 'blue' : 'gold'

function NewOrder({ s, run }: { s: Glove; run: Run }) {
  const materials = s.services.filter(x => x.kind === 'material' && !x.archived), locations = s.stock.filter(l => !l.archived)
  const jobs = s.jobs.filter(j => !['invoiced', 'cancelled'].includes(j.status))
  const [v, setV] = useState({ supplier: '', supplierEmail: '', locationId: '', jobId: '' })
  const [lines, setLines] = useState<Draft[]>([{ serviceId: '', quantity: '1', unitCost: '' }])
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const setLine = (i: number, k: keyof Draft, value: string) => setLines(lines.map((l, n) => n !== i ? l : k === 'serviceId' ? { ...l, serviceId: value, unitCost: byId(s.services, value)?.unitCost ?? l.unitCost } : { ...l, [k]: value }))
  if (!locations.length || !materials.length) return null
  const payload = { ...v, locationId: v.locationId || locations[0].id, jobId: v.jobId || undefined, lines: lines.map(l => ({ serviceId: l.serviceId, quantity: l.quantity, ...(l.unitCost ? { unitCost: l.unitCost } : {}) })) }
  return <form className="panel" aria-labelledby="po-new-title" onSubmit={e => { e.preventDefault(); void act(run('po.save', payload), () => { setV({ ...v, supplier: '', supplierEmail: '', jobId: '' }); setLines([{ serviceId: '', quantity: '1', unitCost: '' }]) }) }}>
    <h2 id="po-new-title">New purchase order</h2>
    <div className="form-grid two">
      <Field label="Supplier">{p => <input {...p} value={v.supplier} onChange={set('supplier')} required />}</Field>
      <Field label="Supplier email (optional)">{p => <input {...p} type="email" value={v.supplierEmail} onChange={set('supplierEmail')} />}</Field>
      <Field label="Deliver to">{p => <select {...p} value={payload.locationId} onChange={set('locationId')}>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}</Field>
      <Field label="For job (optional)">{p => <select {...p} value={v.jobId} onChange={set('jobId')}><option value="">Stock</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}</select>}</Field>
    </div>
    {lines.map((l, i) => <div key={i} className="form-grid">
      <Field label={`Material ${i + 1}`}>{p => <select {...p} value={l.serviceId} onChange={e => setLine(i, 'serviceId', e.target.value)} required><option value="">Choose</option>{materials.map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select>}</Field>
      <Field label={`Quantity ${i + 1}`}>{p => <input {...p} inputMode="decimal" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} required />}</Field>
      <Field label={`Unit cost ${i + 1}`}>{p => <input {...p} inputMode="decimal" value={l.unitCost} onChange={e => setLine(i, 'unitCost', e.target.value)} />}</Field>
    </div>)}
    <div className="actions"><button type="button" onClick={() => setLines([...lines, { serviceId: '', quantity: '1', unitCost: '' }])}>Add a line</button><button className="primary" type="submit">Raise purchase order</button></div>
    <Problem error={error} />
  </form>
}

function Order({ s, run, po }: { s: Glove; run: Run; po: Rec }) {
  const [sent, setSent] = useState({ method: 'email', reference: '' })
  const due = (l: Rec) => Math.max(0, Number(l.quantity) - Number(l.received))
  const [got, setGot] = useState<Record<string, string>>({})
  const { error, act } = useAction()
  const job = po.jobId ? byId(s.jobs, po.jobId) : null
  const may = can(s.actor, 'po.receive')
  return <article aria-label={`${po.number} to ${po.supplier}`}>
    <p><strong>{po.number} · {po.supplier}</strong> <Badge tone={tone(po.status)}>{po.status}</Badge></p>
    <p className="muted">To {byId(s.stock, po.locationId)?.name}{job ? ` for ${job.number}` : ''} · {money(po.total)}{po.sent ? ` · sent by ${po.sent.method}${po.sent.reference ? ` (${po.sent.reference})` : ''}, recorded by ${po.sent.by.name}` : ''}</p>
    <DocumentEmail s={s} run={run} record={po} kind="purchaseOrder" to={po.supplierEmail} ready={po.status === 'draft'} />
    <ul className="answers">{po.lines.map((l: Rec) => <li key={l.id}>{l.description} × {l.quantity} {l.unit} at {money(l.unitCost)} · received {l.received}</li>)}</ul>
    {may && po.status === 'draft' && <form aria-label={`Record ${po.number} as sent`} onSubmit={e => { e.preventDefault(); void act(run('po.send', { poId: po.id, version: po.version, method: sent.method, reference: sent.reference })) }}>
      <div className="form-grid two">
        <Field label="Sent by">{p => <select {...p} value={sent.method} onChange={e => setSent({ ...sent, method: e.target.value })}>{methods.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select>}</Field>
        <Field label="Supplier reference (optional)">{p => <input {...p} value={sent.reference} onChange={e => setSent({ ...sent, reference: e.target.value })} />}</Field>
      </div>
      <p className="muted">If you sent it outside Glove, record that send here. Delivery is not verified.</p>
      <div className="actions"><button type="submit">Record as sent</button></div>
    </form>}
    {may && ['sent', 'partly received'].includes(po.status) && <form aria-label={`Receive ${po.number}`} onSubmit={e => { e.preventDefault(); void act(run('po.receive', { poId: po.id, version: po.version, lines: po.lines.filter((l: Rec) => due(l) > 0).map((l: Rec) => ({ lineId: l.id, quantity: got[l.id] ?? String(due(l)) })).filter((x: Rec) => Number(x.quantity) > 0) }), () => setGot({})) }}>
      <div className="form-grid two">{po.lines.filter((l: Rec) => due(l) > 0).map((l: Rec) => <Field key={l.id} label={`Received now: ${l.description}`}>{p => <input {...p} inputMode="decimal" value={got[l.id] ?? String(due(l))} onChange={e => setGot({ ...got, [l.id]: e.target.value })} />}</Field>)}</div>
      <div className="actions"><button type="submit">Receive</button></div>
    </form>}
    <Problem error={error} />
  </article>
}

export function PurchaseOrders({ s, run }: { s: Glove; run: Run }) {
  if (!can(s.actor, 'po.save') && !s.purchaseOrders.length) return null
  return <>
    <section className="panel" aria-labelledby="po-title"><h2 id="po-title">Purchase orders</h2>
      {!s.purchaseOrders.length ? <p className="muted">No purchase orders yet</p> : [...s.purchaseOrders].reverse().map(po => <Order key={po.id + po.version} s={s} run={run} po={po} />)}
    </section>
    {can(s.actor, 'po.save') && <NewOrder s={s} run={run} />}
  </>
}
