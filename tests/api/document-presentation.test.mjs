import test from 'node:test'
import assert from 'node:assert/strict'
import { scenario } from '../fixtures/scenario.mjs'
import { documentPhoto, documentLogo, documentSignature } from '../fixtures/document-images.mjs'
import { installation, business } from './harness.mjs'

const photo = { mediaType: 'image/png', base64: documentPhoto }
const fixedAt = '2030-03-01T00:30:00.000Z'
const legacyAddress = '14 Harbour St, Balmain NSW 2041'
async function presentationFixture(h) {
  const b = await business(h, { currency: 'USD', timezone: 'America/Chicago', email: '', phone: '5125550125', address: legacyAddress, insurance: { carrier: 'Synthetic Insurer', policy: 'synthetic-glove-190', expires: '2031-12-31' }, logo: { mediaType: 'image/png', base64: documentLogo } })
  const sub = await h.person('Sid Presentation', 'subcontractor')
  await h.setTime(fixedAt)
  const service = await h.command('service.save', { code: 'synthetic-glove-190', name: 'Heating inspection', description: 'Inspect the heat exchanger and test airflow.', unitPrice: '200.00', tax: 'FREE', image: photo })
  const form = await h.command('form.save', { name: 'Heating readings', serviceIds: [service.id], questions: [{ id: 'pressure', label: 'Supply pressure', type: 'reading', unit: 'psi', min: '40', max: '80', required: true }, { id: 'image', label: 'Reading original', type: 'photo', required: true }] })
  const options = ['Standard service', 'Extended service'].map((name, i) => ({ name, lines: [{ serviceId: service.id, description: `${name} line`, quantity: '1', unitPrice: i ? '300.00' : '200.00', tax: 'FREE' }, { description: `${name} final line`, quantity: '2', unitPrice: '5.00', tax: 'FREE' }] }))
  const addOns = [{ name: 'Filter pack', lines: [{ serviceId: service.id, description: 'Replacement filter line', quantity: '1', unitPrice: '25.00', tax: 'FREE' }] }]
  const makeQuote = async (title, validUntil = '2030-03-31') => {
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title, options, addOns, validUntil, terms: 'Schedule work with the office before entry.', notes: 'Retain this proposal for your records.' })
    q = await h.command('document.photo', { kind: 'quote', id: q.id, version: q.version, photo, caption: `${title} original` })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    return { q, link: await h.command('quote.link', { quoteId: q.id, version: q.version }) }
  }
  for (const kind of ['quote', 'invoice', 'report', 'agreement']) await h.command('document.template', { kind, version: (await h.state()).business[0].version, heading: kind === 'report' ? 'Service report' : kind === 'agreement' ? 'Service agreement' : kind === 'invoice' ? 'Invoice' : 'Quote', terms: `${kind} document terms retained.`, footer: `${kind} final customer footer.` })
  const open = await makeQuote('Open heating proposal')
  const expired = await makeQuote('Expired heating proposal', '2030-02-27')
  const decided = await makeQuote('Decided heating proposal')
  const response = await h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${decided.link.token}` }, body: { action: 'decline', name: 'Synthetic Customer', capacity: 'Property manager' } })
  assert.equal(response.status, 200)
  const job = await b.dispatcher.run('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Completed heating inspection', lines: options[0].lines })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2030-02-28', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
  const captured = await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'form', formId: job.forms[0].id, answers: { pressure: '95', image: photo } })
  const photoCommandId = crypto.randomUUID()
  const originalPayload = { visitId: visit.id, deviceTime: visit.startAt, kind: 'photo', photo, caption: 'Heat exchanger original' }
  const original = await b.priyaPerson.run('visit.capture', originalPayload, { commandId: photoCommandId })
  await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: visit.startAt, kind: 'material', description: 'Copper fitting', quantity: '2', unit: 'each' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: 'Completed inspection with airflow test.', findings: 'Pressure above the recorded range.', recommendations: [{ title: 'Pressure regulator', description: 'Discuss regulator work with the office.' }], signoff: { customerName: 'Synthetic Customer', signature: { mediaType: 'image/png', base64: documentSignature } } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === visit.id)
  const reportLink = await h.command('report.link', { reportId: report.id })
  let invoice = await b.office.run('invoice.prepare', { jobId: job.id, lines: options[0].lines })
  invoice = await b.office.run('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
  invoice = await h.command('document.photo', { kind: 'invoice', id: invoice.id, version: invoice.version, photo, caption: 'Invoice inspection original' })
  const plan = await h.command('plan.save', { name: 'Annual heating care', price: '240.00', termMonths: 12, includedVisits: 2, visitServiceId: service.id, repairDiscountPercent: '0', priorityBooking: true })
  let agreement = await h.command('agreement.sell', { planId: plan.id, customerId: b.customer.id, siteId: b.site.id, startDate: '2030-03-01', via: 'phone' })
  agreement = await h.command('document.photo', { kind: 'agreement', id: agreement.id, version: agreement.version, photo, caption: 'Agreement inspection original' })
  const read = (scope, token, path = '', extra = {}) => h.request(`/api/glove/public/${scope}${path}`, { as: '', headers: { authorization: `Bearer ${token}` }, ...extra })
  const desk = (kind, as = h.owner()) => h.request(`/api/glove/documents/${kind}/${kind === 'invoice' ? invoice.id : agreement.id}`, { as })
  return { b, sub, service, options, addOns, makeQuote, open, expired, decided, job, visit, captured, original, report, reportLink, invoice, agreement, read, desk, photoCommandId, originalPayload }
}

test('QUOTE-015 document presentation preserves scoped originals, calendar facts and honest states after Worker restart', async t => {
  const h = await installation({ at: fixedAt }); t.after(() => h.close())
  const f = await presentationFixture(h)
  await scenario(t, 'point 1: current desk roles, branches, revisions and scoped original bytes', async () => {
    const deskDocs = {}
    for (const kind of ['invoice', 'agreement']) {
      const expected = await (await f.desk(kind)).json(); deskDocs[kind] = expected
      for (const as of [h.owner(), f.b.dispatcher.cookie, f.b.office.cookie]) {
        const response = await f.desk(kind, as)
        assert.equal(response.status, 200); assert.deepEqual(await response.json(), expected)
      }
      for (const as of [f.b.priyaPerson.cookie, f.sub.cookie]) assert.equal((await f.desk(kind, as)).status, 403)
      assert.equal((await f.desk(kind, '')).status, 401)
    }
    await h.command('branch.limit', { operatorId: f.b.office.id, branchId: 'main' })
    assert.equal((await f.desk('invoice', f.b.office.cookie)).status, 200)
    const elsewhere = await h.command('branch.save', { name: 'Elsewhere', prefix: 'ELSE', timezone: 'America/Los_Angeles', zips: [] })
    await h.command('branch.limit', { operatorId: f.b.office.id, branchId: elsewhere.id })
    for (const kind of ['invoice', 'agreement']) {
      const response = await f.desk(kind, f.b.office.cookie)
      assert.equal(response.status, 404); assert.equal((await response.json()).error.code, 'NOT_FOUND')
    }
    await h.command('branch.limit', { operatorId: f.b.office.id, branchId: null })
    const opened = await (await f.read('quote', f.open.link.token)).json()
    const report = (await (await f.read('reports', f.reportLink.token)).json()).report
    const originals = new Map([[opened.document.business.logo.fileId, documentLogo], [report.signoff.signature.fileId, documentSignature]])
    const filesOf = d => [d.business.logo, ...d.lines.flatMap(l => l.images ?? []), ...d.photos.map(p => p.file)]
    const groups = [
      ['quote', f.open.link.token, opened.document.files],
      ['reports', f.reportLink.token, report.files],
      ...Object.values(deskDocs).map(d => ['desk', h.owner(), filesOf(d).map(f => f.fileId)]),
    ]
    const revoked = await f.makeQuote('Revoked presentation proposal')
    const replacement = await h.command('quote.link', { quoteId: revoked.q.id, version: revoked.q.version })
    const assertOriginalDoors = async () => {
      for (const [scope, token, ids] of groups) for (const id of ids) {
        const path = `/files/${id}`
        const response = scope === 'desk' ? await h.request('/api/glove' + path) : await f.read(scope, token, path)
        assert.equal(response.status, 200)
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(originals.get(id) ?? documentPhoto, 'base64'), `${scope} original is byte-identical`)
      }
      for (const [scope, token, id] of [['quote', f.open.link.token, f.original.file.fileId], ['reports', f.reportLink.token, f.open.q.documentPhotos[0].file.fileId]]) {
        assert.equal((await f.read(scope, token, `/files/${id}`)).status, 404)
      }
      assert.equal((await f.read('quote', f.reportLink.token)).status, 404)
      assert.equal((await f.read('reports', f.open.link.token)).status, 404)
      for (const id of report.files) assert.equal((await h.request(`/api/glove/files/${id}`, { as: f.b.tomPerson.cookie })).status, id === report.business.logo.fileId ? 200 : 404, 'the shared business logo remains available to signed-in roles; job originals do not')
      for (const [scope, id] of [['quote', opened.document.files[0]], ['reports', report.files[0]]]) {
        assert.equal((await h.request(`/api/glove/public/${scope}`, { as: '' })).status, 404)
        assert.equal((await h.request(`/api/glove/public/${scope}/files/${id}`, { as: '' })).status, 404)
      }
      assert.equal((await f.read('quote', revoked.link.token)).status, 404)
      assert.equal((await f.read('quote', revoked.link.token, `/files/${revoked.q.documentPhotos[0].file.fileId}`)).status, 404)
      assert.equal((await (await f.read('quote', replacement.token)).json()).document.title, 'Revoked presentation proposal')
    }
    await assertOriginalDoors()
    const prior = await f.makeQuote('Revision custody proposal')
    let q = await h.command('quote.revise', { quoteId: prior.q.id, version: prior.q.version, options: f.options, addOns: f.addOns, validUntil: '2030-03-31' })
    const superseded = await (await f.read('quote', prior.link.token)).json()
    assert.equal(superseded.state, 'superseded'); assert.equal(superseded.document, undefined)
    assert.equal((await f.read('quote', prior.link.token, `/files/${prior.q.documentPhotos[0].file.fileId}`)).status, 404)
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 2 })
    const current = await h.command('quote.link', { quoteId: q.id, version: q.version })
    assert.deepEqual(await (await f.read('quote', prior.link.token)).json(), superseded)
    assert.equal((await (await f.read('quote', current.token)).json()).document.revision, 2)
    await h.restart()
    assert.deepEqual((await (await f.read('quote', f.open.link.token)).json()).document, opened.document)
    assert.deepEqual((await (await f.read('reports', f.reportLink.token)).json()).report, report)
    for (const kind of ['invoice', 'agreement']) assert.deepEqual(await (await f.desk(kind)).json(), deskDocs[kind])
    assert.deepEqual(await (await f.read('quote', prior.link.token)).json(), superseded)
    await assertOriginalDoors()
    for (const kind of ['invoice', 'agreement']) {
      for (const as of [h.owner(), f.b.dispatcher.cookie, f.b.office.cookie]) assert.equal((await f.desk(kind, as)).status, 200)
      for (const as of [f.b.priyaPerson.cookie, f.sub.cookie]) assert.equal((await f.desk(kind, as)).status, 403)
      assert.equal((await f.desk(kind, '')).status, 401)
    }
    await h.command('branch.limit', { operatorId: f.b.office.id, branchId: elsewhere.id })
    for (const kind of ['invoice', 'agreement']) {
      const response = await f.desk(kind, f.b.office.cookie)
      assert.equal(response.status, 404); assert.equal((await response.json()).error.code, 'NOT_FOUND')
    }
    await h.command('branch.limit', { operatorId: f.b.office.id, branchId: null })
  })
  await scenario(t, 'point 2: stored calendar dates, phone inputs, legacy addresses and frozen validity zone', async () => {
    const q = (await (await f.read('quote', f.open.link.token)).json()).document
    const invoice = await (await f.desk('invoice')).json(), agreement = await (await f.desk('agreement')).json()
    const report = (await (await f.read('reports', f.reportLink.token)).json()).report
    assert.deepEqual([q.date, q.validUntil, q.validityZone], ['2030-02-28', '2030-03-31', 'America/Chicago'])
    assert.deepEqual([invoice.date, invoice.due, agreement.date, report.visit.date], ['2030-02-28', '2030-03-14', '2030-03-01', '2030-02-28'])
    for (const d of [q, invoice, agreement, report]) {
      assert.equal(d.business.insurance.expires, '2031-12-31')
      assert.equal(d.business.phone, '5125550125'); assert.equal(d.business.address, legacyAddress); assert.equal(d.site.address, legacyAddress)
    }
    await h.command('business.save', { ...(await h.state()).business[0], logo: undefined, timezone: 'Australia/Sydney', phone: '+1 212 555 0199' })
    assert.equal((await (await f.desk('invoice')).json()).business.phone, '+1 212 555 0199')
    assert.equal((await (await f.read('quote', f.open.link.token)).json()).document.validityZone, 'America/Chicago')
    await h.restart()
    assert.equal((await (await f.read('quote', f.open.link.token)).json()).document.validityZone, 'America/Chicago')
    await h.command('business.save', { ...(await h.state()).business[0], logo: undefined, phone: '020 7946 0958 ext 7' })
    assert.equal((await (await f.desk('agreement')).json()).business.phone, '020 7946 0958 ext 7')
  })
  await scenario(t, 'point 3: complete printable projections for open, expired, decided, completed and desk documents', async () => {
    for (const [which, expected] of [['open', 'open'], ['expired', 'expired'], ['decided', 'decided']]) {
      const view = await (await f.read('quote', f[which].link.token)).json()
      assert.equal(view.state, expected)
      assert.deepEqual(view.document.options.map(o => o.lines.map(l => l.description)), [['Standard service line', 'Standard service final line'], ['Extended service line', 'Extended service final line']])
      assert.equal(view.document.addOns[0].lines[0].description, 'Replacement filter line')
      assert.deepEqual(view.document.options.map(o => o.totals.total), ['210.00', '310.00'])
      assert.equal(view.document.template.footer, 'quote final customer footer.')
    }
    const before = await Promise.all(['invoice', 'agreement'].map(async k => (await f.desk(k)).json()))
    await h.restart()
    assert.deepEqual(await Promise.all(['invoice', 'agreement'].map(async k => (await f.desk(k)).json())), before)
  })
  await scenario(t, 'point 4: unsigned disclosure, refusal and recorded statuses never invent signing or delivery', async () => {
    const inspect = async () => {
      const open = await (await f.read('quote', f.open.link.token)).json()
      assert.equal(open.signed, null); assert.equal(open.signingAvailable, false)
      assert.match(open.signingMessage, /owner.*disclosure|disclosure.*owner/i)
      const before = await h.state()
      const refused = await f.read('quote', f.open.link.token, '', { method: 'POST', body: { action: 'approve', name: 'Synthetic Customer', capacity: 'Owner' } })
      assert.equal(refused.status, 409); assert.equal((await refused.json()).error.code, 'CONSENT_GATE')
      assert.deepEqual(await h.state(), before, 'a gated approval changes nothing')
      for (const kind of ['invoice', 'agreement']) {
        const d = await (await f.desk(kind)).json()
        assert.equal(d.status, kind === 'invoice' ? 'approved' : 'sold')
        assert.doesNotMatch(JSON.stringify(d), /"(?:sentAt|deliveredAt|signedAt|signature|delivery)"/)
      }
      assert.equal(h.email.sent.length, 0)
      return open
    }
    const original = await inspect(); await h.restart(); assert.deepEqual(await inspect(), original)
    const customer = (await h.state()).customers.find(c => c.id === f.b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    await h.restart()
    assert.equal((await f.read('quote', f.open.link.token)).status, 404)
    assert.equal((await f.read('reports', f.reportLink.token)).status, 404)
    assert.equal((await f.read('reports', f.reportLink.token, `/files/${f.original.file.fileId}`)).status, 404)
    const erasedState = await h.state()
    const replay = await h.request('/api/glove/commands', { as: f.b.priyaPerson.cookie, method: 'POST', body: { commandId: f.photoCommandId, type: 'visit.capture', payload: f.originalPayload } })
    assert.equal(replay.status, 200)
    const outcome = await replay.json()
    assert.equal(outcome.ok, false); assert.equal(outcome.error.code, 'ERASED'); assert.equal(outcome.result, undefined)
    assert.deepEqual(await h.state(), erasedState, 'replaying an old capture cannot resurrect erased evidence')
    assert.equal((await f.read('reports', f.reportLink.token, `/files/${f.original.file.fileId}`)).status, 404)
    const erasedInvoice = await f.desk('invoice')
    assert.equal(erasedInvoice.status, 409); assert.equal((await erasedInvoice.json()).error.code, 'ERASED')
  })
})
