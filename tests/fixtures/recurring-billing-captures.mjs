import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { shop, line } from './recurring-billing-plan.mjs'
import { shape, total, filter, visit50 } from './recurring-billing-steps.mjs'

// PLAN-005 points 5 to 8: what a draft carries, what never bills, what never
// repeats and which capture is claimed once.
const coilLine = quantity => ['Extra coil clean (added on site, approved by Pat Manager)', quantity, '30.00']
const expenseLine = (text, amount) => [text, '1', amount]

export async function contents(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const fixedAfter = await s.repeat(await s.job('Fixed after visit'), { mode: 'fixed-after-visit', lines: [line('75.00', 'Visit fee')] }, { start: '11:00', end: '12:00', until: '2025-01-29' })
  const fixedMonthly = await s.repeat(await s.job('Fixed monthly'), { mode: 'fixed-monthly', lines: [line('240.00', 'Monthly fee'), line('15.00', 'Fuel surcharge')] }, { start: '13:00', end: '14:00', until: '2025-01-29' })
  const perVisit = await s.repeat(await s.job('Per-visit contents'), { mode: 'per-visit' }, { until: '2025-02-05' })
  const [first, second] = [await s.visitOn(perVisit.id, '2025-01-29'), await s.visitOn(perVisit.id, '2025-02-05')]
  // Another visit's expense, an office expense with no visit and one that is not billable all exist before the first draft.
  await s.expense(second, { vendor: 'County', description: 'Second visit permit', amount: '9.00' })
  await s.expense(first, { vendor: 'City', description: 'Not billable', amount: '4.00', billable: false })
  await h.command('expense.record', { jobId: perVisit.id, category: 'other', vendor: 'Office', description: 'Job-wide fee', amount: '20.00', billable: true })
  await s.serve(fixedAfter.id, '2025-01-29', { materials: ['2'], lines: ['1'], expenses: [{ vendor: 'City', description: 'Fixed visit permit', amount: '20.00' }] })
  await s.serve(fixedMonthly.id, '2025-01-29', { materials: ['4'], lines: ['1'], expenses: [{ vendor: 'City', description: 'Monthly permit', amount: '30.00' }] })
  await s.serve(perVisit.id, '2025-01-29', { materials: ['2'], lines: ['1'], expenses: [{ vendor: 'City', description: 'First visit permit', amount: '12.00' }] })
  await s.cron('2025-01-31T08:00:00.000Z')
  const [afterDraft] = await s.drafts(fixedAfter.id), [monthDraft] = await s.drafts(fixedMonthly.id)
  assert.deepEqual(shape(afterDraft), [['Visit fee', '1', '75.00']], 'a fixed-after-visit draft carries exactly the rule price, whatever was captured')
  assert.deepEqual(shape(monthDraft), [['Monthly fee', '1', '240.00'], ['Fuel surcharge', '1', '15.00']], 'a fixed-monthly draft carries exactly its priced lines')
  assert.deepEqual([afterDraft.recurring.captureIds, monthDraft.recurring.captureIds], [[], []])
  assert.deepEqual([total(afterDraft), total(monthDraft)], ['75.00', '255.00'])
  const expenses = async () => Object.fromEntries((await h.state()).expenses.map(e => [e.description, e.invoiceId]))
  const [firstDraft] = await s.drafts(perVisit.id)
  assert.deepEqual(shape(firstDraft), [visit50, coilLine('1'), filter('2'), expenseLine('City: First visit permit', '12.00')], 'a per-visit draft carries that visit only: its work, materials and expense')
  assert.deepEqual(await expenses(), {
    'Fixed visit permit': null, 'Monthly permit': null, 'Second visit permit': null, 'Not billable': null, 'Job-wide fee': null, 'First visit permit': firstDraft.id,
  }, 'only that visit\'s unbilled billable expense is linked to its draft')
  await s.serve(perVisit.id, '2025-02-05', { materials: ['1'] })
  const [, secondDraft] = await s.drafts(perVisit.id)
  assert.deepEqual(shape(secondDraft), [visit50, filter('1'), expenseLine('County: Second visit permit', '9.00')], 'the next visit carries its own expense and none of the first')
  assert.equal((await expenses())['Second visit permit'], secondDraft.id)
  assert.equal((await expenses())['Job-wide fee'], null, 'an expense recorded for no visit is left for the office')
  assert.equal((await expenses())['First visit permit'], firstDraft.id, 'the first expense stays on its first draft')
}

