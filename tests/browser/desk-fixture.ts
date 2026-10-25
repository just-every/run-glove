import { expect, type Browser, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
export const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
export async function deskPage(browser: Browser, h: any, width: number, cookie?: string) {
  const context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
  if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
  try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
  if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(cookie ? { as: cookie } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
  })
  return { context, page }
}
export async function action(page: Page, button: Locator, ok = true) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click(); const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(ok)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
export async function phoneScreen(page: Page, width: number, name: string, anchor?: Locator) {
  if (anchor) await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const unlabelled = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
  expect(unlabelled).toEqual([])
  if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-desk-${name}.png`) }) }
}
