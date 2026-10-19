// STOCK-001 van and warehouse stock through the command, state and parts doors:
// counts and par levels, materials used on visits coming off the van, a
// transfer from the warehouse, the low-stock flag and the parts check for
// tomorrow's jobs.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('STOCK-001 van stock: counts, materials used on two visits, a warehouse transfer, low stock and tomorrow\'s parts check', async (t) => {
  const h = await installation()
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
  const uses = (await h.state()).stockMoves.filter(m => m.kind === 'use')
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
  await b.office.run('stock.transfer', { fromId: warehouse.id, toId: van.id, serviceId: cap.id, quantity: '4' })
  await b.office.run('stock.transfer', { fromId: warehouse.id, toId: van.id, serviceId: cap.id, quantity: '40' }, { error: 'STOCK' })
  assert.deepEqual(await counts(), { 'Balmain warehouse': { [cap.id]: 16000 }, 'Van 2 (Priya)': { [cap.id]: 6000, [filter.id]: 1000 } })
  check = await parts(b.priyaPerson.cookie)
  assert.equal(check.van.name, 'Van 2 (Priya)')
  assert.deepEqual(check.jobs.map(j => j.ready), [true, true], 'the technician reads their own day')
  const seen = await b.priyaPerson.state()
  assert.deepEqual(seen.stock.map(l => l.name), ['Van 2 (Priya)'], 'a technician sees only their van')
  assert.equal((await h.request(`/api/glove/parts?date=2026-10-22&technicianId=${b.tom.id}`, { as: b.priyaPerson.cookie }).then(r => r.json())).technicianId, b.priya.id)
})
