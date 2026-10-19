import { useState } from 'react'
import { ampm, byId, dateLabel, shiftDate, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction, type Tone } from './controls'
import { can } from './roles'
import { Glyph } from './glyphs'
import { hhmm, minutes } from './dispatch-board'
import type { Attempt } from './dispatch-cards'
import { AgreedAmount } from './subcontract'

// The selected visit beside the board: who, where and when, what is wrong with
// it (a dispatch conflict, a part still on order, late evidence), and two ready
// changes read off the board's free time: the earliest gap the same day with
// another technician, or the technician's first free slot on their next working
// day. Either, or any time picked by hand, is an ordinary visit.change with its
// reason and conflict review.

type Option = { id: string; title: string; detail: string; technicianId: string; date: string; start: string; end: string }
const DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const first = (name = '') => name.split(/\s+/)[0]

/** The technician's working spans on a date, or 8:00–17:00 on a weekday when no hours are set. */
function spans(t: Rec, date: string): [number, number][] {
  const day = DAY[new Date(`${date}T00:00:00Z`).getUTCDay()]
  if (t.hours?.length) return t.hours.filter((h: Rec) => h.day === day).map((h: Rec) => [minutes(h.start), minutes(h.end)])
  return day === 'sun' || day === 'sat' ? [] : [[8 * 60, 17 * 60]]
}

/** The first start from `from` (in 30-minute steps) where `length` fits the technician's hours and no visit. */
function freeAt(s: Glove, t: Rec, date: string, length: number, from: number, skip: string) {
  // Booked visits and pending proposals both hold the technician's time.
  const busy = [...s.visits.filter(v => v.technicianId === t.id && v.local.date === date && v.status !== 'cancelled' && v.id !== skip).map(v => v.local), ...s.proposals.filter(x => x.status === 'pending' && x.plan.technicianId === t.id && x.plan.date === date).map(x => x.plan)].map(x => [minutes(x.start), minutes(x.end)])
  for (const [a, b] of spans(t, date)) for (let m = Math.max(a, Math.ceil(from / 30) * 30); m + length <= b; m += 30) if (!busy.some(([x, y]) => m < y && x < m + length)) return m
  return null
}

export function options(s: Glove, visit: Rec, now: number | null): Option[] {
  const length = minutes(visit.local.end) - minutes(visit.local.start), date = visit.local.date, out: Option[] = []
  const from = Math.max(minutes(visit.local.start), now ?? 0)
  const others = s.technicians.filter(t => t.active && t.id !== visit.technicianId).map(t => ({ t, at: freeAt(s, t, date, length, from, visit.id) })).filter(x => x.at !== null).sort((a, b) => a.at! - b.at!)
  if (others[0]) { const { t, at } = others[0]; out.push({ id: 'move', title: `Move to ${first(t.name)} at ${ampm(hhmm(at!))}`, detail: `Same day · ${first(t.name)} is free until ${ampm(hhmm(at! + length))}`, technicianId: t.id, date, start: hhmm(at!), end: hhmm(at! + length) }) }
  const tech = byId(s.technicians, visit.technicianId)
  if (tech) for (let d = shiftDate(date, 1), i = 0; i < 14; d = shiftDate(d, 1), i++) {
    const at = freeAt(s, tech, d, length, 0, visit.id)
    if (at !== null) { out.push({ id: 'rebook', title: `Rebook for ${dateLabel(d, 'short')} at ${ampm(hhmm(at))}`, detail: `${first(tech.name)}'s first free slot · same technician`, technicianId: tech.id, date: d, start: hhmm(at), end: hhmm(at + length) }); break }
  }
  return out
}

