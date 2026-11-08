import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'

const at = '2026-11-03T00:00:00.000Z'
const connection = (tech, provider, details = false) => ({ technicianId: tech.id, provider, calendarId: 'synthetic-glove-701', clientId: 'synthetic-glove-702', clientSecret: 'synthetic-glove-703', refreshToken: 'synthetic-glove-704', confirm: true, details })
const writes = h => h.calendarSync.calls.filter(c => c.method !== 'GET')
const rows = async (h, table) => (await h.db.prepare(`SELECT * FROM ${table}`).all()).results
const tech = async (h, id) => (await h.state()).technicians.find(t => t.id === id)
const job = (b) => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Private calendar inspection', lines: [{ description: 'Private price line', quantity: '1', unitPrice: '876.54' }] })
const booking = (j, t, date = '2026-11-05', start = '09:00', end = '10:00') => ({ jobId: j.id, technicianId: t.id, date, start, end })

async function unchanged(h, attempt) {
  const visits = (await h.state()).visits, work = await rows(h, 'glove_calendar_work'), events = await rows(h, 'glove_calendar_events'), sent = writes(h).length
  await attempt()
  assert.deepEqual((await h.state()).visits, visits, 'refusal leaves visits unchanged')
  assert.deepEqual(await rows(h, 'glove_calendar_work'), work, 'refusal queues no delivery')
  assert.deepEqual(await rows(h, 'glove_calendar_events'), events, 'refusal creates no mapping')
  assert.equal(writes(h).length, sent, 'refusal sends no event')
}

export async function exactCalendarLifecycle() {
  for (const provider of ['google', 'microsoft']) {
    const h = await installation({ at })
    try {
      const b = await business(h), j = await job(b)
      await h.command('calendar.connect', connection(b.tom, provider))
      await h.restart()
      h.calendarSync.busy = [{ start: '2026-11-04T22:00:00.000Z', end: '2026-11-04T23:00:00.000Z' }]
      await unchanged(h, () => b.dispatcher.run('visit.book', booking(j, b.tom), { error: 'ELIGIBILITY' }))
      h.calendarSync.busy = []
      const bookPayload = booking(j, b.tom), bookId = randomUUID()
      let v = await b.dispatcher.run('visit.book', bookPayload, { commandId: bookId })
      assert.equal(v.startAt, '2026-11-04T22:00:00.000Z')
      assert.equal(v.endAt, '2026-11-04T23:00:00.000Z')
      assert.deepEqual(writes(h).map(c => [c.provider, c.method, c.body.start.dateTime, c.body.end.dateTime]), [[provider, 'POST', '2026-11-04T22:00:00.000Z', '2026-11-04T23:00:00.000Z']])
      const eventId = (await rows(h, 'glove_calendar_events'))[0].event_id
      const movePayload = { visitId: v.id, version: v.version, start: '13:00', end: '14:30', reason: 'Customer requests later arrival' }, moveId = randomUUID()
      v = await b.dispatcher.run('visit.change', movePayload, { commandId: moveId })
      assert.deepEqual([writes(h)[1].method, writes(h)[1].body.start.dateTime, writes(h)[1].body.end.dateTime], ['PATCH', '2026-11-05T02:00:00.000Z', '2026-11-05T03:30:00.000Z'])
      assert.ok(new URL(writes(h)[1].url).pathname.endsWith('/' + eventId))
      const cancelPayload = { visitId: v.id, version: v.version, reason: 'Customer cancels' }, cancelId = randomUUID()
      await b.dispatcher.run('visit.cancel', cancelPayload, { commandId: cancelId })
      assert.deepEqual(writes(h).map(c => c.method), ['POST', 'PATCH', 'DELETE'])
      assert.ok(new URL(writes(h)[2].url).pathname.endsWith('/' + eventId))
      assert.equal(h.calendarSync.events.size, 0)
      assert.deepEqual(await rows(h, 'glove_calendar_events'), [])
      await h.restart()
      for (const [type, payload, commandId] of [['visit.book', bookPayload, bookId], ['visit.change', movePayload, moveId], ['visit.cancel', cancelPayload, cancelId]]) await b.dispatcher.run(type, payload, { commandId })
      await h.scheduled(at)
      assert.deepEqual(writes(h).map(c => c.method), ['POST', 'PATCH', 'DELETE'], 'restart, replay and scheduler do not repeat provider writes')
      assert.equal((await h.state()).visits.find(x => x.id === v.id).status, 'cancelled')
    } finally { await h.close() }
  }
}

