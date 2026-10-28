// Move-in undo is destructive, so it gets its own proof: it never removes a
// record that later Glove work depends on, and never overwrites a later edit.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { installation, business } from './harness.mjs'
import { serviceM8Balances, serviceM8Equipment } from '../fixtures/servicem8-balances.mjs'

const fixture = 'tests/fixtures/servicem8-small-hvac/'
const files = async () => Promise.all(['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment'].map(async kind => ({ name: `${kind}.json`, text: await readFile(`${fixture}${kind}.json`, 'utf8') })))

async function moveIn(h) {
  const staged = await h.command('import.stage', { files: await files() })
  return h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
}

async function retainedImportText(h) {
  const journalRows = []
  for (const table of ['ik_jobs', 'ik_d1_plan_chunks', 'ik_sources', 'ik_provenance', 'ik_d1_history']) journalRows.push(...(await h.db.prepare(`SELECT * FROM ${table}`).all()).results)
  const originalRows = (await h.db.prepare('SELECT * FROM ik_originals').all()).results
  for (const original of originalRows) {
    const chunks = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks WHERE job_id=? AND kind=? AND original_key=? ORDER BY ordinal').bind(original.job_id, original.kind, original.original_key).all()).results
    journalRows.push(chunks.length ? Buffer.from(chunks.map(c => c.bytes).join(''), 'base64').toString() : Buffer.from(original.bytes ?? '').toString())
  }
  return JSON.stringify(journalRows)
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

test('ServiceM8 opening balances and equipment retain customer custody, reject mismatches, and preserve native edits on undo', async t => {
  const h = await installation(); t.after(() => h.close()); await business(h)
  const files = await serviceM8Equipment()
  const staged = await h.command('import.stage', { files, balanceAsOf: '2026-10-22' })
  assert.deepEqual(staged.preview.rejections, [])
  assert.equal((await h.state()).invoices.length, 0, 'preview creates no invoice')
  const batch = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), invoice = state.invoices.find(i => i.source?.system === 'ServiceM8')
  assert.deepEqual([invoice.openingBalance.amount, invoice.openingBalance.sourceTotal, invoice.openingBalance.asOf, invoice.openingBalance.notForPosting, invoice.revisions[0].approval], ['76.50', '201.85', '2026-10-22', true, null])
  assert.equal(state.payments.length, 0, 'historical payments are not new Glove receipts')
  await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
  const aging = await h.request('/api/glove/reports/receivables.json?asOf=2026-10-22').then(r => r.json())
  assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
  const again = await h.command('import.stage', { files, balanceAsOf: '2026-10-22' })
  await h.command('import.commit', { batchId: again.id, version: again.version, fingerprint: again.preview.fingerprint })
  assert.equal((await h.state()).invoices.length, 1)
  assert.equal(state.equipment.length, 2)
  const unit = state.equipment.find(e => e.source.id === 'synthetic-glove-asset-1')
  assert.deepEqual([unit.type, unit.make, unit.model, unit.serial, unit.installedOn, unit.manufacturerWarrantyUntil, unit.laborWarrantyUntil, unit.location], ['Heat pump', 'Synthetic maker', 'Synthetic unit', 'synthetic-glove-serial-1', '2025-10-01', '2028-10-01', '2027-10-01', 'Synthetic plant room'])
  assert.equal(unit.siteId, state.jobs.find(j => j.id === invoice.jobId).siteId)
  assert.deepEqual((await h.state()).equipment, state.equipment, 'unchanged replay retains exactly the two source units')
  const equipmentRead = await h.request(`/api/glove/equipment/${unit.id}`).then(r => r.json())
  assert.equal(equipmentRead.equipment.serial, 'synthetic-glove-serial-1')
  for (const [label, change, reason] of [
    ['no site choice', fs => fs.filter(f => f.name !== 'equipment-map.json'), /exactly one reviewed/],
    ['missing asset type', fs => fs.filter(f => f.name !== 'assettype.json'), /asset type/],
    ['duplicate site choices', fs => { const f = fs.find(f => f.name === 'equipment-map.json'), rows = JSON.parse(f.text); rows.push(rows[0]); f.text = JSON.stringify(rows); return fs }, /exactly one reviewed/],
    ['wrong customer', fs => { const f = fs.find(f => f.name === 'equipment-map.json'), rows = JSON.parse(f.text); rows[0].job_uuid = rows[1].job_uuid; f.text = JSON.stringify(rows); return fs }, /same exported customer/],
    ['missing field', fs => { const f = fs.find(f => f.name === 'equipment-map.json'), rows = JSON.parse(f.text); rows[0].fields.serial = 'synthetic-glove-absent'; f.text = JSON.stringify(rows); return fs }, /absent from this source/],
    ['invalid date', fs => { const f = fs.find(f => f.name === 'asset.json'), rows = JSON.parse(f.text); rows[0].field_data[3].fieldValue = '2025-02-30'; f.text = JSON.stringify(rows); return fs }, /date/],
  ]) {
    const review = await h.command('import.stage', { files: change(await serviceM8Equipment()), balanceAsOf: '2026-10-22' })
    assert.ok(review.preview.rejections.some(r => r.kind === 'asset' && reason.test(r.reason)), label)
  }
  const custody = JSON.parse((await h.command('privacy.export', { customerId: unit.customerId, version: state.customers.find(c => c.id === unit.customerId).version })).download)
  const assets = JSON.parse(Buffer.from(custody.importOriginals.find(f => f.name === 'asset.json').bytes, 'base64').toString())
  assert.deepEqual(assets.map(a => a.uuid), ['synthetic-glove-asset-1'])
  const crosswalk = JSON.parse(Buffer.from(custody.importOriginals.find(f => f.name === 'equipment-map.json').bytes, 'base64').toString())
  assert.deepEqual(crosswalk.map(a => a.uuid), ['synthetic-glove-asset-1'])
  assert.ok(!JSON.stringify(custody).includes('synthetic-glove-peer-serial'))
  await h.command('equipment.save', { id: unit.id, version: unit.version, siteId: unit.siteId, type: unit.type, serial: 'synthetic-glove-corrected-serial' })
  await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Keep the corrected equipment' }, { error: 'NATIVE_EDIT_CONFLICT' })
  assert.equal((await h.state()).equipment.find(e => e.id === unit.id).serial, 'synthetic-glove-corrected-serial')
  const customer = state.customers.find(c => c.name === 'Rozelle Physio')
  await h.command('customer.save', { id: customer.id, version: customer.version, name: 'Rozelle Physio & Pilates', email: 'grace@rozellephysio.example' })
  const conflict = await h.command('import.undo', { batchId: batch.id, version: (await h.state()).imports.find(i => i.id === batch.id).version, reason: 'Back out' }, { error: 'NATIVE_EDIT_CONFLICT' })
  assert.match(conflict.message, /changed in Glove/)
  assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Rozelle Physio & Pilates')
  assert.equal((await h.state()).imports.find(i => i.id === batch.id).status, 'committed')

  const rejected = await installation(); t.after(() => rejected.close()); await business(rejected)
  for (const [label, change, reason] of [
    ['missing payment list', files => files.filter(f => f.name !== 'jobpayment.json'), /complete jobpayment/],
    ['malformed payment', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows[0].amount = 'invalid'; f.text = JSON.stringify(rows); return files }, /source payment amount/],
    ['overpayment', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows[0].amount = '300.00'; f.text = JSON.stringify(rows); return files }, /payments exceed/],
    ['duplicate payment identity', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows.push(rows[0]); f.text = JSON.stringify(rows); return files }, /payment identity occurs more than once/],
    ['payment beyond snapshot', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows[0].timestamp = '2026-10-23 10:00:00'; f.text = JSON.stringify(rows); return files }, /later than the balance snapshot/],
    ['invalid payment seconds', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows[0].timestamp = '2026-08-15 10:00:99'; f.text = JSON.stringify(rows); return files }, /complete recorded timestamp/],
    ['invalid payment timestamp', files => { const f = files.find(f => f.name === 'jobpayment.json'), rows = JSON.parse(f.text); rows[0].timestamp = '2026-08-15 garbage'; f.text = JSON.stringify(rows); return files }, /complete recorded timestamp/],
    ['inconsistent full-payment flag', files => { const f = files.find(f => f.name === 'job.json'), rows = JSON.parse(f.text); rows[0].payment_received = 1; f.text = JSON.stringify(rows); return files }, /disagrees with payment_received/],
  ]) {
    const preview = await rejected.command('import.stage', { files: change(await serviceM8Balances()), balanceAsOf: '2026-10-22' })
    assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && reason.test(r.reason)), label)
    assert.equal((await rejected.state()).invoices.length, 0)
  }
  const invalid = await serviceM8Equipment(), jobFile = invalid.find(f => f.name === 'job.json'), jobs = JSON.parse(jobFile.text)
  jobs[0].total_invoice_amount = '999.00'; jobFile.text = JSON.stringify(jobs)
  const preview = await rejected.command('import.stage', { files: invalid, balanceAsOf: '2026-10-22' })
  assert.ok(preview.preview.rejections.some(r => r.kind === 'job' && /total does not match/.test(r.reason)))
  await rejected.command('import.commit', { batchId: preview.id, version: preview.version, fingerprint: preview.preview.fingerprint })
  const after = await rejected.state(), owner = after.customers.find(c => c.source?.id === jobs[0].company_uuid)
  assert.ok(!after.jobs.some(j => j.source?.id === jobs[0].uuid))
  assert.equal(after.invoices.length, 0)
  const exported = JSON.parse((await rejected.command('privacy.export', { customerId: owner.id, version: owner.version })).download)
  const original = exported.importOriginals.find(f => f.name === 'jobpayment.json')
  assert.ok(original, 'privacy export must include retained source payment history for the customer of a rejected job')
  assert.deepEqual(JSON.parse(Buffer.from(original.bytes, 'base64').toString()).map(p => p.uuid).sort(), ['synthetic-glove-payment-1', 'synthetic-glove-payment-inactive'])
  assert.ok(exported.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'Synthetic retained payment attachment bytes'), 'rejected-job payment originals remain exportable')
  assert.ok(!JSON.stringify(exported).includes('Synthetic peer payment note'))
  const peer = after.customers.find(c => c.source?.id === jobs[2].company_uuid)
  const peerExport = JSON.parse((await rejected.command('privacy.export', { customerId: peer.id, version: peer.version })).download)
  const peerPayments = peerExport.importOriginals.find(f => f.name === 'jobpayment.json')
  assert.deepEqual(JSON.parse(Buffer.from(peerPayments.bytes, 'base64').toString()).map(p => p.uuid), ['synthetic-glove-payment-peer'])
  const erasure = await rejected.command('privacy.preview', { customerId: owner.id, version: owner.version })
  await rejected.command('privacy.erase', { customerId: owner.id, version: owner.version, confirm: 'ERASE', fingerprint: erasure.fingerprint })
  const journal = await retainedImportText(rejected)
  assert.ok(!journal.includes('Synthetic owned asset'))
  assert.ok(!journal.includes('synthetic-glove-serial-1'))
  assert.equal((await rejected.state()).equipment.some(e => e.serial === 'synthetic-glove-peer-serial'), true)
  assert.ok(!journal.includes('Synthetic retained payment note'))
  assert.ok(!journal.includes('Synthetic inactive payment note'))
  assert.ok(!journal.includes('Synthetic retained payment attachment bytes'))
  assert.ok(!journal.includes(Buffer.from('Synthetic retained payment attachment bytes').toString('base64')))
  const remaining = JSON.parse((await rejected.command('privacy.export', { customerId: peer.id, version: peer.version })).download)
  assert.ok(JSON.stringify(remaining).includes('Synthetic peer payment note'))
  assert.ok(JSON.stringify(remaining).includes('synthetic-glove-peer-serial'))
})

