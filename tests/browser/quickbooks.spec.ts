import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker harness is a JavaScript test fixture.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Business setup runs through the production command door.
import { quickbooksBusiness, qboInvoice } from '../fixtures/quickbooks-business.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function send(page: Page, control: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click(); const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function shots(page: Page, control: Locator, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 }); await control.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-quickbooks-${name}.png`) }) }
  }
}

test('QuickBooks owner connects and maps existing records, repairs a rejected invoice, syncs once and reads its payment at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    const b = await quickbooksBusiness(h), invoice = await qboInvoice(h, b)
    await h.command('qbo.connect', { key: null })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry from rer dev is required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.goto(`${origin}/app#team`)
    const settings = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    await settings.getByLabel('QuickBooks sandbox company ID', { exact: true }).fill('123')
    await settings.getByLabel('QuickBooks sandbox access token', { exact: true }).fill('synthetic-glove-901')
    await send(page, settings.getByRole('button', { name: 'Connect QuickBooks sandbox', exact: true }))
    expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain('synthetic-glove-901')
    await shots(page, settings.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }), 'connected')
    for (const [kind, id, remoteId] of [['customer', b.customer.id, '10'], ['service', b.service.id, '20']]) {
      await settings.getByLabel('Record type', { exact: true }).selectOption(kind)
      await settings.getByLabel('Glove record', { exact: true }).selectOption(id)
      await settings.getByLabel('Existing QuickBooks record ID', { exact: true }).fill(remoteId)
      await send(page, settings.getByRole('button', { name: 'Verify and link QuickBooks record', exact: true }))
    }
    await send(page, settings.getByRole('button', { name: 'Confirm existing QuickBooks links', exact: true }))
    await settings.getByLabel('QuickBooks tax code ID', { exact: true }).fill('40')
    await send(page, settings.getByRole('button', { name: 'Verify and save accounting references', exact: true }))
    await shots(page, settings.getByRole('heading', { name: 'Invoice accounting references', exact: true }), 'mapped')
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    const panel = page.getByRole('heading', { name: 'QuickBooks Online sandbox', exact: true }).locator('..')
    h.quickbooks.reject = 'Sales tax account is inactive'
    await send(page, panel.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    await expect(panel).toContainText('Sales tax account is inactive')
    await shots(page, panel, 'rejected')
    h.quickbooks.reject = null
    const posted = await send(page, panel.getByRole('button', { name: 'Retry QuickBooks invoice', exact: true }))
    await expect(panel).toContainText(`QuickBooks ID ${posted.remoteId}`)
    await shots(page, panel, 'confirmed')
    const writes = h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body).length
    await send(page, panel.getByRole('button', { name: 'Sync QuickBooks invoice', exact: true }))
    expect(h.quickbooks.calls.filter((r: any) => r.entity === 'invoice' && r.body)).toHaveLength(writes)
    h.quickbooks.record('payment', { Id: '90', CustomerRef: { value: '10' }, TotalAmt: Number(invoice.revisions[0].totals.total), UnappliedAmt: 0, Line: [{ Amount: Number(invoice.revisions[0].totals.total), LinkedTxn: [{ TxnId: posted.remoteId, TxnType: 'Invoice' }] }] })
    await page.goto(`${origin}/app#team`)
    await settings.getByLabel('QuickBooks payment ID', { exact: true }).fill('90')
    await send(page, settings.getByRole('button', { name: 'Read QuickBooks payment', exact: true }))
    await expect(settings).toContainText('Read QuickBooks payment 90.')
    await shots(page, settings.getByRole('heading', { name: 'Read a QuickBooks payment', exact: true }), 'payment-read')
    await page.goto(`${origin}/app#invoices/${invoice.id}`)
    await expect(page.getByRole('region', { name: 'Payments and balance', exact: true })).toContainText('Amount due $0.00')
    await shots(page, page.getByRole('heading', { name: 'Payments and balance', exact: true }), 'paid-invoice')
  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
