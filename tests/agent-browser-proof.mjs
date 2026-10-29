import { chromium } from '@playwright/test'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'

/** Browser transport reaches the same disposable production Worker and its real
 * native session. Captures stay outside the checkout, never in fleet product source. */
export async function browserProof({ request, origin, cookie, state = 'complete' }) {
  const directory = resolve('../evidence/sx-door-adopt-glove-3/browser')
  await mkdir(directory, { recursive: true })
  const browser = await chromium.launch({ ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}), args: ['--no-sandbox'] })
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } })
      await page.route(origin + '/**', async route => {
        const req = route.request(), headers = { ...req.headers(), Cookie: cookie }
        const response = await request(req.url(), { method: req.method(), headers, ...(req.postDataBuffer() ? { body: req.postDataBuffer() } : {}) })
        // The browser already carries the native session in this transport.
        const delivered = Object.fromEntries(response.headers)
        delete delivered['set-cookie']
        await route.fulfill({ status: response.status, headers: delivered, body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(origin + '/agents', { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: /Agents/ }).first().waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.screenshot({ path: join(directory, `agents-${state}-${width}.png`), fullPage: true })
      if (state === 'complete') {
        await page.getByRole('button', { name: 'Pause agents', exact: true }).click()
        await page.getByRole('button', { name: 'Resume local agents', exact: true }).waitFor()
        await page.screenshot({ path: join(directory, `agents-paused-${width}.png`), fullPage: true })
        await page.getByRole('button', { name: 'Resume local agents', exact: true }).click()
        await page.getByRole('button', { name: 'Pause agents', exact: true }).waitFor()
        const missing = await page.goto(origin + '/agents/approvals/missing', { waitUntil: 'networkidle' })
        assert.equal(missing.status(), 404)
        await page.screenshot({ path: join(directory, `agents-unavailable-${width}.png`), fullPage: true })
      }
      await page.close()
    }
  } finally { await browser.close() }
  console.log(`Agent browser proof: production /agents ${state} at 1440 and 390, no horizontal overflow; captures in evidence/sx-door-adopt-glove-3/browser.`)
}
