import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production HTTP Worker/native sessions/D1 fixture.
import { installation, business, completedJob } from '../api/harness.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function screen(page: Page, width: number, name: string, anchor: Locator) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-invoice-batch-${name}.png`) })
  }
}
test('PAY-001 the office prepares three selected completed jobs together, sees a refused item and reviews each draft at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h), jobs = []
      for (const date of ['2026-10-17', '2026-10-18', '2026-10-19']) jobs.push(await completedJob(h, b, date))
      const unpriced = await completedJob(h, b, '2026-10-20')
      await b.priyaPerson.run('visit.capture', { visitId: unpriced.visit.id, kind: 'material', description: 'Uncatalogued valve', quantity: '1', deviceTime: '2026-10-20T23:01:00Z' })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { as: b.office.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#invoices`)
      const batch = page.getByRole('form', { name: 'Prepare invoices together' })
      await expect(batch.getByRole('button', { name: 'Prepare 0 draft invoices', exact: true })).toBeDisabled()
      for (const work of [...jobs, unpriced]) await batch.getByRole('checkbox', { name: new RegExp(work.job.number) }).check()
      await screen(page, width, 'selected', batch)
      const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await batch.getByRole('button', { name: 'Prepare 4 draft invoices', exact: true }).click()
      const answer = await (await response).json()
      expect(answer.ok).toBe(true)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      expect(answer.result.results.map((r: any) => r.ok)).toEqual([true, true, true, false])
      const invoices = (await h.state()).invoices
      expect(invoices).toHaveLength(3)
      expect(invoices.map((i: any) => [i.status, i.revisions[0].approval])).toEqual([['draft', null], ['draft', null], ['draft', null]])
      const outcome = batch.getByRole('status')
      await expect(outcome).toContainText(unpriced.job.number)
      await expect(outcome).toContainText('Uncatalogued valve')
      await expect(batch.getByRole('checkbox')).toHaveCount(1)
      await screen(page, width, 'results', outcome)
      for (const [index, invoice] of invoices.entries()) {
        if (index === 0) await batch.getByRole('link', { name: invoice.number, exact: true }).click()
        else {
          await page.goto(`${origin}/app#invoices`)
          await page.getByRole('button', { name: invoice.number, exact: true }).click()
        }
        const heading = page.getByRole('heading', { name: `${invoice.number} · Harbourview Dental`, exact: true })
        await expect(heading).toBeVisible()
        await expect(page.getByRole('button', { name: /Approve revision 1/ })).toBeVisible()
        await screen(page, width, `review-${invoice.number}`, heading)
      }
      await page.reload()
      expect((await h.state()).invoices).toHaveLength(3)
      await screen(page, width, 'retained', page.getByRole('heading', { name: `${invoices.at(-1).number} · Harbourview Dental`, exact: true }))
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
