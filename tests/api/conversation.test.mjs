// COMM-007 one conversation history per customer, through the command,
// conversation-stream, Activity and export doors: a logged call, a logged
// note, today's real sends (requests, request follow-ups, quotes recorded as
// sent and answered, a purchase order recorded as sent, Web Push notices with
// the push service's answer) and agent actions in one ordered stream on the
// customer and the job, with direction, channel, author and delivery.
import test, { after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'
import { phoneKeys } from '../fixtures/push-service.mjs'

describe('COMM-007 a logged call, a logged note, today\'s real sends and agent actions read in order from the customer and the job', async (t) => {
  const h = await installation()
  after(() => h.close())
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

  test('COMM-007 the desk logs calls and notes, refuses field and agent logs, and reads ordered customer and job streams with direction, channel, author and delivery', async () => {
    await b.office.run('conversation.log', { customerId: b.customer.id, jobId: job.id, kind: 'call', direction: 'inbound', outcome: 'answered', minutes: 4, text: 'Asked whether the unit can run until Thursday' })
    await b.dispatcher.run('conversation.log', { customerId: b.customer.id, jobId: job.id, kind: 'note', text: 'Gate code changed to 4471' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'outbound', outcome: 'voicemail' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'note' }, { error: 'INPUT' })
    await b.office.run('conversation.log', { customerId: b.customer.id, kind: 'call', direction: 'inbound', outcome: 'missed' }, { error: 'INPUT' })
    for (const person of [b.priyaPerson, b.agent]) await person.run('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'x' }, { error: 'FORBIDDEN' })
    const other = await h.command('customer.save', { name: 'Lee Park' })
    await b.office.run('conversation.log', { customerId: other.id, jobId: job.id, kind: 'note', text: 'Wrong customer' }, { error: 'CUSTOMER' })
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

  test('COMM-007 / CUST-001 the property history carries the same messages at its site, newest first, and not the customer-level voicemail; field roles read none', async () => {
    const history = async person => { const r = await h.request(`/api/glove/sites/${b.site.id}/history`, person ? { as: person.cookie } : {}); assert.equal(r.status, 200); return (await r.json()).entries }
    const messages = (await history(viewer)).filter(e => e.kind === 'message')
    const stream = (await read(`jobId=${job.id}`, viewer)).body.entries
    assert.equal(messages.length, stream.length)
    assert.deepEqual(messages.map(e => e.id).reverse(), stream.map(e => e.id), 'the job\'s stream, newest first')
    assert.deepEqual(messages.map(e => e.at), messages.map(e => e.at).sort().reverse())
    const accepted = messages.find(e => e.id.startsWith('quote-answer:'))
    assert.match(accepted.label, /^quote accepted \(inbound, signed, Dr Mei Lin\)/)
    assert.equal(accepted.status, 'Received')
    assert.equal(messages.find(e => e.label.startsWith('push notice') && e.status.includes('HTTP 410')).jobId, job.id)
    assert.ok(!(await history()).some(e => e.label.includes('voicemail') || e.status === 'voicemail'))
    assert.ok(!(await history(b.priyaPerson)).some(e => e.kind === 'message'))
  })

  test('COMM-007 only the desk reads the stream, and the logged call and note are in Activity and the business export', async () => {
    for (const person of [b.priyaPerson, b.tomPerson]) assert.equal((await read(`jobId=${job.id}`, person)).status, 403)
    assert.equal((await read(`customerId=${b.customer.id}&jobId=${job.id}`)).status, 400)
    assert.equal((await read('customerId=nobody')).status, 404)
    const { exported } = await assertTrail(h, ['call.logged', 'note.logged'])
    assert.deepEqual(exported.conversations.map(x => [x.kind, x.direction, x.outcome, x.by.name]), [['call', 'inbound', 'answered', 'Olu Office'], ['note', null, null, 'Sam Ortiz'], ['call', 'outbound', 'voicemail', 'Olu Office']])
  })

  test('COMM-007 two populated human histories survive merge and Worker restart; current role and branch refusals change nothing', async () => {
    const h = await installation({ at: '2030-03-12T12:00:00Z' })
    try {
      const b = await business(h)
      const viewer = await h.person('History Viewer', 'viewer')
      const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Harbour inspection' })
      const read = async (query, person) => { const r = await h.request(`/api/glove/conversation?${query}`, person ? { as: person.cookie } : {}); return { status: r.status, body: await r.json() } }
      const branch = await h.command('branch.save', { name: 'River', prefix: 'RIV', timezone: 'UTC', zips: ['10001'] })
      const dup = await h.command('customer.save', { name: 'Harbourview Dental Clinic' })
      const site = await h.command('site.save', { customerId: dup.id, address: '20 River Street' })
      const otherJob = await h.command('job.create', { customerId: dup.id, siteId: site.id, title: 'River inspection' })
      const baseline = (await read(`customerId=${b.customer.id}`)).body.entries
      const facts = []
      const record = async (person, customerId, jobId, kind, at, text, direction, outcome) => {
        assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
        const commandId = `synthetic-glove-conversation-${facts.length + 1}`
        const row = await person.run('conversation.log', { customerId, ...(jobId ? { jobId } : {}), kind, text, ...(kind === 'call' ? { direction, outcome, minutes: 4 } : {}) }, { commandId })
        facts.push({ row, commandId, at, text, kind, jobId: jobId ?? null, customerId, person, direction: kind === 'call' ? direction : 'internal', delivery: kind === 'call' ? `${outcome}, 4 min` : 'Internal note: not sent to the customer' })
      }
      await record(b.office, b.customer.id, job.id, 'call', '2030-03-12T12:01:00.000Z', 'Harbour called about the filter', 'inbound', 'answered')
      await record(b.dispatcher, dup.id, otherJob.id, 'call', '2030-03-12T12:02:00.000Z', 'River callback reached voicemail', 'outbound', 'voicemail')
      await record(b.dispatcher, b.customer.id, job.id, 'note', '2030-03-12T12:03:00.000Z', 'Harbour needs a washable filter')
      await record(b.office, dup.id, otherJob.id, 'note', '2030-03-12T12:04:00.000Z', 'River needs the back entrance')
      await record(b.office, dup.id, null, 'note', '2030-03-12T12:05:00.000Z', 'Asked for a maintenance plan')
      const expectedHuman = (f, merged = false) => ({
        id: `${f.kind}:${f.row.id}`, at: f.at, jobId: f.jobId, kind: f.kind, direction: f.direction,
        channel: f.kind === 'call' ? 'phone call (logged)' : 'note',
        author: f.direction === 'inbound' ? b.customer.name : f.person.name,
        to: f.direction === 'inbound' ? f.person.name : f.direction === 'outbound' ? merged ? b.customer.name : dup.name : null,
        recordedBy: f.person.name, text: f.text, delivery: f.delivery,
      })
      const primary = facts.filter(f => f.customerId === b.customer.id), secondary = facts.filter(f => f.customerId === dup.id)
      assert.deepEqual((await read(`customerId=${b.customer.id}`)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
      assert.deepEqual((await read(`customerId=${dup.id}`)).body.entries, secondary.map(f => expectedHuman(f)))
      assert.deepEqual((await read(`jobId=${otherJob.id}`)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
      const domain = async () => { const { exportedAt: _time, ...records } = await (await h.request('/api/glove/export')).json(); return records }
      await h.restart()
      const beforeReads = await domain()
      assert.deepEqual((await read(`customerId=${dup.id}`, b.office)).body.entries, secondary.map(f => expectedHuman(f)))
      assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
      assert.equal((await read(`jobId=${otherJob.id}`, b.priyaPerson)).status, 403)
      assert.deepEqual(await domain(), beforeReads, 'allowed and refused reads leave every domain record unchanged')

      await h.command('branch.limit', { operatorId: b.office.id, branchId: 'main' })
      const beforeBranch = await domain()
      assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...primary.map(f => expectedHuman(f))])
      assert.deepEqual((await read(`jobId=${otherJob.id}`, b.office)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f)))
      assert.deepEqual(await domain(), beforeBranch)
      await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
      const beforeOtherBranch = await domain()
      for (const query of [`customerId=${b.customer.id}`, `jobId=${job.id}`, `customerId=${dup.id}`, `jobId=${otherJob.id}`]) {
        const refused = await read(query, b.office)
        assert.equal(refused.status, 404)
        assert.equal(refused.body.entries, undefined)
      }
      assert.deepEqual(await domain(), beforeOtherBranch)
      await h.command('branch.limit', { operatorId: b.office.id, branchId: null })
      await h.command('role.set', { operatorId: b.office.id, role: 'technician' })
      const beforeRole = await domain()
      for (const query of [`customerId=${b.customer.id}`, `jobId=${job.id}`, `customerId=${dup.id}`, `jobId=${otherJob.id}`]) {
        const refused = await read(query, b.office)
        assert.equal(refused.status, 403)
        assert.equal(refused.body.entries, undefined)
      }
      assert.deepEqual(await domain(), beforeRole)
      await h.command('role.set', { operatorId: b.office.id, role: 'office' })

      const s = await h.state()
      await b.dispatcher.run('customer.merge', { survivorId: b.customer.id, mergedIds: [dup.id], versions: Object.fromEntries(s.customers.filter(c => [b.customer.id, dup.id].includes(c.id)).map(c => [c.id, c.version])) })
      await h.restart()
      const beforeSurvivorReads = await domain()
      assert.deepEqual((await read(`customerId=${b.customer.id}`, b.office)).body.entries, [...baseline, ...facts.map(f => expectedHuman(f, true))])
      assert.deepEqual((await read(`jobId=${job.id}`, viewer)).body.entries, primary.map(f => expectedHuman(f, true)))
      assert.deepEqual((await read(`jobId=${otherJob.id}`, viewer)).body.entries, secondary.filter(f => f.jobId).map(f => expectedHuman(f, true)))
      assert.equal((await read(`customerId=${b.customer.id}`)).body.entries.at(-1).text, 'Asked for a maintenance plan')
      assert.deepEqual(await domain(), beforeSurvivorReads)
      await b.office.run('conversation.log', { customerId: dup.id, kind: 'note', text: 'x' }, { error: 'MERGED' })
      const { activity, exported } = await assertTrail(h, ['call.logged', 'note.logged'])
      for (const f of facts) {
        const e = activity.find(e => e.commandId === f.commandId)
        assert.ok(e)
        assert.deepEqual([e.kind, e.subjectId, e.jobId, e.actorId, e.actorName, e.actorRole, e.at], [f.kind === 'call' ? 'call.logged' : 'note.logged', f.row.id, f.jobId, f.person.id, f.person.name, f.person === b.office ? 'office' : 'dispatcher', f.at])
        const kept = exported.timeline.find(x => x.id === e.id)
        assert.deepEqual([kept.command_id, kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.subject_id, kept.job_id], [f.commandId, f.person.id, f.person.name, e.actorRole, f.at, f.row.id, f.jobId])
        const record = exported.conversations.find(x => x.id === f.row.id)
        assert.deepEqual([record.text, record.createdAt, record.by.id, record.by.name, record.by.role], [f.text, f.at, f.person.id, f.person.name, e.actorRole])
      }
    } finally { await h.close() }
  })
})
