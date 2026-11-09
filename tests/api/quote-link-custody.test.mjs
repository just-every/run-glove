import { scenario } from '../fixtures/scenario.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, business, assertTrail, mailEvents } from './harness.mjs'
import { textOf } from '../fixtures/mail-providers.mjs'
import { documentPhoto } from '../fixtures/document-images.mjs'

const at = '2030-02-28T18:00:00.000Z'
const lines = [{ description: 'Condenser inspection', quantity: '1', unitPrice: '189.00', tax: 'FREE' }]
const draft = (h, b, extra = {}) => h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Condenser inspection', lines, ...extra })
const approve = (h, q) => h.command('quote.approve', { quoteId: q.id, version: q.version, revision: q.revisions.at(-1).n })
const issue = (h, q, extra = {}, opts) => h.command('quote.link', { quoteId: q.id, version: q.version, ...extra }, opts)
const read = (h, token) => h.request('/api/glove/public/quote', { as: '', headers: { authorization: `Bearer ${token}` } })
const respond = (h, token, action, extra = {}) => h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { action, name: 'Mei Lin', capacity: 'Property manager', ...extra } })
const exportBusiness = h => h.request('/api/glove/export').then(r => r.json())
const quote = async (h, id) => (await h.state()).quotes.find(q => q.id === id)
const withoutBearer = (value, token, surface) => assert.equal(JSON.stringify(value).includes(token), false, `${surface} excludes the bearer`)

