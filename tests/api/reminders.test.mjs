import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail, mailEvents, postEvents } from './harness.mjs'
import { paidInvoice } from '../fixtures/payment-journey.mjs'

const templates = { confirmation: 'Booked {{customer}} on {{date}} at {{time}}.', moved: 'Moved to {{date}} at {{time}}.', cancelled: 'Cancelled {{date}}.', visitReminder: 'Bring access instructions for {{date}} at {{time}}.', paymentReminder: 'Please arrange {{amount}} for {{number}} due {{date}}.', quoteFollowup: 'Following up {{number}}: {{title}}, valid through {{date}}.' }
const day = (n = 0) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const at = (n, time = '10:00') => `${day(n)}T${time}:00.000Z`
const clock = (h, value) => h.request('/__test/clock', { method: 'POST', body: { at: value } })
const tick = async (h, value) => { await clock(h, value); await h.scheduled(value) }
async function setup(h) {
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const signer = mailEvents('sendgrid')
  await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: signer.eventKey, fromEmail: 'office@example.test' })
  return { b, signer }
}
async function configure(h, values = {}) {
  return h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, templates, visitHours: [24, 2], paymentDays: [-1, 0, 3], quoteDays: [2, 5, 10], ...values })
}
async function consent(h, customerId, purpose, enabled = true) {
  const customer = (await h.state()).customers.find(c => c.id === customerId)
  return h.command('reminder.consent', { customerId, version: customer.version, purpose, enabled, reference: 'Customer asked the owner in person' })
}
const messages = (h, kind) => h.state().then(s => s.messages.filter(m => m.kind === kind))
const body = mail => mail.body.content[0].value

test('COMM-003 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b, signer } = await setup(h)
  await clock(h, at(0))
  await b.office.run('reminder.configure', { enabled: false }, { error: 'FORBIDDEN' })
  await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: false }, { error: 'CONSENT' })
  const preview = await h.command('reminder.preview', { templates })
  assert.match(preview.visitReminder, /stop automatic emails/)
  assert.equal((await h.state()).business[0].messageAutomation, undefined)
  const policy = await configure(h)
  assert.equal(policy.preview.visitReminder, `Bring access instructions for 2026-11-01 at 10:00.\n\nHarbour Air & Electrical\n\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
  await h.command('reminder.configure', { version: policy.version, enabled: true, approved: true, templates: { ...templates, visitReminder: '{{secret}}' }, visitHours: [24], paymentDays: [], quoteDays: [] }, { error: 'INPUT' })
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Service visit' })
  let visit = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(2), start: '10:00', end: '11:00' })
  await tick(h, at(0))
  assert.equal(h.email.sent.length, 0, 'a recorded address alone never consents')
  await consent(h, b.customer.id, 'visits')
  await tick(h, at(0, '19:00'))
  assert.equal(h.email.sent.length, 0, 'quiet hours hold confirmations')
  await tick(h, at(1, '08:00'))
  assert.equal(h.email.sent.length, 1)
  assert.equal(body(h.email.sent[0]), `Booked Harbourview Dental on ${day(2)} at 10:00 (UTC).\n\nHarbour Air & Electrical\n\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
  await Promise.all([h.scheduled(at(1, '10:00')), h.scheduled(at(1, '10:00'))])
  assert.equal((await messages(h, 'visitReminder')).length, 1)
  assert.match(body(h.email.sent.at(-1)), /Bring access instructions/)
  await tick(h, at(2, '08:00'))
  assert.equal((await messages(h, 'visitReminder')).length, 2)
  await tick(h, at(2, '08:00'))
  assert.equal(h.email.sent.length, 3, 'replaying cron does not resend')
  visit = (await h.state()).visits.find(v => v.id === visit.id)
  visit = await h.command('visit.change', { visitId: visit.id, version: visit.version, date: day(3), start: '12:00', end: '13:00', reason: 'Customer requested tomorrow' })
  await tick(h, at(2, '08:30'))
  assert.equal((await messages(h, 'moved')).length, 1)
  await h.command('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Customer cancelled' })
  await tick(h, at(2, '09:00'))
  assert.equal((await messages(h, 'cancelled')).length, 1)
  const count = h.email.sent.length
  await tick(h, at(3, '10:00'))
  assert.equal(h.email.sent.length, count, 'cancelled visit has no later reminders')
  const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Assess heater' })
  await h.command('assessment.book', { enquiryId: enquiry.id, technicianId: b.priya.id, date: day(4), start: '11:00', end: '12:00' })
  await tick(h, at(3, '10:00'))
  assert.equal((await messages(h, 'confirmation')).length, 2)
  const first = (await messages(h, 'confirmation'))[0]
  const timestamp = Math.floor(new Date(at(3, '10:00')).getTime() / 1000)
  const delivery = [{ email: first.to, timestamp, event: 'delivered', sg_event_id: 'synthetic-glove-event', sg_message_id: 'sg-receipt-1.filter', rer_delivery_id: first.id }]
  assert.equal((await postEvents(h, { raw: JSON.stringify(delivery), headers: {} })).status, 401)
  assert.equal((await postEvents(h, signer.signed(delivery, { at: timestamp }))).status, 200)
  assert.equal((await h.state()).messageStates[first.id].status, 'delivered')
  await consent(h, b.customer.id, 'visits', false)
  await tick(h, at(4, '09:00'))
  assert.equal(h.email.sent.length, count + 1, 'withdrawal suppresses assessment reminder')
  await assertTrail(h, ['reminder.configure', 'reminder.consent', 'email.queued', 'email.accepted', 'email.delivered'])
})