export async function nothingBills(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const skipped = await s.repeat(await s.job('Skipped and cancelled'), { mode: 'per-visit' })
  const paused = await s.repeat(await s.job('Paused per-visit'), { mode: 'per-visit' }, { start: '11:00', end: '12:00', until: '2025-03-12' })
  const pausedMonthly = await s.repeat(await s.job('Paused monthly', '60.00'), { mode: 'fixed-monthly', lines: [line('60.00', 'Monthly fee')] }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '14:00', end: '15:00', until: '2025-03-31' })
  await s.serve(skipped.id, '2025-01-29', { materials: ['1'] })
  await s.serve(paused.id, '2025-01-29', { materials: ['1'] })
  await s.cron('2025-01-31T08:00:00.000Z')
  assert.deepEqual([(await s.drafts(skipped.id)).length, (await s.drafts(paused.id)).length, (await s.drafts(pausedMonthly.id)).length], [1, 1, 1])
  await h.setTime('2025-02-01T16:00:00.000Z')
  const job = id => h.state().then(state => state.jobs.find(j => j.id === id))
  for (const [target, billing] of [[paused, { mode: 'per-visit', paused: true }], [pausedMonthly, { mode: 'fixed-monthly', lines: [line('60.00', 'Monthly fee')], paused: true }]]) {
    const j = await job(target.id)
    await h.command('series.billing', { jobId: j.id, version: j.version, from: '2025-02-01', reason: 'Customer on hold', billing })
  }
  // A skipped visit and one a series change cancelled; a third is simply never done.
  const skip = await s.visitOn(skipped.id, '2025-02-05')
  await s.dispatcher.run('visit.cancel', { visitId: skip.id, version: skip.version, reason: 'Customer away' })
  const j = await job(skipped.id)
  await s.dispatcher.run('series.change', { jobId: j.id, version: j.version, from: '2025-02-12', reason: 'Later start', start: '10:00', end: '11:00' })
  const states = (await h.state()).visits.filter(v => v.jobId === skipped.id).map(v => [v.local.date, v.local.start, v.status])
  assert.deepEqual(states.filter(([date, start]) => start === '09:00' && date !== '2025-01-29').map(x => x[2]), ['cancelled', 'cancelled', 'cancelled'], 'the skipped visit and the two a series change replaced are cancelled')
  await s.serve(paused.id, '2025-02-05', { materials: ['3'] })
  await s.cron('2025-02-28T08:00:00.000Z')
  assert.deepEqual([(await s.drafts(skipped.id)).length, (await s.drafts(paused.id)).length, (await s.drafts(pausedMonthly.id)).length], [1, 1, 1], 'skipped, cancelled and paused work bills nothing')
  await h.setTime('2025-03-01T16:00:00.000Z')
  for (const [target, billing] of [[paused, { mode: 'per-visit' }], [pausedMonthly, { mode: 'fixed-monthly', lines: [line('60.00', 'Monthly fee')] }]]) {
    const j = await job(target.id)
    await h.command('series.billing', { jobId: j.id, version: j.version, from: '2025-03-01', reason: 'Resume', billing })
  }
  await s.serve(paused.id, '2025-03-05', { materials: ['1'] })
  await s.cron('2025-03-31T07:00:00.000Z')
  const resumed = await s.drafts(paused.id)
  assert.deepEqual(resumed.map(i => [i.recurring.dueDate, i.recurring.ruleRevision, ...shape(i)]), [['2025-01-29', 1, visit50, filter('1')], ['2025-03-05', 3, visit50, filter('1')]], 'the paused visit never bills, not even after the rule resumes')
  const months = await s.drafts(pausedMonthly.id)
  assert.deepEqual(months.map(i => [i.recurring.dueDate, i.recurring.ruleRevision]), [['2025-01-31', 1], ['2025-03-31', 3]], 'a paused month bills nothing; months without any visit still bill')
  assert.equal((await s.drafts(skipped.id)).length, 1)
  const due = await h.request('/api/glove/recurring-billing').then(r => r.json())
  assert.deepEqual(due.missed, [], 'a paused period is not reported as a missed date')
}

