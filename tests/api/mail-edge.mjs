import assert from 'node:assert/strict'
import { scenario } from '../fixtures/scenario.mjs'
import { connectMail, deliveryIdOf } from '../fixtures/mail-providers.mjs'
import { installation, business, completedJob, assertTrail, mailEvents, postEvents } from './harness.mjs'

// COMM-018 point 1: each provider's fixed network edge sees exactly the one
// request a document email or a morning brief makes, with that provider's own
// credential form, recipient, Reply-To and delivery-id carriage; its own signed
// callbacks fold the exact states; nothing else changes any state. Only the
// provider network edge is synthetic; commands, cron and callbacks are real.
const names = { sendgrid: 'SendGrid', resend: 'Resend', postmark: 'Postmark', ses: 'Amazon SES' }
const prefix = { sendgrid: 'sg', resend: 're', postmark: 'pm', ses: 'ses' }
const others = { sendgrid: 'postmark', resend: 'ses', postmark: 'sendgrid', ses: 'resend' }
const address = name => [`synthetic-glove-${name}`, 'example.test'].join('@')
const owner = ['owner', 'example.test'].join('@'), replyTo = ['office', 'harbourair.example'].join('@')

const textOfSent = sent => sent.provider === 'resend' ? sent.body.text : sent.provider === 'postmark' ? sent.body.TextBody : sent.provider === 'ses' ? sent.body.Content.Simple.Body.Text.Data : sent.body.content[0].value
const carried = sent => sent.provider === 'resend' ? sent.idempotencyKey : deliveryIdOf(sent)
const replyField = { sendgrid: 'reply_to', resend: 'reply_to', postmark: 'ReplyTo', ses: 'ReplyToAddresses' }
const replyValue = (provider, email) => provider === 'ses' ? [email] : provider === 'sendgrid' ? { email } : email

// Connect a provider through the owner's command and return its own signed callback form.
async function connect(h, provider, n) {
  if (provider === 'sendgrid' || provider === 'resend') {
    const signer = mailEvents(provider), apiKey = `synthetic-glove-${n}`
    await h.command('mail.connect', { provider, apiKey, eventKey: signer.eventKey, fromEmail: address('office'), fromName: 'Synthetic Glove Service' })
    return { credential: `Bearer ${apiKey}`, secrets: [apiKey, signer.eventKey], callback(m, outcome, at) {
      const seconds = Math.floor(Date.parse(at) / 1000)
      return provider === 'sendgrid'
        ? signer.signed([{ email: m.to, timestamp: seconds, event: outcome === 'bounced' ? 'bounce' : outcome, sg_event_id: `synthetic-glove-event-${m.id}-${outcome}-${seconds}`, sg_message_id: m.receipt, rer_delivery_id: m.id }], { at: seconds })
        : signer.signed({ type: `email.${outcome}`, created_at: at, data: { email_id: m.receipt, to: [m.to] } }, { at: seconds })
    } }
  }
  const edge = await connectMail(h, provider)
  const probe = edge.callback({ id: 'probe', receipt: 'probe', to: owner }, 'delivered')
  const password = provider === 'postmark' ? atob(probe.headers.authorization.slice(6)).slice(6) : null
  return { credential: provider === 'postmark' ? edge.secret : /^AWS4-HMAC-SHA256 Credential=SYNTHETICGLOVE0001\/\d{8}\/us-east-1\/ses\/aws4_request, SignedHeaders=[a-z0-9;-]+, Signature=[0-9a-f]{64}$/, secrets: [edge.secret, ...(password ? [password] : [])], callback: edge.callback }
}

// A matched replay may only refresh the callback door's verified-at time.
async function snapshot(h, { matched = false } = {}) {
  const tables = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'glove_%' OR name LIKE 'rer_mail_%') ORDER BY name").all()).results.filter(({ name }) => !(matched && name === 'glove_mail_callback_auth'))
  return JSON.stringify(await Promise.all(tables.map(async ({ name }) => [name, (await h.db.prepare(`SELECT * FROM ${name}`).all()).results.map(r => JSON.stringify(r)).sort()])))
}

