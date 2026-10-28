// COMM-001 customer email through the owner's provider (fakes only at the
// provider edge): the owner connects SendGrid, the desk emails an approved
// quote, an approved invoice (to the accounts-payable address) and a purchase
// order to its supplier; signed delivered and bounced events are replayed to
// the public event door; each message's state reads on the timeline, the
// customer carries the bounce warning with what to do next, the COMM-007
// stream shows each email, and Activity and the export keep every new fact
// without a key. Resend, through the same Base mail adapter, correlates by its
// receipt.
import { connectMail, receipt, textOf } from '../fixtures/mail-providers.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, completedJob, assertTrail, mailEvents, postEvents, snsEvents } from './harness.mjs'

test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 a quote, an invoice and a purchase order emailed through the owner\'s provider record delivered and bounced from signed provider events', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const customer = await h.command('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Harbourview Dental', email: 'mei@harbourview.example', apEmail: 'payables@harbourview.example', phone: '02 9555 0101', contact: 'Dr Mei Lin', billingAddress: '14 Harbour St, Balmain NSW 2041' })
  const draft = await b.dispatcher.run('quote.draft', { customerId: customer.id, siteId: b.site.id, title: 'Replace condenser fan', lines: [{ description: 'Condenser fan motor', quantity: '1', unitPrice: '420.00', serviceId: b.service.id }] })
  let quote = await b.dispatcher.run('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  await b.dispatcher.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'MAIL' })

  // Only the owner connects; the key and event key are never read back.
  const sendgrid = mailEvents('sendgrid'), apiKey = 'SG.test-only-customer-mail-key'
  const connect = { provider: 'sendgrid', apiKey, eventKey: sendgrid.eventKey, fromEmail: 'office@harbourair.example', fromName: 'Harbour Air & Electrical' }
  await b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
  await h.command('mail.connect', { ...connect, eventKey: 'whsec_not-a-sendgrid-key' }, { error: 'INPUT' })
  await h.command('mail.connect', { ...connect, fromEmail: 'not an address' }, { error: 'INPUT' })
  await h.command('mail.connect', connect)

  // The quote goes to the customer's own address; a technician never emails.
  await b.priyaPerson.run('email.send', { kind: 'quote', id: quote.id, version: quote.version }, { error: 'FORBIDDEN' })
  const quoteMail = await b.dispatcher.run('email.send', { kind: 'quote', id: quote.id, version: quote.version })
  const quoteSent = h.email.sent.at(-1)
  assert.equal(quoteSent.authorization, `Bearer ${apiKey}`)
  assert.deepEqual([quoteSent.to, quoteSent.body.from.email, quoteSent.body.custom_args.rer_delivery_id], ['mei@harbourview.example', 'office@harbourair.example', quoteMail.id])
  assert.match(quoteSent.body.content[0].value, new RegExp(`${quote.number} \\(revision 1\\)[\\s\\S]*Condenser fan motor[\\s\\S]*Total: \\$`))
  quote = (await h.state()).quotes.find(q => q.id === quote.id)
  assert.deepEqual([quote.status, quote.sent.at(-1).channel, quote.sent.at(-1).messageId], ['sent', 'email', quoteMail.id])

  // The invoice goes to accounts payable; only who approves invoices emails one.
  const { job } = await completedJob(h, b)
  let inv = await b.office.run('invoice.prepare', { jobId: job.id })
  await b.office.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'INVOICE_STATE' })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  await b.dispatcher.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version }, { error: 'FORBIDDEN' })
  const invoiceMail = await b.office.run('email.send', { kind: 'invoice', id: inv.id, version: inv.version })
  assert.equal(h.email.sent.at(-1).to, 'payables@harbourview.example')
  assert.match(h.email.sent.at(-1).body.content[0].value, new RegExp(`invoice ${inv.number} for ${job.number}`))

  // The purchase order goes to its supplier's address and is then sent.
  const part = await h.command('service.save', { code: 'FAN-MTR', name: 'Condenser fan motor', kind: 'material', unit: 'each', unitCost: '180.00', unitPrice: '420.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const po = await b.office.run('po.save', { supplier: 'Supply Co', supplierEmail: 'orders@supplyco.example', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: part.id, quantity: '1' }] })
  const poMail = await b.office.run('email.send', { kind: 'purchaseOrder', id: po.id, version: po.version })
  assert.equal(h.email.sent.at(-1).to, 'orders@supplyco.example')
  const sentPo = (await h.state()).purchaseOrders.find(o => o.id === po.id)
  assert.deepEqual([sentPo.status, sentPo.sent.method, sentPo.sent.messageId], ['sent', 'email', poMail.id])

  // A refused send shows on the record with what to do next.
  const refusedCustomer = await h.command('customer.save', { name: 'Bad Address Co', email: 'refused@example.test' })
  const refusedSite = await h.command('site.save', { customerId: refusedCustomer.id, address: '1 Nowhere Rd' })
  const refusedDraft = await b.dispatcher.run('quote.draft', { customerId: refusedCustomer.id, siteId: refusedSite.id, title: 'Service', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  const refusedQuote = await b.dispatcher.run('quote.approve', { quoteId: refusedDraft.id, version: refusedDraft.version, revision: 1 })
  h.email.status['refused@example.test'] = 400
  const refusedMail = await b.dispatcher.run('email.send', { kind: 'quote', id: refusedQuote.id, version: refusedQuote.version })

  let states = (await h.state()).messageStates
  assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['accepted', 'accepted', 'accepted'])
  assert.deepEqual([states[refusedMail.id].status, states[refusedMail.id].next], ['rejected', 'Check the email connection and the address, then send again.'])

  // Signed events: unsigned, wrongly signed and wrong-recipient batches change nothing.
  const at = Math.floor(Date.now() / 1000)
  const sgEvent = (m, event, n, email = m.to) => ({ email, timestamp: at + n, event, sg_event_id: `sg-event-${m.id}-${event}`, sg_message_id: `sg-receipt-${n}.filter0001`, rer_delivery_id: m.id })
  const batch = [sgEvent(quoteMail, 'delivered', 1), sgEvent(invoiceMail, 'bounce', 2), sgEvent(poMail, 'delivered', 3)]
  assert.equal((await postEvents(h, { raw: JSON.stringify(batch), headers: {} })).status, 401)
  assert.equal((await postEvents(h, mailEvents('sendgrid').signed(batch))).status, 401)
  assert.equal((await postEvents(h, sendgrid.signed([sgEvent(quoteMail, 'delivered', 1, 'someone@else.example')]))).status, 401)
  assert.deepEqual(Object.values((await h.state()).messageStates).map(s => s.status).sort(), ['accepted', 'accepted', 'accepted', 'rejected'])
  const delivered = await postEvents(h, sendgrid.signed(batch))
  assert.equal(delivered.status, 200, await delivered.clone().text())
  assert.equal((await postEvents(h, sendgrid.signed(batch))).status, 200, 'a replayed batch is acknowledged')

  const state = await h.state()
  states = state.messageStates
  assert.deepEqual([quoteMail, invoiceMail, poMail].map(m => states[m.id].status), ['delivered', 'bounced', 'delivered'])
  assert.equal(states[invoiceMail.id].text, 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)')
  // The bounce warning is on the customer, with what to do next.
  assert.deepEqual(state.emailWarnings[customer.id], { messageId: invoiceMail.id, to: 'payables@harbourview.example', status: 'bounced', at: states[invoiceMail.id].at, text: states[invoiceMail.id].text, next: 'Check the address with the customer, correct it on their record and send again.' })

  // Each message's state reads on the timeline, once per provider event.
  const timeline = (await (await h.request(`/api/glove/jobs/${job.id}/timeline`)).json()).events
  const about = id => timeline.filter(e => e.subjectId === id).map(e => [e.kind, e.actorRole])
  assert.deepEqual(about(invoiceMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.bounced', 'provider']])
  assert.deepEqual(about(poMail.id), [['email.queued', 'office'], ['email.accepted', 'provider'], ['email.delivered', 'provider']])

  // COMM-007: each email is in the customer's and the job's stream, in order, with direction, channel, author and state.
  const stream = async q => (await (await h.request(`/api/glove/conversation?${q}`)).json()).entries.filter(e => e.channel === 'email').map(e => [e.kind, e.direction, e.author, e.to, e.delivery])
  assert.deepEqual(await stream(`customerId=${customer.id}`), [
    ['quote emailed', 'outbound', 'Sam Ortiz', 'mei@harbourview.example', 'Delivered to mei@harbourview.example\'s mail server (reported by SendGrid)'],
    ['invoice emailed', 'outbound', 'Olu Office', 'payables@harbourview.example', 'Bounced: payables@harbourview.example did not accept it (reported by SendGrid)'],
    ['purchase order emailed', 'outbound', 'Olu Office', 'orders@supplyco.example', 'Delivered to orders@supplyco.example\'s mail server (reported by SendGrid)'],
  ])
  assert.deepEqual((await stream(`jobId=${job.id}`)).map(e => e[0]), ['invoice emailed', 'purchase order emailed'])

  // DATA-002: every new fact is in Activity and the export with its provider reference, never a key.
  const { exported } = await assertTrail(h, ['mail.connected', 'email.queued', 'email.accepted', 'email.rejected', 'email.delivered', 'email.bounced'])
  assert.equal(exported.messages.length, 4)
  assert.ok(exported.timeline.some(e => e.kind === 'email.accepted' && JSON.parse(e.data).providerMessageId === 'sg-receipt-1'))
  assert.equal(exported.timeline.filter(e => e.kind === 'email.delivered').length, 2, 'a replayed event is recorded once')
  const everything = JSON.stringify(exported) + JSON.stringify(state)
  assert.ok(!everything.includes(apiKey) && !everything.includes(sendgrid.eventKey), 'no provider key in state or export')

  // Resend through the same Base mail adapter: its receipt correlates its signed events.
  const resend = mailEvents('resend')
  await h.command('mail.connect', { provider: 'resend', apiKey: 're_test_only_key', eventKey: resend.eventKey, fromEmail: 'office@harbourair.example' })
  const again = (await h.state()).quotes.find(q => q.id === quote.id)
  const resent = await b.office.run('email.send', { kind: 'quote', id: again.id, version: again.version })
  const viaResend = h.email.sent.at(-1)
  assert.deepEqual([viaResend.provider, viaResend.idempotencyKey, viaResend.to], ['resend', resent.id, 'mei@harbourview.example'])
  const resendEvent = { type: 'email.delivered', created_at: new Date().toISOString(), data: { email_id: `re-receipt-${h.email.sent.length}`, to: ['mei@harbourview.example'] } }
  assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 200)
  assert.equal((await h.state()).messageStates[resent.id].status, 'delivered')
  await h.command('mail.connect', { provider: null })
  await b.office.run('email.send', { kind: 'quote', id: again.id, version: again.version + 1 }, { error: 'MAIL' })
  assert.equal((await postEvents(h, resend.signed(resendEvent))).status, 404)
  await providerDocuments()
})

// COMM-001 inherits AGENT-008's morning email: opt-in by the owner, one email
// to the owner's sign-in address per business-local date, its provider outcome
// from the answer and signed events, and nothing sent by opening the brief.
test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 the owner\'s morning brief email is sent once per business-local date and records the provider outcome', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  const sendgrid = mailEvents('sendgrid'), apiKey = 'SG.test-only-morning-mail-key'
  const connect = { provider: 'sendgrid', apiKey, eventKey: sendgrid.eventKey, fromEmail: 'office@harbourair.example', fromName: 'Harbour Air & Electrical' }
  await h.command('mail.morning', { enabled: true }, { error: 'MAIL' })
  await h.command('mail.connect', connect)
  await b.office.run('mail.morning', { enabled: true }, { error: 'FORBIDDEN' })
  await h.command('mail.morning', { enabled: true, time: '7am' }, { error: 'INPUT' })
  // Sydney is UTC+11 in late October: 07:30 local on 2026-10-23 is 20:30Z on the 22nd.
  await h.command('mail.morning', { enabled: true, time: '07:30' })

  // Opening the brief sends nothing; nothing is due before the chosen local time.
  const brief = await (await h.request('/api/glove/brief?at=2026-10-22T20:29:00Z')).json()
  assert.deepEqual([h.email.sent.length, brief.emailed.enabled, brief.emailed.status], [0, true, 'scheduled'])
  await h.scheduled('2026-10-22T20:29:00Z')
  assert.equal(h.email.sent.length, 0)

  // Two runs at the chosen time send one email: to the owner, with the brief's own items.
  await Promise.all([h.scheduled('2026-10-22T20:30:00Z'), h.scheduled('2026-10-22T20:30:00Z')])
  assert.equal(h.email.sent.length, 1)
  const sent = h.email.sent[0], text = sent.body.content[0].value
  assert.deepEqual([sent.to, sent.authorization, sent.body.custom_args.rer_delivery_id, sent.body.subject], ['owner@example.test', `Bearer ${apiKey}`, 'brief:2026-10-23', 'Morning brief for 2026-10-23 from Harbour Air & Electrical'])
  assert.match(text, new RegExp(`Unbilled work\\n- ${job.number} for Harbourview Dental is complete with no invoice`))
  await h.scheduled('2026-10-22T21:30:00Z')
  assert.equal(h.email.sent.length, 1, 'a later run on the same local date sends nothing more')

  // The provider's answer, then its signed events for that recipient only.
  const at = Math.floor(Date.now() / 1000)
  const event = (n, email = 'owner@example.test') => ({ email, timestamp: at + n, event: 'delivered', sg_event_id: `sg-brief-${n}`, sg_message_id: 'sg-receipt-1.filter0001', rer_delivery_id: 'brief:2026-10-23' })
  assert.equal((await (await h.request('/api/glove/brief?at=2026-10-22T20:30:00Z')).json()).emailed.status, 'accepted')
  assert.equal((await postEvents(h, sendgrid.signed([event(1, 'someone@else.example')]))).status, 401)
  assert.equal((await postEvents(h, sendgrid.signed([event(2)]))).status, 200)
  assert.equal((await postEvents(h, sendgrid.signed([event(2)]))).status, 200, 'a replayed event is acknowledged')
  const delivered = (await (await h.request('/api/glove/brief?at=2026-10-22T20:30:00Z')).json()).emailed
  assert.deepEqual([delivered.status, delivered.to, delivered.text], ['delivered', 'owner@example.test', 'Delivered to owner@example.test\'s mail server (reported by SendGrid)'])

  // The next date is its own delivery; a refusal is recorded with what to do and never retried.
  h.email.status['owner@example.test'] = 400
  await h.scheduled('2026-10-23T20:30:00Z')
  await h.scheduled('2026-10-23T21:00:00Z')
  assert.equal(h.email.sent.length, 2)
  const refused = (await (await h.request('/api/glove/brief?at=2026-10-23T20:30:00Z')).json()).emailed
  assert.deepEqual([refused.date, refused.status, refused.next], ['2026-10-24', 'rejected', 'Check the email connection; Glove does not retry, and sends the next brief on the next business-local date.'])

  // Turned off, nothing goes; DATA-002: each fact is in Activity and the export, never a key.
  await h.command('mail.morning', { enabled: false })
  await h.scheduled('2026-10-24T20:30:00Z')
  assert.equal(h.email.sent.length, 2)
  const { exported } = await assertTrail(h, ['mail.morning', 'email.queued', 'email.accepted', 'email.delivered', 'email.rejected'])
  assert.deepEqual(exported.timeline.filter(e => e.subject_kind === 'brief').map(e => e.kind), ['email.queued', 'email.accepted', 'email.delivered', 'email.queued', 'email.rejected'])
  assert.ok(!JSON.stringify(exported).includes(apiKey) && !JSON.stringify(exported).includes(sendgrid.eventKey), 'no provider key in the export')
  await providerMornings()
})

