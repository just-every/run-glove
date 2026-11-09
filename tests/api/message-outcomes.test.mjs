import test from 'node:test'
import assert from 'node:assert/strict'
import { scenario } from '../fixtures/scenario.mjs'
import { connectMail, postmarkCallback, textOf } from '../fixtures/mail-providers.mjs'
import { installation, business, completedJob, assertTrail, mailEvents, snsEvents, postEvents } from './harness.mjs'

const mailbox = name => [name, 'example.test'].join('@')
const names = { sendgrid: 'SendGrid', resend: 'Resend', postmark: 'Postmark', ses: 'Amazon SES' }
const registration = 'COMM-010 points 1–8: committed messages retain honest provider outcomes, address warnings and no resend across Worker restart'

test(registration, async t => {
  const start = new Date().toISOString()
  const h = await installation({ at: start, captureLogs: true }); t.after(() => h.close())
  const b = await business(h, { timezone: 'UTC' })
  let customer = await h.command('customer.save', { ...b.customer, kind: 'business', email: mailbox('synthetic-glove-main'), apEmail: mailbox('synthetic-glove-ap') })
  const q = await h.command('quote.draft', { customerId: customer.id, siteId: b.site.id, title: 'Message outcomes', lines: [{ serviceId: b.service.id, description: 'Service', quantity: '1', unitPrice: '189.00' }] })
  const quote = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
  const { job } = await completedJob(h, b)
  const draft = await b.office.run('invoice.prepare', { jobId: job.id })
  const invoice = await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
  const material = await h.command('service.save', { code: 'OUTCOMES', name: 'Filter', kind: 'material', unit: 'each', unitCost: '10.00', unitPrice: '20.00', tax: 'FREE' })
  const location = await b.office.run('stock.location', { kind: 'warehouse', name: 'Workshop' })
  const createOrder = () => b.office.run('po.save', { supplier: 'Filter supplier', supplierEmail: mailbox('synthetic-glove-supplier'), locationId: location.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '1' }] })
  const plan = await h.command('plan.save', { name: 'Care', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: b.service.id })
  const agreement = await b.office.run('agreement.sell', { customerId: customer.id, siteId: b.site.id, planId: plan.id, via: 'phone', startDate: start.slice(0, 10) })
  const replays = [], messages = [], tokens = [], bodies = [], facts = [], secrets = []
  let tick = 0, eventIndex = 0
  const now = () => new Date(Date.parse(start) + tick * 1000).toISOString()
  async function advance() { tick += 10; await h.setTime(now()) }
  async function send(kind, record) {
    await advance()
    const collection = { quote: 'quotes', invoice: 'invoices', purchaseOrder: 'purchaseOrders' }[kind]
    const current = (await h.state())[collection].find(r => r.id === record.id)
    const payload = { kind, id: record.id, version: current.version }, commandId = `synthetic-glove-send-${tick}`
    const count = h.email.sent.length
    const result = await b.office.run('email.send', payload, { commandId })
    assert.equal(h.email.sent.length, count + 1)
    replays.push({ type: 'email.send', payload, commandId, result })
    const sent = h.email.sent.at(-1), provider = sent.provider
    const message = { ...result, receipt: `${{ sendgrid: 'sg', resend: 're', postmark: 'pm', ses: 'ses' }[provider]}-receipt-${h.email.sent.length}` }
    messages.push(message); bodies.push(textOfProvider(sent))
    return message
  }
  const state = async message => (await h.state()).messageStates[message.id]
  async function post(edge, message, status, at = now()) {
    const event = edge.event(message, status, at)
    const response = await postEvents(h, event)
    assert.equal(response.status, 200, await response.clone().text())
    const before = await snapshot(h)
    assert.equal((await postEvents(h, event)).status, 200)
    assert.deepEqual(await snapshot(h), before, 'replaying a matched event has no second effect')
    facts.push({ message, status })
  }
  async function connect(provider) {
    const secret = 'synthetic-glove-200'
    secrets.push(secret)
    if (provider === 'sendgrid' || provider === 'resend') {
      const signer = mailEvents(provider)
      secrets.push(signer.eventKey)
      await h.command('mail.connect', { provider, apiKey: secret, eventKey: signer.eventKey, fromEmail: mailbox('synthetic-glove-office') })
      return { event(message, status, at) {
        const id = `synthetic-glove-event-${++eventIndex}`, seconds = Math.floor(Date.parse(now()) / 1000)
        if (provider === 'sendgrid') return signer.signed([{ email: message.to, timestamp: Math.floor(Date.parse(at) / 1000), event: { accepted: 'processed', deferred: 'deferred', delivered: 'delivered', bounced: 'bounce', complained: 'spamreport', rejected: 'dropped' }[status], sg_event_id: id, sg_message_id: message.receipt, rer_delivery_id: message.id }], { at: seconds })
        return signer.signed({ type: `email.${{ accepted: 'sent', deferred: 'delivery_delayed', rejected: 'suppressed' }[status] ?? status}`, created_at: at, data: { email_id: message.receipt, to: [message.to] } }, { id, at: seconds })
      } }
    }
    const edge = await connectMail(h, provider)
    secrets.push(edge.secret)
    if (provider === 'postmark') {
      const connected = await h.command('mail.connect', edge.connection)
      secrets.push(connected.callbackPassword)
      return { event(message, status, at) {
        return postmarkCallback(message, connected.callbackPassword, { at, id: `synthetic-glove-event-${++eventIndex}`, details: status === 'delivered' ? { RecordType: 'Delivery' } : status === 'complained' ? { RecordType: 'SpamComplaint' } : { RecordType: 'Bounce', Type: status === 'bounced' ? 'HardBounce' : 'SoftBounce', Inactive: status === 'failed' } })
      } }
    }
    const signer = snsEvents(edge.connection.sns, { days: 30 })
    // OpenSSL dates the real certificate at generation; the controlled clock
    // must reach that instant before signature verification, even on slow hosts.
    tick = Math.max(tick, Math.ceil((Date.now() - Date.parse(start)) / 1000) + 1)
    await h.setTime(now())
    h.email.certificates.set(signer.certUrl, signer.cert)
    return { event(message, status, at) {
      const type = { delivered: 'Delivery', bounced: 'Bounce', complained: 'Complaint', deferred: 'DeliveryDelay', failed: 'Bounce', rejected: 'Reject' }[status]
      const key = type[0].toLowerCase() + type.slice(1)
      return signer.signed({ eventType: type, mail: { messageId: message.receipt, timestamp: at, destination: [message.to], tags: { 'ses:configuration-set': [edge.connection.sns.configurationSet], glove_delivery_id: [Buffer.from(message.id).toString('base64url')] } }, [key]: { timestamp: at, recipients: [message.to], ...(type === 'Bounce' ? { bounceType: status === 'failed' ? 'Transient' : 'Permanent', bouncedRecipients: [{ emailAddress: message.to }] } : {}), ...(type === 'Complaint' ? { complainedRecipients: [{ emailAddress: message.to }] } : {}) } }, { Timestamp: now() })
    } }
  }

  let edge = await connect('sendgrid')
  await scenario(t, 'point 6: independent address warnings survive other-address delivery, refusal and failed attempts until same-address delivery or an address change', async () => {
    const bounced = await send('invoice', invoice); await post(edge, bounced, 'bounced')
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, bounced.id)
    const delivered = await send('quote', quote); await post(edge, delivered, 'delivered')
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, bounced.id, 'delivery to another on-record address must not clear the bounce')
    h.email.status[customer.apEmail] = 400
    await send('invoice', invoice)
    delete h.email.status[customer.apEmail]
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, bounced.id, 'a refused send cannot clear a bounce')
    edge = await connect('postmark')
    const failed = await send('invoice', invoice); await post(edge, failed, 'failed')
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, bounced.id, 'a later failed email cannot clear a bounce')
    const complaint = await send('quote', quote); await post(edge, complaint, 'complained')
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, complaint.id)
    const mainRecovery = await send('quote', quote); await post(edge, mainRecovery, 'delivered')
    assert.equal((await h.state()).emailWarnings[customer.id]?.messageId, bounced.id, 'clearing one address reveals the other unresolved warning')
    const apRecovery = await send('invoice', invoice); await post(edge, apRecovery, 'delivered')
    assert.equal((await h.state()).emailWarnings[customer.id], undefined)
    const nextBounce = await send('invoice', invoice); await post(edge, nextBounce, 'bounced')
    customer = await h.command('customer.save', { ...customer, apEmail: mailbox('synthetic-glove-new-ap') })
    assert.equal((await h.state()).emailWarnings[customer.id], undefined, 'changing the warned address clears its warning')
    customer = await h.command('customer.save', { ...customer, apEmail: mailbox('synthetic-glove-ap') })
  })

  for (const provider of ['sendgrid', 'resend', 'postmark', 'ses']) {
    const previous = messages.at(-1)
    edge = await connect(provider)
    const connected = (await h.state()).business[0].mail
    const sent = [], po = await createOrder()
    await scenario(t, `points 1 and 2: ${names[provider]} sends committed quote, invoice, purchase order and booking link exactly once with safe message metadata`, async () => {
      // The provider sees the committed message and its saved command outcome,
      // rather than an uncommitted in-memory intention.
      if (provider !== 'resend') h.email.beforeRespond = async () => {
        const id = deliveryId(h.email.sent.at(-1))
        const kept = await h.db.prepare("SELECT data FROM glove_records WHERE kind='messages' AND id=?").bind(id).first()
        assert.ok(kept, 'message committed before provider request')
        const command = await h.db.prepare("SELECT result FROM glove_commands WHERE result LIKE ?").bind(`%${id}%`).first()
        assert.ok(command, 'command outcome committed before provider request')
      }
      for (const [kind, record, to] of [['quote', quote, customer.email], ['invoice', invoice, customer.apEmail], ['purchaseOrder', po, po.supplierEmail]]) {
        const message = await send(kind, record), call = h.email.sent.at(-1)
        assert.equal(message.to, to)
        assert.equal(deliveryId(call), message.id)
        assert.equal(call.provider, provider)
        const count = h.email.sent.length, replay = replays.at(-1)
        assert.deepEqual(await b.office.run(replay.type, replay.payload, { commandId: replay.commandId }), replay.result)
        assert.equal(h.email.sent.length, count)
        sent.push(message)
      }
      await advance()
      const payload = { agreementId: agreement.id, index: 0, email: true, slots: [{ technicianId: b.tom.id, date: new Date(Date.parse(start) + 86400000).toISOString().slice(0, 10), start: '09:00', end: '10:00' }] }
      const commandId = `synthetic-glove-offer-${provider}`, count = h.email.sent.length
      const offer = await b.office.run('agreement.offer', payload, { commandId })
      assert.match(offer.token, /^glb_/)
      tokens.push(offer.token)
      assert.equal(h.email.sent.length, count + 1)
      const call = h.email.sent.at(-1), message = (await h.state()).messages.find(m => m.id === offer.emailed.messageId)
      assert.equal(deliveryId(call), message.id)
      assert.ok(textOfProvider(call).includes(offer.token), 'bearer appears in the actual email')
      bodies.push(textOfProvider(call))
      message.receipt = `${{ sendgrid: 'sg', resend: 're', postmark: 'pm', ses: 'ses' }[provider]}-receipt-${h.email.sent.length}`
      messages.push(message); sent.push(message)
      const replay = await b.office.run('agreement.offer', payload, { commandId })
      assert.equal(replay.token, undefined)
      assert.equal(h.email.sent.length, count + 1)
      replays.push({ type: 'agreement.offer', payload, commandId, result: replay })
      for (const m of sent) {
        const kept = (await h.state()).messages.find(r => r.id === m.id)
        assert.deepEqual(Object.keys(kept).sort(), ['id', 'version', 'createdAt', 'kind', 'subjectKind', 'subjectId', 'customerId', 'jobId', 'to', 'subject', 'provider', 'from', 'by'].sort())
        assert.deepEqual([kept.kind, kept.to, kept.from, kept.provider, kept.by], [m.kind, m.to, connected.fromEmail, provider, { id: b.office.id, name: b.office.name, role: 'office' }])
        assert.ok(kept.subject.length > 0)
        assert.equal((await state(m)).status, 'accepted')
      }
      delete h.email.beforeRespond
    })

    await scenario(t, `points 3 and 4: ${names[provider]} authenticated facts deduplicate, unmatched messages have no effect, and final outcomes resist late and equal-time non-final events`, async () => {
      for (const unknown of [
        { ...sent[0], id: 'synthetic-glove-unknown', receipt: 'synthetic-glove-unknown', to: mailbox('synthetic-glove-other') },
        ...(previous?.provider !== provider ? [previous] : []),
      ]) {
        const before = await snapshot(h), response = await postEvents(h, edge.event(unknown, 'delivered', now()))
        assert.deepEqual([response.status, await response.json()], [200, { ok: true }])
        assert.deepEqual(await snapshot(h), before)
      }
      const wrong = edge.event({ ...sent[0], to: mailbox('synthetic-glove-wrong') }, 'delivered', now())
      const beforeWrong = await snapshot(h), wrongResponse = await postEvents(h, wrong)
      assert.equal(wrongResponse.status, 401, 'COMM-013 refuses a known-message recipient mismatch without effects')
      assert.deepEqual(await snapshot(h), beforeWrong)
      const beforeUnsigned = await snapshot(h), unsigned = edge.event(sent[0], 'delivered', now())
      assert.equal((await postEvents(h, { raw: unsigned.raw, headers: {} })).status, 401)
      assert.deepEqual(await snapshot(h), beforeUnsigned)
      for (const m of sent) {
        await post(edge, m, 'delivered')
        assert.equal((await state(m)).text, `Delivered to ${m.to}'s mail server (reported by ${names[provider]})`)
      }
      const m = sent[0], delivered = await state(m)
      await post(edge, m, 'deferred', new Date(Date.parse(now()) - 1000).toISOString())
      await post(edge, m, 'deferred', now())
      await advance()
      await post(edge, m, 'deferred')
      if (['sendgrid', 'resend'].includes(provider)) await post(edge, m, 'accepted')
      assert.deepEqual(await state(m), delivered, 'no earlier, equal-time or later non-final fact replaces delivery')
      await post(edge, m, 'complained')
      assert.equal((await state(m)).status, 'complained')
      await post(edge, m, 'bounced', new Date(Date.parse(now()) - 1000).toISOString())
      assert.equal((await state(m)).status, 'complained', 'an older final fact cannot replace the newer complaint')
      await post(edge, m, 'delivered', now())
      assert.equal((await state(m)).status, 'complained', 'the first final fact wins an equal timestamp')
      await post(edge, sent[3], 'bounced')
      assert.match((await state(sent[3])).next, /revoke this link and make a new offer/i)
      const offer = (await h.state()).bookingOffers.find(o => o.id === sent[3].subjectId)
      await b.office.run('agreement.offerRevoke', { offerId: offer.id, version: offer.version })
    })

    await scenario(t, `points 3 and 5: ${names[provider]} failures retain exact user text, next steps and attributable provider references`, async () => {
      // Resend's existing edge always accepts send requests. The other three
      // edges expose HTTP answers; Resend still supplies all callback states.
      if (provider !== 'resend') for (const [http, expected] of [[400, 'rejected'], [429, 'rate_limited'], [503, 'uncertain']]) {
        h.email.status[customer.email] = http
        const message = await send('quote', quote)
        delete h.email.status[customer.email]
        assertFailure(await state(message), expected, message, names[provider])
        facts.push({ message, status: expected, answer: true })
      }
      for (const expected of ['deferred', 'bounced', 'complained', ...(['postmark', 'resend', 'ses'].includes(provider) ? ['failed'] : []), ...(['sendgrid', 'resend', 'ses'].includes(provider) ? ['rejected'] : [])]) {
        const message = await send('invoice', invoice)
        await advance()
        await post(edge, message, expected)
        if (expected === 'deferred') assert.deepEqual([(await state(message)).text, (await state(message)).next], [`Delayed: ${names[provider]} is still trying ${message.to}`, null])
        else assertFailure(await state(message), expected, message, names[provider])
      }
    })

    await scenario(t, `point 7: ${names[provider]} messages read as outbound conversation entries with their author, recipient and provider state`, async () => {
      const response = await h.request(`/api/glove/conversation?customerId=${customer.id}`)
      assert.equal(response.status, 200)
      const entries = (await response.json()).entries
      for (const message of messages) {
        const entry = entries.find(e => e.id === `email:${message.id}`)
        assert.ok(entry, 'each sent email appears in the populated conversation')
        assert.deepEqual([entry.direction, entry.channel, entry.author, entry.to, entry.delivery], ['outbound', 'email', b.office.name, message.to, (await state(message)).text])
      }
    })
  }

  await scenario(t, 'points 1 and 3: state, saved command outcomes, message timelines, Activity, export and captured Worker logs retain provider facts but no email bodies, credentials or bearer', async () => {
    const trail = await assertTrail(h, ['email.queued', 'email.accepted', 'email.rejected', 'email.rate_limited', 'email.uncertain', 'email.delivered', 'email.deferred', 'email.bounced', 'email.complained', 'email.failed'])
    const activity = []
    let cursor = null
    do {
      const response = await h.request('/api/glove/activity' + (cursor ? `?before=${cursor}` : ''))
      assert.equal(response.status, 200)
      const page = await response.json()
      activity.push(...page.events); cursor = page.next
    } while (cursor)
    const timeline = await h.request(`/api/glove/jobs/${job.id}/timeline`).then(r => r.json())
    for (const { message, status, answer } of facts) {
      const row = trail.exported.timeline.find(e => e.subject_id === message.id && e.kind === `email.${status}`)
      assert.ok(row, `${status} provider fact in export`)
      assert.equal(row.actor_role, 'provider')
      const data = JSON.parse(row.data)
      // An HTTP rejection or ambiguous response has no provider reference.
      assert.equal(data.providerMessageId, answer ? null : message.receipt)
      const displayed = activity.find(e => e.id === row.id)
      assert.ok(displayed, 'provider facts remain reachable through paginated Activity')
      if (data.providerMessageId) assert.ok(displayed.summary.includes(data.providerMessageId), 'Activity shows the provider reference')
      if (message.jobId === job.id) assert.ok(timeline.events.some(e => e.id === row.id), 'the same provider fact appears on the populated message timeline')
    }
    for (const message of messages) {
      const accepted = trail.exported.timeline.find(e => e.subject_id === message.id && e.kind === 'email.accepted')
      if (!accepted) continue
      assert.equal(JSON.parse(accepted.data).providerMessageId, message.receipt)
      assert.ok(activity.find(e => e.id === accepted.id)?.summary.includes(message.receipt), 'the send answer exposes its provider reference in Activity too')
    }
    const saved = (await h.db.prepare('SELECT result FROM glove_commands').all()).results
    const visible = JSON.stringify({ state: await h.state(), saved, ...trail, activity, timeline, logs: h.logs })
    for (const value of [...tokens, ...secrets, ...bodies]) assert.ok(!visible.includes(JSON.stringify(value).slice(1, -1)), 'private bearer, key and whole email bodies are absent from retained projections and Worker logs')
    assert.ok(!visible.includes('glb_'))
    assert.ok(h.logs.length > 0, 'Worker log capture was active')
  })

  await scenario(t, 'point 8: repeated scheduled passes, command replay and actual Worker restart retain identical facts and never resend any message', async () => {
    const before = await snapshot(h), count = h.email.sent.length
    for (let n = 0; n < 3; n++) await h.scheduled(now())
    for (const r of replays) await b.office.run(r.type, r.payload, { commandId: r.commandId })
    assert.equal(h.email.sent.length, count)
    assert.deepEqual(await snapshot(h), before)
    await h.restart()
    assert.deepEqual(await snapshot(h), before, 'an actual Worker shutdown and reopen retains the same messages and states')
    for (let n = 0; n < 3; n++) await h.scheduled(now())
    for (const r of replays) {
      const replay = await b.office.run(r.type, r.payload, { commandId: r.commandId })
      assert.equal(replay.token, undefined)
    }
    assert.equal(h.email.sent.length, count)
    assert.deepEqual(await snapshot(h), before)
  })
})

