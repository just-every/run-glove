// BOOK-003: requests carry their source and move through the pipeline; the
// office reads the aging board and conversion and revenue by source through
// the report door.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'
import { recorded } from '../fixtures/leads.mjs'

test('BOOK-003 requests from four sources move through the pipeline into the conversion-by-source report', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const request = (source, description) => b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description, source })
  const web = await request('website', 'Split system blowing warm air')
  const webIdle = await request('website', 'Price for a second unit')
  const google = await request('google', 'Annual service for three units')
  const angi = await request('angi', 'Replace ducted system')
  const referral = await request('referral', 'Referred by the clinic next door')
  assert.deepEqual([web.status, web.source], ['new', 'website'])
  await b.office.run('enquiry.create', { customerId: b.customer.id, description: 'x', source: 'billboard' }, { error: 'INPUT' })

  // Contacted, then quoted and won for two; one lost with its reason; one only contacted.
  const contacted = await b.office.run('enquiry.contact', { enquiryId: referral.id, version: referral.version, note: 'Left a voicemail' })
  assert.equal(contacted.status, 'contacted')
  await b.office.run('enquiry.contact', { enquiryId: referral.id, version: referral.version }, { error: 'STALE' })
  const win = async (enquiry, price) => {
    const quote = await b.dispatcher.run('quote.draft', { enquiryId: enquiry.id, title: enquiry.description, lines: [{ description: 'Split system service', quantity: '1', unitPrice: price, serviceId: b.service.id }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    return b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  }
  await win(web, '189.00')
  const googleQuote = await win(google, '540.00')
  let s = await h.state()
  assert.equal(s.enquiries.find(e => e.id === web.id).status, 'won')
  const lostAngi = s.enquiries.find(e => e.id === angi.id)
  const lost = await b.office.run('enquiry.close', { enquiryId: angi.id, version: lostAngi.version, reason: 'Went with a cheaper quote' })
  assert.deepEqual([lost.status, lost.lostReason], ['lost', 'Went with a cheaper quote'])
  const won = s.enquiries.find(e => e.id === google.id)
  await b.office.run('enquiry.close', { enquiryId: google.id, version: won.version, reason: 'x' }, { error: 'ENQUIRY_STATE' })
  await b.dispatcher.run('quote.draft', { enquiryId: angi.id, title: 'x', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] }, { error: 'ENQUIRY_STATE' })

  // The Google job is done and invoiced, so its revenue counts as invoiced.
  const job = await b.dispatcher.run('job.create', { quoteId: googleQuote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:04:00Z' })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:10:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-19T23:00:00Z', summary: 'Serviced', signoff: { absentReason: 'Customer out' } })
  const inv = await b.office.run('invoice.prepare', { jobId: job.id })
  await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })

  const res = await h.request('/api/glove/reports/sources', { as: b.office.cookie })
  assert.equal(res.status, 200)
  const report = await res.json()
  const bySource = Object.fromEntries(report.sources.map(r => [r.source, r]))
  assert.deepEqual(Object.keys(bySource).sort(), ['angi', 'google', 'referral', 'website'])
  assert.deepEqual(['requests', 'contacted', 'quoted', 'won', 'lost', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.website[k]), [2, 0, 1, 1, 0, '50.0', '207.90', '0.00'])
  assert.deepEqual(['requests', 'quoted', 'won', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.google[k]), [1, 1, 1, '100.0', '594.00', '594.00'])
  assert.deepEqual(['requests', 'won', 'lost', 'conversion'].map(k => bySource.angi[k]), [1, 0, 1, '0.0'])
  assert.deepEqual(['requests', 'contacted', 'won'].map(k => bySource.referral[k]), [1, 1, 0])
  assert.deepEqual(report.total, { requests: 5, won: 2, conversion: '40.0', wonValue: '801.90', invoiced: '594.00' })
  const board = Object.fromEntries(report.pipeline.map(p => [p.stage, p.requests]))
  assert.deepEqual(Object.fromEntries(Object.entries(board).map(([k, v]) => [k, v.map(r => r.id)])), { new: [webIdle.id], contacted: [referral.id], quoted: [], won: [web.id, google.id], lost: [angi.id] })
  assert.equal(board.lost[0].lostReason, 'Went with a cheaper quote')
  assert.ok(Object.values(board).flat().every(r => r.ageDays === 0 && r.since), 'each request shows how long it has sat in its stage')
  assert.equal((await h.request('/api/glove/reports/sources', { as: b.priyaPerson.cookie })).status, 403, 'technicians never read revenue')
  s = await h.state()
  for (const kind of ['enquiry.created', 'enquiry.contacted', 'enquiry.won', 'enquiry.lost']) assert.ok(s.events.some(e => e.kind === kind), `timeline has ${kind}`)
})

