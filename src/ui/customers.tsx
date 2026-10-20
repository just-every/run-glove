import { TaxExemption } from './tax-exemption'
import { TaxJurisdictionChoice, SiteTax } from './tax-settings'
import { BranchChoice, branchName } from './branches'
import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { ExpiringWarranties, SiteEquipment } from './equipment'
import { PropertyHistory, matches } from './property-history'
import { ServiceCallForm } from './service-call'
import { CustomValues, CustomerTags, FieldSettings, MarketingConnect, Segments } from './custom-fields'
import { Duplicates } from './duplicates'

// Customers, the sites where the work happens and the equipment installed
// there; a business customer's billing contact and accounts-payable email
// stay apart from each site's contact (CUST-001).

const blank = { name: '', kind: 'residential', abn: '', contact: '', email: '', phone: '', billingAddress: '', billingContact: '', apEmail: '', requirePo: false }
type Form = typeof blank
const contactLines = (contacts: Rec[] = []) => contacts.map(c => [c.name, c.role ?? c.type, c.phone, c.email].map(v => v ?? '').join(', ').replace(/(, )+$/, '')).join('\n')
const parseContacts = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [name = '', role = '', phone = '', email = ''] = l.split(',').map(v => v.trim()); return { name, role, phone, email } })

export function Customers({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const customer = byId(s.customers, open)
  const found = s.customers.filter(c => !c.mergedInto && matches(s, c, query))
  return <div className="page">
    <section className="titlebar"><div><h1>Customers</h1><p className="subtitle">Who you work for and where</p></div>
      <div className="date-actions">{s.actor.reads.includes('export') && <a className="button" href="/api/glove/customers.csv" download>Export CSV</a>}{can(s.actor, 'customer.save') && <button className="primary" onClick={() => setOpen('new')}>New customer</button>}</div></section>
    <div className="two-col">
      <div><ExpiringWarranties s={s} /><section className="panel"><h2>Customers</h2>
        {s.customers.length > 0 && <Field label="Search customers" hint="Name, phone, email or address">{p => <input {...p} type="search" value={query} onChange={e => setQuery(e.target.value)} />}</Field>}
        {!s.customers.length ? <Empty title="No customers yet">Add your first customer, or bring them in from ServiceM8 or a CSV under More.</Empty> : !found.length ? <Empty title="No customer matches">Try part of a phone number, a street or a name.</Empty> :
          <table className="table"><thead><tr><th>Customer</th><th>Contact</th><th>Sites</th></tr></thead><tbody>
            {found.map(c => <tr key={c.id} className={open === c.id ? 'selected' : ''}><td><button className="link-button" onClick={() => setOpen(c.id)}>{c.name}</button>{c.archived && <> <Badge tone="grey">Archived</Badge></>}{c.source && <> <Badge tone="grey">{c.source.system}</Badge></>}</td><td>{c.contact || c.email}</td><td>{s.sites.filter(x => x.customerId === c.id).length}</td></tr>)}
          </tbody></table>}
      </section><Segments s={s} run={run} /><FieldSettings s={s} run={run} /><MarketingConnect s={s} run={run} /></div>
      <div>
        {open === 'new' && <CustomerForm key="new" s={s} run={run} done={id => setOpen(id)} />}
        {customer && <><CustomerForm key={customer.id + customer.version} s={s} run={run} customer={customer} done={() => {}} /><TaxExemption key={`tax-${customer.id}-${customer.version}`} s={s} run={run} customer={customer} /><CustomerTags key={`tags-${customer.id}-${customer.version}`} s={s} run={run} customer={customer} /><CustomValues key={`custom-${customer.id}-${customer.version}`} s={s} run={run} kind="customers" row={customer} title="Customer fields" /><Duplicates s={s} run={run} customer={customer} /><Sites s={s} run={run} customer={customer} /><ServiceCallForm key={`call-${customer.id}`} s={s} run={run} customerId={customer.id} /><SiteEquipment key={customer.id + s.sites.length} s={s} run={run} customer={customer} /></>}
      </div>
    </div>
  </div>
}

function CustomerForm({ s, run, customer, done }: { s: Glove; run: Run; customer?: Rec; done: (id: string) => void }) {
  const [form, setForm] = useState<Form>(customer ? { name: customer.name, kind: customer.kind ?? 'residential', abn: customer.abn ?? '', contact: customer.contact ?? '', email: customer.email ?? '', phone: customer.phone ?? '', billingAddress: customer.billingAddress ?? '', billingContact: customer.billingContact ?? '', apEmail: customer.apEmail ?? '', requirePo: customer.requirePo === true } : blank)
  // Other contacts are sent only once edited, so moved-in contacts keep their source details.
  const [others, setOthers] = useState<string | null>(null)
  const { error, act } = useAction()
  const set = (key: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const editable = can(s.actor, 'customer.save')
  const payload = { ...form, ...(others !== null ? { contacts: parseContacts(others) } : {}) }
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('customer.save', customer ? { ...payload, id: customer.id, version: customer.version } : payload), c => done(c.id)) }}>
    <h2>{customer ? customer.name : 'New customer'}</h2>
    <fieldset disabled={!editable} className="form-grid">
      <Field label="Name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
      <Field label="Tax ID (optional)">{p => <input {...p} value={form.abn} onChange={set('abn')} />}</Field>
      <Field label="Contact person">{p => <input {...p} value={form.contact} onChange={set('contact')} />}</Field>
      <Field label="Email for quotes and invoices">{p => <input {...p} type="email" value={form.email} onChange={set('email')} />}</Field>
      <Field label="Phone">{p => <input {...p} value={form.phone} onChange={set('phone')} />}</Field>
      <Field label="Billing address">{p => <input {...p} value={form.billingAddress} onChange={set('billingAddress')} />}</Field>
      <Field label="Customer type">{p => <select {...p} value={form.kind} onChange={set('kind')}><option value="residential">Residential</option><option value="business">Business</option></select>}</Field>
      {form.kind === 'business' && <>
        <Field label="Billing contact">{p => <input {...p} value={form.billingContact} onChange={set('billingContact')} />}</Field>
        <Field label="Accounts-payable email">{p => <input {...p} type="email" value={form.apEmail} onChange={set('apEmail')} />}</Field>
        <label className="check-line"><input type="checkbox" checked={form.requirePo} onChange={e => setForm({ ...form, requirePo: e.target.checked })} /> Requires a purchase-order number on invoices</label>
      </>}
      <Field label="Other contacts" hint="One per line: name, role, phone, email">{p => <textarea {...p} value={others ?? contactLines(customer?.contacts)} onChange={e => setOthers(e.target.value)} />}</Field>
    </fieldset>
    {customer?.source && <p className="muted">Moved in from {customer.source.system} (ID {customer.source.id})</p>}
    <Problem error={error} />
    {editable && <div className="actions"><button className="primary" type="submit">{customer ? 'Save changes' : 'Add customer'}</button></div>}
  </form>
}

