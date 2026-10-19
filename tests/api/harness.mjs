// A real Glove installation for flow tests: the production Worker doors on
// Miniflare as an HTTPS production install with a fresh D1 that has every
// migration applied, a real owner bootstrap, and real invited people signing
// in through their mailed link. Mail is faked only at the provider edge.
import { companycamEdge } from '../fixtures/companycam.mjs'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'
import { build } from 'esbuild'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:net'
import { randomUUID, randomBytes } from 'node:crypto'
import assert from 'node:assert/strict'

export async function installation() {
  const root = await mkdtemp(join(tmpdir(), 'glove-api-'))
  const bundled = await build({ entryPoints: ['tests/api/worker.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['node:*', 'cloudflare:*'], loader: { '.css': 'text', '.svg': 'text' } })
  // dispatchFetch names the real listener as Host, so the origin is that listener.
  const socket = createServer()
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve))
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const origin = `https://127.0.0.1:${port}`, setup = randomBytes(32).toString('hex'), mails = [], calendars = new Map(), marketing = []
  // Model provider fake (FIELD-006, AGENT-006): each call is kept; the test's `answer(body)` plays the model.
  const companycam = companycamEdge()
  const models = { calls: [], answer: null }
  // Push service fake (FIELD-004): each push is kept; `pushes.status[endpoint]` makes the service answer otherwise than 201.
  const pushes = { sent: [], status: {} }
  const mf = new Miniflare({
    ...convertV4MiniflareOptions({
      host: '127.0.0.1', port, https: true, modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'], d1Databases: ['DB'],
      bindings: { AUTH_LOCAL: 'false', AUTH_ORIGIN: origin, OWNER_EMAIL: 'owner@example.test', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: setup, MAIL_PROVIDER: 'resend', MAIL_FROM: 'auth@example.test', MAIL_API_KEY: 'test-only-key' },
      // Test-only provider edge: the Worker's mail facade is unchanged.
      outboundService: async request => {
        const companycamResponse = await companycam.answer(request)
        if (companycamResponse) return companycamResponse
        // Calendar provider fake (DISP-004): a feed registered by the test at its secret address.
        if (request.url.startsWith('https://calendar.google.com/calendar/ical/')) return calendars.has(request.url) ? new Response(calendars.get(request.url), { headers: { 'content-type': 'text/calendar' } }) : new Response('Not found', { status: 404 })
        // Marketing provider fakes (CUST-004): Mango's integration API and Mailchimp's members API record each call.
        if (request.url.startsWith('https://mango.example.test/api/integrations/v1/') || /^https:\/\/us21\.api\.mailchimp\.com\/3\.0\/lists\//.test(request.url)) {
          marketing.push({ method: request.method, url: request.url, authorization: request.headers.get('authorization'), body: await request.json() })
          return Response.json({ ok: true })
        }
        if (request.url.startsWith('https://push.example.test/')) {
          pushes.sent.push({ endpoint: request.url, authorization: request.headers.get('authorization'), encoding: request.headers.get('content-encoding'), ttl: request.headers.get('ttl'), body: Buffer.from(await request.arrayBuffer()) })
          return new Response(null, { status: pushes.status[request.url] ?? 201 })
        }
        if (request.url === 'https://models.example.test/v1/chat/completions') {
          const body = await request.json()
          models.calls.push({ authorization: request.headers.get('authorization'), body })
          return Response.json({ id: `test-model-${models.calls.length}`, object: 'chat.completion', model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(await models.answer(body)) }, finish_reason: 'stop' }] })
        }
        if (request.url !== 'https://api.resend.com/emails') throw new Error(`Unexpected test network destination ${request.url}`)
        mails.push(await request.json())
        return Response.json({ id: `test-receipt-${mails.length}` })
      },
    }),
    resourcePersistencePath: root,
  })
  try {
    await mf.ready
    const db = await mf.getD1Database('DB')
    for (const file of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile('migrations/core/' + file, 'utf8')
      await db.batch(unstable_splitSqlQuery(sql).map(q => db.prepare(q)))
    }
    let owner = ''
    const request = (path, { method = 'GET', body, as = owner, headers = {} } = {}) => mf.dispatchFetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', ...(as ? { cookie: as } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
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
    /** Invite a person, sign them in through their mailed link and give them a Glove role. */
    const person = async (name, role) => {
      const email = `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.test`
      const invited = await request('/auth/invite', { method: 'POST', body: { email, displayName: name, role: 'member' } })
      assert.equal(invited.status, 202, await invited.text())
      const mail = mails.findLast(m => m.to?.includes(email))
      const link = String(mail?.text).match(/https:[^\s]+\/auth\/confirm\?token=([^\s]+)/)
      assert.ok(link, 'invitation link')
      const confirmed = await request('/auth/confirm', { method: 'POST', as: '', body: { token: decodeURIComponent(link[1]) } })
      assert.equal(confirmed.status, 303, await confirmed.text())
      const cookie = cookies(confirmed)
      const session = await (await request('/auth/session', { as: cookie })).json()
      if (role) await command('role.set', { operatorId: session.operator.id, role })
      return { name, cookie, session, id: session.operator.id, run: (type, payload, opts = {}) => command(type, payload, { as: cookie, ...opts }), state: () => state(cookie) }
    }
    return { mf, origin, db, request, command, state, person, calendars, marketing, models, pushes, companycam, owner: () => owner, async close() { await mf.dispose(); await rm(root, { recursive: true, force: true }) } }
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

/** DATA-002: the current business flow's facts are readable in Activity and the portable business export. */
export async function assertTrail(h, kinds) {
  const response = await h.request('/api/glove/activity')
  assert.equal(response.status, 200)
  const activity = (await response.json()).events
  const exported = await h.request('/api/glove/export').then(r => r.json())
  for (const kind of kinds) {
    const event = activity.find(e => e.kind === kind)
    assert.ok(event, `${kind} is readable in Activity`)
    assert.ok(event.actorId && event.actorName && event.actorRole && event.at && event.commandId && event.summary, `${kind} keeps who, when and what`)
    const kept = exported.timeline.find(e => e.id === event.id)
    assert.ok(kept, `${kind} is exported`)
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id, kept.summary], [event.actorId, event.actorName, event.actorRole, event.at, event.commandId, event.summary])
  }
  return { activity, exported }
}
