import { useState } from 'react'
import { byId, dateLabel, roleName, useTimeline, when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Problem, money, useAction } from './controls'
import { can } from './roles'
import { Glyph } from './glyphs'
import { JobExpenses } from './expenses'
import { JobTime } from './clock'
import { FilledForm } from './forms'
import { JobCosting, CostingReport } from './costing'
import { JobSeries } from './series'
import { CustomValues } from './custom-fields'

// Every job with what happened on it: visits and who was assigned, arrival
// evidence, checklist results, notes, photos, materials, the customer's
// sign-off and the complete timeline of who did what.

const tone = { open: 'gold', completed: 'green', invoiced: 'grey' } as const

export function Jobs({ s, run, focus }: { s: Glove; run: Run; focus: string }) {
  const [open, setOpen] = useState<string | null>(focus || null)
  const job = byId(s.jobs, open)
  return <div className="page">
    <section className="titlebar"><div><h1>Jobs</h1><p className="subtitle">Accepted work, its visits and its field evidence</p></div></section>
    <div className="two-col list-detail">
      {!s.jobs.length ? <Empty title="No jobs yet">A job starts when an accepted quote is turned into work, or arrives with a move-in.</Empty> :
        <section className="panel"><h2>Jobs</h2>
          <table className="table"><thead><tr><th>Job</th><th>Customer</th><th>Status</th></tr></thead><tbody>
            {[...s.jobs].reverse().map(j => <tr key={j.id} className={open === j.id ? 'selected' : ''}><td><button className="link-button job-link" onClick={() => setOpen(j.id)}><span className="nowrap">{j.number}</span> ·{' '}<span>{j.title}</span></button></td><td>{byId(s.customers, j.customerId)?.name}</td><td><Badge tone={tone[j.status as keyof typeof tone] ?? 'grey'}>{j.status === 'invoiced' && j.invoicedElsewhere ? 'Invoiced in ServiceM8' : j.status[0].toUpperCase() + j.status.slice(1)}</Badge></td></tr>)}
          </tbody></table>
        </section>}
      <div>{job ? <JobDetail key={job.id + job.version} s={s} job={job} run={run} /> : <Empty title="Choose a job" glyph="clock">Its visits, evidence and timeline open here.</Empty>}</div>
    </div>
    <CostingReport s={s} />
  </div>
}

export function Evidence({ s, capture }: { s: Glove; capture: Rec }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney', who = byId(s.technicians, capture.technicianId)?.name ?? 'Unknown'
  const stamp = <span className="muted">{who} · phone time {when(capture.deviceTime, zone)}{capture.receivedAt && capture.deviceTime && Date.parse(capture.receivedAt) - Date.parse(capture.deviceTime) > 120000 ? ` · received ${when(capture.receivedAt, zone)}` : ''}{capture.late ? ' · arrived after the visit changed' : ''}</span>
  switch (capture.kind) {
    case 'photo': return <figure className="evidence-photo"><img src={`/api/glove/files/${capture.file.fileId}`} alt={capture.caption || 'Site photo'} loading="lazy" /><figcaption>{capture.caption || 'Photo'}<br />{stamp}</figcaption></figure>
    case 'note': return <p className="evidence-note">“{capture.text}”<br />{stamp}</p>
    case 'material': return <p>{capture.description} × {capture.quantity} {capture.unit}<br />{stamp}</p>
    case 'checklist': return <p>{capture.label}: <strong>{capture.result}</strong>{capture.note ? ` — ${capture.note}` : ''}<br />{stamp}</p>
    case 'refrigerant': return <p>{capture.refrigerant.type}: {capture.refrigerant.added} lb added, {capture.refrigerant.recovered} lb recovered (EPA 608 {capture.refrigerant.certification})<br />{stamp}</p>
    case 'arrival': return <p>Arrival recorded<br />{stamp}</p>
    case 'attachment': return <p>{capture.name} · {capture.bytes.status === 'retained' ? 'file kept in the move-in record' : 'file missing: not included in the ServiceM8 move-in'}</p>
    case 'completion': return <p>Visit completed: {capture.summary}<br />{stamp}</p>
    case 'line': return <p>Added on site: {capture.description} × {capture.quantity} {capture.unit} — approved by {capture.approval.customerName} ({capture.approval.method})<br />{stamp}</p>
    case 'form': return <div><strong>{capture.formName}</strong><FilledForm capture={capture} />{stamp}</div>
    default: return null
  }
}

