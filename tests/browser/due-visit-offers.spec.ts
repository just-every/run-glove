import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real Worker, D1 and native authenticated public doors.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function proof(page: Page, screen: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-due-offer-${screen}.png`), fullPage: true })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
}

test('PLAN-010 customer sees only the included visit, chooses remaining open times and contacts the office when none remain', async ({ browser }) => {
  const h = await installation({ at: '2030-01-01T12:00:00.000Z' })
  const context = await browser.newContext()
  try {
    await h.command('business.save', { name: 'Synthetic Glove Service', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'synthetic-glove-1', name: 'Seasonal inspection', unitPrice: '100.00', tax: 'FREE' })
    const plan = await h.command('plan.save', { name: 'Seasonal Care', price: '200.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id })
    const office = await h.person('Synthetic Browser Office', 'office')
    const tech = await h.command('technician.save', { name: 'Synthetic private technician' })
    const customer = await h.command('customer.save', { name: 'Synthetic private member', billingAddress: 'Private billing address', contact: 'Private contact' })
    const site = await h.command('site.save', { customerId: customer.id, address: '12 Synthetic Street', accessNotes: 'Private gate code' })
    const agreement = await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: '2029-12-01' })
    const other = await h.command('customer.save', { name: 'Synthetic other customer' })
    const otherSite = await h.command('site.save', { customerId: other.id, address: '99 Other Street' })
    const competing = await h.command('job.create', { customerId: other.id, siteId: otherSite.id, title: 'Private competing repair' })
    const slots = [
      { date: '2030-01-20', start: '08:00', end: '08:30', technicianId: tech.id },
      { date: '2030-01-20', start: '09:00', end: '09:30', technicianId: tech.id },
    ]
    const link = await office.run('agreement.offer', { agreementId: agreement.id, index: 0, slots })
    const page = await context.newPage()
    await page.setViewportSize({ width: 1440, height: 1000 })
    if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    // Serve the built customer document; forward only API transport to the real isolated Worker.
    const transports: { path: string; search: string; authorization?: string; body: string | null }[] = []
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url()), authorization = req.headers()['authorization']
      transports.push({ path: url.pathname, search: url.search, authorization, body: req.postData() })
      const response = await h.request(url.pathname + url.search, { method: req.method(), as: '', headers: authorization ? { authorization } : {}, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const open = async () => {
      await page.goto(`${origin}/book#token=${link.token}`)
      await expect(page.getByRole('heading', { name: 'Seasonal inspection', exact: true })).toBeVisible()
    }
    await open()
    const region = page.getByRole('region', { name: 'Choose an included visit', exact: true })
    await expect(region).toContainText('12 Synthetic Street')
    await expect(region.getByRole('listitem')).toHaveCount(2)
    for (const item of await region.getByRole('listitem').all()) await expect(item).toContainText('America/Chicago')
    await expect(region.getByRole('button', { name: 'Book 8:00 AM – 8:30 AM', exact: true })).toBeVisible()
    await expect(region.getByRole('button', { name: 'Book 9:00 AM – 9:30 AM', exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/Private|Synthetic other customer|99 Other Street|Synthetic private member|Synthetic private technician/)
    expect(transports.at(-1)).toMatchObject({ path: '/api/glove/public/booking', search: '', authorization: `Bearer ${link.token}`, body: null })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await proof(page, 'open')
    await h.command('visit.book', { jobId: competing.id, ...slots[0] })
    await region.getByRole('button', { name: 'Book 8:00 AM – 8:30 AM', exact: true }).click()
    await expect(region.getByRole('alert')).toContainText('That slot is no longer available')
    await expect(region.getByRole('listitem')).toHaveCount(1)
    await expect(region.getByRole('button', { name: 'Book 9:00 AM – 9:30 AM', exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/Private competing|Synthetic other customer|99 Other Street/)
    expect((await h.state()).visits.filter((v: any) => v.jobId === link.jobId)).toHaveLength(0)
    await proof(page, 'remaining')
    // Another booking consumes the last offer after it was displayed.
    const competingAgain = await h.command('job.create', { customerId: other.id, siteId: otherSite.id, title: 'Private second repair' })
    const occupied = await h.command('visit.book', { jobId: competingAgain.id, ...slots[1] })
    await region.getByRole('button', { name: 'Book 9:00 AM – 9:30 AM', exact: true }).click()
    await expect(region.getByRole('button', { name: /^Book / })).toHaveCount(0)
    await expect(region).toContainText(/Contact the business for more times; your included visit remains due/)
    expect((await h.request('/api/glove/due-visits').then((r: Response) => r.json())).visits.find((v: any) => v.agreementId === agreement.id).booked).toBe(false)
    await proof(page, 'no-open-times')
    await h.restart()
    await open()
    await expect(region).toContainText('your included visit remains due')
    await h.command('visit.cancel', { visitId: occupied.id, version: occupied.version, reason: 'Customer can choose the reopened time' })
    await open()
    await region.getByRole('button', { name: 'Book 9:00 AM – 9:30 AM', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your visit is booked', exact: true })).toBeVisible()
    await expect(region.getByRole('status')).toContainText('9:00 AM – 9:30 AM (America/Chicago)')
    expect((await h.state()).visits.filter((v: any) => v.jobId === link.jobId)).toHaveLength(1)
    await proof(page, 'booked')
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('This booking link is unavailable')
    await expect(page.getByRole('button', { name: /^Book / })).toHaveCount(0)
  } finally {
    await context.close()
    await h.close()
  }
})
