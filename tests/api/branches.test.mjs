// TEAM-002: independent branch settings, live record limits on every public
// read/write door, and matching branch filters on every current report.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

test('TEAM-002, TEAM-004, TEAM-005 branches retain independent zones, areas and numbers across quoting, service calls, assessments and recurring bookings', async t => {
  const at = '2026-11-05T12:00:00.000Z'
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h)
  const owner = (await h.request('/auth/session').then(r => r.json())).operator
  const recorded = []
  const save = async (person, type, payload, kind, subjectKind, summary) => {
    const commandId = `synthetic-glove-branch-${recorded.length + 1}`
    const result = await (person ? person.run(type, payload, { commandId }) : h.command(type, payload, { commandId }))
    recorded.push({ person, type, payload, commandId, result, kind, subjectKind, summary })
    return result
  }
  const refused = async (person, type, payload, error, opts = {}) => {
    const before = await h.state()
    await (person ? person.run(type, payload, { error, ...opts }) : h.command(type, payload, { error, ...opts }))
    assert.deepEqual(await h.state(), before, `${type}: ${error} preserves all records, versions, counters and Activity`)
  }
  const legacyQuote = await acceptedQuote(h, b)
  const legacyJob = await b.dispatcher.run('job.create', { quoteId: legacyQuote.id })
  const legacyVisit = await b.dispatcher.run('visit.book', { jobId: legacyJob.id, technicianId: b.priya.id, date: '2026-11-02', start: '09:00', end: '10:00' })
  const legacyCall = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Main branch diagnostic', lines: [{ description: 'Diagnostic', quantity: '1', unitPrice: '45.00', tax: 'FREE' }] })
  const legacyCallVisit = await b.dispatcher.run('visit.book', { jobId: legacyCall.id, technicianId: b.tom.id, date: '2026-11-02', start: '11:00', end: '12:00' })
  await b.tomPerson.run('visit.arrive', { visitId: legacyCallVisit.id, deviceTime: legacyCallVisit.startAt })
  await b.tomPerson.run('visit.complete', { visitId: legacyCallVisit.id, deviceTime: legacyCallVisit.endAt, summary: 'Diagnostic completed', signoff: { absentReason: 'Customer out' } })
  const legacyInvoice = await b.office.run('invoice.prepare', { jobId: legacyCall.id })
  await b.office.run('invoice.approve', { invoiceId: legacyInvoice.id, version: legacyInvoice.version, revision: 1 })
  assert.deepEqual([legacyQuote.number, legacyJob.number, legacyCall.number, legacyInvoice.number], ['Q-101', 'J-1001', 'J-1002', 'INV-0001'])
  assert.deepEqual([legacyVisit.local, legacyVisit.startAt, legacyVisit.endAt], [{ date: '2026-11-02', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2026-11-01T22:00:00.000Z', '2026-11-01T23:00:00.000Z'])
  const legacy = await h.state()
  const mainBefore = legacy.business[0].counters
  const initialEast = await save(null, 'branch.save', { name: 'Raleigh', prefix: ' ral7 ', timezone: 'America/New_York', zips: ['27601', '27603', '27601'] }, 'branch.saved', 'branch', 'Branch Raleigh: America/New_York, number prefix RAL7')
  assert.deepEqual(initialEast, { id: initialEast.id, version: 1, createdAt: at, counters: {}, name: 'Raleigh', timezone: 'America/New_York', prefix: 'RAL7', zips: ['27601', '27603'] })
  const east = await save(null, 'branch.save', { ...initialEast, prefix: ' ral ' }, 'branch.saved', 'branch', 'Branch Raleigh: America/New_York, number prefix RAL')
  assert.deepEqual(east, { ...initialEast, version: 2, prefix: 'RAL', updatedAt: at })
  const west = await save(null, 'branch.save', { name: 'Phoenix', prefix: ' phx ', timezone: 'America/Phoenix', zips: ['85001', '85003'] }, 'branch.saved', 'branch', 'Branch Phoenix: America/Phoenix, number prefix PHX')
  assert.deepEqual(west, { id: west.id, version: 1, createdAt: at, counters: {}, name: 'Phoenix', timezone: 'America/Phoenix', prefix: 'PHX', zips: ['85001', '85003'] })
  const branchInputs = [
    [{ ...initialEast, name: 'Stale Raleigh' }, 'STALE'],
    [{ name: 'Duplicate', prefix: ' rAl ', timezone: 'UTC', zips: [] }, 'DUPLICATE'],
    [{ ...east, prefix: ' pHx ' }, 'DUPLICATE'],
    [{ ...east, timezone: 'not-a-zone' }, 'TIMEZONE'],
    [{ ...west, zips: ['8500'] }, 'INPUT'],
    [{ ...west, prefix: 'PH-X' }, 'INPUT'],
  ]
  for (const [payload, error] of branchInputs) await refused(null, 'branch.save', payload, error)
  for (const person of [b.dispatcher, b.office, b.priyaPerson, b.agent]) {
    await refused(person, 'branch.save', { ...east, name: 'Unauthorized settings' }, 'FORBIDDEN')
  }
  await b.dispatcher.run('branch.save', { name: 'Forbidden', prefix: 'NO', timezone: 'UTC', zips: [] }, { error: 'FORBIDDEN' })
  await h.command('branch.save', { name: 'Duplicate', prefix: 'RAL', timezone: 'UTC', zips: [] }, { error: 'DUPLICATE' })
  await h.command('branch.save', { name: 'Invalid', prefix: 'BAD', timezone: 'not/a-zone', zips: [] }, { error: 'TIMEZONE' })
  const setup = async (branch, person, price) => {
    const customer = await save(b.office, 'customer.save', { name: `${branch.name} School` }, 'customer.saved', 'customer', `Customer ${branch.name} School`)
    assert.equal(customer.version, 1)
    assert.equal(customer.branchId, undefined, 'a new unscoped customer has no chosen branch before its first site')
    const addresses = branch.id === east.id ? ['101 Fayetteville St, Raleigh NC 27601', '102 Fayetteville St, Raleigh NC 27603'] : ['1 Central Ave, Phoenix AZ 85001', '2 Central Ave, Phoenix AZ 85003']
    const site = await save(b.office, 'site.save', { customerId: customer.id, address: addresses[0], branchId: branch.id }, 'site.saved', 'site', `Site ${addresses[0]} for ${branch.name} School`)
    const assigned = (await h.state()).customers.find(x => x.id === customer.id)
    assert.deepEqual([assigned.id, assigned.name, assigned.branchId, assigned.version, assigned.createdBy, assigned.createdAt], [customer.id, `${branch.name} School`, branch.id, 2, b.office.id, at])
    const extra = await save(b.office, 'site.save', { customerId: customer.id, address: addresses[1], branchId: branch.id }, 'site.saved', 'site', `Site ${addresses[1]} for ${branch.name} School`)
    assert.deepEqual((await h.state()).customers.find(x => x.id === customer.id), assigned, 'another site in the same branch never reassigns or versions its customer')
    assert.deepEqual((await h.state()).sites.filter(x => x.customerId === customer.id).map(x => [x.id, x.customerId, x.branchId, x.address, x.zip, x.version, x.createdBy, x.createdAt]).sort(), [
      [site.id, customer.id, branch.id, addresses[0], branch.id === east.id ? '27601' : '85001', 1, b.office.id, at],
      [extra.id, customer.id, branch.id, addresses[1], branch.id === east.id ? '27603' : '85003', 1, b.office.id, at],
    ].sort())
    const otherBranch = branch.id === east.id ? west.id : east.id
    await refused(b.office, 'site.save', { ...site, branchId: otherBranch }, 'BRANCH')
    await refused(b.office, 'site.save', { customerId: customer.id, address: '3 Other Street', branchId: otherBranch }, 'BRANCH')
    await refused(b.priyaPerson, 'site.save', { ...extra, accessNotes: 'Unauthorized' }, 'FORBIDDEN')
    const tech = await h.command('technician.save', { name: person.name, operatorId: person.id, branchId: branch.id })
    const request = await b.office.run('enquiry.create', { customerId: customer.id, siteId: site.id, description: 'Inspect rooftop unit', source: 'phone' })
    const q = await save(b.dispatcher, 'quote.draft', { customerId: customer.id, siteId: site.id, title: 'Inspect rooftop unit', lines: [{ description: 'Inspection', quantity: '1', unitPrice: price, tax: 'FREE' }] }, 'quote.drafted', 'quote', `${branch.id === east.id ? 'RAL' : 'PHX'}-Q-101 drafted by Sam Ortiz (dispatcher): $${price} incl. tax`)
    assert.deepEqual([q.number, q.branchId, q.customerId, q.siteId, q.createdAt, q.version], [branch.id === east.id ? 'RAL-Q-101' : 'PHX-Q-101', branch.id, customer.id, site.id, at, 1])
    const numbered = (await h.state()).branches.find(x => x.id === branch.id)
    assert.deepEqual(numbered.counters, { job: 1000, quote: 101, invoice: 0, export: 0, po: 0 })
    await refused(null, 'branch.save', { ...numbered, prefix: 'CHANGED' }, 'BRANCH')
    const approved = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    const accepted = await b.dispatcher.run('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'School administrator' })
    const job = await b.dispatcher.run('job.create', { quoteId: accepted.id })
    return { customer, site, extra, tech, job, request, q }
  }
  const eastPerson = await h.person('Ella Ellis', 'technician'), westPerson = await h.person('Luis Garcia', 'technician')
  const a = await setup(east, eastPerson, '125.00'), z = await setup(west, westPerson, '275.00')
  assert.deepEqual([b.site.branchId, b.customer.branchId], [null, undefined])
  await refused(b.office, 'site.save', { customerId: b.customer.id, address: '4 Raleigh Street', branchId: east.id }, 'BRANCH')
  const beforeRestart = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), beforeRestart, 'an actual Worker restart retains exact branch settings, assigned customers, sites and issued numbers')
  const retained = await h.state()
  assert.deepEqual(retained.branches.find(x => x.id === east.id), { ...east, version: 4, counters: { job: 1001, quote: 101, invoice: 0, export: 0, po: 0 } })
  assert.deepEqual(retained.branches.find(x => x.id === west.id), { ...west, version: 3, counters: { job: 1001, quote: 101, invoice: 0, export: 0, po: 0 } })
  for (const entry of recorded) {
    assert.deepEqual(await (entry.person ? entry.person.run(entry.type, entry.payload, { commandId: entry.commandId }) : h.command(entry.type, entry.payload, { commandId: entry.commandId })), entry.result)
    assert.deepEqual(await h.state(), retained, `${entry.type} replay after restart adds no record, version, counter or event`)
  }
  for (const [payload, error] of branchInputs) {
    const attempt = payload.id && error !== 'STALE' ? { ...payload, version: retained.branches.find(x => x.id === payload.id).version } : payload
    await refused(null, 'branch.save', attempt, error)
  }
  for (const person of [b.dispatcher, b.office, b.priyaPerson, b.agent]) {
    await refused(person, 'branch.save', { ...retained.branches.find(x => x.id === east.id), name: 'Unauthorized after restart' }, 'FORBIDDEN')
  }
  for (const x of [a, z]) {
    const branch = retained.branches.find(row => row.id === x.site.branchId)
    await refused(null, 'branch.save', { ...branch, prefix: 'CHANGED' }, 'BRANCH')
    await refused(b.office, 'site.save', { ...x.site, branchId: x === a ? west.id : east.id }, 'BRANCH')
    await refused(b.office, 'site.save', { ...x.site, customerId: x === a ? z.customer.id : a.customer.id, branchId: x === a ? west.id : east.id }, 'BRANCH')
    await refused(b.office, 'site.save', { customerId: x.customer.id, address: '5 Other Street', branchId: x === a ? west.id : east.id }, 'BRANCH')
  }
  const changedSite = await save(b.office, 'site.save', { id: a.extra.id, version: a.extra.version, customerId: a.customer.id, address: '102 Fayetteville St, Raleigh NC 27603', accessNotes: 'Reception holds the key' }, 'site.saved', 'site', 'Site 102 Fayetteville St, Raleigh NC 27603 for Raleigh School')
  assert.deepEqual([changedSite.id, changedSite.customerId, changedSite.branchId, changedSite.version, changedSite.accessNotes, changedSite.updatedBy, changedSite.updatedAt], [a.extra.id, a.customer.id, east.id, 2, 'Reception holds the key', b.office.id, at])
  await refused(b.office, 'site.save', { ...a.extra, accessNotes: 'Stale notes' }, 'STALE')
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await refused(b.office, 'site.save', { ...changedSite, accessNotes: 'Revoked notes' }, 'FORBIDDEN')
  const firstSite = recorded.find(x => x.result.id === a.site.id)
  await refused(b.office, firstSite.type, firstSite.payload, 'FORBIDDEN', { commandId: firstSite.commandId })
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })
  const edited = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), edited, 'site edits and later role changes retain the same customer and branch assignments after restart')
  const oldExtra = recorded.find(x => x.result.id === a.extra.id)
  assert.deepEqual(await b.office.run(oldExtra.type, oldExtra.payload, { commandId: oldExtra.commandId }), oldExtra.result)
  assert.deepEqual(await h.state(), edited, 'replaying an older site creation cannot undo a later site edit')
  const branchActivity = await h.request('/api/glove/activity').then(r => r.json())
  const branchExport = await h.request('/api/glove/export').then(r => r.json())
  for (const key of ['branches', 'customers', 'sites']) assert.deepEqual(branchExport[key], (await h.state())[key])
  for (const entry of recorded) {
    const person = entry.person ? { id: entry.person.id, name: entry.person.name, role: entry.person === b.office ? 'office' : 'dispatcher' } : { id: owner.id, name: 'Olivia Owner', role: 'owner' }
    const visible = branchActivity.events.filter(e => e.commandId === entry.commandId)
    const exported = branchExport.timeline.filter(e => e.command_id === entry.commandId)
    assert.equal(visible.length, 1)
    assert.equal(exported.length, 1)
    assert.deepEqual([visible[0].kind, visible[0].subjectKind, visible[0].subjectId, visible[0].actorId, visible[0].actorName, visible[0].actorRole, visible[0].at, visible[0].summary], [entry.kind, entry.subjectKind, entry.result.id, person.id, person.name, person.role, at, entry.summary])
    assert.deepEqual([exported[0].id, exported[0].kind, exported[0].subject_kind, exported[0].subject_id, exported[0].actor_id, exported[0].actor_name, exported[0].actor_role, exported[0].at, exported[0].summary], [visible[0].id, entry.kind, entry.subjectKind, entry.result.id, person.id, person.name, person.role, at, entry.summary])
  }
  await b.office.run('site.save', { customerId: a.customer.id, address: '2 Central Ave, Phoenix AZ 85001', branchId: west.id }, { error: 'BRANCH' })
  const helper = await h.command('technician.save', { name: 'Raleigh helper', branchId: east.id })
  const crew = await h.command('crew.save', { name: 'Raleigh crew', memberIds: [a.tech.id, helper.id] })
  assert.deepEqual(crew.memberIds, [a.tech.id, helper.id])
  assert.deepEqual((await h.state()).technicians.filter(x => [a.tech.id, helper.id, z.tech.id].includes(x.id)).map(x => [x.id, x.branchId]).sort(), [[a.tech.id, east.id], [helper.id, east.id], [z.tech.id, west.id]].sort())
  await refused(null, 'crew.save', { name: 'Cross-branch crew', memberIds: [a.tech.id, z.tech.id] }, 'BRANCH')
  await refused(null, 'crew.save', { ...crew, memberIds: [a.tech.id, z.tech.id] }, 'BRANCH')
  await refused(null, 'technician.save', { ...helper, branchId: west.id }, 'BRANCH')
  assert.notEqual(a.q.number, z.q.number)
  assert.equal(a.q.number, 'RAL-Q-101'); assert.equal(z.q.number, 'PHX-Q-101')
  assert.equal(a.job.number, 'RAL-J-1001'); assert.equal(z.job.number, 'PHX-J-1001')
  for (const [x, person, expected] of [[a, eastPerson, '2026-11-02T14:00:00.000Z'], [z, westPerson, '2026-11-02T16:00:00.000Z']]) {
    const visit = await b.dispatcher.run('visit.book', { jobId: x.job.id, technicianId: x.tech.id, date: '2026-11-02', start: '09:00', end: '10:00' })
    assert.equal(visit.startAt, expected)
    assert.equal(visit.local.timezone, x === a ? east.timezone : west.timezone)
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: expected })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: expected, summary: 'Unit inspected', signoff: { absentReason: 'Office closed' } })
    const inv = await b.office.run('invoice.prepare', { jobId: x.job.id })
    assert.equal(inv.branchId, x === a ? east.id : west.id)
    assert.equal(inv.number, `${x === a ? 'RAL' : 'PHX'}-INV-0001`)
    await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  }
  const revenue = await h.request('/api/glove/reports/revenue.json?from=2026-01-01&to=2027-12-31').then(r => r.json())
  assert.deepEqual(revenue.byBranch.map(x => [x.branch, x.invoices, x.revenue]), [['Main business', 1, '45.00'], ['Phoenix', 1, '275.00'], ['Raleigh', 1, '125.00']])
  const narrowed = await h.request(`/api/glove/reports/revenue.json?from=2026-01-01&to=2027-12-31&branchId=${east.id}`).then(r => r.json())
  assert.deepEqual(narrowed.total, { invoices: 1, revenue: '125.00' })
  const csv = await h.request(`/api/glove/reports/revenue.csv?from=2026-01-01&to=2027-12-31&branchId=${west.id}`).then(r => r.text())
  assert.match(csv, /branch,Phoenix,1,275.00/); assert.ok(!csv.includes('Raleigh')); assert.match(csv, /total,,1,275.00/ )
  const call = await b.office.run('job.create', { customerId: a.customer.id, siteId: a.site.id, title: 'Emergency call', lines: [{ description: 'Diagnostic', quantity: '1', unitPrice: '50.00', tax: 'FREE' }] })
  assert.equal(call.number, 'RAL-J-1002')
  await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: z.tech.id, date: '2026-11-03', start: '09:00', end: '10:00' }, { error: 'BRANCH' })
  const assessment = await b.dispatcher.run('assessment.book', { enquiryId: z.request.id, technicianId: z.tech.id, date: '2026-11-03', start: '09:00', end: '10:00' })
  assert.equal(assessment.job.number, 'PHX-J-1002'); assert.equal(assessment.visit.startAt, '2026-11-03T16:00:00.000Z')
  // Branch area mismatches obey the existing owner-set refusal/warning rule.
  const outside = await b.office.run('site.save', { customerId: a.customer.id, address: '1 Other St, Durham NC 27701', branchId: east.id })
  const outJob = await b.office.run('job.create', { customerId: a.customer.id, siteId: outside.id, title: 'Outside area' })
  const warning = await b.dispatcher.run('visit.book', { jobId: outJob.id, technicianId: a.tech.id, date: '2026-11-04', start: '09:00', end: '10:00' }, { error: 'CONFLICT_REVIEW' })
  assert.ok(warning.details.conflicts.some(x => x.code === 'branch-area:27701'))
  await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: a.tech.id, date: '2027-03-14', start: '02:15', end: '03:15' }, { error: 'TIME' })
  const series = await b.dispatcher.run('series.create', { jobId: call.id, version: call.version, technicianId: a.tech.id, date: '2026-11-05', start: '09:00', end: '10:00', until: '2026-11-12', rule: { unit: 'week', interval: 1 } })
  const recurring = (await h.state()).visits.filter(v => v.jobId === series.id)
  assert.equal(recurring.length, 2); assert.ok(recurring.every(v => v.startAt.endsWith('T14:00:00.000Z')))
  await h.command('branch.save', { ...east, version: 1, name: 'Stale Raleigh' }, { error: 'STALE' })
  const currentEast = (await h.state()).branches.find(x => x.id === east.id)
  await h.command('branch.save', { ...currentEast, prefix: 'NEW' }, { error: 'BRANCH' })
  const oldVisits = (await h.state()).visits
  const movedZone = await h.command('branch.save', { ...currentEast, timezone: 'America/Chicago', zips: ['27601', '27603', '27605'] })
  assert.equal(movedZone.timezone, 'America/Chicago')
  assert.equal((await h.state()).visits.find(v => v.jobId === a.job.id).startAt, '2026-11-02T14:00:00.000Z')
  assert.equal((await h.state()).visits.find(v => v.jobId === a.job.id).local.timezone, 'America/New_York')
  assert.deepEqual((await h.state()).visits, oldVisits, 'editing the branch zone never rewrites any existing visit or assignment')
  const laterVisit = await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: a.tech.id, date: '2026-11-13', start: '09:00', end: '10:00' })
  assert.deepEqual([laterVisit.local, laterVisit.startAt, laterVisit.endAt], [{ date: '2026-11-13', start: '09:00', end: '10:00', timezone: 'America/Chicago' }, '2026-11-13T15:00:00.000Z', '2026-11-13T16:00:00.000Z'])
  const movedVisit = await b.dispatcher.run('visit.change', { visitId: recurring[1].id, version: recurring[1].version, date: '2026-11-14', reason: 'Customer requested Saturday' })
  assert.deepEqual([movedVisit.local, movedVisit.startAt, movedVisit.endAt], [{ date: '2026-11-14', start: '09:00', end: '10:00', timezone: 'America/Chicago' }, '2026-11-14T15:00:00.000Z', '2026-11-14T16:00:00.000Z'])
  assert.deepEqual(movedVisit.assignments[0], recurring[1].assignments[0], 'a move preserves its original booking zone and instants')
  assert.deepEqual([movedVisit.assignments.at(-1).local, movedVisit.assignments.at(-1).startAt, movedVisit.assignments.at(-1).endAt], [movedVisit.local, '2026-11-14T15:00:00.000Z', '2026-11-14T16:00:00.000Z'])
  for (const key of ['sites', 'technicians', 'quotes', 'jobs', 'invoices']) for (const row of legacy[key]) {
    assert.deepEqual((await h.state())[key].find(x => x.id === row.id), row, `legacy ${key} keep their main branch, original numbers and identity`)
  }
  assert.deepEqual((await h.state()).visits.find(x => x.id === legacyVisit.id), legacyVisit)
  const laterLegacy = await b.dispatcher.run('visit.book', { jobId: legacyJob.id, technicianId: b.priya.id, date: '2026-11-03', start: '09:00', end: '10:00' })
  assert.deepEqual([laterLegacy.local, laterLegacy.startAt, laterLegacy.endAt], [{ date: '2026-11-03', start: '09:00', end: '10:00', timezone: 'Australia/Sydney' }, '2026-11-02T22:00:00.000Z', '2026-11-02T23:00:00.000Z'], 'new legacy bookings still use the business zone after other branch zones change')
  assert.deepEqual((await h.state()).business[0].counters, mainBefore)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.equal(exported.branches.length, 2)
  assert.ok(exported.timeline.some(e => e.kind === 'branch.saved'))
  // Every report uses the same branch-rooted records in JSON and CSV.
  const period = 'from=2026-01-01&to=2027-12-31'
  const report = (kind, id, as) => h.request(`/api/glove/reports/${kind}.json?${period}&branchId=${id}`, as ? { as } : {}).then(r => r.json())
  assert.equal((await report('technicians', east.id)).technicians.length, 2)
  assert.deepEqual((await report('technicians', east.id)).technicians.map(x => x.technicianId).sort(), [a.tech.id, helper.id].sort())
  assert.equal((await report('sources', east.id)).total.requests, 1)
  assert.equal((await report('sources', west.id)).total.requests, 1)
  assert.equal((await report('quotes', east.id)).wonValue, '125.00')
  assert.equal((await report('quotes', west.id)).wonValue, '275.00')
  assert.equal((await report('margins', east.id)).total.revenue, '125.00')
  assert.equal((await report('margins', west.id)).total.revenue, '275.00')
  assert.equal((await report('tax', east.id)).jurisdictions[0].invoices, 1)
  assert.equal((await report('tax', west.id)).jurisdictions[0].invoices, 1)
  // The owner limits a person without changing their existing role.
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: east.id })
  await b.dispatcher.run('branch.limit', { operatorId: b.office.id, branchId: west.id }, { error: 'FORBIDDEN' })
  const limited = await b.dispatcher.state()
  for (const key of ['customers', 'sites', 'enquiries', 'quotes', 'jobs', 'visits', 'invoices', 'technicians']) {
    assert.ok(limited[key].length > 0, `TEAM-002 own ${key} remain readable`)
    assert.ok(!JSON.stringify(limited[key]).includes(z.customer.id), `TEAM-002 no other-branch ${key}`)
  }
  assert.deepEqual(limited.branches.map(x => x.id), [east.id])
  assert.deepEqual(limited.customers.map(x => x.id), [a.customer.id])
  assert.deepEqual(limited.jobs.map(x => x.id).sort(), [a.job.id, call.id, outJob.id].sort())
  assert.deepEqual(limited.quotes.map(x => x.id), [a.q.id])
  const limitedRevenue = await report('revenue', east.id, b.dispatcher.cookie)
  assert.deepEqual(limitedRevenue.byBranch.map(x => [x.branch, x.invoices, x.revenue]), [['Raleigh', 1, '125.00']])
  assert.deepEqual(limitedRevenue.total, { invoices: 1, revenue: '125.00' })
  assert.equal((await h.request(`/api/glove/reports/revenue.json?${period}&branchId=${west.id}`, { as: b.dispatcher.cookie })).status, 404)
  assert.ok(limited.services.some(x => x.id === b.service.id), 'shared price book remains readable')
  assert.ok(limited.jobs.every(x => x.branchId === east.id))
  assert.ok(!limited.events.some(e => e.jobId === z.job.id || e.subjectId === z.request.id))
  await b.dispatcher.run('quote.approve', { quoteId: z.q.id, version: z.q.version, revision: 1 }, { error: 'NOT_FOUND' })
  await b.dispatcher.run('visit.cancel', { visitId: (await h.state()).visits.find(v => v.jobId === z.job.id).id, version: 3, reason: 'Outside my branch' }, { error: 'NOT_FOUND' })
  const created = await b.dispatcher.run('customer.save', { name: 'Raleigh branch only' })
  assert.equal(created.branchId, east.id)
  await b.dispatcher.run('site.save', { customerId: created.id, address: '55 Main St Raleigh NC 27601', branchId: west.id }, { error: 'NOT_FOUND' })
  await b.dispatcher.run('site.save', { customerId: created.id, address: '55 Main St Raleigh NC 27601', branchId: east.id })
  const ownQuote = await b.dispatcher.run('quote.draft', { customerId: a.customer.id, siteId: a.site.id, title: 'Branch repair', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '42.00', tax: 'FREE' }] })
  assert.equal(ownQuote.branchId, east.id)
  const unit = await h.command('equipment.save', { siteId: z.site.id, type: 'Condenser', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=' } })
  assert.equal((await h.request(`/api/glove/equipment/${unit.id}`, { as: b.dispatcher.cookie })).status, 404)
  assert.equal((await h.request(`/api/glove/files/${unit.photos[0].fileId}`, { as: b.dispatcher.cookie })).status, 404)
  assert.equal((await h.request(`/api/glove/files/${unit.photos[0].fileId}`)).status, 200)
  const hidden = [
    `/jobs/${z.job.id}/timeline`, `/jobs/${z.job.id}/cost`, `/jobs/${z.job.id}/callback`, `/jobs/${z.job.id}/companycam`,
    `/sites/${z.site.id}/history`, `/customers/${z.customer.id}/duplicates`,
  ]
  for (const door of hidden) {
    const response = await h.request('/api/glove' + door, { as: b.dispatcher.cookie })
    assert.equal(response.status, 404, `TEAM-002 ${door} refuses hidden records`)
  }
  const activity = await h.request('/api/glove/activity', { as: b.dispatcher.cookie }).then(r => r.json())
  assert.ok(!activity.events.some(e => e.jobId === z.job.id || e.subjectId === z.request.id))
  const dash = await h.request('/api/glove/dashboard', { as: b.dispatcher.cookie }).then(r => r.json())
  assert.ok(!JSON.stringify(dash).includes(z.job.id))
  for (const kind of ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax']) {
    const all = await h.request(`/api/glove/reports/${kind}.json?${period}`, { as: b.dispatcher.cookie }).then(r => r.json())
    assert.ok(!JSON.stringify(all).includes(z.tech.name), `TEAM-002 scoped ${kind}`)
    assert.equal((await h.request(`/api/glove/reports/${kind}.csv?${period}&branchId=${west.id}`, { as: b.dispatcher.cookie })).status, 404)
  }
  // Scope follows the live operator on the same session, including export and replay.
  await h.command('branch.limit', { operatorId: b.office.id, branchId: east.id })
  const scopedRule = await b.office.run('rule.save', { name: 'Raleigh dispatch notice', trigger: 'enquiry.created', action: { kind: 'notify', to: 'office', message: 'Review branch request' } })
  const beforeRuns = (await h.state()).ruleRuns.length
  await h.command('enquiry.create', { customerId: z.customer.id, siteId: z.site.id, description: 'Phoenix-only follow-up', source: 'phone' })
  assert.equal((await h.state()).ruleRuns.length, beforeRuns, 'a branch-limited rule never acts on another branch')
  await h.command('enquiry.create', { customerId: a.customer.id, siteId: a.site.id, description: 'Raleigh-only follow-up', source: 'phone' })
  assert.equal((await h.state()).ruleRuns.filter(r => r.ruleId === scopedRule.id).length, 1, 'the same rule acts on its own branch')
  const eastOffice = await h.request('/api/glove/export', { as: b.office.cookie }).then(r => r.json())
  assert.ok(eastOffice.jobs.length && eastOffice.jobs.every(j => j.branchId === east.id))
  assert.ok(!eastOffice.files.some(f => f.captureId === unit.id))
  assert.ok(eastOffice.timeline.every(e => e.job_id !== z.job.id && e.subject_id !== z.request.id))
  const customerCsv = await h.request('/api/glove/customers.csv', { as: b.office.cookie }).then(r => r.text())
  assert.ok(customerCsv.includes(a.customer.name)); assert.ok(!customerCsv.includes(z.customer.name))
  await b.office.run('customer.merge', { survivorId: a.customer.id, mergedIds: [z.customer.id], versions: { [a.customer.id]: (await h.state()).customers.find(c => c.id === a.customer.id).version } }, { error: 'NOT_FOUND' })
  const otherQuote = await b.dispatcher.run('quote.approve', { quoteId: ownQuote.id, version: ownQuote.version, revision: 1 })
  const commandId = 'branch-scope-replay-001'
  await b.dispatcher.run('quote.markSent', { quoteId: otherQuote.id, revision: 1, channel: 'phone', version: otherQuote.version }, { commandId })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: west.id })
  assert.ok((await b.dispatcher.state()).jobs.every(j => j.branchId === west.id))
  await b.dispatcher.run('quote.markSent', { quoteId: otherQuote.id, revision: 1, channel: 'phone', version: otherQuote.version }, { commandId, error: 'NOT_FOUND' })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null })
  assert.ok((await b.dispatcher.state()).jobs.some(j => j.id === a.job.id))
  assert.ok((await b.dispatcher.state()).jobs.some(j => j.id === z.job.id))
  const trail = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(trail.timeline.some(e => e.kind === 'branch.limited' && e.actor_id && e.command_id && e.at), 'DATA-002 branch-limit changes retain who, when and what')
  await h.command('branch.limit', { operatorId: b.office.id, branchId: null })
  for (const visit of [recurring[0], movedVisit]) {
    await eastPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await eastPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Recurring diagnostic completed', signoff: { absentReason: 'Customer out' } })
  }
  await eastPerson.run('visit.arrive', { visitId: laterVisit.id, deviceTime: laterVisit.startAt })
  await eastPerson.run('visit.complete', { visitId: laterVisit.id, deviceTime: laterVisit.endAt, summary: 'Diagnostic completed', signoff: { absentReason: 'Customer out' } })
  const callInvoice = await b.office.run('invoice.prepare', { jobId: call.id })
  await b.office.run('invoice.approve', { invoiceId: callInvoice.id, version: callInvoice.version, revision: 1 })
  assert.deepEqual([call.branchId, call.customerId, call.siteId, call.number, callInvoice.branchId, callInvoice.number], [east.id, a.customer.id, a.site.id, 'RAL-J-1002', east.id, 'RAL-INV-0002'])
  await westPerson.run('visit.arrive', { visitId: assessment.visit.id, deviceTime: assessment.visit.startAt })
  await westPerson.run('visit.complete', { visitId: assessment.visit.id, deviceTime: assessment.visit.endAt, summary: 'Assessment completed', signoff: { absentReason: 'Customer out' } })
  const assessedQuote = await b.dispatcher.run('quote.draft', { enquiryId: z.request.id, customerId: z.customer.id, siteId: z.site.id, title: 'Assessed repair', lines: [{ description: 'Repair', quantity: '1', unitPrice: '95.00', tax: 'FREE' }] })
  const assessedApproval = await b.dispatcher.run('quote.approve', { quoteId: assessedQuote.id, version: assessedQuote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: assessedQuote.id, version: assessedApproval.version, revision: 1, method: 'phone', customerName: 'School administrator' })
  const assessedJob = await b.dispatcher.run('job.create', { quoteId: assessedQuote.id })
  const repair = await b.dispatcher.run('visit.book', { jobId: assessedJob.id, technicianId: z.tech.id, date: '2026-11-04', start: '09:00', end: '10:00' })
  await westPerson.run('visit.arrive', { visitId: repair.id, deviceTime: repair.startAt })
  await westPerson.run('visit.complete', { visitId: repair.id, deviceTime: repair.endAt, summary: 'Repair completed', signoff: { absentReason: 'Customer out' } })
  const assessedInvoice = await b.office.run('invoice.prepare', { jobId: assessedJob.id })
  await b.office.run('invoice.approve', { invoiceId: assessedInvoice.id, version: assessedInvoice.version, revision: 1 })
  assert.deepEqual([assessment.job.branchId, assessment.job.number, assessedQuote.branchId, assessedQuote.number, assessedQuote.assessment.jobId, assessedJob.branchId, assessedJob.number, assessedJob.customerId, assessedJob.siteId, assessedInvoice.branchId, assessedInvoice.number], [west.id, 'PHX-J-1002', west.id, 'PHX-Q-102', assessment.job.id, west.id, 'PHX-J-1003', z.customer.id, z.site.id, west.id, 'PHX-INV-0002'])
  const branchCustomer = (await h.state()).customers.find(x => x.id === a.customer.id)
  const customerEdit = await b.office.run('customer.save', { ...branchCustomer, branchId: west.id, contact: 'New facilities manager' })
  assert.deepEqual([customerEdit.id, customerEdit.branchId, customerEdit.version, customerEdit.contact], [a.customer.id, east.id, branchCustomer.version + 1, 'New facilities manager'])
  await refused(b.office, 'customer.save', { ...branchCustomer, branchId: west.id, name: 'Stale customer' }, 'STALE')
  await refused(b.office, 'site.save', { customerId: a.customer.id, branchId: west.id, address: '6 Other Street' }, 'BRANCH')
  const finalState = await h.state()
  assert.deepEqual(finalState.branches.find(x => x.id === east.id).counters, { job: 1003, quote: 102, invoice: 2, export: 0, po: 0 })
  assert.deepEqual(finalState.branches.find(x => x.id === west.id).counters, { job: 1003, quote: 102, invoice: 2, export: 0, po: 0 })
  assert.deepEqual(finalState.business[0].counters, mainBefore)
  await h.restart()
  assert.deepEqual(await h.state(), finalState, 'all branch operations, independent counters, crews, legacy identities and booking histories survive restart')
  const finalExport = await h.request('/api/glove/export').then(r => r.json())
  for (const key of ['branches', 'customers', 'sites', 'crews', 'jobs', 'visits']) assert.deepEqual(finalExport[key], finalState[key])
  assert.deepEqual(finalExport.quotes, finalState.quotes.map(({ followupState, ...record }) => record), 'export retains quotes without the computed follow-up display')
  assert.deepEqual(finalExport.invoices, finalState.invoices.map(({ reminderState, ...record }) => record), 'export retains invoices without the computed reminder display')
  assert.ok(finalState.technicians.every(x => x.calendarOutcome === null), 'no calendar connection was configured')
  assert.deepEqual(finalExport.technicians, finalState.technicians.map(({ calendarOutcome, ...record }) => record), 'export keeps technician records without the transient calendar display')
  assert.deepEqual((await report('revenue', east.id)).total, { invoices: 2, revenue: '175.00' })
  assert.deepEqual((await report('revenue', west.id)).total, { invoices: 2, revenue: '370.00' })
  assert.deepEqual(await h.state(), finalState, 'state, export and report reads change no records or counters')
  await h.command('branch.limit', { operatorId: b.office.id, branchId: 'main' })
  assert.ok((await b.office.state()).jobs.every(j => !j.branchId))
})
