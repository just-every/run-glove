import { xeroEdge } from '../fixtures/xero.mjs'
import { quickbooksEdge } from '../fixtures/quickbooks.mjs'
import { calendarEdge } from '../fixtures/calendars.mjs'
import { twilioEdge } from '../fixtures/twilio.mjs'
import { wisetackEdge } from '../fixtures/wisetack.mjs'
import { stripePaymentsEdge } from '../fixtures/stripe-payments.mjs'
// A real Glove installation for flow tests: the production Worker doors on
// Miniflare as an HTTPS production install with a fresh D1 that has every
// migration applied, a real owner bootstrap, and real invited people signing
// in through their mailed link. Mail is faked only at the provider edge.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { companycamEdge } from '../fixtures/companycam.mjs'
import { mapsEdge } from '../fixtures/maps.mjs'
import { leadsEdge } from '../fixtures/leads.mjs'
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'
import { build } from 'esbuild'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, randomBytes, generateKeyPairSync, sign, createHmac } from 'node:crypto'
import assert from 'node:assert/strict'

export async function installation({ isolates = 1, at = null, captureLogs = false, workerPlugins = [] } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'glove-api-'))
  // The loopback service represents callback errors as HTTP 500. Translate
  // the marketing transport-failure marker and calendar timeout marker at
  // fetch, so network failures reject inside the actual Worker instead.
  const banner = { js: `
const networkFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const response = await networkFetch(input, options);
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if ((url.origin === 'https://mango.example.test' || url.origin === 'https://us21.api.mailchimp.com') && response.headers.get('x-synthetic-glove-network-error') === '1') throw new TypeError('Synthetic provider unreachable');
  if (['www.googleapis.com', 'graph.microsoft.com'].includes(url.hostname) && response.headers.get('x-synthetic-glove-calendar-timeout') === '1') throw new DOMException('Synthetic calendar timeout', 'TimeoutError');
  return response;
};` }
  const bundle = () => build({ entryPoints: ['tests/api/worker.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['node:*', 'cloudflare:*'], loader: { '.css': 'text', '.svg': 'text' }, banner, plugins: workerPlugins })
  const bundled = await bundle()
  // worker.ts gives each request the Host its URL names, so the origin holds no
  // port: workerd binds its own, never one released here for another bind to take.
  const origin = 'https://127.0.0.1', setup = randomBytes(32).toString('hex'), mails = [], calendars = new Map(), marketing = []
  // Model provider fake (FIELD-006, AGENT-006): each call is kept; the test's `answer(body)` plays the model.
  const fleet = { calls: [], status: 200, data: [], beforeReply: null }
  const xero = xeroEdge()
  const checkpoints = { qboComplete: null }
  const calendarSync = calendarEdge()
  const companycam = companycamEdge(), quickbooks = quickbooksEdge()
  // Google Maps fake (DISP-002): places the test registers, drives timed from distance, a plain base map.
  const maps = mapsEdge()
  // Lead-source fakes (BOOK-004): Yelp's Leads API and Google's OAuth and Ads API answer what the test registers.
  const leads = leadsEdge()
  const models = { calls: [], answer: null, reply: null }
  const twilio = twilioEdge()
  const stripePayments = stripePaymentsEdge(), wisetack = wisetackEdge()
  const stripeTax = { calls: [], answer: null }
  const avatax = { calls: [], answer: null }
  // BOOK-001: only the Cloudflare Siteverify network boundary is faked.
  const turnstile = { calls: [], answer: null }, usedChallenges = new Set()
  // Push service fake (FIELD-004): each push is kept; `pushes.status[endpoint]` makes the service answer otherwise than 201.
  const pushes = { sent: [], status: {} }
  // Customer email fakes (COMM-001): SendGrid's mail send and Resend's emails API; `email.status[to]` makes the provider answer otherwise.
  const email = { sent: [], status: {}, certificates: new Map(), fetches: [], subscriptions: [] }
  const outbound = { attempts: 0 }
  const logs = [], workerLogs = []
  class CapturedLog extends Log { log(message) { logs.push(message) } }
  const workerOptions = convertV4MiniflareOptions({
      ...(captureLogs ? { log: new CapturedLog(LogLevel.VERBOSE), handleStructuredLogs: entry => { logs.push(entry.message); workerLogs.push({ level: entry.level, message: entry.message }) } } : {}),
      host: '127.0.0.1', https: true, modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'], d1Databases: { DB: 'glove-shared-db' },
      durableObjects: { MAIL_REJECTIONS: { className: 'MailRejections', scriptName: 'app', useSQLite: true } },
      bindings: { AUTH_LOCAL: 'false', AUTH_ORIGIN: origin, OWNER_EMAIL: 'owner@example.test', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: setup, MAIL_PROVIDER: 'resend', MAIL_FROM: 'auth@example.test', MAIL_API_KEY: 'test-only-key' },
      // Test-only provider edge: the Worker's mail facade is unchanged.
      outboundService: async request => {
        outbound.attempts++
        if (request.url === 'https://worker-checkpoint.example.test/qbo-complete') {
          await checkpoints.qboComplete?.()
          return new Response(null, { status: 204 })
        }
        if (new URL(request.url).origin === 'https://api.samsara.com') {
          fleet.calls.push({ url: request.url, method: request.method, authorization: request.headers.get('authorization') })
          if (fleet.beforeReply) await fleet.beforeReply()
          return Response.json({ data: fleet.data }, { status: fleet.status })
        }
        const xeroResponse = await xero.answer(request)
        if (xeroResponse) return xeroResponse
        const qboResponse = await quickbooks.answer(request)
        if (qboResponse) return qboResponse
        const calendarResponse = await calendarSync.answer(request)
        if (calendarResponse) return calendarResponse
        const smsResponse = await twilio.answer(request)
        if (smsResponse) return smsResponse
        const financeResponse = await wisetack.answer(request)
        if (financeResponse) return financeResponse
        const paymentResponse = await stripePayments.answer(request)
        if (paymentResponse) return paymentResponse
        if (request.url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
          const body = await request.json()
          turnstile.calls.push(body)
          const result = turnstile.answer ? await turnstile.answer(body) : { success: false, 'error-codes': ['invalid-input-response'] }
          if (usedChallenges.has(body.response)) return Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] })
          if (result.success) usedChallenges.add(body.response)
          return Response.json(result)
        }
        const companycamResponse = await companycam.answer(request)
        if (companycamResponse) return companycamResponse
        const mapsResponse = await maps.answer(request)
        if (mapsResponse) return mapsResponse
        const leadsResponse = await leads.answer(request)
        if (leadsResponse) return leadsResponse
        // Calendar provider fake (DISP-004): a feed registered by the test at its secret address.
        if (request.url.startsWith('https://calendar.google.com/calendar/ical/')) return calendars.has(request.url) ? new Response(calendars.get(request.url), { headers: { 'content-type': 'text/calendar' } }) : new Response('Not found', { status: 404 })
        // Marketing provider fakes (CUST-004): Mango's integration API and Mailchimp's members API record each call.
        if (request.url.startsWith('https://mango.example.test/api/integrations/v1/') || /^https:\/\/us21\.api\.mailchimp\.com\/3\.0\/lists\//.test(request.url)) {
          const call = { method: request.method, url: request.url, authorization: request.headers.get('authorization'), body: await request.json() }
          marketing.push(call)
          return marketing.answer ? await marketing.answer(call) : Response.json({ ok: true })
        }
        if (request.url.startsWith('https://push.example.test/')) {
          pushes.sent.push({ endpoint: request.url, authorization: request.headers.get('authorization'), encoding: request.headers.get('content-encoding'), ttl: request.headers.get('ttl'), body: Buffer.from(await request.arrayBuffer()) })
          return new Response(null, { status: pushes.status[request.url] ?? 201 })
        }
        if (request.url === 'https://models.example.test/v1/chat/completions') {
          const body = await request.json()
          models.calls.push({ authorization: request.headers.get('authorization'), body })
          if (models.reply) return models.reply(body)
          return Response.json({ id: `test-model-${models.calls.length}`, object: 'chat.completion', model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(await models.answer(body)) }, finish_reason: 'stop' }] })
        }
        if (request.url === 'https://api.stripe.com/v1/tax/calculations') {
          const body = Object.fromEntries(new URLSearchParams(await request.text()))
          stripeTax.calls.push({ body, authorization: request.headers.get('authorization'), idempotencyKey: request.headers.get('idempotency-key') })
          return Response.json(stripeTax.answer ? stripeTax.answer(body) : { id: `taxcalc_${stripeTax.calls.length}`, tax_breakdown: [{ taxability_reason: 'not_collecting', tax_rate_details: { percentage_decimal: '0' } }] })
        }
        if (/^https:\/\/(sandbox-)?rest\.avatax\.com\/api\/v2\/transactions\/create$/.test(request.url)) {
          const body = await request.json()
          avatax.calls.push({ url: request.url, body, authorization: request.headers.get('authorization') })
          return Response.json(avatax.answer ? avatax.answer(body) : { code: `avatax-${avatax.calls.length}`, lines: body.lines.map(l => ({ lineNumber: l.number, details: [] })) })
        }
        if (request.url.startsWith('https://sns.')) {
          email.fetches.push(request.url)
          if (email.certificates.has(request.url)) return new Response(email.certificates.get(request.url))
          if (new URL(request.url).searchParams.get('Action') === 'ConfirmSubscription') { email.subscriptions.push(request.url); return new Response('<ConfirmSubscriptionResponse/>') }
          return new Response('Not found', { status: 404 })
        }
        if (request.url === 'https://api.postmarkapp.com/email') {
          const body = await request.json(), to = body.To
          email.sent.push({ provider: 'postmark', authorization: request.headers.get('x-postmark-server-token'), to, body })
          if (email.beforeRespond) await email.beforeRespond()
          return Response.json(email.reply ?? { ErrorCode: 0, MessageID: `pm-receipt-${email.sent.length}` }, { status: email.status[to] ?? 200 })
        }
        if (/^https:\/\/email\.[a-z0-9-]+\.amazonaws\.com\/v2\/email\/outbound-emails$/.test(request.url)) {
          const body = await request.json(), to = body.Destination.ToAddresses[0]
          email.sent.push({ provider: 'ses', authorization: request.headers.get('authorization'), to, body })
          if (email.beforeRespond) await email.beforeRespond()
          return Response.json(email.reply ?? { MessageId: `ses-receipt-${email.sent.length}` }, { status: email.status[to] ?? 200 })
        }
        if (request.url === 'https://api.sendgrid.com/v3/mail/send') {
          const body = await request.json(), to = body.personalizations?.[0]?.to?.[0]?.email
          email.sent.push({ provider: 'sendgrid', authorization: request.headers.get('authorization'), to, body })
          if (email.beforeRespond) await email.beforeRespond()
          return new Response(null, { status: email.status[to] ?? 202, headers: { 'x-message-id': `sg-receipt-${email.sent.length}` } })
        }
        if (request.url === 'https://api.resend.com/emails' && request.headers.get('authorization') !== 'Bearer test-only-key') {
          const body = await request.json()
          email.sent.push({ provider: 'resend', authorization: request.headers.get('authorization'), idempotencyKey: request.headers.get('idempotency-key'), to: body.to?.[0], body })
          return Response.json({ id: `re-receipt-${email.sent.length}` })
        }
        if (request.url !== 'https://api.resend.com/emails') throw new Error(`Unexpected test network destination ${request.url}`)
        mails.push(await request.json())
        return Response.json({ id: `test-receipt-${mails.length}` })
      },
    })
  const options = { ...workerOptions, workers: Array.from({ length: isolates }, (_, i) => ({ ...workerOptions.workers[0], config: { ...workerOptions.workers[0].config, name: i ? `peer-${i}` : 'app', exports: { MailRejections: { type: 'durable-object', storage: 'sqlite' } } } })), resourcePersistencePath: root }
  let mf = new Miniflare(options), db
  try {
    await mf.ready
    db = await mf.getD1Database('DB')
    for (const file of (await readdir('migrations/core')).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile('migrations/core/' + file, 'utf8')
      await db.batch(unstable_splitSqlQuery(sql).map(q => db.prepare(q)))
    }
    let owner = ''
    const request = (path, { method = 'GET', body, as = owner, headers = {} } = {}) => mf.dispatchFetch(origin + path, { method, redirect: 'manual', headers: { origin, 'content-type': 'application/json', ...(as ? { cookie: as } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
    const cookies = res => res.headers.getSetCookie().map(v => v.split(';')[0]).join('; ')
    let currentTime = at
    const setTime = async value => {
      assert.equal((await request('/__test/clock', { method: 'POST', body: { at: value } })).status, 200)
      currentTime = value
    }
    if (at) await setTime(at)
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
    /** Run the Worker's cron handler as Cloudflare would at this instant (ms or ISO). */
    const scheduled = async at => { const worker = await mf.getWorker('app'); const run = await worker.scheduled({ scheduledTime: new Date(at) }); assert.equal(run.outcome, 'ok'); return run }
    // Shut down the actual Worker, retaining its installation and D1 on disk.
    const restart = async ({ rebuild = false } = {}) => {
      await mf.dispose()
      if (rebuild) {
        const upgraded = await bundle()
        for (const worker of options.workers) {
          const manifest = worker.config.manifest
          manifest.modules[manifest.mainModule].contents = upgraded.outputFiles[0].text
        }
      }
      mf = new Miniflare(options)
      await mf.ready
      db = await mf.getD1Database('DB')
      if (currentTime) await setTime(currentTime)
    }
    // Simulate one disk-level corruption while the actual Worker is stopped.
    // SQLite's incremental blob writes change only the selected byte, without
    // removing the production SQL immutability trigger or seeding domain data.
    const corruptSignedQuoteChunk = async (quoteId, revision, ordinal) => {
      await mf.dispose()
      try {
        execFileSync('python3', ['-c', `
import sqlite3
import sys
from pathlib import Path

root, quote_id, revision, ordinal = sys.argv[1:]
matches = []
for path in Path(root).rglob('*.sqlite'):
    with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True) as db:
        if db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='glove_quote_signed_chunks'").fetchone():
            row = db.execute('SELECT rowid FROM glove_quote_signed_chunks WHERE quote_id=? AND revision=? AND ordinal=?', (quote_id, int(revision), int(ordinal))).fetchone()
            if row:
                matches.append((path, row[0]))
if len(matches) != 1:
    raise RuntimeError('Expected one retained signed-copy chunk')
path, rowid = matches[0]
with sqlite3.connect(path) as db:
    with db.blobopen('glove_quote_signed_chunks', 'bytes', rowid) as blob:
        offset = len(blob) - 1
        blob.seek(offset)
        byte = blob.read(1)[0]
        blob.seek(offset)
        blob.write(bytes([byte ^ 1]))
`, root, quoteId, String(revision), String(ordinal)])
      } finally {
        mf = new Miniflare(options)
        await mf.ready
        db = await mf.getD1Database('DB')
        if (currentTime) await setTime(currentTime)
      }
    }
    return { get mf() { return mf }, origin, get db() { return db }, restart, corruptSignedQuoteChunk, setTime, request, command, state, scheduled, person, outbound, xero, fleet, calendars, calendarSync, quickbooks, checkpoints, marketing, logs, workerLogs, models, pushes, mails, email, twilio, companycam, maps, leads, stripeTax, stripePayments, wisetack, avatax, turnstile, owner: () => owner, async close() { await mf.dispose(); await rm(root, { recursive: true, force: true }) } }
  } catch (error) {
    await mf.dispose().catch(() => {})
    await rm(root, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

/** The smallest real business: settings, a price book entry, a customer and site, a team. */
export async function business(h, overrides = {}) {
  await h.command('business.save', { name: 'Harbour Air & Electrical', currency: 'AUD', abn: '51 824 753 556', timezone: 'Australia/Sydney', email: 'office@harbourair.example', paymentTermsDays: 14, ...overrides })
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

export async function routingDay(h, day = '2026-11-03', beforeVisits = null) {
  const b = await business(h)
  await h.command('maps.connect', { key: 'synthetic-glove-7' })
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { skills: 'refuse', availability: 'refuse', area: 'refuse' } })
  const third = await h.command('technician.save', { name: 'Ellen R.' })
  const technicians = []
  for (const [i, tech] of [b.priya, b.tom, third].entries()) technicians.push(await h.command('technician.save', { id: tech.id, version: tech.version, name: tech.name, ...(tech.operatorId ? { operatorId: tech.operatorId } : {}), skills: i === 0 ? ['hvac', 'gas'] : ['hvac'], zips: ['60601'], hours: [{ day: 'tue', start: '07:00', end: '18:00' }] }))
  const regular = await h.command('service.save', { code: 'ROUTE-HVAC', name: 'HVAC visit', unitPrice: '20.00', tax: 'GST', requiredSkills: ['hvac'] })
  const gas = await h.command('service.save', { code: 'ROUTE-GAS', name: 'Gas visit', unitPrice: '20.00', tax: 'GST', requiredSkills: ['gas'] })
  if (beforeVisits) await beforeVisits(b)
  const visits = []
  for (let t = 0; t < 3; t++) for (let n = 0; n < 4; n++) {
    const group = (t + n) % 3, address = `${100 + t * 10 + n} Routing Ave, Chicago, IL 60601`
    h.maps.places.set(address, { lat: 41.8 + group * 0.04 + n * 0.0001, lng: -87.63 })
    const site = await h.command('site.save', { customerId: b.customer.id, address })
    const service = t === 0 && n === 0 ? gas : regular
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title: `Route visit ${t + 1}.${n + 1}`, lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '20.00' }] })
    const hour = 8 + n * 2, start = `${String(hour).padStart(2, '0')}:00`
    visits.push(await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: technicians[t].id, date: day, start, end: `${String(hour).padStart(2, '0')}:30`, window: { start: '08:00', end: '16:00' } }))
  }
  return { b, technicians, visits, day }
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

