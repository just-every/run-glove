import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, business } from './harness.mjs'
import { connectPayments, paymentEvent } from '../fixtures/payment-journey.mjs'
import { serviceM8Balances } from '../fixtures/servicem8-balances.mjs'

const at = '2026-11-08T12:00:00.000Z'
const ids = rows => rows.map(r => r.id).sort()
const read = async (h, path, as) => {
  const response = await h.request(path, as ? { as } : {})
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}
const activity = async (h, as) => {
  const events = []
  let before = null
  do {
    const page = await read(h, `/api/glove/activity${before ? `?before=${before}` : ''}`, as)
    events.push(...page.events)
    before = page.next
  } while (before)
  return events
}
const unchangedRefusal = async (h, person, paymentIds, error = 'DEPOSIT_BATCH', opts = {}) => {
  const before = await h.state()
  await person.run('payment.depositBatch', { paymentIds, reference: 'synthetic-glove-refused' }, { error, ...opts })
  assert.deepEqual(await h.state(), before, `${error}: every record, version, financial balance and Activity entry stays unchanged`)
}

// Native invoice preparation keeps the receipt proof independent of quote,
// tax and checklist calculations. Every domain write uses its public command.
async function invoice(h, b, customer, site, tech, person, day) {
  const job = await b.office.run('job.create', { customerId: customer.id, siteId: site.id, title: 'Deposit receipt work', lines: [{ description: 'Completed work', quantity: '1', unitPrice: '10000.00', tax: 'FREE' }] })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: day, start: '09:00', end: '10:00' })
  await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Work completed', signoff: { absentReason: 'Customer away' } })
  const draft = await b.office.run('invoice.prepare', { jobId: job.id })
  return b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
}

async function fixture(h) {
  const b = await business(h, { currency: 'USD', timezone: 'UTC' })
  const east = await h.command('branch.save', { name: 'East', prefix: 'EAST', timezone: 'UTC', zips: ['10001'] })
  const west = await h.command('branch.save', { name: 'West', prefix: 'WEST', timezone: 'UTC', zips: ['90001'] })
  const eastPerson = await h.person('East Field', 'technician'), westPerson = await h.person('West Field', 'technician')
  const eastTech = await h.command('technician.save', { name: 'East field person', operatorId: eastPerson.id, branchId: east.id })
  const westTech = await h.command('technician.save', { name: 'West field person', operatorId: westPerson.id, branchId: west.id })
  const customers = []
  for (const [n, branch, tech, person, date] of [
    [1, east, eastTech, eastPerson, '2026-11-02'],
    [2, east, eastTech, eastPerson, '2026-11-03'],
    [3, west, westTech, westPerson, '2026-11-02'],
  ]) {
    const customer = await b.office.run('customer.save', { name: `Synthetic paying customer ${n}`, contact: `Synthetic contact ${n}`, phone: `212 555 010${n}`, billingAddress: `${n} Synthetic billing road` })
    const site = await b.office.run('site.save', { customerId: customer.id, branchId: branch.id, address: `${n} Synthetic service road` })
    customers.push({ customer, site, invoice: await invoice(h, b, customer, site, tech, person, date), branch })
  }
  const record = (index, method, amount, reference) => b.office.run('payment.record', { invoiceId: customers[index].invoice.id, version: customers[index].invoice.version, method, amount, reference })
  const refund = async (payment, amount) => {
    const state = await h.state(), current = state.payments.find(p => p.id === payment.id), inv = state.invoices.find(i => i.id === payment.invoiceId)
    return h.command('payment.refund', { invoiceId: inv.id, version: inv.version, paymentId: payment.id, paymentVersion: current.version, amount, reason: 'Prior recorded return' })
  }
  return { b, east, west, customers, record, refund }
}

