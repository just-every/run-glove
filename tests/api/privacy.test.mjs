import { scenario } from '../fixtures/scenario.mjs'
import { dataPrivacyQualification } from '../fixtures/privacy-data.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob, id } from './harness.mjs'
import { createPortability } from '@runeditrun/rer/modules/portability'
import { createHash } from 'node:crypto'
import { readArchive } from '@runeditrun/rer/modules/portability/format'
import { readFile, readdir } from 'node:fs/promises'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { unstable_splitSqlQuery } from 'wrangler'
import { editionArchivePolicy } from '../fixtures/edition-archive-policy.mjs'
import * as peers from '../fixtures/peer-redaction.mjs'

const pdf = Buffer.from('%PDF-1.4 synthetic-glove-1 certificate').toString('base64')
const jpeg = Buffer.from('ffd8ffe000104a4649460001010000010000010000ffd9', 'hex').toString('base64')
const exportRequest = (h, c) => h.command('privacy.export', { customerId: c.id, version: c.version })

async function snapshot(h) {
  const policy = await editionArchivePolicy(process.cwd())
  const service = await createPortability({ db: h.db, policy })
  const job = await service.exports.create('owner')
  while ((await service.exports.advance(job, { maxParts: 16 })).phase === 'building') {}
  const records = []
  for await (const row of readArchive(await service.exports.download(job))) records.push(row)
  await service.exports.abort(job)
  return { records, service }
}
async function emptyArchiveDestination(t) {
  const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, script: 'export default { fetch() { return new Response(null, { status: 404 }) } }', compatibilityDate: '2026-09-08', d1Databases: { DB: 'synthetic-glove-empty-archive' } }))
  t.after(() => mf.dispose())
  const db = await mf.getD1Database('DB')
  for (const file of (await readdir('./migrations/core')).filter(f => f.endsWith('.sql')).sort()) await db.batch(unstable_splitSqlQuery(await readFile('./migrations/core/' + file, 'utf8')).map(sql => db.prepare(sql)))
  return { db, service: await createPortability({ db, policy: await editionArchivePolicy(process.cwd()) }) }
}
async function restore(service, records, later) {
  const created = await service.imports.create(records[0], 'owner')
  const parts = records.filter(r => r.kind === 'part')
  for (let i=0;i<parts.length;i++) await service.imports.uploadPart(created, i, parts[i])
  try { return await service.imports.finalize(created, { archiveHash: records.at(-1).archiveHash, contentHash: records.at(-1).contentHash, laterJournal: later }) } catch(error) { await service.imports.abort(created); throw error }
}

