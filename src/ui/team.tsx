import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { CustomRoles, roleOptions } from './custom-roles'
import { AgentGrants } from './agent-grants'
import { Availability, CalendarLink, EligibilityRules, defaultRules } from './availability'
import { PriceBook } from './price-book'

// The business itself: settings and timezone, the price book with its
// checklists, the technicians, and who holds which role.

const zones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Hobart']

export function Team({ s, run, refresh }: { s: Glove; run: Run; refresh: () => Promise<void> }) {
  return <div className="page">
    <section className="titlebar"><div><h1>Team and settings</h1><p className="subtitle">Your business, price book, technicians and roles</p></div></section>
    <div className="two-col settings">
      <div>{can(s.actor, 'business.save') && <BusinessForm key={s.business[0]?.version ?? 0} s={s} run={run} />}<PriceBook s={s} run={run} /></div>
      <div><Technicians s={s} run={run} />{s.actor.role === 'owner' && <><Roles s={s} run={run} refresh={refresh} /><CustomRoles s={s} run={run} /><AgentGrants s={s} run={run} /></>}</div>
    </div>
  </div>
}

function BusinessForm({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0]
  const [form, setForm] = useState({ name: b?.name ?? '', abn: b?.abn ?? '', timezone: b?.timezone ?? 'America/Chicago', email: b?.email ?? '', phone: b?.phone ?? '', address: b?.address ?? '', paymentTermsDays: String(b?.paymentTermsDays ?? 14) })
  const [eligibility, setEligibility] = useState<Record<string, string>>({ ...defaultRules, ...(b?.eligibility ?? {}) })
  const { error, act } = useAction()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('business.save', { ...form, eligibility, paymentTermsDays: Number(form.paymentTermsDays), ...(b ? { version: b.version } : {}) })) }}>
    <h2>{b ? 'Business' : 'Set up your business'}</h2>
    {!b && <p className="muted">Start here: your business name and the timezone your visits are booked in.</p>}
    <div className="form-grid two">
      <Field label="Business name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
      <Field label="Tax ID (EIN)">{p => <input {...p} value={form.abn} onChange={set('abn')} />}</Field>
      <Field label="Timezone for bookings">{p => <select {...p} value={form.timezone} onChange={set('timezone')}>{zones.map(z => <option key={z}>{z}</option>)}</select>}</Field>
      <Field label="Email">{p => <input {...p} type="email" value={form.email} onChange={set('email')} />}</Field>
      <Field label="Phone">{p => <input {...p} value={form.phone} onChange={set('phone')} />}</Field>
      <Field label="Invoice payment terms (days)">{p => <input {...p} type="number" min="0" max="120" value={form.paymentTermsDays} onChange={set('paymentTermsDays')} />}</Field>
    </div>
    {b && <><h3>When booking a technician who…</h3><div className="form-grid two"><EligibilityRules value={eligibility} onChange={setEligibility} /></div></>}
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Save business</button></div>
  </form>
}

function Technicians({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState({ name: '', operatorId: '' })
  const { error, act } = useAction()
  const people = s.operators.filter(o => o.role === 'technician')
  return <section className="panel"><h2>Technicians</h2>
    {!s.technicians.length ? <Empty title="No technicians yet" /> : <ul className="rows">{s.technicians.map(t => <TechnicianRow key={t.id + t.version} s={s} t={t} run={run} />)}</ul>}
    {can(s.actor, 'technician.save') && <form onSubmit={e => { e.preventDefault(); void act(run('technician.save', { name: form.name, operatorId: form.operatorId || undefined }), () => setForm({ name: '', operatorId: '' })) }}>
      <h3>Add a technician</h3>
      <div className="form-grid">
        <Field label="Name on the board">{p => <input {...p} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}</Field>
        {s.actor.role === 'owner' && <Field label="Signs in as (optional)">{p => <select {...p} value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })}><option value="">Not yet</option>{people.map(o => <option key={o.id} value={o.id}>{o.name} · {o.email}</option>)}</select>}</Field>}
      </div>
      <Problem error={error} />
      <div className="actions"><button type="submit">Add technician</button></div>
    </form>}
  </section>
}

