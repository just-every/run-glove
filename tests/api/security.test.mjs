// Authority is enforced by every command handler and read door, not by the
// screens: each role is sent every command directly over HTTP.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, completedJob, acceptedQuote } from './harness.mjs'

// Who may send each command (CONTRACT.md, "People and authority").
const allowed = {
  'business.save': ['owner'], 'branch.save': ['owner'], 'role.set': ['owner'], 'role.save': ['owner'],
  'grant.create': ['owner'], 'grant.revoke': ['owner'], 'agents.pause': ['owner'],
  'service.save': ['owner'], 'form.save': ['owner'], 'pricebook.category': ['owner'], 'pricebook.adjust': ['owner'], 'pricebook.import': ['owner'], 'technician.save': ['owner'], 'stock.location': ['owner', 'office'], 'stock.count': ['owner', 'office'], 'stock.restock': ['owner', 'office'], 'stock.transfer': ['owner', 'office'], 'po.save': ['owner', 'office'], 'po.send': ['owner', 'office'], 'po.receive': ['owner', 'office'], 'rule.save': ['owner', 'office'], 'field.save': ['owner'], 'record.custom': ['owner', 'dispatcher', 'office'], 'customer.tags': ['owner', 'dispatcher', 'office'], 'segment.save': ['owner', 'dispatcher', 'office'], 'marketing.connect': ['owner'], 'segment.push': ['owner', 'office'], 'technician.calendar': ['owner', 'technician'], 'technician.calendarRead': ['owner', 'dispatcher', 'technician'],
  'customer.save': ['owner', 'dispatcher', 'office'], 'site.save': ['owner', 'dispatcher', 'office'], 'customer.merge': ['owner', 'dispatcher', 'office'], 'customer.unmerge': ['owner', 'dispatcher', 'office'], 'equipment.save': ['owner', 'dispatcher', 'office', 'technician'],
  'enquiry.create': ['owner', 'dispatcher', 'office', 'agent'], 'enquiry.contact': ['owner', 'dispatcher', 'office'], 'enquiry.close': ['owner', 'dispatcher', 'office'],
  'template.save': ['owner'], 'quote.draft': ['owner', 'dispatcher', 'agent'], 'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'], 'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'], 'quote.decline': ['owner', 'dispatcher'],
  'job.create': ['owner', 'dispatcher', 'office'], 'visit.book': ['owner', 'dispatcher'], 'visit.change': ['owner', 'dispatcher'], 'assessment.book': ['owner', 'dispatcher'], 'series.create': ['owner', 'dispatcher'], 'series.change': ['owner', 'dispatcher'],
  'visit.cancel': ['owner', 'dispatcher'], 'visit.reviewLateEvidence': ['owner', 'dispatcher'],
  'proposal.prepare': ['owner', 'dispatcher', 'agent'], 'proposal.approve': ['owner', 'dispatcher'], 'proposal.decline': ['owner', 'dispatcher'],
  'visit.arrive': ['technician'], 'visit.capture': ['technician'], 'visit.complete': ['technician'],
  'clock.in': ['technician'], 'clock.out': ['technician'], 'timer.start': ['technician'], 'timer.stop': ['technician'], 'time.correct': ['owner', 'dispatcher', 'office'],
  'expense.record': ['owner', 'office', 'technician'], 'expense.price': ['owner', 'office'],
  'invoice.prepare': ['owner', 'office', 'agent'], 'invoice.revise': ['owner', 'office', 'agent'],
  'invoice.approve': ['owner', 'office'], 'invoice.export': ['owner', 'office'], 'invoice.correct': ['owner', 'office'],
  'import.stage': ['owner'], 'import.commit': ['owner'], 'import.undo': ['owner'],
}

// TEAM-001: a custom CSR role the owner built from named permissions. It books
// and edits customers but cannot see margins, export, quote prices or refund.
const csr = ['customer.save', 'site.save', 'enquiry.create', 'enquiry.contact', 'enquiry.close', 'quote.markSent', 'visit.book', 'visit.change', 'visit.cancel']
// Read doors: margins and reports need reports.read, exports export.read.
const doors = { state: '/api/glove/state', reports: '/api/glove/reports/sources', warranties: '/api/glove/reports/warranties', refrigerant: '/api/glove/reports/refrigerant?from=2026-01-01&to=2026-12-31', cost: '/api/glove/jobs/{job}/cost', dashboard: '/api/glove/dashboard', export: '/api/glove/export' }
const csrReads = ['state']

