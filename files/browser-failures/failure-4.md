# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> MONEY-002 / BOOK-005 owner, dispatcher, technician and office journey at 1440px
- Location: tests/browser/journey.spec.ts:188:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Team and settings' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Team and settings' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Team and settings' })

```

```yaml
- main:
  - status: Loading your work…
```

# Test source

```ts
  133 |   const s = await records(page)
  134 |   const zone = s.business[0].timezone, local = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
  135 |   const date = local(new Date().toISOString())
  136 |   const jobIds = new Set(s.visits.filter((v: any) => v.status !== 'cancelled' && local(v.startAt) === date).map((v: any) => v.jobId))
  137 |   const todays = s.jobs.filter((j: any) => jobIds.has(j.id)), by = (state: string) => todays.filter((j: any) => j.status === state).length
  138 |   await expect(tile("Today's jobs").locator('.tile-figure')).toHaveText(count(todays.length, 'job'))
  139 |   await expect(tile("Today's jobs").getByText(`${by('open')} open · ${by('completed')} completed · ${by('invoiced')} invoiced`)).toBeVisible()
  140 |   const accepted = s.quotes.filter((q: any) => q.status === 'accepted' && q.acceptance?.at && local(q.acceptance.at) === date)
  141 |   await expect(tile('Booked today').locator('.tile-figure')).toHaveText(dollars(accepted.reduce((n: number, q: any) => n + cents((q.acceptance.totals ?? q.revisions.find((r: any) => r.n === q.acceptance.revision).totals).total), 0)))
  142 |   await expect(tile('Booked today').getByText(`${count(accepted.length, 'quote')} accepted today`)).toBeVisible()
  143 |   const open = s.quotes.filter((q: any) => ['draft', 'approved', 'sent'].includes(q.status))
  144 |   await expect(tile('Open quotes').locator('.tile-figure')).toHaveText(count(open.length, 'quote'))
  145 |   await expect(tile('Open quotes').getByText(`${dollars(open.reduce((n: number, q: any) => n + cents(q.revisions.at(-1).totals.total), 0))} waiting on an answer or a price`)).toBeVisible()
  146 |   const unbilled = s.jobs.filter((j: any) => j.status === 'completed')
  147 |   await expect(tile('Completed, not invoiced').locator('.tile-figure')).toHaveText(count(unbilled.length, 'job'))
  148 |   // COST-001: exactly the technicians with a shift clocked in and not out.
  149 |   const clocked = s.times.filter((x: any) => x.kind === 'shift' && !x.endAt).map((x: any) => s.technicians.find((t: any) => t.id === x.technicianId).name)
  150 |   await expect(tile('On the clock').locator('.tile-figure')).toHaveText(count(clocked.length, 'technician'))
  151 |   await expect(tile('On the clock').locator('li strong')).toHaveText(clocked)
  152 |   if (!customer) return clocked
  153 |   // The journey's job: booked today, so on the list in its state, and unbilled until its invoice is exported.
  154 |   const mine = s.jobs.find((j: any) => j.customerId === s.customers.find((c: any) => c.name === customer).id && j.title === 'Split system service')
  155 |   expect(jobIds.has(mine.id)).toBe(true)
  156 |   expect(accepted.some((q: any) => q.id === mine.quoteId)).toBe(true)
  157 |   await expect(tile("Today's jobs").locator('li').filter({ hasText: mine.number }).getByText(jobState, { exact: true })).toBeVisible()
  158 |   await expect(tile('Completed, not invoiced').locator('li').filter({ hasText: mine.number })).toHaveCount(jobState === 'Completed' ? 1 : 0)
  159 |   return clocked
  160 | }
  161 | 
  162 | /** COST-001: the open job's "Time on this job" shows each travel and on-job entry in its record, with the totals. */
  163 | async function checkJobTime(page: Page, title: string, customer: string) {
  164 |   const s = await records(page), hhmm = clock(s.business[0].timezone)
  165 |   const job = s.jobs.find((j: any) => j.title === title && j.customerId === s.customers.find((c: any) => c.name === customer).id)
  166 |   const entries = s.times.filter((x: any) => x.jobId === job.id)
  167 |   expect(entries.map((x: any) => x.kind).sort()).toEqual(['job', 'travel'])
  168 |   const region = page.getByRole('region', { name: 'Time on this job' })
  169 |   const total = (kind: string) => entries.filter((x: any) => x.kind === kind).reduce((n: number, x: any) => n + minutes(x.startAt, x.endAt), 0)
  170 |   await expect(region.getByText(`Travel ${total('travel')} min · On the job ${total('job')} min`)).toBeVisible()
  171 |   for (const x of entries) {
  172 |     const tech = s.technicians.find((t: any) => t.id === x.technicianId).name
  173 |     await expect(region.getByText(`${x.kind === 'travel' ? 'Travel' : 'On the job'} · ${tech} · ${ampm(hhmm(x.startAt))} – ${ampm(hhmm(x.endAt))} · ${minutes(x.startAt, x.endAt)} min`)).toBeVisible()
  174 |   }
  175 |   return { entries, hhmm, zone: s.business[0].timezone }
  176 | }
  177 | 
  178 | /** A phone signed in as a local dev persona: the checkout's key gate, then one-click entry. */
  179 | async function signInPersona(browser: Browser, persona: string, width: number, key: string | null) {
  180 |   const context = await browser.newContext({ viewport: { width, height: 900 } })
  181 |   const phone = await context.newPage()
  182 |   await phone.request.post(`${origin}/__dev/key`, { data: { key }, headers: { origin } })
  183 |   await phone.goto(`${origin}/auth/dev/enter?as=${persona}&returnTo=%2Fapp`)
  184 |   await phone.waitForURL(url => url.pathname === '/app')
  185 |   return { context, phone }
  186 | }
  187 | 
  188 | test('MONEY-002 / BOOK-005 owner, dispatcher, technician and office journey at 1440px', async ({ browser }) => {
  189 |   test.setTimeout(480_000)
  190 |   for (const width of [1440, 390]) {
  191 |     const entry = process.env.GLOVE_OPEN
  192 |     if (!entry) throw new Error('Set GLOVE_OPEN privately to rer dev’s owner-entry URL; this test needs a real local installation.')
  193 |     const desk = await browser.newContext({ viewport: { width, height: 1000 } })
  194 |     const page = await desk.newPage()
  195 |     await page.goto(`${origin}/`)
  196 |     await shot(page, width, 'lobby')
  197 |     await page.goto(`${origin}/signin`)
  198 |     await shot(page, width, 'signin')
  199 |     try {
  200 |       // Open the CLI link as a fresh navigation. The sign-in capture can
  201 |       // already be on /__dev/key, where changing only its fragment runs no script.
  202 |       await page.goto('about:blank')
  203 |       await page.goto(entry)
  204 |       await page.waitForURL(url => !url.hash.includes('rer-dev') && ['/app', '/setup'].includes(url.pathname))
  205 |     } catch { throw new Error('Owner entry failed; obtain a fresh local entry privately.') }
  206 |     if (new URL(page.url()).pathname === '/setup') {
  207 |       await shot(page, width, 'setup')
  208 |       await page.getByRole('checkbox').check()
  209 |       await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
  210 |       await page.waitForURL(url => url.pathname === '/app')
  211 |     }
  212 |     const key = new URLSearchParams(new URL(entry).hash.slice(1)).get('rer-dev')
  213 |     await page.request.post(`${origin}/__dev/key`, { data: { key }, headers: { origin } })
  214 |     const tag = crypto.randomUUID().slice(0, 6)
  215 |     const phone4 = String(1000 + Math.floor(Math.random() * 9000)), siteA = `14 Harbour St, Balmain NSW 2041 (${tag})`, siteB = `22 Wharf Rd, Birchgrove NSW 2041 (${tag})`
  216 |     const customer = `Harbourview Dental ${tag}`, techName = `Priya ${tag}`, inviteEmail = `tech-${tag}@example.test`, code = `SVC-${tag}`
  217 |     // The technician's phone signs in as a local dev persona (local mail is suppressed).
  218 |     const persona = width === 1440 ? 'member' : 'admin', techEmail = `${persona}@dev.localhost`
  219 | 
  220 |     // Keep this real-time journey on one business day. CI once crossed Sydney
  221 |     // midnight between booking and Today, correctly leaving the booked job on
  222 |     // yesterday's board. Use the supported zone farther from midnight so both
  223 |     // the real Worker and the browser keep today's visits and acceptances.
  224 |     const now = new Date()
  225 |     const distanceFromMidnight = (zone: string) => {
  226 |       const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(now))
  227 |       return Math.min(hour, 24 - hour)
  228 |     }
  229 |     const bookingZone = ['Australia/Sydney', 'America/New_York'].sort((a, b) => distanceFromMidnight(b) - distanceFromMidnight(a))[0]
  230 | 
  231 |     // Team: the business, a price book entry with its checklist, a technician who signs in.
  232 |     await page.goto(`${origin}/app#team`)
> 233 |     await expect(page.getByRole('heading', { name: 'Team and settings' })).toBeVisible()
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  234 |     const businessForm = panel(page, /^(Set up your business|Business)$/)
  235 |     if (await businessForm.getByRole('heading', { name: 'Set up your business', exact: true }).isVisible()) {
  236 |       await businessForm.getByLabel('Business name', { exact: true }).fill('Harbour Air & Electrical')
  237 |       await businessForm.getByLabel('Billing currency', { exact: true }).selectOption('AUD')
  238 |     }
  239 |     await businessForm.getByLabel('Timezone for bookings', { exact: true }).selectOption(bookingZone)
  240 |     await send(page, businessForm.getByRole('button', { name: 'Save business' }))
  241 |     let form = panel(page, 'Add to the price book')
  242 |     await form.getByLabel('Code', { exact: true }).fill(code)
  243 |     await form.getByLabel('Name', { exact: true }).fill('Split system service')
  244 |     await form.getByLabel('Price before tax', { exact: true }).fill('189.00')
  245 |     await form.getByLabel('Checklist, one item per line', { exact: true }).fill('*Isolate power\n*Clean filters\nTest run 10 minutes')
  246 |     await send(page, form.getByRole('button', { name: 'Add to price book' }))
  247 |     // FIELD-002: an inspection form with a conditional question and a reading range, attached to the service.
  248 |     const formName = `Inspection ${tag}`
  249 |     await page.getByRole('button', { name: 'New form' }).click()
  250 |     const builder = page.getByRole('form', { name: 'New form' }), question = (n: number) => builder.getByRole('group', { name: `Question ${n}` })
  251 |     await builder.getByLabel('Form name', { exact: true }).fill(formName)
  252 |     await question(1).getByLabel('Question', { exact: true }).fill('Unit running on arrival?')
  253 |     await question(1).getByLabel('Required', { exact: true }).check()
  254 |     await builder.getByRole('button', { name: 'Add question' }).click()
  255 |     await question(2).getByLabel('Question', { exact: true }).fill('Fault seen')
  256 |     await question(2).getByLabel('Answer type', { exact: true }).selectOption('choice')
  257 |     await question(2).getByLabel('Choices, separated by commas', { exact: true }).fill('No cooling, Noise')
  258 |     await question(2).getByLabel('Ask only when', { exact: true }).selectOption({ label: 'Unit running on arrival?' })
  259 |     await question(2).getByLabel('Has the answer', { exact: true }).selectOption('false')
  260 |     await builder.getByRole('button', { name: 'Add question' }).click()
  261 |     await question(3).getByLabel('Question', { exact: true }).fill('Suction pressure')
  262 |     await question(3).getByLabel('Answer type', { exact: true }).selectOption('reading')
  263 |     await question(3).getByLabel('Unit', { exact: true }).fill('psi')
  264 |     await question(3).getByLabel('Lowest in range', { exact: true }).fill('110')
  265 |     await question(3).getByLabel('Highest in range', { exact: true }).fill('140')
  266 |     await builder.getByLabel(`${code} · Split system service`, { exact: true }).check()
  267 |     await send(page, builder.getByRole('button', { name: 'Save form' }))
  268 |     await expect(page.getByRole('region', { name: 'Forms and inspections' }).getByText(formName, { exact: true })).toBeVisible()
  269 |     // MONEY-002: EIN, two contractor licenses and a logo on the business record, kept through a reload.
  270 |     form = panel(page, /^Business$/)
  271 |     await form.getByLabel('Tax ID (EIN)', { exact: true }).fill('12-3456789')
  272 |     for (let n = await form.getByRole('group', { name: /^License \d+$/ }).count(); n < 2; n++) await form.getByRole('button', { name: 'Add a license' }).click()
  273 |     for (const [n, trade, number] of [[1, 'HVAC', `TACLA${phone4}C`], [2, 'Electrical', `TECL${phone4}`]]) {
  274 |       const license = form.getByRole('group', { name: `License ${n}`, exact: true })
  275 |       await license.getByLabel('Trade', { exact: true }).fill(String(trade))
  276 |       await license.getByLabel('State', { exact: true }).fill('TX')
  277 |       await license.getByLabel('License number', { exact: true }).fill(String(number))
  278 |     }
  279 |     const logo = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 40; const x = c.getContext('2d')!; x.fillStyle = '#e8743b'; x.fillRect(0, 0, 80, 40); return c.toDataURL('image/png').split(',')[1] })
  280 |     await form.getByLabel('Logo', { exact: true }).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(logo, 'base64') })
  281 |     await send(page, form.getByRole('button', { name: 'Save business' }))
  282 |     await page.reload()
  283 |     // MONEY-002: saving other settings leaves every omitted identity field intact.
  284 |     const savedBusiness = (await records(page)).business[0]
  285 |     const identitySave = await page.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type: 'business.save', payload: { name: savedBusiness.name, timezone: savedBusiness.timezone, version: savedBusiness.version } } })
  286 |     expect((await identitySave.json()).ok).toBe(true)
  287 |     await page.reload()
  288 |     form = panel(page, /^Business$/)
  289 |     await expect(form.getByLabel('Tax ID (EIN)', { exact: true })).toHaveValue('12-3456789')
  290 |     await expect(form.getByRole('group', { name: 'License 1', exact: true }).getByLabel('License number', { exact: true })).toHaveValue(`TACLA${phone4}C`)
  291 |     await expect(form.getByRole('group', { name: 'License 2', exact: true }).getByLabel('License number', { exact: true })).toHaveValue(`TECL${phone4}`)
  292 |     await expect(form.getByRole('img', { name: 'Business logo' })).toBeVisible()
  293 |     expect((await page.request.get(`${origin}${await form.getByRole('img', { name: 'Business logo' }).getAttribute('src')}`)).headers()['content-type']).toBe('image/png')
  294 |     await shot(page, width, 'business-identity')
  295 |     form = panel(page, 'Invite someone')
  296 |     await form.getByLabel('Name', { exact: true }).fill(`Casey ${tag}`)
  297 |     await form.getByLabel('Email', { exact: true }).fill(inviteEmail)
  298 |     await form.getByLabel('Role', { exact: true }).selectOption('office')
  299 |     await send(page, form.getByRole('button', { name: 'Send invitation' }))
  300 |     await expect(page.getByText(inviteEmail)).toBeVisible()
  301 |     const { context: phoneContext, phone } = await signInPersona(browser, persona, width, key)
  302 |     await page.reload()
  303 |     const techOperator = page.locator('tr').filter({ hasText: techEmail })
  304 |     const roleSet = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  305 |     await techOperator.getByRole('combobox', { name: /^Role for / }).selectOption('technician')
  306 |     expect((await (await roleSet).json()).ok).toBe(true)
  307 |     form = panel(page, 'Add a technician')
  308 |     await form.getByLabel('Name on the board', { exact: true }).fill(techName)
  309 |     const signsInAs = form.getByLabel('Signs in as (optional)', { exact: true })
  310 |     await signsInAs.selectOption(await signsInAs.locator('option', { hasText: techEmail }).getAttribute('value') ?? '')
  311 |     await send(page, form.getByRole('button', { name: 'Add technician' }))
  312 |     await shot(page, width, 'team')
  313 | 
  314 |     // Customers and the site.
  315 |     await page.goto(`${origin}/app#customers`)
  316 |     await page.getByRole('button', { name: 'New customer' }).click()
  317 |     form = panel(page, 'New customer')
  318 |     await form.getByLabel('Name', { exact: true }).fill(customer)
  319 |     await form.getByLabel('Contact person', { exact: true }).fill('Dr Mei Lin')
  320 |     await form.getByLabel('Email for quotes and invoices', { exact: true }).fill(`accounts-${tag}@harbourview.example`)
  321 |     await form.getByLabel('Phone', { exact: true }).fill(`(212) 555-${phone4}`)
  322 |     await form.getByLabel('Billing address', { exact: true }).fill(`PO Box ${phone4}, Balmain NSW 2041`)
  323 |     await form.getByLabel('Customer type', { exact: true }).selectOption('business')
  324 |     await form.getByLabel('Billing contact', { exact: true }).fill('Ravi Patel')
  325 |     await form.getByLabel('Accounts-payable email', { exact: true }).fill(`ap-${tag}@harbourview.example`)
  326 |     await form.getByLabel('Requires a purchase-order number on invoices').check()
  327 |     await form.getByLabel('Other contacts', { exact: true }).fill('Ravi Patel, accounts payable, , ap@harbourview.example')
  328 |     await send(page, form.getByRole('button', { name: 'Add customer' }))
  329 |     form = panel(page, 'Sites')
  330 |     for (const [address, contact] of [[siteA, 'Jo Front Desk'], [siteB, 'Sam Practice Manager']]) {
  331 |       await form.getByLabel('Site address', { exact: true }).fill(address)
  332 |       await form.getByLabel('Access notes (optional)', { exact: true }).fill('Gate code at reception')
  333 |       await form.getByLabel('Site contact (optional)', { exact: true }).fill(contact)
```