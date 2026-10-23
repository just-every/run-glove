import { allow } from '../access'
import { business, bump, event, expectVersion, fail, find, newId, oneOf, put } from '../model'
import { cents, dollars } from '../money'
import { depositAmount, depositRule } from '../deposits'
import type { Handler } from './types'

export const deposits: Handler = async (c, type, p, db) => {
  if (!['quote.deposit', 'service.deposit', 'payment.depositCheckout'].includes(type)) return undefined
  allow(c.actor, type)
  if (c.actor.token || c.actor.branch || c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the signed-in unscoped owner manages this deposit slice.', null, 403)
  if (type === 'service.deposit') {
    const service = find(c.s, 'services', p.serviceId); expectVersion(service, p.version)
    const deposit = depositRule(p.deposit)
    event(c, { jobId: null, subjectKind: 'service', subjectId: service.id, kind: 'deposit.serviceConfigured', summary: 'Owner set the deposit default for future quote revisions; existing quotes unchanged', data: { deposit } })
    return bump(c.s, 'services', service, { deposit })
  }
  const quote = find(c.s, 'quotes', p.quoteId); expectVersion(quote, p.version)
  const rev = quote.revisions.at(-1)
  if (type === 'quote.deposit') {
    if (quote.status !== 'draft' || rev.approval) fail('QUOTE_STATE', 'Set a deposit on an unapproved draft; revise an approved quote first.')
    const deposit = depositRule(p.deposit)
    for (const option of rev.options ?? [rev]) if (deposit) depositAmount(deposit, option.totals.total)
    const row = bump(c.s, 'quotes', quote, { revisions: [...quote.revisions.slice(0, -1), { ...rev, deposit }] })
    event(c, { jobId: null, subjectKind: 'quote', subjectId: quote.id, kind: 'deposit.quoteConfigured', summary: 'Owner set the deposit on this unapproved revision; price approval is still required', data: { revision: rev.n, deposit } })
    return row
  }
  const connection = business(c.s).stripe
  if (!connection || !(await db.prepare("SELECT 1 FROM glove_provider_keys WHERE provider='stripe-payments'").first())) fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
  if (quote.status !== 'accepted' || !quote.acceptance?.signing || !rev.approval || rev.n !== quote.acceptance.revision || !quote.jobId) fail('DEPOSIT_GATE', 'A deposit needs the winning signed current price-approved revision and its exact job.')
  if (quote.acceptance.totals.currency !== 'USD') fail('CURRENCY', 'This deposit slice takes USD only.')
  if (c.s.invoices.some(i => i.jobId === quote.jobId)) fail('DEPOSIT_GATE', 'Use the invoice payment door once an invoice is prepared.')
  const amount = depositAmount(rev.deposit, quote.acceptance.totals.total)
  if (!amount) fail('DEPOSIT', 'This frozen revision has no deposit requirement.')
  if (c.s.payments.some(x => x.quoteId === quote.id && x.kind === 'deposit' && x.status !== 'returned')) fail('PAYMENT_PENDING', 'This quote already has a deposit request; inspect it before another attempt.')
  const job = find(c.s, 'jobs', quote.jobId)
  const row = put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, kind: 'deposit', quoteId: quote.id, quoteRevision: rev.n, chosenDocumentHash: quote.acceptance.signing.chosenDocumentHash, invoiceId: null, invoiceNumber: `Deposit ${quote.number}`, customerId: quote.customerId, jobId: job.id, branchId: job.branchId ?? null, amount: dollars(amount), tip: '0.00', technicianIds: [], currency: 'USD', mode: 'test', method: oneOf(p.method, ['card', 'ach'] as const, 'method'), status: 'reserved', fee: null, effects: [], taxTotalAmount: quote.acceptance.totals.total, taxBreakdown: quote.acceptance.totals.taxBreakdown ?? [], connectionId: connection.connectionId, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
  c.sql.push({ sql: 'INSERT INTO glove_payment_attempts(payment_id,session_id) VALUES(?,NULL)', params: [row.id] })
  c.checkoutId = row.id
  event(c, { jobId: job.id, subjectKind: 'payment', subjectId: row.id, kind: 'deposit.requested', summary: `Owner prepared a test deposit of $${row.amount} for the signed ${quote.number}; customer Checkout is not enabled`, data: { paymentId: row.id, quoteId: quote.id, jobId: job.id, revision: rev.n, chosenDocumentHash: row.chosenDocumentHash, amount: row.amount } })
  return row
}