test('DATA-002 / BOOK-004 / API-005: a lead from each of Google, Angi, Thumbtack and Yelp lands as a request with its source and cost, one matched to an existing customer, each with an acknowledgment queued; an Angi rule applies its lead cost', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  // Only the owner connects lead sources; a posting provider's door password is shown once.
  await b.dispatcher.run('lead.connect', { provider: 'thumbtack' }, { error: 'FORBIDDEN' })
  const thumbtack = await h.command('lead.connect', { provider: 'thumbtack', respondWithinMinutes: 30 })
  assert.match(thumbtack.password, /^[a-f0-9]{64}$/)
  assert.deepEqual(thumbtack.callback, { url: `${h.origin}/api/glove/leads/thumbtack`, user: 'glove' })
  const angi = await h.command('lead.connect', { provider: 'angi', respondWithinMinutes: 15 })
  const yelp = await h.command('lead.connect', { provider: 'yelp', apiKey: 'synthetic-glove-4' })
  const google = { customerId: '123-456-7890', developerToken: 'synthetic-glove-5', clientId: 'synthetic-glove-6', clientSecret: 'synthetic-glove-7', refreshToken: 'synthetic-glove-8' }
  assert.equal((await h.command('lead.connect', { provider: 'google', ...google })).password, undefined)
  // API-005: rules apply a lead cost to requests from a source; a provider-reported cost is never replaced.
  const rule = (name, source, amount) => h.command('rule.save', { name, trigger: 'enquiry.created', condition: { source }, action: { kind: 'leadCost', amount } })
  const angiRule = await rule('Angi lead cost', 'angi', '42.00')
  await rule('Google lead cost', 'google', '28.00'); await rule('Yelp lead cost', 'yelp', '15.00')
  const thumbtackRule = await rule('Thumbtack lead cost', 'thumbtack', '99.00')
  await h.command('rule.save', { name: 'Wrong trigger', trigger: 'job.created', action: { kind: 'leadCost', amount: '5.00' } }, { error: 'INPUT' })

  const post = (provider, body, password) => h.mf.dispatchFetch(`${h.origin}/api/glove/leads/${provider}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`glove:${password}`).toString('base64')}` }, body: JSON.stringify(body) })
  // A wrong or another source's password, or none, is the same 401 and writes nothing.
  const version = (await h.state()).version
  for (const password of ['f'.repeat(64), angi.password]) {
    const refused = await post('thumbtack', recorded.thumbtack(), password)
    assert.equal(refused.status, 401)
    assert.deepEqual(await refused.json(), { ok: false, error: { code: 'LEAD', message: 'Not accepted: the credentials or the lead did not match.' } })
  }
  assert.equal((await h.mf.dispatchFetch(`${h.origin}/api/glove/leads/thumbtack`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 401)
  assert.equal((await h.state()).version, version)
  // Each provider's lead lands once; a retried post changes nothing; a week-old lead is refused.
  assert.equal((await post('thumbtack', recorded.thumbtack(), thumbtack.password)).status, 200)
  assert.equal((await post('thumbtack', recorded.thumbtack(), thumbtack.password)).status, 200)
  assert.equal((await post('thumbtack', recorded.thumbtack('511234567890999999', 8 * 24 * 60), thumbtack.password)).status, 401)
  assert.equal((await post('angi', recorded.angi(), angi.password)).status, 200)
  h.leads.yelp.set('synthetic-glove-yelp-lead-1', recorded.yelpLead('synthetic-glove-yelp-lead-1'))
  assert.equal((await post('yelp', recorded.yelpNotice('synthetic-glove-yelp-lead-1'), yelp.password)).status, 200)
  h.leads.google.push(recorded.google())
  // Google has no push: the desk reads it now (and every scheduled run does).
  assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 1)
  assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 0)

  const s = await h.state(), leads = s.enquiries.filter(e => e.lead)
  assert.deepEqual(leads.map(e => [e.source, e.leadCost.amount, e.leadCost.by]).sort(), [['angi', '42.00', 'rule'], ['google', '28.00', 'rule'], ['thumbtack', '35.50', 'provider'], ['yelp', '15.00', 'rule']])
  // One lead is an existing customer's (Angi's email is Harbourview Dental's); the others are new customers.
  assert.deepEqual(leads.filter(e => e.lead.matched === 'existing').map(e => [e.source, e.customerId]), [['angi', b.customer.id]])
  const dana = s.customers.find(c => c.id === leads.find(e => e.source === 'thumbtack').customerId)
  assert.deepEqual([dana.name, dana.phone, s.sites.find(x => x.customerId === dana.id).address], ['Dana Reyes', '+1 312-555-0142', '2300 N Lincoln Park W, Unit 4, Chicago, IL 60614'])
  assert.equal(s.customers.find(c => c.id === leads.find(e => e.source === 'google').customerId).email, 'pat.kim@example.test')
  assert.match(leads.find(e => e.source === 'yelp').description, /^Water Heater Installation\/Repair; What kind of water heater\? Tankless; The pilot keeps going out\.$/)
  // An acknowledgment is queued for each lead, due within its source's response window.
  for (const e of leads) {
    assert.equal(e.acknowledgment.status, 'queued')
    assert.equal(e.acknowledgment.text, 'Thanks for contacting Harbour Air & Electrical! We received your request and will be in touch shortly.')
    assert.equal((Date.parse(e.acknowledgment.dueBy) - Date.parse(e.lead.receivedAt)) / 60_000, { thumbtack: 30, angi: 15, yelp: 60, google: 60 }[e.source])
  }
  // The rule runs: Angi's applied its cost; Thumbtack's kept the provider's.
  assert.deepEqual(s.ruleRuns.filter(r => r.ruleId === angiRule.id).map(r => [r.outcome, r.detail]), [['done', 'lead cost $42.00 applied']])
  assert.deepEqual(s.ruleRuns.filter(r => r.ruleId === thumbtackRule.id).map(r => [r.outcome, r.detail]), [['refused', 'the request already has a lead cost of $35.50 (from the provider)']])
  // Provider calls carried only their own credentials.
  assert.deepEqual(h.leads.calls.filter(c => c.api === 'yelp').map(c => [c.authorization, c.id]), [['Bearer synthetic-glove-4', 'synthetic-glove-yelp-lead-1']])
  const search = h.leads.calls.filter(c => c.api === 'google-ads')
  assert.deepEqual([search[0].customerId, search[0].authorization, search[0].developerToken], ['1234567890', 'Bearer synthetic-glove-access-1', 'synthetic-glove-5'])
  assert.match(search[0].query, /^SELECT local_services_lead\.id, .* FROM local_services_lead WHERE local_services_lead\.creation_date_time >= '/)

  // The desk records the acknowledgment sent outside Glove; the owner or office corrects a cost.
  const ack = leads.find(e => e.source === 'thumbtack')
  const sent = await b.office.run('enquiry.acknowledged', { enquiryId: ack.id, version: ack.version, how: 'Replied in Thumbtack' })
  assert.deepEqual([sent.acknowledgment.status, sent.acknowledgment.by.name, sent.acknowledgment.how], ['sent', 'Olu Office', 'Replied in Thumbtack'])
  await b.office.run('enquiry.acknowledged', { enquiryId: ack.id, version: sent.version }, { error: 'ACKNOWLEDGMENT' })
  await b.dispatcher.run('enquiry.cost', { enquiryId: ack.id, version: sent.version, amount: '30.00' }, { error: 'FORBIDDEN' })
  assert.deepEqual((await b.office.run('enquiry.cost', { enquiryId: ack.id, version: sent.version, amount: '30.00' })).leadCost.by, 'person')

  // Every scheduled run reads Google's new leads.
  h.leads.google.push(recorded.google('887767', 2))
  await h.scheduled(Date.now())
  assert.equal((await h.state()).enquiries.filter(e => e.source === 'google').length, 2)
  // Later Google pages land through both read doors, and retries keep one request per lead.
  h.leads.googlePages.set('', { results: [recorded.google()], nextPageToken: 'synthetic-glove-page-2' })
  h.leads.googlePages.set('synthetic-glove-page-2', { results: [recorded.google('synthetic-glove-30')] })
  const pageCalls = h.leads.calls.length
  assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 1)
  const pages = h.leads.calls.slice(pageCalls).filter(c => c.api === 'google-ads')
  assert.deepEqual(pages.map(c => c.pageToken), [null, 'synthetic-glove-page-2'])
  assert.equal(pages[0].query, pages[1].query, 'Google requires the same query on every page')
  assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' })).landed.length, 0)
  h.leads.googlePages.set('synthetic-glove-page-2', { results: [recorded.google('synthetic-glove-31')] })
  await h.scheduled(Date.now())
  assert.equal((await h.state()).enquiries.filter(e => e.source === 'google').length, 4)
  const pageVersion = (await h.state()).version
  h.leads.googlePages.set('', { results: [recorded.google('synthetic-glove-32')], nextPageToken: 'synthetic-glove-page-2' })
  h.leads.googlePages.set('synthetic-glove-page-2', { results: [], nextPageToken: 'synthetic-glove-page-2' })
  await b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
  assert.equal((await h.state()).version, pageVersion, 'a looping provider response never lands a partial read')
  h.leads.googlePages.set('synthetic-glove-page-2', new Response('Unavailable', { status: 503 }))
  await b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
  assert.equal((await h.state()).version, pageVersion, 'a failed later page never lands a partial read')
  h.leads.googlePages.set('synthetic-glove-page-2', { results: [{}] })
  await b.dispatcher.run('lead.pull', { provider: 'google' }, { error: 'LEADS' })
  assert.equal((await h.state()).version, pageVersion, 'a malformed later lead never lands a partial read')
  h.leads.googlePages.clear()
  // Credentials and door passwords never enter records, Activity, the export or command outcomes.
  for (const secret of [thumbtack.password, angi.password, yelp.password, 'synthetic-glove-4', 'synthetic-glove-5', 'synthetic-glove-7', 'synthetic-glove-8']) {
    assert.ok(!JSON.stringify(await h.state()).includes(secret))
    assert.ok(!(await (await h.request('/api/glove/export')).text()).includes(secret))
    for (const table of ['glove_records', 'glove_events', 'glove_commands']) assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(secret), `${table} never holds a lead credential`)
  }
  // Reserve with Google: a documented Booking record is request intake only,
  // never a booking-server success or a reply. Reuse the same real public doors.
  await b.office.run('lead.connect', { provider: 'reserve-google' }, { error: 'FORBIDDEN' })
  const reserve = await h.command('lead.connect', { provider: 'reserve-google', respondWithinMinutes: 20 })
  assert.deepEqual(reserve.callback, { url: `${h.origin}/api/glove/leads/reserve-google`, user: 'glove' })
  const booking = recorded.reserveGoogle(), beforeReserve = await h.state()
  const callsBefore = h.leads.calls.length, mailBefore = h.email.sent.length
  for (const body of [{}, { ...booking, status: 'CANCELED' }, { ...booking, booking_id: '' }, { ...booking, slot: { ...booking.slot, start_sec: 'invalid' } }, { ...booking, slot: { ...booking.slot, duration_sec: -1 } }, { ...booking, user_information: { ...booking.user_information, email: '' } }]) {
    assert.equal((await post('reserve-google', body, reserve.password)).status, 401)
  }
  assert.equal((await post('reserve-google', booking, thumbtack.password)).status, 401)
  assert.equal((await h.state()).version, beforeReserve.version, 'refused records write nothing')
  assert.deepEqual(await Promise.all([1, 2].map(async () => (await post('reserve-google', booking, reserve.password)).status)), [200, 200])
  const reserveState = await h.state(), requests = reserveState.enquiries.filter(e => e.source === 'reserve-google')
  assert.equal(requests.length, 1, 'concurrent delivery retries land one request')
  const request = requests[0]
  assert.deepEqual([request.customerId, request.lead.provider, request.lead.providerLeadId, request.lead.matched, request.status], [b.customer.id, 'reserve-google', booking.booking_id, 'existing', 'new'])
  assert.deepEqual(request.lead.booking, { merchantId: booking.slot.merchant_id, serviceId: booking.slot.service_id, startAt: new Date(Number(booking.slot.start_sec) * 1000).toISOString(), durationSeconds: 3600, sourceStatus: 'CONFIRMED' })
  assert.equal(request.lead.providerTime, null, 'a slot start is not a notification creation time')
  assert.equal(request.leadCost, undefined, 'a booking price is not a lead cost')
  assert.equal(request.acknowledgment.status, 'queued')
  assert.equal(request.acknowledgment.channel, 'Reserve with Google')
  assert.equal(Date.parse(request.acknowledgment.dueBy) - Date.parse(request.lead.receivedAt), 20 * 60_000)
  assert.deepEqual([reserveState.jobs, reserveState.visits, reserveState.sites], [beforeReserve.jobs, beforeReserve.visits, beforeReserve.sites], 'intake books no work or service address')
  assert.deepEqual([h.leads.calls.length, h.email.sent.length], [callsBefore, mailBefore], 'no provider call or customer acknowledgment send')
  assert.equal((await (await h.request('/api/glove/reports/sources')).json()).sources.find(s => s.source === 'reserve-google').requests, 1)
  assert.ok(reserveState.events.some(e => e.kind === 'lead.received' && e.subjectId === request.id))
  const exported = await (await h.request('/api/glove/export')).text()
  assert.ok(exported.includes(booking.booking_id))
  assert.ok(!exported.includes(reserve.password))
  assert.equal((await h.db.prepare('SELECT hash FROM glove_lead_secrets WHERE provider=?').bind('reserve-google').first()).hash, (await import('node:crypto')).createHash('sha256').update(reserve.password).digest('hex'))
  const reconnected = await h.command('lead.connect', { provider: 'reserve-google' })
  assert.equal((await post('reserve-google', recorded.reserveGoogle('synthetic-glove-24'), reserve.password)).status, 401)
  assert.equal((await post('reserve-google', booking, reconnected.password)).status, 200)
  assert.equal((await h.state()).enquiries.filter(e => e.source === 'reserve-google').length, 1)
  await h.command('lead.connect', { provider: 'reserve-google', disconnect: true })
  assert.equal((await post('reserve-google', booking, reconnected.password)).status, 404)

  // Disconnecting a source closes its door.
  await h.command('lead.connect', { provider: 'angi', disconnect: true })
  assert.equal((await post('angi', recorded.angi(), angi.password)).status, 404)
  await assertTrail(h, ['lead.connected', 'lead.received', 'rule.ran', 'lead.read', 'enquiry.acknowledged', 'enquiry.cost', 'lead.disconnected'])
})

