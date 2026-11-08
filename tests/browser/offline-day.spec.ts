import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const origin = process.env.GLOVE_BASE_URL || 'http://127.0.0.1:8787'
let day = '2030-06-11'
const at = '2030-06-11T12:00:00.000Z'
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const state = async (page: Page) => (await page.request.get(`${origin}/api/glove/state`)).json()
async function command(page: Page, type: string, payload: object, commandId = crypto.randomUUID()) {
  const response = await page.request.post(`${origin}/api/glove/commands`, { headers: { origin }, data: { commandId, type, payload } })
  const body = await response.json()
  expect(body.ok, JSON.stringify(body.error)).toBe(true)
  return body.result
}
const kept = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('glove.day') || 'null'))
const outbox = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('glove.outbox') || '[]'))
const cachePaths = (page: Page) => page.evaluate(async () => Object.fromEntries(await Promise.all((await caches.keys()).map(async name => [name, (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname)]))))
async function picture(page: Page, width: number, name: string) {
  await page.setViewportSize({ width, height: 950 })
  if (process.env.GLOVE_SCREENSHOTS) {
    await mkdir(process.env.GLOVE_SCREENSHOTS, { recursive: true })
    await page.screenshot({ path: join(process.env.GLOVE_SCREENSHOTS, `${width}-offline-${name}.png`), fullPage: true })
  }
}
let desk: Page, phone: Page, other: Page, dispatcher: Page
let deskContext: BrowserContext, phoneContext: BrowserContext, otherContext: BrowserContext, dispatchContext: BrowserContext
let key: string | null, tech: any, second: any, actor: string, secondActor: string, customer: any, site: any, service: any, form: any
let one: any, two: any, hidden: any, history: any, v1: any, v2: any, hiddenVisit: any, prior: any, photo: any, equipment: any
const receipts: { point: number; outcome: string }[] = []
const proved = (point: number, outcome: string) => receipts.push({ point, outcome })
const tag = `synthetic-glove-${crypto.randomUUID().slice(0, 8)}`

async function enter(page: Page, persona: string) {
  await page.request.post(`${origin}/__dev/key`, { headers: { origin }, data: { key } })
  await page.goto(`${origin}/auth/dev/enter?as=${persona}&returnTo=%2Fapp`, { waitUntil: 'domcontentloaded' })
  await page.waitForURL(u => u.pathname === '/app')
}
async function loadPhone(page = phone) {
  await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Your visits', exact: true })).toBeVisible()
  await expect.poll(async () => { const server = await state(page), local = await kept(page); return local?.actorId === server.actor.id && local?.state.version === server.version }).toBe(true)
}
async function shellReady(page = phone) {
  await expect.poll(async () => (await cachePaths(page))['glove-shell-v1']?.includes('/app')).toBe(true)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
}

