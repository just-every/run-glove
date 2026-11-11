import assert from 'node:assert/strict'
import { shop, line } from './recurring-billing-plan.mjs'

// PLAN-005 points 1 to 4. Each step owns its installation and drives the
// harness runtime clock, Worker cron, native commands and the technician's own
// session; drafts and reminders are read from the same state the Owner sees.
export const shape = invoice => invoice.revisions[0].lines.map(l => [l.description, l.quantity, l.unitPrice])
export const total = invoice => invoice.revisions[0].totals.total
export const filter = quantity => ['Replacement filter (used on site)', quantity, '7.00']
export const visit50 = ['Preventive maintenance', '1', '50.00']
export const refused = async (h, run, type, payload, error) => {
  // A token's own last-used stamp is its audit of the refused call, never job data.
  const read = async () => ({ ...(await h.state()), integrationTokens: undefined })
  const before = await read()
  await run(type, payload, { error })
  assert.deepEqual(await read(), before, `${error} leaves every record and Activity unchanged`)
}

export async function schedules(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const perVisit = await s.repeat(await s.job('Per-visit service'), { mode: 'per-visit' })
  const pm = await s.repeat(await s.job('Quarterly commercial PM', '240.00'), { mode: 'fixed-monthly', lines: [line('240.00', 'Quarterly commercial PM')] }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '11:00', end: '12:00', until: '2025-03-31' })
  const closing = await s.repeat(await s.job('On-close service', '80.00'), { mode: 'on-close' }, { date: '2025-02-05', until: '2025-02-12', start: '13:00', end: '14:00' })
  assert.deepEqual((await s.visits(perVisit.id)).map(v => v.local.date), ['2025-01-29', '2025-02-05', '2025-02-12', '2025-02-19'])
  await s.serve(perVisit.id, '2025-01-29', { materials: ['1'] })
  assert.deepEqual((await s.drafts(perVisit.id)).map(shape), [[visit50, filter('1')]], 'the month 1 visit drafts when it completes')
  await s.cron('2025-01-31T08:00:00.000Z')
  await s.serve(perVisit.id, '2025-02-05', { materials: ['2'] })
  await s.serve(closing.id, '2025-02-05', { materials: ['2'] })
  assert.deepEqual(await s.drafts(closing.id), [], 'an on-close series waits for its job to close')
  await s.serve(perVisit.id, '2025-02-12', { materials: ['3'] })
  await s.serve(closing.id, '2025-02-12', { materials: ['1'] })
  const third = await s.visitOn(perVisit.id, '2025-02-19')
  await h.setTime('2025-02-13T16:00:00.000Z')
  await s.dispatcher.run('visit.cancel', { visitId: third.id, version: third.version, reason: 'Customer closed that week' })
  await s.cron('2025-02-28T08:00:00.000Z')
  for (let pass = 0; pass < 3; pass++) await s.cron('2025-03-31T07:00:00.000Z')
  const visits = await s.drafts(perVisit.id), months = await s.drafts(pm.id), close = await s.drafts(closing.id)
  assert.deepEqual(visits.map(i => [i.recurring.dueDate, ...shape(i)]), [['2025-01-29', visit50, filter('1')], ['2025-02-05', visit50, filter('2')], ['2025-02-12', visit50, filter('3')]], 'exactly one draft per completed visit, none for the skipped third or for month 3')
  assert.deepEqual(visits.map(total), ['57.00', '64.00', '71.00'])
  assert.equal(new Set(visits.map(i => i.recurring.visitId)).size, 3)
  assert.deepEqual(months.map(i => [i.recurring.dueDate, i.recurring.proposedIssuedOn, i.recurring.periodStart, shape(i), total(i), i.status]), [
    ['2025-01-31', '2025-01-31', '2025-01-01', [['Quarterly commercial PM', '1', '240.00']], '240.00', 'draft'],
    ['2025-02-28', '2025-02-28', '2025-02-01', [['Quarterly commercial PM', '1', '240.00']], '240.00', 'draft'],
    ['2025-03-31', '2025-03-31', '2025-03-01', [['Quarterly commercial PM', '1', '240.00']], '240.00', 'draft'],
  ], 'a quarterly PM job bills $240.00 on the last day of each of three months')
  assert.deepEqual(close.map(i => [i.recurring.dueDate, ...shape(i)]), [['2025-02-12', ['Preventive maintenance', '1', '80.00'], filter('2'), filter('1')]], 'the on-close series invoices once, when its job closes')
  assert.equal((await h.state()).invoices.length, 7, 'no other invoice exists')
}

