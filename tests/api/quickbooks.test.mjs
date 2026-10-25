import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, assertTrail } from './harness.mjs'
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
