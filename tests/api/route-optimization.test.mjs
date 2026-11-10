import test from 'node:test'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { installation, routingDay } from './harness.mjs'
import { drivingSeconds } from '../fixtures/maps.mjs'

const at = '2026-11-03T00:00:00.000Z'
const placement = v => ({ technicianId: v.technicianId, startAt: v.startAt, endAt: v.endAt, local: v.local, ...(v.arrivalWindow ? { arrivalWindow: v.arrivalWindow } : {}) })
const route = async (h, id) => (await h.state()).routes.find(r => r.id === id)
const prepare = async (h, payload, run = h.command) => {
  const queued = await run('route.optimize', payload)
  await h.scheduled(at)
  const ready = await route(h, queued.id)
  assert.equal(ready.status, 'ready', JSON.stringify(ready))
  return ready
}
const point = (s, id) => {
  const visit = s.visits.find(v => v.id === id), job = s.jobs.find(j => j.id === visit.jobId)
  const p = s.sites.find(x => x.id === job.siteId).location
  return { latitude: p.lat, longitude: p.lng }
}
const legs = slots => [...new Set(slots.map(v => v.technicianId))].flatMap(id => {
  const ordered = slots.filter(v => v.technicianId === id).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return ordered.slice(1).map((v, i) => [ordered[i], v])
})
const total = (s, slots, seconds = drivingSeconds) => legs(slots).reduce((n, [a, b]) => n + seconds(point(s, a.id), point(s, b.id)), 0)

function feasible(s, original, proposed, seconds = drivingSeconds) {
  for (const v of proposed) {
    const old = original.find(x => x.id === v.id), tech = s.technicians.find(t => t.id === v.technicianId)
    const job = s.jobs.find(j => j.id === old.jobId), site = s.sites.find(x => x.id === job.siteId)
    assert.equal(Date.parse(v.endAt) - Date.parse(v.startAt), Date.parse(old.endAt) - Date.parse(old.startAt))
    assert.deepEqual(v.arrivalWindow, old.arrivalWindow)
    const local = iso => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: v.local.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map(p => [p.type, p.value]))
    const start = local(v.startAt), end = local(v.endAt)
    assert.equal(`${start.year}-${start.month}-${start.day}`, v.local.date)
    assert.equal(`${start.hour}:${start.minute}`, v.local.start)
    assert.equal(`${end.hour}:${end.minute}`, v.local.end)
    if (v.arrivalWindow) assert.ok(v.local.start >= v.arrivalWindow.start && v.local.start <= v.arrivalWindow.end)
    for (const line of job.lines) for (const skill of s.services.find(x => x.id === line.serviceId)?.requiredSkills ?? []) assert.ok(tech.skills.includes(skill), `${job.title} requires ${skill}`)
    assert.ok(!tech.zips?.length || tech.zips.includes(site.zip), `${job.title} stays in its service area`)
    assert.ok(!tech.timeOff?.some(off => off.from <= v.local.date && v.local.date <= off.to))
    if (tech.hours?.length) {
      const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(`${v.local.date}T00:00:00Z`).getUTCDay()]
      assert.ok(tech.hours.some(x => x.day === weekday && x.start <= v.local.start && x.end >= v.local.end))
    }
  }
  for (const [a, b] of legs(proposed)) assert.ok(Date.parse(a.endAt) + seconds(point(s, a.id), point(s, b.id)) * 1000 <= Date.parse(b.startAt), 'consecutive appointments allow the independently computed drive and never overlap')
}

