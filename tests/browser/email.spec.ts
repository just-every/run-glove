import { test, expect, type Page, type Locator } from '@playwright/test'
// @ts-expect-error Provider edge helpers drive production HTTP.
import { connectMail, receipt, callbackProvider } from '../fixtures/mail-providers.mjs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker, native sessions and D1; only provider edges are fake.
import { installation, business, completedJob, mailEvents, postEvents, snsEvents } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
async function send(page: Page, button: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function screen(page: Page, width: number, name: string, anchor: Locator) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ mask: [page.locator('output')], path: join(process.env.GLOVE_SCREENSHOTS, `${width}-email-${name}.png`) })
  }
}

test('COMM-001, COMM-010, COMM-011, COMM-012, COMM-013, COMM-014, COMM-015, COMM-016, COMM-017, COMM-018 owner connects email and morning settings; the desk emails quotes, invoices and supplier orders with provider outcomes at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation()
    const context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h)
      await h.command('business.save', { ...(await h.state()).business[0], name: 'Pacheco Plumbing & HVAC', currency: 'USD', timezone: 'America/Chicago' })
      await h.command('site.save', { ...b.site, address: '14 Harbour St, Austin TX 78701' })
      const c = await h.command('customer.save', { ...b.customer, billingAddress: '14 Harbour St, Austin TX 78701', email: 'mei@harbourview.example', apEmail: 'payables@harbourview.example' })
      const { job } = await completedJob(h, b)
      const draft = await h.command('quote.draft', { customerId: c.id, siteId: b.site.id, title: 'Replace condenser fan', lines: [{ description: 'Condenser fan', quantity: '1', unitPrice: '420.00', tax: 'FREE' }] })
      const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
      const invoiceDraft = await h.command('invoice.prepare', { jobId: job.id })
      const invoice = await h.command('invoice.approve', { invoiceId: invoiceDraft.id, version: invoiceDraft.version, revision: 1 })
      const material = await h.command('service.save', { code: 'FAN-MTR', name: 'Condenser fan motor', kind: 'material', unit: 'each', unitCost: '180.00', unitPrice: '420.00', tax: 'FREE' })
      const warehouse = await h.command('stock.location', { kind: 'warehouse', name: 'Austin warehouse' })
      const po = await h.command('po.save', { supplier: 'Austin HVAC Supply', supplierEmail: 'orders@supplyco.example', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: material.id, quantity: '1' }] })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      const quoteEmail = page.getByRole('region', { name: `Email ${quote.number}`, exact: true })
      await expect(quoteEmail.getByRole('button', { name: 'Email quote', exact: true })).toBeDisabled()
      await screen(page, width, 'disconnected', quoteEmail)
      await page.goto(`${origin}/app#team`)
      const settings = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Customer email', exact: true }) }).last()
      const events = mailEvents('sendgrid')
      await settings.getByLabel('From address', { exact: true }).fill('office@pacheco.example')
      await settings.getByLabel('From name', { exact: true }).fill('Pacheco Plumbing & HVAC')
      await settings.getByLabel('API key', { exact: true }).fill('SG.test-only-browser-email')
      await settings.getByLabel('Event webhook verification key', { exact: true }).fill(events.eventKey)
      await send(page, settings.getByRole('button', { name: 'Save customer email', exact: true }))
      await expect(settings.getByLabel('API key', { exact: true })).toHaveValue('')
      await expect(settings.getByLabel('Event webhook verification key', { exact: true })).toHaveValue('')
      const morning = settings.getByRole('form', { name: 'Morning brief email' })
      await morning.getByLabel('Send at (business time)').fill('07:30')
      await send(page, morning.getByRole('button', { name: 'Email me the morning brief', exact: true }))
      expect((await h.state()).business[0].mail.morning).toEqual({ enabled: true, time: '07:30' })
      expect(h.email.sent).toHaveLength(0)
      await screen(page, width, 'settings-on', morning)
      await send(page, morning.getByRole('button', { name: 'Turn off', exact: true }))
      expect((await h.state()).business[0].mail.morning.enabled).toBe(false)
      await screen(page, width, 'settings-off', morning)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      const quoteMail = await send(page, quoteEmail.getByRole('button', { name: 'Email quote', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('mei@harbourview.example')
      await expect(quoteEmail).toContainText('Accepted by SendGrid')
      await expect(quoteEmail).not.toContainText('Delivered to')
      await screen(page, width, 'quote-accepted', quoteEmail)
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: invoice.number, exact: true }).click()
      const invoiceEmail = page.getByRole('region', { name: `Email ${invoice.number}`, exact: true })
      const invoiceMail = await send(page, invoiceEmail.getByRole('button', { name: 'Email invoice', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('payables@harbourview.example')
      await screen(page, width, 'invoice-accepted', invoiceEmail)
      await page.goto(`${origin}/app#stock`)
      const order = page.getByRole('article', { name: `${po.number} to Austin HVAC Supply`, exact: true })
      const poEmail = order.getByRole('region', { name: `Email ${po.number}`, exact: true })
      const poMail = await send(page, poEmail.getByRole('button', { name: 'Email purchase order', exact: true }))
      expect(h.email.sent.at(-1).to).toBe('orders@supplyco.example')
      await expect(poEmail.getByRole('button', { name: 'Email purchase order', exact: true })).toHaveCount(0)
      const timestamp = Math.floor(Date.now() / 1000)
      expect((await postEvents(h, events.signed([quoteMail, invoiceMail, poMail].map((m, i) => ({ email: m.to, timestamp: timestamp + i, event: i === 1 ? 'bounce' : 'delivered', sg_event_id: `browser-${m.id}`, sg_message_id: `sg-receipt-${i + 1}.filter`, rer_delivery_id: m.id }))))).status).toBe(200)
      await page.reload()
      await expect(poEmail).toContainText("Delivered to orders@supplyco.example's mail server")
      await screen(page, width, 'po-delivered', poEmail)
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: invoice.number, exact: true }).click()
      await expect(invoiceEmail).toContainText('Bounced: payables@harbourview.example')
      await expect(invoiceEmail).toContainText('Check the address')
      await screen(page, width, 'invoice-bounced', invoiceEmail)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Replace condenser fan`, exact: true }).click()
      await expect(quoteEmail).toContainText("Delivered to mei@harbourview.example's mail server")
      await screen(page, width, 'quote-delivered', quoteEmail)
      await page.goto(`${origin}/app#team`)
      await expect(settings).toContainText('Last verified event at')
      await settings.getByLabel('Email provider', { exact: true }).selectOption('postmark')
      await settings.getByLabel('From address', { exact: true }).fill('office@pacheco.example')
      await settings.getByLabel('From name', { exact: true }).fill('Pacheco Plumbing & HVAC')
      await settings.getByLabel('API key', { exact: true }).fill('test-only-postmark-browser')
      const pmConnect = await send(page, settings.getByRole('button', { name: 'Save customer email', exact: true }))
      expect(pmConnect.callbackPassword).toMatch(/^[a-f0-9]{64}$/)
      await expect(settings.locator('output')).toHaveText(pmConnect.callbackPassword)
      await expect(settings).toContainText('optional IP allowlist is off')
      await screen(page, width, 'postmark-shown-once', settings.locator('output'))
      const pmRotate = await send(page, settings.getByRole('button', { name: 'Rotate callback credential', exact: true }))
      await expect(settings.locator('output')).toHaveText(pmRotate.callbackPassword)
      await expect(settings).toContainText('Previous credential valid until')
      await screen(page, width, 'postmark-rotated', settings.locator('output'))
      await send(page, settings.getByRole('button', { name: 'Revoke previous credential', exact: true }))
      await send(page, settings.getByRole('button', { name: 'Turn on IP allowlist', exact: true }))
      await expect(settings).toContainText('optional IP allowlist is on')
      await screen(page, width, 'postmark-allowlist', settings.getByRole('button', { name: 'Turn off IP allowlist', exact: true }))
      await send(page, settings.getByRole('button', { name: 'Turn off IP allowlist', exact: true }))
      await page.reload()
      await expect(settings.locator('output')).toHaveCount(0)
      const currentQuote = (await h.state()).quotes.find((r: any) => r.id === quote.id)
      const pmMessage = await h.command('email.send', { kind: 'quote', id: quote.id, version: currentQuote.version })
      const pmEvent = { RecordType: 'Delivery', MessageID: `pm-receipt-${h.email.sent.length}`, Recipient: pmMessage.to, DeliveredAt: new Date().toISOString(), Metadata: { glove_delivery_id: pmMessage.id } }
      expect((await postEvents(h, { raw: JSON.stringify(pmEvent), headers: { authorization: `Basic ${Buffer.from(`glove:${pmRotate.callbackPassword}`).toString('base64')}` } })).status).toBe(200)
      await page.reload()
      await expect(settings).toContainText('Last verified event at')
      await screen(page, width, 'postmark-verified', settings.getByRole('heading', { name: 'Customer email', exact: true }))
      await settings.getByLabel('Email provider', { exact: true }).selectOption('ses')
      const sns = { region: 'us-east-1', topicArn: 'arn:aws:sns:us-east-1:123456789012:glove-mail', configurationSet: 'glove-outcomes' }
      await settings.getByLabel('From address', { exact: true }).fill('office@pacheco.example')
      await settings.getByLabel('API key', { exact: true }).fill(JSON.stringify({ accessKeyId: 'TESTONLYACCESSKEY0001', secretAccessKey: 'test-only-ses-browser-secret' }))
      await settings.getByLabel('AWS region', { exact: true }).fill(sns.region)
      await settings.getByLabel('SNS topic ARN', { exact: true }).fill(sns.topicArn)
      await settings.getByLabel('SES configuration set', { exact: true }).fill(sns.configurationSet)
      await screen(page, width, 'ses-settings', settings.getByLabel('SES configuration set', { exact: true }))
      await send(page, settings.getByRole('button', { name: 'Save customer email', exact: true }))
      const snsSigner = snsEvents(sns)
      h.email.certificates.set(snsSigner.certUrl, snsSigner.cert)
      expect((await postEvents(h, snsSigner.signed('unsubscribe', { Type: 'UnsubscribeConfirmation' }))).status).toBe(200)
      await page.reload()
      await expect(settings.getByRole('alert')).toContainText('cancelled the email-event subscription')
      await screen(page, width, 'ses-subscription-warning', settings.getByRole('alert'))
      await send(page, settings.getByRole('button', { name: 'Disconnect customer email', exact: true }))
      expect((await h.state()).mailConnected).toBe(false)
      await expect(settings.getByRole('button', { name: 'Disconnect customer email', exact: true })).toHaveCount(0)
      await screen(page, width, 'settings-disconnected', settings)
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
  await providerRecovery(browser)
})


