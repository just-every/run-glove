import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, routingDay, assertTrail } from './harness.mjs'
import { drivingSeconds, routeMatrix } from '../fixtures/maps.mjs'

const at = '2026-11-03T00:00:00.000Z'
const placement = v => ({ technicianId: v.technicianId, startAt: v.startAt, endAt: v.endAt, local: v.local, arrivalWindow: v.arrivalWindow })
const effects = async h => {
  const s = await h.state()
  return { visits: s.visits, routes: s.routes, events: s.events.filter(e => ['visit.changed', 'route.accepted'].includes(e.kind)) }
}
const legs = slots => [...new Set(slots.map(v => v.technicianId))].flatMap(id => {
  const ordered = slots.filter(v => v.technicianId === id).sort((a, b) => a.startAt.localeCompare(b.startAt))
  return ordered.slice(1).map((v, i) => [ordered[i].id, v.id])
})


test('DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, visits, day } = await routingDay(h)
  const before = (await h.state()).visits
  for (const person of [b.office, b.agent, b.priyaPerson]) await person.run('route.optimize', { date: day }, { error: 'FORBIDDEN' })
  const queued = await b.dispatcher.run('route.optimize', { date: day })
  assert.equal(queued.status, 'queued')
  assert.deepEqual((await h.state()).visits, before)
  // Exercise the actual background runtime entry, including concurrent claims.
  await Promise.all([h.scheduled(Date.now()), h.scheduled(Date.now())])
  const ready = (await h.state()).routes.find(r => r.id === queued.id)
  assert.equal(ready.status, 'ready', JSON.stringify(ready))
  assert.equal(ready.moves.length, 12)
  assert.ok(ready.afterSeconds < ready.beforeSeconds)
  assert.equal(ready.savedSeconds, ready.beforeSeconds - ready.afterSeconds)
  assert.deepEqual((await h.state()).visits, before, 'even a completed proposal moves no visit')
  const routeCalls = h.maps.calls.filter(c => c.api === 'routes')
  assert.ok(routeCalls.length > 0)
  assert.ok(routeCalls.every(c => !JSON.stringify(c.body).includes('Routing Ave') && !JSON.stringify(c.body).includes(b.customer.name)))
  // Read every proposed placement as the dispatcher's reviewed decision. No
  // production optimization or validation helper computes these expectations.
  assert.deepEqual(ready.moves.map(m => m.visitId).sort(), visits.map(v => v.id).sort())
  const proposed = ready.moves.map(m => ({ id: m.visitId, ...m.after }))
  assert.deepEqual(proposed.map(v => `${v.technicianId}:${v.startAt}`).sort(), visits.map(v => `${v.technicianId}:${v.startAt}`).sort())
  for (const move of ready.moves) assert.deepEqual(move.before, placement(visits.find(v => v.id === move.visitId)))
  const untouched = await effects(h)
  const calls = () => h.maps.calls.filter(c => c.api === 'routes').length
  const beforeMissingReason = calls()
  for (const reason of ['', '   ']) {
    await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason }, { error: 'INPUT' })
    assert.deepEqual(await effects(h), untouched)
  }
  assert.equal(calls(), beforeMissingReason, 'no provider request without a person’s reason')
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version - 1, reason: 'Old inspection' }, { error: 'STALE' })
  assert.deepEqual(await effects(h), untouched)

  // Withdraw authority at the actual network boundary, after inspection and
  // before the command can commit; the complete batch must stay unapplied.
  h.maps.beforeRoutes = async () => {
    h.maps.beforeRoutes = null
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
  }
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role withdrawn during provider check' }, { error: 'AUTH' })
  assert.deepEqual(await effects(h), untouched)
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Role is now viewer' }, { error: 'FORBIDDEN' })
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
  const otherBranch = await h.command('branch.save', { name: 'Other office', prefix: 'OTH', timezone: 'Australia/Sydney', zips: ['60602'] })
  h.maps.beforeRoutes = async () => {
    h.maps.beforeRoutes = null
    await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: otherBranch.id })
  }
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Branch withdrawn during provider check' }, { error: 'AUTH' })
  assert.deepEqual(await effects(h), untouched)
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Now outside branch' }, { error: 'NOT_FOUND' })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null })

  // A fresh answer invalidates an actual proposed leg while the originally
  // booked route remains driveable. A cached comparison must not authorize it.
  const originalLegs = new Set(legs(visits).map(pair => pair.join(':')))
  const newLeg = legs(proposed).find(pair => !originalLegs.has(pair.join(':')))
  assert.ok(newLeg, 'the proposal has a newly proposed drive')
  const stateBeforeAccept = await h.state()
  const pointFor = id => {
    const job = stateBeforeAccept.jobs.find(j => j.id === visits.find(v => v.id === id).jobId)
    const p = stateBeforeAccept.sites.find(s => s.id === job.siteId).location
    return { latitude: p.lat, longitude: p.lng }
  }
  const invalidPair = newLeg.map(pointFor)
  h.maps.routeAnswer = body => routeMatrix(body, (from, to) => JSON.stringify([from, to]) === JSON.stringify(invalidPair) ? null : drivingSeconds(from, to))
  const beforeInvalid = calls()
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Provider no longer offers that drive' }, { error: 'ROUTE_TRAVEL' })
  assert.ok(calls() > beforeInvalid, 'acceptance requested a fresh provider answer')
  assert.deepEqual(await effects(h), untouched)
  h.maps.routeAnswer = null

  // Updated, still feasible driving is saved from the fresh matrix rather
  // than copied from the proposal's earlier comparison.
  h.maps.routeSeconds = (from, to) => drivingSeconds(from, to) + 5
  h.maps.beforeRoutes = async () => assert.deepEqual(await effects(h), untouched, 'no move is visible before the fresh provider reply')
  const expectedSeconds = legs(proposed).reduce((sum, pair) => sum + drivingSeconds(...pair.map(pointFor)) + 5, 0)
  assert.equal(expectedSeconds, ready.afterSeconds + 45)
  const beforeAccepted = calls()
  const beforeVersion = (await h.state()).version
  await b.office.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Less driving' }, { error: 'FORBIDDEN' })
  const accepted = await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Keep customers in their windows with less driving' }, { commandId: 'accept-route-day-0001' })
  assert.equal(accepted.status, 'accepted')
  assert.equal(calls(), beforeAccepted + 1)
  assert.equal(accepted.acceptedSeconds, expectedSeconds)
  assert.equal(accepted.decidedAt, at)
  assert.deepEqual(accepted.decidedBy, { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
  assert.equal(accepted.reason, 'Keep customers in their windows with less driving')
  const state = await h.state(), after = state.visits
  assert.equal(state.version, beforeVersion + 1, 'the route and all visit histories advance in one command commit')
  assert.equal(accepted.version, ready.version + 1)
  h.maps.beforeRoutes = null
  assert.ok(after.some(v => { const old = visits.find(x => x.id === v.id); return old && (old.startAt !== v.startAt || old.technicianId !== v.technicianId) }))
  const changed = []
  for (const visit of after) {
    const old = visits.find(v => v.id === visit.id), next = proposed.find(v => v.id === visit.id)
    const moved = old.technicianId !== next.technicianId || old.startAt !== next.startAt || old.endAt !== next.endAt
    assert.deepEqual(placement(visit), placement(next), `every accepted slot is retained for ${visit.id}`)
    if (moved) changed.push(visit.id)
    assert.deepEqual(visit.assignments, moved ? [...old.assignments, { ...placement(next), by: accepted.decidedBy, at, reason: `Accepted route optimization: ${accepted.reason}`, reviewedConflicts: [], grantId: null }] : old.assignments)
    assert.equal(visit.version, old.version + (moved ? 1 : 0))
  }
  for (const visit of after) {
    const original = visits.find(v => v.id === visit.id), tech = state.technicians.find(t => t.id === visit.technicianId), job = state.jobs.find(j => j.id === visit.jobId), site = state.sites.find(s => s.id === job.siteId)
    assert.deepEqual(visit.arrivalWindow, original.arrivalWindow)
    assert.ok(visit.local.start >= visit.arrivalWindow.start && visit.local.start <= visit.arrivalWindow.end)
    assert.equal(Date.parse(visit.endAt) - Date.parse(visit.startAt), Date.parse(original.endAt) - Date.parse(original.startAt))
    for (const line of job.lines) for (const skill of state.services.find(s => s.id === line.serviceId)?.requiredSkills ?? []) assert.ok(tech.skills.includes(skill))
    assert.ok(tech.zips.includes(site.zip))
    const previous = after.filter(v => v.technicianId === tech.id && v.endAt <= visit.startAt).sort((a, b) => b.endAt.localeCompare(a.endAt))[0]
    if (previous) assert.ok(previous.endAt <= visit.startAt)
  }
  const map = await (await h.request(`/api/glove/map?date=${day}`)).json()
  for (const technician of map.technicians) for (const leg of technician.legs) {
    const from = after.find(v => v.id === leg.from), to = after.find(v => v.id === leg.to)
    assert.ok(Date.parse(from.endAt) + leg.seconds * 1000 <= Date.parse(to.startAt), 'final route leaves real driving time')
  }
  const replay = await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Keep customers in their windows with less driving' }, { commandId: 'accept-route-day-0001' })
  assert.deepEqual(replay, accepted)
  assert.deepEqual((await h.state()).visits, after)
  await b.dispatcher.run('route.accept', { routeId: ready.id, version: accepted.version, reason: 'Already applied' }, { error: 'ROUTE_STATE' })
  const trail = await assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
  const applied = trail.activity.filter(e => e.commandId === 'accept-route-day-0001')
  assert.deepEqual(applied.filter(e => e.kind === 'visit.changed').map(e => e.subjectId).sort(), changed.sort())
  assert.equal(applied.filter(e => e.kind === 'route.accepted').length, 1)
  for (const e of applied) {
    assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at])
    assert.ok(e.summary.includes(accepted.reason))
    const exported = trail.exported.timeline.find(x => x.id === e.id)
    assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.command_id, exported.at], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', 'accept-route-day-0001', at])
    const data = JSON.parse(exported.data)
    if (e.kind === 'visit.changed') {
      const old = visits.find(v => v.id === e.subjectId), next = proposed.find(v => v.id === e.subjectId)
      assert.deepEqual(data.before, { technicianId: old.technicianId, ...old.local })
      assert.deepEqual(data.after, { technicianId: next.technicianId, ...next.local })
    } else {
      assert.deepEqual([...data.visitIds].sort(), changed)
      assert.equal(data.driveSeconds, expectedSeconds)
    }
  }
  const retained = await effects(h), callsBeforeRestart = calls()
  await h.restart()
  assert.deepEqual(await effects(h), retained)
  assert.deepEqual(await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: accepted.reason }, { commandId: 'accept-route-day-0001' }), accepted)
  assert.deepEqual(await effects(h), retained)
  assert.equal(calls(), callsBeforeRestart, 'replay after restart neither applies again nor calls Maps')
  assert.deepEqual((await b.priyaPerson.state()).routes, [])
  await assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
})

