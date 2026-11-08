import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker, D1, native sessions and public HTTP doors.
import { installation, postEvents } from '../api/harness.mjs'
// @ts-expect-error Existing mail provider network boundary.
import { connectMail, receipt } from '../fixtures/mail-providers.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function screens(page: Page, name: string, anchor: Locator) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await anchor.scrollIntoViewIfNeeded()
    await anchor.evaluate(el => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 80)))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) {
      await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
      await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-due-${name}.png`) })
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 })
}

async function screensAtWidth(page: Page, name: string, anchor: Locator, width: number) {
  await anchor.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-due-${name}.png`) })
  }
}

test('BOOK-002, BOOK-011, BOOK-012, BOOK-013 / PLAN-004, PLAN-007, PLAN-008, PLAN-009, PLAN-010, PLAN-011 / AGENT-008, AGENT-016 Office batch books due visits, records declines and outside sends, the customer chooses an offered slot, the owner follows the brief, and Agent prepares source-linked maintenance flags at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2030-01-02T02:00:00Z' })
  try {
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'TUNE', name: 'AC tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
    const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [] })
    const person = await h.person('Luis Ortega Browser', 'technician')
    await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
    const today = '2030-01-01'
    const d = new Date(`${today}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 7); const startDate = d.toISOString().slice(0, 10)
    const members: any[] = []
    for (const [i, name] of ['Ellen Brooks', 'Rosa Diaz', 'Lee Park'].entries()) {
      const customer = await h.command('customer.save', { name })
      const site = await h.command('site.save', { customerId: customer.id, address: `${10 + i} Service St, Austin TX ${i < 2 ? '78704' : '78701'}`, zip: i < 2 ? '78704' : '78701' })
      const agreement = await h.command('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: i === 2 ? '2029-07-01' : startDate })
      members.push({ customer, site, agreement })
    }
    const office = await h.person('Booking Office Browser', 'office')
    let as = office.cookie
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setViewportSize({ width: 1440, height: 1050 })
    // Keep the screen's default date aligned with the production API fixture clock.
    await page.clock.setFixedTime(new Date('2030-01-02T02:00:00Z'))
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), as: url.pathname === '/api/glove/public/booking' ? '' : as, headers: req.headers()['authorization'] ? { authorization: req.headers()['authorization'] } : {}, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await interruptedBatch(page, h, office, person, cookie => { as = cookie })
      await page.goto(`${origin}/app#dispatch`)
      const panel = page.getByRole('region', { name: 'Due agreement visits', exact: true })
      await expect(panel.getByRole('status')).toHaveText('6 included visits due in this range')
      await screens(page, 'outstanding', panel)
      await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78704')
      await expect(panel.getByRole('status')).toHaveText('4 included visits due in this range')
      await panel.getByLabel('Season from (optional)', { exact: true }).fill(startDate)
      await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
      await panel.getByLabel('Batch technician', { exact: true }).selectOption({ label: 'Luis Ortega' })
      await panel.getByLabel('First visit starts', { exact: true }).fill('09:00')
      await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
      await expect(panel.getByLabel('Batch results').getByRole('listitem')).toHaveCount(4)
      await expect(panel.locator('ul.rows > li').filter({ hasText: 'Booked, awaiting completion' })).toHaveCount(4)
      expect((await h.request('/api/glove/due-visits?area=78704').then(r => r.json())).visits.filter((v: any) => v.booked)).toHaveLength(4)
      await expect(panel.getByRole('status')).toHaveText('4 included visits due in this range')
      await screens(page, 'booked', panel)
      await screens(page, 'batch-form', panel.getByRole('form', { name: 'Batch book included visits', exact: true }))
      await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78701')
      await expect(panel.getByRole('status')).toHaveText('2 included visits due in this range')
      await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
      await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
      await expect(panel.getByLabel('Batch results')).toContainText('not booked; Review these dispatch conflicts')
      await expect(panel.getByRole('status')).toHaveText('2 included visits due in this range')
      await screens(page, 'refused', panel)
      await screens(page, 'refused-results', panel.getByLabel('Batch results'))
      // PLAN-004: the customer's explicit decline of one included visit removes only that visit.
      const row = panel.locator('ul.rows > li').first()
      await row.getByText('Record customer decline', { exact: true }).click()
      const decline = row.getByRole('form', { name: 'Record Lee Park decline of visit 1', exact: true })
      await decline.getByLabel('How they declined', { exact: true }).selectOption('email reply')
      await decline.getByLabel('Their reason', { exact: true }).fill('Replacing the system this year')
      await screens(page, 'decline-form', decline)
      await decline.getByRole('button', { name: 'Record decline', exact: true }).click()
      await expect(panel.getByRole('status')).toHaveText('1 included visits due in this range')
      const [lee] = (await h.request('/api/glove/agreements').then(r => r.json())).agreements.filter((a: any) => a.declines?.length)
      expect(lee.declines.map((d: any) => [d.index, d.method, d.customerName, d.recordedBy.role])).toEqual([[0, 'email reply', 'Lee Park', 'office']])
      // The office offers actual future slots on Lee's remaining included visit.
      const offers = row.getByRole('region', { name: 'Booking offers for Lee Park visit 2', exact: true })
      await offers.getByText('Offer customer times', { exact: true }).click()
      const form = offers.getByRole('form', { name: 'Offer times to Lee Park', exact: true })
      await form.getByLabel('Offer technician', { exact: true }).selectOption({ label: 'Luis Ortega' })
      const future = '2030-01-08'
      await form.getByLabel('Offer date', { exact: true }).fill(future)
      await form.getByRole('button', { name: 'Add another time', exact: true }).click()
      await screens(page, 'offer-form', form)
      await form.getByRole('button', { name: 'Create booking link', exact: true }).click()
      const bookingUrl = await offers.getByLabel('Booking link (shown once)', { exact: true }).inputValue()
      expect(bookingUrl).toContain('/book#token=')
      await offers.getByRole('button', { name: 'Record as sent outside Glove', exact: true }).click()
      await expect(offers).toContainText('Recorded as sent outside Glove by Booking Office Browser (email); delivery not verified.')
      await screens(page, 'offer-shared', offers)
      await screens(page, 'offer-send-controls', offers.getByRole('form', { name: 'Record outside send', exact: true }))
      await page.goto(bookingUrl)
      const customerPage = page.getByRole('region', { name: 'Choose an included visit', exact: true })
      await expect(customerPage.getByRole('button', { name: 'Book', exact: false })).toHaveCount(2)
      await screens(page, 'customer-choices', customerPage)
      // The first choice is taken after the customer has seen the page.
      const [leeRemaining] = (await h.request('/api/glove/due-visits?area=78701').then(r => r.json())).visits
      const busyJob = await h.command('job.create', { customerId: leeRemaining.customerId, siteId: leeRemaining.siteId, title: 'Emergency repair' })
      const technician = (await h.state()).technicians[0]
      await h.command('visit.book', { jobId: busyJob.id, technicianId: technician.id, date: future, start: '09:00', end: '09:30' })
      await customerPage.getByRole('button', { name: 'Book 9:00 AM – 9:30 AM', exact: true }).click()
      await expect(customerPage.getByRole('alert')).toContainText('no longer available')
      await expect(customerPage.getByRole('button', { name: 'Book', exact: false })).toHaveCount(1)
      await screens(page, 'customer-slot-taken', customerPage)
      // With every offer now taken the customer sees an honest empty state;
      // cancelling the competing booking makes the remaining offer usable again.
      const competing = await h.command('visit.book', { jobId: busyJob.id, technicianId: technician.id, date: future, start: '10:00', end: '10:30' })
      await customerPage.getByRole('button', { name: 'Book 10:00 AM – 10:30 AM', exact: true }).click()
      await expect(customerPage.getByRole('button')).toHaveCount(0)
      await expect(customerPage).toContainText('No offered times are available now')
      await screens(page, 'customer-no-times', customerPage)
      await h.command('visit.cancel', { visitId: competing.id, version: competing.version, reason: 'Emergency repaired sooner' })
      await page.reload()
      await customerPage.getByRole('button', { name: 'Book 10:00 AM – 10:30 AM', exact: true }).click()
      await expect(customerPage.getByRole('heading', { name: 'Your visit is booked', exact: true })).toBeVisible()
      await screens(page, 'customer-booked', customerPage)
      await page.reload()
      await expect(customerPage.getByRole('alert')).toContainText('unavailable')
      await screens(page, 'customer-used', customerPage)
      await page.goto(`${origin}/app#dispatch`)
      const used = page.getByRole('region', { name: 'Booking offers for Lee Park visit 2', exact: true })
      await expect(used).toContainText('Used · booked by customer')
      await screens(page, 'office-booked', used)
      // The used link itself can no longer book; no extra entitlement is manufactured.
      expect((await h.state()).visits.filter((v: any) => v.jobId === leeRemaining.jobId)).toHaveLength(1)
      // PLAN-007: completed and explicitly declined work disappear; cancelled
      // bookings stay due, and tomorrow's native entitlements are not due yet.
      as = h.owner()
      const domain = await h.state()
      const completedJob = domain.jobs.find((j: any) => j.agreementId === members[0].agreement.id && j.agreementVisitIndex === 1)
      const completedVisit = domain.visits.find((v: any) => v.jobId === completedJob.id)
      await person.run('visit.arrive', { visitId: completedVisit.id, deviceTime: completedVisit.startAt })
      await person.run('visit.complete', { visitId: completedVisit.id, deviceTime: completedVisit.endAt, summary: 'Seasonal maintenance complete', signoff: { absentReason: 'Customer away' } })
      const cancelledJob = domain.jobs.find((j: any) => j.agreementId === members[1].agreement.id && j.agreementVisitIndex === 1)
      const cancelledVisit = domain.visits.find((v: any) => v.jobId === cancelledJob.id)
      await h.command('visit.cancel', { visitId: cancelledVisit.id, version: cancelledVisit.version, reason: 'Customer needs another day' })
      const futureCustomer = await h.command('customer.save', { name: 'Alex Rivera' })
      const futureSite = await h.command('site.save', { customerId: futureCustomer.id, address: '14 Service Street', zip: '78704' })
      await h.command('agreement.sell', { customerId: futureCustomer.id, siteId: futureSite.id, planId: plan.id, via: 'phone', startDate: '2030-01-02' })
      const expected = [
        { member: members[0], index: 0, due: '2029-06-01', booked: true, left: 1 },
        { member: members[1], index: 0, due: '2029-06-01', booked: true, left: 2 },
        { member: members[1], index: 1, due: '2029-12-01', booked: false, left: 2 },
        { member: members[2], index: 1, due: '2030-01-01', booked: true, left: 1 },
      ]
      await h.restart()
      const beforeReads = await h.state()
      const brief = page.getByRole('region', { name: 'Morning brief', exact: true })
      const dueBrief = brief.getByRole('region', { name: 'Agreement visits due', exact: true })
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1050 })
        for (const [i, item] of expected.entries()) {
          await page.goto(`${origin}/app#today`)
          await expect(page.locator('.tile').filter({ has: page.locator('#tile-agreements') })).toContainText('4 visits')
          await expect(dueBrief.getByRole('listitem')).toHaveCount(4)
          const text = `${item.member.customer.name}: Comfort Club visit due ${item.due}${item.booked ? ' (booked, awaiting completion)' : ''}`
          const row = dueBrief.getByRole('listitem').filter({ hasText: text })
          await expect(row).toHaveCount(1)
          await expect(row.getByRole('link', { name: 'View agreement', exact: true })).toHaveAttribute('href', `#customers/${item.member.customer.id}`)
          await expect(row.getByRole('link', { name: 'Schedule included visit', exact: true })).toHaveAttribute('href', '#dispatch')
          await screensAtWidth(page, `brief-${i}`, row, width)
          await row.getByRole('link', { name: 'View agreement', exact: true }).click()
          await expect(page).toHaveURL(`${origin}/app#customers/${item.member.customer.id}`)
          await expect(page.getByRole('heading', { name: item.member.customer.name, exact: true })).toBeVisible()
          const agreement = page.getByRole('region', { name: 'Agreements', exact: true })
          await expect(agreement.getByRole('link', { name: 'Open agreement document', exact: true })).toHaveAttribute('href', `/document?kind=agreement&id=${item.member.agreement.id}`)
          await expect(agreement).toContainText(`${item.left} of 2 visits left`)
          await screensAtWidth(page, `agreement-${i}`, agreement, width)
          await page.goto(`${origin}/app#today`)
          await dueBrief.getByRole('listitem').filter({ hasText: text }).getByRole('link', { name: 'Schedule included visit', exact: true }).click()
          await expect(page).toHaveURL(`${origin}/app#dispatch`)
          await expect(panel.getByRole('status')).toHaveText('4 included visits due in this range')
          const work = panel.locator('ul.rows > li').filter({ has: page.getByRole('link', { name: `${item.member.customer.name} · Comfort Club`, exact: true }) }).filter({ hasText: `Visit ${item.index + 1} · due ${item.due}` })
          await expect(work).toHaveCount(1)
          await expect(work).toContainText(item.member.site.address)
          await expect(work).toContainText(item.booked ? 'Booked, awaiting completion' : 'Awaiting booking')
          await screensAtWidth(page, `dispatch-${i}`, work, width)
        }
      }
      expect(await h.state()).toEqual(beforeReads)
      await page.setViewportSize({ width: 1440, height: 1050 })
      // CUST-001: the sale, the decline and the booking link's offer, outside send and use are in Lee's property history.
      const address = '12 Service St, Austin TX 78701'
      await page.goto(`${origin}/app#customers`)
      await page.getByLabel('Search customers', { exact: true }).fill('Lee Park')
      await page.locator('tr').filter({ hasText: 'Lee Park' }).getByRole('button').click()
      await page.getByRole('button', { name: `History at ${address}` }).click()
      const history = page.getByRole('region', { name: `History at ${address}` })
      for (const entry of ['Comfort Club sold (phone)', 'visit 1 (due', 'declined by Lee Park (email reply), recorded by Booking Office Browser: Replacing the system this year', 'Comfort Club visit 2: 2 slots offered by Booking Office Browser', 'recorded by Booking Office Browser as sent by email', 'Comfort Club visit 2: the customer chose a slot']) await expect(history.getByText(entry).first()).toBeVisible()
      await screens(page, 'property-history', history)
      // PLAN-011: qualify email outcomes and revocation through the desk.
      as = office.cookie
      await offerCommunicationHistory(page, h, office, service)
      as = h.owner()
      // BOOK-002: the existing public page can also book a service call.
      await h.command('service.save', { id: service.id, version: service.version, code: 'TUNE', name: service.name, unitPrice: '149.00', tax: 'TAXABLE', requiredSkills: ['hvac'] })
      const skilled = (await h.state()).technicians[0]
      await h.command('technician.save', { id: skilled.id, version: skilled.version, name: skilled.name, operatorId: skilled.operatorId, skills: ['hvac'], zips: ['78701'] })
      await h.command('technician.save', { name: 'Plumber without HVAC skill', skills: ['plumbing'] })
      const job = await h.command('job.create', { customerId: lee.customerId, siteId: lee.siteId, title: 'Online AC tune-up', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '149.00' }] })
      const date = '2030-01-09'
      const link = await h.command('booking.offer', { jobId: job.id, generate: { date, start: '15:00', end: '16:00', durationMinutes: 60, stepMinutes: 60 } })
      const serviceConflictJob = await h.command('job.create', { customerId: lee.customerId, siteId: lee.siteId, title: 'Existing full-day repair' })
      const fullDay = await h.command('visit.book', { jobId: serviceConflictJob.id, technicianId: skilled.id, date, start: '00:00', end: '23:59' })
      await page.goto(`${origin}/book#token=${link.token}`)
      const booking = page.getByRole('region', { name: 'Choose a service visit', exact: true })
      await expect(booking).toContainText('no booking has been made')
      await expect(booking.getByRole('button')).toHaveCount(0)
      await screens(page, 'service-full-day', booking)
      await h.command('visit.cancel', { visitId: fullDay.id, version: fullDay.version, reason: 'Repair rescheduled' })
      // Current directed travel, rather than just overlapping work, closes the offer.
      h.maps.places.set(address, { lat: 30.26, lng: -97.74 })
      h.maps.places.set('Synthetic adjacent site', { lat: 30.30, lng: -97.74 })
      await h.command('maps.connect', { key: 'synthetic-glove-985' })
      h.maps.routeAnswer = (body: any) => body.origins.flatMap((_: any, i: number) => body.destinations.map((_: any, j: number) => ({ originIndex: i, destinationIndex: j, status: {}, condition: 'ROUTE_EXISTS', distanceMeters: 1000, duration: '1800s' })))
      const adjacentSite = await h.command('site.save', { customerId: lee.customerId, address: 'Synthetic adjacent site', zip: '78701' })
      const adjacentJob = await h.command('job.create', { customerId: lee.customerId, siteId: adjacentSite.id, title: 'Adjacent service' })
      const inbound = await h.command('visit.book', { jobId: adjacentJob.id, technicianId: skilled.id, date, start: '13:00', end: '14:45' })
      await h.command('visit.book', { jobId: adjacentJob.id, technicianId: skilled.id, date, start: '16:30', end: '17:30' })
      await page.reload()
      await expect(booking).toContainText('no booking has been made')
      await expect(booking.getByRole('button')).toHaveCount(0)
      expect((await h.state()).visits.filter((v: any) => v.jobId === job.id)).toHaveLength(0)
      await screens(page, 'service-travel-refused', booking)
      await h.command('visit.change', { visitId: inbound.id, version: inbound.version, technicianId: skilled.id, date, start: '13:00', end: '14:30', reason: 'Thirty minutes to reach the offered service' })
      await page.reload()
      await expect(booking).toContainText('Choose your service visit')
      await expect(booking).toContainText('Arrival window 3:00 PM – 4:00 PM')
      await expect(booking.getByRole('button')).toHaveCount(1)
      await screens(page, 'service-window', booking)
      await booking.getByRole('button', { name: 'Book 3:00 PM – 4:00 PM', exact: true }).click()
      await expect(booking).toContainText('Your visit is booked')
      await expect(booking).toContainText('Arrival window 3:00 PM – 4:00 PM')
      await screens(page, 'service-booked', booking)
      const visit = (await h.state()).visits.find((v: any) => v.jobId === job.id)
      expect([visit.technicianId, visit.local.date, visit.local.start, visit.local.end]).toEqual([skilled.id, date, '15:00', '16:00'])
      expect(visit.arrivalWindow).toEqual({ start: '15:00', end: '16:00' })
      expect(visit.assignments[0].reason).toMatch(/^Assigned automatically/)
      expect((await h.state()).notices.some((n: any) => n.visitId === visit.id && n.message.includes('arrange the customer confirmation'))).toBe(true)
      await page.goto(`${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill(date)
      const board = page.getByRole('region', { name: 'Board', exact: true })
      await expect(board).toContainText('Online AC tune-up')
      await expect(board.getByRole('button', { name: new RegExp(`${job.number} Online AC tune-up, Luis Ortega, .*15:00 to 16:00`) })).toBeVisible()
      await screens(page, 'service-dispatch', board)
      // AGENT-007: prepare an internal maintenance check, follow its evidence,
      // and refresh it only after later technician captures receive desk review.
      const maintenanceCustomer = await h.command('customer.save', { name: 'Synthetic Maintenance Member' })
      const maintenanceSite = await h.command('site.save', { customerId: maintenanceCustomer.id, address: '20 Synthetic Street' })
      const maintenanceForm = await h.command('form.save', { name: 'Promised maintenance inspection', questions: [{ id: 'done', label: 'Inspection completed', type: 'yesno', required: true }] })
      const maintenancePlan = await h.command('plan.save', { name: 'Maintenance Care', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id, formIds: [maintenanceForm.id] })
      const maintenanceAgreement = await h.command('agreement.sell', { planId: maintenancePlan.id, customerId: maintenanceCustomer.id, siteId: maintenanceSite.id, via: 'phone', startDate: today })
      const maintenanceJob = await h.command('job.create', { customerId: maintenanceCustomer.id, siteId: maintenanceSite.id, agreementId: maintenanceAgreement.id, title: 'Synthetic maintenance evidence' })
      const maintenanceVisit = await h.command('visit.book', { jobId: maintenanceJob.id, technicianId: skilled.id, date: today, start: '20:00', end: '20:30' })
      await person.run('visit.arrive', { visitId: maintenanceVisit.id, deviceTime: maintenanceVisit.startAt })
      await person.run('visit.complete', { visitId: maintenanceVisit.id, deviceTime: maintenanceVisit.endAt, summary: 'Maintenance visit finished', signoff: { absentReason: 'Customer away' } })
      const maintenanceAgent = await h.person('Synthetic Maintenance Agent', 'agent')
      as = maintenanceAgent.cookie
      await page.reload()
      await page.setViewportSize({ width: 1440, height: 1050 })
      await page.goto(`${origin}/app#dispatch`)
      const maintenancePanel = page.getByRole('region', { name: 'Completed maintenance checks', exact: true })
      const maintenanceWork = maintenancePanel.locator('ul.rows > li').filter({ has: page.getByRole('link', { name: 'Synthetic Maintenance Member · Maintenance Care', exact: true }) })
      await expect(maintenancePanel).toContainText('Maintenance check not prepared')
      await maintenanceWork.getByRole('button', { name: 'Prepare maintenance check', exact: true }).click()
      await expect(maintenancePanel).toContainText('Missing maintenance form')
      await expect(maintenancePanel).toContainText('Promised maintenance inspection · revision 1 · Missing accepted capture')
      await expect(maintenancePanel).toContainText('Prepared by Synthetic Maintenance Agent')
      await screens(page, 'maintenance-missing', maintenancePanel)
      await maintenanceWork.getByRole('link', { name: 'Open maintenance evidence', exact: true }).click()
      await expect(page.getByRole('heading', { name: `${maintenanceJob.number} · Synthetic maintenance evidence`, exact: true })).toBeVisible()
      await expect(page.getByText('Maintenance visit finished', { exact: false }).first()).toBeVisible()
      await screens(page, 'maintenance-evidence', page.getByRole('heading', { name: `${maintenanceJob.number} · Synthetic maintenance evidence`, exact: true }))
      await person.run('visit.capture', { visitId: maintenanceVisit.id, deviceTime: maintenanceVisit.endAt, kind: 'form', formId: maintenanceJob.forms[0].id, answers: { done: true } })
      const lateVisit = (await h.state()).visits.find((v: any) => v.id === maintenanceVisit.id)
      await h.command('visit.reviewLateEvidence', { visitId: lateVisit.id, version: lateVisit.version, note: 'Reviewed the genuine inspection' })
      await page.goto(`${origin}/app#dispatch`)
      await expect(maintenancePanel).toContainText('Evidence changed; prepare the check again')
      await maintenanceWork.getByRole('button', { name: 'Prepare maintenance check', exact: true }).click()
      await expect(maintenancePanel).toContainText('Promised maintenance forms recorded')
      await expect(maintenancePanel).toContainText('Accepted capture recorded')
      await screens(page, 'maintenance-recorded', maintenancePanel)
      as = h.owner()
      await page.goto(`${origin}/app#dispatch`)
      const previous = page.getByRole('button', { name: 'Previous day', exact: true })
      await previous.focus()
      await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()

    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})

