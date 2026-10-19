// FIELD-002 custom forms and inspections through the command, state and
// equipment doors: the owner builds a form, a job takes a copy, the technician
// fills it on the visit, and an out-of-range reading is flagged on the job and
// on the unit's history.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('FIELD-002 an HVAC inspection form with a conditional question and a reading range flags an out-of-range reading on the job and the equipment', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const condenser = await b.office.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788', refrigerant: 'R-410A' })
  const questions = [
    { id: 'running', label: 'Unit running on arrival?', type: 'yesno', required: true },
    { id: 'fault', label: 'Fault seen', type: 'choice', options: ['No cooling', 'Noise', 'Leak'], required: true, showIf: { questionId: 'running', equals: false } },
    { id: 'suction', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
    { id: 'superheat', label: 'Superheat', type: 'reading', unit: '°F', min: '8', max: '12', required: true },
    { id: 'amps', label: 'Compressor amps', type: 'number', unit: 'A' },
    { id: 'coil', label: 'Coil photo', type: 'photo' },
    { id: 'ok', label: 'Technician signature', type: 'signature' },
    { id: 'notes', label: 'Notes', type: 'notes' },
  ]
  await h.command('form.save', { name: 'HVAC inspection', questions: [{ label: 'Bad', type: 'reading', unit: 'psi', min: '10', max: '5' }] }, { error: 'INPUT' })
  await h.command('form.save', { name: 'HVAC inspection', questions: [{ id: 'x', label: 'Hidden', type: 'notes', showIf: { questionId: 'later', equals: true } }] }, { error: 'INPUT' })
  const form = await h.command('form.save', { name: 'HVAC inspection', questions, equipmentTypes: ['AC condenser'] })
  const checklist = await h.command('form.save', { name: 'Service sign-off', questions: [{ id: 'clean', label: 'Area left clean', type: 'yesno', required: true }], serviceIds: [b.service.id] })
  await b.priyaPerson.run('form.save', { name: 'Mine', questions }, { error: 'FORBIDDEN' })

  // A job naming the condenser takes a copy per unit of the listed type, and one for the quoted service.
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Condenser inspection')).id, equipmentIds: [condenser.id] })
  assert.deepEqual(job.forms.map(f => [f.name, f.equipmentId]), [['HVAC inspection', condenser.id], ['Service sign-off', null]])
  const copy = job.forms.find(f => f.formId === form.id)
  // Editing the form afterwards never changes the job's copy.
  await h.command('form.save', { id: form.id, version: form.version, name: 'HVAC inspection', questions: questions.slice(0, 2), equipmentTypes: ['AC condenser'] })
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).forms.find(f => f.id === copy.id).questions.length, 8)
  assert.ok((await b.priyaPerson.state()).forms.length === 0, 'technicians read forms only through their jobs')

  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:05:00Z' })
  const fill = (answers, expect) => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:20:00Z', kind: 'form', formId: copy.id, answers }, expect)
  // The fault question shows only when the unit was not running; required visible questions must be answered.
  await fill({ running: true, fault: 'Noise', suction: '120', superheat: '10' }, { error: 'INPUT' })
  await fill({ running: false, suction: '120', superheat: '10' }, { error: 'FORM' })
  await fill({ running: false, fault: 'Sparks', suction: '120', superheat: '10' }, { error: 'INPUT' })
  const filled = await fill({ running: false, fault: 'No cooling', suction: '152.5', superheat: '12', amps: '18.4', coil: { mediaType: 'image/png', base64: png }, ok: { mediaType: 'image/png', base64: png }, notes: 'Low airflow over the coil' })
  assert.equal(filled.flagged, 1)
  const reading = name => filled.answers.find(a => a.questionId === name)
  assert.deepEqual([reading('suction').flagged, reading('suction').value, reading('suction').unit], [true, '152.5', 'psi'])
  assert.equal(reading('superheat').flagged, false, 'the range includes its bounds')
  assert.ok(reading('coil').value.fileId && reading('ok').value.fileId)
  await fill({ running: true, suction: '120', superheat: '10' }, { error: 'FILLED' })

  // On the job: the capture and its timeline entry name the out-of-range reading.
  const desk = await h.state()
  assert.equal(desk.captures.find(x => x.id === filled.id).equipmentId, condenser.id)
  const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()
  assert.ok(timeline.events.some(e => e.summary.includes('form HVAC inspection on AC condenser Trane XR14 — 1 reading out of range')))
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
})