// Inspect durable identities as evidence; mutations and assertions enter via
// the real provider and owner HTTP doors. The fake clock is solely in worker.ts.
async function mailSnapshot(h) {
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove_%' OR name LIKE 'rer_mail_%') ORDER BY name").all()).results
  return JSON.stringify(await Promise.all(tables.map(async ({ name }) => [name, (await h.db.prepare(`SELECT * FROM ${name}`).all()).results.map(r => JSON.stringify(r)).sort()])))
}
const clock = (h, at) => h.request('/__test/clock', { method: 'POST', body: { at } })
const basic = value => ({ authorization: `Basic ${Buffer.from(`glove:${value}`).toString('base64')}` })
const pmEvent = (m, type = 'Delivery', more = {}) => ({ RecordType: type, MessageID: m.receipt, Recipient: m.to, DeliveredAt: new Date().toISOString(), Metadata: { glove_delivery_id: m.id }, ...more })
async function emailFixture(h, b) {
  const draft = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Callback authentication', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  return h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
}
async function assertRejected(h, input, status = 401) {
  const before = await mailSnapshot(h), response = await postEvents(h, input)
  assert.equal(response.status, status, await response.clone().text())
  assert.deepEqual(await response.json(), { ok: false, error: { code: 'MAIL_EVENT', message: 'Not accepted: the signature, the event form or the message it names did not match.' } })
  assert.equal(await mailSnapshot(h), before, 'rejection writes no product, Activity, callback counter, replay ID, warning or inbound record')
}

