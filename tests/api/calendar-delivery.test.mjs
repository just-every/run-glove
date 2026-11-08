import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, routingDay, assertTrail } from './harness.mjs'

const at = '2026-11-03T00:00:00.000Z'
const connect = (h, tech, provider, suffix = '1') => h.command('calendar.connect', {
  technicianId: tech.id, provider, calendarId: `synthetic-glove-calendar-${suffix}`,
  clientId: 'synthetic-glove-303', clientSecret: 'synthetic-glove-304', refreshToken: 'synthetic-glove-305', confirm: true,
})
const writes = h => h.calendarSync.calls.filter(c => c.method !== 'GET')
const work = async h => (await h.db.prepare('SELECT * FROM glove_calendar_work ORDER BY sequence').all()).results
const mapping = async h => (await h.db.prepare('SELECT * FROM glove_calendar_events ORDER BY connection_id,visit_id').all()).results
const technician = async (h, id) => (await h.state()).technicians.find(t => t.id === id)

// One lifecycle journey, with two technicians connected to different providers.
test('DISP-015 all visit doors deliver one ordered calendar write per affected technician and visit', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h)
  await connect(h, b.priya, 'google')
  await connect(h, b.tom, 'microsoft', '2')
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const expectWrites = async (type, payload, expected, commandId) => {
    const start = (await work(h)).length, calls = writes(h).length
    const result = await b.dispatcher.run(type, payload, { commandId })
    const rows = (await work(h)).slice(start)
    assert.deepEqual(rows.map(r => [r.technician_id, r.visit_id]).sort(), (await expected(result)).sort(), type)
    assert.equal(new Set(rows.map(r => r.id)).size, rows.length)
    assert.ok(rows.every(r => r.command_id === commandId && r.state === 'confirmed'), type)
    assert.equal(writes(h).length - calls, rows.length, `${type} sends exactly once`)
    const delivered = writes(h).slice(calls)
    assert.deepEqual(delivered.map(c => c.method), rows.map(r => r.action === 'create' ? 'POST' : r.action === 'update' ? 'PATCH' : 'DELETE'), 'provider requests follow the durable order')
    await b.dispatcher.run(type, payload, { commandId })
    assert.equal((await work(h)).length, start + rows.length, 'replay enqueues nothing')
    assert.equal(writes(h).length, calls + rows.length, 'replay sends nothing')
    return result
  }
  let v = await expectWrites('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-05', start: '09:00', end: '10:00' }, v => [[b.priya.id, v.id]], 'synthetic-glove-book')
  const previous = (await mapping(h)).find(m => m.visit_id === v.id)
  v = await expectWrites('visit.change', { visitId: v.id, version: v.version, technicianId: b.tom.id, start: '11:00', end: '12:00', reason: 'Reassigned by dispatcher' }, v => [[b.priya.id, v.id], [b.tom.id, v.id]], 'synthetic-glove-reassign')
  assert.equal(h.calendarSync.events.has(previous.event_id), false, 'old technician event is deleted')
  const next = (await mapping(h)).find(m => m.visit_id === v.id)
  assert.notEqual(next.connection_id, previous.connection_id)
  assert.ok(h.calendarSync.events.has(next.event_id), 'new technician event exists')
  const created = writes(h).findLast(c => c.method === 'POST')
  assert.equal(created.provider, 'microsoft')
  assert.deepEqual([created.body.start.dateTime, created.body.end.dateTime], [v.startAt, v.endAt])
  v = await expectWrites('visit.change', { visitId: v.id, version: v.version, start: '13:00', end: '14:00', reason: 'Later arrival' }, v => [[b.tom.id, v.id]], 'synthetic-glove-change')
  assert.equal(writes(h).at(-1).body.start.dateTime, v.startAt)
  await expectWrites('visit.cancel', { visitId: v.id, version: v.version, reason: 'Customer cancelled' }, v => [[b.tom.id, v.id]], 'synthetic-glove-cancel')
  assert.equal(h.calendarSync.events.size, 0)

  const crew = await h.command('crew.save', { name: 'Calendar crew', memberIds: [b.priya.id, b.tom.id] })
  const crewDay = await expectWrites('visit.book', { jobId: job.id, crewId: crew.id, date: '2026-11-06', start: '09:00', end: '10:00' }, r => r.visits.map(v => [v.technicianId, v.id]), 'synthetic-glove-crew')
  assert.equal(crewDay.visits.length, 2)
  await expectWrites('visit.change', { visitId: crewDay.visits[0].id, version: crewDay.visits[0].version, start: '11:00', end: '12:00', reason: 'Move entire crew' }, () => crewDay.visits.map(v => [v.technicianId, v.id]), 'synthetic-glove-crew-change')
  const seriesJob = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Quarterly calendar visits')).id })
  await expectWrites('series.create', { jobId: seriesJob.id, version: seriesJob.version, technicianId: b.priya.id, rule: { unit: 'month', interval: 3 }, date: '2027-01-15', start: '09:00', end: '10:00', until: '2027-12-31', horizonDays: 730 }, async () => (await h.state()).visits.filter(v => v.jobId === seriesJob.id).map(v => [b.priya.id, v.id]), 'synthetic-glove-series')
  const occurrences = (await h.state()).visits.filter(v => v.jobId === seriesJob.id)
  assert.deepEqual(occurrences.map(v => v.local.date).sort(), ['2027-01-15', '2027-04-15', '2027-07-15', '2027-10-15'])
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Survey for calendar delivery' })
  await expectWrites('assessment.book', { enquiryId: request.id, technicianId: b.tom.id, date: '2026-11-09', start: '09:00', end: '10:00' }, r => [[b.tom.id, r.visit.id]], 'synthetic-glove-assessment')
  const before = await work(h), count = writes(h).length
  await b.office.run('customer.save', { name: 'Unrelated customer' })
  await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-06', start: '11:00', end: '12:00' }, { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(await work(h), before, 'unrelated commands and refused changes enqueue nothing')
  assert.equal(writes(h).length, count)
  await h.restart(); await h.scheduled(at)
  assert.equal(writes(h).length, count, 'confirmed operations do not repeat after restart')
  await assertTrail(h, ['calendar.connected', 'calendar.outcome', 'visit.changed'])
})