test('PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  const first = await paidInvoice(h, b, day(0)), second = await paidInvoice(h, b, day(1))
  await configure(h, { visitHours: [], quoteDays: [], paymentDays: [-14, -13, -12] })
  await consent(h, b.customer.id, 'payments')
  await tick(h, at(0))
  assert.equal(h.email.sent.length, 2)
  assert.ok(h.email.sent.every(m => !/https?:|checkout|token=/i.test(body(m))), 'no checkout link or stored session reused')
  let inv = (await h.state()).invoices.find(i => i.id === first.id)
  await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, amount: inv.revisions.at(-1).totals.total, method: 'cash', reference: 'Paid in person' })
  await tick(h, at(1))
  assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === first.id).length, 1)
  assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === second.id).length, 2)
  const report = await h.request(`/api/glove/reports/receivables.json?asOf=${day(1)}`).then(r => r.json())
  assert.match(JSON.stringify(report), /2 reminder steps reserved/)
  inv = (await h.state()).invoices.find(i => i.id === second.id)
  await b.office.run('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Question about work' }, { error: 'FORBIDDEN' })
  await h.command('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Customer disputes the work' })
  await tick(h, at(2))
  assert.equal(h.email.sent.length, 3)
  const disputed = await h.request(`/api/glove/reports/receivables.json?asOf=${day(2)}`).then(r => r.json())
  assert.match(JSON.stringify(disputed), /Stopped: invoice disputed/)
  await assertTrail(h, ['invoice.dispute', 'email.queued', 'email.accepted'])
})

test('QUOTE-004 three quote sequences stop on day-three answer and day-seven expiry without reusing customer links', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [], paymentDays: [] })
  await consent(h, b.customer.id, 'quotes')
  const quotes = []
  for (let n = 0; n < 3; n++) {
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: `Service ${n}`, lines: [{ description: 'Repair', quantity: '1', unitPrice: '100.00' }], validUntil: day(n === 2 ? 7 : 30) })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    q = await h.command('quote.markSent', { quoteId: q.id, version: q.version, revision: 1, channel: 'email' })
    quotes.push(q)
  }
  await tick(h, at(1)); assert.equal(h.email.sent.length, 0)
  await tick(h, at(2)); assert.equal(h.email.sent.length, 3)
  await clock(h, at(3))
  await h.command('quote.decline', { quoteId: quotes[1].id, version: quotes[1].version, revision: 1, method: 'phone', customerName: 'Customer', reason: 'No longer needed' })
  await tick(h, at(5)); assert.equal(h.email.sent.length, 5)
  await tick(h, at(10)); assert.equal(h.email.sent.length, 6)
  await tick(h, at(10)); assert.equal(h.email.sent.length, 6)
  await clock(h, at(5)) // Return to the live session after the day-ten scheduler observation.
  const sent = await messages(h, 'quoteFollowup')
  assert.deepEqual(quotes.map(q => sent.filter(m => m.subjectId === q.id).length), [3, 1, 2])
  assert.ok(h.email.sent.every(m => !/https?:|token=/i.test(body(m))))
  // Erasure retires both queued intents and receipts through the existing customer door.
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(exported).includes(customer.email))
  await tick(h, at(11)); assert.equal(h.email.sent.length, 6)
})

test('Automatic email refuses changed addresses, disabled automation and repeated provider failures', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [24], paymentDays: [], quoteDays: [] })
  await consent(h, b.customer.id, 'visits')
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Access visit' })
  await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(2), start: '12:00', end: '13:00' })
  let customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  customer = await h.command('customer.save', { ...customer, email: 'changed@example.test' })
  await tick(h, at(0)); assert.equal(h.email.sent.length, 0, 'consent is bound to the recorded address')
  await consent(h, b.customer.id, 'visits')
  h.email.status['changed@example.test'] = 500
  await tick(h, at(0)); assert.equal(h.email.sent.length, 1)
  const queued = (await messages(h, 'confirmation'))[0]
  assert.equal((await h.state()).messageStates[queued.id].status, 'uncertain')
  await tick(h, at(0)); assert.equal(h.email.sent.length, 1, 'an uncertain send stays uncertain')
  await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: false })
  await tick(h, at(1, '12:00')); assert.equal(h.email.sent.length, 1, 'owner switch stops the pending reminder')
})


test('Erasure during an automatic provider attempt never restores recipient addresses in the outcome', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [], paymentDays: [], quoteDays: [] })
  await consent(h, b.customer.id, 'visits')
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Visit with pending provider reply' })
  await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(1), start: '12:00', end: '13:00' })
  let release, entered
  const pending = new Promise(resolve => { release = resolve })
  const started = new Promise(resolve => { entered = resolve })
  h.email.beforeRespond = () => { entered(); return pending }
  const run = h.scheduled(at(0))
  try {
    await started
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  } finally { release(); await run }
  assert.equal(h.email.sent.length, 1, 'the already-started provider request cannot be recalled')
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(exported).includes(b.customer.email), 'provider response does not restore an erased address')
  assert.equal((await h.state()).messages.length, 0)
})
