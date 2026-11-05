// AGENT-006 repeat-callback diagnosis through the command and callback doors,
// with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

test('AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits\' readings', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'agent-test', key: 'synthetic-glove-1' })
  const condenser = await b.office.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788', refrigerant: 'R-410A' })
  const furnace = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Furnace', make: 'Carrier' })
  await h.command('form.save', { name: 'Condenser check', equipmentTypes: ['AC condenser'], questions: [
    { id: 'suction', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
    { id: 'superheat', label: 'Superheat', type: 'reading', unit: '°F', min: '8', max: '12', required: true },
  ] })

  /** A completed visit on the condenser on `date` with its form readings. */
  const serviced = async (date, suction, superheat, extra) => {
    const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, `Condenser service ${date}`)).id, equipmentIds: [condenser.id] })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: `${date}T22:05:00Z` })
    const form = job.forms.find(f => f.equipmentId === condenser.id)
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: `${date}T22:10:00Z`, kind: 'form', formId: form.id, answers: { suction, superheat } })
    if (extra) await extra(visit)
    for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: `${date}T22:20:00Z`, kind: 'checklist', itemId: item.id, result: 'done' })
    await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: `${date}T23:00:00Z`, summary: `Serviced ${date}`, signoff: { absentReason: 'Customer out' } })
    return visit
  }
  const first = await serviced('2026-10-06', '118', '10')
  const second = await serviced('2026-10-13', '104', '15', visit => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-13T22:15:00Z', kind: 'refrigerant', equipmentId: condenser.id, added: '1.5', certification: '608-UNIV-0042' }))

  // The customer calls back: the office makes a service call about the condenser.
  const callback = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'No cooling again', equipmentIds: [condenser.id] })
  const other = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Furnace noise', equipmentIds: [furnace.id] })

  await t.test('AGENT-006 the callback uses the received-time window, survives restart and gathers both earlier visits', async (t) => {
    assert.deepEqual(callback.callback, { days: 30, equipment: [{ equipmentId: condenser.id, visitIds: [first.id, second.id] }] })
    assert.equal(other.callback, null, 'the furnace was never serviced, so that job is no callback')
    const timeline = await (await h.request(`/api/glove/jobs/${callback.id}/timeline`)).json()
    assert.ok(timeline.events.some(e => e.kind === 'job.callback' && /AC condenser Trane XR14 serviced in the last 30 days/.test(e.summary)))
    const { pack } = await (await h.request(`/api/glove/jobs/${callback.id}/callback`, { as: b.agent.cookie })).json()
    assert.deepEqual(pack.units[0].visits.map(v => [v.ref, v.date, v.readings.map(r => [r.ref, r.label, r.value, r.flagged])]), [
      ['V1', '2026-10-06', [['R1', 'Suction pressure', '118', false], ['R2', 'Superheat', '10', false]]],
      ['V2', '2026-10-13', [['R3', 'Suction pressure', '104', true], ['R4', 'Superheat', '15', true]]],
    ])
    assert.deepEqual(pack.units[0].visits[1].refrigerant, [{ type: 'R-410A', added: '1.5', recovered: '0' }])
    await b.agent.run('callback.prepare', { jobId: other.id }, { error: 'NOT_CALLBACK' })
    await receivedWindow(t)
  })

  await t.test('AGENT-006 the prepared checklist cites both visits\' readings, resolved from the records, and is labelled advisory', async () => {
    h.models.answer = () => ({
      checklist: [
        { step: 'Check for a refrigerant leak at the service valves', why: 'Suction fell from 118 to 104 psi in a week and superheat rose, after 1.5 lb was added', cites: ['R1', 'R3', 'R2', 'R4'] },
        { step: 'Inspect the evaporator coil for icing', why: 'High superheat on the second visit', cites: ['R4'] },
      ],
      parts: [{ part: 'R-410A refrigerant', quantity: '3 lb', reason: 'Recharge after the leak repair', cites: ['V2'] }],
    })
    const diagnosis = await b.agent.run('callback.prepare', { jobId: callback.id })
    const call = h.models.calls.at(-1)
    assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|02 9555/, 'no customer, contact or address goes to the model')
    assert.deepEqual(diagnosis.checklist[0].cites.map(r => [r.date, r.label, r.value, r.unit, r.flagged ?? null]), [
      ['2026-10-06', 'Suction pressure', '118', 'psi', false],
      ['2026-10-13', 'Suction pressure', '104', 'psi', true],
      ['2026-10-06', 'Superheat', '10', '°F', false],
      ['2026-10-13', 'Superheat', '15', '°F', true],
    ])
    assert.deepEqual(new Set(diagnosis.checklist[0].cites.map(r => r.visitId)), new Set([first.id, second.id]))
    assert.deepEqual(diagnosis.parts.map(p => [p.part, p.quantity, p.cites.map(r => r.visitId)]), [['R-410A refrigerant', '3 lb', [second.id]]])
    assert.match(diagnosis.advisory, /technician diagnoses and decides the work; this is not a safety certification/)
    assert.equal(diagnosis.preparedBy.role, 'agent')
  })

  await t.test('AGENT-006 a checklist citing what the pack does not hold is refused; the technician on the callback reads the checklist, another does not', async () => {
    h.models.answer = () => ({ checklist: [{ step: 'Replace the compressor', why: 'Guess', cites: ['R99'] }], parts: [] })
    await b.agent.run('callback.prepare', { jobId: callback.id }, { error: 'MODEL' })
    await b.priyaPerson.run('callback.prepare', { jobId: callback.id }, { error: 'FORBIDDEN' })
    await b.dispatcher.run('visit.book', { jobId: callback.id, technicianId: b.tom.id, date: '2026-10-21', start: '09:00', end: '10:00' })
    const seen = await (await h.request(`/api/glove/jobs/${callback.id}/callback`, { as: b.tomPerson.cookie })).json()
    assert.equal(seen.diagnoses.length, 1)
    assert.equal(seen.diagnoses[0].checklist[0].cites.length, 4)
    assert.equal((await h.request(`/api/glove/jobs/${callback.id}/callback`, { as: b.priyaPerson.cookie })).status, 404)
  })
})

