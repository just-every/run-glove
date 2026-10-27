import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker, D1 and native sessions behind public HTTP doors.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Shared native five-visit fixture; no domain replacement.
import { readinessFixture } from '../fixtures/readiness.mjs'

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('Dispatcher reviews five next-day visits and three source-linked internal proposals without executing work', async ({ browser }) => {
  const h = await installation({ at: '2030-01-01T12:00:00Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  try {
    const f = await readinessFixture(h), before = await h.state()
    await page.clock.setFixedTime(new Date('2030-01-01T12:00:00Z'))
    if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), as: f.dispatcher.cookie, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      try { await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) }) } catch (error) {
        if (!(error instanceof Error) || !/Route is already handled/.test(error.message)) throw error
      }
    })
    await page.goto(`${origin}/app?readiness#dispatch`)
    const panel = page.getByRole('region', { name: 'Next-day readiness', exact: true })
    console.log('Readiness: opened dispatch')
    await expect(panel.getByRole('status')).toHaveText('5 visits · Overall readiness unconfirmed')
    const nextDay = page.getByRole('button', { name: 'Next day', exact: true })
    await nextDay.hover()
    await expect(page.getByRole('tooltip', { name: 'Next day', exact: true })).toBeVisible()
    await nextDay.focus()
    await expect(page.getByRole('tooltip', { name: 'Next day', exact: true })).toBeVisible()
    const rows = panel.getByRole('list', { name: 'Visit readiness', exact: true }).locator(':scope > li')
    await expect(rows).toHaveCount(5)
    await expect(rows.nth(0)).toContainText('allocated on van')
    await expect(rows.nth(3)).toContainText('missing parts')
    await expect(rows.nth(4)).toContainText('unreceived order')
    await expect(rows.nth(4)).toContainText('1 of 2 received')
    await expect(rows.filter({ hasText: 'Access unknown · Readiness unconfirmed' })).toHaveCount(5)
    const proposals = panel.getByRole('list', { name: 'Internal fix proposals', exact: true }).locator(':scope > li')
    await expect(proposals).toHaveCount(3)
    await expect(proposals.nth(0)).toContainText('Allocate missing parts')
    await expect(proposals.nth(1)).toContainText('Verify outstanding receipts')
    await expect(proposals.nth(2)).toContainText('Verify customer access')
    await expect(proposals.nth(0).getByRole('link').first()).toHaveAttribute('href', `#jobs/${f.jobs[3].id}`)
    await panel.getByRole('button', { name: 'Prepare internal proposals', exact: true }).click()
    await expect(rows.filter({ hasText: 'Preparation current' })).toHaveCount(5)
    await expect(rows.nth(0)).toContainText('Prepared by Readiness Dispatcher')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await panel.scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.GLOVE_SCREENSHOTS) {
        await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
        await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-readiness-board.png`), fullPage: true })
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
    console.log('Readiness: screens recorded')
    f.po = await h.command('po.receive', { poId: f.po.id, version: f.po.version, lines: [{ lineId: f.po.lines[0].id, quantity: '1' }] })
    console.log('Readiness: receipt completed')
    await panel.getByRole('button', { name: 'Refresh evidence', exact: true }).click()
    await expect(rows.nth(4)).toContainText('received in full')
    await expect(rows.nth(4)).toContainText('Preparation stale')
    await expect(rows.nth(4)).toContainText('missing parts')
    await panel.getByRole('button', { name: 'Prepare internal proposals', exact: true }).click()
    await expect(rows.filter({ hasText: 'Preparation current' })).toHaveCount(5)
    console.log('Readiness: evidence refreshed and prepared')
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await expect(rows).toHaveCount(5)
      await expect(rows.nth(4)).toContainText('received in full')
      await expect(proposals).toHaveCount(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.GLOVE_SCREENSHOTS) await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-readiness-refreshed.png`), fullPage: true })
    }
    const after = await h.state()
    for (const kind of ['visits', 'jobs', 'payments', 'messages', 'bookingOffers']) expect(after[kind]).toEqual(before[kind])
    console.log('Readiness: no effects confirmed')
    await rows.nth(0).getByRole('link').click()
    await expect(page.getByRole('heading', { name: `${f.jobs[0].number} · ${f.jobs[0].title}`, exact: true })).toBeVisible()
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(page.getByRole('heading', { name: `${f.jobs[0].number} · ${f.jobs[0].title}`, exact: true })).toBeInViewport()
      if (process.env.GLOVE_SCREENSHOTS) await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-readiness-source-job.png`) })
    }
  } catch (error) { console.error('Readiness assertion failed:', error); throw error }
  finally { await page.unrouteAll({ behavior: 'ignoreErrors' }); await context.close(); await h.close() }
})
