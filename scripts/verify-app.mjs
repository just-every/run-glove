import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { readdirSync } from 'node:fs'

// Preserve Glove's foundation, API, portable and browser partitions while the
// shared CI lifecycle chooses coverage and retains one hosted-output proof.
const files = {
  foundation: ['tests/runtime.mjs', 'tests/email-link.mjs', 'tests/site.mjs'],
  api: readdirSync('tests/api').filter(file => file.endsWith('.test.mjs')).sort().map(file => `tests/api/${file}`),
  portable: ['tests/portable.mjs'],
  browser: readdirSync('tests/browser').filter(file => file.endsWith('.spec.ts')).sort().map(file => `tests/browser/${file}`),
}
export async function verificationPlan({ ci = process.env.GLOVE_CI_PARTITION === '1' } = {}) {
  const plan = JSON.parse(await readFile(new URL('../verification.json', import.meta.url), 'utf8'))
  if (!ci) return plan
  // Keep the maintained command inventory intact. CI only partitions its two
  // serial collections; each API file and each Playwright test still runs once.
  const push = plan.push.flatMap(shard => {
    const count = shard.name === 'api' ? 2 : shard.name === 'browser' ? 4 : 1
    return Array.from({ length: count }, (_, index) => ({
      ...shard,
      name: count === 1 ? shard.name : `${shard.name}-${index + 1}`,
      commands: shard.commands.map(command => {
        if (command === 'node --test --test-concurrency=1 tests/api/*.test.mjs') {
          const selected = files.api.filter((_, file) => file % count === index)
          if (!selected.length) throw Error('Empty API partition')
          return `node --test --test-concurrency=1 ${selected.map(path => "'" + path.replaceAll("'", "'\\''") + "'").join(' ')}`
        }
        if (command === 'node tests/browser/run.mjs') {
          // Keep the original ordered journey file intact. Routing also uses
          // its installation's business timezone before forwarding to its own
          // API fixture, so it must follow that file in the same installation.
          const selected = files.browser.filter((path, file) => {
            const dependency = path === 'tests/browser/routing.spec.ts'
              ? files.browser.indexOf('tests/browser/journey.spec.ts') : file
            if (dependency < 0) throw Error('Routing requires the installation journey')
            return dependency % count === index
          })
          if (!selected.length) throw Error('Empty browser partition')
          return `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs ${selected.map(path => "'" + path.replaceAll("'", "'\\''") + "'").join(' ')}`
        }
        return command
      }),
    }))
  })
  if (push.length > 8) throw Error('CI plan exceeds eight shard jobs')
  return { ...plan, push }
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
    for (const shard of selected) for (const command of shard.commands) {
      // Only the workflow that downloaded this exact run's build sets this.
      // Setup/export/restore journeys retain all their independent builds.
      if (command === 'pnpm run build' && process.env.GLOVE_CI_PARTITION === '1' && process.env.GLOVE_CI_PREBUILT === '1') {
        await access('dist/server/wrangler.json')
        await access('dist/client')
        continue
      }
      run(command)
    }
  }
}
