import { useLayoutEffect, useRef, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ampm, byId, dateLabel, shiftDate, timeRange, type Glove, type Rec } from './api'
import type { Tone } from './controls'
import { Glyph } from './glyphs'

// The dispatch board's views (DISP-001): a day by technician across the hours,
// a week (Sunday to Saturday) by technician, and a month. Visits drag to
// another time, day or technician, and their right edge drags to a new end;
// an unscheduled job drags onto a technician to book it. Every drag has a
// keyboard path on the focused visit: arrows move it (a quarter hour in the
// day, a day in the week and month; up and down change technician, or week in
// the month), Shift with left or right changes its end, Enter reviews the
// change and Escape drops it. Booking by keyboard is the Book a visit form.

export type View = 'day' | 'week' | 'month'
export type Slot = { technicianId: string; date: string; start: string; end: string }
export type Drag = { kind: 'visit' | 'job' | 'resize'; id: string }
const DRAG = 'application/x-glove-dispatch'

export const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const clampDay = (m: number) => Math.max(0, Math.min(24 * 60 - 15, m))

/** Sunday of the week holding `date` (US weeks). */
export const weekStart = (date: string) => shiftDate(date, -new Date(`${date}T00:00:00Z`).getUTCDay())
export const monthDays = (date: string) => {
  const first = `${date.slice(0, 8)}01`, start = weekStart(first)
  const next = new Date(`${first}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1)
  const last = shiftDate(next.toISOString().slice(0, 10), -1), end = shiftDate(weekStart(last), 6)
  const days: string[] = []
  for (let d = start; d <= end; d = shiftDate(d, 1)) days.push(d)
  return days
}
export const shiftMonth = (date: string, n: number) => { const d = new Date(`${date.slice(0, 8)}01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }

/** The job type is the category of the job's first price-book line, else Uncategorized (as in COST-004's reports). */
export const jobType = (s: Glove, job: Rec | undefined) => { for (const l of job?.lines ?? []) { const item = byId(s.services, l.serviceId); if (item) return item.category || 'Uncategorized' } return 'Uncategorized' }
export const jobTypes = (s: Glove) => [...new Set(s.jobs.map(j => jobType(s, j)))].sort()

/** Where a drag or a key press puts a visit. */
export function moved(v: Rec, view: View, key: string, shift: boolean, techIds: string[]): Slot | null {
  const s = minutes(v.local.start), e = minutes(v.local.end), t = techIds.indexOf(v.technicianId)
  const at = (date: string, start: number, end: number, technicianId = v.technicianId) => ({ technicianId, date, start: hhmm(start), end: hhmm(end) })
  if (shift && view === 'day' && (key === 'ArrowRight' || key === 'ArrowLeft')) { const end = key === 'ArrowRight' ? e + 15 : e - 15; return end > s && end <= 24 * 60 - 1 ? at(v.local.date, s, end) : null }
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    if (view === 'month') return at(shiftDate(v.local.date, key === 'ArrowUp' ? -7 : 7), s, e)
    const next = techIds[t + (key === 'ArrowUp' ? -1 : 1)]
    return next ? at(v.local.date, s, e, next) : null
  }
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null
  const sign = key === 'ArrowLeft' ? -1 : 1
  if (view === 'day') { const start = clampDay(s + sign * 15); return start + e - s < 24 * 60 ? at(v.local.date, start, start + e - s) : null }
  return at(shiftDate(v.local.date, sign), s, e)
}

export type BoardProps = {
  s: Glove; view: View; date: string; technicians: Rec[]; colorBy: 'status' | 'type'; selected: string | null
  /** What the rows are: technicians, or crews (DISP-007). */
  rowLabel: 'Technician' | 'Crew'
  /** A visit being moved with the keyboard: shown where it would go. */
  keyed: { visitId: string; slot: Slot } | null
  select: (id: string) => void
  drop: (drag: Drag, at: { technicianId: string | null; date: string; minute: number | null }) => void
  keyDown: (v: Rec, e: KeyboardEvent) => void
  tone: (v: Rec) => [string, Tone]
}

