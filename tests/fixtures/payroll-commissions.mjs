// Native payroll events with independently enumerated cent amounts.
import { business } from '../api/harness.mjs'

export const commissionRange = 'from=2026-11-02&to=2026-11-22'
export const commissionKinds = ['gusto', 'adp-run', 'quickbooks']
export const commissionFile = (kind, range = commissionRange) => `/api/glove/reports/payroll-${kind}.csv?${range}`
export const commissionJson = '/api/glove/reports/payroll.json?' + commissionRange
const stamp = (date, time = '00:05') => `${date}T${time}:00+11:00`

export async function commissionFixture(h) {
  const b = await business(h)
  const priya = await h.command('technician.save', { ...b.priya, payrollId: '304' })
  const tom = await h.command('technician.save', { ...b.tom, payrollId: '305' })
  const excluded = await h.command('technician.save', { name: 'Synthetic Glove No Time', payrollId: '306' })
  const sub = await h.command('technician.save', { name: 'Synthetic Glove Contractor', payrollId: '307', subcontractor: { payeeName: 'Synthetic Glove Contracting', tinLast4: '9876' } })
  await h.command('payroll.settings', { dailyOvertime: { afterHours: 8, doubleAfterHours: 12 }, adp: { companyCode: 'GLOVE23', payFrequency: 'B' }, commissions: { from: '2026-11-02', soldPercent: '5', completedPercent: '50', agreementSpiff: '25' } })
  const sale = async (date, tech, amount) => {
    await h.setTime(stamp(date))
    const q = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic Glove commission sale', lines: [{ description: 'Installation', quantity: '1', unitPrice: amount }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    return b.dispatcher.run('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin', ...(tech ? { soldByTechnicianId: tech.id } : {}) })
  }
  // Reverse booking order proves the split remainder belongs to the first by
  // technician name, rather than the first visit or first completion.
  const q = await sale('2026-11-03', null, '100.01')
  const job = await b.dispatcher.run('job.create', { quoteId: q.id })
  const visits = []
  for (const [tech, person] of [[tom, b.tomPerson], [priya, b.priyaPerson]]) {
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-03', start: '08:00', end: '09:00' })
    visits.push(visit)
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: stamp('2026-11-03', '08:00') })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: stamp('2026-11-03', '09:00'), summary: 'Installed', signoff: { absentReason: 'Customer away' } })
  }
  for (const [person, date, end] of [[b.priyaPerson, '2026-11-02', '16:00'], [b.priyaPerson, '2026-11-09', '21:00'], [b.tomPerson, '2026-11-03', '10:00'], [b.tomPerson, '2026-11-10', '11:00']]) {
    await person.run('clock.in', { deviceTime: stamp(date, '08:00') })
    if (date === '2026-11-03') {
      await person.run('timer.start', { visitId: visits[0].id, kind: 'job', deviceTime: stamp(date, '08:00') })
      await person.run('timer.stop', { visitId: visits[0].id, deviceTime: stamp(date, '09:00') })
    }
    await person.run('clock.out', { deviceTime: stamp(date, end) })
  }
  await h.setTime(stamp('2026-11-23'))
  for (const tech of [priya, tom]) for (const weekStart of ['2026-11-02', '2026-11-09']) await h.command('timesheet.approve', { technicianId: tech.id, weekStart })
  const items = []
  const sold = async (date, tech, base, rate, amount) => {
    const quote = await sale(date, tech, base)
    items.push({ technicianId: tech.id, date, kind: 'sold', subjectId: quote.id, label: `${quote.number} sold`, base, rate, amount })
  }
  const finish = async () => {
    // $100.01 / 2 = $50.01 and $50.00; 50% rounds to $25.01 and $25.00.
    await h.setTime(stamp('2026-11-04'))
    const draft = await b.office.run('invoice.prepare', { jobId: job.id })
    const invoice = await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    for (const [tech, base, amount] of [[priya, '50.01', '25.01'], [tom, '50.00', '25.00']]) items.push({ technicianId: tech.id, date: '2026-11-04', kind: 'completed', subjectId: invoice.id, label: `${invoice.number} completed`, base, rate: '50%', amount })
    await sold('2026-11-08', tom, '200.10', '5%', '10.01')
    for (const [date, tech, base, amount] of [['2026-11-09', priya, '300.05', '30.01'], ['2026-11-09', tom, '100.10', '10.01'], ['2026-11-16', priya, '400.00', '40.00'], ['2026-11-16', tom, '500.00', '50.00']]) await sold(date, tech, base, '10%', amount)
    const plan = await h.command('plan.save', { name: 'Synthetic Glove Service Plan', price: '228.00', termMonths: 12, includedVisits: 1, visitServiceId: b.service.id, repairDiscountPercent: '0' })
    for (const [date, tech, amount] of [['2026-11-04', priya, '25.00'], ['2026-11-09', tom, '40.00'], ['2026-11-16', priya, '40.00']]) {
      await h.setTime(stamp(date))
      const site = await h.command('site.save', { customerId: b.customer.id, address: `${items.length} Synthetic Glove Road` })
      const agreement = await b.office.run('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: site.id, via: 'phone', soldByTechnicianId: tech.id })
      items.push({ technicianId: tech.id, date, kind: 'agreement', subjectId: agreement.id, label: `${plan.name} sold`, base: '228.00', rate: `$${amount}`, amount })
    }
    await sold('2026-11-16', excluded, '600.00', '10%', '60.00')
    await sold('2026-11-16', sub, '700.00', '10%', '70.00')
    await sale('2026-11-23', priya, '900.00') // Outside the selected period.
    await h.setTime(stamp('2026-11-23'))
  }
  return { b, priya, tom, excluded, sub, items, sold, finish }
}

