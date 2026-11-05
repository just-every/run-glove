// FIELD-003 + FIELD-002 + DATA-002: real production HTTP commands, native
// sessions and D1; customer reads use only the one-report bearer capability.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { crc32, deflateSync } from 'node:zlib'
import { installation, business, acceptedQuote, assertTrail } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const photo = { mediaType: 'image/png', base64: png }
// Small, distinct PNG originals make file substitution observable without
// borrowing file metadata or checksums from the report being asserted.
function pixel(red, green, blue) {
  const chunk = (type, bytes) => {
    const body = Buffer.concat([Buffer.from(type), bytes]), size = Buffer.alloc(4), crc = Buffer.alloc(4)
    size.writeUInt32BE(bytes.length); crc.writeUInt32BE(crc32(body))
    return Buffer.concat([size, body, crc])
  }
  const header = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0])
  const bytes = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, red, green, blue, 255]))), chunk('IEND', Buffer.alloc(0))])
  return { mediaType: 'image/png', base64: bytes.toString('base64') }
}
const inspectionPhoto = pixel(200, 40, 20), inspectionSignature = pixel(20, 40, 200), completionSignature = pixel(40, 200, 20)
const cleanedPhoto = pixel(210, 190, 20), followUpPhoto = pixel(20, 190, 210), logo = pixel(100, 30, 120)

