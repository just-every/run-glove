// COST-005 live margin warnings through the business, command and state doors:
// time and costs past the owner's threshold warn the owner and the dispatcher
// once each while the job is open, and the same crossing never repeats.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('COST-005 time past the cost threshold warns the owner and the dispatcher once each, and the margin floor warns separately', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const biz = (await h.state()).business[0]
  await h.command('business.save', { version: biz.version, name: biz.name, timezone: biz.timezone, marginWatch: { costPercent: 'lots' } }, { error: 'INPUT' })
  await h.command('business.save', { version: biz.version, name: biz.name, timezone: biz.timezone, marginWatch: { costPercent: '100', marginFloor: '30' } })
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, costRate: '45.00' })
  const condenser = await h.command('service.save', { code: 'COND-3T', name: '3-ton condenser', kind: 'material', category: 'Equipment', unit: 'each', unitCost: '700.00', unitPrice: '1400.00', tax: 'GST' })
  const install = await h.command('service.save', { code: 'INST-LAB', name: 'Condenser install labor', kind: 'service', category: 'Labor', unit: 'job', unitCost: '391.50', unitPrice: '450.00', tax: 'GST' })
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Condenser replacement', lines: [{ description: '3-ton condenser', quantity: '1', unitPrice: '1400.00', serviceId: condenser.id }, { description: 'Install labor', quantity: '1', unitPrice: '450.00', serviceId: install.id }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '08:00', end: '12:00' })
  const at = time => `2026-10-21T${time}:00+11:00`
  const warnings = async person => (await person.state()).warnings.filter(w => w.jobId === job.id).map(w => w.kind)
  const people = { owner: { state: () => h.state() }, dispatcher: b.dispatcher }

  // Estimate $1,091.50: the condenser and a $300 expense stay under it; four hours on the job pass it.
  await b.priyaPerson.run('clock.in', { deviceTime: at('07:55') })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at('08:00') })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at('08:30'), kind: 'material', serviceId: condenser.id, quantity: '1' })
  await b.office.run('expense.record', { jobId: job.id, category: 'equipment rental', vendor: 'Lift Hire', amount: '300.00', billable: false })
  for (const person of Object.values(people)) assert.deepEqual(await warnings(person), [])
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: at('08:00') })
  await b.priyaPerson.run('timer.stop', { visitId: visit.id, deviceTime: at('12:00') })
  for (const person of Object.values(people)) assert.deepEqual(await warnings(person), ['cost'], 'one warning to each of the owner and the dispatcher')
  for (const person of [b.office, b.priyaPerson, b.agent]) assert.deepEqual(await warnings(person), [])
  const warned = (await h.state()).warnings[0]
  assert.deepEqual([warned.actual, warned.estimate, warned.projectedMargin], ['1180.00', '1091.50', '36.2'])

  // More cost is the same crossing: no repeat. Falling below the 30% floor is its own warning, once.
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '20.00', billable: false })
  assert.deepEqual(await warnings(b.dispatcher), ['cost'])
  await b.office.run('expense.record', { jobId: job.id, category: 'subcontractor bill', vendor: 'Harbour Cranes', amount: '200.00', billable: false })
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '5.00', billable: false })
  assert.deepEqual(await warnings(b.dispatcher), ['cost', 'margin'])
  assert.deepEqual(await warnings(people.owner), ['cost', 'margin'])
  const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()
  assert.equal(timeline.events.filter(e => e.kind.startsWith('margin.')).length, 2)
  assert.ok(timeline.events.some(e => e.summary.includes('projected margin 24.3% is below the 30% floor')))
})
