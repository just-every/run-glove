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
