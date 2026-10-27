import { xeroBusiness, xeroSync, enableXeroPolicy } from '../fixtures/xero-business.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'
import { quickbooksBusiness, qboInvoice } from '../fixtures/quickbooks-business.mjs'

const read = async (h, path) => (await h.request(path)).json()
const current = async (h, kind, id) => (await h.state())[kind].find(r => r.id === id)

test('QuickBooks sync posts mapped customer, frozen invoice, payment and refund once; a rejected item is repaired and retried with secret-free history', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h)
  const branch = await h.command('branch.save', { name: 'Austin North', prefix: 'NTH', zips: [], timezone: 'America/Chicago', taxSettings: { jurisdictions: [{ id: 'county', name: 'North combined', rate: '7.375', zips: [], taxLabor: true }], defaultJurisdictionId: 'county' } })
  b.customer = await h.command('customer.save', { name: 'North Austin Properties', email: 'ap@north.example.test', branchId: branch.id })
  h.quickbooks.record('customer', { Id: '13', SyncToken: '0', Active: true, Job: false })
  await h.command('qbo.map', { kind: 'customer', id: b.customer.id, remoteId: '13' })
  await h.command('qbo.confirmLinks', { confirm: true })
  const site = await h.command('site.save', { customerId: b.customer.id, address: b.site.address, branchId: branch.id })
  await h.command('technician.save', { id: b.priya.id, version: b.priya.version, name: b.priya.name, operatorId: b.priyaPerson.id, branchId: branch.id })
  const invoice = await qboInvoice(h, b, site, 'HVAC service', { kind: 'percent', value: '30', reason: 'Loyalty' }, [{ description: 'Non-taxable maintenance', serviceId: b.service.id, quantity: '1', unitPrice: '30.30', tax: 'FREE' }])
  const rev = invoice.revisions.at(-1)
  assert.equal(rev.totals.gst, '11.32'); assert.equal(rev.totals.total, '164.83')
  assert.deepEqual([rev.totals.discount.nonTaxable, rev.totals.discount.taxable], ['30.30', '35.49'])
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id })
  h.quickbooks.reject = 'The income account is inactive'
  const rejected = await h.command('qbo.sync', { kind: 'service', id: b.service.id })
  assert.equal(rejected.phase, 'rejected'); assert.match(rejected.message, /income account is inactive/)
  assert.match((await current(h, 'services', b.service.id)).qboSync.message, /income account is inactive/)
  h.quickbooks.reject = null
  let service = await current(h, 'services', b.service.id)
  await h.command('service.save', { ...service, version: service.version, description: 'Repaired sales item' })
  const fixed = await h.command('qbo.sync', { kind: 'service', id: service.id }); assert.equal(fixed.phase, 'complete')
  // Changing today's settings cannot change the approved tax snapshot.
  const business = (await h.state()).business[0]
  await h.command('business.save', { ...business, taxSettings: { jurisdictions: [{ id: 'austin', name: 'Changed rate', rate: '20', zips: [], taxLabor: true }], defaultJurisdictionId: 'austin' } })
  await h.command('branch.save', { ...branch, version: (await current(h, 'branches', branch.id)).version, taxSettings: { jurisdictions: [{ id: 'county', name: 'Changed branch rate', rate: '25', zips: [], taxLabor: true }], defaultJurisdictionId: 'county' } })
  const posted = await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }); assert.equal(posted.phase, 'complete')
  const request = h.quickbooks.calls.find(r => r.entity === 'invoice' && r.body)
  assert.equal(request.body.TxnTaxDetail.TotalTax.toFixed(2), rev.totals.gst)
  assert.equal(request.body.CustomerRef.value, '13'); assert.equal(request.body.Line[0].SalesItemLineDetail.ItemRef.value, '20')
  assert.equal(request.body.TxnTaxDetail.TxnTaxCodeRef.value, '40'); assert.equal(request.body.ApplyTaxAfterDiscount, true)
  assert.equal(request.body.Line.at(-1).DetailType, 'DiscountLineDetail'); assert.equal(request.body.Line.at(-1).Amount.toFixed(2), rev.totals.discount.amount)
  assert.match(request.body.Line.at(-1).Description, /non-taxable \$30.30, taxable \$35.49/)
  assert.deepEqual(request.body.Line.slice(0, 2).map(l => l.SalesItemLineDetail.TaxCodeRef.value), ['TAX', 'NON'])
  const inv = await current(h, 'invoices', invoice.id)
  const payment = await h.command('payment.record', { invoiceId: inv.id, version: inv.version, amount: rev.totals.total, method: 'check', reference: 'Property manager check' })
  const sent = await h.command('qbo.sync', { kind: 'payment', id: payment.id }); assert.equal(sent.phase, 'complete')
  assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, posted.remoteId)
  await h.command('qbo.pull', { remoteId: sent.remoteId })
  assert.equal((await h.state()).payments.length, 1, 'reading our own payment never counts it twice')
  const refund = await h.command('payment.refund', { invoiceId: inv.id, version: inv.version, paymentId: payment.id, paymentVersion: (await current(h, 'payments', payment.id)).version, amount: rev.totals.total, reason: 'Full service refund' })
  assert.equal((await h.command('qbo.sync', { kind: 'payment', id: refund.id })).phase, 'complete')
  const refundRequest = h.quickbooks.calls.find(r => r.entity === 'refundreceipt' && r.body)
  assert.equal(refundRequest.body.TotalAmt.toFixed(2), rev.totals.total); assert.equal(refundRequest.body.TxnTaxDetail.TotalTax.toFixed(2), rev.totals.gst)
  assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-02T12:00:00Z' } })).status, 200)
  const before = h.quickbooks.calls.filter(r => r.body).length
  for (const [kind, id] of [['customer', b.customer.id], ['service', service.id], ['invoice', invoice.id], ['payment', payment.id], ['payment', refund.id]]) assert.equal((await h.command('qbo.sync', { kind, id })).phase, 'complete')
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, before)
  const originalCustomer = await current(h, 'customers', b.customer.id)
  for (const name of ['North Austin Management', originalCustomer.name]) {
    const record = await current(h, 'customers', b.customer.id)
    await h.command('customer.save', { ...record, name })
    assert.equal((await h.command('qbo.sync', { kind: 'customer', id: record.id })).phase, 'complete')
    assert.equal(h.quickbooks.records.get(['customer', '13'].join('/')).DisplayName, name)
  }
  const trail = await assertTrail(h, ['qbo.connected', 'qbo.mapped', 'qbo.configured', 'qbo.reserved', 'qbo.rejected', 'qbo.complete', 'qbo.replayed', 'qbo.paymentReplayed'])
  assert.ok(trail.activity.some(e => e.kind === 'qbo.complete' && e.summary.includes(posted.remoteId)))
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Bearer/)
  await b.office.run('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'FORBIDDEN' })
  await h.command('qbo.connect', { key: null })
  assert.equal(await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='quickbooks'").first('n'), 0)
  await assertTrail(h, ['qbo.disconnected'])
})

