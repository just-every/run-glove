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
import { connectPayments, paidInvoice, paymentEvent, instantFunding } from '../fixtures/payment-journey.mjs'

test('PAY-002 confirmed payment and ACH return update the existing aging and collected-tax screens at 1440 and 390', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD', timezone: 'America/New_York', taxSettings: { jurisdictions: [{ id: 'synthetic-glove-tax', name: 'Combined tax', rate: '8.25', zips: [], taxLabor: true }], defaultJurisdictionId: 'synthetic-glove-tax' } })
    const cardInvoice = await paidInvoice(h, b, '2026-10-19')
    let invoice = await paidInvoice(h, b, '2026-10-20')
    await connectPayments(h)
    await h.command('payment.checkout', { invoiceId: cardInvoice.id, version: cardInvoice.version, method: 'card', tip: '15.00' })
    const cardIntent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    Object.assign(cardIntent, { status: 'succeeded', amount_received: cardIntent.amount, latest_charge: { id: 'synthetic-glove-card-browser', created: Math.floor(Date.now() / 1000), status: 'succeeded', balance_transaction: { fee: 681 } } })
    expect((await paymentEvent(h, cardIntent, 'payment_intent.succeeded')).status).toBe(200)
    await h.command('payment.checkout', { invoiceId: invoice.id, version: invoice.version, method: 'ach' })
    let intent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
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
    const todayTile = async (width: number, name: string, total: string) => {
      await page.goto(`${origin}/app#today`)
      const tile = page.getByRole('region', { name: 'Paid today (Stripe test mode)', exact: true })
      await expect(tile.locator('.tile-figure')).toHaveText(total)
      await expect(tile).toContainText('Tips $15.00 are separate')
      await tile.scrollIntoViewIfNeeded(); await capture(width, `today-${name}`)
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
      await todayTile(width, 'pending', '$204.59')
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
        await todayTile(width, 'settled', '$409.18')
        await page.goto(`${origin}/app#reports`)
        intent.latest_charge.status = 'failed'
        expect((await paymentEvent(h, intent, 'payment_intent.payment_failed')).status).toBe(200)
        await page.reload()
        await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
      }
      await expect(aging.getByRole('link', { name: invoice.number, exact: true })).toBeVisible()
      await expect(aging).toContainText('returned payments do not reduce balances')
      await aging.scrollIntoViewIfNeeded(); await capture(width, 'returned')
      await todayTile(width, 'returned', '$204.59')
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
      await aging.getByRole('link', { name: invoice.number, exact: true }).click()
      await expect(page.getByRole('heading', { name: `${invoice.number} · Harbourview Dental`, exact: true })).toBeVisible()
      await capture(width, 'invoice')
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('Report', { exact: true }).selectOption('tax')
      await page.getByLabel('From', { exact: true }).fill('2000-01-01')
      await page.getByLabel('To', { exact: true }).fill('2099-01-01')
      const tax = page.getByRole('region', { name: 'Sales tax', exact: true })
      await expect(tax).toContainText('tax collected from confirmed payments, net of returns; tips excluded')
      await expect(tax.getByRole('cell', { name: '$15.59', exact: true }).first()).toBeVisible()
      await tax.scrollIntoViewIfNeeded(); await capture(width, 'collected-tax')
      await page.goto(`${origin}/app#customers/${b.customer.id}`)
      await page.getByRole('button', { name: `History at ${b.site.address}`, exact: true }).click()
      const history = page.getByRole('region', { name: `History at ${b.site.address}`, exact: true })
      await expect(history).toContainText('Stripe test-mode ach payment')
      await expect(history).toContainText('returned')
      await history.getByRole('listitem').filter({ hasText: 'Stripe test-mode ach payment' }).first().scrollIntoViewIfNeeded()
      await capture(width, 'property-history')
      await page.goto(`${origin}/payment-return?result=submitted`)
      await expect(page.getByRole('heading', { name: 'Checkout closed', exact: true })).toBeVisible()
      await expect(page.locator('main')).toContainText('This page does not confirm a payment')
      await capture(width, 'checkout-return')
    }
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})

