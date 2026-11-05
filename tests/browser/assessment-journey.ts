import { expect, type Browser, type Page } from '@playwright/test'
// @ts-expect-error Native HTTP Worker, sessions and persistent D1.
import { installation, business } from '../api/harness.mjs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { action, deskPage, origin } from './desk-fixture'

// Extend the existing service sanity journey; assertions run at 1440. The same
// saved screens are photographed at 390 without repeating the business flow.
export async function assessmentJourney(browser: Browser) {
  const fixed = '2026-11-16T15:00:00.000Z', device = '2026-11-16T15:05:00.000Z'
  const h = await installation({ at: fixed })
  const contexts = []
  const proof = async (page: Page, name: string) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1050 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const unlabelled = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).innerText.trim() && !n.querySelector('img[alt]:not([alt=""])') && !n.getAttribute('aria-describedby')).map(n => n.getAttribute('aria-label')))
      expect(unlabelled).toEqual([])
      if (process.env.GLOVE_SCREENSHOTS) {
        await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
        await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-assessment-${name}.png`), fullPage: true })
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 })
  }
  try {
    const b = await business(h, { currency: 'USD', timezone: 'America/Chicago' })
    const form = await h.command('form.save', { name: 'Water heater assessment', questions: [
      { id: 'clearance', label: 'Closet clearance', type: 'reading', unit: 'in', min: '20', max: '40', required: true },
      { id: 'vent', label: 'Venting', type: 'choice', options: ['Atmospheric', 'Power vent'], required: true },
    ] })
    const desk = await deskPage(browser, h, 1440, b.dispatcher.cookie)
    contexts.push(desk.context)
    const page = desk.page
    await page.clock.setFixedTime(new Date(fixed))
    await page.goto(`${origin}/app#quotes`)
    const requestForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Record a request', exact: true }) })
    await requestForm.getByLabel('Customer', { exact: true }).selectOption(b.customer.id)
    await requestForm.getByLabel('Site', { exact: true }).selectOption(b.site.id)
    await requestForm.getByLabel('What the customer needs', { exact: true }).fill('Replace the leaking water heater')
    const request = await action(page, requestForm.getByRole('button', { name: 'Record request', exact: true }))
    await page.getByRole('button', { name: 'Assessment', exact: true }).click()
    const booking = page.getByRole('form', { name: 'Book an assessment', exact: true })
    await booking.getByLabel('Assessor', { exact: true }).selectOption(b.priya.id)
    await booking.getByLabel('Assessment date', { exact: true }).fill('2026-11-16')
    await booking.getByLabel('Starts', { exact: true }).fill('09:00')
    await booking.getByLabel('Ends', { exact: true }).fill('10:00')
    await booking.getByLabel('Arrival window from (optional)', { exact: true }).fill('08:00')
    await booking.getByLabel('Arrival window until (optional)', { exact: true }).fill('10:00')
    await booking.getByLabel('Instructions', { exact: true }).fill('Measure the closet and inspect venting')
    await booking.getByLabel('Form to fill (optional)', { exact: true }).selectOption(form.id)
    await proof(page, 'booking')
    const { job, visit } = await action(page, booking.getByRole('button', { name: 'Book assessment', exact: true }))
    await expect(page.getByRole('link', { name: job.number, exact: true })).toHaveAttribute('href', `#jobs/${job.id}`)
    await page.goto(`${origin}/app#dispatch`)
    await page.getByLabel('Day', { exact: true }).fill('2026-11-16')
    const chip = page.getByRole('button', { name: new RegExp(`^${job.number} Assessment: Replace the leaking water heater, Priya N.`) })
    await expect(chip).toContainText('Assessment')
    await page.getByRole('button', { name: 'Previous day', exact: true }).focus()
    await expect(page.getByRole('tooltip', { name: 'Previous day', exact: true })).toBeVisible()
    await proof(page, 'board')

    const phone = await deskPage(browser, h, 1440, b.priyaPerson.cookie)
    contexts.push(phone.context)
    await phone.page.clock.setFixedTime(new Date(device))
    await phone.page.goto(`${origin}/app`)
    await phone.page.getByRole('button', { name: new RegExp(`^${job.number} · Assessment:`) }).click()
    await expect(phone.page.getByText('Today 9:00 AM – 10:00 AM · America/Chicago · arrival window 8:00 AM – 10:00 AM', { exact: true })).toBeVisible()
    const beforeOffline = await h.state()
    await phone.context.setOffline(true)
    await phone.page.getByRole('button', { name: 'Record arrival', exact: true }).click()
    await phone.page.getByLabel('Note', { exact: true }).fill('Closet is 30 inches wide; replace the gas shutoff')
    await phone.page.getByRole('button', { name: 'Add note', exact: true }).click()
    const survey = phone.page.getByRole('region', { name: 'Water heater assessment', exact: true })
    await survey.getByLabel('Closet clearance (in)', { exact: true }).fill('30')
    await survey.getByLabel('Venting', { exact: true }).selectOption('Atmospheric')
    await survey.getByRole('button', { name: 'Save Water heater assessment', exact: true }).click()
    for (const color of ['#a04f31', '#54829a']) {
      const png = await phone.page.evaluate(color => { const c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d')!; x.fillStyle = color; x.fillRect(0, 0, 32, 32); return c.toDataURL('image/png').split(',')[1] }, color)
      await phone.page.getByRole('region', { name: 'Photos', exact: true }).locator('input[type=file]').setInputFiles({ name: 'synthetic-glove-survey.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
      await expect(phone.page.locator('.photo-grid figure')).toHaveCount(color === '#a04f31' ? 1 : 2)
    }
    await phone.page.getByRole('button', { name: 'Complete visit', exact: true }).click()
    await phone.page.getByLabel('Work done', { exact: true }).fill('Measured the closet and assessed the replacement')
    await phone.page.getByRole('checkbox', { name: 'The customer is not here to sign', exact: true }).check()
    await phone.page.getByLabel('Why there is no sign-off', { exact: true }).fill('Tenant provided access; owner at work')
    await phone.page.getByRole('button', { name: 'Save completion', exact: true }).click()
    await expect(phone.page.getByText('Offline — 6 items waiting to send.', { exact: true })).toBeVisible()
    const queued = await phone.page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))
    expect(queued.map((q: any) => [q.type, q.payload.kind || null, q.payload.visitId, q.payload.deviceTime])).toEqual([
      ['visit.arrive', null, visit.id, device], ['visit.capture', 'note', visit.id, device], ['visit.capture', 'form', visit.id, device],
      ['visit.capture', 'photo', visit.id, device], ['visit.capture', 'photo', visit.id, device], ['visit.complete', null, visit.id, device],
    ])
    expect(await h.state()).toEqual(beforeOffline)
    await proof(phone.page, 'offline-phone')
    await phone.context.setOffline(false)
    await expect.poll(() => phone.page.evaluate(() => localStorage.getItem('glove.outbox'))).toBe('[]')
    await expect(phone.page.getByText('Visit completed', { exact: true })).toBeVisible()
    await proof(phone.page, 'completed-phone')
    const saved = await h.state()
    expect(saved.jobs.find((j: any) => j.id === job.id).status).toBe('assessed')
    expect(saved.captures.filter((c: any) => c.jobId === job.id).map((c: any) => c.id).sort()).toEqual(queued.map((q: any) => q.commandId).sort())
    for (const q of queued.filter((q: any) => q.payload.kind === 'photo')) {
      const photo = saved.captures.find((c: any) => c.id === q.commandId)
      const response = await h.request(`/api/glove/files/${photo.file.fileId}`, { as: b.priyaPerson.cookie })
      expect(response.status).toBe(200)
      expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from(q.payload.photo.base64, 'base64'))
    }
    await h.restart()
    expect(await h.state()).toEqual(saved)
    await page.goto(`${origin}/app#quotes`)
    await page.reload()
    await page.getByRole('button', { name: 'Quote it', exact: true }).click()
    const draft = page.locator('form').filter({ has: page.getByRole('heading', { name: `Quote for ${b.customer.name}`, exact: true }) })
    await draft.getByLabel('Title', { exact: true }).fill('Replace the water heater')
    await draft.getByLabel('Description', { exact: true }).fill('New water heater installed')
    await draft.getByLabel('Unit price', { exact: true }).fill('2450.00')
    const quote = await action(page, draft.getByRole('button', { name: 'Save draft', exact: true }))
    const evidence = page.getByRole('region', { name: 'From the assessment', exact: true })
    await expect(evidence.getByRole('link', { name: job.number, exact: true })).toHaveAttribute('href', `#jobs/${job.id}`)
    await expect(evidence).toContainText('Closet is 30 inches wide; replace the gas shutoff')
    await expect(evidence).toContainText('Closet clearance 30 in')
    await expect(evidence).toContainText('Venting Atmospheric')
    await expect(evidence.getByRole('img')).toHaveCount(2)
    expect(quote.assessment.photos.map((p: any) => p.fileId)).toEqual(saved.captures.filter((c: any) => c.jobId === job.id && c.kind === 'photo').map((c: any) => c.file.fileId))
    await proof(page, 'quote')
    await page.goto(`${origin}/app#customers/${b.customer.id}`)
    await page.getByRole('button', { name: `History at ${b.site.address}`, exact: true }).click()
    const history = page.getByRole('region', { name: `History at ${b.site.address}`, exact: true })
    for (const text of ['Request (phone): Replace the leaking water heater', `${job.number} Assessment: Replace the leaking water heater`, `${quote.number} Replace the water heater`, 'Closet is 30 inches wide; replace the gas shutoff', 'Water heater assessment']) await expect(history.getByText(text, { exact: false }).first()).toBeVisible()
    await proof(page, 'history')
    const final = await h.state()
    expect(final.enquiries.find((e: any) => e.id === request.id).assessmentJobId).toBe(job.id)
    expect([final.messages, final.payments, final.invoices, h.email.sent, h.twilio.calls, h.stripePayments.calls]).toEqual([[], [], [], [], [], []])
  } finally {
    for (const context of contexts) await context.close()
    await h.close()
  }
}
