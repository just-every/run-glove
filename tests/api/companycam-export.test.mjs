import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { installation, business, completedJob, assertTrail } from './harness.mjs'

const bytes = await readFile('tests/fixtures/companycam-unit.jpg')
const project = { id: '42', name: 'Service photos', address: { street_address_1: '14 Harbour St', city: 'Balmain', state: 'NSW', postal_code: '2041' } }
const posts = h => h.companycam.calls.filter(c => c.method === 'POST')
const reservations = async h => (await h.request('/api/glove/export').then(r => r.json())).companycamUploads
async function photos(h) {
  const b = await business(h), { job, visit } = await completedJob(h, b)
  const latest = async () => (await h.state()).jobs.find(j => j.id === job.id)
  const payload = async fields => ({ jobId: job.id, version: (await latest()).version, ...fields })
  const run = async (type, fields, opts) => h.command(type, await payload(fields), opts)
  const capture = async (caption, suffix = caption) => b.priyaPerson.run('visit.capture', { visitId: visit.id, kind: 'photo', deviceTime: '2026-10-19T13:00:00Z', caption, photo: { mediaType: 'image/jpeg', base64: Buffer.concat([bytes, Buffer.from(suffix)]).toString('base64') } })
  await h.command('companycam.connect', { key: 'synthetic-glove-801' })
  h.companycam.projects.set('42', project)
  await run('companycam.link', { projectId: '42' })
  return { b, job, visit, latest, payload, run, capture }
}

test('API-008 minimal photo disclosure retains confirmed provider outcomes across replay and Worker restart', async t => {
  const h = await installation(); t.after(() => h.close())
  const f = await photos(h), photo = await f.capture('Coil after service', '')
  h.companycam.beforeUpload = async () => {
    const rows = await reservations(h)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].phase, 'sending', 'reservation is committed before the provider receives any bytes')
    assert.equal(rows[0].capture_id, photo.id)
  }
  const commandId = crypto.randomUUID(), payload = await f.payload({ captureId: photo.id })
  const sent = await f.b.dispatcher.run('companycam.send', payload, { commandId })
  assert.equal(sent.phase, 'complete'); assert.equal(sent.captionState, 'confirmed'); assert.ok(sent.photoId)
  const [upload, caption] = posts(h)
  assert.deepEqual(upload.fields, ['photo[photo_data]'])
  assert.deepEqual(Buffer.from(upload.bytes), bytes)
  assert.equal(upload.mediaType, 'image/jpeg'); assert.equal(upload.fileName, `glove-${photo.id}.jpg`)
  assert.deepEqual(caption.body, { description: { content: 'Coil after service' } })
  assert.equal(caption.path, `/photos/${sent.photoId}/descriptions`)
  const kept = await reservations(h)
  assert.equal(kept[0].remote_id, sent.photoId); assert.equal(kept[0].caption_state, 'confirmed')
  assert.deepEqual(await f.b.dispatcher.run('companycam.send', payload, { commandId }), sent)
  assert.deepEqual(await f.run('companycam.send', { captureId: photo.id }), sent)
  await h.restart()
  assert.deepEqual(await reservations(h), kept)
  assert.deepEqual(await f.b.dispatcher.run('companycam.send', payload, { commandId }), sent)
  assert.deepEqual(await f.run('companycam.send', { captureId: photo.id }), sent)
  assert.equal(posts(h).length, 2, 'exactly one image request and one caption request for the original')
  assert.deepEqual((await f.run('companycam.pull')).imported, [])
  const { activity, exported } = await assertTrail(h, ['companycam.linked', 'companycam.uploadOutcome', 'companycam.export', 'companycam.imported'])
  const timeline = await h.request(`/api/glove/jobs/${f.job.id}/timeline`).then(r => r.json())
  for (const kind of ['companycam.linked', 'companycam.uploadOutcome', 'companycam.export', 'companycam.imported']) {
    const e = activity.find(e => e.kind === kind)
    assert.equal(e.jobId, f.job.id); assert.ok(e.actorId && e.at && e.commandId)
    assert.ok(timeline.events.some(x => x.id === e.id))
    assert.ok(exported.timeline.some(x => x.id === e.id))
  }
  const outcome = exported.timeline.find(e => e.kind === 'companycam.uploadOutcome')
  assert.equal(JSON.parse(outcome.data).photoId, sent.photoId)
  assert.ok(!JSON.stringify(exported).includes('synthetic-glove-801'))
})

