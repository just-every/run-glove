import { test, expect, chromium, type Page, type Locator, type Browser } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { phoneKeys, vapid, decrypt } from '../fixtures/push-service.mjs'

// The first-release cycle through the real screens: the owner sets up and
// quotes, the dispatcher books with conflict review, the technician records
// evidence on a phone through a connectivity interruption and gets sign-off,
// the office prepares and exports the invoice, and the owner moves in from
// ServiceM8. One screenshot per main screen at each width. CUST-001: a
// business customer with two properties, found by a phone fragment and a
// street, each property's history, and billing apart from site contacts.
// REPORT-001: every figure on the owner's Today against the records it summarizes.
// COST-001: the technician clocks in, runs travel and job timers on two jobs'
// visits (one stretch offline) and clocks out; the desk reads each job's time
// and corrects an entry, which keeps its original. FIELD-002: the owner builds
// an inspection form on the service and the technician fills it on the phone.
// COST-004: the job's estimate and actual cost on the Jobs screen.
// QUOTE-001: a quote saved as a template, and a quote with two options and an
// add-on whose recorded choice is what the customer accepted. BOOK-005: a
// service call made from the customer record, without a quote. MONEY-002: the
// business's EIN, two licenses and logo; a customer's billing and service
// addresses kept apart through edit and export.
// STOCK-001: the office sets up the technician's van and restocks it; a
// material used on the phone comes off the van, which then shows low.
// FIELD-001 (390): a reload with no signal opens the kept day; a visit completed offline lands once and a visit
// moved at the desk meanwhile waits for late-evidence review. DISP-001 (1440): drag to book, drag to another day through a conflict review,
// keyboard move and resize, the month view and job-type colors. DISP-007 (1440): a crew named on Team and booked as one is
// dragged to another day on the week board by crew, moving both members' visits.
// FIELD-004 (390): the app is installable from its manifest, the technician turns on notifications (push service fake),
// the dispatcher's move of their visit arrives as a notification that opens the job, and the visit offers tap-to-call and
// tap-to-navigate.

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const shots = process.env.GLOVE_SCREENSHOTS
const fixture = 'tests/fixtures/servicem8-small-hvac/'
const panel = (page: Page, title: string | RegExp) => page.locator('form, section').filter({ has: page.getByRole('heading', { name: title }) }).last()

async function shot(page: Page, width: number, name: string) {
  if (!shots) return
  await mkdir(shots, { recursive: true })
  await page.screenshot({ path: join(shots, `${width}-${name}.png`), fullPage: true })
}

/** Click a control that sends one command and wait for its confirmed outcome. */
async function send(page: Page, control: Locator, ok = true) {
  const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await control.click()
  const body = await (await response).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(ok)
  // The app refreshes its records after each answer and refuses a second command until then.
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body
}

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const cents = (total: string) => Math.round(Number(total) * 100)
const count = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`

const records = async (page: Page) => (await page.request.get(`${origin}/api/glove/state`)).json()
const clock = (zone: string) => (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
const minutes = (startAt: string, endAt: string) => Math.floor((Date.parse(endAt) - Date.parse(startAt) + 30_000) / 60_000)

/** REPORT-001: open Today and check each tile against the records in GET /api/glove/state, then the journey's own job; answers who is on the clock. */
async function checkToday(page: Page, customer: string | null, jobState?: 'Completed' | 'Invoiced') {
  await page.goto(`${origin}/app#today`)
  const tile = (name: string) => page.getByRole('region', { name, exact: true })
  await expect(tile("Today's jobs")).toBeVisible()
  const s = await records(page)
  const zone = s.business[0].timezone, local = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  const date = local(new Date().toISOString())
  const jobIds = new Set(s.visits.filter((v: any) => v.status !== 'cancelled' && local(v.startAt) === date).map((v: any) => v.jobId))
  const todays = s.jobs.filter((j: any) => jobIds.has(j.id)), by = (state: string) => todays.filter((j: any) => j.status === state).length
  await expect(tile("Today's jobs").locator('.tile-figure')).toHaveText(count(todays.length, 'job'))
  await expect(tile("Today's jobs").getByText(`${by('open')} open · ${by('completed')} completed · ${by('invoiced')} invoiced`)).toBeVisible()
  const accepted = s.quotes.filter((q: any) => q.status === 'accepted' && q.acceptance?.at && local(q.acceptance.at) === date)
  await expect(tile('Booked today').locator('.tile-figure')).toHaveText(dollars(accepted.reduce((n: number, q: any) => n + cents((q.acceptance.totals ?? q.revisions.find((r: any) => r.n === q.acceptance.revision).totals).total), 0)))
  await expect(tile('Booked today').getByText(`${count(accepted.length, 'quote')} accepted today`)).toBeVisible()
  const open = s.quotes.filter((q: any) => ['draft', 'approved', 'sent'].includes(q.status))
  await expect(tile('Open quotes').locator('.tile-figure')).toHaveText(count(open.length, 'quote'))
  await expect(tile('Open quotes').getByText(`${dollars(open.reduce((n: number, q: any) => n + cents(q.revisions.at(-1).totals.total), 0))} waiting on an answer or a price`)).toBeVisible()
  const unbilled = s.jobs.filter((j: any) => j.status === 'completed')
  await expect(tile('Completed, not invoiced').locator('.tile-figure')).toHaveText(count(unbilled.length, 'job'))
  // COST-001: exactly the technicians with a shift clocked in and not out.
  const clocked = s.times.filter((x: any) => x.kind === 'shift' && !x.endAt).map((x: any) => s.technicians.find((t: any) => t.id === x.technicianId).name)
  await expect(tile('On the clock').locator('.tile-figure')).toHaveText(count(clocked.length, 'technician'))
  await expect(tile('On the clock').locator('li strong')).toHaveText(clocked)
  if (!customer) return clocked
  // The journey's job: booked today, so on the list in its state, and unbilled until its invoice is exported.
  const mine = s.jobs.find((j: any) => j.customerId === s.customers.find((c: any) => c.name === customer).id && j.title === 'Split system service')
  expect(jobIds.has(mine.id)).toBe(true)
  expect(accepted.some((q: any) => q.id === mine.quoteId)).toBe(true)
  await expect(tile("Today's jobs").locator('li').filter({ hasText: mine.number }).getByText(jobState, { exact: true })).toBeVisible()
  await expect(tile('Completed, not invoiced').locator('li').filter({ hasText: mine.number })).toHaveCount(jobState === 'Completed' ? 1 : 0)
  return clocked
}

/** COST-001: the open job's "Time on this job" shows each travel and on-job entry in its record, with the totals. */
async function checkJobTime(page: Page, title: string, customer: string) {
  const s = await records(page), hhmm = clock(s.business[0].timezone)
  const job = s.jobs.find((j: any) => j.title === title && j.customerId === s.customers.find((c: any) => c.name === customer).id)
  const entries = s.times.filter((x: any) => x.jobId === job.id)
  expect(entries.map((x: any) => x.kind).sort()).toEqual(['job', 'travel'])
  const region = page.getByRole('region', { name: 'Time on this job' })
  const total = (kind: string) => entries.filter((x: any) => x.kind === kind).reduce((n: number, x: any) => n + minutes(x.startAt, x.endAt), 0)
  await expect(region.getByText(`Travel ${total('travel')} min · On the job ${total('job')} min`)).toBeVisible()
  for (const x of entries) {
    const tech = s.technicians.find((t: any) => t.id === x.technicianId).name
    await expect(region.getByText(`${x.kind === 'travel' ? 'Travel' : 'On the job'} · ${tech} · ${hhmm(x.startAt)}–${hhmm(x.endAt)} · ${minutes(x.startAt, x.endAt)} min`)).toBeVisible()
  }
  return { entries, hhmm, zone: s.business[0].timezone }
}

