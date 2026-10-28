import { useState } from 'react'
import { roleName, when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { roleOptions } from './custom-roles'
import { branchName } from './branches'

// API-002, API-006, API-007 on the Team screen: the owner issues a named integration token acting
// as one role (optionally for one branch), sees it once, and revokes it.

const blank = { name: '', role: 'dispatcher', branchId: '' }
const fieldRoles = new Set(['owner', 'technician', 'subcontractor'])

export function IntegrationTokens({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState(blank)
  const [issued, setIssued] = useState<{ name: string; token: string } | null>(null)
  const { error, act } = useAction()
  const zone = s.business[0]?.timezone ?? 'UTC'
  const issue = () => act(run('token.issue', { name: form.name, role: form.role, ...(form.branchId ? { branchId: form.branchId } : {}) }), r => { setIssued({ name: r.name, token: r.token }); setForm(blank) })
  const tokens = s.integrationTokens ?? []
  return <section className="panel"><h2>Integration tokens</h2>
    <p className="muted">A token lets another system call Glove's documented doors as one role. Glove keeps only a fingerprint of it.</p>
    {issued && <div className="notice" role="status"><strong>Copy the token for {issued.name} now; Glove never shows it again.</strong><p><code className="secret">{issued.token}</code></p><button onClick={() => setIssued(null)}>I have copied it</button></div>}
    {!tokens.length ? <Empty title="No tokens yet">Issue one for each system that connects, so you can revoke it alone.</Empty> : <ul className="rows">{[...tokens].reverse().map((t: Rec) => <li key={t.id}><div><strong>{t.name}</strong> {t.revokedAt ? <Badge tone="grey">Revoked</Badge> : <Badge tone="green">Active</Badge>}
      <p className="muted">{[`Acts as ${roleName(t.role, s.roles)}`, t.branchId === null ? 'every branch' : t.branchId === 'main' ? 'Main business only' : `${branchName(s, t.branchId)} only`, `issued ${when(t.createdAt, zone)}`, t.lastUsedAt ? `last used ${when(t.lastUsedAt, zone)}` : 'never used', t.revokedAt && `revoked ${when(t.revokedAt, zone)}`].filter(Boolean).join(' · ')}</p></div>
      {!t.revokedAt && <button onClick={() => act(run('token.revoke', { tokenId: t.id }))}>Revoke</button>}</li>)}</ul>}
    <form onSubmit={e => { e.preventDefault(); void issue() }}>
      <h3>Issue a token</h3>
      <div className="form-grid">
        <Field label="Name">{p => <input {...p} value={form.name} maxLength={80} onChange={e => setForm({ ...form, name: e.target.value })} required />}</Field>
        <Field label="Acts as">{p => <select {...p} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{roleOptions(s).filter(o => !fieldRoles.has(String(o.props.value)))}</select>}</Field>
        {!!s.branches?.length && <Field label="Branch">{p => <select {...p} value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}><option value="">Every branch</option><option value="main">Main business only</option>{s.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</Field>}
      </div>
      <div className="actions"><button type="submit">Issue token</button></div>
    </form>
    <Problem error={error} />
  </section>
}
