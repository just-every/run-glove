import { restartHarness } from './harness-route'
import { closeHarnessContext, harnessRoute, unrouteHarness } from './harness-route'
import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Real production Worker/native sessions/D1 fixture, only provider edges are fake.
import { installation } from '../api/harness.mjs'

test.use({ actionTimeout: 15_000, navigationTimeout: 30_000 })
const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
async function send(page: Page, button: Locator) {
  const answer = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  await button.click()
  const body = await (await answer).json()
  expect(body.ok, JSON.stringify(body.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return body.result
}
async function screens(page: Page, name: string, anchor?: Locator) {
  console.log('MONEY-001 screen:', name)
  const viewport = page.viewportSize()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    if (anchor) await anchor.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-money-${name}.png`) }) }
  }
  if (viewport) await page.setViewportSize(viewport)
}

test('MONEY-001, MONEY-004, MONEY-005 owner manages branch rates, private exemption evidence, Stripe and Avalara AvaTax proposals and frozen quote/invoice tax at 1440 and 390', async ({ browser }) => {
  const h = await installation(), empty = await installation()
  try {
    const settings = (id: string, name: string, rate: string, zip: string) => ({ jurisdictions: [{ id, name, rate, zips: [zip], taxLabor: false }] })
    await h.command('business.save', { name: 'Pacheco Plumbing & HVAC', timezone: 'America/Chicago', taxSettings: settings('austin', 'Austin combined', '8.25', '78704') })
    const east = await h.command('branch.save', { name: 'Raleigh', prefix: 'RAL', timezone: 'America/New_York', zips: ['27601'], taxSettings: settings('wake', 'Wake combined', '4.5', '27601') })
    const part = await h.command('service.save', { code: 'VALVE', name: 'Replacement valve', kind: 'material', unitPrice: '100.01', tax: 'TAXABLE' })
    const labor = await h.command('service.save', { code: 'LABOR', name: 'Install labor', kind: 'service', unitPrice: '50.03', tax: 'TAXABLE' })
    const work = []
    for (const [name, address, branchId, personName] of [
      ['Austin School', '10 Service St, Austin TX 78704', null, 'Priya Nair'],
      ['Raleigh School', '101 Fayetteville St, Raleigh NC 27601', east.id, 'Tom Brooks'],
    ] as const) {
      const customer = await h.command('customer.save', { name, taxExemption: { certificateNumber: 'SCHOOL-2026', expires: '2099-12-31' } })
      const site = await h.command('site.save', { customerId: customer.id, address, branchId })
      const person = await h.person(personName, 'technician')
      const tech = await h.command('technician.save', { name: personName, operatorId: person.id, branchId })
      const q = await h.command('quote.draft', { customerId: customer.id, siteId: site.id, title: 'School valve repair', lines: [part, labor].map(x => ({ description: x.name, serviceId: x.id, unitPrice: x.unitPrice, quantity: '1' })) })
      const approved = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      await h.command('quote.accept', { quoteId: q.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Facilities manager' })
      const job = await h.command('job.create', { quoteId: q.id })
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())
      const visit = await h.command('visit.book', { jobId: job.id, technicianId: tech.id, date, start: '09:00', end: '10:00' })
      await person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      await person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Valve installed and tested', signoff: { absentReason: 'Facilities manager away' } })
      const draft = await h.command('invoice.prepare', { jobId: job.id })
      const inv = await h.command('invoice.approve', { invoiceId: draft.id, version: draft.version, revision: 1 })
      work.push({ customer, site, q, inv })
    }
    h.stripeTax.answer = (body: any) => ({ id: 'taxcalc_sample', tax_breakdown: [{ taxability_reason: body['line_items[0][tax_code]'] === 'txcd_99999999' ? 'standard_rated' : 'product_exempt', tax_rate_details: { percentage_decimal: '8.25' } }] })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } }), page = await context.newPage()
    try {
      if (!process.env.GLOVE_OPEN) throw new Error('Private rer dev owner entry required.')
      try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      let backend = empty
      await harnessRoute(page, `${origin}/api/glove/**`, async route => {
        const req = route.request(), url = new URL(req.url())
        const response = await backend.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
        await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
      })
      await page.goto(`${origin}/app#team`)
      const first = page.getByRole('heading', { name: 'Set up your business', exact: true }).locator('..')
      await expect(first.getByLabel('Billing currency', { exact: true })).toHaveValue('USD')
      await expect(first.getByLabel('Timezone for bookings', { exact: true })).toHaveValue('America/Chicago')
      await first.getByLabel('Business name', { exact: true }).fill('Austin Service Company')
      await screens(page, 'new-us-installation', first)
      await send(page, first.getByRole('button', { name: 'Save business', exact: true }))
      expect((await empty.state()).business[0].currency).toBe('USD')
      backend = h
      await page.reload()
      const business = page.getByRole('heading', { name: 'Business', exact: true }).locator('..')
      await business.getByLabel('Jurisdiction name', { exact: true }).fill('Austin city and county')
      const zips = business.getByLabel('Tax jurisdiction ZIP codes', { exact: true })
      await zips.selectText(); await zips.pressSequentially('78704, 78745')
      await expect(zips).toHaveValue('78704, 78745')
      await send(page, business.getByRole('button', { name: 'Save business', exact: true }))
      expect((await h.state()).business[0].taxSettings.jurisdictions[0].zips).toEqual(['78704', '78745'])
      await screens(page, 'business-tax', business.getByLabel('Combined sales-tax rate (%)', { exact: true }))
      const branch = page.getByRole('form', { name: 'Branch Raleigh', exact: true })
      await expect(branch.getByLabel('Combined sales-tax rate (%)', { exact: true })).toHaveValue('4.5')
      await screens(page, 'branch-tax', branch.getByLabel('Jurisdiction name', { exact: true }))
      await screens(page, 'pricebook-tax', page.getByLabel('Tax treatment', { exact: true }))
      const lookup = page.getByRole('region', { name: 'Optional Stripe Tax lookup', exact: true })
      await lookup.getByLabel('Stripe Tax secret key', { exact: true }).fill('fixture-stripe-tax-credential')
      await send(page, lookup.getByRole('button', { name: 'Connect Stripe Tax lookup', exact: true }))
      await lookup.getByLabel('Lookup service site', { exact: true }).selectOption(work[0].site.id)
      for (const [label, value] of [['Service street', '10 Service St'], ['Service city', 'Austin'], ['Service state', 'TX'], ['Service ZIP', '78704']]) await lookup.getByLabel(label, { exact: true }).fill(value)
      await send(page, lookup.getByRole('button', { name: 'Look up address rates', exact: true }))
      await expect(lookup).toContainText('8.25%')
      await screens(page, 'stripe-proposal', lookup.getByRole('status'))
      const texas = (taxable: boolean) => [['TEXAS', 0.0625], ['TRAVIS', 0.01], ['AUSTIN', 0.01]].map(([jurisName, rate]) => taxable ? { jurisName, rate, taxableAmount: 100, nonTaxableAmount: 0, exemptAmount: 0 } : { jurisName, rate: 0, taxableAmount: 0, nonTaxableAmount: 100, exemptAmount: 0 })
      h.avatax.answer = () => ({ code: 'so-sample', lines: [{ lineNumber: 'parts', details: texas(true) }, { lineNumber: 'service', details: texas(false) }] })
      const avalara = page.getByRole('region', { name: 'Optional Avalara AvaTax lookup', exact: true })
      for (const [label, value] of [['AvaTax account ID', '1100012345'], ['AvaTax license key', 'fixture-avatax-license'], ['AvaTax company code', 'PACHECO']]) await avalara.getByLabel(label, { exact: true }).fill(value)
      await send(page, avalara.getByRole('button', { name: 'Connect AvaTax lookup', exact: true }))
      await avalara.getByLabel('Lookup service site', { exact: true }).selectOption(work[0].site.id)
      for (const [label, value] of [['Service street', '10 Service St'], ['Service city', 'Austin'], ['Service state', 'TX'], ['Service ZIP', '78704'], ['AvaTax service tax code', 'SV060100']]) await avalara.getByLabel(label, { exact: true }).fill(value)
      await send(page, avalara.getByRole('button', { name: 'Look up address rates', exact: true }))
      await expect(avalara.getByRole('status')).toContainText('Austin, TX combined: 8.25%; service labor exempt')
      await screens(page, 'avatax-proposal', avalara.getByRole('status'))
      h.avatax.answer = () => ({ code: 'so-no-nexus', lines: [{ lineNumber: 'parts', details: [] }, { lineNumber: 'service', details: [] }] })
      await send(page, avalara.getByRole('button', { name: 'Look up address rates', exact: true }))
      await expect(avalara.getByRole('status')).toContainText('Rate unavailable for automatic application')
      await expect(avalara.getByRole('status')).not.toContainText('0%')
      await screens(page, 'avatax-unavailable', avalara.getByRole('status'))
      expect(h.avatax.calls.length).toBe(2)
      await page.goto(`${origin}/app#customers`)
      await page.getByRole('button', { name: 'Austin School', exact: true }).click()
      const exemption = page.getByRole('region', { name: 'Sales-tax exemption', exact: true })
      await exemption.getByLabel('Private exemption certificate', { exact: true }).setInputFiles({ name: 'school-certificate.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH0cAAAAASUVORK5CYII=', 'base64') })
      await send(page, exemption.getByRole('button', { name: 'File certificate document', exact: true }))
      await expect(exemption.getByRole('link', { name: 'Download private certificate', exact: true })).toBeVisible()
      await screens(page, 'certificate', exemption)
      await screens(page, 'site-tax', page.getByLabel('Site tax jurisdiction', { exact: true }).first())
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${work[0].q.number} · School valve repair`, exact: true }).click()
      await expect(page.locator('.page')).toContainText('Austin combined · 8.25% on $100.01')
      await screens(page, 'quote-tax', page.getByRole('cell', { name: 'Austin combined · 8.25% on $100.01', exact: true }))
      await page.goto(`${origin}/app#invoices`)
      await page.getByRole('button', { name: work[0].inv.number, exact: true }).click()
      await expect(page.locator('.page')).toContainText('Austin combined · 8.25% on $100.01')
      await screens(page, 'invoice-tax', page.getByRole('cell', { name: 'Austin combined · 8.25% on $100.01', exact: true }))
      for (const [label, value] of [['QuickBooks customer ID', '58'], ['QuickBooks sales item ID', '41'], ['QuickBooks tax code ID', '7']]) await page.getByLabel(label, { exact: true }).fill(value)
      await expect(page.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true })).toBeVisible()
      await screens(page, 'qbo-inspection', page.getByRole('link', { name: 'Download QuickBooks inspection payload', exact: true }))
      await page.goto(`${origin}/app#reports`)
      const issuedDates = work.map(({ inv }) => inv.dates.issuedOn).sort()
      await page.getByLabel('From', { exact: true }).fill(issuedDates[0])
      await page.getByLabel('To', { exact: true }).fill(issuedDates.at(-1)!)
      await page.getByLabel('Report', { exact: true }).selectOption('tax')
      await expect(page.locator('.page')).toContainText('Wake combined')
      await screens(page, 'tax-report', page.getByLabel('Report', { exact: true }))
      await page.getByLabel('Report branch', { exact: true }).selectOption(east.id)
      await expect(page.locator('.page')).not.toContainText('Austin combined')
      await screens(page, 'branch-tax-report', page.getByLabel('Report', { exact: true }))

      // Exercise the manual site choice through the real quote refusal and correction controls.
      await page.setViewportSize({ width: 1440, height: 1050 })
      await h.setTime('2026-11-06T15:00:00.000Z')
      const providerCalls = [h.stripeTax.calls.length, h.avatax.calls.length]
      await page.goto(`${origin}/app#team`)
      await business.getByRole('button', { name: 'Add tax jurisdiction', exact: true }).click()
      await business.getByLabel('Jurisdiction name', { exact: true }).nth(1).fill('Austin special district')
      await business.getByLabel('Combined sales-tax rate (%)', { exact: true }).nth(1).fill('9.5')
      await business.getByLabel('Tax jurisdiction ZIP codes', { exact: true }).nth(1).fill('78704')
      await expect(business.getByLabel('Default tax jurisdiction', { exact: true })).toHaveValue('')
      await send(page, business.getByRole('button', { name: 'Save business', exact: true }))
      const district = (await h.state()).business[0].taxSettings.jurisdictions.find((j: any) => j.name === 'Austin special district')
      const choiceCustomer = await h.command('customer.save', { name: 'Explicit tax customer' })
      const choiceSites = []
      for (const address of ['20 Service St, Austin TX 78704', '21 Service St, Austin TX 99999']) choiceSites.push(await h.command('site.save', { customerId: choiceCustomer.id, address }))
      const drafted = []
      for (const [index, site] of choiceSites.entries()) {
        const title = `Explicit site tax ${index + 1}`
        const startDraft = async () => {
          await page.goto(`${origin}/app#quotes`)
          await page.getByRole('button', { name: 'New quote', exact: true }).click()
          const form = page.getByRole('heading', { name: 'New quote', exact: true }).locator('..')
          await form.getByLabel('Customer', { exact: true }).selectOption(choiceCustomer.id)
          await form.getByLabel('Site', { exact: true }).selectOption(site.id)
          await form.getByLabel('Title', { exact: true }).fill(title)
          await form.getByLabel('From the price book', { exact: true }).selectOption(part.id)
          return form
        }
        await page.reload()
        const form = await startDraft(), before = await h.state()
        const response = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
        await form.getByRole('button', { name: 'Save draft', exact: true }).click()
        const refusal = await (await response).json()
        expect(refusal.ok).toBe(false)
        expect(refusal.error.code).toBe('TAX_JURISDICTION')
        await expect(form.getByRole('alert')).toHaveText(index === 0 ? 'More than one jurisdiction matches this ZIP. Select the site’s tax jurisdiction.' : 'Select a tax jurisdiction for the service address.')
        expect((await h.state()).quotes).toEqual(before.quotes)
        await screens(page, index === 0 ? 'ambiguous-quote-refusal' : 'unmatched-quote-refusal', form.getByRole('alert'))
        for (const [jurisdictionId, label, tax, total] of [
          ['austin', 'Austin city and county · 8.25% on $100.01', '8.25', '108.26'],
          [district.id, 'Austin special district · 9.5% on $100.01', '9.50', '109.51'],
        ]) {
          await page.goto(`${origin}/app#customers`)
          await page.getByRole('button', { name: choiceCustomer.name, exact: true }).click()
          const row = page.locator('.rows > li').filter({ has: page.getByText(site.address, { exact: true }) })
          await row.getByLabel('Site tax jurisdiction', { exact: true }).selectOption(jurisdictionId)
          await send(page, row.getByRole('button', { name: 'Save site tax jurisdiction', exact: true }))
          await expect(row.getByLabel('Site tax jurisdiction', { exact: true })).toHaveValue(jurisdictionId)
          if (index === 0) await screens(page, `explicit-site-${jurisdictionId === 'austin' ? 'city' : 'district'}`, row)
          const corrected = await startDraft()
          const quote = await send(page, corrected.getByRole('button', { name: 'Save draft', exact: true }))
          await expect(page.getByRole('cell', { name: label, exact: true })).toBeVisible()
          await expect(page.getByRole('row', { name: `Total incl. tax $${total}`, exact: true })).toBeVisible()
          expect(quote.revisions[0].totals.gst).toBe(tax)
          expect(quote.revisions[0].totals.taxContext.jurisdictionId).toBe(jurisdictionId)
          drafted.push(quote)
          if (index === 0) await screens(page, `explicit-quote-${jurisdictionId === 'austin' ? 'city' : 'district'}`, page.getByRole('cell', { name: label, exact: true }))
        }
      }
      const beforeRestart = await h.state()
      await restartHarness(h)
      const retained = await h.state()
      expect(retained.quotes).toEqual(beforeRestart.quotes)
      for (const quote of drafted) expect(retained.quotes.find((q: any) => q.id === quote.id).revisions).toEqual(quote.revisions)
      for (const site of choiceSites) expect(retained.sites.find((s: any) => s.id === site.id).taxJurisdictionId).toBe(district.id)
      await page.reload()
      await page.goto(`${origin}/app#customers`)
      await page.getByRole('button', { name: choiceCustomer.name, exact: true }).click()
      for (const site of choiceSites) await expect(page.locator('.rows > li').filter({ has: page.getByText(site.address, { exact: true }) }).getByLabel('Site tax jurisdiction', { exact: true })).toHaveValue(district.id)
      expect([h.stripeTax.calls.length, h.avatax.calls.length]).toEqual(providerCalls)
      // These screens changed only their missing-zone fallback; use the saved US installation.
      for (const route of ['today', 'dispatch', 'jobs', 'activity', 'move-in', 'rules', 'stock']) {
        await page.goto(`${origin}/app#${route}`)
        await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
        await screens(page, route)
      }
    } finally { await unrouteHarness(page); await closeHarnessContext(context) }
  } finally { await empty.close(); await h.close() }
})
