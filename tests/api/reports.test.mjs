// REPORT-002 job, revenue, technician, lead, quote, margin and tax reports
// through the report doors: a fixture month's totals against its records and
// the CSV export, and one filter per report narrowing its totals.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, revenueCorrection, assertTrail } from './harness.mjs'

test('REPORT-002, REPORT-004 a month of work: each report against its records and CSV, and one filter each', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  await h.command('technician.save', { ...b.priya, costRate: '60.00' })
  await h.command('technician.save', { ...b.tom, costRate: '120.00' })
  const tune = await h.command('service.save', { code: 'TUNE', name: 'AC tune-up', category: 'Maintenance', unitCost: '40.00', unitPrice: '189.00', tax: 'GST' })
  const repair = await h.command('service.save', { code: 'COMP', name: 'Compressor repair', category: 'Repair', unitCost: '150.00', unitPrice: '400.00', tax: 'GST' })

  // Three requests (two from Google, one by phone); two quotes won, one lost.
  const quoteFor = async (source, title, service, price) => {
    const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source, description: title })
    const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, enquiryId: request.id, title, lines: [{ description: title, quantity: '1', unitPrice: price, serviceId: service.id }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    return { request, quote: approved }
  }
  const answer = (q, accept) => b.dispatcher.run(accept ? 'quote.accept' : 'quote.decline', { quoteId: q.id, version: q.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  const work = async (q, techs, date) => {
    const job = await b.dispatcher.run('job.create', { quoteId: q.id })
    for (const [i, tech] of techs.entries()) {
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.tech.id, date, start: `${String(8 + 2 * i).padStart(2, '0')}:00`, end: `${String(9 + 2 * i).padStart(2, '0')}:00` })
      await tech.person.run('clock.in', { deviceTime: visit.startAt })
      await tech.person.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: visit.startAt })
      await tech.person.run('timer.stop', { visitId: visit.id, deviceTime: visit.endAt })
      await tech.person.run('clock.out', { deviceTime: visit.endAt })
      await tech.person.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-20T22:00:00Z' })
      for (const item of job.checklist.filter(c => c.required)) await tech.person.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T22:05:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
      await tech.person.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-20T23:00:00Z', summary: 'Done', signoff: { absentReason: 'Tenant let us in' }, jobComplete: i === techs.length - 1 })
    }
    const inv = await b.office.run('invoice.prepare', { jobId: job.id })
    await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
    return job
  }
  const priya = { tech: b.priya, person: b.priyaPerson }, tom = { tech: b.tom, person: b.tomPerson }
  const first = await quoteFor('google', 'AC tune-up', tune, '189.00')
  const second = await quoteFor('google', 'Compressor repair', repair, '400.00')
  const third = await quoteFor('phone', 'Second opinion', repair, '400.00')
  await answer(first.quote, true)
  const tuneJob = await work(first.quote, [priya], '2026-10-21')
  // The repair job comes after Priya's tune-up at the same site: her completed visit has a callback.
  await answer(second.quote, true)
  await work(second.quote, [priya, tom], '2026-10-22')
  await answer(third.quote, false)
  await b.priyaPerson.run('clock.in', { deviceTime: '2026-10-05T21:00:00Z' })
  await b.priyaPerson.run('clock.out', { deviceTime: '2026-10-06T02:30:00Z' })

  const today = [new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date()), '2026-10-22'].sort().at(-1)
  const get = async (kind, query = '', as = b.office.cookie) => (await h.request(`/api/glove/reports/${kind}.json?from=2026-10-01&to=${today}${query}`, { as })).json()
  const csv = async (kind, query = '') => (await (await h.request(`/api/glove/reports/${kind}.csv?from=2026-10-01&to=${today}${query}`, { as: b.office.cookie })).text()).trim().split(/\r?\n/)
  const s = await h.state()
  const approved = s.invoices.map(i => i.revisions.at(-1))
  const sum = k => approved.reduce((n, r) => n + Math.round(Number(r.totals[k]) * 100), 0)

  // Revenue: the approved invoices' subtotals by month and job type; a job-type filter narrows it.
  let r = await get('revenue')
  assert.deepEqual([r.total.invoices, Math.round(Number(r.total.revenue) * 100)], [2, sum('subtotal')])
  assert.deepEqual(r.byJobType.map(x => [x.type, x.revenue]), [['Maintenance', '189.00'], ['Repair', '400.00']])
  assert.equal((await csv('revenue')).at(-1), 'total,,2,589.00')
  r = await get('revenue', '&jobType=Repair')
  assert.deepEqual([r.total.invoices, r.total.revenue], [1, '400.00'])
  assert.deepEqual((await get('revenue').then(() => h.request('/api/glove/reports/revenue.json?from=2026-01-01&to=2026-01-31', { as: b.office.cookie })).then(x => x.json())).total, { invoices: 0, revenue: '0.00' })

  // Technicians: revenue split between those who completed visits, visits, callbacks and clocked hours; filter by technician.
  r = await get('technicians')
  const row = name => r.technicians.find(x => x.technician === name)
  assert.deepEqual(Object.values(row('Priya N.')).slice(1), ['Priya N.', '389.00', 2, 1, '50.0', '7.5', 0, 0, null])
  assert.deepEqual(Object.values(row('Tom B.')).slice(1), ['Tom B.', '200.00', 1, 0, '0.0', '1.0', 0, 0, null])
  assert.ok((await csv('technicians')).includes('Priya N.,389.00,2,1,50.0,7.5,0,0,'))
  r = await get('technicians', `&technicianId=${b.tom.id}`)
  assert.deepEqual(r.technicians.map(x => x.technician), ['Tom B.'])

  // Lead sources: requests made in the period by source and what converted; filter by source.
  r = await get('sources')
  assert.deepEqual(r.sources.map(x => [x.source, x.requests, x.won, x.conversion]), [['google', 2, 2, '100.0'], ['phone', 1, 0, '0.0']])
  assert.equal((await csv('sources')).at(-1), 'total,3,2,66.7,647.90,647.90')
  r = await get('sources', '&source=phone')
  assert.deepEqual([r.total.requests, r.total.won], [1, 0])

  // Quote win rate: accepted ÷ answered; filtered by the request's source.
  r = await get('quotes')
  assert.deepEqual([r.answered, r.won, r.lost, r.winRate, r.wonValue], [3, 2, 1, '66.7', '647.90'])
  assert.deepEqual((await get('quotes', '&source=google')).winRate, '100.0')
  assert.deepEqual(await csv('quotes'), ['answered,won,lost,win rate,won value', '3,2,1,66.7,647.90'])

  // Margins: COST-004's figures for the completed jobs; filter by job type.
  r = await get('margins')
  assert.deepEqual(r.byJobType.map(x => [x.type, x.jobs, x.revenue, x.estimatedCost]), [['Maintenance', 1, '189.00', '40.00'], ['Repair', 1, '400.00', '150.00']])
  r = await get('margins', '&jobType=Maintenance')
  assert.deepEqual([r.total.jobs, r.total.estimatedMargin], [1, '78.8'])
  assert.equal((await csv('margins', '&jobType=Maintenance')).at(-1), 'total,1,189.00,40.00,60.00,78.8,68.3')

  assert.deepEqual(r.byTechnician.map(x => [x.technicianId, x.minutes, x.laborCost, x.jobs, x.revenue, x.estimatedCost, x.actualCost]), [[b.priya.id, 60, '60.00', 1, '189.00', '40.00', '60.00']], 'job-type filtering excludes every other job from the technician roll-up')
  r = await get('margins', '&jobType=Repair')
  assert.deepEqual(r.byTechnician.map(x => [x.technicianId, x.minutes, x.laborCost, x.jobs, x.revenue, x.estimatedCost, x.actualCost]), [[b.priya.id, 60, '60.00', 1, '400.00', '150.00', '180.00'], [b.tom.id, 60, '120.00', 1, '400.00', '150.00', '180.00']])
  r = await get('margins', '&jobType=No%20such%20category')
  assert.deepEqual([r.total.jobs, r.total.revenue, r.byJobType, r.byTechnician], [0, '0.00', [], []], 'an empty match leaves no unfiltered technician rows')

  // Tax on approved invoices, by the business's jurisdiction, to the cent of the invoices' own tax.
  r = await get('tax')
  assert.equal(Math.round(Number(r.jurisdictions[0].tax) * 100), sum('gst'))
  assert.deepEqual([r.jurisdictions[0].tax, r.jurisdictions[0].taxable], ['58.90', '589.00'])
  assert.match(r.basis, /no payments/)
  assert.equal((await csv('tax')).at(-1).split(',').slice(-2).join(','), '2,58.90')

  // Reports are the desk's: a technician is refused; an unknown period is refused.
  assert.equal((await h.request(`/api/glove/reports/revenue.json?from=2026-10-01&to=${today}`, { as: b.priyaPerson.cookie })).status, 403)
  assert.equal((await h.request('/api/glove/reports/revenue.json?from=2026-10-31&to=2026-10-01', { as: b.office.cookie })).status, 400)
  assert.ok(tuneJob)
  await correctionRevenue(t)
})

