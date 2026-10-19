import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker/native D1, not an app transport fake.
import { installation, business, acceptedQuote } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })

async function screens(page: Page, name: string, anchor?: Locator) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-service-report-${name}.png`), mask: [page.getByLabel('Report link', { exact: true })] })
    }
  }
}

test('FIELD-003 / FIELD-002 the desk copies and revokes a report link, the customer reads its flagged inspection and originals, and a recommendation becomes an ordinary draft at 1440/390', async ({ browser }) => {
  const h = await installation()
  try {
    const b = await business(h)
    await h.command('form.save', { name: 'Condenser inspection', serviceIds: [b.service.id], questions: [
      { id: 'running', label: 'Unit running?', type: 'yesno', required: true },
      { id: 'fault', label: 'Observed fault', type: 'notes', required: true, showIf: { questionId: 'running', equals: false } },
      { id: 'suction', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
      { id: 'coil', label: 'Inspection photo', type: 'photo' },
    ] })
    const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Condenser service')).id })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date()), start: '09:00', end: '10:00' })
    const at = visit.startAt, photo = { mediaType: 'image/png', base64: png }
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
    for (const item of job.checklist.filter((x: any) => x.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'checklist', itemId: item.id, result: 'done' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'form', formId: job.forms[0].id, answers: { running: false, fault: 'Fan noisy on arrival', suction: '152.5', coil: photo } })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'photo', caption: 'Coil before cleaning', photo })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, kind: 'material', description: 'Coil cleaner', quantity: '0.5', unit: 'bottle' })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    let publicPage: Page | undefined
    let acting = h.owner()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      // Render real built screens. Route forwarding supplies each request to
      // the production Worker, preserving its real command/auth/file handlers.
      await context.route(`${origin}/api/glove/**`, async route => {
        const request = route.request(), url = new URL(request.url())
        const isPublic = url.pathname.startsWith('/api/glove/public/')
        const response = await h.request(url.pathname + url.search, { method: request.method(), as: isPublic ? '' : acting, headers: isPublic ? { authorization: request.headers().authorization ?? '' } : {}, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      acting = b.priyaPerson.cookie
      await page.goto(`${origin}/app?job=${job.id}`)
      await page.getByRole('button', { name: 'Complete visit', exact: true }).click()
      await page.getByLabel('Work done', { exact: true }).fill('Cleaned filters and condenser coil')
      await page.getByLabel('Findings', { exact: true }).fill('Fan bearing is noisy')
      await page.getByLabel('Recommendations', { exact: true }).fill('Replace condenser fan')
      await page.getByLabel('Customer name', { exact: true }).fill('Dr Mei Lin')
      const canvas = page.locator('canvas.signature')
      await canvas.scrollIntoViewIfNeeded()
      const bounds = (await canvas.boundingBox())!
      await page.mouse.move(bounds.x + 20, bounds.y + 30); await page.mouse.down()
      await page.mouse.move(bounds.x + 70, bounds.y + 55); await page.mouse.move(bounds.x + 110, bounds.y + 20); await page.mouse.up()
      await screens(page, 'technician-completion', page.locator('form.completion'))
      const completed = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'visit.complete')
      await page.getByRole('button', { name: 'Save completion', exact: true }).click()
      expect((await (await completed).json()).ok).toBe(true)
      acting = h.owner()
      await page.goto(`${origin}/app#jobs/${job.id}`)
      const reports = page.getByRole('region', { name: 'Service reports', exact: true })
      await expect(reports.getByRole('button', { name: 'Copy report link', exact: true })).toBeVisible()
      await reports.getByRole('button', { name: 'Preview service report', exact: true }).click()
      await expect(reports.getByRole('article', { name: 'Service report' })).toContainText('Out of range')
      await screens(page, 'desk-preview', reports)
      await reports.getByRole('button', { name: 'Close report preview', exact: true }).click()
      const result = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'report.link')
      await reports.getByRole('button', { name: 'Copy report link', exact: true }).click()
      expect((await (await result).json()).ok).toBe(true)
      const input = reports.getByLabel('Report link', { exact: true })
      await expect.poll(async () => /\/report#token=glr_/.test(await input.inputValue())).toBe(true)
      const reportUrl = await input.inputValue()
      await screens(page, 'link-controls', reports)
      publicPage = await context.newPage()
      // A public page needs no session; production reads explicitly omit it.
      try { await publicPage.goto(reportUrl) } catch { throw new Error('The private report page failed to open.') }
      const document = publicPage.getByRole('article', { name: 'Service report', exact: true })
      await expect(document).toContainText('Cleaned filters and condenser coil')
      await expect(document).toContainText('Fan bearing is noisy')
      await expect(document).toContainText('Condenser inspection')
      await expect(document).toContainText('152.5 psi')
      await expect(document).toContainText('Out of range')
      await expect(document).toContainText('Fan noisy on arrival')
      await expect(document).toContainText('Coil cleaner × 0.5 bottle')
      await expect(document).toContainText('Signed by Dr Mei Lin')
      await expect(document).toContainText('Replace condenser fan')
      await expect(document).toContainText('Technician: Priya')
      await expect(document).not.toContainText('Priya N.')
      await expect(document).not.toContainText('Gate code')
      await expect(document.getByRole('img')).toHaveCount(3)
      await expect.poll(() => document.getByRole('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
      await screens(publicPage, 'customer-report', document)
      await reports.getByLabel('Unit price', { exact: true }).fill('189.00')
      const quoteResponse = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'report.quote')
      await reports.getByRole('button', { name: 'Draft quote from recommendation', exact: true }).click()
      const quote = (await (await quoteResponse).json()).result
      expect(quote.status).toBe('draft'); expect(quote.revisions[0].approval).toBeNull()
      await expect(reports).toContainText('A person must approve its price before it is sent.')
      await screens(page, 'recommendation-draft', reports)
      const revokeResponse = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'report.revoke')
      await reports.getByRole('button', { name: 'Revoke report link', exact: true }).click()
      expect((await (await revokeResponse).json()).ok).toBe(true)
      try { await publicPage.reload() } catch { throw new Error('The revoked report page failed to reload.') }
      await expect(publicPage.getByRole('alert')).toContainText('unavailable or has expired')
      await screens(publicPage, 'revoked')
    } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
