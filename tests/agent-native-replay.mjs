import assert from 'node:assert/strict'

/** SURFACE-025: public-door retries and refusals leave one native effect. */
export async function pricebookReplay({ request, origin, cookie, tool }) {
  const desk = async (type, payload) => {
    const response = await request(origin + '/api/glove/commands', {
      method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }),
    })
    assert.equal(response.status, 200, `${type} fixture`)
    return (await response.json()).result
  }
  const snapshot = async () => {
    const stateResponse = await request(origin + '/api/glove/state', { headers: { Cookie: cookie } })
    assert.equal(stateResponse.status, 200)
    const state = await stateResponse.json()
    const events = []
    let before = null
    do {
      const activityResponse = await request(origin + '/api/glove/activity' + (before === null ? '' : `?before=${before}`), { headers: { Cookie: cookie } })
      assert.equal(activityResponse.status, 200)
      const page = await activityResponse.json()
      events.push(...page.events)
      assert.ok(page.next === null || before === null || page.next < before, 'Activity cursor advances')
      before = page.next
    } while (before !== null)
    return { version: state.version, services: state.services, business: state.business, events }
  }
  const unchanged = async call => {
    const before = await snapshot()
    const answer = await call()
    assert.deepEqual(await snapshot(), before, 'retry or refusal changes no native state or Activity event')
    return answer
  }
  const succeeded = answer => {
    assert.equal(answer.result.isError, false, answer.result.content?.[0]?.text)
    return answer.result.structuredContent
  }
  const refused = async (name, args, code) => {
    const answer = await unchanged(() => tool(name, args))
    assert.equal(answer.result.isError, true)
    assert.equal(answer.result._meta['com.runeditrun/error'].code, code)
  }
  const replay = async (name, args, first) => {
    const answer = await unchanged(() => tool(name, args))
    assert.deepEqual(succeeded(answer), first, 'same key and arguments return the saved outcome')
  }
  const category = 'Synthetic replay category'
  await desk('pricebook.category', { name: category, markupPercent: '50' })
  // A fixed-price part changes once; its cost reprices the markup task once.
  const partFields = { code: 'SYNTHETIC-REPLAY-PART', name: 'Synthetic replay part', kind: 'material', category, pricing: 'fixed', unitCost: '10.00', unitPrice: '20.00' }
  const part = await desk('service.save', partFields)
  const task = await desk('service.save', { code: 'SYNTHETIC-REPLAY-TASK', name: 'Synthetic replay task', kind: 'task', category, pricing: 'markup', unitPrice: '0.00', components: [{ serviceId: part.id, quantity: '2' }] })
  const marked = await desk('service.save', { code: 'SYNTHETIC-REPLAY-MARKED', name: 'Synthetic replay marked part', kind: 'material', category, pricing: 'markup', unitCost: '4.00', unitPrice: '0.00' })
  const unrelatedFields = { code: 'SYNTHETIC-REPLAY-OTHER', name: 'Synthetic unrelated item', category: 'Synthetic unrelated category', unitCost: '1.00', unitPrice: '3.00' }
  const unrelated = await desk('service.save', unrelatedFields)
  const row = (state, id) => state.services.find(item => item.id === id)
  const businessRevision = state => state.business[0].version
  const eventIds = state => state.events.map(event => event.id)
  const figures = state => [part.id, task.id, marked.id].map(id => {
    const item = row(state, id)
    return [item.unitCost, item.unitPrice]
  })
  assert.deepEqual(figures(await snapshot()), [['10.00', '20.00'], ['20.00', '30.00'], ['4.00', '6.00']])

  const singleEffect = (before, after, changedIds, businessChanged, kind, subjectId) => {
    assert.equal(after.version, before.version + 1, 'exactly one native command commits')
    assert.deepEqual(after.services.map(item => item.id), before.services.map(item => item.id))
    for (const item of after.services) {
      const previous = row(before, item.id)
      if (changedIds.includes(item.id)) assert.equal(item.version, previous.version + 1, `${item.code} advances exactly once`)
      else assert.deepEqual(item, previous, `${item.code} remains unchanged`)
    }
    if (businessChanged) assert.equal(businessRevision(after), businessRevision(before) + 1)
    else assert.deepEqual(after.business, before.business)
    const added = after.events.filter(event => !eventIds(before).includes(event.id))
    assert.equal(added.length, 1, 'exactly one native Activity event')
    const event = added[0]
    assert.equal(event.kind, kind)
    assert.equal(event.subjectId, subjectId)
    assert.equal(event.actorRole, 'agent')
    const sponsor = before.events.find(event => event.subjectId === unrelated.id && event.actorRole === 'owner')
    assert.ok(sponsor, 'fixture has a native Owner attribution')
    assert.equal(event.actorId, sponsor.actorId)
    assert.ok(event.actorName.endsWith(` for ${sponsor.actorName}`) && event.actorName.length > ` for ${sponsor.actorName}`.length)
    const expected = [...changedIds, ...(businessChanged ? ['business'] : [])].sort()
    assert.deepEqual(event.recordChanges.map(change => change.id).sort(), expected)
    for (const change of event.recordChanges) {
      const from = change.id === 'business' ? businessRevision(before) : row(before, change.id).version
      assert.deepEqual([change.fromVersion, change.toVersion], [from, from + 1])
    }
    assert.deepEqual(after.events.filter(event => event.id !== added[0].id), before.events, 'prior Activity is retained')
    return event
  }

  const beforeUpdate = await snapshot()
  const updateArgs = { id: part.id, ...partFields, unitCost: '12.00', unitPrice: '24.00', expected_revision: row(beforeUpdate, part.id).version, idempotency_key: crypto.randomUUID() }
  const update = succeeded(await tool('glove.pricebook.update', updateArgs))
  const afterUpdate = await snapshot()
  const updateEvent = singleEffect(beforeUpdate, afterUpdate, [part.id, task.id], false, 'service.saved', part.id)
  assert.deepEqual(update, row(afterUpdate, part.id))
  assert.deepEqual(figures(afterUpdate), [['12.00', '24.00'], ['24.00', '36.00'], ['4.00', '6.00']])
  // An unrelated person's committed edit must neither invalidate nor repeat the saved effect.
  await desk('service.save', { id: unrelated.id, version: unrelated.version, ...unrelatedFields, unitPrice: '4.00' })
  const between = await snapshot()
  assert.equal(between.version, afterUpdate.version + 1)
  assert.equal(row(between, unrelated.id).unitPrice, '4.00')
  assert.equal(row(between, unrelated.id).version, unrelated.version + 1)
  await replay('glove.pricebook.update', updateArgs, update)
  await refused('glove.pricebook.update', { ...updateArgs, unitCost: '14.00' }, 'idempotency_conflict')
  await refused('glove.pricebook.update', { ...updateArgs, unitCost: '14.00', idempotency_key: crypto.randomUUID() }, 'revision_conflict')

  const beforeFreshUpdate = await snapshot()
  const freshUpdateArgs = { ...updateArgs, unitCost: '14.00', unitPrice: '28.00', expected_revision: row(beforeFreshUpdate, part.id).version, idempotency_key: crypto.randomUUID() }
  const freshUpdate = succeeded(await tool('glove.pricebook.update', freshUpdateArgs))
  const afterFreshUpdate = await snapshot()
  const freshUpdateEvent = singleEffect(beforeFreshUpdate, afterFreshUpdate, [part.id, task.id], false, 'service.saved', part.id)
  assert.notEqual(freshUpdateEvent.commandId, updateEvent.commandId, 'a fresh item key owns a distinct native command')
  assert.deepEqual(freshUpdate, row(afterFreshUpdate, part.id))
  assert.deepEqual(figures(afterFreshUpdate), [['14.00', '28.00'], ['28.00', '42.00'], ['4.00', '6.00']])

  const beforeCategory = await snapshot()
  const categoryArgs = { name: category, markupPercent: '80', expected_revision: businessRevision(beforeCategory), idempotency_key: crypto.randomUUID() }
  const changedCategory = succeeded(await tool('glove.pricebook.category', categoryArgs))
  const afterCategory = await snapshot()
  const categoryEvent = singleEffect(beforeCategory, afterCategory, [task.id, marked.id], true, 'pricebook.category', 'business')
  assert.deepEqual(figures(afterCategory), [['14.00', '28.00'], ['28.00', '50.40'], ['4.00', '7.20']])
  assert.equal(afterCategory.business[0].priceCategories.find(item => item.name === category).markupPercent, '80')
  assert.equal(changedCategory.markupPercent, '80')
  assert.deepEqual(changedCategory.repriced.map(item => item.id).sort(), [task.id, marked.id].sort())
  await replay('glove.pricebook.category', categoryArgs, changedCategory)
  await refused('glove.pricebook.category', { ...categoryArgs, markupPercent: '90' }, 'idempotency_conflict')
  await refused('glove.pricebook.category', { ...categoryArgs, markupPercent: '90', idempotency_key: crypto.randomUUID() }, 'revision_conflict')

  const beforeFreshCategory = await snapshot()
  const freshCategoryArgs = { ...categoryArgs, markupPercent: '90', expected_revision: businessRevision(beforeFreshCategory), idempotency_key: crypto.randomUUID() }
  const freshCategory = succeeded(await tool('glove.pricebook.category', freshCategoryArgs))
  const afterFreshCategory = await snapshot()
  const freshCategoryEvent = singleEffect(beforeFreshCategory, afterFreshCategory, [task.id, marked.id], true, 'pricebook.category', 'business')
  assert.notEqual(freshCategoryEvent.commandId, categoryEvent.commandId, 'a fresh category key owns a distinct native command')
  assert.deepEqual(figures(afterFreshCategory), [['14.00', '28.00'], ['28.00', '53.20'], ['4.00', '7.60']])
  assert.equal(afterFreshCategory.business[0].priceCategories.find(item => item.name === category).markupPercent, '90')
  assert.equal(freshCategory.markupPercent, '90')
  assert.deepEqual(freshCategory.repriced.map(item => item.id).sort(), [task.id, marked.id].sort())
  return 'Price-book replay: item and category retries retain identical outcomes and one attributed native effect; an intervening desk save is retained; argument and revision conflicts leave all native state and Activity unchanged; fresh keys with current revisions apply once.'
}
