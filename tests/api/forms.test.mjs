// FIELD-002 custom forms and inspections through the command, state and
// equipment doors: the owner builds a form, a job takes a copy, the technician
// fills it on the visit, and an out-of-range reading is flagged on the job and
// on the unit's history.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('FIELD-002 an HVAC inspection form with a conditional question and a reading range flags an out-of-range reading on the job and the equipment', async (t) => {
  const h = await installation({ at: '2026-11-05T12:00:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  const condenser = await b.office.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788', refrigerant: 'R-410A' })
  const secondUnit = await b.office.run('equipment.save', { siteId: b.site.id, type: 'ac CONDENSER', make: 'Carrier', model: '24S', serial: 'synthetic-glove-2' })
  const questions = [
    { id: 'running', label: 'Unit running on arrival?', type: 'yesno', required: true },
    { id: 'fault', label: 'Fault seen', type: 'choice', options: ['No cooling', 'Noise', 'Leak'], required: true, showIf: { questionId: 'running', equals: false } },
    { id: 'suction', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
    { id: 'superheat', label: 'Superheat', type: 'reading', unit: '°F', min: '8', max: '12', required: true },
    { id: 'amps', label: 'Compressor amps', type: 'number', unit: 'A' },
    { id: 'coil', label: 'Coil photo', type: 'photo' },
    { id: 'ok', label: 'Technician signature', type: 'signature' },
    { id: 'notes', label: 'Notes', type: 'notes', required: true },
    { id: 'noise', label: 'Noise detail', type: 'notes', required: true, showIf: { questionId: 'fault', equals: 'Noise' } },
    { id: 'cycles', label: 'Cycle count', type: 'number' },
  ]
  await h.command('form.save', { name: 'HVAC inspection', questions: [{ label: 'Bad', type: 'reading', unit: 'psi', min: '10', max: '5' }] }, { error: 'INPUT' })
  await h.command('form.save', { name: 'HVAC inspection', questions: [{ id: 'x', label: 'Hidden', type: 'notes', showIf: { questionId: 'later', equals: true } }] }, { error: 'INPUT' })
  const form = await h.command('form.save', { name: 'HVAC inspection', questions, equipmentTypes: ['AC CONDENSER'], serviceIds: [b.service.id] })
  const checklist = await h.command('form.save', { name: 'Service sign-off', questions: [{ id: 'clean', label: 'Area left clean', type: 'yesno', required: true }], serviceIds: [b.service.id] })
  // The owner's question limit is exercised through a real saved definition.
  const sixty = Array.from({ length: 60 }, (_, i) => ({ id: `q${i}`, label: `Inspection item ${i + 1}`, type: 'notes' }))
  const limit = await h.command('form.save', { name: 'Long inspection', questions: sixty })
  assert.deepEqual(limit.questions, sixty.map(q => ({ ...q, required: false })))
  const definitions = (await h.state()).forms
  await h.command('form.save', { name: 'Too long', questions: [...sixty, { id: 'extra', label: 'Extra', type: 'notes' }] }, { error: 'INPUT' })
  assert.deepEqual((await h.state()).forms, definitions, 'a rejected definition changes nothing')
  await b.priyaPerson.run('form.save', { name: 'Mine', questions }, { error: 'FORBIDDEN' })

  // A job naming the condenser takes a copy per unit of the listed type, and one for the quoted service.
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Condenser inspection')).id, equipmentIds: [condenser.id, secondUnit.id] })
  assert.deepEqual(job.forms.map(f => [f.name, f.equipmentId]).sort(([a], [b]) => a.localeCompare(b)), [['HVAC inspection', condenser.id], ['HVAC inspection', secondUnit.id], ['Service sign-off', null]])
  const frozenQuestions = questions.map(q => ({ ...q, required: q.required === true, ...(['number'].includes(q.type) && !q.unit ? { unit: '' } : {}) }))
  assert.deepEqual(job.forms.filter(f => f.formId === form.id).map(f => f.questions), [frozenQuestions, frozenQuestions])
  assert.deepEqual(job.checklist.map(({ label, required }) => ({ label, required })), [
    { label: 'Isolate power', required: true }, { label: 'Clean filters', required: true },
    { label: 'Check refrigerant pressure', required: true }, { label: 'Test run 10 minutes', required: false },
  ])
  // The same attachment falls back to one job copy when no matching unit is named.
  const fallback = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Service-only inspection')).id })
  assert.deepEqual(fallback.forms.map(f => [f.formId, f.equipmentId]).sort(), [[form.id, null], [checklist.id, null]].sort())
  const copy = job.forms.find(f => f.formId === form.id)
  // Editing the form afterwards never changes the job's copy.
  const edited = await h.command('form.save', { id: form.id, version: form.version, name: 'HVAC inspection', questions: questions.slice(0, 2), equipmentTypes: ['AC condenser'] })
  assert.deepEqual((await h.state()).jobs.find(j => j.id === job.id).forms.find(f => f.id === copy.id).questions, frozenQuestions)
  await h.command('form.save', { id: form.id, version: edited.version, name: 'HVAC inspection', questions: questions.slice(0, 2), equipmentTypes: ['AC condenser'], archived: true })
  const laterJob = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'After archival')).id, equipmentIds: [condenser.id] })
  assert.deepEqual(laterJob.forms.map(f => f.formId), [checklist.id])
  assert.deepEqual((await h.state()).jobs.find(j => j.id === job.id).forms, job.forms, 'editing and archiving preserve every frozen copy')
  assert.ok((await b.priyaPerson.state()).forms.length === 0, 'technicians read forms only through their jobs')

  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:05:00Z' })
  const fill = (answers, expect = {}) => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:20:00Z', kind: 'form', formId: copy.id, answers }, expect)
  // The fault question shows only when the unit was not running; required visible questions must be answered.
  await fill({ running: true, fault: 'Noise', suction: '120', superheat: '10' }, { error: 'INPUT' })
  await fill({ running: false, suction: '120', superheat: '10', notes: 'Unit stopped on arrival' }, { error: 'FORM' })
  await fill({ running: false, fault: 'Sparks', suction: '120', superheat: '10' }, { error: 'INPUT' })
  const beforeRefusals = (await h.state()).captures
  await b.tomPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:20:00Z', kind: 'form', formId: copy.id, answers: {} }, { error: 'FORBIDDEN' })
  await fill({ running: false, fault: 'No cooling', suction: '120', superheat: '10', notes: 'Quiet', noise: 'must be omitted' }, { error: 'INPUT' })
  await fill({ running: false, fault: 'Noise', suction: '120', superheat: '10', notes: 'Noisy' }, { error: 'FORM' })
  assert.deepEqual((await h.state()).captures, beforeRefusals)
  const fillCommand = randomUUID()
  const acceptedAnswers = { running: false, fault: 'No cooling', suction: '152.5', superheat: '12', amps: '18.4', coil: { mediaType: 'image/png', base64: png }, ok: { mediaType: 'image/png', base64: png }, notes: 'Low airflow over the coil', cycles: '3' }
  const filled = await fill(acceptedAnswers, { commandId: fillCommand })
  assert.equal(filled.id, fillCommand)
  assert.deepEqual(filled, await fill(acceptedAnswers, { commandId: fillCommand }), 'outbox retry returns the accepted capture')
  assert.equal(filled.flagged, 1)
  const reading = name => filled.answers.find(a => a.questionId === name)
  assert.deepEqual([reading('suction').flagged, reading('suction').value, reading('suction').unit], [true, '152.5', 'psi'])
  assert.equal(reading('superheat').flagged, false, 'the range includes its bounds')
  assert.ok(reading('coil').value.fileId && reading('ok').value.fileId)
  await fill({ running: true, suction: '120', superheat: '10' }, { error: 'FILLED' })

  const expectedAnswers = [
    { questionId: 'running', label: 'Unit running on arrival?', type: 'yesno', value: false },
    { questionId: 'fault', label: 'Fault seen', type: 'choice', value: 'No cooling' },
    { questionId: 'suction', label: 'Suction pressure', type: 'reading', value: '152.5', unit: 'psi', min: '110', max: '140', flagged: true },
    { questionId: 'superheat', label: 'Superheat', type: 'reading', value: '12', unit: '°F', min: '8', max: '12', flagged: false },
    { questionId: 'amps', label: 'Compressor amps', type: 'number', value: '18.4', unit: 'A' },
    { questionId: 'coil', label: 'Coil photo', type: 'photo', value: reading('coil').value },
    { questionId: 'ok', label: 'Technician signature', type: 'signature', value: reading('ok').value },
    { questionId: 'notes', label: 'Notes', type: 'notes', value: 'Low airflow over the coil' },
    { questionId: 'cycles', label: 'Cycle count', type: 'number', value: '3' },
  ]
  assert.deepEqual(filled.answers, expectedAnswers, 'visible answers are exact and the hidden noise detail is absent')
  const stable = (await h.state()).captures
  await b.tomPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:20:00Z', kind: 'form', formId: copy.id, answers: acceptedAnswers }, { error: 'FORBIDDEN' })
  assert.deepEqual((await h.state()).captures, stable, 'unrelated technician cannot replace an accepted result')
  const secondCopy = job.forms.find(f => f.equipmentId === secondUnit.id)
  const secondFill = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:22:00Z', kind: 'form', formId: secondCopy.id, answers: { running: true, suction: '109.999', superheat: '8', notes: 'Running with low pressure' } })
  assert.deepEqual(secondFill.answers.map(a => [a.questionId, a.value, a.flagged]), [['running', true, undefined], ['suction', '109.999', true], ['superheat', '8', false], ['notes', 'Running with low pressure', undefined]])
  // On the job: the capture and its timeline entry name the out-of-range reading.
  const desk = await h.state()
  assert.equal(desk.captures.find(x => x.id === filled.id).equipmentId, condenser.id)
  const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()
  assert.ok(timeline.events.some(e => e.summary.includes('form HVAC inspection on AC condenser Trane XR14 — 1 reading out of range')))
  assert.ok(timeline.events.some(e => e.subjectId === filled.id && e.actorId === b.priyaPerson.id && e.actorRole === 'technician' && e.commandId === fillCommand && e.at === '2026-11-05T12:00:00.000Z'))
  // On the equipment: the unit's service history carries the flagged reading, for the desk and the technician.
  for (const as of [h.owner(), b.priyaPerson.cookie]) {
    const record = await (await h.request(`/api/glove/equipment/${condenser.id}`, { as })).json()
    const entry = record.history.find(j => j.jobId === job.id).captures.find(x => x.kind === 'form')
    assert.equal(entry.flagged, 1)
    assert.equal(entry.answers.find(a => a.questionId === 'suction').flagged, true)
  }
  // The service's form is the job's own (no unit), filled separately.
  const signoff = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:30:00Z', kind: 'form', formId: job.forms.find(f => f.formId === checklist.id).id, answers: { clean: true } })
  assert.equal(signoff.equipmentId, undefined)
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:32:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-20T23:00:00Z', summary: 'Inspected both condensers', signoff: { absentReason: 'Customer away' } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
  const reportAnswers = expectedAnswers.map(({ questionId, ...answer }) => answer)
  assert.deepEqual(report.snapshot.forms.find(f => f.answers.some(a => a.label === 'Suction pressure' && a.value === '152.5')), { name: 'HVAC inspection', answers: reportAnswers })
  const link = await b.office.run('report.link', { reportId: report.id })
  const publicReport = () => h.request('/api/glove/public/reports', { as: '', headers: { authorization: `Bearer ${link.token}` } }).then(r => r.json())

  // An agreement supplies a form even when neither the service nor unit attaches it.
  const agreementForm = await h.command('form.save', { name: 'Agreement inspection', questions: [{ id: 'checked', label: 'Agreement inspection complete', type: 'yesno', required: true }] })
  const plan = await h.command('plan.save', { name: 'Inspection plan', price: '100.00', termMonths: 12, includedVisits: 2, visitServiceId: b.service.id, formIds: [agreementForm.id] })
  const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, via: 'phone', startDate: '2026-11-01' })
  const agreementJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, agreementId: agreement.id, title: 'Included inspection' })
  assert.deepEqual(agreementJob.forms.map(f => [f.formId, f.equipmentId]).sort(), [[checklist.id, null], [agreementForm.id, null]].sort())
  const promised = agreementJob.forms.find(f => f.formId === agreementForm.id)
  assert.deepEqual(promised.questions, [{ id: 'checked', label: 'Agreement inspection complete', type: 'yesno', required: true }])

  await h.restart()
  for (const person of [h.owner(), b.priyaPerson.cookie]) {
    const retained = await h.state(person)
    assert.deepEqual(retained.jobs.find(j => j.id === job.id).forms, job.forms)
    assert.deepEqual(retained.captures.find(c => c.id === filled.id), filled, 'the complete accepted result survives a real Worker restart')
    assert.deepEqual(retained.captures.find(c => c.id === secondFill.id), secondFill)
    const unit = await h.request(`/api/glove/equipment/${condenser.id}`, { as: person }).then(r => r.json())
    assert.deepEqual(unit.history.find(j => j.jobId === job.id).captures.filter(c => c.kind === 'form'), [{ id: filled.id, kind: 'form', visitId: visit.id, deviceTime: '2026-10-20T22:20:00.000Z', formName: 'HVAC inspection', answers: expectedAnswers, flagged: 1 }])
    const otherUnit = await h.request(`/api/glove/equipment/${secondUnit.id}`, { as: person }).then(r => r.json())
    assert.deepEqual(otherUnit.history.find(j => j.jobId === job.id).captures.filter(c => c.kind === 'form'), [{ id: secondFill.id, kind: 'form', visitId: visit.id, deviceTime: '2026-10-20T22:22:00.000Z', formName: 'HVAC inspection', answers: secondFill.answers, flagged: 1 }])
    const property = await h.request(`/api/glove/sites/${b.site.id}/history`, { as: person }).then(r => r.json())
    assert.ok(property.entries.some(e => e.kind === 'form' && e.id === filled.id && e.jobId === job.id))
    for (const answer of [reading('coil'), reading('ok')]) {
      const original = await h.request(`/api/glove/files/${answer.value.fileId}`, { as: person })
      assert.equal(original.status, 200)
      assert.deepEqual(Buffer.from(await original.arrayBuffer()), Buffer.from(png, 'base64'))
    }
  }
  assert.deepEqual((await publicReport()).report.forms.find(f => f.answers.some(a => a.label === 'Suction pressure' && a.value === '152.5')), { name: 'HVAC inspection', answers: reportAnswers })
  assert.equal((await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.tomPerson.cookie })).status, 404)
  assert.equal((await h.request(`/api/glove/files/${reading('coil').value.fileId}`, { as: b.tomPerson.cookie })).status, 404)
  const { activity, exported } = await assertTrail(h, ['form.saved', 'capture.form', 'report.created'])
  const event = activity.find(e => e.subjectId === filled.id)
  assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.commandId, event.at, event.jobId], [b.priyaPerson.id, 'Priya Nair', 'technician', fillCommand, '2026-11-05T12:00:00.000Z', job.id])
  const exportedEvent = exported.timeline.find(e => e.id === event.id)
  assert.deepEqual([exportedEvent.actor_id, exportedEvent.actor_name, exportedEvent.actor_role, exportedEvent.command_id, exportedEvent.at, exportedEvent.job_id, exportedEvent.summary], [b.priyaPerson.id, 'Priya Nair', 'technician', fillCommand, '2026-11-05T12:00:00.000Z', job.id, event.summary])
  assert.deepEqual(exported.captures.find(c => c.id === filled.id), filled)
  assert.deepEqual(exported.jobs.find(j => j.id === agreementJob.id).forms, agreementJob.forms)
})