async function providerRecovery(browser: import('@playwright/test').Browser) {
  for (const width of [1440, 390]) for (const provider of ['postmark', 'ses']) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h, { timezone: 'UTC' })
      const edge = await connectMail(h, provider)
      const draft = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Email recovery', lines: [{ description: 'Service', quantity: '1', unitPrice: '189.00', tax: 'FREE' }] })
      const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · Email recovery`, exact: true }).click()
      const email = page.getByRole('region', { name: `Email ${quote.number}`, exact: true })
      for (const [status, outcome, next] of [[400, 'refused it', 'Check the email connection and the address'], [429, 'is limiting sends', 'Send again in a few minutes'], [503, 'did not confirm it', "activity before sending again"]] as const) {
        h.email.status[b.customer.email] = status
        await send(page, email.getByRole('button', { name: 'Email quote', exact: true }))
        await expect(email.locator('li').last()).toContainText(outcome)
        await expect(email.locator('li').last()).toContainText(next)
        await screen(page, width, `${provider}-${status}`, email.locator('li').last())
      }
      delete h.email.status[b.customer.email]
      const recovered = receipt(h, await send(page, email.getByRole('button', { name: 'Email quote', exact: true })))
      expect((await postEvents(h, edge.callback(recovered))).status).toBe(200)
      await page.reload()
      await page.getByRole('button', { name: `${quote.number} · Email recovery`, exact: true }).click()
      await expect(email.locator('li').last()).toContainText('Delivered to')
      await screen(page, width, `${provider}-recovered`, email.locator('li').last())
      await h.command('mail.morning', { enabled: true, time: '07:30' })
      const today = new Date().toISOString().slice(0, 10)
      h.email.status['owner@example.test'] = 503
      await h.scheduled(`${today}T08:00:00Z`)
      await page.goto(`${origin}/app#today`)
      const morning = page.getByRole('status').filter({ hasText: 'Morning email for' })
      await expect(morning).toContainText('Outcome unknown')
      await expect(morning).toContainText('Glove does not retry')
      await screen(page, width, `${provider}-morning-unknown`, morning)
      delete h.email.status['owner@example.test']
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      await h.scheduled(`${tomorrow}T08:00:00Z`)
      const m = receipt(h, { id: `brief:${tomorrow}`, to: 'owner@example.test' })
      expect((await postEvents(h, edge.callback(m))).status).toBe(200)
      await page.route(`${origin}/api/glove/brief`, async route => {
        const response = await h.request(`/api/glove/brief?at=${tomorrow}T08:00:00Z`)
        await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() })
      })
      await page.reload()
      await expect(morning).toContainText(`Morning email for ${tomorrow}: Delivered to`)
      await screen(page, width, `${provider}-morning-recovered`, morning)
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
}

