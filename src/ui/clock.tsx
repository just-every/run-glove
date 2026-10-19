import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import type { Queued } from './outbox'
import { can } from './roles'

// Clock-ins and job timers (COST-001). The phone's clock card and visit timers
// queue through the outbox, so they work without signal; what they show is the
// server's records with the waiting items applied in order. The desk reads each
// job's time and corrects an entry with a reason, keeping its original.

type QueueFn = (type: string, payload: Record<string, any>, label: string) => void
const kinds: Record<string, string> = { travel: 'Travel', job: 'On the job' }
const local = (iso: string, zone: string) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map(p => [p.type, p.value]))
export const hhmm = (iso: string, zone: string) => { const p = local(iso, zone); return `${p.hour}:${p.minute}` }
const ymd = (iso: string, zone: string) => { const p = local(iso, zone); return `${p.year}-${p.month}-${p.day}` }
/** Whole minutes, rounded half up, as the server counts them. */
export const minutes = (startAt: string, endAt: string) => Math.floor((Date.parse(endAt) - Date.parse(startAt) + 30_000) / 60_000)

/** The technician's clock and running timer: the records, then each waiting item in the order it was queued. */
export function clockState(s: Glove, techId: string | undefined, queued: Queued[]) {
  const mine = s.times.filter(x => x.technicianId === techId && !x.endAt)
  const shift = mine.find(x => x.kind === 'shift')
  let on = !!shift, since: string | null = shift?.startAt ?? null, timer: { visitId: string; kind: string; since: string } | null = null
  const t = mine.find(x => x.kind !== 'shift')
  if (t) timer = { visitId: t.visitId, kind: t.kind, since: t.startAt }
  for (const q of queued.filter(q => !q.refused)) {
    if (q.type === 'clock.in') { on = true; since = q.payload.deviceTime }
    if (q.type === 'clock.out') { on = false; since = null; timer = null }
    if (q.type === 'timer.start') timer = { visitId: q.payload.visitId, kind: q.payload.kind, since: q.payload.deviceTime }
    if (q.type === 'timer.stop' || (q.type === 'visit.complete' && timer?.visitId === q.payload.visitId)) timer = null
  }
  return { on, since, timer, waiting: queued.some(q => !q.refused && ['clock.in', 'clock.out', 'timer.start', 'timer.stop'].includes(q.type)) }
}

export function ClockCard({ s, techId, queue, queued }: { s: Glove; techId: string; queue: QueueFn; queued: Queued[] }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney', c = clockState(s, techId, queued)
  return <section className="card clock" aria-labelledby="clock-title">
    <h2 id="clock-title" className="section-title">Time</h2>
    <p role="status">{c.on ? `On the clock since ${hhmm(c.since!, zone)}` : 'Off the clock'}{c.waiting ? ' · waiting to send' : ''}</p>
    {c.on ? <button onClick={() => queue('clock.out', {}, 'Clock out')}>Clock out</button> : <button className="primary" onClick={() => queue('clock.in', {}, 'Clock in')}>Clock in</button>}
  </section>
}

export function VisitTimers({ s, visit, techId, queue, queued }: { s: Glove; visit: Rec; techId: string; queue: QueueFn; queued: Queued[] }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney', c = clockState(s, techId, queued)
  const here = c.timer?.visitId === visit.id ? c.timer : null
  const start = (kind: 'travel' | 'job') => queue('timer.start', { visitId: visit.id, kind }, kind === 'travel' ? 'Travel timer' : 'Job timer')
  return <section className="card timers" aria-labelledby="timers-title">
    <h2 id="timers-title" className="section-title">Timers</h2>
    <p role="status">{here ? `${here.kind === 'travel' ? 'Travel' : 'Job'} timer running since ${hhmm(here.since, zone)}` : 'No timer running on this visit'}</p>
    {!c.on ? <p className="muted">Clock in on Your visits to start a timer.</p> : <div className="actions">
      {here?.kind !== 'travel' && <button onClick={() => start('travel')}>Start travel</button>}
      {here?.kind !== 'job' && <button onClick={() => start('job')}>Start job timer</button>}
      {here && <button onClick={() => queue('timer.stop', { visitId: visit.id }, 'Stop timer')}>Stop timer</button>}
    </div>}
  </section>
}

function Correct({ s, entry, run, close }: { s: Glove; entry: Rec; run: Run; close: () => void }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const [v, setV] = useState({ startDate: ymd(entry.startAt, zone), startTime: hhmm(entry.startAt, zone), endDate: ymd(entry.endAt, zone), endTime: hhmm(entry.endAt, zone), reason: '' })
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  return <form className="inline-form time-correct" onSubmit={e => { e.preventDefault(); void act(run('time.correct', { id: entry.id, version: entry.version, start: { date: v.startDate, time: v.startTime }, end: { date: v.endDate, time: v.endTime }, reason: v.reason }), close) }}>
    <Field label="Start date">{p => <input {...p} type="date" value={v.startDate} onChange={set('startDate')} required />}</Field>
    <Field label="Start time">{p => <input {...p} type="time" value={v.startTime} onChange={set('startTime')} required />}</Field>
    <Field label="End date">{p => <input {...p} type="date" value={v.endDate} onChange={set('endDate')} required />}</Field>
    <Field label="End time">{p => <input {...p} type="time" value={v.endTime} onChange={set('endTime')} required />}</Field>
    <Field label="Reason for the correction">{p => <input {...p} value={v.reason} onChange={set('reason')} required />}</Field>
    <button type="submit">Save correction</button><button type="button" className="quiet" onClick={close}>Cancel</button>
    <Problem error={error} />
  </form>
}

/** The desk's time on a job: each travel and on-job entry by visit, its corrections, and the totals. */
export function JobTime({ s, job, run }: { s: Glove; job: Rec; run: Run }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const [editing, setEditing] = useState<string | null>(null)
  const entries = s.times.filter(x => x.jobId === job.id)
  const total = (kind: string) => entries.filter(x => x.kind === kind && x.endAt).reduce((n, x) => n + minutes(x.startAt, x.endAt), 0)
  return <section className="job-time" aria-labelledby={`time-${job.id}`}>
    <h3 id={`time-${job.id}`}>Time on this job</h3>
    {!entries.length ? <p className="muted">No time recorded yet</p> : <>
      <p className="time-totals">Travel {total('travel')} min · On the job {total('job')} min</p>
      <ul className="rows time-entries">{entries.map(x => <li key={x.id}><div>
        <strong>{kinds[x.kind]} · {byId(s.technicians, x.technicianId)?.name} · {hhmm(x.startAt, zone)}–{x.endAt ? `${hhmm(x.endAt, zone)} · ${minutes(x.startAt, x.endAt)} min` : 'running'}</strong>
        {x.corrections.map((k: Rec, i: number) => <p key={i} className="muted">Corrected by {k.by.name}: {k.reason} (was {hhmm(k.from.startAt, zone)}–{hhmm(k.from.endAt, zone)})</p>)}
        {x.original && <p className="muted">Original from the phone: {hhmm(x.original.startAt, zone)}–{hhmm(x.original.endAt, zone)}</p>}
        {editing === x.id && <Correct s={s} entry={x} run={run} close={() => setEditing(null)} />}
      </div>{x.endAt && can(s.actor, 'time.correct') && editing !== x.id && <button onClick={() => setEditing(x.id)}>Correct</button>}</li>)}</ul>
    </>}
  </section>
}
