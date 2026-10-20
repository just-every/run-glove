// Real business commands shared by the REPORT-003 API and browser journeys.
export async function agingDay(h) {
  await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', paymentTermsDays: 14 })
  const person = await h.person('Tom Brooks', 'technician')
  const tech = await h.command('technician.save', { name: 'Tom Brooks', operatorId: person.id })
  const customer = await h.command('customer.save', { name: 'Rosa Diaz', email: 'rosa@example.test' })
  const site = await h.command('site.save', { customerId: customer.id, address: '410 W Erie St, Austin TX 78704' })
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
  const invoices = []
  for (const [index, terms] of [120, 100, 99, 70, 69, 40, 39, 10, 9].entries()) {
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: `Repair ${index + 1}`, lines: [{ description: 'Repair labor', quantity: '1', unitPrice: '12.34', tax: 'FREE' }] })
    const start = `${String(7 + index).padStart(2, '0')}:00`, end = `${String(7 + index).padStart(2, '0')}:30`
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start, end })
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } })
    const invoice = await h.command('invoice.prepare', { jobId: job.id })
    await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: terms })
    invoices.push(await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }))
  }
  const asOf = new Date(Date.parse(`${invoices[0].dates.issuedOn}T00:00:00Z`) + 100 * 86_400_000).toISOString().slice(0, 10)
  return { invoices, asOf, customer, site, tech, person, date }
}
