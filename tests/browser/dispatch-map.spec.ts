import { closeHarnessContext, finishHarnessSetup, gotoHarness, harnessRoute, reloadHarness, restartHarness } from './harness-route'
import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The shared HTTP installation harness is a JavaScript test fixture.
import { installation, business, mapBoardFixture } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

/** Forward the browser transport to the real production API Worker and D1, as this person.
 * Only Google Maps' paid network edge is fake; no application answers are stubbed. */
async function productionApi(page: Page, h: any, as?: string) {
  await harnessRoute(page, `${origin}/api/glove/**`, async route => {
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
  try { await gotoHarness(page, process.env.GLOVE_OPEN); await page.waitForURL((u: URL) => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
  catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
  if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await finishHarnessSetup(page) }
  return { context, page }
}

test('DISP-002, DISP-010, DISP-015 the map board shows the day\'s pins and drive times, the owner draws a zone, and the technician\'s phone hands directions to their navigation app, at 1440 and 390', async ({ browser }) => {
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
      await gotoHarness(page, `${origin}/app#team`)
      for (const [provider, width] of [['google', 1440], ['microsoft', 390]] as const) {
        await page.setViewportSize({ width, height: 1000 })
        const calendar = page.getByRole('form', { name: 'Visit calendar for Tom B.', exact: true })
        await expect(calendar.getByLabel('Include customer name and service address')).not.toBeChecked()
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
        await expect(calendar.getByLabel('OAuth client secret', { exact: true })).toHaveCount(0)
        await reloadHarness(page)
        await expect(calendar.getByText(provider === 'google' ? /Customer details hidden/ : /Customer name and service address included/)).toBeVisible()
        const calendarJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Private browser calendar visit' })
        await b.dispatcher.run('visit.book', { jobId: calendarJob.id, technicianId: b.tom.id, date: provider === 'google' ? '2027-02-01' : '2027-02-02', start: '15:15', end: '16:15' })
        const sent = h.calendarSync.calls.filter((c: any) => c.method === 'POST').at(-1)
        expect(sent.provider).toBe(provider)
        expect(provider === 'google' ? sent.body.summary : sent.body.subject).toBe(provider === 'google' ? 'Glove visit' : `Glove visit: ${b.customer.name}`)
        expect(provider === 'google' ? sent.body.location : sent.body.location.displayName).toBe(provider === 'google' ? '' : b.site.address)
        for (const value of [b.customer.email, b.customer.phone, b.site.accessNotes]) expect(JSON.stringify(sent.body)).not.toContain(value)
        await send(page, calendar.getByRole('button', { name: 'Read provider busy time', exact: true }))
        await calendar.scrollIntoViewIfNeeded()
        await shot(page, width, 'calendar-connected')
        const retainedProviderEvents = [...h.calendarSync.events.entries()]
        await send(page, calendar.getByRole('button', { name: 'Disconnect visit calendar', exact: true }))
        await expect(calendar.getByRole('button', { name: 'Connect visit calendar', exact: true })).toBeVisible()
        await expect(calendar.getByLabel('Include customer name and service address')).not.toBeChecked()
        await expect(calendar.getByLabel('OAuth client secret', { exact: true })).toHaveValue('')
        const stoppedWrites = h.calendarSync.calls.filter((c: any) => c.method !== 'GET').length
        await restartHarness(h)
        await h.scheduled('2026-11-03T00:00:00.000Z')
        expect(h.calendarSync.calls.filter((c: any) => c.method !== 'GET')).toHaveLength(stoppedWrites)
        expect([...h.calendarSync.events.entries()]).toEqual(retainedProviderEvents)
        await calendar.scrollIntoViewIfNeeded()
        await shot(page, width, 'calendar-disconnected')
      }
      await calendarDeliveryReview(browser)
      await page.setViewportSize({ width: 1440, height: 1000 })
      // The owner connects Google Maps with their own key under Team.
      await gotoHarness(page, `${origin}/app#team`)
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

      await gotoHarness(page, `${origin}/app#dispatch`)
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
    } finally { await closeHarnessContext(context) }

    // Keep the alternative technician eligible at the northern stops after the zone-drawing proof.
    const tomForLocation = (await h.state()).technicians.find((t: any) => t.id === b.tom.id)
    await h.command('technician.save', { id: b.tom.id, version: tomForLocation.version, name: tomForLocation.name, operatorId: b.tomPerson.id, zips: ['60606', '60613'] })
    // The technician's phone hands directions to the site's address to Apple Maps, Google Maps or Waze.
    for (const width of [390, 1440]) {
      const phone = await signedIn(browser, width)
      try {
        await productionApi(phone.page, h, b.priyaPerson.cookie)
        await gotoHarness(phone.page, `${origin}/app?job=${(await h.state()).jobs.find((j: any) => j.title === 'Erie St rooftop unit').id}`)
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
        await reloadHarness(phone.page)
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
          await gotoHarness(desk.page, `${origin}/app#dispatch`)
          await desk.page.getByLabel('Day', { exact: true }).fill('2026-10-22')
          const liveMap = desk.page.getByRole('region', { name: 'Route map' })
          await expect(liveMap.getByRole('img', { name: 'Priya N. live phone position', exact: true })).toBeVisible()
          await expect(liveMap.getByRole('listitem', { name: "Priya N.'s route" }).getByText(/phone location.*ETA \d+ min drive/)).toBeVisible()
          await liveMap.scrollIntoViewIfNeeded()
          await shot(desk.page, width, 'phone-board')
          await liveMap.getByText('Shift position views', { exact: true }).click()
          await liveMap.getByLabel('Position viewer', { exact: true }).selectOption(b.dispatcher.id)
          await send(desk.page, liveMap.getByRole('button', { name: 'Grant position view for Priya N.', exact: true }))
          await liveMap.getByLabel('Position viewer', { exact: true }).selectOption(b.agent.id)
          await send(desk.page, liveMap.getByRole('button', { name: 'Grant position view for Priya N.', exact: true }))
          await liveMap.getByText('Shift position views', { exact: true }).scrollIntoViewIfNeeded()
          await shot(desk.page, width, 'delegation-controls')
          await reloadHarness(phone.page)
          await expect(sharing.getByText(/Position view is on for this shift:.*dispatcher.*agent/)).toBeVisible()
          await sharing.scrollIntoViewIfNeeded()
          await shot(phone.page, width, 'delegation-notice')
          await productionApi(desk.page, h, b.dispatcher.cookie)
          await reloadHarness(desk.page)
          await desk.page.getByLabel('Day', { exact: true }).fill('2026-10-22')
          await expect(liveMap.getByRole('img', { name: 'Priya N. live phone position', exact: true })).toBeVisible()
          await liveMap.scrollIntoViewIfNeeded()
          await shot(desk.page, width, 'delegated-map')
          await productionApi(desk.page, h)

          await h.command('location.fleetConnect', { technicianId: b.priya.id, vehicleId: '12345', key: 'synthetic-glove-501' })
          h.fleet.data = [{ id: '12345', gps: { time: now(), latitude: 41.89123, longitude: -87.63123 } }]
          await h.command('location.fleetRead', { technicianId: b.priya.id })
          const tomVisit = (await h.state()).visits.find((v: any) => v.technicianId === b.tom.id && v.local.start === '09:00')
          await b.tomPerson.run('location.consent', { enabled: true })
          await b.tomPerson.run('clock.in', { deviceTime: now() })
          await b.tomPerson.run('timer.start', { visitId: tomVisit.id, kind: 'job', deviceTime: now() })
          await b.tomPerson.run('location.phone', { lat: 41.89234, lng: -87.63234, observedAt: now() })
          await reloadHarness(desk.page)
          await desk.page.getByLabel('Day', { exact: true }).fill('2026-10-22')
          await expect(liveMap.getByRole('img', { name: 'Priya N. live Samsara position', exact: true })).toBeVisible()
          await expect(liveMap.getByRole('img', { name: 'Tom B. live phone position', exact: true })).toBeVisible()
          await expect(liveMap.getByRole('listitem', { name: "Tom B.'s route" }).getByText(/phone location.*ETA \d+ min drive/)).toBeVisible()
          await expect(liveMap.getByRole('region', { name: 'Location delay watch' }).getByText(/Samsara position 41.89123.*ETA \d+ min drive/).first()).toBeVisible()
          await liveMap.getByRole('region', { name: 'Location delay watch' }).scrollIntoViewIfNeeded()
          expect(await desk.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          await expect(liveMap.getByRole('region', { name: 'Location delay watch' }).getByText(/free at the same time.*Delayed technician: Samsara position/).first()).toBeVisible()
          await shot(desk.page, width, 'fleet-delay-watch')
          await b.tomPerson.run('clock.out', { deviceTime: now() })
        } finally { await closeHarnessContext(desk.context) }
        await phone.page.getByRole('button', { name: 'Clock out', exact: true }).click()
        await expect.poll(async () => (await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n).toBe(0)
        await expect(sharing.getByText('Location stopped: clock in and start a visit timer', { exact: true })).toBeVisible()
        await sharing.scrollIntoViewIfNeeded()
        await shot(phone.page, width, 'location-off-clock')
        await sharing.getByRole('button', { name: 'Stop sharing location', exact: true }).click()
        await expect(sharing.getByText('Location sharing is off', { exact: true })).toBeVisible()
        await expect.poll(async () => (await h.db.prepare('SELECT COUNT(*) AS n FROM glove_live_locations').first()).n).toBe(0)
        await shot(phone.page, width, 'location-withdrawn')
      } finally { await closeHarnessContext(phone.context) }
    }
  } finally { await h.close() }
})

async function calendarDeliveryReview(browser: any) {
  const h = await installation({ at: '2026-11-03T00:00:00.000Z' })
  const { context, page } = await signedIn(browser, 1440)
  try {
    const b = await business(h)
    await productionApi(page, h)
    await gotoHarness(page, `${origin}/app#team`)
    const calendars = [
      { tech: b.tom, provider: 'google', name: 'Tom B.' },
      { tech: b.priya, provider: 'microsoft', name: 'Priya N.' },
    ]
    const connect = async (calendar: Locator, provider: string, calendarId: string) => {
      await calendar.getByLabel('Calendar provider', { exact: true }).selectOption(provider)
      await calendar.getByLabel('Calendar ID', { exact: true }).fill(calendarId)
      await calendar.getByLabel('OAuth client ID', { exact: true }).fill('synthetic-glove-402')
      await calendar.getByLabel('OAuth client secret', { exact: true }).fill('synthetic-glove-403')
      await calendar.getByLabel('OAuth refresh token', { exact: true }).fill('synthetic-glove-404')
      await calendar.getByLabel('Approve creating, updating and deleting Glove visit events in this calendar').check()
      await send(page, calendar.getByRole('button', { name: 'Connect visit calendar', exact: true }))
    }
    const review = [] as any[]
    for (const { tech, provider, name } of calendars) {
      const calendar = page.getByRole('form', { name: `Visit calendar for ${name}`, exact: true })
      await connect(calendar, provider, `synthetic-glove-${provider}-old`)
      const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: `Calendar review ${provider}` })
      let visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-05', start: '09:00', end: '10:00' })
      const mapping = await h.db.prepare('SELECT * FROM glove_calendar_events WHERE visit_id=?').bind(visit.id).first()
      h.calendarSync.writeReply = () => Response.json({})
      const uncertain = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-11-06', start: '09:00', end: '10:00' })
      h.calendarSync.writeReply = null
      visit = await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, start: '11:00', end: '12:00', reason: 'Waiting for uncertain provider outcome' })
      review.push({ calendar, provider, tech, visit, uncertain, mapping })
    }
    await restartHarness(h)
    await h.scheduled('2026-11-03T00:00:00.000Z')
    await reloadHarness(page)
    for (const { calendar, provider } of review) {
      await expect(calendar.getByRole('status')).toContainText('unknown')
      await expect(calendar.getByRole('status')).toContainText('uncertain writes are not repeated')
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 })
        await calendar.scrollIntoViewIfNeeded()
        await shot(page, width, 'uncertain-' + provider)
      }
      await page.setViewportSize({ width: 1440, height: 1000 })
    }
    await gotoHarness(page, `${origin}/app#activity`)
    await expect(page.getByText(/Calendar create: unknown; check the provider before reconnecting/)).toHaveCount(2)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await shot(page, width, 'calendar-activity')
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await gotoHarness(page, `${origin}/app#team`)
    const writeCount = h.calendarSync.calls.filter((c: any) => c.method !== 'GET').length
    for (const { calendar, mapping, visit, uncertain, provider } of review) {
      await send(page, calendar.getByRole('button', { name: 'Disconnect visit calendar', exact: true }))
      const retained = calendar.getByRole('region', { name: 'Retained calendar events' })
      await expect(retained.getByText(`Visit ${visit.id} · Provider event ${mapping.event_id} · Connection ${mapping.connection_id}`, { exact: true })).toBeVisible()
      await expect(retained.getByText(new RegExp(`Visit ${uncertain.id}.*create: unknown`))).toBeVisible()
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 })
        await retained.scrollIntoViewIfNeeded()
        await shot(page, width, 'retained-' + provider)
      }
      await page.setViewportSize({ width: 1440, height: 1000 })
    }
    await h.scheduled('2026-11-03T00:00:00.000Z')
    expect(h.calendarSync.calls.filter((c: any) => c.method !== 'GET')).toHaveLength(writeCount)
    for (const { calendar, provider, mapping, tech, visit } of review) {
      const beforeReconnect = h.calendarSync.calls.filter((c: any) => c.method !== 'GET').length
      await connect(calendar, provider, `synthetic-glove-${provider}-fresh`)
      await expect(calendar.getByRole('status')).toContainText('No visit changes sent yet')
      expect(h.calendarSync.calls.filter((c: any) => c.method !== 'GET')).toHaveLength(beforeReconnect)
      await b.dispatcher.run('visit.book', { jobId: visit.jobId, technicianId: tech.id, date: '2026-11-07', start: '09:00', end: '10:00' })
      await reloadHarness(page)
      await expect(calendar.getByRole('status')).toContainText('confirmed')
      await expect(calendar.getByRole('region', { name: 'Retained calendar events' })).toContainText(mapping.event_id)
    }
  } finally { await closeHarnessContext(context); await h.close() }
}