test('MOVE-001 Jobber saved responses and product CSV preview, retain recurring visits, repeat without duplicates and undo while keeping native work', async t => {
  const h = await installation(); t.after(() => h.close()); const b = await business(h)
  const files = await exportedFixture('jobber'), before = await h.state()
  await b.office.run('import.stage', { format: 'jobber', files }, { error: 'FORBIDDEN' })
  const stage = input => h.command('import.stage', { format: 'jobber', files: input, balanceAsOf: '2026-10-22' })
  const staged = await stage(files)
  assert.deepEqual(staged.preview.rejections, [])
  assert.ok(staged.preview.unmappedFields.clients.includes('contacts'))
  assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
  assert.ok(staged.preview.unmappedFields.jobs.some(f => f.includes('recurrence:')))
  assert.deepEqual(staged.preview.missingAttachments.map(a => a.name).sort(), ['Balance confirmation.pdf', 'Warranty conditions.pdf'])
  assert.equal((await h.state()).jobs.length, before.jobs.length, 'preview is inert')
  for (const file of files) {
    const { createHash } = await import('node:crypto')
    const bytes = Buffer.from(file.text ?? file.base64, file.text === undefined ? 'base64' : 'utf8'), summary = staged.fileSummary.find(f => f.name === file.name)
    assert.equal(summary.size, bytes.length)
    assert.equal(summary.sha256, createHash('sha256').update(bytes).digest('hex'))
  }
  const committed = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), imported = kind => state[kind].filter(r => (r.importSource ?? r.source)?.system === 'Jobber')
  assert.equal(imported('customers')[0].source.id, 'synthetic-glove-client')
  assert.equal(imported('sites')[0].customerId, imported('customers')[0].id)
  assert.deepEqual(imported('customers')[0].contacts.map(c => [c.sourceId, c.email, c.phone, c.sourceContactId]), [['synthetic-glove-email', 'synthetic-glove-1@example.test', '', 'synthetic-glove-contact'], ['synthetic-glove-phone', '', '+15125550123', 'synthetic-glove-contact']])
  assert.equal(imported('jobs').find(j => j.source.id === 'synthetic-glove-job-2').status, 'archived')
  assert.equal(imported('enquiries')[0].customerId, imported('customers')[0].id)
  assert.equal(imported('technicians')[0].operatorId, null)
  assert.equal(imported('jobs')[0].importedRecurrence.active, false)
  assert.equal(imported('jobs')[0].series, undefined)
  assert.equal(imported('jobs')[0].importedRecurrence.source.calendarRule, 'synthetic-glove-source-rule')
  const pending = imported('captures').find(c => c.kind === 'source-visit')
  assert.equal(pending.importedVisitId, 'synthetic-glove-unscheduled')
  assert.equal(pending.title, 'Synthetic pending inspection')
  assert.equal(pending.instructions, 'Call before arranging a date')
  assert.equal(pending.sourceComplete, false)
  assert.equal(pending.deviceTime, null)
  assert.equal(pending.jobId, imported('jobs')[0].id)

  const sourceQuote = imported('quotes')[0]
  assert.equal(sourceQuote.source.id, 'synthetic-glove-quote')
  assert.equal(sourceQuote.customerId, imported('customers')[0].id)
  assert.equal(sourceQuote.siteId, imported('sites')[0].id)
  assert.equal(sourceQuote.importedStatus, 'approved')
  assert.equal(sourceQuote.status, 'imported')
  assert.equal(sourceQuote.acceptance, null)
  assert.equal(sourceQuote.revisions[0].approval, null)
  assert.equal(sourceQuote.revisions[0].totals.total, '205.68')
  assert.equal(sourceQuote.revisions[0].lines[0].sourceId, 'synthetic-glove-quote-line')
  assert.equal(sourceQuote.revisions[0].lines[1].total, '-10.00')
  assert.equal(sourceQuote.importedTerms, 'Synthetic source terms')
  assert.deepEqual(sourceQuote.importedTextRows, [{ sourceId: 'synthetic-glove-quote-text-1', position: 1, name: 'Before the visit', description: 'Please clear access to the outdoor unit.' }])
  for (const type of ['quote.approve','quote.revise','quote.markSent','quote.accept','quote.decline']) await h.command(type, { quoteId: sourceQuote.id, version: sourceQuote.version, revision: 1 }, { error: 'IMPORTED_QUOTE' })
  await h.command('document.photo', { kind: 'quote', id: sourceQuote.id, version: sourceQuote.version }, { error: 'IMPORTED_QUOTE' })
  await h.command('quote.link', { quoteId: sourceQuote.id, version: sourceQuote.version }, { error: 'NOT_APPROVED' })
  const note = imported('captures').find(c => c.kind === 'note')
  assert.equal(note.text, 'Synthetic Jobber job note')
  assert.equal(note.importedNoteId, 'synthetic-glove-note')
  assert.equal(note.jobId, imported('jobs')[0].id)
  assert.equal(note.deviceTime, '2026-10-01T08:00:00Z')
  assert.equal(note.receivedAt, null)
  const attachment = imported('captures').find(c => c.kind === 'attachment')
  assert.equal(attachment.name, 'Synthetic source attachment.txt')
  assert.equal(attachment.importedAttachmentId, 'synthetic-glove-attachment')
  assert.equal(attachment.importedNoteId, note.importedNoteId)
  assert.equal(attachment.bytes.status, 'retained')
  assert.ok(!JSON.stringify(attachment).includes('https:'), 'no remote URL becomes a native fetch target')
  const original = await h.db.prepare('SELECT * FROM ik_originals WHERE sha256=?').bind(attachment.bytes.sha256).first()
  assert.ok(original, 'exact attachment bytes are in journal custody')
  const chunks = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks WHERE job_id=? AND kind=? AND original_key=? ORDER BY ordinal').bind(original.job_id, original.kind, original.original_key).all()).results
  const kept = chunks.length ? Buffer.from(chunks.map(c => c.bytes).join(''), 'base64') : Buffer.from(original.bytes)
  assert.equal(kept.toString(), 'synthetic-glove-attachment\n')
  assert.equal((await stage(files.filter(f => !f.base64))).preview.missingAttachments.length, 4)

  const sourceCustomer = imported('customers')[0], sourceRequest = imported('enquiries')[0]
  for (const [row, type, ownerKind, sourceId, time] of [
    [sourceCustomer, 'ClientNote', 'clients', 'synthetic-glove-client', '2026-09-29T09:15:00-05:00'],
    [sourceRequest, 'RequestNote', 'requests', 'synthetic-glove-request', '2026-09-30T10:00:00-05:00'],
    [sourceQuote, 'QuoteNote', 'quotes', 'synthetic-glove-quote', '2026-10-01T11:30:00-05:00'],
    [imported('invoices')[0], 'InvoiceNote', 'invoices', 'synthetic-glove-invoice', '2026-10-02T15:45:00-05:00'],
  ]) {
    assert.equal(row.importedNotes.length, 1, 'inherited notes stay only on their owning record')
    assert.equal(row.importedNotes[0].sourceType, type)
    assert.deepEqual(row.importedNotes[0].owner, { kind: ownerKind, sourceId })
    assert.equal(row.importedNotes[0].sourceTime, time)
    assert.equal(row.importedAttachments.length, ownerKind === 'requests' ? 0 : 1)
    assert.ok(!JSON.stringify(row.importedAttachments).includes('https:'), 'no source URL becomes a native fetch target')
  }
  assert.equal(sourceCustomer.importedAttachments[0].bytes.status, 'retained')
  assert.equal(sourceQuote.importedAttachments[0].bytes.status, 'missing')
  assert.deepEqual(imported('captures').filter(c => c.kind === 'note').map(c => c.importedNoteId), ['synthetic-glove-note'])
  const clientOriginal = await h.db.prepare('SELECT * FROM ik_originals WHERE sha256=?').bind(sourceCustomer.importedAttachments[0].bytes.sha256).first()
  assert.ok(clientOriginal, 'private source attachment bytes are in journal custody')
  const clientChunks = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks WHERE job_id=? AND kind=? AND original_key=? ORDER BY ordinal').bind(clientOriginal.job_id, clientOriginal.kind, clientOriginal.original_key).all()).results
  assert.deepEqual(clientChunks.length ? Buffer.from(clientChunks.map(c => c.bytes).join(''), 'base64') : Buffer.from(clientOriginal.bytes), await readFile('tests/fixtures/jobber-movein/client-attachment.txt'))
  const sourceExport = await (await h.request('/api/glove/export')).json()
  assert.deepEqual(sourceExport.customers.find(c => c.id === sourceCustomer.id).importedNotes, sourceCustomer.importedNotes)
  assert.deepEqual(sourceExport.invoices.find(i => i.source?.system === 'Jobber').importedAttachments, imported('invoices')[0].importedAttachments)

  const changedNotes = (kind, change) => files.map(f => {
    if (f.name !== `${kind}.json`) return f
    const value = JSON.parse(f.text); change(value.data[kind].nodes[0])
    return { ...f, text: JSON.stringify(value) }
  })
  for (const [kind, change] of [
    ['clients', c => { c.notes.nodes[0].createdAt = '2026-09-29T09:15:00' }],
    ['clients', c => { c.noteAttachments.nodes[0].fileSize++ }],
    ['quotes', q => { q.notes.pageInfo.hasNextPage = true }],
    ['invoices', i => { i.noteAttachments.nodes[0].note.id = 'not-exported' }],
    ['jobs', j => { j.notes.nodes.find(n => n.__typename === 'ClientNote').message = 'Inconsistent inherited note' }],
  ]) assert.ok((await stage(changedNotes(kind, change))).preview.rejections.some(r => r.kind === kind), 'invalid source ownership, time or attachment evidence is refused')
  const absentOwner = changedNotes('clients', c => { c.notes.nodes = []; c.noteAttachments.nodes = [] })
  const absentReview = await stage(absentOwner)
  assert.ok(absentReview.preview.rejections.some(r => r.kind === 'jobs' && /exported clients owner/.test(r.reason)), 'an inherited note cannot be reassigned to a job when its source owner is missing')


  assert.deepEqual(imported('visits').map(v => [v.startAt, v.status]).sort(), [['2026-10-23T14:00:00.000Z','booked'],['2026-11-23T14:00:00.000Z','completed']])
  for (const visit of imported('visits')) { assert.equal(visit.jobId, imported('jobs')[0].id); assert.equal(visit.technicianId, imported('technicians')[0].id) }
  const invoice = imported('invoices')[0]
  assert.equal(invoice.source.id, 'synthetic-glove-invoice')
  assert.equal(invoice.jobId, imported('jobs')[0].id)
  assert.deepEqual(invoice.importedJobIds, imported('jobs').map(j => j.id))
  assert.equal(invoice.openingBalance.amount, '76.50')
  assert.equal(invoice.openingBalance.notForPosting, true)
  assert.equal(invoice.revisions[0].totals.total, '216.50')
  assert.equal(invoice.revisions[0].approval, null)
  assert.deepEqual(invoice.revisions[0].lines.map(l => [l.sourceId, l.description, l.quantity, l.unitPrice, l.total, l.tax]), [['synthetic-glove-line-1', 'Synthetic inspection, Source inspection detail', '2', '100.00', '200.00', 'TAXABLE']])
  assert.equal(invoice.sourceLinesUnavailable, undefined)
  const changedInvoice = change => files.map(f => {
    if (f.name !== 'invoices.json') return f
    const value = JSON.parse(f.text); change(value.data.invoices.nodes[0])
    return { ...f, text: JSON.stringify(value) }
  })
  for (const change of [
    i => { i.lineItems.nodes[0].totalPrice = 199.99 },
    i => { i.lineItems.nodes[0].quantity = 0 },
    i => { i.lineItems.nodes[0].taxable = null },
    i => { i.lineItems.nodes.push({ ...i.lineItems.nodes[0] }) },
    i => { i.lineItems.pageInfo.hasNextPage = true },
    i => { i.amounts.invoiceBalance = 76.49 },
    i => { i.amounts.total = 216.49 },
    i => { i.amounts.discountAmount = 1 },
    i => { i.jobs.nodes[1].id = 'synthetic-glove-absent' },
    i => { i.jobs.nodes.push(i.jobs.nodes[0]) },
  ]) assert.ok((await stage(changedInvoice(change))).preview.rejections.some(r => r.kind === 'invoices'), 'inconsistent or incomplete source money is rejected')
  const discounted = changedInvoice(i => {
    i.lineItems.nodes[0].quantity = 2.1; i.lineItems.nodes[0].totalPrice = 210
    i.amounts.subtotal = 210; i.amounts.discountAmount = 10
  })
  const discountedPreview = await stage(discounted)
  assert.deepEqual(discountedPreview.preview.rejections, [])
  const archivedFiles = files.map(f => f.name === 'jobs.json' ? { ...f, text: f.text.replace('ACTIVE', 'archived') } : f)
  const archivedPreview = await stage(archivedFiles)
  assert.deepEqual(archivedPreview.preview.rejections, [])

  const aging = await (await h.request('/api/glove/reports/receivables.json?asOf=2026-10-22')).json()
  assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
  await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
  const products = imported('services')
  assert.equal(products.length, 2)
  assert.deepEqual(products.map(p => [p.name, p.kind, p.unitPrice, p.unitCost, p.tax]).sort(), [['Synthetic inspection','service','100.00','25.00','TAXABLE'],['Synthetic replacement filter','material','10.00','3.00','FREE']])
  const again = await stage(files)
  assert.ok(again.preview.alreadyMovedIn > 0)
  await h.command('import.commit', { batchId: again.id, version: again.version, fingerprint: again.preview.fingerprint })
  const twice = await h.state()
  for (const kind of ['customers','sites','services','jobs','visits','enquiries','technicians','invoices','quotes','captures']) assert.equal(twice[kind].length, state[kind].length)
  const bad = files.map(f => f.name === 'visits.json' ? { ...f, text: f.text.replaceAll('synthetic-glove-job', 'synthetic-glove-absent') } : f)
  assert.equal((await stage(bad)).preview.rejections.filter(r => r.kind === 'visits').length, 3)
  const invalid = files.map(f => f.name === 'products-services.csv' ? { ...f, text: f.text.replace('100.00', 'not-money') } : f)
  assert.ok((await stage(invalid)).preview.rejections.some(r => r.kind === 'products-services'))
  const incomplete = files.map(f => f.name === 'visits.json' ? { ...f, text: f.text.replace(new RegExp('"hasNextPage"\\s*:\\s*false', 'g'), '"hasNextPage":true') } : f)
  assert.ok((await stage(incomplete)).preview.rejections.some(r => r.kind === 'visits'))
  const missingBalance = files.filter(f => f.name !== 'invoice-balances.csv')
  assert.ok((await stage(missingBalance)).preview.rejections.some(r => r.kind === 'invoices'))
  const archivedOnly = archivedFiles.filter(f => ['clients.json','properties.json','jobs.json','requests.json','quotes.json'].includes(f.name)).map(f => ({ ...f, text: f.text.replaceAll('synthetic-glove-', 'synthetic-glove-archived-') }))
  const closedStage = await stage(archivedOnly)
  assert.deepEqual(closedStage.preview.rejections, [])
  const closedBatch = await h.command('import.commit', { batchId: closedStage.id, version: closedStage.version, fingerprint: closedStage.preview.fingerprint })
  const closedJob = (await h.state()).jobs.find(j => j.source?.id === 'synthetic-glove-archived-job')
  assert.equal(closedJob.status, 'archived')
  await h.command('invoice.prepare', { jobId: closedJob.id }, { error: 'JOB_STATE' })
  await h.command('visit.book', { jobId: closedJob.id, technicianId: b.priya.id, date: '2026-10-26', start: '08:00', end: '09:00' }, { error: 'JOB_STATE' })
  await h.command('import.undo', { batchId: closedBatch.id, version: closedBatch.version, reason: 'Wrong closed snapshot' })
  for (const change of [
    q => { q.amounts.total = 205.67 },
    q => { q.lineItems.nodes[0].optional = true },
    q => { q.lineItems.nodes[0].totalPrice = 199.99 },
    q => { q.property.id = 'synthetic-glove-absent' },
    q => { q.lineItems.pageInfo.hasNextPage = true },
  ]) {
    const input = files.map(f => { if (f.name !== 'quotes.json') return f; const value = JSON.parse(f.text); change(value.data.quotes.nodes[0]); return { ...f, text: JSON.stringify(value) } })
    assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'quotes'))
  }
  for (const change of [n => { n.__typename = 'ClientNote' }, n => { n.createdAt = 'invalid' }]) {
    const input = files.map(f => { if (f.name !== 'jobs.json') return f; const value = JSON.parse(f.text); change(value.data.jobs.nodes[0].notes.nodes[0]); return { ...f, text: JSON.stringify(value) } })
    assert.ok((await stage(input)).preview.rejections.some(r => r.kind === 'jobs'))
  }
  const wrongAttachment = files.map(f => f.name === 'jobs.json' ? { ...f, text: JSON.stringify((() => { const v = JSON.parse(f.text); v.data.jobs.nodes[0].noteAttachments.nodes[0].fileSize = 999; return v })()) } : f)
  assert.ok((await stage(wrongAttachment)).preview.rejections.some(r => r.kind === 'jobs'))
  const native = await h.command('customer.save', { name: 'Synthetic native customer' })
  await h.command('import.undo', { batchId: committed.id, version: committed.version, reason: 'Wrong Jobber snapshot' })
  const undone = await h.state()
  for (const kind of ['sites','services','jobs','visits','enquiries','technicians','invoices','quotes','captures']) assert.equal(undone[kind].length, before[kind].length)
  assert.ok(undone.customers.some(c => c.id === native.id))
  assert.ok(!undone.customers.some(c => c.id === sourceCustomer.id), 'undo removes the owning private notes and attachment metadata with their imported customer')

  // Exercise assigned-field visibility through the real state door after proving undo.
  const privacyStage = await stage(files)
  await h.command('import.commit', { batchId: privacyStage.id, version: privacyStage.version, fingerprint: privacyStage.preview.fingerprint })
  const privacyJob = (await h.state()).jobs.find(j => j.source?.id === 'synthetic-glove-job')
  await b.dispatcher.run('visit.book', { jobId: privacyJob.id, technicianId: b.priya.id, date: '2026-10-27', start: '10:00', end: '11:00' })
  const field = await b.priyaPerson.state()
  assert.ok(field.jobs.some(j => j.id === privacyJob.id), 'the technician really is assigned to the imported job')
  assert.ok(field.captures.some(c => c.importedNoteId === 'synthetic-glove-note'))
  for (const row of [sourceCustomer, sourceRequest, sourceQuote, imported('invoices')[0]]) assert.ok(!JSON.stringify(field).includes(row.importedNotes[0].text), 'private upstream notes never leak into assigned field work')
  assert.ok(!JSON.stringify(field).includes('Billing instructions.txt'))
  assert.equal(field.customers.find(c => c.id === sourceCustomer.id).importedNotes, undefined)
  assert.deepEqual(field.quotes, [])
  assert.deepEqual(field.invoices, [])
  assert.deepEqual(field.enquiries, [])
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

