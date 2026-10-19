import { test, expect, type Page, type Locator } from '@playwright/test'
import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The shared HTTP installation harness is a JavaScript test fixture.
import { installation, business, completedJob } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

/** Forward the browser transport to the real production API Worker and D1.
 * Only CompanyCam's paid network edge is fake; no application answers are stubbed. */
async function productionApi(page: Page, h: any) {
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
}

async function send(page: Page, control: Locator, ok = true) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(ok)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body
}

async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-companycam-${name}.png`), fullPage: false })
}

test('DATA-002 / API-004 CompanyCam project linking, photos both ways once and uncertain-upload reconciliation at 1440 and 390', async ({ browser }) => {
  test.setTimeout(120_000)
  const h = await installation()
  try {
    const b = await business(h), work = await completedJob(h, b)
    const bytes = await readFile('tests/fixtures/companycam-unit.jpg')
    const first = await b.priyaPerson.run('visit.capture', { visitId: work.visit.id, kind: 'photo', deviceTime: '2026-10-19T13:00:00Z', caption: 'Coil after cleaning', photo: { mediaType: 'image/jpeg', base64: bytes.toString('base64') } })
    const second = await b.priyaPerson.run('visit.capture', { visitId: work.visit.id, kind: 'photo', deviceTime: '2026-10-19T13:05:00Z', caption: 'Drain after cleaning', photo: { mediaType: 'image/jpeg', base64: Buffer.concat([bytes, Buffer.from('second original')]).toString('base64') } })
    const a = { street_address_1: '14 Harbour St', street_address_2: null, city: 'Balmain', state: 'NSW', postal_code: '2041', country: null }
    h.companycam.projects.set('42', { id: '42', name: 'Harbourview Dental HVAC', address: a })
    h.companycam.projects.set('43', { id: '43', name: 'Wrong property', address: { ...a, street_address_1: '99 Other St' } })
    h.companycam.photo('501', '42', Buffer.concat([bytes, Buffer.from('provider original')]), 'Nameplate before service')
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
      catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await productionApi(page, h)
      await page.goto(`${origin}/app#team`)
      const connect = page.getByRole('heading', { name: 'CompanyCam', exact: true }).locator('..')
      await connect.getByLabel('CompanyCam access token', { exact: true }).fill('fixture-only-companycam-key')
      await send(page, connect.getByRole('button', { name: 'Save CompanyCam token', exact: true }))
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await connect.scrollIntoViewIfNeeded(); await shot(page, width, 'settings') }
      await page.goto(`${origin}/app#jobs/${work.job.id}`)
      const panel = page.getByRole('region', { name: 'CompanyCam photos', exact: true })
      await panel.getByLabel('CompanyCam project ID', { exact: true }).fill('43')
      const mismatch = await send(page, panel.getByRole('button', { name: 'Link CompanyCam project', exact: true }), false)
      expect(mismatch.error.code).toBe('COMPANYCAM_ADDRESS')
      await panel.getByLabel('CompanyCam project ID', { exact: true }).fill('42')
      await send(page, panel.getByRole('button', { name: 'Link CompanyCam project', exact: true }))
      await send(page, panel.getByRole('button', { name: 'Import CompanyCam photos', exact: true }))
      await expect(page.getByRole('img', { name: 'Nameplate before service', exact: true })).toBeVisible()
      await expect.poll(() => page.getByRole('img', { name: 'Nameplate before service', exact: true }).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await page.getByRole('img', { name: 'Nameplate before service', exact: true }).scrollIntoViewIfNeeded(); await shot(page, width, 'imported-photo') }
      const original = panel.locator('li').filter({ has: page.getByText('Coil after cleaning', { exact: true }) })
      await send(page, original.getByRole('button', { name: 'Send photo', exact: true }))
      await expect(original).toContainText('complete')
      const next = panel.locator('li').filter({ has: page.getByText('Drain after cleaning', { exact: true }) })
      h.companycam.loseUploadResponse = true
      await send(page, next.getByRole('button', { name: 'Send photo', exact: true }))
      await expect(next).toContainText('outcome unknown')
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await panel.scrollIntoViewIfNeeded(); await shot(page, width, 'unknown') }
      h.companycam.loseUploadResponse = false
      await next.getByLabel('Existing CompanyCam photo ID', { exact: true }).fill(String(h.companycam.nextId))
      await send(page, next.getByRole('button', { name: 'Reconcile existing photo', exact: true }))
      await expect(next).toContainText('confirmed by owner')
      await send(page, panel.getByRole('button', { name: 'Import CompanyCam photos', exact: true }))
      const s = await h.state()
      expect(s.captures.filter((c: any) => c.origin?.system === 'CompanyCam')).toHaveLength(1)
      expect(h.companycam.calls.filter((c: any) => c.method === 'POST' && c.path === '/projects/42/photos')).toHaveLength(2)
      expect(s.captures.some((c: any) => c.id === first.id)).toBe(true)
      expect(s.captures.some((c: any) => c.id === second.id)).toBe(true)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await panel.scrollIntoViewIfNeeded(); await shot(page, width, 'confirmed'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true) }
      // DATA-002: provider outcomes and older records remain readable in Activity.
      const reference = (await h.state()).events.find((e: any) => e.kind === 'companycam.uploadOutcome' && e.summary.includes('complete'))
      expect(reference.actorName).toBe('CompanyCam')
      for (let i = 0; i < 510; i++) await h.command('customer.save', { name: `Activity history customer ${i}` })
      await page.goto(`${origin}/app#activity`)
      const historical = page.locator('.timeline-list > li').filter({ hasText: reference.summary })
      await expect(historical).toHaveCount(0)
      await page.getByRole('button', { name: 'Load earlier activity', exact: true }).click()
      await expect(historical).toHaveCount(1)
      await expect(historical).toContainText('CompanyCam (provider)')
      const changed = page.locator('.timeline-list > li').filter({ hasText: 'CompanyCam: imported 1 photo;' })
      await changed.locator('summary').click()
      await expect(changed.locator('details')).toContainText(work.job.id)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await changed.scrollIntoViewIfNeeded(); await shot(page, width, 'activity'); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true) }

    } finally { await context.close() }
  } finally { await h.close() }
})
