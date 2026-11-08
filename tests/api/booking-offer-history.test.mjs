import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, postEvents } from './harness.mjs'
import { connectMail, receipt, textOf, deliveryIdOf } from '../fixtures/mail-providers.mjs'

const initial = '2030-01-01T12:00:00.000Z'
const address = ['synthetic-glove-member', 'example.test'].join('@')
const apAddress = ['synthetic-glove-accounts', 'example.test'].join('@')
async function fixture(t) {
  const h = await installation({ at: initial, captureLogs: true })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Glove Service', timezone: 'UTC' })
  const service = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Seasonal inspection', unitPrice: '100.00', tax: 'FREE' })
  const plan = await h.command('plan.save', { name: 'Seasonal Care', price: '200.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id })
  const office = await h.person('Synthetic Booking Office', 'office')
  const tech = await h.command('technician.save', { name: 'Synthetic technician' })
  const customer = await h.command('customer.save', { name: 'Synthetic Member', email: address, apEmail: apAddress })
  const sites = [], agreements = []
  for (let i = 0; i < 4; i++) {
    const site = await h.command('site.save', { customerId: customer.id, address: `${10 + i} Synthetic Street` })
    sites.push(site)
    agreements.push(await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: '2029-12-01' }))
  }
  const payload = i => ({ agreementId: agreements[i].id, index: 0, slots: [{ date: '2030-01-20', technicianId: tech.id, start: `${9 + i}:00`.padStart(5, '0'), end: `${9 + i}:30`.padStart(5, '0') }] })
  const read = async path => {
    const response = await h.request(path)
    assert.equal(response.status, 200)
    return response.json()
  }
  const publicRequest = (offer, slotId) => h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${offer.token}` }, ...(slotId ? { method: 'POST', body: { slotId } } : {}) })
  return { h, office, sites, agreements, payload, read, publicRequest }
}

async function noSecrets(h, offers, read) {
  const hashes = (await h.db.prepare('SELECT hash FROM glove_booking_secrets').all()).results.map(r => r.hash)
  const surfaces = {
    state: await h.state(),
    outcomes: (await h.db.prepare('SELECT result FROM glove_commands').all()).results,
    Activity: await read('/api/glove/activity'),
    export: await read('/api/glove/export'),
    logs: h.logs,
  }
  for (const [name, value] of Object.entries(surfaces)) {
    const bytes = JSON.stringify(value)
    for (const secret of [...offers.map(o => o.token), ...hashes]) assert.equal(bytes.includes(secret), false, `${name} excludes booking credentials`)
    assert.equal(/glb_[A-Za-z0-9_-]{43}/.test(bytes), false, `${name} excludes any booking bearer`)
  }
}

test('PLAN-011 lifecycle events retain exact historical attribution after Worker restart without replay disclosure', async t => {
  const { h, office, payload, read, publicRequest } = await fixture(t)
  const offers = [], replay = [], expected = []
  for (let i = 0; i < 4; i++) {
    const at = i === 2 ? '2029-12-18T12:08:00.000Z' : `2030-01-01T12:0${i + 1}:00.000Z`, commandId = randomUUID()
    await h.setTime(at)
    const offer = await office.run('agreement.offer', payload(i), { commandId })
    offers.push(offer)
    const { token, ...retained } = offer
    assert.match(token, /^glb_[A-Za-z0-9_-]{43}$/)
    replay.push({ commandId, payload: payload(i), retained })
    expected.push({ kind: 'agreement.offer.created', commandId, at, offer, role: 'office', visitId: null })
  }
  // Later role changes must never rewrite the historical creating role.
  await h.command('role.set', { operatorId: office.id, role: 'dispatcher' })
  await h.setTime('2030-01-01T12:05:00.000Z')
  const used = await publicRequest(offers[0], offers[0].slots[0].id)
  assert.equal(used.status, 200)
  assert.deepEqual((await used.json()).booked, { date: '2030-01-20', start: '09:00', end: '09:30', timezone: 'UTC' })
  const visit = (await h.state()).visits.find(v => v.jobId === offers[0].jobId)
  expected.push({ kind: 'agreement.offer.used', at: '2030-01-01T12:05:00.000Z', offer: offers[0], role: 'dispatcher', visitId: visit.id })
  await h.setTime('2030-01-01T12:06:00.000Z')
  const revokeCommand = randomUUID()
  await office.run('agreement.offerRevoke', { offerId: offers[1].id, version: offers[1].version }, { commandId: revokeCommand })
  expected.push({ kind: 'agreement.offer.revoked', commandId: revokeCommand, at: '2030-01-01T12:06:00.000Z', offer: offers[1], role: 'dispatcher', visitId: null })
  await h.setTime('2030-01-01T12:07:00.000Z')
  const outsideCommand = randomUUID()
  await office.run('agreement.offerSent', { offerId: offers[3].id, version: offers[3].version, method: 'phone follow-up' }, { commandId: outsideCommand })
  expected.push({ kind: 'agreement.offer.sentOutside', commandId: outsideCommand, at: '2030-01-01T12:07:00.000Z', offer: offers[3], role: 'dispatcher', visitId: null })
  await h.setTime('2030-01-01T12:08:00.000Z')
  assert.equal((await publicRequest(offers[2])).status, 404, 'the third offer expires at its actual fourteen-day boundary')
  for (const offer of offers.slice(0, 2)) assert.equal((await publicRequest(offer)).status, 404)
  const inspect = async () => {
    const activity = await read('/api/glove/activity'), exported = await read('/api/glove/export')
    const lifecycle = activity.events.filter(e => e.kind.startsWith('agreement.offer.'))
    assert.equal(lifecycle.length, 7)
    for (const x of expected) {
      const matching = lifecycle.filter(e => e.kind === x.kind && e.subjectId === x.offer.id)
      assert.equal(matching.length, 1)
      const e = matching[0]
      assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at, e.subjectKind, e.subjectId, e.jobId, activity.events.find(b => b.commandId === e.commandId && b.kind === 'visit.booked')?.subjectId ?? null], [office.id, office.name, x.role, x.at, 'bookingOffer', x.offer.id, x.offer.jobId, x.visitId])
      if (x.commandId) assert.equal(e.commandId, x.commandId)
      assert.ok(e.commandId)
      const kept = exported.timeline.find(k => k.id === e.id)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.subject_kind, kept.subject_id, kept.job_id, JSON.parse(kept.data)?.visitId ?? null, kept.command_id], [office.id, office.name, x.role, x.at, 'bookingOffer', x.offer.id, x.offer.jobId, x.visitId, e.commandId])
      if (x.kind === 'agreement.offer.sentOutside') {
        assert.equal(JSON.parse(kept.data).method, 'phone follow-up')
        assert.equal(JSON.parse(kept.data).deliveryVerified, false)
        assert.match(e.summary, /Synthetic Booking Office.*phone follow-up; delivery is not verified/)
      }
    }
    await noSecrets(h, offers, read)
    return { activity, exported, state: await h.state() }
  }
  const before = await inspect()
  await h.restart()
  assert.deepEqual(await inspect(), before, 'actual Worker restart preserves every retained event and record')
  for (const x of replay) assert.deepEqual(await office.run('agreement.offer', x.payload, { commandId: x.commandId }), x.retained)
  assert.deepEqual(await inspect(), before, 'identical command replays reveal no bearer and change nothing')
})

test('PLAN-011 emails one transactional on-record link, refuses unsafe issuance and retains authenticated provider states', async t => {
  const { h, office, payload, read } = await fixture(t)
  const edge = await connectMail(h, 'postmark')
  const noEmail = await h.command('customer.save', { name: 'Synthetic No Email' })
  const site = await h.command('site.save', { customerId: noEmail.id, address: '99 Synthetic Street' })
  const agreement = await office.run('agreement.sell', { planId: (await h.state()).plans[0].id, customerId: noEmail.id, siteId: site.id, via: 'phone', startDate: '2029-12-01' })
  const integration = await h.command('token.issue', { name: 'Synthetic booking integration', role: 'office' })
  const before = await read('/api/glove/export'), sentBefore = h.email.sent.length
  await office.run('agreement.offer', { ...payload(0), agreementId: agreement.id, email: true }, { error: 'EMAIL' })
  const response = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${integration.token}` }, body: { commandId: randomUUID(), type: 'agreement.offer', payload: { ...payload(0), email: true } } })
  assert.equal(response.status, 403)
  assert.equal((await response.json()).error.code, 'FORBIDDEN')
  assert.deepEqual(await read('/api/glove/export'), before, 'both refusals preserve jobs, offers, messages and audit')
  assert.equal(h.email.sent.length, sentBefore)
  const commandId = randomUUID(), emailPayload = { ...payload(0), email: true }
  const offer = await office.run('agreement.offer', emailPayload, { commandId })
  const message = receipt(h, { id: offer.emailed.messageId, to: address })
  assert.equal(h.email.sent.length, sentBefore + 1)
  const sent = h.email.sent.at(-1)
  assert.equal(sent.to, address)
  assert.equal(deliveryIdOf(sent), message.id)
  assert.ok(textOf(sent).includes(`/book#token=${offer.token}`))
  assert.equal(sent.body.MessageStream, 'outbound', 'Postmark transactional stream')
  assert.deepEqual(offer.emailed.by, { id: office.id, name: office.name, role: 'office' })
  assert.equal(offer.emailed.to, address)
  assert.equal((await h.state()).messages.find(m => m.id === message.id).kind, 'bookingLink')
  const checkState = async (status, text) => {
    const s = await h.state()
    const link = s.bookingOffers.find(o => o.id === offer.id)
    assert.equal(s.messageStates[link.emailed.messageId].status, status)
    assert.match(s.messageStates[link.emailed.messageId].text, text)
  }
  await checkState('accepted', /Accepted by Postmark; delivery not yet reported/)
  const delivered = edge.callback(message, 'delivered', '2030-01-01T12:01:00.000Z')
  assert.equal((await postEvents(h, { ...delivered, headers: {} })).status, 401)
  await checkState('accepted', /delivery not yet reported/)
  assert.equal((await postEvents(h, delivered)).status, 200)
  await checkState('delivered', /mail server \(reported by Postmark\)/)
  assert.equal((await postEvents(h, edge.callback(message, 'bounced', '2030-01-01T12:02:00.000Z'))).status, 200)
  await checkState('bounced', /did not accept it \(reported by Postmark\)/)
  const outside = await office.run('agreement.offerSent', { offerId: offer.id, version: offer.version, method: 'email follow-up' })
  assert.deepEqual(outside.sentOutside, { at: initial, by: { id: office.id, name: office.name, role: 'office' }, method: 'email follow-up' })
  const replay = await office.run('agreement.offer', emailPayload, { commandId })
  assert.equal(replay.token, undefined)
  assert.equal(h.email.sent.length, sentBefore + 1, 'callback and command replay never send again')
  const activity = await read('/api/glove/activity'), exported = await read('/api/glove/export')
  for (const kind of ['email.accepted', 'email.delivered', 'email.bounced']) {
    const events = activity.events.filter(e => e.kind === kind && e.subjectId === message.id)
    assert.equal(events.length, 1)
    assert.ok(exported.timeline.some(e => e.id === events[0].id))
  }
  const outsideEvent = activity.events.find(e => e.kind === 'agreement.offer.sentOutside')
  assert.equal(JSON.parse(exported.timeline.find(e => e.id === outsideEvent.id).data).deliveryVerified, false)
  assert.match(outsideEvent.summary, /Synthetic Booking Office.*email follow-up; delivery is not verified/)
  await h.restart()
  await checkState('bounced', /reported by Postmark/)
  await noSecrets(h, [offer], read)
})

