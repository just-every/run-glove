import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'

// CUST-003: a 500-row customer CSV in the owner's own column order, with bad
// rows and duplicates, previewed (new, matched, rejected with reasons), committed
// through the import kit journal, undone, and Glove's CSV export re-importing
// unchanged. CUST-005: incoming customers sharing a phone are flagged.

const cell = v => /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
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
  await detailedCsv(h, b, until, exported)
})


// Independently authored worksheet and retained values, through the same public
// doors as the large import above. No product CSV parser supplies expectations.
const fields = ['customerId', 'name', 'kind', 'abn', 'email', 'phone', 'contact', 'billingAddress', 'billingContact', 'apEmail', 'requirePo', 'contactName', 'contactRole', 'contactPhone', 'contactEmail', 'siteAddress', 'siteZip', 'siteAccessNotes', 'siteContact', 'siteContactPhone', 'siteContactEmail']
const headers = ['Customer ID', 'Name', 'Kind', 'Business number', 'Email', 'Phone', 'Contact', 'Billing address', 'Billing contact', 'Accounts payable email', 'Requires PO', 'Other contact', 'Other contact role', 'Other contact phone', 'Other contact email', 'Site address', 'Site ZIP', 'Site access notes', 'Site contact', 'Site contact phone', 'Site contact email']
const worksheet = rows => csv([headers, ...rows.map(v => fields.map(f => v[f] ?? ''))])
const mail = n => `synthetic-glove-${n}${String.fromCharCode(64)}example.test`
const domain = s => ({ customers: s.customers, sites: s.sites })
const pick = (v, keys) => Object.fromEntries(keys.map(k => [k, v[k]]))
const customerValues = ['name', 'kind', 'abn', 'email', 'phone', 'contact', 'billingAddress', 'billingContact', 'apEmail', 'requirePo']
const siteValues = ['address', 'zip', 'accessNotes', 'contact', 'contactPhone', 'contactEmail']

