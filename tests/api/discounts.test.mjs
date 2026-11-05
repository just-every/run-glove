import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, assertTrail, id } from './harness.mjs'

test('Owner discounts retain exact rounding, boundaries, ordered allocation, authority and downstream figures', async t => {
  const h = await installation({ at: '2026-11-05T16:00:00.000Z' }); t.after(() => h.close())
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
  const date = '2026-11-05'
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
  await qualifyOwnerPricing(h, customer, site)
})

// Continue the same native discount journey with independently priced boundary
// cases. Every figure below is expected money, never another product projection.
async function qualifyOwnerPricing(h, customer, site) {
  const owner = (await h.state()).actor
  const retained = async () => {
    const response = await h.request('/api/glove/export')
    assert.equal(response.status, 200)
    const { exportedAt: _downloadTime, ...records } = await response.json()
    return records
  }
  const refuse = async (type, payload, error, as) => {
    const before = await retained()
    await h.command(type, payload, { error, ...(as ? { as } : {}) })
    assert.deepEqual(await retained(), before, `${type}: ${error} changes no domain record or Activity entry`)
  }
  const receipts = []
  const send = async (type, payload) => {
    const commandId = id(), result = await h.command(type, payload, { commandId })
    receipts.push({ commandId, type, result, payload })
    return result
  }
  const discountItem = { code: 'CENT-DISCOUNT', name: 'Synthetic cent discount', kind: 'discount', pricing: 'fixed', unitPrice: '-0.01', unitCost: '9.99', tax: 'FREE' }
  const cent = await send('service.save', discountItem)
  assert.deepEqual([cent.kind, cent.pricing, cent.unitPrice, cent.unitCost, cent.tax], ['discount', 'fixed', '-0.01', '0.00', 'FREE'], 'a catalogue discount is fixed, negative and has no cost')
  for (const patch of [{ unitPrice: '0' }, { unitPrice: '0.01' }, { pricing: 'markup' }]) {
    await refuse('service.save', { ...discountItem, ...patch, id: cent.id, version: cent.version }, 'INPUT')
  }
  const base = { customerId: customer.id, siteId: site.id, title: 'Synthetic discount qualification' }
  const line = (description, unitPrice, tax = 'FREE', quantity = '1') => ({ description, unitPrice, tax, quantity })
  const rounding = [
    ['0.499', '0.00', '2.00', '2.08'],
    ['0.5', '-0.01', '1.98', '2.06'],
    ['0.501', '-0.01', '1.98', '2.06'],
    ['1.5', '-0.02', '1.96', '2.04'],
  ]
  const roundedQuotes = []
  for (const [quantity, total, subtotal, gross] of rounding) {
    const q = await send('quote.draft', { ...base, lines: [
      line('Non-taxable charge', '1.00'), line('Taxable charge', '1.00', 'TAXABLE'),
      line('Custom goodwill', '-0.01', 'TAXABLE', quantity),
      { ...line(cent.name, '-0.01', 'FREE', quantity), serviceId: cent.id },
    ] })
    const rev = q.revisions[0]
    assert.deepEqual(rev.lines.map(l => [l.quantity, l.unitPrice, l.total, l.tax, l.serviceId, l.discount ?? false]), [
      ['1', '1.00', '1.00', 'FREE', null, false], ['1', '1.00', '1.00', 'TAXABLE', null, false],
      [quantity, '-0.01', total, 'TAXABLE', null, true], [quantity, '-0.01', total, 'FREE', cent.id, true],
    ], `custom and catalogue lines round ${quantity} of a cent away from zero`)
    assert.equal(rev.lines[3].unitCost, '0.00')
    assert.deepEqual([rev.totals.subtotal, rev.totals.gst, rev.totals.total], [subtotal, '0.08', gross])
    roundedQuotes.push(q)
  }

  // Interleave tax pools so global line order, taxable-first allocation and an
  // unlimited first line each produce a different observable allocation.
  const rows = [line('Taxable first', '0.03', 'TAXABLE'), line('Non-taxable first', '0.02'),
    line('Taxable second', '0.03', 'TAXABLE'), line('Non-taxable second', '0.03'),
    line('Taxable third', '0.04', 'TAXABLE'), line('Non-taxable third', '0.04')]
  const a = (...pairs) => pairs.map(([line, amount]) => ({ line, amount }))
  const non = [[2, '0.02'], [4, '0.03'], [6, '0.04']]
  // kind, value, amount, non-taxable, taxable, taxable basis, tax, total, allocation
  const cases = [
    ['amount', '0.01', '0.01', '0.01', '0.00', '0.10', '0.01', '0.19', a([2, '0.01'])],
    ['amount', '0.02', '0.02', '0.02', '0.00', '0.10', '0.01', '0.18', a([2, '0.02'])],
    ['amount', '0.04', '0.04', '0.04', '0.00', '0.10', '0.01', '0.16', a([2, '0.02'], [4, '0.02'])],
    ['amount', '0.09', '0.09', '0.09', '0.00', '0.10', '0.01', '0.11', a(...non)],
    ['amount', '0.10', '0.10', '0.09', '0.01', '0.09', '0.01', '0.10', a(...non, [1, '0.01'])],
    ['amount', '0.12', '0.12', '0.09', '0.03', '0.07', '0.01', '0.08', a(...non, [1, '0.03'])],
    ['amount', '0.15', '0.15', '0.09', '0.06', '0.04', '0.00', '0.04', a(...non, [1, '0.03'], [3, '0.03'])],
    ['amount', '0.19', '0.19', '0.09', '0.10', '0.00', '0.00', '0.00', a(...non, [1, '0.03'], [3, '0.03'], [5, '0.04'])],
    ['percent', '0.01', '0.00', '0.00', '0.00', '0.10', '0.01', '0.20', []],
    ['percent', '2.63', '0.00', '0.00', '0.00', '0.10', '0.01', '0.20', []],
    ['percent', '2.64', '0.01', '0.01', '0.00', '0.10', '0.01', '0.19', a([2, '0.01'])],
    ['percent', '50', '0.10', '0.09', '0.01', '0.09', '0.01', '0.10', a(...non, [1, '0.01'])],
    ['percent', '99.99', '0.19', '0.09', '0.10', '0.00', '0.00', '0.00', a(...non, [1, '0.03'], [3, '0.03'], [5, '0.04'])],
    ['percent', '100.00', '0.19', '0.09', '0.10', '0.00', '0.00', '0.00', a(...non, [1, '0.03'], [3, '0.03'], [5, '0.04'])],
  ]
  let quote
  for (const [kind, value, amount, nonTaxable, taxable, basis, tax, total, allocation] of cases) {
    const reason = 'r'.repeat(100), discount = { kind, value, reason }
    quote = await send(quote ? 'quote.revise' : 'quote.draft', { ...base, ...(quote ? { quoteId: quote.id, version: quote.version } : {}), lines: rows, discount })
    const rev = quote.revisions.at(-1)
    assert.deepEqual(rev.lines.map(l => [l.description, l.quantity, l.unitPrice, l.tax, l.total]), rows.map(l => [l.description, '1', l.unitPrice, l.tax, l.unitPrice]))
    assert.deepEqual(rev.options[0].discount, { kind, value: value === '100.00' ? '100' : value, reason })
    assert.deepEqual(rev.totals.discount, { kind, value: value === '100.00' ? '100' : value, reason, amount, nonTaxable, taxable, lines: allocation }, `${kind} ${value}: exact ordered allocation and per-line caps`)
    assert.deepEqual([rev.totals.subtotal, rev.totals.gst, rev.totals.total], ['0.19', tax, total])
    assert.deepEqual(rev.totals.taxBreakdown, [{ branchId: null, jurisdictionId: 'austin', jurisdiction: 'Austin combined', rate: '8.25', taxable: basis, tax }], 'tax rounds once on the remaining taxable cents')
    assert.equal(rev.approval, null)
  }
  const halfTax = await send('quote.draft', { ...base, lines: [line('First taxable dollar', '1.00', 'TAXABLE'), line('Non-taxable cent', '0.01'), line('Second taxable dollar', '1.00', 'TAXABLE')], discount: { kind: 'amount', value: '0.01', reason: 'Goodwill' } })
  assert.deepEqual([halfTax.revisions[0].totals.subtotal, halfTax.revisions[0].totals.discount.lines, halfTax.revisions[0].totals.taxBreakdown[0].taxable, halfTax.revisions[0].totals.gst, halfTax.revisions[0].totals.total], ['2.01', [{ line: 2, amount: '0.01' }], '2.00', '0.17', '2.17'], '16.5 cents rounds half up once, rather than rounding each taxable line to 8 cents')
  const precise = await send('quote.draft', { ...base, lines: [line('Fixed-price work', '100.00')], discount: { kind: 'percent', value: '12.34', reason: 'Precision' } })
  assert.deepEqual([precise.revisions[0].totals.discount.amount, precise.revisions[0].totals.total], ['12.34', '87.66'], 'both percentage decimal places affect the retained price')
  const zero = await send('quote.draft', { ...base, lines: [line('Included work', '0.00')], discount: { kind: 'percent', value: '100', reason: 'Included' } })
  assert.deepEqual([zero.revisions[0].totals.subtotal, zero.revisions[0].totals.discount.amount, zero.revisions[0].totals.discount.lines, zero.revisions[0].totals.total], ['0.00', '0.00', [], '0.00'])

  const invalid = [
    ...['0', '0.00', '-0.01', '100.01', '101', '1.001', '', 'NaN'].map(value => [{ kind: 'percent', value, reason: 'Goodwill' }, 'INPUT']),
    [{ kind: 'percent', value: 10, reason: 'Goodwill' }, 'INPUT'],
    ...['0', '0.00'].map(value => [{ kind: 'amount', value, reason: 'Goodwill' }, 'INPUT']),
    ...['-0.01', '0.001'].map(value => [{ kind: 'amount', value, reason: 'Goodwill' }, 'MONEY']),
    [{ kind: 'amount', value: '0.20', reason: 'Goodwill' }, 'DISCOUNT'],
    [{ kind: 'amount', value: 0.01, reason: 'Goodwill' }, 'MONEY'],
    ...[undefined, '', ' ', 'r'.repeat(101)].map(reason => [{ kind: 'amount', value: '0.01', reason }, 'INPUT']),
  ]
  for (const [discount, error] of invalid) {
    await refuse('quote.draft', { ...base, lines: rows, discount }, error)
    await refuse('quote.revise', { quoteId: quote.id, version: quote.version, lines: rows, discount }, error)
  }
  for (const [badLine, error] of [[line('Over-precise discount', '-0.001'), 'MONEY'],
    ...['0', '-1', '0.0001'].map(quantity => [line('Invalid discount quantity', '-0.01', 'FREE', quantity), 'QUANTITY'])]) {
    await refuse('quote.draft', { ...base, lines: [...rows, badLine] }, error)
    await refuse('quote.revise', { quoteId: quote.id, version: quote.version, lines: [...rows, badLine] }, error)
  }
  await refuse('quote.revise', { quoteId: quote.id, version: quote.version - 1, lines: rows, discount: { kind: 'amount', value: '0.01', reason: 'Stale' } }, 'STALE')
  const repriced = await send('service.save', { ...discountItem, id: cent.id, version: cent.version, unitPrice: '-0.02' })
  assert.deepEqual([repriced.unitPrice, repriced.unitCost], ['-0.02', '0.00'])
  await refuse('service.save', { ...discountItem, id: cent.id, version: cent.version }, 'STALE')
  for (const role of ['office', 'technician', 'subcontractor', 'viewer']) {
    const person = await h.person(`Synthetic ${role}`, role)
    await refuse('service.save', { ...discountItem, id: cent.id, version: cent.version }, 'FORBIDDEN', person.cookie)
    await refuse('quote.draft', { ...base, lines: rows, discount: { kind: 'amount', value: '0.01', reason: 'Goodwill' } }, 'FORBIDDEN', person.cookie)
    await refuse('quote.revise', { quoteId: quote.id, version: quote.version, lines: rows, discount: { kind: 'amount', value: '0.01', reason: 'Goodwill' } }, 'FORBIDDEN', person.cookie)
  }
  const withdrawn = await h.person('Synthetic withdrawn owner', 'owner')
  const ownDraft = await withdrawn.run('quote.draft', { ...base, lines: rows, discount: { kind: 'amount', value: '0.01', reason: 'Goodwill' } })
  const commandId = id(), revise = { quoteId: ownDraft.id, version: ownDraft.version, lines: rows, discount: { kind: 'amount', value: '0.02', reason: 'Goodwill' } }
  await withdrawn.run('quote.revise', revise, { commandId })
  await h.command('role.set', { operatorId: withdrawn.id, role: 'viewer' })
  const afterWithdrawal = await retained()
  await withdrawn.run('quote.revise', revise, { commandId, error: 'FORBIDDEN' })
  assert.deepEqual(await retained(), afterWithdrawal, 'withdrawn authority cannot replay an earlier successful price change')

  const beforeRestart = await retained()
  for (const expected of [...roundedQuotes, quote, halfTax, precise, zero]) assert.deepEqual(beforeRestart.quotes.find(q => q.id === expected.id), expected, 'public export retains the exact independently checked revisions after a catalogue price change')
  await h.restart()
  assert.deepEqual(await retained(), beforeRestart, 'actual Worker restart preserves every domain record, every revision and all attribution')
  for (const receipt of [receipts.find(r => r.type === 'quote.draft'), receipts.findLast(r => r.type === 'quote.revise')]) {
    assert.deepEqual(await h.command(receipt.type, receipt.payload, { commandId: receipt.commandId }), receipt.result, 'replay returns the original result')
    assert.deepEqual(await retained(), beforeRestart, 'replayed draft or revision creates no duplicate and rewinds no later revision')
    await h.command(receipt.type, { ...receipt.payload, title: 'Changed replay content' }, { commandId: receipt.commandId, error: 'IDEMPOTENCY' })
    assert.deepEqual(await retained(), beforeRestart, 'changed replay content cannot alter the stored revisions')
  }
  const { activity, exported } = await assertTrail(h, ['service.saved', 'quote.drafted', 'quote.revised'])
  for (const { commandId, type, result } of receipts) {
    const events = activity.filter(e => e.commandId === commandId)
    assert.equal(events.length, 1, 'one attributable Activity event per successful pricing command, including replay')
    const event = events[0]
    assert.deepEqual([event.kind, event.subjectId, event.actorId, event.actorName, event.actorRole, event.at], [type === 'service.save' ? 'service.saved' : type === 'quote.draft' ? 'quote.drafted' : 'quote.revised', result.id, owner.id, 'Olivia Owner', 'owner', '2026-11-05T16:00:00.000Z'])
    const entry = exported.timeline.find(e => e.id === event.id)
    assert.deepEqual([entry.command_id, entry.subject_id, entry.actor_id, entry.actor_name, entry.actor_role, entry.at], [commandId, result.id, owner.id, 'Olivia Owner', 'owner', '2026-11-05T16:00:00.000Z'])
  }
}