test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 callback boundary authenticates before lookup, ignores unmatched without IDs, refuses whole wrong-recipient batches and limits only rejected IP traffic', async t => {
  const h = await installation({ isolates: 2 }); t.after(() => h.close())
  const peer = await h.mf.getWorker('peer-1')
  const b = await business(h), q = await emailFixture(h, b), signer = mailEvents('sendgrid')
  await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'test-only-sendgrid-callback', eventKey: signer.eventKey, fromEmail: 'office@example.test' })
  const sent = await h.command('email.send', { kind: 'quote', id: q.id, version: q.version })
  const event = { email: sent.to, timestamp: Math.floor(Date.now() / 1000), event: 'delivered', sg_event_id: 'shared-delivered', sg_message_id: 'sg-receipt-1', rer_delivery_id: sent.id }
  // Invalid JSON and bogus signatures share exactly the same body as a known
  // message and recipient mismatch, so the endpoint reveals no existence oracle.
  await assertRejected(h, { raw: '{invalid', headers: {} })
  const before = await mailSnapshot(h)
  const unknown = { ...event, rer_delivery_id: 'not-a-glove-message', sg_message_id: 'unknown-provider-message', sg_event_id: 'unknown-reusable' }
  const unmatched = await postEvents(h, signer.signed([unknown]))
  const unmatchedBody = await unmatched.json()
  assert.deepEqual([unmatched.status, unmatchedBody], [200, { ok: true }])
  assert.equal(await mailSnapshot(h), before, 'authenticated unmatched consumes no ID or verified-at and has no effect')
  await assertRejected(h, signer.signed([event, { ...event, sg_event_id: 'wrong-recipient', email: 'outsider@example.test' }]))
  assert.equal((await h.state()).messageStates[sent.id].status, 'accepted')
  const matchedResponse = await postEvents(h, signer.signed([event, unknown]))
  assert.equal(matchedResponse.status, 200)
  assert.deepEqual(await matchedResponse.json(), unmatchedBody, 'successful and unmatched acknowledgements disclose no match count')
  assert.equal((await h.state()).messageStates[sent.id].status, 'delivered')
  assert.ok((await h.state()).mailCallbacks.verifiedAt)
  const matchLater = { ...event, timestamp: event.timestamp + 1, sg_event_id: 'unknown-reusable', event: 'spamreport' }
  assert.equal((await postEvents(h, signer.signed([matchLater]))).status, 200, 'unmatched event did not reserve its event ID')
  assert.equal((await h.state()).emailWarnings[b.customer.id].status, 'complained')
  const ip = '192.0.2.90', other = '192.0.2.91'
  // Freeze at a minute boundary to assert the exact 20/21 limit without a race.
  const at = Math.ceil(Date.now() / 60_000) * 60_000
  await clock(h, new Date(at).toISOString())
  await peer.fetch(h.origin + '/__test/clock', { method: 'POST', body: JSON.stringify({ at: new Date(at).toISOString() }) })
  const peerView = { ...h, mf: { dispatchFetch: (...args) => peer.fetch(...args) } }
  for (let n = 0; n < 20; n++) await assertRejected(n % 2 ? peerView : h, { raw: '{}', headers: { 'cf-connecting-ip': ip } })
  await assertRejected(h, { raw: '{}', headers: { 'cf-connecting-ip': ip } }, 429)
  await assertRejected(peerView, { raw: '{}', headers: { 'cf-connecting-ip': ip } }, 429)
  await assertRejected(h, { raw: '{}', headers: { 'cf-connecting-ip': other } })
  const accepted = signer.signed([event], { at: at / 1000 }); accepted.headers['cf-connecting-ip'] = ip
  assert.equal((await postEvents(peerView, accepted)).status, 200, 'verified traffic is never rate limited by rejection counts')
  const verifiedMismatch = signer.signed([{ ...event, email: 'outsider@example.test' }], { at: at / 1000 }); verifiedMismatch.headers['cf-connecting-ip'] = ip
  await assertRejected(h, verifiedMismatch, 401) // authenticated traffic bypasses the rejection counter even when authorization fails
  await clock(h, new Date(at + 60_000).toISOString())
  await peer.fetch(h.origin + '/__test/clock', { method: 'POST', body: JSON.stringify({ at: new Date(at + 60_000).toISOString() }) })
  await assertRejected(peerView, { raw: '{}', headers: { 'cf-connecting-ip': ip } })
  await assertRejected(h, { raw: '{}', headers: { 'cf-connecting-ip': ip } })
  await clock(h, null)
  // Same shared rule for Resend; valid unmatched must not disable Svix retries.
  const resend = mailEvents('resend')
  await h.command('mail.connect', { provider: 'resend', apiKey: 'test-only-resend-callback', eventKey: resend.eventKey, fromEmail: 'office@example.test' })
  const reSent = await h.command('email.send', { kind: 'quote', id: q.id, version: (await h.state()).quotes[0].version })
  const re = { type: 'email.delivered', created_at: new Date().toISOString(), data: { email_id: 'unmatched-resend', to: [reSent.to] } }
  const reBefore = await mailSnapshot(h)
  assert.equal((await postEvents(h, resend.signed(re))).status, 200)
  assert.equal(await mailSnapshot(h), reBefore)
  await assertRejected(h, resend.signed({ ...re, data: { email_id: `re-receipt-${h.email.sent.length}`, to: ['outsider@example.test'] } }))
  assert.equal((await postEvents(h, resend.signed({ ...re, data: { email_id: `re-receipt-${h.email.sent.length}`, to: [reSent.to] } }))).status, 200)
})

