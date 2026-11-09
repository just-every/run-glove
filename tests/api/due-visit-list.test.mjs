import { scenario } from '../fixtures/scenario.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation } from './harness.mjs'
import { connectMail } from '../fixtures/mail-providers.mjs'

const at = '2026-11-06T00:30:00.000Z'
const read = async (h, path, as) => {
  const response = await h.request(path, as ? { as: as.cookie } : {})
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}
const due = async h => (await read(h, '/api/glove/due-visits')).visits
const ordered = rows => rows.map(v => ({ id: v.id, agreementId: v.agreementId, index: v.index, due: v.due, customerId: v.customerId, customer: v.customer, siteId: v.siteId, address: v.address, area: v.area, jobId: v.jobId, visitId: v.visitId, booked: v.booked })).sort((a, b) => a.id.localeCompare(b.id))
async function setup(h, options = {}) {
  await h.command('business.save', { name: 'Synthetic Glove Care', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'DUE', name: 'Seasonal care', unitPrice: '100.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Included Care', price: '200.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, ...options })
  const office = await h.person('Due Office', 'office'), dispatcher = await h.person('Due Dispatcher', 'dispatcher')
  const worker = await h.person('Due Worker', 'technician')
  const technician = await h.command('technician.save', { name: worker.name, operatorId: worker.id })
  return { plan, office, dispatcher, worker, technician }
}
async function member(h, plan, n, startDate = '2026-04-30', zip = '78704', branchId) {
  const customer = await h.command('customer.save', { name: `Synthetic member ${n}`, email: [`member${n}`, 'example.test'].join('@'), ...(branchId ? { branchId } : {}) })
  const site = await h.command('site.save', { customerId: customer.id, address: `${n} Synthetic Street`, zip, ...(branchId ? { branchId } : {}) })
  return { customer, site, sale: { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate } }
}
const row = (m, agreement, index, date) => ({ id: `${agreement.id}:${index}`, agreementId: agreement.id, index, due: date, customerId: m.customer.id, customer: m.customer.name, siteId: m.site.id, address: m.site.address, area: m.site.zip, jobId: null, visitId: null, booked: false })
async function reserve(h, who, v, commandId) {
  return who.run('job.create', { customerId: v.customerId, siteId: v.siteId, agreementId: v.agreementId, agreementVisitIndex: v.index, title: 'Included seasonal care' }, { commandId })
}
async function book(b, who, job, hour = '09', date = '2026-11-05') {
  return who.run('visit.book', { jobId: job.id, technicianId: b.technician.id, date, start: `${hour}:00`, end: `${hour}:30` })
}
async function same(h, expected) {
  assert.deepEqual(ordered(await due(h)), ordered(expected))
  const tile = (await read(h, '/api/glove/dashboard')).agreementsDue
  assert.equal(tile.count, expected.length)
  assert.deepEqual(tile.list.map(v => v.id).sort(), expected.map(v => v.id).sort())
}

test("PLAN-004 points 1 to 3: forty-visit campaign, complete due rows and exact local calendar filters", async t => {
  await scenario(t, 'PLAN-004 point 1: forty due visits retain the exact remainder after thirty bookings, eight emailed offers, two declines and Worker restart', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await setup(h), expected = [], members = [], trail = []
  const remember = (commandId, kind, subjectId, actor) => trail.push({ commandId, kind, subjectId, actor })
  for (let n = 0; n < 20; n++) {
    const m = await member(h, b.plan, n, '2026-04-30', n < 15 ? '78704' : '78701')
    const commandId = `synthetic-glove-sale-${n}`, actor = n % 2 ? b.office : b.dispatcher
    const a = await actor.run('agreement.sell', m.sale, { commandId })
    remember(commandId, 'agreement.sold', a.id, actor); members.push({ ...m, a })
    expected.push(row(m, a, 0, '2026-04-30'), row(m, a, 1, '2026-10-30'))
  }
  await same(h, expected)
  for (const [n, v] of expected.filter(v => v.area === '78704').entries()) {
    const actor = n % 2 ? b.office : b.dispatcher
    const job = await reserve(h, actor, v), commandId = `synthetic-glove-book-${n}`
    const minute = 300 + n * 30, clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const visit = await actor.run('visit.book', { jobId: job.id, technicianId: b.technician.id, date: '2026-11-05', start: clock(minute), end: clock(minute + 30) }, { commandId })
    remember(commandId, 'visit.booked', visit.id, actor)
    Object.assign(v, { jobId: job.id, visitId: visit.id, booked: true })
    await same(h, expected)
  }
  await connectMail(h, 'postmark')
  const declines = [expected.find(v => v.agreementId === members[18].a.id && v.index === 1), expected.find(v => v.agreementId === members[19].a.id && v.index === 1)]
  const offers = expected.filter(v => v.area === '78701' && !declines.includes(v))
  assert.equal(offers.length, 8)
  for (const [n, v] of offers.entries()) {
    const commandId = `synthetic-glove-offer-${n}`
    const payload = { agreementId: v.agreementId, index: v.index, email: true, slots: [{ technicianId: b.technician.id, date: '2026-11-07', start: `${String(8 + n).padStart(2, '0')}:00`, end: `${String(8 + n).padStart(2, '0')}:30` }] }
    const offer = await b.office.run('agreement.offer', payload, { commandId })
    remember(commandId, 'agreement.offer.created', offer.id, b.office)
    assert.equal(h.email.sent.at(-1).to, members.find(m => m.a.id === v.agreementId).customer.email)
    assert.equal(offer.emailed.to, h.email.sent.at(-1).to)
    v.jobId = offer.jobId
    const beforeReplay = await read(h, '/api/glove/export')
    await b.office.run('agreement.offer', payload, { commandId })
    assert.deepEqual(await read(h, '/api/glove/export'), beforeReplay)
    await same(h, expected)
  }
  assert.equal(h.email.sent.length, 8)
  for (const [n, v] of declines.entries()) {
    const a = (await read(h, '/api/glove/agreements')).agreements.find(a => a.id === v.agreementId)
    const commandId = `synthetic-glove-decline-${n}`
    const payload = { agreementId: a.id, version: a.version, index: v.index, method: 'phone', customerName: v.customer, reason: 'Customer explicitly skips this visit' }
    await b.office.run('agreement.decline', payload, { commandId })
    remember(commandId, 'agreement.visitDeclined', a.id, b.office)
    expected.splice(expected.indexOf(v), 1)
    await same(h, expected)
    const beforeReplay = await read(h, '/api/glove/export')
    await b.office.run('agreement.decline', payload, { commandId })
    assert.deepEqual(await read(h, '/api/glove/export'), beforeReplay)
  }
  assert.equal(expected.length, 38)
  await h.restart(); await same(h, expected)
  const activity = [], exported = await read(h, '/api/glove/export')
  let cursor = ''
  do {
    const page = await read(h, '/api/glove/activity' + (cursor ? `?before=${encodeURIComponent(cursor)}` : ''))
    activity.push(...page.events); cursor = page.next ?? ''
  } while (cursor)
  for (const { commandId, kind, subjectId, actor } of trail) {
    const event = activity.find(e => e.commandId === commandId && e.kind === kind)
    assert.ok(event, `${kind} attributed Activity event`)
    assert.deepEqual([event.subjectId, event.actorId, event.actorName, event.actorRole, event.at], [subjectId, actor.id, actor.name, actor === b.office ? 'office' : 'dispatcher', at])
    const kept = exported.timeline.find(e => e.id === event.id)
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.command_id], [event.actorId, event.actorName, event.actorRole, commandId])
  }
})
  await scenario(t, 'PLAN-004 point 2: every due entry retains its agreement, ordinal, clamped calendar date, customer, site, ZIP, job and booking state', async t => {
  const h = await installation({ at: '2026-05-02T12:00:00Z' }); t.after(() => h.close())
  const b = await setup(h, { termMonths: 5, includedVisits: 3 }), m = await member(h, b.plan, 31, '2026-01-31')
  const a = await b.office.run('agreement.sell', m.sale)
  const expected = ['2026-01-31', '2026-02-28', '2026-04-30'].map((date, index) => row(m, a, index, date))
  await same(h, expected)
  const job = await reserve(h, b.dispatcher, expected[1])
  assert.equal(job.agreementVisitIndex, 1)
  expected[1].jobId = job.id; await same(h, expected)
  const visit = await book(b, b.office, job, '09', '2026-05-02')
  Object.assign(expected[1], { booked: true, visitId: visit.id }); await same(h, expected)
  await h.restart(); await same(h, expected)
})
  await scenario(t, 'PLAN-004 point 3: local today differs from UTC and date bounds and ZIP filters are exact and inclusive', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await setup(h), expected = []
  for (const [n, date, zip] of [[1, '2026-11-04', '78704'], [2, '2026-11-05', '78704'], [3, '2026-11-06', '78704'], [4, '2026-11-05', '78705']]) {
    const m = await member(h, b.plan, n, date, zip), a = await b.office.run('agreement.sell', m.sale)
    expected.push(row(m, a, 0, date))
  }
  const before = await read(h, '/api/glove/export'), result = await read(h, '/api/glove/due-visits')
  assert.equal(result.through, '2026-11-05')
  assert.deepEqual(ordered(result.visits), ordered(expected.filter(v => v.due !== '2026-11-06')))
  const bounded = await read(h, '/api/glove/due-visits?from=2026-11-04&through=2026-11-06&area=78704')
  assert.deepEqual(ordered(bounded.visits), ordered(expected.filter(v => v.area === '78704')))
  const one = await read(h, '/api/glove/due-visits?from=2026-11-05&through=2026-11-05&area=78704')
  assert.deepEqual(ordered(one.visits), ordered([expected[1]]))
  assert.deepEqual((await read(h, '/api/glove/due-visits?area=787')).visits, [])
  for (const query of ['through=2026-02-30', 'from=2026-02-31', 'through=2026-13-01', 'from=2026-11-06&through=2026-11-05']) assert.equal((await h.request(`/api/glove/due-visits?${query}`)).status, 400)
  assert.deepEqual(await read(h, '/api/glove/export'), before, 'reads and rejected dates change no record')
})
})

