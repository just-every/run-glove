import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { installation, business, completedJob } from './harness.mjs'

// CUST-005: customers sharing a phone number are flagged on entry, reviewed,
// merged into one survivor in one journaled change, and the merge undone.

test('CUST-005: nine customers sharing a phone are flagged, merged into one and unmerged', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  const invoice = await b.office.run('invoice.prepare', { jobId: job.id })
  // Eight more entries share b.customer's phone in other spellings.
  await h.command('customer.save', { ...b.customer, phone: '(212) 555-0101', version: b.customer.version })
  const others = []
  for (let i = 1; i <= 8; i++) others.push(await b.dispatcher.run('customer.save', { name: `Harbourview ${i}`, phone: ['212.555.0101', '+1 212 555 0101', '2125550101'][i % 3], email: `front${i}@harbourview.example` }))
  assert.deepEqual(others.at(-1).duplicates.map(d => d.matches), Array(8).fill(['phone']))
  assert.equal(others.at(-1).duplicates.length, 8)
  await b.dispatcher.run('site.save', { customerId: others[0].id, address: '22 Wharf Rd, Birchgrove' })
  const loner = await b.dispatcher.run('customer.save', { name: 'Unrelated Co', phone: '(312) 555-0101' })
  assert.deepEqual(loner.duplicates, [])

  const survivor = others[0]
  const review = await (await h.request(`/api/glove/customers/${survivor.id}/duplicates`)).json()
  assert.equal(review.candidates.length, 8)
  const held = Object.fromEntries(review.records.map(r => [r.customer.id, r.holds]))
  assert.deepEqual(held[b.customer.id], { sites: 1, enquiries: 0, quotes: 1, jobs: 1, invoices: 1 })
  assert.equal((await h.request(`/api/glove/customers/${survivor.id}/duplicates`, { as: b.priyaPerson.cookie })).status, 403)

  const state = await h.state()
  const versions = Object.fromEntries(state.customers.map(c => [c.id, c.version]))
  const mergedIds = review.candidates.map(c => c.id)
  const merge = await b.dispatcher.run('customer.merge', { survivorId: survivor.id, mergedIds, versions, values: { name: b.customer.id, email: b.customer.id } })
  let after = await h.state()
  for (const kind of ['sites', 'quotes', 'jobs', 'invoices']) assert.ok(after[kind].every(r => r.customerId === survivor.id || r.customerId === loner.id), `every ${kind} hangs off the survivor`)
  const kept = after.customers.find(c => c.id === survivor.id)
  assert.deepEqual([kept.name, kept.email], ['Harbourview Dental', 'accounts@harbourview.example'])
  assert.ok(kept.contacts.some(c => c.name === 'Dr Mei Lin'), 'the merged contact person stays a contact')
  assert.ok(mergedIds.every(id => after.customers.find(c => c.id === id).mergedInto === survivor.id))
  assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, survivor.id)
  await b.dispatcher.run('customer.merge', { survivorId: survivor.id, mergedIds: [b.customer.id], versions: Object.fromEntries(after.customers.map(c => [c.id, c.version])) }, { error: 'MERGED' })

  await b.office.run('customer.unmerge', { mergeId: merge.id, version: merge.version })
  after = await h.state()
  assert.equal(after.jobs.find(j => j.id === job.id).customerId, b.customer.id)
  assert.equal(after.invoices.find(i => i.id === invoice.id).customerId, b.customer.id)
  assert.equal(after.sites.find(x => x.address === '22 Wharf Rd, Birchgrove').customerId, survivor.id)
  assert.ok(after.customers.every(c => !c.mergedInto))
  assert.equal(after.customers.find(c => c.id === survivor.id).name, 'Harbourview 1')

  // A record changed after a merge stops its undo until someone reviews it.
  const again = await b.dispatcher.run('customer.merge', { survivorId: survivor.id, mergedIds: [b.customer.id], versions: Object.fromEntries(after.customers.map(c => [c.id, c.version])) })
  const site = (await h.state()).sites.find(x => x.id === b.site.id)
  await b.dispatcher.run('site.save', { id: site.id, version: site.version, customerId: survivor.id, address: site.address, accessNotes: 'New gate code' })
  await b.dispatcher.run('customer.unmerge', { mergeId: again.id, version: again.version }, { error: 'CHANGED_SINCE' })
})

test('CUST-005: the move-in preview flags incoming customers that duplicate Glove customers', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  await business(h)
  await h.command('customer.save', { name: 'R. Physio', phone: '(02) 9555-7788' })
  const files = await Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, text: await readFile(`tests/fixtures/servicem8-small-hvac/${kind}.json`, 'utf8') })))
  const staged = await h.command('import.stage', { files })
  assert.deepEqual(staged.preview.possibleDuplicates.map(d => [d.name, d.duplicates.map(x => [x.name, x.matches])]), [['Rozelle Physio', [['R. Physio', ['phone']]]]])
})
