import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

// CUST-003: a 500-row customer CSV in the owner's own column order, with bad
// rows and duplicates, previewed (new, matched, rejected with reasons), committed
// through the import kit journal, undone, and Glove's CSV export re-importing
// unchanged. CUST-005: incoming customers sharing a phone are flagged.

const cell = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
const csv = rows => rows.map(r => r.map(cell).join(',')).join('\n')

function ownersFile() {
  const header = ['ZIP', 'Mobile', 'Company', 'Street address', 'Type', 'E-mail', 'PO needed', 'Gate notes']
  const rows = [], row = (r = {}) => rows.push([r.zip ?? '', r.phone ?? '', r.name ?? '', r.address ?? '', r.kind ?? '', r.email ?? '', r.po ?? '', r.notes ?? ''])
  // 438 one-property customers; one name a spreadsheet would run as a formula.
  for (let i = 0; i < 438; i++) row({ name: i === 7 ? '=HYPERLINK("http://x.example")' : `Customer ${i}`, phone: `+1 (312) 7${String(i).padStart(2, '0')}-${String(1000 + i)}`, email: `c${i}@example.com`, address: `${100 + i} Main St, Springfield, IL`, zip: '62701', kind: i % 5 ? 'Residential' : 'business', po: i % 5 ? '' : 'yes', notes: i === 3 ? 'Dog in yard, "Rex"' : '' })
  // 20 customers with a second property each (same details, another address).
  for (let i = 0; i < 20; i++) for (const n of [1, 2]) row({ name: `Two Sites ${i}`, phone: `(415) 600-${String(2000 + i)}`, email: `two${i}@example.com`, address: `${n} Oak Ave, Unit ${i}, Austin, TX 73301` })
  // 5 rows repeating an earlier row exactly.
  for (let i = 0; i < 5; i++) rows.push([...rows[i]])
  // 5 new customers sharing Harbourview Dental's phone (CUST-005).
  for (let i = 0; i < 5; i++) row({ name: `Harbour View Dental ${i}`, phone: '02 9555 0101', address: `${i} Pier Rd, Seattle, WA 98101` })
  // 12 bad rows, each with its own reason.
  for (let i = 0; i < 5; i++) row({ phone: `(999) 000-000${i}`, address: `${i} Nameless Ln, Reno, NV 89501` })
  for (let i = 0; i < 3; i++) row({ name: `Odd Kind ${i}`, kind: 'commercial' })
  for (let i = 0; i < 2; i++) row({ name: `Bad Zip ${i}`, address: '1 Elm St', zip: 'ABCDE' })
  row({ name: 'Bad PO', po: 'sometimes' })
  rows.push(['62701', '', 'Too Many', '9 Pine St', '', '', '', '', 'extra'])
  assert.equal(rows.length, 500)
  return csv([header, ...rows])
}
const mapping = { siteZip: 'ZIP', phone: 'Mobile', name: 'Company', siteAddress: 'Street address', kind: 'Type', email: 'E-mail', requirePo: 'PO needed', siteAccessNotes: 'Gate notes' }

