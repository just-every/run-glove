import { useState } from 'react'
import { type Glove, type Rec, type Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'

export function QuoteDeposit({ s, quote, run }: { s: Glove; quote: Rec; run: Run }) {
  const rev = quote.revisions.at(-1), [kind, setKind] = useState(rev.deposit?.kind ?? 'amount'), [value, setValue] = useState(rev.deposit?.value ?? '')
  const { error, act } = useAction(), [checkout, setCheckout] = useState<string | null>(null)
  const payments = s.payments.filter(p => p.quoteId === quote.id && p.kind === 'deposit')
  return <section aria-label="Quote deposit"><h3>Deposit</h3>
    <p>{rev.deposit ? rev.deposit.kind === 'percent' ? `${rev.deposit.value}% of the chosen total` : money(rev.deposit.value) : 'No deposit requirement on this revision.'}</p>
    <p className="muted">Customer Checkout is not enabled. Only the signed-in owner can prepare test Checkout after this exact revision is signed and its job created.</p>
    <Problem error={error} />
    {quote.status === 'draft' && can(s.actor, 'quote.deposit') && <form onSubmit={e => { e.preventDefault(); void act(run('quote.deposit', { quoteId: quote.id, version: quote.version, deposit: value ? { kind, value } : null })) }}>
      <Field label="Deposit type">{p => <select {...p} value={kind} onChange={e => setKind(e.target.value)}><option value="amount">Amount</option><option value="percent">Percent</option></select>}</Field>
      <Field label="Deposit value" hint="Leave blank for no deposit.">{p => <input {...p} inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} />}</Field><button>Save deposit requirement</button>
    </form>}
    {quote.acceptance?.signing && quote.jobId && rev.deposit && can(s.actor, 'payment.depositCheckout') && !payments.length && <div className="actions">{['card', 'ach'].map(method => <button key={method} onClick={async () => { const outcome = await act(run('payment.depositCheckout', { quoteId: quote.id, version: quote.version, method })); if (outcome.ok) setCheckout(outcome.result.checkoutUrl ?? null) }}>Prepare test deposit by {method === 'card' ? 'card' : 'ACH'}</button>)}</div>}
    {checkout && <p role="status"><a href={checkout} target="_blank" rel="noreferrer">Open Stripe test deposit Checkout</a> <button onClick={() => setCheckout(null)}>Dismiss deposit link</button></p>}
    {payments.map(p => <p key={p.id}>Job-held deposit {money(p.amount)} · {p.status}{p.invoiceId ? ' · linked to final invoice' : ' · awaiting final invoice'}</p>)}
  </section>
}
