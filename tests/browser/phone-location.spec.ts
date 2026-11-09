import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Shared native Worker fixture is JavaScript.
import { installation, liveLocationFixture } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function open(browser: any, width: number) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } })
  const page = await context.newPage()
  if (!process.env.GLOVE_OPEN) throw new Error('Private local owner entry required')
  await page.goto(process.env.GLOVE_OPEN)
  await page.waitForURL((url: URL) => ['/app', '/setup'].includes(url.pathname) && !url.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL((url: URL) => url.pathname === '/app')
  }
  return { context, page }
}
async function api(page: Page, h: any, as?: string, captures: any[] = []) {
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url()), body = req.postDataJSON()
    if (body?.type === 'location.phone') captures.push(body)
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(as ? { as } : {}), ...(body ? { body } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
}
async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-phone-location-${name}.png`) })
}
async function visible(page: Page, value: boolean) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value ? 'visible' : 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
  }, value)
}

// Assertions run at the width named by the outcome. Screens are also captured at the other width.
test('DISP-005 point 1: owner board displays phone and Samsara fixes with next-stop ETAs and removes them on clock-out at 1440', async ({ browser }) => {
  await test.step('DISP-005 point 1: owner board displays phone and Samsara fixes with next-stop ETAs and removes them on clock-out at 1440', async () => {
  const h = await installation({ at: '2026-11-09T08:00:00.000Z' })
  const { context, page } = await open(browser, 1440)
  try {
    const f = await liveLocationFixture(h), { b } = f
    await f.start(); await f.start(b.tomPerson, f.visits[1])
    await b.priyaPerson.run('location.phone', f.point())
    await h.command('location.fleetConnect', { technicianId: b.tom.id, vehicleId: '12345', key: 'synthetic-glove-703' })
    h.fleet.data = [{ id: '12345', gps: { time: f.now(), latitude: 41.89172, longitude: -87.63172 } }]
    await h.command('location.fleetRead', { technicianId: b.tom.id })
    await h.restart()
    await api(page, h)
    await page.goto(`${origin}/app#dispatch`)
    await page.getByLabel('Day', { exact: true }).fill('2026-11-09')
    const previous = page.getByRole('button', { name: 'Previous day', exact: true })
    await previous.focus()
    expect(await previous.evaluate(el => getComputedStyle(el, '::after').visibility)).toBe('visible')
    await previous.blur()
    const map = page.getByRole('region', { name: 'Route map' })
    await expect(map.getByRole('img', { name: 'Priya N. live phone position', exact: true })).toBeVisible()
    await expect(map.getByRole('img', { name: 'Tom B. live Samsara position', exact: true })).toBeVisible()
    for (const name of ['Priya N.', 'Tom B.']) await expect(map.getByRole('listitem', { name: `${name}'s route` }).getByText(/location.*ETA 3 min drive/)).toBeVisible()
    const calls = h.fleet.calls.length
    await map.scrollIntoViewIfNeeded()
    await shot(page, 1440, 'owner-board')
    await page.setViewportSize({ width: 390, height: 1000 })
    await shot(page, 390, 'owner-board')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await b.priyaPerson.run('clock.out', { deviceTime: f.now() })
    await b.tomPerson.run('clock.out', { deviceTime: f.now() })
    await b.priyaPerson.run('location.phone', f.point(), { error: 'LOCATION_STOPPED' })
    await h.command('location.fleetRead', { technicianId: b.tom.id }, { error: 'LOCATION_STOPPED' })
    await page.reload()
    await page.getByLabel('Day', { exact: true }).fill('2026-11-09')
    await expect(map.getByRole('img', { name: /live .* position/ })).toHaveCount(0)
    await expect(map.getByText(/^Location stopped or unavailable · ETA unavailable/)).toHaveCount(2)
    expect(await f.rows()).toEqual([])
    expect(h.fleet.calls.length).toBe(calls)
  } finally { await context.close(); await h.close() }
  })

  await test.step('DISP-005 points 2, 3 and 4: phone consent requests browser location only during visible online assigned work and never queues offline captures at 390', async () => {
  const h = await installation()
  const { context, page } = await open(browser, 390)
  try {
    const f = await liveLocationFixture(h), { b } = f
    await h.setTime(null)
    const now = () => new Date().toISOString()
    const captures: any[] = []
    await context.grantPermissions(['geolocation'], { origin })
    await context.setGeolocation({ latitude: 41.89081, longitude: -87.63081 })
    await page.addInitScript(() => {
      const geo = navigator.geolocation, watch = geo.watchPosition.bind(geo), clear = geo.clearWatch.bind(geo)
      const write = Storage.prototype.setItem
      ;(window as any).locationOutboxWrites = []
      Storage.prototype.setItem = function (key, value) {
        if (key === 'glove.outbox') (window as any).locationOutboxWrites.push(JSON.parse(value))
        return write.call(this, key, value)
      }
      const active = new Set<number>()
      ;(window as any).locationWatches = { starts: 0, active: 0 }
      geo.watchPosition = (...args) => {
        const id = watch(...args)
        active.add(id)
        ;(window as any).locationWatches.starts++
        ;(window as any).locationWatches.active = active.size
        return id
      }
      geo.clearWatch = id => { active.delete(id); (window as any).locationWatches.active = active.size; clear(id) }
    })
    await api(page, h, b.priyaPerson.cookie, captures)
    const load = async () => {
      await page.goto(`${origin}/app?job=${f.job.id}`)
      await expect(page.getByRole('region', { name: 'Location sharing', exact: true })).toBeVisible()
    }
    await load()
    const sharing = page.getByRole('region', { name: 'Location sharing', exact: true })
    await expect(sharing.getByText('Location sharing is off', { exact: true })).toBeVisible()
    await expect(sharing.getByRole('button', { name: 'Allow on-clock location', exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as any).locationWatches.starts)).toBe(0)
    await sharing.scrollIntoViewIfNeeded()
    await shot(page, 390, 'sharing-off')
    await page.setViewportSize({ width: 1440, height: 1000 }); await shot(page, 1440, 'sharing-off')
    await page.setViewportSize({ width: 390, height: 1000 })
    const consent = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'location.consent')
    await sharing.getByRole('button', { name: 'Allow on-clock location', exact: true }).click()
    expect((await (await consent).json()).ok).toBe(true)
    await expect(sharing.getByText('Location stopped: clock in and start a visit timer', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as any).locationWatches.starts)).toBe(0)
    expect(await f.rows()).toEqual([])
    await b.priyaPerson.run('clock.in', { deviceTime: now() })
    await page.reload()
    await expect(sharing.getByRole('button', { name: 'Stop sharing location', exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as any).locationWatches.starts)).toBe(0)
    expect(await f.rows()).toEqual([])
    await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'travel', deviceTime: now() })
    // A browser's first mocked fix retains the time set on the context. Give
    // the new watch a fix captured after the shift and timer have started.
    await context.setGeolocation({ latitude: 41.89082, longitude: -87.63082 })
    await page.reload()
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.starts)).toBe(1)
    expect(await page.evaluate(async () => (await navigator.permissions.query({ name: 'geolocation' })).state)).toBe('granted')
    await expect(sharing.getByText('Phone location shared with dispatch', { exact: true })).toBeVisible()
    await expect.poll(async () => (await f.rows())[0]?.lat).toBe(41.89082)
    expect(await page.evaluate(() => (window as any).locationOutboxWrites.flat().filter((item: any) => item.type.startsWith('location.')))).toEqual([])
    await sharing.scrollIntoViewIfNeeded()
    await shot(page, 390, 'sharing-active')
    await page.setViewportSize({ width: 1440, height: 1000 }); await shot(page, 1440, 'sharing-active')
    await page.setViewportSize({ width: 390, height: 1000 })
    const stopConsent = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'location.consent')
    await sharing.getByRole('button', { name: 'Stop sharing location', exact: true }).click()
    expect((await (await stopConsent).json()).ok).toBe(true)
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.active)).toBe(0)
    expect(await f.rows()).toEqual([])
    const resumeConsent = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'location.consent')
    await sharing.getByRole('button', { name: 'Allow on-clock location', exact: true }).click()
    expect((await (await resumeConsent).json()).ok).toBe(true)
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.active)).toBe(1)
    await visible(page, false)
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.active)).toBe(0)
    const hiddenCount = captures.length, beforeHidden = await f.rows()
    await context.setGeolocation({ latitude: 41.89083, longitude: -87.63083 })
    expect(captures.length).toBe(hiddenCount)
    expect(await f.rows()).toEqual(beforeHidden)
    await visible(page, true)
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.active)).toBe(1)
    await context.setOffline(true)
    await expect.poll(() => page.evaluate(() => (window as any).locationWatches.active)).toBe(0)
    const offlineCount = captures.length
    await context.setGeolocation({ latitude: 41.89084, longitude: -87.63084 })
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))).toEqual([])
    expect(captures.length).toBe(offlineCount)
    // Reconnect while hidden: no buffered capture may be replayed.
    await visible(page, false)
    await context.setOffline(false)
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))).toEqual([])
    expect(captures.length).toBe(offlineCount)
    expect(JSON.stringify(captures)).not.toContain('41.89084')
    expect(await page.evaluate(() => (window as any).locationOutboxWrites.flat().filter((item: any) => item.type.startsWith('location.')))).toEqual([])
    await b.priyaPerson.run('timer.stop', { visitId: f.visits[0].id, deviceTime: now() })
    await page.reload()
    await expect(sharing.getByText('Location stopped: clock in and start a visit timer', { exact: true })).toBeVisible()
    expect(await f.rows()).toEqual([])
    expect(await page.evaluate(() => (window as any).locationWatches.starts)).toBe(0)
    // A timer on a visit that has moved to another technician is ineligible too.
    await b.priyaPerson.run('timer.start', { visitId: f.visits[0].id, kind: 'job', deviceTime: now() })
    await b.dispatcher.run('visit.cancel', { visitId: f.visits[1].id, version: f.visits[1].version, reason: 'Available for handoff' })
    const visit = (await h.state()).visits.find((v: any) => v.id === f.visits[0].id)
    await b.dispatcher.run('visit.change', { visitId: visit.id, version: visit.version, technicianId: b.tom.id, reason: 'Field handoff' })
    await page.reload()
    await expect(sharing.getByText('Location stopped: clock in and start a visit timer', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => (window as any).locationWatches.starts)).toBe(0)
    expect(await f.rows()).toEqual([])
    await b.priyaPerson.run('clock.out', { deviceTime: now() })
    await page.reload()
    await expect(sharing.getByText('Location stopped: clock in and start a visit timer', { exact: true })).toBeVisible()
    const withdrawal = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'location.consent')
    await sharing.getByRole('button', { name: 'Stop sharing location', exact: true }).click()
    expect((await (await withdrawal).json()).ok).toBe(true)
    await expect(sharing.getByText('Location sharing is off', { exact: true })).toBeVisible()
    expect(await f.rows()).toEqual([])
  } finally { await context.close(); await h.close() }
  })
})
