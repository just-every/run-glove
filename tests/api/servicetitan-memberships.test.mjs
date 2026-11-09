import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { installation, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

const fixture = 'tests/fixtures/servicetitan-movein/memberships/'
const source = row => row.source?.system === 'ServiceTitan'
const read = async (h, path) => {
  const response = await h.request(path)
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}
const exportBusiness = h => read(h, '/api/glove/export')
const agreements = async h => (await read(h, '/api/glove/agreements')).agreements.filter(source)
const snapshot = async h => {
  const state = await h.state()
  return { agreements: state.agreements, entitlements: await agreements(h), jobs: state.jobs, visits: state.visits }
}

// Independently authored expected events, including exceptions off a future rule.
// These are not produced by the adapter or by reading the input fixture.
const expectedEvents = [
  ['18', '20', '19', '4', '2026-01-15', true, false],
  ['18', '27', '26', '25', '2026-02-15', true, false],
  ['18', '21', '19', '4', '2026-07-15', false, true],
  ['18', '34', '26', '25', '2026-08-15', false, true],
  ['18', '22', '19', '4', '2026-11-15', false, false],
  ['18', '35', '26', '25', '2026-12-22', false, false],
  ['38', '40', '39', '4', '2026-10-05', true, false],
  ['38', '43', '46', '25', '2026-10-05', true, false],
  ['38', '41', '39', '4', '2026-10-19', false, true],
  ['38', '44', '46', '25', '2026-10-19', false, true],
  ['38', '42', '39', '4', '2026-11-02', false, false],
  ['38', '45', '46', '25', '2026-11-16', false, false],
]
const expectedLines = {
  '4': [['services:6', 'Furnace service', '1', '0.00'], ['materials:31', 'Synthetic replacement filter', '2', '0.00']],
  '25': [['services:28', 'Second-site coil cleaning', '2', '0.00'], ['materials:31', 'Synthetic replacement filter', '3', '0.00']],
}

async function noBillingEffects(h) {
  // The Owner business export includes retained payment evidence as well as records.
  const state = await exportBusiness(h)
  assert.deepEqual(state.invoices, [], 'membership import is not an invoice')
  assert.deepEqual(state.payments, [], 'membership import is not a charge or receipt')
  assert.deepEqual(state.customers.flatMap(c => c.savedCards ?? []), [], 'no saved method')
  for (const job of state.jobs) {
    assert.equal(job.series?.billing, undefined, 'no billing rule or autopay authority')
    assert.equal(job.autopay, undefined)
  }
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_payment_attempts').first()).n, 0)
  assert.deepEqual(h.stripePayments.calls, [], 'no payment provider request')
  assert.deepEqual(h.email.sent, [], 'no customer receipt or other outbound email')
}

test('MOVE-009 memberships retain event entitlements and source terms until a person activates an exact imported rule', async t => {
  const h = await installation(); t.after(() => h.close())
  const committer = await h.person('Casey Commit', 'owner')
  const dispatcher = await h.person('Dana Dispatch', 'dispatcher')
  const office = await h.person('Office Reviewer', 'office')
  const technician = await h.command('technician.save', { name: 'Chosen maintenance technician' })
  await h.setTime('2026-11-09T12:00:00.000Z')
  await h.command('business.save', { name: 'Synthetic membership business', currency: 'USD', timezone: 'America/Chicago' })
  const files = await Promise.all((await readdir(fixture)).filter(n => n.endsWith('.json')).sort().map(async name => ({ name, text: await readFile(fixture + name, 'utf8') })))
  const stageId = randomUUID(), commitId = randomUUID()
  const stageInput = { format: 'servicetitan', files, label: 'Membership acceptance' }
  let staged, batch, imported, inactive

  await scenario(t, 'Point 1: fixed and ongoing memberships keep exactly one identity and independently enumerated site-specific events', async () => {
    const before = await h.state()
    await office.run('import.stage', stageInput, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), before)
    staged = await h.command('import.stage', stageInput, { commandId: stageId })
    assert.deepEqual(staged.preview.rejections, [])
    const unmapped = staged.preview.unmappedFields['recurring-services'].join(' ')
    assert.match(unmapped, /weekday differs from its start date/)
    assert.match(unmapped, /no exact native rule/)
    assert.equal((await h.state()).agreements.length, 0, 'stage has no product records')
    const input = { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }
    const previewed = await h.state()
    await office.run('import.commit', input, { error: 'FORBIDDEN' })
    await committer.run('import.commit', { ...input, fingerprint: 'not-reviewed' }, { error: 'IMPORT_REVIEW' })
    assert.deepEqual(await h.state(), previewed)
    batch = await committer.run('import.commit', input, { commandId: commitId })
    imported = await h.state()
    const rows = await agreements(h)
    assert.equal(rows.length, 2)
    assert.deepEqual(rows.map(a => a.source.id).sort(), ['18', '38'])
    const siteId = id => imported.sites.find(s => source(s) && s.source.id === id)?.id
    const skuId = id => imported.services.find(s => source(s) && s.source.id === id.split(':').at(-1))?.id
    for (const [id, end, months] of [['18', '2026-12-31', 12], ['38', null, null]]) {
      const a = rows.find(a => a.source.id === id)
      assert.equal(a.startDate, '2026-01-01'); assert.equal(a.endDate, end)
      assert.equal(a.plan.termMonths, months); assert.equal(a.active, true)
      assert.deepEqual(a.siteIds.slice().sort(), [siteId('4'), siteId('25')].sort())
      assert.deepEqual(a.importedEntitlements.map(e => [e.sourceId, e.recurringServiceId, e.siteId, e.due, e.completed, e.sourceClosed]), expectedEvents.filter(e => e[0] === id).map(([, event, rs, site, date, completed, closed]) => [event, rs, siteId(site), date, completed, closed]))
      for (const e of a.importedEntitlements) {
        const expected = expectedEvents.find(x => x[1] === e.sourceId)
        assert.deepEqual(e.lines.map(l => [l.serviceId, l.description, l.quantity, l.unitPrice]), expectedLines[expected[3]].map(([sku, ...rest]) => [skuId(sku), ...rest]))
      }
      assert.deepEqual([a.entitlements.included, a.entitlements.used, a.entitlements.sourceClosed, a.entitlements.declined, a.entitlements.left, a.entitlements.booked], [6, 2, 2, 0, 2, 0])
      assert.deepEqual(a.declines ?? [], [], 'source closure is not a customer decline')
      const index = a.importedEntitlements.findIndex(e => e.sourceClosed)
      const before = await h.state()
      await h.command('agreement.decline', { agreementId: a.id, version: a.version, index, method: 'phone', customerName: 'Synthetic customer', reason: 'Not a new decline' }, { error: 'ENTITLEMENT' })
      assert.deepEqual(await h.state(), before)
    }
    const due = (await read(h, '/api/glove/due-visits?through=2026-12-31')).visits
    assert.equal(due.length, 4)
    assert.deepEqual(due.map(v => [v.importedEventId, v.siteId, v.due, v.completed, v.sourceClosed, v.declined]).sort(), [
      ['22', siteId('4'), '2026-11-15', false, false, null],
      ['35', siteId('25'), '2026-12-22', false, false, null],
      ['42', siteId('4'), '2026-11-02', false, false, null],
      ['45', siteId('25'), '2026-11-16', false, false, null],
    ].sort())
    inactive = await snapshot(h)
  })

  await scenario(t, 'Point 2: labelled source billing amounts confer no payment authority through replay or actual Worker restart', async () => {
    for (const [id, price, frequency, template] of [['18', '240.00', 'Annually', '17'], ['38', '19.50', 'Monthly', '37']]) {
      const a = imported.agreements.find(a => a.source.id === id)
      assert.equal(a.plan.price, price)
      assert.equal(a.sourceTerms.billingFrequency, frequency)
      assert.equal(a.sourceTerms.billingTemplateId, template)
      assert.match(a.sourceTerms.priceBasis, /not a new sale or an authorization to charge/)
      assert.equal(a.plan.sourceBenefitsUnavailable, true)
      assert.equal(a.soldOn, null, 'imported source amount is not a new sale')
    }
    await noBillingEffects(h)
    await h.restart()
    assert.deepEqual(await snapshot(h), inactive)
    assert.deepEqual(await h.command('import.stage', stageInput, { commandId: stageId }), staged)
    assert.deepEqual(await committer.run('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }, { commandId: commitId }), batch)
    assert.deepEqual(await snapshot(h), inactive)
    await noBillingEffects(h)
  })

  await scenario(t, 'Point 3: monthly and weekly proposals need explicit people, exact future dates and original ends; unsafe changes leave records unchanged', async () => {
    const jobs = imported.jobs.filter(j => j.importedRecurrence)
    assert.equal(jobs.length, 6)
    for (const j of jobs) {
      assert.equal(j.importedRecurrence.active, false)
      assert.equal(j.series, undefined)
      assert.equal(imported.visits.filter(v => v.jobId === j.id).length, 0)
    }
    const monthly = jobs.find(j => j.source.id === '19'), weekly = jobs.find(j => j.source.id === '39')
    assert.deepEqual(monthly.importedRecurrence.proposal, { rule: { unit: 'month', interval: 6, months: null, day: 15, nth: null, weekday: null }, from: '2026-01-01', until: '2028-12-31', coveredThrough: '2026-11-15' })
    assert.deepEqual(weekly.importedRecurrence.proposal, { rule: { unit: 'week', interval: 2, months: null, day: null, nth: null, weekday: null }, from: '2026-10-05', until: '2027-01-31', coveredThrough: '2026-11-02' })
    const activations = []
    for (const [job, first, until, badEarly, badRule, start, end, dates] of [
      [monthly, '2027-01-15', '2028-12-31', '2026-07-15', '2027-02-15', '09:30', '10:45', ['2027-01-15', '2027-07-15']],
      [weekly, '2026-11-16', '2027-01-31', '2026-11-02', '2026-11-17', '13:00', '14:30', ['2026-11-16', '2026-11-30', '2026-12-14', '2026-12-28', '2027-01-11', '2027-01-25']],
    ]) {
      const input = { jobId: job.id, version: job.version, importedRule: true, date: first, until, technicianId: technician.id, start, end }
      for (const patch of [{ date: badEarly }, { date: badRule }, { until: undefined }, { until: null }, { until: '2027-02-01' }]) {
        const before = await h.state()
        await dispatcher.run('series.create', { ...input, ...patch }, { error: 'IMPORT_RECURRENCE' })
        assert.deepEqual(await h.state(), before)
      }
      for (const field of ['technicianId', 'start', 'end']) {
        const before = await h.state()
        const response = await h.request('/api/glove/commands', { as: dispatcher.cookie, method: 'POST', body: { commandId: randomUUID(), type: 'series.create', payload: { ...input, [field]: undefined } } })
        assert.equal((await response.json()).ok, false, `explicit ${field} required`)
        assert.deepEqual(await h.state(), before)
      }
      const commandId = randomUUID()
      const active = await dispatcher.run('series.create', input, { commandId })
      assert.deepEqual(active.series.revisions[0].rule, job.importedRecurrence.proposal.rule)
      assert.equal(active.series.until, until)
      assert.deepEqual(active.series.revisions[0].by, { id: dispatcher.id, name: dispatcher.name, role: 'dispatcher' })
      const visits = (await h.state()).visits.filter(v => v.jobId === job.id)
      assert.deepEqual(visits.map(v => v.local.date).sort(), dates)
      assert.ok(visits.every(v => v.technicianId === technician.id && v.local.start === start && v.local.end === end && v.local.date > job.importedRecurrence.proposal.coveredThrough))
      activations.push({ input, commandId, active })
    }
    for (const id of ['49', '50']) {
      const job = jobs.find(j => j.source.id === id)
      assert.equal(job.importedRecurrence.proposal, null)
      assert.match(job.importedRecurrence.unmapped, id === '49' ? /weekday differs/ : /no exact native rule/)
      const before = await h.state()
      await dispatcher.run('series.create', { jobId: job.id, version: job.version, importedRule: true, date: '2027-01-15', until: '2028-12-31', technicianId: technician.id, start: '15:00', end: '16:00' }, { error: 'IMPORT_RECURRENCE' })
      assert.deepEqual(await h.state(), before)
    }
    const active = await snapshot(h)
    const beforeUndo = await h.state()
    await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Activated visits must survive' }, { error: 'IMPORT_DEPENDENTS' })
    assert.deepEqual(await h.state(), beforeUndo)
    await h.restart()
    for (const { input, commandId, active } of activations) assert.deepEqual(await dispatcher.run('series.create', input, { commandId }), active)
    await committer.run('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }, { commandId: commitId })
    assert.deepEqual(await snapshot(h), active, 'restart and command replay preserve agreements, entitlements, proposals and visits')
    await noBillingEffects(h)
    const { activity, exported } = await assertTrail(h, ['import.previewed', 'import.committed', 'series.created'])
    const owner = (await read(h, '/auth/session')).operator
    for (const [kind, subject, person, commandId] of [
      ['import.previewed', batch.id, owner, stageId],
      ['import.committed', batch.id, committer, commitId],
      ...activations.map(x => ['series.created', x.input.jobId, dispatcher, x.commandId]),
    ]) {
      const rows = activity.filter(e => e.kind === kind && e.subjectId === subject)
      assert.equal(rows.length, 1, 'replay creates no duplicate Activity')
      assert.deepEqual([rows[0].actorId, rows[0].actorName, rows[0].commandId, rows[0].at], [person.id, person.name ?? person.displayName, commandId, '2026-11-09T12:00:00.000Z'])
      const kept = exported.timeline.filter(e => e.id === rows[0].id)
      assert.equal(kept.length, 1)
      assert.deepEqual([kept[0].actor_id, kept[0].actor_name, kept[0].command_id, kept[0].at], [rows[0].actorId, rows[0].actorName, commandId, rows[0].at])
    }
    assert.deepEqual(exported.agreements, (await h.state()).agreements)
    await h.command('role.set', { operatorId: committer.id, role: 'viewer' })
    const before = await h.state()
    await committer.run('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }, { commandId: commitId, error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), before, 'withdrawn authority cannot replay a privileged import')
    const customer = imported.customers.find(source)
    const erasure = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: erasure.fingerprint })
    await h.restart()
    const erased = await h.state()
    await h.command('import.stage', stageInput, { commandId: stageId, error: 'ERASED' })
    for (const { input, commandId } of activations) await dispatcher.run('series.create', input, { commandId, error: 'ERASED' })
    assert.deepEqual(await h.state(), erased, 'replayed captures cannot resurrect erased membership records')
    const afterErasure = await exportBusiness(h)
    assert.ok(!JSON.stringify(afterErasure).includes('Synthetic ServiceTitan Customer'))
    assert.ok(!JSON.stringify(afterErasure).includes('Synthetic ongoing member'))
  })
})
