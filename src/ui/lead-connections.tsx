import { useState } from 'react'
import { when, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

// BOOK-004: the owner connects Google Local Services, Angi, Thumbtack and Yelp
// (Team); each request from a lead shows its cost and its acknowledgment due
// within the source's response window (Quotes).

const labels: Record<string, string> = { 'reserve-google': 'Reserve with Google', google: 'Google Local Services', angi: 'Angi', thumbtack: 'Thumbtack', yelp: 'Yelp' }
const extra: Record<string, [string, string][]> = { 'reserve-google': [], google: [['customerId', 'Google Ads customer ID'], ['developerToken', 'Developer token'], ['clientId', 'OAuth client ID'], ['clientSecret', 'OAuth client secret'], ['refreshToken', 'OAuth refresh token']], yelp: [['apiKey', 'Yelp Leads API key']], angi: [], thumbtack: [] }

export function LeadSources({ s, run }: { s: Glove; run: Run }) {
  const [provider, setProvider] = useState('thumbtack'), [form, setForm] = useState<Record<string, string>>({ respondWithinMinutes: '60' })
  const [door, setDoor] = useState<{ provider: string; url: string; password: string } | null>(null), action = useAction()
  if (!can(s.actor, 'lead.connect') || !s.business.length) return null
  const connected = s.business[0]?.leads ?? {}
  return <section className="panel"><h2>Lead sources</h2>
    <p className="muted">New leads land as requests with their source and cost, matched to an existing customer by phone or email, with an acknowledgment queued for the desk to send.</p>
    {Object.keys(connected).length > 0 && <ul className="rows">{Object.entries(connected).map(([p, c]: [string, any]) => <li key={p}><div><strong>{labels[p]}</strong><p className="muted">Connected {when(c.connectedAt, s.business[0].timezone)} by {c.by} · acknowledge within {c.respondWithinMinutes} minutes</p></div>
      <div className="actions">{p === 'google' && <button onClick={() => action.act(run('lead.pull', { provider: 'google' }))}>Read new leads</button>}<button className="quiet" onClick={() => action.act(run('lead.connect', { provider: p, disconnect: true }))}>Disconnect {labels[p]}</button></div></li>)}</ul>}
    {door && <div className="notice prepared" role="status"><p><strong>{labels[door.provider]} posts leads to {door.url}</strong> with user <code>glove</code> and password <code>{door.password}</code>. This password is shown only now.</p><button onClick={() => setDoor(null)}>I saved it</button></div>}
    <form onSubmit={e => { e.preventDefault(); void action.act(run('lead.connect', { provider, ...Object.fromEntries(Object.entries(form).filter(([k]) => k !== 'respondWithinMinutes' && extra[provider].some(([f]) => f === k))), respondWithinMinutes: Number(form.respondWithinMinutes) }), (r: Rec) => { setForm({ respondWithinMinutes: '60' }); if (r.callback) setDoor({ provider, url: r.callback.url, password: r.password }) }) }}>
      <div className="form-grid">
        <Field label="Lead source">{p => <select {...p} value={provider} onChange={e => setProvider(e.target.value)}>{Object.entries(labels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
        <Field label="Acknowledge within (minutes)">{p => <input {...p} type="number" min={5} max={1440} value={form.respondWithinMinutes} onChange={e => setForm({ ...form, respondWithinMinutes: e.target.value })} required />}</Field>
        {extra[provider].map(([k, l]) => <Field key={k} label={l}>{p => <input {...p} type={k === 'customerId' ? 'text' : 'password'} autoComplete="off" value={form[k] ?? ''} onChange={e => setForm({ ...form, [k]: e.target.value })} required />}</Field>)}
      </div>
      {provider === 'reserve-google' && <p className="muted">Booking records become requests only. This intake needs your integration to relay records; connecting it does not activate Google bookings or confirm a visit.</p>}
      <p className="muted">Credentials are kept as installation secrets and never exported.</p>
      <div className="actions"><button type="submit">Connect {labels[provider]}</button></div>
    </form><Problem error={action.error} />
  </section>
}

/** A lead request's cost and its acknowledgment, with the desk's record that it was sent. */
export function LeadStatus({ s, e, run }: { s: Glove; e: Rec; run: Run }) {
  const action = useAction(), zone = s.business[0]?.timezone ?? 'America/Chicago', ack = e.acknowledgment
  if (!e.leadCost && !ack) return null
  return <div className="lead-status">
    {e.leadCost && <p className="muted">Lead cost ${e.leadCost.amount} · {e.leadCost.by === 'provider' ? `reported by ${labels[e.source] ?? e.source}` : e.leadCost.by === 'rule' ? `rule ${e.leadCost.rule}` : `set by ${e.leadCost.person?.name}`}</p>}
    {ack && (ack.status === 'queued' ? <p><strong>Acknowledgment queued</strong> · reply by {when(ack.dueBy, zone)} on {ack.channel}: “{ack.text}”{can(s.actor, 'enquiry.acknowledged') && <button onClick={() => action.act(run('enquiry.acknowledged', { enquiryId: e.id, version: e.version }))}>Record acknowledgment sent outside Glove</button>}</p> : <p className="muted">Acknowledgment recorded as sent {when(ack.sentAt, zone)} by {ack.by?.name}. This is a person’s record, not provider-confirmed delivery.</p>)}
    <Problem error={action.error} />
  </div>
}
