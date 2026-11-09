import { closeHarnessContext, gotoHarness, harnessRoute } from './harness-route'
import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker with real D1, sessions and command doors.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('PLAN-004 Office filters individual due visits and books through desk controls while outstanding work stays listed', async ({ browser }) => {
  const at = '2026-11-06T00:30:00Z', h = await installation({ at })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  try {
    await h.command('business.save', { name: 'Synthetic Glove Care', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'DUE', name: 'Seasonal care', unitPrice: '100.00', tax: 'TAXABLE' })
    const plan = await h.command('plan.save', { name: 'Included Care', price: '200.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id })
    const office = await h.person('Due List Office', 'office')
    const tech = await h.command('technician.save', { name: 'Due List Technician' })
    for (const [n, name, zip, startDate] of [[1, 'Synthetic Aspen', '78704', '2026-04-30'], [2, 'Synthetic Birch', '78704', '2026-04-30'], [3, 'Synthetic Cedar', '78701', '2026-05-01']]) {
      const customer = await h.command('customer.save', { name })
      const site = await h.command('site.save', { customerId: customer.id, address: `${n} Synthetic Street`, zip })
      await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate })
    }
    const page = await context.newPage()
    await page.clock.setFixedTime(new Date(at))
    if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
    try { await gotoHarness(page, process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    await harnessRoute(page, `${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), as: office.cookie, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await gotoHarness(page, `${origin}/app#dispatch`)
    const panel = page.getByRole('region', { name: 'Due agreement visits', exact: true })
    const rows = panel.locator('ul.rows').first().locator(':scope > li')
    await expect(panel.getByRole('status')).toHaveText('6 included visits due in this range')
    await expect(panel.getByLabel('Due through', { exact: true })).toHaveValue('2026-11-05')
    await expect(rows).toHaveCount(6)
    await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('787')
    await expect(rows).toHaveCount(0)
    await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78704')
    await expect(rows).toHaveCount(4)
    await expect(panel).not.toContainText('Synthetic Cedar')
    await panel.getByLabel('Season from (optional)', { exact: true }).fill('2026-10-30')
    await panel.getByLabel('Due through', { exact: true }).fill('2026-10-30')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('Visit 2 · due 2026-10-30')
    await expect(rows.nth(1)).toContainText('Visit 2 · due 2026-10-30')
    await panel.getByLabel('Due through', { exact: true }).fill('2026-10-29')
    await expect(panel.getByRole('alert')).toContainText('from is on or before through')
    await panel.getByLabel('Due through', { exact: true }).fill('2026-10-30')
    await expect(panel.getByRole('alert')).toHaveCount(0)
    const aspen = rows.filter({ hasText: 'Synthetic Aspen' })
    await aspen.getByRole('checkbox').check()
    const form = panel.getByRole('form', { name: 'Batch book included visits', exact: true })
    await form.getByLabel('Batch technician', { exact: true }).selectOption(tech.id)
    await form.getByLabel('Batch date', { exact: true }).fill('2026-11-07')
    await form.getByLabel('First visit starts', { exact: true }).fill('09:00')
    await form.getByRole('button', { name: 'Book selected visits', exact: true }).click()
    await expect(aspen).toContainText('Booked, awaiting completion')
    await expect(rows.filter({ hasText: 'Synthetic Birch' })).toContainText('Awaiting booking')
    await expect(aspen.getByRole('link', { name: 'Open job', exact: true })).toBeVisible()
    await expect(panel.getByRole('status')).toHaveText('2 included visits due in this range')
    const state = await h.state()
    expect(state.jobs).toHaveLength(1)
    expect(state.jobs[0].agreementVisitIndex).toBe(1)
    expect(state.visits.map((v: any) => [v.jobId, v.local.date, v.local.start])).toEqual([[state.jobs[0].id, '2026-11-07', '09:00']])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await panel.scrollIntoViewIfNeeded()
      if (process.env.GLOVE_SCREENSHOTS) {
        await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
        await panel.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-due-visit-list.png`) })
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
    await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('')
    await panel.getByLabel('Season from (optional)', { exact: true }).fill('')
    await panel.getByLabel('Due through', { exact: true }).fill('2026-11-05')
    await expect(rows).toHaveCount(6)
    await expect(rows.filter({ hasText: 'Synthetic Aspen' }).filter({ hasText: 'Visit 1' })).toContainText('Awaiting booking')
    await expect(rows.filter({ hasText: 'Synthetic Aspen' }).filter({ hasText: 'Visit 2' })).toContainText('Booked, awaiting completion')
  } finally {
    await closeHarnessContext(context)
    await h.close()
  }
})