test('QuickBooks property sub-customers receive separate invoices and one parent payment settles both without replay or unknown-send duplicates', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h), second = await h.command('site.save', { customerId: b.customer.id, address: '28 Congress Avenue, Austin TX 78704', zip: '78704' })
  for (const [site, id] of [[b.site, '11'], [second, '12']]) {
    h.quickbooks.record('customer', { Id: id, SyncToken: '0', Active: true, Job: true, ParentRef: { value: '10' }, BillWithParent: true })
    await h.command('qbo.map', { kind: 'site', id: site.id, remoteId: id })
  }
  await h.command('qbo.confirmLinks', { confirm: true })
  const a = await qboInvoice(h, b), z = await qboInvoice(h, b, second, 'Second property')
  const pa = await h.command('qbo.sync', { kind: 'invoice', id: a.id }), pz = await h.command('qbo.sync', { kind: 'invoice', id: z.id })
  assert.deepEqual(h.quickbooks.calls.filter(r => r.entity === 'invoice' && r.body).map(r => r.body.CustomerRef.value), ['11', '12'])
  h.quickbooks.record('payment', { Id: '90', CustomerRef: { value: '10' }, TotalAmt: Number(a.revisions[0].totals.total) + Number(z.revisions[0].totals.total), UnappliedAmt: 0, Line: [a, z].map((inv, i) => ({ Amount: Number(inv.revisions[0].totals.total), LinkedTxn: [{ TxnId: [pa, pz][i].remoteId, TxnType: 'Invoice' }] })) })
  const pulled = await h.command('qbo.pull', { remoteId: '90' }); assert.equal(pulled.effects.length, 2)
  for (const [site, invoice] of [[b.site, a], [second, z]]) {
    const history = await read(h, `/api/glove/sites/${site.id}/history`)
    assert.ok(history.entries.some(e => e.kind === 'payment' && e.label.includes(`QuickBooks payment 90 for ${invoice.number}: $${invoice.revisions[0].totals.total}`)))
  }
  const live = await current(h, 'invoices', a.id)
  await h.command('payment.refund', { invoiceId: live.id, version: live.version, paymentId: pulled.id, paymentVersion: pulled.version, amount: '1.00', reason: 'Imported payment refund' }, { error: 'QBO_REFUND_STATE' })
  const balances = await read(h, '/api/glove/reports/receivables.json?asOf=2026-11-30'); assert.deepEqual(balances.customers, [])
  await h.command('qbo.pull', { remoteId: '90' }); assert.equal((await h.state()).payments.length, 1)
  const tax = await read(h, '/api/glove/reports/tax.json?from=2026-11-01&to=2026-11-30')
  assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), [a, z].reduce((n, inv) => n + Math.round(Number(inv.revisions[0].totals.gst) * 100), 0))
  await assertTrail(h, ['qbo.paymentImported'])
  h.quickbooks.uncertain = true
  const unknown = await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }); assert.equal(unknown.phase, 'unknown')
  const writes = h.quickbooks.calls.filter(r => r.body).length
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_UNCERTAIN' }); assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
  await assertTrail(h, ['qbo.unknown'])
  h.quickbooks.uncertain = false
  await h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, remoteId: '12' }, { error: 'QBO_RECONCILE' })
  const reconciled = await h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, remoteId: '10' })
  assert.equal(reconciled.phase, 'complete'); assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
  await assertTrail(h, ['qbo.reconciled'])
  // A different company requires fresh property links as well as parent and invoice review.
  const previousConnection = (await h.state()).business[0].qbo.connectionId
  await h.command('qbo.connect', { realmId: '456', key: 'synthetic-glove-902', mode: 'sandbox' })
  const newConnection = (await h.state()).business[0].qbo.connectionId
  assert.notEqual(newConnection, previousConnection)
  const beforeReview = h.quickbooks.calls.filter(r => r.body).length
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_REVIEW' })
  const review = JSON.parse((await h.command('qbo.discover', {})).review)
  assert.ok(review.proposals.every(p => p.group === 'unmatched'))
  for (const [kind, id, remoteId] of [['customer', b.customer.id, '110'], ['service', b.service.id, '120'], ['service', b.refrigerant.id, '121']]) {
    const entity = kind === 'service' ? 'item' : 'customer'
    const originalId = kind === 'service' ? remoteId.slice(1) : '10'
    const original = h.quickbooks.records.get([entity, originalId].join('/'))
    h.quickbooks.record(entity, { ...original, Id: remoteId }, '456')
    await h.command('qbo.map', { kind, id, remoteId })
  }
  for (const [invoice, ref, remoteId] of [[a, '111', '1501'], [z, '112', '1502']]) {
    h.quickbooks.record('invoice', { Id: remoteId, SyncToken: '0', DocNumber: invoice.number, CustomerRef: { value: ref }, TotalAmt: Number(invoice.revisions[0].totals.total), CurrencyRef: { value: 'USD' } }, '456')
  }
  const missing = await h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
  assert.deepEqual(missing.details.missing.filter(r => r.kind === 'sites').map(r => r.id).sort(), [b.site.id, second.id].sort())
  for (const [site, ref] of [[b.site, '111'], [second, '112']]) {
    h.quickbooks.record('customer', { Id: ref, SyncToken: '0', Active: true, Job: true, ParentRef: { value: '110' }, BillWithParent: true }, '456')
    await h.command('qbo.map', { kind: 'site', id: site.id, remoteId: ref })
  }
  for (const [invoice, remoteId] of [[a, '1501'], [z, '1502']]) await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId })
  await h.command('qbo.confirmLinks', { confirm: true })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, beforeReview, 'review and confirmation never write to either company')
  const confirmedSite = await current(h, 'sites', b.site.id)
  assert.equal(confirmedSite.qbo.connectionId, newConnection)
  assert.ok(confirmedSite.qbo.confirmedBy)
  await h.command('qbo.connect', { key: null })
  await h.command('qbo.connect', { realmId: '456', key: 'synthetic-glove-903', mode: 'sandbox' })
  assert.equal((await h.state()).business[0].qbo.connectionId, newConnection)
  assert.deepEqual((await current(h, 'sites', b.site.id)).qbo, confirmedSite.qbo)
  h.quickbooks.record('taxcode', { Id: '140', SyncToken: '0', Active: true, Name: 'Synthetic company tax' }, '456')
  await h.command('qbo.configure', { taxCodeRef: '140' })
  await h.command('qbo.sync', { kind: 'invoice', id: a.id }, { error: 'QBO_CORRECTION' })
  const payment = await h.command('payment.record', { invoiceId: a.id, version: (await current(h, 'invoices', a.id)).version, amount: '1.00', method: 'check', reference: 'Synthetic new company adjustment' })
  assert.equal((await h.command('qbo.sync', { kind: 'payment', id: payment.id })).phase, 'complete')
  await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  const newWrites = h.quickbooks.calls.slice().filter(r => r.realm === '456' && r.body)
  assert.equal(newWrites.length, 1)
  assert.equal(newWrites[0].body.CustomerRef.value, '110')
  assert.equal(newWrites[0].body.Line[0].LinkedTxn[0].TxnId, '1501')
  await assertTrail(h, ['qbo.connected', 'qbo.discovered', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.complete', 'qbo.replayed'])
})

test('QuickBooks first-post review refuses unconfirmed links and duplicate invoices; provider facts survive owner withdrawal without allowing another send', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h), invoice = await qboInvoice(h, b)
  await h.command('qbo.map', { kind: 'customer', id: b.customer.id, remoteId: '10' })
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_REVIEW' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  await h.command('qbo.confirmLinks', { confirm: true })
  h.quickbooks.record('invoice', { Id: '99', SyncToken: '0', DocNumber: invoice.number, CustomerRef: { value: '10' }, TotalAmt: Number(invoice.revisions[0].totals.total), CurrencyRef: { value: 'USD' } })
  await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'QBO_EXISTING' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '99' })
  await h.command('qbo.confirmLinks', { confirm: true })
  const inv = await current(h, 'invoices', invoice.id)
  const payment = await h.command('payment.record', { invoiceId: inv.id, version: inv.version, amount: invoice.revisions[0].totals.total, method: 'check', reference: 'Existing accounting invoice check' })
  await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, '99')
  assert.equal(h.quickbooks.calls.filter(r => r.entity === 'invoice' && r.body).length, 0)
  const alternate = await h.person('Second Owner', 'owner')
  h.quickbooks.beforeReply = async request => {
    if (request.entity !== 'customer' || !request.body) return
    h.quickbooks.beforeReply = null
    await h.command('role.set', { operatorId: alternate.id, role: 'viewer' })
  }
  const outcome = await alternate.run('qbo.sync', { kind: 'customer', id: b.customer.id })
  assert.equal(outcome.phase, 'complete')
  assert.equal((await h.state()).customers.find(c => c.id === b.customer.id).qboSync.remoteId, '10')
  await alternate.run('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  assert.ok(activity.events.some(e => e.kind === 'qbo.complete' && e.summary.includes('10')))
})

test('QuickBooks mapped fixed discount item and document discount preserve accepted taxable and non-taxable cents at the provider edge', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h)
  const discount = await h.command('service.save', { code: 'LOYALTY', name: 'First service discount', kind: 'discount', unitPrice: '-50.00', tax: 'FREE' })
  h.quickbooks.record('item', { Id: '22', SyncToken: '0', Active: true, Type: 'Service', IncomeAccountRef: { value: '30' } })
  await h.command('qbo.map', { kind: 'service', id: discount.id, remoteId: '22' })
  await h.command('qbo.confirmLinks', { confirm: true })
  const invoice = await qboInvoice(h, b, b.site, 'HVAC service', { kind: 'percent', value: '10', reason: 'Member discount' }, [{ description: 'Non-taxable service', serviceId: b.service.id, quantity: '1', unitPrice: '100.00', tax: 'FREE' }, { description: discount.name, serviceId: discount.id, quantity: '1', unitPrice: '-50.00', tax: 'FREE' }])
  const posted = await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }); assert.equal(posted.phase, 'complete')
  const payload = h.quickbooks.calls.find(r => r.entity === 'invoice' && r.body).body
  assert.equal(payload.Line[2].Amount, -50); assert.equal(payload.Line[2].SalesItemLineDetail.ItemRef.value, '22'); assert.equal(payload.Line[2].SalesItemLineDetail.TaxCodeRef.value, 'NON')
  assert.equal(payload.Line[3].DetailType, 'DiscountLineDetail'); assert.equal(payload.Line[3].Amount, 23.9)
  assert.equal(payload.TxnTaxDetail.TotalTax, 15.59)
  assert.deepEqual([invoice.revisions.at(-1).totals.gst, invoice.revisions.at(-1).totals.total], ['15.59', '230.69'])
})

