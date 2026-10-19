import { test, expect, type Page, type Locator, type Browser } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

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
// STOCK-001: the office sets up the technician's van and restocks it; a
// material used on the phone comes off the van, which then shows low.

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
  await expect(tile('Booked today').locator('.tile-figure')).toHaveText(dollars(accepted.reduce((n: number, q: any) => n + cents(q.revisions.find((r: any) => r.n === q.acceptance.revision).totals.total), 0)))
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
