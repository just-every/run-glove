import { useEffect, useState } from 'react'
import { dateLabel, timeRange } from './api'
import './style'

type Visit = { business: string; title: string; date: string; start: string; end: string; timezone: string; response: { action: string; at: string } | null }

export function CustomerVisit() {
  const [visit, setVisit] = useState<Visit | null>(null), [token, setToken] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
    if (!/^glv_[A-Za-z0-9_-]{43}$/.test(value)) { setError('This visit link is unavailable. Contact the office for the current visit.'); return }
    setToken(value)
    const controller = new AbortController()
    fetch('/api/glove/public/visit-response', { credentials: 'omit', cache: 'no-store', signal: controller.signal, headers: { Authorization: `Bearer ${value}` } })
      .then(async r => { const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message); return b.visit })
      .then(setVisit).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [])
  const respond = async (action: string) => {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/glove/public/visit-response', { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'content-type': ['application', 'json'].join('/') }, body: JSON.stringify({ action }) })
      const b: any = await r.json()
      if (!r.ok) throw new Error(b.error?.message ?? 'Response was not confirmed. Reopen this link to check it.')
      setVisit(b.visit)
    } catch (e) { setError(e instanceof Error ? e.message : 'Response was not confirmed. Reopen this link to check it.') }
    finally { setBusy(false) }
  }
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 700, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel" aria-label="Your visit" style={{ overflowWrap: 'anywhere' }}>
    <p>{visit?.business}</p><h1>Your visit</h1>{error && <p className="problem" role="alert">{error}</p>}
    {visit ? <><h2>{visit.title}</h2><p>{dateLabel(visit.date)} · {timeRange(visit.start, visit.end)} ({visit.timezone})</p>
      {visit.response ? <p role="status">{visit.response.action === 'confirm' ? 'Your confirmation is recorded.' : 'Your reschedule request is with the office. The existing booking remains in place until the office agrees a new time.'}</p> : <><p>Confirm this time or ask the office to arrange another time. Asking does not move or cancel this visit.</p><div className="actions"><button disabled={busy} onClick={() => void respond('confirm')}>Confirm this visit</button><button disabled={busy} onClick={() => void respond('reschedule')}>Ask to reschedule</button></div></>}
      <p className="muted">Anyone with this link can respond. The link does not verify identity. Contact the office to change a response or stop visit emails.</p>
    </> : !error && <p role="status">Loading your visit…</p>}
  </section></div></main>
}
