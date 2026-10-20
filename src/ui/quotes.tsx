import { useEffect, useState } from 'react'
import { byId, roleName, shiftDate, today, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { OptionsEditor, OptionsView, ChoiceFields, SaveTemplate, blocksOf, optionsPayload, type Block, type Choice } from './options'
import { can } from './roles'
import { ServiceCallForm } from './service-call'
import { AssessmentForm, QuoteAssessment } from './assessment'

// Requests and quotes: each request's source and pipeline stage (new,
// contacted, quoted, won, lost with a reason) with how long it has sat there,
// conversion and revenue by source, then a draft (by a person or an agent), its revisions, the
// price approval of one exact revision, "sent" as a record of what a person did
// (never a delivery claim), and the customer's answer with how it was given.

const tone = { draft: 'grey', approved: 'blue', sent: 'blue', accepted: 'green', declined: 'red' } as const
/** A stored lowercase value shown to people in sentence case. */
const option = (value: string) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>

export function Quotes({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState<string | null>(null)
  const [drafting, setDrafting] = useState<{ enquiryId?: string } | null>(null)
  const quote = byId(s.quotes, open)
  return <div className="page">
    <section className="titlebar"><div><h1>Quotes</h1><p className="subtitle">Requests, priced quotes and the customer's answer</p></div>
      <div className="date-actions">{can(s.actor, 'quote.draft') && <button className="primary" onClick={() => { setDrafting({}); setOpen(null) }}>New quote</button>}</div></section>
    <div className="two-col quotes-layout">
      <div>
        <section className="panel"><h2>Quotes</h2>
          {!s.quotes.length ? <Empty title="No quotes yet">Draft one from a request or with New quote.</Empty> :
            <table className="table"><thead><tr><th>Quote</th><th>Customer</th><th>Total incl. tax</th><th>Status</th></tr></thead><tbody>
              {[...s.quotes].reverse().map(q => { const rev = q.revisions.at(-1); return <tr key={q.id} className={open === q.id ? 'selected' : ''}><td><button className="link-button" onClick={() => { setOpen(q.id); setDrafting(null) }}><span className="nowrap">{q.number}</span> · {q.title}</button></td><td>{byId(s.customers, q.customerId)?.name}</td><td>{money((q.acceptance?.totals ?? rev.totals).total)}</td><td><Badge tone={tone[q.status as keyof typeof tone] ?? 'grey'}>{q.status === 'draft' && rev.preparedBy.role === 'agent' ? 'Agent draft' : q.status[0].toUpperCase() + q.status.slice(1)}</Badge></td></tr> })}
            </tbody></table>}
        </section>
        <SourceReport s={s} />
      </div>
      <div>
        {drafting && <QuoteDraft s={s} run={run} enquiryId={drafting.enquiryId} done={id => { setDrafting(null); setOpen(id) }} />}
        {quote && <QuoteDetail key={quote.id + quote.version} s={s} quote={quote} run={run} />}
        {can(s.actor, 'enquiry.create') && <EnquiryForm s={s} run={run} />}
        <Pipeline s={s} run={run} quote={enquiryId => { setDrafting({ enquiryId }); setOpen(null) }} />
      </div>
    </div>
  </div>
}

function EnquiryForm({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState({ customerId: '', siteId: '', description: '', source: 'phone' })
  const { error, act } = useAction()
  const sites = s.sites.filter(x => x.customerId === form.customerId)
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('enquiry.create', { ...form, siteId: form.siteId || undefined }), () => setForm({ ...form, description: '' })) }}>
    <h2>Record a request</h2>
    <div className="form-grid">
      <Field label="Customer">{p => <select {...p} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, siteId: '' })} required><option value="">Choose a customer</option>{s.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>
      <Field label="Site">{p => <select {...p} value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })}><option value="">Not yet known</option>{sites.map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
      <Field label="Source">{p => <select {...p} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{sources.map(option)}</select>}</Field>
    </div>
    <Field label="What the customer needs">{p => <textarea {...p} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />}</Field>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Record request</button></div>
  </form>
}

const sources = ['phone', 'website', 'google', 'text', 'email', 'in person', 'angi', 'thumbtack', 'yelp', 'referral', 'repeat customer', 'marketing campaign']
const stages = [['new', 'New'], ['contacted', 'Contacted'], ['quoted', 'Quoted'], ['won', 'Won'], ['lost', 'Lost']] as const
/** When a request reached its stage, in calendar days in the business's zone: today, yesterday, 3 days ago. */
const age = (iso: string, zone: string) => {
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const at = day(new Date(iso)), now = today(zone)
  if (at === now) return 'today'
  if (at === shiftDate(now, -1)) return 'yesterday'
  return `${Math.round((Date.parse(`${now}T00:00:00Z`) - Date.parse(`${at}T00:00:00Z`)) / 86_400_000)} days ago`
}

