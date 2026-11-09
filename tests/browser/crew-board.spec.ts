import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The fixture uses production Worker doors, native sessions and D1.
import { installation, business } from '../api/harness.mjs'
// @ts-expect-error Named scenarios share this single browser registration.
import { scenario } from '../fixtures/scenario.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const short = (date: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' }).formatToParts(new Date(`${date}T00:00:00Z`)).filter(p => p.type !== 'literal').map(p => p.value).join(' ')
type Row = Record<string, any>
type AuditAction = { commandId: string; kind: string; actor: Row; subjects: string[] }

async function send(page: Page, button: Locator, type: string) {
  const answer = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST' && r.request().postDataJSON().type === type)
  await button.click()
  const response = await answer, body = await response.json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return { result: body.result, commandId: response.request().postDataJSON().commandId as string }
}

async function screen(page: Page, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name} fits the viewport`).toBe(true)
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${page.viewportSize()!.width}-crew-${name}.png`), fullPage: true })
}

test('DISP-007 points 1 and 7: crew bookings stay single on every board and drag, keyboard move and cancellation retain the human actor', async ({ browser }, info) => {
  const h = await installation({ at: '2026-11-01T12:00:00.000Z' })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  context.setDefaultTimeout(15_000)
  const page = await context.newPage()
  const step = (name: string, run: () => Promise<void>) => test.step(name, () => scenario({ diagnostic: (message: string) => info.annotations.push({ type: 'scenario', description: message }) }, name, run))
  try {
    if (!process.env.GLOVE_OPEN) throw new Error('A private owner entry from rer dev is required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) }
    catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    await page.clock.setFixedTime(new Date('2026-11-01T12:00:00.000Z'))
    const b = await business(h)
    const sub = await h.person('Sid Install', 'subcontractor')
    const sid = await h.command('technician.save', { name: sub.name, operatorId: sub.id, subcontractor: { payeeName: 'Sid Install Services', tinLast4: '4321' } })
    const owner = (await h.state()).actor
    const dispatcher = (await b.dispatcher.state()).actor
    const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Three-day dental air handler install' })
    const dates = ['2026-11-02', '2026-11-03', '2026-11-04']
    const actions: AuditAction[] = [], bookings: Row[] = []
    let acting = h.owner(), crew: Row = {}, original: Row[] = []
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url())
      const response = await h.request(url.pathname + url.search, { as: acting, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const board = page.getByRole('region', { name: 'Board', exact: true })
    const view = (name: string) => page.getByRole('group', { name: 'Board view', exact: true }).getByRole('button', { name, exact: true }).click()
    const chip = (within: Locator) => within.getByRole('button', { name: new RegExp(`^${job.number} ${job.title},`) })
    const cell = (date: string) => board.getByRole('gridcell', { name: `Crew ${crew.name} ${short(date)}`, exact: true })
    const group = async () => (await h.state()).visits.filter((v: Row) => v.crew?.groupId === bookings[0].id)
    const follows = async (date: string) => {
      const members = await group()
      expect(members.map((v: Row) => [v.id, v.technicianId, v.local.date, v.local.start, v.local.end, v.status]).sort()).toEqual(
        bookings[0].visits.map((v: Row) => [v.id, v.technicianId, date, '09:00', '15:00', 'booked']).sort())
      const others = (await h.state()).visits.filter((v: Row) => v.crew?.groupId !== bookings[0].id)
      expect(others).toEqual(original.filter(v => v.crew?.groupId !== bookings[0].id))
    }

    await step('DISP-007 point 1: Owner names the two-person crew and Dispatcher books three install days alongside the subcontractor', async () => {
      await page.goto(`${origin}/app#team`)
      const crews = page.getByRole('region', { name: 'Crews', exact: true })
      await crews.getByLabel('Crew name', { exact: true }).fill('Dental install')
      for (const member of [b.priya, b.tom]) await crews.getByLabel(member.name, { exact: true }).check()
      const saved = await send(page, crews.getByRole('button', { name: 'Save crew', exact: true }), 'crew.save')
      crew = saved.result
      expect(crew.memberIds.slice().sort()).toEqual([b.priya.id, b.tom.id].sort())
      actions.push({ commandId: saved.commandId, kind: 'crew.saved', actor: owner, subjects: [crew.id] })
      await screen(page, 'team')
      acting = b.dispatcher.cookie
      await page.goto(`${origin}/app#dispatch`)
      for (const date of dates) {
        await page.getByRole('button', { name: 'Book visit', exact: true }).first().click()
        const form = page.locator('form.book-form')
        await form.getByLabel('Job', { exact: true }).selectOption(job.id)
        await form.getByLabel('Technician', { exact: true }).selectOption(`crew:${crew.id}`)
        await form.getByLabel('Date', { exact: true }).fill(date)
        await form.getByLabel('Starts', { exact: true }).fill('09:00')
        await form.getByLabel('Ends', { exact: true }).fill('15:00')
        const booked = await send(page, form.getByRole('button', { name: 'Book visit', exact: true }), 'visit.book')
        bookings.push(booked.result)
        actions.push({ commandId: booked.commandId, kind: 'visit.booked', actor: dispatcher, subjects: booked.result.visits.map((v: Row) => v.id) })
        await expect(form).toHaveCount(0)
        await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: sid.id, date, start: '09:00', end: '15:00' })
      }
      original = (await h.state()).visits
      expect(bookings.map(g => g.visits.map((v: Row) => [v.technicianId, v.local.date]).sort())).toEqual(dates.map(date => [[b.priya.id, date], [b.tom.id, date]].sort()))
      // Reload through the real state door after the subcontractor's bookings.
      await page.reload()
    })

    await step('DISP-007 point 7: Day and week replace technician rows and member chips with one crew row and one chip per booking', async () => {
      await page.getByLabel('Day', { exact: true }).fill(dates[0])
      for (const member of [b.priya, b.tom, sid]) await expect(board.getByRole('region', { name: member.name, exact: true })).toBeVisible()
      await page.getByRole('combobox', { name: 'Rows', exact: true }).selectOption('crews')
      for (const date of dates) {
        await page.getByLabel('Day', { exact: true }).fill(date)
        await expect(board.getByRole('region', { name: `Crew ${crew.name}`, exact: true })).toHaveCount(1)
        await expect(chip(board)).toHaveCount(1)
        for (const member of [b.priya, b.tom, sid]) await expect(board.getByRole('region', { name: member.name, exact: true })).toHaveCount(0)
      }
      await screen(page, 'day')
      await view('Week')
      await expect(board.getByRole('rowheader')).toHaveText([`Crew ${crew.name}`])
      await expect(chip(board)).toHaveCount(3)
      for (const date of dates) await expect(chip(cell(date))).toHaveCount(1)
      await screen(page, 'week-before-move')
    })

    await step('DISP-007 points 1 and 7: week drag and focused keyboard move carry every open member while preserving other install days', async () => {
      await chip(cell(dates[0])).dragTo(cell('2026-11-05'))
      const review = page.getByRole('region', { name: 'Move visit', exact: true })
      await expect(review).toBeVisible()
      await follows(dates[0])
      await review.getByLabel('Reason for the move', { exact: true }).fill('Air handler delivery moved to Thursday')
      const dragged = await send(page, review.getByRole('button', { name: 'Move visit', exact: true }), 'visit.change')
      const subjects = bookings[0].visits.map((v: Row) => v.id)
      actions.push({ commandId: dragged.commandId, kind: 'visit.changed', actor: dispatcher, subjects })
      await expect(review).toHaveCount(0)
      await follows('2026-11-05')
      await expect(chip(cell(dates[0]))).toHaveCount(0)
      await expect(chip(cell('2026-11-05'))).toHaveCount(1)
      await chip(cell('2026-11-05')).focus()
      await page.keyboard.press('ArrowRight')
      await follows('2026-11-05')
      await page.keyboard.press('Enter')
      await expect(review).toBeVisible()
      await review.getByLabel('Reason for the move', { exact: true }).fill('Customer requested Friday for the whole crew')
      const keyed = await send(page, review.getByRole('button', { name: 'Move visit', exact: true }), 'visit.change')
      actions.push({ commandId: keyed.commandId, kind: 'visit.changed', actor: dispatcher, subjects })
      await expect(review).toHaveCount(0)
      await follows('2026-11-06')
      await expect(chip(cell('2026-11-05'))).toHaveCount(0)
      await expect(chip(cell('2026-11-06'))).toHaveCount(1)
      await expect(chip(board)).toHaveCount(3)
      await screen(page, 'week-moved')
    })

    await step('DISP-007 point 7: Month filters crew bookings by crew, and the crew screens fit a 390px phone', async () => {
      await view('Month')
      await expect(chip(board)).toHaveCount(3)
      const filter = board.getByRole('combobox', { name: 'Crew', exact: true })
      await expect(filter).toBeVisible()
      expect(await filter.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value).filter(Boolean))).toEqual([crew.id])
      await filter.selectOption(crew.id)
      for (const date of ['2026-11-03', '2026-11-04', '2026-11-06']) await expect(chip(board.getByRole('gridcell', { name: short(date), exact: true }))).toHaveCount(1)
      for (const label of await chip(board).evaluateAll(chips => chips.map(c => c.getAttribute('aria-label')))) expect(label).toContain(`Crew ${crew.name}`)
      await page.getByRole('combobox', { name: 'Rows', exact: true }).selectOption('technicians')
      await board.getByRole('combobox', { name: 'Technician', exact: true }).selectOption(b.priya.id)
      await expect(chip(board)).toHaveCount(3)
      await page.getByRole('combobox', { name: 'Rows', exact: true }).selectOption('crews')
      await expect(chip(board)).toHaveCount(3)
      await screen(page, 'month')
      await page.setViewportSize({ width: 390, height: 1050 })
      acting = h.owner()
      await page.goto(`${origin}/app#team`)
      const crews = page.getByRole('region', { name: 'Crews', exact: true })
      await crews.scrollIntoViewIfNeeded()
      await expect(crews.getByText(crew.name, { exact: true })).toBeVisible()
      await screen(page, 'team')
      acting = b.dispatcher.cookie
      await page.goto(`${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill('2026-11-06')
      await page.getByRole('combobox', { name: 'Rows', exact: true }).selectOption('crews')
      for (const name of ['Day', 'Week', 'Month']) {
        await view(name)
        await board.scrollIntoViewIfNeeded()
        await expect(chip(board)).toHaveCount(name === 'Day' ? 1 : 3)
        await screen(page, name.toLowerCase())
      }
    })

    await step('DISP-007 point 7: crew cancellation and every save, book and move appear in Activity and business export under their actual people', async () => {
      await page.setViewportSize({ width: 1440, height: 1050 })
      await view('Week')
      await chip(cell('2026-11-06')).click()
      const selected = page.getByRole('region', { name: job.title, exact: true })
      await selected.getByLabel('Reason for the change', { exact: true }).fill('Customer canceled the final install day')
      const canceled = await send(page, selected.getByRole('button', { name: 'Cancel visit', exact: true }), 'visit.cancel')
      actions.push({ commandId: canceled.commandId, kind: 'visit.cancelled', actor: dispatcher, subjects: bookings[0].visits.map((v: Row) => v.id) })
      expect((await group()).map((v: Row) => v.status)).toEqual(['cancelled', 'cancelled'])
      expect((await h.state()).visits.filter((v: Row) => v.crew?.groupId !== bookings[0].id)).toEqual(original.filter(v => v.crew?.groupId !== bookings[0].id))
      await expect(chip(board)).toHaveCount(2)
      const activity = await h.request('/api/glove/activity'), exported = await h.request('/api/glove/export')
      expect([activity.status, exported.status]).toEqual([200, 200])
      const events = (await activity.json()).events, archive = await exported.json()
      acting = h.owner()
      await page.goto(`${origin}/app#activity`)
      for (const action of actions) {
        const entries = events.filter((e: Row) => e.commandId === action.commandId && e.kind === action.kind)
        expect(entries.map((e: Row) => e.subjectId).sort()).toEqual(action.subjects.slice().sort())
        for (const event of entries) {
          expect([event.actorId, event.actorName, event.actorRole]).toEqual([action.actor.id, action.actor.name, action.actor.role])
          const kept = archive.timeline.find((e: Row) => e.id === event.id)
          expect(kept).toBeTruthy()
          expect([kept.actor_id, kept.actor_name, kept.actor_role, kept.command_id, kept.summary]).toEqual([action.actor.id, action.actor.name, action.actor.role, action.commandId, event.summary])
          const row = page.locator('.timeline-list > li').filter({ hasText: event.summary })
          await expect(row).toContainText(action.actor.name)
        }
      }
      await screen(page, 'activity')
    })
  } finally {
    try { if (!page.isClosed()) await context.close() } finally { await h.close() }
  }
})
