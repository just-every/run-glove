import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { parseCsv } from '../../src/glove/csv-format.ts'
import { installation, business } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

test('DISP-007 crews retain multi-day work, authority, atomic review and evidence through restart', async t => {
  const h = await installation({ at: '2026-11-09T12:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const sub = await h.person('Sid Install', 'subcontractor')
  const sid = await h.command('technician.save', { name: 'Sid Install', operatorId: sub.id, subcontractor: { payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042' } })
  const trail = []
  const owner = (await h.state()).actor
  const run = async (person, type, payload, kind) => {
    const commandId = randomUUID()
    let subjectIds
    if (type === 'visit.change' || type === 'visit.cancel') {
      const state = await h.state(), visit = state.visits.find(v => v.id === payload.visitId)
      subjectIds = state.visits.filter(v => v.crew?.groupId === visit.crew.groupId && !['completed', 'cancelled'].includes(v.status)).map(v => v.id)
    }
    const result = await (person ? person.run(type, payload, { commandId }) : h.command(type, payload, { commandId }))
    subjectIds ??= result.visits?.map(v => v.id) ?? [result.id]
    trail.push({ commandId, kind, person: person ?? owner, subjectIds, payload })
    return { commandId, result, payload, type, person }
  }
  const job = title => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ description: 'Install labor', quantity: '1', unitPrice: '100.00' }] })
  const book = (jobId, assignee, date, start = '08:00', end = '16:00') => run(b.dispatcher, 'visit.book', { jobId, ...assignee, date, start, end }, 'visit.booked')
  const current = async id => (await h.state()).visits.find(v => v.id === id)
  const group = async id => (await h.state()).visits.filter(v => v.crew?.groupId === id)
  const read = async path => {
    const response = await h.request(path)
    assert.equal(response.status, 200)
    return response.headers.get('content-type').includes('json') ? response.json() : response.text()
  }
  const unchanged = async action => {
    const before = await h.state(), activity = await read('/api/glove/activity'), exported = await read('/api/glove/export')
    await action()
    assert.deepEqual(await h.state(), before, 'refusal changes no visits, captures, crews or events')
    assert.deepEqual(await read('/api/glove/activity'), activity)
    assert.deepEqual(await read('/api/glove/export'), exported)
  }
  const complete = async (person, visit) => {
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    return person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Install stage finished', signoff: { absentReason: 'Customer away' }, jobComplete: false })
  }
  let crew

  await scenario(t, 'point 1: three-day install isolates every signed-in member and totals only completed agreed work', async () => {
    crew = (await run(null, 'crew.save', { name: 'Install team', memberIds: [b.priya.id, b.tom.id] }, 'crew.saved')).result
    const install = await job('Three-day heat pump install')
    const days = ['2026-11-02', '2026-11-03', '2026-11-04'], groups = [], subs = []
    for (const date of days) {
      groups.push((await book(install.id, { crewId: crew.id }, date)).result)
      subs.push((await book(install.id, { technicianId: sid.id }, date)).result)
    }
    assert.deepEqual(groups.map(g => g.visits.map(v => [v.technicianId, v.local.date, v.local.start, v.local.end, v.crew]).sort()), days.map((date, i) => [b.priya, b.tom].map(tech => [tech.id, date, '08:00', '16:00', { crewId: crew.id, name: 'Install team', groupId: groups[i].id }]).sort()))
    for (const [person, ids] of [[b.priyaPerson, groups.map(g => g.visits.find(v => v.technicianId === b.priya.id).id)], [b.tomPerson, groups.map(g => g.visits.find(v => v.technicianId === b.tom.id).id)], [sub, subs.map(v => v.id)]]) {
      const state = await person.state()
      assert.deepEqual(state.visits.map(v => v.id).sort(), ids.sort(), 'the whole state visit list is exactly this person’s three visits')
    }
    for (const [i, amount] of ['450.17', '300.08', '275.01'].entries()) {
      await h.command('visit.agree', { visitId: subs[i].id, version: (await current(subs[i].id)).version, amount })
      if (i < 2) await complete(sub, subs[i])
    }
    const label = 'Totals for your filing, not a filed 1099'
    assert.deepEqual(await read('/api/glove/reports/1099.json?year=2026'), { year: '2026', label, rows: [{ technicianId: sid.id, payeeName: 'Sid, "Cooling" LLC', tinLast4: '0042', visits: 2, total: '750.25', atOrOver600: true }] })
    assert.deepEqual(parseCsv(await read('/api/glove/reports/1099.csv?year=2026')), [
      ['payee', 'tin last 4', 'completed visits', 'total', 'at or over $600', 'note'],
      ['Sid, "Cooling" LLC', '0042', '2', '750.25', 'yes', label],
    ])
    assert.equal((await h.request('/api/glove/reports/1099.json?year=2026', { as: sub.cookie })).status, 403)
    t.diagnostic('PROBE DISP-007 1: state and filing report doors -> exactly three own visits each; completed total 750.25 with all CSV columns')
  })

  await scenario(t, 'point 2: independently enumerated single, crew and subcontractor visits span months and survive Worker restart', async () => {
    const work = await job('Staged install across two months')
    const expected = []
    const add = async (assignee, date, start, end, technicians) => {
      const { result } = await book(work.id, assignee, date, start, end)
      const visits = result.visits ?? [result]
      assert.deepEqual(visits.map(v => v.technicianId).sort(), technicians.map(x => x.id).sort())
      expected.push(...technicians.map(tech => [tech.id, date, start, end, assignee.crewId ?? null]))
    }
    await add({ technicianId: b.priya.id }, '2026-10-27', '09:15', '10:45', [b.priya])
    await add({ crewId: crew.id }, '2026-10-29', '07:30', '12:15', [b.priya, b.tom])
    await add({ technicianId: sid.id }, '2026-10-31', '11:00', '14:30', [sid])
    await add({ technicianId: b.tom.id }, '2026-11-06', '13:15', '15:45', [b.tom])
    await add({ crewId: crew.id }, '2026-11-10', '08:45', '17:00', [b.priya, b.tom])
    await add({ technicianId: sid.id }, '2026-11-13', '06:30', '09:00', [sid])
    const rows = state => state.visits.filter(v => v.jobId === work.id).map(v => [v.technicianId, v.local.date, v.local.start, v.local.end, v.crew?.crewId ?? null]).sort()
    assert.deepEqual(rows(await h.state()), expected.sort())
    const before = await h.state()
    await h.restart()
    assert.deepEqual(rows(await h.state()), expected.sort())
    assert.deepEqual(await h.state(), before, 'actual disposed and recreated Worker retains all data and visit times')
    t.diagnostic('PROBE DISP-007 2: six bookings on one job across October and November -> eight exact member visits retained after actual restart')
  })

  await scenario(t, 'point 3: Owner alone saves distinct active same-branch crews; later edits leave earlier booking snapshots intact', async () => {
    const role = await h.command('role.save', { name: 'Crew assistant', permissions: ['technician.save', 'visit.book', 'visit.change'] })
    const custom = await h.person('Casey Crew', `custom:${role.id}`)
    const draft = { name: 'Unauthorized crew', memberIds: [b.priya.id, sid.id] }
    for (const person of [b.office, b.dispatcher, b.priyaPerson, sub, custom]) {
      await unchanged(() => person.run('crew.save', draft, { error: 'FORBIDDEN' }))
      await unchanged(() => person.run('crew.save', { ...crew, name: 'Unauthorized rename' }, { error: 'FORBIDDEN' }))
    }
    const token = await h.command('token.issue', { name: 'Synthetic crew integration', role: 'dispatcher' })
    const tokenCommand = async (type, payload, commandId = randomUUID()) => h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token.token}` }, body: { commandId, type, payload } })
    // Last-use metadata is expected to change on authentication, crews and domain records are not.
    const beforeToken = (await h.state()).crews
    const refusal = await tokenCommand('crew.save', draft)
    assert.equal(refusal.status, 403)
    assert.equal((await refusal.json()).error.code, 'FORBIDDEN')
    assert.deepEqual((await h.state()).crews, beforeToken)
    const extra = []
    for (let i = 0; i < 8; i++) extra.push(await h.command('technician.save', { name: `Install helper ${i + 1}` }))
    const tenIds = [b.priya.id, sid.id, ...extra.map(x => x.id)]
    const ten = (await run(null, 'crew.save', { name: 'Large install team', memberIds: [...tenIds, b.priya.id] }, 'crew.saved')).result
    assert.deepEqual(ten.memberIds, tenIds, 'a repeated member counts once, so ten distinct members commit')
    const inactive = await h.command('technician.save', { name: 'Inactive helper', active: false })
    const otherBranch = await h.command('branch.save', { name: 'North', prefix: 'NTH', timezone: 'UTC', zips: [] })
    const foreign = await h.command('technician.save', { name: 'North helper', branchId: otherBranch.id })
    for (const [payload, error] of [
      [{ name: 'One member', memberIds: [b.priya.id] }, 'INPUT'],
      [{ name: 'One repeated', memberIds: [b.priya.id, b.priya.id] }, 'INPUT'],
      [{ name: 'Eleven members', memberIds: [...tenIds, b.tom.id] }, 'INPUT'],
      [{ name: 'Inactive crew', memberIds: [b.priya.id, inactive.id] }, 'TECHNICIAN'],
      [{ name: 'Cross branch', memberIds: [b.priya.id, foreign.id] }, 'BRANCH'],
      [{ name: 'INSTALL TEAM', memberIds: [b.tom.id, sid.id] }, 'DUPLICATE'],
      [{ ...ten, version: ten.version - 1, name: 'Stale team' }, 'STALE'],
    ]) {
      await unchanged(() => h.command('crew.save', payload, { error }))
      if (!payload.id) await unchanged(() => h.command('crew.save', { ...ten, ...payload }, { error }))
    }
    const work = await job('Crew roster history')
    const earlier = (await book(work.id, { crewId: crew.id }, '2026-11-16')).result
    const saved = (await run(null, 'crew.save', { ...crew, name: 'Replacement team', memberIds: [b.tom.id, sid.id] }, 'crew.saved')).result
    assert.equal(saved.version, crew.version + 1)
    await unchanged(() => h.command('crew.save', { ...crew, name: 'Old version' }, { error: 'STALE' }))
    const later = (await book(work.id, { crewId: saved.id }, '2026-11-18')).result
    assert.deepEqual(later.visits.map(v => [v.technicianId, v.crew.name]).sort(), [[b.tom.id, 'Replacement team'], [sid.id, 'Replacement team']].sort())
    const snapshot = async () => assert.deepEqual((await group(earlier.id)).map(v => [v.technicianId, v.crew]).sort(), [b.priya, b.tom].map(tech => [tech.id, { crewId: crew.id, name: 'Install team', groupId: earlier.id }]).sort())
    await snapshot()
    await run(b.dispatcher, 'visit.change', { visitId: earlier.visits[1].id, version: (await current(earlier.visits[1].id)).version, date: '2026-11-17', reason: 'Material delivery' }, 'visit.changed')
    await snapshot()
    await run(b.dispatcher, 'visit.cancel', { visitId: earlier.visits[0].id, version: (await current(earlier.visits[0].id)).version, reason: 'Customer postponed' }, 'visit.cancelled')
    await snapshot()
    assert.deepEqual((await group(earlier.id)).map(v => v.status), ['cancelled', 'cancelled'])
    crew = saved
    // A permitted token command cannot replay after its credential is revoked.
    const tokenId = randomUUID(), tokenPayload = { jobId: work.id, technicianId: b.priya.id, date: '2026-11-19', start: '09:00', end: '10:00' }
    assert.equal((await tokenCommand('visit.book', tokenPayload, tokenId)).status, 200)
    await h.command('token.revoke', { tokenId: token.id })
    await unchanged(async () => {
      const response = await tokenCommand('visit.book', tokenPayload, tokenId)
      assert.equal(response.status, 401)
      assert.equal((await response.json()).error.code, 'AUTH')
    })
    t.diagnostic('PROBE DISP-007 3: saves refuse excluded actors and invalid rosters unchanged; two and ten commit; booked snapshot survives rename, move and cancellation')
  })

  await scenario(t, 'point 4: one review includes both members and partial acknowledgement or replay creates no extra visit', async () => {
    const work = await job('Shared conflict review')
    const a = (await book(work.id, { technicianId: b.tom.id }, '2026-11-20', '09:00', '11:00')).result
    const z = (await book(work.id, { technicianId: sid.id }, '2026-11-20', '10:00', '12:00')).result
    const payload = { jobId: work.id, crewId: crew.id, date: '2026-11-20', start: '10:15', end: '10:45' }
    const codes = [`overlap:${a.id}`, `overlap:${z.id}`].sort()
    let review
    await unchanged(async () => { review = await b.dispatcher.run('visit.book', payload, { error: 'CONFLICT_REVIEW' }) })
    assert.deepEqual(review.details.conflicts.map(c => c.code).sort(), codes)
    assert.ok(review.details.conflicts.some(c => c.message.includes('Tom B.')))
    assert.ok(review.details.conflicts.some(c => c.message.includes('Sid Install')))
    await unchanged(() => b.dispatcher.run('visit.book', { ...payload, acknowledge: [codes[0]] }, { error: 'CONFLICT_REVIEW' }))
    const booking = await run(b.dispatcher, 'visit.book', { ...payload, acknowledge: codes }, 'visit.booked')
    assert.deepEqual((await group(booking.result.id)).map(v => [v.technicianId, v.local.date, v.local.start, v.local.end]).sort(), [[b.tom.id, '2026-11-20', '10:15', '10:45'], [sid.id, '2026-11-20', '10:15', '10:45']].sort())
    await unchanged(async () => assert.deepEqual(await b.dispatcher.run(booking.type, booking.payload, { commandId: booking.commandId }), booking.result))
    t.diagnostic('PROBE DISP-007 4: book with two overlaps -> both conflicts; partial ack no writes; full ack exactly two visits; replay unchanged')
  })

  await scenario(t, 'point 5: any open member moves the group after one review; completed and canceled visits and stale attempts stay unchanged', async () => {
    const work = await job('Open members travel together')
    const three = (await run(null, 'crew.save', { name: 'Three stage crew', memberIds: [b.priya.id, b.tom.id, sid.id] }, 'crew.saved')).result
    const booking = (await book(work.id, { crewId: three.id }, '2026-11-23', '08:00', '10:00')).result
    const priya = booking.visits.find(v => v.technicianId === b.priya.id)
    const tom = booking.visits.find(v => v.technicianId === b.tom.id), subcontractor = booking.visits.find(v => v.technicianId === sid.id)
    await complete(b.priyaPerson, priya)
    const finished = await current(priya.id)
    const overlaps = []
    for (const technician of [b.tom, sid]) overlaps.push((await book(work.id, { technicianId: technician.id }, '2026-11-24', '11:00', '13:00')).result)
    const payload = { visitId: tom.id, version: (await current(tom.id)).version, date: '2026-11-24', start: '11:30', end: '12:30', reason: 'Crane rescheduled' }
    let review
    await unchanged(async () => { review = await b.dispatcher.run('visit.change', payload, { error: 'CONFLICT_REVIEW' }) })
    const codes = overlaps.map(v => `overlap:${v.id}`).sort()
    assert.deepEqual(review.details.conflicts.map(c => c.code).sort(), codes)
    await unchanged(() => b.dispatcher.run('visit.change', { ...payload, acknowledge: [codes[0]] }, { error: 'CONFLICT_REVIEW' }))
    await run(b.dispatcher, 'visit.change', { ...payload, acknowledge: codes }, 'visit.changed')
    assert.deepEqual(await current(priya.id), finished)
    assert.deepEqual((await group(booking.id)).filter(v => v.id !== priya.id).map(v => [v.technicianId, v.local.date, v.local.start, v.local.end]).sort(), [[b.tom.id, '2026-11-24', '11:30', '12:30'], [sid.id, '2026-11-24', '11:30', '12:30']].sort())
    await unchanged(() => b.dispatcher.run('visit.change', { ...payload, date: '2026-11-25' }, { error: 'STALE' }))
    await unchanged(() => b.dispatcher.run('visit.change', { visitId: tom.id, version: (tom.version + 1), technicianId: b.priya.id, reason: 'Reassign crew' }, { error: 'CREW' }))
    await run(b.dispatcher, 'visit.change', { visitId: subcontractor.id, version: (await current(subcontractor.id)).version, date: '2026-11-25', start: '14:15', end: '16:45', reason: 'Subcontractor moves the stage' }, 'visit.changed')
    assert.deepEqual(await current(priya.id), finished)
    for (const member of [tom, subcontractor]) assert.deepEqual((await current(member.id)).local, { date: '2026-11-25', start: '14:15', end: '16:45', timezone: 'UTC' })
    const canceled = (await book(work.id, { crewId: crew.id }, '2026-11-26')).result
    await run(b.dispatcher, 'visit.cancel', { visitId: canceled.visits[1].id, version: canceled.visits[1].version, reason: 'No longer needed' }, 'visit.cancelled')
    for (const member of canceled.visits) await unchanged(() => b.dispatcher.run('visit.change', { visitId: member.id, version: member.version + 1, date: '2026-11-27', reason: 'Cannot revive canceled work' }, { error: 'VISIT_STATE' }))
    t.diagnostic('PROBE DISP-007 5: moves from both open members follow reviewed times; completed member frozen; technician swap, stale and canceled moves refused unchanged')
  })

  await scenario(t, 'point 6: cancellation acts on all members and each kind of recorded evidence refuses the whole group', async () => {
    const work = await job('Evidence protects crew work')
    const booking = (await book(work.id, { crewId: crew.id }, '2026-12-01')).result
    const cancellation = await run(b.dispatcher, 'visit.cancel', { visitId: booking.visits[1].id, version: booking.visits[1].version, reason: 'Site closed' }, 'visit.cancelled')
    assert.deepEqual((await group(booking.id)).map(v => [v.status, v.cancelled.by.id, v.cancelled.reason]), [['cancelled', b.dispatcher.id, 'Site closed'], ['cancelled', b.dispatcher.id, 'Site closed']])
    await unchanged(async () => assert.deepEqual(await b.dispatcher.run(cancellation.type, cancellation.payload, { commandId: cancellation.commandId }), cancellation.result))
    const photo = { mediaType: 'image/jpeg', base64: Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64') }
    for (const [i, kind] of ['arrival', 'note', 'photo'].entries()) {
      const booked = (await book(work.id, { crewId: crew.id }, `2026-12-0${3 + i}`)).result
      const captured = booked.visits.find(v => v.technicianId === sid.id)
      const commandId = randomUUID()
      const type = kind === 'arrival' ? 'visit.arrive' : 'visit.capture'
      const payload = { visitId: captured.id, deviceTime: captured.startAt, ...(kind === 'arrival' ? {} : kind === 'note' ? { kind, text: 'Materials delivered' } : { kind, caption: 'Delivered equipment', photo }) }
      const result = await sub.run(type, payload, { commandId })
      assert.ok((await h.state()).captures.some(c => c.visitId === captured.id && c.kind === kind))
      for (const member of booked.visits) {
        const fresh = await current(member.id)
        await unchanged(() => b.dispatcher.run('visit.cancel', { visitId: fresh.id, version: fresh.version, reason: 'Unsafe cancel' }, { error: 'VISIT_STATE' }))
      }
      await unchanged(async () => assert.deepEqual(await sub.run(type, payload, { commandId }), result))
    }
    const erasedCustomer = await h.command('customer.save', { name: 'Synthetic private crew customer' })
    const erasedSite = await h.command('site.save', { customerId: erasedCustomer.id, address: '21 Synthetic Street' })
    const erasedJob = await b.dispatcher.run('job.create', { customerId: erasedCustomer.id, siteId: erasedSite.id, title: 'Synthetic private install' })
    const erasedGroup = await b.dispatcher.run('visit.book', { jobId: erasedJob.id, crewId: crew.id, date: '2026-12-08', start: '08:00', end: '09:00' })
    const ownVisit = erasedGroup.visits.find(v => v.technicianId === sid.id), captureId = randomUUID()
    const capturedPhoto = { visitId: ownVisit.id, deviceTime: ownVisit.startAt, kind: 'photo', caption: 'Synthetic private equipment', photo }
    const capture = await sub.run('visit.capture', capturedPhoto, { commandId: captureId })
    const preview = await h.command('privacy.preview', { customerId: erasedCustomer.id, version: erasedCustomer.version })
    await h.command('privacy.erase', { customerId: erasedCustomer.id, version: erasedCustomer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    assert.ok(!(await sub.state()).visits.some(v => v.jobId === erasedJob.id))
    assert.ok(!(await h.state()).captures.some(c => c.visitId === ownVisit.id))
    assert.equal((await h.request(`/api/glove/files/${capture.file.fileId}`, { as: sub.cookie })).status, 404)
    await unchanged(() => sub.run('visit.capture', capturedPhoto, { commandId: captureId, error: 'FORBIDDEN' }))
    assert.ok(!JSON.stringify(await read('/api/glove/export')).includes('Synthetic private equipment'))
    t.diagnostic('PROBE DISP-007 6: whole group canceled; arrival, note and photo on one member each refuse cancellation and preserve visits, captures and events')
  })

  await scenario(t, 'point 7: Activity and business export attribute crew saves, bookings, moves and cancellations to real people', async () => {
    const activity = [], exported = await read('/api/glove/export')
    let next = null
    do {
      const page = await read(`/api/glove/activity${next ? `?before=${next}` : ''}`)
      activity.push(...page.events)
      next = page.next
    } while (next)
    for (const { commandId, kind, person, subjectIds } of trail) {
      const events = activity.filter(e => e.commandId === commandId && e.kind === kind)
      assert.deepEqual(events.map(e => e.subjectId).sort(), subjectIds.sort())
      for (const e of events) {
        assert.deepEqual([e.actorId, e.actorName, e.actorRole], [person.id, person.name, person.role ?? 'dispatcher'])
        assert.equal(e.at, '2026-11-09T12:00:00.000Z')
        assert.ok(e.summary)
        const kept = exported.timeline.filter(x => x.id === e.id)
        assert.equal(kept.length, 1)
        assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id, kept[0].subject_id, kept[0].at, kept[0].summary], [e.actorId, e.actorName, e.actorRole, commandId, e.subjectId, e.at, e.summary])
      }
    }
    const prior = trail.find(entry => entry.kind === 'visit.booked')
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await unchanged(() => b.dispatcher.run('visit.book', prior.payload, { commandId: prior.commandId, error: 'FORBIDDEN' }))
    t.diagnostic('PROBE DISP-007 7: Activity and export -> actual Owner crew saves and Dispatcher member bookings, moves and cancellations')
  })
})
