import assert from 'node:assert/strict'
import { installation, business } from '../api/harness.mjs'

// All fixtures enter through production HTTP commands. Expected roots and
// amounts below are enumerated here, independently of the reporting code.
export async function projectionFixture(t, at = '2026-11-01T12:00:00.000Z') {
  t.diagnostic?.('TEAM-004 fixture: starting Worker')
  const h = await installation({ at }); t.after(() => h.close())
  t.diagnostic?.('TEAM-004 fixture: Worker ready')
  const b = await business(h)
  t.diagnostic?.('TEAM-004 fixture: main business ready')
  const roots = [{ id: 'main', name: 'Main business', zone: 'Australia/Sydney', zip: '2041', customer: b.customer, site: b.site, person: b.priyaPerson, tech: b.priya, second: b.tom }]
  for (const [name, prefix, zone, zip, address] of [
    ['Raleigh', 'RAL', 'America/New_York', '27601', '101 Fayetteville St, Raleigh NC 27601'],
    ['Phoenix', 'PHX', 'America/Phoenix', '85001', '1 Central Ave, Phoenix AZ 85001'],
  ]) {
    const branch = await h.command('branch.save', { name, prefix, timezone: zone, zips: [zip] })
    const customer = await h.command('customer.save', { name: `${name} Customer` })
    const site = await h.command('site.save', { customerId: customer.id, address, branchId: branch.id })
    const person = await h.person(`${name} Field`, 'technician')
    const tech = await h.command('technician.save', { name: `${name} Field`, operatorId: person.id, branchId: branch.id })
    const second = await h.command('technician.save', { name: `${name} Helper`, branchId: branch.id })
    roots.push({ id: branch.id, name, zone, zip, branch, customer, site, person, tech, second })
  }
  const job = (r, title, lines = [{ description: 'Inspection', quantity: '1', unitPrice: '100.00', tax: 'FREE' }], site = r.site) => h.command('job.create', { customerId: r.customer.id, siteId: site.id, title, lines })
  const refuse = async (type, payload, error = 'BRANCH') => {
    const before = await h.state()
    const result = await h.command(type, payload, { error })
    assert.deepEqual(await h.state(), before, `${type} ${error} leaves every record and Activity unchanged`)
    return result
  }
  return { h, b, roots, job, refuse }
}

