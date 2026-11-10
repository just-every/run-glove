import { scenario } from '../fixtures/scenario.mjs'
// STOCK-002 purchase orders to suppliers through the command, state, cost and
// history doors: the office raises an order for a job, records it as sent
// through the supplier's portal, receives it in two parts into the warehouse,
// and the stock counts and the job's actual cost follow, to the cent.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, acceptedQuote, id } from './harness.mjs'
import { connectMail, receipt, textOf } from '../fixtures/mail-providers.mjs'
import { postEvents } from './harness.mjs'

test('DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost', async t => {
  await scenario(t, 'DATA-002, DATA-009, DATA-010 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost', async (t) => {
  const h = await installation({ at: '2026-10-21T00:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const providerAttempts = h.outbound.attempts
  const clock = at => h.setTime(at)
  const cap = await h.command('service.save', { code: 'CAP-455', name: 'Run capacitor 45/5', kind: 'material', unit: 'each', unitCost: '12.00', unitPrice: '38.00', tax: 'GST' })
  const filter = await h.command('service.save', { code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '18.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })

  // Only the owner and office purchase; only materials are ordered; the line's cost defaults to the price book's.
  const order = { supplier: 'Supply Co', supplierEmail: ['orders', 'supplyco.example'].join('@'), locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: cap.id, quantity: '4', unitCost: '11.50' }, { serviceId: filter.id, quantity: '10' }] }
  await b.dispatcher.run('po.save', order, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('po.save', order, { error: 'FORBIDDEN' })
  await b.office.run('po.save', { ...order, lines: [{ serviceId: b.service.id, quantity: '1' }] }, { error: 'INPUT' })
  let po = await b.office.run('po.save', { ...order, lines: [{ serviceId: cap.id, quantity: '3', unitCost: '11.50' }] })
  po = await b.office.run('po.save', { ...order, id: po.id, version: po.version })
  assert.deepEqual([po.number, po.status, po.lines.map(l => [l.code, l.quantity, l.unitCost, l.total]), po.total], ['PO-0001', 'draft', [['CAP-455', '4', '11.50', '46.00'], ['FLT-1620', '10', '6.00', '60.00']], '106.00'])

  // Glove sends nothing: the office records it went through the supplier's portal, and receiving waits for that.
  await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'PO_STATE' })
  await clock('2026-10-21T01:00:00.000Z')
  const sentCommand = id()
  po = await b.office.run('po.send', { poId: po.id, version: po.version, method: 'portal', reference: 'SC-88812' }, { commandId: sentCommand })
  assert.deepEqual([po.status, po.sent], ['sent', { method: 'portal', reference: 'SC-88812', by: { id: b.office.id, name: 'Olu Office' }, at: '2026-10-21T01:00:00.000Z' }])
  await b.office.run('po.save', { ...order, id: po.id, version: po.version }, { error: 'PO_STATE' })
  const timeline = async () => (await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()).events.map(e => e.summary)
  assert.ok((await timeline()).some(s => s.includes('recorded PO-0001 as sent to Supply Co by portal (supplier reference SC-88812); Glove sent nothing itself')))

  const cost = async (as = h.owner()) => {
    const response = await h.request(`/api/glove/jobs/${job.id}/cost`, { as })
    assert.equal(response.status, 200)
    return (await response.json()).costing
  }
  const domain = async () => {
    const state = await h.state()
    return { orders: state.purchaseOrders, stock: state.stock, moves: state.stockMoves, jobs: state.jobs, captures: state.captures, events: state.events, cost: await cost() }
  }
  const refuse = async (person, payload, error, commandId) => {
    const before = await domain()
    await person.run('po.receive', payload, { error, ...(commandId ? { commandId } : {}) })
    assert.deepEqual(await domain(), before, `${error} leaves orders, stock, movements, job evidence, cost and Activity unchanged`)
  }
  const receipt = (lineQuantities, at, note) => ({ at, by: { id: b.office.id, name: 'Olu Office' }, note, lines: lineQuantities })
  const receiptMoves = state => state.stockMoves.filter(m => m.kind === 'receive').map(m => [m.locationId, m.serviceId, m.delta, m.after, m.poId, m.jobId, m.receiptId, m.by, m.createdAt])
  const byItem = rows => rows.map(r => JSON.stringify(r)).sort()

  // The first part has its own independently expected stock and cost before interruption.
  const [capLine, filterLine] = po.lines
  const firstPayload = { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '2' }], note: 'First delivery' }
  const firstCommand = id()
  await clock('2026-10-21T02:00:00.000Z')
  po = await b.office.run('po.receive', firstPayload, { commandId: firstCommand })
  assert.deepEqual([po.status, po.lines.map(l => l.received)], ['partly received', ['2', '0']])
  assert.equal(po.receipts.length, 1)
  const firstReceipt = po.receipts[0]
  assert.ok(firstReceipt.id)
  assert.deepEqual(firstReceipt, { id: firstReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }], '2026-10-21T02:00:00.000Z', 'First delivery') })
  const firstState = await h.state()
  assert.deepEqual(firstState.purchaseOrders.find(p => p.id === po.id), po)
  assert.deepEqual(firstState.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 2000 })
  assert.deepEqual(receiptMoves(firstState), [[warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z']])
  let c = await cost()
  assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['23.00', '0.00', '23.00'])
  assert.deepEqual(c.actual.purchaseEntries.map(l => [l.poId, l.number, l.serviceId, l.received, l.unitCost, l.cost]), [[po.id, 'PO-0001', cap.id, '2', '11.50', '23.00']])
  const firstDomain = await domain()

  // Dispose the real Worker and reopen its surviving D1, rather than seeding a receipt.
  await h.restart()
  assert.deepEqual(await domain(), firstDomain, 'the partly received order, exact stock, cost, receipt and movement survive restart')
  assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), po)
  assert.deepEqual(await domain(), firstDomain, 'first-receipt replay after restart creates no stock, cost, movement or event')
  await refuse(b.office, firstPayload, 'STALE')
  // A valid first line followed by an excess second line must not partly commit.
  await refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '1' }, { lineId: filterLine.id, quantity: '11' }] }, 'OVER')
  await refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '3' }] }, 'OVER')
  const remainder = { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '2' }, { lineId: filterLine.id, quantity: '10' }], note: 'Back order arrived' }
  for (const person of [b.dispatcher, b.priyaPerson, b.agent]) await refuse(person, remainder, 'FORBIDDEN')
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await refuse(b.office, remainder, 'FORBIDDEN')
  await refuse(b.office, firstPayload, 'FORBIDDEN', firstCommand)
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })

  await clock('2026-10-21T03:00:00.000Z')
  const secondCommand = id()
  po = await b.office.run('po.receive', remainder, { commandId: secondCommand })
  assert.deepEqual([po.status, po.lines.map(l => l.received), po.receipts.length], ['received', ['4', '10'], 2])
  const secondReceipt = po.receipts[1]
  assert.ok(secondReceipt.id && secondReceipt.id !== firstReceipt.id)
  assert.deepEqual(po.receipts, [firstReceipt, { id: secondReceipt.id, ...receipt([{ lineId: capLine.id, quantity: '2' }, { lineId: filterLine.id, quantity: '10' }], '2026-10-21T03:00:00.000Z', 'Back order arrived') }])
  const s = await h.state()
  assert.deepEqual(s.purchaseOrders.find(p => p.id === po.id), po)
  assert.deepEqual(s.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 4000, [filter.id]: 10000 })
  assert.deepEqual(byItem(receiptMoves(s)), byItem([
    [warehouse.id, cap.id, '2', '2', po.id, job.id, firstReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T02:00:00.000Z'],
    [warehouse.id, cap.id, '2', '4', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
    [warehouse.id, filter.id, '10', '10', po.id, job.id, secondReceipt.id, { id: b.office.id, name: 'Olu Office' }, '2026-10-21T03:00:00.000Z'],
  ]))
  c = await cost()
  assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['106.00', '0.00', '106.00'])
  assert.deepEqual(c.actual.purchaseEntries.map(l => [l.number, l.description, l.received, l.cost]), [['PO-0001', 'Run capacitor 45/5', '4', '46.00'], ['PO-0001', 'Filter 16x20', '10', '60.00']])
  const finalDomain = await domain()
  await h.restart()
  assert.deepEqual(await domain(), finalDomain, 'both receipt identities and the exact final effects survive another Worker restart')
  assert.deepEqual(await b.office.run('po.receive', firstPayload, { commandId: firstCommand }), firstState.purchaseOrders.find(p => p.id === po.id), 'first replay returns its historical partly received outcome')
  assert.deepEqual(await b.office.run('po.receive', remainder, { commandId: secondCommand }), po)
  assert.deepEqual(await domain(), finalDomain, 'replaying both receipts cannot add any stock, cost, movement or Activity')
  await refuse(b.office, remainder, 'STALE')
  await refuse(b.office, { poId: po.id, version: po.version, lines: [{ lineId: filterLine.id, quantity: '1' }] }, 'PO_STATE')

  // Job cost still counts a recorded material only beyond the quantity already received.
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:00:00Z' })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:10:00Z', kind: 'material', serviceId: cap.id, quantity: '5' })
  c = await cost(b.office.cookie)
  assert.deepEqual([c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.cost]), c.actual.materials, c.actual.cost], [[['5', '4', '12.00']], '12.00', '118.00'])

  // The order shows on the property's history; technicians never read purchase orders or their costs.
  const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie })).json()
  assert.ok(history.entries.some(e => e.kind === 'purchase order' && e.label === `PO-0001 to Supply Co for ${job.number}` && e.status === 'received'))
  assert.deepEqual((await b.priyaPerson.state()).purchaseOrders, [])
  const { activity, exported } = await assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received'])
  assert.deepEqual(exported.purchaseOrders.find(p => p.id === po.id), po)
  assert.deepEqual(receiptMoves(exported), receiptMoves(s), 'business download retains the receipt-linked stock movements')
  assert.deepEqual(activity.filter(e => e.kind === 'po.received').map(e => e.commandId).sort(), [firstCommand, secondCommand].sort())
  for (const [commandId, kind, at] of [
    [sentCommand, 'po.sent', '2026-10-21T01:00:00.000Z'],
    [firstCommand, 'po.received', '2026-10-21T02:00:00.000Z'],
    [secondCommand, 'po.received', '2026-10-21T03:00:00.000Z'],
  ]) {
    const events = activity.filter(e => e.commandId === commandId && e.subjectKind === 'purchaseOrder')
    assert.equal(events.length, 1)
    const event = events[0]
    assert.deepEqual([event.kind, event.subjectId, event.jobId, event.actorId, event.actorName, event.actorRole, event.at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', at])
    const kept = exported.timeline.filter(e => e.id === event.id)
    assert.equal(kept.length, 1)
    assert.deepEqual([kept[0].kind, kept[0].subject_id, kept[0].job_id, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].command_id, kept[0].at], [kind, po.id, job.id, b.office.id, 'Olu Office', 'office', commandId, at])
  }
  assert.equal(h.outbound.attempts - providerAttempts, 0, 'outside-send recording, receiving, refusal, restart and replay make zero outbound provider attempts')
  await purchasingRemainder(h, b, { cap, filter, warehouse, job, visit, cost, original: po })
})
  await scenario(t, 'STOCK-002 / TEAM-001 purchase commands acknowledge writes without granting margin reads, including old outcomes after role edits', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const material = await h.command('service.save', { code: 'PRIVATE-COST', name: 'Compressor', kind: 'material', unitCost: '137.29', unitPrice: '350.00' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Warehouse' })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const permissions = ['po.save', 'po.send', 'po.receive', 'expense.price', 'export.read']
  let role = await h.command('role.save', { name: 'Receiving', permissions })
  const receiver = await h.person('Rae Receiving', `custom:${role.id}`)
  const commands = []
  const write = async (type, payload) => {
    const commandId = id()
    const result = await receiver.run(type, payload, { commandId })
    assert.deepEqual(Object.keys(result).sort(), ['id', 'version'], 'only the record identity and committed version acknowledge the write')
    commands.push({ type, payload, commandId, result })
    assert.deepEqual(await receiver.run(type, payload, { commandId }), result, 'replay has the same restricted acknowledgement')
    return (await h.state()).purchaseOrders.find(p => p.id === result.id)
  }
  let po = await write('po.save', { supplier: 'Supply Co', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '2' }] })
  po = await write('po.save', { id: po.id, version: po.version, supplier: 'Supply Co revised', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '2' }] })
  po = await write('po.send', { poId: po.id, version: po.version, method: 'portal', reference: 'SC-100' })
  po = await write('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] })
  po = await write('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] })
  for (const command of commands.slice(1)) {
    const stale = await receiver.run(command.type, command.payload, { error: 'STALE' })
    assert.deepEqual(stale.details.record, { id: po.id, version: po.version }, 'stale responses disclose no hidden purchase-order record')
  }
  assert.equal(po.status, 'received')
  assert.equal(po.total, '274.58')
  assert.deepEqual((await receiver.state()).purchaseOrders, [])
  assert.ok(!(await receiver.state()).events.some(e => e.subjectKind === 'purchaseOrder'))
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: receiver.cookie })).status, 403)
  assert.equal((await h.state()).stock.find(l => l.id === warehouse.id).counts[material.id], 2000)
  const cost = await (await h.request(`/api/glove/jobs/${job.id}/cost`)).json()
  assert.equal(cost.costing.actual.purchases, '274.58', 'redaction changes no stock or job-cost effect')

  const viewer = await h.person('Viv Viewer', 'viewer')
  const subcontractor = await h.person('Sid Subcontractor', 'subcontractor')
  const sid = await h.command('technician.save', { name: 'Sid S.', operatorId: subcontractor.id, subcontractor: { payeeName: 'Sid Synthetic', tinLast4: '1234', perVisit: '50.00' } })
  await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '09:00', end: '10:00' })
  await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: sid.id, date: '2026-10-21', start: '11:00', end: '12:00' })
  const inspect = async (person, margins, exportAllowed) => {
    const before = await h.state()
    const state = await person.state()
    assert.deepEqual(state.purchaseOrders, margins ? [po] : [], `${person.name} state follows current report access`)
    const activity = await (await h.request('/api/glove/activity', { as: person.cookie })).json()
    assert.equal(activity.events.some(e => e.kind === 'service.saved' && e.summary.includes('137.29')), margins, 'historical catalogue costs follow report access as purchase orders do')
    const events = activity.events.filter(e => e.subjectKind === 'purchaseOrder')
    assert.equal(events.length, margins ? 5 : 0, `${person.name} Activity follows margin access`)
    const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: person.cookie })).json()
    assert.equal(timeline.events.filter(e => e.subjectKind === 'purchaseOrder').length, margins ? 5 : 0)
    const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: person.cookie })).json()
    assert.deepEqual(history.entries.filter(e => e.kind === 'purchase order').map(e => e.id), margins ? [po.id] : [])
    const response = await h.request(`/api/glove/jobs/${job.id}/cost`, { as: person.cookie })
    assert.equal(response.status, margins ? 200 : 403)
    if (margins) assert.equal((await response.json()).costing.actual.purchases, '274.58')
    const download = await h.request('/api/glove/export', { as: person.cookie })
    assert.equal(download.status, exportAllowed ? 200 : 403)
    if (exportAllowed) {
      const exported = await download.json()
      assert.deepEqual(exported.purchaseOrders, margins ? [po] : [])
      assert.equal(exported.timeline.filter(e => e.subject_kind === 'purchaseOrder').length, margins ? 5 : 0)
      if (!margins) assert.ok(!JSON.stringify(exported).includes('137.29'), 'export permission alone exposes no supplier costs')
    }
    if (!margins) assert.ok(!JSON.stringify({ state, activity, timeline, history }).includes('137.29'), 'no supplier cost in any permitted projection')
    assert.deepEqual(await h.state(), before, 'inspection changes no domain record or Activity')
  }
  for (const person of [b.office, b.dispatcher, b.agent, viewer]) await inspect(person, true, person === b.office)
  for (const person of [receiver, b.priyaPerson, subcontractor]) await inspect(person, false, person === receiver)
  for (const person of [b.dispatcher, b.priyaPerson, b.tomPerson, b.agent, viewer, subcontractor]) {
    for (const type of ['po.save', 'po.send', 'po.receive']) {
      const before = await h.state(), attempts = h.outbound.attempts
      await person.run(type, type === 'po.save' ? commands[0].payload : { poId: po.id, version: po.version, method: 'portal', lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'FORBIDDEN' })
      assert.deepEqual(await h.state(), before)
      assert.equal(h.outbound.attempts, attempts)
    }
  }
  for (const path of ['/api/glove/state', '/api/glove/activity', `/api/glove/jobs/${job.id}/cost`, `/api/glove/jobs/${job.id}/timeline`, `/api/glove/sites/${b.site.id}/history`, '/api/glove/export']) {
    assert.equal((await h.request(path, { as: '' })).status, 401)
  }

  // Expense costs already have the same report-read restriction in state.
  const expense = await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City', amount: '42.00', billable: true })
  const expenseCommandId = id(), expensePayload = { expenseId: expense.id, version: expense.version, billable: true, markupPercent: '20' }
  const priced = await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId })
  assert.deepEqual(priced, { id: expense.id, version: 2 })
  assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
  const staleExpense = await receiver.run('expense.price', expensePayload, { error: 'STALE' })
  assert.deepEqual(staleExpense.details.record, priced)

  // Replaying a durable full record follows current permission in both directions.
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: [...permissions, 'reports.read'] })
  await inspect(receiver, true, true)
  for (const command of commands) {
    const replay = await receiver.run(command.type, command.payload, { commandId: command.commandId })
    assert.equal(replay.lines[0].unitCost, '137.29')
    assert.equal(replay.total, '274.58')
    assert.equal(replay.version, command.result.version, 'the historical outcome is retained')
  }
  assert.equal((await receiver.state()).purchaseOrders[0].total, '274.58')
  assert.equal((await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId })).amount, '42.00')
  const commandId = id(), payload = { ...commands[0].payload, supplier: 'Full access order' }
  const full = await receiver.run('po.save', payload, { commandId })
  assert.equal(full.lines[0].unitCost, '137.29')
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions })
  assert.deepEqual(await receiver.run('po.save', payload, { commandId }), { id: full.id, version: full.version }, 'a previously full outcome loses margin access immediately')
  assert.deepEqual(await receiver.run('expense.price', expensePayload, { commandId: expenseCommandId }), priced)
  await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: [] })
  await receiver.run('po.save', payload, { commandId, error: 'FORBIDDEN' })
  assert.equal((await h.request('/api/glove/export', { as: receiver.cookie })).status, 403, 'revoking export authority applies to the next request')
})
})

