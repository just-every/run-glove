import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real Worker with native authentication and durable D1.
import { installation, business } from '../api/harness.mjs'
// @ts-expect-error Only the browser's push-service edge is synthetic.
import { phoneKeys } from '../fixtures/push-service.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function send(page: Page, control: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function screens(page: Page, panel: Locator, name: string) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await panel.scrollIntoViewIfNeeded()
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-push-${name}.png`) })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
}

test('FIELD-009 owner enables phone notifications and a Technician controls two session-bound phones at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2026-11-08T12:00:00.000Z' })
  const contexts = []
  try {
    const b = await business(h), second = await h.signIn(b.priyaPerson)
    const open = async (person: any, label?: string) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
      contexts.push(context)
      if (label) {
        const phone = await phoneKeys()
        await context.grantPermissions(['notifications'], { origin })
        await context.addInitScript(({ endpoint, keys }) => {
          const subscription = { endpoint, expirationTime: null, options: null, getKey: () => null, toJSON: () => ({ endpoint, expirationTime: null, keys }), unsubscribe: async () => { localStorage.removeItem('synthetic-glove-push'); return true } }
          PushManager.prototype.subscribe = async function (options?: PushSubscriptionOptionsInit) {
            localStorage.setItem('synthetic-glove-push', btoa(String.fromCharCode(...new Uint8Array(options!.applicationServerKey as ArrayBuffer))))
            return subscription as unknown as PushSubscription
          }
          PushManager.prototype.getSubscription = async function () { return (localStorage.getItem('synthetic-glove-push') ? subscription : null) as unknown as PushSubscription }
        }, { endpoint: `https://push.example.test/send/${label}`, keys: phone.keys })
      }
      const page = await context.newPage()
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      await page.goto(process.env.GLOVE_OPEN)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') {
        await page.getByRole('checkbox').check()
        await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
        await page.waitForURL(u => u.pathname === '/app')
      }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { as: person?.cookie ?? h.owner(), method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app`)
      if (person) await expect(page.getByRole('heading', { name: 'Your visits', exact: true })).toBeVisible()
      else await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      return page
    }
    const owner = await open(null)
    await owner.getByRole('link', { name: 'Team', exact: true }).click()
    const setting = owner.getByRole('region', { name: 'Phone notifications', exact: true })
    await send(owner, setting.getByRole('button', { name: 'Turn on phone notifications', exact: true }))
    await expect(setting).toContainText('turned on by Olivia Owner')
    const firstKey = (await h.state()).business[0].webPush.publicKey
    await screens(owner, setting, 'owner-on')
    const phoneA = await open(b.priyaPerson, 'synthetic-glove-1'), phoneB = await open(second, 'synthetic-glove-2')
    const panelA = phoneA.getByRole('region', { name: 'Notifications', exact: true }), panelB = phoneB.getByRole('region', { name: 'Notifications', exact: true })
    for (const [page, panel] of [[phoneA, panelA], [phoneB, panelB]] as const) {
      await panel.getByRole('button', { name: 'Turn on notifications', exact: true }).click()
      await expect(panel.getByRole('status')).toHaveText('On for this phone: new, moved and canceled visits.')
      expect(await page.evaluate(() => localStorage.getItem('synthetic-glove-push'))).toBe(Buffer.from(firstKey, 'base64url').toString('base64'))
    }
    await phoneA.reload()
    const j = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Phone controls visit', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '20.00' }] })
    await b.dispatcher.run('visit.book', { jobId: j.id, technicianId: b.priya.id, date: '2030-03-12', start: '09:00', end: '10:00' })
    await h.restart()
    await phoneA.reload(); await phoneB.reload()
    for (const panel of [panelA, panelB]) {
      await expect(panel.getByRole('list', { name: 'Your phones' }).getByRole('listitem')).toHaveCount(2)
      await expect(panel.getByText('This browser (this phone)', { exact: true })).toHaveCount(1)
      await expect(panel.getByText(/Handed to the push service/)).toHaveCount(2)
      await expect(panel).not.toContainText('push.example.test')
    }
    await screens(phoneA, panelA, 'technician-two-phones')
    const otherPhone = panelA.getByRole('listitem').filter({ has: phoneA.getByText('This browser', { exact: true }) })
    await otherPhone.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(panelA.getByRole('listitem')).toHaveCount(1)
    await phoneB.reload()
    await expect(panelB.getByRole('status')).toHaveText('Off for this phone.')
    await expect(panelB.getByRole('listitem')).toHaveCount(1)
    await screens(phoneB, panelB, 'technician-removed')
    await send(owner, setting.getByRole('button', { name: 'Turn off phone notifications', exact: true }))
    await send(owner, setting.getByRole('button', { name: 'Turn on phone notifications', exact: true }))
    expect((await h.state()).business[0].webPush.publicKey).not.toBe(firstKey)
    await phoneA.reload()
    await expect(panelA.getByRole('status')).toHaveText('Off for this phone.')
    await expect(panelA.getByRole('listitem')).toHaveCount(0)
    await panelA.getByRole('button', { name: 'Turn on notifications', exact: true }).click()
    await expect(panelA.getByRole('status')).toContainText('On for this phone')
    await send(owner, setting.getByRole('button', { name: 'Turn off phone notifications', exact: true }))
    await phoneA.reload()
    await expect(panelA).toContainText('The owner has not turned on phone notifications.')
    await expect(panelA.getByRole('button')).toHaveCount(0)
    await screens(owner, setting, 'owner-off')
    await screens(phoneA, panelA, 'technician-off')
  } finally {
    for (const context of contexts) await context.close()
    await h.close()
  }
})
