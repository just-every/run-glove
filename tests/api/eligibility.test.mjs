import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, acceptedQuote } from './harness.mjs'

// DISP-004: skills, working hours, time off and service areas decide who may
// take a visit; the owner sets each to refuse or to warn (a reviewed conflict).

test('DISP-004: booking refuses a missing skill and a day off, warns outside the area, then books an eligible technician', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const gas = await h.command('service.save', { code: 'GAS-FURN', name: 'Gas furnace tune-up', unitPrice: '149.00', tax: 'GST', requiredSkills: ['Gas'] })
  const site = await h.command('site.save', { customerId: b.customer.id, address: '410 W Erie St, Chicago, IL 60654' })
  assert.equal(site.zip, '60654')
  const week = [1, 2, 3, 4, 5].map(i => ({ day: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][i], start: '08:00', end: '17:00' }))
  // Priya has no gas skill; Tom has it, is off on the 21st and serves other ZIP codes.
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, skills: ['EPA 608'], hours: week, zips: ['60654'] })
  const tom = await h.command('technician.save', { id: b.tom.id, version: b.tom.version, name: b.tom.name, operatorId: b.tomPerson.id, skills: ['gas', 'EPA 608'], hours: week, timeOff: [{ from: '2026-10-21', to: '2026-10-21', reason: 'Dentist' }], zips: ['60601', '60602'] })
  assert.deepEqual(tom.skills, ['gas', 'epa 608'])
  // A partial save keeps what it does not name.
  assert.deepEqual((await h.command('technician.save', { id: tom.id, version: tom.version, name: tom.name, operatorId: b.tomPerson.id, active: true })).zips, ['60601', '60602'])

  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: site.id, title: 'Furnace tune-up', lines: [{ description: 'Gas furnace tune-up', quantity: '1', unitPrice: '149.00', serviceId: gas.id }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  const accepted = await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: accepted.id })
  const booking = (technicianId, date, extra = {}) => ({ jobId: job.id, technicianId, date, start: '09:00', end: '10:30', ...extra })

  const skill = await b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-20'), { error: 'ELIGIBILITY' })
  assert.match(skill.message, /does not have the gas skill/)
  const off = await b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21'), { error: 'ELIGIBILITY' })
  assert.match(off.message, /off on 2026-10-21 \(Dentist\)/)
  await b.dispatcher.run('visit.book', booking(tom.id, '2026-10-24'), { error: 'ELIGIBILITY' }) // a Saturday, outside his hours
  const area = await b.dispatcher.run('visit.book', booking(tom.id, '2026-10-20'), { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(area.details.conflicts.map(c => c.code), ['area:60654'])
  // Tom gains the ZIP code: the gas job books for him with nothing to review.
  const current = (await h.state()).technicians.find(x => x.id === tom.id)
  await h.command('technician.save', { id: tom.id, version: current.version, name: tom.name, operatorId: b.tomPerson.id, zips: ['60601', '60654'] })
  const visit = await b.dispatcher.run('visit.book', booking(tom.id, '2026-10-20'))
  assert.equal(visit.technicianId, tom.id)
  // Moving it to Priya meets the same rule.
  await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.priya.id, reason: 'Rebalance' }, { error: 'ELIGIBILITY' })

  // The owner relaxes skills and time off to warnings: the dispatcher reviews them instead.
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { skills: 'warn', availability: 'warn', area: 'refuse' } })
  const warned = await b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-22', { start: '11:00', end: '12:00' }), { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(warned.details.conflicts.map(c => c.code), ['skill:gas'])
  await b.dispatcher.run('visit.book', booking(b.priya.id, '2026-10-22', { start: '11:00', end: '12:00', acknowledge: ['skill:gas'] }))
  const away = await b.dispatcher.run('visit.book', booking(tom.id, '2026-10-21', { start: '13:00', end: '14:00' }), { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(away.details.conflicts.map(c => c.code), ['off:2026-10-21'])
})