test('PAY-004 office payment and original-method refund controls, customer credit, receivables and overdue brief at 1440 and 390', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD', timezone: 'America/New_York', paymentTermsDays: 0 }); await connectPayments(h)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), u = new URL(req.url())
      // Read the brief tomorrow to prove a real past-due invoice without editing storage.
      const path = u.pathname + (u.pathname === '/api/glove/brief' ? '?at=2099-01-01T12:00:00Z' : u.search)
      const response = await h.request(path, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const send = async (name: string) => {
      const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await page.getByRole('button', { name, exact: true }).click()
      const body = await (await response).json(); expect(body.ok, JSON.stringify(body.error)).toBe(true)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      return body.result
    }
    const capture = async (width: number, label: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])')).map(n => n.getAttribute('aria-label')))).toEqual([])
      if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-balance-${label}.png`) }) }
    }
    for (const [index, width] of [1440, 390].entries()) {
      const inv = await paidInvoice(h, b, `2026-10-${22 + index}`), gross = Number(inv.revisions[0].totals.total)
      await page.setViewportSize({ width, height: 1050 })
      await page.goto(`${origin}/app#invoices/${inv.id}`)
      const panel = page.getByRole('region', { name: 'Payments and balance', exact: true })
      await expect(panel).toContainText(`Amount due $${gross.toFixed(2)}`)
      await page.getByLabel('Payment amount', { exact: true }).fill('30.00')
      await page.getByLabel('Payment method', { exact: true }).selectOption('check')
      await page.getByLabel('Receipt or check reference', { exact: true }).fill('synthetic-glove-11')
      const payment = await send('Record payment')
      await expect(panel).toContainText(`Amount due $${(gross - 30).toFixed(2)}`)
      await panel.scrollIntoViewIfNeeded(); await capture(width, 'recorded')
      await page.getByLabel('Original payment', { exact: true }).selectOption(payment.id)
      await page.getByLabel('Refund amount', { exact: true }).fill('10.00')
      await page.getByLabel('Refund reason', { exact: true }).fill('Check returned to customer')
      await send('Refund through original method')
      await expect(panel).toContainText(`Amount due $${(gross - 20).toFixed(2)}`)
      await expect(panel).toContainText('Refund · check · $10.00')
      await panel.getByText('Refund · check · $10.00', { exact: true }).scrollIntoViewIfNeeded(); await capture(width, 'refund')
      await page.goto(`${origin}/app#today`)
      const tile = page.getByRole('region', { name: 'Receivables', exact: true })
      await expect(tile).toContainText('Unpaid approved invoices')
      await tile.scrollIntoViewIfNeeded(); await capture(width, 'today')
      const overdue = page.getByRole('region', { name: 'Overdue invoices', exact: true })
      await expect(overdue).toContainText(`${inv.number} for Harbourview Dental: $${(gross - 20).toFixed(2)}`)
      await overdue.scrollIntoViewIfNeeded(); await capture(width, 'overdue')
      await overdue.getByRole('link', { name: 'Review overdue invoice', exact: true }).last().click()
      await expect(page.getByRole('heading', { name: `${inv.number} · Harbourview Dental`, exact: true })).toBeVisible()
      // Create an actual customer overpayment, then allocate through the visible form.
      await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'cash', reference: 'synthetic-glove-12', amount: gross.toFixed(2) })
      const target = await paidInvoice(h, b, `2026-10-${24 + index}`)
      await page.goto(`${origin}/app#invoices/${target.id}`)
      await page.getByLabel('Credit from invoice', { exact: true }).selectOption(inv.id)
      await page.getByLabel('Credit to apply', { exact: true }).fill('20.00')
      await send('Apply customer credit')
      await expect(panel).toContainText(`Amount due $${(gross - 20).toFixed(2)}`)
      await expect(panel).toContainText('Credit transfer · credit transfer · $20.00')
      await panel.scrollIntoViewIfNeeded(); await capture(width, 'credit')
      await page.goto(`${origin}/app#reports`)
      const aging = page.getByRole('region', { name: 'Receivables aging', exact: true })
      await page.getByLabel('Aging as of', { exact: true }).fill('2099-01-01')
      await expect(aging.getByRole('link', { name: target.number, exact: true })).toBeVisible()
      await expect(aging.getByRole('link', { name: inv.number, exact: true })).toHaveCount(0)
      await aging.scrollIntoViewIfNeeded(); await capture(width, 'aging')
      const tippedInvoice = await paidInvoice(h, b, `2026-11-${String(6 + index).padStart(2, '0')}`)
      const tippedPayment = await h.command('payment.checkout', { invoiceId: tippedInvoice.id, version: tippedInvoice.version, method: 'card', tip: '15.00' })
      const tippedIntent = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
      Object.assign(tippedIntent, { status: 'succeeded', amount_received: tippedIntent.amount, latest_charge: { id: `synthetic-glove-tip-refund-${width}`, created: Math.floor(Date.now() / 1000), status: 'succeeded', balance_transaction: { fee: 500 } } })
      expect((await paymentEvent(h, tippedIntent, 'payment_intent.succeeded')).status).toBe(200)
      await page.goto(`${origin}/app#invoices/${tippedInvoice.id}`)
      await page.getByLabel('Original payment', { exact: true }).selectOption(tippedPayment.id)
      await page.getByLabel('Refund amount', { exact: true }).fill('0.00'); await page.getByLabel('Tip to refund', { exact: true }).fill('15.00'); await page.getByLabel('Refund reason', { exact: true }).fill('Customer tip returned')
      await send('Refund through original method')
      await expect(panel).toContainText('Amount due $0.00'); await expect(panel).toContainText('Tip refunded $15.00')
      await page.getByLabel('Tip to refund', { exact: true }).scrollIntoViewIfNeeded(); await capture(width, 'tip-refund')
    }
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})

