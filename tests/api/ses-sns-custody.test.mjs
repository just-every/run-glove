import test from 'node:test'
import assert from 'node:assert/strict'
import { X509Certificate } from 'node:crypto'
import { installation, business, assertTrail, postEvents, snsEvents } from './harness.mjs'

const pins = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:synthetic-glove-mail', configurationSet: 'synthetic-glove-outcomes' }
const accessKeyId = 'synthetic-glove-17'.replaceAll('-', '').toUpperCase().padEnd(16, '0')
const secretAccessKey = 'synthetic-glove-secret-17'
const sessionToken = 'synthetic-glove-session-17'
const token = 'synthetic-glove-subscription-17'
const connection = sns => ({ provider: 'ses', apiKey: JSON.stringify({ accessKeyId, secretAccessKey, sessionToken }), fromEmail: ['synthetic-glove-office', 'example.test'].join('@'), sns })
const iso = ms => new Date(ms).toISOString()

async function fixture(t) {
  const signer = snsEvents(pins, { days: 3 })
  const now = Date.parse(new X509Certificate(signer.cert).validFrom) + 60_000
  const h = await installation({ at: iso(now), captureLogs: true }); t.after(() => h.close())
  const b = await business(h)
  const draft = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'SNS custody service', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  await h.command('mail.connect', connection(pins))
  h.email.certificates.set(signer.certUrl, signer.cert)
  const send = async () => {
    const q = (await h.state()).quotes.find(q => q.id === quote.id)
    const message = await h.command('email.send', { kind: 'quote', id: q.id, version: q.version })
    return { ...message, receipt: `ses-receipt-${h.email.sent.length}` }
  }
  let address = 0
  const post = input => postEvents(h, { ...input, headers: { ...input.headers, 'cf-connecting-ip': `192.0.2.${++address}` } })
  const signed = (payload, overrides = {}) => signer.signed(payload, { Timestamp: iso(now), ...overrides })
  return { h, signer, now, send, post, signed }
}

function outcome(m, at, type = 'Delivery', detail = {}, settings = pins) {
  const key = type === 'Rendering Failure' || type === 'RenderingFailure' ? 'failure' : type[0].toLowerCase() + type.slice(1)
  return { eventType: type, mail: { messageId: m.receipt, timestamp: at, destination: [m.to], tags: { 'ses:configuration-set': [settings.configurationSet], glove_delivery_id: [Buffer.from(m.id).toString('base64url')] } }, [key]: { timestamp: at, recipients: [m.to], ...detail } }
}
async function snapshot(h) {
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove_%' OR name LIKE 'rer_mail_%') ORDER BY name").all()).results
  return JSON.stringify(await Promise.all(tables.map(async ({ name }) => [name, (await h.db.prepare(`SELECT * FROM ${name}`).all()).results.map(row => JSON.stringify(row)).sort()])))
}
async function refused(f, input, { noFetch = false } = {}) {
  const before = await snapshot(f.h), fetches = f.h.email.fetches.length
  const response = await f.post(input)
  assert.equal(response.status, 401, await response.clone().text())
  assert.equal((await response.json()).error.code, 'MAIL_EVENT')
  assert.equal(await snapshot(f.h), before, 'refusal changes no business data, outcome, receipt, verification time or timeline fact')
  if (noFetch) assert.equal(f.h.email.fetches.length, fetches, 'refusal makes no certificate or subscription request')
}
async function accepted(f, input) {
  const response = await f.post(input)
  assert.equal(response.status, 200, await response.text())
}
const rows = async (h, table) => (await h.db.prepare(`SELECT * FROM ${table} ORDER BY 1,2`).all()).results

