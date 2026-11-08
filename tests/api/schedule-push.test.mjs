import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { scenario } from '../fixtures/scenario.mjs'
import { installation, business, assertTrail } from './harness.mjs'
import { phoneKeys, decrypt, vapid } from '../fixtures/push-service.mjs'

const initial = '2026-11-09T12:00:00.000Z'
const newLine = 'New visit on your schedule'

async function fixture(t, overrides = {}) {
  // Miniflare converts an outbound-service exception to HTTP 500. Reject at
  // fetch instead, using the harness's existing network-boundary plugin seam.
  const transport = { name: 'synthetic-glove-unreachable-push', setup(build) {
    build.onLoad({ filter: /tests\/api\/worker\.ts$/ }, async ({ path }) => ({ loader: 'ts', contents: (await readFile(path, 'utf8')) + `
const pushNetworkFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.hostname === 'unroutable.example.test') {
    console.log('synthetic-glove-unreachable-push-attempt');
    throw new TypeError('Synthetic push host could not be reached');
  }
  return pushNetworkFetch(input, options);
};` }))
  } }
  const h = await installation({ at: initial, captureLogs: true, workerPlugins: [transport] })
  t.after(() => h.close())
  const b = await business(h, { timezone: 'UTC', ...overrides })
  await h.command('push.setup', {})
  const phones = []
  for (const [name, person] of [['priya-one', b.priyaPerson], ['priya-two', b.priyaPerson], ['tom', b.tomPerson]]) {
    const phone = await phoneKeys(), endpoint = `https://push.example.test/send/${name}`
    const subscription = await person.run('push.subscribe', { endpoint, keys: phone.keys, device: name })
    phones.push({ name, person, phone, endpoint, subscription })
  }
  const job = title => b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ serviceId: b.service.id, description: 'Private service note', quantity: '1', unitPrice: '50.00' }] })
  let at = initial
  const clock = async value => { at = value; await h.setTime(value) }
  const check = async (action, expected = []) => {
    const start = h.pushes.sent.length
    const result = await action()
    if (typeof expected === 'function') expected = expected(result)
    const sent = h.pushes.sent.slice(start)
    assert.deepEqual(sent.map(s => s.endpoint).sort(), expected.map(([p]) => p.endpoint).sort(), 'exactly one attempt per independently expected phone')
    const publicKey = (await h.state()).business[0].webPush.publicKey
    for (const [phone, body, jobId] of expected) {
      const request = sent.find(s => s.endpoint === phone.endpoint)
      assert.deepEqual(JSON.parse(await decrypt(request.body, phone.phone)), { title: 'Glove', body, jobId: jobId ?? null }, 'only the generic line and an opaque single-job id; no customer, site, time or note')
      assert.equal(request.encoding, 'aes128gcm')
      assert.equal(request.ttl, '86400')
      assert.equal(request.body.readUInt32BE(16), 4096)
      assert.equal(request.body[20], 65)
      assert.ok(request.body.length - 86 < 4096, 'one final encrypted record')
      const token = await vapid(request.authorization)
      assert.equal(token.k, publicKey)
      assert.deepEqual(token.header, { typ: 'JWT', alg: 'ES256' })
      assert.deepEqual([token.claims.aud, token.claims.sub], ['https://push.example.test', overrides.email === '' ? h.origin : ['mailto:office', 'harbourair.example'].join('@')])
      const now = Date.parse(at) / 1000
      assert.ok(token.claims.exp > now && token.claims.exp <= now + 12 * 3600, 'VAPID expires within twelve hours of the pinned Worker clock')
    }
    return result
  }
  const priya = (body, jobId) => phones.slice(0, 2).map(p => [p, body, jobId])
  const tom = (body, jobId) => [[phones[2], body, jobId]]
  const devices = async person => {
    const response = await h.request('/api/glove/push', { as: person.cookie })
    assert.equal(response.status, 200)
    return (await response.json()).devices
  }
  return { h, b, phones, job, check, priya, tom, clock, devices }
}

