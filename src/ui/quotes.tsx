import { useState } from 'react'
import { byId, roleName, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { LinesEditor, blankLine, payloadLines, type LineDraft } from './lines'
import { can } from './roles'

// Enquiries and quotes: a draft (by a person or an agent), its revisions, the
// price approval of one exact revision, "sent" as a record of what a person did
// (never a delivery claim), and the customer's answer with how it was given.

const tone = { draft: 'grey', approved: 'blue', sent: 'blue', accepted: 'green', declined: 'red' } as const
/** A stored lowercase value shown to people in sentence case. */
const option = (value: string) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>

export function Quotes({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState<string | null>(null)
  const [drafting, setDrafting] = useState<{ enquiryId?: string } | null>(null)
  const quote = byId(s.quotes, open)
  const enquiries = s.enquiries.filter(e => e.status === 'open')
  return <div className="page">
    <section className="titlebar"><div><h1>Quotes</h1><p className="subtitle">Enquiries, priced quotes and the customer's answer</p></div>
      <div className="date-actions">{can(s.actor.role, 'quote.draft') && <button className="primary" onClick={() => { setDrafting({}); setOpen(null) }}>New quote</button>}</div></section>
    <div className="two-col">
      <div>
        {can(s.actor.role, 'enquiry.create') && <EnquiryForm s={s} run={run} />}
        <section className="panel"><h2>Open enquiries</h2>
          {!enquiries.length ? <Empty title="No open enquiries" /> : <ul className="rows">{enquiries.map(e => <li key={e.id}><div><strong>{byId(s.customers, e.customerId)?.name}</strong><p>{e.description}</p><p className="muted">By {e.channel} · recorded by {e.createdBy.name}</p></div>{can(s.actor.role, 'quote.draft') && <button onClick={() => { setDrafting({ enquiryId: e.id }); setOpen(null) }}>Quote it</button>}</li>)}</ul>}
        </section>
        <section className="panel"><h2>Quotes</h2>
          {!s.quotes.length ? <Empty title="No quotes yet">Draft one from an enquiry or with New quote.</Empty> :
            <table className="table"><thead><tr><th>Quote</th><th>Customer</th><th>Total inc GST</th><th>Status</th></tr></thead><tbody>
              {[...s.quotes].reverse().map(q => { const rev = q.revisions.at(-1); return <tr key={q.id} className={open === q.id ? 'selected' : ''}><td><button className="link-button" onClick={() => { setOpen(q.id); setDrafting(null) }}><span className="nowrap">{q.number}</span> · {q.title}</button></td><td>{byId(s.customers, q.customerId)?.name}</td><td>{money(rev.totals.total)}</td><td><Badge tone={tone[q.status as keyof typeof tone] ?? 'grey'}>{q.status === 'draft' && rev.preparedBy.role === 'agent' ? 'Agent draft' : q.status[0].toUpperCase() + q.status.slice(1)}</Badge></td></tr> })}
            </tbody></table>}
        </section>
      </div>
      <div>
        {drafting && <QuoteDraft s={s} run={run} enquiryId={drafting.enquiryId} done={id => { setDrafting(null); setOpen(id) }} />}
        {quote && <QuoteDetail key={quote.id + quote.version} s={s} quote={quote} run={run} />}
      </div>
    </div>
  </div>
}

function EnquiryForm({ s, run }: { s: Glove; run: Run }) {
  const [form, setForm] = useState({ customerId: '', siteId: '', description: '', channel: 'phone' })
  const { error, act } = useAction()
  const sites = s.sites.filter(x => x.customerId === form.customerId)
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('enquiry.create', { ...form, siteId: form.siteId || undefined }), () => setForm({ ...form, description: '' })) }}>
    <h2>Record an enquiry</h2>
    <div className="form-grid">
      <Field label="Customer">{p => <select {...p} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, siteId: '' })} required><option value="">Choose a customer</option>{s.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>
      <Field label="Site">{p => <select {...p} value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })}><option value="">Not yet known</option>{sites.map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
      <Field label="How it came in">{p => <select {...p} value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>{['phone', 'email', 'web form', 'in person'].map(option)}</select>}</Field>
    </div>
    <Field label="What the customer needs">{p => <textarea {...p} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />}</Field>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Record enquiry</button></div>
  </form>
}

