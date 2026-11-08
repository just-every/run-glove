import { test, expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const origin = process.env.GLOVE_BASE_URL!
const panel = (page: Page, title: string | RegExp) => page.locator('form, section').filter({ has: page.getByRole('heading', { name: title }) }).last()
const state = async (page: Page) => {
  const response = await page.request.get(`${origin}/api/glove/state`)
  expect(response.status()).toBe(200)
  return response.json()
}
const identity = (actor: any) => ({ id: actor.id, name: actor.name, role: actor.role })
const mailbox = (name: string) => [name, 'dev.localhost'].join('@')

async function send(page: Page, control: Locator) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body
}

async function localSignIn(browser: Browser, as: string, key: string) {
  const context = await browser.newContext({ viewport: { width: as === 'technician' ? 390 : 1440, height: 1000 } })
  context.setDefaultTimeout(15_000)
  const page = await context.newPage()
  expect((await page.request.post(`${origin}/__dev/key`, { headers: { origin }, data: { key } })).ok()).toBe(true)
  await page.goto(`${origin}/auth/dev/enter?as=${as}&returnTo=%2Fapp`)
  await page.waitForURL(url => url.pathname === '/app')
  return { context, page }
}

async function proof(page: Page, name: string, reopen?: () => Promise<void>) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  const viewport = page.viewportSize()!
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.reload()
    await expect(page.locator('.glove-app[aria-busy="false"], .tech-app')).toBeVisible()
    if (reopen) await reopen()
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-fresh-${name}.png`), fullPage: true })
  }
  await page.setViewportSize(viewport)
}

test('DATA-004 fresh local installation completes service work as four separately signed-in people', async ({ browser }) => {
  test.setTimeout(240_000)
  const entry = process.env.GLOVE_OPEN!
  expect(entry).toBeTruthy()
  const key = new URLSearchParams(new URL(entry).hash.slice(1)).get('rer-dev')!
  const contexts: BrowserContext[] = []
  try {
    const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    ownerContext.setDefaultTimeout(15_000)
    contexts.push(ownerContext)
    const owner = await ownerContext.newPage()
    await owner.goto(entry)
    await owner.waitForURL(url => ['/setup', '/app'].includes(url.pathname) && !url.hash.includes('rer-dev'))
    if (new URL(owner.url()).pathname === '/setup') {
      await owner.getByRole('checkbox').check()
      await owner.getByRole('button', { name: 'Finish setup', exact: true }).click({ timeout: 60_000 })
      await owner.waitForURL(url => url.pathname === '/app')
    }
    const initial = await state(owner)
    expect(initial.business).toEqual([])
    expect(initial.jobs).toEqual([])
    expect(initial.operators).toHaveLength(1)
    const ownerActor = identity(initial.actor)
    expect(ownerActor.role).toBe('owner')

    await owner.goto(`${origin}/app#team`)
    let form = panel(owner, 'Set up your business')
    await form.getByLabel('Business name', { exact: true }).fill('Synthetic Glove service company')
    await form.getByLabel('Tax ID (EIN)', { exact: true }).fill('12-3456789')
    await form.getByLabel('Billing currency', { exact: true }).selectOption('USD')
    await form.getByLabel('Timezone for bookings', { exact: true }).selectOption('America/New_York')
    await form.getByLabel('Invoice payment terms (days)', { exact: true }).fill('14')
    await send(owner, form.getByRole('button', { name: 'Save business' }))
    form = panel(owner, 'Add to the price book')
    await form.getByLabel('Code', { exact: true }).fill('synthetic-glove-126')
    await form.getByLabel('Name', { exact: true }).fill('Maintenance inspection')
    await form.getByLabel('Price before tax', { exact: true }).fill('200.00')
    await form.getByLabel('Checklist, one item per line', { exact: true }).fill('*Isolate power\n*Clean filter\nCheck noise')
    await send(owner, form.getByRole('button', { name: 'Add to price book' }))

    // The owner invites and assigns each person; local sign-in accepts that
    // person's actual invitation. Native member status grants no desk role.
    for (const role of ['dispatcher', 'technician', 'office']) {
      form = panel(owner, 'Invite someone')
      await form.getByLabel('Name', { exact: true }).fill(`Synthetic ${role}`)
      await form.getByLabel('Email', { exact: true }).fill(mailbox(role))
      await form.getByLabel('Role', { exact: true }).selectOption(role)
      await send(owner, form.getByRole('button', { name: 'Send invitation' }))
    }
    const dispatcher = await localSignIn(browser, 'dispatcher', key)
    const technician = await localSignIn(browser, 'technician', key)
    const office = await localSignIn(browser, 'office', key)
    contexts.push(dispatcher.context, technician.context, office.context)
    const d = dispatcher.page, phone = technician.page, o = office.page
    const actors = { owner: ownerActor, dispatcher: identity((await state(d)).actor), technician: identity((await state(phone)).actor), office: identity((await state(o)).actor) }
    expect(new Set(Object.values(actors).map(a => a.id)).size).toBe(4)
    for (const role of ['dispatcher', 'technician', 'office'] as const) expect(actors[role]).toEqual({ id: expect.any(String), name: `Synthetic ${role}`, role })
    await owner.reload()
    form = panel(owner, 'Add a technician')
    await form.getByLabel('Name on the board', { exact: true }).fill('Synthetic technician')
    await form.getByLabel('Signs in as (optional)', { exact: true }).selectOption(actors.technician.id)
    await send(owner, form.getByRole('button', { name: 'Add technician' }))
    await proof(owner, 'settings')

    // The dispatcher performs intake, price approval and the customer's
    // recorded answer in their own session, then creates and books the job.
    await d.goto(`${origin}/app#customers`)
    await d.getByRole('button', { name: 'New customer', exact: true }).click()
    form = panel(d, 'New customer')
    await form.getByLabel('Name', { exact: true }).fill('Synthetic Glove customer')
    await form.getByLabel('Contact person', { exact: true }).fill('Synthetic customer')
    await form.getByLabel('Phone', { exact: true }).fill('212-555-0126')
    await form.getByLabel('Billing address', { exact: true }).fill('PO Box 126')
    await send(d, form.getByRole('button', { name: 'Add customer' }))
    form = panel(d, 'Sites')
    await form.getByLabel('Site address', { exact: true }).fill('126 Synthetic Street')
    await send(d, form.getByRole('button', { name: 'Add site' }))
    await d.goto(`${origin}/app#quotes`)
    form = panel(d, 'Record a request')
    await form.getByLabel('Customer', { exact: true }).selectOption({ label: 'Synthetic Glove customer' })
    await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
    await form.getByLabel('What the customer needs', { exact: true }).fill('Annual filter maintenance')
    await send(d, form.getByRole('button', { name: 'Record request' }))
    await d.locator('li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Quote it', exact: true }).click()
    form = panel(d, 'Quote for Synthetic Glove customer')
    await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
    await form.getByLabel('Title', { exact: true }).fill('Synthetic maintenance visit')
    await form.getByLabel('From the price book', { exact: true }).selectOption({ label: 'synthetic-glove-126 · Maintenance inspection' })
    await send(d, form.getByRole('button', { name: 'Save draft' }))
    await send(d, d.getByRole('button', { name: /^Approve revision 1 at/ }))
    await send(d, d.getByRole('button', { name: 'Record as sent', exact: true }))
    await send(d, d.getByRole('button', { name: 'Record acceptance', exact: true }))
    await proof(d, 'quote', () => d.getByRole('button', { name: / · Synthetic maintenance visit$/, exact: true }).click())
    await d.goto(`${origin}/app#dispatch`)
    await send(d, d.locator('.queue li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Create job', exact: true }))
    await d.locator('.queue li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Book a visit', exact: true }).click()
    // Choose a future Monday once. No expectation depends on a wall-clock
    // midnight, a current time of day or the server's local date.
    const nextMonday = new Date(Date.now() + 7 * 86400000)
    nextMonday.setUTCDate(nextMonday.getUTCDate() + (8 - nextMonday.getUTCDay()) % 7)
    const day = nextMonday.toISOString().slice(0, 10)
    form = panel(d, 'Book a visit')
    await form.getByLabel('Technician', { exact: true }).selectOption({ label: 'Synthetic technician' })
    await form.getByLabel('Date', { exact: true }).fill(day)
    await form.getByLabel('Starts', { exact: true }).fill('09:00')
    await form.getByLabel('Ends', { exact: true }).fill('10:00')
    await send(d, form.getByRole('button', { name: 'Book visit', exact: true }))
    const booked = await state(owner), job = booked.jobs[0], visit = booked.visits[0], tech = booked.technicians[0]
    expect(booked.jobs).toHaveLength(1)
    expect(booked.visits).toHaveLength(1)
    await d.getByLabel('Day', { exact: true }).fill(day)
    await expect(d.getByRole('button', { name: new RegExp(`${job.number} Synthetic maintenance visit, Synthetic technician,`) })).toBeVisible()
    await proof(d, 'dispatch', async () => {
      await d.getByLabel('Day', { exact: true }).fill(day)
      await d.getByRole('button', { name: new RegExp(`${job.number} Synthetic maintenance visit, Synthetic technician,`) }).waitFor()
    })

    // Recurring maintenance is a separate open job so completing and billing
    // today's one-off work cannot accidentally close its future series.
    // These are ordinary commands from the dispatcher's real native session.
    async function command(page: Page, type: string, payload: object, code?: string) {
      const response = await page.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type, payload } })
      const body = await response.json()
      if (code) { expect(response.status()).toBe(403); expect(body.error.code).toBe(code); expect(body.ok).toBe(false) }
      else expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
      return body.result
    }
    const maintenance = await command(d, 'job.create', { customerId: job.customerId, siteId: job.siteId, title: 'Synthetic recurring maintenance', lines: [{ serviceId: booked.services[0].id, description: 'Maintenance inspection', quantity: '1', unitPrice: '200.00' }] })
    await d.goto(`${origin}/app#jobs`)
    await d.getByRole('button', { name: `${maintenance.number} · Synthetic recurring maintenance`, exact: true }).click()
    const repeat = d.getByRole('form', { name: 'Repeat this job', exact: true })
    const seriesFrom = new Date(`${day}T00:00:00Z`)
    seriesFrom.setUTCDate(seriesFrom.getUTCDate() + 7)
    const seriesUntil = new Date(seriesFrom)
    seriesUntil.setUTCDate(seriesUntil.getUTCDate() + 14)
    const dates = [0, 7, 14].map(offset => new Date(seriesFrom.getTime() + offset * 86400000).toISOString().slice(0, 10))
    await repeat.getByLabel('First visit', { exact: true }).fill(dates[0])
    await repeat.getByLabel('Repeats', { exact: true }).selectOption('week')
    await repeat.getByLabel('Every how many', { exact: true }).fill('1')
    await repeat.getByLabel('Start', { exact: true }).fill('13:00')
    await repeat.getByLabel('End', { exact: true }).fill('14:00')
    await repeat.getByLabel('Technician', { exact: true }).selectOption(tech.id)
    await repeat.getByLabel('Ends on (optional)', { exact: true }).fill(dates[2])
    await send(d, repeat.getByRole('button', { name: 'Make it repeat', exact: true }))
    await d.goto(`${origin}/app#jobs/${maintenance.id}`)
    await proof(d, 'series')

    // A real disconnected phone queues the visit's evidence and completion.
    // The independent owner session sees no arrival until reconnection.
    await phone.goto(`${origin}/app`)
    await phone.getByRole('button', { name: new RegExp(`${job.number} · Synthetic maintenance visit`) }).click()
    const phoneTime = new Date('2026-11-01T09:00:00.000Z')
    // Keep device timestamps exact while timers continue to drive the offline queue.
    await phone.clock.setFixedTime(phoneTime)
    await technician.context.setOffline(true)
    await phone.getByRole('button', { name: 'Record arrival', exact: true }).click()
    await phone.getByLabel('Isolate power', { exact: true }).check()
    await phone.getByLabel('Clean filter', { exact: true }).check()
    await phone.getByLabel('Note', { exact: true }).fill('Filter cleaned; airflow restored')
    await phone.getByRole('button', { name: 'Add note', exact: true }).click()
    await phone.getByRole('button', { name: 'Complete visit', exact: true }).click()
    await phone.getByLabel('Work done', { exact: true }).fill('Completed the annual filter service')
    await phone.getByLabel('The customer is not here to sign', { exact: true }).check()
    await phone.getByLabel('Why there is no sign-off', { exact: true }).fill('Customer at work; office holds access permission')
    await phone.getByRole('button', { name: 'Save completion', exact: true }).click()
    await expect(phone.getByText('Offline — 5 items waiting to send.', { exact: true })).toBeVisible()
    const disconnected = await state(owner)
    expect(disconnected.visits.find((v: any) => v.id === visit.id)).toMatchObject({ status: 'booked', arrival: null, completion: null })
    expect(disconnected.captures).toEqual([])
    if (process.env.GLOVE_SCREENSHOTS) await phone.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, '390-fresh-phone-offline.png'), fullPage: true })
    await technician.context.setOffline(false)
    await expect(phone.getByText(/waiting to send|Sending/)).toHaveCount(0, { timeout: 30_000 })
    await expect.poll(async () => (await state(owner)).visits.find((v: any) => v.id === visit.id)?.status).toBe('completed')

    // Office prepares, approves, records a customer's check and exports once.
    await o.goto(`${origin}/app#invoices`)
    await send(o, o.locator('li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Prepare invoice', exact: true }))
    await o.locator('tr').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button').click()
    await send(o, o.getByRole('button', { name: /^Approve revision 1 at/ }))
    await o.getByLabel('Payment amount', { exact: true }).fill('200.00')
    await o.getByLabel('Payment method', { exact: true }).selectOption('check')
    await o.getByLabel('Receipt or check reference', { exact: true }).fill('synthetic-glove-check-126')
    await send(o, o.getByRole('button', { name: 'Record payment', exact: true }))
    await expect(o.getByText('Amount due $0.00', { exact: true })).toBeVisible()
    await send(o, o.getByRole('button', { name: 'Export 1 approved', exact: true }))
    const invoiceCsv = await (await o.request.get(`${origin}${await o.getByRole('link', { name: 'Download CSV', exact: true }).getAttribute('href')}`)).text()
    expect(invoiceCsv).toContain('Synthetic Glove customer')
    expect(invoiceCsv).toContain('200.00')
    const invoice = (await state(owner)).invoices[0]
    // This fixture has no quoted CSV cells. Read the actual accounting row,
    // checking the sold work and amount rather than a number anywhere in it.
    const csvRows = invoiceCsv.trimEnd().split('\r\n').map(row => row.split(','))
    expect(csvRows).toHaveLength(2)
    const exportedLine = Object.fromEntries(csvRows[0].map((column, index) => [column, csvRows[1][index]]))
    expect(exportedLine).toMatchObject({ '*ContactName': 'Synthetic Glove customer', EmailAddress: '', POAddressLine1: 'PO Box 126', '*InvoiceNumber': invoice.number, Reference: job.number, '*Description': 'Maintenance inspection', '*Quantity': '1', '*UnitAmount': '200.00', Currency: 'USD', DocumentTaxAmount: '0.00', DocumentTotal: '200.00' })
    await o.goto(`${origin}/app#invoices/${invoice.id}`)
    await proof(o, 'invoice')
    const beforeRefusals = await state(owner)
    const stable = (s: any) => Object.fromEntries(['version', 'business', 'services', 'technicians', 'enquiries', 'quotes', 'jobs', 'visits', 'captures', 'invoices', 'payments', 'exports', 'approvals', 'events'].map(k => [k, s[k]]))
    // Each role attempts a valid operation belonging to someone else's role.
    await command(owner, 'visit.arrive', { visitId: visit.id, deviceTime: phoneTime.toISOString() }, 'FORBIDDEN')
    await command(d, 'invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, 'FORBIDDEN')
    await command(phone, 'payment.record', { invoiceId: invoice.id, version: invoice.version, amount: '200.00', method: 'check', reference: 'synthetic-glove-refused' }, 'FORBIDDEN')
    await command(o, 'service.save', { code: 'synthetic-glove-forbidden', name: 'Unauthorized price', unitPrice: '1.00' }, 'FORBIDDEN')
    expect(stable(await state(owner))).toEqual(stable(beforeRefusals))
    const noSecondExport = await o.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type: 'invoice.export', payload: {} } })
    expect((await noSecondExport.json()).error.code).toBe('NOTHING_TO_EXPORT')
    expect(stable(await state(owner))).toEqual(stable(beforeRefusals))

    await owner.goto(`${origin}/app#activity`)
    // One set of business assertions, after all sessions and the owner page
    // reload. Screens of this same persisted result are captured at both widths.
    await Promise.all([owner.reload(), d.reload(), phone.reload(), o.reload()])
    const s = await state(owner)
    for (const [page, actor] of [[d, actors.dispatcher], [phone, actors.technician], [o, actors.office]] as const) expect(identity((await state(page)).actor)).toEqual(actor)
    await expect(o.getByText('Amount due $0.00', { exact: true })).toBeVisible()
    expect(s.business[0]).toMatchObject({ name: 'Synthetic Glove service company', abn: '12-3456789', currency: 'USD', timezone: 'America/New_York', paymentTermsDays: 14 })
    expect(s.services).toHaveLength(1)
    expect(s.services[0]).toMatchObject({ code: 'synthetic-glove-126', unitPrice: '200.00', createdBy: actors.owner.id, checklist: [{ label: 'Isolate power', required: true }, { label: 'Clean filter', required: true }, { label: 'Check noise', required: false }] })
    for (const role of ['dispatcher', 'technician', 'office'] as const) expect(s.operators.find((p: any) => p.id === actors[role].id)).toMatchObject({ name: actors[role].name, role, status: 'active' })
    expect(s.technicians[0]).toMatchObject({ operatorId: actors.technician.id, createdBy: actors.owner.id })
    expect(s.customers[0]).toMatchObject({ name: 'Synthetic Glove customer', contact: 'Synthetic customer', phone: '212-555-0126', billingAddress: 'PO Box 126', createdBy: actors.dispatcher.id })
    expect(s.sites[0]).toMatchObject({ customerId: s.customers[0].id, address: '126 Synthetic Street', createdBy: actors.dispatcher.id })
    expect(s.enquiries).toHaveLength(1)
    expect(s.enquiries[0]).toMatchObject({ description: 'Annual filter maintenance', status: 'won', createdBy: actors.dispatcher })
    const quote = s.quotes[0]
    expect(quote).toMatchObject({ status: 'accepted', jobId: job.id, acceptance: { revision: 1, customerName: 'Synthetic customer', method: 'phone', recordedBy: actors.dispatcher } })
    expect(quote.revisions[0]).toMatchObject({ preparedBy: actors.dispatcher, approval: actors.dispatcher, totals: { subtotal: '200.00', total: '200.00' } })
    expect(s.jobs.find((j: any) => j.id === job.id)).toMatchObject({ status: 'invoiced', quoteId: quote.id, quoteRevision: 1, lines: [{ serviceId: s.services[0].id, quantity: '1', unitPrice: '200.00' }], totals: { total: '200.00' } })
    expect(s.visits.find((v: any) => v.id === visit.id)).toMatchObject({ technicianId: tech.id, status: 'completed', local: { date: day, start: '09:00', end: '10:00', timezone: 'America/New_York' }, assignments: [{ by: actors.dispatcher }], arrival: { technicianId: tech.id, deviceTime: phoneTime.toISOString() }, completion: { technicianId: tech.id, summary: 'Completed the annual filter service', jobComplete: true, signoff: { customerPresent: false, absentReason: 'Customer at work; office holds access permission' } } })
    const captures = s.captures.filter((c: any) => c.visitId === visit.id)
    expect(captures).toHaveLength(5)
    expect(captures.map((c: any) => c.kind).sort()).toEqual(['arrival', 'checklist', 'checklist', 'completion', 'note'])
    for (const c of captures) {
      expect(c).toMatchObject({ jobId: job.id, technicianId: tech.id, deviceTime: phoneTime.toISOString(), late: false })
      expect(Date.parse(c.receivedAt)).toBeGreaterThan(Date.parse(c.deviceTime))
    }
    expect(captures.filter((c: any) => c.kind === 'checklist').map((c: any) => [c.label, c.result])).toEqual([['Isolate power', 'done'], ['Clean filter', 'done']])
    expect(captures.find((c: any) => c.kind === 'note').text).toBe('Filter cleaned; airflow restored')
    expect(s.jobs.find((j: any) => j.id === job.id).checklist.map((c: any) => [c.label, c.required])).toEqual([['Isolate power', true], ['Clean filter', true], ['Check noise', false]])
    expect(s.jobs).toHaveLength(2)
    const recurring = s.jobs.find((j: any) => j.id === maintenance.id)
    expect(recurring).toMatchObject({ status: 'open', series: { through: dates[2], until: dates[2], missed: [], revisions: [{ n: 1, from: dates[0], rule: { unit: 'week', interval: 1 }, start: '13:00', end: '14:00', technicianId: tech.id, by: actors.dispatcher }] } })
    const future = s.visits.filter((v: any) => v.jobId === maintenance.id)
    expect(future.map((v: any) => [v.local.date, v.status, v.technicianId]).sort()).toEqual(dates.map(date => [date, 'booked', tech.id]))
    expect(s.invoices).toHaveLength(1)
    expect(s.invoices[0]).toMatchObject({ jobId: job.id, status: 'exported', revisions: [{ n: 1, preparedBy: actors.office, approval: actors.office, totals: { total: '200.00' }, export: { exportId: s.exports[0].id } }] })
    expect(s.payments).toHaveLength(1)
    expect(s.payments[0]).toMatchObject({ invoiceId: invoice.id, amount: '200.00', method: 'check', reference: 'synthetic-glove-check-126', status: 'paid', by: actors.office, effects: [{ amountCents: 20000 }] })
    expect(s.exports).toHaveLength(1)
    expect(s.exports[0]).toMatchObject({ total: '200.00', by: actors.office, invoices: [{ invoiceId: invoice.id, revision: 1 }] })

    // Match every performed business step to its actual person and role in
    // Activity and the downloaded business export, not a label in the test.
    const eventRoles: Record<string, keyof typeof actors> = {
      'business.saved': 'owner', 'service.saved': 'owner', 'role.set': 'owner', 'technician.saved': 'owner',
      'customer.saved': 'dispatcher', 'site.saved': 'dispatcher', 'enquiry.created': 'dispatcher', 'quote.drafted': 'dispatcher', 'quote.approved': 'dispatcher', 'quote.sent': 'dispatcher', 'quote.accepted': 'dispatcher', 'job.created': 'dispatcher', 'visit.booked': 'dispatcher', 'series.created': 'dispatcher', 'series.generated': 'dispatcher',
      'capture.arrival': 'technician', 'capture.checklist': 'technician', 'capture.note': 'technician', 'capture.completion': 'technician', 'job.completed': 'technician',
      'invoice.prepared': 'office', 'invoice.approved': 'office', 'payment.recorded': 'office', 'invoice.exported': 'office',
    }
    const businessExport = await (await owner.request.get(`${origin}/api/glove/export`)).json()
    expect(businessExport.format).toBe('glove-business-v1')
    for (const collection of ['business', 'services', 'enquiries', 'jobs', 'visits', 'captures', 'payments', 'approvals']) expect(businessExport[collection]).toEqual(s[collection])
    expect(businessExport.exports).toEqual(s.exports.map((record: any) => ({ ...record, csv: invoiceCsv })))
    // Read projections can add reminder summaries; the stored financial facts
    // and actual people still have to agree with the separately checked state.
    expect(businessExport.quotes[0].acceptance).toEqual(quote.acceptance)
    expect(businessExport.invoices[0].revisions).toEqual(s.invoices[0].revisions)
    for (const [kind, role] of Object.entries(eventRoles)) {
      const events = s.events.filter((e: any) => e.kind === kind)
      expect(events.length, `Missing Activity outcome ${kind}`).toBeGreaterThan(0)
      for (const event of events) {
        const actual = actors[role]
        expect(event).toMatchObject({ actorId: actual.id, actorName: actual.name, actorRole: actual.role })
        expect(businessExport.timeline.find((e: any) => e.id === event.id)).toMatchObject({ actor_id: actual.id, actor_name: actual.name, actor_role: actual.role, kind })
        const row = owner.locator('.timeline-list > li').filter({ has: owner.locator('span').filter({ hasText: event.summary }).first() })
        await expect(row.first()).toContainText(`${actual.name} (${role[0].toUpperCase() + role.slice(1)})`)
      }
    }
    await proof(owner, 'activity')
    await owner.goto(`${origin}/app#jobs/${job.id}`)
    await expect(owner.getByText('Completed the annual filter service', { exact: true })).toBeVisible()
    await proof(owner, 'completed-job')
    await proof(phone, 'technician-visits')
    await writeFile(join(process.env.GLOVE_BROWSER_OUTPUT || test.info().outputDir, 'fresh-install-receipt.json'), JSON.stringify({ sourceHead: process.env.GLOVE_PRODUCT_HEAD, clause: 'DATA-004', point: 1, people: actors, jobId: job.id, visitId: visit.id, invoiceId: invoice.id, invoiceCsv: exportedLine, payment: { method: 'check', amount: '200.00', balance: '0.00' }, series: { jobId: maintenance.id, dates }, captureKinds: captures.map((c: any) => c.kind), offlineServerState: 'booked with no arrival or captures', roleRefusals: ['owner:visit.arrive', 'dispatcher:invoice.approve', 'technician:payment.record', 'office:service.save'], duplicateExport: 'NOTHING_TO_EXPORT', activityKinds: Object.keys(eventRoles), exportCount: 1, passed: true }, null, 2) + '\n')
  } finally { for (const context of contexts) await context.close() }
})
