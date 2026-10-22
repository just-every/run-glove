import { useEffect, useState } from 'react'
import { occurrences, addDays } from '../glove/recurrence'
import { byId, today, timeRange, type Glove, type Rec, type Run } from './api'
import { Field, Problem, money, useAction } from './controls'
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
  const [importedRule, setImportedRule] = useState(false)
  const source = job.importedRecurrence?.proposal
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  const nextSourceDate = source ? occurrences(source.rule, source.from, source.until ?? addDays(today(zone), 730)).find(d => d >= today(zone) && (!source.coveredThrough || d > source.coveredThrough)) : undefined
  const [conflicts, setConflicts] = useState<Rec[] | null>(null)
  const { error, act } = useAction()
  if (!can(s.actor, change ? 'series.change' : 'series.create') || job.status !== 'open') return change ? <><SeriesSummary s={s} job={job} /><JobBilling s={s} run={run} job={job} /></> : null
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const payload = (acknowledge?: string[]) => ({ jobId: job.id, version: job.version, ...(change ? { from: f.date, reason: f.reason } : { date: f.date }), ...(importedRule ? { importedRule: true } : { rule: ruleOf(f) }), start: f.start, end: f.end, technicianId: f.technicianId, until: f.until || null, ...(acknowledge ? { acknowledge } : {}) })
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
      {!change && source && <div className="notice"><p>Mapped source schedule: {describe(source.rule)}. Existing source events through {source.coveredThrough ?? 'the source start'} stay as imported; nothing repeats until you choose a technician, review the times and confirm.</p>{nextSourceDate ? <button type="button" onClick={() => { setImportedRule(true); setF({ ...f, date: nextSourceDate, unit: source.rule.unit, interval: String(source.rule.interval), until: source.until ?? '' }) }}>Use imported schedule</button> : <p>No further occurrence falls within the source schedule's dates.</p>}{importedRule && <p>Using the exact mapped source rule. <button type="button" onClick={() => setImportedRule(false)}>Choose a different rule</button></p>}</div>}
      {!change && job.importedRecurrence?.unmapped && <p className="muted">{job.importedRecurrence.unmapped}</p>}
      <div className="form-grid">
        <Field label={change ? 'From' : 'First visit'}>{p => <input {...p} type="date" value={f.date} onChange={set('date')} required />}</Field>
        <Field label="Repeats">{p => <select {...p} disabled={importedRule} value={f.unit} onChange={set('unit')}><option value="month">Monthly</option><option value="week">Weekly</option></select>}</Field>
        <Field label="Every how many">{p => <input {...p} inputMode="numeric" value={f.interval} onChange={set('interval')} disabled={importedRule || f.months.length > 0} />}</Field>
        {f.unit === 'month' && <Field label="On">{p => <select {...p} disabled={importedRule} value={f.on} onChange={set('on')}><option value="day">The first visit's day of the month</option><option value="weekday">A weekday of the month</option></select>}</Field>}
        {f.unit === 'month' && f.on === 'weekday' && <><Field label="Which">{p => <select {...p} value={f.nth} onChange={set('nth')}>{ordinals.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field><Field label="Weekday">{p => <select {...p} value={f.weekday} onChange={set('weekday')}>{weekdays.map(w => <option key={w} value={w}>{w}</option>)}</select>}</Field></>}
        <Field label="Start">{p => <input {...p} type="time" value={f.start} onChange={set('start')} required />}</Field>
        <Field label="End">{p => <input {...p} type="time" value={f.end} onChange={set('end')} required />}</Field>
        <Field label="Technician">{p => <select {...p} value={f.technicianId} onChange={set('technicianId')} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Ends on (optional)">{p => <input {...p} type="date" value={f.until} onChange={set('until')} />}</Field>
        {change && <Field label="Why it changes">{p => <input {...p} value={f.reason} onChange={set('reason')} required />}</Field>}
      </div>
      {f.unit === 'month' && !importedRule && <fieldset className="form-grid"><legend>Only in these months (optional)</legend>{monthNames.map((m, i) => <label key={m}><input type="checkbox" checked={f.months.includes(i + 1)} onChange={e => setF({ ...f, months: e.target.checked ? [...f.months, i + 1].sort((a, b) => a - b) : f.months.filter(x => x !== i + 1) })} /> {m}</label>)}</fieldset>}
      {conflicts && <div className="notice conflict" role="alert"><p>Review these before the series books:</p><ul>{conflicts.map(c => <li key={c.code}>{c.message}</li>)}</ul><button type="button" className="danger" onClick={() => void send(conflicts.map(c => c.code))}>Review and confirm series</button></div>}
      <Problem error={error} />
      <div className="actions"><button className="primary" type="submit">{change ? 'Change series' : 'Make it repeat'}</button></div>
    </form>
    {change && <JobBilling s={s} run={run} job={job} />}
  </section>
}

function SeriesSummary({ s, job }: { s: Glove; job: Rec }) {
  return <div className="muted" aria-label="Series">
    {job.series.revisions.map((r: Rec) => <p key={r.n}>From {r.from}: {describe(r.rule)}, {timeRange(r.start, r.end)} with {byId(s.technicians, r.technicianId)?.name}</p>)}
    <p>{job.series.until ? `Ends ${job.series.until}` : 'No end date'} · visits booked through {job.series.through} (rolling {job.series.horizonDays} days){!job.series.billing && ' · invoiced as one job until the owner sets a recurring invoicing rule'}</p>
  </div>
}

const modes = [['per-visit', 'Each completed visit'], ['fixed-monthly', 'Fixed price at each month end'], ['fixed-after-visit', 'Fixed price after each completed visit'], ['on-close', 'Once when the job closes'], ['as-needed', 'Office reminder at each month end']]

function JobBilling({ s, run, job }: { s: Glove; run: Run; job: Rec }) {
  const latest = job.series.billing?.revisions.at(-1), zone = s.business[0]?.timezone ?? 'UTC'
  const [mode, setMode] = useState(latest?.mode ?? 'per-visit')
  const [from, setFrom] = useState([today(zone), latest?.from ?? '', job.series.revisions[0].from].sort().at(-1)!)
  const [priceLines, setPriceLines] = useState<Rec[]>((latest?.mode.startsWith('fixed-') ? latest.lines : [{ description: job.title, quantity: '1', unitPrice: '', tax: s.business[0]?.currency === 'AUD' ? 'GST' : 'TAXABLE' }]).map((line: Rec) => ({ ...line })))
  const [paused, setPaused] = useState(latest?.paused ?? false), [autoApprove, setAutoApprove] = useState(latest?.autoApprove ?? false)
  const [reason, setReason] = useState(''), [missed, setMissed] = useState<Rec[]>([]), [readError, setReadError] = useState('')
  const { error, act } = useAction(), fixed = mode.startsWith('fixed-')
  useEffect(() => {
    const controller = new AbortController()
    if (!can(s.actor, 'series.billingRun') && !can(s.actor, 'series.billing')) return
    fetch('/api/glove/recurring-billing', { signal: controller.signal, credentials: 'same-origin', cache: 'no-store' }).then(async response => {
      const body = await response.json() as { missed: Rec[]; error?: { message?: string } }
      if (!response.ok) throw new Error(body.error?.message ?? 'Recurring billing could not load.')
      setMissed(body.missed.filter((row: Rec) => row.jobId === job.id)); setReadError('')
    }).catch(error => { if (error.name !== 'AbortError') setReadError(error.message) })
    return () => controller.abort()
  }, [s.version, s.actor, job.id])
  const save = () => act(run('series.billing', { jobId: job.id, version: job.version, from, reason, billing: { mode, paused, autoApprove: fixed && autoApprove, ...(fixed ? { lines: priceLines } : {}) } }))
  const invoices = s.invoices.filter(i => i.jobId === job.id && i.recurring)
  return <section aria-label={`Recurring billing for ${job.number}`}>
    <h3>Recurring billing</h3>
    <p>Invoices stay proposed until approved. Payments, automatic charges, receipts and dunning are not available.</p>
    {job.series.billing?.revisions.map((rule: Rec) => <p key={rule.n}>From {rule.from}: {modes.find(([key]) => key === rule.mode)?.[1]}{rule.paused ? ' · paused' : ''}{rule.autoApprove ? ' · owner auto-approval of fixed invoices' : ' · drafts require approval'}{rule.mode.startsWith('fixed-') && <span> · {rule.lines.map((line: Rec) => `${line.description}: ${line.quantity} × ${money(line.unitPrice)} before tax`).join('; ')}</span>}</p>)}
    {readError && <p role="alert" className="problem">{readError}</p>}
    {missed.length > 0 && <div role="status"><h4>Billing dates needing review</h4><ul>{missed.map(row => <li key={row.key}>{row.dueDate}: {row.reason}</li>)}</ul></div>}
    {invoices.length > 0 && <ul className="plain">{invoices.map(invoice => <li key={invoice.id}><a href={`#invoices/${invoice.id}`}>{invoice.number}</a> · {invoice.recurring.dueDate} · {invoice.status === 'draft' ? 'Proposed — not approved, not sent' : invoice.status}{invoice.dates?.approvedAfterPeriodEnd ? ' · approved after period end' : ''}</li>)}</ul>}
    {can(s.actor, 'series.billingRun') && <button type="button" onClick={() => void act(run('series.billingRun', {}))}>Check recurring billing</button>}
    {s.actor.role === 'owner' && can(s.actor, 'series.billing') && <form aria-label="Recurring invoicing rule" onSubmit={event => { event.preventDefault(); void save() }}>
      <div className="form-grid">
        <Field label="Billing from">{p => <input {...p} type="date" value={from} min={today(zone)} onChange={event => setFrom(event.target.value)} required />}</Field>
        <Field label="Invoice rule">{p => <select {...p} value={mode} onChange={event => setMode(event.target.value)}>{modes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}</Field>
      </div>
      {fixed && priceLines.map((line, index) => <div className="form-grid" key={index}>
        <Field label={`Recurring line ${index + 1} description`}>{p => <input {...p} value={line.description} onChange={event => setPriceLines(priceLines.map((l, i) => i === index ? { ...l, description: event.target.value } : l))} required />}</Field>
        <Field label={`Recurring line ${index + 1} quantity`}>{p => <input {...p} inputMode="decimal" value={line.quantity} onChange={event => setPriceLines(priceLines.map((l, i) => i === index ? { ...l, quantity: event.target.value } : l))} required />}</Field>
        <Field label={`Recurring line ${index + 1} unit price before tax`}>{p => <input {...p} inputMode="decimal" value={line.unitPrice} onChange={event => setPriceLines(priceLines.map((l, i) => i === index ? { ...l, unitPrice: event.target.value } : l))} required />}</Field>
        <Field label={`Recurring line ${index + 1} tax`}>{p => <select {...p} value={line.tax} onChange={event => setPriceLines(priceLines.map((l, i) => i === index ? { ...l, tax: event.target.value } : l))}><option value="FREE">Tax free</option><option value="GST">GST</option><option value="TAXABLE">Taxable</option></select>}</Field>
      </div>)}
      <p><label><input type="checkbox" checked={paused} onChange={event => setPaused(event.target.checked)} /> Pause billing from this date</label></p>
      {fixed && <p><label><input type="checkbox" checked={autoApprove} onChange={event => setAutoApprove(event.target.checked)} /> Authorize automatic approval of these fixed invoices</label></p>}
      <Field label="Reason for billing rule">{p => <input {...p} value={reason} onChange={event => setReason(event.target.value)} required maxLength={500} />}</Field>
      <button type="submit" className="primary">Save invoicing rule</button>
    </form>}
    <Problem error={error} />
  </section>
}
