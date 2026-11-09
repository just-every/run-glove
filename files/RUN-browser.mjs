import { startDev, stopDev, command, redact } from '/workspace/glove-f190/tests/browser/runtime.mjs'
const root = '/workspace/glove-f190'
let runtime
try {
  runtime = await startDev(root, 8787)
  const output = await command(root + '/node_modules/.bin/playwright', ['test', '--config', root + '/tests/browser/playwright.config.ts', 'tests/browser/document-print.spec.ts'], root, { GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium', GLOVE_BROWSER_OUTPUT: '/home/agent/rer-consolidation/work/sx-glove-c-f190/packet/browser', GLOVE_SCREENSHOTS: '/home/agent/rer-consolidation/work/sx-glove-c-f190/packet/screenshots' })
  console.log(redact(output))
} catch (e) { console.error(redact(e.stack)); process.exitCode = 1 }
finally { if (runtime) await stopDev(root, runtime) }
