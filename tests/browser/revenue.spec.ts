import { expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker, native sessions and D1 fixture.
import { installation, revenueCorrection } from '../api/harness.mjs'
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