test('DISP-003 points 1, 6 and 8: a twelve-visit proposal saves only consecutive driving and survives replay and Worker restart without moving visits', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, visits, day } = await routingDay(h)
  for (const [i, v] of visits.entries()) {
    const minute = 20 + i
    visits[i] = await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, end: `${v.local.start.slice(0, 3)}${String(minute).padStart(2, '0')}`, reason: 'Keep each service duration distinct' })
  }
  const before = await h.state()
  const commandId = 'synthetic-glove-route-retained', payload = { date: day }
  const queued = await b.dispatcher.run('route.optimize', payload, { commandId })
  assert.deepEqual((await h.state()).visits, before.visits)
  await h.restart()
  assert.equal((await route(h, queued.id)).status, 'queued')
  await h.scheduled(at)
  const ready = await route(h, queued.id)
  assert.equal(ready.status, 'ready')
  assert.deepEqual(ready.moves.map(m => m.visitId).sort(), visits.map(v => v.id).sort())
  for (const move of ready.moves) assert.deepEqual(move.before, placement(visits.find(v => v.id === move.visitId)))
  const proposed = ready.moves.map(m => ({ id: m.visitId, ...m.after }))
  feasible(before, visits, proposed)
  assert.equal(legs(visits).length, 9)
  assert.equal(legs(proposed).length, 9)
  assert.equal(ready.beforeSeconds, total(before, visits))
  assert.equal(ready.afterSeconds, total(before, proposed))
  assert.ok(ready.afterSeconds < ready.beforeSeconds)
  assert.equal(ready.savedSeconds, total(before, visits) - total(before, proposed))
  t.diagnostic(JSON.stringify({ beforeSeconds: ready.beforeSeconds, afterSeconds: ready.afterSeconds, savedSeconds: ready.savedSeconds, evaluations: ready.evaluations }))
  assert.match(ready.method, /global optimum not guaranteed/i)
  assert.match(ready.method, /no depot legs/i)
  for (let pass = 0; pass < 2; pass++) await h.scheduled(at)
  await h.restart()
  assert.deepEqual(await b.dispatcher.run('route.optimize', payload, { commandId }), queued)
  await h.scheduled(at)
  assert.deepEqual(await route(h, queued.id), ready)
  assert.equal((await h.state()).routes.length, 1)
  assert.deepEqual((await h.state()).visits, before.visits)
  const accepted = await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Keep the promises with less driving' })
  assert.equal(accepted.status, 'accepted')
  assert.deepEqual((await h.state()).visits.map(v => ({ id: v.id, ...placement(v) })).sort((a, b) => a.id.localeCompare(b.id)), proposed.sort((a, b) => a.id.localeCompare(b.id)))
})

