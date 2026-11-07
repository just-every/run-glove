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
  const [loaded, setLoaded] = useState<{ key: string; entries?: Rec[]; error?: string } | null>(null)
  const key = `${site.id}:${s.version}:${s.actor.id}`
  // A new property or refreshed authority must never display the previous response.
  const current = loaded?.key === key ? loaded : null
  useEffect(() => {
    let live = true
    fetch(`/api/glove/sites/${encodeURIComponent(site.id)}/history`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body?.error?.message ?? 'The history could not load.'); return body.entries })
      .then(entries => { if (live) setLoaded({ key, entries }) }, (e: Error) => { if (live) setLoaded({ key, error: e.message }) })
    return () => { live = false }
  }, [site.id, key])
  const zone = s.business[0]?.timezone ?? 'UTC'
  return <section className="panel" aria-label={`History at ${site.address}`}><h3>History at {site.address}</h3>
    {!current && <p role="status">Loading history…</p>}
    {current?.error && <p className="problem" role="alert">{current.error}</p>}
    {current?.entries && (!current.entries.length ? <Empty title="Nothing recorded here yet" /> : <ol className="timeline-list">{current.entries.map(e => <li key={`${e.kind}-${e.id}`}><time>{when(e.at, zone)}</time> <Badge tone="grey">{e.kind}</Badge> <span>{e.label}</span>{e.status && <span className="muted"> · {e.status}</span>}</li>)}</ol>)}
  </section>
}
