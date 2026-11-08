import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, id } from './harness.mjs'

test('QUOTE-019 native people and Agent tokens obey current role limits without changing refused work', async t => {
  const h = await installation({ at: '2026-11-30T16:00:00.000Z' })
  t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Glove service', timezone: 'America/Chicago' })
  const owner = (await h.state()).actor
  const custom = await h.command('role.save', { name: 'Price preparer', permissions: ['quote.draft', 'quote.revise', 'job.create', 'invoice.prepare', 'invoice.revise'] })
  const customRole = 'custom:' + custom.id
  const dispatcher = await h.person('Synthetic Dispatcher', 'dispatcher')
  const office = await h.person('Synthetic Office', 'office')
  const agent = await h.person('Synthetic Agent', 'agent')
  const specialist = await h.person('Synthetic Specialist', customRole)
  const unlisted = await h.person('Synthetic Unlisted', 'dispatcher')
  const issued = await h.command('token.issue', { name: 'Synthetic Agent preparation', role: 'agent' })
  const token = {
    id: 'token:' + issued.id, name: 'Synthetic Agent preparation (integration token)',
    async run(type, payload, opts = {}) {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: 'Bearer ' + issued.token }, body: { commandId: opts.commandId ?? id(), type, payload } })
      const body = await response.json()
      assert.equal(body.ok, !opts.error, JSON.stringify(body))
      if (opts.error) { assert.equal(body.error.code, opts.error, JSON.stringify(body)); return body.error }
      assert.equal(response.status, 200)
      return body.result
    },
  }
  const retained = async () => {
    const s = await h.state()
    return Object.fromEntries(['business', 'quotes', 'jobs', 'invoices', 'approvals', 'events', 'exports', 'captures'].map(key => [key, s[key]]))
  }
  const receipts = [], audit = []
  const send = async (actor, type, payload, kind) => {
    const commandId = id(), run = actor?.run ?? h.command
    const result = await run(type, payload, { commandId })
    receipts.push({ actor, type, payload, commandId, result })
    if (kind) audit.push({ kind, commandId, subjectId: result.id, actorId: actor?.id ?? owner.id, actorName: actor?.name ?? owner.name })
    return result
  }
  const refuse = async (actor, type, payload, error = 'DISCOUNT_LIMIT') => {
    const before = await retained(), run = actor?.run ?? h.command, commandId = id()
    await run(type, payload, { commandId, error })
    assert.deepEqual(await retained(), before, type + ' refusal preserves business, prices, approvals and Activity')
    await run(type, payload, { commandId, error })
    assert.deepEqual(await retained(), before, type + ' refused replay adds nothing')
  }
  const limits = { dispatcher: '12.34', office: '20', agent: '25', [customRole]: '33.33' }
  const saveLimits = async value => {
    const b = (await h.state()).business[0]
    return send(null, 'business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: value }, 'business.saved')
  }
  const saved = await saveLimits(limits)
  assert.deepEqual(saved.discountLimits, limits)
  for (const value of [{ unknown: '10' }, { owner: '10' }, { office: '101' }, { office: '100.01' }, { office: '1.001' }, { office: '-0.01' }]) {
    const b = (await h.state()).business[0]
    await refuse(null, 'business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: value }, 'INPUT')
  }
  await refuse(null, 'business.save', { name: saved.name, timezone: saved.timezone, version: saved.version - 1, discountLimits: {} }, 'STALE')
  for (const actor of [dispatcher, office, agent, specialist, token]) {
    await refuse(actor, 'business.save', { name: saved.name, timezone: saved.timezone, version: saved.version, discountLimits: {} }, 'FORBIDDEN')
  }
  const customer = await h.command('customer.save', { name: 'Synthetic Glove customer' })
  const site = await h.command('site.save', { customerId: customer.id, address: '10 Service Street' })
  const base = { customerId: customer.id, siteId: site.id, title: 'Synthetic limited repair' }
  const line = price => ({ description: price.startsWith('-') ? 'Goodwill' : 'Repair', quantity: '1', unitPrice: price, tax: 'FREE' })
  const rows = [line('100.00')]
  const pricing = (kind, amount) => kind === 'line'
    ? { lines: [...rows, line('-' + amount)] }
    : { lines: rows, discount: { kind, value: amount, reason: 'Synthetic goodwill' } }
  const centOver = amount => (Number(amount) + 0.01).toFixed(2)
  const atTotal = (revision, amount) => assert.equal(revision.totals.total, (100 - Number(amount)).toFixed(2))
  const quotes = []
  for (const [actor, limit] of [[dispatcher, '12.34'], [specialist, '33.33'], [agent, '25'], [token, '25'], [null, '100']]) {
    for (const kind of ['percent', 'amount', 'line']) {
      const q = await send(actor, 'quote.draft', { ...base, ...pricing(kind, limit) }, 'quote.drafted')
      atTotal(q.revisions[0], limit)
      const revised = await send(actor, 'quote.revise', { quoteId: q.id, version: q.version, ...pricing(kind, limit) }, 'quote.revised')
      atTotal(revised.revisions.at(-1), limit)
      quotes.push(revised)
      if (actor) {
        await refuse(actor, 'quote.draft', { ...base, ...pricing(kind, centOver(limit)) })
        await refuse(actor, 'quote.revise', { quoteId: q.id, version: revised.version, ...pricing(kind, centOver(limit)) })
      }
    }
    // Every separately priced option and add-on is checked, including the last.
    const options = Array.from({ length: 5 }, (_, i) => ({ name: 'Choice ' + i, ...pricing(i % 2 ? 'amount' : 'percent', limit) }))
    const addOns = Array.from({ length: 10 }, (_, i) => ({ name: 'Extra ' + i, ...pricing('line', limit) }))
    const q = await send(actor, 'quote.draft', { ...base, options, addOns }, 'quote.drafted')
    const revised = await send(actor, 'quote.revise', { quoteId: q.id, version: q.version, options, addOns }, 'quote.revised')
    for (const rev of revised.revisions) for (const item of [...rev.options, ...rev.addOns]) atTotal(item, limit)
    quotes.push(revised)
    if (actor) {
      for (const [collection, count] of [['options', 5], ['addOns', 10]]) {
        for (let index = 0; index < count; index++) {
          const bad = structuredClone({ options, addOns })
          bad[collection][index] = { name: 'Over limit', ...pricing(collection === 'addOns' ? 'line' : index % 2 ? 'amount' : 'percent', centOver(limit)) }
          await refuse(actor, 'quote.draft', { ...base, ...bad })
          await refuse(actor, 'quote.revise', { quoteId: q.id, version: revised.version, ...bad })
        }
      }
      const mixed = { lines: [...rows, line('-1.00')], discount: { kind: 'amount', value: (Number(limit) - 1).toFixed(2), reason: 'Combined' } }
      const combined = await send(actor, 'quote.draft', { ...base, ...mixed })
      atTotal(combined.revisions[0], limit)
      await refuse(actor, 'quote.revise', { quoteId: combined.id, version: combined.version, ...mixed, discount: { ...mixed.discount, value: (Number(limit) - 0.99).toFixed(2) } })
    }
  }

  const techPerson = await h.person('Synthetic Technician', 'technician')
  const tech = await h.command('technician.save', { name: techPerson.name, operatorId: techPerson.id })
  let day = 0
  const complete = async job => {
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-' + String(++day).padStart(2, '0'), start: '09:00', end: '10:00' })
    await techPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await techPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repair complete', signoff: { absentReason: 'Synthetic customer away' } })
  }
  const invoices = []
  for (const [actor, limit] of [[office, '20'], [agent, '25'], [token, '25'], [null, '100']]) {
    for (const kind of ['percent', 'amount', 'line']) {
      // An undiscounted service call has no carried exemption.
      const job = await h.command('job.create', { ...base, lines: rows })
      await complete(job)
      if (actor) await refuse(actor, 'invoice.prepare', { jobId: job.id, ...pricing(kind, centOver(limit)) })
      const inv = await send(actor, 'invoice.prepare', { jobId: job.id, ...pricing(kind, limit) }, 'invoice.prepared')
      atTotal(inv.revisions[0], limit)
      if (actor) await refuse(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Extra goodwill', ...pricing(kind, centOver(limit)) })
      const revised = await send(actor, 'invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Reviewed goodwill', ...pricing(kind, limit) }, 'invoice.revised')
      atTotal(revised.revisions.at(-1), limit)
      invoices.push(revised)
    }
  }
  // Corrections are separately authorized and use the same discount boundary.
  for (const [actor, limit] of [[office, '20'], [null, '100']]) for (const [index, kind] of ['percent', 'amount', 'line'].entries()) {
    const inv = invoices[(actor ? 0 : 9) + index]
    await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: inv.revisions.length })
  }
  await h.command('invoice.export', {})
  for (const [actor, limit] of [[office, '20'], [null, '100']]) for (const [index, kind] of ['percent', 'amount', 'line'].entries()) {
    const old = invoices[(actor ? 0 : 9) + index], inv = (await h.state()).invoices.find(x => x.id === old.id)
    if (actor) await refuse(actor, 'invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Too much', ...pricing(kind, centOver(limit)) })
    const corrected = await send(actor, 'invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Reviewed correction', ...pricing(kind, limit) }, 'invoice.corrected')
    atTotal(corrected.revisions.at(-1), limit)
  }
  for (const [actor, limit] of [[dispatcher, '12.34'], [office, '20'], [specialist, '33.33'], [null, '100']]) {
    const job = await send(actor, 'job.create', { ...base, ...pricing('line', limit) }, 'job.created')
    assert.equal(job.totals.total, (100 - Number(limit)).toFixed(2))
    if (actor) await refuse(actor, 'job.create', { ...base, ...pricing('line', centOver(limit)) })
  }

  // A human's approval of Agent preparation is that person's own act.
  const prepared = quotes.find(q => q.revisions.at(-1).preparedBy.id === agent.id)
  await refuse(agent, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'FORBIDDEN')
  await refuse(token, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'FORBIDDEN')
  const approved = await send(dispatcher, 'quote.approve', { quoteId: prepared.id, version: prepared.version, revision: prepared.revisions.length }, 'quote.approved')
  assert.deepEqual(approved.revisions.at(-1).preparedBy, { id: agent.id, name: agent.name, role: 'agent' })
  assert.equal(approved.revisions.at(-1).approval.id, dispatcher.id)
  const approval = (await h.state()).approvals.find(x => x.subjectId === prepared.id)
  assert.equal(approval.preparedBy.id, agent.id)
  assert.equal(approval.approvedBy.id, dispatcher.id)
  const accepted = await h.command('quote.accept', { quoteId: prepared.id, version: approved.version, revision: prepared.revisions.length, method: 'phone', customerName: customer.name })
  await saveLimits({})
  // Neither the Dispatcher nor Office is listed now. Exact accepted price carries.
  const carried = await send(unlisted, 'job.create', { quoteId: accepted.id }, 'job.created')
  assert.deepEqual(carried.totals, accepted.acceptance.totals)
  await complete(carried)
  const carriedInvoice = await send(office, 'invoice.prepare', { jobId: carried.id }, 'invoice.prepared')
  atTotal(carriedInvoice.revisions[0], '25')
  await refuse(office, 'invoice.revise', { invoiceId: carriedInvoice.id, version: carriedInvoice.version, reason: 'Increase', ...pricing('amount', '25.01') })
  const carriedRevision = await send(office, 'invoice.revise', { invoiceId: carriedInvoice.id, version: carriedInvoice.version, reason: 'Carry accepted discount', ...pricing('percent', '25') }, 'invoice.revised')
  atTotal(carriedRevision.revisions.at(-1), '25')
  await h.command('invoice.approve', { invoiceId: carriedRevision.id, version: carriedRevision.version, revision: carriedRevision.revisions.length })
  await h.command('invoice.export', {})
  const exported = (await h.state()).invoices.find(x => x.id === carriedInvoice.id)
  await refuse(office, 'invoice.correct', { invoiceId: exported.id, version: exported.version, reason: 'Increase', ...pricing('amount', '25.01') })
  const correction = await send(office, 'invoice.correct', { invoiceId: exported.id, version: exported.version, reason: 'Carry accepted discount', ...pricing('percent', '25') }, 'invoice.corrected')
  atTotal(correction.revisions.at(-1), '25')
  await refuse(unlisted, 'quote.draft', { ...base, ...pricing('amount', '0.01') })
  await refuse(unlisted, 'job.create', { ...base, ...pricing('line', '0.01') })
  const noDiscount = await send(unlisted, 'quote.draft', { ...base, lines: rows })
  assert.equal(noDiscount.revisions[0].totals.total, '100.00')
  await saveLimits({ dispatcher: '12.34' })
  const current = await send(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '12.34') })
  await saveLimits({ dispatcher: '12.33' })
  await refuse(dispatcher, 'quote.revise', { quoteId: current.id, version: current.version, ...pricing('amount', '12.34') })
  const lowered = await send(dispatcher, 'quote.revise', { quoteId: current.id, version: current.version, ...pricing('amount', '12.33') })
  await saveLimits({})
  await refuse(dispatcher, 'quote.revise', { quoteId: current.id, version: lowered.version, ...pricing('amount', '0.01') })

  // PLAN-002 member pricing remains automatic even with no role limit.
  const service = await h.command('service.save', { code: 'SYNTHETIC-MEMBER', name: 'Synthetic inspection', kind: 'service', unitPrice: '100.00', tax: 'FREE' })
  const plan = await h.command('plan.save', { name: 'Synthetic club', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: false, formIds: [] })
  await h.command('agreement.sell', { planId: plan.id, customerId: customer.id, siteId: site.id, via: 'phone', startDate: '2026-11-01' })
  const member = await send(dispatcher, 'quote.draft', { ...base, lines: rows })
  atTotal(member.revisions[0], '15')
  const memberRevision = await send(dispatcher, 'quote.revise', { quoteId: member.id, version: member.version, lines: rows })
  atTotal(memberRevision.revisions.at(-1), '15')
  const memberCall = await send(office, 'job.create', { ...base, lines: rows })
  assert.equal(memberCall.totals.total, '85.00')
  await refuse(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '0.01') })

  const beforeRestart = await retained()
  for (const receipt of receipts) {
    await (receipt.actor?.run ?? h.command)(receipt.type, receipt.payload, { commandId: receipt.commandId })
  }
  assert.deepEqual(await retained(), beforeRestart, 'successful command replay adds no documents, versions or Activity')
  await h.restart()
  assert.deepEqual(await retained(), beforeRestart, 'actual Worker restart retains all exact prices and refusals')
  for (const receipt of receipts) {
    await (receipt.actor?.run ?? h.command)(receipt.type, receipt.payload, { commandId: receipt.commandId })
  }
  assert.deepEqual(await retained(), beforeRestart, 'replay after restart has identical effects')
  await refuse(dispatcher, 'quote.draft', { ...base, ...pricing('amount', '0.01') })
  const activity = { events: [] }
  let before = ''
  do {
    const page = await h.request('/api/glove/activity' + (before ? '?before=' + before : '')).then(r => r.json())
    activity.events.push(...page.events)
    before = page.next
  } while (before)
  const exportedBusiness = await h.request('/api/glove/export').then(r => r.json())
  for (const expected of audit) {
    const event = activity.events.find(x => x.commandId === expected.commandId && x.kind === expected.kind)
    assert.ok(event, expected.kind + ' is visible in Activity')
    assert.deepEqual([event.actorId, event.actorName, event.subjectId], [expected.actorId, expected.actorName, expected.subjectId])
    const kept = exportedBusiness.timeline.find(x => x.id === event.id)
    assert.ok(kept, expected.kind + ' is exported')
    assert.deepEqual([kept.actor_id, kept.actor_name, kept.command_id], [expected.actorId, expected.actorName, expected.commandId])
  }
  // A revoked Agent credential cannot replay its earlier discounted revision.
  const oldTokenCommand = receipts.find(x => x.actor === token && x.type === 'quote.revise')
  await h.command('token.revoke', { tokenId: issued.id })
  await refuse(token, oldTokenCommand.type, oldTokenCommand.payload, 'AUTH')
  await h.restart()
  await refuse(token, oldTokenCommand.type, oldTokenCommand.payload, 'AUTH')
})
