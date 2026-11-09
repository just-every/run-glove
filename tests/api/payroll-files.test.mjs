import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'
import { commissionFixture, commissionKinds, commissionRange, commissionFile, commissionJson, commissionRows, commissionSummary } from '../fixtures/payroll-commissions.mjs'

// Independently read CSV cells, including display names with commas and quotes.
function rows(text) {
  const records = [], row = []
  let cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if (!quoted && (c === ',' || c === '\r' || c === '\n')) {
      row.push(cell); cell = ''
      if (c !== ',') {
        records.push(row.splice(0))
        if (c === '\r' && text[i + 1] === '\n') i++
      }
    } else cell += c
  }
  assert.equal(quoted, false, 'CSV closes every quoted cell')
  assert.equal(cell, '', 'CSV ends with a complete record')
  assert.deepEqual(row, [])
  return records
}

const assertRows = (text, expected) => {
  const order = (a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))
  assert.deepEqual(rows(text).sort(order), [...expected].sort(order))
}

const stamp = (date, time) => date + 'T' + time + ':00+11:00'
const period = 'from=2026-11-02&to=2026-11-08'
const kinds = ['adp-run', 'gusto', 'quickbooks']
const file = (kind, range = period) => '/api/glove/reports/payroll-' + kind + '.csv?' + range
const gustoHeader = ['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission']
const adpHeader = ['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code']
const name = 'Tom "Ace", Brooks'