test('DISP-003 point 2: live person authority fences day and technician requests, one cron claim, revocation and expired leases', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, day, visits } = await routingDay(h), before = (await h.state()).visits
  const other = await h.command('branch.save', { name: 'Other routing branch', prefix: 'RT', timezone: 'UTC', zips: ['60602'] })
  const customRole = await h.command('role.save', { name: 'Synthetic route permissions', permissions: ['route.optimize'] })
  const custom = await h.person('Synthetic Route Delegate', `custom:${customRole.id}`)
  const token = await h.command('token.issue', { name: 'Synthetic route token', role: 'dispatcher' })
  for (const actor of [b.office, b.priyaPerson, b.agent, custom]) await actor.run('route.optimize', { date: day }, { error: 'FORBIDDEN' })
  for (const headers of [{}, { authorization: `Bearer ${token.token}` }]) {
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers, body: { commandId: crypto.randomUUID(), type: 'route.optimize', payload: { date: day } } })
    assert.equal(response.status, headers.authorization ? 403 : 401)
  }
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: other.id })
  await b.dispatcher.run('route.optimize', { date: day, branchId: 'main' }, { error: 'FORBIDDEN' })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null })
  for (const date of ['bad-date', '2026-02-30']) await h.command('route.optimize', { date }, { error: 'INPUT' })
  assert.deepEqual((await h.state()).routes, [])
  const outside = await h.command('technician.save', { name: 'Synthetic other branch technician', branchId: other.id })
  await h.command('route.optimize', { date: day, technicianId: outside.id }, { error: 'BRANCH' })
  await h.command('maps.connect', { key: null })
  await h.command('route.optimize', { date: day }, { error: 'MAPS' })
  await h.command('maps.connect', { key: 'synthetic-glove-164' })
  assert.deepEqual((await h.state()).visits, before)
  for (const run of [h.command, b.dispatcher.run]) for (const technicianId of [undefined, b.priya.id]) {
    const queued = await run('route.optimize', { date: day, ...(technicianId ? { technicianId } : {}) })
    assert.equal(queued.status, 'queued')
    assert.equal(queued.technicianId, technicianId ?? null)
    await run('route.optimize', { date: day }, { error: 'ROUTE_RUNNING' })
    await h.scheduled(at)
    const result = await route(h, queued.id)
    assert.equal(result.status, 'ready', JSON.stringify(result))
    assert.equal(result.moves.length, technicianId ? 4 : 12)
    await run('route.discard', { routeId: result.id, version: result.version })
  }
  for (const v of visits.slice(0, 2)) await b.dispatcher.run('visit.book', { jobId: v.jobId, technicianId: v.technicianId, date: '2026-11-10', start: v.local.start, end: v.local.end })
  const retained = (await h.state()).visits
  const a = await b.dispatcher.run('route.optimize', { date: day }), bday = await h.command('route.optimize', { date: '2026-11-10' })
  await h.scheduled(at)
  const statuses = [(await route(h, a.id)).status, (await route(h, bday.id)).status].sort()
  assert.deepEqual(statuses, ['queued', 'ready'])
  await h.scheduled(at)
  assert.equal((await route(h, a.id)).status, 'ready')
  assert.equal((await route(h, bday.id)).status, 'ready')
  for (const stage of ['claim', 'save']) for (const withdrawal of ['role', 'branch']) {
    const queued = await b.dispatcher.run('route.optimize', { date: day })
    const revoke = () => withdrawal === 'role' ? h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' }) : h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: other.id })
    const calls = h.maps.calls.filter(c => c.api === 'routes').length
    if (stage === 'claim') await revoke()
    else h.maps.beforeRoutes = async () => { h.maps.beforeRoutes = null; await revoke() }
    await h.scheduled(at)
    const failed = await route(h, queued.id)
    assert.equal(failed.status, 'failed')
    assert.match(failed.problem, /no longer has dispatch authority/)
    assert.equal(h.maps.calls.filter(c => c.api === 'routes').length - calls, stage === 'claim' ? 0 : 1)
    assert.deepEqual((await h.state()).visits, retained)
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
    await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null })
  }
  const expiring = await b.dispatcher.run('route.optimize', { date: day })
  h.maps.beforeRoutes = async () => {
    h.maps.beforeRoutes = null
    await h.scheduled(Date.parse(at) + 59_999)
    assert.equal((await route(h, expiring.id)).status, 'running')
    await h.scheduled(Date.parse(at) + 60_000)
    assert.equal((await route(h, expiring.id)).status, 'failed')
  }
  await h.scheduled(at)
  assert.match((await route(h, expiring.id)).problem, /expired/)
  assert.deepEqual((await h.state()).visits, retained)
  assert.deepEqual(retained.filter(v => v.local.date === day), before)
})

async function boundedDay(h, count, technicians, date, offset = 0) {
  const customer = (await h.state()).customers[0] ?? await h.command('customer.save', { name: 'Synthetic route customer' })
  const visits = []
  for (let i = 0; i < count; i++) {
    const address = `${offset + i + 1} Synthetic Routing St, Chicago IL 60601`
    h.maps.places.set(address, { lat: 41.8 + (offset + i) * 0.0001, lng: -87.63 })
    const site = await h.command('site.save', { customerId: customer.id, address })
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: `Synthetic route ${i + 1}` })
    const minute = 8 * 60 + Math.floor(i / technicians.length) * 30
    const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    visits.push(await h.command('visit.book', { jobId: job.id, technicianId: technicians[i % technicians.length].id, date, start: clock(minute), end: clock(minute + 5) }))
  }
  return visits
}

async function boundedInstallation(t) {
  const h = await installation({ at }); t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic route bounds', timezone: 'UTC' })
  await h.command('maps.connect', { key: 'synthetic-glove-164' })
  return h
}

test('DISP-003 point 3: visit and assigned-technician limits accept their endpoints and refuse excess without queuing or moving work', async t => {
  const h = await boundedInstallation(t), techs = []
  for (let i = 0; i < 9; i++) techs.push(await h.command('technician.save', { name: `Synthetic technician ${i + 1}` }))
  for (const [count, assigned, date, allowed] of [[1, 1, '2026-11-03', false], [2, 1, '2026-11-04', true], [20, 8, '2026-11-05', true], [21, 8, '2026-11-06', false], [9, 9, '2026-11-07', false]]) {
    await boundedDay(h, count, techs.slice(0, assigned), date)
    const before = await h.state()
    if (allowed) {
      const ready = await prepare(h, { date })
      assert.equal(ready.moves.length, count)
      assert.equal(new Set(ready.moves.map(m => m.before.technicianId)).size, assigned)
    } else {
      await h.command('route.optimize', { date }, { error: 'ROUTE_LIMIT' })
      assert.deepEqual((await h.state()).routes, before.routes)
    }
    assert.deepEqual((await h.state()).visits, before.visits)
  }
})

