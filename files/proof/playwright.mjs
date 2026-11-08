import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
const { origin, entry } = JSON.parse(await readFile('/tmp/sx-glove-runtime-private.json', 'utf8'))
const label = process.argv[2]
const packet = '/home/agent/rer-consolidation/work/sx-glove-browserflake-1/packet'
await mkdir(`${packet}/${label}`, { recursive: true })
const env = { ...process.env, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium', GLOVE_BASE_URL: origin, GLOVE_OPEN: entry, GLOVE_SITE_ROOT: `${process.cwd()}/dist/site`, GLOVE_BROWSER_OUTPUT: `/tmp/sx-glove-results-${label}` }
// Screenshots are proof only for actual changed flows, never the private entry.
if (process.env.SX_SCREENSHOTS) env.GLOVE_SCREENSHOTS = `${packet}/${label}/screenshots`
else delete env.GLOVE_SCREENSHOTS
const args = ['test', '--config', process.env.SX_CONFIG || 'tests/browser/playwright.config.ts', '--workers=1', ...process.argv.slice(3)]
const child = spawn(`${process.cwd()}/node_modules/.bin/playwright`, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
const clean = value => String(value).replaceAll(entry, '[private owner entry]').replaceAll(origin, '[test origin]').replace(/(?:https?:\/\/[^\s"<>]*)(?:rer-dev|token)=[^\s"<>]*/gi, '[private URL]')
for (const pipe of [child.stdout, child.stderr]) pipe.on('data', chunk => { output += chunk; process.stdout.write(clean(chunk)) })
const exit = await new Promise((resolve,reject) => { child.once('error',reject); child.once('close',resolve) })
await writeFile(`${packet}/${label}/playwright.log`, clean(output))
await writeFile(`${packet}/${label}/receipt.json`, JSON.stringify({command: `playwright ${args.join(' ')}`, label, executable: '/usr/bin/chromium', exit, timestamp: new Date().toISOString()}, null, 2)+'\n')
process.exitCode = exit
