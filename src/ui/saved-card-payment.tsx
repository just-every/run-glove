import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, money, useAction } from './controls'
import { can } from './roles'
import { SavedCardRegistration } from './saved-card-registration'

export function SavedCardPayment({ s, invoice, amountDue, run }: { s: Glove; invoice: Rec; amountDue: number; run: Run }) {
  const [cardId, setCardId] = useState(''), [amount, setAmount] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const action = useAction(), customer = s.customers.find(c => c.id === invoice.customerId)
  if (!customer || !['owner', 'office'].includes(s.actor.role)) return null
  const cards = (customer.savedCards ?? []).filter((c: Rec) => !c.revokedAt && c.connectionId === s.business[0]?.stripe?.connectionId)
  const card = cards.find((c: Rec) => c.id === cardId), unresolved = s.payments.some(p => p.invoiceId === invoice.id && ['reserved', 'pending', 'failed'].includes(p.status))
  const charge = async () => {
    if (busy || !confirmed || !card) return
    setBusy(true); setNotice('')
    try {
      const result = await action.act(run('payment.savedCardCharge', { invoiceId: invoice.id, version: invoice.version, cardId, amount, confirmed: true }))
      if (result.ok) { setConfirmed(false); setNotice('Saved-card request reserved. Await Stripe confirmation; inspect Stripe if the outcome remains unknown. Do not charge again.') }
    } finally { setBusy(false) }
  }
  return <section aria-label="Saved card payment" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h4>Charge a saved card</h4>
    <p>Stripe test mode only. Amount due {money((Math.max(0, amountDue) / 100).toFixed(2))}. No surcharge or tip is added.</p>
    {unresolved && <p role="status">A payment is unresolved. Inspect Stripe before any further attempt; a pending request does not mean paid.</p>}
    {cards.length > 0 && amountDue > 0 && can(s.actor, 'payment.savedCardCharge') ? <form aria-label="Charge saved card" onSubmit={e => { e.preventDefault(); void charge() }}>
      <fieldset className="saved-card-fields" disabled={busy || unresolved}>
        <Field label="Saved card">{p => <select {...p} value={cardId} required onChange={e => { setCardId(e.target.value); setConfirmed(false); setNotice('') }}><option value="">Choose saved card</option>{cards.map((c: Rec) => <option key={c.id} value={c.id}>{c.brand} ending {c.last4} · {c.authorization.scope === 'business' ? 'Business-initiated charges authorized' : 'Autopay only'}</option>)}</select>}</Field>
        <Field label="Saved-card charge amount">{p => <input {...p} value={amount} inputMode="decimal" required onChange={e => { setAmount(e.target.value); setConfirmed(false); setNotice('') }} />}</Field>
        {card && <p>{card.brand} ending {card.last4} · Charge {money(amount || '0.00')} · Surcharge $0.00 · Tip $0.00.</p>}
        {card?.authorization.scope === 'autopay' && <p>This authorization covers autopay only. Ask the owner to review the existing test Checkout controls.</p>}
        <label className="check-line"><input type="checkbox" checked={confirmed} required onChange={e => setConfirmed(e.target.checked)} /> I confirm the displayed card and exact amount for this test charge.</label>
        <button disabled={!confirmed || !card} type="submit">Charge saved card</button>
      </fieldset>
    </form> : !cards.length && <p>No active saved card registered for this Stripe connection.</p>}
    <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
    {s.payments.filter(p => p.invoiceId === invoice.id && p.savedCard).map(p => <p key={p.id}>{p.savedCard.brand} ending {p.savedCard.last4} · {p.status}{p.failureReason ? ` · ${p.failureReason}` : ''}</p>)}
    {can(s.actor, 'payment.savedCardRegister') && <SavedCardRegistration s={s} customer={customer} run={run} />}
  </section>
}
