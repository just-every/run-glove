import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, customerHistoryFixture } from './harness.mjs'

// CUST-001: a business customer with several contacts and two properties;
// each property's whole history, newest first; billing contact and
// accounts-payable email apart from the site contacts; a required PO number.

test('CUST-001: each property has its whole history, and a business customer bills apart from its sites', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { customer, apEmail, contactEmail, histories, trail, replays } = await customerHistoryFixture(h, b)
  const [a] = histories
  await h.restart()
  const state = await h.state()
  const saved = state.customers.find(c => c.id === customer.id)
  assert.deepEqual([saved.contact, saved.email, saved.billingContact, saved.apEmail], ['Dr Mei Lin', contactEmail, 'Ravi Patel', apEmail])
  assert.deepEqual(saved.contacts, [{ name: 'Dr Mei Lin', role: 'principal', phone: '(212) 555-0101', email: '' }, { name: 'Ravi Patel', role: 'accounts payable', email: apEmail, phone: '' }])
  assert.deepEqual(histories.map(({ site }) => {
    const kept = state.sites.find(x => x.id === site.id)
    return [kept.customerId, kept.address, kept.contact, kept.contactPhone]
  }), [[customer.id, '14 Harbour St, Balmain', 'Jo Front Desk', '(212) 555-0199'], [customer.id, '22 Wharf Rd, Birchgrove', 'Sam Practice Manager', '(212) 555-0188']])
  const history = async (site, as = h.owner()) => {
    const res = await h.request(`/api/glove/sites/${site.id}/history`, { as })
    assert.equal(res.status, 200, await res.clone().text())
    const body = await res.json()
    assert.equal(body.site.id, site.id)
    assert.equal(body.site.customerId, customer.id)
    return body.entries
  }
  for (const replay of replays) assert.deepEqual(await b.priyaPerson.run('visit.capture', replay.payload, { commandId: replay.commandId }), replay.result)
  const before = await h.request('/api/glove/export').then(r => r.json())
  for (const { site, expected } of histories) {
    assert.deepEqual(await history(site), expected, `complete, isolated, newest-first history at ${site.address}`)
    assert.deepEqual(await history(site, b.office.cookie), expected)
    const field = expected.filter(e => !['request', 'quote', 'invoice', 'message', 'equipment', 'service report'].includes(e.kind))
    // Equipment is shared at an assigned site; desk-only records stay private.
    assert.deepEqual(await history(site, b.priyaPerson.cookie), [...field, ...expected.filter(e => e.kind === 'equipment')].sort((x, y) => y.at.localeCompare(x.at)))
    assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: b.tomPerson.cookie })).status, 404)
    assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: '' })).status, 401)
  }
  const afterReads = await h.request('/api/glove/export').then(r => r.json())
  for (const key of ['customers', 'sites', 'enquiries', 'quotes', 'jobs', 'visits', 'captures', 'invoices', 'equipment']) assert.deepEqual(afterReads[key], before[key], `history reads leave ${key} unchanged`)
  const unrelated = await h.command('site.save', { customerId: customer.id, address: '99 Unassigned Lane' })
  assert.equal((await h.request(`/api/glove/sites/${unrelated.id}/history`, { as: b.priyaPerson.cookie })).status, 404)
  const branch = await h.command('branch.save', { name: 'Other branch', prefix: 'OTH', timezone: 'UTC', zips: [] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  for (const { site } of histories) assert.equal((await h.request(`/api/glove/sites/${site.id}/history`, { as: b.office.cookie })).status, 404)
  await h.command('branch.limit', { operatorId: b.office.id, branchId: null })
  const credential = await h.command('token.issue', { name: 'synthetic-glove-history', role: 'viewer' })
  const tokenRead = site => h.request(`/api/glove/sites/${site.id}/history`, { as: '', headers: { authorization: `Bearer ${credential.token}` } })
  for (const { site, expected } of histories) {
    const res = await tokenRead(site)
    assert.equal(res.status, 200)
    assert.deepEqual((await res.json()).entries, expected)
  }
  await h.command('token.revoke', { tokenId: credential.id })
  for (const { site } of histories) assert.equal((await tokenRead(site)).status, 401)
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const after = await h.request('/api/glove/export').then(r => r.json())
  for (const expected of trail) {
    const e = activity.events.find(e => e.commandId === expected.commandId && e.kind === expected.kind)
    assert.ok(e, `${expected.kind} has attributable Activity`)
    assert.deepEqual([e.actorId, e.actorName, e.actorRole, e.at, e.subjectId], [expected.actorId, expected.actorName, expected.actorRole, expected.at, expected.subjectId])
    const exported = after.timeline.find(x => x.id === e.id)
    assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id], [expected.actorId, expected.actorName, expected.actorRole, expected.at, expected.commandId])
  }
  const inv = a.invoice

  // The customer requires a purchase-order number: no approval without one, and the export carries it to accounts payable.
  await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, { error: 'PO_REQUIRED' })
  const approved = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1, poNumber: 'PO-7781' })
  assert.equal(approved.poNumber, 'PO-7781')
  const exported = await b.office.run('invoice.export', {})
  const csv = await (await h.request(`/api/glove/exports/${exported.id}.csv`)).text()
  assert.ok(csv.split('\r\n')[1].startsWith(`Harbourview Dental,${apEmail},`))
  assert.match(csv.split('\r\n')[1], /,PO PO-7781 · J-\d+,/)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  for (const replay of replays) await b.priyaPerson.run('visit.capture', replay.payload, { commandId: replay.commandId, error: 'ERASED' })
  await h.restart()
  for (const { site } of histories) {
    const erased = JSON.stringify(await history(site))
    for (const personal of ['Harbourview Dental', 'Harbour cooling service', 'Wharf heating service', 'Harbour coil cleaned', 'Wharf coil inspected', 'Harbour filter', 'Wharf filter', apEmail, contactEmail]) assert.ok(!erased.includes(personal), `erased history omits ${personal}`)
  }
  assert.deepEqual((await h.state()).captures, [], 'replayed captures never return after erasure')

})