test('PLAN-011 property histories show exact offer, outside-send, use, revoke and provider message rows only at their own site', async t => {
  const { h, office, sites, payload, read, publicRequest } = await fixture(t)
  const edge = await connectMail(h, 'postmark')
  const offers = []
  const first = await office.run('agreement.offer', { ...payload(0), email: true })
  offers.push(first)
  const sent = await office.run('agreement.offerSent', { offerId: first.id, version: first.version, method: 'phone' })
  await h.setTime('2030-01-01T12:01:00.000Z')
  assert.equal((await publicRequest(first, first.slots[0].id)).status, 200)
  const revoked = await office.run('agreement.offer', payload(1))
  offers.push(revoked)
  await h.setTime('2030-01-01T12:02:00.000Z')
  await office.run('agreement.offerRevoke', { offerId: revoked.id, version: revoked.version })
  const m = receipt(h, { id: first.emailed.messageId, to: address })
  const expected = [
    { at: '2030-01-01T12:01:00.000Z', kind: 'booking link', id: `${first.id}:used`, jobId: null, label: 'Seasonal Care visit 1: the customer chose a slot', status: 'used' },
    { at: initial, kind: 'booking link', id: first.id, jobId: null, label: 'Seasonal Care visit 1: 1 slot offered by Synthetic Booking Office', status: 'offered' },
    { at: initial, kind: 'booking link', id: `${first.id}:sent`, jobId: null, label: 'Seasonal Care visit 1: recorded by Synthetic Booking Office as sent by phone', status: 'delivery not verified' },
  ]
  const history = async i => (await read(`/api/glove/sites/${sites[i].id}/history`)).entries
  const inspect = async status => {
    const own = await history(0), other = await history(1), empty = await history(2)
    assert.deepEqual(own.filter(e => e.kind === 'booking link'), expected)
    assert.deepEqual(other.filter(e => e.kind === 'booking link'), [
      { at: '2030-01-01T12:02:00.000Z', kind: 'booking link', id: `${revoked.id}:revoked`, jobId: null, label: 'Seasonal Care visit 1: revoked', status: 'revoked' },
      { at: '2030-01-01T12:01:00.000Z', kind: 'booking link', id: revoked.id, jobId: null, label: 'Seasonal Care visit 1: 1 slot offered by Synthetic Booking Office', status: 'offered' },
    ])
    assert.deepEqual(empty.filter(e => ['booking link', 'message'].includes(e.kind)), [])
    const messages = own.filter(e => e.kind === 'message')
    assert.equal(messages.length, 1)
    assert.match(messages[0].label, /booking link emailed \(outbound, email, Synthetic Booking Office to /)
    assert.ok(messages[0].label.includes(address))
    assert.equal(messages[0].jobId, first.jobId)
    assert.match(messages[0].status, status)
    assert.deepEqual(other.filter(e => e.kind === 'message'), [])
    assert.equal(JSON.stringify(other).includes(first.id), false)
    assert.equal(JSON.stringify(own).includes(revoked.id), false)
    return { own, other, empty }
  }
  await inspect(/^Accepted by Postmark; delivery not yet reported$/)
  assert.equal((await postEvents(h, edge.callback(m, 'delivered', '2030-01-01T12:03:00.000Z'))).status, 200)
  await inspect(/^Delivered to .*mail server \(reported by Postmark\)$/)
  assert.equal((await postEvents(h, edge.callback(m, 'bounced', '2030-01-01T12:04:00.000Z'))).status, 200)
  const before = await inspect(/^Bounced: .*reported by Postmark/)
  await h.restart()
  assert.deepEqual(await inspect(/^Bounced:/), before)
  assert.equal(sent.sentOutside.method, 'phone')
  await noSecrets(h, offers, read)
})