export async function ownerConnectionAuthority() {
  const h = await installation({ at })
  try {
    const b = await business(h), limited = await h.person('Synthetic limited calendar owner', 'owner')
    await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
    const role = await h.command('role.save', { name: 'Calendar inspector', permissions: ['calendar.read'] })
    const custom = await h.person('Synthetic calendar inspector', `custom:${role.id}`)
    const integration = await h.command('token.issue', { name: 'Synthetic calendar integration', role: 'dispatcher' })
    for (const provider of ['google', 'microsoft']) {
      const payload = connection(b.tom, provider), before = await rows(h, 'glove_calendar_credentials'), calls = h.calendarSync.calls.length
      for (const person of [b.office, b.dispatcher, b.tomPerson, custom, limited]) {
        await person.run('calendar.connect', payload, { error: 'FORBIDDEN' })
        await person.run('calendar.connect', { technicianId: b.tom.id, disconnect: true }, { error: 'FORBIDDEN' })
      }
      for (const [headers, expected] of [[{}, 401], [{ authorization: `Bearer ${integration.token}` }, 403]]) {
        const res = await h.request('/api/glove/commands', { as: '', method: 'POST', headers, body: { commandId: randomUUID(), type: 'calendar.connect', payload } })
        assert.equal(res.status, expected)
      }
      await h.command('calendar.connect', { ...payload, confirm: undefined }, { error: 'CONSENT' })
      assert.equal(h.calendarSync.calls.length, calls)
      assert.deepEqual(await rows(h, 'glove_calendar_credentials'), before)
      assert.equal((await tech(h, b.tom.id)).calendarSync ?? null, null)
      await h.command('calendar.connect', payload)
      const connected = await tech(h, b.tom.id), credentials = await rows(h, 'glove_calendar_credentials')
      assert.equal(credentials.length, 1)
      assert.equal(credentials[0].set_at, at)
      const session = await (await h.request('/auth/session')).json()
      assert.equal(credentials[0].set_by, session.operator.id)
      await h.command('calendar.connect', { ...payload, provider: provider === 'google' ? 'microsoft' : 'google', calendarId: 'synthetic-glove-705' }, { error: 'CALENDAR_SYNC' })
      assert.deepEqual(await tech(h, b.tom.id), connected)
      assert.deepEqual(await rows(h, 'glove_calendar_credentials'), credentials)
      const trail = await assertTrail(h, ['calendar.connected'])
      const event = trail.activity.findLast(e => e.kind === 'calendar.connected')
      assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectId], [session.operator.id, 'Olivia Owner', 'owner', at, b.tom.id])
      assert.match(event.summary, /approved.*visit synchronization/)
      for (const table of ['glove_records', 'glove_events', 'glove_commands']) for (const secret of [payload.clientSecret, payload.refreshToken]) assert.ok(!JSON.stringify(await rows(h, table)).includes(secret))
      for (const surface of [await h.state(), trail.activity, trail.exported]) for (const secret of [payload.clientSecret, payload.refreshToken]) assert.ok(!JSON.stringify(surface).includes(secret))
      await h.restart()
      await h.command('calendar.connect', { technicianId: b.tom.id, disconnect: true })
      assert.deepEqual(await rows(h, 'glove_calendar_credentials'), [])
    }
    const revoked = await h.person('Synthetic former calendar owner', 'owner')
    await h.command('role.set', { operatorId: revoked.id, role: 'office' })
    await revoked.run('calendar.connect', connection(b.tom, 'google'), { error: 'FORBIDDEN' })
  } finally { await h.close() }
}

