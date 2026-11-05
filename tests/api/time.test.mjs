import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote } from './harness.mjs'

test('a linked technician clocks a first shift, reads only their own timesheet, and the desk retains ordered corrections after restart', async t => {
  const h = await installation({ at: '2026-11-05T12:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const at = (date, time) => `${date}T${time}:00+11:00`
  {
    await h.command('technician.save', { ...b.priya, costRate: '42.50' })
    const before = await b.priyaPerson.state()
    assert.deepEqual(before.visits, [])
    assert.deepEqual(before.technicians.map(x => [x.id, x.operatorId, x.costRate]), [[b.priya.id, b.priyaPerson.id, undefined]])
    assert.deepEqual(before.customers, [])
    assert.deepEqual(before.jobs, [])
    const readWeek = async () => (await h.request('/api/glove/timesheets?week=2026-11-02', { as: b.priyaPerson.cookie })).json()
    let sheet = await readWeek()
    assert.deepEqual(sheet.timesheets.map(x => [x.technicianId, x.hours.worked, x.onTheClock]), [[b.priya.id, '0.00', false]])
    const commandId = crypto.randomUUID(), payload = { deviceTime: at('2026-11-02', '08:00') }
    await b.priyaPerson.run('clock.in', payload, { commandId })
    await b.priyaPerson.run('clock.in', payload, { commandId })
    sheet = await readWeek()
    assert.equal(sheet.timesheets[0].onTheClock, true)
    const dashboard = await h.request('/api/glove/dashboard').then(r => r.json())
    assert.ok(JSON.stringify(dashboard).includes(b.priya.id), 'the desk sees this unassigned technician on the clock')
    await b.tomPerson.run('clock.in', { deviceTime: at('2026-11-02', '09:00') })
    await b.tomPerson.run('clock.out', { deviceTime: at('2026-11-02', '10:00') })
    await b.priyaPerson.run('clock.out', { deviceTime: at('2026-11-02', '16:00') })
    sheet = await readWeek()
    assert.deepEqual(sheet.timesheets.map(x => [x.technicianId, x.hours.worked, x.hours.job, x.hours.travel, x.onTheClock]), [[b.priya.id, '8.00', '0.00', '0.00', false]])
    assert.equal((await b.priyaPerson.state()).times.length, 1, 'the replay created no duplicate and another technician’s time stays private')
    await h.command('timesheet.approve', { technicianId: b.priya.id, weekStart: '2026-11-02' })
    assert.equal((await readWeek()).timesheets[0].status, 'approved')
    const payroll = await h.request('/api/glove/reports/payroll.json?from=2026-11-02&to=2026-11-08').then(r => r.json())
    assert.deepEqual(payroll.people.map(x => [x.technicianId, x.hours.regular]), [[b.priya.id, '8.00']])
    // Assignment history may need another technician's name for the visit, but
    // it must never expand the technician's timesheet read authority.
    const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Reassigned visit')).id })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-02', start: '08:00', end: '09:00' })
    await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'Tom takes this visit' })
    assert.ok((await b.priyaPerson.state()).technicians.some(x => x.id === b.tom.id), 'the visit still has its assignment names')
    assert.deepEqual((await readWeek()).timesheets.map(x => [x.technicianId, x.hours.worked, x.status]), [[b.priya.id, '8.00', 'approved']], 'a shared assignment history never grants another person’s timesheet')
  }
  const settings = (await h.state()).business[0]
  await h.command('business.save', { ...settings, timezone: 'America/Chicago' })
  const owner = (await h.state()).actor
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-05', start: '00:00', end: '01:00' })
  const read = async path => {
    const response = await h.request(path)
    assert.equal(response.status, 200)
    return response.json()
  }
  // Compare the whole domain view, including its event window and versions.
  const unchanged = async action => {
    const before = await h.state()
    await action()
    assert.deepEqual(await h.state(), before, 'replay or refusal changes no domain record')
  }
  const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  const shift = await b.priyaPerson.run('clock.in', { deviceTime: '2026-11-05T05:50:00.000Z' })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'travel', deviceTime: '2026-11-05T05:55:00.000Z' })
  const entry = await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: '2026-11-05T06:04:12.000Z' })
  const firstInput = {
    id: entry.id, version: entry.version,
    start: { date: '2026-11-04', time: '23:50' },
    end: { date: '2026-11-05', time: '00:30' },
    reason: 'Owner checked the signed work sheet',
  }
  await unchanged(() => h.command('time.correct', firstInput, { error: 'RUNNING' }))
  const stopped = await b.priyaPerson.run('timer.stop', { visitId: visit.id, deviceTime: '2026-11-05T06:24:42.000Z' })
  await b.priyaPerson.run('clock.out', { deviceTime: '2026-11-05T07:00:00.000Z' })
  const original = { startAt: '2026-11-05T06:04:12.000Z', endAt: '2026-11-05T06:24:42.000Z' }
  assert.deepEqual([stopped.startAt, stopped.endAt, stopped.original, stopped.corrections], [original.startAt, original.endAt, null, []])

  const steps = [
    { person: { run: h.command }, by: { id: owner.id, name: 'Olivia Owner', role: 'owner' }, input: { ...firstInput, version: stopped.version }, at: '2026-11-05T12:01:00.000Z', from: original, to: { startAt: '2026-11-05T05:50:00.000Z', endAt: '2026-11-05T06:30:00.000Z' }, summary: "Olivia Owner corrected Priya N.'s job timer from 00:04–00:24 to 23:50–00:30 (40 min): Owner checked the signed work sheet" },
    { person: b.dispatcher, by: { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }, input: { id: entry.id, version: stopped.version + 1, start: { date: '2026-11-04', time: '23:55' }, end: { date: '2026-11-05', time: '00:35' }, reason: 'Dispatcher confirmed arrival with the technician' }, at: '2026-11-05T12:02:00.000Z', from: { startAt: '2026-11-05T05:50:00.000Z', endAt: '2026-11-05T06:30:00.000Z' }, to: { startAt: '2026-11-05T05:55:00.000Z', endAt: '2026-11-05T06:35:00.000Z' }, summary: "Sam Ortiz corrected Priya N.'s job timer from 23:50–00:30 to 23:55–00:35 (40 min): Dispatcher confirmed arrival with the technician" },
    { person: b.office, by: { id: b.office.id, name: 'Olu Office', role: 'office' }, input: { id: entry.id, version: stopped.version + 2, start: { date: '2026-11-05', time: '00:00' }, end: { date: '2026-11-05', time: '00:40' }, reason: 'Office reconciled the customer work sheet' }, at: '2026-11-05T12:03:00.000Z', from: { startAt: '2026-11-05T05:55:00.000Z', endAt: '2026-11-05T06:35:00.000Z' }, to: { startAt: '2026-11-05T06:00:00.000Z', endAt: '2026-11-05T06:40:00.000Z' }, summary: "Olu Office corrected Priya N.'s job timer from 23:55–00:35 to 00:00–00:40 (40 min): Office reconciled the customer work sheet" },
  ]
  const history = []
  const expectedEvents = []
  const timeline = async () => (await read('/api/glove/jobs/' + job.id + '/timeline')).events.filter(e => e.kind === 'time.corrected')
  const eventFacts = e => ({ actorId: e.actorId, actorName: e.actorName, actorRole: e.actorRole, at: e.at, commandId: e.commandId, jobId: e.jobId, subjectKind: e.subjectKind, subjectId: e.subjectId, kind: e.kind, summary: e.summary })
  for (const step of steps) {
    await clock(step.at)
    step.commandId = randomUUID()
    const corrected = await step.person.run('time.correct', step.input, { commandId: step.commandId })
    history.push({ by: step.by, at: step.at, reason: step.input.reason, from: step.from, to: step.to })
    const expected = { ...stopped, version: step.input.version + 1, ...step.to, original, corrections: structuredClone(history) }
    assert.deepEqual(corrected, expected, 'local dates convert independently to the expected UTC instants')
    assert.deepEqual((await h.state()).times.find(x => x.id === entry.id), expected, 'every correction keeps the phone original and all prior corrections')
    expectedEvents.push({ actorId: step.by.id, actorName: step.by.name, actorRole: step.by.role, at: step.at, commandId: step.commandId, jobId: job.id, subjectKind: 'time', subjectId: entry.id, kind: 'time.corrected', summary: step.summary })
    assert.deepEqual((await timeline()).map(eventFacts), expectedEvents, 'the job timeline orders every actual desk correction')
    await unchanged(async () => assert.deepEqual(await step.person.run('time.correct', step.input, { commandId: step.commandId }), expected))
    await unchanged(() => step.person.run('time.correct', step.input, { error: 'STALE' }))
  }

  const currentInput = { ...steps[2].input, version: stopped.version + 3, reason: 'Proposed further correction' }
  for (const reason of [undefined, '', '   ']) {
    await unchanged(() => h.command('time.correct', { ...currentInput, reason }, { error: 'INPUT' }))
  }
  await unchanged(() => h.command('time.correct', { ...currentInput, end: { date: '2026-11-04', time: '23:59' } }, { error: 'TIME' }))
  const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
  const subcontractor = await h.person('Synthetic Glove Contractor', 'subcontractor')
  const role = await h.command('role.save', { name: 'Synthetic Glove intake', permissions: ['customer.save'] })
  const intake = await h.person('Synthetic Glove Intake', 'custom:' + role.id)
  for (const person of [b.priyaPerson, b.tomPerson, b.agent, viewer, subcontractor, intake]) {
    await unchanged(() => person.run('time.correct', currentInput, { error: 'FORBIDDEN' }))
  }
  await unchanged(async () => {
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: randomUUID(), type: 'time.correct', payload: currentInput } })
    assert.equal(response.status, 401)
    assert.equal((await response.json()).error.code, 'AUTH')
  })

  // Historical attribution survives changes to each recorder's present role.
  for (const person of [b.dispatcher, b.office]) {
    await h.command('role.set', { operatorId: person.id, role: 'viewer' })
    await unchanged(() => person.run('time.correct', currentInput, { error: 'FORBIDDEN' }))
    const old = steps.find(step => step.by.id === person.id)
    await unchanged(() => person.run('time.correct', old.input, { commandId: old.commandId, error: 'FORBIDDEN' }))
  }
  await clock('2026-11-05T12:04:00.000Z')
  const expectedState = await h.state()
  const expectedTimeline = await timeline()
  await h.restart()
  assert.deepEqual(await h.state(), expectedState, 'actual Worker replacement retains all domain records in D1')
  const kept = (await h.state()).times.find(x => x.id === entry.id)
  assert.deepEqual(kept.original, original)
  assert.deepEqual(kept.corrections, history, 'historical desk roles do not become their current Viewer role')
  assert.deepEqual([kept.startAt, kept.endAt, kept.version], ['2026-11-05T06:00:00.000Z', '2026-11-05T06:40:00.000Z', stopped.version + 3])
  assert.deepEqual(await timeline(), expectedTimeline)
  const exported = await read('/api/glove/export')
  assert.deepEqual(exported.times.find(x => x.id === entry.id), kept, 'the business download includes the original and full correction history')
  const exportedEvents = exported.timeline.filter(e => e.kind === 'time.corrected').map(e => ({
    actorId: e.actor_id, actorName: e.actor_name, actorRole: e.actor_role, at: e.at, commandId: e.command_id, jobId: e.job_id, subjectKind: e.subject_kind, subjectId: e.subject_id, kind: e.kind, summary: e.summary,
  }))
  assert.deepEqual(exportedEvents, expectedEvents)
  for (const [i, event] of exported.timeline.filter(e => e.kind === 'time.corrected').entries()) {
    const { recordChanges, ...correction } = JSON.parse(event.data)
    assert.deepEqual(correction, history[i], 'the exported audit retains exact before and after values, recorder, reason and time')
    assert.ok(recordChanges.some(change => change.kind === 'times' && change.id === entry.id && change.fromVersion === stopped.version + i && change.toVersion === stopped.version + i + 1 && change.fields.includes('corrections')))
  }
  const activity = (await read('/api/glove/activity')).events.filter(e => e.kind === 'time.corrected')
  assert.deepEqual(activity.map(eventFacts), [...expectedEvents].reverse())
  await unchanged(async () => {
    const first = steps[0]
    assert.equal((await h.command('time.correct', first.input, { commandId: first.commandId })).corrections.length, 1)
  })
  // Other timers and the stopped shift have not been rewritten by desk edits.
  assert.deepEqual((await h.state()).times.filter(x => x.id !== entry.id), expectedState.times.filter(x => x.id !== entry.id))
  assert.equal((await h.state()).times.find(x => x.id === shift.id).endAt, '2026-11-05T07:00:00.000Z')
})