// MOVE-004: the adapter is exercised through the same production command and
// read doors as an owner, including the destructive journal path.
import { exportedFixture } from '../fixtures/movein.mjs'

// Exercise the existing accounting review after moving in a complete saved export.
// Original document numbers identify history; display prefixes must not break linking.
async function openingInvoiceLinks(t, system, expectedNumber, expectedTotal) {
  const h = await installation({ at: '2026-10-22T12:00:00Z' }); t.after(() => h.close())
  await h.command('business.save', { name: 'Synthetic Glove', currency: 'USD', timezone: 'UTC' })
  const staged = await h.command('import.stage', { format: system, files: await exportedFixture(system), balanceAsOf: '2026-10-22' })
  assert.deepEqual(staged.preview.rejections, [])
  await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), invoice = state.invoices[0], customer = state.customers[0]
  assert.equal(state.invoices.length, 1)
  assert.equal(invoice.importedInvoiceNumber, expectedNumber)
  assert.equal(invoice.openingBalance.amount, '76.50')
  assert.equal(invoice.openingBalance.sourceTotal, expectedTotal)
  assert.notEqual(invoice.number, expectedNumber, 'Glove keeps its readable source prefix separately')
  h.quickbooks.record('customer', { Id: '1', SyncToken: '0', Active: true, DisplayName: customer.name, PrimaryEmailAddr: { Address: customer.email }, PrimaryPhone: { FreeFormNumber: customer.phone } })
  for (const [i, item] of state.services.entries()) h.quickbooks.record('item', { Id: String(20 + i), SyncToken: '0', Active: true, Name: item.name, Sku: item.code, Type: 'Service', IncomeAccountRef: { value: '30' } })
  const original = { Id: '501', SyncToken: '0', DocNumber: expectedNumber, CustomerRef: { value: '1' }, TotalAmt: Number(expectedTotal), Balance: 76.50, CurrencyRef: { value: 'USD' } }
  h.quickbooks.record('invoice', original)
  // Same number with the wrong total must not be treated as the opening invoice.
  h.quickbooks.record('invoice', { ...original, Id: '502', TotalAmt: 76.50 })
  await h.command('qbo.connect', { realmId: '123', key: 'synthetic-glove-905', mode: 'sandbox' })
  const review = JSON.parse((await h.command('qbo.discover', {})).review)
  const proposal = review.proposals.filter(p => p.kind === 'invoice')
  assert.deepEqual(proposal.map(p => [p.id, p.group, p.rule, p.candidates]), [[invoice.id, 'matched', 'number-customer-total', ['501']]])
  assert.deepEqual(proposal[0].nameClashes, ['502'])
  await h.command('qbo.confirmLinks', { confirm: true }, { error: 'QBO_REVIEW' })
  await h.command('qbo.map', { kind: 'customer', id: customer.id, remoteId: '1' })
  for (const [i, item] of state.services.entries()) await h.command('qbo.map', { kind: 'service', id: item.id, remoteId: String(20 + i) })
  await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '502' }, { error: 'QBO_MAPPING' })
  await h.command('qbo.map', { kind: 'invoice', id: invoice.id, remoteId: '501' })
  await h.command('qbo.confirmLinks', { confirm: true })
  for (let attempt = 0; attempt < 2; attempt++) await h.command('qbo.sync', { kind: 'invoice', id: invoice.id }, { error: 'NOT_APPROVED' })
  assert.equal(h.quickbooks.calls.filter(c => c.body).length, 0, 'discovery, confirmed linkage and replay never post opening history')
  assert.deepEqual([...h.quickbooks.records.values()].filter(r => r.DocNumber).map(r => [r.Id, r.DocNumber, r.TotalAmt, r.Balance]), [['501', expectedNumber, Number(expectedTotal), 76.50], ['502', expectedNumber, 76.50, 76.50]])
  const linked = (await h.state()).invoices[0]
  assert.equal(linked.qboSync.remoteId, '501')
  assert.equal(linked.openingBalance.amount, '76.50')
  const exported = await (await h.request('/api/glove/export')).json()
  assert.equal(exported.invoices.find(r => r.id === invoice.id).importedInvoiceNumber, expectedNumber)
}

