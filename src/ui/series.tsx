import { useState } from 'react'
import { byId, timeRange, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

// Recurring jobs (PLAN-001) on the job screen: make a job repeat on a rule, or
// change its series from a date. Skipping or moving one visit is the ordinary
// cancel or move on Dispatch. A conflict answer lists what to review first.

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ordinals = [['1', 'first'], ['2', 'second'], ['3', 'third'], ['4', 'fourth'], ['-1', 'last']]

type Form = { date: string; unit: string; interval: string; months: number[]; on: string; nth: string; weekday: string; start: string; end: string; technicianId: string; until: string; reason: string }

const ruleOf = (f: Form) => f.unit === 'week' ? { unit: 'week', interval: Number(f.interval) } : { unit: 'month', ...(f.months.length ? { months: f.months } : { interval: Number(f.interval) }), ...(f.on === 'weekday' ? { nth: Number(f.nth), weekday: f.weekday } : {}) }

const describe = (r: Rec) => r.unit === 'week' ? `every ${r.interval === 1 ? 'week' : `${r.interval} weeks`}` : `${r.months ? `in ${r.months.map((m: number) => monthNames[m - 1]).join(' and ')}` : `every ${r.interval === 1 ? 'month' : `${r.interval} months`}`}${r.nth !== null ? ` on the ${ordinals.find(([k]) => Number(k) === r.nth)?.[1]} ${r.weekday}` : r.day ? ` on day ${r.day}` : ''}`

export function JobSeries({ s, run, job }: { s: Glove; run: Run; job: Rec }) {
  const change = !!job.series
  const latest = change ? [...job.series.revisions].sort((a: Rec, b: Rec) => a.from < b.from ? -1 : 1).pop() : null
  const [f, setF] = useState<Form>({ date: '', unit: 'month', interval: '3', months: [], on: 'day', nth: '1', weekday: 'monday', start: latest?.start ?? '09:00', end: latest?.end ?? '10:00', technicianId: latest?.technicianId ?? '', until: job.series?.until ?? '', reason: '' })
  const [conflicts, setConflicts] = useState<Rec[] | null>(null)
  const { error, act } = useAction()
  if (!can(s.actor, change ? 'series.change' : 'series.create') || job.status !== 'open') return change ? <SeriesSummary s={s} job={job} /> : null
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const payload = (acknowledge?: string[]) => ({ jobId: job.id, version: job.version, ...(change ? { from: f.date, reason: f.reason } : { date: f.date }), rule: ruleOf(f), start: f.start, end: f.end, technicianId: f.technicianId, until: f.until || null, ...(acknowledge ? { acknowledge } : {}) })
  const send = async (acknowledge?: string[]) => {
    const outcome = await run(change ? 'series.change' : 'series.create', payload(acknowledge))
    if (!outcome.ok && outcome.error.code === 'CONFLICT_REVIEW') { setConflicts(outcome.error.details.conflicts); return }
    setConflicts(null)
    await act(Promise.resolve(outcome))
  }
  const title = change ? 'Change the series from a date' : 'Repeat this job'
  return <section aria-labelledby={`series-${job.id}`}>
    {change && <SeriesSummary s={s} job={job} />}
    <form className="panel" aria-label={title} onSubmit={e => { e.preventDefault(); void send() }}>
      <h3 id={`series-${job.id}`}>{title}</h3>
      <div className="form-grid">
        <Field label={change ? 'From' : 'First visit'}>{p => <input {...p} type="date" value={f.date} onChange={set('date')} required />}</Field>
        <Field label="Repeats">{p => <select {...p} value={f.unit} onChange={set('unit')}><option value="month">Monthly</option><option value="week">Weekly</option></select>}</Field>
        <Field label="Every how many">{p => <input {...p} inputMode="numeric" value={f.interval} onChange={set('interval')} disabled={f.months.length > 0} />}</Field>
        {f.unit === 'month' && <Field label="On">{p => <select {...p} value={f.on} onChange={set('on')}><option value="day">The first visit's day of the month</option><option value="weekday">A weekday of the month</option></select>}</Field>}
        {f.unit === 'month' && f.on === 'weekday' && <><Field label="Which">{p => <select {...p} value={f.nth} onChange={set('nth')}>{ordinals.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field><Field label="Weekday">{p => <select {...p} value={f.weekday} onChange={set('weekday')}>{weekdays.map(w => <option key={w} value={w}>{w}</option>)}</select>}</Field></>}
        <Field label="Start">{p => <input {...p} type="time" value={f.start} onChange={set('start')} required />}</Field>
        <Field label="End">{p => <input {...p} type="time" value={f.end} onChange={set('end')} required />}</Field>
        <Field label="Technician">{p => <select {...p} value={f.technicianId} onChange={set('technicianId')} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Ends on (optional)">{p => <input {...p} type="date" value={f.until} onChange={set('until')} />}</Field>
        {change && <Field label="Why it changes">{p => <input {...p} value={f.reason} onChange={set('reason')} required />}</Field>}
      </div>
      {f.unit === 'month' && <fieldset className="form-grid"><legend>Only in these months (optional)</legend>{monthNames.map((m, i) => <label key={m}><input type="checkbox" checked={f.months.includes(i + 1)} onChange={e => setF({ ...f, months: e.target.checked ? [...f.months, i + 1].sort((a, b) => a - b) : f.months.filter(x => x !== i + 1) })} /> {m}</label>)}</fieldset>}
      {conflicts && <div className="notice conflict" role="alert"><p>Review these before the series books:</p><ul>{conflicts.map(c => <li key={c.code}>{c.message}</li>)}</ul><button type="button" className="danger" onClick={() => void send(conflicts.map(c => c.code))}>Review and confirm series</button></div>}
      <Problem error={error} />
      <div className="actions"><button className="primary" type="submit">{change ? 'Change series' : 'Make it repeat'}</button></div>
    </form>
  </section>
}

function SeriesSummary({ s, job }: { s: Glove; job: Rec }) {
  return <div className="muted" aria-label="Series">
    {job.series.revisions.map((r: Rec) => <p key={r.n}>From {r.from}: {describe(r.rule)}, {timeRange(r.start, r.end)} with {byId(s.technicians, r.technicianId)?.name}</p>)}
    <p>{job.series.until ? `Ends ${job.series.until}` : 'No end date'} · visits booked through {job.series.through} (rolling {job.series.horizonDays} days) · invoiced as one job (per-visit and fixed billing rules are not available yet)</p>
  </div>
}
