import { expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production HTTP installation with provider-network fakes.
import { installation } from '../api/harness.mjs'
// @ts-expect-error Shared production-command fixture.
import { statusFixture } from '../api/visit-status-fixture.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
export async function visitStatusBrowser(browser: import('@playwright/test').Browser) {
  const h = await installation(), context = await browser.newContext({ geolocation: { latitude: 41.89, longitude: -87.63 }, permissions: ['geolocation'] }), page = await context.newPage()
  try {
    const { b, job, visit, at, day } = await statusFixture(h, { configure: false })
    await context.addInitScript(value => {
      const NativeDate = Date, instant = NativeDate.parse(value)
      globalThis.Date = new Proxy(NativeDate, { construct(target, args) { return Reflect.construct(target, args.length ? args : [instant]) }, get(target, property) { return property === 'now' ? () => instant : Reflect.get(target, property) } })
    }, at)
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    let acting = h.owner()
    await context.route(`${origin}/api/glove/**`, async route => {
      const request = route.request(), url = new URL(request.url()), publicRead = url.pathname.startsWith('/api/glove/public/')
      const response = await h.request(url.pathname + url.search, { method: request.method(), as: publicRead ? '' : acting, headers: publicRead ? { authorization: request.headers().authorization ?? '' } : {}, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const shot = async (width: number, name: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-visit-status-${name}.png`), fullPage: false }) }
    }
    await page.goto(`${origin}/app#team`)
    const settings = page.getByRole('region', { name: 'Visit status texts', exact: true })
    await settings.getByText('Edit visit status settings', { exact: true }).click()
    await settings.getByLabel('Allow the assigned technician to send an on-my-way text', { exact: true }).check()
    await settings.getByLabel('Send the service report link when a technician completes a visit', { exact: true }).check()
    await settings.getByLabel('On-my-way text', { exact: true }).fill('{{technician}} is on the way. ETA {{eta}} for {{title}}.')
    await settings.getByRole('button', { name: 'Preview visit status texts', exact: true }).click()
    await expect(settings.getByRole('region', { name: 'Visit status text previews', exact: true })).toContainText('STOP')
    for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await settings.getByRole('region', { name: 'Visit status text previews', exact: true }).scrollIntoViewIfNeeded(); await shot(width, 'owner-preview') }
    await settings.getByRole('checkbox', { name: 'I approve these exact templates and authorize the selected technician-triggered texts and seven-day report sharing.', exact: true }).check()
    await settings.getByRole('button', { name: 'Approve visit status settings', exact: true }).click()
    await expect(settings.getByRole('status')).toContainText('Saved.')
    acting = b.priyaPerson.cookie
    for (const [index, width] of [1440, 390].entries()) {
      let currentVisit = visit, currentJob = job
      if (index) {
        currentJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Reception split system service' })
        currentVisit = await b.dispatcher.run('visit.book', { jobId: currentJob.id, technicianId: b.priya.id, date: day, start: '15:00', end: '16:00' })
        await b.priyaPerson.run('timer.start', { visitId: currentVisit.id, kind: 'travel', deviceTime: at })
        await b.priyaPerson.run('location.phone', { lat: 41.89, lng: -87.63, observedAt: at })
      }
      await page.setViewportSize({ width, height: 1050 }); await page.goto(`${origin}/app?job=${currentJob.id}`)
      const response = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'visit.onMyWay')
      await page.getByRole('button', { name: 'On my way', exact: true }).click()
      expect((await (await response).json()).ok).toBe(true)
      await expect(page.getByRole('button', { name: 'On-my-way text reserved', exact: true })).toBeDisabled()
      const outgoing = [...h.twilio.messages.values()] as any[], text = outgoing.at(-1)
      expect(text.body).toContain('Priya'); expect(text.body).toContain('ETA'); expect(text.body).toContain('UTC'); expect(text.body).toContain('driving')
      expect(text.body).not.toContain('41.89')
      await shot(width, 'on-my-way')
      await b.priyaPerson.run('visit.arrive', { visitId: currentVisit.id, deviceTime: at })
      await page.goto(`${origin}/app?job=${currentJob.id}`)
      await page.getByRole('button', { name: 'Complete visit', exact: true }).click()
      await page.getByLabel('Work done', { exact: true }).fill('Cleaned the coil and filters; cooling restored.')
      await page.getByLabel('The customer is not here to sign', { exact: true }).check()
      await page.getByLabel('Why there is no sign-off', { exact: true }).fill('Customer at work')
      await page.getByRole('button', { name: 'Save completion', exact: true }).click()
      await expect.poll(() => h.twilio.messages.size).toBe((index + 1) * 2)
      const completedText = [...h.twilio.messages.values()].at(-1) as any, token = /\/report#token=(glr_[\w-]+)/.exec(completedText.body)?.[1]
      expect(token).toBeTruthy()
      const callback = h.twilio.delivery(completedText.sid)
      const delivered = await h.mf.dispatchFetch(callback.url, { method: callback.method, headers: Object.fromEntries(callback.headers), body: await callback.text() }); expect(delivered.status).toBe(200)
      const state = await h.state(), message = state.messages.find((m: any) => m.reportLinkId && m.subjectId === currentVisit.id)
      expect(state.messageStates[message.id].status).toBe('delivered')
      await page.goto(`${origin}/report#token=${token}`)
      await expect(page.getByRole('article', { name: 'Service report' })).toContainText('Cleaned the coil and filters; cooling restored.')
      await shot(width, 'received-report')
    }
  } finally { await context.close(); await h.close() }
}
