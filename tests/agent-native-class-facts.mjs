import assert from 'node:assert/strict'

/** Native class facts, counted independently of the preparation that classifies them. */
export async function pricebookClassFacts({ request, origin, cookie, tool }) {
  const state = async () => {
    const response = await request(origin + '/api/glove/state', { headers: { Cookie: cookie } })
    assert.equal(response.status, 200)
    return response.json()
  }
  const command = async (type, payload) => {
    const response = await request(origin + '/api/glove/commands', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
    const body = await response.json()
    assert.equal(response.status, 200, `${type}: ${body.error?.code}`)
    return body.result
  }
  const category = 'Class facts'
  await command('pricebook.category', { name: category, markupPercent: '50' })
  const save = (suffix, fields) => command('service.save', { code: `CLASS-${suffix}`, name: `synthetic-glove-${suffix}`, category, unitPrice: '100.00', unitCost: '10.00', tax: 'FREE', ...fields })
  const material = await save('material', { kind: 'material', pricing: 'markup', unitPrice: '0.00' })
  const markup = await save('markup', { pricing: 'markup', unitCost: '20.00', unitPrice: '0.00' })
  const task = await save('task', { kind: 'task', pricing: 'markup', unitPrice: '0.00', components: [{ serviceId: material.id, quantity: '2' }] })
  const fixedA = await save('fixed-a', {})
  const fixedB = await save('fixed-b', { unitPrice: '40.00' })
  const retired = await save('archived', { archived: true })
  const other = await save('other', { category: 'Other class facts' })
  const fixtureIds = [material, markup, task, fixedA, fixedB, retired, other].map(row => row.id)
  assert.equal(new Set(fixtureIds).size, 7)

  const customer = await command('customer.save', { name: 'synthetic-glove-class-customer' })
  const site = await command('site.save', { customerId: customer.id, address: '19 Synthetic Street', zip: '78704' })
  const items = [material, markup, task, fixedA, fixedB]
  const draft = await command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'synthetic-glove-class-quote', lines: items.map(row => ({ serviceId: row.id, description: row.name, quantity: '1', unitPrice: row.unitPrice, tax: 'FREE' })) })
  const approved = await command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  assert.equal(approved.status, 'approved')
  const accepted = await command('quote.accept', { quoteId: draft.id, version: approved.version, revision: 1, method: 'in person', customerName: customer.name })
  assert.equal(accepted.status, 'accepted')
  const job = await command('job.create', { quoteId: draft.id })
  const plan = await command('plan.save', { name: 'synthetic-glove-class-plan', price: '240.00', termMonths: 12, includedVisits: 2, visitServiceId: task.id })
  const agreement = await command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'quote', quoteId: draft.id, startDate: '2026-01-01' })
  const seeded = await state()
  for (const [kind, id] of [['quotes', draft.id], ['jobs', job.id], ['plans', plan.id], ['agreements', agreement.id], ['customers', customer.id]]) assert.ok(seeded[kind].some(row => row.id === id), `${kind} is nonempty`)
  assert.deepEqual([material.unitPrice, markup.unitPrice, task.unitCost, task.unitPrice], ['15.00', '30.00', '20.00', '30.00'])
  // All other native collections stay byte-for-byte equal; the desk also projects Activity events.
  // This includes customer decisions, messages and every retained provider outcome.
  const protectedState = current => Object.fromEntries(Object.entries(current).filter(([key]) => !['version', 'services', 'business', 'events'].includes(key)))
  const providerSettings = current => current.business.map(({ version, priceCategories, ...rest }) => rest)
  for (const kind of ['messages', 'payments', 'payouts', 'financings', 'pushes']) assert.deepEqual(seeded[kind], [], `${kind} starts empty`)
  const stable = protectedState(seeded), providers = providerSettings(seeded)
  const row = (current, item) => current.services.find(record => record.id === item.id)
  const checked = async (name, args, expectedIds, measure, inspect) => {
    const before = await state()
    const answer = await tool(name, args)
    assert.equal(answer.result.isError, false, `${name}: ${answer.result?.content?.[0]?.text}`)
    assert.deepEqual(answer.decision.classes.map(({ class: risk, facts }) => ({ class: risk, facts })), [{ class: 'standard', facts: { measure } }], `${name} native record count`)
    const after = await state()
    const changed = after.services.filter(record => JSON.stringify(record) !== JSON.stringify(before.services.find(old => old.id === record.id))).map(record => record.id)
    if (JSON.stringify(before.business) !== JSON.stringify(after.business)) changed.push('business')
    assert.deepEqual(changed.sort(), [...expectedIds].sort(), `${name} independently enumerated effects`)
    assert.deepEqual(protectedState(after), stable, `${name} changes no customer decision or provider record`)
    assert.deepEqual(providerSettings(after), providers, `${name} changes no provider configuration`)
    const newEvents = after.events.filter(event => !before.events.some(old => old.id === event.id))
    const eventKind = { 'glove.pricebook.update': 'service.saved', 'glove.pricebook.category': 'pricebook.category', 'glove.pricebook.adjust': 'pricebook.adjusted' }[name]
    assert.deepEqual(newEvents.map(event => event.kind), eventKind ? [eventKind] : [], `${name} emits only its native price-book Activity`)
    await inspect?.(after, answer.result.structuredContent)
  }
  const catalogueIds = seeded.services.map(record => record.id).sort()
  const categoryNames = seeded.business[0].priceCategories.map(record => record.name).sort()
  await checked('glove.pricebook.read', {}, [], catalogueIds.length + categoryNames.length, (after, result) => {
    assert.deepEqual(result.services.map(record => record.id).sort(), catalogueIds)
    assert.deepEqual(result.categories.map(record => record.name).sort(), categoryNames)
    assert.deepEqual(result.services, after.services)
  })
  const write = async (name, args, expectedIds, inspect) => {
    const current = await state()
    const revision = name === 'glove.pricebook.update' ? current.services.find(record => record.id === args.id).version : current.business[0].version
    await checked(name, { ...args, expected_revision: revision, idempotency_key: crypto.randomUUID() }, expectedIds, expectedIds.length, inspect)
  }
  await write('glove.pricebook.update', { id: fixedA.id, code: fixedA.code, name: fixedA.name, category, unitCost: '10.00', unitPrice: '120.00', tax: 'FREE' }, [fixedA.id], current => {
    assert.equal(row(current, fixedA).unitPrice, '120.00')
    assert.equal(row(current, task).unitPrice, '30.00')
  })
  await write('glove.pricebook.update', { id: material.id, code: material.code, name: material.name, kind: 'material', pricing: 'markup', category, unitCost: '12.00', unitPrice: '0.00', tax: 'FREE' }, [material.id, task.id], current => {
    assert.deepEqual([row(current, material).unitPrice, row(current, task).unitCost, row(current, task).unitPrice], ['18.00', '24.00', '36.00'])
  })
  await write('glove.pricebook.category', { name: category, markupPercent: '80' }, ['business', material.id, markup.id, task.id], current => {
    assert.deepEqual([row(current, material).unitPrice, row(current, markup).unitPrice, row(current, task).unitPrice], ['21.60', '36.00', '43.20'])
  })
  await write('glove.pricebook.adjust', { category, percent: '10' }, [fixedA.id, fixedB.id], current => {
    assert.deepEqual([row(current, fixedA).unitPrice, row(current, fixedB).unitPrice], ['132.00', '44.00'])
    assert.deepEqual(row(current, retired), row(seeded, retired))
    assert.deepEqual(row(current, other), row(seeded, other))
    assert.deepEqual([row(current, material).unitPrice, row(current, markup).unitPrice, row(current, task).unitPrice], ['21.60', '36.00', '43.20'])
  })
  return 'Native class facts: catalogue count, one-item update, material and task update, four-record markup and two active fixed-price adjustments; accepted quotes, jobs, plans, agreements, customers, messages and provider records unchanged.'
}
