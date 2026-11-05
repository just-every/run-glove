import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker, durable D1 and native signed-in people.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function screens(page: Page, name: string, panel: Locator) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await panel.scrollIntoViewIfNeeded()
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await panel.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-conversation-${name}.png`) })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
}

test('COMM-007 desk records two human histories, reads merged jobs after restart, and clears obsolete or refused conversations', async ({ browser }) => {
  const h = await installation({ at: '2030-03-12T12:00:00Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  let held: { query: string; arrived: () => void; wait: Promise<void> } | null = null
  let releaseHeld: (() => void) | undefined
  try {
    await h.command('business.save', { name: 'Harbour Service', timezone: 'UTC' })
    const desk = await h.person('Morgan Desk', 'office')
    const branch = await h.command('branch.save', { name: 'River', prefix: 'RIV', timezone: 'UTC', zips: ['10001'] })
    const harbour = await h.command('customer.save', { name: 'Harbour Workshop' })
    const river = await h.command('customer.save', { name: 'River Clinic' })
    const harbourSite = await h.command('site.save', { customerId: harbour.id, address: '10 Harbour Street' })
    const riverSite = await h.command('site.save', { customerId: river.id, address: '20 River Street' })
    const harbourJob = await h.command('job.create', { customerId: harbour.id, siteId: harbourSite.id, title: 'Harbour inspection' })
    const riverJob = await h.command('job.create', { customerId: river.id, siteId: riverSite.id, title: 'River inspection' })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    // The UI uses the real Worker and signed-in desk session. Delay a read only
    // to inspect the ordinary pending state; never fabricate a domain answer.
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { as: desk.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      const body = Buffer.from(await response.arrayBuffer())
      const pause = held
      if (pause && url.pathname === '/api/glove/conversation' && url.searchParams.toString() === pause.query) { pause.arrived(); await pause.wait }
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body })
    })
    const customerPanel = page.getByRole('region', { name: 'Customer conversation', exact: true })
    const jobPanel = page.getByRole('region', { name: 'Job conversation', exact: true })
    const rows = (panel: Locator) => panel.locator('ol.timeline-list > li')
    async function selectCustomer(name: string) {
      await page.getByRole('button', { name, exact: true }).click()
      await expect(customerPanel).toBeVisible()
    }
    async function log(panel: Locator, kind: string, text: string, minute: number, direction = 'inbound', outcome = 'answered') {
      await h.request('/__test/clock', { method: 'POST', body: { at: `2030-03-12T12:${String(minute).padStart(2, '0')}:00Z` } })
      const form = panel.getByRole('form', { name: 'Log a call or note', exact: true })
      await form.getByLabel('Log', { exact: true }).selectOption(kind)
      if (kind === 'call') {
        await form.getByLabel('Direction', { exact: true }).selectOption(direction)
        await form.getByLabel('Outcome', { exact: true }).selectOption(outcome)
        await form.getByLabel('Minutes (optional)', { exact: true }).fill('4')
      }
      await form.getByLabel(kind === 'call' ? 'What was said (optional)' : 'Note', { exact: true }).fill(text)
      const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
      await form.getByRole('button', { name: kind === 'call' ? 'Log call' : 'Log note', exact: true }).click()
      expect((await (await response).json()).ok).toBe(true)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(panel).toContainText(text)
    }
    await page.goto(`${origin}/app#jobs/${harbourJob.id}`)
    await log(jobPanel, 'call', 'Harbour called about the filter', 1)
    await log(jobPanel, 'note', 'Harbour needs a washable filter', 3)
    await page.goto(`${origin}/app#jobs/${riverJob.id}`)
    await log(jobPanel, 'call', 'River callback reached voicemail', 2, 'outbound', 'voicemail')
    await log(jobPanel, 'note', 'River needs the back entrance', 4)
    await page.goto(`${origin}/app#customers`)
    await selectCustomer(harbour.name)
    await log(customerPanel, 'note', 'Harbour account contact updated', 5)
    await expect(rows(customerPanel).locator('.conversation-entry > p:nth-child(2)')).toHaveText(['Harbour called about the filter', 'Harbour needs a washable filter', 'Harbour account contact updated'])
    await expect(rows(customerPanel).nth(0)).toContainText('Inbound call · phone call (logged) · Harbour Workshop to Morgan Desk · recorded by Morgan Desk')
    await expect(rows(customerPanel).nth(0)).toContainText('answered, 4 min')
    await expect(rows(customerPanel).nth(1)).toContainText('Internal note · note · Morgan Desk')
    await screens(page, 'harbour', customerPanel)

    // Reproduce the stale body while switching between two populated customers.
    let arrive!: () => void, release!: () => void
    const arrived = new Promise<void>(resolve => { arrive = resolve })
    held = { query: `customerId=${river.id}`, arrived: arrive, wait: new Promise<void>(resolve => { release = resolve }) }
    releaseHeld = release
    await selectCustomer(river.name)
    await arrived
    await expect(customerPanel).not.toContainText('Harbour called about the filter')
    await expect(customerPanel).not.toContainText('Harbour account contact updated')
    release(); held = null
    await expect(rows(customerPanel).locator('.conversation-entry > p:nth-child(2)')).toHaveText(['River callback reached voicemail', 'River needs the back entrance'])
    await expect(rows(customerPanel).nth(0)).toContainText('Outbound call · phone call (logged) · Morgan Desk to River Clinic')
    await expect(rows(customerPanel).nth(0)).toContainText('voicemail, 4 min')
    await screens(page, 'river', customerPanel)
    await page.reload()
    await selectCustomer(river.name)
    await expect(customerPanel).toContainText('River needs the back entrance')

    const domain = async () => { const { exportedAt: _time, ...records } = await (await h.request('/api/glove/export')).json(); return records }
    // Authority changes take effect at the Worker even while permitted desk
    // state is still displayed in this tab.
    await h.command('role.set', { operatorId: desk.id, role: 'technician' })
    const beforeRole = await domain()
    const roleRead = page.waitForResponse(r => new URL(r.url()).pathname === '/api/glove/conversation' && r.status() === 403)
    await selectCustomer(harbour.name)
    await roleRead
    await expect(customerPanel.getByRole('alert')).toContainText("The conversation history is the desk's")
    await expect(rows(customerPanel)).toHaveCount(0)
    expect(await domain()).toEqual(beforeRole)
    await screens(page, 'authority-withdrawn', customerPanel)
    await h.command('role.set', { operatorId: desk.id, role: 'office' })
    await page.reload()
    await selectCustomer(river.name)
    await expect(customerPanel).toContainText('River needs the back entrance')
    await h.command('branch.limit', { operatorId: desk.id, branchId: branch.id })
    const beforeBranch = await domain()
    const branchRead = page.waitForResponse(r => new URL(r.url()).pathname === '/api/glove/conversation' && r.status() === 404)
    await selectCustomer(harbour.name)
    await branchRead
    await expect(customerPanel.getByRole('alert')).toContainText('No such customer for you')
    await expect(rows(customerPanel)).toHaveCount(0)
    expect(await domain()).toEqual(beforeBranch)
    await screens(page, 'branch-refused', customerPanel)
    await h.command('branch.limit', { operatorId: desk.id, branchId: null })

    const s = await h.state()
    await h.command('customer.merge', { survivorId: harbour.id, mergedIds: [river.id], versions: Object.fromEntries(s.customers.filter((c: any) => [harbour.id, river.id].includes(c.id)).map((c: any) => [c.id, c.version])) })
    await h.restart()
    await page.reload()
    await selectCustomer(harbour.name)
    await expect(rows(customerPanel).locator('.conversation-entry > p:nth-child(2)')).toHaveText(['Harbour called about the filter', 'River callback reached voicemail', 'Harbour needs a washable filter', 'River needs the back entrance', 'Harbour account contact updated'])
    await screens(page, 'survivor-after-restart', customerPanel)
    await page.goto(`${origin}/app#jobs/${harbourJob.id}`)
    await expect(rows(jobPanel).locator('.conversation-entry > p:nth-child(2)')).toHaveText(['Harbour called about the filter', 'Harbour needs a washable filter'])
    await screens(page, 'harbour-job', jobPanel)
    await page.goto(`${origin}/app#jobs/${riverJob.id}`)
    await expect(rows(jobPanel).locator('.conversation-entry > p:nth-child(2)')).toHaveText(['River callback reached voicemail', 'River needs the back entrance'])
    await screens(page, 'river-job', jobPanel)
  } finally {
    // A delayed transport is always released before shutting down its Worker.
    releaseHeld?.()
    await page.unrouteAll({ behavior: 'wait' })
    await context.close(); await h.close()
  }
})