function JobDetail({ s, job, run }: { s: Glove; job: Rec; run: Run }) {
  const zone = s.business[0]?.timezone ?? 'Australia/Sydney'
  const { error, act } = useAction()
  const customer = byId(s.customers, job.customerId), site = byId(s.sites, job.siteId)
  const visits = s.visits.filter(v => v.jobId === job.id)
  const captures = s.captures.filter(x => x.jobId === job.id)
  const results = new Map(captures.filter(x => x.kind === 'checklist').map(x => [x.itemId, x]))
  const timeline = useTimeline(job.id, s.version)
  const invoice = s.invoices.find(i => i.jobId === job.id)
  return <section className="panel job-detail" aria-labelledby="job-title">
    <h2 id="job-title" className="job-title">{job.number} · {job.title}</h2>
    <p className="job-where">{customer?.name} · {site?.address}{site?.accessNotes ? ` · ${site.accessNotes}` : ''}</p>
    {job.quoteId && <p className="muted">From quote {byId(s.quotes, job.quoteId)?.number}, revision {job.quoteRevision}</p>}
    {job.source && <p className="muted">Moved in from ServiceM8 job {job.number.replace('SM8-', '#')}{job.workDone ? ` · work done: ${job.workDone}` : ''}</p>}
    <div className="job-price">
      {job.serviceCall && <p className="muted">Service call without a quote · prices are approved on its invoice</p>}
      {job.totals && !job.serviceCall && <p><span className="muted">Accepted price</span><span className="job-total"><b className="num">{money(job.totals.total)}</b> incl. tax</span></p>}
      {job.status === 'completed' && !invoice && can(s.actor, 'invoice.prepare') && <button className="primary" onClick={() => act(run('invoice.prepare', { jobId: job.id }), () => { window.location.hash = 'invoices' })}>Prepare invoice</button>}
    </div>
    <Problem error={error} />
    <div className="job-grid">
      <div>
        {job.checklist.length > 0 && <><h3>Checklist</h3><ul className="checklist-summary">{job.checklist.map((i: Rec) => { const r = results.get(i.id); return <li key={i.id}><Badge tone={r ? 'green' : i.required ? 'red' : 'grey'} check={r?.result === 'done'}>{r ? r.result : i.required ? 'Required' : 'To do'}</Badge> {i.label}{r?.note ? ` — ${r.note}` : ''}</li> })}</ul></>}
        <h3>Field evidence</h3>
        {!captures.filter(x => x.kind !== 'completion').length ? <Empty title="Nothing recorded yet" /> : <div className="evidence-list">{captures.filter(x => x.kind !== 'completion').map(x => <Evidence key={x.id} s={s} capture={x} />)}</div>}
      </div>
      <div>
        <JobExpenses s={s} run={run} job={job} />
        <JobTime s={s} run={run} job={job} />
        <JobCosting s={s} job={job} />
        <CustomValues key={`custom-${job.id}-${job.version}`} s={s} run={run} kind="jobs" row={job} title="Job fields" />
        <JobSeries key={job.id + job.version} s={s} run={run} job={job} />
        <h3>Visits</h3>
        {!visits.length ? <Empty title="No visits booked" glyph="calendar" /> : <ul className="rows job-visits">{visits.map(v => <li key={v.id}><Glyph name="calendar" /><div>
          <strong>{dateLabel(v.local.date, 'short')} {v.local.start}–{v.local.end} · {byId(s.technicians, v.technicianId)?.name}</strong>
          <p className="muted">{v.status === 'cancelled' ? `Canceled: ${v.cancelled.reason}` : v.arrival ? `Arrival recorded ${when(v.arrival.deviceTime, zone)} (phone time)` : v.completion?.imported ? v.completion.note : 'Arrival not recorded'}{v.assignments.length > 1 ? ` · changed ${v.assignments.length - 1} time${v.assignments.length > 2 ? 's' : ''}` : ''}</p>
          {v.completion && !v.completion.imported && <div className="signoff">{v.completion.signoff.customerPresent ? <><p className="muted">Signed off by {v.completion.signoff.customerName}</p><img src={`/api/glove/files/${v.completion.signoff.signature.fileId}`} alt={`Signature of ${v.completion.signoff.customerName}`} /></> : <p className="muted">Customer not present: {v.completion.signoff.absentReason}</p>}<p className="muted">{v.completion.summary}</p></div>}
        </div></li>)}</ul>}
        <h3>Timeline</h3>
        {timeline.error && <p className="problem" role="alert">{timeline.error}</p>}
        {timeline.events && <ol className="timeline-list">{[...timeline.events].reverse().map(e => <li key={e.id}><time>{when(e.at, zone)}</time> <span>{e.summary}</span> <span className="muted">— {e.actorName} ({roleName(e.actorRole, s.roles)})</span></li>)}</ol>}
      </div>
    </div>
  </section>
}
