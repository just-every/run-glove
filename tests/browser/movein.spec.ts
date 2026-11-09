import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Shared production Worker, native sessions and D1 harness.
import { installation, business } from '../api/harness.mjs'
// @ts-expect-error Synthetic provider exports shared with the HTTP journeys.
import { exportedFixture } from '../fixtures/movein.mjs'
// @ts-expect-error Shared documented-shape ServiceM8 fixture.
import { serviceM8Balances } from '../fixtures/servicem8-balances.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function send(page: Page, button: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function shot(page: Page, system: string, width: number, name: string, region?: Locator) {
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    const path = join(process.env.GLOVE_SCREENSHOTS, `${width}-movein-${system}-${name}.png`)
    if (region) await region.screenshot({ path })
    else await page.screenshot({ path, fullPage: ['preview', 'recurring'].includes(name) })
  }
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })) }))
  expect(size.document <= size.viewport, JSON.stringify(size)).toBe(true)
}

test('MOVE-003, MOVE-009 servicetitan: owner previews, commits, reads the imported work and balance, and undoes at 1440 and 390', async ({ browser }) => {
  test.setTimeout(540_000)
  for (const system of ['fieldpulse','housecallpro','workiz','servicetitan']) for (const width of [1440,390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage(), errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    try {
      await business(h)
      if (system === 'servicetitan') {
        await h.setTime('2026-11-09T12:00:00.000Z')
        await page.addInitScript(at => {
          const NativeDate = Date
          globalThis.Date = new Proxy(NativeDate, {
            construct: (target, args) => Reflect.construct(target, args.length ? args : [at]),
            apply: () => new NativeDate(at).toString(),
            get: (target, key) => key === 'now' ? () => at : Reflect.get(target, key),
          })
        }, Date.parse('2026-11-09T12:00:00.000Z'))
      }
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
      if (system === 'servicetitan') {
        await test.step('MOVE-009: read fixed and ongoing source terms, then explicitly activate monthly and weekly proposals', async () => {
          const root = 'tests/fixtures/servicetitan-movein/memberships/'
          const membershipFiles = await Promise.all((await readdir(root)).filter(name => name.endsWith('.json')).map(async name => ({ name, mimeType: 'application/json', buffer: await readFile(root + name) })))
          await page.goto(`${origin}/app#move-in`)
          await page.getByLabel('Move-in source', { exact: true }).selectOption('servicetitan')
          await page.getByLabel('Export files', { exact: true }).setInputFiles(membershipFiles)
          const membershipLabel = `Membership terms ${width}`
          await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(membershipLabel)
          const preview = await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
          expect(preview.preview.rejections).toEqual([])
          expect(preview.preview.unmappedFields['recurring-services'].join(' ')).toContain('weekday differs from its start date')
          expect(preview.preview.unmappedFields['recurring-services'].join(' ')).toContain('no exact native rule')
          const membershipBatch = page.getByRole('region', { name: membershipLabel, exact: true })
          await send(page, membershipBatch.getByRole('button', { name: 'Commit exactly this preview', exact: true }))
          const imported = await h.state()
          const customer = imported.customers.find((c: any) => c.source?.system === 'ServiceTitan')
          await page.goto(`${origin}/app#customers/${customer.id}`)
          const agreements = page.getByRole('region', { name: 'Agreements', exact: true })
          for (const [name, price, frequency, term] of [['Synthetic annual care', '$240.00', 'Annually', 'Dec 31, 2026'], ['Synthetic ongoing care', '$19.50', 'Monthly', 'ongoing']]) {
            const agreement = agreements.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) })
            await expect(agreement).toContainText(`Source billing template ${price} · ${frequency}`)
            await expect(agreement).toContainText('not a new sale or an authorization to charge')
            await expect(agreement).toContainText('other source member benefits need review')
            await expect(agreement).toContainText('2 of 6 visits left')
            await expect(agreement).toContainText('2 source-closed visits are kept apart from customer declines')
            await expect(agreement).toContainText(term)
          }
          await agreements.scrollIntoViewIfNeeded(); await shot(page, system, width, 'membership-terms')
          for (const [id, first, until, start, end, dates] of [
            ['19', '2027-01-15', '2028-12-31', '09:30', '10:45', ['2027-01-15', '2027-07-15']],
            ['39', '2026-11-16', '2027-01-31', '13:00', '14:30', ['2026-11-16', '2026-11-30', '2026-12-14', '2026-12-28', '2027-01-11', '2027-01-25']],
          ] as const) {
            const job = imported.jobs.find((j: any) => j.source?.system === 'ServiceTitan' && j.source.id === id)
            expect(job.series).toBeUndefined()
            expect(imported.visits.filter((v: any) => v.jobId === job.id)).toHaveLength(0)
            await page.goto(`${origin}/app#jobs/${job.id}`)
            await page.getByRole('button', { name: 'Use imported schedule', exact: true }).click()
            const form = page.getByRole('form', { name: 'Repeat this job', exact: true })
            await expect(form.getByLabel('First visit', { exact: true })).toHaveValue(first)
            await expect(form.getByLabel('Ends on (optional)', { exact: true })).toHaveValue(until)
            await expect(form.getByLabel('Technician', { exact: true })).toHaveValue('')
            const technician = imported.technicians.find((t: any) => !t.source && t.active)
            await form.getByLabel('Technician', { exact: true }).selectOption(technician.id)
            await form.getByLabel('Start', { exact: true }).fill(start)
            await form.getByLabel('End', { exact: true }).fill(end)
            const active = await send(page, form.getByRole('button', { name: 'Make it repeat', exact: true }))
            expect(active.series.until).toBe(until)
            expect(active.series.revisions[0].rule).toEqual(job.importedRecurrence.proposal.rule)
            const visits = (await h.state()).visits.filter((v: any) => v.jobId === job.id)
            expect(visits.map((v: any) => v.local.date).sort()).toEqual([...dates])
            expect(visits.every((v: any) => v.technicianId === technician.id && v.local.start === start && v.local.end === end)).toBe(true)
            const summary = page.getByLabel('Series', { exact: true })
            await expect(summary).toContainText(`Ends ${until}`)
            await expect(summary).toContainText(technician.name)
            await summary.scrollIntoViewIfNeeded()
            await shot(page, system, width, id === '19' ? 'monthly-activated' : 'weekly-activated')
          }
          await page.goto(`${origin}/app#move-in`)
          const activatedBatch = page.getByRole('region', { name: membershipLabel, exact: true })
          await activatedBatch.getByLabel('Why undo this move-in', { exact: true }).fill('Keep activated visits')
          const undo = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
          await activatedBatch.getByRole('button', { name: 'Undo move-in', exact: true }).click()
          expect((await (await undo).json()).error.code).toBe('IMPORT_DEPENDENTS')
          await expect(activatedBatch).toContainText('Committed')
          expect((await h.state()).visits.filter((v: any) => v.series)).toHaveLength(8)
        })
      }
      if (system === 'fieldpulse') {
        // Exercise the next source through the same owner move-in journey.
        await page.goto(`${origin}/app#move-in`)
        await page.getByLabel('Move-in source', { exact: true }).selectOption('jobber')
        const jobberFiles = await exportedFixture('jobber')
        await page.getByLabel('Export files', { exact: true }).setInputFiles(jobberFiles.map((f: any) => ({ name: f.text === undefined ? `attachment-${f.name.slice(12)}.txt` : f.name, mimeType: f.name.endsWith('.csv') ? ['text', 'csv'].join('/') : f.text === undefined ? ['text', 'plain'].join('/') : ['application', 'json'].join('/'), buffer: Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8') })))
        await page.getByLabel('Balances as of', { exact: true }).fill('2026-10-22')
        const jobberLabel = `Synthetic Jobber ${width}`
        await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(jobberLabel)
        const jobberPreview = await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
        expect(jobberPreview.preview.rejections).toEqual([])
        expect(jobberPreview.preview.missingAttachments.map((a: any) => a.name).sort()).toEqual(['Balance confirmation.pdf', 'Warranty conditions.pdf'])
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
        const invoiceNotes = page.getByRole('region', { name: 'Imported notes and attachments', exact: true })
        await expect(invoiceNotes).toContainText('Invoice review: balance confirmed with the accounts team.')
        await expect(invoiceNotes).toContainText('Source time 2026-10-02T15:45:00-05:00')
        await expect(invoiceNotes).toContainText('Balance confirmation.pdf · file missing: not included in the move-in')
        await expect(invoiceNotes).not.toContainText('Billing discussion:')
        await expect(invoiceNotes.getByRole('link')).toHaveCount(0)
        await invoiceNotes.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'invoice-notes')
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
        await expect(page.locator('.job-detail')).not.toContainText('Billing discussion:')
        await expect(page.locator('.job-detail')).not.toContainText('Quote clarification:')
        await expect(page.locator('.evidence-note').first()).toContainText('source time')
        await shot(page, 'jobber', width, 'job')
        await page.goto(`${origin}/app#quotes`)
        const importedRequest = page.getByRole('region', { name: 'Request pipeline', exact: true }).getByRole('region', { name: 'Imported notes and attachments', exact: true })
        await expect(importedRequest).toContainText('Requested an inspection before deciding on replacement.')
        await expect(importedRequest).not.toContainText('Billing discussion:')
        await importedRequest.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'request-notes')
        await page.getByRole('button', { name: 'JB-Q-201 · Synthetic source quote', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'JB-Q-201 · Synthetic source quote', exact: true })).toBeVisible()
        await expect(page.locator('.page')).toContainText('source status: approved')
        await expect(page.locator('.page')).toContainText('Synthetic source service, Source quote detail')
        await expect(page.locator('.page')).toContainText('Synthetic source terms')
        await expect(page.locator('.page')).toContainText('Please clear access to the outdoor unit.')
        await expect(page.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Revise price', exact: true })).toHaveCount(0)
        await page.getByRole('heading', { name: 'JB-Q-201 · Synthetic source quote', exact: true }).scrollIntoViewIfNeeded()
        await shot(page, 'jobber', width, 'quote')
        const quoteNotes = page.getByRole('region', { name: 'JB-Q-201 · Synthetic source quote', exact: true }).getByRole('region', { name: 'Imported notes and attachments', exact: true })
        await expect(quoteNotes).toContainText('Quote clarification: warranty covers the listed parts only.')
        await expect(quoteNotes).toContainText('Source time 2026-10-01T11:30:00-05:00')
        await expect(quoteNotes).toContainText('Warranty conditions.pdf · file missing: not included in the move-in')
        await expect(quoteNotes).not.toContainText('Billing discussion:')
        await quoteNotes.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'quote-notes')
        await page.goto(`${origin}/app#customers/${jobberInvoice.customerId}`)
        const clientNotes = page.getByRole('region', { name: 'Imported notes and attachments', exact: true })
        await expect(clientNotes).toContainText('Billing discussion: send records to the office before contacting the tenant.')
        await expect(clientNotes).toContainText('Source time 2026-09-29T09:15:00-05:00')
        await expect(clientNotes).toContainText('Billing instructions.txt · file kept in the move-in record')
        await expect(clientNotes.getByRole('link')).toHaveCount(0)
        await clientNotes.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'customer-notes')
        await page.goto(`${origin}/app#move-in`)
        const jobberCommitted = page.getByRole('region', { name: jobberLabel, exact: true })
        await jobberCommitted.getByLabel('Why undo this move-in', { exact: true }).fill('Wrong Jobber snapshot')
        await send(page, jobberCommitted.getByRole('button', { name: 'Undo move-in', exact: true }))
        await expect(jobberCommitted).toContainText('Undone')
        expect((await h.state()).jobs.some((j: any) => j.id === jobberJob.id)).toBe(false)
        await jobberCommitted.scrollIntoViewIfNeeded(); await shot(page, 'jobber', width, 'undone')
      }
      if (system === 'fieldpulse') {
        await page.goto(`${origin}/app#move-in`)
        await page.getByLabel('Move-in source', { exact: true }).selectOption('servicem8')
        const smallFiles = await Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, mimeType: ['application', 'json'].join('/'), buffer: await readFile(`tests/fixtures/servicem8-small-hvac/${kind}.json`) })))
        smallFiles.push({ name: 'attachment-8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01.jpg', mimeType: ['image', 'jpeg'].join('/'), buffer: await readFile('tests/fixtures/servicem8-small-hvac/attachment-8b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01.jpg') })
        await page.getByLabel('Export files', { exact: true }).setInputFiles(smallFiles)
        const smallLabel = `ServiceM8 source review ${width}`
        await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(smallLabel)
        await page.getByLabel('Balances as of', { exact: true }).fill('2026-10-22')
        await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
        const smallBatch = page.getByRole('region', { name: smallLabel, exact: true })
        const review = smallBatch.getByRole('list', { name: 'Source record review', exact: true })
        if (width === 1440) {
          await expect(review.getByRole('listitem')).toHaveCount(22)
          const contact = review.getByRole('listitem').filter({ hasText: 'companycontact a1b2c3d4-0001-4e5f-8a9b-c0d1e2f3a401' })
          await expect(contact).toContainText('companycontact.json · item 1')
          await expect(contact).toContainText('Merge target: customers sm8-6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11')
          const material = review.getByRole('listitem').filter({ hasText: 'jobmaterial 7c8d9e0f-0004-4a1b-8c2d-3e4f5a6b7c04' })
          await expect(material).toContainText('Merge target: quotes sm8-3e4f5a6b-cccc-4c7d-8e9f-0a1b2c3d4e03')
          const job = review.getByRole('listitem').filter({ hasText: 'job 3e4f5a6b-aaaa-4c7d-8e9f-0a1b2c3d4e01' })
          await expect(job).toContainText('Destination: sites sm8-site-40348167947ffe64470806c2')
          await expect(job).toContainText('Destination: jobs sm8-3e4f5a6b-aaaa-4c7d-8e9f-0a1b2c3d4e01')
          const rejected = review.getByRole('listitem').filter({ hasText: 'job 3e4f5a6b-dddd-4c7d-8e9f-0a1b2c3d4e04' })
          await expect(rejected).toContainText('job.json · item 4')
          await expect(rejected).toContainText("Rejection: Job's client 0b0b0b0b-dead-4bee-8f00-000000000000 is not in company.json.")
          await expect(review.getByRole('listitem').filter({ hasText: 'jobactivity 5a6b7c8d-0003-4e9f-8a0b-1c2d3e4f5a03' })).toContainText('Unused reason: activity on a quote; quotes have no visits in Glove')
          await expect(review.getByRole('listitem').filter({ hasText: 'attachment 8b9c0d1e-0003-4f2a-9b3c-4d5e6f7a8b03' })).toContainText('Unused reason: attached to company')
          await expect(review.getByRole('listitem').filter({ hasText: 'attachment 8b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02' })).toContainText('Missing attachment: Customer signoff.pdf')
        }
        await smallBatch.scrollIntoViewIfNeeded(); await shot(page, 'servicem8', width, 'record-review', smallBatch)
        await send(page, smallBatch.getByRole('button', { name: 'Commit exactly this preview', exact: true }))
        await smallBatch.getByText('Original files and checksums', { exact: true }).click()
        if (width === 1440) await expect(smallBatch.getByRole('link', { name: 'company.json', exact: true })).toBeVisible()
        await smallBatch.getByLabel('Why undo this move-in', { exact: true }).fill('Reviewed synthetic source records')
        await send(page, smallBatch.getByRole('button', { name: 'Undo move-in', exact: true }))
        const sm8Files = await serviceM8Balances(), sm8Label = `Synthetic ServiceM8 ${width}`
        await page.getByLabel('Export files', { exact: true }).setInputFiles(sm8Files.map((f: any) => ({ name: f.text === undefined ? `attachment-${f.name.slice(12)}.txt` : f.name, mimeType: f.text === undefined ? ['text', 'plain'].join('/') : ['application', 'json'].join('/'), buffer: Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8') })))
        await page.getByLabel('Name this move-in (optional)', { exact: true }).fill(sm8Label)
        await page.getByLabel('Balances as of', { exact: true }).fill('2026-10-22')
        const reviewed = await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
        expect(reviewed.preview.rejections).toEqual([])
        const sm8Batch = page.getByRole('region', { name: sm8Label, exact: true })
        await expect(sm8Batch).toContainText('jobpayment')
        expect((await h.state()).invoices.filter((i: any) => i.source?.system === 'ServiceM8')).toHaveLength(0)
        await sm8Batch.scrollIntoViewIfNeeded(); await shot(page, 'servicem8', width, 'preview')
        await send(page, sm8Batch.getByRole('button', { name: 'Commit exactly this preview', exact: true }))
        const sm8Invoice = (await h.state()).invoices.find((i: any) => i.source?.system === 'ServiceM8')
        await page.goto(`${origin}/app#invoices/${sm8Invoice.id}`)
        await expect(page.locator('.page')).toContainText('Opening balance $76.50 as of 2026-10-22')
        await expect(page.getByRole('button', { name: /^Approve revision/ })).toHaveCount(0)
        await shot(page, 'servicem8', width, 'invoice')
        await page.goto(`${origin}/app#reports`)
        await page.getByLabel('Aging as of', { exact: true }).fill('2026-10-22')
        const sm8Aging = page.getByRole('region', { name: 'Receivables aging', exact: true })
        await expect(sm8Aging.getByRole('heading', { name: 'USD · $76.50 open', exact: true })).toBeVisible()
        await sm8Aging.scrollIntoViewIfNeeded(); await shot(page, 'servicem8', width, 'aging')
        await page.goto(`${origin}/app#move-in`)
        await sm8Batch.getByLabel('Why undo this move-in', { exact: true }).fill('Wrong ServiceM8 snapshot')
        await send(page, sm8Batch.getByRole('button', { name: 'Undo move-in', exact: true }))
        await expect(sm8Batch).toContainText('Undone')
        expect((await h.state()).invoices.some((i: any) => i.id === sm8Invoice.id)).toBe(false)
      }
      expect(errors).toEqual([])
    } finally { await context.close(); await h.close() }
  }
})
