import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, mapBoardFixture, assertTrail } from './harness.mjs'

const at = '2026-11-09T23:30:00.000Z'
const triangle = [{ lat: 41.7, lng: -87.7 }, { lat: 41.9, lng: -87.7 }, { lat: 41.8, lng: -87.5 }]
const currentTech = async (h, id) => (await h.state()).technicians.find(t => t.id === id)
const noSecret = (value, key) => assert.ok(!JSON.stringify(value).includes(key), 'installation key never enters retained or visible data')

test('DISP-002 day map orders five stops and exact legs, restricts desk reads and sends minimal provider data after restart', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await mapBoardFixture(h)
  const branch = await h.command('branch.save', { name: 'Other map branch', prefix: 'OTH', timezone: 'America/Chicago', zips: [] })
  const other = await h.command('technician.save', { name: 'Other technician', branchId: branch.id })
  const scoped = await h.person('Limited Map Desk', 'dispatcher')
  await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
  const sub = await h.person('Map Subcontractor', 'subcontractor')
  h.maps.calls.length = 0
  const check = async () => {
    const response = await h.request(`/api/glove/map?date=${f.day}`, { as: f.dispatcher.cookie })
    assert.equal(response.status, 200)
    const board = await response.json()
    assert.equal(board.date, f.day)
    const [a, b] = f.technicians.map(t => board.technicians.find(x => x.id === t.id))
    assert.deepEqual(a.stops.map(s => s.visitId), f.visits.slice(0, 3).map(v => v.id))
    assert.deepEqual(b.stops.map(s => s.visitId), f.visits.slice(3).map(v => v.id))
    assert.deepEqual(a.legs, [{ from: f.visits[0].id, to: f.visits[1].id, seconds: 420, meters: 1609 }, { from: f.visits[1].id, to: f.visits[2].id, seconds: 660, meters: 4828 }])
    assert.deepEqual(b.legs, [{ from: f.visits[3].id, to: f.visits[4].id, seconds: 960, meters: 8047 }])
    const image = await h.request(`/api/glove/map.png?date=${f.day}`)
    assert.equal(image.status, 200)
    assert.equal(image.headers.get('content-type'), 'image/png')
    assert.ok((await image.arrayBuffer()).byteLength > 100)
    const limited = await (await h.request(`/api/glove/map?date=${f.day}`, { as: scoped.cookie })).json()
    assert.ok(limited.technicians.length > 0)
    assert.ok(!limited.technicians.some(t => t.id === other.id))
    assert.deepEqual((await (await h.request(`/api/glove/map?date=${f.day}&branch=${branch.id}`, { as: scoped.cookie })).json()).technicians, [])
    for (const as of [f.people[0].cookie, sub.cookie, '']) for (const door of ['map', 'map.png']) assert.equal((await h.request(`/api/glove/${door}?date=${f.day}`, { as })).status, as ? 403 : 401)
    const routes = h.maps.calls.filter(c => c.api === 'routes')
    assert.ok(routes.length)
    const waypoint = site => ({ waypoint: { location: { latLng: { latitude: site.location.lat, longitude: site.location.lng } } } })
    for (const call of routes) assert.deepEqual(call.body, { origins: [f.sites[0], f.sites[1], f.sites[3]].map(waypoint), destinations: [f.sites[1], f.sites[2], f.sites[4]].map(waypoint), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE' })
    const images = h.maps.calls.filter(c => c.api === 'staticmap')
    assert.ok(images.length)
    for (const call of images) assert.deepEqual(call.query, { center: `${board.view.center.lat},${board.view.center.lng}`, zoom: String(board.view.zoom), size: `${board.view.width}x${board.view.height}`, scale: '2', maptype: 'roadmap' })
  }
  await check()
  await h.restart()
  await check()
})

test('DISP-002 Maps key custody allows only the current unscoped signed-in Owner and disconnect survives replay', async t => {
  const h = await installation({ at, captureLogs: true })
  t.after(() => h.close())
  const f = await mapBoardFixture(h), key = 'synthetic-glove-174'
  const office = await h.person('Map Office', 'office')
  const customRole = await h.command('role.save', { name: 'Map custom', permissions: ['technician.save', 'export.read'] })
  const custom = await h.person('Map Custom', `custom:${customRole.id}`)
  const limited = await h.person('Limited Map Owner', 'owner')
  await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
  const token = await h.command('token.issue', { name: 'Map integration', role: 'dispatcher' })
  await h.command('maps.connect', { key: null })
  for (const who of [office, f.dispatcher, f.people[0], custom, limited, null]) {
    for (const value of [key, null]) {
      const before = await h.state()
      const response = await h.request('/api/glove/commands', { method: 'POST', as: who?.cookie ?? '', body: { commandId: crypto.randomUUID(), type: 'maps.connect', payload: { key: value } } })
      assert.equal(response.status, who ? 403 : 401)
      assert.equal((await h.db.prepare("SELECT COUNT(*) AS n FROM glove_provider_keys WHERE provider='maps'").first()).n, 0)
      assert.deepEqual(await h.state(), before)
    }
  }
  for (const value of [key, null]) {
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: crypto.randomUUID(), type: 'maps.connect', payload: { key: value } } })
    assert.equal(response.status, 403)
  }
  const connectId = crypto.randomUUID()
  noSecret(await h.command('maps.connect', { key }, { commandId: connectId }), key)
  assert.equal((await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='maps'").first()).value, key)
  for (const as of [h.owner(), office.cookie, f.dispatcher.cookie, f.people[0].cookie]) noSecret(await h.state(as), key)
  for (const door of ['activity', 'export']) noSecret(await (await h.request(`/api/glove/${door}`)).json(), key)
  for (const table of ['glove_commands', 'glove_events', 'glove_records']) noSecret((await h.db.prepare(`SELECT * FROM ${table}`).all()).results, key)
  await h.command('maps.connect', { key: null })
  await h.restart()
  await h.command('maps.connect', { key }, { commandId: connectId })
  assert.equal((await h.db.prepare("SELECT COUNT(*) AS n FROM glove_provider_keys WHERE provider='maps'").first()).n, 0, 'replayed connection metadata cannot resurrect a revoked key')
  h.maps.calls.length = 0
  assert.equal((await (await h.request(`/api/glove/map?date=${f.day}`)).json()).connected, false)
  await f.dispatcher.run('site.locate', { siteIds: [f.sites[0].id] }, { error: 'MAPS' })
  assert.deepEqual(h.maps.calls, [])
  noSecret(h.logs, key)
  await assertTrail(h, ['maps.connected', 'maps.disconnected'])
})

