import { startDev, stopDev, command, redact, child } from '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/tests/browser/runtime.mjs'
import { chromium } from '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove/node_modules/@playwright/test/index.mjs'
const root = '/home/agent/rer-consolidation/work/sx-glove-quote015-cause-1/run-glove'
let runtime, browser
try {
  runtime = await startDev(root, 8787)
  // Warm only Vite's public page modules. The test still owns its independent
  // real Worker, D1, fixture, owner session and every unchanged assertion.
  browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] })
  const page = await browser.newPage()
  for (const path of ['/quote', '/report', '/document?kind=invoice&id=synthetic-glove-1']) {
    await page.goto(runtime.origin + path)
    await page.waitForLoadState('networkidle')
  }
  await browser.close(); browser = null
  console.log('Owned dev ready; public page modules warm.')
  const output = await command(root + '/node_modules/.bin/playwright', ['test', '--config', process.env.GLOVE_LOCAL_CONFIG || root + '/tests/browser/playwright.config.ts', '--workers=2', 'tests/browser/document-print.spec.ts', 'tests/browser/document-print-fixed.spec.ts', '--repeat-each=' + (process.argv[2] || '20')], root, {
    GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry,
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium',
    GLOVE_BROWSER_OUTPUT: process.env.GLOVE_BROWSER_OUTPUT,
  })
  console.log(redact(output))
} catch (error) {
  console.error(redact(error.message)); process.exitCode = 1
} finally {
  if (browser) await browser.close()
  if (runtime) await stopDev(root, runtime)
}
