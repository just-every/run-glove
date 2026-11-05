// PLAN-001 recurring jobs through the command, state and timeline doors: a
// quarterly series, one visit skipped and another moved, the rule changed from a
// date, the first-Monday and April-and-October rules, a conflict review and the
// rolling horizon.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, id, assertTrail } from './harness.mjs'

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

test('PLAN-001, PLAN-006 a quarterly series: skip one, move another, change the rule from a date, and every generated visit', async (t) => {
  const h = await installation({ at: '2026-11-05T12:00:00.000Z' })
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
  const today = '2026-11-05'
  const rolled = await b.dispatcher.run('series.create', { jobId: weekly.id, version: weekly.version, rule: { unit: 'week' }, date: today, start: '06:00', end: '06:30', technicianId: b.tom.id, horizonDays: 14 })
  assert.equal(rolled.series.through, addDays(today, 14))
  assert.deepEqual((await visitsOf(weekly)).map(v => v[0]), [today, addDays(today, 7), addDays(today, 14)])

  // Same-date revisions must preserve each protected occurrence, even when the
  // new rule would otherwise book its original date again.
  await preservedOccurrences(h, b, newJob)
  await legacyReplacements(h, b, newJob)
})

async function preservedOccurrences(h, b, newJob) {
  const at = '2026-11-05T12:00:00.000Z'
  const recorder = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
  const firstRule = { unit: 'month', interval: 3, months: null, day: null, nth: null, weekday: null }
  let job = await newJob()
  const createId = id()
  const create = { jobId: job.id, version: job.version, rule: { unit: 'month', interval: 3 }, date: '2027-01-15', start: '15:00', end: '16:00', technicianId: b.priya.id, until: '2028-10-15', horizonDays: 730 }
  job = await b.dispatcher.run('series.create', create, { commandId: createId })
  const createdJob = structuredClone(job)
  const series = structuredClone(job.series)
  assert.deepEqual(series.revisions, [{ n: 1, from: '2027-01-15', rule: firstRule, start: '15:00', end: '16:00', technicianId: b.priya.id, by: recorder, at }])
  // Notification bookkeeping is qualified by COMM-003; retain every occurrence field.
  const occurrenceRecord = ({ notice, ...visit }) => visit
  const rows = async () => (await h.state()).visits.filter(v => v.jobId === job.id).map(occurrenceRecord).sort((a, b) => a.series.occurrence.localeCompare(b.series.occurrence) || a.series.rev - b.series.rev)
  // UTC values are enumerated independently, including Sydney daylight saving.
  const dates = [
    ['2027-01-15', '2027-01-15T04:00:00.000Z', '2027-01-15T05:00:00.000Z'],
    ['2027-04-15', '2027-04-15T05:00:00.000Z', '2027-04-15T06:00:00.000Z'],
    ['2027-07-15', '2027-07-15T05:00:00.000Z', '2027-07-15T06:00:00.000Z'],
    ['2027-10-15', '2027-10-15T04:00:00.000Z', '2027-10-15T05:00:00.000Z'],
    ['2028-01-15', '2028-01-15T04:00:00.000Z', '2028-01-15T05:00:00.000Z'],
    ['2028-04-15', '2028-04-15T05:00:00.000Z', '2028-04-15T06:00:00.000Z'],
    ['2028-07-15', '2028-07-15T05:00:00.000Z', '2028-07-15T06:00:00.000Z'],
    ['2028-10-15', '2028-10-15T04:00:00.000Z', '2028-10-15T05:00:00.000Z'],
  ]
  const original = await rows()
  assert.equal(original.length, 8)
  assert.equal(new Set(original.map(v => v.id)).size, 8)
  for (const [date, startAt, endAt] of dates) {
    const v = original.find(v => v.series.occurrence === date)
    assert.ok(v, `generated ${date}`)
    const slot = { technicianId: b.priya.id, startAt, endAt, local: { date, start: '15:00', end: '16:00', timezone: 'Australia/Sydney' } }
    assert.deepEqual(v, { id: v.id, version: 1, createdAt: at, jobId: job.id, ...slot, status: 'booked', series: { rev: 1, occurrence: date }, assignments: [{ ...slot, by: recorder, at, reason: 'Series every 3 months on day 15', reviewedConflicts: [], unreviewedConflicts: [], proposalId: null, grantId: null }], arrival: null, completion: null, lateEvidence: [] })
  }
  const [earlier, skipped, moved, started, completed, ...untouched] = original
  const skipId = id(), moveId = id()
  const skip = { visitId: skipped.id, version: skipped.version, reason: 'Customer away this quarter' }
  const move = { visitId: moved.id, version: moved.version, date: '2027-07-20', start: '16:00', end: '17:00', technicianId: b.tom.id, reason: 'Customer requested Tom next Tuesday' }
  const cancelled = occurrenceRecord(await b.dispatcher.run('visit.cancel', skip, { commandId: skipId }))
  assert.deepEqual(cancelled, { ...skipped, version: 2, status: 'cancelled', cancelled: { by: recorder, at, reason: skip.reason } })
  assert.deepEqual((await h.state()).jobs.find(j => j.id === job.id).series, series, 'skip leaves every series field unchanged')
  const shifted = occurrenceRecord(await b.dispatcher.run('visit.change', move, { commandId: moveId }))
  const movedSlot = { technicianId: b.tom.id, startAt: '2027-07-20T06:00:00.000Z', endAt: '2027-07-20T07:00:00.000Z', local: { date: '2027-07-20', start: '16:00', end: '17:00', timezone: 'Australia/Sydney' } }
  assert.deepEqual(shifted, { ...moved, ...movedSlot, version: 2, assignments: [moved.assignments[0], { ...movedSlot, by: recorder, at, reason: move.reason, reviewedConflicts: [], grantId: null }] })
  assert.deepEqual((await h.state()).jobs.find(j => j.id === job.id).series, series, 'move leaves every series field unchanged')
  await b.priyaPerson.run('visit.arrive', { visitId: started.id, deviceTime: '2027-10-15T04:01:00.000Z' })
  await b.priyaPerson.run('visit.arrive', { visitId: completed.id, deviceTime: '2028-01-15T04:02:00.000Z' })
  await b.priyaPerson.run('visit.complete', { visitId: completed.id, deviceTime: '2028-01-15T05:00:00.000Z', summary: 'Protected completed quarterly service', signoff: { absentReason: 'Customer left for work' } })
  const protectedRows = (await rows()).filter(v => [earlier.id, skipped.id, moved.id, started.id, completed.id].includes(v.id))
  assert.equal(protectedRows.find(v => v.id === started.id).status, 'arrived')
  assert.equal(protectedRows.find(v => v.id === completed.id).status, 'completed')
  const captures = (await h.state()).captures.filter(c => c.jobId === job.id)
  const domain = async () => { const s = await h.state(); return { jobs: s.jobs, visits: s.visits, captures: s.captures, invoices: s.invoices } }
  const refused = async (person, type, payload, error, opts = {}) => {
    const before = await domain()
    await person.run(type, payload, { ...opts, error })
    assert.deepEqual(await domain(), before, `${type} ${error} leaves domain records unchanged`)
  }
  job = (await h.state()).jobs.find(j => j.id === job.id)
  const changeId = id()
  const change = { jobId: job.id, version: job.version, from: '2027-04-15', start: '13:00', end: '14:00', technicianId: b.tom.id, reason: 'Customer requests Tom after lunch from April' }
  await refused(b.dispatcher, 'series.change', { ...change, version: job.version - 1 }, 'STALE')
  await refused(b.dispatcher, 'series.change', { ...change, from: '2027-01-14' }, 'INPUT')
  await refused(b.dispatcher, 'series.change', { ...change, reason: '' }, 'INPUT')
  await refused(b.dispatcher, 'visit.cancel', skip, 'STALE')
  await refused(b.dispatcher, 'visit.change', move, 'STALE')
  const viewer = await h.person('Victor Viewer', 'viewer')
  const subcontractor = await h.person('Sasha Subcontractor', 'subcontractor')
  for (const person of [b.office, b.agent, b.priyaPerson, b.tomPerson, viewer, subcontractor]) {
    await refused(person, 'series.create', create, 'FORBIDDEN')
    await refused(person, 'series.change', change, 'FORBIDDEN')
    await refused(person, 'visit.cancel', { visitId: untouched[0].id, version: untouched[0].version, reason: 'Excluded skip' }, 'FORBIDDEN')
    await refused(person, 'visit.change', { visitId: untouched[0].id, version: untouched[0].version, start: '18:00', end: '19:00', reason: 'Excluded move' }, 'FORBIDDEN')
  }
  job = await b.dispatcher.run('series.change', change, { commandId: changeId })
  assert.equal(job.series.until, '2028-10-15')
  assert.equal(job.series.horizonDays, 730)
  assert.equal(job.series.through, '2028-10-15')
  assert.deepEqual(job.series.missed, [])
  const changed = await rows()
  assert.equal(changed.length, 11, 'only the three eligible untouched occurrences get replacement visits')
  assert.deepEqual(job.series.revisions, [series.revisions[0], { n: 2, from: '2027-04-15', rule: firstRule, start: '13:00', end: '14:00', technicianId: b.tom.id, by: recorder, at, reason: change.reason }])
  assert.deepEqual(changed.filter(v => protectedRows.some(p => p.id === v.id)), protectedRows, 'earlier, skipped, moved, started and completed visits stay byte for byte')
  assert.deepEqual((await h.state()).captures.filter(c => c.jobId === job.id), captures, 'protected field evidence survives')
  for (const old of untouched) {
    assert.deepEqual(changed.find(v => v.id === old.id), { ...old, version: 2, status: 'cancelled', cancelled: { by: recorder, at, reason: `Series changed from ${change.from}: ${change.reason}`, replacedByRevision: 2 } })
  }
  const replacements = changed.filter(v => !original.some(o => o.id === v.id))
  assert.equal(new Set(replacements.map(v => v.id)).size, 3)
  for (const [date, startAt, endAt] of [
    ['2028-04-15', '2028-04-15T03:00:00.000Z', '2028-04-15T04:00:00.000Z'],
    ['2028-07-15', '2028-07-15T03:00:00.000Z', '2028-07-15T04:00:00.000Z'],
    ['2028-10-15', '2028-10-15T02:00:00.000Z', '2028-10-15T03:00:00.000Z'],
  ]) {
    const v = replacements.find(v => v.series.occurrence === date)
    assert.ok(v, `replacement for ${date}`)
    const slot = { technicianId: b.tom.id, startAt, endAt, local: { date, start: '13:00', end: '14:00', timezone: 'Australia/Sydney' } }
    assert.deepEqual(v, { id: v.id, version: 1, createdAt: at, jobId: job.id, ...slot, status: 'booked', series: { rev: 2, occurrence: date }, assignments: [{ ...slot, by: recorder, at, reason: 'Series every 3 months on day 15', reviewedConflicts: [], unreviewedConflicts: [], proposalId: null, grantId: null }], arrival: null, completion: null, lateEvidence: [] })
  }
  const stable = await domain()
  assert.deepEqual(await b.dispatcher.run('series.create', create, { commandId: createId }), createdJob)
  assert.deepEqual(occurrenceRecord(await b.dispatcher.run('visit.cancel', skip, { commandId: skipId })), cancelled)
  assert.deepEqual(occurrenceRecord(await b.dispatcher.run('visit.change', move, { commandId: moveId })), shifted)
  assert.deepEqual(await b.dispatcher.run('series.change', change, { commandId: changeId }), job)
  assert.deepEqual(await domain(), stable, 'all command replays preserve the exact records')
  await b.office.run('customer.save', { name: 'synthetic-glove-42 later command' })
  assert.deepEqual(await domain(), stable, 'later public commands never regenerate protected occurrences')
  await h.restart()
  assert.deepEqual(await domain(), stable, 'actual Worker restart retains every occurrence and its history')
  await b.dispatcher.run('series.change', change, { commandId: changeId })
  await b.office.run('customer.save', { name: 'synthetic-glove-43 command after restart' })
  assert.deepEqual(await domain(), stable, 'replay and rolling generation after restart create no duplicates')
  await refused(b.dispatcher, 'series.change', change, 'STALE')
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'office' })
  await refused(b.dispatcher, 'series.change', { ...change, version: job.version }, 'FORBIDDEN')
  await refused(b.dispatcher, 'series.change', change, 'FORBIDDEN', { commandId: changeId })
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
  const { activity, exported } = await assertTrail(h, ['series.created', 'series.changed', 'visit.cancelled', 'visit.changed'])
  const timelineResponse = await h.request(`/api/glove/jobs/${job.id}/timeline`)
  assert.equal(timelineResponse.status, 200)
  const timeline = (await timelineResponse.json()).events
  for (const [commandId, kind, subjectId, reason] of [
    [createId, 'series.created', job.id, 'repeat every 3 months'],
    [skipId, 'visit.cancelled', skipped.id, `skipped in the series: ${skip.reason}`],
    [moveId, 'visit.changed', moved.id, move.reason],
    [changeId, 'series.changed', job.id, `${change.reason}; 3 untouched visits replaced`],
  ]) {
    const matches = timeline.filter(e => e.commandId === commandId && e.kind === kind)
    assert.equal(matches.length, 1, 'each explicit action has one attributable timeline event')
    const event = matches[0]
    assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectId, event.jobId], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at, subjectId, job.id])
    assert.ok(event.summary.includes(reason), event.summary)
    assert.deepEqual(activity.find(e => e.id === event.id), event)
    const kept = exported.timeline.find(e => e.id === event.id)
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.subject_id, kept.job_id, kept.summary], [b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at, commandId, subjectId, job.id, event.summary])
    if (kind === 'series.changed') assert.deepEqual(JSON.parse(kept.data).replaced.sort(), untouched.map(v => v.id).sort())
  }
}


