import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, assertTrail } from './harness.mjs'
import { phoneKeys } from '../fixtures/push-service.mjs'

const start = '2026-11-08T12:00:00.000Z'
const devices = async (h, person) => {
  const response = await h.request('/api/glove/push', { as: person.cookie })
  assert.equal(response.status, 200)
  return (await response.json()).devices
}
const privateKey = async h => JSON.parse((await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first()).value).d
const noSecrets = (value, secrets, surface) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  for (const secret of secrets) assert.ok(!text.includes(secret), `${surface} excludes private push material`)
}
async function subscribe(h, person, label) {
  const phone = await phoneKeys(), commandId = randomUUID()
  const payload = { endpoint: `https://push.example.test/send/${randomUUID()}`, keys: phone.keys, device: label }
  const result = await person.run('push.subscribe', payload, { commandId })
  return { ...result, payload, commandId, phone }
}
async function job(h, b) {
  return b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic subscription visit', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '20.00' }] })
}
const book = (b, j, n = 0) => b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.priya.id, date: `2030-03-${12 + n}`, start: '09:00', end: '10:00' })

// Configuration is one journey, separate from device ownership and revocation.
async function installationKeyJourney() {
  const h = await installation({ at: start, captureLogs: true })
  try {
    const b = await business(h)
    for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent]) await person.run('push.setup', {}, { error: 'FORBIDDEN' })
    const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: randomUUID(), type: 'push.setup', payload: {} } })
    assert.equal(signedOut.status, 401)
    await h.command('push.setup', {})
    const firstKey = (await h.state()).business[0].webPush.publicKey
    const firstPrivate = await privateKey(h)
    const a = await subscribe(h, b.priyaPerson, 'First phone'), z = await subscribe(h, b.tomPerson, 'Other phone')
    const j = await job(h, b)
    await book(b, j)
    assert.equal(h.pushes.sent.length, 1)
    await h.restart()
    assert.equal((await h.state()).business[0].webPush.publicKey, firstKey)
    assert.equal((await devices(h, b.priyaPerson))[0].lastOutcome, 'Handed to the push service')
    await h.command('push.setup', {})
    const secondKey = (await h.state()).business[0].webPush.publicKey
    const secondPrivate = await privateKey(h)
    assert.notEqual(secondKey, firstKey)
    assert.ok(secondPrivate !== firstPrivate, 'rotation replaces the private key too')
    for (const p of [b.priyaPerson, b.tomPerson]) assert.deepEqual(await devices(h, p), [])
    await book(b, j, 1)
    assert.equal(h.pushes.sent.length, 1, 'rotation requires each phone to subscribe afresh')
    await subscribe(h, b.priyaPerson, 'Fresh phone')
    await book(b, j, 2)
    assert.equal(h.pushes.sent.length, 2)
    await h.command('push.setup', { off: true })
    await h.restart()
    assert.equal((await h.state()).business[0].webPush, null)
    assert.equal(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='vapid'").first(), null)
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
    await b.priyaPerson.run('push.subscribe', a.payload, { error: 'PUSH' })
    await book(b, j, 3)
    assert.equal(h.pushes.sent.length, 2, 'disabled phones receive no later push')
    const trail = await assertTrail(h, ['push.enabled', 'push.subscribed', 'push.outcome', 'push.disabled'])
    const secrets = [firstPrivate, secondPrivate, a.payload.endpoint, z.payload.endpoint, ...Object.values(a.payload.keys), ...Object.values(z.payload.keys)]
    for (const path of ['/api/glove/state', '/api/glove/activity', '/api/glove/export']) noSecrets(await (await h.request(path)).text(), secrets, path)
    noSecrets((await h.db.prepare('SELECT * FROM glove_commands').all()).results, secrets, 'saved command outcomes')
    noSecrets(trail, secrets, 'attributable history')
    noSecrets(h.logs, secrets, 'captured Worker logs')
  } finally { await h.close() }
}

