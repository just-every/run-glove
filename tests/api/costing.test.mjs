// COST-004 estimate versus actual job costing through the command, cost and
// report doors: a job quoted at $1,850 with an estimated 41% margin runs
// through recorded time, materials, an expense and a subcontractor bill to an
// actual 46% margin, to the cent.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, id } from './harness.mjs'

test('COST-004 a $1,850 job retains frozen estimates and approved revenue through actual costs and restart', async (t) => {
  const h = await installation({ at: '2026-10-20T20:50:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  const condenser = await h.command('service.save', { code: 'COND-3T', name: '3-ton condenser', kind: 'material', category: 'Equipment', unit: 'each', unitCost: '350.00', unitPrice: '700.00', tax: 'GST' })
  const install = await h.command('service.save', { code: 'INST-LAB', name: 'Condenser install labor', kind: 'service', category: 'Labor', unit: 'job', unitCost: '261.00', unitPrice: '300.00', tax: 'GST' })
  const priya = await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, costRate: '45.00' })
  assert.equal(priya.costRate, '45.00')

  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Condenser replacement', lines: [{ description: '3-ton condenser', quantity: '2', unitPrice: '700.00', serviceId: condenser.id }, { description: 'Install labor', quantity: '1.5', unitPrice: '300.00', serviceId: install.id }, { description: 'Site survey without a cost', quantity: '1', unitPrice: '0.00' }, { description: 'Disposal without a cost', quantity: '2', unitPrice: '0.00' }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const accepted = (await h.state()).quotes.find(q => q.id === quote.id)
  const lineFacts = lines => lines.map(l => [l.description, l.serviceId, l.quantity, l.unitPrice, l.unitCost ?? null, l.total, l.tax])
  const frozenLines = [
    ['3-ton condenser', condenser.id, '2', '700.00', '350.00', '1400.00', 'GST'],
    ['Install labor', install.id, '1.5', '300.00', '261.00', '450.00', 'GST'],
    ['Site survey without a cost', null, '1', '0.00', null, '0.00', 'GST'],
    ['Disposal without a cost', null, '2', '0.00', null, '0.00', 'GST'],
  ]
  assert.equal(job.quoteId, quote.id)
  assert.equal(job.quoteRevision, 1)
  assert.deepEqual(lineFacts(accepted.acceptance.lines), frozenLines)
  assert.deepEqual(lineFacts(job.lines), frozenLines)
  assert.deepEqual([job.totals.subtotal, job.totals.gst, job.totals.total], ['1850.00', '185.00', '2035.00'])
  const cost = async (as = h.owner()) => {
    const response = await h.request(`/api/glove/jobs/${job.id}/cost`, { as })
    assert.equal(response.status, 200)
    return response.json()
  }
  let c = (await cost()).costing
  assert.deepEqual([c.revenue, c.estimate.cost, c.estimate.margin], ['1850.00', '1091.50', '41.0'])

  assert.equal(c.estimate.uncostedLines, 2)
  assert.deepEqual(c.estimate.uncostedLineItems, [{ description: 'Site survey without a cost', quantity: '1', serviceId: null }, { description: 'Disposal without a cost', quantity: '2', serviceId: null }])

  // Three hours on the job (40 minutes' travel), the condenser fitted, a permit and a subcontractor's crane.
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-21', start: '08:00', end: '11:00' })
  const at = time => `2026-10-21T${time}:00+11:00`
  const advance = async time => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: at(time) } })).status, 200)
  await advance('07:55')
  await b.priyaPerson.run('clock.in', { deviceTime: at('07:55') })
  await advance('08:00')
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'travel', deviceTime: at('08:00') })
  await advance('08:40')
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at('08:40') })
  // Advance the recording clock so the travel and job entries keep their order.
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-10-20T21:40:01Z' } })).status, 200)
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: at('08:40') })
  await advance('09:30')
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at('09:30'), kind: 'material', serviceId: condenser.id, quantity: '2' })
  await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Sydney', amount: '84.00', billable: false })
  await b.office.run('expense.record', { jobId: job.id, category: 'subcontractor bill', vendor: 'Harbour Cranes', amount: '80.00', billable: false })
  await advance('11:00')
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at('11:00'), summary: 'Condenser replaced', signoff: { absentReason: 'Customer at work' } })

  c = (await cost()).costing
  assert.deepEqual([c.actual.labor, c.actual.materials, c.actual.expenses, c.actual.subcontractors, c.actual.cost, c.actual.margin], ['135.00', '700.00', '84.00', '80.00', '999.00', '46.0'])
  assert.deepEqual(c.actual.laborEntries.map(l => [l.kind, l.minutes, l.cost]), [['travel', 40, '30.00'], ['job', 140, '105.00']])
  assert.deepEqual([c.difference.cost, c.difference.margin], ['-92.50', '5.0'])

  // Reports roll it up by job type (the first line's category), technician and period.
  const report = await (await h.request('/api/glove/reports/costing?from=2026-10-01&to=2026-10-31', { as: b.office.cookie })).json()
  assert.deepEqual(report.byJobType.map(r => [r.type, r.jobs, r.revenue, r.estimatedCost, r.actualCost, r.estimatedMargin, r.actualMargin]), [['Equipment', 1, '1850.00', '1091.50', '999.00', '41.0', '46.0']])
  assert.deepEqual(report.byTechnician.map(r => [r.technician, r.minutes, r.laborCost, r.jobs]), [[b.priya.name, 180, '135.00', 1]])
  const november = await (await h.request('/api/glove/reports/costing?from=2026-11-01&to=2026-11-30', { as: h.owner() })).json()
  assert.equal(november.total.jobs, 0)

  // Costs and cost rates are margins: technicians never read them.
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: b.priyaPerson.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/reports/costing?from=2026-10-01&to=2026-10-31', { as: b.priyaPerson.cookie })).status, 403)
  assert.ok((await b.priyaPerson.state()).technicians.every(x => x.costRate === undefined))

  // Catalogue edits affect current actual material cost, never the accepted
  // quantities or the estimate: 2 × $350 + 1.5 × $261 = $1,091.50.
  await h.command('service.save', { ...condenser, unitCost: '400.00', unitPrice: '850.00' })
  await h.command('service.save', { ...install, unitCost: '500.00', unitPrice: '650.00' })
  const frozen = async () => {
    const state = await h.state(), kept = state.jobs.find(j => j.id === job.id)
    assert.deepEqual(state.quotes.find(q => q.id === quote.id), accepted)
    assert.deepEqual(lineFacts(kept.lines), frozenLines)
    assert.deepEqual(kept.totals, job.totals)
    assert.deepEqual([kept.quoteId, kept.quoteRevision], [quote.id, 1])
    const figures = (await cost()).costing
    assert.equal(figures.estimate.cost, '1091.50')
    assert.equal(figures.estimate.uncostedLines, 2)
    assert.deepEqual(figures.estimate.uncostedLineItems, [
      { description: 'Site survey without a cost', quantity: '1', serviceId: null },
      { description: 'Disposal without a cost', quantity: '2', serviceId: null },
    ])
  }
  await frozen()
  assert.equal((await cost()).costing.actual.materials, '800.00')

  // Read populated records around every unsafe command, rather than checking
  // only its error. Refusal may record an outcome, but changes no domain record.
  const domain = async () => {
    const s = await h.state()
    return Object.fromEntries(['services', 'quotes', 'jobs', 'visits', 'captures', 'times', 'expenses', 'invoices', 'approvals', 'exports', 'payments'].map(k => [k, s[k]]))
  }
  const refuses = async (person, type, payload, error) => {
    const before = await domain()
    await person.run(type, payload, { error })
    assert.deepEqual(await domain(), before, `${type} ${error} leaves domain records unchanged`)
  }
  const clock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  const revenue = async expected => {
    assert.equal((await cost(b.office.cookie)).costing.revenue, expected)
    const response = await h.request('/api/glove/reports/costing?from=2026-10-21&to=2026-10-21', { as: b.office.cookie })
    assert.equal(response.status, 200)
    const report = await response.json()
    assert.equal(report.total.jobs, 1)
    assert.equal(report.total.revenue, expected)
    assert.equal(report.total.estimatedCost, '1091.50')
    await frozen()
  }
  // Before any invoice approval the accepted quote supplies $1,850, excluding
  // its $185 tax. The first draft is deliberately a different price.
  let inv = await b.office.run('invoice.prepare', { jobId: job.id, lines: [
    { description: 'Two condensers', serviceId: condenser.id, quantity: '2', unitPrice: '800.00' },
    { description: 'Install labor', serviceId: install.id, quantity: '1.5', unitPrice: '400.00' },
  ] })
  assert.deepEqual([inv.status, inv.revisions[0].approval, inv.revisions[0].totals.subtotal, inv.revisions[0].totals.gst, inv.revisions[0].totals.total], ['draft', null, '2200.00', '220.00', '2420.00'])
  await revenue('1850.00')
  await refuses(b.office, 'invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 2 }, 'REVISION')
  await refuses(b.office, 'invoice.approve', { invoiceId: inv.id, version: inv.version - 1, revision: 1 }, 'STALE')
  const approvalOne = { commandId: id(), at: '2026-10-21T01:00:00.000Z' }
  await clock(approvalOne.at)
  const firstPayload = { invoiceId: inv.id, version: inv.version, revision: 1 }
  inv = await b.office.run('invoice.approve', firstPayload, { commandId: approvalOne.commandId })
  const firstApproved = structuredClone(inv)
  await revenue('2200.00')

  inv = await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Extra agreed installation work', lines: [
    { description: 'Two condensers', serviceId: condenser.id, quantity: '2', unitPrice: '900.00' },
    { description: 'Install labor', serviceId: install.id, quantity: '1.5', unitPrice: '500.00' },
    { description: 'Extra installation work', quantity: '1', unitPrice: '125.00' },
  ] })
  assert.deepEqual(inv.revisions[0], firstApproved.revisions[0])
  assert.deepEqual([inv.revisions[1].approval, inv.revisions[1].totals.subtotal, inv.revisions[1].totals.gst, inv.revisions[1].totals.total], [null, '2675.00', '267.50', '2942.50'])
  await revenue('2200.00')
  await refuses(b.office, 'invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, 'REVISION')
  await refuses(b.office, 'invoice.revise', { invoiceId: inv.id, version: firstApproved.version, reason: 'Stale price edit', lines: [{ description: 'Wrong', quantity: '1', unitPrice: '1.00' }] }, 'STALE')
  const approvalTwo = { commandId: id(), at: '2026-10-21T02:00:00.000Z' }
  await clock(approvalTwo.at)
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 2 }, { commandId: approvalTwo.commandId })
  const secondApproved = structuredClone(inv)
  await revenue('2675.00')

  // A newer unapproved revision cannot replace either approved price basis.
  inv = await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Unapproved proposal', lines: [{ description: 'Proposed replacement', quantity: '1', unitPrice: '9999.00' }] })
  assert.deepEqual(inv.revisions.slice(0, 2), secondApproved.revisions)
  assert.equal(inv.revisions[2].approval, null)
  await revenue('2675.00')
  const beforeReplay = await domain()
  assert.deepEqual(await b.office.run('invoice.approve', firstPayload, { commandId: approvalOne.commandId }), firstApproved)
  assert.deepEqual(await domain(), beforeReplay, 'replaying the first approval cannot replace the second approved basis')
  await refuses(b.priyaPerson, 'invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 3 }, 'FORBIDDEN')
  await refuses(b.dispatcher, 'invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 3 }, 'FORBIDDEN')

  const office = { id: b.office.id, name: b.office.name, role: 'office' }
  assert.deepEqual(inv.revisions.map(r => r.approval), [{ ...office, at: approvalOne.at }, { ...office, at: approvalTwo.at }, null])
  const retained = await domain()
  await h.restart()
  assert.deepEqual(await domain(), retained, 'the actual restarted Worker reads every retained domain record')
  await revenue('2675.00')
  const displayedInvoice = { ...inv, reminderState: 'No reminders scheduled' }
  assert.deepEqual((await h.state()).invoices.find(i => i.id === inv.id), displayedInvoice)

  const activityResponse = await h.request('/api/glove/activity', { as: b.office.cookie })
  assert.equal(activityResponse.status, 200)
  const activity = (await activityResponse.json()).events
  const exportResponse = await h.request('/api/glove/export', { as: b.office.cookie })
  assert.equal(exportResponse.status, 200)
  const exported = await exportResponse.json()
  assert.deepEqual(exported.invoices.find(i => i.id === inv.id), inv)
  for (const [revision, proof] of [[1, approvalOne], [2, approvalTwo]]) {
    const event = activity.find(e => e.commandId === proof.commandId && e.kind === 'invoice.approved')
    assert.ok(event)
    assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectId, event.jobId], [office.id, office.name, 'office', proof.at, inv.id, job.id])
    assert.match(event.summary, new RegExp(`revision ${revision} approved`))
    const audit = exported.timeline.find(e => e.command_id === proof.commandId && e.kind === 'invoice.approved')
    assert.ok(audit)
    assert.deepEqual([audit.actor_id, audit.actor_name, audit.actor_role, audit.at, audit.subject_id, audit.job_id, audit.summary], [office.id, office.name, 'office', proof.at, inv.id, job.id, event.summary])
    const decision = exported.approvals.find(a => a.subjectId === inv.id && a.revision === revision)
    assert.deepEqual([decision.approvedBy, decision.createdAt, decision.decision], [office, proof.at, 'approved'])
  }

  // Current report authority governs both reads, including after withdrawal.
  const role = await h.command('role.save', { name: 'Cost inspector', permissions: ['reports.read', 'export.read'] })
  const inspector = await h.person('Cost Inspector', `custom:${role.id}`)
  assert.equal((await cost(inspector.cookie)).costing.revenue, '2675.00')
  await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: ['export.read'] })
  const beforeReads = await domain()
  for (const as of [b.priyaPerson.cookie, b.tomPerson.cookie, inspector.cookie, '']) {
    const status = as ? 403 : 401
    assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as })).status, status)
    assert.equal((await h.request('/api/glove/reports/costing?from=2026-10-21&to=2026-10-21', { as })).status, status)
  }
  const redacted = await h.request('/api/glove/export', { as: inspector.cookie }).then(r => r.json())
  assert.ok(redacted.jobs.find(j => j.id === job.id).lines.every(l => l.unitCost === undefined))
  assert.ok(redacted.technicians.every(x => x.costRate === undefined))
  assert.deepEqual(await domain(), beforeReads, 'report refusals and redacted exports change no domain records')
})
