// DATA-006 points 5-8: tombstones, retirement, withdrawn originals and what peers keep.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { open, csvWorld, servicem8World, servicem8Files, IDS, sha, email, stored, importKitText, recordsText, originalBytes, preview, erase, exportOf, stageCsv, commit, undo, finish, csvText, csvSubjectValues, batchOf } from './shared-import-world.mjs'

const row = (name, who, street) => [name, email(who), ...(street ? [street] : [])]
const withdrawn = 'Source and Undo withdrawn for customer privacy'

export async function point5(t) {
  const h = await open(t)
  const send = (type, payload) => h.request('/api/glove/commands', { method: 'POST', body: { commandId: crypto.randomUUID(), type, payload } }).then(r => r.json())
  const a = await stageCsv(h, 'synthetic-glove-d6-a.csv', csvText([['Name', 'Email'], row('Synthetic Alpha', 'synthetic-glove-d6-alpha'), row('Synthetic Peer One', 'synthetic-glove-d6-one')]), { name: 'Name', email: 'Email' })
  await commit(h, a)
  const rows = Array.from({ length: 500 }, (_, i) => i === 40 ? row('Synthetic Alpha Duplicate', 'synthetic-glove-d6-dup') : row(`Synthetic Bulk ${String(i).padStart(3, '0')}`, `synthetic-glove-d6-bulk-${i}`))
  const b = await stageCsv(h, 'synthetic-glove-d6-b.csv', csvText([['Name', 'Email'], ...rows]), { name: 'Name', email: 'Email' })
  const pass = await send('import.commit', { batchId: b.id, version: b.version, fingerprint: b.preview.fingerprint })
  assert.equal(pass.error?.code, 'IMPORT_INCOMPLETE', 'the first pass leaves the 500-row batch part-way')
  assert.ok(pass.error.details.checkpoint > 41 && pass.error.details.checkpoint < 500)
  let s = await h.state()
  const find = name => s.customers.find(c => c.name === name)
  const alpha = find('Synthetic Alpha'), dup = find('Synthetic Alpha Duplicate')
  assert.ok(dup, 'the duplicate row was applied in the first pass')
  await h.command('customer.merge', { survivorId: alpha.id, mergedIds: [dup.id], versions: { [alpha.id]: alpha.version, [dup.id]: dup.version } })
  const subject = (await h.state()).customers.find(c => c.id === alpha.id)
  const p = await preview(h, subject)
  assert.deepEqual(p.retiredBatches, [], 'single-record rows are tombstoned, so no batch is retired')
  await erase(h, subject, p.fingerprint)
  // Both entries are now zero-effect tombstones; the batch resumes with the same commit.
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_d1_erased_sources').first()).n, 2)
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_d1_retirements').first()).n, 0)
  const resumed = await finish(h, 'import.commit', b)
  assert.equal(resumed.result.ok, true, JSON.stringify(resumed.result))
  s = await h.state()
  const bulkPeers = rows.filter((_, i) => i !== 40).map(r => r[0])
  assert.deepEqual(s.customers.filter(c => c.name.startsWith('Synthetic Bulk')).map(c => c.name).sort(), bulkPeers.sort(), 'every peer row applied once')
  assert.deepEqual(s.customers.filter(c => c.name === 'Erased customer').map(c => c.id).sort(), [alpha.id, dup.id].sort(), 'the subject was not recreated')
  assert.ok(!s.customers.some(c => /Synthetic Alpha/.test(c.name)))
  // Each peer batch's Undo removes exactly its own peer effects.
  const idsNow = () => h.state().then(x => x.customers.map(c => c.id).sort())
  const beforeB = await idsNow(), expectedB = s.customers.filter(c => c.name.startsWith('Synthetic Bulk')).map(c => c.id).sort()
  await undo(h, b)
  const afterB = await idsNow()
  assert.deepEqual(beforeB.filter(id => !afterB.includes(id)), expectedB, 'undoing the 500-row batch removes exactly its 499 peers')
  const one = (await h.state()).customers.find(c => c.name === 'Synthetic Peer One')
  await undo(h, a)
  const left = await h.state()
  assert.ok(!left.customers.some(c => c.id === one.id), 'undoing the first batch removes its peer')
  assert.deepEqual(left.customers.filter(c => c.name === 'Erased customer').map(c => c.id).sort(), [alpha.id, dup.id].sort(), 'the subject stays Erased customer')
  assert.equal(left.imports.find(i => i.id === b.id).status, 'undone')
}

