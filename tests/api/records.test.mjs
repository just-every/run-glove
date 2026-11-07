// The record trail a business relies on later: a corrected invoice never goes
// to the accounting system under its original number twice, and every job keeps
// its whole timeline however busy the business gets.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, completedJob, assertTrail, branchActivityHistory } from './harness.mjs'

test('a correction revised before approval still exports as its own numbered row', async (t) => {
  const at = '2026-10-21T00:00:00.000Z'
  const h = await installation({ at })
  t.after(() => h.close())
  const b = await business(h)
  const office = { id: b.office.id, name: 'Olu Office', role: 'office' }
  const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  const facts = []
  const run = async (type, payload, at, summary, revision) => {
    await clock(at)
    const commandId = randomUUID(), result = await b.office.run(type, payload, { commandId })
    facts.push({ commandId, type, payload, result, at, summary, revision })
    return result
  }
  const snapshot = async () => {
    const s = await h.state()
    return { invoices: s.invoices, exports: s.exports, jobs: s.jobs, approvals: s.approvals, events: s.events }
  }
  const refused = async (person, type, payload, error, opts = {}) => {
    const before = await snapshot()
    await person.run(type, payload, { ...opts, error })
    assert.deepEqual(await snapshot(), before, `${type}: ${error} changes no invoice, job, approval, export or Activity`)
  }
  let quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Service with materials', lines: [
    { serviceId: b.service.id, description: 'Split system service', quantity: '1', unitPrice: '189.00' },
    { description: 'Custom access work', quantity: '2', unitPrice: '12.50', tax: 'FREE' },
  ] })
  quote = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  quote = await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:00:00Z' })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:10:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:20:00Z', kind: 'material', serviceId: b.refrigerant.id, quantity: '0.5' })
  const materialPayload = { visitId: visit.id, deviceTime: '2026-10-19T22:25:00Z', kind: 'material', description: 'Insulation tape, 25 mm', quantity: '2', unit: 'roll' }
  const materialCommand = randomUUID(), material = await b.priyaPerson.run('visit.capture', materialPayload, { commandId: materialCommand })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-19T23:00:00Z', summary: 'Serviced and insulated', signoff: { absentReason: 'Customer out' } })
  const beforePrepare = await snapshot()
  const missing = await b.office.run('invoice.prepare', { jobId: job.id }, { error: 'UNPRICED_MATERIALS' })
  assert.deepEqual(missing.details.materials, [{ captureId: material.id, description: 'Insulation tape, 25 mm', quantity: '2' }])
  assert.deepEqual(await snapshot(), beforePrepare, 'automatic preparation with an unpriced material creates no draft and consumes no invoice number')
  await refused(b.dispatcher, 'invoice.prepare', { jobId: job.id }, 'FORBIDDEN')
  await refused(b.priyaPerson, 'invoice.prepare', { jobId: job.id }, 'FORBIDDEN')

  // These prices and cents are independent expectations, rather than values copied from a projection.
  const pricedLines = [
    { description: 'Split system service', quantity: '1', unitPrice: '189.00', tax: 'GST', serviceId: b.service.id, total: '189.00', customerDescription: '', images: [] },
    { description: 'Custom access work', quantity: '2', unitPrice: '12.50', tax: 'FREE', serviceId: null, total: '25.00', customerDescription: '', images: [] },
    { description: 'R32 refrigerant (used on site)', quantity: '0.5', unitPrice: '95.00', tax: 'GST', serviceId: b.refrigerant.id, total: '47.50', customerDescription: '', images: [] },
    { description: 'Insulation tape, 25 mm', quantity: '2', unitPrice: '4.25', tax: 'FREE', serviceId: null, total: '8.50', customerDescription: '', images: [] },
  ]
  let inv = await run('invoice.prepare', { jobId: job.id, lines: pricedLines }, '2026-10-21T00:10:00.000Z', 'INV-0001 prepared by Olu Office (office): $293.65 incl. tax', 1)
  const invoiceId = inv.id
  assert.deepEqual([inv.number, inv.status, inv.jobId, inv.customerId], ['INV-0001', 'draft', job.id, b.customer.id])
  assert.deepEqual(inv.revisions, [{ n: 1, lines: pricedLines, discount: null, totals: { subtotal: '270.00', gst: '23.65', total: '293.65' }, preparedBy: office, preparedAt: '2026-10-21T00:10:00.000Z', approval: null, export: null }])
  await refused(b.office, 'invoice.approve', { invoiceId, version: inv.version, revision: 2 }, 'REVISION')
  await refused(b.office, 'invoice.export', {}, 'NOTHING_TO_EXPORT')
  inv = await run('invoice.approve', { invoiceId, version: inv.version, revision: 1 }, '2026-10-21T00:11:00.000Z', 'INV-0001 revision 1 approved by Olu Office', 1)
  assert.deepEqual(inv.revisions[0].approval, { ...office, at: '2026-10-21T00:11:00.000Z' })
  assert.deepEqual(inv.dates, { issuedOn: '2026-10-21', dueOn: '2026-11-04', termsDays: 14, basis: 'terms frozen at first approval' })
  const first = await run('invoice.export', {}, '2026-10-21T00:12:00.000Z', 'INV-0001 revision 1 exported in EXP-0001 by Olu Office', 1)
  assert.deepEqual(first.invoices, [{ invoiceId, revision: 1, invoiceNumber: 'INV-0001', total: '293.65', currency: 'AUD', branchId: null, taxBreakdown: [] }])
  assert.equal(first.total, '293.65')
  const download = async exported => {
    const res = await h.request(`/api/glove/exports/${exported.id}.csv`, { as: b.office.cookie })
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('content-type'), 'text/csv; charset=utf-8')
    assert.equal(res.headers.get('content-disposition'), `attachment; filename="${exported.number}.csv"`)
    return Buffer.from(await res.arrayBuffer())
  }
  const header = '*ContactName,EmailAddress,POAddressLine1,*InvoiceNumber,Reference,*InvoiceDate,*DueDate,*Description,*Quantity,*UnitAmount,*AccountCode,*TaxType,Currency\r\n'
  const contact = ['Harbourview Dental', ['accounts', 'harbourview.example'].join('@'), '14 Harbour St, Balmain NSW 2041']
  // Quoting the billing address and material description exercises actual downloaded CSV bytes.
  const prefix = `${contact[0]},${contact[1]},"${contact[2]}",`
  const expectedFirst = header +
    `${prefix}INV-0001,J-1001,21/10/2026,04/11/2026,Split system service,1,189.00,200,GST on Income,AUD\r\n` +
    `${prefix}INV-0001,J-1001,21/10/2026,04/11/2026,Custom access work,2,12.50,200,GST Free Income,AUD\r\n` +
    `${prefix}INV-0001,J-1001,21/10/2026,04/11/2026,R32 refrigerant (used on site),0.5,95.00,200,GST on Income,AUD\r\n` +
    `${prefix}INV-0001,J-1001,21/10/2026,04/11/2026,"Insulation tape, 25 mm",2,4.25,200,GST Free Income,AUD\r\n`
  const firstBytes = await download(first)
  assert.deepEqual(firstBytes, Buffer.from(expectedFirst), 'every header, column, line and quoted cell matches independently expected accounting input')
  inv = (await h.state()).invoices.find(i => i.id === invoiceId)
  const original = structuredClone(inv.revisions[0])
  assert.deepEqual(original.export, { exportId: first.id, number: 'EXP-0001', at: '2026-10-21T00:12:00.000Z' })
  await refused(b.office, 'invoice.export', {}, 'NOTHING_TO_EXPORT')
  await refused(b.office, 'invoice.revise', { invoiceId, version: inv.version, reason: 'Change exported original', lines: pricedLines }, 'INVOICE_STATE')
  await refused(b.office, 'invoice.correct', { invoiceId, version: inv.version - 1, reason: 'Stale correction', lines: pricedLines }, 'STALE')
  const correctedLines = [{ ...pricedLines[0], unitPrice: '179.00', total: '179.00' }, ...pricedLines.slice(1)]
  inv = await run('invoice.correct', { invoiceId, version: inv.version, reason: 'Wrong service price', lines: correctedLines }, '2026-10-21T00:13:00.000Z', 'INV-0001 correction revision 2 ($282.65) corrects revision 1 exported in EXP-0001: Wrong service price', 2)
  const corrects = { revision: 1, exportNumber: 'EXP-0001', total: '293.65' }
  assert.deepEqual(inv.revisions[0], original)
  assert.deepEqual(inv.revisions[1], { n: 2, lines: correctedLines, discount: null, totals: { subtotal: '260.00', gst: '22.65', total: '282.65' }, preparedBy: office, preparedAt: '2026-10-21T00:13:00.000Z', approval: null, export: null, reason: 'Wrong service price', corrects })
  const intermediate = structuredClone(inv.revisions[1])
  const finalLines = [{ ...correctedLines[0], description: 'Split system service (corrected)' }, ...correctedLines.slice(1, 3), { ...correctedLines[3], quantity: '1', total: '4.25' }]
  inv = await run('invoice.revise', { invoiceId, version: inv.version, reason: 'Typo in the description', lines: finalLines }, '2026-10-21T00:14:00.000Z', 'INV-0001 revision 3 ($278.40): Typo in the description', 3)
  assert.equal(inv.status, 'draft')
  assert.deepEqual(inv.revisions.slice(0, 2), [original, intermediate], 'revising the correction keeps both earlier revisions and the original approval and export')
  assert.deepEqual(inv.revisions[2], { n: 3, lines: finalLines, discount: null, totals: { subtotal: '255.75', gst: '22.65', total: '278.40' }, preparedBy: office, preparedAt: '2026-10-21T00:14:00.000Z', approval: null, export: null, reason: 'Typo in the description', corrects })
  assert.deepEqual(await download(first), firstBytes)
  await refused(b.office, 'invoice.approve', { invoiceId, version: inv.version, revision: 2 }, 'REVISION')
  await refused(b.office, 'invoice.approve', { invoiceId, version: inv.version - 1, revision: 3 }, 'STALE')
  await refused(b.office, 'invoice.revise', { invoiceId, version: inv.version - 1, reason: 'Stale prices', lines: pricedLines }, 'STALE')
  await refused(b.office, 'invoice.export', {}, 'NOTHING_TO_EXPORT')
  const viewer = await h.person('Synthetic Glove Viewer', 'viewer')
  for (const person of [b.dispatcher, b.priyaPerson, b.tomPerson, b.agent, viewer]) {
    await refused(person, 'invoice.approve', { invoiceId, version: inv.version, revision: 3 }, 'FORBIDDEN')
    await refused(person, 'invoice.correct', { invoiceId, version: inv.version, reason: 'Unauthorized correction', lines: pricedLines }, 'FORBIDDEN')
    await refused(person, 'invoice.export', {}, 'FORBIDDEN')
    assert.equal((await h.request(`/api/glove/exports/${first.id}.csv`, { as: person.cookie })).status, 403)
  }
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await refused(b.office, 'invoice.approve', { invoiceId, version: inv.version, revision: 3 }, 'FORBIDDEN')
  await refused(b.office, 'invoice.prepare', facts[0].payload, 'FORBIDDEN', { commandId: facts[0].commandId })
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })
  inv = await run('invoice.approve', { invoiceId, version: inv.version, revision: 3 }, '2026-10-21T00:15:00.000Z', 'INV-0001 revision 3 approved by Olu Office', 3)
  assert.deepEqual(inv.revisions[2].approval, { ...office, at: '2026-10-21T00:15:00.000Z' })
  const second = await run('invoice.export', {}, '2026-10-21T00:16:00.000Z', 'INV-0001 revision 3 exported in EXP-0002 by Olu Office', 3)
  assert.deepEqual(second.invoices, [{ invoiceId, revision: 3, invoiceNumber: 'INV-0001-R3', total: '278.40', currency: 'AUD', branchId: null, taxBreakdown: [] }])
  assert.equal(second.total, '278.40')
  const reference = 'J-1001 corrects INV-0001 rev 1 (EXP-0001): Typo in the description'
  const expectedSecond = header +
    `${prefix}INV-0001-R3,${reference},21/10/2026,04/11/2026,Split system service (corrected),1,179.00,200,GST on Income,AUD\r\n` +
    `${prefix}INV-0001-R3,${reference},21/10/2026,04/11/2026,Custom access work,2,12.50,200,GST Free Income,AUD\r\n` +
    `${prefix}INV-0001-R3,${reference},21/10/2026,04/11/2026,R32 refrigerant (used on site),0.5,95.00,200,GST on Income,AUD\r\n` +
    `${prefix}INV-0001-R3,${reference},21/10/2026,04/11/2026,"Insulation tape, 25 mm",1,4.25,200,GST Free Income,AUD\r\n`
  const secondBytes = await download(second)
  assert.deepEqual(secondBytes, Buffer.from(expectedSecond))
  const csv = secondBytes.toString(), numbers = [...csv.matchAll(/,(INV-\d{4}(?:-R\d+)?),/g)].map(m => m[1])
  assert.deepEqual(numbers, ['INV-0001-R3', 'INV-0001-R3', 'INV-0001-R3', 'INV-0001-R3'], 'the original number is never exported again')
  assert.match(csv, /corrects INV-0001 rev 1 \(EXP-0001\)/)
  await refused(b.office, 'invoice.export', {}, 'NOTHING_TO_EXPORT')
  const retained = await snapshot()
  assert.equal(retained.exports.length, 2)
  assert.deepEqual(retained.invoices[0].revisions.slice(0, 2), [original, intermediate])
  assert.deepEqual(retained.invoices[0].revisions[2].export, { exportId: second.id, number: 'EXP-0002', at: '2026-10-21T00:16:00.000Z' })
  assert.deepEqual(retained.approvals.filter(a => a.subjectId === invoiceId).map(a => [a.revision, a.decision, a.preparedBy, a.approvedBy, a.createdAt]), [
    [1, 'approved', office, office, '2026-10-21T00:11:00.000Z'],
    [3, 'approved', office, office, '2026-10-21T00:15:00.000Z'],
  ])
  await h.restart()
  await clock('2026-10-21T00:16:00.000Z')
  assert.deepEqual(await snapshot(), retained, 'all revisions, decisions, exports, jobs and Activity survive an actual Worker restart with D1 retained')
  assert.deepEqual(await download(first), firstBytes, 'the original export bytes survive correction and restart')
  assert.deepEqual(await download(second), secondBytes)
  for (const fact of facts) assert.deepEqual(await b.office.run(fact.type, fact.payload, { commandId: fact.commandId }), fact.result)
  assert.deepEqual(await b.priyaPerson.run('visit.capture', materialPayload, { commandId: materialCommand }), material)
  assert.deepEqual(await snapshot(), retained, 'replaying every saved invoice command and the material capture adds no line, version, approval or export')
  const { activity, exported } = await assertTrail(h, ['invoice.prepared', 'invoice.approved', 'invoice.exported', 'invoice.corrected', 'invoice.revised'])
  assert.deepEqual(exported.invoices, retained.invoices.map(({ reminderState: _liveReminderLabel, ...record }) => record))
  assert.deepEqual(exported.approvals, retained.approvals)
  assert.deepEqual(exported.exports, retained.exports.map(record => ({ ...record, csv: record.id === first.id ? expectedFirst : expectedSecond })))
  for (const fact of facts) {
    const kind = { 'invoice.prepare': 'invoice.prepared', 'invoice.approve': 'invoice.approved', 'invoice.export': 'invoice.exported', 'invoice.correct': 'invoice.corrected', 'invoice.revise': 'invoice.revised' }[fact.type]
    const events = activity.filter(e => e.commandId === fact.commandId)
    assert.equal(events.length, 1)
    const event = events[0]
    assert.deepEqual([event.kind, event.actorId, event.actorName, event.actorRole, event.at, event.jobId, event.subjectKind, event.subjectId, event.summary], [kind, office.id, office.name, office.role, fact.at, job.id, 'invoice', invoiceId, fact.summary])
    const kept = exported.timeline.filter(e => e.command_id === fact.commandId)
    assert.equal(kept.length, 1)
    assert.deepEqual([kept[0].id, kept[0].kind, kept[0].actor_id, kept[0].actor_name, kept[0].actor_role, kept[0].at, kept[0].job_id, kept[0].subject_id, kept[0].summary], [event.id, kind, office.id, office.name, office.role, fact.at, job.id, invoiceId, fact.summary])
    const data = JSON.parse(kept[0].data)
    if (['invoice.prepare', 'invoice.correct', 'invoice.revise'].includes(fact.type)) assert.equal(data.revision, fact.revision)
    if (fact.type === 'invoice.export') assert.equal(data.exportId, fact.result.id)
    assert.deepEqual(data.recordChanges, event.recordChanges)
    assert.ok(event.recordChanges.some(r => r.kind === 'invoices' && r.id === invoiceId && r.fields.includes('revisions')))
  }
})

