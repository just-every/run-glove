import { closeHarnessContext, finishHarnessSetup, gotoHarness, harnessRoute } from './harness-route'
import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The fixture drives production Worker commands with native sessions.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('Arrival promises survive desk booking and reload and appear on the assigned technician phone', async ({ browser }) => {
  const at = '2026-11-02T00:00:00.000Z'
  const h = await installation({ at })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  try {
    await page.clock.install({ time: new Date(at) })
    if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
    try { await gotoHarness(page, process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
    catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await finishHarnessSetup(page)
    }
    const b = await business(h)
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Morning arrival promise' })
    let acting = b.dispatcher.cookie
    await harnessRoute(page, `${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const res = await h.request(url.pathname + url.search, { as: acting, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) })
    })
    await gotoHarness(page, `${origin}/app#dispatch`)
    await page.getByLabel('Day', { exact: true }).fill('2026-11-03')
    await page.getByRole('button', { name: 'Book visit', exact: true }).first().click()
    const form = page.locator('form.book-form')
    await form.getByLabel('Job', { exact: true }).selectOption(job.id)
    await form.getByLabel('Technician', { exact: true }).selectOption('auto')
    await form.getByLabel('Date', { exact: true }).fill('2026-11-03')
    await form.getByLabel('Starts', { exact: true }).fill('09:00')
    await form.getByLabel('Ends', { exact: true }).fill('10:30')
    await form.getByLabel('Arrival window from (optional)', { exact: true }).fill('08:00')
    await form.getByLabel('Arrival window until (optional)', { exact: true }).fill('10:00')
    const response = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'visit.book')
    await form.getByRole('button', { name: 'Book visit', exact: true }).click()
    expect((await (await response).json()).ok).toBe(true)
    await expect(form).toHaveCount(0)
    const visit = (await h.state()).visits.find((v: any) => v.jobId === job.id)
    expect([visit.arrivalWindow, visit.local.start, visit.local.end, visit.technicianId]).toEqual([{ start: '08:00', end: '10:00' }, '09:00', '10:30', b.priya.id])
    const shot = async (width: number, name: string) => {
      if (!process.env.GLOVE_SCREENSHOTS) return
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-arrival-${name}.png`), fullPage: name === 'dispatcher' })
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      acting = b.dispatcher.cookie
      await gotoHarness(page, `${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill('2026-11-03')
      await page.getByRole('button', { name: new RegExp(`${job.number} Morning arrival promise,`) }).click()
      const panel = page.getByRole('region', { name: 'Morning arrival promise', exact: true })
      await panel.scrollIntoViewIfNeeded()
      if (width === 1440) {
        await expect(panel).toContainText('Arrival window 8:00 AM – 10:00 AM')
        const close = panel.getByRole('button', { name: 'Close visit', exact: true })
        await close.focus()
        await expect(panel.getByRole('tooltip', { name: 'Close visit', exact: true })).toBeVisible()
        await close.blur()
        await close.hover()
        await page.clock.runFor(350)
        await expect(panel.getByRole('tooltip', { name: 'Close visit', exact: true })).toBeVisible()
      }
      await panel.getByRole('radio', { name: /Pick another time/ }).check()
      await shot(width, 'dispatcher')
      acting = b.priyaPerson.cookie
      await gotoHarness(page, `${origin}/app?job=${job.id}`)
      const phone = page.getByRole('region', { name: `${job.number} · Morning arrival promise`, exact: true })
      await phone.scrollIntoViewIfNeeded()
      if (width === 1440) {
        await expect(phone).toContainText('9:00 AM – 10:30 AM')
        await expect(phone).toContainText('arrival window 8:00 AM – 10:00 AM')
      }
      await shot(width, 'technician')
    }
    // A dispatcher changes the promise through the visit panel, with the same
    // refusal and explicit removal semantics as the booking command.
    acting = b.dispatcher.cookie
    await page.setViewportSize({ width: 1440, height: 1050 })
    const openPanel = async () => {
      await gotoHarness(page, `${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill('2026-11-03')
      await page.getByRole('button', { name: new RegExp(`${job.number} Morning arrival promise,`) }).click()
      const panel = page.getByRole('region', { name: 'Morning arrival promise', exact: true })
      await panel.getByRole('radio', { name: /Pick another time/ }).check()
      return panel
    }
    const apply = async (panel: any) => {
      const response = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'visit.change')
      await panel.getByRole('button', { name: 'Apply change', exact: true }).click()
      return (await (await response).json())
    }
    let panel = await openPanel()
    await expect(panel.getByLabel('Arrival window from (optional)', { exact: true })).toHaveValue('08:00')
    await expect(panel.getByLabel('Arrival window until (optional)', { exact: true })).toHaveValue('10:00')
    await panel.getByLabel('Starts', { exact: true }).fill('10:01')
    await panel.getByLabel('Ends', { exact: true }).fill('11:30')
    await panel.getByLabel('Reason for the change', { exact: true }).fill('Review a later start')
    const before = await h.state()
    expect((await apply(panel)).error.code).toBe('WINDOW')
    expect(await h.state()).toEqual(before)
    await panel.getByLabel('Starts', { exact: true }).fill('10:00')
    expect((await apply(panel)).ok).toBe(true)
    await expect(panel).toHaveCount(0)
    panel = await openPanel()
    await expect(panel).toContainText('Arrival window 8:00 AM – 10:00 AM')
    await panel.getByLabel('Starts', { exact: true }).fill('13:00')
    await panel.getByLabel('Ends', { exact: true }).fill('14:30')
    await panel.getByLabel('Arrival window from (optional)', { exact: true }).fill('12:00')
    await panel.getByLabel('Arrival window until (optional)', { exact: true }).fill('14:00')
    await panel.getByLabel('Reason for the change', { exact: true }).fill('Customer asked for afternoon')
    expect((await apply(panel)).ok).toBe(true)
    await expect(panel).toHaveCount(0)
    acting = b.priyaPerson.cookie
    await gotoHarness(page, `${origin}/app?job=${job.id}`)
    let revisedPhone = page.getByRole('region', { name: `${job.number} · Morning arrival promise`, exact: true })
    await expect(revisedPhone).toContainText('1:00 PM – 2:30 PM')
    await expect(revisedPhone).toContainText('arrival window 12:00 PM – 2:00 PM')
    acting = b.dispatcher.cookie
    panel = await openPanel()
    await expect(panel).toContainText('Arrival window 12:00 PM – 2:00 PM')
    await expect(panel.getByLabel('Starts', { exact: true })).toHaveValue('13:00')
    await expect(panel.getByLabel('Ends', { exact: true })).toHaveValue('14:30')
    await panel.getByLabel('Arrival window from (optional)', { exact: true }).fill('')
    await panel.getByLabel('Arrival window until (optional)', { exact: true }).fill('')
    await panel.getByLabel('Reason for the change', { exact: true }).fill('Customer no longer needs a promise')
    expect((await apply(panel)).ok).toBe(true)
    await expect(panel).toHaveCount(0)
    panel = await openPanel()
    await expect(panel).not.toContainText('Arrival window 12:00 PM – 2:00 PM')
    const removed = (await h.state()).visits.find((v: any) => v.id === visit.id)
    expect(removed.arrivalWindow).toBeUndefined()
    expect([removed.local.start, removed.local.end]).toEqual(['13:00', '14:30'])
    acting = b.priyaPerson.cookie
    await gotoHarness(page, `${origin}/app?job=${job.id}`)
    revisedPhone = page.getByRole('region', { name: `${job.number} · Morning arrival promise`, exact: true })
    await expect(revisedPhone).toContainText('1:00 PM – 2:30 PM')
    await expect(revisedPhone).not.toContainText('arrival window')
  } finally { await closeHarnessContext(context); await h.close() }
})
