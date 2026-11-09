import { scenario } from '../fixtures/scenario.mjs'
// FIELD-006 equipment nameplate capture through the command, state, file and
// export doors, with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote, completedJob, assertTrail } from './harness.mjs'

/** Three fixture nameplate photos: distinct JPEG bytes the provider fake recognises, as a model reads a photo. */
const photo = tag => Buffer.concat([Buffer.from('ffd8ffe000104a4649460001', 'hex'), Buffer.from(tag), Buffer.from('ffd9', 'hex')]).toString('base64')
const plates = {
  trane: { photo: photo('trane-xr14'), reads: { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' } },
  carrier: { photo: photo('carrier-59tp6'), reads: { make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' } },
  rheem: { photo: photo('rheem-xe50'), reads: { make: 'Rheem', model: 'XE50M06', serial: 'Q031812345', manufactured: 'June 2018' } },
}

test('FIELD-006, FIELD-011 a technician photographs three nameplates; the model proposes the fields and nothing is saved until the technician confirms', async (t) => {
  const h = await installation({ captureLogs: true })
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

  await scenario(t, 'FIELD-006 point 2: only a signed-in unscoped Owner connects and disconnects a credential-free HTTPS provider address', async () => {
    const connection = { url: 'https://models.example.test/v1', model: 'vision-test', key: 'synthetic-glove-111' }
    const customRole = await h.command('role.save', { name: 'Nameplate records clerk', permissions: ['equipment.save', 'export.read'] })
    const custom = await h.person('Nameplate clerk', `custom:${customRole.id}`)
    const limited = await h.person('Nameplate branch owner', 'owner')
    await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
    const token = await h.command('token.issue', { name: 'Nameplate integration', role: 'dispatcher' })
    const credentialed = new URL('https://models.example.test/v1')
    credentialed.username = 'synthetic-glove-115'
    credentialed.password = 'synthetic-glove-116'
    for (const connected of [false, true]) {
      if (connected) {
        const result = await h.command('model.connect', connection)
        assert.equal(result.model.url, 'https://models.example.test/v1')
        assert.equal(result.model.model, 'vision-test')
        assert.ok(!JSON.stringify(result).includes(connection.key))
      }
      const before = await h.state(), attempts = h.outbound.attempts
      for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent, custom, limited]) {
        for (const payload of [connection, { key: null }]) await person.run('model.connect', payload, { error: 'FORBIDDEN' })
      }
      for (const payload of [connection, { key: null }]) {
        const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: randomUUID(), type: 'model.connect', payload } })
        assert.equal(signedOut.status, 401)
        const integration = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type: 'model.connect', payload } })
        assert.equal(integration.status, 403)
        assert.equal((await integration.json()).error.code, 'FORBIDDEN')
      }
      for (const url of ['http://models.example.test/v1', credentialed.href, 'https://models.example.test/v1?key=synthetic-glove-113', 'https://models.example.test/v1#private']) {
        await h.command('model.connect', { ...connection, url }, { error: 'INPUT' })
      }
      assert.deepEqual((await h.state()).business, before.business, 'refused configuration never changes the provider')
      assert.equal(h.outbound.attempts, attempts, 'provider configuration and its refusals send nothing')
      if (!connected) {
        await b.priyaPerson.run('nameplate.read', { visitId: visit.id, equipmentId: condenser.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'MODEL' })
        assert.equal(h.outbound.attempts, attempts, 'without a connection no model request is attempted')
        assert.deepEqual((await h.state()).nameplates, [])
        assert.deepEqual((await h.db.prepare('SELECT id FROM glove_files').all()).results, [])
      }
    }
    const disconnected = await h.command('model.connect', { key: null })
    assert.equal(disconnected.model, null)
    assert.equal((await h.db.prepare("SELECT COUNT(*) AS n FROM glove_provider_keys WHERE provider='model'").first()).n, 0)
    const attempts = h.outbound.attempts
    await b.priyaPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'MODEL' })
    assert.equal(h.outbound.attempts, attempts, 'disconnect removes read authority without contacting the provider')
    await h.command('model.connect', connection)
  })
  await scenario(t, 'FIELD-006 point 2: provider redirects are refused without forwarding the photo or saving a reading', async () => {
    for (const status of [307, 308, 301, 302, 303]) {
      for (const location of ['https://outside.example.test/capture', 'http://outside.example.test/capture', 'https://models.example.test/elsewhere']) {
        h.models.reply = () => new Response(null, { status, headers: { location } })
        const before = await h.state(), attempts = h.outbound.attempts, calls = h.models.calls.length
        const refused = await b.priyaPerson.run('nameplate.read', { visitId: visit.id, equipmentId: condenser.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'MODEL' })
        assert.equal(h.outbound.attempts - attempts, 1, `HTTP ${status} must not forward to ${location}`)
        assert.equal(h.models.calls.length - calls, 1, 'no provider retry')
        assert.deepEqual(refused.details, { status })
        const after = await h.state()
        assert.deepEqual(after.equipment, before.equipment)
        assert.deepEqual(after.nameplates, before.nameplates)
        assert.deepEqual((await h.db.prepare('SELECT id FROM glove_files').all()).results, [], 'failed model request saves no photo')
      }
    }
    h.models.reply = null
    h.models.calls.length = 0
  })
  const manual = await b.office.run('manual.save', { make: 'Trane', model: 'XR14', title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
  await b.office.run('manual.save', { make: ' trane ', model: 'xr14', title: 'Again', url: 'https://manuals.example.test/x.pdf' }, { error: 'DUPLICATE' })

  const readCommands = []
  const read = async (plate, extra = {}) => {
    const commandId = randomUUID(), payload = { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plate.photo }, ...extra }
    const reading = await b.priyaPerson.run('nameplate.read', payload, { commandId })
    readCommands.push({ commandId, payload, reading, plate })
    return reading
  }
  const trane = await read(plates.trane, { equipmentId: condenser.id })
  const carrier = await read(plates.carrier)
  const rheem = await read(plates.rheem)
  await b.tomPerson.run('nameplate.read', { visitId: visit.id, photo: { mediaType: 'image/jpeg', base64: plates.trane.photo } }, { error: 'FORBIDDEN' })

  await scenario(t, 'FIELD-006 point 1: three independent expected proposals and unread fields survive Worker restart without changing equipment', async () => {
    assert.deepEqual(trane.proposed, { make: 'Trane', model: 'XR14', serial: '19243KX1F', manufactured: '2019-06' })
    assert.deepEqual([carrier.proposed, carrier.unread], [{ make: 'Carrier', model: '59TP6', serial: '', manufactured: '2014' }, ['serial']])
    assert.deepEqual([rheem.proposed, rheem.unread], [{ make: 'Rheem', model: 'XE50M06', serial: 'Q031812345', manufactured: '' }, ['manufactured']], '"June 2018" is not a date as printed to a precision, so it is left unread')
    assert.deepEqual(trane.unread, [])
    assert.ok([trane, carrier, rheem].every(r => r.status === 'proposed' && r.model === 'vision-test'))
    const before = await h.state()
    assert.deepEqual(before.equipment, [condenser])
    await h.restart()
    const restarted = await h.state()
    assert.deepEqual(restarted.nameplates, [trane, carrier, rheem])
    assert.deepEqual(restarted.equipment, before.equipment)
    for (const { commandId, payload, reading } of readCommands) assert.deepEqual(await b.priyaPerson.run('nameplate.read', payload, { commandId }), reading)
    assert.deepEqual((await h.state()).nameplates, restarted.nameplates, 'read replay after restart keeps exactly three proposals')
    // Only the photo went to the provider: no customer, site or job details, store off, the owner's key.
    assert.equal(h.models.calls.length, 3)
    for (const call of h.models.calls) {
      assert.equal(call.authorization, 'Bearer synthetic-glove-111')
      assert.equal(call.body.store, false)
      assert.equal(call.body.response_format.type, 'json_schema')
      assert.doesNotMatch(JSON.stringify(call.body), /Harbourview|Harbour St|Mei Lin|Condenser service/)
    }
  })

  await scenario(t, 'FIELD-006 point 6: another technician and desk cannot confirm or discard the proposed fields', async () => {
    const before = await h.state()
    assert.deepEqual(before.equipment.map(e => [e.type, e.make ?? '', e.model ?? '', e.serial ?? '']), [['AC condenser', '', '', '']])
    assert.equal(before.nameplates.length, 3)
    // The key is a credential: never in state or the business export.
    assert.doesNotMatch(JSON.stringify(before), /synthetic-glove-111/)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-111/)
    // Only the technician who took the reading confirms it; the desk cannot.
    await b.tomPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
    await b.dispatcher.run('nameplate.confirm', { readingId: trane.id, version: trane.version, ...trane.proposed }, { error: 'FORBIDDEN' })
    for (const person of [b.tomPerson, b.office, b.dispatcher]) await person.run('nameplate.discard', { readingId: rheem.id, version: rheem.version }, { error: 'FORBIDDEN' })
    const refused = await h.state()
    assert.deepEqual(refused.equipment, before.equipment)
    assert.deepEqual(refused.nameplates, before.nameplates)
  })

  await scenario(t, 'FIELD-006 point 4: each model-labelled reading returns its original photo byte for byte only to authorized readers', async () => {
    for (const { reading, plate } of readCommands) {
      const kept = (await b.priyaPerson.state()).nameplates.find(r => r.id === reading.id)
      assert.deepEqual([kept.model, kept.proposed, kept.unread, kept.by], ['vision-test', reading.proposed, reading.unread, { id: b.priyaPerson.id, name: b.priyaPerson.name }])
      const original = await h.request(`/api/glove/files/${reading.photo.fileId}`, { as: b.priyaPerson.cookie })
      assert.equal(original.status, 200)
      assert.equal(original.headers.get('content-type'), 'image/jpeg')
      assert.deepEqual(Buffer.from(await original.arrayBuffer()), Buffer.from(plate.photo, 'base64'))
      assert.equal((await h.request(`/api/glove/files/${reading.photo.fileId}`, { as: b.tomPerson.cookie })).status, 404)
      assert.equal((await h.request(`/api/glove/files/${reading.photo.fileId}`, { as: '' })).status, 401)
    }
  })

  await scenario(t, 'FIELD-006 point 6: the same technician confirms exact fields, retains corrections separately or discards once; FIELD-011 date precision and manuals remain intact', async () => {
    const correctedId = randomUUID(), exactId = randomUUID(), discardedId = randomUUID()
    const correctedPayload = { readingId: trane.id, version: trane.version, ...trane.proposed, serial: '19243KX1G' }
    const unit = await b.priyaPerson.run('nameplate.confirm', correctedPayload, { commandId: correctedId })
    assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', correctedPayload, { commandId: correctedId }), unit)
    assert.deepEqual([unit.id, unit.make, unit.model, unit.serial, unit.manufacturedOn, unit.location], [condenser.id, 'Trane', 'XR14', '19243KX1G', '2019-06', 'Roof'])
    assert.deepEqual(unit.manual, { manualId: manual.id, title: 'Trane XR14 installer guide', url: 'https://manuals.example.test/trane-xr14.pdf' })
    assert.deepEqual(unit.photos.map(p => p.fileId), [trane.photo.fileId])
    await b.priyaPerson.run('nameplate.confirm', { readingId: trane.id, version: trane.version + 1, ...trane.proposed }, { error: 'READING_STATE' })
    const exactPayload = { readingId: carrier.id, version: carrier.version, type: 'Furnace', location: 'Basement', ...carrier.proposed }
    const furnace = await b.priyaPerson.run('nameplate.confirm', exactPayload, { commandId: exactId })
    assert.deepEqual(await b.priyaPerson.run('nameplate.confirm', exactPayload, { commandId: exactId }), furnace)
    assert.deepEqual([furnace.siteId, furnace.type, furnace.make, furnace.model, furnace.serial, furnace.manufacturedOn, furnace.manual], [b.site.id, 'Furnace', 'Carrier', '59TP6', '', '2014', null], 'no manual in the library, none attached')
    const discardPayload = { readingId: rheem.id, version: rheem.version }
    const beforeDiscard = (await h.state()).equipment
    const discarded = await b.priyaPerson.run('nameplate.discard', discardPayload, { commandId: discardedId })
    assert.deepEqual(await b.priyaPerson.run('nameplate.discard', discardPayload, { commandId: discardedId }), discarded)
    assert.deepEqual((await h.state()).equipment, beforeDiscard, 'discard saves no equipment or equipment photo')
    await b.priyaPerson.run('nameplate.confirm', { readingId: rheem.id, version: discarded.version, type: 'Water heater', ...rheem.proposed }, { error: 'READING_STATE' })
    assert.equal(discarded.status, 'discarded')
    const after = await h.state()
    assert.deepEqual(after.equipment.map(e => e.type).sort(), ['AC condenser', 'Furnace'])
    assert.deepEqual(after.nameplates.map(r => [r.status, r.corrected ?? null]), [['confirmed', ['serial']], ['confirmed', []], ['discarded', null]])
    assert.deepEqual(after.nameplates[0].proposed, trane.proposed)
    assert.deepEqual(after.nameplates[0].confirmed, { ...trane.proposed, serial: '19243KX1G' })
    assert.deepEqual(after.nameplates[1].proposed, carrier.proposed)
    assert.deepEqual(after.nameplates[1].confirmed, carrier.proposed)
    assert.equal(after.nameplates[2].confirmed, undefined)
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
    const { activity, exported } = await assertTrail(h, ['nameplate.read', 'equipment.added', 'equipment.updated', 'nameplate.discarded'])
    for (const [commandId, kind] of [...readCommands.map(r => [r.commandId, 'nameplate.read']), [correctedId, 'equipment.updated'], [exactId, 'equipment.added'], [discardedId, 'nameplate.discarded']]) {
      const events = activity.filter(e => e.commandId === commandId && e.kind === kind)
      assert.equal(events.length, 1, 'each accepted read, confirmation, correction and discard has exactly one event')
      const e = events[0]
      assert.deepEqual([e.actorId, e.actorName, e.actorRole], [b.priyaPerson.id, b.priyaPerson.name, 'technician'])
      const kept = exported.timeline.filter(row => row.id === e.id)
      assert.equal(kept.length, 1)
      assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id], [e.actorId, e.actorName, e.actorRole, commandId])
    }
    assert.deepEqual(await b.priyaPerson.run('nameplate.discard', discardPayload, { commandId: discardedId }), discarded)
    assert.deepEqual((await h.state()).nameplates.find(r => r.id === rheem.id), discarded)
    const commands = (await h.db.prepare("SELECT id,type FROM glove_commands WHERE type IN ('nameplate.read','nameplate.confirm','nameplate.discard')").all()).results
    for (const command of commands) {
      const kind = command.type === 'nameplate.read' ? 'nameplate.read' : command.type === 'nameplate.discard' ? 'nameplate.discarded' : null
      const events = activity.filter(e => e.commandId === command.id && (kind ? e.kind === kind : ['equipment.added', 'equipment.updated'].includes(e.kind)))
      assert.equal(events.length, 1, `${command.type} has one attributable event, including date corrections`)
      const e = events[0], kept = exported.timeline.find(row => row.id === e.id)
      assert.deepEqual([e.actorId, e.actorName, e.actorRole], [b.priyaPerson.id, b.priyaPerson.name, 'technician'])
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.command_id], [e.actorId, e.actorName, e.actorRole, command.id])
    }
    const savedOutcomes = (await h.db.prepare('SELECT result FROM glove_commands').all()).results
    assert.doesNotMatch(JSON.stringify([savedOutcomes, h.logs]), /synthetic-glove-111/)
    assert.ok(activity.some(e => e.kind === 'equipment.updated' && e.actorId === b.priyaPerson.id && e.commandId === correctionId && e.subjectId === condenser.id))
    assert.doesNotMatch(JSON.stringify([restarted, activity, exported]), /synthetic-glove-111/)
  })
  await scenario(t, 'FIELD-006 point 3: only the current assigned technician reads existing or new equipment and only the fixed photo request leaves Glove', async step => {
    const h = await installation()
    step.after(() => h.close())
    const b = await business(h)
    await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'vision-access-test', key: 'synthetic-glove-114' })
    h.models.answer = () => ({ make: 'Trane', model: 'XR14', serial: '', manufactured: '' })
    const unit = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Private condenser type', make: 'Private existing make', serial: 'synthetic-glove-private-serial' })
    const otherSite = await b.office.run('site.save', { customerId: b.customer.id, address: 'Other equipment site' })
    const foreign = await b.office.run('equipment.save', { siteId: otherSite.id, type: 'Foreign furnace' })
    const job = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Private customer job', equipmentIds: [unit.id] })
    const book = (date, start = '09:00', end = '10:00') => b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start, end })
    const working = await book('2026-10-21')
    await b.priyaPerson.run('visit.arrive', { visitId: working.id, deviceTime: '2026-10-20T22:05:00Z' })
    const cancelled = await book('2026-10-22')
    await b.dispatcher.run('visit.cancel', { visitId: cancelled.id, version: cancelled.version, reason: 'Customer cancelled' })
    const reassigned = await book('2026-10-23')
    await b.dispatcher.run('visit.change', { visitId: reassigned.id, version: reassigned.version, technicianId: b.tom.id, reason: 'Assigned to Tom instead' })
    const completed = await completedJob(h, b, '2026-10-24')
    const payload = { visitId: working.id, equipmentId: unit.id, photo: { mediaType: 'image/jpeg', base64: plates.carrier.photo } }
    const before = await h.state(), attempts = h.outbound.attempts
    const fileIds = (await h.db.prepare('SELECT id FROM glove_files ORDER BY id').all()).results
    for (const person of [b.office, b.dispatcher, b.tomPerson]) await person.run('nameplate.read', payload, { error: 'FORBIDDEN' })
    for (const visitId of [cancelled.id, reassigned.id, completed.visit.id]) await b.priyaPerson.run('nameplate.read', { ...payload, visitId }, { error: 'VISIT_STATE' })
    await b.priyaPerson.run('nameplate.read', { ...payload, equipmentId: foreign.id }, { error: 'EQUIPMENT' })
    const refused = await h.state()
    assert.deepEqual(refused.nameplates, before.nameplates)
    assert.deepEqual(refused.equipment, before.equipment)
    assert.deepEqual((await h.db.prepare('SELECT id FROM glove_files ORDER BY id').all()).results, fileIds)
    assert.equal(h.outbound.attempts, attempts, 'refused reads never contact any provider')
    assert.equal(h.models.calls.length, 0)
    const existing = await b.priyaPerson.run('nameplate.read', payload)
    const fresh = await b.priyaPerson.run('nameplate.read', { visitId: working.id, photo: payload.photo })
    assert.deepEqual([existing.equipmentId, fresh.equipmentId], [unit.id, null])
    assert.deepEqual((await h.state()).equipment, before.equipment, 'neither kind of read fills an equipment record')
    assert.equal(h.models.calls.length, 2)
    assert.equal(h.outbound.attempts - attempts, 2)
    for (const call of h.models.calls) {
      assert.equal(call.authorization, 'Bearer synthetic-glove-114')
      assert.deepEqual(call.body, {
        model: 'vision-access-test',
        messages: [
          { role: 'system', content: 'You read the nameplate in this photo of HVAC, plumbing or electrical equipment. Answer only what is printed on it: the manufacturer (make), model number, serial number and manufacture date. Leave a field empty when it is not legible or not printed. Never guess.' },
          { role: 'user', content: [
            { type: 'text', text: 'Read this equipment nameplate.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${plates.carrier.photo}` } },
          ] },
        ],
        store: false,
        response_format: { type: 'json_schema', json_schema: { name: 'nameplate', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['make', 'model', 'serial', 'manufactured'],
          properties: { make: { type: 'string' }, model: { type: 'string' }, serial: { type: 'string' }, manufactured: { type: 'string', description: 'Manufacture date as printed: YYYY, YYYY-MM or YYYY-MM-DD; empty when not shown' } },
        } } },
      })
      const body = JSON.stringify(call.body)
      for (const privateValue of [b.customer.name, b.customer.contact, b.customer.email, b.customer.phone, b.site.address, b.site.accessNotes, job.title, job.id, working.id, b.priyaPerson.name, b.priya.name, b.priya.id, unit.type, unit.make, unit.serial, unit.id]) assert.ok(!body.includes(privateValue), `model input excludes ${privateValue}`)
    }
  })

  await scenario(t, 'FIELD-006 points 2 and 6: withdrawn authority and erased outcomes cannot expose or resurrect a reading on replay', async () => {
    const { commandId, payload, reading } = readCommands[0]
    await h.command('role.set', { operatorId: b.priyaPerson.id, role: 'viewer' })
    const attempts = h.outbound.attempts
    await b.priyaPerson.run('nameplate.read', payload, { commandId, error: 'FORBIDDEN' })
    await h.command('role.set', { operatorId: b.priyaPerson.id, role: 'technician' })
    const preview = await h.command('privacy.preview', { customerId: b.customer.id, version: b.customer.version })
    await h.command('privacy.erase', { customerId: b.customer.id, version: b.customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
    await h.restart()
    await b.priyaPerson.run('nameplate.read', payload, { commandId, error: 'ERASED' })
    assert.equal((await h.request(`/api/glove/files/${reading.photo.fileId}`, { as: b.priyaPerson.cookie })).status, 404)
    const after = await h.state()
    assert.deepEqual(after.nameplates, [])
    assert.deepEqual(after.equipment, [])
    assert.equal(h.outbound.attempts, attempts, 'refused replay never calls the model')
    assert.doesNotMatch(JSON.stringify([after, h.logs, (await h.db.prepare('SELECT result FROM glove_commands').all()).results]), /synthetic-glove-111/)
  })

})
