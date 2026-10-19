// QUOTE-001 good, better and best options and add-ons through the command,
// state and dashboard doors: the customer's recorded choice is exactly what the
// job carries, and a template takes today's price-book prices unless it fixes
// one, while editing it never changes a quote already made from it.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('QUOTE-001 three options and two add-ons: the job carries exactly the chosen option and add-on; a template carries the raised price', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const filter = await h.command('service.save', { code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '18.00', tax: 'GST' })
  const uv = await h.command('service.save', { code: 'UV-LAMP', name: 'UV coil lamp', kind: 'material', unit: 'each', unitCost: '110.00', unitPrice: '240.00', tax: 'GST' })
  const line = (item, quantity = '1') => ({ description: item.name, quantity, unitPrice: item.unitPrice, serviceId: item.id })
  const options = [
    { name: 'Good', lines: [line(b.service)] },
    { name: 'Better', lines: [line(b.service), line(filter, '2')] },
    { name: 'Best', lines: [line(b.service), line(filter, '2'), line(uv)] },
  ]
  const addOns = [{ name: 'Surge protector', lines: [{ description: 'Surge protector', quantity: '1', unitPrice: '95.00' }] }, { name: 'Duct clean', lines: [{ description: 'Duct clean', quantity: '1', unitPrice: '320.00', tax: 'FREE' }] }]
  await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Too many', options: [...options, ...options] }, { error: 'INPUT' })
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Cooling tune-up', options, addOns })
  assert.deepEqual(quote.revisions[0].options.map(o => [o.name, o.totals.total]), [['Good', '207.90'], ['Better', '247.50'], ['Best', '511.50']])
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  const answer = { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' }
  await b.dispatcher.run('quote.accept', answer, { error: 'CHOICE' })
  await b.dispatcher.run('quote.accept', { ...answer, choice: { optionId: 'option-2', addOnIds: ['addon-9'] } }, { error: 'CHOICE' })
  const accepted = await b.dispatcher.run('quote.accept', { ...answer, choice: { optionId: 'option-2', addOnIds: ['addon-1'] } })
  // Better ($225.00) and the surge protector ($95.00), tax once on the document: $320.00 + $32.00.
  assert.deepEqual(accepted.acceptance.totals, { subtotal: '320.00', gst: '32.00', total: '352.00' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  assert.deepEqual(job.lines.map(l => [l.description, l.quantity, l.total]), [['Split system service', '1', '189.00'], ['Filter 16x20', '2', '36.00'], ['Surge protector', '1', '95.00']])
  assert.deepEqual(job.totals, accepted.acceptance.totals)
  const today = await (await h.request('/api/glove/dashboard', { as: h.owner() })).json()
  assert.equal(today.booked.total, '352.00', 'booked today counts the chosen lines')

  // The owner saves the options as a template; the duct clean keeps its fixed price.
  const template = await h.command('template.save', { name: 'Cooling tune-up', options: options.map(o => ({ name: o.name, lines: o.lines.map(l => ({ serviceId: l.serviceId, quantity: l.quantity })) })), addOns: [{ name: 'Surge protector', lines: [{ description: 'Surge protector', unitPrice: '95.00' }] }, { name: 'Duct clean', lines: [{ description: 'Duct clean', unitPrice: '320.00', tax: 'FREE' }] }], terms: 'Valid 30 days' })
  await b.dispatcher.run('template.save', { name: 'Mine', options: [] }, { error: 'FORBIDDEN' })
  await h.command('service.save', { id: filter.id, version: filter.version, code: filter.code, name: filter.name, kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '21.00', tax: 'GST' })
  const second = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Second unit tune-up', templateId: template.id })
  const rev = second.revisions[0]
  assert.deepEqual(rev.options.map(o => [o.name, o.totals.subtotal]), [['Good', '189.00'], ['Better', '231.00'], ['Best', '471.00']], 'the raised filter price')
  assert.deepEqual(rev.addOns.map(a => [a.name, a.totals.total]), [['Surge protector', '104.50'], ['Duct clean', '320.00']])
  assert.equal(rev.terms, 'Valid 30 days')
  assert.equal(rev.templateId, template.id)

  // Editing the template afterwards leaves the second quote unchanged.
  await h.command('template.save', { id: template.id, version: template.version, name: 'Cooling tune-up', options: [{ name: 'Only', lines: [{ serviceId: uv.id }] }] })
  const after = (await h.state()).quotes.find(q => q.id === second.id)
  assert.deepEqual(after.revisions, second.revisions)
  assert.deepEqual((await b.priyaPerson.state()).templates, [], 'technicians do not read templates')
})