test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 Postmark generates hash-only Basic credentials, rotates with 24h overlap and revoke, enforces optional pinned IPs, age and replay, and maps delivery outcomes', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h), q = await emailFixture(h, b), connect = { provider: 'postmark', apiKey: 'test-only-postmark-server-token', fromEmail: 'office@example.test' }
  await b.office.run('mail.connect', connect, { error: 'FORBIDDEN' })
  const commandId = 'postmark-connect-shown-once'
  const connected = await h.command('mail.connect', connect, { commandId })
  assert.match(connected.callbackPassword, /^[a-f0-9]{64}$/)
  assert.equal((await h.command('mail.connect', connect, { commandId })).callbackPassword, undefined)
  const current = connected.callbackPassword
  const stored = await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()
  assert.equal(stored.current_hash, (await import('node:crypto')).createHash('sha256').update(current).digest('hex'))
  assert.equal(stored.previous_hash, null)
  assert.equal((await h.state()).business[0].mail.postmarkAllowlist, false)
  const send = async () => {
    const message = await h.command('email.send', { kind: 'quote', id: q.id, version: (await h.state()).quotes[0].version })
    const out = h.email.sent.at(-1)
    assert.ok(out, JSON.stringify((await h.state()).messageStates))
    assert.deepEqual([out.provider, out.authorization, out.body.Metadata.glove_delivery_id], ['postmark', connect.apiKey, message.id])
    return { ...message, receipt: `pm-receipt-${h.email.sent.length}` }
  }
  const m = await send(), post = (body, value = current, headers = {}) => ({ raw: JSON.stringify(body), headers: { ...basic(value), ...headers } })
  await assertRejected(h, { raw: JSON.stringify(pmEvent(m)), headers: {} })
  await assertRejected(h, post(pmEvent(m), '0'.repeat(64)))
  await assertRejected(h, post(pmEvent(m, 'Delivery', { DeliveredAt: new Date(Date.now() - 7 * 86_400_000 - 1000).toISOString() })))
  await assertRejected(h, post(pmEvent(m, 'Delivery', { Recipient: 'outsider@example.test' })))
  const delivered = pmEvent(m)
  const insecureBefore = await mailSnapshot(h)
  const insecure = await h.mf.dispatchFetch(h.origin.replace('https:', 'http:') + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', ...basic(current) }, body: JSON.stringify(delivered) })
  assert.equal(insecure.status, 401, 'Postmark Basic credentials are accepted only over HTTPS')
  assert.equal(await mailSnapshot(h), insecureBefore)
  assert.equal((await postEvents(h, post(delivered))).status, 200)
  assert.equal((await postEvents(h, post(delivered))).status, 200)
  assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='postmark'").first()).n, 1)
  const missing = pmEvent({ ...m, id: 'unknown', receipt: 'unknown' }), before = await mailSnapshot(h)
  assert.equal((await postEvents(h, post(missing))).status, 200)
  assert.equal(await mailSnapshot(h), before)
  for (const [recordType, details, expected] of [['Bounce', { Type: 'HardBounce', ID: 'bounce-hard' }, 'bounced'], ['Bounce', { Type: 'SoftBounce', ID: 'bounce-soft' }, 'deferred'], ['Bounce', { Type: 'SoftBounce', Inactive: true, ID: 'bounce-final' }, 'failed'], ['SpamComplaint', { ID: 'spam' }, 'complained']]) {
    const message = await send()
    assert.equal((await postEvents(h, post(pmEvent(message, recordType, details)))).status, 200)
    assert.equal((await h.state()).messageStates[message.id].status, expected)
  }
  await b.office.run('mail.callback', { action: 'rotate' }, { error: 'FORBIDDEN' })
  const rotated = await h.command('mail.callback', { action: 'rotate' })
  assert.notEqual(rotated.callbackPassword, current)
  const rotatedStored = await h.db.prepare('SELECT * FROM glove_mail_callback_auth').first()
  const rotation = (await h.state()).events.find(e => e.kind === 'mail.callback.rotate')
  assert.equal(Date.parse(rotatedStored.previous_until) - Date.parse(rotation.at), 86_400_000)
  assert.equal((await postEvents(h, post(delivered))).status, 200, 'old credential valid during 24h overlap')
  assert.equal((await postEvents(h, post(delivered, rotated.callbackPassword))).status, 200)
  await clock(h, rotatedStored.previous_until)
  const fresh = pmEvent(m, 'Delivery', { DeliveredAt: rotatedStored.previous_until })
  await assertRejected(h, post(fresh))
  assert.equal((await postEvents(h, post(fresh, rotated.callbackPassword))).status, 200, 'new credential still valid at old expiry')
  await clock(h, null)
  const again = await h.command('mail.callback', { action: 'rotate' })
  await h.command('mail.callback', { action: 'revokePrevious' })
  await assertRejected(h, post(delivered, rotated.callbackPassword))
  await h.command('mail.callback', { action: 'allowlist', enabled: true })
  await assertRejected(h, post(delivered, again.callbackPassword, { 'cf-connecting-ip': '192.0.2.10' }))
  await assertRejected(h, post(delivered, '0'.repeat(64), { 'cf-connecting-ip': '3.134.147.250' }))
  assert.equal((await postEvents(h, post(delivered, again.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
  const reconnected = await h.command('mail.connect', connect)
  assert.equal((await h.state()).business[0].mail.postmarkAllowlist, true, 'reconnecting credentials preserves the owner-selected allowlist')
  await assertRejected(h, post(delivered, reconnected.callbackPassword, { 'cf-connecting-ip': '192.0.2.10' }))
  assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword, { 'cf-connecting-ip': '3.134.147.250' }))).status, 200)
  await h.command('mail.callback', { action: 'allowlist', enabled: false })
  const trail = await assertTrail(h, ['mail.connected', 'mail.callback.rotate', 'mail.callback.revokePrevious', 'mail.callback.allowlist', 'email.delivered', 'email.bounced', 'email.deferred', 'email.failed', 'email.complained'])
  const visible = JSON.stringify(trail) + JSON.stringify(await h.state()) + JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results)
  for (const secret of [current, rotated.callbackPassword, again.callbackPassword, reconnected.callbackPassword, connect.apiKey]) assert.ok(!visible.includes(secret), 'no secret in state, trail, export or saved outcomes')
  await h.command('mail.connect', { provider: null })
  assert.equal((await postEvents(h, post(delivered, again.callbackPassword))).status, 404)
  assert.equal((await postEvents(h, post(delivered, reconnected.callbackPassword))).status, 404)
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_mail_callback_auth').first()).n, 0)
})

