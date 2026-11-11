import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, fixedMonthlyReports } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

// Read whole RFC 4180 records, including commas in customer and service names.
function csv(text) {
  const rows = [], pattern = /(?:^|,|\r?\n)(?:"((?:[^"]|"")*)"|([^",\r\n]*))/g
  let row = [], match
  while ((match = pattern.exec(text.trimEnd()))) {
    if (match[0].startsWith('\n') || match[0].startsWith('\r')) { rows.push(row); row = [] }
    row.push(match[1] === undefined ? match[2] : match[1].replaceAll('""', '"'))
    if (!match[0].length) pattern.lastIndex++
  }
  if (row.length) rows.push(row)
  return rows
}
const sorted = rows => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
const basis = late => 'fixed monthly period end; terms frozen at first approval' + (late ? '; approved after period end, due from approval date' : '')
const ordinaryBasis = 'terms frozen at first approval'
const money = cents => (cents / 100).toFixed(2)
const usDate = date => `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`

// DATA-010 point 3: Activity and the business export, read as the owner would.
const trail = async h => {
  const activity = await h.request('/api/glove/activity'), exported = await h.request('/api/glove/export')
  assert.equal(activity.status, 200); assert.equal(exported.status, 200)
  const { exportedAt, ...rest } = await exported.json()
  return { activity: (await activity.json()).events, exported: rest }
}
const entries = (r, kind, subjectId) => r.activity.filter(e => e.kind === kind && (!subjectId || e.subjectId === subjectId))
const unchangedBy = r => ({ activity: r.activity, timeline: r.exported.timeline, invoices: r.exported.invoices })
// One attributable Activity entry and its business-export timeline row name the actor, the instant and the command.
function assertEntry(r, event, who, at, commandId) {
  assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at], [who.id, who.name, who.role, at])
  if (commandId) assert.equal(event.commandId, commandId)
  const row = r.exported.timeline.filter(e => e.id === event.id)
  assert.equal(row.length, 1, 'the business export timeline keeps the entry once')
  assert.deepEqual([row[0].actor_id, row[0].actor_name, row[0].actor_role, row[0].at, row[0].command_id, row[0].summary], [who.id, who.name, who.role, at, event.commandId, event.summary])
}
const readPath = async (h, path) => {
  const response = await h.request(path)
  assert.equal(response.status, 200, await response.clone().text())
  return path.includes('.csv') ? csv(await response.text()) : response.json()
}
const exportedInvoice = (r, id) => r.exported.invoices.find(i => i.id === id)
const monthlyDates = (issuedOn, approvedOn, dueOn, late) => ({ issuedOn, approvedOn, dueOn, termsDays: 14, basis: basis(late), approvedAfterPeriodEnd: late })
async function pacificMonthly(h, b, title) {
  const tech = await h.command('technician.save', { name: title, branchId: b.branch.id })
  const job = await h.command('job.create', { customerId: b.branchCustomer.id, siteId: b.branchSite.id, title, lines: [b.line('60.00')] })
  return h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-16', rule: { unit: 'month', interval: 3 }, technicianId: tech.id, start: '09:00', end: '10:00', horizonDays: 365, until: '2025-03-31', billing: { mode: 'fixed-monthly', lines: [b.line('60.00')] } })
}
// Independently written expectations: [period end, job, approval instant, approval date, due date, approved after period end].
const builderApprovals = [
  ['2025-01-31', 'onTime', '2025-01-31T06:00:00.000Z', '2025-01-31', '2025-02-14', false], ['2025-01-31', 'late', '2025-02-03T06:30:00.000Z', '2025-02-03', '2025-02-17', true], ['2025-01-31', 'pacific', '2025-02-03T06:30:00.000Z', '2025-02-02', '2025-02-16', true],
  ['2025-02-28', 'onTime', '2025-02-28T06:00:00.000Z', '2025-02-28', '2025-03-14', false], ['2025-02-28', 'late', '2025-03-03T06:30:00.000Z', '2025-03-03', '2025-03-17', true], ['2025-02-28', 'pacific', '2025-03-03T06:30:00.000Z', '2025-03-02', '2025-03-16', true],
  ['2025-03-31', 'onTime', '2025-03-31T05:00:00.000Z', '2025-03-31', '2025-04-14', false], ['2025-03-31', 'late', '2025-04-03T05:30:00.000Z', '2025-04-03', '2025-04-17', true], ['2025-03-31', 'pacific', '2025-04-03T05:30:00.000Z', '2025-04-02', '2025-04-16', true],
]

