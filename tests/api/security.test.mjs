// Authority is enforced by every command handler and read door, not by the
// screens: each role is sent every command directly over HTTP.
import test, { after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business, completedJob, acceptedQuote } from './harness.mjs'

// Who may send each command (CONTRACT.md, "People and authority").
const allowed = {
  'fieldQuote.configure': ['owner'], 'fieldQuote.draft': ['technician'],
  'business.save': ['owner'], 'branch.save': ['owner'], 'companycam.connect': ['owner'], 'companycam.link': ['owner', 'dispatcher'], 'companycam.pull': ['owner', 'dispatcher'], 'companycam.send': ['owner', 'dispatcher'], 'companycam.reconcile': ['owner'], 'role.set': ['owner'], 'role.save': ['owner'], 'token.issue': ['owner'], 'token.revoke': ['owner'],
  'agreement.prepare': ['owner', 'dispatcher', 'agent'],
  'grant.create': ['owner'], 'grant.revoke': ['owner'], 'agents.pause': ['owner'],
  'service.save': ['owner'], 'form.save': ['owner'], 'pricebook.category': ['owner'], 'pricebook.adjust': ['owner'], 'pricebook.import': ['owner'], 'technician.save': ['owner'], 'stock.location': ['owner', 'office'], 'stock.count': ['owner', 'office'], 'stock.restock': ['owner', 'office'], 'stock.transfer': ['owner', 'office'], 'po.save': ['owner', 'office'], 'po.send': ['owner', 'office'], 'po.receive': ['owner', 'office'], 'rule.save': ['owner', 'office'], 'field.save': ['owner'], 'record.custom': ['owner', 'dispatcher', 'office'], 'customer.tags': ['owner', 'dispatcher', 'office'], 'segment.save': ['owner', 'dispatcher', 'office'], 'marketing.connect': ['owner'], 'segment.push': ['owner', 'office'], 'technician.calendar': ['owner', 'technician'], 'technician.calendarRead': ['owner', 'dispatcher', 'technician'],
  'customer.save': ['owner', 'dispatcher', 'office'], 'site.save': ['owner', 'dispatcher', 'office'], 'customer.merge': ['owner', 'dispatcher', 'office'], 'customer.unmerge': ['owner', 'dispatcher', 'office'], 'equipment.save': ['owner', 'dispatcher', 'office', 'technician'],
  'enquiry.create': ['owner', 'dispatcher', 'office', 'agent'], 'enquiry.contact': ['owner', 'dispatcher', 'office'], 'conversation.log': ['owner', 'dispatcher', 'office'], 'plan.save': ['owner'], 'agreement.sell': ['owner', 'dispatcher', 'office'], 'agreement.end': ['owner', 'dispatcher', 'office'], 'agreement.decline': ['owner', 'dispatcher', 'office'], 'agreement.offer': ['owner', 'dispatcher', 'office'], 'agreement.offerRevoke': ['owner', 'dispatcher', 'office'], 'agreement.offerSent': ['owner', 'dispatcher', 'office'], 'enquiry.close': ['owner', 'dispatcher', 'office'],
  'template.save': ['owner'], 'quote.draft': ['owner', 'dispatcher', 'agent'], 'quote.revise': ['owner', 'dispatcher', 'agent'],
  'quote.approve': ['owner', 'dispatcher'], 'quote.markSent': ['owner', 'dispatcher', 'office'],
  'quote.accept': ['owner', 'dispatcher'], 'quote.decline': ['owner', 'dispatcher'],
  'job.create': ['owner', 'dispatcher', 'office'], 'visit.book': ['owner', 'dispatcher', 'office'], 'visit.change': ['owner', 'dispatcher'], 'assessment.book': ['owner', 'dispatcher'], 'series.create': ['owner', 'dispatcher'], 'series.change': ['owner', 'dispatcher'],
  'visit.cancel': ['owner', 'dispatcher'], 'visit.reviewLateEvidence': ['owner', 'dispatcher'],
  'proposal.prepare': ['owner', 'dispatcher', 'agent'], 'proposal.approve': ['owner', 'dispatcher'], 'proposal.decline': ['owner', 'dispatcher'],
  'visit.arrive': ['technician'], 'visit.capture': ['technician'], 'visit.complete': ['technician'],
  'clock.in': ['technician'], 'clock.out': ['technician'], 'timer.start': ['technician'], 'timer.stop': ['technician'], 'time.correct': ['owner', 'dispatcher', 'office'], 'payroll.settings': ['owner'], 'timesheet.approve': ['owner'],
  'expense.record': ['owner', 'office', 'technician'], 'expense.price': ['owner', 'office'],
  'report.link': ['owner', 'dispatcher', 'office'], 'report.revoke': ['owner', 'dispatcher', 'office'], 'report.quote': ['owner', 'dispatcher'],
  'invoice.prepare': ['owner', 'office', 'agent'], 'invoice.prepareBatch': ['owner', 'office', 'agent'], 'invoice.revise': ['owner', 'office', 'agent'],
  'invoice.approve': ['owner', 'office'], 'invoice.export': ['owner', 'office'], 'invoice.correct': ['owner', 'office'],
  'import.stage': ['owner'], 'import.commit': ['owner'], 'import.undo': ['owner'],
}