/** A phone signed in as a local dev persona: the checkout's key gate, then one-click entry. */
async function signInPersona(browser: Browser, persona: string, width: number, key: string | null) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const phone = await context.newPage()
  await phone.request.post(`${origin}/__dev/key`, { data: { key }, headers: { origin } })
  await phone.goto(`${origin}/auth/dev/enter?as=${persona}&returnTo=%2Fapp`)
  await phone.waitForURL(url => url.pathname === '/app')
  return { context, phone }
}

for (const width of [1440, 390]) {
  test(`owner, dispatcher, technician and office journey at ${width}px`, async ({ browser }) => {
    const entry = process.env.GLOVE_OPEN
    if (!entry) throw new Error('Set GLOVE_OPEN privately to rer dev’s owner-entry URL; this test needs a real local installation.')
    const desk = await browser.newContext({ viewport: { width, height: 1000 } })
    const page = await desk.newPage()
    await page.goto(`${origin}/`)
    await shot(page, width, 'lobby')
    await page.goto(`${origin}/signin`)
    await shot(page, width, 'signin')
    try {
      // Open the CLI link as a fresh navigation. The sign-in capture can
      // already be on /__dev/key, where changing only its fragment runs no script.
      await page.goto('about:blank')
      await page.goto(entry)
      await page.waitForURL(url => !url.hash.includes('rer-dev') && ['/app', '/setup'].includes(url.pathname))
    } catch { throw new Error('Owner entry failed; obtain a fresh local entry privately.') }
    if (new URL(page.url()).pathname === '/setup') {
      await shot(page, width, 'setup')
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(url => url.pathname === '/app')
    }
    const key = new URLSearchParams(new URL(entry).hash.slice(1)).get('rer-dev')
    await page.request.post(`${origin}/__dev/key`, { data: { key }, headers: { origin } })
    const tag = crypto.randomUUID().slice(0, 6)
    const phone4 = String(1000 + Math.floor(Math.random() * 9000)), siteA = `14 Harbour St, Balmain NSW 2041 (${tag})`, siteB = `22 Wharf Rd, Birchgrove NSW 2041 (${tag})`
    const customer = `Harbourview Dental ${tag}`, techName = `Priya ${tag}`, inviteEmail = `tech-${tag}@example.test`, code = `SVC-${tag}`
    // The technician's phone signs in as a local dev persona (local mail is suppressed).
    const persona = width === 1440 ? 'member' : 'admin', techEmail = `${persona}@dev.localhost`

    // Team: the business, a price book entry with its checklist, a technician who signs in.
    await page.goto(`${origin}/app#team`)
    await expect(page.getByRole('heading', { name: 'Team and settings' })).toBeVisible()
    if (await page.getByRole('heading', { name: 'Set up your business' }).isVisible()) {
      const form = panel(page, 'Set up your business')
      await form.getByLabel('Business name', { exact: true }).fill('Harbour Air & Electrical')
      await form.getByLabel('Timezone for bookings', { exact: true }).selectOption('Australia/Sydney')
      await send(page, form.getByRole('button', { name: 'Save business' }))
    }
    let form = panel(page, 'Add to the price book')
    await form.getByLabel('Code', { exact: true }).fill(code)
    await form.getByLabel('Name', { exact: true }).fill('Split system service')
    await form.getByLabel('Price before tax', { exact: true }).fill('189.00')
    await form.getByLabel('Checklist, one item per line', { exact: true }).fill('*Isolate power\n*Clean filters\nTest run 10 minutes')
    await send(page, form.getByRole('button', { name: 'Add to price book' }))
    // FIELD-002: an inspection form with a conditional question and a reading range, attached to the service.
    const formName = `Inspection ${tag}`
    await page.getByRole('button', { name: 'New form' }).click()
    const builder = page.getByRole('form', { name: 'New form' }), question = (n: number) => builder.getByRole('group', { name: `Question ${n}` })
    await builder.getByLabel('Form name', { exact: true }).fill(formName)
    await question(1).getByLabel('Question', { exact: true }).fill('Unit running on arrival?')
    await question(1).getByLabel('Required', { exact: true }).check()
    await builder.getByRole('button', { name: 'Add question' }).click()
    await question(2).getByLabel('Question', { exact: true }).fill('Fault seen')
    await question(2).getByLabel('Answer type', { exact: true }).selectOption('choice')
    await question(2).getByLabel('Choices, separated by commas', { exact: true }).fill('No cooling, Noise')
    await question(2).getByLabel('Ask only when', { exact: true }).selectOption({ label: 'Unit running on arrival?' })
    await question(2).getByLabel('Has the answer', { exact: true }).selectOption('false')
    await builder.getByRole('button', { name: 'Add question' }).click()
    await question(3).getByLabel('Question', { exact: true }).fill('Suction pressure')
    await question(3).getByLabel('Answer type', { exact: true }).selectOption('reading')
    await question(3).getByLabel('Unit', { exact: true }).fill('psi')
    await question(3).getByLabel('Lowest in range', { exact: true }).fill('110')
    await question(3).getByLabel('Highest in range', { exact: true }).fill('140')
    await builder.getByLabel(`${code} · Split system service`, { exact: true }).check()
    await send(page, builder.getByRole('button', { name: 'Save form' }))
    await expect(page.getByRole('region', { name: 'Forms and inspections' }).getByText(formName, { exact: true })).toBeVisible()
    // MONEY-002: EIN, two contractor licenses and a logo on the business record, kept through a reload.
    form = panel(page, /^Business$/)
    await form.getByLabel('Tax ID (EIN)', { exact: true }).fill('12-3456789')
    for (let n = await form.getByRole('group', { name: /^License \d+$/ }).count(); n < 2; n++) await form.getByRole('button', { name: 'Add a license' }).click()
    for (const [n, trade, number] of [[1, 'HVAC', `TACLA${phone4}C`], [2, 'Electrical', `TECL${phone4}`]]) {
      const license = form.getByRole('group', { name: `License ${n}`, exact: true })
      await license.getByLabel('Trade', { exact: true }).fill(String(trade))
      await license.getByLabel('State', { exact: true }).fill('TX')
      await license.getByLabel('License number', { exact: true }).fill(String(number))
    }
    const logo = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 40; const x = c.getContext('2d')!; x.fillStyle = '#e8743b'; x.fillRect(0, 0, 80, 40); return c.toDataURL('image/png').split(',')[1] })
    await form.getByLabel('Logo', { exact: true }).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(logo, 'base64') })
    await send(page, form.getByRole('button', { name: 'Save business' }))
    await page.reload()
    form = panel(page, /^Business$/)
    await expect(form.getByLabel('Tax ID (EIN)', { exact: true })).toHaveValue('12-3456789')
    await expect(form.getByRole('group', { name: 'License 1', exact: true }).getByLabel('License number', { exact: true })).toHaveValue(`TACLA${phone4}C`)
    await expect(form.getByRole('group', { name: 'License 2', exact: true }).getByLabel('License number', { exact: true })).toHaveValue(`TECL${phone4}`)
    await expect(form.getByRole('img', { name: 'Business logo' })).toBeVisible()
    expect((await page.request.get(`${origin}${await form.getByRole('img', { name: 'Business logo' }).getAttribute('src')}`)).headers()['content-type']).toBe('image/png')
    form = panel(page, 'Invite someone')
    await form.getByLabel('Name', { exact: true }).fill(`Casey ${tag}`)
    await form.getByLabel('Email', { exact: true }).fill(inviteEmail)
    await form.getByLabel('Role', { exact: true }).selectOption('office')
    await send(page, form.getByRole('button', { name: 'Send invitation' }))
    await expect(page.getByText(inviteEmail)).toBeVisible()
    const { context: phoneContext, phone } = await signInPersona(browser, persona, width, key)
    await page.reload()
    const techOperator = page.locator('tr').filter({ hasText: techEmail })
    const roleSet = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
    await techOperator.getByRole('combobox').selectOption('technician')
    expect((await (await roleSet).json()).ok).toBe(true)
    form = panel(page, 'Add a technician')
    await form.getByLabel('Name on the board', { exact: true }).fill(techName)
    const signsInAs = form.getByLabel('Signs in as (optional)', { exact: true })
    await signsInAs.selectOption(await signsInAs.locator('option', { hasText: techEmail }).getAttribute('value') ?? '')
    await send(page, form.getByRole('button', { name: 'Add technician' }))
    await shot(page, width, 'team')

    // Customers and the site.
    await page.goto(`${origin}/app#customers`)
    await page.getByRole('button', { name: 'New customer' }).click()
    form = panel(page, 'New customer')
    await form.getByLabel('Name', { exact: true }).fill(customer)
    await form.getByLabel('Contact person', { exact: true }).fill('Dr Mei Lin')
    await form.getByLabel('Email for quotes and invoices', { exact: true }).fill(`accounts-${tag}@harbourview.example`)
    await form.getByLabel('Phone', { exact: true }).fill(`(212) 555-${phone4}`)
    await form.getByLabel('Billing address', { exact: true }).fill(`PO Box ${phone4}, Balmain NSW 2041`)
    await form.getByLabel('Customer type', { exact: true }).selectOption('business')
    await form.getByLabel('Billing contact', { exact: true }).fill('Ravi Patel')
    await form.getByLabel('Accounts-payable email', { exact: true }).fill(`ap-${tag}@harbourview.example`)
    await form.getByLabel('Requires a purchase-order number on invoices').check()
    await form.getByLabel('Other contacts', { exact: true }).fill('Ravi Patel, accounts payable, , ap@harbourview.example')
    await send(page, form.getByRole('button', { name: 'Add customer' }))
    form = panel(page, 'Sites')
    for (const [address, contact] of [[siteA, 'Jo Front Desk'], [siteB, 'Sam Practice Manager']]) {
      await form.getByLabel('Site address', { exact: true }).fill(address)
      await form.getByLabel('Access notes (optional)', { exact: true }).fill('Gate code at reception')
      await form.getByLabel('Site contact (optional)', { exact: true }).fill(contact)
      await send(page, form.getByRole('button', { name: 'Add site' }))
      await expect(form.getByText(address, { exact: true })).toBeVisible()
      await expect(form.getByLabel('Site address', { exact: true })).toHaveValue('')
    }
    // CUST-002: the condenser installed at the site, which the technician's phone shows offline.
    form = panel(page, /^Equipment$/)
    await form.getByLabel('Type', { exact: true }).fill('AC condenser')
    await form.getByLabel('Make', { exact: true }).fill('Trane')
    await form.getByLabel('Serial', { exact: true }).fill(`C-${tag}`)
    await form.getByLabel('Refrigerant', { exact: true }).fill('R-410A')
    await send(page, form.getByRole('button', { name: 'Add equipment' }))
    await expect(form.getByText(`Serial C-${tag}`)).toBeVisible()
    await expect(form.getByLabel('Type', { exact: true })).toHaveValue('')
    await form.getByLabel('Site', { exact: true }).selectOption({ label: siteB })
    await form.getByLabel('Type', { exact: true }).fill('Furnace')
    await form.getByLabel('Make', { exact: true }).fill('Carrier')
    await send(page, form.getByRole('button', { name: 'Add equipment' }))
    await shot(page, width, 'customers')

    // Request → quote → approved price → recorded as sent → accepted.
    await page.goto(`${origin}/app#quotes`)
    form = panel(page, 'Record a request')
    await form.getByLabel('Customer', { exact: true }).selectOption({ label: customer })
    await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
    await form.getByLabel('What the customer needs', { exact: true }).fill('Surgery 2 split system blowing warm air')
    await send(page, form.getByRole('button', { name: 'Record request' }))
    await page.locator('li').filter({ hasText: customer }).getByRole('button', { name: 'Quote it' }).click()
    form = panel(page, `Quote for ${customer}`)
    await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
    await form.getByLabel('Title', { exact: true }).fill('Split system service')
    await form.getByLabel('From the price book', { exact: true }).selectOption({ label: `${code} · Split system service` })
    await send(page, form.getByRole('button', { name: 'Save draft' }))
    await send(page, page.getByRole('button', { name: /^Approve revision 1 at/ }))
    await send(page, page.getByRole('button', { name: 'Record as sent' }))
    await expect(page.getByText(/Delivery is not confirmed/)).toBeVisible()
    await send(page, page.getByRole('button', { name: 'Record acceptance' }))
    await expect(page.getByText(/accepted by Dr Mei Lin \(phone\)/)).toBeVisible()
    await shot(page, width, 'quotes')

    // Dispatch: job from the accepted quote, a booking, and a reviewed conflict.
    await page.goto(`${origin}/app#dispatch`)
    await send(page, page.locator('.queue li').filter({ hasText: customer }).getByRole('button', { name: 'Create job' }))
    await page.locator('.queue li').filter({ hasText: customer }).getByRole('button', { name: 'Book a visit' }).click()
    form = panel(page, 'Book a visit')
    await form.getByLabel('Technician', { exact: true }).selectOption({ label: techName })
    await form.getByLabel('Starts', { exact: true }).fill('09:00')
    await form.getByLabel('Ends', { exact: true }).fill('10:30')
    await send(page, form.getByRole('button', { name: 'Book visit' }))
    await expect(page.getByRole('heading', { name: 'Book a visit' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Book visit', exact: true }).first().click()
    form = panel(page, 'Book a visit')
    await form.getByLabel('Job', { exact: true }).selectOption(await form.getByLabel('Job', { exact: true }).locator('option', { hasText: customer }).first().getAttribute('value') ?? '')
    await form.getByLabel('Technician', { exact: true }).selectOption({ label: techName })
    await form.getByLabel('Starts', { exact: true }).fill('10:00')
    await form.getByLabel('Ends', { exact: true }).fill('11:00')
    await send(page, form.getByRole('button', { name: 'Book visit' }), false)
    await expect(page.getByRole('heading', { name: 'Dispatch conflict' })).toBeVisible()
    await expect(page.getByText(new RegExp(`${techName} already has`))).toBeVisible()
    await shot(page, width, 'dispatch')
    await send(page, page.getByRole('button', { name: 'Review and confirm change' }))
    await expect(page.getByRole('region', { name: techName }).getByText('Conflict').first()).toBeVisible()

    // COST-001: a second job today for the same technician, through the public commands.
    const command = async (type: string, payload: object) => { const body = await (await page.request.post(`${origin}/api/glove/commands`, { data: { commandId: crypto.randomUUID(), type, payload }, headers: { origin } })).json(); expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true); return body.result }
    const before = await records(page), zone = before.business[0].timezone
    const second = await command('quote.draft', { customerId: before.customers.find((c: any) => c.name === customer).id, siteId: before.sites.find((x: any) => x.address === siteA).id, title: 'Second unit check', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: before.services.find((x: any) => x.code === code).id }] })
    const approved = await command('quote.approve', { quoteId: second.id, version: second.version, revision: 1 })
    await command('quote.accept', { quoteId: second.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
    const secondJob = await command('job.create', { quoteId: second.id })
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    await command('visit.book', { jobId: secondJob.id, technicianId: before.technicians.find((t: any) => t.name === techName).id, date: day, start: '13:00', end: '14:00' })

    // DISP-001 at 1440: an unscheduled job dragged onto the technician at 3 pm, dragged in the week to another day
    // through a conflict review, moved back and lengthened with the keyboard, then found in the month, colored by job type.
    if (width === 1440) {
      const techId = before.technicians.find((t: any) => t.name === techName).id
      const short = (d: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(new Date(`${d}T00:00:00Z`)).filter(p => p.type !== 'literal').map(p => p.value).join(' ')
      const saturday = new Date(`${day}T00:00:00Z`).getUTCDay() === 6, other = new Date(Date.parse(`${day}T00:00:00Z`) + (saturday ? -1 : 1) * 86400000).toISOString().slice(0, 10)
      const third = await command('quote.draft', { customerId: before.customers.find((c: any) => c.name === customer).id, siteId: before.sites.find((x: any) => x.address === siteA).id, title: 'Board drag check', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: before.services.find((x: any) => x.code === code).id }] })
      const thirdApproved = await command('quote.approve', { quoteId: third.id, version: third.version, revision: 1 })
      await command('quote.accept', { quoteId: third.id, version: thirdApproved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
      const dragJob = await command('job.create', { quoteId: third.id })
      await command('visit.book', { jobId: secondJob.id, technicianId: techId, date: other, start: '15:00', end: '16:00' })
      const answer = (ok: boolean) => page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST').then(r => r.json()).then(b => { expect(b.ok, JSON.stringify(b.error ?? {})).toBe(ok); return b })
      const settled = () => expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      const visitOf = async () => (await records(page)).visits.find((v: any) => v.jobId === dragJob.id && v.status !== 'cancelled')
      await page.goto(`${origin}/app#dispatch`)
      const timeline = page.getByRole('region', { name: techName }).locator('.timeline')
      const [three, row] = [await page.locator('.schedule .hours span', { hasText: /^15:00$/ }).boundingBox(), await timeline.boundingBox()]
      let posted = answer(true)
      await page.locator('.queue li').filter({ hasText: dragJob.number }).dragTo(timeline, { targetPosition: { x: three!.x - row!.x + 3, y: 60 } })
      await posted; await settled()
      expect(await visitOf()).toMatchObject({ technicianId: techId, local: { date: day, start: '15:00', end: '16:00' } })
      const chip = page.getByRole('button', { name: new RegExp(`^${dragJob.number} Board drag check, `) })
      await page.getByRole('group', { name: 'Board view' }).getByRole('button', { name: 'Week' }).click()
      await chip.dragTo(page.getByRole('gridcell', { name: `${techName} ${short(other)}` }))
      await page.getByLabel('Reason for the move', { exact: true }).fill('Customer asked for another day')
      posted = answer(false)
      await page.getByRole('button', { name: 'Move visit' }).click()
      await posted; await settled()
      await expect(page.getByRole('heading', { name: 'Dispatch conflict' })).toBeVisible()
      await send(page, page.getByRole('button', { name: 'Review and confirm change' }))
      expect((await visitOf()).local).toEqual({ date: other, start: '15:00', end: '16:00' })
      await chip.focus()
      await page.keyboard.press(saturday ? 'ArrowRight' : 'ArrowLeft')
      await expect(page.getByText(`Moving ${dragJob.number} to ${techName}, ${short(day)} 15:00–16:00 · Enter to review, Escape to cancel`)).toBeVisible()
      await page.keyboard.press('Enter')
      await page.getByLabel('Reason for the move', { exact: true }).fill('Back to today after all')
      await send(page, page.getByRole('button', { name: 'Move visit' }))
      await page.getByRole('group', { name: 'Board view' }).getByRole('button', { name: 'Day' }).click()
      await chip.focus()
      await page.keyboard.press('Shift+ArrowRight')
      await page.keyboard.press('Enter')
      await page.getByLabel('Reason for the move', { exact: true }).fill('Needs a longer slot')
      await send(page, page.getByRole('button', { name: 'Move visit' }))
      const moved = await visitOf()
      expect([moved.local, moved.assignments.length]).toEqual([{ date: day, start: '15:00', end: '16:15' }, 4])
      await page.getByRole('group', { name: 'Board view' }).getByRole('button', { name: 'Month' }).click()
      await expect(page.getByRole('gridcell', { name: short(day) }).getByRole('button', { name: new RegExp(`^${dragJob.number} `) })).toBeVisible()
      await page.getByLabel('Color by').selectOption('type')
      await expect(page.getByRole('list', { name: 'Job types' }).getByRole('listitem')).not.toHaveCount(0)
      await expect(chip).toHaveClass(/type-\d/)
      // DISP-007 at 1440: a two-person crew named on Team, booked as one, dragged to another day on the week board by crew.
      const mate = await command('technician.save', { name: `Crew mate ${tag}` })
      await page.goto(`${origin}/app#team`)
      const crews = page.getByRole('region', { name: 'Crews' })
      await crews.getByLabel('Crew name', { exact: true }).fill(`Install ${tag}`)
      await crews.getByLabel(techName, { exact: true }).check()
      await crews.getByLabel(`Crew mate ${tag}`, { exact: true }).check()
      await send(page, crews.getByRole('button', { name: 'Save crew' }))
      const crew = (await records(page)).crews.find((c: any) => c.name === `Install ${tag}`)
      const fourth = await command('quote.draft', { customerId: before.customers.find((c: any) => c.name === customer).id, siteId: before.sites.find((x: any) => x.address === siteA).id, title: 'Crew install', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: before.services.find((x: any) => x.code === code).id }] })
      const fourthApproved = await command('quote.approve', { quoteId: fourth.id, version: fourth.version, revision: 1 })
      await command('quote.accept', { quoteId: fourth.id, version: fourthApproved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
      const crewJob = await command('job.create', { quoteId: fourth.id })
      const crewBooking = await command('visit.book', { jobId: crewJob.id, crewId: crew.id, date: day, start: '07:00', end: '08:00' })
      await page.goto(`${origin}/app#dispatch`)
      await page.getByRole('group', { name: 'Board view' }).getByRole('button', { name: 'Week' }).click()
      await page.getByLabel('Rows').selectOption('crews')
      await page.getByRole('button', { name: new RegExp(`^${crewJob.number} Crew install, Crew Install ${tag}, `) }).dragTo(page.getByRole('gridcell', { name: `Crew Install ${tag} ${short(other)}` }))
      await page.getByLabel('Reason for the move', { exact: true }).fill('Crew needed elsewhere today')
      await send(page, page.getByRole('button', { name: 'Move visit' }))
      const crewVisits = (await records(page)).visits.filter((v: any) => v.crew?.groupId === crewBooking.id)
      expect(crewVisits.map((v: any) => [v.technicianId, v.local.date, v.local.start]).sort()).toEqual([[techId, other, '07:00'], [mate.id, other, '07:00']].sort())
      await shot(page, width, 'dispatch-week-by-crew')
      await page.getByLabel('Rows').selectOption('technicians')
      await expect(page.locator('.board-month .chip[class*="tone-"]')).toHaveCount(0)
      await shot(page, width, 'dispatch-board')
    }

    // QUOTE-001: the first quote saved as a template; a second quote with two options and an add-on, and the customer's choice.
    await page.goto(`${origin}/app#quotes`)
    await page.locator('tr').filter({ hasText: 'Split system service' }).filter({ hasText: 'Accepted' }).first().getByRole('button').click()
    await page.getByLabel('Template name', { exact: true }).fill(`Tune-up ${tag}`)
    await send(page, page.getByRole('button', { name: 'Save as template' }))
    await page.getByRole('button', { name: 'New quote' }).click()
    form = panel(page, 'New quote')
    await form.getByLabel('Customer', { exact: true }).selectOption({ label: customer })
    await form.getByLabel('Site', { exact: true }).selectOption({ label: siteA })
    await form.getByLabel('Title', { exact: true }).fill('Second opinion')
    await form.getByRole('button', { name: 'Add an option' }).click()
    const choice = (name: string) => form.getByRole('group', { name, exact: true })
    await choice('Option 1').getByLabel('Option name', { exact: true }).fill('Good')
    await choice('Option 1').getByLabel('From the price book', { exact: true }).selectOption({ label: `${code} · Split system service` })
    await choice('Option 2').getByLabel('Option name', { exact: true }).fill('Better')
    await choice('Option 2').getByLabel('Description', { exact: true }).fill('Service and coil clean')
    await choice('Option 2').getByLabel('Unit price', { exact: true }).fill('260.00')
    await form.getByRole('button', { name: 'Add an add-on' }).click()
    await choice('Add-on 1').getByLabel('Add-on name', { exact: true }).fill('Surge protector')
    await choice('Add-on 1').getByLabel('Description', { exact: true }).fill('Surge protector')
    await choice('Add-on 1').getByLabel('Unit price', { exact: true }).fill('95.00')
    await send(page, form.getByRole('button', { name: 'Save draft' }))
    await send(page, page.getByRole('button', { name: 'Approve revision 1 (2 options, 1 add-on)' }))
    await page.getByLabel('Better · $286.00', { exact: true }).check()
    await page.getByLabel('Add-on: Surge protector', { exact: true }).check()
    await send(page, page.getByRole('button', { name: 'Record acceptance' }))
    await expect(page.getByText('Chosen: Better + Surge protector · $390.50 incl. tax')).toBeVisible()
    await shot(page, width, 'quote-options')

    // STOCK-001: a price-book material, the technician's van with a par level, and a restock, on the Stock screen.
    const material = `Run capacitor ${tag}`, vanName = `Van ${tag}`
    await command('service.save', { code: `CAP-${tag}`, name: material, kind: 'material', unit: 'each', unitCost: '12.00', unitPrice: '38.00', tax: 'GST' })
    await page.goto(`${origin}/app#stock`)
    form = page.getByRole('form', { name: 'Add a van or warehouse' })
    await form.getByLabel('Location name', { exact: true }).fill(vanName)
    await form.getByLabel("Technician's van", { exact: true }).selectOption({ label: techName })
    await form.getByLabel('Par level for (optional)', { exact: true }).selectOption({ label: `CAP-${tag} · ${material}` })
    await form.getByLabel('Par level', { exact: true }).fill('2')
    await send(page, form.getByRole('button', { name: 'Add location' }))
    form = page.getByRole('form', { name: 'Count, restock or transfer' })
    await form.getByLabel('Location', { exact: true }).selectOption({ label: vanName })
    await form.getByLabel('Material', { exact: true }).selectOption({ label: `CAP-${tag} · ${material}` })
    await form.getByLabel('Quantity', { exact: true }).fill('3')
    await send(page, form.getByRole('button', { name: 'Record' }))
    const vanPanel = page.getByRole('region', { name: vanName, exact: true })
    await expect(vanPanel.getByText('3 each (par 2)')).toBeVisible()
    await expect(vanPanel.getByText('Low', { exact: true })).toHaveCount(0)

    // The technician's phone, through a connectivity interruption.
    await phone.goto(`${origin}/app`)
    await expect(phone.getByRole('heading', { name: 'Your visits' })).toBeVisible()
    const clockStatus = phone.getByRole('region', { name: 'Time', exact: true }).getByRole('status'), timerStatus = phone.getByRole('region', { name: 'Timers' }).getByRole('status')
    const sent = () => expect(phone.getByText(/waiting to send|Sending/)).toHaveCount(0, { timeout: 30_000 })
    await phone.getByRole('button', { name: 'Clock in' }).click()
    await expect(clockStatus).toHaveText(/^On the clock since \d\d:\d\d$/)
    await phone.getByRole('button', { name: /09:00–10:30/ }).click()
    await phone.getByRole('button', { name: 'Start travel' }).click()
    await expect(timerStatus).toHaveText(/^Travel timer running since/)
    await phone.getByRole('button', { name: 'Record arrival' }).click()
    await expect(phone.getByText(/Arrival recorded at/)).toBeVisible()
    await phone.getByRole('button', { name: 'Start job timer' }).click()
    await expect(timerStatus).toHaveText(/^Job timer running since/)
    await sent()
    // FIELD-002: the fault question appears only once the unit is not running; the reading is out of range.
    const inspection = phone.getByRole('region', { name: formName })
    await expect(inspection.getByLabel('Fault seen', { exact: true })).toHaveCount(0)
    await inspection.getByLabel('No', { exact: true }).check()
    await inspection.getByLabel('Fault seen', { exact: true }).selectOption('No cooling')
    await inspection.getByLabel('Suction pressure (psi)', { exact: true }).fill('152')
    await inspection.getByRole('button', { name: `Save ${formName}` }).click()
    await sent()
    await expect(inspection.getByText('1 reading out of range')).toBeVisible()
    await phoneContext.setOffline(true)
    await expect(phone.getByRole('region', { name: 'Equipment' }).getByText(`Serial C-${tag}`)).toBeVisible()
    await phone.getByLabel('Isolate power', { exact: true }).check()
    await phone.getByLabel('Clean filters', { exact: true }).check()
    await phone.getByLabel('Note', { exact: true }).fill('Filters heavily clogged; recommend 6-monthly service')
    await phone.getByRole('button', { name: 'Add note' }).click()
    const png = await phone.evaluate(() => { const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d')!; x.fillStyle = '#7aa0b8'; x.fillRect(0, 0, 64, 48); x.fillStyle = '#f2f2f2'; x.fillRect(8, 10, 48, 20); return c.toDataURL('image/png').split(',')[1] })
    await phone.getByRole('region', { name: 'Photos' }).locator('input[type=file]').setInputFiles({ name: 'indoor-unit.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
    await phone.getByLabel('Describe it', { exact: true }).fill('R32 refrigerant')
    await phone.getByLabel('Quantity', { exact: true }).fill('0.5')
    await phone.getByRole('button', { name: 'Add material' }).click()
    await expect(phone.getByText('Offline — 5 items waiting to send.')).toBeVisible()
    await shot(phone, width, 'technician-offline')
    await phoneContext.setOffline(false)
    await expect(phone.getByText(/waiting to send|Sending/)).toHaveCount(0, { timeout: 30_000 })
    await phone.getByRole('button', { name: 'Complete visit' }).click()
    await phone.getByLabel('Work done', { exact: true }).fill('Cleaned filters and coil; unit cooling to 12°C')
    await phone.getByLabel('Customer name', { exact: true }).fill('Dr Mei Lin')
    const pad = (await phone.locator('canvas.signature').boundingBox())!
    await phone.mouse.move(pad.x + 20, pad.y + pad.height * 0.6)
    await phone.mouse.down()
    for (const [dx, dy] of [[60, -20], [120, 10], [180, -25], [240, 5]]) await phone.mouse.move(pad.x + dx, pad.y + pad.height * 0.5 + dy)
    await phone.mouse.up()
    await phone.getByRole('button', { name: 'Save completion' }).click()
    await expect(phone.getByText(/waiting to send|Sending/)).toHaveCount(0, { timeout: 30_000 })
    await phone.getByRole('button', { name: '‹ Your visits' }).click()
    await shot(phone, width, 'technician-visits')
    // COST-001: the second job's travel and job timers through an offline stretch, then clock out.
    await phone.getByRole('button', { name: /13:00–14:00/ }).click()
    await phoneContext.setOffline(true)
    await phone.getByRole('button', { name: 'Start travel' }).click()
    await phone.getByRole('button', { name: 'Start job timer' }).click()
    await expect(phone.getByText('Offline — 2 items waiting to send.')).toBeVisible()
    await expect(timerStatus).toHaveText(/^Job timer running since/)
    await shot(phone, width, 'technician-timers')
    await phoneContext.setOffline(false)
    await sent()
    // STOCK-001: two capacitors used on this visit come off the van.
    await phone.getByLabel('Item', { exact: true }).selectOption({ label: material })
    await phone.getByLabel('Quantity', { exact: true }).fill('2')
    await phone.getByRole('button', { name: 'Add material' }).click()
    await sent()

    // FIELD-001 at 390: the day loads, the phone loses signal and reloads, a visit is completed with its checklist, form and a
    // photo with no signal while the desk moves another visit to someone else; on reconnect everything lands once and the
    // moved visit's items wait for the dispatcher's review.
    if (width === 390) {
      const s0 = await records(page), techId = s0.technicians.find((t: any) => t.name === techName).id, otherTech = s0.technicians.find((t: any) => t.active && t.id !== techId)
      const offlineCustomer = await command('customer.save', { name: `Gate Lodge ${tag}` }), offlineSite = await command('site.save', { customerId: offlineCustomer.id, address: `3 Gate Lodge Rd (${tag})` })
      const offlineJob = async (title: string) => {
        const q = await command('quote.draft', { customerId: offlineCustomer.id, siteId: offlineSite.id, title, lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: s0.services.find((x: any) => x.code === code).id }] })
        const a = await command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
        await command('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
        return command('job.create', { quoteId: q.id })
      }
      const one = await offlineJob('Offline day one'), two = await offlineJob('Offline day two')
      const v1 = await command('visit.book', { jobId: one.id, technicianId: techId, date: day, start: '16:00', end: '16:45' })
      const v2 = await command('visit.book', { jobId: two.id, technicianId: techId, date: day, start: '17:00', end: '17:45' })
      await phone.goto(`${origin}/app`)
      await expect(phone.getByRole('button', { name: /16:00–16:45/ })).toBeVisible()
      await phoneContext.setOffline(true)
      await phone.reload()
      await expect(phone.getByText(/^No signal: showing your day as of/)).toBeVisible()
      await phone.getByRole('button', { name: /17:00–17:45/ }).click()
      await phone.getByRole('button', { name: 'Record arrival' }).click()
      await phone.getByLabel('Note', { exact: true }).fill('Gate locked; waited for the tenant')
      await phone.getByRole('button', { name: 'Add note' }).click()
      await phone.getByRole('button', { name: '‹ Your visits' }).click()
      // Meanwhile the desk gives the 5 pm visit to another technician.
      const change = async (acknowledge: string[] = []): Promise<any> => (await page.request.post(`${origin}/api/glove/commands`, { data: { commandId: crypto.randomUUID(), type: 'visit.change', payload: { visitId: v2.id, version: v2.version, technicianId: otherTech.id, reason: 'Tenant asked for the morning crew', acknowledge } }, headers: { origin } })).json()
      let moved = await change()
      if (!moved.ok && moved.error.code === 'CONFLICT_REVIEW') moved = await change(moved.error.details.conflicts.map((c: any) => c.code))
      expect(moved.ok, JSON.stringify(moved.error ?? {})).toBe(true)
      await phone.getByRole('button', { name: /16:00–16:45/ }).click()
      await phone.getByRole('button', { name: 'Record arrival' }).click()
      await phone.getByLabel('Isolate power', { exact: true }).check()
      await phone.getByLabel('Clean filters', { exact: true }).check()
      const offlineForm = phone.getByRole('region', { name: formName })
      await offlineForm.getByLabel('Yes', { exact: true }).check()
      await offlineForm.getByLabel('Suction pressure (psi)', { exact: true }).fill('120')
      await offlineForm.getByRole('button', { name: `Save ${formName}` }).click()
      await phone.getByRole('region', { name: 'Photos' }).locator('input[type=file]').setInputFiles({ name: 'outdoor-unit.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
      await phone.getByRole('button', { name: 'Complete visit' }).click()
      await phone.getByLabel('Work done', { exact: true }).fill('Serviced with no signal on site')
      await phone.getByLabel('The customer is not here to sign').check()
      await phone.getByLabel('Why there is no sign-off', { exact: true }).fill('Tenant at work; gate code from the office')
      await phone.getByRole('button', { name: 'Save completion' }).click()
      await expect(phone.getByText('Offline — 8 items waiting to send.')).toBeVisible()
      await shot(phone, width, 'technician-offline-day')
      await phoneContext.setOffline(false)
      await sent()
      const after = await records(page), kinds = (visitId: string) => after.captures.filter((x: any) => x.visitId === visitId).map((x: any) => x.kind).sort()
      expect(kinds(v1.id)).toEqual(['arrival', 'checklist', 'checklist', 'completion', 'form', 'photo'])
      expect(after.visits.find((v: any) => v.id === v1.id).status).toBe('completed')
      expect(kinds(v2.id)).toEqual(['arrival', 'note'])
      expect(after.visits.find((v: any) => v.id === v2.id).lateEvidence.filter((x: any) => !x.reviewed)).toHaveLength(2)
      await page.goto(`${origin}/app#dispatch`)
      await page.getByRole('button', { name: new RegExp(`^${two.number} Offline day two, `) }).click()
      await expect(page.getByText('2 field items arrived after this visit changed.')).toBeVisible()
      await send(page, page.getByRole('button', { name: 'Mark reviewed' }))
      // FIELD-004: the push service fake on this computer receives what Glove sends and hands it to the phone's service worker.
      const pushed: { authorization: string; encoding: string; body: Buffer }[] = []
      const service = createServer((req, res) => { const chunks: Buffer[] = []; req.on('data', c => chunks.push(c)); req.on('end', () => { pushed.push({ authorization: String(req.headers.authorization), encoding: String(req.headers['content-encoding']), body: Buffer.concat(chunks) }); res.writeHead(201).end() }) })
      await new Promise<void>(resolve => service.listen(0, '127.0.0.1', resolve))
      // The headless shell refuses notifications, so this phone is Playwright's own Chromium in its new headless mode.
      const pushBrowser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-mock-keychain', '--password-store=basic'] })
      try {
        const { context: pushContext, phone: pushPhone } = await signInPersona(pushBrowser, persona, width, key)
        const device = await phoneKeys(), endpoint = `http://127.0.0.1:${(service.address() as any).port}/push/${tag}`
        await page.goto(`${origin}/app#team`)
        await send(page, page.getByRole('button', { name: 'Turn on phone notifications' }))
        const publicKey = (await records(page)).business[0].webPush.publicKey
        // The subscription the push service hands this phone, with the test's keys (headless Chromium has no push service).
        await pushContext.grantPermissions(['notifications'], { origin })
        await pushContext.addInitScript(({ endpoint, keys }) => {
          const subscription = { endpoint, expirationTime: null, options: null, getKey: () => null, toJSON: () => ({ endpoint, expirationTime: null, keys }), unsubscribe: async () => { localStorage.removeItem('test.push'); return true } }
          PushManager.prototype.subscribe = async function (options?: PushSubscriptionOptionsInit) { localStorage.setItem('test.push', btoa(String.fromCharCode(...new Uint8Array(options!.applicationServerKey as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')); return subscription as unknown as PushSubscription }
          PushManager.prototype.getSubscription = async function () { return (localStorage.getItem('test.push') ? subscription : null) as unknown as PushSubscription }
        }, { endpoint, keys: device.keys })
        await pushPhone.goto(`${origin}/app`)
        // Installable: the manifest Chromium reads, with no installability errors but the test profile's own incognito one.
        const cdp = await pushContext.newCDPSession(pushPhone)
        const manifest = await cdp.send('Page.getAppManifest')
        expect(manifest.url).toBe(`${origin}/manifest.webmanifest`)
        expect(JSON.parse(manifest.data!)).toMatchObject({ name: 'Glove', start_url: '/app', display: 'standalone' })
        await expect.poll(async () => (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.map(e => e.errorId).filter(id => id !== 'in-incognito')).toEqual([])
        const notifications = pushPhone.getByRole('region', { name: 'Notifications' })
        await notifications.getByRole('button', { name: 'Turn on notifications' }).click()
        await expect(notifications.getByRole('status')).toHaveText('On for this phone: new, moved and canceled visits.')
        expect(await pushPhone.evaluate(() => localStorage.getItem('test.push'))).toBe(publicKey)
        // The dispatcher books tomorrow's visit for this technician, then moves it.
        const s1 = await records(page), techId = s1.technicians.find((t: any) => t.name === techName).id
        const harbour = s1.customers.find((c: any) => c.name === customer), site = s1.sites.find((x: any) => x.address === siteA)
        const q = await command('quote.draft', { customerId: harbour.id, siteId: site.id, title: 'Push visit', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '189.00', serviceId: s1.services.find((x: any) => x.code === code).id }] })
        const a = await command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
        await command('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
        const pushJob = await command('job.create', { quoteId: q.id })
        const tomorrow = new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)
        const booked = await command('visit.book', { jobId: pushJob.id, technicianId: techId, date: tomorrow, start: '07:00', end: '08:00' })
        await command('visit.change', { visitId: booked.id, version: booked.version, start: '07:30', end: '08:30', reason: 'Customer asked for later' })
        expect(pushed).toHaveLength(2)
        const messages = await Promise.all(pushed.map(async p => ({ ...JSON.parse(await decrypt(p.body, device)), key: (await vapid(p.authorization)).k, encoding: p.encoding })))
        expect(messages).toEqual([{ title: 'Glove', body: 'New visit on your schedule', jobId: pushJob.id, key: publicKey, encoding: 'aes128gcm' }, { title: 'Glove', body: 'Visit moved', jobId: pushJob.id, key: publicKey, encoding: 'aes128gcm' }])
        // The push service delivers the move to the phone's service worker, which shows the notification.
        const worker = await pushContext.newCDPSession(pushPhone)
        const registration = new Promise<string>(resolve => worker.on('ServiceWorker.workerRegistrationUpdated', e => { const r = e.registrations.find(x => x.scopeURL === `${origin}/` && !x.isDeleted); if (r) resolve(r.registrationId) }))
        await worker.send('ServiceWorker.enable')
        await worker.send('ServiceWorker.deliverPushMessage', { origin, registrationId: await registration, data: await decrypt(pushed[1].body, device) })
        await expect.poll(() => pushPhone.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications()).map(n => [n.title, n.body, n.data?.jobId]))).toEqual([['Glove', 'Visit moved', pushJob.id]])
        await pushPhone.reload()
        await expect(notifications.getByText(/^Handed to the push service · /)).toBeVisible()
        // Tapping it opens the app on that job's visit, with tap-to-call and tap-to-navigate.
        await pushPhone.goto(`${origin}/app?job=${pushJob.id}`)
        await expect(pushPhone.getByRole('heading', { name: `${pushJob.number} · Push visit` })).toBeVisible()
        await expect(pushPhone.getByRole('link', { name: 'Call customer' })).toHaveAttribute('href', `tel:212555${phone4}`)
        await expect(pushPhone.getByRole('link', { name: 'Navigate to site' })).toHaveAttribute('href', `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(siteA)}`)
        await expect(pushPhone.getByRole('region', { name: 'Photos' }).locator('input[type=file]')).toHaveAttribute('capture', 'environment')
        await shot(pushPhone, width, 'technician-push')
      } finally { await pushBrowser.close(); await new Promise(resolve => service.close(resolve)) }
      // Back to the 1 pm visit, whose job timer is still running.
      await phone.getByRole('button', { name: '‹ Your visits' }).click()
      await phone.getByRole('button', { name: /13:00–14:00/ }).click()
    }
    expect(await checkToday(page, null)).toContain(techName)
    await phone.getByRole('button', { name: 'Stop timer' }).click()
    await expect(timerStatus).toHaveText('No timer running on this visit')
    await phone.getByRole('button', { name: '‹ Your visits' }).click()
    await phone.getByRole('button', { name: 'Clock out' }).click()
    await expect(clockStatus).toHaveText(/^Off the clock/)
    await sent()
    await expect(phone.getByRole('region', { name: vanName }).getByText(`Low: ${material} (1 each)`)).toBeVisible()
    await phoneContext.close()

    // The job record: evidence, sign-off and timeline.
    await page.goto(`${origin}/app#jobs`)
    await page.locator('tr').filter({ hasText: customer }).filter({ hasText: 'Split system service' }).getByRole('button').click()
    await expect(page.getByRole('heading', { name: 'Field evidence' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Signature of Dr Mei Lin' })).toBeVisible()
    await expect(page.getByText('Suction pressure: 152 psi — out of range 110–140 psi')).toBeVisible()
    await expect(page.getByText(/completed the visit — signed off by Dr Mei Lin/)).toBeVisible()
    await shot(page, width, 'jobs')
    await checkJobTime(page, 'Split system service', customer)
    // COST-001: the second job's time, and a desk correction that keeps the phone's original.
    await page.locator('tr').filter({ hasText: customer }).filter({ hasText: 'Second unit check' }).getByRole('button').click()
    const { entries, hhmm, zone: jobZone } = await checkJobTime(page, 'Second unit check', customer)
    const onJob = entries.find((x: any) => x.kind === 'job'), corrected = new Date(Date.parse(onJob.startAt) + 45 * 60_000).toISOString()
    const timeRow = page.getByRole('region', { name: 'Time on this job' }).locator('li').filter({ hasText: 'On the job ·' })
    await timeRow.getByRole('button', { name: 'Correct' }).click()
    await timeRow.getByLabel('End date', { exact: true }).fill(new Intl.DateTimeFormat('en-CA', { timeZone: jobZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(corrected)))
    await timeRow.getByLabel('End time', { exact: true }).fill(hhmm(corrected))
    await timeRow.getByLabel('Reason for the correction', { exact: true }).fill('Timer stopped late; left site after 45 minutes')
    await send(page, timeRow.getByRole('button', { name: 'Save correction' }))
    await expect(timeRow.getByText(`On the job · ${techName} · ${hhmm(onJob.startAt)}–${hhmm(corrected)} · 45 min`)).toBeVisible()
    await expect(timeRow.getByText(`Original from the phone: ${hhmm(onJob.startAt)}–${hhmm(onJob.endAt)}`)).toBeVisible()
    await expect(timeRow.getByText(/^Corrected by .*: Timer stopped late; left site after 45 minutes/)).toBeVisible()
    const kept = (await records(page)).times.find((x: any) => x.id === onJob.id)
    expect(kept.original).toEqual({ startAt: onJob.startAt, endAt: onJob.endAt })
    await shot(page, width, 'job-time')
    // COST-004: the job's estimate and actual, from the cost door.
    const costed = (await (await page.request.get(`${origin}/api/glove/jobs/${onJob.jobId}/cost`)).json()).costing
    const costing = page.getByRole('region', { name: 'Estimate and actual' })
    for (const [label, value] of [['Revenue before tax', costed.revenue], ['Estimated cost', costed.estimate.cost], ['Actual cost', costed.actual.cost]]) await expect(costing.getByRole('row', { name: `${label} ${dollars(cents(value))}` })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Job costing' })).toBeVisible()
    await page.goto(`${origin}/app#stock`)
    await expect(vanPanel.locator('li').filter({ hasText: material }).getByText('1 each (par 2)')).toBeVisible()
    await expect(vanPanel.locator('li').filter({ hasText: material }).getByText('Low', { exact: true })).toBeVisible()
    await shot(page, width, 'stock')
    expect(await checkToday(page, customer, 'Completed')).not.toContain(techName)
    await shot(page, width, 'today')

    // Invoice: prepare, approve, export once.
    await page.goto(`${origin}/app#invoices`)
    // The technician's free-text material is not in the price book: the office prices it.
    const ready = page.locator('li').filter({ hasText: customer })
    await send(page, ready.getByRole('button', { name: 'Prepare invoice' }), false)
    await ready.getByLabel('Unit price', { exact: true }).last().fill('95.00')
    await send(page, ready.getByRole('button', { name: 'Prepare invoice with these lines' }))
    await page.locator('tr').filter({ hasText: customer }).getByRole('button').click()
    // The business customer requires a purchase-order number before approval.
    await page.getByLabel('Purchase-order number', { exact: true }).fill(`PO-${tag}`)
    await send(page, page.getByRole('button', { name: /^Approve revision 1 at/ }))
    await expect(page.getByText(`Purchase order PO-${tag}`)).toBeVisible()
    await send(page, page.getByRole('button', { name: /^Export \d+ approved$/ }))
    await expect(page.getByRole('link', { name: 'Download CSV' }).first()).toBeVisible()
    await shot(page, width, 'invoices')
    await checkToday(page, customer, 'Invoiced')

    // CUST-001: find the customer by a phone fragment and by a street, then each property's history.
    await page.goto(`${origin}/app#customers`)
    const search = page.getByLabel('Search customers', { exact: true })
    await search.fill(`555-${phone4}`)
    await expect(page.locator('tr').filter({ hasText: customer })).toBeVisible()
    await search.fill(`Wharf Rd, Birchgrove NSW 2041 (${tag}`)
    await expect(page.locator('tr').filter({ hasText: customer })).toBeVisible()
    await search.fill(`No such street ${tag}`)
    await expect(page.getByText('No customer matches')).toBeVisible()
    await search.fill('Wharf Rd')
    await page.locator('tr').filter({ hasText: customer }).getByRole('button').click()
    const details = panel(page, customer)
    await expect(details.getByLabel('Billing contact', { exact: true })).toHaveValue('Ravi Patel')
    await expect(details.getByLabel('Accounts-payable email', { exact: true })).toHaveValue(`ap-${tag}@harbourview.example`)
    // MONEY-002: billing and service addresses stay apart through an edit and the customer export.
    await details.getByLabel('Contact person', { exact: true }).fill('Dr Mei Lin DDS')
    await send(page, details.getByRole('button', { name: 'Save changes' }))
    await expect(panel(page, customer).getByLabel('Billing address', { exact: true })).toHaveValue(`PO Box ${phone4}, Balmain NSW 2041`)
    const exported = await (await page.request.get(`${origin}/api/glove/customers.csv`)).text()
    const rows = exported.trim().split('\n').map(r => r.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')))
    const [head, mine] = [rows[0], rows.filter(r => r.includes(customer))]
    expect(mine.map(r => [r[head.indexOf('Billing address')], r[head.indexOf('Site address')]])).toEqual([[`PO Box ${phone4}, Balmain NSW 2041`, siteA], [`PO Box ${phone4}, Balmain NSW 2041`, siteB]])
    const sites = panel(page, 'Sites')
    await expect(sites.getByText('Site contact: Jo Front Desk')).toBeVisible()
    await expect(sites.getByText('Site contact: Sam Practice Manager')).toBeVisible()
    await sites.getByRole('button', { name: `History at ${siteA}` }).click()
    let history = page.getByRole('region', { name: `History at ${siteA}` })
    for (const entry of ['Request (phone): Surgery 2 split system blowing warm air', 'Split system service', 'Isolate power: done', 'Photo', 'Filters heavily clogged', 'Completed: Cleaned filters and coil', 'INV-', 'AC condenser Trane']) await expect(history.getByText(entry).first()).toBeVisible()
    await shot(page, width, 'customer-history')
    await sites.getByRole('button', { name: `History at ${siteB}` }).click()
    history = page.getByRole('region', { name: `History at ${siteB}` })
    await expect(history.getByText('Furnace Carrier')).toBeVisible()
    await expect(history.getByText('Split system service')).toHaveCount(0)

    // BOOK-005: a service call straight from the customer record, with a price-book fee line and no quote.
    const call = page.getByRole('form', { name: 'New service call' })
    await call.getByLabel('Service call site', { exact: true }).selectOption({ label: siteB })
    await call.getByLabel('What the call is for', { exact: true }).fill('Water heater leaking')
    await call.getByRole('button', { name: 'Add a fee line' }).click()
    await call.getByLabel('From the price book', { exact: true }).selectOption({ label: `${code} · Split system service` })
    await send(page, call.getByRole('button', { name: 'Create service call' }))
    await page.waitForURL(url => url.hash.startsWith('#jobs/'))
    await expect(page.getByRole('heading', { name: /· Water heater leaking$/ })).toBeVisible()
    await expect(page.getByText('Service call without a quote · prices are approved on its invoice')).toBeVisible()
    await expect(page.getByText(/created as a service call without a quote by .* with Split system service; no price is approved until its invoice is/)).toBeVisible()
    await shot(page, width, 'service-call')

    // Move in from ServiceM8: preview, then commit exactly that preview.
    await page.goto(`${origin}/app#move-in`)
    const files = await Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, mimeType: 'application/json', buffer: await readFile(`${fixture}${kind}.json`) })))
    await page.getByLabel('Export files', { exact: true }).setInputFiles(files)
    await send(page, page.getByRole('button', { name: 'Preview', exact: true }))
    await expect(page.getByRole('heading', { name: /Attachments not included/ }).first()).toBeVisible()
    await send(page, page.getByRole('button', { name: 'Commit exactly this preview' }))
    await expect(page.getByText('Committed').first()).toBeVisible()
    await shot(page, width, 'move-in')

    await page.goto(`${origin}/app#activity`)
    await expect(page.getByRole('heading', { name: 'Approvals' })).toBeVisible()
    await shot(page, width, 'activity')
    await desk.close()
  })
}