export async function point6(t) {
  const h = await open(t)
  const blank = ['', email('synthetic-glove-d6-blank'), '9 Blank Street']
  const withSite = (n, who, street) => row(n, who, street)
  const head = ['Name', 'Email', 'Address']
  const stage = async (name, rows, mapping) => stageCsv(h, name, csvText(rows), mapping)
  // Y: the survivor's row maps customer and site together, which the kit cannot tombstone.
  const y = await stage('synthetic-glove-d6-y.csv', [head, withSite('Synthetic Alpha', 'synthetic-glove-d6-alpha', '11 Alpha Road'), blank, withSite('Synthetic Peer Y', 'synthetic-glove-d6-y', '61 Peer Road')])
  const yc = await commit(h, y)
  // L: a later batch reusing the same rejected source row, so it depends on Y's custody.
  const l = await stage('synthetic-glove-d6-l.csv', [head, withSite('Synthetic Peer L', 'synthetic-glove-d6-l', '62 Peer Road'), blank])
  const lc = await commit(h, l)
  // X: the duplicate's row holds only a customer, so the kit tombstones it.
  const x = await stage('synthetic-glove-d6-x.csv', [['Name', 'Email'], row('Synthetic Alpha Duplicate', 'synthetic-glove-d6-dup'), row('Synthetic Peer X', 'synthetic-glove-d6-x')], { name: 'Name', email: 'Email' })
  const xc = await commit(h, x)
  // Z: an uploaded original named exactly with the subject's email, holding only peers.
  const z = await stage(email('synthetic-glove-d6-alpha'), [['Name', 'Email'], row('Synthetic Peer Z', 'synthetic-glove-d6-z')], { name: 'Name', email: 'Email' })
  const zc = await commit(h, z)
  // W: untouched peers, and V: a peer's row that merely mentions the subject's street.
  const w = await stage('synthetic-glove-d6-w.csv', [head, withSite('Synthetic Peer W', 'synthetic-glove-d6-w', '71 Peer Road')])
  const wc = await commit(h, w)
  const s0 = await h.state(), by = name => s0.customers.find(c => c.name === name)
  const alpha = by('Synthetic Alpha'), dup = by('Synthetic Alpha Duplicate')
  await h.command('customer.merge', { survivorId: alpha.id, mergedIds: [dup.id], versions: { [alpha.id]: alpha.version, [dup.id]: dup.version } })
  const subject = (await h.state()).customers.find(c => c.id === alpha.id)
  const p = await preview(h, subject)
  const reasons = Object.fromEntries(p.retiredBatches.map(b => [b.jobId, b.reason]))
  assert.deepEqual(Object.keys(reasons).sort(), [yc.jobId, lc.jobId, zc.jobId].sort(), 'Y, the batch reusing Y and the batch named with the subject email are retired; X and W are not')
  assert.match(reasons[yc.jobId], /cannot tombstone this multi-target or attached source record/)
  assert.match(reasons[zc.jobId], /exact subject identifier is in the batch header or its dependent custody/)
  assert.match(reasons[lc.jobId], /exact subject identifier is in the batch header or its dependent custody/)
  await erase(h, subject, p.fingerprint)
  const after = await h.state(), batch = id => after.imports.find(i => i.id === id)
  for (const retired of [yc, lc, zc]) {
    assert.equal(batch(retired.id).status, 'privacy-withdrawn')
    assert.equal(batch(retired.id).label, withdrawn)
    await h.command('import.undo', { batchId: retired.id, version: batch(retired.id).version, reason: 'Try' }, { error: 'IMPORT_STATE' })
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_jobs WHERE id=?').bind(retired.jobId).first()).n, 0, 'a retired batch keeps no custody')
  }
  for (const kept of [xc, wc]) {
    assert.equal(batch(kept.id).status, 'committed')
    assert.notEqual(batch(kept.id).label, withdrawn)
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_jobs WHERE id=?').bind(kept.jobId).first()).n, 1, 'every other batch keeps its custody')
  }
  // The kept batches still undo; the retired ones' peers stay as native customers.
  await undo(h, batch(xc.id))
  await undo(h, batch(wc.id))
  const end = await h.state()
  assert.ok(!end.customers.some(c => ['Synthetic Peer X', 'Synthetic Peer W'].includes(c.name)))
  assert.ok(['Synthetic Peer Y', 'Synthetic Peer L', 'Synthetic Peer Z'].every(n => end.customers.some(c => c.name === n)))
  assert.deepEqual(end.customers.filter(c => c.name === 'Erased customer').map(c => c.id).sort(), [alpha.id, dup.id].sort())
}

