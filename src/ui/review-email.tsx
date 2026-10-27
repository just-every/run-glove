import { useState } from 'react'
import type { Glove, Rec, Run } from './api'
import { when } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'

const draftOf = (b: Rec) => ({ version: b.version, template: b.reviewRequests?.template ?? '', url: b.reviewRequests?.url ?? '', periodDays: b.reviewRequests?.periodDays ?? 30, trigger: b.reviewRequests?.trigger ?? 'payment', postalAddress: b.address ?? '' })

/** Owner controls for the approved explicit email flow. Saving never sends. */
export function ReviewEmailSettings({ s, run }: { s: Glove; run: Run }) {
  const b = s.business[0]
  const [draft, setDraft] = useState(() => b ? draftOf(b) : null)
  const [approved, setApproved] = useState(false), [pending, setPending] = useState(false), [notice, setNotice] = useState('')
  const [customerId, setCustomerId] = useState(''), [jobId, setJobId] = useState(''), [reference, setReference] = useState(''), [permissionAddress, setPermissionAddress] = useState<string | null>(null), [sendConfirmation, setSendConfirmation] = useState<string | null>(null)
  const action = useAction()
  if (!b || !draft || s.actor.role !== 'owner' || s.actor.branch || !can(s.actor, 'review.configure') || s.branchAccess.some(a => a.id === s.actor.id && a.limited !== false)) return null
  const customer = s.customers.find(c => c.id === customerId && !c.erasedAt && !c.mergedInto)
  const consent = customer?.automaticEmail?.reviews
  const currentConsent = consent?.enabled && consent.address === customer?.email
  const jobs = s.jobs.filter(j => j.customerId === customerId && s.reviewJobs?.some(r => r.id === j.id && r.workReady))
  const selected = jobs.find(j => j.id === jobId), gate = s.reviewJobs?.find(j => j.id === selected?.id)
  const permission = !!customer?.email && permissionAddress === customer.email
  const sendBasis = JSON.stringify([customerId, customer?.email, customer?.version, jobId, b.version])
  const confirmSend = sendConfirmation === sendBasis
  const stale = draft.version !== b.version
  const edit = () => { setApproved(false); setNotice(''); action.setError(null) }
  async function act(type: string, payload: object, message: string) {
    setPending(true); setNotice(''); setSendConfirmation(null)
    try {
      const result = await action.act(run(type, payload))
      if (result.ok) {
        if (type === 'review.configure') { setDraft(draftOf(result.result)); setApproved(false) }
        if (type === 'review.consent') { setReference(''); setPermissionAddress(null) }
        setNotice(type === 'review.request' ? result.result.sent ? 'One email attempt recorded. Check the provider outcome below; delivery is not yet confirmed.' : `No email sent: ${result.result.reason}.` : message)
      }
    } finally { setPending(false) }
  }
  const messages = (s.messages ?? []).filter(m => m.kind === 'reviewRequest' && m.customerId === customerId).sort((a, z) => z.createdAt.localeCompare(a.createdAt))
  return <section className="panel" aria-label="Review email" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <h2>Review email</h2><p>{b.reviewRequests?.enabled ? 'Manual email enabled' : 'Off'} · You explicitly request every email. Saving settings never sends, schedules or retries a request.</p>
    <details><summary>Edit review wording and period</summary>
      <form aria-label="Review email settings" onSubmit={e => { e.preventDefault(); if (approved && !stale) void act('review.configure', { ...draft, enabled: true, approved: true }, 'Saved. Manual review email is enabled; nothing was sent.') }}>
        <fieldset disabled={pending} style={{ border: 0, minWidth: 0, padding: 0 }}><legend>Uniform request for every customer</legend>
          <Field label="Review request wording" hint="Plain text, without links or merge fields. The same wording goes to every eligible customer.">{p => <textarea {...p} required maxLength={2000} rows={3} value={draft.template} onChange={e => { edit(); setDraft({ ...draft, template: e.target.value }) }} />}</Field>
          <Field label="Google review link">{p => <input {...p} type="url" required maxLength={1000} value={draft.url} onChange={e => { edit(); setDraft({ ...draft, url: e.target.value }) }} />}</Field>
          <Field label="Business postal address" hint="Updates the business address used in customer email footers.">{p => <textarea {...p} required maxLength={1000} value={draft.postalAddress} onChange={e => { edit(); setDraft({ ...draft, postalAddress: e.target.value }) }} />}</Field>
          <Field label="Customer review period in days">{p => <input {...p} type="number" min={1} max={3650} required value={draft.periodDays} onChange={e => { edit(); setDraft({ ...draft, periodDays: Number(e.target.value) }) }} />}</Field>
          <Field label="Owner review trigger" hint="Both completion and payment are required. This choice does not enable automation.">{p => <select {...p} value={draft.trigger} onChange={e => { edit(); setDraft({ ...draft, trigger: e.target.value }) }}><option value="payment">Payment</option><option value="completion">Completion</option></select>}</Field>
          <section aria-label="Review email preview"><h3>Request preview</h3><p style={{ whiteSpace: 'pre-wrap' }}>{draft.template}{'\n'}{draft.url}{'\n\n'}Stop review requests: a private unsubscribe link is added to each email.{ '\n'}{b.name}{'\n'}{draft.postalAddress}</p></section>
          {stale && <p role="status">Business settings changed. Reload current review settings before saving.</p>}
          <label className="check-line"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /> I approve this uniform request and postal footer.</label>
          <div className="actions"><button type="submit" disabled={!approved || stale}>Save manual review email</button><button type="button" onClick={() => { setDraft(draftOf(b)); edit() }}>Reload current review settings</button></div>
        </fieldset>
      </form>
    </details>
    {b.reviewRequests?.enabled && <button type="button" disabled={pending} onClick={() => void act('review.configure', { version: b.version, enabled: false }, 'Saved. Review email is off.')}>Turn off review email</button>}
    <Field label="Review customer">{p => <select {...p} value={customerId} onChange={e => { setCustomerId(e.target.value); setJobId(''); setReference(''); setPermissionAddress(null); setSendConfirmation(null); setNotice('') }}><option value="">Choose customer</option>{s.customers.filter(c => !c.erasedAt && !c.mergedInto).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>
    {customer && <>
      <p>Current email: {customer.email || 'No email recorded'}</p>
      <p>{currentConsent ? 'Review permission recorded for current email' : 'No active review permission for current email'}{consent?.at ? ` · ${when(consent.at, b.timezone)}` : ''}{consent?.reference ? ` · ${consent.reference}` : ''}</p>
      <form aria-label="Review email permission" onSubmit={e => { e.preventDefault(); if (permission) void act('review.consent', { customerId, version: customer.version, enabled: true, address: permissionAddress, reference }, 'Review permission recorded for the current email.') }}>
        <Field label="Review permission source or reference">{p => <input {...p} required maxLength={500} value={reference} onChange={e => setReference(e.target.value)} />}</Field>
        <label className="check-line"><input type="checkbox" checked={permission} onChange={e => setPermissionAddress(e.target.checked ? customer.email : null)} /> The customer affirmatively permitted review email at this current address.</label>
        <button disabled={pending || !permission || !customer.email}>Record review permission</button>
      </form>
      {consent?.enabled && <button type="button" disabled={pending} onClick={() => void act('review.consent', { customerId, version: customer.version, enabled: false, reference: reference.trim() || 'Owner recorded customer withdrawal' }, 'Review permission withdrawn. No further request will be sent.')}>Withdraw review permission</button>}
      <Field label="Completed and paid job">{p => <select {...p} value={jobId} onChange={e => { setJobId(e.target.value); setSendConfirmation(null); setNotice('') }}><option value="">Choose completed and paid job</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}</select>}</Field>
      {!jobs.length && <p>No completed and paid jobs for this customer.</p>}
      {gate?.reason && <p role="status">Request unavailable: {gate.reason}.</p>}
      {!s.mailConnected && <p>Connect customer email before requesting a review.</p>}
      <label className="check-line"><input type="checkbox" checked={confirmSend} disabled={!selected || !!gate?.reason || pending || !s.mailConnected} onChange={e => setSendConfirmation(e.target.checked ? sendBasis : null)} /> Send the saved uniform request to {customer.email || 'the current email'} for this job.</label>
      <button type="button" disabled={pending || !selected || !gate || !!gate.reason || !confirmSend || !s.mailConnected} onClick={() => void act('review.request', { jobId, confirmation: { businessVersion: b.version, customerVersion: customer.version, address: customer.email } }, '')}>Send one review email</button>
      <ul className="rows" aria-label="Review provider outcomes">{messages.map(m => <li key={m.id}><div><strong>{s.jobs.find(j => j.id === m.jobId)?.number} · {s.messageStates?.[m.id]?.text ?? 'Attempt recorded; outcome unknown'}</strong><p>{when(m.createdAt, b.timezone)} · {m.to}</p>{s.messageStates?.[m.id]?.next && <p>{s.messageStates[m.id].next}</p>}</div></li>)}</ul>
    </>}
    <Problem error={action.error} />{notice && <p role="status">{notice}</p>}
  </section>
}
