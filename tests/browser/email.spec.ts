import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker, native sessions and D1; only provider edges are fake.
import { installation, business, completedJob, mailEvents, postEvents } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function send(page: Page, button: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function screen(page: Page, width: number, name: string, anchor: Locator) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-email-${name}.png`) })
  }
}

test('COMM-001 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation()
    const context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h)
      await h.command('business.save', { ...(await h.state()).business[0], name: 'Pacheco Plumbing & HVAC', currency: 'USD', timezone: 'America/Chicago' })
      await h.command('site.save', { ...b.site, address: '14 Harbour St, Austin TX 78701' })
      const c = await h.command('customer.save', { ...b.customer, billingAddress: '14 Harbour St, Austin TX 78701', email: 'mei@harbourview.example', apEmail: 'payables@harbourview.example' })
      const { job } = await completedJob(h, b)
      const draft = await h.command('quote.draft', { customerId: c.id, siteId: b.site.id, title: 'Replace condenser fan', lines: [{ description: 'Condenser fan', quantity: '1', unitPrice: '420.00', tax: 'FREE' }] })
      const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
      const invoiceDraft = await h.command('invoice.prepare', { jobId: job.id })
      const invoice = await h.command('invoice.approve', { invoiceId: invoiceDraft.id, version: invoiceDraft.version, revision: 1 })
      const material = await h.command('service.save', { code: 'FAN-MTR', name: 'Condenser fan motor', kind: 'material', unit: 'each', unitCost: '180.00', unitPrice: '420.00', tax: 'FREE' })
      const warehouse = await h.command('stock.location', { kind: 'warehouse', name: 'Austin warehouse' })
      const po = await h.command('po.save', { supplier: 'Austin HVAC Supply', supplierEmail: 'orders@supplyco.example', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '1' }] })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      const quoteEmail = page.getByRole('region', { name: `Email ${quote.number}`, exact: true })
      await expect(quoteEmail.getByRole('button', { name: 'Email quote', exact: true })).toBeDisabled()
      await screen(page, width, 'disconnected', quoteEmail)
      await page.goto(`${origin}/app#team`)
      const settings = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Customer email', exact: true }) }).last()
      const events = mailEvents('sendgrid')
      await settings.getByLabel('From address', { exact: true }).fill('office@pacheco.example')
      await settings.getByLabel('From name', { exact: true }).fill('Pacheco Plumbing & HVAC')
      await settings.getByLabel('API key', { exact: true }).fill('SG.test-only-browser-email')
      await settings.getByLabel('Event webhook verification key', { exact: true }).fill(events.eventKey)
      await send(page, settings.getByRole('button', { name: 'Save customer email', exact: true }))
      await expect(settings.getByLabel('API key', { exact: true })).toHaveValue('')
      await expect(settings.getByLabel('Event webhook verification key', { exact: true })).toHaveValue('')
      const morning = settings.getByRole('form', { name: 'Morning brief email' })
      await morning.getByLabel('Send at (business time)').fill('07:30')
      await send(page, morning.getByRole('button', { name: 'Email me the morning brief', exact: true }))
      expect((await h.state()).business[0].mail.morning).toEqual({ enabled: true, time: '07:30' })
      expect(h.email.sent).toHaveLength(0)
      await screen(page, width, 'settings-on', morning)
      await send(page, morning.getByRole('button', { name: 'Turn off', exact: true }))
      expect((await h.state()).business[0].mail.morning.enabled).toBe(false)
      await screen(page, width, 'settings-off', morning)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      const quoteMail = await send(page, quoteEmail.getByRole('button', { name: 'Email quote', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('mei@harbourview.example')
      await expect(quoteEmail).toContainText('Accepted by SendGrid')
      await expect(quoteEmail).not.toContainText('Delivered to')
      await screen(page, width, 'quote-accepted', quoteEmail)
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: invoice.number, exact: true }).click()
      const invoiceEmail = page.getByRole('region', { name: `Email ${invoice.number}`, exact: true })
      const invoiceMail = await send(page, invoiceEmail.getByRole('button', { name: 'Email invoice', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('payables@harbourview.example')
      await screen(page, width, 'invoice-accepted', invoiceEmail)
      await page.goto(`${origin}/app#stock`)
      const order = page.getByRole('article', { name: `${po.number} to Austin HVAC Supply`, exact: true })
      const poEmail = order.getByRole('region', { name: `Email ${po.number}`, exact: true })
      const poMail = await send(page, poEmail.getByRole('button', { name: 'Email purchase order', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('orders@supplyco.example')
      await expect(poEmail.getByRole('button', { name: 'Email purchase order', exact: true })).toHaveCount(0)
      const timestamp = Math.floor(Date.now() / 1000)
      expect((await postEvents(h, events.signed([quoteMail, invoiceMail, poMail].map((m, i) => ({ email: m.to, timestamp: timestamp + i, event: i === 1 ? 'bounce' : 'delivered', sg_event_id: `browser-${m.id}`, sg_message_id: `sg-receipt-${i + 1}.filter`, rer_delivery_id: m.id }))))).status).toBe(200)
      await page.reload()
      await expect(poEmail).toContainText("Delivered to orders@supplyco.example's mail server")
      await screen(page, width, 'po-delivered', poEmail)
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: invoice.number, exact: true }).click()
      await expect(invoiceEmail).toContainText('Bounced: payables@harbourview.example')
      await expect(invoiceEmail).toContainText('Check the address')
      await screen(page, width, 'invoice-bounced', invoiceEmail)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      await expect(quoteEmail).toContainText("Delivered to mei@harbourview.example's mail server")
      await screen(page, width, 'quote-delivered', quoteEmail)
      await page.goto(`${origin}/app#team`)
      await send(page, settings.getByRole('button', { name: 'Disconnect customer email', exact: true }))
      expect((await h.state()).mailConnected).toBe(false)
      await expect(settings.getByRole('button', { name: 'Disconnect customer email', exact: true })).toHaveCount(0)
      await screen(page, width, 'settings-disconnected', settings)
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
