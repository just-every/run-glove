import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The shared HTTP installation harness is a JavaScript test fixture.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

/** Forward the browser transport to the real production API Worker and D1, as this person.
 * Only Google Maps' paid network edge is fake; no application answers are stubbed. */
async function productionApi(page: Page, h: any, as?: string) {
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(as ? { as } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
}

async function send(page: Page, control: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body
}

async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-dispatch-map-${name}.png`), fullPage: false })
}

async function signedIn(browser: any, width: number) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } }), page = await context.newPage()
  if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
  try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL((u: URL) => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
  catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
  if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL((u: URL) => u.pathname === '/app') }
  return { context, page }
}

test('DISP-002 the map board shows the day\'s pins and drive times, the owner draws a zone, and the technician\'s phone hands directions to their navigation app, at 1440 and 390', async ({ browser }) => {
  test.setTimeout(180_000)
  const h = await installation()
  try {
    const b = await business(h)
    const places: [string, { lat: number; lng: number }][] = [['410 W Erie St, Chicago, IL 60654', { lat: 41.8937, lng: -87.6386 }], ['233 S Wacker Dr, Chicago, IL 60606', { lat: 41.8789, lng: -87.6359 }], ['1060 W Addison St, Chicago, IL 60613', { lat: 41.9484, lng: -87.6553 }], ['5700 S Lake Shore Dr, Chicago, IL 60637', { lat: 41.7906, lng: -87.5831 }]]
    for (const [address, at] of places) h.maps.places.set(address, at)
    const { context, page } = await signedIn(browser, 1440)
    try {
      await productionApi(page, h)
      // The owner connects Google Maps with their own key under Team.
      await page.goto(`${origin}/app#team`)
      const card = page.getByRole('heading', { name: 'Google Maps', exact: true }).locator('..')
      await card.getByLabel('Google Maps API key', { exact: true }).fill('synthetic-glove-2')
      await send(page, card.getByRole('button', { name: 'Save Google Maps key', exact: true }))
      await expect(card.getByText(/^Connected\. Dispatch shows the day on a map/)).toBeVisible()
      await shot(page, 1440, 'connect')

      // A fixture day in the business's own today: Priya's three stops and Tom's two.
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
      const sites = [] as any[]
      for (const [address] of places) sites.push(await h.command('site.save', { customerId: b.customer.id, address }))
      const stop = async (site: any, technicianId: string, start: string, end: string, title: string) => {
        const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: site.id, title })
        await b.dispatcher.run('visit.book', { jobId: job.id, technicianId, date: day, start, end })
        return job
      }
      const first = await stop(sites[0], b.priya.id, '08:00', '09:00', 'Erie St rooftop unit')
      await stop(sites[1], b.priya.id, '10:00', '11:00', 'Wacker Dr chiller')
      await stop(sites[2], b.priya.id, '13:00', '14:00', 'Addison furnace')
      await stop(sites[3], b.tom.id, '09:00', '10:00', 'Lake Shore boiler')
      await stop(sites[1], b.tom.id, '11:00', '12:00', 'Wacker Dr second chiller')
      const board = await (await h.request(`/api/glove/map?date=${day}&branch=main`)).json()
      const drives = (name: string) => board.technicians.find((t: any) => t.name === name).legs.map((l: any) => `${Math.max(1, Math.round(l.seconds / 60))} min drive · ${(l.meters / 1609.344).toFixed(1)} mi`)

      await page.goto(`${origin}/app#dispatch`)
      const map = page.getByRole('region', { name: 'Route map' })
      // Pins for every stop, numbered in each technician's order, over Google's base map.
      await expect(map.getByRole('group', { name: `Stops on the map, ${day}` }).getByRole('img')).toHaveCount(5)
      await expect(map.getByRole('img', { name: `Priya N. stop 1: ${first.number} at 8:00 AM, ${places[0][0]}` })).toBeVisible()
      await expect(map.getByRole('img', { name: new RegExp(`^Tom B\\. stop 2: J-\\d+ at 11:00 AM, ${places[1][0]}$`) })).toBeVisible()
      await expect.poll(() => map.locator('img[src^="/api/glove/map.png"]').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(1280)
      // The drive between consecutive stops, from the routing provider.
      expect(drives('Priya N.')).toHaveLength(2)
      for (const [name, expected] of [['Priya N.', drives('Priya N.')], ['Tom B.', drives('Tom B.')]] as const) {
        const route = map.getByRole('listitem', { name: `${name}'s route` })
        for (const text of expected) await expect(route.getByText(text, { exact: true })).toBeVisible()
      }
      const drawn = h.maps.calls.filter((c: any) => c.api === 'staticmap')
      expect(drawn.length).toBeGreaterThan(0)
      expect(drawn.every((c: any) => c.key === 'synthetic-glove-2' && !('markers' in c.query))).toBe(true)
      await map.scrollIntoViewIfNeeded()
      await shot(page, 1440, 'board')

      // The owner draws Tom's South Side zone by clicking its corners on the map.
      await map.getByRole('button', { name: 'Draw a service-area zone' }).click()
      await map.getByLabel('Zone for').selectOption({ label: 'Tom B.' })
      await map.getByLabel('Zone name').fill('South Side')
      const surface = map.getByRole('group', { name: `Stops on the map, ${day}` })
      const box = (await surface.boundingBox())!
      for (const [x, y] of [[0.55, 0.62], [0.95, 0.62], [0.95, 0.98], [0.55, 0.98]]) await surface.click({ position: { x: box.width * x, y: box.height * y } })
      await expect(map.getByLabel('Corners')).toHaveValue(/^(-?\d+\.\d{5}, -?\d+\.\d{5}\n){3}-?\d+\.\d{5}, -?\d+\.\d{5}$/)
      await shot(page, 1440, 'drawing')
      await send(page, map.getByRole('button', { name: 'Save zone' }))
      const tom = (await h.state()).technicians.find((t: any) => t.id === b.tom.id)
      expect(tom.zones.map((z: any) => [z.name, z.points.length])).toEqual([['South Side', 4]])
      await expect(map.getByRole('listitem', { name: "Tom B.'s route" }).getByText('South Side')).toBeVisible()
      await expect(map.locator('polygon.zone title')).toHaveText(['Tom B.: South Side'])

      await page.setViewportSize({ width: 390, height: 1000 })
      await map.scrollIntoViewIfNeeded()
      await expect(map.getByRole('img', { name: new RegExp(`^Priya N\\. stop 3: J-\\d+ at 1:00 PM`) })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await shot(page, 390, 'board')
    } finally { await context.close() }

    // The technician's phone hands directions to the site's address to Apple Maps, Google Maps or Waze.
    for (const width of [390, 1440]) {
      const phone = await signedIn(browser, width)
      try {
        await productionApi(phone.page, h, b.priyaPerson.cookie)
        await phone.page.goto(`${origin}/app?job=${(await h.state()).jobs.find((j: any) => j.title === 'Erie St rooftop unit').id}`)
        await expect(phone.page.getByRole('heading', { name: /^J-\d+ · Erie St rooftop unit$/ })).toBeVisible()
        const directions = phone.page.getByRole('group', { name: 'Directions to the site' })
        const address = encodeURIComponent(places[0][0])
        await expect(directions.getByRole('link', { name: 'Apple Maps' })).toHaveAttribute('href', `https://maps.apple.com/?daddr=${address}&dirflg=d`)
        await expect(directions.getByRole('link', { name: 'Google Maps' })).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${address}&travelmode=driving`)
        await expect(directions.getByRole('link', { name: 'Waze' })).toHaveAttribute('href', `https://waze.com/ul?q=${address}&navigate=yes`)
        await directions.scrollIntoViewIfNeeded()
        await shot(phone.page, width, 'technician-directions')
      } finally { await phone.context.close() }
    }
  } finally { await h.close() }
})
