// STOCK-002 purchase orders to suppliers through the command, state, cost and
// history doors: the office raises an order for a job, records it as sent
// through the supplier's portal, receives it in two parts into the warehouse,
// and the stock counts and the job's actual cost follow, to the cent.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, acceptedQuote, id } from './harness.mjs'

test('DATA-002 / STOCK-002 a purchase order for a job, received in two parts, lands in stock and in the job cost', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const cap = await h.command('service.save', { code: 'CAP-455', name: 'Run capacitor 45/5', kind: 'material', unit: 'each', unitCost: '12.00', unitPrice: '38.00', tax: 'GST' })
  const filter = await h.command('service.save', { code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '18.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })

  // Only the owner and office purchase; only materials are ordered; the line's cost defaults to the price book's.
  const order = { supplier: 'Supply Co', supplierEmail: 'orders@supplyco.example', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: cap.id, quantity: '4', unitCost: '11.50' }, { serviceId: filter.id, quantity: '10' }] }
  await b.dispatcher.run('po.save', order, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('po.save', order, { error: 'FORBIDDEN' })
  await b.office.run('po.save', { ...order, lines: [{ serviceId: b.service.id, quantity: '1' }] }, { error: 'INPUT' })
  let po = await b.office.run('po.save', { ...order, lines: [{ serviceId: cap.id, quantity: '3', unitCost: '11.50' }] })
  po = await b.office.run('po.save', { ...order, id: po.id, version: po.version })
  assert.deepEqual([po.number, po.status, po.lines.map(l => [l.code, l.quantity, l.unitCost, l.total]), po.total], ['PO-0001', 'draft', [['CAP-455', '4', '11.50', '46.00'], ['FLT-1620', '10', '6.00', '60.00']], '106.00'])

  // Glove sends nothing: the office records it went through the supplier's portal, and receiving waits for that.
  await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] }, { error: 'PO_STATE' })
  po = await b.office.run('po.send', { poId: po.id, version: po.version, method: 'portal', reference: 'SC-88812' })
  assert.deepEqual([po.status, po.sent.method, po.sent.reference, po.sent.by.name], ['sent', 'portal', 'SC-88812', 'Olu Office'])
  await b.office.run('po.save', { ...order, id: po.id, version: po.version }, { error: 'PO_STATE' })
  const timeline = async () => (await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()).events.map(e => e.summary)
  assert.ok((await timeline()).some(s => s.includes('recorded PO-0001 as sent to Supply Co by portal (supplier reference SC-88812); Glove sent nothing itself')))

  // Two parts: two capacitors first, then the rest; more than is still due is refused.
  const [capLine, filterLine] = po.lines
  po = await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '2' }] })
  assert.deepEqual([po.status, po.lines.map(l => l.received)], ['partly received', ['2', '0']])
  await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '3' }] }, { error: 'OVER' })
  po = await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: capLine.id, quantity: '2' }, { lineId: filterLine.id, quantity: '10' }], note: 'Back order arrived' })
  assert.deepEqual([po.status, po.lines.map(l => l.received), po.receipts.length], ['received', ['4', '10'], 2])
  await b.office.run('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: filterLine.id, quantity: '1' }] }, { error: 'PO_STATE' })

  // Stock: the warehouse holds what arrived, each part a stock move naming the order and the job.
  const s = await h.state()
  assert.deepEqual(s.stock.find(l => l.id === warehouse.id).counts, { [cap.id]: 4000, [filter.id]: 10000 })
  // Moves of one receipt share a time, so they are compared without an order between them.
  const byItem = rows => rows.map(r => r.join(' ')).sort()
  assert.deepEqual(byItem(s.stockMoves.filter(m => m.kind === 'receive').map(m => [m.serviceId, m.delta, m.after, m.poId, m.jobId])), byItem([[cap.id, '2', '2', po.id, job.id], [cap.id, '2', '4', po.id, job.id], [filter.id, '10', '10', po.id, job.id]]))

  // Job cost: the received lines at the order's cost; a capacitor recorded on the job from them is not counted twice.
  const cost = async (as = h.owner()) => (await (await h.request(`/api/glove/jobs/${job.id}/cost`, { as })).json()).costing
  let c = await cost()
  assert.deepEqual([c.actual.purchases, c.actual.materials, c.actual.cost], ['106.00', '0.00', '106.00'])
  assert.deepEqual(c.actual.purchaseEntries.map(l => [l.number, l.description, l.received, l.cost]), [['PO-0001', 'Run capacitor 45/5', '4', '46.00'], ['PO-0001', 'Filter 16x20', '10', '60.00']])
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:00:00Z' })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:10:00Z', kind: 'material', serviceId: cap.id, quantity: '5' })
  c = await cost(b.office.cookie)
  assert.deepEqual([c.actual.materialEntries.map(m => [m.quantity, m.fromPurchaseOrders, m.cost]), c.actual.materials, c.actual.cost], [[['5', '4', '12.00']], '12.00', '118.00'])

  // The order shows on the property's history; technicians never read purchase orders or their costs.
  const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie })).json()
  assert.ok(history.entries.some(e => e.kind === 'purchase order' && e.label === `PO-0001 to Supply Co for ${job.number}` && e.status === 'received'))
  assert.deepEqual((await b.priyaPerson.state()).purchaseOrders, [])
  await assertTrail(h, ['po.raised', 'po.revised', 'po.sent', 'po.received'])
})


test('STOCK-002 / TEAM-001 purchase commands acknowledge writes without granting margin reads, including old outcomes after role edits', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const material = await h.command('service.save', { code: 'PRIVATE-COST', name: 'Compressor', kind: 'material', unitCost: '137.29', unitPrice: '350.00' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Warehouse' })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const permissions = ['po.save', 'po.send', 'po.receive']
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

  // Replaying a durable full record follows current permission in both directions.
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: [...permissions, 'reports.read'] })
  for (const command of commands) {
    const replay = await receiver.run(command.type, command.payload, { commandId: command.commandId })
    assert.equal(replay.lines[0].unitCost, '137.29')
    assert.equal(replay.total, '274.58')
    assert.equal(replay.version, command.result.version, 'the historical outcome is retained')
  }
  assert.equal((await receiver.state()).purchaseOrders[0].total, '274.58')
  const commandId = id(), payload = { ...commands[0].payload, supplier: 'Full access order' }
  const full = await receiver.run('po.save', payload, { commandId })
  assert.equal(full.lines[0].unitCost, '137.29')
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions })
  assert.deepEqual(await receiver.run('po.save', payload, { commandId }), { id: full.id, version: full.version }, 'a previously full outcome loses margin access immediately')
  await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: [] })
  await receiver.run('po.save', payload, { commandId, error: 'FORBIDDEN' })
})
