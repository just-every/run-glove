import assert from 'node:assert/strict'

/**
 * SURFACE-015: every declared price-book tool makes the change its desk command makes.
 * Twin catalogues are built through the signed-in Owner's desk commands; each
 * change is made once through the desk command (on the DESK twin) and once
 * through its tool (on the TOOL twin), then both are held against literal
 * expectations and against each other. Only public doors are used.
 */
const SIDES = ['desk', 'tool']
const tag = side => side.toUpperCase()
const title = side => side === 'desk' ? 'Desk' : 'Tool'
const code = (side, part) => `TWIN-${tag(side)}-${part}`
const markupCategory = side => `Twin ${title(side)}`
const richCategory = side => `Rich ${title(side)}`
const bookkeeping = ['id', 'code', 'createdAt', 'updatedAt', 'repricedAt']
const errorCode = answer => answer.result?._meta?.['com.runeditrun/error']?.code

export async function pricebookParity({ request, origin, cookie, tool }) {
  const post = { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }
  const desk = async (type, payload) => {
    const response = await request(origin + '/api/glove/commands', { method: 'POST', headers: post, body: JSON.stringify({ commandId: crypto.randomUUID(), type, payload }) })
    return { status: response.status, body: await response.json() }
  }
  const must = async (type, payload) => {
    const answer = await desk(type, payload)
    assert.equal(answer.status, 200, `${type} fixture: ${answer.body.error?.code}`)
    return answer.body.result
  }
  const state = async () => {
    const response = await request(origin + '/api/glove/state', { headers: { Cookie: cookie } })
    assert.equal(response.status, 200)
    return response.json()
  }
  const activity = async () => {
    const response = await request(origin + '/api/glove/activity', { headers: { Cookie: cookie } })
    assert.equal(response.status, 200)
    return (await response.json()).events
  }
  const write = (name, args, revision) => tool(name, { ...args, expected_revision: revision, idempotency_key: crypto.randomUUID() })
  const succeeded = answer => { assert.equal(answer.result.isError, false, `${answer.result?.content?.[0]?.text ?? errorCode(answer)}`); return answer.result.structuredContent }

  // Twin catalogues: identical records, a different category name and code prefix.
  const world = {}
  for (const side of SIDES) {
    const cat = markupCategory(side)
    await must('pricebook.category', { name: cat, markupPercent: '50' })
    const part = await must('service.save', { code: code(side, 'PART'), name: 'Twin part', kind: 'material', category: cat, pricing: 'markup', unitCost: '10.00', unitPrice: '0.00' })
    const task = await must('service.save', { code: code(side, 'TASK'), name: 'Twin task', kind: 'task', category: cat, pricing: 'markup', unitPrice: '0.00', components: [{ serviceId: part.id, quantity: '2' }] })
    const fixedA = await must('service.save', { code: code(side, 'FIXED-A'), name: 'Twin fixed A', category: cat, unitCost: '4.00', unitPrice: '100.00' })
    const fixedB = await must('service.save', { code: code(side, 'FIXED-B'), name: 'Twin fixed B', category: cat, unitCost: '4.00', unitPrice: '33.33' })
    const retired = await must('service.save', { code: code(side, 'RETIRED'), name: 'Twin retired', category: cat, unitCost: '4.00', unitPrice: '50.00', archived: true })
    const richArgs = { code: code(side, 'RICH'), name: 'Twin rich', kind: 'material', unit: 'box', category: richCategory(side), description: 'Keep this description', tax: 'FREE', unitCost: '7.00', unitPrice: '19.00',
      checklist: [{ label: 'Check the seal', required: true }], requiredSkills: ['hvac'], parts: [{ supplier: 'Acme', partNumber: 'A-1' }], archived: true }
    const rich = await must('service.save', richArgs)
    world[side] = { cat, ids: { part: part.id, task: task.id, fixedA: fixedA.id, fixedB: fixedB.id, retired: retired.id, rich: rich.id }, rich, richArgs }
    // The fixtures themselves are held to literal values.
    assert.deepEqual([part.unitPrice, task.unitCost, task.unitPrice, part.version, task.version], ['15.00', '20.00', '30.00', 2, 2], `${side} markup fixtures`)
    assert.deepEqual([fixedA.version, fixedB.version, retired.archived, rich.archived], [1, 1, true, true])
  }

  // Twin ids and tags are written as labels so one door's output can be compared with the other's.
  const normalise = (value, side) => {
    let text = JSON.stringify(value ?? null)
    for (const [name, id] of Object.entries(world[side].ids)) text = text.replaceAll(id, `<${name}>`)
    return JSON.parse(text.replace(/(TWIN-|Twin |Rich )(DESK|TOOL|Desk|Tool)/g, '$1*'))
  }
  const row = (rows, side, name) => rows.find(item => item.id === world[side].ids[name])
  const business = current => current.business[0]
  const sameRow = (left, right) => Object.fromEntries(Object.entries(left).filter(([key]) => !bookkeeping.includes(key)))
  const effect = (events, side, match) => {
    const found = events.filter(match).sort((a, b) => b.sequence - a.sequence)[0]
    assert.ok(found, `${side} Activity effect`)
    return found
  }
  // The one business record is shared by both twins, so its versions are held relative to the version read just before the change.
  const shape = (event, side, businessBefore = 0) => {
    const shaped = normalise({ kind: event.kind, subjectKind: event.subjectKind, subjectId: event.subjectId, summary: event.summary,
      changes: event.recordChanges.map(change => ({ kind: change.kind, id: change.id, fields: [...change.fields].sort(),
        fromVersion: change.id === 'business' ? change.fromVersion - businessBefore : change.fromVersion, toVersion: change.id === 'business' ? change.toVersion - businessBefore : change.toVersion })) }, side)
    return { ...shaped, changes: shaped.changes.sort((a, b) => `${a.kind}${a.id}`.localeCompare(`${b.kind}${b.id}`)) }
  }
  /** Same event, same changed records and versions; only who acted differs. */
  const actors = (deskEvent, toolEvent, person) => {
    assert.equal(deskEvent.actorRole, 'owner')
    assert.equal(deskEvent.actorName, person)
    assert.equal(toolEvent.actorRole, 'agent')
    assert.ok(toolEvent.actorName.endsWith(` for ${person}`) && toolEvent.actorName.length > ` for ${person}`.length, toolEvent.actorName)
    assert.equal(toolEvent.actorId, deskEvent.actorId)
  }
  const stepsOf = (event, side, businessBefore = 0) => Object.fromEntries(event.recordChanges.map(change => [normalise(change.id, side), change.id === 'business' ? [change.fromVersion - businessBefore, change.toVersion - businessBefore] : [change.fromVersion, change.toVersion]]))
  const fieldsOf = (event, id) => event.recordChanges.find(change => change.id === id).fields

  // 1. Reading: the tool returns exactly the catalogue the person's own desk read shows.
  const seen = await state()
  const person = (await activity()).find(event => event.actorRole === 'owner')?.actorName
  assert.ok(person)
  const read = succeeded(await tool('glove.pricebook.read', {}))
  assert.deepEqual(read.services, seen.services)
  assert.deepEqual(read.categories, business(seen).priceCategories.map(({ name, markupPercent }) => ({ name, markupPercent })))
  assert.equal(read.businessRevision, business(seen).version)
  assert.equal(read.version, seen.version)
  assert.deepEqual(read.categories.filter(category => category.name.startsWith('Twin ')).map(category => category.markupPercent), ['50', '50'])

  // 2. Existing-item update (service.save with id and version): fields, versions, repriced dependants and Activity.
  const edit = side => ({ code: code(side, 'PART'), name: 'Twin part renamed', kind: 'material', category: markupCategory(side), pricing: 'markup', unitCost: '12.00', unitPrice: '0.00', description: 'Two-speed motor' })
  const beforeUpdate = await state()
  for (const side of SIDES) assert.equal(row(beforeUpdate.services, side, 'part').version, 2)
  const deskUpdate = await must('service.save', { id: world.desk.ids.part, version: 2, ...edit('desk') })
  const toolUpdate = succeeded(await write('glove.pricebook.update', { id: world.tool.ids.part, ...edit('tool') }, 2))
  const afterUpdate = await state(), updateEvents = await activity()
  for (const side of SIDES) {
    const item = row(afterUpdate.services, side, 'part'), dependant = row(afterUpdate.services, side, 'task')
    assert.deepEqual([item.name, item.unitCost, item.unitPrice, item.description, item.category, item.version], ['Twin part renamed', '12.00', '18.00', 'Two-speed motor', markupCategory(side), 4], `${side} updated item`)
    assert.deepEqual([dependant.unitCost, dependant.unitPrice, dependant.version], ['24.00', '36.00', 3], `${side} task dependant`)
    assert.deepEqual(row(afterUpdate.services, side, 'fixedA'), row(beforeUpdate.services, side, 'fixedA'))
  }
  assert.deepEqual(normalise(sameRow(row(afterUpdate.services, 'desk', 'part')), 'desk'), normalise(sameRow(row(afterUpdate.services, 'tool', 'part')), 'tool'))
  assert.deepEqual(normalise(sameRow(row(afterUpdate.services, 'desk', 'task')), 'desk'), normalise(sameRow(row(afterUpdate.services, 'tool', 'task')), 'tool'))
  assert.deepEqual(normalise(sameRow(deskUpdate), 'desk'), normalise(sameRow(toolUpdate), 'tool'))
  const deskSaved = effect(updateEvents, 'desk', event => event.kind === 'service.saved' && event.subjectId === world.desk.ids.part)
  const toolSaved = effect(updateEvents, 'tool', event => event.kind === 'service.saved' && event.subjectId === world.tool.ids.part)
  assert.equal(deskSaved.summary, 'Price book: TWIN-DESK-PART Twin part renamed at $18.00 before tax (cost $12.00)')
  assert.equal(toolSaved.summary, 'Price book: TWIN-TOOL-PART Twin part renamed at $18.00 before tax (cost $12.00)')
  assert.deepEqual(shape(deskSaved, 'desk'), shape(toolSaved, 'tool'))
  assert.deepEqual(stepsOf(deskSaved, 'desk'), { '<part>': [2, 4], '<task>': [2, 3] })
  assert.deepEqual(stepsOf(toolSaved, 'tool'), { '<part>': [2, 4], '<task>': [2, 3] })
  for (const field of ['name', 'unitCost', 'unitPrice', 'description', 'version']) assert.ok(fieldsOf(deskSaved, world.desk.ids.part).includes(field), field)
  actors(deskSaved, toolSaved, person)

  // 3. Category markup: the business record and every markup-priced dependant, including the task.
  const categoryRevision = async () => business(await state()).version
  const deskBase = await categoryRevision()
  const deskCategory = await must('pricebook.category', { name: world.desk.cat, markupPercent: '80' })
  const toolBase = await categoryRevision()
  assert.equal(toolBase, deskBase + 1)
  const toolCategory = succeeded(await write('glove.pricebook.category', { name: world.tool.cat, markupPercent: '80' }, toolBase))
  const afterCategory = await state(), categoryEvents = await activity()
  assert.equal(business(afterCategory).version, toolBase + 1)
  for (const side of SIDES) {
    const item = row(afterCategory.services, side, 'part'), dependant = row(afterCategory.services, side, 'task')
    assert.deepEqual([item.unitPrice, item.version, dependant.unitCost, dependant.unitPrice, dependant.version], ['21.60', 5, '24.00', '43.20', 4], `${side} repriced dependants`)
    assert.deepEqual(row(afterCategory.services, side, 'fixedA'), row(beforeUpdate.services, side, 'fixedA'), `${side} fixed price is not a markup dependant`)
    assert.equal(business(afterCategory).priceCategories.find(category => category.name === world[side].cat).markupPercent, '80')
  }
  const categoryResult = (result, side) => normalise({ name: result.name, markupPercent: result.markupPercent, repriced: result.repriced }, side)
  assert.deepEqual(categoryResult(deskCategory, 'desk'), categoryResult(toolCategory, 'tool'))
  assert.deepEqual(deskCategory.repriced.map(item => [item.code, item.unitPrice]), [['TWIN-DESK-PART', '21.60'], ['TWIN-DESK-TASK', '43.20']])
  const deskMarked = effect(categoryEvents, 'desk', event => event.kind === 'pricebook.category' && event.summary.includes(world.desk.cat))
  const toolMarked = effect(categoryEvents, 'tool', event => event.kind === 'pricebook.category' && event.summary.includes(world.tool.cat))
  assert.equal(deskMarked.summary, 'Price book: Twin Desk marked up 80% on cost (2 items repriced)')
  assert.equal(toolMarked.summary, 'Price book: Twin Tool marked up 80% on cost (2 items repriced)')
  assert.deepEqual(shape(deskMarked, 'desk', deskBase), shape(toolMarked, 'tool', toolBase))
  assert.deepEqual(stepsOf(deskMarked, 'desk', deskBase), { business: [0, 1], '<part>': [4, 5], '<task>': [3, 4] })
  assert.deepEqual(stepsOf(toolMarked, 'tool', toolBase), { business: [0, 1], '<part>': [4, 5], '<task>': [3, 4] })
  assert.deepEqual(fieldsOf(deskMarked, 'business').sort(), ['priceCategories', 'version'])
  actors(deskMarked, toolMarked, person)

  // 4. Category price adjustment: fixed-price items change, markup-priced, archived and other-category items do not.
  const adjustBase = await categoryRevision()
  const deskAdjust = await must('pricebook.adjust', { category: world.desk.cat, percent: '10' })
  const toolAdjust = succeeded(await write('glove.pricebook.adjust', { category: world.tool.cat, percent: '10' }, await categoryRevision()))
  const afterAdjust = await state(), adjustEvents = await activity()
  assert.equal(business(afterAdjust).version, adjustBase, 'an adjustment leaves the business record at its version')
  for (const side of SIDES) {
    assert.deepEqual([row(afterAdjust.services, side, 'fixedA'), row(afterAdjust.services, side, 'fixedB')].map(item => [item.unitPrice, item.version]), [['110.00', 2], ['36.66', 2]], `${side} fixed prices`)
    assert.deepEqual(row(afterAdjust.services, side, 'part'), row(afterCategory.services, side, 'part'))
    assert.deepEqual(row(afterAdjust.services, side, 'task'), row(afterCategory.services, side, 'task'))
  }
  const adjustResult = (result, side) => normalise({ category: result.category, percent: result.percent, items: result.items }, side)
  assert.deepEqual(adjustResult(deskAdjust, 'desk'), adjustResult(toolAdjust, 'tool'))
  assert.deepEqual(deskAdjust.items.map(item => [item.code, item.unitPrice]), [['TWIN-DESK-FIXED-A', '110.00'], ['TWIN-DESK-FIXED-B', '36.66']])
  const deskAdjusted = effect(adjustEvents, 'desk', event => event.kind === 'pricebook.adjusted' && event.summary.includes(world.desk.cat))
  const toolAdjusted = effect(adjustEvents, 'tool', event => event.kind === 'pricebook.adjusted' && event.summary.includes(world.tool.cat))
  assert.equal(deskAdjusted.summary, 'Price book: Twin Desk prices raised 10% (2 items)')
  assert.equal(toolAdjusted.summary, 'Price book: Twin Tool prices raised 10% (2 items)')
  assert.deepEqual(shape(deskAdjusted, 'desk', adjustBase), shape(toolAdjusted, 'tool', adjustBase))
  assert.deepEqual(stepsOf(deskAdjusted, 'desk'), { '<fixedA>': [1, 2], '<fixedB>': [1, 2] })
  assert.deepEqual(fieldsOf(deskAdjusted, world.desk.ids.fixedA).sort(), ['unitPrice', 'updatedAt', 'updatedBy', 'version'])
  actors(deskAdjusted, toolAdjusted, person)

  // 5. Refusals through either door change no record and add no Activity.
  const snapshot = async () => { const now = await state(); return { version: now.version, services: now.services, business: now.business, events: (await activity()).map(event => event.id) } }
  const unchanged = async refusal => { const before = await snapshot(); await refusal(); assert.deepEqual(await snapshot(), before) }
  const now = await state(), other = side => side === 'desk' ? 'tool' : 'desk'
  const fixedA = side => row(now.services, side, 'fixedA'), part = side => row(now.services, side, 'part')
  await unchanged(async () => {
    const stale = await desk('service.save', { id: world.desk.ids.part, version: part('desk').version - 1, ...edit('desk') })
    assert.deepEqual([stale.status, stale.body.error.code], [409, 'STALE'])
  })
  await unchanged(async () => {
    const duplicate = await desk('service.save', { id: world.desk.ids.fixedA, version: fixedA('desk').version, code: code('tool', 'PART'), name: 'Twin fixed A', unitPrice: '110.00' })
    assert.deepEqual([duplicate.status, duplicate.body.error.code], [409, 'DUPLICATE'])
  })
  await unchanged(async () => {
    const stale = await write('glove.pricebook.update', { id: world.tool.ids.part, ...edit('tool') }, part('tool').version - 1)
    assert.equal(errorCode(stale), 'revision_conflict')
  })
  await unchanged(async () => {
    const duplicate = await write('glove.pricebook.update', { id: world.tool.ids.fixedA, code: code('desk', 'PART'), name: 'Twin fixed A', unitPrice: '110.00' }, fixedA('tool').version)
    assert.equal(duplicate.result.isError, true)
    assert.equal(errorCode(duplicate), 'duplicate')
  })
  for (const [name, args] of [['glove.pricebook.category', { name: world.tool.cat, markupPercent: '90' }], ['glove.pricebook.adjust', { category: world.tool.cat, percent: '5' }]]) {
    await unchanged(async () => assert.equal(errorCode(await write(name, args, business(now).version - 1)), 'revision_conflict'))
  }

  // 6. Omitted fields: an update naming only the required id, code, name and unitPrice, through both doors.
  const lean = side => ({ code: code(side, 'RICH'), name: 'Twin rich renamed', unitPrice: '19.00' })
  const deskLean = await must('service.save', { id: world.desk.ids.rich, version: world.desk.rich.version, ...lean('desk') })
  const toolLean = succeeded(await write('glove.pricebook.update', { id: world.tool.ids.rich, ...lean('tool') }, world.tool.rich.version))
  assert.deepEqual(normalise(sameRow(deskLean), 'desk'), normalise(sameRow(toolLean), 'tool'))
  const reset = (result, side) => Object.keys(result).filter(key => !bookkeeping.includes(key) && !['version', 'name', 'updatedBy'].includes(key) && JSON.stringify(result[key]) !== JSON.stringify(world[side].rich[key])).sort()
  assert.deepEqual(reset(deskLean, 'desk'), reset(toolLean, 'tool'))
  return `Price-book parity: reads, update, category markup and price adjustment match their desk commands with identical Activity; stale and duplicate refusals change nothing; an update naming only id, code, name and unitPrice resets ${reset(deskLean, 'desk').join(', ')} through both doors alike.`
}
