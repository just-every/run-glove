import {queuedEntrypoint} from '@runeditrun/rer/queued-entry';
const queued=await queuedEntrypoint(import.meta.url,'verify:runtime');if(queued!==null)process.exit(queued);
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'

// One HTTP journey through the emitted Worker with native owner authentication
// and its own migrated store, never the checkout's local data.
const persist = await mkdtemp(join(tmpdir(), 'glove-runtime-'))
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'))
const origin = 'https://127.0.0.1', setup = randomBytes(32).toString('base64url')
const worker = new Miniflare({
  ...convertV4MiniflareOptions({
    host: '127.0.0.1', port: 0, upstream: origin, modulesRoot: 'dist/server',
    modules: [config.main, ...(await readdir('dist/server/assets')).filter(file => file.endsWith('.js')).map(file => `assets/${file}`)].map(file => ({ type: 'ESModule', path: join('dist/server', file) })),
    compatibilityDate: config.compatibility_date, compatibilityFlags: config.compatibility_flags,
    d1Databases: { DB: 'glove-runtime' },
    bindings: { AUTH_LOCAL: 'false', AUTH_ORIGIN: origin, OWNER_EMAIL: ['synthetic-glove-1', 'example.test'].join('@'), SESSION_SECRET: randomBytes(32).toString('base64url'), SETUP_TOKEN: setup },
    outboundService: () => { throw new Error('The HTTP routing journey must not contact a provider') },
  }),
  resourcePersistencePath: persist,
})
try {
  const listener = await worker.ready
  const db = await worker.getD1Database('DB')
  for (const file of (await readdir('migrations/core')).filter(name => name.endsWith('.sql')).sort())
    await db.batch(unstable_splitSqlQuery(await readFile(join('migrations/core', file), 'utf8')).map(query => db.prepare(query)))
  // Actual HTTP reaches the emitted Worker. Miniflare's upstream supplies the
  // installation origin; no test entry point or routing fake is involved.
  const request = (path, { body, cookie } = {}) => fetch(new URL(path, listener), {
    method: body === undefined ? 'GET' : 'POST', redirect: 'manual', signal: AbortSignal.timeout(15_000),
    headers: { origin, ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const healthResponse = await request('/health')
  assert.equal(healthResponse.status, 200)
  assert.match(healthResponse.headers.get('content-type'), /application\/json/)
  const health = await healthResponse.json()
  assert.equal(health.status, 'ok')
  assert.equal(health.ok, true)
  assert.deepEqual(Object.keys(health.deployment ?? {}).sort(), ['fingerprint', 'sourceSha', 'versionId'])
  console.log('PROBE HTTP-001 health: GET /health -> 200 JSON with healthy deployment metadata')
  const document = await request('/')
  assert.equal(document.status, 200)
  assert.match(document.headers.get('content-type'), /text\/html/)
  const branding = JSON.parse(await readFile(new URL('../src/branding.json', import.meta.url)))
  const html = await document.text()
  assert.match(html, /<!doctype html/i)
  assert.ok(html.includes(branding.name))
  console.log('PROBE HTTP-001 document: GET / -> 200 installed homepage HTML')

  const boot = await request('/auth/bootstrap', { body: { token: setup, displayName: 'synthetic-glove-1' } })
  assert.equal(boot.status, 303)
  const cookie = boot.headers.getSetCookie().map(line => line.split(';')[0]).join('; ')
  assert.ok(cookie, 'native owner bootstrap returns a session')
  const session = await request('/auth/session', { cookie })
  assert.equal(session.status, 200)
  assert.equal((await session.json()).kind, 'native')
  const created = await request('/api/glove/commands', { cookie, body: { commandId: randomUUID(), type: 'customer.save', payload: { name: 'synthetic-glove-2', phone: '2025550102' } } })
  assert.equal(created.status, 200)
  const saved = await created.json()
  assert.equal(saved.ok, true)
  const product = await request('/api/glove/state', { cookie })
  assert.equal(product.status, 200)
  assert.match(product.headers.get('content-type'), /application\/json/)
  const state = await product.json()
  assert.equal(state.actor.role, 'owner')
  assert.equal(state.actor.name, 'synthetic-glove-1')
  assert.equal(state.customers.length, 1)
  assert.equal(state.customers[0].id, saved.result.id)
  assert.equal(state.customers[0].name, 'synthetic-glove-2')
  assert.equal(state.customers[0].phone, '2025550102')
  console.log('PROBE HTTP-001 authenticated API: native owner command and GET /api/glove/state -> 200 JSON with the saved customer')
  const refused = await request('/api/glove/state')
  assert.equal(refused.status, 401)
  assert.deepEqual(await refused.json(), { ok: false, error: { code: 'AUTH', message: 'Sign in with a current session.', details: null } })
  console.log('PROBE HTTP-001 signed-out API: GET /api/glove/state with a stored customer -> 401 AUTH without product data')

  for (const path of ['/missing', '/health/extra', '/api', '/api/missing']) {
    const missing = await request(path)
    assert.equal(missing.status, 404, path)
    if (path === '/missing' || path === '/health/extra') {
      assert.match(missing.headers.get('content-type'), /text\/html/, path)
      assert.match(await missing.text(), /not found/i, path)
    } else assert.match(await missing.text(), /not found/i, path)
  }
  const unknownProduct = await request('/api/glove/missing', { cookie })
  assert.equal(unknownProduct.status, 404)
  assert.deepEqual(await unknownProduct.json(), { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown endpoint.', details: null } })
  console.log('PROBE HTTP-001 missing routes: unknown document, generic API and authenticated product API -> 404 missing responses')
  const signedOut = await request('/auth/signout', { cookie, body: {} })
  assert.equal(signedOut.status, 204)
  const revoked = await request('/api/glove/state', { cookie })
  assert.equal(revoked.status, 401)
  assert.equal((await revoked.json()).error.code, 'AUTH')
  console.log('PROBE HTTP-001 revoked session: signed-out native session GET /api/glove/state -> 401 AUTH')
  console.log('HTTP-001 emitted Worker routing passed: health, authenticated product API, signed-out refusal, document HTML and missing routes')
} finally {
  await worker.dispose()
  await rm(persist, { recursive: true, force: true })
}