test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  if (!process.env.GLOVE_OPEN) throw new Error('A private native owner entry is required.')
  key = new URLSearchParams(new URL(process.env.GLOVE_OPEN).hash.slice(1)).get('rer-dev')
  deskContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); desk = await deskContext.newPage()
  await desk.goto(process.env.GLOVE_OPEN)
  await desk.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
  if (new URL(desk.url()).pathname === '/setup') { await desk.getByRole('checkbox').check(); await desk.getByRole('button', { name: 'Finish setup', exact: true }).click(); await desk.waitForURL(u => u.pathname === '/app') }
  phoneContext = await browser.newContext({ viewport: { width: 390, height: 950 } }); phone = await phoneContext.newPage()
  otherContext = await browser.newContext({ viewport: { width: 390, height: 950 } }); other = await otherContext.newPage()
  dispatchContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); dispatcher = await dispatchContext.newPage()
  await enter(phone, 'technician'); await enter(other, 'member'); await enter(dispatcher, 'dispatcher')
  actor = (await state(phone)).actor.id; secondActor = (await state(other)).actor.id
  await command(desk, 'role.set', { operatorId: actor, role: 'technician' })
  await command(desk, 'role.set', { operatorId: secondActor, role: 'technician' })
  await command(desk, 'role.set', { operatorId: (await state(dispatcher)).actor.id, role: 'dispatcher' })
  const b = (await state(desk)).business[0]
  await command(desk, 'business.save', { ...(b || {}), name: 'Offline field proof', currency: 'USD', timezone: 'UTC' })
  const existing = await state(desk)
  day = new Date(Date.UTC(2030, 5, 11 + existing.visits.length * 2)).toISOString().slice(0, 10)
  tech = await command(desk, 'technician.save', { ...existing.technicians.find((t: any) => t.operatorId === actor), name: 'Recording technician', operatorId: actor })
  second = await command(desk, 'technician.save', { ...existing.technicians.find((t: any) => t.operatorId === secondActor), name: 'Other technician', operatorId: secondActor })
  service = await command(desk, 'service.save', { code: tag, name: 'Coil service', unitPrice: '187.23', unitCost: '61.42', tax: 'FREE', checklist: [{ label: 'Isolate power', required: true }] })
  form = await command(desk, 'form.save', { name: `Field inspection ${tag}`, serviceIds: [service.id], questions: [{ id: 'safe', label: 'Safe to operate', type: 'yesno', required: true }] })
  customer = await command(desk, 'customer.save', { name: 'Field customer', phone: '212 555 0130', contact: 'Site contact', billingAddress: 'Private billing street' })
  site = await command(desk, 'site.save', { customerId: customer.id, address: '14 Field Street', accessNotes: 'Gate code 3041' })
  equipment = await command(desk, 'equipment.save', { siteId: site.id, type: 'Condenser', make: 'Field maker', model: 'Cooling unit', serial: tag })
  const makeJob = async (title: string, c = customer, s = site) => command(desk, 'job.create', { customerId: c.id, siteId: s.id, title, equipmentIds: c === customer ? [equipment.id] : [], lines: [{ serviceId: service.id, description: 'Coil service', quantity: '1', unitPrice: '187.23', tax: 'FREE' }] })
  one = await makeJob('Offline completion'); two = await makeJob('Reassigned offline'); history = await makeJob('Previous service')
  const secretCustomer = await command(desk, 'customer.save', { name: 'Other private customer' })
  const secretSite = await command(desk, 'site.save', { customerId: secretCustomer.id, address: '99 Other Street', accessNotes: 'Other private access' })
  hidden = await makeJob('Other private work', secretCustomer, secretSite)
  v1 = await command(dispatcher, 'visit.book', { jobId: one.id, technicianId: tech.id, date: day, start: '09:00', end: '10:00' })
  v2 = await command(dispatcher, 'visit.book', { jobId: two.id, technicianId: tech.id, date: day, start: '11:00', end: '12:00' })
  hiddenVisit = await command(dispatcher, 'visit.book', { jobId: hidden.id, technicianId: second.id, date: day, start: '09:00', end: '10:00' })
  prior = await command(dispatcher, 'visit.book', { jobId: history.id, technicianId: tech.id, date: new Date(Date.parse(day) - 86400000).toISOString().slice(0, 10), start: '09:00', end: '10:00' })
  await command(phone, 'visit.arrive', { visitId: prior.id, deviceTime: '2030-06-10T09:00:00Z' })
  await command(phone, 'visit.capture', { visitId: prior.id, kind: 'checklist', itemId: history.checklist[0].id, result: 'done', deviceTime: '2030-06-10T09:10:00Z' })
  photo = await command(phone, 'visit.capture', { visitId: prior.id, kind: 'photo', caption: 'Previous coil', photo: { mediaType: 'image/png', base64: png }, deviceTime: '2030-06-10T09:20:00Z' })
  await command(phone, 'visit.complete', { visitId: prior.id, summary: 'Earlier service retained', signoff: { absentReason: 'Customer at work' }, deviceTime: '2030-06-10T10:00:00Z' })
  await loadPhone(); await shellReady()
})
test.afterAll(async () => {
  for (const context of [phoneContext, otherContext, dispatchContext, deskContext]) await context?.close()
  const output = process.env.GLOVE_BROWSER_OUTPUT || '/tmp/glove-browser-results'
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'offline-day-receipt.json'), JSON.stringify({ head: process.env.GLOVE_PRODUCT_HEAD || 'development', nativeSessions: true, browserOffline: true, receipts }, null, 2) + '\n')
})


