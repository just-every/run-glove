import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'

const repo = resolve(process.argv[2])
const packet = resolve(process.argv[3])
const { build } = await import(pathToFileURL(join(repo, 'node_modules/esbuild/lib/main.js')))
const { chromium } = await import(pathToFileURL(join(repo, 'node_modules/@playwright/test/index.mjs')))
const { installation, business } = await import(pathToFileURL(join(repo, 'tests/api/harness.mjs')))
const at = '2026-10-22T10:20:00.000Z'
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const output = '/tmp/glove-delay-browser-build'
await mkdir(output, { recursive: true })
await build({ stdin: { contents: "import React from 'react'; import { createRoot } from 'react-dom/client'; import { GloveApp } from './src/ui/app'; createRoot(document.getElementById('root')).render(React.createElement(GloveApp));", resolveDir: repo, loader: 'tsx' }, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic', outfile: join(output, 'app.js'), define: { 'process.env.NODE_ENV': '"production"' } })
const h = await installation({ at })
let server, browser
try {
  const b = await business(h, { timezone: 'UTC' })
  const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Morning service overrun' })
  const nextJob = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Delay recovery visit' })
  const earlier = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-22', start: '09:00', end: '10:00' })
  const next = await b.dispatcher.run('visit.book', { jobId: nextJob.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:20', end: '11:20', window: { start: '10:00', end: '12:00' } })
  await b.priyaPerson.run('visit.arrive', { visitId: earlier.id, deviceTime: earlier.startAt })
  const before = await h.state()
  const watch = await h.request('/api/glove/delays?at=' + at, { as: b.dispatcher.cookie }).then(r => r.json())
  assert.deepEqual(watch.risks.find(r => r.visitId === next.id).options.map(o => [o.technicianId, o.start]), [[b.tom.id, '10:20'], [b.priya.id, '10:45']])
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glove Dispatch</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="/rer-theme.css"><link rel="stylesheet" href="/app.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>'
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      if (url.pathname === '/app') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return }
      const relative = url.pathname.replace(/^\/+/, '')
      if (relative.includes('..')) { res.writeHead(404); res.end(); return }
      const path = ['app.js', 'app.css'].includes(relative) ? join(output, relative) : join(repo, 'public', relative)
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
      res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' })
      res.end(await readFile(path))
    } catch { res.writeHead(404); res.end() }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } })
  const page = await context.newPage()
  await page.clock.install({ time: new Date(at) })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route(origin + '/api/glove/**', async route => {
    const req = route.request(), url = new URL(req.url())
    const response = await h.request(url.pathname + url.search, { as: b.dispatcher.cookie, method: req.method(), ...(req.postData() ? { body: JSON.parse(req.postData()) } : {}) })
    await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'application/json', body: Buffer.from(await response.arrayBuffer()) })
  })
  await page.goto(origin + '/app#dispatch')
  const card = page.getByRole('region', { name: 'Location delay watch', exact: true })
  await card.waitFor({ state: 'visible' })
  assert.match(await card.innerText(), /20 min past its booked end; expected free about 10:40/)
  assert.match(await card.innerText(), /Tom B. is free at the same time/)
  assert.match(await card.innerText(), /Priya N. later, inside the arrival window/)
  const screens = []
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1050 })
    await card.scrollIntoViewIfNeeded()
    const file = `dispatch-delay-${width}.png`
    await page.screenshot({ path: join(packet, file), fullPage: false })
    screens.push({ width, file, text: await card.innerText(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), smallText: await card.locator('*').evaluateAll(nodes => nodes.filter(n => n.textContent.trim() && getComputedStyle(n).display !== 'none' && parseFloat(getComputedStyle(n).fontSize) < 13).map(n => ({ tag: n.tagName, size: getComputedStyle(n).fontSize }))) })
  }
  const iconControls = await page.locator('button:visible,a:visible').evaluateAll(nodes => nodes.filter(n => !(n.innerText || '').trim() && !n.querySelector('img[alt]:not([alt=""])')).map(n => ({ label: n.getAttribute('aria-label'), tooltip: n.getAttribute('aria-describedby') })))
  assert.ok(iconControls.every(c => c.tooltip), JSON.stringify(iconControls))
  assert.deepEqual(await h.state(), before, 'browser reads change no business record')
  assert.deepEqual(errors, [])
  await writeFile(join(packet, 'browser-receipt.json'), JSON.stringify({ head, at, status: 'passed', mode: 'Production GloveApp built with esbuild; real fixture Worker routes and native dispatcher session; no provider data stub or new browser registration. Standard rer setup hit a listener readiness timeout.', screens, iconControls, errors }, null, 2) + '\n')
  await context.close()
  console.log('Dispatch delay card captured at 1440 and 390; route assertions and unchanged-state check passed.')
} finally {
  if (browser) await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
  await h.close()
}
