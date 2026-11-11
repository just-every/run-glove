// DATA-006 points 1-4: shared import sources, the bound preview and the confirmed erasure.
import assert from 'node:assert/strict'
import { open, csvWorld, servicem8World, IDS, sha, email, stored, preview, erase, originalBytes, csvSubjectValues, stageCsv, commit, undo } from './shared-import-world.mjs'

const cannotTombstone = /cannot tombstone this multi-target or attached source record/
const byName = (a, b) => a.name < b.name ? -1 : 1
const ids = list => list.map(c => c.id).sort()

export async function point1(t) {
  const h = await open(t)
  const w = await csvWorld(h)
  const { alpha, one } = w.people, s = await h.state()
  // One CSV row maps the subject's customer and site, with the row's position recorded on both.
  const site = s.sites.find(x => x.customerId === alpha.id)
  assert.deepEqual([alpha.source.file, alpha.source.row, site.source.file, site.source.row], [w.files.first.name, 2, w.files.first.name, 2])
  assert.deepEqual(w.batches.first.staged.preview.effects, { customers: 2, sites: 2 })
  const jobId = w.batches.first.committed.jobId
  assert.equal((await h.db.prepare('SELECT count(*) AS n FROM ik_sources WHERE job_id=?').bind(jobId).first()).n, 2, 'two rows are two source records, each with its customer and site')
  // One CSV file holds several people's source data, kept byte-exact in one retained original.
  assert.equal((await originalBytes(h, jobId, w.files.first.name, sha(w.files.first.text))).toString(), w.files.first.text)
  const subject = await w.subject(), p = await preview(h, subject)
  assert.deepEqual(p.sharedOriginals.filter(a => a.name === w.files.first.name).map(a => [a.peerIds, a.sha256]), [[[one.id], sha(w.files.first.text)]])
  // One ServiceM8 attachment holds the source data of two customers: both name it in their own payments.
  const sm = await servicem8World(h), shared = `attachments/${IDS.sharedAttachment}`
  const named = c => preview(h, c).then(q => q.sharedOriginals.filter(a => a.name === shared).map(a => a.peerIds))
  assert.deepEqual(await named(sm.people.balmain), [[sm.people.rozelle.id]])
  assert.deepEqual(await named(sm.people.rozelle), [[sm.people.balmain.id]])
  assert.equal((await originalBytes(h, sm.committed.jobId, shared, sha('Synthetic signoff naming two customers\n'))).toString(), 'Synthetic signoff naming two customers\n')
}

export async function point2(t) {
  const h = await open(t)
  const w = await csvWorld(h)
  let subject = await w.subject()
  const earlier = subject.version
  const edited = await h.command('customer.save', { ...subject, phone: '+61 400 000 006' })
  subject = edited
  const fresh = await preview(h, subject)
  // A preview of an earlier customer version is refused.
  await h.command('privacy.preview', { customerId: subject.id, version: earlier }, { error: 'STALE' })
  // A fingerprint taken before the subject's next edit is refused at the current version.
  const edited2 = await h.command('customer.save', { ...subject, phone: '+61 400 000 007' })
  const before = JSON.stringify(await stored(h)), names = (await h.state()).customers.map(c => c.name)
  await h.command('privacy.erase', { customerId: subject.id, version: edited2.version, confirm: 'ERASE', fingerprint: fresh.fingerprint }, { error: 'STALE_PREVIEW' })
  await h.command('privacy.erase', { customerId: subject.id, version: earlier, confirm: 'ERASE', fingerprint: fresh.fingerprint }, { error: 'STALE' })
  // Without the confirmation, without the fingerprint, or with a fingerprint of another customer.
  const current = await preview(h, edited2)
  await h.command('privacy.erase', { customerId: subject.id, version: edited2.version, fingerprint: current.fingerprint }, { error: 'CONSENT' })
  await h.command('privacy.erase', { customerId: subject.id, version: edited2.version, confirm: 'erase', fingerprint: current.fingerprint }, { error: 'CONSENT' })
  await h.command('privacy.erase', { customerId: subject.id, version: edited2.version, confirm: 'ERASE' }, { error: 'STALE_PREVIEW' })
  await h.command('privacy.erase', { customerId: subject.id, version: edited2.version, confirm: 'ERASE', fingerprint: (await preview(h, w.people.three)).fingerprint }, { error: 'STALE_PREVIEW' })
  assert.equal(JSON.stringify(await stored(h)), before, 'no record, original or import custody changed')
  assert.deepEqual((await h.state()).customers.map(c => c.name), names, 'nothing was erased')
  // The same call with the current fingerprint is the one that succeeds.
  await erase(h, edited2, (await preview(h, edited2)).fingerprint)
  assert.equal((await h.state()).customers.find(c => c.id === subject.id).name, 'Erased customer')
}

