import test from 'node:test'
import assert from 'node:assert/strict'
import { installation } from './harness.mjs'

test('AGENT-008 the owner\'s morning brief lists exactly the at-risk visits, unbilled work, jobs over estimate and waiting leads of a fixture day, each linked to its screen, read only', async t => {
  const h = await installation(); t.after(() => h.close())
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
  const labor = await h.command('service.save', { code: 'LABOR', name: 'Repair labor', kind: 'service', unitPrice: '200.00', unitCost: '100.00', tax: 'TAXABLE' })
  const crew = async name => { const person = await h.person(name, 'technician'); return { person, tech: await h.command('technician.save', { name, operatorId: person.id }) } }
  const priya = await crew('Priya Nair'), tom = await crew('Tom Brooks')
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(Date.now() + 2 * 86_400_000))
  const job = async (name, who, start, end) => {
    const customer = await h.command('customer.save', { name })
    const site = await h.command('site.save', { customerId: customer.id, address: `1 ${name} St, Austin TX 78704` })
    const q = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: `${name} repair`, lines: [{ description: labor.name, serviceId: labor.id, quantity: '1', unitPrice: labor.unitPrice }] })
    const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: name })
    const j = await h.command('job.create', { quoteId: q.id })
    const visit = await h.command('visit.book', { jobId: j.id, technicianId: who.tech.id, date, start, end })
    return { job: j, visit }
  }
  const late = await job('Late Arrival', priya, '09:00', '10:00')
  const open = await job('Still Open', tom, '12:00', '13:00')
  await tom.person.run('visit.arrive', { visitId: open.visit.id, deviceTime: open.visit.startAt })
  const later = await job('Later Today', priya, '16:00', '17:00')
  const finish = async x => { await x.who.person.run('visit.arrive', { visitId: x.visit.id, deviceTime: x.visit.startAt }); await x.who.person.run('visit.complete', { visitId: x.visit.id, deviceTime: x.visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } }) }
  const noInvoice = await job('No Invoice', tom, '07:00', '08:00'); await finish({ ...noInvoice, who: tom })
  const draftInvoice = await job('Draft Invoice', tom, '08:00', '09:00'); await finish({ ...draftInvoice, who: tom })
  const draft = await h.command('invoice.prepare', { jobId: draftInvoice.job.id })
  const billed = await job('Billed', tom, '06:00', '07:00'); await finish({ ...billed, who: tom })
  const inv = await h.command('invoice.prepare', { jobId: billed.job.id })
  await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  await h.command('expense.record', { jobId: late.job.id, category: 'permit', vendor: 'City of Austin', amount: '150.00', billable: false })
  await h.command('expense.record', { jobId: later.job.id, category: 'permit', vendor: 'City of Austin', amount: '40.00', billable: false })
  const customer = await h.command('customer.save', { name: 'Waiting Lead' })
  const waiting = await h.command('enquiry.create', { customerId: customer.id, description: 'Water heater leaking', source: 'google' })
  const contacted = await h.command('enquiry.create', { customerId: customer.id, description: 'AC tune-up', source: 'referral' })
  await h.command('enquiry.contact', { enquiryId: contacted.id, version: contacted.version, note: 'Left a voicemail' })

  const at = new Date(Date.parse(open.visit.endAt) + 30 * 60_000).toISOString()
  const brief = await h.request(`/api/glove/brief?at=${at}`).then(r => r.json())
  assert.equal(brief.date, date)
  const ids = section => brief.sections[section].map(x => x.id).sort()
  assert.deepEqual(ids('atRisk'), [late.visit.id, open.visit.id].sort())
  assert.match(brief.sections.atRisk.find(x => x.id === late.visit.id).text, new RegExp(`^${late.job.number} at 9:00 AM for Late Arrival: Priya Nair has not arrived 15 minutes after the start$`))
  assert.match(brief.sections.atRisk.find(x => x.id === open.visit.id).text, /Still Open: Tom Brooks is still on site after the planned end$/)
  assert.deepEqual(ids('unbilled'), [noInvoice.job.id, draftInvoice.job.id].sort())
  assert.deepEqual(brief.sections.unbilled.find(x => x.id === draftInvoice.job.id).action, { label: 'Approve invoice', href: '#invoices' })
  assert.match(brief.sections.unbilled.find(x => x.id === draftInvoice.job.id).text, new RegExp(`${draft.number} awaits approval`))
  assert.deepEqual(brief.sections.unbilled.find(x => x.id === noInvoice.job.id).action, { label: 'Prepare invoice', href: '#invoices' })
  assert.deepEqual(ids('overEstimate'), [late.job.id])
  assert.match(brief.sections.overEstimate[0].text, /has cost \$150\.00 against a \$100\.00 estimate/)
  assert.deepEqual(ids('leads'), [waiting.id, contacted.id].sort())
  assert.deepEqual(brief.sections.leads.find(x => x.id === waiting.id).action, { label: 'Contact the customer', href: '#quotes' })
  assert.deepEqual(brief.sections.leads.find(x => x.id === contacted.id).action, { label: 'Quote the request', href: '#quotes' })
  assert.deepEqual(brief.sections.atRisk.map(x => x.action), [{ label: 'Open dispatch', href: '#dispatch' }, { label: 'Open dispatch', href: '#dispatch' }])
  assert.equal(brief.notTracked.length, 2)

  // Earlier the same morning nothing is late yet and the leads are still fresh; the brief writes nothing.
  const before = await h.state()
  const early = await h.request(`/api/glove/brief?at=${new Date(Date.parse(late.visit.startAt) - 60 * 60_000).toISOString()}`).then(r => r.json())
  assert.deepEqual(early.sections.atRisk, [])
  assert.equal((await h.state()).version, before.version)
  const dispatcher = await h.person('Dee Dispatcher', 'dispatcher')
  assert.equal((await h.request('/api/glove/brief', { as: dispatcher.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/brief?at=tomorrow')).status, 400)
})
