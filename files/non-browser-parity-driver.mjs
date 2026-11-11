import assert from 'node:assert/strict'
import { randomUUID, randomBytes, webcrypto } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { serveHosted, HOSTED_ORIGIN } from '/workspace/run-glove/node_modules/@runeditrun/rer/cli/hosted-output.mjs'
import { createProtocol } from '/workspace/run-glove/node_modules/@runeditrun/rer/modules/agent-door/conformance/protocol.mjs'
import { signJws, seconds, autonomousPolicy } from '/workspace/run-glove/node_modules/@runeditrun/rer/modules/agent-door/conformance/crypto.mjs'
import initialize from '/workspace/run-glove/tests/initialize-agent-owner.mjs'
import { pricebookParity } from '/workspace/run-glove/tests/agent-native-parity.mjs'
const origin = HOSTED_ORIGIN, email = 'owner@example.test', sub = 'synthetic-pricebook-owner'
const kid = randomUUID(), issuer = 'https://synthetic-pricebook-issuer.invalid', installationId = randomUUID(), business = 'synthetic-pricebook-business'
const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const { kty, crv, x, y } = await webcrypto.subtle.exportKey('jwk', pair.publicKey)
const keys = { [kid]: { kty, crv, x, y, kid, alg: 'ES256', use: 'sig' } }, token = randomBytes(32).toString('hex')
const hosted = await serveHosted('/workspace/run-glove', { bindings: {
  OWNER_EMAIL: email, SETUP_TOKEN: token,
  RER_OWNER_CLAIM_ISSUER: issuer, RER_OWNER_CLAIM_INSTALLATION_ID: installationId,
  RER_OWNER_CLAIM_PUBLIC_KEYS: JSON.stringify(keys),
  RER_BUSINESS_TRUST: JSON.stringify({ v: 1, issuer, audience: origin, subject: installationId, email, keys }),
}, outboundService: () => { throw Error('Price-book regression must not contact providers') } })
try {
  const request = (url, init = {}) => {
    assert.equal(new URL(url).origin, origin)
    return hosted.fetch(url.slice(origin.length + 1), { ...init, headers: Object.fromEntries(new Headers(init.headers)), signal: AbortSignal.timeout(30_000) })
  }
  const bootstrap = await initialize({ request, origin, claim: { path: '/auth/bootstrap', token }, returnTo: '/' })
  assert.equal(bootstrap.status, 303)
  const cookie = bootstrap.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ')
  await bootstrap.body?.cancel()
  const iat = seconds()
  const settings = await signJws(pair.privateKey, kid, 'rer-business-settings+jwt', {
    v: 1, iss: issuer, aud: origin, sub: installationId, business, email, owner_id: sub,
    jti: randomUUID(), iat, exp: iat + 300, rev: 1, values: {}, logo: null, team: null,
  })
  const paired = await request(origin + '/api/rer/business-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) })
  assert.equal(paired.status, 200)
  assert.equal((await paired.json()).rev, 1)
  const c = createProtocol({ fetch: request, origin, surface: JSON.parse(await readFile('/workspace/run-glove/agent-surface.json')), signer: { issuer, installationId, kid, privateKey: pair.privateKey }, person: { email, sub, cookie }, business, consent: randomUUID(), points: [], agentId: 'synthetic-pricebook-agent', seq: 0, revision: 0 })
  await c.adopt(autonomousPolicy())
  console.log(await pricebookParity({ request, origin, cookie, tool: c.tool }))
  console.log('PASS non-browser native price-book parity on the emitted production Worker; only public desk, MCP, auth and signed policy doors used.')
} finally { await hosted.close() }
