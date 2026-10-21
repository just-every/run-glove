import { useEffect, useState } from 'react'
import { today, type Glove, type Rec, type Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

// Estimate versus actual job costing (COST-004): each job's estimate and actual
// cost and margin from GET /api/glove/jobs/<id>/cost, the period roll-up by job
// type and technician from GET /api/glove/reports/costing, and the owner's
// loaded cost per hour on each technician. Costs are margins: only people who
// read reports see them.

const pct = (m: string | null) => m === null ? '—' : `${m}%`

export function JobCosting({ s, job }: { s: Glove; job: Rec }) {
  const [c, setC] = useState<Rec | null>(null)
  useEffect(() => {
    let live = true
    if (s.actor.reads.includes('reports')) void fetch(`/api/glove/jobs/${job.id}/cost`, { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() as Promise<Rec> : null).then(b => { if (live) setC(b?.costing ?? null) })
    return () => { live = false }
  }, [job.id, s.version])
  if (!c) return null
  const row = (label: string, value: string) => <tr><td>{label}</td><td className="num">{value}</td></tr>
  return <section className="job-costing" aria-labelledby={`costing-${job.id}`}>
    <h3 id={`costing-${job.id}`}>Estimate and actual</h3>
    <table className="table compact"><tbody>
      {row('Revenue before tax', money(c.revenue))}
      {row('Estimated cost', money(c.estimate.cost))}
      {row('Estimated margin', pct(c.estimate.margin))}
      {row('Labor', money(c.actual.labor))}
      {row('Materials at cost', money(c.actual.materials))}
      {row('Purchase orders received', money(c.actual.purchases))}
      {row('Expenses', money(c.actual.expenses))}
      {row('Subcontractors', money(c.actual.subcontractors))}
      {row('Actual cost', money(c.actual.cost))}
      {row('Actual margin', pct(c.actual.margin))}
      {row('Against estimate', `${money(c.difference.cost)} cost · ${c.difference.margin === null ? '—' : `${c.difference.margin} points`}`)}
    </tbody></table>
    {c.estimate.uncostedLineItems?.length > 0 && <div><p>Estimated lines without a unit cost count at $0.00:</p><ul>{c.estimate.uncostedLineItems.map((line: Rec, index: number) => <li key={index}>{line.description} · quantity {line.quantity}</li>)}</ul></div>}
    {(c.estimate.uncostedLines > 0 || c.actual.uncostedMaterials > 0 || c.actual.unratedTime > 0) && <p className="muted">{[c.estimate.uncostedLines ? `${c.estimate.uncostedLines} quoted line(s) without a cost` : '', c.actual.uncostedMaterials ? `${c.actual.uncostedMaterials} material(s) not in the price book` : '', c.actual.unratedTime ? `${c.actual.unratedTime} time entr(ies) without a cost rate` : ''].filter(Boolean).join(' · ')} count at $0.00.</p>}
  </section>
}

export function CostingReport({ s }: { s: Glove }) {
  const now = today(s.business[0]?.timezone ?? 'America/Chicago')
  const [period, setPeriod] = useState({ from: `${now.slice(0, 8)}01`, to: now })
  const [r, setR] = useState<Rec | null>(null)
  useEffect(() => {
    let live = true
    void fetch(`/api/glove/reports/costing?from=${period.from}&to=${period.to}`, { credentials: 'same-origin', cache: 'no-store' }).then(x => x.ok ? x.json() as Promise<Rec> : null).then(b => { if (live) setR(b) })
    return () => { live = false }
  }, [period.from, period.to, s.version])
  if (!s.actor.reads.includes('reports')) return null
  const head = <><th>Jobs</th><th>Revenue</th><th>Estimated cost</th><th>Actual cost</th><th>Estimated margin</th><th>Actual margin</th></>
  const cells = (x: Rec) => <><td className="num">{x.jobs}</td><td className="num">{money(x.revenue)}</td><td className="num">{money(x.estimatedCost)}</td><td className="num">{money(x.actualCost)}</td><td className="num">{pct(x.estimatedMargin)}</td><td className="num">{pct(x.actualMargin)}</td></>
  return <section className="panel" aria-labelledby="costing-report-title"><h2 id="costing-report-title">Job costing</h2>
    <p className="muted">Jobs completed in the period, by job type (the first price-book line's category) and by technician.</p>
    <div className="form-grid two"><Field label="From">{p => <input {...p} type="date" value={period.from} onChange={e => setPeriod({ ...period, from: e.target.value })} />}</Field><Field label="To">{p => <input {...p} type="date" value={period.to} onChange={e => setPeriod({ ...period, to: e.target.value })} />}</Field></div>
    {r && <div className="table-wrap">
      <table className="table"><thead><tr><th>Job type</th>{head}</tr></thead><tbody>{r.byJobType.map((x: Rec) => <tr key={x.type}><td>{x.type}</td>{cells(x)}</tr>)}<tr><td><strong>All</strong></td>{cells(r.total)}</tr></tbody></table>
      <table className="table"><thead><tr><th>Technician</th><th>Hours</th><th>Labor cost</th>{head}</tr></thead><tbody>{r.byTechnician.map((x: Rec) => <tr key={x.technicianId}><td>{x.technician}</td><td className="num">{(x.minutes / 60).toFixed(2)}</td><td className="num">{money(x.laborCost)}</td>{cells(x)}</tr>)}</tbody></table>
    </div>}
  </section>
}

/** The owner's loaded cost per hour for a technician. */
export function CostRate({ s, t, run }: { s: Glove; t: Rec; run: Run }) {
  const [rate, setRate] = useState(t.costRate ?? '')
  const { error, act } = useAction()
  if (!can(s.actor, 'technician.save') || !s.actor.reads.includes('reports')) return null
  return <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: t.operatorId ?? undefined, phone: t.phone, epa608: t.epa608, active: t.active, costRate: rate })) }}>
    <Field label={`Loaded cost per hour for ${t.name}`}>{p => <input {...p} inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} placeholder="45.00" />}</Field>
    <button type="submit">Save cost</button>
    <Problem error={error} />
  </form>
}

/** COST-005: margin warnings on jobs still open, for the owner and dispatchers on every desk screen. */
export function MarginWarnings({ s }: { s: Glove }) {
  const open = s.warnings.filter(w => s.jobs.find(j => j.id === w.jobId)?.status === 'open')
  if (!open.length) return null
  return <section className="problem margin-warnings" role="region" aria-label="Margin warnings"><strong>Margin warnings</strong>
    <ul>{open.map(w => <li key={w.id}><a href={`#jobs/${w.jobId}`}>{w.number}</a>: {w.kind === 'cost' ? `actual cost ${money(w.actual)} reached ${w.setting}% of the ${money(w.estimate)} estimate` : `projected margin ${w.projectedMargin}% is below the ${w.setting}% floor`}</li>)}</ul>
  </section>
}
