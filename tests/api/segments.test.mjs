// CUST-004 custom fields, tags and segments through the command, state,
// segment, CSV and provider doors: two fields and a segment whose members
// match the filter exactly, and the export and the Mango push carrying exactly them.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { assertTrail, installation, business, acceptedQuote } from './harness.mjs'

// Compare durable business downloads, including the audit, after refused writes
// and reads. The download's observation time is the only transient field.
async function download(h) {
  const response = await h.request('/api/glove/export')
  assert.equal(response.status, 200)
  const { exportedAt: _at, ...kept } = await response.json()
  return kept
}

async function unchanged(h, action) {
  const before = await download(h)
  await action()
  assert.deepEqual(await download(h), before, 'refusal or inspection changes no retained record or audit event')
}

async function deskValuesAndFieldVisibility() {
  const at = '2026-11-05T00:30:00.000Z'
  const h = await installation({ at })
  try {
    const b = await business(h)
    const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
    await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-05', start: '09:00', end: '10:00' })
    const equipment = await h.command('equipment.save', { siteId: b.site.id, type: 'Condenser' })
    const peer = await h.command('customer.save', { name: 'Synthetic Glove Peer' })
    const peerSite = await h.command('site.save', { customerId: peer.id, address: '20 Other St, Austin TX 78701' })
    const peerEquipment = await h.command('equipment.save', { siteId: peerSite.id, type: 'Furnace' })
    const peerJob = await h.command('job.create', { customerId: peer.id, siteId: peerSite.id, title: 'Other work', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '10.00' }] })
    await b.dispatcher.run('visit.book', { jobId: peerJob.id, technicianId: b.tom.id, date: '2026-11-05', start: '09:00', end: '10:00' })
    const kinds = [['customers', b.customer], ['sites', b.site], ['jobs', job], ['equipment', equipment]]
    const definitions = new Map()
    for (const [record] of kinds) {
      const fields = []
      for (const [type, value] of [['text', 'synthetic-glove-private-note'], ['number', '-12.3456'], ['date', '2026-11-04'], [['yes', 'no'].join('/'), 'yes'], ['choice', 'Priority']]) {
        const field = await h.command('field.save', { record, label: `${record} ${type.replace('/', ' or ')}`, type, choices: type === 'choice' ? ['Regular', 'Priority'] : [] })
        fields.push({ field, value })
      }
      definitions.set(record, fields)
    }
    const events = []
    const actors = [
      { id: (await h.request('/auth/session').then(r => r.json())).operator.id, name: 'Olivia Owner', role: 'owner', run: h.command },
      { ...b.dispatcher, role: 'dispatcher' }, { ...b.office, role: 'office' },
    ]
    let expectedTags = []
    for (const [i, actor] of actors.entries()) {
      for (const [record, original] of kinds) {
        const current = (await h.state())[record].find(r => r.id === original.id)
        const values = Object.fromEntries(definitions.get(record).map(({ field, value }) => [field.id, field.type === 'text' ? `${value}-${i}` : value]))
        const payload = { record, id: current.id, version: current.version, values }
        const commandId = `synthetic-glove-values-${record}-${i}`
        const result = await actor.run('record.custom', payload, { commandId })
        assert.deepEqual(result, { ...current, version: current.version + 1, custom: values })
        events.push({ commandId, payload, actor, kind: 'record.custom', subject: record === 'jobs' ? 'job' : record, id: current.id, version: result.version, record })
        await unchanged(h, async () => assert.deepEqual(await actor.run('record.custom', payload, { commandId }), result))
        await unchanged(h, () => actor.run('record.custom', { ...payload, values: {} }, { error: 'STALE' }))
      }
      const customer = (await h.state()).customers.find(r => r.id === b.customer.id)
      // Both limits are accepted together. Case and outer whitespace collapse
      // to the first spelling, without replacing unrelated field values.
      expectedTags = Array.from({ length: 20 }, (_, n) => `${String(n).padStart(2, '0')}${'x'.repeat(38)}`)
      const commandId = `synthetic-glove-tags-${i}`
      const result = await actor.run('customer.tags', { customerId: customer.id, version: customer.version, tags: expectedTags }, { commandId })
      assert.deepEqual(result, { ...customer, version: customer.version + 1, tags: expectedTags })
      events.push({ commandId, actor, kind: 'customer.tags', subject: 'customer', id: customer.id, version: result.version, record: 'customers' })
      for (const tags of [[...expectedTags, 'extra'], ['x'.repeat(41)]]) await unchanged(h, () => actor.run('customer.tags', { customerId: customer.id, version: result.version, tags }, { error: 'INPUT' }))
      await unchanged(h, () => actor.run('customer.tags', { customerId: customer.id, version: customer.version, tags: [] }, { error: 'STALE' }))
      const created = await actor.run('segment.save', { name: `Desk segment ${i}`, filter: { tagsAll: [expectedTags[0]] } })
      const payload = { ...created, name: `Reviewed segment ${i}`, filter: { tagsAll: [expectedTags[1]], tagsNone: ['excluded'] } }
      const edited = await actor.run('segment.save', payload)
      assert.deepEqual([edited.id, edited.version, edited.name, edited.filter.tagsAll, edited.filter.tagsNone], [created.id, 2, `Reviewed segment ${i}`, [expectedTags[1]], ['excluded']])
      await unchanged(h, () => actor.run('segment.save', payload, { error: 'STALE' }))
    }
    let customer = (await h.state()).customers.find(r => r.id === b.customer.id)
    customer = await b.office.run('customer.tags', { customerId: customer.id, version: customer.version, tags: [' VIP ', 'vip', 'Commercial', 'COMMERCIAL'] })
    assert.deepEqual(customer.tags, ['VIP', 'Commercial'])
    const retained = await h.state()
    for (const [record, row] of kinds) {
      const values = Object.fromEntries(definitions.get(record).map(({ field, value }) => [field.id, field.type === 'text' ? `${value}-2` : value]))
      assert.deepEqual(retained[record].find(r => r.id === row.id).custom, values)
      const current = retained[record].find(r => r.id === row.id)
      const invalid = ['text', 'number', 'date', ['yes', 'no'].join('/'), 'choice'].map((type, i) => ({ [definitions.get(record)[i].field.id]: type === 'text' ? 'x'.repeat(501) : type === 'number' ? 'not a number' : type === 'date' ? 'tomorrow' : 'unsupported' }))
      for (const values of invalid) await unchanged(h, () => h.command('record.custom', { record, id: row.id, version: current.version, values }, { error: 'INPUT' }))
      const otherKind = record === 'sites' ? 'jobs' : 'sites'
      await unchanged(h, () => h.command('record.custom', { record, id: row.id, version: current.version, values: { [definitions.get(otherKind)[0].field.id]: 'wrong record' } }, { error: 'INPUT' }))
    }
    const viewer = await h.person('Synthetic Glove Reader', 'viewer')
    for (const person of [b.priyaPerson, b.tomPerson, b.agent, viewer]) {
      const current = (await h.state()).customers.find(r => r.id === customer.id)
      for (const [type, payload] of [
        ['record.custom', { record: 'customers', id: customer.id, version: current.version, values: {} }],
        ['customer.tags', { customerId: customer.id, version: current.version, tags: [] }],
        ['segment.save', { name: 'Forbidden segment', filter: {} }],
      ]) await unchanged(h, () => person.run(type, payload, { error: 'FORBIDDEN' }))
    }
    const assertProjection = async () => unchanged(h, async () => {
      const view = await b.priyaPerson.state()
      assert.deepEqual(view.sites.map(r => r.id), [b.site.id])
      assert.deepEqual(view.jobs.map(r => r.id), [job.id])
      assert.deepEqual(view.equipment.map(r => r.id), [equipment.id])
      for (const [record, row] of kinds.filter(([kind]) => kind !== 'customers')) assert.deepEqual(view[record].find(r => r.id === row.id).custom, retained[record].find(r => r.id === row.id).custom)
      assert.deepEqual(view.customFields.map(f => f.id).sort(), [...definitions].filter(([kind]) => kind !== 'customers').flatMap(([, entries]) => entries.map(({ field }) => field.id)).sort())
      assert.deepEqual(view.customers, [{ id: customer.id, version: customer.version, name: b.customer.name, phone: b.customer.phone, contact: b.customer.contact }])
      const other = await b.tomPerson.state()
      assert.deepEqual(other.sites.map(r => r.id), [peerSite.id])
      assert.deepEqual(other.jobs.map(r => r.id), [peerJob.id])
      assert.deepEqual(other.equipment.map(r => r.id), [peerEquipment.id])
      assert.ok(!JSON.stringify(other).includes('synthetic-glove-private-note'))
    })
    await assertProjection()
    await h.restart()
    await assertProjection()
    for (const [record, row] of kinds) assert.deepEqual((await h.state())[record].find(r => r.id === row.id), retained[record].find(r => r.id === row.id))
    const { activity, exported } = await assertTrail(h, ['record.custom', 'customer.tags', 'segment.saved'])
    for (const expected of events) {
      const found = activity.filter(e => e.commandId === expected.commandId)
      assert.equal(found.length, 1)
      assert.deepEqual([found[0].at, found[0].actorId, found[0].actorName, found[0].actorRole, found[0].kind, found[0].subjectKind, found[0].subjectId], [at, expected.actor.id, expected.actor.name, expected.actor.role, expected.kind, expected.subject, expected.id])
      assert.ok(found[0].recordChanges.some(r => r.kind === expected.record && r.id === expected.id && r.toVersion === expected.version))
      assert.equal(exported.timeline.filter(e => e.command_id === expected.commandId).length, 1)
    }
    await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
    const current = (await h.state()).customers.find(r => r.id === customer.id)
    await unchanged(h, () => b.office.run('customer.tags', { customerId: current.id, version: current.version, tags: [] }, { commandId: 'synthetic-glove-tags-2', error: 'FORBIDDEN' }))
    const preview = await h.command('privacy.preview', { customerId: current.id, version: current.version })
    await h.command('privacy.erase', { customerId: current.id, version: current.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    await h.restart()
    await unchanged(h, async () => {
      for (const [record, row] of kinds) {
        const state = await h.state()
        assert.ok(!state[record].find(r => r.id === row.id)?.custom)
        const original = events.find(e => e.commandId === `synthetic-glove-values-${record}-0`)
        await h.command('record.custom', original.payload, { commandId: original.commandId, error: 'ERASED' })
      }
      assert.ok(!JSON.stringify(await download(h)).includes('synthetic-glove-private-note'))
    })
  } finally { await h.close() }
}

