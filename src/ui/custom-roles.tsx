import { useState } from 'react'
import { roleName, type Glove, type Rec, type Run } from './api'
import { Empty, Field, Problem, useAction } from './controls'

// Custom roles (TEAM-001): the owner builds a role from named permissions and
// gives it to people like a built-in role. The server enforces every one.

const builtIn = ['dispatcher', 'technician', 'subcontractor', 'office', 'agent', 'viewer']

/** Role choices for a person: the built-in roles, then the owner's custom roles. */
export const roleOptions = (s: Glove) => [...builtIn.map(r => <option key={r} value={r}>{roleName(r)}</option>), ...s.roles.map(r => <option key={r.id} value={`custom:${r.id}`}>{r.name}</option>)]

const label = (permission: string) => ({ 'reports.read': 'See job costs, margins and reports', 'export.read': 'Download the business export and invoice CSVs' }[permission] ?? permission)

export function CustomRoles({ s, run }: { s: Glove; run: Run }) {
  const [editing, setEditing] = useState<Rec | null>(null)
  return <section className="panel"><h2>Custom roles</h2>
    <p className="muted">Build a role from named permissions, such as a CSR who books visits but cannot see margins. Everyone in a custom role reads the desk's records.</p>
    {!s.roles.length ? <Empty title="No custom roles yet" /> : <ul className="rows">{s.roles.map(r => <li key={r.id}><div><strong>{r.name}</strong><p className="muted">{r.permissions.length ? r.permissions.map(label).join(', ') : 'Read only'}</p></div><button onClick={() => setEditing(r)}>Edit</button></li>)}</ul>}
    <RoleForm key={editing ? `${editing.id}-${editing.version}` : 'new'} s={s} run={run} role={editing} done={() => setEditing(null)} />
  </section>
}

function RoleForm({ s, run, role, done }: { s: Glove; run: Run; role: Rec | null; done: () => void }) {
  const [name, setName] = useState(role?.name ?? '')
  const [held, setHeld] = useState<string[]>(role?.permissions ?? [])
  const { error, act } = useAction()
  const toggle = (p: string) => setHeld(held.includes(p) ? held.filter(x => x !== p) : [...held, p])
  return <form onSubmit={e => { e.preventDefault(); void act(run('role.save', { ...(role ? { id: role.id, version: role.version } : {}), name, permissions: held }), () => { setName(''); setHeld([]); done() }) }}>
    <h3>{role ? `Edit ${role.name}` : 'Build a role'}</h3>
    <Field label="Role name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required />}</Field>
    <fieldset className="form-grid"><legend>Permissions</legend>
      {(s.grantable ?? []).map(p => <label key={p} className="check-line"><input type="checkbox" checked={held.includes(p)} onChange={() => toggle(p)} /> {label(p)}</label>)}
    </fieldset>
    <Problem error={error} />
    <div className="actions">{role && <button type="button" className="quiet" onClick={done}>Cancel</button>}<button type="submit">{role ? 'Save role' : 'Add role'}</button></div>
  </form>
}