async function openCallbackSettings(page: Page, h: Awaited<ReturnType<typeof installation>>) {
  if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
  try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
  if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
  // Forward the browser's public doors to this real, isolated Worker and D1.
  await page.route(`${origin}/api/glove/**`, async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') ?? 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
  await page.goto(`${origin}/app#team`)
  return page.locator('section').filter({ has: page.getByRole('heading', { name: 'Customer email', exact: true }) }).last()
}

test('COMM-013 owner email settings retain the exact last matched callback time and SNS cancellation warning through rejected and unmatched traffic and Worker restart at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h, { currency: 'USD', timezone: 'UTC' })
      const customer = await h.command('customer.save', { ...b.customer, email: ['maintenance', 'harbourview.example'].join('@') })
      const draft = await h.command('quote.draft', { customerId: customer.id, siteId: b.site.id, title: 'Cooling system inspection', lines: [{ description: 'Inspect cooling system', quantity: '1', unitPrice: '189.00', tax: 'FREE' }] })
      const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
      // Stay after the generated certificate's notBefore without aging fixtures.
      const start = Math.ceil(Date.now() / 60_000) * 60_000 + 60_000
      const time = (minute: number) => new Date(start + minute * 60_000).toISOString()
      const edge = await callbackProvider(h, 'ses', { at: time(0) })
      await h.setTime(time(0))
      const message = receipt(h, await h.command('email.send', { kind: 'quote', id: quote.id, version: quote.version }))
      expect(h.email.sent).toHaveLength(1)
      expect(h.email.sent[0]).toMatchObject({ provider: 'ses', to: customer.email })
      expect((await h.state()).messageStates[message.id].status).toBe('accepted')
      const settings = await openCallbackSettings(page, h)
      const displayed = async (verifiedAt: string | null, warning: string | null) => {
        await page.reload()
        await expect(settings.getByRole('heading', { name: 'Customer email', exact: true })).toBeVisible()
        const timestamp = settings.locator('p').filter({ hasText: /^Last verified event at / })
        if (verifiedAt) {
          await expect(timestamp).toHaveText(`Last verified event at ${verifiedAt}`)
          await expect(timestamp).toBeVisible()
        } else {
          await expect(timestamp).toHaveCount(0)
          await expect(settings.getByText('No verified delivery event yet.', { exact: true })).toBeVisible()
        }
        if (warning) {
          await expect(settings.getByRole('alert')).toHaveText(warning)
          await expect(settings.getByRole('alert')).toBeVisible()
        } else await expect(settings.getByRole('alert')).toHaveCount(0)
        expect((await h.state()).mailCallbacks).toMatchObject({ verifiedAt, warning })
      }
      const ignoredTraffic = async (minute: number, verifiedAt: string | null, warning: string | null) => {
        const at = time(minute)
        await h.setTime(at)
        // An unauthenticated control message must neither create nor clear a warning.
        const control = edge.signer.signed('subscription change', { Type: warning ? 'SubscriptionConfirmation' : 'UnsubscribeConfirmation', Timestamp: at })
        expect((await postEvents(h, edge.badSignature(control))).status).toBe(401)
        await displayed(verifiedAt, warning)
        // A valid signature cannot authorize another recipient for a sent email.
        expect((await postEvents(h, edge.callback(message, { at, recipients: [['outsider', 'example.test'].join('@')] }))).status).toBe(401)
        await displayed(verifiedAt, warning)
        const unmatched = { ...message, id: 'not-sent-by-this-installation', receipt: 'unknown-provider-receipt' }
        expect((await postEvents(h, edge.callback(unmatched, { at }))).status).toBe(200)
        await displayed(verifiedAt, warning)
      }
      await displayed(null, null)
      await ignoredTraffic(1, null, null)
      const matchedAt = time(2)
      await h.setTime(matchedAt)
      expect((await postEvents(h, edge.callback(message, { at: time(1) }))).status).toBe(200)
      expect((await h.state()).messageStates[message.id].status).toBe('delivered')
      await displayed(matchedAt, null)
      await screen(page, width, 'matched-callback-time', settings)
      await ignoredTraffic(3, matchedAt, null)
      const unsubscribedAt = time(4)
      await h.setTime(unsubscribedAt)
      expect((await postEvents(h, edge.signer.signed('unsubscribe', { Type: 'UnsubscribeConfirmation', Timestamp: unsubscribedAt }))).status).toBe(200)
      const warning = (await h.state()).mailCallbacks.warning
      expect(warning).toMatch(/cancelled the email-event subscription/)
      await displayed(unsubscribedAt, warning)
      await screen(page, width, 'verified-cancellation-warning', settings.getByRole('alert'))
      // A later matched delivery advances the time and retains the cancellation.
      const lastMatchedAt = time(5)
      await h.setTime(lastMatchedAt)
      expect((await postEvents(h, edge.callback(message, { at: unsubscribedAt }))).status).toBe(200)
      await displayed(lastMatchedAt, warning)
      await ignoredTraffic(6, lastMatchedAt, warning)
      await h.restart()
      await displayed(lastMatchedAt, warning)
      await ignoredTraffic(7, lastMatchedAt, warning)
      await screen(page, width, 'callback-settings-after-worker-restart', settings)
      expect(h.email.sent).toHaveLength(1)
      expect(h.email.subscriptions).toHaveLength(0)
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
