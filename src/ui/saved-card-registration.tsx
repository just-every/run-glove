import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'

export function SavedCardRegistration({ s, customer, run }: { s: Glove; customer: Rec; run: Run }) {
  const blank = { stripeCustomerId: '', stripeMethodId: '', scope: 'business', source: '', wording: '' }
  const [form, setForm] = useState(blank), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const [cardId, setCardId] = useState(''), [reason, setReason] = useState(''), action = useAction()
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => { setForm({ ...form, [key]: e.target.value }); setConfirmed(false); setNotice('') }
  const register = async () => {
    if (busy || !confirmed) return
    setBusy(true)
    try { const result = await action.act(run('payment.savedCardRegister', { customerId: customer.id, version: customer.version, ...form, confirmed: true })); if (result.ok) { setForm(blank); setConfirmed(false); setNotice('Verified saved card and customer authorization recorded. No charge was made.') } } finally { setBusy(false) }
  }
  const revoke = async () => {
    if (busy) return
    setBusy(true)
    try { const result = await action.act(run('payment.savedCardRevoke', { customerId: customer.id, version: customer.version, cardId, reason })); if (result.ok) { setCardId(''); setReason(''); setNotice('Saved-card authorization withdrawn.') } } finally { setBusy(false) }
  }
  return <details className="details">
    <summary>Manage saved-card authorization</summary>
    <p>Use an existing card attached to this customer in Stripe test mode. In Stripe, set the customer metadata glove_customer_id to <code>{customer.id}</code>. Glove verifies that identity and the card attachment. Record the customer’s actual authorization below.</p>
    <form aria-label="Register saved card" onSubmit={e => { e.preventDefault(); void register() }}>
      <fieldset className="saved-card-fields" disabled={busy || !s.business[0]?.stripe}>
        <Field label="Stripe customer reference">{p => <input {...p} value={form.stripeCustomerId} onChange={set('stripeCustomerId')} pattern="cus_[A-Za-z0-9_-]+" required maxLength={200} />}</Field>
        <Field label="Stripe saved-method reference">{p => <input {...p} value={form.stripeMethodId} onChange={set('stripeMethodId')} pattern="pm_[A-Za-z0-9_-]+" required maxLength={200} />}</Field>
        <Field label="Authorization scope">{p => <select {...p} value={form.scope} onChange={set('scope')}><option value="business">Charges initiated by this business</option><option value="autopay">Autopay only</option></select>}</Field>
        <Field label="Saved-card authorization source">{p => <input {...p} value={form.source} onChange={set('source')} required maxLength={2000} />}</Field>
        <Field label="Saved-card authorization wording">{p => <textarea {...p} value={form.wording} onChange={set('wording')} required maxLength={2000} />}</Field>
        <label className="check-line"><input type="checkbox" checked={confirmed} required onChange={e => setConfirmed(e.target.checked)} /> I recorded the customer’s actual authorization and the scope it covers.</label>
        <button disabled={!confirmed}>Register verified saved card</button>
      </fieldset>
    </form>
    {(customer.savedCards ?? []).some((c: Rec) => !c.revokedAt) && <form aria-label="Withdraw saved-card authorization" onSubmit={e => { e.preventDefault(); void revoke() }}>
      <fieldset className="saved-card-fields" disabled={busy}>
        <Field label="Authorization to withdraw">{p => <select {...p} value={cardId} onChange={e => setCardId(e.target.value)} required><option value="">Choose card</option>{(customer.savedCards ?? []).filter((c: Rec) => !c.revokedAt).map((c: Rec) => <option key={c.id} value={c.id}>{c.brand} ending {c.last4}</option>)}</select>}</Field>
        <Field label="Saved-card withdrawal reason">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required maxLength={2000} />}</Field>
        <button>Withdraw saved-card authorization</button>
      </fieldset>
    </form>}
    <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
  </details>
}
