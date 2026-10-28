import { qboInvoice } from '../fixtures/quickbooks-business.mjs'
import { xeroBusiness, xeroSync } from '../fixtures/xero-business.mjs'
import { enableXeroPolicy } from '../fixtures/xero-business.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, assertTrail } from './harness.mjs'

const tenant = '00000000-0000-4000-8000-000000000001', token = 'synthetic-glove-931'
const current = async (h, kind, id) => (await h.state())[kind].find(r => r.id === id)
const connect = async h => h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token })
const discover = async (h, b) => JSON.parse((await h.command('xero.discover', { customerId: b.customer.id })).review)
const map = async (h, kind, id, remoteId, extra = {}) => h.command('xero.map', { kind, id, version: (await current(h, kind === 'customer' ? 'customers' : 'services', id)).version, remoteId, confirm: true, ...extra })
function records(h) {
  h.xero.data.Contacts = [{ ContactID: 'synthetic-glove-contact-1', ContactStatus: 'ACTIVE', Name: 'Synthetic Billing', EmailAddress: 'synthetic-glove-931@example.test', BankAccountDetails: 'excluded-bank' }]
  h.xero.data.Items = ['1', '2'].map(n => ({ ItemID: `synthetic-glove-item-${n}`, Code: `SERVICE-${n}`, IsSold: true, SalesDetails: { AccountCode: '200', TaxType: 'OUTPUT' } }))
  h.xero.data.Accounts = [{ AccountID: 'synthetic-glove-account-1', Code: '200', Type: 'REVENUE', Status: 'ACTIVE', BankAccountNumber: 'excluded-bank' }]
  h.xero.data.TaxRates = [{ TaxType: 'OUTPUT', Status: 'ACTIVE', CanApplyToRevenue: true, EffectiveRate: 8.25 }]
}

