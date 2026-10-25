import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, assertTrail } from './harness.mjs'
import { statusFixture } from './visit-status-fixture.mjs'
import { requestPhotoFixtures, sentinel } from '../fixtures/request-photos.mjs'

/** Fold into the existing COMM-004 public-door test; no extra registered test. */
export async function portraitStatusFlow(t) {
  const h = await installation(); t.after(() => h.close())
  const { b, visit, at, day } = await statusFixture(h)
  const png = requestPhotoFixtures().find(p => p.mediaType === 'image/png')
  const own = async () => (await b.priyaPerson.state()).technicians.find(t => t.id === b.priya.id)
  const portrait = async (enabled, extra = {}) => b.priyaPerson.run('technician.portrait', { version: (await own()).version, enabled, ...(enabled ? { consent: true, photo: png } : {}), ...extra })
  const currentVisit = async () => (await h.state()).visits.find(v => v.id === visit.id)
  const onMyWay = async () => b.priyaPerson.run('visit.onMyWay', { visitId: visit.id, version: (await currentVisit()).version })
  const upload = { version: (await own()).version, enabled: true, consent: true, photo: png }
  await h.command('technician.portrait', upload, { error: 'FORBIDDEN' })
  await b.tomPerson.run('technician.portrait', { ...upload, technicianId: b.priya.id }, { error: 'FORBIDDEN' })
  await portrait(false)
  await b.priyaPerson.run('visit.onMyWay', { visitId: visit.id, version: (await currentVisit()).version }, { error: 'PORTRAIT' })
  assert.equal(h.twilio.messages.size, 0)
  await b.priyaPerson.run('technician.portrait', { version: (await own()).version, enabled: true, photo: png }, { error: 'CONSENT' })
  await portrait(true)
  const firstFile = (await own()).portrait.file.fileId
  const privateFile = await h.request(`/api/glove/files/${firstFile}`, { as: b.priyaPerson.cookie })
  assert.equal(privateFile.status, 200)
  const cleanBytes = Buffer.from(await privateFile.arrayBuffer())
  assert.ok(!cleanBytes.includes(Buffer.from(sentinel)), 'public portrait storage strips photo metadata')
  assert.equal((await h.request(`/api/glove/files/${firstFile}`, { as: b.tomPerson.cookie })).status, 404)
  const id = randomUUID(), payload = { visitId: visit.id, version: (await currentVisit()).version }
  await b.priyaPerson.run('visit.onMyWay', payload, { commandId: id })
  await b.priyaPerson.run('visit.onMyWay', payload, { commandId: id })
  assert.equal(h.twilio.messages.size, 1)
  const token = /\/technician-photo#token=(gtp_[\w-]+)/.exec([...h.twilio.messages.values()][0].body)?.[1]
  assert.ok(token, 'the actual customer text carries a private photo link')
  const get = (image = false, credential = token, query = '') => h.request(`/api/glove/public/technician-photo${image ? '/image' : ''}${query}`, { as: '', headers: { authorization: `Bearer ${credential}` } })
  const page = await get()
  assert.equal(page.status, 200)
  assert.deepEqual(await page.json(), { firstName: 'Priya' })
  const image = await get(true)
  assert.equal(image.status, 200)
  assert.equal(image.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), cleanBytes)
  assert.match(image.headers.get('cache-control'), /no-store/)
  assert.equal(image.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(image.headers.get('x-content-type-options'), 'nosniff')
  assert.equal((await get(false, 'gtp_' + 'a'.repeat(43))).status, 404)
  assert.equal((await get(true, token, '?file=other')).status, 404)
  assert.equal((await h.request('/api/glove/public/technician-photo', { as: '' })).status, 404)
  const { exported } = await assertTrail(h, ['technician.portrait', 'visit.onMyWay', 'sms.queued'])
  assert.ok(!JSON.stringify(exported).includes(token))
  assert.ok(!JSON.stringify(await b.priyaPerson.state()).includes(token))
  await h.request('/__test/clock', { method: 'POST', body: { at: `${day}T17:00:00.000Z` } })
  assert.equal((await get()).status, 404, 'expired photo links cannot reveal the portrait')
  assert.equal((await get(true)).status, 404)
  await h.request('/__test/clock', { method: 'POST', body: { at } })
  assert.equal((await get()).status, 200)
  await portrait(true)
  assert.equal((await get()).status, 404, 'replacing a portrait closes its old link')
  assert.equal((await h.request(`/api/glove/files/${firstFile}`, { as: b.priyaPerson.cookie })).status, 404)
  const replacementFile = (await own()).portrait.file.fileId
  await portrait(false)
  assert.equal((await h.request(`/api/glove/files/${replacementFile}`, { as: b.priyaPerson.cookie })).status, 404, 'withdrawal removes the original too')
  await portrait(true)
  // A new assignment of the same visit allows a fresh notice, never the old bearer.
  let v = await currentVisit()
  await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, technicianId: b.tom.id, reason: 'Customer technician reassigned' })
  v = await currentVisit()
  await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, technicianId: b.priya.id, start: '14:00', end: '15:00', reason: 'Rebook with original technician' })
  await b.priyaPerson.run('timer.stop', { visitId: visit.id, deviceTime: at })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'travel', deviceTime: at })
  await b.priyaPerson.run('location.phone', { lat: 41.89, lng: -87.63, observedAt: at })
  await onMyWay()
  const latest = [...h.twilio.messages.values()].at(-1)
  const latestToken = /\/technician-photo#token=(gtp_[\w-]+)/.exec(latest.body)?.[1]
  assert.ok(latestToken && latestToken !== token)
  assert.equal((await get(false, latestToken)).status, 200)
  v = await currentVisit()
  await b.dispatcher.run('visit.change', { visitId: v.id, version: v.version, technicianId: b.tom.id, reason: 'New technician takes this visit' })
  assert.equal((await get(false, latestToken)).status, 404)
  assert.equal((await get(true, latestToken)).status, 404)
}