/** Points 1, 2 and 3 extend the existing payout sanity registration; no new tests. */
export async function depositBatchQualification(t) {
  const h = await installation({ at }); t.after(() => h.close())
  const f = await fixture(h), { b, east, west, customers, record, refund } = f
  const aCash = await record(0, 'cash', '123.45', 'synthetic-glove-private-cash'), aCheck = await record(0, 'check', '78.91', 'synthetic-glove-private-check')
  const unbatched = await record(0, 'cash', '9.87', '222.08')
  const peerCash = await record(1, 'cash', '14.22', 'synthetic-glove-peer-cash'), peerCheck = await record(1, 'check', '36.63', 'synthetic-glove-peer-check')
  const westCash = await record(2, 'cash', '21.09', 'synthetic-glove-west-cash'), westCheck = await record(2, 'check', '32.18', 'synthetic-glove-west-check')
  const westAvailable = await record(2, 'check', '8.76', 'synthetic-glove-west-available')
  const cashRefund = await refund(aCash, '23.11'), checkRefund = await refund(aCheck, '8.02')
  assert.deepEqual([cashRefund.status, cashRefund.amount, checkRefund.status, checkRefund.amount], ['paid', '23.11', 'paid', '8.02'])
  for (const [payment, method, amount, branch, inv] of [
    [aCash, 'cash', '123.45', east, customers[0].invoice], [aCheck, 'check', '78.91', east, customers[0].invoice],
    [peerCash, 'cash', '14.22', east, customers[1].invoice], [peerCheck, 'check', '36.63', east, customers[1].invoice],
    [westCash, 'cash', '21.09', west, customers[2].invoice], [westCheck, 'check', '32.18', west, customers[2].invoice],
  ]) assert.deepEqual([payment.method, payment.amount, payment.currency, payment.branchId, payment.invoiceId, payment.status, payment.by.id, payment.by.role], [method, amount, 'USD', branch.id, inv.id, 'paid', b.office.id, 'office'])

  // Point 1: every unsafe selection is tried with a still-available peer,
  // so an accidental partial write cannot hide behind an already-used source.
  await unchangedRefusal(h, b.office, [], 'INPUT')
  await unchangedRefusal(h, b.office, [aCash.id, aCash.id], 'INPUT')
  await unchangedRefusal(h, b.office, [peerCash.id, cashRefund.id])
  await unchangedRefusal(h, b.office, [peerCash.id, westCash.id])
  await unchangedRefusal(h, b.office, [peerCash.id, 'synthetic-glove-missing'], 'NOT_FOUND')
  await connectPayments(h)
  const providerReceipts = []
  for (const [n, source, method] of [[1, customers[0], 'card'], [2, customers[1], 'ach']]) {
    const payment = await h.command('payment.checkout', { invoiceId: source.invoice.id, version: source.invoice.version, method, amount: '100.00' })
    const intent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    Object.assign(intent, { status: 'succeeded', amount_received: 10000, latest_charge: { id: `synthetic-glove-private-source-${n}`, created: Date.parse(at) / 1000, status: 'succeeded', balance_transaction: { fee: 300 } } })
    assert.equal((await paymentEvent(h, intent, 'payment_intent.succeeded', { at: Date.parse(at) / 1000 })).status, 200)
    const confirmed = (await h.state()).payments.find(p => p.id === payment.id)
    assert.equal(confirmed.status, 'paid')
    providerReceipts.push(confirmed)
    await unchangedRefusal(h, b.office, [peerCash.id, payment.id])
  }
  const pending = await h.command('payment.checkout', { invoiceId: customers[2].invoice.id, version: customers[2].invoice.version, method: 'card', amount: '5.00' })
  assert.notEqual(pending.status, 'paid')
  await unchangedRefusal(h, b.office, [peerCash.id, pending.id])
  const batchPayload = { paymentIds: [aCash.id, aCheck.id, peerCash.id, peerCheck.id], reference: `${customers[0].customer.name}: ${aCheck.reference}; receipt ${unbatched.reference}` }, batchCommand = randomUUID()
  const batch = await b.office.run('payment.depositBatch', batchPayload, { commandId: batchCommand })
  assert.deepEqual([batch.amount, batch.currency, batch.branchId, batch.status, batch.by.id, batch.paymentIds], ['222.08', 'USD', east.id, 'staff-recorded', b.office.id, batchPayload.paymentIds])
  await unchangedRefusal(h, b.office, [aCash.id, westCheck.id])
  const scopedOwner = await h.person('Scoped Owner', 'owner')
  const singlePayload = { paymentIds: [westCash.id], reference: 'synthetic-glove-single' }, singleCommand = randomUUID()
  const single = await scopedOwner.run('payment.depositBatch', singlePayload, { commandId: singleCommand })
  assert.deepEqual([single.amount, single.status, single.paymentIds], ['21.09', 'staff-recorded', [westCash.id]])
  const hundred = []
  for (let n = 0; n < 101; n++) hundred.push(await record(1, n % 2 ? 'check' : 'cash', n % 2 ? '0.23' : '0.11', `synthetic-glove-boundary-${n}`))
  await unchangedRefusal(h, b.office, hundred.map(p => p.id), 'INPUT')
  await refund(hundred[0], '0.03'); await refund(hundred[1], '0.05')
  const hundredPayload = { paymentIds: hundred.slice(0, 100).map(p => p.id), reference: `Earlier payer check ${aCheck.reference}` }, hundredCommand = randomUUID()
  const hundredBatch = await b.office.run('payment.depositBatch', hundredPayload, { commandId: hundredCommand })
  assert.deepEqual([hundredBatch.amount, hundredBatch.paymentIds.length, hundredBatch.branchId, hundredBatch.status], ['16.92', 100, east.id, 'staff-recorded'])
  const marked = await h.state()
  for (const receipt of hundred.slice(0, 100)) assert.equal(marked.payments.find(p => p.id === receipt.id).depositBatchId, hundredBatch.id)
  assert.equal(marked.payments.find(p => p.id === hundred[100].id).depositBatchId, undefined)
  const raceIds = [randomUUID(), randomUUID()], racePayload = { paymentIds: [westCheck.id], reference: 'synthetic-glove-concurrent' }
  const races = await Promise.all(raceIds.map(commandId => h.request('/api/glove/commands', { method: 'POST', as: b.office.cookie, body: { type: 'payment.depositBatch', payload: racePayload, commandId } }).then(r => r.json())))
  assert.equal(races.filter(r => r.ok).length, 1)
  assert.deepEqual(races.filter(r => !r.ok).map(r => r.error.code), ['DEPOSIT_BATCH'])
  const winnerIndex = races.findIndex(r => r.ok), raceBatch = races[winnerIndex].result
  assert.equal(raceBatch.amount, '32.18')
  const afterRace = await h.state()
  assert.equal(afterRace.payouts.filter(p => p.paymentIds?.includes(westCheck.id)).length, 1)
  assert.deepEqual(await b.office.run('payment.depositBatch', racePayload, { commandId: raceIds[winnerIndex] }), raceBatch)
  assert.deepEqual(await h.state(), afterRace, 'replay causes no record, money or event changes')
  await unchangedRefusal(h, b.office, [westCheck.id])

  // Point 2: populate both sides before testing access through every read door.
  const providerId = 'synthetic-glove-provider-payout'
  h.stripePayments.payouts.set(providerId, { id: providerId, amount: 19400, currency: 'usd', method: 'standard', automatic: true, status: 'paid', livemode: false, balance_transaction: { fee: 0 } })
  h.stripePayments.transactions.set(providerId, { data: providerReceipts.map((p, n) => ({ id: `synthetic-glove-source-transaction-${n}`, type: n ? 'payment' : 'charge', source: { id: p.providerReference }, currency: 'usd', amount: 10000, fee: 300, net: 9700 })), has_more: false })
  const providerPayload = { providerId }, providerCommand = randomUUID()
  const payout = await h.command('payout.reconcile', providerPayload, { commandId: providerCommand })
  assert.deepEqual([payout.reconciled, payout.amount, payout.items.map(p => p.paymentId)], [true, '194.00', providerReceipts.map(p => p.id)])
  const feePayload = { version: (await h.state()).business[0].version, basisPoints: 150, minimum: '0.50', source: 'Synthetic account pricing' }, feeCommand = randomUUID()
  await h.command('payout.feeSchedule', feePayload, { commandId: feeCommand })
  const scopedFeePayload = { ...feePayload, version: (await h.state()).business[0].version }, scopedFeeCommand = randomUUID()
  await scopedOwner.run('payout.feeSchedule', scopedFeePayload, { commandId: scopedFeeCommand })
  const scopedProviderCommand = randomUUID()
  await scopedOwner.run('payout.reconcile', providerPayload, { commandId: scopedProviderCommand })
  const scopedPreferences = { version: (await h.state()).business[0].version, tipChoices: ['0.00', '15.00'] }, scopedPreferencesCommand = randomUUID()
  await scopedOwner.run('payment.preferences', scopedPreferences, { commandId: scopedPreferencesCommand })
  const scopedOffice = await h.person('Scoped Office', 'office')
  // First establish replayable outcomes while unlimited; current limits govern replays.
  const scopedBatchPayload = { paymentIds: [hundred[100].id], reference: 'synthetic-glove-scoped-batch' }, scopedBatchCommand = randomUUID()
  const scopedBatch = await scopedOffice.run('payment.depositBatch', scopedBatchPayload, { commandId: scopedBatchCommand })
  await h.command('branch.limit', { operatorId: scopedOffice.id, branchId: east.id })
  await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: west.id })
  const depositIds = [batch.id, single.id, hundredBatch.id, raceBatch.id, scopedBatch.id]
  const inspect = async (person, expected, wide = false) => {
    const as = person?.cookie, state = await read(h, '/api/glove/state', as), events = await activity(h, as), exported = await read(h, '/api/glove/export', as)
    for (const [label, rows] of [['state', state.payouts], ['export', exported.payouts]]) assert.deepEqual(ids(rows), [...expected, ...(wide ? [payout.id] : [])].sort(), `${label}: exact populated payout visibility`)
    for (const [label, rows, column] of [['state', state.events, 'subjectId'], ['Activity', events, 'subjectId'], ['export', exported.timeline, 'subject_id']]) {
      const deposits = rows.filter(e => e.kind === 'payout.depositBatchRecorded')
      assert.deepEqual(deposits.map(e => e[column]).sort(), [...expected].sort(), `${label}: exact branch deposit events`)
      assert.equal(rows.some(e => e.kind === 'payout.reconciled'), wide, `${label}: provider facts`)
      assert.equal(rows.some(e => e.kind === 'payout.feeScheduleRecorded'), wide, `${label}: provider fee facts`)
      for (const e of deposits) {
        assert.match(e.summary, /no bank confirmation is claimed/)
        assert.ok(e.at && (e.commandId || e.command_id) && (e.actorId || e.actor_id))
      }
    }
    for (const s of [state, exported]) assert.equal(s.business[0].payoutFeeSchedule?.basisPoints, wide ? 150 : undefined)
    if (!wide) for (const value of [state, events, exported]) {
      const serialized = JSON.stringify(value)
      assert.ok(!serialized.includes(providerId), 'provider payout reference is withheld')
      assert.ok(!serialized.includes('Synthetic account pricing'), 'provider pricing source is withheld')
    }
    return { state, events, exported }
  }
  const readAll = async () => {
    const before = await h.state()
    await inspect(null, depositIds, true)
    await inspect(b.office, depositIds)
    await inspect(scopedOffice, [batch.id, hundredBatch.id, scopedBatch.id])
    await inspect(scopedOwner, [single.id, raceBatch.id])
    assert.deepEqual(await b.office.run('payment.depositBatch', batchPayload, { commandId: batchCommand }), batch)
    assert.deepEqual(await scopedOffice.run('payment.depositBatch', scopedBatchPayload, { commandId: scopedBatchCommand }), scopedBatch)
    assert.deepEqual(await scopedOwner.run('payment.depositBatch', singlePayload, { commandId: singleCommand }), single)
    await scopedOffice.run('payout.reconcile', providerPayload, { commandId: providerCommand, error: 'FORBIDDEN' })
    await scopedOwner.run('payout.reconcile', providerPayload, { error: 'FORBIDDEN' })
    await scopedOwner.run('payout.feeSchedule', scopedFeePayload, { commandId: scopedFeeCommand, error: 'FORBIDDEN' })
    await scopedOwner.run('payout.reconcile', providerPayload, { commandId: scopedProviderCommand, error: 'NOT_FOUND' })
    assert.equal((await scopedOwner.run('payment.preferences', scopedPreferences, { commandId: scopedPreferencesCommand })).payoutFeeSchedule, undefined, 'ordinary saved business outcomes also withhold provider-wide fee records')
    assert.deepEqual(await h.command('payout.reconcile', providerPayload, { commandId: providerCommand }), payout)
    assert.equal((await h.command('payout.feeSchedule', feePayload, { commandId: feeCommand })).payoutFeeSchedule.basisPoints, 150)
    assert.deepEqual(await h.state(), before, 'authorized replays and refused saved reads change no records or events')
  }
  await readAll()
  // Changing the creator's branch withdraws even their own saved other-branch result.
  await h.command('branch.limit', { operatorId: scopedOffice.id, branchId: west.id })
  await scopedOffice.run('payment.depositBatch', scopedBatchPayload, { commandId: scopedBatchCommand, error: 'NOT_FOUND' })
  await unchangedRefusal(h, scopedOffice, [hundred[100].id], 'NOT_FOUND')
  await h.command('branch.limit', { operatorId: scopedOffice.id, branchId: east.id })
  for (const person of [b.priyaPerson, b.dispatcher, b.agent]) await unchangedRefusal(h, person, [hundred[100].id], 'FORBIDDEN')
  const issued = await h.command('token.issue', { name: 'Synthetic deposit integration', role: 'office' })
  const tokenState = await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${issued.token}` } }).then(r => r.json())
  assert.deepEqual(ids(tokenState.payouts), depositIds.sort())
  assert.equal(tokenState.business[0].payoutFeeSchedule, undefined)
  const tokenBefore = await h.state()
  const tokenResponse = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issued.token}` }, body: { type: 'payment.depositBatch', commandId: randomUUID(), payload: { paymentIds: [hundred[100].id], reference: 'synthetic-glove-token' } } })
  assert.equal(tokenResponse.status, 403)
  assert.deepEqual(await h.state(), tokenBefore)
  await h.command('token.revoke', { tokenId: issued.id })
  const revoked = await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${issued.token}` } })
  assert.equal(revoked.status, 401)
  const revokedBefore = await h.state()
  const revokedCommand = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issued.token}` }, body: { type: 'payment.depositBatch', commandId: randomUUID(), payload: { paymentIds: [unbatched.id], reference: 'synthetic-glove-revoked' } } })
  assert.equal(revokedCommand.status, 401)
  assert.deepEqual(await h.state(), revokedBefore, 'a revoked token cannot record a batch')
  await h.command('role.set', { operatorId: scopedOffice.id, role: 'dispatcher' })
  await unchangedRefusal(h, scopedOffice, [hundred[100].id], 'FORBIDDEN')
  await scopedOffice.run('payment.depositBatch', scopedBatchPayload, { commandId: scopedBatchCommand, error: 'FORBIDDEN' })
  await h.command('role.set', { operatorId: scopedOffice.id, role: 'office' })
  const beforeRestart = await h.state()
  await h.restart()
  assert.deepEqual(await h.state(), beforeRestart, 'actual Worker restart retains the exact records')
  await readAll()
  assert.deepEqual(await b.office.run('payment.depositBatch', racePayload, { commandId: raceIds[winnerIndex] }), raceBatch)
  await unchangedRefusal(h, b.office, [], 'INPUT')
  await unchangedRefusal(h, b.office, hundred.map(p => p.id), 'INPUT')
  assert.deepEqual(await b.office.run('payment.depositBatch', hundredPayload, { commandId: hundredCommand }), hundredBatch)
  await unchangedRefusal(h, b.office, [aCash.id])
  // Restart must preserve selection validation as well as saved outcomes.
  // Both branch-conflict sources are still available, so an earlier deposit
  // refusal cannot mask a missing branch check after startup.
  await unchangedRefusal(h, b.office, [unbatched.id, unbatched.id], 'INPUT')
  await unchangedRefusal(h, b.office, [unbatched.id, cashRefund.id])
  await unchangedRefusal(h, b.office, [unbatched.id, westAvailable.id])
  await unchangedRefusal(h, b.office, [unbatched.id, pending.id])
  for (const payment of providerReceipts) await unchangedRefusal(h, b.office, [unbatched.id, payment.id])
  const afterRestartPayload = { paymentIds: [westAvailable.id], reference: 'synthetic-glove-after-restart' }
  const afterRestartCommand = randomUUID()
  const afterRestartBatch = await b.office.run('payment.depositBatch', afterRestartPayload, { commandId: afterRestartCommand })
  assert.deepEqual([afterRestartBatch.amount, afterRestartBatch.currency, afterRestartBatch.branchId, afterRestartBatch.status, afterRestartBatch.paymentIds], ['8.76', 'USD', west.id, 'staff-recorded', [westAvailable.id]])
  const restartRecorded = await h.state()
  assert.equal(restartRecorded.payments.find(p => p.id === westAvailable.id).depositBatchId, afterRestartBatch.id)
  assert.deepEqual(await b.office.run('payment.depositBatch', afterRestartPayload, { commandId: afterRestartCommand }), afterRestartBatch)
  assert.deepEqual(await h.state(), restartRecorded)
  await unchangedRefusal(h, b.office, [westAvailable.id])
  await unchangedRefusal(h, b.office, racePayload.paymentIds, 'DEPOSIT_BATCH', { commandId: raceIds[1 - winnerIndex] })
  depositIds.push(afterRestartBatch.id)
  await inspect(null, depositIds, true)
  await inspect(b.office, depositIds)
  await inspect(scopedOffice, [batch.id, hundredBatch.id, scopedBatch.id])
  await inspect(scopedOwner, [single.id, raceBatch.id, afterRestartBatch.id])
  t.diagnostic('PAY-025 point 1: exact refunded totals, selection boundaries, concurrent claims and restarted batch recording passed')
  t.diagnostic('PAY-025 point 2: populated state, Activity, business export and saved outcomes honor current role, branch and token authority')

  // Point 3: erase one payer from populated shared batch and Stripe sources.
  const customer = (await h.state()).customers.find(c => c.id === customers[0].customer.id)
  const privacyToken = await h.command('token.issue', { name: 'Synthetic privacy refusal', role: 'office' })
  // Establish ordinary authenticated token use before comparing refused writes.
  // The installation clock is pinned, so its last-use audit value stays exact.
  assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${privacyToken.token}` } })).status, 200)
  const beforePreview = await h.state(), preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  assert.ok(preview.fingerprint)
  assert.equal(preview.counts.payouts, 3, 'preview includes the peer-only batch whose note copied the erased payer receipt')
  assert.deepEqual((await h.state()).payouts, beforePreview.payouts, 'preview changes no financial history')
  assert.deepEqual((await h.state()).payments, beforePreview.payments)
  const erasePayload = { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint }
  const beforeRefusals = await h.state()
  for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent, scopedOffice, scopedOwner]) {
    await person.run('privacy.preview', { customerId: customer.id, version: customer.version }, { error: 'FORBIDDEN' })
    await person.run('privacy.erase', erasePayload, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), beforeRefusals, 'excluded or branch-limited people cannot inspect or erase shared payout sources')
  }
  for (const type of ['privacy.preview', 'privacy.erase']) {
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${privacyToken.token}` }, body: { type, commandId: randomUUID(), payload: erasePayload } })
    assert.equal(response.status, 403)
    assert.deepEqual(await h.state(), beforeRefusals, 'an integration token cannot confirm a person’s privacy decision')
  }
  await h.command('privacy.erase', { ...erasePayload, fingerprint: 'synthetic-glove-stale-preview' }, { error: 'STALE_PREVIEW' })
  assert.deepEqual(await h.state(), beforeRefusals, 'a stale preview cannot erase or change any record')
  const peerBefore = (await h.state()).payments.filter(p => p.customerId === customers[1].customer.id)
  await h.command('privacy.erase', erasePayload)
  const erasedRead = async () => {
    const state = await h.state(), events = await activity(h), exported = await read(h, '/api/glove/export')
    const retainedBatch = state.payouts.find(p => p.id === batch.id), retainedProvider = state.payouts.find(p => p.id === payout.id)
    assert.deepEqual([retainedBatch.amount, retainedBatch.status, retainedBatch.paymentIds.filter(id => id !== '[erased]')], ['222.08', 'staff-recorded', [peerCash.id, peerCheck.id]])
    assert.deepEqual([retainedProvider.amount, retainedProvider.payoutFee, retainedProvider.net, retainedProvider.reconciled], ['194.00', '0.00', '194.00', true])
    assert.deepEqual(retainedProvider.items[1], payout.items[1], 'the other customer retains their exact provider source detail')
    assert.equal(retainedProvider.items[0].providerReference, null)
    const peerBatch = state.payouts.find(p => p.id === hundredBatch.id)
    assert.deepEqual([peerBatch.amount, peerBatch.paymentIds], ['16.92', hundredPayload.paymentIds], 'redacting a copied receipt note keeps every peer source and its exact bank total')
    assert.ok(!retainedBatch.reference.includes(unbatched.reference), 'a numeric receipt reference is removed from the bank note while the equal aggregate amount remains exact')
    for (const [door, value] of [['payouts', state.payouts], ['Activity', events], ['export', exported]]) {
      for (const personal of [customer.name, customer.contact, customer.phone, customer.billingAddress, aCash.reference, aCheck.reference, providerReceipts[0].providerReference]) assert.ok(!JSON.stringify(value).includes(personal), `${door}: erased identity and personal receipt detail absent: ${personal}`)
    }
    // Anonymous invoice and payment row ids remain for retained accounting;
    // the shared bank sources must no longer link back to the erased payer.
    for (const rows of [state.payouts, exported.payouts]) for (const id of [aCash.id, aCheck.id, providerReceipts[0].id]) assert.ok(!JSON.stringify(rows).includes(id), 'shared bank sources retain no erased payment reference')
    assert.deepEqual(state.payments.filter(p => p.customerId === customers[1].customer.id), peerBefore)
    assert.ok(state.payments.filter(p => p.customerId === customer.id).every(p => p.erasedAt && !p.reference && !p.providerReference))
    await b.office.run('payment.depositBatch', batchPayload, { commandId: batchCommand, error: 'ERASED' })
    await b.office.run('payment.depositBatch', hundredPayload, { commandId: hundredCommand, error: 'ERASED' })
    await h.command('payout.reconcile', providerPayload, { commandId: providerCommand, error: 'ERASED' })
    const bankBefore = await h.state(), providerReads = h.stripePayments.calls.length
    await h.command('payout.reconcile', providerPayload, { error: 'ERASED' })
    await h.command('payout.allocate', { ...providerPayload, paymentIds: [providerReceipts[1].id] }, { error: 'ERASED' })
    assert.deepEqual(await h.state(), bankBefore, 'a fresh provider inspection cannot restore erased source details or alter bank history')
    assert.equal(h.stripePayments.calls.length, providerReads, 'the privacy fence refuses before fetching personal provider sources')
    await unchangedRefusal(h, b.office, [aCash.id], 'ERASED')
    await unchangedRefusal(h, b.office, [unbatched.id], 'ERASED')
    return state
  }
  const afterErase = await erasedRead()
  await h.restart()
  assert.deepEqual(await erasedRead(), afterErase, 'erasure and anonymous bank history survive actual restart')
  t.diagnostic('PAY-025 point 3: preview, erasure, replay fences and restarted anonymous bank history passed with peer receipts intact')
  await mixedCurrencies(t)
}

async function mixedCurrencies(t) {
  const h = await installation({ at }); t.after(() => h.close())
  const b = await business(h, { currency: 'AUD' })
  const native = await invoice(h, b, b.customer, b.site, b.priya, b.priyaPerson, '2026-11-02')
  const aud = await b.office.run('payment.record', { invoiceId: native.id, version: native.version, method: 'cash', amount: '12.34', reference: 'synthetic-glove-aud' })
  const staged = await h.command('import.stage', { files: await serviceM8Balances(), balanceAsOf: '2026-10-22' })
  await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const imported = (await h.state()).invoices.find(i => i.source?.system === 'ServiceM8')
  const usd = await b.office.run('payment.record', { invoiceId: imported.id, version: imported.version, method: 'check', amount: '23.45', reference: 'synthetic-glove-usd' })
  assert.deepEqual([aud.currency, usd.currency, aud.branchId, usd.branchId], ['AUD', 'USD', null, null])
  await unchangedRefusal(h, b.office, [aud.id, usd.id])
  await h.restart()
  await unchangedRefusal(h, b.office, [usd.id, aud.id])
}
