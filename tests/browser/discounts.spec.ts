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
  console.log('QUOTE-007 screen:', name)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-discount-${name}.png`) }) }
  }
}

test('QUOTE-007 owner gives a document discount with a discount line and sees the allocation on the quote, invoice, price book and role limits at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: false }] } })
    const b = (await h.state()).business[0]
    await h.command('business.save', { name: b.name, timezone: b.timezone, version: b.version, discountLimits: { office: '20' } })
    const parts = await h.command('service.save', { code: 'PARTS', name: 'Condenser parts', kind: 'material', unitPrice: '400.00', tax: 'TAXABLE' })
    const labor = await h.command('service.save', { code: 'LABOR', name: 'Install labor', kind: 'service', unitPrice: '300.00', tax: 'TAXABLE' })
    const first = await h.command('service.save', { code: 'FIRST', name: 'First-time customer', kind: 'discount', unitPrice: '-50.00', tax: 'FREE' })
    const customer = await h.command('customer.save', { name: 'Rosa Diaz' })
    const site = await h.command('site.save', { customerId: customer.id, address: '10 Service St, Austin TX 78704', zip: '78704' })
    const q = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Condenser swap', lines: [parts, labor, first].map(x => ({ description: x.name, serviceId: x.id, quantity: '1', unitPrice: x.unitPrice })) })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      // The page's API calls reach the harness installation that holds this journey's records.
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${q.number} · Condenser swap`, exact: true }).click()
      await expect(page.locator('.page')).toContainText('-$50.00')
      await page.getByRole('button', { name: 'Revise price', exact: true }).click()
      const revise = page.locator('form', { has: page.getByRole('button', { name: 'Save revision 2', exact: true }) })
      await revise.getByLabel('Discount', { exact: true }).selectOption('percent')
      await revise.getByLabel('Discount percent', { exact: true }).fill('50')
      await revise.getByLabel('Discount reason', { exact: true }).fill('Military')
      await screens(page, 'revise-form', revise.getByLabel('Discount reason', { exact: true }))
      await send(page, revise.getByRole('button', { name: 'Save revision 2', exact: true }))
      const row = page.getByRole('cell', { name: 'Discount · Military (50%) · non-taxable $250.00, taxable $75.00 · from Install labor $250.00, Condenser parts $75.00', exact: true })
      await expect(row).toBeVisible()
      await expect(page.locator('.page')).toContainText('Austin combined · 8.25% on $325.00')
      await expect(page.locator('.page')).toContainText('$351.81')
      await screens(page, 'quote-allocation', row)
      const quote = (await h.state()).quotes.find((x: any) => x.id === q.id)
      const approved = await h.command('quote.approve', { quoteId: q.id, version: quote.version, revision: 2 })
      await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 2, method: 'phone', customerName: 'Rosa Diaz' })
      const job = await h.command('job.create', { quoteId: q.id })
      const person = await h.person('Priya Nair', 'technician')
      const tech = await h.command('technician.save', { name: 'Priya Nair', operatorId: person.id })
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
      const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Condenser replaced', signoff: { absentReason: 'Customer at work' } })
      const inv = await h.command('invoice.prepare', { jobId: job.id })
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: inv.number, exact: true }).click()
      await expect(row).toBeVisible()
      await expect(page.locator('.page')).toContainText('$351.81')
      await screens(page, 'invoice-allocation', row)
      await page.goto(`${origin}/app#team`)
      await expect(page.getByLabel('Office discount limit (%)', { exact: true })).toHaveValue('20')
      await screens(page, 'role-limits', page.getByLabel('Office discount limit (%)', { exact: true }))
      await expect(page.locator('.page')).toContainText('First-time customer')
      await screens(page, 'price-book-discount', page.getByText('First-time customer', { exact: false }).first())
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
