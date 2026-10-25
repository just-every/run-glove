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
      // DISP-008: owner calendar credentials and explicit detail consent use the real command door.
      await page.goto(`${origin}/app#team`)
      for (const [provider, width] of [['google', 1440], ['microsoft', 390]] as const) {
        await page.setViewportSize({ width, height: 1000 })
        const calendar = page.getByRole('form', { name: 'Visit calendar for Tom B.', exact: true })
        await calendar.getByLabel('Calendar provider', { exact: true }).selectOption(provider)
        await calendar.getByLabel('Calendar ID', { exact: true }).fill('synthetic-glove-401')
        await calendar.getByLabel('OAuth client ID', { exact: true }).fill('synthetic-glove-402')
        await calendar.getByLabel('OAuth client secret', { exact: true }).fill('synthetic-glove-403')
        await calendar.getByLabel('OAuth refresh token', { exact: true }).fill('synthetic-glove-404')
        await calendar.getByLabel('Approve creating, updating and deleting Glove visit events in this calendar').check()
        if (provider === 'microsoft') await calendar.getByLabel('Include customer name and service address').check()
        await calendar.scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await shot(page, width, 'calendar-consent')
        await send(page, calendar.getByRole('button', { name: 'Connect visit calendar', exact: true }))
        await expect(calendar.getByText(provider === 'google' ? /Customer details hidden/ : /Customer name and service address included/)).toBeVisible()
        await send(page, calendar.getByRole('button', { name: 'Read provider busy time', exact: true }))
        await calendar.scrollIntoViewIfNeeded()
        await shot(page, width, 'calendar-connected')
        await send(page, calendar.getByRole('button', { name: 'Disconnect visit calendar', exact: true }))
      }
      await page.setViewportSize({ width: 1440, height: 1000 })
      // The owner connects Google Maps with their own key under Team.
      await page.goto(`${origin}/app#team`)
      const card = page.getByRole('heading', { name: 'Google Maps', exact: true }).locator('..')
      await card.getByLabel('Google Maps API key', { exact: true }).fill('synthetic-glove-2')
      await send(page, card.getByRole('button', { name: 'Save Google Maps key', exact: true }))
      await expect(card.getByText(/^Connected\. Dispatch shows the day on a map/)).toBeVisible()
      await shot(page, 1440, 'connect')

      // A fixed fixture day: Priya's three stops and Tom's two.
      const day = '2026-10-22'
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
      await page.getByLabel('Day', { exact: true }).fill(day)
      const map = page.getByRole('region', { name: 'Route map' })
      const previous = page.getByRole('button', { name: 'Previous day', exact: true })
      await previous.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      expect(await previous.evaluate(el => getComputedStyle(el, '::after').visibility)).toBe('visible')
      await previous.blur()
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
        const state = await h.state(), firstJob = state.jobs.find((j: any) => j.title === 'Erie St rooftop unit')
        const firstVisit = state.visits.find((v: any) => v.jobId === firstJob.id)
        const directions = phone.page.getByRole('group', { name: 'Directions to the site' })
        const address = encodeURIComponent(places[0][0])
        await expect(directions.getByRole('link', { name: 'Apple Maps' })).toHaveAttribute('href', `https://maps.apple.com/?daddr=${address}&dirflg=d`)
        await expect(directions.getByRole('link', { name: 'Google Maps' })).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${address}&travelmode=driving`)
        await expect(directions.getByRole('link', { name: 'Waze' })).toHaveAttribute('href', `https://waze.com/ul?q=${address}&navigate=yes`)
        await directions.scrollIntoViewIfNeeded()
        await shot(phone.page, width, 'technician-directions')
        const now = () => new Date().toISOString()
        await b.priyaPerson.run('clock.in', { deviceTime: now() })
        await b.priyaPerson.run('timer.start', { visitId: firstVisit.id, kind: 'job', deviceTime: now() })
        await phone.context.grantPermissions(['geolocation'], { origin })
        await phone.context.setGeolocation({ latitude: 41.89001, longitude: -87.63001 })
        await phone.page.reload()
        const sharing = phone.page.getByRole('region', { name: 'Location sharing', exact: true })
        await sharing.scrollIntoViewIfNeeded()
        await shot(phone.page, width, 'location-consent')
        const consented = phone.page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'location.consent')
        await sharing.getByRole('button', { name: 'Allow on-clock location', exact: true }).click()
        expect((await (await consented).json()).ok).toBe(true)
        await expect(sharing.getByRole('alert')).toHaveText('Use a fresh location captured during this shift and visit.')
        await phone.context.setGeolocation({ latitude: 41.89001, longitude: -87.63001 })
        await expect(sharing.getByText('Phone location shared with dispatch', { exact: true })).toBeVisible()
        expect(await phone.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await shot(phone.page, width, 'phone-location')
        const desk = await signedIn(browser, width)
        try {
          await productionApi(desk.page, h)
          await desk.page.goto(`${origin}/app#dispatch`)
          await desk.page.getByLabel('Day', { exact: true }).fill('2026-10-22')
          const liveMap = desk.page.getByRole('region', { name: 'Route map' })
          await expect(liveMap.getByRole('img', { name: 'Priya N. live phone position', exact: true })).toBeVisible()
          await expect(liveMap.getByRole('listitem', { name: "Priya N.'s route" }).getByText(/phone location.*ETA \d+ min drive/)).toBeVisible()
          await liveMap.scrollIntoViewIfNeeded()
          await shot(desk.page, width, 'phone-board')
          await h.command('location.fleetConnect', { technicianId: b.priya.id, vehicleId: '12345', key: 'synthetic-glove-501' })
          h.fleet.data = [{ id: '12345', gps: { time: now(), latitude: 41.89123, longitude: -87.63123 } }]
          await h.command('location.fleetRead', { technicianId: b.priya.id })
          await desk.page.reload()
          await desk.page.getByLabel('Day', { exact: true }).fill('2026-10-22')
          await expect(liveMap.getByRole('img', { name: 'Priya N. live Samsara position', exact: true })).toBeVisible()
          await expect(liveMap.getByRole('region', { name: 'Location delay watch' }).getByText(/Samsara position 41.89123.*ETA \d+ min drive/).first()).toBeVisible()
          await liveMap.getByRole('region', { name: 'Location delay watch' }).scrollIntoViewIfNeeded()
          expect(await desk.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          await shot(desk.page, width, 'fleet-delay-watch')
        } finally { await desk.context.close() }
        await sharing.getByRole('button', { name: 'Stop sharing location', exact: true }).click()
        await expect(sharing.getByText('Location sharing is off', { exact: true })).toBeVisible()
        await expect.poll(async () => (await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n).toBe(0)
        await sharing.scrollIntoViewIfNeeded()
        await shot(phone.page, width, 'location-withdrawn')
        await b.priyaPerson.run('clock.out', { deviceTime: now() })
        await phone.page.reload()
        await expect(sharing.getByText('Location sharing is off', { exact: true })).toBeVisible()
        await shot(phone.page, width, 'location-off-clock')
      } finally { await phone.context.close() }
    }
  } finally { await h.close() }
})
