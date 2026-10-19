// AGENT-005 quote drafted from the request through the command and state
// doors, with the owner's model provider faked at the network edge.
import test from 'node:test'
import assert from 'node:assert/strict'
import { assertTrail, installation, business, completedJob } from './harness.mjs'

test('DATA-002 / AGENT-005 the agent drafts good, better and best for a 15-year-old furnace from the price book, held as a draft until a person approves', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const year = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric' }).format(new Date()))
  const tune = await h.command('service.save', { code: 'FURN-TUNE', name: 'Furnace tune-up', unitCost: '40.00', unitPrice: '149.00', tax: 'GST' })
  const sensor = await h.command('service.save', { code: 'FLAME-SNS', name: 'Flame sensor replacement', kind: 'material', unitCost: '18.00', unitPrice: '129.00', tax: 'GST' })
  const replace = await h.command('service.save', { code: 'FURN-96', name: '96% AFUE furnace installed', unitCost: '2100.00', unitPrice: '4890.00', tax: 'GST' })
  await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'quote-test', key: 'sk-test-owner-key' })
  const furnace = await b.office.run('equipment.save', { siteId: b.site.id, type: 'Gas furnace', make: 'Carrier', model: '58STA', installedOn: `${year - 15}-01-01`, location: 'Basement' })
  await completedJob(h, b, '2026-10-05')
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Furnace short-cycling and a burning smell when it starts', source: 'phone' })
  const answer = { title: 'Furnace short-cycling', good: { reason: 'A tune-up finds and fixes the usual causes of short-cycling.', lines: [{ code: 'FURN-TUNE', quantity: '1' }] }, better: { reason: 'Short-cycling on a 15-year-old furnace is often a dirty or failing flame sensor.', lines: [{ code: 'FURN-TUNE', quantity: '1' }, { code: 'FLAME-SNS', quantity: '1' }] }, best: { reason: 'At 15 years a high-efficiency replacement ends the repairs.', lines: [{ code: 'FURN-96', quantity: '1' }] } }
  h.models.answer = () => answer

  await b.office.run('quote.suggest', { enquiryId: request.id }, { error: 'FORBIDDEN' })
  // An answer naming anything outside the price book is refused whole; nothing is saved.
  const quotesBefore = (await h.state()).quotes.length
  h.models.answer = () => ({ ...answer, best: { reason: 'x', lines: [{ code: 'HEAT-PUMP', quantity: '1' }] } })
  await b.agent.run('quote.suggest', { enquiryId: request.id }, { error: 'MODEL' })
  assert.equal((await h.state()).quotes.length, quotesBefore)
  h.models.answer = () => answer
  const quote = await b.agent.run('quote.suggest', { enquiryId: request.id })

  await t.test('AGENT-005 three options from the price book at its prices, each with the model\'s reason', () => {
    const options = quote.revisions[0].options
    assert.deepEqual(options.map(o => [o.name, o.lines.map(l => [l.serviceId, l.quantity, l.unitPrice])]), [
      ['Good', [[tune.id, '1', '149.00']]],
      ['Better', [[tune.id, '1', '149.00'], [sensor.id, '1', '129.00']]],
      ['Best', [[replace.id, '1', '4890.00']]],
    ])
    assert.deepEqual(quote.drafted.reasons.map(r => [r.optionId, r.name, r.reason]), options.map((o, i) => [o.id, o.name, answer[['good', 'better', 'best'][i]].reason]))
    assert.match(quote.drafted.label, /^Drafted by the model from the request/)
    assert.deepEqual([quote.title, quote.enquiryId, quote.revisions[0].preparedBy.role], ['Furnace short-cycling', request.id, 'agent'])
  })

  await t.test('AGENT-005 the model saw the request, the furnace\'s age and history and the price book, never costs or who and where the customer is', () => {
    const call = h.models.calls.at(-1)
    assert.equal(call.body.store, false)
    const sent = JSON.parse(call.body.messages[1].content)
    assert.equal(sent.request.description, request.description)
    assert.deepEqual(sent.equipment.map(e => [e.type, e.ageYears]), [['Gas furnace', 15]])
    assert.deepEqual(Object.keys(sent).sort(), ['equipment', 'pastJobs', 'priceBook', 'request'])
    assert.ok(sent.pastJobs.some(j => j.completed.includes('Cleaned filters and coil')))
    assert.deepEqual(sent.priceBook.map(x => x.code).sort(), ['FLAME-SNS', 'FURN-96', 'FURN-TUNE', 'R32-KG', 'SPLIT-SVC'])
    assert.doesNotMatch(call.body.messages[1].content, /unitCost|2100|Harbourview|Harbour St|9555|Mei Lin|harbourview\.example|Priya|Tom B/)
  })

  await t.test('AGENT-005 the draft waits for a person: the agent cannot approve or send it; a dispatcher approves the prices', async () => {
    assert.equal(quote.status, 'draft')
    await b.agent.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 }, { error: 'FORBIDDEN' })
    await b.agent.run('quote.markSent', { quoteId: quote.id, version: quote.version, revision: 1, channel: 'email' }, { error: 'FORBIDDEN' })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    assert.deepEqual([approved.status, approved.revisions[0].approval.name], ['approved', 'Sam Ortiz'])
    const s = await h.state()
    assert.equal(s.enquiries.find(e => e.id === request.id).status, 'quoted')
    assert.ok(s.events.some(e => e.kind === 'quote.suggested' && e.subjectId === quote.id))
  })
  await assertTrail(h, ['model.connected', 'model.outcome', 'quote.suggested', 'quote.approved'])
})