export async function neverTwice(t) {
  const s = await shop({ isolates: 2 }); t.after(() => s.h.close())
  const { h } = s
  let peer = await h.mf.getWorker('peer-1')
  const clock = async at => { await h.setTime(at); const r = await peer.fetch(h.origin + '/__test/clock', { method: 'POST', body: JSON.stringify({ at }) }); assert.equal(r.status, 200) }
  const onPeer = async (person, type, payload, commandId = randomUUID()) => {
    const response = await peer.fetch(h.origin + '/api/glove/commands', { method: 'POST', headers: { origin: h.origin, 'content-type': 'application/json', cookie: person.cookie }, body: JSON.stringify({ commandId, type, payload }) })
    return response.json()
  }
  const monthly = await s.repeat(await s.job('Monthly race', '40.00'), { mode: 'fixed-monthly', lines: [line('40.00', 'Monthly fee')] }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '14:00', end: '15:00', until: '2025-03-31' })
  const reminder = await s.repeat(await s.job('Reminder race'), { mode: 'as-needed' }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '16:00', end: '17:00', until: '2025-03-31' })
  const perVisit = await s.repeat(await s.job('Visit race'), { mode: 'per-visit' }, { until: '2025-01-29' })
  const unique = async () => {
    const state = await h.state(), all = [...state.invoices.filter(i => i.recurring).map(i => i.recurring.key), ...state.notices.filter(n => n.recurringBillingKey).map(n => n.recurringBillingKey)]
    assert.equal(new Set(all).size, all.length, 'every month, visit and close key commits once')
    return state
  }
  const count = async () => { const state = await unique(); return [state.invoices.filter(i => i.jobId === monthly.id).length, state.notices.filter(n => n.jobId === reminder.id).length, state.invoices.filter(i => i.jobId === perVisit.id).length] }
  // A command carrying the same visit completion twice, then the cron three times.
  const visit = await s.visitOn(perVisit.id, '2025-01-29')
  await clock(visit.endAt)
  await s.field.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  const complete = { visitId: visit.id, deviceTime: visit.endAt, summary: 'Done', signoff: { absentReason: 'Away' } }, commandId = randomUUID()
  const [fromApp, fromPeer] = await Promise.all([s.field.run('visit.complete', complete, { commandId }), onPeer(s.field, 'visit.complete', complete, commandId)])
  assert.equal(fromPeer.ok, true)
  assert.deepEqual(fromPeer.result, fromApp, 'the same command on the other isolate replays one result')
  assert.deepEqual(await s.field.run('visit.complete', complete, { commandId }), fromApp)
  assert.deepEqual(await count(), [0, 0, 1], 'one draft for the completed visit')
  // Month end: a billing run, the same run on the other isolate and an ordinary command race.
  for (const at of ['2025-01-31T08:00:00.000Z', '2025-02-28T08:00:00.000Z']) {
    await clock(at)
    const run = randomUUID()
    const results = await Promise.all([s.office.run('series.billingRun', {}, { commandId: run }), onPeer(s.office, 'series.billingRun', {}, run), onPeer(s.dispatcher, 'customer.save', { name: `Racing customer ${at}` }), h.scheduled(at), s.office.run('series.billingRun', {})])
    assert.equal(results[1].ok, true)
    assert.equal(results[2].ok, true)
  }
  assert.deepEqual(await count(), [2, 2, 1], 'two months, two reminders, one visit, however the commands raced')
  const before = await h.state()
  for (let pass = 0; pass < 3; pass++) await h.scheduled('2025-02-28T08:00:00.000Z')
  assert.deepEqual(await count(), [2, 2, 1])
  await h.restart()
  peer = await h.mf.getWorker('peer-1')
  await clock('2025-02-28T08:00:00.000Z')
  assert.deepEqual(await s.field.run('visit.complete', complete, { commandId }), fromApp, 'replay survives an actual Worker restart')
  await h.scheduled('2025-02-28T08:00:00.000Z')
  await s.office.run('series.billingRun', {})
  assert.deepEqual(await count(), [2, 2, 1], 'restart and a further pass add nothing')
  const after = await h.state()
  assert.deepEqual(after.invoices.map(i => i.id), before.invoices.map(i => i.id))
  assert.deepEqual(after.notices.map(n => n.id).sort(), before.notices.map(n => n.id).sort())
}

