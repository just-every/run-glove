// COST-004 estimate versus actual job costing through the command, cost and
// report doors: a job quoted at $1,850 with an estimated 41% margin runs
// through recorded time, materials, an expense and a subcontractor bill to an
// actual 46% margin, to the cent.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('COST-004 a $1,850 job estimated at 41% margin comes in at 46% through time, materials, an expense and a subcontractor', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const condenser = await h.command('service.save', { code: 'COND-3T', name: '3-ton condenser', kind: 'material', category: 'Equipment', unit: 'each', unitCost: '700.00', unitPrice: '1400.00', tax: 'GST' })
  const install = await h.command('service.save', { code: 'INST-LAB', name: 'Condenser install labor', kind: 'service', category: 'Labor', unit: 'job', unitCost: '391.50', unitPrice: '450.00', tax: 'GST' })
  const priya = await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, costRate: '45.00' })
  assert.equal(priya.costRate, '45.00')

  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Condenser replacement', lines: [{ description: '3-ton condenser', quantity: '1', unitPrice: '1400.00', serviceId: condenser.id }, { description: 'Install labor', quantity: '1', unitPrice: '450.00', serviceId: install.id }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const cost = async (as = h.owner()) => (await h.request(`/api/glove/jobs/${job.id}/cost`, { as })).json()
  let c = (await cost()).costing
  assert.deepEqual([c.revenue, c.estimate.cost, c.estimate.margin], ['1850.00', '1091.50', '41.0'])

  // Three hours on the job (40 minutes' travel), the condenser fitted, a permit and a subcontractor's crane.
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '08:00', end: '11:00' })
  const at = time => `2026-10-21T${time}:00+11:00`
  await b.priyaPerson.run('clock.in', { deviceTime: at('07:55') })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'travel', deviceTime: at('08:00') })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at('08:40') })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: at('08:40') })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at('09:30'), kind: 'material', serviceId: condenser.id, quantity: '1' })
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '84.00', billable: false })
  await b.office.run('expense.record', { jobId: job.id, category: 'subcontractor bill', vendor: 'Harbour Cranes', amount: '80.00', billable: false })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at('11:00'), summary: 'Condenser replaced', signoff: { absentReason: 'Customer at work' } })

  c = (await cost()).costing
  assert.deepEqual([c.actual.labor, c.actual.materials, c.actual.expenses, c.actual.subcontractors, c.actual.cost, c.actual.margin], ['135.00', '700.00', '84.00', '80.00', '999.00', '46.0'])
  assert.deepEqual(c.actual.laborEntries.map(l => [l.kind, l.minutes, l.cost]), [['travel', 40, '30.00'], ['job', 140, '105.00']])
  assert.deepEqual([c.difference.cost, c.difference.margin], ['-92.50', '5.0'])

  // Reports roll it up by job type (the first line's category), technician and period.
  const report = await (await h.request('/api/glove/reports/costing?from=2026-10-01&to=2026-10-31', { as: b.office.cookie })).json()
  assert.deepEqual(report.byJobType.map(r => [r.type, r.jobs, r.revenue, r.estimatedCost, r.actualCost, r.estimatedMargin, r.actualMargin]), [['Equipment', 1, '1850.00', '1091.50', '999.00', '41.0', '46.0']])
  assert.deepEqual(report.byTechnician.map(r => [r.technician, r.minutes, r.laborCost, r.jobs]), [[b.priya.name, 180, '135.00', 1]])
  const november = await (await h.request('/api/glove/reports/costing?from=2026-11-01&to=2026-11-30', { as: h.owner() })).json()
  assert.equal(november.total.jobs, 0)

  // Costs and cost rates are margins: technicians never read them.
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: b.priyaPerson.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/reports/costing?from=2026-10-01&to=2026-10-31', { as: b.priyaPerson.cookie })).status, 403)
  assert.ok((await b.priyaPerson.state()).technicians.every(x => x.costRate === undefined))
})