export async function providerEdge(t) {
  let n = 1000
  for (const provider of Object.keys(names)) await scenario(t, `COMM-018 point 1: ${names[provider]} documents and morning briefs reach only its fixed edge once each and its own signed callbacks fold their exact states`, async t => {
    const h = await installation(); t.after(() => h.close())
    const b = await business(h)
    const customer = await h.command('customer.save', { ...b.customer, email: address('customer'), apEmail: address('payables') })
    const { job } = await completedJob(h, b)
    const edge = await connect(h, provider, ++n)
    const bodies = [], sends = () => h.email.sent.filter(s => s.provider === provider).length
    const receiptOf = () => `${prefix[provider]}-receipt-${h.email.sent.length}`

    // (b) The morning brief: nothing before the chosen local time, one send per
    // business-local date through this provider, the brief's own text and brief:<date>.
    await h.command('mail.morning', { enabled: true, time: '07:30' })
    await h.scheduled('2026-10-22T20:29:00Z')
    assert.equal(h.email.sent.length, 0, 'nothing is sent before the chosen time')
    await Promise.all([h.scheduled('2026-10-22T20:30:00Z'), h.scheduled('2026-10-22T20:30:00Z')])
    assert.equal(h.email.sent.length, 1)
    const briefs = []
    const checkBrief = async (date, at, items) => {
      const sent = h.email.sent.at(-1), brief = await (await h.request(`/api/glove/brief?at=${at}`)).json()
      assert.deepEqual([sent.provider, sent.to, carried(sent)], [provider, owner, `brief:${date}`])
      const text = textOfSent(sent)
      assert.ok(text.includes(`morning brief for ${date}`))
      const lines = Object.values(brief.sections).flat().map(x => `- ${x.text} (${x.action.label})`)
      if (items) assert.ok(lines.length > 0 && lines.every(line => text.includes(line)), 'the email carries the brief\'s own items')
      bodies.push(text)
      briefs.push({ id: `brief:${date}`, date, to: owner, receipt: receiptOf() })
    }
    await checkBrief('2026-10-23', '2026-10-22T20:30:00Z', true)
    await h.scheduled('2026-10-22T21:30:00Z')
    await h.restart()
    await h.scheduled('2026-10-22T22:30:00Z')
    assert.equal(h.email.sent.length, 1, 'a later pass and an actual Worker restart send nothing more that date')
    await h.scheduled('2026-10-23T20:30:00Z')
    assert.equal(h.email.sent.length, 2, 'the next business-local date is its own single send')
    await checkBrief('2026-10-24', '2026-10-23T20:30:00Z')
    await h.scheduled('2026-10-23T23:00:00Z')
    assert.equal(h.email.sent.length, 2)

    // (a) A quote, an invoice and a purchase order: one request each.
    const q = await h.command('quote.draft', { customerId: customer.id, siteId: b.site.id, title: 'Edge proof', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
    const quote = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    const draft = await b.office.run('invoice.prepare', { jobId: job.id })
    const invoice = await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    const part = await h.command('service.save', { code: 'EDGE-PART', name: 'Edge part', kind: 'material', unit: 'each', unitCost: '10.00', unitPrice: '20.00', tax: 'FREE' })
    const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Edge warehouse' })
    const po = await b.office.run('po.save', { supplier: 'Edge supplier', supplierEmail: address('supplier'), locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: part.id, quantity: '1' }] })
    const docs = []
    for (const [kind, record, to] of [['quote', quote, customer.email], ['invoice', invoice, customer.apEmail], ['purchaseOrder', po, po.supplierEmail]]) {
      const payload = { kind, id: record.id, version: record.version }, commandId = `synthetic-glove-edge-${kind}-${provider}`, before = h.email.sent.length
      const message = await b.office.run('email.send', payload, { commandId })
      assert.equal(h.email.sent.length, before + 1, `${kind} makes exactly one request`)
      const sent = h.email.sent.at(-1)
      assert.equal(sent.provider, provider)
      if (provider === 'ses') assert.match(sent.authorization, edge.credential)
      else assert.equal(sent.authorization, edge.credential)
      assert.deepEqual([sent.to, carried(sent), message.to, sent.body[replyField[provider]]], [to, message.id, to, replyValue(provider, replyTo)])
      if (provider === 'ses') assert.equal(sent.body.ConfigurationSetName, 'glove-outcomes')
      assert.ok(textOfSent(sent).includes(record.number))
      bodies.push(textOfSent(sent))
      docs.push({ ...message, kind, receipt: receiptOf() })
      assert.deepEqual(await b.office.run('email.send', payload, { commandId }), message)
      assert.equal(h.email.sent.length, before + 1, 'command replay sends nothing')
    }
    const count = h.email.sent.length
    await h.restart()
    assert.equal(h.email.sent.length, count, 'an actual Worker restart sends nothing')
    assert.equal(sends(), count, 'only this provider\'s edge was reached')
    assert.equal(count, 5)

    // (c) Signed callbacks fold exact states. Another recipient is refused whole; no Glove message changes nothing.
    const [quoteMail, invoiceMail, poMail] = docs, [briefOne, briefTwo] = briefs
    const read = async () => (await h.state()).messageStates
    const base = Date.now()
    const at = ms => new Date(base + ms).toISOString()
    const briefStatus = async ({ date, id }) => (await (await h.request(`/api/glove/brief?at=${date === '2026-10-23' ? '2026-10-22T20:30:00Z' : '2026-10-23T20:30:00Z'}`)).json()).emailed
    const unchanged = async (input, status) => {
      const before = await snapshot(h), response = await postEvents(h, input)
      assert.equal(response.status, status, await response.clone().text())
      assert.equal(await snapshot(h), before, 'a callback that names no matching message changes nothing')
    }
    for (const m of [quoteMail, briefOne]) {
      await unchanged(edge.callback({ ...m, to: address('elsewhere') }, 'delivered', at(100)), 401)
      await unchanged(edge.callback({ ...m, id: 'synthetic-glove-no-such-message', receipt: 'synthetic-glove-no-such-receipt' }, 'delivered', at(100)), 200)
    }
    const post = async (m, outcome, ms) => {
      const event = edge.callback(m, outcome, at(ms))
      assert.equal((await postEvents(h, event)).status, 200)
      const before = await snapshot(h, { matched: true })
      assert.equal((await postEvents(h, event)).status, 200)
      assert.equal(await snapshot(h, { matched: true }), before, 'a replayed signed callback has no second effect')
    }
    await post(quoteMail, 'delivered', 0)
    await post(invoiceMail, 'delivered', 0); await post(invoiceMail, 'bounced', 2000)
    await post(poMail, 'bounced', 4000); await post(poMail, 'delivered', 1000)
    await post(briefOne, 'delivered', 5000)
    await post(briefTwo, 'bounced', 6000)
    const folded = await read(), expected = [[quoteMail, 'delivered'], [invoiceMail, 'bounced'], [poMail, 'bounced']]
    for (const [m, status] of expected) assert.deepEqual([folded[m.id].status, folded[m.id].providerMessageId, folded[m.id].text.includes(names[provider])], [status, m.receipt, true], `${m.kind} folds to ${status}`)
    assert.deepEqual([(await briefStatus(briefOne)).status, (await briefStatus(briefTwo)).status], ['delivered', 'bounced'])
    assert.deepEqual([(await briefStatus(briefOne)).to, (await briefStatus(briefTwo)).to], [owner, owner])
    const warning = (await h.state()).emailWarnings[customer.id]
    assert.deepEqual([warning.messageId, warning.to, warning.status], [invoiceMail.id, customer.apEmail, 'bounced'])

    // Activity and the business export carry each fact with its provider reference, never a key, password or body.
    const { exported } = await assertTrail(h, ['mail.connected', 'mail.morning', 'email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
    let page = await (await h.request('/api/glove/activity')).json()
    const activity = [...page.events]
    while (page.next) { page = await (await h.request(`/api/glove/activity?before=${page.next}`)).json(); activity.push(...page.events) }
    const facts = [[quoteMail, ['email.accepted', 'email.delivered']], [invoiceMail, ['email.accepted', 'email.delivered', 'email.bounced']], [poMail, ['email.accepted', 'email.bounced', 'email.delivered']], [briefOne, ['email.accepted', 'email.delivered']], [briefTwo, ['email.accepted', 'email.bounced']]]
    for (const [m, kinds] of facts) {
      for (const kind of kinds) {
        const kept = exported.timeline.filter(e => e.subject_id === m.id && e.kind === kind)
        assert.equal(kept.length, 1, `${m.id} keeps ${kind} once`)
        assert.equal(JSON.parse(kept[0].data).providerMessageId, m.receipt)
        const visible = activity.find(e => e.id === kept[0].id)
        assert.ok(visible && visible.summary.includes(m.receipt), `${kind} ${m.id} ${m.receipt} is readable in Activity with its provider reference: ${JSON.stringify(visible ?? kept[0])}`)
        assert.equal(visible.actorName, names[provider])
      }
    }
    const surfaces = JSON.stringify({ activity, exported, state: await h.state() })
    for (const value of [...edge.secrets, ...bodies]) assert.ok(!surfaces.includes(value), 'no key, password or body in state, Activity or the business export')

    // A callback signed for another provider that names this provider's messages changes nothing.
    const other = others[provider]
    const foreign = await connect(h, other, ++n)
    for (const m of [quoteMail, invoiceMail, briefOne]) {
      const before = await snapshot(h), response = await postEvents(h, foreign.callback(m, 'bounced', at(9000)))
      assert.equal(response.status, 200, await response.clone().text())
      assert.equal(await snapshot(h), before, `${names[other]}'s callback naming ${names[provider]}'s message changes nothing`)
    }
    assert.equal((await read())[quoteMail.id].status, 'delivered')
  })
}
