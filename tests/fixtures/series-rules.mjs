// PLAN-001 points 2–4 through the series.create door: who may make a job repeat,
// the rule grammar against hand-computed date tables, local dates and wall-clock
// times across daylight-saving changes in the business zone and in a branch, the
// inclusive end date and the exact rule label in Activity, and the same series
// after an actual Worker restart and command replay. Every table below was worked
// out on a calendar (1 January 2027 is a Friday, 1 March 2027 a Monday), never
// with the recurrence code under test. The clock is fixed by the caller.
import assert from 'node:assert/strict'
import { scenario } from './scenario.mjs'
import { completedJob } from '../api/harness.mjs'

// [name, rule, first date, until, dates, label]
const tables = [
  ['every week, end date inclusive', { unit: 'week' }, '2027-03-03', '2027-03-24', ['2027-03-03', '2027-03-10', '2027-03-17', '2027-03-24'], 'every week on wednesday'],
  ['every week, the day before the last occurrence', { unit: 'week', interval: 1 }, '2027-03-03', '2027-03-23', ['2027-03-03', '2027-03-10', '2027-03-17'], 'every week on wednesday'],
  ['every 52 weeks', { unit: 'week', interval: 52 }, '2026-11-13', '2028-01-31', ['2026-11-13', '2027-11-12'], 'every 52 weeks on friday'],
  ['every month on the 31st from 31 January', { unit: 'month' }, '2027-01-31', '2027-05-31', ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30', '2027-05-31'], 'every month on day 31'],
  ['every month on the 31st in a leap year', { unit: 'month' }, '2028-01-31', '2028-03-31', ['2028-01-31', '2028-02-29', '2028-03-31'], 'every month on day 31'],
  ['day 31 given from a mid-month first date', { unit: 'month', day: 31 }, '2027-02-10', '2027-04-30', ['2027-02-28', '2027-03-31', '2027-04-30'], 'every month on day 31'],
  ['every 3 months counted from February', { unit: 'month', interval: 3 }, '2027-02-15', '2027-12-31', ['2027-02-15', '2027-05-15', '2027-08-15', '2027-11-15'], 'every 3 months on day 15'],
  ['every 3 months from 31 January', { unit: 'month', interval: 3 }, '2027-01-31', '2027-12-31', ['2027-01-31', '2027-04-30', '2027-07-31', '2027-10-31'], 'every 3 months on day 31'],
  ['every 52 months', { unit: 'month', interval: 52 }, '2024-01-15', '2028-12-31', ['2024-01-15', '2028-05-15'], 'every 52 months on day 15'],
  ['April and October on the first date\'s day', { unit: 'month', months: [10, 4, 10] }, '2027-03-20', '2028-06-30', ['2027-04-20', '2027-10-20', '2028-04-20'], 'in April and October on day 20'],
  ['April and October on the last Sunday', { unit: 'month', months: [4, 10], nth: -1, weekday: 'sunday' }, '2027-03-01', '2027-12-31', ['2027-04-25', '2027-10-31'], 'in April and October on the last sunday'],
  ['the first Monday, March\'s already past', { unit: 'month', nth: 1, weekday: 'monday' }, '2027-03-10', '2027-05-31', ['2027-04-05', '2027-05-03'], 'every month on the first monday'],
  ['the first Friday, the first date itself', { unit: 'month', nth: 1, weekday: 'friday' }, '2027-01-01', '2027-03-31', ['2027-01-01', '2027-02-05', '2027-03-05'], 'every month on the first friday'],
  ['the third Wednesday', { unit: 'month', nth: 3, weekday: 'wednesday' }, '2027-01-01', '2027-03-31', ['2027-01-20', '2027-02-17', '2027-03-17'], 'every month on the third wednesday'],
  ['the fourth Friday', { unit: 'month', nth: 4, weekday: 'friday' }, '2027-01-01', '2027-03-31', ['2027-01-22', '2027-02-26', '2027-03-26'], 'every month on the fourth friday'],
  ['the last Friday', { unit: 'month', nth: -1, weekday: 'friday' }, '2027-01-01', '2027-03-31', ['2027-01-29', '2027-02-26', '2027-03-26'], 'every month on the last friday'],
  ['the last Sunday', { unit: 'month', nth: -1, weekday: 'sunday' }, '2027-01-01', '2027-03-31', ['2027-01-31', '2027-02-28', '2027-03-28'], 'every month on the last sunday'],
  ['the second Tuesday of every second month, counted from March', { unit: 'month', interval: 2, nth: 2, weekday: 'tuesday' }, '2027-03-20', '2027-09-30', ['2027-05-11', '2027-07-13', '2027-09-14'], 'every 2 months on the second tuesday'],
]

const refusedRules = [
  ['week interval 0', { unit: 'week', interval: 0 }], ['week interval 53', { unit: 'week', interval: 53 }],
  ['month interval 0', { unit: 'month', interval: 0 }], ['month interval 53', { unit: 'month', interval: 53 }],
  ['a fractional interval', { unit: 'week', interval: 1.5 }],
  ['month 0', { unit: 'month', months: [0] }], ['month 13', { unit: 'month', months: [13] }], ['no months listed', { unit: 'month', months: [] }],
  ['named months every 3 months', { unit: 'month', interval: 3, months: [4, 10] }],
  ['nth 0', { unit: 'month', nth: 0, weekday: 'monday' }], ['nth 5', { unit: 'month', nth: 5, weekday: 'monday' }], ['nth -2', { unit: 'month', nth: -2, weekday: 'monday' }],
  ['an unknown weekday', { unit: 'month', nth: 1, weekday: 'funday' }], ['an nth without its weekday', { unit: 'month', nth: 1 }],
  ['day 0', { unit: 'month', day: 0 }], ['day 32', { unit: 'month', day: 32 }],
  ['an unknown unit', { unit: 'day' }], ['a rule that is a word', 'weekly'], ['an empty rule', {}], ['no rule', undefined],
]

export async function seriesRuleProof(t, h, b) {
  const sent = []
  let counter = 0
  const newJob = async title => b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ description: 'Maintenance visit', quantity: '1', unitPrice: '120.00', tax: 'FREE' }] })
  // Each case has its own technician so no case needs a conflict review.
  const newTech = (name, extra = {}) => h.command('technician.save', { name: `${name} ${++counter}`, ...extra })
  const slotOf = (job, tech, rule, date, until, extra = {}) => ({ jobId: job.id, version: job.version, rule, date, start: '09:00', end: '10:00', technicianId: tech.id, ...(until ? { until } : {}), horizonDays: 730, ...extra })
  const visitsOf = async job => (await h.state()).visits.filter(v => v.jobId === job.id && v.status === 'booked').sort((x, y) => x.local.date < y.local.date ? -1 : 1)
  // A null person is the owner.
  const send = async (who, name, payload) => {
    const commandId = `synthetic-glove-plan-rule-${sent.length + 1}`
    const result = await (who ? who.run('series.create', payload, { commandId }) : h.command('series.create', payload, { commandId }))
    sent.push({ who, commandId, payload, result, name })
    return result
  }
  const make = async (who, name, rule, date, until) => {
    const job = await newJob(name), tech = await newTech('Rules tech')
    return { job, tech, result: await send(who, name, slotOf(job, tech, rule, date, until)) }
  }
  // Activity is paged newest first, so older events are reached through each page's cursor.
  const activity = async () => {
    const events = []
    for (let page = await h.request('/api/glove/activity').then(r => r.json()); ; page = await h.request(`/api/glove/activity?before=${page.next}`).then(r => r.json())) {
      events.push(...page.events)
      if (!page.next) return events
    }
  }
  // A token's last use is recorded on every request it sends, refused or not, so only that field is set aside.
  const records = async () => { const s = await h.state(); return { ...s, integrationTokens: s.integrationTokens?.map(({ lastUsedAt, ...rest }) => rest) } }
  const nothingChanges = async (run, why) => {
    const before = await records(), events = (await activity()).length
    await run()
    assert.deepEqual(await records(), before, `${why}: no record changes`)
    assert.equal((await activity()).length, events, `${why}: nothing is added to Activity`)
  }

  await scenario(t, 'PLAN-001 point 2: only the owner and a dispatcher make an open job repeat; a closed job, a repeating job and an end before the start are refused', async () => {
    const job = await newJob('Authority'), tech = await newTech('Authority tech')
    const payload = slotOf(job, tech, { unit: 'week' }, '2027-03-03', '2027-03-24')
    const custom = await h.person('Cleo Custom', `custom:${(await h.command('role.save', { name: 'Visit booker', permissions: ['visit.book', 'visit.change', 'visit.cancel'] })).id}`)
    const token = await h.command('token.issue', { name: 'Synthetic series integration', role: 'office' })
    for (const [name, who] of [['Office', b.office], ['Technician', b.priyaPerson], ['a custom role without the permission', custom], ['Agent', b.agent]]) await nothingChanges(() => who.run('series.create', payload, { error: 'FORBIDDEN' }), name)
    await nothingChanges(async () => {
      const res = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: 'synthetic-glove-plan-token', type: 'series.create', payload } })
      assert.equal(res.status, 403)
      assert.equal((await res.json()).error.code, 'FORBIDDEN')
    }, 'an integration token')
    const done = await completedJob(h, b, '2026-10-20')
    const closed = (await h.state()).jobs.find(j => j.id === done.job.id)
    await nothingChanges(() => b.dispatcher.run('series.create', slotOf(closed, tech, { unit: 'week' }, '2027-03-03', null), { error: 'JOB_STATE' }), 'a closed job')
    await nothingChanges(() => b.dispatcher.run('series.create', { ...payload, until: '2027-03-02' }, { error: 'INPUT' }), 'an end before the first date')
    const repeating = await make(b.dispatcher, 'Repeats', { unit: 'week' }, '2027-03-03', '2027-03-10')
    await nothingChanges(() => b.dispatcher.run('series.create', slotOf(repeating.result, tech, { unit: 'week' }, '2027-03-03', '2027-03-10'), { error: 'SERIES_EXISTS' }), 'a job that already repeats')
    // The owner, with the same payload every refused role sent, makes the job repeat.
    await send(null, 'Authority', payload)
    assert.deepEqual((await visitsOf(job)).map(v => v.local.date), ['2027-03-03', '2027-03-10', '2027-03-17', '2027-03-24'])
  })

  await scenario(t, 'PLAN-001 point 2: every rule in the grammar books exactly the hand-computed dates', async () => {
    for (const [i, [name, rule, date, until, expected]] of tables.entries()) {
      const { job } = await make(i % 3 ? b.dispatcher : null, name, rule, date, until)
      assert.deepEqual((await visitsOf(job)).map(v => v.local.date), expected, name)
    }
  })

  await scenario(t, 'PLAN-001 point 2: out-of-range and malformed rules are refused and book nothing', async () => {
    const job = await newJob('Refused rules'), tech = await newTech('Refused tech')
    for (const [name, rule] of refusedRules) await nothingChanges(() => b.dispatcher.run('series.create', slotOf(job, tech, rule, '2027-03-03', '2027-06-30'), { error: 'INPUT' }), name)
    assert.equal((await h.state()).jobs.find(j => j.id === job.id).series, undefined)
    assert.equal((await visitsOf(job)).length, 0)
  })

  await scenario(t, 'PLAN-001 point 3: local dates and wall-clock times keep across daylight-saving changes in the business zone', async () => {
    // Sydney: summer time starts on Sunday 3 October 2027 and ends on Sunday 2 April 2028 (the 9 am local start is the evening before in UTC).
    const spring = await make(b.dispatcher, 'Sydney spring', { unit: 'week' }, '2027-09-24', '2027-10-15')
    assert.deepEqual((await visitsOf(spring.job)).map(v => [v.local, v.startAt, v.endAt]), [
      [{ date: '2027-09-24', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2027-09-23T23:00:00.000Z', '2027-09-24T00:00:00.000Z'],
      [{ date: '2027-10-01', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2027-09-30T23:00:00.000Z', '2027-10-01T00:00:00.000Z'],
      [{ date: '2027-10-08', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2027-10-07T22:00:00.000Z', '2027-10-07T23:00:00.000Z'],
      [{ date: '2027-10-15', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2027-10-14T22:00:00.000Z', '2027-10-14T23:00:00.000Z'],
    ])
    const autumn = await make(b.dispatcher, 'Sydney autumn', { unit: 'week' }, '2028-03-25', '2028-04-08')
    assert.deepEqual((await visitsOf(autumn.job)).map(v => [v.local.date, v.local.start, v.startAt, v.endAt]), [
      ['2028-03-25', '09:00', '2028-03-24T22:00:00.000Z', '2028-03-24T23:00:00.000Z'],
      ['2028-04-01', '09:00', '2028-03-31T22:00:00.000Z', '2028-03-31T23:00:00.000Z'],
      ['2028-04-08', '09:00', '2028-04-07T23:00:00.000Z', '2028-04-08T00:00:00.000Z'],
    ])
    // A Los Angeles branch: Saturday 6 pm local is Sunday in UTC; summer time starts on Sunday 14 March 2027.
    const la = await h.command('branch.save', { name: 'Los Angeles', prefix: 'LAX', timezone: 'America/Los_Angeles', zips: ['90001'] })
    const customer = await b.office.run('customer.save', { name: 'Los Angeles School' })
    const site = await b.office.run('site.save', { customerId: customer.id, address: '1 Sunset Blvd, Los Angeles CA 90001', branchId: la.id })
    const tech = await newTech('LA tech', { branchId: la.id })
    const job = await b.office.run('job.create', { customerId: customer.id, siteId: site.id, title: 'LA maintenance', lines: [{ description: 'Maintenance visit', quantity: '1', unitPrice: '120.00', tax: 'FREE' }] })
    await send(b.dispatcher, 'Los Angeles', { jobId: job.id, version: job.version, rule: { unit: 'week' }, date: '2027-03-06', start: '18:00', end: '19:30', technicianId: tech.id, until: '2027-03-27', horizonDays: 730 })
    assert.deepEqual((await visitsOf(job)).map(v => [v.local, v.startAt, v.endAt]), [
      [{ date: '2027-03-06', start: '18:00', end: '19:30', timezone: 'America/Los_Angeles' }, '2027-03-07T02:00:00.000Z', '2027-03-07T03:30:00.000Z'],
      [{ date: '2027-03-13', start: '18:00', end: '19:30', timezone: 'America/Los_Angeles' }, '2027-03-14T02:00:00.000Z', '2027-03-14T03:30:00.000Z'],
      [{ date: '2027-03-20', start: '18:00', end: '19:30', timezone: 'America/Los_Angeles' }, '2027-03-21T01:00:00.000Z', '2027-03-21T02:30:00.000Z'],
      [{ date: '2027-03-27', start: '18:00', end: '19:30', timezone: 'America/Los_Angeles' }, '2027-03-28T01:00:00.000Z', '2027-03-28T02:30:00.000Z'],
    ])
  })

  await scenario(t, 'PLAN-001 point 4: an occurrence exactly on the end date is booked and none after it', async () => {
    const on = await make(b.dispatcher, 'Ends on an occurrence', { unit: 'month', nth: 1, weekday: 'monday' }, '2027-02-01', '2027-04-05')
    assert.deepEqual((await visitsOf(on.job)).map(v => v.local.date), ['2027-02-01', '2027-03-01', '2027-04-05'])
    assert.equal(on.result.series.until, '2027-04-05')
    const before = await make(null, 'Ends the day before', { unit: 'month', nth: 1, weekday: 'monday' }, '2027-02-01', '2027-04-04')
    assert.deepEqual((await visitsOf(before.job)).map(v => v.local.date), ['2027-02-01', '2027-03-01'])
    const same = await make(b.dispatcher, 'Ends on its first date', { unit: 'week' }, '2027-06-02', '2027-06-02')
    assert.deepEqual((await visitsOf(same.job)).map(v => v.local.date), ['2027-06-02'])
  })

  await scenario(t, 'PLAN-001 point 4: the created event carries the exact rule label, and everything is identical after a Worker restart and command replay', async () => {
    const names = new Map(sent.map(x => [x.commandId, x.name]))
    const expectedLabel = new Map(tables.map(([name, , date, until, , label]) => [name, { label, date, until }]))
    const events = await activity()
    for (const x of sent) {
      const created = events.filter(e => e.commandId === x.commandId && e.kind === 'series.created')
      assert.equal(created.length, 1, `${x.name} records one series.created event`)
      const who = x.who ? { name: 'Sam Ortiz', role: 'dispatcher' } : { name: 'Olivia Owner', role: 'owner' }
      assert.deepEqual([created[0].actorName, created[0].actorRole, created[0].subjectKind, created[0].subjectId], [who.name, who.role, 'job', x.result.id])
      const label = expectedLabel.get(names.get(x.commandId))
      if (label) assert.equal(created[0].summary, `${who.name} made ${x.result.number} repeat ${label.label} from ${label.date}${label.until ? ` until ${label.until}` : ''}, 09:00–10:00 with ${(await h.state()).technicians.find(tech => tech.id === x.payload.technicianId).name}`)
    }
    const exported = await h.request('/api/glove/export').then(r => r.json())
    for (const e of events.filter(e => sent.some(x => x.commandId === e.commandId))) {
      const kept = exported.timeline.find(row => row.id === e.id)
      assert.ok(kept, `${e.kind} is in the business export`)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.summary], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId, e.summary])
    }
    const before = { state: await h.state(), activity: events }
    await h.restart()
    assert.deepEqual(await h.state(), before.state, 'generated visits, jobs and series are identical after the Worker restarts')
    assert.deepEqual(await activity(), before.activity, 'Activity is identical after the Worker restarts')
    for (const x of sent) assert.deepEqual(await (x.who ? x.who.run('series.create', x.payload, { commandId: x.commandId }) : h.command('series.create', x.payload, { commandId: x.commandId })), x.result, `replaying ${x.name} returns its saved outcome`)
    assert.deepEqual(await h.state(), before.state, 'replaying every series.create books nothing again')
    assert.deepEqual(await activity(), before.activity, 'replaying every series.create adds nothing to Activity')
  })
}
