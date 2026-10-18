import { useState } from 'react'
import { byId, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, useAction } from './controls'
import { can } from './roles'
import { ExpiringWarranties, SiteEquipment } from './equipment'

// Customers, the sites where the work happens and the equipment installed there.

const blank = { name: '', abn: '', contact: '', email: '', phone: '', billingAddress: '' }

export function Customers({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState<string | null>(null)
  const customer = byId(s.customers, open)
  return <div className="page">
    <section className="titlebar"><div><h1>Customers</h1><p className="subtitle">Who you work for and where</p></div>
      <div className="date-actions">{can(s.actor.role, 'customer.save') && <button className="primary" onClick={() => setOpen('new')}>New customer</button>}</div></section>
    <div className="two-col">
      <div><ExpiringWarranties s={s} /><section className="panel"><h2>Customers</h2>
        {!s.customers.length ? <Empty title="No customers yet">Add your first customer, or move in from ServiceM8 under More.</Empty> :
          <table className="table"><thead><tr><th>Customer</th><th>Contact</th><th>Sites</th></tr></thead><tbody>
            {s.customers.map(c => <tr key={c.id} className={open === c.id ? 'selected' : ''}><td><button className="link-button" onClick={() => setOpen(c.id)}>{c.name}</button>{c.archived && <> <Badge tone="grey">Archived</Badge></>}{c.source && <> <Badge tone="grey">ServiceM8</Badge></>}</td><td>{c.contact || c.email}</td><td>{s.sites.filter(x => x.customerId === c.id).length}</td></tr>)}
          </tbody></table>}
      </section></div>
      <div>
        {open === 'new' && <CustomerForm key="new" s={s} run={run} done={id => setOpen(id)} />}
        {customer && <><CustomerForm key={customer.id + customer.version} s={s} run={run} customer={customer} done={() => {}} /><Sites s={s} run={run} customer={customer} /><SiteEquipment key={customer.id + s.sites.length} s={s} run={run} customer={customer} /></>}
      </div>
    </div>
  </div>
}

function CustomerForm({ s, run, customer, done }: { s: Glove; run: Run; customer?: Rec; done: (id: string) => void }) {
  const [form, setForm] = useState(customer ? { name: customer.name, abn: customer.abn ?? '', contact: customer.contact ?? '', email: customer.email ?? '', phone: customer.phone ?? '', billingAddress: customer.billingAddress ?? '' } : blank)
  const { error, act } = useAction()
  const set = (key: keyof typeof blank) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const editable = can(s.actor.role, 'customer.save')
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('customer.save', customer ? { ...form, id: customer.id, version: customer.version } : form), c => done(c.id)) }}>
    <h2>{customer ? customer.name : 'New customer'}</h2>
    <fieldset disabled={!editable} className="form-grid">
      <Field label="Name">{p => <input {...p} value={form.name} onChange={set('name')} required />}</Field>
      <Field label="Tax ID (optional)">{p => <input {...p} value={form.abn} onChange={set('abn')} />}</Field>
      <Field label="Contact person">{p => <input {...p} value={form.contact} onChange={set('contact')} />}</Field>
      <Field label="Email for quotes and invoices">{p => <input {...p} type="email" value={form.email} onChange={set('email')} />}</Field>
      <Field label="Phone">{p => <input {...p} value={form.phone} onChange={set('phone')} />}</Field>
      <Field label="Billing address">{p => <input {...p} value={form.billingAddress} onChange={set('billingAddress')} />}</Field>
    </fieldset>
    {customer?.source && <p className="muted">Moved in from {customer.source.system} (ID {customer.source.id})</p>}
    {customer?.contacts?.length > 1 && <p className="muted">Other contacts from ServiceM8: {customer!.contacts.slice(1).map((c: Rec) => c.name).join(', ')}</p>}
    <Problem error={error} />
    {editable && <div className="actions"><button className="primary" type="submit">{customer ? 'Save changes' : 'Add customer'}</button></div>}
  </form>
}

function Sites({ s, run, customer }: { s: Glove; run: Run; customer: Rec }) {
  const [form, setForm] = useState({ address: '', accessNotes: '' })
  const { error, act } = useAction()
  const sites = s.sites.filter(x => x.customerId === customer.id)
  return <section className="panel"><h2>Sites</h2>
    {!sites.length ? <Empty title="No sites yet">Add the address where the work happens.</Empty> : <ul className="rows">{sites.map(x => <li key={x.id}><div><strong>{x.address}</strong>{x.accessNotes && <p className="muted">Access: {x.accessNotes}</p>}</div></li>)}</ul>}
    {can(s.actor.role, 'site.save') && <form onSubmit={e => { e.preventDefault(); void act(run('site.save', { customerId: customer.id, ...form }), () => setForm({ address: '', accessNotes: '' })) }}>
      <div className="form-grid">
        <Field label="Site address">{p => <input {...p} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />}</Field>
        <Field label="Access notes (optional)">{p => <input {...p} value={form.accessNotes} onChange={e => setForm({ ...form, accessNotes: e.target.value })} />}</Field>
      </div>
      <Problem error={error} />
      <div className="actions"><button type="submit">Add site</button></div>
    </form>}
  </section>
}
