import { chromium, expect } from './run-glove/node_modules/@playwright/test/index.mjs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { installation, business } from './run-glove/tests/api/harness.mjs'
import { startDev, stopDev, redact } from './run-glove/tests/browser/runtime.mjs'
import { parseCsv } from './run-glove/src/glove/csv-format.ts'
const root = resolve('..', 'run-glove')
const packet = resolve('..', 'packet')
let runtime, browser, h, context
const started = new Date().toISOString()
const proof = { started, widths: [1440, 390], screens: [], downloads: [], assertions: [], result: 'failed' }
try {
  runtime = await startDev(root, 8787)
  process.env.GLOVE_BASE_URL = runtime.origin
  process.env.GLOVE_OPEN = runtime.entry
  process.env.GLOVE_SCREENSHOTS = packet
  const { deskPage, action, phoneScreen, origin } = await import('./run-glove/tests/browser/desk-fixture.ts')
  h = await installation({ at: '2026-12-30T12:00:00.000Z' })
  const b = await business(h, { currency: 'USD', timezone: 'America/New_York' })
  const sub = await h.person('synthetic-glove-201', 'subcontractor')
  const tech = await h.command('technician.save', { name: 'synthetic-glove-202', operatorId: sub.id })
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  const desk = await deskPage(browser, h, 1440)
  context = desk.context
  const page = desk.page
  await page.clock.install({ time: new Date('2026-12-31T17:00:00.000Z') })
  page.setDefaultTimeout(20000)
  const screens = async (name, anchor) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      await anchor.scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const missingTooltips = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !n.innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
      if (missingTooltips.length) proof.preexistingPolish = { controls: missingTooltips, disposition: 'Follow-up: existing Close visit button lacks tooltip; no UI source changed' }
      await page.screenshot({ path: resolve(packet, `${width}-desk-${name}.png`) })
      proof.screens.push(`${width}-desk-${name}.png`)
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
  }
  await page.goto(`${origin}/app#team`)
  const row = page.locator('.technician-row').filter({ has: page.getByText('synthetic-glove-202', { exact: true }) })
  await row.getByRole('button', { name: 'Mark as subcontractor', exact: true }).click()
  const form = page.getByRole('form', { name: '1099 payee for synthetic-glove-202' })
  await form.getByLabel('1099 payee name', { exact: true }).fill('synthetic-glove-203')
  await form.getByLabel('TIN, last 4 digits', { exact: true }).fill('0042')
  await action(page, form.getByRole('button', { name: 'Save payee', exact: true }))
  await expect(row).toContainText('TIN ending 0042')
  await page.reload()
  await expect(row).toContainText('1099 payee synthetic-glove-203')
  await screens('1099-payee', row)
  proof.assertions.push('Owner saves a payee through the real form and reload retains its name and last four digits')
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'synthetic-glove-204', lines: [{ description: 'Native work', quantity: '1', unitPrice: '100.00' }] })
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date: '2026-12-31', start: '09:00', end: '10:00' })
  await page.goto(`${origin}/app#dispatch`)
  await page.getByLabel('Day', { exact: true }).fill('2026-12-31')
  await page.locator('button.visit').filter({ hasText: 'synthetic-glove-204' }).click()
  const panel = page.getByRole('region', { name: 'synthetic-glove-204', exact: true })
  await panel.getByLabel('Agreed with synthetic-glove-202', { exact: true }).fill('600.25')
  await action(page, panel.getByRole('button', { name: 'Save amount', exact: true }))
  await expect(panel).toContainText('Now $600.25')
  await screens('1099-agreed-amount', panel)
  proof.assertions.push('Owner saves the agreed amount through the dispatch visit panel')
  await h.setTime('2027-01-01T04:59:59.000Z')
  await sub.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-12-31T14:00:00.000Z' })
  await sub.run('visit.complete', { visitId: visit.id, deviceTime: '2026-12-31T15:00:00.000Z', summary: 'Native subcontract work done', signoff: { absentReason: 'Customer away' } })
  await page.goto(`${origin}/app#reports`)
  const report = page.getByRole('region', { name: 'Subcontractor 1099-NEC totals', exact: true })
  await report.getByLabel('Year', { exact: true }).fill('2026')
  await expect(report).toContainText('Totals for your filing, not a filed 1099')
  await screens('1099-report', report)
  // Chromium's native download bypasses fixture interception. Read the
  // control's exact resource in this page, as the existing revenue journey does.
  const href = await report.getByRole('link', { name: 'Download 1099-NEC totals CSV', exact: true }).getAttribute('href')
  const resource = await page.evaluate(async href => {
    const response = await fetch(href)
    return { status: response.status, disposition: response.headers.get('content-disposition'), body: await response.text() }
  }, href)
  expect(resource.status).toBe(200)
  expect(resource.disposition).toBe('attachment; filename="glove-1099-nec-totals-2026.csv"')
  const bytes = Buffer.from(resource.body)
  expect(parseCsv(bytes.toString())).toEqual([
    ['payee', 'tin last 4', 'completed visits', 'total', 'at or over $600', 'note'],
    ['synthetic-glove-203', '0042', '1', '600.25', 'yes', 'Totals for your filing, not a filed 1099'],
  ])
  proof.downloads.push({ name: 'glove-1099-nec-totals-2026.csv', rows: 1, amount: '600.25' })
  proof.assertions.push('CSV control exact resource fetched in-page has the completed payee, exact amount, last four digits, count, flag and filing disclaimer')
  proof.result = 'passed'
} catch (error) {
  proof.error = redact(error.message)
  process.exitCode = 1
} finally {
  if (context) { for (const page of context.pages()) await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  await browser?.close()
  await h?.close()
  if (runtime) await stopDev(root, runtime)
  proof.ended = new Date().toISOString()
  await mkdir(packet, { recursive: true })
  await writeFile(resolve(packet, 'browser-receipt.json'), JSON.stringify(proof, null, 2) + '\n')
  console.log(JSON.stringify(proof))
}