test('REPORT-004 fixed-monthly reports freeze three local period ends across approval, correction, export and Worker restart', async t => {
  const h = await installation({ at: '2026-11-08T12:00:00.000Z' }); t.after(() => h.close())
  const b = await fixedMonthlyReports(h)
  const get = async path => {
    const response = await h.request(path, { as: b.office.cookie })
    assert.equal(response.status, 200, await response.clone().text())
    return path.includes('.csv') ? csv(await response.text()) : response.json()
  }
  const snapshot = async () => { const s = await h.state(); return { invoices: s.invoices, jobs: s.jobs, exports: s.exports, approvals: s.approvals, events: s.events, payments: s.payments, notices: s.notices } }
  const reportPath = (kind, ext, from, to, filter = '') => `/api/glove/reports/${kind}.${ext}?from=${from}&to=${to}${filter}`
  const lateRow = x => ({ invoiceId: x.invoice.id, number: x.invoice.number, issuedOn: x.issuedOn, approvedOn: x.approvedOn, dueOn: x.dueOn, label: 'approved after period end' })
  const expectedBasis = x => x.period ? basis(x.kind !== 'onTime') : ordinaryBasis
  const frozen = new Map()
  assert.equal(b.earlyRefusals.length, 3)
  assert.equal(b.proposed.length, 12)
  assert.equal(b.approved.length, 11)
  for (const x of b.approved) {
    const inv = x.invoice, approval = { id: b.office.id, name: 'Riley Reports', role: 'office', at: x.approvedAt }
    assert.deepEqual(inv.dates, { issuedOn: x.issuedOn, dueOn: x.dueOn, termsDays: 14, basis: expectedBasis(x), ...(x.period ? { approvedOn: x.approvedOn, approvedAfterPeriodEnd: x.kind !== 'onTime' } : {}) })
    assert.deepEqual(inv.revisions[0].approval, approval)
    if (x.kind !== 'ordinary') assert.deepEqual(inv.approvalAt, approval)
    assert.equal(inv.revisions[0].totals.subtotal, x.price)
    assert.equal(inv.revisions[0].totals.total, x.gross)
    frozen.set(inv.id, { dates: inv.dates, approval: inv.revisions[0].approval, approvalAt: inv.approvalAt })
  }
  const drafts = (await h.state()).invoices.filter(i => i.jobId === b.unapproved.id)
  assert.equal(drafts.length, 3)
  for (const draft of drafts) { assert.equal(draft.dates, undefined); assert.equal(draft.revisions[0].approval, null) }
  const assertReports = async (from, to, expected, filter = '', corrected = false) => {
    const rev = await get(reportPath('revenue', 'json', from, to, filter)), tax = await get(reportPath('tax', 'json', from, to, filter))
    const late = expected.filter(x => x.period && x.kind !== 'onTime').map(lateRow)
    const amount = x => Math.round(Number(corrected && x.invoice.id === b.approved.find(a => a.kind === 'late').invoice.id ? '150.00' : x.price) * 100)
    const sum = list => money(list.reduce((n, x) => n + amount(x), 0))
    assert.deepEqual(rev.total, { invoices: expected.length, revenue: sum(expected) })
    assert.deepEqual(sorted(rev.approvedAfterPeriodEnd ?? []), sorted(late))
    assert.deepEqual(sorted(tax.approvedAfterPeriodEnd ?? []), sorted(late))
    assert.equal(tax.basis, 'tax on approved invoices; Glove records no payments yet')
    const months = [...new Set(expected.map(x => x.issuedOn.slice(0, 7)))].sort()
    const byMonth = months.map(month => { const list = expected.filter(x => x.issuedOn.startsWith(month)); return { month, invoices: list.length, revenue: sum(list) } })
    assert.deepEqual(rev.byMonth, byMonth)
    assert.deepEqual(rev.byJobType, expected.length ? [{ type: 'Uncategorized', invoices: expected.length, revenue: sum(expected) }] : [])
    const branchRows = [['Main business', expected.filter(x => x.kind !== 'pacific')], ['Pacific branch', expected.filter(x => x.kind === 'pacific')]].filter(([, list]) => list.length)
    assert.deepEqual(rev.byBranch, branchRows.map(([branch, list]) => ({ branchId: branch === 'Main business' ? 'main' : b.branch.id, branch, invoices: list.length, revenue: sum(list) })))
    const expectedTax = branchRows.map(([branch, list]) => ({ branchId: branch === 'Main business' ? null : b.branch.id, branch, jurisdictionId: 'synthetic-glove-monthly-tax', jurisdiction: 'Local sales tax', invoices: list.length, taxable: sum(list), tax: money(list.reduce((n, x) => n + amount(x) / 10, 0)), byMonth: months.filter(m => list.some(x => x.issuedOn.startsWith(m))).map(month => { const part = list.filter(x => x.issuedOn.startsWith(month)); return { month, invoices: part.length, tax: money(part.reduce((n, x) => n + amount(x) / 10, 0)) } }) }))
    assert.deepEqual(sorted(tax.jurisdictions), sorted(expectedTax))
    const lateText = x => `${x.invoice.number}: issued ${x.issuedOn}; approved ${x.approvedOn}; due ${x.dueOn}`
    assert.deepEqual(sorted(await get(reportPath('revenue', 'csv', from, to, filter))), sorted([
      ['group', 'key', 'invoices', 'revenue'], ...byMonth.map(m => ['month', m.month, String(m.invoices), m.revenue]),
      ...(expected.length ? [['job type', 'Uncategorized', String(expected.length), sum(expected)]] : []), ...branchRows.map(([branch, list]) => ['branch', branch, String(list.length), sum(list)]),
      ['total', '', String(expected.length), sum(expected)], ...expected.filter(x => x.period && x.kind !== 'onTime').map(x => ['approved after period end', lateText(x), '', '']),
    ]))
    assert.deepEqual(sorted(await get(reportPath('tax', 'csv', from, to, filter))), sorted([
      ['branch', 'jurisdiction', 'month', 'invoices', 'tax'], ...expectedTax.flatMap(j => [...j.byMonth.map(m => [j.branch, j.jurisdiction, m.month, String(m.invoices), m.tax]), [j.branch, j.jurisdiction, 'total', String(j.invoices), j.tax]]),
      ...expected.filter(x => x.period && x.kind !== 'onTime').map(x => ['approved after period end', x.invoice.number, `issued ${x.issuedOn}; approved ${x.approvedOn}; due ${x.dueOn}`, '', '']),
    ]))
  }
  // Both ends included, even though late approvals happened in the next month.
  for (const p of b.periods) {
    const endRows = b.approved.filter(x => x.issuedOn === p.end)
    await assertReports(p.end, p.end, endRows)
    await assertReports(p.end, p.end, endRows.filter(x => x.kind === 'pacific'), `&branchId=${b.branch.id}`)
    await assertReports(p.end, p.end, endRows.filter(x => x.kind !== 'pacific'), '&branchId=main')
  }
  await assertReports('2025-01-31', '2025-03-31', b.approved)
  await assertReports('2025-02-01', '2025-02-03', b.approved.filter(x => !x.period))
  await assertReports('2025-04-01', '2025-04-30', [])
  const inspect = async () => {
    const collected = []
    for (const asOf of ['2025-01-30', '2025-01-31', '2025-02-02', '2025-02-14', '2025-02-17', '2025-03-17', '2025-04-17', '2025-07-17']) {
      const aging = await get(`/api/glove/reports/receivables.json?asOf=${asOf}`)
      const expected = b.approved.filter(x => x.approvedOn <= asOf)
      const rows = aging.customers.flatMap(c => c.invoices)
      assert.equal(rows.length, expected.length, 'drafts and approvals after the as-of date are excluded')
      for (const x of expected) {
        const row = rows.find(i => i.id === x.invoice.id)
        const days = Math.max(0, (Date.parse(asOf) - Date.parse(x.dueOn)) / 86_400_000)
        const bucket = days === 0 ? 'current' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : 'over90'
        assert.deepEqual([row.issuedOn, row.dueOn, row.basis, row.daysPastDue, row.bucket, row.balance], [x.issuedOn, x.dueOn, expectedBasis(x), days, bucket, x.gross])
      }
      const agingCsv = await get(`/api/glove/reports/receivables.csv?asOf=${asOf}`)
      assert.deepEqual(agingCsv, [['Customer', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Date basis', 'Days past due', 'Bucket', 'Balance', 'Reminder state', 'Invoice link'], ...rows.map(i => [i.customer, 'USD', i.number, '1', i.issuedOn, i.dueOn, i.basis, String(i.daysPastDue), i.bucket, i.balance, 'No reminders scheduled', i.href])])
      for (const customer of [b.customer, b.branchCustomer]) {
        const statement = await get(`/api/glove/customers/${customer.id}/statement.json?asOf=${asOf}`)
        const list = expected.filter(x => x.invoice.customerId === customer.id)
        assert.deepEqual(statement.invoices.map(i => i.id).sort(), list.map(x => x.invoice.id).sort())
        for (const x of list) {
          const i = statement.invoices.find(i => i.id === x.invoice.id)
          assert.deepEqual([i.issuedOn, i.dueOn, i.basis, i.total, i.paid, i.due, i.balance], [x.issuedOn, x.dueOn, expectedBasis(x), x.gross, '0.00', x.gross, x.gross])
        }
        const statementCsv = await get(`/api/glove/customers/${customer.id}/statement.csv?asOf=${asOf}`)
        assert.deepEqual(statementCsv, [['Customer', 'As of', 'Currency', 'Invoice', 'Revision', 'Issued', 'Due', 'Total', 'Confirmed net payments', 'Amount due', 'Credit', 'Balance', 'Basis'], ...statement.invoices.map(i => [customer.name, asOf, 'USD', i.number, '1', i.issuedOn, i.dueOn, i.total, '0.00', i.due, '0.00', i.balance, i.basis])])
        collected.push(statement, statementCsv)
      }
      collected.push(aging, agingCsv)
    }
    return collected
  }
  const readings = await inspect()
  const accounting = await b.office.run('invoice.export', {})
  const accountingPath = `/api/glove/exports/${accounting.id}.csv`, accountingRows = await get(accountingPath)
  const exportHeader = ['*ContactName', 'EmailAddress', 'POAddressLine1', '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType', 'Currency', 'Branch', 'TaxJurisdiction', 'TaxRate', 'DocumentTaxableSubtotal', 'DocumentTaxAmount', 'DocumentTotal']
  assert.deepEqual(accountingRows[0], exportHeader)
  assert.equal(accountingRows.length, 12)
  for (const row of accountingRows.slice(1)) {
    const x = b.approved.find(x => x.invoice.number === row[3])
    assert.ok(x, 'no unapproved invoice is exported')
    assert.deepEqual(row, [x.kind === 'pacific' ? b.branchCustomer.name : b.customer.name, '', x.kind === 'pacific' ? '' : '120 Main Street', x.invoice.number, x.invoice.jobId === b.ordinary.id ? b.ordinary.number : (await h.state()).jobs.find(j => j.id === x.invoice.jobId).number, usDate(x.issuedOn), usDate(x.dueOn), 'Monthly, preventive service', '1', x.price, '200', 'Local sales tax', 'USD', x.kind === 'pacific' ? 'Pacific branch' : 'Main business', 'Local sales tax', '10', x.price, money(Math.round(Number(x.price) * 10)), x.gross])
  }
  const qboPath = x => `/api/glove/invoices/${x.invoice.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`
  const qbo = []
  for (const x of b.approved) {
    const doc = await get(qboPath(x))
    assert.deepEqual([doc.TxnDate, doc.DueDate, doc.DocNumber, doc.Line[0].Amount, doc.TxnTaxDetail.TotalTax], [x.issuedOn, x.dueOn, x.invoice.number, Number(x.price), Number(x.price) / 10])
    qbo.push(doc)
  }
  const beforeReads = await snapshot()
  await h.restart()
  assert.deepEqual(await snapshot(), beforeReads)
  assert.deepEqual(await inspect(), readings)
  assert.deepEqual(await get(accountingPath), accountingRows)
  for (const [i, x] of b.approved.entries()) assert.deepEqual(await get(qboPath(x)), qbo[i])
  await assertReports('2025-01-31', '2025-03-31', b.approved)
  assert.deepEqual(await snapshot(), beforeReads, 'inspection and restart cause no financial or messaging effect')
  // Current report permission and branch scope apply to both representations.
  const noReports = await h.person('Casey Restricted', 'viewer')
  await h.command('role.save', { name: 'Records only', permissions: ['customer.save'] }).then(role => h.command('role.set', { operatorId: noReports.id, role: `custom:${role.id}` }))
  const scoped = await h.person('Pacific Office', 'office')
  await h.command('branch.limit', { operatorId: scoped.id, branchId: b.branch.id })
  const beforeRefusals = await snapshot()
  for (const kind of ['revenue', 'tax', 'receivables']) for (const ext of ['json', 'csv']) {
    const path = kind === 'receivables' ? `/api/glove/reports/${kind}.${ext}?asOf=2025-04-17` : reportPath(kind, ext, '2025-01-31', '2025-03-31')
    for (const as of ['', b.field.cookie, noReports.cookie]) assert.equal((await h.request(path, { as })).status, as ? 403 : 401)
    assert.equal((await h.request(path + '&branchId=main', { as: scoped.cookie })).status, 404)
  }
  for (const ext of ['json', 'csv']) assert.equal((await h.request(`/api/glove/customers/${b.customer.id}/statement.${ext}?asOf=2025-04-17`, { as: scoped.cookie })).status, 404)
  assert.deepEqual(await snapshot(), beforeRefusals, 'refused report reads write nothing')
  const token = await h.command('token.issue', { name: 'Report inspector', role: 'office', branchId: b.branch.id })
  const tokenPath = reportPath('revenue', 'json', '2025-01-31', '2025-03-31')
  const headers = { authorization: 'Bearer ' + token.token }
  const authorized = await h.request(tokenPath, { headers })
  assert.equal(authorized.status, 200)
  assert.deepEqual((await authorized.json()).total, { invoices: 3, revenue: '240.00' })
  await h.command('token.revoke', { tokenId: token.id })
  const revokedState = await snapshot()
  for (const ext of ['json', 'csv']) assert.equal((await h.request(reportPath('revenue', ext, '2025-01-31', '2025-03-31'), { headers })).status, 401)
  assert.deepEqual(await snapshot(), revokedState, 'revoked credentials cannot read or change report records')
  // A business terms change and a corrected price affect no frozen date.
  await h.setTime('2025-04-10T16:00:00.000Z')
  await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 })
  const target = b.approved.find(x => x.kind === 'late'), current = (await h.state()).invoices.find(i => i.id === target.invoice.id)
  const correction = await b.office.run('invoice.correct', { invoiceId: current.id, version: current.version, reason: 'Office corrected the service price', lines: [b.line('150.00')] })
  await assertReports('2025-01-31', '2025-03-31', b.approved)
  await b.office.run('invoice.approve', { invoiceId: correction.id, version: correction.version, revision: 2 })
  await assertReports('2025-01-31', '2025-03-31', b.approved, '', true)
  const laterExport = await b.office.run('invoice.export', {})
  const correctionRows = await get(`/api/glove/exports/${laterExport.id}.csv`)
  assert.deepEqual(correctionRows[0], exportHeader)
  assert.equal(correctionRows.length, 2)
  assert.deepEqual(correctionRows[1].slice(3, 4), [target.invoice.number + '-R2'])
  assert.deepEqual(correctionRows[1].slice(5, 7), ['01/31/2025', '02/17/2025'])
  assert.equal(correctionRows[1][9], '150.00')
  assert.deepEqual(await get(accountingPath), accountingRows, 'the earlier accounting export is immutable')
  for (const x of b.approved) {
    const inv = (await h.state()).invoices.find(i => i.id === x.invoice.id)
    assert.deepEqual({ dates: inv.dates, approval: inv.revisions[0].approval, approvalAt: inv.approvalAt }, frozen.get(inv.id))
    const doc = await get(qboPath(x))
    assert.deepEqual([doc.TxnDate, doc.DueDate], [x.issuedOn, x.dueOn])
    const statement = await get(`/api/glove/customers/${inv.customerId}/statement.json?asOf=2025-04-17`)
    const row = statement.invoices.find(i => i.id === inv.id)
    assert.deepEqual([row.issuedOn, row.dueOn, row.basis], [x.issuedOn, x.dueOn, expectedBasis(x)])
  }
  const terminal = await snapshot()
  await h.restart()
  assert.deepEqual(await snapshot(), terminal)
  await assertReports('2025-01-31', '2025-03-31', b.approved, '', true)
  assert.deepEqual((await h.state()).payments, [])
  assert.equal(h.stripePayments.calls.length, 0)
  assert.equal(h.email.sent.length, 0)
  assert.equal(h.twilio.calls.length, 0)
  assert.equal(h.outbound.attempts, h.mails.length, 'only native invitation mail touches the network; reports, cron and exports call no provider')
  assert.ok(!terminal.events.some(e => /payment\.|dunning|receipt|message\.sent/.test(e.kind)))

  await scenario(t, 'DATA-010 point 3: approvals at and after each local period end record who and when in Activity and the export while the frozen dates stay independently exact', async t => {
    const h = await installation({ at: '2026-11-08T12:00:00.000Z' }); t.after(() => h.close())
    const second = await h.person('Morgan Approver', 'office')
    const b = await fixedMonthlyReports(h)
    const readMonthly = async job => (await h.state()).invoices.filter(i => i.jobId === job.id)
    const riley = { id: b.office.id, name: 'Riley Reports', role: 'office' }, morgan = { id: second.id, name: 'Morgan Approver', role: 'office' }
    // Builder approvals in the business zone and in the Pacific branch, whose local date differs from the UTC date.
    const afterBuilder = await trail(h)
    for (const [end, key, at, approvedOn, dueOn, late] of builderApprovals) {
      const inv = (await readMonthly(b[key])).find(i => i.recurring.periodEnd === end)
      const [event] = entries(afterBuilder, 'invoice.approved', inv.id)
      assert.equal(entries(afterBuilder, 'invoice.approved', inv.id).length, 1)
      assertEntry(afterBuilder, event, riley, at)
      assert.deepEqual(exportedInvoice(afterBuilder, inv.id).dates, monthlyDates(end, approvedOn, dueOn, late))
      assert.deepEqual(exportedInvoice(afterBuilder, inv.id).approvalAt, { ...riley, at })
    }
    // A fourth Pacific series: exactly at, one millisecond before and after the local period end, approved by a second person.
    await h.setTime('2025-01-01T16:00:00.000Z')
    const pac = await pacificMonthly(h, b, 'Boundary Pacific service')
    const cases = [
      { p: b.periods[0], early: '2025-01-31T07:59:59.999Z', at: '2025-02-01T07:30:00.000Z', by: second, who: morgan, dates: monthlyDates('2025-01-31', '2025-01-31', '2025-02-14', false) },
      { p: b.periods[1], at: '2025-02-28T08:00:00.000Z', by: b.office, who: riley, dates: monthlyDates('2025-02-28', '2025-02-28', '2025-03-14', false) },
      { p: b.periods[2], early: '2025-03-31T06:59:59.999Z', at: '2025-04-02T06:30:00.000Z', by: second, who: morgan, dates: monthlyDates('2025-03-31', '2025-04-01', '2025-04-15', true) },
    ]
    const agingIds = async () => (await readPath(h, `/api/glove/reports/receivables.json?asOf=2025-12-31`)).customers.flatMap(c => c.invoices.map(i => i.id))
    const reports = async end => ({ revenue: (await readPath(h, `/api/glove/reports/revenue.json?from=${end}&to=${end}`)).total, tax: (await readPath(h, `/api/glove/reports/tax.json?from=${end}&to=${end}`)).jurisdictions.find(j => j.branch === 'Pacific branch') })
    const commands = []
    for (const c of cases) {
      await h.setTime(c.p.cron); await h.scheduled(c.p.cron)
      const draft = (await readMonthly(pac)).find(x => x.recurring.periodEnd === c.p.end)
      assert.equal(draft.status, 'draft')
      const generated = await trail(h)
      assert.equal(entries(generated, 'invoice.prepared', draft.id).length, 1, 'the generated draft appears in Activity with its generation event')
      assert.equal(entries(generated, 'invoice.approved', draft.id).length, 0)
      assert.ok(!(await agingIds()).includes(draft.id), 'a draft is never in aging')
      const before = await reports(c.p.end)
      assert.deepEqual(before.revenue, { invoices: 3, revenue: '440.00' })
      assert.deepEqual([before.tax.invoices, before.tax.taxable, before.tax.tax], [1, '80.00', '8.00'], 'a draft is never in revenue or tax')
      if (c.early) {
        await h.setTime(c.early)
        const refused = await trail(h)
        await c.by.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 }, { error: 'BILLING_EARLY' })
        assert.deepEqual(unchangedBy(await trail(h)), unchangedBy(refused), 'an early approval adds no Activity entry, timeline row or export change')
      }
      await h.setTime(c.at)
      const commandId = randomUUID(), payload = { invoiceId: draft.id, version: draft.version, revision: 1 }
      const result = await c.by.run('invoice.approve', payload, { commandId })
      commands.push({ c, commandId, payload, result })
      const r = await trail(h), [event] = entries(r, 'invoice.approved', draft.id)
      assert.equal(entries(r, 'invoice.approved', draft.id).length, 1)
      assertEntry(r, event, c.who, c.at, commandId)
      assert.deepEqual(exportedInvoice(r, draft.id).dates, c.dates)
      assert.deepEqual(exportedInvoice(r, draft.id).approvalAt, { ...c.who, at: c.at })
      assert.ok((await agingIds()).includes(draft.id), 'approval puts the invoice into aging')
      const after = await reports(c.p.end)
      assert.deepEqual(after.revenue, { invoices: 4, revenue: '500.00' })
      assert.deepEqual([after.tax.invoices, after.tax.taxable, after.tax.tax], [2, '140.00', '14.00'])
    }
    // Generated drafts that nobody approves stay in Activity only, even after an early try in every period.
    const waiting = await readMonthly(b.unapproved)
    assert.equal(waiting.length, 3)
    for (const draft of waiting) {
      const p = b.periods.find(p => p.end === draft.recurring.periodEnd)
      await h.setTime(p.before)
      const before = await trail(h)
      await b.office.run('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 }, { error: 'BILLING_EARLY' })
      const after = await trail(h)
      assert.deepEqual(unchangedBy(after), unchangedBy(before))
      assert.equal(entries(after, 'invoice.prepared', draft.id).length, 1)
      assert.equal(entries(after, 'invoice.approved', draft.id).length, 0)
      assert.ok(!(await agingIds()).includes(draft.id))
    }
    const revenue = await readPath(h, '/api/glove/reports/revenue.json?from=2025-01-31&to=2025-03-31')
    assert.deepEqual(revenue.total, { invoices: 14, revenue: '1580.00' }, 'revenue counts only approved invoices')
    // Command replay, repeated cron passes and an actual Worker restart add and change nothing, and nothing is collected.
    await h.setTime('2025-04-10T16:00:00.000Z')
    const settled = { trail: unchangedBy(await trail(h)), state: await h.state() }, calls = h.outbound.attempts
    for (const x of commands) assert.deepEqual(await x.c.by.run('invoice.approve', x.payload, { commandId: x.commandId }), x.result)
    for (let pass = 0; pass < 3; pass++) await h.scheduled('2025-04-10T16:00:00.000Z')
    await h.restart()
    for (const x of commands) assert.deepEqual(await x.c.by.run('invoice.approve', x.payload, { commandId: x.commandId }), x.result)
    assert.deepEqual({ trail: unchangedBy(await trail(h)), state: await h.state() }, settled)
    assert.deepEqual(settled.state.payments, [])
    assert.deepEqual(settled.state.notices, [])
    assert.ok(!settled.state.events.some(e => /payment\.|charge|dunning|receipt|message\.sent/.test(e.kind)))
    assert.equal(h.stripePayments.calls.length, 0)
    assert.equal(h.email.sent.length, 0)
    assert.equal(h.twilio.calls.length, 0)
    assert.equal(h.outbound.attempts, calls)
    assert.equal(h.outbound.attempts, h.mails.length, 'only native invitations touch the network')
  })

  await scenario(t, 'DATA-010 point 3: a terms change, a correction and a later export each add their own attributable entry while every frozen date stays unchanged', async t => {
    const h = await installation({ at: '2026-11-08T12:00:00.000Z' }); t.after(() => h.close())
    const b = await fixedMonthlyReports(h)
    const riley = { id: b.office.id, name: 'Riley Reports', role: 'office' }
    const frozenDates = new Map()
    const same = async label => {
      const r = await trail(h)
      for (const [id, dates] of frozenDates) assert.deepEqual(exportedInvoice(r, id).dates, dates, label)
      return r
    }
    const start = await trail(h)
    for (const [end, key, , approvedOn, dueOn, late] of builderApprovals) {
      const inv = (await h.state()).invoices.find(i => i.jobId === b[key].id && i.recurring.periodEnd === end)
      assert.deepEqual(exportedInvoice(start, inv.id).dates, monthlyDates(end, approvedOn, dueOn, late))
      frozenDates.set(inv.id, monthlyDates(end, approvedOn, dueOn, late))
    }
    const target = (await h.state()).invoices.find(i => i.jobId === b.late.id && i.recurring.periodEnd === '2025-01-31')
    const owner = { id: start.activity.find(e => e.kind === 'business.saved').actorId, name: 'Olivia Owner', role: 'owner' }
    const at = '2025-04-10T16:00:00.000Z', exportedBefore = entries(start, 'invoice.exported').length
    await h.setTime(at)
    // The first accounting export.
    const first = randomUUID()
    await b.office.run('invoice.export', {}, { commandId: first })
    let r = await same('an export leaves every frozen date')
    const exportedNow = entries(r, 'invoice.exported').filter(e => e.commandId === first)
    assert.equal(entries(r, 'invoice.exported').length - exportedBefore, exportedNow.length)
    assert.equal(exportedNow.length, frozenDates.size + 2, 'each approved invoice, ordinary and per-visit included, gets its own entry')
    for (const e of exportedNow) assertEntry(r, e, riley, at, first)
    assert.ok(exportedNow.some(e => e.subjectId === target.id))
    // A business payment-terms change.
    const terms = randomUUID(), saved = entries(r, 'business.saved').length
    await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 }, { commandId: terms })
    r = await same('a terms change leaves every frozen date')
    assert.equal(entries(r, 'business.saved').length, saved + 1)
    assertEntry(r, entries(r, 'business.saved').find(e => e.commandId === terms), owner, at, terms)
    assert.equal(exportedInvoice(r, target.id).dates.termsDays, 14)
    // An invoice.correct on the exported late approval.
    const current = (await h.state()).invoices.find(i => i.id === target.id), correct = randomUUID()
    const corrected = await b.office.run('invoice.correct', { invoiceId: current.id, version: current.version, reason: 'Office corrected the service price', lines: [b.line('150.00')] }, { commandId: correct })
    r = await same('a correction leaves every frozen date')
    assert.equal(entries(r, 'invoice.corrected', target.id).length, 1)
    assertEntry(r, entries(r, 'invoice.corrected', target.id)[0], riley, at, correct)
    // Approving the correction is its own entry; the first approval instant and every date are kept.
    const reapprove = randomUUID()
    await b.office.run('invoice.approve', { invoiceId: corrected.id, version: corrected.version, revision: 2 }, { commandId: reapprove })
    r = await same('re-approving the correction leaves every frozen date')
    assert.equal(entries(r, 'invoice.approved', target.id).length, 2)
    assertEntry(r, entries(r, 'invoice.approved', target.id).find(e => e.commandId === reapprove), riley, at, reapprove)
    assert.equal(exportedInvoice(r, target.id).approvalAt.at, '2025-02-03T06:30:00.000Z', 'the first approval instant stays frozen')
    // A later export carries the correction under the original dates.
    const later = randomUUID()
    const laterExport = await b.office.run('invoice.export', {}, { commandId: later })
    r = await same('a later export leaves every frozen date')
    const laterEntries = entries(r, 'invoice.exported').filter(e => e.commandId === later)
    assert.equal(laterEntries.length, 1)
    assert.equal(laterEntries[0].subjectId, target.id)
    assertEntry(r, laterEntries[0], riley, at, later)
    const rows = await readPath(h, `/api/glove/exports/${laterExport.id}.csv`)
    assert.deepEqual([rows[1][3], rows[1][5], rows[1][6], rows[1][9]], [target.number + '-R2', '01/31/2025', '02/17/2025', '150.00'])
    const terminal = await h.state()
    assert.deepEqual(terminal.payments, [])
    assert.ok(!terminal.events.some(e => /payment\.|charge|dunning|receipt|message\.sent/.test(e.kind)))
    assert.equal(h.stripePayments.calls.length, 0)
    assert.equal(h.email.sent.length, 0)
    assert.equal(h.twilio.calls.length, 0)
    assert.equal(h.outbound.attempts, h.mails.length)
  })

  await scenario(t, 'DATA-010 point 3: a fixed-monthly invoice approved by a pre-PLAN-013 build keeps its approval-date basis in its exported record and Activity after the upgrade', async t => {
    let legacy = false
    const h = await installation({ at: '2026-11-08T12:00:00.000Z', workerPlugins: [{ name: 'pre-monthly-date-approval', setup(build) {
      build.onLoad({ filter: /\/commands\/invoices\.ts$/ }, async args => {
        if (!legacy) return
        // The earlier approval writer kept the revision's approval only. Produce its records by approving
        // through the earlier Worker build, never by editing D1.
        let source = await readFile(args.path, 'utf8')
        source = source.replace(/      const monthly = inv\.recurring\?\.mode === 'fixed-monthly'\n[\s\S]*?(?=      const row = bump\(c\.s, 'invoices', inv, \{ status: 'approved')/, "      const approvalAt = { ...who(c), at: c.now }\n")
        source = source.replace("status: 'approved', dates, ...(inv.recurring && !inv.approvalAt ? { approvalAt } : {}),", "status: 'approved',")
        return { contents: source, loader: 'ts', resolveDir: dirname(args.path) }
      })
    } }] }); t.after(() => h.close())
    const b = await fixedMonthlyReports(h)
    legacy = true
    await h.restart({ rebuild: true })
    await h.setTime('2025-01-01T16:00:00.000Z')
    const earlier = await pacificMonthly(h, b, 'Earlier Pacific monthly'), later = await pacificMonthly(h, b, 'Upgraded Pacific monthly')
    await h.setTime('2025-01-31T08:00:00.000Z'); await h.scheduled('2025-01-31T08:00:00.000Z')
    const draft = async job => (await h.state()).invoices.find(i => i.jobId === job.id)
    const at = '2025-02-03T06:30:00.000Z', riley = { id: b.office.id, name: 'Riley Reports', role: 'office' }
    await h.setTime(at)
    const old = await draft(earlier), commandId = randomUUID()
    await b.office.run('invoice.approve', { invoiceId: old.id, version: old.version, revision: 1 }, { commandId })
    const before = await trail(h), [event] = entries(before, 'invoice.approved', old.id)
    assertEntry(before, event, riley, at, commandId)
    assert.equal(exportedInvoice(before, old.id).dates, undefined, 'the earlier build froze no monthly dates')
    assert.equal(exportedInvoice(before, old.id).approvalAt, undefined)
    assert.deepEqual(exportedInvoice(before, old.id).revisions[0].approval, { ...riley, at })
    const output = await b.office.run('invoice.export', {})
    const paths = ['/api/glove/reports/receivables.json?asOf=2025-02-17', '/api/glove/reports/revenue.json?from=2025-02-02&to=2025-02-02', `/api/glove/exports/${output.id}.csv`, `/api/glove/invoices/${old.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`]
    const readings = await Promise.all(paths.map(path => readPath(h, path)))
    const aging = readings[0].customers.flatMap(c => c.invoices).find(i => i.id === old.id)
    assert.deepEqual([aging.issuedOn, aging.dueOn, aging.basis], ['2025-02-02', '2025-02-16', 'due date computed from first approval and current terms'])
    assert.deepEqual(readings[2].find(row => row[3] === old.number).slice(5, 7), ['02/02/2025', '02/16/2025'])
    const settled = await trail(h), calls = h.outbound.attempts
    // Upgrade to the current build: nothing earlier changes, and only new approvals use the period-end dates.
    legacy = false
    await h.restart({ rebuild: true })
    assert.deepEqual(await trail(h), settled, 'the upgrade adds no event and changes no earlier record')
    assert.deepEqual(await Promise.all(paths.map(path => readPath(h, path))), readings, 'the earlier approval keeps its approval-date reports and downloads')
    await h.scheduled(at)
    assert.deepEqual(await trail(h), settled)
    const fresh = await draft(later)
    await b.office.run('invoice.approve', { invoiceId: fresh.id, version: fresh.version, revision: 1 })
    const upgraded = await trail(h)
    assert.deepEqual(exportedInvoice(upgraded, fresh.id).dates, monthlyDates('2025-01-31', '2025-02-02', '2025-02-16', true), 'a new approval on the upgraded build uses the period end')
    assert.deepEqual(exportedInvoice(upgraded, old.id), exportedInvoice(settled, old.id), 'the earlier invoice record is untouched by the new approval')
    assert.deepEqual(entries(upgraded, 'invoice.approved', old.id), entries(settled, 'invoice.approved', old.id))
    assert.equal(h.outbound.attempts, calls)
    assert.deepEqual((await h.state()).payments, [])
  })
})