// One journey follows the committed schedule through its producers and phone outcomes.
test('FIELD-010 points 1–5: every schedule producer sends private once-only phone outcomes with attributable failures and subscription control', async t => {
  await scenario(t, 'point 1 and point 2: dispatcher, crew, rule, series, granted agent and public choice send only the independently expected private lines', async step => {
    const { h, b, phones, job, check, priya, tom } = await fixture(step)
    const j = await check(() => job('Private rooftop customer work'))
    const book = (technicianId, date, start = '09:00', end = '10:00', extra = {}) => b.dispatcher.run('visit.book', { jobId: j.id, technicianId, date, start, end, ...extra })
    const bookId = randomUUID(), bookPayload = { jobId: j.id, technicianId: b.priya.id, date: '2026-11-11', start: '09:00', end: '10:00' }
    let v = await check(() => b.dispatcher.run('visit.book', bookPayload, { commandId: bookId }), priya(newLine, j.id))
    await check(() => b.dispatcher.run('visit.book', bookPayload, { commandId: bookId }))
    await assert.rejects(() => decrypt(h.pushes.sent[0].body, phones[1].phone), 'another phone cannot decrypt this body')
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, end: '10:30', reason: 'Private access note' }), priya('Visit moved', j.id))
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '11:00', end: '12:00', reason: 'Private site instruction' }), priya('Visit moved', j.id))
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, reason: 'Unchanged schedule' }))
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, technicianId: b.tom.id, reason: 'Handover' }), [...priya('Visit moved off your schedule', j.id), ...tom(newLine, j.id)])
    await check(() => b.dispatcher.run('visit.cancel', { visitId: v.id, version: v.version, reason: 'Customer postponed' }), tom('Visit canceled', j.id))
    let ended = await check(() => book(b.priya.id, '2026-11-08'))
    ended = await check(() => b.dispatcher.run('visit.change', { visitId: ended.id, version: ended.version, start: '10:00', end: '11:00', reason: 'Correct past time' }))
    await check(() => b.dispatcher.run('visit.cancel', { visitId: ended.id, version: ended.version, reason: 'Past booking correction' }))
    const crew = await check(() => h.command('crew.save', { name: 'Service crew', memberIds: [b.priya.id, b.tom.id] }))
    let group = await check(() => b.dispatcher.run('visit.book', { jobId: j.id, crewId: crew.id, date: '2026-11-12', start: '09:00', end: '10:00' }), [...priya(newLine, j.id), ...tom(newLine, j.id)])
    group = group.visits[0]
    group = await check(() => b.dispatcher.run('visit.change', { visitId: group.id, version: group.version, start: '11:00', end: '12:00', reason: 'Move the crew' }), [...priya('Visit moved', j.id), ...tom('Visit moved', j.id)])
    await check(() => b.dispatcher.run('visit.cancel', { visitId: group.id, version: group.version, reason: 'Cancel crew work' }), [...priya('Visit canceled', j.id), ...tom('Visit canceled', j.id)])
    let agentVisit = await check(() => book(b.priya.id, '2026-11-13', '09:00', '10:00', { window: { start: '08:00', end: '16:00' } }), priya(newLine, j.id))
    const move = { visitId: agentVisit.id, version: agentVisit.version, start: '12:00', end: '13:00', reason: 'Customer requested move' }
    const beforeRefusal = await h.state()
    await check(() => b.agent.run('visit.change', move, { error: 'FORBIDDEN' }))
    assert.deepEqual(await h.state(), beforeRefusal)
    const grant = await check(() => h.command('grant.create', { agentId: b.agent.id, action: 'visit.change' }))
    const moveId = randomUUID()
    agentVisit = await check(() => b.agent.run('visit.change', move, { commandId: moveId }), priya('Visit moved', j.id))
    assert.equal(agentVisit.assignments.at(-1).grantId, grant.id)
    await check(() => b.agent.run('visit.change', move, { commandId: moveId }))
    const currentGrant = (await h.state()).grants.find(g => g.id === grant.id)
    await check(() => h.command('grant.revoke', { grantId: grant.id, version: currentGrant.version }))
    await check(() => b.agent.run('visit.change', { ...move, version: agentVisit.version, start: '14:00', end: '15:00' }, { error: 'FORBIDDEN' }))
    const rule = await check(() => h.command('rule.save', { name: 'Owner first visit', trigger: 'job.created', action: { kind: 'book', technicianId: b.priya.id, afterDays: 2, start: '14:00', end: '15:00' } }))
    const ruleJobId = randomUUID(), rulePayload = { customerId: b.customer.id, siteId: b.site.id, title: 'Private rule-created work' }
    const ruleJob = await check(() => b.dispatcher.run('job.create', rulePayload, { commandId: ruleJobId }), result => priya(newLine, result.id))
    assert.deepEqual((await h.state()).visits.filter(x => x.jobId === ruleJob.id).map(x => [x.technicianId, x.local.date, x.local.start]), [[b.priya.id, '2026-11-11', '14:00']])
    await check(() => b.dispatcher.run('job.create', rulePayload, { commandId: ruleJobId }))
    await check(() => h.command('rule.save', { ...rule, enabled: false }))
    const repeated = await check(() => job('Private repeated work'))
    const seriesPayload = { jobId: repeated.id, version: repeated.version, date: '2026-11-10', rule: { unit: 'week' }, technicianId: b.priya.id, start: '07:00', end: '08:00', horizonDays: 14, until: '2026-11-17' }
    const seriesId = randomUUID()
    await check(() => h.command('series.create', seriesPayload, { commandId: seriesId }), priya('2 changes to your schedule'))
    assert.deepEqual((await h.state()).visits.filter(x => x.jobId === repeated.id).map(x => x.local.date).sort(), ['2026-11-10', '2026-11-17'])
    await check(() => h.command('series.create', seriesPayload, { commandId: seriesId }))
    // The public choice has exactly one free technician; the other has real competing work.
    await check(() => book(b.tom.id, '2026-11-15', '14:00', '15:00'), tom(newLine, j.id))
    const online = await check(() => job('Private online service'))
    const offer = await check(() => h.command('booking.offer', { jobId: online.id, slots: [{ date: '2026-11-15', start: '14:00', end: '15:00', window: { start: '13:00', end: '16:00' } }] }))
    const choose = () => h.request('/api/glove/public/booking', { as: '', method: 'POST', headers: { authorization: `Bearer ${offer.token}` }, body: { slotId: offer.slots[0].id } })
    assert.equal((await check(choose, priya(newLine, online.id))).status, 200)
    assert.equal((await check(choose)).status, 404)
    await h.restart()
    await check(() => b.dispatcher.run('visit.book', bookPayload, { commandId: bookId }))
    await check(() => b.agent.run('visit.change', move, { commandId: moveId }))
  })

  await scenario(t, 'point 1: later move-in and undo notify the already linked technician', async step => {
    const { h, b, phones, check, tom } = await fixture(step)
    const kinds = ['company', 'staff', 'job', 'jobactivity']
    const data = Object.fromEntries(await Promise.all(kinds.map(async k => [k, JSON.parse(await readFile(`tests/fixtures/servicem8-small-hvac/${k}.json`, 'utf8'))])))
    // The first batch establishes source identities; no visit is being imported yet.
    const source = rows => Object.entries(rows).map(([k, v]) => ({ name: `${k}.json`, text: JSON.stringify(v) }))
    const stage = rows => h.command('import.stage', { files: source(rows) })
    const commit = (batch, commandId = randomUUID()) => h.command('import.commit', { batchId: batch.id, version: batch.version, fingerprint: batch.preview.fingerprint }, { commandId })
    await commit(await stage({ company: data.company, staff: data.staff, job: data.job, jobactivity: [] }))
    const tech = (await h.state()).technicians.find(x => x.source?.id === data.staff[1].uuid)
    assert.ok(tech)
    const future = { ...data.jobactivity[1], start_date: '2026-11-12 09:00:00', end_date: '2026-11-12 11:00:00' }
    const batch = await stage({ ...data, jobactivity: [future] })
    const id = randomUUID(), committed = await commit(batch, id)
    assert.ok((await h.state()).visits.some(v => v.id === `sm8-${future.uuid}`))
    assert.equal(h.pushes.sent.length, 0, 'unlinked source technician has no subscribed identity')
    await h.command('technician.save', { ...b.tom, operatorId: null })
    await h.command('technician.save', { ...tech, operatorId: b.tomPerson.id })
    await commit(batch, id)
    assert.equal(h.pushes.sent.length, 0, 'import replay sends nothing')
    const undoId = randomUUID(), undoPayload = { batchId: batch.id, version: committed.version, reason: 'Wrong future booking' }
    await check(() => h.command('import.undo', undoPayload, { commandId: undoId }), tom('Visit canceled', `sm8-${future.job_uuid}`))
    await check(() => h.command('import.undo', undoPayload, { commandId: undoId }))
    assert.equal(h.pushes.sent.length, 1, 'undo removal reaches that technician once')
    assert.deepEqual(JSON.parse(await decrypt(h.pushes.sent[0].body, phones[2].phone)), { title: 'Glove', body: 'Visit canceled', jobId: `sm8-${future.job_uuid}` })
  })
  await scenario(t, 'point 1 and point 3: scheduled billed series extend the horizon once across repeated passes and Worker restart', async step => {
    const { h, b, phones, job, check, priya, clock } = await fixture(step)
    const j = await job('Private recurring service')
    await check(() => h.command('series.create', { jobId: j.id, version: j.version, date: '2026-11-10', rule: { unit: 'week' }, technicianId: b.priya.id, start: '09:00', end: '10:00', horizonDays: 7, billing: { mode: 'per-visit' } }), priya(newLine, j.id))
    assert.equal(h.pushes.sent.length, 2, 'series creation reaches both phones')
    await clock('2026-11-10T12:00:00.000Z')
    await check(() => h.scheduled('2026-11-10T12:00:00.000Z'), priya(newLine, j.id))
    assert.deepEqual((await h.state()).visits.filter(v => v.jobId === j.id).map(v => v.local.date).sort(), ['2026-11-10', '2026-11-17'])
    assert.equal(h.pushes.sent.length, 4, 'new cron occurrence reaches both subscribed phones after commit')
    for (const p of phones.slice(0, 2)) assert.deepEqual(await Promise.all(h.pushes.sent.filter(s => s.endpoint === p.endpoint).map(async s => JSON.parse(await decrypt(s.body, p.phone)))), [{ title: 'Glove', body: newLine, jobId: j.id }, { title: 'Glove', body: newLine, jobId: j.id }])
    await check(() => h.scheduled('2026-11-10T12:00:00.000Z'))
    await h.restart()
    await check(() => h.scheduled('2026-11-10T12:00:00.000Z'))
    assert.equal(h.pushes.sent.length, 4, 'repeated cron and actual restart send nothing again')
  })


  await scenario(t, 'point 3 and point 4: one encrypted attempt records 201, 500, unreachable, 404 and 410 without retry or collateral phone removal', async step => {
    const { h, b, phones, job, check, priya, tom, devices } = await fixture(step)
    const j = await job('Private outcome work')
    let v = await check(() => b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.priya.id, date: '2026-11-12', start: '09:00', end: '10:00' }), priya(newLine, j.id))
    assert.deepEqual((await devices(b.priyaPerson)).map(d => d.lastOutcome), ['Handed to the push service', 'Handed to the push service'])
    h.pushes.status[phones[1].endpoint] = 500
    const moveId = randomUUID(), move = { visitId: v.id, version: v.version, start: '11:00', end: '12:00', reason: 'Move despite provider failure' }
    v = await check(() => b.dispatcher.run('visit.change', move, { commandId: moveId }), priya('Visit moved', j.id))
    assert.deepEqual((await devices(b.priyaPerson)).map(d => [d.device, d.lastOutcome]).sort(), [['priya-one', 'Handed to the push service'], ['priya-two', 'Not sent: the push service answered HTTP 500']])
    const unavailablePhone = await phoneKeys()
    const unavailable = await b.tomPerson.run('push.subscribe', { endpoint: 'https://unroutable.example.test/send/phone', keys: unavailablePhone.keys, device: 'unreachable phone' })
    const outbound = h.outbound.attempts, started = performance.now()
    let other = await check(() => b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.tom.id, date: '2026-11-13', start: '09:00', end: '10:00' }), tom(newLine, j.id))
    assert.equal(h.outbound.attempts - outbound, 1, 'one request to the reachable service')
    const unreachableAttempts = () => h.logs.filter(line => String(line).includes('synthetic-glove-unreachable-push-attempt')).length
    assert.equal(unreachableAttempts(), 1, 'one bounded fetch attempt to the unreachable host')
    assert.ok(performance.now() - started < 15000, 'the unreachable attempt is bounded')
    assert.deepEqual((await devices(b.tomPerson)).map(d => [d.device, d.lastOutcome]).sort(), [['tom', 'Handed to the push service'], ['unreachable phone', 'Not sent: the push service could not be reached']])
    await b.tomPerson.run('push.unsubscribe', { id: unavailable.id })
    h.pushes.status[phones[1].endpoint] = 404
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '13:00', end: '14:00', reason: 'Remove only unknown phone' }), priya('Visit moved', j.id))
    assert.deepEqual((await devices(b.priyaPerson)).map(d => d.id), [phones[0].subscription.id])
    assert.deepEqual((await devices(b.tomPerson)).map(d => d.id), [phones[2].subscription.id])
    h.pushes.status[phones[2].endpoint] = 410
    other = await check(() => b.dispatcher.run('visit.change', { visitId: other.id, version: other.version, start: '11:00', end: '12:00', reason: 'Remove expired phone' }), tom('Visit moved', j.id))
    assert.deepEqual(await devices(b.tomPerson), [])
    assert.deepEqual((await devices(b.priyaPerson)).map(d => d.id), [phones[0].subscription.id])
    const { activity, exported } = await assertTrail(h, ['push.outcome'])
    const expected = [
      [phones[0].subscription.id, b.priya.id, 201], [phones[1].subscription.id, b.priya.id, 201],
      [phones[0].subscription.id, b.priya.id, 201], [phones[1].subscription.id, b.priya.id, 500],
      [phones[2].subscription.id, b.tom.id, 201], [unavailable.id, b.tom.id, 0],
      [phones[0].subscription.id, b.priya.id, 201], [phones[1].subscription.id, b.priya.id, 404],
      [phones[2].subscription.id, b.tom.id, 410],
    ]
    const facts = exported.timeline.filter(e => e.kind === 'push.outcome')
    const projection = facts.map(e => { const d = JSON.parse(e.data); return [d.subscriptionId, d.technicianId, d.status] })
    const order = rows => rows.map(r => JSON.stringify(r)).sort()
    assert.deepEqual(order(projection), order(expected), 'every attempt has one independently expected provider fact')
    for (const event of facts) {
      assert.deepEqual([event.actor_id, event.actor_name, event.actor_role, event.job_id], ['provider:Web Push', 'Web Push', 'provider', j.id])
      assert.ok(event.at && event.command_id)
      assert.deepEqual(JSON.parse(event.data).jobIds, [j.id])
      const visible = activity.find(a => a.id === event.id)
      assert.ok(visible, 'each phone outcome is readable in Activity')
      assert.deepEqual([visible.actorId, visible.actorName, visible.actorRole, visible.commandId, visible.at, visible.summary], [event.actor_id, event.actor_name, event.actor_role, event.command_id, event.at, event.summary])
    }
    for (const value of [JSON.stringify(activity), JSON.stringify(exported), JSON.stringify(await devices(b.priyaPerson))]) {
      for (const phone of [...phones.map(p => p.phone), unavailablePhone]) for (const secret of Object.values(phone.keys)) assert.ok(!value.includes(secret))
      assert.doesNotMatch(value, /push\.example\.test|unroutable\.example\.test|p256dh|privateJwk/)
    }
    const attempts = h.outbound.attempts
    await check(() => b.dispatcher.run('visit.change', move, { commandId: moveId }))
    await h.scheduled(initial)
    await h.restart()
    await h.scheduled(initial)
    await check(() => b.dispatcher.run('visit.change', move, { commandId: moveId }))
    assert.equal(unreachableAttempts(), 1, 'the failed transport is not retried')
    assert.equal(h.outbound.attempts, attempts, '500 and unreachable attempts are never retried by replay, cron or restart')
    assert.equal((await h.request('/api/glove/export').then(r => r.json())).timeline.filter(e => e.kind === 'push.outcome').length, expected.length)
  })

  await scenario(t, 'point 3 and point 5: origin fallback, own phone controls, current authority and erasure cannot revive a notification', async step => {
    const { h, b, phones, job, check, priya, tom, devices } = await fixture(step, { email: '' })
    const j = await job('Private control work')
    let v = await check(() => b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.priya.id, date: '2026-11-12', start: '09:00', end: '10:00' }), priya(newLine, j.id))
    await check(() => b.tomPerson.run('push.unsubscribe', { id: phones[1].subscription.id }))
    assert.equal((await devices(b.priyaPerson)).length, 2, 'another person cannot remove this phone')
    await check(() => b.priyaPerson.run('push.unsubscribe', { id: phones[1].subscription.id }))
    assert.deepEqual((await devices(b.priyaPerson)).map(d => d.id), [phones[0].subscription.id])
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '11:00', end: '12:00', reason: 'Only subscribed phone' }), [[phones[0], 'Visit moved', j.id]])
    phones[1].subscription = await check(() => b.priyaPerson.run('push.subscribe', { endpoint: phones[1].endpoint, keys: phones[1].phone.keys, device: phones[1].name }))
    v = await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '13:00', end: '14:00', reason: 'Both subscribed again' }), priya('Visit moved', j.id))
    await check(async () => assert.equal((await h.request('/auth/signout', { as: b.priyaPerson.cookie, method: 'POST', body: {} })).status, 204))
    assert.equal((await h.request('/api/glove/push', { as: b.priyaPerson.cookie })).status, 401)
    const refused = await h.request('/api/glove/commands', { as: b.priyaPerson.cookie, method: 'POST', body: { commandId: randomUUID(), type: 'push.subscribe', payload: { endpoint: phones[0].endpoint, keys: phones[0].phone.keys } } })
    assert.equal(refused.status, 401)
    await check(() => b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '15:00', end: '16:00', reason: 'Signed-out phones stay silent' }))
    let other = await check(() => b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.tom.id, date: '2026-11-13', start: '09:00', end: '10:00' }), tom(newLine, j.id))
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await check(() => h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' }))
    await h.restart()
    await check(() => b.dispatcher.run('visit.change', { visitId: other.id, version: other.version, start: '11:00', end: '12:00', reason: 'Cannot revive erased visit' }, { error: 'NOT_FOUND' }))
    assert.equal((await h.state()).visits.some(x => x.jobId === j.id), false)
    assert.doesNotMatch(await h.request('/api/glove/export').then(r => r.text()), /Private control work|Harbourview Dental|Gate code at reception/)
    await assertTrail(h, ['push.subscribed', 'push.unsubscribed'])
  })

})