test('PAY-007 owner inspects unmatched payouts, confirms the visible instant fee and groups cash/check deposits at 1440 and 390', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD' }); await connectPayments(h)
    const inv = await paidInvoice(h, b, '2026-10-20')
    await h.command('payment.checkout', { invoiceId: inv.id, version: inv.version, method: 'card' })
    const pi = h.stripePayments.intents.get(h.stripePayments.sessions.at(-1).intentId)
    Object.assign(pi, { status: 'succeeded', amount_received: pi.amount, latest_charge: { id: 'synthetic-glove-payout-browser-charge', created: Math.floor(Date.now() / 1000), status: 'succeeded', balance_transaction: { fee: 500 } } })
    await paymentEvent(h, pi, 'payment_intent.succeeded')
    const payoutId = 'synthetic-glove-payout-browser', tx = [{ id: 'synthetic-glove-balance-browser', type: 'charge', source: { id: pi.latest_charge.id }, currency: 'usd', amount: pi.amount, fee: 500, net: pi.amount - 500 }]
    h.stripePayments.payouts.set(payoutId, { id: payoutId, amount: pi.amount - 500, currency: 'usd', method: 'standard', automatic: true, status: 'paid', livemode: false, balance_transaction: { fee: 0 } })
    h.stripePayments.transactions.set(payoutId, { data: tx, has_more: false })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), u = new URL(req.url()), response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const send = async (name: string) => { const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST'); await page.getByRole('button', { name, exact: true }).click(); const body = await (await response).json(); expect(body.ok, JSON.stringify(body.error)).toBe(true); await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false'); return body.result }
    const capture = async (width: number, label: string) => { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])')).map(n => n.getAttribute('aria-label')))).toEqual([]); if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-payout-${label}.png`) }) } }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 }); await page.goto(`${origin}/app#invoices`)
      const panel = page.getByRole('region', { name: 'Payouts and deposits', exact: true })
      await page.getByLabel('Stripe payout reference', { exact: true }).fill(payoutId); await send('Inspect Stripe payout')
      if (width === 1440) { await expect(panel).toContainText('Reconciled to the cent'); await panel.scrollIntoViewIfNeeded(); await capture(width, 'reconciled'); tx.push({ id: 'synthetic-glove-missing-browser', type: 'charge', source: { id: 'synthetic-glove-unknown-source' }, currency: 'usd', amount: 1234, fee: 37, net: 1197 }); h.stripePayments.payouts.get(payoutId).amount += 1197; await send('Inspect Stripe payout') }
      await expect(panel).toContainText('missing payment'); await panel.getByText('synthetic-glove-unknown-source: missing payment', { exact: true }).scrollIntoViewIfNeeded(); await capture(width, 'unmatched')
      await panel.locator('summary').click()
      await page.getByLabel('Fee basis points', { exact: true }).fill('150'); await page.getByLabel('Minimum payout fee', { exact: true }).fill('0.50'); await page.getByLabel('Fee schedule source', { exact: true }).fill('Account-specific test schedule'); await send('Record fee schedule')
      const funding = await instantFunding(h, b, width === 1440 ? '2026-11-01' : '2026-11-02'); await page.reload(); await panel.getByLabel(`Source ${funding.invoice.number} · $1,030.00 · fee $15.00`, { exact: true }).check()
      await page.getByLabel('Instant payout amount', { exact: true }).fill('1000.00'); await page.getByLabel('Stripe debit card reference', { exact: true }).fill('synthetic-glove-debit-1'); await send('Review Instant Payout fee')
      const confirmation = page.getByRole('region', { name: 'Instant Payout confirmation', exact: true })
      await expect(confirmation).toContainText('Expected fee $15.00'); await expect(confirmation).toContainText('not verified by Glove'); await confirmation.scrollIntoViewIfNeeded(); await capture(width, 'fee-confirmation')
      const instant = await send('Confirm test Instant Payout')
      await page.getByLabel('Stripe payout reference', { exact: true }).fill(instant.providerId); await send('Inspect Stripe payout')
      await expect(panel).toContainText('Stripe does not attribute source payments'); await panel.getByText('Stripe does not attribute source payments', { exact: false }).last().scrollIntoViewIfNeeded(); await capture(width, 'instant-debit')
      await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, method: 'check', reference: 'synthetic-glove-check-browser', amount: '5.00' })
      await page.reload(); await panel.getByLabel(/check · .* · \$5.00/).check(); await page.getByLabel('Bank deposit reference', { exact: true }).fill(`Bank deposit ${width}`); await send('Record deposit batch')
      await expect(panel).toContainText('Cash/check deposit · $5.00'); await panel.getByText('Cash/check deposit · $5.00', { exact: true }).first().scrollIntoViewIfNeeded(); await capture(width, 'deposit-batch')
    }
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