async function openVisit(job: any, page = phone) {
  await loadPhone(page)
  await page.getByRole('button', { name: new RegExp(`${job.number}.*${job.title}`) }).click()
}
async function waitSent(page = phone) {
  await expect.poll(async () => (await outbox(page)).filter((x: any) => x.actorId === (page === other ? secondActor : actor))).toEqual([])
}
async function note(page: Page, text: string) {
  await page.getByLabel('Note', { exact: true }).fill(text)
  await page.getByRole('button', { name: 'Add note', exact: true }).click()
}
async function enumerate(visitId: string) {
  const s = await state(desk)
  const timeline = await (await desk.request.get(`${origin}/api/glove/jobs/${s.visits.find((v: any) => v.id === visitId).jobId}/timeline`)).json()
  const activity: any[] = []
  let before: string | null = null
  do {
    const page = await (await desk.request.get(`${origin}/api/glove/activity${before ? `?before=${before}` : ''}`)).json()
    activity.push(...page.events); before = page.next
  } while (before)
  expect(activity.filter(e => e.jobId === s.visits.find((v: any) => v.id === visitId).jobId).sort((a, b) => a.sequence - b.sequence)).toEqual(timeline.events)
  return { visit: s.visits.find((v: any) => v.id === visitId), captures: s.captures.filter((c: any) => c.visitId === visitId), events: timeline.events }
}