test('DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals', async t => {
  await scenario(t, 'DATA-001 points 1–7: native privacy qualification through the production Worker', dataPrivacyQualification)
  await scenario(t, 'DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 owner exports and erases every merged identity, original and personal copy while retaining anonymous invoice and tax totals', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const scopedOwner = await h.person('Limited owner', 'owner')
  await h.command('branch.limit', { operatorId: scopedOwner.id, branchId: 'main' })
  for (const type of ['privacy.preview', 'privacy.export', 'privacy.erase']) await scopedOwner.run(type, { customerId: b.customer.id, version: b.customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
  const duplicate = await h.command('customer.save', { name: 'synthetic-glove-22', email: 'synthetic-glove-2@example.test', phone: b.customer.phone })
  await h.command('conversation.log', { customerId: duplicate.id, kind: 'note', text: 'Personal outcome' }, { commandId: 'synthetic-glove-22-event' })
  const other = await h.command('customer.save', { name: 'Unaffected Customer', email: 'unaffected@example.test' })
  const peerNote = await h.command('conversation.log', { customerId: other.id, kind: 'note', text: 'Tenant needs a quote; Harbourview Dental recommended us.' })
  const { job, visit } = await completedJob(h, b)
  const capture = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-20T23:01:00Z', kind: 'photo', caption: 'Harbourview Dental front door', photo: { mediaType: 'image/jpeg', base64: jpeg } })
  let inv = await b.office.run('invoice.prepare', { jobId: job.id })
  inv = await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })
  const exported = await b.office.run('invoice.export', { invoiceIds: [inv.id] })
  const connected = await h.command('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-16', fromEmail: 'office@example.test' })
  const message = await b.office.run('email.send', { kind: 'invoice', id: inv.id, version: (await h.state()).invoices.find(i => i.id === inv.id).version })
  const delivery = { RecordType: 'Delivery', MessageID: `pm-receipt-${h.email.sent.length}`, Recipient: message.to, DeliveredAt: new Date().toISOString(), Metadata: { glove_delivery_id: message.id } }
  const callback = () => h.mf.dispatchFetch(h.origin + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`glove:${connected.callbackPassword}`).toString('base64')}` }, body: JSON.stringify(delivery) })
  assert.equal((await callback()).status, 200)
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM rer_mail_event_states').first()).n, 1)
  const unit = await h.command('equipment.save', { siteId: b.site.id, type: 'Water heater', make: 'Synthetic', serial: 'synthetic-glove-17', location: 'Customer private basement', photo: { mediaType: 'image/jpeg', base64: jpeg } })
  const certCustomer = await h.command('customer.save', { ...b.customer, contacts: [{ name: 'Synthetic contact', role: 'Tenant' }], taxExemption: { certificateNumber: 'synthetic-glove-3', expires: '2028-12-31' } })
  let certificate = await h.command('customer.certificate', { customerId: b.customer.id, version: certCustomer.version, file: { mediaType: 'application/pdf', base64: pdf } })
  const earlierCertificate = certificate.taxExemption.certificate.fileId
  certificate = await h.command('customer.certificate', { customerId: b.customer.id, version: certificate.version, file: { mediaType: 'application/pdf', base64: pdf } })
  await h.command('conversation.log', { customerId: b.customer.id, kind: 'note', text: 'Harbourview Dental private customer note' })
  const merged = await h.command('customer.merge', { survivorId: b.customer.id, mergedIds: [duplicate.id], versions: { [b.customer.id]: certificate.version, [duplicate.id]: duplicate.version } })
  let customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  for (const person of [b.office, b.dispatcher, b.priyaPerson, b.agent]) for (const type of ['privacy.preview','privacy.export','privacy.erase']) await person.run(type, { customerId: customer.id, version: customer.version, confirm: 'ERASE' }, { error: 'FORBIDDEN' })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version }, { error: 'CONSENT' })
  const downloaded = await exportRequest(h, customer), data = JSON.parse(downloaded.download)
  assert.deepEqual(data.customerIds, [b.customer.id, duplicate.id].sort())
  assert.equal(data.records.invoices[0].id, inv.id)
  assert.ok(data.timeline.some(e => e.kind === 'customer.merged'))
  assert.ok(data.files.some(f => f.id === capture.file.fileId && f.bytes === jpeg))
  assert.ok(data.files.some(f => f.id === certificate.taxExemption.certificate.fileId && f.bytes === pdf))
  const stale = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('conversation.log', { customerId: other.id, kind: 'note', text: 'Tenant keeps this note' })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: stale.fingerprint }, { error: 'STALE_PREVIEW' })
  const result = await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: customer.version })).fingerprint })
  assert.deepEqual(result.customerIds, [b.customer.id, duplicate.id].sort())
  assert.equal(result.outcome, 'complete')
  const s = await h.state()
  assert.deepEqual(s.privacyRequests.map(r => r.action).sort(), ['erase', 'export'])
  assert.ok(s.customers.filter(c => result.customerIds.includes(c.id)).every(c => c.name === 'Erased customer' && !c.email && !c.taxExemption))
  assert.equal(s.customers.find(c => c.id === other.id).email, other.email)
  const kept = s.invoices.find(i => i.id === inv.id)
  assert.deepEqual(kept.revisions[0].totals, inv.revisions[0].totals)
  assert.equal(kept.revisions[0].lines[0].description, 'Retained invoice line')
  assert.equal(s.serviceReports.length, 0)
  assert.equal(s.equipment.length, 0)
  assert.equal(s.messages.length, 0)
  assert.ok((await b.priyaPerson.state()).privacyFences.includes(visit.id))
  assert.ok(!(await b.tomPerson.state()).privacyFences.includes(visit.id))
  assert.equal((await h.request(`/api/glove/files/${unit.photos[0].fileId}`)).status, 404)
  assert.equal((await h.request(`/api/glove/files/${earlierCertificate}`)).status, 404)
  for (const table of ['rer_mail_event_states','rer_mail_event_receipts']) assert.equal((await h.db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n, 0)
  const beforeReplay = JSON.stringify((await h.request('/api/glove/export').then(r => r.json())).timeline)
  assert.equal((await callback()).status, 200)
  assert.equal(JSON.stringify((await h.request('/api/glove/export').then(r => r.json())).timeline), beforeReplay)
  assert.equal(h.email.sent.length, 1)
  assert.equal(s.captures.length, 0)
  assert.equal(s.conversations.find(r => r.id === peerNote.id).text, 'Tenant needs a quote; [erased] recommended us.')
  assert.ok(s.conversations.some(r => r.text === 'Tenant keeps this note'))
  const anonymized = (await h.db.prepare("SELECT command_id FROM glove_events WHERE command_id LIKE 'privacy-%'").all()).results.map(r => r.command_id)
  assert.ok(anonymized.length > 0)
  assert.ok(!anonymized.includes('privacy-' + createHash('sha256').update('synthetic-glove-22-event').digest('hex')))
  assert.ok(!anonymized.includes('synthetic-glove-22-event'))
  assert.equal((await h.request(`/api/glove/files/${capture.file.fileId}`)).status, 404)
  assert.equal((await h.request(`/api/glove/files/${certificate.taxExemption.certificate.fileId}`)).status, 404)
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
  const csv = await h.request(`/api/glove/exports/${exported.id}.csv`).then(r => r.text())
  assert.match(csv, /Erased customer/); assert.ok(!csv.includes('Harbourview'))
  const all = await h.request('/api/glove/export').then(r => r.text())
  for (const value of ['Harbourview Dental','accounts@harbourview.example','Dr Mei Lin','14 Harbour St','Synthetic Duplicate','synthetic-glove-2@example.test','synthetic-glove-3']) assert.ok(!all.includes(value), `export does not retain ${value} in ${Object.entries(JSON.parse(all)).filter(([,v]) => JSON.stringify(v).includes(value)).map(([k]) => k).join(',')}`)
  const commands = JSON.stringify((await h.db.prepare('SELECT result FROM glove_commands').all()).results)
  assert.ok(!commands.includes('Harbourview Dental'))
  await h.command('customer.unmerge', { mergeId: merged.id, version: merged.version }, { error: 'NOT_FOUND' })
  await h.command('customer.save', { ...customer, name: 'Resurrected' }, { error: 'ERASED' })
  await assert.rejects(h.db.prepare("UPDATE glove_events SET summary='changed'").run(), /append_only_timeline/)
})
  await scenario(t, 'DATA-001 point 7: the edition archive policy rejects an older checkpoint with a later journal or destination fence and restores an anonymous backup', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const customer = await h.command('customer.save', { ...b.customer, taxExemption: { certificateNumber: 'synthetic-glove-4', expires: '2028-12-31' } })
  const withCertificate = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: pdf } })
  const before = await snapshot(h)
  await h.command('privacy.erase', { customerId: customer.id, version: withCertificate.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: withCertificate.version })).fingerprint })
  const after = await snapshot(h)
  assert.ok(after.records[0].epoch > before.records[0].epoch)
  const target = await emptyArchiveDestination(t), destination = target.service
  await assert.rejects(restore(destination, before.records, { sourceIdentity: after.records[0].sourceIdentity, epoch: after.records[0].epoch, journal: after.records[0].journal }), /erasure_epoch/)
  await restore(destination, after.records)
  assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificates').first()).n, 0)
  assert.equal((await target.db.prepare('SELECT count(*) AS n FROM glove_tax_certificate_chunks').first()).n, 0)
  const restored = JSON.stringify((await target.db.prepare('SELECT data FROM glove_records').all()).results)
  assert.ok(!restored.includes('Harbourview Dental'))
  assert.ok(!restored.includes('synthetic-glove-4'))
  await assert.rejects(restore(destination, before.records), /erasure_epoch/, 'the newer destination checkpoint refuses the older archive without an external journal')
  assert.equal(JSON.stringify((await target.db.prepare('SELECT data FROM glove_records').all()).results), restored, 'the destination fence leaves every restored record unchanged')
  await scenario(t, 'DATA-001 point 8: a fresh offline destination given only the older archive restores personal data and originals, demonstrating the trusted-journal limit', async () => {
    const offline = await emptyArchiveDestination(t)
    await restore(offline.service, before.records)
    const rows = JSON.stringify((await offline.db.prepare('SELECT data FROM glove_records').all()).results)
    assert.ok(rows.includes('Harbourview Dental'))
    assert.ok(rows.includes('synthetic-glove-4'))
    assert.equal((await offline.db.prepare('SELECT count(*) AS n FROM glove_tax_certificates').first()).n, 1)
    const chunks = (await offline.db.prepare('SELECT bytes FROM glove_tax_certificate_chunks ORDER BY ordinal').all()).results
    assert.equal(Buffer.concat(chunks.map(r => Buffer.from(r.bytes))).toString('base64'), pdf)
  })
})
  await scenario(t, 'DATA-001 point 4: complete customer CSV rows retain unmapped columns and exclude peers; imported erasure removes retained source copies', async t => {
  const h = await installation(); t.after(() => h.close())
  await business(h)
  const sourceRows = ['Name,Email,Address,Unmapped source note', `Synthetic Imported,${['synthetic-glove-6', 'example.test'].join('@')},125 Test Street,Synthetic first source note`, `Synthetic Imported,${['synthetic-glove-6', 'example.test'].join('@')},127 Test Street,Synthetic second source note`, `Synthetic Peer,${['synthetic-glove-7', 'example.test'].join('@')},126 Test Street,Synthetic peer source note`]
  const staged = await h.command('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-5.csv', text: sourceRows.join('\n') + '\n' }], mapping: { name: 'Name', email: 'Email', siteAddress: 'Address' } })
  const batch = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const s = await h.state(), customer = s.customers.find(c => c.name === 'Synthetic Imported'), peer = s.customers.find(c => c.name === 'Synthetic Peer')
  assert.ok(customer && peer)
  const exported = JSON.parse((await exportRequest(h, customer)).download)
  assert.ok(exported.importOriginals.length)
  assert.ok(exported.importOriginals.every(f => f.projection))
  assert.ok(!JSON.stringify(exported).includes('Synthetic Peer'))
  assert.ok(!JSON.stringify(exported).includes('synthetic-glove-7@example.test'))
  const projected = exported.importOriginals.filter(f => f.kind === 'artifact').map(f => Buffer.from(f.bytes, 'base64').toString()).join('')
  assert.match(projected, /Synthetic Imported/)
  assert.ok(!projected.includes('Synthetic Peer'))
  assert.ok(!projected.includes('synthetic-glove-7@example.test'))
  assert.deepEqual(projected.trim().split(/\r?\n/), sourceRows.slice(0, 3), 'both complete source rows, including unmapped columns, are projected without the peer row')
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  assert.ok(preview.sharedOriginals.some(a => a.name === 'synthetic-glove-5.csv' && a.peers === 1))
  assert.ok(preview.retiredBatches.some(b => b.jobId === batch.jobId && /cannot tombstone/.test(b.reason)))
  assert.equal(preview.peersAffected, 1)
  assert.equal(preview.counts.customers, 1)
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: customer.version })).fingerprint })
  assert.deepEqual((await h.state()).customers.find(c => c.id === peer.id), peer)
  for (const table of ['glove_records','glove_events','glove_commands','ik_jobs','ik_provenance','ik_d1_history','ik_d1_plan_chunks','ik_d1_creation_plans','ik_originals','ik_d1_original_chunks']) {
    const rows = JSON.stringify((await h.db.prepare(`SELECT * FROM ${table}`).all()).results)
    assert.ok(!rows.includes('Synthetic Imported'), `${table} has no erased name`)
    assert.ok(!rows.includes('synthetic-glove-6@example.test'), `${table} has no erased email`)
  }
  const bytes = (await h.db.prepare('SELECT bytes FROM ik_d1_original_chunks').all()).results.map(r => Buffer.from(r.bytes).toString()).join('')
  assert.ok(!bytes.includes('Synthetic Imported'))
  const current = (await h.state()).imports.find(i => i.id === batch.id)
  assert.equal(current.status, 'privacy-withdrawn')
  const peerExport = JSON.parse((await exportRequest(h, peer)).download)
  assert.ok(peerExport.omissions.some(o => o.artifact === 'synthetic-glove-5.csv' && /withdrawn/.test(o.reason)))
})
  await scenario(t, 'DATA-001 point 4: complete ServiceM8 objects include unmapped fields, exclude peer objects and name mixed-ownership attachment omissions', async t => {
    const h = await installation(); t.after(() => h.close()); await business(h)
    const root = './tests/fixtures/servicem8-small-hvac/'
    const kinds = ['company', 'companycontact', 'staff', 'job', 'jobactivity', 'jobmaterial', 'attachment']
    const files = await Promise.all(kinds.map(async kind => ({ name: `${kind}.json`, text: await readFile(root + kind + '.json', 'utf8') })))
    const authored = Object.fromEntries(files.map(f => [f.name, JSON.parse(f.text)]))
    const companyId = '6b1f3a52-1c2e-4d8a-9a5e-0d3c2b7f0a11', peerId = '9d0e4c71-5b2a-4f39-8e61-7a4b3c2d1e22'
    const jobId = '3e4f5a6b-aaaa-4c7d-8e9f-0a1b2c3d4e01', peerJob = '3e4f5a6b-cccc-4c7d-8e9f-0a1b2c3d4e03'
    const sharedName = 'attachments/8b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02'
    const companyOriginal = { name: 'attachments/8b9c0d1e-0003-4f2a-9b3c-4d5e6f7a8b03', base64: Buffer.from('Synthetic complete company source original').toString('base64') }
    const paymentSources = [{ uuid: '7b9c0d1e-0001-4f2a-9b3c-4d5e6f7a8b01', job_uuid: jobId, amount: '10.00', attachment_uuid: '8b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02', private_source_note: 'Synthetic complete payment source' }, { uuid: '7b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02', job_uuid: peerJob, amount: '20.00', attachment_uuid: '8b9c0d1e-0002-4f2a-9b3c-4d5e6f7a8b02', private_source_note: 'Synthetic peer payment source' }]
    files.push({ name: 'jobpayment.json', text: JSON.stringify(paymentSources) })
    files.push({ name: sharedName, base64: Buffer.from('Synthetic mixed customer original; must be omitted').toString('base64') })
    files.push(companyOriginal)
    const staged = await h.command('import.stage', { files })
    await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
    const s = await h.state(), customer = s.customers.find(c => c.id === `sm8-${companyId}`), peer = s.customers.find(c => c.id === `sm8-${peerId}`)
    assert.ok(customer && peer)
    const result = await exportRequest(h, customer), exported = JSON.parse(result.download)
    assert.equal(result.outcome, 'partial')
    const selected = {
      'company.json': authored['company.json'].filter(r => r.uuid === companyId),
      'companycontact.json': authored['companycontact.json'].filter(r => r.company_uuid === companyId),
      'job.json': authored['job.json'].filter(r => r.company_uuid === companyId),
      'jobpayment.json': paymentSources.filter(r => r.job_uuid === jobId),
      'jobmaterial.json': authored['jobmaterial.json'].filter(r => [jobId, '3e4f5a6b-bbbb-4c7d-8e9f-0a1b2c3d4e02'].includes(r.job_uuid)),
      'jobactivity.json': authored['jobactivity.json'].filter(r => [jobId, '3e4f5a6b-bbbb-4c7d-8e9f-0a1b2c3d4e02'].includes(r.job_uuid)),
      'attachment.json': authored['attachment.json'].filter(r => r.related_object === 'company' ? r.related_object_uuid === companyId : [jobId, '3e4f5a6b-bbbb-4c7d-8e9f-0a1b2c3d4e02'].includes(r.related_object_uuid)),
    }
    for (const [name, expected] of Object.entries(selected)) {
      assert.ok(expected.length, `${name} has independent nonempty source objects`)
      const file = exported.importOriginals.find(f => f.name === name)
      assert.ok(file, `${name} is exported`)
      assert.deepEqual(JSON.parse(Buffer.from(file.bytes, 'base64').toString()), expected, `${name} holds complete source objects including unmapped fields`)
    }
    assert.ok(exported.omissions.some(o => o.artifact === sharedName && /Shared source attachment.*peer data withheld/.test(o.reason)), `the mixed-ownership original is explicitly named as an omission: ${JSON.stringify(exported.omissions)}`)
    assert.ok(!exported.importOriginals.some(f => f.name === sharedName))
    assert.equal(exported.importOriginals.find(f => f.name === companyOriginal.name)?.bytes, companyOriginal.base64, 'the customer company attachment is included byte-exactly')
    for (const value of [peer.name, peer.email, 'Synthetic peer payment source']) {
      assert.ok(!JSON.stringify(exported).includes(value))
      for (const file of exported.importOriginals) assert.ok(!Buffer.from(file.bytes, 'base64').toString().includes(value), 'decoded original projections withhold peer content')
    }
  })
  await scenario(t, 'DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 / MOVE-001, MOVE-007 / MOVE-003, MOVE-009 / MOVE-004, MOVE-010 erasing one provider customer keeps another provider with the same numeric source ID and journal intact', async t => {
  const { exportedFixture } = await import('../fixtures/movein.mjs')
  const h = await installation(); t.after(() => h.close()); await business(h)
  for (const format of ['fieldpulse','servicetitan','jobber']) {
    const staged = await h.command('import.stage', { format, files: await exportedFixture(format), balanceAsOf: '2026-10-22' })
    assert.deepEqual(staged.preview.rejections, [])
    await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  }
  const before = await h.state(), fp = before.customers.find(c => c.source?.system === 'FieldPulse'), st = before.customers.find(c => c.source?.system === 'ServiceTitan')
  assert.equal(fp.source.id, st.source.id, 'both unrelated source accounts use customer ID 1')
  const jobber = before.customers.find(c => c.source?.system === 'Jobber')
  const initialJobberExport = JSON.parse((await exportRequest(h, jobber)).download)
  assert.ok(initialJobberExport.importOriginals.some(f => f.kind === 'attachment' && Buffer.from(f.bytes, 'base64').toString() === 'synthetic-glove-attachment\n'), 'customer export includes exact retained Jobber attachment bytes')

  const peerBatch = before.imports.find(i => i.system === 'ServiceTitan')
  const peerSources = (await h.db.prepare('SELECT * FROM ik_sources WHERE job_id=? ORDER BY identity').bind(peerBatch.jobId).all()).results
  const exported = JSON.parse((await exportRequest(h, fp)).download)
  assert.ok(exported.records.invoices.some(i => i.openingBalance.amount === '76.50'))
  assert.ok(exported.importCustody.length > 0)
  assert.ok(!JSON.stringify(exported).includes('Synthetic ServiceTitan Customer'))
  await h.command('privacy.erase', { customerId: fp.id, version: fp.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: fp.id, version: fp.version })).fingerprint })
  const after = await h.state()
  assert.equal(after.invoices.find(i => i.customerId === fp.id).openingBalance?.amount, '76.50', 'erasure preserves the anonymous imported balance')
  assert.deepEqual(after.customers.find(c => c.id === st.id), st)
  assert.deepEqual(after.customers.find(c => c.id === jobber.id), jobber)
  assert.deepEqual((await h.db.prepare('SELECT * FROM ik_sources WHERE job_id=? ORDER BY identity').bind(peerBatch.jobId).all()).results, peerSources, 'source IDs are scoped by namespace and kind')
  assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('fp@example.test'))
  const current = after.imports.find(i => i.id === peerBatch.id)
  await h.command('import.undo', { batchId: current.id, version: current.version, reason: 'Peer journal still supports ordinary undo' })
  assert.ok(!(await h.state()).customers.some(c => c.id === st.id))
  const jobberExport = JSON.parse((await exportRequest(h, jobber)).download)
  assert.ok(jobberExport.importCustody.some(c => c.records.some(r => r.source.namespace === 'jobber')))
  assert.ok(jobberExport.records.invoices.some(i => i.openingBalance.amount === '76.50'))
  assert.ok(jobberExport.records.quotes.some(q => q.importedReadOnly && q.revisions[0].totals.total === '205.68'))
  assert.ok(jobberExport.records.captures.some(c => c.kind === 'source-visit' && c.importedVisitId === 'synthetic-glove-unscheduled'))
  assert.ok(jobberExport.records.captures.some(c => c.kind === 'note' && c.text === 'Synthetic Jobber job note'))
  assert.ok(jobberExport.importOriginals.some(f => f.kind === 'attachment') || jobberExport.omissions.some(o => o.sourceSha256 === createHash('sha256').update('synthetic-glove-attachment\n').digest('hex')), 'an attachment is exported or its missing original is explicitly reported')

  const preview = await h.command('privacy.preview', { customerId: jobber.id, version: jobber.version })
  await h.command('privacy.erase', { customerId: jobber.id, version: jobber.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  assert.ok(!JSON.stringify(await h.request('/api/glove/export').then(r => r.json())).includes('jobber@example.test'))
  const erasedExport = JSON.stringify(await h.request('/api/glove/export').then(r => r.json()))
  for (const value of ['Synthetic Jobber job note', 'Synthetic source quote', 'Synthetic source attachment.txt', 'Call before arranging a date']) assert.ok(!erasedExport.includes(value), 'erasure removes source quote, note, attachment and pending-visit content')

})
  await scenario(t, 'DATA-001, DATA-005, DATA-006, DATA-007, DATA-008 erasure tombstones one CSV customer while peers retain source projections and exact Undo', async t => {
  const h = await installation(); t.after(() => h.close()); await business(h)
  const staged = await h.command('import.stage', { format: 'csv', files: [{ name: 'synthetic-glove-23.csv', text: 'Name,Email\nSynthetic Erased,synthetic-glove-24@example.test\nSynthetic Remaining,synthetic-glove-25@example.test\n' }], mapping: { name: 'Name', email: 'Email' } })
  const batch = await h.command('import.commit', { batchId: staged.id, version: staged.version, fingerprint: staged.preview.fingerprint })
  const before = await h.state(), subject = before.customers.find(c => c.name === 'Synthetic Erased'), peer = before.customers.find(c => c.name === 'Synthetic Remaining')
  const preview = await h.command('privacy.preview', { customerId: subject.id, version: subject.version })
  assert.deepEqual(preview.retiredBatches, [])
  assert.equal(preview.sharedOriginals[0].peers, 1)
  await h.command('privacy.erase', { customerId: subject.id, version: subject.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const after = await h.state(), current = after.imports.find(b => b.id === batch.id)
  assert.equal(current.status, batch.status)
  assert.deepEqual(after.customers.find(c => c.id === peer.id), peer)
  const exported = JSON.parse((await exportRequest(h, peer)).download)
  assert.ok(exported.importOriginals.some(a => a.projection && Buffer.from(a.bytes, 'base64').toString().includes(peer.name)))
  assert.ok(exported.omissions.some(o => /withdrawn/.test(o.reason)))
  assert.ok(!JSON.stringify(exported).includes('synthetic-glove-24@example.test'))
  await h.command('import.undo', { batchId: current.id, version: current.version, reason: 'Keep peer Undo after tombstone' })
  const undone = await h.state()
  assert.ok(!undone.customers.some(c => c.id === peer.id))
  assert.equal(undone.customers.find(c => c.id === subject.id).name, 'Erased customer')
})
  await scenario(t, 'DATA-007 point 1: every exact typed value in peer and shared records is redacted while other mentions and short-word lookalikes stay', async t => {
    const h = await installation({ captureLogs: true }); t.after(() => h.close())
    const w = await peers.peerWorld(h), v = peers.subjectValues
    const group = (await h.state()), subject = group.customers.find(c => c.id === w.subject.id), site = group.sites.find(s => s.id === w.site.id), enquiry = group.enquiries.find(e => e.intake)
    assert.deepEqual([subject.name, subject.contact, subject.email, subject.apEmail, subject.phone, subject.billingAddress, subject.billingContact, subject.abn, subject.contacts[0].name, subject.contacts[0].phone, subject.contacts[0].email, subject.taxExemption.certificateNumber],
      [v.name, v.contact, v.email, v.apEmail, v.phone, v.billingAddress, v.billingContact, v.abn, v.contactName, v.contactPhone, v.contactEmail, v.certificate])
    assert.deepEqual([site.address, site.contact, site.contactPhone, site.contactEmail, enquiry.customerId, enquiry.intake.contact.name], [v.siteAddress, v.siteContact, v.siteContactPhone, v.siteContactEmail, subject.id, v.intakeName])
    assert.equal(group.customers.find(c => c.id === w.duplicate.id).mergedInto, subject.id)
    const before = await peers.peerRecords(h, w)
    assert.match(before.captures[0].text, new RegExp(v.phone)); assert.match(before.sites[0].accessNotes, new RegExp(v.email)); assert.match(before.conversations[0].text, new RegExp(v.siteAddress))
    assert.match(before.equipment[0].location, new RegExp(v.certificate)); assert.match(before.templates[0].name, new RegExp(v.contact))
    await peers.erase(h, w)
    const after = await peers.peerRecords(h, w)
    assert.equal(after.captures[0].text, `Rang [erased] to book; alternate ${peers.nearMiss.phone}; ${peers.nearMiss.title}; ${peers.nearMiss.annual} due`, 'a peer job note quoting the phone')
    assert.equal(after.sites[0].accessNotes, 'Gate code from [erased]; spare key with reception', 'a peer site access note with the email')
    assert.equal(after.conversations[0].text, `Neighbour [erased] at [erased] asked about a quote; ${peers.nearMiss.leeds} also rang`, 'a peer conversation note with the service address')
    assert.equal(after.equipment[0].location, 'Plant room; certificate [erased] on file', 'a peer equipment note with the certificate number')
    assert.equal(after.templates[0].name, 'Priority plan for [erased]', 'a template naming the contact')
    assert.equal(after.conversations[1].text, peers.values().map(() => '[erased]').join(' | '), 'every typed identifier kind standing alone')
    assert.deepEqual(after.services, before.services, 'a price-book Annual tune-up is not the site contact Ann')
    assert.deepEqual(after.technicians, before.technicians, 'a technician Annabel Leeds is not the customer Lee')
  })
  await scenario(t, 'DATA-007 point 2: peer and shared records keep their IDs, other fields, original files and place in histories with only the exact values replaced', async t => {
    const h = await installation({ captureLogs: true }); t.after(() => h.close())
    const w = await peers.peerWorld(h)
    const before = await peers.peerRecords(h, w), ids = kind => before[kind].map(r => r.id)
    const peerIds = Object.values(before).flat().map(r => r.id)
    const history = () => h.db.prepare(`SELECT id,sequence,at,actor_id,job_id,subject_kind,subject_id,kind FROM glove_events WHERE subject_id IN (SELECT value FROM json_each(?)) OR job_id=? ORDER BY sequence`).bind(JSON.stringify(peerIds), w.peerWork.job.id).all().then(r => r.results)
    const timeline = await history(), bytes = await Promise.all(w.originals.peer.map(id => peers.fileBytes(h, id)))
    assert.ok(timeline.length >= 8 && bytes.every(b => typeof b === 'string'), 'the peer has history and readable originals before erasure')
    const counts = async () => { const s = await h.state(); return Object.fromEntries(['sites', 'jobs', 'invoices', 'payments'].map(k => [k, s[k].filter(r => r.customerId === w.peer.id).map(r => r.id).sort()]).concat([['customers', s.customers.filter(c => c.id === w.peer.id).map(c => c.id)], ['visits', s.visits.filter(x => s.jobs.find(j => j.id === x.jobId)?.customerId === w.peer.id).map(x => x.id).sort()]])) }
    const records = await counts()
    await peers.erase(h, w)
    const after = await peers.peerRecords(h, w), want = peers.expectedPeer(w, before)
    for (const kind of Object.keys(want)) assert.deepEqual(after[kind], want[kind], `${kind} change only by the exact values`)
    for (const kind of Object.keys(before)) assert.deepEqual(after[kind].map(r => r.id), ids(kind), `${kind} keep their IDs`)
    for (const kind of peers.unchanged) assert.deepEqual(after[kind], before[kind], `${kind} are untouched`)
    assert.deepEqual(await Promise.all(w.originals.peer.map(id => peers.fileBytes(h, id))), bytes, 'peer originals are byte-identical through the file door')
    assert.deepEqual(await history(), timeline, 'peer events keep their IDs, order and subjects')
    const kept = await counts()
    assert.ok(Object.values(records).every(list => list.length), 'the peer owns a customer, site, job, visit, invoice and payment')
    assert.deepEqual(kept, records, 'no peer customer, site, job, visit, invoice or payment is deleted')
    assert.deepEqual(await Promise.all(w.originals.subject.map(id => peers.fileBytes(h, id))), [404, 404, 404], 'the subject originals are gone')
    const s = await h.state(), invoice = s.invoices.find(i => i.id === w.invoices[1].invoice.id), payment = s.payments.find(p => p.id === w.invoices[1].payment.id)
    assert.equal(invoice.erasedAt, undefined); assert.equal(payment.erasedAt, undefined)
  })
  await scenario(t, 'DATA-007 point 3: no table, saved outcome, Activity, export or Worker log keeps a subject value or its unkeyed SHA-256, and client command IDs become random privacy IDs', async t => {
    const runs = []
    for (const label of ['first', 'second']) {
      const h = await installation({ captureLogs: true }); t.after(() => h.close())
      const w = await peers.peerWorld(h), places = await peers.stores(h)
      assert.throws(() => peers.assertNoSubject(places), /holds/, 'the seeded installation holds subject values, so the scan can fail')
      const stop = (await h.db.prepare('SELECT address_hash FROM glove_email_stop_secrets').all()).results
      assert.ok(stop.length && peers.digests().some(([, digest]) => digest === stop[0].address_hash), 'the review stop link saved an unkeyed digest of the subject email')
      assert.ok(h.logs.length > 0, 'the Worker log was captured')
      await peers.erase(h, w)
      const after = await peers.stores(h)
      assert.ok(after['Worker log'].length > 0)
      peers.assertNoSubject(after)
      const events = (await h.db.prepare("SELECT command_id FROM glove_events WHERE command_id LIKE 'privacy-%'").all()).results.map(r => r.command_id)
      const commands = (await h.db.prepare("SELECT id,result FROM glove_commands WHERE id LIKE 'privacy-%'").all()).results
      assert.ok(events.length && commands.length, `${label}: the client-chosen command identity was rewritten`)
      assert.ok(commands.every(c => /^privacy-[0-9a-f-]{36}$/.test(c.id) && JSON.parse(c.result).error.code === 'ERASED'))
      assert.equal((await h.db.prepare('SELECT count(*) AS n FROM glove_commands WHERE id=?').bind(w.commandId).first()).n, 0)
      assert.ok(!events.concat(commands.map(c => c.id)).includes('privacy-' + createHash('sha256').update(w.commandId).digest('hex')), 'never a plain hash of the original identity')
      runs.push(new Set([...events, ...commands.map(c => c.id)]))
    }
    assert.ok([...runs[0]].every(id => !runs[1].has(id)), 'identical subjects erased in two installations get different random identities')
  })
  await scenario(t, 'DATA-007 point 4: preview, erasure, command replay and Worker restart send nothing and attempt no remote deletion with email, Stripe test and Maps connected', async t => {
    const h = await installation({ captureLogs: true }); t.after(() => h.close())
    const w = await peers.peerWorld(h)
    const calls = () => [h.outbound.attempts, h.email.sent.length, h.twilio.calls.length, h.stripePayments.calls.length]
    const baseline = calls()
    assert.ok(baseline[1] >= 2, 'the subject was emailed before erasure, so a provider send would be visible')
    const preview = await peers.preview(h, w)
    assert.deepEqual(calls(), baseline, 'preview')
    const current = (await h.state()).customers.find(c => c.id === w.subject.id)
    const commandId = id(), payload = { customerId: current.id, version: current.version, confirm: 'ERASE', fingerprint: (await peers.preview(h, w)).fingerprint }
    const erased = await h.command('privacy.erase', payload, { commandId })
    assert.deepEqual(calls(), baseline, 'erasure')
    assert.equal(erased.outcome, 'complete')
    const replay = await h.request('/api/glove/commands', { method: 'POST', body: { commandId, type: 'privacy.erase', payload } }).then(r => r.json())
    assert.deepEqual(replay.result, erased, 'the same command identity recovers the recorded receipt')
    const echoed = await h.request('/api/glove/commands', { method: 'POST', body: { commandId: w.commandId, type: 'conversation.log', payload: { customerId: w.subject.id, kind: 'note', text: 'Client-chosen command identity' } } }).then(r => r.json())
    assert.equal(echoed.ok, false, 'a replayed personal command does not run again on the erased customer')
    assert.deepEqual(calls(), baseline, 'command replay')
    const state = JSON.stringify(await h.state())
    await h.restart()
    assert.equal(JSON.stringify(await h.state()), state, 'the restarted Worker holds the same erased records')
    assert.deepEqual(calls(), baseline, 'actual Worker restart')
    assert.equal(preview.customerIds.length, 2)
  })
})
