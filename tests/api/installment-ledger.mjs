// PAY-004: one approved invoice paid in three parts and partly refunded, checked
// after every step against a cent ledger the test keeps for itself. Only the
// Stripe network edge is a fake; every number below is read through public doors.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'

const money = cents => (cents / 100).toFixed(2)
const zero = { current: '0.00', '1-30': '0.00', '31-60': '0.00', '61-90': '0.00', over90: '0.00' }
export const read = async (h, path) => {
  const response = await h.request(path)
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}

/** Independent receivable arithmetic: receipts add, confirmed refunds subtract, pending money never counts. */
export function ledger(totalCents) {
  const entries = []
  return {
    entries,
    add(entry) { entries.push(entry); return entry },
    paid: () => entries.filter(e => e.state === 'paid').reduce((n, e) => n + (e.refund ? -e.cents : e.cents), 0),
    net() { return totalCents - this.paid() },
    due() { return Math.max(0, this.net()) },
    credit() { return Math.max(0, -this.net()) },
  }
}

/** Every public read of the same cents must agree: invoice, customer balance, aging, tip-free tile. */
export async function assertReads(h, { a, b, ledger: l, otherDue, at }) {
  const balances = await read(h, '/api/glove/balances')
  const invoice = balances.invoices.find(i => i.id === a.id)
  assert.deepEqual([invoice.due, invoice.credit, invoice.href, invoice.customerId], [money(l.due()), money(l.credit()), `#invoices/${a.id}`, a.customerId])
  assert.equal(balances.invoices.find(i => i.id === b.id).due, money(otherDue))
  const customer = balances.customers.find(c => c.customerId === a.customerId)
  assert.deepEqual([customer.due, customer.credit, customer.balance], [money(l.due() + otherDue), money(l.credit()), money(l.due() + otherDue - l.credit())])
  const dashboard = await read(h, '/api/glove/dashboard')
  const open = money(l.due() + otherDue)
  // Aging today and 27 days after the due date: the exact bucket, customer total and invoice links.
  for (const [asOf, bucket] of [[dashboard.date, 'current'], ['2026-12-20', '1-30']]) {
    const aging = await read(h, `/api/glove/reports/receivables.json?asOf=${asOf}`)
    assert.deepEqual(aging.totals, [{ currency: 'USD', buckets: { ...zero, [bucket]: open }, total: open }])
    const row = aging.customers.find(c => c.customerId === a.customerId)
    assert.deepEqual([row.total, row.buckets], [open, { ...zero, [bucket]: open }])
    assert.deepEqual(row.invoices.map(i => [i.id, i.balance, i.bucket, i.href]).sort(), [...(l.due() > 0 ? [[a.id, money(l.due()), bucket, `#invoices/${a.id}`]] : []), [b.id, money(otherDue), bucket, `#invoices/${b.id}`]].sort())
    if (asOf === dashboard.date) assert.deepEqual(dashboard.receivables, aging.totals, 'the Today receivables tile is the aging total')
  }
  assert.equal(dashboard.receivables[0].total, open, 'the tile equals the open balances')
  return { balances, dashboard }
}

/** Each stored payment or refund, as the business export and the state show it. */
export async function assertRecord(h, row, expected) {
  const stored = (await h.state()).payments.find(p => p.id === row.id)
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(stored[key], value, `${row.id} ${key}`)
  return stored
}

