import { step } from './journey-steps.mjs'
// AGENT-006 repeat-callback diagnosis through the command and callback doors,
// with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

test('AGENT-006 a callback on a condenser with two prior visits gets an advisory checklist that cites both visits\' readings', async (t) => {
  const h = await installation({ at: '2026-10-26T12:00:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'agent-test', key: 'sk-test-owner-key' })
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
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-26T12:00:01Z' } })
  const second = await serviced('2026-10-13', '104', '15', visit => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-13T22:15:00Z', kind: 'refrigerant', equipmentId: condenser.id, added: '1.5', certification: '608-UNIV-0042' }))

  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-26T12:00:02Z' } })

  // The customer calls back: the office makes a service call about the condenser.
  const callback = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'No cooling again', equipmentIds: [condenser.id] })
  const other = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Furnace noise', equipmentIds: [furnace.id] })

  await step('AGENT-006 the callback is detected and the agent gathers both earlier visits', async () => {
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
  })

  await step('AGENT-006 the prepared checklist cites both visits\' readings, resolved from the records, and is labelled advisory', async () => {
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

  await step('AGENT-006 a checklist citing what the pack does not hold is refused; the technician on the callback reads the checklist, another does not', async () => {
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
