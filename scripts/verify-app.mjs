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
// Two API files run at once on the hosted runner's four cores; measured at
// about two thirds of one-at-a-time wall time for the same files.
const apiConcurrency = 2, apiSpeedup = 0.65
const portableParts = ['archives', 'journey', 'payments']
const quote = path => "'" + path.replaceAll("'", "'\\''") + "'"

// Greedy longest-first packing of API files by their measured seconds into the
// foundation shard (after its own work) and the API shards.
export function packApi(names, timings, bins) {
  const known = Object.values(timings.files).sort((a, b) => a - b)
  const median = known[Math.floor(known.length / 2)] ?? 10
  const loads = bins.map(name => ({ name, load: name === 'foundation' ? timings.foundationSeconds : 0, files: [] }))
  for (const file of [...names].sort((a, b) => (timings.files[b.split('/').pop()] ?? median) - (timings.files[a.split('/').pop()] ?? median) || a.localeCompare(b))) {
    const bin = loads.reduce((least, next) => next.load < least.load ? next : least)
    bin.load += apiSpeedup * (timings.files[file.split('/').pop()] ?? median)
    bin.files.push(file)
  }
  for (const bin of loads) bin.files.sort()
  return loads
}

export async function verificationPlan({ ci = process.env.GLOVE_CI_PARTITION === '1' } = {}) {
  const plan = JSON.parse(await readFile(new URL('../verification.json', import.meta.url), 'utf8'))
  if (!ci) return plan
  const timings = JSON.parse(await readFile(new URL('./verify-timings.json', import.meta.url), 'utf8'))
  const apiCommand = 'node --test --test-concurrency=1 tests/api/*.test.mjs'
  const apiBins = packApi(files.api, timings, ['foundation', 'api-1', 'api-2'])
  const apiRun = bin => {
    if (!bin.files.length) throw Error('Empty API partition')
    return `node --test --test-concurrency=${apiConcurrency} ${bin.files.map(quote).join(' ')}`
  }
  // Keep the maintained command inventory intact. CI only partitions its
  // serial collections; each API file, portable part and Playwright test
  // still runs exactly once.
  const push = plan.push.flatMap(shard => {
    if (shard.name === 'api') return apiBins.filter(bin => bin.name !== 'foundation').map(bin => ({
      ...shard, name: bin.name, commands: shard.commands.map(command => command === apiCommand ? apiRun(bin) : command),
    }))
    if (shard.name === 'foundation') return [{ ...shard, commands: [...shard.commands, apiRun(apiBins[0])] }]
    if (shard.name === 'portable') return [{ ...shard, commands: shard.commands.map(command => command === 'node tests/portable.mjs'
      // The three parts own separate scratch folders, recorders and ports.
      ? `node scripts/verify-parallel.mjs ${portableParts.map(part => quote(`GLOVE_PORTABLE_PART=${part} node tests/portable.mjs`)).join(' ')}` : command) }]
    const count = shard.name === 'browser' ? 4 : 1
    return Array.from({ length: count }, (_, index) => ({
      ...shard,
      name: count === 1 ? shard.name : `${shard.name}-${index + 1}`,
      commands: shard.commands.map(command => {
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
          return `node --import ./scripts/verify-progress.mjs tests/browser/run.mjs ${selected.map(quote).join(' ')}`
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
