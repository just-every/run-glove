import { scenario } from '../fixtures/scenario.mjs'
// AGENT-005 quote drafted from the request through the command and state
// doors, with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { assertTrail, installation, business, completedJob } from './harness.mjs'

test('API-001 / DATA-002, DATA-009, DATA-010 / AGENT-005, AGENT-014 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves', async (t) => {
  // The outbound-service adapter represents a broken connection with a marker.
  // Translate it at fetch inside the test Worker, as for the harness's other
  // provider transport fakes; the production model code and domain doors run.
  const transport = { name: 'suggest-model-transport', setup(build) {
    build.onLoad({ filter: /tests[\/]api[\/]worker\.ts$/ }, async args => ({
      loader: 'ts',
      contents: `const modelFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const response = await modelFetch(input, options);
  if (response.headers.get('x-synthetic-glove-model-unreachable') === '1') throw new TypeError('Synthetic model unreachable');
  return response;
};
` + await readFile(args.path, 'utf8'),
    }))
  } }
  const h = await installation({ at: '2026-11-08T12:59:00.000Z', captureLogs: true, workerPlugins: [transport] })
  t.after(() => h.close())
  const b = await business(h)
  const year = 2026
  const tune = await h.command('service.save', { code: 'FURN-TUNE', name: 'Furnace tune-up', description: 'Inspect and clean the furnace', unit: 'each', unitCost: '40.00', unitPrice: '149.00', tax: 'GST' })
  const sensor = await h.command('service.save', { code: 'FLAME-SNS', name: 'Flame sensor replacement', kind: 'material', description: 'Replace the flame sensor', unit: 'each', unitCost: '18.00', unitPrice: '129.00', tax: 'GST' })
  const replace = await h.command('service.save', { code: 'FURN-96', name: '96% AFUE furnace installed', description: 'Supply and install the new furnace', unit: 'each', unitCost: '2100.00', unitPrice: '4890.00', tax: 'GST' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'quote-test', key: 'synthetic-glove-218' })
  const furnace = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Gas furnace', make: 'Carrier', model: '58STA', installedOn: `${year - 15}-11-09`, refrigerant: 'R-410A', serial: 'synthetic-glove-furnace-serial', location: 'Basement' })
  const condenser = await b.office.run('equipment.save', { siteId: b.site.id, type: 'AC condenser', make: 'Trane', model: 'XR14', refrigerant: 'R-32', serial: 'synthetic-glove-condenser-serial', location: 'Roof' })
  await h.command('pricebook.category', { name: 'Furnace parts', markupPercent: '63.17' })
  await h.command('service.save', { code: 'ARCHIVED-218', name: 'Retired furnace item', description: 'Private archived description', unitCost: '1733.21', unitPrice: '2777.31', tax: 'GST', archived: true })
  await completedJob(h, b, '2026-10-05')
  const history = async (title, date, equipmentIds, summary, site = b.site) => {
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title, equipmentIds })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '11:00', end: '12:00' })
    if (summary) {
      await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: `${date}T00:00:00Z` })
      await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: `${date}T01:00:00Z`, summary, signoff: { absentReason: 'Customer out' } })
    }
    return { job, visit }
  }
  await history('Furnace inspection', '2026-10-01', [furnace.id], 'Adjusted furnace combustion')
  await history('Cooling inspection', '2026-10-02', [condenser.id], 'Washed condenser fins')
  await history('Combined maintenance', '2026-10-03', [furnace.id, condenser.id], 'Checked both operating cycles')
  const unfinished = await history('Incomplete inspection', '2026-10-04', [furnace.id, condenser.id])
  const cancelled = await history('Cancelled inspection', '2026-10-06', [furnace.id])
  await b.dispatcher.run('visit.cancel', { visitId: cancelled.visit.id, version: cancelled.visit.version, reason: 'Customer cancelled' })
  const otherSite = await h.command('site.save', { customerId: b.customer.id, address: '218 Other Site Lane', contact: 'Other Site Contact' })
  const otherUnit = await b.office.run('equipment.save', { siteId: otherSite.id, type: 'Other-site boiler', serial: 'synthetic-glove-other-serial' })
  await history('Other-site work', '2026-10-07', [otherUnit.id], 'Other-site private completed summary', otherSite)

  // Manufacture dates enter through the real nameplate confirmation door.
  const photo = { mediaType: 'image/jpeg', base64: Buffer.from('ffd8ffe000104a4649460001ffd9', 'hex').toString('base64') }
  for (const [unit, make, model, serial, manufactured] of [
    [furnace, 'Carrier', '58STA', 'synthetic-glove-furnace-serial', '2009-04-03'],
    [condenser, 'Trane', 'XR14', 'synthetic-glove-condenser-serial', '2016-11-09'],
  ]) {
    h.models.answer = () => ({ make, model, serial, manufactured })
    const reading = await b.priyaPerson.run('nameplate.read', { visitId: unfinished.visit.id, equipmentId: unit.id, photo })
    await b.priyaPerson.run('nameplate.confirm', { readingId: reading.id, version: reading.version, make, model, serial, manufactured })
  }
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Furnace short-cycling and a burning smell when it starts', source: 'phone' })
  const answer = { title: 'Furnace short-cycling', good: { reason: 'A tune-up finds and fixes the usual causes of short-cycling.', lines: [{ code: 'FURN-TUNE', quantity: '1' }] }, better: { reason: 'Short-cycling on a 15-year-old furnace is often a dirty or failing flame sensor.', lines: [{ code: 'FURN-TUNE', quantity: '1' }, { code: 'FLAME-SNS', quantity: '1' }] }, best: { reason: 'At 15 years a high-efficiency replacement ends the repairs.', lines: [{ code: 'FURN-96', quantity: '1' }] } }
  h.models.answer = () => answer

  const orderedEvidence = evidence => ({
    ...evidence,
    equipment: evidence.equipment.toSorted((a, b) => a.type.localeCompare(b.type)),
    pastJobs: evidence.pastJobs.toSorted((a, b) => a.title.localeCompare(b.title)),
    priceBook: evidence.priceBook.toSorted((a, b) => a.code.localeCompare(b.code)),
  })
  const expectedEvidence = (furnaceAge, condenserAge) => ({
    request: { description: 'Furnace short-cycling and a burning smell when it starts', source: 'phone' },
    equipment: [
      { type: 'Gas furnace', make: 'Carrier', model: '58STA', installedOn: '2011-11-09', manufacturedOn: '2009-04-03', ageYears: furnaceAge, refrigerant: 'R-410A', visits: [{ date: '2026-10-01', summary: 'Adjusted furnace combustion' }, { date: '2026-10-03', summary: 'Checked both operating cycles' }] },
      { type: 'AC condenser', make: 'Trane', model: 'XR14', installedOn: '', manufacturedOn: '2016-11-09', ageYears: condenserAge, refrigerant: 'R-32', visits: [{ date: '2026-10-02', summary: 'Washed condenser fins' }, { date: '2026-10-03', summary: 'Checked both operating cycles' }] },
    ],
    pastJobs: [
      { title: 'Service 2026-10-05', completed: ['Cleaned filters and coil'] },
      { title: 'Furnace inspection', completed: ['Adjusted furnace combustion'] },
      { title: 'Cooling inspection', completed: ['Washed condenser fins'] },
      { title: 'Combined maintenance', completed: ['Checked both operating cycles'] },
      { title: 'Incomplete inspection', completed: [] },
      { title: 'Cancelled inspection', completed: [] },
    ],
    priceBook: [
      { code: 'SPLIT-SVC', name: 'Split system service', description: '', unit: 'each', price: '189.00' },
      { code: 'R32-KG', name: 'R32 refrigerant', description: '', unit: 'kg', price: '95.00' },
      { code: 'FURN-TUNE', name: 'Furnace tune-up', description: 'Inspect and clean the furnace', unit: 'each', price: '149.00' },
      { code: 'FLAME-SNS', name: 'Flame sensor replacement', description: 'Replace the flame sensor', unit: 'each', price: '129.00' },
      { code: 'FURN-96', name: '96% AFUE furnace installed', description: 'Supply and install the new furnace', unit: 'each', price: '4890.00' },
    ],
  })
  await scenario(t, 'AGENT-005 point 3: exact permitted evidence and strict schema across business-local midnight', async () => {
    const beforeBirthday = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: request.description, source: 'phone' })
    await b.agent.run('quote.suggest', { enquiryId: beforeBirthday.id })
    const call = h.models.calls.at(-1)
    assert.deepEqual(orderedEvidence(JSON.parse(call.body.messages[1].content)), orderedEvidence(expectedEvidence(14, 9)))
    assert.equal(call.body.store, false)
    const line = { type: 'object', additionalProperties: false, required: ['code', 'quantity'], properties: { code: { type: 'string' }, quantity: { type: 'string' } } }
    const option = { type: 'object', additionalProperties: false, required: ['reason', 'lines'], properties: { reason: { type: 'string' }, lines: { type: 'array', items: line } } }
    assert.deepEqual(call.body.response_format, { type: 'json_schema', json_schema: { name: 'quote_draft', strict: true, schema: { type: 'object', additionalProperties: false, required: ['title', 'good', 'better', 'best'], properties: { title: { type: 'string' }, good: option, better: option, best: option } } } })
    await h.setTime('2026-11-08T13:01:00.000Z')
    const afterBirthday = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: request.description, source: 'phone' })
    await b.agent.run('quote.suggest', { enquiryId: afterBirthday.id })
    assert.deepEqual(orderedEvidence(JSON.parse(h.models.calls.at(-1).body.messages[1].content)), orderedEvidence(expectedEvidence(15, 10)))
    t.diagnostic('PROBE AGENT-005 3: two native units and completed histories at Sydney 23:59 and 00:01 -> exact evidence, install-preferred ages 14 to 15 and manufacture fallback 9 to 10, store false and strict schema')
  })
  await b.office.run('quote.suggest', { enquiryId: request.id }, { error: 'FORBIDDEN' })
  await scenario(t, 'AGENT-005 point 7: AGENT-014 any extra, missing or malformed answer field refuses the whole draft without repair or retry', async () => {
    const invalid = []
    const change = (label, edit) => { const value = structuredClone(answer); edit(value); invalid.push([label, value]) }
    change('extra root field', value => { value.approved = true })
    change('missing title', value => { delete value.title })
    for (const tier of ['good', 'better', 'best']) {
      change(`extra ${tier} field`, value => { value[tier].discount = '10.00' })
      change(`extra ${tier} line field`, value => { value[tier].lines[0].unitPrice = '0.01' })
      change(`missing ${tier} reason`, value => { delete value[tier].reason })
      change(`null ${tier}`, value => { value[tier] = null })
      change(`array ${tier}`, value => { value[tier] = [] })
      change(`null ${tier} line`, value => { value[tier].lines[0] = null })
      change(`missing ${tier} quantity`, value => { delete value[tier].lines[0].quantity })
      change(`empty ${tier} lines`, value => { value[tier].lines = [] })
      change(`too many ${tier} lines`, value => { value[tier].lines = Array.from({ length: 21 }, () => ({ code: 'FURN-TUNE', quantity: '1' })) })
      for (const quantity of ['0', '-1', '1.0001', 1]) change(`invalid ${tier} quantity ${quantity}`, value => { value[tier].lines[0].quantity = quantity })
    }
    change('archived code', value => { value.good.lines[0].code = 'ARCHIVED-218' })
    change('unknown code', value => { value.best.lines[0].code = 'HEAT-PUMP' })
    const before = await h.state()
    const records = (await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results
    for (const [label, value] of invalid) {
      const calls = h.models.calls.length
      h.models.answer = () => value
      await b.agent.run('quote.suggest', { enquiryId: request.id }, { error: 'MODEL' })
      const after = await h.state()
      assert.deepEqual((await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results, records, label)
      assert.deepEqual(after.quotes, before.quotes, label)
      assert.deepEqual(after.enquiries, before.enquiries, label)
      assert.equal(after.events.filter(event => event.kind === 'quote.suggested').length, before.events.filter(event => event.kind === 'quote.suggested').length, label)
      assert.equal(h.models.calls.length, calls + 1, `${label}: no retry`)
    }
    t.diagnostic('PROBE AGENT-005 7 shape: ' + invalid.length + ' malformed or inactive-code answers -> whole refusal, every record unchanged, exactly one model call each')
  })
  h.models.answer = () => answer
  const commandId = randomUUID()
  const quote = await b.agent.run('quote.suggest', { enquiryId: request.id }, { commandId })

  await scenario(t, 'AGENT-005 point 6: AGENT-014 three options from the price book at its prices, each with the model\'s reason', () => {
    const options = quote.revisions[0].options
    assert.deepEqual(options.map(o => [o.name, o.lines.map(l => [l.serviceId, l.quantity, l.unitPrice])]), [
      ['Good', [[tune.id, '1', '149.00']]],
      ['Better', [[tune.id, '1', '149.00'], [sensor.id, '1', '129.00']]],
      ['Best', [[replace.id, '1', '4890.00']]],
    ])
    assert.deepEqual(quote.drafted.reasons.map(r => [r.optionId, r.name, r.reason]), options.map((o, i) => [o.id, o.name, answer[['good', 'better', 'best'][i]].reason]))
    assert.equal(quote.drafted.label, "Drafted by the model from the request. A person approves each option's price before it is sent.")
    assert.deepEqual([quote.title, quote.enquiryId, quote.revisions[0].preparedBy.role], ['Furnace short-cycling', request.id, 'agent'])
  })

  await scenario(t, 'AGENT-005 point 4: AGENT-014 the model saw the request, the furnace\'s age and history and the price book, never costs or who and where the customer is', () => {
    const call = h.models.calls.at(-1)
    assert.equal(call.body.store, false)
    const sent = JSON.parse(call.body.messages[1].content)
    assert.equal(sent.request.description, request.description)
    assert.deepEqual(sent.equipment.map(e => [e.type, e.ageYears]).sort(), [['AC condenser', 10], ['Gas furnace', 15]])
    assert.deepEqual(Object.keys(sent).sort(), ['equipment', 'pastJobs', 'priceBook', 'request'])
    assert.ok(sent.pastJobs.some(j => j.completed.includes('Cleaned filters and coil')))
    assert.deepEqual(sent.priceBook.map(x => x.code).sort(), ['FLAME-SNS', 'FURN-96', 'FURN-TUNE', 'R32-KG', 'SPLIT-SVC'])
    assert.doesNotMatch(call.body.messages[1].content, /unitCost|2100|Harbourview|Harbour St|9555|Mei Lin|harbourview\.example|Priya|Tom B/)
    assert.deepEqual(orderedEvidence(JSON.parse(call.body.messages[1].content)), orderedEvidence(expectedEvidence(15, 10)))
    for (const forbidden of ['unitCost', 'markup', '63.17', '2100.00', '18.00', '40.00', 'Harbourview Dental', 'accounts' + '@' + 'harbourview.example', '02 9555 0101', 'Dr Mei Lin', '14 Harbour St', 'Gate code at reception', 'Priya', 'Tom B.', 'Sam Ortiz', 'Olu Office', 'synthetic-glove-furnace-serial', 'synthetic-glove-condenser-serial', 'ARCHIVED-218', 'Retired furnace item', 'Private archived description', '1733.21', '2777.31', 'Other-site boiler', 'Other-site private completed summary']) {
      assert.ok(!JSON.stringify(call.body).includes(forbidden), forbidden)
    }
    t.diagnostic('PROBE AGENT-005 4: populated costs, category markup, identity, contacts, addresses, serials, archived item and other-site history -> absent everywhere in provider body')

  })

  await scenario(t, 'AGENT-005 point 8: current prices, exact label and reasons survive command replay and actual Worker restart', async () => {
    const before = await h.state(), calls = h.models.calls.length
    assert.equal(before.enquiries.find(e => e.id === request.id).status, 'quoted', 'request changes at the draft commit')
    assert.deepEqual(await b.agent.run('quote.suggest', { enquiryId: request.id }, { commandId }), quote)
    assert.equal(h.models.calls.length, calls)
    await h.restart()
    assert.deepEqual((await h.state()).quotes.find(q => q.id === quote.id), before.quotes.find(q => q.id === quote.id))
    assert.deepEqual(await b.agent.run('quote.suggest', { enquiryId: request.id }, { commandId }), quote)
    assert.equal(h.models.calls.length, calls, 'persisted replay makes no second provider request')
    assert.deepEqual((await h.state()).enquiries, before.enquiries)
    t.diagnostic('PROBE AGENT-005 8: saved draft command replay and actual Worker restart -> identical quote, reasons, exact label and quoted request; zero additional provider calls')
  })

  await scenario(t, 'AGENT-005 point 1: AGENT-014 the draft waits for a person: the agent cannot approve or send it; a dispatcher approves the prices', async () => {
    assert.equal(quote.status, 'draft')
    const beforeRefusal = (await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results
    await b.agent.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, { error: 'FORBIDDEN' })
    await b.agent.run('quote.markSent', { quoteId: quote.id, version: quote.version, revision: 1, channel: 'email' }, { error: 'FORBIDDEN' })
    assert.deepEqual((await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results, beforeRefusal, 'the Agent cannot record approval or sending')
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    assert.deepEqual([approved.status, approved.revisions[0].approval.name], ['approved', 'Sam Ortiz'])
    assert.deepEqual(approved.revisions[0].preparedBy, { id: b.agent.id, name: 'Ada Agent', role: 'agent' })
    assert.deepEqual([approved.revisions[0].approval.id, approved.revisions[0].approval.role], [b.dispatcher.id, 'dispatcher'])
    assert.deepEqual(approved.drafted.by, { id: b.agent.id, name: 'Ada Agent', role: 'agent' })
    const activityResponse = await h.request('/api/glove/activity')
    assert.equal(activityResponse.status, 200)
    const activity = (await activityResponse.json()).events
    const exportResponse = await h.request('/api/glove/export')
    assert.equal(exportResponse.status, 200)
    const exported = await exportResponse.json()
    for (const [kind, subjectId, actorId, name, role] of [
      ['enquiry.created', request.id, b.office.id, 'Olu Office', 'office'],
      ['quote.drafted', quote.id, b.agent.id, 'Ada Agent', 'agent'],
      ['quote.suggested', quote.id, b.agent.id, 'Ada Agent', 'agent'],
      ['quote.approved', quote.id, b.dispatcher.id, 'Sam Ortiz', 'dispatcher'],
    ]) {
      const event = activity.find(e => e.kind === kind && e.subjectId === subjectId)
      assert.ok(event, kind)
      assert.deepEqual([event.actorId, event.actorName, event.actorRole], [actorId, name, role])
      const kept = exported.timeline.find(e => e.id === event.id)
      assert.ok(kept, `${kind} exported`)
      assert.deepEqual([kept.actor_id, kept.actor_name, kept.actor_role, kept.subject_id, kept.command_id, kept.at], [actorId, name, role, subjectId, event.commandId, event.at])
    }
    assert.doesNotMatch(JSON.stringify([await h.state(), activity, exported, h.logs]), /synthetic-glove-218/)
    t.diagnostic('PROBE AGENT-005 1: Agent approval and sending refused; Sam Ortiz approves -> Agent retained as preparer and exact Office, Agent and Dispatcher attribution in Activity and export without the model key')

    const s = await h.state()
    assert.equal(s.enquiries.find(e => e.id === request.id).status, 'quoted')
    assert.ok(s.events.some(e => e.kind === 'quote.suggested' && e.subjectId === quote.id))
  })
  await scenario(t, 'AGENT-005 point 2: current roles and request prerequisites admit only authorized new or contacted drafts', async () => {
    const requestFor = description => b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description, source: 'phone' })
    const records = async () => (await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results
    const refuse = async (person, enquiry, error) => {
      const before = await records(), calls = h.models.calls.length
      await person.run('quote.suggest', { enquiryId: enquiry.id }, { error })
      assert.deepEqual(await records(), before, error + ': all domain records unchanged')
      assert.equal(h.models.calls.length, calls, error + ': no provider request')
    }
    const owner = { run: h.command }
    for (const [name, person] of [['Agent', b.agent], ['Owner', owner], ['Dispatcher', b.dispatcher]]) {
      for (const status of ['new', 'contacted']) {
        let enquiry = await requestFor(name + ' ' + status + ' request')
        if (status === 'contacted') enquiry = await b.office.run('enquiry.contact', { enquiryId: enquiry.id, version: enquiry.version, note: 'Customer reached' })
        assert.equal(enquiry.status, status)
        const calls = h.models.calls.length, before = await h.state()
        const result = await person.run('quote.suggest', { enquiryId: enquiry.id })
        const after = await h.state()
        assert.equal(h.models.calls.length, calls + 1)
        assert.equal(after.quotes.length, before.quotes.length + 1)
        assert.deepEqual([result.status, result.enquiryId, after.enquiries.find(e => e.id === enquiry.id).status], ['draft', enquiry.id, 'quoted'])
      }
    }
    const eligible = await requestFor('Refusal target with valid prerequisites')
    const customRole = await h.command('role.save', { name: 'Request reader without drafting', permissions: ['enquiry.create'] })
    const custom = await h.person('Restricted Request Reader', 'custom:' + customRole.id)
    const branch = await h.command('branch.save', { name: 'Other drafting branch', prefix: 'ODR', timezone: 'UTC', zips: [] })
    const limited = await h.person('Other Branch Dispatcher', 'dispatcher')
    await h.command('branch.limit', { operatorId: limited.id, branchId: branch.id })
    for (const person of [b.office, b.priyaPerson, custom]) await refuse(person, eligible, 'FORBIDDEN')
    await refuse(limited, eligible, 'NOT_FOUND')
    const token = await h.command('token.issue', { name: 'Office integration without drafting', role: 'office' })
    const tokenPerson = { run: async (type, payload, { error }) => {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: 'Bearer ' + token.token }, body: { commandId: randomUUID(), type, payload } })
      assert.equal(response.status, 403)
      const body = await response.json()
      assert.equal(body.ok, false)
      assert.equal(body.error.code, error)
    } }
    await refuse(tokenPerson, eligible, 'FORBIDDEN')
    await h.command('role.set', { operatorId: limited.id, role: 'office' })
    await h.command('branch.limit', { operatorId: limited.id, branchId: null })
    await refuse(limited, eligible, 'FORBIDDEN')
    await h.command('role.set', { operatorId: b.agent.id, role: 'office' })
    const beforeReplay = await records(), replayCalls = h.models.calls.length
    await b.agent.run('quote.suggest', { enquiryId: request.id }, { commandId, error: 'FORBIDDEN' })
    assert.deepEqual(await records(), beforeReplay, 'role withdrawal blocks replay of an earlier successful draft')
    assert.equal(h.models.calls.length, replayCalls)
    await h.command('role.set', { operatorId: b.agent.id, role: 'agent' })
    await h.command('agents.pause', { paused: true })
    await refuse(b.agent, eligible, 'PAUSED')
    await h.command('agents.pause', { paused: false })
    const won = await requestFor('Won request')
    await b.dispatcher.run('job.create', { enquiryId: won.id, title: 'Won service call' })
    const lost = await requestFor('Lost request')
    await b.office.run('enquiry.close', { enquiryId: lost.id, version: lost.version, reason: 'Customer declined' })
    for (const enquiry of [request, won, lost]) await refuse(b.agent, enquiry, 'ENQUIRY_STATE')
    const noSite = await b.office.run('enquiry.create', { customerId: b.customer.id, description: 'A request without its property', source: 'phone' })
    await refuse(b.agent, noSite, 'SITE')
    const active = (await h.state()).services.filter(s => !s.archived)
    const archived = []
    for (const service of active) archived.push(await h.command('service.save', { ...service, archived: true }))
    await refuse(b.agent, eligible, 'PRICE_BOOK')
    for (const service of archived) await h.command('service.save', { ...service, archived: false })
    await h.command('model.connect', { key: null })
    await refuse(b.agent, eligible, 'MODEL')
    await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'quote-test', key: 'synthetic-glove-218' })
    t.diagnostic('PROBE AGENT-005 2: six allowed role and state combinations -> drafts; excluded roles, token, branch, pause, terminal states, no site, empty book and disconnected provider -> refusal, no model call, all records unchanged')
  })

  await scenario(t, 'AGENT-005 point 6: positive quantities through three decimals use only active price-book codes', async () => {
    const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Quantities and full option', source: 'phone' })
    const value = structuredClone(answer)
    value.good.lines[0].quantity = '0.001'
    value.better.lines[0].quantity = '1.125'
    value.best.lines = Array.from({ length: 20 }, () => ({ code: 'FURN-TUNE', quantity: '2' }))
    h.models.answer = () => value
    const quote = await b.agent.run('quote.suggest', { enquiryId: enquiry.id })
    const options = quote.revisions[0].options
    assert.deepEqual(options.map(o => o.lines.length), [1, 2, 20])
    assert.deepEqual(options.map(o => o.lines[0].quantity), ['0.001', '1.125', '2'])
    assert.deepEqual(quote.drafted.reasons.map(r => r.reason), [answer.good.reason, answer.better.reason, answer.best.reason])
    h.models.answer = () => answer
    t.diagnostic('PROBE AGENT-005 6: one-line and twenty-line options with positive three-decimal quantities -> exact lines, quantities and reasons saved')
  })

  await scenario(t, 'AGENT-005 point 7: HTTP error, redirect and unreachable provider refuse once with secret-free outcome facts', async () => {
    const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Transport failure target', source: 'phone' })
    for (const [status, reply] of [
      [503, () => new Response('synthetic-glove-218 private provider response', { status: 503 })],
      [307, () => new Response(null, { status: 307, headers: { location: 'https://outside.example.test/private-model-target' } })],
      [0, () => new Response('synthetic-glove-218 private transport payload', { headers: { 'x-synthetic-glove-model-unreachable': '1' } })],
    ]) {
      h.models.reply = reply
      const before = await h.state(), calls = h.models.calls.length, attempts = h.outbound.attempts, commandId = randomUUID()
      const records = (await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results
      const error = await b.agent.run('quote.suggest', { enquiryId: enquiry.id }, { error: 'MODEL', commandId })
      assert.deepEqual(error.details, { status })
      assert.equal(h.models.calls.length, calls + 1, 'exactly one model request')
      assert.equal(h.outbound.attempts, attempts + 1, 'no retry or redirect forwarding')
      assert.deepEqual((await h.db.prepare('SELECT kind,id,version,data FROM glove_records ORDER BY kind,id').all()).results, records)
      const after = await h.state()
      assert.deepEqual(after.quotes, before.quotes)
      assert.deepEqual(after.enquiries, before.enquiries)
      const response = await h.request('/api/glove/activity')
      assert.equal(response.status, 200)
      const activity = (await response.json()).events
      const facts = activity.filter(e => e.commandId === commandId)
      assert.equal(facts.length, 1)
      const fact = facts[0]
      assert.deepEqual([fact.kind, fact.actorId, fact.actorName, fact.actorRole, fact.subjectKind, fact.subjectId, fact.at], ['model.outcome', 'provider:Model provider', 'Model provider', 'provider', 'business', after.business[0].id, '2026-11-08T13:01:00.000Z'])
      assert.equal(fact.summary, status ? 'quote_draft: model provider answered HTTP ' + status : 'quote_draft: model provider outcome not confirmed')
      const exported = await h.request('/api/glove/export').then(r => r.json())
      const kept = exported.timeline.find(e => e.id === fact.id)
      assert.ok(kept)
      assert.deepEqual([kept.actor_name, kept.kind, kept.command_id, JSON.parse(kept.data)], [fact.actorName, fact.kind, commandId, { feature: 'quote_draft', model: 'quote-test', status }])
      assert.doesNotMatch(JSON.stringify([error, after, activity, exported, h.logs]), /synthetic-glove-218|private provider response|private transport payload|private-model-target/)
    }
    h.models.reply = null
    t.diagnostic('PROBE AGENT-005 7: HTTP 503, redirect 307 and broken model connection -> MODEL, one provider attempt, unchanged records, one bounded model.outcome in Activity and export')
  })

  await scenario(t, 'AGENT-005 point 8: a changed price book supplies current prices instead of earlier draft prices', async () => {
    const service = (await h.state()).services.find(s => s.id === tune.id)
    await h.command('service.save', { ...service, unitPrice: '159.00' })
    const enquiry = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Draft after the price change', source: 'phone' })
    const result = await b.agent.run('quote.suggest', { enquiryId: enquiry.id })
    assert.deepEqual(result.revisions[0].options.map(o => o.lines.map(l => [l.serviceId, l.unitPrice])), [
      [[tune.id, '159.00']], [[tune.id, '159.00'], [sensor.id, '129.00']], [[replace.id, '4890.00']],
    ])
    assert.equal(JSON.parse(h.models.calls.at(-1).body.messages[1].content).priceBook.find(x => x.code === 'FURN-TUNE').price, '159.00')
    assert.equal((await h.state()).quotes.find(q => q.id === quote.id).revisions[0].options[0].lines[0].unitPrice, '149.00', 'earlier approved prices remain frozen')
    t.diagnostic('PROBE AGENT-005 8 prices: price book 149.00 to 159.00 -> new draft uses 159.00 while prior approved revision keeps 149.00')
  })

  await assertTrail(h, ['model.connected', 'model.outcome', 'quote.suggested', 'quote.approved'])
  await scenario(t, 'AGENT-005 point 8: erasure fences persisted suggestion replay after actual Worker restart', async () => {
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    const erased = await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    assert.equal(erased.outcome, 'complete')
    const calls = h.models.calls.length, before = await h.state()
    assert.equal(before.quotes.some(q => q.id === quote.id), false)
    assert.equal(before.enquiries.some(e => e.id === request.id), false)
    for (const restarted of [false, true]) {
      if (restarted) await h.restart()
      await b.agent.run('quote.suggest', { enquiryId: request.id }, { commandId, error: 'ERASED' })
      assert.deepEqual(await h.state(), before, 'erasure and replay preserve the anonymous state')
      assert.equal(h.models.calls.length, calls)
      const exported = await h.request('/api/glove/export').then(r => r.text())
      assert.ok(!exported.includes('Furnace short-cycling and a burning smell when it starts'))
      assert.ok(!exported.includes(answer.best.reason))
      assert.ok(!exported.includes('synthetic-glove-furnace-serial'))
    }
    t.diagnostic('PROBE AGENT-005 8 custody: erased request and quote -> old successful command returns ERASED before and after Worker restart; no model call or resurrection')
  })

})