export async function point7(t) {
  const h = await open(t)
  const w = await csvWorld(h), sm = await servicem8World(h)
  // A kept CSV batch (customer-only rows, so the kit tombstones them) with a column Glove does not map.
  const gate = { name: 'Synthetic Alpha Gate', email: email('synthetic-glove-d6-gate'), note: 'Gate code 4321 side door' }
  const unmapped = await stageCsv(h, 'synthetic-glove-d6-unmapped.csv', csvText([['Name', 'Email', 'Site note'], [gate.name, gate.email, gate.note], ['Synthetic Peer Unmapped', email('synthetic-glove-d6-unmapped'), 'Synthetic peer site note']]), { name: 'Name', email: 'Email' })
  const unmappedJob = (await commit(h, unmapped)).jobId
  const gateRecord = (await h.state()).customers.find(c => c.name === gate.name)
  const survivor = await w.subject()
  await h.command('customer.merge', { survivorId: survivor.id, mergedIds: [gateRecord.id], versions: { [survivor.id]: survivor.version, [gateRecord.id]: gateRecord.version } })
  const subject = await w.subject()
  const peersJob = w.batches.peers.committed.jobId, secondJob = w.batches.second.committed.jobId, firstJob = w.batches.first.committed.jobId
  const subjectPreview = await preview(h, subject)
  assert.ok(!subjectPreview.retiredBatches.some(b => b.jobId === unmappedJob), 'the unmapped-column batch is tombstoned, not retired')
  await erase(h, subject, subjectPreview.fingerprint)
  const smPreview = await preview(h, sm.people.balmain)
  assert.deepEqual(smPreview.retiredBatches, [], 'the ServiceM8 batch is tombstoned, not retired')
  await erase(h, sm.people.balmain, smPreview.fingerprint)
  assert.equal((await batchOf(h, unmapped.id)).status, 'committed', 'the CSV batch keeps its Undo')
  assert.equal((await batchOf(h, sm.staged.id)).status, 'committed', 'the ServiceM8 batch keeps its Undo')
  // The retired batch holds no original at all.
  assert.deepEqual([(await h.db.prepare('SELECT count(*) AS n FROM ik_originals WHERE job_id=?').bind(firstJob).first()).n, (await h.db.prepare('SELECT count(*) AS n FROM ik_d1_original_chunks WHERE job_id=?').bind(firstJob).first()).n], [0, 0])
  // The withdrawn shared file in a kept batch keeps no chunk and no bytes, only a bytes-free tombstone row under an anonymous name.
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_d1_original_chunks WHERE job_id=?').bind(secondJob).first()).n, 0)
  const tombs = (await h.db.prepare('SELECT name,sha256,bytes FROM ik_originals WHERE job_id=?').bind(secondJob).all()).results
  assert.deepEqual(tombs.map(r => [r.name.startsWith('erased-artifact:'), r.bytes, r.sha256]), [[true, null, sha(w.files.second.text)]])
  // Every ServiceM8 file that held the subject's records is gone from chunks; the staff file holds no customer and stays byte-exact.
  const keys = (await h.db.prepare('SELECT DISTINCT original_key FROM ik_d1_original_chunks WHERE job_id=?').bind(sm.committed.jobId).all()).results.map(r => JSON.parse(r.original_key)[0])
  assert.deepEqual(keys, ['staff.json'])
  const staff = sm.files.find(f => f.name === 'staff.json')
  assert.equal((await originalBytes(h, sm.committed.jobId, 'staff.json', sha(staff.text))).toString(), staff.text)
  // A batch of untouched peers keeps its original whole.
  assert.equal((await originalBytes(h, peersJob, w.files.peers.name, sha(w.files.peers.text))).toString(), w.files.peers.text)
  // No subject value remains in any import-kit table, including blob bytes.
  const subjectValues = [...csvSubjectValues(), 'Balmain Bakehouse', '88 Darling St', 'PO Box 12', 'Nadia', 'Haddad', ['nadia', 'balmainbakehouse.example'].join('@'), '0412 000 111', 'Coolroom compressor not starting', 'Replaced start capacitor', 'Synthetic subject payment source', 'Synthetic client terms', gate.name, gate.email, gate.note]
  const text = await importKitText(h)
  for (const [table, body] of Object.entries(text)) for (const value of subjectValues) assert.ok(!body.includes(value), `${table} holds no ${value}`)
  // The batch records in glove_records, which rer export carries, keep no uploaded file: no source text and no attachment bytes.
  const records = await recordsText(h), b64 = value => Buffer.from(value).toString('base64')
  const photo = b64(await readFile('./tests/fixtures/servicem8-small-hvac/attachment-' + IDS.jobAttachment + '.jpg'))
  const uploaded = [gate.note, photo.slice(0, 80), photo.slice(-80), b64('Synthetic signoff naming two customers\n'), b64('Synthetic client terms\n')]
  for (const value of [...subjectValues, ...uploaded]) assert.ok(!records.includes(value), `glove_records holds no ${value.slice(0, 40)}`)
  for (const batch of [unmapped, sm.staged]) {
    const row = (await stored(h)).glove_records.find(r => r.kind === 'imports' && r.id === batch.id)
    assert.ok(row && !('files' in JSON.parse(row.data)), 'a kept batch record holds no uploaded files')
  }
  assert.ok(text.ik_jobs.includes('Rozelle Physio') || Object.values(text).some(b => b.includes('Rozelle Physio')), 'the peer ServiceM8 custody is still there')
  assert.ok(Object.values(text).some(b => b.includes('Synthetic Peer Three')))
}