test('API-008 current authority and snapshot guard refuse unsafe sends and concurrent sends reserve one upload', async t => {
  // Pause scheduling immediately before the real reservation batch; no guard,
  // command result or D1 answer is replaced by this test-only barrier.
  const h = await installation({ workerPlugins: [{ name: 'companycam-reservation-barrier', setup(build) {
    build.onLoad({ filter: /\/companycam\/uploads\.ts$/ }, async args => {
      const source = await readFile(args.path, 'utf8')
      return { contents: source.replace('const id = newId(), a = authority(c.actor)', "await fetch('https://worker-checkpoint.example.test/qbo-complete')\n  const id = newId(), a = authority(c.actor)"), loader: 'ts', resolveDir: dirname(args.path) }
    })
  } }] }); t.after(() => h.close())
  const f = await photos(h), photo = await f.capture('Authority photo')
  const noSend = async action => {
    const before = await reservations(h), n = posts(h).length
    await action()
    assert.deepEqual(await reservations(h), before); assert.equal(posts(h).length, n)
  }
  const custom = await h.command('role.save', { name: 'Photo reader', permissions: ['customer.save'] })
  const reader = await h.person('Synthetic Photo Reader', `custom:${custom.id}`)
  for (const actor of [f.b.office, f.b.priyaPerson, reader]) await noSend(async () => actor.run('companycam.send', await f.payload({ captureId: photo.id }), { error: 'FORBIDDEN' }))
  const branch = await h.command('branch.save', { name: 'Other photos', prefix: 'PHO', timezone: 'UTC', zips: ['75001'] })
  const tokenCall = async (token, type, fields) => h.request('/api/glove/commands', { as: '', method: 'POST', headers: { authorization: `Bearer ${token}` }, body: { commandId: crypto.randomUUID(), type, payload: await f.payload(fields) } }).then(r => r.json())
  for (const role of ['office', 'dispatcher']) {
    const token = await h.command('token.issue', { name: `Synthetic ${role} photos`, role, ...(role === 'dispatcher' ? { branchId: branch.id } : {}) })
    await noSend(async () => { const result = await tokenCall(token.token, 'companycam.send', { captureId: photo.id }); assert.equal(result.ok, false); assert.ok(['FORBIDDEN', 'NOT_FOUND'].includes(result.error.code)) })
  }
  for (const change of ['role', 'deactivate', 'snapshot']) {
    const actor = await h.person(`Synthetic Photo ${change}`, 'dispatcher')
    let arrived, release
    const waiting = new Promise(r => { arrived = r }), resume = new Promise(r => { release = r })
    h.checkpoints.qboComplete = async () => { arrived(); await resume }
    const pending = h.request('/api/glove/commands', { method: 'POST', as: actor.cookie, body: { commandId: crypto.randomUUID(), type: 'companycam.send', payload: await f.payload({ captureId: photo.id }) } })
    await waiting
    if (change === 'role') await h.command('role.set', { operatorId: actor.id, role: 'viewer' })
    else if (change === 'deactivate') assert.equal((await h.request('/auth/operator/status', { method: 'POST', body: { operatorId: actor.id, status: 'inactive' } })).status, 200)
    else await h.command('customer.save', { name: 'Concurrent state change' })
    release(); const response = await pending, body = await response.json()
    assert.equal(body.ok, false, change); assert.equal(posts(h).length, 0); assert.deepEqual(await reservations(h), [])
    h.checkpoints.qboComplete = null
  }
  let arrived, release
  const waiting = new Promise(r => { arrived = r }), resume = new Promise(r => { release = r })
  h.companycam.beforeUpload = async () => { assert.equal((await reservations(h))[0].phase, 'sending'); arrived(); await resume }
  const first = f.run('companycam.send', { captureId: photo.id })
  await waiting
  const second = await f.run('companycam.send', { captureId: photo.id })
  assert.equal(second.phase, 'sending'); release(); await first
  assert.equal(posts(h).filter(c => c.path === '/projects/42/photos').length, 1)
  assert.equal((await reservations(h)).length, 1)
  const allowed = await h.command('token.issue', { name: 'Synthetic allowed photos', role: 'dispatcher', branchId: 'main' })
  const another = await f.capture('Token photo')
  h.companycam.beforeUpload = null
  assert.equal((await tokenCall(allowed.token, 'companycam.send', { captureId: another.id })).result.phase, 'complete')
  const kept = await reservations(h), n = posts(h).length
  assert.equal((await tokenCall(allowed.token, 'companycam.reconcile', { captureId: another.id, photoId: kept.find(r => r.capture_id === another.id).remote_id })).error.code, 'FORBIDDEN')
  await h.command('token.revoke', { tokenId: allowed.id })
  assert.equal((await tokenCall(allowed.token, 'companycam.send', { captureId: another.id })).error.code, 'AUTH')
  assert.deepEqual(await reservations(h), kept); assert.equal(posts(h).length, n)
})

