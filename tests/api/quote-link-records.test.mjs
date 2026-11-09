import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, business, assertTrail, mailEvents, postEvents } from './harness.mjs'
import { connectMail, textOf, deliveryIdOf, postmarkCallback } from '../fixtures/mail-providers.mjs'
import { documentPhoto } from '../fixtures/document-images.mjs'
import { scenario } from '../fixtures/scenario.mjs'

const at = '2030-03-12T02:00:00.000Z'
const staffBasis = 'link handed out by staff, recipient unverified'
const emailBasis = 'link sent by Glove to the address on record'
const lines = [{ description: 'Condenser service', quantity: '2', unitPrice: '100.00', tax: 'GST' }]
const fresh = async (h, b, extra = {}) => {
  const q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Restore quiet cooling', lines, ...extra })
  return h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
}
const issue = (h, q, extra = {}, options = {}) => h.command('quote.link', { quoteId: q.id, version: q.version, ...extra }, options)
const read = (h, token, headers = {}) => h.request('/api/glove/public/quote', { as: '', headers: { authorization: `Bearer ${token}`, ...headers } })
const respond = (h, token, action, extra = {}, headers = {}) => h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${token}`, ...headers }, body: { action, name: 'Mei Lin', capacity: 'Practice manager', ...extra } })
async function allActivity(h) {
  const events = []
  let cursor = ''
  do {
    const page = await h.request('/api/glove/activity' + (cursor ? `?before=${cursor}` : '')).then(r => r.json())
    events.push(...page.events)
    cursor = page.next
  } while (cursor)
  return events
}
const quote = async (h, id) => (await h.state()).quotes.find(q => q.id === id)
const exported = h => h.request('/api/glove/export').then(r => r.json())
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}` : JSON.stringify(value)
const noSecret = (value, secrets, where) => { for (const secret of secrets) assert.equal(JSON.stringify(value).includes(secret), false, `${where} excludes secrets`) }
const durable = async h => {
  const tables = ['glove_records', 'glove_events', 'glove_commands', 'glove_quote_secrets']
  return Object.fromEntries(await Promise.all(tables.map(async table => [table, (await h.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()).results])))
}

// Pause at the actual public-door commit or read guard, without changing the
// command, authority expression or SQL batch. The D1 clock is aligned with
// the fixture's Worker clock so expiry can be tested without wall-clock waits.
const boundaryPlugin = { name: 'quote-public-boundary', setup(build) {
  build.onLoad({ filter: /\/glove\/public-quote\.ts$/ }, async args => {
    let source = await readFile(args.path, 'utf8')
    const checkpoint = `if (request.headers.get('x-synthetic-glove-pause') === '1' && !paused.has(request)) { paused.add(request); await fetch('https://worker-checkpoint.example.test/qbo-complete'); }\n`
    assert.ok(source.includes('try { await commit(env.DB, c, before'))
    source = 'const paused = new WeakSet<Request>()\n' + source
    source = source.replace('try { await commit(env.DB, c, before', checkpoint + 'try { await commit(env.DB, c, before')
    source = source.replaceAll('const check = await env.DB.prepare(', checkpoint + 'const check = await env.DB.prepare(')
    return { contents: source, loader: 'ts', resolveDir: dirname(args.path) }
  })
  build.onLoad({ filter: /\/tests\/api\/worker\.ts$/ }, async args => {
    const source = await readFile(args.path, 'utf8')
    const marker = 'const headers = new Headers(request.headers)'
    assert.ok(source.includes(marker))
    return { contents: source.replace(marker, `const db = env.DB;
    env = { ...env, DB: new Proxy(db, { get(target, key) {
      if (key === 'prepare') return (sql: string) => target.prepare(sql.replaceAll("strftime('%Y-%m-%dT%H:%M:%fZ','now')", "'" + new Date().toISOString() + "'"));
      const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
    } }) };
    ${marker}`), loader: 'ts', resolveDir: dirname(args.path) }
  })
} }

