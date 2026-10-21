import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

// AGENT-009: the owner grants an agent named actions with limits, a daily
// budget and quiet hours; every use records the grant; revoking applies to
// the next command; one switch pauses every agent.

test('AGENT-009: an agent books tune-ups under $200 only under an active grant', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const tune = await h.command('service.save', { code: 'TUNE', name: 'Tune-up', unitPrice: '149.00', tax: 'GST' })
  const job = async (price) => {
    const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Tune-up', lines: [{ description: 'Tune-up', quantity: '1', unitPrice: price, serviceId: tune.id }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    const accepted = await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
    return b.dispatcher.run('job.create', { quoteId: accepted.id })
  }
  const slot = (j, start, end) => ({ jobId: j.id, technicianId: b.priya.id, date: '2026-10-27', start, end })
  const [cheap, second, third, dear] = [await job('149.00'), await job('149.00'), await job('149.00'), await job('250.00')]

  await b.agent.run('visit.book', slot(cheap, '08:00', '09:00'), { error: 'FORBIDDEN' })
  await b.agent.run('grant.create', { agentId: b.agent.id, action: 'visit.book' }, { error: 'FORBIDDEN' })
  await h.command('grant.create', { agentId: b.dispatcher.id, action: 'visit.book' }, { error: 'AGENT' })
  const grant = await h.command('grant.create', { agentId: b.agent.id, action: 'visit.book', serviceIds: [tune.id], maxSubtotal: '200.00', dailyLimit: 2 })

  const visit = await b.agent.run('visit.book', { ...slot(cheap, '08:00', '09:00'), window: { start: '08:00', end: '15:00' } })
  assert.equal(visit.assignments[0].grantId, grant.id)
  const desk = await h.state()
  assert.ok(desk.events.some(e => e.subjectId === visit.id && /under the owner's grant to book Tune-up under \$200\.00/.test(e.summary)))
  assert.deepEqual(desk.grants.find(g => g.id === grant.id).uses.map(u => u.subjectId), [visit.id])

  assert.match((await b.agent.run('visit.book', slot(dear, '10:00', '11:00'), { error: 'GRANT_SCOPE' })).message, /over this grant's \$200\.00 limit/)
  await b.agent.run('visit.book', slot(second, '08:30', '09:30'), { error: 'GRANT_SCOPE' }) // not an open slot
  await b.agent.run('visit.book', slot(second, '10:00', '11:00'))
  await b.agent.run('visit.book', slot(third, '12:00', '13:00'), { error: 'BUDGET' })

  // Revocation applies to the very next command.
  const current = (await h.state()).grants.find(g => g.id === grant.id)
  await h.command('grant.revoke', { grantId: grant.id, version: current.version })
  await b.agent.run('visit.book', slot(third, '12:00', '13:00'), { error: 'FORBIDDEN' })

  // Quiet hours around now refuse a move; the move grant otherwise keeps a visit within its day.
  const zone = (await h.state()).business[0].timezone
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  const at = n => `${String((hour + n + 24) % 24).padStart(2, '0')}:00`
  const move = await h.command('grant.create', { agentId: b.agent.id, action: 'visit.change', quietHours: { start: at(-1), end: at(2) } })
  const booked = (await h.state()).visits.find(v => v.id === visit.id)
  await b.agent.run('visit.change', { visitId: visit.id, version: booked.version, start: '14:00', end: '15:00', reason: 'Customer asked' }, { error: 'QUIET_HOURS' })
  await h.command('grant.revoke', { grantId: move.id, version: move.version })
  const anytime = await h.command('grant.create', { agentId: b.agent.id, action: 'visit.change' })
  await b.agent.run('visit.change', { visitId: visit.id, version: booked.version, date: '2026-10-28', reason: 'Next day' }, { error: 'GRANT_SCOPE' })
  const moved = await b.agent.run('visit.change', { visitId: visit.id, version: booked.version, start: '14:00', end: '15:00', reason: 'Customer asked' })
  assert.equal(moved.assignments.at(-1).grantId, anytime.id)

  // One switch pauses every agent, preparing included.
  await h.command('agents.pause', { paused: true })
  await b.agent.run('visit.change', { visitId: visit.id, version: moved.version, start: '15:00', end: '16:00', reason: 'Again' }, { error: 'PAUSED' })
  await b.agent.run('enquiry.create', { customerId: b.customer.id, description: 'Noisy unit' }, { error: 'PAUSED' })
  await h.command('agents.pause', { paused: false })
  await b.agent.run('enquiry.create', { customerId: b.customer.id, description: 'Noisy unit' })
})