export async function installmentJourney(h, b, { at, steps }) {
  const invoice = await paidInvoice(h, b, '2026-10-20'), other = await paidInvoice(h, b, '2026-10-21')
  const total = Math.round(Number(invoice.revisions[0].totals.total) * 100)
  assert.equal(total, 20790)
  const l = ledger(total), otherDue = Math.round(Number(other.revisions[0].totals.total) * 100)
  const check = name => async () => { await assertReads(h, { a: invoice, b: other, ledger: l, otherDue, at }); steps?.push(name) }
  const verify = check('read')
  await verify()
  const confirm = async (payment, chargeCents, feeCents, n) => {
    const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    assert.equal(pi.amount, chargeCents + Math.round(Number(payment.tip) * 100))
    Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: `synthetic-glove-charge-${payment.id}`, created: Date.parse(at) / 1000, status: 'succeeded', balance_transaction: { fee: feeCents } } })
    assert.equal((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: Date.parse(at) / 1000 })).status, 200)
    return pi
  }
  // Installment 1: Owner TEST Checkout card, $100.00 with a $15.00 tip. Requested is not paid.
  const commands = { first: randomUUID(), second: randomUUID(), check: randomUUID(), refund: randomUUID() }
  const firstPayload = { invoiceId: invoice.id, version: invoice.version, method: 'card', amount: '100.00', tip: '15.00' }
  const first = await h.command('payment.checkout', firstPayload, { commandId: commands.first })
  const firstEntry = l.add({ id: first.id, cents: 10000, state: 'reserved' })
  await verify()
  const pi1 = await confirm(first, 10000, 320)
  firstEntry.state = 'paid'
  await verify()
  const card1 = await assertRecord(h, first, { method: 'card', amount: '100.00', tip: '15.00', status: 'paid', providerReference: `synthetic-glove-charge-${first.id}`, fee: '3.20', invoiceId: invoice.id })
  // Installment 2: a second Owner card Checkout, $50.00, no tip.
  const secondPayload = { invoiceId: invoice.id, version: invoice.version, method: 'card', amount: '50.00' }
  const second = await h.command('payment.checkout', secondPayload, { commandId: commands.second })
  const secondEntry = l.add({ id: second.id, cents: 5000, state: 'reserved' })
  await verify()
  await confirm(second, 5000, 175)
  secondEntry.state = 'paid'
  await verify()
  const card2 = await assertRecord(h, second, { method: 'card', amount: '50.00', tip: '0.00', status: 'paid', providerReference: `synthetic-glove-charge-${second.id}`, invoiceId: invoice.id })
  // Installment 3: the Office records a check with its reference; staff record, never a provider claim.
  const reference = 'synthetic-glove-check-4417'
  const checkPayload = { invoiceId: invoice.id, version: invoice.version, method: 'check', reference, amount: '57.90' }
  const checkRow = await b.office.run('payment.record', checkPayload, { commandId: commands.check })
  l.add({ id: checkRow.id, cents: 5790, state: 'paid' })
  await verify()
  const check3 = await assertRecord(h, checkRow, { kind: 'payment', method: 'check', amount: '57.90', reference, status: 'paid', providerReference: undefined, by: { id: b.office.id, name: 'Olu Office', role: 'office' } })
  assert.equal(l.due(), 0)
  // The Owner refunds $50.00 to the first card (one idempotent Stripe request).
  const refundPayload = { invoiceId: invoice.id, version: invoice.version, paymentId: card1.id, paymentVersion: card1.version, amount: '50.00', reason: 'Customer returned part of the work' }
  h.stripePayments.refundStatus = 'pending'
  const pending = await h.command('payment.refund', refundPayload, { commandId: commands.refund })
  const refundEntry = l.add({ id: pending.id, cents: 5000, state: 'pending', refund: true })
  await assertRecord(h, pending, { kind: 'refund', method: 'card', amount: '50.00', status: 'pending', paymentId: card1.id, effects: [] })
  await verify()
  h.stripePayments.refunds.get(pending.providerReference).status = 'succeeded'
  const settled = await h.command('payment.refundRefresh', { refundId: pending.id, version: pending.version })
  refundEntry.state = 'paid'
  assert.equal(l.due(), 5000)
  await verify()
  const refund = await assertRecord(h, settled, { kind: 'refund', method: 'card', amount: '50.00', tip: '0.00', status: 'paid', paymentId: card1.id, providerReference: settled.providerReference, intentId: pi1.id, invoiceId: invoice.id })
  assert.match(refund.providerReference, /^synthetic-glove-refund-\d+$/)
  assert.equal(h.stripePayments.refunds.get(refund.providerReference).amount, 5000)
  const replay = async () => {
    await h.command('payment.checkout', firstPayload, { commandId: commands.first })
    await h.command('payment.checkout', secondPayload, { commandId: commands.second })
    await b.office.run('payment.record', checkPayload, { commandId: commands.check })
    await h.command('payment.refund', refundPayload, { commandId: commands.refund })
  }
  return { invoice, other, card1, card2, check3, refund, replay, ledger: l, verify, reference }
}
