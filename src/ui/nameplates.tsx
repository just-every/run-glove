import { useEffect, useState } from 'react'
import { send, type Glove, type Rec, type Run } from './api'
import { Badge, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { shrink } from './photos'
import { equipmentLabel } from './equipment'

// FIELD-006, FIELD-011 nameplate capture on the phone (read needs a signal: the photo goes
// to the owner's model provider), the owner's model provider and the desk's
// manual library; AGENT-006's callback history and advisory checklist on the
// job and on the technician's visit.

type Failure = { code: string; message: string } | null

/** The phone's nameplate card: photograph, review what the model read, then confirm or discard. */
export function PhoneNameplate({ s, visit, siteId, refresh }: { s: Glove; visit: Rec; siteId: string; refresh: () => Promise<void> }) {
  const units = s.equipment.filter(e => e.siteId === siteId)
  const readings = s.nameplates.filter((r: Rec) => r.visitId === visit.id && r.status === 'proposed')
  const [unit, setUnit] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState<Failure>(null)
  const call = async (type: string, payload: object) => {
    setBusy(true)
    try { const { body } = await send(crypto.randomUUID(), type, payload); setError(body.ok ? null : body.error); if (body.ok) await refresh() }
    catch { setError({ code: 'OFFLINE', message: 'Reading a nameplate needs a signal. Try again when you are back online.' }) }
    finally { setBusy(false) }
  }
  if (!s.business[0]?.model) return null
  return <section className="card nameplate" aria-labelledby="nameplate-title">
    <h2 id="nameplate-title" className="section-title">Nameplate</h2>
    <Field label="Which unit">{p => <select {...p} value={unit} onChange={e => setUnit(e.target.value)}><option value="">A unit not recorded yet</option>{units.map(e => <option key={e.id} value={e.id}>{equipmentLabel(e)}</option>)}</select>}</Field>
    <label className="button photo-add">{busy ? 'Reading…' : 'Photograph the nameplate'}<input className="visually-hidden" type="file" accept="image/*" capture="environment" disabled={busy} onChange={async e => { const file = e.target.files?.[0]; if (file) await call('nameplate.read', { visitId: visit.id, photo: await shrink(file), ...(unit ? { equipmentId: unit } : {}) }); e.target.value = '' }} /></label>
    {readings.map((r: Rec) => <Proposal key={r.id + r.version} s={s} reading={r} busy={busy} call={call} />)}
    {error && <p className="problem" role="alert">{error.message}</p>}
  </section>
}

function Proposal({ s, reading, busy, call }: { s: Glove; reading: Rec; busy: boolean; call: (type: string, payload: object) => Promise<void> }) {
  const [v, setV] = useState({ type: '', ...reading.proposed })
  const unit = reading.equipmentId ? s.equipment.find(e => e.id === reading.equipmentId) : null
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [key]: e.target.value })
  return <form className="material-form" onSubmit={e => { e.preventDefault(); void call('nameplate.confirm', { readingId: reading.id, version: reading.version, ...v }) }}>
    <p className="muted">Read by the model{unit ? ` for ${equipmentLabel(unit)}` : ''} — check each field against the plate. Nothing is saved until you confirm.</p>
    <img src={`/api/glove/files/${reading.photo.fileId}`} alt="Nameplate photo" className="nameplate-photo" />
    {!unit && <Field label="Equipment type">{p => <input {...p} value={v.type} onChange={set('type')} placeholder="Furnace, AC condenser…" required />}</Field>}
    <Field label="Make">{p => <input {...p} value={v.make} onChange={set('make')} />}</Field>
    <Field label="Model">{p => <input {...p} value={v.model} onChange={set('model')} />}</Field>
    <Field label="Serial">{p => <input {...p} value={v.serial} onChange={set('serial')} />}</Field>
    <Field label="Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)">{p => <input {...p} value={v.manufactured} onChange={set('manufactured')} />}</Field>
    {reading.unread.length > 0 && <p className="muted">Not legible on the photo: {reading.unread.join(', ')}</p>}
    <button type="submit" disabled={busy}>Confirm nameplate</button>
    <button type="button" className="quiet" disabled={busy} onClick={() => void call('nameplate.discard', { readingId: reading.id, version: reading.version })}>Discard</button>
  </form>
}

