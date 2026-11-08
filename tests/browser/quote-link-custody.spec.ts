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
      await page.route(`${origin}/api/glove/**`, async route => {
        const request = route.request(), url = new URL(request.url())
        expect(url.pathname).toBe('/api/glove/public/quote')
        const response = await h.request(url.pathname + url.search, { as: '', method: request.method(), headers: { authorization: request.headers().authorization ?? '' }, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
        workerCalls.push({ method: request.method(), status: response.status })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })

      const fragment = `${origin}/quote#token=${issued.token}`
      let received = responseFrom(page, 'GET')
      await page.goto(fragment)
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
      await page.reload()
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
      await page.reload()
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
      await page.goto(`${origin}/quote#token=${revised.token}`)
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
      await page.reload()
      expect((await (await received).json()).updateRequested).toBe(true)
      await expect(page.getByRole('button', { name: 'Updated quote requested', exact: true })).toBeDisabled()
      await screen(page, width, 'update-requested')
      state = await h.state()
      kept = state.quotes.find((row: any) => row.id === quote.id)
      expect(kept.customerRequests.filter((row: any) => row.action === 'update')).toEqual([expect.objectContaining({ revision: 2, name: 'Mei Lin', linkId: revised.id })])
      expect(state.enquiries.find((row: any) => row.id === enquiry.id).status).toBe('contacted')

      await h.setTime(revised.expiresAt)
      received = responseFrom(page, 'GET')
      await page.reload()
      response = await received
      expect(response.status()).toBe(404)
      await expect(page.getByRole('alert')).toContainText('This quote link is unavailable.')
      await expect(page.getByRole('heading', { name: 'Restore quiet cooling', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /Request changes|updated quote|Decline quote/ })).toHaveCount(0)
      await screen(page, width, 'unavailable')

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
      await page.unrouteAll({ behavior: 'wait' })
      await context.close()
      await h.close()
    }
  }
})