function TechnicianRow({ s, t, run }: { s: Glove; t: Rec; run: Run }) {
  const { error, act } = useAction()
  const [editing, setEditing] = useState(false)
  const people = s.operators.filter(o => o.role === 'technician')
  return <li><div><strong>{t.name}</strong> {t.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Inactive</Badge>} {t.source && <Badge tone="grey">ServiceM8</Badge>}
    <p className="muted">{t.operatorId ? `Signs in as ${s.operators.find(o => o.id === t.operatorId)?.name ?? 'a team member'}` : 'Not linked to a sign-in yet'}</p>
    {(t.skills?.length > 0 || t.zips?.length > 0) && <p className="muted">{[t.skills?.length ? `Skills: ${t.skills.join(', ')}` : '', t.zips?.length ? `ZIP codes: ${t.zips.join(', ')}` : ''].filter(Boolean).join(' · ')}</p>}
    <Problem error={error} />{editing && <Availability t={t} run={run} done={() => setEditing(false)} />}</div>
    {can(s.actor, 'technician.save') && !editing && <button onClick={() => setEditing(true)}>Availability</button>}
    {s.actor.role === 'owner' && <CalendarLink key={t.version} t={t} run={run} />}
    {s.actor.role === 'owner' && !t.operatorId && people.length > 0 && <select className="link-signin" aria-label={`Link ${t.name} to a sign-in`} defaultValue="" onChange={e => e.target.value && act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: e.target.value, active: t.active }))}><option value="">Link sign-in…</option>{people.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>}
  </li>
}

function Roles({ s, run, refresh }: { s: Glove; run: Run; refresh: () => Promise<void> }) {
  const { error, setError, act } = useAction()
  const [invite, setInvite] = useState({ displayName: '', email: '', role: 'technician' })
  async function send() {
    const response = await fetch('/auth/invite', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: invite.email, displayName: invite.displayName, role: 'member' }) })
    if (response.status !== 202) { const body: any = await response.json().catch(() => ({})); setError({ code: 'INVITE', message: body.message ?? body.error ?? 'The invitation could not be sent.' }); return }
    const state: any = await fetch('/api/glove/state', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json())
    const person = state.operators?.find((o: Rec) => o.email === invite.email.toLowerCase() || o.email === invite.email)
    if (person) await act(run('role.set', { operatorId: person.id, role: invite.role }))
    else await refresh()
    setInvite({ displayName: '', email: '', role: invite.role })
  }
  return <section className="panel"><h2>People and roles</h2>
    <table className="table"><thead><tr><th>Person</th><th>Role</th></tr></thead><tbody>{s.operators.map(o => <tr key={o.id}><td>{o.name}{o.status === 'invited' && <> <Badge tone="gold">Invited</Badge></>}<br /><span className="muted">{o.email}</span></td><td>{o.nativeRole === 'owner' ? 'Owner' : <select aria-label={`Role for ${o.name}`} value={o.role ?? 'viewer'} onChange={e => act(run('role.set', { operatorId: o.id, role: e.target.value }))}>{roleOptions(s)}</select>}</td></tr>)}</tbody></table>
    <form onSubmit={e => { e.preventDefault(); void send() }}>
      <h3>Invite someone</h3>
      <div className="form-grid">
        <Field label="Name">{p => <input {...p} value={invite.displayName} onChange={e => setInvite({ ...invite, displayName: e.target.value })} required />}</Field>
        <Field label="Email">{p => <input {...p} type="email" value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} required />}</Field>
        <Field label="Role">{p => <select {...p} value={invite.role} onChange={e => setInvite({ ...invite, role: e.target.value })}>{roleOptions(s)}</select>}</Field>
      </div>
      <p className="muted">They get a sign-in link by email. An agent signs in the same way and can only prepare work for a person to approve.</p>
      <div className="actions"><button className="primary" type="submit">Send invitation</button></div>
    </form>
    <Problem error={error} />
  </section>
}
