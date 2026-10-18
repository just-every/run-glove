// COST-003: job expenses with receipts, billable at cost or with markup, on
// the invoice draft and in the job's cost.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob } from './harness.mjs'

const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')

test('COST-003 a billable supply-house receipt with 20% markup and a non-billable permit fee reach the invoice draft and job cost', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job, visit } = await completedJob(h, b)

  // The technician records the supply-house receipt on their visit; the office sets its markup.
  let receipt = await b.priyaPerson.run('expense.record', { visitId: visit.id, category: 'supply-house purchase', vendor: 'Ferguson Supply', description: 'Capacitor and contactor', amount: '120.00', billable: true, receipt: { mediaType: 'image/jpeg', base64: jpeg }, deviceTime: '2026-10-20T22:40:00Z' })
  assert.equal(receipt.jobId, job.id)
  await b.priyaPerson.run('expense.record', { visitId: visit.id, category: 'permit', vendor: 'x', amount: '1.00', markupPercent: '50' }, { error: 'PRICE' })
  await b.tomPerson.run('expense.record', { visitId: visit.id, category: 'permit', vendor: 'x', amount: '1.00' }, { error: 'FORBIDDEN' })
  await b.office.run('expense.record', { jobId: job.id, category: 'invoice', vendor: 'x', amount: '1.00' }, { error: 'INPUT' })
  receipt = await b.office.run('expense.price', { expenseId: receipt.id, version: receipt.version, billable: true, markupPercent: '20' })
  const permit = await b.office.run('expense.record', { jobId: job.id, category: 'permit', vendor: 'City of Balmain', description: 'Electrical permit', amount: '85.00', billable: false })
  assert.equal((await h.request(`/api/glove/files/${receipt.receipt.fileId}`, { as: b.priyaPerson.cookie })).status, 200, 'the technician reads the receipt they captured')
  assert.equal((await h.request(`/api/glove/files/${receipt.receipt.fileId}`, { as: b.tomPerson.cookie })).status, 404)
  assert.deepEqual((await b.priyaPerson.state()).expenses.map(e => e.id), [receipt.id], 'the phone sees only its own expenses')

  const inv = await b.office.run('invoice.prepare', { jobId: job.id })
  assert.deepEqual(inv.revisions[0].lines.map(l => [l.description, l.unitPrice, l.total]), [
    ['Split system service', '189.00', '189.00'],
    ['Ferguson Supply: Capacitor and contactor (cost $120.00 + 20%)', '144.00', '144.00'],
  ], 'the billable expense at cost plus markup; the permit stays off the invoice')
  assert.deepEqual(inv.revisions[0].totals, { subtotal: '333.00', gst: '33.30', total: '366.30' })
  const s = await h.state()
  assert.equal(s.expenses.find(e => e.id === receipt.id).invoiceId, inv.id)
  const priced = s.expenses.find(e => e.id === receipt.id)
  await b.office.run('expense.price', { expenseId: receipt.id, version: priced.version, billable: true, markupPercent: '30' }, { error: 'INVOICED' })

  const res = await h.request(`/api/glove/jobs/${job.id}/cost`, { as: b.office.cookie })
  assert.equal(res.status, 200)
  const cost = await res.json()
  assert.deepEqual(cost.totals, { expenses: '205.00', billable: '120.00', nonBillable: '85.00', billed: '144.00' })
  assert.deepEqual(cost.expenses.map(e => [e.vendor, e.category, e.amount, e.billable, e.markupPercent, e.billed]), [
    ['Ferguson Supply', 'supply-house purchase', '120.00', true, '20', '144.00'],
    ['City of Balmain', 'permit', '85.00', false, '0', '0.00'],
  ])
  assert.equal(permit.receipt, null)
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/cost`, { as: b.priyaPerson.cookie })).status, 403, 'technicians never read job cost')
  assert.ok(s.events.filter(e => e.kind.startsWith('expense.')).length === 3)
})
