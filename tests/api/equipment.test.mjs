// CUST-002 installed equipment and warranties, and FIELD-007 refrigerant
// tracking on that equipment, through the command, state, equipment, file and
// report doors.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
/** A calendar date `days` from today in the business's timezone (Sydney). */
const fromToday = days => { const d = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date()) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }

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

test('CUST-002 and FIELD-007: equipment, warranties and service history at a site, with its refrigerant log', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const otherSite = await h.command('site.save', { customerId: b.customer.id, address: '2 Other St, Balmain NSW 2041' })
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, epa608: '608-UNIV-0042' })
  let condenser, condenserVisit

  await t.test('CUST-002 the desk adds a furnace and an AC condenser with their warranties; the technician records a visit against the condenser', async () => {
    const furnace = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Furnace', make: 'Carrier', model: '59TP6', serial: 'F-1120', installedOn: '2014-05-02', location: 'Basement plant room', manufacturerWarrantyUntil: fromToday(400), laborWarrantyUntil: fromToday(400) })
    condenser = await b.dispatcher.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', serial: 'C-7788', installedOn: '2019-06-11', refrigerant: 'R-410A', location: 'Roof, north side', manufacturerWarrantyUntil: fromToday(30), laborWarrantyUntil: fromToday(-10), photo: { mediaType: 'image/jpeg', base64: jpeg } })
    await b.office.run('equipment.save', { siteId: b.site.id, type: 'Boiler', installedOn: '2019-02-30' }, { error: 'INPUT' })
    await b.office.run('equipment.save', { id: condenser.id, version: condenser.version, siteId: otherSite.id, type: 'AC condenser' }, { error: 'SITE' })
    const { job, visit } = await visitOn(h, b, condenser, '2026-10-20')
    assert.deepEqual(job.equipmentIds, [condenser.id])
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T00:20:00+11:00', kind: 'note', equipmentId: condenser.id, text: 'Coil fouled; cleaned and rinsed' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T00:21:00+11:00', kind: 'note', equipmentId: furnace.id, text: 'Checked the furnace filter while here' })
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
  })

  await t.test('CUST-002 the condenser\'s service history and warranty state, the phone\'s records and the expiring-warranty report', async () => {
    const res = await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.office.cookie })
    assert.equal(res.status, 200)
    const record = await res.json()
    assert.equal(record.equipment.serial, 'C-7788-B')
    assert.deepEqual([record.warranty.manufacturer.state, record.warranty.manufacturer.daysLeft, record.warranty.labor.state], ['expiring', 30, 'expired'])
    assert.equal(record.history.length, 1)
    assert.deepEqual(record.history[0].visits.map(v => [v.date, v.technician, v.status]), [['2026-10-20', 'Priya N.', 'completed']])
    assert.deepEqual(record.history[0].captures.map(x => x.text), ['Coil fouled; cleaned and rinsed'], 'only what was recorded against this unit')
    const photo = await h.request(`/api/glove/files/${record.equipment.photos[0].fileId}`, { as: b.priyaPerson.cookie })
    assert.equal(photo.status, 200, 'the assigned technician sees the unit\'s photo')
    assert.equal((await h.request(`/api/glove/files/${record.equipment.photos[0].fileId}`, { as: b.tomPerson.cookie })).status, 404)
    // The phone's state carries the site's equipment, so it stays readable with the signal gone.
    const phone = await b.priyaPerson.state()
    assert.deepEqual(phone.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace', 'Thermostat'])
    assert.equal((await b.tomPerson.state()).equipment.length, 0)
    assert.equal((await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.tomPerson.cookie })).status, 404)
    const report = await (await h.request('/api/glove/reports/warranties', { as: b.office.cookie })).json()
    assert.deepEqual(report.expiring.map(r => [r.serial, r.warranty, r.daysLeft]), [['C-7788-B', 'manufacturer', 30]])
    assert.deepEqual(report.expired.map(r => [r.serial, r.warranty]), [['C-7788-B', 'labor']])
    assert.equal((await h.request('/api/glove/reports/warranties', { as: b.priyaPerson.cookie })).status, 403)
  })

  await t.test('FIELD-007 refrigerant added and recovered on two visits to the condenser, in its log and the period total', async () => {
    const first = (await h.state()).visits.find(v => v.id === condenserVisit.id)
    assert.equal(first.status, 'completed')
    const { job, visit } = await visitOn(h, b, condenser, '2026-11-03')
    // The first visit's charge was recorded late from the van; it is evidence on that visit's job.
    const { job: job1, visit: visit1 } = await visitOn(h, b, condenser, '2026-10-27')
    await b.priyaPerson.run('visit.capture', { visitId: visit1.id, deviceTime: '2026-10-27T00:20:00+11:00', kind: 'refrigerant', equipmentId: condenser.id, added: '2.5' })
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
