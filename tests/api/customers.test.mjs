import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob } from './harness.mjs'

// CUST-001: a business customer with several contacts and two properties;
// each property's whole history, newest first; billing contact and
// accounts-payable email apart from the site contacts; a required PO number.

test('CUST-001: each property has its whole history, and a business customer bills apart from its sites', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const customer = await h.command('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Harbourview Dental', kind: 'business', email: 'accounts@harbourview.example', phone: '(212) 555-0101', contact: 'Dr Mei Lin', billingAddress: '14 Harbour St', billingContact: 'Ravi Patel', apEmail: 'ap@harbourview.example', requirePo: true, contacts: [{ name: 'Dr Mei Lin', role: 'principal', phone: '(212) 555-0101' }, { name: 'Ravi Patel', role: 'accounts payable', email: 'ap@harbourview.example' }] })
  const siteA = await h.command('site.save', { id: b.site.id, version: b.site.version, customerId: customer.id, address: b.site.address, accessNotes: 'Gate code at reception', contact: 'Jo Front Desk', contactPhone: '(212) 555-0199' })
  const siteB = await h.command('site.save', { customerId: customer.id, address: '22 Wharf Rd, Birchgrove', contact: 'Sam Practice Manager' })
  const saved = (await h.state()).customers.find(c => c.id === customer.id)
  assert.equal(saved.contacts.length, 2)
  assert.deepEqual([saved.billingContact, saved.apEmail], ['Ravi Patel', 'ap@harbourview.example'])
  assert.ok(![siteA.contact, siteB.contact].includes(saved.billingContact), 'site contacts are their own')

  const { job } = await completedJob(h, b)
  await b.dispatcher.run('enquiry.create', { customerId: customer.id, siteId: siteB.id, description: 'Furnace short-cycling', source: 'phone' })
  await b.office.run('equipment.save', { siteId: siteB.id, type: 'Furnace', make: 'Carrier' })
  const inv = await b.office.run('invoice.prepare', { jobId: job.id })

  const history = async (site, as) => { const res = await h.request(`/api/glove/sites/${site.id}/history`, as ? { as } : {}); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).entries }
  const a = await history(siteA)
  for (const kind of ['quote', 'job', 'visit', 'arrival', 'form', 'completion', 'invoice']) assert.ok(a.some(e => e.kind === kind), `site A history has a ${kind}`)
  assert.deepEqual(a.map(e => e.at), [...a.map(e => e.at)].sort().reverse(), 'newest first')
  assert.equal(a[0].kind, 'invoice')
  const bHistory = await history(siteB)
  assert.deepEqual(bHistory.map(e => e.kind).sort(), ['equipment', 'request'])
  // The technician reads the field side of their own property, without quotes or invoices.
  const field = await history(siteA, b.priyaPerson.cookie)
  assert.ok(field.some(e => e.kind === 'form') && !field.some(e => ['quote', 'invoice'].includes(e.kind)))
  assert.equal((await h.request(`/api/glove/sites/${siteB.id}/history`, { as: b.priyaPerson.cookie })).status, 404)

  // The customer requires a purchase-order number: no approval without one, and the export carries it to accounts payable.
  await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 }, { error: 'PO_REQUIRED' })
  const approved = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1, poNumber: 'PO-7781' })
  assert.equal(approved.poNumber, 'PO-7781')
  const exported = await b.office.run('invoice.export', {})
  const csv = await (await h.request(`/api/glove/exports/${exported.id}.csv`)).text()
  assert.match(csv.split('\r\n')[1], /^Harbourview Dental,ap@harbourview\.example,.*,PO PO-7781 · J-\d+,/)
})
