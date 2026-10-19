import { useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'

// AGENT-009 on the Team screen: the owner's grants to agents (named action,
// services, price limit, daily budget, quiet hours), each grant's uses,
// revocation, and the switch that pauses every agent.

const actions = { 'visit.book': 'Book visits into open slots', 'visit.change': 'Move a visit within its day' } as Record<string, string>
const blank = { agentId: '', action: 'visit.book', serviceIds: [] as string[], maxSubtotal: '', dailyLimit: '20', quietStart: '', quietEnd: '' }

export function AgentGrants({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState(blank)
  const { error, act } = useAction()
  const agents = s.operators.filter(o => o.role === 'agent'), paused = s.business[0]?.agentsPaused === true
  const zone = s.business[0]?.timezone ?? 'UTC'
  const toggle = (id: string) => setForm({ ...form, serviceIds: form.serviceIds.includes(id) ? form.serviceIds.filter(x => x !== id) : [...form.serviceIds, id] })
  const create = () => act(run('grant.create', { agentId: form.agentId, action: form.action, serviceIds: form.serviceIds, maxSubtotal: form.maxSubtotal || undefined, dailyLimit: Number(form.dailyLimit), ...(form.quietStart && form.quietEnd ? { quietHours: { start: form.quietStart, end: form.quietEnd } } : {}) }), () => setForm(blank))
  return <section className="panel"><h2>Agent grants</h2>
    <div className="actions">{paused ? <Badge tone="red">Every agent is paused</Badge> : <Badge tone="green">Agents may act</Badge>}<button className={paused ? 'primary' : 'danger'} onClick={() => act(run('agents.pause', { paused: !paused }))}>{paused ? 'Let agents act again' : 'Pause every agent'}</button></div>
    {!s.grants.length ? <Empty title="No grants yet">Agents only prepare work for a person to approve until you grant them an action.</Empty> : <ul className="rows">{[...s.grants].reverse().map((g: Rec) => <li key={g.id}><div><strong>{g.agentName}: {actions[g.action]}</strong> {g.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Revoked</Badge>}
      <p className="muted">{[g.serviceIds.length ? g.serviceIds.map((id: string) => s.services.find(x => x.id === id)?.name).join(', ') : 'Any service', g.maxSubtotal && `under $${g.maxSubtotal} before tax`, `${g.dailyLimit} a day`, g.quietHours && `quiet ${g.quietHours.start}–${g.quietHours.end}`, `used ${g.uses.length} time${g.uses.length === 1 ? '' : 's'}${g.uses.length ? `, last ${when(g.uses.at(-1).at, zone)}` : ''}`].filter(Boolean).join(' · ')}</p></div>
      {g.status === 'active' && <button onClick={() => act(run('grant.revoke', { grantId: g.id, version: g.version }))}>Revoke</button>}</li>)}</ul>}
    {agents.length > 0 && <form onSubmit={e => { e.preventDefault(); void create() }}>
      <h3>Grant an action</h3>
      <div className="form-grid">
        <Field label="Agent">{p => <select {...p} value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })} required><option value="">Choose an agent</option>{agents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>}</Field>
        <Field label="Action">{p => <select {...p} value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>{Object.entries(actions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}</Field>
        <Field label="Price limit before tax (optional)">{p => <input {...p} inputMode="decimal" value={form.maxSubtotal} onChange={e => setForm({ ...form, maxSubtotal: e.target.value })} />}</Field>
        <Field label="Daily budget (actions a day)">{p => <input {...p} type="number" min="1" max="500" value={form.dailyLimit} onChange={e => setForm({ ...form, dailyLimit: e.target.value })} />}</Field>
        <Field label="Quiet from (optional)">{p => <input {...p} type="time" value={form.quietStart} onChange={e => setForm({ ...form, quietStart: e.target.value })} />}</Field>
        <Field label="Quiet until (optional)">{p => <input {...p} type="time" value={form.quietEnd} onChange={e => setForm({ ...form, quietEnd: e.target.value })} />}</Field>
      </div>
      <fieldset className="form-grid"><legend>Only for these services (none means any)</legend>{s.services.filter(x => !x.archived).map(x => <label key={x.id} className="check-line"><input type="checkbox" checked={form.serviceIds.includes(x.id)} onChange={() => toggle(x.id)} /> {x.name}</label>)}</fieldset>
      <div className="actions"><button type="submit">Grant</button></div>
    </form>}
    <Problem error={error} />
  </section>
}
