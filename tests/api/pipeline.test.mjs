import { scenario } from '../fixtures/scenario.mjs'
// BOOK-003: requests carry their source and move through the pipeline; the
// office reads the aging board and conversion and revenue by source through
// the report door.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'
import { recorded } from '../fixtures/leads.mjs'
import { connectMail } from '../fixtures/mail-providers.mjs'

test('BOOK-003 requests from four sources move through the pipeline into the conversion-by-source report', async t => {
  await scenario(t, 'BOOK-003 requests from four sources move through the pipeline into the conversion-by-source report', async (t) => {
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

  await scenario(t, 'DATA-002, DATA-009, DATA-010 / BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 / API-005: a lead from each of Google, Angi, Thumbtack and Yelp lands as a request with its source and cost, one matched to an existing customer, each with an acknowledgment queued; an Angi rule applies its lead cost', async (t) => {
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
  // Yelp's documented masked email is a provider message channel, with per-send owner approval.
  const yelpRequest = (await h.state()).enquiries.find(e => e.source === 'yelp')
  assert.equal(h.email.sent.length, 0, 'intake never sends an acknowledgment automatically')
  const replyPayload = { enquiryId: yelpRequest.id, version: yelpRequest.version, confirm: true }
  await b.office.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
  await b.dispatcher.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('enquiry.reply', replyPayload, { error: 'FORBIDDEN' })
  await h.command('enquiry.reply', { ...replyPayload, confirm: false }, { error: 'CONSENT' })
  await h.command('enquiry.reply', replyPayload, { error: 'MAIL' })
  await h.command('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-60', fromEmail: 'office@example.test' })
  const yelpCustomer = (await h.state()).customers.find(c => c.id === yelpRequest.customerId)
  await h.command('customer.save', { id: yelpCustomer.id, version: yelpCustomer.version, name: yelpCustomer.name, email: 'changed@example.test' })
  const reply = await h.command('enquiry.reply', replyPayload, { commandId: 'synthetic-glove-yelp-reply' })
  assert.equal(reply.acknowledgment.status, 'emailQueued')
  assert.deepEqual([h.email.sent.at(-1).body.To, h.email.sent.at(-1).body.TextBody], ['synthetic-glove-relay-1@example.test', yelpRequest.acknowledgment.text])
  assert.equal((await h.state()).messageStates[reply.acknowledgment.messageId].status, 'accepted')
  const yelpConversation = await (await h.request(`/api/glove/conversation?customerId=${yelpRequest.customerId}`)).json()
  const acknowledgment = yelpConversation.entries.find(e => e.id === `email:${reply.acknowledgment.messageId}`)
  assert.deepEqual([acknowledgment.kind, acknowledgment.direction, acknowledgment.author], ['Yelp acknowledgment emailed', 'outbound', 'Olivia Owner'])
  assert.match(acknowledgment.delivery, /Accepted by Postmark; delivery not yet reported/)
  await h.command('enquiry.reply', replyPayload, { commandId: 'synthetic-glove-yelp-reply' })
  await h.command('enquiry.reply', { ...replyPayload, version: reply.version }, { error: 'ACKNOWLEDGMENT' })
  assert.equal(h.email.sent.length, 1, 'replay and a second send cannot duplicate the acknowledgment')
  h.leads.yelp.set('synthetic-glove-90', { ...recorded.yelpLead('synthetic-glove-90'), temporary_email_address_expiry: new Date(Date.now() - 1000).toISOString() })
  assert.equal((await post('yelp', recorded.yelpNotice('synthetic-glove-90'), yelp.password)).status, 200)
  const expiredReply = (await h.state()).enquiries.find(e => e.lead?.providerLeadId === 'synthetic-glove-90')
  await h.command('enquiry.reply', { enquiryId: expiredReply.id, version: expiredReply.version, confirm: true }, { error: 'LEAD_REPLY' })
  assert.equal(h.email.sent.length, 1, 'an expired provider address is never sent a reply')
  // Credentials and door passwords never enter records, Activity, the export or command outcomes.
  for (const secret of [thumbtack.password, angi.password, yelp.password, 'synthetic-glove-4', 'synthetic-glove-5', 'synthetic-glove-7', 'synthetic-glove-8', 'synthetic-glove-60']) {
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
  await assertTrail(h, ['lead.connected', 'lead.received', 'rule.ran', 'lead.read', 'enquiry.acknowledged', 'enquiry.cost', 'lead.disconnected', 'enquiry.replyApproved', 'email.queued', 'email.accepted'])
})

  // Recorded provider formats enter the real receiver; only their times and synthetic identities are fixed.
  const proofAt = '2026-11-09T12:00:00.000Z'
  async function leadProof(t) {
    const h = await installation({ at: proofAt })
    t.after(() => h.close())
    const b = await business(h)
    const connections = {}, secrets = []
    const connect = async (provider, options = {}) => {
      const result = await h.command('lead.connect', { provider, ...(provider === 'yelp' ? { apiKey: 'synthetic-glove-book015-key' } : {}), ...(provider === 'google' ? { customerId: '1234567890', developerToken: 'synthetic-glove-book015-developer', clientId: 'synthetic-glove-book015-client', clientSecret: 'synthetic-glove-book015-client-secret', refreshToken: 'synthetic-glove-book015-refresh' } : {}), ...options })
      connections[provider] = result
      if (result.password) secrets.push(result.password)
      return result
    }
    const post = async (provider, body) => {
      const response = await h.mf.dispatchFetch(`${h.origin}/api/glove/leads/${provider}`, { method: 'POST', headers: { 'content-type': ['application', 'json'].join('/'), authorization: `Basic ${Buffer.from(`glove:${connections[provider].password}`).toString('base64')}` }, body: JSON.stringify(body) })
      assert.equal(response.status, 200, await response.clone().text())
    }
    const receive = async (provider, id, options = {}) => {
      if (!connections[provider]) await connect(provider)
      if (provider === 'google') {
        const payload = recorded.google(id)
        payload.localServicesLead.creationDateTime = '2026-11-09 12:00:00'
        h.leads.google.push(payload)
        await b.dispatcher.run('lead.pull', { provider })
      } else if (provider === 'yelp') {
        h.leads.yelp.set(id, { ...recorded.yelpLead(id), time_created: proofAt, last_event_time: proofAt, temporary_email_address: ['synthetic-glove-book015-' + id, 'example.test'].join('@'), temporary_email_address_expiry: '2026-11-16T12:00:00.000Z', ...options })
        const notice = recorded.yelpNotice(id)
        notice.time = proofAt; notice.data.updates[0].interaction_time = proofAt
        await post(provider, notice)
      } else if (provider === 'thumbtack') {
        const payload = recorded.thumbtack(id)
        payload.data.createTimestamp = proofAt
        await post(provider, payload)
      } else if (provider === 'angi') {
        await post(provider, { ...recorded.angi(), leadOid: id, createDate: proofAt })
      } else {
        await post(provider, recorded.reserveGoogle(id))
      }
      const row = (await h.state()).enquiries.find(e => e.lead?.providerLeadId === id)
      assert.ok(row, `received ${provider} lead`)
      return row
    }
    const unchanged = async run => {
      const before = await h.state(), sent = h.email.sent.length
      await run()
      assert.deepEqual(await h.state(), before, 'refusal changes no business record or Activity')
      assert.equal(h.email.sent.length, sent, 'refusal makes no provider request')
    }
    const reply = e => ({ enquiryId: e.id, version: e.version, confirm: true })
    const conversation = async e => {
      const response = await h.request(`/api/glove/conversation?customerId=${e.customerId}`)
      assert.equal(response.status, 200)
      return response.json()
    }
    return { h, b, connect, receive, unchanged, reply, conversation, secrets }
  }

  await scenario(t, 'BOOK-015 point 1: provider costs survive rules, current authority controls costs and audited corrections refuse invalid or stale amounts', async t => {
    const { h, b, receive, unchanged } = await leadProof(t)
    const rule = (person, source, amount) => person('rule.save', { name: `${source} lead cost`, trigger: 'enquiry.created', condition: { source }, action: { kind: 'leadCost', amount } })
    const thumbRule = await rule(h.command, 'thumbtack', '99.00')
    const angiRule = await rule(b.office.run, 'angi', '42.00')
    const thumb = await receive('thumbtack', 'synthetic-glove-book015-thumb')
    assert.deepEqual([thumb.leadCost.amount, thumb.leadCost.by], ['35.50', 'provider'])
    const angi = await receive('angi', 'synthetic-glove-book015-angi')
    assert.deepEqual([angi.leadCost.amount, angi.leadCost.by, angi.leadCost.ruleId], ['42.00', 'rule', angiRule.id])
    let state = await h.state()
    const kept = state.ruleRuns.find(r => r.ruleId === thumbRule.id && r.trigger.subjectId === thumb.id)
    assert.deepEqual([kept.outcome, kept.detail], ['refused', 'the request already has a lead cost of $35.50 (from the provider)'])
    const role = await h.command('role.save', { name: 'Costless desk', permissions: ['enquiry.create'] })
    const custom = await h.person('Costless Custom', `custom:${role.id}`)
    for (const person of [b.dispatcher, b.priyaPerson, custom]) await unchanged(() => person.run('enquiry.cost', { enquiryId: thumb.id, version: thumb.version, amount: '10.00' }, { error: 'FORBIDDEN' }))
    for (const person of [{ name: 'Olivia Owner', run: h.command }, b.office]) {
      let current = (await h.state()).enquiries.find(e => e.id === thumb.id)
      const first = await person.run('enquiry.cost', { enquiryId: current.id, version: current.version, amount: '31.25' })
      const corrected = await person.run('enquiry.cost', { enquiryId: first.id, version: first.version, amount: '28.75' })
      assert.deepEqual([corrected.leadCost.amount, corrected.leadCost.by, corrected.leadCost.person.name], ['28.75', 'person', person.name])
      const event = (await h.state()).events.find(e => e.kind === 'enquiry.cost' && e.summary.includes('set the lead cost to $28.75') && e.actorName === person.name)
      assert.match(event.summary, /set the lead cost to \$28\.75 \(was \$31\.25\)/)
      assert.equal(event.actorName, person.name)
      for (const amount of ['0.00', '-1.00', 'bad', '1.001']) await unchanged(() => person.run('enquiry.cost', { enquiryId: corrected.id, version: corrected.version, amount }, { error: amount === '0.00' ? 'INPUT' : 'MONEY' }))
      await unchanged(() => person.run('enquiry.cost', { enquiryId: corrected.id, version: first.version, amount: '12.00' }, { error: 'STALE' }))
    }
    await h.command('role.set', { operatorId: b.office.id, role: 'dispatcher' })
    const revoked = await receive('angi', 'synthetic-glove-book015-revoked')
    assert.equal(revoked.leadCost, undefined)
    state = await h.state()
    const denied = state.ruleRuns.find(r => r.ruleId === angiRule.id && r.trigger.subjectId === revoked.id)
    assert.equal(denied.outcome, 'not allowed')
    assert.match(denied.detail, /cannot enquiry.cost/)
    assert.equal(state.enquiries.find(e => e.id === angi.id).leadCost.amount, '42.00', 'later commands never reapply the creation rule to an older request')
    await assertTrail(h, ['enquiry.cost', 'rule.ran'])
  })

  await scenario(t, 'BOOK-015 point 2: each source retains its approved text and receipt-based deadline with honest early and late desk records', async t => {
    const { h, b, connect, receive } = await leadProof(t)
    const settings = [['thumbtack', 5, 'Thumbtack: we received your repair request.'], ['angi', 15, 'Angi: the office will review your request.'], ['google', 60, 'Google: thanks for your service request.'], ['yelp', 90, 'Yelp: we will be in touch about your repair.'], ['reserve-google', 1440, 'Reserve: the desk will review your requested time.']]
    const rows = []
    for (const [provider, minutes, text] of settings) {
      await connect(provider, { respondWithinMinutes: minutes, acknowledgment: text })
      const e = await receive(provider, `synthetic-glove-book015-${provider}`)
      assert.deepEqual([e.acknowledgment.status, e.acknowledgment.text, e.lead.receivedAt, e.acknowledgment.dueBy], ['queued', text, proofAt, new Date(Date.parse(proofAt) + minutes * 60_000).toISOString()])
      rows.push(e)
    }
    assert.equal(h.email.sent.length, 0)
    assert.deepEqual((await h.state()).messages, [])
    await h.setTime('2026-11-09T12:04:59.000Z')
    const early = await b.office.run('enquiry.acknowledged', { enquiryId: rows[0].id, version: rows[0].version, how: 'Replied in Thumbtack' })
    await h.setTime('2026-11-09T12:15:01.000Z')
    const late = await b.dispatcher.run('enquiry.acknowledged', { enquiryId: rows[1].id, version: rows[1].version, how: 'Called the Angi customer' })
    const events = (await h.state()).events.filter(e => e.kind === 'enquiry.acknowledged')
    const earlyEvent = events.find(e => e.subjectId === early.id), lateEvent = events.find(e => e.subjectId === late.id)
    const exported = await (await h.request('/api/glove/export')).json()
    const fact = id => JSON.parse(exported.timeline.find(e => e.kind === 'enquiry.acknowledged' && e.subject_id === id).data)
    assert.deepEqual([fact(early.id).onTime, fact(late.id).onTime], [true, false])
    assert.doesNotMatch(earlyEvent.summary, /response window/)
    assert.match(lateEvent.summary, /after its response window/)
    assert.equal(early.acknowledgment.dueBy, rows[0].acknowledgment.dueBy)
    assert.equal(late.acknowledgment.dueBy, rows[1].acknowledgment.dueBy)
    assert.equal(h.email.sent.length, 0)
    await h.restart()
    const restarted = await h.state()
    for (const e of [early, late, ...rows.slice(2)]) assert.deepEqual(restarted.enquiries.find(row => row.id === e.id).acknowledgment, e.acknowledgment)
    await assertTrail(h, ['enquiry.acknowledged'])
  })

  await scenario(t, 'BOOK-015 point 3: an external-send attestation names the person and method without inventing provider delivery or deadline compliance', async t => {
    const { h, b, receive, unchanged } = await leadProof(t)
    const e = await receive('thumbtack', 'synthetic-glove-book015-attestation')
    const sent = await b.office.run('enquiry.acknowledged', { enquiryId: e.id, version: e.version, how: 'Replied in the Thumbtack conversation' })
    assert.deepEqual(sent.acknowledgment, { ...e.acknowledgment, status: 'sent', sentAt: proofAt, by: { id: b.office.id, name: b.office.name, role: 'office' }, how: 'Replied in the Thumbtack conversation' })
    const activity = (await (await h.request('/api/glove/activity')).json()).events.find(e => e.kind === 'enquiry.acknowledged')
    assert.equal(activity.actorId, b.office.id)
    assert.match(activity.summary, /Olu Office recorded the Thumbtack acknowledgment as sent outside Glove/)
    const exported = await (await h.request('/api/glove/export')).json()
    assert.equal(JSON.parse(exported.timeline.find(row => row.id === activity.id).data).onTime, true)
    assert.doesNotMatch(activity.summary, /delivered|confirmed|met .*window|within .*window/i)
    assert.deepEqual((await h.state()).messageStates, {})
    await unchanged(() => b.office.run('enquiry.acknowledged', { enquiryId: sent.id, version: sent.version, how: 'Send again' }, { error: 'ACKNOWLEDGMENT' }))
    await h.restart()
    assert.deepEqual((await h.state()).enquiries.find(row => row.id === e.id).acknowledgment, sent.acknowledgment)
    assert.equal(h.email.sent.length, 0)
    await assertTrail(h, ['enquiry.acknowledged'])
  })

  await scenario(t, 'BOOK-015 point 4: connecting a source defaults to sixty minutes, accepts both boundaries and refuses fractional or out-of-range windows unchanged', async t => {
    const { h, connect, unchanged } = await leadProof(t)
    for (const minutes of [undefined, 5, 1440]) {
      await connect('thumbtack', minutes === undefined ? {} : { respondWithinMinutes: minutes })
      assert.equal((await h.state()).business[0].leads.thumbtack.respondWithinMinutes, minutes ?? 60)
    }
    for (const minutes of [4, 1441, 7.5]) await unchanged(() => h.command('lead.connect', { provider: 'thumbtack', respondWithinMinutes: minutes }, { error: 'INPUT' }))
  })

  await scenario(t, 'BOOK-015 point 5: only an explicit current unscoped Owner can approve a Yelp email and every excluded actor queues nothing', async t => {
    const { h, b, receive, unchanged, reply } = await leadProof(t)
    await connectMail(h, 'postmark')
    const e = await receive('yelp', 'synthetic-glove-book015-authority')
    const role = await h.command('role.save', { name: 'Reply desk', permissions: ['enquiry.acknowledged'] })
    const custom = await h.person('Reply Custom', `custom:${role.id}`), scoped = await h.person('Reply Scoped Owner', 'owner')
    await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
    for (const person of [b.office, b.dispatcher, b.priyaPerson, custom, scoped]) await unchanged(() => person.run('enquiry.reply', reply(e), { error: 'FORBIDDEN' }))
    const token = await h.command('token.issue', { name: 'Lead reply integration', role: 'office' })
    const tokenState = await h.mf.dispatchFetch(`${h.origin}/api/glove/state`, { headers: { authorization: `Bearer ${token.token}` } })
    assert.equal(tokenState.status, 200)
    const attempt = async (id, expected) => {
      const response = await h.mf.dispatchFetch(`${h.origin}/api/glove/commands`, { method: 'POST', headers: { 'content-type': ['application', 'json'].join('/'), authorization: `Bearer ${token.token}` }, body: JSON.stringify({ commandId: id, type: 'enquiry.reply', payload: reply(e) }) })
      assert.deepEqual([response.status, (await response.json()).error.code], expected)
    }
    await unchanged(() => attempt('synthetic-glove-book015-token', [403, 'FORBIDDEN']))
    await h.command('token.revoke', { tokenId: token.id })
    await unchanged(() => attempt('synthetic-glove-book015-revoked-token', [401, 'AUTH']))
    await unchanged(async () => {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: 'synthetic-glove-book015-signedout', type: 'enquiry.reply', payload: reply(e) } })
      assert.deepEqual([response.status, (await response.json()).error.code], [401, 'AUTH'])
    })
    await unchanged(() => h.command('enquiry.reply', { ...reply(e), confirm: false }, { error: 'CONSENT' }))
    const thumb = await receive('thumbtack', 'synthetic-glove-book015-nonyelp')
    await unchanged(() => h.command('enquiry.reply', reply(thumb), { error: 'LEADS' }))
    const sent = await h.command('enquiry.reply', reply(e))
    assert.equal(sent.acknowledgment.status, 'emailQueued')
    assert.equal(sent.acknowledgment.by.name, 'Olivia Owner')
    assert.equal((await h.state()).messages.length, 1)
    assert.equal(h.email.sent.length, 1)
  })

  await scenario(t, 'BOOK-015 point 6: explicit email uses only the unexpired lead destination despite customer edits and refuses expiry or disconnected mail', async t => {
    const { h, receive, unchanged, reply } = await leadProof(t)
    const e = await receive('yelp', 'synthetic-glove-book015-destination')
    const customer = (await h.state()).customers.find(c => c.id === e.customerId)
    await h.command('customer.save', { id: customer.id, version: customer.version, name: customer.name, email: ['synthetic-glove-book015-edited', 'example.test'].join('@') })
    await unchanged(() => h.command('enquiry.reply', reply(e), { error: 'MAIL' }))
    await connectMail(h, 'postmark')
    const expired = await receive('yelp', 'synthetic-glove-book015-expired', { temporary_email_address_expiry: proofAt })
    await unchanged(() => h.command('enquiry.reply', reply(expired), { error: 'LEAD_REPLY' }))
    const sent = await h.command('enquiry.reply', reply(e))
    assert.deepEqual([h.email.sent[0].to, h.email.sent[0].body.TextBody], [e.lead.reply.address, e.acknowledgment.text])
    assert.equal((await h.state()).messages.find(m => m.id === sent.acknowledgment.messageId).to, e.lead.reply.address)
    await h.command('mail.connect', { provider: null })
    const fresh = await receive('yelp', 'synthetic-glove-book015-disconnected')
    await unchanged(() => h.command('enquiry.reply', reply(fresh), { error: 'MAIL' }))
  })

  await scenario(t, 'BOOK-015 point 7: one durable message precedes the provider call and success or an uncertain server failure never resends across replay, cron or Worker restart', async t => {
    const { h, receive, reply } = await leadProof(t)
    await connectMail(h, 'postmark')
    for (const status of [200, 503]) {
      const e = await receive('yelp', `synthetic-glove-book015-once-${status}`), commandId = `synthetic-glove-book015-send-${status}`
      h.email.status[e.lead.reply.address] = status
      let observed = false
      h.email.beforeRespond = async () => {
        const state = await h.state(), ack = state.enquiries.find(row => row.id === e.id).acknowledgment
        assert.equal(ack.status, 'emailQueued')
        assert.equal(state.messages.filter(m => m.subjectId === e.id).length, 1)
        assert.equal(state.messages.find(m => m.subjectId === e.id).id, ack.messageId)
        assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_commands WHERE id=?').bind(commandId).first()).n, 1)
        assert.ok(state.events.some(event => event.kind === 'email.queued' && event.commandId === commandId && event.subjectId === ack.messageId))
        observed = true
      }
      const sent = await h.command('enquiry.reply', reply(e), { commandId })
      h.email.beforeRespond = null
      assert.equal(observed, true)
      const before = h.email.sent.length
      await h.command('enquiry.reply', reply(e), { commandId })
      await h.command('enquiry.reply', reply(sent), { error: 'ACKNOWLEDGMENT' })
      for (let i = 0; i < 2; i++) await h.scheduled(proofAt)
      await h.restart()
      await h.command('enquiry.reply', reply(e), { commandId })
      await h.command('enquiry.reply', reply(sent), { error: 'ACKNOWLEDGMENT' })
      for (let i = 0; i < 2; i++) await h.scheduled(proofAt)
      const state = await h.state(), messageId = sent.acknowledgment.messageId
      assert.equal(h.email.sent.length, before)
      assert.equal(state.messages.filter(m => m.subjectId === e.id).length, 1)
      assert.equal(state.events.filter(event => event.kind === 'email.queued' && event.subjectId === messageId).length, 1)
      assert.equal(state.messageStates[messageId].status, status === 200 ? 'accepted' : 'uncertain')
      if (status === 503) assert.match(state.messageStates[messageId].text, /Outcome unknown: Postmark did not confirm it/)
    }
    assert.equal(h.email.sent.length, 2)
    await assertTrail(h, ['enquiry.replyApproved', 'email.queued', 'email.accepted', 'email.uncertain'])
  })

  await scenario(t, 'BOOK-015 point 8: authenticated delivery and bounce facts update only email provider state in the request and conversation and survive Worker restart without secrets', async t => {
    const { h, receive, reply, conversation, secrets } = await leadProof(t)
    const mail = await connectMail(h, 'postmark')
    const e = await receive('yelp', 'synthetic-glove-book015-outcomes')
    const sent = await h.command('enquiry.reply', reply(e)), messageId = sent.acknowledgment.messageId
    const message = (await h.state()).messages.find(m => m.id === messageId)
    const m = { ...message, receipt: `pm-receipt-${h.email.sent.length}` }
    const before = await h.state()
    let latest
    for (const [outcome, at] of [['delivered', '2026-11-09T12:01:00.000Z'], ['bounced', '2026-11-09T12:02:00.000Z']]) {
      const callback = mail.callback(m, outcome, at)
      const path = '/api/glove/mail/events'
      const unsigned = await h.mf.dispatchFetch(h.origin + path, { method: 'POST', headers: { 'content-type': ['application', 'json'].join('/') }, body: callback.raw })
      assert.equal(unsigned.status, 401)
      const response = await h.mf.dispatchFetch(h.origin + path, { method: 'POST', headers: { 'content-type': ['application', 'json'].join('/'), ...callback.headers }, body: callback.raw })
      assert.equal(response.status, 200, await response.clone().text())
      latest = await h.state()
      assert.deepEqual(latest.enquiries, before.enquiries, 'provider events do not rewrite the acknowledgment or deadline')
      assert.deepEqual(latest.messages, before.messages)
      assert.equal(latest.messageStates[messageId].status, outcome)
      assert.match(latest.messageStates[messageId].text, outcome === 'delivered' ? /mail server \(reported by Postmark\)/ : /Bounced: .*reported by Postmark/)
      const entry = (await conversation(e)).entries.find(entry => entry.id === `email:${messageId}`)
      assert.deepEqual([entry.kind, entry.direction, entry.author], ['Yelp acknowledgment emailed', 'outbound', 'Olivia Owner'])
      assert.equal(entry.delivery, latest.messageStates[messageId].text)
      assert.doesNotMatch(entry.delivery, /Yelp.*(?:received|delivered)|met .*window|within .*window/i)
      const conversationBefore = await conversation(e)
      await h.restart()
      assert.deepEqual((await h.state()).messageStates[messageId], latest.messageStates[messageId])
      assert.deepEqual(await conversation(e), conversationBefore)
      assert.equal(h.email.sent.length, 1)
    }
    const { activity, exported } = await assertTrail(h, ['enquiry.replyApproved', 'email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
    assert.deepEqual(exported.enquiries.find(row => row.id === e.id).acknowledgment, sent.acknowledgment)
    assert.ok(activity.filter(event => ['email.delivered', 'email.bounced'].includes(event.kind)).every(event => event.actorRole === 'provider'))
    for (const secret of [...secrets, mail.secret, 'synthetic-glove-book015-key']) {
      for (const document of [latest, activity, exported]) assert.ok(!JSON.stringify(document).includes(secret), 'no source password or provider key in public records')
      for (const table of ['glove_records', 'glove_events', 'glove_commands']) assert.ok(!JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results).includes(secret), 'no credential in durable business records')
    }
  })

  await scenario(t, 'BOOK-016 point 1: overdue acknowledgments remain queued through rules, scheduled reads, replay and Worker restart until a person acts', async t => {
    const at = '2026-11-09T12:00:00.000Z', overdue = '2026-11-09T14:00:00.000Z'
    const h = await installation({ at })
    t.after(() => h.close())
    const b = await business(h)
    const owner = (await h.state()).actor
    const customRole = await h.command('role.save', { name: 'Acknowledgment desk', permissions: ['enquiry.acknowledged'] })
    const custom = await h.person('Acknowledgment Custom', `custom:${customRole.id}`)
    const scopedOwner = await h.person('Acknowledgment Scoped Owner', 'owner')
    await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: 'main' })
    const token = await h.command('token.issue', { name: 'Acknowledgment integration', role: 'office' })
    await connectMail(h, 'postmark')
    const emailBefore = h.email.sent.length
    const connections = {}
    for (const provider of ['thumbtack', 'angi', 'yelp', 'reserve-google']) {
      connections[provider] = await h.command('lead.connect', { provider, ...(provider === 'yelp' ? { apiKey: 'synthetic-glove-book016-1' } : {}) })
    }
    await h.command('lead.connect', { provider: 'google', customerId: '1234567890', developerToken: 'synthetic-glove-book016-2', clientId: 'synthetic-glove-book016-3', clientSecret: 'synthetic-glove-book016-4', refreshToken: 'synthetic-glove-book016-5' })
    const notify = await h.command('rule.save', { name: 'BOOK-016 internal acknowledgment notice', trigger: 'enquiry.created', action: { kind: 'notify', to: 'office', message: 'A person must review this lead.' } })
    const cost = await h.command('rule.save', { name: 'BOOK-016 internal lead cost', trigger: 'enquiry.created', action: { kind: 'leadCost', amount: '19.25' } })
    const post = (provider, body) => h.mf.dispatchFetch(`${h.origin}/api/glove/leads/${provider}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`glove:${connections[provider].password}`).toString('base64')}` }, body: JSON.stringify(body) })
    // Keep the existing recorded provider formats, with times fixed at the runtime boundary.
    const thumbtack = recorded.thumbtack('synthetic-glove-book016-6')
    thumbtack.data.createTimestamp = at
    const angi = { ...recorded.angi(), createDate: at }
    const yelpId = 'synthetic-glove-book016-7', maskedAddress = ['synthetic-glove-book016-relay', 'example.test'].join('@')
    h.leads.yelp.set(yelpId, { ...recorded.yelpLead(yelpId), time_created: at, last_event_time: at, temporary_email_address: maskedAddress, temporary_email_address_expiry: '2026-11-16T12:00:00.000Z' })
    const yelp = recorded.yelpNotice(yelpId)
    yelp.time = at
    yelp.data.updates[0].interaction_time = at
    const reserve = recorded.reserveGoogle('synthetic-glove-book016-8')
    reserve.slot.start_sec = String(Date.parse('2026-11-10T12:00:00.000Z') / 1000)
    for (const [provider, payload] of [['thumbtack', thumbtack], ['angi', angi], ['yelp', yelp], ['reserve-google', reserve]]) {
      const response = await post(provider, payload)
      assert.equal(response.status, 200, await response.clone().text())
    }
    const google = id => {
      const row = recorded.google(id)
      row.localServicesLead.creationDateTime = '2026-11-09 12:00:00'
      return row
    }
    h.leads.google.push(google('synthetic-glove-book016-9'))
    const pullId = 'synthetic-glove-book016-pull'
    assert.equal((await b.dispatcher.run('lead.pull', { provider: 'google' }, { commandId: pullId })).landed.length, 1)
    h.leads.google.push(google('synthetic-glove-book016-10'))
    await h.scheduled(at)
    const initial = await h.state(), leads = initial.enquiries.filter(e => e.lead)
    assert.deepEqual(leads.map(e => e.source).sort(), ['angi', 'google', 'google', 'reserve-google', 'thumbtack', 'yelp'])
    const queued = new Map(leads.map(e => [e.id, e.acknowledgment]))
    const officeNotices = (await b.office.state()).notices
    for (const lead of leads) {
      assert.equal(lead.acknowledgment.status, 'queued')
      assert.equal(lead.acknowledgment.dueBy, '2026-11-09T13:00:00.000Z')
      const noticeRun = initial.ruleRuns.find(r => r.ruleId === notify.id && r.trigger.subjectId === lead.id)
      assert.equal(noticeRun?.outcome, 'done')
      assert.equal(noticeRun.createdBy.id, owner.id)
      assert.ok(officeNotices.some(n => n.id === noticeRun.noticeId && n.subjectId === lead.id && n.to.includes('office')))
      const costRun = initial.ruleRuns.find(r => r.ruleId === cost.id && r.trigger.subjectId === lead.id)
      assert.equal(costRun?.outcome, lead.source === 'thumbtack' ? 'refused' : 'done')
      assert.equal(costRun.createdBy.id, owner.id)
      assert.equal(lead.leadCost.amount, lead.source === 'thumbtack' ? '35.50' : '19.25')
    }
    const noAutomaticSend = async () => {
      const state = await h.state()
      assert.equal(h.email.sent.length, emailBefore, 'BOOK-016: no provider email request')
      assert.deepEqual(state.messages, [], 'BOOK-016: no message row')
      assert.deepEqual(state.events.filter(e => e.kind.startsWith('email.')), [], 'BOOK-016: no email fact')
      for (const [id, acknowledgment] of queued) assert.deepEqual(state.enquiries.find(e => e.id === id).acknowledgment, acknowledgment, 'BOOK-016: queued state and original deadline survive')
    }
    await noAutomaticSend()
    t.diagnostic('BOOK-016: overdue clock, repeated cron, replay and actual Worker restart')
    await h.setTime(overdue)
    for (let i = 0; i < 2; i++) { await h.scheduled(overdue); await noAutomaticSend() }
    await b.dispatcher.run('lead.pull', { provider: 'google' }, { commandId: pullId })
    for (const [provider, payload] of [['thumbtack', thumbtack], ['angi', angi], ['yelp', yelp], ['reserve-google', reserve]]) assert.equal((await post(provider, payload)).status, 200)
    await noAutomaticSend()
    await h.restart()
    await noAutomaticSend()
    await h.scheduled(overdue)
    await b.dispatcher.run('lead.pull', { provider: 'google' }, { commandId: pullId })
    assert.equal((await h.state()).enquiries.length, leads.length, 'BOOK-016: source and command replay create no additional request')
    await noAutomaticSend()

    t.diagnostic('BOOK-016: every excluded actor is refused without queuing')
    const yelpRequest = leads.find(e => e.source === 'yelp')
    const payload = { enquiryId: yelpRequest.id, version: yelpRequest.version, confirm: true }
    for (const person of [b.office, b.dispatcher, b.agent, b.priyaPerson, custom, scopedOwner]) {
      await person.run('enquiry.reply', payload, { error: 'FORBIDDEN' })
      await noAutomaticSend()
    }
    const tokenReply = async commandId => {
      const response = await h.mf.dispatchFetch(`${h.origin}/api/glove/commands`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token.token}` }, body: JSON.stringify({ commandId, type: 'enquiry.reply', payload }) })
      return [response.status, (await response.json()).error.code]
    }
    assert.deepEqual(await tokenReply('synthetic-glove-book016-token'), [403, 'FORBIDDEN'])
    await noAutomaticSend()
    await h.command('token.revoke', { tokenId: token.id })
    assert.deepEqual(await tokenReply('synthetic-glove-book016-revoked'), [401, 'AUTH'])
    await noAutomaticSend()
    await h.command('enquiry.reply', { ...payload, confirm: false }, { error: 'CONSENT' })
    await noAutomaticSend()

    t.diagnostic('BOOK-016: desk attestation sends nothing and the explicit Owner command commits before one masked-address send')
    const thumb = leads.find(e => e.source === 'thumbtack')
    const attestationId = 'synthetic-glove-book016-attestation'
    const attestationPayload = { enquiryId: thumb.id, version: thumb.version, how: 'Replied in Thumbtack outside Glove' }
    const attested = await b.office.run('enquiry.acknowledged', attestationPayload, { commandId: attestationId })
    assert.deepEqual(attested.acknowledgment, { ...queued.get(thumb.id), status: 'sent', sentAt: overdue, by: { id: b.office.id, name: b.office.name, role: 'office' }, how: attestationPayload.how })
    queued.set(thumb.id, attested.acknowledgment)
    await b.office.run('enquiry.acknowledged', attestationPayload, { commandId: attestationId })
    await noAutomaticSend()
    const customer = (await h.state()).customers.find(c => c.id === yelpRequest.customerId)
    await h.command('customer.save', { id: customer.id, version: customer.version, name: customer.name, email: ['synthetic-glove-book016-changed', 'example.test'].join('@') })
    const replyId = 'synthetic-glove-book016-reply'
    let committedBeforeSend = false
    h.email.beforeRespond = async () => {
      const committed = await h.state(), request = committed.enquiries.find(e => e.id === yelpRequest.id)
      assert.equal(request.acknowledgment.status, 'emailQueued')
      assert.equal(committed.messages.length, 1)
      assert.equal(committed.messages[0].id, request.acknowledgment.messageId)
      assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_commands WHERE id=?').bind(replyId).first()).n, 1, 'BOOK-016: command is durable before the provider answers')
      assert.ok(committed.events.some(e => e.kind === 'email.queued' && e.commandId === replyId))
      committedBeforeSend = true
    }
    const reply = await h.command('enquiry.reply', payload, { commandId: replyId })
    h.email.beforeRespond = null
    assert.equal(committedBeforeSend, true)
    assert.equal(h.email.sent.length, emailBefore + 1)
    assert.deepEqual([h.email.sent.at(-1).to, h.email.sent.at(-1).body.TextBody], [maskedAddress, yelpRequest.acknowledgment.text])
    assert.equal(reply.acknowledgment.dueBy, queued.get(yelpRequest.id).dueBy)
    assert.deepEqual(reply.acknowledgment.by, { id: owner.id, name: owner.name, role: 'owner' })
    queued.set(yelpRequest.id, reply.acknowledgment)
    await h.command('enquiry.reply', payload, { commandId: replyId })
    await h.command('enquiry.reply', { ...payload, version: reply.version }, { error: 'ACKNOWLEDGMENT' })
    await h.restart()
    await h.command('enquiry.reply', payload, { commandId: replyId })
    await b.office.run('enquiry.acknowledged', attestationPayload, { commandId: attestationId })
    await h.setTime('2026-11-09T15:00:00.000Z')
    for (let i = 0; i < 2; i++) await h.scheduled('2026-11-09T15:00:00.000Z')
    const final = await h.state()
    assert.equal(h.email.sent.length, emailBefore + 1, 'BOOK-016: replay, restart and later passes never resend')
    assert.deepEqual(final.messages.map(m => [m.id, m.kind, m.subjectId, m.to, m.by.id]), [[reply.acknowledgment.messageId, 'leadReply', yelpRequest.id, maskedAddress, owner.id]])
    assert.deepEqual(final.events.filter(e => e.kind.startsWith('email.')).map(e => [e.kind, e.subjectId]).sort(), [['email.accepted', reply.acknowledgment.messageId], ['email.queued', reply.acknowledgment.messageId]])
    for (const [id, acknowledgment] of queued) assert.deepEqual(final.enquiries.find(e => e.id === id).acknowledgment, acknowledgment)
    assert.equal(final.messageStates[reply.acknowledgment.messageId].status, 'accepted')
    const activity = []
    let before = null
    do {
      const response = await h.request(`/api/glove/activity${before ? `?before=${before}` : ''}`)
      assert.equal(response.status, 200)
      const page = await response.json()
      activity.push(...page.events)
      before = page.next
    } while (before)
    const exported = await (await h.request('/api/glove/export')).json()
    for (const [id, acknowledgment] of queued) assert.deepEqual(exported.enquiries.find(e => e.id === id).acknowledgment, acknowledgment)
    for (const [id, kind, person, commandId] of [[thumb.id, 'enquiry.acknowledged', b.office, attestationId], [yelpRequest.id, 'enquiry.replyApproved', owner, replyId]]) {
      const events = activity.filter(e => e.subjectId === id && e.kind === kind)
      assert.equal(events.length, 1)
      assert.deepEqual([events[0].actorId, events[0].actorName, events[0].commandId], [person.id, person.name, commandId])
      assert.ok(activity.some(e => e.commandId === commandId && e.actorId === person.id && e.recordChanges.some(r => r.kind === 'enquiries' && r.id === id && r.fields.includes('acknowledgment'))))
      const retained = exported.timeline.filter(e => e.subject_id === id && e.kind === kind)
      assert.equal(retained.length, 1)
      assert.deepEqual([retained[0].actor_id, retained[0].actor_name, retained[0].command_id], [person.id, person.name, commandId])
    }
  })

  await scenario(t, 'BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 a consented website request matches a customer, keeps two private originals, notifies the office and follows customer erasure', async t => {
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
  await scenario(t, 'BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 failed verification, consent, origins and ambiguous matching persist no request; owner disable fences an in-flight submission', async t => {
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
  await scenario(t, 'BOOK-001, BOOK-007, BOOK-008, BOOK-009, BOOK-010 only an unscoped owner enables provider-bound photo consent; model copies strip metadata and withdrawal excludes later calls', async t => {
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

// Photo sharing is independent of ordinary office-contact consent.
import { requestPhotoFixtures, sentinel as photoMetadata } from '../fixtures/request-photos.mjs'
