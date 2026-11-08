import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation, business, assertTrail, postEvents } from './harness.mjs'
import { postmarkCallback, receipt } from '../fixtures/mail-providers.mjs'

// Read durable results as evidence; every change enters a real HTTP door.
async function snapshot(h) {
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove_%' OR name LIKE 'rer_mail_%') ORDER BY name").all()).results
  return JSON.stringify(await Promise.all(tables.map(async ({ name }) => [name, (await h.db.prepare(`SELECT * FROM ${name}`).all()).results.map(r => JSON.stringify(r)).sort()])))
}
const digest = value => createHash('sha256').update(value).digest('hex')
const auth = value => `Basic ${Buffer.from(value).toString('base64')}`
const rejectedBody = { ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } }
async function refused(h, input, { http = false, status = 401 } = {}) {
  const before = await snapshot(h)
  const response = http
    ? await h.mf.dispatchFetch(h.origin.replace('https:', 'http:') + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', ...input.headers }, body: input.raw })
    : await postEvents(h, input)
  assert.equal(response.status, status, 'unsafe callback refused')
  if (status === 401) assert.deepEqual(await response.json(), rejectedBody)
  assert.equal(await snapshot(h), before, 'refusal changes no business record, credential, outcome, Activity fact or replay identity')
}

async function secretFree(h, secrets) {
  const state = await h.state()
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const exported = await h.request('/api/glove/export').then(r => r.json())
  const outcomes = (await h.db.prepare('SELECT result FROM glove_commands').all()).results
  for (const [label, value] of Object.entries({ state, activity, exported, outcomes, logs: h.logs })) {
    for (const secret of secrets) assert.ok(!JSON.stringify(value).includes(secret), `${label} contains no callback password or provider key`)
  }
}

test('COMM-015 points 1–8: Owner-only Postmark custody survives restart, refuses unsafe callbacks and applies replay once', async t => {
  const h = await installation({ at: '2026-11-08T12:00:00.000Z', captureLogs: true })
  t.after(() => h.close())
  const b = await business(h)
  const connection = { provider: 'postmark', apiKey: 'synthetic-glove-127', fromEmail: ['synthetic-glove-office', 'example.test'].join('@') }
  const scopedOwner = await h.person('Scoped Mail Owner', 'owner')
  await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: 'main' })
  const excluded = [b.office, b.dispatcher, scopedOwner]
  const denied = async (person, type, payload) => {
    const before = await snapshot(h)
    await person.run(type, payload, { error: 'FORBIDDEN' })
    assert.equal(await snapshot(h), before, `${person.name} cannot change callback custody`)
  }
  for (const person of excluded) await denied(person, 'mail.connect', connection)

  // Point 1: first owner response only; a replay returns the retained safe result.
  const connectId = randomUUID()
  const connected = await h.command('mail.connect', connection, { commandId: connectId })
  const first = connected.callbackPassword
  assert.match(first, /^[a-f0-9]{64}$/, '32 random bytes encoded as hex')
  const connectReplay = await h.command('mail.connect', connection, { commandId: connectId })
  assert.equal(connectReplay.callbackPassword, undefined)
  assert.deepEqual(connectReplay, Object.fromEntries(Object.entries(connected).filter(([key]) => key !== 'callbackPassword')))
  for (const person of excluded) {
    await denied(person, 'mail.connect', connection)
    await denied(person, 'mail.callback', { action: 'rotate' })
  }

  // Point 2: only the independently computed SHA-256 is kept. The production
  // Basic verifier compares digests using node:crypto timingSafeEqual.
  const stored = await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()
  assert.equal(stored.current_hash, digest(first))
  assert.equal(stored.previous_hash, null)
  assert.ok(!JSON.stringify(stored).includes(first))
  await secretFree(h, [first, connection.apiKey])
  const draft = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Postmark custody service', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  const send = async () => {
    const current = (await h.state()).quotes.find(q => q.id === quote.id)
    const message = await h.command('email.send', { kind: 'quote', id: quote.id, version: current.version })
    const sent = h.email.sent.at(-1)
    // Point 8: check every actual Postmark send at the network edge.
    assert.deepEqual([sent.provider, sent.authorization, sent.body.Metadata.glove_delivery_id], ['postmark', connection.apiKey, message.id])
    return receipt(h, message)
  }
  const message = await send()
  const at = '2026-11-08T12:00:00.000Z'
  const input = postmarkCallback(message, first, { at, id: 'synthetic-glove-1' })
  for (const authorization of [undefined, auth(`other:${first}`), 'Basic %%%', 'Bearer synthetic-glove-1', auth('glove:short'), auth(`glove:${'0'.repeat(64)}`)]) {
    await refused(h, { ...input, headers: authorization ? { authorization } : {} })
  }

  // Point 5: off by default, so a valid credential works without an IP header.
  assert.equal((await h.state()).business[0].mail.postmarkAllowlist, false)
  assert.equal((await postEvents(h, input)).status, 200)
  assert.equal((await h.state()).messageStates[message.id].status, 'delivered')

  // Points 1, 2 and 7 after actual Worker disposal and recreation with disk D1.
  await h.restart()
  assert.equal((await h.command('mail.connect', connection, { commandId: connectId })).callbackPassword, undefined)
  assert.equal((await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()).current_hash, digest(first))
  let before = await snapshot(h)
  assert.equal((await postEvents(h, input)).status, 200)
  assert.equal(await snapshot(h), before, 'persisted Postmark ID replay has no second effect')
  await refused(h, { ...input, headers: { authorization: auth(`other:${first}`) } })

  // Point 6: even correct Basic over HTTP makes no durable write.
  await refused(h, input, { http: true })

  // Point 7: ID is namespaced by RecordType, and both forms apply exactly once.
  const bounce = postmarkCallback(message, first, { at, id: 'synthetic-glove-1', details: { RecordType: 'Bounce', Type: 'SoftBounce' } })
  assert.equal((await postEvents(h, bounce)).status, 200)
  const noIdMessage = await send()
  const noId = postmarkCallback(noIdMessage, first, { at })
  assert.equal((await postEvents(h, noId)).status, 200)
  const outcomes = async () => (await h.state()).events.filter(e => ['email.delivered', 'email.deferred'].includes(e.kind))
  assert.deepEqual((await outcomes()).map(e => [e.subjectId, e.kind]).sort(), [[message.id, 'email.delivered'], [message.id, 'email.deferred'], [noIdMessage.id, 'email.delivered']].sort())
  before = await snapshot(h)
  for (const event of [input, bounce, noId]) assert.equal((await postEvents(h, event)).status, 200)
  assert.equal(await snapshot(h), before, 'identical events with and without ID apply once')
  await h.restart()
  before = await snapshot(h)
  for (const event of [input, bounce, noId]) assert.equal((await postEvents(h, event)).status, 200)
  assert.equal(await snapshot(h), before, 'both replay identities survive a real Worker restart')
  const aged = await send()
  await refused(h, postmarkCallback(aged, first, { at: '2026-11-01T11:59:59.999Z', id: 'synthetic-glove-old' }))
  assert.equal((await postEvents(h, postmarkCallback(aged, first, { at: '2026-11-01T12:00:00.000Z', id: 'synthetic-glove-boundary' }))).status, 200, 'exactly seven days is accepted')

  // Point 3: a real rotation, persisted overlap and exclusive 24-hour boundary.
  const rotateId = randomUUID()
  const rotated = await h.command('mail.callback', { action: 'rotate' }, { commandId: rotateId })
  const second = rotated.callbackPassword
  assert.match(second, /^[a-f0-9]{64}$/)
  assert.notEqual(second, first, 'independently generated credential')
  assert.equal((await h.command('mail.callback', { action: 'rotate' }, { commandId: rotateId })).callbackPassword, undefined)
  const overlap = await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()
  assert.deepEqual([overlap.current_hash, overlap.previous_hash, overlap.previous_until], [digest(second), digest(first), '2026-11-09T12:00:00.000Z'])
  await h.restart()
  assert.equal((await h.command('mail.callback', { action: 'rotate' }, { commandId: rotateId })).callbackPassword, undefined)
  await h.setTime('2026-11-09T11:59:59.999Z')
  const overlapOld = await send(), overlapNew = await send()
  assert.equal((await postEvents(h, postmarkCallback(overlapOld, first, { at: '2026-11-09T11:59:59.999Z' }))).status, 200, 'previous credential works one millisecond before expiry after restart')
  assert.equal((await postEvents(h, postmarkCallback(overlapNew, second, { at: '2026-11-09T11:59:59.999Z' }))).status, 200)
  await h.setTime('2026-11-09T12:00:00.000Z')
  await h.restart()
  const boundary = await send()
  const boundaryEvent = postmarkCallback(boundary, first, { at: '2026-11-09T12:00:00.000Z' })
  await refused(h, boundaryEvent)
  assert.equal((await postEvents(h, postmarkCallback(boundary, second, { at: '2026-11-09T12:00:00.000Z' }))).status, 200, 'current credential works at previous expiry')
  const third = (await h.command('mail.callback', { action: 'rotate' })).callbackPassword
  const revocation = await send(), revocationAt = '2026-11-09T12:00:00.000Z'
  assert.equal((await postEvents(h, postmarkCallback(revocation, second, { at: revocationAt }))).status, 200)
  await h.command('mail.callback', { action: 'revokePrevious' })
  await refused(h, postmarkCallback(revocation, second, { at: revocationAt }))
  assert.equal((await postEvents(h, postmarkCallback(revocation, third, { at: revocationAt }))).status, 200)
  const revoked = await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()
  assert.deepEqual([revoked.previous_hash, revoked.previous_until], [null, null])

  // Point 5: the optional dated source-pinned list fails closed and supplements Basic.
  await h.command('mail.callback', { action: 'allowlist', enabled: true })
  const listed = { 'cf-connecting-ip': '3.134.147.250' }
  const allowed = postmarkCallback(revocation, third, { at: revocationAt, headers: listed })
  await refused(h, postmarkCallback(revocation, third, { at: revocationAt }))
  await refused(h, postmarkCallback(revocation, third, { at: revocationAt, headers: { 'cf-connecting-ip': '192.0.2.10' } }))
  await refused(h, { ...allowed, headers: listed })
  await refused(h, postmarkCallback(revocation, '0'.repeat(64), { at: revocationAt, headers: listed }))
  assert.equal((await postEvents(h, allowed)).status, 200)
  const fourth = (await h.command('mail.connect', connection)).callbackPassword
  assert.notEqual(fourth, third)
  assert.equal((await h.state()).business[0].mail.postmarkAllowlist, true)
  await h.restart()
  await refused(h, postmarkCallback(revocation, fourth, { at: revocationAt }))
  await refused(h, postmarkCallback(revocation, fourth, { at: revocationAt, headers: { 'cf-connecting-ip': '192.0.2.10' } }))
  assert.equal((await postEvents(h, postmarkCallback(revocation, fourth, { at: revocationAt, headers: listed }))).status, 200)
  await h.command('mail.callback', { action: 'allowlist', enabled: false })
  assert.equal((await postEvents(h, postmarkCallback(revocation, fourth, { at: revocationAt }))).status, 200)

  // Point 4 and inherited audit and secret duties: facts retain exact actor,
  // action and time, and no secret reaches state, saved results, export or logs.
  const trail = await assertTrail(h, ['mail.connected', 'mail.callback.rotate', 'mail.callback.revokePrevious', 'mail.callback.allowlist'])
  const facts = trail.activity.filter(e => e.kind.startsWith('mail.callback.'))
  assert.deepEqual(facts.map(e => e.kind).sort(), ['mail.callback.rotate', 'mail.callback.rotate', 'mail.callback.revokePrevious', 'mail.callback.allowlist', 'mail.callback.allowlist'].sort())
  const owner = await h.request('/auth/session').then(r => r.json())
  for (const fact of facts) {
    assert.deepEqual([fact.actorId, fact.actorName, fact.actorRole], [owner.operator.id, 'Olivia Owner', 'owner'])
    assert.ok(['2026-11-08T12:00:00.000Z', revocationAt].includes(fact.at))
    const kept = trail.exported.timeline.find(e => e.id === fact.id)
    const data = typeof kept.data === 'string' ? JSON.parse(kept.data) : kept.data
    assert.equal(data.provider, 'postmark')
    assert.equal(data.action, fact.kind.slice('mail.callback.'.length))
  }
  assert.ok(h.logs.some(line => String(line).includes('Customer email callback rejected')), 'Worker console warnings were actually captured')
  await secretFree(h, [first, second, third, fourth, connection.apiKey])

  // An authenticated replay cannot restore erased customer or message data.
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.equal((await h.state()).messages.length, 0)
  assert.equal((await h.state()).customers.find(c => c.id === customer.id).email, undefined)
  await h.restart()
  before = await snapshot(h)
  for (const [target, id] of [[message, 'synthetic-glove-1'], [noIdMessage, undefined], [revocation, 'synthetic-glove-after-erasure']]) {
    assert.equal((await postEvents(h, postmarkCallback(target, fourth, { at: revocationAt, id }))).status, 200)
  }
  assert.equal(await snapshot(h), before, 'authenticated callbacks after erasure resurrect no personal data or facts')

  // Point 3: disconnect while both hashes are active revokes both immediately.
  await h.command('mail.connect', { provider: null })
  for (const credential of [third, fourth]) await refused(h, postmarkCallback(revocation, credential, { at: revocationAt, headers: listed }), { status: 404 })
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_mail_callback_auth').first()).n, 0)
  await h.restart()
  for (const credential of [third, fourth]) await refused(h, postmarkCallback(revocation, credential, { at: revocationAt, headers: listed }), { status: 404 })
  await secretFree(h, [first, second, third, fourth, connection.apiKey])
})
