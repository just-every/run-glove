import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { installation, business, postEvents } from './harness.mjs'
import { callbackProvider, receipt } from '../fixtures/mail-providers.mjs'

const providers = ['sendgrid', 'resend', 'postmark', 'ses']
// Stay after certificate notBefore even when a shared runner takes the full
// twenty-minute hard timeout before creating a later provider fixture.
const start = Math.ceil(Date.now() / 60_000) * 60_000 + 30 * 60_000
const iso = offset => new Date(start + offset).toISOString()
const outsider = ['synthetic-glove-outsider', 'example.test'].join('@')
const rejected = { ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } }
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

// Read all durable business tables, including private replay and outcome stores.
// Hash evidence so a failure cannot print retained credentials or personal data.
async function durable(h) {
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove_%' OR name LIKE 'rer_mail_%') ORDER BY name").all()).results
  assert.ok(tables.length > 0)
  const rows = await h.db.batch(tables.map(({ name }) => h.db.prepare(`SELECT * FROM ${name}`)))
  return digest(tables.map(({ name }, i) => [name, rows[i].results.map(r => JSON.stringify(r)).sort()]))
}
async function visible(h) {
  const state = await h.state()
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const exported = await h.request('/api/glove/export').then(r => r.json())
  return digest({ state, activity, exported })
}
async function unchanged(h, input, { status = 401, target = h, logs = status !== 200 && status !== 404, fetches = null } = {}) {
  const before = await durable(h), publicBefore = await visible(h), logAt = h.workerLogs.length, outboundAt = h.outbound.attempts
  const response = await postEvents(target, input)
  assert.equal(response.status, status, 'public callback status')
  assert.deepEqual(await response.json(), status === 404 ? { ok: false, error: { code: 'MAIL', message: 'Customer email is not connected here.' } } : status === 200 ? { ok: true } : rejected, 'opaque response discloses no match or rejection detail')
  assert.equal(await durable(h), before, 'every Glove and mail table is unchanged: no business fact, durable counter, receipt or event identity')
  assert.equal(await visible(h), publicBefore, 'state, delivery warnings, Activity and export are unchanged')
  if (fetches === null) assert.equal(h.outbound.attempts, outboundAt, 'no outbound effect')
  else assert.deepEqual(h.email.fetches.slice(fetches.from), fetches.urls, 'only the pinned certificate is fetched')
  const captured = h.workerLogs.slice(logAt)
  assert.equal(captured.length, logs ? 1 : 0, 'capture every Worker console entry for this request')
  assert.ok(captured.every(entry => entry.level === 'warn' && entry.message === 'Customer email callback rejected'), 'Worker logs contain only the generic warning, with no key, password, signature, address, recipient or event data')
}
async function fixture(t, options = {}) {
  const h = await installation({ at: iso(0), captureLogs: true, ...options })
  t.after(() => h.close())
  const b = await business(h)
  const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Existing cooling request', source: 'phone' })
  const draft = await h.command('quote.draft', { enquiryId: enquiry.id, title: 'Cooling service', lines: [{ serviceId: b.service.id, description: 'Service', quantity: '1', unitPrice: '189.00' }] })
  const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  const send = async () => receipt(h, await h.command('email.send', { kind: 'quote', id: quote.id, version: (await h.state()).quotes.find(q => q.id === quote.id).version }))
  return { h, b, send }
}