test('every command and read door checks the current session and role', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const viewer = await h.person('Vic Viewer', 'viewer')
  const role = await h.command('role.save', { name: 'CSR', permissions: csr })
  const csrPerson = await h.person('Cass Rep', `custom:${role.id}`)
  const people = { owner: { run: h.command, cookie: h.owner() }, dispatcher: b.dispatcher, technician: b.priyaPerson, office: b.office, agent: b.agent, viewer, csr: csrPerson }
  const holders = (type) => [...allowed[type], ...(csr.includes(type) ? ['csr'] : [])]

  await t.test('each role, built-in or custom, is refused exactly the commands it does not hold', async () => {
    for (const type of Object.keys(allowed)) for (const [role, person] of Object.entries(people)) {
      const res = await h.request('/api/glove/commands', { method: 'POST', as: person.cookie, body: { commandId: randomUUID(), type, payload: {} } })
      const body = await res.json()
      if (holders(type).includes(role)) assert.notEqual(body.error?.code, 'FORBIDDEN', `${role} may send ${type}`)
      else { assert.equal(res.status, 403, `${role} must not send ${type}`); assert.equal(body.error.code, 'FORBIDDEN') }
    }
  })

  await t.test('a custom role reads only the doors its permissions name, and its edits apply on the next request', async () => {
    const { job } = await completedJob(h, b)
    await b.office.run('expense.record', { jobId: job.id, category: 'supply-house purchase', vendor: 'Supply Co', description: 'Capacitor', amount: '42.00', billable: true, markupPercent: '20' })
    const read = async (door, person) => (await h.request(doors[door].replace('{job}', job.id), { as: person.cookie })).status
    for (const door of Object.keys(doors)) assert.equal(await read(door, csrPerson), csrReads.includes(door) ? 200 : 403, `CSR reads ${door}`)
    assert.equal(await read('dashboard', b.priyaPerson), 403, 'REPORT-001: a technician never reads the owner\'s figures')
    assert.equal(await read('dashboard', viewer), 200)
    const seen = await csrPerson.state()
    assert.equal(seen.actor.roleName, 'CSR')
    assert.deepEqual([...seen.actor.commands].sort(), [...csr].sort())
    assert.equal(seen.expenses.length, 0, 'expense costs and markups are margins')
    assert.ok(!seen.events.some(e => e.subjectKind === 'expense'), 'nor their timeline entries')
    assert.ok(seen.jobs.some(j => j.id === job.id), 'the CSR reads the desk records')
    const open = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Second unit')).id })
    await csrPerson.run('visit.book', { jobId: open.id, technicianId: b.tom.id, date: '2026-10-22', start: '13:00', end: '14:00' })

    // The owner grants margins and takes away customer edits: the next request sees both.
    await h.command('role.save', { id: role.id, version: role.version, name: 'CSR', permissions: [...csr.filter(p => p !== 'customer.save'), 'reports.read'] })
    assert.equal(await read('cost', csrPerson), 200)
    const granted = await csrPerson.state()
    assert.equal(granted.expenses.length, 1)
    assert.ok(granted.events.some(e => e.subjectKind === 'expense'))
    await csrPerson.run('customer.save', { name: 'After the edit' }, { error: 'FORBIDDEN' })
    assert.ok(!(await h.state()).customers.some(c => c.name === 'After the edit'))

    // Owner, move-in and field capture authority cannot be granted, and only the owner builds roles.
    for (const permission of ['role.set', 'role.save', 'business.save', 'import.commit', 'visit.capture', 'refund']) await h.command('role.save', { name: 'Too much', permissions: [permission] }, { error: 'INPUT' })
    await h.command('role.save', { name: 'Dispatcher', permissions: [] }, { error: 'DUPLICATE' })
    await b.dispatcher.run('role.save', { name: 'Mine', permissions: csr }, { error: 'FORBIDDEN' })
    const lead = await h.command('role.save', { name: 'Lead technician', permissions: ['quote.approve', 'equipment.save'] })
    await h.command('role.set', { operatorId: csrPerson.id, role: `custom:${lead.id}` })
    await csrPerson.run('visit.book', { jobId: open.id, technicianId: b.tom.id, date: '2026-10-23', start: '13:00', end: '14:00' }, { error: 'FORBIDDEN' })
    assert.equal((await csrPerson.state()).actor.roleName, 'Lead technician')
    await h.command('role.set', { operatorId: csrPerson.id, role: 'custom:no-such-role' }, { error: 'NOT_FOUND' })
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