async function twoSessionJourney() {
  const h = await installation({ at: start })
  try {
    const b = await business(h)
    await h.command('push.setup', {})
    const second = await h.signIn(b.priyaPerson)
    const a = await subscribe(h, b.priyaPerson, 'Work phone'), z = await subscribe(h, second, 'Spare phone')
    const other = await subscribe(h, b.tomPerson, 'Other technician phone')
    const j = await job(h, b)
    await book(b, j)
    assert.deepEqual(h.pushes.sent.map(p => p.endpoint).sort(), [a.payload.endpoint, z.payload.endpoint].sort())
    await h.restart()
    for (const [person, ownId] of [[b.priyaPerson, a.id], [second, z.id]]) {
      const rows = await devices(h, person)
      assert.deepEqual(rows.map(d => [d.id, d.device, d.thisSession, d.lastOutcome, d.lastAt]).sort(), [
        [a.id, 'Work phone', ownId === a.id, 'Handed to the push service', start],
        [z.id, 'Spare phone', ownId === z.id, 'Handed to the push service', start],
      ].sort())
      noSecrets(rows, [a.payload.endpoint, z.payload.endpoint, ...Object.values(a.payload.keys), ...Object.values(z.payload.keys)], 'own phone list')
    }
    const token = await h.command('token.issue', { name: 'Synthetic desk integration', role: 'dispatcher' })
    const tokenRequest = (path, body) => h.request(path, { as: '', headers: { authorization: `Bearer ${token.token}` }, ...(body ? { method: 'POST', body } : {}) })
    const before = (await h.db.prepare('SELECT * FROM glove_push_subscriptions ORDER BY id').all()).results
    assert.deepEqual((await devices(h, b.tomPerson)).map(d => d.id), [other.id])
    await b.tomPerson.run('push.unsubscribe', { id: a.id })
    for (const type of ['push.setup', 'push.subscribe', 'push.unsubscribe']) {
      await b.office.run(type, type === 'push.subscribe' ? a.payload : { id: a.id }, { error: 'FORBIDDEN' })
      const response = await tokenRequest('/api/glove/commands', { commandId: randomUUID(), type, payload: type === 'push.subscribe' ? a.payload : { id: a.id } })
      assert.equal(response.status, 403)
    }
    assert.deepEqual(await devices(h, b.office), [])
    const tokenList = await tokenRequest('/api/glove/push')
    assert.equal(tokenList.status, 200)
    assert.deepEqual((await tokenList.json()).devices, [])
    assert.deepEqual((await h.db.prepare('SELECT * FROM glove_push_subscriptions ORDER BY id').all()).results, before, 'other identities cannot remove or alter these phones')
    assert.equal((await h.request('/api/glove/push', { as: '' })).status, 401)
    await assertTrail(h, ['push.subscribed', 'push.outcome'])
  } finally { await h.close() }
}

test('FIELD-009 owner key custody and two-session Technician phone ownership', async () => {
  await installationKeyJourney()
  await twoSessionJourney()
})