test('REPORT-003 native USD aging: two customers, every boundary, complete JSON and CSV, restart and read refusals', async t => {
  const h = await installation({ at: '2026-11-01T18:00:00Z' }); t.after(() => h.close())
  const { agingDay } = await import('../fixtures/receivables.mjs')
  const { invoices, asOf, customers, person } = await agingDay(h)
  assert.equal(asOf, '2026-11-01')
  const door = '/api/glove/reports/receivables'
  const names = ['Rosa Diaz', 'Victor, "Vee" Chen']
  // Independent calendar and money oracle, in customer then due-date order.
  // No expected date, bucket, balance or rollup comes from an invoice projection.
  const cases = [
    [8, 0, 'INV-0009', '2026-07-28', '2026-08-02', 5, 91, 'over90', '91.23'],
    [6, 0, 'INV-0007', '2026-07-27', '2026-09-01', 36, 61, '61-90', '78.90'],
    [4, 0, 'INV-0005', '2026-07-26', '2026-10-01', 67, 31, '31-60', '56.78'],
    [2, 0, 'INV-0003', '2026-07-25', '2026-10-31', 98, 1, '1-30', '34.56'],
    [0, 0, 'INV-0001', '2026-07-24', '2026-11-02', 101, 0, 'current', '12.34'],
    [7, 1, 'INV-0008', '2026-07-27', '2026-08-03', 7, 90, '61-90', '89.01'],
    [5, 1, 'INV-0006', '2026-07-26', '2026-09-02', 38, 60, '31-60', '67.89'],
    [3, 1, 'INV-0004', '2026-07-25', '2026-10-02', 69, 30, '1-30', '45.67'],
    [1, 1, 'INV-0002', '2026-07-24', '2026-11-01', 100, 0, 'current', '23.45'],
  ]
  const rows = cases.map(([i, customer, number, issuedOn, dueOn, termsDays, daysPastDue, bucket, balance]) => ({
    id: invoices[i].id, number, customerId: customers[customer].id, customer: names[customer],
    currency: 'USD', revision: 1, issuedOn, dueOn, termsDays,
    basis: 'terms frozen at first approval', daysPastDue, bucket, balance,
    reminderState: 'No reminders scheduled', href: '#invoices/' + invoices[i].id,
  }))
  const expected = {
    asOf: '2026-11-01',
    customers: [
      { customerId: customers[0].id, customer: names[0], currency: 'USD',
        buckets: { current: '12.34', '1-30': '34.56', '31-60': '56.78', '61-90': '78.90', over90: '91.23' },
        total: '273.81', invoices: rows.slice(0, 5) },
      { customerId: customers[1].id, customer: names[1], currency: 'USD',
        buckets: { current: '23.45', '1-30': '45.67', '31-60': '67.89', '61-90': '89.01', over90: '0.00' },
        total: '226.02', invoices: rows.slice(5) },
    ],
    totals: [{ currency: 'USD',
      buckets: { current: '35.79', '1-30': '80.23', '31-60': '124.67', '61-90': '167.91', over90: '91.23' },
      total: '499.83' }],
  }
  const header = ['Customer', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Date basis', 'Days past due', 'Bucket', 'Balance', 'Reminder state', 'Invoice link']
  // Parse downloaded cells independently, including the second customer's comma and quotes.
  const csvRows = text => text.trimEnd().split('\r\n').map(line =>
    [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^",]*))(?=,|$)/g)]
      .map(match => match[1] === undefined ? match[2] : match[1].replaceAll('""', '"')))
  const expectedCsv = () => [header, ...rows.map(r => [
    r.customer, 'USD', r.number, String(r.revision), r.issuedOn, r.dueOn,
    r.basis, String(r.daysPastDue), r.bucket, r.balance, r.reminderState, r.href,
  ])]
  const snapshot = async () => (await h.db.prepare('SELECT kind,id,data FROM glove_records ORDER BY kind,id').all()).results
  const read = async (suffix = '', as) => {
    const json = await h.request(door + '.json?asOf=' + asOf + suffix, { as })
    assert.equal(json.status, 200)
    const report = await json.json()
    assert.match(report.basis, /No payments recorded yet/)
    const { basis: _basis, ...actual } = report
    assert.deepEqual(actual, expected)
    const csv = await h.request(door + '.csv?asOf=' + asOf + suffix, { as })
    assert.equal(csv.status, 200)
    assert.match(csv.headers.get('content-type'), /^text\/csv/)
    assert.match(csv.headers.get('content-disposition'), /attachment/)
    const text = await csv.text()
    assert.deepEqual(csvRows(text), expectedCsv(), 'every downloaded cell matches the independent invoice expectations')
    return { report, text }
  }
  const approvedAt = [
    '2026-07-25T02:30:00.000Z', '2026-07-25T04:59:00.000Z', '2026-07-25T05:00:00.000Z',
    '2026-07-26T04:59:00.000Z', '2026-07-26T05:00:00.000Z', '2026-07-27T04:59:00.000Z',
    '2026-07-27T05:00:00.000Z', '2026-07-28T04:59:00.000Z', '2026-07-28T05:00:00.000Z',
  ]
  for (const [i, , , issuedOn, dueOn, termsDays] of cases) {
    assert.deepEqual(invoices[i].dates, { issuedOn, dueOn, termsDays, basis: 'terms frozen at first approval' })
    assert.equal(invoices[i].revisions[0].approval.at, approvedAt[i])
  }
  const beforeReads = await snapshot()
  const original = await read()
  await read('&branchId=main')
  assert.deepEqual(await snapshot(), beforeReads, 'successful JSON and CSV reads change no domain record')
  await h.restart()
  assert.deepEqual(await read(), original, 'identical JSON and downloaded CSV survive an actual Worker restart with retained D1')
  assert.deepEqual(await snapshot(), beforeReads)

  // Preserve the existing terms, export and correction journey.
  await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 })
  const exported = await h.command('invoice.export', {})
  const exportCsv = await h.request('/api/glove/exports/' + exported.id + '.csv').then(x => x.text())
  assert.ok(exportCsv.includes('11/02/2026'))
  const mapped = await h.request('/api/glove/invoices/' + invoices[0].id + '/quickbooks.json?customerRef=123&itemRef=456&taxCodeRef=789').then(r => r.json())
  assert.equal(mapped.TxnDate, '2026-07-24')
  assert.equal(mapped.DueDate, '2026-11-02')
  await read()
  const correction = await h.command('invoice.correct', {
    invoiceId: invoices[0].id, version: (await h.state()).invoices.find(i => i.id === invoices[0].id).version,
    reason: 'Extra labor confirmed', lines: [{ description: 'Repair labor', quantity: '1', unitPrice: '20.01', tax: 'FREE' }],
  })
  assert.deepEqual(await read(), original, 'an unapproved correction changes neither JSON nor CSV')
  await h.command('invoice.approve', { invoiceId: correction.id, version: correction.version, revision: 2 })
  rows[4].revision = 2; rows[4].balance = '20.01'
  expected.customers[0].buckets.current = '20.01'; expected.customers[0].total = '281.48'
  expected.totals[0].buckets.current = '43.46'; expected.totals[0].total = '507.50'
  const corrected = await read()
  await h.restart()
  assert.deepEqual(await read(), corrected, 'approved revision, frozen dates, all customer rollups and every CSV cell survive restart')

  const branch = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: [] })
  const dispatcher = await h.person('Dee Dispatcher', 'dispatcher')
  const office = await h.person('Ari Office', 'office')
  const subcontractor = await h.person('Sid Subcontractor', 'subcontractor')
  const role = await h.command('role.save', { name: 'Aging reviewer', permissions: ['reports.read'] })
  const reviewer = await h.person('Rae Reviewer', 'custom:' + role.id)
  await read('', dispatcher.cookie)
  await read('', office.cookie)
  await read('', reviewer.cookie)
  // Current permission is checked again on the next request.
  await h.command('role.save', { ...role, permissions: [] })
  await h.command('branch.limit', { operatorId: dispatcher.id, branchId: branch.id })

  const beforeRefusals = await snapshot()
  const refuse = async (extension, query, as, status, code) => {
    const response = await h.request(door + '.' + extension + '?' + query, { as })
    assert.equal(response.status, status)
    const body = await response.json()
    assert.equal(body.error.code, code)
    assert.equal(JSON.stringify(body).includes(invoices[0].id), false, 'a refusal discloses no invoice identity')
    assert.deepEqual(await snapshot(), beforeRefusals, 'a refused report read changes no domain record')
  }
  for (const extension of ['json', 'csv']) {
    for (const date of ['2026-02-30', '2026-13-01', '2026-2-01', 'not-a-date']) {
      await refuse(extension, 'asOf=' + date, undefined, 400, 'INPUT')
    }
    for (const cookie of [person.cookie, subcontractor.cookie, reviewer.cookie]) {
      await refuse(extension, 'asOf=' + asOf, cookie, 403, 'FORBIDDEN')
    }
    await refuse(extension, 'asOf=' + asOf, '', 401, 'AUTH')
    await refuse(extension, 'asOf=' + asOf + '&branchId=main', dispatcher.cookie, 404, 'NOT_FOUND')
    await refuse(extension, 'asOf=' + asOf + '&branchId=synthetic-glove-unknown', undefined, 404, 'NOT_FOUND')
  }
  const empty = { asOf, customers: [], totals: [] }
  for (const [suffix, as] of [['&branchId=' + branch.id, undefined], ['', dispatcher.cookie]]) {
    const response = await h.request(door + '.json?asOf=' + asOf + suffix, { as })
    assert.equal(response.status, 200)
    const { basis: _basis, ...report } = await response.json()
    assert.deepEqual(report, empty, 'an authorized empty branch exposes no main-branch customer or invoice')
    const csv = await h.request(door + '.csv?asOf=' + asOf + suffix, { as })
    assert.equal(csv.status, 200)
    assert.deepEqual(csvRows(await csv.text()), [header])
  }
  assert.deepEqual(await snapshot(), beforeRefusals)
  await h.restart()
  await read()
  await refuse('json', 'asOf=' + asOf, reviewer.cookie, 403, 'FORBIDDEN')
  await refuse('csv', 'asOf=' + asOf + '&branchId=main', dispatcher.cookie, 404, 'NOT_FOUND')
})