/** The aging pipeline board: every request in its stage, oldest first, with the next step a person can take. */
function Pipeline({ s, run, quote }: { s: Glove; run: Run; quote: (enquiryId: string) => void }) {
  const [losing, setLosing] = useState<string | null>(null), [reason, setReason] = useState(''), [calling, setCalling] = useState<string | null>(null)
  const { error, act } = useAction()
  const me = s.actor, zone = s.business[0]?.timezone ?? 'America/Chicago'
  return <section className="panel" aria-labelledby="pipeline-title"><h2 id="pipeline-title">Request pipeline</h2>
    {!s.enquiries.length ? <Empty title="No requests yet">Record one above; it starts as new.</Empty> : stages.map(([stage, label]) => {
      const rows = s.enquiries.filter(e => e.status === stage).sort((a, b) => a.stageAt.localeCompare(b.stageAt))
      if (!rows.length) return null
      return <div key={stage}><h3>{label} <span className="muted">({rows.length})</span></h3><ul className="rows">{rows.map(e => <li key={e.id}><div><strong>{byId(s.customers, e.customerId)?.name}</strong><p>{e.description}</p>
        <p className="muted">{e.source[0].toUpperCase() + e.source.slice(1)} · {label.toLowerCase()} {age(e.stageAt, zone)}{e.lostReason ? ` · ${e.lostReason}` : ''}</p>
        {losing === e.id && <form className="inline-form" onSubmit={ev => { ev.preventDefault(); void act(run('enquiry.close', { enquiryId: e.id, version: e.version, reason }), () => { setLosing(null); setReason('') }) }}>
          <Field label="Why it was lost">{p => <input {...p} value={reason} onChange={ev => setReason(ev.target.value)} required />}</Field><button type="submit">Mark lost</button></form>}
        {calling === e.id && <ServiceCallForm s={s} run={run} customerId={e.customerId} enquiry={e} done={() => setCalling(null)} />}{calling === `assess-${e.id}` && <AssessmentForm s={s} run={run} enquiry={e} done={() => setCalling(null)} />}{e.assessmentJobId && <p className="muted">Assessment <a href={`#jobs/${e.assessmentJobId}`}>{byId(s.jobs, e.assessmentJobId)?.number}</a> · {byId(s.jobs, e.assessmentJobId)?.status}</p>}</div>
        {['new', 'contacted', 'quoted'].includes(stage) && <div className="actions">
          {stage === 'new' && can(me, 'enquiry.contact') && <button onClick={() => act(run('enquiry.contact', { enquiryId: e.id, version: e.version }))}>Contacted</button>}
          {stage !== 'quoted' && can(me, 'quote.draft') && <button onClick={() => quote(e.id)}>Quote it</button>}
          {stage !== 'quoted' && e.siteId && s.business[0]?.model && can(me, 'quote.suggest') && <button onClick={() => act(run('quote.suggest', { enquiryId: e.id }))}>Draft with the model</button>}
          {stage !== 'quoted' && can(me, 'job.create') && <button onClick={() => setCalling(calling === e.id ? null : e.id)}>Service call</button>}
          {stage !== 'quoted' && !e.assessmentJobId && can(me, 'assessment.book') && <button onClick={() => setCalling(calling === `assess-${e.id}` ? null : `assess-${e.id}`)}>Assessment</button>}
          {can(me, 'enquiry.close') && losing !== e.id && <button className="quiet" onClick={() => { setLosing(e.id); setReason('') }}>Lost</button>}
        </div>}</li>)}</ul></div>
    })}
    <Problem error={error} />
  </section>
}