export async function minimalEventDisclosure() {
  const h = await installation({ at })
  try {
    const b = await business(h)
    await h.command('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'synthetic-glove-private-notes' })
    const j = await job(b)
    let lastBooking
    for (const provider of ['google', 'microsoft']) for (const details of [false, true]) {
      await h.command('calendar.connect', connection(b.tom, provider, details))
      const day = provider === 'google' ? (details ? '2026-11-06' : '2026-11-05') : (details ? '2026-11-10' : '2026-11-09')
      const payload = booking(j, b.tom, day), commandId = randomUUID()
      let v = await b.dispatcher.run('visit.book', payload, { commandId })
      lastBooking = { payload, commandId }
      v = await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '11:00', end: '12:00', reason: 'Private move reason' })
      const sent = writes(h).slice(-2)
      for (const c of sent) {
        assert.equal(provider === 'google' ? c.body.summary : c.body.subject, details ? `Glove visit: ${b.customer.name}` : 'Glove visit')
        assert.equal(provider === 'google' ? c.body.location : c.body.location.displayName, details ? b.site.address : '')
        const safeKeys = provider === 'google' ? ['summary', 'location', 'start', 'end', 'extendedProperties', ...(c.method === 'POST' ? ['id'] : [])] : ['subject', 'location', 'start', 'end', ...(c.method === 'POST' ? ['transactionId'] : [])]
        assert.deepEqual(Object.keys(c.body).sort(), safeKeys.sort(), 'only the documented minimal event fields leave Glove')
        const serialized = JSON.stringify(c.body)
        for (const value of [b.customer.phone, b.customer.email, b.site.accessNotes, 'synthetic-glove-private-notes', j.title, 'Private price line', '876.54', 'Private move reason']) assert.ok(!serialized.includes(value), `private fact excluded: ${value}`)
        if (!details) for (const value of [b.customer.name, b.site.address]) assert.ok(!serialized.includes(value))
        assert.doesNotMatch(serialized, /attendees|organizer|contact|email|phone/i)
        if (provider === 'google') assert.equal(new URL(c.url).searchParams.get('sendUpdates'), 'none')
      }
      await h.command('calendar.connect', { technicianId: b.tom.id, disconnect: true })
    }
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    await h.restart()
    const count = h.calendarSync.calls.length
    await b.dispatcher.run('visit.book', lastBooking.payload, { commandId: lastBooking.commandId, error: 'ERASED' })
    await h.scheduled(at)
    assert.equal(h.calendarSync.calls.length, count, 'disconnected calendars stay stopped after restart')
  } finally { await h.close() }
}

export async function freshBusyTime() {
  for (const provider of ['google', 'microsoft']) {
    const h = await installation({ at })
    try {
      const b = await business(h), j = await job(b)
      await h.command('calendar.connect', connection(b.tom, provider))
      const interval = { start: { dateTime: '2026-11-04T22:00:00.000Z' }, end: { dateTime: '2026-11-04T23:00:00.000Z' }, summary: 'synthetic-glove-private-provider-title', subject: 'synthetic-glove-private-provider-title', attendees: [{ address: 'synthetic-glove-private-contact' }] }
      const allDay = provider === 'google' ? { start: { date: '2026-11-06' }, end: { date: '2026-11-07' } } : { isAllDay: true, start: { dateTime: '2026-11-05T13:00:00', timeZone: 'UTC' }, end: { dateTime: '2026-11-06T13:00:00', timeZone: 'UTC' } }
      const filtered = provider === 'google' ? [{ ...interval, status: 'cancelled' }, { ...interval, transparency: 'transparent' }, { ...interval, extendedProperties: { private: { gloveVisit: 'synthetic-glove-managed' } } }] : [{ ...interval, isCancelled: true }, { ...interval, showAs: 'free' }, { ...interval, transactionId: 'glove-synthetic-managed' }]
      const answer = (values, next) => Response.json(provider === 'google' ? { items: values, ...(next ? { nextPageToken: 'synthetic-glove-page-2' } : {}) } : { value: values, ...(next ? { '@odata.nextLink': next } : {}) })
      h.calendarSync.readReply = ({ url }) => {
        const u = new URL(url), second = u.searchParams.has('pageToken') || u.searchParams.has('skiptoken')
        return second ? answer([interval, allDay]) : answer(filtered, provider === 'google' ? true : url + '&skiptoken=synthetic-glove-page-2')
      }
      let calls = h.calendarSync.calls.length
      await unchanged(h, () => b.dispatcher.run('visit.book', booking(j, b.tom), { error: 'ELIGIBILITY' }))
      assert.equal(h.calendarSync.calls.length - calls, 2, 'booking reads the continuation before deciding availability')
      await unchanged(h, () => b.dispatcher.run('visit.book', booking(j, b.tom, '2026-11-06'), { error: 'ELIGIBILITY' }))
      await b.dispatcher.run('visit.book', booking(j, b.tom, '2026-11-09'))
      assert.deepEqual((await tech(h, b.tom.id)).calendarSync.busy, [{ start: '2026-11-04T22:00:00.000Z', end: '2026-11-04T23:00:00.000Z' }, { start: '2026-11-05T13:00:00.000Z', end: '2026-11-06T13:00:00.000Z' }])
      assert.ok(!JSON.stringify(await rows(h, 'glove_records')).includes('synthetic-glove-private-provider-title'))
      // A fresh provider answer, even at the same pinned instant, changes the next booking decision.
      h.calendarSync.readReply = () => answer([])
      await b.dispatcher.run('visit.book', booking(j, b.tom))
      assert.deepEqual((await tech(h, b.tom.id)).calendarSync.busy, [])
      h.calendarSync.readReply = () => answer(filtered)
      await b.dispatcher.run('visit.book', booking(j, b.tom, '2026-11-10'))
      assert.deepEqual((await tech(h, b.tom.id)).calendarSync.busy, [], 'free, cancelled and Glove-owned events are ignored')
      await h.restart()
      for (const bad of [() => answer([{ start: {}, end: interval.end }]), () => answer([{ ...interval, start: { dateTime: 'unreadable-instant' } }]), () => answer([{ start: interval.end, end: interval.start }]), () => new Response('Authorization revoked', { status: 401 }), () => new Response('Unavailable', { status: 503 }), ({ url }) => answer([], provider === 'google' ? true : url)]) {
        h.calendarSync.readReply = bad
        calls = h.calendarSync.calls.length
        await unchanged(h, () => b.dispatcher.run('visit.book', booking(j, b.tom, '2026-11-11'), { error: 'CALENDAR_SYNC' }))
        assert.ok(h.calendarSync.calls.length > calls)
        assert.ok(h.calendarSync.calls.length - calls <= 20)
      }
      assert.equal(h.calendarSync.calls.length - calls, 20, 'continuations are bounded and fail closed')
    } finally { await h.close() }
  }
}

