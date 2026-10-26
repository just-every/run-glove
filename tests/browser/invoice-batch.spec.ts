import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production HTTP Worker/native sessions/D1 fixture.
import { installation, business, completedJob } from '../api/harness.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function screen(page: Page, width: number, name: string, anchor: Locator) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-invoice-batch-${name}.png`) })
  }
}
test('PAY-001 the office prepares three selected completed jobs together, sees a refused item and reviews each draft and downloads a customer statement at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation({ at: '2026-11-01T10:00:00Z' }), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h), jobs = []
      for (const date of ['2026-10-17', '2026-10-18', '2026-10-19']) jobs.push(await completedJob(h, b, date))
      const unpriced = await completedJob(h, b, '2026-10-20')
      await b.priyaPerson.run('visit.capture', { visitId: unpriced.visit.id, kind: 'material', description: 'Uncatalogued valve', quantity: '1', deviceTime: '2026-10-20T23:01:00Z' })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { as: b.office.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#invoices`)
      const batch = page.getByRole('form', { name: 'Prepare invoices together' })
      await expect(batch.getByRole('button', { name: 'Prepare 0 draft invoices', exact: true })).toBeDisabled()
      for (const work of [...jobs, unpriced]) await batch.getByRole('checkbox', { name: new RegExp(work.job.number) }).check()
      await screen(page, width, 'selected', batch)
      const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await batch.getByRole('button', { name: 'Prepare 4 draft invoices', exact: true }).click()
      const answer = await (await response).json()
      expect(answer.ok).toBe(true)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      expect(answer.result.results.map((r: any) => r.ok)).toEqual([true, true, true, false])
      const invoices = (await h.state()).invoices
      expect(invoices).toHaveLength(3)
      expect(invoices.map((i: any) => [i.status, i.revisions[0].approval])).toEqual([['draft', null], ['draft', null], ['draft', null]])
      const outcome = batch.getByRole('status')
      await expect(outcome).toContainText(unpriced.job.number)
      expect(answer.result.results[3].error.code).toBe('UNPRICED_MATERIALS')
      await expect(outcome).toContainText(answer.result.results[3].error.message)
      await expect(batch.getByRole('checkbox')).toHaveCount(1)
      await screen(page, width, 'results', outcome)
      for (const [index, invoice] of invoices.entries()) {
        if (index === 0) await batch.getByRole('link', { name: invoice.number, exact: true }).click()
        else {
          await page.goto(`${origin}/app#invoices`)
          await page.getByRole('button', { name: invoice.number, exact: true }).click()
        }
        const heading = page.getByRole('heading', { name: `${invoice.number} · Harbourview Dental`, exact: true })
        await expect(heading).toBeVisible()
        await expect(page.getByRole('button', { name: /Approve revision 1/ })).toBeVisible()
        await screen(page, width, `review-${invoice.number}`, heading)
      }
      await page.reload()
      expect((await h.state()).invoices).toHaveLength(3)
      await page.getByRole('button', { name: invoices.at(-1).number, exact: true }).click()
      await screen(page, width, 'retained', page.getByRole('heading', { name: `${invoices.at(-1).number} · Harbourview Dental`, exact: true }))
      const invoice = await b.office.run('invoice.approve', { invoiceId: invoices[0].id, version: invoices[0].version, revision: 1 })
      await b.office.run('payment.record', { invoiceId: invoice.id, version: invoice.version, method: 'check', amount: '50.00', reference: 'synthetic-glove-browser-1' })
      await h.scheduled('2026-11-01T10:00:00Z')
      await page.goto(`${origin}/app#customers/${b.customer.id}`)
      const statement = page.getByRole('button', { name: 'Download customer statement', exact: true })
      await expect(statement).toBeVisible()
      await statement.focus()
      await expect(statement).toBeFocused()
      await screen(page, width, 'customer-statement', statement)
      const downloading = page.waitForEvent('download')
      await statement.click()
      const download = await downloading
      const csv = await readFile((await download.path())!, 'utf8')
      expect(csv).toContain(invoice.number)
      expect(csv).toContain('50.00')
      expect(csv).toContain('157.90')
      expect(csv).not.toContain(invoices[1].number)
      await page.goto(`${origin}/app#activity`)
      const notice = page.getByText(/Office reminder: .* is completed and awaits invoice preparation or approval/).first()
      await expect(notice).toBeVisible()
      await screen(page, width, 'office-reminder', notice)

    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})