function QuoteDraft({ s, run, enquiryId, done }: { s: Glove; run: Run; enquiryId?: string; done: (id: string) => void }) {
  const enquiry = byId(s.enquiries, enquiryId)
  const [form, setForm] = useState({ customerId: enquiry?.customerId ?? '', siteId: enquiry?.siteId ?? '', title: enquiry?.description.slice(0, 80) ?? '', notes: '' })
  const [lines, setLines] = useState<LineDraft[]>([blankLine()])
  const { error, act } = useAction()
  return <form className="panel" onSubmit={e => { e.preventDefault(); void act(run('quote.draft', { ...form, enquiryId, lines: payloadLines(lines) }), q => done(q.id)) }}>
    <h2>{enquiry ? `Quote for ${byId(s.customers, enquiry.customerId)?.name}` : 'New quote'}</h2>
    <div className="form-grid">
      {!enquiry && <Field label="Customer">{p => <select {...p} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, siteId: '' })} required><option value="">Choose a customer</option>{s.customers.filter(c => !c.archived).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>}
      <Field label="Site">{p => <select {...p} value={form.siteId} onChange={e => setForm({ ...form, siteId: e.target.value })} required><option value="">Choose the site</option>{s.sites.filter(x => x.customerId === form.customerId).map(x => <option key={x.id} value={x.id}>{x.address}</option>)}</select>}</Field>
      <Field label="Title">{p => <input {...p} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />}</Field>
    </div>
    <LinesEditor s={s} lines={lines} setLines={setLines} />
    <Field label="Notes for the customer (optional)">{p => <textarea {...p} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />}</Field>
    <Problem error={error} />
    <div className="actions"><button className="primary" type="submit">Save draft</button></div>
    {s.actor.role === 'agent' && <p className="muted">A dispatcher or the owner approves the price before it goes to the customer.</p>}
  </form>
}