// Exercise an interrupted batch against real Worker responses. The transport
// discards only the first committed booking reply; no response is invented.
async function interruptedBatch(page: Page, h: any, office: any, person: any, setActor: (cookie: string) => void) {
  const service = await h.command('service.save', { code: 'RECOVER', name: 'Recovery inspection', unitPrice: '25.00', tax: 'TAXABLE' })
  const plan = await h.command('plan.save', { name: 'Recovery Care', price: '50.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id, formIds: [] })
  const members: any[] = []
  for (let i = 0; i < 3; i++) {
    const customer = await h.command('customer.save', { name: `Synthetic recovery member ${i + 1}` })
    const site = await h.command('site.save', { customerId: customer.id, address: `${i + 1} Synthetic Recovery Street`, zip: '78799' })
    const agreement = await h.command('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: `2029-12-${29 + i}` })
    members.push({ customer, site, agreement })
  }
  const retained = await office.run('job.create', { customerId: members[1].customer.id, siteId: members[1].site.id, agreementId: members[1].agreement.id, agreementVisitIndex: 0, title: 'Retained included inspection' })
  const sent: any[] = []
  let discard = true
  const transport = async (route: any) => {
    const command = route.request().postDataJSON()
    sent.push(command)
    const response = await h.request('/api/glove/commands', { method: 'POST', as: office.cookie, body: command })
    const bytes = Buffer.from(await response.arrayBuffer())
    if (discard && command.type === 'visit.book') {
      expect(response.status).toBe(200)
      expect(JSON.parse(bytes.toString()).ok).toBe(true)
      discard = false
      await route.abort('connectionfailed')
    } else await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: bytes })
  }
  await page.route(`${origin}/api/glove/commands`, transport)
  try {
    await page.goto(`${origin}/app#dispatch`)
    const panel = page.getByRole('region', { name: 'Due agreement visits', exact: true })
    await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78799')
    await expect(panel.getByRole('status')).toHaveText('3 included visits due in this range')
    await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
    await panel.getByLabel('Batch technician', { exact: true }).selectOption({ label: 'Luis Ortega' })
    await panel.getByLabel('First visit starts', { exact: true }).fill('06:00')
    await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
    const results = panel.getByLabel('Batch results')
    await expect(results).toContainText('booking outcome unconfirmed')
    await expect(results).not.toContainText('not booked;')
    for (const member of members.slice(1)) await expect(results).toContainText(`${member.customer.name}: not attempted`)
    const work = (name: string) => panel.locator('ul.rows > li').filter({ has: page.getByRole('link', { name: `${name} · Recovery Care`, exact: true }) })
    await expect(work(members[0].customer.name)).toContainText('Outcome unconfirmed; use Retry to recover this visit.')
    await expect(work(members[0].customer.name)).not.toContainText('Awaiting booking')
    for (const member of members.slice(1)) await expect(work(member.customer.name)).toContainText('Awaiting booking')
    await expect(panel.getByRole('button', { name: 'Select unbooked visits', exact: true })).toBeDisabled()
    await expect(panel.getByRole('button', { name: 'Book selected visits', exact: true })).toBeDisabled()
    expect(sent.map(c => c.type)).toEqual(['job.create', 'visit.book'])
    const original = sent[1]
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('glove.pending-command')!))).toEqual(original)
    const beforeRetry = await h.state()
    const firstJob = beforeRetry.jobs.find((j: any) => j.agreementId === members[0].agreement.id)
    const firstVisit = beforeRetry.visits.find((v: any) => v.jobId === firstJob.id)
    expect(beforeRetry.jobs.filter((j: any) => members.some(m => m.agreement.id === j.agreementId)).map((j: any) => j.id).sort()).toEqual([firstJob.id, retained.id].sort())
    expect(beforeRetry.visits.filter((v: any) => [firstJob.id, retained.id].includes(v.jobId)).map((v: any) => v.id)).toEqual([firstVisit.id])
    await screens(page, 'pending-visit', work(members[0].customer.name))
    await screens(page, 'paused-batch', panel.getByRole('form', { name: 'Batch book included visits', exact: true }))
    await screens(page, 'interrupted-batch', results)
    // Restart the Worker with durable D1; Retry recovers the original result.
    await h.restart()
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0)
    expect(sent).toHaveLength(3)
    expect(sent[2]).toEqual(original)
    expect(await h.state()).toEqual(beforeRetry)
    await expect(results).toContainText(`${members[0].customer.name}: booked 2030-01-01 06:00–06:30; remains due until completed.`)
    await expect(results).not.toContainText('outcome unconfirmed')
    await expect(results).not.toContainText('Recover the pending action with Retry')
    await expect(panel.getByRole('button', { name: 'Select unbooked visits', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => sessionStorage.getItem('glove.pending-command'))).toBeNull()
    await screens(page, 'reconciled-results', results)
    await h.restart()
    await page.reload()
    await panel.getByLabel('Area ZIP (optional)', { exact: true }).fill('78799')
    await expect(panel.getByRole('status')).toHaveText('3 included visits due in this range')
    await expect(work(members[0].customer.name)).toContainText('Booked, awaiting completion')
    for (const member of members.slice(1)) await expect(work(member.customer.name)).toContainText('Awaiting booking')
    await screens(page, 'recovered-batch', panel)
    expect(sent).toHaveLength(3)
    expect(await h.state()).toEqual(beforeRetry)
    // The later batch reuses the retained included job and attempts only the
    // two entries that the interrupted batch never reached.
    await panel.getByRole('button', { name: 'Select unbooked visits', exact: true }).click()
    await panel.getByLabel('Batch technician', { exact: true }).selectOption({ label: 'Luis Ortega' })
    await panel.getByLabel('First visit starts', { exact: true }).fill('06:30')
    await panel.getByRole('button', { name: 'Book selected visits', exact: true }).click()
    await expect(results.getByRole('listitem')).toHaveCount(2)
    expect(sent.slice(3).map(c => c.type)).toEqual(['visit.book', 'job.create', 'visit.book'])
    expect(sent[3].payload.jobId).toBe(retained.id)
    const after = await h.state()
    const jobs = after.jobs.filter((j: any) => members.some(m => m.agreement.id === j.agreementId))
    expect(jobs).toHaveLength(3)
    const visits = after.visits.filter((v: any) => jobs.some((j: any) => j.id === v.jobId))
    expect(visits).toHaveLength(3)
    const activity = await h.request('/api/glove/activity').then((r: any) => r.json())
    const exported = await h.request('/api/glove/export').then((r: any) => r.json())
    const bookings = activity.events.filter((e: any) => e.kind === 'visit.booked' && jobs.some((j: any) => j.id === e.jobId))
    expect(bookings).toHaveLength(3)
    const recovered = bookings.filter((e: any) => e.commandId === original.commandId)
    expect(recovered).toHaveLength(1)
    expect([recovered[0].actorId, recovered[0].actorRole]).toEqual([office.id, 'office'])
    expect(exported.timeline.filter((e: any) => e.command_id === original.commandId && e.kind === 'visit.booked').map((e: any) => e.id)).toEqual([recovered[0].id])
    // Complete the recovered booking through the technician's actual controls.
    // The other inspections stay due until their own explicit completions.
    await page.unroute(`${origin}/api/glove/commands`, transport)
    setActor(person.cookie)
    await page.reload()
    await page.getByRole('button', { name: new RegExp(`^${firstJob.number} ·`) }).click()
    await page.getByRole('button', { name: 'Record arrival', exact: true }).click()
    await expect(page.locator('.arrival-status')).toContainText('Arrival recorded at')
    await page.getByRole('button', { name: 'Complete visit', exact: true }).click()
    await page.getByLabel('Work done', { exact: true }).fill('Recovered inspection complete')
    await page.getByLabel('The customer is not here to sign', { exact: true }).check()
    await page.getByLabel('Why there is no sign-off', { exact: true }).fill('Customer away')
    await page.getByRole('button', { name: 'Save completion', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Visit completed' })).toBeVisible()
    await screens(page, 'recovered-completion', page.getByRole('status').filter({ hasText: 'Visit completed' }))
    await h.restart()
    expect((await h.state()).visits.find((v: any) => v.id === firstVisit.id).status).toBe('completed')
    expect((await h.request('/api/glove/due-visits?area=78799').then((r: any) => r.json())).visits.map((v: any) => [v.id, v.booked]).sort()).toEqual(members.slice(1).map(m => [`${m.agreement.id}:0`, true]).sort())
    for (const visit of visits.filter((v: any) => v.id !== firstVisit.id)) {
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Inspection complete', signoff: { absentReason: 'Customer away' } })
    }
    setActor(office.cookie)
    await page.reload()
    expect((await h.request('/api/glove/due-visits?area=78799').then((r: any) => r.json())).visits).toEqual([])
  } finally { await page.unroute(`${origin}/api/glove/commands`, transport) }
}


// The browser drives the ordinary desk controls; only provider transport is fake.
async function offerCommunicationHistory(page: Page, h: any, office: any, service: any) {
  const edge = await connectMail(h, 'postmark')
  const email = ['synthetic-glove-booking', 'example.test'].join('@')
  const customer = await h.command('customer.save', { name: 'Synthetic Booking History', email, apEmail: ['synthetic-glove-ap', 'example.test'].join('@') })
  const site = await h.command('site.save', { customerId: customer.id, address: '40 Synthetic History Street' })
  const otherSite = await h.command('site.save', { customerId: customer.id, address: '42 Synthetic History Street' })
  const plan = await h.command('plan.save', { name: 'History Care', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id })
  const otherPlan = await h.command('plan.save', { name: 'Other Property Care', price: '100.00', termMonths: 12, includedVisits: 1, visitServiceId: service.id })
  const agreement = await office.run('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate: '2030-01-01' })
  const otherAgreement = await office.run('agreement.sell', { customerId: customer.id, siteId: otherSite.id, planId: otherPlan.id, via: 'phone', startDate: '2030-01-01' })
  const tech = (await h.state()).technicians[0]
  await office.run('agreement.offer', { agreementId: otherAgreement.id, index: 0, slots: [{ technicianId: tech.id, date: '2030-01-12', start: '14:00', end: '14:30' }] })
  await page.goto(`${origin}/app#dispatch`)
  // Same customer, two properties: choose the row by its actual address.
  const work = page.getByRole('region', { name: 'Due agreement visits', exact: true }).locator('ul.rows > li').filter({ hasText: site.address })
  const offers = work.getByRole('region', { name: 'Booking offers for Synthetic Booking History visit 1', exact: true })
  await offers.getByText('Offer customer times', { exact: true }).click()
  const form = offers.getByRole('form', { name: 'Offer times to Synthetic Booking History', exact: true })
  await form.getByLabel('Offer technician', { exact: true }).selectOption(tech.id)
  await form.getByLabel('Offer date', { exact: true }).fill('2030-01-11')
  const sentBefore = h.email.sent.length
  await form.getByRole('button', { name: `Email the link to ${email}`, exact: true }).click()
  await expect(offers).toContainText(`Emailed to ${email} by Booking Office Browser`)
  await expect(offers).toContainText('Accepted by Postmark; delivery not yet reported')
  expect(h.email.sent.length).toBe(sentBefore + 1)
  const link = (await h.state()).bookingOffers.find((o: any) => o.agreementId === agreement.id)
  expect(h.email.sent.at(-1).to).toBe(email)
  const message = receipt(h, { id: link.emailed.messageId, to: email })
  await screens(page, 'email-accepted', offers)
  const showHistory = async (state: string) => {
    await page.goto(`${origin}/app#customers`)
    await page.getByLabel('Search customers', { exact: true }).fill(customer.name)
    await page.locator('tr').filter({ hasText: customer.name }).getByRole('button').click()
    await page.getByRole('button', { name: `History at ${site.address}`, exact: true }).click()
    const history = page.getByRole('region', { name: `History at ${site.address}`, exact: true })
    await expect(history).toContainText('History Care visit 1: 1 slot offered by Booking Office Browser')
    await expect(history).toContainText('booking link emailed (outbound, email, Booking Office Browser')
    await expect(history).toContainText(state)
    await expect(history).not.toContainText('Other Property Care')
    return history
  }
  await screens(page, 'email-history-accepted', await showHistory('Accepted by Postmark; delivery not yet reported'))
  for (const [outcome, at, state] of [
    ['delivered', '2030-01-02T02:01:00.000Z', `Delivered to ${email}'s mail server (reported by Postmark)`],
    ['bounced', '2030-01-02T02:02:00.000Z', `Bounced: ${email} did not accept it (reported by Postmark)`],
  ]) {
    expect((await postEvents(h, edge.callback(message, outcome, at))).status).toBe(200)
    await page.goto(`${origin}/app#dispatch`)
    await expect(offers).toContainText(state)
    await screens(page, `email-${outcome}`, offers)
    await screens(page, `email-history-${outcome}`, await showHistory(state))
  }
  await page.goto(`${origin}/app#dispatch`)
  await offers.getByLabel('Sent outside Glove by', { exact: true }).fill('phone follow-up')
  await offers.getByRole('button', { name: 'Record as sent outside Glove', exact: true }).click()
  // The mail result continues to show the provider fact; the separate outside
  // send is honestly labelled in property history.
  await offers.getByRole('button', { name: 'Revoke booking link', exact: true }).click()
  await expect(offers.getByText('Revoked ·', { exact: false })).toBeVisible()
  await screens(page, 'email-revoked', offers)
  const history = await showHistory(`Bounced: ${email} did not accept it (reported by Postmark)`)
  await expect(history).toContainText('History Care visit 1: recorded by Booking Office Browser as sent by phone follow-up')
  await expect(history).toContainText('delivery not verified')
  await expect(history).toContainText('History Care visit 1: revoked')
  await screens(page, 'email-history-revoked', history)
  await page.getByRole('button', { name: `History at ${otherSite.address}`, exact: true }).click()
  const otherHistory = page.getByRole('region', { name: `History at ${otherSite.address}`, exact: true })
  await expect(otherHistory).toContainText('Other Property Care visit 1: 1 slot offered by Booking Office Browser')
  await expect(otherHistory).not.toContainText('booking link emailed')
  await expect(otherHistory).not.toContainText('phone follow-up')
  await expect(otherHistory).not.toContainText('History Care visit 1: revoked')
  await screens(page, 'other-property-history', otherHistory)
  expect(h.email.sent.length).toBe(sentBefore + 1)
}
