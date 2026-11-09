import { closeHarnessContext, finishHarnessSetup, gotoHarness, harnessRoute, reloadHarness, unrouteHarness } from './harness-route'
import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Native invitation, command and persistent Worker fixture.
import { installation, subcontractorFieldFixture, subcontractorAt } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'

test('DISP-013 subcontractor phone has current work but no notification control or offline day after reload', async ({ browser }) => {
  const h = await installation({ at: subcontractorAt })
  let context, page
  try {
    const f = await subcontractorFieldFixture(h)
    context = await browser.newContext({ viewport: { width: 390, height: 1050 } })
    page = await context.newPage()
    await harnessRoute(page, `${origin}/api/glove/**`, async route => {
      const request = route.request(), url = new URL(request.url())
      const response = await h.request(url.pathname + url.search, { as: f.sub.cookie, method: request.method(), ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    if (!process.env.GLOVE_OPEN) throw new Error('Private native entry required.')
    await gotoHarness(page, process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await finishHarnessSetup(page)
    }
    await expect(page.locator('.tech-app')).toBeVisible()
    const action = async (button: any) => {
      const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/glove/commands' && r.request().method() === 'POST')
      await button.click()
      const body = await (await response).json()
      expect(body.ok, JSON.stringify(body.error)).toBe(true)
    }
    await page.clock.setFixedTime(new Date(subcontractorAt))
    const screen = async (width: number, name: string) => {
      await page.setViewportSize({ width, height: 1050 })
      if (process.env.GLOVE_SCREENSHOTS) {
        await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
        await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-subcontractor-${name}.png`), fullPage: true })
      }
    }
    await expect(page.getByRole('heading', { name: 'Your visits', exact: true })).toBeVisible()
    await expect(page.locator('.visit-list li')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /notifications|clock in|start timer/i })).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('glove.day'))).toBeNull()
    await screen(390, 'visits')
    await screen(1440, 'visits')
    await page.setViewportSize({ width: 390, height: 1050 })
    await page.getByRole('button', { name: new RegExp(`${f.job.number} · Dental field inspection`) }).first().click()
    await expect(page.getByRole('heading', { name: `${f.job.number} · Dental field inspection`, exact: true })).toBeVisible()
    await expect(page.locator('.job .details')).toContainText('14 Harbour St, Balmain NSW 2041')
    await expect(page.locator('.job .details')).toContainText('Gate code at reception')
    await expect(page.locator('.job .details')).toContainText('Harbourview Dental · 02 9555 0101')
    await expect(page.locator('.check-content label')).toHaveText(['Isolate supply', 'Inspect connections', 'Clean work area'])
    await expect(page.getByRole('heading', { name: 'Frozen field inspection', exact: true })).toBeVisible()
    await expect(page.locator('.tech-app')).not.toContainText(/876\.54|321\.09|765\.43|Private employee|Private equipment|Changed library/)
    await expect(page.getByRole('button', { name: /notifications|clock|timer|quote|invoice|nameplate|refrigerant|expense/i })).toHaveCount(0)
    await action(page.getByRole('button', { name: 'Record arrival', exact: true }))
    await expect(page.locator('.arrival-status')).toContainText('Arrival recorded at')
    await page.getByLabel('Note', { exact: true }).fill('Subcontractor phone note')
    await action(page.getByRole('button', { name: 'Add note', exact: true }))
    await expect(page.locator('.notes .note')).toHaveText('Subcontractor phone note')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const iconControls = await page.locator('button:visible,a:visible').evaluateAll((nodes: Element[]) => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
    expect(iconControls).toEqual([])
    await screen(390, 'visit')
    await screen(1440, 'visit')
    await page.setViewportSize({ width: 390, height: 1050 })
    // A previously retained Technician day must also be discarded on this role's refresh.
    const old = await f.b.priyaPerson.state()
    await page.evaluate((state: any) => localStorage.setItem('glove.day', JSON.stringify({ actorId: state.actor.id, savedAt: '2026-11-08T12:00:00.000Z', state })), old)
    await reloadHarness(page)
    await expect(page.getByRole('heading', { name: 'Your visits', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day'))).toBeNull()
    await expect(page.getByRole('heading', { name: 'Notifications', exact: true })).toHaveCount(0)
    // Lose the real state transport on reload, keeping the document server reachable.
    // The phone cannot reconstruct work from an offline snapshot.
    await harnessRoute(page, `${origin}/api/glove/state`, route => route.abort('internetdisconnected'))
    await reloadHarness(page)
    await expect(page.locator('.tech-app')).toHaveCount(0)
    await expect(page.getByText('No signal: showing your day', { exact: false })).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('glove.day'))).toBeNull()
    await screen(390, 'no-kept-day')
    expect(h.pushes.sent).toEqual([])
    expect((await h.state()).captures.filter((c: any) => c.technicianId === f.tech.id && c.kind === 'note').map((c: any) => c.text)).toEqual(['Subcontractor phone note'])
  } finally {
    if (page) await unrouteHarness(page)
    if (context) await closeHarnessContext(context)
    await h.close()
  }
})
