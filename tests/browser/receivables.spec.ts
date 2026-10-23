import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker/native sessions/D1 fixture.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Shared real command flow.
import { agingDay } from '../fixtures/receivables.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('REPORT-003 owner reads every aging bucket and follows the exact open invoice at 1440 and 390', async ({ browser }) => {
  const h = await installation()
  try {
    const { invoices, asOf } = await agingDay(h)
    const context = await browser.newContext(), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), u = new URL(req.url())
        const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await page.goto(`${origin}/app#reports`)
        const panel = page.getByRole('region', { name: 'Receivables aging', exact: true })
        await page.getByLabel('Aging as of', { exact: true }).fill(asOf)
        await expect(panel.getByRole('heading', { name: 'USD · $111.06 open', exact: true })).toBeVisible()
        await expect(panel).toContainText('No payments recorded yet')
        await expect(panel).toContainText('No reminders scheduled')
        for (const label of ['Current', '1–30 days', '31–60 days', '61–90 days', 'Over 90 days']) await expect(panel).toContainText(label)
        await panel.scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-receivables-aging.png`) }) }
        await panel.getByRole('link', { name: invoices[0].number, exact: true }).click()
        await expect(page.getByRole('heading', { name: `${invoices[0].number} · Rosa Diaz`, exact: true })).toBeVisible()
        await expect(page.locator('.page')).toContainText(`Due ${invoices[0].dates.dueOn}`)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        if (process.env.GLOVE_SCREENSHOTS) await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-receivables-invoice.png`) })
      }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})

// @ts-expect-error Real command/provider-edge fixture, no UI mocks.
import { business } from '../api/harness.mjs'
// @ts-expect-error Shared production-door payment journey.
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'

test('PAY-002 confirmed payment and ACH return update the existing aging and collected-tax screens at 1440 and 390', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD', timezone: 'America/New_York', taxSettings: { jurisdictions: [{ id: 'synthetic-glove-tax', name: 'Combined tax', rate: '8.25', zips: [], taxLabor: true }], defaultJurisdictionId: 'synthetic-glove-tax' } })
    let invoice = await paidInvoice(h, b, '2026-10-20')
    await connectPayments(h)
    await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'ach' })
    let intent = h.stripePayments.intents.get(h.stripePayments.sessions[0].intentId)
    intent.status = 'processing'
    expect((await paymentEvent(h, intent, 'payment_intent.processing')).status).toBe(200)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), u = new URL(req.url())
      const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const capture = async (width: number, label: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const iconOnly = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])')).map(n => n.getAttribute('aria-label')))
      expect(iconOnly).toEqual([]) // audited own screens: all controls have visible words.
      if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-payment-${label}.png`) }) }
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      // Begin each width with the original pending balance, then observe actual provider facts.
      if (width === 390) {
        invoice = await paidInvoice(h, b, '2026-10-21')
        await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'ach' })
        intent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
        intent.status = 'processing'
        expect((await paymentEvent(h, intent, 'payment_intent.processing')).status).toBe(200)
      }
      await page.goto(`${origin}/app#reports`)
      const aging = page.getByRole('region', { name: 'Receivables aging', exact: true })
      await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
      {
        await expect(aging.getByRole('link', { name: invoice.number, exact: true })).toBeVisible()
        await aging.scrollIntoViewIfNeeded(); await capture(width, 'pending')
        Object.assign(intent, { status: 'succeeded', amount_received: intent.amount, latest_charge: { id: 'synthetic-glove-charge-browser', created: Math.floor(Date.now() / 1000), status: 'succeeded', balance_transaction: { fee: 80 } } })
        expect((await paymentEvent(h, intent, 'payment_intent.succeeded')).status).toBe(200)
        await page.reload()
        await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
        await expect(aging.getByRole('link', { name: invoice.number, exact: true })).toHaveCount(0)
        await aging.scrollIntoViewIfNeeded(); await capture(width, 'settled')
        intent.latest_charge.status = 'failed'
        expect((await paymentEvent(h, intent, 'payment_intent.payment_failed')).status).toBe(200)
        await page.reload()
        await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
      }
      await expect(aging.getByRole('link', { name: invoice.number, exact: true })).toBeVisible()
      await expect(aging).toContainText('returned payments do not reduce balances')
      await aging.scrollIntoViewIfNeeded(); await capture(width, 'returned')
      await aging.getByRole('link', { name: invoice.number, exact: true }).click()
      await expect(page.getByRole('heading', { name: `${invoice.number} · Harbourview Dental`, exact: true })).toBeVisible()
      await capture(width, 'invoice')
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('Report', { exact: true }).selectOption('tax')
      await page.getByLabel('From', { exact: true }).fill('2000-01-01')
      await page.getByLabel('To', { exact: true }).fill('2099-01-01')
      const tax = page.getByRole('region', { name: 'Sales tax', exact: true })
      await expect(tax).toContainText('tax collected from confirmed payments, net of returns; tips excluded')
      await expect(tax.getByRole('cell', { name: '$0.00', exact: true }).first()).toBeVisible()
      await tax.scrollIntoViewIfNeeded(); await capture(width, 'collected-tax')
    }
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
