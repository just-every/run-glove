// The record trail a business relies on later: a corrected invoice never goes
// to the accounting system under its original number twice, and every job keeps
// its whole timeline however busy the business gets.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob, branchActivityHistory } from './harness.mjs'

test('a correction revised before approval still exports as its own numbered row', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  let inv = await b.office.run('invoice.prepare', { jobId: job.id })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  await b.office.run('invoice.export', {})
  inv = (await h.state()).invoices.find(i => i.id === inv.id)
  inv = await b.office.run('invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Wrong service price', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '179.00' }] })
  inv = await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Typo in the description', lines: [{ description: 'Split system service (corrected)', quantity: '1', unitPrice: '179.00' }] })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 3 })
  const second = await b.office.run('invoice.export', {})
  assert.deepEqual(second.invoices.map(i => i.invoiceNumber), ['INV-0001-R3'])
  const csv = await (await h.request(`/api/glove/exports/${second.id}.csv`, { as: b.office.cookie })).text()
  const numbers = [...csv.matchAll(/,(INV-\d{4}(?:-R\d+)?),/g)].map(m => m[1])
  assert.deepEqual(numbers, ['INV-0001-R3'], 'the original number is never exported again')
  assert.match(csv, /corrects INV-0001 rev 1 \(EXP-0001\)/)
})

