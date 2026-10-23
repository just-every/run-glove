// API-005 workflow rules through the command and state doors: two rules
// triggered and logged with their effect, a rule switched off, and a rule an
// office person made that cannot book a visit.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, completedJob } from './harness.mjs'

test('DATA-002 / API-005 / PLAN-004 two rules run with a log and an effect; an office rule cannot book a visit', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const quote = async (price, source = 'phone') => {
    const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source, description: 'New system' })
    const q = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, enquiryId: request.id, title: 'New system', lines: [{ description: 'Ducted system', quantity: '1', unitPrice: price }] })
    return b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
  }

  // The owner: a big quote approved notifies the owner; a new job books its first visit with Priya two days out.
  await b.dispatcher.run('rule.save', { name: 'Big quote', trigger: 'quote.approved', condition: { over: '5000.00' }, action: { kind: 'notify', to: 'owner', message: 'call the customer' } }, { error: 'FORBIDDEN' })
  const big = await h.command('rule.save', { name: 'Big quote', trigger: 'quote.approved', condition: { over: '5000.00' }, action: { kind: 'notify', to: 'owner', message: 'call the customer' } })
  let first = await h.command('rule.save', { name: 'First visit', trigger: 'job.created', action: { kind: 'book', technicianId: b.priya.id, afterDays: 2, start: '08:00', end: '09:00' } })
  await h.command('rule.save', { name: 'Bad', trigger: 'quote.approved', action: { kind: 'book', technicianId: b.priya.id, afterDays: 2, start: '08:00', end: '09:00' } }, { error: 'INPUT' })
  // An office person's rule books too, which the office role cannot do.
  const officeRule = await b.office.run('rule.save', { name: 'Office books', trigger: 'job.created', action: { kind: 'book', technicianId: b.tom.id, afterDays: 3, start: '10:00', end: '11:00' } })

  const small = await quote('189.00')
  const large = await quote('6200.00')
  let s = await h.state()
  assert.deepEqual(s.ruleRuns.map(r => [r.rule, r.trigger.subjectId, r.outcome, r.detail]), [['Big quote', large.id, 'done', 'notice to owner']])
  assert.ok(!s.ruleRuns.some(r => r.trigger.subjectId === small.id))
  assert.deepEqual(s.notices.map(n => n.message), ['Big quote: call the customer'])
  assert.deepEqual((await b.dispatcher.state()).notices, [], 'a notice goes to the role it names')

  // A job from the large quote: the owner's rule books Priya two days out; the office rule is refused and books nothing.
  await b.dispatcher.run('quote.accept', { quoteId: large.id, version: large.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const job = await b.dispatcher.run('job.create', { quoteId: large.id })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
  const inTwo = new Date(Date.parse(`${today}T00:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10)
  s = await h.state()
  assert.deepEqual(s.visits.filter(v => v.jobId === job.id).map(v => [v.technicianId, v.local.date, v.local.start, v.assignments[0].reason]), [[b.priya.id, inTwo, '08:00', 'Booked by the rule "First visit"']])
  // Runs of one command share a time, so they are compared by rule.
  const runs = s.ruleRuns.filter(r => r.trigger.subjectId === job.id).map(r => [r.rule, r.outcome]).sort()
  assert.deepEqual(runs, [['First visit', 'done'], ['Office books', 'not allowed']])
  assert.match(s.ruleRuns.find(r => r.ruleId === officeRule.id).detail, /cannot visit\.book/)

  // Switched off, a rule no longer runs; only its creator or the owner changes it.
  await b.office.run('rule.save', { id: first.id, version: first.version, name: 'First visit', trigger: 'job.created', action: first.action, enabled: false }, { error: 'FORBIDDEN' })
  first = await h.command('rule.save', { id: first.id, version: first.version, name: 'First visit', trigger: 'job.created', action: first.action, enabled: false })
  const again = await quote('300.00')
  await b.dispatcher.run('quote.accept', { quoteId: again.id, version: again.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const second = await b.dispatcher.run('job.create', { quoteId: again.id })
  s = await h.state()
  assert.deepEqual(s.ruleRuns.filter(r => r.trigger.subjectId === second.id).map(r => r.rule), ['Office books'])
  assert.equal(s.visits.filter(v => v.jobId === second.id).length, 0)
  // PLAN-004 gives the human Office role included-visit booking, while
  // API-005's automatic Office booking ban remains in force for these too.
  const plan = await h.command('plan.save', { name: 'Maintenance', price: '228.00', termMonths: 12, includedVisits: 1, visitServiceId: b.service.id })
  const agreement = await b.office.run('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, via: 'phone', startDate: today })
  const included = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, agreementId: agreement.id, title: 'Included maintenance' })
  s = await h.state()
  assert.equal(s.ruleRuns.find(r => r.ruleId === officeRule.id && r.trigger.subjectId === included.id).outcome, 'not allowed')
  assert.equal(s.visits.filter(v => v.jobId === included.id).length, 0)
  // A completed job leaves its invoice to a named office person, by notice.
  await b.office.run('rule.save', { name: 'Invoice it', trigger: 'job.completed', action: { kind: 'notify', to: `person:${b.priyaPerson.id}`, message: 'prepare the invoice' } }, { error: 'INPUT' })
  await b.office.run('rule.save', { name: 'Invoice it', trigger: 'job.completed', action: { kind: 'notify', to: `person:${b.office.id}`, message: 'prepare the invoice' } })
  const { job: done } = await completedJob(h, b)
  assert.deepEqual((await b.office.state()).notices.map(n => n.message).filter(m => m.startsWith('Invoice it')), [`Invoice it: ${done.number} prepare the invoice`])
  assert.ok(!(await b.dispatcher.state()).notices.some(n => n.message.startsWith('Invoice it')))
  // A completed job's invoice preparation assigned to a named office person; assigning to someone who cannot prepare invoices is refused.
  await b.office.run('rule.save', { name: 'Olu invoices', trigger: 'job.completed', action: { kind: 'assign', personId: b.dispatcher.id } }, { error: 'INPUT' })
  await b.office.run('rule.save', { name: 'Olu invoices', trigger: 'job.created', action: { kind: 'assign', personId: b.office.id } }, { error: 'INPUT' })
  await b.office.run('rule.save', { name: 'Olu invoices', trigger: 'job.completed', action: { kind: 'assign', personId: b.office.id } })
  const { job: assigned } = await completedJob(h, b, '2026-10-24')
  const after = await h.state()
  assert.deepEqual(after.jobs.find(j => j.id === assigned.id).invoiceAssignee.name, 'Olu Office')
  assert.deepEqual(after.ruleRuns.filter(r => r.rule === 'Olu invoices').map(r => [r.outcome, r.detail]), [['done', 'invoice preparation assigned to Olu Office']])
  assert.ok((await b.office.state()).notices.some(n => n.message === `Olu invoices: prepare the invoice for ${assigned.number}`))
  assert.ok(big)
  const { activity } = await assertTrail(h, ['rule.saved', 'rule.ran', 'job.invoiceAssigned'])
  const assignment = activity.find(e => e.kind === 'job.invoiceAssigned' && e.jobId === assigned.id)
  assert.deepEqual([assignment.actorId, assignment.actorRole], [b.office.id, 'office'], 'invoice assignment is the rule creator’s action')
  assert.match(assignment.actorName, /Olu Office/)
  const completion = activity.find(e => e.kind === 'job.completed' && e.jobId === assigned.id)
  assert.equal(completion.actorId, b.priyaPerson.id, 'the triggering completion keeps the technician’s identity')
  assert.equal(assignment.commandId, completion.commandId, 'both facts belong to the triggering command')
})

test('a deactivated person\'s workflow rules stop acting', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const rule = await b.office.run('rule.save', { name: 'Directory leads', trigger: 'enquiry.created', action: { kind: 'leadCost', amount: '9999.00' } })
  const deactivated = await h.request('/auth/operator/status', { method: 'POST', body: { operatorId: b.office.id, status: 'inactive' } })
  assert.equal(deactivated.status, 200, await deactivated.text())
  const request = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'New system' })
  const s = await h.state()
  assert.equal(s.enquiries.find(e => e.id === request.id).leadCost, undefined, 'no lead cost from the rule')
  assert.deepEqual(s.ruleRuns.filter(r => r.ruleId === rule.id).map(r => r.outcome), ['not allowed'])
})
