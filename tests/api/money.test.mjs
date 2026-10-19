import test from 'node:test'
import assert from 'node:assert/strict'
import { installation } from './harness.mjs'

const certificate = { mediaType: 'image/png', base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH0cAAAAASUVORK5CYII=' }
const jurisdiction = (id, name, rate, zip, taxLabor) => ({ id, name, rate, zips: [zip], taxLabor })
const settings = (...jurisdictions) => ({ jurisdictions })

test('DATA-002 / MONEY-001 address and branch tax, labor rules and certificate expiry remain exact on approved documents, exports, QuickBooks payloads and tax reports', async t => {
  const h = await installation(); t.after(() => h.close())
  const initialSettings = settings(jurisdiction('tx', 'Austin combined', '8.25', '78704', false), jurisdiction('az', 'Phoenix combined', '6.5', '85001', true))
  await h.command('business.save', { name: 'Exact Trade', timezone: 'America/Chicago', taxSettings: initialSettings })
  assert.equal((await h.state()).business[0].currency, 'USD')
  const material = await h.command('service.save', { code: 'PART', name: 'Valve', kind: 'material', unitPrice: '100.01', tax: 'TAXABLE' })
  const labor = await h.command('service.save', { code: 'LABOR', name: 'Install labor', kind: 'service', unitPrice: '50.03', tax: 'TAXABLE' })
  const invoiceLines = [material, labor].map(s => ({ description: s.name, serviceId: s.id, quantity: '1', unitPrice: s.unitPrice }))
  const east = await h.command('branch.save', { name: 'East', prefix: 'EAST', timezone: 'America/New_York', zips: ['27601'], taxSettings: settings(jurisdiction('county', 'Wake combined', '4.5', '27601', false)) })
  const west = await h.command('branch.save', { name: 'West', prefix: 'WEST', timezone: 'America/Los_Angeles', zips: ['89101'], taxSettings: settings(jurisdiction('county', 'Clark combined', '8.375', '89101', true)) })
  const crew = async (name, branchId) => {
    const person = await h.person(name, 'technician')
    const technician = await h.command('technician.save', { name, operatorId: person.id, branchId })
    return { person, technician }
  }
  const mainCrew = await crew('Main Technician', null), eastCrew = await crew('East Technician', east.id), westCrew = await crew('West Technician', west.id)
  const place = async (name, zip, branchId = null, exemption) => {
    let customer = await h.command('customer.save', { name, ...(exemption ? { taxExemption: exemption } : {}) })
    const site = await h.command('site.save', { customerId: customer.id, address: `10 Service St, US ${zip}`, zip, branchId })
    if (exemption) {
      customer = (await h.state()).customers.find(c => c.id === customer.id)
      await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: certificate })
      customer = (await h.state()).customers.find(c => c.id === customer.id)
      assert.ok(customer.taxExemption.certificate.fileId)
    }
    return { customer, site }
  }
  const a = await place('Austin customer', '78704'), z = await place('Phoenix customer', '85001')
  const e = await place('East customer', '27601', east.id), w = await place('West customer', '89101', west.id)
  const exempt = await place('Exempt school', '78704', null, { certificateNumber: 'SCHOOL-24', expires: '2099-12-31' })
  const expired = await place('Expired school', '78704', null, { certificateNumber: 'SCHOOL-OLD', expires: '2000-01-01' })
  // A certificate number without the private certificate bytes grants no exemption.
  const missing = await h.command('customer.save', { name: 'Certificate missing', taxExemption: { certificateNumber: 'NOT-UPLOADED', expires: '2099-12-31' } })
  const missingSite = await h.command('site.save', { customerId: missing.id, address: '11 Service St, Austin TX 78704' })
  const missingQuote = await h.command('quote.draft', { customerId: missing.id, siteId: missingSite.id, title: 'Certificate absent', lines: invoiceLines })
  assert.equal(missingQuote.revisions[0].totals.gst, '8.25')

  const cases = [[a, mainCrew, '8.25', '100.01'], [z, mainCrew, '9.75', '150.04'], [e, eastCrew, '4.50', '100.01'], [w, westCrew, '12.57', '150.04'], [exempt, mainCrew, '0.00', '0.00'], [expired, mainCrew, '8.25', '100.01']]
  for (const [place, , tax, taxable] of cases) {
    const draft = await h.command('quote.draft', { customerId: place.customer.id, siteId: place.site.id, title: 'Install valve', lines: invoiceLines })
    const totals = draft.revisions[0].totals
    assert.deepEqual([totals.currency, totals.subtotal, totals.gst, totals.taxBreakdown[0].taxable], ['USD', '150.04', tax, taxable])
    place.quote = await h.command('quote.approve', { quoteId: draft.id, version: draft.version, revision: 1 })
    place.frozen = totals
  }
  // Tax changes after human approval cannot alter the customer's approved choice.
  let b = (await h.state()).business[0]
  await h.command('business.save', { name: b.name, timezone: b.timezone, version: b.version, taxSettings: settings(jurisdiction('tx', 'Changed Austin rate', '10', '78704', true), jurisdiction('az', 'Changed Phoenix rate', '11', '85001', true)) })
  await h.command('branch.save', { id: east.id, version: (await h.state()).branches.find(x => x.id === east.id).version, name: east.name, prefix: east.prefix, timezone: east.timezone, zips: east.zips, taxSettings: settings(jurisdiction('county', 'Changed Wake rate', '20', '27601', true)) })

  const invoices = []
  for (const [index, [place, crew, tax]] of cases.entries()) {
    const q = await h.command('quote.accept', { quoteId: place.quote.id, version: place.quote.version, revision: 1, method: 'phone', customerName: place.customer.name })
    assert.deepEqual(q.acceptance.totals, place.frozen)
    const job = await h.command('job.create', { quoteId: q.id })
    assert.deepEqual(job.totals, place.frozen)
    const visit = await h.command('visit.book', { jobId: job.id, technicianId: crew.technician.id, date: `2026-11-${String(index + 2).padStart(2, '0')}`, start: '09:00', end: '10:00' })
    await crew.person.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await crew.person.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Valve installed', signoff: { absentReason: 'Customer left before completion' } })
    const invoice = await h.command('invoice.prepare', { jobId: job.id })
    assert.deepEqual(invoice.revisions[0].totals, place.frozen)
    const approved = await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    invoices.push(approved)
    const query = 'customerRef=customer-17&itemRef=item-4&taxCodeRef=tax-code-9'
    const response = await h.request(`/api/glove/invoices/${invoice.id}/quickbooks.json?${query}`)
    assert.equal(response.status, 200)
    const payload = await response.json()
    assert.deepEqual(payload.CustomerRef, { value: 'customer-17' })
    assert.deepEqual(payload.TxnTaxDetail, { TxnTaxCodeRef: { value: 'tax-code-9' }, TotalTax: Number(tax) })
    assert.deepEqual(payload.Line.map(l => l.SalesItemLineDetail.TaxCodeRef.value), place === exempt ? ['NON', 'NON'] : place === z || place === w ? ['TAX', 'TAX'] : ['TAX', 'NON'])
    assert.equal(payload.CurrencyRef.value, 'USD')
  }
  assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json`)).status, 400)
  const privateFileId = exempt.customer.taxExemption.certificate.fileId
  const bytes = await h.request(`/api/glove/files/${privateFileId}`)
  assert.equal(bytes.status, 200)
  assert.equal(Buffer.from(await bytes.arrayBuffer()).toString('base64'), certificate.base64)
  assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: westCrew.person.cookie })).status, 404)
  const branchOffice = await h.person('East Office', 'office')
  await h.command('branch.limit', { operatorId: branchOffice.id, branchId: east.id })
  assert.equal((await h.request(`/api/glove/files/${privateFileId}`, { as: branchOffice.cookie })).status, 404)
  assert.equal((await h.request(`/api/glove/invoices/${invoices[0].id}/quickbooks.json?customerRef=58&itemRef=41&taxCodeRef=7`, { as: branchOffice.cookie })).status, 404)
  await branchOffice.run('customer.certificate', { customerId: exempt.customer.id, version: exempt.customer.version, file: certificate }, { error: 'NOT_FOUND' })
  await branchOffice.run('tax.connect', { key: 'fixture-no-authority' }, { error: 'FORBIDDEN' })
  await branchOffice.run('tax.lookup', { siteId: e.site.id }, { error: 'FORBIDDEN' })

  // Optional Stripe lookup uses only the declared service-address fields and classifications.
  await h.command('tax.connect', { key: 'fixture-stripe-tax-credential' })
  const request = { siteId: a.site.id, address: { line1: '10 Service St', city: 'Austin', state: 'TX', postal_code: '78704' }, serviceTaxCode: 'txcd_20080007' }
  h.stripeTax.answer = body => ({ id: body['line_items[0][tax_code]'] === 'txcd_99999999' ? 'taxcalc_parts' : 'taxcalc_labor', tax_breakdown: [{ taxability_reason: body['line_items[0][tax_code]'] === 'txcd_99999999' ? 'standard_rated' : 'product_exempt', tax_rate_details: { percentage_decimal: '8.25' } }] })
  const lookup = await h.command('tax.lookup', request)
  assert.deepEqual([lookup.proposal.rate, lookup.proposal.taxLabor], ['8.25', false])
  assert.equal(h.stripeTax.calls.length, 2)
  for (const call of h.stripeTax.calls) {
    assert.equal(call.authorization, 'Bearer fixture-stripe-tax-credential')
    assert.equal(call.body['customer_details[address][line1]'], '10 Service St')
    assert.equal(call.body['line_items[0][amount]'], '10000')
    assert.ok(call.idempotencyKey)
    assert.ok(!JSON.stringify(call.body).includes(a.customer.id) && !JSON.stringify(call.body).includes(exempt.customer.taxExemption.certificateNumber))
  }
  h.stripeTax.answer = () => ({ id: 'taxcalc_unregistered', tax_breakdown: [{ taxability_reason: 'not_collecting', tax_rate_details: { percentage_decimal: '0' } }] })
  assert.equal((await h.command('tax.lookup', request)).proposal, null)
  await h.command('tax.connect', { key: null })
  const exportedTrail = await h.request('/api/glove/export').then(r => r.json())
  for (const kind of ['customer.certificate', 'tax.connected', 'tax.lookupOutcome', 'tax.lookedUp', 'tax.disconnected']) assert.ok(exportedTrail.timeline.some(e => e.kind === kind && e.actor_id && e.at && e.command_id), `DATA-002 ${kind}`)
  assert.ok(!JSON.stringify(exportedTrail).includes('fixture-stripe-tax-credential'))
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  for (const kind of ['customer.certificate', 'tax.connected', 'tax.lookupOutcome', 'tax.lookedUp', 'tax.disconnected']) assert.ok(activity.events.some(e => e.kind === kind), `DATA-002 Activity ${kind}`)
  // A document exceeding the old command/row ceiling still round-trips privately.
  const large = Buffer.alloc(10 * 1024 * 1024, 32); large.write('%PDF-1.7\n'); large.write('\n%%EOF', large.length - 6)
  const customer = (await h.state()).customers.find(c => c.id === expired.customer.id)
  const uploaded = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: large.toString('base64') } })
  const downloaded = await h.request(`/api/glove/files/${uploaded.taxExemption.certificate.fileId}`)
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), large)
  await h.command('customer.certificate', { customerId: customer.id, version: uploaded.version, file: { mediaType: 'image/png', base64: large.toString('base64') } }, { error: 'INPUT' })
  const batch = await h.command('invoice.export', {})
  const csv = await h.request(`/api/glove/exports/${batch.id}.csv`).then(r => r.text())
  assert.match(csv, /DocumentTaxAmount/)
  for (const [place, , tax] of cases) {
    const inv = invoices.find(i => i.customerId === place.customer.id)
    const exported = batch.invoices.find(i => i.invoiceId === inv.id)
    assert.equal(exported.currency, 'USD')
    assert.deepEqual(exported.taxBreakdown, place.frozen.taxBreakdown)
    assert.ok(csv.includes(place.frozen.taxBreakdown[0].jurisdiction))
    assert.ok(csv.includes(tax))
  }
  const period = 'from=2020-01-01&to=2099-12-31'
  const report = await h.request(`/api/glove/reports/tax.json?${period}`).then(r => r.json())
  const row = (id, branchId) => report.jurisdictions.find(j => j.jurisdictionId === id && j.branchId === branchId)
  assert.deepEqual([row('tx', null).tax, row('az', null).tax, row('county', east.id).tax, row('county', west.id).tax], ['16.50', '9.75', '4.50', '12.57'])
  const narrowed = await h.request(`/api/glove/reports/tax.json?${period}&branchId=${east.id}`).then(r => r.json())
  assert.equal(narrowed.jurisdictions.length, 1)
  assert.deepEqual([narrowed.jurisdictions[0].branchId, narrowed.jurisdictions[0].tax], [east.id, '4.50'])
  const taxCsv = await h.request(`/api/glove/reports/tax.csv?${period}&branchId=${west.id}`).then(r => r.text())
  assert.match(taxCsv, /Clark combined/)
  assert.match(taxCsv, /12\.57/)
  assert.ok(!taxCsv.includes('Wake combined'))
})
