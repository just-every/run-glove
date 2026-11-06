import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, id } from './harness.mjs'

// MONEY-003: a 200-line price book CSV with costs, categories and markups is
// previewed and committed; one category is raised 5%; a flat-rate task and a
// time-and-materials line are quoted with their costs; the export round-trips.

const jpeg = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex').toString('base64')
const csv = rows => rows.map(r => r.map(v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n')

function priceBook() {
  const rows = [['Code', 'Name', 'Kind', 'Category', 'Category markup %', 'Unit', 'Unit cost', 'Pricing', 'Price', 'Tax', 'Customer description', 'Supplier part numbers', 'Task contents']]
  rows.push(['LAB-HR', 'Technician labor', 'service', 'Labor', '', 'hour', '45.00', 'fixed', '120.00', 'GST', 'Per hour on site', '', ''])
  for (let i = 1; i <= 150; i++) rows.push([`P-${String(i).padStart(3, '0')}`, `Part ${i}`, 'material', 'Parts', '50', 'each', i === 1 ? '10.01' : `${10 + i}.00`, 'markup', '', 'GST', '', i === 1 ? 'Ferguson: FG-1001; Johnstone: J-77' : '', ''])
  for (let i = 1; i <= 41; i++) rows.push([`F-${String(i).padStart(3, '0')}`, `Filter ${i}`, 'material', 'Filters', '', 'each', `${4 + i}.00`, 'fixed', i === 3 ? '20.99' : `${19 + i}.00`, 'GST', '', '', ''])
  for (let i = 1; i <= 8; i++) rows.push([`TASK-${i}`, i === 1 ? 'Replace 3/4" valve' : `Flat-rate task ${i}`, 'task', 'Flat rate', '', 'each', '', 'fixed', `${300 + i * 49}.00`, 'GST', i === 1 ? 'Valve, fittings and labor, one price' : '', '', i === 1 ? 'LAB-HR x 1.5; P-001 x 1' : `LAB-HR x ${i}; F-00${i} x 2`])
  assert.equal(rows.length, 201)
  return csv(rows)
}

test('MONEY-003, MONEY-006: a 200-line price book CSV with costs and markups, a 5% category raise, a flat-rate task quoted beside time and materials, and a round-trip export', async (t) => {
  const at = '2026-11-05T12:00:00.000Z'
  const h = await installation({ at })
  t.after(() => h.close())
  const b = await business(h)
  const before = await h.state()
  const file = { name: 'price-book.csv', text: priceBook() }

  const previewed = await h.command('pricebook.import', { file })
  assert.equal(previewed.committed, false)
  assert.deepEqual(previewed.preview.rows, { total: 200, new: 200, updated: 0, unchanged: 0, rejected: 0 })
  assert.deepEqual(previewed.preview.categories, [{ name: 'Parts', markupPercent: '50' }])
  assert.equal((await h.state()).services.length, before.services.length, 'the preview writes nothing')
  await h.command('pricebook.import', { file, fingerprint: 'not-the-preview' }, { error: 'IMPORT_STALE' })
  await h.command('pricebook.import', { file, fingerprint: previewed.preview.fingerprint })

  let s = await h.state()
  const item = code => s.services.find(x => x.code === code)
  assert.equal(s.services.length, before.services.length + 200)
  assert.deepEqual([item('P-001').unitCost, item('P-001').unitPrice], ['10.01', '15.02'], 'cost × 1.5, rounded half up to the cent')
  assert.deepEqual([item('P-150').unitCost, item('P-150').unitPrice], ['160.00', '240.00'])
  assert.deepEqual(item('P-001').parts, [{ supplier: 'Ferguson', partNumber: 'FG-1001' }, { supplier: 'Johnstone', partNumber: 'J-77' }])
  const valve = item('TASK-1')
  assert.deepEqual([valve.kind, valve.unitCost, valve.unitPrice, valve.description], ['task', '77.51', '349.00', 'Valve, fittings and labor, one price'], 'a task costs its labor and parts inside')
  assert.deepEqual(valve.components, [{ serviceId: item('LAB-HR').id, quantity: '1.5' }, { serviceId: item('P-001').id, quantity: '1' }])

  // Raise Filters 5%: fixed prices scale and round half up; other categories stay.
  const raised = await h.command('pricebook.adjust', { category: 'Filters', percent: '5' })
  assert.equal(raised.items.length, 41)
  s = await h.state()
  assert.deepEqual(['F-001', 'F-003', 'F-041'].map(c => item(c).unitPrice), ['21.00', '22.04', '63.00'])
  assert.deepEqual([item('P-001').unitPrice, item('LAB-HR').unitPrice], ['15.02', '120.00'])
  // A new markup and a new cost flow into markup prices and task costs.
  await h.command('pricebook.category', { name: 'Parts', markupPercent: '60' })
  const p1 = (await h.state()).services.find(x => x.code === 'P-001')
  await h.command('service.save', { id: p1.id, version: p1.version, code: 'P-001', name: 'Part 1', kind: 'material', category: 'Parts', pricing: 'markup', unitCost: '12.00', image: { mediaType: 'image/jpeg', base64: jpeg } })
  s = await h.state()
  assert.deepEqual([item('P-001').unitPrice, item('TASK-1').unitCost, item('TASK-1').unitPrice], ['19.20', '79.50', '349.00'])
  const picture = await h.request(`/api/glove/files/${item('P-001').images[0].fileId}`)
  assert.equal(picture.status, 200)
  assert.equal(Buffer.from(await picture.arrayBuffer()).toString('base64'), jpeg)

  // Quote the flat-rate task beside 2.5 hours of time and materials; each line keeps its cost.
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Valve and labor', lines: [
    { description: valve.name, quantity: '1', unitPrice: '349.00', serviceId: valve.id },
    { description: 'Technician labor', quantity: '2.5', unitPrice: '120.00', serviceId: item('LAB-HR').id },
  ] })
  const lines = quote.revisions[0].lines
  assert.deepEqual(lines.map(l => [l.total, l.unitCost]), [['349.00', '79.50'], ['300.00', '45.00']])
  assert.deepEqual(quote.revisions[0].totals, { subtotal: '649.00', gst: '64.90', total: '713.90' })
  const tech = await b.priyaPerson.state()
  assert.ok(tech.services.every(x => x.unitCost === undefined && x.unitPrice === undefined), 'a technician reads neither price nor cost')

  // The export re-imports unchanged.
  const res = await h.request('/api/glove/pricebook.csv')
  assert.equal(res.status, 200)
  const out = await res.text()
  const again = await h.command('pricebook.import', { file: { name: 'glove-price-book.csv', text: out } })
  assert.deepEqual(again.preview.rows, { total: s.services.length, new: 0, updated: 0, unchanged: s.services.length, rejected: 0 })
  assert.deepEqual(again.preview.categories, [])
  assert.equal((await h.request('/api/glove/pricebook.csv', { as: b.priyaPerson.cookie })).status, 403)

  // A mixed worksheet must describe and commit only its reviewed effects,
  // including when rejected rows propose category changes of their own.
  const owner = (await h.state()).actor
  const checklist = [{ label: 'Isolate supply', required: true }, { label: 'Record condition', required: false }]
  const updated = await h.command('service.save', {
    code: 'MX-UPDATE', name: 'Inspect pump', kind: 'service', category: 'Mixed', unit: 'visit',
    unitCost: '12.34', pricing: 'fixed', unitPrice: '35.00', tax: 'GST', description: 'Original inspection',
    parts: [{ supplier: 'Supply house', partNumber: 'OLD-1' }], checklist, requiredSkills: ['electrical'],
    image: { mediaType: 'image/jpeg', base64: jpeg },
  })
  const unchanged = await h.command('service.save', {
    code: 'MX-SAME', name: 'Existing coupling', kind: 'material', category: 'Mixed', unit: 'each',
    unitCost: '3.00', pricing: 'fixed', unitPrice: '8.25', tax: 'FREE', checklist, requiredSkills: ['plumbing'],
    image: { mediaType: 'image/jpeg', base64: jpeg },
  })
  const marked = await h.command('service.save', {
    code: 'MX-MARKUP', name: 'Marked coupling', kind: 'material', category: 'Parts', unit: 'each',
    unitCost: '12.50', pricing: 'markup', tax: 'GST', checklist, requiredSkills: ['plumbing'],
    image: { mediaType: 'image/jpeg', base64: jpeg },
  })
  const originals = [updated, unchanged, marked]
  const originalImages = async () => {
    for (const item of originals) {
      const response = await h.request(`/api/glove/files/${item.images[0].fileId}`)
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('content-type'), 'image/jpeg')
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(jpeg, 'base64'))
    }
  }
  for (const [item, skill] of [[updated, 'electrical'], [unchanged, 'plumbing'], [marked, 'plumbing']]) {
    assert.deepEqual(item.checklist, checklist)
    assert.deepEqual(item.requiredSkills, [skill])
    assert.equal(item.images.length, 1)
  }
  assert.equal(marked.unitPrice, '20.00')
  await originalImages()
  const mixed = { name: 'synthetic-glove-mixed.csv', text: csv([
    ['Code', 'Name', 'Kind', 'Category', 'Category markup %', 'Unit', 'Unit cost', 'Pricing', 'Price', 'Tax', 'Customer description', 'Supplier part numbers', 'Task contents', 'Archived'],
    ['MX-UPDATE', 'Inspect pump and valves', 'service', 'Mixed', '', 'visit', '15.25', 'fixed', '55.50', 'GST', 'Inspection with valve check', 'Supply house: NEW-2', '', 'no'],
    ['MX-SAME', 'Existing coupling', 'material', 'Mixed', '', 'each', '3.00', 'fixed', '8.25', 'FREE', '', '', '', 'no'],
    ['MX-MARKUP', 'Marked coupling', 'material', 'Parts', '', 'each', '12.50', 'markup', 'not-a-price', 'GST', '', '', '', 'no'],
    ['MX-NEW', 'New coupling', 'material', 'Mixed', '', 'each', '6.25', 'fixed', '18.75', 'GST', 'Replacement coupling', 'Supply house: NEW-3', '', 'no'],
    ['MX-BAD-NAME', '', 'material', 'Parts', '90', 'each', '1.00', 'fixed', '2.00', 'GST', '', '', '', 'no'],
    ['MX-BAD-COST', 'Bad cost', 'material', '', '', 'each', 'wrong', 'fixed', '2.00', 'GST', '', '', '', 'no'],
    ['MX-UPDATE', 'Duplicate', 'service', '', '', 'each', '1.00', 'fixed', '2.00', 'GST', '', '', '', 'no'],
    ['MX-BAD-TASK', 'Unknown contents', 'task', 'Rejected task', '30', 'each', '', 'fixed', '10.00', 'GST', '', '', 'MX-MISSING x 1', 'no'],
  ]) }
  const domain = async () => {
    const { actor: _actor, version: _version, events: _events, ...records } = await h.state()
    return { ...records, services: records.services.toSorted((a, b) => a.code.localeCompare(b.code)) }
  }
  const beforeMixed = await domain()
  const reviewed = await h.command('pricebook.import', { file: mixed })
  assert.equal(reviewed.committed, false)
  assert.deepEqual(reviewed.preview.rows, { total: 8, new: 1, updated: 1, unchanged: 2, rejected: 4 })
  assert.deepEqual(reviewed.preview.changes, [
    { row: 2, code: 'MX-UPDATE', status: 'updated', changes: ['name', 'unitCost', 'description', 'parts', 'unitPrice'] },
    { row: 5, code: 'MX-NEW', status: 'new', changes: [] },
  ], 'Code matches the existing item; only the listed fields differ, and rows 3 and 4 are unchanged')
  assert.deepEqual(reviewed.preview.rejected, [
    { row: 6, reason: 'Name: name is required (at most 200 characters).' },
    { row: 7, reason: 'Unit cost: unitCost must be a dollar amount such as 120 or 120.50.' },
    { row: 8, reason: 'Code: Code MX-UPDATE is already on row 2.' },
    { row: 9, reason: 'Task contents: Task contents name MX-MISSING, which is not in the price book or this file.' },
  ])
  assert.deepEqual(reviewed.preview.categories, [], 'rejected rows confer no category markup')
  assert.deepEqual(await domain(), beforeMixed, 'preview changes no domain record')

  for (const file of [{ ...mixed, text: mixed.text.replace('New coupling', 'Different coupling') }, { ...mixed, text: mixed.text + '\n' }]) {
    await h.command('pricebook.import', { file, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
    assert.deepEqual(await domain(), beforeMixed, 'changed file inputs cannot use the old preview')
  }
  // This edit still differs from the incoming price, so the set of differing
  // field names is unchanged. The reviewed catalogue version must matter too.
  const edited = await h.command('service.save', { ...updated, unitPrice: '36.00' })
  await h.command('role.set', { operatorId: b.office.id, role: 'owner' })
  const withdrawnReview = await b.office.run('pricebook.import', { file: mixed })
  await h.command('role.set', { operatorId: b.office.id, role: 'office' })
  const beforeCommit = await domain()
  await b.office.run('pricebook.import', { file: mixed, fingerprint: withdrawnReview.preview.fingerprint }, { error: 'FORBIDDEN' })
  assert.deepEqual(await domain(), beforeCommit, 'withdrawn Owner authority cannot commit an inspected preview')
  await h.command('pricebook.import', { file: mixed, fingerprint: reviewed.preview.fingerprint }, { error: 'IMPORT_STALE' })
  assert.deepEqual(await domain(), beforeCommit)
  const current = await h.command('pricebook.import', { file: mixed })
  assert.notEqual(current.preview.fingerprint, reviewed.preview.fingerprint)
  assert.deepEqual(current.preview.changes, reviewed.preview.changes)
  for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent]) {
    await person.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'FORBIDDEN' })
    assert.deepEqual(await domain(), beforeCommit)
  }
  const commandId = id()
  const committed = await h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId })
  assert.equal(committed.committed, true)
  assert.deepEqual(committed.preview, current.preview, 'the committed plan is exactly the current preview')
  const retained = await domain()
  const newItem = retained.services.find(x => x.code === 'MX-NEW')
  assert.match(newItem.id, /^[a-f0-9-]{36}$/)
  assert.ok(!beforeCommit.services.some(x => x.id === newItem.id))
  assert.deepEqual(newItem, {
    id: newItem.id, version: 1, createdAt: at, createdBy: owner.id,
    code: 'MX-NEW', name: 'New coupling', kind: 'material', category: 'Mixed', unit: 'each',
    unitCost: '6.25', pricing: 'fixed', unitPrice: '18.75', tax: 'GST', description: 'Replacement coupling',
    parts: [{ supplier: 'Supply house', partNumber: 'NEW-3' }], components: [], checklist: [], requiredSkills: [], archived: false,
  })
  const expectedUpdated = { ...edited, version: edited.version + 1, name: 'Inspect pump and valves', unitCost: '15.25', unitPrice: '55.50', description: 'Inspection with valve check', parts: [{ supplier: 'Supply house', partNumber: 'NEW-2' }], updatedAt: at, updatedBy: owner.id }
  assert.deepEqual(retained, { ...beforeCommit, services: [...beforeCommit.services.map(x => x.id === updated.id ? expectedUpdated : x), newItem].sort((a, b) => a.code.localeCompare(b.code)) }, 'all other identities, versions, evidence and customer records are unchanged')
  await originalImages()
  await h.restart()
  assert.deepEqual(await domain(), retained, 'actual Worker restart retains exact identities, values and versions')
  await originalImages()
  assert.deepEqual(await h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId }), committed)
  assert.deepEqual(await domain(), retained, 'replayed commit adds no items and changes no versions')
  await b.office.run('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { commandId, error: 'FORBIDDEN' })
  assert.deepEqual(await domain(), retained, 'saved outcomes cannot bypass current authority')
  await h.command('pricebook.import', { file: mixed, fingerprint: current.preview.fingerprint }, { error: 'IMPORT_STALE' })
  assert.deepEqual(await domain(), retained)
  const repeat = await h.command('pricebook.import', { file: mixed })
  assert.deepEqual(repeat.preview.rows, { total: 8, new: 0, updated: 0, unchanged: 4, rejected: 4 })
  assert.deepEqual(repeat.preview.changes, [])
  assert.deepEqual(repeat.preview.rejected, reviewed.preview.rejected)
  assert.deepEqual(repeat.preview.categories, [])

  const exported = await h.request('/api/glove/pricebook.csv')
  assert.equal(exported.status, 200)
  const exportText = await exported.text()
  const { parseCsv } = await import('../../src/glove/csv-format.ts')
  const [headers, ...exportRows] = parseCsv(exportText)
  const row = code => exportRows.find(x => x[headers.indexOf('Code')] === code)
  assert.deepEqual(row('MX-UPDATE'), ['MX-UPDATE', 'Inspect pump and valves', 'service', 'Mixed', '', 'visit', '15.25', 'fixed', '55.50', 'GST', 'Inspection with valve check', 'Supply house: NEW-2', '', 'no'])
  assert.deepEqual(row('MX-MARKUP'), ['MX-MARKUP', 'Marked coupling', 'material', 'Parts', '60', 'each', '12.50', 'markup', '20.00', 'GST', '', '', '', 'no'])
  assert.deepEqual(row('MX-SAME'), ['MX-SAME', 'Existing coupling', 'material', 'Mixed', '', 'each', '3.00', 'fixed', '8.25', 'FREE', '', '', '', 'no'])
  assert.deepEqual(row('MX-NEW'), ['MX-NEW', 'New coupling', 'material', 'Mixed', '', 'each', '6.25', 'fixed', '18.75', 'GST', 'Replacement coupling', 'Supply house: NEW-3', '', 'no'])
  const roundTripFile = { name: 'glove-price-book.csv', text: exportText }
  const roundTrip = await h.command('pricebook.import', { file: roundTripFile })
  assert.deepEqual(roundTrip.preview.rows, { total: retained.services.length, new: 0, updated: 0, unchanged: retained.services.length, rejected: 0 })
  assert.deepEqual(roundTrip.preview.changes, [])
  assert.deepEqual(roundTrip.preview.categories, [])
  await h.command('pricebook.import', { file: roundTripFile, fingerprint: roundTrip.preview.fingerprint })
  assert.deepEqual(await domain(), retained, 'export and actual re-import change no domain records')
  assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const imported = activity.events.filter(e => e.commandId === commandId && e.kind === 'pricebook.imported')
  assert.equal(imported.length, 1)
  assert.deepEqual([imported[0].actorId, imported[0].actorName, imported[0].actorRole, imported[0].at, imported[0].subjectKind, imported[0].subjectId, imported[0].summary], [owner.id, 'Olivia Owner', 'owner', at, 'business', 'business', 'Price book CSV: 1 new, 1 updated, 2 unchanged, 4 rejected'])
  const download = await h.request('/api/glove/export').then(r => r.json())
  const entry = download.timeline.find(e => e.id === imported[0].id)
  assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.command_id, entry.summary], [owner.id, 'Olivia Owner', 'owner', at, commandId, imported[0].summary])
  assert.deepEqual(download.services.toSorted((a, b) => a.code.localeCompare(b.code)), retained.services)

  // A markup row rejected after field validation cannot leave a dependent task
  // in the exact preview. Task-first order must reach the same decision too.
  for (const rows of [
    ['MAT,Replacement coupling,material,Missing,10.00,markup,,', 'TASK,Coupling replacement,task,,0,fixed,20.00,MAT x 1'],
    ['TASK,Coupling replacement,task,,0,fixed,20.00,MAT x 1', 'MAT,Replacement coupling,material,Missing,10.00,markup,,'],
  ]) {
    const file = { name: 'synthetic-glove-blocking-a.csv', text: ['Code,Name,Kind,Category,Unit cost,Pricing,Price,Task contents', ...rows, ''].join('\n') }
    const beforeRejected = await domain()
    const rejected = await h.command('pricebook.import', { file })
    assert.equal(rejected.committed, false)
    assert.deepEqual(rejected.preview.rows, { total: 2, new: 0, updated: 0, unchanged: 0, rejected: 2 })
    assert.deepEqual(rejected.preview.changes, [])
    assert.deepEqual(rejected.preview.categories, [])
    assert.deepEqual(rejected.preview.rejected, rows.map((row, i) => ({ row: i + 2, reason: row.startsWith('MAT,') ? 'Pricing: markup needs a category with a markup.' : 'Task contents: Task contents name MAT, which is not in the price book or this file.' })))
    assert.deepEqual(await domain(), beforeRejected, 'rejected dependency preview changes no records')
    const commandId = id()
    const committed = await h.command('pricebook.import', { file, fingerprint: rejected.preview.fingerprint }, { commandId })
    assert.equal(committed.committed, true)
    assert.deepEqual(committed.preview, rejected.preview, 'commit applies exactly the two rejected rows without a dangling task')
    assert.deepEqual(await domain(), beforeRejected, 'rejected rows retain every unrelated record and version')
    await h.restart()
    assert.deepEqual(await h.command('pricebook.import', { file, fingerprint: rejected.preview.fingerprint }, { commandId }), committed)
    assert.deepEqual(await domain(), beforeRejected, 'restart and replay retain all records')
    await originalImages()
    assert.equal(await (await h.request('/api/glove/pricebook.csv')).text(), exportText)
  }

  // Native Owner saves must round each service and material product before
  // summing task cost, independently of CSV import or markup pricing.
  {
    const saved = []
    const nativeSave = async payload => {
      const commandId = id()
      const record = await h.command('service.save', payload, { commandId })
      saved.push({ commandId, record })
      return record
    }
    const labor = await nativeSave({ code: 'synthetic-glove-1', name: 'Fractional labor', kind: 'service', unitCost: '0.01', unitPrice: '5.00' })
    const material = await nativeSave({ code: 'synthetic-glove-2', name: 'Fractional material', kind: 'material', unitCost: '0.01', unitPrice: '3.00' })
    assert.notEqual(labor.id, material.id)
    const laborContents = [{ serviceId: labor.id, quantity: '0.5' }]
    const materialContents = [{ serviceId: material.id, quantity: '0.5' }]
    const contents = [...laborContents, ...materialContents]
    const laborTask = await nativeSave({ code: 'synthetic-glove-3', name: 'Labor task', kind: 'task', pricing: 'fixed', unitPrice: '17.00', components: laborContents })
    const materialTask = await nativeSave({ code: 'synthetic-glove-4', name: 'Material task', kind: 'task', pricing: 'fixed', unitPrice: '19.00', components: materialContents })
    const taskPayload = { code: 'synthetic-glove-5', name: 'Combined task', kind: 'task', pricing: 'fixed', unitPrice: '42.00', components: contents }
    const task = await nativeSave(taskPayload)
    const figures = async () => {
      const state = await h.state()
      return [labor.id, material.id, laborTask.id, materialTask.id, task.id].map(id => {
        const item = state.services.find(x => x.id === id)
        return [item.id, item.kind, item.components, item.unitCost, item.unitPrice]
      })
    }
    assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.01', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.01', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.02', '42.00'],
    ], 'each distinct half-cent rounds up; rounding only the sum would yield one cent')

    await nativeSave({ ...labor, unitCost: '0.03' })
    assert.deepEqual(await figures(), [
      [labor.id, 'service', [], '0.03', '5.00'],
      [material.id, 'material', [], '0.01', '3.00'],
      [laborTask.id, 'task', laborContents, '0.02', '17.00'],
      [materialTask.id, 'task', materialContents, '0.01', '19.00'],
      [task.id, 'task', contents, '0.03', '42.00'],
    ], 'a service cost edit recalculates every dependent task without changing fixed prices')
    await nativeSave({ ...material, unitCost: '0.05' })
    const expected = [
      [labor.id, 'service', [], '0.03', '5.00'],
      [material.id, 'material', [], '0.05', '3.00'],
      [laborTask.id, 'task', laborContents, '0.02', '17.00'],
      [materialTask.id, 'task', materialContents, '0.03', '19.00'],
      [task.id, 'task', contents, '0.05', '42.00'],
    ]
    assert.deepEqual(await figures(), expected, 'a material cost edit rounds its own product before summation')

    const retained = await domain()
    const currentTask = retained.services.find(x => x.id === task.id)
    const nested = await h.command('service.save', { ...currentTask, unitPrice: '99.00', components: [{ serviceId: laborTask.id, quantity: '1' }] }, { error: 'INPUT' })
    assert.equal(nested.details.field, 'components')
    assert.deepEqual(await domain(), retained, 'a task-within-task edit preserves the exact retained task and other records')
    await h.command('service.save', { ...currentTask, version: 0, unitPrice: '99.00' }, { error: 'STALE' })
    assert.deepEqual(await domain(), retained, 'stale task edits change nothing')
    for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent]) {
      await person.run('service.save', { ...currentTask, unitPrice: '99.00' }, { error: 'FORBIDDEN' })
      assert.deepEqual(await domain(), retained, 'excluded roles cannot change task costs or prices')
    }
    await h.restart()
    assert.deepEqual(await figures(), expected, 'actual Worker restart retains component identities, quantities, recalculated costs and fixed prices')
    assert.deepEqual(await domain(), retained)
    const creation = saved.find(x => x.record.id === task.id)
    assert.deepEqual(await h.command('service.save', taskPayload, { commandId: creation.commandId }), creation.record)
    assert.deepEqual(await domain(), retained, 'replaying the original save cannot roll back current component costs')
    await b.office.run('service.save', taskPayload, { commandId: creation.commandId, error: 'FORBIDDEN' })
    assert.deepEqual(await domain(), retained, 'replay still checks current authority')
    await h.command('role.set', { operatorId: b.office.id, role: 'owner' })
    const promotedCommandId = id()
    const promotedPayload = { ...currentTask, unitPrice: '42.00' }
    const promoted = await b.office.run('service.save', promotedPayload, { commandId: promotedCommandId })
    saved.push({ commandId: promotedCommandId, record: promoted, actorId: b.office.id, actorName: 'Olu Office' })
    await h.command('role.set', { operatorId: b.office.id, role: 'office' })
    const afterWithdrawal = await domain()
    await b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
    assert.deepEqual(await domain(), afterWithdrawal, 'withdrawn Owner authority cannot replay its prior authorized save')
    await h.restart()
    assert.deepEqual(await domain(), afterWithdrawal, 'restart retains the last authorized save and current role')
    await b.office.run('service.save', promotedPayload, { commandId: promotedCommandId, error: 'FORBIDDEN' })
    assert.deepEqual(await domain(), afterWithdrawal)
    assert.deepEqual(await figures(), expected)

    const activity = await h.request('/api/glove/activity').then(r => r.json())
    const download = await h.request('/api/glove/export').then(r => r.json())
    for (const { commandId, record, actorId = owner.id, actorName = 'Olivia Owner' } of saved) {
      const events = activity.events.filter(e => e.commandId === commandId && e.kind === 'service.saved')
      assert.equal(events.length, 1, 'save and replay retain one attributable event')
      const event = events[0]
      const summary = 'Price book: ' + record.code + ' ' + record.name + ' at $' + record.unitPrice + ' before tax (cost $' + record.unitCost + ')'
      assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.subjectKind, event.subjectId, event.summary], [actorId, actorName, 'owner', at, 'service', record.id, summary])
      const exported = download.timeline.find(e => e.id === event.id)
      assert.deepEqual([exported.actor_id, exported.actor_name, exported.actor_role, exported.at, exported.command_id, exported.subject_id, exported.summary], [actorId, actorName, 'owner', at, commandId, record.id, summary])
    }
    for (const [itemId] of expected) assert.deepEqual(download.services.find(x => x.id === itemId), afterWithdrawal.services.find(x => x.id === itemId), 'business download retains exact task and component records')
  }

  // Exercise every native item kind under both pricing rules in one category.
  // These expected cents are independent of the price-book calculations.
  {
    const category = 'Native pricing'
    await h.command('pricebook.category', { name: category, markupPercent: '50' })
    const save = payload => h.command('service.save', payload)
    const service = await save({ code: 'synthetic-glove-6', name: 'Inspection labor', kind: 'service', category, pricing: 'fixed', unitCost: '0.01', unitPrice: '0.10', description: 'Fixed inspection labor' })
    const markedService = await save({ code: 'synthetic-glove-7', name: 'Diagnostic labor', kind: 'service', category, pricing: 'markup', unitCost: '0.03', description: 'Diagnostic labor at the agreed rate' })
    const material = await save({ code: 'synthetic-glove-8', name: 'Valve seal', kind: 'material', category, pricing: 'fixed', unitCost: '0.01', unitPrice: '0.30', description: 'Replacement valve seal' })
    const markedMaterial = await save({ code: 'synthetic-glove-9', name: 'Copper fitting', kind: 'material', category, pricing: 'markup', unitCost: '0.03', description: 'Replacement copper fitting' })
    const components = [{ serviceId: service.id, quantity: '0.5' }, { serviceId: markedMaterial.id, quantity: '0.5' }]
    const task = await save({ code: 'synthetic-glove-10', name: 'Seal replacement', kind: 'task', category, pricing: 'fixed', unitPrice: '1.10', components, description: 'Seal and fitting replacement with labor included' })
    const markedTask = await save({ code: 'synthetic-glove-11', name: 'Fitting replacement', kind: 'task', category, pricing: 'markup', components, description: 'Fitting replacement with labor included' })
    const originals = [service, markedService, material, markedMaterial, task, markedTask]
    const records = async () => {
      const state = await h.state()
      return originals.map(item => state.services.find(x => x.id === item.id))
    }
    const figures = async () => (await records()).map(x => [x.kind, x.pricing, x.unitCost, x.unitPrice])
    assert.deepEqual(await figures(), [
      ['service', 'fixed', '0.01', '0.10'], ['service', 'markup', '0.03', '0.05'],
      ['material', 'fixed', '0.01', '0.30'], ['material', 'markup', '0.03', '0.05'],
      ['task', 'fixed', '0.03', '1.10'], ['task', 'markup', '0.03', '0.05'],
    ], 'all three kinds support fixed and category markup prices; half cents round up')
    const beforeInvalid = await domain()
    await h.command('service.save', { ...service, kind: 'bundle' }, { error: 'INPUT' })
    assert.deepEqual(await domain(), beforeInvalid, 'an unsupported kind cannot change the catalogue')
    const adjusted = await h.command('pricebook.adjust', { category, percent: '5' })
    assert.deepEqual(adjusted.items.map(x => [x.id, x.unitPrice]).sort(), [[service.id, '0.11'], [material.id, '0.32'], [task.id, '1.16']].sort(), 'only fixed prices in the chosen category change, including exact half-cent increases')
    assert.deepEqual((await domain()).services.filter(x => x.category !== category), beforeInvalid.services.filter(x => x.category !== category), 'bulk pricing preserves every record in other categories')
    assert.deepEqual(await figures(), [
      ['service', 'fixed', '0.01', '0.11'], ['service', 'markup', '0.03', '0.05'],
      ['material', 'fixed', '0.01', '0.32'], ['material', 'markup', '0.03', '0.05'],
      ['task', 'fixed', '0.03', '1.16'], ['task', 'markup', '0.03', '0.05'],
    ], 'a bulk increase leaves markup prices following cost')
    await save({ ...(await records())[1], unitCost: '0.05' })
    await save({ ...(await records())[3], unitCost: '0.05' })
    assert.deepEqual(await figures(), [
      ['service', 'fixed', '0.01', '0.11'], ['service', 'markup', '0.05', '0.08'],
      ['material', 'fixed', '0.01', '0.32'], ['material', 'markup', '0.05', '0.08'],
      ['task', 'fixed', '0.04', '1.16'], ['task', 'markup', '0.04', '0.06'],
    ], 'cost edits immediately reprice services, materials and their dependent tasks')
    await h.command('pricebook.category', { name: category, markupPercent: '100' })
    const expected = [
      ['service', 'fixed', '0.01', '0.11'], ['service', 'markup', '0.05', '0.10'],
      ['material', 'fixed', '0.01', '0.32'], ['material', 'markup', '0.05', '0.10'],
      ['task', 'fixed', '0.04', '1.16'], ['task', 'markup', '0.04', '0.08'],
    ]
    assert.deepEqual(await figures(), expected, 'category markup edits recompute every markup price and preserve every fixed price')
    const pricedItems = await records()
    const pricedLines = pricedItems.map(item => ({ serviceId: item.id, description: item.name, quantity: '1', unitPrice: item.unitPrice }))
    let frozen = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Native price-book work', lines: pricedLines })
    frozen = await b.dispatcher.run('quote.approve', { quoteId: frozen.id, version: frozen.version, revision: 1 })
    const oldLines = structuredClone(frozen.revisions[0].lines)
    assert.deepEqual(oldLines.map(x => [x.serviceId, x.quantity, x.unitPrice, x.unitCost, x.customerDescription]), [
      [service.id, '1', '0.11', '0.01', 'Fixed inspection labor'],
      [markedService.id, '1', '0.10', '0.05', 'Diagnostic labor at the agreed rate'],
      [material.id, '1', '0.32', '0.01', 'Replacement valve seal'],
      [markedMaterial.id, '1', '0.10', '0.05', 'Replacement copper fitting'],
      [task.id, '1', '1.16', '0.04', 'Seal and fitting replacement with labor included'],
      [markedTask.id, '1', '0.08', '0.04', 'Fitting replacement with labor included'],
    ])
    const link = await h.command('quote.link', { quoteId: frozen.id, version: frozen.version })
    const document = async () => {
      const response = await h.request('/api/glove/public/quote', { as: '', headers: { authorization: `Bearer ${link.token}` } })
      assert.equal(response.status, 200)
      return (await response.json()).document
    }
    const customerDocument = await document()
    const descriptions = ['Fixed inspection labor', 'Diagnostic labor at the agreed rate', 'Replacement valve seal', 'Replacement copper fitting', 'Seal and fitting replacement with labor included', 'Fitting replacement with labor included']
    assert.deepEqual(customerDocument.options[0].lines.map(x => x.customerDescription), descriptions)
    assert.ok(customerDocument.options[0].lines.every(x => !('unitCost' in x)), 'customer descriptions never disclose internal costs')
    // Later catalogue edits affect newly priced lines, never an existing quote.
    await save({ ...(await records())[0], unitCost: '0.09', unitPrice: '0.90', description: 'Later inspection description' })
    await save({ ...(await records())[1], unitCost: '0.20', description: 'Later diagnostic description' })
    await save({ ...(await records())[2], unitCost: '0.07', unitPrice: '0.70', description: 'Later seal description' })
    await save({ ...(await records())[3], unitCost: '0.30', description: 'Later fitting description' })
    const liveItems = await records()
    assert.deepEqual(liveItems.map(x => [x.unitCost, x.unitPrice]), [['0.09', '0.90'], ['0.20', '0.40'], ['0.07', '0.70'], ['0.30', '0.60'], ['0.20', '1.16'], ['0.20', '0.40']])
    assert.deepEqual((await h.state()).quotes.find(x => x.id === frozen.id).revisions[0].lines, oldLines)
    assert.deepEqual(await document(), customerDocument, 'the actual customer document preserves the agreed descriptions and prices')
    const fresh = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'New catalogue prices', lines: liveItems.map(item => ({ serviceId: item.id, description: item.name, quantity: '1', unitPrice: item.unitPrice })) })
    assert.deepEqual(fresh.revisions[0].lines.map(x => x.unitCost), ['0.09', '0.20', '0.07', '0.30', '0.20', '0.20'], 'newly priced lines take current costs without changing earlier lines')
    frozen = await b.dispatcher.run('quote.accept', { quoteId: frozen.id, version: frozen.version, revision: 1, method: 'phone', customerName: b.customer.name })
    const job = await b.dispatcher.run('job.create', { quoteId: frozen.id })
    assert.deepEqual(job.lines, oldLines, 'accepted work retains the originally priced cost and customer descriptions')
    const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-05', start: '09:00', end: '10:00' })
    await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
    await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed native price-book work', signoff: { absentReason: 'Customer left before completion' } })
    let invoice = await b.office.run('invoice.prepare', { jobId: job.id })
    invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    const invoiceDocument = async () => {
      const response = await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: b.office.cookie })
      assert.equal(response.status, 200)
      return response.json()
    }
    assert.deepEqual((await invoiceDocument()).lines.map(x => x.customerDescription), descriptions)
    const preview = await h.command('customer.hubPreview', { customerId: b.customer.id })
    assert.deepEqual(preview.quotes.find(x => x.id === frozen.id).lines.map(x => x.customerDescription), descriptions)
    assert.deepEqual(preview.invoices.find(x => x.id === invoice.id).lines.map(x => x.customerDescription), descriptions)
    await h.restart()
    assert.deepEqual(await records(), liveItems, 'restart retains all six kinds and pricing combinations')
    assert.deepEqual((await h.state()).quotes.find(x => x.id === frozen.id).revisions[0].lines, oldLines, 'restart retains original line costs independently of current catalogue costs')
    assert.deepEqual((await invoiceDocument()).lines.map(x => x.customerDescription), descriptions)
    const downloaded = await h.request('/api/glove/export').then(r => r.json())
    assert.deepEqual(downloaded.quotes.find(x => x.id === frozen.id).revisions[0].lines, oldLines)
    const activity = await h.request('/api/glove/activity').then(r => r.json())
    for (const kind of ['pricebook.category', 'pricebook.adjusted', 'quote.drafted', 'quote.approved', 'quote.accepted']) {
      const event = activity.events.find(x => x.kind === kind)
      assert.ok(event && event.actorId && event.actorRole && event.commandId)
      const exported = downloaded.timeline.find(x => x.id === event.id)
      assert.deepEqual([exported.actor_id, exported.actor_role, exported.command_id, exported.at, exported.summary], [event.actorId, event.actorRole, event.commandId, event.at, event.summary])
    }
  }

})


