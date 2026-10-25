import { useEffect, useRef, useState } from 'react'
import { send, type Glove } from './api'
import { Field } from './controls'
import './style'

type Attempt = { commandId: string; payload: { version: number; enabled: boolean; consent?: boolean; photo?: { mediaType: string; base64: string } } }

/** Personal consent is online and kept out of the field evidence outbox. */
export function PhonePortrait({ s, refresh, online }: { s: Glove; refresh: () => Promise<void>; online: boolean }) {
  const tech = s.technicians.find(t => t.operatorId === s.actor.id)
  const [file, setFile] = useState<File | null>(null), [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(''), [pending, setPending] = useState<Attempt | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  if (s.actor.role !== 'technician' || !tech || !s.actor.commands.includes('technician.portrait')) return null
  async function submit(enabled: boolean) {
    if (!tech || busy || !online) return
    setBusy(true); setError(''); setNotice('')
    let attempt = pending
    try {
      if (!attempt) {
        if (enabled && (!file || !consent)) throw new Error('Choose your photo and explicitly consent to customer sharing.')
        let photo: { mediaType: string; base64: string } | undefined
        if (enabled && file) {
          if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 1_500_000) throw new Error('Choose a PNG or JPEG photo up to 1.5 MB.')
          const bytes = new Uint8Array(await file.arrayBuffer())
          let binary = ''
          for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
          photo = { mediaType: file.type, base64: btoa(binary) }
        }
        attempt = { commandId: crypto.randomUUID(), payload: { version: tech.version, enabled, ...(enabled ? { consent: true, photo } : {}) } }
      }
      setPending(attempt)
      const { status, body } = await send(attempt.commandId, 'technician.portrait', attempt.payload)
      if (!body.ok) {
        if (status < 500 && body.error?.code !== 'BUSY') setPending(null)
        throw new Error(body.error?.message ?? 'The photo update could not be confirmed.')
      }
      setPending(null); setFile(null); setConsent(false)
      if (input.current) input.current.value = ''
      setNotice(attempt.payload.enabled ? 'Your photo and consent are saved. On-my-way texts can share it for two hours.' : 'Photo sharing stopped. Your photo and existing customer photo links were removed.')
      await refresh()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="card" aria-label="Your customer photo" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2 className="section-title">Your customer photo</h2>
    <p>Upload your own photo so customers can recognize you. With your consent, an on-my-way text shares your first name and photo through a link that expires after two hours. Anyone with that link can open it. Stopping sharing removes your photo and closes existing links.</p>
    <p role="status">{tech.portrait?.enabled && tech.portrait.by === s.actor.id ? 'Customer photo sharing is enabled.' : 'Customer photo sharing is off.'}</p>
    {tech.portrait?.enabled && tech.portrait.by === s.actor.id && tech.portrait.file?.fileId && <img src={`/api/glove/files/${tech.portrait.file.fileId}`} alt="Your saved customer photo" style={{ width: 144, maxWidth: '100%', height: 144, objectFit: 'cover' }} />}
    {!tech.active && <p>Your technician profile is inactive. You can still stop sharing and remove your photo.</p>}
    <form onSubmit={e => { e.preventDefault(); void submit(true) }}>
      <fieldset disabled={busy || !online || !!pending || !tech.active} style={{ border: 0, padding: 0, minWidth: 0 }}>
        <legend>Upload and consent</legend>
        <Field label="Your photo" hint="PNG or JPEG, up to 1.5 MB.">{p => <input {...p} ref={input} type="file" accept="image/png,image/jpeg" required onChange={e => { setFile(e.target.files?.[0] ?? null); setConsent(false); setError('') }} />}</Field>
        {preview && <img src={preview} alt="Your selected customer photo" style={{ width: 144, maxWidth: '100%', height: 144, objectFit: 'cover' }} />}
        <label className="check-line"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> This is my photo. I consent to sharing it and my first name through two-hour links in my on-my-way customer texts.</label>
        <button type="submit" disabled={!file || !consent}>Save photo and consent</button>
      </fieldset>
    </form>
    {pending ? <button type="button" disabled={busy || !online} onClick={() => void submit(pending.payload.enabled)}>Recover photo update result</button> : tech.portrait?.enabled && <button type="button" disabled={busy || !online} onClick={() => void submit(false)}>Stop sharing and remove my photo</button>}
    {!online && <p>Reconnect to change your photo or sharing consent.</p>}
    {notice && <p role="status">{notice}</p>}{error && <p className="problem" role="alert">{error}</p>}
  </section>
}

/** Fragments are removed from history immediately. Credentials and image bytes
 * remain in this component's memory; neither request carries native cookies. */
export function PublicTechnicianPortrait() {
  const [state, setState] = useState<{ firstName?: string; src?: string; error?: string }>({})
  const token = useRef<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    if (token.current === null) {
      token.current = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
      window.history.replaceState(null, '', window.location.pathname)
    }
    const credential = token.current
    const unavailable = 'This technician photo is unavailable or has expired. Contact the business if you need help recognizing your technician.'
    if (!/^gtp_[A-Za-z0-9_-]{43}$/.test(credential)) { setState({ error: unavailable }); return }
    const options = { signal: controller.signal, credentials: 'omit' as const, cache: 'no-store' as const, headers: { Authorization: `Bearer ${credential}` } }
    void (async () => {
      const metadata = await fetch('/api/glove/public/technician-photo', options)
      if (!metadata.ok) throw new Error(unavailable)
      const body = await metadata.json() as { firstName: string }
      const image = await fetch('/api/glove/public/technician-photo/image', options)
      if (!image.ok) throw new Error(unavailable)
      const blob = await image.blob()
      if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setState({ firstName: body.firstName, src: objectUrl }) }
    })().catch(() => { if (!controller.signal.aborted) setState({ error: unavailable }) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [])
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h1>Your technician</h1>{state.error ? <p className="problem" role="alert">{state.error}</p> : state.src ? <><h2>{state.firstName}</h2><img src={state.src} alt={`Your technician, ${state.firstName}`} style={{ width: '100%', maxHeight: 480, objectFit: 'contain' }} /><p>This photo link is available for up to two hours and can be withdrawn by the technician.</p></> : <p role="status">Loading technician photo…</p>}
  </section></div></main>
}