async function liveSegmentPredicates() {
  // UTC is already November 5; Chicago is still November 4. The anniversary
  // boundary must follow the business date, including after Worker restart.
  const h = await installation({ at: '2026-11-05T00:30:00.000Z' })
  try {
    const b = await business(h, { currency: 'USD', timezone: ['America', 'Chicago'].join('/') })
    const tier = await h.command('field.save', { record: 'customers', label: 'Tier', type: 'choice', choices: ['Gold', 'Silver'] })
    const rating = await h.command('field.save', { record: 'customers', label: 'Rating', type: 'number' })
    const review = await h.command('field.save', { record: 'customers', label: 'Review date', type: 'date' })
    const inspected = await h.command('field.save', { record: 'customers', label: 'Inspected', type: ['yes', 'no'].join('/') })
    const memo = await h.command('field.save', { record: 'customers', label: 'Memo', type: 'text' })
    const property = await h.command('field.save', { record: 'sites', label: 'Use', type: 'choice', choices: ['Residential', 'Commercial'] })
    const fixtures = [
      ['Ana', ['VIP', 'Commercial'], 'Gold', '10', '2026-11-04', 'yes', 'Urgent, inspect', '2016-11-04'],
      ['Ben', ['vip', 'commercial'], 'Silver', '9', '2026-11-03', 'no', '', '2016-11-05'],
      ['Cy', ['Vip', 'COMMERCIAL'], 'Gold', '11', '2026-11-05', 'yes', 'Priority', '2015-01-01'],
      ['Dee', ['VIP', 'Commercial', 'Excluded'], 'Gold', '10', '2026-11-04', 'no', 'Priority', '2010-01-01'],
      ['Eve', ['VIP'], 'Gold', '10', '2026-11-04', 'yes', 'Priority', '2010-01-01'],
      ['Fay', ['VIP', 'Commercial'], 'Gold', '10', '2026-11-04', 'no', '', null],
    ]
    const people = {}, sites = {}
    for (const [name, tags, level, score, date, yes, text, installedOn] of fixtures) {
      let customer = await b.office.run('customer.save', { name: `Synthetic Glove ${name}`, email: [`synthetic-glove-${name.toLowerCase()}`, 'example.test'].join('@'), phone: `555010${String(Object.keys(people).length).padStart(3, '0')}` })
      customer = await b.office.run('customer.tags', { customerId: customer.id, version: customer.version, tags })
      people[name] = await b.office.run('record.custom', { record: 'customers', id: customer.id, version: customer.version, values: { [tier.id]: level, [rating.id]: score, [review.id]: date, [inspected.id]: yes, [memo.id]: text } })
      const site = await b.office.run('site.save', { customerId: customer.id, address: `${name} St, Austin TX 78701` })
      sites[name] = await b.office.run('record.custom', { record: 'sites', id: site.id, version: site.version, values: { [property.id]: name === 'Eve' ? 'Residential' : 'Commercial' } })
      if (installedOn) await b.office.run('equipment.save', { siteId: site.id, type: 'Furnace', installedOn })
    }
    const second = await b.office.run('site.save', { customerId: people.Eve.id, address: 'Eve Second St, Austin TX 78701' })
    await b.office.run('record.custom', { record: 'sites', id: second.id, version: second.version, values: { [property.id]: 'Commercial' } })
    let duplicate = await h.command('customer.save', { name: 'Synthetic Glove Merged', phone: people.Ana.phone })
    duplicate = await h.command('customer.tags', { customerId: duplicate.id, version: duplicate.version, tags: ['VIP', 'Commercial'] })
    await h.command('customer.merge', { survivorId: people.Ana.id, mergedIds: [duplicate.id], versions: { [people.Ana.id]: people.Ana.version, [duplicate.id]: duplicate.version } })
    const names = ['Ana', 'Ben', 'Cy', 'Dee', 'Eve', 'Fay']
    const cases = [
      ['All tags and no excluded tag', { tagsAll: ['vIp', 'COMMERCIAL'], tagsNone: ['excluded'] }, ['Ana', 'Ben', 'Cy', 'Fay']],
      ['Choice equality', { fields: [{ fieldId: tier.id, op: 'is', value: 'Gold' }] }, ['Ana', 'Cy', 'Dee', 'Eve', 'Fay']],
      ['Number equality', { fields: [{ fieldId: rating.id, op: 'is', value: '10' }] }, ['Ana', 'Dee', 'Eve', 'Fay']],
      ['Strictly over', { fields: [{ fieldId: rating.id, op: 'over', value: '10' }] }, ['Cy']],
      ['Strictly under', { fields: [{ fieldId: rating.id, op: 'under', value: '10' }] }, ['Ben']],
      ['Date before', { fields: [{ fieldId: review.id, op: 'under', value: '2026-11-04' }] }, ['Ben']],
      ['Date after', { fields: [{ fieldId: review.id, op: 'over', value: '2026-11-04' }] }, ['Cy']],
      ['Boolean equality', { fields: [{ fieldId: inspected.id, op: 'is', value: 'yes' }] }, ['Ana', 'Cy', 'Eve']],
      ['Text equality ignores case', { fields: [{ fieldId: memo.id, op: 'is', value: ' PRIORITY ' }] }, ['Cy', 'Dee', 'Eve']],
      ['Value set', { fields: [{ fieldId: memo.id, op: 'set' }] }, ['Ana', 'Cy', 'Dee', 'Eve']],
      ['Value unset', { tagsAll: ['vip'], fields: [{ fieldId: memo.id, op: 'unset' }] }, ['Ben', 'Fay']],
      ['Any site can qualify', { fields: [{ fieldId: property.id, op: 'is', value: 'Commercial' }] }, names],
      ['Equipment local anniversary', { equipmentOlderThanYears: 10 }, ['Ana', 'Cy', 'Dee', 'Eve']],
      ['Every predicate together', { tagsAll: ['VIP', 'commercial'], tagsNone: ['Excluded'], fields: [{ fieldId: tier.id, op: 'is', value: 'Gold' }, { fieldId: rating.id, op: 'under', value: '11' }, { fieldId: property.id, op: 'is', value: 'Commercial' }], equipmentOlderThanYears: 10 }, ['Ana']],
    ]
    const saved = []
    for (const [name, filter, expected] of cases) saved.push({ segment: await b.dispatcher.run('segment.save', { name, filter }), expected })
    const noAgreement = await b.office.run('segment.save', { name: 'No active agreement', filter: { tagsAll: ['vip'], noAgreement: true } })
    const readMembers = async (segment, expected, as = h.owner()) => {
      const response = await h.request(`/api/glove/segments/${segment.id}`, { as })
      assert.equal(response.status, 200)
      const body = await response.json()
      assert.deepEqual(body.members.map(m => m.id).sort(), expected.map(name => people[name].id).sort(), segment.name)
      assert.ok(!body.members.some(m => m.id === duplicate.id), 'merged identities are never audience members')
      return body
    }
    await readMembers(noAgreement, names)
    const plan = await h.command('plan.save', { name: 'Synthetic Glove Care', price: '120.00', termMonths: 12, includedVisits: 2, visitServiceId: b.service.id })
    const active = await b.office.run('agreement.sell', { planId: plan.id, customerId: people.Ana.id, siteId: sites.Ana.id, via: 'phone', startDate: '2026-11-04' })
    await b.office.run('agreement.sell', { planId: plan.id, customerId: people.Ben.id, siteId: sites.Ben.id, via: 'phone', startDate: '2026-11-06' })
    await readMembers(noAgreement, ['Ben', 'Cy', 'Dee', 'Eve', 'Fay'])
    await b.office.run('agreement.end', { agreementId: active.id, version: active.version, reason: 'Customer ended term' })
    await readMembers(noAgreement, names)
    const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
    const assertReads = async () => unchanged(h, async () => {
      for (const { segment, expected } of saved) await readMembers(segment, expected)
      const last = saved.at(-1).segment
      for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie, viewer.cookie, b.agent.cookie]) {
        const body = await readMembers(last, ['Ana'], as)
        assert.deepEqual(body.members, [{ id: people.Ana.id, name: 'Synthetic Glove Ana', email: ['synthetic-glove-ana', 'example.test'].join('@'), tags: ['VIP', 'Commercial'] }])
      }
      const expectedCells = { Name: 'Synthetic Glove Ana', Email: ['synthetic-glove-ana', 'example.test'].join('@'), Phone: '555010000', Tags: 'VIP; Commercial', Tier: 'Gold', Rating: '10', 'Review date': '2026-11-04', Inspected: 'yes', Memo: '"Urgent, inspect"' }
      for (const as of [h.owner(), b.office.cookie]) {
        const response = await h.request(`/api/glove/segments/${last.id}.csv`, { as })
        assert.equal(response.status, 200)
        assert.match(response.headers.get('content-type'), /^text\/csv/)
        const csv = await response.text(), header = csv.split('\r\n')[0].split(',')
        assert.deepEqual([...header].sort(), Object.keys(expectedCells).sort())
        assert.equal(csv, header.join(',') + '\r\n' + header.map(key => expectedCells[key]).join(',') + '\r\n')
      }
      for (const as of [b.dispatcher.cookie, viewer.cookie, b.agent.cookie, b.priyaPerson.cookie]) assert.equal((await h.request(`/api/glove/segments/${last.id}.csv`, { as })).status, 403)
      for (const as of [b.priyaPerson.cookie, b.tomPerson.cookie]) assert.equal((await h.request(`/api/glove/segments/${last.id}`, { as })).status, 403)
      for (const suffix of ['', '.csv']) assert.equal((await h.request(`/api/glove/segments/${last.id}${suffix}`, { as: '' })).status, 401)
    })
    await assertReads()
    await h.restart()
    await assertReads()
    // A saved filter reads current values, rather than freezing an audience
    // when it was defined. A real later edit changes both read and CSV doors.
    const ana = (await h.state()).customers.find(r => r.id === people.Ana.id)
    const changed = await b.office.run('record.custom', { record: 'customers', id: ana.id, version: ana.version, values: { [rating.id]: '12' } })
    assert.deepEqual(changed.custom, { ...ana.custom, [rating.id]: '12' })
    await h.restart()
    await unchanged(h, async () => {
      await readMembers(saved.at(-1).segment, [])
      const response = await h.request(`/api/glove/segments/${saved.at(-1).segment.id}.csv`, { as: b.office.cookie })
      assert.equal(response.status, 200)
      assert.equal((await response.text()).trim().split('\r\n').length, 1, 'a customer who no longer qualifies has no exported row')
      await readMembers(saved.find(x => x.segment.name === 'Strictly over').segment, ['Ana', 'Cy'])
    })
    await assertTrail(h, ['segment.saved', 'customer.tags', 'record.custom'])
  } finally { await h.close() }
}

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
  await deskValuesAndFieldVisibility()
  await liveSegmentPredicates()
  await marketingHandoff()
  const h = await installation({ at: '2026-11-05T12:00:00.000Z' })
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
  await b.office.run('marketing.connect', { provider: 'mango', url: 'https://mango.example.test', key: 'synthetic-glove-91' }, { error: 'FORBIDDEN' })
  await h.command('marketing.connect', { provider: 'mango', url: 'https://mango.example.test', key: 'synthetic-glove-91' })
  const push = await b.office.run('segment.push', { segmentId: segment.id, provider: 'mango' })
  assert.deepEqual([push.members, push.pushed, push.skippedNoEmail, push.skippedDoNotContact, push.failed], [1, 1, 0, 0, []])
  assert.deepEqual(h.marketing.map(x => [x.method, x.url, x.authorization, x.body]), [['PUT', 'https://mango.example.test/api/integrations/v1/contacts', 'Bearer synthetic-glove-91', { email: ['ana.ruiz', 'example.test'].join('@'), displayName: 'Ana Ruiz', segmentName: 'Gold VIP replacements', tags: ['VIP'] }]])
  // Mailchimp: the member added as transactional (not subscribed) and tagged with the segment.
  await h.command('marketing.connect', { provider: 'mailchimp', key: 'synthetic-glove-92-us21', listId: 'L1' })
  await b.office.run('segment.push', { segmentId: segment.id, provider: 'mailchimp' })
  const chimp = h.marketing.slice(1)
  assert.deepEqual(chimp.map(x => [x.method, x.url.replace(/[0-9a-f]{32}/, '<md5>')]), [['PUT', 'https://us21.api.mailchimp.com/3.0/lists/L1/members/<md5>'], ['POST', 'https://us21.api.mailchimp.com/3.0/lists/L1/members/<md5>/tags']])
  assert.ok(chimp[0].url.endsWith('/members/ac1ae9524c7b778e5a449b8f7854f99e'), 'the member is the MD5 of the lowercased email')
  assert.deepEqual([chimp[0].body.status_if_new, chimp[1].body.tags.map(t => t.name)], ['transactional', ['Gold VIP replacements', 'VIP']])
  // A workflow rule conditioned on the "commercial" tag (API-005) runs only for a tagged customer's job.
  const commercialRule = await h.command('rule.save', { name: 'Commercial job', trigger: 'job.created', condition: { tag: 'Commercial' }, action: { kind: 'notify', to: 'office', message: 'set up the PO' } })
  const jobFor = async (name, tags) => {
    let c = await b.office.run('customer.save', { name })
    c = await b.office.run('customer.tags', { customerId: c.id, version: c.version, tags })
    const site = await b.office.run('site.save', { customerId: c.id, address: `${name} Plaza, Austin TX 78701` })
    const q = await b.dispatcher.run('quote.draft', { customerId: c.id, siteId: site.id, title: 'Rooftop unit', lines: [{ description: 'RTU service', quantity: '1', unitPrice: '420.00' }] })
    const a = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: name })
    const payload = { quoteId: q.id }, commandId = `synthetic-glove-rule-job-${name.replaceAll(' ', '-')}`
    const job = await b.dispatcher.run('job.create', payload, { commandId })
    await unchanged(h, async () => assert.deepEqual(await b.dispatcher.run('job.create', payload, { commandId }), job))
    return job
  }
  const tagged = await jobFor('Lone Star Offices', ['commercial']), plain = await jobFor('Fay Home', [])
  const ran = (await h.state()).ruleRuns.filter(r => r.rule === 'Commercial job').map(r => r.trigger.subjectId)
  assert.deepEqual(ran, [tagged.id])
  assert.ok(plain.id)
  const assertRule = async () => unchanged(h, async () => {
    const state = await h.state()
    assert.deepEqual(state.ruleRuns.filter(r => r.ruleId === commercialRule.id).map(r => [r.ruleVersion, r.trigger.kind, r.trigger.subjectId, r.trigger.jobId, r.outcome, r.detail]), [[1, 'job.created', tagged.id, tagged.id, 'done', 'notice to office']])
    assert.deepEqual((await b.office.state()).notices.filter(n => n.ruleId === commercialRule.id).map(n => [n.to, n.jobId, n.message]), [[['office'], tagged.id, `Commercial job: ${tagged.number} set up the PO`]])
    assert.deepEqual((await b.dispatcher.state()).notices.filter(n => n.ruleId === commercialRule.id), [])
  })
  await assertRule()
  await h.restart()
  await assertRule()

  // A member tagged "do not contact" is never pushed, only counted.
  const anaNow = (await h.state()).customers.find(c => c.id === ana.id)
  await b.office.run('customer.tags', { customerId: ana.id, version: anaNow.version, tags: ['VIP', 'Do not contact'] })
  const calls = h.marketing.length
  const held = await b.office.run('segment.push', { segmentId: segment.id, provider: 'mango' })
  assert.deepEqual([held.members, held.pushed, held.skippedDoNotContact, h.marketing.length], [1, 0, 1, calls])
  const exported = JSON.stringify(await (await h.request('/api/glove/export', { as: h.owner() })).json()) + JSON.stringify(await h.state())
  assert.ok(!exported.includes('synthetic-glove-91') && !exported.includes('synthetic-glove-92-us21'))
  await h.command('marketing.connect', { provider: 'mango', key: null })
  await h.command('marketing.connect', { provider: 'mailchimp', key: null })
  await assertTrail(h, ['field.saved', 'record.custom', 'customer.tags', 'segment.saved', 'marketing.connected', 'marketing.disconnected', 'segment.pushed', 'marketing.outcome', 'rule.saved', 'rule.ran'])
})

