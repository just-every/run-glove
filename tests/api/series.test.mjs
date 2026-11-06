// PLAN-001 recurring jobs through the command, state and timeline doors: a
// quarterly series, one visit skipped and another moved, the rule changed from a
// date, the first-Monday and April-and-October rules, a conflict review and the
// rolling horizon.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

test('PLAN-001, PLAN-006 a quarterly series: skip one, move another, change the rule from a date, and every generated visit', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const newJob = async () => b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const visitsOf = async job => (await h.state()).visits.filter(v => v.jobId === job.id).sort((x, y) => x.local.date < y.local.date ? -1 : 1).map(v => [v.local.date, v.local.start, v.status, v.series?.rev ?? null])

  // Quarterly from 15 January, 9–10 am with Priya, through the end of 2027.
  let job = await newJob()
  await b.priyaPerson.run('series.create', { jobId: job.id, version: job.version, rule: { unit: 'month', interval: 3 }, date: '2027-01-15', start: '09:00', end: '10:00', technicianId: b.priya.id }, { error: 'FORBIDDEN' })
  await b.dispatcher.run('series.create', { jobId: job.id, version: job.version, rule: { unit: 'month', interval: 3, months: [1, 4] }, date: '2027-01-15', start: '09:00', end: '10:00', technicianId: b.priya.id }, { error: 'INPUT' })
  job = await b.dispatcher.run('series.create', { jobId: job.id, version: job.version, rule: { unit: 'month', interval: 3 }, date: '2027-01-15', start: '09:00', end: '10:00', technicianId: b.priya.id, until: '2027-12-31', horizonDays: 730 })
  assert.equal(job.series.through, '2027-12-31')
  assert.deepEqual(await visitsOf(job), [['2027-01-15', '09:00', 'booked', 1], ['2027-04-15', '09:00', 'booked', 1], ['2027-07-15', '09:00', 'booked', 1], ['2027-10-15', '09:00', 'booked', 1]])
  await b.dispatcher.run('series.create', { jobId: job.id, version: job.version, rule: { unit: 'week' }, date: '2027-01-15', start: '09:00', end: '10:00', technicianId: b.priya.id }, { error: 'SERIES_EXISTS' })

  // Skip April, move July to the 20th at 10 am: the series is unchanged and never books April again.
  const visit = async date => (await h.state()).visits.find(v => v.jobId === job.id && v.local.date === date && v.status === 'booked')
  const april = await visit('2027-04-15'), july = await visit('2027-07-15')
  await b.dispatcher.run('visit.cancel', { visitId: april.id, version: april.version, reason: 'Customer away for Easter' })
  await b.dispatcher.run('visit.change', { visitId: july.id, version: july.version, date: '2027-07-20', start: '10:00', end: '11:00', reason: 'Customer asked for the 20th' })
  await b.office.run('customer.save', { name: 'Any later command' })
  assert.deepEqual(await visitsOf(job), [['2027-01-15', '09:00', 'booked', 1], ['2027-04-15', '09:00', 'cancelled', 1], ['2027-07-20', '10:00', 'booked', 1], ['2027-10-15', '09:00', 'booked', 1]])
  const timeline = async () => (await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()).events.map(e => e.summary)
  assert.ok((await timeline()).some(s => s.includes('skipped in the series: Customer away for Easter')))

  // A visit completed in the series leaves the recurring job open.
  const january = await visit('2027-01-15')
  await b.priyaPerson.run('visit.arrive', { visitId: january.id, deviceTime: '2027-01-14T22:00:00Z' })
  await b.priyaPerson.run('visit.complete', { visitId: january.id, deviceTime: '2027-01-14T23:00:00Z', summary: 'Quarterly service', signoff: { absentReason: 'Tenant let us in' } })
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'open')

  // From 1 July: the first Monday of every second month, 8–9 am. The past, the moved visit and the skip stay; October is replaced.
  job = (await h.state()).jobs.find(j => j.id === job.id)
  await b.dispatcher.run('series.change', { jobId: job.id, version: job.version, from: '2027-01-01', rule: { unit: 'week' }, reason: 'Too early' }, { error: 'INPUT' })
  job = await b.dispatcher.run('series.change', { jobId: job.id, version: job.version, from: '2027-07-01', rule: { unit: 'month', interval: 2, nth: 1, weekday: 'monday' }, start: '08:00', end: '09:00', reason: 'Customer prefers Monday mornings' })
  assert.deepEqual(job.series.revisions.map(r => [r.n, r.from]), [[1, '2027-01-15'], [2, '2027-07-01']])
  assert.deepEqual(await visitsOf(job), [
    ['2027-01-15', '09:00', 'completed', 1], ['2027-04-15', '09:00', 'cancelled', 1],
    ['2027-07-05', '08:00', 'booked', 2], ['2027-07-20', '10:00', 'booked', 1],
    ['2027-09-06', '08:00', 'booked', 2], ['2027-10-15', '09:00', 'cancelled', 1], ['2027-11-01', '08:00', 'booked', 2],
  ])
  assert.ok((await timeline()).some(s => s.includes('changed') && s.includes('from 2027-07-01 to repeat every 2 months on the first monday') && s.includes('1 untouched visit replaced')))

  // Twice a year in April and October on the 10th, with Tom.
  const twice = await newJob()
  await b.dispatcher.run('series.create', { jobId: twice.id, version: twice.version, rule: { unit: 'month', months: [4, 10], day: 10 }, date: '2027-01-01', start: '13:00', end: '14:00', technicianId: b.tom.id, until: '2028-06-30', horizonDays: 730 })
  assert.deepEqual((await visitsOf(twice)).map(v => v[0]), ['2027-04-10', '2027-10-10', '2028-04-10'])

  // The first Monday of each month; booking over Priya's own visit needs a conflict review first.
  const mondays = await newJob()
  const other = await newJob()
  await b.dispatcher.run('visit.book', { jobId: other.id, technicianId: b.priya.id, date: '2027-03-01', start: '09:30', end: '10:30' })
  const make = acknowledge => b.dispatcher.run('series.create', { jobId: mondays.id, version: mondays.version, rule: { unit: 'month', nth: 1, weekday: 'monday' }, date: '2027-02-01', start: '09:00', end: '10:00', technicianId: b.priya.id, until: '2027-05-31', horizonDays: 730, acknowledge }, acknowledge ? {} : { error: 'CONFLICT_REVIEW' })
  const review = await make()
  await make(review.details.conflicts.map(c => c.code))
  assert.deepEqual((await visitsOf(mondays)).map(v => v[0]), ['2027-02-01', '2027-03-01', '2027-04-05', '2027-05-03'])

  // The rolling horizon: an open-ended weekly series books only through today plus its horizon.
  const weekly = await newJob()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const rolled = await b.dispatcher.run('series.create', { jobId: weekly.id, version: weekly.version, rule: { unit: 'week' }, date: today, start: '06:00', end: '06:30', technicianId: b.tom.id, horizonDays: 14 })
  assert.equal(rolled.series.through, addDays(today, 14))
  assert.deepEqual((await visitsOf(weekly)).map(v => v[0]), [today, addDays(today, 7), addDays(today, 14)])
  await declinedIncludedSeries()
})

