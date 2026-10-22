import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production HTTP Worker, native sessions and D1.
import { installation, business, mailEvents, postEvents } from '../api/harness.mjs'
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
    // Full-page captures cover all customer document lines, not just the response form.
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-quote-${name}.png`), fullPage: true })
  }
}

test('QUOTE-002 customer revision links, change requests, superseded documents, declines and expired updates at 1440 and 390; signing stays gated', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } }), page = await context.newPage()
    try {
      const b = await business(h)
      await h.command('business.save', { ...(await h.state()).business[0], name: 'Pacheco Plumbing & HVAC', currency: 'USD', timezone: 'America/Chicago' })
      await h.command('site.save', { ...b.site, address: '1427 Oak Crest Drive, Austin TX 78701' })
      const service = await h.command('service.save', { ...b.service, tax: 'FREE', description: 'Clean the outdoor coil and verify operating pressure.' })
      const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Condenser is noisy', source: 'phone' })
      const draft = await h.command('quote.draft', { enquiryId: enquiry.id, title: 'Restore quiet cooling', terms: 'Work is scheduled after acceptance. Payment due within 14 days.', options: ['Good', 'Better', 'Best'].map((name, i) => ({ name, lines: [{ description: 'Condenser service', serviceId: service.id, quantity: '1', unitPrice: `${189 + 100 * i}.00` }] })), addOns: [{ name: 'New filter', lines: [{ description: 'Pleated filter', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }] })
      const quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
      const expiredRequest = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Annual maintenance quote', source: 'website' })
      const issued31DaysAgo = new Date(Date.now() - 31 * 86400000).toISOString()
      await h.request('/__test/clock', { method: 'POST', body: { at: issued31DaysAgo } })
      const oldDraft = await h.command('quote.draft', { enquiryId: expiredRequest.id, title: 'Annual maintenance', lines: [{ description: 'Annual tune-up', quantity: '1', unitPrice: '189.00', tax: 'FREE' }] })
      const old = await h.command('quote.approve', { quoteId: oldDraft.id, version: oldDraft.version, revision: 1 })
      const issueDate = new Intl.DateTimeFormat('en-CA', { timeZone: old.revisions[0].validityZone }).format(new Date(issued31DaysAgo))
      expect(Date.parse(old.revisions[0].validUntil) - Date.parse(issueDate)).toBe(30 * 86400000)
      await h.request('/__test/clock', { method: 'POST', body: { at: null } })
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url()), isPublic = url.pathname === '/api/glove/public/quote'
        const response = await h.request(url.pathname + url.search, { method: req.method(), ...(isPublic ? { as: '', headers: { authorization: req.headers().authorization ?? '' } } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#quotes`)
      const defaults = page.getByRole('form', { name: 'Quote validity default' })
      await defaults.getByLabel('Default quote validity (calendar days)').fill('45')
      await send(page, defaults.getByRole('button', { name: 'Save quote validity default' }))
      expect((await h.state()).business[0].quoteValidityDays).toBe(45)
      await page.getByRole('button', { name: `${quote.number} · Restore quiet cooling`, exact: true }).click()
      const links = page.getByRole('region', { name: `Customer link for ${quote.number}`, exact: true })
      const issued = await send(page, links.getByRole('button', { name: 'Create customer link', exact: true }))
      const url = await links.getByLabel('Customer link (shown once)').inputValue()
      expect(url).toBe(`${origin}/quote#token=${issued.token}`)
      await screen(page, width, 'desk-issued', links)
      await page.goto(url)
      await expect(page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Better', exact: true })).toContainText(service.description)
      await expect(page.getByRole('region', { name: 'Your quote', exact: true })).toContainText('Work is scheduled after acceptance.')
      await expect(page.getByRole('button', { name: /Approve|Sign quote/ })).toHaveCount(0)
      await screen(page, width, 'customer-document', page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true }))
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByLabel('Your capacity (optional)').fill('Property manager')
      await page.getByLabel('Changes requested').fill('Please include a washable filter instead.')
      await page.getByRole('button', { name: 'Request changes', exact: true }).click()
      await expect(page.getByRole('status')).toContainText('Your change request is with the office.')
      await screen(page, width, 'changes-recorded', page.getByRole('status'))
      await page.goto(`${origin}/app#quotes`)
      await expect(page.getByRole('region', { name: 'Customer quote requests', exact: true })).toContainText('washable filter')
      await page.getByRole('button', { name: `${quote.number} · Restore quiet cooling`, exact: true }).click()
      await page.getByRole('button', { name: 'Revise price', exact: true }).click()
      await screen(page, width, 'revision-form', page.getByLabel('New revision valid through (optional)'))
      await send(page, page.getByRole('button', { name: 'Save revision 2', exact: true }))
      await send(page, page.getByRole('button', { name: /^Approve revision 2/ }))
      const revised = await send(page, links.getByRole('button', { name: 'Create customer link', exact: true }))
      await screen(page, width, 'desk-revised', links)
      await page.goto(url)
      await expect(page.getByRole('status')).toContainText('A newer revision was sent')
      await expect(page.getByRole('heading', { name: 'Restore quiet cooling', exact: true })).toHaveCount(0)
      await screen(page, width, 'superseded', page.getByRole('status'))
      await page.goto(`${origin}/quote#token=${revised.token}`)
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByRole('button', { name: 'Decline quote', exact: true }).click()
      await expect(page.getByText('This revision is declined and is read-only.', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Request changes', exact: true })).toHaveCount(0)
      await screen(page, width, 'declined', page.getByRole('heading', { name: `Quote ${quote.number}`, exact: true }))
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${old.number} · Annual maintenance`, exact: true }).click()
      const expiredLinks = page.getByRole('region', { name: `Customer link for ${old.number}`, exact: true })
      const expired = await send(page, expiredLinks.getByRole('button', { name: 'Create customer link', exact: true }))
      await page.goto(`${origin}/quote#token=${expired.token}`)
      await expect(page.getByText('This quote has expired.', { exact: true })).toBeVisible()
      await screen(page, width, 'expired', page.getByRole('heading', { name: `Quote ${old.number}`, exact: true }))
      await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
      await page.getByRole('button', { name: 'Ask for an updated quote', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Updated quote requested', exact: true })).toBeDisabled()
      expect((await h.state()).enquiries.find((e: any) => e.id === expiredRequest.id).status).toBe('contacted')
      await screen(page, width, 'update-requested', page.getByRole('button', { name: 'Updated quote requested', exact: true }))
      await page.goto(`${origin}/app#quotes`)
      const queue = page.getByRole('region', { name: 'Customer quote requests', exact: true })
      await expect(queue).toContainText(`${old.number} revision 1: Mei Lin (claimed) asked for an updated quote`)
      await screen(page, width, 'office-update', queue)
      // The link's own email controls show only actual provider facts.
      const events = mailEvents('sendgrid')
      await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-43', eventKey: events.eventKey, fromEmail: 'office@pacheco.example' })
      await page.reload()
      await page.getByRole('button', { name: 'New quote', exact: true }).click()
      const form = page.locator('form').filter({ has: page.getByRole('heading', { name: 'New quote', exact: true }) })
      await form.getByLabel('Customer', { exact: true }).selectOption(b.customer.id)
      await form.getByLabel('Site', { exact: true }).selectOption(b.site.id)
      await form.getByLabel('Title', { exact: true }).fill('Filter replacement follow-up')
      await form.getByLabel('From the price book', { exact: true }).selectOption(service.id)
      await form.getByLabel('Description', { exact: true }).fill('Washable filter')
      await form.getByLabel('Unit price', { exact: true }).fill('45.00')
      await expect(form.getByLabel('Valid through (optional; business default when blank)')).toHaveValue('')
      await screen(page, width, 'new-draft', form)
      let followup = await send(page, form.getByRole('button', { name: 'Save draft', exact: true }))
      expect(followup.revisions[0].validUntil).toBeTruthy()
      followup = await send(page, page.getByRole('button', { name: /^Approve revision 1 at/ }))
      const emailLinks = page.getByRole('region', { name: `Customer link for ${followup.number}`, exact: true })
      await send(page, emailLinks.getByRole('button', { name: 'Email customer link', exact: true }))
      await expect(emailLinks).toContainText('Accepted by SendGrid; delivery not yet reported')
      await screen(page, width, 'email-accepted', emailLinks)
      const m = (await h.state()).messages.at(-1), at = Math.floor(Date.now() / 1000)
      const delivered = await postEvents(h, events.signed([{ email: m.to, timestamp: at, event: 'delivered', sg_event_id: 'browser-quote-link-delivered', sg_message_id: 'browser-quote-provider', rer_delivery_id: m.id }]))
      expect(delivered.status).toBe(200)
      await page.reload()
      await page.getByRole('button', { name: `${followup.number} · Filter replacement follow-up`, exact: true }).click()
      await expect(emailLinks).toContainText(`Delivered to ${b.customer.email}'s mail server`)
      await screen(page, width, 'email-delivered', emailLinks)

    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})

/** Prove customer controls are reachable through ordinary Tab navigation. */
async function keyboardFocus(page: Page, control: Locator) {
  for (let n = 0; n < 100; n++) {
    if (await control.evaluate(el => el === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error('The customer control was not reachable by keyboard.')
}

test('QUOTE-002 owner enters disclosure; middle option and add-on become a revised drawn signature and exact job; 390px typed approval works entirely by keyboard', async ({ browser }) => {
  test.setTimeout(240_000)
  const h = await installation(), context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
  try {
    const b = await business(h), events = mailEvents('sendgrid')
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-44', eventKey: events.eventKey, fromEmail: 'office@example.test' })
    const service = await h.command('service.save', { ...b.service, tax: 'FREE', description: 'Inspect the coil, clean it and confirm operating pressure.' })
    const options = ['Good', 'Better', 'Best'].map((name, i) => ({ name, lines: [{ description: `${name} coil service`, quantity: '1', unitPrice: `${100 + i * 100}.00`, serviceId: service.id }] }))
    const addOns = [{ name: 'Filter', lines: [{ description: 'New filter', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }, { name: 'Cover', lines: [{ description: 'Weather cover', quantity: '1', unitPrice: '40.00', tax: 'FREE' }] }]
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Cooling choices', options, addOns, terms: 'synthetic-glove-45 quote terms' })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    const first = await h.command('quote.link', { quoteId: q.id, version: q.version })
    if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
    try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await page.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url()), isPublic = url.pathname.startsWith('/api/glove/public/quote')
      const response = await h.request(url.pathname + url.search, { method: req.method(), ...(isPublic ? { as: '', headers: { authorization: req.headers().authorization ?? '', 'user-agent': req.headers()['user-agent'] ?? '', 'cf-connecting-ip': '198.51.100.43' } } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.goto(`${origin}/app#quotes`)
    const owner = page.getByRole('region', { name: 'Quote signing disclosure', exact: true })
    const disclosure = 'synthetic-glove-46 owner-entered disclosure. Synthetic browser test data.'
    await owner.getByLabel('Concrete customer signing disclosure').fill(disclosure)
    await owner.getByRole('checkbox', { name: 'I accept this exact disclosure for customer quote signing.' }).check()
    await send(page, owner.getByRole('button', { name: 'Accept disclosure and enable signing', exact: true }))
    await expect(owner).toContainText('Accepted; customer signing is available for open quotes')
    for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await screen(page, width, 'owner-disclosure', owner) }
    await page.setViewportSize({ width: 1440, height: 1050 })
    await page.goto(`${origin}/quote#token=${first.token}`)
    await expect(page.getByRole('region', { name: 'Better', exact: true })).toContainText(service.description)
    await page.getByRole('radio', { name: 'Choose Better', exact: true }).check()
    await page.getByRole('checkbox', { name: 'Add Filter', exact: true }).check()
    await page.getByRole('button', { name: 'Review selected work', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Selected work', exact: true })).toContainText('$225.00')
    await page.getByLabel('Your name', { exact: true }).fill('Mei Lin')
    await page.getByLabel('Your capacity (optional)').fill('Property manager')
    await page.getByLabel('Changes requested').fill('Please use a washable filter.')
    await page.getByRole('button', { name: 'Request changes', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Your change request is with the office.')
    q = (await h.state()).quotes.find((x: any) => x.id === q.id)
    expect(q.customerRequests[0].choice.optionId).toBe('option-2')
    q = await h.command('quote.revise', { quoteId: q.id, version: q.version, options, addOns: [{ ...addOns[0], lines: [{ description: 'Washable filter', quantity: '1', unitPrice: '35.00', tax: 'FREE' }] }, addOns[1]], terms: 'synthetic-glove-45 quote terms' })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 2 })
    const revised = await h.command('quote.link', { quoteId: q.id, version: q.version, email: true })
    await page.goto(`${origin}/quote#token=${first.token}`)
    await page.reload() // Reopen the same URL after the office changed the quote.
    await expect(page.getByRole('status')).toContainText('A newer revision was sent')
    await expect(page.getByRole('button', { name: 'Sign and approve selected work', exact: true })).toHaveCount(0)
    await page.goto(`${origin}/quote#token=${revised.token}`)
    await page.getByRole('radio', { name: 'Choose Better', exact: true }).check()
    await page.getByRole('checkbox', { name: 'Add Filter', exact: true }).check()
    await page.getByRole('button', { name: 'Review selected work', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Selected work', exact: true })).toContainText('$235.00')
    await page.getByLabel('Signer name', { exact: true }).fill('Mei Lin')
    await page.getByLabel('Signer capacity', { exact: true }).fill('Property manager')
    await page.getByRole('radio', { name: 'Draw my signature', exact: true }).check()
    const drawing = page.getByRole('img', { name: 'Drawn signature area', exact: true })
    await drawing.scrollIntoViewIfNeeded()
    const bounds = (await drawing.boundingBox())!
    await page.mouse.move(bounds.x + bounds.width * .05, bounds.y + bounds.height * .6); await page.mouse.down()
    for (const [x, y] of [[.15, .2], [.2, .7], [.4, .35], [.55, .65], [.8, .3]]) await page.mouse.move(bounds.x + bounds.width * x, bounds.y + bounds.height * y, { steps: 4 })
    await page.mouse.up()
    await page.getByRole('checkbox', { name: 'I affirm the disclosure shown above and apply my signature to this selected work.' }).check()
    const contrast = await page.getByRole('button', { name: 'Sign and approve selected work', exact: true }).evaluate(button => {
      const style = getComputedStyle(button)
      const luminance = (color: string) => { const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(n => { const v = Number(n) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 }
      const foreground = luminance(style.color), background = luminance(style.backgroundColor)
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05)
    })
    expect(contrast).toBeGreaterThanOrEqual(4.5)

    for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await screen(page, width, 'drawn-before-approval', page.getByRole('heading', { name: 'Approve the selected work', exact: true })) }
    await page.getByRole('button', { name: 'Sign and approve selected work', exact: true }).click()
    await expect(page.getByText('This revision is accepted and is read-only.', { exact: true })).toBeVisible()
    const signed = page.getByRole('region', { name: 'Signed approval', exact: true })
    await expect(signed).toContainText('Mei Lin (claimed), Property manager (claimed)')
    await expect(signed).toContainText('Accepted by SendGrid; delivery not yet reported')
    const accepted = (await h.state()).quotes.find((x: any) => x.id === q.id)
    expect(accepted.acceptance.signing.signature.kind).toBe('drawn')
    expect(accepted.acceptance.signing.consent.text).toBe(disclosure)
    const job = await b.dispatcher.run('job.create', { quoteId: q.id })
    expect(job.lines.map((l: any) => l.description)).toEqual(['Better coil service', 'Washable filter'])
    expect(job.totals).toEqual(accepted.acceptance.totals)
    const confirmation = (await h.state()).messages.find((m: any) => m.id === accepted.acceptance.signing.confirmation.messageId)
    const at = Math.floor(Date.now() / 1000)
    await postEvents(h, events.signed([{ email: confirmation.to, timestamp: at, event: 'delivered', sg_event_id: 'synthetic-glove-47', sg_message_id: 'synthetic-glove-48', rer_delivery_id: confirmation.id }]))
    await page.reload()
    await expect(signed).toContainText(`Delivered to ${b.customer.email}'s mail server`)
    const downloaded = page.waitForEvent('download')
    await signed.getByRole('button', { name: 'Download signed copy (HTML)', exact: true }).click()
    const savedCopy = await downloaded
    expect(savedCopy.suggestedFilename()).toBe('signed-quote.html')
    const signedPath = test.info().outputPath('signed-quote.html')
    await savedCopy.saveAs(signedPath)
    const copyPage = await context.newPage()
    await copyPage.goto(`file://${signedPath}`)
    await expect(copyPage.getByRole('img', { name: 'Drawn signature', exact: true })).toBeVisible()
    await expect(copyPage.locator('main')).toContainText('Washable filter')
    await expect(copyPage.locator('main')).toContainText(disclosure)
    for (const width of [1440, 390]) { await copyPage.setViewportSize({ width, height: 1050 }); await screen(copyPage, width, 'downloaded-signed-copy', copyPage.getByRole('heading', { level: 1 })) }
    await copyPage.close()
    for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 1050 }); await screen(page, width, 'drawn-approved', signed) }

    // A second open quote can be completed with Tab, arrows, Space and typing.
    // A provider refusal leaves the signature intact and makes no delivery claim.
    let typed = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Keyboard quote', options, addOns })
    typed = await h.command('quote.approve', { quoteId: typed.id, version: typed.version, revision: 1 })
    const typedLink = await h.command('quote.link', { quoteId: typed.id, version: typed.version })
    h.email.status[b.customer.email] = 400
    await page.setViewportSize({ width: 390, height: 1050 })
    await page.goto(`${origin}/quote#token=${typedLink.token}`)
    await expect(page.getByRole('radio', { name: 'Choose Good', exact: true })).toBeVisible()
    await keyboardFocus(page, page.getByRole('radio', { name: 'Choose Good', exact: true })); await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Choose Better', exact: true })).toBeChecked()
    await keyboardFocus(page, page.getByRole('checkbox', { name: 'Add Filter', exact: true })); await page.keyboard.press('Space')
    await keyboardFocus(page, page.getByRole('button', { name: 'Review selected work', exact: true })); await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Selected work', exact: true })).toContainText('$225.00')
    for (const [label, value] of [['Signer name', 'Mei Lin'], ['Signer capacity', 'Owner'], ['Typed signature', 'Mei Lin']]) { await keyboardFocus(page, page.getByLabel(label, { exact: true })); await page.keyboard.type(value) }
    await keyboardFocus(page, page.getByRole('checkbox', { name: 'I affirm the disclosure shown above and apply my signature to this selected work.' })); await page.keyboard.press('Space')
    await screen(page, 390, 'keyboard-before-approval', page.getByRole('heading', { name: 'Approve the selected work', exact: true }))
    await keyboardFocus(page, page.getByRole('button', { name: 'Sign and approve selected work', exact: true })); await page.keyboard.press('Enter')
    await expect(page.getByText('This revision is accepted and is read-only.', { exact: true })).toBeVisible()
    await expect(signed).toContainText('Not sent: SendGrid refused it')
    expect((await h.state()).quotes.find((q: any) => q.id === typed.id).acceptance.signing.signature).toEqual({ kind: 'typed', text: 'Mei Lin' })
    await screen(page, 390, 'typed-approved-email-refused', signed)
    await page.goto(`${origin}/app#quotes`)
    await page.getByRole('button', { name: `${q.number} · Cooling choices`, exact: true }).click()
    const deskRecord = page.getByRole('region', { name: 'Customer signature record', exact: true })
    await expect(deskRecord).toContainText('Mei Lin (claimed)')
    await expect(deskRecord).toContainText('drawn signature')
    for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await screen(page, width, 'desk-signature-record', deskRecord) }

  } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
