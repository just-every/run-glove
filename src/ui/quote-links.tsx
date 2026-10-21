import { useState } from 'react'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import type { Glove, Rec, Run } from './api'

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
    <p>Customers can read, request changes or decline this revision. Online signing awaits the owner's consent disclosure; contact the customer to record an acceptance.</p>
    {['approved', 'sent'].includes(quote.status) && <div className="actions"><button type="button" onClick={() => void create()}>Create customer link</button>{s.mailConnected && <button type="button" onClick={() => void create(true)}>Email customer link</button>}</div>}
    {notice && <p role="status">{notice}</p>}{url && <Field label="Customer link (shown once)">{p => <textarea {...p} value={url} readOnly onFocus={e => e.target.select()} />}</Field>}
    {links.map(l => <p key={l.id}>Revision {l.revision} link · expires {l.expiresAt.slice(0, 10)} <button type="button" onClick={() => void action.act(run('quote.linkRevoke', { linkId: l.id, version: l.version }))}>Revoke customer link</button></p>)}
    <Problem error={action.error} />
    {(s.messages ?? []).filter(m => m.kind === 'quoteLink' && m.subjectId === quote.id).map(m => <div key={m.id}><p>{s.messageStates?.[m.id]?.text ?? 'Queued; delivery not yet reported'}</p>{s.messageStates?.[m.id]?.next && <p>{s.messageStates[m.id].next}</p>}</div>)}
    {(quote.customerRequests ?? []).map((r: Rec, i: number) => <p key={i}>Revision {r.revision}: {r.name} (claimed) · {r.action}{r.message ? ` — ${r.message}` : ''}</p>)}
  </section>
}

export function QuoteValidityDefault({ s, run }: { s: Glove; run: Run }) {
  const [days, setDays] = useState(String(s.business[0]?.quoteValidityDays ?? 30)), action = useAction()
  if (!can(s.actor, 'quote.validity')) return null
  return <form className="panel" aria-label="Quote validity default" onSubmit={e => { e.preventDefault(); void action.act(run('quote.validity', { days: Number(days) })) }}>
    <Field label="Default quote validity (calendar days)">{p => <input {...p} type="number" min="1" max="3650" required value={days} onChange={e => setDays(e.target.value)} />}</Field><button type="submit">Save quote validity default</button><Problem error={action.error} />
  </form>
}
