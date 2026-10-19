import { useCallback, useEffect, useRef, useState } from 'react'

export type Rec = { id: string; version: number; [key: string]: any }
export type Glove = {
  version: number; actor: { id: string; name: string; role: string; roleName: string | null; commands: string[]; reads: string[] }
  business: Rec[]; customers: Rec[]; sites: Rec[]; services: Rec[]; technicians: Rec[]; enquiries: Rec[]; quotes: Rec[]; jobs: Rec[]; visits: Rec[]
  captures: Rec[]; equipment: Rec[]; expenses: Rec[]; invoices: Rec[]; exports: Rec[]; proposals: Rec[]; approvals: Rec[]; imports: Rec[]
  roles: Rec[]; grants: Rec[]; events: Rec[]; operators: Rec[]; grantable?: string[]
}
export type Failure = { code: string; message: string; details?: any }
export type Outcome = { ok: true; result: any } | { ok: false; error: Failure }
export type Run = (type: string, payload: object) => Promise<Outcome>

const PENDING = 'glove.pending-command'

export async function send(commandId: string, type: string, payload: object): Promise<{ status: number; body: any }> {
  const response = await fetch('/api/glove/commands', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ commandId, type, payload }) })
  return { status: response.status, body: await response.json() as any }
}

/**
 * Records for this person's role, and a command runner. A command whose
 * outcome was lost (connection dropped, server error) keeps its identity in
 * this tab, and "Retry" resends exactly it, recovering the recorded result.
 */
export function useGlove() {
  const [state, setState] = useState<Glove | null>(null)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [unconfirmed, setUnconfirmed] = useState<{ commandId: string; type: string; payload: object } | null>(null)
  const flight = useRef(false)
  const refresh = useCallback(async () => {
    const response = await fetch('/api/glove/state', { credentials: 'same-origin', cache: 'no-store' })
    if (response.status === 401) { window.location.href = '/signin?returnTo=%2Fapp'; return }
    const body: any = await response.json()
    if (!response.ok) throw new Error(body?.error?.message ?? 'Records could not load.')
    setState(body)
    setLoadError('')
  }, [])
  useEffect(() => {
    try { const saved = sessionStorage.getItem(PENDING); if (saved) setUnconfirmed(JSON.parse(saved)) } catch { sessionStorage.removeItem(PENDING) }
    refresh().catch(error => setLoadError(error.message))
    // Technicians record work from their phones: pick it up when the person
    // changes screen, returns to the tab, and every 30 seconds while visible.
    const again = () => { if (document.visibilityState === 'visible' && !flight.current) refresh().catch(() => {}) }
    const timer = window.setInterval(again, 30000)
    window.addEventListener('hashchange', again); window.addEventListener('focus', again); document.addEventListener('visibilitychange', again)
    return () => { window.clearInterval(timer); window.removeEventListener('hashchange', again); window.removeEventListener('focus', again); document.removeEventListener('visibilitychange', again) }
  }, [refresh])
  const attempt = async (commandId: string, type: string, payload: object): Promise<Outcome> => {
    if (flight.current) return { ok: false, error: { code: 'BUSY', message: 'Another action is still running.' } }
    flight.current = true
    setBusy(true); setNotice('')
    sessionStorage.setItem(PENDING, JSON.stringify({ commandId, type, payload }))
    try {
      const { status, body } = await send(commandId, type, payload)
      if (status >= 500 || body?.error?.code === 'UNCONFIRMED') { setUnconfirmed({ commandId, type, payload }); return { ok: false, error: body.error } }
      sessionStorage.removeItem(PENDING); setUnconfirmed(null)
      await refresh().catch(error => setLoadError(error.message))
      if (body.ok) { setNotice('Saved.'); return { ok: true, result: body.result } }
      return { ok: false, error: body.error }
    } catch {
      setUnconfirmed({ commandId, type, payload })
      return { ok: false, error: { code: 'OFFLINE', message: 'The connection dropped before the result came back. Retry to recover what happened.' } }
    } finally { flight.current = false; setBusy(false) }
  }
  const run: Run = (type, payload) => attempt(crypto.randomUUID(), type, payload)
  const retry = () => unconfirmed ? attempt(unconfirmed.commandId, unconfirmed.type, unconfirmed.payload) : Promise.resolve(null)
  return { state, loadError, busy, notice, setNotice, run, refresh, unconfirmed, retry }
}

export const byId = (rows: Rec[], id: string | null | undefined) => rows.find(r => r.id === id)
export const today = (zone: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
/** A local YYYY-MM-DD date for people: "Thursday 15 October 2026" (long) or "Thu 15 Oct" (short). */
export const dateLabel = (date: string, style: 'long' | 'short' = 'long') => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: style, day: 'numeric', month: style, ...(style === 'long' ? { year: 'numeric' } : {}) }).formatToParts(new Date(`${date}T00:00:00Z`)).filter(p => p.type !== 'literal').map(p => p.value).join(' ')
export const shiftDate = (date: string, days: number) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }
export const when = (iso: string | null | undefined, zone: string) => iso ? new Intl.DateTimeFormat('en-US', { timeZone: zone, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : ''
/** A role for people; a custom role (custom:<id>) by the name the owner gave it. */
export const roleName = (role: string, roles: Rec[] = []) => role.startsWith('custom:') ? roles.find(r => `custom:${r.id}` === role)?.name ?? 'Custom role' : ({ owner: 'Owner', dispatcher: 'Dispatcher', technician: 'Technician', office: 'Office', agent: 'Agent', viewer: 'Viewer', import: 'Move-in' }[role] ?? role)

/** One job's whole timeline, oldest first, read again whenever the records change. */
export function useTimeline(jobId: string, version: number) {
  const [timeline, setTimeline] = useState<{ events: Rec[] | null; error: string }>({ events: null, error: '' })
  useEffect(() => {
    let live = true
    fetch(`/api/glove/jobs/${encodeURIComponent(jobId)}/timeline`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async response => { const body: any = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? 'The timeline could not load.'); return body.events as Rec[] })
      .then(events => { if (live) setTimeline({ events, error: '' }) }, (error: Error) => { if (live) setTimeline(t => ({ ...t, error: error.message })) })
    return () => { live = false }
  }, [jobId, version])
  return timeline
}
