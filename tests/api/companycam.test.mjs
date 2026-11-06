import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { companycamImportMatrix } from '../fixtures/companycam.mjs'
import { assertTrail, installation, business, completedJob } from './harness.mjs'

test('DATA-002, DATA-009, DATA-010 / API-004, API-008 CompanyCam project photos flow both ways once, with address checks, private keys and honest uncertain outcomes', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h), { job, visit } = await completedJob(h, b)
  const bytes = await readFile('tests/fixtures/companycam-unit.jpg')
  const capture = await b.priyaPerson.run('visit.capture', { visitId: visit.id, kind: 'photo', deviceTime: '2026-10-19T13:00:00Z', caption: 'Evaporator coil after cleaning', photo: { mediaType: 'image/jpeg', base64: bytes.toString('base64') } })
  const latest = async () => (await h.state()).jobs.find(j => j.id === job.id)
  const run = async (type, fields = {}, opts = {}) => h.command(type, { jobId: job.id, version: (await latest()).version, ...fields }, opts)
  await b.office.run('companycam.connect', { key: 'fixture-only-companycam-key' }, { error: 'FORBIDDEN' })
  await h.command('companycam.connect', { key: 'fixture-only-companycam-key' })
  h.companycam.projects.set('42', { id: '42', name: 'Harbourview Dental HVAC', address: { street_address_1: '14 Harbour St', street_address_2: null, city: 'Balmain', state: 'NSW', postal_code: '2041', country: null } })
  h.companycam.projects.set('43', { id: '43', name: 'Other property', address: { street_address_1: '99 Other St', city: 'Elsewhere', state: 'TX', postal_code: '75001', country: 'US' } })
  await run('companycam.link', { projectId: '43' }, { error: 'COMPANYCAM_ADDRESS' })
  assert.equal((await latest()).companycam, undefined)
  const linked = await run('companycam.link', { projectId: '42' })
  assert.equal(linked.companycam.projectId, '42')
  const originals = companycamImportMatrix(h.companycam, bytes)
  const before = await h.request('/api/glove/export').then(r => r.json())
  const commandIdPull = crypto.randomUUID()
  const pullPayload = { jobId: job.id, version: (await latest()).version }
  const pulled = await h.command('companycam.pull', pullPayload, { commandId: commandIdPull })
  const expectedErrors = [
    { photoId: '502', message: 'The original must be JPEG, PNG or WebP, as for Glove photos.' },
    { photoId: '503', message: 'This original exceeds Glove’s 1.5 MB photo limit; resize it in CompanyCam before importing.' },
    { photoId: '505', message: 'The photo is not an active, processed image yet.' },
    { photoId: '506', message: 'The photo is not an active, processed image yet.' },
    { photoId: '508', message: 'CompanyCam supplied no original image URL.' },
    { photoId: '509', message: 'CompanyCam photo is not a image/jpeg image.' },
    { photoId: '510', message: 'This original exceeds Glove’s 1.5 MB photo limit; resize it in CompanyCam before importing.' },
    { photoId: '511', message: 'CompanyCam supplied no valid capture time.' },
    { photoId: '512', message: 'This original exceeds Glove’s 1.5 MB photo limit; resize it in CompanyCam before importing.' },
  ]
  assert.deepEqual(pulled.imported, ['501', '504', '507', '513'])
  assert.deepEqual(pulled.errors, expectedErrors)
  const imported = (await h.state()).captures.filter(c => c.origin?.system === 'CompanyCam').sort((a, b) => a.origin.photoId.localeCompare(b.origin.photoId))
  assert.deepEqual(imported.map(c => [c.origin.photoId, c.caption, c.deviceTime, c.file.mediaType]), [
    ['501', 'Nameplate before service', '2026-10-19T13:00:00.000Z', 'image/jpeg'],
    ['504', 'Roof access', '2026-10-19T13:01:00.000Z', 'image/png'],
    ['507', 'Panel before service', '2026-10-19T13:02:00.000Z', 'image/webp'],
    ['513', 'Later valid original', '2026-10-19T13:03:00.000Z', 'image/jpeg'],
  ])
  const assertOriginals = async () => {
    for (const [i, original] of [originals.jpeg, originals.png, originals.webp, originals.later].entries()) {
      assert.equal(imported[i].technicianId, null); assert.equal(imported[i].visitId, null); assert.equal(imported[i].kind, 'photo')
      assert.equal(imported[i].jobId, job.id)
      const file = await h.request(`/api/glove/files/${imported[i].file.fileId}`, { as: b.priyaPerson.cookie })
      assert.equal(file.status, 200); assert.ok(Buffer.from(await file.arrayBuffer()).equals(original), 'CompanyCam original bytes are unchanged')
      assert.equal((await h.request(`/api/glove/files/${imported[i].file.fileId}`, { as: b.tomPerson.cookie })).status, 404)
    }
  }
  await assertOriginals()
  const after = await h.request('/api/glove/export').then(r => r.json())
  assert.deepEqual(after.files.filter(f => !before.files.some(old => old.id === f.id)).map(f => f.id).sort(), imported.map(c => c.file.fileId).sort(), 'only accepted originals create files')
  assert.deepEqual(after.captures.filter(c => !before.captures.some(old => old.id === c.id)).map(c => c.id).sort(), imported.map(c => c.id).sort(), 'refused provider records create no capture')
  assert.deepEqual(await h.command('companycam.pull', pullPayload, { commandId: commandIdPull }), pulled, 'command replay preserves the recorded outcome')
  const repeated = await run('companycam.pull')
  assert.deepEqual(repeated.imported, []); assert.deepEqual(repeated.errors, expectedErrors)
  await h.restart()
  assert.deepEqual((await latest()).companycam.lastPull, repeated, 'every refusal survives an actual Worker restart')
  await assertOriginals()
  assert.deepEqual((await h.state()).captures.filter(c => c.origin?.system === 'CompanyCam').sort((a, b) => a.origin.photoId.localeCompare(b.origin.photoId)), imported)
  const keptFiles = await h.request('/api/glove/export').then(r => r.json())
  assert.deepEqual(keptFiles.files.map(f => f.id).sort(), after.files.map(f => f.id).sort(), 'replay and restart create no file')
  assert.deepEqual(h.companycam.calls.filter(c => c.method === 'GET' && c.path === '/projects/42/photos').slice(0, 5).map(c => c.query), ['?limit=100', '?limit=100&after=3', '?limit=100&after=6', '?limit=100&after=9', '?limit=100&after=12'])
  const noDownload = ['505', '506', '508', '511']
  assert.ok(h.companycam.calls.filter(c => c.path.startsWith('/photos/') && c.path.endsWith('.jpg')).every(c => !c.authorization && !noDownload.some(id => c.path === `/photos/${id}.jpg`)), 'unready records are not fetched and no credential reaches the photo host')
  const activity = await h.request('/api/glove/activity').then(r => r.json())
  const importEvent = activity.events.find(e => e.commandId === commandIdPull && e.kind === 'companycam.imported')
  assert.equal(importEvent.jobId, job.id); assert.equal(importEvent.actorId, (await h.state()).actor.id)
  assert.equal(importEvent.actorRole, 'owner'); assert.ok(importEvent.at)
  assert.equal(importEvent.summary, 'CompanyCam: imported 4 photos; 9 photo errors')
  const exportedEvent = after.timeline.find(e => e.id === importEvent.id)
  assert.equal(exportedEvent.actor_id, importEvent.actorId); assert.equal(exportedEvent.command_id, commandIdPull)
  assert.deepEqual(JSON.parse(exportedEvent.data).imported, ['501', '504', '507', '513']); assert.deepEqual(JSON.parse(exportedEvent.data).errors, expectedErrors)
  const commandId = crypto.randomUUID()
  const sent = await run('companycam.send', { captureId: capture.id }, { commandId })
  assert.equal(sent.phase, 'complete'); assert.equal(sent.captionState, 'confirmed')
  assert.equal(h.companycam.photos.get(sent.photoId).description.plain_text_content, capture.caption)
  assert.deepEqual(await run('companycam.send', { captureId: capture.id }, { commandId }), sent)
  assert.equal((await run('companycam.send', { captureId: capture.id })).photoId, sent.photoId)
  const posts = () => h.companycam.calls.filter(c => c.method === 'POST' && c.path === '/projects/42/photos')
  assert.equal(posts().length, 1); assert.deepEqual(Buffer.from(posts()[0].bytes), bytes)
  assert.deepEqual(posts()[0].fields.sort(), ['photo[photo_data]'])
  assert.deepEqual((await run('companycam.pull')).imported, [], 'an exported photo does not loop back as another capture')
  await run('companycam.send', { captureId: imported[0].id }, { error: 'COMPANYCAM_PHOTO' })
  // The provider stores a second image but its response is lost. Neither a replay nor a fresh click uploads twice.
  const otherBytes = Buffer.concat([bytes, Buffer.from('second Glove original')])
  const second = await b.priyaPerson.run('visit.capture', { visitId: visit.id, kind: 'photo', deviceTime: '2026-10-19T13:05:00Z', caption: 'Drain pan after service', photo: { mediaType: 'image/jpeg', base64: otherBytes.toString('base64') } })
  h.companycam.loseUploadResponse = true
  const uncertain = await run('companycam.send', { captureId: second.id })
  assert.equal(uncertain.phase, 'unknown'); assert.equal(uncertain.photoId, null)
  const lostPhotoId = String(h.companycam.nextId)
  await run('companycam.send', { captureId: second.id }); assert.equal(posts().length, 2)
  h.companycam.loseUploadResponse = false
  const whileUncertain = await run('companycam.pull')
  assert.ok(whileUncertain.errors.some(e => e.photoId === lostPhotoId && /unknown outcome/.test(e.message)))
  await run('companycam.reconcile', { captureId: second.id, photoId: sent.photoId }, { error: 'COMPANYCAM_PHOTO' })
  const reconciled = await run('companycam.reconcile', { captureId: second.id, photoId: lostPhotoId })
  assert.equal(reconciled.phase, 'confirmed by owner'); assert.equal(reconciled.captionState, 'not sent')
  assert.equal((await run('companycam.send', { captureId: second.id })).photoId, lostPhotoId)
  assert.equal(posts().length, 2)
  const s = await h.state(), exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(s.events.some(e => e.kind === 'companycam.imported' && e.jobId === job.id))
  assert.ok(s.events.some(e => /outcome unknown/.test(e.summary)))
  assert.equal(exported.companycamUploads.length, 2)
  assert.ok(!JSON.stringify([s, exported]).includes('fixture-only-companycam-key'))
  assert.equal(s.visits.filter(v => v.jobId === job.id).length, 1, 'CompanyCam photos create no visits or arrival/sign-off')
  assert.equal((await latest()).status, 'completed')
  assert.equal((await h.request(`/api/glove/jobs/${job.id}/companycam`, { as: b.priyaPerson.cookie })).status, 403)
  await h.command('companycam.connect', { key: null })
  await run('companycam.pull', {}, { error: 'COMPANYCAM' })
  await assertTrail(h, ['companycam.configured', 'companycam.linked', 'companycam.imported', 'companycam.uploadOutcome', 'companycam.export', 'companycam.disconnected'])
})