test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 SES and SNS pins topic, region, configuration set and tag, verifies signatures v1 and v2, certificates and freshness before effects or subscription fetches, and deduplicates both IDs', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h), q = await emailFixture(h, b)
  const settings = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:glove-mail', configurationSet: 'glove-outcomes' }
  const apiKey = JSON.stringify({ accessKeyId: 'TESTONLYACCESSKEY0001', secretAccessKey: 'test-only-ses-secret-not-an-account' })
  const connection = { provider: 'ses', apiKey, fromEmail: 'office@example.test', sns: settings }
  await h.command('mail.connect', { ...connection, sns: { ...settings, region: 'elsewhere' } }, { error: 'INPUT' })
  await h.command('mail.connect', { ...connection, apiKey: '{}' }, { error: 'INPUT' })
  await h.command('mail.connect', connection)
  const signer = snsEvents(settings)
  h.email.certificates.set(signer.certUrl, signer.cert)
  const send = async () => {
    const message = await h.command('email.send', { kind: 'quote', id: q.id, version: (await h.state()).quotes[0].version })
    const out = h.email.sent.at(-1)
    assert.ok(out, JSON.stringify((await h.state()).messageStates))
    assert.equal(out.provider, 'ses')
    assert.match(out.authorization, /^AWS4-HMAC-SHA256 Credential=TESTONLYACCESSKEY0001\/\d{8}\/us-east-1\/ses\/aws4_request,/)
    assert.equal(out.body.ConfigurationSetName, settings.configurationSet)
    assert.deepEqual(out.body.EmailTags, [{ Name: 'glove_delivery_id', Value: Buffer.from(message.id).toString('base64url') }])
    return { ...message, receipt: `ses-receipt-${h.email.sent.length}` }
  }
  const event = (m, type = 'Delivery', extra = {}) => {
    const now = new Date().toISOString(), detail = type === 'Rendering Failure' ? 'failure' : type[0].toLowerCase() + type.slice(1)
    return { eventType: type, mail: { messageId: m.receipt, timestamp: now, destination: [m.to], tags: { 'ses:configuration-set': [settings.configurationSet], glove_delivery_id: [Buffer.from(m.id).toString('base64url')] } }, [detail]: { timestamp: now, recipients: [m.to] }, ...extra }
  }
  const m = await send(), payload = event(m)
  // These source checks fail before even the pinned certificate is fetched.
  const noFetch = async input => { const n = h.email.fetches.length; await assertRejected(h, input); assert.equal(h.email.fetches.length, n) }
  await noFetch({ raw: JSON.stringify(payload), headers: {} }) // raw-message delivery is refused
  await noFetch(signer.signed(payload, { TopicArn: 'arn:aws:sns:us-east-1:123456789012:other' }))
  await noFetch(signer.signed(payload, { SigningCertURL: signer.certUrl.replace('us-east-1', 'us-west-2') }))
  for (const SigningCertURL of [signer.certUrl.replace('https:', 'http:'), signer.certUrl + '?leak=1', signer.certUrl + '#fragment', signer.certUrl.replace('sns.us-east-1.amazonaws.com', 'sns.us-east-1.amazonaws.com.evil.example'), signer.certUrl.replace('https://', 'https://user@'), signer.certUrl.replace('/SimpleNotificationService-', '/other-')]) await noFetch(signer.signed(payload, { SigningCertURL }))
  await noFetch(signer.signed(payload, { Timestamp: new Date(Date.now() - 3_601_000).toISOString() }))
  await noFetch(signer.signed(payload, { Timestamp: new Date(Date.now() + 301_000).toISOString() }))
  const wrongHeader = signer.signed(payload); wrongHeader.headers['x-amz-sns-message-type'] = 'SubscriptionConfirmation'; await noFetch(wrongHeader)
  await noFetch(signer.signed(payload, { SignatureVersion: '3' }))
  const badSignature = signer.signed(payload), parsed = JSON.parse(badSignature.raw); parsed.Signature = Buffer.alloc(256).toString('base64'); badSignature.raw = JSON.stringify(parsed)
  await assertRejected(h, badSignature)
  assert.equal(h.email.fetches.length, 1)
  assert.equal((await h.state()).messageStates[m.id].status, 'accepted')
  // Valid authentication still cannot authorize a wrong recipient, missing
  // configuration set, absent delivery tag, or an unknown message's effects.
  await assertRejected(h, signer.signed({ ...payload, mail: { ...payload.mail, tags: { ...payload.mail.tags, 'ses:configuration-set': ['other'] } } }))
  await assertRejected(h, signer.signed({ ...payload, mail: { ...payload.mail, tags: { 'ses:configuration-set': [settings.configurationSet] } } }))
  await assertRejected(h, signer.signed({ ...payload, delivery: { ...payload.delivery, recipients: ['outsider@example.test'] } }))
  const unknown = event({ ...m, id: 'unknown-message', receipt: 'unknown-receipt' }), before = await mailSnapshot(h), unknownSigned = signer.signed(unknown)
  assert.equal((await postEvents(h, unknownSigned)).status, 200)
  assert.equal(await mailSnapshot(h), before)
  assert.equal(h.email.subscriptions.length, 0)
  const signed = signer.signed(payload, { SignatureVersion: '1', Subject: 'Amazon SES delivery' })
  assert.equal((await postEvents(h, signed)).status, 200)
  assert.equal((await postEvents(h, signed)).status, 200)
  assert.equal((await postEvents(h, signer.signed(payload))).status, 200, 'same SES event with another SNS ID remains one event')
  assert.equal((await h.state()).messageStates[m.id].status, 'delivered')
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM rer_mail_event_receipts WHERE provider='ses'").first()).n, 1)
  const reusedId = signer.signed(event(m, 'Complaint', { complaint: { timestamp: new Date(Date.now() + 1000).toISOString(), complainedRecipients: [{ emailAddress: m.to }] } }), { MessageId: JSON.parse(signed.raw).MessageId })
  await assertRejected(h, reusedId)
  for (const [type, detail, expected] of [['Bounce', { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: m.to }] }, 'bounced'], ['Bounce', { bounceType: 'Transient', bouncedRecipients: [{ emailAddress: m.to }] }, 'failed'], ['DeliveryDelay', {}, 'deferred'], ['Complaint', { complainedRecipients: [{ emailAddress: m.to }] }, 'complained'], ['Reject', {}, 'rejected'], ['Rendering Failure', {}, 'rejected']]) {
    const message = await send(), e = event(message, type), k = type === 'Rendering Failure' ? 'failure' : type[0].toLowerCase() + type.slice(1)
    e[k] = { ...e[k], ...detail }
    if (type === 'Bounce') e[k].bouncedRecipients = [{ emailAddress: message.to }]
    if (type === 'Complaint') e[k].complainedRecipients = [{ emailAddress: message.to }]
    assert.equal((await postEvents(h, signer.signed(e))).status, 200)
    assert.equal((await h.state()).messageStates[message.id].status, expected)
  }
  // Confirm only after the full signature/source/time/URL check, once per SNS
  // MessageId. An unsubscribe warns the owner and never fetches its URL.
  const subscribe = signer.signed('subscription', { Type: 'SubscriptionConfirmation' })
  const hostile = JSON.parse(subscribe.raw); hostile.SubscribeURL = 'https://attacker.example/confirm'
  await noFetch(signer.signed('subscription', { ...hostile, Signature: undefined }))
  const unsignedSubscribe = JSON.parse(subscribe.raw); unsignedSubscribe.Signature = Buffer.alloc(256).toString('base64')
  const fetchCount = h.email.fetches.length
  await assertRejected(h, { raw: JSON.stringify(unsignedSubscribe), headers: subscribe.headers })
  assert.equal(h.email.fetches.length, fetchCount, 'unsigned confirmation fetched nothing')
  assert.equal((await postEvents(h, subscribe)).status, 200)
  assert.equal((await postEvents(h, subscribe)).status, 200)
  assert.equal(h.email.subscriptions.length, 1)
  const unsub = signer.signed('unsubscribe', { Type: 'UnsubscribeConfirmation' })
  assert.equal((await postEvents(h, unsub)).status, 200)
  assert.equal(h.email.subscriptions.length, 1)
  assert.match((await h.state()).mailCallbacks.warning, /cancelled the email-event subscription/)
  const trail = await assertTrail(h, ['email.delivered', 'email.bounced', 'email.failed', 'email.deferred', 'email.complained', 'email.rejected', 'mail.subscription.confirmed', 'mail.subscription.unsubscribed'])
  assert.equal(trail.exported.timeline.filter(e => e.kind === 'email.delivered').length, 1)
  const visible = JSON.stringify(trail) + JSON.stringify(await h.state())
  assert.ok(!visible.includes('test-only-ses-secret-not-an-account') && !visible.includes('test-only-subscription-token'))
  await h.command('mail.connect', { provider: null })
  assert.equal((await postEvents(h, subscribe)).status, 404)
})


