// Real business commands shared by the REPORT-003 API and browser journeys.
// In Chicago this instant is still July 24: approval must freeze that local date.
export const agingAt = '2026-07-25T02:30:00Z'
export async function agingDay(h) {
  await h.request('/__test/clock', { method: 'POST', body: { at: agingAt } })
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
  const person = await h.person('Tom Brooks', 'technician')
  const tech = await h.command('technician.save', { name: 'Tom Brooks', operatorId: person.id })
  const customers = [], sites = []
  for (const [name, address] of [
    ['Rosa Diaz', '410 W Erie St, Austin TX 78704'],
    ['Victor, "Vee" Chen', '512 W Erie St, Austin TX 78704'],
  ]) {
    const customer = await h.command('customer.save', { name })
    customers.push(customer)
    sites.push(await h.command('site.save', { customerId: customer.id, address }))
  }
  const date = '2026-07-24', asOf = '2026-11-01', invoices = []
  // Two customers with distinct balances: future, today, then both ends of each bucket.
  const cases = [
    [0, 101, '12.34'], [1, 100, '23.45'], [0, 99, '34.56'],
    [1, 70, '45.67'], [0, 69, '56.78'], [1, 40, '67.89'],
    [0, 39, '78.90'], [1, 10, '89.01'], [0, 9, '91.23'],
  ]
  for (const [index, [customerIndex, terms, price]] of cases.entries()) {
    const job = await h.command('job.create', { customerId: customers[customerIndex].id, siteId: sites[customerIndex].id, title: 'Repair ' + (index + 1), lines: [{ description: 'Repair labor', quantity: '1', unitPrice: price, tax: 'FREE' }] })
    const hour = String(7 + index).padStart(2, '0')
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: hour + ':00', end: hour + ':30' })
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } })
    const invoice = await h.command('invoice.prepare', { jobId: job.id })
    await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: terms })
    invoices.push(await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }))
  }
  return { invoices, asOf, customers, sites, customer: customers[0], site: sites[0], tech, person, date }
}
