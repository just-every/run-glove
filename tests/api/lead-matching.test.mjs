import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'
import { recorded } from '../fixtures/leads.mjs'

const post = (h, provider, body, password) => h.request(`/api/glove/leads/${provider}`, {
  method: 'POST', as: '', body,
  headers: { authorization: `Basic ${Buffer.from(`glove:${password}`).toString('base64')}` },
})
const mailbox = name => [name, 'example.test'].join('@')

test('BOOK-014 leads match exactly one live customer and retain source, sites and duplicate review across replay and restart', async t => {
  await scenario(t, 'A ZIP-only Yelp lead never invents a service address', async t => {
    const h = await installation()
    t.after(() => h.close())
    await h.command('business.save', { name: 'Synthetic intake business', timezone: 'America/Chicago' })
    const connection = await h.command('lead.connect', { provider: 'yelp', apiKey: 'synthetic-glove-401' })
    h.leads.yelp.set('synthetic-glove-402', recorded.yelpLead('synthetic-glove-402'))
    assert.equal((await post(h, 'yelp', recorded.yelpNotice('synthetic-glove-402'), connection.password)).status, 200)
    const s = await h.state()
    assert.equal(s.enquiries.length, 1)
    assert.equal(s.enquiries[0].siteId ?? null, null, 'a postal code alone is not a service address')
    assert.deepEqual(s.sites, [], 'ZIP-only intake creates no site')
  })

  await scenario(t, 'All five providers use unambiguous live identity and preserve the decision through every read door', async t => {
    const h = await installation()
    t.after(() => h.close())
    await h.command('business.save', { name: 'Synthetic intake business', timezone: 'America/Chicago' })
    const desk = await h.person('Synthetic Dispatcher', 'dispatcher')
    const viewer = await h.person('Synthetic Viewer', 'viewer')
    const keys = ['synthetic-glove-411', 'synthetic-glove-412', 'synthetic-glove-413', 'synthetic-glove-414', 'synthetic-glove-415']
    const connections = {}
    await desk.run('lead.connect', { provider: 'angi' }, { error: 'FORBIDDEN' })
    for (const provider of ['angi', 'thumbtack', 'yelp', 'reserve-google']) {
      connections[provider] = await h.command('lead.connect', { provider, ...(provider === 'yelp' ? { apiKey: keys[0] } : {}) })
    }
    await h.command('lead.connect', { provider: 'google', customerId: '1234567890', developerToken: keys[1], clientId: keys[2], clientSecret: keys[3], refreshToken: keys[4] })
    const create = (name, values) => h.command('customer.save', { name, ...values })
    // Independently enumerated identities: no expected match is derived by running the matching algorithm.
    const plus = await create('Plus phone', { phone: '+1 (312) 555-0101' })
    const punctuation = await create('Punctuation phone', { phone: '312.555.0102' })
    const spaces = await create('Spaces phone', { phone: '312 555 0103' })
    const email = await create('Case email', { email: mailbox('Matching.Case') })
    const short = await create('Short phone', { phone: '5550105' })
    const conflictPhone = await create('Conflict phone', { phone: '3125550106' })
    const conflictEmail = await create('Conflict email', { email: mailbox('conflict') })
    const sharedOne = await create('Shared one', { phone: '+1 312 555 0108' })
    const sharedTwo = await create('Shared two', { phone: '(312) 555-0108' })
    const erased = await create('Erased identity', { phone: '3125550109', email: mailbox('erased') })
    const preview = await h.command('privacy.preview', { customerId: erased.id, version: erased.version })
    await h.command('privacy.erase', { customerId: erased.id, version: erased.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
    const survivor = await create('Merge survivor', { phone: '3125550111', email: mailbox('survivor'), billingAddress: 'Shared merge address' })
    const away = await create('Merged identity', { phone: '3125550110', email: mailbox('away'), billingAddress: 'Shared merge address' })
    await h.command('customer.merge', { survivorId: survivor.id, mergedIds: [away.id], versions: { [survivor.id]: survivor.version, [away.id]: away.version }, values: { email: away.id } })
    const resemblingAddress = await create('Address resemblance', { billingAddress: '77 Sample Rd. Chicago IL 60614' })
    const initial = await h.state()
    assert.ok(initial.customers.find(c => c.id === erased.id).erasedAt)
    assert.equal(initial.customers.find(c => c.id === away.id).mergedInto, survivor.id)
    assert.equal(initial.customers.find(c => c.id === survivor.id).email, mailbox('away'))
    const originalIds = initial.customers.map(c => c.id)
    const leadCases = [
      { id: 'synthetic-glove-501', provider: 'thumbtack', phone: '+1 312-555-0101', customer: plus, address: '2300 N Lincoln Park W, Unit 4, Chicago, IL 60614', zip: '60614' },
      { id: 'synthetic-glove-502', provider: 'angi', phone: '(312) 555-0102', customer: punctuation, address: '55 Lake Rd, Chicago, IL 60601', zip: '60601' },
      { id: 'synthetic-glove-503', provider: 'reserve-google', phone: '+1 312 555 0103', customer: spaces },
      { id: 'synthetic-glove-504', provider: 'angi', phone: '', email: mailbox('MATCHING.case'), customer: email, address: '55 Lake Rd, Chicago, IL 60601', zip: '60601' },
      { id: 'synthetic-glove-505', provider: 'thumbtack', phone: '5550105', duplicates: [[short.id, ['phone']]], address: '25 Short St, Unit 4, Chicago, IL 60614', zip: '60614' },
      { id: 'synthetic-glove-506', provider: 'angi', phone: '+1 312 555 0106', email: mailbox('CONFLICT'), duplicates: [[conflictPhone.id, ['phone']], [conflictEmail.id, ['email']]], address: '56 Conflict Rd, Chicago, IL 60601', zip: '60601' },
      { id: 'synthetic-glove-507', provider: 'google', phone: '312.555.0108', duplicates: [[sharedOne.id, ['phone']], [sharedTwo.id, ['phone']]] },
      { id: 'synthetic-glove-508', provider: 'reserve-google', phone: '+1 312 555 0109', email: mailbox('erased') },
      { id: 'synthetic-glove-509', provider: 'google', phone: '3125550110', scheduled: true },
      { id: 'synthetic-glove-510', provider: 'google', phone: '', email: mailbox('AWAY'), customer: survivor, scheduled: true },
      { id: 'synthetic-glove-511', provider: 'thumbtack', phone: '3125550112', duplicates: [[resemblingAddress.id, ['address']]], address: '77 Sample Rd, Chicago, IL 60614', zip: '60614' },
      { id: 'synthetic-glove-512', provider: 'yelp', phone: '', email: mailbox('yelp-only-zip') },
      { id: 'synthetic-glove-513', provider: 'yelp', phone: '', email: mailbox('matching.CASE'), customer: email },
    ]
    const payload = c => {
      if (c.provider === 'angi') return { ...recorded.angi(), leadOid: c.id, primaryPhone: c.phone, email: c.email ?? '', address: c.id === 'synthetic-glove-506' ? '56 Conflict Rd' : '55 Lake Rd', city: 'Chicago', stateProvince: 'IL', postalCode: '60601' }
      if (c.provider === 'thumbtack') {
        const body = recorded.thumbtack(c.id)
        body.data.customer.phone = c.phone
        if (c.id === 'synthetic-glove-505') body.data.request.location.address1 = '25 Short St'
        if (c.id === 'synthetic-glove-511') body.data.request.location = { address1: '77 Sample Rd', city: 'Chicago', state: 'IL', zipCode: '60614' }
        return body
      }
      if (c.provider === 'reserve-google') {
        const body = recorded.reserveGoogle(c.id)
        body.user_information.telephone = c.phone
        body.user_information.email = c.email ?? mailbox(c.id)
        return body
      }
      if (c.provider === 'yelp') return { ...recorded.yelpLead(c.id), phone_number: c.phone, temporary_email_address: c.email }
      const body = recorded.google(c.id)
      body.localServicesLead.contactDetails = { consumerName: c.id, phoneNumber: c.phone, email: c.email ?? '' }
      return body
    }
    // One decision per provider record, including genuinely new records reached only by cron.
    const pulls = []
    for (const c of leadCases) {
      const priorSites = (await h.state()).sites
      if (c.provider === 'google') {
        h.leads.google.push(payload(c))
        if (c.scheduled) await h.scheduled(Date.now())
        else {
          const commandId = 'synthetic-glove-pull-' + c.id
          const result = await desk.run('lead.pull', { provider: 'google' }, { commandId })
          assert.equal(result.landed.length, 1)
          pulls.push({ commandId, result })
        }
      } else {
        const body = c.provider === 'yelp' ? recorded.yelpNotice(c.id) : payload(c)
        if (c.provider === 'yelp') h.leads.yelp.set(c.id, payload(c))
        const before = await h.state()
        assert.equal((await post(h, c.provider, body, 'synthetic-glove-416')).status, 401)
        assert.deepEqual(await h.state(), before, 'an unauthenticated lead cannot change identity or requests')
        assert.equal((await post(h, c.provider, body, connections[c.provider].password)).status, 200)
        const accepted = await h.state()
        assert.equal((await post(h, c.provider, body, connections[c.provider].password)).status, 200)
        assert.deepEqual(await h.state(), accepted, 'a retried provider post writes nothing')
        c.body = body
      }
      const s = await h.state()
      const requests = s.enquiries.filter(e => e.source === c.provider && e.lead?.providerLeadId === c.id)
      assert.equal(requests.length, 1, c.id)
      const request = requests[0]
      assert.deepEqual([request.source, request.lead.provider, request.lead.providerLeadId, request.lead.matched], [c.provider, c.provider, c.id, c.customer ? 'existing' : 'new'])
      if (c.customer) assert.equal(request.customerId, c.customer.id, c.id)
      else {
        assert.ok(!originalIds.includes(request.customerId), c.id + ' must create a new customer')
        assert.ok(!leadCases.filter(other => other !== c && !other.customer).some(other => other.customerId === request.customerId), 'distinct new identities stay separate')
      }
      c.customerId = request.customerId
      const customer = s.customers.find(x => x.id === request.customerId)
      assert.ok(customer && !customer.erasedAt && !customer.mergedInto)
      if (!c.customer) {
        assert.equal(customer.phone ?? '', c.phone)
        const expectedEmail = c.email ?? (c.provider === 'reserve-google' ? mailbox(c.id) : '')
        assert.equal(customer.email ?? '', expectedEmail)
        const response = await h.request(`/api/glove/customers/${customer.id}/duplicates`)
        assert.equal(response.status, 200)
        const review = await response.json()
        const flags = review.candidates.map(d => [d.id, d.matches.toSorted()]).sort(([a], [b]) => a.localeCompare(b))
        assert.deepEqual(flags, (c.duplicates ?? []).map(([id, matches]) => [id, matches.toSorted()]).sort(([a], [b]) => a.localeCompare(b)), c.id + ' exact resemblance flags')
      }
      if (c.address) {
        const site = s.sites.find(x => x.id === request.siteId)
        assert.ok(site)
        assert.deepEqual([site.customerId, site.address, site.zip], [request.customerId, c.address, c.zip])
      } else {
        assert.equal(request.siteId, null)
        assert.deepEqual(s.sites, priorSites, c.id + ' supplies no service address')
      }
      c.requestId = request.id
    }
    const settled = await h.state()
    assert.equal(settled.enquiries.length, 13)
    assert.equal(settled.customers.length, initial.customers.length + 7)
    assert.equal(settled.sites.length, 6)
    assert.equal(h.email.sent.length, 0, 'intake sends no reply')
    // Replayed desk commands return their saved result, while fresh reads and cron find no new request.
    const repeat = async () => {
      for (const c of leadCases.filter(c => c.body)) assert.equal((await post(h, c.provider, c.body, connections[c.provider].password)).status, 200)
      for (const p of pulls) assert.deepEqual(await desk.run('lead.pull', { provider: 'google' }, { commandId: p.commandId }), p.result)
      assert.deepEqual((await desk.run('lead.pull', { provider: 'google' })).landed, [])
      await h.scheduled(Date.now())
    }
    await repeat()
    const beforeRestart = await h.state()
    await h.restart()
    assert.deepEqual(await h.state(), beforeRestart, 'the actual Worker restart preserves all matching decisions')
    await repeat()
    const afterRestart = await h.state()
    for (const kind of ['customers', 'sites', 'enquiries']) assert.deepEqual(afterRestart[kind], settled[kind], kind + ' stays identical after every replay and restart')
    // A replaced door credential cannot land another lead, even after restart.
    const oldPassword = connections.angi.password
    const refreshed = await h.command('lead.connect', { provider: 'angi' })
    const refusedState = await h.state()
    assert.equal((await post(h, 'angi', { ...recorded.angi(), leadOid: 'synthetic-glove-514' }, oldPassword)).status, 401)
    assert.deepEqual(await h.state(), refusedState)
    await viewer.run('lead.pull', { provider: 'google' }, { error: 'FORBIDDEN' })
    const { activity, exported } = await assertTrail(h, ['lead.received'])
    for (const c of leadCases) {
      const events = activity.filter(e => e.kind === 'lead.received' && e.subjectId === c.requestId)
      assert.equal(events.length, 1)
      const e = events[0]
      assert.equal(e.subjectKind, 'enquiry')
      assert.ok(e.summary.includes(c.customer ? 'matched to ' : 'from new customer '))
      assert.deepEqual([e.actorId, e.actorRole], c.provider === 'google' && !c.scheduled ? [desk.id, 'dispatcher'] : ['lead:' + c.provider, 'provider'])
      assert.ok(e.actorName && e.at && e.commandId && e.summary)
      const fact = exported.timeline.find(x => x.id === e.id)
      assert.ok(fact)
      assert.deepEqual([fact.actor_id, fact.actor_name, fact.actor_role, fact.at, fact.command_id, fact.subject_id, fact.summary], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId, c.requestId, e.summary])
      const detail = JSON.parse(fact.data)
      assert.deepEqual([detail.provider, detail.providerLeadId, detail.matched], [c.provider, c.id, c.customer ? 'existing' : 'new'])
      assert.deepEqual(exported.enquiries.find(x => x.id === c.requestId), afterRestart.enquiries.find(x => x.id === c.requestId))
    }
    const publicFacts = JSON.stringify({ state: await h.state(), activity, exported })
    for (const secret of [...keys, ...Object.values(connections).map(x => x.password), refreshed.password]) assert.ok(!publicFacts.includes(secret), 'credentials never enter business facts')
    assert.deepEqual(h.leads.calls.filter(c => c.api === 'yelp').map(c => c.authorization).filter((value, i, all) => all.indexOf(value) === i), ['Bearer ' + keys[0]])
    assert.ok(h.leads.calls.some(c => c.api === 'google-token' && c.form.refresh_token === keys[4]))
    assert.ok(h.leads.calls.some(c => c.api === 'google-ads' && c.developerToken === keys[1]))
    // A replay of an erased customer's already accepted provider record cannot recreate the person or site.
    const erasedLead = leadCases.find(c => c.id === 'synthetic-glove-512')
    const subject = (await h.state()).customers.find(c => c.id === erasedLead.customerId)
    const erasePreview = await h.command('privacy.preview', { customerId: subject.id, version: subject.version })
    await h.command('privacy.erase', { customerId: subject.id, version: subject.version, confirm: 'ERASE', fingerprint: erasePreview.fingerprint })
    const tombstone = await h.state()
    assert.ok(tombstone.customers.find(c => c.id === subject.id).erasedAt)
    await h.restart()
    assert.equal((await post(h, 'yelp', erasedLead.body, connections.yelp.password)).status, 200)
    assert.deepEqual(await h.state(), tombstone, 'replayed intake after erasure and restart resurrects nothing')
  })
  // One Reserve intake journey shares its durable installation across all eight points.
  const receipt = '2030-03-10T12:00:00.000Z'
  const h = await installation({ at: receipt })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Reserve business', timezone: 'America/Chicago' })
  // Fix only the fixture clock; the recorded Booking factory itself remains unchanged.
  const booking = id => {
    const clock = t.mock.method(Date, 'now', () => Date.parse('2030-03-14T12:00:00.000Z'))
    try { return recorded.reserveGoogle(id) } finally { clock.mock.restore() }
  }
  const first = booking('synthetic-glove-601')
  let connection, original
  const received = async () => (await h.state()).enquiries.filter(e => e.source === 'reserve-google')
  const noEffects = s => [s.jobs, s.visits, s.messages, s.pushes]
  const expectedBooking = {
    merchantId: 'synthetic-glove-21', serviceId: 'synthetic-glove-22',
    startAt: '2030-03-15T12:00:00.000Z', durationSeconds: 3600, sourceStatus: 'CONFIRMED',
  }

  await scenario(t, 'BOOK-017 point 1: the authenticated Booking door admits one request and refuses wrong, absent and disconnected credentials without writes', async () => {
    const disconnected = await h.state()
    assert.equal((await post(h, 'reserve-google', first, 'synthetic-glove-602')).status, 404)
    assert.deepEqual(await h.state(), disconnected)
    connection = await h.command('lead.connect', { provider: 'reserve-google', respondWithinMinutes: 37 })
    assert.deepEqual(connection.callback, { url: h.origin + '/api/glove/leads/reserve-google', user: 'glove' })
    assert.ok(connection.password)
    const before = await h.state()
    const failures = [
      await post(h, 'reserve-google', first, 'synthetic-glove-603'),
      await h.request('/api/glove/leads/reserve-google', { method: 'POST', as: '', body: first, headers: { authorization: `Basic ${Buffer.from(`someone:${connection.password}`).toString('base64')}` } }),
      await h.request('/api/glove/leads/reserve-google', { method: 'POST', as: '', body: first }),
    ]
    // A valid credential cannot substitute a notification or incomplete record for a Booking.
    for (const body of [{}, { ...first, slot: null }, { ...first, user_information: null }]) {
      failures.push(await post(h, 'reserve-google', body, connection.password))
    }
    for (const response of failures) {
      assert.equal(response.status, 401)
      assert.deepEqual(await response.json(), { ok: false, error: { code: 'LEAD', message: 'Not accepted: the credentials or the lead did not match.' } })
    }
    assert.deepEqual(await h.state(), before)
    const outbound = h.outbound.attempts, emails = h.email.sent.length
    const response = await post(h, 'reserve-google', first, connection.password)
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true }, 'an intake receipt grants no booking-server result')
    const requests = await received()
    assert.equal(requests.length, 1)
    original = requests[0]
    assert.deepEqual([original.source, original.lead.providerLeadId, original.status], ['reserve-google', 'synthetic-glove-601', 'new'])
    const customer = (await h.state()).customers.find(c => c.id === original.customerId)
    assert.deepEqual([customer.name, customer.phone, customer.email], ['Mei Lin', '+1 312-555-0100', first.user_information.email])
    assert.deepEqual(noEffects(await h.state()), noEffects(before))
    assert.deepEqual([h.outbound.attempts, h.email.sent.length], [outbound, emails])
  })

  await scenario(t, 'BOOK-017 point 2: only a signed-in unscoped Owner issues a relay credential and intake makes no Google server or notification claim', async () => {
    const office = await h.person('Reserve Office', 'office')
    const dispatcher = await h.person('Reserve Dispatcher', 'dispatcher')
    const scopedOwner = await h.person('Reserve Scoped Owner', 'owner')
    await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: 'main' })
    const role = await h.command('role.save', { name: 'Reserve custom desk', permissions: ['enquiry.acknowledged'] })
    const custom = await h.person('Reserve Custom', `custom:${role.id}`)
    const token = await h.command('token.issue', { name: 'Reserve integration', role: 'office' })
    assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${token.token}` } })).status, 200)
    const before = await h.state()
    const payload = { provider: 'reserve-google' }
    for (const person of [office, dispatcher, scopedOwner, custom]) {
      await person.run('lead.connect', payload, { error: 'FORBIDDEN' })
      assert.deepEqual(await h.state(), before)
    }
    for (const [headers, status] of [[{}, 401], [{ authorization: `Bearer ${token.token}` }, 403]]) {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers, body: { commandId: crypto.randomUUID(), type: 'lead.connect', payload } })
      assert.equal(response.status, status)
      const result = await response.json()
      assert.equal(result.ok, false)
      assert.equal(result.result, undefined)
      assert.deepEqual(await h.state(), before)
    }
    // Only the successful Owner call in point 1 issued this credential; all refusals leave it usable.
    assert.equal((await post(h, 'reserve-google', first, connection.password)).status, 200)
    const { activity } = await assertTrail(h, ['lead.connected', 'lead.received'])
    assert.ok(!/BookingNotification|CreateBooking|booking server|live integration/i.test(JSON.stringify({ requests: await received(), activity })))
    assert.equal((await received()).length, 1)
  })

  await scenario(t, 'BOOK-017 point 3: exact source facts survive a real Worker restart without a visit, job, calendar write, reply, message or push', async () => {
    const before = await h.state(), outbound = h.outbound.attempts, emails = h.email.sent.length
    assert.deepEqual(original.lead.booking, expectedBooking)
    assert.equal(original.lead.providerTime, null)
    assert.equal(original.lead.providerLeadId, 'synthetic-glove-601')
    assert.equal(original.siteId, null)
    assert.deepEqual([before.jobs, before.visits, before.messages], [[], [], []])
    assert.equal(h.calendarSync.calls.length, 0)
    assert.equal(h.pushes.sent.length, 0)
    await h.restart()
    assert.deepEqual(await h.state(), before)
    assert.deepEqual((await received())[0], original)
    assert.deepEqual([h.outbound.attempts, h.email.sent.length, h.calendarSync.calls.length, h.pushes.sent.length], [outbound, emails, 0, 0])
    assert.equal(emails, 0)
  })

  let pending
  await scenario(t, 'BOOK-017 point 4: neither admitted status invents a lead cost from slot or user fields', async () => {
    const before = await h.state(), outbound = h.outbound.attempts, emails = h.email.sent.length
    pending = { ...booking('synthetic-glove-604'), status: 'PENDING_MERCHANT_CONFIRMATION' }
    assert.equal((await post(h, 'reserve-google', pending, connection.password)).status, 200)
    const requests = await received()
    assert.equal(requests.length, 2)
    assert.deepEqual(noEffects(await h.state()), noEffects(before))
    assert.deepEqual([h.outbound.attempts, h.email.sent.length], [outbound, emails])
    assert.deepEqual(requests.map(e => e.lead.booking.sourceStatus).sort(), ['CONFIRMED', 'PENDING_MERCHANT_CONFIRMATION'])
    for (const request of requests) {
      assert.equal(request.leadCost, undefined)
      assert.equal(request.lead.booking.durationSeconds, 3600)
      assert.equal(request.lead.booking.serviceId, 'synthetic-glove-22')
      assert.equal(request.lead.booking.merchantId, 'synthetic-glove-21')
    }
    const { activity, exported } = await assertTrail(h, ['lead.received'])
    assert.ok(!activity.some(e => e.kind === 'enquiry.cost'))
    for (const request of requests) {
      assert.equal(exported.enquiries.find(e => e.id === request.id).leadCost, undefined)
      const fact = exported.timeline.find(e => e.kind === 'lead.received' && e.subject_id === request.id)
      assert.equal(JSON.parse(fact.data).cost, null)
    }
  })

  await scenario(t, 'BOOK-017 point 5: cancellations and unsupported statuses refuse all writes and changed-slot updates retain the first record', async () => {
    const before = await h.state()
    for (const status of ['CANCELED', 'CANCELLED', 'DECLINED', 'PENDING', 'STATUS_UNSPECIFIED', '']) {
      const response = await post(h, 'reserve-google', { ...booking('synthetic-glove-605'), status }, connection.password)
      assert.equal(response.status, 401)
      assert.equal((await response.json()).error.code, 'LEAD')
      assert.deepEqual(await h.state(), before)
    }
    assert.equal((await post(h, 'reserve-google', { ...first, status: 'CANCELED' }, connection.password)).status, 401)
    const changed = { ...first, status: 'PENDING_MERCHANT_CONFIRMATION', slot: { ...first.slot, merchant_id: 'synthetic-glove-606', service_id: 'synthetic-glove-607', start_sec: String(Number(first.slot.start_sec) + 86400), duration_sec: '7200' } }
    assert.equal((await post(h, 'reserve-google', changed, connection.password)).status, 200)
    assert.deepEqual(await h.state(), before)
    assert.deepEqual((await received()).find(e => e.id === original.id), original)
  })

  await scenario(t, 'BOOK-017 point 6: retry, concurrent deliveries and restart replay land one request and one receipt fact per booking identity', async () => {
    const concurrent = booking('synthetic-glove-608')
    const contender = { ...concurrent, status: 'PENDING_MERCHANT_CONFIRMATION', slot: { ...concurrent.slot, duration_sec: '7200' } }
    const before = await h.state(), outbound = h.outbound.attempts
    assert.deepEqual(await Promise.all([concurrent, contender].map(async body => (await post(h, 'reserve-google', body, connection.password)).status)), [200, 200])
    const settled = await h.state(), request = settled.enquiries.find(e => e.lead?.providerLeadId === 'synthetic-glove-608')
    assert.equal(settled.enquiries.length, before.enquiries.length + 1)
    assert.equal(settled.enquiries.filter(e => e.lead?.providerLeadId === 'synthetic-glove-608').length, 1)
    const winningBooking = request.lead.booking.sourceStatus === 'CONFIRMED'
      ? expectedBooking
      : { ...expectedBooking, sourceStatus: 'PENDING_MERCHANT_CONFIRMATION', durationSeconds: 7200 }
    assert.deepEqual(request.lead.booking, winningBooking, 'one complete source record wins; concurrent records never mix fields')
    assert.equal(settled.events.filter(e => e.kind === 'lead.received' && e.subjectId === request.id).length, 1)
    assert.deepEqual(noEffects(settled), noEffects(before))
    assert.equal((await post(h, 'reserve-google', concurrent, connection.password)).status, 200)
    assert.equal((await post(h, 'reserve-google', contender, connection.password)).status, 200)
    assert.deepEqual(await h.state(), settled)
    await h.restart()
    for (const body of [concurrent, contender, { ...concurrent, slot: { ...concurrent.slot, duration_sec: '9000' } }, first]) assert.equal((await post(h, 'reserve-google', body, connection.password)).status, 200)
    assert.deepEqual(await h.state(), settled)
    assert.equal(h.outbound.attempts, outbound)
    const { activity, exported } = await assertTrail(h, ['lead.received'])
    for (const lead of await received()) {
      assert.equal(activity.filter(e => e.kind === 'lead.received' && e.subjectId === lead.id).length, 1)
      assert.equal(exported.timeline.filter(e => e.kind === 'lead.received' && e.subject_id === lead.id).length, 1)
    }
  })

  await scenario(t, 'BOOK-017 point 7: a slot five days ahead keeps creation and acknowledgment deadline at Glove receipt', async () => {
    const requests = await received()
    assert.equal(requests.length, 3)
    for (const request of requests) {
      assert.equal(request.createdAt, receipt)
      assert.equal(request.lead.receivedAt, receipt)
      assert.equal(request.lead.providerTime, null)
      assert.equal(request.lead.booking.startAt, '2030-03-15T12:00:00.000Z')
      assert.equal(request.acknowledgment.dueBy, '2030-03-10T12:37:00.000Z')
      assert.equal(request.acknowledgment.status, 'queued')
    }
    assert.deepEqual([h.email.sent.length, h.pushes.sent.length], [0, 0])
  })

  await scenario(t, 'BOOK-017 point 8: Activity and business export attribute intake to the Reserve feed and exclude the door password', async () => {
    const { activity, exported } = await assertTrail(h, ['lead.connected', 'lead.received'])
    for (const request of await received()) {
      const fact = activity.find(e => e.kind === 'lead.received' && e.subjectId === request.id)
      assert.deepEqual([fact.actorId, fact.actorName, fact.actorRole, fact.subjectKind], ['lead:reserve-google', 'Reserve with Google lead feed', 'provider', 'enquiry'])
      assert.equal(fact.at, receipt)
      assert.ok(fact.summary.includes('Reserve with Google'))
      const kept = exported.timeline.find(e => e.id === fact.id)
      const data = JSON.parse(kept.data)
      assert.equal(data.provider, 'reserve-google')
      assert.equal(data.providerLeadId, request.lead.providerLeadId)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.subject_id, kept.command_id, kept.summary], [fact.actorId, fact.actorName, fact.actorRole, fact.at, request.id, fact.commandId, fact.summary])
      assert.deepEqual(exported.enquiries.find(e => e.id === request.id), request)
    }
    assert.ok(!JSON.stringify({ state: await h.state(), activity, exported }).includes(connection.password))
    // A replaced credential and an erased person's already accepted capture cannot reopen intake or resurrect data.
    const replacement = await h.command('lead.connect', { provider: 'reserve-google' })
    const before = await h.state()
    assert.equal((await post(h, 'reserve-google', booking('synthetic-glove-609'), connection.password)).status, 401)
    assert.deepEqual(await h.state(), before)
    const customer = before.customers.find(c => c.id === original.customerId)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    const erased = await h.state()
    assert.ok(erased.customers.find(c => c.id === customer.id).erasedAt)
    await h.restart()
    for (const body of [first, pending, booking('synthetic-glove-608')]) assert.equal((await post(h, 'reserve-google', body, replacement.password)).status, 200)
    assert.deepEqual(await h.state(), erased)
    const after = await assertTrail(h, ['lead.received'])
    for (const secret of [connection.password, replacement.password]) assert.ok(!JSON.stringify({ state: await h.state(), ...after }).includes(secret))
    await h.command('lead.connect', { provider: 'reserve-google', disconnect: true })
    const disconnected = await h.state()
    assert.equal((await post(h, 'reserve-google', booking('synthetic-glove-610'), replacement.password)).status, 404)
    assert.deepEqual(await h.state(), disconnected)
  })
})
