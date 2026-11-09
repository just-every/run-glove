import { scenario } from '../fixtures/scenario.mjs'
import assert from 'node:assert/strict'
import { installation, liveLocationFixture, assertTrail } from './harness.mjs'

async function fixture(t) {
  const h = await installation({ at: '2026-11-09T08:00:00.000Z', captureLogs: true })
  t.after(() => h.close())
  return { h, ...await liveLocationFixture(h) }
}

const fleetKey = 'synthetic-glove-702'
const vehicle = { technicianId: null, vehicleId: '12345', key: fleetKey }
async function connect(f) {
  await f.h.command('location.fleetConnect', { ...vehicle, technicianId: f.b.tom.id })
  f.h.fleet.data = [{ id: '12345', gps: { time: f.now(), latitude: 41.89172, longitude: -87.63172 } }]
}

export async function liveLocationQualification(t) {
  await scenario(t, 'DISP-005 point 1: phone and fleet fixes reach the owner board with next-stop ETAs and clock-out stops both sources after Worker restart', async t => {
  const f = await fixture(t), { h, b } = f
  await f.start()
  await f.start(b.tomPerson, f.visits[1])
  await connect(f)
  await b.priyaPerson.run('location.phone', f.point())
  await h.command('location.fleetRead', { technicianId: b.tom.id })
  const check = async () => {
    const board = await f.board()
    for (const [id, source, lat, lng] of [[b.priya.id, 'phone', 41.89071, -87.63071], [b.tom.id, 'Samsara', 41.89172, -87.63172]]) {
      const live = board.find(t => t.id === id).live
      assert.deepEqual([live.position.source, live.position.lat, live.position.lng], [source, lat, lng])
      assert.equal(live.eta.seconds, source === 'phone' ? 163 : 169)
      assert.equal(live.eta.arrivalAt, source === 'phone' ? '2026-11-09T08:02:43.000Z' : '2026-11-09T08:02:49.000Z')
      const next = (await h.state()).visits.find(v => v.technicianId === id && v.local.start === '10:00')
      assert.equal(live.eta.visitId, next.id)
    }
  }
  await check()
  await h.restart()
  await check()
  const calls = h.fleet.calls.length
  await b.priyaPerson.run('clock.out', { deviceTime: f.now() })
  await b.tomPerson.run('clock.out', { deviceTime: f.now() })
  await b.priyaPerson.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
  await h.command('location.fleetRead', { technicianId: b.tom.id }, { error: 'LOCATION_STOPPED' })
  assert.equal(h.fleet.calls.length, calls)
  assert.deepEqual(await f.rows(), [])
  assert.ok((await f.board()).every(t => t.live.position === null && t.live.eta === null))
})

  await scenario(t, 'DISP-005 point 2: a newly linked technician starts with sharing off and no stored or board position', async t => {
  const f = await fixture(t)
  for (const person of [f.b.priyaPerson, f.b.tomPerson]) {
    const response = await f.h.request('/api/glove/location', { as: person.cookie })
    assert.deepEqual(await response.json(), { enabled: false, delegates: [] })
    await person.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
  }
  assert.deepEqual(await f.rows(), [])
  assert.ok((await f.board()).every(t => t.live.position === null))
  await f.h.restart()
  assert.equal((await (await f.h.request('/api/glove/location', { as: f.b.priyaPerson.cookie })).json()).enabled, false)
})

  await scenario(t, 'DISP-005 point 3: only the linked technician current built-in session changes consent and every missing work condition stores nothing', async t => {
  const f = await fixture(t), { h, b } = f
  const customRole = await h.command('role.save', { name: 'Location helper', permissions: ['customer.save'] })
  const custom = await h.person('Synthetic Custom', `custom:${customRole.id}`)
  const token = await h.command('token.issue', { name: 'Synthetic location token', role: 'dispatcher' })
  const denied = async (as, headers = {}) => {
    for (const enabled of [true, false]) {
      const before = await h.state(), rows = await f.rows()
      const response = await h.request('/api/glove/commands', { as, method: 'POST', headers, body: { commandId: crypto.randomUUID(), type: 'location.consent', payload: { technicianId: b.priya.id, enabled } } })
      assert.equal(response.status, 403)
      assert.equal((await response.json()).error.code, 'FORBIDDEN')
      assert.deepEqual((await h.state()).technicians, before.technicians)
      assert.deepEqual(await f.rows(), rows)
    }
  }
  await b.priyaPerson.run('location.consent', { enabled: true })
  for (const as of [b.tomPerson.cookie, h.owner(), b.office.cookie, b.dispatcher.cookie, b.agent.cookie, custom.cookie]) await denied(as)
  await denied('', { authorization: `Bearer ${token.token}` })
  for (const phase of ['no shift', 'no timer', 'no consent', 'wrong visit']) {
    if (phase === 'no timer') await b.priyaPerson.run('clock.in', { deviceTime: f.now() })
    if (phase === 'no consent') {
      await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'job', deviceTime: f.now() })
      await b.priyaPerson.run('location.consent', { enabled: false })
    }
    if (phase === 'wrong visit') {
      await b.priyaPerson.run('location.consent', { enabled: true })
      await b.priyaPerson.run('timer.start', { visitId: f.visits[1].id, kind: 'job', deviceTime: f.now() }, { error: 'FORBIDDEN' })
      await b.priyaPerson.run('timer.stop', { visitId: f.visits[0].id, deviceTime: f.now() })
    }
    await b.priyaPerson.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
    assert.deepEqual(await f.rows(), [], phase)
  }
  await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'job', deviceTime: f.now() })
  await b.priyaPerson.run('location.phone', f.point())
  assert.equal((await f.rows()).length, 1)
  await b.priyaPerson.run('location.consent', { enabled: false })
  assert.equal((await (await h.request('/api/glove/location', { as: b.priyaPerson.cookie })).json()).enabled, false)
  assert.deepEqual(await f.rows(), [])
})

  await scenario(t, 'DISP-005 point 5: only unscoped owner connects one numeric Samsara vehicle and explicit fixed-host reads refuse missing work or provider answers', async t => {
  const f = await fixture(t), { h, b } = f
  await f.start(b.tomPerson, f.visits[1])
  await connect(f)
  await h.command('location.fleetConnect', { ...vehicle, technicianId: b.tom.id, vehicleId: '67890' })
  assert.equal((await h.db.prepare('SELECT * FROM glove_fleet_credentials').all()).results.length, 1)
  await h.command('location.fleetConnect', { ...vehicle, technicianId: b.tom.id, vehicleId: 'https://elsewhere.example.test' }, { error: 'INPUT' })
  const limited = await h.person('Synthetic Limited', 'owner')
  const branch = await h.command('branch.save', { name: 'Location branch', prefix: 'LOC', timezone: 'UTC', zips: [] })
  await h.command('branch.limit', { operatorId: limited.id, branchId: branch.id })
  const customRole = await h.command('role.save', { name: 'Fleet helper', permissions: ['customer.save'] })
  const custom = await h.person('Synthetic Fleet Custom', `custom:${customRole.id}`)
  const token = await h.command('token.issue', { name: 'Synthetic fleet token', role: 'dispatcher' })
  for (const [as, headers] of [[b.office.cookie, {}], [b.dispatcher.cookie, {}], [limited.cookie, {}], [custom.cookie, {}], ['', { authorization: `Bearer ${token.token}` }]]) {
    const before = (await h.db.prepare('SELECT * FROM glove_fleet_credentials').all()).results
    for (const type of ['location.fleetConnect', 'location.fleetRead']) {
      const r = await h.request('/api/glove/commands', { method: 'POST', as, headers, body: { commandId: crypto.randomUUID(), type, payload: { ...vehicle, technicianId: b.tom.id } } })
      assert.equal(r.status, 403)
    }
    assert.deepEqual((await h.db.prepare('SELECT * FROM glove_fleet_credentials').all()).results, before)
  }
  assert.equal(h.fleet.calls.length, 0)
  h.fleet.data = [{ id: '67890', gps: { time: f.now(), latitude: 41.89172, longitude: -87.63172 } }]
  await h.command('location.fleetRead', { technicianId: b.tom.id, url: 'https://elsewhere.example.test' })
  assert.equal((await f.board()).find(t => t.id === b.tom.id).live.position.source, 'Samsara')
  for (const mode of ['http', 'unreachable', 'no GPS']) {
    await b.tomPerson.run('location.consent', { enabled: true })
    h.fleet.status = mode === 'http' ? 503 : 200
    h.fleet.unreachable = mode === 'unreachable'
    if (mode === 'no GPS') h.fleet.data = [{ id: '67890' }]
    const error = await h.command('location.fleetRead', { technicianId: b.tom.id }, { error: 'FLEET' })
    assert.match(error.message, /unavailable|no position/)
    assert.deepEqual(await f.rows(), [])
  }
  h.fleet.status = 200; h.fleet.unreachable = false
  h.fleet.data = [{ id: '67890', gps: { time: f.now(), latitude: 41.89172, longitude: -87.63172 } }]
  h.fleet.beforeReply = async () => { h.fleet.beforeReply = null; await b.tomPerson.run('location.consent', { enabled: false }) }
  await h.command('location.fleetRead', { technicianId: b.tom.id }, { error: 'LOCATION_STOPPED' })
  assert.deepEqual(await f.rows(), [], 'withdrawal fences a provider response already in flight')
  await b.tomPerson.run('location.consent', { enabled: true })
  const calls = h.fleet.calls.length
  await f.board(); await h.state(); await h.restart(); await f.board()
  assert.equal(h.fleet.calls.length, calls, 'board, state and restart never poll fleet')
  for (const call of h.fleet.calls) assert.deepEqual(call, { method: 'GET', url: 'https://api.samsara.com/fleet/vehicles/stats?vehicleIds=67890&types=gps', authorization: `Bearer ${fleetKey}` })
  for (const type of ['timer.stop', 'clock.out', 'location.consent']) {
    if (type === 'clock.out') await b.tomPerson.run('timer.start', { visitId: f.visits[1].id, kind: 'travel', deviceTime: f.now() })
    if (type === 'location.consent') { await b.tomPerson.run('clock.in', { deviceTime: f.now() }); await b.tomPerson.run('timer.start', { visitId: f.visits[1].id, kind: 'job', deviceTime: f.now() }) }
    await b.tomPerson.run(type, type === 'location.consent' ? { enabled: false } : { visitId: f.visits[1].id, deviceTime: f.now() })
    await h.command('location.fleetRead', { technicianId: b.tom.id }, { error: 'LOCATION_STOPPED' })
    assert.equal(h.fleet.calls.length, calls)
  }
})

  await scenario(t, 'DISP-005 point 6: stale, premature, future and withdrawn-authority captures refuse without replacing the current fix', async t => {
  const f = await fixture(t), { h, b } = f
  await b.priyaPerson.run('location.consent', { enabled: true })
  await f.tick(10_000)
  await b.priyaPerson.run('clock.in', { deviceTime: f.now() })
  const shiftStart = f.now()
  await f.tick(10_000)
  await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'job', deviceTime: f.now() })
  const timerStart = f.now()
  await f.tick(10_000)
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('location.phone', f.point())
  for (const observedAt of [new Date(Date.parse(shiftStart) - 1).toISOString(), new Date(Date.parse(timerStart) - 1).toISOString(), timerStart, new Date(Date.parse(f.now()) - 120_001).toISOString(), new Date(Date.parse(f.now()) + 10_001).toISOString()]) {
    const before = await f.rows()
    await b.priyaPerson.run('location.phone', { ...f.point(), observedAt }, { error: 'LOCATION_STALE' })
    assert.deepEqual(await f.rows(), before)
  }
  await b.dispatcher.run('visit.cancel', { visitId: f.visits[1].id, version: f.visits[1].version, reason: 'Make technician available for handoff' })
  let visit = (await h.state()).visits.find(v => v.id === f.visits[0].id)
  visit = await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'Reassigned field work' })
  await b.priyaPerson.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
  assert.deepEqual(await f.rows(), [])
  await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.priya.id, reason: 'Return field work' })
  await b.priyaPerson.run('location.consent', { enabled: false })
  await b.priyaPerson.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('location.phone', f.point())
  const before = await f.rows()
  assert.equal((await h.request('/auth/signout', { method: 'POST', as: b.priyaPerson.cookie, body: {} })).status, 204)
  for (const type of ['location.phone', 'location.consent']) {
    const r = await h.request('/api/glove/commands', { method: 'POST', as: b.priyaPerson.cookie, body: { commandId: crypto.randomUUID(), type, payload: type === 'location.phone' ? f.point() : { enabled: true } } })
    assert.equal(r.status, 401)
  }
  assert.deepEqual(await f.rows(), before)
})

  await scenario(t, 'DISP-005 point 7: latest-only storage survives restart, older fixes lose and every expiry or work withdrawal removes transient positions', async t => {
  const f = await fixture(t), { h, b } = f
  await f.start()
  const commandId = crypto.randomUUID(), old = f.point()
  await b.priyaPerson.run('location.phone', old, { commandId })
  await f.tick()
  const fresh = { ...f.point(), lat: 41.89079 }
  await b.priyaPerson.run('location.phone', fresh)
  await b.priyaPerson.run('location.phone', old)
  let rows = await f.rows()
  assert.equal(rows.length, 1)
  assert.deepEqual([rows[0].lat, rows[0].observed_at], [fresh.lat, fresh.observedAt])
  await h.restart()
  assert.deepEqual(await f.rows(), rows)
  await f.tick(120_001)
  const stale = (await f.board()).find(t => t.id === b.priya.id).live
  assert.deepEqual([stale.position, stale.eta, stale.status], [null, null, 'Location stale'])
  assert.equal((await f.rows()).length, 1, 'reading hides stale coordinates before a product command removes them')
  await h.command('business.save', { ...(await h.state()).business[0] })
  assert.deepEqual(await f.rows(), [])
  await b.dispatcher.run('visit.cancel', { visitId: f.visits[1].id, version: f.visits[1].version, reason: 'Make technician available for handoff' })
  for (const stop of ['timer', 'clock', 'assignment', 'consent']) {
    await b.priyaPerson.run('location.phone', f.point())
    assert.equal((await f.rows()).length, 1)
    if (stop === 'timer') await b.priyaPerson.run('timer.stop', { visitId: f.visits[0].id, deviceTime: f.now() })
    if (stop === 'clock') await b.priyaPerson.run('clock.out', { deviceTime: f.now() })
    if (stop === 'assignment') {
      const visit = (await h.state()).visits.find(v => v.id === f.visits[0].id)
      await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'New assignee' })
    }
    if (stop === 'consent') await b.priyaPerson.run('location.consent', { enabled: false })
    assert.deepEqual(await f.rows(), [], stop)
    await b.priyaPerson.run('location.phone', old, { commandId })
    assert.deepEqual(await f.rows(), [], 'replayed saved outcome cannot resurrect a fix')
    if (stop === 'assignment') {
      const visit = (await h.state()).visits.find(v => v.id === f.visits[0].id)
      await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.priya.id, reason: 'Return assignment' })
    }
    if (stop === 'clock') await b.priyaPerson.run('clock.in', { deviceTime: f.now() })
    if (stop === 'timer' || stop === 'clock') await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'job', deviceTime: f.now() })
  }
})

  await scenario(t, 'DISP-005 point 8: attributable consent, fleet and capture history survives restart without coordinates or keys in state, outcomes, logs or business export', async t => {
  const f = await fixture(t), { h, b } = f
  await f.start()
  await f.start(b.tomPerson, f.visits[1])
  await connect(f)
  await h.command('location.fleetRead', { technicianId: b.tom.id })
  const commandId = crypto.randomUUID()
  const outcome = await b.priyaPerson.run('location.phone', f.point(), { commandId })
  assert.deepEqual(outcome, { accepted: true, source: 'phone' })
  await b.priyaPerson.run('location.consent', { enabled: false })
  await h.restart()
  const trail = await assertTrail(h, ['location.consent', 'location.received', 'location.fleetConnected'])
  const events = trail.activity.filter(e => ['location.consent', 'location.received', 'location.fleetConnected'].includes(e.kind))
  assert.ok(events.some(e => /consented to on-clock location sharing/.test(e.summary)))
  assert.ok(events.some(e => /stopped location sharing/.test(e.summary)))
  for (const e of events) {
    const tom = e.subjectId === b.tom.id
    assert.ok([b.priya.id, b.tom.id].includes(e.subjectId))
    assert.equal(e.actorId, e.kind === 'location.fleetConnected' || (e.kind === 'location.received' && tom) ? (await h.state()).actor.id : tom ? b.tomPerson.id : b.priyaPerson.id)
    assert.equal(e.at, f.now())
    assert.ok(trail.exported.timeline.some(x => x.id === e.id))
  }
  const outputs = [trail, outcome, h.logs]
  for (const person of [h.owner(), b.priyaPerson.cookie, b.office.cookie]) outputs.push(await h.state(person))
  for (const table of ['glove_records', 'glove_events', 'glove_commands']) outputs.push((await h.db.prepare(`SELECT * FROM ${table}`).all()).results)
  for (const value of [fleetKey, '41.89071', '-87.63071', '41.89172', '-87.63172']) assert.ok(!JSON.stringify(outputs).includes(value), `private location material absent: ${value}`)
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('location.phone', f.point())
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.deepEqual(await f.rows(), [])
  assert.deepEqual(await b.priyaPerson.run('location.phone', f.point(), { commandId }), outcome)
  assert.deepEqual(await f.rows(), [])
})
}