export async function point3Csv(t) {
  const h = await open(t)
  const w = await csvWorld(h)
  const subject = await w.subject(), { alpha, dup, one, two } = w.people
  const group = [alpha.id, dup.id]
  // Independent enumeration straight from the stored rows.
  const state = await h.state(), values = [...csvSubjectValues(), ...group, ...state.sites.filter(x => group.includes(x.customerId)).map(x => x.id), ...state.merges.map(m => m.id)]
  const mentioning = async table => (await h.db.prepare(`SELECT * FROM ${table}`).all()).results.filter(r => values.some(v => JSON.stringify(r).includes(v))).length
  const expectedCounts = { customers: 2, sites: 2, merges: 1, imports: 2, importBatches: 2, glove_events: await mentioning('glove_events'), glove_commands: await mentioning('glove_commands') }
  const recordsBefore = JSON.stringify(await stored(h))
  const p = await preview(h, subject)
  assert.equal(JSON.stringify(await stored(h)), recordsBefore, 'a preview changes no record, original or import custody')
  assert.deepEqual(Object.fromEntries(Object.entries(p.counts).filter(([, n]) => n)), expectedCounts)
  assert.deepEqual(p.customerIds, group.sort())
  assert.deepEqual(p.retiredBatches.map(b => b.jobId), [w.batches.first.committed.jobId], 'only the batch whose survivor row maps customer and site together is retired')
  assert.match(p.retiredBatches[0].reason, cannotTombstone)
  assert.deepEqual(p.sharedOriginals.map(a => ({ name: a.name, sha256: a.sha256, peers: a.peers, peerIds: a.peerIds })).sort(byName), [
    { name: w.files.first.name, sha256: sha(w.files.first.text), peers: 1, peerIds: [one.id] },
    { name: w.files.second.name, sha256: sha(w.files.second.text), peers: 1, peerIds: [two.id] },
  ])
  assert.equal(p.peersAffected, 2)
}

// Expected by hand from the ServiceM8 small-HVAC fixture: the source files that hold another customer's records.
export async function point3ServiceM8(t) {
  const h = await open(t)
  const sm = await servicem8World(h), { balmain, rozelle, tenant } = sm.people
  const att = k => `attachments/${IDS[k]}`
  const expected = {
    'company.json': ids([rozelle, tenant]), 'companycontact.json': [rozelle.id], 'job.json': [rozelle.id], 'jobactivity.json': [rozelle.id], 'jobmaterial.json': [rozelle.id], 'jobpayment.json': [rozelle.id], 'attachment.json': [rozelle.id],
    [att('jobAttachment')]: [], [att('sharedAttachment')]: [rozelle.id], [att('companyAttachment')]: [],
  }
  const state = await h.state(), jobs = state.jobs.filter(j => j.customerId === balmain.id)
  const before = JSON.stringify(await stored(h))
  const p = await preview(h, balmain)
  assert.equal(JSON.stringify(await stored(h)), before, 'a preview changes no record')
  assert.deepEqual(Object.fromEntries(p.sharedOriginals.map(a => [a.name, a.peerIds])), expected)
  for (const a of p.sharedOriginals) assert.equal(a.peers, expected[a.name].length)
  assert.deepEqual(p.retiredBatches, [], 'the kit tombstones every ServiceM8 record of the subject')
  assert.equal(p.peersAffected, 2)
  assert.deepEqual([p.counts.customers, p.counts.sites, p.counts.jobs, p.counts.imports, p.counts.importBatches], [1, 1, jobs.length, 1, 1])
  assert.equal(p.counts.visits, state.visits.filter(v => jobs.some(j => j.id === v.jobId)).length)
  assert.equal(p.counts.captures, state.captures.filter(c => jobs.some(j => j.id === c.jobId)).length)
  // The peer's own preview counts the subject on the same typed relationships.
  assert.deepEqual((await preview(h, rozelle)).sharedOriginals.find(a => a.name === att('sharedAttachment')).peerIds, [balmain.id])
}

export async function point4(t) {
  const h = await open(t)
  const w = await csvWorld(h)
  const subject = await w.subject()
  const attempt = (fingerprint, opts) => h.command('privacy.erase', { customerId: subject.id, version: subject.version, confirm: 'ERASE', fingerprint }, opts)
  const unchanged = async (label, run) => { const before = JSON.stringify(await stored(h)); await run(); assert.equal(JSON.stringify(await stored(h)), before, label) }
  await h.command('privacy.erase', { customerId: subject.id, version: subject.version, fingerprint: (await preview(h, subject)).fingerprint }, { error: 'CONSENT' })
  // A peer batch commits after the preview was taken.
  const earlier = await preview(h, subject)
  const staged = await stageCsv(h, 'synthetic-glove-d6-late.csv', 'Name,Email,Address\n' + ['Synthetic Peer Five', email('synthetic-glove-d6-five'), '51 Peer Road'].join(',') + '\n')
  const late = await commit(h, staged)
  await unchanged('a fingerprint from before a peer commit changes nothing', () => attempt(earlier.fingerprint, { error: 'STALE_PREVIEW' }))
  // A peer batch is undone after the next preview was taken.
  const middle = await preview(h, subject)
  await undo(h, late)
  await unchanged('a fingerprint from before a peer undo changes nothing', () => attempt(middle.fingerprint, { error: 'STALE_PREVIEW' }))
  const current = await preview(h, subject)
  const receipt = await attempt(current.fingerprint)
  assert.equal(receipt.action, 'erase')
  assert.deepEqual(receipt.customerIds, current.customerIds)
  const after = await h.state()
  assert.ok(after.customers.filter(c => current.customerIds.includes(c.id)).every(c => c.name === 'Erased customer'))
  await h.command('privacy.erase', { customerId: subject.id, version: subject.version, confirm: 'ERASE', fingerprint: current.fingerprint }, { error: 'ERASED' })
}
