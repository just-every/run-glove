// The record trail a business relies on later: a corrected invoice never goes
// to the accounting system under its original number twice, and every job keeps
// its whole timeline however busy the business gets.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, completedJob, assertTrail } from './harness.mjs'

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
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  const timeline = async (as) => { const res = await h.request(`/api/glove/jobs/${job.id}/timeline`, { as }); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).events }
  const agentQuote = await b.agent.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Agent-prepared follow-up', lines: [{ description: 'Follow-up', quantity: '1', unitPrice: '85.00' }] })
  const early = await timeline(h.owner())
  assert.ok(early.length >= 6, 'booked, arrived, checklist, completed')
  for (let i = 0; i < 510; i++) await h.command('customer.save', { name: `Walk-in customer ${i}` })
  const state = await h.state()
  assert.ok(!state.events.some(e => e.id === early[0].id), 'the latest Activity window no longer holds the early event')
  const previous = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`).then(r => r.json())
  assert.ok(previous.events.some(e => e.id === early[0].id), 'the Activity cursor still reaches it')
  assert.ok(previous.events.some(e => e.subjectId === agentQuote.id && e.actorId === b.agent.id && e.actorRole === 'agent'), 'the agent action keeps its own identity')
  const ownActivity = await h.request(`/api/glove/activity?before=${state.events.at(-1).sequence}`, { as: b.priyaPerson.cookie }).then(r => r.json())
  assert.ok(ownActivity.events.every(e => e.jobId === job.id && ['job', 'visit', 'capture', 'time'].includes(e.subjectKind)), 'older pages enforce the technician’s current job and field visibility')
  assert.equal((await h.request('/api/glove/activity?before=invalid')).status, 400)
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(exported.timeline.some(e => e.id === early[0].id))
  const agentEvent = exported.timeline.find(e => e.subject_id === agentQuote.id && e.actor_id === b.agent.id)
  assert.ok(JSON.parse(agentEvent.data).recordChanges.some(r => r.kind === 'quotes' && r.id === agentQuote.id && r.toVersion === agentQuote.version && r.fields.includes('revisions')), 'the export names the changed record, revision and fields without copying its values')
  const late = await timeline(h.owner())
  assert.deepEqual(late.map(e => e.id), early.map(e => e.id), 'every step is still there')
  assert.ok(late.every(e => e.jobId === job.id && e.actorName && e.commandId))
  const fieldEvents = early.filter(e => ['job', 'visit', 'capture', 'time'].includes(e.subjectKind))
  assert.deepEqual((await timeline(b.priyaPerson.cookie)).map(e => e.id), fieldEvents.map(e => e.id), 'the assigned technician still reads the complete field-event history')
  assert.ok(early.some(e => e.kind === 'report.created'), 'FIELD-003 also keeps the desk-only service report event')
  const other = await h.person('Tara Other', 'technician')
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404, 'other technicians do not')
})
