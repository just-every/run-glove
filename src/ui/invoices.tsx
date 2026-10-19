import { QuickBooksPayload } from './quickbooks-payload'
import { TaxTotalRows } from './tax-totals'
import { useState } from 'react'
import { byId, roleName, when, type Glove, type Rec, type Run } from './api'
import { Badge, Empty, Field, Problem, money, useAction } from './controls'
import { LinesEditor, payloadLines, type LineDraft } from './lines'
import { DiscountFields, DiscountRows, discountDraft, discountPayload } from './discount'
import { can } from './roles'

// Invoice preparation for the business's own accounting system: draft from a
// completed job, approve one exact revision, export each approved revision
// once, and correct an exported invoice with a revision that names what it
// corrects.

const tone = { draft: 'gold', approved: 'blue', exported: 'green' } as const

export function Invoices({ s, run }: { s: Glove; run: Run }) {
  const [open, setOpen] = useState<string | null>(null)
  const { error, act } = useAction()
  const invoice = byId(s.invoices, open)
  const ready = s.jobs.filter(j => j.status === 'completed' && !s.invoices.some(i => i.jobId === j.id))
  const approved = s.invoices.filter(i => i.status === 'approved')
  const zone = s.business[0]?.timezone ?? 'America/Chicago'
  return <div className="page">
    <section className="titlebar"><div><h1>Invoices</h1><p className="subtitle">Prepared here, exported to your accounting system</p></div>
      <div className="date-actions">{can(s.actor, 'invoice.export') && approved.length > 0 && <button className="primary" onClick={() => act(run('invoice.export', {}))}>Export {approved.length} approved</button>}</div></section>
    <Problem error={error} />
    <div className="two-col">
      <div>
        <section className="panel"><h2>Completed jobs to invoice</h2>
          {!ready.length ? <Empty title="Nothing waiting">Completed jobs appear here until an invoice is prepared.</Empty> : <ul className="rows">{ready.map(j => <ReadyJob key={j.id} s={s} job={j} run={run} />)}</ul>}
        </section>
        <section className="panel"><h2>Invoices</h2>
          {!s.invoices.length ? <Empty title="No invoices yet" /> : <table className="table"><thead><tr><th>Invoice</th><th>Customer</th><th>Total incl. tax</th><th>Status</th></tr></thead><tbody>
            {[...s.invoices].reverse().map(i => { const rev = i.revisions.at(-1); return <tr key={i.id} className={open === i.id ? 'selected' : ''}><td><button className="link-button" onClick={() => setOpen(i.id)}><span className="nowrap">{i.number}</span>{rev.corrects ? ` (correction ${rev.n})` : ''}</button></td><td>{byId(s.customers, i.customerId)?.name}</td><td>{money(rev.totals.total)}</td><td><Badge tone={tone[i.status as keyof typeof tone]}>{i.status[0].toUpperCase() + i.status.slice(1)}</Badge></td></tr> })}
          </tbody></table>}
        </section>
        <section className="panel"><h2>Exports</h2>
          {!s.exports.length ? <Empty title="No exports yet">Approved invoices go out together as one CSV for your accounting system.</Empty> : <ul className="rows">{[...s.exports].reverse().map(x => <li key={x.id}><div><strong>{x.number}</strong> · {x.invoices.length} invoice{x.invoices.length === 1 ? '' : 's'} · {money(x.total)} · {when(x.createdAt, zone)} by {x.by.name}<p className="muted">{x.invoices.map((i: Rec) => i.invoiceNumber).join(', ')}</p></div>{can(s.actor, 'invoice.export') && <a className="button" href={`/api/glove/exports/${x.id}.csv`} download>Download CSV</a>}</li>)}</ul>}
          <p className="muted">USD CSVs carry the approved jurisdiction, taxable basis and document tax. Existing AUD documents retain Xero sales-invoice columns. Inspect the export against your accounting settings before importing.</p>
        </section>
      </div>
      <div>{invoice ? <InvoiceDetail key={invoice.id + invoice.version} s={s} invoice={invoice} run={run} /> : <Empty title="Choose an invoice" />}</div>
    </div>
  </div>
}

function ReadyJob({ s, job, run }: { s: Glove; job: Rec; run: Run }) {
  const { error, act } = useAction()
  const [lines, setLines] = useState<LineDraft[] | null>(null)
  // Materials recorded without a price-book entry need a price from the office.
  const draft = (): LineDraft[] => [
    ...(job.lines ?? []).map((l: Rec) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice ?? '', tax: l.tax ?? 'GST', serviceId: l.serviceId ?? '' })),
    ...s.captures.filter(x => x.jobId === job.id && x.kind === 'material').map(m => { const service = s.services.find(x => x.id === m.serviceId); return { description: `${m.description} (used on site)`, quantity: m.quantity, unitPrice: service?.unitPrice ?? '', tax: service?.tax ?? 'GST', serviceId: service?.id ?? '' } }),
  ]
  const prepare = async () => { const outcome = await act(run('invoice.prepare', { jobId: job.id })); if (!outcome.ok && outcome.error.code === 'UNPRICED_MATERIALS') setLines(draft()) }
  return <li><div><strong>{job.number} · {job.title}</strong><p className="muted">{byId(s.customers, job.customerId)?.name}{job.totals ? ` · accepted ${money(job.totals.total)}` : ''}</p>
    {lines ? <form onSubmit={e => { e.preventDefault(); void act(run('invoice.prepare', { jobId: job.id, lines: payloadLines(lines) })) }}>
      <p>Price the materials recorded on site that are not in the price book.</p>
      <LinesEditor s={s} lines={lines} setLines={setLines} />
      <div className="actions"><button className="primary" type="submit">Prepare invoice with these lines</button></div>
    </form> : <Problem error={error} />}</div>
    {!lines && can(s.actor, 'invoice.prepare') && <button onClick={() => void prepare()}>Prepare invoice</button>}</li>
}

