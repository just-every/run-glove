import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker, native sessions and D1 fixture.
import { installation, revenueCorrection, fixedMonthlyReports } from '../api/harness.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

export async function correctionRevenue(browser: import('@playwright/test').Browser) {
  const h = await installation({ at: '2026-10-30T16:00:00.000Z' }), context = await browser.newContext(), page = await context.newPage()
  try {
    const { b, invoice, correctionLines } = await revenueCorrection(h)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    // Use the established native-session harness for every API request, with no report response fake.
    await context.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), u = new URL(req.url())
      const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.setViewportSize({ width: 1440, height: 1050 })
    const panel = page.getByRole('region', { name: 'Revenue', exact: true })
    const choose = async (from: string, to: string, filter = '') => {
      await page.getByLabel('From', { exact: true }).fill(from)
      await page.getByLabel('To', { exact: true }).fill(to)
      const query = new URLSearchParams({ from, to, ...(filter ? { jobType: filter } : {}) })
      const response = page.waitForResponse(r => {
        const u = new URL(r.url())
        return u.pathname === '/api/glove/reports/revenue.json' && [...query].every(([k, v]) => u.searchParams.get(k) === v) && (u.searchParams.get('jobType') || '') === filter
      })
      // Exercise the real filter control and wait for its matching report response.
      await page.getByLabel('Filter', { exact: true }).selectOption(filter)
      if (!filter) { await page.getByLabel('Filter', { exact: true }).selectOption('Maintenance'); await page.getByLabel('Filter', { exact: true }).selectOption('') }
      expect((await response).status()).toBe(200)
      await expect(panel.getByRole('link', { name: 'Download CSV' })).toHaveAttribute('href', `/api/glove/reports/revenue.csv?${query.toString()}`)
    }
    const rows = () => panel.locator('tbody tr').allTextContents()
    const csv = async () => {
      const href = await panel.getByRole('link', { name: 'Download CSV', exact: true }).getAttribute('href')
      // Native Chromium downloads bypass route interception; fetch the control's exact URL in this page.
      const result = await page.evaluate(async href => {
        const response = await fetch(href!, { credentials: 'same-origin' })
        return { status: response.status, disposition: response.headers.get('content-disposition'), text: await response.text() }
      }, href)
      expect(result.status).toBe(200)
      expect(result.disposition).toContain('attachment;')
      return result.text.trim().split(/\r?\n/)
    }
    const capture = async (label: string) => {
      // Assertions run at 1440. The same state is shown at phone width for the browser proof.
      if (!process.env.GLOVE_SCREENSHOTS) return
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await panel.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-revenue-${label}.png`) })
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
    }
    await h.setTime('2026-11-01T04:05:00.000Z')
    const correction = await b.office.run('invoice.correct', { invoiceId: invoice.id, version: invoice.version, reason: 'Actual work revised by the office', lines: correctionLines })
    await h.restart()
    await page.goto(`${origin}/app#reports`)
    await choose('2026-10-01', '2026-10-31')
    await expect.poll(rows).toEqual(['2026-103$228.37', 'Maintenance1$152.40', 'Uncategorized2$75.97', 'Main business3$228.37', 'All3$228.37'])
    expect(await csv()).toEqual(['group,key,invoices,revenue', 'month,2026-10,3,228.37', 'job type,Maintenance,1,152.40', 'job type,Uncategorized,2,75.97', 'branch,Main business,3,228.37', 'total,,3,228.37'])
    await capture('unapproved-correction')
    await b.office.run('invoice.approve', { invoiceId: correction.id, version: correction.version, revision: 2 })
    await h.restart()
    await page.reload()
    await choose('2026-10-01', '2026-10-31')
    await expect.poll(rows).toEqual(['2026-103$221.08', 'Maintenance1$145.11', 'Uncategorized2$75.97', 'Main business3$221.08', 'All3$221.08'])
    expect(await csv()).toEqual(['group,key,invoices,revenue', 'month,2026-10,3,221.08', 'job type,Maintenance,1,145.11', 'job type,Uncategorized,2,75.97', 'branch,Main business,3,221.08', 'total,,3,221.08'])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await panel.locator('button,a').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim()).length)).toBe(0)
    await capture('approved-correction')
    await choose('2026-10-01', '2026-10-31', 'Maintenance')
    await expect.poll(rows).toEqual(['2026-101$145.11', 'Maintenance1$145.11', 'Main business1$145.11', 'All1$145.11'])
    expect((await csv()).at(-1)).toBe('total,,1,145.11')
    await capture('maintenance-filter')
    await choose('2026-10-01', '2026-10-31', 'Uncategorized')
    await expect.poll(rows).toEqual(['2026-102$75.97', 'Uncategorized2$75.97', 'Main business2$75.97', 'All2$75.97'])
    expect((await csv()).at(-1)).toBe('total,,2,75.97')
    await choose('2026-10-01', '2026-10-31', 'Repair')
    await expect.poll(rows).toEqual(['All0$0.00'])
    await choose('2026-11-01', '2026-11-30')
    await expect.poll(rows).toEqual(['All0$0.00'])
    expect(await csv()).toEqual(['group,key,invoices,revenue', 'total,,0,0.00'])
    await capture('next-month-empty')
  } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
}