for (const system of ['fieldpulse', 'workiz', 'servicetitan']) test(`${system === 'servicetitan' ? 'MOVE-003' : 'MOVE-004'} ${system}: saved exports preview, preserve source records, prices, balances, visits, notes and attachment bytes, repeat once, and undo without touching native work`, async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h), files = await exportedFixture(system), snapshot = '2026-10-22'
  if (system !== 'fieldpulse') await openingInvoiceLinks(t, system, '901', '216.50')
  const before = await h.state(), beforeMail = h.email.sent.length
  await b.office.run('import.stage', { format: system, files, balanceAsOf: snapshot }, { error: 'FORBIDDEN' })
  const staged = await h.command('import.stage', { format: system, files, balanceAsOf: snapshot })
  assert.equal(staged.system.toLowerCase(), system)
  assert.deepEqual(staged.preview.rejections, [], 'every documented fixture row maps')
  assert.equal(staged.status, 'previewed')
  assert.equal((await h.state()).jobs.length, before.jobs.length, 'dry run writes no work')
  assert.equal(staged.fileSummary.length, files.length)
  for (const original of files) {
    const expected = Buffer.from(original.text ?? original.base64, original.text === undefined ? 'base64' : 'utf8')
    const { createHash } = await import('node:crypto')
    const f = staged.fileSummary.find(x => x.name === original.name)
    assert.equal(f.size, expected.length); assert.equal(f.sha256, createHash('sha256').update(expected).digest('hex'))
  }
  if (system === 'workiz') assert.ok(staged.preview.unmappedFields.jobs.includes('unsupportedSourceField'))
  await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'unreviewed' }, { error: 'IMPORT_REVIEW' })
  const committed = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const once = await h.state(), imported = kind => once[kind].filter(r => r.source?.system?.toLowerCase() === system || r.importSource?.system?.toLowerCase() === system)
  assert.equal(imported('customers').length, 1)
  const expectedSourceIds = system === 'workiz' ? ['synthetic-glove-1','synthetic-glove-3','synthetic-glove-4','synthetic-glove-8','synthetic-glove-9'] : system === 'fieldpulse' ? ['1','4','5','6','7'] : ['1','6','7','12','14']
  assert.deepEqual(['customers','services','jobs','quotes','invoices'].map(kind => imported(kind).find(r => kind === 'jobs' ? r.id === imported('invoices')[0].jobId : kind === 'services' ? r.kind === 'service' : true)?.source.id), expectedSourceIds, 'each primary source ID is kept exactly')
  assert.ok(imported('sites').length >= 1)
  assert.equal(imported('services').length, 2)
  const product = imported('services').find(s => s.kind === 'material')
  assert.equal(product.name, 'Synthetic replacement filter'); assert.equal(product.unitPrice, '10.00'); assert.equal(product.unitCost, '3.00'); assert.equal(product.tax, 'FREE')
  assert.equal(imported('jobs').length, system === 'fieldpulse' ? 3 : 2)
  assert.equal(imported('visits').length, system === 'servicetitan' ? 1 : 2)
  assert.equal(imported('quotes').length, 1)
  assert.equal(imported('invoices').length, 1)
  const invoice = imported('invoices')[0]
  assert.equal(invoice.status, 'imported')
  assert.equal(invoice.openingBalance.amount, '76.50'); assert.equal(invoice.openingBalance.asOf, snapshot)
  assert.equal(invoice.openingBalance.notForPosting, true)
  assert.equal(invoice.dates.termsDays, 14, 'the source issue/due interval is preserved rather than invented as zero')
  assert.equal(invoice.revisions[0].totals.total, '216.50')
  assert.equal(invoice.revisions[0].approval, null)
  assert.equal(imported('quotes')[0].revisions[0].approval, null)
  const pricedService = imported('services').find(s => s.unitPrice === '100.00')
  assert.ok(pricedService)
  assert.equal(pricedService.unitCost, system === 'workiz' ? '40.00' : system === 'servicetitan' ? '30.00' : '25.00')
  assert.equal(imported('technicians')[0].operatorId, null, 'no imported person receives a sign-in or source role')
  const visit = imported('visits').find(v => v.jobId === invoice.jobId), job = imported('jobs').find(j => j.id === visit.jobId)
  assert.equal(visit.jobId, job.id); assert.equal(visit.technicianId, imported('technicians')[0].id)
  assert.ok(imported('captures').some(c => c.kind === 'note'))
  const attachment = imported('captures').find(c => c.kind === 'attachment')
  assert.equal(attachment.bytes.status, 'retained')
  const originals = (await h.db.prepare('SELECT * FROM ik_originals').all()).results
  const original = originals.find(o => o.sha256 === attachment.bytes.sha256)
  assert.ok(original, 'the exact attachment is in journal custody')
  const chunks = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks WHERE job_id=? AND kind=? AND original_key=? ORDER BY ordinal').bind(original.job_id, original.kind, original.original_key).all()).results
  const kept = chunks.length ? Buffer.from(chunks.map(c => c.bytes).join(''), 'base64') : Buffer.from(original.bytes)
  assert.equal(kept.toString(), 'synthetic-glove-attachment\n', 'original bytes, not just a descriptor, survive commit')
  if (system !== 'servicetitan') assert.deepEqual(imported('visits').map(v => v.local.date).sort(), ['2026-10-23','2026-11-23'], 'both existing source occurrences arrive exactly once')
  if (system === 'fieldpulse') assert.ok(imported('jobs').every(j => j.importedRecurrence.parentId === '20'), 'the source recurring group is retained across its occurrences')
  if (system === 'fieldpulse') {
    const equipment = imported('equipment')
    assert.equal(equipment.length, 1)
    assert.deepEqual([equipment[0].siteId, equipment[0].customerId, equipment[0].type, equipment[0].serial, equipment[0].make, equipment[0].model, equipment[0].installedOn, equipment[0].manufacturerWarrantyUntil, equipment[0].laborWarrantyUntil], [job.siteId, invoice.customerId, 'Synthetic installed heat pump', 'synthetic-glove-fp-serial', 'Synthetic maker', 'Synthetic unit', '2025-01-01', '2028-01-01', '2027-01-01'])
    const read = await h.request(`/api/glove/equipment/${equipment[0].id}`).then(r => r.json())
    assert.equal(read.equipment.serial, 'synthetic-glove-fp-serial')
    const personal = JSON.parse((await h.command('privacy.export', { customerId: invoice.customerId, version: imported('customers')[0].version })).download)
    const originalAssets = personal.importOriginals.find(f => f.name === 'assets.json')
    assert.ok(originalAssets)
    const originalAsset = JSON.parse(Buffer.from(originalAssets.bytes, 'base64').toString()).response[0]
    assert.deepEqual([originalAsset.serial_number, originalAsset.model_number, originalAsset.notes], ['synthetic-glove-fp-serial', 'synthetic-glove-model-number', 'Synthetic source asset notes'])
  }
  if (system === 'servicetitan') {
    const equipment = imported('equipment')[0]
    assert.equal(equipment.siteId, job.siteId); assert.equal(equipment.serial, 'synthetic-glove-serial')
    assert.equal(equipment.manufacturerWarrantyUntil, '2028-01-01')
    const agreement = imported('agreements')[0]
    const response = await (await h.request('/api/glove/agreements')).json()
    const member = response.agreements.find(a => a.id === agreement.id)
    assert.deepEqual([member.entitlements.included, member.entitlements.used, member.entitlements.left, member.entitlements.next], [3, 1, 2, '2026-07-15'])
    assert.equal(agreement.siteId, job.siteId); assert.equal(agreement.plan.price, '240.00')
    assert.equal(agreement.sourceTerms.billingFrequency, 'Annually')
    assert.equal(agreement.plan.repairDiscountPercent, null, 'an unavailable source member discount is not reported as zero')
    assert.deepEqual(agreement.importedEntitlements.map(e => e.due), ['2026-01-15','2026-07-15','2026-11-15'])
    const recurrence = imported('jobs').find(j => j.importedRecurrence)
    assert.equal(recurrence.importedRecurrence.source.recurrenceInterval, 6)
    assert.equal(recurrence.importedRecurrence.active, false)
    assert.deepEqual(recurrence.importedRecurrence.proposal.rule, { unit: 'month', interval: 6, months: null, day: 15, nth: null, weekday: null })
    assert.equal(recurrence.importedRecurrence.proposal.coveredThrough, '2026-11-15')
    assert.equal(recurrence.series, undefined, 'the imported rule never generates bookings without a person')
    assert.ok(!JSON.stringify(recurrence).includes('estimatedPayrollCost'), 'raw payroll amounts never enter a technician-visible job')
    const sourceEventsResponse = await h.request('/api/glove/due-visits?through=2026-12-31')
    assert.equal(sourceEventsResponse.status, 200)
    const sourceEvents = await sourceEventsResponse.json()
    assert.deepEqual(sourceEvents.visits.filter(v => v.agreementId === agreement.id).map(v => v.due), ['2026-07-15','2026-11-15'], 'the source-completed event never becomes outstanding again')
  }
  const readAging = async date => (await (await h.request(`/api/glove/reports/receivables.json?asOf=${date}`)).json())
  const aging = await readAging(snapshot)
  assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
  assert.equal((await readAging('2026-10-21')).customers.length, 0, 'a later balance snapshot does not rewrite history')
  const revenue = await (await h.request('/api/glove/reports/revenue.json?from=2026-10-01&to=2026-10-31')).json()
  assert.equal(revenue.total.revenue, '0.00', 'imported balances are not new sales')
  await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
  await h.command('invoice.revise', { invoiceId: invoice.id, version: invoice.version, lines: [], reason: 'Cannot repost history' }, { error: 'IMPORTED_INVOICE' })
  await h.command('invoice.export', {}, { error: 'NOTHING_TO_EXPORT' })
  assert.equal(h.email.sent.length, beforeMail, 'an import sends no customer message')
  const exported = await (await h.request('/api/glove/export')).json()
  assert.ok(exported.invoices.some(i => i.id === invoice.id && i.openingBalance.amount === '76.50'))
  const again = await h.command('import.stage', { format: system, files, balanceAsOf: snapshot })
  assert.ok(again.preview.alreadyMovedIn > 0)
  await h.command('import.commit', { batchId: again.id, version: again.version, fingerprint: again.preview.fingerprint })
  const twice = await h.state()
  for (const kind of ['customers','sites','services','technicians','enquiries','jobs','visits','quotes','invoices','captures','equipment','agreements']) assert.equal(twice[kind].length, once[kind].length, `${kind} unchanged on retry`)
  const native = await h.command('customer.save', { name: 'Synthetic native customer' })
  await h.command('import.undo', { batchId: committed.id, version: committed.version, reason: 'Reviewed the wrong source snapshot' })
  const undone = await h.state()
  for (const kind of ['sites','services','technicians','jobs','visits','quotes','invoices','captures','equipment','agreements']) assert.equal(undone[kind].length, before[kind].length, `${kind} reversed`)
  assert.ok(undone.customers.some(c => c.id === native.id), 'native work survives undo')
})

