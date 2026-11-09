import { closeHarnessContext, harnessRoute, unrouteHarness } from './harness-route'
import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker/native sessions/D1 fixture, only provider edges are fake.
import { installation, morningBriefFixture, morningBriefAt, mailEvents } from '../api/harness.mjs'

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function screens(page: Page, name: string, anchor?: Locator) {
  console.log('AGENT-008 screen:', name)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-brief-${name}.png`), fullPage: name === 'today' }) }
  }
}

test('AGENT-008 points 1–2 and 4: owner reads the fixed-date Today brief and follows every section action at 1440 and 390 without sending', async ({ browser }) => {
  const h = await installation({ at: '2026-11-07T12:00:00.000Z' })
  try {
    const f = await morningBriefFixture(h)
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-browser-mail', eventKey: mailEvents('sendgrid').eventKey, fromEmail: ['synthetic-glove-office', 'example.test'].join('@') })
    await h.command('mail.morning', { enabled: true, time: '07:15' })
    const before = await h.state(), outbound = h.outbound.attempts, mailCount = h.mails.length
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.clock.install({ time: new Date(morningBriefAt) })
      await harnessRoute(page, `${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#today`)
      const brief = page.getByRole('region', { name: 'Morning brief', exact: true })
      const unbilled = brief.getByRole('region', { name: 'Unbilled work', exact: true })
      await expect(unbilled).toContainText(`${f.noInvoice.job.number} for No Invoice is complete with no invoice`)
      await expect(unbilled).toContainText(`${f.draftInvoice.job.number} for Draft Invoice is complete and ${f.draft.number} awaits approval`)
      await expect(brief.getByRole('region', { name: 'Over their cost estimate', exact: true })).toContainText(`${f.late.job.number} for Late Arrival has cost $150.00 against a $100.00 estimate`)
      await expect(brief.getByRole('region', { name: 'At risk today', exact: true })).toContainText(`${f.late.job.number} at 7:00 AM for Late Arrival: Priya Nair has not arrived 15 minutes after the start`)
      await expect(brief.getByRole('region', { name: 'Leads waiting', exact: true })).toContainText("Waiting Lead's google request has been new for 24 hours")
      await expect(brief.getByRole('heading', { name: 'Overdue invoices', exact: true })).toBeVisible()
      await expect(brief.getByRole('status')).toContainText('not yet sent')
      await screens(page, 'today', brief)
      for (const [section, action, hash, content] of [
        ['Unbilled work', 'Prepare invoice', '#invoices', 'Completed jobs to invoice'],
        ['Unbilled work', 'Approve invoice', '#invoices', f.draft.number],
        ['At risk today', 'Open dispatch', '#dispatch', f.late.job.number],
        ['Over their cost estimate', 'Review job costs', '#jobs', f.late.job.number],
        ['Leads waiting', 'Contact the customer', '#quotes', 'Waiting Lead'],
        ['Leads waiting', 'Quote the request', '#quotes', 'Contacted Lead'],
      ]) {
        await page.setViewportSize({ width: 1440, height: 1050 })
        await page.goto(`${origin}/app#today`)
        await brief.getByRole('region', { name: section, exact: true }).getByRole('link', { name: action, exact: true }).first().click()
        await page.waitForURL(u => u.hash === hash)
        await expect(page.getByRole('heading', { name: { '#invoices': 'Invoices', '#dispatch': 'Dispatch', '#jobs': 'Jobs', '#quotes': 'Quotes' }[hash], level: 1, exact: true })).toBeVisible()
        await expect(page.getByRole('main')).toContainText(content)
        if (['Prepare invoice', 'Open dispatch', 'Review job costs', 'Contact the customer'].includes(action)) await screens(page, hash.slice(1))
      }
      expect(await h.state()).toEqual(before)
      expect([h.mails.length, h.email.sent.length, h.pushes.sent.length, h.models.calls.length, h.outbound.attempts]).toEqual([mailCount, 0, 0, 0, outbound])
    } finally { await unrouteHarness(page); await closeHarnessContext(context) }
  } finally { await h.close() }
})
