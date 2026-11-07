// Observe the existing harness without changing its commands, captured output,
// exit codes, cleanup, assertions or timeouts. The harness otherwise prints a
// child's buffered output only when that entire child has finished.
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { basename } from 'node:path'
import { redact } from '../tests/browser/runtime.mjs'

const spawn = childProcess.spawn
childProcess.spawn = function (command, args, options) {
  const started = performance.now(), name = basename(command)
  const phase = name === 'corepack' ? 'frozen install' : name === 'playwright' ? 'browser assertions'
    : name === 'rer' ? { build: 'site build', setup: 'native setup', dev: 'native dev' }[args?.[0]] ?? name : name
  console.log(`[verify phase] ${phase}: start`)
  const child = spawn.call(this, command, args, options)
  // Only Playwright's test-result lines are public progress. Never stream the
  // native owner's entry, environment, request data or arbitrary child output.
  if (name === 'playwright') {
    let pending = ''
    child.stdout?.on('data', chunk => {
      pending += chunk
      const lines = pending.split(/\r?\n/)
      pending = lines.pop()
      for (const line of lines) if (/^(?:Running \d+ tests?\b|\s+[✓✘×]\s|\s+\d+ (?:passed|failed|skipped)\b)/.test(line)) {
        console.log(`[verify progress] ${redact(line)}`)
      }
    })
  }
  child.once('close', (code, signal) => console.log(`[verify phase] ${phase}: exit=${code} signal=${signal ?? 'none'} elapsed_ms=${Math.round(performance.now() - started)}`))
  return child
}
syncBuiltinESMExports()