/** Conversion and revenue by source, from GET /api/glove/reports/sources. */
function SourceReport({ s }: { s: Glove }) {
  const [report, setReport] = useState<any>(null)
  useEffect(() => {
    let live = true
    void fetch('/api/glove/reports/sources', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(body => { if (live) setReport(body) })
    return () => { live = false }
  }, [s.version])
  if (!report?.sources.length) return null
  return <section className="panel" aria-labelledby="sources-title"><h2 id="sources-title">Requests by source</h2>
    <table className="table"><thead><tr><th>Source</th><th>Requests</th><th>Won</th><th>Conversion</th><th>Won value</th><th>Invoiced</th></tr></thead><tbody>
      {report.sources.map((r: Rec) => <tr key={r.source}><td>{r.source[0].toUpperCase() + r.source.slice(1)}</td><td data-label="Requests">{r.requests}</td><td data-label="Won">{r.won}</td><td data-label="Conversion">{r.conversion}%</td><td data-label="Won value">{money(r.wonValue)}</td><td data-label="Invoiced">{money(r.invoiced)}</td></tr>)}
    </tbody><tfoot><tr><td>All sources</td><td>{report.total.requests}</td><td>{report.total.won}</td><td>{report.total.conversion}%</td><td>{money(report.total.wonValue)}</td><td>{money(report.total.invoiced)}</td></tr></tfoot></table>
  </section>
}

function QuoteDraft({ s, run, enquiryId, done }: { s: Glove; run: Run; enquiryId?: string; done: (id: string) => void }) {
  const enquiry = byId(s.enquiries, enquiryId)
  const [form, setForm] = useState({ customerId: enquiry?.customerId ?? '', siteId: enquiry?.siteId ?? '', title: enquiry?.description.slice(0, 80) ?? '', notes: '' })
  const [options, setOptions] = useState<Block[]>(blocksOf(null).options), [addOns, setAddOns] = useState<Block[]>([])
  const [templateId, setTemplateId] = useState('')
  const { error, act } = useAction()
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('quote.draft', { ...form, enquiryId, ...(templateId ? { templateId, notes: form.notes || undefined } : optionsPayload(options, addOns)) }), q => done(q.id)) }}>
    <h2>{enquiry ? `Quote for ${byId(s.customers, enquiry.customerId)?.name}` : 'New quote'}</h2>
    <div className="form-grid">
      {!enquiry && <Field label="Customer">{p => <select {...p} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, siteId: '' })} required><option value="">Choose a customer</option>{s.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>}
      <Field label="Site">{p => <select {...p} value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })} required><option value="">Choose the site</option>{s.sites.filter(x => x.customerId === form.customerId).map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
      <Field label="Title">{p => <input {...p} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />}</Field>
    </div>
    {s.templates.length > 0 && <Field label="Start from a template (optional)" hint="Today's price-book prices, unless the template fixes a price.">{p => <select {...p} value={templateId} onChange={e => setTemplateId(e.target.value)}><option value="">No template</option>{s.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>}
    {!templateId && <OptionsEditor s={s} options={options} setOptions={setOptions} addOns={addOns} setAddOns={setAddOns} />}
    <Field label="Notes for the customer (optional)">{p => <textarea {...p} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />}</Field>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Save draft</button></div>
    {s.actor.role === 'agent' && <p className="muted">A dispatcher or the owner approves the price before it goes to the customer.</p>}
  </form>
}

function QuoteDetail({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const rev = quote.revisions.at(-1)
  const [revising, setRevising] = useState(false)
  const [options, setOptions] = useState<Block[]>(blocksOf(rev).options), [addOns, setAddOns] = useState<Block[]>(blocksOf(rev).addOns)
  const [choice, setChoice] = useState<Choice>({ optionId: '', addOnIds: [] })
  const multi = (rev.options?.length ?? 1) > 1 || (rev.addOns?.length ?? 0) > 0
  const [channel, setChannel] = useState('email')
  const [answer, setAnswer] = useState({ method: 'phone', customerName: byId(s.customers, quote.customerId)?.contact ?? '', note: '' }), [soldBy, setSoldBy] = useState('')
  const { error, act } = useAction()
  const me = s.actor
  return <section className="panel" aria-labelledby="quote-title">
    <h2 id="quote-title">{quote.number} · {quote.title}</h2>
    <p>{byId(s.customers, quote.customerId)?.name} · {byId(s.sites, quote.siteId)?.address}</p>
    <QuoteAssessment quote={quote} />
    <h3>Revision {rev.n} <Badge tone={rev.approval ? 'green' : 'gold'}>{rev.approval ? `Price approved by ${rev.approval.name}` : 'Price not approved'}</Badge></h3>
    <p className="muted">Prepared by {rev.preparedBy.name} ({roleName(rev.preparedBy.role, s.roles)})</p>
    <OptionsView rev={rev} />
    {quote.drafted && rev.n === 1 && <div aria-label="Drafted by the model"><p className="muted">{quote.drafted.label}</p><ul>{quote.drafted.reasons.map((r: Rec) => <li key={r.optionId}><strong>{r.name}:</strong> {r.reason}</li>)}</ul></div>}
    {rev.terms && <p className="muted">Terms: {rev.terms}</p>}
    {quote.revisions.length > 1 && <p className="muted">Earlier revisions: {quote.revisions.slice(0, -1).map((r: Rec) => `${r.n} (${money(r.totals.total)}${r.approval ? `, approved by ${r.approval.name}` : ''})`).join('; ')}</p>}
    {quote.sent.map((x: Rec, i: number) => <p key={i} className="muted">Revision {x.revision} recorded as sent by {x.channel} by {x.recordedBy.name}. Delivery is not confirmed.</p>)}
    {quote.acceptance && <p><Badge tone="green">Accepted</Badge> Revision {quote.acceptance.revision} accepted by {quote.acceptance.customerName} ({quote.acceptance.method}), recorded by {quote.acceptance.recordedBy.name}{quote.acceptance.soldByTechnicianId ? `, sold by ${byId(s.technicians, quote.acceptance.soldByTechnicianId)?.name ?? 'a technician'}` : ''}{quote.acceptance.note ? ` — ${quote.acceptance.note}` : ''}</p>}
    {quote.acceptance?.choice && multi && <p>Chosen: {[quote.acceptance.choice.optionName, ...quote.acceptance.choice.addOnNames].filter(Boolean).join(' + ')} · {money(quote.acceptance.totals.total)} incl. tax</p>}
    {quote.declined && <p><Badge tone="red">Declined</Badge> {quote.declined.note || `Declined by ${quote.declined.customerName}`}</p>}
    <Problem error={error} />
    <div className="actions">
      {quote.status === 'draft' && can(me, 'quote.approve') && <button className="primary" onClick={() => act(run('quote.approve', { quoteId: quote.id, version: quote.version, revision: rev.n }))}>Approve revision {rev.n} {multi ? `(${rev.options.length} option${rev.options.length === 1 ? '' : 's'}${rev.addOns.length ? `, ${rev.addOns.length} add-on${rev.addOns.length === 1 ? '' : 's'}` : ''})` : `at ${money(rev.totals.total)}`}</button>}
      {['draft', 'approved', 'sent'].includes(quote.status) && can(me, 'quote.revise') && <button onClick={() => setRevising(!revising)}>{revising ? 'Stop revising' : 'Revise price'}</button>}
    </div>
    {revising && <form onSubmit={e => { e.preventDefault(); void act(run('quote.revise', { quoteId: quote.id, version: quote.version, ...optionsPayload(options, addOns) }), () => setRevising(false)) }}>
      <OptionsEditor s={s} options={options} setOptions={setOptions} addOns={addOns} setAddOns={setAddOns} />
      <p className="muted">A new revision needs its own price approval.</p>
      <div className="actions"><button className="primary" type="submit">Save revision {rev.n + 1}</button></div>
    </form>}
    {can(me, 'template.save') && <SaveTemplate quote={quote} rev={rev} run={run} />}
    {['approved', 'sent'].includes(quote.status) && can(me, 'quote.markSent') && <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('quote.markSent', { quoteId: quote.id, version: quote.version, channel })) }}>
      <Field label="Record how you sent it">{p => <select {...p} value={channel} onChange={e => setChannel(e.target.value)}>{['email', 'printed', 'in person', 'phone'].map(option)}</select>}</Field>
      <button type="submit">Record as sent</button>
    </form>}
    {['approved', 'sent'].includes(quote.status) && can(me, 'quote.accept') && <form onSubmit={e => e.preventDefault()}>
      <h3>Customer's answer to revision {rev.n}</h3>
      <div className="form-grid">
        <Field label="How they answered">{p => <select {...p} value={answer.method} onChange={e => setAnswer({ ...answer, method: e.target.value })}>{['phone', 'email reply', 'signed', 'in person'].map(option)}</select>}</Field>
        <Field label="Who answered">{p => <input {...p} value={answer.customerName} onChange={e => setAnswer({ ...answer, customerName: e.target.value })} required />}</Field>
        <Field label="Note (optional)">{p => <input {...p} value={answer.note} onChange={e => setAnswer({ ...answer, note: e.target.value })} />}</Field>
        <Field label="Sold by (optional)" hint="The technician credited for commission.">{p => <select {...p} value={soldBy} onChange={e => setSoldBy(e.target.value)}><option value="">Nobody</option>{s.technicians.filter(t => t.active !== false).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
      </div>
      <ChoiceFields rev={rev} choice={choice} setChoice={setChoice} />
      <div className="actions"><button className="primary" type="button" onClick={() => act(run('quote.accept', { quoteId: quote.id, version: quote.version, revision: rev.n, ...answer, ...(soldBy ? { soldByTechnicianId: soldBy } : {}), ...(multi ? { choice } : {}) }))}>Record acceptance</button><button type="button" onClick={() => act(run('quote.decline', { quoteId: quote.id, version: quote.version, revision: rev.n, ...answer }))}>Record decline</button></div>
    </form>}
  </section>
}
