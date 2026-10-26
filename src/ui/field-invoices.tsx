import './field-invoices.css'
import { type Glove, type Rec, type Run } from './api'
import { Problem, money, useAction } from './controls'
import { TaxTotalRows } from './tax-totals'
import { DiscountRows } from './discount'
import { type Queued } from './outbox'

export function FieldInvoicePermission({ t, run }: { t: Rec; run: Run }) {
  const { error, act } = useAction()
  const enabled = t.fieldInvoicing?.enabled && t.fieldInvoicing.operatorId === t.operatorId
  return <div><p>Field invoices: {enabled ? 'allowed' : 'off'}. Permission allows invoice draft requests and keeps approved customer invoice prices on this technician’s phone for offline presentation. Office approval is required before presentation.</p>
    <button disabled={!enabled && (!t.operatorId || t.active === false)} onClick={() => act(run('invoice.fieldConfigure', { technicianId: t.id, version: t.version, enabled: !enabled }))}>{enabled ? 'Withdraw field invoices' : 'Allow field invoices'}</button><Problem error={error} /></div>
}

export function PhoneInvoice({ s, visit, queued, queue, keptAt }: { s: Glove; visit: Rec; queued: Queued[]; queue: (type: string, payload: Record<string, any>, label: string) => void; keptAt: string | null }) {
  const tech = s.technicians.find(t => t.operatorId === s.actor.id)
  if (!tech?.fieldInvoicing?.enabled || tech.fieldInvoicing.operatorId !== s.actor.id) return null
  const job = s.jobs.find(j => j.id === visit.jobId)
  if (!job || visit.technicianId !== tech.id || visit.status === 'cancelled') return null
  if (keptAt && navigator.onLine) return <section className="card"><h2>Invoice</h2><p role="status">Rechecking invoice permission and approval after reconnecting…</p></section>
  const invoices = s.invoices.filter(i => i.jobId === job.id)
  const waiting = queued.some(q => q.type === 'invoice.fieldPrepare' && !q.refused)
  const completedHere = queued.some(q => q.type === 'visit.complete' && q.payload.jobComplete !== false && !q.refused)
  return <section className="card" aria-labelledby="phone-invoice-title"><h2 id="phone-invoice-title">Invoice</h2>
    {invoices.map(invoice => { const rev = invoice.revisions.at(-1); return <article className="field-invoice" key={invoice.id} aria-label={`Approved invoice ${invoice.number}`}>
      <h3>{invoice.number}{invoice.progress ? ` · ${invoice.progress.name}` : ''}</h3>
      <p>Approved revision {rev.n} · {rev.approval.name} · {new Date(rev.approval.at).toLocaleString('en-US')}</p>
      {keptAt && <p role="status">Kept on this phone {new Date(keptAt).toLocaleString('en-US')}. Changes to approval, permission or customer data made since then cannot be checked until reconnecting.</p>}
      {invoice.poNumber && <p>Purchase order {invoice.poNumber}</p>}
      {invoice.dates && <p>Issued {invoice.dates.issuedOn} · Due {invoice.dates.dueOn}</p>}
      <ul className="plain">{rev.lines.map((line: Rec, n: number) => <li key={n}><strong>{line.customerDescription || line.description}</strong> · {line.quantity} × {money(line.unitPrice)} · {money(line.total)}</li>)}</ul>
      <table className="table"><tfoot><tr><td colSpan={3}>Subtotal</td><td>{money(rev.totals.subtotal)}</td></tr><DiscountRows totals={rev.totals} lines={rev.lines} /><TaxTotalRows totals={rev.totals} /><tr><td colSpan={3}><strong>Approved total</strong></td><td><strong>{money(rev.totals.total)}</strong></td></tr></tfoot></table>
      <p className="muted">This is the approved invoice amount. Ask the office for the current payment balance.</p>
    </article> })}
    {!invoices.length && <p>No approved invoice is available on this phone. Preparing a draft keeps office approval as the next step.</p>}
    {!invoices.length && <button disabled={waiting || (job.status !== 'completed' && !completedHere)} onClick={() => queue('invoice.fieldPrepare', { visitId: visit.id }, 'Invoice draft request')}>{waiting ? 'Invoice draft waiting to send' : 'Request invoice draft'}</button>}
    {!invoices.length && job.status !== 'completed' && !completedHere && <p className="muted">Complete the job before requesting its invoice.</p>}
  </section>
}
