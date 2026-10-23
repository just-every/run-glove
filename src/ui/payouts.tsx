import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

export function PayoutReview({ s, run }: { s: Glove; run: Run }) {
  const { error, act } = useAction(), [providerId, setProviderId] = useState(''), [preview, setPreview] = useState<Rec | null>(null)
  const [amount, setAmount] = useState(''), [destination, setDestination] = useState(''), [bps, setBps] = useState(''), [minimum, setMinimum] = useState(''), [source, setSource] = useState('')
  const [ids, setIds] = useState<string[]>([]), [sourceIds, setSourceIds] = useState<string[]>([]), [reference, setReference] = useState('')
  if (!can(s.actor, 'payment.depositBatch') && !can(s.actor, 'payout.reconcile')) return null
  const eligible = s.payments.filter(p => p.status === 'paid' && ['cash', 'check'].includes(p.method) && p.kind !== 'refund' && !p.depositBatchId)
  return <section className="panel" aria-label="Payouts and deposits"><h2>Payouts and deposits</h2><Problem error={error} />
    {can(s.actor, 'payout.reconcile') && <form onSubmit={e => { e.preventDefault(); void act(run('payout.reconcile', { providerId })) }}>
      <Field label="Stripe payout reference">{p => <input {...p} value={providerId} onChange={e => setProviderId(e.target.value)} required maxLength={200} />}</Field><button>Inspect Stripe payout</button><button type="button" disabled={!sourceIds.length || !providerId} onClick={() => act(run('payout.allocate', { providerId, paymentIds: sourceIds }))}>Allocate selected sources to Stripe payout</button>
    </form>}
    {can(s.actor, 'payout.feeSchedule') && <details><summary>Account-specific Instant Payout fee schedule</summary><p>Record your Stripe account’s fee schedule. Glove does not verify this pricing; the actual fee must match during reconciliation.</p>
      <form onSubmit={e => { e.preventDefault(); void act(run('payout.feeSchedule', { version: s.business[0].version, basisPoints: Number(bps), minimum, source })) }}>
        <Field label="Fee basis points" hint="100 basis points is 1%.">{p => <input {...p} inputMode="numeric" value={bps} onChange={e => setBps(e.target.value)} required />}</Field>
        <Field label="Minimum payout fee">{p => <input {...p} inputMode="decimal" value={minimum} onChange={e => setMinimum(e.target.value)} required />}</Field>
        <Field label="Fee schedule source">{p => <input {...p} value={source} onChange={e => setSource(e.target.value)} required maxLength={200} />}</Field><button>Record fee schedule</button>
      </form>
    </details>}
    {can(s.actor, 'payout.instantPreview') && <form onSubmit={async e => { e.preventDefault(); const out = await act(run('payout.instantPreview', { amount, destination, paymentIds: sourceIds })); if (out.ok) setPreview(out.result) }}>
      <Field label="Instant payout amount">{p => <input {...p} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required />}</Field>
      <Field label="Stripe debit card reference" hint="Use an existing debit card connected to your Stripe account. No card numbers here.">{p => <input {...p} value={destination} onChange={e => setDestination(e.target.value)} required maxLength={200} />}</Field><fieldset><legend>Owner-reviewed source allocation</legend><p>Stripe does not attribute sources to manual payouts. Select payments/refunds for your books; their net must equal the bank amount plus the fee.</p>{s.payments.filter(p => p.status === 'paid' && p.connectionId === s.business[0]?.stripe?.connectionId && !p.payoutAllocationId && !s.payouts.some(r => r.reconciled && r.items?.some((i: Rec) => i.paymentId === p.id))).map(p => <label key={p.id}><input type="checkbox" checked={sourceIds.includes(p.id)} onChange={e => setSourceIds(e.target.checked ? [...sourceIds, p.id] : sourceIds.filter(id => id !== p.id))} />Source {p.invoiceNumber} · {money(p.amount)} · fee {money(p.fee)}</label>)}</fieldset><button>Review Instant Payout fee</button>
    </form>}
    {preview && <section aria-label="Instant Payout confirmation"><h3>Confirm test Instant Payout</h3><p>Bank payout {money(preview.amount)} · Expected fee {money(preview.expectedFee)}</p><p>Owner-allocated source net {money(preview.sourceNet)} · {preview.sourceBasis}</p><p>{preview.feeSource}</p><p>Stripe eligibility is checked again before sending. An uncertain outcome is never automatically retried.</p><button onClick={() => act(run('payout.instantConfirm', { payoutId: preview.id, version: preview.version, confirmAmount: preview.amount, confirmFee: preview.expectedFee }), () => setPreview(null))}>Confirm test Instant Payout</button></section>}
    {eligible.length > 0 && can(s.actor, 'payment.depositBatch') && <form onSubmit={e => { e.preventDefault(); void act(run('payment.depositBatch', { paymentIds: ids, reference }), () => setIds([])) }}>
      <h3>Group cash and checks</h3>{eligible.map(p => <label className="check-row" key={p.id}><input type="checkbox" checked={ids.includes(p.id)} onChange={e => setIds(e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} />{p.method} · {p.invoiceNumber} · {money(p.amount)}</label>)}
      <Field label="Bank deposit reference">{p => <input {...p} value={reference} onChange={e => setReference(e.target.value)} required maxLength={200} />}</Field><button disabled={!ids.length}>Record deposit batch</button><p className="muted">Records a deposit you made; no bank confirmation is claimed.</p>
    </form>}
    <ul className="rows">{[...s.payouts].reverse().map(p => <li key={p.id}><div style={{ overflowWrap: 'anywhere' }}><strong>{p.kind === 'depositBatch' ? 'Cash/check deposit' : p.method === 'instant' || p.kind === 'instantRequest' ? 'Instant Payout' : 'Stripe payout'} · {money(p.amount)}</strong><p>{p.reconciled === true ? 'Reconciled to the cent' : p.reconciled === false ? 'Not reconciled' : p.status}{p.providerId ? ` · ${p.providerId}` : ''}</p>
      {p.inspectedAt && <p className="muted">Last inspection {p.inspectedAt}</p>}{p.net && <p>Net {money(p.net)} · Payout fee {money(p.payoutFee)} · Difference {money(p.difference)}</p>}{p.sourceMembership && <p className="muted">{p.sourceMembership}</p>}
      {p.unmatched?.length > 0 && <ul>{p.unmatched.map((u: Rec) => <li key={u.id}>{u.providerReference || u.id}: {u.reason}</li>)}</ul>}
      {p.status === 'reserved' && <p>Outcome unknown. Inspect Stripe before another request.</p>}
    </div></li>)}</ul>
  </section>
}
