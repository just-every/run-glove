import { useEffect, useRef, useState } from 'react'
import { Field } from './controls'
import './style'

type Widget = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void }
type PublicConfig = { businessName: string; siteKey: string; action: string }
type Photo = { mediaType: string; base64: string; caption: string }
const widget = () => (window as unknown as { turnstile?: Widget }).turnstile

/** Anonymous intake only. No account or existing-customer data is loaded. */
export function RequestForm() {
  const [config, setConfig] = useState<PublicConfig | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [receipt, setReceipt] = useState('')
  const [token, setToken] = useState(''), [consent, setConsent] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', zip: '', service: '', description: '', preferredTimes: '' })
  const [files, setFiles] = useState<File[]>([]), host = useRef<HTMLDivElement>(null), widgetId = useRef<string | null>(null)
  const submissionId = useRef(crypto.randomUUID())
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/glove/public/intake', { credentials: 'omit', cache: 'no-store', signal: controller.signal })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body.error?.message ?? 'This business is not accepting online requests.'); return body })
      .then(setConfig).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [])
  useEffect(() => {
    if (!config || !host.current || receipt) return
    let live = true
    const render = () => {
      if (!live || !host.current || !widget()) return
      widgetId.current = widget()!.render(host.current, { sitekey: config.siteKey, action: config.action, callback: (value: string) => setToken(value), 'expired-callback': () => setToken(''), 'error-callback': () => { setToken(''); setError('Spam protection could not complete. Try it again before sending.') } })
    }
    let script: HTMLScriptElement | undefined
    if (widget()) render()
    else {
      script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true
      script.addEventListener('load', render); script.addEventListener('error', () => { if (live) setError('Spam protection could not load. Check your connection and reload this page.') })
      document.head.appendChild(script)
    }
    return () => { live = false; if (widgetId.current) widget()?.remove(widgetId.current); widgetId.current = null; script?.remove() }
  }, [config, receipt])
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm(v => ({ ...v, [key]: e.target.value }))
  const submit = async () => {
    setBusy(true); setError('')
    try {
      const photos: Photo[] = await Promise.all(files.map(async f => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 1_500_000) throw new Error('Choose JPEG, PNG or WebP photos under 1.5 MB each.')
        const bytes = new Uint8Array(await f.arrayBuffer())
        let binary = ''; for (let at = 0; at < bytes.length; at += 8192) binary += String.fromCharCode(...bytes.subarray(at, at + 8192))
        return { mediaType: f.type, base64: btoa(binary), caption: f.name.slice(0, 200) }
      }))
      const response = await fetch('/api/glove/public/intake', { credentials: 'omit', cache: 'no-store', method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, submissionId: submissionId.current, turnstileToken: token, consent, source: new URLSearchParams(location.search).get('source') || 'website', photos }) })
      const body: any = await response.json()
      if (!response.ok) throw new Error(body.error?.message ?? 'The request was not confirmed. Try sending it again.')
      setReceipt(body.receipt); setFiles([]); setForm({ name: '', phone: '', email: '', address: '', zip: '', service: '', description: '', preferredTimes: '' }); setToken('')
    } catch (e) { setError(e instanceof Error ? e.message : 'The request was not confirmed. Try sending it again.'); setToken(''); if (widgetId.current) widget()?.reset(widgetId.current) }
    finally { setBusy(false) }
  }
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 720, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel" aria-label="Request service" style={{ overflowWrap: 'anywhere' }}>
    <p className="muted">{config?.businessName}</p><h1>{receipt ? 'Request received' : 'Request service'}</h1>
    {error && <p className="problem" role="alert">{error}</p>}
    {receipt ? <div role="status"><p>Your request is with the office. A requested time is not a confirmed booking; the office will contact you.</p><p>Receipt: {receipt}</p></div> : config ? <form onSubmit={e => { e.preventDefault(); if (token && consent) void submit() }} aria-busy={busy}>
      <p>Tell the office what you need and when you are available. This form requests a visit; it does not book one.</p>
      <Field label="Service wanted">{p => <input {...p} value={form.service} onChange={set('service')} maxLength={200} required />}</Field>
      <Field label="What needs attention">{p => <textarea {...p} value={form.description} onChange={set('description')} maxLength={3000} required />}</Field>
      <div className="form-grid two"><Field label="Your name">{p => <input {...p} value={form.name} onChange={set('name')} autoComplete="name" maxLength={200} required />}</Field>
        <Field label="Phone">{p => <input {...p} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} required={!form.email} />}</Field>
        <Field label="Email">{p => <input {...p} type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={200} required={!form.phone} />}</Field>
        <Field label="ZIP code">{p => <input {...p} value={form.zip} onChange={set('zip')} autoComplete="postal-code" maxLength={20} />}</Field></div>
      <Field label="Service address">{p => <textarea {...p} value={form.address} onChange={set('address')} autoComplete="street-address" maxLength={500} required />}</Field>
      <Field label="Preferred dates and times">{p => <textarea {...p} value={form.preferredTimes} onChange={set('preferredTimes')} maxLength={500} required />}</Field>
      <Field label="Photos (up to two)">{p => <input {...p} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { const chosen = Array.from(e.target.files ?? []); if (chosen.length > 2) { setError('Choose at most two photos.'); e.target.value = ''; setFiles([]) } else { setError(''); setFiles(chosen) } }} />}</Field>
      <p className="muted">JPEG, PNG or WebP, under 1.5 MB each. Include only photos you want the office to see. Request photos are not sent to the AI quote-drafting provider.</p>
      <label className="check-line"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /> I am asking {config.businessName} to contact me about this request and share these details and photos with its office.</label>
      <div ref={host} aria-label="Spam protection" />
      <div className="actions"><button className="primary" disabled={busy || !token || !consent}>{busy ? 'Sending request…' : 'Send request'}</button></div>
    </form> : !error && <p role="status">Loading request form…</p>}
  </section></div></main>
}
