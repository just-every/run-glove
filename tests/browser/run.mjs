// Real setup and dev in a fresh owned copy of this checkout, then the
// desk and technician journeys at 1440 and 390 px in headless Chromium.
import { cp, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { devInstallation } from '../dev-installation.mjs'
import { freshCopy, command, startDev, stopDev, redact } from './runtime.mjs'

const workspace = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const evidence = resolve(process.env.GLOVE_BROWSER_OUTPUT || join(tmpdir(), 'glove-browser-evidence'))
const screenshots = resolve(process.env.GLOVE_SCREENSHOTS || join(evidence, 'screenshots'))
if ([evidence, screenshots].some(path => path === workspace || path.startsWith(workspace + '/'))) throw new Error('Browser evidence must be outside the product checkout.')
await mkdir(evidence, { recursive: true })
await mkdir(screenshots, { recursive: true })
const parent = await mkdtemp(join(process.env.GLOVE_WORK_DIR || tmpdir(), 'glove-browser-'))
const root = join(parent, 'installation')
let runtime, failure, prepared = false, stopped = true
try {
  await freshCopy(workspace, root)
  prepared = true
  // Build public docs before the test installation has private owner settings.
  // Keep this output outside dist, which application setup rebuilds.
  await command(join(root, 'node_modules/.bin/rer'), ['build', '--site'], root)
  await cp(join(root, 'dist/site'), join(parent, 'site'), { recursive: true })
  runtime = await devInstallation(
    port => command(join(root, 'node_modules/.bin/rer'), ['setup', '--owner-email', 'owner@example.test', '--non-interactive', '--port', String(port)], root),
    port => startDev(root, port),
  )
  await command(join(workspace, 'node_modules/.bin/playwright'), ['test', '--config', join(workspace, 'tests/browser/playwright.config.ts'), '--workers=1', ...process.argv.slice(2)], workspace, { GLOVE_BASE_URL: runtime.origin, GLOVE_OPEN: runtime.entry, GLOVE_SITE_ROOT: join(parent, 'site'), GLOVE_SCREENSHOTS: screenshots, GLOVE_BROWSER_OUTPUT: evidence }, { stream: true })
  console.log(`Real setup/dev and desk/technician journeys passed at 1440 and 390. Screenshots: ${screenshots}`)
} catch (error) {
  failure = error
  // The dev runtime's own output names a reload, restart or server error behind a stalled journey.
  if (runtime) console.error(`Dev runtime output (last 6000 characters):\n${redact(runtime.output()).slice(-6000)}`)
} finally {
  try { if (prepared) await stopDev(root, runtime) } catch (error) { stopped = false; failure ||= error }
  if (stopped) await rm(parent, { recursive: true, force: true })
  else console.error(`Owned installation retained for stop recovery: ${root}`)
}
if (failure) { console.error(redact(failure.message)); process.exitCode = 1 }
