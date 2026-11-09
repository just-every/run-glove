// Inventory the registrations exercised by Verify, including generated cases.
// Run: node tests/inventory.mjs [--limit 190] [--json]
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const options = process.argv.slice(2)
const limitAt = options.indexOf('--limit')
const limit = limitAt < 0 ? 200 : Number(options[limitAt + 1])
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) throw Error('Use a limit from 1 to the seed cap of 200')
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(join(dir, entry.name)) : /\.(mjs|[cm]?tsx?)$/.test(entry.name) ? [join(dir, entry.name)] : [])
const rows = []
let direct = 0
for (const file of files('tests')) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const names = new Set()
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !['node:test', '@playwright/test'].includes(statement.moduleSpecifier.text)) continue
    const clause = statement.importClause
    if (clause?.name) names.add(clause.name.text)
    for (const element of clause?.namedBindings?.elements ?? []) {
      if (['test', 'it'].includes(element.propertyName?.text ?? element.name.text)) names.add(element.name.text)
    }
  }
  const registration = node => ts.isCallExpression(node) && (
    ts.isIdentifier(node.expression) && names.has(node.expression.text)
    || ts.isPropertyAccessExpression(node.expression) && (
      node.expression.name.text === 'test' && ['t', 'context'].includes(node.expression.expression.getText(source))
      || ['only', 'skip', 'todo', 'each'].includes(node.expression.name.text) && names.has(node.expression.expression.getText(source))))
  const containsRegistration = node => {
    if (registration(node)) return true
    return ts.forEachChild(node, containsRegistration) ?? false
  }
  let count = 0
  const visit = (node, multiplier = 1) => {
    if ((ts.isForStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) && containsRegistration(node)) {
      throw Error(`Unresolved generated registration in ${file}; enumerate its cases before reporting the budget`)
    }
    if (ts.isForOfStatement(node) && containsRegistration(node)) {
      if (!ts.isArrayLiteralExpression(node.expression)) throw Error(`Non-literal registration table in ${file}`)
      visit(node.statement, multiplier * node.expression.elements.length)
      return
    }
    if (registration(node)) {
      if (node.expression.getText(source).endsWith('.each')) throw Error(`Enumerate .each cases in ${file} before reporting the budget`)
      direct++
      count += multiplier
    }
    ts.forEachChild(node, child => visit(child, multiplier))
  }
  visit(source)
  if (count) rows.push({ file, count })
}

// Each bare assertion script run by a Verify command counts once. The API and
// browser runners dispatch registrations already counted above.
const verification = JSON.parse(readFileSync('verification.json', 'utf8'))
const commands = [...verification.push, ...verification.nightly].flatMap(shard => shard.commands)
const scripts = [...new Set(commands.flatMap(command => [...command.matchAll(/\bnode (tests\/[\w/.-]+\.mjs)(?=\s|$)/g)].map(match => match[1])))]
  .filter(file => file !== 'tests/browser/run.mjs')
const registrations = rows.reduce((sum, row) => sum + row.count, 0)
const result = { direct, registrations, assertionScripts: scripts, total: registrations + scripts.length, limit, files: rows }
console.log(options.includes('--json') ? JSON.stringify(result, null, 2)
  : `${registrations} registrations (${direct} direct calls) + ${scripts.length} assertion scripts = ${result.total}/${limit}`)
if (result.total > limit) process.exitCode = 1
