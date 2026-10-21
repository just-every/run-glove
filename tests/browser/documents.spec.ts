// @ts-expect-error Deterministic synthetic image originals.
import { documentPhoto, documentLogo, documentSignature } from '../fixtures/document-images.mjs'
import { test, expect, type Page, type Locator } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Production Worker/native sessions/D1 fixture.
import { installation, business, acceptedQuote } from '../api/harness.mjs'
// @ts-expect-error Test-only PDF reader; no product/network substitute.
import parsePdf from 'pdf-parse/lib/pdf-parse.js'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const png = documentPhoto
const photo = { mediaType: 'image/png', base64: png }
async function shot(page: Page, width: number, name: string, panel?: Locator) {
  const directory = process.env.GLOVE_SCREENSHOTS
  if (!directory) return
  await mkdir(directory, { recursive: true })
  await (panel ?? page).screenshot({ path: join(directory, `${width}-${name}.png`), ...(panel ? {} : { fullPage: true }) })
}
async function send(page: Page, button: Locator) {
  const response = page.waitForResponse(r => r.url() === origin + '/api/glove/commands' && r.request().method() === 'POST')
  await button.click(); const result = await (await response).json()
  expect(result.ok, JSON.stringify(result.error ?? {})).toBe(true)
  await expect(page.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  return result.result
}
async function pdf(page: Page, width: number, kind: string, expected: string[], images: number) {
  await expect(page.getByRole('button', { name: 'Print / Save PDF', exact: true })).toBeVisible()
  await expect.poll(() => page.locator('.printable-document img').evaluateAll(imgs => imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true)
  const originalUrl = page.url(), token = new URLSearchParams(new URL(originalUrl).hash.slice(1)).get('token')
  const bytes = await page.pdf({ format: 'Letter', printBackground: true, tagged: true, displayHeaderFooter: true })
  expect(page.url()).toBe(originalUrl)
  if (token) expect(bytes.toString('latin1')).not.toContain(token)
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  const parsed = await parsePdf(bytes), text = parsed.text.replace(/\s+/g, ' ')
  for (const value of expected) expect(text, `${kind} PDF contains ${value}`).toContain(value)
  expect((bytes.toString('latin1').match(/\/Subtype\s*\/Image\b/g) ?? []).length).toBeGreaterThanOrEqual(images)
  expect(text).not.toContain('Changes requested')
  if (process.env.GLOVE_BROWSER_OUTPUT) await writeFile(join(process.env.GLOVE_BROWSER_OUTPUT, `${width}-${kind}.pdf`), bytes)
}

test('QUOTE-005 branded templates, quote HTML and PDF, invoice, immutable report and agreement at 1440 and 390', async ({ browser }) => {
  const h = await installation(), b = await business(h)
  const context = await browser.newContext(), page = await context.newPage()
  try {
    let current = (await h.state()).business[0]
    await h.command('business.save', { ...current, legalName: 'Synthetic Glove LLC', dba: 'Synthetic Trade', abn: '12-3456789', address: '125 Test Street, Austin TX 78701', phone: '(512) 555-0125', licenses: [{ trade: 'Plumbing', state: 'TX', number: 'synthetic-glove-12' }, { trade: 'HVAC', state: 'TX', number: 'synthetic-glove-13' }], insurance: { carrier: 'Synthetic Insurer', policy: 'synthetic-glove-14', expires: '2028-12-31' }, logo: { mediaType: 'image/png', base64: documentLogo } })
    const item = await h.command('service.save', { code: 'DOC-BROWSER', name: 'Water heater service', description: 'Protect your home with a complete inspection and service.', unitPrice: '1850.00', unitCost: '1091.50', image: photo })
    await h.command('form.save', { name: 'Water heater inspection', serviceIds: [item.id], questions: [{ id: 'running', label: 'Unit running?', type: 'yesno', required: true }, { id: 'pressure', label: 'Water pressure', type: 'reading', unit: 'psi', min: '40', max: '80', required: true }, { id: 'notes', label: 'Inspection notes', type: 'notes', required: true }] })
    const accepted = await acceptedQuote(h, { ...b, service: item }, 'Water heater service')
    const job = await b.dispatcher.run('job.create', { quoteId: accepted.id })
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-03', start: '09:00', end: '10:00' })
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'form', formId: job.forms[0].id, answers: { running: true, pressure: '95', notes: 'Expansion tank needs attention' } })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'photo', photo, caption: 'Water heater installation' })
    await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', description: 'Copper fitting', quantity: '2', unit: 'each' })
    await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed the heater inspection', findings: 'High water pressure', recommendations: [{ title: 'Pressure regulator', description: 'Fit a regulator before the next service' }], signoff: { customerName: 'Dr Mei Lin', signature: { mediaType: 'image/png', base64: documentSignature } } })
    const report = (await h.state()).serviceReports.find((r: any) => r.visitId === visit.id)
    const reportLink = await h.command('report.link', { reportId: report.id })
    let invoice = await b.office.run('invoice.prepare', { jobId: job.id, lines: [{ description: item.name, quantity: '1', unitPrice: item.unitPrice, serviceId: item.id }] })
    invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    const plan = await h.command('plan.save', { name: 'Synthetic annual maintenance', price: '240.00', termMonths: 12, includedVisits: 2, visitServiceId: item.id, repairDiscountPercent: '15', priorityBooking: true })
    const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, startDate: '2026-11-01', via: 'phone' })
    let quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Water heater replacement', lines: [{ serviceId: item.id, description: item.name, quantity: '1', unitPrice: item.unitPrice }], terms: 'Work begins after your recorded acceptance.' })
    quote = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await context.route(`${origin}/api/glove/**`, async route => {
      const req = route.request(), url = new URL(req.url()), publicDoor = url.pathname.startsWith('/api/glove/public/')
      const response = await h.request(url.pathname + url.search, { method: req.method(), as: publicDoor ? '' : h.owner(), headers: publicDoor ? { authorization: req.headers().authorization ?? '' } : {}, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    const identity = ['Synthetic Glove LLC', 'Synthetic Trade', '12-3456789', 'synthetic-glove-12', 'synthetic-glove-13', 'Synthetic Insurer']
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${origin}/app#team`); await page.reload()
      const templates = page.getByRole('region', { name: 'Document templates', exact: true })
      await templates.getByLabel('Document heading').fill('Your service proposal')
      await templates.getByLabel('Document terms').fill('Payment due in 14 days. Thank you for choosing our team.')
      await templates.getByLabel('Document footer').fill('Synthetic customer service footer')
      await send(page, templates.getByRole('button', { name: 'Save document template' }))
      await shot(page, width, 'document-template', templates)
      await page.goto(`${origin}/app#quotes`)
      await page.getByRole('button', { name: `${quote.number} · ${quote.title}`, exact: true }).click()
      const photos = page.getByRole('region', { name: 'Customer document photos', exact: true })
      if (width === 1440) {
        await photos.getByLabel('Document photo', { exact: true }).setInputFiles({ name: 'synthetic-glove-15.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
        await photos.getByLabel('Photo caption').fill('Existing water heater site photo')
        await expect(photos.getByRole('button', { name: 'Attach customer photo' })).toBeEnabled()
        await send(page, photos.getByRole('button', { name: 'Attach customer photo' }))
      }
      await expect(photos.getByText('Existing water heater site photo', { exact: true })).toBeVisible()
      await shot(page, width, 'document-photo', photos)
      const result = await send(page, page.getByRole('button', { name: 'Create customer link', exact: true }))
      await page.goto(`${origin}/quote#token=${result.token}`)
      await expect(page.getByRole('heading', { name: `Your service proposal ${quote.number}`, exact: true })).toBeVisible()
      const quotePage = page.getByRole('region', { name: 'Your quote', exact: true })
      for (const value of [...identity, item.description, 'Existing water heater site photo', 'Payment due in 14 days. Thank you for choosing our team.']) await expect(quotePage.getByText(value, { exact: false }).first()).toBeVisible()
      await expect(quotePage.getByRole('img', { name: 'Harbour Air & Electrical logo' })).toBeVisible()
      await shot(page, width, 'branded-quote')
      await pdf(page, width, 'quote', [...identity, item.description, 'Existing water heater site photo', 'Payment due in 14 days.'], 2)
      for (const [kind, id] of [['invoice', invoice.id], ['agreement', agreement.id]]) {
        await page.goto(`${origin}/document?kind=${kind}&id=${id}`)
        const document = page.getByRole('article', { name: `${kind} document`, exact: true })
        for (const value of identity) await expect(document.getByText(value, { exact: false }).first()).toBeVisible()
        await expect(document.getByRole('img')).toHaveCount(kind === 'invoice' ? 2 : 1)
        await shot(page, width, `branded-${kind}`)
        await pdf(page, width, kind, [...identity, kind === 'invoice' ? item.description : '2 included visits'], kind === 'invoice' ? 2 : 1)
      }
      await page.goto(`${origin}/report#token=${reportLink.token}`)
      const reportPage = page.getByRole('article', { name: 'Service report', exact: true })
      const reportFields = [...identity, job.number, 'Harbourview Dental', b.site.address, 'Priya', 'Completed the heater inspection', 'High water pressure', 'Completed Nov 3, 2026', 'Water heater inspection', 'Unit running?', 'Yes', 'Water pressure', '95 psi', 'Out of range', 'expected 40–80 psi', 'Inspection notes', 'Expansion tank needs attention', 'Water heater installation', 'Copper fitting', '2 each', 'Dr Mei Lin', 'Pressure regulator', 'Fit a regulator before the next service']
      for (const value of reportFields) await expect(reportPage.getByText(value, { exact: false }).first()).toBeVisible()
      await expect(reportPage.getByRole('img')).toHaveCount(3)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await shot(page, width, 'branded-report')
      await pdf(page, width, 'report', reportFields, 3)
    }
  } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