async function correctionRevenue(t) {
  const h = await installation({ at: '2026-10-30T16:00:00.000Z' })
  t.after(() => h.close())
  const { b, invoice, invoices, exported, correctionLines } = await revenueCorrection(h)
  const door = (month = '10', filter = '') => `/api/glove/reports/revenue.json?from=2026-${month}-01&to=2026-${month}-${month === '10' ? '31' : '30'}${filter ? `&jobType=${encodeURIComponent(filter)}` : ''}`
  const figures = async (month, filter) => {
    const response = await h.request(door(month, filter), { as: b.office.cookie })
    assert.equal(response.status, 200)
    const r = await response.json()
    return { total: r.total, byMonth: r.byMonth, byJobType: r.byJobType, byBranch: r.byBranch }
  }
  const expected = amount => ({
    total: { invoices: 3, revenue: amount === '152.40' ? '228.37' : '221.08' },
    byMonth: [{ month: '2026-10', invoices: 3, revenue: amount === '152.40' ? '228.37' : '221.08' }],
    byJobType: [{ type: 'Maintenance', invoices: 1, revenue: amount }, { type: 'Uncategorized', invoices: 2, revenue: '75.97' }],
    byBranch: [{ branchId: 'main', branch: 'Main business', invoices: 3, revenue: amount === '152.40' ? '228.37' : '221.08' }],
  })
  const empty = { total: { invoices: 0, revenue: '0.00' }, byMonth: [], byJobType: [], byBranch: [] }
  const exportBytes = await h.request(`/api/glove/exports/${exported.id}.csv`).then(r => r.text())
  assert.deepEqual(await figures('10'), expected('152.40'))
  assert.deepEqual(await figures('11'), empty)
  const lastOctoberDay = '/api/glove/reports/revenue.json?from=2026-10-31&to=2026-10-31'
  assert.deepEqual((await h.request(lastOctoberDay).then(r => r.json())).total, { invoices: 3, revenue: '228.37' }, 'the UTC-November approval belongs to the last local October date, including both period ends')
  assert.deepEqual((await h.request(lastOctoberDay.replaceAll('10-31', '10-30')).then(r => r.json())).total, { invoices: 0, revenue: '0.00' })
  await h.setTime('2026-11-01T04:05:00.000Z')
  const correctionId = 'synthetic-glove-revenue-correction'
  const correction = await b.office.run('invoice.correct', { invoiceId: invoice.id, version: invoice.version, reason: 'Actual work revised by the office', lines: correctionLines }, { commandId: correctionId })
  await h.restart()
  assert.deepEqual(await figures('10'), expected('152.40'), 'a prepared correction is not revenue')
  assert.deepEqual(await figures('11'), empty)
  assert.deepEqual(await h.request(door('10').replace('.json?', '.csv?'), { as: b.office.cookie }).then(r => r.text()).then(s => s.trim().split(/\r?\n/)), ['group,key,invoices,revenue', 'month,2026-10,3,228.37', 'job type,Maintenance,1,152.40', 'job type,Uncategorized,2,75.97', 'branch,Main business,3,228.37', 'total,,3,228.37'], 'CSV also excludes the prepared correction after restart')
  const approval = { invoiceId: correction.id, version: correction.version, revision: 2 }
  const beforeRefusal = (await h.state()).invoices
  await b.priyaPerson.run('invoice.approve', approval, { error: 'FORBIDDEN' })
  await b.agent.run('invoice.approve', approval, { error: 'FORBIDDEN' })
  await b.office.run('invoice.approve', { ...approval, revision: 1 }, { error: 'REVISION' })
  assert.deepEqual((await h.state()).invoices, beforeRefusal)
  const approvalId = 'synthetic-glove-revenue-approval'
  const approved = await b.office.run('invoice.approve', approval, { commandId: approvalId })
  assert.deepEqual(await b.office.run('invoice.approve', approval, { commandId: approvalId }), approved)
  await h.restart()
  assert.deepEqual(await figures('10'), expected('145.11'))
  assert.deepEqual((await h.request(lastOctoberDay).then(r => r.json())).total, { invoices: 3, revenue: '221.08' }, 'a correction retains the exact first local approval date')
  assert.deepEqual(await figures('11'), empty, 'approval of the correction does not move revenue to November')
  const csv = async (month, filter) => h.request(door(month, filter).replace('.json?', '.csv?'), { as: b.office.cookie }).then(r => r.text()).then(s => s.trim().split(/\r?\n/))
  assert.deepEqual(await csv('10'), ['group,key,invoices,revenue', 'month,2026-10,3,221.08', 'job type,Maintenance,1,145.11', 'job type,Uncategorized,2,75.97', 'branch,Main business,3,221.08', 'total,,3,221.08'])
  for (const [filter, count, amount] of [['Maintenance', 1, '145.11'], ['Uncategorized', 2, '75.97']]) {
    assert.deepEqual(await figures('10', filter), { total: { invoices: count, revenue: amount }, byMonth: [{ month: '2026-10', invoices: count, revenue: amount }], byJobType: [{ type: filter, invoices: count, revenue: amount }], byBranch: [{ branchId: 'main', branch: 'Main business', invoices: count, revenue: amount }] })
    assert.deepEqual(await csv('10', filter), ['group,key,invoices,revenue', `month,2026-10,${count},${amount}`, `job type,${filter},${count},${amount}`, `branch,Main business,${count},${amount}`, `total,,${count},${amount}`])
  }
  assert.deepEqual(await figures('10', 'Repair'), empty, 'the correction line category and later job lines do not replace the first price-book category')
  assert.deepEqual(await csv('11'), ['group,key,invoices,revenue', 'total,,0,0.00'])
  assert.deepEqual(await csv('10', 'Repair'), ['group,key,invoices,revenue', 'total,,0,0.00'])
  const kept = (await h.state()).invoices.find(i => i.id === invoice.id)
  assert.equal((await h.state()).invoices.length, invoices.length)
  assert.deepEqual(kept.revisions[0], invoice.revisions[0], 'original approval and exported revision remain immutable')
  assert.deepEqual(kept.dates, invoice.dates)
  assert.equal(kept.revisions[1].totals.subtotal, '145.11')
  assert.equal(kept.revisions[1].totals.total, '157.08')
  assert.deepEqual(kept.revisions[1].approval, { id: b.office.id, name: b.office.name, role: 'office', at: '2026-11-01T04:05:00.000Z' })
  assert.equal(await h.request(`/api/glove/exports/${exported.id}.csv`).then(r => r.text()), exportBytes)
  const { activity, exported: download } = await assertTrail(h, ['invoice.corrected', 'invoice.approved'])
  for (const [commandId, kind, at] of [[correctionId, 'invoice.corrected', '2026-11-01T04:05:00.000Z'], [approvalId, 'invoice.approved', '2026-11-01T04:05:00.000Z']]) {
    const events = activity.filter(e => e.commandId === commandId && e.kind === kind)
    assert.equal(events.length, 1)
    assert.deepEqual([events[0].actorId, events[0].actorRole, events[0].subjectId, events[0].jobId, events[0].at], [b.office.id, 'office', invoice.id, invoice.jobId, at])
    const e = download.timeline.find(e => e.id === events[0].id)
    assert.deepEqual([e.actor_id, e.actor_role, e.subject_id, e.job_id, e.command_id, e.at], [b.office.id, 'office', invoice.id, invoice.jobId, commandId, at])
  }
  const beforeReads = (await h.state()).invoices
  for (const extension of ['json', 'csv']) {
    assert.equal((await h.request(door('10').replace('.json?', `.${extension}?`), { as: '' })).status, 401)
    assert.equal((await h.request(door('10').replace('.json?', `.${extension}?`), { as: b.priyaPerson.cookie })).status, 403)
  }
  assert.deepEqual((await h.state()).invoices, beforeReads)
}