test('MOVE-004 FieldPulse recurring report retains one schedule, requires explicit activation after all exported work, and names unsupported definitions', async t => {
  const h = await installation(); t.after(() => h.close()); const b = await business(h)
  const files = await exportedFixture('fieldpulse')
  const stage = input => h.command('import.stage', { format: 'fieldpulse', files: input })
  const staged = await stage(files)
  assert.deepEqual(staged.preview.rejections, [])
  const committed = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), schedules = state.jobs.filter(j => j.source?.kind === 'recurring-jobs')
  assert.equal(schedules.length, 1, 'one generator proposal per source group, rather than one per occurrence')
  const job = schedules[0], proposal = job.importedRecurrence.proposal
  assert.equal(job.source.id, '20'); assert.equal(job.importedRecurrence.source['Recurring Time - Frequency'], 'Every week on Tuesday')
  assert.deepEqual([proposal.from, proposal.until, proposal.coveredThrough], ['2026-10-20', '2026-12-29', '2026-11-24'])
  assert.equal(job.series, undefined)
  assert.equal(state.visits.filter(v => v.source?.system === 'FieldPulse').length, 2, 'only exported visits exist until activation')
  const input = { jobId: job.id, version: job.version, importedRule: true, technicianId: b.priya.id, start: '09:00', end: '10:00', until: '2026-12-29' }
  await h.command('series.create', { ...input, date: '2026-11-24' }, { error: 'IMPORT_RECURRENCE' })
  await h.command('series.create', { ...input, date: '2026-11-25' }, { error: 'IMPORT_RECURRENCE' })
  await h.command('series.create', { ...input, date: '2026-12-01', until: null }, { error: 'IMPORT_RECURRENCE' })
  await h.command('series.create', { ...input, date: '2026-12-01' })
  assert.deepEqual((await h.state()).visits.filter(v => v.jobId === job.id).map(v => v.local.date).sort(), ['2026-12-01','2026-12-08','2026-12-15','2026-12-22','2026-12-29'])
  await h.command('import.undo', { batchId: committed.id, version: committed.version, reason: 'Preserve new native work' }, { error: 'IMPORT_DEPENDENTS' })
  const changeReport = value => files.map(f => f.name === 'recurring-jobs.csv' ? { ...f, text: value(f.text) } : f)
  const unsupported = await stage(changeReport(text => text.replace('Every week on Tuesday', 'Every month on the 31st')))
  assert.ok(unsupported.preview.unmappedFields['recurring-jobs'].some(f => f.includes('no exact native mapping')))
  const invalid = await stage(changeReport(text => text.replace('2026-12-29', '2026-02-30')))
  assert.ok(invalid.preview.unmappedFields['recurring-jobs'].some(f => /date/i.test(f)))
  const orphan = await stage(changeReport(text => text.replace('\n20,', '\n999,')))
  assert.ok(orphan.preview.rejections.some(r => r.kind === 'recurring-jobs' && /recurring_parent_id/.test(r.reason)))
  // A late manual exception is also exported work, even beyond the report watermark.
  const late = changeReport(text => text.replace('No,2026-12-29', 'Yes,')), jobs = late.find(f => f.name === 'jobs.json'), source = JSON.parse(jobs.text)
  source.response[1].start_time = '2027-01-04T09:00:00-06:00'; source.response[1].end_time = '2027-01-04T10:00:00-06:00'; jobs.text = JSON.stringify(source)
  const extended = await stage(late)
  assert.deepEqual(extended.preview.rejections, [])
  // Inspect the dry run through a fresh installation, without prior source-identity reuse.
  const fresh = await installation(); t.after(() => fresh.close()); await business(fresh)
  const next = await fresh.command('import.stage', { format: 'fieldpulse', files: late })
  await fresh.command('import.commit', { batchId: next.id, version: next.version, fingerprint: next.preview.fingerprint })
  const moved = (await fresh.state()).jobs.find(j => j.source?.kind === 'recurring-jobs')
  assert.equal(moved.importedRecurrence.proposal.until, null)
  assert.equal(moved.importedRecurrence.proposal.coveredThrough, '2027-01-05', 'the late source exception is January 5 in the business timezone')
})