// Each registration qualifies one clause point through the production commands
// and callback route; certificates and responses are faked only at the SNS edge.
test('COMM-017 point 1: owner pins reject malformed sources and reconnect withdraws old pins', async t => {
  const f = await fixture(t), { h, now, send, signed } = f
  const m = await send(), payload = outcome(m, iso(now))
  for (const change of [{ region: 'us-east-1.evil' }, { region: 'https://us-east-1' }, { topicArn: pins.topicArn.replace('us-east-1', 'us-west-2') }, { topicArn: 'not-an-arn' }, { configurationSet: 'bad set' }, { configurationSet: ['bad', 'set'].join('/') }]) {
    const before = await h.state(), requests = h.email.fetches.length
    await h.command('mail.connect', connection({ ...pins, ...change }), { error: 'INPUT' })
    assert.deepEqual(await h.state(), before)
    assert.equal(h.email.fetches.length, requests)
  }
  await refused(f, signed(payload, { TopicArn: pins.topicArn + '-other' }), { noFetch: true })
  await refused(f, signed(payload, { SigningCertURL: f.signer.certUrl.replace('us-east-1', 'us-west-2') }), { noFetch: true })
  await refused(f, signed(outcome(m, iso(now), 'Delivery', {}, { ...pins, configurationSet: 'foreign' })))
  await accepted(f, signed(payload))
  assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
  const next = { region: 'us-west-2', topicArn: 'arn:aws:sns:us-west-2:123456789012:synthetic-glove-new', configurationSet: 'synthetic-glove-new' }
  const signer = snsEvents(next, { days: 3 })
  h.email.certificates.set(signer.certUrl, signer.cert)
  await h.command('mail.connect', connection(next))
  const second = await send()
  await refused(f, signed(outcome(second, iso(now))), { noFetch: true })
  const newSigned = p => signer.signed(p, { Timestamp: iso(now) })
  await refused(f, newSigned(outcome(second, iso(now))))
  await accepted(f, newSigned(outcome(second, iso(now), 'Delivery', {}, next)))
  assert.equal((await h.state()).messageStates[second.id].status, 'delivered')
})

test('COMM-017 point 2: signatures, certificate URL custody, redirects and bounded cache', async t => {
  const f = await fixture(t), { h, signer, now, send, signed } = f
  const payload = outcome(await send(), iso(now))
  const mismatch = signed(payload); mismatch.headers['x-amz-sns-message-type'] = 'SubscriptionConfirmation'
  await refused(f, mismatch, { noFetch: true })
  await refused(f, signed(payload, { SignatureVersion: '3' }), { noFetch: true })
  for (const SigningCertURL of [signer.certUrl.replace('https:', 'http:'), signer.certUrl + '?q=1', signer.certUrl + '#fragment', signer.certUrl.replace('https://', 'https://synthetic-glove:password@'), signer.certUrl.replace('.com/', '.com:8443/'), signer.certUrl.replace('us-east-1', 'us-west-2'), signer.certUrl.replace('.com/', '.com.evil.example/'), signer.certUrl.replace('/SimpleNotificationService-', '/other-')]) {
    await refused(f, signed(payload, { SigningCertURL }), { noFetch: true })
  }
  // A cryptographic signature needs the certificate first. Warm it with v1,
  // then prove a wrong signature cannot cause a further network request.
  await accepted(f, signed(payload, { SignatureVersion: '1', Subject: 'SES outcome' }))
  assert.deepEqual(h.email.fetches, [signer.certUrl])
  const bad = signed(payload), envelope = JSON.parse(bad.raw)
  envelope.Signature = Buffer.alloc(256).toString('base64'); bad.raw = JSON.stringify(envelope)
  await refused(f, bad, { noFetch: true })
  const second = await send()
  await accepted(f, signed(outcome(second, iso(now)), { SignatureVersion: '2' }))
  assert.equal((await h.state()).messageStates[second.id].status, 'delivered', 'version 2 verifies independently of the version 1 outcome')
  await h.setTime(iso(now + 3_599_000))
  await accepted(f, signed(payload, { Timestamp: iso(now + 3_599_000) }))
  assert.equal(h.email.fetches.length, 1)
  await h.setTime(iso(now + 3_600_000))
  await accepted(f, signed(payload, { Timestamp: iso(now + 3_600_000) }))
  assert.equal(h.email.fetches.length, 2, 'one-hour cache boundary refetches')
  const redirected = snsEvents(pins, { days: 3 }), redirectTarget = signer.certUrl.replace('SimpleNotificationService-', 'SimpleNotificationService-target-')
  h.email.snsReply = request => request.url === redirected.certUrl ? new Response(null, { status: 302, headers: { location: redirectTarget } }) : null
  await refused(f, redirected.signed(payload, { Timestamp: iso(now + 3_600_000) }))
  assert.equal(h.email.fetches.at(-1), redirected.certUrl)
  assert.ok(!h.email.fetches.includes(redirectTarget), 'certificate redirect is never followed')
  h.email.snsReply = null
  const short = snsEvents(pins), replacement = snsEvents(pins, { days: 3 }), expires = Date.parse(new X509Certificate(short.cert).validTo)
  h.email.certificates.set(short.certUrl, short.cert)
  await h.setTime(iso(expires - 30_000))
  await accepted(f, short.signed(payload, { Timestamp: iso(expires - 30_000) }))
  const fetched = h.email.fetches.length
  await h.setTime(iso(expires - 1_000))
  await accepted(f, short.signed(payload, { Timestamp: iso(expires - 1_000) }))
  assert.equal(h.email.fetches.length, fetched)
  h.email.certificates.set(short.certUrl, replacement.cert)
  await h.setTime(iso(expires + 1_000))
  await accepted(f, replacement.signed(payload, { SigningCertURL: short.certUrl, Timestamp: iso(expires + 1_000) }))
  assert.equal(h.email.fetches.length, fetched + 1, 'shorter certificate validity ends cache reuse')
})

