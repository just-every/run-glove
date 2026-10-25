import { QuickBooksSettings } from './quickbooks'
import { InboxSettings } from './sms-inbox'
import { CalendarSync } from './calendar-sync'
import { WebsiteRequests } from './website-requests'
import { DocumentTemplates } from './documents'
import { CustomerEmailConnect } from './customer-email'
import { CustomerSmsConnect } from './customer-sms'
import { MessageTemplates } from './message-templates'
import { Plans } from './agreements'
import { TaxLookup } from './tax-lookup'
import { TaxFields, taxSettingsOf } from './tax-settings'
import { CompanyCamConnect } from './companycam'
import { MapsConnect } from './dispatch-map'
import { LeadSources } from './lead-connections'
import { Branches, BranchChoice, branchName, zones } from './branches'
import { useState } from 'react'
import { roleName, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { CustomRoles, roleOptions } from './custom-roles'
import { AgentGrants } from './agent-grants'
import { IntegrationTokens } from './integration-tokens'
import { Availability, CalendarLink, EligibilityRules, defaultRules } from './availability'
import { PriceBook } from './price-book'
import { Forms } from './forms'
import { ModelConnect, ManualLibrary } from './nameplates'
import { OwnerPush } from './push'
import { Payee, Crews } from './subcontract'
import { CostRate } from './costing'
import { PayrollId } from './timesheets'
import { IdentityFields, identityOf, identityPayload } from './identity'

// The business itself: settings and timezone, the price book with its
// checklists, the technicians, and who holds which role.


export function Team({ s, run, refresh }: { s: Glove; run: Run; refresh: () => Promise<void> }) {
  return <div className="page">
    <section className="titlebar"><div><h1>Team and settings</h1><p className="subtitle">Your business, price book, technicians and roles</p></div></section>
    <div className="two-col settings">
      <div>{can(s.actor, 'business.save') && <BusinessForm key={s.business[0]?.version ?? 0} s={s} run={run} />}<DocumentTemplates key={`documents-${s.business[0]?.version}`} s={s} run={run} /><Branches s={s} run={run} /><PriceBook s={s} run={run} /><Plans s={s} run={run} />{can(s.actor, 'form.save') && <Forms s={s} run={run} />}</div>
      <div><Technicians s={s} run={run} /><Crews s={s} run={run} />{s.actor.role === 'owner' && <><Roles s={s} run={run} refresh={refresh} /><CustomRoles s={s} run={run} /><AgentGrants s={s} run={run} /><IntegrationTokens s={s} run={run} /></>}<TaxLookup s={s} run={run} /><MapsConnect s={s} run={run} /><LeadSources s={s} run={run} /><WebsiteRequests key={`intake-${s.business[0]?.intake?.configId}`} s={s} run={run} /><QuickBooksSettings s={s} run={run} /><CompanyCamConnect s={s} run={run} /><CustomerEmailConnect s={s} run={run} /><CustomerSmsConnect s={s} run={run} /><InboxSettings s={s} run={run} /><MessageTemplates s={s} run={run} /><OwnerPush s={s} run={run} /><ModelConnect s={s} run={run} /><ManualLibrary s={s} run={run} /></div>
    </div>
  </div>
}

function BusinessForm({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0]
  const [form, setForm] = useState({ currency: b?.currency ?? 'USD', name: b?.name ?? '', abn: b?.abn ?? '', timezone: b?.timezone ?? 'America/Chicago', email: b?.email ?? '', phone: b?.phone ?? '', address: b?.address ?? '', paymentTermsDays: String(b?.paymentTermsDays ?? 14) })
  const [eligibility, setEligibility] = useState<Record<string, string>>({ ...defaultRules, ...(b?.eligibility ?? {}) })
  const [taxSettings, setTaxSettings] = useState(taxSettingsOf(b))
  const [identity, setIdentity] = useState(identityOf(b))
  // QUOTE-007: each role's maximum discount (blank gives none); the owner is unlimited.
  const [limits, setLimits] = useState<Record<string, string>>(b?.discountLimits ?? {})
  const limitRoles = ['dispatcher', 'office', 'agent', ...s.roles.map(r => `custom:${r.id}`)]
  const [watch, setWatch] = useState({ costPercent: b?.marginWatch?.costPercent ?? '', marginFloor: b?.marginWatch?.marginFloor ?? '' })
  const { error, act } = useAction()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('business.save', { ...form, taxSettings, ...(b ? identityPayload(identity) : {}), eligibility, marginWatch: watch, ...(b ? { discountLimits: Object.fromEntries(Object.entries(limits).filter(([, v]) => v !== '')) } : {}), paymentTermsDays: Number(form.paymentTermsDays), ...(b ? { version: b.version } : {}) })) }}>
    <h2>{b ? 'Business' : 'Set up your business'}</h2>
    {!b && <p className="muted">Start here: your business name and the timezone your visits are booked in.</p>}
    <div className="form-grid two">
      <Field label="Business name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
      <Field label="Tax ID (EIN)">{p => <input {...p} value={form.abn} onChange={set('abn')} />}</Field>
      {!b && <Field label="Billing currency">{p => <select {...p} value={form.currency} onChange={set('currency')}><option value="USD">USD · US sales tax</option><option value="AUD">AUD · Australian GST</option></select>}</Field>}
      <Field label="Timezone for bookings">{p => <select {...p} value={form.timezone} onChange={set('timezone')}>{zones.map(z => <option key={z}>{z}</option>)}</select>}</Field>
      <Field label="Email">{p => <input {...p} type="email" value={form.email} onChange={set('email')} />}</Field>
      <Field label="Phone">{p => <input {...p} value={form.phone} onChange={set('phone')} />}</Field>
      <Field label="Invoice payment terms (days)">{p => <input {...p} type="number" min="0" max="120" value={form.paymentTermsDays} onChange={set('paymentTermsDays')} />}</Field>
    </div>
    {b && <IdentityFields b={b} value={identity} onChange={setIdentity} />}
    {b && <><h3>Margin warnings on open jobs</h3><p className="muted">Shown to you and your dispatchers in Glove, once per crossing. Leave blank for none.</p><div className="form-grid two">
      <Field label="Warn when actual cost reaches (% of estimate)">{p => <input {...p} inputMode="decimal" value={watch.costPercent} onChange={e => setWatch({ ...watch, costPercent: e.target.value })} />}</Field>
      <Field label="Warn when projected margin falls below (%)">{p => <input {...p} inputMode="decimal" value={watch.marginFloor} onChange={e => setWatch({ ...watch, marginFloor: e.target.value })} />}</Field>
    </div></>}
    {b && <><h3>Discounts</h3><p className="muted">The most each role may discount, as a percent of a document’s subtotal (discount lines and the document discount together). Leave blank for no discounts; you are unlimited.</p><div className="form-grid two">
      {limitRoles.map(role => <Field key={role} label={`${roleName(role, s.roles)} discount limit (%)`}>{p => <input {...p} inputMode="decimal" value={limits[role] ?? ''} onChange={e => setLimits({ ...limits, [role]: e.target.value })} />}</Field>)}
    </div></>}
    {b && <><h3>When booking a technician who…</h3><div className="form-grid two"><EligibilityRules value={eligibility} onChange={setEligibility} /></div></>}
    {form.currency !== 'AUD' && <TaxFields value={taxSettings} onChange={setTaxSettings} />}
    <p className="muted">Currency: {b?.currency ?? form.currency}. Existing Australian installations retain their AUD and GST settings.</p>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Save business</button></div>
  </form>
}

