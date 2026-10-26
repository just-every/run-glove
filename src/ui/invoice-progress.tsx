import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { LinesEditor, blankLine, payloadLines } from './lines'
import { can } from './roles'
import { ProgressScope } from './progress-scope'

/** A stage is an explicit invoice draft, never an inferred charge. */
export function ProgressInvoices({ s, run }: { s: Glove; run: Run }) {
  const jobs = s.jobs.filter(j => j.quoteId && j.totals && !j.erasedAt && !j.series?.billing && ['open', 'completed'].includes(j.status) && !s.invoices.some(i => i.jobId === j.id && (!i.progress || i.progress.final)))
  const [jobId, setJobId] = useState(''), [name, setName] = useState(''), [final, setFinal] = useState(false)
  const [lines, setLines] = useState([blankLine()])
  const { error, act } = useAction()
  const job = byId(jobs, jobId)
  if (!can(s.actor, 'invoice.prepare')) return null
  const stages = s.invoices.filter(i => i.jobId === jobId)
  const source = job?.progressReconciliations?.at(-1)?.newCap ?? stages[0]?.progress.sourceTotal ?? job?.totals.total
  const used = stages.reduce((sum, i) => sum + toCents(i.revisions.at(-1).totals.total), 0n)
  const remainder = source ? fromCents(toCents(source) - used) : null
  return <section className="panel"><h2>Progress invoices</h2>
    <p>Bill an accepted long job in named stages. Enter only this stage’s lines, with any agreed discount reflected in its prices. Each draft needs office approval. The final stage must equal the remaining contract amount including tax.</p>
    {!jobs.length ? <p className="muted">Open quoted jobs and unfinished staged invoices appear here.</p> : <form aria-label="Prepare progress invoice" onSubmit={e => { e.preventDefault(); if (job) void act(run('invoice.prepare', { jobId: job.id, progress: { name, final }, lines: payloadLines(lines) }), () => { setName(''); setLines([blankLine()]); setFinal(false) }) }}>
      <Field label="Progress job">{p => <select {...p} value={jobId} required onChange={e => { setJobId(e.target.value); setFinal(false) }}><option value="">Choose a quoted job</option>{jobs.map(j => <option value={j.id} key={j.id}>{j.number} · {j.title}</option>)}</select>}</Field>
      {job && <><p>Contract {money(source)} · Remaining {money(remainder!)} including tax</p><ProgressTrail s={s} jobId={job.id} />
        <p className="muted">Materials and expenses are not added automatically. Reconcile this stage’s lines against the accepted contract and prior stages.</p>
        <Field label="Stage name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} maxLength={100} required />}</Field>
        <LinesEditor s={s} lines={lines} setLines={setLines} />
        <label className="check-line"><input type="checkbox" checked={final} disabled={job.status !== 'completed'} onChange={e => setFinal(e.target.checked)} /> Final stage{job.status !== 'completed' ? ' · complete the job first' : ''}</label>
        <button type="submit">Prepare stage draft</button></>}
      <Problem error={error} />
    </form>}
    {job && source && <ProgressScope s={s} job={job} stages={stages} source={source} run={run} />}
  </section>
}

export function ProgressTrail({ s, jobId }: { s: Glove; jobId: string }) {
  const stages = s.invoices.filter(i => i.jobId === jobId && i.progress)
  return stages.length ? <ol className="timeline-list plain" aria-label="Progress invoice stages">{stages.map(i => <li key={i.id}><a href={`#invoices/${i.id}`}>{i.number}</a> · {i.progress.name}{i.progress.final ? ' · final' : ''} · {money(i.revisions.at(-1).totals.total)} · {i.status}</li>)}</ol> : null
}
const toCents = (value: string) => { const [whole, fraction = ''] = value.split('.'); return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')) }
const fromCents = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, '0')}`
