import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'

// The ordinary local verification order is unchanged. CI gives each group its
// own checkout and runs it through rer verify, including hosted-output checks.
const stages = [
  ['foundation', 'typecheck'],
  ['foundation', 'test:typecheck'],
  ['foundation', 'test:runtime'],
  ['foundation', 'test:email-link'],
  ['api', 'test:api'],
  ['portable', 'test:portable'],
  ['foundation', 'test:site'],
  ['browser', 'test:browser'],
]
const files = {
  foundation: ['tests/incremental-typecheck.test.mjs', 'tests/runtime.mjs', 'tests/email-link.mjs', 'tests/site.mjs'],
  api: readdirSync('tests/api').filter(file => file.endsWith('.test.mjs')).sort().map(file => `tests/api/${file}`),
  portable: ['tests/portable.mjs'],
  browser: readdirSync('tests/browser').filter(file => file.endsWith('.spec.ts')).sort().map(file => `tests/browser/${file}`),
}
const shard = process.env.GLOVE_VERIFY_SHARD
if (shard && !Object.hasOwn(files, shard)) throw Error(`Unknown verification shard: ${shard}`)
if (process.argv[2] === '--list') {
  console.log(JSON.stringify(files, null, 2))
} else {
  if (process.argv.length > 2) throw Error('Usage: node scripts/verify-app.mjs [--list]')
  // Each group uses a real production build, never a fixture or substitute.
  for (const name of ['build', ...stages.filter(([group]) => !shard || group === shard).map(([, name]) => name)]) {
    const result = spawnSync('pnpm', ['run', name], { stdio: 'inherit' })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}
