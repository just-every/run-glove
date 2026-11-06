import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const root = process.cwd(), packet = resolve(process.env.HOME, 'rer-consolidation/work/sx-glove-c-f108/packet')
const { chromium } = await import(pathToFileURL(resolve(root, 'node_modules/@playwright/test/index.mjs')).href)
const { installation, business } = await import(pathToFileURL(resolve(root, 'tests/api/harness.mjs')).href)
const h = await installation({ at: '2026-11-06T01:00:00Z' })
let browser, server
const receipt = { kind: 'real-owner-payroll-browser', backend: 'production Worker with migrated persistent D1 and native sessions; provider-edge invitation mail only', assertionsWidth: 1440, screenshotWidths: [1440, 390], head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceHashes: {}, stages: [] }
try {
  for (const file of ['src/glove/payroll.ts', 'src/ui/timesheets.tsx', 'src/ui/team.tsx']) receipt.sourceHashes[file] = createHash('sha256').update(await readFile(file)).digest('hex')
  const b = await business(h)
  const dates = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']
  for (const date of dates) {
    await b.priyaPerson.run('clock.in', { deviceTime: `${date}T07:00:00+11:00` })
    await b.priyaPerson.run('clock.out', { deviceTime: `${date}T17:00:00+11:00` })
  }
  await h.command('timesheet.approve', { technicianId: b.priya.id, weekStart: dates[0] })
  let entry
  for (let i = 0; i < 120 && !entry; i++) {
    const privateOutput = await readFile('/tmp/glove-dev-private.log', 'utf8')
    entry = privateOutput.match(/^RER_OPEN\s+(\S+)/m)?.[1]
    if (!entry) await new Promise(resolve => setTimeout(resolve, 1000))
  }
  if (!entry) throw Error('Owned dev server has not supplied its private entry yet')
  const upstream = new URL(entry).origin
  server = createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/api/glove/')) {
        const chunks = []
        for await (const c of req) chunks.push(c)
        const input = Buffer.concat(chunks).toString('utf8')
        const response = await h.request(req.url, { as: h.owner(), method: req.method, ...(input ? { body: JSON.parse(input) } : {}) })
        res.writeHead(response.status, Object.fromEntries(response.headers))
        res.end(Buffer.from(await response.arrayBuffer()))
      } else {
        const proxy = httpRequest(new URL(req.url, upstream), { method: req.method, headers: { ...req.headers, host: new URL(upstream).host } }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res) })
        proxy.on('error', () => { res.writeHead(502); res.end('Owned UI server unavailable') })
        req.pipe(proxy)
      }
    } catch { res.writeHead(500); res.end('Owned test transport failed') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await page.goto(entry)
  await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(u => u.pathname === '/app')
  }
  // Browser HTTP requests reach the actual Worker through an owned loopback adapter.
  const { expect } = await import(pathToFileURL(resolve(root, 'node_modules/@playwright/test/index.mjs')).href)
  const capture = async (name, locator) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await locator.scrollIntoViewIfNeeded()
      if (name === 'payroll-settings') {
        await locator.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 82))
        await page.screenshot({ path: resolve(packet, `${width}-${name}.png`) })
      } else await locator.screenshot({ path: resolve(packet, `${width}-${name}.png`) })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  await page.goto(`${origin}/app#reports`)
  await page.reload()
  const sheets = page.getByRole('region', { name: 'Timesheets', exact: true })
  await sheets.getByLabel('Week of', { exact: true }).fill(dates[0])
  const row = sheets.getByRole('listitem', { name: 'Timesheet for Priya N.', exact: true })
  await expect(row.getByText('Approved', { exact: true })).toBeVisible()
  await expect(row).toContainText('50.00 h worked')
  // The existing form is in Reports before the placement repair and Settings after it.
  if (process.env.GLOVE_BEFORE !== '1') await sheets.getByRole('link', { name: 'Payroll settings', exact: true }).click()
  const settings = page.getByRole('form', { name: 'Payroll settings', exact: true })
  await settings.getByLabel('Daily overtime after (hours)', { exact: true }).fill('8')
  await capture('payroll-settings', settings)
  const saved = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().method() === 'POST')
  await settings.getByRole('button', { name: 'Save payroll settings', exact: true }).click()
  assert.equal((await (await saved).json()).ok, true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  await page.goto(`${origin}/app#reports`)
  await page.reload()
  await sheets.getByLabel('Week of', { exact: true }).fill(dates[0])
  await expect(row.getByText('Changed since approval', { exact: true })).toBeVisible()
  await expect(row).toContainText('40.00 regular · 10.00 overtime')
  await expect(row).toContainText('Excluded from payroll downloads until the Owner reapproves this week.')
  receipt.stages.push('native Owner changed rule in actual form; equal totals show changed since approval')
  await capture('payroll-changed', sheets)
  const csvLink = sheets.getByRole('link', { name: 'QuickBooks Payroll timesheet CSV', exact: true })
  const readDownload = async () => {
    const download = page.waitForEvent('download')
    await csvLink.click()
    const d = await download
    const failure = await d.failure()
    if (failure) throw Error('Browser download failed: ' + failure)
    const stream = await d.createReadStream(), chunks = []
    for await (const c of stream) chunks.push(c)
    return Buffer.concat(chunks).toString('utf8')
  }
  assert.equal(await readDownload(), 'Employee,Date,Pay item,Hours,Amount\r\n')
  await h.restart()
  await page.reload()
  await sheets.getByLabel('Week of', { exact: true }).fill(dates[0])
  await expect(row.getByText('Changed since approval', { exact: true })).toBeVisible()
  const approved = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().method() === 'POST')
  await row.getByRole('button', { name: 'Reapprove timesheet', exact: true }).click()
  const approval = (await (await approved).json()).result
  assert.equal(approval.timesheet.status, 'approved')
  await expect(row.getByText('Approved', { exact: true })).toBeVisible()
  const expected = 'Employee,Date,Pay item,Hours,Amount\r\n' + dates.flatMap(date => [`Priya N.,10/${date.slice(8)}/2026,Regular,8.00,`, `Priya N.,10/${date.slice(8)}/2026,Overtime,2.00,`]).join('\r\n') + '\r\n'
  assert.equal(await readDownload(), expected)
  await h.restart()
  await page.reload()
  await sheets.getByLabel('Week of', { exact: true }).fill(dates[0])
  await expect(row.getByText('Approved', { exact: true })).toBeVisible()
  await capture('payroll-reapproved', sheets)
  receipt.stages.push('empty CSV before explicit Owner reapproval; exact ten daily CSV rows afterward; changed and approved states survive restart')
  receipt.status = 'passed'
} catch (error) {
  receipt.status = 'failed'
  receipt.error = String(error.message).replace(/https?:\/\/[^\s)]+/g, '[local URL]').slice(0, 2500)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  await h.close()
  await mkdir(packet, { recursive: true })
  const name = process.env.GLOVE_BEFORE === '1' ? 'failing-before-browser.json' : 'browser-receipt.json'
  await writeFile(resolve(packet, name), JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt))
}
