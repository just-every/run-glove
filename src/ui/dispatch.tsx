import { useState, type KeyboardEvent } from 'react'
import { byId, dateLabel, shiftDate, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { Glyph } from './glyphs'
import { DayBoard, WeekBoard, MonthBoard, jobDrag, jobTypes, minutes, hhmm, moved, monthDays, shiftMonth, weekStart, type BoardProps, type Drag, type Slot, type View } from './dispatch-board'

// The dispatcher's board (dispatch-board.tsx: day, week and month, drag and
// keyboard moves), accepted work and unscheduled jobs still waiting for a
// visit, agent proposals to decide, the reason a moved visit needs, and the
// conflict review any booking or change must pass.

type Conflict = { code: string; message: string }
type Pending = { type: string; payload: Record<string, unknown>; conflicts: Conflict[]; label: string }
type Proposed = { visit: Rec; slot: Slot; label: string }
type Attempt = (type: string, payload: Record<string, unknown>, label: string, done: () => void) => Promise<any>

function status(v: Rec, clash: boolean): [string, 'green' | 'blue' | 'gold' | 'red' | 'grey'] {
  if (clash) return ['Conflict', 'red']
  if (v.status === 'completed') return ['Completed', 'green']
  if (v.status === 'arrived') return ['Arrived', 'blue']
  if (v.lateEvidence?.some((x: Rec) => !x.reviewed)) return ['Late evidence', 'gold']
  return ['Booked', 'green']
}

export function Dispatch({ s, run, date, setDate }: { s: Glove; run: Run; date: string; setDate: (d: string) => void }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const [selected, setSelected] = useState<string | null>(null)
  const [booking, setBooking] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [view, setView] = useState<View>('day')
  const [colorBy, setColorBy] = useState<'status' | 'type'>('status')
  const [monthTech, setMonthTech] = useState('')
  const [proposed, setProposed] = useState<Proposed | null>(null)
  const [keyed, setKeyed] = useState<{ visitId: string; slot: Slot } | null>(null)
  const review = useAction()
  const day = s.visits.filter(v => v.local.date === date && v.status !== 'cancelled')
  // Inactive technicians still show where they have visits in the shown range.
  const range = view === 'day' ? [date, date] : view === 'week' ? [weekStart(date), shiftDate(weekStart(date), 6)] : [monthDays(date)[0], monthDays(date).at(-1)!]
  const technicians = s.technicians.filter(t => t.active || s.visits.some(v => v.technicianId === t.id && v.status !== 'cancelled' && v.local.date >= range[0] && v.local.date <= range[1]))
  // One column per hour, labelled at its start: 7:00 to 17:00 by default, wider when a visit falls outside.
  const start = Math.min(7 * 60, ...day.map(v => Math.floor(minutes(v.local.start) / 60) * 60)), end = Math.max(18 * 60, ...day.map(v => Math.ceil(minutes(v.local.end) / 60) * 60))
  const hours = Array.from({ length: (end - start) / 60 }, (_, i) => start / 60 + i)
  const clashes = new Set(s.visits.filter(v => v.status !== 'cancelled' && s.visits.some(o => o.id !== v.id && o.status !== 'cancelled' && o.technicianId === v.technicianId && v.startAt < o.endAt && o.startAt < v.endAt)).map(v => v.id))
  const waitingQuotes = s.quotes.filter(q => q.status === 'accepted' && !q.jobId)
  const unbooked = s.jobs.filter(j => j.status === 'open' && !s.visits.some(v => v.jobId === j.id && ['booked', 'arrived'].includes(v.status)))
  const proposals = s.proposals.filter(p => p.status === 'pending')
  const visit = byId(s.visits, selected)
  const canBook = can(s.actor, 'visit.book'), canMove = can(s.actor, 'visit.change')

  /** Send a booking or change; a conflict answer opens the review card instead of failing. */
  async function attempt(type: string, payload: Record<string, unknown>, label: string, done: () => void) {
    const outcome = await run(type, payload)
    if (!outcome.ok && outcome.error.code === 'CONFLICT_REVIEW') { setPending({ type, payload, conflicts: outcome.error.details.conflicts, label }); return outcome }
    if (outcome.ok) done()
    return outcome
  }

  const describe = (x: Slot) => `${byId(s.technicians, x.technicianId)?.name}, ${dateLabel(x.date, 'short')} ${x.start}–${x.end}`
  /** A dropped or keyed change waits for its reason (GLOVE-07); a dropped job books at once. */
  function propose(v: Rec, slot: Slot) {
    if (slot.technicianId === v.technicianId && slot.date === v.local.date && slot.start === v.local.start && slot.end === v.local.end) return
    setProposed({ visit: v, slot, label: `${byId(s.jobs, v.jobId)?.number}: ${describe({ technicianId: v.technicianId, date: v.local.date, start: v.local.start, end: v.local.end })} → ${describe(slot)}` })
    setSelected(null); setBooking(null)
  }
  function drop(drag: Drag, at: { technicianId: string | null; date: string; minute: number | null }) {
    if (drag.kind === 'job') {
      const technicianId = at.technicianId ?? s.technicians.find(t => t.active)?.id
      if (!canBook || !technicianId) return
      const begin = at.minute ?? 9 * 60, job = byId(s.jobs, drag.id)
      const slot = { technicianId, date: at.date, start: hhmm(begin), end: hhmm(Math.min(begin + 60, 24 * 60 - 1)) }
      void attempt('visit.book', { jobId: drag.id, ...slot, reason: 'Booked on the dispatch board' }, `Booking ${job?.number} for ${describe(slot)}`, () => {})
      return
    }
    const v = byId(s.visits, drag.id)
    if (!v || !canMove || !['booked', 'arrived'].includes(v.status)) return
    const length = minutes(v.local.end) - minutes(v.local.start)
    if (drag.kind === 'resize') { if (at.minute !== null && at.minute > minutes(v.local.start)) propose(v, { technicianId: v.technicianId, date: v.local.date, start: v.local.start, end: hhmm(Math.min(at.minute, 24 * 60 - 1)) }); return }
    const begin = at.minute ?? minutes(v.local.start)
    if (begin + length >= 24 * 60) return
    propose(v, { technicianId: at.technicianId ?? v.technicianId, date: at.date, start: hhmm(begin), end: hhmm(begin + length) })
  }
  function keyDown(v: Rec, e: KeyboardEvent) {
    if (!canMove || !['booked', 'arrived'].includes(v.status)) return
    if (e.key === 'Escape' && keyed) { e.preventDefault(); setKeyed(null); return }
    if (e.key === 'Enter' && keyed?.visitId === v.id) { e.preventDefault(); propose(v, keyed.slot); setKeyed(null); return }
    const base = keyed?.visitId === v.id ? { ...v, technicianId: keyed.slot.technicianId, local: { date: keyed.slot.date, start: keyed.slot.start, end: keyed.slot.end } } : v
    const next = moved(base, view, e.key, e.shiftKey, technicians.map(t => t.id))
    if (!next && !e.key.startsWith('Arrow')) return
    e.preventDefault()
    if (next) setKeyed({ visitId: v.id, slot: next })
  }
  const keyedVisit = keyed && byId(s.visits, keyed.visitId)
  const board: BoardProps = { s, view, date, technicians, colorBy, selected, keyed, select: id => { setSelected(id); setBooking(null) }, drop, keyDown, tone: v => status(v, clashes.has(v.id)) }
  const step = (n: number) => setDate(view === 'day' ? shiftDate(date, n) : view === 'week' ? shiftDate(date, 7 * n) : shiftMonth(date, n))
  const title = view === 'day' ? dateLabel(date) : view === 'week' ? `Week of ${dateLabel(weekStart(date), 'short')}` : new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${date.slice(0, 7)}-01T00:00:00Z`))
  const types = jobTypes(s)

  return <div className="dispatch-layout">
    <section className="titlebar">
      <div><h1>Dispatch</h1><p className="subtitle">{title} · {zone}</p></div>
      <div className="date-actions">
        <div className="view-switch" role="group" aria-label="Board view">{(['day', 'week', 'month'] as const).map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setKeyed(null) }}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
        <button className="icon-button" aria-label={`Previous ${view}`} onClick={() => step(-1)}><Glyph name="chevronLeft" /></button>
        <label className="date-pick"><span className="visually-hidden">Day</span><input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} /></label>
        <button className="icon-button" aria-label={`Next ${view}`} onClick={() => step(1)}><Glyph name="chevronRight" /></button>
        {canBook && <button className="primary" onClick={() => { setBooking(unbooked[0]?.id ?? ''); setSelected(null) }}>Book visit</button>}
      </div>
    </section>
    <div className="dispatch-main">
      <div className="board-options">
        <label>Color by <select value={colorBy} onChange={e => setColorBy(e.target.value as 'status' | 'type')}><option value="status">Status</option><option value="type">Job type</option></select></label>
        {view === 'month' && <label>Technician <select value={monthTech} onChange={e => setMonthTech(e.target.value)}><option value="">All technicians</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
        {colorBy === 'type' && <ul className="type-legend" aria-label="Job types">{types.map((t, i) => <li key={t}><span className={`swatch type-${i % 6}`} aria-hidden="true" />{t}</li>)}</ul>}
      </div>
      <p className="visually-hidden" aria-live="polite">{keyed && keyedVisit ? `Moving ${byId(s.jobs, keyedVisit.jobId)?.number} to ${describe(keyed.slot)}. Enter to review, Escape to cancel.` : ''}</p>
      {keyed && keyedVisit && <p className="keyed-note">Moving {byId(s.jobs, keyedVisit.jobId)?.number} to {describe(keyed.slot)} · Enter to review, Escape to cancel</p>}
      {view === 'day' && <section className="schedule" aria-label="Technician schedule" style={{ ['--hours' as string]: hours.length }}>
        <div className="timehead"><strong>Technician</strong><div className="hours">{hours.map(h => <span key={h}>{h}:00</span>)}</div></div>
        {!technicians.length && <Empty title="No technicians yet">Add technicians under More → Team, then book their visits here.</Empty>}
        <DayBoard {...board} hours={hours} start={start} end={end} clashes={clashes} />
      </section>}
      {view === 'week' && <WeekBoard {...board} />}
      {view === 'month' && <MonthBoard {...board} technicianId={monthTech} />}
      {visit && <VisitPanel key={visit.id + visit.version} s={s} visit={visit} run={run} attempt={attempt} close={() => setSelected(null)} />}
      {booking !== null && canBook && <BookForm s={s} jobId={booking} date={date} attempt={attempt} close={() => setBooking(null)} />}
    </div>
    <aside className="dispatch-side" aria-label="Waiting work">
      {proposed && <MoveCard key={proposed.visit.id + proposed.slot.date + proposed.slot.start + proposed.slot.end + proposed.slot.technicianId} proposed={proposed} attempt={attempt} close={() => setProposed(null)} />}
      {pending && <section className="notice conflict" aria-labelledby="conflict-title">
        <span className="notice-symbol" aria-hidden="true">!</span>
        <h2 id="conflict-title">Dispatch conflict</h2>
        <p>{pending.label}</p>
        <ul>{pending.conflicts.map(c => <li key={c.code}>{c.message}</li>)}</ul>
        <Problem error={review.error} />
        <div className="notice-actions">
          <button className="danger" onClick={() => review.act(run(pending.type, { ...pending.payload, acknowledge: pending.conflicts.map(c => c.code) }), () => { setPending(null); setBooking(null) })}>Review and confirm change</button>
          <button className="keep" onClick={() => { setPending(null); review.setError(null) }}>Keep current booking</button>
        </div>
      </section>}
      <section className="waiting">
        <h2>Waiting to book <span className="count">{waitingQuotes.length + unbooked.length}</span></h2>
        <p className="muted">Accepted quotes and open jobs without a visit</p>
        {!waitingQuotes.length && !unbooked.length && <Empty title="Nothing waiting">Accepted quotes appear here until they are booked.</Empty>}
        <ul className="queue">
          {waitingQuotes.map(q => <WaitingQuote key={q.id} s={s} quote={q} run={run} />)}
          {unbooked.map(j => { const c = byId(s.customers, j.customerId), site = byId(s.sites, j.siteId); return <li key={j.id} {...(canBook ? jobDrag(j.id) : {})} aria-label={`${j.number} ${j.title}, unscheduled`}>
            <div className="quote-top"><strong>{j.number} · {c?.name}</strong>{j.totals && <span>{money(j.totals.total)}</span>}</div>
            <div className="quote-location"><span>{site?.address}</span>{j.totals && <span>incl. tax</span>}</div>
            <p className="accepted">{j.quoteId ? 'Job created from the accepted quote' : j.serviceCall ? 'Service call without a quote' : 'Moved in from ServiceM8'}; no visit booked{canBook ? ' · drag onto a technician to book' : ''}</p>
            {canBook && <button className="link-button" onClick={() => { setBooking(j.id); setSelected(null) }}>Book a visit<Glyph name="arrow" /></button>}
          </li> })}
        </ul>
      </section>
      {proposals.map(p => <Proposal key={p.id} s={s} p={p} run={run} attempt={attempt} />)}
    </aside>
  </div>
}

/** A dragged or keyed move: the reason every change keeps (GLOVE-07), then the conflict review if any. */
function MoveCard({ proposed, attempt, close }: { proposed: Proposed; attempt: Attempt; close: () => void }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<any>(null)
  const { visit, slot } = proposed
  return <section className="notice prepared" aria-labelledby="move-title">
    <h2 id="move-title">Move visit</h2>
    <p>{proposed.label}</p>
    <form onSubmit={async e => { e.preventDefault(); const o = await attempt('visit.change', { visitId: visit.id, version: visit.version, ...slot, reason }, `Moving ${proposed.label}`, close); if (!o.ok && o.error.code === 'CONFLICT_REVIEW') close(); else setError(o.ok ? null : o.error) }}>
      <Field label="Reason for the move">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>
      <Problem error={error} />
      <div className="notice-actions"><button className="primary" type="submit">Move visit</button><button type="button" onClick={close}>Keep it where it is</button></div>
    </form>
  </section>
}

function WaitingQuote({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const { error, act } = useAction()
  const c = byId(s.customers, quote.customerId), site = byId(s.sites, quote.siteId), rev = quote.revisions.find((r: Rec) => r.n === quote.acceptance.revision)
  return <li>
    <div className="quote-top"><strong>{c?.name}</strong><span>{money((quote.acceptance.totals ?? rev.totals).total)}</span></div>
    <div className="quote-location"><span>{site?.address}</span><span>incl. tax</span></div>
    <p className="accepted">Accepted {new Date(quote.acceptance.at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} by {quote.acceptance.method}, recorded by {quote.acceptance.recordedBy.name}</p>
    {can(s.actor, 'job.create') && s.actor.role !== 'office' && <button className="link-button" onClick={() => act(run('job.create', { quoteId: quote.id }))}>Create job<Glyph name="arrow" /></button>}
    <Problem error={error} />
  </li>
}

function Proposal({ s, p, run, attempt }: { s: Glove; p: Rec; run: Run; attempt: (type: string, payload: Record<string, unknown>, label: string, done: () => void) => Promise<unknown> }) {
  const [reason, setReason] = useState('')
  const { error, act } = useAction()
  const job = byId(s.jobs, p.jobId), tech = byId(s.technicians, p.plan.technicianId)
  const decide = can(s.actor, 'proposal.approve')
  return <section className="notice prepared" aria-label="Agent-prepared dispatch proposal">
    <span className="notice-symbol" aria-hidden="true">◷</span>
    <h2>{p.preparedBy.role === 'agent' ? 'Agent prepared' : `Prepared by ${p.preparedBy.name}`}</h2>
    <p>Dispatch proposal: {job?.number} → {tech?.name}, {dateLabel(p.plan.date, 'short')} {p.plan.start} – {p.plan.end}. Waiting for your approval.</p>
    <p className="muted">{p.rationale}</p>
    {p.evidence.length > 0 && <ul className="evidence">{p.evidence.map((e: string) => <li key={e}>{e}</li>)}</ul>}
    {decide ? <>
      <div className="notice-actions">
        <button className="primary" onClick={() => attempt('proposal.approve', { proposalId: p.id, version: p.version }, `Approving ${p.preparedBy.name}'s proposal for ${job?.number}`, () => {})}>Approve</button>
        <button onClick={() => act(run('proposal.decline', { proposalId: p.id, version: p.version, reason }))} disabled={!reason.trim()}>Decline</button>
      </div>
      <Field label="Reason to decline">{props => <input {...props} value={reason} onChange={e => setReason(e.target.value)} />}</Field>
      <Problem error={error} />
    </> : <p className="muted">A dispatcher or the owner decides.</p>}
  </section>
}

