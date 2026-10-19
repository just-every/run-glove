import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Shared fixture drives the production HTTP Worker and D1.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-branches-${name}.png`) })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('TEAM-002 + API-002 owner limits a dispatcher to a branch and issues a branch token; the board and every report follow the limit at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    const b = await business(h)
    const branches = []
    for (const [name, prefix, timezone, zip, person, price] of [
      ['Raleigh', 'RAL', 'America/New_York', '27601', b.priyaPerson, '125.00'],
      ['Phoenix', 'PHX', 'America/Phoenix', '85001', b.tomPerson, '275.00'],
    ] as const) {
      const branch = await h.command('branch.save', { name, prefix, timezone, zips: [zip] })
      const customer = await b.office.run('customer.save', { name: `${name} School` })
      const site = await b.office.run('site.save', { customerId: customer.id, address: `${name === 'Raleigh' ? '101 Fayetteville St, Raleigh NC' : '1 Central Ave, Phoenix AZ'} ${zip}`, branchId: branch.id })
      const oldTech = person.id === b.priyaPerson.id ? b.priya : b.tom
      const tech = await h.command('technician.save', { id: oldTech.id, version: oldTech.version, name: person.name, operatorId: person.id, branchId: branch.id })
      const enquiry = await b.office.run('enquiry.create', { customerId: customer.id, siteId: site.id, description: 'Inspect the rooftop system', source: 'phone' })
      const q = await b.dispatcher.run('quote.draft', { enquiryId: enquiry.id, customerId: customer.id, siteId: site.id, title: `${name} rooftop inspection`, lines: [{ description: 'Inspection', quantity: '1', unitPrice: price, tax: 'FREE' }] })
      const a = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await b.dispatcher.run('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
      const job = await b.dispatcher.run('job.create', { quoteId: q.id })
      const date = new Date().toISOString().slice(0, 10)
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Inspected rooftop equipment', signoff: { absentReason: 'Manager at another property' } })
      const inv = await b.office.run('invoice.prepare', { jobId: job.id })
      await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
      branches.push(branch)
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    let as: string | undefined
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      await page.goto(process.env.GLOVE_OPEN)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      // Only the transport is forwarded: all data and role decisions come from production handlers.
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), u = new URL(req.url())
        const r = await h.request(u.pathname + u.search, { method: req.method(), ...(as ? { as } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: r.status, contentType: r.headers.get('content-type') ?? 'application/json', body: Buffer.from(await r.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#team`)
      const limit = page.getByLabel(`Branch access for ${b.dispatcher.name}`, { exact: true })
      await limit.selectOption(branches[0].id)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(limit).toHaveValue(branches[0].id)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await limit.scrollIntoViewIfNeeded(); await shot(page, width, 'people') }
      // API-002: the owner issues a Viewer token for Raleigh, sees it once, and revokes it.
      const tokens = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Integration tokens', exact: true }) })
      await tokens.getByLabel('Name', { exact: true }).fill('Raleigh board')
      await tokens.getByLabel('Acts as', { exact: true }).selectOption('viewer')
      await tokens.getByLabel('Branch', { exact: true }).selectOption(branches[0].id)
      await tokens.getByRole('button', { name: 'Issue token', exact: true }).click()
      await expect(tokens.getByRole('status')).toContainText('never shows it again')
      await expect(tokens.locator('code.secret')).toHaveText(/^glv_[A-Za-z0-9_-]{43}$/)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await tokens.scrollIntoViewIfNeeded(); await shot(page, width, 'token-issued') }
      await tokens.getByRole('button', { name: 'I have copied it', exact: true }).click()
      await expect(tokens.locator('code.secret')).toHaveCount(0)
      await expect(tokens).toContainText('Acts as Viewer · Raleigh only')
      await tokens.getByRole('button', { name: 'Revoke', exact: true }).click()
      await expect(tokens.getByText('Revoked', { exact: true })).toBeVisible()
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await tokens.scrollIntoViewIfNeeded(); await shot(page, width, 'token-revoked') }
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('From', { exact: true }).fill('2026-01-01')
      await page.getByLabel('To', { exact: true }).fill('2027-12-31')
      await page.getByLabel('Report branch', { exact: true }).selectOption(branches[0].id)
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('$125.00')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).not.toContainText('Phoenix')
      for (const kind of ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax']) {
        await page.getByLabel('Report', { exact: true }).selectOption(kind)
        await expect(page.getByLabel('Report branch', { exact: true })).toHaveValue(branches[0].id)
        for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await page.getByLabel('Report', { exact: true }).scrollIntoViewIfNeeded(); await shot(page, width, kind) }
      }
      as = b.dispatcher.cookie
      await page.goto(`${origin}/app#jobs`)
      await expect(page.getByRole('heading', { name: 'Jobs', exact: true, level: 1 })).toBeVisible()
      await expect(page.locator('.glove-app')).toContainText('Raleigh rooftop inspection')
      await expect(page.locator('.glove-app')).not.toContainText('Phoenix rooftop inspection')
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await shot(page, width, 'limited-jobs') }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
