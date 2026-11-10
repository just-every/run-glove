import assert from 'node:assert/strict'
import { scenario } from './scenario.mjs'
import { installation, business, id } from '../api/harness.mjs'

const email = name => [name, 'example.test'].join('@')
const jpeg = Buffer.from('ffd8ffe000104a4649460001010000010000010000ffd9', 'hex').toString('base64')
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1sAAAAASUVORK5CYII='
const pdf = Buffer.from('%PDF-1.4 synthetic-glove-private-certificate').toString('base64')

const storedText = value => value instanceof ArrayBuffer || ArrayBuffer.isView(value) ? Buffer.from(value instanceof ArrayBuffer ? value : value.buffer, value.byteOffset ?? 0, value.byteLength).toString('utf8')
  : Array.isArray(value) ? value.length && value.every(n => Number.isInteger(n) && n >= 0 && n <= 255) ? Buffer.from(value).toString('utf8') : value.map(storedText).join('\n')
    : value && typeof value === 'object' ? Object.values(value).map(storedText).join('\n') : typeof value === 'string' ? value : ''

async function tables(h) {
  const names = (await h.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name GLOB 'glove_*' OR name GLOB 'rer_*') ORDER BY name").all()).results.map(r => r.name)
  return Object.fromEntries(await Promise.all(names.map(async name => [name, (await h.db.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all()).results])))
}

