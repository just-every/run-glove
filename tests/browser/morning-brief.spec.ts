import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker/native sessions/D1 fixture, only provider edges are fake.
import { installation } from '../api/harness.mjs'

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function send(page: Page, button: Locator) {
  const answer = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await answer).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
}
async function screens(page: Page, name: string, anchor?: Locator) {
  console.log('AGENT-008 screen:', name)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-brief-${name}.png`) }) }
  }
}

test('AGENT-008, AGENT-016 owner reads the morning brief on Today and follows an item to its screen at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
    const labor = await h.command('service.save', { code: 'LABOR', name: 'Repair labor', kind: 'service', unitPrice: '200.00', unitCost: '100.00', tax: 'TAXABLE' })
    const person = await h.person('Tom Brooks', 'technician')
    const tech = await h.command('technician.save', { name: 'Tom Brooks', operatorId: person.id })
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
    const job = async (name: string, finish: boolean, start: string) => {
      const customer = await h.command('customer.save', { name })
      const site = await h.command('site.save', { customerId: customer.id, address: `1 ${name} St, Austin TX 78704` })
      const q = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: `${name} repair`, lines: [{ description: labor.name, serviceId: labor.id, quantity: '1', unitPrice: labor.unitPrice }] })
      const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: name })
      const j = await h.command('job.create', { quoteId: q.id })
      const visit = await h.command('visit.book', { jobId: j.id, technicianId: tech.id, date, start, end: start.replace(':00', ':30') })
      if (finish) { await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt }); await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Repaired', signoff: { absentReason: 'Customer away' } }) }
      return j
    }
    const done = await job('Rosa Diaz', true, '22:00'), open = await job('Lee Park', false, '23:00')
    await h.command('expense.record', { jobId: open.id, category: 'permit', vendor: 'City of Austin', amount: '150.00', billable: false })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#today`)
      const brief = page.getByRole('region', { name: 'Morning brief', exact: true })
      const unbilled = brief.getByRole('region', { name: 'Unbilled work', exact: true })
      await expect(unbilled).toContainText(`${done.number} for Rosa Diaz is complete with no invoice`)
      await expect(brief.getByRole('region', { name: 'Over their cost estimate', exact: true })).toContainText(`${open.number} for Lee Park has cost $150.00 against a $100.00 estimate`)
      await expect(brief.getByRole('heading', { name: 'Overdue invoices', exact: true })).toBeVisible()
      await screens(page, 'today', brief)
      await unbilled.getByRole('link', { name: 'Prepare invoice', exact: true }).click()
      await page.waitForURL(u => u.hash === '#invoices')
      await expect(page.locator('.page')).toContainText('Completed jobs to invoice')
      await screens(page, 'invoices')
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
