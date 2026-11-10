import { closeHarnessContext, gotoHarness, harnessRoute, reloadHarness, restartHarness, unrouteHarness } from './harness-route'
import { test, expect, type Page, type Request } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
// @ts-expect-error Production HTTP Worker, native sessions and D1.
import { installation } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const publicQuote = `${origin}/api/glove/public/quote`
test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })

async function capture(request: Request) {
  return { url: request.url(), method: request.method(), headers: await request.allHeaders(), body: request.postData() ?? '', navigation: request.isNavigationRequest() }
}

async function screen(page: Page, width: number, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (!process.env.GLOVE_SCREENSHOTS) return
  const directory = resolve(process.env.GLOVE_SCREENSHOTS), fromCheckout = relative(process.cwd(), directory)
  if (!(fromCheckout === '..' || fromCheckout.startsWith(`..${sep}`) || isAbsolute(fromCheckout))) throw new Error('Quote screenshots must be outside the checkout.')
  await mkdir(directory, { recursive: true })
  await page.screenshot({ path: join(directory, `${width}-quote-custody-${name}.png`), fullPage: true })
}

function responseFrom(page: Page, method: string) {
  return page.waitForResponse(response => response.url() === publicQuote && response.request().method() === method)
}

function absent(value: unknown, tokens: string[], where: string) {
  const serialized = JSON.stringify(value) ?? ''
  // Boolean assertions keep a generated bearer out of failure output.
  for (const token of tokens) expect(serialized.includes(token), `Quote bearer absent from ${where}`).toBe(false)
}

