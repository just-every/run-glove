import { useEffect, useState } from 'react'
import { byId, today, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { CustomValues } from './custom-fields'
import type { Queued } from './outbox'
import { shrink } from './photos'

// Installed equipment at a site (CUST-002) and refrigerant records on it
// (FIELD-007): the desk's equipment panel with warranty states and service
// history, the expiring-warranty report, and the phone's equipment card,
// which reads from the loaded records so it stays readable offline.

export const equipmentLabel = (e: Rec) => [e.type, e.make, e.model].filter(Boolean).join(' ')

/** Days from `from` to `until` (YYYY-MM-DD); a warranty ending within 90 days is expiring. */
function warranty(until: string, from: string) {
  if (!until) return null
  const days = Math.round((Date.parse(`${until}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
  return days < 0 ? { tone: 'red' as const, text: `expired ${until}` } : days <= 90 ? { tone: 'gold' as const, text: `expiring ${until}` } : { tone: 'green' as const, text: `until ${until}` }
}

function Warranties({ s, e }: { s: Glove; e: Rec }) {
  const now = today(s.business[0]?.timezone ?? 'UTC')
  const shown = [['Manufacturer warranty', warranty(e.manufacturerWarrantyUntil, now)], ['Labor warranty', warranty(e.laborWarrantyUntil, now)]] as const
  return <>{shown.map(([name, w]) => w && <Badge key={name} tone={w.tone}>{`${name} ${w.text}`}</Badge>)}</>
}

const facts = (e: Rec) => [e.serial && `Serial ${e.serial}`, e.installedOn && `installed ${e.installedOn}`, e.refrigerant, e.location].filter(Boolean).join(' · ')

const blank = { siteId: '', type: '', make: '', model: '', serial: '', installedOn: '', refrigerant: '', location: '', manufacturerWarrantyUntil: '', laborWarrantyUntil: '' }

/** The desk's equipment at a customer's sites: add, read warranty state and open a unit's service history. */
export function SiteEquipment({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const sites = s.sites.filter(x => x.customerId === customer.id)
  const [form, setForm] = useState({ ...blank, siteId: sites[0]?.id ?? '' })
  const [history, setHistory] = useState<any>(null)
  const { error, act } = useAction()
  const set = (key: keyof typeof blank) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const units = s.equipment.filter(e => sites.some(x => x.id === e.siteId))
  const open = async (id: string) => { const r = await fetch(`/api/glove/equipment/${id}`, { credentials: 'same-origin', cache: 'no-store' }); setHistory(r.ok ? await r.json() : null) }
  if (!sites.length) return null
  return <section className="panel" aria-labelledby="equipment-title"><h2 id="equipment-title">Equipment</h2>
    {!units.length ? <Empty title="No equipment recorded">Add the units installed at this customer's sites.</Empty> : <ul className="rows">{units.map(e => <li key={e.id}><div>
      <strong>{equipmentLabel(e)}</strong><p className="muted">{facts(e)}{sites.length > 1 ? ` · ${byId(s.sites, e.siteId)?.address}` : ''}</p><p><Warranties s={s} e={e} /></p><CustomValues key={e.id + e.version} s={s} run={run} kind="equipment" row={e} title={`Equipment fields for ${equipmentLabel(e)}`} />
    </div><button onClick={() => void open(e.id)}>Service history</button></li>)}</ul>}
    {history && <div aria-live="polite"><h3>{equipmentLabel(history.equipment)} service history</h3>
      {!history.history.length ? <p className="muted">No jobs have touched this unit yet.</p> : <ul className="rows">{history.history.map((j: Rec) => <li key={j.jobId}><div><strong>{j.number} · {j.title}</strong>
        <p className="muted">{j.visits.map((v: Rec) => `${v.date} ${v.technician} (${v.status})`).join('; ')}</p>
        {j.captures.map((x: Rec) => <p key={x.id}>{x.kind === 'refrigerant' ? `${x.refrigerant.type}: ${x.refrigerant.added} lb added, ${x.refrigerant.recovered} lb recovered` : x.kind === 'form' ? `${x.formName}${x.flagged ? ` — ${x.flagged} reading${x.flagged === 1 ? '' : 's'} out of range` : ''}` : x.text ?? x.label ?? x.description ?? x.caption ?? x.kind}</p>)}
      </div></li>)}</ul>}
      {history.refrigerant.entries.length > 0 && <p className="muted">Refrigerant on this unit: {history.refrigerant.added} lb added, {history.refrigerant.recovered} lb recovered</p>}
    </div>}
    {can(s.actor, 'equipment.save') && <form onSubmit={e => { e.preventDefault(); void act(run('equipment.save', form), () => setForm({ ...blank, siteId: form.siteId })) }}>
      <h3>Add equipment</h3>
      <div className="form-grid">
        <Field label="Site">{p => <select {...p} value={form.siteId} onChange={set('siteId')} required>{sites.map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
        <Field label="Type">{p => <input {...p} value={form.type} onChange={set('type')} placeholder="Furnace, AC condenser…" required />}</Field>
        <Field label="Make">{p => <input {...p} value={form.make} onChange={set('make')} />}</Field>
        <Field label="Model">{p => <input {...p} value={form.model} onChange={set('model')} />}</Field>
        <Field label="Serial">{p => <input {...p} value={form.serial} onChange={set('serial')} />}</Field>
        <Field label="Installed">{p => <input {...p} type="date" value={form.installedOn} onChange={set('installedOn')} />}</Field>
        <Field label="Refrigerant">{p => <input {...p} value={form.refrigerant} onChange={set('refrigerant')} placeholder="R-410A" />}</Field>
        <Field label="Location in the building">{p => <input {...p} value={form.location} onChange={set('location')} />}</Field>
        <Field label="Manufacturer warranty until">{p => <input {...p} type="date" value={form.manufacturerWarrantyUntil} onChange={set('manufacturerWarrantyUntil')} />}</Field>
        <Field label="Labor warranty until">{p => <input {...p} type="date" value={form.laborWarrantyUntil} onChange={set('laborWarrantyUntil')} />}</Field>
      </div>
      <Problem error={error} />
      <div className="actions"><button type="submit">Add equipment</button></div>
    </form>}
  </section>
}

/** Warranties expiring within 90 days or already expired, from GET /api/glove/reports/warranties. */
export function ExpiringWarranties({ s }: { s: Glove }) {
  const [report, setReport] = useState<any>(null)
  useEffect(() => {
    let live = true
    void fetch('/api/glove/reports/warranties', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(body => { if (live) setReport(body) })
    return () => { live = false }
  }, [s.version])
  const rows = report ? [...report.expiring, ...report.expired] : []
  if (!rows.length) return null
  return <section className="panel" aria-labelledby="warranties-title"><h2 id="warranties-title">Warranties expiring</h2>
    <ul className="rows">{rows.map((r: Rec) => <li key={r.equipmentId + r.warranty}><div><strong>{r.label}{r.serial ? ` · ${r.serial}` : ''}</strong><p className="muted">{r.site}</p></div>
      <Badge tone={r.state === 'expired' ? 'red' : 'gold'}>{`${r.warranty === 'labor' ? 'Labor' : 'Manufacturer'} ${r.state === 'expired' ? 'expired' : 'ends'} ${r.until}`}</Badge></li>)}</ul>
  </section>
}

type Queue = (type: string, payload: Record<string, any>, label: string) => void

/** The phone's equipment card for a visit's site: units from the loaded records, adding one, and refrigerant added or recovered. */
export function PhoneEquipment({ s, visit, siteId, queue, queued }: { s: Glove; visit: Rec; siteId: string; queue: Queue; queued: Queued[] }) {
  const units = s.equipment.filter(e => e.siteId === siteId)
  const pending = queued.filter(q => q.type === 'equipment.save')
  const charges = s.captures.filter(x => x.visitId === visit.id && x.kind === 'refrigerant'), pendingCharges = queued.filter(q => q.payload.kind === 'refrigerant')
  const empty = { type: '', make: '', model: '', serial: '', location: '' }
  const [form, setForm] = useState(false), [adding, setAdding] = useState(empty), [editing, setEditing] = useState<Rec | null>(null), [photo, setPhoto] = useState<{ mediaType: string; base64: string } | null>(null)
  const [charge, setCharge] = useState({ equipmentId: '', added: '', recovered: '' })
  const set = (key: keyof typeof adding) => (e: { target: { value: string } }) => setAdding({ ...adding, [key]: e.target.value })
  return <section className="card equipment" aria-labelledby="equipment-title">
    <h2 id="equipment-title" className="section-title">Equipment</h2>
    <div className="material-list">
      {units.map(e => <div className="material-row" key={e.id}><strong>{equipmentLabel(e)}</strong>{facts(e) && <> · {facts(e)}</>}<br /><Warranties s={s} e={e} /> <button type="button" onClick={() => { setForm(true); setEditing(e); setAdding({ type: e.type, make: e.make, model: e.model, serial: e.serial, location: e.location }) }}>Update</button></div>)}
      {pending.map(q => <div className="material-row" key={q.commandId}>{q.label} · waiting to send</div>)}
      {!units.length && !pending.length && <div className="material-row muted">None recorded at this site</div>}
    </div>
    {!form ? <button type="button" onClick={() => { setForm(true); setEditing(null); setAdding(empty) }}>New equipment</button> : <form className="material-form" onSubmit={e => {
      e.preventDefault()
      // An update keeps the unit's install date, refrigerant and warranties as the desk recorded them.
      const kept = editing ? { id: editing.id, version: editing.version, installedOn: editing.installedOn, refrigerant: editing.refrigerant, manufacturerWarrantyUntil: editing.manufacturerWarrantyUntil, laborWarrantyUntil: editing.laborWarrantyUntil } : {}
      queue('equipment.save', { visitId: visit.id, ...kept, ...adding, ...(photo ? { photo } : {}) }, `${editing ? 'Update' : 'New'}: ${[adding.type, adding.make, adding.model].filter(Boolean).join(' ')}`)
      setAdding(empty); setEditing(null); setPhoto(null); setForm(false)
    }}>
      {editing && <p className="muted">Updating {equipmentLabel(editing)}</p>}
      <Field label="Equipment type">{p => <input {...p} value={adding.type} onChange={set('type')} required />}</Field>
      <Field label="Make">{p => <input {...p} value={adding.make} onChange={set('make')} />}</Field>
      <Field label="Model">{p => <input {...p} value={adding.model} onChange={set('model')} />}</Field>
      <Field label="Serial">{p => <input {...p} value={adding.serial} onChange={set('serial')} />}</Field>
      <Field label="Where it is">{p => <input {...p} value={adding.location} onChange={set('location')} />}</Field>
      <label className="button photo-add">{photo ? 'Photo ready' : 'Unit photo'}<input className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={async e => { const file = e.target.files?.[0]; if (file) setPhoto(await shrink(file)) }} /></label>
      <button type="submit">{editing ? 'Save equipment' : 'Add equipment'}</button>
      <button type="button" className="quiet" onClick={() => { setForm(false); setEditing(null); setPhoto(null) }}>Cancel</button>
    </form>}
    {units.some(e => e.refrigerant) && <>
      <h3 className="section-title">Refrigerant</h3>
      <div className="material-list">
        {charges.map(x => <div className="material-row" key={x.id}>{x.refrigerant.type} · {x.refrigerant.added} lb added · {x.refrigerant.recovered} lb recovered</div>)}
        {pendingCharges.map(q => <div className="material-row" key={q.commandId}>{q.label} · waiting to send</div>)}
      </div>
      <form className="material-form" onSubmit={e => { e.preventDefault(); const unit = byId(s.equipment, charge.equipmentId); queue('visit.capture', { visitId: visit.id, kind: 'refrigerant', equipmentId: charge.equipmentId, added: charge.added || '0', recovered: charge.recovered || '0' }, `${unit?.refrigerant ?? 'Refrigerant'}: ${charge.added || '0'} lb added, ${charge.recovered || '0'} lb recovered`); setCharge({ equipmentId: '', added: '', recovered: '' }) }}>
        <Field label="Unit">{p => <select {...p} value={charge.equipmentId} onChange={e => setCharge({ ...charge, equipmentId: e.target.value })} required><option value="">Choose the unit</option>{units.filter(e => e.refrigerant).map(e => <option key={e.id} value={e.id}>{equipmentLabel(e)} ({e.refrigerant})</option>)}</select>}</Field>
        <Field label="Added (lb)">{p => <input {...p} inputMode="decimal" value={charge.added} onChange={e => setCharge({ ...charge, added: e.target.value })} />}</Field>
        <Field label="Recovered (lb)">{p => <input {...p} inputMode="decimal" value={charge.recovered} onChange={e => setCharge({ ...charge, recovered: e.target.value })} />}</Field>
        <button type="submit">Record refrigerant</button>
      </form>
    </>}
  </section>
}