export async function independentCalendars() {
  for (const provider of ['google', 'microsoft']) {
    const h = await installation({ at })
    try {
      const b = await business(h), url = 'https://calendar.google.com/calendar/ical/synthetic-glove-706/private/basic.ics'
      h.calendars.set(url, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'SUMMARY:Private appointment', 'DTSTART:20261104T220000Z', 'DTEND:20261104T230000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'))
      await b.tomPerson.run('technician.calendar', { technicianId: b.tom.id, url })
      await h.command('calendar.connect', connection(b.tom, provider))
      h.calendarSync.busy = [{ start: '2026-11-05T22:00:00.000Z', end: '2026-11-05T23:00:00.000Z' }]
      await h.restart()
      await b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id })
      await b.dispatcher.run('calendar.read', { technicianId: b.tom.id })
      let t = await tech(h, b.tom.id)
      assert.deepEqual(t.calendar.busy, [{ start: '2026-11-04T22:00:00.000Z', end: '2026-11-04T23:00:00.000Z' }])
      assert.deepEqual(t.calendarSync.busy, h.calendarSync.busy)
      const delegated = t.calendarSync
      await b.tomPerson.run('technician.calendar', { technicianId: b.tom.id, url: null })
      await h.restart()
      await b.dispatcher.run('calendar.read', { technicianId: b.tom.id })
      t = await tech(h, b.tom.id)
      assert.equal(t.calendar, null)
      assert.deepEqual(t.calendarSync, delegated)
      await b.tomPerson.run('technician.calendar', { technicianId: b.tom.id, url })
      await h.command('calendar.connect', { technicianId: b.tom.id, disconnect: true })
      const count = h.calendarSync.calls.length
      await h.restart()
      await b.dispatcher.run('technician.calendarRead', { technicianId: b.tom.id })
      t = await tech(h, b.tom.id)
      assert.equal(t.calendarSync, null)
      assert.deepEqual(t.calendar.busy, [{ start: '2026-11-04T22:00:00.000Z', end: '2026-11-04T23:00:00.000Z' }])
      await b.dispatcher.run('calendar.read', { technicianId: b.tom.id }, { error: 'CALENDAR_SYNC' })
      assert.equal(h.calendarSync.calls.length, count, 'iCal read and delegated refusal never touch delegated transport')
      assert.equal((await (await h.request(`/api/glove/technicians/${b.tom.id}/calendar`)).json()).url, url)
    } finally { await h.close() }
  }
}

test('DISP-008 lifecycle: both providers receive exact visit times once and busy bookings change nothing', exactCalendarLifecycle)
test('DISP-008 authority: only a confirmed unscoped Owner connects one calendar with attributable consent', ownerConnectionAuthority)
test('DISP-008 disclosure: details are opt-in and requests exclude contact channels and attendees', minimalEventDisclosure)
test('DISP-008 availability: each booking reads bounded provider pages and unreadable busy time fails closed', freshBusyTime)
test('DISP-008 independence: private iCal and delegated calendars survive restart and disconnect separately', independentCalendars)