test('FIELD-001 point 2: the kept view is exact, refreshed and cleared across native sign-ins including an uncontrolled page', async () => {
  await enter(phone, 'technician'); await loadPhone(); await shellReady()
  const before = await kept(phone), s = before.state
  expect(before.actorId).toBe(actor)
  const ids = (rows: any[]) => rows.map(x => x.id).sort()
  expect(ids(s.visits)).toEqual(ids([v1, v2, prior]))
  expect(ids(s.jobs)).toEqual(ids([one, two, history]))
  expect(ids(s.customers)).toEqual([customer.id]); expect(ids(s.sites)).toEqual([site.id]); expect(ids(s.equipment)).toEqual([equipment.id])
  expect(s.sites[0].accessNotes).toBe('Gate code 3041')
  expect(s.equipment[0]).toMatchObject({ type: 'Condenser', serial: tag })
  expect(s.jobs.find((j: any) => j.id === one.id)).toMatchObject({ checklist: one.checklist, forms: one.forms })
  expect(s.captures.filter((c: any) => c.visitId === prior.id).map((c: any) => c.kind).sort()).toEqual(['arrival', 'checklist', 'completion', 'photo'])
  expect(s.events.some((e: any) => e.jobId === history.id && e.kind === 'capture.completion')).toBe(true)
  expect([s.quotes, s.invoices, s.payments, s.payouts]).toEqual([[], [], [], []])
  const keys = (v: any): string[] => Array.isArray(v) ? v.flatMap(keys) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : []
  expect(keys([s.jobs, s.services, s.technicians, s.captures]).filter(k => /^(unitPrice|unitCost|costRate|totals|price|cost|fieldPricing)$/.test(k))).toEqual([])
  expect(JSON.stringify(s)).not.toContain('Other private')
  expect(JSON.stringify(s)).not.toContain('187.23'); expect(JSON.stringify(s)).not.toContain('61.42')
  await command(desk, 'site.save', { ...site, accessNotes: 'New gate code 3052' })
  await loadPhone()
  const refreshed = await kept(phone)
  expect(refreshed.state.version).toBeGreaterThan(before.state.version)
  expect(refreshed.state.sites[0].accessNotes).toBe('New gate code 3052')
  expect(refreshed.savedAt >= before.savedAt).toBe(true)
  // A previously assigned visit stays in the bounded history after reassignment.
  await command(dispatcher, 'visit.change', { visitId: v2.id, version: v2.version, technicianId: second.id, reason: 'Second crew takes the afternoon', acknowledge: [] })
  await loadPhone()
  expect((await kept(phone)).state.visits.find((v: any) => v.id === v2.id).technicianId).toBe(second.id)
  expect((await kept(phone)).state.visits.some((v: any) => v.id === hiddenVisit.id)).toBe(false)
  await expect.poll(async () => (await cachePaths(phone))['glove-day-files']?.length).toBe(1)
  // An active worker can outlive its controlled page. The next sign-in has no controller.
  await phone.evaluate(async () => { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister() })
  await phone.close(); phone = await phoneContext.newPage()
  await phone.goto(`${origin}/signin`)
  expect(await phone.evaluate(() => navigator.serviceWorker.controller)).toBe(null)
  await phone.goto(process.env.GLOVE_OPEN!)
  await expect(phone.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  await expect.poll(() => kept(phone)).toBe(null)
  await expect.poll(async () => Object.keys(await cachePaths(phone)).filter(n => n.startsWith('glove-'))).toEqual([])
  // Same browser, another native technician receives only their own fresh projection.
  await enter(phone, 'technician'); await loadPhone(); await shellReady()
  await enter(phone, 'member'); await loadPhone()
  expect((await kept(phone)).actorId).toBe(secondActor)
  expect((await kept(phone)).state.jobs.some((j: any) => j.id === one.id)).toBe(false)
  await expect.poll(async () => (await cachePaths(phone))['glove-day-files']?.length || 0).toBe(0)
  await phone.getByRole('button', { name: 'Sign out', exact: true }).click()
  await phone.waitForURL(u => u.pathname === '/signin')
  expect(await kept(phone)).toBe(null)
  await expect.poll(async () => Object.values(await cachePaths(phone)).flat()).toEqual([])
  proved(2, 'Exact own projection, history, absent prices, successful replacement, native identity changes, uncontrolled desk entry and sign-out clearance')
})

test('FIELD-001 point 3: network-first shell and originals never cache record or authentication answers', async () => {
  await enter(phone, 'technician'); await loadPhone(); await shellReady()
  const file = `/api/glove/files/${photo.file.fileId}`, shell = '/brand/mark.svg'
  await expect.poll(async () => (await cachePaths(phone))['glove-day-files']?.includes(file)).toBe(true)
  await phone.evaluate(async ({ shell, file }) => {
    await (await caches.open('glove-shell-v1')).put(shell, new Response('Kept shell revision'))
    await (await caches.open('glove-day-files')).put(file, new Response('Kept photo revision'))
  }, { shell, file })
  const online = await phone.evaluate(async ({ shell, file }) => ({ shell: await (await fetch(shell)).text(), file: Array.from(new Uint8Array(await (await fetch(file)).arrayBuffer())) }), { shell, file })
  expect(online.shell).toContain('<svg')
  expect(Buffer.from(online.file).toString('base64')).toBe(png)
  // The online shell refreshes its kept revision; put an older revision back for the fallback check.
  await phone.evaluate(async shell => (await caches.open('glove-shell-v1')).put(shell, new Response('Kept shell revision')), shell)
  for (const path of ['/api/glove/state', `/api/glove/jobs/${one.id}/timeline`, '/api/glove/activity', '/api/glove/export', '/auth/session']) await phone.evaluate(async path => { await fetch(path) }, path)
  await command(phone, 'visit.capture', { visitId: v1.id, kind: 'note', text: 'Online network record', deviceTime: at })
  const paths = await cachePaths(phone)
  expect(paths['glove-day-files']).toEqual([file])
  expect(Object.values(paths).flat().filter(p => p.startsWith('/auth/') || p.startsWith('/api/') && p !== file)).toEqual([])
  await phoneContext.setOffline(true)
  const offline = await phone.evaluate(async ({ shell, file }) => {
    const blocked: string[] = []
    for (const path of ['/api/glove/state', '/api/glove/commands', '/api/glove/activity', '/api/glove/export', '/auth/session']) {
      try { await fetch(path); blocked.push(path) } catch { /* no kept record response */ }
    }
    return { shell: await (await fetch(shell)).text(), file: await (await fetch(file)).text(), blocked }
  }, { shell, file })
  expect(offline).toEqual({ shell: 'Kept shell revision', file: 'Kept photo revision', blocked: [] })
  await phoneContext.setOffline(false)
  // Desk reads the same network doors without retaining a day or photos.
  await dispatcher.goto(`${origin}/app#dispatch`)
  await expect(dispatcher.locator('.glove-app')).toHaveAttribute('aria-busy', 'false')
  expect(await kept(dispatcher)).toBe(null)
  expect(await cachePaths(dispatcher)).toEqual({})
  proved(3, 'Network originals while online; shell and photo fallback only with no signal; record and auth cache exclusion; no desk retention')
})

test('FIELD-001 point 4: waiting captures remain ordered and private to the recording person, including legacy entries', async () => {
  await enter(phone, 'technician'); await openVisit(one); await shellReady()
  await phoneContext.setOffline(true)
  await phone.getByRole('button', { name: 'Record arrival', exact: true }).click()
  await note(phone, 'Private waiting note')
  const queued = await outbox(phone)
  expect(queued.map((x: any) => [x.type, x.actorId])).toEqual([['visit.arrive', actor], ['visit.capture', actor]])
  const legacy = { commandId: crypto.randomUUID(), type: 'visit.capture', payload: { visitId: hiddenVisit.id, kind: 'note', text: 'Legacy private note', deviceTime: at }, label: 'Legacy private note', queuedAt: at }
  await phone.evaluate(item => localStorage.setItem('glove.outbox', JSON.stringify([...JSON.parse(localStorage.getItem('glove.outbox') || '[]'), item])), legacy)
  // Leave the application before restoring the connection, then sign in natively as someone else.
  await phone.goto('about:blank'); await phoneContext.setOffline(false)
  const sent: any[] = []
  const record = (r: any) => { if (r.url().endsWith('/api/glove/commands') && r.method() === 'POST') sent.push(r.postDataJSON()) }
  phone.on('request', record)
  await enter(phone, 'member'); await openVisit(hidden)
  await expect(phone.getByText(/Private waiting note|Legacy private note/)).toHaveCount(0)
  await note(phone, 'Other person own note')
  await expect.poll(async () => (await state(desk)).captures.filter((c: any) => c.visitId === hiddenVisit.id).map((c: any) => c.text)).toEqual(['Other person own note'])
  expect(sent.some(x => [...queued.map((q: any) => q.commandId), legacy.commandId].includes(x.commandId))).toBe(false)
  expect((await outbox(phone)).filter((x: any) => x.actorId === actor)).toEqual(queued)
  expect((await outbox(phone)).find((x: any) => x.commandId === legacy.commandId)).toEqual(legacy)
  await enter(phone, 'technician'); await loadPhone(); await waitSent()
  const landed = await enumerate(v1.id)
  expect(landed.captures.filter((c: any) => queued.some((q: any) => q.commandId === c.id)).map((c: any) => c.kind)).toEqual(['arrival', 'note'])
  expect(landed.captures.find((c: any) => c.id === queued[1].commandId).text).toBe('Private waiting note')
  expect(sent.filter(x => queued.some((q: any) => q.commandId === x.commandId)).map(x => x.commandId)).toEqual(queued.map((q: any) => q.commandId))
  expect(sent.some(x => x.commandId === legacy.commandId)).toBe(false)
  phone.off('request', record)
  proved(4, 'Capture order and identities retained; another native sign-in neither sees nor sends waiting or actorless captures; original actor reconnect sends once')
})

test('FIELD-001 point 1: offline reload completes every capture once with independently enumerated records and Activity', async () => {
  await enter(phone, 'technician'); await loadPhone(); await shellReady()
  // Use a fresh visit so completion is enabled by a waiting arrival, not a server arrival.
  const job = await command(desk, 'job.create', { customerId: customer.id, siteId: site.id, title: 'Complete with no signal', lines: [{ serviceId: service.id, description: 'Coil service', quantity: '1', unitPrice: '187.23', tax: 'FREE' }] })
  const visit = await command(dispatcher, 'visit.book', { jobId: job.id, technicianId: tech.id, date: day, start: '14:00', end: '15:00' })
  await loadPhone(); await shellReady()
  const savedAt = (await kept(phone)).savedAt
  await phoneContext.setOffline(true); await phone.reload({ waitUntil: 'domcontentloaded' })
  await expect(phone.getByText(/^No signal: showing your day as of/)).toContainText(new Date(savedAt).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }))
  await phone.getByRole('button', { name: new RegExp(`${job.number}.*Complete with no signal`) }).click()
  await phone.getByRole('button', { name: 'Record arrival', exact: true }).click()
  await expect(phone.getByText('Arrival recorded on this phone — waiting to send')).toBeVisible()
  await expect(phone.getByRole('button', { name: 'Complete visit', exact: true })).toBeEnabled()
  await phone.getByLabel('Isolate power', { exact: true }).check()
  const inspection = phone.getByRole('region', { name: form.name, exact: true })
  await inspection.getByLabel('Yes', { exact: true }).check()
  await inspection.getByRole('button', { name: `Save ${form.name}`, exact: true }).click()
  await note(phone, 'Coil cleaned without signal')
  const photos = phone.getByRole('region', { name: 'Photos', exact: true })
  await expect(photos.getByLabel('Photo caption', { exact: true })).toBeVisible()
  await photos.getByLabel('Photo caption', { exact: true }).fill('Cleaned coil, before cover')
  await photos.locator('input[type=file]').setInputFiles({ name: 'coil.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') })
  await expect(photos.getByRole('img', { name: 'Cleaned coil, before cover', exact: true })).toBeVisible()
  await phone.getByLabel('Describe it', { exact: true }).fill('Filter pad')
  await phone.getByLabel('Quantity', { exact: true }).fill('2')
  await phone.getByRole('button', { name: 'Add material', exact: true }).click()
  await phone.getByRole('button', { name: 'Complete visit', exact: true }).click()
  await phone.getByLabel('Work done', { exact: true }).fill('Coil and filter serviced')
  await phone.getByLabel('The customer is not here to sign').check()
  await phone.getByLabel('Why there is no sign-off', { exact: true }).fill('Customer at work')
  await phone.getByRole('button', { name: 'Save completion', exact: true }).click()
  const queued = (await outbox(phone)).filter((q: any) => q.actorId === actor)
  expect(queued.map((q: any) => q.type === 'visit.capture' ? q.payload.kind : q.type)).toEqual(['visit.arrive', 'checklist', 'form', 'note', 'photo', 'material', 'visit.complete'])
  expect(new Set(queued.map((q: any) => q.commandId)).size).toBe(7)
  await expect(phone.getByText('Offline — 7 items waiting to send.')).toBeVisible()
  await picture(phone, 390, 'complete-waiting'); await picture(phone, 1440, 'complete-waiting'); await phone.setViewportSize({ width: 390, height: 950 })
  await phone.reload({ waitUntil: 'domcontentloaded' })
  expect((await outbox(phone)).filter((q: any) => q.actorId === actor)).toEqual(queued)
  const posted: string[] = []
  const record = (r: any) => { if (r.url().endsWith('/api/glove/commands') && r.method() === 'POST') posted.push(r.postDataJSON().commandId) }
  phone.on('request', record)
  await phoneContext.setOffline(false); await waitSent()
  phone.off('request', record)
  expect(posted).toEqual(queued.map((q: any) => q.commandId))
  const landed = await enumerate(visit.id)
  expect(landed.visit.status).toBe('completed')
  expect(landed.visit.completion.summary).toBe('Coil and filter serviced')
  expect(landed.captures.map((c: any) => c.kind).sort()).toEqual(['arrival', 'checklist', 'completion', 'form', 'material', 'note', 'photo'])
  expect(landed.captures.map((c: any) => c.id).sort()).toEqual(queued.map((q: any) => q.commandId).sort())
  expect(landed.captures.find((c: any) => c.kind === 'photo').caption).toBe('Cleaned coil, before cover')
  expect(landed.captures.find((c: any) => c.kind === 'material')).toMatchObject({ description: 'Filter pad', quantity: '2' })
  expect(landed.captures.find((c: any) => c.kind === 'form').answers).toEqual([expect.objectContaining({ questionId: 'safe', value: true })])
  expect(landed.events.filter((e: any) => e.kind.startsWith('capture.')).map((e: any) => e.kind).sort()).toEqual(['capture.arrival', 'capture.checklist', 'capture.completion', 'capture.form', 'capture.material', 'capture.note', 'capture.photo'])
  for (const q of queued) {
    expect(landed.events.filter((e: any) => e.subjectId === q.commandId)).toHaveLength(1)
    expect(landed.events.find((e: any) => e.subjectId === q.commandId).actorId).toBe(actor)
    await command(phone, q.type, q.payload, q.commandId)
  }
  const replayed = await enumerate(visit.id)
  expect(replayed.captures).toEqual(landed.captures); expect(replayed.events).toEqual(landed.events)
  await phone.reload({ waitUntil: 'domcontentloaded' })
  await expect.poll(async () => (await outbox(phone)).filter((q: any) => q.actorId === actor)).toEqual([])
  proved(1, 'Offline open and reload, kept age, seven capture kinds with waiting arrival enabling completion, ordered reconnect, exact records and Activity, unchanged replay')
})