test('MONEY-003, MONEY-006 exports honor current margin permission while retaining a usable price catalogue and full owner costs', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const part = await h.command('service.save', { code: 'COST-BOUNDARY', name: 'Pump', kind: 'material', unitCost: '137.29', unitPrice: '400.00' })
  const quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Pump replacement', lines: [{ serviceId: part.id, description: part.name, unitPrice: part.unitPrice, quantity: '1' }] })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: b.customer.name })
  const job = await b.dispatcher.run('job.create', { quoteId: quote.id })
  const warehouse = await b.office.run('stock.location', { kind: 'warehouse', name: 'Warehouse' })
  await b.office.run('po.save', { supplier: 'Supply Co', locationId: warehouse.id, jobId: job.id, lines: [{ serviceId: part.id, quantity: '1' }] })
  await b.office.run('expense.record', { jobId: job.id, category: 'supply-house purchase', vendor: 'Supply Co', description: 'Freight', amount: '42.00', billable: false })
  const permissions = ['export.read', 'quote.draft', 'quote.revise']
  let role = await h.command('role.save', { name: 'Catalogue exporter', permissions })
  const exporter = await h.person('Cat Exporter', `custom:${role.id}`)
  const commandId = id(), payload = { customerId: b.customer.id, siteId: b.site.id, title: 'Restricted role quote', lines: [{ serviceId: part.id, description: part.name, unitPrice: part.unitPrice, quantity: '1' }] }
  const drafted = await exporter.run('quote.draft', payload, { commandId })
  assert.equal(drafted.revisions[0].lines[0].unitCost, undefined, 'drafting prices grants no margin read')
  assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'saved quote outcomes follow margin visibility too')
  const stale = await exporter.run('quote.revise', { quoteId: drafted.id, version: 0, lines: payload.lines }, { error: 'STALE' })
  assert.equal(stale.details.record.revisions[0].lines[0].unitCost, undefined, 'stale quote error records do not expose costs')
  const readCsv = async as => {
    const response = await h.request('/api/glove/pricebook.csv', { as })
    assert.equal(response.status, 200)
    const text = await response.text()
    const { parseCsv } = await import('../../src/glove/csv-format.ts')
    const [headers, ...rows] = parseCsv(text)
    return { headers, rows: rows.map(r => Object.fromEntries(headers.map((key, i) => [key, r[i]]))) }
  }
  const readExport = async as => {
    const response = await h.request('/api/glove/export', { as })
    assert.equal(response.status, 200)
    return response.json()
  }
  const restricted = async () => {
    const catalogue = await readCsv(exporter.cookie)
    assert.ok(!catalogue.headers.includes('Unit cost'), 'restricted catalogue omits costs, rather than fabricating zero')
    const item = catalogue.rows.find(r => r.Code === part.code)
    assert.equal(item.Name, part.name)
    assert.equal(item.Price, '400.00')
    const data = await readExport(exporter.cookie)
    assert.equal(data.services.find(r => r.id === part.id).unitCost, undefined)
    assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, undefined)
    assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, undefined)
    assert.deepEqual(data.purchaseOrders, [])
    assert.deepEqual(data.expenses, [])
    assert.ok(!data.timeline.some(e => ['purchaseOrder', 'expense', 'warning'].includes(e.subject_kind)))
    assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitPrice, '400.00')
    assert.ok(data.timeline.some(e => e.kind === 'job.created'), 'permitted business history remains exportable')
  }
  await restricted()
  for (const as of [h.owner(), b.office.cookie]) {
    assert.equal((await readCsv(as)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
    const data = await readExport(as)
    assert.equal(data.services.find(r => r.id === part.id).unitCost, '137.29')
    assert.equal(data.quotes.find(r => r.id === quote.id).revisions[0].lines[0].unitCost, '137.29')
    assert.equal(data.jobs.find(r => r.id === job.id).lines[0].unitCost, '137.29')
    assert.equal(data.purchaseOrders[0].lines[0].unitCost, '137.29')
  }
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: [...permissions, 'reports.read'] })
  assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, '137.29', 'granting reports reveals the original retained cost on replay')
  assert.equal((await readCsv(exporter.cookie)).rows.find(r => r.Code === part.code)['Unit cost'], '137.29')
  assert.equal((await readExport(exporter.cookie)).services.find(r => r.id === part.id).unitCost, '137.29')
  role = await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions })
  assert.equal((await exporter.run('quote.draft', payload, { commandId })).revisions[0].lines[0].unitCost, undefined, 'removing reports hides retained quote costs again')
  await restricted()
  await h.command('role.save', { id: role.id, version: role.version, name: role.name, permissions: ['reports.read'] })
  for (const door of ['/api/glove/pricebook.csv', '/api/glove/export']) assert.equal((await h.request(door, { as: exporter.cookie })).status, 403, 'reports.read alone grants no export')
})