test('DISP-002 site placement sends only the changed street address, saves no-place honestly and retries listed unplaced sites', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await mapBoardFixture(h)
  h.maps.calls.length = 0
  const address = '201 Placement Street, Chicago, IL 60602', changed = '202 Placement Street, Chicago, IL 60603'
  h.maps.places.set(address, { lat: 41.765432, lng: -87.654321 })
  let site = await h.command('site.save', { customerId: f.customer.id, address, contact: 'Private site contact', accessNotes: 'Private gate code' })
  assert.deepEqual([site.location.lat, site.location.lng], [41.765432, -87.654321])
  assert.deepEqual(h.maps.calls.map(({ api, address }) => ({ api, address })), [{ api: 'geocode', address }])
  site = await h.command('site.save', { ...site, accessNotes: 'Changed private gate code' })
  assert.equal(h.maps.calls.length, 1)
  h.maps.places.set(changed, { lat: 41.123456, lng: -87.123456 })
  site = await h.command('site.save', { ...site, address: changed })
  assert.deepEqual([site.location.lat, site.location.lng], [41.123456, -87.123456])
  assert.equal(h.maps.calls.at(-1).address, changed)
  const missingAddress = '203 Unplaced Street, Chicago, IL 60604'
  const unplaced = await h.command('site.save', { customerId: f.customer.id, address: missingAddress })
  assert.equal(unplaced.location, null)
  assert.match(unplaced.locateError, /Google Maps found no place/)
  const before = await h.state()
  h.maps.status.geocode = 'REQUEST_DENIED'
  await h.command('site.save', { ...site, address: '204 Refused Street' }, { error: 'MAPS' })
  await h.command('site.save', { customerId: f.customer.id, address: '205 Refused Street' }, { error: 'MAPS' })
  assert.deepEqual(await h.state(), before)
  delete h.maps.status.geocode
  h.maps.places.set(missingAddress, { lat: 41.333333, lng: -87.444444 })
  const payload = { siteIds: [unplaced.id] }, commandId = crypto.randomUUID()
  const placed = await f.dispatcher.run('site.locate', payload, { commandId })
  assert.deepEqual(placed.results, [{ siteId: unplaced.id, location: { lat: 41.333333, lng: -87.444444 } }])
  const calls = h.maps.calls.length, after = await h.state()
  await h.restart()
  assert.deepEqual(await f.dispatcher.run('site.locate', payload, { commandId }), placed)
  assert.equal(h.maps.calls.length, calls)
  assert.deepEqual(await h.state(), after)
  await assertTrail(h, ['site.located'])
})

