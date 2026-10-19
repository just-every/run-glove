// PLAN-001 recurring jobs through the command, state and timeline doors: a
// quarterly series, one visit skipped and another moved, the rule changed from a
// date, the first-Monday and April-and-October rules, a conflict review and the
// rolling horizon.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

test('PLAN-001 a quarterly series: skip one, move another, change the rule from a date, and every generated visit', async (t) => {
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
})