test('FIELD-009 every subscription-removal trigger independently stops further pushes and preserves unaffected phones after restart', async () => {
  for (const trigger of ['own removal', 'sign out', 'revoke elsewhere', 'expiry', 'role change', 'deactivation', 'HTTP 404', 'HTTP 410', 'owner off']) {
    const h = await installation({ at: start, captureLogs: true })
    try {
      const b = await business(h)
      await h.command('push.setup', {})
      const a = await subscribe(h, b.priyaPerson, 'Affected phone')
      // Later sessions remain live at the first phone's exact expiry boundary.
      await h.setTime('2026-11-08T12:01:00.000Z')
      const second = await h.signIn(b.priyaPerson), unaffected = await subscribe(h, second, 'Second phone')
      const otherPerson = await h.signIn(b.tomPerson), other = await subscribe(h, otherPerson, 'Other technician phone')
      const ownerSession = await (await h.request('/auth/session')).json()
      const owner = await h.signIn({ id: ownerSession.operator.id, name: ownerSession.operator.displayName, session: ownerSession })
      b.dispatcher = await h.signIn(b.dispatcher)
      const j = await job(h, b)
      await book(b, j)
      assert.deepEqual(h.pushes.sent.map(p => p.endpoint).sort(), [a.payload.endpoint, unaffected.payload.endpoint].sort(), `${trigger}: both phones work first`)
      if (trigger === 'own removal') await second.run('push.unsubscribe', { id: a.id })
      if (trigger === 'sign out') assert.equal((await h.request('/auth/signout', { method: 'POST', as: b.priyaPerson.cookie, body: {} })).status, 204)
      if (trigger === 'revoke elsewhere') assert.equal((await h.request('/auth/session/revoke', { method: 'POST', as: second.cookie, body: { sessionId: b.priyaPerson.session.id } })).status, 204)
      if (trigger === 'expiry') await h.setTime(new Date(b.priyaPerson.session.expiresAt).toISOString())
      if (trigger === 'role change') await owner.run('role.set', { operatorId: b.priyaPerson.id, role: 'dispatcher' })
      if (trigger === 'deactivation') assert.equal((await h.request('/auth/operator/status', { method: 'POST', as: owner.cookie, body: { operatorId: b.priyaPerson.id, status: 'inactive' } })).status, 200)
      if (trigger.startsWith('HTTP')) {
        h.pushes.status[a.payload.endpoint] = Number(trigger.slice(5))
        await book(b, j, 1)
        assert.equal(h.pushes.sent.filter(p => p.endpoint === a.payload.endpoint).length, 2, `${trigger}: provider refusal was actually attempted`)
      }
      if (trigger === 'owner off') await owner.run('push.setup', { off: true })
      await h.restart()
      const before = h.pushes.sent.length
      await book(b, j, 2)
      const personGone = ['role change', 'deactivation', 'owner off'].includes(trigger)
      assert.deepEqual(h.pushes.sent.slice(before).map(p => p.endpoint), personGone ? [] : [unaffected.payload.endpoint], `${trigger}: only unaffected session gets a later push`)
      const expected = trigger === 'owner off' ? [] : [other.id, ...(personGone ? [] : [unaffected.id])].sort()
      assert.deepEqual((await h.db.prepare('SELECT id FROM glove_push_subscriptions ORDER BY id').all()).results.map(r => r.id), expected, `${trigger}: exactly the affected subscriptions are deleted`)
      if (['sign out', 'revoke elsewhere', 'expiry', 'deactivation'].includes(trigger)) {
        const replay = await h.request('/api/glove/commands', { method: 'POST', as: b.priyaPerson.cookie, body: { commandId: a.commandId, type: 'push.subscribe', payload: a.payload } })
        assert.equal(replay.status, 401, `${trigger}: ended credential cannot replay a subscription`)
      } else if (trigger === 'role change') {
        await b.priyaPerson.run('push.subscribe', a.payload, { error: 'FORBIDDEN' })
        await b.priyaPerson.run('push.unsubscribe', { id: unaffected.id }, { error: 'FORBIDDEN' })
      } else {
        await b.priyaPerson.run('push.subscribe', a.payload, { commandId: a.commandId })
      }
      assert.deepEqual((await h.db.prepare('SELECT id FROM glove_push_subscriptions ORDER BY id').all()).results.map(r => r.id), expected, `${trigger}: a saved capture never resurrects a removed phone`)
      const serviceBefore = h.pushes.sent.length
      await b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.tom.id, date: '2030-03-16', start: '09:00', end: '10:00' })
      assert.deepEqual(h.pushes.sent.slice(serviceBefore).map(p => p.endpoint), trigger === 'owner off' ? [] : [other.payload.endpoint], `${trigger}: the other Technician still receives pushes`)
      const activity = await (await h.request('/api/glove/activity', { as: owner.cookie })).json()
      const pushEvents = activity.events.filter(e => e.kind.startsWith('push.'))
      assert.ok(pushEvents.length > 0)
      assert.ok(pushEvents.every(e => e.actorId && e.actorName && e.actorRole && e.commandId && e.at), `${trigger}: Activity remains attributable`)
      noSecrets(activity, [a.payload.endpoint, ...Object.values(a.payload.keys)], `${trigger} Activity`)
      const ownerView = await h.request('/api/glove/export', { as: owner.cookie })
      assert.equal(ownerView.status, 200)
      noSecrets(await ownerView.text(), [a.payload.endpoint, ...Object.values(a.payload.keys)], `${trigger} export`)
      noSecrets(h.logs, [a.payload.endpoint, ...Object.values(a.payload.keys)], `${trigger} Worker logs`)
    } finally { await h.close() }
  }
})
