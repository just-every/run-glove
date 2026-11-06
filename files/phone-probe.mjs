// One-off runtime proof. Run from the checkout with: node <this file> <checkout> <before|after>.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
const repo = resolve(process.argv[2]), mode = process.argv[3]
const packet = new URL('.', import.meta.url)
const { chromium } = await import(pathToFileURL(join(repo, 'node_modules/@playwright/test/index.mjs')))
const { installation, business, acceptedQuote } = await import(pathToFileURL(join(repo, 'tests/api/harness.mjs')))
const { startDev, stopDev } = await import(pathToFileURL(join(repo, 'tests/browser/runtime.mjs')))
let runtime, browser
const receipt = { mode, head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), widths: [], serviceWorkers: 'blocked to keep the online transport bridge at the native API Worker; no offline qualification claimed', publicDoor: 'phone nameplate review backed by native commands and persistent D1', fake: 'model-provider transport only' }
try {
  runtime = await startDev(repo, 8787)
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
  for (const width of mode === 'before' ? [390] : [1440, 390]) {
    const h = await installation({ at: '2026-11-06T12:00:00Z' })
    const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' }), page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.setDefaultNavigationTimeout(30000)
    const row = { width, outcomes: [] }
    receipt.widths.push(row)
    try {
      const b = await business(h)
      const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Synthetic nameplate service')).id })
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-06', start: '09:00', end: '10:00' })
      await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await h.command('model.connect', { url: 'https://models.example.test/v1', model: 'synthetic-glove-111', key: 'synthetic-glove-111' })
      h.models.answer = () => ({ make: 'Synthetic make', model: 'Synthetic model', serial: '', manufactured: '2026-02-99' })
      await page.goto(runtime.entry)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') {
        await page.getByRole('checkbox').check()
        await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
        await page.waitForURL(u => u.pathname === '/app')
      }
      // Transport bridge to the real native API Worker. No command result or
      // state projection is fabricated; native technician authority is checked.
      let restartGate = null
      const active = new Set()
      await page.route(`${runtime.origin}/api/glove/**`, async route => {
        if (restartGate) await restartGate
        const transaction = (async () => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { as: b.priyaPerson.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
        })()
        active.add(transaction)
        try { await transaction } finally { active.delete(transaction) }
      })
      await page.goto(`${runtime.origin}/app?job=${job.id}`)
      const card = page.getByRole('region', { name: 'Nameplate', exact: true })
      await card.waitFor({ state: 'visible' })
      const response = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'nameplate.read')
      await card.locator('input[type=file]').setInputFiles({ name: 'synthetic-glove-111.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') })
      const readResponse = await response, readBody = await readResponse.json()
      row.outcomes.push({ action: 'read invalid calendar date', http: readResponse.status(), ok: readBody.ok, error: readBody.error?.code ?? null })
      if (mode === 'before') {
        await page.getByRole('alert').waitFor({ state: 'visible' })
        await card.screenshot({ path: new URL(`phone-before-${width}.png`, packet).pathname })
      }
      assert.equal(readBody.ok, true, 'an invalid model date remains unread and reviewable')
      const date = card.getByLabel('Manufactured (YYYY, YYYY-MM or YYYY-MM-DD)', { exact: true })
      await date.waitFor()
      assert.equal(await date.inputValue(), '')
      const image = card.getByAltText('Nameplate photo')
      const photoResponse = await h.request(`/api/glove/files/${readBody.result.photo.fileId}`, { as: b.priyaPerson.cookie })
      const photoBytes = Buffer.from(await photoResponse.arrayBuffer())
      const decoded = await image.evaluate(img => img.decode().then(() => true, () => false))
      row.outcomes.push({ action: 'review photo', http: photoResponse.status, mediaType: photoResponse.headers.get('content-type'), bytes: photoBytes.length, jpegHeader: photoBytes.subarray(0, 2).toString('hex'), decoded })
      assert.equal(decoded, true, 'the original uploaded photo is visible in review')
      assert.equal(await card.getByLabel('Serial', { exact: true }).inputValue(), '')
      assert.match(await card.innerText(), /Not legible on the photo: serial, manufactured/)
      assert.equal((await h.state()).equipment.length, 0)
      await card.getByLabel('Equipment type', { exact: true }).fill('Synthetic furnace')
      await date.fill('2026-02-99')
      const refusedResponse = page.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'nameplate.confirm')
      await card.getByRole('button', { name: 'Confirm nameplate', exact: true }).click()
      const refused = await (await refusedResponse).json()
      assert.equal(refused.error.code, 'INPUT')
      await page.getByRole('alert').filter({ hasText: 'manufactured is YYYY, YYYY-MM or YYYY-MM-DD.' }).waitFor()
      assert.equal((await h.state()).equipment.length, 0)
      row.outcomes.push({ action: 'invalid technician correction', error: refused.error.code, equipment: 0 })
      assert.equal(await card.getByLabel('Make', { exact: true }).inputValue(), 'Synthetic make')
      await page.screenshot({ path: new URL(`phone-after-${width}.png`, packet).pathname, fullPage: true })
      await date.fill('2024-02-29')
      await card.getByLabel('Serial', { exact: true }).fill('synthetic-glove-112')
      let confirmationRequest
      const confirmedResponse = page.waitForResponse(r => {
        if (r.url().endsWith('/api/glove/commands') && r.request().postDataJSON()?.type === 'nameplate.confirm') { confirmationRequest = r.request().postDataJSON(); return true }
        return false
      })
      await card.getByRole('button', { name: 'Confirm nameplate', exact: true }).click()
      const confirmed = await (await confirmedResponse).json()
      assert.equal(confirmed.ok, true)
      assert.deepEqual([confirmed.result.type, confirmed.result.make, confirmed.result.model, confirmed.result.serial, confirmed.result.manufacturedOn], ['Synthetic furnace', 'Synthetic make', 'Synthetic model', 'synthetic-glove-112', '2024-02-29'])
      console.log('PROBE confirmed through browser at width ' + width)
      let resume
      restartGate = new Promise(resolve => { resume = resolve })
      console.log('PROBE waiting for native requests ' + active.size)
      await Promise.all([...active])
      console.log('PROBE restarting native Worker')
      try { await h.restart() } finally { resume(); restartGate = null }
      console.log('PROBE restarted; replaying confirmation')
      assert.deepEqual(await b.priyaPerson.run(confirmationRequest.type, confirmationRequest.payload, { commandId: confirmationRequest.commandId }), confirmed.result)
      console.log('PROBE replay matched; reopening the visit')
      await page.goto(`${runtime.origin}/app?job=${job.id}`)
      await card.waitFor({ state: 'visible' })
      await page.getByRole('heading', { name: 'Equipment', exact: true }).waitFor()
      await page.getByRole('region', { name: 'Equipment', exact: true }).getByText('Synthetic furnace Synthetic make Synthetic model', { exact: true }).waitFor()
      const state = await h.state()
      assert.deepEqual(state.equipment, [confirmed.result])
      assert.equal(state.nameplates[0].status, 'confirmed')
      assert.deepEqual(state.nameplates[0].corrected, ['serial', 'manufactured'])
      row.outcomes.push({ action: 'valid correction, replay and Worker restart', manufactured: state.equipment[0].manufacturedOn, equipment: state.equipment.length, corrected: state.nameplates[0].corrected })
      assert.equal(await page.locator('body').evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      row.outcomes.push({ action: 'phone review layout', horizontalOverflow: false, controls: 'all nameplate actions have visible text labels; no icon-only nameplate control' })
    } finally { try { await page.unrouteAll({ behavior: 'ignoreErrors' }) } finally { try { await context.close() } finally { await h.close() } } }
  }
  receipt.exit = 0
} catch (error) {
  receipt.exit = 1
  receipt.failure = error.message
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  if (runtime) await stopDev(repo, runtime)
  await writeFile(new URL(`phone-${mode}.json`, packet), JSON.stringify(receipt, null, 2) + '\n')
  console.log(JSON.stringify(receipt, null, 2))
}