test('COMM-017 point 3: exact timestamp boundaries accept and one second beyond refuses', async t => {
  const f = await fixture(t)
  for (const offset of [-3_600_000, 300_000]) {
    const message = await f.send(), payload = outcome(message, iso(f.now))
    await accepted(f, f.signed(payload, { Timestamp: iso(f.now + offset) }))
    assert.equal((await f.h.state()).messageStates[message.id].status, 'delivered')
  }
  const payload = outcome(await f.send(), iso(f.now))
  for (const offset of [-3_601_000, 301_000]) await refused(f, f.signed(payload, { Timestamp: iso(f.now + offset) }), { noFetch: true })
})

test('COMM-017 point 4: signed configuration and delivery tags bind every SES send', async t => {
  const f = await fixture(t), { h, send, now, signed } = f
  const messages = [await send(), await send()]
  assert.equal(h.email.sent.length, 2)
  for (const [i, m] of messages.entries()) {
    const out = h.email.sent[i]
    assert.equal(out.provider, 'ses')
    assert.equal(out.body.ConfigurationSetName, pins.configurationSet)
    assert.deepEqual(out.body.EmailTags, [{ Name: 'glove_delivery_id', Value: Buffer.from(m.id).toString('base64url') }])
    assert.equal(Buffer.from(out.body.EmailTags[0].Value, 'base64url').toString(), m.id)
  }
  assert.notEqual(h.email.sent[0].body.EmailTags[0].Value, h.email.sent[1].body.EmailTags[0].Value)
  const payload = outcome(messages[0], iso(now))
  await refused(f, { raw: JSON.stringify(payload), headers: {} }, { noFetch: true })
  for (const tags of [{ glove_delivery_id: payload.mail.tags.glove_delivery_id }, { ...payload.mail.tags, 'ses:configuration-set': ['foreign'] }, { 'ses:configuration-set': [pins.configurationSet] }, { ...payload.mail.tags, glove_delivery_id: ['bad!tag'] }, { ...payload.mail.tags, glove_delivery_id: ['='] }]) {
    await refused(f, signed({ ...payload, mail: { ...payload.mail, tags } }))
  }
  for (const m of messages) {
    assert.equal((await h.state()).messageStates[m.id].status, 'accepted')
    await accepted(f, signed(outcome(m, iso(now))))
    assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
  }
})

test('COMM-017 point 5: SNS and SES replays apply once and changed-body reuse refuses', async t => {
  const f = await fixture(t), m = await f.send(), payload = outcome(m, iso(f.now)), signed = f.signed(payload)
  await accepted(f, signed)
  const inspect = async () => {
    const state = await f.h.state(), trail = await assertTrail(f.h, ['email.delivered'])
    return { status: state.messageStates[m.id], facts: trail.exported.timeline.filter(e => e.subject_id === m.id && e.kind === 'email.delivered'), receipts: await rows(f.h, 'rer_mail_event_receipts') }
  }
  const first = await inspect(), snsFirst = await rows(f.h, 'glove_mail_sns_receipts')
  assert.equal(first.status.status, 'delivered'); assert.equal(first.facts.length, 1); assert.equal(first.receipts.length, 1); assert.equal(snsFirst.length, 1)
  await accepted(f, signed)
  assert.deepEqual(await inspect(), first); assert.deepEqual(await rows(f.h, 'glove_mail_sns_receipts'), snsFirst)
  await accepted(f, f.signed(payload))
  assert.deepEqual(await inspect(), first)
  assert.equal((await rows(f.h, 'glove_mail_sns_receipts')).length, 2, 'distinct SNS envelopes each retain their own identity; SES effect remains once')
  await refused(f, f.signed(outcome(m, iso(f.now), 'Reject'), { MessageId: JSON.parse(signed.raw).MessageId }))
  await f.h.restart()
  assert.deepEqual(await inspect(), first)
  await accepted(f, signed)
  assert.deepEqual(await inspect(), first)
})

