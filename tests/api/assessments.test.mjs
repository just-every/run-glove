// BOOK-006 assessment visits on a request through the command, state, history
// and file doors: booked with conflict review, captured on the phone, completed,
// and carried into the quote drafted from the request.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { installation, business, acceptedQuote, completedJob } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('BOOK-006 assessment booking freezes selected forms and technician completion stays assessed after restart', async (t) => {
  const h = await installation({ at: '2026-11-16T03:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const form = await h.command('form.save', { name: 'Water heater survey', questions: [{ id: 'gallons', label: 'Tank size (gallons)', type: 'reading', unit: 'gal', min: '20', max: '100', required: true }, { id: 'vent', label: 'Venting', type: 'choice', options: ['atmospheric', 'power vent'], required: true }] })
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Replace a leaking 50-gallon water heater' })

  // Priya already has a visit at 10:00; the assessment overlapping it waits for review.
  const other = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  await b.dispatcher.run('visit.book', { jobId: other.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:00', end: '11:00' })
  const book = acknowledge => b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:30', end: '11:30', instructions: 'Measure the closet and check the venting', formIds: [form.id], acknowledge }, acknowledge ? {} : { error: 'CONFLICT_REVIEW' })
  await b.office.run('assessment.book', { enquiryId: request.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:30', end: '11:30' }, { error: 'FORBIDDEN' })
  const beforeReview = await h.state()
  const review = await book()
  assert.deepEqual(await h.state(), beforeReview, 'unreviewed overlap creates no assessment or visit')
  const { job, visit } = await book(review.details.conflicts.map(c => c.code))
  assert.deepEqual([job.kind, job.lines, job.forms.map(f => f.name), visit.technicianId], ['assessment', [], ['Water heater survey'], b.priya.id])
  assert.equal((await h.state()).enquiries.find(e => e.id === request.id).assessmentJobId, job.id)
  await b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.tom.id, date: '2026-10-23', start: '08:00', end: '09:00' }, { error: 'DUPLICATE' })

  // The assessment itself reserves its assessor's time for later bookings.
  const overlapping = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Later requested service call' })
  const overlap = { jobId: overlapping.id, technicianId: b.priya.id, date: '2026-10-22', start: '11:00', end: '12:00' }
  const beforeOverlap = await h.state()
  const blocked = await b.dispatcher.run('visit.book', overlap, { error: 'CONFLICT_REVIEW' })
  assert.deepEqual(await h.state(), beforeOverlap, 'an assessment blocks an unreviewed overlapping booking')
  assert.ok(blocked.details.conflicts.some(c => c.code === `overlap:${visit.id}`))
  const reviewed = await b.dispatcher.run('visit.book', { ...overlap, acknowledge: blocked.details.conflicts.map(c => c.code) })
  assert.deepEqual(reviewed.assignments[0].reviewedConflicts, blocked.details.conflicts)
  assert.equal(reviewed.technicianId, b.priya.id)

  // On the phone: arrival, two photos, a note and the form; then completion.
  const at = '2026-10-21T23:35:00Z', cap = payload => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, ...payload })
  assert.ok((await b.priyaPerson.state()).visits.some(v => v.id === visit.id), 'the assessment is on the assessor\'s phone')
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  const tank = await cap({ kind: 'photo', photo: { mediaType: 'image/png', base64: png }, caption: 'Rusted tank base' })
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-16T03:00:01.000Z' } })
  const original = await readFile('tests/fixtures/companycam-unit.jpg')
  const closet = await cap({ kind: 'photo', photo: { mediaType: 'image/jpeg', base64: original.toString('base64') }, caption: 'Closet, 30 in wide' })
  const note = await cap({ kind: 'note', text: 'Closet fits a 50-gallon; gas line needs a new shutoff' })
  const answers = await cap({ kind: 'form', formId: job.forms[0].id, answers: { gallons: '50', vent: 'atmospheric' } })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at, summary: 'Assessed for replacement', signoff: { absentReason: 'Tenant let us in' } })
  let s = await h.state()
  assert.equal(s.jobs.find(j => j.id === job.id).status, 'assessed')
  await b.office.run('invoice.prepare', { jobId: job.id }, { error: 'JOB_STATE' })

  // The quote drafted from the request carries the photos, the note and the form results.
  const quote = await b.dispatcher.run('quote.draft', { enquiryId: request.id, title: 'Water heater replacement', lines: [{ description: '50-gallon gas water heater, installed', quantity: '1', unitPrice: '2450.00' }] })
  assert.deepEqual([quote.assessment.number, quote.assessment.photos.map(p => p.caption), quote.assessment.notes, quote.assessment.forms.map(f => [f.name, f.answers.map(a => [a.questionId, a.value])])], [job.number, ['Rusted tank base', 'Closet, 30 in wide'], ['Closet fits a 50-gallon; gas line needs a new shutoff'], [['Water heater survey', [['gallons', '50'], ['vent', 'atmospheric']]]]])
  assert.deepEqual(quote.assessment, {
    jobId: job.id, number: job.number,
    notes: ['Closet fits a 50-gallon; gas line needs a new shutoff'],
    photos: [{ fileId: tank.file.fileId, caption: 'Rusted tank base' }, { fileId: closet.file.fileId, caption: 'Closet, 30 in wide' }],
    forms: [{ name: 'Water heater survey', answers: [
      { questionId: 'gallons', label: 'Tank size (gallons)', type: 'reading', value: '50', unit: 'gal', min: '20', max: '100', flagged: false },
      { questionId: 'vent', label: 'Venting', type: 'choice', value: 'atmospheric' },
    ] }],
  })
  for (const [photo, bytes, mediaType] of [[tank, Buffer.from(png, 'base64'), 'image/png'], [closet, original, 'image/jpeg']]) {
    for (const person of [b.dispatcher, b.office, b.priyaPerson]) {
      const file = await h.request(`/api/glove/files/${photo.file.fileId}`, { as: person.cookie })
      assert.equal(file.status, 200)
      assert.equal(file.headers.get('content-type'), mediaType)
      assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes, 'quote evidence retains the exact original upload')
    }
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: b.tomPerson.cookie })).status, 404)
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: '' })).status, 401)
  }
  await h.command('form.save', { id: form.id, version: form.version, name: 'Replaced library survey', questions: [{ id: 'replacement', label: 'Different question', type: 'notes', required: true }], archived: true })
  const frozen = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), frozen, 'assessment evidence and its quote survive an actual Worker restart')
  assert.deepEqual((await h.state()).quotes.find(q => q.id === quote.id).assessment, quote.assessment, 'library edits cannot rewrite the quote evidence')

  // Linked on the request, the quote and the customer's property history.
  s = await h.state()
  assert.deepEqual([s.enquiries.find(e => e.id === request.id).assessmentJobId, s.quotes.find(q => q.id === quote.id).assessment.jobId], [job.id, job.id])
  const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie })).json()
  assert.ok(history.entries.some(e => e.kind === 'job' && e.label === `${job.number} Assessment: Replace a leaking 50-gallon water heater` && e.status === 'assessed'))
  assert.ok(history.entries.some(e => e.kind === 'quote' && e.id === quote.id))
  for (const expected of [
    ['request', request.id, null, 'Request (phone): Replace a leaking 50-gallon water heater', 'quoted'],
    ['job', job.id, job.id, `${job.number} Assessment: Replace a leaking 50-gallon water heater`, 'assessed'],
    ['visit', visit.id, job.id, `${job.number} visit 2026-10-22 10:30–11:30`, 'completed'],
    ['quote', quote.id, null, `${quote.number} Water heater replacement`, 'draft'],
    ['photo', tank.id, job.id, `${job.number} Photo: Rusted tank base`, null],
    ['photo', closet.id, job.id, `${job.number} Photo: Closet, 30 in wide`, null],
    ['note', note.id, job.id, `${job.number} Closet fits a 50-gallon; gas line needs a new shutoff`, null],
    ['form', answers.id, job.id, `${job.number} Water heater survey`, null],
  ]) assert.deepEqual(history.entries.filter(e => e.kind === expected[0] && e.id === expected[1]).map(e => [e.kind, e.id, e.jobId, e.label, e.status]), [expected])
  const secondSite = await h.command('site.save', { customerId: b.customer.id, address: '19 Synthetic Road' })
  const otherHistory = await h.request(`/api/glove/sites/${secondSite.id}/history`, { as: b.office.cookie }).then(r => r.json())
  assert.deepEqual(otherHistory.entries, [], 'assessment history stays at its actual property')
  const beforeReads = await h.state()
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.deepEqual(exported.quotes.find(q => q.id === quote.id).assessment, quote.assessment)
  for (const [kind, commandId, actor, role] of [
    ['capture.photo', tank.id, b.priyaPerson, 'technician'],
    ['capture.photo', closet.id, b.priyaPerson, 'technician'],
    ['capture.note', note.id, b.priyaPerson, 'technician'],
    ['capture.form', answers.id, b.priyaPerson, 'technician'],
  ]) {
    const event = beforeReads.events.find(e => e.kind === kind && e.commandId === commandId)
    assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.jobId], [actor.id, actor.name, role, job.id])
    assert.ok(exported.timeline.some(e => e.id === event.id && e.command_id === commandId && e.actor_id === actor.id))
  }
  assert.deepEqual(await h.state(), beforeReads, 'history, originals and business reads make no domain changes')

  await qualifyAssessments(h, b)
})

