import type { DragEvent, KeyboardEvent, ReactNode } from 'react'
import { byId, dateLabel, shiftDate, type Glove, type Rec } from './api'
import { Badge } from './controls'

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
  /** A visit being moved with the keyboard: shown where it would go. */
  keyed: { visitId: string; slot: Slot } | null
  select: (id: string) => void
  drop: (drag: Drag, at: { technicianId: string | null; date: string; minute: number | null }) => void
  keyDown: (v: Rec, e: KeyboardEvent) => void
  tone: (v: Rec) => [string, 'green' | 'blue' | 'gold' | 'red' | 'grey']
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

export function DayBoard(p: BoardProps & { hours: number[]; start: number; end: number; clashes: Set<string> }) {
  const day = p.s.visits.filter(v => v.local.date === p.date && v.status !== 'cancelled')
  const minuteAt = (e: DragEvent) => { const r = e.currentTarget.getBoundingClientRect(); return Math.floor((p.start + (e.clientX - r.left) / r.width * (p.end - p.start)) / 15) * 15 }
  return <>
    {p.technicians.map(t => {
      const mine = day.filter(v => v.technicianId === t.id).sort((a, b) => a.startAt.localeCompare(b.startAt))
      const booked = mine.reduce((n, v) => n + minutes(v.local.end) - minutes(v.local.start), 0)
      return <section className="techrow" key={t.id} aria-label={t.name}>
        <header className="tech"><p className="tech-name">{t.name}</p><p className="tech-info">{mine.length} visit{mine.length === 1 ? '' : 's'} · {(booked / 60).toFixed(1)} h</p></header>
        <div className="timeline" {...target((d, e) => p.drop(d, { technicianId: t.id, date: p.date, minute: minuteAt(e) }))}>
          {!mine.length && <p className="free">No visits this day</p>}
          {mine.map((v, i) => {
            const job = byId(p.s.jobs, v.jobId), site = byId(p.s.sites, job?.siteId), [label, tone] = p.tone(v)
            const x = (minutes(v.local.start) - p.start) / (p.end - p.start) * 100, w = (minutes(v.local.end) - minutes(v.local.start)) / (p.end - p.start) * 100
            const stacked = mine.slice(0, i).some(o => p.clashes.has(o.id) && p.clashes.has(v.id) && o.endAt > v.startAt)
            return <Chip key={v.id} p={p} v={v} className={`visit${stacked ? ' stacked' : ''}`} style={{ ['--x' as string]: `${x}%`, ['--w' as string]: `${w}%` }}>
              <span className="visit-head"><b>{job?.number}</b><Badge tone={tone}>{label}</Badge></span>
              <span className="visit-what">{job?.title}</span>
              <span className="visit-where">{site?.address?.split(',')[0]}</span>
              <time>{v.local.start} – {v.local.end}</time>
              {['booked', 'arrived'].includes(v.status) && <span className="resize" draggable onDragStart={startDrag({ kind: 'resize', id: v.id })} title="Drag to change the end" aria-hidden="true" />}
            </Chip>
          })}
        </div>
      </section>
    })}
  </>
}

export function WeekBoard(p: BoardProps) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart(p.date), i))
  const visits = p.s.visits.filter(v => v.status !== 'cancelled' && v.local.date >= days[0] && v.local.date <= days[6]).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return <div className="board-week" role="grid" aria-label={`Week of ${dateLabel(days[0], 'short')}`}>
    <div className="board-head" role="row"><span role="columnheader">Technician</span>{days.map(d => <span key={d} role="columnheader">{dateLabel(d, 'short')}</span>)}</div>
    {p.technicians.map(t => <div key={t.id} className="board-row" role="row">
      <span className="tech-name" role="rowheader">{t.name}</span>
      {days.map(d => <div key={d} role="gridcell" className="board-cell" aria-label={`${t.name} ${dateLabel(d, 'short')}`} {...target(drag => p.drop(drag, { technicianId: t.id, date: d, minute: null }))}>
        {visits.filter(v => v.technicianId === t.id && v.local.date === d).map(v => <Chip key={v.id} p={p} v={v} className="chip">{v.local.start} {byId(p.s.jobs, v.jobId)?.number}</Chip>)}
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
        {visits.filter(v => v.local.date === d).map(v => <Chip key={v.id} p={p} v={v} className="chip">{v.local.start} {byId(p.s.jobs, v.jobId)?.number} · {byId(p.s.technicians, v.technicianId)?.name}</Chip>)}
      </div>)}
    </div>)}
  </div>
}