// Consented website intake and its private request originals (BOOK-001).
import { randomUUID } from 'node:crypto'

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
  const peer = await h.command('customer.save', { name: 'synthetic-glove-27', phone: '2125550127' })
  const peerRequest = await h.command('enquiry.create', { customerId: peer.id, description: `Coordinate with the request contact ${input.email}`, source: 'phone' })
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
  const retained = (await h.state()).enquiries.find(e => e.id === peerRequest.id)
  assert.ok(retained && !retained.description.includes(input.email), 'the newly supplied typed contact is redacted without deleting a peer request')
  assert.equal((await h.state()).customers.find(c => c.id === peer.id).name, peer.name)
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

// Photo sharing is independent of ordinary office-contact consent.
import { requestPhotoFixtures, sentinel as photoMetadata } from '../fixtures/request-photos.mjs'

test('BOOK-001 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls', async t => {
  const h = await installation(); t.after(() => h.close())
  await setup(h)
  await h.command('service.save', { code: 'synthetic-glove-71', name: 'Coil inspection', unitPrice: '125.00', tax: 'FREE' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'synthetic-glove-72', key: 'synthetic-glove-73' })
  await configure(h)
  assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
  const terms = { modelPhotosEnabled: true, photoProviderName: 'Synthetic model provider', noTrainingTerms: 'The agreed provider terms prohibit training on request photos.', confirmNoTraining: true }
  const before = await durable(h)
  await h.command('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms, confirmNoTraining: false }, { error: 'PHOTO_TERMS' })
  assert.deepEqual(await durable(h), before)
  const office = await h.person('Photo Office', 'office'), limited = await h.person('Photo Limited', 'owner')
  await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
  for (const person of [office, limited]) await person.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms }, { error: 'FORBIDDEN' })
  await configure(h, terms)
  const disclosure = (await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure
  assert.ok(disclosure.text.includes('Synthetic model provider') && disclosure.text.includes('models.example.test'))
  assert.ok(!JSON.stringify(disclosure).includes(terms.noTrainingTerms), 'the provider contract is not published as sender disclosure')
  h.turnstile.answer = () => challenge()
  const received = async (photos, consent = true) => {
    const input = { ...request(), source: `synthetic-glove-${nextToken++}`, photos, ...(consent ? { photoConsent: { accepted: true, disclosureId: disclosure.id } } : {}) }
    const response = await send(h, input)
    assert.equal(response.status, 200, await response.clone().text())
    const enquiry = (await h.state()).enquiries.find(e => e.intake?.source === input.source)
    return { input, enquiry }
  }
  const answer = () => ({ title: 'Coil service', ...Object.fromEntries(['good', 'better', 'best'].map(tier => [tier, { reason: 'Recorded equipment condition', lines: [{ code: 'synthetic-glove-71', quantity: '1' }] }])) })
  // A deliberate invalid answer leaves a request open for the later-call probe.
  h.models.answer = () => ({})
  const noConsent = await received([requestPhotoFixtures()[1]], false)
  await h.command('quote.suggest', { enquiryId: noConsent.enquiry.id }, { error: 'MODEL' })
  assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string')
  for (const photo of requestPhotoFixtures()) {
    const { input, enquiry } = await received([photo])
    await h.command('quote.suggest', { enquiryId: enquiry.id }, { error: 'MODEL' })
    const call = h.models.calls.at(-1).body, content = call.messages[1].content
    assert.equal(content.length, 2)
    assert.deepEqual(Object.keys(content[1]).sort(), ['image_url', 'type'])
    const sent = Buffer.from(content[1].image_url.url.split(',')[1], 'base64')
    assert.ok(sent.length < Buffer.from(photo.base64, 'base64').length)
    assert.ok(!sent.includes(Buffer.from(photoMetadata)), `${photo.mediaType} model copy strips EXIF, GPS, XMP and text`)
    assert.equal(call.store, false)
    const wire = JSON.stringify(call)
    for (const excluded of [input.name, input.phone, input.email, input.address, photo.caption, enquiry.id, enquiry.photos[0].file.fileId]) assert.ok(!wire.includes(excluded), 'no contact, identity, caption, file reference or address is added with model photos')
    const file = enquiry.photos[0].file.fileId
    assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64, 'office original is unchanged')
    assert.equal((await h.request(`/api/glove/files/${file}`, { as: '' })).status, 401)
    await office.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
    await limited.run('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender called' }, { error: 'FORBIDDEN' })
    await h.command('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: false, reason: 'No sender request' }, { error: 'PHOTO_CONSENT' })
    await h.command('intake.withdrawPhotos', { enquiryId: enquiry.id, version: enquiry.version, senderRequested: true, reason: 'Sender asked the owner by phone to withdraw photo sharing' })
    h.models.answer = answer
    await h.command('quote.suggest', { enquiryId: enquiry.id })
    assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'a later call contains no withdrawn photo')
    assert.equal(Buffer.from(await (await h.request(`/api/glove/files/${file}`)).arrayBuffer()).toString('base64'), photo.base64)
    h.models.answer = () => ({})
  }
  const malformedPhoto = { ...requestPhotoFixtures()[1], base64: Buffer.from(requestPhotoFixtures()[1].base64, 'base64').subarray(0, -5).toString('base64') }
  const malformed = await received([malformedPhoto]), callsBeforeMalformed = h.models.calls.length
  await h.command('quote.suggest', { enquiryId: malformed.enquiry.id }, { error: 'PHOTO_METADATA' })
  assert.equal(h.models.calls.length, callsBeforeMalformed, 'an unsafe copy never falls back to sending the original')
  const redirected = await received([requestPhotoFixtures()[1]])
  h.models.reply = () => new Response(null, { status: 307, headers: { location: 'https://synthetic-glove-84.example.test/redirect' } })
  const refusal = await h.command('quote.suggest', { enquiryId: redirected.enquiry.id }, { error: 'MODEL' })
  assert.equal(refusal.details.status, 307, 'photo requests do not follow redirects to a different recipient')
  h.models.reply = null
  const switchOff = await received([requestPhotoFixtures()[1]])
  await configure(h)
  await h.command('quote.suggest', { enquiryId: switchOff.enquiry.id }, { error: 'MODEL' })
  assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'turning off the switch excludes existing consented photos')
  await configure(h, terms)
  const currentDisclosure = (await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure
  const stale = { ...request(), photoConsent: { accepted: true, disclosureId: disclosure.id } }
  const baseline = await durable(h)
  assert.equal((await send(h, stale)).status, 409)
  assert.deepEqual(await durable(h), baseline)
  const providerInput = { ...request(), photoConsent: { accepted: true, disclosureId: currentDisclosure.id }, photos: [requestPhotoFixtures()[1]], source: 'synthetic-glove-81' }
  assert.equal((await send(h, providerInput)).status, 200)
  const providerRequest = (await h.state()).enquiries.find(e => e.intake?.source === providerInput.source)
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'synthetic-glove-82', key: 'synthetic-glove-83' })
  assert.equal((await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure, undefined)
  await h.command('quote.suggest', { enquiryId: providerRequest.id }, { error: 'MODEL' })
  assert.equal(typeof h.models.calls.at(-1).body.messages[1].content, 'string', 'provider changes cannot inherit consent')
  const delegate = await h.person('Photo Delegate', 'owner')
  await delegate.run('intake.configure', { version: (await h.state()).business[0].version, enabled: true, siteKey: 'synthetic-glove-11', allowedOrigins: [embed], ...terms })
  const delegatedDisclosure = (await (await h.request(endpoint, { as: '', headers: { origin: embed } })).json()).photoDisclosure
  const delegatedInput = { ...request(), photos: [requestPhotoFixtures()[1]], source: 'synthetic-glove-85', photoConsent: { accepted: true, disclosureId: delegatedDisclosure.id } }
  assert.equal((await send(h, delegatedInput)).status, 200)
  const delegated = (await h.state()).enquiries.find(e => e.intake?.source === delegatedInput.source), beforeAuthority = h.models.calls.length
  await h.command('branch.limit', { operatorId: delegate.id, branchId: 'main' })
  await h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
  await h.command('branch.limit', { operatorId: delegate.id, branchId: null })
  await h.command('role.set', { operatorId: delegate.id, role: 'office' })
  await h.command('quote.suggest', { enquiryId: delegated.id }, { error: 'PHOTO_CONSENT_CHANGED' })
  assert.equal(h.models.calls.length, beforeAuthority, 'loss of the configuring owner authority fences dispatch')
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(exported.timeline.some(e => e.kind === 'intake.photoUseAuthorized'))
  assert.equal(exported.timeline.filter(e => e.kind === 'intake.photosWithdrawn').length, 3)
})
