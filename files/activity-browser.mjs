import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'
const checkout = process.cwd(), packet = process.env.GLOVE_PACKET
const { chromium } = await import(pathToFileURL(join(checkout, 'node_modules/@playwright/test/index.mjs')))
const { installation, branchActivityHistory } = await import(pathToFileURL(join(checkout, 'tests/api/harness.mjs')))
const { startDev, stopDev, redact } = await import(pathToFileURL(join(checkout, 'tests/browser/runtime.mjs')))
const mode = process.argv[2] || 'after'
let h, runtime, browser
const results = { mode, widths: [], status: 'failed' }
try {
  runtime = await startDev(checkout, 8787)
  h = await installation({ at: '2026-10-20T15:00:00.000Z' })
  await h.command('business.save', { name: 'synthetic-glove', currency: 'USD', timezone: 'America/Chicago' })
  const f = await branchActivityHistory(h)
  const snapshot = async () => {
    const { exportedAt, ...data } = await h.request('/api/glove/export').then(r => r.json())
    return data
  }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  await page.goto(runtime.entry)
  await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(u => u.pathname === '/app')
  }
  // As in the existing CompanyCam journey, browser API transport goes to the
  // actual production handlers with real native authentication and migrated D1.
  await page.route(`${runtime.origin}/api/glove/**`, async route => {
    const request = route.request(), url = new URL(request.url())
    const response = await h.request(url.pathname + url.search, { method: request.method(), as: f.reader.cookie, ...(request.postData() ? { body: JSON.parse(request.postData()) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
  for (const width of [1440]) {
    await page.setViewportSize({ width, height: 1050 })
    await page.goto(`${runtime.origin}/app#activity`)
    await page.reload()
    await page.getByRole('heading', { name: 'Activity', exact: true }).waitFor()
    const earlier = page.getByRole('button', { name: 'Load earlier activity', exact: true })
    assert.equal(await page.locator('.timeline-list > li').count(), 0)
    await mkdir(packet, { recursive: true })
    for (const proofWidth of [1440, 390]) {
      await page.setViewportSize({ width: proofWidth, height: 1050 })
      await page.screenshot({ path: join(packet, `${mode}-${proofWidth}-empty.png`) })
    }
    await page.setViewportSize({ width, height: 1050 })
    if (mode === 'before') {
      await earlier.waitFor({ state: 'visible', timeout: 3000 })
      throw Error('Expected the original screen to fail the empty-window reachability assertion')
    }
    const before = await snapshot()
    const pages = []
    while (!(await page.locator('.timeline-list > li').count())) {
      const pending = page.waitForResponse(r => r.url().includes('/api/glove/activity?before='))
      await earlier.click()
      const response = await pending, data = await response.json()
      assert.equal(response.status(), 200)
      assert.ok(data.events.every(e => e.jobId !== f.jobB.id))
      pages.push({ before: new URL(response.url()).searchParams.get('before'), ids: data.events.map(e => e.id), next: data.next })
      assert.ok(pages.length < 10)
      await page.waitForFunction(() => !document.querySelector('.timeline-list') || document.querySelector('button') && ![...document.querySelectorAll('button')].some(b => b.textContent.includes('Loading earlier')))
    }
    assert.ok(pages.filter(p => !p.ids.length).length >= 2)
    const row = page.locator('.timeline-list > li')
    assert.equal(await row.count(), 1)
    assert.ok((await row.textContent()).includes(f.reader.name))
    assert.ok((await row.textContent()).includes('Office'))
    const expectedTime = new Intl.DateTimeFormat('en', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(f.at))
    assert.equal(await row.locator('time').textContent(), expectedTime)
    await row.locator('summary').click()
    assert.ok((await row.locator('details').textContent()).includes(f.jobA.id))
    assert.ok((await row.locator('details').textContent()).includes('version new → 1'))
    assert.ok((await row.locator('details').textContent()).includes('title'))
    assert.ok(!(await page.locator('.timeline-list').textContent()).includes('synthetic-glove-B'))
    await row.scrollIntoViewIfNeeded()
    for (const proofWidth of [1440, 390]) {
      await page.setViewportSize({ width: proofWidth, height: 1050 })
      await row.scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(packet, `${mode}-${proofWidth}-reached.png`) })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    }
    await page.setViewportSize({ width, height: 1050 })
    assert.deepEqual(await snapshot(), before)
    await h.restart()
    // Retained D1 serves the identical page after an actual Worker restart.
    const restored = await h.request(`/api/glove/activity?before=${pages.at(-1).before}`, { as: f.reader.cookie }).then(r => r.json())
    assert.deepEqual(restored.events.map(e => e.id), pages.at(-1).ids)
    assert.deepEqual(await snapshot(), before)
    await h.command('branch.limit', { operatorId: f.reader.id, branchId: f.branchB.id })
    const refreshed = page.waitForResponse(r => r.url().endsWith('/api/glove/state'))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await refreshed
    await row.filter({ hasText: f.jobA.id }).waitFor({ state: 'detached' })
    assert.ok(!(await page.locator('.timeline-list').textContent()).includes(f.jobA.id))
    await h.command('branch.limit', { operatorId: f.reader.id, branchId: f.branchA.id })
    results.widths.push({ width, screenshotWidths: [1440, 390], pages, metadata: true, noReadMutation: true, restart: true, withdrawalCleared: true, overflow: false })
  }
  results.status = 'passed'
} catch (error) {
  results.failure = redact(error.message)
  if (mode === 'before' && /waitFor|Timeout/.test(error.message)) { results.status = 'expected-failure'; results.failure = 'Load earlier activity absent when the initial branch window is empty' }
  else throw error
} finally {
  if (browser) await browser.close()
  if (runtime) await stopDev(checkout, runtime)
  if (h) await h.close()
  await writeFile(join(packet, `browser-${mode}.json`), JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results))
}
