import { scenario } from '../fixtures/scenario.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { installation, subcontractorFieldFixture, subcontractorAt as at, subcontractorPhoto as png, assertTrail } from './harness.mjs'

const sorted = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id))
const noPrivate = value => assert.doesNotMatch(JSON.stringify(value), /876\.54|321\.09|765\.43|63\.21|Private employee|Private priced|Private second|Private equipment|Private maker|Private serial|Private install crew|Priya|Tom B|unitPrice|unitCost|costRate|agreed/)
const domain = async h => (await h.request('/api/glove/export')).json()
const read = async (h, path, as) => {
  const response = await h.request(path, { as })
  assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`)
  return response.json()
}

// Separate point outcomes share one installed business, with no manufactured domain rows.
test('DISP-013 invited subcontractor works only on current visits through every public door', async t => {
  const h = await installation({ at })
  t.after(() => h.close())
  const f = await subcontractorFieldFixture(h), { b, sub, tech, job, secondJob, own, second, moved, cancelled, employee } = f
  const current = async id => (await h.state()).visits.find(v => v.id === id)
  const trail = []
  const permitted = async (type, payload) => {
    const commandId = randomUUID(), result = await sub.run(type, payload, { commandId })
    noPrivate(result)
    const before = await h.state(), exported = await domain(h)
    assert.deepEqual(await sub.run(type, payload, { commandId }), result, 'lost-response replay returns the bounded original answer')
    assert.deepEqual(await h.state(), before, 'replay has no second effect')
    assert.deepEqual(await domain(h), exported)
    trail.push({ type, payload, commandId, result })
    return result
  }
  const refuse = async (type, payload, error = 'FORBIDDEN') => {
    const before = await h.state(), exported = await domain(h), commandId = randomUUID()
    const result = await sub.run(type, payload, { error, commandId })
    noPrivate(result)
    assert.deepEqual(await h.state(), before, `${type} refusal leaves every record and event unchanged`)
    assert.deepEqual(await domain(h), exported)
    assert.equal(await h.db.prepare('SELECT id FROM glove_commands WHERE id=?').bind(commandId).first(), null)
  }

  await scenario(t, 'point 1: mailed staff invitation confirms a built-in Subcontractor linked to their technician', async () => {
    assert.deepEqual(sub.invitation, { status: 202, confirmationStatus: 303, path: '/auth/confirm' })
    const session = await read(h, '/auth/session', sub.cookie)
    assert.deepEqual([session.operator.id, session.operator.displayName, session.operator.role], [sub.id, 'Sid Field', 'member'])
    const s = await sub.state()
    assert.deepEqual([s.actor.id, s.actor.name, s.actor.role, s.actor.roleName], [sub.id, 'Sid Field', 'subcontractor', null])
    assert.deepEqual(s.actor.commands.sort(), ['visit.arrive', 'visit.capture', 'visit.complete'])
    assert.deepEqual(s.actor.reads.sort(), ['file', 'state'])
    assert.deepEqual(s.technicians.map(x => [x.id, x.operatorId, x.name]), [[tech.id, sub.id, 'Sid Field']])
    const { activity, exported } = await assertTrail(h, ['role.set', 'technician.saved'])
    assert.ok(activity.some(e => e.kind === 'role.set' && e.subjectId === sub.id && e.actorRole === 'owner'))
    assert.equal(exported.technicians.find(x => x.id === tech.id).operatorId, sub.id)
  })

  await scenario(t, 'point 2: exact current assignments, bounded records and frozen ordered work survive Worker restart', async () => {
    // Captures from another visit of the same job must disappear when it moves away.
    const oldPayload = { visitId: moved.id, deviceTime: at, kind: 'note', text: 'Old reassigned work' }, oldCommand = randomUUID()
    const oldNote = await sub.run('visit.capture', oldPayload, { commandId: oldCommand })
    assert.ok((await sub.state()).captures.some(x => x.id === oldNote.id))
    assert.deepEqual(sorted((await sub.state()).visits).map(x => x.id), sorted([own, second, moved, cancelled]).map(x => x.id))
    await b.dispatcher.run('visit.change', { visitId: moved.id, version: (await current(moved.id)).version, technicianId: b.tom.id, reason: 'Employee takes over', acknowledge: ['evidence'] })
    await b.dispatcher.run('visit.cancel', { visitId: cancelled.id, version: (await current(cancelled.id)).version, reason: 'No longer required' })
    const check = async () => {
      const s = await sub.state()
      assert.deepEqual(sorted(s.visits).map(v => [v.id, v.jobId, v.technicianId, v.local.date, v.local.start, v.local.end, v.local.timezone, v.status, v.assignments, v.lateEvidence]), sorted([
        { id: own.id, jobId: job.id, date: '2026-11-09' }, { id: second.id, jobId: secondJob.id, date: '2026-11-10' },
      ]).map(v => [v.id, v.jobId, tech.id, v.date, '09:00', '10:00', 'UTC', 'booked', [], []]))
      for (const v of s.visits) assert.deepEqual(Object.keys(v).sort(), ['id', 'version', 'jobId', 'technicianId', 'startAt', 'endAt', 'local', 'status', 'arrival', 'completion', 'lateEvidence', 'assignments'].sort())
      assert.deepEqual(sorted(s.jobs).map(j => [j.id, j.title, j.customerId, j.siteId, j.lines, j.checklist.map(i => [i.label, i.required]), j.forms.map(x => [x.name, x.formVersion, x.questions])]), sorted([
        { id: job.id, title: 'Dental field inspection', customerId: b.customer.id, siteId: b.site.id },
        { id: secondJob.id, title: 'River field inspection', customerId: f.secondCustomer.id, siteId: f.secondSite.id },
      ]).map(j => [j.id, j.title, j.customerId, j.siteId, [], [['Isolate supply', true], ['Inspect connections', true], ['Clean work area', false]], [['Frozen field inspection', 1, [{ id: 'safe', label: 'Supply isolated?', type: 'yesno', required: true }, { id: 'note', label: 'Inspection detail', type: 'notes', required: true }]]]]))
      assert.deepEqual(sorted(s.customers), sorted([{ id: b.customer.id, version: 1, name: 'Harbourview Dental', phone: '02 9555 0101' }, { id: f.secondCustomer.id, version: 1, name: 'River Clinic', phone: '212 555 0199' }]))
      assert.deepEqual(sorted(s.sites), sorted([{ id: b.site.id, version: 1, customerId: b.customer.id, address: '14 Harbour St, Balmain NSW 2041', accessNotes: 'Gate code at reception' }, { id: f.secondSite.id, version: 1, customerId: f.secondCustomer.id, address: '28 River Road', accessNotes: 'Use rear entrance' }]))
      assert.deepEqual(s.captures, [], 'no former-visit or employee capture')
      const populated = Object.entries(s).filter(([, value]) => Array.isArray(value) && value.length).map(([key]) => key).sort()
      assert.deepEqual(populated, ['business', 'customers', 'jobs', 'sites', 'technicians', 'visits'])
      noPrivate(s)
      return s
    }
    const before = await check()
    await h.restart()
    assert.deepEqual(await check(), before)
    const afterMove = await domain(h)
    await sub.run('visit.capture', oldPayload, { commandId: oldCommand, error: 'FORBIDDEN' })
    assert.deepEqual(await domain(h), afterMove)
    // Removing the only assignment at the other site removes its entire projection.
    await b.dispatcher.run('visit.change', { visitId: second.id, version: (await current(second.id)).version, technicianId: b.priya.id, reason: 'Temporary employee assignment' })
    let s = await sub.state()
    assert.deepEqual(s.jobs.map(j => j.id), [job.id])
    assert.deepEqual(s.customers.map(c => c.id), [b.customer.id])
    assert.deepEqual(s.sites.map(x => x.id), [b.site.id])
    await b.priyaPerson.run('visit.arrive', { visitId: second.id, deviceTime: at })
    await b.priyaPerson.run('visit.capture', { visitId: second.id, deviceTime: at, kind: 'note', text: 'Private employee handoff' })
    await b.dispatcher.run('visit.change', { visitId: second.id, version: (await current(second.id)).version, technicianId: tech.id, reason: 'Subcontractor takes over', acknowledge: ['evidence'] })
    s = await sub.state()
    assert.equal(s.visits.find(v => v.id === second.id).arrival, null, 'a previous worker arrival is not this person’s work')
    noPrivate(s)
    await refuse('visit.complete', { visitId: second.id, deviceTime: at, summary: 'Cannot use previous arrival', signoff: { absentReason: 'Customer away' } }, 'NO_ARRIVAL')
    const arrival = await permitted('visit.arrive', { visitId: second.id, deviceTime: at })
    assert.equal(arrival.technicianId, tech.id)
    for (const visitId of [moved.id, cancelled.id]) for (const type of ['visit.arrive', 'visit.capture', 'visit.complete']) await refuse(type, { visitId, deviceTime: at, kind: 'note', text: 'After assignment ends' })
  })

  let photo
  await scenario(t, 'point 4: arrival, every checklist item, note, captioned photo, described material, frozen form and completion land once with attribution', async () => {
    const operations = [
      ['visit.arrive', {}],
      ...job.checklist.map((item, i) => ['visit.capture', { kind: 'checklist', itemId: item.id, result: i === 1 ? 'not applicable' : 'done', ...(i === 1 ? { note: 'No connection fitted' } : {}) }]),
      ['visit.capture', { kind: 'note', text: 'Supply isolated and inspected' }],
      ['visit.capture', { kind: 'photo', caption: 'Safe isolation at the panel', photo: { mediaType: 'image/png', base64: png } }],
      ['visit.capture', { kind: 'material', description: 'Unpriced conduit', quantity: '2.5', unit: 'ft' }],
      ['visit.capture', { kind: 'form', formId: job.forms[0].id, answers: { safe: true, note: 'Frozen inspection completed' } }],
      ['visit.complete', { summary: 'Inspection complete', signoff: { absentReason: 'Customer away' } }],
    ]
    for (const [type, fields] of operations) {
      await refuse(type, { visitId: employee.id, deviceTime: at, ...fields })
      const result = await permitted(type, { visitId: own.id, deviceTime: at, ...fields })
      if (fields.kind === 'photo') photo = result
    }
    const s = await sub.state(), captures = s.captures.filter(x => x.visitId === own.id)
    assert.equal(s.captures.length, 10, 'these nine captures plus the independently recorded second-site arrival')
    assert.deepEqual(captures.map(x => x.kind).sort(), ['arrival', 'checklist', 'checklist', 'checklist', 'completion', 'form', 'material', 'note', 'photo'].sort())
    assert.ok(captures.every(x => x.visitId === own.id && x.technicianId === tech.id && x.receivedAt === at && x.deviceTime === at))
    assert.deepEqual(job.checklist.map(i => { const c = captures.find(c => c.itemId === i.id); return [c.label, c.result, c.note] }), [['Isolate supply', 'done', ''], ['Inspect connections', 'not applicable', 'No connection fitted'], ['Clean work area', 'done', '']])
    assert.equal(captures.find(x => x.kind === 'note').text, 'Supply isolated and inspected')
    assert.equal(photo.caption, 'Safe isolation at the panel')
    const material = captures.find(x => x.kind === 'material')
    assert.deepEqual([material.description, material.quantity, material.unit, material.serviceId], ['Unpriced conduit', '2.5', 'ft', null])
    const form = captures.find(x => x.kind === 'form')
    assert.deepEqual([form.formName, form.answers], ['Frozen field inspection', [{ questionId: 'safe', label: 'Supply isolated?', type: 'yesno', value: true }, { questionId: 'note', label: 'Inspection detail', type: 'notes', value: 'Frozen inspection completed' }]])
    assert.deepEqual([s.visits.find(x => x.id === own.id).status, s.visits.find(x => x.id === own.id).completion.summary], ['completed', 'Inspection complete'])
    noPrivate(s)
    const { activity, exported } = await assertTrail(h, ['capture.arrival', 'capture.checklist', 'capture.note', 'capture.photo', 'capture.material', 'capture.form', 'capture.completion'])
    for (const { type, payload, commandId, result } of trail.filter(x => x.payload.visitId === own.id)) {
      const kind = `capture.${type === 'visit.arrive' ? 'arrival' : type === 'visit.complete' ? 'completion' : payload.kind}`
      const [event] = activity.filter(e => e.commandId === commandId && e.kind === kind)
      assert.ok(event)
      assert.deepEqual([event.actorId, event.actorName, event.actorRole, event.at, event.jobId], [sub.id, 'Sid Field', 'subcontractor', at, job.id])
      assert.equal(activity.filter(e => e.commandId === commandId && e.kind === kind).length, 1)
      const [entry] = exported.timeline.filter(e => e.command_id === commandId && e.kind === kind)
      assert.deepEqual([entry.actor_id, entry.actor_name, entry.actor_role, entry.at, entry.job_id, entry.summary], [sub.id, 'Sid Field', 'subcontractor', at, job.id, event.summary])
      assert.equal(exported.captures.filter(c => c.id === commandId).length, 1)
      assert.equal(exported.timeline.filter(e => e.command_id === commandId && e.kind === kind).length, 1)
    }
    const before = await sub.state()
    await h.restart()
    assert.deepEqual(await sub.state(), before)
    for (const { type, payload, commandId, result } of trail) assert.deepEqual(await sub.run(type, payload, { commandId }), result)
    assert.deepEqual(await sub.state(), before)
  })

  await scenario(t, 'point 3: files and every other read door expose no desk money, timeline or other worker data', async () => {
    const ownFile = await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })
    assert.equal(ownFile.status, 200)
    assert.deepEqual(Buffer.from(await ownFile.arrayBuffer()), Buffer.from(png, 'base64'))
    for (const file of [f.otherPhoto.file, f.service.images[0]]) {
      const response = await h.request(`/api/glove/files/${file.fileId}`, { as: sub.cookie })
      assert.equal(response.status, 404)
      noPrivate(await response.json())
    }
    const forbidden = [
      '/api/glove/export', '/api/glove/pricebook.csv', '/api/glove/customers.csv', '/api/glove/dashboard', '/api/glove/brief', '/api/glove/map', '/api/glove/map.png', '/api/glove/delays', '/api/glove/location', '/api/glove/field-quotes', '/api/glove/due-visits', '/api/glove/agreements', '/api/glove/recurring-billing', '/api/glove/timesheets?week=2026-11-09',
      `/api/glove/conversation?jobId=${job.id}`, `/api/glove/conversation?customerId=${b.customer.id}`, `/api/glove/jobs/${job.id}/callback`, `/api/glove/jobs/${job.id}/cost`, `/api/glove/jobs/${job.id}/companycam`, `/api/glove/quotes/${f.quote.id}/signed`, `/api/glove/documents/invoice/${job.id}`, `/api/glove/documents/agreement/${job.id}`, `/api/glove/technicians/${b.priya.id}/calendar`, `/api/glove/customers/${b.customer.id}/duplicates`,
      `/api/glove/payments/${job.id}/timeline`, `/api/glove/segments/${job.id}`, `/api/glove/segments/${job.id}.csv`,
      '/api/glove/parts?date=2026-11-09',
      ...['1099.json?year=2026', '1099.csv?year=2026', 'warranties', 'refrigerant?from=2026-01-01&to=2026-12-31', 'sources', 'costing', 'receivables.json', 'receivables.csv', 'payroll.json', 'payroll-gusto.csv', 'payroll-adp-run.csv', 'payroll-quickbooks.csv', ...['revenue', 'technicians', 'sources', 'quotes', 'margins', 'tax', 'agreements'].flatMap(name => [`${name}.json`, `${name}.csv`])].map(path => `/api/glove/reports/${path}`),
    ]
    // Populate a genuine invoice CSV rather than proving an empty export door.
    let invoice = await b.office.run('invoice.prepare', { jobId: job.id, lines: [{ description: 'Private priced inspection', quantity: '1', unitPrice: '876.54' }, { description: 'Unpriced conduit', quantity: '2.5', unitPrice: '5.00' }] })
    invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
    const csv = await b.office.run('invoice.export', {})
    forbidden.push(`/api/glove/exports/${csv.id}.csv`, `/api/glove/invoices/${invoice.id}/quickbooks.json`)
    assert.equal((await h.request(`/api/glove/exports/${csv.id}.csv`)).status, 200)
    for (const path of forbidden) {
      const response = await h.request(path, { as: sub.cookie })
      assert.equal(response.status, 403, `${path}: ${await response.clone().text()}`)
      noPrivate(await response.json())
    }
    for (const j of [job, secondJob]) assert.deepEqual((await read(h, `/api/glove/jobs/${j.id}/timeline`, sub.cookie)).events, [])
    const activity = await read(h, '/api/glove/activity', sub.cookie)
    assert.deepEqual(activity.events, [])
    const history = await read(h, `/api/glove/sites/${b.site.id}/history`, sub.cookie)
    noPrivate(history)
    assert.ok(history.entries.every(e => e.id === job.id || [own.id, ...trail.map(x => x.commandId)].includes(e.id)))
    assert.equal((await h.request(`/api/glove/equipment/${f.equipment.id}`, { as: sub.cookie })).status, 404)
    const push = await read(h, '/api/glove/push', sub.cookie)
    assert.deepEqual(push.devices, [])
    noPrivate(await sub.state())
  })

  await scenario(t, 'point 5: all Technician-only writes refuse without retained effects; erasure and withdrawn sessions cannot replay captures', async () => {
    const writes = [
      ['clock.in', {}], ['clock.out', {}], ['timer.start', { kind: 'job' }], ['timer.stop', {}],
      ['expense.record', { description: 'Refused expense', amount: '25.00' }], ['expense.price', {}],
      ['visit.capture', { kind: 'refrigerant', refrigerant: 'R-410A', added: '1', certification: 'Refused certification' }],
      ['visit.capture', { kind: 'line', serviceId: f.service.id, quantity: '1', approval: { customerName: 'Customer', method: 'verbal' } }],
      ['visit.capture', { kind: 'material', serviceId: f.pricedMaterial.id, quantity: '1' }],
      ['fieldQuote.draft', { title: 'Refused quote' }], ['invoice.fieldPrepare', {}],
      ['nameplate.read', { photo: { mediaType: 'image/png', base64: png } }], ['nameplate.confirm', {}], ['nameplate.discard', {}],
      ['location.consent', { enabled: true }], ['location.phone', { lat: 40, lng: -73 }],
      ['push.subscribe', { endpoint: 'https://push.example.test/synthetic-glove-subcontractor', keys: { p256dh: 'synthetic-glove-1', auth: 'synthetic-glove-2' } }], ['push.unsubscribe', {}],
    ]
    for (const [type, payload] of writes) await refuse(type, { visitId: second.id, deviceTime: at, ...payload })
    assert.equal(h.pushes.sent.length, 0)
    assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_push_subscriptions').first()).n, 0)
    // The next request uses current role, even for a previously successful command.
    await h.command('role.set', { operatorId: sub.id, role: 'viewer' })
    const saved = trail.find(x => x.payload.kind === 'note')
    await sub.run(saved.type, saved.payload, { commandId: saved.commandId, error: 'FORBIDDEN' })
    await h.command('role.set', { operatorId: sub.id, role: 'subcontractor' })
    const preview = await h.command('privacy.preview', { customerId: b.customer.id, version: b.customer.version })
    await h.command('privacy.erase', { customerId: b.customer.id, version: b.customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    const afterErase = await domain(h)
    const replay = await h.request('/api/glove/commands', { method: 'POST', as: sub.cookie, body: { commandId: saved.commandId, type: saved.type, payload: saved.payload } })
    const erased = await replay.json()
    assert.equal(erased.ok, false, 'erased capture cannot be resurrected')
    assert.ok(['FORBIDDEN', 'ERASED'].includes(erased.error.code))
    assert.deepEqual(await domain(h), afterErase)
    assert.equal((await h.request(`/api/glove/files/${photo.file.fileId}`, { as: sub.cookie })).status, 404)
    assert.doesNotMatch(JSON.stringify(await sub.state()), /Supply isolated and inspected|Safe isolation at the panel|Frozen inspection completed|Harbourview Dental/)
    const revoked = await h.request('/auth/session/revoke', { method: 'POST', body: { sessionId: sub.session.id } })
    assert.ok(revoked.status < 400)
    assert.equal((await h.request('/api/glove/state', { as: sub.cookie })).status, 401)
    const denied = await h.request('/api/glove/commands', { method: 'POST', as: sub.cookie, body: { commandId: saved.commandId, type: saved.type, payload: saved.payload } })
    assert.equal(denied.status, 401)
    assert.deepEqual(await domain(h), afterErase)
  })
})