test('Xero Owner discovers every page, reviews verified existing links and preserves authority and customer privacy without accounting writes', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD' })
  records(h)
  h.xero.data.Contacts = Array.from({ length: 201 }, (_, n) => ({ ContactID: `synthetic-glove-contact-${n}`, Name: `Contact ${n}`, ContactStatus: n === 1 ? 'ARCHIVED' : 'ACTIVE' }))
  h.xero.data.Invoices = Array.from({ length: 101 }, (_, n) => ({ InvoiceID: `synthetic-glove-invoice-${n}`, InvoiceNumber: `INV-${n}`, Type: 'ACCREC', Total: n + 1, AmountDue: n, CurrencyCode: 'USD', Status: 'AUTHORISED', Contact: { ContactID: 'synthetic-glove-contact-200' }, LineItems: [{ Description: 'excluded-lines' }] }))
  h.xero.data.Items = Array.from({ length: 101 }, (_, n) => ({ ItemID: `synthetic-glove-item-${n}`, Code: `SERVICE-${n}` }))
  await connect(h)
  const discovery = await discover(h, b)
  assert.deepEqual(discovery.contacts.map(c => c.id), Array.from({ length: 201 }, (_, n) => `synthetic-glove-contact-${n}`).filter(id => id !== 'synthetic-glove-contact-1'))
  assert.deepEqual(discovery.invoices.map(i => [i.id, i.total, i.amountDue]), Array.from({ length: 101 }, (_, n) => [`synthetic-glove-invoice-${n}`, n + 1, n]))
  assert.equal(discovery.items.length, 101); assert.equal(discovery.items.at(-1).id, 'synthetic-glove-item-100')
  assert.ok(h.xero.calls.some(c => c.path.endsWith('/Contacts') && c.query === '?page=3&pageSize=100'))
  assert.ok(h.xero.calls.some(c => c.path.endsWith('/Invoices') && c.query === '?page=2&pageSize=100'))
  assert.ok(h.xero.calls.filter(c => c.path.endsWith('/Items')).every(c => c.query === ''))
  assert.doesNotMatch(JSON.stringify(discovery), /excluded-/)
  // A repeated page must fail instead of silently losing or duplicating contacts.
  h.xero.pages.Contacts = [h.xero.data.Contacts.slice(0, 100), h.xero.data.Contacts.slice(0, 100)]
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.pages = {}
  h.xero.reply = request => {
    const u = new URL(request.url), resource = u.pathname.split('/').at(-1), page = Number(u.searchParams.get('page') || 1)
    if (resource === 'Contacts' && page === 2) return Response.json({}, { status: 429 })
    return Response.json({ [resource]: u.searchParams.has('page') ? h.xero.data[resource].slice((page - 1) * 100, page * 100) : h.xero.data[resource] })
  }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_PROVIDER' })
  h.xero.reply = request => {
    const resource = new URL(request.url).pathname.split('/').at(-1)
    return Response.json({ [resource]: resource === 'Contacts' ? [{ Name: 'Missing identity' }] : h.xero.data[resource] })
  }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  h.xero.reply = null
  h.xero.data.Contacts = h.xero.data.Contacts.slice(0, 100)
  h.xero.reply = request => {
    const resource = new URL(request.url).pathname.split('/').at(-1)
    if (resource === 'Contacts') return Response.json({ Contacts: h.xero.data.Contacts, pagination: { page: 1, pageSize: 100, pageCount: 1, itemCount: 101 } })
    return Response.json({ [resource]: h.xero.data[resource] })
  }
  await h.command('xero.discover', { customerId: b.customer.id }, { error: 'XERO_LIMIT' })
  assert.ok(h.xero.calls.every(c => c.method === 'GET'))
  const saved = await h.db.prepare("SELECT result FROM glove_commands WHERE type='xero.discover'").all()
  assert.doesNotMatch(JSON.stringify(saved.results), /Contact 200|INV-100|SERVICE-100/)
  await assertTrail(h, ['xero.discovered'])

  // Repair discovery, then explicitly map and review this company's existing records.
  h.xero.reply = null; records(h); await connect(h)
  const confirm = async (fingerprint, error) => h.command('xero.confirmLinks', { version: (await h.state()).business[0].version, fingerprint, confirm: true }, error ? { error } : {})
  await confirm((await discover(h, b)).linkReview.fingerprint, 'XERO_REVIEW')
  await h.command('xero.map', { kind: 'customer', id: b.customer.id, version: b.customer.version, remoteId: 'synthetic-glove-contact-1' }, { error: 'XERO_REVIEW' })
  h.xero.data.Contacts[0].ContactStatus = 'ARCHIVED'
  await map(h, 'customer', b.customer.id, 'synthetic-glove-contact-1').then(() => assert.fail('archived contact'), e => assert.match(e.message, /XERO_MAPPING/))
  h.xero.data.Contacts[0].ContactStatus = 'ACTIVE'
  await map(h, 'customer', b.customer.id, 'synthetic-glove-contact-1')
  await map(h, 'service', b.service.id, 'synthetic-glove-item-1')
  h.xero.data.Accounts[0].Status = 'ARCHIVED'
  await map(h, 'service', b.refrigerant.id, 'synthetic-glove-item-2').then(() => assert.fail('inactive income account'), e => assert.match(e.message, /XERO_MAPPING/))
  h.xero.data.Accounts[0].Status = 'ACTIVE'
  delete h.xero.data.Items[1].SalesDetails.AccountCode
  await map(h, 'service', b.refrigerant.id, 'synthetic-glove-item-2').then(() => assert.fail('missing income mapping'), e => assert.match(e.message, /XERO_MAPPING/))
  h.xero.data.Items[1].SalesDetails.AccountCode = '200'
  h.xero.data.TaxRates[0].CanApplyToRevenue = false
  await map(h, 'service', b.refrigerant.id, 'synthetic-glove-item-2').then(() => assert.fail('non-revenue tax'), e => assert.match(e.message, /XERO_MAPPING/))
  h.xero.data.TaxRates[0].CanApplyToRevenue = true
  await map(h, 'service', b.refrigerant.id, 'synthetic-glove-item-1').then(() => assert.fail('duplicate link'), e => assert.match(e.message, /XERO_MAPPING/))
  await map(h, 'service', b.refrigerant.id, 'synthetic-glove-item-2')
  let review = (await discover(h, b)).linkReview
  assert.deepEqual(review.missing, []); assert.deepEqual(review.links.map(l => [l.kind, l.remoteId]).sort((a, b) => a[1].localeCompare(b[1])), [['customer', 'synthetic-glove-contact-1'], ['service', 'synthetic-glove-item-1'], ['service', 'synthetic-glove-item-2']])
  assert.deepEqual(review.links.filter(l => l.kind === 'service').map(l => [l.accountCode, l.taxType, l.taxRate]), [['200', 'OUTPUT', 8.25], ['200', 'OUTPUT', 8.25]])
  h.xero.data.Contacts[0].Name = 'Changed provider billing identity'
  await confirm(review.fingerprint, 'XERO_REVIEW')
  review = (await discover(h, b)).linkReview
  const local = await current(h, 'customers', b.customer.id)
  await h.command('customer.save', { ...local, name: 'Changed local customer' })
  await confirm(review.fingerprint, 'XERO_REVIEW')
  review = (await discover(h, b)).linkReview
  assert.equal((await confirm(review.fingerprint)).reviewed, true)
  assert.equal((await h.state()).business[0].xeroInspection.linkReview.fingerprint, review.fingerprint)
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant, token: 'synthetic-glove-932' })
  assert.deepEqual((await discover(h, b)).linkReview.missing, [], 'same tenant retains local links')
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant: '00000000-0000-4000-8000-000000000002', token })
  assert.deepEqual((await discover(h, b)).linkReview.missing.map(r => r.kind), ['customer', 'service', 'service'])
  await confirm(review.fingerprint, 'XERO_REVIEW')
  assert.ok(h.xero.calls.every(c => c.method === 'GET'))
  await assertTrail(h, ['xero.mapped', 'xero.linksReviewed'])

  // The same reviewed links retain their authority and custody boundaries.
  records(h); await connect(h)
  const owner = await h.person('Synthetic limited owner', 'owner')
  await h.command('branch.limit', { operatorId: owner.id, branchId: 'main' })
  await h.command('role.save', { name: 'Synthetic provider manager', permissions: ['xero.map'] }, { error: 'INPUT' })
  const customRole = await h.command('role.save', { name: 'Synthetic reader', permissions: ['customer.save', 'export.read', 'reports.read'] })
  const custom = await h.person('Synthetic custom', `custom:${customRole.id}`)
  const issued = await h.command('token.issue', { name: 'Synthetic integration', role: 'office' })
  const types = ['xero.discover', 'xero.map', 'xero.confirmLinks']
  const callsBeforeRefusals = h.xero.calls.length
  for (const type of types) {
    for (const person of [b.office, b.agent, owner, custom]) await person.run(type, {}, { error: 'FORBIDDEN' })
    const res = await h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${issued.token}` }, body: { commandId: crypto.randomUUID(), type, payload: {} } })
    assert.equal(res.status, 403)
    const signedOut = await h.request('/api/glove/commands', { as: '', method: 'POST', body: { commandId: crypto.randomUUID(), type, payload: {} } })
    assert.equal(signedOut.status, 401)
  }
  assert.equal(h.xero.calls.length, callsBeforeRefusals)
  await map(h, 'customer', b.customer.id, 'synthetic-glove-contact-1')
  await map(h, 'service', b.service.id, 'synthetic-glove-item-1')
  const customer = await current(h, 'customers', b.customer.id)
  const result = await b.office.run('customer.save', { ...customer, name: 'Staff edit' })
  assert.equal(result.xeroLink, undefined)
  const stale = await b.office.run('customer.save', { ...customer }, { error: 'STALE' })
  assert.doesNotMatch(JSON.stringify(stale), /xeroLink|synthetic-glove-contact-1/)
  for (const person of [b.office, owner, custom]) for (const path of ['/api/glove/state', '/api/glove/activity', '/api/glove/export']) {
    const res = await h.request(path, { as: person.cookie }); assert.equal(res.status, 200)
    assert.doesNotMatch(await res.text(), /synthetic-glove-contact-1|synthetic-glove-item-1|xeroLink|xeroInspection|xero\.mapped/)
  }
  const trail = await assertTrail(h, ['xero.mapped'])
  assert.ok(trail.exported.timeline.some(e => e.kind === 'xero.mapped' && e.data.includes('synthetic-glove-contact-1')))
  assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-931|excluded-bank/)
  const live = await current(h, 'customers', b.customer.id)
  const download = JSON.parse((await h.command('privacy.export', { customerId: live.id, version: live.version })).download)
  assert.equal(download.records.customers[0].xeroLink.remoteId, 'synthetic-glove-contact-1')
  const preview = await h.command('privacy.preview', { customerId: live.id, version: live.version })
  await h.command('privacy.erase', { customerId: live.id, version: live.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.equal((await current(h, 'customers', live.id)).xeroLink, undefined)
  assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-contact-1/)
  await h.command('xero.map', { kind: 'customer', id: live.id, version: live.version, remoteId: 'synthetic-glove-contact-1', confirm: true }, { error: 'ERASED' })
  await h.db.prepare("DELETE FROM glove_provider_keys WHERE provider='xero'").run()
  const beforeMissingCredentials = h.xero.calls.length
  await h.command('xero.discover', { customerId: live.id }, { error: 'XERO_SETUP' })
  assert.equal(h.xero.calls.length, beforeMissingCredentials, 'retained links never recreate installation credentials')
})


test('Xero company policy defaults to no effects and isolates allow, review, approve and block decisions', async t => {
  const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
  const b = await business(h, { currency: 'USD' }); records(h); await connect(h)
  const connection = (await h.state()).business[0].xeroInspection.connectionId
  const before = await h.state(), calls = h.xero.calls.length
  const actions = ['xero.sync', 'xero.reconcile', 'xero.pull']
  for (const action of actions) {
    const result = await h.command(action, { kind: 'customer', id: b.customer.id })
    assert.deepEqual([result.riskClass, result.decision, result.allowed], ['provider-write', 'block', false])
  }
  assert.equal(h.xero.calls.length, calls)
  assert.deepEqual((await h.state()).customers, before.customers)
  assert.deepEqual((await h.state()).invoices, before.invoices)
  assert.deepEqual((await h.state()).payments, [])
  assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations').first('n'), 0)
  await enableXeroPolicy(h, 'allow', 'synthetic-glove-other-company')
  assert.equal((await h.command('xero.pull', {})).decision, 'block')
  for (const decision of ['review', 'approve', 'block']) {
    await enableXeroPolicy(h, decision)
    for (const action of actions) assert.deepEqual(await h.command(action, {}).then(r => [r.allowed, r.decision]), [false, decision])
  }
  assert.equal(h.xero.calls.length, calls)
  // The original inspection and fingerprint-bound local review remain available.
  const review = await discover(h, b)
  assert.equal(review.contacts[0].id, 'synthetic-glove-contact-1')
  await map(h, 'customer', b.customer.id, 'synthetic-glove-contact-1')
  assert.equal((await current(h, 'customers', b.customer.id)).xero, undefined)
  assert.equal((await current(h, 'customers', b.customer.id)).xeroLink.remoteId, 'synthetic-glove-contact-1')
  const trail = await assertTrail(h, ['company.actionPolicy'])
  const decisions = trail.exported.timeline.filter(e => e.kind === 'company.actionPolicy').map(e => JSON.parse(e.data))
  assert.ok(decisions.some(d => d.action === 'xero.pull' && d.riskClass === 'provider-write' && d.decision === 'approve' && d.allowed === false))
  assert.ok(trail.exported.timeline.some(e => e.kind === 'company.actionPolicy' && JSON.parse(e.data).decision === 'review'))
  assert.ok(h.xero.calls.every(c => c.method === 'GET'))
  // Restored records alone, and a different connection, supply no policy.
  await h.db.prepare('DELETE FROM glove_company_action_policy').run()
  assert.equal((await h.command('xero.pull', {})).allowed, false)
  await enableXeroPolicy(h)
  await h.command('xero.connect', { version: (await h.state()).business[0].version, tenant: '00000000-0000-4000-8000-000000000002', token })
  assert.notEqual((await h.state()).business[0].xeroInspection.connectionId, connection)
  assert.equal((await h.command('xero.pull', {})).allowed, false)

  // An allowed company then exercises the full receipt journey through public commands.
  {
    const h = await installation({ at: '2026-11-01T12:00:00Z' }); t.after(() => h.close())
    const b = await xeroBusiness(h), invoice = await qboInvoice(h, b)
    const posted = await xeroSync(h, 'invoice', invoice.id)
    assert.equal(posted.phase, 'complete')
    const bank = { AccountID: 'synthetic-glove-bank', Code: '090', Type: 'BANK', Status: 'ACTIVE', CurrencyCode: 'USD' }
    h.xero.data.Accounts.push(bank)
    const record = async amount => h.command('payment.record', { invoiceId: invoice.id, version: (await current(h, 'invoices', invoice.id)).version, amount, method: 'check', reference: 'Synthetic receipt' })
    const sync = (row, options = {}, type = 'xero.sync') => h.command(type, { kind: 'payment', id: row.id, version: row.version, bankAccountId: bank.AccountID, ...options.payload }, options)
    const payment = await record('30.00')
    const before = await h.state(), writes = () => h.xero.calls.filter(r => r.body?.Payments)
    await b.office.run('xero.sync', { kind: 'payment', id: payment.id, version: payment.version, bankAccountId: bank.AccountID }, { error: 'FORBIDDEN' })
    bank.Status = 'ARCHIVED'; await sync(payment, { error: 'XERO_MAPPING' }); bank.Status = 'ACTIVE'
    bank.CurrencyCode = 'NZD'; await sync(payment, { error: 'XERO_MAPPING' }); bank.CurrencyCode = 'USD'
    const remoteInvoice = h.xero.data.Invoices[0]
    remoteInvoice.Contact.ContactID = 'synthetic-glove-other-contact'
    await sync(payment, { error: 'XERO_PAYMENT' }); remoteInvoice.Contact.ContactID = 'synthetic-glove-contact-1'
    remoteInvoice.AmountDue = 20; await sync(payment, { error: 'XERO_PAYMENT' }); remoteInvoice.AmountDue = 204.59
    assert.equal(writes().length, 0)
    assert.deepEqual((await h.state()).payments, before.payments)
    await enableXeroPolicy(h, 'block')
    assert.equal((await sync(payment)).allowed, false); assert.equal(writes().length, 0)
    await enableXeroPolicy(h)
    h.xero.reject = 'Payment account needs repair'
    assert.equal((await sync(payment)).phase, 'rejected')
    h.xero.reject = null
    const sent = await sync(await current(h, 'payments', payment.id))
    assert.equal(sent.phase, 'complete')
    assert.deepEqual([writes().at(-1).method, writes().at(-1).body.Payments[0]], ['PUT', { Invoice: { InvoiceID: posted.remoteId }, Account: { AccountID: bank.AccountID }, Date: '2026-11-01', Amount: 30, Reference: 'Synthetic receipt', IsReconciled: false }])
    assert.equal(h.xero.data.Payments.length, 1); assert.equal(remoteInvoice.AmountDue, 174.59)
    const writeCount = writes().length
    await h.request('/__test/clock', { method: 'POST', body: { at: '2026-11-02T12:00:00Z' } })
    assert.equal((await sync(await current(h, 'payments', payment.id))).remoteId, sent.remoteId)
    assert.equal(writes().length, writeCount)
    const pull = (row, amountCents = 3000, error) => h.command('xero.pull', { paymentIds: [row.PaymentID], reference: row.Reference, amountCents }, error ? { error } : {})
    const remote = h.xero.data.Payments[0]
    remote.IsReconciled = true
    assert.equal((await pull(remote)).id, payment.id)
    remote.Account.AccountID = 'synthetic-glove-other-bank'; await pull(remote, 3000, 'XERO_PAYMENT_CHANGED'); remote.Account.AccountID = bank.AccountID
    remote.Status = 'DELETED'; await pull(remote, 3000, 'XERO_PAYMENT_CHANGED'); remote.Status = 'AUTHORISED'
    assert.equal((await h.state()).payments.length, 1)
    const receivables = await (await h.request('/api/glove/reports/receivables.json?asOf=2026-11-02')).json()
    assert.equal(receivables.customers[0].total, '174.59')

    // The provider can accept a receipt before the connection loses the response.
    const uncertain = await record('40.00')
    h.xero.uncertain = true
    assert.equal((await sync(uncertain)).phase, 'unknown')
    h.xero.uncertain = false
    const reserved = await current(h, 'payments', uncertain.id), unknownRemote = h.xero.data.Payments[1]
    await sync(reserved, { error: 'XERO_UNCERTAIN' })
    await pull(unknownRemote, 4000, 'XERO_UNCERTAIN')
    const writesBeforeRecovery = writes().length
    const recovered = await sync(reserved, { payload: { remoteId: unknownRemote.PaymentID } }, 'xero.reconcile')
    assert.equal(recovered.phase, 'complete')
    assert.equal((await pull(unknownRemote, 4000)).id, uncertain.id)
    assert.equal(writes().length, writesBeforeRecovery)
    assert.equal((await h.state()).payments.length, 2)
    const after = await h.state()
    assert.deepEqual(after.invoices[0].revisions, before.invoices[0].revisions)
    for (const path of ['/api/glove/state', '/api/glove/export']) {
      const response = await h.request(path, { as: b.office.cookie })
      assert.equal(response.status, 200)
      assert.doesNotMatch(await response.text(), /synthetic-glove-bank|synthetic-glove-payments-|xeroSync/)
    }
    const trail = await assertTrail(h, ['xero.reserved', 'xero.rejected', 'xero.complete', 'xero.paymentReplayed', 'xero.unknown', 'xero.reconciled'])
    assert.ok(trail.exported.timeline.some(e => e.kind === 'xero.complete' && e.data.includes(sent.remoteId)))
    assert.doesNotMatch(JSON.stringify(trail), /synthetic-glove-51|Bearer/)
    const customer = await current(h, 'customers', b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    assert.equal(await h.db.prepare('SELECT count(*) AS n FROM glove_xero_operations WHERE record_id IN (?,?)').bind(payment.id, uncertain.id).first('n'), 0)
    assert.doesNotMatch(await (await h.request('/api/glove/export')).text(), /synthetic-glove-bank|synthetic-glove-payments-/)
    await sync(await current(h, 'payments', payment.id), { error: 'ERASED' })
  }
})
