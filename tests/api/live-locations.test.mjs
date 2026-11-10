import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, liveLocationFixture, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

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

// DISP-012: the owner's delay watch adds each late technician's position and Routes ETA. Each step owns an installation.
const phoneAt = { lat: 41.89071, lng: -87.63071 }, samsaraAt = { lat: 41.89172, lng: -87.63172 }, wacker = { lat: 41.8789, lng: -87.6359 }
const secretsOf = ['41.89071', '-87.63071', '41.89172', '-87.63172', fleetKey]
async function lateInstallation(step) {
  const h = await installation({ at: '2026-11-09T08:00:00.000Z', captureLogs: true })
  step.after(() => h.close())
  const f = { h, ...await liveLocationFixture(h) }
  // Routes drive seconds follow the fix, so each ETA is told apart: 25 min from the phone fix, 31 from the Samsara fix.
  h.maps.routeSeconds = from => from.latitude === phoneAt.lat ? 1500 : 1801
  return { h, f, b: f.b }
}
/** Each rider consents, clocks in and runs a job timer on a visit booked 08:00 to 09:00; then the clock reaches the late instant. */
async function runLate(f, riders, minutes = 100) {
  for (const [person, visit] of riders) {
    await person.run('location.consent', { enabled: true })
    await person.run('clock.in', { deviceTime: f.now() })
    await person.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: f.now() })
  }
  await f.tick(minutes * 60_000)
}
const nextOf = async (h, tech, start = '10:00') => (await h.state()).visits.find(v => v.technicianId === tech.id && v.local.start === start && v.status === 'booked')
const watchOf = async (h, at, as = h.owner(), headers = {}) => {
  const response = await h.request(`/api/glove/delays?at=${at}`, { as, headers })
  assert.equal(response.status, 200, await response.clone().text())
  return (await response.json()).risks
}
const routesOf = h => h.maps.calls.filter(c => c.api === 'routes')
const stripped = risks => risks.map(r => ({ ...r, reasons: r.reasons.slice(0, -1), options: r.options.map(o => ({ ...o, note: o.note.split(' Delayed technician:')[0] })) }))
const requestFor = (from, to) => ({ origins: [{ waypoint: { location: { latLng: { latitude: from.lat, longitude: from.lng } } } }], destinations: [{ waypoint: { location: { latLng: { latitude: to.lat, longitude: to.lng } } } }], travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE' })

test('DISP-005 point 1: phone and fleet fixes reach the owner board with next-stop ETAs and clock-out stops both sources after Worker restart', async t => {
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

  await scenario(t, 'DISP-012 point 1: a running job timer past its booked end adds the phone or Samsara position and exact Routes ETA to the risk reasons and each option note', async step => {
    const { h, f, b } = await lateInstallation(step)
    await runLate(f, [[b.priyaPerson, f.visits[0]], [b.tomPerson, f.visits[1]]])
    await connect(f)
    await b.priyaPerson.run('location.phone', f.point())
    await h.command('location.fleetRead', { technicianId: b.tom.id })
    const at = new Date(Date.parse(f.now()) + 30_000).toISOString()
    const risks = await watchOf(h, at)
    for (const [tech, source, point, minutes] of [[b.priya, 'phone', phoneAt, 25], [b.tom, 'Samsara', samsaraAt, 31]]) {
      const next = await nextOf(h, tech), risk = risks.find(r => r.visitId === next.id)
      assert.ok(risk, `${tech.name} next visit is at risk`)
      const where = `${source} position ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}; ETA ${minutes} min drive`
      assert.match(risk.reasons[0], /is still on .* min past its booked end; expected free about/)
      assert.equal(risk.reasons.at(-1), where)
      assert.ok(risk.options.length > 0)
      for (const o of risk.options) assert.ok(o.note.includes(`Delayed technician: ${where}.`), o.note)
    }
  })

  await scenario(t, 'DISP-012 point 2: positions go to the unscoped Owner and a branch-limited Owner for their branch only, through one traffic-unaware driving request per ETA', async step => {
    const { h, f, b } = await lateInstallation(step)
    const north = await h.command('branch.save', { name: 'North branch', prefix: 'NTH', timezone: 'UTC', zips: [] })
    const noraPerson = await h.person('Nora North', 'technician')
    const nora = await h.command('technician.save', { name: 'Nora N.', operatorId: noraPerson.id, branchId: north.id })
    const northAt = { lat: 41.9, lng: -87.7 }, northSite = { lat: 41.95, lng: -87.65 }
    h.maps.places.set('900 North Ave, Chicago, IL 60642', northSite)
    const customer = await h.command('customer.save', { name: 'North customer', branchId: north.id })
    const site = await h.command('site.save', { customerId: customer.id, address: '900 North Ave, Chicago, IL 60642', branchId: north.id })
    const job = await b.dispatcher.run('job.create', { customerId: customer.id, siteId: site.id, title: 'North late service' })
    const first = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: nora.id, date: '2026-11-09', start: '08:00', end: '09:00' })
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: nora.id, date: '2026-11-09', start: '10:00', end: '11:00' })
    await runLate(f, [[b.priyaPerson, f.visits[0]], [b.tomPerson, f.visits[1]], [noraPerson, first]])
    await connect(f)
    await b.priyaPerson.run('location.phone', f.point())
    await noraPerson.run('location.phone', { ...northAt, observedAt: f.now() })
    await h.command('location.fleetRead', { technicianId: b.tom.id })
    const at = new Date(Date.parse(f.now()) + 30_000).toISOString()
    const customRole = await h.command('role.save', { name: 'Watch helper', permissions: ['customer.save'] })
    const custom = await h.person('Synthetic Watch Custom', `custom:${customRole.id}`)
    const token = await h.command('token.issue', { name: 'Synthetic watch token', role: 'dispatcher' })
    const mainOwner = await h.person('Synthetic Main Owner', 'owner'), northOwner = await h.person('Synthetic North Owner', 'owner')
    await h.command('branch.limit', { operatorId: mainOwner.id, branchId: 'main' })
    await h.command('branch.limit', { operatorId: northOwner.id, branchId: north.id })

    const mark = routesOf(h).length
    const all = await watchOf(h, at)
    const requests = routesOf(h).slice(mark)
    assert.equal(all.length, 3)
    const eta = new Map([[b.priya.id, [phoneAt, wacker]], [b.tom.id, [samsaraAt, wacker]], [nora.id, [northAt, northSite]]])
    assert.equal(requests.length, eta.size, 'one Routes request per ETA')
    for (const [, [from, to]] of eta) {
      const call = requests.find(r => r.body.origins[0].waypoint.location.latLng.latitude === from.lat)
      assert.deepEqual(call.body, requestFor(from, to))
      assert.equal(call.key, 'synthetic-glove-701')
    }
    for (const risk of all) assert.match(risk.reasons.at(-1), /position -?\d+\.\d{5}, -?\d+\.\d{5}; ETA \d+ min drive$/)
    const sees = async (as, headers) => (await watchOf(h, at, as, headers)).map(r => [r.technicianId, /position \S+ \S+; ETA \d+ min drive$/.test(r.reasons.at(-1))])
    const calls = routesOf(h).length
    assert.deepEqual(await sees(mainOwner.cookie), [[b.priya.id, true], [b.tom.id, true]].sort((x, y) => all.findIndex(r => r.technicianId === x[0]) - all.findIndex(r => r.technicianId === y[0])))
    assert.deepEqual(await sees(northOwner.cookie), [[nora.id, true]])
    assert.equal(routesOf(h).length, calls + 3, 'a branch-limited Owner prompts a request only for their own branch technicians')
    const before = routesOf(h).length
    for (const [as, headers] of [[b.office.cookie, {}], [b.dispatcher.cookie, {}], [b.agent.cookie, {}], [custom.cookie, {}], ['', { authorization: `Bearer ${token.token}` }]]) {
      const risks = await watchOf(h, at, as, headers)
      assert.deepEqual(risks, stripped(all), 'the same risks, reasons and options without the position')
      assert.doesNotMatch(JSON.stringify(risks), /position|-?\d+\.\d{4,}|Delayed technician|Samsara|phone/)
    }
    assert.equal(routesOf(h).length, before, 'readers below Owner make no Routes request')
    for (const as of [b.tomPerson.cookie, (await h.person('Synthetic Sub', 'subcontractor')).cookie]) assert.equal((await h.request(`/api/glove/delays?at=${at}`, { as })).status, 403)
    await h.command('maps.connect', { key: null })
    const disconnected = routesOf(h).length
    const none = await watchOf(h, at)
    assert.equal(routesOf(h).length, disconnected, 'with Maps disconnected no Routes request is made')
    assert.match(none.find(r => r.technicianId === b.priya.id).reasons.at(-1), /^phone position 41\.89071, -87\.63071; ETA unavailable$/)
  })

  await scenario(t, 'DISP-012 point 3: overrun, the 15-minute floor, expected-free time, options and customer labels are identical with positions on and off', async step => {
    const { h, f, b } = await lateInstallation(step)
    const early = await b.dispatcher.run('visit.book', { jobId: f.job.id, technicianId: b.priya.id, date: '2026-11-09', start: '09:00', end: '09:30' })
    await runLate(f, [[b.priyaPerson, f.visits[0]]], 65)
    await b.priyaPerson.run('location.phone', f.point())
    const at = new Date(Date.parse(f.now()) + 30_000).toISOString()
    const on = await watchOf(h, at)
    assert.deepEqual(on.map(r => r.visitId), [early.id], 'only the visit starting inside the floor is at risk')
    assert.match(on[0].reasons[0], /6 min past its booked end; expected free about 09:20\./)
    assert.deepEqual(on[0].options.map(o => o.customer).sort(), ['customer not yet asked', 'unchanged'])
    assert.ok(on[0].options.some(o => o.technicianId === b.tom.id && o.start === '09:00' && o.customer === 'unchanged'))
    assert.match(on[0].reasons.at(-1), /^phone position 41\.89071, -87\.63071; ETA 25 min drive$/)
    const off = await Promise.all([watchOf(h, at, b.office.cookie), watchOf(h, at, b.dispatcher.cookie)])
    for (const risks of off) assert.deepEqual(risks, stripped(on))
    const calls = routesOf(h).length
    await b.priyaPerson.run('location.consent', { enabled: false })
    const withdrawn = await watchOf(h, at)
    assert.deepEqual(stripped(withdrawn), stripped(on), 'sharing off changes nothing but the appended position')
    assert.equal(withdrawn[0].reasons.at(-1), 'Location and ETA unavailable')
    assert.equal(routesOf(h).length, calls)
  })

  await scenario(t, 'DISP-012 point 4: a stale or future fix, a missing next visit, an unplaced site, no route and a Routes error each give no ETA', async step => {
    const { h, f, b } = await lateInstallation(step)
    const tomNext = await nextOf(h, b.tom)
    await b.dispatcher.run('visit.cancel', { visitId: tomNext.id, version: tomNext.version, reason: 'Make Tom an alternative' })
    await runLate(f, [[b.priyaPerson, f.visits[0]], [b.tomPerson, f.visits[1]]])
    await connect(f)
    await b.priyaPerson.run('location.phone', f.point())
    await h.command('location.fleetRead', { technicianId: b.tom.id })
    const fixed = Date.parse(f.now()), clock = f.now()
    const last = async (at, who = b.priya) => {
      const risk = (await watchOf(h, new Date(at).toISOString())).find(r => r.technicianId === who.id)
      return [risk.reasons.at(-1), risk.options.map(o => o.note)]
    }
    for (const at of [fixed + 120_000, fixed - 10_000]) assert.match((await last(at))[0], /^phone position 41\.89071, -87\.63071; ETA 25 min drive$/, 'fresh at the edge of the window')
    for (const at of [fixed + 120_001, fixed - 10_001]) {
      const mark = routesOf(h).length
      const [reason, notes] = await last(at)
      assert.equal(reason, 'Location and ETA unavailable', 'older than two minutes or more than ten seconds ahead of the reading instant')
      assert.ok(notes.every(n => !/position|ETA \d/.test(n.replace(/ETA unavailable/g, ''))))
      assert.equal(routesOf(h).length, mark, 'no Routes request for a fix that is not current')
    }
    assert.equal(f.now(), clock, 'the Worker clock never moved: freshness follows the reading instant')
    const notes = (await last(fixed + 30_000))[1]
    assert.ok(notes.some(n => n.includes('Alternative: Samsara position 41.89172, -87.63172; ETA unavailable.')), 'a technician with no next booked visit gets no ETA')
    const unavailable = /^phone position 41\.89071, -87\.63071; ETA unavailable$/
    h.maps.routeSeconds = () => null
    let mark = routesOf(h).length
    assert.match((await last(fixed + 30_000))[0], unavailable, 'route not found')
    assert.equal(routesOf(h).length, mark + 1)
    h.maps.routeSeconds = undefined
    h.maps.status.routes = 503
    assert.match((await last(fixed + 30_000))[0], unavailable, 'Routes HTTP error')
    delete h.maps.status.routes
    const priyaNext = await nextOf(h, b.priya)
    await b.dispatcher.run('visit.cancel', { visitId: priyaNext.id, version: priyaNext.version, reason: 'Move to an unplaced address' })
    const customer = await h.command('customer.save', { name: 'Unplaced customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '1 Unplaced Road, Nowhere' })
    const job = await b.dispatcher.run('job.create', { customerId: customer.id, siteId: site.id, title: 'Unplaced service' })
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-09', start: '10:00', end: '11:00' })
    mark = routesOf(h).length
    assert.match((await last(fixed + 30_000))[0], unavailable, 'unplaced site')
    assert.equal(routesOf(h).length, mark, 'no request for a site with no coordinates')
  })

  await scenario(t, 'DISP-012 point 5: after Owner reads coordinates and the Samsara key are absent from state, Activity, saved outcomes, export and logs, and results survive Worker restart', async step => {
    const { h, f, b } = await lateInstallation(step)
    await runLate(f, [[b.priyaPerson, f.visits[0]], [b.tomPerson, f.visits[1]]])
    await connect(f)
    await b.priyaPerson.run('location.phone', f.point())
    await h.command('location.fleetRead', { technicianId: b.tom.id })
    const at = new Date(Date.parse(f.now()) + 30_000).toISOString()
    const before = await watchOf(h, at)
    assert.ok(before.length === 2 && before.every(r => /position/.test(r.reasons.at(-1))))
    await watchOf(h, at); await f.board()
    const absent = async label => {
      const trail = await assertTrail(h, ['location.consent', 'location.received', 'location.fleetConnected'])
      assert.ok(h.logs.length > 0, 'Worker logs were captured')
      const outputs = [trail, h.logs]
      for (const person of [h.owner(), b.priyaPerson.cookie, b.office.cookie, b.dispatcher.cookie]) outputs.push(await h.state(person))
      for (const table of ['glove_records', 'glove_events', 'glove_commands']) outputs.push((await h.db.prepare(`SELECT * FROM ${table}`).all()).results)
      outputs.push(await (await h.request('/api/glove/export')).text())
      const text = JSON.stringify(outputs)
      for (const value of [...secretsOf, 'synthetic-glove-701']) assert.ok(!text.includes(value), `${label}: ${value} stays out of every stored or logged output`)
    }
    await absent('after reads')
    await h.restart()
    assert.deepEqual(await watchOf(h, at), before, 'the same watch after Worker restart')
    await absent('after restart')
  })
})

test('DISP-005 point 2: a newly linked technician starts with sharing off and no stored or board position', async t => {
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

test('DISP-005 point 3: only the linked technician current built-in session changes consent and every missing work condition stores nothing', async t => {
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

test('DISP-005 point 5: only unscoped owner connects one numeric Samsara vehicle and explicit fixed-host reads refuse missing work or provider answers', async t => {
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

test('DISP-005 point 6: stale, premature, future and withdrawn-authority captures refuse without replacing the current fix', async t => {
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

test('DISP-005 point 7: latest-only storage survives restart, older fixes lose and every expiry or work withdrawal removes transient positions', async t => {
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

test('DISP-005 point 8: attributable consent, fleet and capture history survives restart without coordinates or keys in state, outcomes, logs or business export', async t => {
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
