import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker, D1, native sessions and public HTTP doors.
import { installation } from '../api/harness.mjs'

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
}

test('BOOK-002 / PLAN-004 / AGENT-008 Office batch books due visits, records declines and outside sends, the customer chooses an offered slot, and the owner follows the brief at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2030-01-01T12:00:00Z' })
  try {
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago' })
    const service = await h.command('service.save', { code: 'TUNE', name: 'AC tune-up', unitPrice: '149.00', tax: 'TAXABLE' })
    const plan = await h.command('plan.save', { name: 'Comfort Club', price: '228.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '15', priorityBooking: true, formIds: [] })
    const person = await h.person('Luis Ortega Browser', 'technician')
    await h.command('technician.save', { name: 'Luis Ortega', operatorId: person.id })
    const today = '2030-01-01'
    const d = new Date(`${today}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 7); const startDate = d.toISOString().slice(0, 10)
    for (const [i, name] of ['Ellen Brooks', 'Rosa Diaz', 'Lee Park'].entries()) {
      const customer = await h.command('customer.save', { name })
      const site = await h.command('site.save', { customerId: customer.id, address: `${10 + i} Service St, Austin TX ${i < 2 ? '78704' : '78701'}`, zip: i < 2 ? '78704' : '78701' })
      await h.command('agreement.sell', { customerId: customer.id, siteId: site.id, planId: plan.id, via: 'phone', startDate })
    }
    const office = await h.person('Booking Office Browser', 'office')
    let as = office.cookie
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await h.request(url.pathname + url.search, { method: req.method(), as: url.pathname === '/api/glove/public/booking' ? '' : as, headers: req.headers()['authorization'] ? { authorization: req.headers()['authorization'] } : {}, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
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
      as = h.owner()
      await page.goto(`${origin}/app#today`)
      await expect(page.locator('.tile').filter({ has: page.locator('#tile-agreements') })).toContainText('5 visits')
      const brief = page.getByRole('region', { name: 'Morning brief', exact: true })
      await expect(brief.getByRole('region', { name: 'Agreement visits due', exact: true }).getByRole('listitem')).toHaveCount(5)
      await screens(page, 'today', brief)
      await brief.getByRole('link', { name: 'View agreement', exact: true }).first().click()
      const agreement = page.getByRole('region', { name: 'Agreements', exact: true })
      await expect(agreement).toContainText('Comfort Club')
      await screens(page, 'agreement', agreement)
      // CUST-001: the sale, the decline and the booking link's offer, outside send and use are in Lee's property history.
      const address = '12 Service St, Austin TX 78701'
      await page.goto(`${origin}/app#customers`)
      await page.getByLabel('Search customers', { exact: true }).fill('Lee Park')
      await page.locator('tr').filter({ hasText: 'Lee Park' }).getByRole('button').click()
      await page.getByRole('button', { name: `History at ${address}` }).click()
      const history = page.getByRole('region', { name: `History at ${address}` })
      for (const entry of ['Comfort Club sold (phone)', 'visit 1 (due', 'declined by Lee Park (email reply), recorded by Booking Office Browser: Replacing the system this year', 'Comfort Club visit 2: 2 slots offered by Booking Office Browser', 'recorded by Booking Office Browser as sent by email', 'Comfort Club visit 2: the customer chose a slot']) await expect(history.getByText(entry).first()).toBeVisible()
      await screens(page, 'property-history', history)
      // BOOK-002: the existing public page can also book a service call.
      await h.command('service.save', { id: service.id, version: service.version, code: 'TUNE', name: service.name, unitPrice: '149.00', tax: 'TAXABLE', requiredSkills: ['hvac'] })
      const skilled = (await h.state()).technicians[0]
      await h.command('technician.save', { id: skilled.id, version: skilled.version, name: skilled.name, skills: ['hvac'], zips: ['78701'] })
      await h.command('technician.save', { name: 'Plumber without HVAC skill', skills: ['plumbing'] })
      const job = await h.command('job.create', { customerId: lee.customerId, siteId: lee.siteId, title: 'Online AC tune-up', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: '149.00' }] })
      const date = '2030-01-09'
      const link = await h.command('booking.offer', { jobId: job.id, slots: [{ date, start: '15:00', end: '16:00', window: { start: '14:00', end: '16:00' } }] })
      const serviceConflictJob = await h.command('job.create', { customerId: lee.customerId, siteId: lee.siteId, title: 'Existing full-day repair' })
      const fullDay = await h.command('visit.book', { jobId: serviceConflictJob.id, technicianId: skilled.id, date, start: '00:00', end: '23:59' })
      await page.goto(`${origin}/book#token=${link.token}`)
      const booking = page.getByRole('region', { name: 'Choose a service visit', exact: true })
      await expect(booking).toContainText('no booking has been made')
      await expect(booking.getByRole('button')).toHaveCount(0)
      await screens(page, 'service-full-day', booking)
      await h.command('visit.cancel', { visitId: fullDay.id, version: fullDay.version, reason: 'Repair rescheduled' })
      await page.reload()
      await expect(booking).toContainText('Choose your service visit')
      await expect(booking).toContainText('Arrival window 2:00 PM – 4:00 PM')
      await expect(booking.getByRole('button')).toHaveCount(1)
      await screens(page, 'service-window', booking)
      await booking.getByRole('button', { name: 'Book 3:00 PM – 4:00 PM', exact: true }).click()
      await expect(booking).toContainText('Your visit is booked')
      await expect(booking).toContainText('Arrival window 2:00 PM – 4:00 PM')
      await screens(page, 'service-booked', booking)
      const visit = (await h.state()).visits.find((v: any) => v.jobId === job.id)
      expect(visit.technicianId).toBe(skilled.id)
      expect(visit.arrivalWindow).toEqual({ start: '14:00', end: '16:00' })
      expect(visit.assignments[0].reason).toMatch(/^Assigned automatically/)
      expect((await h.state()).notices.some((n: any) => n.visitId === visit.id && n.message.includes('arrange the customer confirmation'))).toBe(true)
      await page.goto(`${origin}/app#dispatch`)
      await page.getByLabel('Day', { exact: true }).fill(date)
      const board = page.getByRole('region', { name: 'Board', exact: true })
      await expect(board).toContainText('Online AC tune-up')
      await screens(page, 'service-dispatch', board)
      const previous = page.getByRole('button', { name: 'Previous day', exact: true })
      await previous.focus()
      await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()

    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
