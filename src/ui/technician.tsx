import { recordZone } from './branches'
import { useEffect, useRef, useState } from 'react'
import { byId, dateLabel, timeRange, today, type Glove, type Rec } from './api'
import { Empty, Field } from './controls'
import { useOutbox, type Queued } from './outbox'
import { Glyph } from './glyphs'
import { PhoneEquipment } from './equipment'
import { PhoneNameplate, Diagnosis } from './nameplates'
import { shrink } from './photos'
import { PhoneExpenses } from './expenses'
import { ClockCard, VisitTimers } from './clock'
import { PhoneForms } from './forms'
import { keepShell } from './offline-day'
import { PhoneVan } from './stock'
import { PhoneAddedWork } from './service-call'
import { PhonePush } from './push'
import { can } from './roles'
import { PhoneLocation } from './phone-location'
import { PhoneInvoice } from './field-invoices'
import { PhonePortrait } from './technician-portrait'
import { PhoneOnMyWay } from './visit-status-notices'

// The technician's phone: their visits, and on a visit everything they record.
// Each record goes into the phone's outbox first (outbox.ts) and shows
// "Waiting to send" until the server has it, so a lost signal loses nothing.

export function TechnicianApp({ s, refresh, signOut, keptAt }: { s: Glove; refresh: () => Promise<void>; signOut: () => void; keptAt: string | null }) {
  const box = useOutbox(refresh, s.actor.id)
  const [open, setOpen] = useState<string | null>(null)
  const me = s.technicians.find(t => t.operatorId === s.actor.id)
  const zone = recordZone(s, me)
  const mine = s.visits.filter(v => me && v.technicianId === me.id && (['booked', 'arrived'].includes(v.status) || v.status === 'completed' && me.fieldInvoicing?.enabled && me.fieldInvoicing.operatorId === s.actor.id)).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const visit = byId(s.visits, open)
  const waiting = box.items.filter(i => !i.refused)
  // FIELD-004, FIELD-009, FIELD-010: a tapped notification opens /app?job=<id> on that job's visit.
  useEffect(() => {
    const jobId = new URLSearchParams(window.location.search).get('job')
    if (!jobId) return
    const hit = mine.find(v => v.jobId === jobId)
    if (hit) setOpen(hit.id)
    window.history.replaceState(null, '', '/app')
  }, [])
  // FIELD-001: keep the app shell and this technician's photos for a reload with no signal.
  useEffect(() => { if (!keptAt) void keepShell(s.captures.filter(x => x.kind === 'photo' && x.file?.fileId).map(x => `/api/glove/files/${x.file.fileId}`)) }, [s.version, keptAt])
  return <div className="tech-app">
    <header className="tech-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setOpen(null) }}><img className="brand-mark" src="/brand/mark.svg" alt="" width="30" height="30" /><span data-rer-name>Glove</span></a><div className="profile"><span className="avatar" aria-hidden="true">{s.actor.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}</span><span>{s.actor.name}</span><button onClick={signOut}>Sign out</button></div></header>
    <main className="tech-main">
      {keptAt && <p className="banner kept" role="status">No signal: showing your day as of {new Date(keptAt).toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' })}. Everything you record waits on this phone and sends once you reconnect.</p>}
      {(waiting.length > 0 || !box.online) && <aside className="banner" role="status"><span className="bubble"><Glyph name={box.online ? 'refresh' : 'signalOff'} /></span><div>
        <p><strong>{box.online ? `Sending ${waiting.length} item${waiting.length === 1 ? '' : 's'}…` : `Offline — ${waiting.length} item${waiting.length === 1 ? '' : 's'} waiting to send.`}</strong></p>
        <p className="explanation">They are kept on this phone and send when you reconnect.</p>
        {box.online && waiting.length > 0 && <button onClick={() => void box.flush()}>Send now</button>}
      </div></aside>}
      {box.storageError && <p className="problem" role="alert">{box.storageError}</p>}
      {box.items.filter(i => i.refused).map(i => <div key={i.commandId} className="problem" role="alert"><strong>Not accepted: {i.label}</strong><p>{i.refused!.message}</p><button onClick={() => box.dismiss(i.commandId)}>Dismiss</button></div>)}
      {!me && <Empty title="Your sign-in is not linked to a technician yet">Ask the dispatcher to link it on the Team page.</Empty>}
      {s.actor.role === 'technician' && <><PhoneLocation s={s} queued={box.items} online={box.online} /><PhonePortrait s={s} refresh={refresh} online={box.online} /></>}
      {visit ? <Visit key={visit.id} s={s} visit={visit} online={box.online && !keptAt} queue={box.queue} queued={box.items.filter(i => i.payload.visitId === visit.id)} all={box.items} keptAt={keptAt} back={() => setOpen(null)} refresh={refresh} /> : me && <>{can(s.actor, 'clock.in') && <ClockCard s={s} techId={me.id} queue={box.queue} queued={box.items} />}{s.actor.role === 'technician' && <><PhoneVan s={s} /><PhonePush s={s} /></>}<section className="card">
        <h1 className="tech-title">Your visits</h1>
        {!mine.length ? <Empty title="No visits booked for you">New bookings appear here.</Empty> : <ul className="visit-list">{mine.map(v => { const job = byId(s.jobs, v.jobId), site = byId(s.sites, job?.siteId); return <li key={v.id}><button onClick={() => setOpen(v.id)}>
          <strong>{job?.number} · {job?.title}</strong><span>{site?.address}</span><span>{v.local.date === today(recordZone(s, v)) ? 'Today' : dateLabel(v.local.date, 'short')} {timeRange(v.local.start, v.local.end)}{v.arrival ? ' · arrived' : ''}</span>
        </button></li> })}</ul>}
      </section></>}
    </main>
  </div>
}

type QueueFn = (type: string, payload: Record<string, any>, label: string) => void

function Visit({ s, visit, online, queue, queued, all, keptAt, back, refresh }: { s: Glove; visit: Rec; online: boolean; queue: QueueFn; queued: Queued[]; all: Queued[]; keptAt: string | null; back: () => void; refresh: () => Promise<void> }) {
  const zone = recordZone(s, visit)
  const job = byId(s.jobs, visit.jobId), site = byId(s.sites, job?.siteId), customer = byId(s.customers, job?.customerId)
  const me = s.technicians.find(t => t.operatorId === s.actor.id)
  const captures = s.captures.filter(x => x.jobId === visit.jobId)
  const waitingArrival = queued.some(q => q.type === 'visit.arrive')
  const [note, setNote] = useState('')
  const [material, setMaterial] = useState({ serviceId: '', description: '', quantity: '1', unit: '' })
  const [completing, setCompleting] = useState(false)
  const capture = (payload: Record<string, any>, label: string) => queue('visit.capture', { visitId: visit.id, ...payload }, label)
  const result = (itemId: string) => captures.find(x => x.kind === 'checklist' && x.itemId === itemId)?.result ?? queued.find(q => q.payload.itemId === itemId)?.payload.result
  const photos = captures.filter(x => x.kind === 'photo'), pendingPhotos = queued.filter(q => q.payload.kind === 'photo')
  const materials = captures.filter(x => x.kind === 'material'), pendingMaterials = queued.filter(q => q.payload.kind === 'material')
  const notes = captures.filter(x => x.kind === 'note'), pendingNotes = queued.filter(q => q.payload.kind === 'note')
  return <>
    <button className="back" onClick={back}>‹ Your visits</button>
    <section className="card job" aria-labelledby="visit-title">
      <h1 id="visit-title">{job?.number} · {job?.title}</h1>
      <div className="details">
        <p className="detail"><Glyph name="pin" /><span>{site?.address}</span></p>
        <p className="detail"><Glyph name="calendar" /><span>{visit.local.date === today(zone) ? 'Today' : dateLabel(visit.local.date, 'short')} {timeRange(visit.local.start, visit.local.end)} · {zone}{visit.arrivalWindow ? ` · arrival window ${timeRange(visit.arrivalWindow.start, visit.arrivalWindow.end)}` : ''}</span></p>
        <p className="detail"><Glyph name="building" /><span>{customer?.name}{customer?.phone && <> · <span className="nowrap">{customer.phone}</span></>}</span></p>
        {site?.accessNotes && <p className="detail"><Glyph name="note" /><span>{site.accessNotes}</span></p>}
      </div>
      {/* FIELD-004: tap-to-call the customer. */}
      <div className="actions">
        {customer?.phone && <a className="button" href={`tel:${String(customer.phone).replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')}`}>Call customer</a>}
      </div>
      {/* DISP-002: directions to the site's address in the technician's own navigation app. */}
      <PhoneOnMyWay s={s} visit={visit} online={online} refresh={refresh} />
      {site?.address && <div className="directions" role="group" aria-label="Directions to the site"><span>Directions</span>
        <a className="button" href={`https://maps.apple.com/?daddr=${encodeURIComponent(site.address)}&dirflg=d`} target="_blank" rel="noreferrer">Apple Maps</a>
        <a className="button" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address)}&travelmode=driving`} target="_blank" rel="noreferrer">Google Maps</a>
        <a className="button" href={`https://waze.com/ul?q=${encodeURIComponent(site.address)}&navigate=yes`} target="_blank" rel="noreferrer">Waze</a>
      </div>}
      {!visit.arrival && !waitingArrival && <button className="arrival" onClick={() => queue('visit.arrive', { visitId: visit.id }, 'Arrival')}>Record arrival</button>}
      <p className="arrival-status"><Glyph name={visit.arrival ? 'checkCircle' : 'clock'} />{visit.arrival ? `Arrival recorded at ${new Date(visit.arrival.deviceTime).toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' })}` : waitingArrival ? 'Arrival recorded on this phone — waiting to send' : 'Arrival not recorded yet'}</p>
    </section>
    {me && can(s.actor, 'timer.start') && <VisitTimers s={s} visit={visit} techId={me.id} queue={queue} queued={all} />}
    {job && job.checklist.length > 0 && <section className="card checklist" aria-labelledby="checklist-title">
      <h2 id="checklist-title" className="section-title">Checklist</h2>
      {job.checklist.map((item: Rec) => { const r = result(item.id), pending = queued.some(q => q.payload.itemId === item.id); return <div className="check-row" key={item.id}>
        <input className="checkmark" type="checkbox" id={`check-${item.id}`} checked={!!r} disabled={!!r} onChange={() => capture({ kind: 'checklist', itemId: item.id, result: 'done' }, item.label)} />
        <div className="check-content"><label htmlFor={`check-${item.id}`}>{item.label}</label>
          <span className={`pill ${pending ? 'waiting-pill' : r ? 'done' : item.required ? 'required' : 'todo'}`}>{!pending && r === 'done' && <Glyph name="check" />}{pending ? 'Waiting to send' : r === 'not applicable' ? 'N/A' : r ? 'Done' : item.required ? 'Required' : 'To do'}</span>
          {!r && <button className="na" onClick={() => { const reason = window.prompt(`Why is "${item.label}" not applicable?`); if (reason?.trim()) capture({ kind: 'checklist', itemId: item.id, result: 'not applicable', note: reason.trim() }, item.label) }}>N/A</button>}
        </div>
      </div> })}
    </section>}
    {job && <PhoneForms s={s} job={job} visit={visit} queue={queue} queued={queued} />}
    {job && s.actor.role === 'technician' && <PhoneAddedWork s={s} job={job} visit={visit} queue={queue} queued={queued} />}
    {site && can(s.actor, 'equipment.save') && <PhoneEquipment s={s} visit={visit} siteId={site.id} queue={queue} queued={queued} />}
    {site && can(s.actor, 'nameplate.read') && <PhoneNameplate s={s} visit={visit} siteId={site.id} refresh={refresh} />}
    {job && s.diagnoses.some(d => d.jobId === job.id) && <section className="card" aria-labelledby="callback-title"><h2 id="callback-title" className="section-title">Callback checklist</h2>{s.diagnoses.filter(d => d.jobId === job.id).map(d => <Diagnosis key={d.id} d={d} />)}</section>}
    <section className="card notes" aria-labelledby="notes-title">
      <h2 id="notes-title" className="section-title">Notes</h2>
      {notes.map(n => <p key={n.id} className="note">{n.text}</p>)}
      {pendingNotes.map(n => <p key={n.commandId} className="note waiting-text">{n.payload.text} · waiting to send</p>)}
      <textarea aria-label="Note" placeholder="Add notes about the job, access, or anything else…" value={note} onChange={e => setNote(e.target.value)} />
      <button disabled={!note.trim()} onClick={() => { capture({ kind: 'note', text: note.trim() }, 'Note'); setNote('') }}>Add note</button>
    </section>
    <section className="card photos" aria-labelledby="photos-title">
      <div className="section-title"><h2 id="photos-title">Photos</h2><span className="photo-count">{photos.length + pendingPhotos.length}</span></div>
      <div className="photo-grid">
        {photos.map(p => <figure className="photo" key={p.id}><img src={`/api/glove/files/${p.file.fileId}`} alt={p.caption || 'Site photo'} /></figure>)}
        {pendingPhotos.map(p => <figure className="photo" key={p.commandId}><img src={`data:${p.payload.photo.mediaType};base64,${p.payload.photo.base64}`} alt={p.payload.caption || 'Site photo waiting to send'} /><figcaption className="waiting">Waiting to send</figcaption></figure>)}
      </div>
      <label className="button photo-add"><Glyph name="plus" />Add photo<input className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={async e => { const file = e.target.files?.[0]; if (file) { capture({ kind: 'photo', caption: '', photo: await shrink(file) }, 'Photo'); e.target.value = '' } }} /></label>
    </section>
    {can(s.actor, 'expense.record') && <PhoneExpenses s={s} visit={visit} queue={queue} queued={queued} />}
    <section className="card materials" aria-labelledby="materials-title">
      <h2 id="materials-title" className="section-title">Materials used</h2>
      <div className="material-list">
        {materials.map(m => <div className="material-row" key={m.id}>{m.description} · {m.quantity} {m.unit}</div>)}
        {pendingMaterials.map(m => <div className="material-row" key={m.commandId}>{m.label} · waiting to send</div>)}
        {!materials.length && !pendingMaterials.length && <div className="material-row muted">None recorded</div>}
      </div>
      <form className="material-form" onSubmit={e => { e.preventDefault(); const service = byId(s.services, material.serviceId); capture({ kind: 'material', serviceId: material.serviceId || undefined, description: material.description || service?.name, quantity: material.quantity, unit: material.unit || service?.unit }, `${material.description || service?.name} × ${material.quantity}`); setMaterial({ serviceId: '', description: '', quantity: '1', unit: '' }) }}>
        <Field label="Item">{p => <select {...p} value={material.serviceId} onChange={e => setMaterial({ ...material, serviceId: e.target.value })}><option value="">Something else</option>{s.services.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}</Field>
        {!material.serviceId && <Field label="Describe it">{p => <input {...p} value={material.description} onChange={e => setMaterial({ ...material, description: e.target.value })} required />}</Field>}
        <Field label="Quantity">{p => <input {...p} inputMode="decimal" value={material.quantity} onChange={e => setMaterial({ ...material, quantity: e.target.value })} required />}</Field>
        <button type="submit">Add material</button>
      </form>
    </section>
    {s.actor.role === 'technician' && <PhoneInvoice s={s} visit={visit} queued={queued} queue={queue} keptAt={keptAt} />}
    {visit.status === 'completed' ? <p role="status">Visit completed</p> : completing ? <Completion visit={visit} job={job!} queue={queue} close={() => setCompleting(false)} /> : <button className="complete" disabled={!visit.arrival && !waitingArrival} onClick={() => setCompleting(true)}>Complete visit</button>}
    {!visit.arrival && !waitingArrival && <p className="muted center">Record your arrival first; completion needs it.</p>}
  </>
}

function Completion({ visit, job, queue, close }: { visit: Rec; job: Rec; queue: QueueFn; close: () => void }) {
  const [summary, setSummary] = useState('')
  const [findings, setFindings] = useState(''), [recommendations, setRecommendations] = useState('')
  const [present, setPresent] = useState(true)
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [jobComplete, setJobComplete] = useState(true)
  const pad = useRef<HTMLCanvasElement>(null)
  const [signed, setSigned] = useState(false)
  useEffect(() => {
    const canvas = pad.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1D1B18'
    let drawing = false
    const at = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height] }
    const down = (e: PointerEvent) => { drawing = true; canvas.setPointerCapture(e.pointerId); const [x, y] = at(e); ctx.beginPath(); ctx.moveTo(x, y) }
    const move = (e: PointerEvent) => { if (!drawing) return; const [x, y] = at(e); ctx.lineTo(x, y); ctx.stroke(); setSigned(true) }
    const up = () => { drawing = false }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up)
    return () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up) }
  }, [present])
  return <form className="card completion" onSubmit={e => {
    e.preventDefault()
    const signoff = present ? { customerName: name, signature: { mediaType: 'image/png', base64: pad.current!.toDataURL('image/png').split(',')[1] } } : { absentReason: reason }
    queue('visit.complete', { visitId: visit.id, summary, findings, recommendations: recommendations.split('\n').map(title => title.trim()).filter(Boolean).map(title => ({ title })), signoff, jobComplete }, `Completion of ${job.number}`)
    close()
  }}>
    <h2 className="section-title">Complete visit</h2>
    <Field label="Work done">{p => <textarea {...p} value={summary} onChange={e => setSummary(e.target.value)} required />}</Field>
    <Field label="Findings">{p => <textarea {...p} value={findings} onChange={e => setFindings(e.target.value)} maxLength={4000} />}</Field>
    <Field label="Recommendations" hint="One recommendation per line; the office can draft a quote from it.">{p => <textarea {...p} value={recommendations} onChange={e => setRecommendations(e.target.value)} />}</Field>
    <label className="check-line"><input type="checkbox" checked={jobComplete} onChange={e => setJobComplete(e.target.checked)} /> This finishes the job (no return visit needed)</label>
    <label className="check-line"><input type="checkbox" checked={!present} onChange={e => setPresent(!e.target.checked)} /> The customer is not here to sign</label>
    {present ? <>
      <Field label="Customer name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required />}</Field>
      <p className="muted">Customer signature</p>
      <canvas ref={pad} className="signature" width={600} height={200} aria-label="Signature pad: the customer signs here with a finger" />
      <button type="button" onClick={() => { const c = pad.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setSigned(false) }}>Clear signature</button>
    </> : <Field label="Why there is no sign-off">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>}
    <div className="actions"><button className="complete" type="submit" disabled={present && !signed}>Save completion</button><button type="button" onClick={close}>Back</button></div>
  </form>
}
