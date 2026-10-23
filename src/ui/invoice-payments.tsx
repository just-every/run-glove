import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

const amountCents = (value: string) => Math.round(Number(value) * 100)
const paid = (s: Glove, id: string) => s.payments.reduce((n, p) => n + (p.effects ?? []).filter((e: Rec) => (e.invoiceId ?? p.invoiceId) === id).reduce((sum: number, e: Rec) => sum + e.amountCents, 0), 0)
export function InvoicePayments({ s, invoice, run }: { s: Glove; invoice: Rec; run: Run }) {
  const { error, act } = useAction(), [amount, setAmount] = useState(''), [method, setMethod] = useState('check'), [reference, setReference] = useState('')
  const [refundAmount, setRefundAmount] = useState(''), [reason, setReason] = useState(''), [selected, setSelected] = useState('')
  const [sourceId, setSourceId] = useState(''), [creditAmount, setCreditAmount] = useState('')
  const [checkout, setCheckout] = useState<string | null>(null)
  const rev = invoice.revisions.findLast((r: Rec) => r.approval), total = invoice.openingBalance?.amount ?? rev?.totals.total
  if (total === undefined) return null
  const net = amountCents(total) - paid(s, invoice.id), rows = s.payments.filter(p => p.invoiceId === invoice.id)
  const originals = rows.filter(p => p.status === 'paid' && (!p.kind || p.kind === 'payment' || p.kind === 'deposit'))
  const source = s.invoices.find(i => i.id === sourceId)
  const sources = s.invoices.filter(i => i.id !== invoice.id && i.customerId === invoice.customerId && (i.branchId ?? null) === (invoice.branchId ?? null) && i.revisions.some((r: Rec) => r.approval) && paid(s, i.id) > amountCents(i.revisions.findLast((r: Rec) => r.approval).totals.total))
  return <section aria-labelledby="invoice-payments-title">
    <h3 id="invoice-payments-title">Payments and balance</h3>
    <p><strong>Amount due {money((Math.max(0, net) / 100).toFixed(2))}</strong> · Credit {money((Math.max(0, -net) / 100).toFixed(2))}</p>
    <p className="muted">Cash and checks are office records. Stripe is test mode only; a pending or unknown provider response never means paid.</p>
    <Problem error={error} />
    {can(s.actor, 'payment.record') && <form onSubmit={e => { e.preventDefault(); void act(run('payment.record', { invoiceId: invoice.id, version: invoice.version, amount, method, reference })) }}>
      <div className="form-grid"><Field label="Payment amount">{p => <input {...p} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required />}</Field>
      <Field label="Payment method">{p => <select {...p} value={method} onChange={e => setMethod(e.target.value)}><option value="check">Check</option><option value="cash">Cash</option></select>}</Field>
      <Field label="Receipt or check reference">{p => <input {...p} value={reference} onChange={e => setReference(e.target.value)} required maxLength={200} />}</Field></div>
      <button type="submit">Record payment</button>
    </form>}
    {can(s.actor, 'payment.checkout') && s.business[0]?.stripe && net > 0 && <div className="actions">
      {['card', 'ach'].map(method => <button key={method} onClick={async () => { const outcome = await act(run('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method, ...(amount ? { amount } : {}) })); if (outcome.ok) setCheckout(outcome.result.checkoutUrl ?? null) }}>Prepare test {method === 'card' ? 'card' : 'ACH'} Checkout</button>)}
      {checkout && <div role="status"><a href={checkout} target="_blank" rel="noreferrer">Open Stripe test Checkout</a><button onClick={() => setCheckout(null)}>Dismiss Checkout link</button><p>This link is shown once in this tab. Inspect Stripe before requesting another payment.</p></div>}
    </div>}
    {sources.length > 0 && can(s.actor, 'payment.allocate') && <form onSubmit={e => { e.preventDefault(); if (source) void act(run('payment.allocate', { invoiceId: invoice.id, version: invoice.version, sourceInvoiceId: source.id, sourceVersion: source.version, amount: creditAmount })) }}>
      <Field label="Credit from invoice">{p => <select {...p} value={sourceId} onChange={e => setSourceId(e.target.value)} required><option value="">Choose credit</option>{sources.map(i => <option key={i.id} value={i.id}>{i.number}</option>)}</select>}</Field>
      <Field label="Credit to apply">{p => <input {...p} value={creditAmount} onChange={e => setCreditAmount(e.target.value)} inputMode="decimal" required />}</Field><button>Apply customer credit</button>
    </form>}
    {can(s.actor, 'payment.refund') && originals.length > 0 && <form onSubmit={e => { e.preventDefault(); const p = originals.find(p => p.id === selected); if (p) void act(run('payment.refund', { invoiceId: invoice.id, version: invoice.version, paymentId: p.id, paymentVersion: p.version, amount: refundAmount, reason })) }}>
      <Field label="Original payment">{p => <select {...p} value={selected} onChange={e => setSelected(e.target.value)} required><option value="">Choose payment</option>{originals.map(p => <option key={p.id} value={p.id}>{p.method} · {money(p.amount)} · {p.id.slice(0, 8)}</option>)}</select>}</Field>
      <Field label="Refund amount">{p => <input {...p} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} inputMode="decimal" required />}</Field>
      <Field label="Refund reason">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required maxLength={200} />}</Field>
      <button>Refund through original method</button><p className="muted">For cash or check, record only a refund already returned through that method. Stripe refunds require provider confirmation.</p>
    </form>}
    <ul className="rows">{rows.map(p => <li key={p.id}><div><strong>{p.kind === 'refund' ? 'Refund' : p.kind === 'allocation' ? 'Credit transfer' : p.kind === 'credit' ? 'Credit' : 'Payment'} · {p.method} · {money(p.amount)}</strong><p>{p.status}{p.providerReference ? ` · ${p.providerReference}` : ''}{p.reference ? ` · ${p.reference}` : ''}</p>{p.kind === 'refund' && p.status === 'reserved' && <p>Outcome unknown. Inspect Stripe; do not send another refund.</p>}
      {p.kind === 'refund' && p.status === 'pending' && can(s.actor, 'payment.refundRefresh') && <button onClick={() => act(run('payment.refundRefresh', { refundId: p.id, version: p.version }))}>Refresh refund status</button>}
      {p.status === 'paid' && !['allocation', 'credit'].includes(p.kind) && can(s.actor, 'payment.receipt') && <button onClick={() => act(run('payment.receipt', { paymentId: p.id, version: p.version }))}>Email {p.kind === 'refund' ? 'refund' : 'payment'} receipt</button>}</div></li>)}</ul>
  </section>
}