const gusto = ['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission']
const adp = ['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code']
const qb = ['Employee', 'Date', 'Pay item', 'Hours', 'Amount']
export function commissionRows(code = 'COMM') {
  const adpRow = (id, code, hours, dollars) => ['GLOVE23', 'B', '11/02/2026', '11/22/2026', id, code, hours, dollars, '0', '', 'BASE']
  return {
    gusto: [gusto,
      ['N.', 'Priya', '304', '2026-11-02 - 2026-11-08', '8.00', '0.00', '0.00', '111.74'],
      ['N.', 'Priya', '304', '2026-11-09 - 2026-11-15', '8.00', '4.00', '1.00', '30.01'],
      ['N.', 'Priya', '304', '2026-11-16 - 2026-11-22', '0.00', '0.00', '0.00', '80.00'],
      ['B.', 'Tom', '305', '2026-11-02 - 2026-11-08', '2.00', '0.00', '0.00', '35.01'],
      ['B.', 'Tom', '305', '2026-11-09 - 2026-11-15', '3.00', '0.00', '0.00', '50.01'],
      ['B.', 'Tom', '305', '2026-11-16 - 2026-11-22', '0.00', '0.00', '0.00', '50.00']],
    'adp-run': [['##GENERIC## V1.0'], adp, adpRow('304', 'REG', '16.00', ''), adpRow('304', 'OTP', '4.00', ''), adpRow('304', 'DBL', '1.00', ''), adpRow('305', 'REG', '5.00', ''), adpRow('304', code, '', '221.75'), adpRow('305', code, '', '135.02')],
    quickbooks: [qb,
      ['Priya N.', '11/02/2026', 'Regular', '8.00', ''], ['Priya N.', '11/09/2026', 'Regular', '8.00', ''], ['Priya N.', '11/09/2026', 'Overtime', '4.00', ''], ['Priya N.', '11/09/2026', 'Double time', '1.00', ''],
      ['Tom B.', '11/03/2026', 'Regular', '2.00', ''], ['Tom B.', '11/10/2026', 'Regular', '3.00', ''],
      ['Priya N.', '11/04/2026', 'Commission', '', '111.74'], ['Priya N.', '11/09/2026', 'Commission', '', '30.01'], ['Priya N.', '11/16/2026', 'Commission', '', '80.00'],
      ['Tom B.', '11/04/2026', 'Commission', '', '25.00'], ['Tom B.', '11/08/2026', 'Commission', '', '10.01'], ['Tom B.', '11/09/2026', 'Commission', '', '50.01'], ['Tom B.', '11/16/2026', 'Commission', '', '50.00']],
  }
}

export function commissionSummary(f, tech) {
  const priya = tech.id === f.priya.id
  return {
    sold: { revenue: priya ? '1934.55' : '800.20', amount: priya ? '131.74' : '70.02' },
    completed: { revenue: priya ? '50.01' : '50.00', amount: priya ? '25.01' : '25.00' },
    agreements: { count: priya ? 2 : 1, amount: priya ? '65.00' : '40.00' },
    total: priya ? '221.75' : '135.02',
    items: f.items.filter(x => x.technicianId === tech.id).sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind)),
  }
}