async function ownerEntry(page: Page) {
  if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
  await page.goto(process.env.GLOVE_OPEN)
  await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(u => u.pathname === '/app')
  }
}

test('PAY-001 office stages a long job, sees the remaining contract amount and approves the exact final invoice at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h, { currency: 'USD', timezone: 'UTC' }), work = await completedJob(h, b)
      await ownerEntry(page)
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { as: b.office.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#invoices`)
      let form = page.getByRole('form', { name: 'Prepare progress invoice' })
      await form.getByLabel('Progress job', { exact: true }).selectOption(work.job.id)
      await form.getByLabel('Stage name', { exact: true }).fill('Rough in')
      await form.getByLabel('Description', { exact: true }).fill('Installation rough in')
      await form.getByLabel('Unit price', { exact: true }).fill('200.00')
      await form.getByRole('button', { name: 'Prepare stage draft', exact: true }).click()
      await expect(form.getByRole('alert')).toContainText('remaining contract amount')
      expect((await h.state()).invoices).toHaveLength(0)
      await form.getByLabel('Unit price', { exact: true }).fill('60.00')
      await form.getByRole('button', { name: 'Prepare stage draft', exact: true }).click()
      await expect(form.getByLabel('Stage name', { exact: true })).toHaveValue('')
      const first = (await h.state()).invoices[0]
      await expect(form).toContainText('Remaining $129.00')
      await screen(page, width, 'progress-first-draft', form)
      await page.getByRole('button', { name: first.number, exact: true }).click()
      await page.getByRole('button', { name: 'Approve revision 1 at $60.00', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Export 1 approved', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Export 1 approved', exact: true }).click()
      await expect.poll(async () => (await h.state()).invoices.find((i: any) => i.id === first.id).status).toBe('exported')
      expect((await h.state()).jobs.find((j: any) => j.id === work.job.id).status).toBe('completed')
      await page.goto(`${origin}/app#invoices`)
      form = page.getByRole('form', { name: 'Prepare progress invoice' })
      await form.getByLabel('Progress job', { exact: true }).selectOption(work.job.id)
      await form.getByLabel('Stage name', { exact: true }).fill('Final commissioning')
      await form.getByLabel('Description', { exact: true }).fill('Remaining installation work')
      await form.getByLabel('Unit price', { exact: true }).fill('129.00')
      await form.getByRole('checkbox', { name: 'Final stage', exact: true }).check()
      await screen(page, width, 'progress-final-review', form)
      await form.getByRole('button', { name: 'Prepare stage draft', exact: true }).click()
      await expect.poll(async () => (await h.state()).invoices.length).toBe(2)
      const final = (await h.state()).invoices.find((i: any) => i.id !== first.id)
      await page.getByRole('button', { name: final.number, exact: true }).click()
      await page.getByRole('button', { name: 'Approve revision 1 at $129.00', exact: true }).click()
      const detail = page.getByRole('region', { name: `${final.number} · Harbourview Dental`, exact: true })
      await expect(detail).toContainText('Final commissioning')
      await expect(detail.getByLabel('Progress invoice stages')).toContainText(first.number)
      await screen(page, width, 'progress-approved-final', detail)
      expect((await h.state()).invoices.map((i: any) => i.revisions[0].totals.total)).toEqual(['60.00', '129.00'])
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})

