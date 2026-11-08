import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '/workspace/run-glove/node_modules/@playwright/test/index.mjs'
import { installation, business, postEvents } from '/workspace/run-glove/tests/api/harness.mjs'
import { receipt, postmarkOutcome } from '/workspace/run-glove/tests/fixtures/mail-providers.mjs'
import { startDev, stopDev, redact } from '/workspace/run-glove/tests/browser/runtime.mjs'
const root = '/workspace/run-glove'
const packet = new URL('.', import.meta.url)
let runtime, browser, h
try {
  runtime = await startDev(root, 8787)
  h = await installation({ at: '2026-11-08T12:00:00.000Z' })
  const b = await business(h)
  const draft = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Postmark outcome proof', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', serviceId: b.service.id }] })
  const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
  const apiKey = 'synthetic-glove-16'
  const connected = await h.command('mail.connect', { provider: 'postmark', apiKey, fromEmail: ['synthetic-glove-office', 'example.test'].join('@') })
  const cases = [
    ['delivered', '2026-11-08T12:00:10.000Z', { RecordType: 'Delivery' }, 'delivered it to'],
    ['bounced', '2026-11-08T12:00:20.000Z', { RecordType: 'Bounce', ID: 16001, Type: 'HardBounce', TypeCode: 1, Inactive: true, CanActivate: true }, 'reported a bounce from'],
    ['deferred', '2026-11-08T12:00:30.000Z', { RecordType: 'Bounce', ID: 16002, Type: 'SoftBounce', TypeCode: 4096, Inactive: false, CanActivate: false }, 'is still trying'],
    ['failed', '2026-11-08T12:00:40.000Z', { RecordType: 'Bounce', ID: 16003, Type: 'SoftBounce', TypeCode: 4096, Inactive: true, CanActivate: true }, 'gave up delivering to'],
    ['complained', '2026-11-08T12:00:50.000Z', { RecordType: 'SpamComplaint', ID: 16004, Type: 'SpamComplaint', TypeCode: 100001, Inactive: true, CanActivate: false }, 'reported a spam complaint from'],
  ]
  const expected = []
  for (const [status, at, details, wording] of cases) {
    const current = (await h.state()).quotes.find(q => q.id === quote.id)
    const message = receipt(h, await h.command('email.send', { kind: 'quote', id: quote.id, version: current.version }))
    await h.setTime('2026-11-08T12:01:00.000Z')
    const response = await postEvents(h, { raw: JSON.stringify(postmarkOutcome(message, details, at)), headers: { authorization: 'Basic ' + Buffer.from('glove:' + connected.callbackPassword).toString('base64') } })
    assert.equal(response.status, 200)
    expected.push({ status, at, reference: message.receipt, wording })
  }
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  await page.goto(runtime.entry)
  await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(page.url()).pathname === '/setup') {
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
    await page.waitForURL(u => u.pathname === '/app')
  }
  await page.route(runtime.origin + '/api/glove/**', async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
  await page.goto(runtime.origin + '/app#activity')
  await page.getByRole('heading', { name: 'Activity', exact: true }).waitFor()
  await page.waitForFunction(() => document.querySelectorAll('.timeline-list > li').length >= 5)
  const rows = await page.locator('.timeline-list > li').allTextContents()
  for (const item of expected) {
    assert.ok(rows.some(text => text.includes(item.wording) && text.includes('Provider reference: ' + item.reference) && text.includes('Occurred at: ' + item.at)), item.status + ' retains its readable occurrence and reference')
  }
  const screenText = await page.locator('body').innerText()
  assert.ok(!screenText.includes(apiKey) && !screenText.includes(connected.callbackPassword))
  const iconControls = await page.locator('button').evaluateAll(buttons => buttons.filter(button => !button.textContent.trim()).map(button => ({ label: button.getAttribute('aria-label'), tooltipClass: button.classList.contains('icon-button') })))
  assert.ok(iconControls.every(button => button.label && button.tooltipClass), 'icon-only controls use the existing tooltip class')
  const fontSizes = await page.locator('.timeline-list > li > span').evaluateAll(spans => [...new Set(spans.map(span => parseFloat(getComputedStyle(span).fontSize)))])
  assert.ok(fontSizes.every(size => size >= 13))
  await page.screenshot({ path: new URL('activity-1440.png', packet).pathname, fullPage: true })
  await page.setViewportSize({ width: 390, height: 1050 })
  await page.screenshot({ path: new URL('activity-390.png', packet).pathname, fullPage: true })
  const result = { point: 'COMM-016 1', outcomes: expected.map(({ status, at, reference }) => ({ status, occurredAt: at, providerReference: reference })), assertWidth: 1440, screenshotWidths: [1440,390], iconControls, fontSizes, credentialsVisible: false }
  await writeFile(new URL('activity-probe.json', packet), JSON.stringify(result, null, 2) + '\n')
  console.log('PASS Activity: five Postmark outcomes with provider references and occurred times; screenshots 1440 and 390; no credentials.')
  await page.unrouteAll({ behavior: 'wait' })
  await context.close()
} catch (error) {
  console.error(redact(error.stack))
  process.exitCode = 1
} finally {
  await browser?.close()
  await h?.close()
  if (runtime) await stopDev(root, runtime)
}
