// BOOK-006 assessment visits on a request through the command, state, history
// and file doors: booked with conflict review, captured on the phone, completed,
// and carried into the quote drafted from the request.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote } from './harness.mjs'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('BOOK-006 a water-heater replacement assessed on site becomes a quote draft carrying its photos, notes and form', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const form = await h.command('form.save', { name: 'Water heater survey', questions: [{ id: 'gallons', label: 'Tank size (gallons)', type: 'reading', unit: 'gal', min: '20', max: '100', required: true }, { id: 'vent', label: 'Venting', type: 'choice', options: ['atmospheric', 'power vent'], required: true }] })
  const request = await b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, source: 'phone', description: 'Replace a leaking 50-gallon water heater' })

  // Priya already has a visit at 10:00; the assessment overlapping it waits for review.
  const other = await b.dispatcher.run('job.create', { quoteId: (await acceptedQuote(h, b)).id })
  await b.dispatcher.run('visit.book', { jobId: other.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:00', end: '11:00' })
  const book = acknowledge => b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:30', end: '11:30', instructions: 'Measure the closet and check the venting', formIds: [form.id], acknowledge }, acknowledge ? {} : { error: 'CONFLICT_REVIEW' })
  await b.office.run('assessment.book', { enquiryId: request.id, technicianId: b.priya.id, date: '2026-10-22', start: '10:30', end: '11:30' }, { error: 'FORBIDDEN' })
  const review = await book()
  const { job, visit } = await book(review.details.conflicts.map(c => c.code))
  assert.deepEqual([job.kind, job.lines, job.forms.map(f => f.name), visit.technicianId], ['assessment', [], ['Water heater survey'], b.priya.id])
  assert.equal((await h.state()).enquiries.find(e => e.id === request.id).assessmentJobId, job.id)
  await b.dispatcher.run('assessment.book', { enquiryId: request.id, technicianId: b.tom.id, date: '2026-10-23', start: '08:00', end: '09:00' }, { error: 'DUPLICATE' })

  // On the phone: arrival, two photos, a note and the form; then completion.
  const at = '2026-10-21T23:35:00Z', cap = payload => b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: at, ...payload })
  assert.ok((await b.priyaPerson.state()).visits.some(v => v.id === visit.id), 'the assessment is on the assessor\'s phone')
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: at })
  await cap({ kind: 'photo', photo: { mediaType: 'image/png', base64: png }, caption: 'Rusted tank base' })
  await cap({ kind: 'photo', photo: { mediaType: 'image/png', base64: png }, caption: 'Closet, 30 in wide' })
  await cap({ kind: 'note', text: 'Closet fits a 50-gallon; gas line needs a new shutoff' })
  await cap({ kind: 'form', formId: job.forms[0].id, answers: { gallons: '50', vent: 'atmospheric' } })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: at, summary: 'Assessed for replacement', signoff: { absentReason: 'Tenant let us in' } })
  let s = await h.state()
  assert.equal(s.jobs.find(j => j.id === job.id).status, 'assessed')
  await b.office.run('invoice.prepare', { jobId: job.id }, { error: 'JOB_STATE' })

  // The quote drafted from the request carries the photos, the note and the form results.
  const quote = await b.dispatcher.run('quote.draft', { enquiryId: request.id, title: 'Water heater replacement', lines: [{ description: '50-gallon gas water heater, installed', quantity: '1', unitPrice: '2450.00' }] })
  assert.deepEqual([quote.assessment.number, quote.assessment.photos.map(p => p.caption), quote.assessment.notes, quote.assessment.forms.map(f => [f.name, f.answers.map(a => [a.questionId, a.value])])], [job.number, ['Rusted tank base', 'Closet, 30 in wide'], ['Closet fits a 50-gallon; gas line needs a new shutoff'], [['Water heater survey', [['gallons', '50'], ['vent', 'atmospheric']]]]])
  assert.equal((await h.request(`/api/glove/files/${quote.assessment.photos[0].fileId}`, { as: b.dispatcher.cookie })).status, 200)

  // Linked on the request, the quote and the customer's property history.
  s = await h.state()
  assert.deepEqual([s.enquiries.find(e => e.id === request.id).assessmentJobId, s.quotes.find(q => q.id === quote.id).assessment.jobId], [job.id, job.id])
  const history = await (await h.request(`/api/glove/sites/${b.site.id}/history`, { as: b.office.cookie })).json()
  assert.ok(history.entries.some(e => e.kind === 'job' && e.label === `${job.number} Assessment: Replace a leaking 50-gallon water heater` && e.status === 'assessed'))
  assert.ok(history.entries.some(e => e.kind === 'quote' && e.id === quote.id))
})
