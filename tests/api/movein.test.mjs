// Move-in undo is destructive, so it gets its own proof: it never removes a
// record that later Glove work depends on, and never overwrites a later edit.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { installation, business } from './harness.mjs'

const fixture = 'tests/fixtures/servicem8-small-hvac/'
const files = async () => Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, text: await readFile(`${fixture}${kind}.json`, 'utf8') })))

async function moveIn(h) {
  const staged = await h.command('import.stage', { files: await files() })
  return h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
}

test('undo refuses while Glove work refers to moved-in records, and keeps it intact', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const batch = await moveIn(h)
  const before = await h.state()
  const workOrder = before.jobs.find(j => j.number === 'SM8-1031')
  const visit = await b.dispatcher.run('visit.book', { jobId: workOrder.id, technicianId: b.priya.id, date: '2026-10-21', start: '08:00', end: '09:00' })
  const refused = await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Try to back out' }, { error: 'IMPORT_DEPENDENTS' })
  assert.deepEqual(refused.details.dependents, [{ kind: 'visits', id: visit.id, refersTo: workOrder.id }])
  const after = await h.state()
  assert.equal(after.jobs.length, before.jobs.length)
  assert.equal((await h.db.prepare("SELECT state FROM ik_jobs").first()).state, 'completed', 'the journal was not touched')
})

test('undo stops at a record edited in Glove after the move-in and preserves the edit', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  await business(h)
  const batch = await moveIn(h)
  const customer = (await h.state()).customers.find(c => c.name === 'Rozelle Physio')
  await h.command('customer.save', { id: customer.id, version: customer.version, name: 'Rozelle Physio & Pilates', email: 'grace@rozellephysio.example' })
  const conflict = await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Back out' }, { error: 'NATIVE_EDIT_CONFLICT' })
  assert.match(conflict.message, /changed in Glove/)
  const s = await h.state()
  assert.equal(s.customers.find(c => c.id === customer.id).name, 'Rozelle Physio & Pilates', 'the edit survives')
  assert.equal(s.imports.find(i => i.id === batch.id).status, 'committed')
})

test('a second commit of the same move-in writes nothing twice', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  await business(h)
  await moveIn(h)
  const once = await h.state()
  const again = await h.command('import.stage', { files: await files() })
  const committed = await h.command('import.commit', { batchId: again.id, version: again.version, fingerprint: again.preview.fingerprint })
  assert.equal(committed.status, 'committed')
  const twice = await h.state()
  for (const kind of ['customers', 'sites', 'technicians', 'jobs', 'quotes', 'visits', 'captures']) assert.equal(twice[kind].length, once[kind].length, `${kind} unchanged`)
})

test('an undo that takes several passes holds its records until it finishes', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const companies = Array.from({ length: 600 }, (_, i) => ({ uuid: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, active: 1, name: `Client ${i}`, address: `${i} George St, Sydney NSW 2000`, edit_date: '2026-09-01 10:00:00' }))
  const staged = await h.command('import.stage', { files: [{ name: 'company.json', text: JSON.stringify(companies) }] })
  const send = async (type, payload, as = h.owner()) => (await h.request('/api/glove/commands', { method: 'POST', as, body: { commandId: crypto.randomUUID(), type, payload } })).json()
  let committed
  do committed = await send('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  while (!committed.ok && committed.error.code === 'IMPORT_INCOMPLETE')
  assert.equal(committed.ok, true, JSON.stringify(committed))
  const movedIn = async () => (await h.state()).customers.filter(c => c.id.startsWith('sm8-'))
  assert.equal((await movedIn()).length, 600)

  const first = await send('import.undo', { batchId: staged.id, version: committed.result.version, reason: 'Wrong export' })
  assert.equal(first.ok, false, 'this undo needs more than one pass')
  assert.equal(first.error.code, 'IMPORT_INCOMPLETE')
  const midway = await h.state()
  assert.equal(midway.imports.find(i => i.id === staged.id).status, 'undoing', 'the screen shows the undo is part-way')
  const remaining = (await movedIn())[0]
  const enquiry = await send('enquiry.create', { customerId: remaining.id, description: 'Customer rang about a leak' }, b.dispatcher.cookie)
  assert.equal(enquiry.error?.code, 'IMPORT_UNDOING', 'no new work may refer to a record that is being undone')
  const edit = await send('customer.save', { id: remaining.id, version: remaining.version, name: 'Renamed mid-undo' }, b.dispatcher.cookie)
  assert.equal(edit.error?.code, 'IMPORT_UNDOING', 'nor may it be edited')
  await b.dispatcher.run('customer.save', { name: 'Walk-in customer' })

  let undone = first
  while (!undone.ok && undone.error.code === 'IMPORT_INCOMPLETE') undone = await send('import.undo', { batchId: staged.id, version: committed.result.version, reason: 'Wrong export' })
  assert.equal(undone.ok, true, JSON.stringify(undone))
  const s = await h.state()
  assert.equal(s.customers.filter(c => c.id.startsWith('sm8-')).length, 0, 'every moved-in record is gone')
  assert.ok(s.customers.some(c => c.name === 'Walk-in customer'), 'unrelated desk work carried on')
  assert.equal(s.imports.find(i => i.id === staged.id).status, 'undone')
})