function InvoiceDetail({ s, invoice, run }: { s: Glove; invoice: Rec; run: Run }) {
  const rev = invoice.revisions.at(-1)
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState(''), [discount, setDiscount] = useState(discountDraft(rev.discount))
  const [lines, setLines] = useState<LineDraft[]>(rev.lines.map((l: Rec) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, tax: l.tax, serviceId: l.serviceId ?? '' })))
  const { error, act } = useAction()
  const exported = invoice.status === 'exported', type = exported ? 'invoice.correct' : 'invoice.revise'
  const customer = byId(s.customers, invoice.customerId), [po, setPo] = useState(invoice.poNumber ?? '')
  return <section className="panel" aria-labelledby="invoice-title">
    <h2 id="invoice-title">{invoice.number} · {byId(s.customers, invoice.customerId)?.name}</h2>
    <p className="muted">Job {byId(s.jobs, invoice.jobId)?.number} · revision {rev.n} prepared by {rev.preparedBy.name} ({roleName(rev.preparedBy.role, s.roles)}){rev.approval ? ` · approved by ${rev.approval.name}` : ''}</p>
    {invoice.poNumber && <p className="muted">Purchase order {invoice.poNumber}</p>}
    {rev.corrects && <p><Badge tone="gold">Correction</Badge> Corrects revision {rev.corrects.revision} ({money(rev.corrects.total)}) exported in {rev.corrects.exportNumber}: {rev.reason}</p>}
    <table className="table"><thead><tr><th>Item</th><th>Qty</th><th>Unit before tax</th><th>Line</th></tr></thead><tbody>{rev.lines.map((l: Rec, i: number) => <tr key={i}><td>{l.description}</td><td data-label="Qty">{l.quantity}</td><td data-label="Unit before tax">{money(l.unitPrice)}</td><td>{money(l.total)}</td></tr>)}</tbody>
      <tfoot><tr><td colSpan={3}>Subtotal</td><td>{money(rev.totals.subtotal)}</td></tr><DiscountRows totals={rev.totals} lines={rev.lines} /><TaxTotalRows totals={rev.totals} /><tr><td colSpan={3}><strong>Total incl. tax</strong></td><td><strong>{money(rev.totals.total)}</strong></td></tr></tfoot></table>
    <QuickBooksPayload s={s} invoice={invoice} />
    <h3>Correction trail</h3>
    <ol className="timeline-list plain">{invoice.revisions.map((r: Rec) => <li key={r.n}>Revision {r.n}: {money(r.totals.total)}{r.reason ? ` — ${r.reason}` : ''}{r.approval ? ` · approved by ${r.approval.name}` : ' · not approved'}{r.export ? ` · exported in ${r.export.number}` : ''}</li>)}</ol>
    <Problem error={error} />
    <div className="actions">
      {invoice.status === 'draft' && can(s.actor, 'invoice.approve') && customer?.requirePo && !invoice.poNumber && <Field label="Purchase-order number" hint={`${customer.name} requires one on its invoices`}>{p => <input {...p} value={po} onChange={e => setPo(e.target.value)} />}</Field>}
      {invoice.status === 'draft' && can(s.actor, 'invoice.approve') && <button className="primary" onClick={() => act(run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: rev.n, ...(po ? { poNumber: po } : {}) }))}>Approve revision {rev.n} at {money(rev.totals.total)}</button>}
      {can(s.actor, type) && <button onClick={() => setEditing(!editing)}>{editing ? 'Stop editing' : exported ? 'Record a correction' : 'Revise lines'}</button>}
    </div>
    {editing && <form onSubmit={e => { e.preventDefault(); void act(run(type, { invoiceId: invoice.id, version: invoice.version, reason, lines: payloadLines(lines), discount: discountPayload(discount) }), () => setEditing(false)) }}>
      <LinesEditor s={s} lines={lines} setLines={setLines} />
      <DiscountFields value={discount} onChange={setDiscount} />
      <Field label={exported ? 'What this correction fixes' : 'Why the lines changed'}>{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required />}</Field>
      {exported && <p className="muted">The exported revision stays as it was; the correction is approved and exported on its own.</p>}
      <div className="actions"><button className="primary" type="submit">Save revision {rev.n + 1}</button></div>
    </form>}
  </section>
}
