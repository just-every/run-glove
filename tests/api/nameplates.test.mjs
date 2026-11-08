import { scenario } from '../fixtures/scenario.mjs'
// FIELD-006 equipment nameplate capture through the command, state, file and
// export doors, with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

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
  await b.office.run('model.connect', { url: 'https://models.example.test/v1', model: 'vision-test', key: 'synthetic-glove-111' }, { error: 'FORBIDDEN' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'vision-test', key: 'synthetic-glove-111' })
  const manual = await b.office.run('manual.save', { make: 'Trane', model: 'XR14', title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
  await b.office.run('manual.save', { make: ' trane ', model: 'xr14', title: 'Again', url: 'https://manuals.example.test/x.pdf' }, { error: 'DUPLICATE' })

  const read = (plate, extra = {}) => b.priyaPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plate.photo }, ...extra })
  const trane = await read(plates.trane, { equipmentId: condenser.id })
  const carrier = await read(plates.carrier)
  const rheem = await read(plates.rheem)
  await b.tomPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'FORBIDDEN' })

  await scenario(t, 'FIELD-006, FIELD-011 the proposed fields are what the nameplate shows, and an unreadable date stays unread', () => {
    assert.deepEqual(trane.proposed, { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' })
    assert.deepEqual([carrier.proposed, carrier.unread], [{ make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' }, ['serial']])
    assert.deepEqual([rheem.proposed.manufactured, rheem.unread], ['', ['manufactured']], '"June 2018" is not a date as printed to a precision, so it is left unread')
    assert.ok([trane, carrier, rheem].every(r => r.status === 'proposed' && r.model === 'vision-test'))
    // Only the photo went to the provider: no customer, site or job details, store off, the owner's key.
    assert.equal(h.models.calls.length, 3)
    for (const call of h.models.calls) {
      assert.equal(call.authorization, 'Bearer synthetic-glove-111')
      assert.equal(call.body.store, false)
      assert.equal(call.body.response_format.type, 'json_schema')
      assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
    }
  })

  await scenario(t, 'FIELD-006, FIELD-011 nothing is saved to equipment until the technician confirms', async () => {
    const before = await h.state()
    assert.deepEqual(before.equipment.map(e => [e.type, e.make ?? '', e.model ?? '', e.serial ?? '']), [['AC condenser', '', '', '']])
    assert.equal(before.nameplates.length, 3)
    // The key is a credential: never in state or the business export.
    assert.doesNotMatch(JSON.stringify(before), /synthetic-glove-111/)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-111/)
    // Only the technician who took the reading confirms it; the desk cannot.
    await b.tomPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
    await b.dispatcher.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
  })

  await scenario(t, 'FIELD-006, FIELD-011 confirmation retains exact fields and date precision through refusal, replay and restart; library attachment and discard remain intact', async () => {
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

    // Read dates through the real command and provider edge, including a Date
    // that cannot be serialized and calendar days that JavaScript rolls over.
    const cases = [
      ['2026', '2026'], [' 2026-02 ', '2026-02'], ['2024-02-29', '2024-02-29'],
      ['2026-02-99', ''], ['2026-02-29', ''], ['2026-04-31', ''],
      ['2026-00-10', ''], ['2026-13-10', ''], ['2026-02-00', ''],
      ['June 2018', ''], ['2026-2-01', ''], ['', ''],
    ]
    const confirmedUnits = [], keptReadings = []
    let correction
    for (const [value, expected] of cases) {
      const empty = value === ''
      const proposed = { make: empty ? '' : 'Synthetic make', model: empty ? '' : 'Synthetic model', serial: '', manufactured: expected }
      h.models.answer = () => ({ ...proposed, manufactured: value })
      const before = await h.state()
      const commandId = randomUUID()
      const payload = { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: photo('synthetic-glove-111') }, ...(!expected ? { equipmentId: condenser.id } : {}) }
      const reading = await b.priyaPerson.run('nameplate.read', payload, { commandId })
      assert.deepEqual(reading.proposed, proposed, `printed date ${JSON.stringify(value)}`)
      assert.deepEqual(reading.unread, empty ? ['make', 'model', 'serial', 'manufactured'] : expected ? ['serial'] : ['serial', 'manufactured'])
      assert.equal(reading.status, 'proposed')
      assert.deepEqual((await h.state()).equipment, before.equipment, 'a model reading never fills equipment itself')
      const calls = h.models.calls.length
      assert.deepEqual(await b.priyaPerson.run('nameplate.read', payload, { commandId }), reading)
      assert.equal(h.models.calls.length, calls, 'read replay makes no provider request')
      if (expected) {
        const confirmId = randomUUID()
        const confirmation = { readingId: reading.id, version: reading.version, type: 'Synthetic unit', ...proposed }
        const unit = await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId: confirmId })
        assert.deepEqual([unit.make, unit.model, unit.serial, unit.manufacturedOn], ['Synthetic make', 'Synthetic model', '', expected])
        assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId: confirmId }), unit)
        confirmedUnits.push({ unit, confirmation, commandId: confirmId })
        keptReadings.push({ id: reading.id, confirmed: proposed, corrected: [] })
      } else if (value === '2026-02-99') {
        correction = reading
      }
    }
    const unchanged = await h.state()
    for (const value of ['2026-02-99', '2026-02-29', '2026-04-31', '2026-13', 'June 2018']) {
      const error = await b.priyaPerson.run('nameplate.confirm', { readingId: correction.id, version: correction.version, ...correction.proposed, manufactured: value }, { error: 'INPUT' })
      assert.equal(error.message, 'manufactured is YYYY, YYYY-MM or YYYY-MM-DD.')
      assert.deepEqual(error.details, { field: 'manufactured' })
      const refused = await h.state()
      assert.deepEqual(refused.equipment, unchanged.equipment, 'invalid technician correction changes no equipment')
      assert.deepEqual(refused.nameplates, unchanged.nameplates, 'invalid correction leaves the proposal reviewable')
    }
    const correctionId = randomUUID()
    const correctionPayload = { readingId: correction.id, version: correction.version, make: 'Trane', model: 'XR14', serial: 'synthetic-glove-112', manufactured: '2020-12-31' }
    const corrected = await b.priyaPerson.run('nameplate.confirm', correctionPayload, { commandId: correctionId })
    assert.deepEqual([corrected.id, corrected.make, corrected.model, corrected.serial, corrected.manufacturedOn], [condenser.id, 'Trane', 'XR14', 'synthetic-glove-112', '2020-12-31'])
    confirmedUnits.push({ unit: corrected, confirmation: correctionPayload, commandId: correctionId })
    keptReadings.push({ id: correction.id, confirmed: { make: 'Trane', model: 'XR14', serial: 'synthetic-glove-112', manufactured: '2020-12-31' }, corrected: ['make', 'model', 'serial', 'manufactured'] })
    await h.restart()
    for (const { unit, confirmation, commandId } of confirmedUnits) {
      assert.deepEqual((await h.state()).equipment.find(e => e.id === unit.id), unit, 'exact confirmed fields survive Worker restart')
      assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', confirmation, { commandId }), unit, 'confirmation replay after restart returns the same unit')
    }
    const restarted = await h.state()
    for (const expected of keptReadings) {
      const reading = restarted.nameplates.find(r => r.id === expected.id)
      assert.deepEqual([reading.status, reading.confirmed, reading.corrected], ['confirmed', expected.confirmed, expected.corrected])
    }
    assert.equal(restarted.equipment.length, 5, 'replay creates no duplicate equipment')
    for (const call of h.models.calls) {
      assert.equal(call.authorization, 'Bearer synthetic-glove-111')
      assert.equal(call.body.store, false)
      assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
    }
    const { activity, exported } = await assertTrail(h, ['nameplate.read', 'equipment.added', 'equipment.updated'])
    assert.ok(activity.some(e => e.kind === 'equipment.updated' && e.actorId === b.priyaPerson.id && e.commandId === correctionId && e.subjectId === condenser.id))
    assert.doesNotMatch(JSON.stringify([restarted, activity, exported]), /synthetic-glove-111/)
  })
})
