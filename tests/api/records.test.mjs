// The record trail a business relies on later: a corrected invoice never goes
// to the accounting system under its original number twice, and every job keeps
// its whole timeline however busy the business gets.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob } from './harness.mjs'

test('a correction revised before approval still exports as its own numbered row', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  let inv = await b.office.run('invoice.prepare', { jobId: job.id })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  await b.office.run('invoice.export', {})
  inv = (await h.state()).invoices.find(i => i.id === inv.id)
  inv = await b.office.run('invoice.correct', { invoiceId: inv.id, version: inv.version, reason: 'Wrong service price', lines: [{ description: 'Split system service', quantity: '1', unitPrice: '179.00' }] })
  inv = await b.office.run('invoice.revise', { invoiceId: inv.id, version: inv.version, reason: 'Typo in the description', lines: [{ description: 'Split system service (corrected)', quantity: '1', unitPrice: '179.00' }] })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 3 })
  const second = await b.office.run('invoice.export', {})
  assert.deepEqual(second.invoices.map(i => i.invoiceNumber), ['INV-0001-R3'])
  const csv = await (await h.request(`/api/glove/exports/${second.id}.csv`, { as: b.office.cookie })).text()
  const numbers = [...csv.matchAll(/,(INV-\d{4}(?:-R\d+)?),/g)].map(m => m[1])
  assert.deepEqual(numbers, ['INV-0001-R3'], 'the original number is never exported again')
  assert.match(csv, /corrects INV-0001 rev 1 \(EXP-0001\)/)
})

test('a job keeps its whole timeline after hundreds of later events', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  const timeline = async (as) => { const res = await h.request(`/api/glove/jobs/${job.id}/timeline`, { as }); assert.equal(res.status, 200, await res.clone().text()); return (await res.json()).events }
  const early = await timeline(h.owner())
  assert.ok(early.length >= 6, 'booked, arrived, checklist, completed')
  for (let i = 0; i < 510; i++) await h.command('customer.save', { name: `Walk-in customer ${i}` })
  const late = await timeline(h.owner())
  assert.deepEqual(late.map(e => e.id), early.map(e => e.id), 'every step is still there')
  assert.ok(late.every(e => e.jobId === job.id && e.actorName && e.commandId))
  assert.equal((await timeline(b.priyaPerson.cookie)).length, early.length, 'the assigned technician reads it too')
  const other = await h.person('Tara Other', 'technician')
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/timeline`, { as: other.cookie })).status, 404, 'other technicians do not')
})
