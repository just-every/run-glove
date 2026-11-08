import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, assertTrail } from './harness.mjs'

const address = { line1: '10 Service St', city: 'Austin', state: 'TX', postal_code: '78704' }
const key = { accountId: '1100098765', licenseKey: 'synthetic-glove-501', companyCode: 'synthetic-glove-502', environment: 'sandbox' }
const stripeCodes = ['txcd_20080007', 'txcd_20020010', 'txcd_20020018', 'txcd_20030000']
const original = { jurisdictions: [{ id: 'manual', name: 'Owner rate', rate: '7.75', zips: ['78704'], taxLabor: true }] }
async function fixture(h) {
  await h.command('business.save', { name: 'Synthetic service business', currency: 'USD', timezone: 'America/Chicago', taxSettings: original })
  const customer = await h.command('customer.save', { name: 'synthetic-glove-503', contact: 'synthetic-glove-504', phone: '212 555 0199', billingAddress: 'Private billing street', taxExemption: { certificateNumber: 'synthetic-glove-505', expires: '2099-12-31' } })
  const site = await h.command('site.save', { customerId: customer.id, address: 'Private saved site address', accessNotes: 'synthetic-glove-506', contact: 'synthetic-glove-507' })
  const bytes = Buffer.from('%PDF-1.7\nsynthetic-glove-508\n%%EOF')
  await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: bytes.toString('base64') } })
  return { site, customer, request: { siteId: site.id, address, serviceTaxCode: stripeCodes[0] } }
}
const stripeLine = (reason = 'standard_rated', rate = '8.25') => ({ taxability_reason: reason, tax_rate_details: { percentage_decimal: rate } })
const stripeAnswer = (parts = [stripeLine()], service = [stripeLine()]) => body => ({ id: 'synthetic-glove-509', tax_breakdown: body['line_items[0][tax_code]'] === 'txcd_99999999' ? parts : service })
const taxable = rate => ({ jurisName: 'Synthetic jurisdiction', rate, taxableAmount: 100, nonTaxableAmount: 0, exemptAmount: 0 })
const exemptLabor = { jurisName: 'Synthetic jurisdiction', rate: 0, taxableAmount: 0, nonTaxableAmount: 100, exemptAmount: 0 }
const avaAnswer = (parts = [taxable(0.0825)], service = [exemptLabor]) => ({ code: 'synthetic-glove-510', lines: [{ lineNumber: 'parts', details: parts }, { lineNumber: 'service', details: service }] })
async function unavailable(h, request, scenario = 'provider refusal') {
  const before = await h.state()
  const result = await h.command('tax.lookup', request)
  assert.equal(result.proposal, null, scenario)
  assert.match(result.label, /^Rate unavailable/)
  assert.doesNotMatch(result.label, /0%/)
  const after = await h.state()
  for (const collection of ['business', 'customers', 'sites']) assert.deepEqual(after[collection], before[collection], `${collection} unchanged by unavailable provider answer`)
  return result
}

test('MONEY-005 Stripe proposals disclose only fixed samples and fail closed without applying tax settings', async t => {
  const h = await installation({ at: '2030-03-12T12:00:00Z' }); t.after(() => h.close())
  const { request } = await fixture(h)
  await h.command('tax.connect', { key: 'synthetic-glove-511' })
  for (const serviceTaxCode of stripeCodes) {
    h.stripeTax.answer = stripeAnswer([stripeLine()], [stripeLine('product_exempt')])
    const payload = { ...request, serviceTaxCode }, commandId = randomUUID(), start = h.stripeTax.calls.length
    const proposal = await h.command('tax.lookup', payload, { commandId })
    assert.deepEqual([proposal.proposal.rate, proposal.proposal.taxLabor], ['8.25', false])
    assert.deepEqual((await h.state()).business[0].taxSettings, original)
    assert.equal(h.stripeTax.calls.length, start + 2)
    for (const [i, call] of h.stripeTax.calls.slice(start).entries()) {
      assert.deepEqual(call.body, {
        currency: 'usd', 'customer_details[address_source]': 'shipping',
        'line_items[0][amount]': '10000', 'line_items[0][quantity]': '1',
        'line_items[0][reference]': 'address-rate-lookup', 'line_items[0][tax_behavior]': 'exclusive',
        'line_items[0][tax_code]': i === 0 ? 'txcd_99999999' : serviceTaxCode,
        'customer_details[address][line1]': '10 Service St', 'customer_details[address][city]': 'Austin',
        'customer_details[address][state]': 'TX', 'customer_details[address][postal_code]': '78704', 'customer_details[address][country]': 'US',
      })
    }
    assert.deepEqual(await h.command('tax.lookup', payload, { commandId }), proposal)
    assert.equal(h.stripeTax.calls.length, start + 2, 'replay sends no calculation')
  }
  const calls = h.stripeTax.calls.length
  await h.command('tax.lookup', { ...request, serviceTaxCode: 'synthetic-glove-unsupported' }, { error: 'INPUT' })
  assert.equal(h.stripeTax.calls.length, calls)
  const cases = [
    ['unregistered', [stripeLine('not_collecting', '0')], [stripeLine()]],
    ['rateless', [stripeLine('standard_rated', undefined)], [stripeLine('product_exempt')]],
    ['zero', [stripeLine('standard_rated', '0')], [stripeLine('product_exempt')]],
    ['partial', [stripeLine('portion_standard_rated')], [stripeLine()]],
    ['mixed', [stripeLine()], [stripeLine(), stripeLine('product_exempt')]],
    ['multiple jurisdictions', [stripeLine(), stripeLine()], [stripeLine()]],
    ['reduced', [stripeLine('reduced_rated')], [stripeLine()]],
    ['exempt parts', [stripeLine('product_exempt')], [stripeLine('product_exempt')]],
    ['unsupported', [stripeLine('synthetic-glove-unknown')], [stripeLine()]],
    ['different labor', [stripeLine()], [stripeLine('standard_rated', '4.5')]],
  ]
  // An absent provider rate is distinct from the helper's default rate.
  cases[1][1][0].tax_rate_details = {}
  for (const [name, parts, service] of cases) {
    h.stripeTax.answer = stripeAnswer(parts, service)
    await unavailable(h, request, name)
  }
  for (const reply of [() => Response.json({ error: 'refused' }, { status: 403 }), () => new Response(null, { headers: { 'x-synthetic-glove-tax-unreachable': '1' } })]) {
    h.stripeTax.reply = reply
    const result = await unavailable(h, request)
    assert.ok(result.parts.status === 403 || result.parts.status === 0)
  }
  h.stripeTax.reply = null
  await h.restart()
  h.stripeTax.answer = stripeAnswer()
  const result = await h.command('tax.lookup', request)
  assert.deepEqual([result.proposal.rate, result.proposal.taxLabor], ['8.25', true])
  await h.command('business.save', { ...(await h.state()).business[0], taxSettings: { jurisdictions: [result.proposal] } })
  await h.restart()
  assert.deepEqual((await h.state()).business[0].taxSettings.jurisdictions, [result.proposal])
})