test('DISP-003, DISP-011: stale eligibility, discard and a routing-provider refusal never change appointments', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const { b, day } = await routingDay(h)
  let route = await b.dispatcher.run('route.optimize', { date: day })
  await h.scheduled(Date.now())
  route = (await h.state()).routes.find(r => r.id === route.id)
  const tech = (await h.state()).technicians.find(t => t.id === b.tom.id)
  const original = await effects(h)
  h.maps.beforeRoutes = async () => {
    h.maps.beforeRoutes = null
    await h.command('technician.save', { id: tech.id, version: tech.version, name: tech.name, operatorId: tech.operatorId, timeOff: [{ from: day, to: day, reason: 'Away' }] })
  }
  await b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Eligibility changed during provider check' }, { error: 'ROUTE_STALE' })
  assert.deepEqual(await effects(h), original, 'a changed dependency cannot commit even one move or assignment event')
  const unchanged = (await h.state()).visits
  await b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Rebalance' }, { error: 'ROUTE_STALE' })
  await b.dispatcher.run('route.discard', { routeId: route.id, version: route.version })
  assert.deepEqual((await h.state()).visits, unchanged)
  const another = await b.dispatcher.run('route.optimize', { date: day })
  h.maps.status.routes = 503
  await h.scheduled(Date.now())
  const failed = (await h.state()).routes.find(r => r.id === another.id)
  assert.equal(failed.status, 'failed')
  assert.match(failed.problem, /Google Maps/)
  assert.deepEqual((await h.state()).visits, unchanged)
  assert.ok(!JSON.stringify(failed).includes('synthetic-glove-7'))

  h.maps.status.routes = 0
  const currentTech = (await h.state()).technicians.find(t => t.id === b.tom.id)
  await h.command('technician.save', { ...currentTech, timeOff: [] })
  const extraJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: (await h.state()).sites.find(s => s.location).id, title: 'New visit after route inspection' })
  const pending = await b.dispatcher.run('route.optimize', { date: day })
  await h.scheduled(Date.now())
  const inspected = (await h.state()).routes.find(r => r.id === pending.id)
  assert.equal(inspected.status, 'ready')
  let afterBooking
  h.maps.beforeRoutes = async () => {
    h.maps.beforeRoutes = null
    await b.dispatcher.run('visit.book', { jobId: extraJob.id, technicianId: b.tom.id, date: day, start: '16:00', end: '16:30' })
    afterBooking = await effects(h)
  }
  await b.dispatcher.run('route.accept', { routeId: inspected.id, version: inspected.version, reason: 'Day changed during provider check' }, { error: 'ROUTE_STALE' })
  assert.deepEqual(await effects(h), afterBooking, 'the new booking survives and none of the stale proposal moves or histories apply')
})