test('COMM-017 point 6: confirmation fetch is checked, exact, once and never follows redirects', async t => {
  const f = await fixture(t), { h, signed, now } = f
  // Warm the certificate so refusals can prove zero confirmation fetches even
  // for a cryptographically invalid signature.
  await accepted(f, signed(outcome(await f.send(), iso(now))))
  const confirm = overrides => signed('synthetic-glove-confirmation', { Type: 'SubscriptionConfirmation', Token: token, ...overrides })
  const good = confirm(), goodUrl = JSON.parse(good.raw).SubscribeURL
  const hostile = [goodUrl.replace('https:', 'http:'), goodUrl.replace('us-east-1', 'us-west-2'), goodUrl.replace('.com/', '.com.evil.example/'), goodUrl.replace('https://', 'https://user@'), goodUrl.replace('.com/', '.com:8443/'), goodUrl + '#fragment', goodUrl + '&extra=1', goodUrl.replace('ConfirmSubscription', 'Unsubscribe'), goodUrl.replace('Token=', 'OtherToken='), goodUrl.replace('Token=' + token, 'Token=wrong'), goodUrl.replace('TopicArn=', 'OtherTopic=')]
  for (const SubscribeURL of hostile) await refused(f, confirm({ SubscribeURL }), { noFetch: true })
  await refused(f, confirm({ Timestamp: iso(now - 3_601_000) }), { noFetch: true })
  await refused(f, confirm({ TopicArn: pins.topicArn + '-other' }), { noFetch: true })
  const unsigned = confirm(), e = JSON.parse(unsigned.raw); e.Signature = Buffer.alloc(256).toString('base64'); unsigned.raw = JSON.stringify(e)
  await refused(f, unsigned, { noFetch: true })
  await refused(f, { raw: good.raw, headers: {} }, { noFetch: true })
  assert.equal(h.email.subscriptions.length, 0)
  await accepted(f, good); await accepted(f, good)
  assert.deepEqual(h.email.subscriptions, [goodUrl])
  const url = new URL(h.email.subscriptions[0])
  assert.deepEqual([url.protocol, url.hostname, url.port, url.username, url.password, url.pathname, url.hash], ['https:', 'sns.us-east-1.amazonaws.com', '', '', '', '/', ''])
  assert.deepEqual([...url.searchParams], [['Action', 'ConfirmSubscription'], ['TopicArn', pins.topicArn], ['Token', token]])
  await assertTrail(h, ['mail.subscription.confirmed'])
  const redirectTarget = 'https://sns.us-east-1.amazonaws.com/synthetic-glove-redirect'
  const redirected = confirm({ MessageId: 'synthetic-glove-redirected-confirmation' })
  h.email.snsReply = request => new URL(request.url).searchParams.get('Action') === 'ConfirmSubscription' ? new Response(null, { status: 302, headers: { location: redirectTarget } }) : null
  await accepted(f, redirected)
  assert.equal(h.email.subscriptions.length, 2)
  assert.ok(!h.email.fetches.includes(redirectTarget))
  await accepted(f, redirected)
  assert.equal(h.email.subscriptions.length, 2, 'failed confirmation is not fetched again on replay')
  const state = await h.state()
  assert.match(state.mailCallbacks.warning, /outcome is unknown/)
  await assertTrail(h, ['mail.subscription.confirmationFailed'])
})

test('COMM-017 point 7: unsubscribe persists an owner warning in state and Activity without fetching', async t => {
  const f = await fixture(t), { h, signed, now } = f
  await accepted(f, signed(outcome(await f.send(), iso(now))))
  const input = signed('synthetic-glove-unsubscribe', { Type: 'UnsubscribeConfirmation', Token: token })
  const fetches = [...h.email.fetches]
  await accepted(f, input)
  assert.deepEqual(h.email.fetches, fetches)
  assert.equal(h.email.subscriptions.length, 0)
  assert.match((await h.state()).mailCallbacks.warning, /cancelled the email-event subscription/)
  const trail = await assertTrail(h, ['mail.subscription.unsubscribed'])
  const warnings = trail.activity.filter(e => e.kind === 'mail.subscription.unsubscribed')
  assert.equal(warnings.length, 1); assert.match(warnings[0].summary, /Warning:.*cancelled/)
  await h.restart()
  assert.match((await h.state()).mailCallbacks.warning, /cancelled the email-event subscription/)
  await accepted(f, input)
  assert.deepEqual((await assertTrail(h, ['mail.subscription.unsubscribed'])).activity.filter(e => e.kind === 'mail.subscription.unsubscribed'), warnings)
  assert.deepEqual(h.email.fetches, [...fetches, f.signer.certUrl], 'restart refetches only the signing certificate')
})

