import { useEffect, useState } from 'react'
import './style'

export function EmailPreferences() {
  const [purpose, setPurpose] = useState('quote follow-up emails')
  const [token, setToken] = useState(''), [ready, setReady] = useState(false), [stopped, setStopped] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [fragment, setFragment] = useState<string | null>(null)
  useEffect(() => { const changed = () => setFragment(window.location.hash); changed(); window.addEventListener('hashchange', changed); return () => window.removeEventListener('hashchange', changed) }, [])
  useEffect(() => {
    if (fragment === null) return
    setReady(false); setError('')
    const value = new URLSearchParams(fragment.slice(1)).get('token') ?? ''
    if (!/^gle_[A-Za-z0-9_-]{43}$/.test(value)) { setError('This link is unavailable. Contact the business to stop emails.'); return }
    setToken(value)
    const controller = new AbortController()
    fetch('/api/glove/public/email-preferences', { credentials: 'omit', cache: 'no-store', signal: controller.signal, headers: { Authorization: `Bearer ${value}` } }).then(async r => {
      const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message)
      setStopped(b.stopped); if (b.purpose) setPurpose(b.purpose); setReady(true)
    }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [fragment])
  const stop = async () => {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/glove/public/email-preferences', { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'content-type': ['application', 'json'].join('/') }, body: JSON.stringify({ stop: true }) })
      const b: any = await r.json(); if (!r.ok) throw new Error(b.error?.message ?? 'Reopen this link to check the preference.')
      setStopped(b.stopped); if (b.purpose) setPurpose(b.purpose)
    } catch (e) { setError(e instanceof Error ? e.message : 'Reopen this link to check the preference.') }
    finally { setBusy(false) }
  }
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 600, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel" aria-label="Email preferences"><h1>Email preferences</h1>
    {error && <p className="problem" role="alert">{error}</p>}{ready ? stopped ? <p role="status">{purpose.charAt(0).toUpperCase() + purpose.slice(1)} are stopped. Your other service notices keep their existing preferences.</p> : <><p>Stop {purpose}. Your other service notices keep their existing preferences.</p><button disabled={busy} onClick={() => void stop()}>Stop {purpose}</button></> : !error && <p role="status">Loading email preference…</p>}
  </section></div></main>
}
