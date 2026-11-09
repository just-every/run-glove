import { chromium } from '/workspace/run-glove/node_modules/@playwright/test/index.mjs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
const packet = '/home/agent/rer-consolidation/work/sx-glove-c-f191/packet'
const log = await readFile('/tmp/glove-dev.log', 'utf8')
const origin = log.match(/^RER_READY\s+(\S+)/m)[1]
const entry = log.match(/^RER_OPEN\s+(\S+)/m)[1]
const key = new URLSearchParams(new URL(entry).hash.slice(1)).get('rer-dev')
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
  const page = await context.newPage()
  page.setDefaultTimeout(30_000)
  await page.goto(entry)
  await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(u => u.pathname === '/app')
  }
  const command = async (who, type, payload) => {
    const response = await who.request.post(origin + '/api/glove/commands', { headers: { origin }, data: { commandId: randomUUID(), type, payload } })
    const body = await response.json()
    assert.equal(body.ok, true, JSON.stringify(body.error))
    return body.result
  }
  const prior = await page.request.get(origin + '/api/glove/state').then(r => r.json())
  if (!prior.technicians.some(t => t.payrollId === '701')) {
  await command(page, 'business.save', { name: 'Synthetic Glove Payroll Company', currency: 'USD', timezone: 'Australia/Sydney', paymentTermsDays: 14 })
  const email = ['technician', 'dev.localhost'].join('@')
  assert.equal((await page.request.post(origin + '/auth/invite', { headers: { origin }, data: { email, displayName: 'Synthetic technician', role: 'member' } })).status(), 202)
  const state = await page.request.get(origin + '/api/glove/state').then(r => r.json())
  const operator = state.operators.find(o => o.email === email)
  assert.ok(operator)
  await command(page, 'role.set', { operatorId: operator.id, role: 'technician' })
  const technician = await command(page, 'technician.save', { name: 'Synthetic Glove Payroll Technician', operatorId: operator.id, payrollId: '701' })
  const customer = await command(page, 'customer.save', { name: 'Synthetic Glove Payroll Customer' })
  const site = await command(page, 'site.save', { customerId: customer.id, address: '701 Synthetic Street' })
  const job = await command(page, 'job.create', { customerId: customer.id, siteId: site.id, title: 'Synthetic payroll proof', lines: [{ description: 'Synthetic service', quantity: '1', unitPrice: '10.00' }] })
  const visit = await command(page, 'visit.book', { jobId: job.id, technicianId: technician.id, date: '2026-11-02', start: '08:00', end: '10:00' })
  const phoneContext = await browser.newContext()
  const phone = await phoneContext.newPage()
  assert.ok((await phone.request.post(origin + '/__dev/key', { headers: { origin }, data: { key } })).ok())
  await phone.goto(origin + '/auth/dev/enter?as=technician&returnTo=%2Fapp')
  await phone.waitForURL(u => u.pathname === '/app')
  await command(phone, 'clock.in', { deviceTime: '2026-11-02T07:00:00+11:00' })
  await command(phone, 'timer.start', { visitId: visit.id, kind: 'job', deviceTime: '2026-11-02T08:00:00+11:00' })
  await command(phone, 'timer.stop', { visitId: visit.id, deviceTime: '2026-11-02T10:17:00+11:00' })
  await command(phone, 'clock.out', { deviceTime: '2026-11-02T20:01:00+11:00' })
  await command(page, 'payroll.settings', { dailyOvertime: { afterHours: 8, doubleAfterHours: 12 }, adp: { companyCode: 'GLOVE701', payFrequency: 'W' } })
  await command(page, 'timesheet.approve', { technicianId: technician.id, weekStart: '2026-11-02' })
  await phoneContext.close()
  }
  const downloads = [], screenshots = []
  const controls = [['adp-run', 'ADP RUN pay data CSV'], ['gusto', 'Gusto hours CSV'], ['quickbooks', 'QuickBooks Payroll timesheet CSV']]
  await mkdir(packet, { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(origin + '/app#reports')
    await page.reload()
    const sheets = page.getByRole('region', { name: 'Timesheets', exact: true })
    await sheets.getByLabel('Week of', { exact: true }).fill('2026-11-02')
    const row = sheets.getByRole('listitem', { name: 'Timesheet for Synthetic Glove Payroll Technician', exact: true })
    await row.getByText('Approved', { exact: true }).waitFor()
    if (width === 1440) {
      assert.match(await row.textContent(), /13.02 h worked.*2.28 on jobs.*8.00 regular.*4.00 overtime.*1.02 double time/s)
      assert.equal(await sheets.getByLabel(/ssn|social security/i).count(), 0)
    }
    for (const [kind, label] of controls) {
      const downloadEvent = page.waitForEvent('download')
      await sheets.getByRole('link', { name: label, exact: true }).click()
      const download = await downloadEvent
      assert.equal(await download.failure(), null)
      const filename = width + '-' + kind + '.csv'
      await download.saveAs(packet + '/' + filename)
      const data = await readFile(packet + '/' + filename)
      const response = await page.request.get(origin + '/api/glove/reports/payroll-' + kind + '.csv?from=2026-11-02&to=2026-11-08')
      assert.equal(response.status(), 200)
      assert.deepEqual(data, await response.body(), 'real control downloads exactly the public report bytes')
      if (kind === 'adp-run') assert.match(data.toString(), /GLOVE701,W,11\/02\/2026,11\/08\/2026,701,DBL,1.02,,0,,BASE/)
      if (kind === 'gusto') assert.match(data.toString(), /Glove Payroll Technician,Synthetic,701,2026-11-02 - 2026-11-08,8.00,4.00,1.02,0.00/)
      if (kind === 'quickbooks') assert.match(data.toString(), /Synthetic Glove Payroll Technician,11\/02\/2026,Double time,1.02,/)
      downloads.push({ width, kind, control: label, filename, suggestedFilename: download.suggestedFilename(), bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') })
    }
    await sheets.scrollIntoViewIfNeeded()
    const filename = width + '-timesheets.png'
    await sheets.screenshot({ path: packet + '/' + filename })
    screenshots.push(filename)
  }
  const receipt = { sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: '/workspace/run-glove', encoding: 'utf8' }).trim(), installation: 'actual local rer dev Worker and D1 with native owner and technician sessions; no request interception or fake application responses', registrationAdded: false, screenshots, downloads, result: 'passed' }
  await writeFile(packet + '/browser-receipt.json', JSON.stringify(receipt, null, 2) + '\n')
  console.log('BROWSER_PASS downloads=' + downloads.length + ' widths=1440,390')
} finally {
  await browser.close()
}
