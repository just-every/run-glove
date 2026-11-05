import { documentPhoto, documentLogo, technicianPhoto } from '../fixtures/document-images.mjs'
import test from 'node:test'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { installation, business, completedJob, acceptedQuote, assertTrail } from './harness.mjs'
const png = documentPhoto
const photo = { mediaType: 'image/png', base64: png }

test('QUOTE-005, QUOTE-015 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  let businessRow = (await h.state()).business[0]
  await h.command('business.save', { ...businessRow, legalName: 'Synthetic Glove LLC', dba: 'Synthetic Trade', abn: '12-3456789', address: '125 Test Street, Austin TX 78701', phone: '(512) 555-0125', licenses: [{ trade: 'Plumbing', state: 'TX', number: 'synthetic-glove-9' }, { trade: 'HVAC', state: 'TX', number: 'synthetic-glove-10' }], insurance: { carrier: 'Synthetic Insurer', policy: 'synthetic-glove-11', expires: '2028-12-31' }, logo: { mediaType: 'image/png', base64: documentLogo } })
  businessRow = (await h.state()).business[0]
  await b.office.run('document.template', { kind: 'quote', version: businessRow.version, heading: 'Proposal', terms: 'No changes' }, { error: 'FORBIDDEN' })
  await h.command('document.template', { kind: 'quote', version: businessRow.version, heading: 'Your service proposal', terms: 'Payment due in 14 days.', footer: 'Thank you for choosing us.' })
  const service = await h.command('service.save', { code: 'DOC-1', name: 'Customer service line', description: 'A complete customer-facing service description.', unitPrice: '1850.00', unitCost: '1091.50', image: photo })
  let quote = await b.dispatcher.run('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: 'Customer-ready work', lines: [{ serviceId: service.id, description: service.name, quantity: '1', unitPrice: service.unitPrice }] })
  quote = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
  await b.dispatcher.run('document.photo', { kind: 'quote', id: quote.id, version: quote.version, photo }, { error: 'FORBIDDEN' })
  quote = await h.command('document.photo', { kind: 'quote', id: quote.id, version: quote.version, photo, caption: 'Customer-facing site photo' })
  const link = await h.command('quote.link', { quoteId: quote.id, version: quote.version })
  const read = path => h.request('/api/glove/public/quote' + path, { as: '', headers: { authorization: `Bearer ${link.token}` } })
  const opened = await read(''), d = (await opened.json()).document
  assert.equal(d.business.legalName, 'Synthetic Glove LLC')
  assert.equal(d.business.ein, '12-3456789')
  assert.deepEqual(d.business.licenses.map(l => l.number), ['synthetic-glove-9','synthetic-glove-10'])
  assert.equal(d.template.terms, 'Payment due in 14 days.')
  assert.equal(d.options[0].lines[0].customerDescription, service.description)
  assert.equal(d.options[0].lines[0].images[0].fileId, service.images[0].fileId)
  assert.equal(d.photos[0].caption, 'Customer-facing site photo')
  assert.equal(d.files.length, 3)
  for (const fileId of d.files) { const response = await read(`/files/${fileId}`); assert.equal(response.status, 200); assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), fileId === d.business.logo.fileId ? documentLogo : png) }
  const unrelated = await h.command('service.save', { code: 'DOC-2', name: 'Unrelated image', unitPrice: '1.00', image: photo })
  assert.equal((await read(`/files/${unrelated.images[0].fileId}`)).status, 404)
  assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}`, { as: '' })).status, 404)
  assert.equal((await h.request(`/api/glove/public/quote/files/${d.files[0]}?token=${link.token}`, { as: '' })).status, 404)
  businessRow = (await h.state()).business[0]
  await h.command('document.template', { kind: 'quote', version: businessRow.version, heading: 'Later heading', terms: 'Later terms', footer: '' })
  assert.deepEqual((await (await read('')).json()).document, d, 'issued customer document never changes with a template edit')
  assert.ok(!JSON.stringify(d).includes('1091.50'))
  assert.ok(!JSON.stringify(d).includes(b.customer.email))
  await assertTrail(h, ['document.template','document.photo','quote.linkIssued'])
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: (await h.command('privacy.preview', { customerId: customer.id, version: customer.version })).fingerprint })
  assert.equal((await read('')).status, 404)
  assert.equal((await read(`/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
  assert.equal((await h.request(`/api/glove/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
})

test('QUOTE-005, QUOTE-015 owner templates stay separate and original document photos survive restart, refusals and replay', async t => {
  const h = await installation(); t.after(() => h.close())
  const b = await business(h)
  const { job } = await completedJob(h, b)
  let invoice = await b.office.run('invoice.prepare', { jobId: job.id })
  const doc = await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: b.office.cookie }).then(r => r.json())
  assert.equal(doc.kind, 'invoice'); assert.equal(doc.lines[0].description, 'Split system service')
  assert.equal(doc.totals.total, invoice.revisions[0].totals.total)
  assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: b.priyaPerson.cookie })).status, 403)
  assert.equal((await h.request(`/api/glove/documents/invoice/${invoice.id}`, { as: '' })).status, 401)
  const plan = await h.command('plan.save', { name: 'Synthetic annual service', price: '240.00', termMonths: 12, includedVisits: 2, visitServiceId: b.service.id, repairDiscountPercent: '15', priorityBooking: true })
  const agreement = await h.command('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, startDate: '2026-10-01', via: 'phone' })
  const agreementDoc = await h.request(`/api/glove/documents/agreement/${agreement.id}`).then(r => r.json())
  assert.equal(agreementDoc.title, plan.name)
  assert.match(agreementDoc.lines[0].customerDescription, /2 included visits/)
  assert.equal(agreementDoc.totals.total, '240.00')

  const report = (await h.state()).serviceReports.find(r => r.jobId === job.id)
  assert.ok(report, 'a completed report exists before template changes')
  const templates = {
    quote: { heading: 'Quote <b>heading</b>', terms: 'Quote terms <img src=x onerror="alert(1)">', footer: 'Quote footer & closing' },
    invoice: { heading: 'Invoice <em>heading</em>', terms: 'Invoice payment terms only', footer: 'Invoice footer <script>literal</script>' },
    report: { heading: 'Report heading & findings', terms: 'Report terms <b>literal</b>', footer: 'Report footer only' },
    agreement: { heading: 'Agreement heading only', terms: 'Agreement terms & conditions', footer: 'Agreement footer <em>literal</em>' },
  }
  for (const [kind, template] of Object.entries(templates)) {
    const row = (await h.state()).business[0]
    const commandId = `synthetic-glove-template-${kind}`
    const saved = await h.command('document.template', { kind, version: row.version, ...template }, { commandId })
    assert.deepEqual(saved.documentTemplates[kind], template)
    assert.deepEqual(await h.command('document.template', { kind, version: row.version, ...template }, { commandId }), saved)
    assert.equal((await h.state()).business[0].version, saved.version, 'replaying a template save changes nothing')
  }
  let quote = await acceptedQuote(h, b, 'Original document photos')
  const attachments = [
    { kind: 'quote', record: quote, base64: documentPhoto, caption: 'Outdoor heater <b>before</b>' },
    { kind: 'invoice', record: invoice, base64: technicianPhoto, caption: 'Completed work & inspection' },
  ]
  for (const attachment of attachments) {
    const { kind, record, base64, caption } = attachment
    const commandId = `synthetic-glove-document-${kind}`
    const payload = { kind, id: record.id, version: record.version, photo: { mediaType: 'image/png', base64 }, caption }
    const saved = await h.command('document.photo', payload, { commandId })
    assert.equal(saved.documentPhotos.length, 1)
    assert.equal(saved.documentPhotos[0].caption, caption)
    assert.deepEqual(await h.command('document.photo', payload, { commandId }), saved)
    attachment.record = (await h.state())[kind === 'quote' ? 'quotes' : 'invoices'].find(r => r.id === saved.id)
  }
  quote = attachments[0].record; invoice = attachments[1].record
  assert.notEqual(quote.documentPhotos[0].file.fileId, invoice.documentPhotos[0].file.fileId)

  const viewer = await h.person('Document Viewer', 'viewer')
  const subcontractor = await h.person('Document Subcontractor', 'subcontractor')
  const customRole = await h.command('role.save', { name: 'Document preparer', permissions: ['quote.draft', 'invoice.prepare'] })
  const custom = await h.person('Document Custom', `custom:${customRole.id}`)
  const token = await h.command('token.issue', { name: 'Document integration', role: 'office' })
  const records = async () => {
    const state = await h.state(), exported = await h.request('/api/glove/export').then(r => r.json())
    return { business: state.business, quotes: state.quotes, invoices: state.invoices, agreements: state.agreements, reports: state.serviceReports, files: exported.files }
  }
  const templatePayload = () => ({ kind: 'invoice', version: 0, ...templates.invoice })
  const photoPayload = attachment => ({ kind: attachment.kind, id: attachment.record.id, version: attachment.record.version, photo, caption: 'Refused replacement' })
  const before = await records()
  for (const person of [b.dispatcher, b.office, b.priyaPerson, b.tomPerson, b.agent, viewer, subcontractor, custom]) {
    await person.run('document.template', templatePayload(), { error: 'FORBIDDEN' })
    for (const attachment of attachments) await person.run('document.photo', photoPayload(attachment), { error: 'FORBIDDEN' })
    assert.deepEqual(await records(), before, `${person.name} cannot change document records or originals`)
  }
  for (const [type, payload] of [['document.template', templatePayload()], ...attachments.map(a => ['document.photo', photoPayload(a)])]) {
    const response = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: `synthetic-glove-token-${type.replaceAll('.', '-')}-${payload.kind}`, type, payload } })
    assert.equal(response.status, 403)
    assert.equal((await response.json()).error.code, 'FORBIDDEN')
    const signedOut = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: `synthetic-glove-out-${type.replaceAll('.', '-')}-${payload.kind}`, type, payload } })
    assert.equal(signedOut.status, 401)
  }
  await h.command('token.revoke', { tokenId: token.id })
  const revoked = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${token.token}` }, body: { commandId: 'synthetic-glove-revoked-token', type: 'document.photo', payload: photoPayload(attachments[0]) } })
  assert.equal(revoked.status, 401)
  assert.deepEqual(await records(), before)

  const current = (await h.state()).business[0]
  await h.command('document.template', { ...templates.quote, kind: 'quote', version: current.version - 1 }, { error: 'STALE' })
  for (const fields of [{ heading: '' }, { heading: 'x'.repeat(121) }, { terms: 'x'.repeat(8001) }, { footer: 'x'.repeat(2001) }, { kind: 'memo' }]) {
    await h.command('document.template', { ...templates.invoice, kind: 'invoice', version: current.version, ...fields }, { error: 'INPUT' })
    assert.deepEqual(await records(), before, 'invalid template input preserves every kind and file')
  }
  for (const attachment of attachments) {
    const payload = photoPayload(attachment)
    await h.command('document.photo', { ...payload, version: payload.version - 1 }, { error: 'STALE' })
    for (const fields of [{ caption: 'x'.repeat(301) }, { photo: { mediaType: 'unsupported', base64: png } }, { photo: { mediaType: 'image/png', base64: 'invalid bytes' } }, { photo: { mediaType: 'image/png', base64: Buffer.from('synthetic-glove-17').toString('base64') } }]) {
      await h.command('document.photo', { ...payload, ...fields }, { error: fields.photo && fields.photo.mediaType === 'image/png' ? 'FILE' : 'INPUT' })
      assert.deepEqual(await records(), before, 'refused attachment changes neither records nor stored originals')
    }
  }
  await h.command('document.photo', { kind: 'report', id: report.id, version: report.version, photo, caption: 'Cannot alter a completed report' }, { error: 'IMMUTABLE' })
  assert.deepEqual(await records(), before)

  // Current authority applies even to a previously successful command replay.
  const delegate = await h.person('Document Owner', 'owner')
  const ownerPayload = { kind: 'agreement', version: (await h.state()).business[0].version, ...templates.agreement }
  await delegate.run('document.template', ownerPayload, { commandId: 'synthetic-glove-delegate-template' })
  await h.command('role.set', { operatorId: delegate.id, role: 'viewer' })
  const withdrawn = await records()
  await delegate.run('document.template', ownerPayload, { commandId: 'synthetic-glove-delegate-template', error: 'FORBIDDEN' })
  await delegate.run('document.photo', photoPayload(attachments[0]), { error: 'FORBIDDEN' })
  assert.deepEqual(await records(), withdrawn)
  const branch = await h.command('branch.save', { name: 'Document branch', prefix: 'DOC', timezone: 'America/Chicago', zips: [] })
  await h.command('branch.limit', { operatorId: delegate.id, branchId: branch.id })
  await h.command('role.set', { operatorId: delegate.id, role: 'owner' })
  const branchBefore = await records()
  await delegate.run('document.template', templatePayload(), { error: 'FORBIDDEN' })
  for (const attachment of attachments) await delegate.run('document.photo', photoPayload(attachment), { error: 'NOT_FOUND' })
  assert.deepEqual(await records(), branchBefore)

  await h.restart()
  const kept = await h.state()
  assert.deepEqual(kept.business[0].documentTemplates, templates, 'all four independently specified templates survive an actual Worker restart')
  assert.deepEqual(kept.serviceReports.find(r => r.id === report.id), report, 'later template edits and refused attachments preserve the completed report')
  for (const { kind, record, base64, caption } of attachments) {
    const retained = kept[kind === 'quote' ? 'quotes' : 'invoices'].find(r => r.id === record.id)
    assert.deepEqual(retained, record)
    const file = retained.documentPhotos[0].file
    assert.equal(retained.documentPhotos[0].caption, caption)
    assert.equal(file.sha256, createHash('sha256').update(Buffer.from(base64, 'base64')).digest('hex'))
    assert.equal(file.size, Buffer.from(base64, 'base64').length)
    assert.equal(file.mediaType, 'image/png')
    const response = await h.request(`/api/glove/files/${file.fileId}`)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/png')
    assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), base64)
    assert.equal((await h.request(`/api/glove/files/${file.fileId}`, { as: '' })).status, 401)
    assert.equal((await h.request(`/api/glove/files/${file.fileId}`, { as: b.tomPerson.cookie })).status, 404)
  }
  for (const [kind, record] of [['invoice', invoice], ['agreement', agreement]]) {
    const currentDocument = await h.request(`/api/glove/documents/${kind}/${record.id}`).then(r => r.json())
    assert.deepEqual(currentDocument.template, templates[kind])
    if (kind === 'invoice') assert.deepEqual(currentDocument.photos, invoice.documentPhotos)
  }
  const { activity, exported } = await assertTrail(h, ['document.template', 'document.photo'])
  for (const kind of ['quote', 'invoice', 'report', 'agreement']) {
    const events = activity.filter(e => e.commandId === `synthetic-glove-template-${kind}`)
    assert.equal(events.length, 1)
    assert.deepEqual([events[0].actorName, events[0].actorRole, events[0].subjectKind, events[0].subjectId], ['Olivia Owner', 'owner', 'business', 'business'])
    assert.deepEqual(exported.business[0].documentTemplates[kind], templates[kind])
  }
  for (const { kind, record } of attachments) {
    const events = activity.filter(e => e.commandId === `synthetic-glove-document-${kind}`)
    assert.equal(events.length, 1)
    const e = events[0]
    assert.deepEqual([e.kind, e.actorName, e.actorRole, e.subjectKind, e.subjectId], ['document.photo', 'Olivia Owner', 'owner', kind, record.id])
    const exportedEvent = exported.timeline.find(x => x.id === e.id)
    assert.equal(JSON.parse(exportedEvent.data).fileId, record.documentPhotos[0].file.fileId)
    assert.equal(exported.files.filter(f => f.captureId === record.id).length, 1, 'replay leaves exactly one original')
  }
  const customer = kept.customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const erased = await records()
  for (const { kind, record, base64, caption } of attachments) {
    assert.equal((await h.request(`/api/glove/files/${record.documentPhotos[0].file.fileId}`)).status, 404)
    await h.command('document.photo', { kind, id: record.id, version: record.version - 1, photo: { mediaType: 'image/png', base64 }, caption }, { commandId: `synthetic-glove-document-${kind}`, error: 'ERASED' })
  }
  const erasedInvoice = (await h.state()).invoices.find(r => r.id === invoice.id)
  await h.command('document.photo', { kind: 'invoice', id: invoice.id, version: erasedInvoice.version, photo, caption: 'Must not revive erased customer material' }, { error: 'ERASED' })
  assert.deepEqual(await records(), erased, 'neither replay nor a fresh attachment revives erased personal material')
})
