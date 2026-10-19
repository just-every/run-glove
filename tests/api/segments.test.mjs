// CUST-004 custom fields, tags and segments through the command, state,
// segment, CSV and provider doors: two fields and a segment whose members
// match the filter exactly, and the export and the Mango push carrying exactly them.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('CUST-004 two custom fields, tags and a segment: members match the filter and the export carries exactly them', async (t) => {
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
})