test('DISP-002 focused map qualification: ordered pins and fixed drives, clicked and typed zones, unplaced stops and every phone directions address', async ({ browser }) => {
  const h = await installation({ at: '2026-11-09T23:30:00.000Z' })
  try {
    const f = await mapBoardFixture(h)
    const { context, page } = await signedIn(browser, 1440)
    try {
      await productionApi(page, h)
      await page.goto(`${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill(f.day)
      const map = page.getByRole('region', { name: 'Route map' })
      await expect(map.getByRole('group', { name: `Stops on the map, ${f.day}` }).getByRole('img')).toHaveCount(5)
      for (const [tech, indices, times] of [[f.technicians[0], [0, 1, 2], ['8:00 AM', '10:00 AM', '1:00 PM']], [f.technicians[1], [3, 4], ['9:00 AM', '12:00 PM']]] as any[]) {
        const route = map.getByRole('listitem', { name: `${tech.name}'s route`, exact: true })
        for (const [n, i] of indices.entries()) {
          const pin = map.getByRole('img', { name: `${tech.name} stop ${n + 1}: ${f.jobs[i].number} at ${times[n]}, ${f.sites[i].address}`, exact: true })
          await expect(pin).toBeVisible()
          await expect(pin.locator('text')).toHaveText(String(n + 1))
        }
        for (const drive of tech.id === f.technicians[0].id ? ['7 min drive · 1.0 mi', '11 min drive · 3.0 mi'] : ['16 min drive · 5.0 mi']) await expect(route.getByText(drive, { exact: true })).toBeVisible()
      }
      await expect.poll(() => map.locator('img[src^="/api/glove/map.png"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1280)
      await map.getByRole('button', { name: 'Draw a service-area zone', exact: true }).click()
      await map.getByLabel('Zone for', { exact: true }).selectOption(f.technicians[0].id)
      await map.getByLabel('Zone name', { exact: true }).fill('Clicked service zone')
      const surface = map.getByRole('group', { name: `Stops on the map, ${f.day}` })
      const box = (await surface.boundingBox())!
      for (const [x, y] of [[0.1, 0.1], [0.3, 0.1], [0.2, 0.3]]) await surface.click({ position: { x: box.width * x, y: box.height * y } })
      await expect(map.getByLabel('Corners', { exact: true })).toHaveValue(/\n.*\n/)
      await send(page, map.getByRole('button', { name: 'Save zone', exact: true }))
      await expect(map.locator('polygon.zone title')).toContainText(['Map Ada: Clicked service zone'])
      const clicked = (await h.state()).technicians.find((t: any) => t.id === f.technicians[0].id)
      expect(clicked.zones[0].points).toHaveLength(3)
      await map.getByRole('button', { name: 'Draw a service-area zone', exact: true }).click()
      await map.getByLabel('Zone for', { exact: true }).selectOption(f.technicians[1].id)
      await map.getByLabel('Zone name', { exact: true }).fill('Typed service zone')
      await map.getByLabel('Corners', { exact: true }).fill('41.70, -87.70\n41.90, -87.70\n41.80, -87.50')
      await send(page, map.getByRole('button', { name: 'Save zone', exact: true }))
      await expect(map.locator('polygon.zone title')).toHaveText(['Map Ada: Clicked service zone', 'Map Bea: Typed service zone'])
      const typed = (await h.state()).technicians.find((t: any) => t.id === f.technicians[1].id)
      expect(typed.zones[0].points).toEqual([{ lat: 41.7, lng: -87.7 }, { lat: 41.9, lng: -87.7 }, { lat: 41.8, lng: -87.5 }])
      const outsideAddress = '401 Outside Street, Chicago, IL 60609'
      h.maps.places.set(outsideAddress, { lat: 42.1, lng: -87.9 })
      const outside = await h.command('site.save', { customerId: f.customer.id, address: outsideAddress })
      const outsideJob = await f.dispatcher.run('job.create', { customerId: f.customer.id, siteId: outside.id, title: 'Outside drawn zone' })
      const before = (await h.state()).visits
      const warning = await f.dispatcher.run('visit.book', { jobId: outsideJob.id, technicianId: f.technicians[1].id, date: '2026-11-10', start: '09:00', end: '10:00' }, { error: 'CONFLICT_REVIEW' })
      expect(warning.details.conflicts.map((c: any) => c.code)).toEqual(['area:60609'])
      expect((await h.state()).visits).toEqual(before)
      const unplaced = await h.command('site.save', { customerId: f.customer.id, address: '402 Unplaced Street, Chicago, IL 60610' })
      const unplacedJob = await f.dispatcher.run('job.create', { customerId: f.customer.id, siteId: unplaced.id, title: 'Unplaced stop' })
      await f.dispatcher.run('visit.book', { jobId: unplacedJob.id, technicianId: f.technicians[1].id, date: f.day, start: '15:00', end: '16:00', acknowledge: ['area:60610'] })
      await page.reload()
      await expect(map.getByRole('button', { name: 'Place on the map', exact: true })).toBeVisible()
      await expect(map.getByText(/402 Unplaced Street.*Google Maps found no place/)).toBeVisible()
      await expect(surface.getByRole('img')).toHaveCount(5)
      await map.scrollIntoViewIfNeeded()
      await shot(page, 1440, 'qualified-board')
      await page.setViewportSize({ width: 390, height: 1000 })
      await map.scrollIntoViewIfNeeded()
      await shot(page, 390, 'qualified-board')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    } finally { await context.close() }
    // Each assigned visit's own address, checked on the actual phone view.
    for (const [personIndex, indices] of [[0, [0, 1, 2]], [1, [3, 4]]] as [number, number[]][]) {
      const phone = await signedIn(browser, 390)
      try {
        await productionApi(phone.page, h, f.people[personIndex].cookie)
        for (const i of indices) {
          await phone.page.goto(`${origin}/app?job=${f.jobs[i].id}`)
          const directions = phone.page.getByRole('group', { name: 'Directions to the site', exact: true })
          const address = encodeURIComponent(f.sites[i].address)
          await expect(directions.getByRole('link', { name: 'Apple Maps', exact: true })).toHaveAttribute('href', `https://maps.apple.com/?daddr=${address}&dirflg=d`)
          await expect(directions.getByRole('link', { name: 'Google Maps', exact: true })).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${address}&travelmode=driving`)
          await expect(directions.getByRole('link', { name: 'Waze', exact: true })).toHaveAttribute('href', `https://waze.com/ul?q=${address}&navigate=yes`)
          if (i === 0) {
            await directions.scrollIntoViewIfNeeded()
            await shot(phone.page, 390, 'qualified-directions')
            await phone.page.setViewportSize({ width: 1440, height: 1000 })
            await directions.scrollIntoViewIfNeeded()
            await shot(phone.page, 1440, 'qualified-directions')
            await phone.page.setViewportSize({ width: 390, height: 1000 })
          }
        }
      } finally { await phone.context.close() }
    }
  } finally { await h.close() }
})