function deliveryId(sent) {
  return sent.provider === 'resend' ? sent.idempotencyKey : sent.provider === 'postmark' ? sent.body.Metadata.glove_delivery_id : sent.provider === 'ses' ? Buffer.from(sent.body.EmailTags.find(t => t.Name === 'glove_delivery_id').Value, 'base64url').toString() : sent.body.custom_args.rer_delivery_id
}
function textOfProvider(sent) {
  return sent.provider === 'resend' ? sent.body.text : textOf(sent)
}
function assertFailure(actual, status, message, provider) {
  const text = {
    bounced: `Bounced: ${message.to} did not accept it (reported by ${provider})`,
    complained: `Marked as spam by ${message.to} (reported by ${provider})`,
    failed: `Not delivered: ${provider} gave up on ${message.to}`,
    rejected: `Not sent: ${provider} refused it`,
    rate_limited: `Not sent: ${provider} is limiting sends`,
    uncertain: `Outcome unknown: ${provider} did not confirm it`,
  }[status]
  const next = {
    bounced: 'Check the address with the customer, correct it on their record and send again.',
    complained: 'Do not email them again until they ask for it; call them instead.',
    failed: 'Check the address and send again.',
    rejected: 'Check the email connection and the address, then send again.',
    rate_limited: 'Send again in a few minutes.',
    uncertain: `Check ${provider}'s activity before sending again.`,
  }[status]
  assert.deepEqual([actual.status, actual.text, actual.next], [status, text, next])
}
async function snapshot(h) {
  const state = await h.state()
  const conversation = await h.request(`/api/glove/conversation?customerId=${state.customers[0].id}`).then(r => r.json())
  const exported = await h.request('/api/glove/export').then(r => r.json())
  const receipts = (await h.db.prepare('SELECT * FROM rer_mail_event_receipts ORDER BY provider,event_id').all()).results
  return { messages: state.messages, states: state.messageStates, warnings: state.emailWarnings, conversation, timeline: exported.timeline, receipts, callbacks: state.mailCallbacks }
}
