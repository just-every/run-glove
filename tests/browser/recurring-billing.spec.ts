import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production HTTP Worker, native sessions and D1.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function command(page: Page, button: Locator) {
  const pending = page.waitForResponse(response => response.url() === `${origin}/api/glove/commands` && response.request().method() === 'POST')
  await button.click()
  const body = await (await pending).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function screenshot(page: Page, width: number, name: string, target: Locator) {
  await target.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-recurring-${name}.png`), fullPage: true })
  }
}

test('PLAN-005, PLAN-012, PLAN-013 owner reviews fixed billing, changes a future price, approves a proposed monthly invoice late and pauses future billing at 1440/390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      await h.command('business.save', { name: 'Glove recurring service', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
      const customer = await h.command('customer.save', { name: 'Rosa Diaz', email: 'rosa@example.test' })
      const site = await h.command('site.save', { customerId: customer.id, address: '410 Erie Street, Austin TX 78704' })
      const tech = await h.command('technician.save', { name: 'Robin Field' })
      await h.request('/__test/clock', { method: 'POST', body: { at: '2025-10-01T15:00:00Z' } })
      const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: 'Quarterly PM billed monthly', lines: [{ description: 'Preventive maintenance', quantity: '1', unitPrice: '240.00', tax: 'FREE' }] })
      await h.command('series.create', { jobId: job.id, version: job.version, date: '2025-10-15', rule: { unit: 'month', interval: 3 }, technicianId: tech.id, start: '09:00', end: '10:00', until: '2025-11-30', horizonDays: 365, billing: { mode: 'fixed-monthly', lines: [{ description: 'Monthly PM fee', quantity: '1', unitPrice: '240.00', tax: 'FREE' }] } })
      await page.clock.install({ time: new Date('2025-10-01T15:00:00Z') })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(url => ['/app', '/setup'].includes(url.pathname) && !url.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(url => url.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const request = route.request(), url = new URL(request.url())
        const response = await h.request(url.pathname + url.search, { method: request.method(), ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#jobs`)
      await page.getByRole('button', { name: `${job.number} · ${job.title}`, exact: true }).click()
      const billing = page.getByRole('region', { name: `Recurring billing for ${job.number}`, exact: true })
      await expect(billing).toContainText('Fixed price at each month end')
      await screenshot(page, width, 'owner-rule', billing)
      let form = billing.getByRole('form', { name: 'Recurring invoicing rule', exact: true })
      await form.getByLabel('Billing from', { exact: true }).fill('2025-11-01')
      await form.getByLabel('Recurring line 1 unit price before tax', { exact: true }).fill('260.00')
      await form.getByLabel('Reason for billing rule', { exact: true }).fill('New monthly price from November')
      await command(page, form.getByRole('button', { name: 'Save invoicing rule', exact: true }))
      await expect(billing).toContainText('From 2025-11-01')
      await screenshot(page, width, 'future-price', billing)
      await h.request('/__test/clock', { method: 'POST', body: { at: '2025-11-01T04:59:00Z' } })
      await page.clock.setFixedTime(new Date('2025-11-01T04:59:00Z'))
      await command(page, billing.getByRole('button', { name: 'Check recurring billing', exact: true }))
      const invoice = (await h.state()).invoices.find((row: any) => row.jobId === job.id)
      expect(invoice.revisions[0].totals.total).toBe('240.00')
      await expect(billing).toContainText('Proposed — not approved, not sent')
      await screenshot(page, width, 'proposed-monthly', billing)
      await billing.getByRole('link', { name: invoice.number, exact: true }).click()
      await expect(page.getByRole('heading', { name: `${invoice.number} · Rosa Diaz`, exact: true })).toBeVisible()
      await h.request('/__test/clock', { method: 'POST', body: { at: '2025-11-03T18:00:00Z' } })
      await page.clock.setFixedTime(new Date('2025-11-03T18:00:00Z'))
      await command(page, page.getByRole('button', { name: /^Approve revision 1 at/ }))
      await expect(page.getByText(/Issued 2025-10-31 · Due 2025-11-17/)).toBeVisible()
      await expect(page.getByText(/approved after period end/i).first()).toBeVisible()
      await screenshot(page, width, 'late-approved', page.getByRole('heading', { name: `${invoice.number} · Rosa Diaz`, exact: true }))
      await page.goto(`${origin}/app#jobs`)
      await page.getByRole('button', { name: `${job.number} · ${job.title}`, exact: true }).click()
      form = billing.getByRole('form', { name: 'Recurring invoicing rule', exact: true })
      await form.getByLabel('Billing from', { exact: true }).fill('2025-11-30')
      await form.getByRole('checkbox', { name: 'Pause billing from this date', exact: true }).check()
      await form.getByLabel('Reason for billing rule', { exact: true }).fill('Owner pauses November billing')
      await command(page, form.getByRole('button', { name: 'Save invoicing rule', exact: true }))
      await expect(billing).toContainText('paused')
      await h.request('/__test/clock', { method: 'POST', body: { at: '2025-12-01T05:30:00Z' } })
      await command(page, billing.getByRole('button', { name: 'Check recurring billing', exact: true }))
      expect((await h.state()).invoices.filter((row: any) => row.jobId === job.id)).toHaveLength(1)
      await screenshot(page, width, 'paused', billing)
      expect(h.email.sent).toHaveLength(0)
    } finally {
      // Closing the browser does not wait for asynchronous route handlers.
      // Finish their Worker requests before disposing the installation.
      await page.unrouteAll({ behavior: 'wait' })
      await context.close()
      await h.close()
    }
  }
})

