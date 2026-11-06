import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Native fixture uses the production Worker command and read doors.
import { installation, dispatchBoardFixture } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
// Independent visible wall-time answers, rather than the booking response.
const expectedVisits: Record<string, [string, string, string, string]> = {
  beforeDay: ['Ada Active', 'Sat Mar 9', '23:00', '23:45'],
  dayEarly: ['Ada Active', 'Sun Mar 10', '00:15', '00:45'],
  closed: ['Ada Active', 'Sun Mar 10', '05:00', '06:00'],
  completedOpen: ['Ada Active', 'Sun Mar 10', '07:00', '08:00'],
  arrived: ['Ada Active', 'Sun Mar 10', '09:00', '10:00'],
  inactiveDay: ['Day Inactive', 'Sun Mar 10', '11:00', '12:00'],
  mixedCompleted: ['Ada Active', 'Sun Mar 10', '15:00', '16:00'],
  dayLate: ['Ben Active', 'Sun Mar 10', '23:00', '23:45'],
  inactiveWeek: ['Week Inactive', 'Tue Mar 12', '10:00', '11:00'],
  weekEnd: ['Ben Active', 'Sat Mar 16', '23:00', '23:45'],
  afterWeek: ['Ben Active', 'Sun Mar 17', '00:15', '00:45'],
  monthFirst: ['Month Inactive', 'Sun Feb 24', '00:15', '00:45'],
  monthLast: ['Month Inactive', 'Sat Apr 6', '23:00', '23:45'],
  afterMonth: ['Outside Inactive', 'Sun Apr 7', '00:15', '00:45'],
  mixedCompletedLater: ['Ben Active', 'Sun Apr 7', '15:00', '16:00'],
  mixedCancelledLater: ['Ben Active', 'Sun Apr 7', '16:00', '17:00'],
  aprilLast: ['Cleo Active', 'Sat May 4', '23:00', '23:45'],
}
const at = '2030-03-10T07:30:00Z' // Still Saturday in the business, Sunday in UTC.
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })

