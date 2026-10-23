import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

export function FinancingSettings({ s, run }: { s: Glove; run: Run }) {
  const [merchant, setMerchant] = useState(''), [token, setToken] = useState(''), [minimum, setMinimum] = useState('1000.00'), { error, act } = useAction()
  if (!can(s.actor, 'financing.connect')) return null
  return <section className="panel" aria-label="Wisetack financing"><h2>Wisetack financing</h2>
    <p>Test mode only. Glove never underwrites or lends. Customers enter personal and credit information on Wisetack; Glove sends only the chosen amount, service date and an opaque purchase reference after explicit consent.</p><Problem error={error} />
    <details><summary>{s.business[0]?.wisetack ? 'Change test connection' : 'Connect Wisetack test account'}</summary><form onSubmit={e => { e.preventDefault(); void act(run('financing.connect', { version: s.business[0].version, mode: 'test', merchantId: merchant, minimumAmount: minimum, authToken: token }), () => setToken('')) }}>
      <Field label="Wisetack test merchant reference">{p => <input {...p} value={merchant} onChange={e => setMerchant(e.target.value)} required />}</Field>
      <Field label="Wisetack test auth token">{p => <input {...p} type="password" autoComplete="new-password" value={token} onChange={e => setToken(e.target.value)} required />}</Field>
      <Field label="Financing minimum amount">{p => <input {...p} inputMode="decimal" value={minimum} onChange={e => setMinimum(e.target.value)} required />}</Field><button>Save test financing connection</button>
    </form></details>
    {s.financings.map(f => <article key={f.id}><h3>Quote {s.quotes.find(q => q.id === f.quoteId)?.number} · {money(f.amount)}</h3><p>Wisetack reports: {f.status}</p>{f.offer && <p>Provider offer range: APR {f.offer.aprRange}% · {f.offer.monthRange} months. Final terms are on Wisetack.</p>}
      {f.providerReference && <button onClick={() => act(run('financing.refresh', { financingId: f.id, version: f.version }))}>Refresh Wisetack status</button>}
      {f.status === 'unknown' && <p>Application outcome unknown. Inspect Wisetack before another request; Glove never automatically resends it.</p>}
    </article>)}
  </section>
}

export function CustomerFinancing({ quote, selected, respond, busy }: { quote: Rec; selected: boolean; respond: (action: string, extra: object) => Promise<void>; busy: boolean }) {
  const [consent, setConsent] = useState(false), [date, setDate] = useState('')
  if (!quote.financingAvailable && !quote.financing) return null
  return <section aria-label="Wisetack application"><h3>Financing through Wisetack</h3><p>Wisetack test mode. Glove never underwrites or lends.</p>
    {quote.financing ? <><p>Wisetack reports: {quote.financing.status}</p>{quote.financing.offer && <p>Provider offer range: APR {quote.financing.offer.aprRange}% · {quote.financing.offer.monthRange} months. Final terms are on Wisetack.</p>}
      {quote.financingUrl ? <p><a href={quote.financingUrl} target="_blank" rel="noreferrer">Continue on Wisetack test site</a></p> : <p>Contact the business about your application. Application links are shown once and are not kept by Glove.</p>}</> : quote.state === 'open' && <>
      <Field label="Expected service completion date">{p => <input {...p} type="date" value={date} onChange={e => setDate(e.target.value)} required />}</Field>
      <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I agree to send the chosen amount, service completion date and opaque purchase reference to Wisetack test mode. I will enter personal and credit information only on Wisetack.</label>
      <p>Choose and review your exact work first. Applying does not sign the quote or approve a loan.</p><button type="button" disabled={busy || !selected || !consent || !date} onClick={() => void respond('financing', { financingConsent: consent, serviceCompletedOn: date })}>Apply with Wisetack test mode</button>
    </>}
  </section>
}