const shots = process.env.GLOVE_SCREENSHOTS
async function shot(page: Page, width: number, name: string) {
  if (!shots) return
  await mkdir(shots, { recursive: true })
  await page.screenshot({ path: join(shots, `${width}-${name}.png`), fullPage: true })
}

test('REPORT-002, REPORT-004 the owner filters job margins and downloads the matching CSV at 1440 and 390', async ({ browser }) => {
  // @ts-expect-error Production Worker/native sessions/D1 fixture, no product mocks.
  const { installation, business, completedJob } = await import('../api/harness.mjs')
  const h = await installation()
  try {
    const b = await business(h)
    for (const [category, cost, date] of [['Maintenance', '40.00', '2026-10-19'], ['Repair', '150.00', '2026-10-20']]) {
      const service = await h.command('service.save', { code: category.toUpperCase(), name: category, category, unitPrice: '189.00', unitCost: cost, tax: 'GST' })
      await completedJob(h, { ...b, service }, date)
    }
    const context = await browser.newContext(), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      await page.goto(process.env.GLOVE_OPEN)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') {
        await page.getByRole('checkbox').check()
        await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
        await page.waitForURL(u => u.pathname === '/app')
      }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`${origin}/app#reports`)
        await page.reload()
        await page.getByLabel('Report', { exact: true }).selectOption('margins')
        await page.getByLabel('From', { exact: true }).fill('2026-10-01')
        const panel = page.getByRole('region', { name: 'Job margins', exact: true })
        await expect(panel.getByRole('cell', { name: 'Maintenance', exact: true })).toBeVisible()
        await expect(panel.getByRole('cell', { name: 'Repair', exact: true })).toBeVisible()
        await expect(panel.getByRole('row').last()).toContainText('$378.00')
        await shot(page, width, 'margins-all-types')
        await panel.getByLabel('Filter', { exact: true }).selectOption('Maintenance')
        await expect(panel.getByRole('cell', { name: 'Repair', exact: true })).toHaveCount(0)
        await expect(panel.getByRole('row').last()).toContainText('$189.00')
        await expect(panel.getByRole('row').last()).toContainText('$40.00')
        const href = await panel.getByRole('link', { name: 'Download CSV', exact: true }).getAttribute('href')
        const csv = await h.request(href!).then((r: Response) => r.text())
        expect(csv).toContain('Maintenance,1,189.00,40.00')
        expect(csv).not.toContain('Repair')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await shot(page, width, 'margins-filtered')
      }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
  await correctionRevenue(browser)
  await fixedMonthlyRevenue(browser)
})

