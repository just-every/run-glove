# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: journey.spec.ts >> DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390
- Location: tests/browser/journey.spec.ts:1166:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'J-1001 · Split system service', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'J-1001 · Split system service', exact: true }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'J-1001 · Split system service', exact: true })

```

```yaml
- main:
  - status: Loading your work…
```

# Test source

```ts
  1097 |         await page.setViewportSize({ width, height: 1000 })
  1098 |         await page.goto(`${origin}/app#jobs/${job.id}`)
  1099 |         await page.reload()
  1100 |         const panel = page.getByRole('region', { name: 'Estimate and actual', exact: true })
  1101 |         await expect(panel.getByText('Site survey without a cost · quantity 1', { exact: true })).toBeVisible()
  1102 |         await expect(panel.getByText('Disposal without a cost · quantity 2', { exact: true })).toBeVisible()
  1103 |         await expect(panel.getByText('Estimated lines without a unit cost count at $0.00:', { exact: true })).toBeVisible()
  1104 |         await expect(panel.getByRole('row', { name: 'Estimated cost $0.00', exact: true })).toBeVisible()
  1105 |         expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  1106 |         await shot(page, width, 'uncosted-estimate-lines')
  1107 |       }
  1108 |     } finally { await page.unrouteAll({ behavior: 'wait' }); await context.close() }
  1109 |   } finally { await h.close() }
  1110 | })
  1111 | 
  1112 | test('DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 the owner exports and explicitly erases a merged customer with durable outcomes at 1440 and 390', async ({ browser }) => {
  1113 |   // @ts-expect-error Production Worker/native sessions/D1 fixture.
  1114 |   const { installation, business } = await import('../api/harness.mjs')
  1115 |   for (const width of [1440, 390]) {
  1116 |     const h = await installation()
  1117 |     const context = await browser.newContext({ viewport: { width, height: 1000 } }), page = await context.newPage()
  1118 |     try {
  1119 |       const b = await business(h)
  1120 |       const duplicate = await h.command('customer.save', { name: 'Synthetic merged identity', email: 'synthetic-glove-8@example.test' })
  1121 |       await h.command('customer.merge', { survivorId: b.customer.id, mergedIds: [duplicate.id], versions: { [b.customer.id]: b.customer.version, [duplicate.id]: duplicate.version } })
  1122 |       const staged = await h.command('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-26.csv', text: `ID,Name,Email,Address\n${b.customer.id},Harbourview Dental,accounts@harbourview.example,17 Synthetic Road\n,Synthetic Peer,synthetic-glove-27@example.test,18 Synthetic Road\n` }], mapping: { customerId: 'ID', name: 'Name', email: 'Email', siteAddress: 'Address' } })
  1123 |       await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  1124 |       if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
  1125 |       await page.goto(process.env.GLOVE_OPEN)
  1126 |       await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  1127 |       if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
  1128 |       await context.route(`${origin}/api/glove/**`, async route => {
  1129 |         const req = route.request(), url = new URL(req.url())
  1130 |         const response = await h.request(url.pathname + url.search, { method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
  1131 |         await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
  1132 |       })
  1133 |       await page.goto(`${origin}/app#customers/${b.customer.id}`)
  1134 |       await page.reload()
  1135 |       const privacy = page.getByRole('region', { name: 'Customer privacy', exact: true })
  1136 |       await expect(privacy.getByRole('button', { name: 'Erase customer personal data' })).toBeDisabled()
  1137 |       const downloading = page.waitForEvent('download')
  1138 |       await send(page, privacy.getByRole('button', { name: 'Export customer data' }))
  1139 |       const download = await downloading, chunks: Buffer[] = []
  1140 |       const stream = await download.createReadStream()
  1141 |       for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  1142 |       const exported = JSON.parse(Buffer.concat(chunks).toString())
  1143 |       expect(exported.customerIds.sort()).toEqual([b.customer.id, duplicate.id].sort())
  1144 |       expect(exported.records.customers.map((c: any) => c.name)).toContain('Harbourview Dental')
  1145 |       await expect(privacy.getByLabel('Privacy request outcomes')).toContainText('Export complete')
  1146 |       await shot(page, width, 'customer-privacy-export')
  1147 |       await send(page, privacy.getByRole('button', { name: 'Preview erasure', exact: true }))
  1148 |       await expect(privacy.getByLabel('Erasure preview')).toContainText('What will be erased')
  1149 |       await expect(privacy.getByLabel('Erasure preview')).toContainText('synthetic-glove-26.csv')
  1150 |       await expect(privacy.getByLabel('Erasure preview')).toContainText('1 peer customers affected')
  1151 |       await shot(page, width, 'customer-privacy-preview')
  1152 |       if (process.env.GLOVE_SCREENSHOTS) await privacy.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-customer-privacy-preview-panel.png`) })
  1153 |       await privacy.getByLabel('I am acting on this customer’s erasure request, including all merged identities and affected originals.').check()
  1154 |       await privacy.getByLabel('Type ERASE to confirm').fill('ERASE')
  1155 |       await send(page, privacy.getByRole('button', { name: 'Erase customer personal data' }))
  1156 |       await expect(privacy.getByRole('status')).toHaveText('Personal data erased. Anonymous invoices and tax totals remain.')
  1157 |       await expect(privacy.getByLabel('Privacy request outcomes')).toContainText('Erasure complete')
  1158 |       await expect(privacy.getByLabel('Privacy request outcomes')).toContainText('Export complete')
  1159 |       await expect(page.getByRole('heading', { name: 'Harbourview Dental', exact: true })).toHaveCount(0)
  1160 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  1161 |       await shot(page, width, 'customer-privacy-erased')
  1162 |     } finally { await context.unrouteAll({ behavior: 'wait' }); await context.close(); await h.close() }
  1163 |   }
  1164 | })
  1165 | 
  1166 | test('DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 a technician reconnects and erases cached originals and queued captures only for explicitly erased visits at 1440 and 390', async ({ browser }) => {
  1167 |   // @ts-expect-error Production Worker/native sessions/D1 fixture.
  1168 |   const { installation, business, acceptedQuote } = await import('../api/harness.mjs')
  1169 |   for (const width of [1440, 390]) {
  1170 |     const h = await installation(), b = await business(h)
  1171 |     const context = await browser.newContext({ viewport: { width, height: 1000 } }), page = await context.newPage()
  1172 |     const inFlight = new Set<Promise<void>>()
  1173 |     const settled = async () => { while (inFlight.size) await Promise.all(inFlight) }
  1174 |     try {
  1175 |       const job = await h.command('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  1176 |       const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-04', start: '09:00', end: '10:00' })
  1177 |       const peerCustomer = await h.command('customer.save', { name: 'Synthetic kept client' })
  1178 |       const peerSite = await h.command('site.save', { customerId: peerCustomer.id, address: '126 Test Street' })
  1179 |       const peerJob = await h.command('job.create', { customerId: peerCustomer.id, siteId: peerSite.id, title: 'Kept visit', lines: [] })
  1180 |       const peerVisit = await b.dispatcher.run('visit.book', { jobId: peerJob.id, technicianId: b.priya.id, date: '2026-11-04', start: '11:00', end: '12:00' })
  1181 |       const peerOriginal = await b.priyaPerson.run('visit.capture', { visitId: peerVisit.id, deviceTime: peerVisit.startAt, kind: 'photo', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }, caption: 'Kept client original' })
  1182 |       const original = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'photo', photo: { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }, caption: 'Private visit original' })
  1183 |       if (!process.env.GLOVE_OPEN) throw new Error('Private owner entry required.')
  1184 |       await page.goto(process.env.GLOVE_OPEN)
  1185 |       await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  1186 |       if (new URL(page.url()).pathname === '/setup') { await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Finish setup', exact: true }).click(); await page.waitForURL(u => u.pathname === '/app') }
  1187 |       await context.route(`${origin}/api/glove/**`, async route => {
  1188 |         const reply = (async () => {
  1189 |           const req = route.request(), url = new URL(req.url())
  1190 |           const response = await h.request(url.pathname + url.search, { method: req.method(), as: b.priyaPerson.cookie, ...(req.postData() ? { body: JSON.parse(req.postData()!) } : {}) })
  1191 |           await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer()) })
  1192 |         })()
  1193 |         inFlight.add(reply)
  1194 |         try { await reply } finally { inFlight.delete(reply) }
  1195 |       })
  1196 |       await page.goto(`${origin}/app?job=${job.id}`)
> 1197 |       await expect(page.getByRole('heading', { name: `${job.number} · ${job.title}`, exact: true })).toBeVisible()
       |                                                                                                      ^ Error: expect(locator).toBeVisible() failed
  1198 |       await expect.poll(() => page.evaluate(() => localStorage.getItem('glove.day') ?? '')).toContain('Harbourview Dental')
  1199 |       await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), original.file.fileId)).toBe(true)
  1200 |       // Both keep-files requests must finish before cutting this phone's signal.
  1201 |       await expect.poll(() => page.evaluate(async id => (await caches.open('glove-day-files')).keys().then(keys => keys.some(k => k.url.endsWith(id))), peerOriginal.file.fileId)).toBe(true)
  1202 |       await settled()
  1203 |       await context.setOffline(true)
  1204 |       await page.getByLabel('Note', { exact: true }).fill('Synthetic private queued customer note')
  1205 |       await page.getByRole('button', { name: 'Add note', exact: true }).click()
  1206 |       await expect(page.getByText('Synthetic private queued customer note · waiting to send', { exact: true })).toBeVisible()
  1207 |       await page.getByRole('button', { name: '‹ Your visits', exact: true }).click()
  1208 |       await page.getByRole('button', { name: new RegExp(`${peerJob.number} · Kept visit`) }).click()
  1209 |       await page.getByLabel('Note', { exact: true }).fill('Kept client queued note')
  1210 |       await page.getByRole('button', { name: 'Add note', exact: true }).click()
  1211 |       const customer = (await h.state()).customers.find((c: any) => c.id === b.customer.id)
  1212 |       await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: customer.version })).fingerprint })
  1213 |       await context.setOffline(false)
  1214 |       // Reconnection starts the real refresh/erasure/outbox work. Reloading
  1215 |       // immediately can cancel it between server acceptance and local cleanup.
  1216 |       // Observe completion, then keep all the durable reload assertions below.
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
```