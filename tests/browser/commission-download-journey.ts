import { expect, type Browser } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { deskPage, phoneScreen, origin } from './desk-fixture'

/** TEAM-006: Owner downloads real attachments from Timesheets at both widths. */
export async function commissionDownloads(browser: Browser) {
  // @ts-expect-error Native Worker fixture with persistent D1 and signed-in people.
  const { installation } = await import('../api/harness.mjs')
  // @ts-expect-error Native commands and independent commission expectations.
  const { commissionFixture } = await import('../fixtures/payroll-commissions.mjs')
  const h = await installation({ at: '2026-11-23T02:00:00Z' })
  try {
    const f = await commissionFixture(h)
    await f.sold('2026-11-04', f.priya, '1234.50', '5%', '61.73')
    await h.command('payroll.settings', { commissions: { from: '2026-11-09', soldPercent: '10', completedPercent: '25', agreementSpiff: '40' } })
    await f.finish()
    const expected: Record<string, string[][]> = {
      gusto: [
        ['last_name', 'first_name', 'gusto_employee_id', 'workweeks', 'regular_hours', 'overtime_hours', 'double_overtime_hours', 'commission'],
        ['N.', 'Priya', '304', '2026-11-02 - 2026-11-08', '8.00', '0.00', '0.00', '111.74'],
        ['B.', 'Tom', '305', '2026-11-02 - 2026-11-08', '2.00', '0.00', '0.00', '35.01'],
      ],
      'adp-run': [
        ['##GENERIC## V1.0'],
        ['IID', 'Pay Frequency', 'Pay Period Start Date', 'Pay Period End Date', 'Employee ID', 'Earnings Code', 'Pay Hours', 'Dollars', 'Separate Check', 'Worked In Dept', 'Rate Code'],
        ['GLOVE23', 'B', '11/02/2026', '11/08/2026', '304', 'REG', '8.00', '', '0', '', 'BASE'],
        ['GLOVE23', 'B', '11/02/2026', '11/08/2026', '305', 'REG', '2.00', '', '0', '', 'BASE'],
        ['GLOVE23', 'B', '11/02/2026', '11/08/2026', '304', 'COMM', '', '111.74', '0', '', 'BASE'],
        ['GLOVE23', 'B', '11/02/2026', '11/08/2026', '305', 'COMM', '', '35.01', '0', '', 'BASE'],
      ],
      quickbooks: [
        ['Employee', 'Date', 'Pay item', 'Hours', 'Amount'],
        ['Priya N.', '11/02/2026', 'Regular', '8.00', ''], ['Tom B.', '11/03/2026', 'Regular', '2.00', ''],
        ['Priya N.', '11/04/2026', 'Commission', '', '111.74'], ['Tom B.', '11/04/2026', 'Commission', '', '25.00'], ['Tom B.', '11/08/2026', 'Commission', '', '10.01'],
      ],
    }
    const original: Record<string, string> = {}
    for (const width of [1440, 390]) {
      const { context, page } = await deskPage(browser, h, width)
      try {
        await page.clock.setFixedTime(new Date('2026-11-23T02:00:00Z'))
        await page.goto(`${origin}/app#reports`)
        const sheets = page.getByRole('region', { name: 'Timesheets', exact: true })
        await sheets.getByLabel('Week of', { exact: true }).fill('2026-11-02')
        await expect(sheets.getByRole('listitem', { name: 'Timesheet for Priya N.', exact: true })).toContainText('approved')
        const commissions = sheets.getByLabel('Commissions this week', { exact: true })
        await expect(commissions).toContainText('$111.74')
        await expect(commissions).toContainText('$35.01')
        await expect(sheets).toContainText('Glove pays no one and files nothing.')
        await phoneScreen(page, width, 'commission-timesheets', sheets.getByRole('heading', { name: 'Timesheets', exact: true }))
        for (const [kind, label] of [['gusto', 'Gusto hours CSV'], ['adp-run', 'ADP RUN pay data CSV'], ['quickbooks', 'QuickBooks Payroll timesheet CSV']]) {
          const pending = page.waitForEvent('download')
          await sheets.getByRole('link', { name: label, exact: true }).click()
          const download = await pending
          expect(await download.failure()).toBeNull()
          const path = await download.path()
          expect(path).toBeTruthy()
          const text = await readFile(path!, 'utf8')
          // All fixture cells are simple; exact independently enumerated rows
          // also reject extra fields, people, dates and claimed provider effects.
          expect(text.endsWith('\r\n')).toBe(true)
          const order = (a: string[], b: string[]) => JSON.stringify(a).localeCompare(JSON.stringify(b))
          expect(text.slice(0, -2).split('\r\n').map(row => row.split(',')).sort(order)).toEqual([...expected[kind]].sort(order))
          if (width === 1440) original[kind] = text
          else expect(text).toBe(original[kind])
          if (process.env.GLOVE_SCREENSHOTS) {
            await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
            await writeFile(join(process.env.GLOVE_SCREENSHOTS, `${width}-commission-${kind}.csv`), text)
          }
        }
        await phoneScreen(page, width, 'commission-downloads', sheets.getByRole('link', { name: 'Gusto hours CSV', exact: true }))
      } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
      // No browser request remains in flight across the actual Worker restart.
      if (width === 1440) await h.restart()
    }
  } finally { await h.close() }
}
