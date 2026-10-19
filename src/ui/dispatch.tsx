import { useEffect, useState, type KeyboardEvent } from 'react'
import { byId, dateLabel, shiftDate, today, type Glove, type Rec, type Run } from './api'
import { Empty, Problem, useAction, type Tone } from './controls'
import { can } from './roles'
import { Glyph } from './glyphs'
import { DayBoard, WeekBoard, MonthBoard, jobTypes, minutes, hhmm, moved, monthDays, shiftMonth, weekStart, type BoardProps, type Drag, type Slot, type View } from './dispatch-board'
import { AgentStrip, BookForm, MoveCard, Proposal, Stops, Waiting, type Proposed } from './dispatch-cards'
import { VisitPanel } from './visit-panel'

// The dispatcher's board (dispatch-board.tsx: day, week and month, drag and
// keyboard moves): the agent's strip across the top, accepted work and
// unscheduled jobs still waiting for a visit on the left, the board in the
// middle, and on the right the selected technician's stops, the selected
// visit, the reason a moved visit needs, the conflict review any booking or
// change must pass, and agent proposals to decide.

type Conflict = { code: string; message: string }
type Pending = { type: string; payload: Record<string, unknown>; conflicts: Conflict[]; label: string }

/** A visit's state on the board: problems first, then where the work stands, then what kind of visit it is. */
function status(s: Glove, v: Rec, clash: boolean): [string, Tone] {
  if (clash) return ['Conflict', 'red']
  if (v.status === 'completed') return ['Completed', 'green']
  if (s.purchaseOrders.some(o => o.jobId === v.jobId && ['draft', 'sent', 'partly received'].includes(o.status))) return ['Part on order', 'red']
  if (v.lateEvidence?.some((x: Rec) => !x.reviewed)) return ['Late evidence', 'gold']
  if (v.status === 'arrived') return ['Arrived', 'green']
  if (byId(s.jobs, v.jobId)?.kind === 'assessment') return ['Assessment', 'blue']
  if (v.series) return ['Plan visit', 'purple']
  return ['Booked', 'green']
}

