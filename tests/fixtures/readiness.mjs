// Native next-day work through the production command doors, fixed at noon UTC.
export async function readinessFixture(h) {
  await h.command('business.save', { name: 'Synthetic Glove Service', currency: 'USD', timezone: 'America/Chicago' })
  const agent = await h.person('Readiness Agent', 'agent')
  const dispatcher = await h.person('Readiness Dispatcher', 'dispatcher')
  const field = await h.person('Readiness Technician', 'technician')
  const tech = await h.command('technician.save', { name: 'Readiness Technician', operatorId: field.id })
  const material = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Replacement filter', kind: 'material', unitPrice: '20.00', unitCost: '8.00', tax: 'TAXABLE' })
  const van = await h.command('stock.location', { kind: 'van', name: 'Service van', technicianId: tech.id })
  await h.command('stock.count', { locationId: van.id, serviceId: material.id, quantity: '3' })
  const visits = [], jobs = [], customers = [], sites = []
  for (let i = 0; i < 5; i++) {
    const customer = await h.command('customer.save', { name: `Synthetic customer ${i + 1}` })
    const site = await h.command('site.save', { customerId: customer.id, address: `${10 + i} Synthetic Street`, accessNotes: 'A note is not confirmation' })
    const job = await dispatcher.run('job.create', { customerId: customer.id, siteId: site.id, title: `Next-day service ${i + 1}`, lines: [{ serviceId: material.id, description: 'Replacement filter', quantity: '1', unitPrice: '20.00' }] })
    const visit = await dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: '2030-01-02', start: `${String(8 + i).padStart(2, '0')}:00`, end: `${String(9 + i).padStart(2, '0')}:00` })
    customers.push(customer); sites.push(site); jobs.push(job); visits.push(visit)
  }
  const warehouse = await h.command('stock.location', { kind: 'warehouse', name: 'Parts warehouse' })
  let po = await h.command('po.save', { jobId: jobs[4].id, locationId: warehouse.id, supplier: 'Synthetic supplier', lines: [{ serviceId: material.id, quantity: '2', unitCost: '8.00' }] })
  po = await h.command('po.send', { poId: po.id, version: po.version, method: 'phone', reference: 'synthetic-glove-2' })
  po = await h.command('po.receive', { poId: po.id, version: po.version, lines: [{ lineId: po.lines[0].id, quantity: '1' }] })
  const board = async (as = agent.cookie, branchId) => {
    const r = await h.request(`/api/glove/readiness?date=2030-01-02${branchId ? `&branchId=${branchId}` : ''}`, { as })
    return { status: r.status, body: await r.json() }
  }
  const prepare = (b, opts = {}) => agent.run('readiness.prepare', { date: '2030-01-02', fingerprint: b.fingerprint }, opts)
  return { agent, dispatcher, field, tech, material, van, warehouse, po, visits, jobs, customers, sites, board, prepare }
}