// Independent native histories keep the export and erasure checks nonempty.
export async function dataPrivacyQualification(t) {
  const h = await installation({ captureLogs: true, at: '2026-11-09T02:00:00Z' })
  t.after(() => h.close())
  const b = await business(h), graphs = [], secrets = [], originals = []
  let merged, before, exportPayload, exportId, exportEvents, download, receipt, epoch, transfer, taxBefore
  const costsBefore = new Map()
  const current = async (kind, key) => (await h.state())[kind].find(r => r.id === key)
  const json = async path => { const response = await h.request(path); assert.equal(response.status, 200); return response.json() }
  await scenario(t, 'DATA-001 point 1: independently seeded merged histories and a peer contain operational, financial and original evidence', async () => {
    await h.command('quote.consent', { version: (await h.state()).business[0].version, text: 'Synthetic explicit signing disclosure', accept: true })
    b.service = await h.command('service.save', { ...b.service, unitCost: '45.00' })
    const material = await h.command('service.save', { code: 'SYNTHETIC-MATERIAL', name: 'Synthetic costed material', kind: 'material', unit: 'each', unitCost: '11.00', unitPrice: '22.00', tax: 'GST' })
    const mail = await h.command('mail.connect', { provider: 'postmark', apiKey: 'synthetic-glove-mail', fromEmail: email('synthetic-glove-office') })
    for (const [n, customer, site] of [
      [1, b.customer, b.site],
      [2, await h.command('customer.save', { name: 'Synthetic second identity', email: email('synthetic-glove-second'), phone: '02 9555 0202', contact: 'Synthetic second contact', billingAddress: '22 Synthetic Identity Road' }), null],
      [3, await h.command('customer.save', { name: 'Synthetic independent peer', email: email('synthetic-glove-peer'), phone: '02 9555 0303' }), null],
    ]) {
      const property = site ?? await h.command('site.save', { customerId: customer.id, address: `${n * 11} Synthetic Identity Road`, contact: `Synthetic site contact ${n}`, contactPhone: `02 9555 040${n}` })
      const enquiry = await h.command('enquiry.create', { customerId: customer.id, siteId: property.id, description: `Synthetic private request ${n}`, source: 'phone' })
      let baseQuote = await h.command('quote.draft', { customerId: customer.id, siteId: property.id, title: `Synthetic service ${n}`, lines: [{ description: 'Service', serviceId: b.service.id, quantity: '1', unitPrice: '189.00', unitCost: '45.00' }] })
      baseQuote = await h.command('quote.approve', { quoteId: baseQuote.id, version: baseQuote.version, revision: 1 })
      await h.command('quote.accept', { quoteId: baseQuote.id, version: baseQuote.version, revision: 1, method: 'phone', customerName: customer.name })
      const job = await h.command('job.create', { quoteId: baseQuote.id })
      const booked = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: `2026-10-${20 + n}`, start: '09:00', end: '10:00' })
      await b.priyaPerson.run('visit.arrive', { visitId: booked.id, deviceTime: booked.startAt })
      for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: booked.id, deviceTime: booked.startAt, kind: 'checklist', itemId: item.id, result: 'done' })
      const materialCapture = await b.priyaPerson.run('visit.capture', { visitId: booked.id, deviceTime: booked.startAt, kind: 'material', serviceId: material.id, quantity: '2', description: `Synthetic private material evidence ${n}` })
      await b.priyaPerson.run('visit.complete', { visitId: booked.id, deviceTime: booked.endAt, summary: `Synthetic completion ${n}`, signoff: { absentReason: 'Customer away' } })
      const work = { job, visit: booked, material: materialCapture }
      const photo = await b.priyaPerson.run('visit.capture', { visitId: work.visit.id, deviceTime: work.visit.endAt, kind: 'photo', caption: `Synthetic private photo ${n}`, photo: { mediaType: 'image/jpeg', base64: jpeg } })
      const notePayload = { visitId: work.visit.id, deviceTime: work.visit.endAt, kind: 'note', text: `Synthetic private visit note ${n}` }, noteCommandId = id()
      const note = await b.priyaPerson.run('visit.capture', notePayload, { commandId: noteCommandId })
      const unit = await h.command('equipment.save', { siteId: property.id, type: 'Heat pump', serial: `synthetic-glove-private-unit-${n}`, location: `Synthetic private unit location ${n}`, photo: { mediaType: 'image/jpeg', base64: jpeg } })
      const conversation = await h.command('conversation.log', { customerId: customer.id, kind: 'note', text: `Synthetic private conversation ${n}` })
      let invoice = await h.command('invoice.prepare', { jobId: work.job.id })
      invoice = await h.command('invoice.approve', { invoiceId: invoice.id, version: invoice.version, revision: 1 })
      const payment = await h.command('payment.record', { invoiceId: invoice.id, version: invoice.version, method: 'check', reference: `synthetic-glove-private-payment-${n}`, amount: '100.00' })
      invoice = await current('invoices', invoice.id)
      const refund = await h.command('payment.refund', { invoiceId: invoice.id, version: invoice.version, paymentId: payment.id, paymentVersion: payment.version, amount: '10.00', reason: `Synthetic private refund ${n}` })
      assert.equal(refund.status, 'paid')
      const message = await h.command('email.send', { kind: 'invoice', id: invoice.id, version: (await current('invoices', invoice.id)).version })
      const delivery = await h.mf.dispatchFetch(h.origin + '/api/glove/mail/events', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Basic ${Buffer.from(`glove:${mail.callbackPassword}`).toString('base64')}` }, body: JSON.stringify({ RecordType: 'Delivery', MessageID: `pm-receipt-${h.email.sent.length}`, Recipient: message.to, DeliveredAt: '2026-11-09T02:00:00Z', Metadata: { glove_delivery_id: message.id } }) })
      assert.equal(delivery.status, 200)
      const expense = await h.command('expense.record', { jobId: work.job.id, category: 'supply-house purchase', vendor: `Synthetic private vendor ${n}`, description: `Synthetic private material ${n}`, amount: '12.00', tax: 'GST' })
      const pending = await h.command('job.create', { customerId: customer.id, siteId: property.id, title: `Synthetic booking job ${n}`, lines: [{ serviceId: b.service.id, description: 'Service', quantity: '1', unitPrice: '189.00' }] })
      const booking = await h.command('booking.offer', { jobId: pending.id, slots: [{ date: '2026-11-20', start: '09:00', end: '10:00', window: { start: '08:00', end: '11:00' } }] })
      let q = await h.command('quote.draft', { enquiryId: enquiry.id, title: `Synthetic signed quote ${n}`, lines: [{ description: 'Signed service', quantity: '1', unitPrice: '25.00' }] })
      q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
      const link = await h.command('quote.link', { quoteId: q.id, version: q.version })
      const publicQuote = body => h.request('/api/glove/public/quote', { as: '', method: 'POST', headers: { authorization: `Bearer ${link.token}` }, body })
      const choice = { optionId: 'option-1', addOnIds: [] }
      const view = await (await publicQuote({ action: 'choose', choice })).json()
      const signed = await publicQuote({ action: 'approve', name: customer.name, capacity: 'Owner', choice, documentHash: view.documentHash, selectionHash: view.selection.hash, consent: { version: view.disclosure.version, hash: view.disclosure.hash, affirmed: true }, signature: { kind: 'drawn', width: 600, height: 200, strokes: [[[20, 80], [70, 30], [100, 100], [180, 50]]] } })
      assert.equal(signed.status, 200, await signed.clone().text())
      const signedDoor = `/api/glove/quotes/${q.id}/signed`
      const copy = await h.request(signedDoor)
      assert.equal(copy.status, 200)
      const signedBytes = Buffer.from(await copy.arrayBuffer()).toString('base64')
      const signJob = await h.command('job.create', { customerId: customer.id, siteId: property.id, title: `Synthetic signoff job ${n}` })
      const visit = await h.command('visit.book', { jobId: signJob.id, technicianId: b.priya.id, date: `2026-10-${24 + n}`, start: '09:00', end: '10:00' })
      await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: visit.startAt })
      const signedVisit = await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: visit.endAt, summary: `Synthetic private completion ${n}`, signoff: { customerName: customer.name, signature: { mediaType: 'image/png', base64: png } } })
      graphs.push({ customer, site: property, enquiry, ...work, photo, note, notePayload, noteCommandId, unit, conversation, invoice, payment, refund, message, expense, pending, booking, quote: q, link, signedDoor, signedBytes, signJob, signVisit: signedVisit })
      if (n < 3) {
        secrets.push(customer.name, customer.email, customer.phone, customer.contact, customer.billingAddress, property.address, property.contact, property.contactPhone, booking.token, link.token)
        secrets.push(...['Synthetic private request', 'Synthetic private photo', 'Synthetic private visit note', 'Synthetic private unit location', 'Synthetic private conversation', 'Synthetic private refund', 'Synthetic private vendor', 'Synthetic private material', 'Synthetic private completion', 'Synthetic signed quote', 'Synthetic booking job', 'Synthetic signoff job'].map(prefix => `${prefix} ${n}`), `synthetic-glove-private-unit-${n}`, `synthetic-glove-private-payment-${n}`)
        secrets.push(`Synthetic private material evidence ${n}`)
        originals.push([photo.file.fileId, jpeg], [unit.photos[0].fileId, jpeg], [signedVisit.completion.signoff.signature.fileId, png])
      }
    }
    let customer = await h.command('customer.save', { ...b.customer, contacts: [{ name: 'Synthetic certificate contact', email: email('synthetic-glove-contact'), phone: '02 9555 0505' }], taxExemption: { certificateNumber: 'synthetic-glove-private-certificate', expires: '2028-12-31' } })
    customer = await h.command('customer.certificate', { customerId: customer.id, version: customer.version, file: { mediaType: 'application/pdf', base64: pdf } })
    originals.push([customer.taxExemption.certificate.fileId, pdf])
    secrets.push('Synthetic certificate contact', email('synthetic-glove-contact'), '02 9555 0505', 'synthetic-glove-private-certificate')
    merged = await h.command('customer.merge', { survivorId: customer.id, mergedIds: [graphs[1].customer.id], versions: { [customer.id]: customer.version, [graphs[1].customer.id]: graphs[1].customer.version } })
    before = await h.state()
    for (const g of graphs) for (const [kind, record] of [['enquiries', g.enquiry], ['jobs', g.job], ['visits', g.visit], ['captures', g.photo], ['equipment', g.unit], ['invoices', g.invoice], ['payments', g.payment], ['payments', g.refund]]) assert.ok(before[kind].some(r => r.id === record.id), `${kind} independently seeded`)
    assert.equal(before.customers.length, 3)
  })
  await scenario(t, 'DATA-001 point 2: every excluded caller is refused export and erasure without changing any record', async () => {
    const role = await h.command('role.save', { name: 'Synthetic privacy helper', permissions: ['customer.save'] })
    const custom = await h.person('Synthetic privacy helper', `custom:${role.id}`)
    const scoped = await h.person('Synthetic limited owner', 'owner')
    await h.command('branch.limit', { operatorId: scoped.id, branchId: 'main' })
    const token = await h.command('token.issue', { name: 'Synthetic privacy integration', role: 'dispatcher' })
    assert.equal((await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${token.token}` } })).status, 200)
    const snapshot = await tables(h), customer = await current('customers', b.customer.id)
    for (const who of [b.office, b.dispatcher, b.priyaPerson, b.agent, custom, scoped, { cookie: '' }, { cookie: '', token: token.token }]) for (const type of ['privacy.export', 'privacy.erase']) {
      const response = await h.request('/api/glove/commands', { method: 'POST', as: who.cookie, ...(who.token ? { headers: { authorization: `Bearer ${who.token}` } } : {}), body: { commandId: id(), type, payload: { customerId: customer.id, version: customer.version, confirm: 'ERASE' } } })
      assert.equal(response.status, who.cookie || who.token ? 403 : 401)
      assert.deepEqual(await tables(h), snapshot, 'refused privacy command changes no stored record')
    }
  })
  await scenario(t, 'DATA-001 point 3: either merged identity previews and exports the complete group and every receipt names both IDs', async () => {
    const ids = [b.customer.id, graphs[1].customer.id].sort()
    for (const customerId of ids) {
      const customer = await current('customers', customerId)
      const preview = await h.command('privacy.preview', { customerId, version: customer.version })
      assert.deepEqual(preview.customerIds.sort(), ids)
      exportPayload = { customerId, version: customer.version }; exportId = id()
      exportEvents = (await h.db.prepare('SELECT * FROM glove_events ORDER BY sequence').all()).results
      const result = await h.command('privacy.export', exportPayload, { commandId: exportId })
      assert.deepEqual(result.customerIds, ids)
      download = JSON.parse(result.download)
      assert.deepEqual(download.customerIds, ids)
      for (const g of graphs.slice(0, 2)) for (const [kind, record] of [['sites', g.site], ['enquiries', g.enquiry], ['quotes', g.quote], ['jobs', g.job], ['visits', g.visit], ['captures', g.note], ['captures', g.material], ['equipment', g.unit], ['invoices', g.invoice], ['payments', g.payment], ['payments', g.refund], ['messages', g.message], ['conversations', g.conversation]]) assert.ok(download.records[kind].some(r => r.id === record.id), `group export includes ${kind} from both identities`)
    }
  })
  await scenario(t, 'DATA-001 point 4: full timeline and byte-exact originals are shown once and excluded from replay, Activity, stored outcomes and Worker logs', async () => {
    for (const [fileId, bytes] of originals) {
      const response = await h.request(`/api/glove/files/${fileId}`)
      assert.equal(response.status, 200)
      assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), bytes)
      assert.equal(download.files.find(f => f.id === fileId).bytes, bytes)
    }
    for (const g of graphs.slice(0, 2)) assert.equal(download.files.find(f => f.id === `${g.quote.id}:signed`).bytes, g.signedBytes)
    const events = exportEvents
    for (const g of graphs.slice(0, 2)) {
      const related = [g.customer, g.site, g.enquiry, g.job, g.visit, g.photo, g.note, g.unit, g.conversation, g.invoice, g.payment, g.refund, g.message, g.expense, g.pending, g.booking, g.quote, g.link, g.signJob, g.signVisit].map(r => r.id)
      related.push(g.job.quoteId)
      const expected = events.filter(e => related.some(key => JSON.stringify(e).includes(key)))
      assert.ok(expected.length > 10)
      for (const event of expected) assert.deepEqual(download.timeline.find(e => e.id === event.id), event, 'complete related timeline is exported')
    }
    assert.ok(!JSON.stringify(download).includes(graphs[2].customer.name))
    const replay = await h.command('privacy.export', exportPayload, { commandId: exportId })
    assert.equal(replay.download, undefined)
    for (const value of [JSON.stringify(download), jpeg, pdf, graphs[0].signedBytes]) for (const content of [JSON.stringify((await tables(h)).glove_commands), JSON.stringify(await json('/api/glove/activity')), JSON.stringify(h.logs)]) assert.ok(!content.includes(value), 'download is absent from saved outcomes, Activity and logs')
  })
  await scenario(t, 'DATA-001 point 5: erasure removes operational content, originals, certificates, credentials and personal event and command copies through every existing storage door', async () => {
    before = await h.state()
    taxBefore = await json('/api/glove/reports/tax.json?from=2000-01-01&to=2099-01-01')
    assert.ok(taxBefore.jurisdictions.some(j => Number(j.tax) > 0), 'tax retention is checked with nonzero tax evidence')
    for (const g of graphs.slice(0, 2)) {
      const cost = (await json(`/api/glove/jobs/${g.job.id}/cost`)).costing
      assert.equal(cost.estimate.cost, '45.00')
      assert.equal(cost.actual.materials, '22.00')
      assert.equal(cost.actual.cost, '34.00')
      costsBefore.set(g.job.id, cost)
    }
    const customer = await current('customers', b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    // An actual in-progress snapshot must be invalidated with the erasure.
    const { createPortability } = await import('@runeditrun/rer/modules/portability')
    const service = await createPortability({ db: h.db, policy: { product: 'field-service-glove' } })
    transfer = await service.exports.create('owner')
    await service.exports.advance(transfer, { maxParts: 1 })
    epoch = await h.db.prepare('SELECT epoch FROM rer_portability_state WHERE id=1').first()
    receipt = await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
    assert.equal(receipt.outcome, 'complete')
    assert.deepEqual(receipt.customerIds, [b.customer.id, graphs[1].customer.id].sort())
    for (const [fileId] of originals) assert.equal((await h.request(`/api/glove/files/${fileId}`)).status, 404)
    for (const g of graphs.slice(0, 2)) {
      assert.equal((await h.request(g.signedDoor)).status, 404)
      for (const [path, token] of [['quote', g.link.token], ['booking', g.booking.token]]) assert.equal((await h.request(`/api/glove/public/${path}`, { as: '', headers: { authorization: `Bearer ${token}` } })).status, 404)
      await b.priyaPerson.run('visit.capture', g.notePayload, { commandId: g.noteCommandId, error: 'ERASED' })
      await b.priyaPerson.run('visit.capture', { visitId: g.visit.id, deviceTime: g.visit.startAt, kind: 'material', serviceId: g.material.serviceId, quantity: '2', description: g.material.description }, { commandId: g.material.id, error: 'ERASED' })
    }
    const stores = await tables(h), content = [JSON.stringify(stores), storedText(stores), JSON.stringify(await json('/api/glove/activity')), JSON.stringify(await json('/api/glove/export')), JSON.stringify(h.logs)]
    for (const value of secrets.filter(Boolean)) for (const text of content) assert.ok(!text.includes(value), `erased identifier absent from every table, Activity, export and captured logs: ${value}`)
    const erased = await h.state()
    for (const kind of ['enquiries', 'visits', 'captures', 'equipment', 'conversations', 'quotes', 'bookingOffers', 'serviceReports']) for (const g of graphs.slice(0, 2)) assert.ok(!erased[kind]?.some(r => [g.enquiry.id, g.visit.id, g.photo.id, g.note.id, g.unit.id, g.conversation.id, g.quote.id, g.booking.id].includes(r.id)))
  })
  await scenario(t, 'DATA-001 point 6: peer histories and anonymous financial dates, classifications, costs and tax totals stay exact while edits and unmerge are refused', async () => {
    const after = await h.state(), peer = graphs[2]
    assert.deepEqual(await json('/api/glove/reports/tax.json?from=2000-01-01&to=2099-01-01'), taxBefore, 'the public tax report retains exact anonymous classifications and totals')
    for (const [path, bytes] of [[`/api/glove/files/${peer.photo.file.fileId}`, jpeg], [`/api/glove/files/${peer.unit.photos[0].fileId}`, jpeg], [`/api/glove/files/${peer.signVisit.completion.signoff.signature.fileId}`, png], [peer.signedDoor, peer.signedBytes]]) {
      const response = await h.request(path)
      assert.equal(response.status, 200, 'the independent peer retains every original file door')
      assert.equal(Buffer.from(await response.arrayBuffer()).toString('base64'), bytes, 'the peer original remains byte-exact after erasure')
    }
    for (const kind of ['customers', 'sites', 'jobs', 'visits', 'captures', 'equipment', 'quotes', 'invoices', 'payments', 'expenses', 'conversations']) for (const row of before[kind].filter(r => r.id === peer.customer.id || r.customerId === peer.customer.id || r.siteId === peer.site.id || [peer.job.id, peer.signJob.id, peer.pending.id].includes(r.jobId))) assert.deepEqual(after[kind].find(r => r.id === row.id), row, `peer ${kind} stays unchanged`)
    for (const g of graphs.slice(0, 2)) {
      const oldInvoice = before.invoices.find(r => r.id === g.invoice.id), invoice = after.invoices.find(r => r.id === g.invoice.id)
      const financialCost = cost => ({ ...cost, actual: { ...cost.actual, materialEntries: cost.actual.materialEntries.map(({ captureId, description, ...money }) => money) } })
      assert.deepEqual(financialCost((await json(`/api/glove/jobs/${g.job.id}/cost`)).costing), financialCost(costsBefore.get(g.job.id)), 'the public job costing door retains exact estimate and actual costs')
      assert.deepEqual(after.captures.filter(r => r.jobId === g.job.id), [], 'no operational capture remains after erasure')
      assert.ok(!JSON.stringify(after.jobs.find(r => r.id === g.job.id)).includes(g.material.id), 'anonymous financial job data excludes the original capture identity')
      for (const key of ['number', 'createdAt', 'status', 'dates', 'issuedAt', 'dueAt']) assert.deepEqual(invoice[key], oldInvoice[key])
      assert.deepEqual(invoice.revisions.map(r => r.totals), oldInvoice.revisions.map(r => r.totals))
      assert.deepEqual(after.jobs.find(r => r.id === g.job.id).totals, before.jobs.find(r => r.id === g.job.id).totals)
      for (const p of [g.payment, g.refund]) for (const key of ['amount', 'kind', 'method', 'confirmedAt', 'effects', 'taxBreakdown']) assert.deepEqual(after.payments.find(r => r.id === p.id)[key], before.payments.find(r => r.id === p.id)[key])
      assert.equal(after.expenses.find(r => r.id === g.expense.id).amount, '12.00')
      assert.equal(after.customers.find(r => r.id === g.customer.id).name, 'Erased customer')
      assert.equal(after.sites.find(r => r.id === g.site.id).address, 'Erased address')
      for (const [type, payload] of [['customer.save', { ...g.customer, name: 'Resurrected' }], ['site.save', { ...g.site, address: 'Resurrected' }], ['quote.draft', { customerId: g.customer.id, siteId: g.site.id, title: 'Resurrected' }], ['invoice.prepare', { jobId: g.job.id }], ['booking.offer', { jobId: g.pending.id, slots: [] }]]) await h.command(type, payload, { error: 'ERASED' })
    }
    await h.command('customer.unmerge', { mergeId: merged.id, version: merged.version }, { error: 'NOT_FOUND' })
    assert.deepEqual(await h.state(), after, 'all attempts leave anonymous and peer records unchanged')
  })
  await scenario(t, 'DATA-001 point 7: the same erasure advances the Base redaction epoch and invalidates the pending archive transfer', async () => {
    assert.equal((await h.db.prepare('SELECT epoch FROM rer_portability_state WHERE id=1').first()).epoch, epoch.epoch + 1)
    assert.ok((await h.db.prepare('SELECT count(*) AS n FROM rer_portability_journal').first()).n > 0)
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM rer_portability_jobs').first()).n, 0)
    assert.equal((await h.db.prepare('SELECT count(*) AS n FROM rer_portability_parts').first()).n, 0)
  })
}