test('QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart', async t => {
  await scenario(t, 'QUOTE-009 bearer custody: issue once, hash at rest, header only, fragment email and clean durable surfaces after restart', async t => {
  const h = await installation({ at, captureLogs: true }); t.after(() => h.close())
  const b = await business(h)
  await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-140', eventKey: mailEvents('sendgrid').eventKey, fromEmail: ['office', 'example.test'].join('@') })
  const q = await approve(h, await draft(h, b)), commandId = randomUUID()
  const payload = { quoteId: q.id, version: q.version, email: true }
  const link = await h.command('quote.link', payload, { commandId })
  assert.match(link.token, /^glq_[A-Za-z0-9_-]{43}$/)
  assert.equal(Buffer.from(link.token.slice(4), 'base64url').length, 32)
  const secrets = (await h.db.prepare('SELECT * FROM glove_quote_secrets').all()).results
  assert.deepEqual(secrets, [{ link_id: link.id, hash: createHash('sha256').update(`glove-quote-link:${link.token}`).digest('hex') }])
  const sent = h.email.sent.at(-1)
  assert.ok(sent, 'the provider edge actually receives the quote email')
  const mail = textOf(sent), url = new URL(mail.match(/https:\/\/[^\s]+\/quote[^\s]*/)[0])
  assert.equal(url.pathname, '/quote'); assert.equal(url.search, '')
  assert.equal(url.hash, `#token=${link.token}`)
  assert.equal(mail.replace(url.href, '').includes(link.token), false, 'the email carries the bearer only in its fragment')
  assert.equal((await read(h, link.token)).status, 200)
  const before = await exportBusiness(h)
  for (const input of [
    { path: `/api/glove/public/quote?token=${link.token}` },
    { path: '/api/glove/public/quote', headers: { cookie: `token=${link.token}` } },
    { path: '/api/glove/public/quote', method: 'POST', body: { action: 'changes', token: link.token, message: 'Do not record this' } },
    { path: `/api/glove/public/quote?token=${link.token}`, headers: { authorization: `Bearer ${link.token}` } },
  ]) {
    const { path, ...options } = input
    assert.equal((await h.request(path, { as: '', ...options })).status, 404, 'non-header credential does not open the public door')
  }
  const bodyToken = await h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body: { action: 'changes', token: link.token, message: 'Do not record this' } })
  assert.equal(bodyToken.status, 400, 'even an authorized request refuses a body credential')
  assert.deepEqual(await exportBusiness(h), before, 'refused credentials change no business data')
  assert.equal((await respond(h, link.token, 'changes', { message: 'Please confirm access with reception.' })).status, 200)
  const persisted = await exportBusiness(h), sentCount = h.email.sent.length
  await h.restart()
  const replay = await h.command('quote.link', payload, { commandId })
  assert.equal(replay.token, undefined)
  assert.equal(replay.id, link.id)
  assert.equal(h.email.sent.length, sentCount, 'issuance replay sends no second email')
  assert.deepEqual(await exportBusiness(h), persisted)
  assert.equal((await read(h, link.token)).status, 200, 'only restart, rather than restore, retains the issued credential')
  const { activity, exported } = await assertTrail(h, ['quote.linkIssued', 'quote.customer.changes'])
  const event = activity.find(e => e.kind === 'quote.linkIssued')
  assert.deepEqual([event.actorName, event.actorRole, event.commandId, event.at], ['Olivia Owner', 'owner', commandId, at])
  for (const [surface, value] of Object.entries({ replay, activity, exported, state: await h.state(), commands: (await h.db.prepare('SELECT * FROM glove_commands').all()).results, records: (await h.db.prepare('SELECT * FROM glove_records').all()).results, events: (await h.db.prepare('SELECT * FROM glove_events').all()).results })) withoutBearer(value, link.token, surface)
  assert.ok(h.logs.length, 'Worker log capture is active')
  withoutBearer(h.logs, link.token, 'captured Worker logs')
  const replacement = await issue(h, await quote(h, q.id))
  assert.equal((await read(h, link.token)).status, 404)
  assert.equal((await read(h, replacement.token)).status, 200)
  const replacementRecord = (await h.state()).quoteLinks.find(l => l.id === replacement.id)
  await h.command('quote.linkRevoke', { linkId: replacement.id, version: replacementRecord.version })
  await h.restart()
  assert.equal((await read(h, replacement.token)).status, 404)
  const revokedSnapshot = await exportBusiness(h), emailsBeforeReplay = h.email.sent.length
  const revokedReplay = await h.command('quote.link', { quoteId: q.id, version: q.version, email: true }, { commandId })
  assert.equal(revokedReplay.token, undefined)
  assert.equal(h.email.sent.length, emailsBeforeReplay)
  assert.deepEqual(await exportBusiness(h), revokedSnapshot, 'a captured issuance cannot recreate a revoked link')
  assert.equal((await respond(h, replacement.token, 'decline')).status, 404, 'replay cannot revive revoked authority')
})
  await scenario(t, 'QUOTE-009 superseded links disclose no document and refuse every customer action across restart', async t => {
  const h = await installation({ at }); t.after(() => h.close()); const b = await business(h)
  let q = await approve(h, await draft(h, b)), old = await issue(h, q)
  q = await h.command('quote.revise', { quoteId: q.id, version: q.version, lines, validUntil: '2030-03-31' })
  q = await approve(h, q); const current = await issue(h, q), before = await exportBusiness(h)
  await h.restart()
  const response = await read(h, old.token), view = await response.json()
  assert.equal(response.status, 200)
  assert.deepEqual(view, { state: 'superseded', message: 'A newer revision was sent. Ask the business for its current link.' })
  for (const action of ['choose', 'changes', 'decline', 'update', 'approve', 'financing']) {
    const refused = await respond(h, old.token, action, { message: 'Use the earlier price', choice: { optionId: 'option-1', addOnIds: [] } })
    assert.equal(refused.status, 409, action)
    assert.deepEqual((await refused.json()).error, { code: 'REVISION', message: view.message })
  }
  assert.deepEqual(await exportBusiness(h), before, 'superseded requests record no decision or data change')
  const live = await (await read(h, current.token)).json()
  assert.equal(live.state, 'open'); assert.equal(live.document.revision, 2)
  await assertTrail(h, ['quote.revised', 'quote.linkIssued'])
})
  await scenario(t, 'QUOTE-009 expired revisions remain readable with exactly one update until the link expiry instant', async t => {
  const h = await installation({ at }); t.after(() => h.close()); const b = await business(h)
  const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Inspect condenser', source: 'phone' })
  let q = await approve(h, await draft(h, b, { enquiryId: enquiry.id, validUntil: '2030-02-28' }))
  const first = await issue(h, q)
  await h.setTime('2030-03-01T00:00:00.000Z')
  let view = await (await read(h, first.token)).json()
  assert.equal(view.state, 'expired'); assert.equal(view.documentHash, first.documentHash); assert.equal(view.updateRequested, false)
  for (const action of ['choose', 'changes', 'decline', 'approve', 'financing']) {
    const response = await respond(h, first.token, action, { message: 'No expired decision' })
    assert.equal(response.status, 409); assert.equal((await response.json()).error.code, 'EXPIRED')
  }
  const responses = await Promise.all([respond(h, first.token, 'update'), respond(h, first.token, 'update')])
  for (const response of responses) { assert.equal(response.status, 200); assert.equal((await response.json()).updateRequested, true) }
  await h.restart()
  assert.equal((await respond(h, first.token, 'update')).status, 200)
  let state = await h.state(), record = state.quotes.find(x => x.id === q.id)
  assert.equal(record.customerRequests.filter(x => x.revision === 1 && x.action === 'update').length, 1)
  assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 1)
  assert.equal(state.enquiries.find(e => e.id === enquiry.id).status, 'contacted')
  const reissued = await issue(h, record)
  assert.equal((await read(h, first.token)).status, 404)
  assert.equal((await (await read(h, reissued.token)).json()).updateRequested, true, 'reissuing a link cannot reset the revision update request')
  assert.equal((await respond(h, reissued.token, 'update')).status, 200)
  assert.equal((await quote(h, q.id)).customerRequests.length, 1)
  q = await h.command('quote.revise', { quoteId: q.id, version: record.version, lines, validUntil: '2030-02-28' })
  q = await approve(h, q); const next = await issue(h, q)
  await h.setTime('2030-05-29T13:59:59.999Z')
  view = await (await read(h, next.token)).json()
  assert.equal(view.state, 'expired'); assert.equal(view.updateRequested, false)
  assert.equal((await respond(h, next.token, 'update')).status, 200, 'a later revision gets its own single request at the last live instant')
  await h.setTime('2030-05-29T14:00:00.000Z')
  assert.equal((await read(h, next.token)).status, 404)
  assert.equal((await respond(h, next.token, 'update')).status, 404)
  await h.restart()
  assert.equal((await read(h, next.token)).status, 404)
  await h.setTime('2030-03-01T00:00:00.000Z')
  state = await h.state(); record = state.quotes.find(x => x.id === q.id)
  assert.deepEqual(record.customerRequests.map(x => [x.revision, x.action]), [[1, 'update'], [2, 'update']])
  assert.equal(state.notices.filter(n => n.quoteId === q.id).length, 2)
  const { activity, exported } = await assertTrail(h, ['quote.customer.update'])
  assert.equal(activity.filter(e => e.kind === 'quote.customer.update').length, 2)
  assert.equal(exported.timeline.filter(e => e.kind === 'quote.customer.update').length, 2)
})
  await scenario(t, 'QUOTE-009 owner validity boundaries and default changes affect only later revisions', async t => {
  const h = await installation({ at }); t.after(() => h.close()); const b = await business(h)
  let q = await approve(h, await draft(h, b)), original = structuredClone(q.revisions[0]), link = await issue(h, q)
  assert.equal(original.validUntil, '2030-03-31', 'Sydney March 1 plus the untouched 30-day default')
  const before = await exportBusiness(h)
  for (const person of [b.office, b.dispatcher]) await person.run('quote.validity', { days: 5 }, { error: 'FORBIDDEN' })
  for (const days of [0, 3651, 1.5, '30', null]) await h.command('quote.validity', { days }, { error: 'INPUT' })
  assert.deepEqual(await exportBusiness(h), before)
  const integration = await h.command('token.issue', { name: 'Synthetic quote integration', role: 'dispatcher' })
  const denied = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${integration.token}` }, body: { commandId: randomUUID(), type: 'quote.validity', payload: { days: 5 } } })
  assert.equal(denied.status, 403); assert.equal((await denied.json()).error.code, 'FORBIDDEN')
  for (const [days, validUntil] of [[1, '2030-03-02'], [3650, '2040-02-27']]) {
    await h.command('quote.validity', { days })
    const next = await draft(h, b)
    assert.equal(next.revisions[0].validUntil, validUntil)
    assert.deepEqual((await quote(h, q.id)).revisions[0], original)
    assert.deepEqual((await h.state()).quoteLinks.find(l => l.id === link.id), Object.fromEntries(Object.entries(link).filter(([k]) => k !== 'token')))
  }
  await h.command('quote.validity', { days: 1 })
  const commandId = randomUUID(), payload = { quoteId: q.id, version: q.version, lines }
  q = await h.command('quote.revise', payload, { commandId })
  assert.deepEqual(q.revisions[0], original); assert.equal(q.revisions[1].validUntil, '2030-03-02')
  await h.restart()
  assert.deepEqual(await h.command('quote.revise', payload, { commandId }), q)
  assert.equal((await h.state()).business[0].quoteValidityDays, 1)
  await assertTrail(h, ['quote.validity', 'quote.revised'])
})
  await scenario(t, 'QUOTE-009 real dates and frozen Chicago midnight govern approval and the ninety-day reading window', async t => {
  const h = await installation({ at }); t.after(() => h.close()); const b = await business(h)
  const branch = await h.command('branch.save', { name: 'Chicago', prefix: 'CHI', timezone: 'America/Chicago', zips: [] })
  const customer = await h.command('customer.save', { name: 'Chicago Dental' })
  const site = await h.command('site.save', { customerId: customer.id, branchId: branch.id, address: '18 Lake Street, Chicago IL 60601' })
  const chicago = { customer, site }, before = await exportBusiness(h)
  await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Impossible date', lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
  assert.deepEqual(await exportBusiness(h), before)
  let first = await draft(h, chicago, { validUntil: '2030-02-28' })
  await h.command('quote.revise', { quoteId: first.id, version: first.version, lines, validUntil: '2026-02-30' }, { error: 'INPUT' })
  first = await approve(h, first)
  const second = await approve(h, await draft(h, chicago, { validUntil: '2030-02-28' }))
  assert.equal((await h.state()).business[0].timezone, 'Australia/Sydney')
  for (const q of [first, second]) assert.deepEqual([q.revisions[0].validUntil, q.revisions[0].validityZone, q.revisions[0].validTo, q.revisions[0].linkExpiresAt], ['2030-02-28', 'America/Chicago', '2030-03-01T06:00:00.000Z', '2030-05-30T05:00:00.000Z'])
  const live = await issue(h, first), expiring = await issue(h, second)
  await h.command('branch.save', { ...(await h.state()).branches.find(x => x.id === branch.id), timezone: 'America/Phoenix' })
  await h.command('quote.consent', { version: (await h.state()).business[0].version, accept: true, text: 'Synthetic owner disclosure for boundary testing; identity remains claimed.' })
  const choice = { optionId: 'option-1', addOnIds: [] }
  const selection = await (await respond(h, live.token, 'choose', { choice })).json()
  const answer = { choice, documentHash: live.documentHash, selectionHash: selection.selection.hash, consent: { version: selection.disclosure.version, hash: selection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'Mei Lin' } }
  await h.setTime('2030-03-01T05:59:59.999Z'); await h.restart()
  assert.equal((await (await read(h, live.token)).json()).state, 'open')
  assert.equal((await respond(h, live.token, 'approve', answer)).status, 200, 'approval succeeds at the last Chicago instant of the validity date')
  assert.equal((await quote(h, first.id)).acceptance.signing.at, '2030-03-01T05:59:59.999Z')
  await h.setTime('2030-03-01T06:00:00.000Z')
  const expired = await read(h, expiring.token)
  assert.equal((await expired.json()).state, 'expired')
  const refused = await respond(h, expiring.token, 'approve', { ...answer, documentHash: expiring.documentHash })
  assert.equal(refused.status, 409); assert.equal((await refused.json()).error.code, 'EXPIRED')
  const snapshot = await exportBusiness(h)
  await h.setTime('2030-05-30T04:59:59.999Z')
  assert.equal((await read(h, expiring.token)).status, 200, 'DST-adjusted midnight, rather than ninety UTC days, ends the reading window')
  await h.setTime('2030-05-30T05:00:00.000Z'); await h.restart()
  for (const token of [live.token, expiring.token]) {
    assert.equal((await read(h, token)).status, 404)
    assert.equal((await respond(h, token, 'update')).status, 404)
  }
  await h.setTime('2030-03-01T06:00:00.000Z')
  assert.deepEqual(await exportBusiness(h), snapshot, 'expiry refuses without data changes')
  await assertTrail(h, ['quote.customer.approve', 'quote.consentAccepted'])
})
  await scenario(t, 'QUOTE-009 pre-validity Worker upgrade requires revision and fresh price approval before issuing a link', async t => {
  let legacy = true
  const h = await installation({ at, workerPlugins: [{ name: 'pre-validity-quotes', setup(build) {
    // Build the earlier command implementation without its later validity
    // fields; all pricing, approval, persistence and HTTP doors stay real.
    build.onLoad({ filter: /\/commands\/quotes\.ts$/ }, async args => {
      if (!legacy) return undefined
      const source = await readFile(args.path, 'utf8'), addition = '...quoteValidity(c, record, p.validUntil), '
      assert.ok(source.includes(addition), 'the era build removes the actual validity addition')
      return { contents: source.replace("import { quoteValidity } from '../quote-validity'\n", '').replace(addition, ''), loader: 'ts', resolveDir: dirname(args.path) }
    })
  } }] }); t.after(() => h.close()); const b = await business(h)
  const old = await approve(h, await draft(h, b))
  assert.equal(old.revisions[0].validUntil, undefined)
  const before = await exportBusiness(h)
  legacy = false; await h.restart({ rebuild: true })
  assert.deepEqual(await exportBusiness(h), before, 'upgrade preserves the actual earlier-build revision')
  await issue(h, old, {}, { error: 'VALIDITY' })
  assert.equal((await h.state()).quoteLinks.length, 0)
  const commandId = randomUUID(), payload = { quoteId: old.id, version: old.version, lines }
  const revised = await h.command('quote.revise', payload, { commandId })
  assert.deepEqual(revised.revisions[0], old.revisions[0]); assert.equal(revised.revisions[1].validUntil, '2030-03-31')
  await issue(h, revised, {}, { error: 'NOT_APPROVED' })
  const approved = await approve(h, revised), link = await issue(h, approved)
  const persisted = await exportBusiness(h)
  await h.restart()
  assert.deepEqual(await h.command('quote.revise', payload, { commandId }), revised)
  assert.deepEqual(await exportBusiness(h), persisted)
  const view = await (await read(h, link.token)).json()
  assert.equal(view.document.revision, 2); assert.equal(view.documentHash, link.documentHash)
  await assertTrail(h, ['quote.revised', 'quote.approved', 'quote.linkIssued'])
})
  await scenario(t, 'QUOTE-013 point 3: reissue for an accepted or declined quote is read-only and keeps the document the decision was made on', async t => {
  const h = await installation({ at, captureLogs: true }); t.after(() => h.close()); const b = await business(h)
  await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-232', eventKey: mailEvents('sendgrid').eventKey, fromEmail: ['office', 'example.test'].join('@') })
  await h.command('quote.consent', { version: (await h.state()).business[0].version, accept: true, text: 'Synthetic owner disclosure: the chosen work and claimed signature are recorded; identity is unverified.' })
  const line = (description, unitPrice) => ({ description, quantity: '2', unitPrice, tax: 'FREE' })
  const options = [{ name: 'Good', lines: [line('Good inspection', '80.00')] }, { name: 'Better', lines: [line('Better inspection', '101.23')] }]
  const addOns = [{ name: 'Filter', lines: [{ description: 'Filter pack', quantity: '3', unitPrice: '12.34', tax: 'FREE' }] }]
  const choice = { optionId: 'option-2', addOnIds: ['addon-1'] }
  const drawn = { kind: 'drawn', width: 600, height: 200, strokes: [[[20, 80], [70, 30], [100, 100], [180, 50]]] }
  const photo = caption => ({ mediaType: 'image/png', base64: documentPhoto, caption })
  const staffAnswer = async (type, q, extra) => h.command(type, { quoteId: q.id, version: (await quote(h, q.id)).version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', ...extra })
  const deciders = {
    'online signature': { status: 'accepted', run: async (q, earlier) => {
      const selection = await (await respond(h, earlier.token, 'choose', { choice })).json()
      const signed = await respond(h, earlier.token, 'approve', { choice, documentHash: earlier.documentHash, selectionHash: selection.selection.hash, consent: { version: selection.disclosure.version, hash: selection.disclosure.hash, affirmed: true }, signature: drawn })
      assert.equal(signed.status, 200) } },
    'staff acceptance': { status: 'accepted', run: q => staffAnswer('quote.accept', q, { choice, note: 'Accepted by phone' }) },
    'customer decline': { status: 'declined', run: async (q, earlier) => assert.equal((await respond(h, earlier.token, 'decline', { message: 'Too expensive' })).status, 200) },
    'staff decline': { status: 'declined', run: q => staffAnswer('quote.decline', q, { note: 'Going elsewhere' }) },
  }
  const tokens = [], decided = []
  for (const [name, flow] of Object.entries(deciders)) {
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: `Decided by ${name}`, options, addOns })
    q = await h.command('document.photo', { kind: 'quote', id: q.id, version: q.version, photo: photo('Original condenser photo') })
    const earlier = await issue(h, await approve(h, q)); tokens.push(earlier.token)
    await flow.run(q, earlier)
    const kept = await quote(h, q.id), copy = kept.acceptance?.signing ? await (await h.request('/api/glove/public/quote/signed', { as: '', headers: { authorization: `Bearer ${earlier.token}` } })).text() : null
    assert.equal(kept.status, flow.status, name)
    decided.push({ name, id: q.id, status: flow.status, earlier, copy, jobs: (await h.state()).jobs.length })
  }
  // The business then edits everything a rebuilt customer document would read.
  let state = await h.state()
  await h.command('business.save', { ...state.business[0], name: 'Later business identity', legalName: 'Later Legal Pty', phone: '02 9000 0000', address: '1 Later Street, Sydney NSW 2000' })
  await h.command('site.save', { ...state.sites.find(x => x.id === b.site.id), address: '99 Later Road, Newtown NSW 2042' })
  await h.command('service.save', { ...state.services.find(x => x.id === b.service.id), name: 'Later service name', unitPrice: '999.00', description: 'Later price book description' })
  await h.command('document.template', { kind: 'quote', version: (await h.state()).business[0].version, heading: 'Later heading', terms: 'Later document terms', footer: 'Later footer' })
  for (const d of decided) await h.command('document.photo', { kind: 'quote', id: d.id, version: (await quote(h, d.id)).version, photo: photo('Later photo added after the decision') })
  state = await h.state()
  assert.deepEqual([state.business[0].name, state.sites.find(x => x.id === b.site.id).address], ['Later business identity', '99 Later Road, Newtown NSW 2042'])
  const people = [['Olivia Owner', 'owner', (type, payload, opts) => h.command(type, payload, opts)], ['Sam Ortiz', 'dispatcher', b.dispatcher.run], ['Olu Office', 'office', b.office.run]]
  const customerActions = ['choose', 'changes', 'decline', 'update', 'approve']
  for (const d of decided) {
    const original = await quote(h, d.id), issued = [], frozenView = d.earlier.document
    let previous = d.earlier.token
    for (const [name, role, run] of people) for (const email of [false, true]) {
      const before = await quote(h, d.id), sentBefore = h.email.sent.length, commandId = randomUUID()
      const payload = { quoteId: d.id, version: before.version, ...(email ? { email: true } : {}) }
      const link = await run('quote.link', payload, { commandId }); tokens.push(link.token)
      const label = `${d.name} reissued by ${role}${email ? ' with email' : ''}`
      assert.equal(h.email.sent.length, sentBefore + (email ? 1 : 0), label)
      assert.deepEqual(link.document, frozenView, `${label} keeps the decided document`); assert.equal(link.documentHash, d.earlier.documentHash, label)
      const view = await (await read(h, link.token)).json()
      assert.deepEqual([view.state, view.decision, view.signingAvailable, view.documentHash], ['decided', d.status, false, d.earlier.documentHash], label)
      assert.deepEqual(view.document, frozenView, `${label} reads the document the decision was made on`)
      assert.notEqual(view.document.business.name, 'Later business identity'); assert.notEqual(view.document.site.address, '99 Later Road, Newtown NSW 2042')
      assert.equal(view.document.photos.length, 1, `${label} omits the photo added after the decision`)
      assert.equal((await read(h, previous)).status, 404, `${label} revokes the earlier live link`)
      assert.equal((await respond(h, previous, 'update')).status, 404)
      const after = await quote(h, d.id)
      assert.deepEqual([after.status, after.revisions, after.acceptance, after.declined, after.customerRequests], [original.status, original.revisions, original.acceptance, original.declined, original.customerRequests], `${label} leaves the decision records unchanged`)
      assert.equal(after.revisions.length, 1); assert.equal((await h.state()).jobs.length, d.jobs)
      const copy = await h.request('/api/glove/public/quote/signed', { as: '', headers: { authorization: `Bearer ${link.token}` } })
      if (d.copy) { assert.equal(copy.status, 200); assert.equal(await copy.text(), d.copy, `${label} serves the exact signed copy`) } else assert.equal(copy.status, 404)
      const snapshot = await exportBusiness(h)
      for (const action of customerActions) {
        const answered = await respond(h, link.token, action, { message: 'A late answer', choice: { optionId: 'option-1', addOnIds: [] } })
        assert.equal(answered.status, 200, `${label} ${action}`)
        const result = await answered.json()
        assert.deepEqual([result.state, result.decision, result.documentHash], ['decided', d.status, d.earlier.documentHash], `${label} ${action}`)
        assert.deepEqual(await exportBusiness(h), snapshot, `${label}: ${action} changes no quote, revision, acceptance, signature, signed copy or request record`)
      }
      issued.push({ payload, commandId, link, name, role, run }); previous = link.token
    }
    const last = issued.at(-1).link, persisted = await exportBusiness(h), lastView = await (await read(h, last.token)).json(), emails = h.email.sent.length
    await h.restart()
    assert.deepEqual(await (await read(h, last.token)).json(), lastView, `${d.name}: the decided page is identical after a Worker restart`)
    for (const earlierIssue of issued) {
      const replay = await earlierIssue.run('quote.link', earlierIssue.payload, { commandId: earlierIssue.commandId })
      assert.equal(replay.token, undefined); assert.equal(replay.id, earlierIssue.link.id)
    }
    assert.equal(h.email.sent.length, emails, 'issuance replay sends no second email')
    assert.deepEqual(await exportBusiness(h), persisted, `${d.name}: command replay recreates and changes nothing`)
    assert.equal((await read(h, last.token)).status, 200)
    for (const dropped of issued.slice(0, -1)) assert.equal((await read(h, dropped.link.token)).status, 404, `${d.name}: a replay cannot revive a revoked reissue`)
    const { exported: trail } = await assertTrail(h, ['quote.linkIssued'])
    const mine = trail.timeline.filter(e => e.kind === 'quote.linkIssued' && e.subject_id === d.id).slice(1)
    assert.deepEqual(mine.map(e => [e.actor_name, e.actor_role]), issued.map(i => [i.name, i.role]), `${d.name}: every reissue is attributable in Activity and export`)
    assert.deepEqual(mine.map(e => JSON.parse(e.data).documentHash), issued.map(() => d.earlier.documentHash))
  }
  const { activity, exported } = await assertTrail(h, ['quote.linkIssued', 'quote.accepted', 'quote.declined', 'quote.customer.approve', 'quote.customer.decline', 'document.photo'])
  assert.equal(activity.filter(e => e.kind === 'quote.linkIssued').length, 4 * 7)
  for (const [surface, value] of Object.entries({ activity, exported, state: await h.state(), commands: (await h.db.prepare('SELECT * FROM glove_commands').all()).results, records: (await h.db.prepare('SELECT * FROM glove_records').all()).results, events: (await h.db.prepare('SELECT * FROM glove_events').all()).results, mail: h.email.sent.map(textOf).map(m => m.replace(/#token=glq_[A-Za-z0-9_-]{43}/g, '#token=') ) })) for (const token of tokens) withoutBearer(value, token, surface)
  for (const token of tokens) withoutBearer(h.logs, token, 'captured Worker logs')
})
})
