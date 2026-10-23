import { createHmac, randomUUID } from 'node:crypto'
import { completedJob } from '../api/harness.mjs'
export async function connectPayments(h) {
  await h.command('payment.connect', { version: (await h.state()).business[0].version, mode: 'test', key: 'synthetic-glove-1', webhookSecret: 'synthetic-glove-2' })
  return h.command('payment.preferences', { version: (await h.state()).business[0].version, tipChoices: ['0.00', '15.00'] })
}
export async function paidInvoice(h, b, date) {
  const work = await completedJob(h, b, date), draft = await b.office.run('invoice.prepare', { jobId: work.job.id })
  return b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
}
export async function paymentEvent(h, pi, type, { id = randomUUID(), signature = true, at = Math.floor(Date.now() / 1000) } = {}) {
  const raw = JSON.stringify({ id, created: Math.floor(Date.now() / 1000), type, data: { object: pi } })
  return h.mf.dispatchFetch(h.origin + '/api/glove/payments/events', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${at},v1=${createHmac('sha256', signature ? 'synthetic-glove-2' : 'synthetic-glove-3').update(`${at}.${raw}`).digest('hex')}` }, body: raw })
}

/** A real $1,030 payment with a $15 processing fee: $1,015 funds a $1,000 instant payout plus its $15 fee. */
export async function instantFunding(h, b, date = '2026-11-01') {
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Instant payout source', lines: [{ description: 'Repair work', quantity: '1', unitPrice: '1030.00', tax: 'FREE' }] })
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '10:00', end: '12:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } })
  const draft = await b.office.run('invoice.prepare', { jobId: job.id })
  const invoice = await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
  const payment = await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'card' })
  const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
  Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: `synthetic-glove-instant-funding-${date}`, created: Math.floor(Date.now() / 1000), status: 'succeeded', balance_transaction: { fee: 1500 } } })
  const response = await paymentEvent(h, pi, 'payment_intent.succeeded')
  if (response.status !== 200) throw new Error('Instant payout source payment was not confirmed')
  return { payment: (await h.state()).payments.find(p => p.id === payment.id), invoice }
}