const blankSite = { taxJurisdictionId: '', branchId: '', address: '', accessNotes: '', contact: '', contactPhone: '' }

function Sites({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [form, setForm] = useState(blankSite)
  const [history, setHistory] = useState<string | null>(null)
  const { error, act } = useAction()
  const sites = s.sites.filter(x => x.customerId === customer.id)
  const shown = byId(sites, history)
  const set = (key: keyof typeof blankSite) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  return <section className="panel"><h2>Sites</h2>
    {!sites.length ? <Empty title="No sites yet">Add the address where the work happens.</Empty> : <ul className="rows">{sites.map(x => <li key={x.id}><div><strong>{x.address}</strong>{s.branches.length > 0 && <p className="muted">{branchName(s, x.branchId)}</p>}{x.contact && <p className="muted">Site contact: {[x.contact, x.contactPhone].filter(Boolean).join(' · ')}</p>}{x.accessNotes && <p className="muted">Access: {x.accessNotes}</p>}<CustomValues key={x.id + x.version} s={s} run={run} kind="sites" row={x} title={`Site fields for ${x.address}`} /><SiteTax key={x.id + x.version} s={s} run={run} site={x} /></div><button aria-expanded={history === x.id} aria-label={`History at ${x.address}`} onClick={() => setHistory(history === x.id ? null : x.id)}>History</button></li>)}</ul>}
    {shown && <PropertyHistory s={s} site={shown} />}
    {can(s.actor, 'site.save') && <form onSubmit={e => { e.preventDefault(); void act(run('site.save', { customerId: customer.id, ...form }), () => setForm(blankSite)) }}>
      <div className="form-grid">
        <BranchChoice s={s} value={form.branchId} onChange={branchId => setForm({ ...form, branchId, taxJurisdictionId: '' })} /><Field label="Site address">{p => <input {...p} value={form.address} onChange={set('address')} required />}</Field>
        <TaxJurisdictionChoice s={s} branchId={form.branchId} value={form.taxJurisdictionId} onChange={taxJurisdictionId => setForm({ ...form, taxJurisdictionId })} /><Field label="Access notes (optional)">{p => <input {...p} value={form.accessNotes} onChange={set('accessNotes')} />}</Field>
        <Field label="Site contact (optional)">{p => <input {...p} value={form.contact} onChange={set('contact')} />}</Field>
        <Field label="Site contact phone (optional)">{p => <input {...p} value={form.contactPhone} onChange={set('contactPhone')} />}</Field>
      </div>
      <Problem error={error} />
      <div className="actions"><button type="submit">Add site</button></div>
    </form>}
  </section>
}