/** Human-created work and genuine field completion, with only the runtime clock controlled. */
async function receivedWindow(t) {
  const h = await installation({ at: '2026-10-02T11:59:59.999Z' })
  t.after(() => h.close())
  const b = await business(h)
  const ownerEmail = (await (await h.request('/auth/session')).json()).operator.email
  const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
  let desk = b.dispatcher.cookie, field = b.priyaPerson.cookie, office = b.office.cookie
  const dispatch = (type, payload, opts = {}) => h.command(type, payload, { as: desk, ...opts })
  const technician = (type, payload, opts = {}) => h.command(type, payload, { as: field, ...opts })
  const secondSite = await h.command('site.save', { customerId: b.customer.id, address: '22 Synthetic Glove Street' })
  const unit = site => b.office.run('equipment.save', { siteId: site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'synthetic-glove-1' })
  // Deliberately identical nameplates: equipment identity, not a shared site or label, must match.
  const condenser = await unit(b.site), oldOnly = await unit(b.site), incompleteOnly = await unit(b.site)
  const unserviced = await unit(b.site), simultaneous = await unit(b.site), additional = await unit(b.site)
  const foreignServiced = await unit(secondSite), foreignUnserviced = await unit(secondSite)
  const quote = (site, title) => acceptedQuote(h, { ...b, site, dispatcher: { run: dispatch } }, title)
  let ordinal = 0
  const work = async (equipment, site = b.site, existingJob = null) => {
    const n = ++ordinal, date = `2026-09-${20 + n}`
    const job = existingJob ?? await dispatch('job.create', { quoteId: (await quote(site, `Synthetic Glove service ${n}`)).id, equipmentIds: [equipment.id] })
    const visit = await dispatch('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
    await technician('visit.arrive', { visitId: visit.id, deviceTime: `${date}T00:00:00.000Z` })
    for (const item of job.checklist.filter(i => i.required)) {
      await technician('visit.capture', { visitId: visit.id, deviceTime: `${date}T00:10:00.000Z`, kind: 'checklist', itemId: item.id, result: 'done' })
    }
    return { job, visit }
  }
  const finish = async (work, deviceTime, commandId) => {
    const payload = { visitId: work.visit.id, deviceTime, summary: 'Synthetic Glove completed service', signoff: { absentReason: 'Customer out' } }
    const visit = await technician('visit.complete', payload, { commandId })
    assert.equal(visit.status, 'completed')
    assert.equal(visit.completion.technicianId, b.priya.id)
    assert.equal(visit.completion.deviceTime, deviceTime)
    return { ...work, visit, payload, commandId }
  }
  const outsideWork = await work(condenser), oldWork = await work(oldOnly)
  const boundaryWork = await work(condenser), recentWork = await work(condenser)
  const incomplete = await work(incompleteOnly), sameTimeWork = await work(simultaneous)
  const foreignWork = await work(foreignServiced, secondSite)
  const additionalWork = await work(additional)
  const returnWork = await work(condenser, b.site, recentWork.job)

  const outside = await finish(outsideWork, '2026-10-31T12:00:00.000Z', 'synthetic-glove-completion-outside')
  const old = await finish(oldWork, '2026-10-31T12:00:00.000Z', 'synthetic-glove-completion-old')
  await h.setTime('2026-10-02T12:00:00.000Z')
  const boundary = await finish(boundaryWork, '2026-09-01T12:00:00.000Z', 'synthetic-glove-completion-boundary')
  assert.equal(outside.visit.completion.receivedAt, '2026-10-02T11:59:59.999Z')
  assert.equal(old.visit.completion.receivedAt, '2026-10-02T11:59:59.999Z')
  assert.equal(boundary.visit.completion.receivedAt, '2026-10-02T12:00:00.000Z')

  // Thirty days also outlives native sign-ins. Renew through mail confirmation, never seed sessions.
  await h.setTime('2026-10-31T12:00:00.000Z')
  await h.signIn(ownerEmail)
  desk = await h.signIn(b.dispatcher.session.operator.email)
  field = await h.signIn(b.priyaPerson.session.operator.email)
  office = await h.signIn(b.office.session.operator.email)
  const agentCookie = await h.signIn(b.agent.session.operator.email)
  const viewerCookie = await h.signIn(viewer.session.operator.email)
  const recent = await finish(recentWork, '2026-09-01T12:00:00.000Z', 'synthetic-glove-completion-recent')
  const foreign = await finish(foreignWork, '2026-10-31T11:00:00.000Z', 'synthetic-glove-completion-foreign')
  const additionalVisit = await finish(additionalWork, '2026-09-01T12:00:00.000Z', 'synthetic-glove-completion-additional')
  const returnVisit = await finish(returnWork, '2026-09-01T12:00:00.000Z', 'synthetic-glove-completion-return')
  assert.equal(returnVisit.visit.jobId, recent.visit.jobId, 'two genuine visits on one earlier job both remain eligible')
  assert.equal(recent.visit.completion.receivedAt, '2026-10-31T12:00:00.000Z')
  assert.equal(foreign.visit.completion.receivedAt, '2026-10-31T12:00:00.000Z')

  const createdAt = '2026-11-01T12:00:00.000Z'
  await h.setTime(createdAt)
  const sameTime = await finish(sameTimeWork, '2026-10-31T12:00:00.000Z', 'synthetic-glove-completion-same-time')
  assert.equal(sameTime.visit.completion.receivedAt, createdAt)
  const callback = { days: 30, equipment: [{ equipmentId: condenser.id, visitIds: [boundary.visit.id, recent.visit.id, returnVisit.visit.id] }] }
  const identities = flag => flag && { ...flag, equipment: flag.equipment.map(e => ({ ...e, visitIds: [...e.visitIds].sort() })) }
  const cases = [
    { name: 'matching unit on other jobs', site: b.site, units: [condenser, oldOnly, incompleteOnly, unserviced], expected: callback },
    { name: 'two qualifying units with repeated selection', site: b.site, units: [condenser, additional, unserviced, condenser], expected: { days: 30, equipment: [
      { equipmentId: condenser.id, visitIds: [boundary.visit.id, recent.visit.id, returnVisit.visit.id] },
      { equipmentId: additional.id, visitIds: [additionalVisit.visit.id] },
    ] } },
    { name: 'matching unit at its own second site', site: secondSite, units: [foreignServiced], expected: { days: 30, equipment: [{ equipmentId: foreignServiced.id, visitIds: [foreign.visit.id] }] } },
    { name: 'outside receipt despite recent device time', site: b.site, units: [oldOnly], expected: null },
    { name: 'arrived and checked but incomplete', site: b.site, units: [incompleteOnly], expected: null },
    { name: 'unrelated unit at the serviced site', site: b.site, units: [unserviced], expected: null },
    { name: 'unrelated unit at another serviced site', site: secondSite, units: [foreignUnserviced], expected: null },
    { name: 'no selected equipment at serviced site', site: b.site, units: [], expected: null },
    { name: 'completion must precede creation', site: b.site, units: [simultaneous], expected: null },
  ]
  const made = []
  for (const door of ['quote', 'service call']) {
    for (const row of cases) {
      const title = `Synthetic Glove ${door}: ${row.name}`
      const payload = { ...(door === 'quote' ? { quoteId: (await quote(row.site, title)).id } : { customerId: b.customer.id, siteId: row.site.id, title }), equipmentIds: row.units.map(e => e.id) }
      const commandId = `synthetic-glove-callback-${made.length + 1}`
      const as = door === 'quote' ? desk : office
      const job = await h.command('job.create', payload, { as, commandId })
      assert.equal(job.createdAt, createdAt)
      assert.deepEqual(identities(job.callback), identities(row.expected), `${door}: ${row.name}`)
      assert.ok([boundary, recent].every(w => w.visit.jobId !== job.id), 'only completions on other jobs qualify')
      made.push({ job, payload, as, commandId, expected: row.expected, person: door === 'quote' ? b.dispatcher : b.office, role: door === 'quote' ? 'dispatcher' : 'office' })
    }
  }
  // One millisecond later that genuinely completed visit becomes eligible on both creation doors.
  await h.setTime('2026-11-01T12:00:00.001Z')
  for (const door of ['quote', 'service call']) {
    const payload = { ...(door === 'quote' ? { quoteId: (await quote(b.site, 'Synthetic Glove later callback')).id } : { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic Glove later callback' }), equipmentIds: [simultaneous.id] }
    const as = door === 'quote' ? desk : office, commandId = `synthetic-glove-callback-${made.length + 1}`
    const job = await h.command('job.create', payload, { as, commandId })
    const expected = { days: 30, equipment: [{ equipmentId: simultaneous.id, visitIds: [sameTime.visit.id] }] }
    assert.deepEqual(job.callback, expected)
    made.push({ job, payload, as, commandId, expected, person: door === 'quote' ? b.dispatcher : b.office, role: door === 'quote' ? 'dispatcher' : 'office' })
  }

  const domain = async () => { const { exportedAt: _at, ...data } = await (await h.request('/api/glove/export')).json(); return data }
  // A serviced unit cannot be borrowed from another site to manufacture a callback.
  const wrongSiteQuote = await quote(b.site, 'Synthetic Glove wrong-site equipment')
  const beforeWrongSite = await domain()
  for (const payload of [
    { quoteId: wrongSiteQuote.id, equipmentIds: [condenser.id, foreignServiced.id] },
    { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic Glove wrong-site service call', equipmentIds: [condenser.id, foreignServiced.id] },
  ]) {
    await h.command('job.create', payload, { as: desk, error: 'EQUIPMENT' })
    assert.deepEqual(await domain(), beforeWrongSite, 'wrong-site equipment refuses the whole job without consuming its quote or creating any event')
  }
  const before = await domain()
  await h.restart()
  assert.deepEqual(await domain(), before, 'actual Worker restart retains jobs, completions and attributable history')
  for (const w of [outside, old, boundary, recent, foreign, additionalVisit, returnVisit, sameTime]) {
    assert.deepEqual(await technician('visit.complete', w.payload, { commandId: w.commandId }), w.visit, 'completion replay keeps its original receipt')
  }
  for (const row of made) {
    assert.deepEqual(await h.command('job.create', row.payload, { as: row.as, commandId: row.commandId }), row.job, 'job replay returns the original job and callback identities')
    if (row.payload.quoteId) await h.command('job.create', row.payload, { as: row.as, error: 'DUPLICATE' })
  }
  assert.deepEqual(await domain(), before, 'replay creates no second job, capture or callback event')
  assert.equal(before.visits.find(v => v.id === incomplete.visit.id).completion, null)
  assert.equal(before.visits.find(v => v.id === incomplete.visit.id).status, 'arrived')

  const activityResponse = await h.request('/api/glove/activity', { as: office })
  assert.equal(activityResponse.status, 200)
  const activity = (await activityResponse.json()).events
  const retained = await h.state(office)
  for (const row of made) {
    assert.deepEqual(retained.jobs.find(j => j.id === row.job.id), row.job)
    const callbackResponse = await h.request(`/api/glove/jobs/${row.job.id}/callback`, { as: office })
    assert.equal(callbackResponse.status, 200)
    const read = await callbackResponse.json()
    assert.deepEqual(identities(read.callback), identities(row.expected), 'the callback read door retains the exact receipt-qualified identities after restart')
    assert.deepEqual(read.pack?.units.map(u => u.equipment.id) ?? [], row.expected?.equipment.map(e => e.equipmentId) ?? [])
    const response = await h.request(`/api/glove/jobs/${row.job.id}/timeline`, { as: office })
    assert.equal(response.status, 200)
    const events = (await response.json()).events
    assert.deepEqual(events.map(e => e.kind), row.expected ? ['job.created', 'job.callback'] : ['job.created'])
    const saved = before.timeline.filter(e => e.job_id === row.job.id)
    assert.deepEqual(saved.map(e => e.kind), events.map(e => e.kind))
    for (const event of events) {
      assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.commandId, event.at, event.subjectKind, event.subjectId], [row.person.id, row.person.name, row.role, row.commandId, row.job.createdAt, 'job', row.job.id])
      const kept = saved.find(e => e.id === event.id)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.command_id, kept.at, kept.summary], [row.person.id, row.person.name, row.role, row.commandId, row.job.createdAt, event.summary])
      const seen = activity.find(e => e.id === event.id)
      assert.ok(seen, 'the office sees the retained job and callback in Activity')
      assert.deepEqual(seen, event)
      if (event.kind === 'job.callback') {
        const units = row.expected.equipment.map(() => 'AC condenser Trane XR14').join(', ')
        assert.equal(event.summary, `${row.job.number} is a callback: ${units} serviced in the last 30 days`)
        const { recordChanges: _changes, ...data } = JSON.parse(kept.data)
        assert.deepEqual(identities(data), identities(row.expected), 'the exported callback names exactly its equipment and qualifying visits')
      }
    }
  }

  const refusedPayload = { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic Glove refused callback', equipmentIds: [condenser.id] }
  for (const as of [field, agentCookie, viewerCookie]) {
    await h.command('job.create', refusedPayload, { as, error: 'FORBIDDEN' })
    await h.command('job.create', made[0].payload, { as, commandId: made[0].commandId, error: 'FORBIDDEN' })
  }
  await h.command('job.create', made[0].payload, { as: office, error: 'FORBIDDEN' })
  const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: 'synthetic-glove-signed-out', type: 'job.create', payload: refusedPayload } })
  assert.equal(signedOut.status, 401)
  assert.deepEqual(await domain(), before, 'excluded roles and signed-out attempts create nothing, even when replaying an allowed identity')

  // A late upload is received now: it qualifies future work, never a job made before receipt.
  const late = await finish(incomplete, '2026-09-01T12:00:00.000Z', 'synthetic-glove-completion-later')
  assert.equal(late.visit.completion.receivedAt, '2026-11-01T12:00:00.001Z')
  await h.setTime('2026-11-01T12:00:00.002Z')
  for (const door of ['quote', 'service call']) {
    const payload = { ...(door === 'quote' ? { quoteId: (await quote(b.site, 'Synthetic Glove after delayed completion')).id } : { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic Glove after delayed completion' }), equipmentIds: [incompleteOnly.id] }
    const job = await h.command('job.create', payload, { as: door === 'quote' ? desk : office })
    assert.deepEqual(job.callback, { days: 30, equipment: [{ equipmentId: incompleteOnly.id, visitIds: [incomplete.visit.id] }] })
  }
  const afterLate = await domain()
  await h.restart()
  assert.deepEqual(await domain(), afterLate)
  for (const row of made.filter(r => r.payload.equipmentIds.includes(incompleteOnly.id))) {
    assert.deepEqual(await h.command('job.create', row.payload, { as: row.as, commandId: row.commandId }), row.job)
    const read = await (await h.request(`/api/glove/jobs/${row.job.id}/callback`, { as: office })).json()
    assert.deepEqual(identities(read.callback), identities(row.expected), 'later receipt cannot retrospectively add a callback or a qualifying unit')
    assert.deepEqual(afterLate.jobs.find(j => j.id === row.job.id), row.job)
    assert.equal(afterLate.timeline.filter(e => e.job_id === row.job.id && e.kind === 'job.callback').length, row.expected ? 1 : 0)
  }
  assert.deepEqual(await domain(), afterLate, 'reading and replaying old jobs after late completion changes nothing')

  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
  const withdrawn = await domain()
  await dispatch('job.create', refusedPayload, { error: 'FORBIDDEN' })
  await dispatch('job.create', made[0].payload, { commandId: made[0].commandId, error: 'FORBIDDEN' })
  assert.deepEqual(await domain(), withdrawn, 'withdrawn creation authority cannot replay a former command or create a callback')
  t.diagnostic('PROBE AGENT-006 2: native quote and service-call job.create after real visit.complete -> exact 30-day receipt, multiple matching units and both visits on one earlier job included once; 30 days plus 1 ms, incomplete, unrelated units, other sites and simultaneous receipt excluded; wrong-site selection changes nothing; device-time disagreement ignored; exact callback reads, timeline, Activity and export survive Worker restart and replay; later completion qualifies only future jobs; excluded and withdrawn roles change nothing')
}