// Continue the same purchasing journey through fractional receiving, separate
// orders, stock-only delivery and the explicitly connected mail boundary.
async function purchasingRemainder(h, b, { cap, filter, warehouse, job, visit, cost, original }) {
  const van = await h.command('stock.location', { kind: 'van', technicianId: b.priya.id, name: 'Priya van' })
  const order = { supplier: 'Synthetic supplier', locationId: van.id, jobId: job.id, lines: [{ serviceId: cap.id, quantity: '1.125', unitCost: '9.99' }] }
  const snapshot = async () => {
    const s = await h.state()
    return { orders: s.purchaseOrders, stock: s.stock, moves: s.stockMoves, jobs: s.jobs, captures: s.captures, messages: s.messages, messageStates: s.messageStates, events: s.events, cost: await cost() }
  }
  const unchanged = async (person, type, payload, error) => {
    const before = await snapshot(), attempts = h.outbound.attempts
    await person.run(type, payload, { error })
    assert.deepEqual(await snapshot(), before, `${type} ${error} has no purchasing or financial effect`)
    assert.equal(h.outbound.attempts, attempts)
  }
  for (const fields of [
    { supplier: '' }, { lines: [] }, { lines: Array.from({ length: 51 }, () => order.lines[0]) },
  ]) await unchanged(b.office, 'po.save', { ...order, ...fields }, 'INPUT')
  for (const quantity of ['0', '1.0001']) await unchanged(b.office, 'po.save', { ...order, lines: [{ serviceId: cap.id, quantity }] }, 'QUANTITY')
  await unchanged(b.office, 'po.save', { ...order, lines: [{ serviceId: cap.id, quantity: '1', unitCost: '-0.01' }] }, 'MONEY')

  let fractional = await h.command('po.save', order)
  assert.deepEqual([fractional.number, fractional.supplier, fractional.supplierEmail, fractional.locationId, fractional.jobId, fractional.lines.map(l => [l.quantity, l.unitCost, l.total]), fractional.total],
    ['PO-0002', 'Synthetic supplier', '', van.id, job.id, [['1.125', '9.99', '11.24']], '11.24'])
  assert.equal((await cost()).actual.cost, '118.00', 'a draft adds no job cost')
  const draft = fractional
  fractional = await h.command('po.save', { ...order, id: fractional.id, version: fractional.version, note: 'Owner reviewed supplier cost' })
  await unchanged(b.office, 'po.save', { ...order, id: fractional.id, version: draft.version }, 'STALE')
  fractional = await h.command('po.send', { poId: fractional.id, version: fractional.version, method: 'phone', reference: 'synthetic-glove-2' })
  assert.equal((await cost()).actual.cost, '118.00', 'recording a send adds no job cost')
  await unchanged(b.office, 'po.save', { ...order, id: fractional.id, version: fractional.version }, 'PO_STATE')
  await unchanged(b.office, 'po.send', { poId: fractional.id, version: fractional.version, method: 'phone' }, 'PO_STATE')
  await unchanged(b.office, 'po.receive', { poId: fractional.id, version: fractional.version, lines: [{ lineId: 'synthetic-glove-unknown', quantity: '1' }] }, 'NOT_FOUND')
  await unchanged(b.office, 'po.receive', { poId: fractional.id, version: fractional.version, lines: [{ lineId: fractional.lines[0].id, quantity: '0.126' }, { lineId: fractional.lines[0].id, quantity: '1' }] }, 'OVER')
  const lineId = fractional.lines[0].id
  fractional = await b.office.run('po.receive', { poId: fractional.id, version: fractional.version, lines: [{ lineId, quantity: '0.125' }] })
  let c = await cost()
  assert.deepEqual([fractional.status, fractional.lines[0].received, (await h.state()).stock.find(l => l.id === van.id).counts, c.actual.purchases, c.actual.materials, c.actual.cost],
    ['partly received', '0.125', { [cap.id]: 125 }, '107.25', '10.50', '117.75'])
  fractional = await h.command('po.receive', { poId: fractional.id, version: fractional.version, lines: [{ lineId, quantity: '0.4' }, { lineId, quantity: '0.6' }] })
  assert.deepEqual([fractional.status, fractional.lines[0].received, fractional.receipts[1].lines, fractional.receipts[1].by],
    ['received', '1.125', [{ lineId, quantity: '1' }], { id: (await h.state()).actor.id, name: 'Olivia Owner' }])
  c = await cost()
  assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['117.24', '0.00', '117.24'], 'received quantity across two orders covers captures once')

  await h.command('service.save', { ...cap, unitCost: '15.00' })
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-21T04:00:00.000Z' } })).status, 200)
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-21T00:15:00Z', kind: 'material', serviceId: cap.id, quantity: '1' })
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-21T04:01:00.000Z' } })).status, 200)
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-21T00:16:00Z', kind: 'material', serviceId: filter.id, quantity: '12' })
  c = await cost()
  assert.deepEqual(c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.unitCost, m.cost]),
    [['5', '5', '15.00', '0.00'], ['1', '0.125', '15.00', '13.13'], ['12', '10', '6.00', '12.00']])
  assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['117.24', '25.13', '142.37'], 'only excess material uses the current catalogue cost, rounded half up')

  // Fifty lines are valid business input, including a minimum quantity; a
  // stock-only order and another job never inflate this job's cost or history.
  let bulk = await b.office.run('po.save', { supplier: 'Stock supplier', locationId: warehouse.id, lines: Array.from({ length: 50 }, () => ({ serviceId: filter.id, quantity: '0.001' })) })
  assert.deepEqual([bulk.number, bulk.jobId, bulk.lines.length, bulk.lines.every(l => l.quantity === '0.001' && l.unitCost === '6.00' && l.total === '0.01'), bulk.total], ['PO-0003', null, 50, true, '0.50'])
  const beforeBulk = await cost()
  bulk = await b.office.run('po.send', { poId: bulk.id, version: bulk.version, method: 'in person', reference: 'synthetic-glove-3' })
  bulk = await b.office.run('po.receive', { poId: bulk.id, version: bulk.version, lines: bulk.lines.map(l => ({ lineId: l.id, quantity: '0.001' })) })
  assert.equal(bulk.status, 'received')
  assert.equal((await h.state()).stock.find(l => l.id === warehouse.id).counts[filter.id], 10050)
  assert.deepEqual(await cost(), beforeBulk)
  const anotherCustomer = await h.command('customer.save', { name: 'Separate property customer' })
  const anotherSite = await h.command('site.save', { customerId: anotherCustomer.id, address: '22 Synthetic Street' })
  const anotherJob = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, { ...b, customer: anotherCustomer, site: anotherSite }, 'Separate purchase job')).id })
  let separate = await h.command('po.save', { ...order, jobId: anotherJob.id, lines: [{ serviceId: cap.id, quantity: '1', unitCost: '99.00' }] })
  separate = await h.command('po.send', { poId: separate.id, version: separate.version, method: 'email', reference: 'synthetic-glove-4' })
  separate = await h.command('po.receive', { poId: separate.id, version: separate.version, lines: [{ lineId: separate.lines[0].id, quantity: '1' }] })
  assert.deepEqual(await cost(), beforeBulk)
  const otherCost = await (await h.request(`/api/glove/jobs/${anotherJob.id}/cost`)).json()
  assert.equal(otherCost.costing.actual.cost, '99.00')
  const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie })).json()
  assert.deepEqual(history.entries.filter(e => e.kind === 'purchase order').map(e => [e.id, e.jobId, e.status]).sort(),
    [[original.id, job.id, 'received'], [fractional.id, job.id, 'received']].sort())
  const otherHistory = await (await h.request(`/api/glove/sites/${anotherSite.id}/history`, { as: b.office.cookie })).json()
  assert.deepEqual(otherHistory.entries.filter(e => e.kind === 'purchase order').map(e => [e.id, e.jobId, e.status]), [[separate.id, anotherJob.id, 'received']])
  for (const [po, method, reference] of [[original, 'portal', 'SC-88812'], [fractional, 'phone', 'synthetic-glove-2'], [bulk, 'in person', 'synthetic-glove-3'], [separate, 'email', 'synthetic-glove-4']]) {
    assert.deepEqual([po.sent.method, po.sent.reference, po.sent.messageId], [method, reference, undefined])
    assert.ok((await h.state()).events.some(e => e.kind === 'po.sent' && e.subjectId === po.id && e.summary.includes(`by ${method} (supplier reference ${reference}); Glove sent nothing itself`)))
  }
  const outside = (await (await h.request(`/api/glove/conversation?jobId=${job.id}`)).json()).entries.filter(e => e.kind === 'purchase order sent')
  assert.deepEqual(outside.map(e => [e.channel, e.delivery]).sort(), [['phone', 'Not confirmed: sent outside Glove'], ['portal', 'Not confirmed: sent outside Glove']])

  // Email is an explicit person action through the existing connected provider,
  // including a named override address and honest authenticated outcomes.
  const unconnected = await b.office.run('po.save', order)
  await unchanged(b.office, 'email.send', { kind: 'purchaseOrder', id: unconnected.id, version: unconnected.version }, 'MAIL')
  const edge = await connectMail(h, 'postmark')
  const addresses = [['supplier', 'example.test'].join('@'), ['alternate', 'example.test'].join('@')]
  const emailOrders = []
  for (const [n, to] of addresses.entries()) {
    const po = await b.office.run('po.save', { ...order, supplierEmail: addresses[0], lines: [{ serviceId: cap.id, quantity: '1' }] })
    const payload = { kind: 'purchaseOrder', id: po.id, version: po.version, ...(n ? { to } : {}) }, commandId = id()
    await unchanged(b.dispatcher, 'email.send', payload, 'FORBIDDEN')
    const message = await b.office.run('email.send', payload, { commandId })
    const sent = h.email.sent.at(-1)
    assert.equal(sent.to, to)
    assert.ok(textOf(sent).includes(po.number) && textOf(sent).includes('Run capacitor 45/5'))
    const attempts = h.outbound.attempts
    assert.deepEqual(await b.office.run('email.send', payload, { commandId }), message)
    assert.equal(h.outbound.attempts, attempts, 'email command replay makes no second provider request')
    const messageReceipt = receipt(h, message), outcome = n ? 'bounced' : 'delivered'
    assert.equal((await h.state()).messageStates[message.id].status, 'accepted')
    const providerEvent = edge.callback(messageReceipt, outcome, '2026-10-21T04:01:00.000Z')
    assert.equal((await postEvents(h, providerEvent)).status, 200)
    assert.equal((await postEvents(h, providerEvent)).status, 200)
    const s = await h.state(), saved = s.purchaseOrders.find(o => o.id === po.id)
    assert.deepEqual([saved.status, saved.sent.method, saved.sent.to, saved.sent.messageId, s.messageStates[message.id].status], ['sent', 'email', to, message.id, outcome])
    assert.equal(s.messageStates[message.id].text, n ? `Bounced: ${to} did not accept it (reported by Postmark)` : `Delivered to ${to}'s mail server (reported by Postmark)`)
    const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`)).json()
    const queued = timeline.events.find(e => e.kind === 'email.queued' && e.subjectId === message.id)
    assert.equal(queued.actorId, b.office.id)
    assert.ok(queued.summary.includes(`${po.number} to Synthetic supplier to ${to} through Postmark; delivery is not yet reported`))
    await unchanged(b.office, 'email.send', { ...payload, version: saved.version }, 'PO_STATE')
    await unchanged(b.office, 'po.save', { ...order, id: saved.id, version: saved.version }, 'PO_STATE')
    emailOrders.push(saved)
  }
  const final = await snapshot()
  await h.restart()
  assert.deepEqual(await snapshot(), final, 'all order, receiving, cost and email facts persist across the actual Worker restart')
  const { exported } = await assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received', 'email.queued', 'email.accepted', 'email.delivered', 'email.bounced'])
  for (const po of [fractional, bulk, separate, ...emailOrders]) assert.deepEqual(exported.purchaseOrders.find(o => o.id === po.id), po)
}