test('API-008 unknown uploads and captions never resend; Owner reconciliation verifies original bytes and pull holds uncertain duplicates', async t => {
  const h = await installation(); t.after(() => h.close())
  const f = await photos(h)
  for (const failure of ['loseUploadResponse', 'refuseCaption', 'loseCaptionResponse']) {
    const photo = await f.capture(`Failure ${failure}`), commandId = crypto.randomUUID(), payload = await f.payload({ captureId: photo.id })
    h.companycam[failure] = true
    const sent = await h.command('companycam.send', payload, { commandId })
    const remoteId = String(h.companycam.nextId)
    assert.equal(sent.phase, 'unknown')
    assert.equal(sent.photoId, failure === 'loseUploadResponse' ? null : remoteId)
    assert.equal(sent.captionState, failure === 'loseUploadResponse' ? 'not sent' : 'outcome unknown')
    const event = (await h.state()).events.find(e => e.commandId === commandId && e.kind === 'companycam.export')
    assert.match(event.summary, /outcome unknown; check CompanyCam/)
    const before = await reservations(h), n = posts(h).length
    h.companycam[failure] = false
    assert.deepEqual(await h.command('companycam.send', payload, { commandId }), sent)
    assert.deepEqual(await f.run('companycam.send', { captureId: photo.id }), sent)
    await h.restart()
    assert.deepEqual(await h.command('companycam.send', payload, { commandId }), sent)
    assert.deepEqual(await f.run('companycam.send', { captureId: photo.id }), sent)
    assert.equal(posts(h).length, n); assert.deepEqual(await reservations(h), before)
    if (failure !== 'loseUploadResponse') continue
    const other = Buffer.concat([bytes, Buffer.from('Independent CompanyCam original')])
    h.companycam.photo('9001', '42', other, 'Other photo imports despite held original')
    h.companycam.photo('9002', '43', Buffer.concat([bytes, Buffer.from(`Failure ${failure}`)]))
    h.companycam.photo('9003', '42', other)
    const pull = await f.run('companycam.pull')
    assert.deepEqual(pull.imported, ['9001', '9003'])
    assert.equal(pull.errors.length, 1); assert.equal(pull.errors[0].photoId, remoteId)
    assert.match(pull.errors[0].message, /unknown outcome.*Reconcile/)
    assert.deepEqual((await f.latest()).companycam.lastPull, pull)
    for (const [photoId, code] of [['9002', 'COMPANYCAM_PHOTO'], ['9003', 'COMPANYCAM_PHOTO']]) {
      await f.run('companycam.reconcile', { captureId: photo.id, photoId }, { error: code })
      assert.deepEqual(await reservations(h), before)
    }
    await f.b.dispatcher.run('companycam.reconcile', await f.payload({ captureId: photo.id, photoId: remoteId }), { error: 'FORBIDDEN' })
    assert.deepEqual(await reservations(h), before)
    const reconciled = await f.run('companycam.reconcile', { captureId: photo.id, photoId: remoteId })
    assert.equal(reconciled.phase, 'confirmed by owner'); assert.equal(reconciled.photoId, remoteId); assert.equal(reconciled.captionState, 'not sent')
    assert.deepEqual((await f.run('companycam.pull')).imported, [])
    assert.equal((await h.state()).captures.filter(c => c.origin?.system === 'CompanyCam').length, 2)
    const { activity, exported } = await assertTrail(h, ['companycam.export'])
    const e = activity.find(e => e.kind === 'companycam.export' && e.summary.includes('confirmed by owner'))
    assert.equal(e.actorRole, 'owner'); assert.ok(e.actorId && e.at && e.commandId)
    const timeline = await h.request(`/api/glove/jobs/${f.job.id}/timeline`).then(r => r.json())
    assert.ok(timeline.events.some(x => x.id === e.id))
    assert.equal(JSON.parse(exported.timeline.find(x => x.id === e.id).data).photoId, remoteId)
  }
})
