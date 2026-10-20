import { useState, type ReactNode } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

export function TaxLookup({ s, run }: { s: Glove; run: Run }) {
  if (s.actor.role !== 'owner') return null
  return <><StripeLookup s={s} run={run} /><AvataxLookup s={s} run={run} /></>
}

function StripeLookup({ s, run }: { s: Glove; run: Run }) {
  const [key, setKey] = useState('')
  const { error, act } = useAction()
  const connected = s.business[0]?.taxLookup?.connected
  return <section className="panel" aria-label="Optional Stripe Tax lookup"><h2>Optional Stripe Tax lookup</h2><p className="muted">Requires your Stripe Tax registrations. Only the service address and two $100 sample classifications go to Stripe. Customer identity and exemption documents stay here. You review and apply any proposed rate yourself.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('tax.connect', { key }), () => setKey('')) }}><Field label="Stripe Tax secret key">{p => <input {...p} type="password" value={key} autoComplete="new-password" onChange={e => setKey(e.target.value)} required />}</Field><button type="submit">Connect Stripe Tax lookup</button>{connected && <button type="button" onClick={() => act(run('tax.connect', { key: null }))}>Disconnect tax lookup</button>}</form>
    {connected && <AddressLookup s={s} run={run} provider="stripe" initialCode="txcd_20080007" code={(value, set) => <Field label="Stripe service classification">{p => <select {...p} value={value} onChange={e => set(e.target.value)}><option value="txcd_20080007">Real-property repairs (HVAC / electrical)</option><option value="txcd_20020010">Permanent hardware installation labor</option><option value="txcd_20020018">Separately stated property installation</option><option value="txcd_20030000">General services</option></select>}</Field>} />}
    <Problem error={error} />
  </section>
}

function AvataxLookup({ s, run }: { s: Glove; run: Run }) {
  const blank = { accountId: '', licenseKey: '', companyCode: '', environment: 'production' }
  const [key, setKey] = useState(blank)
  const { error, act } = useAction()
  const connected = s.business[0]?.avataxLookup?.connected
  return <section className="panel" aria-label="Optional Avalara AvaTax lookup"><h2>Optional Avalara AvaTax lookup</h2><p className="muted">Requires your AvaTax nexus. Only the service address and two $100 sample lines go to Avalara, as an uncommitted sales order. Customer identity and exemption documents stay here. You review and apply any proposed rate yourself.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('tax.connect', { provider: 'avatax', key }), () => setKey(blank)) }}><div className="form-grid two">
      <Field label="AvaTax account ID">{p => <input {...p} inputMode="numeric" value={key.accountId} onChange={e => setKey({ ...key, accountId: e.target.value })} required />}</Field>
      <Field label="AvaTax license key">{p => <input {...p} type="password" value={key.licenseKey} autoComplete="new-password" onChange={e => setKey({ ...key, licenseKey: e.target.value })} required />}</Field>
      <Field label="AvaTax company code">{p => <input {...p} value={key.companyCode} onChange={e => setKey({ ...key, companyCode: e.target.value })} required />}</Field>
      <Field label="AvaTax environment">{p => <select {...p} value={key.environment} onChange={e => setKey({ ...key, environment: e.target.value })}><option value="production">Production</option><option value="sandbox">Sandbox</option></select>}</Field>
    </div><button type="submit">Connect AvaTax lookup</button>{connected && <button type="button" onClick={() => act(run('tax.connect', { provider: 'avatax', key: null }))}>Disconnect AvaTax lookup</button>}</form>
    {connected && <AddressLookup s={s} run={run} provider="avatax" initialCode="" code={(value, set) => <Field label="AvaTax service tax code" hint="The tax code your Avalara account uses for this service.">{p => <input {...p} value={value} onChange={e => set(e.target.value.toUpperCase())} required />}</Field>} />}
    <Problem error={error} />
  </section>
}

function AddressLookup({ s, run, provider, initialCode, code }: { s: Glove; run: Run; provider: 'stripe' | 'avatax'; initialCode: string; code: (value: string, set: (v: string) => void) => ReactNode }) {
  const [result, setResult] = useState<Rec | null>(null)
  const [form, setForm] = useState({ siteId: '', line1: '', city: '', state: '', postal_code: '', serviceTaxCode: initialCode })
  const { error, act } = useAction()
  const reasons = (line: Rec) => line.breakdown.map((b: Rec) => `${b.reason} ${b.rate ?? ''}%`).join(', ') || (line.status === 200 ? 'no taxing jurisdiction returned' : `HTTP ${line.status || 'unconfirmed'}`)
  return <>
    <form onSubmit={e => { e.preventDefault(); void act(run('tax.lookup', { provider, siteId: form.siteId, address: { line1: form.line1, city: form.city, state: form.state, postal_code: form.postal_code }, serviceTaxCode: form.serviceTaxCode }), setResult) }}><div className="form-grid two">
      <Field label="Lookup service site">{p => <select {...p} value={form.siteId} onChange={e => { const site = s.sites.find(x => x.id === e.target.value); setForm({ ...form, siteId: e.target.value, line1: site?.address ?? '', postal_code: site?.zip ?? '' }) }} required><option value="">Choose site</option>{s.sites.map(site => <option key={site.id} value={site.id}>{site.address}</option>)}</select>}</Field>
      {([['line1', 'Service street'], ['city', 'Service city'], ['state', 'Service state'], ['postal_code', 'Service ZIP']] as const).map(([k, label]) => <Field key={k} label={label}>{p => <input {...p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />}</Field>)}
      {code(form.serviceTaxCode, v => setForm({ ...form, serviceTaxCode: v }))}
    </div><button type="submit">Look up address rates</button></form>
    {result && <div role="status"><p>{result.label}</p>{result.proposal && <p>{result.proposal.name}: {result.proposal.rate}%; service labor {result.proposal.taxLabor ? 'taxable' : 'exempt for the selected classification'}. Add these reviewed values to the matching branch’s jurisdictions above.</p>}<p className="muted">Parts: {reasons(result.parts)}. Service: {reasons(result.labor)}.</p></div>}
    <Problem error={error} />
  </>
}
