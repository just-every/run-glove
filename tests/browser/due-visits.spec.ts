import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker, D1, native sessions and public HTTP doors.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function screens(page: Page, name: string, anchor: Locator) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await anchor.scrollIntoViewIfNeeded()
    await anchor.evaluate(el => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 80)))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-due-${name}.png`) })
    }
  }
}

test('PLAN-004 / AGENT-008 owner filters seasonal due visits, batch books by area, sees conflicts and follows the brief to the agreement at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'TUNE', name: 'AC tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
    const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [] })
    const person = await h.person('Luis Ortega Browser', 'technician')
    await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
    const d = new Date(`${today}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 7); const startDate = d.toISOString().slice(0, 10)
    for (const [i, name] of ['Ellen Brooks', 'Rosa Diaz', 'Lee Park'].entries()) {
      const customer = await h.command('customer.save', { name })
      const site = await h.command('site.save', { customerId: customer.id, address: `${10 + i} Service St, Austin TX ${i < 2 ? '78704' : '78701'}`, zip: i < 2 ? '78704' : '78701' })
      await h.command('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate })
    }
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#dispatch`)
      const panel = page.getByRole('region', { name: 'Due agreement visits', exact: true })
      await expect(panel.getByRole('status')).toHaveText('6 included visits due in this range')
      await screens(page, 'outstanding', panel)
      await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78704')
      await expect(panel.getByRole('status')).toHaveText('4 included visits due in this range')
      await panel.getByLabel('Season from (optional)', { exact: true }).fill(startDate)
      await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
      await panel.getByLabel('Batch technician', { exact: true }).selectOption({ label: 'Luis Ortega' })
      await panel.getByLabel('First visit starts', { exact: true }).fill('09:00')
      await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
      await expect(panel.getByLabel('Batch results').getByRole('listitem')).toHaveCount(4)
      await expect(panel.locator('ul.rows > li').filter({ hasText: 'Booked, awaiting completion' })).toHaveCount(4)
      expect((await h.request('/api/glove/due-visits?area=78704').then(r => r.json())).visits.filter((v: any) => v.booked)).toHaveLength(4)
      await expect(panel.getByRole('status')).toHaveText('4 included visits due in this range')
      await screens(page, 'booked', panel)
      await screens(page, 'batch-form', panel.getByRole('form', { name: 'Batch book included visits', exact: true }))
      await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78701')
      await expect(panel.getByRole('status')).toHaveText('2 included visits due in this range')
      await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
      await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
      await expect(panel.getByLabel('Batch results')).toContainText('not booked; Review these dispatch conflicts')
      await expect(panel.getByRole('status')).toHaveText('2 included visits due in this range')
      await screens(page, 'refused', panel)
      await screens(page, 'refused-results', panel.getByLabel('Batch results'))
      await page.goto(`${origin}/app#today`)
      await expect(page.locator('.tile').filter({ has: page.locator('#tile-agreements') })).toContainText('6 visits')
      const brief = page.getByRole('region', { name: 'Morning brief', exact: true })
      await expect(brief.getByRole('region', { name: 'Agreement visits due', exact: true }).getByRole('listitem')).toHaveCount(6)
      await screens(page, 'today', brief)
      await brief.getByRole('link', { name: 'View agreement', exact: true }).first().click()
      const agreement = page.getByRole('region', { name: 'Agreements', exact: true })
      await expect(agreement).toContainText('Comfort Club')
      await screens(page, 'agreement', agreement)
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