for (const system of ['fieldpulse', 'workiz', 'servicetitan']) test(`${system === 'servicetitan' ? 'MOVE-003' : 'MOVE-004'} ${system}: missing parents and invalid amounts are explained in preview; a native edit prevents destructive undo`, async t => {
  const h = await installation(); t.after(() => h.close()); await business(h)
  const files = await exportedFixture(system)
  const orphan = await h.command('import.stage', { format: system, files: files.filter(f => f.name !== (system === 'workiz' ? 'clients.json' : 'customers.json')) })
  assert.ok(orphan.preview.rejections.some(r => r.kind === 'jobs'), 'a missing customer refuses the job')
  assert.ok(orphan.preview.rejections.some(r => r.kind === 'invoices'), 'and its dependent invoice')
  const raw = structuredClone(files), item = raw.find(f => f.name === (system === 'servicetitan' ? 'services.json' : 'items.json')), body = JSON.parse(item.text), first = (body.data ?? body.response)[0]
  first[system === 'fieldpulse' ? 'default_unit_price' : 'price'] = 'not an amount'
  item.text = JSON.stringify(body)
  const invalid = await h.command('import.stage', { format: system, files: raw })
  assert.ok(invalid.preview.rejections.some(r => r.kind === (system === 'servicetitan' ? 'services' : 'items') && /amount/.test(r.reason)))
  assert.equal((await h.state()).imports.length, 2, 'invalid source rows remain reviewable, without product writes')
  if (system === 'fieldpulse') {
    for (const [field, value, reason] of [['status', 'retired', /installed customer/], ['asset_type', 'company', /installed customer/], ['is_template', true, /installed customer/], ['location_id', null, /location_id/], ['location_id', 999, /not in this export/], ['install_date', '2025-01-01', /Unix timestamps/]]) {
      const source = await exportedFixture(system), file = source.find(f => f.name === 'assets.json'), data = JSON.parse(file.text)
      data.response[0][field] = value; file.text = JSON.stringify(data)
      const refused = await h.command('import.stage', { format: system, files: source })
      assert.ok(refused.preview.rejections.some(r => r.kind === 'assets' && reason.test(r.reason)), `asset ${field} refusal`)
    }
  }
  if (system === 'workiz') {
    const unsupported = structuredClone(files), priceBook = unsupported.find(f => f.name === 'items.json'), sourceItems = JSON.parse(priceBook.text)
    sourceItems.data[0].type = 'warranty'; priceBook.text = JSON.stringify(sourceItems)
    const typeReview = await h.command('import.stage', { format: system, files: unsupported })
    assert.ok(typeReview.preview.rejections.some(r => r.kind === 'items' && /exact native mapping/.test(r.reason)), 'a documented Workiz warranty item is not silently changed into a stock product')
  }
  const cancelledFiles = structuredClone(files), jobFile = cancelledFiles.find(f => f.name === 'jobs.json'), sourceJobs = JSON.parse(jobFile.text), sourceJob = (sourceJobs.data ?? sourceJobs.response)[0]
  sourceJob[system === 'servicetitan' ? 'jobStatus' : 'status'] = system === 'servicetitan' ? 'Canceled' : system === 'fieldpulse' ? 5 : 'Canceled'
  if (system === 'servicetitan') { const appointment = cancelledFiles.find(f => f.name === 'appointments.json'), value = JSON.parse(appointment.text); value.data[0].status = 'Canceled'; appointment.text = JSON.stringify(value) }
  jobFile.text = JSON.stringify(sourceJobs)
  const staged = await h.command('import.stage', { format: system, files: cancelledFiles })
  const batch = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const cancelledVisit = (await h.state()).visits.find(v => v.source?.system?.toLowerCase() === system && v.status === 'cancelled')
  assert.ok(cancelledVisit); assert.match(cancelledVisit.cancelled.reason, /Canceled in/)
  const customer = (await h.state()).customers.find(c => c.source?.system?.toLowerCase() === system)
  await h.command('customer.save', { id: customer.id, version: customer.version, name: 'Synthetic corrected customer' })
  await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Keep the native correction' }, { error: 'NATIVE_EDIT_CONFLICT' })
  assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Synthetic corrected customer')
  if (system === 'fieldpulse') {
    const current = (await h.state()).customers.find(c => c.id === customer.id)
    const privacy = await h.command('privacy.preview', { customerId: current.id, version: current.version })
    await h.command('privacy.erase', { customerId: current.id, version: current.version, confirm: 'ERASE', fingerprint: privacy.fingerprint })
    assert.equal((await h.state()).equipment.some(e => e.serial === 'synthetic-glove-fp-serial'), false)
    const journal = await retainedImportText(h)
    assert.ok(!journal.includes('synthetic-glove-fp-serial'))
    assert.ok(!journal.includes('Synthetic source asset notes'))
  }
})

