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
  const changed = await current(h, 'customers', b.customer.id)
  await h.command('customer.save', { ...changed, name: 'North Austin Accounts' })
  // Only the provider response is interrupted: its write exists while the
  // application's durable operation still says sending.
  const answer = h.quickbooks.answer.bind(h.quickbooks)
  let release, entered, held = false
  const responseHeld = new Promise(resolve => { release = resolve }), started = new Promise(resolve => { entered = resolve })
  h.quickbooks.answer = async request => {
    const response = await answer(request)
    if (!held && request.method === 'POST' && new URL(request.url).pathname.endsWith('/customer')) {
      held = true; entered(); await responseHeld
      return new Response('Synthetic interrupted provider response', { status: 503 })
    }
    return response
  }
  const interrupted = h.command('qbo.sync', { kind: 'customer', id: b.customer.id })
  let recovered
  try {
    await started
    const pending = await current(h, 'customers', b.customer.id), writes = h.quickbooks.calls.filter(r => r.body).length
    assert.equal((await h.db.prepare('SELECT phase FROM glove_qbo_operations WHERE id=?').bind(pending.qboSync.operationId).first()).phase, 'sending')
    const recovery = { kind: 'customer', id: pending.id, version: pending.version, remoteId: '13' }
    await b.office.run('qbo.reconcile', recovery, { error: 'FORBIDDEN' })
    await h.command('qbo.sync', { kind: 'customer', id: pending.id }, { error: 'QBO_UNCERTAIN' })
    await h.command('qbo.reconcile', { ...recovery, remoteId: '10' }, { error: 'QBO_RECONCILE' })
    recovered = await h.command('qbo.reconcile', recovery)
    assert.equal(recovered.phase, 'complete'); assert.ok(recovered.reconciledBy)
    assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes, 'interrupted-send recovery only reads the existing reference')
  } finally { release(); await interrupted }
  h.quickbooks.answer = answer
  assert.deepEqual((await current(h, 'customers', b.customer.id)).qboSync, recovered, 'a delayed uncertain response cannot overwrite Owner reconciliation')
  assert.equal((await h.db.prepare('SELECT phase FROM glove_qbo_operations WHERE id=?').bind(recovered.operationId).first()).phase, 'complete')
  const recoveredWrites = h.quickbooks.calls.filter(r => r.body).length
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, recoveredWrites)
  const recoveredTrail = await assertTrail(h, ['qbo.reconciled', 'qbo.lateOutcome'])
  assert.ok(recoveredTrail.activity.some(e => e.kind === 'qbo.lateOutcome' && e.summary.includes('verified reference 13 retained')))
  assert.doesNotMatch(JSON.stringify(recoveredTrail), /synthetic-glove-901|Bearer/)
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
  const legacyPayment = await h.command('payment.record', { invoiceId: a.id, version: (await current(h, 'invoices', a.id)).version, amount: '1.00', method: 'check', reference: 'Prior company adjustment' })
  const legacyOutcome = await h.command('qbo.sync', { kind: 'payment', id: legacyPayment.id })
  const legacyBody = h.quickbooks.calls.find(r => r.entity === 'payment' && r.body).body
  const previousConnection = (await h.state()).business[0].qbo.connectionId
  h.quickbooks.uncertain = true
  const unknown = await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }); assert.equal(unknown.phase, 'unknown')
  const writes = h.quickbooks.calls.filter(r => r.body).length
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_UNCERTAIN' }); assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
  await assertTrail(h, ['qbo.unknown'])
  h.quickbooks.uncertain = false
  const unresolvedCustomer = await current(h, 'customers', b.customer.id)
  await h.command('qbo.connect', { realmId: '456', key: 'synthetic-glove-902', mode: 'sandbox' })
  const newConnection = (await h.state()).business[0].qbo.connectionId
  for (const [kind, id, remoteId] of [['customer', b.customer.id, '110'], ['invoice', a.id, '1501']]) await h.command('qbo.map', { kind, id, remoteId }, { error: 'QBO_UNCERTAIN' })
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_UNCERTAIN' })
  await h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, version: unresolvedCustomer.version, remoteId: '10' }, { error: 'QBO_RECONCILE' })
  assert.deepEqual((await current(h, 'customers', b.customer.id)).qboSync, unresolvedCustomer.qboSync)
  assert.equal((await current(h, 'invoices', a.id)).qboSync.remoteId, pa.remoteId)
  await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-904', mode: 'sandbox' })
  assert.equal((await h.state()).business[0].qbo.connectionId, previousConnection, 'reconnecting the original company recovers its operation identity')
  await h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, version: unresolvedCustomer.version, remoteId: '12' }, { error: 'QBO_RECONCILE' })
  const reconciled = await h.command('qbo.reconcile', { kind: 'customer', id: b.customer.id, version: unresolvedCustomer.version, remoteId: '10' })
  assert.equal(reconciled.phase, 'complete'); assert.equal(h.quickbooks.calls.filter(r => r.body).length, writes)
  await assertTrail(h, ['qbo.reconciled'])
  // A different company requires fresh property links as well as parent and invoice review.
  await h.command('qbo.connect', { realmId: '456', key: 'synthetic-glove-902', mode: 'sandbox' })
  assert.equal((await h.state()).business[0].qbo.connectionId, newConnection)
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
  const legacy = await current(h, 'payments', legacyPayment.id)
  await h.command('qbo.reconcile', { kind: 'payment', id: legacy.id, version: legacy.version, remoteId: '190' }, { error: 'QBO_REVIEW' })
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
  const existingPayment = { ...legacyBody, Id: '190', CustomerRef: { value: '110' }, Line: [{ ...legacyBody.Line[0], LinkedTxn: [{ TxnId: '1501', TxnType: 'Invoice' }] }] }
  const paymentFacts = await current(h, 'payments', legacy.id)
  const moneyBefore = (await h.state()).payments.map(({ id, amount, effects }) => ({ id, amount, effects }))
  const paymentArgs = { kind: 'payment', id: legacy.id, version: paymentFacts.version, remoteId: '190' }
  await h.command('qbo.sync', { kind: 'payment', id: legacy.id }, { error: 'QBO_MAPPING' })
  await h.command('qbo.reconcile', { ...paymentArgs, version: paymentFacts.version - 1 }, { error: 'STALE' })
  const callsBeforeRefusal = h.quickbooks.calls.length
  await b.office.run('qbo.reconcile', paymentArgs, { error: 'FORBIDDEN' })
  assert.equal(h.quickbooks.calls.length, callsBeforeRefusal)
  h.quickbooks.record('payment', { ...existingPayment, TotalAmt: 2 }, '456')
  await h.command('qbo.reconcile', paymentArgs, { error: 'QBO_RECONCILE' })
  h.quickbooks.record('payment', { ...existingPayment, Line: [{ ...existingPayment.Line[0], LinkedTxn: [{ TxnId: '1502', TxnType: 'Invoice' }] }] }, '456')
  await h.command('qbo.reconcile', paymentArgs, { error: 'QBO_RECONCILE' })
  h.quickbooks.record('payment', existingPayment, '456')
  const migrated = await h.command('qbo.reconcile', paymentArgs)
  assert.equal(migrated.remoteId, '190'); assert.equal(migrated.connectionId, newConnection)
  assert.equal(migrated.previousConnectionId, previousConnection); assert.equal(migrated.previousRemoteId, legacyOutcome.remoteId)
  const migratedPayment = await current(h, 'payments', legacy.id)
  assert.deepEqual(migratedPayment.qboSyncHistory, [legacyOutcome])
  assert.equal((await h.db.prepare('SELECT phase FROM glove_qbo_operations WHERE id=?').bind(legacyOutcome.operationId).first()).phase, 'complete')
  await h.command('qbo.reconcile', { ...paymentArgs, version: migratedPayment.version })
  await h.command('qbo.sync', { kind: 'payment', id: legacy.id })
  await h.command('qbo.pull', { remoteId: '190' })
  assert.deepEqual((await h.state()).payments.map(({ id, amount, effects }) => ({ id, amount, effects })), moneyBefore)
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, beforeReview, 'migration reconciliation, replay and readback never post another payment')
  await h.command('qbo.map', { kind: 'invoice', id: a.id, remoteId: '1999' }, { error: 'QBO_LINK_USED' })
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
  const trail = await assertTrail(h, ['qbo.connected', 'qbo.discovered', 'qbo.mapped', 'qbo.linksConfirmed', 'qbo.complete', 'qbo.replayed', 'qbo.reconciled'])
  assert.ok(trail.activity.some(e => e.kind === 'qbo.reconciled' && e.summary.includes(`payment 190 in company 456; previous company payment ${legacyOutcome.remoteId} retained`)))
  assert.ok(trail.exported.timeline.some(e => e.kind === 'qbo.reconciled' && JSON.parse(e.data).previousRemoteId === legacyOutcome.remoteId && JSON.parse(e.data).remoteId === '190'))
  const exported = await read(h, '/api/glove/export')
  const exportedPayment = exported.payments.find(r => r.id === legacy.id)
  assert.deepEqual(exportedPayment.qboSyncHistory, [legacyOutcome])
  assert.equal(exportedPayment.qboSync.remoteId, '190')
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-90[1-4]|Bearer/)
  assert.doesNotMatch(JSON.stringify(trail.exported.timeline.filter(e => e.kind === 'qbo.reconciled')), /PaymentRefNum|LinkedTxn/)
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
  assert.equal((await h.command('qbo.reconcile', { kind: 'customer', id: extra.id, version: (await current(h, 'customers', extra.id)).version, remoteId: remote.Id })).phase, 'complete')
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, creationWrites)
  assert.equal((await current(h, 'customers', extra.id)).qbo.remoteId, remote.Id)
  const office = await h.person('Synthetic office', 'office')
  const writesBefore = h.quickbooks.calls.filter(r => r.body).length
  await office.run('qbo.createCustomer', { id: first.id, version: first.version, confirm: true }, { error: 'FORBIDDEN' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, writesBefore)
})

