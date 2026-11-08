import {test,expect} from '@playwright/test'
import {mkdir} from 'node:fs/promises'
import {join} from 'node:path'
const origin=process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
const shots=process.env.GLOVE_SCREENSHOTS
async function shot(page: any,width: number,name: string) {if(!shots)return;await mkdir(shots,{recursive:true});await page.screenshot({path:join(shots,`${width}-${name}.png`),fullPage:true})}
test('DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390', async ({ browser }) => {
  // @ts-expect-error Production Worker/native sessions/D1 fixture.
  const { installation, business, acceptedQuote } = await import('../api/harness.mjs')
  for (const width of [1440, 390]) {
    const h = await installation(), b = await business(h)
    const context = await browser.newContext({ viewport: { width, height: 1000 } }), page = await context.newPage()
    const inFlight = new Set<Promise<void>>()
    const settled = async () => { while (inFlight.size) await Promise.all(inFlight) }
    try {
      const job = await h.command('job.create', { quoteId: (await acceptedQuote(h, b)).id })
      const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-04', start: '09:00', end: '10:00' })
      const peerCustomer = await h.command('customer.save', { name: 'Synthetic kept client' })
      const peerSite = await h.command('site.save', { customerId: peerCustomer.id, address: '126 Test Street' })
      const peerJob = await h.command('job.create', { customerId: peerCustomer.id, siteId: peerSite.id, title: 'Kept visit', lines: [] })
      const peerVisit = await b.dispatcher.run('visit.book', { jobId: peerJob.id, technicianId: b.priya.id, date: '2026-11-04', start: '11:00', end: '12:00' })
      const peerOriginal = await b.priyaPerson.run('visit.capture', { visitId: peerVisit.id, deviceTime: peerVisit.startAt, kind: 'photo', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }, caption: 'Kept client original' })
      const original = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'photo', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }, caption: 'Private visit original' })
      if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
      await page.goto(process.env.GLOVE_OPEN)
      await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
      if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
      await context.route(`${origin}/api/glove/**`, async route => {
        const reply = (async () => {
          const req = route.request(), url = new URL(req.url())
          const response = await h.request(url.pathname + url.search, { method: req.method(), as: b.priyaPerson.cookie, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
          await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
        })()
        inFlight.add(reply)
        try { await reply } finally { inFlight.delete(reply) }
      })
      await page.goto(`${origin}/app?job=${job.id}`)
      await expect(page.getByRole('heading', { name: `${job.number} · ${job.title}`, exact: true })).toBeVisible()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).toContain('Harbourview Dental')
      await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(true)
      // Both keep-files requests must finish before cutting this phone's signal.
      await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
      await settled()
      await context.setOffline(true)
      await page.getByLabel('Note', { exact: true }).fill('Synthetic private queued customer note')
      await page.getByRole('button', { name: 'Add note', exact: true }).click()
      await expect(page.getByText('Synthetic private queued customer note · waiting to send', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
      await page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) }).click()
      await page.getByLabel('Note', { exact: true }).fill('Kept client queued note')
      await page.getByRole('button', { name: 'Add note', exact: true }).click()
      const customer = (await h.state()).customers.find((c: any) => c.id === b.customer.id)
      await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: customer.version })).fingerprint })
      await context.setOffline(false)
      // Reconnection starts the real refresh/erasure/outbox work. Reloading
      // immediately can cancel it between server acceptance and local cleanup.
      // Observe completion, then keep all the durable reload assertions below.
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.outbox') ?? '[]')).toBe('[]')
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).not.toContain('Harbourview Dental')
      await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(false)
      await settled()
      await page.reload()
      await expect(page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) })).toBeVisible()
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.outbox') ?? '[]')).toBe('[]')
      await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).not.toContain('Harbourview Dental')
      await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(false)
      expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('Synthetic private queued customer note')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await shot(page, width, 'privacy-technician-reconnected')
      await expect.poll(async () => (await h.state()).captures.filter((c: any) => c.jobId === peerJob.id && c.kind === 'note').map((c: any) => c.text)).toEqual(['Kept client queued note'])
      expect((await h.state()).captures.some((c: any) => c.jobId === job.id)).toBe(false)
      await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
      await page.reload()
      await expect(page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) })).toBeVisible()
      expect(await page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
    } finally { await context.setOffline(false); await settled(); await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  }
})