async function providerDocuments() {
  for (const provider of ['postmark', 'ses']) {
    const h = await installation()
    try {
      const b = await business(h), q = await emailFixture(h, b)
      const customer = await h.command('customer.save', { ...b.customer, apEmail: 'payables@example.test' })
      const { job } = await completedJob(h, b)
      const draft = await b.office.run('invoice.prepare', { jobId: job.id })
      const invoice = await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
      const material = await h.command('service.save', { code: 'SYNTHETIC', name: 'Motor', kind: 'material', unit: 'each', unitCost: '10.00', unitPrice: '20.00', tax: 'FREE' })
      const location = await b.office.run('stock.location', { kind: 'warehouse', name: 'Warehouse' })
      const po = await b.office.run('po.save', { supplier: 'Supplier', supplierEmail: 'supplier@example.test', locationId: location.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '1' }] })
      const edge = await connectMail(h, provider)
      const sent = []
      for (const [kind, record] of [['quote', q], ['invoice', invoice], ['purchaseOrder', po]]) {
        const payload = { kind, id: record.id, version: record.version }, commandId = `synthetic-glove-${kind}`
        const message = await b.office.run('email.send', payload, { commandId })
        sent.push(receipt(h, message))
        const count = h.email.sent.length
        await b.office.run('email.send', payload, { commandId })
        assert.equal(h.email.sent.length, count, 'command replay never sends again')
        assert.equal(h.email.sent.at(-1).provider, provider)
        assert.ok(textOf(h.email.sent.at(-1)).includes(record.number))
        assert.equal((await h.state()).messageStates[message.id].status, 'accepted')
      }
      assert.deepEqual(sent.map(m => m.to), [customer.email, customer.apEmail, po.supplierEmail])
      for (const m of sent) {
        for (const outcome of ['delivered', 'bounced']) {
          const event = edge.callback(m, outcome, new Date(Date.now() + (outcome === 'bounced' ? 1000 : 0)).toISOString())
          assert.equal((await postEvents(h, event)).status, 200)
          assert.equal((await postEvents(h, event)).status, 200)
          assert.equal((await h.state()).messageStates[m.id].status, outcome)
        }
      }
      const state = await h.state()
      assert.equal(state.emailWarnings[customer.id].messageId, sent[1].id)
      assert.match(state.emailWarnings[customer.id].next, /Check the address/)
      const timeline = await h.request(`/api/glove/jobs/${job.id}/timeline`).then(r => r.json())
      for (const m of sent.slice(1)) assert.deepEqual(timeline.events.filter(e => e.subjectId === m.id).map(e => e.kind), ['email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
      const stream = await h.request(`/api/glove/conversation?customerId=${customer.id}`).then(r => r.json())
      assert.deepEqual(stream.entries.filter(e => e.channel === 'email').map(e => [e.direction, e.author, e.to]), sent.map(m => ['outbound', 'Olu Office', m.to]))
      for (const [http, expected] of [[400, 'rejected'], [429, 'rate_limited'], [503, 'uncertain']]) {
        h.email.status[customer.email] = http
        const current = (await h.state()).quotes.find(r => r.id === q.id)
        const payload = { kind: 'quote', id: q.id, version: current.version }, commandId = `synthetic-glove-${http}`
        const failed = await h.command('email.send', payload, { commandId })
        const label = (await h.state()).messageStates[failed.id]
        assert.equal(label.status, expected)
        assert.ok(label.next)
        const count = h.email.sent.length
        await h.command('email.send', payload, { commandId })
        assert.equal(h.email.sent.length, count)
      }
      delete h.email.status[customer.email]
      for (const [reply, expected] of [[{}, 'uncertain'], ...(provider === 'postmark' ? [[{ ErrorCode: 422 }, 'rejected']] : [])]) {
        h.email.reply = reply
        const current = (await h.state()).quotes.find(r => r.id === q.id)
        const message = await h.command('email.send', { kind: 'quote', id: q.id, version: current.version })
        assert.equal((await h.state()).messageStates[message.id].status, expected)
      }
      delete h.email.reply
      const latest = (await h.state()).quotes.find(r => r.id === q.id)
      const recovered = receipt(h, await h.command('email.send', { kind: 'quote', id: q.id, version: latest.version }))
      assert.equal((await postEvents(h, edge.callback(recovered, 'delivered', new Date(Date.now() + 2000).toISOString()))).status, 200)
      assert.equal((await h.state()).emailWarnings[customer.id], undefined)
      const { exported, activity } = await assertTrail(h, ['mail.connected', 'email.accepted', 'email.delivered', 'email.bounced', 'email.rejected', 'email.rate_limited', 'email.uncertain'])
      for (const m of [...sent, recovered]) {
        for (const kind of ['email.accepted', 'email.delivered', ...(m.id === recovered.id ? [] : ['email.bounced'])]) {
          const fact = exported.timeline.find(e => e.subject_id === m.id && e.kind === kind)
          assert.ok(fact, `${provider} ${m.kind} keeps ${kind} in export`)
          assert.equal(JSON.parse(fact.data).providerMessageId, m.receipt)
          assert.ok(activity.some(e => e.id === fact.id), 'the same provider fact is readable in Activity')
        }
      }
      assert.ok(!JSON.stringify(exported).includes(edge.secret))
    } finally { await h.close() }
  }
}

