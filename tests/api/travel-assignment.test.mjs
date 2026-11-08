import test from 'node:test'
import assert from 'node:assert/strict'
import { installation } from './harness.mjs'

const at = '2026-11-10T09:50:00.000Z'
const ranking = 'Assigned automatically: Bea had the fewest booked and drive minutes that day (Bea 75 booked + 5 drive, Zoe 60 booked + 20 drive, Cy 90 booked + 5 drive, Ada 120 booked + 0 drive)'
const waypoint = ({ lat, lng }) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } })
const routes = h => h.maps.calls.filter(c => c.api === 'routes')

async function desk(h, connected = true) {
  await h.command('business.save', { name: 'Synthetic Glove travel', currency: 'USD', timezone: 'Etc/UTC', paymentTermsDays: 14 })
  const dispatcher = await h.person('Synthetic Glove Dispatcher', 'dispatcher')
  const customer = await h.command('customer.save', { name: 'Synthetic Glove customer' })
  if (connected) await h.command('maps.connect', { key: 'synthetic-glove-136' })
  let ordinal = 0
  const site = async (name, location) => {
    const address = `${++ordinal} ${name} Street, Chicago, IL 60601`
    if (location) h.maps.places.set(address, location)
    const saved = await h.command('site.save', { customerId: customer.id, address })
    if (connected && location) assert.deepEqual([saved.location.lat, saved.location.lng], [location.lat, location.lng])
    return saved
  }
  const job = (site, title = 'Synthetic Glove service call') => dispatcher.run('job.create', { customerId: customer.id, siteId: site.id, title })
  const book = (job, technician, date, start, end) => dispatcher.run('visit.book', { jobId: job.id, technicianId: technician.id, date, start, end })
  const enquiry = site => dispatcher.run('enquiry.create', { customerId: customer.id, siteId: site.id, source: 'phone', description: 'Synthetic Glove inspection' })
  return { dispatcher, customer, site, job, book, enquiry }
}

async function candidates(h, d) {
  const person = await h.person('Synthetic Glove Bea', 'technician')
  // Insert Zoe first so equal totals must be resolved by name, not record order.
  const tech = {}
  for (const name of ['Zoe', 'Cy', 'Ada', 'Bea']) tech[name] = await h.command('technician.save', { name, ...(name === 'Bea' ? { operatorId: person.id } : {}) })
  const places = {}
  for (const [name, lat] of [['target', 41.80], ['bea', 41.81], ['zoe', 41.82], ['cy', 41.83], ['early', 41.84], ['cancelled', 41.85], ['future', 41.86]]) places[name] = await d.site(name, { lat, lng: -87.63 })
  // Fixed provider answers independent of the production distance calculation.
  const seconds = new Map([[41.81, 300], [41.82, 1200], [41.83, 300], [41.84, 5940], [41.85, 5880], [41.86, 5820]])
  h.maps.routeSeconds = (from, to) => {
    assert.equal(to.latitude, 41.80)
    assert.equal(to.longitude, -87.63)
    assert.ok(seconds.has(from.latitude), 'only a registered site can be an origin')
    return seconds.get(from.latitude)
  }
  const seed = async date => {
    // Ada has bookings that day, but none ending before the new start.
    await d.book(await d.job(places.future), tech.Ada, date, '13:00', '15:00')
    // End exactly at 10:00 counts even though this door ranks rather than
    // promises travel feasibility (public booking owns that separate duty).
    const bea = await d.book(await d.job(places.bea), tech.Bea, date, '08:45', '10:00')
    await d.book(await d.job(places.zoe), tech.Zoe, date, '09:00', '10:00')
    await d.book(await d.job(places.early), tech.Cy, date, '07:00', '07:15')
    const cancelled = await d.book(await d.job(places.cancelled), tech.Cy, date, '09:30', '10:00')
    await d.dispatcher.run('visit.cancel', { visitId: cancelled.id, version: cancelled.version, reason: 'Customer cancelled' })
    await d.book(await d.job(places.cy), tech.Cy, date, '09:00', '09:30')
    await d.book(await d.job(places.future), tech.Cy, date, '14:00', '14:45')
    return bea
  }
  return { tech, person, places, seed }
}