export async function claimedOnce(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const job = id => h.state().then(state => state.jobs.find(j => j.id === id))
  const forward = async (id, from, mode) => { const j = await job(id); await h.command('series.billing', { jobId: id, version: j.version, from, reason: `Switch to ${mode}`, billing: { mode } }) }
  const claims = async id => { const state = await h.state(), seen = state.invoices.filter(i => i.jobId === id).flatMap(i => i.recurring?.captureIds ?? []); assert.equal(new Set(seen).size, seen.length, 'no capture is claimed by two invoices'); return seen }
  const base = ['Preventive maintenance', '1', '80.00']
  const toClose = await s.repeat(await s.job('Per-visit to on-close', '80.00'), { mode: 'per-visit' }, { until: '2025-02-12' })
  const around = await s.repeat(await s.job('On-close, per-visit, on-close', '80.00'), { mode: 'on-close' }, { start: '11:00', end: '12:00', until: '2025-02-19' })
  // The earlier job-wide workflow: no rule, an ordinary GLOVE-09 invoice, then the Owner's forward rule.
  const old = await s.repeat(await s.job('Earlier job-wide workflow', '80.00'), undefined, { start: '13:00', end: '14:00', until: '2025-02-05' })
  await s.serve(toClose.id, '2025-01-29', { materials: ['2'] })
  await s.serve(around.id, '2025-01-29', { materials: ['1'] })
  assert.deepEqual((await s.drafts(toClose.id)).map(shape), [[base, filter('2')]], 'the per-visit draft claims the first visit\'s material')
  await h.setTime('2025-02-03T16:00:00.000Z')
  await forward(toClose.id, '2025-02-03', 'on-close')
  await forward(around.id, '2025-02-03', 'per-visit')
  await s.serve(toClose.id, '2025-02-05', { materials: ['1'] })
  await s.serve(around.id, '2025-02-05', { materials: ['2'] })
  // Visit B arrives and records its material; visit A completes late, closing the job, and the office invoices the job as a whole.
  const [a, b] = [await s.visitOn(old.id, '2025-01-29'), await s.visitOn(old.id, '2025-02-05')]
  await h.setTime(b.startAt)
  await s.field.run('visit.arrive', { visitId: b.id, deviceTime: b.startAt })
  await s.field.run('visit.capture', { visitId: b.id, deviceTime: b.startAt, kind: 'material', serviceId: s.material.id, quantity: '3' })
  await h.setTime('2025-02-05T20:00:00.000Z')
  await s.field.run('visit.arrive', { visitId: a.id, deviceTime: '2025-02-05T20:00:00.000Z' })
  await s.field.run('visit.complete', { visitId: a.id, deviceTime: '2025-02-05T20:00:00.000Z', summary: 'Late visit', signoff: { absentReason: 'Away' } })
  const ordinary = await s.office.run('invoice.prepare', { jobId: old.id })
  assert.deepEqual(shape({ revisions: [ordinary.revisions[0]] }), [['Preventive maintenance', '1', '80.00'], filter('3')], 'the ordinary invoice carries visit B\'s material')
  await h.setTime('2025-02-05T21:00:00.000Z')
  await forward(old.id, '2025-02-05', 'per-visit')
  await h.setTime('2025-02-05T22:00:00.000Z')
  await s.field.run('visit.complete', { visitId: b.id, deviceTime: '2025-02-05T22:00:00.000Z', summary: 'Done', signoff: { absentReason: 'Away' } })
  assert.deepEqual((await s.drafts(old.id)).map(shape), [[['Preventive maintenance', '1', '80.00']]], 'a material on an ordinary invoice of the job is not billed again by the per-visit draft')
  await h.setTime('2025-02-10T16:00:00.000Z')
  await forward(around.id, '2025-02-10', 'on-close')
  await s.serve(toClose.id, '2025-02-12', { materials: ['3'] })
  await s.serve(around.id, '2025-02-12', { materials: ['3'] })
  await s.serve(around.id, '2025-02-19', { materials: ['4'] })
  await s.cron('2025-02-20T08:00:00.000Z')
  await s.cron('2025-02-20T08:00:00.000Z')
  assert.deepEqual((await s.drafts(toClose.id)).map(i => [i.recurring.mode, ...shape(i)]), [['per-visit', base, filter('2')], ['on-close', base, filter('1'), filter('3')]], 'close bills only what the per-visit draft left')
  assert.deepEqual((await s.drafts(around.id)).map(i => [i.recurring.mode, i.recurring.ruleRevision, ...shape(i)]), [['per-visit', 2, base, filter('2')], ['on-close', 3, base, filter('1'), filter('3'), filter('4')]], 'a forward change back to on-close never bills the per-visit capture again')
  for (const id of [toClose.id, around.id, old.id]) await claims(id)
  assert.equal((await claims(toClose.id)).length, 3)
  assert.equal((await claims(around.id)).length, 4)
}

