import { mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { command, redact } from '/home/agent/rer-consolidation/work/sx-glove-c-f214/run-glove/tests/browser/runtime.mjs'
const root = '/home/agent/rer-consolidation/work/sx-glove-c-f214/run-glove'
const output = '/home/agent/rer-consolidation/work/sx-glove-c-f214/browser'
const require = createRequire(join(root, 'package.json'))
const packageRoot = join(require.resolve('@runeditrun/rer/package.json'), '..')
const { developmentTarget } = await import(pathToFileURL(join(packageRoot, 'onboarding/operator-installer.mjs')))
const { readDevKey, resolvePersona, openUrl } = await import(pathToFileURL(join(packageRoot, 'cli/dev-identity.mjs')))
const { chromium } = await import(pathToFileURL(join(root, 'node_modules/@playwright/test/index.mjs')))
const site = await mkdtemp(join(tmpdir(), 'glove-candidate-site-'))
let server
try {
  execFileSync('tar', ['-x', '-C', site], { input: execFileSync('git', ['archive', 'HEAD'], { cwd: root, maxBuffer: 64 * 1024 * 1024 }) })
  await symlink(join(root, 'node_modules'), join(site, 'node_modules'), 'dir')
  await command(join(root, 'node_modules/.bin/rer'), ['build', '--site'], site)
  console.log('Candidate public site built from the committed source without private installation files.')
  const origin = 'http://127.0.0.1:8787'
  const key = await readDevKey(root)
  if (!key) throw Error('The prepared checkout has no local dev gate.')
  const target = developmentTarget({ root, origin, devKey: key })
  Object.assign(process.env, target[2].env)
  const { createServer } = await import(pathToFileURL(require.resolve('vite')))
  // Use the declared Vite target and native dev gate directly. The external
  // 20-minute runner bound covers the cold transform; no product timeout changes.
  server = await createServer({ root, server: { host: '127.0.0.1', port: 8787, strictPort: true } })
  await server.listen()
  const health = await fetch(origin + '/health')
  if (!health.ok) throw Error('Owned Vite target health failed: ' + health.status)
  const persona = await resolvePersona(origin, key, 'owner')
  const entry = openUrl(origin, key, { path: '/__dev/key', as: persona.as })
  console.log('Declared development target is healthy; native owner entry retained only in memory.')
  const warmBrowser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  try {
    const context = await warmBrowser.newContext()
    const page = await context.newPage()
    await page.goto(entry)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    for (const tab of ['team', 'quotes']) {
      await page.goto(origin + '/app#' + tab)
      await page.reload()
      await page.waitForFunction(() => !document.body.innerText.includes('Loading your work…'), undefined, { timeout: 60000 })
      await page.waitForLoadState('networkidle')
    }
    await context.close()
  } finally { await warmBrowser.close() }
  console.log('Normal native page loads completed before the unchanged journey.')
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  const log = await command(join(root, 'node_modules/.bin/playwright'), ['test', '--config', join(root, 'tests/browser/playwright.config.ts'), '--workers=1', 'tests/browser/journey.spec.ts', '--grep', 'Reserve with Google request intake and external-send attestation'], root, {
    GLOVE_BASE_URL: origin, GLOVE_OPEN: entry, GLOVE_SITE_ROOT: join(site, 'dist/site'),
    GLOVE_SCREENSHOTS: join(output, 'screenshots'), GLOVE_PRODUCT_HEAD: head,
    GLOVE_BROWSER_OUTPUT: join(output, 'results', 'direct-candidate'),
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium',
  })
  console.log(redact(log))
  console.log('Candidate Reserve browser journey passed at 1440 and 390.')
} catch (error) { console.error(redact(error.stack || error.message)); process.exitCode = 1 }
finally { await server?.close(); await rm(site, { recursive: true, force: true }) }
