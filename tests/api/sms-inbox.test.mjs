import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob, assertTrail } from './harness.mjs'

const postSms = async (h, request) => h.mf.dispatchFetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), body: await request.text() })

test('The desk explicitly retains, assigns and answers a customer text on its job; STOP and role withdrawal close the send door', async t => {
  const h = await installation(); t.after(() => h.close())
  const date = new Date().toISOString().slice(0, 10)
  await h.request('/__test/clock', { method: 'POST', body: { at: `${date}T12:00:00Z` } })
  const b = await business(h, { currency: 'USD', timezone: 'UTC' }), { job } = await completedJob(h, b, date)
  let customer = await h.command('customer.save', { ...b.customer, phone: '+13125550123' })
  await h.command('sms.connect', { version: (await h.state()).business[0].version, provider: 'twilio', accountSid: h.twilio.accountSid, authToken: h.twilio.authToken, fromNumber: h.twilio.fromNumber, registration: 'a2p10dlc', registered: true, live: true })
  await h.command('sms.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true })
  await h.command('sms.consent', { customerId: customer.id, version: customer.version, purpose: 'visits', enabled: true, address: customer.phone, source: 'Customer booking call', wording: 'Please text me about this service visit. STOP ends texts.', timezone: 'UTC' })
  const receive = async body => { const request = h.twilio.inbound(h.origin, customer.phone, body), sid = new URLSearchParams(await request.clone().text()).get('MessageSid'); const r = await postSms(h, request); assert.equal(r.status, 200); return (await h.state()).messages.find(m => m.providerMessageId === sid) }
  const unopened = await receive('Please use the side door.')
  assert.equal(unopened.body, undefined, 'incoming body retention starts off')
  await h.command('sms.inboxConfigure', { version: (await h.state()).business[0].version, enabled: true, approved: true })
  let message = await receive('Can the technician call reception?')
  assert.equal(message.body, 'Can the technician call reception?')
  const viewer = await h.person('Vera Viewer', 'viewer')
  assert.equal((await viewer.state()).messages.find(m => m.id === message.id).body, undefined)
  for (const person of [viewer, b.agent, b.priyaPerson]) await person.run('sms.reply', { messageId: message.id, version: message.version, text: 'No permission' }, { error: 'FORBIDDEN' })
  message = await b.office.run('sms.assign', { messageId: message.id, version: message.version })
  message = await b.office.run('sms.thread', { messageId: message.id, version: message.version, jobId: job.id })
  const reply = await b.office.run('sms.reply', { messageId: message.id, version: message.version, text: 'Thank you. The office will call you to confirm the details.' })
  const sent = h.twilio.messages.values().next().value
  assert.match(sent.body, /^Thank you\. The office will call you to confirm the details\./)
  assert.match(sent.body, /Reply STOP/)
  assert.equal((await h.state()).messageStates[reply.id].status, 'accepted')
  assert.equal((await postSms(h, h.twilio.delivery(sent.sid))).status, 200)
  for (const query of [`customerId=${customer.id}`, `jobId=${job.id}`]) {
    const stream = await (await h.request(`/api/glove/conversation?${query}`)).json()
    assert.ok(stream.entries.some(e => e.text === message.body && e.direction === 'inbound'))
    assert.ok(stream.entries.some(e => e.text.startsWith('Thank you.') && e.direction === 'outbound' && e.author === b.office.name && e.delivery.includes('Delivered')))
  }
  const { activity, exported } = await assertTrail(h, ['sms.threaded', 'sms.queued', 'sms.delivered'])
  assert.ok(activity.some(e => e.kind === 'sms.threaded'))
  assert.ok(JSON.stringify(exported).includes(sent.sid))
  assert.ok(!JSON.stringify(activity).includes(message.body), 'raw inbound body does not enter Activity')
  await receive('STOP')
  await b.office.run('sms.reply', { messageId: message.id, version: (await h.state()).messages.find(m => m.id === message.id).version, text: 'No send after STOP' }, { error: 'SMS_CONSENT' })
  assert.equal(h.twilio.messages.size, 1)
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await b.office.run('sms.assign', { messageId: message.id, version: message.version }, { error: 'FORBIDDEN' })
})