function Technicians({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState({ name: '', operatorId: '', branchId: '' })
  const { error, act } = useAction()
  const people = s.operators.filter(o => o.role === 'technician' || o.role === 'subcontractor')
  return <section className="panel"><h2>Technicians</h2>
    {!s.technicians.length ? <Empty title="No technicians yet" /> : <ul className="rows">{s.technicians.map(t => <TechnicianRow key={t.id + t.version} s={s} t={t} run={run} />)}</ul>}
    {can(s.actor, 'technician.save') && <form onSubmit={e => { e.preventDefault(); void act(run('technician.save', { name: form.name, operatorId: form.operatorId || undefined, branchId: form.branchId }), () => setForm({ name: '', operatorId: '', branchId: '' })) }}>
      <h3>Add a technician</h3>
      <div className="form-grid">
        <BranchChoice s={s} value={form.branchId} onChange={branchId => setForm({ ...form, branchId })} /><Field label="Name on the board">{p => <input {...p} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}</Field>
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
  const people = s.operators.filter(o => o.role === 'technician' || o.role === 'subcontractor')
  // One technician per row: name, tags and actions on one line, who they sign in as, then their controls at full width.
  return <li className="technician-row">
    <div className="technician-head"><strong>{t.name}</strong>{s.branches.length > 0 && <span className="muted">{branchName(s, t.branchId)}</span>}{t.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Inactive</Badge>}{t.source && <Badge tone="grey">ServiceM8</Badge>}
      <span className="technician-actions">{can(s.actor, 'technician.save') && !editing && <button onClick={() => setEditing(true)}>Availability</button>}
        {s.actor.role === 'owner' && !t.operatorId && people.length > 0 && <select className="link-signin" aria-label={`Link ${t.name} to a sign-in`} defaultValue="" onChange={e => e.target.value && act(run('technician.save', { id: t.id, version: t.version, name: t.name, operatorId: e.target.value, active: t.active }))}><option value="">Link sign-in…</option>{people.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>}</span></div>
    <p className="muted">{[t.operatorId ? `Signs in as ${s.operators.find(o => o.id === t.operatorId)?.name ?? 'a team member'}` : 'Not linked to a sign-in yet', t.skills?.length ? `Skills: ${t.skills.join(', ')}` : '', t.zips?.length ? `ZIP codes: ${t.zips.join(', ')}` : '', t.costRate ? `Loaded cost $${t.costRate} per hour` : ''].filter(Boolean).join(' · ')}</p>
    <div className="technician-controls"><CostRate s={s} t={t} run={run} /><Payee s={s} t={t} run={run} /><PayrollId key={`payroll-${t.version}`} s={s} t={t} run={run} />{s.actor.role === 'owner' && <><CalendarLink key={t.version} t={t} run={run} /><CalendarSync key={`sync-${t.version}`} t={t} run={run} /></>}</div>
    <Problem error={error} />{editing && <Availability t={t} run={run} done={() => setEditing(false)} />}
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
    <table className="table"><thead><tr><th>Person</th><th>Role</th><th>Branch access</th></tr></thead><tbody>{s.operators.map(o => <tr key={o.id}><td>{o.name}{o.status === 'invited' && <> <Badge tone="gold">Invited</Badge></>}<br /><span className="muted">{o.email}</span></td><td>{o.nativeRole === 'owner' ? 'Owner' : <select aria-label={`Role for ${o.name}`} value={o.role ?? 'viewer'} onChange={e => act(run('role.set', { operatorId: o.id, role: e.target.value }))}>{roleOptions(s)}</select>}</td><td>{o.nativeRole === 'owner' ? 'All branches' : <select aria-label={`Branch access for ${o.name}`} value={s.branchAccess.find(b => b.id === o.id && b.limited !== false)?.branchId ?? (s.branchAccess.some(b => b.id === o.id && b.limited !== false) ? 'main' : '')} onChange={e => act(run('branch.limit', { operatorId: o.id, branchId: e.target.value || null }))}><option value="">All branches</option><option value="main">Main business</option>{s.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</td></tr>)}</tbody></table>
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
