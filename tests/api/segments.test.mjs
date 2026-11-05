// CUST-004 custom fields, tags and segments through the command, state,
// segment, CSV and provider doors: two fields and a segment whose members
// match the filter exactly, and the export and the Mango push carrying exactly them.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, acceptedQuote } from './harness.mjs'

async function ownerDefinitions() {
  const at = '2026-11-05T12:00:00.000Z'
  const h = await installation({ at })
  try {
    const b = await business(h)
    // Qualify definitions against populated native records, through the same
    // authenticated commands and reads as Settings. No record values are edited.
    await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
    await h.command('equipment.save', { siteId: b.site.id, type: 'Condenser', make: 'synthetic-glove-1', model: 'synthetic-glove-2', serial: 'synthetic-glove-3' })
    const owner = (await (await h.request('/auth/session')).json()).operator
    const yesNo = ['yes', 'no'].join('/')
    const twenty = [
      'synthetic-glove-1', 'synthetic-glove-2', 'synthetic-glove-3', 'synthetic-glove-4', 'synthetic-glove-5',
      'synthetic-glove-6', 'synthetic-glove-7', 'synthetic-glove-8', 'synthetic-glove-9', 'synthetic-glove-10',
      'synthetic-glove-11', 'synthetic-glove-12', 'synthetic-glove-13', 'synthetic-glove-14', 'synthetic-glove-15',
      'synthetic-glove-16', 'synthetic-glove-17', 'synthetic-glove-18', 'synthetic-glove-19', 'synthetic-glove-20',
    ]
    const definitions = [
      { record: 'customers', label: 'Customer instructions', type: 'text', choices: [] },
      { record: 'customers', label: 'Customer rating', type: 'number', choices: [] },
      { record: 'customers', label: 'Customer review date', type: 'date', choices: [] },
      { record: 'customers', label: 'Customer inspected', type: yesNo, choices: [] },
      { record: 'customers', label: 'Customer priority', type: 'choice', choices: ['Regular', 'Priority'] },
      { record: 'customers', label: 'Customer district', type: 'choice', choices: twenty },
      { record: 'sites', label: 'Site instructions', type: 'text', choices: [] },
      { record: 'sites', label: 'Site rating', type: 'number', choices: [] },
      { record: 'sites', label: 'Site review date', type: 'date', choices: [] },
      { record: 'sites', label: 'Site inspected', type: yesNo, choices: [] },
      { record: 'sites', label: 'Site priority', type: 'choice', choices: ['Regular', 'Priority'] },
      { record: 'sites', label: 'Site district', type: 'choice', choices: twenty },
      { record: 'jobs', label: 'Job instructions', type: 'text', choices: [] },
      { record: 'jobs', label: 'Job rating', type: 'number', choices: [] },
      { record: 'jobs', label: 'Job review date', type: 'date', choices: [] },
      { record: 'jobs', label: 'Job inspected', type: yesNo, choices: [] },
      { record: 'jobs', label: 'Job priority', type: 'choice', choices: ['Regular', 'Priority'] },
      { record: 'jobs', label: 'Job district', type: 'choice', choices: twenty },
      { record: 'equipment', label: 'Equipment instructions', type: 'text', choices: [] },
      { record: 'equipment', label: 'Equipment rating', type: 'number', choices: [] },
      { record: 'equipment', label: 'Equipment review date', type: 'date', choices: [] },
      { record: 'equipment', label: 'Equipment inspected', type: yesNo, choices: [] },
      { record: 'equipment', label: 'Equipment priority', type: 'choice', choices: ['Regular', 'Priority'] },
      { record: 'equipment', label: 'Equipment district', type: 'choice', choices: twenty },
    ]
    const download = async () => {
      const response = await h.request('/api/glove/export')
      assert.equal(response.status, 200)
      const { exportedAt: _at, ...kept } = await response.json()
      return kept
    }
    const unchanged = async (action, reason) => {
      const before = await download()
      await action()
      assert.deepEqual(await download(), before, reason)
    }
    const unrelated = ({ customFields: _fields, timeline: _timeline, version: _version, ...records }) => records
    const native = unrelated(await download())
    const created = [], edited = [], saves = []
    for (const [i, definition] of definitions.entries()) {
      const commandId = `synthetic-glove-definition-${i}-create`
      const result = await h.command('field.save', definition, { commandId })
      assert.match(result.id, /^[0-9a-f-]{36}$/)
      const expected = { id: result.id, version: 1, createdAt: at, ...definition, archived: false }
      assert.deepEqual(result, expected)
      created.push(expected)
      saves.push({ commandId, field: expected, summary: `Olivia Owner defined custom field ${definition.label}` })
      await unchanged(async () => assert.deepEqual(await h.command('field.save', definition, { commandId }), expected), 'creation replay adds no field, version or event')
      const payload = { ...definition, id: result.id, version: 1, label: `${definition.label} reviewed`, choices: [...definition.choices].reverse() }
      const updated = { ...expected, version: 2, label: `${definition.label} reviewed`, choices: [...definition.choices].reverse() }
      const editId = `synthetic-glove-definition-${i}-edit`
      assert.deepEqual(await h.command('field.save', payload, { commandId: editId }), updated)
      edited.push(updated)
      saves.push({ commandId: editId, field: updated, summary: `Olivia Owner updated custom field ${definition.label} reviewed` })
    }
    assert.equal(new Set(created.map(f => f.id)).size, 24, 'each definition has its own stable identity')
    assert.deepEqual(unrelated(await download()), native, 'defining fields changes no customer, site, job or equipment record')
    const byId = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id))
    const assertDefinitions = async () => {
      for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie]) {
        assert.deepEqual(byId((await h.state(as)).customFields), byId(edited), 'authenticated desk reads retain every exact definition')
      }
      assert.deepEqual(byId((await download()).customFields), byId(edited), 'business download retains the same exact definitions')
    }
    await assertDefinitions()
    await h.restart()
    await assertDefinitions()
    assert.deepEqual(unrelated(await download()), native, 'native records survive the actual Worker restart unchanged')

    for (const [i, field] of edited.entries()) {
      const definition = definitions[i]
      const payload = { ...definition, id: field.id, version: 1, label: `${definition.label} reviewed`, choices: [...definition.choices].reverse() }
      await unchanged(async () => {
        assert.deepEqual(await h.command('field.save', definition, { commandId: `synthetic-glove-definition-${i}-create` }), created[i])
        assert.deepEqual(await h.command('field.save', payload, { commandId: `synthetic-glove-definition-${i}-edit` }), field)
      }, 'saved creation and edit outcomes replay once even after a restart and later versions')
      await unchanged(() => h.command('field.save', { ...field, version: 1, label: 'Stale overwrite' }, { error: 'STALE' }), 'stale edits preserve every record and event')
      for (const record of ['customers', 'sites', 'jobs', 'equipment'].filter(r => r !== field.record)) {
        await unchanged(() => h.command('field.save', { ...field, record }, { error: 'INPUT' }), 'a later edit cannot move a field to another record kind')
      }
      for (const type of ['text', 'number', 'date', yesNo, 'choice'].filter(t => t !== field.type)) {
        await unchanged(() => h.command('field.save', { ...field, type, choices: ['Regular', 'Priority'] }, { error: 'INPUT' }), 'a later edit cannot change a field to any other valid type')
      }
      if (field.type === 'choice') {
        for (const choices of [['Only one'], [...twenty, 'synthetic-glove-21']]) {
          await unchanged(() => h.command('field.save', { ...field, choices }, { error: 'INPUT' }), 'invalid choice edits preserve the retained valid definition')
        }
      }
    }
    for (const record of ['customers', 'sites', 'jobs', 'equipment']) {
      for (const choices of [['Only one'], [...twenty, 'synthetic-glove-21']]) {
        await unchanged(() => h.command('field.save', { record, label: 'Invalid choice count', type: 'choice', choices }, { error: 'INPUT' }), 'one or twenty-one choices cannot create any definition')
      }
    }
    for (const payload of [
      { record: 'invoices', label: 'Invalid record kind', type: 'text' },
      { record: 'customers', label: 'Invalid type', type: 'currency' },
      { record: 'equipment', label: '', type: 'text' },
    ]) await unchanged(() => h.command('field.save', payload, { error: 'INPUT' }), 'invalid definitions change no business record')

    const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
    const subcontractor = await h.person('Synthetic Glove Subcontractor', 'subcontractor')
    for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent, viewer, subcontractor]) {
      for (const payload of [definitions[0], { ...edited[0], label: 'Unauthorized overwrite' }]) {
        await unchanged(() => person.run('field.save', payload, { error: 'FORBIDDEN' }), `${person.name} cannot create or edit definitions`)
      }
    }
    await unchanged(async () => {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: 'synthetic-glove-signed-out', type: 'field.save', payload: definitions[0] } })
      assert.equal(response.status, 401)
      assert.equal((await response.json()).error.code, 'AUTH')
    }, 'signed-out attempts change nothing')
    const otherOwner = await h.person('Synthetic Glove Owner', 'owner')
    const revocableId = 'synthetic-glove-owner-definition'
    const revocablePayload = { record: 'equipment', label: 'Owner review', type: 'text', choices: [] }
    const revocable = await otherOwner.run('field.save', revocablePayload, { commandId: revocableId })
    saves.push({ commandId: revocableId, field: revocable, actor: { id: otherOwner.id, name: 'Synthetic Glove Owner' }, summary: 'Synthetic Glove Owner defined custom field Owner review' })
    await h.command('role.set', { operatorId: otherOwner.id, role: 'office' })
    await unchanged(() => otherOwner.run('field.save', revocablePayload, { commandId: revocableId, error: 'FORBIDDEN' }), 'withdrawn Owner authority cannot replay a successful definition command')
    await unchanged(() => otherOwner.run('field.save', { ...revocable, label: 'After withdrawal' }, { error: 'FORBIDDEN' }), 'withdrawn Owner authority cannot edit the retained field')

    // The independent ledger names the real person, command and exact effect;
    // replay and refused attempts must not fabricate extra successful events.
    const { activity: definitionActivity, exported: definitionExport } = await assertTrail(h, ['field.saved'])
    for (const save of saves) {
      const actor = save.actor ?? { id: owner.id, name: 'Olivia Owner' }
      const expected = [at, actor.id, actor.name, 'owner', save.commandId, 'field', save.field.id, 'field.saved', save.summary]
      const events = definitionActivity.filter(e => e.commandId === save.commandId)
      assert.equal(events.length, 1)
      const event = events[0]
      assert.deepEqual([event.at, event.actorId, event.actorName, event.actorRole, event.commandId, event.subjectKind, event.subjectId, event.kind, event.summary], expected)
      assert.ok(event.recordChanges.some(r => r.kind === 'customFields' && r.id === save.field.id && r.toVersion === save.field.version))
      const kept = definitionExport.timeline.filter(e => e.command_id === save.commandId)
      assert.equal(kept.length, 1)
      assert.equal(kept[0].id, event.id)
      assert.deepEqual([kept[0].at, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id, kept[0].subject_kind, kept[0].subject_id, kept[0].kind, kept[0].summary], expected)
      assert.ok(JSON.parse(kept[0].data).recordChanges.some(r => r.kind === 'customFields' && r.id === save.field.id && r.toVersion === save.field.version))
    }
    assert.equal(definitionExport.timeline.filter(e => e.kind === 'field.saved').length, 49)
    await h.restart()
    assert.deepEqual(byId((await h.state()).customFields), byId([...edited, revocable]), 'successful definitions and all refused edits retain their exact records after another restart')
  } finally { await h.close() }
}

