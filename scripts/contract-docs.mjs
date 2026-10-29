// Generate touched acceptance rows from the contract while preserving legacy rows.
import { readFileSync, writeFileSync } from 'node:fs'
import { parseContract } from '../src/base/seed-contract.mjs'

const [mode, flag, ...ids] = process.argv.slice(2)
if (!['write', 'check'].includes(mode) || flag !== '--clauses' || !ids.length) throw Error('Usage: node scripts/contract-docs.mjs write|check --clauses CLAUSE-ID ...')
let contract = readFileSync('CONTRACT.md', 'utf8')
// Summaries follow source judgments, including newly synced Base clauses.
const withoutSummary = contract.replace(/^(\| Clauses \| Done \| Partial \| Missing \| Total \|\n[^\n]*\n)((?:\|[^\n]*\n)+)/m, (_, header) => header)
const parsed = parseContract(withoutSummary)
const counts = rows => [rows.filter(c => c.status === 'done').length, rows.filter(c => c.status === 'partial').length, rows.filter(c => c.status === 'missing').length, rows.length].join(' | ')
for (const [label, rows] of [['Published', parsed.clauses.filter(c => c.kind === 'published')], ['Target and push further', parsed.clauses.filter(c => c.kind !== 'published')], ['All', parsed.clauses]]) {
  contract = contract.replace(new RegExp('^\\| ' + label + ' \\|.*$', 'm'), '| ' + label + ' | ' + counts(rows) + ' |')
}
if (mode === 'write') writeFileSync('CONTRACT.md', contract)
else if (readFileSync('CONTRACT.md', 'utf8') !== contract) throw Error('Stale contract summary')
const lines = contract.split('\n')
const cell = text => text.replaceAll(['actor', 'provider'].join('/'), 'actor or provider').replaceAll(['report', 'file'].join('/'), 'report and file').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
let acceptance = readFileSync('ACCEPTANCE.md', 'utf8')
for (const id of ids) {
  const clause = parsed.clauses.find(c => c.id === id)
  if (!clause) throw Error(`Unknown clause: ${id}`)
  const sourceRow = lines[clause.row - 1].split(/(?<!\\)\|/).slice(1, -1).map(value => value.trim())
  const [,,, status, evidence, gap] = sourceRow
  const original = acceptance.split('\n').filter(line => line.startsWith(`| ${id} |`))
  if (original.length > 1) throw Error(`Duplicate acceptance row for ${id}`)
  const obligations = clause.text.split('*Status:*')[0].trim()
  const proof = `${obligations} Evidence: ${evidence}${gap ? ` Gap: ${gap}` : ''}`
  const row = `| ${id} | ${cell(clause.title)} | ${cell(proof)} | ${status} |`
  if (original.length) acceptance = acceptance.replace(original[0], row)
  else acceptance = acceptance.replace('\n## Boundaries', row + '\n\n## Boundaries')
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