test('COMM-017 point 8: every SES outcome retains exact state and secret-free facts across Worker restart', async t => {
  const f = await fixture(t), { h, send, now, signed, signer } = f
  const cases = [
    ['Delivery', {}, 'delivered'],
    ['Bounce', { bounceType: 'Permanent' }, 'bounced'],
    ['Bounce', { bounceType: 'Transient' }, 'failed'],
    ['DeliveryDelay', {}, 'deferred'],
    ['Complaint', {}, 'complained'],
    ['Reject', {}, 'rejected'],
    ['RenderingFailure', {}, 'rejected'],
    ['Rendering Failure', {}, 'rejected'],
  ]
  const messages = []
  for (const [i, [type, detail, status]] of cases.entries()) {
    const m = await send(), at = iso(now + (i + 1) * 1_000)
    if (type === 'Bounce') detail.bouncedRecipients = [{ emailAddress: m.to }]
    if (type === 'Complaint') detail.complainedRecipients = [{ emailAddress: m.to }]
    const input = signed(outcome(m, at, type, detail))
    await accepted(f, input)
    const state = (await h.state()).messageStates[m.id]
    assert.deepEqual([state.status, state.providerMessageId, state.at], [status, m.receipt, at], type)
    messages.push({ m, at, type, status, input })
  }
  await accepted(f, signed('synthetic-glove-confirmation', { Type: 'SubscriptionConfirmation', Token: token }))
  const inspect = async () => {
    const state = await h.state(), trail = await assertTrail(h, ['email.delivered', 'email.bounced', 'email.failed', 'email.deferred', 'email.complained', 'email.rejected', 'mail.subscription.confirmed'])
    const saved = (await h.db.prepare('SELECT result FROM glove_commands ORDER BY id').all()).results
    const visible = JSON.stringify({ state, ...trail, saved, logs: h.logs })
    for (const secret of [accessKeyId, secretAccessKey, sessionToken, token, signer.cert, signer.cert.split('\n')[1]]) assert.ok(!visible.includes(secret), 'credentials, subscription token and certificate never enter state, outcomes, Activity, business export or Worker logs')
    for (const { m, at, type, status } of messages) {
      const facts = trail.exported.timeline.filter(e => e.subject_id === m.id && e.kind === `email.${status}`)
      assert.equal(facts.length, 1, type)
      const fact = facts[0], data = JSON.parse(fact.data), activity = trail.activity.find(e => e.id === fact.id)
      assert.deepEqual([data.messageId, data.provider, data.providerMessageId, data.status, data.occurredAt], [m.id, 'ses', m.receipt, status, at])
      assert.deepEqual([activity.kind, activity.actorName, activity.actorRole, activity.subjectId], [`email.${status}`, 'Amazon SES', 'provider', m.id])
      assert.equal(activity.summary, fact.summary)
      assert.ok(activity.summary.includes(m.to)); assert.ok(activity.summary.includes(m.receipt)); assert.ok(activity.summary.includes(at))
    }
    return { states: state.messageStates, messages: state.messages, activity: trail.activity, timeline: trail.exported.timeline, saved, sns: await rows(h, 'glove_mail_sns_receipts'), ses: await rows(h, 'rer_mail_event_receipts') }
  }
  const retained = await inspect()
  assert.equal(retained.sns.length, 9); assert.equal(retained.ses.length, 8)
  await h.restart()
  assert.deepEqual(await inspect(), retained, 'actual Worker disposal and recreation retains states, saved results, both receipt sets and Activity and exported facts')
  for (const { input } of messages) await accepted(f, input)
  assert.deepEqual(await inspect(), retained)
  assert.equal(h.email.sent.length, 8, 'callbacks, confirmation, restart and replays never resend mail')
})
