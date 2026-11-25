import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { installation } from './harness.mjs'

test('mail-off deployments refuse email and admit the owner with a one-time link', async t => {
  const at = '2026-11-25T12:00:00.000Z'
  const h = await installation({ at, mailOff: true })
  t.after(() => h.close())

  const email = 'owner@example.test'
  const magic = await h.request('/auth/magic-link', { method: 'POST', as: '', body: { email } })
  assert.equal(magic.status, 503)
  assert.deepEqual(await magic.json(), { error: 'mail_off' })
  const invite = await h.request('/auth/invite', { method: 'POST', body: { email: 'tech@example.test', displayName: 'Field Technician', role: 'member' } })
  assert.equal(invite.status, 503)
  assert.deepEqual(await invite.json(), { error: 'mail_off' })

  await h.command('business.save', { name: 'Harbour Plumbing', timezone: 'UTC' })
  await h.command('mail.connect', { provider: 'postmark', fromEmail: 'office@example.test', apiKey: 'test-only-key' })
  await h.command('mail.morning', { enabled: true, time: '07:30' })
  const customer = await h.command('customer.save', { name: 'Alex Chen', email: 'alex@example.test' })
  const site = await h.command('site.save', { customerId: customer.id, address: '42 Harbor Road' })
  const draft = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Replace leaking faucet',
    lines: [{ description: 'Faucet replacement', quantity: '1', unitPrice: '140.00' }] })
  const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  await h.command('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'mail_off' })
  await h.scheduled(at)
  assert.deepEqual((await h.state()).messages, [])

  const token = randomBytes(32).toString('base64url')
  const digest = createHash('sha256').update(`owner-signin\0${token}`).digest('hex')
  const now = Date.parse(at)
  // Stand in for the deployer's D1 API write. Claim, preview, redemption and
  // session read still go through the Worker's normal HTTP doors.
  await h.db.prepare(`INSERT INTO oa_owner_signins
    (id, token_hash, operator_id, operator_version, created_at, expires_at)
    SELECT ?, ?, id, version, ?, ? FROM oa_operators WHERE email=? AND role='owner'`)
    .bind(randomUUID(), digest, now, now + 60_000, email).run()
  assert.equal((await h.request(`/auth/owner-signin?token=${token}`, { as: '' })).status, 200)
  const redeem = () => h.request('/auth/owner-signin', { method: 'POST', as: '', body: { token } })
  const confirmed = await redeem()
  assert.equal(confirmed.status, 303)
  const cookie = confirmed.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
  const session = await h.request('/auth/session', { as: cookie })
  assert.equal(session.status, 200)
  assert.equal((await session.json()).operator.email, email)
  assert.equal((await redeem()).status, 400)
  assert.equal(h.outbound.attempts, 0)
})
