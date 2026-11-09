import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { startDev, stopDev, command, redact } from '/home/agent/rer-consolidation/work/sx-glove-c-f224/repo/tests/browser/runtime.mjs'
const root = '/home/agent/rer-consolidation/work/sx-glove-c-f224/repo'
const packet = '/home/agent/rer-consolidation/work/sx-glove-c-f224/packet'
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8'}).trim()
let runtime, result = 'failed'
const start = new Date().toISOString()
try {
  runtime = await startDev(root, 8787)
  const log = await command(join(root,'node_modules/.bin/playwright'), ['test','--config','tests/browser/playwright.config.ts','--workers=1','tests/browser/email.spec.ts'], root, {
    GLOVE_BASE_URL:runtime.origin, GLOVE_OPEN:runtime.entry, GLOVE_SCREENSHOTS:join(packet,'screenshots'), GLOVE_PRODUCT_HEAD:head, GLOVE_BROWSER_OUTPUT:join(packet,'browser'), PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:'/usr/bin/chromium',
  })
  console.log(redact(log))
  result = 'passed'
} catch(error) { console.error(redact(error.message)); process.exitCode=1 }
finally {
  await stopDev(root,runtime)
  await writeFile(join(packet,'BROWSER-RECEIPT.json'),JSON.stringify({head,command:'existing email browser registration against owned rer dev',start,finish:new Date().toISOString(),result,widths:[1440,390],executable:'/usr/bin/chromium',cleanup:'owned server stopped in finally'},null,2)+'\n')
}