function BookForm({ s, jobId, date, attempt, close }: { s: Glove; jobId: string; date: string; attempt: Attempt; close: () => void }) {
  const open = s.jobs.filter(j => j.status === 'open')
  const [form, setForm] = useState({ jobId: jobId || open[0]?.id || '', technicianId: s.technicians.find(t => t.active)?.id ?? '', date, start: '09:00', end: '10:30', reason: '' })
  const [error, setError] = useState<any>(null)
  const set = (key: string) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  if (!open.length) return <section className="panel"><h2>Book a visit</h2><Empty title="No open jobs">Create a job from an accepted quote first.</Empty><button onClick={close}>Close</button></section>
  return <form className="panel" onSubmit={async e => { e.preventDefault(); const job = byId(s.jobs, form.jobId); const o = await attempt('visit.book', form, `Booking ${job?.number} for ${byId(s.technicians, form.technicianId)?.name} ${form.start}–${form.end}`, close); setError(o.ok || o.error.code === 'CONFLICT_REVIEW' ? null : o.error) }}>
    <h2>Book a visit</h2>
    <div className="form-grid">
      <Field label="Job">{p => <select {...p} value={form.jobId} onChange={set('jobId')}>{open.map(j => <option key={j.id} value={j.id}>{j.number} · {j.title} · {byId(s.customers, j.customerId)?.name}</option>)}</select>}</Field>
      <Field label="Technician">{p => <select {...p} value={form.technicianId} onChange={set('technicianId')}>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
      <Field label="Date">{p => <input {...p} type="date" value={form.date} onChange={set('date')} required />}</Field>
      <Field label="Starts">{p => <input {...p} type="time" value={form.start} onChange={set('start')} required />}</Field>
      <Field label="Ends">{p => <input {...p} type="time" value={form.end} onChange={set('end')} required />}</Field>
      <Field label="Note for the record (optional)">{p => <input {...p} value={form.reason} onChange={set('reason')} />}</Field>
    </div>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Book visit</button><button type="button" onClick={close}>Cancel</button></div>
  </form>
}

function VisitPanel({ s, visit, run, attempt, close }: { s: Glove; visit: Rec; run: Run; attempt: Attempt; close: () => void }) {
  const zone = s.business[0]?.timezone
  const job = byId(s.jobs, visit.jobId), site = byId(s.sites, job?.siteId), customer = byId(s.customers, job?.customerId)
  const [form, setForm] = useState({ technicianId: visit.technicianId, date: visit.local.date, start: visit.local.start, end: visit.local.end, reason: '' })
  const [error, setError] = useState<any>(null)
  const late = visit.lateEvidence.filter((x: Rec) => !x.reviewed)
  const captures = s.captures.filter(x => x.visitId === visit.id)
  const editable = can(s.actor, 'visit.change') && ['booked', 'arrived'].includes(visit.status)
  const set = (key: string) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const lateReview = useAction(), cancel = useAction()
  return <section className="panel visit-panel" aria-labelledby="visit-title">
    <div className="panel-head"><h2 id="visit-title">{job?.number} · {job?.title}</h2><button onClick={close} aria-label="Close visit">Close</button></div>
    <p>{customer?.name} · {site?.address} · {byId(s.technicians, visit.technicianId)?.name} · {dateLabel(visit.local.date, 'short')} {visit.local.start}–{visit.local.end}{visit.assignments.length > 1 ? ` · changed ${visit.assignments.length - 1} time${visit.assignments.length > 2 ? 's' : ''}` : ''}</p>
    <p className="muted">{visit.arrival ? `Arrival recorded by ${byId(s.technicians, visit.arrival.technicianId)?.name} (phone time ${new Date(visit.arrival.deviceTime).toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' })})` : 'Arrival not recorded'} · {captures.filter(x => x.kind !== 'arrival').length} field items</p>
    {late.length > 0 && <div className="problem late"><strong>{late.length} field item{late.length === 1 ? '' : 's'} arrived after this visit changed.</strong><p>{late.map((x: Rec) => `${x.kind} from ${byId(s.technicians, x.technicianId)?.name}`).join(', ')}</p>
      {can(s.actor, 'visit.reviewLateEvidence') && <button onClick={() => lateReview.act(run('visit.reviewLateEvidence', { visitId: visit.id, version: visit.version, note: 'Reviewed on the dispatch board' }))}>Mark reviewed</button>}<Problem error={lateReview.error} /></div>}
    {editable && <form onSubmit={async e => { e.preventDefault(); const o = await attempt('visit.change', { visitId: visit.id, version: visit.version, ...form }, `Moving ${job?.number} to ${byId(s.technicians, form.technicianId)?.name} at ${form.start}`, close); setError(o.ok || o.error.code === 'CONFLICT_REVIEW' ? null : o.error) }}>
      <h3>Change this visit</h3>
      <div className="form-grid">
        <Field label="Technician">{p => <select {...p} value={form.technicianId} onChange={set('technicianId')}>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Date">{p => <input {...p} type="date" value={form.date} onChange={set('date')} />}</Field>
        <Field label="Starts">{p => <input {...p} type="time" value={form.start} onChange={set('start')} />}</Field>
        <Field label="Ends">{p => <input {...p} type="time" value={form.end} onChange={set('end')} />}</Field>
        <Field label="Reason for the change">{p => <input {...p} value={form.reason} onChange={set('reason')} required />}</Field>
      </div>
      <Problem error={error} />
      <div className="actions"><button className="primary" type="submit">Save change</button>{visit.status === 'booked' && <button type="button" onClick={() => cancel.act(run('visit.cancel', { visitId: visit.id, version: visit.version, reason: form.reason || 'Cancelled from the dispatch board' }), close)}>Cancel visit</button>}</div>
      <Problem error={cancel.error} />
    </form>}
  </section>
}
