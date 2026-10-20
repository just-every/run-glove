import test from 'node:test'
import assert from 'node:assert/strict'
import { installation } from './harness.mjs'

test('QUOTE-007 discount lines and a document discount allocate to non-taxable lines first, then taxable lines, identically on the quote, job, invoice, CSV, QuickBooks payload and reports, within the owner\'s limits', async t => {
  const h = await installation(); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: false }] } })
  const parts = await h.command('service.save', { code: 'PARTS', name: 'Condenser parts', kind: 'material', unitPrice: '400.00', tax: 'TAXABLE' })
  const labor = await h.command('service.save', { code: 'LABOR', name: 'Install labor', kind: 'service', unitPrice: '300.00', tax: 'TAXABLE' })
  await h.command('service.save', { code: 'BAD', name: 'Positive discount', kind: 'discount', unitPrice: '50.00', tax: 'FREE' }, { error: 'INPUT' })
  const first = await h.command('service.save', { code: 'FIRST', name: 'First-time customer', kind: 'discount', unitPrice: '-50.00', tax: 'FREE' })
  const customer = await h.command('customer.save', { name: 'Rosa Diaz' })
  const site = await h.command('site.save', { customerId: customer.id, address: '10 Service St, Austin TX 78704', zip: '78704' })
  const lines = [parts, labor, first].map(x => ({ description: x.name, serviceId: x.id, quantity: '1', unitPrice: x.unitPrice }))
  const tenPercent = { kind: 'percent', value: '10', reason: 'Senior' }

  // The owner limits who may give a discount: unlisted roles give none; a listed role up to its percent.
  const office = await h.person('Front Office', 'office'), dispatcher = await h.person('Dee Dispatcher', 'dispatcher')
  await dispatcher.run('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Condenser swap', lines, discount: tenPercent }, { error: 'DISCOUNT_LIMIT' })
  const b = (await h.state()).business[0]
  await h.command('business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: { office: '20', dispatcher: '20' } })
  await dispatcher.run('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Too generous', lines, discount: { kind: 'percent', value: '15', reason: 'Senior' } }, { error: 'DISCOUNT_LIMIT' })
  // A service call's discount line is held to the same limit: 50 of 700 is within 20%, 300 of 700 is not.
  await dispatcher.run('job.create', { customerId: customer.id, siteId: site.id, title: 'Goodwill call', lines: [...lines.slice(0, 2), { description: 'Goodwill', quantity: '1', unitPrice: '-300.00', tax: 'TAXABLE' }] }, { error: 'DISCOUNT_LIMIT' })
  const q = await dispatcher.run('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Condenser swap', lines, discount: tenPercent })
  const ten = q.revisions[0].totals
  assert.deepEqual([ten.subtotal, ten.discount.amount, ten.discount.nonTaxable, ten.discount.taxable, ten.gst, ten.total], ['650.00', '65.00', '65.00', '0.00', '33.00', '618.00'])
  assert.deepEqual(ten.discount.lines, [{ line: 2, amount: '65.00' }], 'the discount is taken from labor')
  assert.equal(q.revisions[0].lines[2].total, '-50.00')
  await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Over-discounted', lines: [...lines, { description: 'Goodwill', quantity: '1', unitPrice: '-300.00', tax: 'FREE' }] }, { error: 'DISCOUNT' })
  await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'More than the subtotal', lines, discount: { kind: 'amount', value: '650.01', reason: 'Goodwill' } }, { error: 'DISCOUNT' })

  const revised = await h.command('quote.revise', { quoteId: q.id, version: q.version, lines, discount: { kind: 'percent', value: '50', reason: 'Military' } })
  const half = revised.revisions[1].totals
  assert.deepEqual([half.subtotal, half.discount.amount, half.discount.nonTaxable, half.discount.taxable, half.gst, half.total], ['650.00', '325.00', '250.00', '75.00', '26.81', '351.81'])
  assert.deepEqual(half.discount.lines, [{ line: 2, amount: '250.00' }, { line: 1, amount: '75.00' }], 'labor first, then parts spill')
  assert.deepEqual(half.taxBreakdown.map(x => [x.taxable, x.tax]), [['325.00', '26.81']])
  const approved = await h.command('quote.approve', { quoteId: q.id, version: revised.version, revision: 2 })
  const accepted = await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 2, method: 'phone', customerName: 'Rosa Diaz' })
  assert.deepEqual(accepted.acceptance.totals, half)
  const job = await h.command('job.create', { quoteId: q.id })
  assert.deepEqual([job.totals, job.discount], [half, { kind: 'percent', value: '50', reason: 'Military' }])
  const person = await h.person('Priya Nair', 'technician')
  const tech = await h.command('technician.save', { name: 'Priya Nair', operatorId: person.id })
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
  await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Condenser replaced', signoff: { absentReason: 'Customer at work' } })

  // Carrying the accepted discount is not giving one; giving more is held to the office limit.
  const inv = await office.run('invoice.prepare', { jobId: job.id })
  assert.deepEqual(inv.revisions[0].totals, half)
  await office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Extra goodwill', lines, discount: { kind: 'percent', value: '60', reason: 'Military' } }, { error: 'DISCOUNT_LIMIT' })
  const invoice = await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  const qbo = await h.request(`/api/glove/invoices/${invoice.id}/quickbooks.json?customerRef=58&itemRef=41&taxCodeRef=7`).then(r => r.json())
  const discountLine = qbo.Line.find(l => l.DetailType === 'DiscountLineDetail')
  assert.deepEqual([discountLine.Amount, discountLine.DiscountLineDetail, qbo.ApplyTaxAfterDiscount, qbo.TxnTaxDetail.TotalTax], [325, { PercentBased: true, DiscountPercent: 50 }, true, 26.81])
  assert.match(discountLine.Description, /non-taxable \$250\.00, taxable \$75\.00/)
  assert.deepEqual(qbo.Line.filter(l => l.DetailType === 'SalesItemLineDetail').map(l => [l.Amount, l.SalesItemLineDetail.TaxCodeRef.value]), [[400, 'TAX'], [300, 'NON'], [-50, 'NON']])
  const batch = await h.command('invoice.export', {})
  const csv = await h.request(`/api/glove/exports/${batch.id}.csv`).then(r => r.text())
  assert.match(csv, /Discount: Military \(50%\) on non-taxable lines,1,-250\.00,200,Tax exempt,USD/)
  assert.match(csv, /Discount: Military \(50%\) on taxable lines,1,-75\.00,200,Austin combined,USD/)
  assert.match(csv, /,325\.00,26\.81,351\.81\r\n/)
  const period = 'from=2026-01-01&to=2027-12-31'
  const revenue = await h.request(`/api/glove/reports/revenue.json?${period}`).then(r => r.json())
  assert.equal(revenue.total.revenue, '325.00')
  const tax = await h.request(`/api/glove/reports/tax.json?${period}`).then(r => r.json())
  assert.ok(JSON.stringify(tax).includes('26.81') && JSON.stringify(tax).includes('325.00'), JSON.stringify(tax))
})