test('CUST-003: a 500-row customer CSV previews, commits, undoes, and the export re-imports unchanged', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const send = async (type, payload) => (await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type, payload } })).json()
  const until = async (type, payload) => { let r; do r = await send(type, payload); while (!r.ok && r.error.code === 'IMPORT_INCOMPLETE'); assert.equal(r.ok, true, JSON.stringify(r)); return r.result }
  const exported = async () => { const res = await h.request('/api/glove/customers.csv'); assert.equal(res.status, 200); assert.match(res.headers.get('content-type'), /text\/csv/); return res.text() }
  const before = await h.state(), exportBefore = await exported()
  const file = { name: 'jobber-clients.csv', text: ownersFile() }

  // Columns in the owner's own order and names need a mapping the first time.
  await h.command('import.stage', { format: 'csv', files: [file] }, { error: 'IMPORT_MAPPING' })
  const staged = await h.command('import.stage', { format: 'csv', files: [file], mapping })
  const p = staged.preview
  assert.deepEqual(p.rows, { total: 500, new: 483, matched: 0, rejected: 17 })
  assert.equal(p.new.length, 463)
  assert.deepEqual(p.effects, { customers: 463, sites: 483 })
  assert.equal(p.new.find(x => x.name === 'Two Sites 0').sites, 2)
  const reasons = p.rejected.map(r => r.reason)
  assert.equal(reasons.filter(r => /^Repeats row \d+ exactly/.test(r)).length, 5)
  assert.equal(reasons.filter(r => r.startsWith('Company:')).length, 5, 'rows without a name are refused by their column')
  assert.equal(reasons.filter(r => r.startsWith('Type:')).length, 3)
  assert.equal(reasons.filter(r => r.startsWith('ZIP:')).length, 2)
  assert.equal(reasons.filter(r => r.startsWith('PO needed:')).length, 1)
  assert.equal(reasons.filter(r => /has 9 cells/.test(r)).length, 1)
  assert.ok(p.rejected.every(r => Number.isInteger(r.row) && r.row >= 2), 'each rejection names its spreadsheet row')
  assert.deepEqual(p.possibleDuplicates.map(d => [d.name, d.duplicates.map(x => [x.name, x.matches])]).sort(), Array.from({ length: 5 }, (_, i) => [`Harbour View Dental ${i}`, [['Harbourview Dental', ['phone']], ...[0, 1, 2, 3, 4].filter(j => j !== i).map(j => [`Harbour View Dental ${j}`, ['phone']])]]))
  assert.equal((await h.state()).customers.length, before.customers.length, 'the preview writes no customer')

  const committed = await until('import.commit', { batchId: staged.id, version: staged.version, fingerprint: p.fingerprint })
  assert.equal(committed.status, 'committed')
  let s = await h.state()
  assert.equal(s.customers.length, before.customers.length + 463)
  const two = s.customers.find(c => c.name === 'Two Sites 3')
  assert.deepEqual(s.sites.filter(x => x.customerId === two.id).map(x => x.address).sort(), ['1 Oak Ave, Unit 3, Austin, TX 73301', '2 Oak Ave, Unit 3, Austin, TX 73301'])
  const c5 = s.customers.find(c => c.name === 'Customer 5')
  assert.deepEqual([c5.kind, c5.requirePo, c5.phone, c5.source.system], ['business', true, '+1 (312) 705-1005', 'CSV'])
  assert.ok(s.customers.some(c => c.name === '=HYPERLINK("http://x.example")'))
  assert.equal(s.sites.find(x => x.address.startsWith('103 Main St')).accessNotes, 'Dog in yard, "Rex"')
  assert.deepEqual(s.business[0].csvMapping, mapping, 'the mapping is remembered')

  // The same file again maps itself from the remembered columns, and every customer is matched.
  const again = await h.command('import.stage', { format: 'csv', files: [file] })
  assert.deepEqual(again.preview.rows, { total: 500, new: 0, matched: 483, rejected: 17 })
  assert.deepEqual(again.preview.effects, {})

  // Glove's own export guards formula cells and re-imports as all matched, changing nothing.
  const out = await exported()
  assert.match(out, /,"'=HYPERLINK\(""http:\/\/x\.example""\)",/)
  const back = await h.command('import.stage', { format: 'csv', files: [{ name: 'glove-customers.csv', text: out }] })
  const exportedRows = out.trimEnd().split('\r\n').length - 1
  assert.deepEqual(back.preview.rows, { total: exportedRows, new: 0, matched: exportedRows, rejected: 0 })
  assert.ok(back.preview.matched.every(m => !m.differs.length && !m.newSites), JSON.stringify(back.preview.matched.filter(m => m.differs.length || m.newSites).slice(0, 3)))
  await until('import.commit', { batchId: back.id, version: back.version, fingerprint: back.preview.fingerprint })
  const after = await h.state()
  for (const kind of ['customers', 'sites']) assert.deepEqual(after[kind], s[kind], `${kind} unchanged by re-importing the export`)
  assert.equal(await exported(), out)

  // Undo removes exactly what the CSV wrote.
  const batch = after.imports.find(i => i.id === staged.id)
  await until('import.undo', { batchId: batch.id, version: batch.version, reason: 'Wrong client list' })
  s = await h.state()
  assert.deepEqual(s.customers.map(c => c.id), before.customers.map(c => c.id))
  assert.deepEqual(s.sites.map(x => x.id), before.sites.map(x => x.id))
  assert.equal(await exported(), exportBefore)
  assert.equal((await h.request('/api/glove/customers.csv', { as: b.priyaPerson.cookie })).status, 403)
})