test('DISP-002 zone editing accepts boundary polygons and refuses invalid shapes or non-Owner writes unchanged', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await mapBoardFixture(h), tech = f.technicians[0]
  const polygon = n => Array.from({ length: n }, (_, i) => ({ lat: 41.8 + Math.sin(i * 2 * Math.PI / n) * 0.01, lng: -87.6 + Math.cos(i * 2 * Math.PI / n) * 0.01 }))
  const zones = Array.from({ length: 20 }, (_, i) => ({ name: `Service zone ${i + 1}`, points: polygon(i ? 3 : 100) }))
  const payload = { technicianId: tech.id, version: tech.version, zones }, commandId = crypto.randomUUID()
  const saved = await h.command('technician.zones', payload, { commandId })
  assert.deepEqual(saved.zones.map(z => [z.name, z.points.length]), zones.map(z => [z.name, z.points.length]))
  const retained = await currentTech(h, tech.id)
  for (const invalid of [[...zones, zones[0]], [{ name: 'Short', points: polygon(2) }], [{ name: 'Long', points: polygon(101) }], [{ name: 'Malformed', points: [triangle[0], triangle[1], { lat: '41', lng: -87 }] }], [{ name: 'Out of range', points: [triangle[0], triangle[1], { lat: 86, lng: -87 }] }]]) {
    await h.command('technician.zones', { technicianId: tech.id, version: saved.version, zones: invalid }, { error: 'INPUT' })
    assert.deepEqual(await currentTech(h, tech.id), retained)
  }
  for (const who of [f.dispatcher, f.people[0], await h.person('Zone Office', 'office')]) {
    await who.run('technician.zones', { technicianId: tech.id, version: saved.version, zones: [] }, { error: 'FORBIDDEN' })
    assert.deepEqual(await currentTech(h, tech.id), retained)
  }
  await h.restart()
  assert.deepEqual(await h.command('technician.zones', payload, { commandId }), saved)
  assert.deepEqual(await currentTech(h, tech.id), retained)
  await assertTrail(h, ['technician.zones'])
})

test('DISP-002 ZIP codes and drawn zones jointly allow bookings while outside and unplaced sites follow the Owner area rule', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await mapBoardFixture(h), original = f.technicians[0]
  let tech = await h.command('technician.save', { ...original, zips: ['60699'] })
  const zones = [{ name: 'Local triangle', points: triangle }]
  tech = await h.command('technician.zones', { technicianId: tech.id, version: tech.version, zones })
  const cases = [['Inside', '60603', { lat: 41.8, lng: -87.65 }], ['ZIP only', '60699', { lat: 42.1, lng: -87.8 }], ['Outside', '60604', { lat: 42.1, lng: -87.8 }], ['Unplaced', '60605', null]]
  const jobs = []
  for (const [i, [name, zip, location]] of cases.entries()) {
    const address = `${301 + i} Area Street, Chicago, IL ${zip}`
    if (location) h.maps.places.set(address, location)
    const site = await h.command('site.save', { customerId: f.customer.id, address })
    jobs.push(await f.dispatcher.run('job.create', { customerId: f.customer.id, siteId: site.id, title: name }))
  }
  const check = async (date, rule) => {
    await h.command('business.save', { ...(await h.state()).business[0], eligibility: { area: rule } })
    for (const i of [0, 1]) assert.equal((await f.dispatcher.run('visit.book', { jobId: jobs[i].id, technicianId: tech.id, date, start: `${8 + i * 2}:00`.padStart(5, '0'), end: `${9 + i * 2}:00`.padStart(5, '0') })).jobId, jobs[i].id)
    for (const i of [2, 3]) {
      const payload = { jobId: jobs[i].id, technicianId: tech.id, date, start: `${12 + i}:00`, end: `${13 + i}:00` }
      const before = (await h.state()).visits
      const result = await f.dispatcher.run('visit.book', payload, { error: rule === 'warn' ? 'CONFLICT_REVIEW' : 'ELIGIBILITY' })
      const conflicts = rule === 'warn' ? result.details.conflicts : result.details.refused
      assert.deepEqual(conflicts.map(c => c.code), [`area:${i === 2 ? '60604' : '60605'}`])
      if (i === 3) assert.match(conflicts[0].message, /not on the map yet/)
      assert.deepEqual((await h.state()).visits, before)
      if (rule === 'warn') {
        const commandId = crypto.randomUUID(), acknowledged = { ...payload, acknowledge: [conflicts[0].code], reason: 'Reviewed service area' }
        const visit = await f.dispatcher.run('visit.book', acknowledged, { commandId })
        await h.restart()
        assert.deepEqual(await f.dispatcher.run('visit.book', acknowledged, { commandId }), visit)
      }
    }
  }
  await check('2026-11-10', 'warn')
  await h.restart()
  await check('2026-11-11', 'refuse')
  await assertTrail(h, ['technician.zones', 'visit.booked'])
})
