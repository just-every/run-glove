import { test, expect, type Page } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error Native Worker fixture.
import { installation, business } from '../api/harness.mjs'
// @ts-expect-error Named steps do not add registrations.
import { scenario } from '../fixtures/scenario.mjs'
// @ts-expect-error Deterministic originals.
import { documentPhoto, documentLogo, documentSignature } from '../fixtures/document-images.mjs'
// @ts-expect-error Local PDF reader.
import parsePdf from 'pdf-parse/lib/pdf-parse.js'

const photo = { mediaType: 'image/png', base64: documentPhoto }
const fixedAt = '2030-03-01T00:30:00.000Z'
const legacyAddress = '14 Harbour St, Balmain NSW 2041'
async function presentationFixture(h) {
  const b = await business(h, { currency: 'USD', timezone: 'America/Chicago', email: '', phone: '5125550125', address: legacyAddress, insurance: { carrier: 'Synthetic Insurer', policy: 'synthetic-glove-190', expires: '2031-12-31' }, logo: { mediaType: 'image/png', base64: documentLogo } })
  const sub = await h.person('Sid Presentation', 'subcontractor')
  await h.setTime(fixedAt)
  const service = await h.command('service.save', { code: 'synthetic-glove-190', name: 'Heating inspection', description: 'Inspect the heat exchanger and test airflow.', unitPrice: '200.00', tax: 'FREE', image: photo })
  const form = await h.command('form.save', { name: 'Heating readings', serviceIds: [service.id], questions: [{ id: 'pressure', label: 'Supply pressure', type: 'reading', unit: 'psi', min: '40', max: '80', required: true }, { id: 'image', label: 'Reading original', type: 'photo', required: true }] })
  const options = ['Standard service', 'Extended service'].map((name, i) => ({ name, lines: [{ serviceId: service.id, description: `${name} line`, quantity: '1', unitPrice: i ? '300.00' : '200.00', tax: 'FREE' }, { description: `${name} final line`, quantity: '2', unitPrice: '5.00', tax: 'FREE' }] }))
  const addOns = [{ name: 'Filter pack', lines: [{ serviceId: service.id, description: 'Replacement filter line', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }]
  const makeQuote = async (title, validUntil = '2030-03-31') => {
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, options, addOns, validUntil, terms: 'Schedule work with the office before entry.', notes: 'Retain this proposal for your records.' })
    q = await h.command('document.photo', { kind: 'quote', id: q.id, version: q.version, photo, caption: `${title} original` })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    return { q, link: await h.command('quote.link', { quoteId: q.id, version: q.version }) }
  }
  for (const kind of ['quote', 'invoice', 'report', 'agreement']) await h.command('document.template', { kind, version: (await h.state()).business[0].version, heading: kind === 'report' ? 'Service report' : kind === 'agreement' ? 'Service agreement' : kind === 'invoice' ? 'Invoice' : 'Quote', terms: `${kind} document terms retained.`, footer: `${kind} final customer footer.` })
  const open = await makeQuote('Open heating proposal')
  const expired = await makeQuote('Expired heating proposal', '2030-02-27')
  const decided = await makeQuote('Decided heating proposal')
  const response = await h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${decided.link.token}` }, body: { action: 'decline', name: 'Synthetic Customer', capacity: 'Property manager' } })
  assert.equal(response.status, 200)
  const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Completed heating inspection', lines: options[0].lines })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2030-02-28', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  const captured = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'form', formId: job.forms[0].id, answers: { pressure: '95', image: photo } })
  const original = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'photo', photo, caption: 'Heat exchanger original' })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', description: 'Copper fitting', quantity: '2', unit: 'each' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed inspection with airflow test.', findings: 'Pressure above the recorded range.', recommendations: [{ title: 'Pressure regulator', description: 'Discuss regulator work with the office.' }], signoff: { customerName: 'Synthetic Customer', signature: { mediaType: 'image/png', base64: documentSignature } } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
  const reportLink = await h.command('report.link', { reportId: report.id })
  let invoice = await b.office.run('invoice.prepare', { jobId: job.id, lines: options[0].lines })
  invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  invoice = await h.command('document.photo', { kind: 'invoice', id: invoice.id, version: invoice.version, photo, caption: 'Invoice inspection original' })
  const plan = await h.command('plan.save', { name: 'Annual heating care', price: '240.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '0', priorityBooking: true })
  let agreement = await h.command('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, startDate: '2030-03-01', via: 'phone' })
  agreement = await h.command('document.photo', { kind: 'agreement', id: agreement.id, version: agreement.version, photo, caption: 'Agreement inspection original' })
  const read = (scope, token, path = '', extra = {}) => h.request(`/api/glove/public/${scope}${path}`, { as: '', headers: { authorization: `Bearer ${token}` }, ...extra })
  const desk = (kind, as = h.owner()) => h.request(`/api/glove/documents/${kind}/${kind === 'invoice' ? invoice.id : agreement.id}`, { as })
  return { b, sub, service, options, addOns, makeQuote, open, expired, decided, job, visit, captured, original, report, reportLink, invoice, agreement, read, desk }
}

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const hiddenPrintText = ['Print / Save PDF', 'Choose Save as PDF', 'Choose Standard service', 'Choose Extended service', 'Add Filter pack', 'Review selected work', 'Contact the office about this quote', 'Your name', 'Your capacity', 'Request changes', 'Decline quote', 'Ask for an updated quote', 'Approve the selected work', 'Sign and approve selected work', 'Type my signature', 'Draw my signature']

async function loadedOriginals(page: Page) {
  await expect(page.getByText('Loading image…', { exact: true })).toHaveCount(0)
  await expect.poll(() => page.locator('.printable-document img').evaluateAll(imgs => imgs.length > 0 && imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true)
}

let printNumber = 0
async function buttonPdf(page: Page, expected: string[], name: string, width: number) {
  await expect(page.getByRole('button', { name: 'Print / Save PDF', exact: true })).toBeVisible()
  await loadedOriginals(page)
  const originalUrl = page.url(), token = new URLSearchParams(new URL(originalUrl).hash.slice(1)).get('token')
  let bytes: Buffer | undefined, invocation = ''
  let resolvePrint: () => void, rejectPrint: (error: unknown) => void
  const printed = new Promise<void>((resolve, reject) => { resolvePrint = resolve; rejectPrint = reject })
  // Replace only the interactive dialog with Chromium's PDF renderer. The
  // production button and both native print lifecycle events remain in use.
  const binding = `renderDocumentPdf${++printNumber}`
  await page.exposeFunction(binding, async (url: string) => {
    try {
      invocation = url
      await page.emulateMedia({ media: 'print' })
      bytes = await page.pdf({ format: 'Letter', printBackground: true, tagged: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<span class="url"></span><span class="pageNumber"></span>' })
      await page.emulateMedia({ media: null })
      resolvePrint()
    } catch (error) { rejectPrint(error) }
  })
  await page.evaluate(binding => {
    const w = window as any
    w.printUrls = []; w.printControls = []
    window.addEventListener('beforeprint', () => {
      w.printUrls.push(location.href)
      w.printControls.push([...document.querySelectorAll('.printable-document button, .printable-document input, .printable-document textarea, .printable-document select')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').length)
    })
    window.print = () => { void w[binding](location.href) }
  }, binding)
  await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).click()
  await printed
  expect(invocation).toBe(originalUrl.split('#')[0])
  const during = await page.evaluate(() => (window as any).printUrls)
  expect(during.length).toBeGreaterThan(0)
  for (const url of during) expect(url).toBe(originalUrl.split('#')[0])
  expect(await page.evaluate(() => (window as any).printControls)).toEqual(during.map(() => 0))
  expect(page.url()).toBe(originalUrl)
  expect(bytes!.subarray(0, 5).toString()).toBe('%PDF-')
  const parsed = await parsePdf(bytes), text = normalize(parsed.text)
  if (token) { expect(bytes!.toString('latin1')).not.toContain(token); expect(text).not.toContain(token) }
  expect(text).not.toContain('token=')
  for (const value of expected) expect(text, `${name} prints ${value}`).toContain(value)
  for (const control of hiddenPrintText) expect(text, `${name} excludes response control ${control}`).not.toContain(control)
  expect((bytes!.toString('latin1').match(/\/Subtype\s*\/Image\b/g) ?? []).length).toBeGreaterThanOrEqual(name === 'report' ? 4 : name === 'agreement' ? 2 : 3)
  expect(text).not.toContain('5125550125')
  expect(text).not.toContain('+1 212 555 0199')
  const directory = process.env.GLOVE_BROWSER_OUTPUT
  if (directory) { await mkdir(directory, { recursive: true }); await writeFile(join(directory, `${width}-${name}.pdf`), bytes!) }
  return text
}

test('QUOTE-015 scoped documents print complete facts without controls or bearer fragments at 1440 and 390', async ({ browser }) => {
  const h = await installation({ at: fixedAt }), f = await presentationFixture(h)
  const context = await browser.newContext(), page = await context.newPage()
  const steps = { diagnostic: (name: string) => test.info().annotations.push({ type: 'point', description: name }), after: () => {} }
  const allTexts: Record<string, string> = {}
  const urls = {
    open: `${origin}/quote#token=${f.open.link.token}`,
    expired: `${origin}/quote#token=${f.expired.link.token}`,
    decided: `${origin}/quote#token=${f.decided.link.token}`,
    report: `${origin}/report#token=${f.reportLink.token}`,
    invoice: `${origin}/document?kind=invoice&id=${f.invoice.id}`,
    agreement: `${origin}/document?kind=agreement&id=${f.agreement.id}`,
  }
  const base = [legacyAddress, 'Dec 31, 2031', 'Synthetic Insurer']
  const quoteFields = ['Feb 28, 2030', 'Mar 31, 2030', 'America/Chicago', '(512) 555-0125', 'Standard service line', 'Standard service final line', 'Extended service line', 'Extended service final line', 'Replacement filter line', 'Inspect the heat exchanger and test airflow.', '210.00', '310.00', 'Schedule work with the office before entry.', 'Retain this proposal for your records.', 'quote document terms retained.', 'quote final customer footer.']
  const expected: Record<string, string[]> = {
    open: [...base, ...quoteFields, 'Open heating proposal original', 'Online signing is unavailable pending the owner’s consent disclosure.'],
    expired: [...base, ...quoteFields, 'Feb 27, 2030', 'Expired heating proposal original', 'This quote has expired.'].filter(v => v !== 'Mar 31, 2030'),
    decided: [...base, ...quoteFields, 'Decided heating proposal original', 'This revision is declined and is read-only.'],
    report: [...base, '(512) 555-0125', 'Feb 28, 2030', 'America/Chicago', 'Completed heating inspection', 'Harbourview Dental', 'Priya', 'Completed inspection with airflow test.', 'Pressure above the recorded range.', 'Heating readings', 'Supply pressure', '95 psi', 'Out of range', 'expected 40–80 psi', 'Reading original', 'Heat exchanger original', 'Copper fitting', '2 each', 'Signed by Synthetic Customer', 'Pressure regulator', 'Discuss regulator work with the office.', 'report document terms retained.', 'report final customer footer.'],
    invoice: [...base, '(512) 555-0125', 'Feb 28, 2030', 'Due Mar 14, 2030', 'approved', 'Standard service line', 'Standard service final line', '210.00', 'Invoice inspection original', 'invoice document terms retained.', 'invoice final customer footer.'],
    agreement: [...base, '(512) 555-0125', 'Mar 1, 2030', 'Feb 28, 2031', 'sold', 'Annual heating care', '2 included visits', '240.00', 'Agreement inspection original', 'agreement document terms retained.', 'agreement final customer footer.'],
  }
  try {
    if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
    await page.goto(process.env.GLOVE_OPEN)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
    await context.route(`${origin}/api/glove/**`, async route => {
      const request = route.request(), url = new URL(request.url()), publicDoor = url.pathname.startsWith('/api/glove/public/')
      const response = await h.request(url.pathname + url.search, { method: request.method(), as: publicDoor ? '' : h.owner(), headers: publicDoor ? { authorization: request.headers().authorization ?? '' } : {}, ...(request.postData() ? { body: JSON.parse(request.postData()!) } : {}) })
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
    })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await scenario(steps, 'point 1: customer and desk built pages use their actual scoped document doors', async () => {
      await page.goto(urls.open)
      await expect(page.getByRole('heading', { name: 'Open heating proposal', exact: true })).toBeVisible()
      const wrong = await page.evaluate(async token => (await fetch('/api/glove/public/reports', { headers: { authorization: `Bearer ${token}` } })).status, f.open.link.token)
      expect(wrong).toBe(404)
      await page.goto(urls.report)
      await expect(page.getByRole('article', { name: 'Service report', exact: true })).toBeVisible()
      for (const kind of ['invoice', 'agreement']) { await page.goto(urls[kind]); await expect(page.getByRole('article', { name: `${kind} document`, exact: true })).toBeVisible() }
    })
    await scenario(steps, 'point 2: independent US date and phone expectations preserve legacy address and frozen zone', async () => {
      for (const kind of Object.keys(urls)) {
        await page.goto(urls[kind]); await expect(page.locator('.printable-document')).toBeVisible()
        const content = normalize(await page.locator('.printable-document').innerText())
        for (const value of expected[kind]) expect(content, `${kind} shows ${value}`).toContain(value)
      }
      for (const [phone, shown] of [['+1 212 555 0199', '(212) 555-0199'], ['020 7946 0958 ext 7', '020 7946 0958 ext 7']]) {
        await h.command('business.save', { ...(await h.state()).business[0], logo: undefined, phone, timezone: 'Australia/Sydney' })
        await page.goto(urls.invoice)
        await expect(page.locator('.document-identity')).toContainText(shown)
        await buttonPdf(page, [shown, legacyAddress, 'Due Mar 14, 2030'], 'invoice', 1440)
      }
      await page.goto(urls.open)
      await expect(page.locator('.printable-document')).toContainText('America/Chicago')
      await expect(page.locator('.document-identity')).toContainText('(512) 555-0125')
      await h.command('business.save', { ...(await h.state()).business[0], logo: undefined, phone: '5125550125' })
    })
    await scenario(steps, 'point 3: real print button and Chromium renderer omit controls and bearer while retaining all content at both widths', async () => {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 })
        for (const [kind, url] of Object.entries(urls)) {
          await page.goto(url); await expect(page.locator('.printable-document')).toBeVisible()
          if (kind === 'open') { await page.getByRole('radio', { name: 'Choose Extended service', exact: true }).check(); await page.getByRole('checkbox', { name: 'Add Filter pack', exact: true }).check() }
          if (width === 1440) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          await loadedOriginals(page)
          if (process.env.GLOVE_SCREENSHOTS) { await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-${kind}.png`), fullPage: true }) }
          allTexts[`${width}-${kind}`] = await buttonPdf(page, expected[kind], kind, width)
        }
      }
    })
    await scenario(steps, 'point 4: unsigned quote and recorded desk facts remain honest after actual Worker restart', async () => {
      for (const kind of ['open', 'invoice', 'agreement']) {
        await page.goto(urls[kind]); await expect(page.locator('.printable-document')).toBeVisible()
        // Visibility precedes original-image fetches. Finish them before the
        // real Worker restart closes its connections.
        await loadedOriginals(page)
        await expect(page.getByRole('region', { name: 'Signed approval', exact: true })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Sign and approve selected work' })).toHaveCount(0)
        const text = allTexts[`1440-${kind}`]
        expect(text).not.toMatch(/\b(?:Signed by|Sent to|Delivered to|Confirmation copy queued)\b/i)
      }
      await h.restart()
      await page.setViewportSize({ width: 1440, height: 1000 })
      for (const [kind, url] of Object.entries(urls)) {
        await page.goto(url); await expect(page.locator('.printable-document')).toBeVisible()
        expect(await buttonPdf(page, expected[kind], kind, 1440)).toBe(allTexts[`1440-${kind}`])
      }
      expect(h.email.sent).toHaveLength(0)
    })
  } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
})