async function legacyReplacements(h, b, newJob) {
  let job = await newJob()
  const rows = async () => (await h.state()).visits.filter(v => v.jobId === job.id).map(({ notice, ...v }) => v).sort((a, b) => a.series.occurrence.localeCompare(b.series.occurrence) || a.series.rev - b.series.rev)
  job = await b.dispatcher.run('series.create', { jobId: job.id, version: job.version, rule: { unit: 'month', interval: 3 }, date: '2027-01-15', start: '18:00', end: '19:00', technicianId: b.tom.id, until: '2027-12-31', horizonDays: 730 })
  const original = await rows()
  job = await b.dispatcher.run('series.change', { jobId: job.id, version: job.version, from: '2027-04-15', rule: { unit: 'month', interval: 3, day: 20 }, reason: 'Quarterly visits on the twentieth' })
  assert.deepEqual((await rows()).filter(v => v.status === 'booked').map(v => v.local.date), ['2027-01-15', '2027-04-20', '2027-07-20', '2027-10-20'])
  // Emulate an upgrade from the stored format that predates replacement markers.
  // Real commands made these cancellations and their immutable timeline events;
  // only the new optional marker is removed, with no fabricated business facts.
  await h.db.prepare("UPDATE glove_records SET data=json_remove(data,'$.cancelled.replacedByRevision') WHERE kind='visits' AND json_extract(data,'$.jobId')=? AND json_extract(data,'$.status')='cancelled'").bind(job.id).run()
  const legacy = await rows()
  assert.equal(legacy.filter(v => v.status === 'cancelled').length, 3)
  assert.ok(legacy.filter(v => v.status === 'cancelled').every(v => v.cancelled.replacedByRevision === undefined))
  await h.restart()
  const commandId = id()
  const change = { jobId: job.id, version: job.version, from: '2027-04-15', rule: { unit: 'month', interval: 3, day: 15 }, reason: 'Quarterly visits back on the fifteenth' }
  job = await b.dispatcher.run('series.change', change, { commandId })
  const changed = await rows(), booked = changed.filter(v => v.status === 'booked')
  assert.deepEqual(booked.map(v => [v.series.occurrence, v.series.rev, v.local.date, v.local.start, v.local.end, v.technicianId]), [
    ['2027-01-15', 1, '2027-01-15', '18:00', '19:00', b.tom.id],
    ['2027-04-15', 3, '2027-04-15', '18:00', '19:00', b.tom.id],
    ['2027-07-15', 3, '2027-07-15', '18:00', '19:00', b.tom.id],
    ['2027-10-15', 3, '2027-10-15', '18:00', '19:00', b.tom.id],
  ], 'returning to the fifteenth after upgrade books all three replacement visits')
  assert.equal(changed.length, 10, 'the earlier visit, six cancellations and three replacements remain')
  assert.deepEqual(changed.find(v => v.id === original[0].id), legacy.find(v => v.id === original[0].id))
  assert.deepEqual(changed.filter(v => legacy.some(old => old.id === v.id && old.status === 'cancelled')), legacy.filter(v => v.status === 'cancelled'), 'legacy cancellations remain unchanged')
  for (const old of legacy.filter(v => v.status === 'booked' && v.series.rev === 2)) {
    const cancelled = changed.find(v => v.id === old.id)
    assert.deepEqual(cancelled, { ...old, version: old.version + 1, status: 'cancelled', cancelled: { by: { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, at: '2026-11-05T12:00:00.000Z', reason: `Series changed from ${change.from}: ${change.reason}`, replacedByRevision: 3 } })
  }
  assert.equal(new Set(booked.map(v => v.id)).size, 4)
  assert.ok(booked.filter(v => v.series.rev === 3).every(v => !legacy.some(old => old.id === v.id)))
  await b.dispatcher.run('series.change', change, { commandId })
  await b.office.run('customer.save', { name: 'synthetic-glove-44 command after upgrade' })
  assert.deepEqual(await rows(), changed, 'replay and later generation retain the same replacements')
  await h.restart()
  await b.office.run('customer.save', { name: 'synthetic-glove-45 command after restart' })
  assert.deepEqual(await rows(), changed, 'restart does not duplicate or resurrect legacy occurrences')
  const timeline = (await (await h.request(`/api/glove/jobs/${job.id}/timeline`)).json()).events
  const event = timeline.find(e => e.commandId === commandId && e.kind === 'series.changed')
  assert.ok(event.summary.includes('3 untouched visits replaced'))
  const { activity, exported } = await assertTrail(h, ['series.changed'])
  assert.deepEqual(activity.find(e => e.id === event.id), event)
  assert.equal(exported.timeline.find(e => e.id === event.id).command_id, commandId)
}
