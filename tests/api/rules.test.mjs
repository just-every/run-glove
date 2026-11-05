// API-005 workflow rules through the command and state doors: two rules
// triggered and logged with their effect, a rule switched off, and a rule an
// office person made that cannot book a visit.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, completedJob, id } from './harness.mjs'

test('DATA-002, DATA-009, DATA-010 / API-005 / PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 two rules run with a log and an effect; an office rule cannot book a visit', async (t) => {
  const h = await installation({ at: '2026-11-05T12:00:00Z' })
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
  const today = '2026-11-05'
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
  await noticeRuleLifecycle(h, b)
})

// One native rule lifecycle: persisted definitions, historical execution facts,
// exact requests and audiences, current authority and once-only effects.
async function noticeRuleLifecycle(h, b) {
  const owner = (await h.state()).actor, peer = await h.person('Rae Office', 'office')
  const outboundBefore = [h.mails.length, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length, h.quickbooks.calls.length, h.models.calls.length, h.marketing.length, h.pushes.sent.length]
  const ids = [], requests = [], expectedRuns = [], expectedNotices = []
  const make = (name, to, message) => ({ name, trigger: 'enquiry.created', condition: { source: 'website' }, action: { kind: 'notify', to, message } })
  let own = await h.command('rule.save', make('Owner intake', 'owner', 'Review new intake'))
  let office = await b.office.run('rule.save', make('Office intake', `person:${b.office.id}`, 'Prepare intake'))
  ids.push(own.id, office.id)
  assert.deepEqual(own.createdBy, { id: owner.id, name: 'Olivia Owner', role: 'owner' })
  assert.deepEqual(office.createdBy, { id: b.office.id, name: 'Olu Office', role: 'office' })
  const definitions = () => h.state().then(s => s.rules.filter(r => ids.includes(r.id)))
  const edit = rule => ({ ...rule, condition: rule.condition, action: rule.action })
  const definitionVersions = [own, office]
  const beforeRefusals = await definitions()
  await peer.run('rule.save', { ...edit(office), name: 'Other person takes over' }, { error: 'FORBIDDEN' })
  await b.office.run('rule.save', { ...edit(own), enabled: false }, { error: 'FORBIDDEN' })
  await b.dispatcher.run('rule.save', edit(own), { error: 'FORBIDDEN' })
  assert.deepEqual(await definitions(), beforeRefusals, 'refused edits change neither definition nor version')

  const trigger = async (description, rules) => {
    const commandId = id(), input = { customerId: b.customer.id, siteId: b.site.id, source: 'website', description }
    const request = await b.dispatcher.run('enquiry.create', input, { commandId })
    requests.push({ request, commandId, input })
    for (const [rule, role, outcome] of rules) {
      expectedRuns.push([rule.id, rule.version, request.id, rule.createdBy.id, role, outcome, outcome === 'done' ? `notice to ${rule.action.to}` : 'Olu Office no longer holds a desk role', rule.action])
      if (outcome === 'done') expectedNotices.push([rule.id, request.id, [rule.action.to], `${rule.name}: ${rule.action.message}`])
    }
    return request
  }
  await trigger('First exact source request', [[own, 'owner', 'done'], [office, 'office', 'done']])
  office = await b.office.run('rule.save', { ...edit(office), action: { kind: 'notify', to: 'dispatcher', message: 'Arrange intake review' } })
  own = await h.command('rule.save', { ...edit(own), action: { kind: 'notify', to: `person:${b.office.id}`, message: 'Owner requests office review' } })
  definitionVersions.push(own, office)
  assert.equal(office.version, 2)
  assert.equal(own.version, 2)
  await trigger('Second exact source request', [[own, 'owner', 'done'], [office, 'office', 'done']])
  office = await h.command('rule.save', { ...edit(office), action: { kind: 'notify', to: 'office', message: 'Owner updated office instructions' } })
  definitionVersions.push(office)
  assert.equal(office.version, 3)
  assert.deepEqual(office.createdBy, { id: b.office.id, name: 'Olu Office', role: 'office' }, 'Owner edit preserves original creator')
  await b.office.run('rule.save', { ...edit(office), version: 2 }, { error: 'STALE' })
  await trigger('Third exact source request', [[own, 'owner', 'done'], [office, 'office', 'done']])
  // Keep both rules enabled for these probes: disabling them first would hide
  // an accidental second execution after replay or an unrelated command.
  const activeBefore = await h.request('/api/glove/export').then(r => r.json())
  for (const r of requests) assert.deepEqual(await b.dispatcher.run('enquiry.create', r.input, { commandId: r.commandId }), r.request)
  await h.command('service.save', { code: 'SYNTHETIC-RULE-ACTIVE', name: 'Unrelated active-rule service', unitPrice: '1.00', tax: 'FREE' })
  await h.restart()
  for (const r of requests) assert.deepEqual(await b.dispatcher.run('enquiry.create', r.input, { commandId: r.commandId }), r.request)
  const activeAfter = await h.request('/api/glove/export').then(r => r.json())
  assert.deepEqual(activeAfter.ruleRuns, activeBefore.ruleRuns, 'enabled rules do not run again after replay, unrelated commands or Worker restart')
  assert.deepEqual(activeAfter.notices, activeBefore.notices, 'enabled rule effects remain once only')
  own = await h.command('rule.save', { ...edit(own), enabled: false })
  definitionVersions.push(own)
  assert.equal(own.version, 3)
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await trigger('Authority withdrawn source request', [[office, 'viewer', 'not allowed']])
  await b.office.run('rule.save', { ...edit(office), enabled: false }, { error: 'FORBIDDEN' })
  office = await h.command('rule.save', { ...edit(office), enabled: false })
  definitionVersions.push(office)
  assert.equal(office.version, 4)
  await trigger('Both rules disabled source request', [])
  const unrelated = await b.dispatcher.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Different source' })
  await b.dispatcher.run('enquiry.contact', { enquiryId: unrelated.id, version: unrelated.version })

  const full = () => h.request('/api/glove/export').then(r => r.json())
  const projection = s => ({ rules: s.rules.filter(r => ids.includes(r.id)), runs: s.ruleRuns.filter(r => ids.includes(r.ruleId)), notices: s.notices.filter(n => ids.includes(n.ruleId)) })
  const beforeRestart = projection(await full())
  assert.deepEqual(definitionVersions.map(r => [r.id, r.version, r.enabled, r.action.to, r.action.message, r.createdBy.id]), [
    [own.id, 1, true, 'owner', 'Review new intake', owner.id],
    [office.id, 1, true, `person:${b.office.id}`, 'Prepare intake', b.office.id],
    [own.id, 2, true, `person:${b.office.id}`, 'Owner requests office review', owner.id],
    [office.id, 2, true, 'dispatcher', 'Arrange intake review', b.office.id],
    [office.id, 3, true, 'office', 'Owner updated office instructions', b.office.id],
    [own.id, 3, false, `person:${b.office.id}`, 'Owner requests office review', owner.id],
    [office.id, 4, false, 'office', 'Owner updated office instructions', b.office.id],
  ], 'each accepted definition version retains independently expected creator, state and instructions')
  const sorted = rows => rows.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  assert.deepEqual(sorted(beforeRestart.runs.map(r => [r.ruleId, r.ruleVersion, r.trigger.subjectId, r.executedBy.id, r.executedBy.role, r.outcome, r.detail, r.action])), sorted(expectedRuns))
  assert.deepEqual(sorted(beforeRestart.notices.map(n => [n.ruleId, n.subjectId, n.to, n.message])), sorted(expectedNotices))
  for (const run of beforeRestart.runs) {
    assert.deepEqual(run.trigger, { kind: 'enquiry.created', subjectId: run.trigger.subjectId, jobId: null })
    assert.deepEqual(run.createdBy, run.ruleId === own.id ? { id: owner.id, name: 'Olivia Owner', role: 'owner' } : { id: b.office.id, name: 'Olu Office', role: 'office' })
    assert.equal(run.createdAt, '2026-11-05T12:00:00.000Z')
    const notice = beforeRestart.notices.find(n => n.id === run.noticeId)
    assert.equal(!!notice, run.outcome === 'done')
    if (notice) assert.deepEqual([notice.ruleId, notice.subjectId, notice.to], [run.ruleId, run.trigger.subjectId, [run.action.to]])
  }
  const audience = s => s.notices.filter(n => ids.includes(n.ruleId)).map(n => n.id).sort()
  assert.deepEqual(audience(await b.dispatcher.state()), beforeRestart.notices.filter(n => n.to.includes('dispatcher')).map(n => n.id).sort())
  assert.deepEqual(audience(await peer.state()), beforeRestart.notices.filter(n => n.to.includes('office')).map(n => n.id).sort())
  assert.deepEqual(audience(await b.office.state()), beforeRestart.notices.filter(n => n.to.includes(`person:${b.office.id}`)).map(n => n.id).sort(), 'current role receives only previously addressed personal notices')
  assert.deepEqual(audience(await h.state()), beforeRestart.notices.filter(n => n.to.includes('owner')).map(n => n.id).sort())
  for (const r of requests) assert.deepEqual(await b.dispatcher.run('enquiry.create', r.input, { commandId: r.commandId }), r.request)
  await h.restart()
  const restarted = await full()
  for (const r of requests) assert.deepEqual(restarted.enquiries.find(e => e.id === r.request.id), r.request)
  assert.deepEqual(projection(restarted), beforeRestart, 'actual Worker restart preserves exact definitions, runs and notices')
  for (const r of requests) assert.deepEqual(await b.dispatcher.run('enquiry.create', r.input, { commandId: r.commandId }), r.request)
  await h.command('service.save', { code: 'SYNTHETIC-RULE', name: 'Unrelated service', unitPrice: '1.00', tax: 'FREE' })
  assert.deepEqual(projection(await full()), beforeRestart, 'restart, unrelated commands and replay do not repeat or cascade effects')

  const { activity, exported } = await assertTrail(h, ['rule.saved', 'rule.ran'])
  for (const run of beforeRestart.runs) {
    const request = requests.find(r => r.request.id === run.trigger.subjectId)
    const recorded = activity.find(e => e.kind === 'rule.ran' && e.commandId === request.commandId && e.subjectId === run.ruleId)
    assert.ok(recorded, 'each exact run is readable in Activity')
    assert.deepEqual([recorded.actorId, recorded.actorRole, recorded.commandId, recorded.subjectId], [run.executedBy.id, run.executedBy.role, request.commandId, run.ruleId])
    assert.equal(recorded.actorName, `${run.createdBy.name} (rule "${run.rule}")`)
    assert.equal(recorded.summary, `Rule ${run.rule}: ${run.outcome}; ${run.detail}`)
    const kept = exported.timeline.find(e => e.id === recorded.id)
    assert.ok(kept, 'every exact run is exported')
    const data = JSON.parse(kept.data)
    assert.deepEqual([data.runId, data.ruleVersion, data.trigger, data.outcome, data.detail, data.noticeId], [run.id, run.ruleVersion, run.trigger, run.outcome, run.detail, run.noticeId])
    assert.deepEqual([kept.actor_id, kept.actor_role, kept.command_id], [run.executedBy.id, run.executedBy.role, request.commandId])
  }
  assert.deepEqual([h.mails.length, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length, h.quickbooks.calls.length, h.models.calls.length, h.marketing.length, h.pushes.sent.length], outboundBefore, 'notice rules make no outbound provider attempt')

  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const erased = projection(await full())
  for (const r of requests) await b.dispatcher.run('enquiry.create', r.input, { commandId: r.commandId, error: 'ERASED' })
  await h.restart()
  const afterErasure = projection(await full())
  assert.deepEqual(afterErasure, erased, 'erased source records cannot return or repeat effects after replay and restart')
  assert.equal(afterErasure.notices.length, 0)
  assert.ok(!JSON.stringify(afterErasure.runs).includes(requests[0].request.id), 'erasure removes the run source identity')
}
