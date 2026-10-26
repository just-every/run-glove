import { payoutComparison } from './collection-payout'
import { allow } from './access'
import { invoiceBalance } from './balances'
import { paymentReminders, paymentReminderState } from './reminders'
import { business, bump, event, expectVersion, fail, find, newId, oneOf, put, text, type Context, type Row } from './model'
import type { Handler } from './commands/types'

/** Compare retained provider facts; proposals neither infer nor execute a posting. */
function discrepancy(c: Context, payment: Row) {
  if (payment.status !== 'paid' || payment.erasedAt || !payment.providerReference || payment.qboImported) fail('RECONCILIATION_STATE', 'Choose a confirmed provider payment or refund recorded in Glove.')
  const qbo = business(c.s).qbo
  const sync = payment.qboSync
  if (qbo && sync?.connectionId === qbo.connectionId && sync?.phase === 'complete') fail('RECONCILIATION_STATE', 'This record already has a confirmed posting in the connected books.')
  const unresolved = ['reserved', 'sending', 'unknown'].includes(sync?.phase)
  return { issueKind: payment.kind === 'refund' ? 'refundCreditReview' : 'paymentPostingReview', action: unresolved ? 'Inspect the existing uncertain accounting operation; do not resend it.' : payment.kind === 'refund' ? 'Compare the confirmed refund with the invoice and books; prepare any missing credit for owner approval.' : 'Verify the existing invoice and accounting links, then have the owner explicitly post or reconcile this confirmed payment.', accountingState: sync?.phase ?? 'not recorded', connectionId: qbo?.connectionId ?? null, remoteId: sync?.remoteId ?? null }
}
export const collectionAgent: Handler = async (c, type, p) => {
  if (!['invoice.chase', 'reconciliation.prepare', 'reconciliation.decide'].includes(type)) return undefined
  allow(c.actor, type)
  if (type === 'invoice.chase') {
    const invoice = find(c.s, 'invoices', p.invoiceId); expectVersion(invoice, p.version)
    const policy = business(c.s).messageAutomation
    const due = policy?.enabled ? paymentReminders(c.s, c.now, policy).filter(r => r.row.id === invoice.id) : []
    const state = paymentReminderState(c.s, invoice)
    const requested = due.length > 0 && (invoiceBalance(c.s, invoice) ?? 0) > 0
    if (requested) c.reminderInvoiceId = invoice.id
    event(c, { jobId: invoice.jobId, subjectKind: 'invoice', subjectId: invoice.id, kind: 'invoice.chaseRequested', summary: `${c.actor.name} requested the existing owner-approved reminder sequence for ${invoice.number}; no new template, schedule or payment authority`, data: { requested, state } })
    return { invoiceId: invoice.id, requested, state, effect: 'Only existing due reminder steps may run; no payment or accounting post.' }
  }
  if (type === 'reconciliation.prepare' && p.payoutId) {
    const payout = find(c.s, 'payouts', p.payoutId); expectVersion(payout, p.version)
    const comparison = payoutComparison(c, payout)
    const prior = c.s.proposals.find(r => r.kind === 'reconciliation' && r.payoutId === payout.id && r.comparison?.fingerprint === comparison.fingerprint && r.status === 'review')
    if (prior) {
      event(c, { jobId: null, subjectKind: 'proposal', subjectId: prior.id, kind: 'reconciliation.inspected', summary: 'Owner inspected the existing payout comparison; no duplicate proposal or provider effect', data: { effect: 'inspection only' } })
      return prior
    }
    const row = put(c.s, 'proposals', { id: newId(), version: 1, createdAt: c.now, kind: 'reconciliation', issueKind: 'payoutBooksReview', status: 'review', payoutId: payout.id, payoutVersion: payout.version, comparison, preparedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, action: 'Inspect the named payout, fee and books discrepancies. Approval records inspection only; use separate authorized commands for any correction.' })
    event(c, { jobId: null, subjectKind: 'proposal', subjectId: row.id, kind: 'reconciliation.prepared', summary: 'Owner prepared a retained payout and books inspection; no provider request or money movement', data: { effect: 'inspection only' } })
    return row
  }
  if (type === 'reconciliation.prepare') {
    const payment = find(c.s, 'payments', p.paymentId); expectVersion(payment, p.version)
    const invoice = find(c.s, 'invoices', payment.invoiceId)
    const fix = discrepancy(c, payment)
    const existing = c.s.proposals.find(r => r.kind === 'reconciliation' && r.paymentId === payment.id && r.paymentVersion === payment.version && r.connectionId === fix.connectionId && r.status === 'review')
    if (existing) {
      event(c, { jobId: invoice.jobId, subjectKind: 'proposal', subjectId: existing.id, kind: 'reconciliation.inspected', summary: `${c.actor.name} inspected the existing reconciliation proposal; no duplicate or posting created`, data: { paymentId: payment.id } })
      return existing
    }
    const job = find(c.s, 'jobs', invoice.jobId)
    const approved = invoice.revisions.findLast((r: Row) => r.approval)
    const comparison = { acceptedTotal: job.totals?.total ?? null, invoiceRevision: approved?.n ?? null, invoiceTotal: approved?.totals.total ?? invoice.openingBalance?.amount ?? null, fieldEvidence: c.s.captures.filter(r => r.jobId === job.id).map(r => ({ id: r.id, kind: r.kind })), basis: 'Retained Glove records and accounting outcomes only; no fresh provider lookup or inferred missing credit.' }
    const row = put(c.s, 'proposals', { id: newId(), version: 1, createdAt: c.now, kind: 'reconciliation', status: 'review', jobId: invoice.jobId, customerId: payment.customerId, branchId: payment.branchId ?? invoice.branchId ?? null, invoiceId: invoice.id, paymentId: payment.id, paymentVersion: payment.version, amount: payment.amount, currency: payment.currency, providerReference: payment.providerReference, comparison, ...fix, preparedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
    event(c, { jobId: invoice.jobId, subjectKind: 'proposal', subjectId: row.id, kind: 'reconciliation.prepared', summary: `${c.actor.name} proposed ${fix.issueKind} for ${invoice.number}; nothing posted or refunded`, data: { paymentId: payment.id, invoiceId: invoice.id, kind: fix.issueKind, accountingState: fix.accountingState } })
    return row
  }
  if (c.actor.token || !['owner', 'office'].includes(c.actor.role)) fail('FORBIDDEN', 'A signed-in owner or office person reviews reconciliation proposals.', null, 403)
  const proposal = find(c.s, 'proposals', p.proposalId); expectVersion(proposal, p.version)
  if (proposal.kind !== 'reconciliation' || proposal.status !== 'review') fail('PROPOSAL_STATE', 'Choose an undecided reconciliation proposal.')
  if (proposal.preparedBy.id === c.actor.id) fail('SELF_APPROVAL', 'Someone other than the preparer reviews the proposal.')
  const decision = oneOf(p.decision, ['approved', 'declined'] as const, 'decision')
  if (proposal.payoutId) {
    const payout = find(c.s, 'payouts', proposal.payoutId)
    const current = payoutComparison(c, payout)
    if (decision === 'approved' && current.fingerprint !== proposal.comparison.fingerprint) fail('STALE', 'The payout, sources or books changed; prepare a fresh inspection.')
    const reason = text(p.reason, 'review reason', { max: 500 })
    const row = bump(c.s, 'proposals', proposal, { status: decision, decidedAt: c.now, decidedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, reason })
    event(c, { jobId: null, subjectKind: 'proposal', subjectId: row.id, kind: 'reconciliation.decided', summary: 'Owner recorded a payout inspection decision; no accounting or payment effect', data: { decision, effect: 'inspection only' } })
    return row
  }
  const payment = find(c.s, 'payments', proposal.paymentId)
  if (decision === 'approved') {
    expectVersion(payment, proposal.paymentVersion)
    const fix = discrepancy(c, payment)
    if (fix.connectionId !== proposal.connectionId || fix.accountingState !== proposal.accountingState) fail('STALE', 'The accounting connection or outcome changed; prepare a fresh proposal.')
  }
  const reason = text(p.reason, 'review reason', { max: 500 })
  const row = bump(c.s, 'proposals', proposal, { status: decision, decidedAt: c.now, decidedBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, reason })
  event(c, { jobId: proposal.jobId, subjectKind: 'proposal', subjectId: row.id, kind: 'reconciliation.decided', summary: `${c.actor.name} ${decision} the inspection proposal; accounting posts, credits and refunds still require their separate authorized commands`, data: { decision, paymentId: payment.id, reason } })
  return row
}