async function readFile(h, kind, opts = {}, range = period) {
  const response = await h.request(file(kind, range), opts)
  assert.equal(response.status, 200, await response.clone().text())
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8')
  assert.match(response.headers.get('content-disposition'), /^attachment; filename="glove-payroll-/)
  return response.text()
}
async function shift(person, date, start, end) {
  await person.run('clock.in', { deviceTime: stamp(date, start) })
  await person.run('clock.out', { deviceTime: stamp(date, end) })
}
async function unchanged(h, run) {
  const before = await h.state()
  const exported = await h.request('/api/glove/export').then(r => r.json())
  await run()
  assert.deepEqual(await h.state(), before, 'refusal changes no business records')
  assert.deepEqual(await h.request('/api/glove/export').then(r => r.json()), exported, 'refusal changes no exported business records')
}

test('COST-007 payroll files qualify provider rows, approved workweeks, privacy and export authority', async t => {
  const h = await installation({ at: '2026-11-30T02:00:00Z' })
  t.after(() => h.close())
  const b = await business(h)
  let priya = await h.command('technician.save', { ...b.priya, name: 'Priya Amara Nair', payrollId: '104' })
  let tom = await h.command('technician.save', { ...b.tom, name })
  const subPerson = await h.person('Synthetic Glove Contractor', 'technician')
  const sub = await h.command('technician.save', { name: 'Synthetic Glove Subcontractor', operatorId: subPerson.id, payrollId: '999', subcontractor: { payeeName: 'Synthetic Glove Contracting', tinLast4: '9876' } })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Synthetic payroll time')).id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: priya.id, date: '2026-11-02', start: '08:00', end: '10:00' })
  await h.command('payroll.settings', { dailyOvertime: { afterHours: 8, doubleAfterHours: 12 } })
  await b.priyaPerson.run('clock.in', { deviceTime: stamp('2026-11-02', '07:00') })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'job', deviceTime: stamp('2026-11-02', '08:00') })
  await b.priyaPerson.run('timer.stop', { visitId: visit.id, deviceTime: stamp('2026-11-02', '10:17') })
  await b.priyaPerson.run('clock.out', { deviceTime: stamp('2026-11-02', '20:01') })
  await shift(b.tomPerson, '2026-11-03', '08:00', '09:01')
  await shift(subPerson, '2026-11-03', '08:00', '14:00')
  for (const technician of [priya, tom]) await h.command('timesheet.approve', { technicianId: technician.id, weekStart: '2026-11-02' })

  await scenario(t, 'COST-007 point 1: ADP RUN exact layout, owner codes, setup refusals and unmatched payroll IDs', async () => {
    await unchanged(h, async () => {
      const response = await h.request(file('adp-run'))
      assert.equal(response.status, 409)
      assert.equal((await response.json()).error.code, 'PAYROLL_SETUP')
    })
    for (const adp of [
      { companyCode: 'ABCDEFGHIJK', payFrequency: 'W' },
      { companyCode: 'GLOVE!23', payFrequency: 'W' },
      { companyCode: 'GLOVE23', payFrequency: 'Q' },
    ]) await unchanged(h, () => h.command('payroll.settings', { adp }, { error: 'INPUT' }))
    const expected = (codes, frequency = 'W') => [
      ['##GENERIC## V1.0'], adpHeader,
      ['GLOVE23', frequency, '11/02/2026', '11/08/2026', '104', codes[0], '8.00', '', '0', '', 'BASE'],
      ['GLOVE23', frequency, '11/02/2026', '11/08/2026', '104', codes[1], '4.00', '', '0', '', 'BASE'],
      ['GLOVE23', frequency, '11/02/2026', '11/08/2026', '104', codes[2], '1.02', '', '0', '', 'BASE'],
      ['GLOVE23', frequency, '11/02/2026', '11/08/2026', '', codes[0], '1.02', '', '0', '', 'BASE'],
    ]
    await h.command('payroll.settings', { adp: { companyCode: 'GLOVE23', payFrequency: 'W' } })
    const defaults = await readFile(h, 'adp-run')
    assertRows(defaults, expected(['REG', 'OTP', 'DBL']))
    assert.ok(defaults.endsWith('\r\n'))
    assert.doesNotMatch(defaults.replaceAll('\r\n', ''), /[\r\n]/)
    await h.command('payroll.settings', { adp: { companyCode: 'GLOVE23', payFrequency: 'B', regular: 'REGOWN', overtime: 'OTOWN', doubleTime: 'DTOWN' } })
    assertRows(await readFile(h, 'adp-run'), expected(['REGOWN', 'OTOWN', 'DTOWN'], 'B'))
    const run = await h.request('/api/glove/reports/payroll.json?' + period).then(r => r.json())
    assert.deepEqual(run.adpMissingIds, [name])
    assert.deepEqual(run.people.map(p => p.technicianId).sort(), [priya.id, tom.id].sort())
    assert.deepEqual(run.left.map(p => [p.technicianId, p.reason]), [[sub.id, '1099 subcontractor: paid through the 1099-NEC totals, not payroll']])
    assert.equal((await h.request('/api/glove/timesheets?week=2026-11-02').then(r => r.json())).timesheets.find(p => p.technicianId === priya.id).hours.job, '2.28', 'job timers are shown but are not added again to paid shift hours')
  })

  await scenario(t, 'COST-007 point 2: Gusto exact employee columns and first-word names', async () => {
    tom = await h.command('technician.save', { ...tom, payrollId: '105' })
    assertRows(await readFile(h, 'gusto'), [
      gustoHeader,
      ['Amara Nair', 'Priya', '104', '2026-11-02 - 2026-11-08', '8.00', '4.00', '1.02', '0.00'],
      ['"Ace", Brooks', 'Tom', '105', '2026-11-02 - 2026-11-08', '1.02', '0.00', '0.00', '0.00'],
    ])
  })

  await scenario(t, 'COST-007 point 3: three workweeks retain each approved week and its own overtime and refuse invalid periods', async step => {
    const h = await installation({ at: '2026-11-30T02:00:00Z' })
    step.after(() => h.close())
    const b = await business(h)
    for (const tech of [b.priya, b.tom]) await h.command('technician.save', { ...tech, payrollId: tech.id === b.priya.id ? '204' : '205' })
    for (const person of [b.priyaPerson, b.tomPerson]) await shift(person, '2026-11-02', '08:00', '16:00')
    for (const date of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']) await shift(b.priyaPerson, date, '07:00', '17:00')
    await shift(b.priyaPerson, '2026-11-13', '08:00', '12:00')
    await shift(b.tomPerson, '2026-11-09', '08:00', '10:00')
    // The third week is unapproved and empty for eligible employees. A person
    // with real unapproved time is withheld for the whole period, per COST-006.
    const latePerson = await h.person('Synthetic Glove Unapproved', 'technician')
    const late = await h.command('technician.save', { name: 'Synthetic Glove Unapproved', operatorId: latePerson.id, payrollId: '206' })
    await shift(latePerson, '2026-11-02', '08:00', '09:00')
    await shift(latePerson, '2026-11-16', '08:00', '09:00')
    await h.command('timesheet.approve', { technicianId: late.id, weekStart: '2026-11-02' })
    for (const tech of [b.priya, b.tom]) for (const weekStart of ['2026-11-02', '2026-11-09']) await h.command('timesheet.approve', { technicianId: tech.id, weekStart })
    const range = 'from=2026-11-02&to=2026-11-22'
    assertRows(await readFile(h, 'gusto', {}, range), [
      gustoHeader,
      ['N.', 'Priya', '204', '2026-11-02 - 2026-11-08', '8.00', '0.00', '0.00', '0.00'],
      ['N.', 'Priya', '204', '2026-11-09 - 2026-11-15', '40.00', '4.00', '0.00', '0.00'],
      ['B.', 'Tom', '205', '2026-11-02 - 2026-11-08', '8.00', '0.00', '0.00', '0.00'],
      ['B.', 'Tom', '205', '2026-11-09 - 2026-11-15', '2.00', '0.00', '0.00', '0.00'],
    ])
    const run = await h.request('/api/glove/reports/payroll.json?' + range).then(r => r.json())
    assert.deepEqual(run.left.map(p => [p.name, p.reason]), [['Synthetic Glove Unapproved', 'week of 2026-11-16 not approved']])
    for (const range of [
      'from=2026-11-02&to=2026-11-01',
      'from=2026-11-02&to=2026-12-20',
      'from=2026-11-02&to=2026-11-21',
    ]) await unchanged(h, async () => {
      for (const kind of kinds) {
        const response = await h.request(file(kind, range))
        assert.equal(response.status, 400)
        assert.equal((await response.json()).error.code, 'INPUT')
      }
    })
  })

  await scenario(t, 'COST-007 point 4: an offered SSN never enters state, business export or payroll files', async () => {
    const offered = 'synthetic-glove-private-ssn-7'
    priya = await h.command('technician.save', { ...priya, ssn: offered })
    assert.equal(Object.hasOwn(priya, 'ssn'), false)
    for (const body of [
      JSON.stringify(await h.state()),
      await h.request('/api/glove/export').then(r => r.text()),
      ...await Promise.all(kinds.map(kind => readFile(h, kind))),
    ]) {
      assert.ok(!body.includes(offered), 'the offered private value is absent')
      assert.doesNotMatch(body, /"ssn"\s*:|\bsocial.?security\b/i)
      assert.doesNotMatch(body, /(?:^|,)ssn(?:,|\r?\n)/i, 'no SSN column')
    }
  })

  await scenario(t, 'COST-007 point 5: QuickBooks daily pay items, all file permissions and actual Worker restart', async () => {
    assertRows(await readFile(h, 'quickbooks'), [
      ['Employee', 'Date', 'Pay item', 'Hours', 'Amount'],
      ['Priya Amara Nair', '11/02/2026', 'Regular', '8.00', ''],
      ['Priya Amara Nair', '11/02/2026', 'Overtime', '4.00', ''],
      ['Priya Amara Nair', '11/02/2026', 'Double time', '1.02', ''],
      [name, '11/03/2026', 'Regular', '1.02', ''],
    ])
    const role = await h.command('role.save', { name: 'Synthetic payroll nonexporter', permissions: ['reports.read'] })
    const custom = await h.person('Synthetic Glove Custom', 'custom:' + role.id)
    const integration = await h.command('token.issue', { name: 'Synthetic payroll integration', role: 'dispatcher' })
    // Authenticate once before the no-business-change snapshots. Credential
    // usage metadata is expected on first use, independently of export rights.
    assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: 'Bearer ' + integration.token } })).status, 200)
    const originals = {}
    for (const kind of kinds) {
      originals[kind] = await readFile(h, kind)
      assert.equal(await readFile(h, kind, { as: b.office.cookie }), originals[kind])
      assert.doesNotMatch(originals[kind], /Subcontractor|Contracting|9876|999/)
      await unchanged(h, async () => {
        for (const as of [b.dispatcher.cookie, b.priyaPerson.cookie, custom.cookie, '']) {
          const response = await h.request(file(kind), { as })
          assert.equal(response.status, as ? 403 : 401)
        }
        const response = await h.request(file(kind), { as: '', headers: { authorization: 'Bearer ' + integration.token } })
        assert.equal(response.status, 403)
      })
    }
    await h.restart()
    for (const kind of kinds) {
      assert.equal(await readFile(h, kind), originals[kind], 'Owner download survives actual Worker restart byte for byte')
      assert.equal(await readFile(h, kind, { as: b.office.cookie }), originals[kind], 'Office download survives actual Worker restart byte for byte')
    }
  })
  {
    const h = await installation({ at: '2026-11-23T02:00:00Z' })
  try {
    const f = await commissionFixture(h)
    const read = async kind => {
      const r = await h.request(commissionFile(kind))
      assert.equal(r.status, 200, await r.clone().text())
      return r.text()
    }
    const json = async () => {
      const r = await h.request(commissionJson)
      assert.equal(r.status, 200)
      return r.json()
    }
    const sheet = async () => (await h.request('/api/glove/timesheets?week=2026-11-02').then(r => r.json())).timesheets.find(x => x.technicianId === f.priya.id)
    await scenario(t, 'TEAM-006 point 1: reads recompute earnings after hours approval under the rule on each sale date', async () => {
      const approval = await sheet()
      const before = await read('gusto')
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '0.00')
      await f.sold('2026-11-04', f.priya, '1234.50', '5%', '61.73')
      assert.notEqual(await read('gusto'), before)
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '61.73')
      assert.deepEqual(await sheet(), approval, 'a credited sale neither changes approved hours nor reapproves the sheet')
      assert.equal((await sheet()).status, 'approved')
      await h.command('payroll.settings', { commissions: { from: '2026-11-09', soldPercent: '10', completedPercent: '25', agreementSpiff: '40' } })
      assert.equal((await json()).people.find(x => x.technicianId === f.priya.id).commission.total, '61.73', 'the new dated rule leaves the earlier sale unchanged')
      await f.finish()
      assert.deepEqual(await sheet(), approval)
      const p = (await json()).people.find(x => x.technicianId === f.priya.id)
      assert.deepEqual(p.commission.items.filter(x => x.kind === 'sold').map(x => [x.date, x.rate, x.amount]), [['2026-11-04', '5%', '61.73'], ['2026-11-09', '10%', '30.01'], ['2026-11-16', '10%', '40.00']])
    })

    await scenario(t, 'TEAM-006 point 2: every provider row matches two technicians over three workweeks with both ADP commission codes', async () => {
      for (const kind of commissionKinds) assertRows(await read(kind), commissionRows()[kind])
      await h.command('payroll.settings', { adp: { companyCode: 'GLOVE23', payFrequency: 'B', commission: 'SALESOWN' } })
      for (const kind of commissionKinds) assertRows(await read(kind), commissionRows('SALESOWN')[kind])
    })

    await scenario(t, 'TEAM-006 point 3: credited people without approved time and subcontractors never enter any file', async () => {
      const run = await json()
      assert.deepEqual(run.people.map(x => x.technicianId).sort(), [f.priya.id, f.tom.id].sort())
      assert.deepEqual(run.left.sort((a, b) => a.name.localeCompare(b.name)), [
        { technicianId: f.sub.id, name: f.sub.name, reason: '1099 subcontractor: paid through the 1099-NEC totals, not payroll' },
        { technicianId: f.excluded.id, name: f.excluded.name, reason: 'commissions of $60.00 but no approved time in the period' },
      ])
      const state = await h.state()
      for (const tech of [f.excluded, f.sub]) assert.ok(state.quotes.some(x => x.acceptance?.soldByTechnicianId === tech.id), 'excluded person really has an accepted credited sale')
      for (const kind of commissionKinds) {
        const text = await read(kind)
        assert.doesNotMatch(text, /Synthetic Glove|306|307|9876/)
        assertRows(text, commissionRows('SALESOWN')[kind])
      }
    })

    await scenario(t, 'TEAM-006 point 4: JSON enumerates sold, completed and agreement credits including the shared invoice cent remainder', async () => {
      const run = await json()
      for (const tech of [f.priya, f.tom]) assert.deepEqual(run.people.find(x => x.technicianId === tech.id).commission, commissionSummary(f, tech))
    })

    await scenario(t, 'TEAM-006 point 5: reads make no payment or provider confirmation and remain identical after actual Worker restart', async () => {
      const before = await h.state(), exported = await h.request('/api/glove/export').then(r => r.json())
      const files = Object.fromEntries(await Promise.all(commissionKinds.map(async kind => [kind, await read(kind)])))
      const run = await json()
      for (const body of [...Object.values(files), JSON.stringify(run)]) assert.doesNotMatch(body, /confirmed|verified|accepted layout|payment|settled|filed|submitted/i)
      assert.deepEqual(before.payments, [])
      assert.deepEqual(await h.state(), before, 'file and JSON reads change no business data')
      assert.deepEqual(await h.request('/api/glove/export').then(r => r.json()), exported)
      await h.restart()
      assert.deepEqual(await json(), run)
      for (const kind of commissionKinds) assert.equal(await read(kind), files[kind])
      assert.deepEqual(await h.state(), before)
      t.diagnostic('TEAM-006 provider account acceptance remains unrun; Glove pays no one and files nothing. Period ' + commissionRange)
    })
  } finally { await h.close() }
  }

})