test("PLAN-004 points 4 to 7: entitlement identity survives completion, cancellation, term end and Worker upgrade", async t => {
  await scenario(t, 'PLAN-004 point 4: completing the later entitlement first removes only that visit and attributes the worker completion', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await setup(h), m = await member(h, b.plan, 1), a = await b.office.run('agreement.sell', m.sale)
  const expected = [row(m, a, 0, '2026-04-30'), row(m, a, 1, '2026-10-30')]
  for (const [n, v] of expected.entries()) {
    const job = await reserve(h, b.office, v), visit = await book(b, b.dispatcher, job, String(9 + n).padStart(2, '0'))
    Object.assign(v, { jobId: job.id, visitId: visit.id, booked: true })
  }
  const later = (await h.state()).visits.find(v => v.id === expected[1].visitId)
  await b.worker.run('visit.arrive', { visitId: later.id, deviceTime: later.startAt })
  const payload = { visitId: later.id, deviceTime: later.endAt, summary: 'Seasonal work complete', signoff: { absentReason: 'Customer out' } }, commandId = 'synthetic-glove-later-completion'
  await b.worker.run('visit.complete', payload, { commandId })
  await same(h, expected.slice(0, 1))
  const before = await read(h, '/api/glove/export')
  await b.worker.run('visit.complete', payload, { commandId })
  assert.deepEqual(await read(h, '/api/glove/export'), before)
  const event = (await read(h, '/api/glove/activity')).events.find(e => e.kind === 'job.completed' && e.commandId === commandId)
  assert.deepEqual([event.actorId, event.actorName, event.actorRole], [b.worker.id, b.worker.name, 'technician'])
  const kept = before.timeline.find(e => e.id === event.id)
  assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role], [b.worker.id, b.worker.name, 'technician'])
  await h.restart(); await same(h, expected.slice(0, 1))
})
  await scenario(t, 'PLAN-004 point 5: booking, cancellation, actual term expiry and agreement end retain outstanding work', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await setup(h), m = await member(h, b.plan, 1, '2025-11-06'), a = await b.office.run('agreement.sell', m.sale)
  const expected = [row(m, a, 0, '2025-11-06'), row(m, a, 1, '2026-05-06')]
  const job = await reserve(h, b.office, expected[0]), visit = await book(b, b.dispatcher, job)
  Object.assign(expected[0], { jobId: job.id, visitId: visit.id, booked: true }); await same(h, expected)
  await b.dispatcher.run('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Customer requests another date' })
  Object.assign(expected[0], { visitId: null, booked: false }); await same(h, expected)
  await h.setTime('2026-11-06T12:00:00Z'); await same(h, expected)
  assert.equal((await read(h, '/api/glove/agreements')).agreements[0].active, false, 'clock actually crosses the term end')
  await h.command('agreement.end', { agreementId: a.id, version: a.version, reason: 'Owner records term end' }); await same(h, expected)
  await h.restart(); await same(h, expected)
})
  await scenario(t, 'PLAN-004 point 6: a Worker upgrade maps older stored jobs to first unclaimed ordinals while new jobs keep their chosen ordinal', async t => {
  let legacy = true
  const dispatch = await readFile('src/glove/commands/dispatch.ts', 'utf8')
  const ordinal = '...(agreement ? { agreementVisitIndex: agreementIndex } : {})'
  assert.ok(dispatch.includes(ordinal))
  const h = await installation({ at, workerPlugins: [{ name: 'pre-plan-004-jobs', setup(build) {
    build.onLoad({ filter: /\/commands\/dispatch\.ts$/ }, args => legacy ? { contents: dispatch.replace(ordinal, '...{}'), loader: 'ts', resolveDir: dirname(args.path) } : undefined)
  } }] }); t.after(() => h.close())
  const b = await setup(h, { includedVisits: 3 }), m = await member(h, b.plan, 1, '2026-01-31'), a = await b.office.run('agreement.sell', m.sale)
  const first = await reserve(h, b.office, row(m, a, 0, '2026-01-31')), second = await reserve(h, b.office, row(m, a, 1, '2026-05-31'))
  assert.equal(first.agreementVisitIndex, undefined); assert.equal(second.agreementVisitIndex, undefined)
  const stored = (await h.state()).jobs.map(j => j.id)
  assert.deepEqual([...stored].sort(), [first.id, second.id].sort())
  legacy = false; await h.restart({ rebuild: true })
  const expected = ['2026-01-31', '2026-05-31', '2026-09-30'].map((date, index) => row(m, a, index, date))
  expected[0].jobId = stored[0]; expected[1].jobId = stored[1]
  await same(h, expected)
  const third = await reserve(h, b.dispatcher, expected[2]); assert.equal(third.agreementVisitIndex, 2)
  expected[2].jobId = third.id
  await same(h, expected); await h.restart(); await same(h, expected)
})
  await scenario(t, 'PLAN-004 point 7: a cancelled job is rebooked without duplication and due reads enforce desk branch authority without writes', async t => {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await setup(h), m = await member(h, b.plan, 1), a = await b.office.run('agreement.sell', m.sale)
  const expected = [row(m, a, 0, '2026-04-30'), row(m, a, 1, '2026-10-30')]
  const job = await reserve(h, b.office, expected[1], 'synthetic-glove-retained-job'), visit = await book(b, b.dispatcher, job)
  await b.dispatcher.run('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Rebook requested' })
  expected[1].jobId = job.id; await same(h, expected)
  const next = await book(b, b.office, job, '10'), commandId = 'synthetic-glove-rebook-replay'
  Object.assign(expected[1], { visitId: next.id, booked: true }); await same(h, expected)
  const beforeDuplicate = await read(h, '/api/glove/export')
  await b.dispatcher.run('job.create', { customerId: m.customer.id, siteId: m.site.id, agreementId: a.id, agreementVisitIndex: 1, title: 'Duplicate included visit' }, { error: 'ENTITLEMENT', commandId })
  assert.deepEqual(await read(h, '/api/glove/export'), beforeDuplicate)
  assert.deepEqual((await h.state()).jobs.map(j => j.id), [job.id])
  const branch = await h.command('branch.save', { name: 'North', timezone: 'America/Chicago', prefix: 'NOR', zips: ['75001'] })
  const north = await member(h, b.plan, 2, '2026-04-30', '75001', branch.id), northAgreement = await b.office.run('agreement.sell', north.sale)
  const reader = await h.person('North Desk', 'office'), sub = await h.person('Due Subcontractor', 'subcontractor')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branch.id })
  const beforeReads = await read(h, '/api/glove/export')
  const scoped = (await read(h, '/api/glove/due-visits', reader)).visits
  assert.deepEqual(ordered(scoped), ordered([row(north, northAgreement, 0, '2026-04-30'), row(north, northAgreement, 1, '2026-10-30')]))
  for (const who of [b.worker, sub]) assert.equal((await h.request('/api/glove/due-visits', { as: who.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/due-visits', { as: '' })).status, 401)
  await due(h); await read(h, '/api/glove/dashboard')
  assert.deepEqual(await read(h, '/api/glove/export'), beforeReads)
  await h.command('role.set', { operatorId: reader.id, role: 'technician' })
  assert.equal((await h.request('/api/glove/due-visits', { as: reader.cookie })).status, 403)
  assert.equal((await h.request('/auth/signout', { method: 'POST', as: reader.cookie, body: {} })).status, 204)
  assert.equal((await h.request('/api/glove/due-visits', { as: reader.cookie })).status, 401)
  const preview = await h.command('privacy.preview', { customerId: m.customer.id, version: m.customer.version })
  await h.command('privacy.erase', { customerId: m.customer.id, version: m.customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const erased = await read(h, '/api/glove/export')
  await b.office.run('job.create', { customerId: m.customer.id, siteId: m.site.id, agreementId: a.id, agreementVisitIndex: 1, title: 'Included seasonal care' }, { commandId: 'synthetic-glove-retained-job', error: 'ERASED' })
  assert.deepEqual(await read(h, '/api/glove/export'), erased, 'erased command replay resurrects nothing')
  await h.restart()
  const remaining = await due(h)
  assert.ok(!remaining.some(v => v.agreementId === a.id))
  assert.ok(!JSON.stringify(remaining).includes(m.customer.name) && !JSON.stringify(remaining).includes(m.site.address))
})
})