export async function progressStageClaimsNothing(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  // An explicit progress stage prices only the lines it lists, so the unbilled $21.00 of filters stays billable when the Owner later enables per-visit billing.
  let quote = await h.command('quote.draft', { customerId: s.customer.id, siteId: s.site.id, title: 'Maintenance contract', lines: [line('80.00')] })
  quote = await h.command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  quote = await h.command('quote.accept', { quoteId: quote.id, version: quote.version, revision: 1, method: 'phone', customerName: 'Pat Manager' })
  const job = await h.command('job.create', { quoteId: quote.id })
  await h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-29', rule: { unit: 'week' }, technicianId: s.technician.id, start: '09:00', end: '10:00', until: '2025-02-05' })
  const visit = await s.visitOn(job.id, '2025-01-29')
  await h.setTime(visit.startAt)
  await s.field.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await s.field.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', serviceId: s.material.id, quantity: '3' })
  const stage = await s.office.run('invoice.prepare', { jobId: job.id, progress: { name: 'Initial service stage', final: false }, lines: [line('20.00', 'Initial service stage')] })
  assert.deepEqual(shape(stage), [['Initial service stage', '1', '20.00']], 'the progress stage lists no filter')
  const current = (await h.state()).jobs.find(j => j.id === job.id)
  await h.command('series.billing', { jobId: job.id, version: current.version, from: '2025-01-29', reason: 'Bill future completed visits', billing: { mode: 'per-visit' } })
  await h.setTime(visit.endAt)
  await s.field.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Maintenance complete', signoff: { absentReason: 'Manager away' } })
  await s.cron('2025-01-31T08:00:00.000Z')
  const [draft, ...others] = await s.drafts(job.id)
  assert.equal(others.length, 0)
  assert.deepEqual(shape(draft), [['Preventive maintenance', '1', '80.00'], filter('3')], 'the three filters are billed once, on the visit draft')
  assert.equal(total(draft), '101.00')
  assert.equal(draft.recurring.captureIds.length, 1)
}
