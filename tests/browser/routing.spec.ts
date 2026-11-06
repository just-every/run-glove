import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The real installation harness is a JavaScript fixture.
import { installation, routingDay, assertTrail } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function productionApi(page: Page, h: any, as: string) {
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const res = await h.request(url.pathname + url.search, { as, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: res.status, contentType: res.headers.get('content-type') ?? 'application/json', body: Buffer.from(await res.arrayBuffer()) })
  })
}
async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-routing-${name}.png`), fullPage: false })
}

test('DISP-003, DISP-011 the dispatcher compares driving saved and explicitly accepts the route, at 1440 and 390', async ({ browser }) => {
  test.setTimeout(180_000)
  const at = '2026-11-03T00:00:00.000Z'
  const h = await installation({ at })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage()
  try {
    await page.clock.install({ time: new Date(at) })
    if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
    catch { throw new Error('Owner entry failed; obtain a fresh entry privately.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    const { b, day } = await routingDay(h)
    const before = (await h.state()).visits
    await productionApi(page, h, b.dispatcher.cookie)
    await page.goto(`${origin}/app#dispatch`)
    await page.getByLabel('Day', { exact: true }).fill(day)
    const routes = page.getByRole('region', { name: 'Route optimization', exact: true })
    await expect(routes).toBeVisible()
    await routes.getByRole('button', { name: 'Propose better routes', exact: true }).click()
    await expect(routes.getByText(/Waiting for the background run/)).toBeVisible()
    expect((await h.state()).visits).toEqual(before)
    await h.scheduled(Date.now())
    // Reload the real public state rather than stubbing a job's completion.
    await page.reload()
    await expect(routes.getByText(/driving saved/)).toBeVisible()
    expect((await h.state()).visits).toEqual(before)
    const proposedState = await h.state(), proposal = proposedState.routes[0]
    const clock = (value: string) => {
      const [hour, minute] = value.split(':').map(Number)
      return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
    }
    const range = (slot: any) => `${clock(slot.local.start)} – ${clock(slot.local.end)}`
    const label = (slot: any) => `${proposedState.technicians.find((t: any) => t.id === slot.technicianId).name}, ${range(slot)}`
    await expect(routes.getByText(`${(proposal.savedSeconds / 60).toFixed(1)} min driving saved`, { exact: true })).toBeVisible()
    const items = routes.locator('.route-list > li')
    await expect(items).toHaveCount(12)
    for (const [i, move] of proposal.moves.entries()) {
      const visit = before.find((v: any) => v.id === move.visitId), job = proposedState.jobs.find((j: any) => j.id === visit.jobId)
      await expect(items.nth(i).locator('strong')).toHaveText(`${job.number} · ${job.title}`)
      await expect(items.nth(i).locator('p')).toHaveText([`Before: ${label(move.before)}`, `Proposed: ${label(move.after)}`])
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await routes.scrollIntoViewIfNeeded()
      await expect(routes.getByText('Before:', { exact: false }).first()).toBeVisible()
      await expect(routes.getByRole('button', { name: 'Accept route changes', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await shot(page, width, 'proposal')
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await routes.getByRole('button', { name: 'Accept route changes', exact: true }).click()
    expect(await routes.getByLabel('Reason for accepting route').evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true)
    expect((await h.state()).visits).toEqual(before)
    await routes.getByLabel('Reason for accepting route').fill('Less driving while keeping the promised windows')
    await routes.getByRole('button', { name: 'Accept route changes', exact: true }).click()
    await expect(routes.getByText(/Route accepted/)).toBeVisible()
    const after = (await h.state()).visits
    expect(after.some((v: any) => before.find((old: any) => old.id === v.id)?.technicianId !== v.technicianId)).toBe(true)
    const accepted = (await h.state()).routes.find((r: any) => r.id === proposal.id)
    expect(accepted.decidedBy).toEqual({ id: b.dispatcher.id, name: 'Sam Ortiz', role: 'dispatcher' })
    expect(accepted.decidedAt).toBe(at)
    const changed: string[] = []
    for (const visit of after) {
      const move = proposal.moves.find((m: any) => m.visitId === visit.id), old = before.find((v: any) => v.id === visit.id)
      expect({ technicianId: visit.technicianId, startAt: visit.startAt, endAt: visit.endAt, local: visit.local, arrivalWindow: visit.arrivalWindow }).toEqual(move.after)
      const moved = old.startAt !== move.after.startAt || old.technicianId !== move.after.technicianId
      if (moved) {
        changed.push(visit.id)
        expect(visit.assignments).toEqual([...old.assignments, { ...move.after, by: accepted.decidedBy, at, reason: 'Accepted route optimization: Less driving while keeping the promised windows', reviewedConflicts: [], grantId: null }])
      } else expect(visit.assignments).toEqual(old.assignments)
    }
    const trail = await assertTrail(h, ['route.accepted', 'visit.changed'])
    const events = trail.activity.filter((e: any) => e.commandId === trail.activity.find((e: any) => e.kind === 'route.accepted').commandId)
    expect(events.filter((e: any) => e.kind === 'visit.changed').map((e: any) => e.subjectId).sort()).toEqual(changed.sort())
    for (const event of events) expect([event.actorId, event.actorName, event.actorRole, event.at]).toEqual([b.dispatcher.id, 'Sam Ortiz', 'dispatcher', at])
    await h.restart()
    await page.reload()
    await expect(routes.getByText('Route accepted. Sam Ortiz recorded: Less driving while keeping the promised windows', { exact: true })).toBeVisible()
    expect((await h.state()).visits).toEqual(after)
    const map = page.getByRole('region', { name: 'Route map', exact: true })
    for (const technician of proposedState.technicians) {
      const stops = after.filter((v: any) => v.technicianId === technician.id).sort((a: any, b: any) => a.startAt.localeCompare(b.startAt))
      const shown = map.getByRole('listitem', { name: `${technician.name}'s route`, exact: true }).locator('.where')
      await expect(shown).toHaveText(stops.map((v: any, i: number) => {
        const job = proposedState.jobs.find((j: any) => j.id === v.jobId), site = proposedState.sites.find((s: any) => s.id === job.siteId)
        return `${i + 1}${clock(v.local.start)} · ${job.number} · ${site.address.split(',')[0]}`
      }))
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await routes.scrollIntoViewIfNeeded()
      await shot(page, width, 'accepted')
    }
  } finally { await context.close(); await h.close() }
})