async function providerMornings() {
  for (const provider of ['postmark', 'ses']) {
    const h = await installation({ isolates: 2 })
    try {
      const b = await business(h, { paymentTermsDays: 0 })
      await clock(h, '2026-10-21T08:00:00Z')
      const { job } = await completedJob(h, b)
      const draft = await h.command('invoice.prepare', { jobId: job.id })
      const overdue = await h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
      await clock(h, null)
      const edge = await connectMail(h, provider), peer = await h.mf.getWorker('peer-1')
      await h.command('mail.morning', { enabled: true, time: '07:30' })
      const get = at => h.request(`/api/glove/brief?at=${at}`).then(r => r.json()).then(r => r.emailed)
      const dates = ['2026-10-22T20:30:00Z', '2026-10-23T20:30:00Z', '2026-10-24T20:30:00Z', '2026-10-25T20:30:00Z', '2026-10-26T20:30:00Z']
      for (const [i, at] of dates.entries()) {
        h.email.status['owner@example.test'] = [200, 400, 429, 503, 200][i]
        const before = h.email.sent.length
        await Promise.all([h.scheduled(at), peer.scheduled({ scheduledTime: new Date(at) })])
        assert.equal(h.email.sent.length, before + 1)
        const state = await get(at)
        assert.equal(state.status, ['accepted', 'rejected', 'rate_limited', 'uncertain', 'accepted'][i])
        assert.equal(state.date, `2026-10-${23 + i}`)
        assert.equal(h.email.sent.at(-1).to, 'owner@example.test')
        assert.match(textOf(h.email.sent.at(-1)), new RegExp(state.date))
        assert.match(textOf(h.email.sent.at(-1)), /Overdue invoices/)
        assert.ok(textOf(h.email.sent.at(-1)).includes(overdue.number), 'email includes the same overdue invoice as the owner brief')
        if (i === 0 || i === 4) {
          const message = receipt(h, { id: `brief:${state.date}`, to: 'owner@example.test' })
          const event = edge.callback(message, i === 0 ? 'bounced' : 'delivered')
          assert.equal((await postEvents(h, event)).status, 200)
          assert.equal((await postEvents(h, event)).status, 200)
          assert.equal((await get(at)).status, i === 0 ? 'bounced' : 'delivered')
        } else assert.match(state.next, /does not retry/)
        await h.scheduled(at)
        assert.equal(h.email.sent.length, before + 1)
      }
      const { exported, activity } = await assertTrail(h, ['email.accepted', 'email.bounced', 'email.delivered', 'email.rejected', 'email.rate_limited', 'email.uncertain'])
      for (const [date, kind, reference] of [['2026-10-23', 'email.bounced', `${provider === 'postmark' ? 'pm' : 'ses'}-receipt-1`], ['2026-10-27', 'email.delivered', `${provider === 'postmark' ? 'pm' : 'ses'}-receipt-5`]]) {
        const fact = exported.timeline.find(e => e.subject_id === `brief:${date}` && e.kind === kind)
        assert.equal(JSON.parse(fact.data).providerMessageId, reference)
        assert.ok(activity.some(e => e.id === fact.id))
      }
      assert.equal(exported.timeline.filter(e => e.subject_kind === 'brief' && e.kind === 'email.queued').length, 5)
      assert.ok(!JSON.stringify(exported).includes(edge.secret))
    } finally { await h.close() }
  }
}
