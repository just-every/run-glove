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
    let form = panel(page, 'Add a service')
    await form.getByLabel('Code', { exact: true }).fill(code)
    await form.getByLabel('Name', { exact: true }).fill('Split system service')
    await form.getByLabel('Price before tax', { exact: true }).fill('189.00')
    await form.getByLabel('Checklist, one item per line', { exact: true }).fill('*Isolate power\n*Clean filters\nTest run 10 minutes')
    await send(page, form.getByRole('button', { name: 'Add service' }))
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

    // The technician's phone, through a connectivity interruption.
    await phone.goto(`${origin}/app`)
    await expect(phone.getByRole('heading', { name: 'Your visits' })).toBeVisible()
    await phone.getByRole('button', { name: /09:00–10:30/ }).click()
    await phone.getByRole('button', { name: 'Record arrival' }).click()
    await expect(phone.getByText(/Arrival recorded at/)).toBeVisible()
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
    await phoneContext.close()

    // The job record: evidence, sign-off and timeline.
    await page.goto(`${origin}/app#jobs`)
    await page.locator('tr').filter({ hasText: customer }).getByRole('button').click()
    await expect(page.getByRole('heading', { name: 'Field evidence' })).toBeVisible()
    await expect(page.getByRole('img', { name: 'Signature of Dr Mei Lin' })).toBeVisible()
    await expect(page.getByText(/completed the visit — signed off by Dr Mei Lin/)).toBeVisible()
    await shot(page, width, 'jobs')

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
