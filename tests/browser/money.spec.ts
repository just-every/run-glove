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
  console.log('MONEY-001 screen:', name)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-money-${name}.png`) }) }
  }
}

test('MONEY-001 owner manages branch rates, private exemption evidence, Stripe proposals and frozen quote/invoice tax at 1440 and 390', async ({ browser }) => {
  const h = await installation(), empty = await installation()
  try {
    const settings = (id: string, name: string, rate: string, zip: string) => ({ jurisdictions: [{ id, name, rate, zips: [zip], taxLabor: false }] })
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', taxSettings: settings('austin', 'Austin combined', '8.25', '78704') })
    const east = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: ['27601'], taxSettings: settings('wake', 'Wake combined', '4.5', '27601') })
    const part = await h.command('service.save', { code: 'VALVE', name: 'Replacement valve', kind: 'material', unitPrice: '100.01', tax: 'TAXABLE' })
    const labor = await h.command('service.save', { code: 'LABOR', name: 'Install labor', kind: 'service', unitPrice: '50.03', tax: 'TAXABLE' })
    const work = []
    for (const [name, address, branchId, personName] of [
      ['Austin School', '10 Service St, Austin TX 78704', null, 'Priya Nair'],
      ['Raleigh School', '101 Fayetteville St, Raleigh NC 27601', east.id, 'Tom Brooks'],
    ] as const) {
      const customer = await h.command('customer.save', { name, taxExemption: { certificateNumber: 'SCHOOL-2026', expires: '2099-12-31' } })
      const site = await h.command('site.save', { customerId: customer.id, address, branchId })
      const person = await h.person(personName, 'technician')
      const tech = await h.command('technician.save', { name: personName, operatorId: person.id, branchId })
      const q = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'School valve repair', lines: [part, labor].map(x => ({ description: x.name, serviceId: x.id, unitPrice: x.unitPrice, quantity: '1' })) })
      const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
      const job = await h.command('job.create', { quoteId: q.id })
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
      const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Valve installed and tested', signoff: { absentReason: 'Facilities manager away' } })
      const inv = await h.command('invoice.prepare', { jobId: job.id })
      await h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
      work.push({ customer, site, q, inv })
    }
    h.stripeTax.answer = (body: any) => ({ id: 'taxcalc_sample', tax_breakdown: [{ taxability_reason: body['line_items[0][tax_code]'] === 'txcd_99999999' ? 'standard_rated' : 'product_exempt', tax_rate_details: { percentage_decimal: '8.25' } }] })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      let backend = empty
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await backend.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#team`)
      const first = page.getByRole('heading', { name: 'Set up your business', exact: true }).locator('..')
      await expect(first.getByLabel('Billing currency', { exact: true })).toHaveValue('USD')
      await expect(first.getByLabel('Timezone for bookings', { exact: true })).toHaveValue('America/Chicago')
      await first.getByLabel('Business name', { exact: true }).fill('Austin Service Company')
      await screens(page, 'new-us-installation', first)
      await send(page, first.getByRole('button', { name: 'Save business', exact: true }))
      expect((await empty.state()).business[0].currency).toBe('USD')
      backend = h
      await page.reload()
      const business = page.getByRole('heading', { name: 'Business', exact: true }).locator('..')
      await business.getByLabel('Jurisdiction name', { exact: true }).fill('Austin city and county')
      const zips = business.getByLabel('Tax jurisdiction ZIP codes', { exact: true })
      await zips.selectText(); await zips.pressSequentially('78704, 78745')
      await expect(zips).toHaveValue('78704, 78745')
      await send(page, business.getByRole('button', { name: 'Save business', exact: true }))
      expect((await h.state()).business[0].taxSettings.jurisdictions[0].zips).toEqual(['78704', '78745'])
      await screens(page, 'business-tax', business.getByLabel('Combined sales-tax rate (%)', { exact: true }))
      const branch = page.getByRole('form', { name: 'Branch Raleigh', exact: true })
      await expect(branch.getByLabel('Combined sales-tax rate (%)', { exact: true })).toHaveValue('4.5')
      await screens(page, 'branch-tax', branch.getByLabel('Jurisdiction name', { exact: true }))
      await screens(page, 'pricebook-tax', page.getByLabel('Tax treatment', { exact: true }))
      const lookup = page.getByRole('region', { name: 'Optional Stripe Tax lookup', exact: true })
      await lookup.getByLabel('Stripe Tax secret key', { exact: true }).fill('fixture-stripe-tax-credential')
      await send(page, lookup.getByRole('button', { name: 'Connect Stripe Tax lookup', exact: true }))
      await lookup.getByLabel('Lookup service site', { exact: true }).selectOption(work[0].site.id)
      for (const [label, value] of [['Service street', '10 Service St'], ['Service city', 'Austin'], ['Service state', 'TX'], ['Service ZIP', '78704']]) await lookup.getByLabel(label, { exact: true }).fill(value)
      await send(page, lookup.getByRole('button', { name: 'Look up address rates', exact: true }))
      await expect(lookup).toContainText('8.25%')
      await screens(page, 'stripe-proposal', lookup.getByRole('status'))
      await page.goto(`${origin}/app#customers`)
      await page.getByRole('button', { name: 'Austin School', exact: true }).click()
      const exemption = page.getByRole('region', { name: 'Sales-tax exemption', exact: true })
      await exemption.getByLabel('Private exemption certificate', { exact: true }).setInputFiles({ name: 'school-certificate.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH0cAAAAASUVORK5CYII=', 'base64') })
      await send(page, exemption.getByRole('button', { name: 'File certificate document', exact: true }))
      await expect(exemption.getByRole('link', { name: 'Download private certificate', exact: true })).toBeVisible()
      await screens(page, 'certificate', exemption)
      await screens(page, 'site-tax', page.getByLabel('Site tax jurisdiction', { exact: true }).first())
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${work[0].q.number} · School valve repair`, exact: true }).click()
      await expect(page.locator('.page')).toContainText('Austin combined · 8.25% on $100.01')
      await screens(page, 'quote-tax', page.getByRole('cell', { name: 'Austin combined · 8.25% on $100.01', exact: true }))
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: work[0].inv.number, exact: true }).click()
      await expect(page.locator('.page')).toContainText('Austin combined · 8.25% on $100.01')
      await screens(page, 'invoice-tax', page.getByRole('cell', { name: 'Austin combined · 8.25% on $100.01', exact: true }))
      for (const [label, value] of [['QuickBooks customer ID', '58'], ['QuickBooks sales item ID', '41'], ['QuickBooks tax code ID', '7']]) await page.getByLabel(label, { exact: true }).fill(value)
      await expect(page.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true })).toBeVisible()
      await screens(page, 'qbo-inspection', page.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true }))
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('Report', { exact: true }).selectOption('tax')
      await expect(page.locator('.page')).toContainText('Wake combined')
      await screens(page, 'tax-report', page.getByLabel('Report', { exact: true }))
      await page.getByLabel('Report branch', { exact: true }).selectOption(east.id)
      await expect(page.locator('.page')).not.toContainText('Austin combined')
      await screens(page, 'branch-tax-report', page.getByLabel('Report', { exact: true }))
      // These screens changed only their missing-zone fallback; use the saved US installation.
      for (const route of ['today', 'dispatch', 'jobs', 'activity', 'move-in', 'rules', 'stock']) {
        await page.goto(`${origin}/app#${route}`)
        await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
        await screens(page, route)
      }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await empty.close(); await h.close() }
})
