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
  assert.deepEqual([qbo.CustomerRef, qbo.CurrencyRef, qbo.TxnTaxDetail], [{ value: '58' }, { value: 'USD' }, { TxnTaxCodeRef: { value: '7' }, TotalTax: 26.81 }])
  assert.deepEqual(csv.trimEnd().split('\r\n').slice(1).map(row => row.split(',')), [
    ['Condenser parts', '1', '400.00', 'Austin combined', 'Austin combined', '8.25', '325.00', '26.81', '351.81'],
    ['Install labor', '1', '300.00', 'Tax exempt', '', '', '', '', ''],
    ['First-time customer', '1', '-50.00', 'Tax exempt', '', '', '', '', ''],
    ['Discount: Military (50%) on non-taxable lines', '1', '-250.00', 'Tax exempt', '', '', '', '', ''],
    ['Discount: Military (50%) on taxable lines', '1', '-75.00', 'Austin combined', '', '', '', '', ''],
  ].map(([description, quantity, unitPrice, tax, ...summary]) => [
    'Rosa Diaz', '', '', invoice.number, job.number, '11/05/2026', '11/19/2026', description, quantity, unitPrice, '200', tax, 'USD', 'Main business', ...summary,
  ]), 'the 50 percent example retains every column and exactly two document-discount rows')
  await refuseUnchanged(h, 'invoice.export', {}, 'NOTHING_TO_EXPORT')
  const period = 'from=2026-01-01&to=2027-12-31'
  const revenue = await h.request(`/api/glove/reports/revenue.json?${period}`).then(r => r.json())
  assert.equal(revenue.total.revenue, '325.00')
  const tax = await h.request(`/api/glove/reports/tax.json?${period}`).then(r => r.json())
  assert.ok(JSON.stringify(tax).includes('26.81') && JSON.stringify(tax).includes('325.00'), JSON.stringify(tax))
  await qualifyOwnerPricing(h, customer, site)
  await qualifyDiscountTaxPools(h, customer, site, { lines })
  await qualifyDiscountInheritance(h, customer, site, { lines, job, invoice, batch, csv, office })
  await qualifyRoleDiscountLimits(t)
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
  const restored = await h.state()
  for (const expected of [...roundedQuotes, quote, halfTax, precise, zero]) {
    assert.deepEqual(restored.quotes.find(q => q.id === expected.id).revisions, expected.revisions, 'the authenticated state door reads the same exact retained revisions after restart')
  }
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


async function domainRecords(h) {
  const response = await h.request('/api/glove/export')
  assert.equal(response.status, 200)
  const { exportedAt: _time, ...records } = await response.json()
  return records
}

async function refuseUnchanged(h, type, payload, error, as) {
  const before = await domainRecords(h)
  await h.command(type, payload, { error, ...(as ? { as } : {}) })
  assert.deepEqual(await domainRecords(h), before, type + ': refusal preserves records and attribution')
}

