import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation, assertTrail } from './harness.mjs'
import { exportedFixture } from '../fixtures/movein.mjs'

const initial = '2030-01-01T12:00:00.000Z'
async function fixture(t) {
  const h = await installation({ at: initial, captureLogs: true })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Glove Service', timezone: 'America/Chicago' })
  const service = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Seasonal inspection', unitPrice: '100.00', tax: 'FREE' })
  const plan = await h.command('plan.save', { name: 'Seasonal Care', price: '200.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
  const office = await h.person('Synthetic Offer Office', 'office')
  const field = await h.person('Synthetic Offer Technician', 'technician')
  const tech = await h.command('technician.save', { name: field.name, operatorId: field.id })
  let number = 0
  const member = async () => {
    const customer = await h.command('customer.save', { name: `Synthetic Member ${++number}`, contact: 'Private contact', billingAddress: 'Private billing address' })
    const site = await h.command('site.save', { customerId: customer.id, address: `${10 + number} Synthetic Street`, accessNotes: 'Private gate instructions' })
    const agreement = await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: '2029-06-01' })
    return { customer, site, agreement }
  }
  const slots = count => Array.from({ length: count }, (_, i) => ({ date: '2030-01-20', technicianId: tech.id, start: `${String(8 + i).padStart(2, '0')}:00`, end: `${String(8 + i).padStart(2, '0')}:30` }))
  const payload = (m, count = 1, index = 0) => ({ agreementId: m.agreement.id, index, slots: slots(count) })
  const read = async path => {
    const response = await h.request(path)
    assert.equal(response.status, 200)
    return response.json()
  }
  const publicRequest = (link, slotId, extra = {}) => h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${link.token}` }, ...(slotId !== undefined ? { method: 'POST', body: { slotId } } : {}), ...extra })
  const noVisit = async link => assert.deepEqual((await h.state()).visits.filter(v => v.jobId === link.jobId), [])
  return { h, service, plan, office, field, tech, member, slots, payload, read, publicRequest, noVisit }
}

async function privateSurfaces(h, links, read) {
  const secrets = (await h.db.prepare('SELECT link_id,hash FROM glove_booking_secrets').all()).results
  for (const link of links) {
    assert.match(link.token, /^glb_[A-Za-z0-9_-]{43}$/)
    assert.equal(Buffer.from(link.token.slice(4), 'base64url').length, 32)
    assert.equal(secrets.find(s => s.link_id === link.id)?.hash, createHash('sha256').update(`glove-booking-link:${link.token}`).digest('hex'))
  }
  const surfaces = { state: await h.state(), outcomes: (await h.db.prepare('SELECT result FROM glove_commands').all()).results, Activity: await read('/api/glove/activity'), export: await read('/api/glove/export'), logs: h.logs }
  for (const [name, surface] of Object.entries(surfaces)) {
    const bytes = JSON.stringify(surface)
    for (const secret of [...links.map(l => l.token), ...secrets.map(s => s.hash)]) assert.equal(bytes.includes(secret), false, `${name} excludes booking credentials`)
    assert.doesNotMatch(bytes, /glb_[A-Za-z0-9_-]{43}/, `${name} excludes any booking bearer`)
  }
  // Domain storage and saved results contain metadata only, even before projection.
  const stored = JSON.stringify((await h.db.prepare('SELECT data FROM glove_records').all()).results)
  for (const link of links) assert.equal(stored.includes(link.token), false)
}

test('PLAN-010 desk issuance enforces slot bounds, current permissions and outstanding entitlement state while preserving included ordinals', async t => {
  const { h, office, field, tech, member, payload, slots } = await fixture(t)
  const dispatcher = await h.person('Synthetic Offer Dispatcher', 'dispatcher')
  const actors = [{ name: 'Olivia Owner', run: h.command }, dispatcher, office]
  for (const actor of actors) for (const count of [1, 10]) {
    const m = await member(), input = payload(m, count, 1)
    const beforeJobs = (await h.state()).jobs.length
    const link = await actor.run('agreement.offer', input)
    const jobs = (await h.state()).jobs
    assert.equal(link.slots.length, count)
    assert.equal(jobs.length, beforeJobs + 1)
    const job = jobs.find(j => j.id === link.jobId)
    assert.deepEqual([job.agreementId, job.agreementVisitIndex, job.siteId, job.customerId, job.totals.total], [m.agreement.id, 1, m.site.id, m.customer.id, '0.00'])
    assert.equal(link.offeredBy.name, actor.name)
    const reused = await actor.run('agreement.offer', input)
    assert.equal(reused.jobId, job.id)
    assert.equal((await h.state()).jobs.length, jobs.length, 'offering again reuses the existing included job')
    const refuse = async (input, error) => {
      const before = await h.state()
      await actor.run('agreement.offer', input, { error })
      assert.deepEqual(await h.state(), before, 'a refused offer creates no job, metadata or Activity')
    }
    await refuse({ ...input, slots: [] }, 'INPUT')
    await refuse({ ...input, slots: slots(11) }, 'INPUT')
    await refuse({ ...input, slots: [{ ...slots(1)[0], date: '2029-12-31' }] }, 'TIME')
    const blocked = await h.command('job.create', { customerId: m.customer.id, siteId: m.site.id, title: 'Private competing repair' })
    const booking = await h.command('visit.book', { ...slots(1)[0], jobId: blocked.id })
    await refuse({ ...input, slots: slots(1) }, 'CONFLICT_REVIEW')
    await h.command('visit.cancel', { visitId: booking.id, version: booking.version, reason: 'Finished refusal proof' })
  }
  const m = await member(), input = payload(m)
  const role = await h.command('role.save', { name: 'Synthetic agreement clerk', permissions: ['agreement.offer'] })
  const clerk = await h.person('Synthetic Offer Clerk', `custom:${role.id}`)
  for (const actor of [field, clerk]) {
    const before = await h.state()
    await actor.run('agreement.offer', input, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), before)
  }
  const token = await h.command('token.issue', { name: 'Synthetic agreement integration', role: 'office' })
  const beforeToken = await h.request('/api/glove/export').then(r => r.json())
  const integration = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type: 'agreement.offer', payload: input } })
  assert.equal(integration.status, 403)
  assert.equal((await integration.json()).error.code, 'FORBIDDEN')
  assert.deepEqual(await h.request('/api/glove/export').then(r => r.json()), beforeToken)
  const declined = await member()
  await office.run('agreement.decline', { agreementId: declined.agreement.id, version: declined.agreement.version, index: 0, method: 'phone', customerName: declined.customer.name, reason: 'Explicitly skipping this visit' })
  const completed = await member(), booked = await member()
  for (const [m, finish] of [[completed, true], [booked, false]]) {
    const job = await office.run('job.create', { customerId: m.customer.id, siteId: m.site.id, agreementId: m.agreement.id, agreementVisitIndex: 0, title: 'Included inspection' })
    const visit = await office.run('visit.book', { ...slots(1)[0], start: finish ? '20:00' : '21:00', end: finish ? '20:30' : '21:30', jobId: job.id })
    if (finish) {
      await field.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await field.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Inspection complete', signoff: { absentReason: 'Customer away' } })
    }
    else await h.command('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Free the technician for the booked-state fixture' })
    if (!finish) await office.run('visit.book', { ...slots(1)[0], start: '19:00', end: '19:30', jobId: job.id })
  }
  const files = await exportedFixture('servicetitan')
  const events = files.find(f => f.name === 'recurring-service-events.json'), source = JSON.parse(events.text)
  source.data[1].status = 'Dismissed'
  events.text = JSON.stringify(source)
  const stage = await h.command('import.stage', { format: 'servicetitan', files })
  assert.deepEqual(stage.preview.rejections, [])
  await h.command('import.commit', { batchId: stage.id, version: stage.version, fingerprint: stage.preview.fingerprint })
  const imported = (await h.state()).agreements.find(a => a.importedEntitlements?.some(v => v.sourceClosed))
  assert.ok(imported, 'documented source cancellation produces a closed entitlement')
  const inputs = [payload(declined), payload(completed), payload(booked), { agreementId: imported.id, index: imported.importedEntitlements.findIndex(v => v.sourceClosed), slots: slots(1) }]
  for (const denied of inputs) {
    const before = await h.state()
    await office.run('agreement.offer', denied, { error: 'ENTITLEMENT' })
    assert.deepEqual(await h.state(), before)
  }
  await h.restart()
  for (const denied of inputs) await office.run('agreement.offer', denied, { error: 'ENTITLEMENT' })
})

test('PLAN-010 bearer custody survives restart, expires at the runtime boundary and ends atomically on use or staff revocation', async t => {
  const { h, office, member, payload, read, publicRequest, noVisit } = await fixture(t)
  const m = await member(), commandId = randomUUID(), input = payload(m, 2)
  const link = await office.run('agreement.offer', input, { commandId })
  assert.equal(link.createdAt, initial)
  assert.equal(link.expiresAt, '2030-01-15T12:00:00.000Z')
  const { token, ...retained } = link
  assert.deepEqual(await office.run('agreement.offer', input, { commandId }), retained)
  assert.equal((await publicRequest(link)).status, 200)
  await h.restart()
  assert.deepEqual(await office.run('agreement.offer', input, { commandId }), retained)
  assert.equal((await publicRequest(link)).status, 200)
  await h.setTime('2030-01-15T11:59:59.999Z')
  assert.equal((await publicRequest(link)).status, 200, 'last instant before fourteen days')
  for (const at of ['2030-01-15T12:00:00.000Z', '2030-01-15T12:00:00.001Z']) {
    await h.setTime(at)
    assert.equal((await publicRequest(link)).status, 404)
    assert.equal((await publicRequest(link, link.slots[0].id)).status, 404)
    await h.setTime(initial)
    await noVisit(link)
  }
  await h.setTime('2030-01-15T12:00:00.001Z')
  await h.restart()
  assert.equal((await publicRequest(link)).status, 404)
  await h.setTime(initial)
  const revoked = await office.run('agreement.offer', payload(await member()))
  await office.run('agreement.offerRevoke', { offerId: revoked.id, version: revoked.version })
  assert.equal((await publicRequest(revoked)).status, 404)
  assert.equal((await publicRequest(revoked, revoked.slots[0].id)).status, 404)
  await noVisit(revoked)
  const used = await office.run('agreement.offer', payload(await member(), 2))
  const answers = await Promise.all(used.slots.map(slot => publicRequest(used, slot.id)))
  assert.deepEqual(answers.map(r => r.status).sort(), [200, 404], 'two simultaneous different choices commit exactly one booking')
  const state = await h.state(), visits = state.visits.filter(v => v.jobId === used.jobId), storedLink = state.bookingOffers.find(o => o.id === used.id)
  assert.equal(visits.length, 1)
  assert.equal(storedLink.visitId, visits[0].id)
  assert.deepEqual([storedLink.usedAt, storedLink.revokedAt], [initial, initial])
  const { activity, exported } = await assertTrail(h, ['agreement.offer.created', 'agreement.offer.revoked', 'agreement.offer.used', 'visit.booked'])
  const use = activity.find(e => e.kind === 'agreement.offer.used' && e.subjectId === used.id)
  assert.deepEqual([use.actorId, use.actorRole, use.at, use.jobId, JSON.parse(exported.timeline.find(e => e.id === use.id).data).visitId], [office.id, 'office', initial, used.jobId, visits[0].id])
  assert.equal(exported.timeline.filter(e => e.kind === 'agreement.offer.used' && e.subject_id === used.id).length, 1)
  await privateSurfaces(h, [link, revoked, used], read)
  await h.restart()
  for (const ended of [revoked, used]) {
    assert.equal((await publicRequest(ended)).status, 404)
    assert.equal((await publicRequest(ended, ended.slots[0].id)).status, 404)
  }
  assert.deepEqual((await h.state()).visits, state.visits)
  await privateSurfaces(h, [link, revoked, used], read)
})

test('PLAN-010 customer choices use live offering authority and refuse deactivation, role withdrawal, branch exclusion and erased replay', async t => {
  const { h, office, member, payload, read, publicRequest, noVisit } = await fixture(t)
  const links = []
  const denied = async link => {
    const before = await h.state()
    for (const slotId of [undefined, link.slots[0].id]) {
      const response = await publicRequest(link, slotId)
      assert.equal(response.status, 404)
      assert.equal((await response.json()).error.code, 'BOOKING_LINK')
    }
    await noVisit(link)
    assert.deepEqual(await h.state(), before, 'withdrawn authority cannot change the business')
  }
  for (const change of ['deactivate', 'role', 'branch']) {
    const actor = await h.person(`Synthetic ${change} Office`, 'office'), m = await member()
    const link = await actor.run('agreement.offer', payload(m)); links.push(link)
    assert.equal((await publicRequest(link)).status, 200)
    if (change === 'deactivate') {
      const response = await h.request('/auth/operator/status', { method: 'POST', body: { operatorId: actor.id, status: 'inactive' } })
      assert.equal(response.status, 200, await response.text())
    } else if (change === 'role') await h.command('role.set', { operatorId: actor.id, role: 'viewer' })
    else {
      const branch = await h.command('branch.save', { name: 'Synthetic other branch', timezone: 'UTC', prefix: 'SYN', zips: ['75201'] })
      await h.command('branch.limit', { operatorId: actor.id, branchId: branch.id })
    }
    await denied(link)
    await h.restart()
    await denied(link)
  }
  const live = await office.run('agreement.offer', payload(await member()))
  await h.command('role.set', { operatorId: office.id, role: 'dispatcher' })
  assert.equal((await publicRequest(live, live.slots[0].id)).status, 200)
  const visit = (await h.state()).visits.find(v => v.jobId === live.jobId)
  assert.deepEqual([visit.assignments[0].by.id, visit.assignments[0].by.role], [office.id, 'dispatcher'])
  const use = (await read('/api/glove/activity')).events.find(e => e.kind === 'agreement.offer.used' && e.subjectId === live.id)
  assert.deepEqual([use.actorId, use.actorRole], [office.id, 'dispatcher'])
  const erased = await member(), input = { ...payload(erased), slots: [{ ...payload(erased).slots[0], start: '10:00', end: '10:30' }] }, commandId = randomUUID()
  const link = await office.run('agreement.offer', { ...input, slots: [{ ...input.slots[0], start: '10:00', end: '10:30' }] }, { commandId })
  const preview = await h.command('privacy.preview', { customerId: erased.customer.id, version: erased.customer.version })
  await h.command('privacy.erase', { customerId: erased.customer.id, version: erased.customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  await denied(link)
  await office.run('agreement.offer', input, { commandId, error: 'ERASED' })
  await h.restart()
  await denied(link)
  const exported = await read('/api/glove/export')
  assert.equal(exported.bookingOffers.some(o => o.id === link.id), false)
  assert.equal(JSON.stringify(exported).includes(link.token), false)
  await privateSurfaces(h, [...links, live], read)
})

test('PLAN-010 public reads and choices repeat conflicts, disclose only remaining offers and keep exhausted visits due', async t => {
  const { h, office, tech, member, payload, slots, read, publicRequest, noVisit } = await fixture(t)
  const m = await member(), other = await member()
  const link = await office.run('agreement.offer', payload(m, 2))
  const response = await publicRequest(link), view = await response.json()
  assert.equal(response.headers.get('cache-control'), 'no-store, private')
  assert.deepEqual(view.offer, { business: 'Synthetic Glove Service', service: 'Seasonal inspection', address: m.site.address, expiresAt: '2030-01-15T12:00:00.000Z', slots: link.slots.map((s, i) => ({ id: s.id, date: '2030-01-20', start: i ? '09:00' : '08:00', end: i ? '09:30' : '08:30', timezone: 'America/Chicago' })) })
  const baseline = await h.state()
  for (const request of [
    () => h.request(`/api/glove/public/booking?token=${link.token}`, { as: '' }),
    () => h.request('/api/glove/public/booking', { as: '', headers: { cookie: `token=${link.token}` } }),
    () => h.request('/api/glove/public/booking', { as: '', method: 'POST', body: { token: link.token, slotId: link.slots[0].id } }),
    () => publicRequest(link, link.slots[0].id, { method: 'POST', body: { slotId: link.slots[0].id, token: link.token } }),
    () => publicRequest(link, link.slots[0].id, { headers: { authorization: `Bearer ${link.token}`, origin: 'https://foreign.example.test' } }),
  ]) assert.ok((await request()).status >= 400)
  for (const path of ['/api/glove/state', '/api/glove/activity', '/api/glove/export', `/api/glove/sites/${m.site.id}/history`, '/api/glove/public/quote', '/api/glove/public/reports']) {
    assert.ok((await h.request(path, { as: '', headers: { authorization: `Bearer ${link.token}` } })).status >= 400, `${path} grants no access to this bearer`)
  }
  const arbitrary = await publicRequest(link, randomUUID())
  assert.equal((await arbitrary.json()).error.code, 'SLOT_TAKEN')
  assert.deepEqual(await h.state(), baseline)
  const job = await office.run('job.create', { customerId: other.customer.id, siteId: other.site.id, title: 'Private competing work' })
  await h.command('visit.book', { ...slots(1)[0], jobId: job.id })
  const remaining = { ...view.offer, slots: [view.offer.slots[1]] }
  assert.deepEqual((await (await publicRequest(link)).json()).offer, remaining)
  const beforeConflict = await h.state()
  const stale = await publicRequest(link, link.slots[0].id), error = (await stale.json()).error
  assert.equal(stale.status, 409)
  assert.equal(error.code, 'SLOT_TAKEN')
  assert.deepEqual(error.details, { offer: remaining }, 'no customer, job, technician or conflict details leave the public door')
  assert.deepEqual(await h.state(), beforeConflict)
  await noVisit(link)
  // Even warning-level eligibility requires desk review; this public door cannot acknowledge it.
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { availability: 'warn' } })
  await h.command('technician.save', { ...(await h.state()).technicians.find(t => t.id === tech.id), timeOff: [{ from: '2030-01-20', to: '2030-01-20', reason: 'Private absence' }] })
  const empty = { ...view.offer, slots: [] }
  const beforeEligibility = await h.state()
  assert.deepEqual((await (await publicRequest(link)).json()).offer, empty)
  const ineligible = await publicRequest(link, link.slots[1].id)
  assert.equal(ineligible.status, 409)
  assert.deepEqual((await ineligible.json()).error.details, { offer: empty })
  assert.deepEqual(await h.state(), beforeEligibility)
  await noVisit(link)
  const due = (await read('/api/glove/due-visits?through=2030-01-31')).visits.find(v => v.agreementId === m.agreement.id && v.index === 0)
  assert.deepEqual([due.jobId, due.booked], [link.jobId, false])
  await h.restart()
  assert.deepEqual((await (await publicRequest(link)).json()).offer, empty)
  assert.equal((await publicRequest(link, link.slots[1].id)).status, 409)
  await noVisit(link)
  assert.deepEqual((await read('/api/glove/due-visits?through=2030-01-31')).visits.find(v => v.id === due.id), due)
  await privateSurfaces(h, [link], read)
})
