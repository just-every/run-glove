import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation } from './harness.mjs'

const approvedBasis = 'tax on approved invoices; Glove records no payments yet'
const settings = (rate = '8.25', taxLabor = false, id = 'city') => ({ jurisdictions: [{ id, name: 'City, county', rate, taxLabor, zips: ['78704'] }] })
const line = (price = '100.00') => ({ description: 'Valve, installed', quantity: '1', unitPrice: price, tax: 'TAXABLE' })
const latest = (h, kind, id) => h.state().then(s => s[kind].find(x => x.id === id))
const revision = invoice => invoice.revisions.at(-1)
function csv(text) {
  const rows = [], pattern = /(?:^|,|\r?\n)(?:"((?:[^"]|"")*)"|([^",\r\n]*))/g
  let row = [], match
  while ((match = pattern.exec(text.trimEnd()))) {
    if (/^[\r\n]/.test(match[0])) { rows.push(row); row = [] }
    row.push(match[1] === undefined ? match[2] : match[1].replaceAll('""', '"'))
    if (!match[0].length) pattern.lastIndex++
  }
  if (row.length) rows.push(row)
  return rows
}
async function crew(h, branchId = null, name = 'Tax Technician') {
  const person = await h.person(name, 'technician')
  const technician = await h.command('technician.save', { name, operatorId: person.id, branchId })
  return { person, technician }
}
async function place(h, branchId = null, name = 'Tax customer', zip = '78704') {
  const customer = await h.command('customer.save', { name })
  const site = await h.command('site.save', { customerId: customer.id, address: '10 Service St, Austin TX ' + zip, zip, branchId })
  return { customer, site }
}
async function complete(h, job, team) {
  const hour = 9 + (await h.state()).visits.filter(v => v.technicianId === team.technician.id).length
  const visit = await h.command('visit.book', { jobId: job.id, technicianId: team.technician.id, date: '2026-10-30', start: String(hour).padStart(2, '0') + ':00', end: String(hour + 1).padStart(2, '0') + ':00' })
  await team.person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  await team.person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Valve installed', signoff: { absentReason: 'Customer away' } })
  return h.command('invoice.prepare', { jobId: job.id })
}
async function invoice(h, p, team, price = '100.00') {
  const job = await h.command('job.create', { customerId: p.customer.id, siteId: p.site.id, title: 'Tax evidence repair', lines: [line(price)] })
  return complete(h, job, team)
}
async function approve(h, inv) {
  return h.command('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: revision(inv).n })
}
async function trail(h, kinds) {
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const exported = await h.request('/api/glove/export').then(r => r.json())
  for (const kind of kinds) {
    const events = activity.events.filter(e => e.kind === kind)
    assert.ok(events.length, kind)
    for (const e of events) {
      assert.ok(e.actorId && e.actorName && e.actorRole && e.at && e.commandId, kind)
      const row = exported.timeline.find(x => x.id === e.id)
      assert.deepEqual([row.actor_id, row.actor_name, row.actor_role, row.at, row.command_id, row.subject_id], [e.actorId, e.actorName, e.actorRole, e.at, e.commandId, e.subjectId])
    }
  }
  return exported
}

test('MONEY-004 ordinary tax stays on first local approval through manual receipts, credits, correction and restart', async t => {
  const h = await installation({ at: '2026-10-30T12:00:00.000Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Tax evidence trades', timezone: 'UTC', taxSettings: settings('10', true) })
  const eastTax = settings('10', true)
  eastTax.jurisdictions.push({ id: 'district', name: 'School district', rate: '7.5', taxLabor: true, zips: ['78705'] })
  const east = await h.command('branch.save', { name: 'East', prefix: 'EAST', timezone: 'America/New_York', zips: ['78704', '78705'], taxSettings: eastTax })
  const west = await h.command('branch.save', { name: 'West', prefix: 'WEST', timezone: 'America/Los_Angeles', zips: ['78704'], taxSettings: settings('5', true) })
  const office = await h.person('Tax Office', 'office')
  const e = await place(h, east.id, 'East taxable'), w = await place(h, west.id, 'West taxable')
  const et = await crew(h, east.id, 'East Tax Technician'), wt = await crew(h, west.id, 'West Tax Technician')
  let a = await invoice(h, e, et), b = await invoice(h, w, wt, '200.00')
  const c = await invoice(h, e, et, '50.00')
  const district = await place(h, east.id, 'District taxable', '78705')
  let d = await invoice(h, district, et, '40.00')
  await h.setTime('2026-10-31T05:30:00.000Z')
  await approve(h, c)
  await h.setTime('2026-11-01T06:30:00.000Z')
  a = await approve(h, a); b = await approve(h, b); d = await approve(h, d)
  assert.deepEqual([a.dates.issuedOn, b.dates.issuedOn], ['2026-11-01', '2026-10-31'])
  const report = async (from, to, branch = '') => {
    const query = 'from=' + from + '&to=' + to + (branch ? '&branchId=' + branch : '')
    const response = await h.request('/api/glove/reports/tax.json?' + query, { as: office.cookie })
    assert.equal(response.status, 200)
    const json = await response.json()
    assert.equal(json.basis, approvedBasis)
    const table = csv(await h.request('/api/glove/reports/tax.csv?' + query, { as: office.cookie }).then(r => r.text()))
    assert.deepEqual(table, [['branch', 'jurisdiction', 'month', 'invoices', 'tax'], ...json.jurisdictions.flatMap(j => [...j.byMonth.map(m => [j.branch, j.jurisdiction, m.month, String(m.invoices), m.tax]), [j.branch, j.jurisdiction, 'total', String(j.invoices), j.tax]])])
    json.jurisdictions.sort((a, b) => a.branch.localeCompare(b.branch) || a.jurisdictionId.localeCompare(b.jurisdictionId))
    return json
  }
  const before = await report('2026-10-31', '2026-11-01')
  assert.deepEqual(before.jurisdictions.map(j => [j.branch, j.taxable, j.tax, j.byMonth]), [
    ['East', '150.00', '15.00', [{ month: '2026-10', invoices: 1, tax: '5.00' }, { month: '2026-11', invoices: 1, tax: '10.00' }]],
    ['East', '40.00', '3.00', [{ month: '2026-11', invoices: 1, tax: '3.00' }]],
    ['West', '200.00', '10.00', [{ month: '2026-10', invoices: 1, tax: '10.00' }]],
  ])
  assert.deepEqual((await report('2026-10-31', '2026-10-31')).jurisdictions.map(j => [j.branch, j.jurisdictionId, j.tax]), [['East', 'city', '5.00'], ['West', 'city', '10.00']])
  assert.deepEqual((await report('2026-11-01', '2026-11-01')).jurisdictions.map(j => [j.branch, j.jurisdictionId, j.tax]), [['East', 'city', '10.00'], ['East', 'district', '3.00']])
  assert.deepEqual((await report('2026-10-30', '2026-10-30')).jurisdictions, [])
  await h.setTime('2026-11-03T12:00:00.000Z')
  await office.run('payment.record', { invoiceId: a.id, version: a.version, method: 'check', reference: 'synthetic-glove-163', amount: '55.00' })
  assert.deepEqual(await report('2026-10-31', '2026-11-01'), before, 'an ordinary receipt changes neither tax basis nor first-approval dating')
  await h.command('payment.credit', { invoiceId: b.id, version: b.version, amount: '10.00', reference: 'Reasoned goodwill credit' })
  assert.deepEqual(await report('2026-10-31', '2026-11-01'), before, 'a credit does not remove approved invoice tax')
  assert.deepEqual((await report('2026-11-03', '2026-11-03')).jurisdictions, [])
  await h.command('invoice.export', {})
  a = await latest(h, 'invoices', a.id)
  const beforeCorrection = await h.state()
  await et.person.run('invoice.correct', { invoiceId: a.id, version: a.version, reason: 'Field correction refused', lines: [line('150.00')] }, { error: 'FORBIDDEN' })
  assert.deepEqual((await h.state()).invoices, beforeCorrection.invoices)
  a = await h.command('invoice.correct', { invoiceId: a.id, version: a.version, reason: 'One more valve', lines: [line('150.00')] })
  assert.deepEqual(await report('2026-10-31', '2026-11-01'), before, 'unapproved correction leaves the previous approved figures')
  const refusedState = await h.state()
  await et.person.run('invoice.approve', { invoiceId: a.id, version: a.version, revision: 2 }, { error: 'FORBIDDEN' })
  assert.deepEqual((await h.state()).invoices, refusedState.invoices)
  a = await approve(h, a)
  assert.equal(a.dates.issuedOn, '2026-11-01')
  const corrected = await report('2026-10-31', '2026-11-01')
  assert.deepEqual(corrected.jurisdictions.map(j => [j.branch, j.jurisdictionId, j.invoices, j.taxable, j.tax]), [['East', 'city', 2, '200.00', '20.00'], ['East', 'district', 1, '40.00', '3.00'], ['West', 'city', 1, '200.00', '10.00']])
  assert.deepEqual((await report('2026-10-31', '2026-11-01', east.id)).jurisdictions, corrected.jurisdictions.slice(0, 2))
  await h.restart()
  assert.deepEqual(await report('2026-10-31', '2026-11-01'), corrected)
  await trail(h, ['invoice.approved', 'invoice.corrected', 'payment.recorded', 'payment.credited'])
})

test('MONEY-004 private chunked certificates retain replaced originals, local expiry and erasure fences', async t => {
  const h = await installation({ at: '2026-10-30T12:00:00.000Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Certificate trades', timezone: 'UTC', taxSettings: settings() })
  const west = await h.command('branch.save', { name: 'Certificate West', prefix: 'CW', timezone: 'America/Los_Angeles', zips: ['78704'], taxSettings: settings() })
  const east = await h.command('branch.save', { name: 'Certificate East', prefix: 'CE', timezone: 'America/New_York', zips: [] })
  const p = await place(h, west.id, 'Certificate school'), peer = await place(h, east.id, 'Other school')
  let customer = await latest(h, 'customers', p.customer.id)
  customer = await h.command('customer.save', { ...customer, taxExemption: { certificateNumber: 'synthetic-glove-163', expires: '2026-11-01' } })
  const bytes = Buffer.alloc(512 * 1024 + 37, 65); bytes.write('%PDF-1.7\nOriginal certificate\n'); bytes.write('\n%%EOF', bytes.length - 6)
  const uploadId = randomUUID(), payload = { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: bytes.toString('base64') } }
  customer = await h.command('customer.certificate', payload, { commandId: uploadId })
  const original = customer.taxExemption.certificate
  assert.deepEqual([original.size, original.sha256], [bytes.length, createHash('sha256').update(bytes).digest('hex')])
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks WHERE file_id=?').bind(original.fileId).first()).n, 2)
  const same = await h.person('West Certificate Office', 'office'), other = await h.person('East Certificate Office', 'office')
  await h.command('branch.limit', { operatorId: same.id, branchId: west.id })
  await h.command('branch.limit', { operatorId: other.id, branchId: east.id })
  const team = await crew(h, west.id, 'Certificate Technician'), sub = await h.person('Certificate Subcontractor', 'subcontractor')
  const subcontractor = await h.command('technician.save', { name: 'Certificate Subcontractor', operatorId: sub.id, branchId: west.id, subcontractor: { payeeName: 'Certificate Subcontractor', tinLast4: '0163' } })
  const assignedJob = await h.command('job.create', { customerId: customer.id, siteId: p.site.id, title: 'Certificate customer field visit', lines: [line()] })
  for (const [technicianId, start, end] of [[team.technician.id, '09:00', '10:00'], [subcontractor.id, '11:00', '12:00']]) {
    await h.command('visit.book', { jobId: assignedJob.id, technicianId, date: '2026-10-30', start, end })
  }
  for (const person of [team.person, sub]) assert.ok((await person.state()).customers.some(c => c.id === customer.id), 'assigned field readers can see this customer before the private-file refusal')
  const token = await h.command('token.issue', { name: 'Certificate integration', role: 'office', branchId: west.id })
  const path = '/api/glove/files/' + original.fileId
  for (const as of [h.owner(), same.cookie]) {
    const response = await h.request(path, { as })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-disposition'), /^attachment;/)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
  }
  for (const [name, options, status] of [
    ['Technician', { as: team.person.cookie }, 404], ['Subcontractor', { as: sub.cookie }, 404],
    ['Other branch', { as: other.cookie }, 404], ['Integration', { as: '', headers: { authorization: 'Bearer ' + token.token } }, 404],
    ['Signed out', { as: '' }, 401],
  ]) assert.equal((await h.request(path, options)).status, status, name)
  await same.run('customer.certificate', { ...payload, version: customer.version, file: { ...payload.file, mediaType: 'image/png' } }, { error: 'INPUT' })
  assert.deepEqual(await latest(h, 'customers', customer.id), customer, 'invalid replacement changes no customer evidence')
  const replacementBytes = Buffer.from('%PDF-1.7\nReplacement evidence\n%%EOF')
  customer = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: replacementBytes.toString('base64') } })
  const replacement = customer.taxExemption.certificate
  assert.notEqual(replacement.fileId, original.fileId)
  assert.deepEqual(Buffer.from(await h.request(path, { as: same.cookie }).then(r => r.arrayBuffer())), bytes)
  assert.deepEqual(Buffer.from(await h.request('/api/glove/files/' + replacement.fileId).then(r => r.arrayBuffer())), replacementBytes)
  await h.setTime('2026-11-02T07:59:59.999Z')
  const quotePayload = { customerId: customer.id, siteId: p.site.id, title: 'Expiry boundary', lines: [line()] }
  const lastInstant = await h.command('quote.draft', quotePayload)
  assert.deepEqual([lastInstant.revisions[0].totals.taxContext.exempt, lastInstant.revisions[0].totals.gst], [true, '0.00'])
  assert.equal(lastInstant.revisions[0].totals.taxContext.exemption.fileId, replacement.fileId)
  await h.setTime('2026-11-02T08:00:00.000Z')
  const nextDate = await h.command('quote.draft', quotePayload)
  assert.deepEqual([nextDate.revisions[0].totals.taxContext.exempt, nextDate.revisions[0].totals.gst], [false, '8.25'])
  assert.deepEqual((await latest(h, 'quotes', lastInstant.id)).revisions, lastInstant.revisions, 'expiry never reprices an earlier revision')
  await h.restart()
  assert.deepEqual(Buffer.from(await h.request(path, { as: same.cookie }).then(r => r.arrayBuffer())), bytes)
  await h.command('role.set', { operatorId: same.id, role: 'technician' })
  assert.equal((await h.request(path, { as: same.cookie })).status, 404, 'withdrawn desk authority applies to the next read')
  await h.command('token.revoke', { tokenId: token.id })
  assert.equal((await h.request(path, { as: '', headers: { authorization: 'Bearer ' + token.token } })).status, 401)
  const exported = await trail(h, ['customer.certificate'])
  assert.ok(exported.files.some(f => f.id === original.fileId && f.captureId === customer.id && f.sha256 === original.sha256))
  assert.ok(exported.files.some(f => f.id === replacement.fileId && f.captureId === customer.id))
  assert.ok((await h.request('/api/glove/activity').then(r => r.json())).events.filter(e => e.kind === 'customer.certificate').every(e => /not verified by a provider/.test(e.summary)))
  customer = await latest(h, 'customers', customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await other.run('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint }, { error: 'FORBIDDEN' })
  assert.equal((await h.request(path)).status, 200)
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  for (const id of [original.fileId, replacement.fileId]) {
    assert.equal((await h.request('/api/glove/files/' + id)).status, 404)
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks WHERE file_id=?').bind(id).first()).n, 0)
  }
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificates WHERE customer_id=?').bind(customer.id).first()).n, 0)
  await h.command('customer.certificate', payload, { commandId: uploadId, error: 'ERASED' })
  await h.restart()
  assert.equal((await h.request(path)).status, 404)
  assert.ok((await h.state()).customers.some(c => c.id === peer.customer.id), 'erasure leaves the other customer intact')
  await trail(h, ['privacy.erase'])
})