const startDrag = (drag: Drag) => (e: DragEvent) => { e.stopPropagation(); e.dataTransfer.setData(DRAG, JSON.stringify(drag)); e.dataTransfer.effectAllowed = 'move' }
const read = (e: DragEvent): Drag | null => { try { return JSON.parse(e.dataTransfer.getData(DRAG)) } catch { return null } }
const target = (onDrop: (drag: Drag, e: DragEvent) => void) => ({
  onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes(DRAG)) { e.preventDefault(); e.currentTarget.classList.add('drop-over') } },
  onDragLeave: (e: DragEvent) => e.currentTarget.classList.remove('drop-over'),
  onDrop: (e: DragEvent) => { e.preventDefault(); e.currentTarget.classList.remove('drop-over'); const d = read(e); if (d) onDrop(d, e) },
})
/** An unscheduled job's drag handle props. */
export const jobDrag = (jobId: string) => ({ draggable: true, onDragStart: startDrag({ kind: 'job', id: jobId }) })

function Chip({ p, v, children, className = '', style }: { p: BoardProps; v: Rec; children: ReactNode; className?: string; style?: Record<string, string> }) {
  const job = byId(p.s.jobs, v.jobId), [label, tone] = p.tone(v)
  const types = jobTypes(p.s), color = p.colorBy === 'type' ? `type-${types.indexOf(jobType(p.s, job)) % 6}` : `tone-${tone}`
  const keyed = p.keyed?.visitId === v.id
  return <button draggable onDragStart={startDrag({ kind: 'visit', id: v.id })} onKeyDown={e => p.keyDown(v, e)} onClick={() => p.select(v.id)}
    className={`${className} ${color}${p.selected === v.id ? ' selected' : ''}${keyed ? ' keyed' : ''}`} style={style}
    aria-label={`${job?.number} ${job?.title}, ${byId(p.s.technicians, v.technicianId)?.name}, ${dateLabel(v.local.date, 'short')} ${v.local.start} to ${v.local.end}, ${label}`}>
    {children}
  </button>
}

