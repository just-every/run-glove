import { spawn, execFileSync } from 'node:child_process'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { redact } from '/workspace/run-glove/tests/browser/runtime.mjs'

const root = '/workspace/run-glove'
const packet = join(process.env.HOME, 'rer-consolidation/work/sx-glove-browserflake-2/packet')
const results = []
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
for (let n = 1; n <= 10; n++) {
  const name = 'confirmation-' + String(n).padStart(2, '0')
  const destination = join(packet, name)
  await mkdir(destination, { recursive: true })
  const start = Date.now()
  const child = spawn('node', ['tests/browser/run.mjs', 'tests/browser/fresh-install.spec.ts'], {
    cwd: root, env: { ...process.env, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/usr/bin/chromium',
      GLOVE_BROWSER_OUTPUT: destination, GLOVE_SCREENSHOTS: join(destination, 'screenshots') },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  for (const pipe of [child.stdout, child.stderr]) pipe.on('data', data => { output += data })
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve) })
  output = redact(output).replace(/^.*(?:\bcookie\s*:|set-cookie\s*:|authorization\s*:).*$/gim, '[private request headers omitted]')
  await writeFile(join(destination, 'command.log'), output)
  const row = { name, head, command: 'node tests/browser/run.mjs tests/browser/fresh-install.spec.ts',
    executablePath: '/usr/bin/chromium', cpuThrottlingRate: 1, exit: code, seconds: (Date.now()-start)/1000 }
  results.push(row)
  await writeFile(join(packet, 'stability-receipt.json'), JSON.stringify({ head, requiredConsecutiveRuns: 10, results }, null, 2) + '\n')
  console.log(JSON.stringify(row))
  console.log(output.slice(-2000))
  if (code !== 0) process.exit(code || 1)
}