test('DISP-015 uncertain writes survive replay and Worker restart, block later delivery, and disconnect retains review without replay on reconnection', async t => {
  for (const [provider, answer] of [['google', 'unconfirmed'], ['microsoft', 'timeout']]) {
    const h = await installation({ at })
    try {
      const b = await business(h)
      await connect(h, b.priya, provider)
      await connect(h, b.tom, provider === 'google' ? 'microsoft' : 'google', '2')
      const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Calendar uncertainty' })
      let v = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-05', start: '09:00', end: '10:00' })
      const retained = await mapping(h), event = retained.find(m => m.visit_id === v.id)
      h.calendarSync.writeReply = () => answer === 'timeout'
        ? new Response('{}', { headers: { 'x-synthetic-glove-calendar-timeout': '1' } }) : Response.json({})
      // A create whose provider may have kept it, without a usable acknowledgement.
      const payload = { jobId: job.id, technicianId: b.priya.id, date: '2026-11-06', start: '09:00', end: '10:00' }
      const uncertain = await b.dispatcher.run('visit.book', payload, { commandId: `synthetic-glove-uncertain-${provider}` })
      const originalCalls = writes(h).length, originalConnection = (await technician(h, b.priya.id)).calendarSync.connectionId
      h.calendarSync.writeReply = null
      v = await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '11:00', end: '12:00', reason: 'Queued behind uncertain write' })
      assert.equal(writes(h).length, originalCalls)
      assert.equal((await technician(h, b.priya.id)).calendarOutcome.state, 'unknown', 'pending work must not hide uncertainty')
      const trail = await assertTrail(h, ['calendar.outcome'])
      assert.ok(trail.activity.some(e => e.kind === 'calendar.outcome' && e.commandId === `synthetic-glove-uncertain-${provider}` && e.summary.includes('unknown')))
      await b.dispatcher.run('visit.book', payload, { commandId: `synthetic-glove-uncertain-${provider}` })
      for (let i = 0; i < 2; i++) await h.scheduled(at)
      await h.restart()
      await h.scheduled(at)
      assert.equal(writes(h).length, originalCalls, 'cron, replay and an actual Worker restart never repeat uncertain work')
      assert.equal((await technician(h, b.priya.id)).calendarOutcome.state, 'unknown')
      const pending = (await work(h)).filter(w => w.connection_id === originalConnection && w.state === 'pending')
      assert.equal(pending.length, 1)
      // Another connection remains live while the uncertain connection is held.
      await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-07', start: '09:00', end: '10:00' })
      assert.equal(writes(h).length, originalCalls + 1)
      const stoppedCalls = writes(h).length
      await b.dispatcher.run('calendar.connect', { technicianId: b.priya.id, disconnect: true }, { error: 'FORBIDDEN' })
      await h.command('calendar.connect', { technicianId: b.priya.id, disconnect: true })
      await h.scheduled(at)
      assert.equal(writes(h).length, stoppedCalls, 'disconnect causes no provider write')
      assert.ok(h.calendarSync.events.has(event.event_id), 'existing provider event survives')
      assert.deepEqual((await mapping(h)).filter(m => m.connection_id === originalConnection), retained)
      const disconnected = await technician(h, b.priya.id)
      assert.equal(disconnected.calendarSync, null)
      assert.deepEqual(disconnected.calendarRetainedEvents, [{ connectionId: event.connection_id, visitId: v.id, eventId: event.event_id }])
      assert.ok(disconnected.calendarUncertainWrites.some(w => w.visitId === uncertain.id && w.state === 'unknown'))
      assert.ok((await work(h)).filter(w => pending.some(p => p.id === w.id)).every(w => w.state === 'disconnected'))
      for (const person of [b.dispatcher, b.tomPerson, b.agent]) {
        const limited = (await person.state()).technicians.find(t => t.id === b.priya.id)
        assert.equal(limited?.calendarRetainedEvents, undefined)
        assert.equal(limited?.calendarUncertainWrites, undefined)
      }
      await connect(h, b.priya, provider, '3')
      const reconnected = await technician(h, b.priya.id)
      assert.notEqual(reconnected.calendarSync.connectionId, originalConnection)
      assert.ok(reconnected.calendarUncertainWrites.some(w => w.visitId === uncertain.id))
      const oldWork = (await work(h)).filter(w => w.connection_id === originalConnection)
      assert.equal(oldWork.find(w => w.visit_id === uncertain.id).state, 'unknown')
      assert.ok((await work(h)).filter(w => w.sequence > oldWork.at(-1).sequence && w.technician_id === b.priya.id).every(w => w.connection_id === reconnected.calendarSync.connectionId && w.state === 'confirmed'))
      const freshCalls = writes(h).length
      await h.restart(); await h.scheduled(at)
      await b.dispatcher.run('visit.book', payload, { commandId: `synthetic-glove-uncertain-${provider}` })
      assert.equal(writes(h).length, freshCalls, 'reconnection grants no replay of old uncertain work')
      await assertTrail(h, ['calendar.disconnected', 'calendar.connected', 'calendar.outcome'])
    } finally { await h.close() }
  }
})


