import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, fixedMonthlyReports } from './harness.mjs'

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
})