test('PLAN-012 Office follows the retained PO problem and explicitly approves the same recurring draft', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    await h.command('business.save', { name: 'Glove recurring service', currency: 'USD', timezone: 'America/Chicago', paymentTermsDays: 14 })
    const office = await h.person('Riley Office', 'office')
    const customer = await h.command('customer.save', { name: 'Synthetic Glove PO customer', requirePo: true })
    const site = await h.command('site.save', { customerId: customer.id, address: '410 Erie Street, Austin TX 78704' })
    const tech = await h.command('technician.save', { name: 'Robin Field' })
    const setClock = async (at: string) => {
      await h.request('/__test/clock', { method: 'POST', body: { at } })
      await page.clock.setFixedTime(new Date(at))
    }
    await page.clock.install({ time: new Date('2025-01-01T16:00:00Z') })
    await setClock('2025-01-01T16:00:00Z')
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: 'PO-required monthly maintenance', lines: [{ description: 'Preventive maintenance', quantity: '1', unitPrice: '240.00', tax: 'FREE' }] })
    await h.command('series.create', { jobId: job.id, version: job.version, date: '2025-01-01', rule: { unit: 'month' }, technicianId: tech.id, start: '09:00', end: '10:00', until: '2025-01-31', horizonDays: 365 })
    if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(url => ['/app', '/setup'].includes(url.pathname) && !url.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(url => url.pathname === '/app') }
    let as = h.owner()
    await page.route(`${origin}/api/glove/**`, async route => {
      const request = route.request(), url = new URL(request.url())
      const response = await h.request(url.pathname + url.search, { method: request.method(), as, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const openBilling = async () => {
      await page.goto(`${origin}/app#jobs`)
      await page.getByRole('button', { name: `${job.number} · ${job.title}`, exact: true }).click()
    }
    const billing = page.getByRole('region', { name: `Recurring billing for ${job.number}`, exact: true })
    await openBilling()
    const rule = billing.getByRole('form', { name: 'Recurring invoicing rule', exact: true })
    await rule.getByLabel('Invoice rule', { exact: true }).selectOption('fixed-monthly')
    await rule.getByLabel('Billing from', { exact: true }).fill('2025-01-01')
    await rule.getByLabel('Recurring line 1 description', { exact: true }).fill('Monthly maintenance')
    await rule.getByLabel('Recurring line 1 unit price before tax', { exact: true }).fill('240.00')
    await rule.getByLabel('Recurring line 1 tax', { exact: true }).selectOption('FREE')
    await rule.getByRole('checkbox', { name: 'Authorize automatic approval of these fixed invoices', exact: true }).check()
    await rule.getByLabel('Reason for billing rule', { exact: true }).fill('Owner authorizes the fixed monthly rule')
    await command(page, rule.getByRole('button', { name: 'Save invoicing rule', exact: true }))
    await setClock('2025-01-31T18:00:00Z')
    await h.scheduled('2025-01-31T18:00:00Z')
    const original = (await h.state()).invoices.find((row: any) => row.jobId === job.id)
    expect(original.autoApprovalRefused.code).toBe('PO_REQUIRED')
    as = office.cookie
    await page.reload(); await openBilling()
    const review = billing.getByRole('status'), reason = 'This customer requires a purchase-order number on its invoices. Enter it to approve.'
    await expect(review).toContainText(reason)
    await expect(review.getByRole('link', { name: `Review ${original.number}`, exact: true })).toHaveAttribute('href', `#invoices/${original.id}`)
    await expect(rule).toHaveCount(0)
    await command(page, billing.getByRole('button', { name: 'Check recurring billing', exact: true }))
    await expect(review).toContainText(reason)
    await h.restart(); await setClock('2025-01-31T18:00:00Z')
    await page.reload(); await openBilling()
    await expect(review).toContainText(reason)
    expect((await h.state()).invoices.filter((row: any) => row.jobId === job.id)).toHaveLength(1)
    const proof = async (name: string, target: Locator) => {
      await screenshot(page, 1440, name, target)
      if (process.env.GLOVE_SCREENSHOTS) {
        await page.setViewportSize({ width: 390, height: 1050 })
        await screenshot(page, 390, name, target)
        await page.setViewportSize({ width: 1440, height: 1050 })
      }
    }
    await proof('po-review', review)
    await review.getByRole('link', { name: `Review ${original.number}`, exact: true }).click()
    const detail = page.getByRole('region', { name: `${original.number} · Synthetic Glove PO customer`, exact: true })
    await expect(detail).toContainText('Proposed — not approved, not sent')
    const pending = page.waitForResponse(response => response.url() === `${origin}/api/glove/commands` && response.request().method() === 'POST')
    await detail.getByRole('button', { name: /^Approve revision 1 at/ }).click()
    expect((await (await pending).json()).error.code).toBe('PO_REQUIRED')
    await expect(detail.getByRole('alert')).toContainText(reason)
    await expect(detail.getByLabel('Purchase-order number', { exact: true })).toBeVisible()
    await proof('po-draft', detail)
    await detail.getByLabel('Purchase-order number', { exact: true }).fill('synthetic-glove-40')
    const approved = await command(page, detail.getByRole('button', { name: /^Approve revision 1 at/ }))
    expect(approved.id).toBe(original.id)
    await expect(detail).toContainText('Purchase order synthetic-glove-40')
    await expect(detail).toContainText('approved by Riley Office')
    await expect(detail.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
    await proof('po-approved', detail)
    await page.reload(); await openBilling()
    await expect(billing.getByRole('link', { name: original.number, exact: true })).toBeVisible()
    await expect(billing.getByRole('status')).toHaveCount(0)
    await command(page, billing.getByRole('button', { name: 'Check recurring billing', exact: true }))
    await expect(billing.getByRole('status')).toHaveCount(0)
    const invoices = (await h.state()).invoices.filter((row: any) => row.jobId === job.id)
    expect(invoices).toHaveLength(1)
    expect(invoices[0].id).toBe(original.id)
    expect(invoices[0].poNumber).toBe('synthetic-glove-40')
    expect(invoices[0].revisions).toHaveLength(1)
    expect(h.email.sent).toHaveLength(0)
  } finally {
    await page.unrouteAll({ behavior: 'wait' })
    await context.close()
    await h.close()
  }
})