// TEAM-001: a custom CSR role the owner built from named permissions. It books
// and edits customers but cannot see margins, export, quote prices or refund.
const csr = ['customer.save', 'site.save', 'enquiry.create', 'enquiry.contact', 'enquiry.close', 'quote.markSent', 'visit.book', 'visit.change', 'visit.cancel']
// Read doors: margins and reports need reports.read, exports export.read.
const doors = { state: '/api/glove/state', activity: '/api/glove/activity', reports: '/api/glove/reports/sources', warranties: '/api/glove/reports/warranties', refrigerant: '/api/glove/reports/refrigerant?from=2026-01-01&to=2026-12-31', cost: '/api/glove/jobs/{job}/cost', dashboard: '/api/glove/dashboard', export: '/api/glove/export' }
const csrReads = ['state', 'activity']

describe('API-001 every command and read door checks the current session and role', async (t) => {
  const h = await installation()
  after(() => h.close())
  const b = await business(h)
  await h.command('fieldQuote.configure', { technicianId: b.priya.id, version: b.priya.version, enabled: true, minPercent: 90, maxPercent: 110 })
  const viewer = await h.person('Vic Viewer', 'viewer')
  const role = await h.command('role.save', { name: 'CSR', permissions: csr })
  const csrPerson = await h.person('Cass Rep', `custom:${role.id}`)
  const people = { owner: { run: h.command, cookie: h.owner() }, dispatcher: b.dispatcher, technician: b.priyaPerson, office: b.office, agent: b.agent, viewer, csr: csrPerson }
  const holders = (type) => [...allowed[type], ...(csr.includes(type) ? ['csr'] : [])]

  test('each role, built-in or custom, is refused exactly the commands it does not hold', async () => {
    for (const type of Object.keys(allowed)) for (const [role, person] of Object.entries(people)) {
      const res = await h.request('/api/glove/commands', { method: 'POST', as: person.cookie, body: { commandId: randomUUID(), type, payload: {} } })
      const body = await res.json()
      if (holders(type).includes(role)) assert.notEqual(body.error?.code, 'FORBIDDEN', `${role} may send ${type}`)
      else { assert.equal(res.status, 403, `${role} must not send ${type}`); assert.equal(body.error.code, 'FORBIDDEN') }
    }
  })

  test('inherited command names receive the same safe refusal as an unknown name', async () => {
    const send = type => h.request('/api/glove/commands', {
      method: 'POST', as: b.dispatcher.cookie,
      body: { commandId: randomUUID(), type, payload: {} },
    })
    for (const type of ['unregistered.command', 'constructor', '__proto__', 'hasOwnProperty']) {
      const res = await send(type)
      const raw = await res.text()
      // Assert only booleans and status codes so failures never print a body.
      assert.equal(res.status, 400, `${type} is an unknown command`)
      let body
      try { body = JSON.parse(raw) } catch { assert.fail('Command refusal must be JSON') }
      assert.equal(JSON.stringify(body) === JSON.stringify({
        ok: false, error: { code: 'COMMAND', message: 'Unknown command type.', details: { type } },
      }), true, 'Unknown commands return only the fixed refusal and submitted type')
      assert.equal(/SESSION_SECRET|SETUP_TOKEN|MAIL_API_KEY|test-only-key|AUTH_ORIGIN|OWNER_EMAIL/.test(raw), false, 'Command refusals contain no runtime bindings')
    }
    const name = 'Registered command after inherited names'
    const res = await h.request('/api/glove/commands', {
      method: 'POST', as: b.dispatcher.cookie,
      body: { commandId: randomUUID(), type: 'customer.save', payload: { name } },
    })
    assert.equal(res.status, 200, 'A registered command still works')
    const body = await res.json()
    assert.equal(body.ok === true && body.result?.name === name, true, 'The registered handler saves the customer')
  })

  test('PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 / TEAM-001 a custom role reads only the doors its permissions name, and its edits apply on the next request', async () => {
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

    // PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011: Office books an agreement's job, using the same exact conflict
    // review as dispatch. Membership alone never permits a repair booking.
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
    const plan = await h.command('plan.save', { name: 'Maintenance', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: b.service.id })
    const agreement = await b.office.run('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, via: 'phone', startDate: today })
    const included = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, agreementId: agreement.id, title: 'Included maintenance' })
    const booking = { technicianId: b.tom.id, date: '2026-10-22', start: '13:00', end: '14:00' }
    const review = await b.office.run('visit.book', { ...booking, jobId: included.id }, { error: 'CONFLICT_REVIEW' })
    assert.ok(review.details.conflicts.some(x => x.code.startsWith('overlap:')))
    await b.office.run('visit.book', { ...booking, jobId: included.id, acknowledge: [] }, { error: 'CONFLICT_REVIEW' })
    const booked = await b.office.run('visit.book', { ...booking, jobId: included.id, acknowledge: review.details.conflicts.map(x => x.code) })
    assert.deepEqual(booked.assignments[0].reviewedConflicts, review.details.conflicts)
    assert.equal(booked.assignments[0].by.role, 'office')
    await b.office.run('visit.change', { visitId: booked.id, version: booked.version, start: '14:00', end: '15:00', reason: 'Reschedule' }, { error: 'FORBIDDEN' })
    await b.office.run('visit.cancel', { visitId: booked.id, version: booked.version, reason: 'Cancel' }, { error: 'FORBIDDEN' })
    await b.office.run('visit.book', { ...booking, jobId: open.id, agreementId: agreement.id }, { error: 'FORBIDDEN' })
    const repair = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Member repair' })
    await b.office.run('visit.book', { ...booking, jobId: repair.id }, { error: 'FORBIDDEN' })
    // API-005 calls the handler directly as the rule creator: its new general
    // visit.book permission must still refuse a non-agreement job.
    const officeRule = await b.office.run('rule.save', { name: 'Office booking authority', trigger: 'job.created', action: { kind: 'book', technicianId: b.tom.id, afterDays: 2, start: '09:00', end: '10:00' } })
    const ruled = await b.office.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Rule cannot book a repair' })
    const afterRule = await h.state()
    assert.equal(afterRule.ruleRuns.find(r => r.ruleId === officeRule.id && r.trigger.subjectId === ruled.id).outcome, 'not allowed')
    assert.ok(!afterRule.visits.some(v => v.jobId === ruled.id))
    await b.office.run('rule.save', { id: officeRule.id, version: officeRule.version, name: officeRule.name, trigger: officeRule.trigger, action: officeRule.action, enabled: false })

    // The owner grants margins and takes away customer edits: the next request sees both.
    await h.command('role.save', { id: role.id, version: role.version, name: 'CSR', permissions: [...csr.filter(p => p !== 'customer.save'), 'reports.read'] })
    assert.equal(await read('cost', csrPerson), 200)
    const granted = await csrPerson.state()
    assert.equal(granted.expenses.length, 1)
    assert.ok(granted.events.some(e => e.subjectKind === 'expense'))
    await csrPerson.run('customer.save', { name: 'After the edit' }, { error: 'FORBIDDEN' })
    assert.ok(!(await h.state()).customers.some(c => c.name === 'After the edit'))

    // Owner, move-in and field capture authority cannot be granted, and only the owner builds roles.
    for (const permission of ['fieldQuote.configure', 'fieldQuote.draft', 'role.set', 'role.save', 'business.save', 'import.commit', 'visit.capture', 'refund']) await h.command('role.save', { name: 'Too much', permissions: [permission] }, { error: 'INPUT' })
    await h.command('role.save', { name: 'Dispatcher', permissions: [] }, { error: 'DUPLICATE' })
    await b.dispatcher.run('role.save', { name: 'Mine', permissions: csr }, { error: 'FORBIDDEN' })
    const lead = await h.command('role.save', { name: 'Lead technician', permissions: ['quote.approve', 'equipment.save'] })
    await h.command('role.set', { operatorId: csrPerson.id, role: `custom:${lead.id}` })
    await csrPerson.run('visit.book', { jobId: open.id, technicianId: b.tom.id, date: '2026-10-23', start: '13:00', end: '14:00' }, { error: 'FORBIDDEN' })
    assert.equal((await csrPerson.state()).actor.roleName, 'Lead technician')
    await h.command('role.set', { operatorId: csrPerson.id, role: 'custom:no-such-role' }, { error: 'NOT_FOUND' })
  })

  test('signed-out, revoked and cross-origin requests change nothing', async () => {
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

  test('a role change applies to the very next request', async () => {
    await b.dispatcher.run('customer.save', { name: 'Allowed while dispatcher' })
    await h.command('role.set', { operatorId: b.dispatcher.id, role: 'viewer' })
    await b.dispatcher.run('customer.save', { name: 'Refused as viewer' }, { error: 'FORBIDDEN' })
    assert.ok(!(await h.state()).customers.some(c => c.name === 'Refused as viewer'))
    await h.command('role.set', { operatorId: (await h.state()).actor.id, role: 'viewer' }, { error: 'OWN_ROLE' })
  })

  test('a command identity replays its outcome only for the same person and content', async () => {
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