test('MONEY-004 approved options and add-ons carry frozen tax through revised and corrected invoices and US exports', async t => {
  const h = await installation({ at: '2026-10-30T12:00:00.000Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Frozen trades', timezone: 'America/Chicago', taxSettings: settings() })
  const team = await crew(h)
  let material = await h.command('service.save', { code: 'PART', name: 'Valve', kind: 'material', unitPrice: '100.00', tax: 'TAXABLE' })
  let labor = await h.command('service.save', { code: 'LABOR', name: 'Install', kind: 'service', unitPrice: '50.00', tax: 'TAXABLE' })
  const priced = () => [material, labor].map(s => ({ serviceId: s.id, description: s.name, quantity: '1', unitPrice: s.unitPrice }))
  const fixtures = []
  for (const exempt of [false, true]) {
    const p = await place(h, null, exempt ? 'Exempt frozen school' : 'Taxable frozen school')
    let customer = await latest(h, 'customers', p.customer.id)
    if (exempt) {
      customer = await h.command('customer.save', { ...customer, taxExemption: { certificateNumber: 'synthetic-glove-164', expires: '2026-11-01' } })
      customer = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: Buffer.from('%PDF-1.7\nSchool evidence\n%%EOF').toString('base64') } })
    }
    const payload = { customerId: customer.id, siteId: p.site.id, title: 'Frozen option repair', options: [{ name: 'Standard', lines: priced() }, { name: 'Two valves', lines: [{ ...priced()[0], quantity: '2' }, priced()[1]] }], addOns: [{ name: 'Spare valve', lines: [priced()[0]] }] }
    let q = await h.command('quote.draft', payload)
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    const frozen = structuredClone(q.revisions[0])
    assert.deepEqual([frozen.totals.currency, frozen.totals.taxContext.jurisdictionId, frozen.totals.taxContext.rate, frozen.totals.taxContext.taxLabor, frozen.totals.taxContext.exempt], ['USD', 'city', '8.25', false, exempt])
    assert.ok(frozen.totals.taxContext.laborServiceIds.includes(labor.id))
    let accepted = await h.command('quote.draft', { ...payload, title: 'Accepted frozen option' })
    accepted = await h.command('quote.approve', { quoteId: accepted.id, version: accepted.version, revision: 1 })
    fixtures.push({ p, customer, payload, q, frozen, exempt, accepted })
  }
  const business = (await h.state()).business[0]
  await h.command('business.save', { ...business, taxSettings: settings('20', true, 'district') })
  labor = await h.command('service.save', { ...labor, kind: 'material' })
  material = await latest(h, 'services', material.id)
  for (const f of fixtures) {
    // Current rules, site choice and certificate evidence all change after approval.
    let customer = await latest(h, 'customers', f.customer.id)
    customer = await h.command('customer.save', { ...customer, taxExemption: { certificateNumber: 'synthetic-glove-165', expires: '2000-01-01' } })
    customer = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: Buffer.from('%PDF-1.7\nLater evidence\n%%EOF').toString('base64') } })
    const site = await latest(h, 'sites', f.p.site.id)
    await h.command('site.save', { ...site, taxJurisdictionId: 'district' })
    const newRevision = await h.command('quote.revise', { ...f.payload, quoteId: f.q.id, version: f.q.version })
    assert.deepEqual(newRevision.revisions[0], f.frozen)
    assert.deepEqual([newRevision.revisions[1].totals.taxContext.jurisdictionId, newRevision.revisions[1].totals.taxContext.rate, newRevision.revisions[1].totals.taxContext.taxLabor, newRevision.revisions[1].totals.taxContext.exempt, newRevision.revisions[1].totals.gst], ['district', '20', true, false, '30.00'])
    assert.ok(!newRevision.revisions[1].totals.taxContext.laborServiceIds.includes(labor.id), 'new revisions use the current item classification')
    let accepted = f.accepted
    const snapshot = structuredClone(accepted.revisions[0].totals.taxContext)
    const acceptPayload = { quoteId: accepted.id, version: accepted.version, revision: 1, method: 'phone', customerName: customer.name, choice: { optionId: 'option-2', addOnIds: ['addon-1'] } }
    await h.command('quote.accept', { ...acceptPayload, choice: { optionId: 'option-2', addOnIds: ['missing'] } }, { error: 'CHOICE' })
    assert.equal((await latest(h, 'quotes', accepted.id)).status, 'approved')
    accepted = await h.command('quote.accept', acceptPayload)
    assert.deepEqual(accepted.acceptance.totals.taxContext, snapshot)
    assert.deepEqual([accepted.acceptance.totals.subtotal, accepted.acceptance.totals.gst, accepted.acceptance.totals.total], ['350.00', f.exempt ? '0.00' : '24.75', f.exempt ? '350.00' : '374.75'])
    const job = await h.command('job.create', { quoteId: accepted.id })
    assert.deepEqual(job.totals, accepted.acceptance.totals)
    let inv = await complete(h, job, team)
    assert.deepEqual(revision(inv).totals, job.totals)
    inv = await h.command('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Explicit office revision', lines: revision(inv).lines })
    assert.deepEqual(revision(inv).totals, job.totals)
    inv = await approve(h, inv)
    const query = '?customerRef=synthetic-glove-customer&itemRef=synthetic-glove-item&taxCodeRef=synthetic-glove-tax'
    const outgoing = h.outbound.attempts
    const response = await h.request('/api/glove/invoices/' + inv.id + '/quickbooks.json' + query)
    assert.equal(response.status, 200)
    const document = await response.json()
    assert.equal(document.CurrencyRef.value, 'USD')
    assert.equal(document.TxnTaxDetail.TotalTax, f.exempt ? 0 : 24.75)
    assert.deepEqual(document.Line.map(l => l.SalesItemLineDetail.TaxCodeRef.value), f.exempt ? ['NON', 'NON', 'NON'] : ['TAX', 'NON', 'TAX'])
    assert.equal(h.outbound.attempts, outgoing, 'inspection issues no outbound request, including Intuit')
    const batch = await h.command('invoice.export', {})
    const exportPath = '/api/glove/exports/' + batch.id + '.csv'
    const exportedCsv = await h.request(exportPath).then(r => r.text())
    const records = csv(exportedCsv)
    const header = records.shift(), rows = records.map(r => Object.fromEntries(header.map((key, i) => [key, r[i]])))
    assert.deepEqual(rows.map(r => [r['*Description'], r['*Quantity'], r['*UnitAmount'], r['*TaxType'], r.Currency]), [
      ['Valve', '2', '100.00', f.exempt ? 'Tax exempt' : 'City, county', 'USD'],
      ['Install', '1', '50.00', 'Tax exempt', 'USD'],
      ['Valve', '1', '100.00', f.exempt ? 'Tax exempt' : 'City, county', 'USD'],
    ])
    assert.deepEqual([rows[0].TaxJurisdiction, rows[0].TaxRate, rows[0].DocumentTaxableSubtotal, rows[0].DocumentTaxAmount, rows[0].DocumentTotal], ['City, county', '8.25', f.exempt ? '0.00' : '300.00', f.exempt ? '0.00' : '24.75', f.exempt ? '350.00' : '374.75'])
    assert.ok(rows.slice(1).every(r => [r.TaxJurisdiction, r.TaxRate, r.DocumentTaxableSubtotal, r.DocumentTaxAmount, r.DocumentTotal].every(v => v === '')))
    const exported = await latest(h, 'invoices', inv.id), retained = structuredClone(exported.revisions)
    inv = await h.command('invoice.correct', { invoiceId: inv.id, version: exported.version, reason: 'Corrected approved document', lines: revision(inv).lines })
    assert.deepEqual(revision(inv).totals, job.totals)
    assert.deepEqual(inv.revisions.slice(0, -1), retained)
    inv = await approve(h, inv)
    await h.command('invoice.export', {})
    const beforeRestart = await latest(h, 'invoices', inv.id)
    await h.restart()
    assert.deepEqual(await latest(h, 'invoices', inv.id), beforeRestart)
    assert.deepEqual((await latest(h, 'quotes', f.q.id)).revisions[0], f.frozen)
    assert.equal(await h.request(exportPath).then(r => r.text()), exportedCsv, 'the earlier approved export stays byte-identical after correction and restart')
    const afterRestartRequests = h.outbound.attempts
    const correctedDocument = await h.request('/api/glove/invoices/' + inv.id + '/quickbooks.json' + query).then(r => r.json())
    assert.deepEqual([correctedDocument.CurrencyRef, correctedDocument.Line, correctedDocument.TxnTaxDetail], [document.CurrencyRef, document.Line, document.TxnTaxDetail])
    assert.equal(correctedDocument.DocNumber, inv.number + '-R3')
    assert.equal(h.outbound.attempts, afterRestartRequests, 'restarted inspection still makes no provider request')
  }
  await trail(h, ['quote.approved', 'quote.accepted', 'invoice.prepared', 'invoice.revised', 'invoice.corrected', 'invoice.exported'])
})

