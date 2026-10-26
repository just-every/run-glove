import { autopayCommands, authorizedAutopay } from './autopay'
import { allow } from './access'
import { business, bump, event, expectVersion, fail, find, newId, oneOf, put, text, type Context, type Row } from './model'
import { cents, dollars } from './money'
import { invoicePaid, stripeKey, stripeRequest } from './payments'
import { savedCardAfterCommit, reserveSavedCardAttempt } from './saved-cards-provider'
import type { Handler } from './commands/types'

export { savedCardAfterCommit }

const reference = (value: unknown, prefix: string) => {
  const ref = text(value, `${prefix} reference`, { max: 200 })
  if (!new RegExp(`^${prefix}_[A-Za-z0-9_-]+$`).test(ref)) fail('INPUT', 'Enter a Stripe customer or payment-method reference, never card details.', null, 400)
  return ref
}
const evidence = (value: unknown, name: string) => {
  const result = text(value, name, { max: 2000 })
  if (/(?:\d[ -]?){13,19}/.test(result)) fail('INPUT', 'Authorization evidence must not contain card numbers.', null, 400)
  return result
}
const person = (c: Context, ownerOnly = false) => {
  if (!c.actor.sessionId || c.actor.token || !(ownerOnly ? ['owner'] : ['owner', 'office']).includes(c.actor.role) || ownerOnly && c.actor.branch) fail('FORBIDDEN', 'Only a signed-in authorized owner or office person uses saved cards.', null, 403)
}

/** Verify the method in its Stripe customer's namespace; never attach arbitrary cards. */
export async function verifySavedCard(key: string, customerId: string, card: Row) {
  let customer: any, method: any
  try {
    ;[customer, method] = await Promise.all([
      stripeRequest(key, `customers/${encodeURIComponent(card.stripeCustomerId)}`),
      stripeRequest(key, `customers/${encodeURIComponent(card.stripeCustomerId)}/payment_methods/${encodeURIComponent(card.stripeMethodId)}`),
    ])
  } catch { return fail('SAVED_CARD', 'Stripe could not verify this customer and saved card; no charge was made.') }
  if (customer.id !== card.stripeCustomerId || customer.deleted || customer.livemode !== false || customer.metadata?.glove_customer_id !== customerId || method.id !== card.stripeMethodId || method.customer !== customer.id || method.livemode !== false || method.type !== 'card' || !/^[a-z_]{2,30}$/.test(method.card?.brand ?? '') || !/^\d{4}$/.test(method.card?.last4 ?? '')) fail('SAVED_CARD', 'Stripe did not verify a test card belonging to this Glove customer; no charge was made.')
  return { brand: method.card.brand, last4: method.card.last4 }
}

