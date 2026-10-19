// DISP-007 crews and subcontractors through the command, state, file,
// timeline and report doors: a crew is booked, moved and canceled as one; a
// subcontractor sees and records only their own visits; and the owner's
// agreed amounts on completed visits make the 1099-NEC totals.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

test('DISP-007 a three-day install for a two-person crew and a subcontractor: each sees only their visits, the crew moves as one, and the subcontractor\'s 1099 total is kept', async (t) => {
  const h = await installation()
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

  await t.test('DISP-007 the crew is booked as one: one visit per member each day, and each member sees only their own', async () => {
    assert.deepEqual(crewDays.map(g => g.visits.map(v => [v.technicianId, v.local.date, v.crew.name]).sort()), days.map(d => [[b.priya.id, d, 'Install crew'], [b.tom.id, d, 'Install crew']].sort()))
    const mine = async person => (await person.state()).visits.filter(v => v.jobId === job.id).map(v => v.id).sort()
    assert.deepEqual(await mine(b.priyaPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.priya.id).id).sort())
    assert.deepEqual(await mine(b.tomPerson), crewDays.map(g => g.visits.find(v => v.technicianId === b.tom.id).id).sort())
  })

  await t.test('DISP-007 the subcontractor sees only their own visits on the job, without money or other people\'s work', async () => {
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

  await t.test('DISP-007 the subcontractor records arrival, checklist, notes and completion on their visits only, and cannot clock in', async () => {
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

  await t.test('DISP-007 moving or canceling a crew visit moves or cancels every member\'s visit, after one conflict review', async () => {
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

  await t.test('DISP-007 the owner\'s agreed amounts on completed visits make the subcontractor\'s 1099-NEC total for the year', async () => {
    const amounts = ['450.00', '300.00', '275.00']
    for (const [i, v] of sidDays.entries()) {
      const current = (await h.state()).visits.find(x => x.id === v.id)
      await b.office.run('visit.agree', { visitId: v.id, version: current.version, amount: amounts[i] }, { error: 'FORBIDDEN' })
      await h.command('visit.agree', { visitId: v.id, version: current.version, amount: amounts[i] })
    }
    const tomVisit = (await h.state()).visits.find(x => x.id === tomDay1.id)
    await h.command('visit.agree', { visitId: tomVisit.id, version: tomVisit.version, amount: '100.00' }, { error: 'NOT_SUBCONTRACTOR' })
    const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric' }).format(new Date())
    const totals = await (await h.request(`/api/glove/reports/1099.json?year=${year}`, { as: b.office.cookie })).json()
    assert.equal(totals.label, 'Totals for your filing, not a filed 1099')
    assert.deepEqual(totals.rows.map(r => [r.payeeName, r.tinLast4, r.visits, r.total, r.atOrOver600]), [['Sid Sub HVAC LLC', '4321', 2, '750.00', true]], 'the third day is not completed, so its $275.00 is not counted')
    const csv = await (await h.request(`/api/glove/reports/1099.csv?year=${year}`)).text()
    assert.equal(csv.trim().split(/\r?\n/)[1], `Sid Sub HVAC LLC,4321,2,750.00,yes,"Totals for your filing, not a filed 1099"`)
    assert.equal((await h.request(`/api/glove/reports/1099.json?year=${year}`, { as: b.dispatcher.cookie })).status, 403)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /123456789/)
  })
})