test('QuickBooks rejection messages follow customer export and erasure without credentials or a surviving personal outbox payload', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h)
  h.quickbooks.reject = `Invalid customer ${b.customer.name}; synthetic-glove-901`
  const rejected = await h.command('qbo.sync', { kind: 'customer', id: b.customer.id })
  assert.match(rejected.message, /Invalid customer Cedar Property Management/); assert.doesNotMatch(rejected.message, /synthetic-glove-901/)
  const customer = await current(h, 'customers', b.customer.id)
  const exported = await h.command('privacy.export', { customerId: customer.id, version: customer.version })
  const custody = JSON.parse(exported.download)
  assert.equal(custody.records.customers[0].qboSync.message, rejected.message)
  assert.doesNotMatch(JSON.stringify(await read(h, '/api/glove/export')), /synthetic-glove-901/)
  h.quickbooks.beforeReply = async request => {
    if (request.entity !== 'customer' || !request.body) return
    h.quickbooks.beforeReply = null
    const live = await current(h, 'customers', customer.id)
    const preview = await h.command('privacy.preview', { customerId: live.id, version: live.version })
    await h.command('privacy.erase', { customerId: live.id, version: live.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  }
  const interrupted = await h.command('qbo.sync', { kind: 'customer', id: customer.id })
  assert.match(interrupted.message, /subject was erased/)
  assert.doesNotMatch(JSON.stringify(await read(h, '/api/glove/export')), /Cedar Property Management|accounts@cedar.example.test|120 Congress Avenue/)
  await h.command('qbo.sync', { kind: 'customer', id: customer.id }, { error: 'ERASED' })
})

test('QuickBooks company discovery proposes imported customer, item and original invoice links without a write or a partial company review', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const { quickbooksMoveIn } = await import('../fixtures/quickbooks-movein.mjs')
  const b = await quickbooksMoveIn(h)
  await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-901', mode: 'sandbox' })
  const discover = async () => JSON.parse((await h.command('qbo.discover', {})).review)
  const review = await discover(), customers = review.proposals.filter(p => p.kind === 'customer'), items = review.proposals.filter(p => p.kind === 'service'), invoices = review.proposals.filter(p => p.kind === 'invoice')
  assert.deepEqual(['matched', 'ambiguous', 'unmatched'].map(group => customers.filter(p => p.group === group).length), [47, 1, 2])
  assert.equal(customers.filter(p => p.rule === 'name-and-contact').length, 48)
  assert.equal(items.filter(p => p.group === 'matched').length, 20)
  assert.equal(items.filter(p => p.rule === 'sku').length, 10); assert.equal(items.filter(p => p.rule === 'name').length, 10)
  assert.equal(invoices.filter(p => p.group === 'matched').length, 47)
  assert.ok(review.untouched.customers.some(r => r.id === '101' && r.subCustomer))
  assert.equal(review.choices.customer.find(r => r.id === '48').phone, '5125550048')
  assert.equal(review.choices.invoice.find(r => r.id === '501').total, 108.25)
  assert.equal(review.choices.service.find(r => r.id === '200').name, b.services[0].name)
  assert.ok(review.choices.customer.find(r => r.id === '101').subCustomer)
  assert.doesNotMatch(JSON.stringify(review), /SyncToken|IncomeAccountRef|synthetic-glove-901/)
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  await h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
  const ambiguous = customers.find(p => p.group === 'ambiguous')
  assert.deepEqual(ambiguous.candidates.sort(), ['48', '99'])
  await h.command('qbo.map', { kind: 'customer', id: ambiguous.id, remoteId: '48' })
  assert.equal((await discover()).proposals.find(p => p.id === ambiguous.id).rule, 'verified-company-link')
  const customer = b.customers.find(r => r.source.id === 'synthetic-glove-client-1'), invoice = b.invoices.find(r => r.customerId === customer.id)
  await h.command('qbo.map', { kind: 'customer', id: customer.id, remoteId: '1' })
  await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '501' })
  assert.equal((await current(h, 'invoices', invoice.id)).qboSync.remoteId, '501', 'original number and total link despite partial opening balance')
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  // A same-name remote without the required contact is a clash, never an automatic link.
  h.quickbooks.record('customer', { Id: '102', SyncToken: '0', Active: true, DisplayName: 'Synthetic customer 49', PrimaryEmailAddr: { Address: 'different@example.test' } })
  const clash = (await discover()).proposals.find(p => p.id === b.customers.find(r => r.source.id === 'synthetic-glove-client-49').id)
  assert.equal(clash.group, 'unmatched'); assert.deepEqual(clash.nameClashes, ['102'])
  // Reading beyond one provider page must retain the last record and refuse overlapping pages.
  for (let i = 0; i < 1000; i++) h.quickbooks.record('customer', { Id: String(10000 + i), SyncToken: '0', Active: true, DisplayName: `Provider-only ${i}` })
  assert.ok((await discover()).untouched.customers.some(r => r.id === '10999'))
  assert.ok(h.quickbooks.calls.some(r => r.entity === 'query' && !r.body))
  const before = h.quickbooks.answer.bind(h.quickbooks)
  h.quickbooks.answer = async request => {
    const query = new URL(request.url).searchParams.get('query') ?? ''
    if (query.includes('FROM Customer') && query.includes('STARTPOSITION 1001')) return Response.json({ QueryResponse: { Customer: [{ Id: '1' }] } })
    return before(request)
  }
  await h.command('qbo.discover', {}, { error: 'QBO_DISCOVERY' })
  h.quickbooks.answer = before
  const office = await h.person('Synthetic office', 'office')
  const reads = h.quickbooks.calls.length
  await office.run('qbo.discover', {}, { error: 'FORBIDDEN' })
  assert.equal(h.quickbooks.calls.length, reads)
  const trail = await assertTrail(h, ['qbo.discovered', 'qbo.mapped'])
  assert.ok(trail.activity.some(e => e.kind === 'qbo.discovered'))
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901|Provider-only property/)
  const business = (await h.state()).business[0]
  assert.equal(business.qbo.review, undefined, 'remote names are not retained in business settings')
  const duplicate = await h.command('customer.save', { name: customer.name, email: customer.email })
  const collision = await discover()
  assert.equal(collision.proposals.find(p => p.id === duplicate.id).group, 'ambiguous')
  assert.equal(collision.proposals.find(p => p.id === customer.id).group, 'ambiguous')
  assert.equal(collision.proposals.find(p => p.id === invoice.id).group, 'unmatched', 'ambiguous customer never supplies a proposed invoice parent')
  await h.command('qbo.connect', { key: null })
  await h.command('qbo.connect', { realmId: 123, key: 'synthetic-glove-902', mode: 'sandbox' })
  assert.equal((await current(h, 'customers', customer.id)).qbo.connectionId, (await h.state()).business[0].qbo.connectionId)
  await h.command('qbo.connect', { realmId: '456', key: 'synthetic-glove-903', mode: 'sandbox' })
  assert.notEqual((await h.state()).business[0].qbo.connectionId, review.connectionId)
  const freshCompany = await discover()
  assert.ok(freshCompany.proposals.every(p => p.group === 'unmatched'), 'another company cannot reuse prior company facts or confirmations')
  await h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
})