test('MONEY-005 AvaTax exact SalesOrder proposals retain millionth precision, refuse unsafe treatments and replay after restart', async t => {
  const h = await installation({ at: '2030-03-12T12:00:00Z' }); t.after(() => h.close())
  const f = await fixture(h), request = { ...f.request, provider: 'avatax', serviceTaxCode: 'SV060100' }
  for (const environment of ['sandbox', 'production']) {
    await h.command('tax.connect', { provider: 'avatax', key: { ...key, environment } })
    await h.restart()
    // Each jurisdiction is rounded to millionths before summing: 0.0623454
    // becomes 62345; 0.0200004 becomes 20000, giving exactly 8.2345%.
    const parts = [{ ...taxable(0.0623454), rateType: 'General' }, { ...taxable(0.0200004), rateType: 'General' }]
    h.avatax.answer = () => avaAnswer(parts, parts)
    const commandId = randomUUID(), before = h.avatax.calls.length
    const result = await h.command('tax.lookup', request, { commandId })
    assert.equal(h.avatax.calls.length, before + 1)
    assert.deepEqual([result.parts.combined, result.labor.combined, result.proposal.rate, result.proposal.taxLabor], ['8.2345', '8.2345', '8.2345', true])
    assert.deepEqual((await h.state()).business[0].taxSettings, original)
    const call = h.avatax.calls.at(-1)
    assert.equal(call.url, `https://${environment === 'sandbox' ? 'sandbox-' : ''}rest.avatax.com/api/v2/transactions/create`)
    assert.deepEqual(call.body, {
      type: 'SalesOrder', commit: false, companyCode: key.companyCode, date: '2030-03-12', customerCode: 'glove-address-rate-lookup', currencyCode: 'USD',
      addresses: { singleLocation: { line1: '10 Service St', city: 'Austin', region: 'TX', postalCode: '78704', country: 'US' } },
      lines: [{ number: 'parts', quantity: 1, amount: 100, taxCode: 'P0000000', description: 'Sample tangible goods' }, { number: 'service', quantity: 1, amount: 100, taxCode: 'SV060100', description: 'Sample service' }],
    })
    await h.restart()
    assert.deepEqual(await h.command('tax.lookup', request, { commandId }), result)
    assert.equal(h.avatax.calls.length, before + 1)
  }
  const cases = [
    ['unregistered', [], []], ['zero', [taxable(0)], [taxable(0)]],
    ['sub-millionth zero sum', [taxable(0.0000004)], [taxable(0.0000004)]],
    ['rateless', [{ ...taxable(0.08), rate: null }], [exemptLabor]],
    ['partial', [{ ...taxable(0.08), taxableAmount: 50, nonTaxableAmount: 50 }], [exemptLabor]],
    ['mixed service', [taxable(0.08)], [taxable(0.08), exemptLabor]],
    ['exempt parts', [{ ...taxable(0.08), taxableAmount: 0, exemptAmount: 100 }], [exemptLabor]],
    ['reduced basis', [{ ...taxable(0.08), taxableAmount: 80 }], [exemptLabor]],
    ['reduced rate', [{ ...taxable(0.04), rateType: 'ReducedA' }], [exemptLabor]],
    ['different labor', [taxable(0.08)], [taxable(0.04)]],
    ['unsupported', [{ jurisName: 'Unknown', rate: '0.08' }], [exemptLabor]],
    ['partial jurisdiction', [taxable(0.06), { ...taxable(0.02), taxableAmount: 50, exemptAmount: 50 }], [exemptLabor]],
  ]
  for (const [name, parts, service] of cases) {
    h.avatax.answer = () => avaAnswer(parts, service)
    await unavailable(h, request, name)
  }
  for (const reply of [() => Response.json({ error: 'refused' }, { status: 401 }), () => new Response(null, { headers: { 'x-synthetic-glove-tax-unreachable': '1' } })]) {
    h.avatax.reply = reply
    const result = await unavailable(h, request)
    assert.ok(result.parts.status === 401 || result.parts.status === 0)
  }
  h.avatax.reply = null
  h.avatax.answer = () => avaAnswer()
  const result = await h.command('tax.lookup', request)
  assert.deepEqual([result.proposal.rate, result.proposal.taxLabor], ['8.25', false])
  await h.command('business.save', { ...(await h.state()).business[0], taxSettings: { jurisdictions: [result.proposal] } })
  await h.restart()
  assert.deepEqual((await h.state()).business[0].taxSettings.jurisdictions, [result.proposal])
})

