// FIELD-004 phone notifications through the command, read, auth and export
// doors, with the push service faked at the network edge.
import test, { after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, acceptedQuote } from './harness.mjs'
import { phoneKeys, vapid, decrypt } from '../fixtures/push-service.mjs'

describe('API-001 / DATA-002, DATA-009, DATA-010 / FIELD-004, FIELD-009, FIELD-010 technicians get a push for new, moved and canceled visits, carrying only a generic line and the job id', async (t) => {
  const h = await installation()
  after(() => h.close())
  const b = await business(h)
  const priyaPhone = await phoneKeys(), tomPhone = await phoneKeys()
  const priyaUrl = 'https://push.example.test/send/priya-phone', tomUrl = 'https://push.example.test/send/tom-phone'
  const devices = async person => { const res = await h.request('/api/glove/push', { as: person.cookie }); assert.equal(res.status, 200); return res.json() }
  const rows = async operatorId => (await h.db.prepare('SELECT endpoint FROM glove_push_subscriptions WHERE operator_id=?').bind(operatorId).all()).results.map(r => r.endpoint)
  const received = async (endpoint, phone) => Promise.all(h.pushes.sent.filter(p => p.endpoint === endpoint).map(async p => ({ ...JSON.parse(await decrypt(p.body, phone)), vapid: await vapid(p.authorization), encoding: p.encoding })))

  test('FIELD-004, FIELD-009, FIELD-010 only the owner turns notifications on, and the VAPID private key never leaves the server', async () => {
    await b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: priyaPhone.keys }, { error: 'PUSH' })
    await b.office.run('push.setup', {}, { error: 'FORBIDDEN' })
    await h.command('push.setup', {})
    const publicKey = (await h.state()).business[0].webPush.publicKey
    assert.equal(Buffer.from(publicKey, 'base64url').length, 65)
    const { d } = JSON.parse((await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first()).value)
    for (const path of ['/api/glove/state', '/api/glove/export', '/api/glove/push']) assert.doesNotMatch(await (await h.request(path)).text(), new RegExp(d))
  })

  test('FIELD-004, FIELD-009, FIELD-010 a technician subscribes their own phone; agents and desk roles cannot, and each person reads only their own phones', async () => {
    await b.priyaPerson.run('push.subscribe', { endpoint: 'http://push.example.test/send/plain', keys: priyaPhone.keys }, { error: 'INPUT' })
    await b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: { p256dh: 'AAAA', auth: priyaPhone.keys.auth } }, { error: 'INPUT' })
    await b.agent.run('push.subscribe', { endpoint: 'https://push.example.test/send/agent', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
    await b.office.run('push.subscribe', { endpoint: 'https://push.example.test/send/office', keys: tomPhone.keys }, { error: 'FORBIDDEN' })
    await b.priyaPerson.run('push.subscribe', { endpoint: priyaUrl, keys: priyaPhone.keys, device: 'iPhone' })
    await b.tomPerson.run('push.subscribe', { endpoint: tomUrl, keys: tomPhone.keys, device: 'Android phone' })
    const mine = await devices(b.priyaPerson)
    assert.deepEqual(mine.devices.map(d => [d.device, d.thisSession, d.lastOutcome]), [['iPhone', true, null]])
    assert.doesNotMatch(JSON.stringify(mine), /push\.example\.test|p256dh/, 'the endpoint and keys are not read back')
    assert.deepEqual((await devices(b.tomPerson)).devices.map(d => d.device), ['Android phone'])
    assert.deepEqual((await devices(b.office)).devices, [])
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /push\.example\.test/)
  })

  let job

  test('FIELD-004, FIELD-009, FIELD-010 new, moved and canceled visits each reach the technician\'s phone, signed with the VAPID key and encrypted for that phone', async () => {
    const quote = await acceptedQuote(h, b, 'Rooftop unit service')
    job = await b.dispatcher.run('job.create', { quoteId: quote.id })
    let visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2030-03-12', start: '09:00', end: '10:00' })
    visit = await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, start: '11:00', end: '12:00', reason: 'Customer asked for late morning' })
    visit = await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'Priya is on another job' })
    await b.dispatcher.run('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Customer postponed' })
    const publicKey = (await h.state()).business[0].webPush.publicKey
    const priya = await received(priyaUrl, priyaPhone), tom = await received(tomUrl, tomPhone)
    assert.deepEqual(priya.map(p => [p.title, p.body, p.jobId]), [['Glove', 'New visit on your schedule', job.id], ['Glove', 'Visit moved', job.id], ['Glove', 'Visit moved off your schedule', job.id]])
    assert.deepEqual(tom.map(p => [p.body, p.jobId]), [['New visit on your schedule', job.id], ['Visit canceled', job.id]])
    for (const p of [...priya, ...tom]) {
      assert.deepEqual(Object.keys(p).filter(k => !['vapid', 'encoding'].includes(k)).sort(), ['body', 'jobId', 'title'], 'nothing but the line and the job id')
      assert.equal(p.encoding, 'aes128gcm')
      assert.equal(p.vapid.k, publicKey)
      assert.deepEqual([p.vapid.header.alg, p.vapid.claims.aud, p.vapid.claims.sub], ['ES256', 'https://push.example.test', 'mailto:office@harbourair.example'])
      assert.ok(p.vapid.claims.exp * 1000 > Date.now())
    }
    for (const sent of h.pushes.sent) assert.doesNotMatch(sent.body.toString('latin1'), /Harbourview|Harbour St|Rooftop|Mei Lin/)
    assert.equal((await devices(b.priyaPerson)).devices[0].lastOutcome, 'Handed to the push service')
  })

  test('FIELD-004, FIELD-009, FIELD-010 a failed push is labelled and not retried; a subscription the push service no longer knows is deleted', async () => {
    h.pushes.status[tomUrl] = 500
    const before = h.pushes.sent.length
    const v = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.tom.id, date: '2030-03-13', start: '09:00', end: '10:00' })
    assert.equal(h.pushes.sent.length, before + 1, 'sent once')
    assert.equal((await devices(b.tomPerson)).devices[0].lastOutcome, 'Not sent: the push service answered HTTP 500')
    h.pushes.status[tomUrl] = 410
    await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, start: '10:00', end: '11:00', reason: 'Later start' })
    assert.deepEqual(await rows(b.tomPerson.id), [])
  })

  test('FIELD-004, FIELD-009, FIELD-010 sign-out and role loss delete the phone\'s subscription, and nothing more is sent to it', async () => {
    await b.tomPerson.run('push.subscribe', { endpoint: tomUrl, keys: tomPhone.keys, device: 'Android phone' })
    delete h.pushes.status[tomUrl]
    const signedOut = await h.request('/auth/signout', { method: 'POST', as: b.priyaPerson.cookie, body: {} })
    assert.equal(signedOut.status, 204)
    await h.command('role.set', { operatorId: b.tomPerson.id, role: 'dispatcher' })
    assert.deepEqual(await rows(b.tomPerson.id), [])
    const before = h.pushes.sent.length
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2030-03-14', start: '09:00', end: '10:00' })
    assert.equal(h.pushes.sent.length, before, 'no push to a signed-out phone')
    assert.deepEqual(await rows(b.priyaPerson.id), [])
  })

  test('FIELD-004, FIELD-009, FIELD-010 turning notifications off deletes every phone\'s subscription and the key', async () => {
    const back = await h.person('Pat Field', 'technician')
    await h.command('technician.save', { name: 'Pat F.', operatorId: back.id })
    const subscription = await back.run('push.subscribe', { endpoint: 'https://push.example.test/send/pat', keys: priyaPhone.keys })
    await back.run('push.unsubscribe', { id: subscription.id })
    await back.run('push.subscribe', { endpoint: 'https://push.example.test/send/pat', keys: priyaPhone.keys })
    await h.command('push.setup', { off: true })
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
    assert.equal(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first(), null)
    await back.run('push.subscribe', { endpoint: 'https://push.example.test/send/pat', keys: priyaPhone.keys }, { error: 'PUSH' })
    await assertTrail(h, ['push.enabled', 'push.subscribed', 'push.unsubscribed', 'push.outcome', 'push.disabled'])
  })
})
