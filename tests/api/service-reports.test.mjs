// FIELD-003 + FIELD-002 + DATA-002: real production HTTP commands, native
// sessions and D1; customer reads use only the one-report bearer capability.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const photo = { mediaType: 'image/png', base64: png }

test('FIELD-003 / FIELD-002 / DATA-002 completed visit report: immutable customer snapshot, scoped originals, revocable seven-day link and one-step recommendation draft with human price approval', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const form = await h.command('form.save', { name: 'HVAC inspection', serviceIds: [b.service.id], questions: [
    { id: 'running', label: 'Unit running?', type: 'yesno', required: true },
    { id: 'fault', label: 'Observed fault', type: 'notes', required: true, showIf: { questionId: 'running', equals: false } },
    { id: 'pressure', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
    { id: 'photo', label: 'Coil photo', type: 'photo' }, { id: 'signature', label: 'Inspection signature', type: 'signature' },
  ] })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-02', start: '09:00', end: '10:00' })
  const at = '2026-11-01T22:30:00Z'
  const capture = p => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, ...p })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  for (const item of job.checklist.filter(x => x.required)) await capture({ kind: 'checklist', itemId: item.id, result: 'done' })
  await capture({ kind: 'form', formId: job.forms.find(x => x.formId === form.id).id, answers: { running: false, fault: 'Compressor noisy', pressure: '152.5', photo, signature: photo } })
  const original = await capture({ kind: 'photo', photo, caption: 'Coil before cleaning' })
  await capture({ kind: 'material', description: 'Coil cleaner', quantity: '0.5', unit: 'bottle' })
  const completion = { visitId: visit.id, deviceTime: at, summary: 'Cleaned the condenser coil', findings: 'Compressor pressure is high', recommendations: [{ title: 'Replace condenser fan', description: 'Replace the noisy fan before summer', serviceId: b.service.id, quantity: '1' }, { title: 'Inspect ductwork', description: 'Check the airflow next visit' }], signoff: { customerName: 'Dr Mei Lin', signature: photo } }
  await b.priyaPerson.run('visit.complete', { ...completion, recommendations: [{ title: '' }] }, { error: 'INPUT' })
  await b.priyaPerson.run('visit.complete', completion)
  const state = await h.state(), report = state.serviceReports.find(x => x.visitId === visit.id)
  assert.ok(report, 'completion produces the report in the same transaction')
  assert.equal(state.serviceReports.filter(x => x.visitId === visit.id).length, 1)
  assert.deepEqual([report.snapshot.summary, report.snapshot.findings, report.snapshot.materials[0].quantity, report.snapshot.signoff.customerName], ['Cleaned the condenser coil', 'Compressor pressure is high', '0.5', 'Dr Mei Lin'])
  const reading = report.snapshot.forms[0].answers.find(x => x.label === 'Suction pressure')
  assert.deepEqual([reading.value, reading.unit, reading.min, reading.max, reading.flagged], ['152.5', 'psi', '110', '140', true])
  assert.equal(report.snapshot.forms[0].answers.find(x => x.label === 'Observed fault').value, 'Compressor noisy')
  assert.equal(report.snapshot.visit.technician, 'Priya', 'customer sees the first name only')
  assert.equal(report.snapshot.files.length, 4, 'photo, two form originals and completion signature')
  for (const person of [b.priyaPerson, b.tomPerson, b.agent]) {
    await person.run('report.link', { reportId: report.id }, { error: 'FORBIDDEN' })
    await person.run('report.quote', { reportId: report.id, recommendationId: report.recommendations[0].id }, { error: 'FORBIDDEN' })
  }
  const history = await h.request(`/api/glove/sites/${b.site.id}/history`).then(r => r.json())
  assert.ok(history.entries.some(e => e.kind === 'service report' && e.id === report.id), 'CUST-001 keeps the new service report kind')
  const commandId = randomUUID()
  const link = await b.office.run('report.link', { reportId: report.id }, { commandId })
  assert.ok(/^glr_[A-Za-z0-9_-]{43}$/.test(link.token), '32 bytes of random bearer entropy')
  assert.equal(Date.parse(link.expiresAt) - Date.parse(link.createdAt), 7 * 86400000)
  const replay = await b.office.run('report.link', { reportId: report.id }, { commandId })
  assert.ok(!Object.hasOwn(replay, 'token'), 'command replay never reveals the bearer')
  const secret = await h.db.prepare('SELECT hash FROM glove_report_secrets WHERE link_id=?').bind(link.id).first()
  assert.ok(secret.hash === createHash('sha256').update(`glove-service-report:${link.token}`).digest('hex'), 'only the SHA-256 is stored')
  const customer = (path = '', token = link.token, extra = {}) => h.request('/api/glove/public/reports' + path, { as: '', headers: { authorization: `Bearer ${token}` }, ...extra })
  const opened = await customer()
  assert.equal(opened.status, 200)
  assert.match(opened.headers.get('cache-control'), /no-store/)
  assert.deepEqual((await opened.json()).report, report.snapshot)
  const bytes = await customer(`/files/${original.file.fileId}`)
  assert.equal(bytes.status, 200); assert.equal(bytes.headers.get('content-type'), 'image/png')
  assert.ok(Buffer.from(await bytes.arrayBuffer()).equals(Buffer.from(png, 'base64')), 'exact original bytes')
  // Every snapshot file, including form photos/signatures, is reachable.
  for (const fileId of report.snapshot.files) assert.equal((await customer(`/files/${fileId}`)).status, 200)
  assert.equal((await h.request('/api/glove/public/reports', { as: '' })).status, 404)
  assert.equal((await customer('', 'glr_' + 'a'.repeat(43))).status, 404)
  assert.equal((await customer('?reportId=' + report.id)).status, 404)
  assert.equal((await customer('', link.token, { method: 'POST', body: { jobId: job.id } })).status, 405)
  assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401)
  assert.equal((await h.request(`/api/glove/files/${original.file.fileId}`, { as: '', headers: { authorization: `Bearer ${link.token}` } })).status, 401)
  // Another customer's original is not a capability of this report link.
  const other = await h.command('customer.save', { name: 'Other customer' })
  const elsewhere = await h.command('site.save', { customerId: other.id, address: '99 Private St' })
  const unit = await h.command('equipment.save', { siteId: elsewhere.id, type: 'Condenser', photo })
  assert.equal((await customer(`/files/${unit.photos[0].fileId}`)).status, 404)
  // Later job evidence and mutable customer/site/technician records never leak
  // into the snapshot. Nor can they extend its file capability.
  const late = await capture({ kind: 'photo', photo, caption: 'Private follow-up after completion' })
  await h.command('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Changed private customer name', email: 'private@example.test' })
  assert.deepEqual((await (await customer()).json()).report, report.snapshot)
  assert.equal((await customer(`/files/${late.file.fileId}`)).status, 404)
  const publicJson = JSON.stringify((await (await customer()).json()).report)
  for (const privateValue of ['Gate code at reception', 'accounts@harbourview.example', 'Priya N.', 'private@example.test', 'unitPrice', 'unitCost', 'operatorId', 'serviceId']) assert.ok(!publicJson.includes(privateValue), 'explicit report projection excludes private records')
  // Ordinary quote drafting and human price approval remain the public doors.
  const rec = report.recommendations[0]
  await b.office.run('report.quote', { reportId: report.id, recommendationId: rec.id }, { error: 'FORBIDDEN' })
  const quote = await b.dispatcher.run('report.quote', { reportId: report.id, recommendationId: rec.id })
  assert.deepEqual([quote.status, quote.customerId, quote.siteId, quote.title, quote.revisions[0].approval], ['draft', b.customer.id, b.site.id, rec.title, null])
  assert.deepEqual(quote.serviceReport, { reportId: report.id, visitId: visit.id, recommendationId: rec.id })
  await b.dispatcher.run('quote.markSent', { quoteId: quote.id, version: quote.version, channel: 'email' }, { error: 'NOT_APPROVED' })
  const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  assert.equal(approved.status, 'approved')
  await b.dispatcher.run('report.quote', { reportId: report.id, recommendationId: report.recommendations[1].id }, { error: 'INPUT' })
  const custom = await b.dispatcher.run('report.quote', { reportId: report.id, recommendationId: report.recommendations[1].id, unitPrice: '99.00' })
  assert.equal(custom.revisions[0].lines[0].unitPrice, '99.00')
  await b.dispatcher.run('report.quote', { reportId: report.id, recommendationId: randomUUID() }, { error: 'NOT_FOUND' })
  // Branch limits apply immediately to both issuing and revoking links and
  // to drafting, including an idempotent replay after the branch changes.
  const branch = await h.command('branch.save', { name: 'Other branch', prefix: 'OTH', timezone: 'America/Phoenix', zips: [] })
  await h.command('branch.limit', { operatorId: b.office.id, branchId: branch.id })
  assert.ok(!(await b.office.state()).serviceReports.some(x => x.id === report.id))
  await b.office.run('report.link', { reportId: report.id }, { error: 'NOT_FOUND' })
  await b.office.run('report.link', { reportId: report.id }, { commandId, error: 'NOT_FOUND' })
  await b.office.run('report.revoke', { linkId: link.id, version: link.version }, { error: 'NOT_FOUND' })
  await h.command('branch.limit', { operatorId: b.dispatcher.id, branchId: branch.id })
  await b.dispatcher.run('report.quote', { reportId: report.id, recommendationId: rec.id }, { error: 'NOT_FOUND' })
  await h.command('role.set', { operatorId: b.office.id, role: 'viewer' })
  await b.office.run('report.link', { reportId: report.id }, { error: 'FORBIDDEN' })
  // Put expiry in the past at the native storage edge, preserving HTTP reads
  // and exercising the real database time predicate without waiting seven days.
  const expiring = await h.command('report.link', { reportId: report.id })
  await h.db.prepare("UPDATE glove_records SET data=json_set(data,'$.expiresAt',?) WHERE kind='serviceReportLinks' AND id=?").bind('2000-01-01T00:00:00.000Z', expiring.id).run()
  assert.equal((await customer('', expiring.token)).status, 404)
  assert.equal((await customer(`/files/${original.file.fileId}`, expiring.token)).status, 404)
  await h.command('report.revoke', { linkId: link.id, version: 999 }, { error: 'STALE' })
  await h.command('report.revoke', { linkId: link.id, version: link.version })
  assert.equal((await customer()).status, 404)
  assert.equal((await customer(`/files/${original.file.fileId}`)).status, 404)
  const { activity, exported } = await assertTrail(h, ['report.created', 'report.link.created', 'report.link.revoked', 'report.recommendation.quoted'])
  const storedCommand = await h.db.prepare('SELECT result FROM glove_commands WHERE id=?').bind(commandId).first()
  for (const content of [JSON.stringify(await h.state()), JSON.stringify(activity), JSON.stringify(exported), storedCommand.result]) {
    assert.ok(!content.includes(link.token) && !content.includes(expiring.token), 'no bearer in state, timeline, export or stored command result')
    assert.ok(!content.includes(secret.hash), 'no hash in public business records')
  }
})
