import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { action } from './desk-fixture'
// @ts-expect-error Production HTTP Worker/native sessions/D1 fixture.
import { installation, business, completedJob } from '../api/harness.mjs'
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function screen(page: Page, width: number, name: string, anchor: Locator) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const iconControls = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
  expect(iconControls).toEqual([])
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
      await action(page, form.getByRole('button', { name: 'Prepare stage draft', exact: true }), false)
      await expect(form.getByRole('alert')).toContainText('remaining contract amount')
      expect((await h.state()).invoices).toHaveLength(0)
      await form.getByLabel('Unit price', { exact: true }).fill('60.00')
      await action(page, form.getByRole('button', { name: 'Prepare stage draft', exact: true }))
      await expect(form.getByLabel('Stage name', { exact: true })).toHaveValue('')
      const first = (await h.state()).invoices[0]
      await expect(form).toContainText('Remaining $129.00')
      await screen(page, width, 'progress-first-draft', form)
      await page.getByRole('button', { name: first.number, exact: true }).click()
      await action(page, page.getByRole('button', { name: 'Approve revision 1 at $60.00', exact: true }))
      await expect(page.getByRole('button', { name: 'Export 1 approved', exact: true })).toBeVisible()
      await action(page, page.getByRole('button', { name: 'Export 1 approved', exact: true }))
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
      await action(page, form.getByRole('button', { name: 'Prepare stage draft', exact: true }))
      await expect.poll(async () => (await h.state()).invoices.length).toBe(2)
      const final = (await h.state()).invoices.find((i: any) => i.id !== first.id)
      await page.getByRole('button', { name: final.number, exact: true }).click()
      await action(page, page.getByRole('button', { name: 'Approve revision 1 at $129.00', exact: true }))
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
    let disconnected = false, loseFirstReply = true, refuseFreshness = false, activeCookie: string | undefined
    const synchronized: string[] = []
    let freshnessRefusals = 0
    const deliveries: string[] = []
    try {
      const b = await business(h, { currency: 'USD', timezone: 'UTC' }), work = await completedJob(h, b)
      await ownerEntry(page)
      await context.route(`${origin}/api/glove/**`, async route => {
        if (disconnected) { await route.abort('internetdisconnected'); return }
        const req = route.request(), url = new URL(req.url()), body = req.postData() ? JSON.parse(req.postData()!) : null
        if (url.pathname === '/api/glove/state' && refuseFreshness) { freshnessRefusals++; await route.fulfill({ status: 503, json: { error: { message: 'Fresh records unavailable' } } }); return }
        if (req.method() === 'POST') synchronized.push(body.type + ':' + body.payload.visitId)
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
      await expect(page.getByRole('status').filter({ hasText: 'This phone can reopen your visits without a signal.' })).toBeVisible()
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

      // A job can be completed by Tom while its follow-up remains booked
      // for Priya; only that current assignment permits invoice custody.
      const followUp = async (date: string) => {
        const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: `Follow-up ${date}`, lines: [{ serviceId: b.service.id, description: 'Completed service', quantity: '1', unitPrice: '189.00' }] })
        const visit = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date, start: '09:00', end: '10:00' })
        const finish = await h.command('visit.book', { jobId: job.id, technicianId: b.tom.id, date, start: '11:00', end: '12:00' })
        await b.tomPerson.run('visit.arrive', { visitId: finish.id, deviceTime: `${date}T11:00:00Z` })
        for (const item of job.checklist.filter((i: any) => i.required)) await b.tomPerson.run('visit.capture', { visitId: finish.id, deviceTime: `${date}T11:10:00Z`, kind: 'checklist', itemId: item.id, result: 'done' })
        await b.tomPerson.run('visit.complete', { visitId: finish.id, deviceTime: `${date}T12:00:00Z`, summary: 'Service completed before follow-up', signoff: { absentReason: 'Customer away' } })
        return { job, visit }
      }
      const keptWork = await followUp('2026-10-23'), movedWork = await followUp('2026-10-24')
      let keptInvoice = await b.office.run('invoice.prepare', { jobId: keptWork.job.id })
      keptInvoice = await b.office.run('invoice.approve', { invoiceId: keptInvoice.id, version: keptInvoice.version, revision: 1 })
      const grant = (await h.state()).technicians.find((t: any) => t.id === b.priya.id)
      await h.command('invoice.fieldConfigure', { technicianId: grant.id, version: grant.version, enabled: true })
      await page.reload()
      await page.getByRole('button', { name: new RegExp(keptWork.job.number) }).click()
      await expect(page.getByRole('article', { name: `Approved invoice ${keptInvoice.number}` })).toBeVisible()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') || '')).toContain(keptInvoice.number)
      const beforeAssignment = await h.state()
      disconnected = true
      await context.setOffline(true)
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(movedWork.job.number) }).click()
      await page.getByRole('button', { name: 'Request invoice draft', exact: true }).click()
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(keptWork.job.number) }).click()
      await page.getByLabel('Note', { exact: true }).fill('Follow-up evidence captured before reassignment')
      await page.getByRole('button', { name: 'Add note', exact: true }).click()
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      await page.getByLabel('Note', { exact: true }).fill('Unrelated service evidence survives reassignment')
      await page.getByRole('button', { name: 'Add note', exact: true }).click()
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]').length)).toBe(3)
      for (const moved of [keptWork, movedWork]) await h.command('visit.change', { visitId: moved.visit.id, version: moved.visit.version, technicianId: b.tom.id, reason: 'Tom takes this follow-up' })
      disconnected = false
      await context.setOffline(false)
      const refusedRequest = page.getByRole('alert').filter({ hasText: 'Not accepted: Invoice draft request' })
      await expect(refusedRequest).toBeVisible()
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]').filter((q: any) => !q.refused).length)).toBe(0)
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') || '')).not.toContain(keptInvoice.number)
      await expect(page.getByRole('article', { name: `Approved invoice ${keptInvoice.number}` })).toHaveCount(0)
      const afterAssignment = await h.state()
      expect(afterAssignment.invoices).toEqual(beforeAssignment.invoices)
      expect(afterAssignment.messages).toEqual(beforeAssignment.messages)
      expect(afterAssignment.captures.filter((c: any) => c.visitId === keptWork.visit.id && c.kind === 'note').map((c: any) => c.text)).toEqual(['Follow-up evidence captured before reassignment'])
      expect(afterAssignment.visits.find((v: any) => v.id === keptWork.visit.id).lateEvidence).toEqual([expect.objectContaining({ kind: 'note', technicianId: b.priya.id, reviewed: null })])
      await expect(page.getByText('Unrelated service evidence survives reassignment', { exact: true })).toBeVisible()
      await screen(page, width, 'field-reassignment-refused-and-evidence-kept', refusedRequest)
      await refusedRequest.getByRole('button', { name: 'Dismiss', exact: true }).click()

      const conflictWork = await completedJob(h, b, '2026-10-25')
      await page.reload()
      await page.getByRole('button', { name: new RegExp(conflictWork.job.number) }).click()
      disconnected = true
      await context.setOffline(true)
      await page.getByRole('button', { name: 'Request invoice draft', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Invoice draft waiting to send', exact: true })).toBeDisabled()
      await b.office.run('invoice.prepare', { jobId: conflictWork.job.id, lines: [{ description: 'Office-reviewed service', quantity: '1', unitPrice: '245.00', tax: 'FREE' }] })
      const beforeConflict = await h.state()
      disconnected = false
      await context.setOffline(false)
      await expect(refusedRequest).toBeVisible()
      await expect(refusedRequest).toContainText('already has an invoice')
      const afterConflict = await h.state()
      expect(afterConflict.invoices).toEqual(beforeConflict.invoices)
      expect(afterConflict.invoices.filter((i: any) => i.jobId === conflictWork.job.id)).toHaveLength(1)
      expect(afterConflict.messages).toEqual(beforeConflict.messages)
      await expect(page.getByRole('article', { name: /Approved invoice/ })).toHaveCount(0)
      await screen(page, width, 'field-office-conflict-refused', refusedRequest)
      await refusedRequest.getByRole('button', { name: 'Dismiss', exact: true }).click()
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]').length)).toBe(0)

      // The approved copy and another job's invoice request belong to the
      // erased customer; the third visit belongs to an unrelated customer.
      const erasedWork = await completedJob(h, b, '2026-10-21')
      const peerCustomer = await h.command('customer.save', { name: 'Cedar Lane Clinic', email: 'cedar@example.test' })
      const peerSite = await h.command('site.save', { customerId: peerCustomer.id, address: '128 Cedar Lane' })
      const peer = await completedJob(h, { ...b, customer: peerCustomer, site: peerSite }, '2026-10-22')
      const withdrawn = (await h.state()).technicians.find((t: any) => t.id === b.priya.id)
      await h.command('invoice.fieldConfigure', { technicianId: withdrawn.id, version: withdrawn.version, enabled: true })
      await page.reload()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      await expect(presentation).toContainText('Approved revision 1')
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') || '')).toContain(invoice.number)
      disconnected = true
      await context.setOffline(true)
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(erasedWork.job.number) }).click()
      await page.getByRole('button', { name: 'Request invoice draft', exact: true }).click()
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(peer.job.number) }).click()
      await page.getByLabel('Note', { exact: true }).fill('Cedar Lane follow-up work')
      await page.getByRole('button', { name: 'Add note', exact: true }).click()
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]').length)).toBe(2)
      await page.reload()
      await page.getByRole('button', { name: new RegExp(work.job.number) }).click()
      await expect(presentation).toContainText('Kept on this phone')
      await screen(page, width, 'field-erasure-kept-and-queued', presentation)
      const queueBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))
      expect(queueBefore.map((q: any) => q.type)).toEqual(['invoice.fieldPrepare', 'visit.capture'])
      expect(queueBefore[0].payload.visitId).toBe(erasedWork.visit.id)
      expect(queueBefore[1].payload.visitId).toBe(peer.visit.id)
      const customer = (await h.state()).customers.find((c: any) => c.id === b.customer.id)
      const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
      await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
      const beforeSync = synchronized.length
      refuseFreshness = true
      disconnected = false
      await context.setOffline(false)
      await expect(presentation).toHaveCount(0)
      // Even a reachable server cannot authorize work while its current-state
      // read fails. Explicit replay must also wait for that successful read.
      await expect.poll(() => freshnessRefusals).toBeGreaterThan(0)
      expect(synchronized.slice(beforeSync)).toEqual([])
      await page.getByRole('button', { name: 'Send now', exact: true }).click()
      expect(synchronized.slice(beforeSync)).toEqual([])
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))).toEqual(queueBefore)
      refuseFreshness = false
      await page.evaluate(() => window.dispatchEvent(new Event('online')))
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.outbox') || '[]'), { timeout: 25000 }).toBe('[]')
      expect(synchronized.slice(beforeSync)).toEqual(['visit.capture:' + peer.visit.id])
      const after = await h.state(), retained = after.invoices.find((i: any) => i.id === invoice.id)
      expect(after.invoices).toHaveLength(3)
      for (const before of beforeConflict.invoices) {
        const erasedInvoice = after.invoices.find((i: any) => i.id === before.id)
        expect(erasedInvoice.revisions.map((r: any) => r.totals)).toEqual(before.revisions.map((r: any) => r.totals))
        expect(erasedInvoice.erasedAt).toBeTruthy()
      }
      expect(retained.revisions[0].totals).toEqual(invoice.revisions[0].totals)
      expect(retained.erasedAt).toBeTruthy()
      expect(after.customers.find((c: any) => c.id === customer.id).name).toBe('Erased customer')
      expect(after.captures.filter((c: any) => c.jobId === peer.job.id && c.kind === 'note').map((c: any) => c.text)).toEqual(['Cedar Lane follow-up work'])
      expect(after.messages).toHaveLength(0)
      expect(h.email.sent).toHaveLength(0)
      const local = await page.evaluate(() => JSON.stringify(localStorage))
      expect(local).not.toContain(invoice.number)
      expect(local).not.toContain(customer.name)
      expect(local).toContain(peerCustomer.name)
      await expect(page.getByRole('heading', { name: 'Your visits', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: new RegExp(work.job.number) })).toHaveCount(0)
      await expect(page.getByRole('button', { name: new RegExp(erasedWork.job.number) })).toHaveCount(0)
      await page.getByRole('button', { name: new RegExp(peer.job.number) }).click()
      await expect(page.getByText('Cedar Lane follow-up work', { exact: true })).toBeVisible()
      await screen(page, width, 'field-erasure-synchronized-peer', page.getByRole('heading', { name: peer.job.number + ' · ' + peer.job.title, exact: true }))
      disconnected = true
      await context.setOffline(true)
      await page.reload()
      await expect(page.getByRole('button', { name: new RegExp(work.job.number) })).toHaveCount(0)
      await expect(page.getByRole('button', { name: new RegExp(peer.job.number) })).toBeVisible()
    } finally { disconnected = false; await context.setOffline(false); await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