async function qualifyAssessments(h, b) {
  const receivedAt = '2026-11-16T03:00:00.000Z'
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: receivedAt } })).status, 200)
  const owner = (await h.state()).actor
  const request = description => b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description })
  const definitions = Array.from({ length: 12 }, (_, i) => ({
    name: `synthetic-glove-${i + 1} survey`,
    questions: [
      { id: 'size', label: `Measured clearance ${i + 1}`, type: 'reading', unit: 'in', min: '20', max: '100', required: true },
      { id: 'vent', label: `Venting ${i + 1}`, type: 'choice', options: ['atmospheric', 'power vent'], required: true },
      { id: 'note', label: `Other findings ${i + 1}`, type: 'notes', required: false },
    ],
  }))
  const forms = []
  for (const definition of definitions) forms.push(await h.command('form.save', definition))
  const archived = await h.command('form.save', { ...definitions[11], id: forms[11].id, version: forms[11].version, archived: true })
  const open = await request('Assessment refusal qualification')
  const slot = { enquiryId: open.id, technicianId: b.priya.id, date: '2026-11-02', start: '09:15', end: '10:45', instructions: 'Measure before specifying replacement' }
  // Compare every visible domain collection and event, including numbering and
  // the request link, so an invalid booking cannot leave a partial job behind.
  const refuse = async (run, type, payload, error, opts = {}) => {
    const before = await h.state()
    await run(type, payload, { ...opts, error })
    assert.deepEqual(await h.state(), before, `${error} changes no domain record or event`)
  }
  await refuse(h.command, 'assessment.book', { ...slot, formIds: forms.slice(0, 11).map(f => f.id) }, 'INPUT')
  await refuse(h.command, 'assessment.book', { ...slot, formIds: forms[0].id }, 'INPUT')
  await refuse(h.command, 'assessment.book', { ...slot, formIds: [forms[0].id, archived.id] }, 'INPUT')
  for (const invalid of [{ end: '08:00' }, { date: '2026-02-30' }, { start: '25:00' }]) {
    await refuse(b.dispatcher.run, 'assessment.book', { ...slot, ...invalid }, 'TIME')
  }
  const viewer = await h.person('Vera Viewer', 'viewer')
  const subcontractor = await h.person('Seth Subcontractor', 'subcontractor')
  for (const person of [b.office, b.agent, b.priyaPerson, b.tomPerson, viewer, subcontractor]) {
    await refuse(person.run, 'assessment.book', slot, 'FORBIDDEN')
  }
  const lost = await request('Customer declined the assessment')
  await b.office.run('enquiry.close', { enquiryId: lost.id, version: lost.version, reason: 'Customer chose repair' })
  await refuse(h.command, 'assessment.book', { ...slot, enquiryId: lost.id }, 'ENQUIRY_STATE')
  const won = await request('Already booked as a service call')
  await b.office.run('job.create', { enquiryId: won.id, title: 'Repair existing heater' })
  await refuse(b.dispatcher.run, 'assessment.book', { ...slot, enquiryId: won.id }, 'ENQUIRY_STATE')

  const retained = [], expectedEvents = []
  const expectEvent = (kind, commandId, person, jobId, subjectId) => expectedEvents.push({ kind, commandId, actorId: person.id, actorName: person.name, actorRole: person.role, at: receivedAt, jobId, subjectId })
  const notificationCounts = () => [h.mails.length, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length]
  const beforeProviders = notificationCounts()
  // Every supported selection size is a real, separately booked request. The
  // reversed selection also proves the owner's selected copies stay in order.
  for (let count = 0; count <= 10; count++) {
    const enquiry = count === 0 ? open : await request(`Replacement with ${count} selected forms`)
    const indices = Array.from({ length: count }, (_, i) => 9 - i)
    const technician = count % 2 ? b.tom : b.priya
    const person = count % 2 ? b.tomPerson : b.priyaPerson
    const booker = count % 2 ? b.dispatcher : { ...owner, run: h.command }
    const date = `2026-11-${String(count + 2).padStart(2, '0')}`
    const utcDate = `2026-11-${String(count + 1).padStart(2, '0')}`
    const payload = { ...slot, enquiryId: enquiry.id, technicianId: technician.id, date, instructions: `Inspect clearance and venting; selection ${count}`, formIds: indices.map(i => forms[i].id) }
    const bookId = `synthetic-glove-assessment-book-${count}`
    const booked = await booker.run('assessment.book', payload, { commandId: bookId })
    const { job, visit } = booked
    assert.deepEqual([job.kind, job.enquiryId, job.customerId, job.siteId, job.instructions, job.lines, job.totals, job.status], ['assessment', enquiry.id, b.customer.id, b.site.id, payload.instructions, [], null, 'open'])
    assert.deepEqual(job.assessment, { by: { id: booker.id, name: booker.name, role: count % 2 ? 'dispatcher' : 'owner' }, at: receivedAt })
    assert.deepEqual([visit.jobId, visit.technicianId, visit.local, visit.startAt, visit.endAt, visit.status], [job.id, technician.id, { date, start: '09:15', end: '10:45', timezone: 'Australia/Sydney' }, `${utcDate}T22:15:00.000Z`, `${utcDate}T23:45:00.000Z`, 'booked'])
    const copies = indices.map((i, index) => ({ id: job.forms[index].id, formId: forms[i].id, formVersion: 1, name: definitions[i].name, questions: definitions[i].questions, equipmentId: null }))
    assert.deepEqual(job.forms, copies)
    assert.equal(new Set(job.forms.map(f => f.id)).size, count)
    for (const copy of job.forms) assert.notEqual(copy.id, copy.formId)
    assert.equal((await h.state()).enquiries.find(e => e.id === enquiry.id).assessmentJobId, job.id)
    expectEvent('assessment.created', bookId, { ...booker, role: count % 2 ? 'dispatcher' : 'owner' }, job.id, job.id)
    expectEvent('visit.booked', bookId, { ...booker, role: count % 2 ? 'dispatcher' : 'owner' }, job.id, visit.id)
    const beforeReplay = await h.state()
    assert.deepEqual(await booker.run('assessment.book', payload, { commandId: bookId }), booked)
    assert.deepEqual(await h.state(), beforeReplay)
    await refuse(booker.run, 'assessment.book', { ...payload, technicianId: count % 2 ? b.priya.id : b.tom.id }, 'DUPLICATE')
    await refuse(b.office.run, 'invoice.prepare', { jobId: job.id, progress: { name: 'Assessment fee', final: false }, lines: [{ description: 'Survey', quantity: '1', unitPrice: '10.00' }] }, 'PROGRESS_SCOPE')

    // The last booking still captures its frozen questions after the library
    // is edited and archived, just like the earlier bookings retained on disk.
    if (count === 10) for (const [i, form] of forms.slice(0, 10).entries()) await h.command('form.save', { id: form.id, version: form.version, name: `Updated survey ${i}`, questions: [{ id: 'new', label: 'Replacement question', type: 'notes', required: true }], archived: true })

    const completePayload = { visitId: visit.id, deviceTime: `${utcDate}T23:20:00.000Z`, summary: `Measured replacement ${count}`, signoff: { absentReason: 'Customer at work; assessment only' } }
    await refuse(person.run, 'visit.complete', completePayload, 'NO_ARRIVAL')
    await refuse(count % 2 ? b.priyaPerson.run : b.tomPerson.run, 'visit.arrive', { visitId: visit.id, deviceTime: `${utcDate}T22:20:00.000Z` }, 'FORBIDDEN')
    const arrivalId = `synthetic-glove-assessment-arrive-${count}`
    const arrivalPayload = { visitId: visit.id, deviceTime: `${utcDate}T22:20:00.000Z` }
    const arrival = await person.run('visit.arrive', arrivalPayload, { commandId: arrivalId })
    assert.deepEqual([arrival.id, arrival.jobId, arrival.visitId, arrival.technicianId, arrival.kind, arrival.deviceTime, arrival.receivedAt, arrival.late], [arrivalId, job.id, visit.id, technician.id, 'arrival', arrivalPayload.deviceTime, receivedAt, false])
    expectEvent('capture.arrival', arrivalId, { ...person, role: 'technician' }, job.id, arrivalId)
    const captures = []
    for (const [index, copy] of copies.entries()) {
      const capturePayload = { visitId: visit.id, deviceTime: `${utcDate}T22:35:00.000Z`, kind: 'form', formId: copy.id, answers: { size: '50', vent: 'atmospheric' } }
      await refuse(person.run, 'visit.capture', { ...capturePayload, answers: { size: '50' } }, 'FORM')
      const captureId = `synthetic-glove-assessment-form-${count}-${index}`
      const capture = await person.run('visit.capture', capturePayload, { commandId: captureId })
      assert.deepEqual([capture.id, capture.jobId, capture.visitId, capture.technicianId, capture.formId, capture.formName, capture.deviceTime, capture.receivedAt, capture.late, capture.answers], [captureId, job.id, visit.id, technician.id, copy.id, copy.name, capturePayload.deviceTime, receivedAt, false, [
        { questionId: 'size', label: copy.questions[0].label, type: 'reading', value: '50', unit: 'in', min: '20', max: '100', flagged: false },
        { questionId: 'vent', label: copy.questions[1].label, type: 'choice', value: 'atmospheric' },
      ]])
      captures.push({ capture, payload: capturePayload, commandId: captureId })
      expectEvent('capture.form', captureId, { ...person, role: 'technician' }, job.id, captureId)
    }
    const completionId = `synthetic-glove-assessment-complete-${count}`
    const completed = await person.run('visit.complete', completePayload, { commandId: completionId })
    assert.deepEqual([completed.id, completed.status, completed.arrival], [visit.id, 'completed', { technicianId: technician.id, deviceTime: arrivalPayload.deviceTime, receivedAt, captureId: arrivalId }])
    assert.deepEqual(completed.completion, { technicianId: technician.id, deviceTime: completePayload.deviceTime, receivedAt, summary: completePayload.summary, signoff: { customerPresent: false, absentReason: completePayload.signoff.absentReason }, jobComplete: true, findings: '', recommendations: [] })
    expectEvent('capture.completion', completionId, { ...person, role: 'technician' }, job.id, completionId)
    expectEvent('assessment.done', completionId, { ...person, role: 'technician' }, job.id, job.id)
    retained.push({ job, visit: completed, booked, payload, bookId, booker, person, arrival, arrivalPayload, arrivalId, captures, completePayload, completionId, copies })
  }
  const beforeRestart = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), beforeRestart, 'the actual Worker restarts with surviving D1')
  for (const record of retained) {
    const { job, visit, person, booker } = record
    const before = await h.state()
    const saved = before.jobs.find(j => j.id === job.id)
    assert.deepEqual(saved, { ...job, version: 2, status: 'assessed', assessedAt: receivedAt })
    assert.deepEqual(before.visits.find(v => v.id === visit.id), visit)
    assert.deepEqual(saved.forms, record.copies)
    assert.deepEqual(await booker.run('assessment.book', record.payload, { commandId: record.bookId }), record.booked)
    assert.deepEqual(await person.run('visit.arrive', record.arrivalPayload, { commandId: record.arrivalId }), record.arrival)
    for (const capture of record.captures) assert.deepEqual(await person.run('visit.capture', capture.payload, { commandId: capture.commandId }), capture.capture)
    assert.deepEqual(await person.run('visit.complete', record.completePayload, { commandId: record.completionId }), visit)
    assert.equal(before.captures.filter(c => c.visitId === visit.id && c.kind === 'completion')[0].id, record.completionId)
    assert.deepEqual(await h.state(), before, 'replay retains exact assessment, visit, capture and completion identities')
    await refuse(b.office.run, 'invoice.prepare', { jobId: job.id }, 'JOB_STATE')
    await refuse(b.office.run, 'invoice.prepare', { jobId: job.id, lines: [{ description: 'Survey', quantity: '1', unitPrice: '10.00' }] }, 'JOB_STATE')
  }
  const dashboard = await h.request('/api/glove/dashboard').then(r => r.json())
  const brief = await h.request('/api/glove/brief').then(r => r.json())
  assert.deepEqual(dashboard.unbilled, { count: 0, list: [] })
  assert.deepEqual(brief.sections.unbilled, [])
  const state = await h.state()
  assert.deepEqual([state.invoices, state.payments, state.messages], [[], [], []])
  assert.deepEqual(notificationCounts(), beforeProviders, 'no customer notice or payment provider attempt')
  // A real completed service job is visible and billable beside the assessed
  // jobs, so the desk projections cannot pass by suppressing all work.
  const billable = (await completedJob(h, b, '2026-12-02')).job
  const mixedDashboard = await h.request('/api/glove/dashboard').then(r => r.json())
  const mixedBrief = await h.request('/api/glove/brief').then(r => r.json())
  assert.deepEqual(mixedDashboard.unbilled, { count: 1, list: [{ id: billable.id, number: billable.number, customer: 'Harbourview Dental', invoiceId: null }] })
  assert.deepEqual(mixedBrief.sections.unbilled.map(item => [item.id, item.action]), [[billable.id, { label: 'Prepare invoice', href: '#invoices' }]])
  const draft = await b.office.run('invoice.prepare', { jobId: billable.id })
  assert.deepEqual([draft.jobId, draft.status, (await h.state()).invoices.map(i => i.jobId)], [billable.id, 'draft', [billable.id]])
  const activity = []
  let before
  do {
    const response = await h.request(`/api/glove/activity${before ? `?before=${before}` : ''}`)
    assert.equal(response.status, 200)
    const page = await response.json()
    activity.push(...page.events)
    before = page.next
  } while (before)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  for (const expected of expectedEvents) {
    const matches = activity.filter(e => e.commandId === expected.commandId && e.kind === expected.kind)
    assert.equal(matches.length, 1, `one attributable ${expected.kind}`)
    const event = matches[0]
    assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key => [key, event[key]])), expected)
    const kept = exported.timeline.filter(e => e.id === event.id)
    assert.equal(kept.length, 1)
    assert.deepEqual([kept[0].kind, kept[0].command_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].job_id, kept[0].subject_id], [expected.kind, expected.commandId, expected.actorId, expected.actorName, expected.actorRole, expected.at, expected.jobId, expected.subjectId])
  }
  const previous = retained[1]
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
  await refuse(b.dispatcher.run, 'assessment.book', previous.payload, 'FORBIDDEN', { commandId: previous.bookId })
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
  await h.command('role.set', { operatorId: previous.person.id, role: 'viewer' })
  await refuse(previous.person.run, 'visit.complete', previous.completePayload, 'FORBIDDEN', { commandId: previous.completionId })
  await h.command('role.set', { operatorId: previous.person.id, role: 'technician' })
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  await h.restart()
  const erased = retained[10]
  await refuse(erased.booker.run, 'assessment.book', erased.payload, 'ERASED', { commandId: erased.bookId })
  await refuse(erased.person.run, 'visit.arrive', erased.arrivalPayload, 'ERASED', { commandId: erased.arrivalId })
  await refuse(erased.person.run, 'visit.capture', erased.captures[0].payload, 'ERASED', { commandId: erased.captures[0].commandId })
  await refuse(erased.person.run, 'visit.complete', erased.completePayload, 'ERASED', { commandId: erased.completionId })
  const redacted = JSON.stringify(await h.request('/api/glove/export').then(r => r.json()))
  for (const personal of [erased.payload.instructions, erased.completePayload.summary, erased.completePayload.signoff.absentReason]) assert.equal(redacted.includes(personal), false, 'erased assessment evidence cannot return through replay or export')
  assert.deepEqual(notificationCounts(), beforeProviders)
}