function QuoteDetail({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const rev = quote.revisions.at(-1)
  const [revising, setRevising] = useState(false)
  const [lines, setLines] = useState<LineDraft[]>(rev.lines.map((l: Rec) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax, serviceId: l.serviceId ?? '' })))
  const [channel, setChannel] = useState('email')
  const [answer, setAnswer] = useState({ method: 'phone', customerName: byId(s.customers, quote.customerId)?.contact ?? '', note: '' })
  const { error, act } = useAction()
  const role = s.actor.role
  return <section className="panel" aria-labelledby="quote-title">
    <h2 id="quote-title">{quote.number} · {quote.title}</h2>
    <p>{byId(s.customers, quote.customerId)?.name} · {byId(s.sites, quote.siteId)?.address}</p>
    <h3>Revision {rev.n} <Badge tone={rev.approval ? 'green' : 'gold'}>{rev.approval ? `Price approved by ${rev.approval.name}` : 'Price not approved'}</Badge></h3>
    <p className="muted">Prepared by {rev.preparedBy.name} ({roleName(rev.preparedBy.role)})</p>
    <table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Unit ex GST</th><th>Line</th></tr></thead><tbody>{rev.lines.map((l: Rec, i: number) => <tr key={i}><td>{l.description}</td><td data-label="Qty">{l.quantity}</td><td data-label="Unit ex GST">{money(l.unitPrice)}</td><td>{money(l.total)}</td></tr>)}</tbody>
      <tfoot><tr><td colSpan={3}>Subtotal</td><td>{money(rev.totals.subtotal)}</td></tr><tr><td colSpan={3}>GST</td><td>{money(rev.totals.gst)}</td></tr><tr><td colSpan={3}><strong>Total inc GST</strong></td><td><strong>{money(rev.totals.total)}</strong></td></tr></tfoot></table>
    {quote.revisions.length > 1 && <p className="muted">Earlier revisions: {quote.revisions.slice(0, -1).map((r: Rec) => `${r.n} (${money(r.totals.total)}${r.approval ? `, approved by ${r.approval.name}` : ''})`).join('; ')}</p>}
    {quote.sent.map((x: Rec, i: number) => <p key={i} className="muted">Revision {x.revision} recorded as sent by {x.channel} by {x.recordedBy.name}. Delivery is not confirmed.</p>)}
    {quote.acceptance && <p><Badge tone="green">Accepted</Badge> Revision {quote.acceptance.revision} accepted by {quote.acceptance.customerName} ({quote.acceptance.method}), recorded by {quote.acceptance.recordedBy.name}{quote.acceptance.note ? ` — ${quote.acceptance.note}` : ''}</p>}
    {quote.declined && <p><Badge tone="red">Declined</Badge> {quote.declined.note || `Declined by ${quote.declined.customerName}`}</p>}
    <Problem error={error} />
    <div className="actions">
      {quote.status === 'draft' && can(role, 'quote.approve') && <button className="primary" onClick={() => act(run('quote.approve', { quoteId: quote.id, version: quote.version, revision: rev.n }))}>Approve revision {rev.n} at {money(rev.totals.total)}</button>}
      {['draft', 'approved', 'sent'].includes(quote.status) && can(role, 'quote.revise') && <button onClick={() => setRevising(!revising)}>{revising ? 'Stop revising' : 'Revise price'}</button>}
    </div>
    {revising && <form onSubmit={e => { e.preventDefault(); void act(run('quote.revise', { quoteId: quote.id, version: quote.version, lines: payloadLines(lines) }), () => setRevising(false)) }}>
      <LinesEditor s={s} lines={lines} setLines={setLines} />
      <p className="muted">A new revision needs its own price approval.</p>
      <div className="actions"><button className="primary" type="submit">Save revision {rev.n + 1}</button></div>
    </form>}
    {['approved', 'sent'].includes(quote.status) && can(role, 'quote.markSent') && <form className="inline-form" onSubmit={e => { e.preventDefault(); void act(run('quote.markSent', { quoteId: quote.id, version: quote.version, channel })) }}>
      <Field label="Record how you sent it">{p => <select {...p} value={channel} onChange={e => setChannel(e.target.value)}>{['email', 'printed', 'in person', 'phone'].map(option)}</select>}</Field>
      <button type="submit">Record as sent</button>
    </form>}
    {['approved', 'sent'].includes(quote.status) && can(role, 'quote.accept') && <form onSubmit={e => e.preventDefault()}>
      <h3>Customer's answer to revision {rev.n}</h3>
      <div className="form-grid">
        <Field label="How they answered">{p => <select {...p} value={answer.method} onChange={e => setAnswer({ ...answer, method: e.target.value })}>{['phone', 'email reply', 'signed', 'in person'].map(option)}</select>}</Field>
        <Field label="Who answered">{p => <input {...p} value={answer.customerName} onChange={e => setAnswer({ ...answer, customerName: e.target.value })} required />}</Field>
        <Field label="Note (optional)">{p => <input {...p} value={answer.note} onChange={e => setAnswer({ ...answer, note: e.target.value })} />}</Field>
      </div>
      <div className="actions"><button className="primary" type="button" onClick={() => act(run('quote.accept', { quoteId: quote.id, version: quote.version, revision: rev.n, ...answer }))}>Record acceptance</button><button type="button" onClick={() => act(run('quote.decline', { quoteId: quote.id, version: quote.version, revision: rev.n, ...answer }))}>Record decline</button></div>
    </form>}
  </section>
}
