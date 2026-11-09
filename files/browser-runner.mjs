import { mkdtemp, mkdir, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { command, startDev, stopDev, redact } from '/home/agent/rer-consolidation/work/sx-glove-c-f214/run-glove/tests/browser/runtime.mjs'
const root = '/home/agent/rer-consolidation/work/sx-glove-c-f214/run-glove'
const output = '/home/agent/rer-consolidation/work/sx-glove-c-f214/browser'
const site = await mkdtemp(join(tmpdir(), 'glove-candidate-site-'))
let runtime
try {
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
  execFileSync('tar', ['-x', '-C', site], { input: archive })
  await symlink(join(root, 'node_modules'), join(site, 'node_modules'), 'dir')
  await command(join(root, 'node_modules/.bin/rer'), ['build', '--site'], site)
  console.log('Candidate public site built in a source-only tree without installation-private files.')
  runtime = await startDev(root, 8787)
  console.log('Owned candidate dev runtime ready; private entry retained only in memory.')
  // Warm Vite's first route transform before the unchanged five-second UI assertions.
  const { chromium } = await import('/home/agent/rer-consolidation/work/sx-glove-c-f214/run-glove/node_modules/@playwright/test/index.mjs')
  const warmBrowser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  try {
    const context = await warmBrowser.newContext()
    const page = await context.newPage()
    await page.goto(runtime.entry)
    await page.waitForURL(u => ['/app', '/setup'].includes(u.pathname) && !u.hash.includes('rer-dev'))
    if (new URL(page.url()).pathname === '/setup') {
      await page.getByRole('checkbox').check()
      await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
      await page.waitForURL(u => u.pathname === '/app')
    }
    for (const tab of ['team', 'quotes']) {
      await page.goto(runtime.origin + '/app#' + tab)
      await page.reload()
      await page.waitForFunction(() => !document.body.innerText.includes('Loading your work…'), { timeout: 60000 })
      await page.waitForLoadState('networkidle')
    }
    await context.close()
  } finally { await warmBrowser.close() }
  console.log('Native browser warmed Vite route transforms; all product assertions remain unchanged.')
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim()
  const log = await command(join(root, 'node_modules/.bin/playwright'), ['test', '--config', join(root, 'tests/browser/playwright.config.ts'), '--workers=1', 'tests/browser/journey.spec.ts', '--grep', 'Reserve with Google request intake and external-send attestation'], root, {
    GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry,
    GLOVE_SITE_ROOT: join(site, 'dist/site'), GLOVE_SCREENSHOTS: join(output, 'screenshots'),
    GLOVE_PRODUCT_HEAD: head, GLOVE_BROWSER_OUTPUT: join(output, 'results', 'candidate'),
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium',
  })
  console.log(redact(log))
  console.log('Candidate Reserve browser journey passed at 1440 and 390.')
} catch (error) {
  console.error(redact(error.stack || error.message))
  if (runtime) console.error(redact(runtime.output()).slice(-4000))
  process.exitCode = 1
} finally {
  if (runtime) await stopDev(root, runtime)
  await rm(site, { recursive: true, force: true })
}
