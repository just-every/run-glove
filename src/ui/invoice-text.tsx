import { useState } from 'react'
import { invoiceTextContent } from '../glove/invoice-text-content'
import type { Glove, Rec, Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

/** Each financial disclosure needs customer permission and a separate Owner send approval. */
export function InvoiceText({ s, invoice, run }: { s: Glove; invoice: Rec; run: Run }) {
  const [source, setSource] = useState(''), [wording, setWording] = useState(''), [timezone, setTimezone] = useState('')
  const [permission, setPermission] = useState(false), [approved, setApproved] = useState(false)
  const action = useAction(), customer = s.customers.find(c => c.id === invoice.customerId), revision = invoice.revisions.at(-1)
  if (s.actor.role !== 'owner' || s.actor.branch || !can(s.actor, 'invoice.text') || !customer || invoice.openingBalance) return null
  const messages = (s.messages ?? []).filter(m => m.channel === 'sms' && m.kind === 'invoice' && m.subjectId === invoice.id)
  const ready = ['approved', 'exported'].includes(invoice.status) && revision.approval && invoice.dates
  const consent = customer.automaticSms?.payments
  const consentCurrent = consent?.enabled && consent.address === customer.phone && consent.invoiceId === invoice.id && consent.invoiceRevision === revision.n
  const reserved = messages.some(message => message.invoiceRevision === revision.n)
  const permitted = consentCurrent && !reserved
  const channel = s.smsConnected && s.business[0]?.sms?.enabled
  const args = { invoiceId: invoice.id, version: invoice.version, revision: revision.n, customerVersion: customer.version, address: customer.phone }
  return <section aria-label={`Text ${invoice.number}`}>
    <h3>Invoice text</h3>
    {!ready ? <p>Approve the current invoice revision before texting it.</p> : reserved ? <p>This invoice revision already has a reserved text. Inspect its delivery outcome below; this revision cannot be sent again.</p> : <>
      <p>To: {customer.phone || 'Add the customer’s current international phone number first.'}</p>
      {!channel && <p>The Owner connects and enables registered customer texts in Settings first.</p>}
      <details><summary>Customer permission for this invoice revision</summary>
        <p>Record the customer’s permission to receive this invoice’s prices at the current number. It applies only to {invoice.number} revision {revision.n}.</p>
        <form onSubmit={e => { e.preventDefault(); void action.act(run('invoice.textConsent', { ...args, enabled: true, confirm: permission, source, wording, timezone }), () => { setPermission(false); setApproved(false) }) }}>
          <Field label="Invoice text consent source">{p => <input {...p} value={source} onChange={e => setSource(e.target.value)} required maxLength={300} />}</Field>
          <Field label="Invoice text consent wording">{p => <textarea {...p} value={wording} onChange={e => setWording(e.target.value)} required maxLength={2000} />}</Field>
          <Field label="Invoice text customer time zone">{p => <input {...p} value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="America/Chicago" required />}</Field>
          <label className="check-line"><input type="checkbox" checked={permission} onChange={e => setPermission(e.target.checked)} /> The customer requested this exact invoice revision by text at this number.</label>
          <button type="submit" disabled={!permission || !customer.phone}>Record invoice text permission</button>
        </form>
      </details>
      <p>{permitted ? `Customer permission recorded for revision ${revision.n} · ${consent.timezone}; texts send only from 8 am to 6 pm in that zone.` : 'No current customer permission for this invoice revision.'}</p>
      <details><summary>Invoice text preview</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{invoiceTextContent(invoice)}</pre><p>{s.business[0]?.name}<br />Reply STOP to stop texts, HELP for help, START to request texts again.</p></details>
      <label className="check-line"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /> I approve texting {invoice.number} revision {revision.n} to {customer.phone}.</label>
      <button type="button" disabled={!approved || !permitted || !channel} onClick={() => void action.act(run('invoice.text', { ...args, confirm: true }), () => setApproved(false))}>Text approved invoice</button>
      <p className="muted">This text contains approved document prices. It includes no payment link. Glove does not send or retry automatically.</p>
    </>}
    {consentCurrent && <button type="button" onClick={() => void action.act(run('invoice.textConsent', { ...args, enabled: false, source: 'Owner recorded customer withdrawal', wording: 'Stop invoice texts', timezone: consent.timezone }))}>Withdraw invoice text permission</button>}
    {!consentCurrent && ready && reserved && <p>No current customer permission for this invoice revision.</p>}
    <Problem error={action.error} />
    {messages.length > 0 && <ul className="timeline-list plain">{messages.map(message => <li key={message.id}><p>Revision {message.invoiceRevision} · {s.messageStates?.[message.id]?.text ?? 'Queued; no Twilio answer yet'}</p>{s.messageStates?.[message.id]?.next && <p>{s.messageStates[message.id].next}</p>}</li>)}</ul>}
  </section>
}