test('DISP-003 point 4: coordinate-only Routes requests abort a delayed provider and retain a bounded exchange count', async t => {
  const h = await boundedInstallation(t), techs = []
  techs.push(await h.command('technician.save', { name: 'Synthetic bounded technician' }))
  const booked = await boundedDay(h, 20, techs, '2026-11-03')
  // Keep the provider scenario independent of randomly assigned record IDs.
  // Move through real desk commands into ID order, using a separate day while
  // exchanging occupied positions so no overlap is silently acknowledged.
  const orderedVisits = [...booked].sort((a, b) => a.id.localeCompare(b.id)), moved = []
  for (const v of orderedVisits) moved.push(await h.command('visit.change', { visitId: v.id, version: v.version, date: '2026-11-04', reason: 'Prepare the synthetic provider scenario' }))
  for (const [i, v] of moved.entries()) await h.command('visit.change', { visitId: v.id, version: v.version, date: '2026-11-03', start: booked[i].local.start, end: booked[i].local.end, reason: 'Keep the synthetic provider order repeatable' })
  const before = await h.state(), visits = before.visits
  // Directed non-geometric provider times make several improving passes
  // useful, while every possible drive still fits the booked half-hour gap.
  const values = new Map()
  let seed = 298
  const ordered = [...visits].sort((a, b) => a.id.localeCompare(b.id))
  for (const a of ordered) for (const b of ordered) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    values.set(JSON.stringify([point(before, a.id), point(before, b.id)]), 30 + seed % 600)
  }
  h.maps.routeSeconds = (from, to) => values.get(JSON.stringify([from, to]))
  const began = performance.now(), ready = await prepare(h, { date: '2026-11-03' })
  assert.ok(ready.evaluations > 0 && ready.evaluations <= 1200, `saved ${ready.evaluations} evaluations`)
  const searchElapsedMs = performance.now() - began
  assert.ok(searchElapsedMs < 20_000, 'the bounded search finishes within its runtime budget')
  t.diagnostic(JSON.stringify({ evaluations: ready.evaluations, searchElapsedMs }))
  h.maps.routeDelayMs = 12_000
  const queued = await h.command('route.optimize', { date: '2026-11-03' })
  const start = performance.now()
  await h.scheduled(at)
  const elapsed = performance.now() - start
  const failed = await route(h, queued.id)
  assert.equal(failed.status, 'failed', JSON.stringify(failed))
  assert.match(failed.problem, /could not be reached/)
  assert.ok(elapsed >= 9_500 && elapsed < 12_000, `the ten-second abort stopped the delayed answer after ${elapsed.toFixed(0)} ms`)
  t.diagnostic(JSON.stringify({ providerDelayMs: h.maps.routeDelayMs, providerAbortMs: elapsed }))
  assert.deepEqual((await h.state()).visits, before.visits)
  assert.ok(h.maps.calls.some(c => c.api === 'routes'))
  for (const call of h.maps.calls.filter(c => c.api === 'routes')) {
    assert.deepEqual(Object.keys(call.body).sort(), ['destinations', 'origins', 'routingPreference', 'travelMode'])
    assert.equal(call.body.travelMode, 'DRIVE')
    assert.equal(call.body.routingPreference, 'TRAFFIC_UNAWARE')
    const coordinates = visits.map(v => point(before, v.id))
    for (const waypoint of [...call.body.origins, ...call.body.destinations]) {
      assert.ok(coordinates.some(p => JSON.stringify(waypoint) === JSON.stringify({ waypoint: { location: { latLng: p } } })), 'every waypoint contains only registered coordinates')
    }
  }
})

