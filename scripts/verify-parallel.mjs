import { spawn } from 'node:child_process'

// Run independent shell commands at once and fail if any fails. Each line of
// output is prefixed with its command so interleaved logs stay readable.
const commands = process.argv.slice(2)
if (!commands.length) throw Error('Usage: node scripts/verify-parallel.mjs COMMAND...')
const codes = await Promise.all(commands.map((command, index) => new Promise((resolve, reject) => {
  const label = `[${index + 1}/${commands.length}]`
  console.log(`${label} > ${command}`)
  const child = spawn('/bin/bash', ['-euo', 'pipefail', '-c', command], { stdio: ['ignore', 'pipe', 'pipe'] })
  for (const [pipe, out] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    let pending = ''
    pipe.on('data', chunk => {
      const lines = (pending + chunk).split('\n')
      pending = lines.pop()
      for (const line of lines) out.write(`${label} ${line}\n`)
    })
    pipe.on('end', () => { if (pending) out.write(`${label} ${pending}\n`) })
  }
  child.once('error', reject)
  child.once('close', code => { console.log(`${label} exit=${code}`); resolve(code) })
})))
process.exit(codes.every(code => code === 0) ? 0 : 1)
