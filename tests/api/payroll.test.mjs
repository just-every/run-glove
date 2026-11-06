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

describe('COST-002, COST-006, COST-007 a 44-hour week is approved by the owner, split at 40 hours and under the daily rule, and exported for Gusto, ADP RUN and QuickBooks Payroll without the subcontractor', async (t) => {
  const h = await installation()
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

  test('COST-002, COST-006, COST-007 the weekly timesheet rolls up clock and job time and flags overtime past 40 hours a week', async () => {
    const s = await sheet()
    assert.deepEqual([s.hours, s.overtimeFlag, s.status, s.onTheClock], [{ worked: '44.00', job: '2.50', travel: '0.00', regular: '40.00', overtime: '4.00', doubleTime: '0.00' }, true, 'not approved', false])
    assert.deepEqual(s.days.map(d => [d.date, d.hours.worked, d.hours.regular, d.hours.overtime]), [['2026-11-02', '13.00', '13.00', '0.00'], ['2026-11-03', '10.00', '10.00', '0.00'], ['2026-11-04', '10.00', '10.00', '0.00'], ['2026-11-05', '7.00', '7.00', '0.00'], ['2026-11-06', '4.00', '0.00', '4.00'], ['2026-11-07', '0.00', '0.00', '0.00'], ['2026-11-08', '0.00', '0.00', '0.00']])
    assert.equal((await read('/api/glove/timesheets?week=2026-11-03')).status, 400, 'a workweek starts on the owner\'s week-start day')
    const own = (await read('/api/glove/timesheets?week=2026-11-02', b.priyaPerson.cookie)).body.timesheets
    assert.deepEqual(own.map(x => [x.technicianId, x.hours.worked]), [[priya.id, '44.00']], 'a technician reads only their own timesheet')
  })

  test('COST-002, COST-006, COST-007 only the owner approves, and only approved weeks of W-2 people reach the payroll files', async () => {
    const before = (await read(`/api/glove/reports/payroll.json?${period}`)).body
    assert.deepEqual(before.people, [])
    assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', 'week of 2026-11-02 not approved'], ['Tom B.', '1099 subcontractor: paid through the 1099-NEC totals, not payroll']])
    for (const person of [b.office, b.dispatcher, b.priyaPerson]) await person.run('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'FORBIDDEN' })
    await h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-11-02' }, { error: 'SUBCONTRACTOR' })
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-09' }, { error: 'NO_TIME' })
    const approved = await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' })
    assert.deepEqual([approved.timesheet.status, approved.minutes], ['approved', { worked: 2640, job: 150, travel: 0, regular: 2400, overtime: 240, doubleTime: 0 }])
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' }, { error: 'APPROVED' })
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
  })

  test('COST-002, COST-006, COST-007 the owner\'s daily overtime rule re-splits the week, which needs approving again before it exports', async () => {
    await h.command('payroll.settings', { dailyOvertime: { afterHours: 8, doubleAfterHours: 12 } })
    await h.command('payroll.settings', { weekStart: 'sunday' }, { error: 'WORKWEEK_FIXED' })
    const s = await sheet()
    assert.deepEqual([s.status, s.hours.regular, s.hours.overtime, s.hours.doubleTime], ['changed since approval', '35.00', '8.00', '1.00'])
    assert.deepEqual(s.days.slice(0, 5).map(d => [d.hours.regular, d.hours.overtime, d.hours.doubleTime]), [['8.00', '4.00', '1.00'], ['8.00', '2.00', '0.00'], ['8.00', '2.00', '0.00'], ['7.00', '0.00', '0.00'], ['4.00', '0.00', '0.00']])
    assert.deepEqual((await read(`/api/glove/reports/payroll.json?${period}`)).body.left.map(x => x.reason)[0], 'week of 2026-11-02 changed since approval')
    await h.command('timesheet.approve', { technicianId: priya.id, weekStart: '2026-11-02' })
    assert.match((await read(`/api/glove/reports/payroll-gusto.csv?${period}`)).body, /\r\nN\.,Priya,104,2026-11-02 - 2026-11-08,35\.00,8\.00,1\.00,0\.00\r\n$/)
    const { exported } = await assertTrail(h, ['timesheet.approved', 'payroll.settings'])
    assert.deepEqual(exported.timesheets.map(x => [x.technicianId, x.weekStart, x.version, x.minutes.doubleTime]), [[priya.id, '2026-11-02', 2, 60]])

    // The weekly totals can stay equal even though every daily payroll row changes.
    await h.command('payroll.settings', { dailyOvertime: null })
    const dates = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']
    for (const date of dates) {
      await b.priyaPerson.run('clock.in', { deviceTime: at(date, '07:00') })
      await b.priyaPerson.run('clock.out', { deviceTime: at(date, '17:00') })
    }
    const payload = { technicianId: priya.id, weekStart: dates[0] }
    const initialApprovalId = crypto.randomUUID()
    const approved = await h.command('timesheet.approve', payload, { commandId: initialApprovalId })
    const weekPath = '/api/glove/timesheets?week=2026-10-19'
    const runPath = '/api/glove/reports/payroll.json?from=2026-10-19&to=2026-10-25'
    const filePath = kind => `/api/glove/reports/payroll-${kind}.csv?from=2026-10-19&to=2026-10-25`
    const currentSheet = async () => (await read(weekPath)).body.timesheets.find(x => x.technicianId === priya.id)
    const originalHours = { worked: '50.00', job: '0.00', travel: '0.00', regular: '40.00', overtime: '10.00', doubleTime: '0.00' }
    assert.deepEqual((await currentSheet()).hours, originalHours)
    const oldRows = dates.flatMap((date, i) => [[priya.name, `10/${date.slice(8)}/2026`, i === 4 ? 'Overtime' : 'Regular', '10.00', '']])
    assert.equal((await read(filePath('quickbooks'))).body, csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ...oldRows]))
    await h.restart()
    assert.equal((await currentSheet()).status, 'approved', 'the original daily approval survives a Worker restart')

    const rule = { dailyOvertime: { afterHours: 8, doubleAfterHours: null } }
    const settingsId = crypto.randomUUID()
    await h.command('payroll.settings', rule, { commandId: settingsId })
    await h.command('payroll.settings', rule, { commandId: settingsId })
    const changed = await currentSheet()
    assert.deepEqual(changed.hours, originalHours, 'weekly totals alone cannot establish the approved daily split')
    assert.equal(changed.status, 'changed since approval', 'daily split changes invalidate approval even when weekly totals stay equal')
    assert.deepEqual(changed.days.slice(0, 5).map(d => [d.date, d.hours.regular, d.hours.overtime]), dates.map(date => [date, '8.00', '2.00']))
    const excluded = async () => {
      const run = (await read(runPath)).body
      assert.deepEqual(run.people, [])
      assert.deepEqual(run.left, [{ technicianId: priya.id, name: priya.name, reason: 'week of 2026-10-19 changed since approval' }])
      assert.equal((await read(filePath('gusto'), b.office.cookie)).body, csv([['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission']]))
      assert.equal((await read(filePath('quickbooks'))).body, csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount']]))
      assert.equal((await read(filePath('adp-run'))).body, '##GENERIC## V1.0\r\n' + csv([['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code']]))
    }
    await excluded()
    await h.restart()
    assert.equal((await currentSheet()).status, 'changed since approval')
    await excluded()

    // Current role is checked even for a replay from a formerly authorized Owner.
    await h.command('role.set', { operatorId: b.office.id, role: 'owner' })
    const formerId = crypto.randomUUID()
    await b.office.run('payroll.settings', rule, { commandId: formerId })
    await h.command('role.set', { operatorId: b.office.id, role: 'office' })
    const beforeRefusal = await h.state()
    await b.office.run('payroll.settings', rule, { commandId: formerId, error: 'FORBIDDEN' })
    for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent]) {
      await person.run('payroll.settings', { dailyOvertime: null }, { error: 'FORBIDDEN' })
      await person.run('timesheet.approve', payload, { error: 'FORBIDDEN' })
    }
    const afterRefusal = await h.state()
    for (const field of ['business', 'times', 'timesheets', 'events']) assert.deepEqual(afterRefusal[field], beforeRefusal[field], `${field} is unchanged by refused settings and reapproval`)
    await excluded()

    const reapprovalId = crypto.randomUUID()
    const reapproved = await h.command('timesheet.approve', payload, { commandId: reapprovalId })
    assert.equal(reapproved.id, approved.id)
    assert.equal(reapproved.version, approved.version + 1)
    assert.equal(reapproved.timesheet.status, 'approved')
    await h.command('timesheet.approve', payload, { commandId: reapprovalId })
    const newRows = dates.flatMap(date => [[priya.name, `10/${date.slice(8)}/2026`, 'Regular', '8.00', ''], [priya.name, `10/${date.slice(8)}/2026`, 'Overtime', '2.00', '']])
    const expectedFile = csv([['Employee', 'Date', 'Pay item', 'Hours', 'Amount'], ...newRows])
    assert.equal((await read(filePath('quickbooks'), b.office.cookie)).body, expectedFile)
    assert.deepEqual((await read(runPath)).body.people.map(p => [p.technicianId, p.hours]), [[priya.id, { regular: '40.00', overtime: '10.00', doubleTime: '0.00' }]])
    await h.restart()
    assert.equal((await currentSheet()).status, 'approved')
    assert.equal((await read(filePath('quickbooks'))).body, expectedFile)
    // Unrelated settings and an equivalent split do not revoke the renewed approval.
    await h.command('payroll.settings', { adp: { companyCode: 'G3Y', payFrequency: 'W' }, dailyOvertime: { afterHours: 8, doubleAfterHours: 12 } })
    assert.equal((await currentSheet()).status, 'approved')
    const trail = await assertTrail(h, ['payroll.settings', 'timesheet.approved'])
    const approvalEvents = trail.activity.filter(e => e.kind === 'timesheet.approved' && e.subjectId === approved.id).sort((a, b) => a.sequence - b.sequence)
    assert.deepEqual(approvalEvents.map(e => [e.actorName, e.actorRole, e.commandId]), [['Olivia Owner', 'owner', initialApprovalId], ['Olivia Owner', 'owner', reapprovalId]])
    for (const e of approvalEvents) {
      const kept = trail.exported.timeline.find(x => x.id === e.id)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId])
    }
    assert.equal(trail.activity.filter(e => e.commandId === settingsId).length, 1, 'settings replay creates no second event')
    assert.equal(trail.exported.timesheets.find(x => x.id === approved.id).version, 2, 'reapproval replay creates no second approval')
  })
})

test('COST-001 / COST-002, COST-006, COST-007 a linked technician with no visits clocks a shift and reads only their own weekly timesheet', async t => {
  const h = await installation(); t.after(() => h.close())
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

})

// TEAM-003 commissions and spiffs through the settings, quote, agreement,
// invoice and payroll-file doors: the owner's dated rules credit each sale to
// the technician named as its seller, and the totals join the same payroll
// files for the same approved weeks.
test('TEAM-003, TEAM-006 a 5% sold-revenue rule and a $25 agreement spiff over a period reach the Gusto, ADP RUN and QuickBooks Payroll files', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const plusDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
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
    assert.deepEqual(before.left.map(x => [x.name, x.reason]), [['Priya N.', `week of ${lastWeek} not approved`], ['Tom B.', 'commissions of $25.00 but no approved time in the period']])
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
