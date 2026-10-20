import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker/native sessions/D1 fixture.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Shared real command flow.
import { agingDay } from '../fixtures/receivables.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('REPORT-003 owner reads every aging bucket and follows the exact open invoice at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    const { invoices, asOf } = await agingDay(h)
    const context = await browser.newContext(), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), u = new URL(req.url())
        const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await page.goto(`${origin}/app#reports`)
        const panel = page.getByRole('region', { name: 'Receivables aging', exact: true })
        await page.getByLabel('Aging as of', { exact: true }).fill(asOf)
        await expect(panel.getByRole('heading', { name: 'USD · $111.06 open', exact: true })).toBeVisible()
        await expect(panel).toContainText('No payments recorded yet')
        await expect(panel).toContainText('No reminders scheduled')
        for (const label of ['Current', '1–30 days', '31–60 days', '61–90 days', 'Over 90 days']) await expect(panel).toContainText(label)
        await panel.scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-receivables-aging.png`) }) }
        await panel.getByRole('link', { name: invoices[0].number, exact: true }).click()
        await expect(page.getByRole('heading', { name: `${invoices[0].number} · Rosa Diaz`, exact: true })).toBeVisible()
        await expect(page.locator('.page')).toContainText(`Due ${invoices[0].dates.dueOn}`)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (process.env.GLOVE_SCREENSHOTS) await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-receivables-invoice.png`) })
      }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