export async function ownerRules(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const created = await s.repeat(await s.job('Owner rule at creation'), { mode: 'per-visit' })
  const rule = (job, n) => job.series.billing.revisions[n]
  assert.deepEqual([rule(created, 0).n, rule(created, 0).mode, rule(created, 0).from, rule(created, 0).by.role, rule(created, 0).by.name], [1, 'per-visit', '2025-01-29', 'owner', 'Olivia Owner'])
  await h.setTime('2025-01-05T16:00:00.000Z')
  let job = (await h.state()).jobs.find(j => j.id === created.id)
  job = await h.command('series.change', { jobId: job.id, version: job.version, from: '2025-02-05', reason: 'Price from February', billing: { mode: 'fixed-after-visit', lines: [line('75.00', 'Visit fee')] } })
  assert.deepEqual([rule(job, 1).n, rule(job, 1).mode, rule(job, 1).from, rule(job, 1).by.role], [2, 'fixed-after-visit', '2025-02-05', 'owner'], 'a dated series change carries the Owner rule')
  job = await h.command('series.billing', { jobId: job.id, version: job.version, from: '2025-02-12', reason: 'Close out', billing: { mode: 'on-close' } })
  assert.deepEqual([rule(job, 2).n, rule(job, 2).mode, rule(job, 2).from, rule(job, 2).by.role], [3, 'on-close', '2025-02-12', 'owner'], 'the series billing action carries the Owner rule')
  const events = (await h.state()).events.filter(e => e.jobId === job.id && e.kind === 'series.billingChanged')
  assert.deepEqual(events.map(e => e.actorRole), ['owner', 'owner', 'owner'], 'Activity names the Owner for every revision')

  // Scheduling alone never grants money authority.
  const plain = await s.job('Dispatcher schedule')
  const scheduled = await s.dispatcher.run('series.create', { jobId: plain.id, version: plain.version, date: '2025-01-29', rule: { unit: 'week' }, technicianId: s.technician.id, start: '14:00', end: '15:00', until: '2025-02-12' })
  assert.equal(scheduled.series.billing, undefined, 'a dispatcher can schedule a series with no invoicing rule')
  const priced = await s.job('Refused pricing')
  const create = { jobId: priced.id, version: priced.version, date: '2025-01-29', rule: { unit: 'week' }, technicianId: s.technician.id, start: '16:00', end: '17:00', until: '2025-02-12', billing: { mode: 'per-visit' } }
  const people = [['dispatcher', s.dispatcher.run], ['office', s.office.run], ['technician', s.field.run], ['custom role', s.custom.run], ['integration token', (type, payload, opts) => s.token.run(type, payload, opts)]]
  for (const [, run] of people) await refused(h, run, 'series.create', create, 'FORBIDDEN')
  assert.equal((await h.state()).jobs.find(j => j.id === priced.id).series, undefined, 'the job keeps no series after every refusal')
  const forward = { jobId: scheduled.id, version: scheduled.version, from: '2025-02-05', reason: 'Try pricing', billing: { mode: 'fixed-monthly', lines: [line('99.00')] } }
  for (const [, run] of people) {
    await refused(h, run, 'series.billing', forward, 'FORBIDDEN')
    await refused(h, run, 'series.change', forward, 'FORBIDDEN')
  }
  assert.equal((await h.state()).jobs.find(j => j.id === scheduled.id).series.billing, undefined, 'no rule exists after every refusal')
}

export async function revisions(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  await h.setTime('2025-01-10T16:00:00.000Z')
  const monthly = (price, description = 'Monthly service') => ({ mode: 'fixed-monthly', lines: [line(price, description)] })
  const job = await s.repeat(await s.job('Revised fixed price', '90.00'), monthly('90.00'), { date: '2025-01-20', rule: { unit: 'month', interval: 3 }, start: '11:00', end: '12:00', until: '2025-03-31' })
  const change = (from, billing, reason = 'Revised price') => ({ jobId: job.id, version: null, from, reason, billing })
  const current = async () => (await h.state()).jobs.find(j => j.id === job.id)
  const attempt = async (type, from, error) => { const j = await current(); await refused(h, (t, p, o) => h.command(t, p, o), type, { ...change(from, monthly('1.00')), version: j.version }, error) }
  await attempt('series.billing', '2025-01-09', 'BILLING_DATE')
  await attempt('series.billing', '2025-01-19', 'BILLING_DATE')
  await s.cron('2025-01-31T08:00:00.000Z')
  const [january] = await s.drafts(job.id)
  assert.deepEqual([january.recurring.ruleRevision, january.recurring.periodStart, january.recurring.periodEnd, shape(january), total(january)], [1, '2025-01-20', '2025-01-31', [['Monthly service', '1', '90.00']], '90.00'], 'revision 1 bills from its own mid-month date')
  await h.setTime('2025-02-01T16:00:00.000Z')
  let j = await current()
  j = await h.command('series.billing', { ...change('2025-02-10', monthly('100.00')), version: j.version })
  await attempt('series.billing', '2025-02-05', 'BILLING_DATE')
  await attempt('series.billing', '2025-01-31', 'BILLING_DATE')
  assert.deepEqual((await s.drafts(job.id)), [january], 'a forward change leaves the earlier draft exactly as it was')
  await s.cron('2025-02-28T08:00:00.000Z')
  const february = (await s.drafts(job.id))[1]
  assert.deepEqual([february.recurring.ruleRevision, february.recurring.periodStart, february.recurring.periodEnd, shape(february), total(february)], [2, '2025-02-10', '2025-02-28', [['Monthly service', '1', '100.00']], '100.00'], 'revision 2 bills that month from its own date')
  // Scope finding, never proration: 1 to 9 February belongs to revision 1,
  // which has no February key, so those nine days are neither invoiced nor named.
  assert.equal((await s.drafts(job.id)).length, 2)
  assert.ok((await s.drafts(job.id)).every(i => i.recurring.periodEnd < '2025-02-01' || i.recurring.periodStart >= '2025-02-10'), 'no invoice names 1 to 9 February')
  await h.setTime('2025-03-01T16:00:00.000Z')
  j = await current()
  j = await h.command('series.change', { ...change('2025-03-01', monthly('120.00')), version: j.version })
  assert.deepEqual(j.series.billing.revisions.map(r => [r.n, r.from, r.mode]), [[1, '2025-01-20', 'fixed-monthly'], [2, '2025-02-10', 'fixed-monthly'], [3, '2025-03-01', 'fixed-monthly']])
  await s.cron('2025-03-31T07:00:00.000Z')
  const drafts = await s.drafts(job.id)
  assert.deepEqual(drafts.map(i => [i.recurring.ruleRevision, i.recurring.periodStart, total(i)]), [[1, '2025-01-20', '90.00'], [2, '2025-02-10', '100.00'], [3, '2025-03-01', '120.00']])
  assert.deepEqual(drafts.slice(0, 2), [january, february], 'earlier drafts keep their revision, lines and totals after every forward change')
}

