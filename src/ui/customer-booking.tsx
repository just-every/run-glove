import { useEffect, useState } from 'react'
import { dateLabel, timeRange } from './api'
import './style'

type OfferedTime = { id: string; date: string; start: string; end: string; timezone: string; window?: { start: string; end: string } }
type Offer = { business: string; service: string; address: string; expiresAt: string; serviceBooking?: boolean; slots: OfferedTime[] }

export function CustomerBooking() {
  const [offer, setOffer] = useState<Offer | null>(null), [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [booked, setBooked] = useState<OfferedTime | null>(null)
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
    if (!/^glb_[A-Za-z0-9_-]{43}$/.test(value)) { setError('This booking link is unavailable. Ask the business for a new link.'); return }
    const controller = new AbortController()
    setToken(value)
    fetch('/api/glove/public/booking', { signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${value}` } })
      .then(async r => { const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message ?? 'This booking link is unavailable.'); return b.offer as Offer })
      .then(setOffer).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [])
  const choose = async (slotId: string) => {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/glove/public/booking', { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ slotId }) })
      const b: any = await r.json()
      if (!r.ok) { if (b.error?.details?.offer) setOffer(b.error.details.offer); else setOffer(null); throw new Error(b.error?.message ?? 'Booking could not be confirmed. Reopen the link to check its status.') }
      setBooked(b.booked)
    } catch (e) { setError(e instanceof Error ? e.message : 'Booking could not be confirmed. Reopen the link to check its status.') }
    finally { setBusy(false) }
  }
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 700, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel" style={{ overflowWrap: 'anywhere' }} aria-label={offer?.serviceBooking ? 'Choose a service visit' : 'Choose an included visit'}>
    <p className="muted">{offer?.business}</p><h1>{booked ? 'Your visit is booked' : offer?.serviceBooking ? 'Choose your service visit' : 'Choose your included visit'}</h1>
    {offer && <><h2>{offer.service}</h2><p>{offer.address}</p></>}
    {error && <p className="problem" role="alert">{error}</p>}
    {booked ? <p role="status">{dateLabel(booked.date)} · {timeRange(booked.start, booked.end)} ({booked.timezone}){booked.window && <> · Arrival window {timeRange(booked.window.start, booked.window.end)}</>}. This link has been used and cannot book another visit.</p> : offer ? <>
      <p>Choose one of the times offered by the office. Times are in the time zone shown.</p>
      {offer.slots.length ? <ul className="rows">{offer.slots.map(slot => <li key={slot.id}><div><p>{dateLabel(slot.date)}<br />{timeRange(slot.start, slot.end)} · {slot.timezone}{slot.window && <><br />Arrival window {timeRange(slot.window.start, slot.window.end)}</>}</p><button type="button" disabled={busy} onClick={() => void choose(slot.id)}>Book {timeRange(slot.start, slot.end)}</button></div></li>)}</ul> : <p>No offered times are available now. Contact the business for more times; {offer.serviceBooking ? 'no booking has been made.' : 'your included visit remains due.'}</p>}
      <p className="muted">Link expires {new Date(offer.expiresAt).toLocaleDateString('en-US')}.</p>
    </> : !error && <p role="status">Loading offered times…</p>}
  </section></div></main>
}
