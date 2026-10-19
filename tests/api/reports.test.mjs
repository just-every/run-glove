// REPORT-002 job, revenue, technician, lead, quote, margin and tax reports
// through the report doors: a fixture month's totals against its records and
// the CSV export, and one filter per report narrowing its totals.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('REPORT-002 a month of work: each report against its records and CSV, and one filter each', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
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

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
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
  assert.deepEqual(Object.values(row('Priya N.')).slice(1), ['Priya N.', '389.00', 2, 1, '50.0', '5.5'])
  assert.deepEqual(Object.values(row('Tom B.')).slice(1), ['Tom B.', '200.00', 1, 0, '0.0', '0.0'])
  assert.ok((await csv('technicians')).includes('Priya N.,389.00,2,1,50.0,5.5'))
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
  assert.equal((await csv('margins', '&jobType=Maintenance')).at(-1), 'total,1,189.00,40.00,0.00,78.8,100.0')

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
})
