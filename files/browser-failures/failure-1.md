# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390
- Location: tests/browser/journey.spec.ts:1241:1

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator: getByRole('region', { name: 'Request pipeline', exact: true }).getByRole('button', { name: 'Email Yelp acknowledgment', exact: true })
Expected: disabled
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeDisabled" getByRole('region', { name: 'Request pipeline', exact: true }).getByRole('button', { name: 'Email Yelp acknowledgment', exact: true }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Request pipeline', exact: true }).getByRole('button', { name: 'Email Yelp acknowledgment', exact: true })

```

```yaml
- main:
  - status: Loading your work…
```

# Test source

```ts
  1217 |       await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.outbox') ?? '[]')).toBe('[]')
  1218 |       await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).not.toContain('Harbourview Dental')
  1219 |       await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(false)
  1220 |       await settled()
  1221 |       await page.reload()
  1222 |       await expect(page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) })).toBeVisible()
  1223 |       await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.outbox') ?? '[]')).toBe('[]')
  1224 |       await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).not.toContain('Harbourview Dental')
  1225 |       await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(false)
  1226 |       expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('Synthetic private queued customer note')
  1227 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  1228 |       await shot(page, width, 'privacy-technician-reconnected')
  1229 |       await expect.poll(async () => (await h.state()).captures.filter((c: any) => c.jobId === peerJob.id && c.kind === 'note').map((c: any) => c.text)).toEqual(['Kept client queued note'])
  1230 |       expect((await h.state()).captures.some((c: any) => c.jobId === job.id)).toBe(false)
  1231 |       await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
  1232 |       await page.reload()
  1233 |       await expect(page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) })).toBeVisible()
  1234 |       expect(await page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
  1235 |     } finally { await context.setOffline(false); await settled(); await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  1236 |   }
  1237 | })
  1238 | 
  1239 | // BOOK-004 uses the real Worker and native sessions behind the rendered app,
  1240 | // as the move-in journeys do; only the source Booking record is synthetic.
  1241 | test('BOOK-004, BOOK-014, BOOK-015, BOOK-016, BOOK-017 Reserve with Google request intake and external-send attestation at 1440 and 390', async ({ browser }) => {
  1242 |   const { installation, business } = await import('../api/harness.mjs')
  1243 |   const { recorded } = await import('../fixtures/leads.mjs')
  1244 |   for (const width of [1440, 390]) {
  1245 |     const h = await installation(), context = await browser.newContext({ viewport: { width, height: 1050 } })
  1246 |     const page = await context.newPage(), errors: string[] = []
  1247 |     page.on('pageerror', e => errors.push(e.message))
  1248 |     // The run site has its own origin; serve the real generated output, as
  1249 |     // tests/site.mjs does, instead of expecting docs on the application Worker.
  1250 |     if (!process.env.GLOVE_SITE_ROOT) throw new Error('Generated run site required.')
  1251 |     const siteRoot = resolve(process.env.GLOVE_SITE_ROOT)
  1252 |     const site = createServer(async (req, res) => {
  1253 |       const path = new URL(req.url!, 'http://local.test').pathname
  1254 |       const types: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' }
  1255 |       for (const suffix of ['', '.html']) {
  1256 |         const file = resolve(siteRoot, '.' + path + suffix)
  1257 |         if (!file.startsWith(siteRoot + '/')) continue
  1258 |         try { const bytes = await readFile(file); res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }); res.end(bytes); return } catch { /* Try clean URL. */ }
  1259 |       }
  1260 |       res.writeHead(404); res.end('Not found')
  1261 |     })
  1262 |     await new Promise<void>(done => site.listen(0, '127.0.0.1', done))
  1263 |     const siteOrigin = `http://127.0.0.1:${(site.address() as { port: number }).port}`
  1264 |     try {
  1265 |       await business(h)
  1266 |       if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
  1267 |       try { await page.goto(process.env.GLOVE_OPEN); await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev')) } catch { throw new Error('Private owner entry failed.') }
  1268 |       if (new URL(page.url()).pathname === '/setup') {
  1269 |         await page.getByRole('checkbox').check()
  1270 |         await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
  1271 |         await page.waitForURL(u => u.pathname === '/app')
  1272 |       }
  1273 |       await page.route(`${origin}/api/glove/**`, async route => {
  1274 |         const req = route.request(), u = new URL(req.url())
  1275 |         const response = await h.request(u.pathname + u.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
  1276 |         await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
  1277 |       })
  1278 |       await page.goto(`${origin}/app#team`)
  1279 |       const connections = panel(page, 'Lead sources')
  1280 |       await connections.getByLabel('Lead source', { exact: true }).selectOption('reserve-google')
  1281 |       await expect(connections).toContainText('connecting it does not activate Google bookings or confirm a visit')
  1282 |       const reply = page.waitForResponse(r => r.url() === `${origin}/api/glove/commands` && r.request().method() === 'POST')
  1283 |       await send(page, connections.getByRole('button', { name: 'Connect Reserve with Google', exact: true }))
  1284 |       const connected = (await (await reply).json()).result
  1285 |       await expect(connections).toContainText('This password is shown only now.')
  1286 |       await connections.getByRole('button', { name: 'I saved it', exact: true }).click()
  1287 |       await expect(connections).not.toContainText(connected.password)
  1288 |       await connections.scrollIntoViewIfNeeded()
  1289 |       await shot(page, width, 'reserve-google-connected')
  1290 |       if (shots) await connections.screenshot({ path: join(shots, `${width}-reserve-google-connected-panel.png`) })
  1291 |       const booking = recorded.reserveGoogle()
  1292 |       const response = await h.mf.dispatchFetch(`${h.origin}/api/glove/leads/reserve-google`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`glove:${connected.password}`).toString('base64')}` }, body: JSON.stringify(booking) })
  1293 |       expect(response.status).toBe(200)
  1294 |       await page.goto(`${origin}/app#quotes`)
  1295 |       await page.reload()
  1296 |       const pipeline = page.getByRole('region', { name: 'Request pipeline', exact: true })
  1297 |       await expect(pipeline).toContainText('No Glove visit booked.')
  1298 |       await expect(pipeline).toContainText('Acknowledgment queued')
  1299 |       await expect(pipeline).toContainText('Reserve with Google')
  1300 |       const state = await h.state(), request = state.enquiries.find((e: any) => e.source === 'reserve-google')
  1301 |       expect(request.acknowledgment.status).toBe('queued')
  1302 |       expect(state.visits).toHaveLength(0)
  1303 |       await pipeline.scrollIntoViewIfNeeded()
  1304 |       await shot(page, width, 'reserve-google-queued')
  1305 |       await send(page, pipeline.getByRole('button', { name: 'Record acknowledgment sent outside Glove', exact: true }))
  1306 |       await expect(pipeline).toContainText('not provider-confirmed delivery')
  1307 |       expect((await h.state()).enquiries.find((e: any) => e.id === request.id).acknowledgment.status).toBe('sent')
  1308 |       await pipeline.scrollIntoViewIfNeeded()
  1309 |       await shot(page, width, 'reserve-google-attestation')
  1310 |       await h.command('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-60', fromEmail: 'office@example.test' })
  1311 |       const yelp = await h.command('lead.connect', { provider: 'yelp', apiKey: 'synthetic-glove-61' })
  1312 |       h.leads.yelp.set('synthetic-glove-90', recorded.yelpLead('synthetic-glove-90'))
  1313 |       const yelpResponse = await h.mf.dispatchFetch(`${h.origin}/api/glove/leads/yelp`, { method: 'POST', headers: { 'content-type': ['application','json'].join('/'), authorization: `Basic ${Buffer.from(`glove:${yelp.password}`).toString('base64')}` }, body: JSON.stringify(recorded.yelpNotice('synthetic-glove-90')) })
  1314 |       expect(yelpResponse.status).toBe(200)
  1315 |       await page.reload()
  1316 |       const replyButton = pipeline.getByRole('button', { name: 'Email Yelp acknowledgment', exact: true })
> 1317 |       await expect(replyButton).toBeDisabled()
       |                                 ^ Error: expect(locator).toBeDisabled() failed
  1318 |       await pipeline.getByRole('checkbox', { name: 'I approve this Yelp reply', exact: true }).check()
  1319 |       await shot(page, width, 'yelp-reply-approved')
  1320 |       await send(page, replyButton)
  1321 |       await expect(pipeline).toContainText('Accepted by Postmark; delivery not yet reported')
  1322 |       await expect(pipeline).toContainText('Glove does not confirm receipt in the Yelp conversation')
  1323 |       expect(h.email.sent).toHaveLength(1)
  1324 |       await pipeline.scrollIntoViewIfNeeded()
  1325 |       await shot(page, width, 'yelp-approved-reply')
  1326 |       const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  1327 |       expect(size.document).toBeLessThanOrEqual(size.viewport)
  1328 |       for (const slug of ['lead-sources', 'data-flows']) {
  1329 |         await page.goto(`${siteOrigin}/docs/${slug}`)
  1330 |         await expect(page.locator('body')).toContainText('Reserve with Google')
  1331 |         if (slug === 'lead-sources') await expect(page.locator('body')).toContainText('outbound update to Google')
  1332 |         else await expect(page.getByRole('link', { name: 'formats and live-integration limits' })).toHaveAttribute('href', '/docs/lead-sources')
  1333 |         await shot(page, width, `reserve-google-docs-${slug}`)
  1334 |         expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  1335 |       }
  1336 |       expect(errors).toEqual([])
  1337 |     } finally { await context.close(); await h.close(); await new Promise<void>(done => site.close(() => done())) }
  1338 |   }
  1339 | })
  1340 | 
```