import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation, business } from './harness.mjs'

// API-002 (token half; ct approved 19 Oct 19:01Z): the owner issues scoped
// tokens shown once and kept only as SHA-256; a token acts as its role and
// branch through every door, never manages tokens, roles, grants or keys,
// is attributed in Activity, and stops on the request after revocation.

test('API-002, API-006, API-007: a dispatcher-scoped token is refused an owner command and stops once revoked', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  // A token call carries no cookie and, from a server, no Origin header.
  const call = (token, path, body) => h.mf.dispatchFetch(h.origin + path, { method: body ? 'POST' : 'GET', redirect: 'manual', headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const send = async (token, type, payload, commandId = randomUUID()) => { const res = await call(token, '/api/glove/commands', { commandId, type, payload }); return { status: res.status, body: await res.json() } }

  await b.dispatcher.run('token.issue', { name: 'Zap', role: 'dispatcher' }, { error: 'FORBIDDEN' })
  await h.command('token.issue', { name: 'Owner token', role: 'owner' }, { error: 'INPUT' })
  await h.command('token.issue', { name: 'Field token', role: 'technician' }, { error: 'INPUT' })
  const issueId = randomUUID()
  const issued = await h.command('token.issue', { name: 'Crank sync', role: 'dispatcher' }, { commandId: issueId })
  assert.match(issued.token, /^glv_[A-Za-z0-9_-]{43}$/)
  // Shown once: the stored row and the saved outcome hold only the digest; a replay never returns the token.
  const row = await h.db.prepare('SELECT hash FROM glove_tokens WHERE id=?').bind(issued.id).first()
  assert.equal(row.hash, createHash('sha256').update(`glove-token:${issued.token}`).digest('hex'))
  const dump = JSON.stringify((await h.db.prepare('SELECT * FROM glove_commands').all()).results) + JSON.stringify((await h.db.prepare('SELECT * FROM glove_events').all()).results)
  assert.ok(!dump.includes(issued.token))
  assert.equal((await h.command('token.issue', { name: 'Crank sync', role: 'dispatcher' }, { commandId: issueId })).token, undefined)
  assert.ok(!JSON.stringify(await (await h.request('/api/glove/export')).json()).includes(row.hash))

  // The token reads and acts as a Dispatcher, attributed under its own name.
  const read = await call(issued.token, '/api/glove/state')
  assert.equal(read.status, 200)
  const seen = await read.json()
  assert.deepEqual([seen.actor.role, seen.actor.name], ['dispatcher', 'Crank sync (integration token)'])
  assert.equal(seen.integrationTokens.length, 0)
  const drafted = await send(issued.token, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Token quote', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  assert.equal(drafted.status, 200, JSON.stringify(drafted.body))
  const activity = (await (await h.request('/api/glove/activity')).json()).events
  assert.ok(activity.some(e => e.subjectId === drafted.body.result.id && e.actorName === 'Crank sync (integration token)' && e.actorRole === 'dispatcher'))
  assert.ok(activity.some(e => e.kind === 'token.issued' && /issued integration token "Crank sync" acting as dispatcher/.test(e.summary)))

  // Refused every owner command, and never manages tokens, roles, grants or keys.
  for (const [type, payload] of [['payment.autopayAuthorize', {}], ['payment.autopayRevoke', {}], ['payment.autopayCharge', {}], ['customer.hubPreview', {}], ['business.save', { name: 'Taken over' }], ['token.issue', { name: 'Escalate', role: 'dispatcher' }], ['token.revoke', { tokenId: issued.id }], ['role.set', { operatorId: b.office.id, role: 'dispatcher' }], ['grant.create', { agentId: b.agent.id, action: 'visit.book' }], ['model.connect', { url: 'https://models.example.test/v1', model: 'm', key: 'k' }]]) {
    const refused = await send(issued.token, type, payload)
    assert.deepEqual([refused.status, refused.body.error.code], [403, 'FORBIDDEN'], type)
  }
  assert.equal((await call(issued.token, '/api/glove/reports/1099.json?year=2026')).status, 403)

  // A custom-role token follows the role's current permissions.
  const csr = await h.command('role.save', { name: 'Intake', permissions: ['customer.save'] })
  const intake = await h.command('token.issue', { name: 'Web form', role: `custom:${csr.id}` })
  assert.equal((await send(intake.token, 'customer.save', { name: 'Form Lead' })).status, 200)
  await h.command('role.save', { id: csr.id, version: csr.version, name: 'Intake', permissions: ['enquiry.create'] })
  assert.equal((await send(intake.token, 'customer.save', { name: 'Second Lead' })).body.error.code, 'FORBIDDEN')

  // A branch-limited token reads and writes only that branch's records.
  const raleigh = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: ['27601'] })
  const school = await h.command('customer.save', { name: 'Raleigh School' })
  await h.command('site.save', { customerId: school.id, address: '101 Fayetteville St, Raleigh NC 27601', branchId: raleigh.id })
  const scoped = await h.command('token.issue', { name: 'Raleigh board', role: 'viewer', branchId: raleigh.id })
  const branchView = await (await call(scoped.token, '/api/glove/state')).json()
  assert.deepEqual(branchView.customers.map(c => c.name), ['Raleigh School'])
  await h.command('token.issue', { name: 'Nowhere', role: 'viewer', branchId: 'no-such-branch' }, { error: 'INPUT' })

  // The owner lists tokens without secrets; revoking stops the next request.
  const listed = (await h.state()).integrationTokens
  assert.deepEqual(listed.map(x => x.name), ['Crank sync', 'Web form', 'Raleigh board'])
  assert.ok(listed[0].lastUsedAt)
  assert.ok(!JSON.stringify(listed).includes('glv_') && !('hash' in listed[0]))
  await h.command('token.revoke', { tokenId: issued.id })
  const after = await call(issued.token, '/api/glove/state')
  assert.deepEqual([after.status, (await after.json()).error.code], [401, 'AUTH'])
  assert.equal((await send(issued.token, 'customer.save', { name: 'After revoke' })).status, 401)
  assert.equal((await call('glv_' + 'A'.repeat(43), '/api/glove/state')).status, 401)
  assert.ok((await h.state()).events.some(e => e.kind === 'token.revoked'))
})
