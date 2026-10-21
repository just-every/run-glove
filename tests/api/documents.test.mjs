import { documentPhoto, documentLogo } from '../fixtures/document-images.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, completedJob, assertTrail } from './harness.mjs'
const png = documentPhoto
const photo = { mediaType: 'image/png', base64: png }

test('QUOTE-005 customer quote documents freeze branding, owner templates, line descriptions and only their scoped original images', async t => {
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
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE' })
  assert.equal((await read('')).status, 404)
  assert.equal((await read(`/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
  assert.equal((await h.request(`/api/glove/files/${quote.documentPhotos[0].file.fileId}`)).status, 404)
})

test('QUOTE-005 desk invoice and agreement projections use identity and descriptions without granting public or technician access', async t => {
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
})
