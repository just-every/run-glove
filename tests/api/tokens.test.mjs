import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation, business, id } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

// API-002 (token half; ct approved 19 Oct 19:01Z): the owner issues scoped
// tokens shown once and kept only as SHA-256; a token acts as its role and
// branch through every door, never manages tokens, roles, grants or keys,
// is attributed in Activity, and stops on the request after revocation.

// A token call carries no cookie and, from a server, no Origin header.
const door = h => {
  const call = (token, path, body) => h.mf.dispatchFetch(h.origin + path, { method: body ? 'POST' : 'GET', redirect: 'manual', headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const send = async (token, type, payload, commandId = randomUUID()) => { const res = await call(token, '/api/glove/commands', { commandId, type, payload }); return { status: res.status, body: await res.json() } }
  return { call, send }
}

test('API-002, API-006, API-007: a dispatcher-scoped token is refused an owner command and stops once revoked', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { call, send } = door(h)

  await b.dispatcher.run('token.issue', { name: 'Zap', role: 'dispatcher' }, { error: 'FORBIDDEN' })
  await h.command('token.issue', { name: 'Owner token', role: 'owner' }, { error: 'INPUT' })
  await h.command('token.issue', { name: 'Field token', role: 'technician' }, { error: 'INPUT' })
  const issueId = randomUUID()
  const issued = await h.command('token.issue', { name: 'Crank sync', role: 'dispatcher' }, { commandId: issueId })
  assert.match(issued.token, /^glv_[A-Za-z0-9_-]{43}$/)
  // Shown once: the stored row and the saved outcome hold only the digest; a replay never returns the token.
  const row = await h.db.prepare('SELECT hash FROM glove_tokens WHERE id=?').bind(issued.id).first()
  assert.equal(row.hash, createHash('sha256').update(`glove-token:${issued.token}`).digest('hex'))
  const dump = JSON.stringify((await h.db.prepare('SELECT * FROM glove_commands').all()).results) + JSON.stringify((await h.db.prepare('SELECT * FROM glove_events').all()).results)
  assert.ok(!dump.includes(issued.token))
  assert.equal((await h.command('token.issue', { name: 'Crank sync', role: 'dispatcher' }, { commandId: issueId })).token, undefined)
  assert.ok(!JSON.stringify(await (await h.request('/api/glove/export')).json()).includes(row.hash))

  // The token reads and acts as a Dispatcher, attributed under its own name.
  const read = await call(issued.token, '/api/glove/state')
  assert.equal(read.status, 200)
  const seen = await read.json()
  assert.deepEqual([seen.actor.role, seen.actor.name], ['dispatcher', 'Crank sync (integration token)'])
  assert.equal(seen.integrationTokens.length, 0)
  const drafted = await send(issued.token, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Token quote', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  assert.equal(drafted.status, 200, JSON.stringify(drafted.body))
  const activity = (await (await h.request('/api/glove/activity')).json()).events
  assert.ok(activity.some(e => e.subjectId === drafted.body.result.id && e.actorName === 'Crank sync (integration token)' && e.actorRole === 'dispatcher'))
  assert.ok(activity.some(e => e.kind === 'token.issued' && /issued integration token "Crank sync" acting as dispatcher/.test(e.summary)))

  // Refused every owner command, and never manages tokens, roles, grants or keys.
  for (const [type, payload] of [['payment.autopayAuthorize', {}], ['payment.autopayRevoke', {}], ['payment.autopayCharge', {}], ['customer.hubPreview', {}], ['business.save', { name: 'Taken over' }], ['token.issue', { name: 'Escalate', role: 'dispatcher' }], ['token.revoke', { tokenId: issued.id }], ['role.set', { operatorId: b.office.id, role: 'dispatcher' }], ['grant.create', { agentId: b.agent.id, action: 'visit.book' }], ['model.connect', { url: 'https://models.example.test/v1', model: 'm', key: 'k' }]]) {
    const refused = await send(issued.token, type, payload)
    assert.deepEqual([refused.status, refused.body.error.code], [403, 'FORBIDDEN'], type)
  }
  assert.equal((await call(issued.token, '/api/glove/reports/1099.json?year=2026')).status, 403)

  // A custom-role token follows the role's current permissions.
  const csr = await h.command('role.save', { name: 'Intake', permissions: ['customer.save'] })
  const intake = await h.command('token.issue', { name: 'Web form', role: `custom:${csr.id}` })
  assert.equal((await send(intake.token, 'customer.save', { name: 'Form Lead' })).status, 200)
  await h.command('role.save', { id: csr.id, version: csr.version, name: 'Intake', permissions: ['enquiry.create'] })
  assert.equal((await send(intake.token, 'customer.save', { name: 'Second Lead' })).body.error.code, 'FORBIDDEN')

  // A branch-limited token reads and writes only that branch's records.
  const raleigh = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: ['27601'] })
  const school = await h.command('customer.save', { name: 'Raleigh School' })
  await h.command('site.save', { customerId: school.id, address: '101 Fayetteville St, Raleigh NC 27601', branchId: raleigh.id })
  const scoped = await h.command('token.issue', { name: 'Raleigh board', role: 'viewer', branchId: raleigh.id })
  const branchView = await (await call(scoped.token, '/api/glove/state')).json()
  assert.deepEqual(branchView.customers.map(c => c.name), ['Raleigh School'])
  await h.command('token.issue', { name: 'Nowhere', role: 'viewer', branchId: 'no-such-branch' }, { error: 'INPUT' })

  // The owner lists tokens without secrets; revoking stops the next request.
  const listed = (await h.state()).integrationTokens
  assert.deepEqual(listed.map(x => x.name), ['Crank sync', 'Web form', 'Raleigh board'])
  assert.ok(listed[0].lastUsedAt)
  assert.ok(!JSON.stringify(listed).includes('glv_') && !('hash' in listed[0]))
  await h.command('token.revoke', { tokenId: issued.id })
  const after = await call(issued.token, '/api/glove/state')
  assert.deepEqual([after.status, (await after.json()).error.code], [401, 'AUTH'])
  assert.equal((await send(issued.token, 'customer.save', { name: 'After revoke' })).status, 401)
  assert.equal((await call('glv_' + 'A'.repeat(43), '/api/glove/state')).status, 401)
  assert.ok((await h.state()).events.some(e => e.kind === 'token.revoked'))

  // API-006 point 3: a workflow rule a token created runs as that token's current role and branch.
  await scenario(t, 'API-006 point 3: token-created rules run as the token\'s current role and branch and are logged "not allowed" once it is revoked', async ({ after }) => {
    const h = await installation({ at: '2026-11-05T12:00:00Z' })
    after(() => h.close())
    const b = await business(h)
    const { call, send } = door(h)
    const raleigh = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: ['27601'] })
    const school = await h.command('customer.save', { name: 'Raleigh School' })
    const schoolSite = await h.command('site.save', { customerId: school.id, address: '101 Fayetteville St, Raleigh NC 27601', branchId: raleigh.id })
    const ellaPerson = await h.person('Ella Ellis', 'technician')
    const ella = await h.command('technician.save', { name: 'Ella E.', operatorId: ellaPerson.id, branchId: raleigh.id })
    const places = { main: { customer: b.customer, site: b.site, tech: b.priya, person: b.priyaPerson }, ral: { customer: school, site: schoolSite, tech: ella, person: ellaPerson } }

    // Three tokens: an unrestricted Office token, a Raleigh-limited Office token and a custom role holding three permissions.
    const custom = await h.command('role.save', { name: 'Rule runner', permissions: ['rule.save', 'enquiry.cost', 'invoice.prepare'] })
    const issue = async (name, body) => ({ name, ...(await h.command('token.issue', { name, ...body })) })
    const tokens = { office: await issue('Office sync', { role: 'office' }), ral: await issue('Raleigh office sync', { role: 'office', branchId: raleigh.id }), custom: await issue('Custom runner', { role: `custom:${custom.id}` }) }
    const costs = { office: ['phone', '11.00', b.priya], ral: ['website', '22.00', ella], custom: ['referral', '33.00', null] }
    const ruleIds = new Map()
    for (const [key, token] of Object.entries(tokens)) {
      const [source, amount, tech] = costs[key]
      const rules = [
        [`${key} notify`, 'enquiry.created', null, { kind: 'notify', to: 'owner', message: `${key} saw a request` }],
        [`${key} cost`, 'enquiry.created', { source }, { kind: 'leadCost', amount }],
        [`${key} assign`, 'job.completed', null, { kind: 'assign', personId: b.office.id }],
        ...(tech ? [[`${key} book`, 'job.created', null, { kind: 'book', technicianId: tech.id, afterDays: 2, start: '08:00', end: '09:00' }]] : []),
      ]
      for (const [name, trigger, condition, action] of rules) {
        const saved = await send(token.token, 'rule.save', { name, trigger, ...(condition ? { condition } : {}), action })
        assert.equal(saved.status, 200, `${name}: ${JSON.stringify(saved.body)}`)
        assert.equal(saved.body.result.createdBy.name, `${token.name} (integration token)`)
        ruleIds.set(saved.body.result.id, name)
      }
    }
    assert.equal(ruleIds.size, 11)

    // Independently enumerated requests and jobs in two branches, each remembered with the command that made it.
    const label = new Map(), commands = []
    const run = async (person, type, payload, name) => {
      const commandId = id()
      const result = await person.run(type, payload, { commandId })
      commands.push({ person, type, payload, commandId, result })
      if (name) label.set(result.id, name)
      return result
    }
    const request = (place, source, tag) => run(b.office, 'enquiry.create', { customerId: places[place].customer.id, siteId: places[place].site.id, source, description: `${tag} ${place} ${source}` }, `${tag} ${place}:${source}`)
    const job = async (place, date, tag) => {
      const x = places[place]
      const q = await run(b.dispatcher, 'quote.draft', { customerId: x.customer.id, siteId: x.site.id, title: `${tag} ${place} service`, lines: [{ description: 'Inspection', quantity: '1', unitPrice: '189.00', tax: 'FREE' }] })
      const approved = await run(b.dispatcher, 'quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      const accepted = await run(b.dispatcher, 'quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Site contact' })
      const created = await run(b.dispatcher, 'job.create', { quoteId: accepted.id }, `${tag} ${place} job`)
      const visit = await run(b.dispatcher, 'visit.book', { jobId: created.id, technicianId: x.tech.id, date, start: '09:00', end: '10:00' })
      await run(x.person, 'visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await run(x.person, 'visit.complete', { visitId: visit.id, deviceTime: visit.startAt, summary: 'Unit inspected', signoff: { absentReason: 'Office closed' } })
      return created
    }
    const sources = ['phone', 'website', 'referral']
    for (const place of ['main', 'ral']) for (const source of sources) await request(place, source, 'first')
    await job('main', '2026-10-20', 'first'); await job('ral', '2026-10-21', 'first')

    const observe = async () => {
      const s = await h.state(), mine = x => label.get(x)
      return {
        runs: s.ruleRuns.map(r => [r.rule, mine(r.trigger.subjectId), r.outcome]).sort(),
        costs: s.enquiries.filter(e => label.has(e.id)).map(e => [mine(e.id), e.leadCost?.amount ?? null, e.leadCost?.rule ?? null]).sort(),
        notices: [...s.notices, ...(await b.office.state()).notices].filter(n => n.ruleId).map(n => [n.to.join(), mine(n.subjectId ?? n.jobId), n.message]).sort(),
        assignees: s.jobs.filter(j => label.has(j.id)).map(j => [mine(j.id), j.invoiceAssignee?.name ?? null]).sort(),
        visits: s.visits.filter(v => label.has(v.jobId)).map(v => [mine(v.jobId), v.assignments[0].reason]).sort(),
      }
    }
    const first = await observe()
    const ran = (rows, tag) => rows.filter(r => r[1]?.startsWith(tag))
    const labels = tag => sources.flatMap(s => ['main', 'ral'].map(p => `${tag} ${p}:${s}`))
    assert.equal(labels('first').length, 6)
    // Requests: the unrestricted Office token's notice reaches both branches, the Raleigh token's only Raleigh;
    // the custom role holds no desk role, so its notice is refused while its lead cost (permitted) applies.
    assert.deepEqual(ran(first.runs, 'first').filter(r => /notify$/.test(r[0])), [
      ...labels('first').map(l => ['custom notify', l, 'not allowed']),
      ...labels('first').map(l => ['office notify', l, 'done']),
      ...labels('first').filter(l => l.includes(' ral:')).map(l => ['ral notify', l, 'done']),
    ].sort())
    assert.deepEqual(first.costs.filter(r => r[0].startsWith('first')), [
      ['first main:phone', '11.00', 'office cost'], ['first main:referral', '33.00', 'custom cost'], ['first main:website', null, null],
      ['first ral:phone', '11.00', 'office cost'], ['first ral:referral', '33.00', 'custom cost'], ['first ral:website', '22.00', 'ral cost'],
    ])
    assert.deepEqual(first.runs.filter(r => /cost$/.test(r[0])), [
      ['custom cost', 'first main:referral', 'done'], ['custom cost', 'first ral:referral', 'done'],
      ['office cost', 'first main:phone', 'done'], ['office cost', 'first ral:phone', 'done'], ['ral cost', 'first ral:website', 'done'],
    ])
    // Jobs: an Office token's book rule stays refused under API-005's standing ban, and no visit comes from a rule.
    assert.deepEqual(first.runs.filter(r => /book$/.test(r[0])), [['office book', 'first main job', 'not allowed'], ['office book', 'first ral job', 'not allowed'], ['ral book', 'first ral job', 'not allowed']])
    assert.ok(first.visits.every(v => !v[1].startsWith('Booked by the rule')))
    assert.deepEqual(first.runs.filter(r => /assign$/.test(r[0])), [
      ['custom assign', 'first main job', 'done'], ['custom assign', 'first ral job', 'done'], ['office assign', 'first main job', 'done'], ['office assign', 'first ral job', 'done'], ['ral assign', 'first ral job', 'done'],
    ])
    assert.deepEqual(first.assignees.filter(r => r[0].startsWith('first')), [['first main job', 'Olu Office'], ['first ral job', 'Olu Office']])
    assert.equal(first.notices.filter(n => /prepare the invoice/.test(n[2])).length, 5)
    assert.equal(first.notices.filter(n => /saw a request/.test(n[2])).length, 9)

    // An Owner edit to the custom role governs the next run, one permission at a time.
    let edited = await h.command('role.save', { id: custom.id, version: custom.version, name: 'Rule runner', permissions: ['rule.save', 'invoice.prepare'] })
    const lost = await request('main', 'referral', 'edited')
    await request('ral', 'phone', 'edited')
    const afterEdit = await observe()
    assert.deepEqual(afterEdit.runs.filter(r => r[1]?.startsWith('edited') && r[0].endsWith('cost')), [['custom cost', 'edited main:referral', 'not allowed'], ['office cost', 'edited ral:phone', 'done']])
    assert.equal((await h.state()).ruleRuns.find(r => r.rule === 'custom cost' && r.trigger.subjectId === lost.id).detail, 'Your role (Rule runner) cannot enquiry.cost.')
    assert.deepEqual(afterEdit.costs.filter(r => r[0] === 'edited main:referral'), [['edited main:referral', null, null]])
    edited = await h.command('role.save', { id: custom.id, version: edited.version, name: 'Rule runner', permissions: ['rule.save'] })
    await job('main', '2026-10-22', 'edited'); await job('ral', '2026-10-23', 'edited')
    const afterJobs = await observe()
    assert.deepEqual(afterJobs.runs.filter(r => r[1]?.startsWith('edited') && r[0].endsWith('assign')), [
      ['custom assign', 'edited main job', 'not allowed'], ['custom assign', 'edited ral job', 'not allowed'], ['office assign', 'edited main job', 'done'], ['office assign', 'edited ral job', 'done'], ['ral assign', 'edited ral job', 'done'],
    ])

    // Revoking each token: every later trigger logs one "not allowed" run per rule and does nothing.
    for (const token of Object.values(tokens)) await h.command('token.revoke', { tokenId: token.id })
    for (const token of Object.values(tokens)) assert.equal((await call(token.token, '/api/glove/state')).status, 401)
    for (const place of ['main', 'ral']) for (const source of sources) await request(place, source, 'revoked')
    await job('main', '2026-10-24', 'revoked'); await job('ral', '2026-10-25', 'revoked')
    const last = await observe()
    const after_ = ran(last.runs, 'revoked')
    const expected = [
      ...labels('revoked').flatMap(l => ['custom notify', 'office notify', 'ral notify'].map(rule => [rule, l, 'not allowed'])),
      ...labels('revoked').map(l => [{ phone: 'office cost', website: 'ral cost', referral: 'custom cost' }[l.split(':')[1]], l, 'not allowed']),
      ...['main', 'ral'].flatMap(p => [['office book', `revoked ${p} job`, 'not allowed'], ['ral book', `revoked ${p} job`, 'not allowed'], ...['custom assign', 'office assign', 'ral assign'].map(rule => [rule, `revoked ${p} job`, 'not allowed'])]),
    ].sort()
    assert.deepEqual(after_, expected)
    assert.equal(new Set(after_.map(r => r.join('|'))).size, after_.length, 'exactly one run per rule and trigger')
    const runs = (await h.state()).ruleRuns.filter(r => r.trigger.subjectId && label.get(r.trigger.subjectId)?.startsWith('revoked'))
    assert.ok(runs.every(r => / was revoked$/.test(r.detail) && r.createdBy.name.endsWith(' (integration token)')))
    for (const key of ['costs', 'notices', 'assignees', 'visits']) assert.deepEqual(last[key].filter(r => !r[0]?.startsWith('revoked') && !r[1]?.startsWith('revoked')), afterJobs[key], `${key} are unchanged by revoked rules`)
    assert.ok(last.costs.filter(r => r[0].startsWith('revoked')).every(r => r[1] === null), 'no cost')
    assert.ok(last.assignees.filter(r => r[0].startsWith('revoked')).every(r => r[1] === null), 'no assignment')
    assert.ok(last.visits.every(v => !v[1].startsWith('Booked by the rule')), 'no booking')
    assert.ok(!last.notices.some(n => String(n[1]).startsWith('revoked')), 'no notice')

    // Results are identical across command replay and an actual Worker restart.
    const replay = async () => { for (const x of commands) assert.deepEqual(await x.person.run(x.type, x.payload, { commandId: x.commandId }), x.result, x.type) }
    await replay()
    assert.deepEqual(await observe(), last)
    await h.restart()
    assert.deepEqual(await observe(), last)
    await replay()
    assert.deepEqual(await observe(), last)
    for (const token of Object.values(tokens)) assert.equal((await call(token.token, '/api/glove/state')).status, 401)

    // Rule saves and runs are in Activity and the business export under the token's name; no token or hash.
    const activity = []
    for (let before = ''; before !== null;) { const page = await (await h.request(`/api/glove/activity${before && `?before=${before}`}`)).json(); activity.push(...page.events); before = page.next }
    const exported = await (await h.request('/api/glove/export')).json()
    for (const [key, token] of Object.entries(tokens)) {
      const saves = activity.filter(e => e.kind === 'rule.saved' && e.actorName === `${token.name} (integration token)`)
      assert.equal(saves.length, key === 'custom' ? 3 : 4)
      assert.ok(saves.every(e => ruleIds.has(e.subjectId) && /created rule /.test(e.summary)))
      const mine = activity.filter(e => e.kind === 'rule.ran' && e.actorName.startsWith(`${token.name} (integration token) (rule "`))
      assert.ok(mine.length > 0 && mine.every(e => e.actorId === `token:${token.id}`))
      assert.ok(exported.timeline.some(e => e.kind === 'rule.saved' && e.actor_name === `${token.name} (integration token)`), `${key} export`)
      assert.ok(exported.timeline.some(e => e.kind === 'rule.ran' && e.actor_name.startsWith(`${token.name} (integration token) (rule "`)), `${key} export runs`)
      const hash = createHash('sha256').update(`glove-token:${token.token}`).digest('hex')
      const dump = JSON.stringify([activity, exported, await h.state()])
      assert.ok(!dump.includes(token.token) && !dump.includes(hash), `${key} token and hash stay out`)
    }
    assert.equal(activity.filter(e => e.kind === 'rule.ran').length, (await h.state()).ruleRuns.length)
  })
})
