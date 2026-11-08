# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fresh-install.spec.ts >> DATA-004 fresh local installation completes service work as four separately signed-in people
- Location: tests/browser/fresh-install.spec.ts:48:1

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://127.0.0.1:57986/api/glove/commands
    - user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - origin: http://127.0.0.1:57986
    - content-type: application/json
    - content-length: 364
[private request headers omitted]

```

# Test source

```ts
  64  |       await owner.waitForURL(url => url.pathname === '/app')
  65  |     }
  66  |     const initial = await state(owner)
  67  |     expect(initial.business).toEqual([])
  68  |     expect(initial.jobs).toEqual([])
  69  |     expect(initial.operators).toHaveLength(1)
  70  |     const ownerActor = identity(initial.actor)
  71  |     expect(ownerActor.role).toBe('owner')
  72  | 
  73  |     await owner.goto(`${origin}/app#team`)
  74  |     let form = panel(owner, 'Set up your business')
  75  |     await form.getByLabel('Business name', { exact: true }).fill('Synthetic Glove service company')
  76  |     await form.getByLabel('Tax ID (EIN)', { exact: true }).fill('12-3456789')
  77  |     await form.getByLabel('Billing currency', { exact: true }).selectOption('USD')
  78  |     await form.getByLabel('Timezone for bookings', { exact: true }).selectOption('America/New_York')
  79  |     await form.getByLabel('Invoice payment terms (days)', { exact: true }).fill('14')
  80  |     await send(owner, form.getByRole('button', { name: 'Save business' }))
  81  |     form = panel(owner, 'Add to the price book')
  82  |     await form.getByLabel('Code', { exact: true }).fill('synthetic-glove-126')
  83  |     await form.getByLabel('Name', { exact: true }).fill('Maintenance inspection')
  84  |     await form.getByLabel('Price before tax', { exact: true }).fill('200.00')
  85  |     await form.getByLabel('Checklist, one item per line', { exact: true }).fill('*Isolate power\n*Clean filter\nCheck noise')
  86  |     await send(owner, form.getByRole('button', { name: 'Add to price book' }))
  87  | 
  88  |     // The owner invites and assigns each person; local sign-in accepts that
  89  |     // person's actual invitation. Native member status grants no desk role.
  90  |     for (const role of ['dispatcher', 'technician', 'office']) {
  91  |       form = panel(owner, 'Invite someone')
  92  |       await form.getByLabel('Name', { exact: true }).fill(`Synthetic ${role}`)
  93  |       await form.getByLabel('Email', { exact: true }).fill(mailbox(role))
  94  |       await form.getByLabel('Role', { exact: true }).selectOption(role)
  95  |       await send(owner, form.getByRole('button', { name: 'Send invitation' }))
  96  |     }
  97  |     const dispatcher = await localSignIn(browser, 'dispatcher', key)
  98  |     const technician = await localSignIn(browser, 'technician', key)
  99  |     const office = await localSignIn(browser, 'office', key)
  100 |     contexts.push(dispatcher.context, technician.context, office.context)
  101 |     const d = dispatcher.page, phone = technician.page, o = office.page
  102 |     const actors = { owner: ownerActor, dispatcher: identity((await state(d)).actor), technician: identity((await state(phone)).actor), office: identity((await state(o)).actor) }
  103 |     expect(new Set(Object.values(actors).map(a => a.id)).size).toBe(4)
  104 |     for (const role of ['dispatcher', 'technician', 'office'] as const) expect(actors[role]).toEqual({ id: expect.any(String), name: `Synthetic ${role}`, role })
  105 |     await owner.reload()
  106 |     form = panel(owner, 'Add a technician')
  107 |     await form.getByLabel('Name on the board', { exact: true }).fill('Synthetic technician')
  108 |     await form.getByLabel('Signs in as (optional)', { exact: true }).selectOption(actors.technician.id)
  109 |     await send(owner, form.getByRole('button', { name: 'Add technician' }))
  110 |     await proof(owner, 'settings')
  111 | 
  112 |     // The dispatcher performs intake, price approval and the customer's
  113 |     // recorded answer in their own session, then creates and books the job.
  114 |     await d.goto(`${origin}/app#customers`)
  115 |     await d.getByRole('button', { name: 'New customer', exact: true }).click()
  116 |     form = panel(d, 'New customer')
  117 |     await form.getByLabel('Name', { exact: true }).fill('Synthetic Glove customer')
  118 |     await form.getByLabel('Contact person', { exact: true }).fill('Synthetic customer')
  119 |     await form.getByLabel('Phone', { exact: true }).fill('212-555-0126')
  120 |     await form.getByLabel('Billing address', { exact: true }).fill('PO Box 126')
  121 |     await send(d, form.getByRole('button', { name: 'Add customer' }))
  122 |     form = panel(d, 'Sites')
  123 |     await form.getByLabel('Site address', { exact: true }).fill('126 Synthetic Street')
  124 |     await send(d, form.getByRole('button', { name: 'Add site' }))
  125 |     await d.goto(`${origin}/app#quotes`)
  126 |     form = panel(d, 'Record a request')
  127 |     await form.getByLabel('Customer', { exact: true }).selectOption({ label: 'Synthetic Glove customer' })
  128 |     await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
  129 |     await form.getByLabel('What the customer needs', { exact: true }).fill('Annual filter maintenance')
  130 |     await send(d, form.getByRole('button', { name: 'Record request' }))
  131 |     await d.locator('li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Quote it', exact: true }).click()
  132 |     form = panel(d, 'Quote for Synthetic Glove customer')
  133 |     await form.getByLabel('Site', { exact: true }).selectOption({ index: 1 })
  134 |     await form.getByLabel('Title', { exact: true }).fill('Synthetic maintenance visit')
  135 |     await form.getByLabel('From the price book', { exact: true }).selectOption({ label: 'synthetic-glove-126 · Maintenance inspection' })
  136 |     await send(d, form.getByRole('button', { name: 'Save draft' }))
  137 |     await send(d, d.getByRole('button', { name: /^Approve revision 1 at/ }))
  138 |     await send(d, d.getByRole('button', { name: 'Record as sent', exact: true }))
  139 |     await send(d, d.getByRole('button', { name: 'Record acceptance', exact: true }))
  140 |     await proof(d, 'quote', () => d.getByRole('button', { name: / · Synthetic maintenance visit$/, exact: true }).click())
  141 |     await d.goto(`${origin}/app#dispatch`)
  142 |     await send(d, d.locator('.queue li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Create job', exact: true }))
  143 |     await d.locator('.queue li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Book a visit', exact: true }).click()
  144 |     // Choose a future Monday once. No expectation depends on a wall-clock
  145 |     // midnight, a current time of day or the server's local date.
  146 |     const nextMonday = new Date(Date.now() + 7 * 86400000)
  147 |     nextMonday.setUTCDate(nextMonday.getUTCDate() + (8 - nextMonday.getUTCDay()) % 7)
  148 |     const day = nextMonday.toISOString().slice(0, 10)
  149 |     form = panel(d, 'Book a visit')
  150 |     await form.getByLabel('Technician', { exact: true }).selectOption({ label: 'Synthetic technician' })
  151 |     await form.getByLabel('Date', { exact: true }).fill(day)
  152 |     await form.getByLabel('Starts', { exact: true }).fill('09:00')
  153 |     await form.getByLabel('Ends', { exact: true }).fill('10:00')
  154 |     await send(d, form.getByRole('button', { name: 'Book visit', exact: true }))
  155 |     const booked = await state(owner), job = booked.jobs[0], visit = booked.visits[0], tech = booked.technicians[0]
  156 |     expect(booked.jobs).toHaveLength(1)
  157 |     expect(booked.visits).toHaveLength(1)
  158 |     await proof(d, 'dispatch')
  159 | 
  160 |     // Recurring maintenance is a separate open job so completing and billing
  161 |     // today's one-off work cannot accidentally close its future series.
  162 |     // These are ordinary commands from the dispatcher's real native session.
  163 |     async function command(page: Page, type: string, payload: object, code?: string) {
> 164 |       const response = await page.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type, payload } })
      |                                           ^ Error: apiRequestContext.post: read ECONNRESET
  165 |       const body = await response.json()
  166 |       if (code) { expect(response.status()).toBe(403); expect(body.error.code).toBe(code); expect(body.ok).toBe(false) }
  167 |       else expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  168 |       return body.result
  169 |     }
  170 |     const maintenance = await command(d, 'job.create', { customerId: job.customerId, siteId: job.siteId, title: 'Synthetic recurring maintenance', lines: [{ serviceId: booked.services[0].id, description: 'Maintenance inspection', quantity: '1', unitPrice: '200.00' }] })
  171 |     await d.goto(`${origin}/app#jobs`)
  172 |     await d.getByRole('button', { name: `${maintenance.number} · Synthetic recurring maintenance`, exact: true }).click()
  173 |     const repeat = d.getByRole('form', { name: 'Repeat this job', exact: true })
  174 |     const seriesFrom = new Date(`${day}T00:00:00Z`)
  175 |     seriesFrom.setUTCDate(seriesFrom.getUTCDate() + 7)
  176 |     const seriesUntil = new Date(seriesFrom)
  177 |     seriesUntil.setUTCDate(seriesUntil.getUTCDate() + 14)
  178 |     const dates = [0, 7, 14].map(offset => new Date(seriesFrom.getTime() + offset * 86400000).toISOString().slice(0, 10))
  179 |     await repeat.getByLabel('First visit', { exact: true }).fill(dates[0])
  180 |     await repeat.getByLabel('Repeats', { exact: true }).selectOption('week')
  181 |     await repeat.getByLabel('Every how many', { exact: true }).fill('1')
  182 |     await repeat.getByLabel('Start', { exact: true }).fill('13:00')
  183 |     await repeat.getByLabel('End', { exact: true }).fill('14:00')
  184 |     await repeat.getByLabel('Technician', { exact: true }).selectOption(tech.id)
  185 |     await repeat.getByLabel('Ends on (optional)', { exact: true }).fill(dates[2])
  186 |     await send(d, repeat.getByRole('button', { name: 'Make it repeat', exact: true }))
  187 |     await d.goto(`${origin}/app#jobs/${maintenance.id}`)
  188 |     await proof(d, 'series')
  189 | 
  190 |     // A real disconnected phone queues the visit's evidence and completion.
  191 |     // The independent owner session sees no arrival until reconnection.
  192 |     await phone.goto(`${origin}/app`)
  193 |     await phone.getByRole('button', { name: new RegExp(`${job.number} · Synthetic maintenance visit`) }).click()
  194 |     const phoneTime = new Date('2026-11-01T09:00:00.000Z')
  195 |     // Keep device timestamps exact while timers continue to drive the offline queue.
  196 |     await phone.clock.setFixedTime(phoneTime)
  197 |     await technician.context.setOffline(true)
  198 |     await phone.getByRole('button', { name: 'Record arrival', exact: true }).click()
  199 |     await phone.getByLabel('Isolate power', { exact: true }).check()
  200 |     await phone.getByLabel('Clean filter', { exact: true }).check()
  201 |     await phone.getByLabel('Note', { exact: true }).fill('Filter cleaned; airflow restored')
  202 |     await phone.getByRole('button', { name: 'Add note', exact: true }).click()
  203 |     await phone.getByRole('button', { name: 'Complete visit', exact: true }).click()
  204 |     await phone.getByLabel('Work done', { exact: true }).fill('Completed the annual filter service')
  205 |     await phone.getByLabel('The customer is not here to sign', { exact: true }).check()
  206 |     await phone.getByLabel('Why there is no sign-off', { exact: true }).fill('Customer at work; office holds access permission')
  207 |     await phone.getByRole('button', { name: 'Save completion', exact: true }).click()
  208 |     await expect(phone.getByText('Offline — 5 items waiting to send.', { exact: true })).toBeVisible()
  209 |     const disconnected = await state(owner)
  210 |     expect(disconnected.visits.find((v: any) => v.id === visit.id)).toMatchObject({ status: 'booked', arrival: null, completion: null })
  211 |     expect(disconnected.captures).toEqual([])
  212 |     if (process.env.GLOVE_SCREENSHOTS) await phone.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, '390-fresh-phone-offline.png'), fullPage: true })
  213 |     await technician.context.setOffline(false)
  214 |     await expect(phone.getByText(/waiting to send|Sending/)).toHaveCount(0, { timeout: 30_000 })
  215 |     await expect.poll(async () => (await state(owner)).visits.find((v: any) => v.id === visit.id)?.status).toBe('completed')
  216 | 
  217 |     // Office prepares, approves, records a customer's check and exports once.
  218 |     await o.goto(`${origin}/app#invoices`)
  219 |     await send(o, o.locator('li').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button', { name: 'Prepare invoice', exact: true }))
  220 |     await o.locator('tr').filter({ hasText: 'Synthetic Glove customer' }).getByRole('button').click()
  221 |     await send(o, o.getByRole('button', { name: /^Approve revision 1 at/ }))
  222 |     await o.getByLabel('Payment amount', { exact: true }).fill('200.00')
  223 |     await o.getByLabel('Payment method', { exact: true }).selectOption('check')
  224 |     await o.getByLabel('Receipt or check reference', { exact: true }).fill('synthetic-glove-check-126')
  225 |     await send(o, o.getByRole('button', { name: 'Record payment', exact: true }))
  226 |     await expect(o.getByText('Amount due $0.00', { exact: true })).toBeVisible()
  227 |     await send(o, o.getByRole('button', { name: 'Export 1 approved', exact: true }))
  228 |     const invoiceCsv = await (await o.request.get(`${origin}${await o.getByRole('link', { name: 'Download CSV', exact: true }).getAttribute('href')}`)).text()
  229 |     expect(invoiceCsv).toContain('Synthetic Glove customer')
  230 |     expect(invoiceCsv).toContain('200.00')
  231 |     const invoice = (await state(owner)).invoices[0]
  232 |     await o.goto(`${origin}/app#invoices/${invoice.id}`)
  233 |     await proof(o, 'invoice')
  234 |     const beforeRefusals = await state(owner)
  235 |     const stable = (s: any) => Object.fromEntries(['version', 'business', 'services', 'technicians', 'enquiries', 'quotes', 'jobs', 'visits', 'captures', 'invoices', 'payments', 'exports', 'approvals', 'events'].map(k => [k, s[k]]))
  236 |     // Each role attempts a valid operation belonging to someone else's role.
  237 |     await command(owner, 'visit.arrive', { visitId: visit.id, deviceTime: phoneTime.toISOString() }, 'FORBIDDEN')
  238 |     await command(d, 'invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, 'FORBIDDEN')
  239 |     await command(phone, 'payment.record', { invoiceId: invoice.id, version: invoice.version, amount: '200.00', method: 'check', reference: 'synthetic-glove-refused' }, 'FORBIDDEN')
  240 |     await command(o, 'service.save', { code: 'synthetic-glove-forbidden', name: 'Unauthorized price', unitPrice: '1.00' }, 'FORBIDDEN')
  241 |     expect(stable(await state(owner))).toEqual(stable(beforeRefusals))
  242 |     const noSecondExport = await o.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId: crypto.randomUUID(), type: 'invoice.export', payload: {} } })
  243 |     expect((await noSecondExport.json()).error.code).toBe('NOTHING_TO_EXPORT')
  244 |     expect(stable(await state(owner))).toEqual(stable(beforeRefusals))
  245 | 
  246 |     await owner.goto(`${origin}/app#activity`)
  247 |     // One set of business assertions, after all sessions and the owner page
  248 |     // reload. Screens of this same persisted result are captured at both widths.
  249 |     await Promise.all([owner.reload(), d.reload(), phone.reload(), o.reload()])
  250 |     const s = await state(owner)
  251 |     for (const [page, actor] of [[d, actors.dispatcher], [phone, actors.technician], [o, actors.office]] as const) expect(identity((await state(page)).actor)).toEqual(actor)
  252 |     await expect(o.getByText('Amount due $0.00', { exact: true })).toBeVisible()
  253 |     expect(s.business[0]).toMatchObject({ name: 'Synthetic Glove service company', abn: '12-3456789', currency: 'USD', timezone: 'America/New_York', paymentTermsDays: 14 })
  254 |     expect(s.services).toHaveLength(1)
  255 |     expect(s.services[0]).toMatchObject({ code: 'synthetic-glove-126', unitPrice: '200.00', createdBy: actors.owner.id, checklist: [{ label: 'Isolate power', required: true }, { label: 'Clean filter', required: true }, { label: 'Check noise', required: false }] })
  256 |     for (const role of ['dispatcher', 'technician', 'office'] as const) expect(s.operators.find((p: any) => p.id === actors[role].id)).toMatchObject({ name: actors[role].name, role, status: 'active' })
  257 |     expect(s.technicians[0]).toMatchObject({ operatorId: actors.technician.id, createdBy: actors.owner.id })
  258 |     expect(s.customers[0]).toMatchObject({ name: 'Synthetic Glove customer', contact: 'Synthetic customer', phone: '212-555-0126', billingAddress: 'PO Box 126', createdBy: actors.dispatcher.id })
  259 |     expect(s.sites[0]).toMatchObject({ customerId: s.customers[0].id, address: '126 Synthetic Street', createdBy: actors.dispatcher.id })
  260 |     expect(s.enquiries).toHaveLength(1)
  261 |     expect(s.enquiries[0]).toMatchObject({ description: 'Annual filter maintenance', status: 'won', createdBy: actors.dispatcher })
  262 |     const quote = s.quotes[0]
  263 |     expect(quote).toMatchObject({ status: 'accepted', jobId: job.id, acceptance: { revision: 1, customerName: 'Synthetic customer', method: 'phone', recordedBy: actors.dispatcher } })
  264 |     expect(quote.revisions[0]).toMatchObject({ preparedBy: actors.dispatcher, approval: actors.dispatcher, totals: { subtotal: '200.00', total: '200.00' } })
```