test('DISP-006 visits, service calls and assessments carry an arrival window separate from the planned time', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const slot = { jobId: job.id, technicianId: b.priya.id, date: '2026-10-22', start: '09:00', end: '10:30' }
  await b.dispatcher.run('visit.book', { ...slot, window: { start: '09:30', end: '11:30' } }, { error: 'WINDOW' })
  await b.dispatcher.run('visit.book', { ...slot, window: { start: '10:00', end: '08:00' } }, { error: 'WINDOW' })
  const visit = await b.dispatcher.run('visit.book', { ...slot, window: { start: '08:00', end: '10:00' } })
  assert.deepEqual([visit.arrivalWindow, visit.local.start, visit.local.end], [{ start: '08:00', end: '10:00' }, '09:00', '10:30'])
  assert.ok((await h.state()).events.some(e => e.subjectId === visit.id && /9:00 AM – 10:30 AM \(arrival window 8:00 AM – 10:00 AM\)/.test(e.summary)))
  const phone = (await b.priyaPerson.state()).visits.find(v => v.id === visit.id)
  assert.deepEqual(phone.arrivalWindow, { start: '08:00', end: '10:00' }, 'the technician sees the promised window')

  // A move keeps the window while the planned start stays inside it, names a new one, or removes it with null.
  const moved = await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, start: '10:00', end: '11:00', reason: 'Earlier job ran long' })
  assert.deepEqual(moved.arrivalWindow, { start: '08:00', end: '10:00' })
  await b.dispatcher.run('visit.change', { visitId: visit.id, version: moved.version, start: '13:00', end: '14:00', reason: 'Afternoon' }, { error: 'WINDOW' })
  const afternoon = await b.dispatcher.run('visit.change', { visitId: visit.id, version: moved.version, start: '13:00', end: '14:00', window: { start: '12:00', end: '14:00' }, reason: 'Customer asked for the afternoon' })
  assert.deepEqual(afternoon.arrivalWindow, { start: '12:00', end: '14:00' })
  const cleared = await b.dispatcher.run('visit.change', { visitId: visit.id, version: afternoon.version, window: null, reason: 'No window promised' })
  assert.equal(cleared.arrivalWindow, undefined)

  // A service call (BOOK-005) is booked with its window too.
  const call = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'No cooling' })
  const callVisit = await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: b.tom.id, date: '2026-10-22', start: '15:00', end: '16:00', window: { start: '14:00', end: '16:00' } })
  assert.deepEqual(callVisit.arrivalWindow, { start: '14:00', end: '16:00' })

  // An assessment on a request (BOOK-006) is booked with its arrival window.
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Second opinion on a noisy condenser' })
  const { visit: assessed } = await b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.tom.id, date: '2026-10-23', start: '08:30', end: '09:30', window: { start: '08:00', end: '10:00' } })
  assert.deepEqual(assessed.arrivalWindow, { start: '08:00', end: '10:00' })

  // Automatic assignment: three requests booked with technicianId "auto" each land on an eligible technician inside their windows.
  const day = '2026-10-26'
  await b.dispatcher.run('visit.book', { jobId: (await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Busy morning')).id })).id, technicianId: b.priya.id, date: day, start: '08:00', end: '10:00' })
  const auto = async (description, start, end, window) => {
    const asked = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description })
    const call = await b.office.run('job.create', { enquiryId: asked.id, title: description })
    return b.dispatcher.run('visit.book', { jobId: call.id, technicianId: 'auto', date: day, start, end, window })
  }
  const one = await auto('No heat upstairs', '10:00', '11:00', { start: '09:00', end: '11:00' })
  const two = await auto('Thermostat blank', '10:00', '11:00', { start: '10:00', end: '12:00' })
  const three = await auto('Drain line clog', '12:00', '13:00', { start: '12:00', end: '14:00' })
  assert.deepEqual([one, two, three].map(v => v.technicianId), [b.tom.id, b.priya.id, b.tom.id], 'fewest booked minutes among technicians free at that time')
  for (const v of [one, two, three]) assert.ok(v.local.start >= v.arrivalWindow.start && v.local.start <= v.arrivalWindow.end)
  assert.match(one.assignments[0].reason, /^Assigned automatically: Tom B\. had the fewest booked minutes that day \(Tom B\. 0, Priya N\. 120\)/)
  await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Fourth call' }).then(async asked => {
    const call = await b.office.run('job.create', { enquiryId: asked.id, title: 'Fourth call' })
    await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: 'auto', date: day, start: '10:15', end: '10:45' }, { error: 'NO_TECHNICIAN' })
  })
  // The dispatcher overrides one with GLOVE-07 conflict review.
  const move = { visitId: three.id, version: three.version, technicianId: b.priya.id, start: '10:30', end: '11:30', window: { start: '10:00', end: '12:00' }, reason: 'Priya knows this customer' }
  const review = await b.dispatcher.run('visit.change', move, { error: 'CONFLICT_REVIEW' })
  const override = await b.dispatcher.run('visit.change', { ...move, acknowledge: review.details.conflicts.map(c => c.code) })
  assert.equal(override.technicianId, b.priya.id)
  const { visit: autoAssessed } = await b.dispatcher.run('assessment.book', { enquiryId: (await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Quote a new system' })).id, technicianId: 'auto', date: day, start: '15:00', end: '16:00', window: { start: '14:00', end: '16:00' } })
  assert.equal(autoAssessed.technicianId, b.tom.id)
})