async function retained(h, visit, reason, commandId, dispatcher) {
  const state = await h.state()
  assert.deepEqual(state.visits.find(v => v.id === visit.id), visit)
  assert.equal(visit.assignments.length, 1)
  assert.equal(visit.assignments[0].reason, reason)
  assert.deepEqual(visit.assignments[0].by, { id: dispatcher.id, name: dispatcher.name, role: 'dispatcher' })
  assert.equal(visit.assignments[0].at, at)
  const response = await h.request('/api/glove/activity', { as: dispatcher.cookie })
  assert.equal(response.status, 200)
  const events = (await response.json()).events.filter(e => e.commandId === commandId && e.kind === 'visit.booked')
  assert.equal(events.length, 1)
  const event = events[0]
  assert.equal(event.subjectId, visit.id)
  assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at], [dispatcher.id, dispatcher.name, 'dispatcher', at])
  assert.ok(event.summary.endsWith(`; ${reason.split("; ")[0].toLowerCase()}`), event.summary)
  const exported = await (await h.request('/api/glove/export')).json()
  assert.deepEqual(exported.visits.find(v => v.id === visit.id), visit)
  const kept = exported.timeline.find(e => e.id === event.id)
  assert.equal(kept.summary, event.summary)
  assert.deepEqual([kept.command_id, kept.actor_id, kept.actor_role, kept.at], [commandId, dispatcher.id, 'dispatcher', at])
}

async function automatic(h, d, c, date, kind, commandId) {
  let type, payload
  if (kind === 'assessment') {
    type = 'assessment.book'
    payload = { enquiryId: (await d.enquiry(c.places.target)).id }
  } else {
    type = 'visit.book'
    let job
    if (kind === 'quote') {
      let quote = await d.dispatcher.run('quote.draft', { customerId: d.customer.id, siteId: c.places.target.id, title: 'Synthetic Glove quoted work', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '25.00' }] })
      quote = await d.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
      await d.dispatcher.run('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Synthetic Glove customer' })
      job = await d.dispatcher.run('job.create', { quoteId: quote.id })
    } else {
      job = await d.job(c.places.target)
      assert.ok(job.serviceCall, 'the ordinary visit also covers service-call work')
    }
    payload = { jobId: job.id }
  }
  payload = { ...payload, technicianId: 'auto', date, start: '10:00', end: '11:00' }
  const before = await h.state(), callCount = routes(h).length
  const result = await d.dispatcher.run(type, payload, { commandId })
  const visit = type === 'assessment.book' ? result.visit : result
  assert.equal(visit.technicianId, c.tech.Bea.id)
  const reason = ranking + (type === 'assessment.book' ? '; Assessment booked' : '')
  assert.equal(visit.assignments[0].reason, reason)
  const after = await h.state()
  assert.deepEqual(after.visits.filter(v => v.id !== visit.id), before.visits, 'assignment moves no other visit')
  assert.deepEqual(after.proposals, before.proposals, 'assignment creates no general proposal')
  assert.deepEqual(after.routes, before.routes, 'assignment creates no route-optimization proposal')
  assert.equal(routes(h).length, callCount + 1)
  const request = structuredClone(routes(h).at(-1).body)
  request.origins.sort((a, b) => a.waypoint.location.latLng.latitude - b.waypoint.location.latLng.latitude)
  assert.deepEqual(request, {
    origins: [waypoint({ lat: 41.81, lng: -87.63 }), waypoint({ lat: 41.82, lng: -87.63 }), waypoint({ lat: 41.83, lng: -87.63 })],
    destinations: [waypoint({ lat: 41.80, lng: -87.63 })], travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE',
  }, 'every origin is the latest qualifying visit site; no names, addresses or technician positions travel')
  await retained(h, visit, reason, commandId, d.dispatcher)
  const snapshot = await h.state(), calls = h.maps.calls.length
  assert.deepEqual(await d.dispatcher.run(type, payload, { commandId }), result)
  assert.deepEqual(await h.state(), snapshot, 'replay creates no visit, event or proposal')
  assert.equal(h.maps.calls.length, calls, 'replay makes no provider request')
  return { type, payload, result, visit, commandId, reason }
}

test('DISP-010 point 1: travel ranking and its retained reason cover quoted work, service calls and assessments across restart and replay', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const d = await desk(h), c = await candidates(h, d)
  // A prior-day visit must never supply Ada with a same-day origin.
  await d.book(await d.job(c.places.early), c.tech.Ada, '2026-11-09', '08:00', '09:00')
  const kept = []
  for (const [date, kind] of [['2026-11-10', 'service'], ['2026-11-11', 'quote'], ['2026-11-12', 'assessment']]) {
    await c.seed(date)
    kept.push(await automatic(h, d, c, date, kind, `synthetic-glove-travel-${kind}`))
  }
  await h.restart()
  for (const x of kept) {
    await retained(h, x.visit, x.reason, x.commandId, d.dispatcher)
    const snapshot = await h.state(), calls = h.maps.calls.length
    assert.deepEqual(await d.dispatcher.run(x.type, x.payload, { commandId: x.commandId }), x.result)
    assert.deepEqual(await h.state(), snapshot)
    assert.equal(h.maps.calls.length, calls)
  }
  // A new decision after actual Worker replacement uses the same retained
  // schedule and installation key, not just a cached command result.
  await c.seed('2026-11-13')
  await automatic(h, d, c, '2026-11-13', 'assessment', 'synthetic-glove-travel-restarted')
})

