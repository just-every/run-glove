// FIELD-006 equipment nameplate capture through the command, state, file and
// export doors, with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

/** Three fixture nameplate photos: distinct JPEG bytes the provider fake recognises, as a model reads a photo. */
const photo = tag => Buffer.concat([Buffer.from('ffd8ffe000104a4649460001', 'hex'), Buffer.from(tag), Buffer.from('ffd9', 'hex')]).toString('base64')
const plates = {
  trane: { photo: photo('trane-xr14'), reads: { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' } },
  carrier: { photo: photo('carrier-59tp6'), reads: { make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' } },
  rheem: { photo: photo('rheem-xe50'), reads: { make: 'Rheem', model: 'XE50M06', serial: 'Q031812345', manufactured: 'June 2018' } },
}

test('FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  h.models.answer = body => {
    const url = body.messages[1].content.find(x => x.type === 'image_url').image_url.url
    return Object.values(plates).find(p => url === `data:image/jpeg;base64,${p.photo}`).reads
  }
  const condenser = await b.office.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', location: 'Roof' })
  const quote = await acceptedQuote(h, b, 'Condenser service')
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id, equipmentIds: [condenser.id] })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:05:00Z' })

  // Before the owner connects a model provider there is nothing to read with.
  await b.priyaPerson.run('nameplate.read', { visitId: visit.id, equipmentId: condenser.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'MODEL' })
  await b.office.run('model.connect', { url: 'https://models.example.test/v1', model: 'vision-test', key: 'sk-test-owner-key' }, { error: 'FORBIDDEN' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'vision-test', key: 'sk-test-owner-key' })
  const manual = await b.office.run('manual.save', { make: 'Trane', model: 'XR14', title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
  await b.office.run('manual.save', { make: ' trane ', model: 'xr14', title: 'Again', url: 'https://manuals.example.test/x.pdf' }, { error: 'DUPLICATE' })

  const read = (plate, extra = {}) => b.priyaPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plate.photo }, ...extra })
  const trane = await read(plates.trane, { equipmentId: condenser.id })
  const carrier = await read(plates.carrier)
  const rheem = await read(plates.rheem)
  await b.tomPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'FORBIDDEN' })

  await t.test('FIELD-006, FIELD-011 the proposed fields are what the nameplate shows, and an unreadable date stays unread', () => {
    assert.deepEqual(trane.proposed, { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' })
    assert.deepEqual([carrier.proposed, carrier.unread], [{ make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' }, ['serial']])
    assert.deepEqual([rheem.proposed.manufactured, rheem.unread], ['', ['manufactured']], '"June 2018" is not a date as printed to a precision, so it is left unread')
    assert.ok([trane, carrier, rheem].every(r => r.status === 'proposed' && r.model === 'vision-test'))
    // Only the photo went to the provider: no customer, site or job details, store off, the owner's key.
    assert.equal(h.models.calls.length, 3)
    for (const call of h.models.calls) {
      assert.equal(call.authorization, 'Bearer sk-test-owner-key')
      assert.equal(call.body.store, false)
      assert.equal(call.body.response_format.type, 'json_schema')
      assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
    }
  })

  await t.test('FIELD-006, FIELD-011 nothing is saved to equipment until the technician confirms', async () => {
    const before = await h.state()
    assert.deepEqual(before.equipment.map(e => [e.type, e.make ?? '', e.model ?? '', e.serial ?? '']), [['AC condenser', '', '', '']])
    assert.equal(before.nameplates.length, 3)
    // The key is a credential: never in state or the business export.
    assert.doesNotMatch(JSON.stringify(before), /sk-test-owner-key/)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /sk-test-owner-key/)
    // Only the technician who took the reading confirms it; the desk cannot.
    await b.tomPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
    await b.dispatcher.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
  })

  await t.test('FIELD-006, FIELD-011 confirming writes the fields (with corrections) and attaches the manual from the library; a discarded reading writes nothing', async () => {
    const unit = await b.priyaPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed, serial: '19243KX1G' })
    assert.deepEqual([unit.id, unit.make, unit.model, unit.serial, unit.manufacturedOn, unit.location], [condenser.id, 'Trane', 'XR14', '19243KX1G', '2019-06', 'Roof'])
    assert.deepEqual(unit.manual, { manualId: manual.id, title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
    assert.deepEqual(unit.photos.map(p => p.fileId), [trane.photo.fileId])
    await b.priyaPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version + 1, ...trane.proposed }, { error: 'READING_STATE' })
    const furnace = await b.priyaPerson.run('nameplate.confirm', { readingId: carrier.id, version: carrier.version, type: 'Furnace', location: 'Basement', ...carrier.proposed })
    assert.deepEqual([furnace.siteId, furnace.type, furnace.make, furnace.model, furnace.serial, furnace.manufacturedOn, furnace.manual], [b.site.id, 'Furnace', 'Carrier', '59TP6', '', '2014', null], 'no manual in the library, none attached')
    const discarded = await b.priyaPerson.run('nameplate.discard', { readingId: rheem.id, version: rheem.version })
    assert.equal(discarded.status, 'discarded')
    const after = await h.state()
    assert.deepEqual(after.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace'])
    assert.deepEqual(after.nameplates.map(r => [r.status, r.corrected ?? null]), [['confirmed', ['serial']], ['confirmed', []], ['discarded', null]])
    // The nameplate photo is the unit's now: the technician and the desk read it, another technician does not.
    assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.priyaPerson.cookie })).status, 200)
    assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.office.cookie })).status, 200)
    assert.equal((await h.request(`/api/glove/files/${trane.photo.fileId}`, { as: b.tomPerson.cookie })).status, 404)
    const record = await (await h.request(`/api/glove/equipment/${condenser.id}`, { as: b.priyaPerson.cookie })).json()
    assert.equal(record.equipment.manual.title, 'Trane XR14 installer guide')
  })
})
