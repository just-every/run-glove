import { useEffect, useState, type PointerEvent } from 'react'
import { Field, money } from './controls'
import type { Rec } from './api'

export type Choice = { optionId: string; addOnIds: string[] }
type Stroke = number[][]

/** A typed signature is always available. Pointer drawing is an alternative,
 * never a keyboard requirement, and is kept as bounded vector strokes. */
export function CustomerSigning({ quote, choice, busy, name, capacity, setName, setCapacity, respond }: { quote: Rec; choice: Choice; busy: boolean; name: string; capacity: string; setName: (s: string) => void; setCapacity: (s: string) => void; respond: (action: string, extra?: object) => Promise<void> }) {
  const [kind, setKind] = useState<'typed' | 'drawn'>('typed'), [typed, setTyped] = useState(''), [strokes, setStrokes] = useState<Stroke[]>([]), [drawing, setDrawing] = useState(false), [consent, setConsent] = useState(false)
  const selected = quote.selection
  useEffect(() => { setConsent(false); setTyped(''); setStrokes([]) }, [selected?.hash, quote.disclosure?.hash])
  const point = (e: PointerEvent<SVGSVGElement>) => { const b = e.currentTarget.getBoundingClientRect(); return [Math.round(Math.max(0, Math.min(600, (e.clientX - b.left) / b.width * 600)) * 10) / 10, Math.round(Math.max(0, Math.min(200, (e.clientY - b.top) / b.height * 200)) * 10) / 10] }
  if (!quote.signingAvailable) return null
  return <section className="document-tools" aria-labelledby="quote-signing-title">
    <h3 id="quote-signing-title">Approve the selected work</h3>
    {!selected ? <p>Choose an option and any add-ons, then review the selected work before signing.</p> : <>
      <section aria-label="Selected work"><h4>{selected.choice.optionName || 'Quoted work'}{selected.choice.addOnNames.length ? ` + ${selected.choice.addOnNames.join(' + ')}` : ''}</h4>
        <ul>{selected.document.lines.map((l: Rec, i: number) => <li key={i}>{l.description} · {l.quantity} × {money(l.unitPrice)}</li>)}</ul>
        <p>Subtotal: {money(selected.document.totals.subtotal)} · Tax: {money(selected.document.totals.tax)}</p><p><strong>Selected total including tax: {money(selected.document.totals.total)}</strong></p>
      </section>
      <form onSubmit={e => { e.preventDefault(); void respond('approve', { choice, documentHash: quote.documentHash, selectionHash: selected.hash, consent: { version: quote.disclosure.version, hash: quote.disclosure.hash, affirmed: consent }, signature: kind === 'typed' ? { kind, text: typed } : { kind, width: 600, height: 200, strokes } }) }}>
        <p>Your name and capacity are claimed, not verified. A forwarded link can be used.</p>
        <Field label="Signer name">{p => <input {...p} autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={200} required />}</Field>
        <Field label="Signer capacity" hint="For example, describe the capacity in which you are answering this quote.">{p => <input {...p} value={capacity} onChange={e => setCapacity(e.target.value)} maxLength={200} required />}</Field>
        <fieldset><legend>Signature method</legend><label><input type="radio" name="signature-method" value="typed" checked={kind === 'typed'} onChange={() => setKind('typed')} />Type my signature</label><label><input type="radio" name="signature-method" value="drawn" checked={kind === 'drawn'} onChange={() => setKind('drawn')} />Draw my signature</label></fieldset>
        {kind === 'typed' ? <Field label="Typed signature">{p => <input {...p} value={typed} onChange={e => setTyped(e.target.value)} maxLength={200} required style={{ fontSize: 22, fontFamily: 'Georgia, serif' }} />}</Field> : <div>
          <p id="signature-instructions">Draw with a pointer or your finger. You can always choose Type my signature instead.</p>
          <svg role="img" aria-label="Drawn signature area" aria-describedby="signature-instructions" viewBox="0 0 600 200" style={{ display: 'block', width: '100%', border: '2px solid #475467', background: '#fff', touchAction: 'none' }}
            onPointerDown={e => { if (strokes.length >= 40) return; e.currentTarget.setPointerCapture(e.pointerId); const p = point(e); setStrokes(s => [...s, [p]]); setDrawing(true) }}
            onPointerMove={e => { if (!drawing) return; const p = point(e); setStrokes(s => s.flat().length >= 3000 ? s : [...s.slice(0, -1), [...s[s.length - 1], p]]) }}
            onPointerUp={() => { setDrawing(false); setStrokes(s => s.filter(stroke => stroke.length > 1)) }} onPointerCancel={() => { setDrawing(false); setStrokes(s => s.filter(stroke => stroke.length > 1)) }}>
            {strokes.map((s, i) => <polyline key={i} points={s.map(p => p.join(',')).join(' ')} fill="none" stroke="#101828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
          </svg><button type="button" onClick={() => { setDrawing(false); setStrokes([]) }}>Clear drawn signature</button>
        </div>}
        <section aria-label="Consent disclosure"><h4>Disclosure version {quote.disclosure.version}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{quote.disclosure.text}</p><small>Disclosure SHA-256: {quote.disclosure.hash}</small></section>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '16px 0' }}><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} style={{ flexShrink: 0, marginTop: 5 }} /><span>I affirm the disclosure shown above and apply my signature to this selected work.</span></label>
        <button className="primary" type="submit" disabled={busy || !consent || !name.trim() || !capacity.trim() || (kind === 'typed' ? !typed.trim() : !strokes.some(s => s.length > 1))}>Sign and approve selected work</button>
      </form>
    </>}
  </section>
}

export function SignedCopyDownload({ path, token, hash }: { path: string; token?: string; hash: string }) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true); setError('')
    try {
      const response = await fetch(path, { credentials: token ? 'omit' : 'same-origin', cache: 'no-store', ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) })
      if (!response.ok) throw new Error('The signed copy could not be downloaded. Reopen the quote and try again.')
      const bytes = await response.arrayBuffer(), actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('')
      if (actual !== hash) throw new Error('The signed copy did not match its recorded hash.')
      const url = URL.createObjectURL(new Blob([bytes], { type: 'text/html;charset=utf-8' })), link = document.createElement('a')
      link.href = url; link.download = 'signed-quote.html'; link.click(); URL.revokeObjectURL(url)
    } catch (e) { setError(e instanceof Error ? e.message : 'The signed copy could not be downloaded.') }
    finally { setBusy(false) }
  }
  return <div className="document-tools"><button type="button" disabled={busy} onClick={() => void download()}>Download signed copy (HTML)</button><p className="muted">Signed copy SHA-256: {hash}</p>{error && <p className="problem" role="alert">{error}</p>}</div>
}
