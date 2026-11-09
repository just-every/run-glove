import { startDev, stopDev, command, redact } from './run-glove/tests/browser/runtime.mjs'
import { resolve, join } from 'node:path'
const root = resolve('./'), output = resolve('../packet')
let runtime
try {
  runtime = await startDev(root, 8787)
  const result = await command(join(root, 'node_modules/.bin/playwright'), ['test', '--config', join(root, 'tests/browser/playwright.config.ts'), '--workers=1', 'tests/browser/conversation.spec.ts'], root, { GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium', GLOVE_SCREENSHOTS: join(output, 'screenshots'), GLOVE_BROWSER_OUTPUT: join(output, 'browser-results') })
  console.log(redact(result))
} catch (error) {
  console.error(redact(error.message))
  if (runtime) console.error(redact(runtime.output()).slice(-6000))
  process.exitCode = 1
} finally {
  if (runtime) await stopDev(root, runtime)
}