test('MONEY-004 legacy AUD invoices keep Xero GST line columns after restart', async t => {
  const h = await installation({ at: '2026-10-30T12:00:00.000Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Legacy Australian trades', currency: 'AUD', timezone: 'Australia/Sydney' })
  const team = await crew(h), p = await place(h)
  const job = await h.command('job.create', { customerId: p.customer.id, siteId: p.site.id, title: 'Legacy tax', lines: [{ ...line(), tax: 'GST' }, { ...line('50.00'), description: 'GST free service', tax: 'FREE' }] })
  const inv = await approve(h, await complete(h, job, team))
  assert.deepEqual(revision(inv).totals, { subtotal: '150.00', gst: '10.00', total: '160.00' })
  const batch = await h.command('invoice.export', {})
  const read = () => h.request('/api/glove/exports/' + batch.id + '.csv').then(r => r.text())
  const text = await read(), table = csv(text)
  assert.deepEqual(table[0], ['*ContactName', 'EmailAddress', 'POAddressLine1', '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType', 'Currency'])
  assert.deepEqual(table.slice(1).map(r => [r[7], r[8], r[9], r[11], r[12]]), [['Valve, installed', '1', '100.00', 'GST on Income', 'AUD'], ['GST free service', '1', '50.00', 'GST Free Income', 'AUD']])
  await h.restart()
  assert.equal(await read(), text)
  await trail(h, ['invoice.approved', 'invoice.exported'])
})
