// Generate touched acceptance rows from the contract while preserving legacy rows.
import { readFileSync, writeFileSync } from 'node:fs'
import { parseContract } from '../src/base/seed-contract.mjs'

const [mode, flag, ...ids] = process.argv.slice(2)
if (!['write', 'check'].includes(mode) || flag !== '--clauses' || !ids.length) throw Error('Usage: node scripts/contract-docs.mjs write|check --clauses CLAUSE-ID ...')
const contract = readFileSync('CONTRACT.md', 'utf8'), parsed = parseContract(contract)
const lines = contract.split('\n')
const cell = text => text.replaceAll(['actor', 'provider'].join('/'), 'actor or provider').replaceAll(['report', 'file'].join('/'), 'report and file').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
let acceptance = readFileSync('ACCEPTANCE.md', 'utf8')
for (const id of ids) {
  const clause = parsed.clauses.find(c => c.id === id)
  if (!clause) throw Error(`Unknown clause: ${id}`)
  const sourceRow = lines[clause.row - 1].split(/(?<!\\)\|/).slice(1, -1).map(value => value.trim())
  const [,,, status, evidence, gap] = sourceRow
  const original = acceptance.split('\n').filter(line => line.startsWith(`| ${id} |`))
  if (original.length !== 1) throw Error(`Expected one existing acceptance row for ${id}`)
  const obligations = clause.text.split('*Status:*')[0].trim()
  const proof = `${obligations} Evidence: ${evidence}${gap ? ` Gap: ${gap}` : ''}`
  acceptance = acceptance.replace(original[0], `| ${id} | ${cell(clause.title)} | ${cell(proof)} | ${status} |`)
}
const { done, partial, missing, total } = parsed.counts
const published = parsed.clauses.filter(c => c.kind === 'published').length
acceptance = acceptance.replace(/^Row recount:.*$/m, `Row recount: ${total} clauses: ${done} done or LOCAL PROVEN, ${partial} partial and ${missing} missing (${published} published; ${total - published} target and push-further).`)
const claimsStart = lines.indexOf('## Homepage claims'), claimsEnd = lines.indexOf('## Status', claimsStart)
if (claimsStart < 0 || claimsEnd < 0) throw Error('Contract homepage claims section is missing')
const claims = '# Glove claims\n\nGenerated from CONTRACT.md. Change the source and regenerate.\n\n' + lines.slice(claimsStart + 1, claimsEnd).join('\n').trim() + '\n'
const outputs = new Map([['ACCEPTANCE.md', acceptance], ['docs/CLAIMS.md', claims]])
for (const [path, expected] of outputs) {
  if (mode === 'write') writeFileSync(path, expected)
  else if (readFileSync(path, 'utf8') !== expected) throw Error(`Stale generated document: ${path}`)
}
console.log(`Contract documents ${mode}: ${ids.join(', ')}; ${done} done, ${partial} partial, ${missing} missing`)
