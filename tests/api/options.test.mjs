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
