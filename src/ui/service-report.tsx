import { documentDate } from '../glove/document-format'
import { DocumentImage as ReportImage } from './document-image'
import { DocumentIdentity, DocumentTools, DocumentTerms } from './documents'
import { useEffect, useState } from 'react'
import type { ReportFile, ServiceReportSnapshot } from '../glove/service-reports'
import './style'

/** Both desk preview and customer page render exactly the frozen snapshot. */
export function ServiceReportDocument({ report: r, token }: { report: ServiceReportSnapshot; token?: string }) {
  return <article className="printable-document" aria-label="Service report" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <DocumentTools /><header><DocumentIdentity business={r.business} token={token} scope="reports" /><h1>{r.template?.heading || 'Service report'}</h1><p>{r.job.number} · {r.job.title}</p><p>{r.customer.name}<br />{r.site.address}</p><p className="muted">{documentDate(r.visit.date)} · Technician: {r.visit.technician}</p></header><p>Completed {new Intl.DateTimeFormat('en-US', { timeZone: r.visit.timezone ?? 'UTC', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(r.visit.completedAt))} ({r.visit.timezone ?? 'UTC'})</p>
    <DocumentTerms template={r.template} />
    <section aria-label="Work summary"><h2>Work summary</h2><p style={{ whiteSpace: 'pre-wrap' }}>{r.summary}</p></section>
    <section aria-label="Findings"><h2>Findings</h2><p style={{ whiteSpace: 'pre-wrap' }}>{r.findings || 'No additional findings recorded.'}</p></section>
    {!!r.forms.length && <section aria-label="Inspection results"><h2>Inspection results</h2>{r.forms.map((f, i) => <section key={i}><h3>{f.name}</h3><dl>{f.answers.map((a, n) => <div key={n} style={{ marginBottom: 16 }}><dt><strong>{a.label}</strong></dt><dd style={{ marginLeft: 0 }}>{typeof a.value === 'object' ? <ReportImage file={a.value} token={token} alt={a.label} /> : typeof a.value === 'boolean' ? a.value ? 'Yes' : 'No' : `${a.value}${a.unit ? ` ${a.unit}` : ''}`}{a.type === 'reading' && <><br /><span className={a.flagged ? 'tag tag-red' : 'muted'}>{a.flagged ? 'Out of range' : 'Within range'} · expected {a.min}–{a.max} {a.unit}</span></>}</dd></div>)}</dl></section>)}</section>}
    {!!r.photos.length && <section aria-label="Photos"><h2>Photos</h2>{r.photos.map((p, i) => <figure key={i} style={{ margin: '16px 0' }}><ReportImage file={p.file} token={token} alt={p.caption || 'Visit photo'} /><figcaption>{p.caption}</figcaption></figure>)}</section>}
    {!!r.materials.length && <section aria-label="Materials"><h2>Materials used</h2><ul>{r.materials.map((m, i) => <li key={i}>{m.description} × {m.quantity} {m.unit}</li>)}</ul></section>}
    <section aria-label="Customer sign-off"><h2>Customer sign-off</h2>{r.signoff.customerPresent ? <><p>Signed by {r.signoff.customerName}</p>{r.signoff.signature && <ReportImage file={r.signoff.signature} token={token} alt={`Signature of ${r.signoff.customerName}`} />}</> : <p>Customer not present: {r.signoff.absentReason}</p>}</section>
    <section aria-label="Recommendations"><h2>Recommendations</h2>{r.recommendations.length ? r.recommendations.map(r => <div key={r.id}><h3>{r.title}</h3>{r.description && <p style={{ whiteSpace: 'pre-wrap' }}>{r.description}</p>}</div>) : <p>No further work recommended.</p>}</section>
    {(r.business.phone || r.business.email) && <footer><p className="muted">Contact {r.business.name}: {[r.business.phone, r.business.email].filter(Boolean).join(' · ')}</p></footer>}
  </article>
}

/** The fragment is read only in this browser. Requests send it in the header;
 * no token is persisted, placed in a query string or sent to an image URL. */
export function PublicServiceReport() {
  const [state, setState] = useState<{ report?: ServiceReportSnapshot; token?: string; error?: string }>({})
  useEffect(() => {
    const controller = new AbortController()
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? ''
    if (!/^glr_[A-Za-z0-9_-]{43}$/.test(token)) { setState({ error: 'This report link is unavailable. Ask the business for a new link.' }); return }
    fetch('/api/glove/public/reports', { signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Authorization: `Bearer ${token}` } })
      .then(async response => { const body = await response.json() as any; if (!response.ok) throw new Error(body.error?.message ?? 'This report link is unavailable.'); return body.report as ServiceReportSnapshot })
      .then(report => { if (!controller.signal.aborted) setState({ report, token }) })
      .catch(error => { if (!controller.signal.aborted) setState({ error: error.message }) })
    return () => controller.abort()
  }, [])
  return <main className="glove-app" style={{ display: 'block', minHeight: '100vh' }}><div className="page" style={{ width: '100%', maxWidth: 860, margin: '0 auto', boxSizing: 'border-box' }}><section className="panel">{state.error ? <p className="problem" role="alert">{state.error}</p> : state.report ? <ServiceReportDocument report={state.report} token={state.token} /> : <p role="status">Loading service report…</p>}</section></div></main>
}
