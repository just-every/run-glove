import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

// AGENT-003 (ct approved as pattern-1 DONE, 19 Oct): the delay watch flags the
// visit after a job that runs long and a visit whose parts are not received,
// offers feasible moves, the agent proposes one, a dispatcher approves it, and
// under a grant the agent moves a visit itself only inside its arrival window.

test('AGENT-003: a job runs long, the agent proposes moving the next visit to another technician and the dispatcher approves', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const job = async title => b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, title)).id })
  const date = '2026-10-22', [first, next] = [await job('Morning service'), await job('Second service')]
  const long = await b.dispatcher.run('visit.book', { jobId: first.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
  const later = await b.dispatcher.run('visit.book', { jobId: next.id, technicianId: b.priya.id, date, start: '10:30', end: '11:30', window: { start: '10:00', end: '12:00' } })
  await b.priyaPerson.run('visit.arrive', { visitId: long.id, deviceTime: long.startAt })
  const at = new Date(Date.parse(long.endAt) + 20 * 60_000).toISOString()

  // Twenty minutes past the booked end, Priya is expected free at 10:40: the 10:30 visit is at risk.
  assert.equal((await h.request(`/api/glove/delays?at=${at}`, { as: b.priyaPerson.cookie })).status, 403)
  const watch = await (await h.request(`/api/glove/delays?at=${at}`, { as: b.agent.cookie })).json()
  const risk = watch.risks.find(r => r.visitId === later.id)
  assert.ok(risk, JSON.stringify(watch))
  assert.match(risk.reasons[0], /still on .*20 min past its booked end; expected free about 10:40/)
  assert.deepEqual(risk.options.map(o => [o.technicianId, o.start, o.customer]), [[b.tom.id, '10:30', 'unchanged'], [b.priya.id, '10:45', 'unchanged']])

  // The agent proposes Tom at the same time; the agent cannot approve its own proposal; a dispatcher approves with GLOVE-07 review.
  const option = risk.options[0]
  const proposal = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: option.technicianId, start: option.start, end: option.end }, rationale: risk.reasons[0] })
  assert.deepEqual([proposal.customer, proposal.plan.technicianId], ['unchanged', b.tom.id])
  await b.agent.run('proposal.approve', { proposalId: proposal.id, version: proposal.version }, { error: 'FORBIDDEN' })
  await b.dispatcher.run('proposal.approve', { proposalId: proposal.id, version: proposal.version })
  const moved = (await h.state()).visits.find(v => v.id === later.id)
  assert.deepEqual([moved.technicianId, moved.local.start, moved.arrivalWindow], [b.tom.id, '10:30', { start: '10:00', end: '12:00' }])
  assert.ok((await h.state()).events.some(e => e.kind === 'visit.changed' && e.subjectId === later.id && /Approved delay proposal from Ada Agent/.test(e.summary)))
  assert.ok(!(await (await h.request(`/api/glove/delays?at=${at}`, { as: b.dispatcher.cookie })).json()).risks.some(r => r.visitId === later.id))

  // Under a grant the agent moves the visit itself only inside the promised window, never changing it.
  await h.command('grant.create', { agentId: b.agent.id, action: 'visit.change' })
  const inside = await b.agent.run('visit.change', { visitId: later.id, version: moved.version, start: '11:00', end: '12:00', reason: 'Tom is finishing nearby' })
  assert.deepEqual([inside.local.start, inside.arrivalWindow], ['11:00', { start: '10:00', end: '12:00' }])
  await b.agent.run('visit.change', { visitId: later.id, version: inside.version, start: '13:00', end: '14:00', reason: 'Afternoon' }, { error: 'WINDOW' })
  await b.agent.run('visit.change', { visitId: later.id, version: inside.version, start: '13:00', end: '14:00', window: { start: '13:00', end: '15:00' }, reason: 'Afternoon' }, { error: 'GRANT_SCOPE' })

  // A move outside the window is a proposal labelled "customer not yet asked"; approving it drops the old promise.
  const outside = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: b.tom.id, start: '14:00', end: '15:00' }, rationale: 'Customer prefers after lunch' })
  assert.equal(outside.customer, 'customer not yet asked')
  await b.dispatcher.run('proposal.approve', { proposalId: outside.id, version: outside.version })
  const afternoon = (await h.state()).visits.find(v => v.id === later.id)
  assert.deepEqual([afternoon.local.start, afternoon.arrivalWindow], ['14:00', undefined])
  assert.ok((await h.state()).events.some(e => e.subjectId === outside.id && e.kind === 'proposal.prepared' && /customer not yet asked/.test(e.summary)))

  // Without a promised window, even an open same-day slot needs dispatcher approval.
  const beforeUnbounded = await h.state()
  await b.agent.run('visit.change', { visitId: later.id, version: afternoon.version, start: '15:00', end: '16:00', reason: 'No customer window on record' }, { error: 'GRANT_SCOPE' })
  const afterUnbounded = await h.state()
  assert.deepEqual(afterUnbounded.visits.find(v => v.id === later.id), afternoon, 'the refused move keeps the visit unchanged')
  assert.deepEqual(afterUnbounded.grants, beforeUnbounded.grants, 'a refused move consumes no grant use')
  const reviewed = await b.agent.run('proposal.prepare', { kind: 'move', visitId: later.id, plan: { technicianId: b.tom.id, start: '15:00', end: '16:00' }, rationale: 'Dispatcher must review a visit without a promised window' })
  assert.equal(reviewed.customer, 'customer not yet asked')
  await b.dispatcher.run('proposal.approve', { proposalId: reviewed.id, version: reviewed.version })
  assert.equal((await h.state()).visits.find(v => v.id === later.id).local.start, '15:00')

  // A purchase order for a visit's job not yet received puts that visit on the watch too.
  const cap = await h.command('service.save', { code: 'CAP-45', name: 'Run capacitor', kind: 'material', unit: 'each', unitCost: '11.50', unitPrice: '35.00', tax: 'GST' })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Balmain warehouse' })
  const parts = await job('Capacitor swap')
  const partsVisit = await b.dispatcher.run('visit.book', { jobId: parts.id, technicianId: b.tom.id, date: '2026-10-23', start: '09:00', end: '10:00' })
  const po = await b.office.run('po.save', { supplier: 'Supply Co', locationId: warehouse.id, jobId: parts.id, lines: [{ serviceId: cap.id, quantity: '1' }] })
  const flagged = (await (await h.request(`/api/glove/delays?at=${at}`)).json()).risks.find(r => r.visitId === partsVisit.id)
  assert.match(flagged.reasons[0], new RegExp(`${po.number} from Supply Co is draft`))
})