test('COMM-013 points 1, 4 and 8: four providers reject unsafe callbacks opaquely without durable, public, network or log disclosure before and after restart', async t => {
  const { h, b, send } = await fixture(t)
  for (const [index, provider] of providers.entries()) {
    await h.setTime(iso(index * 60_000))
    const edge = await callbackProvider(h, provider, { at: iso(0) })
    const warned = await send()
    assert.equal((await postEvents(h, edge.callback(warned, { status: 'bounced' }))).status, 200)
    assert.equal((await h.state()).emailWarnings[b.customer.id].status, 'bounced', 'seed a real warning that unsafe traffic must preserve')
    const message = await send()
    // Warm the legitimate certificate cache; later bad signatures have no fetch.
    assert.equal((await postEvents(h, edge.callback(warned, { status: 'bounced' }))).status, 200)
    for (const restarted of [false, true]) {
      if (restarted) {
        await h.restart()
        if (provider === 'ses') assert.equal((await postEvents(h, edge.callback(warned, { status: 'bounced' }))).status, 200)
      }
      const good = edge.callback(message, { status: 'bounced', id: 'synthetic-glove-refused' })
      await unchanged(h, edge.badSignature(good))
      // Point 1: authenticated bytes are required even for known or absent IDs;
      // malformed delivery JSON is refused identically before and after auth.
      for (const m of [message, { ...message, id: 'synthetic-glove-absent', receipt: 'synthetic-glove-absent' }]) {
        await unchanged(h, edge.badSignature(edge.callback(m)))
      }
      await unchanged(h, edge.badSignature(edge.malformed()))
      await unchanged(h, edge.malformed())
      await unchanged(h, edge.signed(provider === 'sendgrid' ? [{}] : {}))
      await unchanged(h, edge.callback(message, { recipients: [outsider] }))
      // Point 4: rejections do not reserve even a supported event identity.
      assert.equal((await postEvents(h, good)).status, 200)
      // Point 8: signed but unmatched delivery, bounce, complaint and opt-out
      // traffic cannot modify existing customers, requests, inbox or warnings.
      for (const status of ['delivered', 'bounced', 'complained', ...(provider === 'sendgrid' ? ['optedOut'] : [])]) {
        await unchanged(h, edge.callback({ ...message, id: 'synthetic-glove-absent', receipt: 'synthetic-glove-absent' }, { status }), { status: 200 })
      }
    }
  }
})

test('COMM-013 point 2: invalid SNS notifications and confirmations fetch only the pinned certificate and never parse SES or subscribe, including after restart', async t => {
  const { h, send } = await fixture(t)
  const edge = await callbackProvider(h, 'ses', { at: iso(0) }), message = await send()
  for (const restarted of [false, true]) {
    if (restarted) await h.restart()
    // First bad notification must actually retrieve the pinned certificate.
    let from = h.email.fetches.length
    await unchanged(h, edge.badSignature(edge.callback(message)), { fetches: { from, urls: [edge.signer.certUrl] } })
    for (const Type of ['SubscriptionConfirmation', 'UnsubscribeConfirmation']) {
      // A fresh certificate URL also exercises the uncached control-message path.
      const certUrl = edge.signer.certUrl.replace('.pem', `-${Type}.pem`)
      h.email.certificates.set(certUrl, edge.signer.cert)
      from = h.email.fetches.length
      const input = edge.badSignature(edge.signed('subscription', { Type, SigningCertURL: certUrl }))
      await unchanged(h, input, { fetches: { from, urls: [certUrl] } })
      assert.ok(!h.email.fetches.includes(JSON.parse(input.raw).SubscribeURL), 'unverified SubscribeURL is never fetched')
    }
    await unchanged(h, edge.badSignature(edge.malformed()))
    assert.equal(h.email.subscriptions.length, 0)
    // A forged remote certificate location is refused without any network call.
    await unchanged(h, edge.badSignature(edge.signed({}, { SigningCertURL: 'https://outside.example.test/cert.pem' })))
  }
})

test('COMM-013 point 3: each disconnected provider returns 404 without effects before and after Worker restart', async t => {
  const { h, send } = await fixture(t)
  for (const provider of providers) {
    const edge = await callbackProvider(h, provider, { at: iso(0) }), message = await send(), capture = edge.callback(message)
    await h.command('mail.connect', { provider: null })
    await unchanged(h, capture, { status: 404 })
    await unchanged(h, edge.badSignature(edge.malformed()), { status: 404 })
    await h.restart()
    await unchanged(h, capture, { status: 404 })
  }
})

