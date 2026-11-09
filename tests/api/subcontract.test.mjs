import { scenario } from '../fixtures/scenario.mjs'
// DISP-007 crews and subcontractors through the command, state, file,
// timeline and report doors: a crew is booked, moved and canceled as one; a
// subcontractor sees and records only their own visits; and the owner's
// agreed amounts on completed visits make the 1099-NEC totals.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { parseCsv } from '../../src/glove/csv-format.ts'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

test('DISP-007, DISP-013, DISP-014 the owner\'s agreed amounts on completed visits make the subcontractor\'s 1099-NEC total for the year', async (t) => {
  const h = await installation({ at: '2026-12-30T12:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const sub = await h.person('Sid Sub', 'subcontractor')
  await h.command('technician.save', { name: 'Sid S.', operatorId: sub.id, subcontractor: { payeeName: 'Sid Sub HVAC LLC', tinLast4: '123456789' } }, { error: 'INPUT' })
  const sid = await h.command('technician.save', { name: 'Sid S.', operatorId: sub.id, subcontractor: { payeeName: 'Sid Sub HVAC LLC', tinLast4: '4321' } })
  const quote = await acceptedQuote(h, b, 'Three-day system install')
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  await b.dispatcher.run('crew.save', { name: 'Install crew', memberIds: [b.priya.id, b.tom.id] }, { error: 'FORBIDDEN' })
  await h.command('crew.save', { name: 'Solo', memberIds: [b.priya.id] }, { error: 'INPUT' })
  const crew = await h.command('crew.save', { name: 'Install crew', memberIds: [b.priya.id, b.tom.id] })
  const days = ['2026-11-02', '2026-11-03', '2026-11-04']
  const crewDays = []
  for (const date of days) crewDays.push(await b.dispatcher.run('visit.book', { jobId: job.id, crewId: crew.id, date, start: '08:00', end: '16:00' }))
  const book = (technicianId, date) => b.dispatcher.run('visit.book', { jobId: job.id, technicianId, date, start: '08:00', end: '16:00' })
  const sidDays = [await book(sid.id, days[0]), await book(sid.id, days[1]), await book(sid.id, days[2])]
  const memberVisit = (i, tech) => crewDays[i].visits.find(v => v.technicianId === tech.id)
  const priyaDay1 = memberVisit(0, b.priya), tomDay1 = memberVisit(0, b.tom)
  const other = await acceptedQuote(h, b, 'Someone else\'s job')
  const otherJob = await b.dispatcher.run('job.create', { quoteId: other.id })
  await b.dispatcher.run('visit.book', { jobId: otherJob.id, technicianId: b.priya.id, date: '2026-11-05', start: '08:00', end: '09:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: priyaDay1.id, deviceTime: '2026-11-01T21:05:00Z' })
  const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
  const photo = await b.priyaPerson.run('visit.capture', { visitId: priyaDay1.id, deviceTime: '2026-11-01T21:10:00Z', kind: 'photo', caption: 'Old air handler', photo: { mediaType: 'image/jpeg', base64: jpeg } })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 the crew is booked as one: one visit per member each day, and each member sees only their own', async () => {
    assert.deepEqual(crewDays.map(g => g.visits.map(v => [v.technicianId, v.local.date, v.crew.name]).sort()), days.map(d => [[b.priya.id, d, 'Install crew'], [b.tom.id, d, 'Install crew']].sort()))
    const mine = async person => (await person.state()).visits.filter(v => v.jobId === job.id).map(v => v.id).sort()
    assert.deepEqual(await mine(b.priyaPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.priya.id).id).sort())
    assert.deepEqual(await mine(b.tomPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.tom.id).id).sort())
  })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 the subcontractor sees only their own visits on the job, without money or other people\'s work', async () => {
    const s = await sub.state()
    assert.deepEqual(s.visits.map(v => v.id).sort(), sidDays.map(v => v.id).sort())
    assert.deepEqual(s.jobs.map(j => [j.id, j.title, j.lines.length]), [[job.id, 'Three-day system install', 0]])
    assert.deepEqual(s.customers, [{ id: b.customer.id, version: s.customers[0].version, name: 'Harbourview Dental', phone: '02 9555 0101' }])
    assert.deepEqual(s.sites.map(x => [x.address, x.accessNotes]), [['14 Harbour St, Balmain NSW 2041', 'Gate code at reception']])
    assert.deepEqual([s.quotes, s.invoices, s.services, s.captures, s.events, s.equipment, s.times], [[], [], [], [], [], [], []])
    assert.deepEqual(Object.keys(s.business[0]).sort(), ['id', 'name', 'timezone', 'version'])
    assert.doesNotMatch(JSON.stringify(s), /189\.00|unitPrice|totals|costRate|Priya|Tom B/)
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
    assert.deepEqual((await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: sub.cookie })).json()).events, [])
    for (const path of [`/api/glove/jobs/${job.id}/callback`, '/api/glove/parts?date=2026-11-02', '/api/glove/reports/1099.json?year=2026', '/api/glove/dashboard']) assert.equal((await h.request(path, { as: sub.cookie })).status, 403, path)
  })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 the subcontractor records arrival, checklist, notes and completion on their visits only, and cannot clock in', async () => {
    await sub.run('visit.arrive', { visitId: priyaDay1.id, deviceTime: '2026-11-01T21:05:00Z' }, { error: 'FORBIDDEN' })
    await sub.run('clock.in', { deviceTime: '2026-11-01T21:00:00Z' }, { error: 'FORBIDDEN' })
    await sub.run('visit.capture', { visitId: sidDays[0].id, deviceTime: '2026-11-01T21:10:00Z', kind: 'refrigerant', refrigerant: { type: 'R-410A', added: '1' } }, { error: 'FORBIDDEN' })
    for (const [i, day] of sidDays.slice(0, 2).entries()) {
      const at = `2026-11-0${2 + i}T`
      await sub.run('visit.arrive', { visitId: day.id, deviceTime: `${at}21:00:00Z` })
      for (const item of job.checklist.filter(x => x.required)) await sub.run('visit.capture', { visitId: day.id, deviceTime: `${at}21:30:00Z`, kind: 'checklist', itemId: item.id, result: 'done' })
      await sub.run('visit.capture', { visitId: day.id, deviceTime: `${at}22:00:00Z`, kind: 'note', text: `Day ${i + 1} ductwork done` })
      await sub.run('visit.complete', { visitId: day.id, deviceTime: `${at}23:00:00Z`, summary: `Day ${i + 1} of the install`, signoff: { absentReason: 'Site manager signs at the end' }, jobComplete: false })
    }
    const s = await sub.state()
    assert.deepEqual(s.captures.map(x => x.kind).filter(k => k !== 'checklist').sort(), ['arrival', 'arrival', 'completion', 'completion', 'note', 'note'])
    assert.ok(s.captures.every(x => x.technicianId === sid.id))
  })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 a note recorded before arrival prevents cancelling any member of the crew booking', async () => {
    const captured = memberVisit(1, b.priya), otherMember = memberVisit(1, b.tom)
    await b.priyaPerson.run('visit.capture', { visitId: captured.id, deviceTime: captured.startAt, kind: 'note', text: 'Equipment delivered before arrival' })
    const before = await h.state()
    const booking = before.visits.filter(v => v.crew?.groupId === crewDays[1].id)
    assert.deepEqual(booking.map(v => v.status), ['booked', 'booked'])
    for (const member of [otherMember, captured]) {
      const current = booking.find(v => v.id === member.id)
      await b.dispatcher.run('visit.cancel', { visitId: member.id, version: current.version, reason: 'Cancel the installation day' }, { error: 'VISIT_STATE' })
      const after = await h.state()
      assert.deepEqual(after.visits.filter(v => v.crew?.groupId === crewDays[1].id), booking, 'neither member is cancelled or changed')
      assert.deepEqual(after.captures, before.captures, 'the recorded evidence is kept')
      assert.deepEqual(after.events, before.events, 'a refused crew cancellation records no cancellation')
    }
  })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 moving or canceling a crew visit moves or cancels every member\'s visit, after one conflict review', async () => {
    const tomOwn = await book(b.tom.id, '2026-11-06')
    const day3 = memberVisit(2, b.priya)
    const at = async id => (await h.state()).visits.find(v => v.id === id)
    await b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, technicianId: b.tom.id, reason: 'Swap' }, { error: 'CREW' })
    const review = await b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, date: '2026-11-06', reason: 'Materials late' }, { error: 'CONFLICT_REVIEW' })
    assert.deepEqual(review.details.conflicts.map(x => x.code), [`overlap:${tomOwn.id}`])
    await b.dispatcher.run('visit.change', { visitId: day3.id, version: (await at(day3.id)).version, date: '2026-11-06', reason: 'Materials late', acknowledge: [`overlap:${tomOwn.id}`] })
    const moved = (await h.state()).visits.filter(v => v.crew?.groupId === crewDays[2].id)
    assert.deepEqual(moved.map(v => [v.technicianId, v.local.date, v.local.start]).sort(), [[b.priya.id, '2026-11-06', '08:00'], [b.tom.id, '2026-11-06', '08:00']].sort())
    await b.dispatcher.run('visit.cancel', { visitId: day3.id, version: (await at(day3.id)).version, reason: 'Install finishes in two days' })
    assert.deepEqual((await h.state()).visits.filter(v => v.crew?.groupId === crewDays[2].id).map(v => v.status), ['cancelled', 'cancelled'])
  })

  await scenario(t, 'DISP-007, DISP-013, DISP-014 the owner\'s agreed amounts on completed visits make the subcontractor\'s 1099-NEC total for the year', async () => {
    const amounts = ['450.00', '300.00', '275.00']
    for (const [i, v] of sidDays.entries()) {
      const current = (await h.state()).visits.find(x => x.id === v.id)
      await b.office.run('visit.agree', { visitId: v.id, version: current.version, amount: amounts[i] }, { error: 'FORBIDDEN' })
      await h.command('visit.agree', { visitId: v.id, version: current.version, amount: amounts[i] })
    }
    const tomVisit = (await h.state()).visits.find(x => x.id === tomDay1.id)
    await h.command('visit.agree', { visitId: tomVisit.id, version: tomVisit.version, amount: '100.00' }, { error: 'NOT_SUBCONTRACTOR' })
    const year = '2026'
    const totals = await (await h.request(`/api/glove/reports/1099.json?year=${year}`, { as: b.office.cookie })).json()
    assert.equal(totals.label, 'Totals for your filing, not a filed 1099')
    assert.deepEqual(totals.rows.map(r => [r.payeeName, r.tinLast4, r.visits, r.total, r.atOrOver600]), [['Sid Sub HVAC LLC', '4321', 2, '750.00', true]], 'the third day is not completed, so its $275.00 is not counted')
    const csv = await (await h.request(`/api/glove/reports/1099.csv?year=${year}`)).text()
    assert.equal(csv.trim().split(/\r?\n/)[1], `Sid Sub HVAC LLC,4321,2,750.00,yes,"Totals for your filing, not a filed 1099"`)
    assert.equal((await h.request(`/api/glove/reports/1099.json?year=${year}`, { as: b.dispatcher.cookie })).status, 403)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /123456789/)
    await assertSubcontract1099(t)
  })
})

