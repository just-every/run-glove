import { createHmac, randomUUID } from 'node:crypto'
import { completedJob } from '../api/harness.mjs'
export async function connectPayments(h) {
  return h.command('payment.connect', { version: (await h.state()).business[0].version, mode: 'test', key: 'synthetic-glove-1', webhookSecret: 'synthetic-glove-2' })
}
export async function paidInvoice(h, b, date) {
  const work = await completedJob(h, b, date), draft = await b.office.run('invoice.prepare', { jobId: work.job.id })
  return b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
}
export async function paymentEvent(h, pi, type, { id = randomUUID(), signature = true, at = Math.floor(Date.now() / 1000) } = {}) {
  const raw = JSON.stringify({ id, created: Math.floor(Date.now() / 1000), type, data: { object: pi } })
  return h.mf.dispatchFetch(h.origin + '/api/glove/payments/events', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': `t=${at},v1=${createHmac('sha256', signature ? 'synthetic-glove-2' : 'synthetic-glove-3').update(`${at}.${raw}`).digest('hex')}` }, body: raw })
}
