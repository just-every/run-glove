// COST-002 timesheets and payroll export through the command, timesheet,
// payroll-file, 1099 and Activity/export doors: a 44-hour week rolls up clock
// and job time, splits overtime past 40 hours (and under the owner's daily
// rule), is approved by the owner only, and reaches the Gusto, ADP RUN and
// QuickBooks Payroll files; a 1099 subcontractor's total appears only in the
// 1099-NEC export.
import test, { after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, completedJob, assertTrail } from './harness.mjs'

const at = (date, time) => `${date}T${time}:00+11:00`
const days = [['2026-11-02', '07:00', '20:00'], ['2026-11-03', '07:00', '17:00'], ['2026-11-04', '07:00', '17:00'], ['2026-11-05', '07:00', '14:00'], ['2026-11-06', '07:00', '11:00']]
const csv = rows => rows.map(r => r.join(',')).join('\r\n') + '\r\n'

// Independent local calendars and minute totals, including both US clock
// changes. Timer minutes remain visible even when their shift started in
// another day or week; they never add to paid clock time.
async function localWorkweeks() {
  const cases = [
    {
      zone: ['America', 'New_York'].join('/'), start: 'monday',
      weeks: [
        { dates: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'], amounts: [[6, 90, 0, 0]], total: [90, 0, 0] },
        { dates: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'], amounts: [[0, 91, 0, 30], [1, 0, 41, 0], [6, 331, 0, 16]], total: [422, 41, 46] },
        { dates: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'], amounts: [[0, 0, 50, 0]], total: [0, 50, 0] },
      ],
      shifts: [
        ['2026-10-25T23:45:10-04:00', '2026-10-26T01:15:39-04:00', []],
        ['2026-10-26T23:30:15-04:00', '2026-10-27T01:00:45-04:00', [
          ['travel', '2026-10-26T23:40:00-04:00', '2026-10-27T00:10:29-04:00'],
          ['job', '2026-10-27T00:10:29-04:00', '2026-10-27T00:50:59-04:00'],
        ]],
        ['2026-11-01T00:30:00-04:00', '2026-11-01T03:30:00-05:00', []],
        ['2026-11-01T23:40:00-05:00', '2026-11-02T01:10:30-05:00', [
          ['travel', '2026-11-01T23:50:00-05:00', '2026-11-02T00:05:30-05:00'],
          ['job', '2026-11-02T00:05:30-05:00', '2026-11-02T00:55:59-05:00'],
        ]],
      ],
      paidHours: '7.03',
    },
    {
      zone: ['America', 'Los_Angeles'].join('/'), start: 'sunday',
      weeks: [
        { dates: ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07'], amounts: [[6, 151, 0, 30]], total: [151, 0, 30] },
        { dates: ['2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'], amounts: [[0, 90, 127, 0], [1, 0, 0, 30], [6, 91, 0, 0]], total: [181, 127, 30] },
        { dates: ['2026-03-15', '2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21'], amounts: [[0, 0, 40, 0]], total: [0, 40, 0] },
      ],
      shifts: [
        ['2026-03-07T23:45:10-08:00', '2026-03-08T03:15:40-07:00', [
          ['travel', '2026-03-07T23:55:00-08:00', '2026-03-08T00:25:29-08:00'],
          ['job', '2026-03-08T00:25:29-08:00', '2026-03-08T03:00:59-07:00'],
        ]],
        ['2026-03-08T23:30:15-07:00', '2026-03-09T01:00:44-07:00', [
          ['job', '2026-03-08T23:45:00-07:00', '2026-03-09T00:15:30-07:00'],
          ['travel', '2026-03-09T00:15:30-07:00', '2026-03-09T00:45:59-07:00'],
        ]],
        ['2026-03-14T23:45:00-07:00', '2026-03-15T01:15:30-07:00', [
          ['job', '2026-03-15T00:05:00-07:00', '2026-03-15T00:45:29-07:00'],
        ]],
      ],
      paidHours: '3.02',
    },
  ]
  for (const fixture of cases) {
    const now = '2026-11-05T16:00:00.000Z', h = await installation({ at: now })
    try {
      const b = await business(h, { currency: 'USD', timezone: fixture.zone })
      const owner = (await h.state()).actor
      const read = async (week, as = h.owner()) => {
        const response = await h.request(`/api/glove/timesheets?week=${week}`, { as })
        assert.equal(response.status, 200)
        return response.json()
      }
      const defaultWeek = await read('2026-10-26')
      assert.deepEqual(defaultWeek.settings, { weekStart: 'monday', dailyOvertime: null, adp: null, commissionRules: [] })
      const trace = [], entries = [], replays = []
      const record = async (person, type, payload, kind) => {
        const commandId = crypto.randomUUID(), result = await person.run(type, payload, { commandId })
        trace.push([kind, person.id, person.name, person.role, commandId, result.id])
        replays.push({ person, type, payload, commandId, result })
        return result
      }
      const actingOwner = { id: owner.id, name: 'Olivia Owner', role: 'owner', run: h.command }
      const technician = { ...b.priyaPerson, role: 'technician' }
      await record(actingOwner, 'payroll.settings', fixture.start === 'monday' ? {} : { weekStart: 'sunday' }, 'payroll.settings')
      const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Overnight service')).id })
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: fixture.weeks[1].dates[0], start: '09:00', end: '10:00' })
      const keepEntry = (row, kind, start, end) => entries.push([row.id, 2, b.priya.id, kind, kind === 'shift' ? null : visit.id, kind === 'shift' ? null : job.id, new Date(start).toISOString(), new Date(end).toISOString(), now, now])
      for (const [start, end, timers] of fixture.shifts) {
        const shift = await record(technician, 'clock.in', { deviceTime: start }, 'time.shift.start')
        for (const [kind, from, to] of timers) {
          const timer = await record(technician, 'timer.start', { visitId: visit.id, kind, deviceTime: from }, `time.${kind}.start`)
          await record(technician, 'timer.stop', { visitId: visit.id, deviceTime: to }, `time.${kind}.stop`)
          keepEntry(timer, kind, from, to)
        }
        await record(technician, 'clock.out', { deviceTime: end }, 'time.shift.stop')
        keepEntry(shift, 'shift', start, end)
      }
      // Another employee has real paid time; neither employee may read it as
      // their own, including after a real Worker restart.
      await b.tomPerson.run('clock.in', { deviceTime: `${fixture.weeks[1].dates[2]}T12:00:00-05:00` })
      await b.tomPerson.run('clock.out', { deviceTime: `${fixture.weeks[1].dates[2]}T13:00:00-05:00` })
      const snapshots = []
      for (const expected of fixture.weeks) {
        const week = await read(expected.dates[0]), own = await read(expected.dates[0], b.priyaPerson.cookie)
        assert.deepEqual([week.weekStart, week.weekEnd, week.settings.weekStart], [expected.dates[0], expected.dates[6], fixture.start])
        assert.deepEqual(own.timesheets.map(s => s.technicianId), [b.priya.id])
        const sheet = own.timesheets[0]
        assert.deepEqual(sheet, week.timesheets.find(s => s.technicianId === b.priya.id))
        assert.deepEqual(sheet.days.map(d => [d.date, d.worked, d.job, d.travel, d.regular, d.overtime, d.doubleTime]), expected.dates.map((date, i) => {
          const [, worked = 0, job = 0, travel = 0] = expected.amounts.find(a => a[0] === i) ?? []
          return [date, worked, job, travel, worked, 0, 0]
        }))
        const [worked, job, travel] = expected.total
        assert.deepEqual(sheet.minutes, { worked, job, travel, regular: worked, overtime: 0, doubleTime: 0 })
        assert.equal(sheet.onTheClock, false)
        snapshots.push(week)
      }
      const current = fixture.weeks[1].dates[0], ownTom = await read(current, b.tomPerson.cookie)
      assert.deepEqual(ownTom.timesheets.map(s => [s.technicianId, s.minutes.worked, s.minutes.job, s.minutes.travel]), [[b.tom.id, 60, 0, 0]])
      const viewer = await h.person('Synthetic Glove Viewer', 'viewer'), subcontractor = await h.person('Synthetic Glove Subcontractor', 'subcontractor')
      const beforeRefusals = await h.state()
      for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent, viewer, subcontractor]) {
        await person.run('payroll.settings', { weekStart: fixture.start === 'monday' ? 'sunday' : 'monday' }, { error: 'FORBIDDEN' })
        await person.run('timesheet.approve', { technicianId: b.priya.id, weekStart: current }, { error: 'FORBIDDEN' })
      }
      assert.equal((await h.request(`/api/glove/timesheets?week=${current}`, { as: '' })).status, 401)
      assert.equal((await h.request(`/api/glove/timesheets?week=${current}`, { as: subcontractor.cookie })).status, 403)
      assert.deepEqual(await h.state(), beforeRefusals, 'excluded roles and signed-out reads change nothing')
      const approval = await record(actingOwner, 'timesheet.approve', { technicianId: b.priya.id, weekStart: current }, 'timesheet.approved')
      assert.deepEqual([approval.minutes, approval.by, approval.at], [{ worked: fixture.weeks[1].total[0], job: fixture.weeks[1].total[1], travel: fixture.weeks[1].total[2], regular: fixture.weeks[1].total[0], overtime: 0, doubleTime: 0 }, { id: owner.id, name: 'Olivia Owner', role: 'owner' }, now])
      assert.deepEqual([approval.timesheet.hours.worked, approval.timesheet.hours.regular], [fixture.paidHours, fixture.paidHours], 'paid hours contain only shifts, never timers')
      const approvedState = await h.state(), approvedWeek = await read(current)
      await h.command('payroll.settings', { weekStart: fixture.start === 'monday' ? 'sunday' : 'monday', dailyOvertime: { afterHours: 8 } }, { error: 'WORKWEEK_FIXED' })
      assert.deepEqual(await h.state(), approvedState, 'a fixed-week refusal preserves all settings, entries and approvals')
      assert.deepEqual(await read(current), approvedWeek)
      // Replay every original capture and the approval, including after
      // restart: the retained result is returned, with no new time or audit.
      const replay = async () => {
        for (const item of replays) assert.deepEqual(await item.person.run(item.type, item.payload, { commandId: item.commandId }), item.result)
      }
      await replay()
      const project = row => [row.id, row.version, row.technicianId, row.kind, row.visitId, row.jobId, row.startAt, row.endAt, row.startReceivedAt, row.endReceivedAt]
      assert.deepEqual((await b.priyaPerson.state()).times.map(project).sort(), entries.sort())
      const beforeRestart = await h.state()
      await h.restart()
      await replay()
      assert.deepEqual(await h.state(), beforeRestart, 'Worker restart and command replay retain the exact domain records')
      assert.deepEqual((await b.priyaPerson.state()).times.map(project).sort(), entries)
      for (const [i, expected] of fixture.weeks.entries()) {
        const week = await read(expected.dates[0])
        assert.deepEqual(week, i === 1 ? approvedWeek : snapshots[i])
        assert.deepEqual((await read(expected.dates[0], b.priyaPerson.cookie)).timesheets, [week.timesheets.find(s => s.technicianId === b.priya.id)])
      }
      assert.deepEqual(await read(current, b.tomPerson.cookie), ownTom)
      assert.equal((await h.request(`/api/glove/timesheets?week=${current}`, { as: subcontractor.cookie })).status, 403)
      const { activity, exported } = await assertTrail(h, ['payroll.settings', 'time.shift.start', 'time.shift.stop', 'time.travel.start', 'time.travel.stop', 'time.job.start', 'time.job.stop', 'timesheet.approved'])
      const commandIds = new Set(trace.map(e => e[4]))
      assert.deepEqual(activity.filter(e => commandIds.has(e.commandId)).map(e => [e.kind, e.actorId, e.actorName, e.actorRole, e.commandId, e.subjectId]), [...trace].reverse())
      for (const event of activity.filter(e => commandIds.has(e.commandId))) {
        assert.equal(event.at, now)
        const kept = exported.timeline.find(e => e.id === event.id)
        assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.command_id, kept.at], [event.actorId, event.actorName, event.actorRole, event.commandId, now])
      }
      assert.deepEqual(exported.times.filter(row => row.technicianId === b.priya.id).map(project).sort(), entries)
      assert.deepEqual(exported.timesheets.map(row => [row.id, row.technicianId, row.weekStart, row.minutes, row.by, row.at]), [[approval.id, b.priya.id, current, approval.minutes, { id: owner.id, name: 'Olivia Owner', role: 'owner' }, now]])
      assert.deepEqual(await h.state(), beforeRestart, 'authenticated reads and business export do not change domain records')
    } finally {
      await h.close()
    }
  }
}

