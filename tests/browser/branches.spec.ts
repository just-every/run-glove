// @ts-expect-error Named scenarios add no test registrations.
import { scenario } from '../fixtures/scenario.mjs'
import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Shared fixture drives the production HTTP Worker and D1.
import { installation, business } from '../api/harness.mjs'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function shot(page: Page, width: number, name: string) {
  if (!process.env.GLOVE_SCREENSHOTS) return
  await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-branches-${name}.png`) })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('TEAM-002, TEAM-004, TEAM-005 + API-002, API-006, API-007 owner limits a dispatcher to a branch and issues a branch token; the board and every report follow the limit at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: '2026-11-05T12:00:00.000Z' })
  try {
    const b = await business(h)
    const branches = []
    for (const [name, prefix, timezone, zip, person, price] of [
      ['Raleigh', 'RAL', 'America/New_York', '27601', b.priyaPerson, '125.00'],
      ['Phoenix', 'PHX', 'America/Phoenix', '85001', b.tomPerson, '275.00'],
    ] as const) {
      const branch = await h.command('branch.save', { name, prefix, timezone, zips: [zip] })
      const customer = await b.office.run('customer.save', { name: `${name} School` })
      const site = await b.office.run('site.save', { customerId: customer.id, address: `${name === 'Raleigh' ? '101 Fayetteville St, Raleigh NC' : '1 Central Ave, Phoenix AZ'} ${zip}`, branchId: branch.id })
      const oldTech = person.id === b.priyaPerson.id ? b.priya : b.tom
      const tech = await h.command('technician.save', { id: oldTech.id, version: oldTech.version, name: person.name, operatorId: person.id, branchId: branch.id })
      const enquiry = await b.office.run('enquiry.create', { customerId: customer.id, siteId: site.id, description: 'Inspect the rooftop system', source: 'phone' })
      const q = await b.dispatcher.run('quote.draft', { enquiryId: enquiry.id, customerId: customer.id, siteId: site.id, title: `${name} rooftop inspection`, lines: [{ description: 'Inspection', quantity: '1', unitPrice: price, tax: 'FREE' }] })
      const a = await b.dispatcher.run('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await b.dispatcher.run('quote.accept', { quoteId: q.id, version: a.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
      const job = await b.dispatcher.run('job.create', { quoteId: q.id })
      const date = '2026-11-05'
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Inspected rooftop equipment', signoff: { absentReason: 'Manager at another property' } })
      const inv = await b.office.run('invoice.prepare', { jobId: job.id })
      await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
      branches.push({ ...branch, customer, site, tech })
    }
    const mainPerson = await h.person('Main Field', 'technician')
    const mainTech = await h.command('technician.save', { name: 'Main Field', operatorId: mainPerson.id })
    const boardRoots = [{ id: '', name: 'Main business', timezone: 'Australia/Sydney', customer: b.customer, site: b.site, tech: mainTech }, ...branches]
    for (const root of boardRoots) {
      const helper = await h.command('technician.save', { name: `${root.name} Helper`, ...(root.id ? { branchId: root.id } : {}) })
      const crew = await h.command('crew.save', { name: `${root.name} Team`, memberIds: [root.tech.id, helper.id] })
      const make = (title: string) => h.command('job.create', { customerId: root.customer.id, siteId: root.site.id, title, lines: [{ description: 'Inspection', quantity: '1', unitPrice: '20.00', tax: 'FREE' }] })
      const booked = await make(`${root.name} booked work`)
      await h.command('visit.book', { jobId: booked.id, technicianId: root.tech.id, date: '2026-11-05', start: '11:00', end: '12:00' })
      const crewJob = await make(`${root.name} crew work`)
      await h.command('visit.book', { jobId: crewJob.id, crewId: crew.id, date: '2026-11-05', start: '13:00', end: '14:00' })
      await make(`${root.name} waiting work`)
      const q = await h.command('quote.draft', { customerId: root.customer.id, siteId: root.site.id, title: `${root.name} accepted waiting quote`, lines: [{ description: 'Inspection', quantity: '1', unitPrice: '20.00', tax: 'FREE' }] })
      const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
    }
    const mainWork = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Main completed inspection', lines: [{ description: 'Inspection', quantity: '1', unitPrice: '55.00', tax: 'FREE' }] })
    const mainVisit = await h.command('visit.book', { jobId: mainWork.id, technicianId: mainTech.id, date: '2026-11-05', start: '09:00', end: '10:00' })
    await mainPerson.run('visit.arrive', { visitId: mainVisit.id, deviceTime: mainVisit.startAt })
    await mainPerson.run('visit.complete', { visitId: mainVisit.id, deviceTime: mainVisit.endAt, summary: 'Inspected', signoff: { absentReason: 'Customer away' } })
    const mainInvoice = await h.command('invoice.prepare', { jobId: mainWork.id })
    await h.command('invoice.approve', { invoiceId: mainInvoice.id, version: mainInvoice.version, revision: 1 })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    let as: string | undefined
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      await page.goto(process.env.GLOVE_OPEN)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      // Only the transport is forwarded: all data and role decisions come from production handlers.
      await page.route(`${origin}/api/glove/**`, async route => {
        const req = route.request(), u = new URL(req.url())
        const r = await h.request(u.pathname + u.search, { method: req.method(), ...(as ? { as } : {}), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: r.status, contentType: r.headers.get('content-type') ?? 'application/json', body: Buffer.from(await r.arrayBuffer()) })
      })
      const steps = { diagnostic: (name: string) => test.info().annotations.push({ type: 'scenario', description: name }) }
      await scenario(steps, 'TEAM-004 point 2: Dispatch selects only its branch technicians, booked and waiting work, crews and local times, clearing selected work', async () => {
        await page.goto(`${origin}/app#dispatch`)
        await page.getByLabel('Day', { exact: true }).fill('2026-11-05')
        const branchChoice = page.getByLabel('Branch', { exact: true })
        const previous = page.getByRole('button', { name: 'Previous day', exact: true })
        await previous.focus()
        await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()
        await previous.blur()
        await previous.hover()
        await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()
        const waiting = page.locator('section.waiting')
        const board = page.getByRole('region', { name: 'Board', exact: true })
        for (const [i, root] of boardRoots.entries()) {
          await page.setViewportSize({ width: 1440, height: 1050 })
          await branchChoice.selectOption(root.id)
          await expect(page.locator('.visit-panel')).toHaveCount(0)
          await expect(page.locator('.book-form')).toHaveCount(0)
          await expect(board.locator('.techrow')).toHaveCount(2)
          await expect(board).toContainText(root.tech.name)
          await expect(board).toContainText(`${root.name} Helper`)
          await expect(board.getByRole('button', { name: new RegExp(`${root.name} booked work,.*11:00 to 12:00`) })).toHaveCount(1)
          await expect(waiting).toContainText(`${root.name} waiting work`)
          await expect(waiting).toContainText(`${root.name} accepted waiting quote`)
          for (const other of boardRoots.filter(x => x.id !== root.id)) {
            await expect(board).not.toContainText(other.tech.name)
            await expect(board).not.toContainText(`${other.name} booked work`)
            await expect(waiting).not.toContainText(`${other.name} waiting work`)
            await expect(waiting).not.toContainText(`${other.name} accepted waiting quote`)
          }
          await board.getByRole('button', { name: new RegExp(`${root.name} booked work,`) }).click()
          await expect(page.locator('.visit-panel .visit-meta')).toContainText('11:00 AM')
          const next = boardRoots[(i + 1) % boardRoots.length]
          await branchChoice.selectOption(next.id)
          await expect(page.locator('.visit-panel')).toHaveCount(0)
          await branchChoice.selectOption(root.id)
          await page.getByRole('button', { name: 'Book visit', exact: true }).first().click()
          await expect(page.locator('.book-form')).toContainText(`Times are in ${root.timezone}`)
          expect((await page.locator('.book-form').getByLabel('Technician', { exact: true }).locator('option').allTextContents()).sort()).toEqual(['Assign automatically', root.tech.name, `${root.name} Helper`, `Crew ${root.name} Team`].sort())
          await branchChoice.selectOption(next.id)
          await expect(page.locator('.book-form')).toHaveCount(0)
          await branchChoice.selectOption(root.id)
          await page.getByLabel('Rows', { exact: true }).selectOption('crews')
          await expect(board.locator('.techrow')).toHaveCount(1)
          await expect(board).toContainText(`Crew ${root.name} Team`)
          await expect(board.getByRole('button', { name: new RegExp(`${root.name} crew work,.*13:00 to 14:00`) })).toHaveCount(1)
          for (const other of boardRoots.filter(x => x.id !== root.id)) await expect(board).not.toContainText(`Crew ${other.name} Team`)
          await shot(page, 1440, `dispatch-${i}`)
          await page.setViewportSize({ width: 390, height: 1050 })
          await shot(page, 390, `dispatch-${i}`)
          await page.setViewportSize({ width: 1440, height: 1050 })
          await page.getByLabel('Rows', { exact: true }).selectOption('technicians')
        }
      })
      await page.goto(`${origin}/app#team`)
      const limit = page.getByLabel(`Branch access for ${b.dispatcher.name}`, { exact: true })
      await limit.selectOption(branches[0].id)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(limit).toHaveValue(branches[0].id)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await limit.scrollIntoViewIfNeeded(); await shot(page, width, 'people') }
      // TEAM-005: the Owner changes the person's main limit and restores all-branch access.
      await page.setViewportSize({ width: 1440, height: 1050 })
      await limit.selectOption('main')
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(limit).toHaveValue('main')
      expect((await b.dispatcher.state()).customers.map((row: { name: string }) => row.name)).toEqual(['Harbourview Dental'])
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await limit.scrollIntoViewIfNeeded(); await shot(page, width, 'dispatcher-main') }
      await page.setViewportSize({ width: 1440, height: 1050 })
      await limit.selectOption('')
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(limit).toHaveValue('')
      expect((await b.dispatcher.state()).customers.map((row: { name: string }) => row.name).sort()).toEqual(['Harbourview Dental', 'Phoenix School', 'Raleigh School'])
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await limit.scrollIntoViewIfNeeded(); await shot(page, width, 'dispatcher-restored') }
      await page.setViewportSize({ width: 1440, height: 1050 })
      await limit.selectOption(branches[0].id)
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(limit).toHaveValue(branches[0].id)
      expect((await b.dispatcher.state()).customers.map((row: { name: string }) => row.name)).toEqual(['Raleigh School'])
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await limit.scrollIntoViewIfNeeded(); await shot(page, width, 'dispatcher-limited') }
      await page.setViewportSize({ width: 1440, height: 1050 })
      const officeLimit = page.getByLabel(`Branch access for ${b.office.name}`, { exact: true })
      await officeLimit.selectOption('main')
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(officeLimit).toHaveValue('main')
      expect((await b.office.state()).customers.map((row: { name: string }) => row.name)).toEqual(['Harbourview Dental'])
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await officeLimit.scrollIntoViewIfNeeded(); await shot(page, width, 'office-main') }
      await page.setViewportSize({ width: 1440, height: 1050 })
      await officeLimit.selectOption('')
      await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
      await expect(officeLimit).toHaveValue('')
      expect((await b.office.state()).customers.map((row: { name: string }) => row.name).sort()).toEqual(['Harbourview Dental', 'Phoenix School', 'Raleigh School'])
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await officeLimit.scrollIntoViewIfNeeded(); await shot(page, width, 'office-restored') }
      await page.setViewportSize({ width: 1440, height: 1050 })
      // API-002: the owner issues a Viewer token for Raleigh, sees it once, and revokes it.
      const tokens = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Integration tokens', exact: true }) })
      await tokens.getByLabel('Name', { exact: true }).fill('Raleigh board')
      await tokens.getByLabel('Acts as', { exact: true }).selectOption('viewer')
      await tokens.getByLabel('Branch', { exact: true }).selectOption(branches[0].id)
      await tokens.getByRole('button', { name: 'Issue token', exact: true }).click()
      await expect(tokens.getByRole('status')).toContainText('never shows it again')
      await expect(tokens.locator('code.secret')).toHaveText(/^glv_[A-Za-z0-9_-]{43}$/)
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await tokens.scrollIntoViewIfNeeded(); await shot(page, width, 'token-issued') }
      await tokens.getByRole('button', { name: 'I have copied it', exact: true }).click()
      await expect(tokens.locator('code.secret')).toHaveCount(0)
      await expect(tokens).toContainText('Acts as Viewer · Raleigh only')
      await tokens.getByRole('button', { name: 'Revoke', exact: true }).click()
      await expect(tokens.getByText('Revoked', { exact: true })).toBeVisible()
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await tokens.scrollIntoViewIfNeeded(); await shot(page, width, 'token-revoked') }
      await scenario(steps, 'TEAM-004 point 6: Reports branch choice selects each populated root and main at desktop and phone sizes', async () => {
      await page.goto(`${origin}/app#reports`)
      await page.getByLabel('From', { exact: true }).fill('2026-01-01')
      await page.getByLabel('To', { exact: true }).fill('2027-12-31')
      await page.getByLabel('Report branch', { exact: true }).selectOption(branches[0].id)
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('$125.00')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).not.toContainText('Phoenix')
      for (const kind of ['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax']) {
        await page.getByLabel('Report', { exact: true }).selectOption(kind)
        await expect(page.getByLabel('Report branch', { exact: true })).toHaveValue(branches[0].id)
        for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await page.getByLabel('Report', { exact: true }).scrollIntoViewIfNeeded(); await shot(page, width, kind) }
      }
      await page.setViewportSize({ width: 1440, height: 1050 })
      await page.getByLabel('Report', { exact: true }).selectOption('revenue')
      await page.getByLabel('Report branch', { exact: true }).selectOption(branches[1].id)
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('$275.00')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).not.toContainText('Raleigh')
      await page.getByLabel('Report branch', { exact: true }).selectOption('main')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('$55.00')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).not.toContainText('Raleigh')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).not.toContainText('Phoenix')
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await shot(page, width, 'reports-main') }
      await page.getByLabel('Report branch', { exact: true }).selectOption('')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('Raleigh')
      await expect(page.locator('section[aria-labelledby="report-title"] .table')).toContainText('Phoenix')
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await shot(page, width, 'reports-all-branches') }
      })
      as = b.dispatcher.cookie
      await page.goto(`${origin}/app#jobs`)
      await expect(page.getByRole('heading', { name: 'Jobs', exact: true, level: 1 })).toBeVisible()
      await expect(page.locator('.glove-app')).toContainText('Raleigh rooftop inspection')
      await expect(page.locator('.glove-app')).not.toContainText('Phoenix rooftop inspection')
      for (const width of [1440, 390]) { await page.setViewportSize({ width, height: 1050 }); await shot(page, width, 'limited-jobs') }
    } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  } finally { await h.close() }
})