test('QuickBooks reviewed migration creates only two explicitly approved unmatched customers, links old invoices and posts later money once with locked confirmed links', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const { quickbooksMoveIn } = await import('../fixtures/quickbooks-movein.mjs')
  const imported = await quickbooksMoveIn(h)
  await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-901', mode: 'sandbox' })
  const review = JSON.parse((await h.command('qbo.discover', {})).review)
  const reviewedCreation = async (row, extra = {}, opts = {}) => {
    const currentReview = JSON.parse((await h.command('qbo.discover', {})).review)
    return h.command('qbo.createCustomer', { id: row.id, version: row.version, confirm: true, reviewFingerprint: currentReview.fingerprint, ...extra }, opts)
  }
  const unmatched = review.proposals.filter(p => p.kind === 'customer' && p.group === 'unmatched')
  const first = await current(h, 'customers', unmatched[0].id)
  await h.command('qbo.createCustomer', { id: first.id, version: first.version }, { error: 'QBO_REVIEW' })
  await h.command('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'QBO_REVIEW' })
  await reviewedCreation(first, { reviewFingerprint: 'synthetic-glove-stale' }, { error: 'QBO_REVIEW' })
  const matched = review.proposals.find(p => p.kind === 'customer' && p.group === 'matched')
  await reviewedCreation(await current(h, 'customers', matched.id), {}, { error: 'QBO_REVIEW' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  // A provider name clash is refused again at the explicit creation door.
  h.quickbooks.record('customer', { Id: '102', SyncToken: '0', Active: true, DisplayName: first.name })
  await reviewedCreation(first, {}, { error: 'QBO_REVIEW' })
  h.quickbooks.records.delete(['customer', '102'].join('/'))
  for (const proposal of review.proposals.filter(p => p.kind === 'customer' && p.group !== 'unmatched')) await h.command('qbo.map', { kind: 'customer', id: proposal.id, remoteId: proposal.group === 'ambiguous' ? '48' : proposal.candidates[0] })
  for (const proposal of review.proposals.filter(p => p.kind === 'service')) await h.command('qbo.map', { kind: 'service', id: proposal.id, remoteId: proposal.candidates[0] })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  for (const proposal of unmatched) {
    let customer = await current(h, 'customers', proposal.id)
    const created = await reviewedCreation(customer)
    assert.equal(created.phase, 'complete')
    customer = await current(h, 'customers', proposal.id)
    assert.equal(customer.qbo.remoteId, created.remoteId)
    assert.equal(customer.qbo.confirmedBy, customer.qboCreate.approvedBy)
    await reviewedCreation(customer)
    assert.equal([...h.quickbooks.records.values()].filter(r => r.DisplayName === customer.name).length, 1)
  }
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 2)
  const resolved = JSON.parse((await h.command('qbo.discover', {})).review)
  for (const proposal of resolved.proposals.filter(p => p.kind === 'invoice')) {
    assert.equal(proposal.group, 'matched')
    await h.command('qbo.map', { kind: 'invoice', id: proposal.id, remoteId: proposal.candidates[0] })
  }
  await h.command('qbo.confirmLinks', { confirm: true })
  const invoice = await current(h, 'invoices', imported.invoices[0].id), customer = await current(h, 'customers', invoice.customerId)
  assert.ok(customer.qbo.confirmedAt); assert.equal(customer.qbo.confirmedBy, (await h.state()).business[0].qbo.linksConfirmedBy)
  const payment = await h.command('payment.record', { invoiceId: invoice.id, version: invoice.version, amount: '76.50', method: 'check', reference: 'Synthetic opening invoice payment' })
  const sent = await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  assert.equal(sent.phase, 'complete')
  assert.equal(h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body.Line[0].LinkedTxn[0].TxnId, invoice.qbo.remoteId)
  await h.command('qbo.sync', { kind: 'payment', id: payment.id })
  assert.equal(h.quickbooks.calls.filter(r => r.entity === 'payment' && r.body).length, 1)
  h.quickbooks.record('customer', { Id: '103', SyncToken: '0', Active: true, DisplayName: customer.name })
  await h.command('qbo.map', { kind: 'customer', id: customer.id, remoteId: '103' }, { error: 'QBO_LINK_USED' })
  await h.command('qbo.sync', { kind: 'service', id: imported.services[0].id })
  const afterItemUpdate = JSON.parse((await h.command('qbo.discover', {})).review)
  const retainedItem = afterItemUpdate.proposals.find(p => p.id === imported.services[0].id)
  assert.equal(retainedItem.group, 'matched'); assert.equal(retainedItem.rule, 'verified-company-link')
  assert.equal(retainedItem.candidates[0], (await current(h, 'services', imported.services[0].id)).qbo.remoteId)
  const original = h.quickbooks.records.get(`invoice/${invoice.qbo.remoteId}`)
  h.quickbooks.record('invoice', { ...original, Id: '999' })
  await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '999' }, { error: 'QBO_LINK_USED' })
  const techPerson = await h.person('Synthetic technician', 'technician')
  const priya = await h.command('technician.save', { name: 'Synthetic technician', operatorId: techPerson.id })
  const state = await h.state(), site = state.sites.find(r => r.customerId === customer.id), service = state.services[0]
  const business = state.business[0]
  await h.command('business.save', { ...business, taxSettings: { jurisdictions: [{ id: 'austin', name: 'Austin combined', rate: '8.25', zips: ['78704'], taxLabor: true }], defaultJurisdictionId: 'austin' } })
  h.quickbooks.record('taxcode', { Id: '40', SyncToken: '0', Name: 'Austin combined', Active: true })
  await h.command('qbo.configure', { taxCodeRef: '40' })
  const next = await qboInvoice(h, { customer, site, service, priya, priyaPerson: techPerson }, site, 'Next native service', { kind: 'percent', value: '10', reason: 'Synthetic customer discount' })
  const posted = await h.command('qbo.sync', { kind: 'invoice', id: next.id })
  assert.equal(posted.phase, 'complete')
  const writes = h.quickbooks.calls.filter(r => r.entity === 'invoice' && r.body)
  assert.equal(writes.length, 1, 'no moved-in invoice is recreated')
  assert.equal(writes[0].body.CustomerRef.value, customer.qbo.remoteId)
  assert.equal(writes[0].body.TxnTaxDetail.TotalTax.toFixed(2), next.revisions.at(-1).totals.gst)
  assert.equal(writes[0].body.Line.at(-1).Amount.toFixed(2), next.revisions.at(-1).totals.discount.amount)
  assert.equal(writes[0].body.ApplyTaxAfterDiscount, true)
  const trail = await assertTrail(h, ['qbo.discovered', 'qbo.creationApproved', 'qbo.complete', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.reserved', 'qbo.replayed'])
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-901/)
  // Definite refusals permit explicit repair; an uncertain creation never permits a second send.
  let extra = await h.command('customer.save', { name: 'Synthetic uncertain customer', email: 'synthetic-glove-uncertain@example.test' })
  h.quickbooks.reject = 'Synthetic provider refusal'
  const refused = await reviewedCreation(extra)
  assert.equal(refused.phase, 'rejected')
  h.quickbooks.reject = null; h.quickbooks.uncertain = true
  extra = await current(h, 'customers', extra.id)
  const unknown = await reviewedCreation(extra)
  assert.equal(unknown.phase, 'unknown')
  const creationWrites = h.quickbooks.calls.filter(r => r.body).length
  extra = await current(h, 'customers', extra.id)
  await reviewedCreation(extra, {}, { error: 'QBO_UNCERTAIN' })
  const remote = [...h.quickbooks.records.values()].find(r => r.DisplayName === extra.name)
  await h.command('qbo.map', { kind: 'customer', id: extra.id, remoteId: remote.Id }, { error: 'QBO_UNCERTAIN' })
  h.quickbooks.uncertain = false
  assert.equal((await h.command('qbo.reconcile', { kind: 'customer', id: extra.id, remoteId: remote.Id })).phase, 'complete')
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, creationWrites)
  assert.equal((await current(h, 'customers', extra.id)).qbo.remoteId, remote.Id)
  const office = await h.person('Synthetic office', 'office')
  const writesBefore = h.quickbooks.calls.filter(r => r.body).length
  await office.run('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'FORBIDDEN' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, writesBefore)
})

const tenant = '00000000-0000-4000-8000-000000000001'
const token = 'synthetic-glove-51'
const connect = async (h, selected = tenant) => h.command('xero.connect', { version: (await h.state()).business[0].version, tenant: selected, token })
const inspect = async (h, customerId) => {
  const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type: 'xero.discover', payload: { customerId } } })
  const result = await response.json(); assert.equal(result.ok, true, JSON.stringify(result))
  return JSON.parse(result.result.review)
}

