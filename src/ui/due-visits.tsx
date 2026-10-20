import { useEffect, useState } from 'react'
import { today, type Glove, type Rec, type Run } from './api'
import { Field } from './controls'
import { DeclineVisit } from './decline-visit'
import { can } from './roles'

// PLAN-004: the existing job.create and visit.book doors remain the authority
// and conflict controls. Each batch result is shown independently; failures
// leave the entitlement due and its created job available for another try.
export function DueVisits({ s, run }: { s: Glove; run: Run }) {
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  const [through, setThrough] = useState(today(zone)), [from, setFrom] = useState(''), [area, setArea] = useState('')
  const [rows, setRows] = useState<Rec[]>([]), [selected, setSelected] = useState<string[]>([]), [error, setError] = useState('')
  const [date, setDate] = useState(today(zone)), [start, setStart] = useState('08:00'), [duration, setDuration] = useState('30'), [tech, setTech] = useState('')
  const [running, setRunning] = useState(false), [outcomes, setOutcomes] = useState<string[]>([])
  useEffect(() => {
    let live = true
    const query = new URLSearchParams({ through, ...(from ? { from } : {}), ...(area ? { area } : {}) })
    fetch(`/api/glove/due-visits?${query}`, { credentials: 'same-origin', cache: 'no-store' }).then(async r => {
      const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message ?? 'Due visits could not load.'); return b.visits
    }).then(visits => { if (live) { setRows(visits); setError('') } }, e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [s.version, through, from, area])
  const available = rows.filter(v => !v.booked)
  const batch = async () => {
    setRunning(true); setOutcomes([]); setError('')
    const execute = async (type: string, payload: object) => { const answer = await run(type, payload); if (!answer.ok) throw Object.assign(new Error(answer.error.message), { code: answer.error.code }); return answer.result }
    let minute = Number(start.slice(0, 2)) * 60 + Number(start.slice(3))
    const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
    const results: string[] = []
    try {
      for (const row of available.filter(v => selected.includes(v.id))) {
        const end = minute + Number(duration)
        if (end >= 1440) { results.push(`${row.customer}: not booked; batch exceeds this day.`); continue }
        try {
          const job = row.jobId ? { id: row.jobId } : await execute('job.create', { customerId: row.customerId, siteId: row.siteId, agreementId: row.agreementId, agreementVisitIndex: row.index, title: `${row.service} (${row.plan})` })
          await execute('visit.book', { jobId: job.id, technicianId: tech, date, start: clock(minute), end: clock(end) })
          results.push(`${row.customer}: booked ${date} ${clock(minute)}–${clock(end)}; remains due until completed.`)
          minute = end
        } catch (e) { results.push(`${row.customer}: not booked; ${e instanceof Error ? e.message : String(e)}`); if (e && typeof e === 'object' && 'code' in e && ['OFFLINE', 'UNCONFIRMED'].includes(String(e.code))) { results.push('Batch stopped. Recover the pending action with Retry before continuing.'); setOutcomes([...results]); break } }
        setOutcomes([...results])
      }
      setOutcomes(results); setSelected([])
    } finally { setRunning(false) }
  }
  return <section className="panel" aria-label="Due agreement visits">
    <h2>Due agreement visits</h2><p>Included visits stay here until completed or the customer explicitly declines. Booking alone does not remove them. Customer booking links are not available yet.</p>
    <div className="form-grid">
      <Field label="Season from (optional)">{p => <input {...p} type="date" value={from} onChange={e => setFrom(e.target.value)} />}</Field>
      <Field label="Due through">{p => <input {...p} type="date" value={through} onChange={e => setThrough(e.target.value)} required />}</Field>
      <Field label="Area ZIP (optional)">{p => <input {...p} value={area} onChange={e => setArea(e.target.value)} />}</Field>
    </div>
    <p role="status">{rows.length} included visits due in this range</p>
    {can(s.actor, 'visit.book') && <p><button type="button" disabled={running || !available.length} onClick={() => setSelected(available.map(v => v.id))}>Select unbooked visits</button></p>}
    <ul className="rows">{rows.map(v => <li key={v.id}><div>
      {can(s.actor, 'visit.book') && !v.booked && <label><input type="checkbox" aria-label={`Select ${v.customer} visit ${v.index + 1}`} disabled={running} checked={selected.includes(v.id)} onChange={e => setSelected(e.target.checked ? [...selected, v.id] : selected.filter(id => id !== v.id))} /> </label>}
      <a href={`#customers/${v.customerId}`}>{v.customer} · {v.plan}</a><p className="muted">Visit {v.index + 1} · due {v.due} · {v.address}</p>
      <p>{v.booked ? 'Booked, awaiting completion' : 'Awaiting booking'}{v.jobId && <> · <a href={`#jobs/${v.jobId}`}>Open job</a></>}</p>
      {can(s.actor, 'agreement.decline') && !v.booked && <DeclineVisit s={s} run={run} visit={v} />}
    </div></li>)}</ul>
    {can(s.actor, 'visit.book') && <form onSubmit={e => { e.preventDefault(); void batch() }} aria-label="Batch book included visits">
      <fieldset disabled={running}><div className="form-grid">
        <Field label="Batch technician">{p => <select {...p} value={tech} onChange={e => setTech(e.target.value)} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Batch date">{p => <input {...p} type="date" value={date} onChange={e => setDate(e.target.value)} required />}</Field>
        <Field label="First visit starts">{p => <input {...p} type="time" value={start} onChange={e => setStart(e.target.value)} required />}</Field>
        <Field label="Minutes per visit">{p => <input {...p} type="number" min="1" max="720" value={duration} onChange={e => setDuration(e.target.value)} required />}</Field>
      </div><p>Consecutive slots; each booking uses the existing dispatch conflict checks. Review any refused booking on its job.</p>
      <button type="submit" disabled={!selected.length}>Book selected visits</button></fieldset>
    </form>}
    {!!outcomes.length && <ul aria-label="Batch results">{outcomes.map((message, i) => <li key={i}>{message}</li>)}</ul>}
    {error && <p role="alert">{error}</p>}
  </section>
}