test('MONEY-005 AvaTax connection custody requires the current signed-in unscoped Owner and never exposes its sealed value', async t => {
  const h = await installation({ captureLogs: true, at: '2030-03-12T12:00:00Z' }); t.after(() => h.close())
  const f = await fixture(h), request = { ...f.request, provider: 'avatax', serviceTaxCode: 'SV060100' }
  await h.command('tax.connect', { provider: 'avatax', key })
  h.avatax.answer = () => avaAnswer()
  const id = randomUUID(), result = await h.command('tax.lookup', request, { commandId: id })
  const role = await h.command('role.save', { name: 'Synthetic tax delegate', permissions: ['customer.save', 'reports.read', 'export.read'] })
  const office = await h.person('Synthetic Office', 'office'), dispatcher = await h.person('Synthetic Dispatcher', 'dispatcher')
  const custom = await h.person('Synthetic Custom', `custom:${role.id}`), limited = await h.person('Synthetic Limited', 'owner')
  await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
  for (const person of [office, dispatcher, custom, limited]) {
    for (const candidate of [key, null]) await person.run('tax.connect', { provider: 'avatax', key: candidate }, { error: 'FORBIDDEN' })
    await person.run('tax.lookup', request, { error: 'FORBIDDEN' })
  }
  const token = await h.command('token.issue', { name: 'Synthetic integration', role: 'office' })
  for (const candidate of [key, null]) {
    const response = await h.request('/api/glove/commands', { as: '', headers: { authorization: `Bearer ${token.token}` }, method: 'POST', body: { commandId: randomUUID(), type: 'tax.connect', payload: { provider: 'avatax', key: candidate } } })
    assert.equal(response.status, 403)
  }
  const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: randomUUID(), type: 'tax.connect', payload: { provider: 'avatax', key: null } } })
  assert.equal(signedOut.status, 401)
  assert.equal(h.avatax.calls.length, 1)
  assert.equal((await h.state()).business[0].avataxLookup.connected, true)
  const changed = await h.person('Synthetic Former Owner', 'owner')
  await changed.run('tax.connect', { provider: 'avatax', key })
  await h.command('role.set', { operatorId: changed.id, role: 'office' })
  await changed.run('tax.connect', { provider: 'avatax', key: null }, { error: 'FORBIDDEN' })
  await h.restart()
  assert.deepEqual(await h.command('tax.lookup', request, { commandId: id }), result)
  assert.equal(h.avatax.calls.length, 1)
  await h.command('tax.connect', { provider: 'avatax', key: null })
  await h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
  await h.restart()
  await h.command('tax.lookup', request, { error: 'TAX_PROVIDER' })
  assert.deepEqual(await h.command('tax.lookup', request, { commandId: id }), result, 'disconnection retains only the historical outcome')
  assert.equal(h.avatax.calls.length, 1, 'disconnected replay cannot send another SalesOrder')
  await changed.run('tax.lookup', request, { commandId: id, error: 'FORBIDDEN' })
  const trail = await assertTrail(h, ['tax.connected', 'tax.lookupOutcome', 'tax.lookedUp', 'tax.disconnected'])
  const saved = await h.db.prepare("SELECT result FROM glove_commands WHERE type LIKE 'tax.%'").all()
  assert.ok(h.logs.length > 0, 'Worker log capture is active while credentials are in use')
  const views = [await h.state(), trail, saved.results, h.logs]
  for (const value of [key.accountId, key.licenseKey, key.companyCode, Buffer.from(`${key.accountId}:${key.licenseKey}`).toString('base64'), JSON.stringify(key), '"environment":"sandbox"']) {
    for (const view of views) assert.ok(!JSON.stringify(view).includes(value), 'sealed provider value absent from state, outcomes, Activity, export and Worker logs')
  }
})
