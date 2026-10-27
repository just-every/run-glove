import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { money, Problem, useAction } from './controls'
import { can } from './roles'

/** Applying signed additions never revises an already approved invoice. */
export function ProgressScope({ s, job, stages, source, run }: { s: Glove; job: Rec; stages: Rec[]; source: string; run: Run }) {
  const [confirmed, setConfirmed] = useState('')
  const { error, act } = useAction()
  if (s.actor.role !== 'owner' || s.actor.branch || !can(s.actor, 'fieldQuote.apply') || !stages.length) return null
  const pending = s.quotes.filter(q => q.fieldQuote?.kind === 'changeOrder' && q.fieldQuote.jobId === job.id && !q.jobId && q.status === 'accepted' && q.acceptance?.signing?.signedCopy && q.revisions.at(-1)?.approval)
  if (!pending.length) return null
  const eligible = job.status === 'open' && stages.every(i => i.progress && !i.progress.final && ['draft', 'approved', 'exported'].includes(i.status))
  return <section className="panel" aria-label="Reconcile signed progress scope">
    <h3>Signed changes to this contract</h3>
    <p>Review the customer’s signed additions against every current stage. Applying a change updates the contract cap for future drafts. Approved invoices, their prices and signatures stay as recorded. Invoice approval and sending remain separate.</p>
    {!eligible && <p role="status">Every existing stage must be nonfinal, and the job must still be open.</p>}
    {pending.map(q => {
      const total = sum(source, q.acceptance.totals.total)
      return <article key={q.id} aria-label={`Review ${q.number}`}>
        <h4>{q.number} · {q.title}</h4>
        <p>Signed revision {q.acceptance.revision} · addition {money(q.acceptance.totals.total)} · contract {money(source)} → {money(total)}</p>
        <ul>{stages.map(i => <li key={i.id}>{i.number} · {i.progress.name} · {i.status}{i.revisions.at(-1).corrects ? ' correction' : ''} · revision {i.revisions.at(-1).n} · {money(i.revisions.at(-1).totals.total)}</li>)}</ul>
        <p>Customer signed as {q.acceptance.customerName}. Discounts, deposits, recurring billing or differing tax require separate reconciliation and will be refused here.</p>
        <label className="check-line"><input type="checkbox" checked={confirmed === q.id} onChange={e => setConfirmed(e.target.checked ? q.id : '')} /> I reviewed the signed addition, contract amount and every listed stage.</label>
        <button type="button" disabled={!eligible || confirmed !== q.id} onClick={() => void act(run('fieldQuote.apply', { quoteId: q.id, version: q.version, jobVersion: job.version, progressReview: { sourceTotal: source, total, stages: stages.map(i => ({ id: i.id, version: i.version })) } }), () => setConfirmed(''))}>Apply {q.number} to future stages</button>
      </article>
    })}
    <Problem error={error} />
  </section>
}

function sum(a: string, b: string) {
  const cents = (v: string) => { const [whole, part = ''] = v.split('.'); return BigInt(whole) * 100n + BigInt(part.padEnd(2, '0')) }
  const total = cents(a) + cents(b)
  return `${total / 100n}.${String(total % 100n).padStart(2, '0')}`
}