export async function modes(t) {
  const s = await shop(); t.after(() => s.h.close())
  const { h } = s
  const one = { date: '2025-01-29', until: '2025-01-29' }
  const perVisit = await s.repeat(await s.job('Per-visit mode'), { mode: 'per-visit' }, { ...one, start: '09:00', end: '10:00' })
  const afterVisit = await s.repeat(await s.job('Fixed after visit'), { mode: 'fixed-after-visit', lines: [line('75.00', 'Visit fee')] }, { start: '11:00', end: '12:00', until: '2025-02-05' })
  const onClose = await s.repeat(await s.job('On-close mode', '60.00'), { mode: 'on-close' }, { ...one, start: '13:00', end: '14:00' })
  const monthly = await s.repeat(await s.job('Fixed monthly mode'), { mode: 'fixed-monthly', lines: [line('40.00', 'Monthly fee')] }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '15:00', end: '16:00', until: '2025-03-31' })
  const asNeeded = await s.repeat(await s.job('As-needed mode'), { mode: 'as-needed' }, { date: '2025-01-01', rule: { unit: 'month', interval: 3 }, start: '16:30', end: '17:00', until: '2025-03-31' })
  for (const [job, date, materials] of [[perVisit, '2025-01-29', ['1']], [afterVisit, '2025-01-29', ['2']], [onClose, '2025-01-29', ['3']]]) await s.serve(job.id, date, { materials })
  await s.cron('2025-01-31T08:00:00.000Z')
  await s.serve(afterVisit.id, '2025-02-05', { materials: ['1'] })
  await s.cron('2025-02-28T08:00:00.000Z')
  await s.cron('2025-03-31T07:00:00.000Z')
  const state = await h.state()
  const kinds = async job => (await s.drafts(job.id)).map(i => [i.recurring.mode, i.recurring.key.slice(job.id.length + 1).split(':')[0], i.recurring.dueDate])
  assert.deepEqual(await kinds(perVisit), [['per-visit', 'visit', '2025-01-29']])
  assert.deepEqual(await kinds(afterVisit), [['fixed-after-visit', 'visit', '2025-01-29'], ['fixed-after-visit', 'visit', '2025-02-05']])
  assert.deepEqual(await kinds(onClose), [['on-close', 'close', '2025-01-29']])
  assert.deepEqual(await kinds(monthly), [['fixed-monthly', 'month', '2025-01-31'], ['fixed-monthly', 'month', '2025-02-28'], ['fixed-monthly', 'month', '2025-03-31']])
  assert.deepEqual(await kinds(asNeeded), [], 'an as-needed rule never prepares an invoice')
  assert.deepEqual((await s.drafts(afterVisit.id)).map(shape), [[['Visit fee', '1', '75.00']], [['Visit fee', '1', '75.00']]])
  assert.deepEqual(state.invoices.filter(i => i.jobId === asNeeded.id), [])
  const reminders = state.notices.filter(n => n.jobId === asNeeded.id)
  assert.deepEqual(reminders.map(n => [n.billingDate, n.to]), [['2025-01-31', ['owner', 'office']], ['2025-02-28', ['owner', 'office']], ['2025-03-31', ['owner', 'office']]], 'one month-end reminder for the owner and office per month')
  assert.deepEqual(state.notices.filter(n => n.recurringBillingKey).length, 3, 'no other mode raises a reminder')
  assert.equal((await s.office.state()).notices.filter(n => n.jobId === asNeeded.id).length, 3, 'the office reads the reminders')
  assert.equal(state.invoices.length, 7)
}
