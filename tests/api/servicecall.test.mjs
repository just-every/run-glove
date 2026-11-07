// BOOK-005 service calls booked without a quote (by the dispatcher or the office), through the command, state,
// timeline and export doors: a phoned-in request becomes a job with a
// diagnostic fee, the technician adds approved work on site, and the invoice
// carries exactly the fee, the added lines and the recorded materials.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, id } from './harness.mjs'

test('BOOK-005 desk creation retains request linkage, exact lines and frozen service checklists and forms under current authority', async t => {
  const at = '2026-10-21T12:00:00.000Z'
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h)
  const owner = (await h.state()).actor
  const people = [
    { ...owner, run: h.command, state: h.state },
    { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher', run: b.dispatcher.run, state: b.dispatcher.state },
    { id: b.office.id, name: 'Olu Office', role: 'office', run: b.office.run, state: b.office.state },
  ]
  const fee = await h.command('service.save', { code: 'synthetic-glove-501', name: 'Diagnostic visit', unitPrice: '89.00', unitCost: '11.00', tax: 'GST', checklist: [
    { label: 'Ask about previous leaks', required: false }, { label: 'Isolate the heater', required: true },
  ] })
  const inspection = await h.command('service.save', { code: 'synthetic-glove-502', name: 'Safety inspection', unitPrice: '160.00', unitCost: '50.00', tax: 'FREE', checklist: [
    { label: 'Check relief valve', required: true }, { label: 'Photograph installation', required: false },
  ] })
  const questions = [
    { id: 'safe', label: 'Safe to work?', type: 'yesno', required: true },
    { id: 'reason', label: 'Hazard', type: 'choice', required: true, options: ['Leak', 'Electrical'], showIf: { questionId: 'safe', equals: false } },
    { id: 'pressure', label: 'Water pressure', type: 'reading', required: false, unit: 'psi', min: '40', max: '80' },
  ]
  const safety = await h.command('form.save', { name: 'Heater safety', serviceIds: [fee.id, inspection.id], questions })
  const notes = await h.command('form.save', { name: 'Inspection notes', serviceIds: [inspection.id], questions: [
    { id: 'notes', label: 'Findings', type: 'notes', required: false },
  ] })
  await h.command('form.save', { name: 'Unrelated form', serviceIds: [b.service.id], questions: [{ id: 'other', label: 'Other work', type: 'notes' }] })
  await h.command('form.save', { name: 'Retired inspection', serviceIds: [fee.id], archived: true, questions: [{ id: 'retired', label: 'Old question', type: 'notes' }] })
  const secondSite = await h.command('site.save', { customerId: b.customer.id, address: '21 Synthetic Street', accessNotes: 'Side gate' })
  const otherCustomer = await h.command('customer.save', { name: 'synthetic-glove-503' })
  const otherSite = await h.command('site.save', { customerId: otherCustomer.id, address: '99 Synthetic Street' })
  const supplied = [
    { serviceId: fee.id, description: 'Two diagnostic visits', quantity: '2', unitPrice: '89.00' },
    { description: 'Custom access work', quantity: '1.5', unitPrice: '12.40', tax: 'FREE' },
    { serviceId: inspection.id, description: 'Quarter inspection', quantity: '0.25', unitPrice: '160.00' },
  ]
  const expectedLines = [
    { serviceId: fee.id, description: 'Two diagnostic visits', quantity: '2', unitPrice: '89.00', tax: 'GST', total: '178.00', unitCost: '11.00' },
    { serviceId: null, description: 'Custom access work', quantity: '1.5', unitPrice: '12.40', tax: 'FREE', total: '18.60' },
    { serviceId: inspection.id, description: 'Quarter inspection', quantity: '0.25', unitPrice: '160.00', tax: 'FREE', total: '40.00', unitCost: '50.00' },
  ]
  const expectedChecklist = [
    { label: 'Ask about previous leaks', required: false }, { label: 'Isolate the heater', required: true },
    { label: 'Check relief valve', required: true }, { label: 'Photograph installation', required: false },
  ]
  const expectedForms = [
    { formId: safety.id, formVersion: 1, name: 'Heater safety', equipmentId: null, questions },
    { formId: notes.id, formVersion: 1, name: 'Inspection notes', equipmentId: null, questions: [{ id: 'notes', label: 'Findings', type: 'notes', required: false }] },
  ].sort((a, b) => a.formId.localeCompare(b.formId))
  const retained = [], itemIds = new Set()
  // Every native desk role uses both entry points, with empty and mixed lines.
  for (const person of people) for (const fromRequest of [true, false]) for (const priced of [false, true]) {
    const request = fromRequest ? await person.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Heater inspection requested' }) : null
    // An explicitly selected second site must be honored without losing the request link.
    const siteId = priced ? secondSite.id : b.site.id
    const payload = { ...(request ? { enquiryId: request.id } : { customerId: b.customer.id }), ...(request && !priced ? {} : { siteId }), title: `${person.role} heater inspection`, ...(priced ? { lines: supplied } : fromRequest ? { lines: [] } : {}) }
    const commandId = id(), job = await person.run('job.create', payload, { commandId })
    const expected = { person, request, payload, commandId, job, priced, siteId }
    retained.push(expected)
    assert.deepEqual([job.customerId, job.siteId, job.quoteId, job.quoteRevision, job.serviceCall], [b.customer.id, siteId, null, null, { enquiryId: request?.id ?? null, by: { id: person.id, name: person.name, role: person.role }, at }])
    assert.deepEqual(job.lines, priced ? expectedLines : [])
    assert.deepEqual(job.totals, priced ? { subtotal: '236.60', gst: '17.80', total: '254.40' } : { subtotal: '0.00', gst: '0.00', total: '0.00' })
    assert.deepEqual(job.checklist.map(({ id: _id, ...item }) => item), priced ? expectedChecklist : [])
    assert.deepEqual(job.forms.map(({ id: _id, ...form }) => form).sort((a, b) => a.formId.localeCompare(b.formId)), priced ? expectedForms : [])
    for (const item of [...job.checklist, ...job.forms]) {
      assert.ok(item.id && !itemIds.has(item.id), 'each job owns distinct checklist and form copies')
      itemIds.add(item.id)
    }
    const view = await person.state()
    assert.deepEqual(view.jobs.find(j => j.id === job.id), job)
    if (request) {
      const won = view.enquiries.find(e => e.id === request.id)
      assert.deepEqual(won, { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
    }
    assert.deepEqual(await person.run('job.create', payload, { commandId }), job, 'a repeated command returns its original job')
    assert.equal((await h.state()).jobs.filter(j => j.id === job.id).length, 1)
  }

  const snapshot = async () => {
    const response = await h.request('/api/glove/export'); assert.equal(response.status, 200)
    const { exportedAt: _time, ...kept } = await response.json()
    return kept
  }
  const refused = async (person, payload, error, options = {}) => {
    const before = await snapshot()
    await person.run('job.create', payload, { error, ...options })
    assert.deepEqual(await snapshot(), before, 'refusal changes no business record or timeline event')
  }
  const open = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Open request' })
  let closed = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Closed request' })
  closed = await h.command('enquiry.close', { enquiryId: closed.id, version: closed.version, reason: 'Customer cancelled' })
  for (const person of people) {
    await refused(person, { customerId: b.customer.id, siteId: otherSite.id, title: 'Wrong site' }, 'SITE')
    await refused(person, { enquiryId: open.id, siteId: otherSite.id, title: 'Wrong request site' }, 'SITE')
    await refused(person, { enquiryId: open.id, customerId: otherCustomer.id, siteId: otherSite.id, title: 'Wrong request customer' }, 'ENQUIRY')
    await refused(person, { enquiryId: closed.id, title: 'Closed request' }, 'ENQUIRY_STATE')
    await refused(person, retained.find(r => r.person.id === person.id && r.request).payload, 'ENQUIRY_STATE')
  }
  const viewer = await h.person('Synthetic viewer', 'viewer'), subcontractor = await h.person('Synthetic subcontractor', 'subcontractor')
  for (const person of [b.agent, b.priyaPerson, viewer, subcontractor]) for (const fromRequest of [true, false]) {
    await refused(person, { ...(fromRequest ? { enquiryId: open.id } : { customerId: b.customer.id, siteId: b.site.id }), title: 'Not permitted', lines: supplied }, 'FORBIDDEN')
  }
  // Office service-call permission does not confer accepted-quote authority.
  const quote = await acceptedQuote(h, b, 'Dispatcher quoted work')
  await refused(b.office, { quoteId: quote.id }, 'FORBIDDEN')
  const dispatcherJob = await b.dispatcher.run('job.create', { quoteId: quote.id }, { commandId: 'synthetic-glove-504' })
  const ownerQuote = await acceptedQuote(h, b, 'Owner quoted work')
  await refused(b.office, { quoteId: ownerQuote.id }, 'FORBIDDEN')
  const ownerJob = await h.command('job.create', { quoteId: ownerQuote.id }, { commandId: 'synthetic-glove-505' })
  for (const [q, job] of [[quote, dispatcherJob], [ownerQuote, ownerJob]]) {
    const s = await h.state()
    assert.deepEqual([s.quotes.find(x => x.id === q.id).jobId, s.jobs.find(x => x.id === job.id).quoteId, job.quoteRevision], [job.id, q.id, 1])
  }
  // Catalog and form changes affect new work, never the copies already promised.
  await h.command('service.save', { ...fee, unitPrice: '999.00', unitCost: '99.00', checklist: [{ label: 'New procedure', required: true }] })
  await h.command('service.save', { ...inspection, unitPrice: '240.00', checklist: [] })
  await h.command('form.save', { ...safety, name: 'Updated safety', serviceIds: [], questions: [{ id: 'new', label: 'New question', type: 'notes', required: true }] })
  await h.command('form.save', { ...notes, archived: true, questions: [{ id: 'changed', label: 'Changed findings', type: 'notes' }] })
  const updated = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'New catalog work', lines: [{ serviceId: fee.id, description: 'Updated diagnostic visit', quantity: '1', unitPrice: '999.00' }] })
  assert.deepEqual(updated.checklist.map(({ id: _id, ...item }) => item), [{ label: 'New procedure', required: true }])
  assert.deepEqual(updated.forms, [])
  const beforeRestart = await snapshot()
  await h.restart()
  assert.deepEqual(await snapshot(), beforeRestart, 'actual Worker replacement retains the complete business export')
  for (const person of people) {
    const s = await person.state()
    for (const { job, request, payload, commandId, person: creator } of retained) {
      assert.deepEqual(s.jobs.find(j => j.id === job.id), job, 'line values and ordered checklist and form copies survive edits and restart')
      if (request) assert.deepEqual(s.enquiries.find(e => e.id === request.id), { ...request, version: request.version + 1, status: 'won', stageAt: at, wonAt: at, wonJobId: job.id })
      if (creator.id === person.id) assert.deepEqual(await person.run('job.create', payload, { commandId }), job)
    }
  }
  assert.deepEqual(await snapshot(), beforeRestart, 'reads and durable replay write nothing')
  const activityResponse = await h.request('/api/glove/activity'); assert.equal(activityResponse.status, 200)
  const activity = (await activityResponse.json()).events, exported = await snapshot()
  for (const { person, commandId, job, request } of [...retained, { person: people[1], commandId: 'synthetic-glove-504', job: dispatcherJob }, { person: people[0], commandId: 'synthetic-glove-505', job: ownerJob }]) {
    const events = activity.filter(e => e.commandId === commandId && e.kind === 'job.created')
    assert.equal(events.length, 1, 'creation and its replays retain just one attributable event')
    const event = events[0]
    assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId, event.subjectId], [person.id, person.name, person.role, at, job.id, job.id])
    const kept = exported.timeline.filter(e => e.command_id === commandId && e.kind === 'job.created')
    assert.equal(kept.length, 1)
    assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].job_id, kept[0].subject_id], [person.id, person.name, person.role, at, job.id, job.id])
    if (job.serviceCall) {
      assert.ok(event.summary.includes('created as a service call without a quote'))
      const data = JSON.parse(kept[0].data)
      assert.deepEqual([data.serviceCall, data.enquiryId], [true, request?.id ?? null])
    }
  }
  // Current authority also fences saved outcomes, signed-out calls and revoked sessions.
  const officeSaved = retained.find(r => r.person.role === 'office')
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await refused(b.office, officeSaved.payload, 'FORBIDDEN', { commandId: officeSaved.commandId })
  await refused(b.office, { enquiryId: open.id, title: 'After role withdrawal' }, 'FORBIDDEN')
  for (const as of ['', b.dispatcher.cookie]) {
    if (as) assert.equal((await h.request('/auth/session/revoke', { method: 'POST', body: { sessionId: b.dispatcher.session.id } })).status, 204)
    const before = await snapshot()
    const response = await h.request('/api/glove/commands', { as, method: 'POST', body: { commandId: id(), type: 'job.create', payload: { enquiryId: open.id, title: 'No current session' } } })
    assert.equal(response.status, 401)
    assert.deepEqual(await snapshot(), before)
  }
  const personalRequest = await h.command('enquiry.create', { customerId: otherCustomer.id, siteId: otherSite.id, description: 'Private heater request' })
  const personalPayload = { enquiryId: personalRequest.id, title: 'Private heater work', lines: [{ description: 'Private access instructions', quantity: '1', unitPrice: '10.00', tax: 'FREE' }] }
  const personalJob = await h.command('job.create', personalPayload, { commandId: 'synthetic-glove-506' })
  const customer = (await h.state()).customers.find(c => c.id === otherCustomer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  const erased = await snapshot()
  await h.command('job.create', personalPayload, { commandId: 'synthetic-glove-506', error: 'ERASED' })
  await h.command('job.create', { customerId: customer.id, siteId: otherSite.id, title: 'After erasure' }, { error: 'ERASED' })
  assert.deepEqual(await snapshot(), erased, 'neither a saved outcome nor new creation resurrects erased work')
  await h.restart()
  assert.deepEqual(await snapshot(), erased)
  const anonymous = (await h.state()).jobs.find(j => j.id === personalJob.id)
  assert.ok(anonymous.erasedAt)
  for (const value of ['Private heater request', 'Private heater work', 'Private access instructions']) assert.ok(!JSON.stringify(erased).includes(value))
})

