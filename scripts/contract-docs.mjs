// CONTRACT.md is the only source; the shared generator owns every generated view.
import { readFileSync } from 'node:fs'
import { parseContract } from '../src/base/seed-contract.mjs'

const [mode, flag, ...ids] = process.argv.slice(2)
if (flag === '--clauses' && ['write', 'check'].includes(mode)) {
  if (!ids.length) throw Error('List every touched clause after --clauses')
  const known = new Set(parseContract(readFileSync('CONTRACT.md', 'utf8')).clauses.map(clause => clause.id))
  for (const id of ids) if (!known.has(id)) throw Error(`Unknown clause: ${id}`)
  process.argv.splice(3)
}
await import('../src/base/contract-docs.mjs')
