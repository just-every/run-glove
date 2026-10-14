import { useCallback, useEffect, useRef, useState } from 'react'
import { send } from './api'

// The technician's phone outbox. Everything recorded on a visit goes here
// first, with the command identity it was given at capture time and the
// phone's clock time, and is kept in this browser's storage until the server
// confirms it. Sending is in capture order; a resend after a dropped
// connection carries the same identity, so it lands once.

export type Queued = { commandId: string; type: string; payload: Record<string, any>; label: string; queuedAt: string; refused?: { code: string; message: string } }
const KEY = 'glove.outbox'

const read = (): Queued[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export function useOutbox(onSent: () => Promise<void>) {
  const [items, setItems] = useState<Queued[]>([])
  const [online, setOnline] = useState(true)
  const [storageError, setStorageError] = useState('')
  const sending = useRef(false)
  const save = (next: Queued[]) => {
    try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError('') }
    catch { setStorageError('This phone is out of space for waiting items. Reconnect to send them before adding more photos.'); return false }
    setItems(next)
    return true
  }
  const flush = useCallback(async () => {
    if (sending.current || !navigator.onLine) return
    sending.current = true
    let changed = false
    try {
      for (const item of read()) {
        if (item.refused) continue
        let reply
        try { reply = await send(item.commandId, item.type, item.payload) } catch { setOnline(false); break }
        if (reply.status >= 500) break
        const rest = read().filter(x => x.commandId !== item.commandId)
        // A refusal is the server's decision; keep the item visible until the technician dismisses it.
        save(reply.body.ok ? rest : [...rest, { ...item, refused: reply.body.error }])
        changed = true
      }
    } finally { sending.current = false }
    if (changed) await onSent().catch(() => {})
  }, [onSent])
  useEffect(() => {
    setItems(read()); setOnline(navigator.onLine)
    const up = () => { setOnline(true); void flush() }, down = () => setOnline(false)
    window.addEventListener('online', up); window.addEventListener('offline', down)
    void flush()
    const timer = window.setInterval(() => void flush(), 15000)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); window.clearInterval(timer) }
  }, [flush])
  const queue = (type: string, payload: Record<string, any>, label: string) => {
    const item: Queued = { commandId: crypto.randomUUID(), type, payload: { ...payload, deviceTime: new Date().toISOString() }, label, queuedAt: new Date().toISOString() }
    if (save([...read(), item])) void flush()
  }
  const dismiss = (commandId: string) => save(read().filter(x => x.commandId !== commandId))
  return { items, online, storageError, queue, flush, dismiss }
}