test('PAY-001 owner allows a technician to queue one invoice draft offline and present its approved revision after reconnect and reload at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    let disconnected = false, loseFirstReply = true, activeCookie: string | undefined
    const deliveries: string[] = []
    try {
      const b = await business(h, { currency: 'USD', timezone: 'UTC' }), work = await completedJob(h, b)
      await ownerEntry(page)
      await context.route(`${origin}/api/glove/**`, async route => {
        if (disconnected) { await route.abort('internetdisconnected'); return }
        const req = route.request(), url = new URL(req.url()), body = req.postData() ? JSON.parse(req.postData()!) : null
        const response = await h.request(url.pathname + url.search, { ...(activeCookie ? { as: activeCookie } : {}), method: req.method(), ...(body ? { body } : {}) })
        if (body?.type === 'invoice.fieldPrepare') {
          deliveries.push(body.commandId)
          if (loseFirstReply) { loseFirstReply = false; await route.abort('failed'); return }
        }
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#team`)
      const technician = page.locator('.technician-row').filter({ has: page.getByText('Priya N.', { exact: true }) })
      await technician.getByRole('button', { name: 'Allow field invoices', exact: true }).click()
      await expect(technician.getByRole('button', { name: 'Withdraw field invoices', exact: true })).toBeVisible()
      await screen(page, width, 'field-owner-permission', technician)
      activeCookie = b.priyaPerson.cookie
      await page.goto(`${origin}/app?job=${work.job.id}`)
      await expect(page.getByRole('heading', { name: `${work.job.number} · ${work.job.title}`, exact: true })).toBeVisible()
      const request = page.getByRole('button', { name: 'Request invoice draft', exact: true })
      await expect(request).toBeEnabled()
      await expect.poll(() => page.evaluate(async () => !!(await (await caches.open('glove-shell-v1')).match('/app')))).toBe(true)
      disconnected = true
      await context.setOffline(true)
      await request.click()
      await expect(page.getByRole('button', { name: 'Invoice draft waiting to send', exact: true })).toBeDisabled()
      const queuedId = await page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]')[0].commandId)
      expect((await h.state()).invoices).toHaveLength(0)
      await screen(page, width, 'field-offline-request', page.getByRole('heading', { name: 'Invoice', exact: true }))
      await page.reload()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      await expect(page.getByRole('button', { name: 'Invoice draft waiting to send', exact: true })).toBeDisabled()
      disconnected = false
      await context.setOffline(false)
      await expect.poll(() => deliveries.length).toBe(1)
      await expect.poll(async () => (await h.state()).invoices.length).toBe(1)
      await page.evaluate(() => window.dispatchEvent(new Event('online')))
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]').length)).toBe(0)
      expect(deliveries).toEqual([queuedId, queuedId])
      let invoice = (await h.state()).invoices[0]
      expect(invoice.status).toBe('draft')
      await expect(page.getByRole('article', { name: `Approved invoice ${invoice.number}` })).toHaveCount(0)
      invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
      await page.reload()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      const presentation = page.getByRole('article', { name: `Approved invoice ${invoice.number}` })
      await expect(presentation).toContainText('Approved revision 1')
      await expect(presentation).toContainText('$189.00')
      await screen(page, width, 'field-approved-presentation', presentation)
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') || '')).toContain(invoice.number)
      disconnected = true
      await context.setOffline(true)
      await page.reload()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      await expect(presentation).toContainText('Kept on this phone')
      await expect(presentation).toContainText('Approved revision 1')
      await screen(page, width, 'field-kept-approved', presentation)
      const tech = (await h.state()).technicians.find((t: any) => t.id === b.priya.id)
      await h.command('invoice.fieldConfigure', { technicianId: tech.id, version: tech.version, enabled: false })
      disconnected = false
      await context.setOffline(false)
      await expect(presentation).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') || '')).not.toContain(invoice.number)
      expect((await h.state()).invoices).toHaveLength(1)
      expect(h.email.sent).toHaveLength(0)
    } finally { disconnected = false; await context.setOffline(false); await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
