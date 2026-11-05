import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker with real sessions and persistent D1.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('STOCK-001 native stock controls, Low boundaries, offline use and cumulative van parts survive reload', async ({ browser }) => {
  const h = await installation({ at: '2026-10-21T08:00:00.000Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage(), phone = await context.newPage()
  let offline = false
  try {
    const b = await business(h, { timezone: 'UTC' })
    const cap = await h.command('service.save', { code: 'CAP-455', name: 'Run capacitor', kind: 'material', unit: 'each', unitCost: '12.00', unitPrice: '38.00', tax: 'GST' })
    const jobFor = async (title: string, date: string, start: string, quantity: string) => {
      let q = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, lines: [{ serviceId: cap.id, description: 'Run capacitor', quantity, unitPrice: '38.00' }] })
      q = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await b.dispatcher.run('quote.accept', { quoteId: q.id, version: q.version, revision: 1, method: 'phone', customerName: 'Synthetic customer' })
      const job = await b.dispatcher.run('job.create', { quoteId: q.id })
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start, end: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00` })
      return { job, visit }
    }
    const first = await jobFor('First use', '2026-10-21', '09:00', '2')
    const second = await jobFor('Second use', '2026-10-21', '11:00', '1')
    const tomorrowA = await jobFor('Tomorrow first', '2026-10-22', '08:00', '2')
    const tomorrowB = await jobFor('Tomorrow second', '2026-10-22', '13:00', '1')
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    for (const [tab, as] of [[page, h.owner()], [phone, b.priyaPerson.cookie]] as const) {
      await tab.clock.setFixedTime(new Date('2026-10-21T08:00:00.000Z'))
      await tab.route(`${origin}/api/glove/**`, async route => {
        if (tab === phone && offline) { await route.abort('internetdisconnected'); return }
        const req = route.request(), u = new URL(req.url())
        const res = await h.request(u.pathname + u.search, { as, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) })
      })
    }
    const send = async (tab: Page, button: ReturnType<Page['getByRole']>) => {
      const reply = tab.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await button.click()
      const body = await (await reply).json()
      expect(body.ok, JSON.stringify(body.error)).toBe(true)
      await expect(tab.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      return body.result
    }
    const proof = async (tab: Page, label: string, selector: string) => {
      if (!process.env.GLOVE_SCREENSHOTS) return
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      for (const width of [1440, 390]) {
        await tab.setViewportSize({ width, height: 1000 })
        await tab.locator(selector).scrollIntoViewIfNeeded()
        await tab.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-stock-${label}.png`) })
      }
      await tab.setViewportSize({ width: 1440, height: 1000 })
    }
    await page.goto(`${origin}/app#stock`)
    const add = page.getByRole('form', { name: 'Add a van or warehouse' })
    await add.getByLabel('Location name', { exact: true }).fill('Priya van')
    await add.getByLabel("Technician's van", { exact: true }).selectOption(b.priya.id)
    await add.getByLabel('Par level for (optional)', { exact: true }).selectOption(cap.id)
    await add.getByLabel('Par level', { exact: true }).fill('3')
    await send(page, add.getByRole('button', { name: 'Add location', exact: true }))
    await add.getByLabel('Kind', { exact: true }).selectOption('warehouse')
    await add.getByLabel('Par level for (optional)', { exact: true }).selectOption('')
    await add.getByLabel('Location name', { exact: true }).fill('Warehouse')
    await send(page, add.getByRole('button', { name: 'Add location', exact: true }))
    const stock = page.getByRole('region', { name: 'Priya van', exact: true })
    const move = page.getByRole('form', { name: 'Count, restock or transfer' })
    const record = async (action: string, quantity: string, location = 'Priya van') => {
      await move.getByLabel('What happened', { exact: true }).selectOption(action)
      await move.getByLabel(action === 'stock.transfer' ? 'From' : 'Location', { exact: true }).selectOption({ label: location })
      await move.getByLabel('Material', { exact: true }).selectOption(cap.id)
      if (action === 'stock.transfer') await move.getByLabel('To', { exact: true }).selectOption({ label: 'Priya van' })
      await move.getByLabel(action === 'stock.count' ? 'Counted' : 'Quantity', { exact: true }).fill(quantity)
      await send(page, move.getByRole('button', { name: 'Record', exact: true }))
    }
    await record('stock.count', '3')
    await expect(stock.getByText('Low', { exact: true })).toBeVisible()
    await page.reload()
    await expect(stock).toContainText('3 each (par 3)')
    await expect(stock.getByText('Low', { exact: true })).toBeVisible()
    await proof(page, 'at-par', `[aria-labelledby="stock-${(await h.state()).stock.find((l: any) => l.name === 'Priya van').id}"]`)
    await record('stock.count', '5')
    await expect(stock.getByText('Low', { exact: true })).toHaveCount(0)
    await record('stock.restock', '20', 'Warehouse')
    const van = phone.getByRole('region', { name: 'Priya van', exact: true })
    const use = async (jobId: string, quantity: string, disconnected = false) => {
      await phone.goto(`${origin}/app?job=${jobId}`)
      await expect(phone.getByRole('heading', { name: 'Materials used', exact: true })).toBeVisible()
      if (disconnected) { offline = true; await context.setOffline(true) }
      const materials = phone.getByRole('region', { name: 'Materials used', exact: true })
      await materials.getByLabel('Item', { exact: true }).selectOption(cap.id)
      await materials.getByLabel('Quantity', { exact: true }).fill(quantity)
      await materials.getByRole('button', { name: 'Add material', exact: true }).click()
      if (disconnected) {
        await expect(materials.getByText(`Run capacitor × ${quantity} · waiting to send`, { exact: true })).toBeVisible()
        expect((await h.state()).stock.find((l: any) => l.name === 'Priya van').counts[cap.id]).toBe(3000)
        offline = false; await context.setOffline(false)
      }
      await expect.poll(async () => (await h.state()).captures.filter((c: any) => c.jobId === jobId && c.kind === 'material').map((c: any) => c.quantity)).toContain(quantity)
      await expect.poll(() => phone.evaluate(() => localStorage.getItem('glove.outbox') ?? '[]')).toBe('[]')
    }
    await use(first.job.id, '2')
    await phone.goto(`${origin}/app`)
    await expect(van).toContainText('Low: Run capacitor (3 each)')
    await phone.reload()
    await expect(van).toContainText('Low: Run capacitor (3 each)')
    await use(second.job.id, '1', true)
    await phone.clock.setFixedTime(new Date('2026-10-22T08:00:00.000Z'))
    await phone.goto(`${origin}/app`)
    await expect(van).toContainText('Low: Run capacitor (2 each)')
    await expect(van.locator('.parts')).toHaveText([
      `8:00 AM ${tomorrowA.job.number} · All parts on boardRun capacitor × 2 — on board`,
      `1:00 PM ${tomorrowB.job.number} · Short of partsRun capacitor × 1 — short (van has 2)`,
    ])
    await phone.reload()
    await expect(van).toContainText('Low: Run capacitor (2 each)')
    await proof(phone, 'low-tomorrow', '.van')
    await page.reload()
    await expect(stock).toContainText('2 each (par 3)')
    await expect(stock.getByText('Low', { exact: true })).toBeVisible()
    await record('stock.transfer', '4', 'Warehouse')
    const before = await h.state()
    await move.getByLabel('Quantity', { exact: true }).fill('40')
    await move.getByRole('button', { name: 'Record', exact: true }).click()
    await expect(move.getByRole('alert')).toContainText('Warehouse holds 16 each')
    expect(await h.state()).toEqual(before)
    await h.restart()
    await page.reload()
    await expect(stock).toContainText('6 each (par 3)')
    await expect(stock.getByText('Low', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Warehouse', exact: true })).toContainText('16 each')
    await proof(page, 'transferred', `[aria-labelledby="stock-${before.stock.find((l: any) => l.name === 'Priya van').id}"]`)
    await phone.reload()
    await expect(van).toContainText('Nothing below par')
    await expect(van.locator('.parts')).toHaveText([
      `8:00 AM ${tomorrowA.job.number} · All parts on boardRun capacitor × 2 — on board`,
      `1:00 PM ${tomorrowB.job.number} · All parts on boardRun capacitor × 1 — on board`,
    ])
    await proof(phone, 'restocked-tomorrow', '.van')
    await record('stock.count', '0')
    await use(second.job.id, '0.125')
    await page.reload()
    await expect(stock).toContainText('-0.125 each (par 3)')
    await expect(stock.getByText('Low', { exact: true })).toBeVisible()
    await phone.goto(`${origin}/app`)
    await expect(van).toContainText('Low: Run capacitor (-0.125 each)')
    await phone.reload()
    await expect(van).toContainText('Low: Run capacitor (-0.125 each)')
    console.log('PROBE STOCK-001 5: real Stock and technician van -> Low visible at 3, 2 and -0.125; absent at 5 and 6; reload retains flags')
  } finally {
    offline = false
    await context.setOffline(false)
    await context.unrouteAll({ behavior: 'wait' })
    await context.close()
    await h.close()
  }
})