async function proof(page: Page, control: Locator, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await control.scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-dispatch-${name}.png`) })
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
}

// One read-only journey, asserted at 1440; the same screens are recorded at 390.
test('dispatch grids and Waiting to book retain exact native membership across reload and Worker restart', async ({ browser }) => {
  const h = await installation({ at })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  try {
    const f = await dispatchBoardFixture(h), { records: r, technicians: t } = f
    // Independent UTC answers around the spring offset change and local midnight.
    const before = await h.state()
    for (const [key, startAt, endAt] of [
      ['beforeDay', '2030-03-10T07:00:00.000Z', '2030-03-10T07:45:00.000Z'],
      ['dayEarly', '2030-03-10T08:15:00.000Z', '2030-03-10T08:45:00.000Z'],
      ['dayLate', '2030-03-11T06:00:00.000Z', '2030-03-11T06:45:00.000Z'],
      ['weekEnd', '2030-03-17T06:00:00.000Z', '2030-03-17T06:45:00.000Z'],
      ['monthLast', '2030-04-07T06:00:00.000Z', '2030-04-07T06:45:00.000Z'],
    ]) {
      const v = before.visits.find((v: any) => v.id === r[key].visit.id)
      expect([v.startAt, v.endAt, v.local.timezone]).toEqual([startAt, endAt, ['America', 'Los_Angeles'].join('/')])
    }
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry from rer dev is required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    const retired = new WeakSet<object>()
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url()), worker = h.mf
      try {
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      } catch (error) {
        if (req.method() === 'GET' && retired.has(worker)) await route.abort('connectionreset')
        else throw error
      }
    })
    await page.clock.install({ time: new Date(at) })
    await page.goto(`${origin}/app#dispatch`)
    const board = page.getByRole('region', { name: 'Board', exact: true })
    const waiting = page.getByRole('region', { name: 'Waiting to book', exact: false })
    const views = page.getByRole('group', { name: 'Board view', exact: true })
    const day = page.getByLabel('Day', { exact: true })
    const ids = (keys: string[]) => keys.map(k => r[k].job.number).sort()
    const chips = async (scope: Locator, keys: string[]) => {
      await expect(scope.locator('button.visit, button.chip')).toHaveCount(keys.length)
      const labels = await scope.locator('button.visit, button.chip').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')!))
      expect(labels.map(label => label.split(' ')[0]).sort()).toEqual(ids(keys))
      for (const key of keys) {
        const [technician, date, start, end] = expectedVisits[key]
        const chip = scope.getByRole('button', { name: new RegExp(`^${r[key].job.number} `) })
        await expect(chip).toHaveAttribute('aria-label', new RegExp(`, ${technician}, ${date} ${start} to ${end}, `))
      }
    }
    const queue = async () => {
      const expected = [f.accepted.number, f.linkedJob.number, f.unbooked.number, r.cancelled.job.number, r.completedOpen.job.number].sort()
      await expect(waiting.locator('.queue > li')).toHaveCount(5)
      expect((await waiting.locator('.queue-meta > .num:first-child').allTextContents()).sort()).toEqual(expected)
      expect((await waiting.locator('.queue-body > strong').allTextContents()).sort()).toEqual(['Synthetic accepted waiting', 'Synthetic accepted linked', 'Synthetic unbooked', 'Synthetic cancelled', 'Synthetic completedOpen'].sort())
      await expect(waiting.locator('.count')).toHaveText('5')
      await expect(waiting.getByRole('button', { name: 'Create job', exact: true })).toHaveCount(1)
      await expect(waiting.getByText('Quote accepted', { exact: true })).toHaveCount(1)
    }
    // A UTC Sunday must initially open the business's Saturday.
    await expect(day).toHaveValue('2030-03-09')
    await chips(board, ['beforeDay'])
    await day.fill('2030-03-10')

    for (const phase of ['initial', 'reload', 'restart']) {
      if (phase === 'reload') await page.reload()
      if (phase === 'restart') { retired.add(h.mf); await h.restart(); await page.reload() }
      await views.getByRole('button', { name: 'Day', exact: true }).click()
      await day.fill('2030-03-10')
      const schedule = board.getByRole('region', { name: 'Technician schedule', exact: true })
      await expect(schedule.locator('.techrow')).toHaveCount(4)
      expect(await schedule.locator('.techrow').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')).sort())).toEqual(['Ada Active', 'Ben Active', 'Cleo Active', 'Day Inactive'])
      await chips(schedule.getByRole('region', { name: 'Ada Active', exact: true }), ['dayEarly', 'closed', 'completedOpen', 'arrived', 'mixedCompleted'])
      await chips(schedule.getByRole('region', { name: 'Ben Active', exact: true }), ['dayLate'])
      await chips(schedule.getByRole('region', { name: 'Cleo Active', exact: true }), [])
      await chips(schedule.getByRole('region', { name: 'Day Inactive', exact: true }), ['inactiveDay'])
      await expect(schedule.locator('.hours > span em')).toHaveText(['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'])
      await queue()
      if (phase === 'restart') {
        await proof(page, board, 'day')
        await proof(page, waiting, 'waiting')
        const book = waiting.getByRole('button', { name: 'Book a visit', exact: true }).first()
        await book.focus()
        await expect(page.getByRole('tooltip', { name: 'Book a visit', exact: true }).filter({ visible: true })).toBeVisible()
        await page.getByRole('button', { name: 'Previous day', exact: true }).focus()
        await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Next day', exact: true }).focus()
        await expect(page.getByRole('tooltip', { name: 'Next day', exact: true })).toBeVisible()
      }
      await views.getByRole('button', { name: 'Week', exact: true }).click()
      const week = board.getByRole('grid', { name: 'Week of Sun Mar 10', exact: true })
      await expect(week.getByRole('columnheader')).toHaveText(['Technician', 'Sun Mar 10', 'Mon Mar 11', 'Tue Mar 12', 'Wed Mar 13', 'Thu Mar 14', 'Fri Mar 15', 'Sat Mar 16'])
      expect((await week.getByRole('rowheader').allTextContents()).sort()).toEqual(['Ada Active', 'Ben Active', 'Cleo Active', 'Day Inactive', 'Week Inactive'])
      await expect(week.getByRole('gridcell')).toHaveCount(35)
      await chips(week, ['dayEarly', 'closed', 'completedOpen', 'arrived', 'mixedCompleted', 'dayLate', 'inactiveDay', 'inactiveWeek', 'weekEnd'])
      const weekContents = [
        ['Ada Active', [['dayEarly', 'closed', 'completedOpen', 'arrived', 'mixedCompleted'], [], [], [], [], [], []]],
        ['Ben Active', [['dayLate'], [], [], [], [], [], ['weekEnd']]],
        ['Cleo Active', [[], [], [], [], [], [], []]],
        ['Day Inactive', [['inactiveDay'], [], [], [], [], [], []]],
        ['Week Inactive', [[], [], ['inactiveWeek'], [], [], [], []]],
      ] as const
      for (const [name, cells] of weekContents) {
        const row = week.getByRole('row').filter({ has: page.getByRole('rowheader', { name, exact: true }) })
        for (const [i, keys] of cells.entries()) await chips(row.getByRole('gridcell').nth(i), [...keys])
      }
      if (phase === 'restart') await proof(page, board, 'week')
      await page.getByRole('button', { name: 'Next week', exact: true }).click()
      await expect(day).toHaveValue('2030-03-17')
      await chips(board, ['afterWeek'])
      await page.getByRole('button', { name: 'Previous week', exact: true }).click()
      await expect(day).toHaveValue('2030-03-10')

      await views.getByRole('button', { name: 'Month', exact: true }).click()
      const month = board.getByRole('grid', { name: 'March 2030', exact: true })
      await expect(month.getByRole('columnheader')).toHaveText(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
      await expect(month.getByRole('row')).toHaveCount(7)
      await expect(month.getByRole('gridcell')).toHaveCount(42)
      await expect(month.getByRole('gridcell').first()).toHaveAttribute('aria-label', 'Sun Feb 24')
      await expect(month.getByRole('gridcell').last()).toHaveAttribute('aria-label', 'Sat Apr 6')
      const monthKeys = ['monthFirst', 'beforeDay', 'dayEarly', 'closed', 'completedOpen', 'arrived', 'mixedCompleted', 'inactiveDay', 'dayLate', 'inactiveWeek', 'weekEnd', 'afterWeek', 'monthLast']
      const technician = board.getByRole('combobox', { name: /^Technician/ })
      await technician.selectOption('')
      expect((await technician.locator('option').allTextContents()).sort()).toEqual(['Ada Active', 'All technicians', 'Ben Active', 'Cleo Active', 'Day Inactive', 'Month Inactive', 'Week Inactive'])
      await chips(month, monthKeys)
      const monthLabels = [
        'Sun Feb 24', 'Mon Feb 25', 'Tue Feb 26', 'Wed Feb 27', 'Thu Feb 28', 'Fri Mar 1', 'Sat Mar 2',
        'Sun Mar 3', 'Mon Mar 4', 'Tue Mar 5', 'Wed Mar 6', 'Thu Mar 7', 'Fri Mar 8', 'Sat Mar 9',
        'Sun Mar 10', 'Mon Mar 11', 'Tue Mar 12', 'Wed Mar 13', 'Thu Mar 14', 'Fri Mar 15', 'Sat Mar 16',
        'Sun Mar 17', 'Mon Mar 18', 'Tue Mar 19', 'Wed Mar 20', 'Thu Mar 21', 'Fri Mar 22', 'Sat Mar 23',
        'Sun Mar 24', 'Mon Mar 25', 'Tue Mar 26', 'Wed Mar 27', 'Thu Mar 28', 'Fri Mar 29', 'Sat Mar 30',
        'Sun Mar 31', 'Mon Apr 1', 'Tue Apr 2', 'Wed Apr 3', 'Thu Apr 4', 'Fri Apr 5', 'Sat Apr 6',
      ]
      expect(await month.getByRole('gridcell').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label')))).toEqual(monthLabels)
      const monthContents: Record<string, string[]> = {
        'Sun Feb 24': ['monthFirst'], 'Sat Mar 9': ['beforeDay'],
        'Sun Mar 10': ['dayEarly', 'closed', 'completedOpen', 'arrived', 'mixedCompleted', 'inactiveDay', 'dayLate'],
        'Tue Mar 12': ['inactiveWeek'], 'Sat Mar 16': ['weekEnd'], 'Sun Mar 17': ['afterWeek'], 'Sat Apr 6': ['monthLast'],
      }
      for (const name of monthLabels) await chips(month.getByRole('gridcell', { name, exact: true }), monthContents[name] ?? [])
      if (phase === 'restart') await proof(page, board, 'month-all')
      await technician.selectOption(t.ben.id)
      await chips(month, ['dayLate', 'weekEnd', 'afterWeek'])
      if (phase === 'restart') await proof(page, board, 'month-selected')
      await technician.selectOption(t.month.id)
      await chips(month, ['monthFirst', 'monthLast'])
      await technician.selectOption('')
      await chips(month, monthKeys)
      // A selected retired technician disappears when their last visit is
      // outside the shown range. The visible All choice must show all visits.
      await technician.selectOption(t.day.id)
      await chips(month, ['inactiveDay'])
      await page.getByRole('button', { name: 'Next month', exact: true }).click()
      await expect(day).toHaveValue('2030-04-01')
      const april = board.getByRole('grid', { name: 'April 2030', exact: true })
      await expect(april.getByRole('gridcell')).toHaveCount(35)
      await expect(april.getByRole('gridcell').first()).toHaveAttribute('aria-label', 'Sun Mar 31')
      await expect(april.getByRole('gridcell').last()).toHaveAttribute('aria-label', 'Sat May 4')
      expect((await technician.locator('option').allTextContents()).sort()).toEqual(['Ada Active', 'All technicians', 'Ben Active', 'Cleo Active', 'Month Inactive', 'Outside Inactive'])
      await expect(technician).toHaveValue('')
      await chips(april, ['monthLast', 'afterMonth', 'mixedCompletedLater', 'mixedCancelledLater', 'aprilLast'])
      await chips(april.getByRole('gridcell', { name: 'Sun Apr 7', exact: true }), ['afterMonth', 'mixedCompletedLater', 'mixedCancelledLater'])
      if (phase === 'restart') await proof(page, board, 'month-next-range')
      await page.getByRole('button', { name: 'Previous month', exact: true }).click()
      await expect(day).toHaveValue('2030-03-01')
      await expect(technician).toHaveValue('')
      await chips(month, monthKeys)
      await queue()
      expect(await h.state()).toEqual(before)
    }
    console.log('PROBE DISP-001 2: native dispatch day, week and month -> exact rows, local-time chips, inactive ranges and month filter retained after reload and actual Worker restart; 1440 and 390 screens recorded')
    console.log('PROBE DISP-001 3: Waiting to book -> exact five native quote and job identities retained, linked quote counted only as its job, cancelled-only and completed-open jobs included, booked and arrived jobs excluded; reads unchanged')
  } finally {
    await page.unrouteAll({ behavior: 'wait' })
    await context.close()
    await h.close()
  }
})
