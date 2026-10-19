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
