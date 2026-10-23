import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker and provider-edge fixtures.
import { installation, business, mailEvents } from '../api/harness.mjs'
// @ts-expect-error Real invoice command flow.
import { paidInvoice } from '../fixtures/payment-journey.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test('PAY-005 and QUOTE-004 show automatic email progress, provider acceptance and stopped states at 1440 and 390', async ({ browser }) => {
  const h = await installation(), context = await browser.newContext(), page = await context.newPage()
  try {
    const b = await business(h, { currency: 'USD', timezone: 'UTC' }), signer = mailEvents('sendgrid')
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: signer.eventKey, fromEmail: 'office@example.test' })
    const date = new Date().toISOString().slice(0, 10), past = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    await h.request('/__test/clock', { method: 'POST', body: { at: `${past}T10:00:00Z` } })
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Heater repair', lines: [{ description: 'Repair heater', quantity: '1', unitPrice: '100.00', tax: 'FREE' }] })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    q = await h.command('quote.markSent', { quoteId: q.id, version: q.version, revision: 1, channel: 'email' })
    await h.request('/__test/clock', { method: 'POST', body: { at: `${date}T10:00:00Z` } })
    const inv = await paidInvoice(h, b, date)
    const templates = Object.fromEntries(['confirmation', 'moved', 'cancelled', 'visitReminder', 'paymentReminder', 'quoteFollowup'].map(k => [k, 'Please contact us about {{number}}.']))
    await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, templates, visitHours: [], paymentDays: [-14], quoteDays: [1] })
    for (const purpose of ['payments', 'quotes']) {
      const c = (await h.state()).customers.find((c: any) => c.id === b.customer.id)
      await h.command('reminder.consent', { customerId: c.id, version: c.version, purpose, enabled: true, reference: 'Customer requested these emails' })
    }
    await h.scheduled(`${date}T10:00:00Z`)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), u = new URL(req.url())
      const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const capture = async (width: number, label: string, selector: string) => {
      await page.locator(selector).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const iconOnly = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])')).map(n => n.getAttribute('aria-label')))
      expect(iconOnly).toEqual([])
      if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-reminders-${label}.png`) }) }
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await page.goto(`${origin}/app#invoices/${inv.id}`)
      const invoiceEmail = page.getByRole('region', { name: `Email ${inv.number}`, exact: true })
      await expect(invoiceEmail).toContainText('1 reminder steps reserved')
      await expect(invoiceEmail).toContainText('Accepted by SendGrid; delivery not yet reported')
      await capture(width, 'invoice', `[aria-label="Email ${inv.number}"]`)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${q.number} · Heater repair`, exact: true }).click()
      const quoteEmail = page.getByRole('region', { name: `Email ${q.number}`, exact: true })
      await expect(quoteEmail).toContainText('1 of 1 quote follow-up steps reserved')
      await expect(quoteEmail).toContainText('Accepted by SendGrid; delivery not yet reported')
      await capture(width, 'quote', `[aria-label="Email ${q.number}"]`)
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('Aging as of', { exact: true }).fill(date)
      await expect(page.getByRole('region', { name: 'Receivables aging', exact: true })).toContainText('1 reminder steps reserved')
      await capture(width, 'aging', '[aria-labelledby="aging-title"]')
    }
    await h.command('invoice.dispute', { invoiceId: inv.id, version: (await h.state()).invoices.find((i: any) => i.id === inv.id).version, disputed: true, reason: 'Customer questions the balance' })
    await h.command('quote.decline', { quoteId: q.id, version: q.version, revision: 1, method: 'phone', customerName: 'Customer', reason: 'Declined' })
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await page.goto(`${origin}/app#invoices/${inv.id}`)
      await expect(page.getByRole('region', { name: `Email ${inv.number}`, exact: true })).toContainText('Stopped: invoice disputed')
      await capture(width, 'invoice-stopped', `[aria-label="Email ${inv.number}"]`)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${q.number} · Heater repair`, exact: true }).click()
      await expect(page.getByRole('region', { name: `Email ${q.number}`, exact: true })).toContainText('Stopped: customer answered')
      await capture(width, 'quote-stopped', `[aria-label="Email ${q.number}"]`)
      await page.goto(`${origin}/app#reports`)
      await expect(page.getByRole('region', { name: 'Receivables aging', exact: true })).toContainText('Stopped: invoice disputed')
      await capture(width, 'aging-stopped', '[aria-labelledby="aging-title"]')
    }
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
