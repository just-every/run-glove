// COMM-007 one conversation history per customer, through the command,
// conversation-stream, Activity and export doors: a logged call, a logged
// note, today's real sends (requests, request follow-ups, quotes recorded as
// sent and answered, a purchase order recorded as sent, Web Push notices with
// the push service's answer) and agent actions in one ordered stream on the
// customer and the job, with direction, channel, author and delivery.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'
import { phoneKeys } from '../fixtures/push-service.mjs'

test('COMM-007 a logged call, a logged note, today\'s real sends and agent actions read in order from the customer and the job', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const viewer = await h.person('Vic Viewer', 'viewer')
  const read = async (query, person) => { const r = await h.request(`/api/glove/conversation?${query}`, person ? { as: person.cookie } : {}); return { status: r.status, body: await r.json() } }
  const phone = 'https://push.example.test/send/priya-phone'
  await h.command('push.setup', {})
  await b.priyaPerson.run('push.subscribe', { endpoint: phone, keys: (await phoneKeys()).keys, device: 'iPhone' })

  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Rooftop unit is short cycling' })
  await b.office.run('enquiry.contact', { enquiryId: request.id, version: request.version, note: 'Called back, booked a look' })
  let quote = await b.agent.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, enquiryId: request.id, title: 'Rooftop unit repair', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  quote = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  quote = await b.office.run('quote.markSent', { quoteId: quote.id, version: quote.version, channel: 'email' })
  quote = await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'signed', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2030-03-12', start: '09:00', end: '10:00' })
  h.pushes.status[phone] = 410
  await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, start: '11:00', end: '12:00', reason: 'Customer asked for late morning' })
  const part = await h.command('service.save', { code: 'CAP-455', name: 'Capacitor 45/5', kind: 'material', unit: 'each', unitCost: '11.50', unitPrice: '38.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const po = await b.office.run('po.save', { supplier: 'Supply Co', supplierEmail: 'orders@supplyco.example', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: part.id, quantity: '1' }] })
  await b.office.run('po.send', { poId: po.id, version: po.version, method: 'portal', reference: 'SC-1' })

  await t.test('COMM-007 the desk logs a call and a note on the customer and their job; field roles and agents cannot', async () => {
    await b.office.run('conversation.log', { customerId: b.customer.id, jobId: job.id, kind: 'call', direction: 'inbound', outcome: 'answered', minutes: 4, text: 'Asked whether the unit can run until Thursday' })
    await b.dispatcher.run('conversation.log', { customerId: b.customer.id, jobId: job.id, kind: 'note', text: 'Gate code changed to 4471' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'outbound', outcome: 'voicemail' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'note' }, { error: 'INPUT' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'inbound', outcome: 'missed' }, { error: 'INPUT' })
    for (const person of [b.priyaPerson, b.agent]) await person.run('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'x' }, { error: 'FORBIDDEN' })
    const other = await h.command('customer.save', { name: 'Lee Park' })
    await b.office.run('conversation.log', { customerId: other.id, jobId: job.id, kind: 'note', text: 'Wrong customer' }, { error: 'CUSTOMER' })
  })

  const expected = [
    ['request', 'inbound', 'phone', 'Harbourview Dental', null, 'Received'],
    ['request follow-up', 'outbound', 'recorded contact', 'Olu Office', 'Harbourview Dental', 'Not confirmed: contact made outside Glove'],
    ['agent action', 'internal', 'agent', 'Ada Agent', null, 'Prepared in Glove: nothing sent to the customer'],
    ['quote sent', 'outbound', 'email', 'Olu Office', 'Harbourview Dental', 'Not confirmed: sent outside Glove'],
    ['quote accepted', 'inbound', 'signed', 'Dr Mei Lin', null, 'Received'],
    ['push notice', 'outbound', 'Web Push', 'Glove', 'Priya N.', 'Handed to the push service (HTTP 201); arrival on the phone is not confirmed'],
    ['push notice', 'outbound', 'Web Push', 'Glove', 'Priya N.', 'Not sent: the push service answered HTTP 410'],
    ['purchase order sent', 'outbound', 'portal', 'Olu Office', 'Supply Co', 'Not confirmed: sent outside Glove'],
    ['call', 'inbound', 'phone call (logged)', 'Harbourview Dental', 'Olu Office', 'answered, 4 min'],
    ['note', 'internal', 'note', 'Sam Ortiz', null, 'Internal note: not sent to the customer'],
  ]
  const shape = entries => entries.map(e => [e.kind, e.direction, e.channel, e.author, e.to, e.delivery])

  await t.test('COMM-007 the customer and the job read one stream, oldest first, with direction, channel, author and delivery', async () => {
    const customer = await read(`customerId=${b.customer.id}`)
    assert.equal(customer.status, 200)
    assert.deepEqual(shape(customer.body.entries), [...expected, ['call', 'outbound', 'phone call (logged)', 'Olu Office', 'Harbourview Dental', 'voicemail']])
    assert.deepEqual(customer.body.entries.map(e => e.at), customer.body.entries.map(e => e.at).sort(), 'oldest first')
    assert.match(customer.body.entries.find(e => e.kind === 'agent action').text, new RegExp(`^${quote.number} drafted by Ada Agent \\(agent\\)`))
    assert.equal(customer.body.entries.find(e => e.kind === 'quote accepted').recordedBy, 'Sam Ortiz', 'the person who recorded the customer\'s answer')
    assert.equal(customer.body.entries.find(e => e.kind === 'call').text, 'Asked whether the unit can run until Thursday')
    const onJob = await read(`jobId=${job.id}`, viewer)
    assert.equal(onJob.status, 200)
    assert.deepEqual(shape(onJob.body.entries), expected, 'the job reads its own request, quote, notices, order, call and note, not the customer-level voicemail')
    assert.deepEqual(onJob.body.entries.filter(e => ['call', 'note', 'push notice', 'purchase order sent'].includes(e.kind)).map(e => e.jobId), Array(5).fill(job.id))
  })

  await t.test('COMM-007 only the desk reads the stream, and the logged call and note are in Activity and the business export', async () => {
    for (const person of [b.priyaPerson, b.tomPerson]) assert.equal((await read(`jobId=${job.id}`, person)).status, 403)
    assert.equal((await read(`customerId=${b.customer.id}&jobId=${job.id}`)).status, 400)
    assert.equal((await read('customerId=nobody')).status, 404)
    const { exported } = await assertTrail(h, ['call.logged', 'note.logged'])
    assert.deepEqual(exported.conversations.map(x => [x.kind, x.direction, x.outcome, x.by.name]), [['call', 'inbound', 'answered', 'Olu Office'], ['note', null, null, 'Sam Ortiz'], ['call', 'outbound', 'voicemail', 'Olu Office']])
  })

  await t.test('COMM-007 a merged customer\'s history reads on the customer it was merged into', async () => {
    const dup = await h.command('customer.save', { name: 'Harbourview Dental Clinic' })
    await b.office.run('conversation.log', { customerId: dup.id, kind: 'note', text: 'Asked for a maintenance plan' })
    const s = await h.state()
    await b.dispatcher.run('customer.merge', { survivorId: b.customer.id, mergedIds: [dup.id], versions: Object.fromEntries(s.customers.filter(c => [b.customer.id, dup.id].includes(c.id)).map(c => [c.id, c.version])) })
    assert.equal((await read(`customerId=${b.customer.id}`)).body.entries.at(-1).text, 'Asked for a maintenance plan')
    await b.office.run('conversation.log', { customerId: dup.id, kind: 'note', text: 'x' }, { error: 'MERGED' })
  })
})