export async function bookingProjection(t) {
  const { h, b, roots, job, refuse } = await projectionFixture(t)
  const service = await h.command('service.save', { code: 'BRANCH-CALL', name: 'Branch inspection', unitPrice: '20.00', tax: 'FREE', checklist: [] })
  const plan = await h.command('plan.save', { name: 'Branch care', price: '100.00', termMonths: 12, includedVisits: 2, visitServiceId: b.service.id, formIds: [] })
  for (const [i, r] of roots.entries()) {
    t.diagnostic?.(`TEAM-004 booking root: ${r.name}`)
    const other = roots[(i + 1) % roots.length]
    const work = await job(r, `${r.name} booking`)
    const slot = { date: '2026-11-06', start: '09:00', end: '10:00' }
    await refuse('visit.book', { jobId: work.id, technicianId: other.tech.id, ...slot })
    const crew = await h.command('crew.save', { name: `${other.name} cross-door crew`, memberIds: [other.tech.id, other.second.id] })
    await refuse('visit.book', { jobId: work.id, crewId: crew.id, ...slot })
    const booked = await h.command('visit.book', { jobId: work.id, technicianId: r.tech.id, ...slot })
    assert.equal(booked.local.timezone, r.zone)
    await refuse('visit.change', { visitId: booked.id, version: booked.version, technicianId: other.tech.id, reason: 'Different branch', ...slot })
    const moved = await h.command('visit.change', { visitId: booked.id, version: booked.version, technicianId: r.second.id, reason: 'Same branch helper', ...slot })
    assert.equal(moved.technicianId, r.second.id)
    const enquiry = await h.command('enquiry.create', { customerId: r.customer.id, siteId: r.site.id, description: 'Branch assessment', source: 'phone' })
    await refuse('assessment.book', { enquiryId: enquiry.id, technicianId: other.tech.id, ...slot })
    const assessment = await h.command('assessment.book', { enquiryId: enquiry.id, technicianId: r.tech.id, ...slot })
    assert.equal(assessment.visit.technicianId, r.tech.id)
    const repeat = await job(r, `${r.name} series`)
    const repeating = { jobId: repeat.id, version: repeat.version, date: '2026-11-07', until: '2026-11-14', start: '11:00', end: '12:00', rule: { unit: 'week', interval: 1 } }
    await refuse('series.create', { ...repeating, technicianId: other.tech.id })
    const series = await h.command('series.create', { ...repeating, technicianId: r.tech.id })
    assert.deepEqual((await h.state()).visits.filter(v => v.jobId === repeat.id).map(v => [v.technicianId, v.local.date]).sort(), [[r.tech.id, '2026-11-07'], [r.tech.id, '2026-11-14']])
    await refuse('series.change', { jobId: repeat.id, version: series.version, from: '2026-11-14', technicianId: other.tech.id, reason: 'Different branch' })
    const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: r.customer.id, siteId: r.site.id, via: 'phone', startDate: '2026-11-01' })
    const offer = { agreementId: agreement.id, index: 0, slots: [{ ...slot, date: '2026-11-08', technicianId: other.tech.id }] }
    await refuse('agreement.offer', offer)
    const offered = await h.command('agreement.offer', { ...offer, slots: [{ ...offer.slots[0], technicianId: r.tech.id }] })
    assert.deepEqual(offered.slots.map(s => [s.technicianId, s.local.timezone]), [[r.tech.id, r.zone]])
    await refuse('proposal.prepare', { kind: 'dispatch', plan: { jobId: work.id, technicianId: other.tech.id, ...slot }, rationale: 'Wrong branch' })
    await refuse('route.optimize', { date: slot.date, branchId: r.id, technicianId: other.tech.id })
    const automatic = await job(r, `${r.name} automatic`)
    const assigned = await h.command('visit.book', { jobId: automatic.id, technicianId: 'auto', ...slot, date: '2026-11-09' })
    assert.ok([r.tech.id, r.second.id].includes(assigned.technicianId), 'automatic assignment never chooses an idle technician of another root')
    // Removing all local availability must refuse, rather than falling back
    // to another branch with spare technicians.
    for (const tech of [r.tech, r.second]) {
      const current = (await h.state()).technicians.find(x => x.id === tech.id)
      await h.command('technician.save', { ...current, timeOff: [{ from: '2026-11-10', to: '2026-11-10', reason: 'Unavailable' }] })
    }
    await refuse('visit.book', { jobId: automatic.id, technicianId: 'auto', ...slot, date: '2026-11-10' }, 'NO_TECHNICIAN')
    const ownCrew = await h.command('crew.save', { name: `${r.name} local crew`, memberIds: [r.tech.id, r.second.id] })
    const group = await h.command('visit.book', { jobId: automatic.id, crewId: ownCrew.id, ...slot, date: '2026-11-11' })
    assert.deepEqual(group.visits.map(v => v.technicianId).sort(), [r.tech.id, r.second.id].sort())
    const serviceJob = await job(r, `${r.name} public service booking`, [{ serviceId: service.id, quantity: '1' }])
    const serviceLink = await h.command('booking.offer', { jobId: serviceJob.id, slots: [{ date: '2026-11-12', start: '15:00', end: '16:00', window: { start: '15:00', end: '16:00' } }] })
    const beforeRead = await h.state()
    const publicView = await h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${serviceLink.token}` } })
    assert.equal(publicView.status, 200)
    assert.deepEqual((await publicView.json()).offer.slots.map(s => [s.date, s.start, s.timezone]), [['2026-11-12', '15:00', r.zone]])
    assert.deepEqual(await h.state(), beforeRead, 'public availability reserves nothing')
    const chosen = await h.request('/api/glove/public/booking', { as: '', headers: { authorization: `Bearer ${serviceLink.token}` }, method: 'POST', body: { slotId: serviceLink.slots[0].id } })
    assert.equal(chosen.status, 200, await chosen.clone().text())
    const publicVisits = (await h.state()).visits.filter(v => v.jobId === serviceJob.id)
    assert.equal(publicVisits.length, 1)
    assert.ok([r.tech.id, r.second.id].includes(publicVisits[0].technicianId), 'customer choice also assigns only a technician of the job branch')

  }
  const r = roots[1]
  const outside = await h.command('site.save', { customerId: r.customer.id, branchId: r.id, address: '1 Other St, Durham NC 27701' })
  const work = await job(r, 'Outside branch area', undefined, outside)
  const tech = (await h.state()).technicians.find(x => x.id === r.tech.id)
  await h.command('technician.save', { ...tech, zips: ['27601'] })
  const payload = { jobId: work.id, technicianId: tech.id, date: '2026-11-12', start: '09:00', end: '10:00' }
  const warning = await refuse('visit.book', payload, 'CONFLICT_REVIEW')
  assert.deepEqual(warning.details.conflicts.map(x => x.code).sort(), ['area:27701', 'branch-area:27701'])
  const reviewed = await h.command('visit.book', { ...payload, acknowledge: ['area:27701', 'branch-area:27701'] })
  assert.deepEqual(reviewed.assignments[0].reviewedConflicts.map(x => x.code).sort(), ['area:27701', 'branch-area:27701'])
  await h.command('business.save', { ...(await h.state()).business[0], eligibility: { area: 'refuse' } })
  const denied = await refuse('visit.book', { ...payload, start: '11:00', end: '12:00' }, 'ELIGIBILITY')
  assert.deepEqual(denied.details.refused.map(x => x.code).sort(), ['area:27701', 'branch-area:27701'])
  // A technician ZIP match removes only its own area mismatch; the branch
  // boundary still refuses. A drawn-zone match has the same independence.
  const current = (await h.state()).technicians.find(x => x.id === tech.id)
  await h.command('technician.save', { ...current, zips: ['27701'] })
  assert.deepEqual((await refuse('visit.book', { ...payload, start: '12:00', end: '13:00' }, 'ELIGIBILITY')).details.refused.map(x => x.code), ['branch-area:27701'])
  await h.command('maps.connect', { key: 'synthetic-glove-1' })
  h.maps.places.set(outside.address, { lat: 35.99, lng: -78.90 })
  await h.command('site.locate', { siteIds: [outside.id] })
  h.maps.places.set(r.site.address, { lat: 35.78, lng: -78.64 })
  await h.command('site.locate', { siteIds: [r.site.id] })
  const routeTech = (await h.state()).technicians.find(x => x.id === tech.id)
  await h.command('technician.save', { ...routeTech, zips: [] })
  const visitsBeforeRoute = (await h.state()).visits
  const queued = await h.command('route.optimize', { date: '2026-11-06', branchId: r.id })
  await h.scheduled('2026-11-01T12:00:00.000Z')
  const route = (await h.state()).routes.find(x => x.id === queued.id)
  assert.equal(route.status, 'ready', JSON.stringify(route))
  assert.equal(route.moves.length, 2)
  assert.ok(route.moves.every(m => [r.tech.id, r.second.id].includes(m.after.technicianId)))
  assert.deepEqual((await h.state()).visits, visitsBeforeRoute, 'a route proposal never changes a booking')
  await h.command('route.accept', { routeId: route.id, version: route.version, reason: 'Reviewed own-branch route' })
  assert.ok((await h.state()).visits.filter(v => v.local.date === '2026-11-06' && [r.tech.id, r.second.id].includes(v.technicianId)).every(v => v.local.timezone === r.zone))

  const zone = { name: 'Durham', points: [{ lat: 35.9, lng: -79 }, { lat: 36.1, lng: -79 }, { lat: 36.1, lng: -78.8 }, { lat: 35.9, lng: -78.8 }] }
  const withZip = (await h.state()).technicians.find(x => x.id === tech.id)
  const noZip = await h.command('technician.save', { ...withZip, zips: [] })
  const zoned = await h.command('technician.zones', { technicianId: tech.id, version: noZip.version, zones: [zone] })
  assert.deepEqual((await refuse('visit.book', { ...payload, start: '13:00', end: '14:00' }, 'ELIGIBILITY')).details.refused.map(x => x.code), ['branch-area:27701'])
  await h.command('technician.zones', { technicianId: tech.id, version: zoned.version, zones: [{ name: 'Elsewhere', points: zone.points.map(p => ({ lat: p.lat + 1, lng: p.lng })) }] })
  assert.deepEqual((await refuse('visit.book', { ...payload, start: '14:00', end: '15:00' }, 'ELIGIBILITY')).details.refused.map(x => x.code).sort(), ['area:27701', 'branch-area:27701'])

}

export async function mergeProjection(t) {
  const { h, roots, job, refuse } = await projectionFixture(t)
  for (const r of roots) {
    const work = await job(r, `${r.name} invoice`)
    const visit = await h.command('visit.book', { jobId: work.id, technicianId: r.tech.id, date: '2026-11-02', start: '09:00', end: '10:00' })
    await r.person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await r.person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Inspection complete', signoff: { absentReason: 'Customer away' } })
    const inv = await h.command('invoice.prepare', { jobId: work.id })
    await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  }
  for (const [a, z] of [[roots[0], roots[1]], [roots[1], roots[2]], [roots[2], roots[0]]]) {
    const state = await h.state()
    const versions = Object.fromEntries(state.customers.map(c => [c.id, c.version]))
    await refuse('customer.merge', { survivorId: a.customer.id, mergedIds: [z.customer.id], versions })
  }
  const r = roots[1]
  const duplicate = await h.command('customer.save', { name: 'Raleigh second account' })
  const site = await h.command('site.save', { customerId: duplicate.id, address: '2 Raleigh St, Raleigh NC 27601', branchId: r.id })
  const work = await h.command('job.create', { customerId: duplicate.id, siteId: site.id, title: 'Same-branch history', lines: [{ description: 'Repair', quantity: '1', unitPrice: '75.00', tax: 'FREE' }] })
  const before = await h.state()
  const versions = Object.fromEntries(before.customers.map(c => [c.id, c.version]))
  const merged = await h.command('customer.merge', { survivorId: r.customer.id, mergedIds: [duplicate.id], versions })
  assert.equal(merged.status, 'merged')
  const after = await h.state()
  assert.equal(after.customers.find(c => c.id === duplicate.id).mergedInto, r.customer.id)
  assert.equal(after.sites.find(s => s.id === site.id).customerId, r.customer.id)
  assert.equal(after.jobs.find(j => j.id === work.id).customerId, r.customer.id)
  assert.deepEqual(after.invoices, before.invoices, 'an allowed merge leaves unrelated invoices intact')
}

// Deliberately independent CSV reader: assertions inspect every exported row,
// including quoted fields, rather than matching substrings in unopened files.
export function csvRows(text) {
  const rows = []; let row = [], value = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted }
    else if (c === ',' && !quoted) { row.push(value); value = '' }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(value); rows.push(row); row = []; value = ''
    } else value += c
  }
  assert.equal(quoted, false, 'CSV closes its quoted fields')
  if (value || row.length) rows.push([...row, value])
  return rows
}

export async function revenueProjection(t) {
  const { h, roots, job } = await projectionFixture(t)
  const boundaries = [
    ['2026-11-04T12:59:59.999Z', '2026-11-04T13:00:00.000Z', '2026-11-06T12:59:59.999Z', '2026-11-06T13:00:00.000Z'],
    ['2026-11-05T04:59:59.999Z', '2026-11-05T05:00:00.000Z', '2026-11-07T04:59:59.999Z', '2026-11-07T05:00:00.000Z'],
    ['2026-11-05T06:59:59.999Z', '2026-11-05T07:00:00.000Z', '2026-11-07T06:59:59.999Z', '2026-11-07T07:00:00.000Z'],
  ]
  for (const [i, r] of roots.entries()) for (const [n, amount] of ['7.00', '11.00', '13.00', '17.00'].entries()) {
    const work = await job(r, `${r.name} midnight ${n}`, [{ description: 'Inspection', quantity: '1', unitPrice: amount, tax: 'FREE' }])
    const visit = await h.command('visit.book', { jobId: work.id, technicianId: r.tech.id, date: `2026-11-0${2 + n}`, start: '09:00', end: '10:00' })
    await r.person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await r.person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed', signoff: { absentReason: 'Customer away' } })
    const invoice = await h.command('invoice.prepare', { jobId: work.id })
    await h.setTime(boundaries[i][n])
    await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  }
  const expected = [
    ['main', 'Main business', 2, '24.00'],
    [roots[2].id, 'Phoenix', 2, '24.00'],
    [roots[1].id, 'Raleigh', 2, '24.00'],
  ]
  const check = async () => {
    const snapshots = []
    for (const root of [null, ...roots]) {
      const path = `/api/glove/reports/revenue?from=2026-11-05&to=2026-11-06${root ? `&branchId=${root.id}` : ''}`
      const request = async format => {
        const response = await h.request(path.replace('revenue?', `revenue.${format}?`))
        assert.equal(response.status, 200)
        return format === 'json' ? response.json() : csvRows(await response.text())
      }
      const json = await request('json'), csv = await request('csv')
      const branches = root ? expected.filter(row => row[0] === root.id) : expected
      const count = root ? 2 : 6, total = root ? '24.00' : '72.00'
      assert.deepEqual(json.byBranch.map(r => [r.branchId, r.branch, r.invoices, r.revenue]), branches)
      assert.deepEqual(json.total, { invoices: count, revenue: total })
      assert.deepEqual(json.byMonth, [{ month: '2026-11', invoices: count, revenue: total }])
      assert.deepEqual(csv, [
        ['group', 'key', 'invoices', 'revenue'], ['month', '2026-11', String(count), total],
        ['job type', 'Uncategorized', String(count), total],
        ...branches.map(([, name, n, sum]) => ['branch', name, String(n), sum]), ['total', '', String(count), total],
      ])
      snapshots.push({ json, csv })
    }
    return snapshots
  }
  const before = await h.state(), reports = await check()
  assert.deepEqual(await h.state(), before, 'revenue reads never write')
  await h.restart()
  assert.deepEqual(await h.state(), before)
  assert.deepEqual(await check(), reports, 'every JSON figure and parsed CSV row survives actual Worker restart')
}

export async function reportsProjection(t) {
  const { h, b, roots } = await projectionFixture(t, '2026-11-05T12:00:00.000Z')
  await h.command('payroll.settings', { adp: { companyCode: 'G3X', payFrequency: 'W' } })
  for (const [i, r] of roots.entries()) {
    t.diagnostic?.(`TEAM-004 report seed: ${r.name}`)
    r.net = `${(i + 1) * 100}.00`; r.gross = `${(i + 1) * 110}.00`; r.tax = `${(i + 1) * 10}.00`
    r.source = ['phone', 'website', 'referral'][i]
    r.tech = await h.command('technician.save', { ...r.tech, payrollId: String(101 + i) })
    if (i === 0) r.subPerson = b.tomPerson
    else r.subPerson = await h.person(`${r.name} Sub`, 'technician')
    r.sub = await h.command('technician.save', { ...r.second, operatorId: r.subPerson.id, subcontractor: { payeeName: `${r.name} Contracting`, tinLast4: `100${i}` } })
    r.equipment = await h.command('equipment.save', { siteId: r.site.id, type: 'Condenser', serial: `synthetic-glove-${i + 1}`, refrigerant: 'R-410A', manufacturerWarrantyUntil: '2026-11-20', laborWarrantyUntil: '2026-10-01' })
    r.enquiry = await h.command('enquiry.create', { customerId: r.customer.id, siteId: r.site.id, description: `${r.name} request`, source: r.source })
    const q = await h.command('quote.draft', { enquiryId: r.enquiry.id, customerId: r.customer.id, siteId: r.site.id, title: `${r.name} repair`, lines: [{ description: 'Repair', quantity: '1', unitPrice: r.net, tax: 'GST' }] })
    const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
    r.job = await h.command('job.create', { quoteId: q.id, equipmentIds: [r.equipment.id] })
    const visits = []
    for (const [person, tech] of [[r.person, r.tech], [r.subPerson, r.sub]]) {
      const visit = await h.command('visit.book', { jobId: r.job.id, technicianId: tech.id, date: '2026-11-05', start: '09:00', end: '10:00' })
      visits.push({ person, tech, visit })
    }
    for (const item of visits) {
      const { person, tech } = item
      let { visit } = item
      if (tech.id === r.sub.id) visit = await h.command('visit.agree', { visitId: visit.id, version: visit.version, amount: '75.00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      if (tech.id === r.tech.id) r.capture = await person.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'refrigerant', equipmentId: r.equipment.id, added: String(i + 1), recovered: '0.5', certification: 'synthetic-glove-certification' })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed repair', signoff: { absentReason: 'Customer away' } })
    }
    r.invoice = await h.command('invoice.prepare', { jobId: r.job.id })
    await h.command('invoice.approve', { invoiceId: r.invoice.id, version: r.invoice.version, revision: 1 })
    // Every root has real approved payroll time, not an empty export.
    await r.person.run('clock.in', { deviceTime: '2026-11-05T08:00:00.000Z' })
    await r.person.run('clock.out', { deviceTime: '2026-11-05T09:00:00.000Z' })
    await h.command('timesheet.approve', { technicianId: r.tech.id, weekStart: '2026-11-02' })
    const plan = await h.command('plan.save', { name: `${r.name} Care`, price: r.net, termMonths: 12, includedVisits: 1, visitServiceId: b.service.id, formIds: [] })
    r.agreement = await h.command('agreement.sell', { planId: plan.id, customerId: r.customer.id, siteId: r.site.id, via: 'phone', startDate: '2026-11-01' })
  }
  const period = 'from=2026-11-02&to=2026-11-08'
  const named = ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax', 'agreements']
  const doors = [...named.flatMap(kind => ['json', 'csv'].map(format => [`${kind}.${format}`, period])), ['receivables.json', 'asOf=2026-11-08'], ['receivables.csv', 'asOf=2026-11-08'], ['1099.json', 'year=2026'], ['1099.csv', 'year=2026'], ['payroll.json', period], ...['gusto', 'adp-run', 'quickbooks'].map(kind => [`payroll-${kind}.csv`, period]), ['costing', period], ['warranties', ''], ['refrigerant', period], ['sources', '']]
  const read = async (door, query, branchId, as) => {
    const response = await h.request(`/api/glove/reports/${door}?${query}&branchId=${branchId}`, as ? { as } : {})
    assert.equal(response.status, 200, `${door} for ${branchId}: ${await response.clone().text()}`)
    return door.endsWith('.csv') ? csvRows(await response.text()) : response.json()
  }
  const reports = []
  for (const r of roots) {
    const before = await h.state()
    for (const [door, query] of doors) {
      t.diagnostic?.(`TEAM-004 report read: ${r.name} ${door}`)
      const result = await read(door, query, r.id)
      reports.push([r.id, door, result])
      const kind = door.replace(/\.(json|csv)$/, '')
      if (door.endsWith('.csv')) {
        const data = result.slice(1)
        if (kind === 'revenue') assert.deepEqual(data, [['month', '2026-11', '1', r.net], ['job type', 'Uncategorized', '1', r.net], ['branch', r.name, '1', r.net], ['total', '', '1', r.net]])
        if (kind === 'technicians') assert.deepEqual(data.map(x => [x[0], x[1], x[2], x[5]]).sort(), [[r.tech.name, `${(roots.indexOf(r) + 1) * 50}.00`, '1', '1.0'], [r.sub.name, `${(roots.indexOf(r) + 1) * 50}.00`, '1', '0.0']].sort())
        if (kind === 'sources') assert.deepEqual(data, [[r.source, '1', '1', '100.0', r.gross, r.gross], ['total', '1', '1', '100.0', r.gross, r.gross]])
        if (kind === 'quotes') assert.deepEqual(data, [['1', '1', '0', '100.0', r.gross]])
        if (kind === 'margins') assert.deepEqual(data, [['Uncategorized', '1', r.net, '0.00', '0.00', '100.0', '100.0'], ['total', '1', r.net, '0.00', '0.00', '100.0', '100.0']])
        if (kind === 'tax') assert.deepEqual(data, [[r.name, "GST (the business's tax)", '2026-11', '1', r.tax], [r.name, "GST (the business's tax)", 'total', '1', r.tax]])
        if (kind === 'agreements') assert.deepEqual(data, [[`${r.name} Care`, '1'], ['total sold', '1'], ['active at period end', '1'], ['churn', '0'], ['sold value', r.net]])
        if (kind === 'receivables') assert.deepEqual(data.map(x => [x[0], x[2], x[9]]), [[r.customer.name, r.invoice.number, r.gross]])
        if (kind === '1099') assert.deepEqual(data, [[`${r.name} Contracting`, `100${roots.indexOf(r)}`, '1', '75.00', 'no', 'Totals for your filing, not a filed 1099']])
        if (kind === 'payroll-gusto') { const [first, ...last] = r.tech.name.split(' '); assert.deepEqual(data, [[last.join(' '), first, r.tech.payrollId, '2026-11-02 - 2026-11-08', '1.00', '0.00', '0.00', '0.00']]) }
        if (kind === 'payroll-adp-run') assert.deepEqual(result.slice(2), [['G3X', 'W', '11/02/2026', '11/08/2026', r.tech.payrollId, 'REG', '1.00', '', '0', '', 'BASE']])
        if (kind === 'payroll-quickbooks') assert.deepEqual(data, [[r.tech.name, '11/05/2026', 'Regular', '1.00', '']])
      } else {
        if (kind === 'revenue') { assert.deepEqual(result.total, { invoices: 1, revenue: r.net }); assert.deepEqual(result.byBranch, [{ branchId: r.id, branch: r.name, invoices: 1, revenue: r.net }]) }
        if (kind === 'technicians') assert.deepEqual(result.technicians.map(x => [x.technicianId, x.revenue, x.visitsCompleted, x.hours]).sort(), [[r.tech.id, `${(roots.indexOf(r) + 1) * 50}.00`, 1, '1.0'], [r.sub.id, `${(roots.indexOf(r) + 1) * 50}.00`, 1, '0.0']].sort())
        if (kind === 'sources') { assert.deepEqual(result.sources.map(x => [x.source, x.requests, x.won, x.wonValue, x.invoiced]), [[r.source, 1, 1, r.gross, r.gross]]); assert.equal(result.total.requests, 1) }
        if (kind === 'quotes') assert.deepEqual([result.answered, result.won, result.lost, result.winRate, result.wonValue], [1, 1, 0, '100.0', r.gross])
        if (kind === 'margins' || kind === 'costing') { assert.deepEqual(result.total, { jobs: 1, revenue: r.net, estimatedCost: '0.00', actualCost: '0.00', estimatedMargin: '100.0', actualMargin: '100.0' }); assert.deepEqual(result.byJobType.map(x => x.type), ['Uncategorized']) }
        if (kind === 'tax') assert.deepEqual(result.jurisdictions.map(x => [x.branchId, x.invoices, x.taxable, x.tax]), [[r.id === 'main' ? null : r.id, 1, r.net, r.tax]])
        if (kind === 'agreements') assert.deepEqual([result.sold, result.active, result.churn, result.soldValue, result.byPlan], [1, 1, 0, r.net, [{ plan: `${r.name} Care`, sold: 1 }]])
        if (kind === 'receivables') assert.deepEqual(result.customers.map(x => [x.customerId, x.invoices.map(v => [v.id, v.balance])]), [[r.customer.id, [[r.invoice.id, r.gross]]]])
        if (kind === '1099') assert.deepEqual(result.rows.map(x => [x.technicianId, x.total, x.visits]), [[r.sub.id, '75.00', 1]])
        if (kind === 'payroll') { assert.deepEqual(result.people.map(x => [x.technicianId, x.hours]), [[r.tech.id, { regular: '1.00', overtime: '0.00', doubleTime: '0.00' }]]); assert.deepEqual(result.left, []) }
        if (kind === 'warranties') { assert.deepEqual(result.expiring.map(x => [x.equipmentId, x.warranty]), [[r.equipment.id, 'manufacturer']]); assert.deepEqual(result.expired.map(x => [x.equipmentId, x.warranty]), [[r.equipment.id, 'labor']]) }
        if (kind === 'refrigerant') { assert.deepEqual(result.entries.map(x => [x.captureId, x.equipmentId, x.jobId]), [[r.capture.id, r.equipment.id, r.job.id]]); assert.deepEqual([result.added, result.recovered], [String(roots.indexOf(r) + 1), '0.5']) }
      }
      for (const other of roots.filter(x => x !== r)) {
        assert.ok(!JSON.stringify(result).includes(other.customer.id), `${door} excludes other customers`)
        assert.ok(!JSON.stringify(result).includes(other.job.id), `${door} excludes other jobs`)
        assert.ok(!JSON.stringify(result).includes(other.tech.id), `${door} excludes other technicians`)
      }
    }
    assert.deepEqual(await h.state(), before, `${r.name} reports change no record`)
  }
  // Every current transport refuses unknown roots and other live scopes;
  // use the same office session before and after its authority changes.
  await h.command('branch.limit', { operatorId: b.office.id, branchId: roots[1].id })
  const before = await h.state()
  for (const [door, query] of doors) {
    for (const [id, as] of [['synthetic-glove-unknown', undefined], [roots[2].id, b.office.cookie], ['main', b.office.cookie]]) {
      const response = await h.request(`/api/glove/reports/${door}?${query}&branchId=${id}`, as ? { as } : {})
      assert.equal(response.status, 404, `${door} rejects ${id}`)
      assert.equal((await response.json()).error.code, 'NOT_FOUND')
    }
    assert.deepEqual(await read(door, query, roots[1].id, b.office.cookie), reports.find(([id, name]) => id === roots[1].id && name === door)[2], `${door} supports the allowed scoped reader`)
  }
  assert.deepEqual(await h.state(), before, 'all successful and refused report reads preserve all records')
}