test('COMM-013 point 5: two Worker isolates share transient IP rejection limits while verified traffic, other IPs and the next minute remain usable after restart', async t => {
  const { h, send } = await fixture(t, { isolates: 2 })
  for (const [index, provider] of providers.entries()) {
    const edge = await callbackProvider(h, provider, { at: iso(0) }), message = await send()
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      const peer = await h.mf.getWorker('peer-1'), target = { origin: h.origin, mf: { dispatchFetch: (...args) => peer.fetch(...args) } }
      const clock = async at => {
        await h.setTime(at)
        assert.equal((await peer.fetch(h.origin + '/__test/clock', { method: 'POST', body: JSON.stringify({ at }) })).status, 200)
      }
      const minute = restarted ? 60_000 : 0
      await clock(iso(minute))
      const ip = `192.0.2.${20 + index}`, other = `192.0.2.${30 + index}`
      const address = (input, value = ip) => ({ ...input, headers: { ...input.headers, 'cf-connecting-ip': value } })
      const invalid = address(edge.badSignature(edge.callback(message)))
      // First warm the SES cache so the only possible network effect is excluded.
      assert.equal((await postEvents(h, address(edge.callback(message)))).status, 200)
      assert.equal((await postEvents(target, address(edge.callback(message)))).status, 200)
      for (let n = 0; n < 20; n++) await unchanged(h, invalid, { target: n % 2 ? target : h })
      await unchanged(h, invalid, { status: 429, target })
      await unchanged(h, invalid, { status: 429 })
      await unchanged(h, address(edge.badSignature(edge.callback(message)), other))
      assert.equal((await postEvents(target, address(edge.callback(message)))).status, 200, 'verified event accepted from exhausted address')
      await unchanged(h, address(edge.callback(message, { recipients: [outsider] })), { target })
      await clock(iso(minute + 60_000))
      await unchanged(h, invalid, { target })
      await unchanged(h, invalid)
      if (!restarted) {
        // Restart with the same address and minute exhausted, so a durable
        // counter would incorrectly refuse the next phase's first rejection.
        for (let n = 2; n < 20; n++) assert.equal((await postEvents(n % 2 ? target : h, invalid)).status, 401)
        await unchanged(h, invalid, { status: 429 })
      }
    }
  }
})

test('COMM-013 point 6: opaque unmatched acknowledgements consume no identity, provider ownership is enforced and one wrong recipient refuses the complete batch after restart', async t => {
  const { h, send } = await fixture(t)
  for (const provider of providers) {
    const edge = await callbackProvider(h, provider, { at: iso(0) })
    const known = await send()
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      if (provider === 'ses') assert.equal((await postEvents(h, edge.callback(known))).status, 200)
      const future = { id: 'synthetic-glove-not-sent', receipt: `${({ sendgrid: 'sg', resend: 're', postmark: 'pm', ses: 'ses' })[provider]}-receipt-${h.email.sent.length + 1}`, to: known.to }
      const input = edge.callback(future, { id: `synthetic-glove-reusable-${restarted}` })
      await unchanged(h, input, { status: 200 })
      const sent = await send()
      assert.equal(sent.receipt, future.receipt, 'the provider now accepted the previously absent message')
      const response = await postEvents(h, input)
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { ok: true }, 'matched and unmatched have identical acknowledgements')
      assert.equal((await h.state()).messageStates[sent.id].status, 'delivered', 'same raw capture applies after a real send: no event or SNS envelope identity was consumed')
      const pending = await send()
      const recipients = [pending.to, outsider]
      const batch = provider === 'sendgrid' ? edge.signed([...edge.event(pending), ...edge.event(pending, { recipients: [outsider] })]) : edge.callback(pending, { recipients: provider === 'postmark' ? [outsider] : recipients })
      await unchanged(h, batch)
      if (provider === 'postmark') {
        // Postmark defines one recipient per webhook: an array is not a batch.
        await unchanged(h, edge.signed([edge.event(pending), edge.event(pending, { recipients: [outsider] })]))
      }
      assert.equal((await h.state()).messageStates[pending.id].status, 'accepted')
    }
    // A callback authenticated by another provider cannot borrow this message's
    // ID even when it supplies its real recipient and provider receipt.
    const other = await callbackProvider(h, provider === 'postmark' ? 'sendgrid' : 'postmark', { at: iso(0) })
    await unchanged(h, other.callback(known), { status: 200 })
  }
})