test('completed reports freeze signed and reasoned-unsigned records across restart with scoped originals, revocable sharing and human-approved recommendation drafts', async t => {
  const receivedAt = '2026-11-05T16:00:00.000Z'
  const h = await installation({ at: '2026-11-05T15:00:00.000Z' }); t.after(() => h.close())
  const setClock = async at => assert.equal((await h.request('/__test/clock', { method: 'POST', body: { at } })).status, 200)
  let captureReceipt = Date.parse('2026-11-05T15:01:00Z')
  const recordCapture = async (person, payload) => {
    await setClock(new Date(captureReceipt += 1000).toISOString())
    return person.run('visit.capture', payload)
  }
  const b = await business(h, {
    name: 'Synthetic Glove Service', legalName: 'Synthetic Glove LLC', dba: 'Glove Service', abn: '12-3456789',
    address: '24 Service Lane, Austin TX 78701', phone: '+1 512 555 0100',
    email: ['office', 'synthetic-glove.test'].join('@'), currency: 'USD', timezone: 'America/Chicago',
    licenses: [{ trade: 'HVAC', state: 'TX', number: 'synthetic-glove-1' }, { trade: 'Electrical', state: 'TX', number: 'synthetic-glove-2' }],
    insurance: { carrier: 'Synthetic Coverage', policy: 'synthetic-glove-3', expires: '2027-10-31' }, logo,
  })
  await h.command('document.template', { kind: 'report', version: (await h.state()).business[0].version, heading: 'Completed service', terms: 'Keep this service record.', footer: 'Contact the office about follow-up work.' })
  const form = await h.command('form.save', { name: 'HVAC inspection', serviceIds: [b.service.id], questions: [
    { id: 'running', label: 'Unit running?', type: 'yesno', required: true },
    { id: 'fault', label: 'Observed fault', type: 'notes', required: true, showIf: { questionId: 'running', equals: false } },
    { id: 'pressure', label: 'Suction pressure', type: 'reading', unit: 'psi', min: '110', max: '140', required: true },
    { id: 'temperature', label: 'Supply temperature', type: 'reading', unit: 'F', min: '50', max: '65', required: true },
    { id: 'speed', label: 'Fan speed', type: 'choice', options: ['Low', 'High'], required: true },
    { id: 'current', label: 'Motor current', type: 'number', unit: 'A', required: true },
    { id: 'photo', label: 'Coil photo', type: 'photo' }, { id: 'signature', label: 'Inspection signature', type: 'signature' },
  ] })
  const laterEvidenceForm = await h.command('form.save', { name: 'Follow-up verification', serviceIds: [b.service.id], questions: [{ id: 'review', label: 'Later review', type: 'notes', required: true }] })
  const job = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-11-02', start: '09:00', end: '10:00' })
  const at = '2026-11-02T15:30:00Z'
  const capture = p => recordCapture(b.priyaPerson, { visitId: visit.id, deviceTime: at, ...p })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  for (const item of job.checklist.filter(x => x.required)) await capture({ kind: 'checklist', itemId: item.id, result: 'done' })
  const inspection = await capture({ kind: 'form', formId: job.forms.find(x => x.formId === form.id).id, answers: { running: false, fault: 'Compressor noisy', pressure: '152.5', temperature: '50', speed: 'High', current: '3.25', photo: inspectionPhoto, signature: inspectionSignature } })
  const original = await capture({ kind: 'photo', photo, caption: 'Coil before cleaning' })
  const afterPhoto = await capture({ kind: 'photo', photo: cleanedPhoto, caption: 'Coil after cleaning' })
  await capture({ kind: 'material', description: 'Coil cleaner', quantity: '0.5', unit: 'bottle' })
  await capture({ kind: 'material', serviceId: b.refrigerant.id, quantity: '1.25' })
  const completion = { visitId: visit.id, deviceTime: at, summary: 'Cleaned the condenser coil', findings: 'Compressor pressure is high', recommendations: [{ title: 'Replace condenser fan', description: 'Replace the noisy fan before summer', serviceId: b.service.id, quantity: '1' }, { title: 'Inspect ductwork', description: 'Check the airflow next visit' }], signoff: { customerName: 'Dr Mei Lin', signature: completionSignature } }
  await b.priyaPerson.run('visit.complete', { ...completion, recommendations: [{ title: '' }] }, { error: 'INPUT' })
  await setClock(receivedAt)
  const completionId = randomUUID()
  const completed = await b.priyaPerson.run('visit.complete', completion, { commandId: completionId })
  const state = await h.state(), report = state.serviceReports.find(x => x.visitId === visit.id)
  assert.ok(report, 'completion produces the report in the same transaction')
  assert.equal(state.serviceReports.filter(x => x.visitId === visit.id).length, 1)
  assert.deepEqual([report.snapshot.summary, report.snapshot.findings, report.snapshot.materials[0].quantity, report.snapshot.signoff.customerName], ['Cleaned the condenser coil', 'Compressor pressure is high', '0.5', 'Dr Mei Lin'])
  const reading = report.snapshot.forms[0].answers.find(x => x.label === 'Suction pressure')
  assert.deepEqual([reading.value, reading.unit, reading.min, reading.max, reading.flagged], ['152.5', 'psi', '110', '140', true])
  assert.equal(report.snapshot.forms[0].answers.find(x => x.label === 'Observed fault').value, 'Compressor noisy')
  assert.equal(report.snapshot.visit.technician, 'Priya', 'customer sees the first name only')
  assert.equal(report.snapshot.files.length, 6, 'two photos, two form originals, completion signature and business logo')
  // Only generated identities come from command results. Every business value,
  // answer, range, flag and file checksum below is independently expected.
  const expectedFile = (fileId, input = photo) => {
    assert.match(fileId, /^[0-9a-f-]{36}$/)
    const bytes = Buffer.from(input.base64, 'base64')
    return { fileId, mediaType: input.mediaType, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length }
  }
  const formFileId = (record, label) => record.answers.find(a => a.label === label).value.fileId
  const logoId = state.business[0].logo.fileId
  const expectedBusiness = {
    name: 'Synthetic Glove Service', legalName: 'Synthetic Glove LLC', dba: 'Glove Service', ein: '12-3456789',
    address: '24 Service Lane, Austin TX 78701', phone: '+1 512 555 0100', email: ['office', 'synthetic-glove.test'].join('@'),
    licenses: [{ trade: 'HVAC', state: 'TX', number: 'synthetic-glove-1' }, { trade: 'Electrical', state: 'TX', number: 'synthetic-glove-2' }],
    insurance: { carrier: 'Synthetic Coverage', policy: 'synthetic-glove-3', expires: '2027-10-31' }, logo: expectedFile(logoId, logo),
  }
  const expectedTemplate = { heading: 'Completed service', terms: 'Keep this service record.', footer: 'Contact the office about follow-up work.' }
  const signedIds = completed.completion.recommendations.map(r => r.id)
  assert.equal(new Set(signedIds).size, 2)
  const expectedSigned = {
    business: expectedBusiness, template: expectedTemplate,
    job: { number: 'J-1001', title: 'Split system service' }, customer: { name: 'Harbourview Dental' }, site: { address: '14 Harbour St, Balmain NSW 2041' },
    visit: { date: '2026-11-02', timezone: 'America/Chicago', completedAt: '2026-11-02T15:30:00.000Z', technician: 'Priya' },
    summary: 'Cleaned the condenser coil', findings: 'Compressor pressure is high',
    forms: [{ name: 'HVAC inspection', answers: [
      { label: 'Unit running?', type: 'yesno', value: false },
      { label: 'Observed fault', type: 'notes', value: 'Compressor noisy' },
      { label: 'Suction pressure', type: 'reading', value: '152.5', unit: 'psi', min: '110', max: '140', flagged: true },
      { label: 'Supply temperature', type: 'reading', value: '50', unit: 'F', min: '50', max: '65', flagged: false },
      { label: 'Fan speed', type: 'choice', value: 'High' },
      { label: 'Motor current', type: 'number', value: '3.25', unit: 'A' },
      { label: 'Coil photo', type: 'photo', value: expectedFile(formFileId(inspection, 'Coil photo'), inspectionPhoto) },
      { label: 'Inspection signature', type: 'signature', value: expectedFile(formFileId(inspection, 'Inspection signature'), inspectionSignature) },
    ] }],
    photos: [
      { caption: 'Coil before cleaning', file: expectedFile(original.file.fileId) },
      { caption: 'Coil after cleaning', file: expectedFile(afterPhoto.file.fileId, cleanedPhoto) },
    ],
    materials: [{ description: 'Coil cleaner', quantity: '0.5', unit: 'bottle' }, { description: 'R32 refrigerant', quantity: '1.25', unit: 'kg' }],
    signoff: { customerPresent: true, customerName: 'Dr Mei Lin', signature: expectedFile(completed.completion.signoff.signature.fileId, completionSignature) },
    recommendations: [
      { id: signedIds[0], title: 'Replace condenser fan', description: 'Replace the noisy fan before summer' },
      { id: signedIds[1], title: 'Inspect ductwork', description: 'Check the airflow next visit' },
    ],
    files: [formFileId(inspection, 'Coil photo'), formFileId(inspection, 'Inspection signature'), original.file.fileId, afterPhoto.file.fileId, completed.completion.signoff.signature.fileId, logoId],
  }
  assert.deepEqual(report.snapshot, expectedSigned, 'the entire signed record is independently enumerated')

  // A separate native job and assigned person exercise absence of a completion
  // signature and the opposite conditional answer, rather than cloning a report.
  const unsignedJob = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b, 'Unsigned follow-up service')).id })
  const unsignedVisit = await b.dispatcher.run('visit.book', { jobId: unsignedJob.id, technicianId: b.tom.id, date: '2026-11-03', start: '11:00', end: '12:00' })
  const unsignedAt = '2026-11-03T17:45:00Z'
  captureReceipt = Date.parse('2026-11-05T16:01:00Z')
  const unsignedCapture = p => recordCapture(b.tomPerson, { visitId: unsignedVisit.id, deviceTime: unsignedAt, ...p })
  await b.tomPerson.run('visit.arrive', { visitId: unsignedVisit.id, deviceTime: '2026-11-03T17:00:00Z' })
  for (const item of unsignedJob.checklist.filter(x => x.required)) await unsignedCapture({ kind: 'checklist', itemId: item.id, result: 'done' })
  const unsignedInspection = await unsignedCapture({ kind: 'form', formId: unsignedJob.forms.find(x => x.formId === form.id).id, answers: { running: true, pressure: '110', temperature: '66', speed: 'Low', current: '2.5', photo: inspectionPhoto } })
  const unsignedPhoto = await unsignedCapture({ kind: 'photo', photo: followUpPhoto, caption: 'Follow-up filter replaced' })
  await unsignedCapture({ kind: 'material', description: 'Air filter', quantity: '2', unit: 'each' })
  const unsignedReceivedAt = '2026-11-05T17:00:00.000Z'
  await setClock(unsignedReceivedAt)
  const unsignedCompletionId = randomUUID()
  const unsignedCompletion = { visitId: unsignedVisit.id, deviceTime: unsignedAt, summary: 'Replaced both return filters', findings: 'Supply air remains warm', signoff: { absentReason: 'Customer left for work before completion' }, recommendations: [{ title: 'Check supply airflow', description: 'Inspect the upstairs duct on the next visit', quantity: '1' }] }
  const unsignedCompleted = await b.tomPerson.run('visit.complete', unsignedCompletion, { commandId: unsignedCompletionId })
  const unsignedReport = (await h.state()).serviceReports.find(r => r.visitId === unsignedVisit.id)
  assert.ok(unsignedReport)
  const expectedUnsigned = {
    business: expectedBusiness, template: expectedTemplate,
    job: { number: 'J-1002', title: 'Unsigned follow-up service' }, customer: { name: 'Harbourview Dental' }, site: { address: '14 Harbour St, Balmain NSW 2041' },
    visit: { date: '2026-11-03', timezone: 'America/Chicago', completedAt: '2026-11-03T17:45:00.000Z', technician: 'Tom' },
    summary: 'Replaced both return filters', findings: 'Supply air remains warm',
    forms: [{ name: 'HVAC inspection', answers: [
      { label: 'Unit running?', type: 'yesno', value: true },
      { label: 'Suction pressure', type: 'reading', value: '110', unit: 'psi', min: '110', max: '140', flagged: false },
      { label: 'Supply temperature', type: 'reading', value: '66', unit: 'F', min: '50', max: '65', flagged: true },
      { label: 'Fan speed', type: 'choice', value: 'Low' },
      { label: 'Motor current', type: 'number', value: '2.5', unit: 'A' },
      { label: 'Coil photo', type: 'photo', value: expectedFile(formFileId(unsignedInspection, 'Coil photo'), inspectionPhoto) },
    ] }],
    photos: [{ caption: 'Follow-up filter replaced', file: expectedFile(unsignedPhoto.file.fileId, followUpPhoto) }],
    materials: [{ description: 'Air filter', quantity: '2', unit: 'each' }],
    signoff: { customerPresent: false, absentReason: 'Customer left for work before completion' },
    recommendations: [{ id: unsignedCompleted.completion.recommendations[0].id, title: 'Check supply airflow', description: 'Inspect the upstairs duct on the next visit' }],
    files: [formFileId(unsignedInspection, 'Coil photo'), unsignedPhoto.file.fileId, logoId],
  }
  assert.deepEqual(unsignedReport.snapshot, expectedUnsigned, 'the entire unsigned record excludes the unasked fault and absent signatures')
  const frozenVisits = [
    { report, job, receivedAt, expected: expectedSigned, person: b.priyaPerson, visit, payload: completion, commandId: completionId, completed },
    { report: unsignedReport, job: unsignedJob, receivedAt: unsignedReceivedAt, expected: expectedUnsigned, person: b.tomPerson, visit: unsignedVisit, payload: unsignedCompletion, commandId: unsignedCompletionId, completed: unsignedCompleted },
  ]
  const originalInputs = new Map([
    [logoId, logo], [formFileId(inspection, 'Coil photo'), inspectionPhoto], [formFileId(inspection, 'Inspection signature'), inspectionSignature],
    [original.file.fileId, photo], [afterPhoto.file.fileId, cleanedPhoto], [completed.completion.signoff.signature.fileId, completionSignature],
    [formFileId(unsignedInspection, 'Coil photo'), inspectionPhoto], [unsignedPhoto.file.fileId, followUpPhoto],
  ])
  const assertFrozen = async () => {
    const current = await h.state()
    assert.equal(current.serviceReports.length, 2)
    for (const frozen of frozenVisits) {
      const rows = current.serviceReports.filter(r => r.visitId === frozen.visit.id)
      assert.equal(rows.length, 1, 'completion and replay retain one report per visit')
      assert.equal(rows[0].id, frozen.report.id)
      assert.equal(rows[0].createdAt, frozen.receivedAt)
      assert.deepEqual(rows[0].snapshot, frozen.expected)
      for (const fileId of frozen.expected.files) {
        const response = await h.request(`/api/glove/files/${fileId}`, { as: frozen.person.cookie })
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('content-type'), 'image/png')
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(originalInputs.get(fileId).base64, 'base64'), 'authenticated original bytes survive completion and restart')
        if (fileId !== logoId) {
          const unrelated = frozen.person === b.priyaPerson ? b.tomPerson : b.priyaPerson
          assert.equal((await h.request(`/api/glove/files/${fileId}`, { as: unrelated.cookie })).status, 404, 'the other technician cannot read these originals')
        }
      }
    }
  }
  await assertFrozen()

  // Edit every mutable source class through its ordinary command. The form
  // definition no longer resembles either visit's frozen copy; late evidence
  // has different captions, materials and answers, and must stay out of reports.
  await h.command('business.save', { version: (await h.state()).business[0].version, name: 'Later Glove Name', legalName: 'Later Legal Name', dba: 'Later DBA', abn: '98-7654321', address: '90 Later Street', phone: '+1 512 555 0199', email: ['later', 'synthetic-glove.test'].join('@'), timezone: 'America/New_York', licenses: [], insurance: null })
  await h.command('document.template', { kind: 'report', version: (await h.state()).business[0].version, heading: 'Later report heading', terms: 'Later report terms', footer: 'Later report footer' })
  await h.command('customer.save', { id: b.customer.id, version: b.customer.version, name: 'Later customer name', contact: 'Later contact', billingAddress: 'Later billing address' })
  await h.command('site.save', { id: b.site.id, version: b.site.version, customerId: b.customer.id, address: 'Later service address', accessNotes: 'Later private access' })
  for (const tech of [b.priya, b.tom]) await h.command('technician.save', { id: tech.id, version: tech.version, name: `Later ${tech.id}`, operatorId: tech.operatorId })
  const laterForm = await h.command('form.save', { id: form.id, version: form.version, name: 'Later inspection', serviceIds: [b.service.id], questions: [{ id: 'new', label: 'Later reading', type: 'reading', unit: 'bar', min: '1', max: '2', required: true }] })
  await h.command('form.save', { id: form.id, version: laterForm.version, name: 'Later inspection', archived: true, questions: laterForm.questions })
  await h.command('service.save', { id: b.service.id, version: b.service.version, code: 'SPLIT-SVC', name: 'Later service', unitPrice: '999.00', checklist: [{ label: 'Later task', required: true }] })
  // A second form copy on each job provides genuinely later filled evidence.
  // The original form itself remains once-only and is never SQL-seeded.
  for (const frozen of frozenVisits) {
    await frozen.person.run('visit.capture', { visitId: frozen.visit.id, deviceTime: '2026-11-04T18:00:00Z', kind: 'photo', photo, caption: 'Later private inspection photo' })
    await frozen.person.run('visit.capture', { visitId: frozen.visit.id, deviceTime: '2026-11-04T18:01:00Z', kind: 'material', description: 'Later private material', quantity: '9', unit: 'box' })
    await frozen.person.run('visit.capture', { visitId: frozen.visit.id, deviceTime: '2026-11-04T18:02:00Z', kind: 'form', formId: frozen.job.forms.find(x => x.formId === laterEvidenceForm.id).id, answers: { review: 'Later inspection must remain private' } })
    assert.deepEqual(await frozen.person.run('visit.complete', frozen.payload, { commandId: frozen.commandId }), frozen.completed, 'same completion command returns its original outcome')
    await frozen.person.run('visit.complete', { ...frozen.payload, summary: 'Later attempted replacement' }, { error: 'NOT_ASSIGNED' })
  }
  await assertFrozen()
  await h.restart()
  await assertFrozen()
  for (const frozen of frozenVisits) assert.deepEqual(await frozen.person.run('visit.complete', frozen.payload, { commandId: frozen.commandId }), frozen.completed, 'completion replay after actual Worker restart is unchanged')
  await assertFrozen()
  const changedSources = await h.state()
  assert.deepEqual([changedSources.business[0].name, changedSources.business[0].documentTemplates.report.heading, changedSources.customers.find(x => x.id === b.customer.id).name, changedSources.sites.find(x => x.id === b.site.id).address, changedSources.forms.find(x => x.id === form.id).archived], ['Later Glove Name', 'Later report heading', 'Later customer name', 'Later service address', true])
  for (const frozen of frozenVisits) assert.equal(changedSources.captures.filter(x => x.visitId === frozen.visit.id && x.kind === 'form').length, 2, 'later genuine form evidence is retained without rewriting the report')
  const creationActivity = (await (await h.request('/api/glove/activity')).json()).events.filter(e => e.kind === 'report.created')
  const creationExport = (await (await h.request('/api/glove/export')).json()).timeline.filter(e => e.kind === 'report.created')
  assert.equal(creationActivity.length, 2)
  assert.equal(creationExport.length, 2)
  for (const frozen of frozenVisits) {
    const expectedEvent = {
      jobId: frozen.visit.jobId, subjectKind: 'serviceReport', subjectId: frozen.report.id, kind: 'report.created',
      actorId: frozen.person.id, actorName: frozen.person.name, actorRole: 'technician', at: frozen.receivedAt, commandId: frozen.commandId,
      summary: `${frozen.expected.job.number} service report prepared from the completed visit`,
    }
    const activityEvent = creationActivity.find(e => e.subjectId === frozen.report.id)
    assert.ok(activityEvent)
    assert.deepEqual(Object.fromEntries(Object.keys(expectedEvent).map(key => [key, activityEvent[key]])), expectedEvent)
    const exportedEvent = creationExport.find(e => e.subject_id === frozen.report.id)
    assert.ok(exportedEvent)
    assert.deepEqual({ jobId: exportedEvent.job_id, subjectKind: exportedEvent.subject_kind, subjectId: exportedEvent.subject_id, kind: exportedEvent.kind, actorId: exportedEvent.actor_id, actorName: exportedEvent.actor_name, actorRole: exportedEvent.actor_role, at: exportedEvent.at, commandId: exportedEvent.command_id, summary: exportedEvent.summary }, expectedEvent)
    assert.deepEqual([JSON.parse(exportedEvent.data).visitId, JSON.parse(exportedEvent.data).reportId], [frozen.visit.id, frozen.report.id])
  }

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
  // Every original is independently byte-checked through the report bearer,
  // including each distinct form image, signature, field photo and logo.
  for (const fileId of report.snapshot.files) {
    const response = await customer(`/files/${fileId}`)
    assert.equal(response.status, 200)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(originalInputs.get(fileId).base64, 'base64'))
  }
  const unsignedLink = await h.command('report.link', { reportId: unsignedReport.id })
  assert.deepEqual((await (await customer('', unsignedLink.token)).json()).report, expectedUnsigned)
  for (const fileId of expectedUnsigned.files) {
    const response = await customer(`/files/${fileId}`, unsignedLink.token)
    assert.equal(response.status, 200)
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(originalInputs.get(fileId).base64, 'base64'))
  }
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
  // Later job evidence and mutable customer, site and technician records never leak
  // into the snapshot. Nor can they extend its file capability.
  const late = await capture({ kind: 'photo', photo, caption: 'Private follow-up after completion' })
  await h.command('customer.save', { id: b.customer.id, version: (await h.state()).customers.find(x => x.id === b.customer.id).version, name: 'Changed private customer name', email: ['private', 'example.test'].join('@') })
  assert.deepEqual((await (await customer()).json()).report, report.snapshot)
  assert.equal((await customer(`/files/${late.file.fileId}`)).status, 404)
  const publicJson = JSON.stringify((await (await customer()).json()).report)
  for (const privateValue of ['Gate code at reception', ['accounts', 'harbourview.example'].join('@'), 'Priya N.', ['private', 'example.test'].join('@'), 'unitPrice', 'unitCost', 'operatorId', 'serviceId']) assert.ok(!publicJson.includes(privateValue), 'explicit report projection excludes private records')
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
