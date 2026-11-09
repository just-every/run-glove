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

const sha = value => createHash('sha256').update(value).digest('hex')
const errorCode = async response => (await response.json()).error?.code
const choose = async (h, token, choice) => (await respond(h, token, 'choose', { choice })).json()
const signed = (view, choice, extra = {}) => ({ choice, documentHash: view.documentHash, selectionHash: view.selection.hash, consent: { version: view.disclosure.version, hash: view.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' }, ...extra })
const drawn = (counts) => ({ kind: 'drawn', width: 600, height: 200, strokes: counts.map((n, s) => Array.from({ length: n }, (_, p) => [(s * 15 + p) % 600, (p * 2 + s) % 200])) })
const choices = { good: { optionId: 'option-1', addOnIds: [] }, better: { optionId: 'option-2', addOnIds: ['addon-1'] }, both: { optionId: 'option-2', addOnIds: ['addon-1', 'addon-2'] } }
// Hand-calculated: Better is 2 x 100.00 + 10% GST; Filter is 25.00 + 10% GST; Cover is 40.00 GST-free.
const choiceOptions = [{ name: 'Good', lines: [{ description: 'Good clean', quantity: '1', unitPrice: '100.00', tax: 'GST' }] }, { name: 'Better', lines: [{ description: 'Better service', quantity: '2', unitPrice: '100.00', tax: 'GST' }] }]
const choiceAddOns = [{ name: 'Filter', lines: [{ description: 'New filter', quantity: '1', unitPrice: '25.00', tax: 'GST' }] }, { name: 'Cover', lines: [{ description: 'Weather cover', quantity: '1', unitPrice: '40.00', tax: 'FREE' }] }]
const choiceQuote = async (h, b, extra = {}) => {
  const q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Choose cooling work', options: choiceOptions, addOns: choiceAddOns, ...extra })
  return h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
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

  const consentText = n => `synthetic-glove-226 disclosure ${n}, entered by the owner.\nThis is synthetic test data.`
  const businessVersion = async () => (await h.state()).business[0].version
  const configure = (extra, opts) => h.command('quote.consent', { version: undefined, ...extra }, opts)
  const accept = async text => h.command('quote.consent', { version: await businessVersion(), text, accept: true })
  const approvals = async (token, choice, extra = {}) => { const view = await choose(h, token, choice); return { view, body: signed(view, choice, extra) } }
  const refused = async (token, body, code, where) => {
    const before = await durable(h), sent = h.email.sent.length
    assert.equal(await errorCode(await respond(h, token, 'approve', body)), code, where)
    assert.deepEqual(await durable(h), before, `${where} writes nothing`); assert.equal(h.email.sent.length, sent, `${where} sends nothing`)
  }

  await scenario(t, 'QUOTE-010 point 4: only the signed-in unscoped Owner enters and accepts disclosure text; before acceptance nothing can be signed', async () => {
    await h.setTime(at)
    const q = await fresh(h, b), l = await linkFor(q)
    const page = await (await read(h, l.token)).json()
    assert.deepEqual([page.signingAvailable, page.disclosure], [false, null], 'no default text or bypass')
    await refused(l.token, { choice: choices.good, documentHash: l.documentHash, selectionHash: 'f'.repeat(64), consent: { version: 1, hash: 'f'.repeat(64), affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } }, 'CONSENT_GATE', 'approval before any acceptance')
    const role = await h.command('role.save', { name: 'Consent attempt', permissions: ['quote.link'] })
    const custom = await h.person('Synthetic Consent Custom', `custom:${role.id}`)
    const limited = await h.person('Synthetic Limited Owner', 'dispatcher'), branch = await h.command('branch.save', { name: 'Consent branch', prefix: 'CNS', timezone: 'UTC', zips: [] })
    await h.command('branch.limit', { operatorId: limited.id, branchId: branch.id })
    await h.command('role.set', { operatorId: limited.id, role: 'owner' })
    const token = await h.command('token.issue', { name: 'Synthetic consent integration', role: 'dispatcher' })
    const attempt = { version: await businessVersion(), text: consentText('one'), accept: true }, before = await durable(h)
    for (const person of [b.office, b.dispatcher, custom, limited]) await person.run('quote.consent', attempt, { error: 'FORBIDDEN' })
    const bearer = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: randomUUID(), type: 'quote.consent', payload: attempt } })
    assert.equal(bearer.status, 403)
    assert.equal((await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: randomUUID(), type: 'quote.consent', payload: attempt } })).status, 401)
    await h.command('quote.consent', { ...attempt, accept: undefined }, { error: 'CONSENT' })
    await h.command('quote.consent', { ...attempt, accept: 'true' }, { error: 'CONSENT' })
    for (const text of ['', '   ', 'x'.repeat(12001)]) await h.command('quote.consent', { ...attempt, text }, { error: 'INPUT' })
    await h.command('quote.consent', { ...attempt, version: attempt.version - 1 }, { error: 'STALE' })
    assert.deepEqual(await durable(h), before, 'every refusal leaves the business unchanged')
    assert.equal((await h.state()).business[0].quoteConsent ?? null, null)
    await h.command('quote.consent', attempt)
    const open = await (await read(h, l.token)).json()
    assert.deepEqual([open.signingAvailable, open.disclosure], [true, { version: 1, text: attempt.text, hash: sha(attempt.text) }])
  })

  await scenario(t, 'QUOTE-010 point 5: each acceptance is a numbered, hashed Owner and time version; changed, disabled or re-accepted text refuses old approvals', async () => {
    await h.setTime(at)
    const q = await fresh(h, b), l = await linkFor(q), choice = choices.good
    const one = await approvals(l.token, choice)
    assert.equal(one.view.disclosure.version, 1)
    const two = await accept(consentText('two')), prepared2 = await approvals(l.token, choice)
    await refused(l.token, one.body, 'CONSENT_CHANGED', 'approval prepared under version 1')
    const three = await accept(consentText('two')), prepared3 = await approvals(l.token, choice)
    assert.deepEqual([two.quoteConsent.version, three.quoteConsent.version, three.quoteConsent.hash], [2, 3, two.quoteConsent.hash])
    assert.equal(prepared2.body.consent.hash, prepared3.body.consent.hash)
    await refused(l.token, prepared2.body, 'CONSENT_CHANGED', 'identical text accepted again under a new version')
    await h.command('quote.consent', { version: await businessVersion(), disable: true })
    assert.equal((await (await read(h, l.token)).json()).signingAvailable, false)
    await refused(l.token, prepared3.body, 'CONSENT_GATE', 'approval after disablement')
    const four = await accept(consentText('three'))
    await refused(l.token, prepared3.body, 'CONSENT_CHANGED', 'approval prepared before the fourth acceptance')
    const history = (await h.state()).business[0].quoteConsentHistory
    assert.deepEqual(history.map(x => [x.version, x.text, x.hash, x.acceptedBy.name, x.acceptedBy.role, x.acceptedAt]), [[1, consentText('one'), sha(consentText('one')), 'Olivia Owner', 'owner', at], [2, consentText('two'), sha(consentText('two')), 'Olivia Owner', 'owner', at], [3, consentText('two'), sha(consentText('two')), 'Olivia Owner', 'owner', at], [4, consentText('three'), sha(consentText('three')), 'Olivia Owner', 'owner', at]])
    assert.equal(four.quoteConsent.version, 4)
    const events = (await exported(h)).timeline.filter(e => e.kind.startsWith('quote.consent')).map(e => [e.kind, JSON.parse(e.data), e.actor_name, e.actor_role])
    assert.deepEqual(events.map(e => [e[0], e[1].disclosureVersion, e[2], e[3]]), [['quote.consentAccepted', 1, 'Olivia Owner', 'owner'], ['quote.consentAccepted', 2, 'Olivia Owner', 'owner'], ['quote.consentAccepted', 3, 'Olivia Owner', 'owner'], ['quote.consentDisabled', 3, 'Olivia Owner', 'owner'], ['quote.consentAccepted', 4, 'Olivia Owner', 'owner']])
    assert.equal((await quote(h, q.id)).acceptance ?? null, null)
  })

  await scenario(t, 'QUOTE-010 point 6: the customer reviews the server-hashed chosen document; tampered, changed, stale, superseded and out-of-bounds answers are refused', async () => {
    await h.setTime(at)
    let q = await choiceQuote(h, b), l = await linkFor(q)
    const view = await choose(h, l.token, choices.better), doc = view.selection.document
    assert.deepEqual(doc.totals, { subtotal: '225.00', tax: '22.50', total: '247.50', currency: 'AUD' })
    assert.deepEqual([doc.choice.optionName, doc.choice.addOnNames, doc.lines.map(x => x.description)], ['Better', ['Filter'], ['Better service', 'New filter']])
    assert.equal(view.selection.hash, sha(canonical(doc)))
    assert.equal((await choose(h, l.token, choices.both)).selection.document.totals.total, '287.50')
    assert.equal((await choose(h, l.token, choices.good)).selection.document.totals.total, '110.00')
    assert.equal(JSON.stringify(view.selection).includes('unitCost'), false)
    const body = signed(view, choices.better)
    await refused(l.token, { ...body, selectionHash: view.selection.hash.replace(/./, c => c === '0' ? '1' : '0') }, 'CHOICE_CHANGED', 'tampered selection hash')
    await refused(l.token, { ...body, choice: choices.both }, 'CHOICE_CHANGED', 'changed choice')
    await refused(l.token, { ...body, choice: { optionId: 'option-9', addOnIds: [] } }, 'CHOICE', 'unknown option')
    await refused(l.token, { ...body, choice: { optionId: 'option-2', addOnIds: ['addon-1', 'addon-1'] } }, 'CHOICE', 'repeated add-on')
    await refused(l.token, { ...body, documentHash: 'f'.repeat(64) }, 'DOCUMENT_CHANGED', 'stale revision document hash')
    await refused(l.token, { ...body, consent: { ...body.consent, affirmed: false } }, 'CONSENT_CHANGED', 'unaffirmed disclosure')
    for (const signature of [drawn(Array(41).fill(2)), drawn([...Array(39).fill(75), 76]), { ...drawn([2]), strokes: [[[0, 0], [600.1, 10]]] }, { ...drawn([2]), strokes: [[[0, 0], [10, 200.5]]] }, { ...drawn([2]), strokes: [[[-1, 5], [10, 10]]] }, drawn([1]), { ...drawn([2]), strokes: [[[50, 50], [50.5, 50.5]]] }, { ...drawn([2]), width: 601 }, { kind: 'typed', text: 'x'.repeat(201) }, { kind: 'typed', text: '   ' }]) {
      await refused(l.token, { ...body, signature }, ['typed'].includes(signature.kind) ? 'INPUT' : 'SIGNATURE', `signature ${JSON.stringify(signature).slice(0, 60)}`)
    }
    // A revised quote supersedes the link that held the otherwise valid answer.
    const revised = await h.command('quote.revise', { quoteId: q.id, version: q.version, options: choiceOptions, addOns: choiceAddOns })
    await h.command('quote.approve', { quoteId: q.id, version: revised.version, revision: 2 })
    await refused(l.token, body, 'REVISION', 'superseded link')
    q = await quote(h, q.id); l = await linkFor(q)
    const current = await approvals(l.token, choices.better)
    assert.notEqual(current.body.documentHash, body.documentHash)
    const sentBefore = h.email.sent.length
    assert.equal((await respond(h, l.token, 'approve', { ...current.body, signature: { kind: 'typed', text: 'y'.repeat(200) } })).status, 200)
    assert.equal((await quote(h, q.id)).acceptance.signing.signature.text.length, 200)
    assert.equal(h.email.sent.length, sentBefore + 1, 'one confirmation after the commit')
    const second = await choiceQuote(h, b), sl = await linkFor(second), ready = await approvals(sl.token, choices.good), signature = drawn(Array(40).fill(75))
    assert.equal((await respond(h, sl.token, 'approve', { ...ready.body, signature })).status, 200)
    const kept = (await quote(h, second.id)).acceptance.signing.signature
    assert.deepEqual([kept.strokes.length, kept.strokes.flat().length], [40, 3000]); assert.deepEqual(kept, signature)
    assert.equal((await (await h.request(`/api/glove/quotes/${second.id}/signed`)).text()).split('<polyline').length - 1, 40)
  })

  await scenario(t, 'QUOTE-010 point 7: the chosen option and add-on carry exact cents through job.create and the first decision freezes the revision', async () => {
    await h.setTime(at)
    const q = await choiceQuote(h, b), l = await linkFor(q), ready = await approvals(l.token, choices.better)
    assert.equal((await respond(h, l.token, 'approve', ready.body)).status, 200)
    const kept = await quote(h, q.id)
    assert.deepEqual([kept.status, kept.acceptance.method, kept.acceptance.choice.optionId, kept.acceptance.choice.addOnIds], ['accepted', 'customer link', 'option-2', ['addon-1']])
    const job = await b.dispatcher.run('job.create', { quoteId: q.id })
    assert.deepEqual(job.lines.map(x => [x.description, x.quantity, x.unitPrice, x.tax]), [['Better service', '2', '100.00', 'GST'], ['New filter', '1', '25.00', 'GST']])
    assert.deepEqual([job.totals.subtotal, job.totals.total], ['225.00', '247.50'])
    const frozen = await durable(h), sent = h.email.sent.length
    const current = await quote(h, q.id)
    for (const type of ['quote.accept', 'quote.decline']) await h.command(type, { quoteId: q.id, version: current.version, revision: 1, method: 'phone', customerName: 'Late staff answer' }, { error: 'QUOTE_STATE' })
    await h.command('quote.revise', { quoteId: q.id, version: current.version, options: choiceOptions, addOns: choiceAddOns }, { error: 'QUOTE_CLOSED' })
    for (const body of [ready.body, { ...ready.body, name: 'Someone Else', choice: choices.good, signature: { kind: 'typed', text: 'Someone Else' } }, { action: 'decline' }]) {
      const again = await respond(h, l.token, 'approve', body)
      assert.deepEqual([again.status, (await again.json()).decision], [200, 'accepted'])
    }
    assert.deepEqual(await durable(h), frozen); assert.equal(h.email.sent.length, sent)
    const out = await exported(h)
    assert.equal(out.timeline.filter(e => e.kind === 'quote.customer.approve' && e.subject_id === q.id).length, 1)
    assert.equal((await h.state()).messages.filter(m => m.kind === 'quoteConfirmation' && m.subjectId === q.id).length, 1)
    // Staff first: a later customer approval changes nothing and freezes no copy.
    const staff = await choiceQuote(h, b), sl = await linkFor(staff), prepared = await approvals(sl.token, choices.good)
    await h.command('quote.accept', { quoteId: staff.id, version: staff.version, revision: 1, method: 'phone', customerName: 'Staff-recorded customer', choice: choices.good })
    const after = await durable(h), count = h.email.sent.length
    const late = await respond(h, sl.token, 'approve', prepared.body)
    assert.deepEqual([late.status, (await late.json()).decision], [200, 'accepted'])
    assert.deepEqual(await durable(h), after); assert.equal(h.email.sent.length, count)
    assert.equal((await quote(h, staff.id)).acceptance.signing ?? null, null)
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(staff.id).first()).n, 0)
  })

  const winners = []
  await scenario(t, 'QUOTE-010 point 8: the winning record holds the claimed signer, basis, link, time, IP or unavailable, browser, signature, disclosure and both hashes across a Worker restart', async () => {
    await h.setTime(at)
    const disclosure = (await h.state()).business[0].quoteConsent
    const cases = [
      { name: 'staff-handed link with a supplied IP', email: false, ip: '203.0.113.7', browser: 'synthetic-glove-226 browser one', signature: { kind: 'typed', text: 'Mei Lin' } },
      { name: 'Glove-sent link after provider acceptance', email: true, ip: '2001:db8::1', browser: 'synthetic-glove-226 browser two', signature: drawn([4, 3]) },
      { name: 'malformed IP', email: false, ip: 'not an address', browser: 'synthetic-glove-226 browser three', signature: { kind: 'typed', text: 'Mei' } },
    ]
    for (const c of cases) {
      const q = await choiceQuote(h, b), l = await linkFor(q, c.email ? { email: true } : {}), ready = await approvals(l.token, choices.both)
      if (c.email) assert.equal((await h.state()).messageStates[l.emailMessageId].status, 'accepted')
      const headers = { 'user-agent': c.browser, ...(c.ip ? { 'cf-connecting-ip': c.ip } : {}) }
      const response = await respond(h, l.token, 'approve', { ...ready.body, signature: c.signature }, headers)
      assert.equal(response.status, 200, c.name)
      const record = (await quote(h, q.id)).acceptance, { document, signedCopy, confirmation, ...evidence } = record.signing
      const usable = c.ip === '203.0.113.7' || c.ip === '2001:db8::1'
      const expected = { name: 'Mei Lin', capacity: 'Practice manager', identity: 'CLAIMED', authenticationBasis: c.email ? emailBasis : staffBasis, linkId: l.id, revision: 1, revisionDocumentHash: l.documentHash, chosenDocumentHash: ready.view.selection.hash, signature: c.signature, consent: { version: disclosure.version, text: disclosure.text, hash: disclosure.hash, affirmed: true, ownerAcceptedAt: disclosure.acceptedAt, ownerAcceptedBy: disclosure.acceptedBy }, at, ip: usable ? c.ip : null, ipSource: usable ? 'Cloudflare connecting-IP header' : 'unavailable', browser: c.browser }
      assert.deepEqual(evidence, expected, c.name)
      assert.deepEqual([record.capacity, record.identity, record.authenticationBasis], ['Practice manager', 'CLAIMED', expected.authenticationBasis])
      const event = (await exported(h)).timeline.find(e => e.kind === 'quote.customer.approve' && e.subject_id === q.id), data = JSON.parse(event.data)
      assert.deepEqual([data.name, data.capacity, data.authenticationBasis, data.linkId, data.signedAt, data.ip, data.ipSource, data.browser, data.signature, data.consentVersion, data.consentText, data.consentHash, data.documentHash, data.chosenDocumentHash], [expected.name, expected.capacity, expected.authenticationBasis, l.id, at, expected.ip, expected.ipSource, expected.browser, expected.signature, disclosure.version, disclosure.text, disclosure.hash, l.documentHash, ready.view.selection.hash], `${c.name} event`)
      const html = await (await h.request(`/api/glove/quotes/${q.id}/signed`)).text()
      assert.ok(html.includes(`IP: ${usable ? c.ip : 'Unavailable'} (${expected.ipSource})`) && html.includes(`Browser: ${c.browser}`) && html.includes(`Link ID: ${l.id}`))
      winners.push({ ...c, q, l, expected, record, data, html, ready })
    }
    const kept = winners.map(w => [w.record, w.data])
    await h.restart()
    for (const [i, w] of winners.entries()) {
      assert.deepEqual((await quote(h, w.q.id)).acceptance, kept[i][0])
      assert.deepEqual(JSON.parse((await exported(h)).timeline.find(e => e.kind === 'quote.customer.approve' && e.subject_id === w.q.id).data), kept[i][1])
      const page = await (await read(h, w.l.token)).json()
      assert.deepEqual([page.state, page.signed.name, page.signed.capacity, page.signed.authenticationBasis, page.signed.at, page.signed.signature, page.signed.consent.hash, page.signed.revisionDocumentHash, page.signed.chosenDocumentHash], ['decided', 'Mei Lin', 'Practice manager', w.expected.authenticationBasis, at, w.signature, w.expected.consent.hash, w.l.documentHash, w.ready.view.selection.hash])
    }
  })

  await scenario(t, 'QUOTE-010 point 1: the retained signed copy hashes to its manifest and exactly one confirmation goes to an on-record address while email is connected', async () => {
    await h.setTime(at)
    for (const w of winners) {
      const desk = await h.request(`/api/glove/quotes/${w.q.id}/signed`), customer = await h.request('/api/glove/public/quote/signed', { as: '', headers: { authorization: `Bearer ${w.l.token}` } })
      const html = await desk.text(), manifest = w.record.signing.signedCopy
      assert.equal(desk.status, 200); assert.equal(customer.status, 200); assert.equal(await customer.text(), html)
      assert.deepEqual([sha(html), Buffer.byteLength(html), manifest.chunks, manifest.format], [manifest.sha256, manifest.size, Math.ceil(manifest.size / 500000), 'html'])
      assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_quote_signed_chunks WHERE quote_id=?').bind(w.q.id).first()).n, manifest.chunks)
      const messages = (await h.state()).messages.filter(m => m.kind === 'quoteConfirmation' && m.subjectId === w.q.id)
      assert.deepEqual(messages.map(m => [m.to, m.id]), [[b.customer.email, w.record.signing.confirmation.messageId]])
      const mails = h.email.sent.filter(m => m.idempotencyKey === messages[0].id)
      assert.equal(mails.length, 1); assert.equal(mails[0].body.html, html); assert.ok(mails[0].body.text.includes(`Signed HTML copy SHA-256: ${manifest.sha256}`))
    }
    // A customer without a valid on-record address can still sign a staff-handed link; nothing is sent or claimed.
    const nobody = await h.command('customer.save', { name: 'Synthetic customer without email' }), place = await h.command('site.save', { customerId: nobody.id, address: '226 Synthetic Lane' })
    let q = await h.command('quote.draft', { customerId: nobody.id, siteId: place.id, title: 'No address on record', lines })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    let l = await linkFor(q), ready = await approvals(l.token, choices.good), sent = h.email.sent.length
    assert.equal((await respond(h, l.token, 'approve', ready.body, { 'cf-connecting-ip': 'bad ip' })).status, 200)
    let kept = await quote(h, q.id)
    assert.deepEqual([kept.status, kept.acceptance.signing.confirmation, kept.acceptance.signing.ip, kept.acceptance.signing.ipSource], ['accepted', { status: 'not_sent', reason: 'no_on_record_email', messageId: null, to: null }, null, 'unavailable'])
    assert.equal(sha(await (await h.request(`/api/glove/quotes/${q.id}/signed`)).text()), kept.acceptance.signing.signedCopy.sha256)
    assert.equal(h.email.sent.length, sent); assert.equal((await h.state()).messages.some(m => m.subjectId === q.id), false)
    const page = await (await read(h, l.token)).json()
    assert.deepEqual([page.signed.confirmation.status, page.signed.confirmation.messageId], ['not_sent', null])
    // With customer email disconnected the signature commits and no message is queued.
    await h.command('mail.connect', { provider: null })
    q = await fresh(h, b); l = await linkFor(q); ready = await approvals(l.token, choices.good); sent = h.email.sent.length
    assert.equal((await respond(h, l.token, 'approve', ready.body)).status, 200)
    kept = await quote(h, q.id)
    assert.deepEqual(kept.acceptance.signing.confirmation, { status: 'not_connected', messageId: null, to: null })
    assert.equal(h.email.sent.length, sent); assert.equal((await h.state()).messages.some(m => m.kind === 'quoteConfirmation' && m.subjectId === q.id), false)
    winners.push({ q, l, record: kept.acceptance, html: await (await h.request(`/api/glove/quotes/${q.id}/signed`)).text(), unsent: true })
  })

  await scenario(t, 'QUOTE-010 point 3: no page, record, event, signed copy, confirmation, Activity entry or export claims verified identity or ESIGN, UETA or eIDAS validity', async () => {
    const claims = /\b(ESIGN|E-SIGN|UETA|eIDAS)\b|legally binding|identity (is |was )?(verified|confirmed)|verified (identity|signer)/i
    const pages = await Promise.all(winners.map(async w => JSON.stringify(await (await read(h, w.l.token)).json())))
    const surfaces = { pages, copies: winners.map(w => w.html), mail: h.email.sent.map(m => JSON.stringify(m.body)), records: JSON.stringify((await h.state()).quotes.concat((await h.state()).business)), activity: JSON.stringify(await allActivity(h)), export: JSON.stringify(await exported(h)) }
    for (const [name, value] of Object.entries(surfaces)) assert.equal(claims.test(JSON.stringify(value)), false, `${name} makes no identity or legal-validity claim`)
    for (const w of winners) assert.ok(w.html.includes('Identity is claimed, not verified. No legal-validity claim is made.') && w.html.includes('(CLAIMED)'))
    assert.ok(pages.every(page => page.includes('It does not verify your identity or claim legal validity.') || page.includes('"signingAvailable":false')))
  })

  await scenario(t, 'QUOTE-010 point 2: a typed signature is always offered and commits whenever a drawn one is refused', async () => {
    await h.setTime(at)
    await accept(consentText('typed'))
    const q = await fresh(h, b), l = await linkFor(q), ready = await approvals(l.token, choices.good)
    assert.equal((await (await read(h, l.token)).json()).signingAvailable, true)
    await refused(l.token, { ...ready.body, signature: drawn([1]) }, 'SIGNATURE', 'unusable drawing')
    assert.equal((await respond(h, l.token, 'approve', ready.body)).status, 200)
    assert.deepEqual((await quote(h, q.id)).acceptance.signing.signature, { kind: 'typed', text: 'Mei Lin' })
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
    for (const kind of ['quote.linkIssued', 'quote.linkRevoked', 'quote.customer.changes', 'quote.customer.decline', 'quote.customer.update', 'quote.consentAccepted', 'quote.consentDisabled', 'quote.customer.approve', 'email.accepted', 'email.rejected', 'email.rate_limited', 'email.uncertain', 'email.delivered', 'email.deferred', 'email.bounced', 'email.complained', 'email.failed']) {
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
