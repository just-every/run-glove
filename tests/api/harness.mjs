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
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'
import { build } from 'esbuild'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, randomBytes, generateKeyPairSync, sign, createHmac } from 'node:crypto'
import assert from 'node:assert/strict'

export async function installation({ isolates = 1, at = null } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'glove-api-'))
  const bundled = await build({ entryPoints: ['tests/api/worker.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'es2022', external: ['node:*', 'cloudflare:*'], loader: { '.css': 'text', '.svg': 'text' } })
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
  const workerOptions = convertV4MiniflareOptions({
      host: '127.0.0.1', https: true, modules: true, script: bundled.outputFiles[0].text, compatibilityDate: '2026-09-08', compatibilityFlags: ['nodejs_compat'], d1Databases: { DB: 'glove-shared-db' },
      durableObjects: { MAIL_REJECTIONS: { className: 'MailRejections', scriptName: 'app', useSQLite: true } },
      bindings: { AUTH_LOCAL: 'false', AUTH_ORIGIN: origin, OWNER_EMAIL: 'owner@example.test', SESSION_SECRET: randomBytes(32).toString('hex'), SETUP_TOKEN: setup, MAIL_PROVIDER: 'resend', MAIL_FROM: 'auth@example.test', MAIL_API_KEY: 'test-only-key' },
      // Test-only provider edge: the Worker's mail facade is unchanged.
      outboundService: async request => {
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
    if (at) assert.equal((await request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
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
    const restart = async () => {
      await mf.dispose()
      mf = new Miniflare(options)
      await mf.ready
      db = await mf.getD1Database('DB')
      if (at) assert.equal((await request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
    }
    return { get mf() { return mf }, origin, get db() { return db }, restart, request, command, state, scheduled, person, xero, fleet, calendars, calendarSync, quickbooks, checkpoints, marketing, models, pushes, mails, email, twilio, companycam, maps, leads, stripeTax, stripePayments, wisetack, avatax, turnstile, owner: () => owner, async close() { await mf.dispose(); await rm(root, { recursive: true, force: true }) } }
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
