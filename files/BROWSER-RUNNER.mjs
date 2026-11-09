import { startDev, command, stopDev, redact } from '/workspace/glove-f205/tests/browser/runtime.mjs'
import { execFileSync } from 'node:child_process'
const root = '/workspace/glove-f205'
let runtime
try {
  runtime = await startDev(root, 8787)
  const output = await command(root + '/node_modules/.bin/playwright', ['test', '--config', root + '/tests/browser/playwright.config.ts', '--workers=1', 'tests/browser/journey.spec.ts', '--grep', 'the owner exports and explicitly erases'], root, { GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry, GLOVE_SCREENSHOTS: process.env.HOME + '/rer-consolidation/work/sx-glove-c-f205/packet/screenshots', GLOVE_PRODUCT_HEAD: execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim(), GLOVE_BROWSER_OUTPUT: process.env.HOME + '/rer-consolidation/work/sx-glove-c-f205/browser', PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium' })
  console.log(redact(output))
} catch (error) { console.error(redact(error.stack)); process.exitCode = 1 }
finally { if (runtime) await stopDev(root, runtime) }