/** "7 AM", "12 PM": the board's hour labels. */
export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`
const initials = (name: string) => name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
/** The technician's working minutes on a date's weekday (DISP-004 hours), or null when none are set. */
export function workMinutes(t: Rec, date: string) {
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(`${date}T00:00:00Z`).getUTCDay()]
  const spans = (t.hours ?? []).filter((h: Rec) => h.day === day)
  return t.hours?.length ? spans.reduce((n: number, h: Rec) => n + minutes(h.end) - minutes(h.start), 0) : null
}
/** Items in a row take the first lane whose last item has ended, so overlapping ones never cover each other. */
function lanes<T extends { start: number; end: number }>(items: T[]) {
  const ends: number[] = []
  return items.map(item => { let lane = ends.findIndex(e => e <= item.start); if (lane < 0) lane = ends.length; ends[lane] = item.end; return { ...item, lane } })
}

/** `now`: the line's minute when it falls on the board; `clock`: the minute today, for the phone's now mark even before the first hour. */
export type DayProps = BoardProps & { hours: number[]; start: number; end: number; now: number | null; clock: number | null; proposals: Rec[]; openProposal: (id: string) => void }

/** The day by technician. On a desk the hours keep about 112 px each and scroll sideways inside the board card,
 *  opening on now (or the day's first visit); on a phone each technician's visits stack as cards that lead with
 *  their time, with now marked between the visits done and the visits to come. */
export function DayBoard(p: DayProps) {
  const day = p.s.visits.filter(v => v.local.date === p.date && v.status !== 'cancelled')
  const minuteAt = (e: DragEvent) => { const r = e.currentTarget.getBoundingClientRect(); return Math.floor((p.start + (e.clientX - r.left) / r.width * (p.end - p.start)) / 15) * 15 }
  const share = (m: number) => (m - p.start) / (p.end - p.start), at = (m: number) => `${share(m) * 100}%`
  const scroller = useRef<HTMLDivElement>(null)
  const focus = p.now ?? Math.min(p.end, ...day.map(v => minutes(v.local.start)))
  useLayoutEffect(() => {
    const box = scroller.current, row = box?.querySelector<HTMLElement>('.timeline')
    if (!box || !row || box.scrollWidth <= box.clientWidth) return
    // Open on the whole hour before now (or the first visit), its label clear of the technician column.
    box.scrollLeft = Math.max(0, share(Math.max(p.start, Math.floor(focus / 60) * 60 - 60)) * row.offsetWidth - 24)
  }, [p.date, p.start, p.end])
  return <div className="day-scroll" ref={scroller}><div className="day-grid">
    <div className="timehead" aria-hidden="true"><span /><div className="hours">{p.hours.map(h => <span key={h}><em>{hourLabel(h)}</em></span>)}<i className="hours-end"><em>{hourLabel(p.end / 60)}</em></i></div></div>
    {p.now !== null && <div className="now" style={{ ['--at' as string]: String(share(p.now)) }}><span className="now-pill">{ampm(hhmm(p.now))}</span></div>}
    {p.technicians.map(t => {
      const mine = day.filter(v => v.technicianId === t.id).sort((a, b) => a.startAt.localeCompare(b.startAt))
      const booked = mine.reduce((n, v) => n + minutes(v.local.end) - minutes(v.local.start), 0), work = workMinutes(t, p.date)
      const van = p.s.stock.find(l => l.kind === 'van' && l.technicianId === t.id && !l.archived)
      const onClock = p.s.times.some(x => x.kind === 'shift' && !x.endAt && x.technicianId === t.id)
      const planned = p.proposals.filter(x => x.plan.technicianId === t.id && x.plan.date === p.date)
      const items = lanes([...mine.map(v => ({ v, x: null as Rec | null, start: minutes(v.local.start), end: minutes(v.local.end) })), ...planned.map(x => ({ v: null as Rec | null, x, start: minutes(x.plan.start), end: minutes(x.plan.end) }))].sort((a, b) => a.start - b.start))
      // On a phone, now is marked before the first visit still running or to come.
      const nowAt = p.clock === null ? -1 : items.findIndex(x => x.end > p.clock!)
      return <section className="techrow" key={t.id} aria-label={t.name} style={{ ['--lanes' as string]: Math.max(1, ...items.map(i => i.lane + 1)) }}>
        <header className="tech">
          <span className="tech-avatar" aria-hidden="true">{initials(t.name)}<i className={onClock ? 'on' : ''} /></span>
          <span className="tech-text">
            <span className="tech-name">{t.name}</span>
            <span className="tech-info">{van?.name ?? `${mine.length} visit${mine.length === 1 ? '' : 's'}`}{onClock ? <span className="visually-hidden"> · on the clock</span> : null}</span>
            <span className="tech-load num">{(booked / 60).toFixed(1)}{work ? ` / ${+(work / 60).toFixed(1)}` : ''} h{work ? <span className="load" aria-hidden="true"><i style={{ width: `${Math.min(100, booked / work * 100)}%` }} /></span> : null}</span>
          </span>
        </header>
        <div className="timeline" {...target((d, e) => p.drop(d, { technicianId: t.id, date: p.date, minute: minuteAt(e) }))}>
          {!items.length && <p className="free">No visits this day</p>}
          {items.map(({ v, x, start, end, lane }, i) => {
            const nowMark = i === nowAt ? <p key="now" className="now-mark"><span>Now · {ampm(hhmm(p.clock!))}</span></p> : null
            const style = { ['--x' as string]: at(start), ['--w' as string]: `${(end - start) / (p.end - p.start) * 100}%`, ['--lane' as string]: String(lane) }
            if (x) {
              const job = byId(p.s.jobs, x.jobId), customer = byId(p.s.customers, job?.customerId)
              return [nowMark, <button key={x.id} className="visit proposed" style={style} onClick={() => p.openProposal(x.id)} aria-label={`Proposed by ${x.preparedBy.name}: ${job?.number} ${job?.title} at ${x.plan.start} to ${x.plan.end}, waiting for approval`}>
                <img className="visit-mark" src="/brand/mark.svg" alt="" width="18" height="18" />
                <span className="visit-when">{timeRange(x.plan.start, x.plan.end)}</span>
                <span className="visit-head"><span className="visit-num">{job?.number}</span><span className="tag tag-gold">Proposed</span></span>
                <span className="visit-what">{job?.title}</span>
                <span className="visit-who">{customer?.name}</span>
                <span className="visit-why">{x.rationale}</span>
              </button>]
            }
            const job = byId(p.s.jobs, v!.jobId), site = byId(p.s.sites, job?.siteId), customer = byId(p.s.customers, job?.customerId), [label, tone] = p.tone(v!)
            return [nowMark, <Chip key={v!.id} p={p} v={v!} className="visit" style={style}>
              <span className="visit-when">{timeRange(v!.local.start, v!.local.end)}</span>
              <span className="visit-head"><span className="visit-num">{job?.number}</span>{v!.status === 'completed' ? <span className="visit-icon done"><Glyph name="check" /></span> : tone === 'red' || tone === 'gold' ? <span className={`visit-tag tag tag-${tone}`}><Glyph name={label === 'Part on order' ? 'box' : 'alert'} />{label}</span> : null}</span>
              <span className="visit-what">{job?.title}</span>
              <span className="visit-who">{customer?.name}</span>
              <span className="visit-where">{site?.address?.split(',')[0]}</span>
              {['booked', 'arrived'].includes(v!.status) && <span className="resize" draggable onDragStart={startDrag({ kind: 'resize', id: v!.id })} title="Drag to change the end" aria-hidden="true" />}
            </Chip>]
          })}
          {p.clock !== null && items.length > 0 && nowAt < 0 && <p className="now-mark"><span>Now · {ampm(hhmm(p.clock))}</span></p>}
        </div>
      </section>
    })}
  </div></div>
}

export function WeekBoard(p: BoardProps) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart(p.date), i))
  const visits = p.s.visits.filter(v => v.status !== 'cancelled' && v.local.date >= days[0] && v.local.date <= days[6]).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return <div className="board-week" role="grid" aria-label={`Week of ${dateLabel(days[0], 'short')}`}>
    <div className="board-head" role="row"><span role="columnheader">{p.rowLabel}</span>{days.map(d => <span key={d} role="columnheader">{dateLabel(d, 'short')}</span>)}</div>
    {p.technicians.map(t => <div key={t.id} className="board-row" role="row">
      <span className="tech-name" role="rowheader">{t.name}</span>
      {days.map(d => <div key={d} role="gridcell" className="board-cell" aria-label={`${t.name} ${dateLabel(d, 'short')}`} {...target(drag => p.drop(drag, { technicianId: t.id, date: d, minute: null }))}>
        {visits.filter(v => v.technicianId === t.id && v.local.date === d).map(v => <Chip key={v.id} p={p} v={v} className="chip"><span className="nowrap">{ampm(v.local.start)}</span> · <span className="nowrap">{byId(p.s.jobs, v.jobId)?.number}</span></Chip>)}
      </div>)}
    </div>)}
  </div>
}

export function MonthBoard(p: BoardProps & { technicianId: string }) {
  const days = monthDays(p.date), month = p.date.slice(0, 7)
  const visits = p.s.visits.filter(v => v.status !== 'cancelled' && v.local.date >= days[0] && v.local.date <= days[days.length - 1] && (!p.technicianId || v.technicianId === p.technicianId)).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return <div className="board-month" role="grid" aria-label={new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00Z`))}>
    <div className="board-head" role="row">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} role="columnheader">{d}</span>)}</div>
    {Array.from({ length: days.length / 7 }, (_, w) => <div key={w} className="board-row" role="row">
      {days.slice(w * 7, w * 7 + 7).map(d => <div key={d} role="gridcell" className={`board-cell${d.slice(0, 7) === month ? '' : ' other-month'}`} aria-label={dateLabel(d, 'short')} {...target(drag => p.drop(drag, { technicianId: p.technicianId || null, date: d, minute: null }))}>
        <span className="day-number">{Number(d.slice(8))}</span>
        {visits.filter(v => v.local.date === d).map(v => <Chip key={v.id} p={p} v={v} className="chip"><span className="nowrap">{ampm(v.local.start)}</span> · <span className="nowrap">{byId(p.s.jobs, v.jobId)?.number}</span> · {byId(p.s.technicians, v.technicianId)?.name}</Chip>)}
      </div>)}
    </div>)}
  </div>
}
