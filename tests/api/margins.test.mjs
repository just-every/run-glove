// COST-005 live margin warnings through the business, command and state doors:
// time and costs past the owner's threshold warn the owner and the dispatcher
// once each while the job is open, and the same crossing never repeats.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'

test('COST-005 time past the cost threshold warns the owner and the dispatcher once each, and the margin floor warns separately', async (t) => {
  const h = await installation({ at: '2026-10-21T02:00:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  const secondDispatcher = await h.person('Synthetic Glove Dispatcher', 'dispatcher')
  const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
  const subcontractor = await h.person('Synthetic Glove Subcontractor', 'subcontractor')
  const reportRole = await h.command('role.save', { name: 'Synthetic cost reader', permissions: ['reports.read', 'export.read'] })
  const reportReader = await h.person('Synthetic Glove Reader', `custom:${reportRole.id}`)
  const plainRole = await h.command('role.save', { name: 'Synthetic desk reader', permissions: ['export.read'] })
  const plainReader = await h.person('Synthetic Glove Desk', `custom:${plainRole.id}`)
  const invites = h.mails.length
  const biz = (await h.state()).business[0]
  await h.command('business.save', { version: biz.version, name: biz.name, timezone: biz.timezone, marginWatch: { costPercent: 'lots' } }, { error: 'INPUT' })
  await h.command('business.save', { version: biz.version, name: biz.name, timezone: biz.timezone, marginWatch: { costPercent: '100', marginFloor: '30' } })
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, costRate: '45.00' })
  const condenser = await h.command('service.save', { code: 'COND-3T', name: '3-ton condenser', kind: 'material', category: 'Equipment', unit: 'each', unitCost: '700.00', unitPrice: '1400.00', tax: 'GST' })
  const install = await h.command('service.save', { code: 'INST-LAB', name: 'Condenser install labor', kind: 'service', category: 'Labor', unit: 'job', unitCost: '391.50', unitPrice: '450.00', tax: 'GST' })
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Condenser replacement', lines: [{ description: '3-ton condenser', quantity: '1', unitPrice: '1400.00', serviceId: condenser.id }, { description: 'Install labor', quantity: '1', unitPrice: '450.00', serviceId: install.id }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '08:00', end: '12:00' })
  const at = time => `2026-10-21T${time}:00+11:00`
  const warnings = async person => (await person.state()).warnings.filter(w => w.jobId === job.id).map(w => w.kind)
  const people = { owner: { state: () => h.state() }, dispatcher: b.dispatcher, secondDispatcher }

  // Estimate $1,091.50: the condenser and a $300 expense stay under it; four hours on the job pass it.
  await b.priyaPerson.run('clock.in', { deviceTime: at('07:55') })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at('08:00') })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at('08:30'), kind: 'material', serviceId: condenser.id, quantity: '1' })
  await b.office.run('expense.record', { jobId: job.id, category: 'equipment rental', vendor: 'Lift Hire', amount: '300.00', billable: false })
  for (const person of Object.values(people)) assert.deepEqual(await warnings(person), [])
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: at('08:00') })
  const timerStopId = randomUUID(), timerStop = { visitId: visit.id, deviceTime: at('12:00') }
  const stopped = await b.priyaPerson.run('timer.stop', timerStop, { commandId: timerStopId })
  for (const person of Object.values(people)) assert.deepEqual(await warnings(person), ['cost'], 'one warning to each of the owner and the dispatcher')
  for (const person of [b.office, b.priyaPerson, b.agent]) assert.deepEqual(await warnings(person), [])
  const warned = (await h.state()).warnings[0]
  assert.deepEqual({ jobId: warned.jobId, number: warned.number, kind: warned.kind, setting: warned.setting, to: warned.to }, { jobId: job.id, number: job.number, kind: 'cost', setting: '100', to: ['owner', 'dispatcher'] })
  assert.ok(warned.id)
  assert.equal(warned.createdAt, '2026-10-21T02:00:00.000Z')
  assert.deepEqual([warned.actual, warned.estimate, warned.projectedMargin], ['1180.00', '1091.50', '36.2'])

  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-21T02:01:00Z' } })
  // More cost is the same crossing: no repeat. Falling below the 30% floor is its own warning, once.
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '20.00', billable: false })
  assert.deepEqual(await warnings(b.dispatcher), ['cost'])
  await b.office.run('expense.record', { jobId: job.id, category: 'subcontractor bill', vendor: 'Harbour Cranes', amount: '200.00', billable: false })
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '5.00', billable: false })
  assert.deepEqual(await warnings(b.dispatcher), ['cost', 'margin'])
  assert.deepEqual(await warnings(people.owner), ['cost', 'margin'])
  const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()
  assert.equal(timeline.events.filter(e => e.kind.startsWith('margin.')).length, 2)
  assert.ok(timeline.events.some(e => e.summary.includes('projected margin 24.3% is below the 30% floor')))

  // Retained facts never become a live recomputation or a second warning.
  await b.dispatcher.run('customer.save', { name: 'Synthetic unrelated customer' })
  assert.deepEqual(await b.priyaPerson.run('timer.stop', timerStop, { commandId: timerStopId }), stopped)
  await h.restart()
  for (const person of Object.values(people)) {
    const kept = (await person.state()).warnings.filter(w => w.jobId === job.id)
    assert.deepEqual(kept.map(w => w.kind), ['cost', 'margin'])
    assert.deepEqual(kept[0], warned, 'later costs, replay and a real Worker restart preserve the warning verbatim')
  }
  const { activity, exported } = await assertTrail(h, ['margin.cost', 'margin.margin'])
  const first = activity.find(e => e.subjectId === warned.id)
  assert.deepEqual([first.actorId, first.actorName, first.actorRole, first.commandId, first.at, first.jobId], [b.priyaPerson.id, b.priyaPerson.name, 'technician', timerStopId, '2026-10-21T02:00:00.000Z', job.id])
  assert.deepEqual(exported.warnings.find(w => w.id === warned.id), warned)
  assert.equal(exported.timeline.filter(e => e.subject_id === warned.id).length, 1)

  // Warning records are addressed to owners and dispatchers. Report readers
  // may read warning timeline events, but that does not address a warning to them.
  for (const [person, reports, jobVisible, exports] of [
    [b.office, true, true, true], [viewer, true, true, false], [b.agent, true, true, false],
    [reportReader, true, true, true], [plainReader, false, true, true],
    [b.priyaPerson, false, true, false], [b.tomPerson, false, false, false], [subcontractor, false, false, false],
  ]) {
    assert.deepEqual((await person.state()).warnings, [], `${person.name} receives no addressed warning`)
    const response = await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: person.cookie })
    assert.equal(response.status, jobVisible ? 200 : 404)
    if (jobVisible) assert.equal((await response.json()).events.filter(e => e.kind.startsWith('margin.')).length, reports ? 2 : 0)
    const history = await h.request('/api/glove/activity', { as: person.cookie }).then(r => r.json())
    assert.equal(history.events.filter(e => e.kind.startsWith('margin.')).length, reports ? 2 : 0)
    const download = await h.request('/api/glove/export', { as: person.cookie })
    assert.equal(download.status, exports ? 200 : 403)
    if (exports) {
      const data = await download.json()
      assert.deepEqual(data.warnings, [], 'business download respects warning recipients')
      assert.equal(data.timeline.filter(e => e.kind.startsWith('margin.')).length, reports ? 2 : 0)
    }
  }
  assert.equal((await h.request('/api/glove/state', { as: '' })).status, 401)
  const otherBranch = await h.command('branch.save', { name: 'Synthetic distant branch', prefix: 'SYN', timezone: 'Australia/Sydney', zips: [] })
  await h.command('branch.limit', { operatorId: secondDispatcher.id, branchId: otherBranch.id })
  assert.deepEqual((await secondDispatcher.state()).warnings, [])
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: secondDispatcher.cookie })).status, 404)
  await h.command('branch.limit', { operatorId: secondDispatcher.id, branchId: 'main' })
  assert.deepEqual((await secondDispatcher.state()).warnings.map(w => w.kind), ['cost', 'margin'])
  await h.command('role.set', { operatorId: secondDispatcher.id, role: 'viewer' })
  assert.deepEqual((await secondDispatcher.state()).warnings, [], 'current role withdrawal removes addressed warnings')
  const token = await h.command('token.issue', { name: 'Synthetic margin read', role: 'dispatcher' })
  const tokenRead = () => h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${token.token}` } })
  assert.deepEqual((await tokenRead().then(r => r.json())).warnings.find(w => w.id === warned.id), warned)
  await h.command('token.revoke', { tokenId: token.id })
  assert.equal((await tokenRead()).status, 401)

  let tick = Date.parse('2026-10-21T03:00:00Z')
  const advance = () => h.request('/__test/clock', { method: 'POST', body: { at: new Date(tick += 60_000).toISOString() } })
  const settings = async marginWatch => {
    await advance()
    const current = (await h.state()).business[0]
    return h.command('business.save', { version: current.version, name: current.name, timezone: current.timezone, marginWatch })
  }
  const costWarnings = async id => (await h.state()).warnings.filter(w => w.jobId === id)
  const expense = async (id, amount) => { await advance(); return b.office.run('expense.record', { jobId: id, category: 'permit', vendor: 'Synthetic permit', amount, billable: false }) }
  const nativeJob = async (title, serviceId) => {
    const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ description: title, quantity: '1', unitPrice: '200.00', ...(serviceId ? { serviceId } : {}) }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Synthetic customer' })
    return b.dispatcher.run('job.create', { quoteId: quote.id })
  }
  // Blank controls are independently off. No hidden pending warning is created.
  await settings({ costPercent: '', marginFloor: '' })
  const hundred = await h.command('service.save', { code: 'SYN-COST', name: 'Synthetic costed work', unitPrice: '200.00', unitCost: '100.00', tax: 'GST' })
  const boundary = await nativeJob('Synthetic boundary job', hundred.id)
  await expense(boundary.id, '99.99')
  assert.deepEqual(await costWarnings(boundary.id), [])
  await settings({ costPercent: '100', marginFloor: '' })
  assert.deepEqual(await costWarnings(boundary.id), [], 'one cent below the threshold does not warn')
  await expense(boundary.id, '0.01')
  const exactCost = (await costWarnings(boundary.id))[0]
  assert.deepEqual([exactCost.kind, exactCost.setting, exactCost.estimate, exactCost.actual, exactCost.projectedMargin], ['cost', '100', '100.00', '100.00', '50.0'])
  await settings({ costPercent: '', marginFloor: '50' })
  assert.deepEqual((await costWarnings(boundary.id)).map(w => w.kind), ['cost'], 'equal to the margin floor does not warn')
  await expense(boundary.id, '0.20')
  const belowFloor = (await costWarnings(boundary.id))[1]
  assert.deepEqual([belowFloor.kind, belowFloor.setting, belowFloor.estimate, belowFloor.actual, belowFloor.projectedMargin], ['margin', '50', '100.00', '100.20', '49.9'])

  // Projected cost uses the larger estimate even before actual costs arrive.
  const projected = await nativeJob('Synthetic projected job', hundred.id)
  assert.deepEqual(await costWarnings(projected.id), [])
  await settings({ costPercent: '', marginFloor: '50.1' })
  assert.deepEqual((await costWarnings(projected.id)).map(w => [w.kind, w.estimate, w.actual, w.projectedMargin]), [['margin', '100.00', '0.00', '50.0']])
  await settings({ costPercent: '100', marginFloor: '' })
  const zero = await nativeJob('Synthetic zero estimate')
  await expense(zero.id, '500.00')
  assert.deepEqual(await costWarnings(zero.id), [], 'a zero estimate cannot cross a cost threshold')
  await settings({ costPercent: '', marginFloor: '0' })
  assert.deepEqual((await costWarnings(zero.id)).map(w => [w.kind, w.actual, w.projectedMargin]), [['margin', '500.00', '-150.0']])

  // A changed setting warns once, and returning to an earlier setting reuses it.
  await settings({ costPercent: '90', marginFloor: '' })
  assert.deepEqual((await costWarnings(boundary.id)).filter(w => w.kind === 'cost').map(w => w.setting), ['100', '90'])
  await settings({ costPercent: '100', marginFloor: '' })
  assert.deepEqual((await costWarnings(boundary.id)).find(w => w.id === exactCost.id), exactCost)
  assert.equal((await costWarnings(boundary.id)).filter(w => w.kind === 'cost').length, 2)
  const beforeRefusal = await h.state()
  const current = beforeRefusal.business[0]
  for (const person of [b.dispatcher, b.office, b.priyaPerson, b.agent, viewer, subcontractor, reportReader, plainReader]) {
    await person.run('business.save', { version: current.version, name: current.name, timezone: current.timezone, marginWatch: { costPercent: '1', marginFloor: '100' } }, { error: 'FORBIDDEN' })
  }
  assert.deepEqual((await h.state()).business, beforeRefusal.business)
  assert.deepEqual((await h.state()).warnings, beforeRefusal.warnings)

  // A completed job is excluded even when a later setting would cross it.
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at('12:10'), summary: 'Synthetic completed install', signoff: { absentReason: 'Synthetic customer absent' } })
  const closedWarnings = await costWarnings(job.id)
  await settings({ costPercent: '1', marginFloor: '99' })
  await expense(job.id, '1.00')
  assert.deepEqual(await costWarnings(job.id), closedWarnings)
  await h.restart()
  assert.deepEqual(await costWarnings(job.id), closedWarnings)
  assert.deepEqual([h.email.sent.length, h.twilio.calls.length, h.pushes.sent.length, h.mails.length - invites], [0, 0, 0, 0], 'warnings attempt no outbound message')
})
