import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

export function TaxLookup({ s, run }: { s: Glove; run: Run }) {
  const [key, setKey] = useState(''), [result, setResult] = useState<Rec | null>(null)
  const [form, setForm] = useState({ siteId: '', line1: '', city: '', state: '', postal_code: '', serviceTaxCode: 'txcd_20080007' })
  const { error, act } = useAction()
  if (s.actor.role !== 'owner') return null
  const connected = s.business[0]?.taxLookup?.connected
  return <section className="panel" aria-label="Optional Stripe Tax lookup"><h2>Optional Stripe Tax lookup</h2><p className="muted">Requires your Stripe Tax registrations. Only the service address and two $100 sample classifications go to Stripe. Customer identity and exemption documents stay here. You review and apply any proposed rate yourself.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('tax.connect', { key }), () => setKey('')) }}><Field label="Stripe Tax secret key">{p => <input {...p} type="password" value={key} autoComplete="new-password" onChange={e => setKey(e.target.value)} required />}</Field><button type="submit">Connect Stripe Tax lookup</button>{connected && <button type="button" onClick={() => act(run('tax.connect', { key: null }))}>Disconnect tax lookup</button>}</form>
    {connected && <form onSubmit={e => { e.preventDefault(); void act(run('tax.lookup', { siteId: form.siteId, address: { line1: form.line1, city: form.city, state: form.state, postal_code: form.postal_code }, serviceTaxCode: form.serviceTaxCode }), setResult) }}><div className="form-grid two">
      <Field label="Lookup service site">{p => <select {...p} value={form.siteId} onChange={e => { const site = s.sites.find(x => x.id === e.target.value); setForm({ ...form, siteId: e.target.value, line1: site?.address ?? '', postal_code: site?.zip ?? '' }) }} required><option value="">Choose site</option>{s.sites.map(site => <option key={site.id} value={site.id}>{site.address}</option>)}</select>}</Field>
      {([['line1', 'Service street'], ['city', 'Service city'], ['state', 'Service state'], ['postal_code', 'Service ZIP']] as const).map(([k, label]) => <Field key={k} label={label}>{p => <input {...p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />}</Field>)}
      <Field label="Stripe service classification">{p => <select {...p} value={form.serviceTaxCode} onChange={e => setForm({ ...form, serviceTaxCode: e.target.value })}><option value="txcd_20080007">Real-property repairs (HVAC / electrical)</option><option value="txcd_20020010">Permanent hardware installation labor</option><option value="txcd_20020018">Separately stated property installation</option><option value="txcd_20030000">General services</option></select>}</Field>
    </div><button type="submit">Look up address rates</button></form>}
    {result && <div role="status"><p>{result.label}</p>{result.proposal && <p>{result.proposal.name}: {result.proposal.rate}%; service labor {result.proposal.taxLabor ? 'taxable' : 'exempt for the selected classification'}. Add these reviewed values to the matching branch’s jurisdictions above.</p>}<p className="muted">Parts: {result.parts.breakdown.map((b: Rec) => `${b.reason} ${b.rate ?? ''}%`).join(', ') || `HTTP ${result.parts.status || 'unconfirmed'}`}. Service: {result.labor.breakdown.map((b: Rec) => `${b.reason} ${b.rate ?? ''}%`).join(', ') || `HTTP ${result.labor.status || 'unconfirmed'}`}.</p></div>}
    <Problem error={error} />
  </section>
}
