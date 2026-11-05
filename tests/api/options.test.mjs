// QUOTE-001 good, better and best options and add-ons through the command,
// state and dashboard doors: the customer's recorded choice is exactly what the
// job carries, and a template takes today's price-book prices unless it fixes
// one, while editing it never changes a quote already made from it.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('QUOTE-001 retained options, choices, approval, template prices and reports survive restart with exact records and refusals', async (t) => {
  const at = '2026-10-20T00:00:00.000Z'
  const h = await installation({ at })
  t.after(() => h.close())
  const b = await business(h)
  const owner = (await (await h.request('/auth/session')).json()).operator
  const dispatcher = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
  const ownerActor = { id: owner.id, name: 'Olivia Owner', role: 'owner' }
  const recorded = []
  const run = async (person, type, payload, kind, subjectId) => {
    const commandId = `synthetic-glove-options-${recorded.length + 1}`
    const result = await (person ? person.run(type, payload, { commandId }) : h.command(type, payload, { commandId }))
    recorded.push({ commandId, kind, subjectId: subjectId ?? result.id, actor: person ? dispatcher : ownerActor })
    return result
  }
  const domain = s => Object.fromEntries(['quotes', 'jobs', 'templates', 'services', 'approvals', 'enquiries', 'events'].map(k => [k, s[k]]))
  const refuse = async (person, type, payload, error) => {
    const before = domain(await h.state())
    await (person ? person.run(type, payload, { error }) : h.command(type, payload, { error }))
    assert.deepEqual(domain(await h.state()), before, `${type} ${error} preserves all retained business records`)
  }
  const filter = await run(null, 'service.save', { code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '18.00', tax: 'GST' }, 'service.saved')
  const uv = await run(null, 'service.save', { code: 'UV-LAMP', name: 'UV coil lamp', kind: 'material', unit: 'each', unitCost: '110.00', unitPrice: '240.00', tax: 'GST' }, 'service.saved')
  const options = [
    { name: 'Good', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] },
    { name: 'Better', lines: [
      { description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id },
      { description: 'Filter 16x20', quantity: '2', unitPrice: '18.00', serviceId: filter.id },
      { description: 'Commissioning label', quantity: '1', unitPrice: '0.05' },
    ] },
    { name: 'Best', lines: [
      { description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id },
      { description: 'Filter 16x20', quantity: '2', unitPrice: '18.00', serviceId: filter.id },
      { description: 'UV coil lamp', quantity: '1', unitPrice: '240.00', serviceId: uv.id },
    ] },
  ]
  const addOns = [
    { name: 'Surge protector', lines: [
      { description: 'Surge protector', quantity: '1', unitPrice: '95.00' },
      { description: 'Surge label', quantity: '1', unitPrice: '0.05' },
    ] },
    { name: 'Duct clean', lines: [{ description: 'Duct clean', quantity: '1', unitPrice: '320.00', tax: 'FREE' }] },
  ]
  // These are independently enumerated expected records, including hand-calculated cents.
  const serviceLine = ['Split system service', '1', '189.00', 'GST', b.service.id, '189.00']
  const filterLine = ['Filter 16x20', '2', '18.00', 'GST', filter.id, '36.00']
  const labelLine = ['Commissioning label', '1', '0.05', 'GST', null, '0.05']
  const uvLine = ['UV coil lamp', '1', '240.00', 'GST', uv.id, '240.00']
  const surgeLines = [
    ['Surge protector', '1', '95.00', 'GST', null, '95.00'],
    ['Surge label', '1', '0.05', 'GST', null, '0.05'],
  ]
  const ductLines = [['Duct clean', '1', '320.00', 'FREE', null, '320.00']]
  const lineValues = lines => lines.map(l => [l.description, l.quantity, l.unitPrice, l.tax, l.serviceId, l.total])
  const bundleValues = bundles => bundles.map(o => [o.id, o.name, lineValues(o.lines), o.totals])
  const expectedOptions = [
    ['option-1', 'Good', [serviceLine], { subtotal: '189.00', gst: '18.90', total: '207.90' }],
    ['option-2', 'Better', [serviceLine, filterLine, labelLine], { subtotal: '225.05', gst: '22.51', total: '247.56' }],
    ['option-3', 'Best', [serviceLine, filterLine, uvLine], { subtotal: '465.00', gst: '46.50', total: '511.50' }],
  ]
  const expectedAddOns = [
    ['addon-1', 'Surge protector', surgeLines, { subtotal: '95.05', gst: '9.51', total: '104.56' }],
    ['addon-2', 'Duct clean', ductLines, { subtotal: '320.00', gst: '0.00', total: '320.00' }],
  ]
  const notes = 'synthetic-glove-1 inspect before work', terms = 'synthetic-glove-2 valid 30 days'
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'synthetic-glove-3 cooling options' })
  const draft = { enquiryId: request.id, title: 'Cooling tune-up', options, addOns, notes, terms }
  const quote = await run(b.dispatcher, 'quote.draft', draft, 'quote.drafted')
  const rev = quote.revisions[0]
  assert.deepEqual(bundleValues(rev.options), expectedOptions)
  assert.deepEqual(bundleValues(rev.addOns), expectedAddOns)
  assert.deepEqual([quote.customerId, quote.siteId, quote.enquiryId, rev.n, rev.notes, rev.terms, rev.templateId, rev.approval, rev.preparedBy, rev.preparedAt],
    [b.customer.id, b.site.id, request.id, 1, notes, terms, null, null, dispatcher, at])
  const answer = { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' }
  await refuse(b.dispatcher, 'quote.accept', { ...answer, choice: { optionId: 'option-2', addOnIds: ['addon-1'] } }, 'NOT_APPROVED')
  await refuse(b.dispatcher, 'job.create', { quoteId: quote.id }, 'NOT_ACCEPTED')
  await refuse(b.dispatcher, 'quote.approve', { quoteId: quote.id, version: quote.version, revision: 2 }, 'REVISION')
  for (const person of [b.office, b.priyaPerson, b.agent]) {
    await refuse(person, 'quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, 'FORBIDDEN')
    await refuse(person, 'quote.accept', answer, 'FORBIDDEN')
    await refuse(person, 'template.save', { name: 'Unauthorized', options }, 'FORBIDDEN')
  }
  const approved = await run(b.dispatcher, 'quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, 'quote.approved')
  assert.deepEqual(approved.revisions[0], { ...rev, approval: { ...dispatcher, at } }, 'approval covers every unchanged option and add-on price')
  const decision = { ...answer, version: approved.version }
  await refuse(b.dispatcher, 'quote.accept', decision, 'CHOICE')
  await refuse(b.dispatcher, 'quote.accept', { ...decision, choice: { optionId: 'option-9', addOnIds: [] } }, 'CHOICE')
  await refuse(b.dispatcher, 'quote.accept', { ...decision, choice: { optionId: 'option-2', addOnIds: ['addon-9'] } }, 'CHOICE')
  await refuse(b.dispatcher, 'quote.accept', { ...decision, revision: 2, choice: { optionId: 'option-2' } }, 'REVISION')
  const accepted = await run(b.dispatcher, 'quote.accept', { ...decision, choice: { optionId: 'option-2', addOnIds: ['addon-1'] } }, 'quote.accepted')
  const chosenLines = [serviceLine, filterLine, labelLine, ...surgeLines]
  // $225.05 + $95.05 = $320.10; one document tax rounds to $32.01, not $32.02.
  const chosenTotals = { subtotal: '320.10', gst: '32.01', total: '352.11' }
  assert.deepEqual(lineValues(accepted.acceptance.lines), chosenLines)
  assert.deepEqual(accepted.acceptance, {
    revision: 1, method: 'phone', customerName: 'Dr Mei Lin', note: '', recordedBy: dispatcher, at,
    soldByTechnicianId: null,
    choice: { optionId: 'option-2', optionName: 'Better', addOnIds: ['addon-1'], addOnNames: ['Surge protector'] },
    lines: accepted.acceptance.lines, discount: null, totals: chosenTotals,
  })
  await refuse(b.office, 'job.create', { quoteId: quote.id }, 'FORBIDDEN')
  await refuse(b.priyaPerson, 'job.create', { quoteId: quote.id }, 'FORBIDDEN')
  const job = await run(b.dispatcher, 'job.create', { quoteId: quote.id }, 'job.created')
  assert.deepEqual([job.quoteId, job.quoteRevision, job.customerId, job.siteId, job.title], [quote.id, 1, b.customer.id, b.site.id, 'Cooling tune-up'])
  assert.deepEqual(lineValues(job.lines), chosenLines)
  assert.deepEqual(job.totals, chosenTotals)
  const retainedJob = (await h.state()).jobs.find(j => j.id === job.id)
  const jobCommand = recorded.at(-1).commandId
  assert.deepEqual(await b.dispatcher.run('job.create', { quoteId: quote.id }, { commandId: jobCommand }), job)
  await refuse(b.dispatcher, 'job.create', { quoteId: quote.id }, 'DUPLICATE')
  const closed = (await h.state()).quotes.find(q => q.id === quote.id)
  await refuse(b.dispatcher, 'quote.accept', { ...decision, version: closed.version, choice: { optionId: 'option-1', addOnIds: [] } }, 'QUOTE_STATE')
  await refuse(b.dispatcher, 'quote.revise', { quoteId: quote.id, version: closed.version, options }, 'QUOTE_CLOSED')
  const today = await (await h.request('/api/glove/dashboard')).json()
  assert.deepEqual([today.date, today.booked.count, today.booked.total, today.booked.quotes.map(q => q.id)], ['2026-10-20', 1, '352.11', [quote.id]])
  const report = await (await h.request('/api/glove/reports/sources')).json()
  assert.deepEqual(report.sources, [{ source: 'phone', requests: 1, contacted: 0, quoted: 1, won: 1, lost: 0, wonValue: '352.11', invoiced: '0.00', conversion: '100.0' }])
  assert.deepEqual(report.total, { requests: 1, won: 1, conversion: '100.0', wonValue: '352.11', invoiced: '0.00' })

  const templateOptions = options.map(o => ({ name: o.name, lines: o.lines.map(l => l.serviceId ? { serviceId: l.serviceId, quantity: l.quantity } : l) }))
  const template = await run(null, 'template.save', { name: 'Cooling tune-up', options: templateOptions, addOns, notes, terms }, 'template.saved')
  assert.deepEqual([template.name, template.notes, template.terms], ['Cooling tune-up', notes, terms])
  assert.deepEqual(template.options.map(o => [o.name, o.lines.map(l => [l.serviceId, l.description, l.quantity, l.unitPrice ?? null, l.tax ?? null])]), [
    ['Good', [[b.service.id, '', '1', null, null]]],
    ['Better', [[b.service.id, '', '1', null, null], [filter.id, '', '2', null, null], [null, 'Commissioning label', '1', '0.05', 'GST']]],
    ['Best', [[b.service.id, '', '1', null, null], [filter.id, '', '2', null, null], [uv.id, '', '1', null, null]]],
  ])
  assert.deepEqual(template.addOns.map(a => [a.name, a.lines.map(l => [l.description, l.quantity, l.unitPrice, l.tax])]), [
    ['Surge protector', [['Surge protector', '1', '95.00', 'GST'], ['Surge label', '1', '0.05', 'GST']]],
    ['Duct clean', [['Duct clean', '1', '320.00', 'FREE']]],
  ])
  const raised = await run(null, 'service.save', { id: filter.id, version: filter.version, code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '21.00', tax: 'GST' }, 'service.saved')
  assert.equal(raised.unitPrice, '21.00')
  const second = await run(b.dispatcher, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Second unit tune-up', templateId: template.id }, 'quote.drafted')
  const expectedRaised = [
    ['option-1', 'Good', [serviceLine], { subtotal: '189.00', gst: '18.90', total: '207.90' }],
    ['option-2', 'Better', [serviceLine, ['Filter 16x20', '2', '21.00', 'GST', filter.id, '42.00'], labelLine], { subtotal: '231.05', gst: '23.11', total: '254.16' }],
    ['option-3', 'Best', [serviceLine, ['Filter 16x20', '2', '21.00', 'GST', filter.id, '42.00'], uvLine], { subtotal: '471.00', gst: '47.10', total: '518.10' }],
  ]
  assert.deepEqual(bundleValues(second.revisions[0].options), expectedRaised)
  assert.deepEqual(bundleValues(second.revisions[0].addOns), expectedAddOns)
  assert.deepEqual([second.revisions[0].notes, second.revisions[0].terms, second.revisions[0].templateId, second.revisions[0].approval], [notes, terms, template.id, null])
  const retainedSecond = (await h.state()).quotes.find(q => q.id === second.id)
  const edited = await run(null, 'template.save', { id: template.id, version: template.version, name: 'Cooling tune-up revised', options: [{ name: 'Only', lines: [{ serviceId: uv.id }] }], notes: 'synthetic-glove-4 new notes', terms: 'synthetic-glove-5 new terms' }, 'template.saved')
  assert.deepEqual([edited.version, edited.name, edited.addOns, edited.notes, edited.terms], [2, 'Cooling tune-up revised', [], 'synthetic-glove-4 new notes', 'synthetic-glove-5 new terms'])
  assert.deepEqual((await h.state()).quotes.find(q => q.id === second.id), retainedSecond, 'template edits never change an existing quote')
  assert.deepEqual((await h.state()).quotes.find(q => q.id === quote.id), closed, 'raising the catalogue price never changes the earlier accepted quote')
  assert.deepEqual((await h.state()).jobs.find(j => j.id === job.id), retainedJob)
  await refuse(null, 'template.save', { id: template.id, version: 1, name: 'Stale', options: templateOptions }, 'STALE')
  assert.deepEqual((await b.priyaPerson.state()).templates, [], 'technicians do not read templates')

  // A separate fixed-price bundle mixes pinned catalogue prices and custom lines.
  const fixed = await run(null, 'template.save', { name: 'Fixed maintenance', options: [{ name: 'Fixed', lines: [
    { serviceId: filter.id, description: 'Fixed filter', quantity: '2', unitPrice: '16.00', tax: 'GST' },
    { description: 'Custom labor', quantity: '1.5', unitPrice: '12.34', tax: 'FREE' },
  ] }], addOns: [{ name: 'Fixed spare', lines: [{ serviceId: filter.id, quantity: '1', unitPrice: '15.00', tax: 'GST' }] }], notes: 'Fixed notes', terms: 'Fixed terms' }, 'template.saved')
  await run(null, 'service.save', { id: filter.id, version: raised.version, code: 'FLT-1620', name: 'Filter 16x20', kind: 'material', unit: 'each', unitCost: '6.00', unitPrice: '24.00', tax: 'GST' }, 'service.saved')
  const pinned = await run(b.dispatcher, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Fixed unit', templateId: fixed.id }, 'quote.drafted')
  assert.deepEqual(bundleValues(pinned.revisions[0].options), [['option-1', 'Fixed', [
    ['Fixed filter', '2', '16.00', 'GST', filter.id, '32.00'],
    ['Custom labor', '1.5', '12.34', 'FREE', null, '18.51'],
  ], { subtotal: '50.51', gst: '3.20', total: '53.71' }]])
  assert.deepEqual(bundleValues(pinned.revisions[0].addOns), [['addon-1', 'Fixed spare', [['Filter 16x20', '1', '15.00', 'GST', filter.id, '15.00']], { subtotal: '15.00', gst: '1.50', total: '16.50' }]])
  assert.deepEqual([pinned.revisions[0].templateId, pinned.revisions[0].notes, pinned.revisions[0].terms], [fixed.id, 'Fixed notes', 'Fixed terms'])

  // Every option count is usable; empty or oversized drafts and unnamed add-ons are refused.
  const base = { customerId: b.customer.id, siteId: b.site.id, title: 'synthetic-glove-6 bounded choices' }
  const boundaryOptions = ['One', 'Two', 'Three', 'Four', 'Five'].map((name, i) => ({ name, lines: [{ description: name, quantity: '1', unitPrice: `${i + 1}.00` }] }))
  const boundaryAddOns = ['0.05', '0.10', '0.20', '0.30', '0.40', '0.50', '0.60', '0.70', '0.80', '0.05'].map((unitPrice, i) => ({ name: `Extra ${i + 1}`, lines: [{ description: `Extra ${i + 1}`, quantity: '1', unitPrice }] }))
  await refuse(b.dispatcher, 'quote.draft', { ...base, options: [] }, 'INPUT')
  await refuse(b.dispatcher, 'quote.draft', { ...base, options: [...boundaryOptions, boundaryOptions[0]] }, 'INPUT')
  await refuse(b.dispatcher, 'quote.draft', { ...base, options: boundaryOptions, addOns: [...boundaryAddOns, boundaryAddOns[0]] }, 'INPUT')
  await refuse(b.dispatcher, 'quote.draft', { ...base, options: boundaryOptions, addOns: [{ ...boundaryAddOns[0], name: '' }] }, 'INPUT')
  const bounds = []
  const optionTotals = [
    { subtotal: '1.00', gst: '0.10', total: '1.10' },
    { subtotal: '2.00', gst: '0.20', total: '2.20' },
    { subtotal: '3.00', gst: '0.30', total: '3.30' },
    { subtotal: '4.00', gst: '0.40', total: '4.40' },
    { subtotal: '5.00', gst: '0.50', total: '5.50' },
  ]
  for (let count = 1; count <= 5; count++) {
    const bounded = await run(b.dispatcher, 'quote.draft', { ...base, options: boundaryOptions.slice(0, count), addOns: count === 5 ? boundaryAddOns : [] }, 'quote.drafted')
    assert.deepEqual(bounded.revisions[0].options.map(o => [o.id, o.name, o.totals]), [
      ['option-1', 'One', optionTotals[0]], ['option-2', 'Two', optionTotals[1]], ['option-3', 'Three', optionTotals[2]], ['option-4', 'Four', optionTotals[3]], ['option-5', 'Five', optionTotals[4]],
    ].slice(0, count))
    bounds.push(bounded)
  }
  const maximum = bounds[4]
  assert.deepEqual(maximum.revisions[0].addOns.map(a => [a.id, a.name, a.totals]), [
    ['addon-1', 'Extra 1', { subtotal: '0.05', gst: '0.01', total: '0.06' }],
    ['addon-2', 'Extra 2', { subtotal: '0.10', gst: '0.01', total: '0.11' }],
    ['addon-3', 'Extra 3', { subtotal: '0.20', gst: '0.02', total: '0.22' }],
    ['addon-4', 'Extra 4', { subtotal: '0.30', gst: '0.03', total: '0.33' }],
    ['addon-5', 'Extra 5', { subtotal: '0.40', gst: '0.04', total: '0.44' }],
    ['addon-6', 'Extra 6', { subtotal: '0.50', gst: '0.05', total: '0.55' }],
    ['addon-7', 'Extra 7', { subtotal: '0.60', gst: '0.06', total: '0.66' }],
    ['addon-8', 'Extra 8', { subtotal: '0.70', gst: '0.07', total: '0.77' }],
    ['addon-9', 'Extra 9', { subtotal: '0.80', gst: '0.08', total: '0.88' }],
    ['addon-10', 'Extra 10', { subtotal: '0.05', gst: '0.01', total: '0.06' }],
  ])
  // A single plain option may be implicit; either multiple options or one add-on needs a choice.
  for (const plain of bounds.slice(0, 2)) {
    const ok = await run(b.dispatcher, 'quote.approve', { quoteId: plain.id, version: plain.version, revision: 1 }, 'quote.approved')
    const reply = { quoteId: plain.id, version: ok.version, revision: 1, method: 'in person', customerName: 'synthetic-glove-7' }
    if (plain.id === bounds[1].id) await refuse(b.dispatcher, 'quote.accept', reply, 'CHOICE')
    const chosen = await run(b.dispatcher, 'quote.accept', { ...reply, ...(plain.id === bounds[1].id ? { choice: { optionId: 'option-2', addOnIds: [] } } : {}) }, 'quote.accepted')
    assert.deepEqual([chosen.acceptance.choice, chosen.acceptance.totals], plain.id === bounds[0].id
      ? [{ optionId: 'option-1', optionName: 'One', addOnIds: [], addOnNames: [] }, optionTotals[0]]
      : [{ optionId: 'option-2', optionName: 'Two', addOnIds: [], addOnNames: [] }, optionTotals[1]])
  }
  const pinnedApproved = await run(null, 'quote.approve', { quoteId: pinned.id, version: pinned.version, revision: 1 }, 'quote.approved')
  await refuse(b.dispatcher, 'quote.accept', { quoteId: pinned.id, version: pinnedApproved.version, revision: 1, method: 'phone', customerName: 'synthetic-glove-8' }, 'CHOICE')

  // Changing an add-on's price creates a fresh revision with no inherited approval.
  const oldApproval = await run(b.dispatcher, 'quote.approve', { quoteId: maximum.id, version: maximum.version, revision: 1 }, 'quote.approved')
  const changedAddOns = boundaryAddOns.map((a, i) => i === 9 ? { ...a, lines: [{ description: 'Extra 10', quantity: '1', unitPrice: '0.15' }] } : a)
  const revised = await run(b.dispatcher, 'quote.revise', { quoteId: maximum.id, version: oldApproval.version, options: boundaryOptions, addOns: changedAddOns }, 'quote.revised')
  assert.deepEqual(revised.revisions[0], oldApproval.revisions[0])
  assert.equal(revised.status, 'draft')
  assert.equal(revised.revisions[1].n, 2)
  assert.equal(revised.revisions[1].approval, null)
  assert.deepEqual(revised.revisions[1].options, maximum.revisions[0].options)
  assert.deepEqual(revised.revisions[1].addOns.slice(0, 9), maximum.revisions[0].addOns.slice(0, 9))
  assert.deepEqual(bundleValues(revised.revisions[1].addOns.slice(9)), [['addon-10', 'Extra 10', [['Extra 10', '1', '0.15', 'GST', null, '0.15']], { subtotal: '0.15', gst: '0.02', total: '0.17' }]])
  await refuse(b.dispatcher, 'quote.approve', { quoteId: maximum.id, version: revised.version, revision: 1 }, 'REVISION')
  await refuse(b.dispatcher, 'quote.approve', { quoteId: maximum.id, version: oldApproval.version, revision: 2 }, 'STALE')
  const revisedReply = { quoteId: maximum.id, version: revised.version, revision: 2, method: 'email reply', customerName: 'synthetic-glove-9', choice: { optionId: 'option-5', addOnIds: ['addon-10', 'addon-1'] } }
  await refuse(b.dispatcher, 'quote.accept', revisedReply, 'NOT_APPROVED')
  const newApproval = await run(null, 'quote.approve', { quoteId: maximum.id, version: revised.version, revision: 2 }, 'quote.approved')
  assert.deepEqual(newApproval.revisions, [oldApproval.revisions[0], { ...revised.revisions[1], approval: { ...ownerActor, at } }])
  const multi = await run(b.dispatcher, 'quote.accept', { ...revisedReply, version: newApproval.version }, 'quote.accepted')
  const multiLines = [['Five', '1', '5.00', 'GST', null, '5.00'], ['Extra 10', '1', '0.15', 'GST', null, '0.15'], ['Extra 1', '1', '0.05', 'GST', null, '0.05']]
  assert.deepEqual(lineValues(multi.acceptance.lines), multiLines, 'the option is followed by the add-ons in the recorded choice order')
  assert.deepEqual(multi.acceptance.totals, { subtotal: '5.20', gst: '0.52', total: '5.72' })
  assert.deepEqual(multi.acceptance.choice, { optionId: 'option-5', optionName: 'Five', addOnIds: ['addon-10', 'addon-1'], addOnNames: ['Extra 10', 'Extra 1'] })
  const multiJob = await run(b.dispatcher, 'job.create', { quoteId: maximum.id }, 'job.created')
  assert.deepEqual(lineValues(multiJob.lines), multiLines)
  assert.deepEqual([multiJob.quoteRevision, multiJob.totals], [2, { subtotal: '5.20', gst: '0.52', total: '5.72' }])
  const decisions = (await h.state()).approvals.filter(a => a.subjectId === maximum.id).sort((a, b) => a.revision - b.revision)
  assert.deepEqual(decisions.map(a => [a.subjectKind, a.revision, a.preparedBy, a.approvedBy, a.decision, a.createdAt]),
    [['quote', 1, dispatcher, dispatcher, 'approved', at], ['quote', 2, dispatcher, ownerActor, 'approved', at]])

  // Persisted full records, decisions and every copied line survive an actual Worker restart.
  const retained = domain(await h.state())
  await h.restart()
  assert.deepEqual(domain(await h.state()), retained)
  const restarted = await h.state()
  assert.deepEqual(bundleValues(restarted.quotes.find(q => q.id === second.id).revisions[0].options), expectedRaised)
  assert.deepEqual(bundleValues(restarted.quotes.find(q => q.id === second.id).revisions[0].addOns), expectedAddOns)
  assert.deepEqual(lineValues(restarted.jobs.find(j => j.id === job.id).lines), chosenLines)
  const retainedCopy = restarted.quotes.find(q => q.id === second.id).revisions[0]
  assert.deepEqual([retainedCopy.notes, retainedCopy.terms, retainedCopy.templateId], [notes, terms, template.id])
  const restartedToday = await (await h.request('/api/glove/dashboard')).json()
  assert.deepEqual([restartedToday.booked.count, restartedToday.booked.total], [4, '361.13'])
  const restartedSources = await (await h.request('/api/glove/reports/sources')).json()
  assert.deepEqual(restartedSources.sources, [{ source: 'phone', requests: 1, contacted: 0, quoted: 1, won: 1, lost: 0, wonValue: '352.11', invoiced: '0.00', conversion: '100.0' }])
  assert.deepEqual(domain(await h.state()), retained, 'report reads after restart do not change retained business records')
  const activityResponse = await h.request('/api/glove/activity')
  assert.equal(activityResponse.status, 200)
  const activity = (await activityResponse.json()).events
  const exportResponse = await h.request('/api/glove/export')
  assert.equal(exportResponse.status, 200)
  const exported = await exportResponse.json()
  for (const expected of recorded) {
    const events = activity.filter(e => e.commandId === expected.commandId && e.kind === expected.kind)
    assert.equal(events.length, 1, `${expected.kind} is retained once in Activity`)
    const event = events[0]
    assert.deepEqual([event.subjectId, event.actorId, event.actorName, event.actorRole, event.at], [expected.subjectId, expected.actor.id, expected.actor.name, expected.actor.role, at])
    assert.ok(event.summary)
    const kept = exported.timeline.find(e => e.id === event.id)
    assert.ok(kept)
    assert.deepEqual([kept.command_id, kept.kind, kept.subject_id, kept.actor_id, kept.actor_name, kept.actor_role, kept.at, kept.summary], [expected.commandId, expected.kind, expected.subjectId, expected.actor.id, expected.actor.name, expected.actor.role, at, event.summary])
  }
  const { followupState: closedFollowup, ...exportClosed } = closed
  const { followupState: secondFollowup, ...exportSecond } = retainedSecond
  assert.equal(closedFollowup, 'Stopped: customer answered')
  assert.equal(secondFollowup, 'No quote follow-ups scheduled')
  assert.deepEqual(exported.quotes.find(q => q.id === quote.id), exportClosed)
  assert.deepEqual(exported.quotes.find(q => q.id === second.id), exportSecond)
  assert.deepEqual(exported.jobs.find(j => j.id === job.id), retainedJob)
  assert.deepEqual(exported.templates.find(x => x.id === template.id), edited)
})

test('QUOTE-006, QUOTE-016, QUOTE-017, QUOTE-018 owner-bound field pricing drafts two options from an assigned assessment, retains evidence once, and withdraws access immediately', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'synthetic-glove-1 assessment' })
  const { job, visit } = await b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.priya.id, date: '2026-10-28', start: '09:00', end: '10:00' })
  const payload = { visitId: visit.id, title: 'Replacement options', options: [
    { name: 'Repair', lines: [{ serviceId: b.service.id, quantity: '1' }] },
    { name: 'Replace', lines: [{ serviceId: b.refrigerant.id, quantity: '2', unitPrice: '120.00', tax: 'FREE', description: 'Untrusted override', unitCost: '0.00' }] },
  ] }
  const read = async (person = b.priyaPerson, id = visit.id) => h.request(`/api/glove/field-quotes?visitId=${id}`, { as: person.cookie })
  assert.equal((await read()).status, 403)
  await b.priyaPerson.run('fieldQuote.draft', payload, { error: 'FORBIDDEN' })
  await b.dispatcher.run('fieldQuote.configure', { technicianId: b.priya.id, version: b.priya.version, enabled: true, minPercent: 90, maxPercent: 110 }, { error: 'FORBIDDEN' })
  await h.command('fieldQuote.configure', { technicianId: b.priya.id, version: b.priya.version, enabled: true, minPercent: 120, maxPercent: 90 }, { error: 'INPUT' })
  const configured = await h.command('fieldQuote.configure', { technicianId: b.priya.id, version: b.priya.version, enabled: true, minPercent: 90, maxPercent: 110 })
  await h.command('fieldQuote.configure', { technicianId: b.tom.id, version: b.tom.version, enabled: true, minPercent: 90, maxPercent: 110 })
  assert.equal((await read(b.tomPerson)).status, 403, 'a price grant never authorizes another technician’s visit')
  await b.tomPerson.run('fieldQuote.draft', payload, { error: 'FORBIDDEN' })
  let catalog = await (await read()).json()
  assert.ok(catalog.services.every(x => x.unitCost === undefined && x.markupPercent === undefined && x.components === undefined), 'selling prices do not disclose margins or task costs')
  assert.equal(catalog.services.find(x => x.id === b.service.id).unitPrice, '189.00')
  assert.ok((await b.priyaPerson.state()).services.every(x => x.unitPrice === undefined && x.unitCost === undefined), 'the offline day remains unpriced')

  const at = '2026-10-28T00:00:00Z'
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'note', text: 'synthetic-glove-2 findings' })
  const photo = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'photo', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }, caption: 'synthetic-glove-3 equipment' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at, summary: 'Survey complete', signoff: { absentReason: 'Customer away' } })
  const commandId = 'synthetic-glove-field-quote-1'
  const drafted = await b.priyaPerson.run('fieldQuote.draft', payload, { commandId })
  assert.deepEqual([drafted.status, drafted.outsideRange, drafted.deskApprovalRequired], ['draft', true, true])
  assert.deepEqual(await b.priyaPerson.run('fieldQuote.draft', payload, { commandId }), drafted)
  catalog = await (await read()).json()
  assert.equal(catalog.quotes.length, 1)
  const q = catalog.quotes[0], rev = q.revisions[0]
  assert.deepEqual(rev.options.map(o => o.name), ['Repair', 'Replace'])
  assert.deepEqual([rev.options[1].lines[0].description, rev.options[1].lines[0].tax, rev.options[1].lines[0].unitCost], [b.refrigerant.name, b.refrigerant.tax, undefined])
  assert.deepEqual([q.fieldQuote.jobId, q.assessment.notes, q.assessment.photos[0].fileId], [job.id, ['synthetic-glove-2 findings'], photo.file.fileId])
  assert.equal(rev.approval, null)
  assert.equal(q.acceptance, null, 'a field draft never manufactures customer consent or a signature')
  await b.priyaPerson.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 }, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('quote.accept', { quoteId: q.id, version: q.version, revision: 1, method: 'signed', customerName: 'Customer' }, { error: 'FORBIDDEN' })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
  assert.equal(approved.status, 'approved', 'normal desk approval remains available')
  await b.priyaPerson.run('fieldQuote.draft', { ...payload, options: [{ name: 'Custom', lines: [{ description: 'No price-book item', unitPrice: '1.00', quantity: '1' }] }] }, { error: 'NOT_FOUND' })
  await b.priyaPerson.run('fieldQuote.draft', { ...payload, options: [{ ...payload.options[0], discount: { kind: 'percent', value: '10', reason: 'Unapproved' } }] }, { error: 'INPUT' })

  const call = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'synthetic-glove-4 service call', lines: [{ serviceId: b.service.id, description: b.service.name, quantity: '1', unitPrice: b.service.unitPrice }] })
  const callVisit = await b.dispatcher.run('visit.book', { jobId: call.id, technicianId: b.priya.id, date: '2026-10-29', start: '09:00', end: '10:00' })
  const bounded = { visitId: callVisit.id, title: 'Additional work', options: [
    { name: 'Lower bound', lines: [{ serviceId: b.service.id, quantity: '1', unitPrice: '170.10' }] },
    { name: 'Upper bound', lines: [{ serviceId: b.service.id, quantity: '1', unitPrice: '207.90' }] },
  ] }
  const inRange = await b.priyaPerson.run('fieldQuote.draft', bounded)
  assert.deepEqual([inRange.outsideRange, inRange.status, inRange.deskApprovalRequired], [false, 'draft', true])
  const accepted = await b.dispatcher.run('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: b.customer.name, choice: { optionId: 'option-1', addOnIds: [] } })
  assert.equal(accepted.acceptance.soldByTechnicianId, b.priya.id, 'field sales retain the originating seller for commission')
  const declineApproved = await b.dispatcher.run('quote.approve', { quoteId: inRange.id, version: inRange.version, revision: 1 })
  await b.dispatcher.run('quote.decline', { quoteId: inRange.id, version: declineApproved.version, revision: 1, method: 'phone', customerName: b.customer.name })
  await b.priyaPerson.run('fieldQuote.draft', bounded)
  const reportPath = `/api/glove/reports/technicians.json?from=2026-01-01&to=2027-12-31&technicianId=${b.priya.id}`
  const report = await (await h.request(reportPath)).json()
  const reported = report.technicians[0]
  assert.deepEqual([reported.fieldQuotesAccepted, reported.fieldQuotesAnswered, reported.fieldQuoteCloseRate], [1, 2, '50.0'], 'unanswered drafts never dilute close rate')
  const csv = await (await h.request(reportPath.replace('.json?', '.csv?'))).text()
  assert.ok(csv.includes('field quotes accepted,field quotes answered,field quote close rate'))
  assert.ok(csv.includes(',1,2,50.0'))
  const emptyReport = await (await h.request(reportPath.replace('from=2026-01-01&to=2027-12-31', 'from=2026-01-01&to=2026-01-02'))).json()
  assert.deepEqual([emptyReport.technicians[0].fieldQuotesAnswered, emptyReport.technicians[0].fieldQuoteCloseRate], [0, null])
  // A field grant is never a desk price approval or customer signature.
  const unsigned = await b.priyaPerson.run('fieldQuote.draft', { ...bounded, changeOrder: true })
  await h.command('fieldQuote.apply', { quoteId: unsigned.id, version: unsigned.version, jobVersion: call.version }, { error: 'NOT_ACCEPTED' })
  let unsignedQuote = await h.command('quote.approve', { quoteId: unsigned.id, version: unsigned.version, revision: 1 })
  unsignedQuote = await h.command('quote.accept', { quoteId: unsigned.id, version: unsignedQuote.version, revision: 1, method: 'signed', customerName: 'synthetic-glove-5', choice: { optionId: 'option-1', addOnIds: [] } })
  await h.command('fieldQuote.apply', { quoteId: unsigned.id, version: unsignedQuote.version, jobVersion: call.version }, { error: 'CONSENT_GATE' })
  let change = await b.priyaPerson.run('fieldQuote.draft', { ...bounded, changeOrder: true })
  await h.command('quote.link', { quoteId: change.id, version: change.version }, { error: 'NOT_APPROVED' })
  change = await h.command('quote.approve', { quoteId: change.id, version: change.version, revision: 1 })
  await h.command('quote.consent', { version: (await h.state()).business[0].version, text: 'synthetic-glove-6 owner-accepted electronic signature disclosure for this integration flow.', accept: true })
  const link = await h.command('quote.link', { quoteId: change.id, version: change.version })
  const post = body => h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body })
  const choice = { optionId: 'option-2', addOnIds: [] }
  const selection = await (await post({ action: 'choose', choice })).json()
  const signature = await post({ action: 'approve', name: 'synthetic-glove-7', capacity: 'Property owner', choice, documentHash: selection.documentHash, selectionHash: selection.selection.hash, consent: { version: selection.disclosure.version, hash: selection.disclosure.hash, affirmed: true }, signature: { kind: 'typed', text: 'synthetic-glove-7' } })
  assert.equal(signature.status, 200, await signature.clone().text())
  change = (await h.state()).quotes.find(q => q.id === change.id)
  const apply = { quoteId: change.id, version: change.version, jobVersion: call.version }
  let unchanged = (await h.state()).jobs.find(j => j.id === call.id)
  assert.deepEqual(unchanged.lines, call.lines, 'signing alone never amends the source job')
  assert.equal(unchanged.version, call.version)
  assert.equal((await h.state()).invoices.some(i => i.jobId === call.id), false, 'signing alone never prepares an invoice')
  assert.equal((await h.state()).events.some(e => e.kind === 'fieldQuote.applied' && e.subjectId === call.id), false)
  const scopedOwner = await h.person('Scoped Owner', 'owner')
  await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: 'main' })
  await scopedOwner.run('fieldQuote.apply', apply, { error: 'FORBIDDEN' })
  await b.priyaPerson.run('fieldQuote.apply', apply, { error: 'FORBIDDEN' })
  await b.dispatcher.run('fieldQuote.apply', apply, { error: 'FORBIDDEN' })
  unchanged = (await h.state()).jobs.find(j => j.id === call.id)
  assert.deepEqual(unchanged.lines, call.lines, 'refused callers cannot amend the source job')
  assert.equal(unchanged.version, call.version)
  await h.command('job.create', { quoteId: change.id }, { error: 'FIELD_CHANGE_ORDER' })
  await h.command('fieldQuote.apply', { ...apply, jobVersion: call.version + 1 }, { error: 'STALE' })
  const applyId = 'synthetic-glove-change-order-1'
  const applied = await h.command('fieldQuote.apply', apply, { commandId: applyId })
  assert.deepEqual(await h.command('fieldQuote.apply', apply, { commandId: applyId }), applied)
  let amended = (await h.state()).jobs.find(j => j.id === call.id)
  assert.deepEqual(amended.lines.map(l => l.unitPrice), ['189.00', '207.90'], 'only the signed second option is appended')
  assert.equal(amended.totals.total, '436.59')
  assert.equal(amended.changeOrders[0].signatureHash, change.acceptance.signing.signedCopy.sha256)
  const appliedQuote = (await h.state()).quotes.find(q => q.id === change.id)
  await h.command('fieldQuote.apply', { ...apply, version: appliedQuote.version, jobVersion: amended.version }, { error: 'DUPLICATE' })
  const moved = await b.dispatcher.run('visit.change', { visitId: callVisit.id, version: callVisit.version, technicianId: b.tom.id, date: '2026-10-29', start: '09:00', end: '10:00', reason: 'Assignment changed' })
  assert.equal(moved.technicianId, b.tom.id)
  assert.equal((await read(b.priyaPerson, callVisit.id)).status, 403, 'assignment changes immediately close the price door')
  await b.priyaPerson.run('fieldQuote.draft', bounded, { error: 'FORBIDDEN' })

  // The ordinary completion and invoice door carry the exact approved addition.
  const deviceTime = '2026-10-29T00:00:00Z'
  await b.tomPerson.run('visit.arrive', { visitId: callVisit.id, deviceTime })
  for (const item of amended.checklist.filter(i => i.required)) await b.tomPerson.run('visit.capture', { visitId: callVisit.id, deviceTime, kind: 'checklist', itemId: item.id, result: 'done' })
  await b.tomPerson.run('visit.complete', { visitId: callVisit.id, deviceTime, summary: 'synthetic-glove-8 amended work complete', signoff: { absentReason: 'Customer away' } })
  const invoice = await b.office.run('invoice.prepare', { jobId: call.id })
  assert.deepEqual(invoice.revisions[0].lines.map(l => l.unitPrice), ['189.00', '207.90'])
  assert.equal(invoice.revisions[0].totals.total, '436.59')
  assert.equal(invoice.revisions[0].approval, null, 'change-order application grants no invoice approval')
  assert.equal((await h.state()).jobs.filter(j => j.id === call.id).length, 1)

  const events = (await h.state()).events
  assert.equal(events.filter(e => e.kind === 'fieldQuote.drafted' && e.subjectId === q.id).length, 1)
  const exported = await (await h.request('/api/glove/export')).json()
  assert.equal(exported.quotes.find(x => x.id === q.id).fieldQuote.technicianId, b.priya.id)
  assert.ok(exported.timeline.some(e => e.kind === 'fieldQuote.configured'))
  assert.ok(exported.timeline.some(e => e.kind === 'fieldQuote.drafted'))
  assert.equal(exported.timeline.filter(e => e.kind === 'fieldQuote.applied' && e.job_id === call.id).length, 1)
  assert.equal(exported.jobs.find(j => j.id === call.id).changeOrders.length, 1)
  const assessmentJob = await h.command('job.create', { quoteId: q.id })
  assert.equal(assessmentJob.quoteId, q.id, 'an ordinary assessment field quote still creates its own job')
  assert.deepEqual(assessmentJob.lines.map(l => l.unitPrice), ['189.00'])
  await h.command('fieldQuote.configure', { technicianId: b.priya.id, version: configured.version, enabled: false, minPercent: 90, maxPercent: 110 })
  assert.equal((await read()).status, 403, 'WITHDRAWAL: the very next request after withdrawal refuses selling prices')
  await b.priyaPerson.run('fieldQuote.draft', payload, { error: 'FORBIDDEN' })
  assert.deepEqual(await b.priyaPerson.run('fieldQuote.draft', payload, { commandId }), drafted, 'recovery reveals only its original receipt, never prices')
  assert.equal((await h.state()).quotes.filter(x => x.fieldQuote?.visitId === visit.id).length, 1)
  let tech = (await h.state()).technicians.find(x => x.id === b.priya.id)
  const enabledAgain = await h.command('fieldQuote.configure', { technicianId: tech.id, version: tech.version, enabled: true, minPercent: 90, maxPercent: 110 })
  const replacement = await h.person('Replacement Technician', 'technician')
  await h.command('technician.save', { id: tech.id, version: enabledAgain.version, name: tech.name, operatorId: replacement.id })
  assert.equal((await read(replacement)).status, 403, 'a relinked sign-in needs its own fresh owner grant')
  assert.equal((await read()).status, 403, 'the prior sign-in loses access after relinking')

})
