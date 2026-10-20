import { useState } from 'react'
import { today, timeRange, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

/** PLAN-004 uses the existing desk controls and ordinary command runner. */
export function BookingOffers({ s, run, visit }: { s: Glove; run: Run; visit: Rec }) {
  const action = useAction(), [url, setUrl] = useState(''), [notice, setNotice] = useState(''), [method, setMethod] = useState('email')
  const [tech, setTech] = useState(''), [date, setDate] = useState(today(s.business[0]?.timezone ?? 'America/Chicago'))
  const [slots, setSlots] = useState([{ start: '09:00', end: '09:30' }])
  const links = (s.bookingOffers ?? []).filter(o => o.agreementId === visit.agreementId && o.index === visit.index)
  if (!can(s.actor, 'agreement.offer')) return null
  const create = async () => {
    setUrl(''); setNotice('')
    const answer = await action.act(run('agreement.offer', { agreementId: visit.agreementId, index: visit.index, slots: slots.map(slot => ({ ...slot, date, technicianId: tech })) }))
    if (!answer.ok) return
    if (!answer.result.token) { setNotice('The secret is shown once. Create a new offer to copy a link.'); return }
    const value = `${window.location.origin}/book#token=${answer.result.token}`
    setUrl(value)
    try { await navigator.clipboard.writeText(value); setNotice('Booking link copied. Share it outside Glove; it expires in 14 days.') }
    catch { setNotice('Copy the booking link below and share it outside Glove; it expires in 14 days.') }
  }
  return <section aria-label={`Booking offers for ${visit.customer} visit ${visit.index + 1}`} style={{ minWidth: 0 }}>
    {!visit.booked && <details><summary>Offer customer times</summary>
      <form onSubmit={e => { e.preventDefault(); void create() }} aria-label={`Offer times to ${visit.customer}`}>
        <p>Offer open slots for this included visit. The customer chooses one; each choice rechecks the schedule. Glove does not send this link or verify delivery.</p>
        <div className="form-grid">
          <Field label="Offer technician">{p => <select {...p} value={tech} onChange={e => setTech(e.target.value)} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
          <Field label="Offer date">{p => <input {...p} type="date" value={date} onChange={e => setDate(e.target.value)} required />}</Field>
        </div>
        {slots.map((slot, i) => <div key={i} className="form-grid">
          <Field label={`Option ${i + 1} starts`}>{p => <input {...p} type="time" value={slot.start} onChange={e => setSlots(slots.map((x, n) => n === i ? { ...x, start: e.target.value } : x))} required />}</Field>
          <Field label={`Option ${i + 1} ends`}>{p => <input {...p} type="time" value={slot.end} onChange={e => setSlots(slots.map((x, n) => n === i ? { ...x, end: e.target.value } : x))} required />}</Field>
        </div>)}
        <div className="actions">{slots.length < 10 && <button type="button" onClick={() => setSlots([...slots, { start: '10:00', end: '10:30' }])}>Add another time</button>}{slots.length > 1 && <button type="button" onClick={() => setSlots(slots.slice(0, -1))}>Remove last time</button>}<button type="submit">Create booking link</button></div>
      </form>
    </details>}
    {notice && <p role="status">{notice}</p>}
    {url && <Field label="Booking link (shown once)">{p => <input {...p} readOnly value={url} onFocus={e => e.target.select()} />}</Field>}
    <ul className="rows">{links.map(link => <li key={link.id}><div>
      <p>{link.usedAt ? 'Used · booked by customer' : link.revokedAt ? 'Revoked' : Date.parse(link.expiresAt) <= Date.now() ? 'Expired' : 'Active booking offer'} · expires {new Date(link.expiresAt).toLocaleDateString('en-US')}</p>
      <p className="muted">{link.slots.map((slot: Rec) => `${slot.local.date} ${timeRange(slot.local.start, slot.local.end)} ${slot.local.timezone}`).join('; ')}</p>
      <p>{link.sentOutside ? `Recorded as sent outside Glove by ${link.sentOutside.by.name} (${link.sentOutside.method}); delivery not verified.` : 'No outside send recorded; delivery not verified.'}</p>
      {!link.revokedAt && Date.parse(link.expiresAt) > Date.now() && <>
        {can(s.actor, 'agreement.offerSent') && <form onSubmit={e => { e.preventDefault(); void action.act(run('agreement.offerSent', { offerId: link.id, version: link.version, method })) }} aria-label="Record outside send"><Field label="Sent outside Glove by">{p => <input {...p} value={method} onChange={e => setMethod(e.target.value)} required />}</Field><button type="submit">Record as sent outside Glove</button></form>}
        {can(s.actor, 'agreement.offerRevoke') && <button type="button" onClick={() => void action.act(run('agreement.offerRevoke', { offerId: link.id, version: link.version }), () => { setUrl(''); setNotice('Booking link revoked.') })}>Revoke booking link</button>}
      </>}
    </div></li>)}</ul>
    <Problem error={action.error} />
  </section>
}
