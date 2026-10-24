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
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-movein-${system}-${name}.png`), fullPage: ['preview', 'recurring'].includes(name) })
  }
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })) }))
  expect(size.document <= size.viewport, JSON.stringify(size)).toBe(true)
}

for (const source of ['fieldpulse','workiz','servicetitan']) test(`${source === 'servicetitan' ? 'MOVE-003 servicetitan' : source === 'fieldpulse' ? 'MOVE-004 fieldpulse, MOVE-001 Jobber and MOVE-002 Housecall Pro' : 'MOVE-004 workiz'}: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390`, async ({ browser }) => {
  test.setTimeout(180_000)
  for (const system of source === 'fieldpulse' ? ['fieldpulse','housecallpro'] : [source]) for (const width of [1440,390]) {
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
      const jobFile = files.find((f: any) => f.name === 'jobs.json'), jobs = JSON.parse(jobFile.text), sourceJob = (jobs.data ?? jobs.response ?? jobs.jobs)[0]
      sourceJob[system === 'housecallpro' ? 'work_status' : system === 'servicetitan' ? 'jobStatus' : 'status'] = system === 'housecallpro' ? 'user canceled' : system === 'servicetitan' ? 'Canceled' : system === 'fieldpulse' ? 5 : 'Canceled'
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
      if (system === 'housecallpro') { await expect(page.locator('.page')).toContainText('Synthetic source discount'); await expect(page.locator('.page')).toContainText('$206.50') }
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
      if (system !== 'housecallpro') await expect(page.locator('.evidence-note').first()).toContainText('source time')
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
      const recurrence = state.jobs.find((j: any) => j.source?.system?.toLowerCase() === system && j.importedRecurrence?.proposal) ?? state.jobs.find((j: any) => j.source?.system?.toLowerCase() === system && j.importedRecurrence)
      if (recurrence) {
        await page.goto(`${origin}/app#jobs/${recurrence.id}`)
        await page.getByText('Imported recurring schedule', { exact: true }).click()
        await expect(page.locator('.job-detail')).toContainText('Source schedule retained')
        if (system === 'servicetitan' || system === 'fieldpulse') {
          await expect(page.locator('.job-detail')).toContainText(system === 'servicetitan' ? 'Mapped source schedule: every 6 months on day 15' : 'Mapped source schedule: every week')
          await page.getByRole('button', { name: 'Use imported schedule', exact: true }).click()
          const form = page.getByRole('form', { name: 'Repeat this job', exact: true })
          await expect(form.getByLabel('First visit', { exact: true })).toHaveValue(system === 'servicetitan' ? '2027-01-15' : '2026-12-01')
          await expect(form.getByLabel('Every how many', { exact: true })).toHaveValue(system === 'servicetitan' ? '6' : '1')
          await expect(form.getByLabel('Ends on (optional)', { exact: true })).toHaveValue(system === 'servicetitan' ? '2028-12-31' : '2026-12-29')
          expect((await h.state()).visits.filter((v: any) => v.jobId === recurrence.id)).toHaveLength(0)
        }
        await page.locator('.job-detail').scrollIntoViewIfNeeded(); await shot(page, system, width, 'recurring')
      }
      if (system === 'housecallpro') {
        await h.command('enquiry.create', { customerId: state.customers.find((c: any) => !c.source)?.id, description: 'Synthetic native request' })
        await page.goto(`${origin}/app#quotes`)
        const pipeline = page.getByRole('region', { name: 'Request pipeline', exact: true })
        await expect(pipeline).toContainText('Housecall Pro lead 101: Needs inspection')
        await expect(pipeline).toContainText('at an unknown source time')
        await pipeline.scrollIntoViewIfNeeded(); await shot(page, system, width, 'requests')
      }
      await page.goto(`${origin}/app#move-in`)
      const committed = page.getByRole('region', { name: label, exact: true })
      await committed.getByLabel('Why undo this move-in', { exact: true }).fill('Wrong source snapshot')
      await send(page, committed.getByRole('button', { name: 'Undo move-in', exact: true }))
      await expect(committed).toContainText('Undone')
      expect((await h.state()).invoices.some((i: any) => i.id === invoice.id)).toBe(false)
      await committed.scrollIntoViewIfNeeded(); await shot(page, system, width, 'undone')
      if (system === 'fieldpulse') {
        // Exercise the next source through the same owner move-in journey.
        await page.goto(`${origin}/app#move-in`)
        await page.getByLabel('Move-in source', { exact: true }).selectOption('jobber')
        await expect(page.locator('.page')).toContainText('Job-owned notes and priced quotes are retained as source history')
        const jobberFiles = await exportedFixture('jobber')
        await page.getByLabel('Export files', { exact: true }).setInputFiles(jobberFiles.map((f: any) => ({ name: f.text === undefined ? `attachment-${f.name.slice(12)}.txt` : f.name, mimeType: f.name.endsWith('.csv') ? ['text', 'csv'].join('/') : f.text === undefined ? ['text', 'plain'].join('/') : ['application', 'json'].join('/'), buffer: Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8') })))
        await page.getByLabel('Balances as of', { exact: true }).fill('2026-10-22')
        const jobberLabel = `Synthetic Jobber ${width}`
        await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(jobberLabel)
        const jobberPreview = await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
        expect(jobberPreview.preview.rejections).toEqual([])
        const jobberBatch = page.getByRole('region', { name: jobberLabel, exact: true })
        await expect(jobberBatch).toContainText('products-services')
        await jobberBatch.getByText('Jobber fields Glove does not use', { exact: true }).click()
        await expect(jobberBatch).toContainText('Future Jobber recurrence definition is not mapped')
        await jobberBatch.getByText('Original files and checksums', { exact: true }).click()
        await expect(jobberBatch).toContainText(jobberPreview.fileSummary[0].sha256)
        await jobberBatch.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'preview')
        await send(page, jobberBatch.getByRole('button', { name: 'Commit exactly this preview', exact: true }))
        await expect(jobberBatch).toContainText('Committed')
        const jobberState = await h.state(), jobberJob = jobberState.jobs.find((j: any) => j.source?.system === 'Jobber')
        expect(jobberState.visits.filter((v: any) => v.jobId === jobberJob.id)).toHaveLength(2)
        const jobberInvoice = jobberState.invoices.find((i: any) => i.source?.system === 'Jobber')
        await page.goto(`${origin}/app#invoices/${jobberInvoice.id}`)
        await expect(page.locator('.page')).toContainText('Opening balance $76.50 as of 2026-10-22')
        await expect(page.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
        await expect(page.locator('.page')).toContainText('Job JB-101, JB-102')
        await expect(page.locator('.page')).toContainText('Synthetic inspection, Source inspection detail')
        await expect(page.locator('.page')).toContainText('$200.00')
        await page.getByRole('heading', { name: new RegExp(`^${jobberInvoice.number} ·`) }).scrollIntoViewIfNeeded()
        await shot(page, 'jobber', width, 'invoice')
        await page.goto(`${origin}/app#jobs/${jobberJob.id}`)
        await expect(page.locator('.job-detail')).toContainText('Synthetic recurring inspection')
        await expect(page.locator('.job-detail')).toContainText('Moved in from Jobber')
        await page.getByText('Imported recurring schedule', { exact: true }).click()
        await expect(page.locator('.job-detail')).toContainText('Future Jobber recurrence definition is not mapped')
        await expect(page.locator('.job-detail')).toContainText('Synthetic source attachment.txt · file kept in the move-in record')
        await expect(page.locator('.job-detail')).toContainText('Unscheduled source visit synthetic-glove-unscheduled')
        await expect(page.locator('.job-detail')).toContainText('Call before arranging a date')
        await expect(page.locator('.job-detail')).toContainText('synthetic-glove-source-rule')
        await expect(page.locator('.job-detail')).toContainText('Synthetic Jobber job note')
        await expect(page.locator('.evidence-note').first()).toContainText('source time')
        await shot(page, 'jobber', width, 'job')
        await page.goto(`${origin}/app#quotes`)
        await page.getByRole('button', { name: 'JB-Q-201 · Synthetic source quote', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'JB-Q-201 · Synthetic source quote', exact: true })).toBeVisible()
        await expect(page.locator('.page')).toContainText('source status: approved')
        await expect(page.locator('.page')).toContainText('Synthetic source service, Source quote detail')
        await expect(page.locator('.page')).toContainText('Synthetic source terms')
        await expect(page.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Revise price', exact: true })).toHaveCount(0)
        await page.getByRole('heading', { name: 'JB-Q-201 · Synthetic source quote', exact: true }).scrollIntoViewIfNeeded()
        await shot(page, 'jobber', width, 'quote')
        await page.goto(`${origin}/app#move-in`)
        const jobberCommitted = page.getByRole('region', { name: jobberLabel, exact: true })
        await jobberCommitted.getByLabel('Why undo this move-in', { exact: true }).fill('Wrong Jobber snapshot')
        await send(page, jobberCommitted.getByRole('button', { name: 'Undo move-in', exact: true }))
        await expect(jobberCommitted).toContainText('Undone')
        expect((await h.state()).jobs.some((j: any) => j.id === jobberJob.id)).toBe(false)
        await jobberCommitted.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'undone')
      }
      expect(errors).toEqual([])
    } finally { await context.close(); await h.close() }
  }
})