test('DATA-002 / DISP-004: busy time from a technician\'s calendar refuses an overlapping booking; the secret calendar address stays with the owner and that technician', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const secret = 'https://calendar.google.com/calendar/ical/tom%40harbour.example/private-5e3cr3t/basic.ics', hidden = 'private-5e3cr3t'
  h.calendars.set(secret, ['BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'SUMMARY:Private dentist', 'DTSTART:20261102T220000Z', 'DTEND:20261102T233000Z', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;TZID=Australia/Sydney:20261104T130000', 'DTEND;TZID=Australia/Sydney:20261104T140000', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261105', 'DTEND;VALUE=DATE:20261106', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;TZID=Australia/Sydney:20261106T090000', 'DTEND;TZID=Australia/Sydney:20261106T100000', 'TRANSP:TRANSPARENT', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;TZID=Australia/Sydney:20261109T090000', 'DTEND;TZID=Australia/Sydney:20261109T100000', 'STATUS:CANCELLED', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;TZID=Australia/Sydney:20261110T090000', 'DTEND;TZID=Australia/Sydney:20261110T100000', 'RRULE:FREQ=WEEKLY;COUNT=3', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;TZID=Australia/Sydney:20261111T150000', 'DTEND;TZID=Australia/Sydney:20261111T160000', 'RRULE:FREQ=MONTHLY', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n'))

  // Only the owner or Tom himself sets Tom's calendar.
  await b.dispatcher.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('technician.calendar', { technicianId: b.tom.id, url: secret }, { error: 'FORBIDDEN' })
  const set = await b.tomPerson.run('technician.calendar', { technicianId: b.tom.id, url: secret })
  assert.equal(set.calendar.connected, true)
  // The address is readable only by the owner and Tom.
  const door = as => h.request(`/api/glove/technicians/${b.tom.id}/calendar`, { as })
  assert.equal((await (await door(h.owner())).json()).url, secret)
  assert.equal((await (await door(b.tomPerson.cookie)).json()).url, secret)
  for (const other of [b.priyaPerson.cookie, b.dispatcher.cookie, b.office.cookie]) assert.equal((await door(other)).status, 403)

  const read = await b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id })
  assert.equal(read.calendar.busy.length, 7, JSON.stringify(read.calendar.busy))
  assert.equal(read.calendar.unexpanded, 1)
  assert.ok(!JSON.stringify(read).includes('dentist'), 'busy spans carry no titles')

  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const book = (date, start, end) => b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date, start, end }, { error: 'ELIGIBILITY' })
  assert.match((await book('2026-11-03', '09:30', '10:00')).message, /Tom B\.'s calendar shows busy time/)
  await book('2026-11-04', '13:30', '15:00')
  await book('2026-11-05', '07:00', '08:00')
  await book('2026-11-17', '09:00', '09:30')
  await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-06', start: '09:00', end: '10:00' })
  await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-03', start: '11:00', end: '12:00' })

  // A dead address fails without naming it.
  await h.command('technician.calendar', { technicianId: b.tom.id, url: secret.replace('basic', 'gone') })
  const gone = await b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id }, { error: 'CALENDAR' })
  assert.ok(!JSON.stringify(gone).includes(hidden))

  // Never in state, events, the business export, command results or records.
  for (const who of [h.owner(), b.dispatcher.cookie, b.tomPerson.cookie]) assert.ok(!JSON.stringify(await h.state(who)).includes(hidden))
  assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(hidden))
  for (const table of ['glove_records', 'glove_events', 'glove_commands']) {
    const rows = (await h.db.prepare(`SELECT * FROM ${table}`).all()).results
    assert.ok(!JSON.stringify(rows).includes(hidden), `${table} never holds the address`)
  }
  await assertTrail(h, ['technician.calendar', 'technician.calendarRead'])
  // DISP-008: both providers receive committed lifecycle changes, and busy time refuses booking.
  for (const provider of ['google', 'microsoft']) {
    const connect = { technicianId: b.tom.id, provider, calendarId: 'synthetic-glove-302', clientId: 'synthetic-glove-303', clientSecret: 'synthetic-glove-304', refreshToken: 'synthetic-glove-305', details: provider === 'microsoft', confirm: true }
    await b.dispatcher.run('calendar.connect', connect, { error: 'FORBIDDEN' })
    await h.command('calendar.connect', { ...connect, confirm: false }, { error: 'CONSENT' })
    const start = h.calendarSync.calls.length
    await h.command('calendar.connect', connect)
    h.calendarSync.busy = [{ start: '2026-11-20T22:00:00Z', end: '2026-11-20T23:00:00Z' }]
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-21', start: '09:00', end: '10:00' }, { error: 'ELIGIBILITY' })
    let v = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-21', start: '11:00', end: '12:00' }, { commandId: 'synthetic-glove-book-' + provider })
    const writes = () => h.calendarSync.calls.slice(start).filter(c => c.method !== 'GET')
    const created = writes().at(-1)
    assert.equal(created.method, 'POST')
    assert.equal(created.provider, provider)
    assert.equal(JSON.stringify(created.body).includes(b.customer.name), provider === 'microsoft')
    assert.equal(JSON.stringify(created.body).includes(b.site.address), provider === 'microsoft')
    const count = writes().length
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-21', start: '11:00', end: '12:00' }, { commandId: 'synthetic-glove-book-' + provider })
    assert.equal(writes().length, count, 'replay does not send a second calendar event')
    v = await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '13:00', end: '14:00', reason: 'Customer requested later' })
    assert.equal(writes().at(-1).method, 'PATCH')
    assert.equal(writes().at(-1).body.start.dateTime, v.startAt)
    await b.dispatcher.run('visit.cancel', { visitId: v.id, version: v.version, reason: 'Customer cancelled' })
    assert.equal(writes().at(-1).method, 'DELETE')
    for (const table of ['glove_records', 'glove_events', 'glove_commands']) assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(connect.refreshToken))
    assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(connect.clientSecret))
    h.calendarSync.status = 503
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2026-11-22', start: '13:00', end: '14:00' }, { error: 'CALENDAR_SYNC' })
    h.calendarSync.status = 200
    await h.command('calendar.connect', { technicianId: b.tom.id, disconnect: true })
  }
  await assertTrail(h, ['calendar.connected', 'calendar.disconnected', 'calendar.outcome'])

})

