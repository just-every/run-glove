import { useEffect, useRef, useState } from 'react'
import { send, type Glove } from './api'
import { clockState } from './clock'
import type { Queued } from './outbox'

/** Location is never queued, cached or collected in the background. */
export function PhoneLocation({ s, queued, online }: { s: Glove; queued: Queued[]; online: boolean }) {
  const [enabled, setEnabled] = useState(false), [status, setStatus] = useState('Location sharing is off'), [error, setError] = useState('')
  const tech = s.technicians.find(t => t.operatorId === s.actor.id), clock = clockState(s, tech?.id, queued)
  const visit = clock.timer && s.visits.find(v => v.id === clock.timer!.visitId && v.technicianId === tech?.id && ['booked', 'arrived'].includes(v.status))
  const [visible, setVisible] = useState(document.visibilityState === 'visible')
  useEffect(() => { const changed = () => setVisible(document.visibilityState === 'visible'); document.addEventListener('visibilitychange', changed); return () => document.removeEventListener('visibilitychange', changed) }, [])
  const eligible = clock.on && !!visit && !clock.waiting && online && visible
  const last = useRef(0), stopped = useRef(false)
  useEffect(() => { let live = true; fetch('/api/glove/location', { cache: 'no-store' }).then(r => r.ok ? r.json() : { enabled: false }).then((v: any) => { if (live) setEnabled(v.enabled && !stopped.current) }).catch(() => { if (live) setEnabled(false) }); return () => { live = false } }, [s.version])
  useEffect(() => {
    if (!enabled || !eligible || document.visibilityState !== 'visible') { setStatus(enabled ? 'Location stopped: clock in and start a visit timer' : 'Location sharing is off'); return }
    if (!navigator.geolocation) { setStatus('Phone location unavailable'); return }
    let live = true
    const watch = navigator.geolocation.watchPosition(async position => {
      if (!live || stopped.current || document.visibilityState !== 'visible' || Date.now() - last.current < 30_000) return
      last.current = Date.now()
      try {
        const { body } = await send(crypto.randomUUID(), 'location.phone', { lat: position.coords.latitude, lng: position.coords.longitude, observedAt: new Date(position.timestamp).toISOString() })
        last.current = body.ok ? Date.now() : 0
        if (live) { setStatus(body.ok ? 'Phone location shared with dispatch' : 'Location stopped or unavailable'); setError(body.ok ? '' : body.error.message) }
      } catch { last.current = 0; if (live) setStatus('Location unavailable: reconnect to share') }
    }, () => { if (live) setStatus('Phone location unavailable: check browser permission') }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 })
    const visibility = () => { if (document.visibilityState !== 'visible') { live = false; navigator.geolocation.clearWatch(watch); setStatus('Location stopped while this page is hidden') } }
    document.addEventListener('visibilitychange', visibility)
    return () => { live = false; navigator.geolocation.clearWatch(watch); document.removeEventListener('visibilitychange', visibility) }
  }, [enabled, eligible, visit?.id])
  async function consent(next: boolean) {
    stopped.current = !next
    if (!next) { setEnabled(false); setStatus('Location sharing is off') }
    try { const { body } = await send(crypto.randomUUID(), 'location.consent', { enabled: next }); if (!body.ok) throw new Error(body.error.message); last.current = 0; setEnabled(next); setError('') }
    catch (e) { setError((e as Error).message) }
  }
  return <section className="card" aria-label="Location sharing"><h2 className="section-title">Location sharing</h2>
    <p>With your consent, your phone or connected fleet vehicle shares its position while you are on the clock with a visit timer. Only the owner sees it. Coordinates go to Google for driving estimates. No route history is kept.</p>
    <p role="status">{status}</p><button onClick={() => void consent(!enabled)}>{enabled ? 'Stop sharing location' : 'Allow on-clock location'}</button>
    {error && <p role="alert" className="problem">{error}</p>}
  </section>
}