test('Xero owner inspects current contacts, items and sales invoices without writes, retained payloads or revived provider access', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h)
  const tenant = '00000000-0000-4000-8000-000000000001', token = 'synthetic-glove-1'
  h.xero.data.Contacts = [{ ContactID: 'synthetic-glove-contact-1', Name: 'Synthetic Customer', EmailAddress: 'synthetic@example.test', BankAccountDetails: 'excluded bank detail' }, { ContactID: 'synthetic-glove-contact-2', Name: 'Archived', ContactStatus: 'ARCHIVED' }]
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
  assert.equal(review.contacts.length, 1); assert.equal(review.items.length, 1); assert.equal(review.invoices.length, 1)
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
  h.xero.status = 401
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
  h.xero.status = 200
  h.xero.data.Contacts = Array.from({ length: 100 }, (_, i) => ({ ContactID: String(i), Name: 'synthetic-glove' }))
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.data.Contacts = []
  await h.command('xero.connect', { version: (await h.state()).business[0].version, token: null })
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
  assert.equal((await h.db.prepare("SELECT count(*) AS n FROM glove_provider_keys WHERE provider='xero'").first()).n, 0)
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token })
  await h.db.prepare("DELETE FROM glove_provider_keys WHERE provider='xero'").run()
  const calls = h.xero.calls.length
  await h.command('xero.inspect', { customerId: b.customer.id }, { error: 'XERO_SETUP' })
  assert.equal(h.xero.calls.length, calls, 'restored domain history without provider credentials grants no read access')
})