test('DATA-002, DATA-009, DATA-010 / CUST-004, CUST-006 two custom fields, tags and a segment: members match the filter and the export carries exactly them', async (t) => {
  await ownerDefinitions()
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  await b.office.run('field.save', { record: 'customers', label: 'Service tier', type: 'choice', choices: ['gold', 'silver'] }, { error: 'FORBIDDEN' })
  const tier = await h.command('field.save', { record: 'customers', label: 'Service tier', type: 'choice', choices: ['gold', 'silver'] })
  const property = await h.command('field.save', { record: 'sites', label: 'Property type', type: 'choice', choices: ['residential', 'commercial'] })
  const gate = await h.command('field.save', { record: 'jobs', label: 'Gate code', type: 'text' })

  const customer = async (name, tags, tierValue, kind, installedOn) => {
    let c = await b.office.run('customer.save', { name, email: `${name.toLowerCase().replace(/\W+/g, '.')}@example.test` })
    c = await b.office.run('customer.tags', { customerId: c.id, version: c.version, tags })
    c = await b.office.run('record.custom', { record: 'customers', id: c.id, version: c.version, values: { [tier.id]: tierValue } })
    const site = await b.office.run('site.save', { customerId: c.id, address: `${name} St, Austin TX 78701` })
    await b.office.run('record.custom', { record: 'sites', id: site.id, version: site.version, values: { [property.id]: kind } })
    await b.office.run('equipment.save', { siteId: site.id, type: 'Furnace', installedOn })
    return c
  }
  const ana = await customer('Ana Ruiz', ['VIP', 'vip'], 'gold', 'residential', '2010-04-01')
  await customer('Ben Ode', ['VIP'], 'silver', 'residential', '2011-05-01')
  await customer('Cy Park', ['VIP'], 'gold', 'residential', '2022-06-01')
  await customer('Dee Lam', ['VIP', 'Do not service'], 'gold', 'residential', '2009-01-01')
  await customer('Eve Shaw', ['VIP'], 'gold', 'commercial', '2012-01-01')
  assert.deepEqual((await h.state()).customers.find(c => c.id === ana.id).tags, ['VIP'], 'tags are kept once, whatever the case')
  await b.office.run('record.custom', { record: 'customers', id: ana.id, version: (await h.state()).customers.find(c => c.id === ana.id).version, values: { [tier.id]: 'platinum' } }, { error: 'INPUT' })
  await b.office.run('record.custom', { record: 'customers', id: ana.id, version: (await h.state()).customers.find(c => c.id === ana.id).version, values: { [gate.id]: '1234' } }, { error: 'INPUT' })

  // VIPs on gold, at a residential property, with equipment over ten years old, not marked do-not-service.
  const segment = await b.dispatcher.run('segment.save', { name: 'Gold VIP replacements', filter: { tagsAll: ['vip'], tagsNone: ['do not service'], fields: [{ fieldId: tier.id, op: 'is', value: 'gold' }, { fieldId: property.id, op: 'is', value: 'residential' }], equipmentOlderThanYears: 10, noAgreement: true } })
  const read = await (await h.request(`/api/glove/segments/${segment.id}`, { as: b.dispatcher.cookie })).json()
  assert.deepEqual(read.members.map(m => m.name), ['Ana Ruiz'])
  const csv = (await (await h.request(`/api/glove/segments/${segment.id}.csv`, { as: b.office.cookie })).text()).trim().split(/\r?\n/)
  assert.deepEqual(csv, ['Name,Email,Phone,Tags,Service tier', 'Ana Ruiz,ana.ruiz@example.test,,VIP,gold'])
  assert.equal((await h.request(`/api/glove/segments/${segment.id}.csv`, { as: b.dispatcher.cookie })).status, 403, 'the export is the owner\'s and office\'s')
  assert.equal((await h.request(`/api/glove/segments/${segment.id}`, { as: b.priyaPerson.cookie })).status, 403)

  // Pushed as an audience to Mango (provider fake): exactly the members, never subscribed; the key never reaches records.
  await b.office.run('segment.push', { segmentId: segment.id, provider: 'mango' }, { error: 'MARKETING' })
  await b.office.run('marketing.connect', { provider: 'mango', url: 'https://mango.example.test', key: 'mango-test-credential' }, { error: 'FORBIDDEN' })
  await h.command('marketing.connect', { provider: 'mango', url: 'https://mango.example.test', key: 'mango-test-credential' })
  const push = await b.office.run('segment.push', { segmentId: segment.id, provider: 'mango' })
  assert.deepEqual([push.members, push.pushed, push.skippedNoEmail, push.skippedDoNotContact, push.failed], [1, 1, 0, 0, []])
  assert.deepEqual(h.marketing.map(x => [x.method, x.url, x.authorization, x.body]), [['PUT', 'https://mango.example.test/api/integrations/v1/contacts', 'Bearer mango-test-credential', { email: 'ana.ruiz@example.test', displayName: 'Ana Ruiz', segmentName: 'Gold VIP replacements', tags: ['VIP'] }]])
  // Mailchimp: the member added as transactional (not subscribed) and tagged with the segment.
  await h.command('marketing.connect', { provider: 'mailchimp', key: 'abc123-us21', listId: 'L1' })
  await b.office.run('segment.push', { segmentId: segment.id, provider: 'mailchimp' })
  const chimp = h.marketing.slice(1)
  assert.deepEqual(chimp.map(x => [x.method, x.url.replace(/[0-9a-f]{32}/, '<md5>')]), [['PUT', 'https://us21.api.mailchimp.com/3.0/lists/L1/members/<md5>'], ['POST', 'https://us21.api.mailchimp.com/3.0/lists/L1/members/<md5>/tags']])
  assert.ok(chimp[0].url.endsWith('/members/ac1ae9524c7b778e5a449b8f7854f99e'), 'the member is the MD5 of the lowercased email')
  assert.deepEqual([chimp[0].body.status_if_new, chimp[1].body.tags.map(t => t.name)], ['transactional', ['Gold VIP replacements', 'VIP']])
  // A workflow rule conditioned on the "commercial" tag (API-005) runs only for a tagged customer's job.
  await h.command('rule.save', { name: 'Commercial job', trigger: 'job.created', condition: { tag: 'Commercial' }, action: { kind: 'notify', to: 'office', message: 'set up the PO' } })
  const jobFor = async (name, tags) => {
    let c = await b.office.run('customer.save', { name })
    c = await b.office.run('customer.tags', { customerId: c.id, version: c.version, tags })
    const site = await b.office.run('site.save', { customerId: c.id, address: `${name} Plaza, Austin TX 78701` })
    const q = await b.dispatcher.run('quote.draft', { customerId: c.id, siteId: site.id, title: 'Rooftop unit', lines: [{ description: 'RTU service', quantity: '1', unitPrice: '420.00' }] })
    const a = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: name })
    return b.dispatcher.run('job.create', { quoteId: q.id })
  }
  const tagged = await jobFor('Lone Star Offices', ['commercial']), plain = await jobFor('Fay Home', [])
  const ran = (await h.state()).ruleRuns.filter(r => r.rule === 'Commercial job').map(r => r.trigger.subjectId)
  assert.deepEqual(ran, [tagged.id])
  assert.ok(plain.id)

  // A member tagged "do not contact" is never pushed, only counted.
  const anaNow = (await h.state()).customers.find(c => c.id === ana.id)
  await b.office.run('customer.tags', { customerId: ana.id, version: anaNow.version, tags: ['VIP', 'Do not contact'] })
  const calls = h.marketing.length
  const held = await b.office.run('segment.push', { segmentId: segment.id, provider: 'mango' })
  assert.deepEqual([held.members, held.pushed, held.skippedDoNotContact, h.marketing.length], [1, 0, 1, calls])
  const exported = JSON.stringify(await (await h.request('/api/glove/export', { as: h.owner() })).json()) + JSON.stringify(await h.state())
  assert.ok(!exported.includes('mango-test-credential') && !exported.includes('abc123-us21'))
  await h.command('marketing.connect', { provider: 'mango', key: null })
  await h.command('marketing.connect', { provider: 'mailchimp', key: null })
  await assertTrail(h, ['field.saved', 'record.custom', 'customer.tags', 'segment.saved', 'marketing.connected', 'marketing.disconnected', 'segment.pushed', 'marketing.outcome', 'rule.saved', 'rule.ran'])
})