const label = 'Totals for your filing, not a filed 1099'
const columns = ['payee', 'tin last 4', 'completed visits', 'total', 'at or over $600', 'note']

async function assertSubcontract1099(t) {
  const points = []
  const point = (name, check) => points.push({ name, check })
  let h, b, sid, lee, a, c, tom, editable, replaySave, replayAgree, replayComplete
  const trail = [], completionTrail = []
  const visit = async id => (await h.state()).visits.find(v => v.id === id)
  const run = async (type, payload, kind) => {
    const commandId = randomUUID(), result = await h.command(type, payload, { commandId })
    trail.push({ commandId, kind, subjectId: result.id })
    return { type, payload, commandId, result }
  }
  const book = async (tech, day, start = '09:00', end = '10:00') => {
    // Independent jobs keep completion from closing later work in the fixture.
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Year end subcontract work', lines: [{ description: 'Native work', quantity: '1', unitPrice: '100.00' }] })
    return b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: day, start, end })
  }
  const agree = async (v, amount) => run('visit.agree', { visitId: v.id, version: (await visit(v.id)).version, amount }, 'visit.agreed')
  const complete = async (v, person, receivedAt) => {
    await h.setTime(receivedAt)
    // The device says a different year; the filing year must follow receipt.
    const deviceTime = '2025-12-31T23:59:00.000Z'
    await person.run('visit.arrive', { visitId: v.id, deviceTime })
    const payload = { visitId: v.id, deviceTime, summary: 'Native subcontract work complete', signoff: { absentReason: 'Customer away' } }
    const commandId = randomUUID(), result = await person.run('visit.complete', payload, { commandId })
    const saved = await visit(v.id)
    assert.equal(saved.completion.receivedAt, receivedAt)
    completionTrail.push({ commandId, person, visitId: v.id, receivedAt })
    return { person, payload, commandId, result }
  }
  const read = async (path, as = h.owner()) => {
    const response = await h.request(path, { as })
    assert.equal(response.status, 200, await response.clone().text())
    return response.headers.get('content-type').includes('json') ? response.json() : response.text()
  }
  const excluded = () => [b.office, b.dispatcher, b.priyaPerson, sid, b.agent, b.manager]
  const expected = year => ({ year, label, rows: year === '2026' ? [
    { technicianId: a.id, payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042', visits: 2, total: '599.99', atOrOver600: false },
    { technicianId: c.id, payeeName: 'Lee Electric', tinLast4: '6000', visits: 1, total: '600.00', atOrOver600: true },
    { technicianId: tom.id, payeeName: 'Tom Heat', tinLast4: '7890', visits: 2, total: '750.25', atOrOver600: true },
  ] : [
    { technicianId: a.id, payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042', visits: 1, total: '600.01', atOrOver600: true },
    { technicianId: c.id, payeeName: 'Lee Electric', tinLast4: '6000', visits: 2, total: '599.99', atOrOver600: false },
  ] })
  const assertReports = async () => {
    for (const year of ['2026', '2027']) {
      const want = expected(year)
      for (const as of [h.owner(), b.office.cookie]) {
        const actual = await read(`/api/glove/reports/1099.json?year=${year}`, as)
        const byPayee = (a, z) => a.payeeName.localeCompare(z.payeeName)
        assert.deepEqual({ ...actual, rows: actual.rows.sort(byPayee) }, { ...want, rows: [...want.rows].sort(byPayee) })
        const [header, ...rows] = parseCsv(await read(`/api/glove/reports/1099.csv?year=${year}`, as))
        assert.deepEqual(header, columns)
        assert.deepEqual(rows.sort((a, z) => a[0].localeCompare(z[0])), [...want.rows].sort(byPayee).map(r => [r.payeeName, r.tinLast4, String(r.visits), r.total, r.atOrOver600 ? 'yes' : 'no', label]))
      }
    }
  }

  const setup = async () => {
    h = await installation({ at: '2026-12-30T12:00:00.000Z' })
    b = await business(h, { currency: 'USD', timezone: 'America/New_York' })
    sid = await h.person('Sid Sub', 'subcontractor')
    lee = await h.person('Lee Sub', 'subcontractor')
    const managerRole = await h.command('role.save', { name: 'Technician manager', permissions: ['technician.save'] })
    b.manager = await h.person('Morgan Manager', `custom:${managerRole.id}`)
  }

  point('point 1: only Owner marks, edits and clears payees; rejected TINs never enter retained data', async () => {
    const employeeCommandId = randomUUID(), employeePayload = { name: 'Delegated employee' }
    const employee = await b.manager.run('technician.save', employeePayload, { commandId: employeeCommandId })
    assert.equal(employee.subcontractor, null, 'delegated ordinary employee editing still works')
    const draft = { name: 'Sid Cooling', operatorId: sid.id, subcontractor: { payeeName: 'Original payee', tinLast4: '1111' } }
    for (const person of excluded()) await person.run('technician.save', draft, { error: 'FORBIDDEN' })
    replaySave = await run('technician.save', draft, 'technician.saved')
    a = replaySave.result
    for (const person of excluded()) {
      for (const subcontractor of [{ payeeName: 'Unauthorized edit', tinLast4: '2222' }, null]) {
        const before = await h.state()
        await person.run('technician.save', { ...a, subcontractor }, { error: 'FORBIDDEN' })
        assert.deepEqual(await h.state(), before)
      }
    }
    const { subcontractor: _payee, ...withoutPayee } = a
    const beforeOmitted = await h.state()
    await b.manager.run('technician.save', { ...withoutPayee, name: 'Unauthorized rename' }, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), beforeOmitted)
    const invalid = ['987654321', '987-65-4321', '12345', 'abc7', ' 4321', '4321 ', '', null]
    for (const tinLast4 of invalid) {
      for (const target of [{ name: 'Refused new payee' }, a]) {
        const before = await h.state(), commandId = randomUUID()
        const exported = await read('/api/glove/export'), activity = await read('/api/glove/activity')
        await h.command('technician.save', { ...target, subcontractor: { payeeName: 'Refused payee', tinLast4 } }, { error: 'INPUT', commandId })
        assert.deepEqual(await h.state(), before)
        assert.deepEqual(await read('/api/glove/export'), exported)
        assert.deepEqual(await read('/api/glove/activity'), activity)
        assert.equal(await h.db.prepare('SELECT result FROM glove_commands WHERE id=?').bind(commandId).first(), null)
      }
    }
    a = await h.command('technician.save', { ...a, subcontractor: { payeeName: 'Edited payee', tinLast4: '1234' } })
    assert.deepEqual(a.subcontractor, { payeeName: 'Edited payee', tinLast4: '1234' })
    a = await h.command('technician.save', { ...a, subcontractor: null })
    assert.equal(a.subcontractor, null)
    a = await h.command('technician.save', { ...a, subcontractor: { payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042' } })
    assert.deepEqual(a.subcontractor, { payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042' })
    c = await h.command('technician.save', { name: 'Lee Electric', operatorId: lee.id, subcontractor: { payeeName: 'Lee Electric', tinLast4: '6000' } })
    tom = await h.command('technician.save', { ...b.tom, payrollId: '1099', subcontractor: { payeeName: 'Tom Heat', tinLast4: '7890' } })
    const stored = JSON.stringify({
      state: await h.state(),
      commands: (await h.db.prepare('SELECT result FROM glove_commands').all()).results,
      activity: await read('/api/glove/activity'),
      exported: await read('/api/glove/export'),
      csv: await read('/api/glove/reports/1099.csv?year=2026'),
    })
    for (const value of invalid.filter(v => typeof v === 'string' && v)) assert.ok(!stored.includes(JSON.stringify(value)), `rejected TIN ${value} is not retained`)
    const persisted = JSON.stringify((await h.db.prepare('SELECT data FROM glove_records UNION ALL SELECT result FROM glove_commands UNION ALL SELECT data FROM glove_events').all()).results)
    for (const value of ['987654321', '987-65-4321']) assert.ok(!persisted.includes(value), 'full TIN is absent from persistent storage')
    const beforeReplay = await h.state()
    assert.deepEqual(await h.command(replaySave.type, replaySave.payload, { commandId: replaySave.commandId }), replaySave.result)
    assert.deepEqual(await h.state(), beforeReplay, 'replay does not restore an old payee')
    await h.command('role.set', { operatorId: b.manager.id, role: 'viewer' })
    const afterWithdrawal = await h.state()
    await b.manager.run('technician.save', employeePayload, { commandId: employeeCommandId, error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), afterWithdrawal, 'withdrawn authority cannot replay a previous edit')
  })

  point('point 2: Owner sets, changes and clears amounts; stale, ordinary-employee and excluded-role attempts change nothing', async () => {
    editable = await book(a, '2026-12-30')
    const first = await agree(editable, '42.00')
    assert.deepEqual(first.result.agreed, { amount: '42.00', technicianId: a.id, by: 'Olivia Owner', at: '2026-12-30T12:00:00.000Z' })
    let before = await h.state()
    await h.command('visit.agree', { visitId: editable.id, version: editable.version, amount: '999.00' }, { error: 'STALE' })
    assert.deepEqual(await h.state(), before)
    const changed = await agree(editable, '84.01')
    assert.equal(changed.result.agreed.amount, '84.01')
    // A stale clear must not discard the newly agreed money either.
    before = await h.state()
    await h.command('visit.agree', { visitId: editable.id, version: first.result.version, amount: null }, { error: 'STALE' })
    assert.deepEqual(await h.state(), before)
    for (const person of excluded()) {
      for (const amount of ['900.00', null]) {
        before = await h.state()
        await person.run('visit.agree', { visitId: editable.id, version: changed.result.version, amount }, { error: 'FORBIDDEN' })
        assert.deepEqual(await h.state(), before)
      }
    }
    const cleared = await agree(editable, null)
    assert.equal(cleared.result.agreed, null)
    replayAgree = await agree(editable, '299.99')
    const employee = await book(b.priya, '2026-12-30')
    before = await h.state()
    await h.command('visit.agree', { visitId: employee.id, version: employee.version, amount: '99.00' }, { error: 'NOT_SUBCONTRACTOR' })
    assert.deepEqual(await h.state(), before)
  })

  point('point 3: each local calendar year has exact payees, visits, cents and threshold flags after restart and once-only replay', async () => {
    // UTC has already crossed into January while New York is still December.
    replayComplete = await complete(editable, sid, '2027-01-01T04:59:59.000Z')
    await complete((await agree(await book(a, '2026-12-31'), '300.00')).result, sid, '2027-01-01T04:59:59.000Z')
    await complete((await agree(await book(c, '2026-12-31'), '600.00')).result, lee, '2027-01-01T04:59:59.000Z')
    await complete((await agree(await book(tom, '2026-12-30'), '500.00')).result, b.tomPerson, '2027-01-01T04:59:59.000Z')
    await complete((await agree(await book(tom, '2026-12-31'), '250.25')).result, b.tomPerson, '2027-01-01T04:59:59.000Z')
    await complete((await agree(await book(a, '2027-01-01'), '600.01')).result, sid, '2027-01-01T05:00:00.000Z')
    await complete((await agree(await book(c, '2027-01-01'), '400.00')).result, lee, '2027-01-01T05:00:00.000Z')
    await complete((await agree(await book(c, '2027-01-02'), '199.99')).result, lee, '2027-01-01T05:00:00.000Z')
    const uncompleted = (await agree(await book(a, '2027-01-03'), '999.00')).result
    assert.equal((await visit(uncompleted.id)).status, 'booked')
    const cancelled = (await agree(await book(a, '2027-01-04'), '999.00')).result
    await b.dispatcher.run('visit.cancel', { visitId: cancelled.id, version: cancelled.version, reason: 'Work cancelled' })
    const reassigned = (await agree(await book(a, '2027-01-05'), '999.00')).result
    const moved = await b.dispatcher.run('visit.change', { visitId: reassigned.id, version: reassigned.version, technicianId: c.id, reason: 'Lee takes this visit' })
    await complete(moved, lee, '2027-01-01T05:00:00.000Z')
    // A completed visit with an explicitly cleared amount contributes nothing.
    const noAmount = (await agree(await book(a, '2027-01-06'), '999.00')).result
    await agree(noAmount, null)
    await complete(noAmount, sid, '2027-01-01T05:00:00.000Z')
    await assertReports()
    for (const person of [b.dispatcher, b.priyaPerson, sid, b.agent, b.manager]) for (const extension of ['json', 'csv']) {
      const response = await h.request(`/api/glove/reports/1099.${extension}?year=2026`, { as: person.cookie })
      assert.equal(response.status, 403)
      assert.doesNotMatch(await response.text(), /Cooling|0042|599\.99|600\.00|750\.25/)
    }
    await h.restart()
    await assertReports()
    const before = await h.state(), activity = await read('/api/glove/activity')
    assert.deepEqual(await h.command(replayAgree.type, replayAgree.payload, { commandId: replayAgree.commandId }), replayAgree.result)
    assert.deepEqual(await replayComplete.person.run('visit.complete', replayComplete.payload, { commandId: replayComplete.commandId }), replayComplete.result)
    assert.deepEqual(await h.command(replaySave.type, replaySave.payload, { commandId: replaySave.commandId }), replaySave.result)
    assert.deepEqual(await h.state(), before)
    assert.deepEqual(await read('/api/glove/activity'), activity)
    await assertReports()
  })

  point('point 4: every parsed CSV column and JSON label is honest; report reads have no filing effect and retain attributable source events', async () => {
    const outbound = h.outbound.attempts
    const before = await h.state(), commands = (await h.db.prepare('SELECT id, result FROM glove_commands ORDER BY id').all()).results
    await assertReports()
    assert.equal(h.outbound.attempts, outbound, 'reading filing totals makes no provider request')
    assert.deepEqual(await h.state(), before, 'filing totals are read-only')
    assert.deepEqual((await h.db.prepare('SELECT id, result FROM glove_commands ORDER BY id').all()).results, commands)
    const { activity, exported } = await assertTrail(h, ['technician.saved', 'visit.agreed', 'capture.completion'])
    for (const wanted of trail) {
      const events = activity.filter(e => e.commandId === wanted.commandId && e.kind === wanted.kind)
      assert.equal(events.length, 1)
      const e = events[0]
      assert.deepEqual([e.actorName, e.actorRole, e.subjectId], ['Olivia Owner', 'owner', wanted.subjectId])
      assert.ok(e.actorId && e.at && e.summary)
      assert.equal(exported.timeline.filter(x => x.command_id === wanted.commandId && x.kind === wanted.kind).length, 1)
    }
    for (const { commandId, person, visitId, receivedAt } of completionTrail) {
      const events = activity.filter(e => e.commandId === commandId && e.kind === 'capture.completion')
      assert.equal(events.length, 1, 'one completion event, including after command replay')
      assert.deepEqual([events[0].actorId, events[0].actorName, events[0].actorRole, events[0].at],
        [person.id, person.name, person === b.tomPerson ? 'technician' : 'subcontractor', receivedAt])
      const entries = exported.timeline.filter(e => e.command_id === commandId && e.kind === 'capture.completion')
      assert.equal(entries.length, 1)
      assert.equal(entries[0].actor_id, person.id)
      assert.equal(entries[0].at, receivedAt)
      assert.ok(exported.visits.some(v => v.id === visitId && v.completion.receivedAt === receivedAt))
    }
    for (const [tech, want] of [[a, { payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042' }], [c, { payeeName: 'Lee Electric', tinLast4: '6000' }], [tom, { payeeName: 'Tom Heat', tinLast4: '7890' }]]) assert.deepEqual(exported.technicians.find(x => x.id === tech.id).subcontractor, want)
  })

  point('point 5: subcontractor time is never approvable or in any payroll file, with an explicit exclusion reason', async () => {
    await h.setTime('2027-01-01T06:00:00.000Z')
    for (const person of [b.priyaPerson, b.tomPerson]) {
      await person.run('clock.in', { deviceTime: '2026-12-30T14:00:00.000Z' })
      await person.run('clock.out', { deviceTime: '2026-12-30T15:00:00.000Z' })
    }
    await h.command('technician.save', { ...b.priya, payrollId: '104' })
    await h.command('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } })
    const before = await h.state()
    await h.command('timesheet.approve', { technicianId: tom.id, weekStart: '2026-12-28' }, { error: 'SUBCONTRACTOR' })
    assert.deepEqual(await h.state(), before)
    await h.command('timesheet.approve', { technicianId: b.priya.id, weekStart: '2026-12-28' })
    const period = 'from=2026-12-28&to=2027-01-03'
    const assertPayroll = async () => {
      const result = await read(`/api/glove/reports/payroll.json?${period}`)
      assert.deepEqual(result.people.map(p => [p.technicianId, p.hours.regular]), [[b.priya.id, '1.00']])
      assert.deepEqual(result.left, [{ technicianId: tom.id, name: 'Tom B.', reason: '1099 subcontractor: paid through the 1099-NEC totals, not payroll' }])
      const files = []
      for (const kind of ['gusto', 'adp-run', 'quickbooks']) {
        const csv = await read(`/api/glove/reports/payroll-${kind}.csv?${period}`)
        const rows = parseCsv(csv)
        assert.ok(rows.length > 1, `${kind} has an actual employee row`)
        assert.doesNotMatch(csv, /Tom|1099|7890|Cooling|0042|Lee Electric|6000/)
        assert.match(csv, kind === 'adp-run' ? /104/ : /Priya/)
        assert.equal(await read(`/api/glove/reports/payroll-${kind}.csv?${period}`, b.office.cookie), csv)
        files.push(csv)
      }
      return { result, files }
    }
    const payroll = await assertPayroll()
    await h.restart()
    assert.deepEqual(await assertPayroll(), payroll)
    await assertReports()
  })
  try {
    await setup()
    for (const { name, check } of points) {
      t.diagnostic(name)
      await check()
    }
  } finally { await h?.close() }
}
