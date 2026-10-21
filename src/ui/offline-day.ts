import type { Glove } from './api'

// The technician's offline day (FIELD-001, as ct approved 19 Oct): only a
// signed-in Technician's own view (never prices; the server already leaves
// them out) is kept in this browser, replaced on every successful refresh,
// cleared on sign-out and whenever a different person or a desk role signs
// in. The service worker keeps the app shell and that technician's photos.

const KEY = 'glove.day'
type Kept = { actorId: string; savedAt: string; state: Glove }

export function keepDay(state: Glove) {
  try {
    const kept = readDay()
    if (state.actor.role !== 'technician') { if (kept) forgetDay(); return }
    if (kept && kept.actorId !== state.actor.id) forgetDay()
    localStorage.setItem(KEY, JSON.stringify({ actorId: state.actor.id, savedAt: new Date().toISOString(), state }))
  } catch { /* storage full or blocked: the phone still works online */ }
}

export function readDay(): Kept | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Kept : null } catch { return null }
}

/** Sign-out and a different sign-in clear the kept day, the kept shell and photos. */
export function forgetDay() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('glove.privacy-fences') } catch { /* nothing kept */ }
  navigator.serviceWorker?.controller?.postMessage({ type: 'forget' })
}

/** Register the worker and keep what this page loaded, so a reload with no signal still opens the day. */
export async function keepShell(photoUrls: string[]) {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.register('/glove-sw.js').catch(() => null)
  const worker = registration?.active ?? (await navigator.serviceWorker.ready.catch(() => null))?.active
  if (!worker) return
  const urls = [location.pathname, ...performance.getEntriesByType('resource').map(e => e.name)]
  worker.postMessage({ type: 'keep-shell', urls })
  if (photoUrls.length) worker.postMessage({ type: 'keep-files', urls: photoUrls })
}
