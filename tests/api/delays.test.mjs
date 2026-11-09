import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

const date = '2026-10-22'
const watchPath = `/api/glove/delays?at=${date}T10:20:00.000Z`
async function delayFixture(t) {
  const h = await installation({ at: `${date}T10:20:00.000Z` })
  t.after(() => h.close())
  const b = await business(h, { timezone: 'UTC' })
  let sequence = 0
  const book = async (technicianId, start, end, extra = {}) => {
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: `Delay recovery ${++sequence}` })
    return b.dispatcher.run('visit.book', { jobId: job.id, technicianId, date, start, end, ...extra })
  }
  const watch = async (as = h.owner()) => {
    const res = await h.request(watchPath, { as })
    assert.equal(res.status, 200)
    return res.json()
  }
  return { h, b, book, watch }
}

// AGENT-003 (ct approved as pattern-1 DONE, 19 Oct): the delay watch flags the
// visit after a job that runs long and a visit whose parts are not received,
// offers feasible moves, the agent proposes one, a dispatcher approves it, and
// under a grant the agent moves a visit itself only inside its arrival window.

test('AGENT-003, AGENT-010: a job runs long, the agent proposes moving the next visit to another technician and the dispatcher approves', async (t) => {
  await scenario(t, 'AGENT-003 point 5: recovery excludes unavailable technicians and rounds the expected free instant to the next quarter hour', async t => {
    const h = await installation({ at: '2026-10-22T10:20:00.000Z' })
    t.after(() => h.close())
    const b = await business(h, { timezone: 'UTC' })
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Quarter hour recovery' })
    const long = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-22', start: '09:00', end: '10:00' })
    const next = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:20', end: '11:20' })
    await b.priyaPerson.run('visit.arrive', { visitId: long.id, deviceTime: long.startAt })
    const site = await h.command('site.save', { ...b.site, address: '100 Recovery Street, Chicago IL 60601' })
    const service = await h.command('service.save', { code: 'DELAY-GAS', name: 'Gas recovery', unitPrice: '20.00', requiredSkills: ['gas'] })
    const gasJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title: 'Skilled recovery', lines: [{ serviceId: service.id, description: 'Gas recovery', quantity: '1', unitPrice: '20.00' }] })
    // The original two visits use an unrestricted job; a separate delayed
    // skilled visit proves every eligibility check through the same watch.
    await h.command('technician.save', { ...b.priya, skills: ['gas'], zips: ['60601'] })
    await h.command('technician.save', { ...b.tom, skills: ['gas'], zips: ['60601'] })
    const skilled = await b.dispatcher.run('visit.book', { jobId: gasJob.id, technicianId: b.priya.id, date, start: '12:00', end: '13:00' })
    const branch = await h.command('branch.save', { name: 'Remote branch', prefix: 'REM', timezone: 'UTC', zips: [] })
    const excluded = []
    for (const [name, extra] of [
      ['Inactive', { active: false }], ['Other branch', { branchId: branch.id }],
      ['Missing skill', { skills: [] }], ['Outside area', { zips: ['60602'] }],
      ['Time off', { timeOff: [{ from: date, to: date, reason: 'Away' }] }],
      ['Calendar busy', {}], ['Already booked', {}],
    ]) excluded.push(await h.command('technician.save', { name, skills: ['gas'], zips: ['60601'], ...extra }))
    const calendar = excluded.find(x => x.name === 'Calendar busy')
    const url = 'https://calendar.google.com/calendar/ical/synthetic-glove-219/basic.ics'
    h.calendars.set(url, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', 'DTSTART:20261022T120000Z', 'DTEND:20261022T130000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'))
    await h.command('technician.calendar', { technicianId: calendar.id, url })
    await b.dispatcher.run('technician.calendarRead', { technicianId: calendar.id })
    const blocker = await b.dispatcher.run('visit.book', { jobId: gasJob.id, technicianId: excluded.at(-1).id, date, start: '12:00', end: '13:00' })
    // At 11:10 the 09:00 visit is 70 minutes overdue, so expected free is 12:20.
    const eligiblePath = `/api/glove/delays?at=${date}T11:10:00.000Z`
    const readEligible = async () => (await h.request(eligiblePath).then(r => r.json())).risks.find(r => r.visitId === skilled.id)
    let options = (await readEligible()).options
    assert.deepEqual(options.map(o => [o.technicianId, o.start]), [[b.tom.id, '12:00'], [b.priya.id, '12:30']])
    await b.dispatcher.run('visit.cancel', { visitId: blocker.id, version: blocker.version, reason: 'Release slot' })
    options = (await readEligible()).options
    assert.deepEqual(options.slice(0, -1).map(o => [o.technicianId, o.start]).sort(), [[b.tom.id, '12:00'], [excluded.at(-1).id, '12:00']].sort())
    assert.deepEqual([options.at(-1).technicianId, options.at(-1).start], [b.priya.id, '12:30'])
    const watch = await h.request('/api/glove/delays?at=2026-10-22T10:20:00.000Z').then(r => r.json())
    const own = watch.risks.find(r => r.visitId === next.id).options.at(-1)
    assert.deepEqual([own.technicianId, own.start, own.end], [b.priya.id, '10:45', '11:45'])
  })
  await scenario(t, 'AGENT-003 point 2: desk and Agent reads are branch scoped and field roles are refused without writes', async t => {
    const { h, b, book, watch } = await delayFixture(t)
    const long = await book(b.priya.id, '09:00', '10:00')
    const later = await book(b.priya.id, '10:20', '11:20')
    await b.priyaPerson.run('visit.arrive', { visitId: long.id, deviceTime: long.startAt })
    const branch = await h.command('branch.save', { name: 'Other workshop', prefix: 'OTH', timezone: 'UTC', zips: [] })
    const customer = await h.command('customer.save', { name: 'Other customer', branchId: branch.id })
    const site = await h.command('site.save', { customerId: customer.id, address: '22 Other Street', branchId: branch.id })
    const technician = await h.command('technician.save', { name: 'Other technician', branchId: branch.id })
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: 'Other branch parts' })
    const other = await h.command('visit.book', { jobId: job.id, technicianId: technician.id, date, start: '11:00', end: '12:00' })
    const warehouse = await h.command('stock.location', { kind: 'warehouse', name: 'Other warehouse', branchId: branch.id })
    const material = await h.command('service.save', { code: 'DELAY-PART', name: 'Replacement part', kind: 'material', unitPrice: '20.00' })
    await h.command('po.save', { supplier: 'Other supplier', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '1' }] })
    const sub = await h.person('Synthetic Glove Sub', 'subcontractor')
    const before = await h.state()
    for (const as of [h.owner(), b.dispatcher.cookie, b.office.cookie, b.agent.cookie]) {
      assert.deepEqual((await watch(as)).risks.map(r => r.visitId).sort(), [later.id, other.id].sort())
    }
    for (const as of [b.priyaPerson.cookie, sub.cookie]) assert.equal((await h.request(watchPath, { as })).status, 403)
    assert.deepEqual(await h.state(), before, 'all watch reads are side-effect free')
    await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: 'main' })
    const scoped = await watch(b.dispatcher.cookie)
    assert.deepEqual(scoped.risks.map(r => r.visitId), [later.id])
    assert.ok(!JSON.stringify(scoped).includes(other.id))
    assert.ok(!JSON.stringify(scoped).includes(technician.id))
    const retained = await h.state()
    await h.restart()
    assert.deepEqual(await watch(b.dispatcher.cookie), scoped)
    assert.deepEqual(await h.state(), retained)
  })

  await scenario(t, 'AGENT-003 point 3: timers and arrivals use the overrun floor and exclude ineligible later visits at fixed instants', async t => {
    const { h, b, book } = await delayFixture(t)
    for (const [source, tech, person, readAt, expectedFree, overrun] of [
      ['timer', b.priya, b.priyaPerson, '10:05', '10:20', 5],
      ['arrival', b.tom, b.tomPerson, '10:40', '11:20', 40],
    ]) {
      const earlier = await book(tech.id, '09:00', '10:00')
      const earlierJob = (await h.state()).jobs.find(j => j.id === earlier.jobId)
      if (source === 'timer') {
        await person.run('clock.in', { deviceTime: earlier.startAt })
        await person.run('timer.start', { visitId: earlier.id, kind: 'job', deviceTime: earlier.startAt })
      }
      else await person.run('visit.arrive', { visitId: earlier.id, deviceTime: earlier.startAt })
      const riskA = await book(tech.id, '10:00', '10:10')
      const riskB = await book(tech.id, '10:10', '10:15')
      const boundary = await book(tech.id, expectedFree, source === 'timer' ? '10:30' : '11:30')
      const after = await book(tech.id, '12:00', '12:10')
      const otherDate = await book(tech.id, '10:00', '10:10', { date: '2026-10-23' })
      const cancelled = await book(tech.id, '10:15', '10:16')
      await b.dispatcher.run('visit.cancel', { visitId: cancelled.id, version: cancelled.version, reason: 'Customer unavailable' })
      const arrived = await book(tech.id, '10:16', '10:17')
      await person.run('visit.arrive', { visitId: arrived.id, deviceTime: arrived.startAt })
      const completed = await book(tech.id, '10:17', '10:18')
      await person.run('visit.arrive', { visitId: completed.id, deviceTime: completed.startAt })
      await person.run('visit.complete', { visitId: completed.id, deviceTime: completed.endAt, summary: 'Inspection complete', signoff: { absentReason: 'Customer away' } })
      const before = await h.state()
      const read = () => h.request(`/api/glove/delays?at=${date}T${readAt}:00.000Z`).then(r => r.json())
      const risks = (await read()).risks.filter(r => [riskA.id, riskB.id, boundary.id, after.id, otherDate.id, cancelled.id, arrived.id, completed.id].includes(r.visitId))
      assert.deepEqual(risks.map(r => r.visitId), [riskA.id, riskB.id])
      for (const r of risks) assert.ok(r.reasons.includes(`${tech.name} is still on ${earlierJob.number}, ${overrun} min past its booked end; expected free about ${expectedFree}.`), JSON.stringify(r))
      assert.deepEqual(await h.state(), before)
      const readBeforeRestart = await read()
      await h.restart()
      assert.deepEqual(await read(), readBeforeRestart)
      assert.deepEqual(await h.state(), before)
    }
  })

  await scenario(t, 'AGENT-003 point 4: draft sent and partly received orders flag the visit until every ordered part arrives', async t => {
    const { h, b, book, watch } = await delayFixture(t)
    const visit = await book(b.tom.id, '11:00', '12:00')
    const part = await h.command('service.save', { code: 'DELAY-FILTER', name: 'Replacement filters', kind: 'material', unitPrice: '20.00' })
    const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Local warehouse' })
    let po = await b.office.run('po.save', { supplier: 'Filter supplier', locationId: warehouse.id, jobId: visit.jobId, lines: [{ serviceId: part.id, quantity: '2' }] })
    const assertOrder = async status => {
      const before = await h.state()
      const risk = (await watch()).risks.find(r => r.visitId === visit.id)
      assert.ok(risk.reasons.includes(`${po.number} from Filter supplier is ${status}; reschedule once the parts' arrival is known.`), JSON.stringify(risk))
      assert.deepEqual(await h.state(), before)
    }
    await assertOrder('draft')
    po = await b.office.run('po.send', { poId: po.id, version: po.version, method: 'phone' })
    await assertOrder('sent')
    po = await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] })
    await assertOrder('partly received')
    po = await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] })
    assert.equal(po.status, 'received')
    assert.ok(!(await watch()).risks.some(r => r.visitId === visit.id))
    await h.restart()
    assert.ok(!(await watch()).risks.some(r => r.visitId === visit.id))
  })

  await scenario(t, 'AGENT-003 point 6: fixed proposals enforce current roles independent approval conflict review stale refusal and replay', async t => {
    const { h, b, book } = await delayFixture(t)
    const visit = await book(b.priya.id, '11:00', '12:00', { window: { start: '10:00', end: '13:00' } })
    const owner = { id: (await h.request('/auth/session').then(r => r.json())).operator.id, name: 'Olivia Owner', run: h.command }
    const sub = await h.person('Synthetic Glove Field', 'subcontractor')
    const proposalPayload = start => ({ kind: 'move', visitId: visit.id, plan: { technicianId: b.tom.id, start, end: `${Number(start.slice(0, 2)) + 1}:00` }, rationale: 'Recover a delayed visit' })
    const refused = async (person, type, payload, error) => {
      const before = await h.state()
      await person.run(type, payload, { error })
      assert.deepEqual(await h.state(), before, `${error} changes nothing`)
    }
    for (const person of [b.office, b.priyaPerson, sub]) await refused(person, 'proposal.prepare', proposalPayload('11:00'), 'FORBIDDEN')
    const prepared = []
    for (const [i, person] of [b.agent, owner, b.dispatcher].entries()) {
      const commandId = `synthetic-glove-delay-prepare-${i}`
      const payload = proposalPayload('11:00')
      const proposal = await person.run('proposal.prepare', payload, { commandId })
      assert.equal(proposal.preparedBy.id, person.id)
      assert.deepEqual(await person.run('proposal.prepare', payload, { commandId }), proposal)
      if (person !== b.agent) await refused(person, 'proposal.approve', { proposalId: proposal.id, version: proposal.version }, 'SELF_APPROVAL')
      else await refused(person, 'proposal.approve', { proposalId: proposal.id, version: proposal.version }, 'FORBIDDEN')
      prepared.push({ person, payload, commandId, proposal })
    }
    const collision = await book(b.tom.id, '11:00', '12:00')
    const chosen = prepared[0].proposal
    const approve = { proposalId: chosen.id, version: chosen.version }
    const error = await b.dispatcher.run('proposal.approve', approve, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(error.details.conflicts.map(c => c.code), [`overlap:${collision.id}`])
    await refused(b.dispatcher, 'proposal.approve', approve, 'CONFLICT_REVIEW')
    const approvalPayload = { ...approve, acknowledge: [`overlap:${collision.id}`] }
    const approved = await b.dispatcher.run('proposal.approve', approvalPayload, { commandId: 'synthetic-glove-delay-approve' })
    const moved = (await h.state()).visits.find(v => v.id === visit.id)
    assert.deepEqual([moved.technicianId, moved.local.start, moved.local.end], [b.tom.id, '11:00', '12:00'])
    assert.deepEqual(moved.assignments.at(-1).reviewedConflicts.map(c => c.code), [`overlap:${collision.id}`])
    for (const old of prepared.slice(1)) await refused(old.person === owner ? b.dispatcher : owner, 'proposal.approve', { proposalId: old.proposal.id, version: old.proposal.version }, 'STALE')
    for (const person of [b.office, b.priyaPerson, sub]) await refused(person, 'proposal.approve', { proposalId: chosen.id, version: chosen.version }, 'FORBIDDEN')
    const fresh = await b.dispatcher.run('proposal.prepare', proposalPayload('13:00'))
    await owner.run('proposal.approve', { proposalId: fresh.id, version: fresh.version })
    const ownerPrepared = await owner.run('proposal.prepare', proposalPayload('14:00'))
    await b.dispatcher.run('proposal.approve', { proposalId: ownerPrepared.id, version: ownerPrepared.version })
    const final = await h.state()
    assert.equal(final.visits.find(v => v.id === visit.id).local.start, '14:00')
    assert.deepEqual(await b.dispatcher.run('proposal.approve', approvalPayload, { commandId: 'synthetic-glove-delay-approve' }), approved)
    assert.deepEqual(await h.state(), final, 'an approval replay cannot move a visit again or undo the later move')
    await h.restart()
    assert.deepEqual(await h.state(), final)
    assert.deepEqual(await b.dispatcher.run('proposal.approve', approvalPayload, { commandId: 'synthetic-glove-delay-approve' }), approved)
    assert.deepEqual(await h.state(), final)
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await refused(b.dispatcher, 'proposal.approve', approvalPayload, 'FORBIDDEN')
    await b.dispatcher.run('proposal.approve', approvalPayload, { commandId: 'synthetic-glove-delay-approve', error: 'FORBIDDEN' })
    const activity = await h.request('/api/glove/activity').then(r => r.json())
    const exported = await h.request('/api/glove/export').then(r => r.json())
    for (const [proposal, preparer, approver] of [[chosen, b.agent, b.dispatcher], [fresh, b.dispatcher, owner], [ownerPrepared, owner, b.dispatcher]]) {
      for (const [kind, person] of [['proposal.prepared', preparer], ['proposal.approved', approver]]) {
        const events = activity.events.filter(e => e.subjectId === proposal.id && e.kind === kind)
        assert.equal(events.length, 1)
        assert.deepEqual([events[0].actorId, events[0].actorName], [person.id, person.name])
        const rows = exported.timeline.filter(e => e.id === events[0].id)
        assert.equal(rows.length, 1)
        assert.deepEqual([rows[0].actor_id, rows[0].actor_name], [person.id, person.name])
      }
    }
  })

  await scenario(t, 'AGENT-003 point 7: same-time and in-window moves retain promises while outside and other-day moves drop them', async t => {
    const { h, b, book, watch } = await delayFixture(t)
    const window = { start: '10:00', end: '12:00' }
    const cases = [
      ['same time', { start: '11:00', end: '12:00' }, 'unchanged', window],
      ['inside including last instant', { start: '12:00', end: '13:00' }, 'unchanged', window],
      ['outside', { start: '14:00', end: '15:00' }, 'customer not yet asked', undefined],
      ['another day', { date: '2026-10-23', start: '11:00', end: '12:00' }, 'customer not yet asked', undefined],
    ]
    for (const [i, [name, plan, customer, expectedWindow]] of cases.entries()) {
      const own = await h.command('technician.save', { name: `Recovery technician ${i}` })
      const visit = await book(b.priya.id, '11:00', '12:00', { date: `2026-10-${24 + i}`, window })
      // Each case has an independent day, so no artificial overlapping bookings are needed.
      const datePlan = name === 'another day' ? plan : { ...plan, date: visit.local.date }
      const payload = { kind: 'move', visitId: visit.id, plan: { ...datePlan, technicianId: own.id }, rationale: name }
      const proposal = await b.agent.run('proposal.prepare', payload, { commandId: `synthetic-glove-window-prepare-${i}` })
      assert.equal(proposal.customer, customer)
      const approval = { proposalId: proposal.id, version: proposal.version }
      await b.dispatcher.run('proposal.approve', approval, { commandId: `synthetic-glove-window-approve-${i}` })
      const before = await h.state()
      const moved = before.visits.find(v => v.id === visit.id)
      assert.deepEqual([moved.local.start, moved.local.end, moved.local.date, moved.arrivalWindow], [plan.start, plan.end, datePlan.date, expectedWindow])
      if (customer !== 'unchanged') assert.match(moved.assignments.at(-1).reason, /customer not yet asked/)
      const read = await watch()
      assert.deepEqual(await h.state(), before)
      await h.restart()
      assert.deepEqual(await watch(), read)
      assert.deepEqual(await h.state(), before)
      const exported = await h.request('/api/glove/export').then(r => r.json())
      assert.deepEqual(exported.visits.find(v => v.id === moved.id).arrivalWindow, expectedWindow)
      await b.agent.run('proposal.prepare', payload, { commandId: `synthetic-glove-window-prepare-${i}` })
      await b.dispatcher.run('proposal.approve', approval, { commandId: `synthetic-glove-window-approve-${i}` })
      assert.deepEqual(await h.state(), before)
    }
  })
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const job = async title => b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, title)).id })
  const legacyDate = '2026-10-22', [first, next] = [await job('Morning service'), await job('Second service')]
  const long = await b.dispatcher.run('visit.book', { jobId: first.id, technicianId: b.priya.id, date: legacyDate, start: '09:00', end: '10:00' })
  const later = await b.dispatcher.run('visit.book', { jobId: next.id, technicianId: b.priya.id, date: legacyDate, start: '10:30', end: '11:30', window: { start: '10:00', end: '12:00' } })
  await b.priyaPerson.run('visit.arrive', { visitId: long.id, deviceTime: long.startAt })
  const at = new Date(Date.parse(long.endAt) + 20 * 60_000).toISOString()

  // Twenty minutes past the booked end, Priya is expected free at 10:40: the 10:30 visit is at risk.
  assert.equal((await h.request(`/api/glove/delays?at=${at}`, { as: b.priyaPerson.cookie })).status, 403)
  const watch = await (await h.request(`/api/glove/delays?at=${at}`, { as: b.agent.cookie })).json()
  const risk = watch.risks.find(r => r.visitId === later.id)
  assert.ok(risk, JSON.stringify(watch))
  assert.match(risk.reasons[0], /still on .*20 min past its booked end; expected free about 10:40/)
  assert.deepEqual(risk.options.map(o => [o.technicianId, o.start, o.customer]), [[b.tom.id, '10:30', 'unchanged'], [b.priya.id, '10:45', 'unchanged']])

  // The agent proposes Tom at the same time; the agent cannot approve its own proposal; a dispatcher approves with GLOVE-07 review.
  const option = risk.options[0]
  const proposal = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: option.technicianId, start: option.start, end: option.end }, rationale: risk.reasons[0] })
  assert.deepEqual([proposal.customer, proposal.plan.technicianId], ['unchanged', b.tom.id])
  await b.agent.run('proposal.approve', { proposalId: proposal.id, version: proposal.version }, { error: 'FORBIDDEN' })
  await b.dispatcher.run('proposal.approve', { proposalId: proposal.id, version: proposal.version })
  const moved = (await h.state()).visits.find(v => v.id === later.id)
  assert.deepEqual([moved.technicianId, moved.local.start, moved.arrivalWindow], [b.tom.id, '10:30', { start: '10:00', end: '12:00' }])
  assert.ok((await h.state()).events.some(e => e.kind === 'visit.changed' && e.subjectId === later.id && /Approved delay proposal from Ada Agent/.test(e.summary)))
  assert.ok(!(await (await h.request(`/api/glove/delays?at=${at}`, { as: b.dispatcher.cookie })).json()).risks.some(r => r.visitId === later.id))

  // Under a grant the agent moves the visit itself only inside the promised window, never changing it.
  await h.command('grant.create', { agentId: b.agent.id, action: 'visit.change' })
  const inside = await b.agent.run('visit.change', { visitId: later.id, version: moved.version, start: '11:00', end: '12:00', reason: 'Tom is finishing nearby' })
  assert.deepEqual([inside.local.start, inside.arrivalWindow], ['11:00', { start: '10:00', end: '12:00' }])
  await b.agent.run('visit.change', { visitId: later.id, version: inside.version, start: '13:00', end: '14:00', reason: 'Afternoon' }, { error: 'WINDOW' })
  await b.agent.run('visit.change', { visitId: later.id, version: inside.version, start: '13:00', end: '14:00', window: { start: '13:00', end: '15:00' }, reason: 'Afternoon' }, { error: 'GRANT_SCOPE' })

  // A move outside the window is a proposal labelled "customer not yet asked"; approving it drops the old promise.
  const outside = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: b.tom.id, start: '14:00', end: '15:00' }, rationale: 'Customer prefers after lunch' })
  assert.equal(outside.customer, 'customer not yet asked')
  await b.dispatcher.run('proposal.approve', { proposalId: outside.id, version: outside.version })
  const afternoon = (await h.state()).visits.find(v => v.id === later.id)
  assert.deepEqual([afternoon.local.start, afternoon.arrivalWindow], ['14:00', undefined])
  assert.ok((await h.state()).events.some(e => e.subjectId === outside.id && e.kind === 'proposal.prepared' && /customer not yet asked/.test(e.summary)))

  // Without a promised window, even an open same-day slot needs dispatcher approval.
  const beforeUnbounded = await h.state()
  await b.agent.run('visit.change', { visitId: later.id, version: afternoon.version, start: '15:00', end: '16:00', reason: 'No customer window on record' }, { error: 'GRANT_SCOPE' })
  const afterUnbounded = await h.state()
  assert.deepEqual(afterUnbounded.visits.find(v => v.id === later.id), afternoon, 'the refused move keeps the visit unchanged')
  assert.deepEqual(afterUnbounded.grants, beforeUnbounded.grants, 'a refused move consumes no grant use')
  const reviewed = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: b.tom.id, start: '15:00', end: '16:00' }, rationale: 'Dispatcher must review a visit without a promised window' })
  assert.equal(reviewed.customer, 'customer not yet asked')
  await b.dispatcher.run('proposal.approve', { proposalId: reviewed.id, version: reviewed.version })
  assert.equal((await h.state()).visits.find(v => v.id === later.id).local.start, '15:00')

  // A purchase order for a visit's job not yet received puts that visit on the watch too.
  const cap = await h.command('service.save', { code: 'CAP-45', name: 'Run capacitor', kind: 'material', unit: 'each', unitCost: '11.50', unitPrice: '35.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const parts = await job('Capacitor swap')
  const partsVisit = await b.dispatcher.run('visit.book', { jobId: parts.id, technicianId: b.tom.id, date: '2026-10-23', start: '09:00', end: '10:00' })
  const po = await b.office.run('po.save', { supplier: 'Supply Co', locationId: warehouse.id, jobId: parts.id, lines: [{ serviceId: cap.id, quantity: '1' }] })
  const flagged = (await (await h.request(`/api/glove/delays?at=${at}`)).json()).risks.find(r => r.visitId === partsVisit.id)
  assert.match(flagged.reasons[0], new RegExp(`${po.number} from Supply Co is draft`))
})
