import { useState } from 'react'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import type { Glove, Rec, Run } from './api'
import { SignedCopyDownload } from './quote-signing'

export function QuoteLinks({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const [url, setUrl] = useState(''), [notice, setNotice] = useState(''), action = useAction()
  if (!can(s.actor, 'quote.link')) return null
  const rev = quote.revisions.at(-1), links = (s.quoteLinks ?? []).filter(l => l.quoteId === quote.id && !l.revokedAt && l.revision === rev.n)
  const create = async (email = false) => {
    setUrl(''); setNotice('')
    const result = await action.act(run('quote.link', { quoteId: quote.id, version: quote.version, email }))
    if (!result.ok) return
    if (email) { setNotice('Customer link queued to the address on record. Its provider outcome appears with the email.'); return }
    if (!result.result.token) { setNotice('The link is shown once. Issue a new link to share it.'); return }
    setUrl(`${location.origin}/quote#token=${result.result.token}`)
    setNotice('Share this link outside Glove. The recipient is unverified. Issuing another link revokes this one.')
  }
  return <section aria-label={`Customer link for ${quote.number}`} style={{ minWidth: 0 }}><h3>Customer quote link</h3>
    <p>Customers can read, choose work, request changes or decline this revision. {s.business[0]?.quoteConsent?.active ? 'Online signing requires the customer to affirm the owner-accepted disclosure; the signer and capacity are claimed, not verified.' : "Online signing awaits the owner's concrete disclosure and explicit acceptance."}</p>
    {['approved', 'sent', 'accepted', 'declined'].includes(quote.status) && <div className="actions"><button type="button" onClick={() => void create()}>Create customer link</button>{s.mailConnected && <button type="button" onClick={() => void create(true)}>Email customer link</button>}</div>}
    {notice && <p role="status">{notice}</p>}{url && <Field label="Customer link (shown once)">{p => <textarea {...p} value={url} readOnly onFocus={e => e.target.select()} />}</Field>}
    {links.map(l => <p key={l.id}>Revision {l.revision} link · expires {l.expiresAt.slice(0, 10)} <button type="button" onClick={() => void action.act(run('quote.linkRevoke', { linkId: l.id, version: l.version }))}>Revoke customer link</button></p>)}
    <Problem error={action.error} />
    {(s.messages ?? []).filter(m => ['quoteLink', 'quoteConfirmation'].includes(m.kind) && m.subjectId === quote.id).map(m => <div key={m.id}><p>{m.kind === 'quoteConfirmation' ? 'Signed confirmation copy: ' : ''}{s.messageStates?.[m.id]?.text ?? 'Queued; delivery not yet reported'}</p>{s.messageStates?.[m.id]?.next && <p>{s.messageStates[m.id].next}</p>}</div>)}
    {quote.acceptance?.signing && <section aria-label="Customer signature record"><h4>Customer signature record</h4><p>{quote.acceptance.signing.name} (claimed) · {quote.acceptance.signing.capacity} (claimed) · {quote.acceptance.signing.at}</p><p>{quote.acceptance.signing.authenticationBasis}</p><p>Disclosure version {quote.acceptance.signing.consent.version} · {quote.acceptance.signing.signature.kind} signature</p><p>Revision SHA-256: {quote.acceptance.signing.revisionDocumentHash}</p><SignedCopyDownload path={`/api/glove/quotes/${quote.id}/signed`} hash={quote.acceptance.signing.signedCopy.sha256} /></section>}
    {(quote.customerRequests ?? []).map((r: Rec, i: number) => <p key={i}>Revision {r.revision}: {r.name} (claimed) · {r.action}{r.message ? ` — ${r.message}` : ''}</p>)}
  </section>
}

export function QuoteValidityDefault({ s, run }: { s: Glove; run: Run }) {
  const [days, setDays] = useState(String(s.business[0]?.quoteValidityDays ?? 30)), action = useAction()
  if (!can(s.actor, 'quote.validity')) return null
  return <><form className="panel" aria-label="Quote validity default" onSubmit={e => { e.preventDefault(); void action.act(run('quote.validity', { days: Number(days) })) }}>
    <Field label="Default quote validity (calendar days)">{p => <input {...p} type="number" min="1" max="3650" required value={days} onChange={e => setDays(e.target.value)} />}</Field><button type="submit">Save quote validity default</button><Problem error={action.error} />
  </form><QuoteConsentSettings s={s} run={run} /></>
}

function QuoteConsentSettings({ s, run }: { s: Glove; run: Run }) {
  const [disclosure, setDisclosure] = useState(''), [accepted, setAccepted] = useState(false), action = useAction()
  if (s.actor.role !== 'owner' || !can(s.actor, 'quote.consent')) return null
  const current = s.business[0]?.quoteConsent
  return <section className="panel" aria-label="Quote signing disclosure"><h2>Quote signing disclosure</h2>
    <p>Enter the concrete disclosure you want customers to read and affirm. Signing stays unavailable until you explicitly accept that text. Glove supplies no default disclosure and makes no legal-validity claim.</p>
    {current && <div><p>Version {current.version} · {current.active ? 'Accepted; customer signing is available for open quotes' : 'Signing disabled'}</p><p style={{ whiteSpace: 'pre-wrap' }}>{current.text}</p><small>SHA-256: {current.hash}</small></div>}
    <form onSubmit={e => { e.preventDefault(); void action.act(run('quote.consent', { version: s.business[0].version, text: disclosure, accept: accepted }), () => { setDisclosure(''); setAccepted(false) }) }}>
      <Field label="Concrete customer signing disclosure">{p => <textarea {...p} rows={6} required maxLength={12000} value={disclosure} onChange={e => { setDisclosure(e.target.value); setAccepted(false) }} />}</Field>
      {!!disclosure.trim() && <section aria-label="Disclosure to accept"><h3>Text you are accepting</h3><p style={{ whiteSpace: 'pre-wrap' }}>{disclosure.trim()}</p></section>}
      <label><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} />I accept this exact disclosure for customer quote signing.</label>
      <div className="actions"><button type="submit" disabled={!accepted || !disclosure.trim()}>Accept disclosure and enable signing</button>{current?.active && <button type="button" onClick={() => action.act(run('quote.consent', { version: s.business[0].version, disable: true }))}>Disable customer signing</button>}</div>
    </form><Problem error={action.error} />
  </section>
}