test('DISP-015 accepted route proposals enqueue only affected visits on each connected calendar', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, visits, day } = await routingDay(h)
  await connect(h, b.priya, 'google')
  await connect(h, b.tom, 'microsoft', '2')
  const queued = await b.dispatcher.run('route.optimize', { date: day })
  await h.scheduled(at)
  const ready = (await h.state()).routes.find(r => r.id === queued.id)
  assert.equal(ready.status, 'ready')
  const before = await work(h), count = writes(h).length
  const payload = { routeId: ready.id, version: ready.version, reason: 'Accept less driving within the reviewed windows' }
  await b.dispatcher.run('route.accept', payload, { commandId: 'synthetic-glove-route' })
  const after = (await h.state()).visits
  const changed = after.filter(v => { const old = visits.find(o => o.id === v.id); return old && ['technicianId', 'startAt', 'endAt', 'status'].some(k => old[k] !== v[k]) })
  assert.ok(changed.length > 0)
  const connected = [b.priya.id, b.tom.id]
  const expected = changed.flatMap(v => [...new Set([v.technicianId, visits.find(o => o.id === v.id).technicianId])].filter(id => connected.includes(id)).map(id => [id, v.id]))
  const rows = (await work(h)).slice(before.length)
  assert.deepEqual(rows.map(w => [w.technician_id, w.visit_id]).sort(), expected.sort())
  assert.ok(rows.every(w => w.command_id === 'synthetic-glove-route' && w.state === 'confirmed'))
  assert.equal(writes(h).length, count + rows.length)
  assert.deepEqual(writes(h).slice(count).map(c => c.method), rows.map(w => ({ create: 'POST', update: 'PATCH', delete: 'DELETE' })[w.action]))
  await b.dispatcher.run('route.accept', payload, { commandId: 'synthetic-glove-route' })
  await h.scheduled(at)
  assert.equal(writes(h).length, count + rows.length)
  assert.deepEqual(await work(h), [...before, ...rows])
})