// Native clock entries exercise daily thresholds before the weekly split.
// Expected minutes and decimal hours are independently enumerated, including
// a seventh working day and a rounded bucket sum one centihour above the total.
async function overtimeWorkweeks() {
  const now = '2026-11-23T16:00:00.000Z', h = await installation({ at: now })
  try {
    const b = await business(h, { currency: 'USD', timezone: 'UTC' })
    const owner = (await h.state()).actor
    const fixtures = [
      {
        rule: null,
        dates: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'],
        ends: ['09:00', '09:00', '09:00', '09:00', '09:00', '09:00', '09:00'],
        days: [[60, 60, 0, 0], [60, 60, 0, 0], [60, 60, 0, 0], [60, 60, 0, 0], [60, 60, 0, 0], [60, 60, 0, 0], [60, 60, 0, 0]],
        decimalDays: [['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00'], ['1.00', '1.00', '0.00', '0.00']],
        minutes: { worked: 420, job: 0, travel: 0, regular: 420, overtime: 0, doubleTime: 0 },
        hours: { worked: '7.00', job: '0.00', travel: '0.00', regular: '7.00', overtime: '0.00', doubleTime: '0.00' }, flag: false,
      },
      {
        rule: { afterHours: 8.25 },
        dates: ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
        ends: ['17:00', '17:00', '17:00', '17:00', '17:00', '17:00', '17:00'],
        days: [[540, 495, 45, 0], [540, 495, 45, 0], [540, 495, 45, 0], [540, 495, 45, 0], [540, 420, 120, 0], [540, 0, 540, 0], [540, 0, 540, 0]],
        decimalDays: [['9.00', '8.25', '0.75', '0.00'], ['9.00', '8.25', '0.75', '0.00'], ['9.00', '8.25', '0.75', '0.00'], ['9.00', '8.25', '0.75', '0.00'], ['9.00', '7.00', '2.00', '0.00'], ['9.00', '0.00', '9.00', '0.00'], ['9.00', '0.00', '9.00', '0.00']],
        minutes: { worked: 3780, job: 0, travel: 0, regular: 2400, overtime: 1380, doubleTime: 0 },
        hours: { worked: '63.00', job: '0.00', travel: '0.00', regular: '40.00', overtime: '23.00', doubleTime: '0.00' }, flag: true,
      },
      {
        rule: { afterHours: 8.25, doubleAfterHours: 12.25 },
        dates: ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'],
        ends: ['21:01', '21:00', '21:00', '21:00', '21:00', '21:00', '08:31'],
        days: [[781, 495, 240, 46], [780, 495, 240, 45], [780, 495, 240, 45], [780, 495, 240, 45], [780, 420, 315, 45], [780, 0, 735, 45], [31, 0, 31, 0]],
        decimalDays: [['13.02', '8.25', '4.00', '0.77'], ['13.00', '8.25', '4.00', '0.75'], ['13.00', '8.25', '4.00', '0.75'], ['13.00', '8.25', '4.00', '0.75'], ['13.00', '7.00', '5.25', '0.75'], ['13.00', '0.00', '12.25', '0.75'], ['0.52', '0.00', '0.52', '0.00']],
        minutes: { worked: 4712, job: 0, travel: 0, regular: 2400, overtime: 2041, doubleTime: 271 },
        hours: { worked: '78.53', job: '0.00', travel: '0.00', regular: '40.00', overtime: '34.02', doubleTime: '4.52' }, flag: true,
      },
    ]
    for (const dailyOvertime of [{ afterHours: 8.1 }, { afterHours: 0 }, { afterHours: 24 }, { afterHours: 8.25, doubleAfterHours: 8.25 }, { afterHours: 8.25, doubleAfterHours: 8 }, { afterHours: 8.25, doubleAfterHours: 12.1 }]) {
      const before = await h.state()
      await h.command('payroll.settings', { dailyOvertime }, { error: 'INPUT' })
      assert.deepEqual(await h.state(), before, 'invalid daily rules cannot change settings or time')
    }
    const read = async week => {
      const response = await h.request(`/api/glove/timesheets?week=${week}`)
      assert.equal(response.status, 200)
      return response.json()
    }
    for (const fixture of fixtures) {
      await h.command('payroll.settings', { dailyOvertime: fixture.rule })
      for (const [i, date] of fixture.dates.entries()) {
        await b.priyaPerson.run('clock.in', { deviceTime: `${date}T08:00:00Z` })
        await b.priyaPerson.run('clock.out', { deviceTime: `${date}T${fixture.ends[i]}:00Z` })
      }
      const week = await read(fixture.dates[0]), sheet = week.timesheets.find(s => s.technicianId === b.priya.id)
      assert.deepEqual(week.settings.dailyOvertime, fixture.rule && { doubleAfterHours: null, ...fixture.rule })
      assert.deepEqual(sheet.days.map(d => [d.date, d.worked, d.regular, d.overtime, d.doubleTime]), fixture.dates.map((date, i) => [date, ...fixture.days[i]]))
      assert.deepEqual(sheet.days.map(d => [d.hours.worked, d.hours.regular, d.hours.overtime, d.hours.doubleTime]), fixture.decimalDays)
      assert.deepEqual(sheet.minutes, fixture.minutes)
      assert.deepEqual(sheet.hours, fixture.hours)
      assert.equal(sheet.overtimeFlag, fixture.flag)
      const approved = await h.command('timesheet.approve', { technicianId: b.priya.id, weekStart: fixture.dates[0] })
      assert.deepEqual([approved.minutes, approved.by, approved.at], [fixture.minutes, { id: owner.id, name: 'Olivia Owner', role: 'owner' }, now])
      const kept = await read(fixture.dates[0]), state = await h.state()
      await h.restart()
      assert.deepEqual(await read(fixture.dates[0]), kept, 'daily and weekly buckets survive actual Worker restart')
      assert.deepEqual(await h.state(), state)
    }
    const { activity, exported } = await assertTrail(h, ['payroll.settings', 'time.shift.start', 'time.shift.stop', 'timesheet.approved'])
    assert.deepEqual(exported.timesheets.map(row => [row.technicianId, row.weekStart, row.minutes, row.by, row.at]).sort((a, b) => a[1].localeCompare(b[1])), fixtures.map(fixture => [b.priya.id, fixture.dates[0], fixture.minutes, { id: owner.id, name: 'Olivia Owner', role: 'owner' }, now]))
    assert.equal(activity.filter(e => e.kind === 'timesheet.approved').length, 3)
  } finally {
    await h.close()
  }
}

