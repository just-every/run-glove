import { DocumentEmail } from './document-email'
import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import { ServiceReportDocument } from './service-report'

type ReportState = Glove & { serviceReports: Rec[]; serviceReportLinks: Rec[] }

function QuoteRecommendation({ s, report, recommendation, run }: { s: Glove; report: Rec; recommendation: Rec; run: Run }) {
  const action = useAction(), item = s.services.find(x => x.id === recommendation.serviceId)
  const [price, setPrice] = useState(item?.unitPrice ?? ''), [quote, setQuote] = useState<Rec | null>(null)
  return <form onSubmit={e => { e.preventDefault(); void action.act(run('report.quote', { reportId: report.id, recommendationId: recommendation.id, unitPrice: price }), setQuote) }}>
    <h4>{recommendation.title}</h4><p>{recommendation.description}</p>
    {quote ? <p role="status"><a href="#quotes">{quote.number} drafted</a> · A person must approve its price before it is sent.</p> : <><Field label="Unit price">{p => <input {...p} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required />}</Field><button type="submit">Draft quote from recommendation</button></>}
    <Problem error={action.error} />
  </form>
}

function ReportLinks({ s, report, run }: { s: ReportState; report: Rec; run: Run }) {
  const action = useAction(), [url, setUrl] = useState(''), [notice, setNotice] = useState(''), [preview, setPreview] = useState(false)
  const links = s.serviceReportLinks.filter(l => l.reportId === report.id)
  const create = async () => {
    setNotice(''); setUrl('')
    const outcome = await action.act(run('report.link', { reportId: report.id }))
    if (!outcome.ok) return
    if (!outcome.result.token) { setNotice('This link’s secret is shown only once. Create another link to copy it.'); return }
    const value = `${window.location.origin}/report#token=${outcome.result.token}`
    setUrl(value)
    try { await navigator.clipboard.writeText(value); setNotice('Report link copied. Share it with the customer. It expires in seven days.') }
    catch { setNotice('Select and copy the report link below. It expires in seven days.') }
  }
  return <section aria-label={`Service report ${report.snapshot.visit.date}`} style={{ minWidth: 0 }}>
    <h3>Service report · {report.snapshot.visit.date}</h3>
    <div className="actions"><button type="button" onClick={() => setPreview(!preview)}>{preview ? 'Close report preview' : 'Preview service report'}</button>{can(s.actor, 'report.link') && <button type="button" onClick={() => void create()}>Copy report link</button>}{s.actor.role === 'owner' && can(s.actor, 'report.link') && <button type="button" onClick={() => action.act(run('report.link', { reportId: report.id, email: true }), () => setNotice('Report link submitted through customer email. Check its provider outcome below.'))}>Email report link</button>}</div>
    {notice && <p role="status">{notice}</p>}
    {url && <Field label="Report link">{p => <input {...p} value={url} readOnly onFocus={e => e.target.select()} />}</Field>}
    <ul className="rows">{links.map(link => <li key={link.id}><div><p>{link.revokedAt ? 'Revoked' : Date.parse(link.expiresAt) <= Date.now() ? 'Expired' : 'Active'} · expires {new Date(link.expiresAt).toLocaleDateString('en-US')}</p>{!link.revokedAt && can(s.actor, 'report.revoke') && <button type="button" onClick={() => action.act(run('report.revoke', { linkId: link.id, version: link.version }), () => { setUrl(''); setNotice('Report link revoked.') })}>Revoke report link</button>}</div></li>)}</ul>
    <DocumentEmail s={s} run={run} record={report} kind="reportReady" ready={false} />
    <Problem error={action.error} />
    {preview && <ServiceReportDocument report={report.snapshot} />}
    {can(s.actor, 'report.quote') && report.recommendations.map((r: Rec) => <QuoteRecommendation key={r.id} s={s} report={report} recommendation={r} run={run} />)}
  </section>
}

export function JobServiceReports({ s, job, run }: { s: ReportState; job: Rec; run: Run }) {
  const reports = s.serviceReports.filter(r => r.jobId === job.id)
  return reports.length ? <section aria-label="Service reports">{reports.map(report => <ReportLinks key={report.id} s={s} report={report} run={run} />)}</section> : null
}