test('QUOTE-012 quote-link records preserve provider truth, customer documents and live authority', async t => {
  const h = await installation({ at, captureLogs: true, workerPlugins: [boundaryPlugin] }); t.after(() => h.close())
  const b = await business(h), secrets = [], replayCases = [], basisCases = []
  let responseFixture
  const linkFor = async (q, extra = {}, options = {}) => { const l = await issue(h, q, extra, options); secrets.push(l.token); return l }

  await scenario(t, 'point 3: outside sharing and each provider send answer retain the actual mail outcome', async () => {
    // The two newer provider fakes support both HTTP status and malformed
    // successful answers; the legacy fake supplies all four send outcomes.
    for (const provider of ['sendgrid', 'postmark', 'ses', 'resend']) {
      let signer, connection
      if (['sendgrid', 'resend'].includes(provider)) {
        signer = mailEvents(provider)
        await h.command('mail.connect', { provider, apiKey: 'synthetic-glove-179', eventKey: signer.eventKey, fromEmail: ['office', 'example.test'].join('@') })
      } else connection = await connectMail(h, provider)
      const answers = provider === 'resend' ? [[200, 'accepted']] : [[provider === 'sendgrid' ? 202 : 200, 'accepted'], [400, 'rejected'], [429, 'rate_limited'], [500, 'uncertain']]
      for (const [status, outcome] of answers) {
        h.email.status[b.customer.email] = status; delete h.email.reply
        const q = await fresh(h, b), commandId = randomUUID(), payload = { quoteId: q.id, version: q.version, email: true }
        const count = h.email.sent.length, l = await linkFor(q, { email: true }, { commandId })
        assert.equal(h.email.sent.length, count + 1)
        const state = await h.state(), m = state.messages.find(m => m.id === l.emailMessageId), sent = h.email.sent.at(-1)
        assert.deepEqual([m.kind, m.subjectId, m.customerId, m.to, m.provider, m.from, m.by.name], ['quoteLink', q.id, b.customer.id, b.customer.email, provider, ['office', 'example.test'].join('@'), 'Olivia Owner'])
        assert.equal(provider === 'resend' ? sent.idempotencyKey : deliveryIdOf(sent), m.id)
        assert.equal(sent.to, b.customer.email)
        assert.ok((provider === 'resend' ? sent.body.text : textOf(sent)).includes(`/quote#token=${l.token}`))
        assert.equal(state.messageStates[m.id].status, outcome)
        const facts = (await h.request('/api/glove/activity').then(r => r.json())).events.filter(e => e.subjectId === m.id && e.actorRole === 'provider')
        assert.deepEqual(facts.map(e => e.kind), [`email.${outcome}`])
        assert.equal(JSON.parse((await exported(h)).timeline.find(e => e.id === facts[0].id).data).status, outcome)
        const expected = outcome === 'accepted' ? emailBasis : staffBasis
        assert.equal((await respond(h, l.token, 'changes', { message: `${provider} ${outcome} response` })).status, 200)
        assert.equal((await quote(h, q.id)).customerRequests[0].authenticationBasis, expected)
        replayCases.push({ q, l, commandId, payload, expected }); basisCases.push({ q, l, expected })
        if (provider === 'sendgrid' && outcome === 'uncertain') {
          // A rejected callback is a provider fact, but proves no acceptance.
          const callback = signer.signed([{ email: m.to, timestamp: Date.parse(at) / 1000, event: 'dropped', sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-rejected', rer_delivery_id: m.id }], { at: Date.parse(at) / 1000 })
          assert.equal((await postEvents(h, callback)).status, 200)
          assert.equal((await h.state()).messageStates[m.id].status, 'rejected')
          assert.equal((await respond(h, l.token, 'changes', { message: 'Rejected callback alone' })).status, 200)
          assert.equal((await quote(h, q.id)).customerRequests.at(-1).authenticationBasis, staffBasis)
        }
      }
      if (['postmark', 'ses'].includes(provider)) {
        delete h.email.status[b.customer.email]; h.email.reply = {}
        const q = await fresh(h, b), l = await linkFor(q, { email: true })
        assert.equal((await h.state()).messageStates[l.emailMessageId].status, 'uncertain', 'a malformed success does not confirm acceptance')
        assert.equal((await respond(h, l.token, 'changes', { message: 'Not confirmed' })).status, 200)
        assert.equal((await quote(h, q.id)).customerRequests[0].authenticationBasis, staffBasis)
        delete h.email.reply
      }
      // A later genuine event can establish provider custody even when its
      // earlier send answer was uncertain. No event verifies the person.
      if (provider === 'sendgrid') for (const [event, outcome, confirmed] of [['processed', 'accepted', true], ['delivered', 'delivered', true], ['deferred', 'deferred', true], ['bounce', 'bounced', true], ['spamreport', 'complained', true], ['dropped', 'rejected', false]]) {
        h.email.status[b.customer.email] = 500
        const q = await fresh(h, b), l = await linkFor(q, { email: true }), m = (await h.state()).messages.find(m => m.id === l.emailMessageId)
        const callback = signer.signed([{ email: m.to, timestamp: Date.parse(at) / 1000 + 1, event, sg_event_id: randomUUID(), sg_message_id: 'synthetic-glove-event', rer_delivery_id: m.id }], { at: Date.parse(at) / 1000 })
        assert.equal((await postEvents(h, callback)).status, 200)
        assert.equal((await h.state()).messageStates[m.id].status, outcome)
        assert.equal((await respond(h, l.token, 'changes', { message: `After ${outcome}` })).status, 200)
        const expected = confirmed ? emailBasis : staffBasis
        assert.equal((await quote(h, q.id)).customerRequests[0].authenticationBasis, expected)
        assert.equal((await quote(h, q.id)).customerRequests[0].identity, 'CLAIMED')
        basisCases.push({ q, l, expected })
      }
      if (provider === 'postmark') {
        h.email.status[b.customer.email] = 500
        const q = await fresh(h, b), l = await linkFor(q, { email: true }), m = { ...(await h.state()).messages.find(m => m.id === l.emailMessageId), receipt: 'synthetic-glove-failed' }
        const callback = postmarkCallback(m, (await h.command('mail.callback', { action: 'rotate' })).callbackPassword, { at, id: 179, details: { RecordType: 'Bounce', Type: 'SoftBounce', Inactive: true } })
        assert.equal((await postEvents(h, callback)).status, 200)
        assert.equal((await h.state()).messageStates[m.id].status, 'failed')
        assert.equal((await respond(h, l.token, 'changes', { message: 'Provider gave up delivery' })).status, 200)
        assert.equal((await quote(h, q.id)).customerRequests[0].authenticationBasis, emailBasis)
        basisCases.push({ q, l, expected: emailBasis })
      }
    }
    delete h.email.status[b.customer.email]; delete h.email.reply
    const q = await fresh(h, b), count = h.email.sent.length, l = await linkFor(q)
    assert.equal(l.authenticationBasis, staffBasis)
    assert.equal(h.email.sent.length, count, 'outside sharing sends no email')
    assert.equal(l.emailMessageId, undefined)
    assert.equal((await respond(h, l.token, 'changes', { message: 'Handed to me by staff' })).status, 200)
    assert.equal((await quote(h, q.id)).customerRequests[0].authenticationBasis, staffBasis)
  })

  await scenario(t, 'point 4: every recorded customer response follows confirming provider facts and never asserts verified identity', async () => {
    const facts = (await exported(h)).timeline
    for (const { q, l, expected } of basisCases) {
      const confirming = facts.filter(e => e.subject_id === l.emailMessageId && e.actor_role === 'provider' && ['email.accepted', 'email.delivered', 'email.deferred', 'email.bounced', 'email.complained', 'email.failed'].includes(e.kind))
      assert.equal(confirming.length > 0, expected === emailBasis)
      assert.equal((await respond(h, l.token, 'changes', { message: 'Current provider custody basis' })).status, 200)
      const response = (await quote(h, q.id)).customerRequests.at(-1)
      assert.deepEqual([response.authenticationBasis, response.identity, response.name, response.capacity], [expected, 'CLAIMED', 'Mei Lin', 'Practice manager'])
    }
  })

  await scenario(t, 'point 1: permitted people issue and revoke; excluded roles and tokens change nothing', async () => {
    const q = await fresh(h, b)
    for (const person of [null, b.dispatcher, b.office]) {
      const options = person ? { as: person.cookie } : {}, l = await linkFor(q, {}, options)
      assert.equal((await read(h, l.token)).status, 200)
      const revoked = await h.command('quote.linkRevoke', { linkId: l.id, version: l.version }, options)
      assert.equal(revoked.revokedAt, at)
      assert.equal((await read(h, l.token)).status, 404)
    }
    const l = await linkFor(q), role = await h.command('role.save', { name: 'Link controls without sending', permissions: ['quote.link', 'quote.linkRevoke'] })
    const custom = await h.person('Synthetic Custom', `custom:${role.id}`)
    const token = await h.command('token.issue', { name: 'Synthetic link integration', role: 'dispatcher' })
    for (const [type, payload] of [['quote.link', { quoteId: q.id, version: q.version }], ['quote.linkRevoke', { linkId: l.id, version: l.version }]]) {
      const before = await durable(h)
      const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: randomUUID(), type, payload } })
      assert.equal(signedOut.status, 401)
      for (const person of [b.agent, b.priyaPerson, custom]) await person.run(type, payload, { error: 'FORBIDDEN' })
      const response = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type, payload } })
      assert.equal(response.status, 403)
      assert.equal((await response.json()).error.code, 'FORBIDDEN')
      assert.deepEqual(await durable(h), before)
    }
  })

  await scenario(t, 'point 2: independently expected customer document is frozen with its canonical digest', async () => {
    const service = await h.command('service.save', { ...b.service, description: 'Captured customer description', unitCost: '77.13', image: { mediaType: 'image/png', base64: documentPhoto } })
    const template = await h.command('template.save', { name: 'Customer template', options: [{ name: 'Repair', lines: [{ serviceId: service.id, description: 'Customer service line', quantity: '2', unitPrice: '100.00' }] }], addOns: [{ name: 'Filter', lines: [{ description: 'Washable filter', quantity: '1', unitPrice: '25.00', tax: 'GST' }] }], notes: 'Customer-facing access arrangement', terms: 'Payment in 14 days' })
    const other = await h.command('customer.save', { name: 'Unrelated private customer', billingAddress: 'Unrelated private billing address' })
    await h.command('site.save', { customerId: other.id, address: 'Unrelated private property', accessNotes: 'Unrelated private access' })
    await h.command('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'Private office evidence' })
    const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Private assessment request', source: 'phone' })
    const assessment = await b.dispatcher.run('assessment.book', { enquiryId: enquiry.id, technicianId: b.priya.id, date: '2030-03-12', start: '08:00', end: '09:00' })
    await b.priyaPerson.run('visit.arrive', { visitId: assessment.visit.id, deviceTime: assessment.visit.startAt })
    await b.priyaPerson.run('visit.capture', { visitId: assessment.visit.id, deviceTime: assessment.visit.startAt, kind: 'note', text: 'Private assessment evidence' })
    await b.priyaPerson.run('visit.complete', { visitId: assessment.visit.id, deviceTime: assessment.visit.endAt, summary: 'Internal assessment summary', signoff: { absentReason: 'Customer away' } })
    let q = await h.command('quote.draft', { enquiryId: enquiry.id, title: 'Customer cooling proposal', templateId: template.id, validUntil: '2030-04-11' })
    assert.deepEqual(q.assessment.notes, ['Private assessment evidence'])
    // Change the price book before link issue to prove capture when priced.
    await h.command('service.save', { ...service, description: 'Later customer description', unitPrice: '999.00' })
    q = await h.command('document.photo', { kind: 'quote', id: q.id, version: q.version, photo: { mediaType: 'image/png', base64: documentPhoto }, caption: 'Customer-facing condenser photo' })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    const l = await linkFor(q), photo = q.documentPhotos[0]
    const expected = { business: { name: 'Harbour Air & Electrical', legalName: '', dba: '', ein: '51 824 753 556', address: '', phone: '', email: ['office', 'harbourair.example'].join('@'), licenses: [], insurance: null, logo: null }, template: { heading: 'Quote', terms: '', footer: '' }, photos: [{ file: photo.file, caption: 'Customer-facing condenser photo' }], files: [photo.file.fileId, service.images[0].fileId], date: '2030-03-12', number: q.number, title: 'Customer cooling proposal', revision: 1, site: { address: '14 Harbour St, Balmain NSW 2041' }, options: [{ id: 'option-1', name: 'Repair', lines: [{ description: 'Customer service line', customerDescription: 'Captured customer description', images: service.images, quantity: '2', unitPrice: '100.00', tax: 'GST' }], totals: { subtotal: '200.00', tax: '20.00', total: '220.00', currency: 'AUD' } }], addOns: [{ id: 'addon-1', name: 'Filter', lines: [{ description: 'Washable filter', customerDescription: '', images: [], quantity: '1', unitPrice: '25.00', tax: 'GST' }], totals: { subtotal: '25.00', tax: '2.50', total: '27.50', currency: 'AUD' } }], notes: 'Customer-facing access arrangement', terms: 'Payment in 14 days', validUntil: '2030-04-11', validityZone: 'Australia/Sydney' }
    let view = await (await read(h, l.token)).json()
    assert.deepEqual(view.document, expected)
    assert.equal(view.documentHash, createHash('sha256').update(canonical(expected)).digest('hex'))
    noSecret(view, ['unitCost', '77.13', 'markup', b.site.accessNotes, b.customer.phone, 'Private office evidence', 'Private assessment evidence', 'Internal assessment summary', other.name, other.billingAddress, 'Unrelated private property'], 'customer document')
    for (const fileId of expected.files) assert.equal((await h.request(`/api/glove/public/quote/files/${fileId}`, { as: '', headers: { authorization: `Bearer ${l.token}` } })).status, 200)
    await h.command('template.save', { ...template, notes: 'Later template note', terms: 'Later template terms' })
    await h.command('document.template', { kind: 'quote', version: (await h.state()).business[0].version, heading: 'Later heading', terms: 'Later document terms', footer: 'Later footer' })
    await h.command('business.save', { ...(await h.state()).business[0], name: 'Later business identity' })
    await h.restart()
    view = await (await read(h, l.token)).json()
    assert.deepEqual(view.document, expected)
    assert.equal(view.documentHash, l.documentHash)
    await h.command('business.save', { ...(await h.state()).business[0], name: 'Harbour Air & Electrical' })
  })

  await scenario(t, 'point 5: revision-only same-origin JSON responses accept changes, claimed decline and one update', async () => {
    const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Customer response enquiry', source: 'phone' })
    let q = await fresh(h, b, { enquiryId: enquiry.id, validUntil: '2030-03-12' }), l = await linkFor(q)
    const before = await durable(h)
    for (const headers of [{ origin: 'https://outside.example.test' }, { 'content-type': 'text/plain' }]) {
      const response = await respond(h, l.token, 'changes', { message: 'Do not keep this' }, headers)
      assert.equal(response.status, headers.origin ? 403 : 400)
    }
    assert.deepEqual(await durable(h), before)
    const message = 'Please include a washable filter'
    assert.equal((await respond(h, l.token, 'changes', { message })).status, 200)
    await h.setTime('2030-03-12T13:00:00.000Z')
    const updates = await Promise.all([respond(h, l.token, 'update'), respond(h, l.token, 'update')])
    assert.ok(updates.every(r => r.status === 200))
    assert.deepEqual((await quote(h, q.id)).customerRequests.map(x => x.action), ['changes', 'update'])
    responseFixture = { enquiry, q, l, message }
  })

  await scenario(t, 'point 6: changes and updates survive in every office surface and reopen the originating request', async () => {
    let { enquiry, q, l, message } = responseFixture
    const assertSurfaces = async () => {
      const s = await b.office.state(), kept = s.quotes.find(x => x.id === q.id)
      assert.deepEqual(kept.customerRequests.map(x => [x.revision, x.action, x.name, x.capacity, x.identity]), [[1, 'changes', 'Mei Lin', 'Practice manager', 'CLAIMED'], [1, 'update', 'Mei Lin', 'Practice manager', 'CLAIMED']])
      assert.equal(s.enquiries.find(x => x.id === enquiry.id).status, 'contacted')
      assert.equal(s.notices.filter(n => n.quoteId === q.id).length, 2)
      assert.ok(s.notices.some(n => n.quoteId === q.id && n.message.includes(message)))
      assert.ok(s.notices.some(n => n.quoteId === q.id && n.message.includes('asked for an updated quote')))
      const history = await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie }).then(r => r.json())
      assert.ok(history.entries.some(x => x.kind === 'quote response' && x.label.includes(message)))
      assert.ok(history.entries.some(x => x.kind === 'quote response' && x.label.includes('Mei Lin (claimed) update')))
      const stream = await h.request(`/api/glove/conversation?customerId=${b.customer.id}`, { as: b.office.cookie }).then(r => r.json())
      for (const kind of ['quote changes requested', 'updated quote requested']) assert.ok(stream.entries.some(x => x.kind === kind && x.direction === 'inbound' && x.channel === 'customer link' && x.author === 'Mei Lin (claimed)' && x.text.includes(q.number)))
      const { activity, exported: out } = await assertTrail(h, ['quote.customer.changes', 'quote.customer.update'])
      for (const action of ['changes', 'update']) {
        const e = activity.find(e => e.kind === `quote.customer.${action}` && e.subjectId === q.id)
        assert.ok(e); assert.deepEqual([e.actorId, e.actorName, e.actorRole], [l.issuedBy.id, l.issuedBy.name, l.issuedBy.role])
        assert.ok(e.commandId && e.at)
        const fact = out.timeline.find(x => x.id === e.id)
        assert.equal(JSON.parse(fact.data).action, action)
        assert.equal(JSON.parse(fact.data).authenticationBasis, staffBasis)
      }
      assert.deepEqual(out.quotes.find(x => x.id === q.id).customerRequests, kept.customerRequests)
    }
    await assertSurfaces()
    const saved = await durable(h)
    await h.restart()
    assert.equal((await respond(h, l.token, 'update')).status, 200)
    assert.deepEqual(await durable(h), saved)
    await assertSurfaces()
    q = await quote(h, q.id)
    q = await h.command('quote.revise', { quoteId: q.id, version: q.version, lines, validUntil: '2030-04-01' })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 2 })
    const next = await linkFor(q)
    const old = await (await read(h, l.token)).json()
    assert.equal(old.state, 'superseded'); assert.equal(old.document, undefined)
    assert.equal((await respond(h, l.token, 'decline')).status, 409)
    assert.equal((await (await read(h, next.token)).json()).document.revision, 2)
    assert.equal((await respond(h, next.token, 'update')).status, 200)
    assert.deepEqual((await quote(h, q.id)).customerRequests.filter(x => x.action === 'update').map(x => x.revision), [1, 2])
    await h.setTime(at)
    const declining = await fresh(h, b), decliningLink = await linkFor(declining)
    assert.equal((await respond(h, decliningLink.token, 'decline')).status, 200)
    const declined = await quote(h, declining.id)
    assert.deepEqual([declined.status, declined.declined.name, declined.declined.capacity, declined.declined.identity, declined.declined.authenticationBasis], ['declined', 'Mei Lin', 'Practice manager', 'CLAIMED', staffBasis])
    assert.equal(declined.customerRequests.length, 1)
  })

  await scenario(t, 'point 7: customer decline and each staff decision have one winner and leave a read-only revision', async () => {
    for (const method of ['accept', 'decline']) {
      const q = await fresh(h, b), l = await linkFor(q)
      const staff = h.request('/api/glove/commands', { method: 'POST', body: { commandId: randomUUID(), type: `quote.${method}`, payload: { quoteId: q.id, version: q.version, revision: 1, method: 'phone', customerName: 'Staff-recorded customer' } } })
      const [a, c] = await Promise.all([staff, respond(h, l.token, 'decline')])
      assert.ok([200, 409].includes(a.status)); assert.equal(c.status, 200)
      const kept = await quote(h, q.id), decisions = (await h.request('/api/glove/activity').then(r => r.json())).events.filter(e => e.subjectId === q.id && ['quote.accepted', 'quote.declined'].includes(e.kind))
      assert.equal(decisions.length, 1)
      assert.ok(['accepted', 'declined'].includes(kept.status))
      assert.equal(Boolean(kept.acceptance) + Boolean(kept.declined), 1)
      const snapshot = await durable(h)
      for (const action of ['changes', 'update', 'decline']) assert.equal((await (await respond(h, l.token, action, { message: 'Cannot change a decided revision' })).json()).state, 'decided')
      await h.command('quote.accept', { quoteId: q.id, version: kept.version, revision: 1, method: 'phone', customerName: 'Second answer' }, { error: 'QUOTE_STATE' })
      await h.command('quote.decline', { quoteId: q.id, version: kept.version, revision: 1, method: 'phone', customerName: 'Second answer' }, { error: 'QUOTE_STATE' })
      assert.deepEqual(await durable(h), snapshot)
      if (kept.declined?.identity === 'CLAIMED') assert.deepEqual([kept.declined.name, kept.declined.capacity, kept.declined.authenticationBasis], ['Mei Lin', 'Practice manager', staffBasis])
      await h.restart()
      assert.equal((await (await read(h, l.token)).json()).state, 'decided')
      assert.deepEqual(await durable(h), snapshot)
    }
  })

  await scenario(t, 'point 8: role, branch, revocation and expiry changes at the commit boundary refuse without writes', async () => {
    const branch = await h.command('branch.save', { name: 'Excluded branch', prefix: 'EXC', timezone: 'UTC', zips: [] })
    for (const withdrawal of ['role', 'branch', 'revoke', 'expiry']) for (const door of ['read', 'decision']) {
      await h.setTime(at)
      const q = await fresh(h, b), l = await linkFor(q, {}, { as: b.dispatcher.cookie })
      assert.equal((await read(h, l.token)).status, 200)
      let reached, release
      const arrived = new Promise(resolve => { reached = resolve }), resumed = new Promise(resolve => { release = resolve })
      h.checkpoints.qboComplete = async () => { reached(); await resumed }
      const pending = door === 'read' ? read(h, l.token, { 'x-synthetic-glove-pause': '1' }) : respond(h, l.token, 'decline', {}, { 'x-synthetic-glove-pause': '1' })
      await arrived
      try {
        if (withdrawal === 'role') await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
        if (withdrawal === 'branch') await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: branch.id })
        if (withdrawal === 'revoke') await h.command('quote.linkRevoke', { linkId: l.id, version: l.version })
        if (withdrawal === 'expiry') await h.setTime(l.expiresAt)
        const snapshot = await durable(h)
        release()
        assert.equal((await pending).status, 404, `${withdrawal} at ${door} guard`)
        assert.deepEqual(await durable(h), snapshot)
        await h.restart()
        assert.equal((await read(h, l.token)).status, 404)
        assert.equal((await respond(h, l.token, 'decline')).status, 404)
        assert.deepEqual(await durable(h), snapshot)
      } finally { release(); h.checkpoints.qboComplete = null }
      await h.setTime(at)
      if (withdrawal === 'role') await h.command('role.set', { operatorId: b.dispatcher.id, role: 'dispatcher' })
      if (withdrawal === 'branch') await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: null })
    }
  })

  await scenario(t, 'points 1 through 8: real Worker restart and replay retain facts without bearers or repeated sends', async () => {
    const before = await durable(h), count = h.email.sent.length
    await h.restart()
    for (const item of replayCases) {
      const replay = await h.command('quote.link', item.payload, { commandId: item.commandId })
      assert.equal(replay.id, item.l.id); assert.equal(replay.token, undefined)
      assert.equal((await quote(h, item.q.id)).customerRequests[0].authenticationBasis, item.expected)
    }
    assert.equal(h.email.sent.length, count)
    assert.deepEqual(await durable(h), before)
    const activity = await allActivity(h), out = await exported(h)
    for (const kind of ['quote.linkIssued', 'quote.linkRevoked', 'quote.customer.changes', 'quote.customer.decline', 'quote.customer.update', 'email.accepted', 'email.rejected', 'email.rate_limited', 'email.uncertain', 'email.delivered', 'email.deferred', 'email.bounced', 'email.complained', 'email.failed']) {
      const event = activity.find(e => e.kind === kind)
      assert.ok(event, `${kind} is readable in paginated Activity`)
      assert.ok(event.actorId && event.actorName && event.actorRole && event.commandId && event.at)
      const kept = out.timeline.find(e => e.id === event.id)
      assert.ok(kept, `${kind} is in the business export`)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.command_id], [event.actorId, event.actorName, event.actorRole, event.at, event.commandId])
    }
    for (const [surface, value] of Object.entries({ durable: before, state: await h.state(), activity, export: out, logs: h.logs })) noSecret(value, [...secrets, 'synthetic-glove-179'], surface)
    assert.ok(h.logs.length)
  })

  await scenario(t, 'inherited privacy and replay: erasure closes the old public link without resurrecting customer data', async t => {
    const e = await installation({ at }); t.after(() => e.close())
    await e.command('business.save', { name: 'Synthetic privacy business', timezone: 'UTC', currency: 'AUD' })
    const customer = await e.command('customer.save', { name: 'Synthetic privacy customer', email: ['synthetic-glove-179', 'example.test'].join('@') })
    const site = await e.command('site.save', { customerId: customer.id, address: '179 Synthetic Lane', accessNotes: 'Private customer entrance' })
    const q = await fresh(e, { customer, site }), commandId = randomUUID(), payload = { quoteId: q.id, version: q.version }
    const l = await issue(e, q, {}, { commandId })
    assert.equal((await respond(e, l.token, 'changes', { message: 'Personal customer response' })).status, 200)
    const preview = await e.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await e.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    const snapshot = await durable(e), sent = e.email.sent.length
    await e.restart()
    assert.equal((await read(e, l.token)).status, 404)
    assert.equal((await respond(e, l.token, 'changes', { message: 'Cannot restore erased records' })).status, 404)
    const response = await e.request('/api/glove/commands', { method: 'POST', body: { commandId, type: 'quote.link', payload } })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: false, error: { code: 'ERASED', message: 'This earlier outcome was erased for customer privacy.' } })
    assert.deepEqual(await durable(e), snapshot)
    assert.equal(e.email.sent.length, sent)
    noSecret(await exported(e), [customer.name, customer.email, site.address, site.accessNotes, 'Personal customer response', l.token], 'erased business export')
  })
})