export function VisitPanel({ s, visit, run, attempt, close, tone, now }: { s: Glove; visit: Rec; run: Run; attempt: Attempt; close: () => void; tone: [string, Tone]; now: number | null }) {
  const zone = visit.local.timezone ?? s.business[0]?.timezone
  const job = byId(s.jobs, visit.jobId), site = byId(s.sites, job?.siteId), customer = byId(s.customers, job?.customerId), tech = byId(s.technicians, visit.technicianId)
  const choices = options(s, visit, now)
  const [pick, setPick] = useState(choices[0]?.id ?? 'custom')
  const [form, setForm] = useState({ technicianId: visit.technicianId, date: visit.local.date, start: visit.local.start, end: visit.local.end, reason: '' })
  const [error, setError] = useState<any>(null)
  const late = visit.lateEvidence.filter((x: Rec) => !x.reviewed)
  const captures = s.captures.filter(x => x.visitId === visit.id)
  const orders = s.purchaseOrders.filter(o => o.jobId === visit.jobId && ['sent', 'partly received', 'draft'].includes(o.status))
  const editable = can(s.actor, 'visit.change') && ['booked', 'arrived'].includes(visit.status)
  const set = (key: string) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const lateReview = useAction(), cancel = useAction()
  const chosen = choices.find(c => c.id === pick), slot = chosen ? { technicianId: chosen.technicianId, date: chosen.date, start: chosen.start, end: chosen.end } : { technicianId: form.technicianId, date: form.date, start: form.start, end: form.end }
  const hours = (minutes(visit.local.end) - minutes(visit.local.start)) / 60
  return <section className={`panel visit-panel tone-${tone[1]}`} aria-labelledby="visit-title">
    <div className="visit-panel-top">
      <span className="part-icon" aria-hidden="true"><Glyph name={tone[0] === 'Part on order' ? 'box' : tone[1] === 'red' ? 'alert' : 'calendar'} /></span>
      <span className="num">{job?.number}</span>
      <span className={`tag tag-${tone[1]}`}>{tone[0]}</span>
      <button className="icon-button" onClick={close} aria-label="Close visit"><Glyph name="close" /></button>
    </div>
    <h2 id="visit-title">{job?.title}</h2>
    <p className="visit-place"><strong>{customer?.name}</strong><br />{site?.address}</p>
    <p className="visit-meta"><span><Glyph name="calendar" />{dateLabel(visit.local.date, 'short')}, {ampm(visit.local.start)}</span><span><Glyph name="clock" />{+hours.toFixed(2)} h</span><span><Glyph name="people" />{tech?.name}</span></p>
    <p className="muted">{visit.arrival ? `Arrival recorded by ${byId(s.technicians, visit.arrival.technicianId)?.name} (phone time ${new Date(visit.arrival.deviceTime).toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' })})` : 'Arrival not recorded'} · {captures.filter(x => x.kind !== 'arrival').length} field items{visit.assignments.length > 1 ? ` · changed ${visit.assignments.length - 1} time${visit.assignments.length > 2 ? 's' : ''}` : ''}</p>
    {orders.map(o => <div key={o.id} className="part-notice"><span className="part-icon" aria-hidden="true"><Glyph name="box" /></span><div>
      <h3>Part on order</h3>
      <p>{o.number} to {o.supplier}: {o.lines.map((l: Rec) => `${l.description} × ${l.quantity}`).join(', ')}</p>
      <p>{o.sent ? `Sent ${new Date(o.sent.at).toLocaleDateString('en-US', { timeZone: zone, month: 'short', day: 'numeric' })} by ${o.sent.method}${o.sent.reference ? ` · ref ${o.sent.reference}` : ''}` : 'Not sent yet'} · {o.status === 'partly received' ? 'partly received' : 'not received'}</p>
    </div></div>)}
    {late.length > 0 && <div className="problem late"><strong>{late.length} field item{late.length === 1 ? '' : 's'} arrived after this visit changed.</strong><p>{late.map((x: Rec) => `${x.kind} from ${byId(s.technicians, x.technicianId)?.name}`).join(', ')}</p>
      {can(s.actor, 'visit.reviewLateEvidence') && <button onClick={() => lateReview.act(run('visit.reviewLateEvidence', { visitId: visit.id, version: visit.version, note: 'Reviewed on the dispatch board' }))}>Mark reviewed</button>}<Problem error={lateReview.error} /></div>}
    <AgreedAmount key={visit.version} s={s} visit={visit} run={run} />
    {editable && <form onSubmit={async e => { e.preventDefault(); const to = byId(s.technicians, slot.technicianId)?.name; const o = await attempt('visit.change', { visitId: visit.id, version: visit.version, ...slot, reason: form.reason }, `Moving ${job?.number} to ${to} at ${ampm(slot.start)}`, close); setError(o.ok || o.error.code === 'CONFLICT_REVIEW' ? null : o.error) }}>
      <fieldset className="options"><legend>Options</legend>
        {choices.map(c => <label key={c.id} className={`option${pick === c.id ? ' chosen' : ''}`}><input type="radio" name="option" checked={pick === c.id} onChange={() => setPick(c.id)} /><span><strong>{c.title}</strong><span className="muted">{c.detail}</span></span></label>)}
        <label className={`option${pick === 'custom' ? ' chosen' : ''}`}><input type="radio" name="option" checked={pick === 'custom'} onChange={() => setPick('custom')} /><span><strong>Pick another time</strong><span className="muted">Any technician, day and hours</span></span></label>
      </fieldset>
      {pick === 'custom' && <div className="form-grid">
        <Field label="Technician">{p => <select {...p} value={form.technicianId} onChange={set('technicianId')}>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Date">{p => <input {...p} type="date" value={form.date} onChange={set('date')} />}</Field>
        <Field label="Starts">{p => <input {...p} type="time" value={form.start} onChange={set('start')} />}</Field>
        <Field label="Ends">{p => <input {...p} type="time" value={form.end} onChange={set('end')} />}</Field>
      </div>}
      <Field label="Reason for the change">{p => <input {...p} value={form.reason} onChange={set('reason')} required />}</Field>
      <Problem error={error} />
      <div className="actions"><button className="primary" type="submit">Apply change</button><button type="button" onClick={close}>Keep on {first(tech?.name)}'s schedule</button></div>
      {visit.status === 'booked' && <button type="button" className="link-button cancel-visit" onClick={() => cancel.act(run('visit.cancel', { visitId: visit.id, version: visit.version, reason: form.reason || 'Cancelled from the dispatch board' }), close)}>Cancel visit</button>}
      <Problem error={cancel.error} />
    </form>}
  </section>
}
