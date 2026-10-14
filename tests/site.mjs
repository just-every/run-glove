// The run site a visitor reaches: `rer build --site` writes it, and from its homepage every page and every
// same-origin link answers, every asset comes from the site itself, the main action opens /run, and every docs
// page in docs/site.json is published. Served here with clean URLs, as the site Worker serves them.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

execFileSync('pnpm', ['exec', 'rer', 'build', '--site'], { stdio: 'inherit' })
const root = 'dist/site'
const types = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
async function find(path) {
  const clean = decodeURIComponent(path).replace(/\/$/, '') || '/index'
  for (const candidate of [clean, `${clean}.html`]) { try { const file = join(root, candidate); if ((await stat(file)).isFile()) return file } catch {} }
  return null
}
const server = createServer(async (req, res) => {
  const file = await find(new URL(req.url, 'http://x').pathname)
  res.writeHead(file ? 200 : 404, { 'content-type': file ? types[extname(file)] ?? 'application/octet-stream' : 'text/html' })
  res.end(file ? await readFile(file) : '')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
try {
  const seen = new Map(), queue = ['/'], pages = new Map()
  while (queue.length) {
    const path = queue.shift()
    if (seen.has(path)) continue
    const res = await fetch(origin + path)
    seen.set(path, res.status)
    assert.equal(res.status, 200, `${path} answers`)
    if (!res.headers.get('content-type').startsWith('text/html')) continue
    const html = await res.text()
    pages.set(path, html)
    for (const [, attribute, ref] of html.matchAll(/(href|src)="([^"#]+)/g)) {
      const url = new URL(ref.replace(/&amp;/g, '&'), origin + path)
      if (url.origin !== origin) { assert.ok(attribute === 'href' && !/rel="(stylesheet|icon|preload)"/.test(html.slice(html.indexOf(ref) - 80, html.indexOf(ref))), `${path} loads nothing from ${url.origin}`); continue }
      if (!seen.has(url.pathname)) queue.push(url.pathname)
    }
  }
  assert.match(pages.get('/'), /<a class="gl-run" href="\/run">/, 'the main action opens /run')
  assert.ok(pages.has('/run') && pages.has('/docs'), 'the Run page and the docs are reachable from the homepage')
  const manifest = JSON.parse(await readFile('docs/site.json', 'utf8'))
  for (const page of manifest.sections.flatMap(section => section.pages)) assert.ok(pages.has(`/docs/${page.slug}`), `docs page ${page.slug} is published and linked`)
  console.log(`run site: ${pages.size} pages, ${seen.size} files, every link answers`)
} finally { server.close() }