export const savedCardCommands: Handler = async (c, type, p, db) => {
  const authorization = await autopayCommands(c, type, p, db)
  if (authorization !== undefined) return authorization
  if (!['payment.autopayCharge', 'payment.savedCardRegister', 'payment.savedCardRevoke', 'payment.savedCardCharge'].includes(type)) return undefined
  allow(c.actor, type)
  const register = type === 'payment.savedCardRegister', revoke = type === 'payment.savedCardRevoke'
  const autopay = type === 'payment.autopayCharge'
  person(c, register || revoke || autopay)
  const allowed = register ? ['customerId', 'version', 'stripeCustomerId', 'stripeMethodId', 'scope', 'source', 'wording', 'confirmed'] : revoke ? ['customerId', 'version', 'cardId', 'reason'] : ['invoiceId', 'version', 'cardId', 'amount', 'confirmed']
  if (Object.keys(p).some(k => !allowed.includes(k))) fail('INPUT', 'This door accepts references and authorization only; never card details.', null, 400)
  if (register || revoke) {
    const customer = find(c.s, 'customers', p.customerId); expectVersion(customer, p.version)
    if (customer.mergedInto) fail('CUSTOMER', 'Use the surviving customer.')
    if (revoke) {
      const card = (customer.savedCards ?? []).find((m: Row) => m.id === p.cardId) ?? fail('SAVED_CARD', 'Choose this customer’s saved card.')
      if (card.revokedAt) fail('SAVED_CARD', 'This authorization is already withdrawn.')
      const reason = evidence(p.reason, 'withdrawal reason')
      const row = bump(c.s, 'customers', customer, { savedCards: customer.savedCards.map((m: Row) => m.id === card.id ? { ...m, revokedAt: c.now, revokedBy: c.actor.id, reason } : m) })
      event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'savedCard.revoked', summary: `${c.actor.name} withdrew the saved-card authorization; no charge was made`, data: { cardId: card.id } })
      return row
    }
    const connection = business(c.s).stripe, key = await stripeKey(db)
    if (!connection || connection.mode !== 'test' || !key) return fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
    if (p.confirmed !== true) fail('CONSENT', 'Explicitly confirm the customer’s recorded authorization.')
    const card = { id: newId(), version: 1, stripeCustomerId: reference(p.stripeCustomerId, 'cus'), stripeMethodId: reference(p.stripeMethodId, 'pm'), connectionId: connection.connectionId, authorization: { scope: oneOf(p.scope, ['business', 'autopay'] as const, 'scope'), source: evidence(p.source, 'authorization source'), wording: evidence(p.wording, 'authorization wording'), at: c.now, by: { id: c.actor.id, name: c.actor.name } } }
    if ((customer.savedCards ?? []).some((m: Row) => m.stripeMethodId === card.stripeMethodId && m.connectionId === card.connectionId && !m.revokedAt)) fail('SAVED_CARD', 'This card already has an active authorization; withdraw it before recording another.')
    const display = await verifySavedCard(key, customer.id, card)
    const row = bump(c.s, 'customers', customer, { savedCards: [...(customer.savedCards ?? []), { ...card, ...display }] })
    event(c, { jobId: null, subjectKind: 'customer', subjectId: customer.id, kind: 'savedCard.authorized', summary: `${c.actor.name} recorded customer authorization for a Stripe test saved card; no charge was made`, data: { cardId: card.id, scope: card.authorization.scope, provider: 'Stripe', providerReference: card.stripeMethodId, ...display } })
    return row
  }
  const invoice = find(c.s, 'invoices', p.invoiceId); expectVersion(invoice, p.version)
  const customer = find(c.s, 'customers', invoice.customerId), revision = invoice.revisions.findLast((r: Row) => r.approval)
  const b = business(c.s), connection = b.stripe, key = await stripeKey(db)
  if (!connection || connection.mode !== 'test' || !key) return fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
  if (!revision || !['approved', 'exported'].includes(invoice.status) || invoice.openingBalance || customer.mergedInto) fail('INVOICE_STATE', 'Choose an approved Glove invoice for the current customer.')
  if ((revision.totals.currency ?? b.currency) !== 'USD') fail('CURRENCY', 'Saved-card charges take USD in test mode only.')
  const card = (customer.savedCards ?? []).find((m: Row) => m.id === p.cardId)
  if (!card || card.revokedAt || card.connectionId !== connection.connectionId) fail('SAVED_CARD', 'Choose an active saved card for this Stripe connection.')
  const grant = autopay ? authorizedAutopay(c, invoice, card) : null
  if (!autopay && card.authorization?.scope !== 'business') fail('CARD_AUTHORIZATION', 'This authorization covers autopay only. Ask the owner to review the existing test Checkout controls; no charge was made.')
  const balance = cents(revision.totals.total, 'total') - invoicePaid(c.s, invoice.id), amount = cents(p.amount, 'amount')
  if (amount <= 0 || amount > balance) fail('AMOUNT', 'Choose a positive amount no greater than the unpaid invoice balance.')
  if (autopay && amount !== balance) fail('AMOUNT', 'The authorized recurring invoice must be charged for its full unpaid balance.')
  if (p.confirmed !== true) fail('CONSENT', 'Confirm the displayed saved card and exact amount before charging.')
  if (c.s.payments.some(m => m.invoiceId === invoice.id && ['reserved', 'pending', 'failed'].includes(m.status))) fail('PAYMENT_PENDING', 'An unresolved payment blocks another attempt. Inspect Stripe before requesting another charge.')
  await verifySavedCard(key, customer.id, card)
  const payment = put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, kind: 'payment', invoiceId: invoice.id, invoiceNumber: invoice.number, revision: revision.n, jobId: invoice.jobId, customerId: customer.id, branchId: invoice.branchId ?? null, amount: dollars(amount), tip: '0.00', technicianIds: [], currency: 'USD', mode: 'test', method: 'card', status: 'reserved', effects: [], fee: null, connectionId: connection.connectionId, savedCard: { id: card.id, stripeCustomerId: card.stripeCustomerId, stripeMethodId: card.stripeMethodId, brand: card.brand, last4: card.last4, authorizedAt: card.authorization.at }, ...(grant ? { autopay: grant } : {}), taxTotalAmount: revision.totals.total, taxBreakdown: structuredClone(revision.totals.taxBreakdown ?? []), by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
  c.sql.push({ sql: 'INSERT INTO glove_payment_attempts(payment_id,session_id) VALUES(?,NULL)', params: [payment.id] })
  reserveSavedCardAttempt(c, payment.id)
  event(c, { jobId: invoice.jobId, subjectKind: 'payment', subjectId: payment.id, kind: 'payment.savedCardRequested', summary: `${c.actor.name} requested one Stripe test saved-card charge of $${payment.amount}; not paid`, data: { paymentId: payment.id, cardId: card.id, amount: payment.amount, provider: 'Stripe' } })
  return payment
}
