import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation } from './harness.mjs'

const endpoint = '/api/glove/public/intake'
const embed = 'https://synthetic-glove-1.example.test'
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII='
let nextToken = 100
const request = () => ({ submissionId: randomUUID(), turnstileToken: `synthetic-glove-${nextToken++}`, consent: true, name: 'synthetic-glove-3', phone: '(212) 555-0101', email: 'synthetic-glove-3@example.test', address: '4 synthetic-glove-4, New York NY 10001', service: 'synthetic-glove-5', description: 'synthetic-glove-6', preferredTimes: 'synthetic-glove-7', source: 'synthetic-glove-8', photos: [{ mediaType: 'image/png', base64: png, caption: 'synthetic-glove-9' }, { mediaType: 'image/png', base64: png, caption: 'synthetic-glove-10' }] })
const send = (h, body, origin = embed) => h.request(endpoint, { method: 'POST', as: '', headers: { origin }, body })
const challenge = (hostname = new URL(embed).hostname) => ({ success: true, action: 'glove-request', hostname, challenge_ts: new Date().toISOString() })
async function configure(h, extra = {}) {
  const b = (await h.state()).business[0]
  return h.command('intake.configure', { version: b.version, enabled: true, siteKey: 'synthetic-glove-11', secret: 'synthetic-glove-12', allowedOrigins: [embed], ...extra })
}
async function setup(h) {
  await h.command('business.save', { name: 'synthetic-glove-13', timezone: 'America/New_York', currency: 'USD' })
}
async function durable(h) {
  const state = await h.state()
  const tables = {}
  for (const table of ['glove_files', 'glove_events', 'glove_commands']) tables[table] = (await h.db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n
  return { state, tables }
}

test('BOOK-001 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure', async t => {
  const h = await installation()
  t.after(() => h.close())
  await setup(h)
  assert.equal((await h.request(endpoint, { as: '' })).status, 404)
  const office = await h.person('synthetic-glove-14', 'office')
  await office.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', secret: 'synthetic-glove-12', allowedOrigins: [] }, { error: 'FORBIDDEN' })
  const customer = await office.run('customer.save', { name: 'synthetic-glove-15', phone: '+1 212 555 0101', email: 'synthetic-glove-15@example.test' })
  await configure(h)
  const config = await h.request(endpoint, { as: '', headers: { origin: embed } })
  assert.equal(config.headers.get('access-control-allow-origin'), embed)
  assert.deepEqual(await config.json(), { businessName: 'synthetic-glove-13', siteKey: 'synthetic-glove-11', action: 'glove-request' })
  h.turnstile.answer = () => challenge()
  const input = request(), response = await send(h, input)
  assert.equal(response.status, 200, await response.clone().text())
  const receipt = await response.json()
  assert.deepEqual(Object.keys(receipt).sort(), ['ok', 'receipt'])
  assert.equal(receipt.ok, true)
  const state = await h.state(), enquiry = state.enquiries[0]
  assert.equal(state.customers.length, 1)
  assert.equal(enquiry.customerId, customer.id)
  assert.equal(enquiry.source, 'website')
  assert.equal(enquiry.intake.preferredTimes, input.preferredTimes)
  assert.equal(enquiry.photos.length, 2)
  assert.ok(!JSON.stringify(state).includes('synthetic-glove-12'))
  assert.ok(!(await (await h.request('/api/glove/export')).text()).includes('synthetic-glove-12'))
  const notices = (await office.state()).notices
  assert.ok(notices.some(n => n.enquiryId === enquiry.id && n.to.includes('office')))
  assert.ok(state.events.some(e => e.kind === 'intake.received' && e.subjectId === enquiry.id))
  assert.deepEqual(Object.keys(h.turnstile.calls[0]).sort(), ['response', 'secret'])
  const beforeReplay = await durable(h)
  assert.deepEqual(await (await send(h, input)).json(), receipt)
  assert.deepEqual(await durable(h), beforeReplay)
  await h.command('service.save', { code: 'synthetic-glove-21', name: 'synthetic-glove-22', unitPrice: '25.00', tax: 'TAXABLE' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'synthetic-glove-23', key: 'synthetic-glove-24' })
  h.models.answer = () => ({ title: 'synthetic-glove-25', ...Object.fromEntries(['good', 'better', 'best'].map(tier => [tier, { reason: 'synthetic-glove-26', lines: [{ code: 'synthetic-glove-21', quantity: '1' }] }])) })
  await h.command('quote.suggest', { enquiryId: enquiry.id })
  const modelRequest = JSON.stringify(h.models.calls[0].body)
  assert.ok(modelRequest.includes(input.description))
  assert.ok(!modelRequest.includes(png))
  assert.ok(!modelRequest.includes(input.email))
  assert.ok(!modelRequest.includes(input.address))
  const fileId = enquiry.photos[0].file.fileId
  const original = await h.request(`/api/glove/files/${fileId}`, { as: office.cookie })
  assert.equal(original.status, 200)
  assert.equal(Buffer.from(await original.arrayBuffer()).toString('base64'), png)
  assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: '' })).status, 401)
  assert.equal((await h.request(endpoint + '/files/' + fileId, { as: '' })).status, 401)
  await h.command('role.set', { operatorId: office.id, role: 'technician' })
  assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: office.cookie })).status, 404)
  const exported = JSON.parse((await h.command('privacy.export', { customerId: customer.id, version: customer.version })).download)
  assert.equal(exported.files.filter(f => enquiry.photos.some(p => p.file.fileId === f.id)).length, 2)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.equal((await h.request(`/api/glove/files/${fileId}`)).status, 404)
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_files WHERE capture_id=?').bind(enquiry.id).first()).n, 0)
  assert.ok(!JSON.stringify((await h.state()).enquiries).includes(input.description))
  const external = JSON.stringify([...h.turnstile.calls, ...h.marketing, ...h.email.sent])
  assert.ok(!external.includes(input.description))
  assert.ok(!external.includes(png))
})

