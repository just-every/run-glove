import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, fixedMonthlyReports, assertTrail } from './harness.mjs'
import { scenario } from '../fixtures/scenario.mjs'

// Parse quoted cells and records so each downloaded row is checked, including
// service descriptions and customer names containing commas.
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
const read = async (h, path) => {
  const r = await h.request(path)
  assert.equal(r.status, 200, await r.clone().text())
  return path.includes('.csv') ? csv(await r.text()) : r.json()
}
const addDays = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10)
const basis = late => 'fixed monthly period end; terms frozen at first approval' + (late ? '; approved after period end, due from approval date' : '')
const usDate = date => `${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`
const ordered = rows => [...rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
const money = cents => (cents / 100).toFixed(2)
const frozen = inv => ({ dates: inv.dates, approvalAt: inv.approvalAt, approval: inv.revisions[0].approval })
const approve = (b, inv, opts) => b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, opts)

async function branchMonthly(h, b, title) {
  const tech = await h.command('technician.save', { name: title, branchId: b.branch.id })
  const job = await h.command('job.create', { customerId: b.branchCustomer.id, siteId: b.branchSite.id, title, lines: [b.line('60.00')] })
  return h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-16', rule: { unit: 'month', interval: 3 }, technicianId: tech.id, start: '09:00', end: '10:00', horizonDays: 365, until: '2025-03-31', billing: { mode: 'fixed-monthly', lines: [b.line('60.00')] } })
}

