import type { Glove, Rec, Run } from './api'
import { Problem, useAction } from './controls'
import { can } from './roles'

/** COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018: use the existing email door and show only provider-reported outcomes. */
export function DocumentEmail({ s, run, record, kind, to, ready }: {
  s: Glove; run: Run; record: Rec; kind: 'quote' | 'invoice' | 'purchaseOrder' | 'reportReady' | 'visitResponse'; to?: string; ready: boolean
}) {
  const { error, act } = useAction()
  const permission = kind === 'quote' ? 'quote.markSent' : kind === 'invoice' ? 'invoice.approve' : 'po.send'
  const maySend = ['quote', 'invoice', 'purchaseOrder'].includes(kind) && can(s.actor, 'email.send') && can(s.actor, permission)
  const messages = (s.messages ?? []).filter(m => (m.kind === kind || (kind === 'invoice' && m.kind === 'paymentReminder') || (kind === 'quote' && m.kind === 'quoteFollowup')) && m.subjectId === record.id)
  if (!maySend && !messages.length) return null
  return <section aria-label={`Email ${record.number ?? (kind === 'reportReady' ? 'service report' : 'visit')}`}>
    <h3>Email</h3>
    {record.reminderState && <p>{record.reminderState}</p>}
    {record.followupState && <p>{record.followupState}</p>}
    {maySend && ready && <>
      <p>{to ? `To: ${to}` : kind === 'purchaseOrder' ? 'Add the supplier email on the purchase order before emailing.' : 'Add an email on the customer record before emailing.'}</p>
      {!s.mailConnected && <p className="muted">The owner connects customer email in Settings first.</p>}
      <div className="actions"><button type="button" disabled={!s.mailConnected || !to} onClick={() => act(run('email.send', { kind, id: record.id, version: record.version }))}>Email {kind === 'purchaseOrder' ? 'purchase order' : kind}</button></div>
    </>}
    <Problem error={error} />
    {messages.length > 0 && <ul className="timeline-list plain">{messages.map(m => {
      const state = s.messageStates?.[m.id]
      return <li key={m.id}><p>{state?.text ?? `Queued to ${m.to}; delivery is not yet reported`} · {m.reminderKey ? 'automatic email approved by' : 'sent by'} {m.by.name}</p>{state?.next && <p className="muted">{state.next}</p>}</li>
    })}</ul>}
  </section>
}
