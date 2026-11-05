// STOCK-001 van and warehouse stock through the command, state and parts doors:
// counts and par levels, materials used on visits coming off the van, a
// transfer from the warehouse, the low-stock flag and the parts check for
// tomorrow's jobs.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, id } from './harness.mjs'

test('DATA-002, DATA-009, DATA-010 / STOCK-001 van stock: counts, materials used on two visits, a warehouse transfer, low stock and tomorrow\'s parts check', async (t) => {
  const at = '2026-10-21T08:00:00.000Z'
  const h = await installation({ at })
  t.after(() => h.close())
  const b = await business(h)
  const cap = await h.command('service.save', { code: 'CAP-455', name: 'Run capacitor 45/5', kind: 'material', unit: 'each', unitCost: '12.00', unitPrice: '38.00', tax: 'GST' })
  const filter = await h.command('service.save', { code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '18.00', tax: 'GST' })
  await b.office.run('stock.location', { kind: 'van', name: 'Labor hours', technicianId: b.priya.id, pars: [{ serviceId: b.service.id, par: '1' }] }, { error: 'INPUT' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const van = await b.office.run('stock.location', { kind: 'van', name: 'Van 2 (Priya)', technicianId: b.priya.id, pars: [{ serviceId: cap.id, par: '3' }] })
  await b.office.run('stock.location', { kind: 'van', name: 'Second van', technicianId: b.priya.id }, { error: 'DUPLICATE' })
  await b.priyaPerson.run('stock.restock', { locationId: van.id, serviceId: cap.id, quantity: '5' }, { error: 'FORBIDDEN' })
  await b.office.run('stock.count', { locationId: van.id, serviceId: cap.id, quantity: '5', reason: 'Monday stocktake' })
  await b.office.run('stock.count', { locationId: van.id, serviceId: filter.id, quantity: '1' })
  await b.office.run('stock.restock', { locationId: warehouse.id, serviceId: cap.id, quantity: '20', note: 'Supply Co order 4471' })

  // A job for each line set, booked for Priya on a date.
  const jobFor = async (title, lines, date, start) => {
    const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, lines })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
    const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start, end: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00` })
    return { job, visit }
  }
  const service = [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }]
  const first = await jobFor('No cooling', service, '2026-10-21', '09:00'), second = await jobFor('Short cycling', service, '2026-10-21', '11:00')

  // Materials used on two visits come off the van; free text does not touch stock.
  for (const [{ visit }, quantity] of [[first, '2'], [second, '1']]) {
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:00:00Z' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:10:00Z', kind: 'material', serviceId: cap.id, quantity })
  }
  await b.priyaPerson.run('visit.capture', { visitId: second.visit.id, deviceTime: '2026-10-20T22:20:00Z', kind: 'material', description: 'Cable ties', quantity: '4' })
  const counts = async () => Object.fromEntries((await h.state()).stock.map(l => [l.name, l.counts]))
  assert.deepEqual((await counts())['Van 2 (Priya)'], { [cap.id]: 2000, [filter.id]: 1000 })
  const uses = (await h.state()).stockMoves.filter(m => m.kind === 'use').sort((a, b) => Number(a.after) - Number(b.after)).reverse()
  assert.deepEqual(uses.map(m => [m.delta, m.after, m.jobId]), [['-2', '3', first.job.id], ['-1', '2', second.job.id]])
  assert.ok(uses.every(m => m.captureId))

  // Tomorrow's jobs: the first needs 2 capacitors and a filter, the second one more capacitor.
  const tomorrowA = await jobFor('Capacitor and filter', [{ description: 'Run capacitor', quantity: '2', unitPrice: '38.00', serviceId: cap.id }, { description: 'Filter', quantity: '1', unitPrice: '18.00', serviceId: filter.id }], '2026-10-22', '08:00')
  const tomorrowB = await jobFor('Capacitor swap', [{ description: 'Run capacitor', quantity: '1', unitPrice: '38.00', serviceId: cap.id }, ...service], '2026-10-22', '13:00')
  const parts = async (as) => (await h.request(`/api/glove/parts?date=2026-10-22&technicianId=${b.priya.id}`, { as })).json()
  let check = await parts(b.office.cookie)
  assert.deepEqual(check.jobs.map(j => [j.number, j.ready, j.parts.map(p => [p.code, p.needed, p.onVan, p.onBoard])]), [
    [tomorrowA.job.number, true, [['CAP-455', '2', '2', true], ['FLT-1620', '1', '1', true]]],
    [tomorrowB.job.number, false, [['CAP-455', '1', '2', false]]],
  ])
  // Low stock: two capacitors is at or below the par of three.
  const low = async () => (await h.state()).stock.find(l => l.id === van.id)
  assert.ok((await low()).counts[cap.id] <= (await low()).pars[cap.id])

  // A transfer from the warehouse fills the van; a transfer beyond what is there is refused.
  const transferId = id(), transfer = { fromId: warehouse.id, toId: van.id, serviceId: cap.id, quantity: '4' }
  const transferred = await b.office.run('stock.transfer', transfer, { commandId: transferId })
  const unchanged = await h.state()
  await b.office.run('stock.transfer', { ...transfer, quantity: '40' }, { error: 'STOCK' })
  assert.deepEqual(await h.state(), unchanged, 'an overdrawn transfer changes no domain record')
  await h.restart()
  assert.deepEqual(await h.state(), unchanged, 'the actual Worker restart retains all stock and movement identities')
  assert.deepEqual(await b.office.run('stock.transfer', transfer, { commandId: transferId }), transferred)
  assert.deepEqual(await h.state(), unchanged, 'replay after restart creates no transfer or movement')
  assert.deepEqual(await counts(), { 'Balmain warehouse': { [cap.id]: 16000 }, 'Van 2 (Priya)': { [cap.id]: 6000, [filter.id]: 1000 } })
  check = await parts(b.priyaPerson.cookie)
  assert.equal(check.van.name, 'Van 2 (Priya)')
  assert.deepEqual(check.jobs.map(j => j.ready), [true, true], 'the technician reads their own day')
  const seen = await b.priyaPerson.state()
  assert.deepEqual(seen.stock.map(l => l.name), ['Van 2 (Priya)'], 'a technician sees only their van')
  assert.equal((await h.request(`/api/glove/parts?date=2026-10-22&technicianId=${b.tom.id}`, { as: b.priyaPerson.cookie }).then(r => r.json())).technicianId, b.priya.id)
  assert.deepEqual(check.jobs.map(j => [j.jobId, j.ready, j.parts.map(p => [p.serviceId, p.needed, p.onVan, p.onBoard])]), [
    [tomorrowA.job.id, true, [[cap.id, '2', '6', true], [filter.id, '1', '1', true]]],
    [tomorrowB.job.id, true, [[cap.id, '1', '6', true]]],
  ])
  const moves = (await h.state()).stockMoves
  const ordered = rows => rows.map(row => JSON.stringify(row)).sort()
  assert.deepEqual(ordered(moves.map(m => [m.locationId, m.serviceId, m.kind, m.delta, m.after, m.by.id, m.by.name, m.createdAt])), ordered([
    [van.id, cap.id, 'count', '5', '5', b.office.id, b.office.name, at],
    [van.id, filter.id, 'count', '1', '1', b.office.id, b.office.name, at],
    [warehouse.id, cap.id, 'restock', '20', '20', b.office.id, b.office.name, at],
    [van.id, cap.id, 'use', '-2', '3', b.priyaPerson.id, b.priyaPerson.name, at],
    [van.id, cap.id, 'use', '-1', '2', b.priyaPerson.id, b.priyaPerson.name, at],
    [warehouse.id, cap.id, 'transfer', '-4', '16', b.office.id, b.office.name, at],
    [van.id, cap.id, 'transfer', '4', '6', b.office.id, b.office.name, at],
  ]))
  const out = moves.find(m => m.kind === 'transfer' && m.locationId === warehouse.id)
  const into = moves.find(m => m.kind === 'transfer' && m.locationId === van.id)
  assert.equal(out.transferId, into.transferId)
  assert.equal(out.toId, van.id)
  assert.equal(into.fromId, warehouse.id)
  for (const [visit, job] of [[first.visit, first.job], [second.visit, second.job]]) {
    const move = moves.find(m => m.kind === 'use' && m.jobId === job.id)
    assert.equal(move.visitId, visit.id)
    assert.equal(move.jobId, job.id)
    assert.equal((await h.state()).captures.find(c => c.id === move.captureId).visitId, visit.id)
  }

  // Thousandths, task contents, multiplication, start ordering and local-day isolation.
  const wire = await h.command('service.save', { code: 'WIRE', name: 'Cable', kind: 'material', unit: 'm', unitCost: '2.00', unitPrice: '4.00', tax: 'GST' })
  const task = await h.command('service.save', { code: 'WIRE-TASK', name: 'Wire repair', kind: 'task', unitPrice: '30.00', tax: 'GST', components: [{ serviceId: wire.id, quantity: '1.125' }, { serviceId: cap.id, quantity: '0.5' }] })
  await h.command('stock.count', { locationId: van.id, serviceId: wire.id, quantity: '2.625' })
  await h.command('stock.restock', { locationId: van.id, serviceId: wire.id, quantity: '0.125' })
  assert.equal((await low()).counts[wire.id], 2750, 'restock adds to an existing fractional count')
  await h.command('stock.count', { locationId: van.id, serviceId: wire.id, quantity: '2.625' })
  assert.equal((await low()).counts[wire.id], 2625, 'stocktake replaces the earlier count')
  await b.office.run('stock.location', { ...van, version: (await low()).version, pars: [{ serviceId: cap.id, par: '3' }, { serviceId: wire.id, par: '0.125' }] })
  await b.office.run('stock.count', { locationId: van.id, serviceId: wire.id, quantity: '0.0001' }, { error: 'QUANTITY' })
  const later = await jobFor('Later fractional cable', [{ serviceId: wire.id, description: 'Cable', quantity: '0.125', unitPrice: '4.00' }], '2026-10-23', '13:00')
  const earlier = await jobFor('Earlier task contents', [{ serviceId: task.id, description: 'Wire repair', quantity: '2', unitPrice: '30.00' }, { serviceId: wire.id, description: 'Cable', quantity: '0.375', unitPrice: '4.00' }], '2026-10-23', '08:00')
  const readParts = async (date, technicianId = b.priya.id, as = h.owner()) => {
    const response = await h.request(`/api/glove/parts?date=${date}&technicianId=${technicianId}`, { as })
    assert.equal(response.status, 200)
    return response.json()
  }
  const fractional = await readParts('2026-10-23')
  assert.deepEqual(fractional.jobs.map(j => [j.jobId, j.start, j.ready, j.parts.map(p => [p.serviceId, p.needed, p.onVan, p.onBoard])]), [
    [earlier.job.id, '08:00', true, [[wire.id, '2.625', '2.625', true], [cap.id, '1', '6', true]]],
    [later.job.id, '13:00', false, [[wire.id, '0.125', '2.625', false]]],
  ])
  assert.deepEqual((await readParts('2026-10-24')).jobs, [])
  assert.deepEqual((await readParts('2026-10-23', b.tom.id)).jobs, [])
  const tomVan = await h.command('stock.location', { kind: 'van', technicianId: b.tom.id, name: 'Tom van', pars: [{ serviceId: wire.id, par: '1.125' }] })
  await h.command('stock.restock', { locationId: tomVan.id, serviceId: wire.id, quantity: '7.125' })
  const captureId = id(), captureInput = { visitId: second.visit.id, deviceTime: '2026-10-21T07:30:00.000Z', kind: 'material', serviceId: wire.id, quantity: '2.75' }
  const captured = await b.priyaPerson.run('visit.capture', captureInput, { commandId: captureId })
  const negative = await h.state()
  assert.equal(negative.stock.find(l => l.id === van.id).counts[wire.id], -125)
  assert.equal(negative.stock.find(l => l.id === tomVan.id).counts[wire.id], 7125)
  const fractionalUse = negative.stockMoves.find(m => m.captureId === captured.id)
  assert.deepEqual([fractionalUse.kind, fractionalUse.delta, fractionalUse.after, fractionalUse.captureId, fractionalUse.by.id], ['use', '-2.75', '-0.125', captured.id, b.priyaPerson.id])
  await h.restart()
  assert.deepEqual(await b.priyaPerson.run('visit.capture', captureInput, { commandId: captureId }), captured)
  assert.deepEqual(await h.state(), negative, 'capture replay preserves the negative count and movement identity')
  const beforeReads = await h.state()
  for (const person of [b.priyaPerson, b.tomPerson]) {
    const state = await person.state()
    const own = person === b.priyaPerson ? van : tomVan
    assert.deepEqual(state.stock.map(l => l.id), [own.id])
    assert.ok(state.stockMoves.every(m => m.locationId === own.id))
    const parts = await readParts('2026-10-23', person === b.priyaPerson ? b.tom.id : b.priya.id, person.cookie)
    assert.equal(parts.technicianId, person === b.priyaPerson ? b.priya.id : b.tom.id)
    assert.deepEqual(parts.jobs.map(j => j.jobId), person === b.priyaPerson ? [earlier.job.id, later.job.id] : [])
  }
  assert.deepEqual(await h.state(), beforeReads, 'parts and state reads have no stock effect')
  const viewer = await h.person('Stock Viewer', 'viewer'), subcontractor = await h.person('Stock Subcontractor', 'subcontractor')
  for (const person of [b.dispatcher, b.priyaPerson, b.tomPerson, b.agent, viewer, subcontractor]) {
    const before = await h.state()
    for (const [type, payload] of [
      ['stock.location', { kind: 'warehouse', name: 'Refused warehouse' }],
      ['stock.count', { locationId: van.id, serviceId: cap.id, quantity: '99' }],
      ['stock.restock', { locationId: van.id, serviceId: cap.id, quantity: '99' }],
      ['stock.transfer', transfer],
    ]) await person.run(type, payload, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), before, `${person.name} cannot change stock`)
  }
  assert.equal((await h.request('/api/glove/parts?date=2026-10-23', { as: '' })).status, 401)
  assert.equal((await h.request('/api/glove/parts?date=2026-10-23', { as: subcontractor.cookie })).status, 403)
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  const revoked = await h.state()
  await b.office.run('stock.transfer', transfer, { error: 'FORBIDDEN' })
  assert.deepEqual(await h.state(), revoked, 'withdrawn stock authority has no effect')

  const { activity, exported } = await assertTrail(h, ['stock.location', 'stock.count', 'stock.restock', 'stock.transfer', 'stock.use'])
  assert.deepEqual(exported.stockMoves, (await h.state()).stockMoves, 'the business download retains every full movement')
  for (const move of (await h.state()).stockMoves) {
    const entry = activity.find(e => e.kind === `stock.${move.kind}` && e.subjectId === move.locationId && e.actorId === move.by.id && e.summary.includes(`now holds ${move.after} `))
    assert.ok(entry, `movement ${move.id} has an attributable timeline entry`)
    assert.equal(entry.at, move.createdAt)
    assert.ok(exported.timeline.some(e => e.id === entry.id && e.actor_id === move.by.id))
  }
  // Erasure retires saved capture outcomes; neither replay nor a new capture
  // can resurrect an erased visit or debit its van a second time.
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const erased = await h.state()
  await h.restart()
  await b.priyaPerson.run('visit.capture', captureInput, { commandId: captureId, error: 'ERASED' })
  await b.priyaPerson.run('visit.capture', captureInput, { error: 'NOT_FOUND' })
  assert.deepEqual(await h.state(), erased, 'erased outcomes and visits cannot be replayed into stock effects')
  assert.equal(erased.stock.find(l => l.id === van.id).counts[wire.id], -125)
  assert.deepEqual(erased.captures, [])
  console.log('PROBE STOCK-001 1: native stock, two visits, transfer and tomorrow parts -> van 6, warehouse 16; cumulative ready true,true; restart and replay unchanged')
  console.log('PROBE STOCK-001 2: native fractional material and per-van pars -> counts to thousandths; nonmaterial and fourth decimal refused')
  console.log('PROBE STOCK-001 3: stock commands and material capture -> negative -0.125 retained; overdraw leaves domain unchanged')
  console.log('PROBE STOCK-001 4: state, Activity and business export -> all movements retain actor, time, delta, resulting count and timeline')
  console.log('PROBE STOCK-001 6: parts route with task quantity 2 -> cable need 2.625 then 0.125; second job short; other date empty')
  console.log('PROBE STOCK-001 7: two technician sessions and current-role refusal -> own van and day only; writes refused unchanged')
})