test('PLAN-013 fixed-monthly dates survive approval boundaries, aging, exports and a legacy Worker upgrade', async t => {
  await scenario(t, 'PLAN-013 local month-end approval freezes exact dates and aging crosses every due-date boundary', async t => {
    const h = await installation({ at: '2026-11-08T12:00:00.000Z' }); t.after(() => h.close())
    const b = await fixedMonthlyReports(h)
    // The existing builder supplies on-time and late Chicago approvals and late
    // Pacific approvals. Add exact Pacific boundaries, using new native drafts.
    await h.setTime('2025-01-01T16:00:00.000Z')
    const pacific = await branchMonthly(h, b, 'Pacific boundary service')
    const monthly = b.approved.filter(x => x.period)
    for (const p of b.periods) {
      const pacificExact = p.end + (p.end === '2025-03-31' ? 'T07:00:00.000Z' : 'T08:00:00.000Z')
      await h.setTime(p.cron); await h.scheduled(p.cron)
      const invoices = (await h.state()).invoices
      for (const [job, exact, price, gross] of [[b.unapproved, p.exact, '999.00', '1098.90'], [pacific, pacificExact, '60.00', '66.00']]) {
        const inv = invoices.find(i => i.jobId === job.id && i.recurring?.periodEnd === p.end)
        assert.ok(inv, 'the actual cron generated the monthly draft')
        for (const at of [new Date(Date.parse(exact) - 86400000).toISOString(), new Date(Date.parse(exact) - 1).toISOString()]) {
          await h.setTime(at)
          const before = await h.state()
          await approve(b, inv, { error: 'BILLING_EARLY' })
          assert.deepEqual(await h.state(), before, 'early approval changes no record, decision or Activity')
        }
        await h.setTime(exact)
        const before = await h.state()
        await b.field.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, { error: 'FORBIDDEN' })
        assert.deepEqual(await h.state(), before, 'a field person cannot approve billing')
        const result = await approve(b, inv)
        monthly.push({ invoice: result, period: p, kind: 'onTime', issuedOn: p.end, approvedOn: p.end, approvedAt: exact, dueOn: p.due, price, gross })
      }
    }
    for (const x of monthly) {
      const approval = { id: b.office.id, name: 'Riley Reports', role: 'office', at: x.approvedAt }
      assert.deepEqual(frozen(x.invoice), { dates: { issuedOn: x.issuedOn, approvedOn: x.approvedOn, dueOn: x.dueOn, termsDays: 14, basis: basis(x.kind !== 'onTime'), approvedAfterPeriodEnd: x.kind !== 'onTime' }, approvalAt: approval, approval })
    }
    // Every invoice is exercised at every cutoff; explicit expected buckets do
    // not borrow the production aging calculation or its boundary conditions.
    for (const x of monthly) for (const [offset, bucket] of [[0, 'current'], [1, '1-30'], [30, '1-30'], [31, '31-60'], [60, '31-60'], [61, '61-90'], [90, '61-90'], [91, 'over90']]) {
      const asOf = addDays(x.dueOn, offset)
      const aging = await read(h, `/api/glove/reports/receivables.json?asOf=${asOf}`)
      const row = aging.customers.flatMap(c => c.invoices).find(i => i.id === x.invoice.id)
      assert.deepEqual([row.issuedOn, row.dueOn, row.daysPastDue, row.bucket, row.balance], [x.issuedOn, x.dueOn, offset, bucket, x.gross])
      const expected = [...monthly, ...b.approved.filter(x => !x.period)].filter(x => x.approvedOn <= asOf)
      const totals = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, over90: 0 }
      for (const item of expected) {
        const days = (Date.parse(asOf) - Date.parse(item.dueOn)) / 86400000
        const key = days < 1 ? 'current' : days < 31 ? '1-30' : days < 61 ? '31-60' : days < 91 ? '61-90' : 'over90'
        totals[key] += Math.round(Number(item.gross) * 100)
      }
      assert.deepEqual(aging.totals, [{ currency: 'USD', buckets: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, money(v)])), total: money(Object.values(totals).reduce((a, n) => a + n, 0)) }])
    }
    for (const p of b.periods) {
      const aging = await read(h, `/api/glove/reports/receivables.json?asOf=${addDays(p.end, -1)}`)
      const rows = aging.customers.flatMap(c => c.invoices)
      for (const x of monthly.filter(x => x.period === p)) assert.ok(!rows.some(i => i.id === x.invoice.id), 'unapproved as-of drafts stay out of aging')
    }
  })

  await scenario(t, 'PLAN-013 frozen issue dates survive every report, correction, replay, cron and Worker restart without collection', async t => {
    const h = await installation({ at: '2026-11-08T12:00:00.000Z' }); t.after(() => h.close())
    const b = await fixedMonthlyReports(h)
    const originals = new Map(b.approved.map(x => [x.invoice.id, frozen(x.invoice)]))
    const report = (kind, ext, from, to) => read(h, `/api/glove/reports/${kind}.${ext}?from=${from}&to=${to}`)
    for (const p of b.periods) {
      const expected = b.approved.filter(x => x.issuedOn === p.end)
      const late = expected.filter(x => x.kind !== 'onTime')
      const lateRows = late.map(x => ({ invoiceId: x.invoice.id, number: x.invoice.number, issuedOn: p.end, approvedOn: x.approvedOn, dueOn: x.dueOn, label: 'approved after period end' }))
      const revenue = await report('revenue', 'json', p.end, p.end), tax = await report('tax', 'json', p.end, p.end)
      assert.deepEqual(revenue.total, { invoices: 3, revenue: '440.00' })
      assert.deepEqual(revenue.byMonth, [{ month: p.end.slice(0, 7), invoices: 3, revenue: '440.00' }])
      for (const result of [revenue, tax]) assert.deepEqual(ordered(result.approvedAfterPeriodEnd), ordered(lateRows))
      assert.deepEqual(ordered(tax.jurisdictions.map(j => [j.branch, j.invoices, j.taxable, j.tax, j.byMonth])), ordered([
        ['Main business', 2, '360.00', '36.00', [{ month: p.end.slice(0, 7), invoices: 2, tax: '36.00' }]],
        ['Pacific branch', 1, '80.00', '8.00', [{ month: p.end.slice(0, 7), invoices: 1, tax: '8.00' }]],
      ]))
      assert.deepEqual(ordered(await report('revenue', 'csv', p.end, p.end)), ordered([
        ['group', 'key', 'invoices', 'revenue'], ['month', p.end.slice(0, 7), '3', '440.00'], ['job type', 'Uncategorized', '3', '440.00'], ['branch', 'Main business', '2', '360.00'], ['branch', 'Pacific branch', '1', '80.00'], ['total', '', '3', '440.00'],
        ...late.map(x => ['approved after period end', `${x.invoice.number}: issued ${p.end}; approved ${x.approvedOn}; due ${x.dueOn}`, '', '']),
      ]))
      assert.deepEqual(ordered(await report('tax', 'csv', p.end, p.end)), ordered([
        ['branch', 'jurisdiction', 'month', 'invoices', 'tax'],
        ...[['Main business', '2', '36.00'], ['Pacific branch', '1', '8.00']].flatMap(([branch, count, amount]) => [[branch, 'Local sales tax', p.end.slice(0, 7), count, amount], [branch, 'Local sales tax', 'total', count, amount]]),
        ...late.map(x => ['approved after period end', x.invoice.number, `issued ${p.end}; approved ${x.approvedOn}; due ${x.dueOn}`, '', '']),
      ]))
    }
    for (const kind of ['revenue', 'tax']) {
      const result = await report(kind, 'json', '2025-04-01', '2025-04-30')
      assert.deepEqual(result.approvedAfterPeriodEnd ?? [], [])
      if (kind === 'revenue') assert.deepEqual(result.total, { invoices: 0, revenue: '0.00' })
      else assert.deepEqual(result.jurisdictions, [])
    }
    const output = await b.office.run('invoice.export', {})
    const outputPath = `/api/glove/exports/${output.id}.csv`, originalRows = await read(h, outputPath)
    assert.equal(originalRows.length, b.approved.length + 1)
    for (const row of originalRows.slice(1)) {
      const x = b.approved.find(x => x.invoice.number === row[3])
      assert.ok(x, 'no proposed invoice is exported')
      assert.deepEqual(row.slice(5, 10), [usDate(x.issuedOn), usDate(x.dueOn), 'Monthly, preventive service', '1', x.price])
    }
    const qboPath = x => `/api/glove/invoices/${x.invoice.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`
    for (const x of b.approved) {
      const doc = await read(h, qboPath(x))
      assert.deepEqual([doc.TxnDate, doc.DueDate, doc.DocNumber, doc.Line[0].Amount], [x.issuedOn, x.dueOn, x.invoice.number, Number(x.price)])
    }
    await h.setTime('2025-04-10T16:00:00.000Z')
    await h.command('business.save', { ...(await h.state()).business[0], paymentTermsDays: 0 })
    const x = b.approved.find(x => x.kind === 'late')
    const current = (await h.state()).invoices.find(i => i.id === x.invoice.id)
    const corrected = await b.office.run('invoice.correct', { invoiceId: current.id, version: current.version, reason: 'Correct the service amount', lines: [b.line('150.00')] })
    const beforeRefusal = await h.state()
    await b.field.run('invoice.approve', { invoiceId: corrected.id, version: corrected.version, revision: 2 }, { error: 'FORBIDDEN' })
    assert.deepEqual(await h.state(), beforeRefusal)
    const commandId = randomUUID(), payload = { invoiceId: corrected.id, version: corrected.version, revision: 2 }
    const approved = await b.office.run('invoice.approve', payload, { commandId })
    const exported = await b.office.run('invoice.export', {})
    const correctionRows = await read(h, `/api/glove/exports/${exported.id}.csv`)
    assert.equal(correctionRows.length, 2)
    assert.deepEqual(correctionRows[1].slice(3, 4), [x.invoice.number + '-R2'])
    assert.deepEqual(correctionRows[1].slice(5, 10), ['01/31/2025', '02/17/2025', 'Monthly, preventive service', '1', '150.00'])
    const terminal = await h.state(), calls = h.outbound.attempts
    for (let pass = 0; pass < 3; pass++) await h.scheduled('2025-04-10T16:00:00.000Z')
    assert.deepEqual(await b.office.run('invoice.approve', payload, { commandId }), approved)
    assert.deepEqual(await h.state(), terminal, 'repeated cron and command replay change no records')
    await h.restart()
    assert.deepEqual(await b.office.run('invoice.approve', payload, { commandId }), approved)
    assert.deepEqual(await h.state(), terminal, 'real Worker restart retains frozen dates and replay custody')
    for (const item of b.approved) {
      const inv = terminal.invoices.find(i => i.id === item.invoice.id)
      assert.deepEqual(frozen(inv), originals.get(inv.id))
      const qbo = await read(h, qboPath(item))
      assert.deepEqual([qbo.TxnDate, qbo.DueDate], [item.issuedOn, item.dueOn])
    }
    assert.deepEqual(await read(h, outputPath), originalRows, 'the earlier accounting download never changes')
    const { activity, exported: businessExport } = await assertTrail(h, ['invoice.prepared', 'invoice.approved', 'invoice.corrected', 'invoice.exported'])
    const approval = activity.filter(e => e.commandId === commandId)
    assert.equal(approval.length, 1)
    assert.deepEqual([approval[0].subjectId, approval[0].actorId, approval[0].actorName, approval[0].actorRole, approval[0].at], [x.invoice.id, b.office.id, 'Riley Reports', 'office', '2025-04-10T16:00:00.000Z'])
    const retained = businessExport.timeline.filter(e => e.command_id === commandId)
    assert.equal(retained.length, 1)
    assert.deepEqual([retained[0].id, retained[0].actor_id, retained[0].at], [approval[0].id, b.office.id, approval[0].at])
    assert.deepEqual(businessExport.invoices, terminal.invoices.map(({ reminderState, ...record }) => record))
    assert.deepEqual(terminal.payments, [])
    assert.deepEqual(terminal.notices, [])
    assert.deepEqual(terminal.messages, [])
    assert.ok(!terminal.events.some(e => /payment\.|charge|dunning|receipt|message\.sent/.test(e.kind)))
    assert.equal(h.stripePayments.calls.length, 0)
    assert.equal(h.email.sent.length, 0)
    assert.equal(h.twilio.calls.length, 0)
    assert.equal(h.outbound.attempts, calls)
    assert.equal(calls, h.mails.length, 'generation, approval, reports and accounting call no provider; only native invitations send mail')
  })

  await scenario(t, 'PLAN-013 pre-date monthly approvals retain their approval-date reports and downloads after a Worker upgrade', async t => {
    let legacy = false
    const h = await installation({ at: '2026-11-08T12:00:00.000Z', workerPlugins: [{ name: 'pre-monthly-date-approval', setup(build) {
      build.onLoad({ filter: /\/commands\/invoices\.ts$/ }, async args => {
        if (!legacy) return
        // The earlier approval writer persisted the revision's approval, without
        // the later frozen date and separate recurring-approval fields. Produce
        // those records by approving through the Worker, never by editing D1.
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
    const job = await branchMonthly(h, b, 'Earlier monthly service')
    await h.setTime('2025-01-31T08:00:00.000Z'); await h.scheduled('2025-01-31T08:00:00.000Z')
    const draft = (await h.state()).invoices.find(i => i.jobId === job.id)
    await h.setTime('2025-02-03T06:30:00.000Z')
    const inv = await approve(b, draft)
    assert.equal(inv.dates, undefined)
    assert.equal(inv.approvalAt, undefined)
    assert.deepEqual(inv.revisions[0].approval, { id: b.office.id, name: 'Riley Reports', role: 'office', at: '2025-02-03T06:30:00.000Z' })
    const output = await b.office.run('invoice.export', {})
    const paths = [
      '/api/glove/reports/revenue.json?from=2025-02-02&to=2025-02-02', '/api/glove/reports/revenue.csv?from=2025-02-02&to=2025-02-02',
      '/api/glove/reports/tax.json?from=2025-02-02&to=2025-02-02', '/api/glove/reports/tax.csv?from=2025-02-02&to=2025-02-02',
      '/api/glove/reports/receivables.json?asOf=2025-02-17', `/api/glove/exports/${output.id}.csv`,
      `/api/glove/invoices/${inv.id}/quickbooks.json?customerRef=1&itemRef=2&taxCodeRef=3`,
    ]
    const before = await Promise.all(paths.map(path => read(h, path)))
    assert.deepEqual(before[0].total, { invoices: 1, revenue: '60.00' })
    assert.deepEqual(before[0].approvedAfterPeriodEnd ?? [], [])
    assert.deepEqual(ordered(before[1]), ordered([
      ['group', 'key', 'invoices', 'revenue'], ['month', '2025-02', '1', '60.00'], ['job type', 'Uncategorized', '1', '60.00'], ['branch', 'Pacific branch', '1', '60.00'], ['total', '', '1', '60.00'],
    ]))
    assert.deepEqual(ordered(before[3]), ordered([
      ['branch', 'jurisdiction', 'month', 'invoices', 'tax'], ['Pacific branch', 'Local sales tax', '2025-02', '1', '6.00'], ['Pacific branch', 'Local sales tax', 'total', '1', '6.00'],
    ]))
    assert.deepEqual(before[2].jurisdictions.map(j => [j.invoices, j.taxable, j.tax]), [[1, '60.00', '6.00']])
    const aging = before[4].customers.flatMap(c => c.invoices).find(i => i.id === inv.id)
    assert.deepEqual([aging.issuedOn, aging.dueOn, aging.basis, aging.daysPastDue, aging.bucket], ['2025-02-02', '2025-02-16', 'due date computed from first approval and current terms', 1, '1-30'])
    assert.deepEqual(before[5].find(row => row[3] === inv.number).slice(5, 7), ['02/02/2025', '02/16/2025'])
    assert.deepEqual([before[6].TxnDate, before[6].DueDate], ['2025-02-02', '2025-02-16'])
    const terminal = await h.state(), calls = h.outbound.attempts
    legacy = false
    await h.restart({ rebuild: true })
    assert.deepEqual(await h.state(), terminal)
    assert.deepEqual(await Promise.all(paths.map(path => read(h, path))), before, 'upgrade preserves every earlier report and accounting output')
    await h.scheduled('2025-02-03T06:30:00.000Z')
    assert.deepEqual(await h.state(), terminal)
    assert.equal(h.outbound.attempts, calls)
    assert.deepEqual(terminal.payments, [])
  })
})
