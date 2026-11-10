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
})
