import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { Field } from './controls'

// PLAN-004: the desk records the customer's explicit decline of one included
// visit: who answered, how and why. The server refuses a booked visit.
export function DeclineVisit({ s, run, visit }: { s: Glove; run: Run; visit: Rec }) {
  const [method, setMethod] = useState('phone'), [name, setName] = useState(visit.customer as string), [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const submit = async () => {
    const agreement = s.agreements?.find(a => a.id === visit.agreementId)
    if (!agreement) { setError('That agreement is not loaded.'); return }
    setBusy(true); setError('')
    try {
      const answer = await run('agreement.decline', { agreementId: agreement.id, version: agreement.version, index: visit.index, method, customerName: name, reason })
      if (!answer.ok) setError(answer.error.message)
    } finally { setBusy(false) }
  }
  return <details><summary>Record customer decline</summary>
    <form aria-label={`Record ${visit.customer} decline of visit ${visit.index + 1}`} onSubmit={e => { e.preventDefault(); void submit() }}>
      <fieldset disabled={busy}><div className="form-grid">
        <Field label="Declined by (customer)">{p => <input {...p} value={name} onChange={e => setName(e.target.value)} required maxLength={200} />}</Field>
        <Field label="How they declined">{p => <select {...p} value={method} onChange={e => setMethod(e.target.value)}>{['phone', 'email reply', 'text reply', 'in person'].map(m => <option key={m} value={m}>{m}</option>)}</select>}</Field>
        <Field label="Their reason">{p => <input {...p} value={reason} onChange={e => setReason(e.target.value)} required maxLength={500} />}</Field>
      </div><button type="submit">Record decline</button></fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  </details>
}