test('DISP-003 point 5: whole proposed schedules preserve eligibility, duration and fixed crew and field-evidence placements', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, day, visits, technicians } = await routingDay(h)
  await b.priyaPerson.run('visit.arrive', { visitId: visits[0].id, deviceTime: visits[0].startAt })
  await b.priyaPerson.run('visit.capture', { visitId: visits[1].id, deviceTime: visits[1].startAt, kind: 'note', text: 'Synthetic captured findings' })
  const late = visits[2]
  await b.dispatcher.run('visit.change', { visitId: late.id, version: late.version, technicianId: technicians[2].id, date: day, start: '12:45', end: '13:15', reason: 'Synthetic handover while offline' })
  await b.priyaPerson.run('visit.capture', { visitId: late.id, deviceTime: late.startAt, kind: 'note', text: 'Synthetic late offline evidence' })
  const crew = await h.command('crew.save', { name: 'Synthetic routing crew', memberIds: [b.priya.id, b.tom.id] })
  const group = await b.dispatcher.run('visit.book', { jobId: visits[3].jobId, crewId: crew.id, date: day, start: '16:00', end: '16:45', window: { start: '16:00', end: '17:00' } })
  const before = await h.state(), fixed = before.visits.filter(v => v.crew || v.arrival || before.captures.some(c => c.visitId === v.id) || v.lateEvidence.length)
  assert.equal(fixed.length, 5)
  assert.ok(before.visits.find(v => v.id === late.id).lateEvidence.length)
  assert.equal(group.visits.length, 2)
  for (const member of group.visits) assert.ok(before.visits.find(v => v.id === member.id).crew)
  const ready = await prepare(h, { date: day }, b.dispatcher.run)
  const proposed = ready.moves.map(m => ({ id: m.visitId, ...m.after }))
  feasible(before, before.visits, proposed)
  for (const visit of fixed) assert.deepEqual(ready.moves.find(m => m.visitId === visit.id).after, placement(visit))
  assert.deepEqual((await h.state()).visits, before.visits)
  // Changes to eligibility remain ordinary person decisions. A now invalid
  // whole schedule is failed visibly instead of returning a partial solution.
  for (const change of [{ skills: [] }, { timeOff: [{ from: day, to: day, reason: 'Synthetic leave' }] }, { zips: ['60602'] }, { hours: [{ day: 'tue', start: '17:00', end: '18:00' }] }]) {
    const original = (await h.state()).technicians.find(t => t.id === b.tom.id)
    await h.command('technician.save', { ...original, ...change })
    const queued = await b.dispatcher.run('route.optimize', { date: day })
    await h.scheduled(at)
    assert.equal((await route(h, queued.id)).status, 'failed')
    assert.deepEqual((await h.state()).visits, before.visits)
    await h.command('technician.save', { ...original, version: original.version + 1 })
  }
  // The only cheaper ordering has a drive that cannot fit the appointment
  // gap. It must stay a comparison of the original feasible schedule.
  const technician = await h.command('technician.save', { name: 'Synthetic short-gap technician' })
  const shortDay = '2026-11-04'
  const booked = await boundedDay(h, 3, [technician], shortDay, 30)
  const varied = []
  for (const [i, v] of booked.entries()) varied.push(await h.command('visit.change', { visitId: v.id, version: v.version, end: ['08:10', '08:45', '09:05'][i], reason: 'Retain different service durations' }))
  const snapshot = await h.state(), [a, bVisit, c] = varied
  const times = new Map([
    [JSON.stringify([point(snapshot, a.id), point(snapshot, bVisit.id)]), 1100],
    [JSON.stringify([point(snapshot, bVisit.id), point(snapshot, c.id)]), 800],
    [JSON.stringify([point(snapshot, a.id), point(snapshot, c.id)]), 1300],
    [JSON.stringify([point(snapshot, c.id), point(snapshot, bVisit.id)]), 1],
  ])
  h.maps.routeSeconds = (from, to) => times.get(JSON.stringify([from, to])) ?? null
  const guarded = await prepare(h, { date: shortDay })
  assert.equal(guarded.beforeSeconds, 1900)
  assert.equal(guarded.afterSeconds, 1900, 'a lower total cannot excuse an impossible individual drive')
  assert.equal(guarded.savedSeconds, 0)
  assert.ok(guarded.evaluations > 0)
  const slots = guarded.moves.map(m => ({ id: m.visitId, ...m.after }))
  feasible(snapshot, varied, slots, h.maps.routeSeconds)
  for (const v of varied) assert.deepEqual(guarded.moves.find(m => m.visitId === v.id).after, placement(v))
  assert.deepEqual((await h.state()).visits, snapshot.visits)
})
