import { allow } from '../access'
import { bump, business, event, expectVersion, fail, find, newId, oneOf, put, text } from '../model'
import { cents, dollars } from '../money'
import { invoicePaid } from '../payments'
import { address, queueEmail } from '../mail'
import type { Handler } from './types'

export const payments: Handler = async (c, type, p) => {
  if (type === 'payment.connect') {
    allow(c.actor, type)
    if (c.actor.token || c.actor.branch || c.actor.role !== 'owner') fail('FORBIDDEN', 'Only the signed-in unscoped owner connects Stripe.', null, 403)
    const b = business(c.s)
    expectVersion(b, p.version)
    const connectionId = newId()
    if (p.key === null) c.sql.push({ sql: "DELETE FROM glove_provider_keys WHERE provider IN ('stripe-payments','stripe-webhook')", params: [] })
    else {
      // Test mode only in this initial slice; the provider's livemode field is also checked on every event.
      if (p.mode !== 'test') fail('INPUT', 'This payment slice accepts Stripe test mode only.', null, 400)
      for (const [provider, value] of [['stripe-payments', text(p.key, 'key', { max: 4000 })], ['stripe-webhook', text(p.webhookSecret, 'webhookSecret', { max: 4000 })]]) c.sql.push({ sql: 'INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at', params: [provider, value, c.actor.id, c.now] })
    }
    event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'payment.disconnected' : 'payment.connected', summary: `${c.actor.name} ${p.key === null ? 'disconnected' : 'connected test-mode'} Stripe; no charge or email was sent`, data: { provider: 'Stripe', mode: 'test' } })
    return bump(c.s, 'business', b, { stripe: p.key === null ? null : { connectionId, mode: 'test', connectedAt: c.now, tipChoices: ['0.00', '15.00'], surcharge: false } })
  }
  if (type === 'payment.checkout') {
    if (Object.keys(p).some(key => !['invoiceId', 'version', 'method', 'tip'].includes(key))) fail('INPUT', 'Checkout accepts only invoiceId, version, method and tip; enter card or bank details only on Stripe.', null, 400)
    allow(c.actor, type)
    if (c.actor.token || c.actor.role !== 'owner') fail('FORBIDDEN', 'Only a signed-in owner prepares Checkout in this slice.', null, 403)
    const b = business(c.s), connection = b.stripe
    if (!connection) fail('PAYMENT_SETUP', 'Connect Stripe test mode first.')
    const inv = find(c.s, 'invoices', p.invoiceId); expectVersion(inv, p.version)
    const rev = [...inv.revisions].reverse().find(r => r.approval)
    if (!rev || !['approved', 'exported'].includes(inv.status) || inv.openingBalance) fail('INVOICE_STATE', 'Choose an approved Glove invoice.')
    if ((rev.totals.currency ?? b.currency) !== 'USD') fail('CURRENCY', 'This slice takes USD only.')
    const balance = cents(rev.totals.total, 'total') - invoicePaid(c.s, inv.id)
    if (balance <= 0) fail('PAID', 'This invoice has no unpaid balance.')
    if (c.s.payments.some(x => x.invoiceId === inv.id && ['reserved', 'pending'].includes(x.status))) fail('PAYMENT_PENDING', 'A payment request is unresolved. Inspect Stripe before making another.')
    const tip = p.tip === undefined ? '0.00' : dollars(cents(p.tip, 'tip'))
    if (!connection.tipChoices.includes(tip)) fail('INPUT', 'Choose one of the owner-set tip amounts.', null, 400)
    const visits = c.s.visits.filter(v => v.jobId === inv.jobId && v.status === 'completed')
    const technicianIds = [...new Set(visits.map(v => v.completion?.technicianId ?? v.technicianId))].sort()
    if (cents(tip, 'tip') && !technicianIds.length) fail('TIP', 'A tip needs a completed visit technician.')
    const row = put(c.s, 'payments', { id: newId(), version: 1, createdAt: c.now, invoiceId: inv.id, invoiceNumber: inv.number, revision: rev.n, jobId: inv.jobId, customerId: inv.customerId, amount: dollars(balance), tip, technicianIds, currency: 'USD', mode: 'test', method: oneOf(p.method, ['card', 'ach'] as const, 'method'), status: 'reserved', fee: null, effects: [], taxBreakdown: structuredClone(rev.totals.taxBreakdown ?? [{ branchId: inv.branchId ?? null, jurisdictionId: 'legacy', jurisdiction: b.taxJurisdiction ?? 'Legacy tax', taxable: rev.totals.subtotal, tax: rev.totals.gst }]), connectionId: connection.connectionId, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role } })
    c.sql.push({ sql: 'INSERT INTO glove_payment_attempts(payment_id,session_id) VALUES(?,NULL)', params: [row.id] })
    c.checkoutId = row.id
    event(c, { jobId: row.jobId, subjectKind: 'payment', subjectId: row.id, kind: 'payment.requested', summary: `${c.actor.name} requested test-mode Stripe-hosted ${row.method} Checkout for ${inv.number}: $${row.amount}, tip $${tip}; not paid`, data: { paymentId: row.id, invoiceId: inv.id, amount: row.amount, tip, provider: 'Stripe' } })
    return row
  }
  if (type === 'payment.receipt') {
    allow(c.actor, type)
    if (c.actor.token || !['owner', 'office'].includes(c.actor.role)) fail('FORBIDDEN', 'Only a signed-in owner or office person emails a receipt in this slice.', null, 403)
    const payment = find(c.s, 'payments', p.paymentId); expectVersion(payment, p.version)
    if (payment.status !== 'paid') fail('PAYMENT_STATE', 'Only a confirmed payment gets a receipt.')
    const customer = find(c.s, 'customers', payment.customerId), b = business(c.s)
    const message = queueEmail(c, { kind: 'paymentReceipt', subjectKind: 'payment', subjectId: payment.id, customerId: customer.id, jobId: payment.jobId, to: address(customer.apEmail || customer.email, 'customer email'), subject: `Test payment receipt from ${b.name}`, text: `${b.name}\nTest payment confirmed by Stripe test mode for ${payment.invoiceNumber}: $${payment.amount}\nTip: $${payment.tip} (not sales tax or revenue)\nReference: ${payment.providerReference}\n${b.address || ''}`, label: `payment receipt for ${payment.invoiceNumber}` })
    bump(c.s, 'payments', payment, { receiptIds: [...(payment.receiptIds ?? []), message.id] })
    return message
  }
  return undefined
}
