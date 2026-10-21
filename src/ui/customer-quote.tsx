import { DocumentIdentity, DocumentTools, DocumentTerms } from './documents'
import { DocumentImage } from './document-image'
import { useEffect, useState } from 'react'
import { Field, money } from './controls'
import type { Rec } from './api'
import './style'

export function CustomerQuote() {
  const [quote, setQuote] = useState<Rec | null>(null), [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const [name, setName] = useState(''), [capacity, setCapacity] = useState(''), [message, setMessage] = useState('')
  useEffect(() => {
    let controller: AbortController | undefined
    const read = () => {
      controller?.abort()
      controller = new AbortController()
      const current = controller
      setQuote(null); setError(''); setNotice(''); setName(''); setCapacity(''); setMessage(''); setBusy(false)
      const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
      setToken(value)
      if (!/^glq_[A-Za-z0-9_-]{43}$/.test(value)) { setError('This quote link is unavailable. Ask the business for a new link.'); return }
      fetch('/api/glove/public/quote', { signal: current.signal, credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${value}` } })
        .then(async r => { const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message); return b })
        .then(b => { if (!current.signal.aborted) setQuote(b) }).catch(e => { if (!current.signal.aborted) setError(e.message ?? 'The quote could not be read.') })
    }
    read()
    window.addEventListener('hashchange', read)
    return () => { window.removeEventListener('hashchange', read); controller?.abort() }
  }, [])
  const respond = async (action: string) => {
    const isCurrent = () => new URLSearchParams(window.location.hash.slice(1)).get('token') === token
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/api/glove/public/quote', { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ action, name, capacity, message }) })
      const b: any = await r.json()
      if (!isCurrent()) return
      if (!r.ok) throw new Error(b.error?.message)
      setQuote(b); setMessage(''); setNotice(action === 'changes' ? 'Your change request is with the office. You can keep using this link.' : action === 'update' ? 'The office has your request for an updated quote.' : 'Your decline is recorded. This revision is now read-only.')
    } catch (e) { if (isCurrent()) setError(e instanceof Error ? e.message : 'Reopen the quote to check your response.') }
    finally { if (isCurrent()) setBusy(false) }
  }
  const d = quote?.document
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 760, margin: '0 auto', boxSizing: 'border-box' }}><section style={{ overflowWrap: 'anywhere' }} aria-label="Your quote" className="panel printable-document">
    {d && <><DocumentTools /><DocumentIdentity business={d.business} token={token} /></>}<h1>{d ? `${d.template?.heading || 'Quote'} ${d.number}` : 'Your quote'}</h1>
    {error && <p className="problem" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {quote?.state === 'superseded' && <p role="status">{quote.message}</p>}
    {d && <><h2>{d.title}</h2><p>{d.site.address}</p><p>Revision {d.revision} · Valid through {d.validUntil} ({d.validityZone})</p>
      {quote.state === 'expired' && <p className="problem" role="status">This quote has expired.</p>}
      {quote.state === 'decided' && <p role="status">This revision is {quote.decision} and is read-only.</p>}
      {d.options.map((o: Rec) => <section key={o.id} aria-label={o.name || 'Quote lines'}><h3>{o.name || 'Work quoted'}</h3><ul className="rows">{o.lines.map((l: Rec, i: number) => <li key={i}><div><strong>{l.description}</strong>{l.customerDescription && <p>{l.customerDescription}</p>}{l.images?.map((file: any) => <DocumentImage key={file.fileId} file={file} token={token} scope="quote" alt={l.description} />)}<p>{l.quantity} × {money(l.unitPrice)}</p></div></li>)}</ul><p><strong>Total including tax: {money(o.totals.total)}</strong></p></section>)}
      {!!d.addOns.length && <section aria-label="Optional add-ons"><h3>Optional add-ons</h3>{d.addOns.map((o: Rec) => <div key={o.id}><h4>{o.name} · {money(o.totals.total)}</h4>{o.lines.map((l: Rec, i: number) => <p key={i}>{l.description}{l.customerDescription ? ` — ${l.customerDescription}` : ''} · {l.quantity} × {money(l.unitPrice)}</p>)}</div>)}</section>}
      {d.notes && <p>{d.notes}</p>}{d.terms && <section><h3>Terms</h3><p>{d.terms}</p></section>}
      {d.photos?.map((p: any, i: number) => <figure key={i}><DocumentImage file={p.file} token={token} scope="quote" alt={p.caption || 'Attached quote photo'} /><figcaption>{p.caption}</figcaption></figure>)}
      <DocumentTerms template={d.template} />
      <p className="muted">{quote.signingMessage}</p>
      {!['decided', 'superseded'].includes(quote.state) && <form className="document-tools" onSubmit={e => { e.preventDefault(); void respond(quote.state === 'expired' ? 'update' : 'changes') }}>
        <h3>Contact the office about this quote</h3><p>Your name and capacity are recorded as claimed. A forwarded link can be used; it does not verify your identity.</p>
        <Field label="Your name">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} maxLength={200} required />}</Field>
        <Field label="Your capacity (optional)">{p => <input {...p} value={capacity} onChange={e => setCapacity(e.target.value)} maxLength={200} />}</Field>
        {quote.state === 'open' && <Field label="Changes requested">{p => <textarea {...p} value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} required />}</Field>}
        <div className="actions"><button className="primary" type="submit" disabled={busy || (quote.state === 'expired' && quote.updateRequested)}>{quote.state === 'expired' ? quote.updateRequested ? 'Updated quote requested' : 'Ask for an updated quote' : 'Request changes'}</button>{quote.state === 'open' && <button type="button" disabled={busy || !name.trim()} onClick={() => void respond('decline')}>Decline quote</button>}</div>
      </form>}
    </>}
    {!quote && !error && <p role="status">Loading quote…</p>}
  </section></div></main>
}
