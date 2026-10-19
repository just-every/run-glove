// BOOK-005 service calls booked without a quote (by the dispatcher or the office), through the command, state,
// timeline and export doors: a phoned-in request becomes a job with a
// diagnostic fee, the technician adds approved work on site, and the invoice
// carries exactly the fee, the added lines and the recorded materials.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

test('BOOK-005 a leaking water heater: a job with an $89.00 diagnostic fee, a flat-rate valve and 1.5 hours added on site, invoiced exactly', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const diag = await h.command('service.save', { code: 'DIAG', name: 'Diagnostic fee', unit: 'call', unitCost: '0.00', unitPrice: '89.00', tax: 'GST' })
  const valve = await h.command('service.save', { code: 'TPR-VALVE', name: 'T&P relief valve', kind: 'material', unit: 'each', unitCost: '22.00', unitPrice: '48.00', tax: 'GST' })
  const replace = await h.command('service.save', { code: 'VALVE-FR', name: 'Valve replacement (flat rate)', kind: 'task', unit: 'job', unitPrice: '285.00', components: [{ serviceId: valve.id, quantity: '1' }], tax: 'GST' })
  const labor = await h.command('service.save', { code: 'LAB-HR', name: 'Plumbing labor', unit: 'hour', unitCost: '45.00', unitPrice: '120.00', tax: 'GST' })
  const tape = await h.command('service.save', { code: 'PTFE', name: 'Thread seal tape', kind: 'material', unit: 'roll', unitCost: '1.00', unitPrice: '4.00', tax: 'GST' })

  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Water heater leaking from the relief valve' })
  await b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }], siteId: (await h.command('site.save', { customerId: (await h.command('customer.save', { name: 'Someone else' })).id, address: '9 Other St' })).id }, { error: 'SITE' })
  const job = await b.dispatcher.run('job.create', { enquiryId: request.id, title: 'Leaking water heater', lines: [{ description: 'Diagnostic fee', quantity: '1', unitPrice: '89.00', serviceId: diag.id }] })
  assert.equal(job.quoteId, null)
  assert.deepEqual([job.totals.total, job.serviceCall.enquiryId], ['97.90', request.id])
  assert.equal((await h.state()).enquiries.find(e => e.id === request.id).status, 'won')
  const timeline = async () => (await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: h.owner() })).json()).events.map(e => e.summary)
  assert.ok((await timeline()).some(s => s.includes('service call without a quote') && s.includes('no price is approved until its invoice is')))

  // Booked for today; on site the technician adds the flat-rate valve and 1.5 hours with the customer's approval.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: today, start: '23:00', end: '23:45' })
  const now = new Date().toISOString()
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: now })
  const add = (serviceId, quantity, approval = { customerName: 'Dr Mei Lin', method: 'signed' }) => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId, quantity, approval })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'line', serviceId: replace.id, quantity: '1', approval: { customerName: '', method: 'signed' } }, { error: 'INPUT' })
  await add(replace.id, '1')
  await add(labor.id, '1.5', { customerName: 'Dr Mei Lin', method: 'verbal' })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: now, kind: 'material', serviceId: tape.id, quantity: '1' })
  const seen = await b.priyaPerson.state()
  assert.ok(seen.jobs.find(j => j.id === job.id).lines.every(l => l.unitPrice === undefined), 'the technician reads no prices')
  assert.ok(seen.captures.filter(x => x.kind === 'line').every(x => x.unitPrice === undefined && x.approval.customerName === 'Dr Mei Lin'))
  // Added work on a quoted job is a change order, not this.
  const quoted = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const quotedVisit = await b.dispatcher.run('visit.book', { jobId: quoted.id, technicianId: b.priya.id, date: '2026-10-28', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.capture', { visitId: quotedVisit.id, deviceTime: now, kind: 'line', serviceId: labor.id, quantity: '1', approval: { customerName: 'Dr Mei Lin', method: 'signed' } }, { error: 'QUOTED' })
  // The office makes service calls too (here from the customer record, with no lines), but a job from an accepted quote stays the dispatcher's.
  const officeCall = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'No hot water' })
  assert.deepEqual([officeCall.quoteId, officeCall.serviceCall.enquiryId, officeCall.lines.length, officeCall.serviceCall.by.name], [null, null, 0, 'Olu Office'])
  await b.office.run('job.create', { quoteId: (await acceptedQuote(h, b)).id }, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: now, summary: 'Replaced the relief valve', signoff: { absentReason: 'Customer signed on the added work' } })

  // The invoice draft carries exactly the fee, both added lines and the recorded material; approved, it exports.
  const invoice = await b.office.run('invoice.prepare', { jobId: job.id })
  const rev = invoice.revisions[0]
  assert.deepEqual(rev.lines.map(l => [l.description, l.quantity, l.total]), [
    ['Diagnostic fee', '1', '89.00'],
    ['Valve replacement (flat rate) (added on site, approved by Dr Mei Lin)', '1', '285.00'],
    ['Plumbing labor (added on site, approved by Dr Mei Lin)', '1.5', '180.00'],
    ['Thread seal tape (used on site)', '1', '4.00'],
  ])
  assert.deepEqual(rev.totals, { subtotal: '558.00', gst: '55.80', total: '613.80' })
  const approved = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  assert.equal(approved.status, 'approved')
  await b.office.run('invoice.export', {})
  assert.equal((await h.state()).jobs.find(j => j.id === job.id).status, 'invoiced')
})
