/** DATA-001: an assignment loss is never an erasure fence. Disconnected
 * devices apply explicit, value-free server fences on successful refresh. */
export function refersErased(value: unknown, ids: string[]): boolean {
  const erased = new Set(ids)
  const visit = (v: unknown): boolean => typeof v === 'string' ? erased.has(v) : Array.isArray(v) ? v.some(visit) : !!v && typeof v === 'object' && Object.entries(v).some(([key, child]) => key !== 'privacyFences' && visit(child))
  return visit(value)
}
export async function eraseLocalCopies(ids: string[]) {
  if (!ids.length) return
  let changed = false
  try {
    const seen = new Set<string>(JSON.parse(localStorage.getItem('glove.privacy-fences') ?? '[]'))
    changed = ids.some(id => !seen.has(id))
    const day = localStorage.getItem('glove.day')
    if (day && refersErased(JSON.parse(day), ids)) { localStorage.removeItem('glove.day'); changed = true }
    const items = JSON.parse(localStorage.getItem('glove.outbox') ?? '[]')
    const next = items.filter((item: unknown) => !refersErased(item, ids))
    if (next.length !== items.length) { localStorage.setItem('glove.outbox', JSON.stringify(next)); changed = true }
    const pending = sessionStorage.getItem('glove.pending-command')
    if (pending && refersErased(JSON.parse(pending), ids)) { sessionStorage.removeItem('glove.pending-command'); changed = true }
    if (!changed) return
    localStorage.setItem('glove.privacy-fences', JSON.stringify([...new Set([...seen, ...ids])]))
  } catch { /* disabled storage cannot retain a cached day */ }
  const worker = navigator.serviceWorker?.controller ?? (await navigator.serviceWorker?.getRegistration().catch(() => undefined))?.active
  if (worker) await new Promise<void>(resolve => {
    const channel = new MessageChannel(), timer = setTimeout(() => { channel.port1.close(); resolve() }, 2000)
    channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve() }
    worker.postMessage({ type: 'forget-files' }, [channel.port2])
  })
  if ('caches' in window) await caches.delete('glove-day-files')
  window.dispatchEvent(new Event('glove-privacy-erased'))
}