const strip = ({ exportedAt: _a, ...rest }) => rest
async function peerView(h, c) {
  const { outcome, data } = await exportOf(h, c)
  const { importCustody, importOriginals, omissions } = data
  return { outcome, importCustody, importOriginals, omissions, customer: data.records.customers.map(r => ({ id: r.id, name: r.name, source: r.source })) }
}

export async function point8(t) {
  const h = await open(t)
  const w = await csvWorld(h), sm = await servicem8World(h)
  const subject = await w.subject(), { one, two, three } = w.people, { rozelle, tenant } = sm.people
  await erase(h, subject, (await preview(h, subject)).fingerprint)
  await erase(h, sm.people.balmain, (await preview(h, sm.people.balmain)).fingerprint)
  const view = async () => {
    const s = await h.state(), c = p => s.customers.find(x => x.id === p.id)
    return { one: await peerView(h, c(one)), two: await peerView(h, c(two)), three: await peerView(h, c(three)), rozelle: await peerView(h, c(rozelle)), tenant: await peerView(h, c(tenant)) }
  }
  const v = await view()
  const named = (list, file) => list.filter(o => o.artifact === file.name)
  // Peer One's batch was retired: its native record stays and its export names the byte-exact file by name and digest.
  assert.deepEqual(named(v.one.omissions, w.files.first).map(o => o.sourceSha256), [sha(w.files.first.text)])
  assert.deepEqual(v.one.customer.map(c => c.name), ['Synthetic Peer One'])
  // Peer Two's batch keeps its custody: the record's own source payload and a projection holding only that row.
  assert.deepEqual(named(v.two.omissions, w.files.second).map(o => o.sourceSha256), [sha(w.files.second.text)])
  assert.equal(v.two.omissions.length, 1, 'the withdrawn file is named once')
  assert.ok(JSON.stringify(v.two.importCustody).includes('Synthetic Peer Two'))
  // The byte-exact CSV is withdrawn, so the export projects only this peer's own source record (its row, customer and site).
  const projected = v.two.importOriginals.filter(o => o.kind === 'artifact').map(o => JSON.parse(Buffer.from(o.bytes, 'base64').toString()))
  assert.equal(projected.length, 1)
  assert.deepEqual(projected[0].map(r => [r.rows, r.customer.name, r.customer.email, r.sites.map(x => x.address)]), [[[3], 'Synthetic Peer Two', email('synthetic-glove-d6-two'), ['22 Peer Road']]])
  assert.ok(v.two.importOriginals.every(o => o.projection))
  assert.ok(!JSON.stringify(v.two).includes('Synthetic Alpha'))
  // Peers of the untouched batch see no omission and a complete export.
  assert.deepEqual([v.three.omissions, v.three.outcome], [[], 'complete'])
  assert.ok(JSON.stringify(v.three.importCustody).includes('Synthetic Peer Three'))
  // ServiceM8: Rozelle keeps its source records, and the shared attachment is named with its digest.
  const shared = `attachments/${IDS.sharedAttachment}`
  assert.ok(v.rozelle.omissions.some(o => o.artifact === shared && o.sourceSha256 === sha('Synthetic signoff naming two customers\n')))
  assert.ok(JSON.stringify(v.rozelle.importCustody).includes('Rozelle Physio') && JSON.stringify(v.rozelle.importCustody).includes('Synthetic peer payment source'))
  assert.ok(!JSON.stringify(v.rozelle).includes('Balmain Bakehouse') && !JSON.stringify(v.rozelle).includes('Synthetic subject payment source'))
  assert.ok(v.tenant.omissions.some(o => o.artifact === 'company.json'))
  // The Worker restarts: the same peers see the same exports and the same retained custody.
  const stateBefore = JSON.stringify((await h.state()).imports), storedBefore = JSON.stringify(await stored(h))
  await h.restart()
  assert.equal(JSON.stringify(await stored(h)), storedBefore, 'restart leaves every record and original as it was')
  assert.equal(JSON.stringify((await h.state()).imports), stateBefore)
  assert.deepEqual(await view(), v)
  // Activity and the business export carry attributable, value-free records of the previews and erasures.
  const exportBody = await h.request('/api/glove/export').then(r => r.json())
  const privacy = exportBody.timeline.filter(e => e.kind.startsWith('privacy.'))
  assert.deepEqual(['privacy.erase', 'privacy.preview'].map(k => privacy.filter(e => e.kind === k).length), [2, 2], 'both erasures and both previews are recorded in Activity')
  for (const e of privacy) assert.deepEqual([e.actor_name, e.actor_role], ['Olivia Owner', 'owner'], 'each record names the signed-in owner')
  for (const e of privacy.filter(e => e.kind === 'privacy.erase')) {
    const data = JSON.parse(e.data)
    assert.deepEqual(Object.keys(data).sort(), ['customerIds', 'outcome', 'recordChanges'])
    for (const change of data.recordChanges) assert.deepEqual(Object.keys(change).sort(), ['fields', 'fromVersion', 'id', 'kind', 'toVersion'], 'the record changes name fields, never values')
  }
  const text = JSON.stringify(exportBody)
  for (const value of [...csvSubjectValues(), 'Balmain Bakehouse', '88 Darling St']) assert.ok(!text.includes(value), `the business export holds no ${value}`)
  assert.ok(!/authorization|bearer |api[_-]?key|password/i.test(JSON.stringify(privacy)), 'privacy Activity carries no secret')
}
