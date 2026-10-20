import { useState } from 'react'
import { byId, when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'

// Workflow rules (API-005): the rules, a form for a new one, the run log, and
// the notices rules leave for a role. A rule acts as its creator's role.

const triggers = [['enquiry.created', 'A request is created'], ['quote.approved', 'A quote price is approved'], ['job.created', 'A job is created']] as const
const roles = ['owner', 'dispatcher', 'office']

/** Notices from rules, for the role they name, on every desk screen. */
export function RuleNotices({ s }: { s: Glove }) {
  const recent = [...(s.notices ?? [])].reverse().slice(0, 5)
  if (!recent.length) return null
  return <section className="notice prepared" role="region" aria-label="Rule notices"><strong>From your rules</strong>
    <ul>{recent.map(n => <li key={n.id}>{n.jobId ? <a href={`#jobs/${n.jobId}`}>{n.message}</a> : n.message}</li>)}</ul>
  </section>
}

function NewRule({ s, run }: { s: Glove; run: Run }) {
  const [v, setV] = useState({ name: '', trigger: 'quote.approved', source: '', over: '', kind: 'notify', to: 'owner', message: '', technicianId: '', afterDays: '1', start: '08:00', end: '09:00' })
  const { error, act } = useAction()
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const action = v.kind === 'assign' ? { kind: 'assign', personId: v.to } : v.kind === 'notify' ? { kind: 'notify', to: v.to, message: v.message } : { kind: 'book', technicianId: v.technicianId, afterDays: Number(v.afterDays), start: v.start, end: v.end }
  return <form className="panel" aria-labelledby="rule-new-title" onSubmit={e => { e.preventDefault(); void act(run('rule.save', { name: v.name, trigger: v.trigger, condition: { source: v.source, over: v.over }, action }), () => setV({ ...v, name: '', message: '' })) }}>
    <h2 id="rule-new-title">New rule</h2>
    <div className="form-grid">
      <Field label="Rule name">{p => <input {...p} value={v.name} onChange={set('name')} required />}</Field>
      <Field label="When">{p => <select {...p} value={v.trigger} onChange={set('trigger')}>{triggers.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
      <Field label="Only from source (optional)">{p => <input {...p} value={v.source} onChange={set('source')} />}</Field>
      <Field label="Only when the total is over (optional)">{p => <input {...p} inputMode="decimal" value={v.over} onChange={set('over')} />}</Field>
      <Field label="Do">{p => <select {...p} value={v.kind} onChange={set('kind')}><option value="notify">Leave a notice</option><option value="book">Book the job's visit</option><option value="assign">Assign its invoice to</option></select>}</Field>
      {v.kind === 'assign' ? <Field label="Invoice preparer">{p => <select {...p} value={v.to} onChange={set('to')} required><option value="">Choose</option>{(s.operators ?? []).map(o => <option key={o.id} value={o.id}>{o.displayName ?? o.name ?? o.email}</option>)}</select>}</Field> : v.kind === 'notify' ? <>
        <Field label="Notice for">{p => <select {...p} value={v.to} onChange={set('to')}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>}</Field>
        <Field label="Notice">{p => <input {...p} value={v.message} onChange={set('message')} required />}</Field>
      </> : <>
        <Field label="Technician">{p => <select {...p} value={v.technicianId} onChange={set('technicianId')} required><option value="">Choose</option>{s.technicians.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Days later">{p => <input {...p} inputMode="numeric" value={v.afterDays} onChange={set('afterDays')} />}</Field>
        <Field label="Starts">{p => <input {...p} type="time" value={v.start} onChange={set('start')} />}</Field>
        <Field label="Ends">{p => <input {...p} type="time" value={v.end} onChange={set('end')} />}</Field>
      </>}
    </div>
    <p className="muted">A rule does only what your role can; anything else is logged as not allowed.</p>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Save rule</button></div>
  </form>
}

export function Rules({ s, run }: { s: Glove; run: Run }) {
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  const toggle = useAction()
  return <div className="page">
    <section className="titlebar"><div><h1>Rules</h1><p className="subtitle">When this happens in Glove, do that</p></div></section>
    <div className="two-col">
      <div>
        <section className="panel" aria-labelledby="rules-title"><h2 id="rules-title">Your rules</h2>
          {!s.rules.length ? <Empty title="No rules yet" /> : <ul className="rows">{s.rules.map(r => <li key={r.id}><span><strong>{r.name}</strong> · {triggers.find(([k]) => k === r.trigger)?.[1]}{r.condition.source ? ` from ${r.condition.source}` : ''}{r.condition.over ? ` over $${r.condition.over}` : ''} → {r.action.kind === 'assign' ? `invoice to ${r.action.name}` : r.action.kind === 'notify' ? `notice for ${r.action.to}` : `book ${byId(s.technicians, r.action.technicianId)?.name} ${r.action.afterDays} days later`} · by {r.createdBy.name}</span>
            <span><Badge tone={r.enabled ? 'green' : 'grey'}>{r.enabled ? 'On' : 'Off'}</Badge>{can(s.actor, 'rule.save') && <button onClick={() => toggle.act(run('rule.save', { id: r.id, version: r.version, name: r.name, trigger: r.trigger, condition: r.condition, action: r.action, enabled: !r.enabled }))}>{r.enabled ? 'Turn off' : 'Turn on'}</button>}</span></li>)}</ul>}
          <Problem error={toggle.error} />
        </section>
        <section className="panel" aria-labelledby="runs-title"><h2 id="runs-title">Run log</h2>
          {!s.ruleRuns.length ? <p className="muted">No runs yet</p> : <ul className="rows">{[...s.ruleRuns].reverse().slice(0, 50).map(r => <li key={r.id}><span>{when(r.createdAt, zone)} · {r.rule} (version {r.ruleVersion}) · {r.trigger.kind}</span><span><Badge tone={r.outcome === 'done' ? 'green' : 'red'}>{r.outcome}</Badge> {r.detail}</span></li>)}</ul>}
        </section>
      </div>
      <div>{can(s.actor, 'rule.save') && <NewRule s={s} run={run} />}</div>
    </div>
  </div>
}