test('BOOK-001 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission', async t => {
  const h = await installation()
  t.after(() => h.close())
  await setup(h)
  await configure(h)
  const baseline = await durable(h)
  for (const result of [{ success: false }, { ...challenge(), action: 'synthetic-glove-16' }, challenge('synthetic-glove-17.example.test'), { ...challenge(), challenge_ts: new Date(Date.now() - 301_000).toISOString() }]) {
    h.turnstile.answer = () => result
    assert.equal((await send(h, request())).status, 400)
    assert.deepEqual(await durable(h), baseline)
  }
  assert.equal((await send(h, { ...request(), consent: false })).status, 400)
  assert.equal((await send(h, request(), 'https://synthetic-glove-18.example.test')).status, 403)
  assert.deepEqual(await durable(h), baseline)
  h.turnstile.answer = () => challenge()
  for (const photos of [[...request().photos, request().photos[0]], [{ mediaType: 'image/svg+xml', base64: Buffer.from('<svg/>').toString('base64') }], [{ mediaType: 'image/jpeg', base64: png }]]) {
    assert.equal((await send(h, { ...request(), photos })).status, 400)
    assert.deepEqual(await durable(h), baseline)
  }
  await h.command('customer.save', { name: 'synthetic-glove-19', phone: '2125550101' })
  await h.command('customer.save', { name: 'synthetic-glove-20', phone: '2125550101' })
  const ambiguous = await durable(h)
  const refused = await send(h, request())
  assert.equal(refused.status, 409)
  assert.deepEqual(await durable(h), ambiguous)
  assert.ok(!(await refused.text()).includes('synthetic-glove-19'))
  const freshInput = { ...request(), phone: '2125550102', email: 'synthetic-glove-27@example.test' }
  assert.equal((await send(h, freshInput)).status, 200)
  const created = (await h.state()).customers.find(c => c.email === freshInput.email)
  assert.ok(created)
  assert.equal(created.phone, freshInput.phone)
  let entered, release
  const started = new Promise(resolve => { entered = resolve }), pending = new Promise(resolve => { release = resolve })
  h.turnstile.answer = async () => { entered(); await pending; return challenge() }
  const sending = send(h, { ...request(), phone: '2125550103' })
  await started
  await configure(h, { enabled: false })
  const disabled = await durable(h)
  release()
  assert.equal((await sending).status, 409)
  assert.deepEqual(await durable(h), disabled)
  assert.equal((await h.request(endpoint, { as: '' })).status, 404)
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='turnstile'").first()).n, 0)
})
