import { useEffect, useState } from 'react'
import { ampm, byId, today, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { PurchaseOrders } from './purchasing'

// Van and warehouse stock (STOCK-001): the desk's locations with counts, par
// levels and low flags, with stocktake, restock and transfer; the phone's van
// card with low items and the day's parts check (GET /api/glove/parts).

/** Integer thousandths as people read them: 2000 → "2", 1500 → "1.5". */
export const units = (n: number) => `${n < 0 ? '-' : ''}${Math.floor(Math.abs(n) / 1000)}${Math.abs(n) % 1000 ? '.' + String(Math.abs(n) % 1000).padStart(3, '0').replace(/0+$/, '') : ''}`
const items = (s: Glove, loc: Rec) => [...new Set([...Object.keys(loc.counts ?? {}), ...Object.keys(loc.pars ?? {})])].map(id => ({ item: byId(s.services, id), count: Number(loc.counts?.[id] ?? 0), par: loc.pars?.[id] as number | undefined })).filter(x => x.item)
const isLow = (x: { count: number; par?: number }) => x.par !== undefined && x.count <= x.par

function Move({ s, run }: { s: Glove; run: Run }) {
  const locations = s.stock.filter(l => !l.archived), materials = s.services.filter(x => x.kind === 'material' && !x.archived)
  const [chosen, setV] = useState({ action: 'stock.restock', locationId: '', toId: '', serviceId: '', quantity: '1', note: '' })
  // Locations and materials added after this form opened are offered too: an unset choice is the first one.
  const v = { ...chosen, locationId: chosen.locationId || locations[0]?.id || '', toId: chosen.toId || locations.find(l => l.id !== (chosen.locationId || locations[0]?.id))?.id || '', serviceId: chosen.serviceId || materials[0]?.id || '' }
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const payload = v.action === 'stock.transfer' ? { fromId: v.locationId, toId: v.toId, serviceId: v.serviceId, quantity: v.quantity } : v.action === 'stock.count' ? { locationId: v.locationId, serviceId: v.serviceId, quantity: v.quantity, reason: v.note } : { locationId: v.locationId, serviceId: v.serviceId, quantity: v.quantity, note: v.note }
  if (!locations.length || !materials.length) return <p className="muted">Add a location and a price-book material to keep stock.</p>
  return <form className="panel" aria-labelledby="stock-move-title" onSubmit={e => { e.preventDefault(); void act(run(v.action, payload)) }}><h2 id="stock-move-title">Count, restock or transfer</h2>
    <div className="form-grid two">
      <Field label="What happened">{p => <select {...p} value={v.action} onChange={set('action')}><option value="stock.restock">Restock arrived</option><option value="stock.transfer">Transfer</option><option value="stock.count">Stocktake count</option></select>}</Field>
      <Field label={v.action === 'stock.transfer' ? 'From' : 'Location'}>{p => <select {...p} value={v.locationId} onChange={set('locationId')}>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}</Field>
      {v.action === 'stock.transfer' && <Field label="To">{p => <select {...p} value={v.toId} onChange={set('toId')}>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>}</Field>}
      <Field label="Material">{p => <select {...p} value={v.serviceId} onChange={set('serviceId')}>{materials.map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select>}</Field>
      <Field label={v.action === 'stock.count' ? 'Counted' : 'Quantity'}>{p => <input {...p} inputMode="decimal" value={v.quantity} onChange={set('quantity')} required />}</Field>
      {v.action !== 'stock.transfer' && <Field label={v.action === 'stock.count' ? 'Reason (optional)' : 'Note (optional)'}>{p => <input {...p} value={v.note} onChange={set('note')} />}</Field>}
    </div>
    <div className="actions"><button className="primary" type="submit">Record</button></div>
    <Problem error={error} />
  </form>
}

function NewLocation({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ kind: 'van', name: '', technicianId: '', parItem: '', par: '' })
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  return <form className="panel" aria-labelledby="stock-new-title" onSubmit={e => { e.preventDefault(); void act(run('stock.location', { kind: v.kind, name: v.name, ...(v.kind === 'van' ? { technicianId: v.technicianId } : {}), pars: v.parItem ? [{ serviceId: v.parItem, par: v.par }] : [] }), () => setV({ ...v, name: '', par: '' })) }}><h2 id="stock-new-title">Add a van or warehouse</h2>
    <div className="form-grid two">
      <Field label="Kind">{p => <select {...p} value={v.kind} onChange={set('kind')}><option value="van">Van</option><option value="warehouse">Warehouse</option></select>}</Field>
      <Field label="Location name">{p => <input {...p} value={v.name} onChange={set('name')} required />}</Field>
      {v.kind === 'van' && <Field label="Technician's van">{p => <select {...p} value={v.technicianId} onChange={set('technicianId')} required><option value="">Choose</option>{s.technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>}
      <Field label="Par level for (optional)">{p => <select {...p} value={v.parItem} onChange={set('parItem')}><option value="">None</option>{s.services.filter(x => x.kind === 'material').map(x => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}</select>}</Field>
      {v.parItem && <Field label="Par level">{p => <input {...p} inputMode="decimal" value={v.par} onChange={set('par')} required />}</Field>}
    </div>
    <div className="actions"><button type="submit">Add location</button></div>
    <Problem error={error} />
  </form>
}

export function Stock({ s, run }: { s: Glove; run: Run }) {
  const locations = s.stock.filter(l => !l.archived)
  return <div className="page">
    <section className="titlebar"><div><h1>Stock</h1><p className="subtitle">What each van and warehouse holds</p></div></section>
    <div className="two-col">
      <div>{!locations.length ? <Empty title="No stock locations yet">Add a van for each technician, and your warehouse.</Empty> : locations.map(l => <section key={l.id} className="panel" aria-labelledby={`stock-${l.id}`}>
        <h2 id={`stock-${l.id}`}>{l.name}</h2><p className="muted">{l.kind === 'van' ? `Van · ${byId(s.technicians, l.technicianId)?.name ?? ''}` : 'Warehouse'}</p>
        {!items(s, l).length ? <p className="muted">Nothing counted yet</p> : <ul className="rows">{items(s, l).map(x => <li key={x.item!.id}><span>{x.item!.code} · {x.item!.name}</span><span>{units(x.count)} {x.item!.unit}{x.par !== undefined ? ` (par ${units(x.par)})` : ''} {isLow(x) && <Badge tone="red">Low</Badge>}</span></li>)}</ul>}
      </section>)}</div>
      <div>{can(s.actor, 'stock.transfer') && <><Move s={s} run={run} /><NewLocation s={s} run={run} /></>}<PurchaseOrders s={s} run={run} /></div>
    </div>
  </div>
}

/** The phone's van: low items, and today's jobs with the parts each needs and whether they are on board. */
export function PhoneVan({ s }: { s: Glove }) {
  const van = s.stock.find(l => l.kind === 'van' && !l.archived)
  const [check, setCheck] = useState<Rec | null>(null)
  const date = today(s.business[0]?.timezone ?? 'America/Chicago')
  useEffect(() => {
    let live = true
    if (van) fetch(`/api/glove/parts?date=${date}`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() as Promise<Rec> : null).then(b => { if (live) setCheck(b) }, () => {})
    return () => { live = false }
  }, [van?.id, s.version, date])
  if (!van) return null
  const low = items(s, van).filter(isLow)
  return <section className="card van" aria-labelledby="van-title">
    <h2 id="van-title" className="section-title">{van.name}</h2>
    {low.length ? <p className="field-error">Low: {low.map(x => `${x.item!.name} (${units(x.count)} ${x.item!.unit})`).join(', ')}</p> : <p className="muted">Nothing below par</p>}
    {check?.jobs.filter((j: Rec) => j.parts.length).map((j: Rec) => <div key={j.jobId} className="parts"><p><strong>{ampm(j.start)} {j.number}</strong> · {j.ready ? 'All parts on board' : 'Short of parts'}</p>
      <ul className="answers">{j.parts.map((p: Rec) => <li key={p.serviceId} className={p.onBoard ? undefined : 'flagged'}>{p.name} × {p.needed} — {p.onBoard ? 'on board' : `short (van has ${p.onVan})`}</li>)}</ul></div>)}
  </section>
}
