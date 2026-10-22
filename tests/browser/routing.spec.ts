import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The real installation harness is a JavaScript fixture.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function productionApi(page: Page, h: any, as: string) {
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const res = await h.request(url.pathname + url.search, { as, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: res.status, contentType: res.headers.get('content-type') ?? 'application/json', body: Buffer.from(await res.arrayBuffer()) })
  })
}
async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-routing-${name}.png`), fullPage: false })
}

test('DISP-003 the dispatcher compares driving saved and explicitly accepts the route, at 1440 and 390', async ({ browser }) => {
  test.setTimeout(180_000)
  const h = await installation()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage()
  try {
    if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
    catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    const b = await business(h)
    await h.command('maps.connect', { key: 'synthetic-glove-8' })
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
    for (const [i, tech] of [b.priya, b.tom].entries()) for (let n = 0; n < 2; n++) {
      const address = `${100 + i * 10 + n} Routing Lane, Chicago, IL 60601`
      h.maps.places.set(address, { lat: 41.8 + ((i + n) % 2) * 0.04, lng: -87.63 })
      const site = await h.command('site.save', { customerId: b.customer.id, address })
      const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title: `Service ${i + 1}.${n + 1}` })
      await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: day, start: n ? '11:00' : '08:00', end: n ? '11:30' : '08:30', window: { start: '08:00', end: '13:00' } })
    }
    const before = (await h.state()).visits
    await productionApi(page, h, b.dispatcher.cookie)
    await page.goto(`${origin}/app#dispatch`)
    const routes = page.getByRole('region', { name: 'Route optimization', exact: true })
    await expect(routes).toBeVisible()
    await routes.getByRole('button', { name: 'Propose better routes', exact: true }).click()
    await expect(routes.getByText(/Waiting for the background run/)).toBeVisible()
    expect((await h.state()).visits).toEqual(before)
    await h.scheduled(Date.now())
    // Reload the real public state rather than stubbing a job's completion.
    await page.reload()
    await expect(routes.getByText(/driving saved/)).toBeVisible()
    expect((await h.state()).visits).toEqual(before)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await routes.scrollIntoViewIfNeeded()
      await expect(routes.getByText('Before:', { exact: false }).first()).toBeVisible()
      await expect(routes.getByRole('button', { name: 'Accept route changes', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await shot(page, width, 'proposal')
    }
    await routes.getByLabel('Reason for accepting route').fill('Less driving while keeping the promised windows')
    await routes.getByRole('button', { name: 'Accept route changes', exact: true }).click()
    await expect(routes.getByText(/Route accepted/)).toBeVisible()
    const after = (await h.state()).visits
    expect(after.some((v: any) => before.find((old: any) => old.id === v.id)?.technicianId !== v.technicianId)).toBe(true)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await routes.scrollIntoViewIfNeeded()
      await shot(page, width, 'accepted')
    }
  } finally { await context.close(); await h.close() }
})