describe('COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor', async (t) => {
  const h = await installation({ at: '2026-11-09T16:00:00.000Z' })
  after(() => h.close())
  const b = await business(h)
  const priya = await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: 'Priya N.', operatorId: b.priyaPerson.id, payrollId: '104' })
  const tom = await h.command('technician.save', { id: b.tom.id, version: b.tom.version, name: 'Tom B.', operatorId: b.tomPerson.id, subcontractor: { payeeName: 'Tom Brooks Electric', tinLast4: '9876' } })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Install week')).id })
  const priyaVisit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: priya.id, date: '2026-11-02', start: '08:00', end: '10:00' })
  const tomVisit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tom.id, date: '2026-11-03', start: '08:00', end: '14:00' })
  for (const [date, start, end] of days) {
    await b.priyaPerson.run('clock.in', { deviceTime: at(date, start) })
    if (date === '2026-11-02') {
      await b.priyaPerson.run('timer.start', { visitId: priyaVisit.id, kind: 'job', deviceTime: at(date, '08:00') })
      await b.priyaPerson.run('timer.stop', { visitId: priyaVisit.id, deviceTime: at(date, '10:30') })
    }
    await b.priyaPerson.run('clock.out', { deviceTime: at(date, end) })
  }
  await b.tomPerson.run('clock.in', { deviceTime: at('2026-11-03', '08:00') })
  await b.tomPerson.run('clock.out', { deviceTime: at('2026-11-03', '14:00') })
  await h.command('visit.agree', { visitId: tomVisit.id, version: tomVisit.version, amount: '450.00' })
  await b.tomPerson.run('visit.arrive', { visitId: tomVisit.id, deviceTime: at('2026-11-03', '08:05') })
  for (const item of job.checklist.filter(i => i.required)) await b.tomPerson.run('visit.capture', { visitId: tomVisit.id, deviceTime: at('2026-11-03', '09:00'), kind: 'checklist', itemId: item.id, result: 'done' })
  await b.tomPerson.run('visit.complete', { visitId: tomVisit.id, deviceTime: at('2026-11-03', '13:55'), summary: 'Rough-in wiring', signoff: { absentReason: 'Site manager away' } })
  const read = async (path, as = h.owner()) => { const r = await h.request(path, { as }); return { status: r.status, body: r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text() } }
  const sheet = async (as) => (await read('/api/glove/timesheets?week=2026-11-02', as)).body.timesheets.find(x => x.technicianId === priya.id)
  const period = 'from=2026-11-02&to=2026-11-08'

  test('COST-002, COST-006, COST-007 local workweeks retain overnight shift and timer minutes across DST, restart and approval; the 44-hour week flags overtime', async () => {
    const s = await sheet()
    assert.deepEqual([s.hours, s.overtimeFlag, s.status, s.onTheClock], [{ worked: '44.00', job: '2.50', travel: '0.00', regular: '40.00', overtime: '4.00', doubleTime: '0.00' }, true, 'not approved', false])
    assert.deepEqual(s.days.map(d => [d.date, d.hours.worked, d.hours.regular, d.hours.overtime]), [['2026-11-02', '13.00', '13.00', '0.00'], ['2026-11-03', '10.00', '10.00', '0.00'], ['2026-11-04', '10.00', '10.00', '0.00'], ['2026-11-05', '7.00', '7.00', '0.00'], ['2026-11-06', '4.00', '0.00', '4.00'], ['2026-11-07', '0.00', '0.00', '0.00'], ['2026-11-08', '0.00', '0.00', '0.00']])
    assert.equal((await read('/api/glove/timesheets?week=2026-11-03')).status, 400, 'a workweek starts on the owner\'s week-start day')
    const own = (await read('/api/glove/timesheets?week=2026-11-02', b.priyaPerson.cookie)).body.timesheets
    assert.deepEqual(own.map(x => [x.technicianId, x.hours.worked]), [[priya.id, '44.00']], 'a technician reads only their own timesheet')
    await localWorkweeks()
  })

  test('COST-002, COST-006, COST-007 only the owner approves, and only approved weeks of W-2 people reach the payroll files', async () => {
    const before = (await read(`/api/glove/reports/payroll.json?${period}`)).body
    assert.deepEqual(before.people, [])
    assert.deepEqual(before.left.map(x => [x.name, x.reason]).sort((a, b) => a[0].localeCompare(b[0])), [['Priya N.', 'week of 2026-11-02 not approved'], ['Tom B.', '1099 subcontractor: paid through the 1099-NEC totals, not payroll']])
    const beforeRefusals = await h.state()
    for (const person of [b.office, b.dispatcher, b.priyaPerson]) await person.run('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'FORBIDDEN' })
    await h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-11-02' }, { error: 'SUBCONTRACTOR' })
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-09' }, { error: 'NO_TIME' })
    assert.deepEqual(await h.state(), beforeRefusals, 'refused approvals preserve all time and payroll records')
    const commandId = crypto.randomUUID(), payload = { technicianId: priya.id, weekStart: '2026-11-02' }
    const approved = await h.command('timesheet.approve', payload, { commandId })
    assert.deepEqual([approved.timesheet.status, approved.minutes], ['approved', { worked: 2640, job: 150, travel: 0, regular: 2400, overtime: 240, doubleTime: 0 }])
    assert.deepEqual([approved.by, approved.at], [{ id: beforeRefusals.actor.id, name: 'Olivia Owner', role: 'owner' }, '2026-11-09T16:00:00.000Z'])
    const approvedState = await h.state()
    assert.deepEqual(await h.command('timesheet.approve', payload, { commandId }), approved)
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'APPROVED' })
    assert.deepEqual(await h.state(), approvedState, 'replay and a fresh duplicate approval create no second effect')
    assert.equal((await sheet()).status, 'approved')
    assert.equal((await read(`/api/glove/reports/payroll.json?${period}`, b.dispatcher.cookie)).status, 403, 'the payroll files are the owner\'s and the office\'s, like the other exports')
    const gusto = await read(`/api/glove/reports/payroll-gusto.csv?${period}`, b.office.cookie)
    assert.equal(gusto.body, csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', '2026-11-02 - 2026-11-08', '40.00', '4.00', '0.00', '0.00']]), 'Gusto Smart Import gets each workweek\'s hours with its date range')
    assert.equal((await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`)).body, csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', '11/02/2026', 'Regular', '13.00', ''], ['Priya N.', '11/03/2026', 'Regular', '10.00', ''], ['Priya N.', '11/04/2026', 'Regular', '10.00', ''], ['Priya N.', '11/05/2026', 'Regular', '7.00', ''], ['Priya N.', '11/06/2026', 'Overtime', '4.00', '']]))
    assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).status, 409, 'ADP RUN needs the company code first')
    await b.office.run('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } }, { error: 'FORBIDDEN' })
    await h.command('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } })
    assert.equal((await read(`/api/glove/reports/payroll-adp-run.csv?${period}`)).body, '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'REG', '40.00', '', '0', '', 'BASE'], ['G3X', 'W', '11/02/2026', '11/08/2026', '104', 'OTP', '4.00', '', '0', '', 'BASE']]))
    for (const kind of ['gusto', 'adp-run', 'quickbooks']) assert.doesNotMatch((await read(`/api/glove/reports/payroll-${kind}.csv?${period}`)).body, /Tom|9876/, `${kind} carries no subcontractor`)
    const nec = (await read('/api/glove/reports/1099.json?year=2026')).body
    assert.deepEqual(nec.rows.map(r => [r.payeeName, r.total]), [['Tom Brooks Electric', '450.00']], 'the subcontractor\'s total is in the 1099 export')
    const paths = [`/api/glove/timesheets?week=2026-11-02`, `/api/glove/reports/payroll.json?${period}`, ...['gusto', 'adp-run', 'quickbooks'].map(kind => `/api/glove/reports/payroll-${kind}.csv?${period}`), '/api/glove/reports/1099.json?year=2026']
    const snapshots = await Promise.all(paths.map(path => read(path))), state = await h.state()
    await h.restart()
    assert.deepEqual(await Promise.all(paths.map(path => read(path))), snapshots, 'approval, exact exported bytes and separate subcontractor totals persist after Worker restart')
    assert.deepEqual(await h.state(), state, 'reads cannot change approval or payroll records')
  })

  test('COST-002, COST-006, COST-007 the owner\'s daily overtime rule re-splits the week, which needs approving again before it exports', async () => {
    await h.command('payroll.settings', { dailyOvertime: { afterHours: 8, doubleAfterHours: 12 } })
    await h.command('payroll.settings', { weekStart: 'sunday' }, { error: 'WORKWEEK_FIXED' })
    const s = await sheet()
    assert.deepEqual([s.status, s.hours.regular, s.hours.overtime, s.hours.doubleTime], ['changed since approval', '35.00', '8.00', '1.00'])
    assert.deepEqual(s.days.slice(0, 5).map(d => [d.hours.regular, d.hours.overtime, d.hours.doubleTime]), [['8.00', '4.00', '1.00'], ['8.00', '2.00', '0.00'], ['8.00', '2.00', '0.00'], ['7.00', '0.00', '0.00'], ['4.00', '0.00', '0.00']])
    assert.equal((await read(`/api/glove/reports/payroll.json?${period}`)).body.left.find(x => x.technicianId === priya.id).reason, 'week of 2026-11-02 changed since approval')
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' })
    assert.match((await read(`/api/glove/reports/payroll-gusto.csv?${period}`)).body, /\r\nN\.,Priya,104,2026-11-02 - 2026-11-08,35\.00,8\.00,1\.00,0\.00\r\n$/)
    const { exported } = await assertTrail(h, ['timesheet.approved', 'payroll.settings'])
    assert.deepEqual(exported.timesheets.map(x => [x.technicianId, x.weekStart, x.version, x.minutes.doubleTime]), [[priya.id, '2026-11-02', 2, 60]])
    await overtimeWorkweeks()
  })
})

test('COST-001 / COST-002, COST-006, COST-007 a linked technician with no visits clocks a shift and reads only their own weekly timesheet', async t => {
  const h = await installation({ at: '2026-11-09T16:00:00.000Z' }); t.after(() => h.close())
  const b = await business(h)
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
  const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
  const role = await h.command('role.save', { name: 'Synthetic Glove Time Reader', permissions: [] })
  const custom = await h.person('Synthetic Glove Custom Reader', `custom:${role.id}`)
  const subcontractor = await h.person('Synthetic Glove Subcontractor', 'subcontractor')
  const token = await h.command('token.issue', { name: 'Synthetic Glove Time Integration', role: 'viewer' })
  const read = async (person, headers) => {
    const response = await h.request('/api/glove/timesheets?week=2026-11-02', { as: person?.cookie ?? '', headers })
    assert.equal(response.status, 200)
    return response.json()
  }
  const expected = [[b.priya.id, '8.00', 'approved'], [b.tom.id, '1.00', 'not approved']].sort((a, b) => a[0].localeCompare(b[0]))
  const summary = week => week.timesheets.map(s => [s.technicianId, s.hours.worked, s.status]).sort((a, b) => a[0].localeCompare(b[0]))
  const checkReaders = async () => {
    assert.deepEqual(summary(await read(null, { authorization: `Bearer ${token.token}` })), expected)
    const state = await h.state()
    for (const person of [{ cookie: h.owner() }, b.office, b.dispatcher, b.agent, viewer, custom]) {
      assert.deepEqual((await h.state(person.cookie)).times.map(row => row.technicianId).sort(), [b.priya.id, b.tom.id].sort())
      assert.deepEqual(summary(await read(person)), expected)
    }
    assert.deepEqual((await read(b.priyaPerson)).timesheets.map(s => [s.technicianId, s.hours.worked]), [[b.priya.id, '8.00']])
    assert.deepEqual((await read(b.tomPerson)).timesheets.map(s => [s.technicianId, s.hours.worked]), [[b.tom.id, '1.00']])
    assert.deepEqual((await subcontractor.state()).times, [])
    assert.deepEqual((await subcontractor.state()).timesheets, [])
    assert.equal((await h.request('/api/glove/timesheets?week=2026-11-02', { as: subcontractor.cookie })).status, 403)
    assert.equal((await h.request('/api/glove/timesheets?week=2026-11-02', { as: '' })).status, 401)
    assert.deepEqual(await h.state(), state, 'every permitted or refused read leaves records unchanged')
  }
  await checkReaders()
  await h.restart()
  await checkReaders()
  await h.command('token.revoke', { tokenId: token.id })
  const revoked = await h.state()
  assert.equal((await h.request('/api/glove/timesheets?week=2026-11-02', { as: '', headers: { authorization: `Bearer ${token.token}` } })).status, 401)
  assert.deepEqual(await h.state(), revoked, 'a revoked integration credential discloses no timesheets and changes nothing')
  await h.command('role.set', { operatorId: b.priyaPerson.id, role: 'subcontractor' })
  const withdrawn = await h.state()
  assert.equal((await h.request('/api/glove/timesheets?week=2026-11-02', { as: b.priyaPerson.cookie })).status, 403)
  await b.priyaPerson.run('clock.in', payload, { commandId, error: 'FORBIDDEN' })
  assert.deepEqual(await h.state(), withdrawn, 'a replay cannot restore withdrawn time authority')
  await assertTrail(h, ['time.shift.start', 'time.shift.stop', 'timesheet.approved', 'token.revoked', 'role.set'])
})

// TEAM-003 commissions and spiffs through the settings, quote, agreement,
// invoice and payroll-file doors: the owner's dated rules credit each sale to
// the technician named as its seller, and the totals join the same payroll
// files for the same approved weeks.
test('TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files', async (t) => {
  const h = await installation({ at: '2026-11-05T16:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const plusDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
  const today = '2026-11-06'
  const thisWeek = plusDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7)), lastWeek = plusDays(thisWeek, -7), period = `from=${lastWeek}&to=${plusDays(thisWeek, 6)}`
  const us = date => `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`
  const read = async (path, as = h.owner()) => { const r = await h.request(path, { as }); return r.headers.get('content-type')?.includes('json') ? r.json() : r.text() }
  const priya = await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: 'Priya N.', operatorId: b.priyaPerson.id, payrollId: '104' })
  for (const date of [lastWeek, plusDays(lastWeek, 1)]) {
    await b.priyaPerson.run('clock.in', { deviceTime: `${date}T08:00:00+11:00` })
    await b.priyaPerson.run('clock.out', { deviceTime: `${date}T16:00:00+11:00` })
  }

  await t.test('TEAM-003, TEAM-006 only the owner sets dated commission rules', async () => {
    await b.office.run('payroll.settings', { commissions: { soldPercent: '5' } }, { error: 'FORBIDDEN' })
    await h.command('payroll.settings', { commissions: { soldPercent: '120' } }, { error: 'INPUT' })
    await h.command('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'B' }, commissions: { from: lastWeek, soldPercent: '5', completedPercent: '2', agreementSpiff: '25' } })
    await h.command('payroll.settings', { commissions: { from: plusDays(today, 1), soldPercent: '10', completedPercent: '2', agreementSpiff: '40' } })
  })

  await t.test('TEAM-003, TEAM-006 sales credited to their technician earn the rule in force on their date', async () => {
    const draft = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Ducted system', lines: [{ description: 'Ducted system install', quantity: '1', unitPrice: '1234.50', serviceId: b.service.id }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', soldByTechnicianId: 'nobody' }, { error: 'NOT_FOUND' })
    const sold = await b.dispatcher.run('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', soldByTechnicianId: priya.id })
    assert.equal(sold.acceptance.soldByTechnicianId, priya.id)
    const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 1, visitServiceId: b.service.id, repairDiscountPercent: '0' })
    const second = await h.command('site.save', { customerId: b.customer.id, address: '2 Darling St, Balmain NSW 2041' })
    await b.office.run('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, via: 'phone', soldByTechnicianId: priya.id })
    await b.office.run('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: second.id, via: 'in person', soldByTechnicianId: b.tom.id })
    const { job } = await completedJob(h, b)
    const inv = await b.office.run('invoice.prepare', { jobId: job.id })
    await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
    const before = await read(`/api/glove/reports/payroll.json?${period}`)
    assert.deepEqual(before.left.map(x => [x.name, x.reason]).sort((a, b) => a[0].localeCompare(b[0])), [['Priya N.', `week of ${lastWeek} not approved`], ['Tom B.', 'commissions of $25.00 but no approved time in the period']])
  })

  await t.test('TEAM-003, TEAM-006 the approved person\'s commissions and spiffs are in every payroll file, by week and date', async () => {
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: lastWeek })
    const run = await read(`/api/glove/reports/payroll.json?${period}`)
    const p = run.people.find(x => x.technicianId === priya.id)
    assert.deepEqual([p.commission.sold, p.commission.completed, p.commission.agreements, p.commission.total], [{ revenue: '1234.50', amount: '61.73' }, { revenue: '189.00', amount: '3.78' }, { count: 1, amount: '25.00' }, '90.51'], '5% of $1,234.50 rounds half up to $61.73; 2% of $189.00 completed; one $25 spiff; tomorrow\'s rule changes none of today\'s')
    assert.deepEqual(p.commission.items.map(c => [c.date, c.kind, c.rate, c.amount]), [[today, 'agreement', '$25.00', '25.00'], [today, 'completed', '2%', '3.78'], [today, 'sold', '5%', '61.73']])
    assert.deepEqual(run.left.map(x => x.name), ['Tom B.'], 'a commission without approved time stays out of the files, with the reason')
    assert.equal(await read(`/api/glove/reports/payroll-gusto.csv?${period}`, b.office.cookie), csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'], ['N.', 'Priya', '104', `${lastWeek} - ${plusDays(lastWeek, 6)}`, '16.00', '0.00', '0.00', '0.00'], ['N.', 'Priya', '104', `${thisWeek} - ${plusDays(thisWeek, 6)}`, '0.00', '0.00', '0.00', '90.51']]))
    assert.equal(await read(`/api/glove/reports/payroll-adp-run.csv?${period}`), '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'REG', '16.00', '', '0', '', 'BASE'], ['G3X', 'B', us(lastWeek), us(plusDays(thisWeek, 6)), '104', 'COMM', '', '90.51', '0', '', 'BASE']]))
    assert.equal(await read(`/api/glove/reports/payroll-quickbooks.csv?${period}`), csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ['Priya N.', us(lastWeek), 'Regular', '8.00', ''], ['Priya N.', us(plusDays(lastWeek, 1)), 'Regular', '8.00', ''], ['Priya N.', us(today), 'Commission', '', '90.51']]))
    for (const kind of ['gusto', 'adp-run', 'quickbooks']) assert.doesNotMatch(await read(`/api/glove/reports/payroll-${kind}.csv?${period}`), /Tom/, `${kind} carries no one left out`)
    const { activity } = await assertTrail(h, ['payroll.settings', 'quote.accepted', 'agreement.sold'])
    assert.ok(activity.some(e => e.kind === 'payroll.settings' && e.summary.endsWith(`commissions from ${lastWeek}: 5% of sold revenue, 2% of completed revenue, $25.00 per agreement sold`)))
  })
})