/** REPORT-004: report figures and late-approval dates from the native monthly fixture. */
export async function fixedMonthlyRevenue(browser: import('@playwright/test').Browser) {
  const h = await installation({ at: '2026-11-08T12:00:00.000Z' }), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await fixedMonthlyReports(h)
    await h.restart()
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    await context.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.setViewportSize({ width: 1440, height: 1050 })
    await page.goto(`${origin}/app#reports`)
    const panel = page.locator('section.panel').filter({ has: page.locator('#report-title') })
    await page.getByLabel('From', { exact: true }).fill('2025-01-31')
    await page.getByLabel('To', { exact: true }).fill('2025-03-31')
    const expected = b.approved.filter((x: any) => x.period && x.kind !== 'onTime')
    const expectedRows = expected.map((x: any) => [x.invoice.number, 'approved after period end', x.issuedOn, x.approvedOn, x.dueOn].join(''))
    const lateRows = () => late.locator('tbody tr').allTextContents().then(rows => rows.sort())
    const late = panel.getByRole('table', { name: 'Approvals after period end' })
    const download = async () => {
      const href = await panel.getByRole('link', { name: 'Download CSV', exact: true }).getAttribute('href')
      return page.evaluate(async href => { const r = await fetch(href!, { credentials: 'same-origin' }); return { status: r.status, text: await r.text() } }, href)
    }
    for (const [kind, label, total] of [['revenue', 'Revenue', '$1,400.00'], ['tax', 'Sales tax', '$116.00']]) {
      await page.getByLabel('Report', { exact: true }).selectOption(kind)
      await expect(page.locator('#report-title')).toHaveText(label)
      await expect.poll(lateRows).toEqual([...expectedRows].sort())
      await expect(panel).toContainText(total)
      const result = await download()
      expect(result.status).toBe(200)
      for (const x of expected) expect(result.text).toContain(`issued ${x.issuedOn}; approved ${x.approvedOn}; due ${x.dueOn}`)
      // Assertions run once at desktop width; show these same records at both proof widths.
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await late.scrollIntoViewIfNeeded()
        await shot(page, width, `monthly-${kind}-late-approvals`)
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
    }
    await page.getByLabel('Report', { exact: true }).selectOption('revenue')
    await page.getByLabel('Report branch', { exact: true }).selectOption(b.branch.id)
    await expect.poll(lateRows).toEqual(expectedRows.filter((_: string, i: number) => expected[i].kind === 'pacific').sort())
    await expect(panel.getByRole('row').filter({ hasText: 'All' }).first()).toContainText('$240.00')
    await page.getByLabel('From', { exact: true }).fill('2025-04-01')
    await page.getByLabel('To', { exact: true }).fill('2025-04-30')
    await expect(late).toHaveCount(0)
    await expect(panel.getByRole('row').last()).toContainText('$0.00')
    // PLAN-013: follow each late invoice from the native state into its real
    // invoice screen. Report labels alone do not prove invoice presentation.
    for (const x of expected) {
      await page.goto(`${origin}/app#invoices/${x.invoice.id}`)
      const invoice = page.getByRole('region').filter({ has: page.locator('#invoice-title') })
      await expect(invoice.getByRole('heading', { level: 2 })).toContainText(x.invoice.number)
      await expect(invoice).toContainText(`Approved after period end on ${x.approvedOn}; payment terms start on that approval date.`)
      await expect(invoice).toContainText(`Issued ${x.issuedOn} · Due ${x.dueOn} · 14 days`)
      await expect(invoice).toContainText('approved by Riley Reports')
      await invoice.getByLabel('QuickBooks customer ID', { exact: true }).fill('1')
      await invoice.getByLabel('QuickBooks sales item ID', { exact: true }).fill('2')
      await invoice.getByLabel('QuickBooks tax code ID', { exact: true }).fill('3')
      const payloadLink = invoice.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true })
      await expect(payloadLink).toHaveAttribute('download', '')
      const href = await payloadLink.getAttribute('href')
      const payload = await page.evaluate(async href => {
        const response = await fetch(href!, { credentials: 'same-origin' })
        return { status: response.status, document: await response.json() }
      }, href)
      expect(payload.status).toBe(200)
      expect([payload.document.TxnDate, payload.document.DueDate]).toEqual([x.issuedOn, x.dueOn])
      for (const control of await invoice.locator('button,a').all()) {
        if (!(await control.isVisible())) continue
        await expect(control).toHaveAccessibleName(/\S/)
        if (!(await control.textContent())?.trim()) {
          const description = await control.getAttribute('aria-describedby')
          expect(description).toBeTruthy()
          const tooltip = page.locator(`[id="${description}"]`)
          await control.hover()
          await expect(tooltip).toBeVisible()
          await control.focus()
          await expect(tooltip).toBeVisible()
        }
      }
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await invoice.scrollIntoViewIfNeeded()
        await shot(page, width, `monthly-invoice-${x.kind}-${x.issuedOn}`)
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
    }
    const onTime = b.approved.find((x: any) => x.kind === 'onTime')!
    await page.goto(`${origin}/app#invoices/${onTime.invoice.id}`)
    const onTimePanel = page.locator('section.panel').filter({ has: page.locator('#invoice-title') })
    await expect(onTimePanel).toContainText(`Issued ${onTime.issuedOn} · Due ${onTime.dueOn}`)
    await expect(onTimePanel).not.toContainText('Approved after period end on')
    const draft = b.proposed.find((x: any) => x.jobId === b.unapproved.id)!
    await page.goto(`${origin}/app#invoices/${draft.id}`)
    const draftPanel = page.locator('section.panel').filter({ has: page.locator('#invoice-title') })
    await expect(draftPanel.getByRole('status')).toContainText('Proposed — not approved, not sent')
    await expect(draftPanel).not.toContainText('Approved after period end on')
    expect(h.stripePayments.calls).toHaveLength(0)
    expect(h.email.sent).toHaveLength(0)
  } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
}