/** Minutes past midnight now in the business's zone, ticking each minute. */
function useNow(zone: string) {
  const read = () => minutes(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()))
  const [now, setNow] = useState(read)
  useEffect(() => { const timer = window.setInterval(() => setNow(read()), 60000); return () => window.clearInterval(timer) }, [zone])
  return now
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
  const [focusProposal, setFocusProposal] = useState<string | null>(null)
  const review = useAction()
  const clock = useNow(zone), isToday = date === today(zone)
  const day = s.visits.filter(v => v.local.date === date && v.status !== 'cancelled')
  // Inactive technicians still show where they have visits in the shown range.
  const range = view === 'day' ? [date, date] : view === 'week' ? [weekStart(date), shiftDate(weekStart(date), 6)] : [monthDays(date)[0], monthDays(date).at(-1)!]
  const technicians = s.technicians.filter(t => t.active || s.visits.some(v => v.technicianId === t.id && v.status !== 'cancelled' && v.local.date >= range[0] && v.local.date <= range[1]))
  const proposals = s.proposals.filter(p => p.status === 'pending')
  const planned = proposals.filter(p => p.plan.date === date)
  // One column per hour: 7 AM to 6 PM by default, wider when a visit or a proposal falls outside.
  const spans = [...day.map(v => [minutes(v.local.start), minutes(v.local.end)]), ...planned.map(p => [minutes(p.plan.start), minutes(p.plan.end)])]
  const start = Math.min(7 * 60, ...spans.map(([a]) => Math.floor(a / 60) * 60)), end = Math.max(18 * 60, ...spans.map(([, b]) => Math.ceil(b / 60) * 60))
  const hours = Array.from({ length: (end - start) / 60 }, (_, i) => start / 60 + i)
  const clashes = new Set(s.visits.filter(v => v.status !== 'cancelled' && s.visits.some(o => o.id !== v.id && o.status !== 'cancelled' && o.technicianId === v.technicianId && v.startAt < o.endAt && o.startAt < v.endAt)).map(v => v.id))
  const waitingQuotes = s.quotes.filter(q => q.status === 'accepted' && !q.jobId)
  const unbooked = s.jobs.filter(j => j.status === 'open' && !s.visits.some(v => v.jobId === j.id && ['booked', 'arrived'].includes(v.status)))
  const visit = byId(s.visits, selected)
  const canBook = can(s.actor, 'visit.book'), canMove = can(s.actor, 'visit.change')
  const routeTech = byId(s.technicians, visit?.technicianId) ?? technicians.find(t => day.some(v => v.technicianId === t.id))
  const tone = (v: Rec) => status(s, v, clashes.has(v.id))

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
  /** Bring an agent proposal's card into view and focus. */
  function openProposal(id: string) {
    setFocusProposal(id)
    requestAnimationFrame(() => { const card = document.getElementById(`proposal-${id}`); card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card?.focus({ preventScroll: true }) })
  }
  const keyedVisit = keyed && byId(s.visits, keyed.visitId)
  const board: BoardProps = { s, view, date, technicians, colorBy, selected, keyed, select: id => { setSelected(id); setBooking(null) }, drop, keyDown, tone }
  const step = (n: number) => setDate(view === 'day' ? shiftDate(date, n) : view === 'week' ? shiftDate(date, 7 * n) : shiftMonth(date, n))
  const title = view === 'day' ? new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00Z`)) : view === 'week' ? `Week of ${dateLabel(weekStart(date), 'short')}` : new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${date}T00:00:00Z`))
  const types = jobTypes(s)

  return <div className="dispatch-layout">
    <section className="titlebar board-bar">
      <h1 className="visually-hidden">Dispatch</h1>
      <p className="day-title"><strong>{view === 'day' ? isToday ? 'Today' : new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(new Date(`${date}T00:00:00Z`)) : view === 'week' ? 'Week' : 'Month'}</strong> <span>{title}</span></p>
      <div className="date-step">
        <button className="icon-button quiet-icon" aria-label={`Previous ${view}`} onClick={() => step(-1)}><Glyph name="chevronLeft" /></button>
        <button className="icon-button quiet-icon" aria-label={`Next ${view}`} onClick={() => step(1)}><Glyph name="chevronRight" /></button>
        <label className="date-pick"><span className="visually-hidden">Day</span><input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)} /></label>
        {!isToday && <button className="today-button" onClick={() => setDate(today(zone))}>Today</button>}
      </div>
      <div className="date-actions">
        <div className="view-switch" role="group" aria-label="Board view">{(['day', 'week', 'month'] as const).map(v => <button key={v} aria-pressed={view === v} onClick={() => { setView(v); setKeyed(null) }}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
        {canBook && <button className="primary" onClick={() => { setBooking(unbooked[0]?.id ?? ''); setSelected(null) }}><Glyph name="plus" />Book visit</button>}
      </div>
    </section>
    <AgentStrip s={s} proposals={proposals} open={openProposal} />
    <div className="board-grid">
      <Waiting s={s} run={run} quotes={waitingQuotes} jobs={unbooked} book={id => { setBooking(id); setSelected(null) }} />
      <div className="dispatch-main">
        <section className="board-card" aria-label="Board">
          <header className="board-head">
            <h2><Glyph name="people" />{technicians.length} technician{technicians.length === 1 ? '' : 's'}</h2>
            <div className="board-options">
              <label>Color by <select value={colorBy} onChange={e => setColorBy(e.target.value as 'status' | 'type')}><option value="status">Status</option><option value="type">Job type</option></select></label>
              {view === 'month' && <label>Technician <select value={monthTech} onChange={e => setMonthTech(e.target.value)}><option value="">All technicians</option>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
            </div>
            {colorBy === 'type' && <ul className="type-legend" aria-label="Job types">{types.map((t, i) => <li key={t}><span className={`swatch type-${i % 6}`} aria-hidden="true" />{t}</li>)}</ul>}
          </header>
          <p className="visually-hidden" aria-live="polite">{keyed && keyedVisit ? `Moving ${byId(s.jobs, keyedVisit.jobId)?.number} to ${describe(keyed.slot)}. Enter to review, Escape to cancel.` : ''}</p>
          {keyed && keyedVisit && <p className="keyed-note">Moving {byId(s.jobs, keyedVisit.jobId)?.number} to {describe(keyed.slot)} · Enter to review, Escape to cancel</p>}
          {view === 'day' && <section className="schedule" aria-label="Technician schedule" style={{ ['--hours' as string]: hours.length }}>
            {!technicians.length && <Empty title="No technicians yet">Add technicians under Team, then book their visits here.</Empty>}
            <DayBoard {...board} hours={hours} start={start} end={end} now={isToday && clock >= start && clock <= end ? clock : null} proposals={planned} openProposal={openProposal} />
          </section>}
          {view === 'week' && <WeekBoard {...board} />}
          {view === 'month' && <MonthBoard {...board} technicianId={monthTech} />}
        </section>
      </div>
      <aside className="dispatch-side" aria-label="Selected work">
        {proposed && <MoveCard key={proposed.visit.id + proposed.slot.date + proposed.slot.start + proposed.slot.end + proposed.slot.technicianId} proposed={proposed} attempt={attempt} close={() => setProposed(null)} />}
        {pending && <section className="notice conflict" aria-labelledby="conflict-title">
          <span className="notice-symbol" aria-hidden="true"><Glyph name="alert" /></span>
          <h2 id="conflict-title">Dispatch conflict</h2>
          <p>{pending.label}</p>
          <ul>{pending.conflicts.map(c => <li key={c.code}>{c.message}</li>)}</ul>
          <Problem error={review.error} />
          <div className="notice-actions">
            <button className="danger" onClick={() => review.act(run(pending.type, { ...pending.payload, acknowledge: pending.conflicts.map(c => c.code) }), () => { setPending(null); setBooking(null) })}>Review and confirm change</button>
            <button className="keep" onClick={() => { setPending(null); review.setError(null) }}>Keep current booking</button>
          </div>
        </section>}
        {booking !== null && canBook && <BookForm s={s} jobId={booking} date={date} attempt={attempt} close={() => setBooking(null)} />}
        {view === 'day' && routeTech && <Stops s={s} tech={routeTech} date={date} select={id => { setSelected(id); setBooking(null) }} />}
        {visit && <VisitPanel key={visit.id + visit.version} s={s} visit={visit} run={run} attempt={attempt} close={() => setSelected(null)} tone={tone(visit)} now={visit.local.date === today(zone) ? clock : null} />}
        {proposals.map(p => <Proposal key={p.id} s={s} p={p} run={run} attempt={attempt} focused={focusProposal === p.id} />)}
      </aside>
    </div>
  </div>
}
