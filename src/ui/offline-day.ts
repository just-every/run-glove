import type { Glove } from './api'

// FIELD-001 custody (ct approved 19 Oct): only the signed-in Technician's
// own view is kept in this browser and replaced on every successful refresh.
// PAY-001 adds the Owner-granted exact approved invoice projection, including
// customer-facing prices, as an adopted default pending ct approval. It is
// cleared on sign-out and whenever a different person or a desk role signs
// in. The service worker keeps the app shell and that technician's photos.

const KEY = 'glove.day'
let clearing: Promise<unknown> = Promise.resolve()
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
  // A first load or a fresh sign-in page may have no controlling worker.
  // Clear the browser's copies directly as well as any active worker's work.
  clearing = (async () => {
    const worker = navigator.serviceWorker?.controller ?? (await navigator.serviceWorker?.getRegistration().catch(() => undefined))?.active
    if (worker) await new Promise<void>(resolve => {
      const channel = new MessageChannel(), timer = setTimeout(() => { channel.port1.close(); resolve() }, 2000)
      channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve() }
      worker.postMessage({ type: 'forget' }, [channel.port2])
    })
    if ('caches' in window) await Promise.all(['glove-shell-v1', 'glove-day-files'].map(name => caches.delete(name)))
  })().catch(() => {})
}

/** Register the worker and keep what this page loaded, so a reload with no signal still opens the day. */
export async function keepShell(photoUrls: string[]) {
  await clearing
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.register('/glove-sw.js').catch(() => null)
  const worker = registration?.active ?? (await navigator.serviceWorker.ready.catch(() => null))?.active
  if (!worker) return
  const urls = [location.pathname, ...performance.getEntriesByType('resource').map(e => e.name)]
  worker.postMessage({ type: 'keep-shell', urls })
  if (photoUrls.length) worker.postMessage({ type: 'keep-files', urls: photoUrls })
}
