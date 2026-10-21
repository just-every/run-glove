import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Problem, useAction } from './controls'
import { can } from './roles'

/** PAY-001: prepare selected completed jobs together; approval remains a separate step. */
export function InvoiceBatch({ s, run, jobs }: { s: Glove; run: Run; jobs: Rec[] }) {
  const [selected, setSelected] = useState<string[]>([]), [results, setResults] = useState<Rec[]>([])
  const { error, act } = useAction()
  const current = selected.filter(id => jobs.some(j => j.id === id))
  if (!can(s.actor, 'invoice.prepare') || (!jobs.length && !results.length)) return null
  return <form aria-label="Prepare invoices together" onSubmit={e => {
    e.preventDefault()
    void act(run('invoice.prepareBatch', { jobIds: current }), result => { setResults(result.results); setSelected(result.results.filter((r: Rec) => !r.ok).map((r: Rec) => r.jobId)) })
  }}>
    {jobs.length > 0 && <>
      <p>Select up to 50 completed jobs to prepare draft invoices. Review and approve each draft before sending.</p>
      <ul className="plain">{jobs.map(job => <li key={job.id}><label><input type="checkbox" checked={current.includes(job.id)} disabled={!current.includes(job.id) && current.length >= 50} onChange={e => setSelected(e.target.checked ? [...current, job.id] : current.filter(id => id !== job.id))} /> {job.number} · {byId(s.customers, job.customerId)?.name} · {job.title}</label></li>)}</ul>
      <div className="actions"><button type="submit" disabled={!current.length}>Prepare {current.length} draft invoices</button></div>
    </>}
    <Problem error={error} />
    {results.length > 0 && <div role="status"><ul className="plain">{results.map(r => <li key={r.jobId}>{byId(s.jobs, r.jobId)?.number ?? 'Job'}: {r.ok ? <><a href={`#invoices/${r.invoice.id}`}>{r.invoice.number}</a> prepared for review</> : r.error.message}</li>)}</ul></div>}
  </form>
}