// CUST-006: one audience journey through native commands and provider edges.
async function marketingHandoff() {
  const at = '2026-11-05T12:00:00.000Z'
  const h = await installation({ at, captureLogs: true })
  try {
    const b = await business(h, { currency: 'USD', timezone: 'UTC' })
    const mangoKey = 'synthetic-glove-93', chimpKey = 'synthetic-glove-94-us21'
    const secretForms = [mangoKey, chimpKey, Buffer.from(`glove:${chimpKey}`).toString('base64')]
    const connections = [
      { provider: 'mango', key: mangoKey, url: 'https://mango.example.test' },
      { provider: 'mailchimp', key: chimpKey, listId: 'synthetic-glove-95' },
    ]
    const token = await h.command('token.issue', { name: 'Audience integration', role: 'office' })
    for (const connection of connections) {
      for (const person of [b.office, b.dispatcher, b.agent, b.priyaPerson]) await unchanged(h, () => person.run('marketing.connect', connection, { error: 'FORBIDDEN' }))
      await unchanged(h, async () => {
        const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: 'synthetic-glove-connect-token-' + connection.provider, type: 'marketing.connect', payload: connection } })
        assert.equal(response.status, 403)
        assert.equal((await response.json()).error.code, 'FORBIDDEN')
      })
      for (const key of ['', ' ', {}, 'synthetic-glove-'.repeat(20)]) await unchanged(h, () => h.command('marketing.connect', { ...connection, key }, { error: 'INPUT' }))
    }
    for (const url of ['http://mango.example.test', 'not an address', ['https://person:password', 'mango.example.test'].join('@'), 'ftp://mango.example.test']) await unchanged(h, () => h.command('marketing.connect', { ...connections[0], url }, { error: 'INPUT' }))
    for (const key of ['synthetic-glove-96', 'synthetic-glove-96-US21', 'synthetic-glove-96-us']) await unchanged(h, () => h.command('marketing.connect', { ...connections[1], key }, { error: 'INPUT' }))
    await unchanged(h, () => h.command('marketing.connect', { ...connections[1], listId: '' }, { error: 'INPUT' }))
    const connectCommands = []
    for (const [index, connection] of connections.entries()) {
      const commandId = `synthetic-glove-connect-${index}`
      const result = await h.command('marketing.connect', connection, { commandId })
      assert.deepEqual(result.marketing[connection.provider], { ...(connection.provider === 'mango' ? { url: 'https://mango.example.test' } : { listId: 'synthetic-glove-95' }), connectedAt: at, by: 'Olivia Owner' })
      connectCommands.push({ commandId, connection, result })
    }
    assert.equal(h.marketing.length, 0, 'connecting never sends an audience or claims provider verification')

    const customers = []
    const specs = [
      ['Eligible', 'one', ['Audience', 'Repair']],
      ['Member refusal', 'two', ['Audience']],
      ['Tag refusal', 'three', ['Audience', 'VIP']],
      ['Unreachable', 'four', ['Audience']],
      ['Missing email', null, ['Audience']],
      ['Do not contact', 'five', ['Audience', 'Do Not Contact']],
      ['SMS stopped', 'six', ['Audience']],
    ]
    for (const [name, mailbox, tags] of specs) {
      let customer = await b.office.run('customer.save', { name, ...(mailbox ? { email: ['synthetic-glove-' + mailbox, 'example.test'].join('@') } : {}), ...(name === 'SMS stopped' ? { phone: '+13125550123' } : {}) })
      customer = await b.office.run('customer.tags', { customerId: customer.id, version: customer.version, tags })
      customers.push(customer)
    }
    // Record a real authenticated inbound STOP; no outgoing SMS is enabled.
    await h.command('sms.connect', { version: (await h.state()).business[0].version, provider: 'twilio', accountSid: h.twilio.accountSid, authToken: h.twilio.authToken, fromNumber: h.twilio.fromNumber, registration: 'a2p10dlc', registered: true, live: true })
    const stop = h.twilio.inbound(h.origin, '+13125550123', 'STOP')
    assert.equal((await h.mf.dispatchFetch(stop.url, { method: stop.method, headers: Object.fromEntries(stop.headers), body: await stop.text() })).status, 200)
    assert.equal((await h.state()).customers.find(c => c.id === customers[6].id).smsOptOut.blocked, true)
    const segment = await b.office.run('segment.save', { name: 'Service audience', filter: { tagsAll: ['Audience'] } })
    const members = await (await h.request(`/api/glove/segments/${segment.id}`)).json()
    assert.deepEqual(members.members.map(c => c.id).sort(), customers.map(c => c.id).sort())
    const expectedMango = customers.slice(0, 4).map((customer, index) => ({
      method: 'PUT', url: 'https://mango.example.test/api/integrations/v1/contacts', authorization: `Bearer ${mangoKey}`,
      body: { email: ['synthetic-glove-' + ['one', 'two', 'three', 'four'][index], 'example.test'].join('@'), displayName: specs[index][0], segmentName: 'Service audience', tags: specs[index][2] },
    }))
    const chimpCalls = (failures) => customers.slice(0, 4).flatMap((customer, index) => {
      const email = ['synthetic-glove-' + ['one', 'two', 'three', 'four'][index], 'example.test'].join('@')
      const url = `https://us21.api.mailchimp.com/3.0/lists/synthetic-glove-95/members/${createHash('md5').update(email.toLowerCase()).digest('hex')}`
      const authorization = `Basic ${Buffer.from(`glove:${chimpKey}`).toString('base64')}`
      return [{ method: 'PUT', url, authorization, body: { email_address: email, status_if_new: 'transactional', merge_fields: { FNAME: specs[index][0] } } },
        ...((failures && [1, 3].includes(index)) ? [] : [{ method: 'POST', url: url + '/tags', authorization, body: { tags: ['Service audience', ...specs[index][2]].map(name => ({ name, status: 'active' })) } }])]
    })
    const outcomes = [], replays = []
    let failures = false
    h.marketing.answer = async call => {
      const mango = call.url.startsWith('https://mango.example.test/')
      // Only these opaque synthetic credentials have contacts:write authority at the edge.
      assert.equal(call.authorization, mango ? `Bearer ${mangoKey}` : `Basic ${Buffer.from(`glove:${chimpKey}`).toString('base64')}`)
      if (!failures) return Response.json({ ok: true })
      const email = mango ? call.body.email : call.body.email_address
      if (email?.startsWith('synthetic-glove-four')) return new Response(null, { status: 503, headers: { 'x-synthetic-glove-network-error': '1' } })
      const status = email?.startsWith('synthetic-glove-two') ? (mango ? 403 : 401) : (mango && email?.startsWith('synthetic-glove-three') || !mango && call.method === 'POST' && call.url.includes(createHash('md5').update(['synthetic-glove-three', 'example.test'].join('@')).digest('hex'))) ? 429 : 200
      return Response.json({ detail: mango ? mangoKey : chimpKey }, { status })
    }
    const shape = row => ({ by: row.by, segmentId: row.segmentId, segment: row.segment, provider: row.provider, members: row.members, pushed: row.pushed, skippedNoEmail: row.skippedNoEmail, skippedDoNotContact: row.skippedDoNotContact, failed: [...row.failed].sort((a, z) => a.customerId.localeCompare(z.customerId)) })
    const assertRound = async (round) => {
      for (const refused of [false, true]) {
        failures = refused
        for (const provider of ['mango', 'mailchimp']) for (const [role, person] of [['owner', { id: (await h.state()).operators.find(o => o.nativeRole === 'owner').id, name: 'Olivia Owner', run: h.command }], ['office', b.office]]) {
          const callCount = h.marketing.length, commandId = `synthetic-glove-push-${round}-${refused}-${provider}-${role}`
          const payload = { segmentId: segment.id, provider }
          const row = await person.run('segment.push', payload, { commandId })
          const statuses = refused ? (provider === 'mango' ? [200, 403, 429, 0] : [200, 401, 429, 0]) : [200, 200, 200, 200]
          const expected = { by: { id: person.id, name: person.name }, segmentId: segment.id, segment: 'Service audience', provider, members: 7, pushed: refused ? 1 : 4, skippedNoEmail: 1, skippedDoNotContact: 2, failed: refused ? customers.slice(1, 4).map((c, index) => ({ customerId: c.id, status: statuses[index + 1] })).sort((a, z) => a.customerId.localeCompare(z.customerId)) : [] }
          assert.deepEqual(shape(row), expected)
          assert.equal(row.createdAt, at)
          const orderedCalls = calls => [...calls].sort((a, z) => JSON.stringify(a).localeCompare(JSON.stringify(z)))
          assert.deepEqual(orderedCalls(h.marketing.slice(callCount)), orderedCalls(provider === 'mango' ? expectedMango : chimpCalls(refused)), 'exact provider payloads contain no subscribe or existing-member status change')
          outcomes.push({ commandId, provider, statuses })
          replays.push({ commandId, payload, person, row })
          await unchanged(h, async () => assert.deepEqual(await person.run('segment.push', payload, { commandId }), row))
          assert.equal(h.marketing.length - callCount, provider === 'mango' ? 4 : chimpCalls(refused).length, 'replay never repeats a provider call')
          if (round) assert.deepEqual(shape(row), shape(replays.find(r => r.commandId === commandId.replace('push-1-', 'push-0-')).row), 'restart retains the same audience and outcome semantics')
        }
      }
    }
    await assertRound(0)
    const beforeRestart = await download(h), callsBeforeRestart = h.marketing.length
    await h.restart()
    assert.equal(h.marketing.length, callsBeforeRestart, 'restart sends nothing')
    assert.deepEqual(await download(h), beforeRestart)
    for (const replay of [...replays]) await unchanged(h, async () => assert.deepEqual(await replay.person.run('segment.push', replay.payload, { commandId: replay.commandId }), replay.row))
    assert.equal(h.marketing.length, callsBeforeRestart, 'persisted command replay sends nothing')
    await assertRound(1)
    for (const { commandId, connection, result } of connectCommands) await unchanged(h, async () => assert.deepEqual(await h.command('marketing.connect', connection, { commandId }), result))

    const { activity, exported } = await assertTrail(h, ['marketing.connected', 'segment.pushed', 'marketing.outcome'])
    for (const { commandId, provider, statuses } of outcomes) {
      const facts = exported.timeline.filter(e => e.command_id === commandId && e.kind === 'marketing.outcome').map(e => ({ ...e, data: JSON.parse(e.data) })).sort((a, z) => a.data.customerId.localeCompare(z.data.customerId))
      const expected = customers.slice(0, 4).map((c, index) => ({ provider: provider === 'mango' ? 'Mango' : 'Mailchimp', role: 'provider', at, subjectId: segment.id, data: { segmentId: segment.id, customerId: c.id, status: statuses[index] }, summary: `${provider === 'mango' ? 'Mango' : 'Mailchimp'} audience sync: ${statuses[index] ? `HTTP ${statuses[index]}` : 'outcome not confirmed'}` })).sort((a, z) => a.data.customerId.localeCompare(z.data.customerId))
      assert.deepEqual(facts.map(e => ({ provider: e.actor_name, role: e.actor_role, at: e.at, subjectId: e.subject_id, data: e.data, summary: e.summary })), expected)
      for (const fact of facts) {
        assert.equal(fact.id, `${commandId}:marketing:${fact.data.customerId}`)
        const shown = activity.find(e => e.id === fact.id)
        assert.ok(shown, 'each member outcome is visible in Activity')
        assert.deepEqual([shown.actorName, shown.actorRole, shown.at, shown.commandId, shown.subjectId, shown.summary], [fact.actor_name, 'provider', at, commandId, segment.id, fact.summary])
      }
    }
    const saved = (await h.db.prepare('SELECT result FROM glove_commands').all()).results
    const surfaces = [await h.state(), saved, activity, exported, h.logs]
    assert.ok(h.logs.length, 'actual Worker runtime output was captured across restarts')
    for (const surface of surfaces) for (const secret of secretForms) assert.ok(!JSON.stringify(surface).includes(secret), 'provider keys and encoded authorization never enter a retained or logged surface')
    const calls = h.marketing.length
    for (const connection of connections) {
      await h.command('marketing.connect', { provider: connection.provider, key: null })
      await unchanged(h, () => b.office.run('segment.push', { segmentId: segment.id, provider: connection.provider }, { error: 'MARKETING' }))
    }
    assert.equal(h.marketing.length, calls, 'disconnected credentials cannot send')
    // Syntactically valid credentials still need the provider's permission.
    // Connecting one never manufactures verified provider authority.
    h.marketing.answer = call => Response.json({ detail: call.authorization }, { status: 401 })
    for (const connection of connections) {
      const key = connection.provider === 'mango' ? 'synthetic-glove-97' : 'synthetic-glove-98-us21'
      await h.command('marketing.connect', { ...connection, key })
      const callCount = h.marketing.length
      const rejected = await h.command('segment.push', { segmentId: segment.id, provider: connection.provider })
      assert.deepEqual([rejected.members, rejected.pushed, rejected.skippedNoEmail, rejected.skippedDoNotContact], [7, 0, 1, 2])
      assert.deepEqual([...rejected.failed].sort((a, z) => a.customerId.localeCompare(z.customerId)), customers.slice(0, 4).map(c => ({ customerId: c.id, status: 401 })).sort((a, z) => a.customerId.localeCompare(z.customerId)))
      assert.equal(h.marketing.length - callCount, 4, 'a refused member creates no Mailchimp tags call')
      for (const surface of [await h.state(), await download(h), (await h.db.prepare('SELECT result FROM glove_commands').all()).results, h.logs]) assert.ok(!JSON.stringify(surface).includes(key), 'a provider-refused key stays secret too')
      await h.command('marketing.connect', { provider: connection.provider, key: null })
    }
    const callsAfterCredentialRefusals = h.marketing.length

    await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
    await unchanged(h, () => b.office.run('segment.push', replays[0].payload, { commandId: replays.find(r => r.person === b.office).commandId, error: 'FORBIDDEN' }))
    const erased = (await h.state()).customers.find(c => c.id === customers[1].id)
    const preview = await h.command('privacy.preview', { customerId: erased.id, version: erased.version })
    await h.command('privacy.erase', { customerId: erased.id, version: erased.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
    for (const replay of replays.filter(r => r.person.name === 'Olivia Owner')) await unchanged(h, async () => {
      if (replay.row.failed.some(f => f.customerId === erased.id)) await replay.person.run('segment.push', replay.payload, { commandId: replay.commandId, error: 'ERASED' })
      else assert.deepEqual(await replay.person.run('segment.push', replay.payload, { commandId: replay.commandId }), replay.row)
    })
    assert.equal(h.marketing.length, callsAfterCredentialRefusals, 'erasure and replay never resurrect a contact or send it again')
  } finally { await h.close() }
}
