// A real Glove installation for flow tests: the production Worker doors on
// Miniflare with a fresh D1 that has every migration applied, a real owner
// bootstrap, and real invited people signing in through the outbox link.
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'
import { build } from 'esbuild'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, randomBytes } from 'node:crypto'
import assert from 'node:assert/strict'

export async function installation() {
  const root = await mkdtemp(join(tmpdir(), 'glove-api-'))
  const bundled = await build({ entryPoints: ['tests/api/worker.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['node:*'], loader: { '.css': 'text', '.svg': 'text' } })
  let origin = 'http://localhost'
  const setup = randomBytes(32).toString('hex')
  const options = port => ({
    ...convertV4MiniflareOptions({
      host: '127.0.0.1', port, modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'], d1Databases: ['DB'],
      bindings: { AUTH_LOCAL: 'true', AUTH_ORIGIN: origin, OWNER_EMAIL: 'owner@example.test', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: setup, MAIL_PROVIDER: 'development', MAIL_FROM: 'auth@example.test', RER_DEV_KEY: randomBytes(32).toString('hex') },
    }),
    resourcePersistencePath: root,
  })
  const mf = new Miniflare(options(0))
  try {
    const address = await mf.ready
    origin = address.origin
    // The real listener, so URL, Host and Origin all name this installation.
    await mf.setOptions(options(Number(address.port)))
    const db = await mf.getD1Database('DB')
    for (const file of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile('migrations/core/' + file, 'utf8')
      await db.batch(unstable_splitSqlQuery(sql).map(q => db.prepare(q)))
    }
    let owner = ''
    const request = (path, { method = 'GET', body, as = owner, headers = {} } = {}) => fetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', ...(as ? { cookie: as } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
    const cookies = res => res.headers.getSetCookie().map(v => v.split(';')[0]).join('; ')
    const boot = await request('/auth/bootstrap', { method: 'POST', body: { token: setup, displayName: 'Olivia Owner' } })
    assert.equal(boot.status, 303, await boot.text())
    owner = cookies(boot)
    /** Send a command as a person (owner by default); `error` expects that refusal code. */
    const command = async (type, payload, opts = {}) => {
      const commandId = opts.commandId ?? randomUUID()
      const res = await request('/api/glove/commands', { method: 'POST', body: { commandId, type, payload }, ...(opts.as ? { as: opts.as } : {}) })
      const body = await res.json()
      if (opts.error) { assert.equal(body.ok, false, JSON.stringify(body)); assert.equal(body.error.code, opts.error, JSON.stringify(body)); return body.error }
      assert.equal(res.status, 200, JSON.stringify(body))
      assert.equal(body.ok, true, JSON.stringify(body))
      return body.result
    }
    const state = async (as = owner) => { const res = await request('/api/glove/state', { as }); assert.equal(res.status, 200, await res.clone().text()); return res.json() }
    /** Invite a person, sign them in through their outbox link and give them a Glove role. */
    const person = async (name, role) => {
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.test`
      const invited = await request('/auth/invite', { method: 'POST', body: { email, displayName: name, role: 'member' } })
      assert.equal(invited.status, 202, await invited.text())
      const outbox = await db.prepare('SELECT message FROM rer_mail_development_outbox ORDER BY created_at DESC,sequence DESC LIMIT 1').first()
      const link = String(JSON.parse(outbox.message).text).match(/http[^\s]+\/auth\/confirm\?token=([^\s]+)/)
      assert.ok(link, 'invitation link')
      const confirmed = await request('/auth/confirm', { method: 'POST', as: '', body: { token: decodeURIComponent(link[1]) } })
      assert.equal(confirmed.status, 303, await confirmed.text())
      const cookie = cookies(confirmed)
      const session = await (await request('/auth/session', { as: cookie })).json()
      if (role) await command('role.set', { operatorId: session.operator.id, role })
      return { name, cookie, session, id: session.operator.id, run: (type, payload, opts = {}) => command(type, payload, { as: cookie, ...opts }), state: () => state(cookie) }
    }
    return { mf, origin, db, request, command, state, person, owner: () => owner, async close() { await mf.dispose(); await rm(root, { recursive: true, force: true }) } }
  } catch (error) {
    await mf.dispose().catch(() => {})
    await rm(root, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

/** The smallest real business: settings, a price book entry, a customer and site, a team. */
export async function business(h) {
  await h.command('business.save', { name: 'Harbour Air & Electrical', abn: '51 824 753 556', timezone: 'Australia/Sydney', email: 'office@harbourair.example', paymentTermsDays: 14 })
  const service = await h.command('service.save', { code: 'SPLIT-SVC', name: 'Split system service', unitPrice: '189.00', tax: 'GST', checklist: [{ label: 'Isolate power', required: true }, { label: 'Clean filters', required: true }, { label: 'Check refrigerant pressure', required: true }, { label: 'Test run 10 minutes' }] })
  const refrigerant = await h.command('service.save', { code: 'R32-KG', name: 'R32 refrigerant', unit: 'kg', unitPrice: '95.00', tax: 'GST' })
  const customer = await h.command('customer.save', { name: 'Harbourview Dental', email: 'accounts@harbourview.example', phone: '02 9555 0101', contact: 'Dr Mei Lin', billingAddress: '14 Harbour St, Balmain NSW 2041' })
  const site = await h.command('site.save', { customerId: customer.id, address: '14 Harbour St, Balmain NSW 2041', accessNotes: 'Gate code at reception' })
  const dispatcher = await h.person('Sam Ortiz', 'dispatcher')
  const priyaPerson = await h.person('Priya Nair', 'technician'), tomPerson = await h.person('Tom Brooks', 'technician')
  const office = await h.person('Olu Office', 'office'), agent = await h.person('Ada Agent', 'agent')
  const priya = await h.command('technician.save', { name: 'Priya N.', operatorId: priyaPerson.id })
  const tom = await h.command('technician.save', { name: 'Tom B.', operatorId: tomPerson.id })
  return { service, refrigerant, customer, site, dispatcher, office, agent, priyaPerson, tomPerson, priya, tom }
}

/** An accepted, price-approved quote for the business's customer. */
export async function acceptedQuote(h, b, title = 'Split system service') {
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  return b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
}

export const id = () => randomUUID()

/** A job booked for Priya, arrived, its required checklist done and completed without a signature. */
export async function completedJob(h, b, date = '2026-10-20') {
  const quote = await acceptedQuote(h, b, `Service ${date}`)
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: `${date}T22:04:00Z` })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: `${date}T22:10:00Z`, kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: `${date}T23:00:00Z`, summary: 'Cleaned filters and coil', signoff: { absentReason: 'Customer out' } })
  return { job, visit }
}
