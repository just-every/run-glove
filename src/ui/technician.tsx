import { useEffect, useRef, useState } from 'react'
import { byId, dateLabel, today, type Glove, type Rec } from './api'
import { Empty, Field } from './controls'
import { useOutbox, type Queued } from './outbox'
import { Glyph } from './glyphs'
import { PhoneEquipment } from './equipment'
import { shrink } from './photos'

// The technician's phone: their visits, and on a visit everything they record.
// Each record goes into the phone's outbox first (outbox.ts) and shows
// "Waiting to send" until the server has it, so a lost signal loses nothing.

export function TechnicianApp({ s, refresh, signOut }: { s: Glove; refresh: () => Promise<void>; signOut: () => void }) {
  const box = useOutbox(refresh)
  const [open, setOpen] = useState<string | null>(null)
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const me = s.technicians.find(t => t.operatorId === s.actor.id)
  const mine = s.visits.filter(v => me && v.technicianId === me.id && ['booked', 'arrived'].includes(v.status)).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const visit = byId(s.visits, open)
  const waiting = box.items.filter(i => !i.refused)
  return <div className="tech-app">
    <header className="tech-header"><a className="brand" href="#" onClick={e => { e.preventDefault(); setOpen(null) }}><span className="brand-mark" aria-hidden="true" /><span data-rer-name>Glove</span></a><div className="profile"><span className="avatar" aria-hidden="true">{s.actor.name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()}</span><span>{s.actor.name}</span><button onClick={signOut}>Sign out</button></div></header>
    <main className="tech-main">
      {(waiting.length > 0 || !box.online) && <aside className="banner" role="status"><span className="bubble"><Glyph name={box.online ? 'refresh' : 'signalOff'} /></span><div>
        <p><strong>{box.online ? `Sending ${waiting.length} item${waiting.length === 1 ? '' : 's'}…` : `Offline — ${waiting.length} item${waiting.length === 1 ? '' : 's'} waiting to send.`}</strong></p>
        <p className="explanation">They are kept on this phone and send when you reconnect.</p>
        {box.online && waiting.length > 0 && <button onClick={() => void box.flush()}>Send now</button>}
      </div></aside>}
      {box.storageError && <p className="problem" role="alert">{box.storageError}</p>}
      {box.items.filter(i => i.refused).map(i => <div key={i.commandId} className="problem" role="alert"><strong>Not accepted: {i.label}</strong><p>{i.refused!.message}</p><button onClick={() => box.dismiss(i.commandId)}>Dismiss</button></div>)}
      {!me && <Empty title="Your sign-in is not linked to a technician yet">Ask the dispatcher to link it on the Team page.</Empty>}
      {visit ? <Visit key={visit.id} s={s} visit={visit} queue={box.queue} queued={box.items.filter(i => i.payload.visitId === visit.id)} back={() => setOpen(null)} /> : me && <section className="card">
        <h1 className="tech-title">Your visits</h1>
        {!mine.length ? <Empty title="No visits booked for you">New bookings appear here.</Empty> : <ul className="visit-list">{mine.map(v => { const job = byId(s.jobs, v.jobId), site = byId(s.sites, job?.siteId); return <li key={v.id}><button onClick={() => setOpen(v.id)}>
          <strong>{job?.number} · {job?.title}</strong><span>{site?.address}</span><span>{v.local.date === today(zone) ? 'Today' : dateLabel(v.local.date, 'short')} {v.local.start}–{v.local.end}{v.arrival ? ' · arrived' : ''}</span>
        </button></li> })}</ul>}
      </section>}
    </main>
  </div>
}

type QueueFn = (type: string, payload: Record<string, any>, label: string) => void

function Visit({ s, visit, queue, queued, back }: { s: Glove; visit: Rec; queue: QueueFn; queued: Queued[]; back: () => void }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const job = byId(s.jobs, visit.jobId), site = byId(s.sites, job?.siteId), customer = byId(s.customers, job?.customerId)
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
        <p className="detail"><Glyph name="calendar" /><span>{visit.local.date === today(zone) ? 'Today' : dateLabel(visit.local.date, 'short')} {visit.local.start}–{visit.local.end}</span></p>
        <p className="detail"><Glyph name="building" /><span>{customer?.name}{customer?.phone && <> · <span className="nowrap">{customer.phone}</span></>}</span></p>
        {site?.accessNotes && <p className="detail"><Glyph name="note" /><span>{site.accessNotes}</span></p>}
      </div>
      {!visit.arrival && !waitingArrival && <button className="arrival" onClick={() => queue('visit.arrive', { visitId: visit.id }, 'Arrival')}>Record arrival</button>}
      <p className="arrival-status"><Glyph name={visit.arrival ? 'checkCircle' : 'clock'} />{visit.arrival ? `Arrival recorded at ${new Date(visit.arrival.deviceTime).toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' })}` : waitingArrival ? 'Arrival recorded on this phone — waiting to send' : 'Arrival not recorded yet'}</p>
    </section>
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
    {site && <PhoneEquipment s={s} visit={visit} siteId={site.id} queue={queue} queued={queued} />}
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
    {completing ? <Completion visit={visit} job={job!} queue={queue} close={() => setCompleting(false)} /> : <button className="complete" disabled={!visit.arrival} onClick={() => setCompleting(true)}>Complete visit</button>}
    {!visit.arrival && <p className="muted center">Record your arrival first; completion needs it.</p>}
  </>
}

function Completion({ visit, job, queue, close }: { visit: Rec; job: Rec; queue: QueueFn; close: () => void }) {
  const [summary, setSummary] = useState('')
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
    queue('visit.complete', { visitId: visit.id, summary, signoff, jobComplete }, `Completion of ${job.number}`)
    close()
  }}>
    <h2 className="section-title">Complete visit</h2>
    <Field label="Work done">{p => <textarea {...p} value={summary} onChange={e => setSummary(e.target.value)} required />}</Field>
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