test('DATA-002, DATA-009, DATA-010 a job and Activity keep the whole timeline after hundreds of later events', async (t) => {
  const h = await installation({ at: '2026-10-20T00:00:00.000Z' })
  t.after(() => h.close())
  const b = await business(h)
  const dispatcher = { id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' }
  const technician = { id: b.priyaPerson.id, name: 'Priya Nair', role: 'technician' }
  const office = { id: b.office.id, name: 'Olu Office', role: 'office' }
  const expected = [], downloadExpected = [], commands = []
  const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  // Expectations come from the actions we issue and the people we invited,
  // never from Activity, another timeline or the business download.
  const act = async (person, actor, type, payload) => {
    const commandId = `synthetic-glove-timeline-${commands.length + 1}`
    const at = new Date(Date.UTC(2026, 9, 20, 1, commands.length)).toISOString()
    await clock(at)
    const result = await person.run(type, payload, { commandId })
    const action = { person, actor, type, payload, commandId, at, result }
    commands.push(action)
    return action
  }
  let job
  const remember = (action, kind, subjectKind, subjectId, changes) => {
    const fact = {
      kind, subjectKind, subjectId, jobId: job?.id ?? null, actorId: action.actor.id,
      actorName: action.actor.name, actorRole: action.actor.role,
      commandId: action.commandId, at: action.at, changes,
    }
    downloadExpected.push(fact)
    if (fact.jobId) expected.push(fact)
  }
  const change = (kind, id, fromVersion, toVersion, field) => ({ kind, id, fromVersion, toVersion, field })
  const drafted = await act(b.dispatcher, dispatcher, 'quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Native service history', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  remember(drafted, 'quote.drafted', 'quote', drafted.result.id, [change('quotes', drafted.result.id, null, 1, 'revisions')])
  const approved = await act(b.dispatcher, dispatcher, 'quote.approve', { quoteId: drafted.result.id, version: drafted.result.version, revision: 1 })
  remember(approved, 'quote.approved', 'quote', drafted.result.id, [change('quotes', drafted.result.id, 1, 2, 'revisions')])
  const accepted = await act(b.dispatcher, dispatcher, 'quote.accept', { quoteId: drafted.result.id, version: approved.result.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  remember(accepted, 'quote.accepted', 'quote', drafted.result.id, [change('quotes', drafted.result.id, 2, 3, 'acceptance')])
  const created = await act(b.dispatcher, dispatcher, 'job.create', { quoteId: accepted.result.id })
  job = created.result
  remember(created, 'job.created', 'job', job.id, [change('jobs', job.id, null, 1, 'quoteId'), change('quotes', accepted.result.id, 3, 4, 'jobId')])
  const booked = await act(b.dispatcher, dispatcher, 'visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  const visit = booked.result
  remember(booked, 'visit.booked', 'visit', visit.id, [change('visits', visit.id, null, 1, 'assignments')])
  const arrived = await act(b.priyaPerson, technician, 'visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:04:00Z' })
  remember(arrived, 'capture.arrival', 'capture', arrived.commandId, [change('captures', arrived.commandId, null, 1, 'deviceTime'), change('visits', visit.id, 1, 3, 'arrival')])
  let visitVersion = 3
  // Enumerate the work before reading its generated item identities. A missing
  // or reordered checklist cannot silently shorten the expected history.
  const checklist = [
    { label: 'Isolate power', required: true },
    { label: 'Clean filters', required: true },
    { label: 'Check refrigerant pressure', required: true },
    { label: 'Test run 10 minutes', required: false },
  ]
  assert.deepEqual(job.checklist.map(({ label, required }) => ({ label, required })), checklist)
  for (const [i, item] of checklist.entries()) {
    const captured = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:10:00Z', kind: 'checklist', itemId: job.checklist[i].id, result: 'done' })
    remember(captured, 'capture.checklist', 'capture', captured.commandId, [change('captures', captured.commandId, null, 1, 'result'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  }
  const noted = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:20:00Z', kind: 'note', text: 'Cleaned filters and coil' })
  remember(noted, 'capture.note', 'capture', noted.commandId, [change('captures', noted.commandId, null, 1, 'text'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  const material = await act(b.priyaPerson, technician, 'visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:30:00Z', kind: 'material', serviceId: b.refrigerant.id, quantity: '0.5', unit: 'kg' })
  remember(material, 'capture.material', 'capture', material.commandId, [change('captures', material.commandId, null, 1, 'quantity'), change('visits', visit.id, visitVersion, ++visitVersion, 'version')])
  const completed = await act(b.priyaPerson, technician, 'visit.complete', { visitId: visit.id, deviceTime: '2026-10-19T23:00:00Z', summary: 'Cleaned filters and coil', signoff: { absentReason: 'Customer out' } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
  assert.ok(report, 'the native completion creates its report')
  const completionChanges = [change('captures', completed.commandId, null, 1, 'summary'), change('visits', visit.id, visitVersion, visitVersion + 2, 'completion'), change('serviceReports', report.id, null, 1, 'snapshot'), change('jobs', job.id, 1, 2, 'status')]
  remember(completed, 'capture.completion', 'capture', completed.commandId, completionChanges)
  remember(completed, 'report.created', 'serviceReport', report.id, [])
  remember(completed, 'job.completed', 'job', job.id, [])

  // The same person later holds a different role. History must keep the role
  // actually used for each action, while every new read uses current authority.
  await h.command('role.set', { operatorId: b.dispatcher.id, role: 'office' })
  const formerDispatcher = { ...dispatcher, role: 'office' }
  const prepared = await act(b.dispatcher, formerDispatcher, 'invoice.prepare', { jobId: job.id })
  remember(prepared, 'invoice.prepared', 'invoice', prepared.result.id, [change('invoices', prepared.result.id, null, 1, 'revisions')])
  const invoice = await act(b.office, office, 'invoice.approve', { invoiceId: prepared.result.id, version: prepared.result.version, revision: 1 })
  remember(invoice, 'invoice.approved', 'invoice', invoice.result.id, [change('invoices', invoice.result.id, 1, 2, 'revisions')])
  const accounting = await act(b.office, office, 'invoice.export', {})
  remember(accounting, 'invoice.exported', 'invoice', invoice.result.id, [change('invoices', invoice.result.id, 2, 3, 'revisions'), change('exports', accounting.result.id, null, 1, 'invoices')])

  const timeline = async (as) => { const res = await h.request(`/api/glove/jobs/${job.id}/timeline`, { as }); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).events }
  const metadata = e => Object.fromEntries(['kind', 'subjectKind', 'subjectId', 'jobId', 'actorId', 'actorName', 'actorRole', 'commandId', 'at'].map(key => [key, e[key]]))
  const checkTimeline = (events, facts) => {
    assert.deepEqual(events.map(metadata), facts.map(metadata), 'the complete ordered history has the independently expected people, historical roles, commands, records and times')
    assert.equal(new Set(events.map(e => e.id)).size, facts.length, 'each retained step has a distinct event identity')
    for (const [i, event] of events.entries()) {
      assert.ok(event.summary && Number.isSafeInteger(event.sequence), 'a step has a readable description and durable order')
      if (i) assert.ok(event.sequence > events[i - 1].sequence)
      for (const { field, ...record } of facts[i].changes) {
        const kept = event.recordChanges.find(r => r.kind === record.kind && r.id === record.id)
        assert.ok(kept, `${event.kind} names its affected ${record.kind} record`)
        assert.deepEqual({ kind: kept.kind, id: kept.id, fromVersion: kept.fromVersion, toVersion: kept.toVersion }, record)
        assert.ok(kept.fields.includes(field), `${event.kind} names the changed ${field} field without its value`)
      }
    }
  }
  const agentQuote = await b.agent.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Agent-prepared follow-up', lines: [{ description: 'Follow-up', quantity: '1', unitPrice: '85.00' }] })
  const exportedEvents = rows => rows.map(e => ({ id: e.id, sequence: e.sequence, at: e.at, actorId: e.actor_id, actorName: e.actor_name, actorRole: e.actor_role, commandId: e.command_id, jobId: e.job_id, subjectKind: e.subject_kind, subjectId: e.subject_id, kind: e.kind, summary: e.summary, recordChanges: JSON.parse(e.data)?.recordChanges ?? [] }))
  const download = async as => {
    const response = await h.request('/api/glove/export', { as })
    assert.equal(response.status, 200, await response.clone().text())
    return response.json()
  }
  const commandIds = new Set(commands.map(c => c.commandId))
  const serviceHistory = data => exportedEvents(data.timeline.filter(e => commandIds.has(e.command_id)))
  const earlyDownload = serviceHistory(await download(h.owner()))
  checkTimeline(earlyDownload, downloadExpected)
  const early = await timeline(h.owner())
  assert.ok(early.length >= 6, 'booked, arrived, checklist, completed')
  checkTimeline(early, expected)
  for (let i = 0; i < 510; i++) await h.command('customer.save', { name: `Walk-in customer ${i}` })
  await h.restart()
  const state = await h.state()
  assert.ok(!state.events.some(e => e.id === early[0].id), 'the latest Activity window no longer holds the early event')
  const previous = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`).then(r => r.json())
  assert.ok(previous.events.some(e => e.id === early[0].id), 'the Activity cursor still reaches it')
  assert.ok(previous.events.some(e => e.subjectId === agentQuote.id && e.actorId === b.agent.id && e.actorRole === 'agent'), 'the agent action keeps its own identity')
  const fieldEvents = expected.filter(e => ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)).map(e => ({ ...e, changes: e.changes.filter(r => ['jobs', 'visits', 'captures', 'times'].includes(r.kind)) }))
  const ownActivity = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`, { as: b.priyaPerson.cookie }).then(r => r.json())
  assert.ok(ownActivity.events.every(e => e.jobId === job.id && ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)), 'older pages enforce the technician’s current job and field visibility')
  checkTimeline([...ownActivity.events].reverse(), fieldEvents)
  assert.equal((await h.request('/api/glove/activity?before=invalid')).status, 400)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(exported.timeline.some(e => e.id === early[0].id))
  const agentEvent = exported.timeline.find(e => e.subject_id === agentQuote.id && e.actor_id === b.agent.id)
  assert.ok(JSON.parse(agentEvent.data).recordChanges.some(r => r.kind === 'quotes' && r.id === agentQuote.id && r.toVersion === agentQuote.version && r.fields.includes('revisions')), 'the export names the changed record, revision and fields without copying its values')
  const late = await timeline(h.owner())
  checkTimeline(late, expected)
  assert.deepEqual(late, early, 'every complete step is unchanged after 510 later commands and a real Worker restart')
  assert.ok(late.every(e => e.jobId === job.id && e.actorName && e.commandId))
  const techTimeline = await timeline(b.priyaPerson.cookie)
  assert.deepEqual(techTimeline.map(e => e.id), early.filter(e => ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)).map(e => e.id), 'the assigned technician still reads the complete field-event history')
  checkTimeline(techTimeline, fieldEvents)
  assert.ok(early.some(e => e.kind === 'report.created'), 'FIELD-003 also keeps the desk-only service report event')
  const other = await h.person('Tara Other', 'technician')
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404, 'other technicians do not')

  for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie]) {
    checkTimeline(await timeline(as), expected)
    const data = await download(as)
    const complete = serviceHistory(data)
    checkTimeline(complete, downloadExpected)
    assert.deepEqual(complete, earlyDownload, 'all native service actions survive, including the quote steps before the job existed')
    const kept = exportedEvents(data.timeline.filter(e => e.job_id === job.id))
    checkTimeline(kept, expected)
    assert.deepEqual(kept, early, 'the business download retains every step, description, sequence and changed-record detail')
  }
  for (const as of [b.priyaPerson.cookie, other.cookie]) assert.equal((await h.request('/api/glove/export', { as })).status, 403, 'field access never grants a whole-business download')

  // A second populated branch makes exclusion meaningful on both read doors.
  const branch = await h.command('branch.save', { name: 'Phoenix', prefix: 'PHX', timezone: 'America/Phoenix', zips: ['85001'] })
  const branchCustomer = await h.command('customer.save', { name: 'synthetic-glove-branch-customer' })
  const branchSite = await h.command('site.save', { customerId: branchCustomer.id, address: '1 Central Ave, Phoenix AZ 85001', branchId: branch.id })
  const branchAt = '2026-10-20T02:00:00.000Z', branchCommand = 'synthetic-glove-branch-job'
  await clock(branchAt)
  const branchJob = await b.office.run('job.create', { customerId: branchCustomer.id, siteId: branchSite.id, title: 'synthetic-glove-branch-job' }, { commandId: branchCommand })
  const branchFact = { kind: 'job.created', subjectKind: 'job', subjectId: branchJob.id, jobId: branchJob.id, actorId: office.id, actorName: office.name, actorRole: office.role, commandId: branchCommand, at: branchAt }
  const branchTimeline = async as => {
    const response = await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as })
    assert.equal(response.status, 200)
    const events = (await response.json()).events
    assert.equal(events.length, 1)
    for (const [key, value] of Object.entries(branchFact)) assert.equal(events[0][key], value)
    return events
  }
  const domain = async () => { const { exportedAt: _time, ...records } = await download(h.owner()); return records }
  await h.command('branch.limit', { operatorId: b.office.id, branchId: 'main' })
  const beforeMainReads = await domain()
  checkTimeline(await timeline(b.office.cookie), expected)
  assert.equal((await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as: b.office.cookie })).status, 404)
  const mainDownload = await download(b.office.cookie)
  checkTimeline(exportedEvents(mainDownload.timeline.filter(e => e.job_id === job.id)), expected)
  checkTimeline(serviceHistory(mainDownload), downloadExpected)
  assert.deepEqual(serviceHistory(mainDownload), earlyDownload, 'the current main-branch Office download retains the independently expected pre-job quote actions as well as every job step')
  assert.ok(!mainDownload.timeline.some(e => e.job_id === branchJob.id))
  assert.ok(!mainDownload.jobs.some(j => j.id === branchJob.id))
  assert.deepEqual(await domain(), beforeMainReads, 'allowed and refused main-branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  const beforeBranchReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.office.cookie })).status, 404, 'the same session immediately loses its old branch')
  const branchEvents = await branchTimeline(b.office.cookie)
  const branchDownload = await download(b.office.cookie)
  const branchKept = exportedEvents(branchDownload.timeline.filter(e => e.job_id === branchJob.id))
  checkTimeline(branchKept, [{ ...branchFact, changes: [change('jobs', branchJob.id, null, 1, 'title')] }])
  assert.deepEqual(branchKept, branchEvents)
  assert.ok(!branchDownload.timeline.some(e => e.job_id === job.id))
  assert.ok(!branchDownload.jobs.some(j => j.id === job.id))
  assert.deepEqual(await domain(), beforeBranchReads, 'allowed and refused other-branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.priyaPerson.id, branchId: branch.id })
  const beforeFieldBranchReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.priyaPerson.cookie })).status, 404, 'assignment history does not override the technician’s current branch limit')
  assert.equal((await h.request(`/api/glove/jobs/${branchJob.id}/timeline`, { as: b.priyaPerson.cookie })).status, 404, 'a matching branch does not grant an unassigned job')
  assert.deepEqual(await domain(), beforeFieldBranchReads, 'refused technician branch reads change nothing')
  await h.command('branch.limit', { operatorId: b.priyaPerson.id, branchId: null })
  checkTimeline(await timeline(b.priyaPerson.cookie), fieldEvents)
  await h.command('branch.limit', { operatorId: b.office.id, branchId: null })
  checkTimeline(await timeline(b.office.cookie), expected)
  await h.command('role.set', { operatorId: b.office.id, role: 'technician' })
  const beforeWithdrawnReads = await domain()
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.office.cookie })).status, 404, 'withdrawn desk authority cannot read the former timeline')
  assert.equal((await h.request('/api/glove/export', { as: b.office.cookie })).status, 403)
  assert.deepEqual(await domain(), beforeWithdrawnReads, 'refused reads after role withdrawal change nothing')
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })

  // Public downloads contain the domain records, so compare complete snapshots
  // around repeated successful and refused reads without test-only SQL access.
  const { exportedAt: _beforeTime, ...beforeReads } = await download(h.owner())
  for (const as of [h.owner(), b.office.cookie, b.dispatcher.cookie]) {
    checkTimeline(await timeline(as), expected)
    await download(as)
  }
  checkTimeline(await timeline(b.priyaPerson.cookie), fieldEvents)
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404)
  const { exportedAt: _afterTime, ...afterReads } = await download(h.owner())
  assert.deepEqual(afterReads, beforeReads, 'successful and refused timeline and download reads change no domain record or event')
  const fixture = await branchActivityHistory(h)
  const { reader, branchA, branchB, jobA, jobB, at, commandId } = fixture
  const traverse = async (managementEvents = 0) => {
    const initial = await reader.state()
    assert.equal(initial.events.length, managementEvents, 'the initial B window has no visible work; only later authority changes may appear')
    assert.ok(initial.events.every(e => e.kind === 'branch.limited' && e.subjectId === reader.id))
    assert.ok(initial.activityNext > 1, 'an empty visible window retains its installation sequence cursor')
    let next = initial.activityNext, empty = 0
    const seen = new Set()
    while (next !== null) {
      assert.ok(!seen.has(next), 'each cursor advances without looping on an empty page')
      seen.add(next)
      const response = await h.request(`/api/glove/activity?before=${next}`, { as: reader.cookie })
      assert.equal(response.status, 200)
      const page = await response.json()
      assert.ok(page.events.every(e => e.jobId !== jobB.id), 'B remains hidden on every page')
      assert.ok(page.next === null || page.next < next, 'sequence traversal moves backwards')
      if (page.events.length) {
        assert.ok(empty >= 2, 'multiple empty filtered pages were crossed')
        assert.equal(page.events.length, 1, 'the first visible page reaches exactly A’s event')
        const event = page.events[0]
        assert.deepEqual(metadata(event), { kind: 'job.created', subjectKind: 'job', subjectId: jobA.id, jobId: jobA.id, actorId: reader.id, actorName: reader.name, actorRole: 'office', commandId, at })
        assert.deepEqual(event.recordChanges.map(({ kind, id, fromVersion, toVersion }) => ({ kind, id, fromVersion, toVersion })), [{ kind: 'branches', id: branchA.id, fromVersion: 1, toVersion: 2 }, { kind: 'jobs', id: jobA.id, fromVersion: null, toVersion: 1 }])
        assert.ok(event.recordChanges.find(r => r.kind === 'jobs' && r.id === jobA.id).fields.includes('title'))
        return { event, before: next }
      }
      empty++
      next = page.next
    }
    assert.fail('A’s retained event must be reachable through the authenticated Activity door')
  }
  const beforeActivityReads = await domain()
  const reached = await traverse()
  assert.deepEqual(await domain(), beforeActivityReads, 'empty-page traversal has no read-side mutation')
  await h.restart()
  assert.deepEqual(await traverse(), reached, 'the exact sequence, actor, time and record metadata survive Worker restart')
  assert.deepEqual(await domain(), beforeActivityReads, 'restart and repeated reads preserve the business records and timeline')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branchB.id })
  const beforeWithdrawnActivity = await domain()
  const withdrawnResponse = await h.request(`/api/glove/activity?before=${reached.before}`, { as: reader.cookie })
  assert.equal(withdrawnResponse.status, 200)
  const withdrawn = await withdrawnResponse.json()
  assert.ok(!withdrawn.events.some(e => e.jobId === jobA.id), 'the old cursor grants no A history after branch withdrawal')
  assert.ok(withdrawn.events.some(e => e.jobId === jobB.id), 'the same saved cursor serves the reader’s newly permitted B work')
  assert.ok(withdrawn.events.every(e => !e.recordChanges.some(r => r.kind === 'jobs' && r.id === jobA.id)), 'withdrawn A record metadata is also absent')
  assert.ok(!(await reader.state()).events.some(e => e.jobId === jobA.id))
  assert.equal((await h.request(`/api/glove/activity?before=${reached.before}`, { as: '' })).status, 401, 'a saved cursor grants no signed-out access')
  assert.deepEqual(await domain(), beforeWithdrawnActivity, 'successful and refused reads after branch withdrawal change no record or event')
  await h.command('branch.limit', { operatorId: reader.id, branchId: branchA.id })
  assert.deepEqual((await traverse(2)).event, reached.event, 'restoring branch access reaches the same retained event')
  t.diagnostic('PROBE DATA-009 point 5: empty initial branch window and multiple empty Activity pages -> exactly A event with actor, time and changed-record metadata; B hidden, withdrawal refused, restart retained, reads unchanged')
  t.diagnostic(`PROBE GLOVE-12 point 1: native commands, 510 unrelated changes and Worker restart -> ${expected.length} exact ordered steps; historical roles, current desk and assigned field access, unrelated and branch refusals; reads unchanged`)
  t.diagnostic(`PROBE GLOVE-12 point 2: Owner and Office business downloads -> ${downloadExpected.length} independently expected service entries, including all ${expected.length} job steps, with affected records, plus current branch and role boundaries`)
})