test('DATA-002, DATA-009, DATA-010 a job and Activity keep the whole timeline after hundreds of later events', async (t) => {
  const h = await installation({ at: '2026-10-20T00:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const dispatcher = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
  const technician = { id: b.priyaPerson.id, name: 'Priya Nair', role: 'technician' }
  const office = { id: b.office.id, name: 'Olu Office', role: 'office' }
  const expected = [], downloadExpected = [], commands = []
  const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  // Expectations come from the actions we issue and the people we invited,
  // never from Activity, another timeline or the business download.
  const act = async (person, actor, type, payload) => {
    const commandId = `synthetic-glove-timeline-${commands.length + 1}`
    const at = new Date(Date.UTC(2026, 9, 20, 1, commands.length)).toISOString()
    await clock(at)
    const result = await person.run(type, payload, { commandId })
    const action = { person, actor, type, payload, commandId, at, result }
    commands.push(action)
    return action
  }
  let job
  const remember = (action, kind, subjectKind, subjectId, changes) => {
    const fact = {
      kind, subjectKind, subjectId, jobId: job?.id ?? null, actorId: action.actor.id,
      actorName: action.actor.name, actorRole: action.actor.role,
      commandId: action.commandId, at: action.at, changes,
    }
    downloadExpected.push(fact)
    if (fact.jobId) expected.push(fact)
  }
  const change = (kind, id, fromVersion, toVersion, field) => ({ kind, id, fromVersion, toVersion, field })
  const drafted = await act(b.dispatcher, dispatcher, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Native service history', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  remember(drafted, 'quote.drafted', 'quote', drafted.result.id, [change('quotes', drafted.result.id, null, 1, 'revisions')])
  const approved = await act(b.dispatcher, dispatcher, 'quote.approve', { quoteId: drafted.result.id, version: drafted.result.version, revision: 1 })
  remember(approved, 'quote.approved', 'quote', drafted.result.id, [change('quotes', drafted.result.id, 1, 2, 'revisions')])
  const accepted = await act(b.dispatcher, dispatcher, 'quote.accept', { quoteId: drafted.result.id, version: approved.result.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  remember(accepted, 'quote.accepted', 'quote', drafted.result.id, [change('quotes', drafted.result.id, 2, 3, 'acceptance')])
  const created = await act(b.dispatcher, dispatcher, 'job.create', { quoteId: accepted.result.id })
  job = created.result
  remember(created, 'job.created', 'job', job.id, [change('jobs', job.id, null, 1, 'quoteId'), change('quotes', accepted.result.id, 3, 4, 'jobId')])
  const booked = await act(b.dispatcher, dispatcher, 'visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  const visit = booked.result
  remember(booked, 'visit.booked', 'visit', visit.id, [change('visits', visit.id, null, 1, 'assignments')])
  const arrived = await act(b.priyaPerson, technician, 'visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:04:00Z' })
  remember(arrived, 'capture.arrival', 'capture', arrived.commandId, [change('captures', arrived.commandId, null, 1, 'deviceTime'), change('visits', visit.id, 1, 3, 'arrival')])
  let visitVersion = 3
  // Enumerate the work before reading its generated item identities. A missing
  // or reordered checklist cannot silently shorten the expected history.
  const checklist = [
    { label: 'Isolate power', required: true },
    { label: 'Clean filters', required: true },
    { label: 'Check refrigerant pressure', required: true },
    { label: 'Test run 10 minutes', required: false },
  ]
  assert.deepEqual(job.checklist.map(({ label, required }) => ({ label, required })), checklist)
  for (const [i, item] of checklist.entries()) {
    const captured = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:10:00Z', kind: 'checklist', itemId: job.checklist[i].id, result: 'done' })
    remember(captured, 'capture.checklist', 'capture', captured.commandId, [change('captures', captured.commandId, null, 1, 'result'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  }
  const noted = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:20:00Z', kind: 'note', text: 'Cleaned filters and coil' })
  remember(noted, 'capture.note', 'capture', noted.commandId, [change('captures', noted.commandId, null, 1, 'text'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  const material = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:30:00Z', kind: 'material', serviceId: b.refrigerant.id, quantity: '0.5', unit: 'kg' })
  remember(material, 'capture.material', 'capture', material.commandId, [change('captures', material.commandId, null, 1, 'quantity'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  const completed = await act(b.priyaPerson, technician, 'visit.complete', { visitId: visit.id, deviceTime: '2026-10-19T23:00:00Z', summary: 'Cleaned filters and coil', signoff: { absentReason: 'Customer out' } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
  assert.ok(report, 'the native completion creates its report')
  const completionChanges = [change('captures', completed.commandId, null, 1, 'summary'), change('visits', visit.id, visitVersion, visitVersion + 2, 'completion'), change('serviceReports', report.id, null, 1, 'snapshot'), change('jobs', job.id, 1, 2, 'status')]
  remember(completed, 'capture.completion', 'capture', completed.commandId, completionChanges)
  remember(completed, 'report.created', 'serviceReport', report.id, [])
  remember(completed, 'job.completed', 'job', job.id, [])

  // The same person later holds a different role. History must keep the role
  // actually used for each action, while every new read uses current authority.
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'office' })
  const formerDispatcher = { ...dispatcher, role: 'office' }
  const prepared = await act(b.dispatcher, formerDispatcher, 'invoice.prepare', { jobId: job.id })
  remember(prepared, 'invoice.prepared', 'invoice', prepared.result.id, [change('invoices', prepared.result.id, null, 1, 'revisions')])
  const invoice = await act(b.office, office, 'invoice.approve', { invoiceId: prepared.result.id, version: prepared.result.version, revision: 1 })
  remember(invoice, 'invoice.approved', 'invoice', invoice.result.id, [change('invoices', invoice.result.id, 1, 2, 'revisions')])
  const accounting = await act(b.office, office, 'invoice.export', {})
  remember(accounting, 'invoice.exported', 'invoice', invoice.result.id, [change('invoices', invoice.result.id, 2, 3, 'revisions'), change('exports', accounting.result.id, null, 1, 'invoices')])

  const timeline = async (as) => { const res = await h.request(`/api/glove/jobs/${job.id}/timeline`, { as }); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).events }
  const metadata = e => Object.fromEntries(['kind', 'subjectKind', 'subjectId', 'jobId', 'actorId', 'actorName', 'actorRole', 'commandId', 'at'].map(key => [key, e[key]]))
  const checkTimeline = (events, facts) => {
    assert.deepEqual(events.map(metadata), facts.map(metadata), 'the complete ordered history has the independently expected people, historical roles, commands, records and times')
    assert.equal(new Set(events.map(e => e.id)).size, facts.length, 'each retained step has a distinct event identity')
    for (const [i, event] of events.entries()) {
      assert.ok(event.summary && Number.isSafeInteger(event.sequence), 'a step has a readable description and durable order')
      if (i) assert.ok(event.sequence > events[i - 1].sequence)
      for (const { field, ...record } of facts[i].changes) {
        const kept = event.recordChanges.find(r => r.kind === record.kind && r.id === record.id)
        assert.ok(kept, `${event.kind} names its affected ${record.kind} record`)
        assert.deepEqual({ kind: kept.kind, id: kept.id, fromVersion: kept.fromVersion, toVersion: kept.toVersion }, record)
        assert.ok(kept.fields.includes(field), `${event.kind} names the changed ${field} field without its value`)
      }
    }
  }
  const agentQuote = await b.agent.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Agent-prepared follow-up', lines: [{ description: 'Follow-up', quantity: '1', unitPrice: '85.00' }] })
  const exportedEvents = rows => rows.map(e => ({ id: e.id, sequence: e.sequence, at: e.at, actorId: e.actor_id, actorName: e.actor_name, actorRole: e.actor_role, commandId: e.command_id, jobId: e.job_id, subjectKind: e.subject_kind, subjectId: e.subject_id, kind: e.kind, summary: e.summary, recordChanges: JSON.parse(e.data)?.recordChanges ?? [] }))
  const download = async as => {
    const response = await h.request('/api/glove/export', { as })
    assert.equal(response.status, 200, await response.clone().text())
    return response.json()
  }
  const commandIds = new Set(commands.map(c => c.commandId))
  const serviceHistory = data => exportedEvents(data.timeline.filter(e => commandIds.has(e.command_id)))
  const earlyDownload = serviceHistory(await download(h.owner()))
  checkTimeline(earlyDownload, downloadExpected)
  const early = await timeline(h.owner())
  assert.ok(early.length >= 6, 'booked, arrived, checklist, completed')
  checkTimeline(early, expected)
  for (let i = 0; i < 510; i++) await h.command('customer.save', { name: `Walk-in customer ${i}` })
  await h.restart()
  const state = await h.state()
  assert.ok(!state.events.some(e => e.id === early[0].id), 'the latest Activity window no longer holds the early event')
  const previous = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`).then(r => r.json())
  assert.ok(previous.events.some(e => e.id === early[0].id), 'the Activity cursor still reaches it')
  assert.ok(previous.events.some(e => e.subjectId === agentQuote.id && e.actorId === b.agent.id && e.actorRole === 'agent'), 'the agent action keeps its own identity')
  const fieldEvents = expected.filter(e => ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)).map(e => ({ ...e, changes: e.changes.filter(r => ['jobs', 'visits', 'captures', 'times'].includes(r.kind)) }))
  const ownActivity = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`, { as: b.priyaPerson.cookie }).then(r => r.json())
  assert.ok(ownActivity.events.every(e => e.jobId === job.id && ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)), 'older pages enforce the technician’s current job and field visibility')
  checkTimeline([...ownActivity.events].reverse(), fieldEvents)
  assert.equal((await h.request('/api/glove/activity?before=invalid')).status, 400)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(exported.timeline.some(e => e.id === early[0].id))
  const agentEvent = exported.timeline.find(e => e.subject_id === agentQuote.id && e.actor_id === b.agent.id)
  assert.ok(JSON.parse(agentEvent.data).recordChanges.some(r => r.kind === 'quotes' && r.id === agentQuote.id && r.toVersion === agentQuote.version && r.fields.includes('revisions')), 'the export names the changed record, revision and fields without copying its values')
  const late = await timeline(h.owner())
  checkTimeline(late, expected)
  assert.deepEqual(late, early, 'every complete step is unchanged after 510 later commands and a real Worker restart')
  assert.ok(late.every(e => e.jobId === job.id && e.actorName && e.commandId))
  const techTimeline = await timeline(b.priyaPerson.cookie)
  assert.deepEqual(techTimeline.map(e => e.id), early.filter(e => ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)).map(e => e.id), 'the assigned technician still reads the complete field-event history')
  checkTimeline(techTimeline, fieldEvents)
  assert.ok(early.some(e => e.kind === 'report.created'), 'FIELD-003 also keeps the desk-only service report event')
  const other = await h.person('Tara Other', 'technician')
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404, 'other technicians do not')

  for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie]) {
    checkTimeline(await timeline(as), expected)
    const data = await download(as)
    const complete = serviceHistory(data)
    checkTimeline(complete, downloadExpected)
    assert.deepEqual(complete, earlyDownload, 'all native service actions survive, including the quote steps before the job existed')
    const kept = exportedEvents(data.timeline.filter(e => e.job_id === job.id))
    checkTimeline(kept, expected)
    assert.deepEqual(kept, early, 'the business download retains every step, description, sequence and changed-record detail')
  }
  for (const as of [b.priyaPerson.cookie, other.cookie]) assert.equal((await h.request('/api/glove/export', { as })).status, 403, 'field access never grants a whole-business download')

  // A second populated branch makes exclusion meaningful on both read doors.
  const branch = await h.command('branch.save', { name: 'Phoenix', prefix: 'PHX', timezone: 'America/Phoenix', zips: ['85001'] })
  const branchCustomer = await h.command('customer.save', { name: 'synthetic-glove-branch-customer' })
  const branchSite = await h.command('site.save', { customerId: branchCustomer.id, address: '1 Central Ave, Phoenix AZ 85001', branchId: branch.id })
  const branchAt = '2026-10-20T02:00:00.000Z', branchCommand = 'synthetic-glove-branch-job'
  await clock(branchAt)
  const branchJob = await b.office.run('job.create', { customerId: branchCustomer.id, siteId: branchSite.id, title: 'synthetic-glove-branch-job' }, { commandId: branchCommand })
  const branchFact = { kind: 'job.created', subjectKind: 'job', subjectId: branchJob.id, jobId: branchJob.id, actorId: office.id, actorName: office.name, actorRole: office.role, commandId: branchCommand, at: branchAt }
  const branchTimeline = async as => {
    const response = await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as })
    assert.equal(response.status, 200)
    const events = (await response.json()).events
    assert.equal(events.length, 1)
    for (const [key, value] of Object.entries(branchFact)) assert.equal(events[0][key], value)
    return events
  }
  const domain = async () => { const { exportedAt: _time, ...records } = await download(h.owner()); return records }
  await h.command('branch.limit', { operatorId: b.office.id, branchId: 'main' })
  const beforeMainReads = await domain()
  checkTimeline(await timeline(b.office.cookie), expected)
  assert.equal((await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as: b.office.cookie })).status, 404)
  const mainDownload = await download(b.office.cookie)
  checkTimeline(exportedEvents(mainDownload.timeline.filter(e => e.job_id === job.id)), expected)
  checkTimeline(serviceHistory(mainDownload), downloadExpected)
  assert.deepEqual(serviceHistory(mainDownload), earlyDownload, 'the current main-branch Office download retains the independently expected pre-job quote actions as well as every job step')
  assert.ok(!mainDownload.timeline.some(e => e.job_id === branchJob.id))
  assert.ok(!mainDownload.jobs.some(j => j.id === branchJob.id))
  assert.deepEqual(await domain(), beforeMainReads, 'allowed and refused main-branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  const beforeBranchReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.office.cookie })).status, 404, 'the same session immediately loses its old branch')
  const branchEvents = await branchTimeline(b.office.cookie)
  const branchDownload = await download(b.office.cookie)
  const branchKept = exportedEvents(branchDownload.timeline.filter(e => e.job_id === branchJob.id))
  checkTimeline(branchKept, [{ ...branchFact, changes: [change('jobs', branchJob.id, null, 1, 'title')] }])
  assert.deepEqual(branchKept, branchEvents)
  assert.ok(!branchDownload.timeline.some(e => e.job_id === job.id))
  assert.ok(!branchDownload.jobs.some(j => j.id === job.id))
  assert.deepEqual(await domain(), beforeBranchReads, 'allowed and refused other-branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.priyaPerson.id, branchId: branch.id })
  const beforeFieldBranchReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.priyaPerson.cookie })).status, 404, 'assignment history does not override the technician’s current branch limit')
  assert.equal((await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as: b.priyaPerson.cookie })).status, 404, 'a matching branch does not grant an unassigned job')
  assert.deepEqual(await domain(), beforeFieldBranchReads, 'refused technician branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.priyaPerson.id, branchId: null })
  checkTimeline(await timeline(b.priyaPerson.cookie), fieldEvents)
  await h.command('branch.limit', { operatorId: b.office.id, branchId: null })
  checkTimeline(await timeline(b.office.cookie), expected)
  await h.command('role.set', { operatorId: b.office.id, role: 'technician' })
  const beforeWithdrawnReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.office.cookie })).status, 404, 'withdrawn desk authority cannot read the former timeline')
  assert.equal((await h.request('/api/glove/export', { as: b.office.cookie })).status, 403)
  assert.deepEqual(await domain(), beforeWithdrawnReads, 'refused reads after role withdrawal change nothing')
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })

  // Public downloads contain the domain records, so compare complete snapshots
  // around repeated successful and refused reads without test-only SQL access.
  const { exportedAt: _beforeTime, ...beforeReads } = await download(h.owner())
  for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie]) {
    checkTimeline(await timeline(as), expected)
    await download(as)
  }
  checkTimeline(await timeline(b.priyaPerson.cookie), fieldEvents)
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404)
  const { exportedAt: _afterTime, ...afterReads } = await download(h.owner())
  assert.deepEqual(afterReads, beforeReads, 'successful and refused timeline and download reads change no domain record or event')
  const fixture = await branchActivityHistory(h)
  const { reader, branchA, branchB, jobA, jobB, at, commandId } = fixture
  const traverse = async (managementEvents = 0) => {
    const initial = await reader.state()
    assert.equal(initial.events.length, managementEvents, 'the initial B window has no visible work; only later authority changes may appear')
    assert.ok(initial.events.every(e => e.kind === 'branch.limited' && e.subjectId === reader.id))
    assert.ok(initial.activityNext > 1, 'an empty visible window retains its installation sequence cursor')
    let next = initial.activityNext, empty = 0
    const seen = new Set()
    while (next !== null) {
      assert.ok(!seen.has(next), 'each cursor advances without looping on an empty page')
      seen.add(next)
      const response = await h.request(`/api/glove/activity?before=${next}`, { as: reader.cookie })
      assert.equal(response.status, 200)
      const page = await response.json()
      assert.ok(page.events.every(e => e.jobId !== jobB.id), 'B remains hidden on every page')
      assert.ok(page.next === null || page.next < next, 'sequence traversal moves backwards')
      if (page.events.length) {
        assert.ok(empty >= 2, 'multiple empty filtered pages were crossed')
        assert.equal(page.events.length, 1, 'the first visible page reaches exactly A’s event')
        const event = page.events[0]
        assert.deepEqual(metadata(event), { kind: 'job.created', subjectKind: 'job', subjectId: jobA.id, jobId: jobA.id, actorId: reader.id, actorName: reader.name, actorRole: 'office', commandId, at })
        assert.deepEqual(event.recordChanges.map(({ kind, id, fromVersion, toVersion }) => ({ kind, id, fromVersion, toVersion })), [{ kind: 'branches', id: branchA.id, fromVersion: 1, toVersion: 2 }, { kind: 'jobs', id: jobA.id, fromVersion: null, toVersion: 1 }])
        assert.ok(event.recordChanges.find(r => r.kind === 'jobs' && r.id === jobA.id).fields.includes('title'))
        return { event, before: next }
      }
      empty++
      next = page.next
    }
    assert.fail('A’s retained event must be reachable through the authenticated Activity door')
  }
  const beforeActivityReads = await domain()
  const reached = await traverse()
  assert.deepEqual(await domain(), beforeActivityReads, 'empty-page traversal has no read-side mutation')
  await h.restart()
  assert.deepEqual(await traverse(), reached, 'the exact sequence, actor, time and record metadata survive Worker restart')
  assert.deepEqual(await domain(), beforeActivityReads, 'restart and repeated reads preserve the business records and timeline')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branchB.id })
  const beforeWithdrawnActivity = await domain()
  const withdrawnResponse = await h.request(`/api/glove/activity?before=${reached.before}`, { as: reader.cookie })
  assert.equal(withdrawnResponse.status, 200)
  const withdrawn = await withdrawnResponse.json()
  assert.ok(!withdrawn.events.some(e => e.jobId === jobA.id), 'the old cursor grants no A history after branch withdrawal')
  assert.ok(withdrawn.events.some(e => e.jobId === jobB.id), 'the same saved cursor serves the reader’s newly permitted B work')
  assert.ok(withdrawn.events.every(e => !e.recordChanges.some(r => r.kind === 'jobs' && r.id === jobA.id)), 'withdrawn A record metadata is also absent')
  assert.ok(!(await reader.state()).events.some(e => e.jobId === jobA.id))
  assert.equal((await h.request(`/api/glove/activity?before=${reached.before}`, { as: '' })).status, 401, 'a saved cursor grants no signed-out access')
  assert.deepEqual(await domain(), beforeWithdrawnActivity, 'successful and refused reads after branch withdrawal change no record or event')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branchA.id })
  assert.deepEqual((await traverse(2)).event, reached.event, 'restoring branch access reaches the same retained event')
  t.diagnostic('PROBE DATA-009 point 5: empty initial branch window and multiple empty Activity pages -> exactly A event with actor, time and changed-record metadata; B hidden, withdrawal refused, restart retained, reads unchanged')
  t.diagnostic(`PROBE GLOVE-12 point 1: native commands, 510 unrelated changes and Worker restart -> ${expected.length} exact ordered steps; historical roles, current desk and assigned field access, unrelated and branch refusals; reads unchanged`)
  t.diagnostic(`PROBE GLOVE-12 point 2: Owner and Office business downloads -> ${downloadExpected.length} independently expected service entries, including all ${expected.length} job steps, with affected records, plus current branch and role boundaries`)
})