test('FIELD-001 point 5: reassigned offline evidence is retained, flagged and reviewed without overwriting either technician', async () => {
  // Point 2 already moved this visit. Move it back, then let the phone keep the assignment.
  let visit = (await state(desk)).visits.find((v: any) => v.id === v2.id)
  if (visit.technicianId !== tech.id) visit = await command(dispatcher, 'visit.change', { visitId: visit.id, version: visit.version, technicianId: tech.id, reason: 'First crew again', acknowledge: [] })
  await enter(phone, 'technician'); await openVisit(two); await shellReady()
  await phoneContext.setOffline(true)
  await phone.getByRole('button', { name: 'Record arrival', exact: true }).click()
  await note(phone, 'Original technician found a locked gate')
  const queued = (await outbox(phone)).filter((q: any) => q.actorId === actor)
  visit = await command(dispatcher, 'visit.change', { visitId: visit.id, version: visit.version, technicianId: second.id, reason: 'Tenant needs the second crew', acknowledge: [] })
  const newArrival = await command(other, 'visit.arrive', { visitId: visit.id, deviceTime: at })
  const newNote = await command(other, 'visit.capture', { visitId: visit.id, kind: 'note', text: 'Second technician has the new key', deviceTime: at })
  await phoneContext.setOffline(false); await waitSent()
  const before = await enumerate(visit.id)
  expect(before.visit.technicianId).toBe(second.id)
  expect(before.visit.arrival.captureId).toBe(newArrival.id)
  expect(before.visit.lateEvidence.map((x: any) => [x.captureId, x.reviewed])).toEqual(queued.map((q: any) => [q.commandId, null]))
  expect(before.captures.map((c: any) => c.id).sort()).toEqual([newArrival.id, newNote.id, ...queued.map((q: any) => q.commandId)].sort())
  expect(before.captures.filter((c: any) => c.late).map((c: any) => c.id)).toEqual(queued.map((q: any) => q.commandId))
  expect(before.events.filter((e: any) => queued.some((q: any) => q.commandId === e.subjectId)).every((e: any) => e.summary.includes('waiting for dispatcher review'))).toBe(true)
  await dispatcher.goto(`${origin}/app#dispatch`)
  await dispatcher.getByLabel('Day', { exact: true }).fill(day)
  await dispatcher.getByRole('button', { name: new RegExp(`${two.number} Reassigned offline,`) }).click()
  const panel = dispatcher.getByRole('region', { name: 'Reassigned offline', exact: true })
  await expect(panel).toContainText('2 field items arrived after this visit changed.')
  await picture(dispatcher, 1440, 'late-review'); await picture(dispatcher, 390, 'late-review'); await dispatcher.setViewportSize({ width: 1440, height: 1000 })
  const response = dispatcher.waitForResponse(r => r.url().endsWith('/api/glove/commands') && r.request().postDataJSON().type === 'visit.reviewLateEvidence')
  await panel.getByRole('button', { name: 'Mark reviewed', exact: true }).click()
  expect((await (await response).json()).ok).toBe(true)
  await expect(panel.getByText('2 field items arrived after this visit changed.')).toHaveCount(0)
  const after = await enumerate(visit.id), dispatchActor = (await state(dispatcher)).actor.id
  expect(after.captures).toEqual(before.captures)
  expect(after.visit.arrival).toEqual(before.visit.arrival)
  expect(after.visit.assignments).toEqual(before.visit.assignments)
  expect(after.visit.lateEvidence.every((x: any) => x.reviewed.by.id === dispatchActor)).toBe(true)
  expect(after.events.filter((e: any) => e.kind === 'visit.lateEvidenceReviewed')).toHaveLength(1)
  await dispatcher.reload()
  expect((await enumerate(visit.id)).visit.lateEvidence.every((x: any) => !!x.reviewed)).toBe(true)
  proved(5, 'Offline original evidence retained and flagged after desk reassignment; new arrival and note preserved; native Dispatcher reviews with attributable Activity')
})
