import { useEffect, useState } from 'react'
import { when, type Glove, type Rec } from './api'
import { Badge, Empty } from './controls'

// CUST-001: the search across customers and one property's whole history.

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '')

/** A customer matches by name, email, contact, phone (any fragment of its digits) or any of its addresses. */
export function matches(s: Glove, c: Rec, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const sites = s.sites.filter(x => x.customerId === c.id), others: Rec[] = c.contacts ?? []
  const texts = [c.name, c.email, c.apEmail, c.contact, c.billingContact, c.billingAddress, ...others.flatMap(x => [x.name, x.email]), ...sites.flatMap(x => [x.address, x.contact, x.contactEmail])]
  if (texts.some(t => typeof t === 'string' && t.toLowerCase().includes(q))) return true
  const d = digits(q)
  return /^[\d\s()+.-]+$/.test(q) && d.length >= 3 && [c.phone, ...others.map(x => x.phone), ...sites.map(x => x.contactPhone)].some(p => digits(p).includes(d))
}

/** Every record at one site, newest first, from GET /api/glove/sites/<id>/history. */
export function PropertyHistory({ s, site }: { s: Glove; site: Rec }) {
  const [entries, setEntries] = useState<Rec[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    fetch(`/api/glove/sites/${encodeURIComponent(site.id)}/history`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body?.error?.message ?? 'The history could not load.'); return body.entries })
      .then(list => { if (live) { setEntries(list); setError('') } }, (e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [site.id, s.version])
  const zone = s.business[0]?.timezone ?? 'UTC'
  return <section className="panel" aria-label={`History at ${site.address}`}><h3>History at {site.address}</h3>
    {error && <p className="problem" role="alert">{error}</p>}
    {entries && (!entries.length ? <Empty title="Nothing recorded here yet" /> : <ol className="timeline-list">{entries.map(e => <li key={`${e.kind}-${e.id}`}><time>{when(e.at, zone)}</time> <Badge tone="grey">{e.kind}</Badge> <span>{e.label}</span>{e.status && <span className="muted"> · {e.status}</span>}</li>)}</ol>)}
  </section>
}
