import { CustomerFinancing } from './financing'
import { documentDate } from '../glove/document-format'
import { DocumentIdentity, DocumentTools, DocumentTerms } from './documents'
import { DocumentImage } from './document-image'
import { useEffect, useState } from 'react'
import { Field, money } from './controls'
import type { Rec } from './api'
import { CustomerSigning, SignedCopyDownload, type Choice } from './quote-signing'
import './style'
import './style/customer-quote.css'

export function CustomerQuote() {
  const [quote, setQuote] = useState<Rec | null>(null), [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const [name, setName] = useState(''), [capacity, setCapacity] = useState(''), [message, setMessage] = useState('')
  const [choice, setChoice] = useState<Choice>({ optionId: '', addOnIds: [] })
  useEffect(() => {
    let controller: AbortController | undefined
    const read = () => {
      controller?.abort()
      controller = new AbortController()
      const current = controller
      setQuote(null); setError(''); setNotice(''); setName(''); setCapacity(''); setMessage(''); setBusy(false); setChoice({ optionId: '', addOnIds: [] })
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
  const respond = async (action: string, extra: object = {}) => {
    const isCurrent = () => new URLSearchParams(window.location.hash.slice(1)).get('token') === token
    setBusy(true); setError(''); setNotice('')
    try {
      const r = await fetch('/api/glove/public/quote', { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ action, name, capacity, message, ...(choice.optionId ? { choice } : {}), ...extra }) })
      const b: any = await r.json()
      if (!isCurrent()) return
      if (!r.ok) throw new Error(b.error?.message)
      setQuote(b)
      if (action !== 'choose') setMessage('')
      setNotice(b.state === 'decided' ? `The recorded decision is ${b.decision}. No further response changes this revision.` : action === 'changes' ? 'Your change request is with the office. You can keep using this link.' : action === 'update' ? 'The office has your request for an updated quote.' : 'Review the selected work and exact total below before signing.')
    } catch (e) { if (isCurrent()) setError(e instanceof Error ? e.message : 'Reopen the quote to check your response.') }
    finally { if (isCurrent()) setBusy(false) }
  }
  const d = quote?.signed?.document ?? quote?.document
  const choose = (next: Choice) => { setChoice(next); setQuote(current => current ? { ...current, selection: undefined } : current) }
  const options = d?.options ?? (d ? [{ id: 'chosen', name: d.choice.optionName || 'Selected work', lines: d.lines, totals: d.totals }] : [])
  if (!quote || !d) return <main className="glove-app customer-quote" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 760, margin: '0 auto', boxSizing: 'border-box' }}><section aria-label="Your quote" className="panel"><h1>Your quote</h1>{error && <p className="problem" role="alert">{error}</p>}{quote?.state === 'superseded' && <p role="status">{quote.message}</p>}{!quote && !error && <p role="status">Loading quote…</p>}</section></div></main>
  return <main className="glove-app customer-quote" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 760, margin: '0 auto', boxSizing: 'border-box' }}><section style={{ overflowWrap: 'anywhere' }} aria-label="Your quote" className="panel printable-document">
    {d && <><DocumentTools /><DocumentIdentity business={d.business} token={token} /></>}<h1>{d ? `${d.template?.heading || 'Quote'} ${d.number}` : 'Your quote'}</h1>
    {error && <p className="problem" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {quote?.state === 'superseded' && <p role="status">{quote.message}</p>}
    {d && <><h2>{d.title}</h2><p>{d.site.address}</p><p>{d.date && <>Prepared {documentDate(d.date)} · </>}Revision {d.revision} · Valid through {documentDate(d.validUntil)} ({d.validityZone})</p>
      {quote.state === 'expired' && <p className="problem" role="status">This quote has expired.</p>}
      {quote.state === 'decided' && <p role="status">This revision is {quote.decision} and is read-only.</p>}
      <fieldset style={{ minWidth: 0 }}><legend>{quote.state === 'open' ? 'Choose your work' : 'Quoted work'}</legend>{options.map((o: Rec) => <section key={o.id} aria-label={o.name || 'Quote lines'}><h3>{o.name || 'Work quoted'}</h3>{quote.state === 'open' && <label><input type="radio" name="quote-option" checked={choice.optionId === o.id} onChange={() => choose({ ...choice, optionId: o.id })} />Choose {o.name || 'this option'}</label>}<ul className="rows">{o.lines.map((l: Rec, i: number) => <li key={i}><div><strong>{l.description}</strong>{l.customerDescription && <p>{l.customerDescription}</p>}{l.images?.map((file: any) => <DocumentImage key={file.fileId} file={file} token={token} scope="quote" alt={l.description} />)}<p>{l.quantity} × {money(l.unitPrice)}</p></div></li>)}</ul><p><strong>Total including tax: {money(o.totals.total)}</strong></p></section>)}</fieldset>
      {!!d.addOns?.length && <fieldset style={{ minWidth: 0 }} aria-label="Optional add-ons"><legend>Optional add-ons</legend>{d.addOns.map((o: Rec) => <div key={o.id}><h4>{o.name} · {money(o.totals.total)}</h4>{quote.state === 'open' && <label><input type="checkbox" checked={choice.addOnIds.includes(o.id)} onChange={e => choose({ ...choice, addOnIds: e.target.checked ? [...choice.addOnIds, o.id] : choice.addOnIds.filter(id => id !== o.id) })} />Add {o.name}</label>}{o.lines.map((l: Rec, i: number) => <p key={i}>{l.description}{l.customerDescription ? ` — ${l.customerDescription}` : ''} · {l.quantity} × {money(l.unitPrice)}{l.images?.map((file: any) => <DocumentImage key={file.fileId} file={file} token={token} scope="quote" alt={l.description} />)}</p>)}</div>)}</fieldset>}
      {quote.state === 'open' && <div className="document-tools"><button type="button" disabled={busy || !choice.optionId} onClick={() => void respond('choose', { choice })}>Review selected work</button></div>}
      {quote.signed && <section aria-label="Signed approval"><h3>Signed approval</h3><p>{quote.signed.name} (claimed), {quote.signed.capacity} (claimed) · {quote.signed.at}</p><p>{quote.signed.authenticationBasis}</p><p>Chosen option: {d.choice.optionName || 'Quoted work'} · Add-ons: {d.choice.addOnNames.join(', ') || 'None'}</p><p>Consent disclosure version {quote.signed.consent.version}: {quote.signed.consent.text}</p>
        {quote.signed.copyWithdrawn && <section aria-label="Signed copy withdrawn"><h4>Signed copy and signature evidence withdrawn</h4><p>{quote.signed.copyWithdrawn.reason}</p><p>Withdrawn {quote.signed.copyWithdrawn.at}. This quote remains accepted.</p></section>}
        {quote.signed.signedCopy && <SignedCopyDownload path="/api/glove/public/quote/signed" token={token} hash={quote.signed.signedCopy.sha256} />}
        <p>{quote.signed.confirmation.text ?? (quote.signed.confirmation.status === 'not_connected' ? 'No confirmation email was sent because customer email was not connected.' : 'Confirmation copy queued; delivery is not yet reported.')}</p>{quote.signed.confirmation.next && <p>{quote.signed.confirmation.next}</p>}
      </section>}
      <CustomerFinancing quote={quote} selected={!!quote.selection} respond={respond} busy={busy} />
      {d.deposit && <section aria-label="Quote deposit"><h3>Deposit</h3><p>{d.deposit.kind === 'percent' ? `${d.deposit.value}% of the chosen total` : `$${d.deposit.value}`}</p><p>{d.depositMessage}</p></section>}{d.notes && <p>{d.notes}</p>}{d.terms && <section><h3>Terms</h3><p>{d.terms}</p></section>}
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
      {quote.state === 'open' && <CustomerSigning quote={quote} choice={choice} busy={busy} name={name} capacity={capacity} setName={setName} setCapacity={setCapacity} respond={respond} />}
    </>}
    {!quote && !error && <p role="status">Loading quote…</p>}
  </section></div></main>
}