test('DATA-002 / DISP-002 map and location flow', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const places = [['410 W Erie St, Chicago, IL 60654', { lat: 41.8937, lng: -87.6386 }], ['1060 W Addison St, Chicago, IL 60613', { lat: 41.9484, lng: -87.6553 }], ['5700 S Lake Shore Dr, Chicago, IL 60637', { lat: 41.7906, lng: -87.5831 }], ['233 S Wacker Dr, Chicago, IL 60606', { lat: 41.8789, lng: -87.6359 }]]
  for (const [address, at] of places) h.maps.places.set(address, at)
  const key = 'synthetic-glove-1'
  // Only the owner connects Google Maps, with their own key.
  await b.dispatcher.run('maps.connect', { key }, { error: 'FORBIDDEN' })
  await h.command('maps.connect', { key })
  // Saving a site places it on the map; an address Google cannot place is said so.
  const saved = []
  for (const [address] of places) saved.push(await h.command('site.save', { customerId: b.customer.id, address }))
  const [erie, addison, lakeShore, wacker] = saved
  assert.deepEqual([erie.location.lat, erie.location.lng, lakeShore.zip], [41.8937, -87.6386, '60637'])
  const lost = await h.command('site.save', { customerId: b.customer.id, address: '1 Nowhere Rd, Atlantis, IL 60000' })
  assert.equal(lost.location, null)
  assert.match(lost.locateError, /found no place/)
  assert.deepEqual(h.maps.calls.filter(c => c.api === 'geocode').map(c => [c.key, c.address]).sort(), [...places.map(([address]) => [key, address]), [key, '1 Nowhere Rd, Atlantis, IL 60000']].sort())

  // The owner draws Tom's North Side zone; nobody else draws zones.
  const north = { name: 'North Side', points: [{ lat: 41.87, lng: -87.7 }, { lat: 41.97, lng: -87.7 }, { lat: 41.97, lng: -87.6 }, { lat: 41.87, lng: -87.6 }] }
  await b.dispatcher.run('technician.zones', { technicianId: b.tom.id, version: b.tom.version, zones: [north] }, { error: 'FORBIDDEN' })
  await h.command('technician.zones', { technicianId: b.tom.id, version: b.tom.version, zones: [{ name: 'Line', points: north.points.slice(0, 2) }] }, { error: 'INPUT' })
  const tom = await h.command('technician.zones', { technicianId: b.tom.id, version: b.tom.version, zones: [north] })
  assert.deepEqual(tom.zones.map(z => [z.name, z.points.length]), [['North Side', 4]])
  const job = (site, title) => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title })
  const visit = (j, technicianId, date, start, end, extra = {}) => b.dispatcher.run('visit.book', { jobId: j.id, technicianId, date, start, end, ...extra }, extra.error ? { error: extra.error } : {})
  // A site outside every zone drawn for Tom gets the area warning; one inside books with nothing to review.
  const museum = await job(lakeShore, 'Museum boiler')
  const outside = await visit(museum, tom.id, '2026-11-03', '13:00', '14:00', { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(outside.details.conflicts.map(c => c.code), ['area:60637'])
  assert.equal(outside.details.conflicts[0].message, 'Tom B.\'s drawn zones do not include 5700 S Lake Shore Dr, Chicago, IL 60637 (60637).')
  await visit(await job(addison, 'Addison furnace'), tom.id, '2026-11-03', '13:00', '14:00')
  // A site not on the map cannot be inside a zone; the ZIP codes still count beside the zones.
  const unknown = await visit(await job(lost, 'Unplaced address'), tom.id, '2026-11-03', '15:00', '16:00', { error: 'CONFLICT_REVIEW' })
  assert.match(unknown.details.conflicts[0].message, /, which is not on the map yet\.$/)
  const current = (await h.state()).technicians.find(x => x.id === tom.id)
  await h.command('technician.save', { id: tom.id, version: current.version, name: tom.name, operatorId: b.tomPerson.id, zips: ['60637'] })
  await visit(museum, tom.id, '2026-11-03', '16:00', '17:00')
  // The owner's area rule set to refuse refuses instead of warning.
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { area: 'refuse' } })
  const refused = await visit(await job(wacker, 'Refused outside'), b.priya.id, '2026-11-03', '09:00', '10:00')
  assert.equal(refused.technicianId, b.priya.id)
  assert.match((await visit(await job(lost, 'Still unplaced'), tom.id, '2026-11-04', '09:00', '10:00', { error: 'ELIGIBILITY' })).message, /^Tom B\.'s drawn zones and ZIP codes do not include 1 Nowhere Rd/)
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { area: 'warn' } })

  // Travel joins automatic assignment: both have an hour booked, Priya far south and Tom on Erie St, so Tom takes the Wacker Dr job.
  await visit(await job(lakeShore, 'Early south'), b.priya.id, '2026-11-05', '08:00', '09:00')
  await visit(await job(erie, 'Early north'), tom.id, '2026-11-05', '08:00', '09:00')
  const downtown = await job(wacker, 'Tower chiller')
  const auto = await visit(downtown, 'auto', '2026-11-05', '10:00', '11:00')
  assert.equal(auto.technicianId, tom.id)
  const ranking = /^Assigned automatically: Tom B\. had the fewest booked and drive minutes that day \(Tom B\. 60 booked \+ (\d+) drive, Priya N\. 60 booked \+ (\d+) drive\)$/.exec(auto.assignments[0].reason)
  assert.ok(ranking, auto.assignments[0].reason)
  assert.ok(Number(ranking[1]) < Number(ranking[2]), 'the shorter drive wins a tie in booked minutes')
  const routed = h.maps.calls.filter(c => c.api === 'routes').at(-1)
  assert.equal(routed.key, key)
  assert.ok(!/Erie|Wacker|Lake Shore|Harbourview|Tower|Priya|Tom/.test(JSON.stringify(routed.body)), 'routing sends coordinates only')

  // The desk's map board: each technician's stops in order with the drive between them; the base map carries no markers.
  const board = await (await h.request('/api/glove/map?date=2026-11-05', { as: b.dispatcher.cookie })).json()
  const tomDay = board.technicians.find(x => x.id === tom.id)
  assert.deepEqual(tomDay.stops.map(x => [x.start, x.address]), [['08:00', places[0][0]], ['10:00', places[3][0]]])
  assert.equal(tomDay.legs.length, 1)
  assert.equal(Math.round(tomDay.legs[0].seconds / 60), Number(ranking[1]))
  assert.equal((await h.request('/api/glove/map?date=2026-11-05', { as: b.priyaPerson.cookie })).status, 403)
  const image = await h.request('/api/glove/map.png?date=2026-11-05', { as: b.dispatcher.cookie })
  assert.equal(image.headers.get('content-type'), 'image/png')
  const drawn = h.maps.calls.filter(c => c.api === 'staticmap').at(-1)
  assert.deepEqual(Object.keys(drawn.query).sort(), ['center', 'maptype', 'scale', 'size', 'zoom'])

  // The key never leaves its secret store.
  for (const who of [h.owner(), b.dispatcher.cookie]) assert.ok(!JSON.stringify(await h.state(who)).includes(key))
  assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(key))
  for (const table of ['glove_records', 'glove_events', 'glove_commands']) assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(key), `${table} never holds the key`)
  await assertTrail(h, ['maps.connected', 'site.located', 'technician.zones'])
  // DISP-005: both sources use real authenticated commands, with only provider edges faked.
  const now = () => new Date().toISOString()
  const active = (await h.state()).visits.find(v => v.technicianId === b.priya.id && v.status === 'booked')
  await b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: now() }, { error: 'LOCATION_STOPPED' })
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('clock.in', { deviceTime: now() })
  await b.priyaPerson.run('timer.start', { visitId: active.id, kind: 'job', deviceTime: now() })
  await b.priyaPerson.run('location.phone', { lat: 999, lng: 0, observedAt: now() }, { error: 'LOCATION' })
  await b.priyaPerson.run('location.phone', { lat: 41.89001, lng: -87.63001, observedAt: '2000-01-01T00:00:00Z' }, { error: 'LOCATION_STALE' })
  const nextLocationVisit = await visit(await job(erie, 'Next location stop'), b.priya.id, active.local.date, '10:30', '11:30', { window: { start: '10:00', end: '12:00' } })
  const point = { lat: 41.89001, lng: -87.63001, observedAt: now() }
  const received = await b.priyaPerson.run('location.phone', point)
  assert.deepEqual(received, { accepted: true, source: 'phone' })
  const positions = async as => (await (await h.request(`/api/glove/map?date=${active.local.date}&branch=main`, { as })).json()).technicians
  let live = (await positions(h.owner())).find(t => t.id === b.priya.id).live
  assert.equal(live.position.lat, point.lat)
  assert.equal(live.position.source, 'phone')
  assert.ok(live.eta && live.eta.seconds >= 0, JSON.stringify(live))
  assert.ok((await positions(b.office.cookie)).every(t => t.live === null))
  assert.equal((await h.request(`/api/glove/map?date=${active.local.date}`, { as: b.tomPerson.cookie })).status, 403)
  for (const as of [h.owner(), b.dispatcher.cookie, b.tomPerson.cookie]) {
    const r = await h.request('/api/glove/commands', { method: 'POST', as, body: { commandId: crypto.randomUUID(), type: 'location.phone', payload: point } })
    assert.equal(r.status, 403)
  }
  // Latest coordinates stay out of all durable audit and business export doors.
  for (const table of ['glove_records', 'glove_events', 'glove_commands']) assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes('41.89001'), table)
  assert.ok(!(await (await h.request('/api/glove/export')).text()).includes('41.89001'))
  const otherBranch = await h.command('branch.save', { name: 'Other location branch', prefix: 'LOC', timezone: 'America/Chicago', zips: [] })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: otherBranch.id })
  assert.ok(!(await positions(b.dispatcher.cookie)).some(t => t.id === b.priya.id), 'A branch-limited dispatcher sees no foreign position')
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null, limited: false })
  await h.command('location.fleetConnect', { technicianId: b.priya.id, vehicleId: '12345', key: 'synthetic-glove-501' })
  h.fleet.data = [{ id: '12345', gps: { time: now(), latitude: 41.89123, longitude: -87.63123 } }]
  await h.command('location.fleetRead', { technicianId: b.priya.id })
  live = (await positions(b.dispatcher.cookie)).find(t => t.id === b.priya.id).live
  assert.equal(live.position.source, 'Samsara')
  assert.equal(live.position.lat, 41.89123)
  assert.ok(live.eta)
  assert.deepEqual(h.fleet.calls.at(-1), { method: 'GET', url: 'https://api.samsara.com/fleet/vehicles/stats?vehicleIds=12345&types=gps', authorization: 'Bearer synthetic-glove-501' })
  const delayAt = new Date(Date.parse(active.endAt) + 20 * 60_000).toISOString()
  const risk = (await (await h.request(`/api/glove/delays?at=${delayAt}`, { as: b.dispatcher.cookie })).json()).risks.find(r => r.visitId === nextLocationVisit.id)
  assert.ok(risk, 'The next visit is at risk while the current job runs long')
  assert.ok(risk.reasons.some(r => /Samsara position 41.89123, -87.63123; ETA/.test(r)))
  assert.ok(risk.options.length)
  assert.ok(risk.options.every(o => /Delayed technician: Samsara position.*ETA/.test(o.note)))
  const tomWork = (await h.state()).visits.find(v => v.technicianId === b.tom.id && v.local.date === active.local.date && v.local.start === '13:00')
  await b.tomPerson.run('location.consent', { enabled: true })
  await b.tomPerson.run('clock.in', { deviceTime: now() })
  await b.tomPerson.run('timer.start', { visitId: tomWork.id, kind: 'job', deviceTime: now() })
  await b.tomPerson.run('location.phone', { lat: 41.89234, lng: -87.63234, observedAt: now() })
  const mixed = await positions(h.owner())
  assert.equal(mixed.find(t => t.id === b.tom.id).live.position.source, 'phone')
  assert.ok(mixed.find(t => t.id === b.tom.id).live.eta)
  assert.equal(mixed.find(t => t.id === b.priya.id).live.position.source, 'Samsara')
  await b.tomPerson.run('clock.out', { deviceTime: now() })
  h.maps.status.routes = 503
  assert.equal((await positions(h.owner())).find(t => t.id === b.priya.id).live.eta, null)
  delete h.maps.status.routes
  h.fleet.status = 503
  await h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'FLEET' })
  h.fleet.status = 200
  await h.db.prepare("UPDATE glove_live_locations SET observed_at='2000-01-01T00:00:00Z'").run()
  live = (await positions(h.owner())).find(t => t.id === b.priya.id).live
  assert.equal(live.status, 'Location stale')
  assert.equal(live.eta, null)
  h.fleet.data[0].gps.time = now()
  h.fleet.beforeReply = async () => { h.fleet.beforeReply = null; await b.priyaPerson.run('location.consent', { enabled: false }) }
  await h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0, 'A concurrent withdrawal fences an in-flight provider response')
  await b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
  const reads = h.fleet.calls.length
  await h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
  assert.equal(h.fleet.calls.length, reads, 'No off-consent provider request')
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('location.phone', { ...point, observedAt: now() })
  let currentVisit = (await h.state()).visits.find(v => v.id === active.id)
  currentVisit = await b.dispatcher.run('visit.change', { visitId: active.id, version: currentVisit.version, technicianId: b.tom.id, reason: 'Location assignment handoff' })
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)
  await b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
  await b.dispatcher.run('visit.change', { visitId: active.id, version: currentVisit.version, technicianId: b.priya.id, reason: 'Restore assignment after handoff' })
  await b.priyaPerson.run('location.phone', { ...point, observedAt: now() })
  await b.priyaPerson.run('clock.out', { deviceTime: now() })
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)
  await b.priyaPerson.run('location.phone', { ...point, observedAt: now() }, { error: 'LOCATION_STOPPED' })
  await h.command('location.fleetRead', { technicianId: b.priya.id }, { error: 'LOCATION_STOPPED' })
  assert.equal(h.fleet.calls.length, reads)
  await h.db.prepare('UPDATE oa_sessions SET revoked_at=? WHERE operator_id=?').bind(Math.floor(Date.now() / 1000), b.priyaPerson.id).run()
  const revoked = await h.request('/api/glove/commands', { method: 'POST', as: b.priyaPerson.cookie, body: { commandId: crypto.randomUUID(), type: 'location.phone', payload: { ...point, observedAt: now() } } })
  assert.equal(revoked.status, 401, 'A revoked sign-in cannot submit a position')
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n, 0)

})
