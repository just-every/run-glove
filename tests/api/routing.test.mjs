import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'

async function dayFixture(h, day = '2026-11-03') {
  const b = await business(h)
  await h.command('maps.connect', { key: 'synthetic-glove-7' })
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { skills: 'refuse', availability: 'refuse', area: 'refuse' } })
  const third = await h.command('technician.save', { name: 'Ellen R.' })
  const technicians = []
  for (const [i, tech] of [b.priya, b.tom, third].entries()) technicians.push(await h.command('technician.save', { id: tech.id, version: tech.version, name: tech.name, ...(tech.operatorId ? { operatorId: tech.operatorId } : {}), skills: i === 0 ? ['hvac', 'gas'] : ['hvac'], zips: ['60601'], hours: [{ day: 'tue', start: '07:00', end: '18:00' }] }))
  const regular = await h.command('service.save', { code: 'ROUTE-HVAC', name: 'HVAC visit', unitPrice: '20.00', tax: 'GST', requiredSkills: ['hvac'] })
  const gas = await h.command('service.save', { code: 'ROUTE-GAS', name: 'Gas visit', unitPrice: '20.00', tax: 'GST', requiredSkills: ['gas'] })
  const visits = []
  for (let t = 0; t < 3; t++) for (let n = 0; n < 4; n++) {
    const group = (t + n) % 3, address = `${100 + t * 10 + n} Routing Ave, Chicago, IL 60601`
    h.maps.places.set(address, { lat: 41.8 + group * 0.04 + n * 0.0001, lng: -87.63 })
    const site = await h.command('site.save', { customerId: b.customer.id, address })
    const service = t === 0 && n === 0 ? gas : regular
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title: `Route visit ${t + 1}.${n + 1}`, lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '20.00' }] })
    const hour = 8 + n * 2, start = `${String(hour).padStart(2, '0')}:00`
    visits.push(await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: technicians[t].id, date: day, start, end: `${String(hour).padStart(2, '0')}:30`, window: { start: '08:00', end: '16:00' } }))
  }
  return { b, technicians, visits, day }
}

test('DISP-003, DISP-011: 12 visits for 3 technicians improve through a bounded background proposal, respect windows and skills, and move only on dispatcher acceptance', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b, visits, day } = await dayFixture(h)
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
  await b.office.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Less driving' }, { error: 'FORBIDDEN' })
  const accepted = await b.dispatcher.run('route.accept', { routeId: ready.id, version: ready.version, reason: 'Keep customers in their windows with less driving' }, { commandId: 'accept-route-day-0001' })
  assert.equal(accepted.status, 'accepted')
  const state = await h.state(), after = state.visits
  assert.ok(after.some(v => { const old = visits.find(x => x.id === v.id); return old && (old.startAt !== v.startAt || old.technicianId !== v.technicianId) }))
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
  assert.deepEqual((await b.priyaPerson.state()).routes, [])
  await assertTrail(h, ['route.queued', 'route.ready', 'route.accepted', 'visit.changed'])
})

test('DISP-003, DISP-011: stale eligibility, discard and a routing-provider refusal never change appointments', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b, day } = await dayFixture(h)
  let route = await b.dispatcher.run('route.optimize', { date: day })
  await h.scheduled(Date.now())
  route = (await h.state()).routes.find(r => r.id === route.id)
  const tech = (await h.state()).technicians.find(t => t.id === b.tom.id)
  await h.command('technician.save', { id: tech.id, version: tech.version, name: tech.name, operatorId: tech.operatorId, timeOff: [{ from: day, to: day, reason: 'Away' }] })
  const unchanged = (await h.state()).visits
  await b.dispatcher.run('route.accept', { routeId: route.id, version: route.version, reason: 'Rebalance' }, { error: 'ROUTE_STALE' })
  await b.dispatcher.run('route.discard', { routeId: route.id, version: route.version })
  const another = await b.dispatcher.run('route.optimize', { date: day })
  h.maps.status.routes = 503
  await h.scheduled(Date.now())
  const failed = (await h.state()).routes.find(r => r.id === another.id)
  assert.equal(failed.status, 'failed')
  assert.match(failed.problem, /Google Maps/)
  assert.deepEqual((await h.state()).visits, unchanged)
  assert.ok(!JSON.stringify(failed).includes('synthetic-glove-7'))
})
