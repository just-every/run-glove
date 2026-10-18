// BOOK-003: requests carry their source and move through the pipeline; the
// office reads the aging board and conversion and revenue by source through
// the report door.
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business } from './harness.mjs'

test('BOOK-003 requests from four sources move through the pipeline into the conversion-by-source report', async (t) => {
  const h = await installation()
  t.after(() => h.close())
  const b = await business(h)
  const request = (source, description) => b.office.run('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description, source })
  const web = await request('website', 'Split system blowing warm air')
  const webIdle = await request('website', 'Price for a second unit')
  const google = await request('google', 'Annual service for three units')
  const angi = await request('angi', 'Replace ducted system')
  const referral = await request('referral', 'Referred by the clinic next door')
  assert.deepEqual([web.status, web.source], ['new', 'website'])
  await b.office.run('enquiry.create', { customerId: b.customer.id, description: 'x', source: 'billboard' }, { error: 'INPUT' })

  // Contacted, then quoted and won for two; one lost with its reason; one only contacted.
  const contacted = await b.office.run('enquiry.contact', { enquiryId: referral.id, version: referral.version, note: 'Left a voicemail' })
  assert.equal(contacted.status, 'contacted')
  await b.office.run('enquiry.contact', { enquiryId: referral.id, version: referral.version }, { error: 'STALE' })
  const win = async (enquiry, price) => {
    const quote = await b.dispatcher.run('quote.draft', { enquiryId: enquiry.id, title: enquiry.description, lines: [{ description: 'Split system service', quantity: '1', unitPrice: price, serviceId: b.service.id }] })
    const approved = await b.dispatcher.run('quote.approve', { quoteId: quote.id, version: quote.version, revision: 1 })
    return b.dispatcher.run('quote.accept', { quoteId: quote.id, version: approved.version, revision: 1, method: 'phone', customerName: 'Dr Mei Lin' })
  }
  await win(web, '189.00')
  const googleQuote = await win(google, '540.00')
  let s = await h.state()
  assert.equal(s.enquiries.find(e => e.id === web.id).status, 'won')
  const lostAngi = s.enquiries.find(e => e.id === angi.id)
  const lost = await b.office.run('enquiry.close', { enquiryId: angi.id, version: lostAngi.version, reason: 'Went with a cheaper quote' })
  assert.deepEqual([lost.status, lost.lostReason], ['lost', 'Went with a cheaper quote'])
  const won = s.enquiries.find(e => e.id === google.id)
  await b.office.run('enquiry.close', { enquiryId: google.id, version: won.version, reason: 'x' }, { error: 'ENQUIRY_STATE' })
  await b.dispatcher.run('quote.draft', { enquiryId: angi.id, title: 'x', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] }, { error: 'ENQUIRY_STATE' })

  // The Google job is done and invoiced, so its revenue counts as invoiced.
  const job = await b.dispatcher.run('job.create', { quoteId: googleQuote.id })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: '2026-10-20', start: '09:00', end: '10:00' })
  await b.priyaPerson.run('visit.arrive', { visitId: visit.id, deviceTime: '2026-10-19T22:04:00Z' })
  for (const item of job.checklist.filter(i => i.required)) await b.priyaPerson.run('visit.capture', { visitId: visit.id, deviceTime: '2026-10-19T22:10:00Z', kind: 'checklist', itemId: item.id, result: 'done' })
  await b.priyaPerson.run('visit.complete', { visitId: visit.id, deviceTime: '2026-10-19T23:00:00Z', summary: 'Serviced', signoff: { absentReason: 'Customer out' } })
  const inv = await b.office.run('invoice.prepare', { jobId: job.id })
  await b.office.run('invoice.approve', { invoiceId: inv.id, version: inv.version, revision: 1 })

  const res = await h.request('/api/glove/reports/sources', { as: b.office.cookie })
  assert.equal(res.status, 200)
  const report = await res.json()
  const bySource = Object.fromEntries(report.sources.map(r => [r.source, r]))
  assert.deepEqual(Object.keys(bySource).sort(), ['angi', 'google', 'referral', 'website'])
  assert.deepEqual(['requests', 'contacted', 'quoted', 'won', 'lost', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.website[k]), [2, 0, 1, 1, 0, '50.0', '207.90', '0.00'])
  assert.deepEqual(['requests', 'quoted', 'won', 'conversion', 'wonValue', 'invoiced'].map(k => bySource.google[k]), [1, 1, 1, '100.0', '594.00', '594.00'])
  assert.deepEqual(['requests', 'won', 'lost', 'conversion'].map(k => bySource.angi[k]), [1, 0, 1, '0.0'])
  assert.deepEqual(['requests', 'contacted', 'won'].map(k => bySource.referral[k]), [1, 1, 0])
  assert.deepEqual(report.total, { requests: 5, won: 2, conversion: '40.0', wonValue: '801.90', invoiced: '594.00' })
  const board = Object.fromEntries(report.pipeline.map(p => [p.stage, p.requests]))
  assert.deepEqual(Object.fromEntries(Object.entries(board).map(([k, v]) => [k, v.map(r => r.id)])), { new: [webIdle.id], contacted: [referral.id], quoted: [], won: [web.id, google.id], lost: [angi.id] })
  assert.equal(board.lost[0].lostReason, 'Went with a cheaper quote')
  assert.ok(Object.values(board).flat().every(r => r.ageDays === 0 && r.since), 'each request shows how long it has sat in its stage')
  assert.equal((await h.request('/api/glove/reports/sources', { as: b.priyaPerson.cookie })).status, 403, 'technicians never read revenue')
  s = await h.state()
  for (const kind of ['enquiry.created', 'enquiry.contacted', 'enquiry.won', 'enquiry.lost']) assert.ok(s.events.some(e => e.kind === kind), `timeline has ${kind}`)
})
