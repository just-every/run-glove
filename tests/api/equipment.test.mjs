// CUST-002 installed equipment and warranties, and FIELD-007 refrigerant
// tracking on that equipment, through the command, state, equipment, file and
// report doors.
import test, { describe, after } from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
// Sydney is already October 20 while UTC is still October 19.
const at = '2026-10-19T13:30:00.000Z'

/** A job at the business's site for the condenser, one visit for Priya on `date`, arrived. */
async function visitOn(h, b, condenser, date) {
  const quote = await acceptedQuote(h, b, `Condenser service ${date}`)
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id, equipmentIds: [condenser.id] })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: `${date}T00:05:00+11:00` })
  return { job, visit }
}

async function complete(b, job, visit, date) {
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: `${date}T00:10:00+11:00`, kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: `${date}T00:50:00+11:00`, summary: 'Serviced the condenser', signoff: { absentReason: 'Customer out' } })
}

describe('CUST-002 and FIELD-007: equipment, warranties and service history at a site, with its refrigerant log', async (t) => {
  const h = await installation({ at })
  after(() => h.close())
  const b = await business(h)
  const otherSite = await h.command('site.save', { customerId: b.customer.id, address: '2 Other St, Balmain NSW 2041' })
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, epa608: '608-UNIV-0042' })
  let furnace, condenser, condenserVisit, condenserJob, condenserNote, furnaceNote

  await test('CUST-002 the desk adds a furnace and an AC condenser with their warranties; the technician records a visit against the condenser', async () => {
    furnace = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Furnace', make: 'Carrier', model: '59TP6', serial: 'F-1120', installedOn: '2014-05-02', location: 'Basement plant room', manufacturerWarrantyUntil: '2027-11-24', laborWarrantyUntil: '2027-11-24' })
    condenser = await b.dispatcher.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788', installedOn: '2019-06-11', refrigerant: 'R-410A', location: 'Roof, north side', manufacturerWarrantyUntil: '2026-11-19', laborWarrantyUntil: '2026-10-10', photo: { mediaType: 'image/jpeg', base64: jpeg } })
    await b.office.run('equipment.save', { siteId: b.site.id, type: 'Boiler', installedOn: '2019-02-30' }, { error: 'INPUT' })
    await b.office.run('equipment.save', { id: condenser.id, version: condenser.version, siteId: otherSite.id, type: 'AC condenser' }, { error: 'SITE' })
    const { job, visit } = await visitOn(h, b, condenser, '2026-10-20')
    assert.deepEqual(job.equipmentIds, [condenser.id])
    condenserNote = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T00:20:00+11:00', kind: 'note', equipmentId: condenser.id, text: 'Coil fouled; cleaned and rinsed' })
    furnaceNote = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T00:21:00+11:00', kind: 'note', equipmentId: furnace.id, text: 'Checked the furnace filter while here' })
    const elsewhere = await h.command('equipment.save', { siteId: otherSite.id, type: 'Water heater' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T00:22:00+11:00', kind: 'note', equipmentId: elsewhere.id, text: 'x' }, { error: 'EQUIPMENT' })
    // On the phone the technician updates the condenser's serial and adds the thermostat they found.
    condenser = await b.priyaPerson.run('equipment.save', { visitId: visit.id, id: condenser.id, version: condenser.version, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788-B', installedOn: '2019-06-11', refrigerant: 'R-410A', location: 'Roof, north side', manufacturerWarrantyUntil: condenser.manufacturerWarrantyUntil, laborWarrantyUntil: condenser.laborWarrantyUntil, deviceTime: '2026-10-20T00:30:00+11:00' })
    assert.equal(condenser.photos.length, 1, 'earlier photos stay')
    const thermostat = await b.priyaPerson.run('equipment.save', { visitId: visit.id, type: 'Thermostat', make: 'Honeywell', location: 'Reception wall', deviceTime: '2026-10-20T00:31:00+11:00' })
    assert.equal(thermostat.siteId, b.site.id, 'phone equipment lands at the visit\'s site')
    await b.tomPerson.run('equipment.save', { visitId: visit.id, type: 'Thermostat' }, { error: 'FORBIDDEN' })
    await complete(b, job, visit, '2026-10-20')
    condenserVisit = visit
    condenserJob = job
  })

  await test('CUST-002 exact site equipment, completed unit history, warranties and original bytes survive Worker restart', async () => {
    await h.restart()
    const res = await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.office.cookie })
    assert.equal(res.status, 200)
    const record = await res.json()
    const fields = e => [e.siteId, e.customerId, e.type, e.make, e.model, e.serial, e.installedOn, e.refrigerant, e.location, e.manufacturerWarrantyUntil, e.laborWarrantyUntil]
    assert.deepEqual(fields(record.equipment), [b.site.id, b.customer.id, 'AC condenser', 'Trane', 'XR14', 'C-7788-B', '2019-06-11', 'R-410A', 'Roof, north side', '2026-11-19', '2026-10-10'])
    assert.deepEqual(record.site, { id: b.site.id, address: '14 Harbour St, Balmain NSW 2041' })
    assert.deepEqual(record.warranty, { manufacturer: { until: '2026-11-19', state: 'expiring', daysLeft: 30 }, labor: { until: '2026-10-10', state: 'expired', daysLeft: -10 } })
    assert.deepEqual(record.history, [{ jobId: condenserJob.id, number: condenserJob.number, title: 'Condenser service 2026-10-20', status: 'completed', visits: [{ visitId: condenserVisit.id, date: '2026-10-20', start: '09:00', technician: 'Priya N.', status: 'completed' }], captures: [{ id: condenserNote.id, kind: 'note', deviceTime: '2026-10-19T13:20:00.000Z', visitId: condenserVisit.id, text: 'Coil fouled; cleaned and rinsed' }] }])
    const other = await (await h.request(`/api/glove/equipment/${furnace.id}`, { as: b.office.cookie })).json()
    assert.deepEqual(fields(other.equipment), [b.site.id, b.customer.id, 'Furnace', 'Carrier', '59TP6', 'F-1120', '2014-05-02', '', 'Basement plant room', '2027-11-24', '2027-11-24'])
    assert.deepEqual(other.warranty, { manufacturer: { until: '2027-11-24', state: 'active', daysLeft: 400 }, labor: { until: '2027-11-24', state: 'active', daysLeft: 400 } })
    assert.deepEqual(other.history[0].captures.map(x => [x.id, x.text]), [[furnaceNote.id, 'Checked the furnace filter while here']])
    const photo = await h.request(`/api/glove/files/${record.equipment.photos[0].fileId}`, { as: b.priyaPerson.cookie })
    assert.equal(record.equipment.photos.length, 1)
    assert.equal(photo.status, 200, 'the assigned technician sees the unit\'s photo')
    assert.equal(photo.headers.get('content-type'), 'image/jpeg')
    assert.deepEqual(Buffer.from(await photo.arrayBuffer()), Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex'))
    assert.equal((await h.request(`/api/glove/files/${record.equipment.photos[0].fileId}`, { as: '' })).status, 401)
    assert.equal((await h.request(`/api/glove/files/${record.equipment.photos[0].fileId}`, { as: b.tomPerson.cookie })).status, 404)
    // The phone's state carries the site's equipment, so it stays readable with the signal gone.
    const phone = await b.priyaPerson.state()
    assert.deepEqual(fields(phone.equipment.find(e => e.id === condenser.id)), [b.site.id, b.customer.id, 'AC condenser', 'Trane', 'XR14', 'C-7788-B', '2019-06-11', 'R-410A', 'Roof, north side', '2026-11-19', '2026-10-10'])
    assert.deepEqual(phone.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace', 'Thermostat'])
    assert.equal((await b.tomPerson.state()).equipment.length, 0)
    assert.equal((await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.tomPerson.cookie })).status, 404)
    const report = await (await h.request('/api/glove/reports/warranties', { as: b.office.cookie })).json()
    assert.equal(report.asOf, '2026-10-20')
    assert.deepEqual(report.expiring.map(r => [r.serial, r.warranty, r.daysLeft]), [['C-7788-B', 'manufacturer', 30]])
    assert.deepEqual(report.expired.map(r => [r.serial, r.warranty]), [['C-7788-B', 'labor']])
    assert.equal((await h.request('/api/glove/reports/warranties', { as: b.priyaPerson.cookie })).status, 403)
    const { activity, exported } = await assertTrail(h, ['equipment.added', 'equipment.updated', 'job.completed'])
    const changes = activity.filter(e => e.subjectKind === 'equipment' && [furnace.id, condenser.id].includes(e.subjectId))
    assert.deepEqual(changes.map(e => [e.kind, e.subjectId, e.actorId, e.actorName, e.actorRole, e.at]), [
      ['equipment.updated', condenser.id, b.priyaPerson.id, 'Priya Nair', 'technician', at],
      ['equipment.added', condenser.id, b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at],
      ['equipment.added', furnace.id, b.office.id, 'Olu Office', 'office', at],
    ])
    for (const event of changes) {
      const kept = exported.timeline.find(e => e.id === event.id)
      assert.deepEqual([kept.subject_kind, kept.subject_id, kept.actor_id, kept.actor_role, kept.command_id, kept.at], ['equipment', event.subjectId, event.actorId, event.actorRole, event.commandId, at])
    }
  })

  await test('FIELD-007 refrigerant added and recovered on two visits to the condenser, in its log and the period total', async () => {
    await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-19T13:31:00Z' } })
    const first = (await h.state()).visits.find(v => v.id === condenserVisit.id)
    assert.equal(first.status, 'completed')
    const { job, visit } = await visitOn(h, b, condenser, '2026-11-03')
    // The first visit's charge was recorded late from the van; it is evidence on that visit's job.
    const { job: job1, visit: visit1 } = await visitOn(h, b, condenser, '2026-10-27')
    await b.priyaPerson.run('visit.capture', { visitId: visit1.id, deviceTime: '2026-10-27T00:20:00+11:00', kind: 'refrigerant', equipmentId: condenser.id, added: '2.5' })
    await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-19T13:32:00Z' } })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-11-03T00:20:00+11:00', kind: 'refrigerant', equipmentId: condenser.id, added: '0.75', recovered: '1.25', certification: '608-TYPE2-0099' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-11-03T00:21:00+11:00', kind: 'refrigerant', equipmentId: condenser.id, added: '0', recovered: '0' }, { error: 'QUANTITY' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-11-03T00:21:00+11:00', kind: 'refrigerant', added: '1' }, { error: 'NOT_FOUND' })
    await complete(b, job1, visit1, '2026-10-27')
    await complete(b, job, visit, '2026-11-03')
    const record = await (await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.office.cookie })).json()
    assert.deepEqual(record.refrigerant.entries.map(e => [e.date, e.type, e.added, e.recovered, e.certification, e.technician]), [
      ['2026-10-27', 'R-410A', '2.5', '0', '608-UNIV-0042', 'Priya N.'],
      ['2026-11-03', 'R-410A', '0.75', '1.25', '608-TYPE2-0099', 'Priya N.'],
    ])
    assert.deepEqual([record.refrigerant.added, record.refrigerant.recovered], ['3.25', '1.25'])
    assert.equal(record.history.length, 3, 'three jobs touched the condenser')
    const october = await (await h.request('/api/glove/reports/refrigerant?from=2026-10-01&to=2026-10-31', { as: h.owner() })).json()
    assert.deepEqual([october.added, october.recovered, october.entries.length], ['2.5', '0', 1])
    const both = await (await h.request('/api/glove/reports/refrigerant?from=2026-10-01&to=2026-11-30', { as: h.owner() })).json()
    assert.deepEqual(both.byType, [{ type: 'R-410A', added: '3.25', recovered: '1.25' }])
    assert.deepEqual(both.byEquipment.map(e => [e.serial, e.added, e.recovered]), [['C-7788-B', '3.25', '1.25']])
    assert.equal((await h.request('/api/glove/reports/refrigerant?from=2026-11-30&to=2026-10-01', { as: h.owner() })).status, 400)
  })
})