// PLAN-009 AP5: the recurring door cannot revive a customer's declined ordinal.
// Extend this existing series registration; all ordinary series controls above stay.
async function declinedIncludedSeries() {
  const h = await installation({ at: '2030-07-01T12:00:00Z' })
  try {
    await h.command('business.save', { name: 'Synthetic Glove Service', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Inspection', unitPrice: '149.00', tax: 'TAXABLE' })
    const plan = await h.command('plan.save', { name: 'Quarterly Care', price: '228.00', termMonths: 12, includedVisits: 4, visitServiceId: service.id })
    const dispatcher = await h.person('Series Dispatcher', 'dispatcher'), office = await h.person('Series Office', 'office'), field = await h.person('Series Technician', 'technician')
    const tech = await h.command('technician.save', { name: field.name, operatorId: field.id })
    const customer = await h.command('customer.save', { name: 'Synthetic Customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '10 Service Street', zip: '78704' })
    const agreement = await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: '2030-01-01' })
    const read = async path => { const res = await h.request(path); assert.equal(res.status, 200); return res.json() }
    const download = async () => { const { exportedAt, ...domain } = await read('/api/glove/export'); return domain }
    const unchanged = async action => {
      const before = await download(), result = await action()
      assert.deepEqual(await download(), before, 'refusal preserves the full export, including visits, assignments, series, answers and events')
      return result
    }
    const currentJob = async id => (await h.state()).jobs.find(j => j.id === id)
    const counts = async expected => {
      const row = (await read('/api/glove/agreements')).agreements.find(a => a.id === agreement.id)
      assert.deepEqual([row.entitlements.used, row.entitlements.declined, row.entitlements.left], expected)
    }
    const jobInput = index => ({ customerId: customer.id, siteId: site.id, agreementId: agreement.id, agreementVisitIndex: index, title: 'Included inspection' })
    const schedule = job => ({ jobId: job.id, version: job.version, technicianId: tech.id, date: '2030-07-02', start: '09:00', end: '09:30', rule: { unit: 'week' }, until: '2030-07-02', horizonDays: 7 })
    const decline = async (index, version) => office.run('agreement.decline', { agreementId: agreement.id, version, index, method: 'phone', customerName: customer.name, reason: 'Customer explicitly declines this inspection' })

    // The calibration trigger: retain an open included job after cancelling its booking.
    const job = await dispatcher.run('job.create', jobInput(2))
    const booking = { jobId: job.id, technicianId: tech.id, date: '2030-07-02', start: '09:00', end: '09:30' }
    const visit = await dispatcher.run('visit.book', booking)
    await dispatcher.run('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Customer cancels the booking' })
    await decline(2, agreement.version)
    await counts([0, 1, 3])
    assert.equal((await currentJob(job.id)).status, 'open')
    for (const person of [{ run: h.command }, dispatcher, office]) {
      await unchanged(() => person.run('visit.book', booking, { error: 'ENTITLEMENT' }))
      await unchanged(() => person.run('job.create', jobInput(2), { error: 'ENTITLEMENT' }))
    }
    const payload = schedule(await currentJob(job.id)), commandId = crypto.randomUUID()
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      await unchanged(() => dispatcher.run('series.create', payload, { error: 'ENTITLEMENT', commandId }))
      await counts([0, 1, 3])
    }

    // A series that existed before the decline must neither change nor roll forward.
    let recurring = await office.run('job.create', jobInput(1))
    recurring = await dispatcher.run('series.create', { ...schedule(recurring), start: '10:00', end: '10:30', until: null })
    const generated = (await h.state()).visits.filter(v => v.jobId === recurring.id)
    assert.deepEqual(generated.map(v => v.local.date), ['2030-07-02'], 'the initial seven-day horizon generates only its in-range occurrence')
    for (const v of generated) await dispatcher.run('visit.cancel', { visitId: v.id, version: v.version, reason: 'Customer cancels before explicitly declining' })
    await decline(1, 2)
    await counts([0, 2, 2])
    recurring = await currentJob(recurring.id)
    await unchanged(() => dispatcher.run('series.change', { jobId: recurring.id, version: recurring.version, from: '2030-07-02', start: '11:00', end: '11:30', reason: 'Try another time' }, { error: 'ENTITLEMENT' }))
    const kept = await download()
    await h.setTime('2030-07-02T12:00:00Z')
    await office.run('customer.save', { name: 'Synthetic Rolling Tick' })
    const rolled = await download()
    for (const key of ['jobs', 'visits', 'agreements']) assert.deepEqual(rolled[key], kept[key], `rolling after a later command preserves declined ${key}`)
    assert.deepEqual(rolled.timeline.filter(e => e.kind.startsWith('series.')), kept.timeline.filter(e => e.kind.startsWith('series.')), 'the rolling horizon creates no series event')
    await h.scheduled('2030-07-02T12:00:00Z')
    const scheduled = await download()
    for (const key of ['jobs', 'visits', 'agreements']) assert.deepEqual(scheduled[key], kept[key], `scheduled generation preserves declined ${key}`)
    await counts([0, 2, 2])

    // An undeclined sibling still uses the same generator, and consumes only its own ordinal.
    let control = await office.run('job.create', jobInput(0))
    control = await dispatcher.run('series.create', { ...schedule(control), date: '2030-07-03', until: '2030-07-03' })
    const controlVisit = (await h.state()).visits.find(v => v.jobId === control.id && v.status === 'booked')
    assert.ok(controlVisit)
    await field.run('visit.arrive', { visitId: controlVisit.id, deviceTime: controlVisit.startAt })
    await field.run('visit.complete', { visitId: controlVisit.id, deviceTime: controlVisit.endAt, summary: 'Undeclined inspection complete', signoff: { absentReason: 'Customer away' } })
    await counts([1, 2, 1])
    assert.equal((await currentJob(control.id)).status, 'completed', 'a finite series with every visit completed retains its existing job completion behavior')
    assert.deepEqual((await read('/api/glove/due-visits')).visits.filter(v => v.agreementId === agreement.id).map(v => v.index), [], 'only the future undeclined October ordinal remains, outside the current due list')
  } finally { await h.close() }
}
