import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { readdirSync } from 'node:fs'

// Preserve Glove's foundation, API, portable and browser partitions while the
// shared CI lifecycle chooses coverage and retains one hosted-output proof.
const files = {
  foundation: ['tests/runtime.mjs', 'tests/email-link.mjs', 'tests/site.mjs'],
  api: readdirSync('tests/api').filter(file => file.endsWith('.test.mjs')).sort().map(file => `tests/api/${file}`),
  portable: ['tests/portable.mjs'],
  browser: readdirSync('tests/browser').filter(file => file.endsWith('.spec.ts')).sort().map(file => `tests/browser/${file}`),
}
export async function verificationPlan() {
  return JSON.parse(await readFile(new URL('../verification.json', import.meta.url), 'utf8'))
}

export function run(command, env = process.env) {
  console.log(`> ${command}`)
  const result = spawnSync('/bin/bash', ['-euo', 'pipefail', '-c', command], { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (process.argv[1] === import.meta.filename) {
  if (process.argv[2] === '--list') {
    console.log(JSON.stringify(files, null, 2))
  } else {
    if (process.argv.length > 2) throw Error('Usage: node scripts/verify-app.mjs [--list]')
    const plan = await verificationPlan()
    const all = [...plan.push, ...plan.nightly]
    const name = process.env.GLOVE_VERIFY_SHARD || process.env.SEED_VERIFY_SHARD
    const selected = name ? all.filter(shard => shard.name === name) : all
    if (!selected.length) throw Error(`Unknown verification shard: ${name}`)
    for (const shard of selected) for (const command of shard.commands) run(command)
  }
}