test('MOVE-003 an ongoing multi-location membership keeps one identity and offers each outstanding source event only at its own site', async t => {
  const h = await installation(); t.after(() => h.close()); const b = await business(h)
  const files = await exportedFixture('servicetitan')
  const change = (name, edit) => { const f = files.find(f => f.name === name), value = JSON.parse(f.text); edit(value.data); f.text = JSON.stringify(value) }
  change('recurring-services.json', rows => { rows[0].to = '2028-12-31T00:00:00Z' })
  change('memberships.json', rows => { rows[0].to = null; rows[0].duration = null })
  change('locations.json', rows => rows.push({ ...rows[0], id: 25, name: 'Second site', address: { street: '80 Synthetic St', city: 'Chicago', state: 'IL', zip: '60601' } }))
  change('services.json', rows => rows.push({ ...rows[0], id: 28, code: 'SYNTHETIC-ST-SECOND', displayName: 'Second-site coil cleaning' }))
  change('invoice-templates.json', rows => rows.push({ id: 29, name: 'Second-site included work', total: 0, items: [{ id: 30, skuId: 28, skuType: 'Service', quantity: 2, unitPrice: 0 }] }))
  change('recurring-services.json', rows => rows.push({ ...rows[0], id: 26, locationId: 25, invoiceTemplateId: 29, name: 'Second site recurring care', to: null }))
  change('recurring-service-events.json', rows => rows.push({ id: 27, locationRecurringServiceId: 26, membershipId: 18, date: '2026-12-22T00:00:00Z', status: 'NotAttempted', locationRecurringServiceName: 'Second site care' }))
  const staged = await h.command('import.stage', { format: 'servicetitan', files })
  assert.deepEqual(staged.preview.rejections, [])
  await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), agreement = state.agreements.find(a => a.source?.system === 'ServiceTitan')
  assert.equal(state.agreements.filter(a => a.source?.id === '18').length, 1, 'a source membership is never split into several identities or charges')
  assert.equal(agreement.endDate, null)
  assert.equal(agreement.siteIds.length, 2)
  const members = await h.request('/api/glove/agreements').then(r => r.json())
  assert.equal(members.agreements.find(a => a.id === agreement.id).active, true, 'ongoing source term remains active')
  const due = await h.request('/api/glove/due-visits?through=2026-12-31').then(r => r.json())
  const second = due.visits.find(v => v.agreementId === agreement.id && v.address.includes('80 Synthetic St'))
  assert.ok(second)
  for (const firstSite of due.visits.filter(v => v.agreementId === agreement.id && v.siteId === agreement.siteId)) await b.office.run('job.create', { customerId: agreement.customerId, siteId: firstSite.siteId, agreementId: agreement.id, agreementVisitIndex: firstSite.index, title: 'Reserve first-site source work' })
  const reserving = await h.request('/api/glove/agreements').then(r => r.json())
  assert.equal(reserving.agreements.find(a => a.id === agreement.id).entitlements.nextSiteId, second.siteId, 'the next booking chooses an unreserved entitlement at its actual site')
  await b.office.run('job.create', { customerId: agreement.customerId, siteId: agreement.siteId, agreementId: agreement.id, agreementVisitIndex: second.index, title: 'Wrong source location' }, { error: 'ENTITLEMENT' })
  const job = await b.office.run('job.create', { customerId: agreement.customerId, siteId: second.siteId, agreementId: agreement.id, agreementVisitIndex: second.index, title: 'Imported second-site included service' })
  assert.equal(job.totals.total, '0.00')
  assert.notEqual(job.lines[0].serviceId, agreement.plan.visitServiceId, 'different source recurring services do not inherit the first template SKU')
  assert.equal(job.lines[0].description, 'Second-site coil cleaning')
  assert.equal(job.lines[0].quantity, '2')
  assert.equal(state.services.find(s => s.id === job.lines[0].serviceId).source.id, '28')
  await b.office.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-12-22', start: '09:00', end: '10:00' })
  const updated = await h.request('/api/glove/due-visits?through=2026-12-31').then(r => r.json())
  const booked = updated.visits.find(v => v.agreementId === agreement.id && v.index === second.index)
  assert.equal(booked.booked, true); assert.equal(booked.siteId, second.siteId)
})


test('MOVE-003 source recurrence activates only after explicit review, never replays exported events, and unsupported rules are named', async t => {
  const h = await installation(); t.after(() => h.close()); const b = await business(h)
  const files = await exportedFixture('servicetitan'), source = files.find(f => f.name === 'recurring-services.json'), rows = JSON.parse(source.text)
  rows.data[0].to = '2028-12-31T00:00:00Z'; source.text = JSON.stringify(rows)
  const staged = await h.command('import.stage', { format: 'servicetitan', files })
  assert.deepEqual(staged.preview.rejections, [])
  const batch = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), job = state.jobs.find(j => j.importedRecurrence)
  assert.equal(state.visits.filter(v => v.jobId === job.id).length, 0)
  const input = { jobId: job.id, version: job.version, importedRule: true, technicianId: b.priya.id, start: '09:00', end: '10:00', until: '2028-12-31' }
  await h.command('series.create', { ...input, date: '2026-07-15' }, { error: 'IMPORT_RECURRENCE' })
  await h.command('series.create', { ...input, date: '2027-02-15' }, { error: 'IMPORT_RECURRENCE' })
  await h.command('series.create', { ...input, date: '2027-01-15', until: null }, { error: 'IMPORT_RECURRENCE' })
  const active = await h.command('series.create', { ...input, date: '2027-01-15' })
  assert.deepEqual(active.series.revisions[0].rule, job.importedRecurrence.proposal.rule)
  const visits = (await h.state()).visits.filter(v => v.jobId === job.id)
  assert.deepEqual(visits.map(v => v.local.date).sort(), ['2027-01-15','2027-07-15'])
  assert.ok(visits.every(v => v.technicianId === b.priya.id))
  await h.command('import.undo', { batchId: batch.id, version: batch.version, reason: 'Must preserve the newly activated native visits' }, { error: 'IMPORT_DEPENDENTS' })
  assert.equal((await h.state()).visits.filter(v => v.jobId === job.id).length, 2)
  const unknown = await exportedFixture('servicetitan'), unsupported = unknown.find(f => f.name === 'recurring-services.json'), raw = JSON.parse(unsupported.text)
  raw.data[0].recurrenceDaysOfMonth = [1,15]; unsupported.text = JSON.stringify(raw)
  const preview = await h.command('import.stage', { format: 'servicetitan', files: unknown })
  assert.ok(preview.preview.unmappedFields['recurring-services'].some(f => f.includes('no exact native rule')))
})

