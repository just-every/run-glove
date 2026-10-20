// COMM-001 customer email through the owner's provider (fakes only at the
// provider edge): the owner connects SendGrid, the desk emails an approved
// quote, an approved invoice (to the accounts-payable address) and a purchase
// order to its supplier; signed delivered and bounced events are replayed to
// the public event door; each message's state reads on the timeline, the
// customer carries the bounce warning with what to do next, the COMM-007
// stream shows each email, and Activity and the export keep every new fact
// without a key. Resend, through the same Base mail adapter, correlates by its
// receipt.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, completedJob, assertTrail, mailEvents, postEvents } from './harness.mjs'

test('COMM-001 a quote, an invoice and a purchase order emailed through the owner\'s provider record delivered and bounced from signed provider events', async t => {
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
})