async function detailedCsv(h, b, until, exported) {
  const stage = async (text, mapping) => h.command('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-38.csv', text }], ...(mapping ? { mapping } : {}) })
  const commit = staged => until('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const nativeValues = { name: 'Synthetic native', kind: 'business', abn: '12-3456789', email: mail(1), phone: '202 555 0101', contact: 'Native primary', billingAddress: 'PO Box 38', billingContact: 'Native billing', apEmail: mail(2), requirePo: true }
  const native = await h.command('customer.save', { ...nativeValues, contacts: [{ name: 'Native other', role: 'Manager', phone: '202 555 0102', email: mail(3) }] })
  await h.command('site.save', { customerId: native.id, address: '60 Existing Road', zip: '10001', accessNotes: 'Keep gate note', contact: 'Native site', contactPhone: '202 555 0103', contactEmail: mail(4) })
  const survivor = await h.command('customer.save', { name: 'Synthetic survivor' })
  const away = await h.command('customer.save', { name: 'Synthetic merged' })
  await h.command('customer.merge', { survivorId: survivor.id, mergedIds: [away.id], versions: { [survivor.id]: survivor.version, [away.id]: away.version } })
  const before = domain(await h.state())
  const shared = { customerId: 'synthetic-glove-shared', name: 'Synthetic shared', kind: 'business', abn: '98-7654321', email: mail(5), phone: '202 555 0105', contact: 'Shared primary', billingAddress: 'PO Box 39', billingContact: 'Shared billing', apEmail: mail(6), requirePo: 'yes' }
  const noId = { name: 'Synthetic without ID', phone: '202 555 0106', email: mail(7) }
  const matched = { ...nativeValues, customerId: native.id, name: 'Do not replace native', requirePo: 'yes', contactName: 'Native other', contactRole: 'Changed role only', contactPhone: '202 555 0102', contactEmail: mail(3) }
  const rows = [
    { ...shared, siteAddress: '10 Shared Road', siteZip: '10001', siteAccessNotes: 'Gate A, "north"', siteContact: 'Shared site A', siteContactPhone: '202 555 0110', siteContactEmail: mail(10), contactName: 'Shared other A', contactRole: 'Manager', contactPhone: '202 555 0111', contactEmail: mail(11) },
    { ...shared, siteAddress: '20 Shared Road', siteZip: '10002', siteAccessNotes: 'Gate B', siteContact: 'Shared site B', siteContactPhone: '202 555 0112', siteContactEmail: mail(12), contactName: 'Shared other B', contactRole: 'Billing', contactPhone: '202 555 0113', contactEmail: mail(13) },
    { ...noId, siteAddress: '30 No ID Road', siteZip: '10003', contactName: 'No ID other A', contactRole: 'Caretaker', contactPhone: '202 555 0114', contactEmail: mail(14) },
    { ...noId, siteAddress: '40 No ID Road', siteZip: '10004', contactName: 'No ID other B', contactRole: 'Tenant', contactPhone: '202 555 0115', contactEmail: mail(15) },
    { ...matched, siteAddress: '60 Existing Road', siteZip: '10001', siteAccessNotes: 'Do not replace gate', siteContact: 'Native site', siteContactPhone: '202 555 0103', siteContactEmail: mail(4) },
    { ...matched, siteAddress: '70 Added Road', siteZip: '10007', siteAccessNotes: 'New gate', siteContact: 'New site', siteContactPhone: '202 555 0116', siteContactEmail: mail(16) },
    { customerId: away.id, name: 'Synthetic merged', siteAddress: '80 Rejected Road', contactName: 'Rejected merged contact' },
    { siteAddress: '81 Rejected Road' },
    { name: 'x'.repeat(201), siteAddress: '82 Rejected Road' },
    { name: 'Rejected kind', kind: 'commercial', siteAddress: '83 Rejected Road' },
    { name: 'Rejected phone', phone: 'x'.repeat(51), siteAddress: '84 Rejected Road' },
    { name: 'Rejected contact', contactRole: 'No name', siteAddress: '85 Rejected Road' },
    { name: 'Rejected ZIP', siteAddress: '86 Rejected Road', siteZip: 'ABCDE' },
    { name: 'Rejected address', siteAccessNotes: 'Address missing' },
    { name: 'Rejected PO', requirePo: 'sometimes', siteAddress: '87 Rejected Road' },
  ]
  // Spreadsheet rows 17 through 21 exercise shape, repeats and group conflicts.
  const textRows = rows.map(v => fields.map(f => v[f] ?? ''))
  textRows.push([...fields.map(f => ({ name: 'Rejected cells', siteAddress: '88 Rejected Road' })[f] ?? ''), 'extra'])
  textRows.push([...textRows[0]])
  textRows.push(fields.map(f => ({ ...shared, name: 'Conflicting shared name', siteAddress: '89 Rejected Road', contactName: 'Rejected conflicting contact' })[f] ?? ''))
  textRows.push(fields.map(f => ({ ...shared, siteAddress: '10 Shared Road', siteZip: '10001', siteAccessNotes: 'Conflicting gate', contactName: 'Rejected site contact' })[f] ?? ''))
  textRows.push(fields.map(f => ({ customerId: 'synthetic-glove-missing-first', siteAddress: '90 Rejected Road' })[f] ?? ''))
  const staged = await stage(csv([headers, ...textRows]))
  assert.deepEqual(domain(await h.state()), before, 'staging has no customer, site or contact effects')
  assert.deepEqual(staged.preview.rows, { total: 20, new: 4, matched: 2, rejected: 14 })
  assert.deepEqual(staged.preview.effects, { customers: 2, sites: 5 })
  assert.deepEqual(staged.preview.new.map(x => [x.rows, x.name, x.sites, x.contacts]), [[[2, 3], 'Synthetic shared', 2, 2], [[4, 5], 'Synthetic without ID', 2, 2]])
  assert.deepEqual(staged.preview.matched, [{ rows: [6, 7], customerId: native.id, name: 'Synthetic native', newSites: 1, differs: ['name', 'contacts', 'site 60 Existing Road'] }])
  assert.deepEqual(staged.preview.rejected, [
    { row: 8, reason: "Synthetic merged was merged into another customer; use that customer's ID." },
    { row: 9, reason: 'Name: name is required (at most 200 characters).' },
    { row: 10, reason: 'Name: name is required (at most 200 characters).' },
    { row: 11, reason: 'Kind: kind must be one of: residential, business.' },
    { row: 12, reason: 'Phone: phone is required (at most 50 characters).' },
    { row: 13, reason: 'Other contact: contacts[0].name is required (at most 200 characters).' },
    { row: 14, reason: 'Site ZIP: zip is a 5-digit ZIP code.' },
    { row: 15, reason: 'Site address: address is required (at most 500 characters).' },
    { row: 16, reason: 'Requires PO: Requires PO is yes or no.' },
    { row: 17, reason: 'Row has 22 cells; the header has 21.' },
    { row: 18, reason: 'Repeats row 2 exactly.' },
    { row: 19, reason: 'Customer details differ from row 2, which has the same Customer ID.' },
    { row: 20, reason: 'Site 10 Shared Road differs from row 2.' },
    { row: 21, reason: 'Name: the first row for Customer ID synthetic-glove-missing-first names the customer.' },
  ])

  const payload = { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint }
  for (const person of [b.dispatcher, b.office, b.agent, b.priyaPerson]) {
    await person.run('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-38.csv', text: worksheet([noId]) }] }, { error: 'FORBIDDEN' })
    await person.run('import.commit', payload, { error: 'FORBIDDEN' })
    await person.run('import.undo', { batchId: staged.id, version: staged.version, reason: 'Unauthorized' }, { error: 'FORBIDDEN' })
  }
  const temporary = await h.person('Synthetic Csv Owner', 'owner')
  const revoked = await temporary.run('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-39.csv', text: worksheet([{ name: 'Must not appear' }]) }] })
  await h.command('role.set', { operatorId: temporary.id, role: 'viewer' })
  await temporary.run('import.commit', { batchId: revoked.id, version: revoked.version, fingerprint: revoked.preview.fingerprint }, { error: 'FORBIDDEN' })
  assert.deepEqual(domain(await h.state()), before, 'role refusals preserve all business records')
  await commit(staged)
  let s = await h.state()
  assert.equal(s.customers.length, before.customers.length + 2)
  assert.equal(s.sites.length, before.sites.length + 5)
  const first = s.customers.find(c => c.name === 'Synthetic shared'), second = s.customers.find(c => c.name === 'Synthetic without ID')
  assert.deepEqual(pick(first, customerValues), { name: 'Synthetic shared', kind: 'business', abn: '98-7654321', email: mail(5), phone: '202 555 0105', contact: 'Shared primary', billingAddress: 'PO Box 39', billingContact: 'Shared billing', apEmail: mail(6), requirePo: true })
  assert.deepEqual(first.contacts, [{ name: 'Shared other A', role: 'Manager', phone: '202 555 0111', email: mail(11) }, { name: 'Shared other B', role: 'Billing', phone: '202 555 0113', email: mail(13) }])
  assert.deepEqual(pick(second, customerValues), { name: 'Synthetic without ID', kind: 'residential', abn: '', email: mail(7), phone: '202 555 0106', contact: '', billingAddress: '', billingContact: '', apEmail: '', requirePo: false })
  assert.deepEqual(second.contacts, [{ name: 'No ID other A', role: 'Caretaker', phone: '202 555 0114', email: mail(14) }, { name: 'No ID other B', role: 'Tenant', phone: '202 555 0115', email: mail(15) }])
  assert.deepEqual(s.sites.filter(x => x.customerId === first.id).sort((a, b) => a.address.localeCompare(b.address)).map(x => pick(x, siteValues)), [
    { address: '10 Shared Road', zip: '10001', accessNotes: 'Gate A, "north"', contact: 'Shared site A', contactPhone: '202 555 0110', contactEmail: mail(10) },
    { address: '20 Shared Road', zip: '10002', accessNotes: 'Gate B', contact: 'Shared site B', contactPhone: '202 555 0112', contactEmail: mail(12) },
  ])
  assert.deepEqual(s.sites.filter(x => x.customerId === second.id).sort((a, b) => a.address.localeCompare(b.address)).map(x => pick(x, siteValues)), [
    { address: '30 No ID Road', zip: '10003', accessNotes: '', contact: '', contactPhone: '', contactEmail: '' },
    { address: '40 No ID Road', zip: '10004', accessNotes: '', contact: '', contactPhone: '', contactEmail: '' },
  ])
  for (const c of before.customers) assert.deepEqual(s.customers.find(x => x.id === c.id), c, 'matches and rejected rows never edit existing customer details or contacts')
  for (const site of before.sites) assert.deepEqual(s.sites.find(x => x.id === site.id), site, 'existing site details are retained')
  assert.deepEqual(pick(s.sites.find(x => x.address === '70 Added Road'), siteValues), { address: '70 Added Road', zip: '10007', accessNotes: 'New gate', contact: 'New site', contactPhone: '202 555 0116', contactEmail: mail(16) })
  const retained = domain(s)
  await h.restart()
  assert.deepEqual(domain(await h.state()), retained, 'exact records survive a real Worker restart')

  // Earlier imports match both with a source Customer ID and with no ID.
  const earlier = await stage(worksheet([rows[0], rows[1], rows[2], rows[3]]))
  assert.deepEqual(earlier.preview.new, [])
  assert.deepEqual(earlier.preview.matched, [
    { rows: [2, 3], customerId: first.id, name: 'Synthetic shared', newSites: 0, differs: [] },
    { rows: [4, 5], customerId: second.id, name: 'Synthetic without ID', newSites: 0, differs: [] },
  ])
  assert.deepEqual(earlier.preview.effects, {})
  await commit(earlier)
  assert.deepEqual(domain(await h.state()), retained)

  // Every remembered header must exist, even an optional contact column. The
  // competing standard headers reveal choosing either mapping incorrectly.
  const mapped = { name: 'Client', siteAddress: 'Property', contactName: 'Person' }
  const customHeaders = ['Property', 'Person', 'Client', 'Name', 'Site address']
  const mappedBatch = await stage(csv([customHeaders, ['91 Mapped Road', 'Mapped other', 'Synthetic mapped', 'Wrong automatic name', 'Wrong automatic address']]), mapped)
  assert.deepEqual((await h.state()).business[0].csvMapping, Object.fromEntries(fields.map((f, i) => [f, headers[i]])), 'staging never remembers an uncommitted mapping')
  await commit(mappedBatch)
  const remembered = await stage(csv([customHeaders, ['92 Remembered Road', 'Remembered other', 'Synthetic remembered', 'Wrong fallback name', 'Wrong fallback address']]))
  assert.deepEqual(remembered.preview.mapping, mapped)
  assert.deepEqual(remembered.preview.new.map(x => x.name), ['Synthetic remembered'])
  const fallback = await stage(csv([['Client', 'Property', 'Name', 'Site address'], ['Wrong remembered name', 'Wrong remembered address', 'Synthetic fallback', '93 Fallback Road']]))
  assert.deepEqual(fallback.preview.mapping, { name: 'Name', siteAddress: 'Site address' })
  assert.deepEqual(fallback.preview.new.map(x => x.name), ['Synthetic fallback'])
  assert.deepEqual((await h.state()).business[0].csvMapping, mapped)
  await commit(fallback)
  s = await h.state()
  assert.deepEqual(s.customers.filter(c => ['Synthetic mapped', 'Synthetic fallback'].includes(c.name)).sort((a, b) => b.name.localeCompare(a.name)).map(c => [c.name, s.sites.filter(x => x.customerId === c.id).map(x => x.address)]), [['Synthetic mapped', ['91 Mapped Road']], ['Synthetic fallback', ['93 Fallback Road']]])
  assert.ok(!s.customers.some(c => /Wrong|Synthetic remembered|Must not appear|Rejected/.test(c.name)))

  // Read raw export cells independently, including commas, quotes and newlines.
  const read = text => Array.from(text.matchAll(/(?:^|,|\r\n)("(?:[^"]|"")*"|[^,\r\n]*)/g), m => m[1])
  const formula = await h.command('customer.save', { name: '=Synthetic formula', phone: '+2025550199', contact: '-Primary', billingContact: '@Billing', billingAddress: "'=Already guarded", contacts: [{ name: "''=Twice guarded", role: "'ordinary", phone: '-2025550188', email: mail(18) }, { name: 'Other without a site', role: 'Backup' }, { name: 'Third without a site', role: 'Caretaker' }] })
  await h.command('site.save', { customerId: formula.id, address: '94 Formula Road', accessNotes: 'First line\nSecond, "quoted"', contact: '@Site' })
  const noSite = await h.command('customer.save', { name: 'Synthetic no site or other contact' })
  const kept = domain(await h.state()), out = await exported(), cells = read(out)
  for (const cell of ["'=Synthetic formula", "'+2025550199", "'-Primary", "'@Billing", "''=Already guarded", "'".repeat(3) + "=Twice guarded", "'ordinary", "'-2025550188", "'@Site", '"First line\nSecond, ""quoted"""']) assert.ok(cells.includes(cell), `export guards exactly once: ${cell}`)
  assert.equal(cells.filter(x => x === formula.id).length, 3, 'one row per site or other contact, including contacts beyond the sites')
  assert.equal(cells.filter(x => x === noSite.id).length, 1, 'a customer without sites or other contacts still exports')
  assert.ok(!cells.includes(away.id), 'merged-away customers never export')
  assert.deepEqual([...new Set(cells.filter(x => kept.customers.some(c => c.id === x)))].sort(), kept.customers.filter(c => !c.mergedInto).map(c => c.id).sort(), 'every live identity exports')
  // The last committed mapping deliberately selects only Name and Site address.
  // Explicitly select the full export mapping for this detailed round trip;
  // the 500-row journey above proves automatic export-header fallback.
  const back = await stage(out, Object.fromEntries(fields.map((f, i) => [f, headers[i]])))
  assert.equal(back.preview.rows.new, 0, JSON.stringify(back.preview))
  assert.equal(back.preview.rows.rejected, 0, JSON.stringify(back.preview))
  assert.deepEqual(back.preview.effects, {})
  assert.ok(back.preview.matched.every(x => x.differs.length === 0 && x.newSites === 0), JSON.stringify(back.preview.matched))
  assert.ok(back.preview.matched.some(x => x.customerId === formula.id && x.rows.length === 3))
  await commit(back)
  await h.restart()
  assert.deepEqual(domain(await h.state()), kept, 'exported CSV re-import changes no customer, site or embedded contact')
  assert.equal(await exported(), out)
  const { activity, exported: archive } = await assertTrail(h, ['import.previewed', 'import.committed', 'import.undone'])
  for (const kind of ['import.previewed', 'import.committed']) {
    const e = activity.find(e => e.subjectId === staged.id && e.kind === kind)
    assert.equal(e.actorRole, 'owner')
    assert.equal(e.actorName, 'Olivia Owner')
    assert.ok(archive.timeline.some(x => x.id === e.id && x.subject_id === staged.id))
  }
  console.log('PROBE CUST-003 points 2-6: authenticated CSV stage, commit, undo, export and restart -> exact grouped values, differing fields, row refusals, mapping fallback and unchanged round trip passed')
}