test('DISP-010 point 2: disconnected ranking uses booked minutes and unavailable travel refuses atomically while explicit choice books', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const d = await desk(h, false)
  const ada = await h.command('technician.save', { name: 'Ada' })
  const bea = await h.command('technician.save', { name: 'Bea' })
  const target = await d.site('target', { lat: 41.80, lng: -87.63 })
  const previous = await d.site('previous', { lat: 41.81, lng: -87.63 })
  await d.book(await d.job(previous), ada, '2026-11-10', '08:00', '09:00')
  await d.book(await d.job(previous), bea, '2026-11-10', '08:00', '08:30')
  const disconnected = await d.dispatcher.run('visit.book', { jobId: (await d.job(target)).id, technicianId: 'auto', date: '2026-11-10', start: '10:00', end: '11:00' })
  assert.equal(disconnected.technicianId, bea.id)
  assert.equal(disconnected.assignments[0].reason, 'Assigned automatically: Bea had the fewest booked minutes that day (Bea 30, Ada 60)')
  const assessment = await d.dispatcher.run('assessment.book', { enquiryId: (await d.enquiry(target)).id, technicianId: 'auto', date: '2026-11-10', start: '12:00', end: '13:00' })
  assert.equal(assessment.visit.technicianId, ada.id)
  assert.equal(assessment.visit.assignments[0].reason, 'Assigned automatically: Ada had the fewest booked minutes that day (Ada 60, Bea 90); Assessment booked')
  assert.equal(routes(h).length, 0)
  assert.equal(h.maps.calls.length, 0, 'no geocoding or routing while disconnected')
  await h.command('maps.connect', { key: 'synthetic-glove-136' })
  await h.command('site.locate', { siteIds: [target.id, previous.id] })
  const unknown = await d.site('unplaceable')
  let day = 14
  for (const failure of ['job site', 'previous site', 'no route']) {
    const date = `2026-11-${day++}`
    const origin = failure === 'previous site' ? unknown : previous
    await d.book(await d.job(origin), ada, date, '08:00', '09:00')
    await d.book(await d.job(previous), bea, date, '08:00', '09:00')
    h.maps.routeSeconds = () => failure === 'no route' ? null : 300
    for (const type of ['visit.book', 'assessment.book']) {
      const destination = failure === 'job site' ? unknown : target
      const identity = type === 'visit.book' ? { jobId: (await d.job(destination)).id } : { enquiryId: (await d.enquiry(destination)).id }
      const payload = { ...identity, technicianId: 'auto', date, start: type === 'visit.book' ? '10:00' : '12:00', end: type === 'visit.book' ? '11:00' : '13:00' }
      const snapshot = await h.state()
      const activity = await (await h.request('/api/glove/activity')).json()
      const error = await d.dispatcher.run(type, payload, { error: failure === 'no route' ? 'ROUTING' : 'MAP_LOCATION' })
      assert.match(error.message, /choose a technician/)
      assert.deepEqual(await h.state(), snapshot, `${failure} leaves no visit, assessment job, request change or event`)
      assert.deepEqual(await (await h.request('/api/glove/activity')).json(), activity)
      const calls = h.maps.calls.length
      const explicit = await d.dispatcher.run(type, { ...payload, technicianId: bea.id })
      assert.equal((type === 'visit.book' ? explicit : explicit.visit).technicianId, bea.id)
      assert.equal(h.maps.calls.length, calls, 'explicit dispatcher choice makes no Maps request')
    }
  }
})

test('DISP-010 point 3: assignment routes from visit sites despite a live phone position and never optimizes the schedule', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const d = await desk(h), c = await candidates(h, d)
  const active = await c.seed('2026-11-10')
  await c.person.run('location.consent', { enabled: true })
  await c.person.run('clock.in', { deviceTime: at })
  await c.person.run('timer.start', { visitId: active.id, kind: 'job', deviceTime: at })
  assert.deepEqual(await c.person.run('location.phone', { lat: 42.123456, lng: -88.654321, observedAt: at }), { accepted: true, source: 'phone' })
  await automatic(h, d, c, '2026-11-10', 'service', 'synthetic-glove-travel-position')
  assert.equal(routes(h).length, 1, 'assignment alone requested one route matrix')
  assert.ok(!JSON.stringify(routes(h)[0].body).includes('42.123456'))
  assert.ok(!JSON.stringify(routes(h)[0].body).includes('-88.654321'))
  assert.deepEqual((await h.state()).proposals, [])
  assert.deepEqual((await h.state()).routes, [])
})
