import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Shared production Worker, native sessions and D1 harness.
import { installation, business } from '../api/harness.mjs'
// @ts-expect-error Synthetic provider exports shared with the HTTP journeys.
import { exportedFixture } from '../fixtures/movein.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function send(page: Page, button: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function shot(page: Page, system: string, width: number, name: string) {
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-movein-${system}-${name}.png`) })
  }
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })) }))
  expect(size.document <= size.viewport, JSON.stringify(size)).toBe(true)
}

for (const system of ['fieldpulse','workiz','servicetitan']) test(`${system === 'servicetitan' ? 'MOVE-003' : 'MOVE-004'} ${system}: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390`, async ({ browser }) => {
  test.setTimeout(180_000)
  for (const width of [1440,390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage(), errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    try {
      await business(h)
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app','/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), u = new URL(req.url())
        const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#move-in`)
      await page.getByLabel('Move-in source', { exact: true }).selectOption(system)
      const files = await exportedFixture(system)
      const jobFile = files.find((f: any) => f.name === 'jobs.json'), jobs = JSON.parse(jobFile.text), sourceJob = (jobs.data ?? jobs.response)[0]
      sourceJob[system === 'servicetitan' ? 'jobStatus' : 'status'] = system === 'servicetitan' ? 'Canceled' : system === 'fieldpulse' ? 5 : 'Canceled'
      jobFile.text = JSON.stringify(jobs)
      if (system === 'servicetitan') { const appointments = files.find((f: any) => f.name === 'appointments.json'), value = JSON.parse(appointments.text); value.data[0].status = 'Canceled'; appointments.text = JSON.stringify(value) }
      if (system === 'servicetitan') {
        const schedule = files.find((f: any) => f.name === 'recurring-services.json'), value = JSON.parse(schedule.text)
        value.data[0].to = '2028-12-31T00:00:00Z'; schedule.text = JSON.stringify(value)
      }
      await page.getByLabel('Export files', { exact: true }).setInputFiles(files.map((f: any) => ({ name: f.text !== undefined ? f.name : system === 'servicetitan' ? 'synthetic-glove-attachment.txt' : `attachment-${f.name.slice(12)}.txt`, mimeType: f.name.endsWith('.csv') ? 'text/csv' : f.text !== undefined ? 'application/json' : 'text/plain', buffer: Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8') })))
      const label = `Synthetic ${system} ${width}`
      await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(label)
      await page.getByLabel('Balances as of', { exact: true }).fill('2026-10-22')
      const staged = await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
      expect(staged.preview.rejections).toEqual([])
      const batch = page.getByRole('region', { name: label, exact: true })
      await expect(batch).toContainText('Preview')
      await batch.getByText('Original files and checksums', { exact: true }).click()
      await expect(batch).toContainText(staged.fileSummary[0].sha256)
      await batch.scrollIntoViewIfNeeded(); await shot(page, system, width, 'preview')
      await send(page, batch.getByRole('button', { name: 'Commit exactly this preview', exact: true }))
      await expect(batch).toContainText('Committed')
      const state = await h.state(), invoice = state.invoices.find((i: any) => i.source?.system?.toLowerCase() === system)
      await page.goto(`${origin}/app#invoices/${invoice.id}`)
      await expect(page.getByRole('heading', { name: new RegExp(`^${invoice.number} ·`) })).toBeVisible()
      await expect(page.locator('.page')).toContainText('Opening balance $76.50 as of 2026-10-22')
      await expect(page.getByRole('button', { name: 'Revise lines', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
      await shot(page, system, width, 'invoice')
      await page.goto(`${origin}/app#reports`)
      const aging = page.getByRole('region', { name: 'Receivables aging', exact: true })
      await page.getByLabel('Aging as of', { exact: true }).fill('2026-10-22')
      await expect(aging.getByRole('heading', { name: 'USD · $76.50 open', exact: true })).toBeVisible()
      await expect(aging).toContainText('Imported balances are not new sales')
      await aging.scrollIntoViewIfNeeded(); await shot(page, system, width, 'aging')
      const job = state.jobs.find((j: any) => j.id === invoice.jobId)
      await page.goto(`${origin}/app#jobs/${job.id}`)
      await expect(page.getByRole('heading', { name: `${job.number} · ${job.title}`, exact: true })).toBeVisible()
      await expect(page.locator('.job-detail')).toContainText(`Moved in from ${job.source.system}`)
      await expect(page.locator('.job-detail')).toContainText(`Canceled in ${job.source.system}; no Glove cancellation is claimed.`)
      await expect(page.locator('.job-detail')).toContainText(system === 'workiz' ? 'Owner keeps the attic key' : system === 'fieldpulse' ? 'Synthetic job note' : 'Synthetic source job note')
      await expect(page.locator('.evidence-note').first()).toContainText('source time')
      await expect(page.locator('.evidence-note').first()).not.toContainText('phone time')
      if (system === 'workiz') { await expect(page.locator('.evidence-note').first()).toContainText('Synthetic Author'); await expect(page.locator('.evidence-note').first()).toContainText('2026-10-01 08:00:00 (zone not supplied)') }
      await page.locator('.job-detail').scrollIntoViewIfNeeded(); await shot(page, system, width, 'job')
      const customer = state.customers.find((c: any) => c.id === invoice.customerId)
      await page.goto(`${origin}/app#customers/${customer.id}`)
      await expect(page.locator('.page')).toContainText(`Moved in from ${customer.source.system}`)
      if (system === 'servicetitan') {
        const agreements = page.getByRole('region', { name: 'Agreements', exact: true })
        await expect(agreements).toContainText('2 of 3 visits left')
        await expect(agreements).toContainText('Source billing template $240.00')
        await expect(agreements).toContainText('other source member benefits need review')
        await agreements.scrollIntoViewIfNeeded()
      }
      await shot(page, system, width, 'customer')
      const recurrence = state.jobs.find((j: any) => j.source?.system?.toLowerCase() === system && j.importedRecurrence)
      if (recurrence) {
        await page.goto(`${origin}/app#jobs/${recurrence.id}`)
        await page.getByText('Imported recurring schedule', { exact: true }).click()
        await expect(page.locator('.job-detail')).toContainText(system === 'servicetitan' ? 'Source schedule retained' : 'Source recurring group')
        if (system === 'servicetitan') {
          await expect(page.locator('.job-detail')).toContainText('Mapped source schedule: every 6 months on day 15')
          await page.getByRole('button', { name: 'Use imported schedule', exact: true }).click()
          const form = page.getByRole('form', { name: 'Repeat this job', exact: true })
          await expect(form.getByLabel('First visit', { exact: true })).toHaveValue('2027-01-15')
          await expect(form.getByLabel('Every how many', { exact: true })).toHaveValue('6')
          await expect(form.getByLabel('Ends on (optional)', { exact: true })).toHaveValue('2028-12-31')
          expect((await h.state()).visits.filter((v: any) => v.jobId === recurrence.id)).toHaveLength(0)
        }
        await page.locator('.job-detail').scrollIntoViewIfNeeded(); await shot(page, system, width, 'recurring')
      }
      await page.goto(`${origin}/app#move-in`)
      const committed = page.getByRole('region', { name: label, exact: true })
      await committed.getByLabel('Why undo this move-in', { exact: true }).fill('Wrong source snapshot')
      await send(page, committed.getByRole('button', { name: 'Undo move-in', exact: true }))
      await expect(committed).toContainText('Undone')
      expect((await h.state()).invoices.some((i: any) => i.id === invoice.id)).toBe(false)
      await committed.scrollIntoViewIfNeeded(); await shot(page, system, width, 'undone')
      expect(errors).toEqual([])
    } finally { await context.close(); await h.close() }
  }
})
