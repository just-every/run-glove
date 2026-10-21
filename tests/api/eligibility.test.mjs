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
})

test('DATA-002 / DISP-002: the owner draws a zone for a technician, a site outside it gets the area warning, and the drive from each one\'s previous visit joins automatic assignment', async (t) => {
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
})
