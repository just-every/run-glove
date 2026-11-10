import { closeHarnessContext, finishHarnessSetup, gotoHarness, harnessRoute, reloadHarness, restartHarness, unrouteHarness } from './harness-route'
import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Native Worker, sessions and D1 public-door fixture.
import { installation, business, assertTrail } from '../api/harness.mjs'
// @ts-expect-error Existing TEST Checkout and authenticated Stripe edge.
import { connectPayments, paidInvoice, paymentEvent } from '../fixtures/payment-journey.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const at = '2026-11-09T12:00:00.000Z'

test('PAY-023 Owner refunds and refreshes original-method outcomes with unchanged states after Worker restart', async ({ browser }) => {
  const h = await installation({ at }), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD', timezone: 'UTC' })
    await connectPayments(h)
    const invoice = await paidInvoice(h, b, '2026-10-20')
    const checkout = await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'card', tip: '15.00' })
    const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: 'synthetic-glove-browser-refund-charge', created: Date.parse(at) / 1000, status: 'succeeded', balance_transaction: { fee: 100 } } })
    expect((await paymentEvent(h, pi, 'payment_intent.succeeded', { at: Date.parse(at) / 1000 })).status).toBe(200)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    await gotoHarness(page, process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await finishHarnessSetup(page)
    }
    let as = h.owner()
    await harnessRoute(page, `${origin}/api/glove/**`, async route => {
      const request = route.request(), url = new URL(request.url())
      const response = await h.request(url.pathname + url.search, { as, method: request.method(), ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.setViewportSize({ width: 1440, height: 1050 })
    await gotoHarness(page, `${origin}/app#invoices/${invoice.id}`)
    const panel = page.getByRole('region', { name: 'Payments and balance', exact: true })
    const send = async (name: string, within = panel) => {
      const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await within.getByRole('button', { name, exact: true }).click()
      const body = await (await response).json()
      expect(body.ok, JSON.stringify(body.error)).toBe(true)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      return body.result
    }
    // Assertions run at the desktop width. Both proof widths show these same
    // actual provider states; no second financial journey runs on the phone.
    const capture = async (label: string) => {
      if (!process.env.GLOVE_SCREENSHOTS) return
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await panel.scrollIntoViewIfNeeded()
        await panel.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-refund-${label}.png`) })
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
    }
    const refund = async (amount: string, tip: string) => {
      await page.getByLabel('Original payment', { exact: true }).selectOption(checkout.id)
      await page.getByLabel('Refund amount', { exact: true }).fill(amount)
      await page.getByLabel('Tip to refund', { exact: true }).fill(tip)
      await page.getByLabel('Refund reason', { exact: true }).fill('Customer requested original-card return')
      return send('Refund through original method')
    }
    await expect(panel).toContainText('Amount due $0.00')
    h.stripePayments.refundStatus = 'pending'
    const pending = await refund('20.00', '5.00')
    const pendingRow = panel.getByRole('listitem').filter({ hasText: pending.providerReference })
    await expect(pendingRow).toContainText('pending')
    await expect(pendingRow.getByRole('button', { name: 'Refresh refund status', exact: true })).toBeVisible()
    await expect(panel).toContainText('Amount due $0.00')
    await capture('pending')
    const posts = () => h.stripePayments.calls.filter((c: any) => c.path === '/v1/refunds' && c.method === 'POST').length
    const count = posts()
    await restartHarness(h)
    await reloadHarness(page)
    await expect(pendingRow).toContainText('pending')
    await expect(panel).toContainText('Amount due $0.00')
    h.stripePayments.refunds.get(pending.providerReference).status = 'succeeded'
    await send('Refresh refund status', pendingRow)
    await expect(pendingRow).toContainText('paid')
    await expect(pendingRow.getByRole('button', { name: 'Refresh refund status', exact: true })).toHaveCount(0)
    await expect(panel).toContainText('Amount due $20.00')
    expect(posts()).toBe(count)
    await capture('confirmed')
    const failed = await refund('10.00', '0.00')
    h.stripePayments.refunds.get(failed.providerReference).status = 'failed'
    const failedRow = panel.getByRole('listitem').filter({ hasText: failed.providerReference })
    await send('Refresh refund status', failedRow)
    await expect(failedRow).toContainText('failed')
    await expect(failedRow.getByRole('button', { name: 'Refresh refund status', exact: true })).toHaveCount(0)
    await expect(panel).toContainText('Amount due $20.00')
    await capture('failed')
    h.stripePayments.status = 503
    await refund('10.00', '0.00')
    await expect(panel).toContainText('Outcome unknown. Inspect Stripe; do not send another refund.')
    await expect(panel).toContainText('reserved')
    await expect(panel).toContainText('Amount due $20.00')
    const retained = (await h.state()).payments
    await restartHarness(h)
    await reloadHarness(page)
    await expect(panel).toContainText('Outcome unknown. Inspect Stripe; do not send another refund.')
    await expect(failedRow).toContainText('failed')
    await expect(pendingRow).toContainText('paid')
    expect((await h.state()).payments).toEqual(retained)
    expect(posts()).toBe(count + 2)
    await capture('unknown-after-restart')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await panel.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim()).length)).toBe(0)
    const audit = await assertTrail(h, ['refund.requested', 'refund.refreshRequested', 'refund.paid', 'refund.failed', 'refund.unconfirmed'])
    expect(audit.activity.find((e: any) => e.kind === 'refund.requested').actorName).toBe('Olivia Owner')
    expect(JSON.stringify(audit)).not.toMatch(/checkout\.stripe\.com|stripe-signature|Bearer synthetic/)
    as = b.office.cookie
    await reloadHarness(page)
    await expect(panel.getByRole('button', { name: 'Refund through original method', exact: true })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Refresh refund status', exact: true })).toHaveCount(0)
  } finally {
    await unrouteHarness(page)
    await closeHarnessContext(context)
    await h.close()
  }
})