test('QUOTE-009 fragment links use only Authorization for real customer reads and responses through revision and expiry at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation({ at: '2030-03-12T02:00:00Z' })
    const context = await browser.newContext({ viewport: { width, height: 1050 } })
    const requests: ReturnType<typeof capture>[] = []
    context.on('request', request => { requests.push(capture(request)) })
    const page = await context.newPage()
    try {
      await h.command('business.save', { name: 'Harbour Air & Electrical', currency: 'AUD', abn: '51 824 753 556', timezone: 'Australia/Brisbane', email: ['synthetic-glove-71', 'example.test'].join('@'), paymentTermsDays: 14 })
      const customer = await h.command('customer.save', { name: 'Harbourview Dental', contact: 'Mei Lin', email: ['synthetic-glove-72', 'example.test'].join('@'), phone: '02 9555 0101' })
      const site = await h.command('site.save', { customerId: customer.id, address: '14 Harbour Street, Balmain NSW 2041', accessNotes: 'Ask reception for the plant room key' })
      const enquiry = await h.command('enquiry.create', { customerId: customer.id, siteId: site.id, description: 'Waiting room condenser is noisy', source: 'phone' })
      const lines = [{ description: 'Clean condenser coil and check operating pressure', quantity: '1', unitPrice: '189.00', tax: 'GST' }]
      let quote = await h.command('quote.draft', { enquiryId: enquiry.id, title: 'Restore quiet cooling', validUntil: '2030-03-12', terms: 'Arrange access with reception. Payment due within 14 days.', lines })
      quote = await h.command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
      const issued = await h.command('quote.link', { quoteId: quote.id, version: quote.version })
      const tokens = [issued.token]
      const workerCalls: { method: string, status: number }[] = []
      // Assets and the customer page come from the real installation. JSON is
      // forwarded to the production Worker with native D1, never fabricated.
      await harnessRoute(page, `${origin}/api/glove/**`, async route => {
        const request = route.request(), url = new URL(request.url())
        expect(url.pathname).toBe('/api/glove/public/quote')
        const response = await h.request(url.pathname + url.search, { as: '', method: request.method(), headers: { authorization: request.headers().authorization ?? '' }, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
        workerCalls.push({ method: request.method(), status: response.status })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })

      const fragment = `${origin}/quote#token=${issued.token}`
      let received = responseFrom(page, 'GET')
      await gotoHarness(page, fragment)
      let response = await received
      expect(response.status()).toBe(200)
      expect((await response.json()).state).toBe('open')
      expect(new URL(page.url()).hash === `#token=${issued.token}`, 'The customer opens the fragment link').toBe(true)
      await expect(page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Your quote', exact: true })).toContainText(lines[0].description)
      await expect(page.getByRole('button', { name: /Approve|Sign quote/ })).toHaveCount(0)
      await screen(page, width, 'open')

      const message = 'Please include a washable filter and arrange access after 2 pm.'
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByLabel('Your capacity (optional)').fill('Practice manager')
      await page.getByLabel('Changes requested').fill(message)
      received = responseFrom(page, 'POST')
      await page.getByRole('button', { name: 'Request changes', exact: true }).click()
      response = await received
      expect(response.status()).toBe(200)
      expect((await response.json()).requests).toEqual([expect.objectContaining({ action: 'changes', message, at: '2030-03-12T02:00:00.000Z' })])
      await expect(page.getByRole('status')).toContainText('Your change request is with the office.')
      await screen(page, width, 'response')

      let state = await h.state()
      let kept = state.quotes.find((row: any) => row.id === quote.id)
      const claimed = { action: 'changes', revision: 1, name: 'Mei Lin', capacity: 'Practice manager', identity: 'CLAIMED', linkId: issued.id, authenticationBasis: 'link handed out by staff, recipient unverified', message, at: '2030-03-12T02:00:00.000Z' }
      expect(kept.customerRequests).toEqual([expect.objectContaining(claimed)])
      expect(state.notices.some((notice: any) => notice.quoteId === quote.id && notice.message.includes(message))).toBe(true)
      const activityResponse = await h.request('/api/glove/activity'), exportResponse = await h.request('/api/glove/export')
      expect(activityResponse.status).toBe(200)
      expect(exportResponse.status).toBe(200)
      const activity = await activityResponse.json(), exported = await exportResponse.json()
      const event = activity.events.find((row: any) => row.kind === 'quote.customer.changes' && row.subjectId === quote.id)
      expect(event).toMatchObject({ actorId: issued.issuedBy.id, actorName: issued.issuedBy.name, actorRole: issued.issuedBy.role, at: claimed.at })
      expect(event.commandId).toBeTruthy()
      const exportedEvent = exported.timeline.find((row: any) => row.id === event.id)
      expect(exportedEvent).toMatchObject({ actor_id: event.actorId, actor_name: event.actorName, actor_role: event.actorRole, command_id: event.commandId })
      expect(JSON.parse(exportedEvent.data)).toMatchObject(claimed)
      absent({ state, activity, exported }, tokens, 'state, Activity and business export after the response')

      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      response = await received
      expect(response.status()).toBe(200)
      expect((await response.json()).requests).toEqual([expect.objectContaining({ action: 'changes', message })])
      await expect(page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true })).toBeVisible()
      expect((await h.state()).quotes.find((row: any) => row.id === quote.id).customerRequests).toEqual(kept.customerRequests)

      quote = await h.command('quote.revise', { quoteId: quote.id, version: kept.version, lines, validUntil: '2030-03-12' })
      quote = await h.command('quote.approve', { quoteId: quote.id, version: quote.version, revision: 2 })
      const revised = await h.command('quote.link', { quoteId: quote.id, version: quote.version })
      tokens.push(revised.token)
      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      response = await received
      expect(response.status()).toBe(200)
      const superseded = await response.json()
      expect(superseded.state).toBe('superseded')
      expect(superseded.document).toBeUndefined()
      await expect(page.getByRole('status')).toContainText('A newer revision was sent')
      await expect(page.getByRole('heading', { name: 'Restore quiet cooling', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /Request changes|Decline quote/ })).toHaveCount(0)
      await screen(page, width, 'superseded')

      // Midnight after the printed validity date in the frozen business zone.
      await h.setTime('2030-03-12T14:00:00Z')
      received = responseFrom(page, 'GET')
      await gotoHarness(page, `${origin}/quote#token=${revised.token}`)
      response = await received
      expect(response.status()).toBe(200)
      expect((await response.json()).state).toBe('expired')
      await expect(page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true })).toBeVisible()
      await expect(page.getByRole('status')).toContainText('This quote has expired.')
      await screen(page, width, 'expired')
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      received = responseFrom(page, 'POST')
      await page.getByRole('button', { name: 'Ask for an updated quote', exact: true }).click()
      response = await received
      expect(response.status()).toBe(200)
      expect((await response.json()).updateRequested).toBe(true)
      await expect(page.getByRole('button', { name: 'Updated quote requested', exact: true })).toBeDisabled()
      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      expect((await (await received).json()).updateRequested).toBe(true)
      await expect(page.getByRole('button', { name: 'Updated quote requested', exact: true })).toBeDisabled()
      await screen(page, width, 'update-requested')
      state = await h.state()
      kept = state.quotes.find((row: any) => row.id === quote.id)
      expect(kept.customerRequests.filter((row: any) => row.action === 'update')).toEqual([expect.objectContaining({ revision: 2, name: 'Mei Lin', linkId: revised.id })])
      expect(state.enquiries.find((row: any) => row.id === enquiry.id).status).toBe('contacted')

      await h.setTime(revised.expiresAt)
      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      response = await received
      expect(response.status()).toBe(404)
      await expect(page.getByRole('alert')).toContainText('This quote link is unavailable.')
      await expect(page.getByRole('heading', { name: 'Restore quiet cooling', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /Request changes|updated quote|Decline quote/ })).toHaveCount(0)
      await screen(page, width, 'unavailable')

      // QUOTE-012: the office reads both actual customer responses through
      // each durable business door, rather than only an empty projection.
      await h.setTime('2030-03-12T14:00:00Z')
      const history = await (await h.request(`/api/glove/sites/${site.id}/history`)).json()
      expect(history.entries).toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'quote response', label: expect.stringContaining(message) }),
        expect.objectContaining({ kind: 'quote response', label: expect.stringContaining('Mei Lin (claimed) update') }),
      ]))
      const conversation = await (await h.request(`/api/glove/conversation?customerId=${customer.id}`)).json()
      for (const kind of ['quote changes requested', 'updated quote requested']) expect(conversation.entries).toEqual(expect.arrayContaining([expect.objectContaining({ kind, direction: 'inbound', channel: 'customer link', author: 'Mei Lin (claimed)' })]))

      // A customer can also decline with claimed capacity through the built
      // page. Reload preserves the single decision and removes action controls.
      await h.setTime('2030-03-12T02:00:00Z')
      let declining = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Alternative condenser service', lines })
      declining = await h.command('quote.approve', { quoteId: declining.id, version: declining.version, revision: 1 })
      const decliningLink = await h.command('quote.link', { quoteId: declining.id, version: declining.version })
      tokens.push(decliningLink.token)
      received = responseFrom(page, 'GET')
      await gotoHarness(page, `${origin}/quote#token=${decliningLink.token}`)
      expect((await received).status()).toBe(200)
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByLabel('Your capacity (optional)').fill('Practice manager')
      received = responseFrom(page, 'POST')
      await page.getByRole('button', { name: 'Decline quote', exact: true }).click()
      expect((await received).status()).toBe(200)
      await expect(page.getByRole('status').filter({ hasText: 'This revision is declined and is read-only.' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Request changes|Decline quote|updated quote/ })).toHaveCount(0)
      const declined = (await h.state()).quotes.find((row: any) => row.id === declining.id)
      expect(declined.declined).toMatchObject({ name: 'Mei Lin', capacity: 'Practice manager', identity: 'CLAIMED', authenticationBasis: 'link handed out by staff, recipient unverified' })
      expect(declined.customerRequests).toHaveLength(1)
      await restartHarness(h)
      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      expect((await (await received).json()).decision).toBe('declined')
      await expect(page.getByRole('button', { name: /Request changes|Decline quote|updated quote/ })).toHaveCount(0)
      await screen(page, width, 'declined')

      // QUOTE-002: choose and request a revision, then forward the revised
      // link to a separate browser context for a claimed drawn approval.
      await h.setTime('2030-03-12T02:00:00Z')
      await h.command('quote.consent', { version: (await h.state()).business[0].version, accept: true, text: 'Synthetic owner disclosure: this records the chosen work and claimed signature. Identity is not verified.' })
      const options = ['Good', 'Better', 'Best'].map((name, i) => ({ name, lines: [{ description: `${name} cooling work`, quantity: '1', unitPrice: `${100 + i * 100}.00`, tax: 'FREE' }] }))
      const addOns = [{ name: 'Filter', lines: [{ description: 'Standard filter', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }, { name: 'Cover', lines: [{ description: 'Weather cover', quantity: '1', unitPrice: '40.00', tax: 'FREE' }] }]
      let signing = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'Customer chosen cooling work', options, addOns })
      signing = await h.command('quote.approve', { quoteId: signing.id, version: signing.version, revision: 1 })
      const previous = await h.command('quote.link', { quoteId: signing.id, version: signing.version })
      tokens.push(previous.token)
      received = responseFrom(page, 'GET')
      await gotoHarness(page, `${origin}/quote#token=${previous.token}`)
      expect((await received).status()).toBe(200)
      await page.getByRole('radio', { name: 'Choose Better', exact: true }).check()
      await page.getByRole('checkbox', { name: 'Add Filter', exact: true }).check()
      received = responseFrom(page, 'POST')
      await page.getByRole('button', { name: 'Review selected work', exact: true }).click()
      expect((await (await received).json()).selection.document.totals.total).toBe('225.00')
      await expect(page.getByRole('region', { name: 'Selected work', exact: true })).toContainText('225.00')
      await screen(page, width, 'approval-choice')
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByLabel('Your capacity (optional)').fill('Practice manager')
      await page.getByLabel('Changes requested').fill('Please use a washable filter.')
      received = responseFrom(page, 'POST')
      await page.getByRole('button', { name: 'Request changes', exact: true }).click()
      expect((await received).status()).toBe(200)
      await expect(page.getByRole('status')).toContainText('Your change request is with the office.')
      await screen(page, width, 'approval-changes')
      const requested = (await h.state()).quotes.find((row: any) => row.id === signing.id)
      expect(requested.customerRequests[0]).toMatchObject({ action: 'changes', choice: { optionId: 'option-2', addOnIds: ['addon-1'] }, message: 'Please use a washable filter.' })
      signing = await h.command('quote.revise', { quoteId: signing.id, version: requested.version, options, addOns: [{ ...addOns[0], lines: [{ ...addOns[0].lines[0], description: 'Washable filter', unitPrice: '35.00' }] }, addOns[1]] })
      signing = await h.command('quote.approve', { quoteId: signing.id, version: signing.version, revision: 2 })
      const current = await h.command('quote.link', { quoteId: signing.id, version: signing.version })
      tokens.push(current.token)
      const forwarded = await browser.newContext({ viewport: { width, height: 1050 } })
      forwarded.on('request', request => { requests.push(capture(request)) })
      const recipient = await forwarded.newPage()
      try {
        await harnessRoute(recipient, `${origin}/api/glove/**`, async route => {
          const request = route.request(), url = new URL(request.url())
          expect(url.pathname).toBe('/api/glove/public/quote')
          const response = await h.request(url.pathname, { as: '', method: request.method(), headers: { authorization: request.headers().authorization ?? '' }, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
          await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
        })
        received = responseFrom(recipient, 'GET')
        await gotoHarness(recipient, `${origin}/quote#token=${current.token}`)
        expect((await received).status()).toBe(200)
        expect(await forwarded.cookies()).toEqual([])
        await recipient.getByRole('radio', { name: 'Choose Better', exact: true }).check()
        await recipient.getByRole('checkbox', { name: 'Add Filter', exact: true }).check()
        received = responseFrom(recipient, 'POST')
        await recipient.getByRole('button', { name: 'Review selected work', exact: true }).click()
        const selected = await (await received).json()
        expect(selected.selection.document.totals.total).toBe('235.00')
        await recipient.getByLabel('Signer name', { exact: true }).fill('Mei Lin')
        await recipient.getByLabel('Signer capacity', { exact: true }).fill('Practice manager')
        await recipient.getByRole('radio', { name: 'Draw my signature', exact: true }).check()
        const area = recipient.getByRole('img', { name: 'Drawn signature area', exact: true })
        await area.scrollIntoViewIfNeeded()
        const box = (await area.boundingBox())!
        await recipient.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5)
        await recipient.mouse.down()
        await recipient.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.2, { steps: 3 })
        await recipient.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7, { steps: 3 })
        await recipient.mouse.up()
        const drawn = await area.locator('polyline').evaluateAll(lines => lines.map(line => (line.getAttribute('points') || '').split(' ').map(point => point.split(',').map(Number))))
        expect(drawn[0].length).toBeGreaterThan(2)
        await recipient.getByRole('checkbox', { name: /I affirm the disclosure/ }).check()
        await screen(recipient, width, 'approval-drawn')
        received = responseFrom(recipient, 'POST')
        await recipient.getByRole('button', { name: 'Sign and approve selected work', exact: true }).click()
        expect((await received).status()).toBe(200)
        await expect(recipient.getByRole('region', { name: 'Signed approval', exact: true })).toContainText('Mei Lin (claimed), Practice manager (claimed)')
        await expect(recipient.getByRole('region', { name: 'Signed approval', exact: true })).toContainText('link handed out by staff, recipient unverified')
        await expect(recipient.getByRole('button', { name: 'Sign and approve selected work', exact: true })).toHaveCount(0)
        await screen(recipient, width, 'approval-signed')
        const accepted = (await h.state()).quotes.find((row: any) => row.id === signing.id)
        expect(accepted.acceptance.signing.signature).toEqual({ kind: 'drawn', width: 600, height: 200, strokes: drawn })
        expect(accepted.acceptance.signing.chosenDocumentHash).toBe(selected.selection.hash)
        const job = await h.command('job.create', { quoteId: signing.id })
        expect(job.lines.map((line: any) => line.description)).toEqual(['Better cooling work', 'Washable filter'])
        expect(job.totals.total).toBe('235.00')
        await restartHarness(h)
        received = responseFrom(recipient, 'GET')
        await reloadHarness(recipient)
        expect((await (await received).json()).decision).toBe('accepted')
        absent({ cookies: await forwarded.cookies(), storage: await recipient.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })) }, tokens, 'forwarded browser storage')
      } finally {
        await unrouteHarness(recipient)
        await closeHarnessContext(forwarded)
      }
      received = responseFrom(page, 'GET')
      await reloadHarness(page)
      expect((await (await received).json()).state).toBe('superseded')
      await expect(page.getByRole('status')).toContainText('A newer revision was sent')
      await expect(page.getByRole('button', { name: /Sign and approve|Request changes|Decline quote/ })).toHaveCount(0)
      const staleDecision = await page.evaluate(async ({ endpoint, token }) => {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve', name: 'Mei Lin', capacity: 'Practice manager' }) })
        return { status: response.status, body: await response.json() }
      }, { endpoint: publicQuote, token: previous.token })
      expect(staleDecision.status).toBe(409)
      expect(staleDecision.body.error.code).toBe('REVISION')
      await screen(page, width, 'approval-stale-refused')

      await h.setTime('2030-03-12T14:00:00Z')
      const outgoing = await Promise.all(requests)
      expect(outgoing.some(request => request.navigation && new URL(request.url).pathname === '/quote')).toBe(true)
      for (const request of outgoing) {
        absent({ url: request.url, query: new URL(request.url).search, body: request.body, cookie: request.headers.cookie ?? '', referrer: request.headers.referer ?? '' }, tokens, 'outgoing URL, query, body, cookie and referrer')
        const { authorization, ...otherHeaders } = request.headers
        absent(otherHeaders, tokens, 'outgoing headers other than Authorization')
        if (tokens.some(token => authorization?.includes(token))) {
          expect(request.url).toBe(publicQuote)
          expect(tokens.some(token => authorization === `Bearer ${token}`), 'The complete bearer appears only in Authorization').toBe(true)
          expect(request.headers.cookie ?? '', 'Public customer requests omit cookies').toBe('')
        }
      }
      for (const method of ['GET', 'POST']) {
        expect(outgoing.some(request => request.url === publicQuote && request.method === method && request.headers.authorization === `Bearer ${issued.token}`), `The fragment bearer reaches the real ${method} door through Authorization`).toBe(true)
        expect(workerCalls.some(call => call.method === method && call.status === 200), `The production Worker answered ${method}`).toBe(true)
      }
      absent({ state: await h.state(), activity: await (await h.request('/api/glove/activity')).json(), exported: await (await h.request('/api/glove/export')).json() }, tokens, 'final state, Activity and business export')
      absent({ cookies: await context.cookies(), storage: await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })) }, tokens, 'browser cookies and persistent storage')
    } finally {
      await unrouteHarness(page)
      await closeHarnessContext(context)
      await h.close()
    }
  }
})
