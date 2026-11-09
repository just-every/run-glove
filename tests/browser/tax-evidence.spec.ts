import { closeHarnessContext, finishHarnessSetup, gotoHarness, harnessRoute, reloadHarness, restartHarness, unrouteHarness } from './harness-route'
import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker, native sessions and durable D1 fixture.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test('MONEY-004 Reports states approved-invoice tax before and after ordinary payments and QuickBooks stays a download', async ({ browser }) => {
  const h = await installation({ at: '2026-10-30T12:00:00.000Z' }), context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    await h.command('business.save', { name: 'Tax evidence trades', timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'city', name: 'City tax', rate: '10', taxLabor: true, zips: ['78704'] }] } })
    const person = await h.person('Tax Technician', 'technician')
    const tech = await h.command('technician.save', { name: 'Tax Technician', operatorId: person.id })
    const customer = await h.command('customer.save', { name: 'Tax evidence customer' })
    const site = await h.command('site.save', { customerId: customer.id, address: '10 Service St, Austin TX 78704' })
    const job = await h.command('job.create', { customerId: customer.id, siteId: site.id, title: 'Tax evidence repair', lines: [{ description: 'Valve', quantity: '1', unitPrice: '100.00', tax: 'TAXABLE' }] })
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-10-30', start: '09:00', end: '10:00' })
    await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Valve installed', signoff: { absentReason: 'Customer away' } })
    const draft = await h.command('invoice.prepare', { jobId: job.id })
    const invoice = await h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await gotoHarness(page, process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await finishHarnessSetup(page) }
    await harnessRoute(context, origin + '/api/glove/**', async route => {
      const request = route.request(), url = new URL(request.url())
      const response = await h.request(url.pathname + url.search, { method: request.method(), ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await gotoHarness(page, origin + '/app#reports')
    await page.getByLabel('From', { exact: true }).fill('2026-10-30')
    await page.getByLabel('To', { exact: true }).fill('2026-10-30')
    await page.getByLabel('Report', { exact: true }).selectOption('tax')
    const panel = page.getByRole('region', { name: 'Sales tax', exact: true })
    const assertReport = async () => {
      await expect(panel).toContainText('Basis: tax on approved invoices; Glove records no payments yet.')
      await expect(panel.locator('tbody tr')).toHaveText(['Main businessCity tax2026-101$10.00', 'Main businessCity taxAll1$10.00'])
      await expect(panel).not.toContainText('Stripe test mode')
    }
    await assertReport()
    const capture = async (name: string) => {
      if (!process.env.GLOVE_SCREENSHOTS) return
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        await panel.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, width + '-tax-' + name + '.png') })
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
    }
    await capture('approved-invoices')
    await h.setTime('2026-11-02T12:00:00.000Z')
    await h.command('payment.record', { invoiceId: invoice.id, version: invoice.version, method: 'check', amount: '55.00', reference: 'synthetic-glove-163' })
    await h.command('payment.credit', { invoiceId: invoice.id, version: invoice.version, amount: '5.00', reference: 'Owner goodwill credit' })
    await restartHarness(h)
    await reloadHarness(page)
    await page.getByLabel('From', { exact: true }).fill('2026-10-30')
    await page.getByLabel('To', { exact: true }).fill('2026-10-30')
    await page.getByLabel('Report', { exact: true }).selectOption('tax')
    await assertReport()
    expect(await panel.locator('button,a').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim()).length)).toBe(0)
    await capture('ordinary-payment')
    await gotoHarness(page, origin + '/app#invoices/' + invoice.id)
    for (const [label, value] of [['QuickBooks customer ID', 'synthetic-glove-customer'], ['QuickBooks sales item ID', 'synthetic-glove-item'], ['QuickBooks tax code ID', 'synthetic-glove-tax']]) await page.getByLabel(label, { exact: true }).fill(value)
    const download = page.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true })
    await expect(download).toHaveAttribute('download', '')
    const href = await download.getAttribute('href'), outgoing = h.outbound.attempts
    // Fetch the real download control's URL; native downloads bypass route interception.
    const document = await page.evaluate(async href => { const response = await fetch(href!); return { status: response.status, body: await response.json() } }, href)
    expect(document.status).toBe(200)
    expect(document.body.TxnTaxDetail.TotalTax).toBe(10)
    expect(document.body.CustomerRef.value).toBe('synthetic-glove-customer')
    expect(h.outbound.attempts).toBe(outgoing)
  } finally { await unrouteHarness(context); await closeHarnessContext(context); await h.close() }
})
