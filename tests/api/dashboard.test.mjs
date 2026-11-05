import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, dashboardAt, dashboardNextDay, dashboardFixture, advanceDashboard } from './harness.mjs'

test('REPORT-001 native Today slices retain exact local-day jobs, accepted values, open quotes, unbilled jobs and active timers after restart without writes', async t => {
  const h = await installation({ at: dashboardAt })
  t.after(() => h.close())
  const f = await dashboardFixture(h), { b } = f
  await h.restart()
  const before = await h.state()
  const quote = id => before.quotes.find(q => q.id === id)
  assert.deepEqual([quote(f.chosen.id).acceptance.revision, quote(f.chosen.id).acceptance.totals], [2, { subtotal: '225.00', gst: '22.50', total: '247.50' }])
  assert.deepEqual([quote(f.late.id).acceptance.revision, quote(f.late.id).acceptance.totals], [1, { subtotal: '37.50', gst: '3.75', total: '41.25' }])
  assert.deepEqual([f.revised, f.approved, f.sent].map(q => {
    const saved = quote(q.id)
    return [saved.id, saved.status, saved.revisions.at(-1).n, saved.revisions.at(-1).totals.total]
  }), [[f.revised.id, 'draft', 2, '44.00'], [f.approved.id, 'approved', 1, '55.00'], [f.sent.id, 'sent', 1, '66.00']])
  const read = async () => {
    const response = await h.request('/api/glove/dashboard')
    assert.equal(response.status, 200)
    return response.json()
  }
  const d = await read()
  const by = (rows, key) => [...rows].sort((a, b) => a[key].localeCompare(b[key]))
  assert.deepEqual([d.date, d.timezone], ['2026-10-21', 'America/Chicago'])
  assert.deepEqual(d.jobs, { count: 5, states: { open: 1, completed: 3, invoiced: 1 }, list: [
    { id: f.open.id, number: f.open.number, title: f.open.title, customer: b.customer.name, status: 'open', visits: [
      { id: f.first.id, start: '00:00', end: '00:30', technician: 'Priya N.', status: 'booked' },
      { id: f.second.id, start: '23:00', end: '23:30', technician: 'Tom B.', status: 'booked' },
    ] },
    ...[[f.finished, f.finishedVisit, '08:00', '08:30', 'completed'], [f.withDraft, f.draftVisit, '09:00', '09:30', 'completed'], [f.withApproval, f.approvedVisit, '10:00', '10:30', 'completed'], [f.withExport, f.exportedVisit, '12:00', '12:30', 'invoiced']].map(([job, visit, start, end, status]) => ({ id: job.id, number: job.number, title: job.title, customer: b.customer.name, status, visits: [{ id: visit.id, start, end, technician: 'Priya N.', status: 'completed' }] })),
  ] })
  // Chosen revision 2: (200 + 25) + 22.50 tax; late quote: 37.50 + 3.75.
  // The 900 first revision, 999 prior acceptance and 777 next acceptance do not count.
  assert.deepEqual({ ...d.booked, quotes: by(d.booked.quotes, 'number') }, { count: 2, total: '288.75', quotes: [f.chosen, f.late].map(q => ({ id: q.id, number: q.number, customer: b.customer.name })) })
  assert.deepEqual(d.openQuotes, { count: 3, total: '165.00' }, 'latest 44 draft, 55 approved and 66 sent; declined and accepted quotes excluded')
  assert.deepEqual({ ...d.unbilled, list: by(d.unbilled.list, 'number') }, { count: 4, list: [
    { id: f.finished.id, number: f.finished.number, customer: b.customer.name, invoiceId: null },
    { id: f.withDraft.id, number: f.withDraft.number, customer: b.customer.name, invoiceId: f.draftInvoice.id },
    { id: f.withApproval.id, number: f.withApproval.number, customer: b.customer.name, invoiceId: f.approvedInvoice.id },
    { id: f.priorUnbilled.id, number: f.priorUnbilled.number, customer: b.customer.name, invoiceId: null },
  ] })
  assert.deepEqual({ ...d.onClock, list: by(d.onClock.list, 'technician') }, { count: 3, list: [
    { technicianId: f.idle.id, technician: 'Idle Technician', since: '2026-10-21T15:00:00.000Z', timer: null },
    { technicianId: b.priya.id, technician: 'Priya N.', since: '2026-10-21T05:00:00.000Z', timer: { kind: 'job', job: f.open.number } },
    { technicianId: b.tom.id, technician: 'Tom B.', since: '2026-10-22T04:00:00.000Z', timer: { kind: 'travel', job: f.open.number } },
  ] })
  assert.deepEqual(await read(), d)
  assert.deepEqual(await read(), d)
  assert.deepEqual(await h.state(), before, 'repeated dashboard reads leave all projected domain records and Activity unchanged')
  for (const [as, status] of [['', 401], [b.priyaPerson.cookie, 403], [b.tomPerson.cookie, 403]]) {
    const response = await h.request('/api/glove/dashboard', { as })
    assert.equal(response.status, status)
    assert.equal((await response.json()).jobs, undefined, 'a refusal discloses no Today records')
  }
  assert.deepEqual(await h.state(), before, 'refused report reads change no domain records')
  await advanceDashboard(h, f)
  await h.restart()
  const changed = await h.state(), updated = await read()
  assert.deepEqual(updated.jobs, { count: 5, states: { open: 1, completed: 2, invoiced: 2 }, list: [
    { id: f.open.id, number: f.open.number, title: f.open.title, customer: b.customer.name, status: 'open', visits: [
      { id: f.first.id, start: '00:00', end: '00:30', technician: 'Priya N.', status: 'booked' },
    ] },
    ...[[f.finished, f.finishedVisit, '08:00', '08:30', 'completed'], [f.withDraft, f.draftVisit, '09:00', '09:30', 'completed'], [f.withApproval, f.approvedVisit, '10:00', '10:30', 'invoiced'], [f.withExport, f.exportedVisit, '12:00', '12:30', 'invoiced']].map(([job, visit, start, end, status]) => ({ id: job.id, number: job.number, title: job.title, customer: b.customer.name, status, visits: [{ id: visit.id, start, end, technician: 'Priya N.', status: 'completed' }] })),
  ] }, 'cancelling one visit retains the job and its other visit; invoice export changes its state')
  assert.deepEqual({ ...updated.booked, quotes: by(updated.booked.quotes, 'number') }, { count: 2, total: '288.75', quotes: [f.chosen, f.late].map(q => ({ id: q.id, number: q.number, customer: b.customer.name })) }, 'closing an open quote never changes accepted booked value')
  assert.deepEqual(updated.openQuotes, { count: 2, total: '99.00' })
  assert.deepEqual({ ...updated.unbilled, list: by(updated.unbilled.list, 'number') }, { count: 3, list: [
    { id: f.finished.id, number: f.finished.number, customer: b.customer.name, invoiceId: null },
    { id: f.withDraft.id, number: f.withDraft.number, customer: b.customer.name, invoiceId: f.draftInvoice.id },
    { id: f.priorUnbilled.id, number: f.priorUnbilled.number, customer: b.customer.name, invoiceId: null },
  ] }, 'unbilled work includes prior dates and drafts but excludes the newly exported job')
  assert.deepEqual({ ...updated.onClock, list: by(updated.onClock.list, 'technician') }, { count: 2, list: [
    { technicianId: f.idle.id, technician: 'Idle Technician', since: '2026-10-21T15:00:00.000Z', timer: null },
    { technicianId: b.priya.id, technician: 'Priya N.', since: '2026-10-21T05:00:00.000Z', timer: null },
  ] })
  assert.deepEqual(await read(), updated)
  assert.deepEqual(await h.state(), changed, 'reading changed figures still writes no domain records')
  // The date changes at business-local midnight, five hours after UTC midnight.
  await h.setClock('2026-10-22T04:59:59.999Z')
  await h.restart()
  assert.deepEqual(await read(), updated, 'the last millisecond of the local day keeps its exact figures')
  await h.setClock(dashboardNextDay)
  await h.restart()
  const nextDayState = await h.state(), nextDay = await read()
  assert.deepEqual([nextDay.date, nextDay.timezone], ['2026-10-22', 'America/Chicago'])
  assert.deepEqual(nextDay.jobs, { count: 1, states: { open: 1, completed: 0, invoiced: 0 }, list: [
    { id: f.tomorrow.id, number: f.tomorrow.number, title: 'synthetic-glove-15 next date', customer: 'Harbourview Dental', status: 'open', visits: [
      { id: f.tomorrowVisit.id, start: '00:00', end: '00:30', technician: 'Tom B.', status: 'booked' },
    ] },
  ] })
  assert.deepEqual(nextDay.booked, { count: 1, total: '854.70', quotes: [
    { id: f.next.id, number: f.next.number, customer: 'Harbourview Dental' },
  ] }, 'only the 777.00 acceptance at local midnight plus 77.70 tax belongs to the next day')
  assert.deepEqual(nextDay.openQuotes, { count: 2, total: '99.00' })
  assert.deepEqual(nextDay.unbilled, updated.unbilled, 'unfinished invoicing survives the day boundary')
  assert.deepEqual(nextDay.onClock, updated.onClock, 'open shifts survive midnight without inventing a clock-out')
  assert.deepEqual(await read(), nextDay)
  assert.deepEqual(await h.state(), nextDayState, 'rollover and repeated report reads do not alter records')
  const reader = await h.person('Report Reader', 'viewer')
  assert.equal((await h.request('/api/glove/dashboard', { as: reader.cookie })).status, 200)
  const role = await h.command('role.save', { name: 'Without reports', permissions: ['customer.save'] })
  await h.command('role.set', { operatorId: reader.id, role: `custom:${role.id}` })
  const withdrawn = await h.state()
  assert.equal((await h.request('/api/glove/dashboard', { as: reader.cookie })).status, 403, 'current report authority is required after withdrawal')
  assert.deepEqual(await h.state(), withdrawn)
})
