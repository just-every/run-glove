import { documentDate, documentPhone } from '../glove/document-format'
import { useEffect, useState } from 'react'
import { DocumentImage } from './document-image'
import { Field, Problem, money, useAction } from './controls'
import { shrink } from './photos'
import type { Glove, Rec, Run } from './api'
import './documents.css'

export function DocumentIdentity({ business: b, token, scope = 'quote' }: { business: any; token?: string; scope?: 'quote' | 'reports' }) {
  return <div className="document-identity">
    {b.logo && <DocumentImage file={b.logo} token={token} scope={scope} alt={`${b.name} logo`} />}
    <div><h2>{b.legalName || b.name}</h2>{b.dba && <p>DBA {b.dba}</p>}<p>{b.address}</p><p>{`${documentPhone(b.phone ?? '')} ${b.email ?? ''}`}</p>
      {b.ein && <p>EIN: {b.ein}</p>}{b.licenses?.map((l: Rec, i: number) => <p key={i}>{l.trade} · {l.state} license {l.number}</p>)}
      {b.insurance && <p>Insurance: {b.insurance.carrier} · {b.insurance.policy} · expires {documentDate(b.insurance.expires)}</p>}
    </div>
  </div>
}
export function DocumentTools() {
  useEffect(() => {
    let previous: string | null = null
    // Browser print headers must never copy a bearer fragment into a PDF.
    const before = () => { if (new URLSearchParams(location.hash.slice(1)).has('token')) { previous = location.href; history.replaceState(null, '', location.pathname + location.search) } }
    const after = () => { if (previous) { history.replaceState(null, '', previous); previous = null } }
    window.addEventListener('beforeprint', before); window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); after() }
  }, [])
  return <div className="document-tools"><button type="button" onClick={() => window.print()}>Print / Save PDF</button><p className="muted">Choose Save as PDF in your browser’s print destination.</p></div>
}
export function DocumentTerms({ template }: { template?: any }) {
  return <>{template?.terms && <section><h3>Document terms</h3><p style={{ whiteSpace: 'pre-wrap' }}>{template.terms}</p></section>}{template?.footer && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{template.footer}</p>}</>
}
export function DocumentPhotos({ s, run, kind, record }: { s: Glove; run: Run; kind: string; record: Rec }) {
  const [photo, setPhoto] = useState<any>(null), [caption, setCaption] = useState('')
  const { error, act } = useAction()
  if (s.actor.role !== 'owner') return null
  return <section aria-label="Customer document photos"><h3>Customer document photos</h3><p>Attach only photos intended for this customer. A newly issued quote link freezes these attachments.</p>
    <ul>{(record.documentPhotos ?? []).map((p: any, i: number) => <li key={i}>{p.caption || 'Attached photo'}</li>)}</ul>
    <form onSubmit={e => { e.preventDefault(); if (photo) void act(run('document.photo', { kind, id: record.id, version: record.version, photo, caption })) }}>
      <Field label="Document photo">{p => <input {...p} type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; setPhoto(f ? await shrink(f) : null) }} />}</Field>
      <Field label="Photo caption">{p => <input {...p} value={caption} onChange={e => setCaption(e.target.value)} maxLength={300} />}</Field>
      <button type="submit" disabled={!photo}>Attach customer photo</button><Problem error={error} />
    </form>
  </section>
}
export function DocumentTemplates({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0], [kind, setKind] = useState('quote')
  const defaults = { heading: 'Quote', terms: '', footer: '' }
  const [form, setForm] = useState(b?.documentTemplates?.quote ?? defaults)
  const { error, act } = useAction()
  if (s.actor.role !== 'owner' || !b) return null
  const choose = (value: string) => { setKind(value); setForm(b.documentTemplates?.[value] ?? { ...defaults, heading: value === 'report' ? 'Service report' : value === 'agreement' ? 'Service agreement' : value[0].toUpperCase() + value.slice(1) }) }
  return <section className="panel" aria-label="Document templates"><h2>Document templates</h2><p>Plain text only. New quote links and completed reports freeze their template and business identity; existing snapshots stay unchanged.</p>
    <form onSubmit={e => { e.preventDefault(); void act(run('document.template', { kind, version: b.version, ...form })) }}>
      <Field label="Document kind">{p => <select {...p} value={kind} onChange={e => choose(e.target.value)}><option value="quote">Quote</option><option value="invoice">Invoice</option><option value="report">Service report</option><option value="agreement">Agreement</option></select>}</Field>
      <Field label="Document heading">{p => <input {...p} value={form.heading} onChange={e => setForm({ ...form, heading: e.target.value })} maxLength={120} required />}</Field>
      <Field label="Document terms">{p => <textarea {...p} value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} maxLength={8000} />}</Field>
      <Field label="Document footer">{p => <textarea {...p} value={form.footer} onChange={e => setForm({ ...form, footer: e.target.value })} maxLength={2000} />}</Field>
      <button type="submit">Save document template</button><Problem error={error} />
    </form>
  </section>
}
export function FinancialDocument({ document: d }: { document: any }) {
  return <article className="printable-document" aria-label={`${d.kind} document`}><DocumentTools /><DocumentIdentity business={d.business} /><h1>{d.template?.heading} {d.number}</h1><h2>{d.title}</h2><p>{d.customer.name}</p><p>{d.customer.billingAddress}</p><p>{d.site.address}</p><p>{documentDate(d.date)}{d.due ? ` · Due ${documentDate(d.due)}` : ''} · {d.status}{d.revision ? ` · Revision ${d.revision}` : ''}</p>
    <ul className="rows">{d.lines.map((l: any, i: number) => <li key={i}><div><strong>{l.description}</strong><p>{l.customerDescription}</p>{(l.images ?? []).map((file: any) => <DocumentImage key={file.fileId} file={file} alt={l.description} />)}<p>{l.quantity} × {money(l.unitPrice)} · {money(l.total)}</p></div></li>)}</ul>
    <p>Subtotal: {money(d.totals.subtotal)}</p>{d.totals.tax !== null && <p>Tax: {money(d.totals.tax)}</p>}<p><strong>Total: {money(d.totals.total)}</strong></p>
    {d.photos.map((p: any, i: number) => <figure key={i}><DocumentImage file={p.file} alt={p.caption || 'Document photo'} /><figcaption>{p.caption}</figcaption></figure>)}<DocumentTerms template={d.template} />
  </article>
}
export function DocumentPage() {
  const [document, setDocument] = useState<any>(null), [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController(), params = new URLSearchParams(window.location.search), kind = params.get('kind'), id = params.get('id')
    if (!['invoice', 'agreement'].includes(kind ?? '') || !/^[A-Za-z0-9-]{1,100}$/.test(id ?? '')) { setError('Choose an invoice or agreement document.'); return }
    fetch(`/api/glove/documents/${kind}/${id}`, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' }).then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body.error?.message ?? 'Document unavailable.'); return body }).then(d => setDocument(d)).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [])
  return <main className="glove-app" style={{ display: 'block' }}><div className="page" style={{ maxWidth: 860, margin: '0 auto' }}><section className="panel">{error ? <p role="alert">{error}</p> : document ? <FinancialDocument document={document} /> : <p role="status">Loading document…</p>}</section></div></main>
}