/** COMM-001: a provider's signed delivery-event webhook, signed as SendGrid (ECDSA P-256) or Resend (Svix HMAC) sign it. */
export function mailEvents(provider) {
  const keys = provider === 'sendgrid' ? generateKeyPairSync('ec', { namedCurve: 'prime256v1' }) : null
  const secret = provider === 'resend' ? randomBytes(32) : null
  const eventKey = keys ? keys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64') : `whsec_${secret.toString('base64')}`
  return {
    eventKey,
    signed(body, { id = randomUUID(), at = Math.floor(Date.now() / 1000) } = {}) {
      const raw = JSON.stringify(body), timestamp = String(at)
      if (keys) return { raw, headers: { 'x-twilio-email-event-webhook-timestamp': timestamp, 'x-twilio-email-event-webhook-signature': sign('sha256', Buffer.from(timestamp + raw), keys.privateKey).toString('base64') } }
      return { raw, headers: { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${createHmac('sha256', secret).update(`${id}.${timestamp}.${raw}`).digest('base64')}` } }
    },
  }
}

/** POST provider events to the installation's public delivery-event door. */
export const postEvents = (h, { raw, headers }) => h.mf.dispatchFetch(h.origin + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: raw })

/** COMM-001: SNS signature v1/v2 and real X.509 certificate at the network edge. */
export function snsEvents(settings, { days = 1 } = {}) {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const directory = mkdtempSync(join(tmpdir(), 'glove-sns-certificate-'))
  let cert
  try {
    const keyFile = join(directory, 'test-key.pem')
    writeFileSync(keyFile, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
    cert = execFileSync('openssl', ['req', '-new', '-x509', '-key', keyFile, '-subj', `/CN=sns.${settings.region}.amazonaws.com`, '-days', String(days)], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  } finally { rmSync(directory, { recursive: true, force: true }) }

  const certUrl = `https://sns.${settings.region}.amazonaws.com/SimpleNotificationService-${randomUUID()}.pem`
  return { cert, certUrl, signed(payload, overrides = {}) {
    const e = { Type: 'Notification', MessageId: randomUUID(), TopicArn: settings.topicArn, Message: JSON.stringify(payload), Timestamp: new Date().toISOString(), SignatureVersion: '2', SigningCertURL: certUrl, ...overrides }
    if (e.Type !== 'Notification') { e.Token ??= 'test-only-subscription-token'; e.SubscribeURL ??= `https://sns.${settings.region}.amazonaws.com/?${new URLSearchParams({ Action: 'ConfirmSubscription', TopicArn: e.TopicArn, Token: e.Token })}` }
    const fields = e.Type === 'Notification' ? ['Message', 'MessageId', ...(e.Subject === undefined ? [] : ['Subject']), 'Timestamp', 'TopicArn', 'Type'] : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
    const canonical = fields.map(k => `${k}\n${e[k]}\n`).join('')
    e.Signature = sign(e.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256', Buffer.from(canonical), keys.privateKey).toString('base64')
    return { raw: JSON.stringify(e), headers: { 'x-amz-sns-message-type': e.Type } }
  } }
}

/** Two native service histories with independent expected rows for CUST-001. */
export async function customerHistoryFixture(h, b, { beforeJob } = {}) {
  const apEmail = ['synthetic-glove-ap', 'example.test'].join('@')
  const contactEmail = ['synthetic-glove-contact', 'example.test'].join('@')
  const customer = await h.command('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Harbourview Dental', kind: 'business', email: contactEmail, phone: '(212) 555-0101', contact: 'Dr Mei Lin', billingAddress: '14 Harbour St', billingContact: 'Ravi Patel', apEmail, requirePo: true, contacts: [{ name: 'Dr Mei Lin', role: 'principal', phone: '(212) 555-0101' }, { name: 'Ravi Patel', role: 'accounts payable', email: apEmail }] })
  const siteA = await h.command('site.save', { id: b.site.id, version: b.site.version, customerId: customer.id, address: '14 Harbour St, Balmain', accessNotes: 'Gate code at reception', contact: 'Jo Front Desk', contactPhone: '(212) 555-0199' })
  const siteB = await h.command('site.save', { customerId: customer.id, address: '22 Wharf Rd, Birchgrove', accessNotes: 'Use rear entrance', contact: 'Sam Practice Manager', contactPhone: '(212) 555-0188' })
  const inspection = await h.command('form.save', { name: 'Service inspection', questions: [{ id: 'safe', label: 'Safe to operate', type: 'yesno', required: true }], serviceIds: [b.service.id] })
  let clock = Date.parse('2026-11-05T00:00:00Z')
  const trail = [], histories = [], replays = []
  const run = async (person, type, payload, kind) => {
    clock += 60_000
    const at = new Date(clock).toISOString(), commandId = randomUUID()
    assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
    const result = await person.run(type, payload, { commandId })
    trail.push({ commandId, kind, subjectId: type === 'visit.complete' ? commandId : result.id, actorId: person.id, actorName: person.name, actorRole: person === b.dispatcher ? 'dispatcher' : person === b.office ? 'office' : 'technician', at })
    if (type === 'visit.capture' && payload.kind === 'note') replays.push({ payload, commandId, result })
    return { result, at, commandId }
  }
  for (const [index, site, title, unitType, make, note, material, summary] of [
    [0, siteA, 'Harbour cooling service', 'AC condenser', 'Trane', 'Harbour coil cleaned', 'Harbour filter', 'Harbour cooling restored'],
    [1, siteB, 'Wharf heating service', 'Heat pump', 'Carrier', 'Wharf coil inspected', 'Wharf filter', 'Wharf heating restored'],
  ]) {
    const expected = []
    const add = (at, kind, id, jobId, label, status = null) => expected.push({ at, kind, id, jobId, label, status })
    let x = await run(b.office, 'equipment.save', { siteId: site.id, type: unitType, make, refrigerant: 'R-410A' }, 'equipment.added')
    const equipment = x.result
    add(x.at, 'equipment', equipment.id, null, `${unitType} ${make}`)
    x = await run(b.dispatcher, 'enquiry.create', { customerId: customer.id, siteId: site.id, description: title, source: 'phone' }, 'enquiry.created')
    const request = x.result
    await beforeJob?.({ site, request })
    add(x.at, 'request', request.id, null, `Request (phone): ${title}`, 'won')
    add(x.at, 'message', `request:${request.id}`, null, `request (inbound, phone, Harbourview Dental): ${title}`, 'Received')
    x = await run(b.dispatcher, 'quote.draft', { enquiryId: request.id, title, lines: [{ serviceId: b.service.id, description: 'Split system service', quantity: '1', unitPrice: '189.00' }] }, 'quote.drafted')
    const quote = x.result
    add(x.at, 'quote', quote.id, null, `${quote.number} ${title}`, 'accepted')
    const approved = (await run(b.dispatcher, 'quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, 'quote.approved')).result
    x = await run(b.dispatcher, 'quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' }, 'quote.accepted')
    const answerAt = x.at
    x = await run(b.dispatcher, 'job.create', { quoteId: quote.id, equipmentIds: [equipment.id] }, 'job.created')
    const job = x.result
    add(answerAt, 'message', `quote-answer:${quote.id}`, job.id, `quote accepted (inbound, phone, Dr Mei Lin): ${quote.number} revision 1 accepted`, 'Received')
    add(x.at, 'job', job.id, job.id, `${job.number} ${title}`, 'completed')
    const date = `2026-11-0${5 + index}`
    x = await run(b.dispatcher, 'visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' }, 'visit.booked')
    const visit = x.result
    add(x.at, 'visit', visit.id, job.id, `${job.number} visit ${date} 09:00–10:00`, 'completed')
    const deviceTime = `${date}T00:05:00.000Z`
    x = await run(b.priyaPerson, 'visit.arrive', { visitId: visit.id, deviceTime }, 'capture.arrival')
    add(x.at, 'arrival', x.result.id, job.id, `${job.number} Arrived on site`)
    for (const label of ['Isolate power', 'Clean filters', 'Check refrigerant pressure']) {
      const item = job.checklist.find(i => i.label === label)
      x = await run(b.priyaPerson, 'visit.capture', { visitId: visit.id, deviceTime, kind: 'checklist', itemId: item.id, result: 'done' }, 'capture.checklist')
      add(x.at, 'form', x.result.id, job.id, `${job.number} ${label}: done`)
    }
    const captures = [
      [{ kind: 'form', formId: job.forms.find(f => f.formId === inspection.id).id, answers: { safe: true } }, 'form', 'Service inspection'],
      [{ kind: 'note', text: note }, 'note', note],
      [{ kind: 'photo', caption: `${title} coil`, photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }, 'photo', `Photo: ${title} coil`],
      [{ kind: 'material', serviceId: b.refrigerant.id, description: material, quantity: '2', unit: 'kg' }, 'material', `${material} × 2 kg`],
      [{ kind: 'refrigerant', equipmentId: equipment.id, added: '1.25', recovered: '0.5', certification: '608-synthetic-glove-1' }, 'refrigerant', 'Refrigerant R-410A'],
    ]
    for (const [payload, kind, label] of captures) {
      x = await run(b.priyaPerson, 'visit.capture', { visitId: visit.id, deviceTime, ...payload }, `capture.${payload.kind}`)
      add(x.at, kind, x.result.id, job.id, `${job.number} ${label}`)
    }
    x = await run(b.priyaPerson, 'visit.complete', { visitId: visit.id, deviceTime, summary, signoff: { absentReason: 'Customer out' } }, 'capture.completion')
    add(x.at, 'completion', x.commandId, job.id, `${job.number} Completed: ${summary}`)
    const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
    add(x.at, 'service report', report.id, job.id, `${job.number} service report`, 'prepared')
    x = await run(b.office, 'invoice.prepare', { jobId: job.id }, 'invoice.prepared')
    const invoice = x.result
    add(x.at, 'invoice', invoice.id, job.id, `${invoice.number} for ${job.number}`, 'draft')
    histories.push({ site, request, quote, job, visit, invoice, expected: expected.sort((a, z) => z.at.localeCompare(a.at)) })
  }
  return { customer, apEmail, contactEmail, histories, trail, replays }
}

/** Native ordinary invoices at a local month boundary, shared by revenue journeys. */
export async function revenueCorrection(h) {
  const b = await business(h, { currency: 'USD', timezone: 'America/New_York', taxSettings: { jurisdictions: [{ id: 'synthetic-glove-revenue-tax', name: 'Combined tax', rate: '8.25', zips: [], taxLabor: true }], defaultJurisdictionId: 'synthetic-glove-revenue-tax' } })
  const maintenance = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Maintenance work', category: 'Maintenance', unitPrice: '50.01', tax: 'TAXABLE' })
  const repair = await h.command('service.save', { code: 'synthetic-glove-2', name: 'Repair work', category: 'Repair', unitPrice: '40.04', tax: 'TAXABLE' })
  const uncategorized = await h.command('service.save', { code: 'synthetic-glove-3', name: 'Other work', unitPrice: '18.18', tax: 'TAXABLE' })
  const groups = [
    [{ description: 'Custom first line', quantity: '1', unitPrice: '12.34', tax: 'TAXABLE' }, { description: 'Maintenance work', quantity: '2', unitPrice: '50.01', serviceId: maintenance.id }, { description: 'Repair work', quantity: '1', unitPrice: '40.04', serviceId: repair.id }],
    [{ description: 'Only custom work', quantity: '1', unitPrice: '37.77', tax: 'TAXABLE' }],
    [{ description: 'Other work', quantity: '1', unitPrice: '18.18', serviceId: uncategorized.id }, { description: 'Repair work', quantity: '1', unitPrice: '20.02', serviceId: repair.id }],
  ]
  const invoices = []
  for (const [i, lines] of groups.entries()) {
    let quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: `Revenue work ${i + 1}`, lines })
    quote = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
    const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-30', start: `${String(9 + i * 2).padStart(2, '0')}:00`, end: `${10 + i * 2}:00` })
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Native revenue work complete', signoff: { absentReason: 'Customer away' } })
    const draft = await b.office.run('invoice.prepare', { jobId: job.id })
    invoices.push(draft)
  }
  // UTC is already November; the business is still in October.
  await h.setTime('2026-11-01T03:55:00.000Z')
  for (const inv of invoices) await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  const exported = await b.office.run('invoice.export', {})
  const invoice = (await h.state()).invoices.find(i => i.id === invoices[0].id)
  return { b, invoices, invoice, exported, correctionLines: [{ description: 'Revised repair line', quantity: '2', unitPrice: '70.03', serviceId: repair.id }, { description: 'Revised custom line', quantity: '1', unitPrice: '5.05', tax: 'TAXABLE' }] }
}