test('Xero complete company reads and reviewed existing links preserve two property invoice identities without writes or restored authority', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD' })
  const second = await h.command('site.save', { customerId: b.customer.id, address: '28 Congress Avenue, Austin TX 78704' })
  const a = await qboInvoice(h, b), z = await qboInvoice(h, b, second, 'Second property')
  h.xero.data.Contacts = Array.from({ length: 201 }, (_, i) => ({ ContactID: `synthetic-glove-contact-${i}`, Name: `Synthetic ${i}`, ContactStatus: 'ACTIVE' }))
  h.xero.data.Invoices = Array.from({ length: 100 }, (_, i) => ({ InvoiceID: `synthetic-glove-invoice-${i}`, Type: 'ACCREC', Status: 'AUTHORISED' }))
  h.xero.data.Items = Array.from({ length: 201 }, (_, i) => ({ ItemID: `synthetic-glove-item-${i}`, Code: `S${i}` }))
  await connect(h)
  const start = h.xero.calls.length, review = await inspect(h, b.customer.id)
  assert.deepEqual(review.contacts.map(r => r.id), Array.from({ length: 201 }, (_, i) => `synthetic-glove-contact-${i}`))
  assert.deepEqual(review.invoices.map(r => r.id), Array.from({ length: 100 }, (_, i) => `synthetic-glove-invoice-${i}`))
  assert.equal(review.items.length, 201)
  const readCalls = h.xero.calls.slice(start)
  assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Contacts')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2', '3'])
  assert.deepEqual(readCalls.filter(r => r.path.endsWith('/Invoices')).map(r => new URLSearchParams(r.query).get('page')), ['1', '2'])
  assert.equal(readCalls.filter(r => r.path.endsWith('/Items')).length, 1)
  assert.ok(readCalls.every(r => r.method === 'GET' && r.tenant === tenant))
  h.xero.reply = request => {
    const url = new URL(request.url), resource = url.pathname.split('/').at(-1)
    const rows = h.xero.data[resource], page = Number(url.searchParams.get('page'))
    if (!page) return Response.json({ [resource]: rows })
    return Response.json({ [resource]: rows.slice((page - 1) * 100, page * 100), pagination: { page, pageSize: 100, pageCount: Math.ceil(rows.length / 100), itemCount: rows.length } })
  }
  assert.equal((await inspect(h, b.customer.id)).contacts.length, 201)
  h.xero.reply = request => { const resource = new URL(request.url).pathname.split('/').at(-1); return Response.json({ [resource]: h.xero.data[resource].slice(0, 100) }) }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.reply = request => {
    const url = new URL(request.url), resource = url.pathname.split('/').at(-1)
    if (resource !== 'Contacts') return Response.json({ [resource]: [] })
    const page = Number(url.searchParams.get('page'))
    return Response.json({ Contacts: h.xero.data.Contacts.slice((page - 1) * 100, page * 100), pagination: { page, pageSize: 100, pageCount: 3, itemCount: page === 1 ? 201 : 202 } })
  }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.reply = request => { const resource = new URL(request.url).pathname.split('/').at(-1); return Response.json({ [resource]: [] , pagination: { page: 1, pageSize: 100, pageCount: 1, itemCount: 1 } }) }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.reply = request => { const url = new URL(request.url), resource = url.pathname.split('/').at(-1); return Number(url.searchParams.get('page')) === 2 ? Response.json({}, { status: 429 }) : Response.json({ [resource]: h.xero.data[resource].slice(0, 100) }) }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
  h.xero.reply = null
  h.xero.data.Contacts = [{ ContactID: 'synthetic-glove-contact-1', Name: b.customer.name, ContactStatus: 'ACTIVE', BankAccountDetails: 'excluded bank detail' }, { ContactID: 'synthetic-glove-contact-2', Name: 'Other billing contact', ContactStatus: 'ACTIVE' }, { ContactID: 'synthetic-glove-archived', Name: 'Archived', ContactStatus: 'ARCHIVED' }]
  h.xero.data.Accounts = [{ AccountID: 'synthetic-glove-account-1', Code: '200', Type: 'REVENUE', Status: 'ACTIVE' }]
  h.xero.data.TaxRates = [{ TaxType: 'OUTPUT', Status: 'ACTIVE' }]
  h.xero.data.Items = [b.service, b.refrigerant].map((r, i) => ({ ItemID: `synthetic-glove-item-${i}`, Code: r.code, IsSold: true, PurchaseDetails: { UnitPrice: 'excluded purchasing amount' }, SalesDetails: { AccountCode: '200', TaxType: 'OUTPUT' } }))
  h.xero.data.Invoices = [a, z].map((r, i) => ({ InvoiceID: `synthetic-glove-invoice-${i}`, InvoiceNumber: r.number, Type: 'ACCREC', Status: 'AUTHORISED', Contact: { ContactID: 'synthetic-glove-contact-1' }, CurrencyCode: 'USD', Total: Number(r.revisions.at(-1).totals.total), AmountDue: 80, LineItems: [{ Description: 'excluded provider line' }] }))
  h.xero.data.Invoices.push({ InvoiceID: 'synthetic-glove-purchase', Type: 'ACCPAY', Status: 'AUTHORISED' })
  await h.command('xero.connect', { version: 0, tenant, token }, { error: 'STALE' })
  await connect(h)
  const inspected = await inspect(h, b.customer.id)
  assert.equal(inspected.contacts.length, 2); assert.equal(inspected.items.length, 2); assert.equal(inspected.invoices.length, 2)
  assert.equal(inspected.invoices[0].amountDue, 80)
  assert.ok(!JSON.stringify(inspected).includes('excluded'))
  const savedInspections = await h.db.prepare("SELECT result FROM glove_commands WHERE type='xero.inspect'").all()
  assert.ok(!JSON.stringify(savedInspections.results).includes(b.customer.name))
  await enableXeroPolicy(h)
  const map = async (kind, row, remoteId, opts = {}) => h.command('xero.map', { kind, id: row.id, version: (await current(h, { customer: 'customers', service: 'services', invoice: 'invoices' }[kind], row.id)).version, remoteId }, opts)
  const confirm = async (confirm = true) => h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm })
  await b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
  await b.office.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
  await b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
  await b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
  const limitedOwner = await h.person('Limited Owner', 'owner')
  await h.command('branch.limit', { operatorId: limitedOwner.id, branchId: 'main' })
  await limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'FORBIDDEN' })
  const issued = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type: 'token.issue', payload: { name: 'Synthetic Xero inspection', role: 'office' } } })
  const issuedBody = await issued.json()
  const refusedToken = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issuedBody.result.token}` }, body: { commandId: crypto.randomUUID(), type: 'xero.map', payload: { kind: 'customer', id: b.customer.id, remoteId: 'synthetic-glove-contact-1' } } })
  assert.equal(refusedToken.status, 403)
  await confirm().then(() => assert.fail('unmapped company cannot be confirmed'), e => assert.match(e.message, /XERO_REVIEW/))
  await map('invoice', a, 'synthetic-glove-invoice-0', { error: 'XERO_MAPPING' })
  await map('customer', b.customer, 'synthetic-glove-contact-1')
  const duplicate = await h.command('customer.save', { name: 'Second local customer' })
  await map('customer', duplicate, 'synthetic-glove-contact-1', { error: 'XERO_MAPPING' })
  await map('customer', b.customer, 'synthetic-glove-missing', { error: 'XERO_MAPPING' })
  h.xero.data.Contacts[0].ContactStatus = 'ARCHIVED'
  await map('customer', b.customer, 'synthetic-glove-contact-1', { error: 'XERO_MAPPING' })
  h.xero.data.Contacts[0].ContactStatus = 'ACTIVE'
  h.xero.data.Accounts[0].Type = 'BANK'
  await map('service', b.service, 'synthetic-glove-item-0', { error: 'XERO_MAPPING' })
  h.xero.data.Accounts[0].Type = 'REVENUE'
  for (const [i, service] of [b.service, b.refrigerant].entries()) await map('service', service, `synthetic-glove-item-${i}`)
  for (const [field, value] of [['Status', 'DRAFT'], ['Total', 0], ['CurrencyCode', 'NZD'], ['InvoiceNumber', 'Wrong'], ['Contact', { ContactID: 'synthetic-glove-contact-2' }]]) {
    const previous = h.xero.data.Invoices[0][field]; h.xero.data.Invoices[0][field] = value
    await map('invoice', a, 'synthetic-glove-invoice-0', { error: 'XERO_MAPPING' }); h.xero.data.Invoices[0][field] = previous
  }
  for (const [i, invoice] of [a, z].entries()) await map('invoice', invoice, `synthetic-glove-invoice-${i}`)
  await confirm(false).then(() => assert.fail('explicit review is required'), e => assert.match(e.message, /XERO_REVIEW/))
  const confirmed = await confirm(); assert.equal(confirmed.confirmed, true)
  const state = await h.state(), connection = state.business[0].xeroInspection.connectionId
  assert.deepEqual([a, z].map(r => state.invoices.find(i => i.id === r.id).xero.propertyId), [b.site.id, second.id])
  assert.ok([a, z].every(r => state.invoices.find(i => i.id === r.id).xero.contactId === 'synthetic-glove-contact-1'))
  assert.ok(state.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero.confirmedBy && i.xero.confirmedAt === '2026-11-01T12:00:00.000Z'))
  h.xero.data.Items[0].SalesDetails.TaxType = 'MISSING'
  await confirm().then(() => assert.fail('changed provider tax mapping must be refused'), e => assert.match(e.message, /XERO_MAPPING/))
  h.xero.data.Items[0].SalesDetails.TaxType = 'OUTPUT'
  await connect(h); assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
  await confirm()
  await map('customer', b.customer, 'synthetic-glove-contact-2')
  assert.ok((await h.state()).invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === null))
  await confirm().then(() => assert.fail('dependent links must be reviewed again'), e => assert.match(e.message, /XERO_REVIEW/))
  await map('customer', b.customer, 'synthetic-glove-contact-1')
  for (const [i, invoice] of [a, z].entries()) await map('invoice', invoice, `synthetic-glove-invoice-${i}`)
  const trail = await assertTrail(h, ['xero.connected', 'xero.mapped', 'xero.linksConfirmed'])
  assert.ok(trail.activity.some(e => e.kind === 'xero.mapped' && e.summary))
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|excluded bank detail/)
  assert.ok(!JSON.stringify(await h.state()).includes(token))
  assert.ok(!JSON.stringify(trail).includes(tenant))
  const mappedEvent = trail.exported.timeline.find(e => e.kind === 'xero.mapped' && e.subject_id === a.id)
  assert.equal(JSON.parse(mappedEvent.data).remoteId, 'synthetic-glove-invoice-0')
  assert.ok(h.xero.calls.length > 0 && h.xero.calls.every(c => c.method === 'GET'))
  assert.equal((await h.state()).payments.length, 0)
  const customer = await current(h, 'customers', b.customer.id)
  const exported = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type: 'privacy.export', payload: { customerId: customer.id, version: customer.version } } })
  const exportBody = await exported.json(); assert.ok(exportBody.result.download.includes('synthetic-glove-invoice-0'))
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  const erased = await h.state()
  assert.equal(erased.customers.find(r => r.id === customer.id).xero, undefined)
  assert.ok(erased.invoices.filter(i => [a.id, z.id].includes(i.id)).every(i => i.xero === undefined))
  await h.command('xero.map', { kind: 'customer', id: customer.id, version: customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'ERASED' })
  await connect(h, '00000000-0000-4000-8000-000000000002')
  assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
  h.xero.status = 401
  await h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_PROVIDER' })
  h.xero.status = 200
  await h.command('xero.connect', { version: (await h.state()).business[0].version, token: null })
  await h.command('xero.inspect', { customerId: duplicate.id }, { error: 'XERO_SETUP' })
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
  await connect(h)
  await confirm().then(() => assert.fail('new tenant requires fresh links'), e => assert.match(e.message, /XERO_REVIEW/))
  await h.db.prepare("DELETE FROM glove_provider_keys WHERE provider='xero'").run()
  const calls = h.xero.calls.length
  await h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm: true }, { error: 'XERO_SETUP' })
  assert.equal(h.xero.calls.length, calls)
})

test('Xero reviewed writes preserve frozen invoice cents and property references, repair refusals and reconcile uncertain sends without duplicate posts', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await xeroBusiness(h)
  await h.command('role.save', { name: 'Accounting delegate', permissions: ['xero.sync'] }, { error: 'INPUT' })
  await b.office.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
  await b.agent.run('xero.reconcile', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
  const limited = await h.person('Limited Owner', 'owner')
  await h.command('branch.limit', { operatorId: limited.id, branchId: 'main' })
  await limited.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
  assert.equal(h.xero.calls.filter(r => r.body).length, 0)
  await h.command('xero.map', { kind: 'service', id: b.service.id, version: (await current(h, 'services', b.service.id)).version, remoteId: 'synthetic-glove-item-0' })
  await xeroSync(h, 'customer', b.customer.id, { error: 'XERO_REVIEW' })
  assert.equal(h.xero.calls.filter(r => r.body).length, 0)
  await h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, confirm: true })
  const customerCommandId = crypto.randomUUID()
  const customerPayload = { kind: 'customer', id: b.customer.id, version: (await current(h, 'customers', b.customer.id)).version }
  const customer = await h.command('xero.sync', customerPayload, { commandId: customerCommandId }); assert.equal(customer.phase, 'complete')
  assert.equal((await h.command('xero.sync', customerPayload, { commandId: customerCommandId })).remoteId, customer.remoteId)
  assert.equal(h.xero.data.Contacts[0].Name, b.customer.name)
  h.xero.reject = `Income account is inactive ${token}`
  const rejected = await xeroSync(h, 'service', b.service.id)
  assert.equal(rejected.phase, 'rejected'); assert.match(rejected.message, /Income account is inactive/); assert.ok(!rejected.message.includes(token))
  h.xero.reject = null
  const service = await current(h, 'services', b.service.id)
  await h.command('service.save', { ...service, description: 'Repaired sales item' })
  assert.equal((await xeroSync(h, 'service', b.service.id)).phase, 'complete')
  assert.equal(h.xero.data.Items[0].Description, 'Repaired sales item')
  const invoice = await qboInvoice(h, b, b.site, 'HVAC service', { kind: 'percent', value: '30', reason: 'Loyalty' }, [{ description: 'Non-taxable maintenance', serviceId: b.service.id, quantity: '1', unitPrice: '30.30', tax: 'FREE' }])
  assert.deepEqual([invoice.revisions.at(-1).totals.total, invoice.revisions.at(-1).totals.gst], ['166.17', '12.66'])
  const draft = await h.command('invoice.revise', { invoiceId: invoice.id, version: invoice.version, lines: invoice.revisions.at(-1).lines.map(line => ({ ...line, description: line.description + ' reviewed' })), discount: invoice.revisions.at(-1).discount, reason: 'Review before first Xero post' })
  const beforeDraft = h.xero.calls.filter(r => r.body).length
  await xeroSync(h, 'invoice', invoice.id, { error: 'NOT_APPROVED' })
  assert.equal(h.xero.calls.filter(r => r.body).length, beforeDraft)
  await h.command('invoice.approve', { invoiceId: invoice.id, version: draft.version, revision: draft.revisions.at(-1).n })
  const settings = (await h.state()).business[0]
  await h.command('business.save', { ...settings, taxSettings: { jurisdictions: [{ id: 'changed', name: 'Changed', rate: '20', zips: [], taxLabor: true }], defaultJurisdictionId: 'changed' } })
  const posted = await xeroSync(h, 'invoice', invoice.id); assert.equal(posted.phase, 'complete')
  const transport = h.xero.calls.find(r => r.body?.Invoices).body.Invoices[0]
  assert.equal(transport.Contact.ContactID, 'synthetic-glove-contact-1')
  assert.equal(transport.Reference, `Property ${b.site.address}`)
  assert.equal(transport.LineItems[0].Description, invoice.revisions.at(-1).lines[0].description + ' reviewed')
  assert.deepEqual(transport.LineItems.map(l => [l.LineAmount, l.DiscountAmount ?? 0, l.TaxAmount]), [[153.51, 35.49, 12.66], [0, 30.3, 0]])
  assert.deepEqual([transport.Date, transport.DueDate], ['2026-11-01', '2026-11-15'])
  assert.equal(h.xero.data.Invoices[0].Total, 166.17)
  const writes = h.xero.calls.filter(r => r.body).length
  for (const [kind, id] of [['customer', b.customer.id], ['service', b.service.id], ['invoice', invoice.id]]) assert.equal((await xeroSync(h, kind, id)).phase, 'complete')
  assert.equal(h.xero.calls.filter(r => r.body).length, writes)
  assert.ok(h.xero.calls.filter(r => r.body).every(r => r.idempotencyKey))
  const live = await current(h, 'customers', b.customer.id)
  h.xero.uncertain = true
  await h.command('customer.save', { ...live, name: 'Updated billing customer' })
  const unknown = await xeroSync(h, 'customer', b.customer.id); assert.equal(unknown.phase, 'unknown')
  await xeroSync(h, 'customer', b.customer.id, { error: 'XERO_UNCERTAIN' })
  h.xero.uncertain = false
  const before = h.xero.calls.filter(r => r.body).length
  await xeroSync(h, 'customer', b.customer.id, { payload: { remoteId: 'synthetic-glove-missing' }, error: 'XERO_RECONCILE' }, 'xero.reconcile')
  const recovered = await xeroSync(h, 'customer', b.customer.id, { payload: { remoteId: 'synthetic-glove-contact-1' } }, 'xero.reconcile')
  assert.equal(recovered.phase, 'complete'); assert.equal(h.xero.calls.filter(r => r.body).length, before)
  await h.command('xero.map', { kind: 'customer', id: b.customer.id, version: (await current(h, 'customers', b.customer.id)).version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_LOCKED' })
  const trail = await assertTrail(h, ['xero.reserved', 'xero.complete', 'xero.rejected', 'xero.unknown', 'xero.reconciled', 'xero.replayed'])
  assert.ok(trail.activity.some(e => e.kind === 'xero.complete' && e.summary.includes(posted.remoteId)))
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer|00000000-0000-4000-8000-000000000001/)
  const c = await current(h, 'customers', b.customer.id), preview = await h.command('privacy.preview', { customerId: c.id, version: c.version })
  await h.command('privacy.erase', { customerId: c.id, version: c.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id IN (?,?)').bind(c.id, invoice.id).first('n'), 0)
  await xeroSync(h, 'invoice', invoice.id, { error: 'ERASED' })
  const beforeReplay = h.xero.calls.length
  await h.command('xero.sync', customerPayload, { commandId: customerCommandId, error: 'ERASED' })
  assert.equal(h.xero.calls.length, beforeReplay)
  const saved = await h.db.prepare('SELECT result FROM glove_commands WHERE id=?').bind(customerCommandId).first('result')
  assert.doesNotMatch(saved, /synthetic-glove-contact-1|operationId|connectionId/)
})

test('Xero one parent remittance reads exact two-property applications once and refuses unsafe or changed allocations', async t => {
  const h = await installation({ at: '2026-11-30T12:00:00Z' }); t.after(() => h.close())
  const b = await xeroBusiness(h), second = await h.command('site.save', { customerId: b.customer.id, address: '28 Congress Avenue, Austin TX 78704' })
  const a = await qboInvoice(h, b), z = await qboInvoice(h, b, second, 'Second property')
  const posted = [await xeroSync(h, 'invoice', a.id), await xeroSync(h, 'invoice', z.id)]
  assert.ok(posted.every(p => p.phase === 'complete'))
  h.xero.data.Payments = posted.map((p, i) => ({ PaymentID: `synthetic-glove-payment-${i}`, Invoice: { InvoiceID: p.remoteId, Contact: { ContactID: 'synthetic-glove-contact-1' }, CurrencyCode: 'USD' }, Amount: 204.59, Date: '2026-11-30', Reference: 'Parent remittance', Account: { AccountID: 'synthetic-glove-bank' }, PaymentType: 'ACCRECPAYMENT', Status: 'AUTHORISED', IsReconciled: false }))
  const paymentIds = h.xero.data.Payments.map(p => p.PaymentID)
  await b.office.run('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'FORBIDDEN' })
  const first = h.xero.data.Payments[0]
  for (const [field, bad] of [['Amount', 300], ['PaymentType', 'ACCPAYPAYMENT'], ['Status', 'DELETED'], ['Date', '2026-11-02']]) {
    const old = first[field]; first[field] = bad
    await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' }); first[field] = old
  }
  first.Invoice.CurrencyCode = 'NZD'; await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' }); first.Invoice.CurrencyCode = 'USD'
  first.Invoice.Contact.ContactID = 'synthetic-glove-other'; await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_MAPPING' }); first.Invoice.Contact.ContactID = 'synthetic-glove-contact-1'
  for (const date of ['not-a-date', '2026-02-30', '2026-11-30T14:00:00Z']) {
    for (const remote of h.xero.data.Payments) remote.Date = date
    await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' })
  }
  first.Date = '2026-11-30'
  h.xero.data.Payments[1].Date = '/Date(1795996800000+0000)/'
  assert.equal((await h.state()).payments.length, 0)
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-12-01T12:00:00Z' } })
  const payment = await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 })
  assert.equal(payment.amount, '409.18'); assert.equal(payment.xeroImported.bankReconciled, false); assert.equal(payment.fee, null)
  assert.deepEqual(payment.effects.map(e => [e.invoiceId, e.amountCents, e.taxTotalAmount]), [[a.id, 20459, '204.59'], [z.id, 20459, '204.59']])
  await h.command('xero.pull', { paymentIds: [...paymentIds].reverse(), reference: 'Parent remittance', amountCents: 40918 }); assert.equal((await h.state()).payments.length, 1)
  await h.command('xero.pull', { paymentIds: [paymentIds[0]], reference: 'Parent remittance', amountCents: 20459 }, { error: 'XERO_PAYMENT_CHANGED' })
  first.Amount = 1; await h.command('xero.pull', { paymentIds, reference: 'Parent remittance', amountCents: 40918 }, { error: 'XERO_PAYMENT' }); first.Amount = 204.59
    const tax = await read(h, '/api/glove/reports/tax.json?from=2026-11-01&to=2026-11-30')
  assert.equal(tax.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
  const receiptDay = await read(h, '/api/glove/reports/tax.json?from=2026-11-30&to=2026-11-30')
  assert.equal(receiptDay.jurisdictions.reduce((n, j) => n + Math.round(Number(j.tax) * 100), 0), 3118)
  const importDay = await read(h, '/api/glove/reports/tax.json?from=2026-12-01&to=2026-12-01')
  assert.deepEqual(importDay.jurisdictions, [])
  const receivables = await read(h, '/api/glove/reports/receivables.json?asOf=2026-11-30'); assert.deepEqual(receivables.customers, [])
  assert.equal(payment.createdAt, '2026-12-01T12:00:00.000Z')
  for (const [site, invoice] of [[b.site, a], [second, z]]) {
    const entries = (await read(h, `/api/glove/sites/${site.id}/history`)).entries
    assert.ok(entries.some(e => e.kind === 'payment' && e.label === `Xero payment Parent remittance for ${invoice.number}: $204.59`))
  }
  await h.command('payment.refund', { invoiceId: a.id, version: (await current(h, 'invoices', a.id)).version, paymentId: payment.id, paymentVersion: payment.version, amount: '1.00', reason: 'Xero refund' }, { error: 'XERO_REFUND_STATE' })
  await h.command('payment.receipt', { paymentId: payment.id, version: payment.version }, { error: 'XERO_RECEIPT_STATE' })
  for (const path of ['/api/glove/state', '/api/glove/export']) {
    const staff = await h.request(path, { as: b.office.cookie })
    assert.equal(staff.status, 200)
    assert.doesNotMatch(await staff.text(), /synthetic-glove-payment-|synthetic-glove-invoices-|bankReconciled|xeroSync|"xero":/)
  }
  const trail = await assertTrail(h, ['xero.paymentImported', 'xero.paymentReplayed'])
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer/)
})

test('Xero durable reservation refuses a concurrent send and a different tenant, then retains same-tenant recovery after disconnect', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await xeroBusiness(h)
  let release, entered
  const ready = new Promise(resolve => { entered = resolve }), pause = new Promise(resolve => { release = resolve })
  h.xero.beforeReply = async request => { if (request.method === 'POST') { entered(); await pause } }
  const pending = xeroSync(h, 'customer', b.customer.id)
  await ready
  try {
    await xeroSync(h, 'customer', b.customer.id, { error: 'XERO_UNCERTAIN' })
    await connect(h, '00000000-0000-4000-8000-000000000002').then(() => assert.fail('unresolved tenant must stay pinned'), e => assert.match(e.message, /XERO_TENANT/))
    assert.equal(h.xero.calls.filter(r => r.body).length, 1)
  } finally { release() }
  assert.equal((await pending).phase, 'complete')
  const connectionId = (await h.state()).business[0].xeroInspection.connectionId
  await h.command('xero.connect', { version: (await h.state()).business[0].version, token: null })
  await xeroSync(h, 'customer', b.customer.id, { error: 'XERO_SETUP' })
  await connect(h)
  assert.equal((await h.state()).business[0].xeroInspection.connectionId, connectionId)
  assert.equal((await xeroSync(h, 'customer', b.customer.id)).phase, 'complete')
  assert.equal(h.xero.calls.filter(r => r.body).length, 1)
  const invoice = await qboInvoice(h, b)
  h.xero.beforeReply = async request => {
    if (request.method === 'GET' && new URL(request.url).pathname.endsWith('/Invoices')) await enableXeroPolicy(h, 'block')
  }
  const denied = await xeroSync(h, 'invoice', invoice.id)
  assert.deepEqual([denied.riskClass, denied.decision, denied.allowed], ['provider-write', 'block', false])
  assert.equal(h.xero.calls.filter(r => r.body).length, 1, 'policy withdrawal before send makes no new provider write')
  const trail = await assertTrail(h, ['company.actionPolicy'])
  assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'block'))
})

test('Xero records an authorized in-flight provider fact after Owner withdrawal and refuses the next send', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await xeroBusiness(h), other = await h.person('Second Owner', 'owner')
  let changed = false
  h.xero.beforeReply = async request => {
    if (request.method !== 'POST' || changed) return
    changed = true
    await h.command('role.set', { operatorId: other.id, role: 'viewer' })
  }
  const outcome = await other.run('xero.sync', { kind: 'customer', id: b.customer.id, version: (await current(h, 'customers', b.customer.id)).version })
  assert.equal(outcome.phase, 'complete')
  await other.run('xero.sync', { kind: 'customer', id: b.customer.id }, { error: 'FORBIDDEN' })
  assert.equal(h.xero.calls.filter(r => r.body).length, 1)
  const state = await h.state()
  assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync.remoteId, 'synthetic-glove-contact-1')
})

test('Xero erasure during a provider response discards late personal outcomes and durable reservations', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await xeroBusiness(h)
  let erased = false
  h.xero.beforeReply = async request => {
    if (request.method !== 'POST' || erased) return
    erased = true
    const customer = await current(h, 'customers', b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, fingerprint: preview.fingerprint, confirm: 'ERASE' })
  }
  const outcome = await xeroSync(h, 'customer', b.customer.id)
  assert.equal(outcome.phase, 'unknown'); assert.equal(outcome.remoteId, undefined)
  const state = await h.state()
  assert.equal(state.customers.find(c => c.id === b.customer.id).xeroSync, undefined)
  assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id=?').bind(b.customer.id).first('n'), 0)
  const exported = await read(h, '/api/glove/export')
  assert.ok(!JSON.stringify(exported).includes(b.customer.name))
})

test('Xero owner inspects current contacts, items and sales invoices without writes, retained payloads or revived provider access', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const command = h.command.bind(h)
  h.command = async (type, payload, options) => {
    if (type === 'xero.map') {
      const collection = { customer: 'customers', service: 'services', invoice: 'invoices' }[payload.kind]
      payload = { version: (await current(h, collection, payload.id)).version, confirm: true, ...payload }
    }
    if (type === 'xero.confirmLinks') {
      const state = await h.state()
      const hasLinks = state.customers.some(row => row.xeroLink?.connectionId === state.business[0].xeroInspection?.connectionId)
      let review = null
      if (hasLinks && options?.error !== 'XERO_MAPPING') {
        const discovered = await command('xero.discover', { customerId: state.customers[0].id })
        review = JSON.parse(discovered.review).linkReview
      }
      payload = { version: (await h.state()).business[0].version, fingerprint: review?.fingerprint, ...payload }
    }
    return command(type, payload, options)
  }
  const b = await quickbooksBusiness(h)
  const invoice = await qboInvoice(h, b)
  const tenant = '00000000-0000-4000-8000-000000000001', token = 'synthetic-glove-1'
  h.xero.data.Contacts = [{ ContactID: 'synthetic-glove-contact-1', Name: 'Synthetic Customer', ContactStatus: 'ACTIVE', EmailAddress: 'synthetic@example.test', BankAccountDetails: 'excluded bank detail' }, { ContactID: 'synthetic-glove-contact-2', Name: 'Archived', ContactStatus: 'ARCHIVED' }, { ContactID: 'synthetic-glove-contact-3', Name: 'Erasure requested', ContactStatus: 'GDPRREQUEST' }, { ContactID: 'synthetic-glove-contact-4', Name: 'Unknown status' }]
  h.xero.data.Items = [{ ItemID: 'synthetic-glove-item-1', Code: 'SERVICE', Name: 'Service', PurchaseDetails: { UnitPrice: 999 } }]
  h.xero.data.Invoices = [{ InvoiceID: 'synthetic-glove-invoice-1', InvoiceNumber: 'INV-1', Type: 'ACCREC', Contact: { ContactID: 'synthetic-glove-contact-1' }, CurrencyCode: 'USD', Total: 120, AmountDue: 80, Status: 'AUTHORISED', LineItems: [{ Description: 'excluded line payload' }] }, { InvoiceID: 'synthetic-glove-invoice-2', Type: 'ACCPAY', Status: 'AUTHORISED' }]
  const connect = () => h.command('xero.connect', { version: 0, tenant, token })
  await connect().then(() => assert.fail('stale connect must fail'), e => assert.match(e.message, /STALE/))
  await b.agent.run('xero.connect', { tenant, token }, { error: 'FORBIDDEN' })
  await b.office.run('xero.inspect', { customerId: b.customer.id }, { error: 'FORBIDDEN' })
  const connected = await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token })
  assert.equal(connected.mode, 'read-only')
  const connection = (await h.state()).business[0].xeroInspection.connectionId
  const response = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type: 'xero.inspect', payload: { customerId: b.customer.id } } })
  const result = await response.json()
  assert.equal(result.ok, true)
  const review = JSON.parse(result.result.review)
  assert.deepEqual(review.contacts, [{ id: 'synthetic-glove-contact-1', name: 'Synthetic Customer', email: 'synthetic@example.test' }])
  assert.equal(review.items.length, 1); assert.equal(review.invoices.length, 1)
  assert.equal(review.invoices[0].amountDue, 80)
  assert.ok(!JSON.stringify(review).includes('excluded'))
  assert.ok(h.xero.calls.every(c => c.method === 'GET' && c.tenant === tenant && c.authorization === `Bearer ${token}`))
  const trail = await assertTrail(h, ['xero.connected', 'xero.inspected'])
  for (const body of [await h.state(), trail]) {
    const serialized = JSON.stringify(body)
    assert.ok(!serialized.includes(tenant)); assert.ok(!serialized.includes(token)); assert.ok(!serialized.includes('excluded bank detail'))
  }
  const commands = await h.db.prepare("SELECT result FROM glove_commands WHERE type='xero.inspect'").all()
  assert.ok(!JSON.stringify(commands.results).includes('synthetic@example.test'), 'inspection bodies are not saved command outcomes')
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token: 'synthetic-glove-2' })
  assert.equal((await h.state()).business[0].xeroInspection.connectionId, connection)
  assert.equal(h.xero.calls.at(-1).authorization, 'Bearer synthetic-glove-2', 'replacement uses the distinct new token')
  const inspectedEvent = trail.activity.find(e => e.kind === 'xero.inspected')
  assert.equal(inspectedEvent.actorRole, 'owner'); assert.equal(inspectedEvent.subjectId, b.customer.id)
  h.xero.status = 401
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
  h.xero.status = 200
  h.xero.data.Contacts = Array.from({ length: 100 }, (_, i) => ({ ContactID: String(i), Name: 'synthetic-glove' }))
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.data.Contacts = Array.from({ length: 101 }, (_, i) => ({ ContactID: `synthetic-glove-list-${i}`, Name: 'synthetic-glove', ContactStatus: 'ACTIVE' }))
  const paginated = JSON.parse((await h.command('xero.discover', { customerId: b.customer.id })).review)
  assert.deepEqual(paginated.contacts.map(row => row.id), Array.from({ length: 101 }, (_, i) => `synthetic-glove-list-${i}`))
  assert.ok(h.xero.calls.some(call => call.path.endsWith('/Contacts') && call.page === '2'))
  h.xero.repeatPage = true
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.repeatPage = false; h.xero.failPage = 2
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
  h.xero.failPage = null
  const contactId = '00000000-0000-4000-8000-000000000010'
  h.xero.data.Contacts = [{ ContactID: contactId, Name: 'Synthetic Customer', ContactStatus: 'ACTIVE' }]
  const duplicate = await h.command('customer.save', { name: 'Synthetic other customer' })
  const map = () => h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId })
  const beforeMap = h.xero.calls.length
  await b.office.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
  await b.agent.run('xero.confirmLinks', { confirm: true }, { error: 'FORBIDDEN' })
  const limitedOwner = await h.person('Synthetic limited owner', 'owner')
  await h.command('branch.limit', { operatorId: limitedOwner.id, branchId: 'main' })
  await limitedOwner.run('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'FORBIDDEN' })
  const issued = await h.command('token.issue', { name: 'Synthetic integration', role: 'office' })
  const refusedToken = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${issued.token}` }, body: { commandId: crypto.randomUUID(), type: 'xero.confirmLinks', payload: { confirm: true } } })
  assert.equal(refusedToken.status, 403)
  assert.equal(h.xero.calls.length, beforeMap)
  for (const status of ['ARCHIVED', 'GDPRREQUEST', undefined, 'UNKNOWN']) {
    h.xero.data.Contacts[0].ContactStatus = status
    await h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
    assert.equal((await current(h, 'customers', b.customer.id)).xeroLink, undefined)
  }
  h.xero.data.Contacts[0].ContactStatus = 'ACTIVE'
  await map()
  assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, contactId)
  await h.command('xero.map', { kind: 'customer', id: duplicate.id, remoteId: contactId }, { error: 'XERO_MAPPING' })
  await h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
  const duplicateContactId = '00000000-0000-4000-8000-000000000011'
  h.xero.data.Contacts.push({ ContactID: duplicateContactId, Name: 'Synthetic other customer', ContactStatus: 'ACTIVE' })
  await h.command('xero.map', { kind: 'customer', id: duplicate.id, remoteId: duplicateContactId })
  h.xero.data.Accounts = [{ AccountID: 'income', Code: '200', Type: 'REVENUE', Status: 'ACTIVE' }]
  h.xero.data.TaxRates = [{ TaxType: 'OUTPUT', Status: 'ACTIVE', CanApplyToRevenue: true, EffectiveRate: 8.25 }]
  h.xero.data.Items = [b.service, b.refrigerant].map((service, i) => ({ ItemID: `00000000-0000-4000-8000-00000000002${i}`, Code: service.code, IsSold: true, SalesDetails: { AccountCode: '200', TaxType: 'OUTPUT' } }))
  for (const [i, service] of [b.service, b.refrigerant].entries()) await h.command('xero.map', { kind: 'service', id: service.id, remoteId: h.xero.data.Items[i].ItemID })
  const invoiceId = '00000000-0000-4000-8000-000000000030'
  const providerInvoice = { InvoiceID: invoiceId, Type: 'ACCREC', Status: 'AUTHORISED', CurrencyCode: 'USD', Contact: { ContactID: contactId }, InvoiceNumber: invoice.number, Total: Number(invoice.revisions.at(-1).totals.total) }
  h.xero.data.Invoices = [providerInvoice]
  for (const change of [{ Total: 1 }, { CurrencyCode: 'AUD' }, { InvoiceNumber: 'OTHER' }, { Contact: { ContactID: '00000000-0000-4000-8000-000000000099' } }, { Status: 'DRAFT' }, { Type: 'ACCPAY' }]) {
    h.xero.data.Invoices = [{ ...providerInvoice, ...change }]
    await h.command('xero.map', { kind: 'invoice', id: invoice.id, remoteId: invoiceId }, { error: 'XERO_MAPPING' })
  }
  h.xero.data.Invoices = [providerInvoice]
  await h.command('xero.map', { kind: 'invoice', id: invoice.id, remoteId: invoiceId })
  for (const status of ['GDPRREQUEST', 'ARCHIVED']) {
    h.xero.data.Contacts[0].ContactStatus = status
    await h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_MAPPING' })
    assert.ok(!(await h.state()).business[0].xeroInspection.linksConfirmedAt)
  }
  h.xero.data.Contacts[0].ContactStatus = 'ACTIVE'
  assert.equal((await h.command('xero.confirmLinks', { confirm: true })).confirmed, true)
  const linked = await current(h, 'customers', b.customer.id)
  assert.equal(linked.xeroLink.confirmedBy, inspectedEvent.actorId)
  assert.equal(linked.xeroLink.confirmedAt, '2026-11-01T12:00:00.000Z')
  assert.equal((await current(h, 'invoices', invoice.id)).xeroLink.remoteId, invoiceId)
  const mappingTrail = await assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])
  assert.ok(mappingTrail.activity.some(e => e.kind === 'xero.mapped' && e.subjectId === b.customer.id && e.summary.includes(contactId)))
  assert.ok(h.xero.calls.every(c => c.method === 'GET'), 'mapping and confirmation never post to Xero')
  const officeState = await b.office.state()
  assert.equal(officeState.customers.find(row => row.id === b.customer.id).xeroLink, undefined)
  assert.ok(!officeState.events.some(event => event.kind.startsWith('xero.')))
  const officeExport = await (await h.request('/api/glove/export', { as: b.office.cookie })).json()
  assert.equal(officeExport.invoices.find(row => row.id === invoice.id).xeroLink, undefined)
  assert.ok(!officeExport.timeline.some(event => event.kind.startsWith('xero.')))

  await h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId })
  assert.equal((await h.state()).business[0].xeroInspection.linksConfirmedAt, null)
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token: 'synthetic-glove-3' })
  assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.connectionId, (await h.state()).business[0].xeroInspection.connectionId)
  const otherTenant = '00000000-0000-4000-8000-000000000002'
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant: otherTenant, token: 'synthetic-glove-4' })
  assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
  await h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_REVIEW' })
  h.xero.data.Contacts = []
  await h.command('xero.connect', { version: (await h.state()).business[0].version, token: null })
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token })
  await h.db.prepare("DELETE FROM glove_provider_keys WHERE provider='xero'").run()
  const calls = h.xero.calls.length
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
  await h.command('xero.map', { kind: 'customer', id: b.customer.id, remoteId: contactId }, { error: 'XERO_SETUP' })
  await h.command('xero.confirmLinks', { confirm: true }, { error: 'XERO_SETUP' })
  assert.equal(h.xero.calls.length, calls, 'restored domain history without provider credentials grants no read access')
})