test('MOVE-002 Housecall Pro saved responses preview prices, balances and recurring visits, repeat unchanged and undo without removing native work', async t => {
  const h = await installation(); t.after(() => h.close()); const b = await business(h)
  const files = await exportedFixture('housecallpro'), before = await h.state(), beforeMail = h.email.sent.length
  await openingInvoiceLinks(t, 'housecallpro', '1001', '206.50')
  const stage = input => h.command('import.stage', { format: 'housecallpro', files: input, balanceAsOf: '2026-10-22' })
  await b.office.run('import.stage', { format: 'housecallpro', files }, { error: 'FORBIDDEN' })
  const staged = await stage(files)
  assert.deepEqual(staged.preview.rejections, [])
  assert.equal((await h.state()).jobs.length, before.jobs.length)
  assert.ok(staged.preview.unmappedFields.customers.includes('unsupportedSourceField'))
  assert.ok(staged.preview.unmappedFields.employees.includes('role'))
  assert.ok(staged.preview.unmappedFields.jobs.includes('recurrence_rule'))
  const { createHash } = await import('node:crypto')
  for (const f of files) assert.equal(staged.fileSummary.find(x => x.name === f.name).sha256, createHash('sha256').update(Buffer.from(f.text ?? f.base64, f.text === undefined ? 'base64' : 'utf8')).digest('hex'))
  await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: 'unreviewed' }, { error: 'IMPORT_REVIEW' })
  const committed = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const state = await h.state(), rows = kind => state[kind].filter(r => (r.importSource ?? r.source)?.system === 'HousecallPro')
  assert.equal(rows('customers')[0].source.id, 'synthetic-glove-customer')
  assert.equal(rows('customers')[0].importedDoNotService, true)
  assert.equal(rows('sites')[0].customerId, rows('customers')[0].id)
  assert.equal(rows('technicians')[0].operatorId, null)
  assert.deepEqual(rows('services').map(s => [s.source.id,s.kind,s.unitPrice,s.unitCost,s.tax]).sort(), [['synthetic-glove-material','material','10.00','3.00','FREE'],['synthetic-glove-service','service','100.00','25.00','TAXABLE']])
  assert.deepEqual(rows('visits').map(v => [v.local.date,v.status]).sort(), [['2026-10-23','booked'],['2026-11-23','completed']])
  for (const visit of rows('visits')) { assert.ok(rows('jobs').some(j => j.id === visit.jobId)); assert.equal(visit.technicianId, rows('technicians')[0].id) }
  assert.ok(rows('jobs').every(j => j.importedRecurrence.active === false && !j.series))
  const invoice = rows('invoices')[0]
  assert.equal(invoice.jobId, rows('jobs').find(j => j.source.id === 'synthetic-glove-job_1').id)
  assert.deepEqual([invoice.openingBalance.amount,invoice.openingBalance.asOf,invoice.openingBalance.notForPosting,invoice.revisions[0].totals.total,invoice.revisions[0].approval], ['76.50','2026-10-22',true,'206.50',null])
  assert.deepEqual(invoice.revisions[0].lines.map(l => [l.description, l.total]), [['Synthetic inspection','200.00'],['Synthetic source discount','-10.00']])
  const lead = rows('enquiries')[0]
  assert.equal(lead.importSource.id, 'synthetic-glove-lead')
  assert.equal(lead.customerId, rows('customers')[0].id)
  assert.equal(lead.siteId, rows('sites')[0].id)
  assert.equal(lead.status, 'new')
  assert.equal(lead.importedLeadSource, 'Synthetic referral')
  assert.equal(lead.description, 'Housecall Pro lead 101: Needs inspection')
  assert.equal(lead.acknowledgment, undefined, 'historical leads queue no new reply')
  const sourceReport = await (await h.request('/api/glove/reports/sources')).json()
  assert.equal(sourceReport.sources.find(s => s.source === 'housecallpro').requests, 2)
  assert.equal(sourceReport.pipeline.find(s => s.stage === 'new').requests.find(r => r.id === lead.id).ageDays, null)
  assert.equal(rows('enquiries').find(e => e.importSource.id === 'synthetic-glove-lost-lead').status, 'lost')
  const conversation = await h.request(`/api/glove/conversation?customerId=${lead.customerId}`)
  assert.equal(conversation.status, 200)
  assert.equal((await conversation.json()).entries.filter(e => e.kind === 'request').length, 2)
  const history = await h.request(`/api/glove/sites/${lead.siteId}/history`)
  assert.equal(history.status, 200)
  assert.equal((await history.json()).entries.filter(e => e.kind === 'request').length, 2)
  assert.equal(rows('captures').find(c => c.kind === 'note').text, 'Synthetic source job note')
  const attachment = rows('captures').find(c => c.kind === 'attachment')
  assert.equal(attachment.bytes.status, 'retained')
  assert.equal(attachment.bytes.sha256, createHash('sha256').update('synthetic-glove-attachment\n').digest('hex'))
  const aging = await (await h.request('/api/glove/reports/receivables.json?asOf=2026-10-22')).json()
  assert.equal(aging.customers.find(c => c.customerId === invoice.customerId).total, '76.50')
  await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 }, { error: 'IMPORTED_INVOICE' })
  const exported = await (await h.request('/api/glove/export')).json()
  assert.ok(exported.invoices.some(i => i.id === invoice.id && i.openingBalance.amount === '76.50'))
  assert.equal(h.email.sent.length, beforeMail, 'importing sends no customer message')
  const again = await stage(files)
  assert.ok(again.preview.alreadyMovedIn > 0)
  await h.command('import.commit', { batchId: again.id, version: again.version, fingerprint: again.preview.fingerprint })
  const twice = await h.state()
  for (const kind of ['customers','sites','technicians','services','jobs','visits','invoices','captures','enquiries']) assert.equal(twice[kind].length, state[kind].length)
  const native = await h.command('customer.save', { name: 'Synthetic native customer' })
  await h.command('import.undo', { batchId: committed.id, version: committed.version, reason: 'Wrong Housecall snapshot' })
  const undone = await h.state()
  for (const kind of ['sites','technicians','services','jobs','visits','invoices','captures','enquiries']) assert.equal(undone[kind].length, before[kind].length)
  assert.ok(undone.customers.some(c => c.id === native.id))

  const orphan = await stage(files.filter(f => f.name !== 'customers.json'))
  assert.ok(orphan.preview.rejections.some(r => r.kind === 'jobs'))
  const invalid = files.map(f => f.name === 'services.json' ? { ...f, text: f.text.replace('10000', '10.5') } : f)
  assert.ok((await stage(invalid)).preview.rejections.some(r => r.kind === 'services' && /cents/.test(r.reason)))
  const mutateInvoice = change => files.map(f => { if (!f.name.startsWith('job-invoices-')) return f; const value = JSON.parse(f.text); change(value.invoices[0]); return { ...f, text: JSON.stringify(value) } })
  for (const change of [i => { i.discounts[0].amount = -1 }, i => { i.discounts[0].amount = 1001 }, i => { i.items[0].amount = 19999 }]) {
    const rejected = await stage(mutateInvoice(change))
    assert.ok(rejected.preview.rejections.some(r => r.kind === 'job-invoices'), 'inconsistent invoice amounts are refused')
  }
  const orphanLead = await stage(files.filter(f => !['customers.json', 'jobs.json'].includes(f.name)))
  assert.ok(orphanLead.preview.rejections.some(r => r.kind === 'leads'))
  const missing = await stage(files.filter(f => !f.base64))
  assert.equal(missing.preview.missingAttachments.length, 1)
  const fresh = await stage(files), applied = await h.command('import.commit', { batchId: fresh.id, version: fresh.version, fingerprint: fresh.preview.fingerprint })
  const customer = (await h.state()).customers.find(c => c.source?.system === 'HousecallPro')
  await h.command('customer.save', { id: customer.id, version: customer.version, name: 'Synthetic edited customer' })
  await h.command('import.undo', { batchId: applied.id, version: applied.version, reason: 'Keep native edit' }, { error: 'NATIVE_EDIT_CONFLICT' })
  assert.equal((await h.state()).customers.find(c => c.id === customer.id).name, 'Synthetic edited customer')
})