test('BOOK-005 a leaking water heater: a job with an $89.00 diagnostic fee, a flat-rate valve and 1.5 hours added on site, invoiced exactly', async (t) => {
  const h = await installation({ at: '2026-10-21T12:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const diag = await h.command('service.save', { code: 'DIAG', name: 'Diagnostic fee', unit: 'call', unitCost: '0.00', unitPrice: '89.00', tax: 'GST' })
  const valve = await h.command('service.save', { code: 'TPR-VALVE', name: 'T&P relief valve', kind: 'material', unit: 'each', unitCost: '22.00', unitPrice: '48.00', tax: 'GST' })
  const replace = await h.command('service.save', { code: 'VALVE-FR', name: 'Valve replacement (flat rate)', kind: 'task', unit: 'job', unitPrice: '285.00', components: [{ serviceId: valve.id, quantity: '1' }], tax: 'GST' })
  const labor = await h.command('service.save', { code: 'LAB-HR', name: 'Plumbing labor', unit: 'hour', unitCost: '45.00', unitPrice: '120.00', tax: 'GST' })
  const tape = await h.command('service.save', { code: 'PTFE', name: 'Thread seal tape', kind: 'material', unit: 'roll', unitCost: '1.00', unitPrice: '4.00', tax: 'GST' })

  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Water heater leaking from the relief valve' })
  assert.deepEqual([request.source, request.description], ['phone', 'Water heater leaking from the relief valve'])
  await b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }], siteId: (await h.command('site.save', { customerId: (await h.command('customer.save', { name: 'Someone else' })).id, address: '9 Other St' })).id }, { error: 'SITE' })
  const job = await b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }] })
  assert.equal(job.quoteId, null)
  assert.deepEqual(job.lines.map(l => [l.serviceId, l.quantity, l.unitPrice]), [[diag.id, '1', '89.00']])
  assert.deepEqual([job.totals.total, job.serviceCall.enquiryId], ['97.90', request.id])
  assert.equal((await h.state()).enquiries.find(e => e.id === request.id).status, 'won')
  const timeline = async () => (await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()).events.map(e => e.summary)
  assert.ok((await timeline()).some(s => s.includes('service call without a quote') && s.includes('no price is approved until its invoice is')))

  // Booked for today; on site the technician adds the flat-rate valve and 1.5 hours with the customer's approval.
  const today = '2026-10-21'
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: today, start: '23:00', end: '23:45' })
  assert.deepEqual([visit.jobId, visit.technicianId, visit.local.date, visit.status], [job.id, b.priya.id, today, 'booked'])
  const now = '2026-10-21T12:00:00.000Z'
  let minute = 1
  const tick = async () => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: new Date(Date.parse(now) + minute++ * 60_000).toISOString() } })).status, 200)
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: now })
  const add = async (serviceId, quantity, approval = { customerName: 'Dr Mei Lin', method: 'signed' }) => {
    await tick()
    return b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId, quantity, approval })
  }
  // A material uses its own capture door, even when the customer approves it.
  const beforeMaterialLine = await h.state()
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: tape.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'INPUT' })
  const afterMaterialLine = await h.state()
  assert.deepEqual(afterMaterialLine.captures, beforeMaterialLine.captures, 'a refused material line saves no capture')
  assert.deepEqual(afterMaterialLine.visits, beforeMaterialLine.visits, 'a refused material line leaves the visit unchanged')
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: replace.id, quantity: '1', approval: { customerName: '', method: 'signed' } }, { error: 'INPUT' })
  await add(replace.id, '1')
  await add(labor.id, '1.5', { customerName: 'Dr Mei Lin', method: 'verbal' })
  await tick()
  const material = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'material', serviceId: tape.id, quantity: '1' })
  assert.deepEqual([material.kind, material.serviceId, material.quantity], ['material', tape.id, '1'])
  const seen = await b.priyaPerson.state()
  assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'line').map(x => [x.serviceId, x.quantity, x.approval]), [
    [replace.id, '1', { customerName: 'Dr Mei Lin', method: 'signed' }],
    [labor.id, '1.5', { customerName: 'Dr Mei Lin', method: 'verbal' }],
  ])
  assert.deepEqual(seen.captures.filter(x => x.visitId === visit.id && x.kind === 'material').map(x => x.id), [material.id])
  assert.ok(seen.jobs.find(j => j.id === job.id).lines.every(l => l.unitPrice === undefined), 'the technician reads no prices')
  assert.ok(seen.captures.filter(x => x.kind === 'line').every(x => x.unitPrice === undefined && x.approval.customerName === 'Dr Mei Lin'))
  // Added work on a quoted job is a change order, not this.
  const quoted = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const quotedVisit = await b.dispatcher.run('visit.book', { jobId: quoted.id, technicianId: b.priya.id, date: '2026-10-28', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.capture', { visitId: quotedVisit.id, deviceTime: now, kind: 'line', serviceId: labor.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'QUOTED' })
  // The office makes service calls too (here from the customer record, with no lines), but a job from an accepted quote stays the dispatcher's.
  const officeCall = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'No hot water' })
  assert.deepEqual([officeCall.quoteId, officeCall.serviceCall.enquiryId, officeCall.lines.length, officeCall.serviceCall.by.name], [null, null, 0, 'Olu Office'])
  await b.office.run('job.create', { quoteId: (await acceptedQuote(h, b)).id }, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: now, summary: 'Replaced the relief valve', signoff: { absentReason: 'Customer signed on the added work' } })
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'completed')

  // The invoice draft carries exactly the fee, both added lines and the recorded material; approved, it exports.
  const invoice = await b.office.run('invoice.prepare', { jobId: job.id })
  const rev = invoice.revisions[0]
  assert.deepEqual([invoice.status, rev.approval], ['draft', null])
  assert.deepEqual(rev.lines.map(l => [l.description, l.quantity, l.total]), [
    ['Diagnostic fee', '1', '89.00'],
    ['Valve replacement (flat rate) (added on site, approved by Dr Mei Lin)', '1', '285.00'],
    ['Plumbing labor (added on site, approved by Dr Mei Lin)', '1.5', '180.00'],
    ['Thread seal tape (used on site)', '1', '4.00'],
  ])
  assert.deepEqual(rev.totals, { subtotal: '558.00', gst: '55.80', total: '613.80' })
  const approved = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  assert.equal(approved.status, 'approved')
  assert.equal(approved.revisions[0].approval.id, b.office.id)
  await b.office.run('invoice.export', {})
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'invoiced')
})
