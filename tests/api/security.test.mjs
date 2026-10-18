// Authority is enforced by every command handler and read door, not by the
// screens: each role is sent every command directly over HTTP.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, completedJob } from './harness.mjs'

// Who may send each command (CONTRACT.md, "People and authority").
const allowed = {
  'business.save': ['owner'], 'role.set': ['owner'],
  'service.save': ['owner'], 'technician.save': ['owner'],
  'customer.save': ['owner', 'dispatcher', 'office'], 'site.save': ['owner', 'dispatcher', 'office'], 'equipment.save': ['owner', 'dispatcher', 'office', 'technician'],
  'enquiry.create': ['owner', 'dispatcher', 'office', 'agent'], 'enquiry.contact': ['owner', 'dispatcher', 'office'], 'enquiry.close': ['owner', 'dispatcher', 'office'],
  'quote.draft': ['owner', 'dispatcher', 'agent'], 'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'], 'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'], 'quote.decline': ['owner', 'dispatcher'],
  'job.create': ['owner', 'dispatcher'], 'visit.book': ['owner', 'dispatcher'], 'visit.change': ['owner', 'dispatcher'],
  'visit.cancel': ['owner', 'dispatcher'], 'visit.reviewLateEvidence': ['owner', 'dispatcher'],
  'proposal.prepare': ['owner', 'dispatcher', 'agent'], 'proposal.approve': ['owner', 'dispatcher'], 'proposal.decline': ['owner', 'dispatcher'],
  'visit.arrive': ['technician'], 'visit.capture': ['technician'], 'visit.complete': ['technician'],
  'expense.record': ['owner', 'office', 'technician'], 'expense.price': ['owner', 'office'],
  'invoice.prepare': ['owner', 'office', 'agent'], 'invoice.revise': ['owner', 'office', 'agent'],
  'invoice.approve': ['owner', 'office'], 'invoice.export': ['owner', 'office'], 'invoice.correct': ['owner', 'office'],
  'import.stage': ['owner'], 'import.commit': ['owner'], 'import.undo': ['owner'],
}

test('every command and read door checks the current session and role', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const viewer = await h.person('Vic Viewer', 'viewer')
  const people = { owner: { run: h.command, cookie: h.owner() }, dispatcher: b.dispatcher, technician: b.priyaPerson, office: b.office, agent: b.agent, viewer }

  await t.test('each role is refused exactly the commands it does not hold', async () => {
    for (const [type, roles] of Object.entries(allowed)) for (const [role, person] of Object.entries(people)) {
      const res = await h.request('/api/glove/commands', { method: 'POST', as: person.cookie, body: { commandId: randomUUID(), type, payload: {} } })
      const body = await res.json()
      if (roles.includes(role)) assert.notEqual(body.error?.code, 'FORBIDDEN', `${role} may send ${type}`)
      else { assert.equal(res.status, 403, `${role} must not send ${type}`); assert.equal(body.error.code, 'FORBIDDEN') }
    }
  })

  await t.test('signed-out, revoked and cross-origin requests change nothing', async () => {
    assert.equal((await h.request('/api/glove/state', { as: '' })).status, 401)
    const crossOrigin = await h.request('/api/glove/commands', { method: 'POST', headers: { origin: 'https://attacker.example' }, body: { commandId: randomUUID(), type: 'customer.save', payload: { name: 'Injected' } } })
    assert.equal(crossOrigin.status, 403)
    const revoked = await h.request('/auth/session/revoke', { method: 'POST', body: { sessionId: b.office.session.id } })
    assert.ok(revoked.status < 400, await revoked.text())
    assert.equal((await h.request('/api/glove/state', { as: b.office.cookie })).status, 401)
    const denied = await h.request('/api/glove/commands', { method: 'POST', as: b.office.cookie, body: { commandId: randomUUID(), type: 'customer.save', payload: { name: 'After revoke' } } })
    assert.equal(denied.status, 401)
    assert.ok(!(await h.state()).customers.some(c => /Injected|After revoke/.test(c.name)))
  })

  await t.test('a role change applies to the very next request', async () => {
    await b.dispatcher.run('customer.save', { name: 'Allowed while dispatcher' })
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await b.dispatcher.run('customer.save', { name: 'Refused as viewer' }, { error: 'FORBIDDEN' })
    assert.ok(!(await h.state()).customers.some(c => c.name === 'Refused as viewer'))
    await h.command('role.set', { operatorId: (await h.state()).actor.id, role: 'viewer' }, { error: 'OWN_ROLE' })
  })

  await t.test('a command identity replays its outcome only for the same person and content', async () => {
    const commandId = randomUUID()
    const first = await h.command('customer.save', { name: 'Once only' }, { commandId })
    assert.deepEqual(await h.command('customer.save', { name: 'Once only' }, { commandId }), first)
    await h.command('customer.save', { name: 'Different' }, { commandId, error: 'IDEMPOTENCY' })
    const desk = await h.person('Dana Desk', 'office')
    await desk.run('customer.save', { name: 'Once only' }, { commandId, error: 'IDEMPOTENCY' })
    assert.equal((await h.state()).customers.filter(c => c.name === 'Once only').length, 1)
  })
})

test('a technician never reads a price, in records or in the timeline', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  let inv = await b.office.run('invoice.prepare', { jobId: job.id })
  inv = await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Add the call-out', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00' }, { description: 'Call-out', quantity: '1', unitPrice: '60.00' }] })
  const desk = await h.state()
  assert.ok(desk.events.some(e => /\$/.test(e.summary)), 'the desk timeline carries prices')
  const tech = await b.priyaPerson.state()
  assert.ok(tech.events.some(e => e.jobId === job.id), 'the technician still sees their job\'s field steps')
  const timeline = await (await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: b.priyaPerson.cookie })).json()
  for (const e of [...tech.events, ...timeline.events]) {
    assert.ok(!/\$|incl\. tax/.test(e.summary), `no price in ${e.kind}: ${e.summary}`)
    assert.ok(!['invoice', 'quote', 'proposal'].includes(e.subjectKind), `no ${e.subjectKind} event`)
  }
})