/** The owner's model provider for nameplate reading and the built-in agents. */
export function ModelConnect({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ url: 'https://api.openai.com/v1', model: '', key: '' })
  const { error, act } = useAction()
  if (!can(s.actor, 'model.connect')) return null
  const m = s.business[0]?.model
  return <form className="panel" aria-labelledby="model-title" onSubmit={e => { e.preventDefault(); void act(run('model.connect', v), () => setV({ ...v, key: '' })) }}>
    <h2 id="model-title">Model provider</h2>
    <p className="muted">{m ? `Connected by ${m.by}: ${m.model} at ${new URL(m.url).host}.` : 'Not connected.'} Nameplate photos and callback history (never customer names, contacts or addresses) go to this provider under your key.</p>
    <div className="form-grid">
      <Field label="API address (OpenAI-compatible)">{p => <input {...p} type="url" value={v.url} onChange={e => setV({ ...v, url: e.target.value })} required />}</Field>
      <Field label="Model">{p => <input {...p} value={v.model} onChange={e => setV({ ...v, model: e.target.value })} required />}</Field>
      <Field label="API key">{p => <input {...p} type="password" autoComplete="off" value={v.key} onChange={e => setV({ ...v, key: e.target.value })} required />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button type="submit">Connect</button>{m && <button type="button" className="quiet" onClick={() => void act(run('model.connect', { key: null }))}>Disconnect</button>}</div>
  </form>
}

/** The manual library: a confirmed nameplate with this make and model gets the manual attached. */
export function ManualLibrary({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ make: '', model: '', title: '', url: '' })
  const { error, act } = useAction()
  if (!can(s.actor, 'manual.save')) return null
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [key]: e.target.value })
  return <form className="panel" aria-labelledby="manuals-title" onSubmit={e => { e.preventDefault(); void act(run('manual.save', v), () => setV({ make: '', model: '', title: '', url: '' })) }}>
    <h2 id="manuals-title">Manufacturer manuals</h2>
    <ul className="rows">{s.manuals.map((m: Rec) => <li key={m.id}><div><strong>{m.make} {m.model}</strong><p className="muted"><a href={m.url} target="_blank" rel="noreferrer">{m.title}</a></p></div></li>)}</ul>
    <div className="form-grid">
      <Field label="Make">{p => <input {...p} value={v.make} onChange={set('make')} required />}</Field>
      <Field label="Model">{p => <input {...p} value={v.model} onChange={set('model')} required />}</Field>
      <Field label="Title">{p => <input {...p} value={v.title} onChange={set('title')} required />}</Field>
      <Field label="Manual address">{p => <input {...p} type="url" value={v.url} onChange={set('url')} required />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button type="submit">Add manual</button></div>
  </form>
}

const cite = (r: Rec) => r.label ? `${r.date} ${r.label} ${r.value}${r.unit ? ` ${r.unit}` : ''}${r.flagged ? ' (out of range)' : ''}` : `${r.date} visit (${r.technician})`

/** A prepared callback checklist, labelled advisory, with each step's cited readings. */
export function Diagnosis({ d }: { d: Rec }) {
  return <div className="diagnosis">
    <p><Badge tone="gold">Advisory</Badge> {d.advisory}</p>
    <ol>{d.checklist.map((x: Rec, i: number) => <li key={i}><strong>{x.step}</strong> — {x.why}<p className="muted">Cites {x.cites.map(cite).join('; ')}</p></li>)}</ol>
    {d.parts.length > 0 && <><h4>Parts plan</h4><ul>{d.parts.map((x: Rec, i: number) => <li key={i}>{x.part} × {x.quantity} — {x.reason}<p className="muted">Cites {x.cites.map(cite).join('; ')}</p></li>)}</ul></>}
    <p className="muted">Prepared by {d.preparedBy.name} ({d.model})</p>
  </div>
}

/** The desk's callback panel on a job: the gathered history and the agent's checklists. */
export function JobCallback({ s, run, job }: { s: Glove; run: Run; job: Rec }) {
  const [data, setData] = useState<any>(null)
  const { error, act } = useAction()
  useEffect(() => {
    if (!job.callback) return
    let live = true
    void fetch(`/api/glove/jobs/${job.id}/callback`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(body => { if (live) setData(body) })
    return () => { live = false }
  }, [job.id, s.version])
  if (!job.callback || !data) return null
  return <section aria-labelledby="callback-title"><h3 id="callback-title">Callback</h3>
    {data.pack.units.map((u: Rec) => <div key={u.equipment.id}><p><strong>{equipmentLabel(u.equipment)}</strong> serviced within {data.pack.days} days</p>
      <ul className="rows">{u.visits.map((v: Rec) => <li key={v.visitId}><div><strong>{v.ref} · {v.date} · {v.technician}</strong><p className="muted">{v.readings.map((r: Rec) => `${r.label} ${r.value}${r.unit ? ` ${r.unit}` : ''}${r.flagged ? ' (out of range)' : ''}`).join(' · ') || v.summary}</p></div></li>)}</ul>
    </div>)}
    {data.diagnoses.map((d: Rec) => <Diagnosis key={d.id} d={d} />)}
    <Problem error={error} />
    {can(s.actor, 'callback.prepare') && s.business[0]?.model && <button onClick={() => void act(run('callback.prepare', { jobId: job.id }))}>Prepare callback checklist</button>}
  </section>
}
