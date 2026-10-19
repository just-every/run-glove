import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

export const zones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart']

export function BranchChoice({ s, value, onChange, label = 'Branch' }: { s: Glove; value: string; onChange: (id: string) => void; label?: string }) {
  if (!s.branches?.length) return null
  return <Field label={label}>{p => <select {...p} value={value} onChange={e => onChange(e.target.value)}><option value="">Main business</option>{s.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</Field>
}

export const branchName = (s: Glove, id?: string | null) => s.branches?.find(b => b.id === id)?.name ?? 'Main business'

/** A visit keeps its booked zone even after branch settings change. */
export function recordZone(s: Glove, record?: Rec): string {
  if (record?.local?.timezone) return record.local.timezone
  const site = record?.siteId ? s.sites.find(x => x.id === record.siteId) : undefined
  const branchId = record?.branchId ?? site?.branchId
  return s.branches?.find(b => b.id === branchId)?.timezone ?? s.business[0]?.timezone ?? 'Australia/Sydney'
}

export function Branches({ s, run }: { s: Glove; run: Run }) {
  const [adding, setAdding] = useState(false)
  if (!s.business.length || s.actor.role !== 'owner') return null
  return <section className="panel"><h2>Branches</h2><p className="muted">Separate booking time zones, service ZIP codes and document numbers. Branch access limits and US tax settings are still being built; all desk staff can currently see every branch.</p>
    {s.branches.map(b => <BranchForm key={b.id + b.version} branch={b} run={run} />)}
    {adding ? <BranchForm run={run} done={() => setAdding(false)} /> : <button onClick={() => setAdding(true)}>Add branch</button>}
  </section>
}

function BranchForm({ branch: b, run, done }: { branch?: Rec; run: Run; done?: () => void }) {
  const [v, setV] = useState({ name: b?.name ?? '', timezone: b?.timezone ?? 'America/Chicago', prefix: b?.prefix ?? '', zips: (b?.zips ?? []).join(', ') })
  const { error, act } = useAction()
  const field = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  return <form aria-label={b ? `Branch ${b.name}` : 'New branch'} onSubmit={e => { e.preventDefault(); void act(run('branch.save', { ...v, zips: v.zips.split(/[\s,]+/).filter(Boolean), ...(b ? { id: b.id, version: b.version } : {}) }), () => done?.()) }}>
    <h3>{b?.name ?? 'New branch'}</h3><div className="form-grid two">
      <Field label="Branch name">{p => <input {...p} value={v.name} onChange={field('name')} required />}</Field>
      <Field label="Branch time zone">{p => <select {...p} value={v.timezone} onChange={field('timezone')}>{[...new Set([...zones, v.timezone])].map(z => <option key={z}>{z}</option>)}</select>}</Field>
      <Field label="Number prefix" hint="For example DAL gives DAL-INV-0001. Fixed after the first number.">{p => <input {...p} value={v.prefix} onChange={field('prefix')} pattern="[A-Za-z][A-Za-z0-9]{0,11}" required />}</Field>
      <Field label="Service ZIP codes" hint="Comma separated; leave empty for any area. Uses your booking area warning or refusal rule.">{p => <input {...p} value={v.zips} onChange={field('zips')} />}</Field>
    </div><Problem error={error} /><div className="actions"><button type="submit">Save branch</button>{done && <button type="button" onClick={done}>Cancel</button>}</div>
  </form>
}