async function qualifyDiscountTaxPools(h, customer, site, { lines }) {
  const draft = (rows, extra = {}) => h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Synthetic tax pool qualification', lines: rows, ...extra })
  const negative = (unitPrice, tax) => ({ description: 'Synthetic pool discount', quantity: '1', unitPrice, tax })
  // A positive document total cannot offset a negative individual tax pool.
  for (const bad of [negative('-400.01', 'TAXABLE'), negative('-250.01', 'FREE')]) {
    await refuseUnchanged(h, 'quote.draft', { customerId: customer.id, siteId: site.id, title: 'Synthetic pool refusal', lines: [...lines, bad] }, 'DISCOUNT')
  }
  const taxableZero = await draft([...lines, negative('-400.00', 'TAXABLE')])
  assert.deepEqual([taxableZero.revisions[0].totals.subtotal, taxableZero.revisions[0].totals.gst, taxableZero.revisions[0].totals.total], ['250.00', '0.00', '250.00'])
  const nonTaxableZero = await draft([...lines, negative('-250.00', 'FREE')])
  assert.deepEqual([nonTaxableZero.revisions[0].totals.subtotal, nonTaxableZero.revisions[0].totals.gst, nonTaxableZero.revisions[0].totals.total], ['400.00', '33.00', '433.00'])
  await refuseUnchanged(h, 'quote.revise', { quoteId: taxableZero.id, version: taxableZero.version, lines: [...lines, negative('-400.01', 'TAXABLE')] }, 'DISCOUNT')
  await refuseUnchanged(h, 'quote.revise', { quoteId: nonTaxableZero.id, version: nonTaxableZero.version, lines: [...lines, negative('-250.01', 'FREE')] }, 'DISCOUNT')

  const original = (await h.state()).business[0]
  await h.command('business.save', { ...original, taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: true }] } })
  // With taxable labor there is no positive non-taxable amount for this line.
  await refuseUnchanged(h, 'quote.draft', { customerId: customer.id, siteId: site.id, title: 'Synthetic labor pool refusal', lines }, 'DISCOUNT')
  const discount = { kind: 'percent', value: '50', reason: 'Synthetic qualification' }
  const taxable = await draft([...lines.slice(0, 2), negative('-50.00', 'TAXABLE')], { discount })
  assert.deepEqual([taxable.revisions[0].totals.discount.nonTaxable, taxable.revisions[0].totals.discount.taxable, taxable.revisions[0].totals.taxBreakdown[0].taxable, taxable.revisions[0].totals.gst, taxable.revisions[0].totals.total], ['0.00', '325.00', '325.00', '26.81', '351.81'])
  assert.deepEqual(taxable.revisions[0].totals.discount.lines, [{ line: 1, amount: '325.00' }])

  const freePart = await h.command('service.save', { code: 'SYNTHETIC-FREE', name: 'Synthetic non-taxable part', kind: 'material', unitPrice: '400.00', tax: 'FREE' })
  const flagged = await draft([{ ...lines[0], serviceId: freePart.id }, lines[1], lines[2]], { discount })
  assert.deepEqual(flagged.revisions[0].lines.map(l => l.tax), ['FREE', 'TAXABLE', 'FREE'], 'catalogue flags select the pools before document allocation')
  assert.deepEqual([flagged.revisions[0].totals.discount.nonTaxable, flagged.revisions[0].totals.discount.taxable, flagged.revisions[0].totals.taxBreakdown[0].taxable, flagged.revisions[0].totals.gst, flagged.revisions[0].totals.total], ['325.00', '0.00', '300.00', '24.75', '349.75'])

  let exempt = await h.command('customer.save', { name: 'Synthetic exempt customer', taxExemption: { certificateNumber: 'synthetic-glove-1', expires: '2026-11-05' } })
  const exemptSite = await h.command('site.save', { customerId: exempt.id, address: '20 Service St Austin TX 78704', zip: '78704' })
  const exemptPayload = { customerId: exempt.id, siteId: exemptSite.id, title: 'Synthetic exempt discount', lines, discount }
  await refuseUnchanged(h, 'quote.draft', exemptPayload, 'DISCOUNT')
  exempt = await h.command('customer.certificate', { customerId: exempt.id, version: exempt.version, file: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH0cAAAAASUVORK5CYII=' } })
  const exemptQuote = await h.command('quote.draft', exemptPayload)
  const totals = exemptQuote.revisions[0].totals
  assert.deepEqual([totals.taxContext.exempt, totals.subtotal, totals.discount.nonTaxable, totals.discount.taxable, totals.taxBreakdown[0].taxable, totals.gst, totals.total], [true, '650.00', '325.00', '0.00', '0.00', '0.00', '325.00'], 'a current certificate makes all discount lines and charges non-taxable')
  await h.command('customer.save', { ...exempt, taxExemption: { certificateNumber: 'synthetic-glove-1', expires: '2026-11-04' } })
  await refuseUnchanged(h, 'quote.draft', exemptPayload, 'DISCOUNT')
  assert.deepEqual((await h.state()).quotes.find(q => q.id === exemptQuote.id).revisions[0].totals, totals, 'expiry does not reprice the retained exemption')
  await h.command('business.save', { ...(await h.state()).business[0], taxSettings: original.taxSettings })
  const retained = await domainRecords(h)
  await h.restart()
  assert.deepEqual(await domainRecords(h), retained, 'tax pool and exemption snapshots survive a real Worker restart')
}

async function qualifyDiscountInheritance(h, customer, site, { lines, job, invoice, batch, csv, office }) {
  const owner = (await h.state()).actor
  const base = { customerId: customer.id, siteId: site.id, title: 'Synthetic chosen discount' }
  const percent = { kind: 'percent', value: '10', reason: 'Synthetic percent' }
  const fixed = { kind: 'amount', value: '50.00', reason: 'Synthetic fixed' }
  const addOnLines = [{ description: 'Synthetic extra labor', quantity: '1', unitPrice: '100.00', tax: 'FREE' }, { description: 'Synthetic add-on discount', quantity: '1', unitPrice: '-20.00', tax: 'FREE' }]
  const options = [
    { name: 'Synthetic other option', lines: [{ description: 'Synthetic other work', quantity: '1', unitPrice: '100.00', tax: 'FREE' }], discount: { kind: 'percent', value: '90', reason: 'Synthetic other' } },
    { name: 'Synthetic percent option', lines, discount: percent },
    { name: 'Synthetic fixed option', lines, discount: fixed },
  ]
  const payload = { ...base, options, addOns: [{ name: 'Synthetic extra', lines: addOnLines }] }
  const draft = await h.command('quote.draft', payload)
  assert.deepEqual(draft.revisions[0].options.map(o => [o.discount, o.totals.subtotal, o.totals.discount.amount, o.totals.gst, o.totals.total]), [
    [{ kind: 'percent', value: '90', reason: 'Synthetic other' }, '100.00', '90.00', '0.00', '10.00'],
    [percent, '650.00', '65.00', '33.00', '618.00'],
    [fixed, '650.00', '50.00', '33.00', '633.00'],
  ], 'every option keeps its own independent discount and total')
  assert.deepEqual([draft.revisions[0].addOns[0].lines[1].total, draft.revisions[0].addOns[0].totals], ['-20.00', { subtotal: '80.00', gst: '0.00', total: '80.00', currency: 'USD', taxBreakdown: [{ branchId: null, jurisdictionId: 'austin', jurisdiction: 'Austin combined', rate: '8.25', taxable: '0.00', tax: '0.00' }], taxContext: draft.revisions[0].totals.taxContext }])
  // An add-on cannot silently accept a document discount that it never applies.
  for (const type of ['quote.draft', 'quote.revise']) {
    await refuseUnchanged(h, type, { ...payload, ...(type === 'quote.revise' ? { quoteId: draft.id, version: draft.version } : {}), addOns: [{ ...payload.addOns[0], discount: percent }] }, 'INPUT')
  }
  const technicianPerson = await h.person('Synthetic Discount Technician', 'technician')
  const technician = await h.command('technician.save', { name: 'Synthetic Discount Technician', operatorId: technicianPerson.id })
  const readJson = async path => { const response = await h.request(path); assert.equal(response.status, 200); return response.json() }
  const period = 'from=2026-11-05&to=2026-11-05'
  const keptExports = [{ id: batch.id, csv }]
  const documents = []
  const receipts = []
  const send = async (type, payload, as) => {
    const commandId = id(), result = await h.command(type, payload, { commandId, ...(as ? { as } : {}) })
    receipts.push({ type, payload, commandId, result, as })
    return result
  }
  async function checkDocuments(inv, expected, expectedRows, expectedQbo, expectedNumber = inv.number, expectedReference) {
    const response = await h.request('/api/glove/invoices/' + inv.id + '/quickbooks.json?customerRef=synthetic-glove-2&itemRef=synthetic-glove-3&taxCodeRef=synthetic-glove-4')
    assert.equal(response.status, 200)
    const qbo = await response.json()
    assert.deepEqual([qbo.CustomerRef, qbo.DocNumber, qbo.ApplyTaxAfterDiscount, qbo.TxnTaxDetail], [{ value: 'synthetic-glove-2' }, expectedNumber, true, { TxnTaxCodeRef: { value: 'synthetic-glove-4' }, TotalTax: expected.tax }])
    assert.deepEqual(qbo.Line.map(l => l.DetailType === 'DiscountLineDetail' ? [l.DetailType, l.Amount, l.Description, l.DiscountLineDetail] : [l.DetailType, l.Amount, l.SalesItemLineDetail.Qty, l.SalesItemLineDetail.UnitPrice, l.SalesItemLineDetail.TaxCodeRef.value, l.SalesItemLineDetail.ItemRef]), expectedQbo)
    const exported = await send('invoice.export', {})
    const downloaded = await h.request('/api/glove/exports/' + exported.id + '.csv')
    assert.equal(downloaded.status, 200)
    const bytes = await downloaded.text()
    const table = bytes.trimEnd().split('\r\n').map(row => row.split(','))
    assert.equal(table[0].length, 19)
    assert.deepEqual(table.slice(1), expectedRows.map(([description, quantity, unitPrice, tax], i) => [
      'Rosa Diaz', '', '', expectedNumber, expectedReference, '11/05/2026', '11/19/2026', description, quantity, unitPrice, '200',
      tax === 'NON' ? 'Tax exempt' : 'Austin combined', 'USD', 'Main business',
      ...(i === 0 ? ['Austin combined', '8.25', expected.basis, expected.tax.toFixed(2), expected.total] : ['', '', '', '', '']),
    ]))
    assert.deepEqual(exported.invoices.map(i => [i.invoiceId, i.revision, i.invoiceNumber, i.total]), [[inv.id, inv.revisions.at(-1).n, expectedNumber, expected.total]])
    keptExports.push({ id: exported.id, csv: bytes })
    return exported
  }
  const sales = (amount, tax) => ['SalesItemLineDetail', amount, 1, amount, tax, { value: 'synthetic-glove-3' }]
  const originalRows = [['Condenser parts', '1', '400.00', 'TAX'], ['Install labor', '1', '300.00', 'NON'], ['First-time customer', '1', '-50.00', 'NON']]
  // Both named examples reach native jobs, completed visits and approved invoices.
  for (const [index, optionId, addOnIds, d, subtotal, amount, nonTaxable, total, net] of [
    [0, null, [], percent, '650.00', '65.00', '65.00', '618.00', '585.00'],
    [1, 'option-2', ['addon-1'], percent, '730.00', '73.00', '73.00', '690.00', '657.00'],
    [2, 'option-3', ['addon-1'], fixed, '730.00', '50.00', '50.00', '713.00', '680.00'],
  ]) {
    let quote = index === 1 ? draft : await send('quote.draft', optionId ? payload : { ...base, lines, discount: d })
    quote = await send('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    quote = await send('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Rosa Diaz', ...(optionId ? { choice: { optionId, addOnIds } } : {}) })
    assert.deepEqual([quote.acceptance.discount, quote.acceptance.totals.subtotal, quote.acceptance.totals.discount.amount, quote.acceptance.totals.discount.nonTaxable, quote.acceptance.totals.discount.taxable, quote.acceptance.totals.gst, quote.acceptance.totals.total], [d, subtotal, amount, nonTaxable, '0.00', '33.00', total])
    assert.deepEqual(quote.acceptance.lines.map(l => [l.description, l.quantity, l.unitPrice, l.total]), [
      ['Condenser parts', '1', '400.00', '400.00'], ['Install labor', '1', '300.00', '300.00'], ['First-time customer', '1', '-50.00', '-50.00'],
      ...(optionId ? [['Synthetic extra labor', '1', '100.00', '100.00'], ['Synthetic add-on discount', '1', '-20.00', '-20.00']] : []),
    ])
    const nextJob = await send('job.create', { quoteId: quote.id })
    assert.deepEqual([nextJob.lines, nextJob.discount, nextJob.totals], [quote.acceptance.lines, d, quote.acceptance.totals])
    assert.equal((await readJson('/api/glove/jobs/' + nextJob.id + '/cost')).costing.revenue, net, 'costing uses the accepted net price before an invoice exists')
    const visit = await send('visit.book', { jobId: nextJob.id, technicianId: technician.id, date: '2026-11-05', start: String(11 + index).padStart(2, '0') + ':00', end: String(12 + index).padStart(2, '0') + ':00' })
    await send('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt }, technicianPerson.cookie)
    await send('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Synthetic work completed', signoff: { absentReason: 'Synthetic customer unavailable' } }, technicianPerson.cookie)
    let inv = await send('invoice.prepare', { jobId: nextJob.id }, office.cookie)
    assert.deepEqual([inv.revisions[0].discount, inv.revisions[0].totals], [d, quote.acceptance.totals])
    inv = await send('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
    assert.equal((await readJson('/api/glove/jobs/' + nextJob.id + '/cost')).costing.revenue, net)
    const suffix = d.kind === 'percent' ? d.value + '%' : '$' + d.value
    await checkDocuments(inv, { basis: '400.00', tax: 33, total }, [
      ...originalRows, ...(optionId ? [['Synthetic extra labor', '1', '100.00', 'NON'], ['Synthetic add-on discount', '1', '-20.00', 'NON']] : []),
      ['Discount: ' + d.reason + ' (' + suffix + ') on non-taxable lines', '1', '-' + amount, 'NON'],
    ], [
      sales(400, 'TAX'), sales(300, 'NON'), sales(-50, 'NON'), ...(optionId ? [sales(100, 'NON'), sales(-20, 'NON')] : []),
      ['DiscountLineDetail', Number(amount), 'Discount: ' + d.reason + ' (non-taxable $' + nonTaxable + ', taxable $0.00)', d.kind === 'percent' ? { PercentBased: true, DiscountPercent: 10 } : { PercentBased: false }],
    ], inv.number, nextJob.number)
    documents.push({ quote, job: nextJob, invoiceId: inv.id })
  }
  assert.deepEqual((await readJson('/api/glove/reports/revenue.json?' + period)).total, { invoices: 4, revenue: '2247.00' })
  assert.equal((await readJson('/api/glove/jobs/' + job.id + '/cost')).costing.revenue, '325.00')

  let inv = (await h.state()).invoices.find(i => i.id === invoice.id)
  const firstRevision = structuredClone(inv.revisions[0])
  const correctionPayload = { invoiceId: inv.id, version: inv.version, reason: 'Synthetic retained discount', lines }
  inv = await send('invoice.correct', correctionPayload, office.cookie)
  assert.deepEqual([inv.revisions[1].discount, inv.revisions[1].totals], [{ kind: 'percent', value: '50', reason: 'Military' }, firstRevision.totals], 'a correction carries the preceding discount without granting a new one')
  assert.deepEqual(inv.revisions[0], firstRevision)
  const changed = [lines[0], { ...lines[1], unitPrice: '320.00' }, lines[2]]
  inv = await send('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic revised labor', lines: changed })
  assert.deepEqual([inv.revisions[2].discount, inv.revisions[2].totals.subtotal, inv.revisions[2].totals.discount.amount, inv.revisions[2].totals.discount.nonTaxable, inv.revisions[2].totals.discount.taxable, inv.revisions[2].totals.gst, inv.revisions[2].totals.total], [{ kind: 'percent', value: '50', reason: 'Military' }, '670.00', '335.00', '270.00', '65.00', '27.64', '362.64'])
  assert.equal((await readJson('/api/glove/jobs/' + job.id + '/cost')).costing.revenue, '325.00', 'unapproved edits cannot replace approved revenue')
  await refuseUnchanged(h, 'invoice.revise', { invoiceId: inv.id, version: inv.version - 1, reason: 'Synthetic stale', lines: changed }, 'STALE')
  await refuseUnchanged(h, 'invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, 'REVISION')
  await refuseUnchanged(h, 'invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic wrong state', lines: changed }, 'INVOICE_STATE')
  const viewer = await h.person('Synthetic Discount Viewer', 'viewer')
  await refuseUnchanged(h, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic unauthorized', lines: changed }, 'FORBIDDEN', viewer.cookie)
  const replacement = { kind: 'amount', value: '25.00', reason: 'Synthetic replacement' }
  inv = await send('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic explicit replacement', lines: changed, discount: replacement })
  assert.deepEqual([inv.revisions[3].discount, inv.revisions[3].totals.discount.amount, inv.revisions[3].totals.total], [replacement, '25.00', '678.00'])
  inv = await send('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 4 })
  assert.equal((await readJson('/api/glove/jobs/' + job.id + '/cost')).costing.revenue, '645.00')
  await checkDocuments(inv, { basis: '400.00', tax: 33, total: '678.00' }, [
    originalRows[0], ['Install labor', '1', '320.00', 'NON'], originalRows[2],
    ['Discount: Synthetic replacement ($25.00) on non-taxable lines', '1', '-25.00', 'NON'],
  ], [sales(400, 'TAX'), sales(320, 'NON'), sales(-50, 'NON'), ['DiscountLineDetail', 25, 'Discount: Synthetic replacement (non-taxable $25.00, taxable $0.00)', { PercentBased: false }]], inv.number + '-R4', job.number + ' corrects ' + inv.number + ' rev 1 (' + batch.number + '): Synthetic explicit replacement')
  inv = (await h.state()).invoices.find(i => i.id === inv.id)
  assert.deepEqual(inv.revisions[0], firstRevision, 'a separately approved and exported correction never rewrites the original')
  inv = await send('invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic fixed inheritance', lines: changed })
  assert.deepEqual([inv.revisions[4].discount, inv.revisions[4].totals.total], [replacement, '678.00'])
  inv = await send('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Synthetic explicit removal', lines: changed, discount: null })
  assert.deepEqual([inv.revisions[5].discount, inv.revisions[5].totals.discount, inv.revisions[5].totals.total], [null, undefined, '703.00'])
  assert.deepEqual((await readJson('/api/glove/reports/revenue.json?' + period)).total, { invoices: 4, revenue: '2567.00' }, 'only the latest approved revision contributes net revenue')
  assert.equal((await readJson('/api/glove/reports/costing?' + period)).total.revenue, '2567.00')

  const beforeRestart = await domainRecords(h)
  await h.restart()
  assert.deepEqual(await domainRecords(h), beforeRestart, 'options, accepted amounts, every invoice revision and export survive restart')
  const state = await h.state()
  for (const doc of documents) {
    const retainedQuote = state.quotes.find(q => q.id === doc.quote.id)
    assert.deepEqual([retainedQuote.revisions, retainedQuote.acceptance, retainedQuote.jobId], [doc.quote.revisions, doc.quote.acceptance, doc.job.id])
    assert.deepEqual(state.jobs.find(j => j.id === doc.job.id).totals, doc.job.totals)
    assert.deepEqual(state.invoices.find(i => i.id === doc.invoiceId).revisions[0].totals, doc.job.totals)
  }
  for (const kept of keptExports) assert.equal(await h.request('/api/glove/exports/' + kept.id + '.csv').then(r => r.text()), kept.csv, 'each original accounting download remains byte-identical')
  const replay = receipts.find(r => r.type === 'invoice.correct')
  assert.deepEqual(await h.command(replay.type, replay.payload, { commandId: replay.commandId, as: replay.as }), replay.result)
  assert.deepEqual(await domainRecords(h), beforeRestart, 'a replay cannot add a correction or rewind subsequent revisions')
  const { activity, exported } = await assertTrail(h, ['quote.accepted', 'invoice.prepared', 'invoice.revised', 'invoice.corrected', 'invoice.approved', 'invoice.exported'])
  for (const receipt of receipts) {
    const events = activity.filter(e => e.commandId === receipt.commandId)
    assert.ok(events.length > 0, receipt.type + ' retains its attributable effect')
    if (receipt.type.startsWith('invoice.') || receipt.type.startsWith('quote.')) assert.equal(events.length, 1)
    const actor = receipt.as === office.cookie ? [office.id, office.name, 'office'] : receipt.as === technicianPerson.cookie ? [technicianPerson.id, technicianPerson.name, 'technician'] : [owner.id, owner.name, 'owner']
    assert.deepEqual([events[0].actorId, events[0].actorName, events[0].actorRole, events[0].at], [...actor, '2026-11-05T16:00:00.000Z'])
    for (const event of events) {
      const entry = exported.timeline.find(e => e.id === event.id)
      assert.deepEqual([entry.command_id, entry.actor_id, entry.actor_name, entry.actor_role, entry.at], [receipt.commandId, ...actor, '2026-11-05T16:00:00.000Z'])
    }
  }
}

// QUOTE-019: a separate native installation qualifies the role-limit slice
// inside the existing money journey, retaining its single test registration.
async function qualifyRoleDiscountLimits(t) {
  const h = await installation({ at: '2026-11-30T16:00:00.000Z' })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Glove service', timezone: 'America/Chicago' })
  const owner = (await h.state()).actor
  const custom = await h.command('role.save', { name: 'Price preparer', permissions: ['quote.draft', 'quote.revise', 'job.create', 'invoice.prepare', 'invoice.revise'] })
  const customRole = 'custom:' + custom.id
  const dispatcher = await h.person('Synthetic Dispatcher', 'dispatcher')
  const office = await h.person('Synthetic Office', 'office')
  const agent = await h.person('Synthetic Agent', 'agent')
  const specialist = await h.person('Synthetic Specialist', customRole)
  const unlisted = await h.person('Synthetic Unlisted', 'dispatcher')
  const issued = await h.command('token.issue', { name: 'Synthetic Agent preparation', role: 'agent' })
  const token = {
    id: 'token:' + issued.id, name: 'Synthetic Agent preparation (integration token)',
    async run(type, payload, opts = {}) {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: 'Bearer ' + issued.token }, body: { commandId: opts.commandId ?? id(), type, payload } })
      const body = await response.json()
      assert.equal(body.ok, !opts.error, JSON.stringify(body))
      if (opts.error) { assert.equal(body.error.code, opts.error, JSON.stringify(body)); return body.error }
      assert.equal(response.status, 200)
      return body.result
    },
  }
  const retained = async () => {
    const s = await h.state()
    return Object.fromEntries(['business', 'quotes', 'jobs', 'invoices', 'approvals', 'events', 'exports', 'captures'].map(key => [key, s[key]]))
  }
  const receipts = [], audit = []
  const send = async (actor, type, payload, kind) => {
    const commandId = id(), run = actor?.run ?? h.command
    const result = await run(type, payload, { commandId })
    receipts.push({ actor, type, payload, commandId, result })
    if (kind) audit.push({ kind, commandId, subjectId: result.id, actorId: actor?.id ?? owner.id, actorName: actor?.name ?? owner.name })
    return result
  }
  const refuse = async (actor, type, payload, error = 'DISCOUNT_LIMIT') => {
    const before = await retained(), run = actor?.run ?? h.command, commandId = id()
    await run(type, payload, { commandId, error })
    assert.deepEqual(await retained(), before, type + ' refusal preserves business, prices, approvals and Activity')
    await run(type, payload, { commandId, error })
    assert.deepEqual(await retained(), before, type + ' refused replay adds nothing')
  }
  const limits = { dispatcher: '12.34', office: '20', agent: '25', [customRole]: '33.33' }
  const saveLimits = async value => {
    const b = (await h.state()).business[0]
    return send(null, 'business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: value }, 'business.saved')
  }
  const saved = await saveLimits(limits)
  assert.deepEqual(saved.discountLimits, limits)
  for (const value of [{ unknown: '10' }, { owner: '10' }, { office: '101' }, { office: '100.01' }, { office: '1.001' }, { office: '-0.01' }]) {
    const b = (await h.state()).business[0]
    await refuse(null, 'business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: value }, 'INPUT')
  }
  await refuse(null, 'business.save', { name: saved.name, timezone: saved.timezone, version: saved.version - 1, discountLimits: {} }, 'STALE')
  for (const actor of [dispatcher, office, agent, specialist, token]) {
    await refuse(actor, 'business.save', { name: saved.name, timezone: saved.timezone, version: saved.version, discountLimits: {} }, 'FORBIDDEN')
  }
  const customer = await h.command('customer.save', { name: 'Synthetic Glove customer' })
  const site = await h.command('site.save', { customerId: customer.id, address: '10 Service Street' })
  const base = { customerId: customer.id, siteId: site.id, title: 'Synthetic limited repair' }
  const line = price => ({ description: price.startsWith('-') ? 'Goodwill' : 'Repair', quantity: '1', unitPrice: price, tax: 'FREE' })
  const rows = [line('100.00')]
  const pricing = (kind, amount) => kind === 'line'
    ? { lines: [...rows, line('-' + amount)] }
    : { lines: rows, discount: { kind, value: amount, reason: 'Synthetic goodwill' } }
  const centOver = amount => (Number(amount) + 0.01).toFixed(2)
  const atTotal = (revision, amount) => assert.equal(revision.totals.total, (100 - Number(amount)).toFixed(2))
  const quotes = []
  for (const [actor, limit] of [[dispatcher, '12.34'], [specialist, '33.33'], [agent, '25'], [token, '25'], [null, '100']]) {
    for (const kind of ['percent', 'amount', 'line']) {
      const q = await send(actor, 'quote.draft', { ...base, ...pricing(kind, limit) }, 'quote.drafted')
      atTotal(q.revisions[0], limit)
      const revised = await send(actor, 'quote.revise', { quoteId: q.id, version: q.version, ...pricing(kind, limit) }, 'quote.revised')
      atTotal(revised.revisions.at(-1), limit)
      quotes.push(revised)
      if (actor) {
        await refuse(actor, 'quote.draft', { ...base, ...pricing(kind, centOver(limit)) })
        await refuse(actor, 'quote.revise', { quoteId: q.id, version: revised.version, ...pricing(kind, centOver(limit)) })
      }
    }
    // Every separately priced option and add-on is checked, including the last.
    const options = Array.from({ length: 5 }, (_, i) => ({ name: 'Choice ' + i, ...pricing(i % 2 ? 'amount' : 'percent', limit) }))
    const addOns = Array.from({ length: 10 }, (_, i) => ({ name: 'Extra ' + i, ...pricing('line', limit) }))
    const q = await send(actor, 'quote.draft', { ...base, options, addOns }, 'quote.drafted')
    const revised = await send(actor, 'quote.revise', { quoteId: q.id, version: q.version, options, addOns }, 'quote.revised')
    for (const rev of revised.revisions) for (const item of [...rev.options, ...rev.addOns]) atTotal(item, limit)
    quotes.push(revised)
    if (actor) {
      for (const [collection, count] of [['options', 5], ['addOns', 10]]) {
        for (let index = 0; index < count; index++) {
          const bad = structuredClone({ options, addOns })
          bad[collection][index] = { name: 'Over limit', ...pricing(collection === 'addOns' ? 'line' : index % 2 ? 'amount' : 'percent', centOver(limit)) }
          await refuse(actor, 'quote.draft', { ...base, ...bad })
          await refuse(actor, 'quote.revise', { quoteId: q.id, version: revised.version, ...bad })
        }
      }
      const mixed = { lines: [...rows, line('-1.00')], discount: { kind: 'amount', value: (Number(limit) - 1).toFixed(2), reason: 'Combined' } }
      const combined = await send(actor, 'quote.draft', { ...base, ...mixed })
      atTotal(combined.revisions[0], limit)
      await refuse(actor, 'quote.revise', { quoteId: combined.id, version: combined.version, ...mixed, discount: { ...mixed.discount, value: (Number(limit) - 0.99).toFixed(2) } })
    }
  }

  const techPerson = await h.person('Synthetic Technician', 'technician')
  const tech = await h.command('technician.save', { name: techPerson.name, operatorId: techPerson.id })
  let day = 0
  const complete = async job => {
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-' + String(++day).padStart(2, '0'), start: '09:00', end: '10:00' })
    await techPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await techPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repair complete', signoff: { absentReason: 'Synthetic customer away' } })
  }
  const invoices = []
  for (const [actor, limit] of [[office, '20'], [agent, '25'], [token, '25'], [null, '100']]) {
    for (const kind of ['percent', 'amount', 'line']) {
      // An undiscounted service call has no carried exemption.
      const job = await h.command('job.create', { ...base, lines: rows })
      await complete(job)
      if (actor) await refuse(actor, 'invoice.prepare', { jobId: job.id, ...pricing(kind, centOver(limit)) })
      const inv = await send(actor, 'invoice.prepare', { jobId: job.id, ...pricing(kind, limit) }, 'invoice.prepared')
      atTotal(inv.revisions[0], limit)
      if (actor) await refuse(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Extra goodwill', ...pricing(kind, centOver(limit)) })
      const revised = await send(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Reviewed goodwill', ...pricing(kind, limit) }, 'invoice.revised')
      atTotal(revised.revisions.at(-1), limit)
      invoices.push(revised)
    }
  }
  // Corrections are separately authorized and use the same discount boundary.
  for (const [actor, limit] of [[office, '20'], [null, '100']]) for (const [index, kind] of ['percent', 'amount', 'line'].entries()) {
    const inv = invoices[(actor ? 0 : 9) + index]
    await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: inv.revisions.length })
  }
  await h.command('invoice.export', {})
  for (const [actor, limit] of [[office, '20'], [null, '100']]) for (const [index, kind] of ['percent', 'amount', 'line'].entries()) {
    const old = invoices[(actor ? 0 : 9) + index], inv = (await h.state()).invoices.find(x => x.id === old.id)
    if (actor) await refuse(actor, 'invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Too much', ...pricing(kind, centOver(limit)) })
    const corrected = await send(actor, 'invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Reviewed correction', ...pricing(kind, limit) }, 'invoice.corrected')
    atTotal(corrected.revisions.at(-1), limit)
  }
  for (const [actor, limit] of [[dispatcher, '12.34'], [office, '20'], [specialist, '33.33'], [null, '100']]) {
    const job = await send(actor, 'job.create', { ...base, ...pricing('line', limit) }, 'job.created')
    assert.equal(job.totals.total, (100 - Number(limit)).toFixed(2))
    if (actor) await refuse(actor, 'job.create', { ...base, ...pricing('line', centOver(limit)) })
  }

  // A human's approval of Agent preparation is that person's own act.
  const prepared = quotes.find(q => q.revisions.at(-1).preparedBy.id === agent.id)
  await refuse(agent, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'FORBIDDEN')
  await refuse(token, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'FORBIDDEN')
  const approved = await send(dispatcher, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'quote.approved')
  assert.deepEqual(approved.revisions.at(-1).preparedBy, { id: agent.id, name: agent.name, role: 'agent' })
  assert.equal(approved.revisions.at(-1).approval.id, dispatcher.id)
  const approval = (await h.state()).approvals.find(x => x.subjectId === prepared.id)
  assert.equal(approval.preparedBy.id, agent.id)
  assert.equal(approval.approvedBy.id, dispatcher.id)
  const accepted = await h.command('quote.accept', { quoteId: prepared.id, version: approved.version, revision: prepared.revisions.length, method: 'phone', customerName: customer.name })
  await saveLimits({})
  // Neither the Dispatcher nor Office is listed now. Exact accepted price carries.
  const carried = await send(unlisted, 'job.create', { quoteId: accepted.id }, 'job.created')
  assert.deepEqual(carried.totals, accepted.acceptance.totals)
  await complete(carried)
  const carriedInvoice = await send(office, 'invoice.prepare', { jobId: carried.id }, 'invoice.prepared')
  atTotal(carriedInvoice.revisions[0], '25')
  await refuse(office, 'invoice.revise', { invoiceId: carriedInvoice.id, version: carriedInvoice.version, reason: 'Increase', ...pricing('amount', '25.01') })
  const carriedRevision = await send(office, 'invoice.revise', { invoiceId: carriedInvoice.id, version: carriedInvoice.version, reason: 'Carry accepted discount', ...pricing('percent', '25') }, 'invoice.revised')
  atTotal(carriedRevision.revisions.at(-1), '25')
  await h.command('invoice.approve', { invoiceId: carriedRevision.id, version: carriedRevision.version, revision: carriedRevision.revisions.length })
  await h.command('invoice.export', {})
  const exported = (await h.state()).invoices.find(x => x.id === carriedInvoice.id)
  await refuse(office, 'invoice.correct', { invoiceId: exported.id, version: exported.version, reason: 'Increase', ...pricing('amount', '25.01') })
  const correction = await send(office, 'invoice.correct', { invoiceId: exported.id, version: exported.version, reason: 'Carry accepted discount', ...pricing('percent', '25') }, 'invoice.corrected')
  atTotal(correction.revisions.at(-1), '25')
  await refuse(unlisted, 'quote.draft', { ...base, ...pricing('amount', '0.01') })
  await refuse(unlisted, 'job.create', { ...base, ...pricing('line', '0.01') })
  const noDiscount = await send(unlisted, 'quote.draft', { ...base, lines: rows })
  assert.equal(noDiscount.revisions[0].totals.total, '100.00')
  await saveLimits({ dispatcher: '12.34' })
  const current = await send(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '12.34') })
  await saveLimits({ dispatcher: '12.33' })
  await refuse(dispatcher, 'quote.revise', { quoteId: current.id, version: current.version, ...pricing('amount', '12.34') })
  const lowered = await send(dispatcher, 'quote.revise', { quoteId: current.id, version: current.version, ...pricing('amount', '12.33') })
  await saveLimits({})
  await refuse(dispatcher, 'quote.revise', { quoteId: current.id, version: lowered.version, ...pricing('amount', '0.01') })

  // PLAN-002 member pricing remains automatic even with no role limit.
  const service = await h.command('service.save', { code: 'SYNTHETIC-MEMBER', name: 'Synthetic inspection', kind: 'service', unitPrice: '100.00', tax: 'FREE' })
  const plan = await h.command('plan.save', { name: 'Synthetic club', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: false, formIds: [] })
  await h.command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: '2026-11-01' })
  const member = await send(dispatcher, 'quote.draft', { ...base, lines: rows })
  atTotal(member.revisions[0], '15')
  const memberRevision = await send(dispatcher, 'quote.revise', { quoteId: member.id, version: member.version, lines: rows })
  atTotal(memberRevision.revisions.at(-1), '15')
  const memberCall = await send(office, 'job.create', { ...base, lines: rows })
  assert.equal(memberCall.totals.total, '85.00')
  await refuse(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '0.01') })

  // Both valid endpoints are effective configuration, including a zero grant.
  await saveLimits({ office: '0', dispatcher: '100.00' })
  const full = await send(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '100.00') })
  atTotal(full.revisions[0], '100')
  const officeDraft = (await h.state()).invoices.find(x => x.id === invoices[0].id)
  await refuse(office, 'invoice.revise', { invoiceId: officeDraft.id, version: officeDraft.version, reason: 'Zero limit', ...pricing('amount', '0.01') })

  const beforeRestart = await retained()
  for (const receipt of receipts) {
    await (receipt.actor?.run ?? h.command)(receipt.type, receipt.payload, { commandId: receipt.commandId })
  }
  assert.deepEqual(await retained(), beforeRestart, 'successful command replay adds no documents, versions or Activity')
  await h.restart()
  assert.deepEqual(await retained(), beforeRestart, 'actual Worker restart retains all exact prices and refusals')
  for (const receipt of receipts) {
    await (receipt.actor?.run ?? h.command)(receipt.type, receipt.payload, { commandId: receipt.commandId })
  }
  assert.deepEqual(await retained(), beforeRestart, 'replay after restart has identical effects')
  // Fresh commands after actual restart still use the exact role boundary.
  await saveLimits(limits)
  for (const [actor, limit] of [[dispatcher, '12.34'], [specialist, '33.33'], [agent, '25'], [token, '25']]) {
    const draft = await send(actor, 'quote.draft', { ...base, ...pricing('amount', limit) }, 'quote.drafted')
    atTotal(draft.revisions[0], limit)
    await refuse(actor, 'quote.revise', { quoteId: draft.id, version: draft.version, ...pricing('amount', centOver(limit)) })
    const revised = await send(actor, 'quote.revise', { quoteId: draft.id, version: draft.version, ...pricing('amount', limit) }, 'quote.revised')
    atTotal(revised.revisions.at(-1), limit)
  }
  for (const [actor, limit, index] of [[office, '20', 0], [agent, '25', 3], [token, '25', 6]]) {
    const inv = (await h.state()).invoices.find(x => x.id === invoices[index].id)
    await refuse(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'After restart', ...pricing('amount', centOver(limit)) })
    const revised = await send(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'After restart', ...pricing('amount', limit) }, 'invoice.revised')
    atTotal(revised.revisions.at(-1), limit)
  }
  await saveLimits({ dispatcher: '12.33', office: '19.99', agent: '24.99', [customRole]: '33.32' })
  for (const [actor, limit] of [[dispatcher, '12.34'], [specialist, '33.33'], [agent, '25'], [token, '25']]) {
    await refuse(actor, 'quote.draft', { ...base, ...pricing('amount', limit) })
  }
  const officeCurrent = (await h.state()).invoices.find(x => x.id === invoices[0].id)
  await refuse(office, 'invoice.revise', { invoiceId: officeCurrent.id, version: officeCurrent.version, reason: 'Lowered limit', ...pricing('amount', '20') })
  await saveLimits({})
  for (const actor of [dispatcher, specialist, agent, token]) {
    await refuse(actor, 'quote.draft', { ...base, ...pricing('amount', '0.01') })
  }
  await refuse(office, 'invoice.revise', { invoiceId: officeCurrent.id, version: officeCurrent.version, reason: 'Removed limit', ...pricing('amount', '0.01') })
  const activity = { events: [] }
  let before = ''
  do {
    const page = await h.request('/api/glove/activity' + (before ? '?before=' + before : '')).then(r => r.json())
    activity.events.push(...page.events)
    before = page.next
  } while (before)
  const exportedBusiness = await h.request('/api/glove/export').then(r => r.json())
  for (const expected of audit) {
    const event = activity.events.find(x => x.commandId === expected.commandId && x.kind === expected.kind)
    assert.ok(event, expected.kind + ' is visible in Activity')
    assert.deepEqual([event.actorId, event.actorName, event.subjectId], [expected.actorId, expected.actorName, expected.subjectId])
    const kept = exportedBusiness.timeline.find(x => x.id === event.id)
    assert.ok(kept, expected.kind + ' is exported')
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.command_id], [expected.actorId, expected.actorName, expected.commandId])
  }
  // A revoked Agent credential cannot replay its earlier discounted revision.
  const oldTokenCommand = receipts.find(x => x.actor === token && x.type === 'quote.revise')
  await h.command('token.revoke', { tokenId: issued.id })
  await refuse(token, oldTokenCommand.type, oldTokenCommand.payload, 'AUTH')
  await h.restart()
  await refuse(token, oldTokenCommand.type, oldTokenCommand.payload, 'AUTH')
}