test('LEDGER-004 Owner authorizes an Intuit app once, rotates private tokens on explicit use and reviews production as a separate company', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await quickbooksBusiness(h), originalConnection = (await h.state()).business[0].qbo.connectionId
  const calls = [], answer = h.quickbooks.answer.bind(h.quickbooks)
  let failure = false
  h.quickbooks.answer = async request => {
    if (new URL(request.url).href !== 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer') return answer(request)
    const fields = Object.fromEntries(new URLSearchParams(await request.text()))
    calls.push(fields)
    assert.equal(request.headers.get('authorization'), `Basic ${btoa('synthetic-glove-61:synthetic-glove-62')}`)
    if (failure) return new Response('synthetic-glove-63', { status: 503 })
    return Response.json({ token_type: 'bearer', access_token: `synthetic-glove-${70 + calls.length}`, refresh_token: `synthetic-glove-${80 + calls.length}`, expires_in: fields.grant_type === 'authorization_code' ? 120 : 3600, x_refresh_token_expires_in: 864000 })
  }
  const configure = async mode => h.command('qbo.connect', { version: (await h.state()).business[0].version, confirm: true, oauth: { mode, clientId: 'synthetic-glove-61', clientSecret: 'synthetic-glove-62' } })
  const begin = async (cookie = h.owner()) => {
    const response = await h.mf.dispatchFetch(h.origin + '/api/glove/qbo/authorize', { method: 'POST', redirect: 'manual', headers: { origin: h.origin, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: 'confirm=yes' })
    return response
  }
  const callback = (state, extra = {}, as) => h.request('/api/glove/qbo/callback?' + new URLSearchParams({ state, code: 'synthetic-glove-64', realmId: '123', ...extra }), as ? { as } : {})
  await b.office.run('qbo.connect', { oauth: { mode: 'production' } }, { error: 'FORBIDDEN' })
  await configure('sandbox')
  assert.equal((await h.state()).qboStatus.appConfigured, true)
  const denied = await begin(b.office.cookie); assert.equal(denied.status, 403)
  const started = await begin(), location = new URL(started.headers.get('location'))
  assert.equal(started.status, 303); assert.equal(location.origin + location.pathname, 'https://appcenter.intuit.com/connect/oauth2')
  assert.equal(location.searchParams.get('scope'), 'com.intuit.quickbooks.accounting')
  const state = location.searchParams.get('state')
  const peer = await h.person('Synthetic Owner', 'owner')
  assert.match((await callback(state, {}, peer.cookie)).headers.get('location'), /authorization-refused/)
  assert.equal(calls.length, 0)
  assert.match((await callback(state + 'x')).headers.get('location'), /authorization-refused/)
  const connected = await callback(state); assert.match(connected.headers.get('location'), /qbo=authorized/)
  assert.equal(calls.length, 1); assert.equal(calls[0].redirect_uri, h.origin + '/api/glove/qbo/callback')
  assert.equal((await h.state()).business[0].qbo.connectionId, originalConnection)
  assert.ok((await h.state()).business[0].qbo.linksConfirmedAt)
  assert.match((await callback(state)).headers.get('location'), /authorization-refused/); assert.equal(calls.length, 1)
  await h.command('qbo.discover', {}); assert.equal(calls.length, 1)
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-01T12:03:00Z' } })
  assert.equal((await h.state()).qboStatus.state, 'refresh-required')
  await h.command('qbo.discover', {})
  assert.equal(calls.length, 2); assert.equal(calls[1].grant_type, 'refresh_token'); assert.equal(calls[1].refresh_token, 'synthetic-glove-81')
  await h.command('qbo.discover', {}); assert.equal(calls.length, 2)
  const trail = await assertTrail(h, ['qbo.appConfigured', 'qbo.authorizationStarted', 'qbo.authorized', 'qbo.tokenRefreshed'])
  const privateRows = await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks-oauth'").first('value')
  assert.ok(privateRows.includes('synthetic-glove-82'))
  const commandResults = (await h.db.prepare('SELECT result FROM glove_commands').all()).results
  for (const secret of ['synthetic-glove-61', 'synthetic-glove-62', 'synthetic-glove-64', 'synthetic-glove-71', 'synthetic-glove-82', state]) {
    assert.ok(!JSON.stringify(trail).includes(secret)); assert.ok(!JSON.stringify(commandResults).includes(secret))
  }
  const expired = new URL((await begin()).headers.get('location')).searchParams.get('state')
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-01T12:14:00Z' } })
  assert.match((await callback(expired)).headers.get('location'), /authorization-refused/)
  assert.equal(calls.length, 2)
  await configure('production')
  const productionState = new URL((await begin()).headers.get('location')).searchParams.get('state')
  assert.match((await callback(productionState)).headers.get('location'), /qbo=authorized/)
  const production = (await h.state()).business[0].qbo
  assert.equal(production.mode, 'production'); assert.notEqual(production.connectionId, originalConnection); assert.equal(production.linksConfirmedAt, null)
  await h.command('qbo.sync', { kind: 'customer', id: b.customer.id }, { error: 'QBO_REVIEW' })
  assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0, 'authorization and discovery never post accounting records')
  await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-01T12:17:00Z' } })
  failure = true
  await h.command('qbo.discover', {}, { error: 'QBO_AUTH' })
  const failedCalls = calls.length
  await h.command('qbo.discover', {}, { error: 'QBO_AUTH' }); assert.equal(calls.length, failedCalls, 'an uncertain token rotation requires explicit reconnection')
  assert.equal((await h.state()).qboStatus.state, 'reconnect')
  await h.command('qbo.connect', { key: null })
  assert.equal((await h.state()).qboStatus.state, 'disconnected')
  assert.ok(!JSON.parse(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks-oauth'").first('value')).tokens)
  await configure('sandbox')
  const withdrawnState = new URL((await begin(peer.cookie)).headers.get('location')).searchParams.get('state')
  failure = false
  const previousEdge = h.quickbooks.answer.bind(h.quickbooks)
  let releaseToken, tokenEntered
  const tokenHeld = new Promise(resolve => { releaseToken = resolve }), entered = new Promise(resolve => { tokenEntered = resolve })
  h.quickbooks.answer = async request => {
    if (request.url === 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer') { tokenEntered(); await tokenHeld }
    return previousEdge(request)
  }
  const authorizing = callback(withdrawnState, {}, peer.cookie)
  try {
    await entered
    await h.command('role.set', { operatorId: peer.id, role: 'viewer' })
    releaseToken()
    assert.match((await authorizing).headers.get('location'), /authorization-failed/)
    assert.equal((await h.state()).business[0].qbo, null, 'lost Owner authority cannot commit a company authorization')
    assert.ok(!JSON.parse(await h.db.prepare("SELECT value FROM glove_provider_keys WHERE provider='quickbooks-oauth'").first('value')).tokens, 'late token response confers no retained provider authority')
    assert.equal(h.quickbooks.calls.filter(r => r.body).length, 0)
  } finally { releaseToken(); await authorizing }
})
