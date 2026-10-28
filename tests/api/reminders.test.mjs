import { connectMail, textOf } from '../fixtures/mail-providers.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { installation, business, acceptedQuote, assertTrail, mailEvents, postEvents } from './harness.mjs'
import { paidInvoice } from '../fixtures/payment-journey.mjs'

const templates = { confirmation: 'Booked {{customer}} on {{date}} at {{time}}.', moved: 'Moved to {{date}} at {{time}}.', cancelled: 'Cancelled {{date}}.', visitReminder: 'Bring access instructions for {{date}} at {{time}}.', paymentReminder: 'Please arrange {{amount}} for {{number}} due {{date}}.', quoteFollowup: 'Following up {{number}}: {{title}}, valid through {{date}}.' }
const day = (n = 0) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const at = (n, time = '10:00') => `${day(n)}T${time}:00.000Z`
const clock = (h, value) => h.request('/__test/clock', { method: 'POST', body: { at: value } })
const tick = async (h, value) => { await clock(h, value); await h.scheduled(value) }
async function setup(h, provider = 'sendgrid') {
  const b = await business(h, { currency: 'USD', timezone: 'UTC', address: '1400 Synthetic Street, Austin TX 78701' })
  const signer = mailEvents('sendgrid')
  if (provider === 'sendgrid') {
    await h.command('mail.connect', { provider: 'sendgrid', apiKey: 'synthetic-glove-1', eventKey: signer.eventKey, fromEmail: 'office@example.test' })
    return { b, signer }
  }
  const edge = await connectMail(h, provider)
  return { b, signer: { signed(rows) {
    assert.equal(rows.length, 1)
    const row = rows[0], sent = h.email.sent.findIndex(m => (m.body.Metadata?.glove_delivery_id ?? (m.body.EmailTags ? Buffer.from(m.body.EmailTags[0].Value, 'base64url').toString() : null)) === row.rer_delivery_id)
    return edge.callback({ id: row.rer_delivery_id, to: row.email, receipt: `${provider === 'postmark' ? 'pm' : 'ses'}-receipt-${sent + 1}` }, row.event === 'bounce' ? 'bounced' : 'delivered', new Date(row.timestamp * 1000).toISOString())
  } } }
}
async function configure(h, values = {}) {
  return h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true, templates, visitHours: [24, 2], paymentDays: [-1, 0, 3], quoteDays: [2, 5, 10], ...values })
}
async function consent(h, customerId, purpose, enabled = true) {
  const customer = (await h.state()).customers.find(c => c.id === customerId)
  return h.command('reminder.consent', { customerId, version: customer.version, purpose, enabled, reference: 'Customer asked the owner in person' })
}
const messages = (h, kind) => h.state().then(s => s.messages.filter(m => m.kind === kind && m.channel !== 'sms'))
const textMessages = (h, kind) => h.state().then(s => s.messages.filter(m => m.kind === kind && m.channel === 'sms' && m.direction === 'outbound'))
const postSms = async (h, request) => h.mf.dispatchFetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), body: await request.text() })
const body = textOf

async function connectSms(h, customerId, purpose) {
  const { accountSid, authToken, fromNumber } = h.twilio
  const connection = await h.command('sms.connect', { version: (await h.state()).business[0].version, provider: 'twilio', accountSid, authToken, fromNumber, registration: 'a2p10dlc', registered: true, live: true })
  assert.equal(connection.sms.enabled, false, 'a connection never enables outbound texts')
  await h.command('sms.configure', { version: connection.version, enabled: true, approved: true })
  let customer = (await h.state()).customers.find(c => c.id === customerId)
  customer = await h.command('customer.save', { ...customer, phone: '+13125550123' })
  await h.command('sms.consent', { customerId, version: customer.version, purpose, enabled: true, address: customer.phone, source: 'Customer asked the owner in person', wording: 'Send the requested service notices to this number; STOP ends them.', timezone: 'UTC' })
}

test('COMM-003, COMM-019, COMM-020 owner-approved email templates confirm and move visits including assessments, respect consent and quiet hours, and never replay an attempt', async t => {
  for (const provider of ['sendgrid', 'postmark', 'ses']) {
  const h = await installation(); t.after(() => h.close())
  const { b, signer } = await setup(h, provider)
  await clock(h, at(0))
  await b.office.run('reminder.configure', { enabled: false }, { error: 'FORBIDDEN' })
  await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: true, approved: false }, { error: 'CONSENT' })
  const preview = await h.command('reminder.preview', { templates })
  assert.match(preview.visitReminder, /stop automatic emails/)
  assert.equal((await h.state()).business[0].messageAutomation, undefined)
  const policy = await configure(h)
  assert.equal(policy.preview.visitReminder, `Bring access instructions for 2026-11-01 at 10:00.\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
  await h.command('reminder.configure', { version: policy.version, enabled: true, approved: true, templates: { ...templates, visitReminder: '{{secret}}' }, visitHours: [24], paymentDays: [], quoteDays: [] }, { error: 'INPUT' })
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Service visit' })
  let visit = await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(2), start: '10:00', end: '11:00' })
  await tick(h, at(0))
  assert.equal(h.email.sent.length, 0, 'a recorded address alone never consents')
  await consent(h, b.customer.id, 'visits')
  await tick(h, at(0, '19:00'))
  assert.equal(h.email.sent.length, 0, 'quiet hours hold confirmations')
  await tick(h, at(1, '08:00'))
  assert.equal(h.email.sent.length, 1)
  assert.equal(body(h.email.sent[0]), `Booked Harbourview Dental on ${day(2)} at 10:00 (UTC).\n\nHarbour Air & Electrical\n1400 Synthetic Street, Austin TX 78701\nContact the office to confirm, reschedule, or stop automatic emails. Replies are handled by the office.`)
  await Promise.all([h.scheduled(at(1, '10:00')), h.scheduled(at(1, '10:00'))])
  assert.equal((await messages(h, 'visitReminder')).length, 1)
  assert.match(body(h.email.sent.at(-1)), /Bring access instructions/)
  await tick(h, at(2, '08:00'))
  assert.equal((await messages(h, 'visitReminder')).length, 2)
  await tick(h, at(2, '08:00'))
  assert.equal(h.email.sent.length, 3, 'replaying cron does not resend')
  visit = (await h.state()).visits.find(v => v.id === visit.id)
  await b.office.run('visit.replyLink', { visitId: visit.id, version: visit.version }, { error: 'FORBIDDEN' })
  const replyId = 'synthetic-glove-visit-reply-1'
  const issued = await h.command('visit.replyLink', { visitId: visit.id, version: visit.version }, { commandId: replyId })
  const replyToken = /#token=(glv_[A-Za-z0-9_-]{43})/.exec(body(h.email.sent.at(-1)))[1]
  const publicReply = (method = 'GET', value, token = replyToken) => h.request('/api/glove/public/visit-response', { as: '', method, headers: { authorization: `Bearer ${token}` }, ...(value ? { body: value } : {}) })
  const visibleVisit = await (await publicReply()).json()
  assert.deepEqual([visibleVisit.visit.date, visibleVisit.visit.start], [visit.local.date, visit.local.start])
  assert.ok(!JSON.stringify(visibleVisit).includes(b.customer.email))
  assert.ok(!JSON.stringify(visibleVisit).includes(b.site.address))
  const requestReply = await publicReply('POST', { action: 'reschedule' })
  assert.equal(requestReply.status, 200, await requestReply.clone().text())
  assert.equal((await publicReply('POST', { action: 'reschedule' })).status, 200)
  assert.equal((await publicReply('POST', { action: 'confirm' })).status, 409)
  const responded = await h.state(), requested = responded.enquiries.filter(e => e.visitId === visit.id && e.jobId === job.id)
  assert.equal(requested.length, 1, 'a replay opens no duplicate reschedule request')
  assert.equal(requested[0].status, 'new')
  assert.equal(responded.visits.find(v => v.id === visit.id).startAt, visit.startAt, 'a request never changes the booking')
  assert.ok(responded.events.some(e => e.kind === 'visit.customer.reschedule' && e.jobId === job.id))
  assert.ok(!JSON.stringify(await (await h.request('/api/glove/export')).json()).includes(replyToken))
  assert.deepEqual(await h.command('visit.replyLink', { visitId: visit.id, version: visit.version }, { commandId: replyId }), issued, 'recovery never sends another link')
  visit = (await h.state()).visits.find(v => v.id === visit.id)
  visit = await h.command('visit.change', { visitId: visit.id, version: visit.version, date: day(3), start: '12:00', end: '13:00', reason: 'Customer requested tomorrow' })
  await tick(h, at(2, '08:30'))
  assert.equal((await messages(h, 'moved')).length, 1)
  assert.equal((await publicReply()).status, 404, 'a changed schedule invalidates the old response credential')
  await h.command('visit.cancel', { visitId: visit.id, version: visit.version, reason: 'Customer cancelled' })
  await tick(h, at(2, '09:00'))
  assert.equal((await messages(h, 'cancelled')).length, 1)
  const count = h.email.sent.length
  await tick(h, at(3, '10:00'))
  assert.equal(h.email.sent.length, count, 'cancelled visit has no later reminders')
  const enquiry = await h.command('enquiry.create', { customerId: b.customer.id, siteId: b.site.id, description: 'Assess heater' })
  const assessment = await h.command('assessment.book', { enquiryId: enquiry.id, technicianId: b.priya.id, date: day(4), start: '11:00', end: '12:00' })
  await tick(h, at(3, '10:00'))
  assert.equal((await messages(h, 'confirmation')).length, 2)
  const first = (await messages(h, 'confirmation'))[0]
  const timestamp = Math.floor(new Date(at(3, '10:00')).getTime() / 1000)
  const delivery = [{ email: first.to, timestamp, event: 'delivered', sg_event_id: 'synthetic-glove-event', sg_message_id: 'sg-receipt-1.filter', rer_delivery_id: first.id }]
  assert.equal((await postEvents(h, { raw: JSON.stringify(delivery), headers: {} })).status, 401)
  assert.equal((await postEvents(h, signer.signed(delivery, { at: timestamp }))).status, 200)
  assert.equal((await h.state()).messageStates[first.id].status, 'delivered')
  let assessmentVisit = (await h.state()).visits.find(v => v.id === assessment.visit.id)
  await h.command('visit.replyLink', { visitId: assessmentVisit.id, version: assessmentVisit.version })
  const confirmToken = /#token=(glv_[A-Za-z0-9_-]{43})/.exec(body(h.email.sent.at(-1)))[1]
  assert.equal((await publicReply('POST', { action: 'confirm' }, confirmToken)).status, 200)
  assessmentVisit = (await h.state()).visits.find(v => v.id === assessmentVisit.id)
  assert.equal(assessmentVisit.customerResponses[0].action, 'confirm')
  await consent(h, b.customer.id, 'visits', false)
  assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404, 'withdrawal closes the reply door immediately')
  await tick(h, at(4, '09:00'))
  assert.equal(h.email.sent.length, count + 2, 'withdrawal suppresses assessment reminder')
  await consent(h, b.customer.id, 'visits')
  await configure(h, { templates: { ...templates, reportReady: 'Completed {{title}} on {{date}}: your report is ready.' } })
  const reportVisit = await h.command('visit.book', { jobId: job.id, technicianId: b.tom.id, date: day(5), start: '12:00', end: '13:00' })
  await b.tomPerson.run('visit.arrive', { visitId: reportVisit.id, deviceTime: at(5, '12:00') })
  await b.tomPerson.run('visit.complete', { visitId: reportVisit.id, deviceTime: at(5, '13:00'), summary: 'synthetic-glove-2 completed work', signoff: { absentReason: 'Customer away' } })
  const report = (await h.state()).serviceReports.find(r => r.visitId === reportVisit.id)
  await b.office.run('report.link', { reportId: report.id, email: true }, { error: 'FORBIDDEN' })
  const reportPayload = { reportId: report.id, email: true }, reportCommand = 'synthetic-glove-report-email-1'
  const reportLink = await h.command('report.link', reportPayload, { commandId: reportCommand })
  assert.equal(reportLink.token, undefined, 'an emailed report credential is not exposed in the command response')
  const reportMail = h.email.sent.at(-1), reportToken = /#token=(glr_[A-Za-z0-9_-]{43})/.exec(body(reportMail))[1]
  assert.ok(body(reportMail).startsWith(`Completed Service visit on ${day(5)}: your report is ready.`))
  assert.match(body(reportMail), /stop automatic emails/)
  const receivedReport = await h.request('/api/glove/public/reports', { as: '', headers: { authorization: `Bearer ${reportToken}` } })
  assert.equal(receivedReport.status, 200)
  assert.equal((await receivedReport.json()).report.summary, 'synthetic-glove-2 completed work')
  const sentCount = h.email.sent.length
  assert.deepEqual(await h.command('report.link', reportPayload, { commandId: reportCommand }), reportLink)
  assert.equal(h.email.sent.length, sentCount)
  const reportMessage = (await messages(h, 'reportReady'))[0]
  assert.equal((await h.state()).messageStates[reportMessage.id].status, 'accepted')
  const reportEvent = [{ email: reportMessage.to, timestamp: Math.floor(new Date(at(4, '09:00')).getTime() / 1000), event: 'delivered', sg_event_id: 'synthetic-glove-report-event', sg_message_id: (await h.state()).messageStates[reportMessage.id].providerMessageId, rer_delivery_id: reportMessage.id }]
  assert.equal((await postEvents(h, signer.signed(reportEvent, { at: reportEvent[0].timestamp }))).status, 200)
  const reportTimeline = (await (await h.request(`/api/glove/jobs/${job.id}/timeline`)).json()).events
  assert.ok(reportTimeline.some(e => e.kind === 'email.delivered' && e.subjectId === reportMessage.id))
  const reportStream = (await (await h.request(`/api/glove/conversation?jobId=${job.id}`)).json()).entries
  assert.ok(reportStream.some(e => e.id === `email:${reportMessage.id}` && /delivered/i.test(e.delivery)))
  const privateExport = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(privateExport).includes(reportToken))
  assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered' && e.subject_id === reportMessage.id))
  await assertTrail(h, ['visit.replyLink.sent', 'visit.customer.reschedule', 'visit.customer.confirm', 'report.link.created', 'email.accepted'])
  await clock(h, at(5, '14:00'))
  await connectSms(h, b.customer.id, 'visits')
  const smsJob = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Synthetic text-confirmed tune-up' })
  let smsVisit = await h.command('visit.book', { jobId: smsJob.id, technicianId: b.priya.id, date: day(6), start: '12:00', end: '13:00' })
  await tick(h, at(5, '19:00'))
  assert.equal(h.twilio.calls.length, 0, 'customer-local quiet hours hold customer texts')
  let zonedCustomer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('sms.consent', { customerId: zonedCustomer.id, version: zonedCustomer.version, purpose: 'visits', enabled: true, address: zonedCustomer.phone, source: 'Customer confirmed time zone', wording: 'Send my requested visit notices.', timezone: ['America', 'Los_Angeles'].join('/') })
  await tick(h, at(5, '14:00'))
  assert.equal(h.twilio.calls.length, 0, '07:00 in the recorded customer zone stays quiet even while the UTC branch is open')
  zonedCustomer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('sms.consent', { customerId: zonedCustomer.id, version: zonedCustomer.version, purpose: 'visits', enabled: true, address: zonedCustomer.phone, source: 'Customer corrected time zone', wording: 'Send my requested visit notices.', timezone: 'UTC' })
  await tick(h, at(5, '14:00'))
  const confirmations = await textMessages(h, 'confirmation')
  assert.equal(confirmations.length, 1)
  const firstText = h.twilio.calls.find(c => c.body?.Body?.startsWith('Booked '))
  assert.equal(firstText.body.Body, `Booked Harbourview Dental on ${day(6)} at 12:00 (UTC).\n\nHarbour Air & Electrical\nReply CONFIRM to confirm or RESCHEDULE to ask the office for another time.\nReply STOP to stop texts, HELP for help, START to request texts again.`)
  const textCount = h.twilio.calls.length
  await tick(h, at(5, '14:00')); assert.equal(h.twilio.calls.length, textCount)
  const sid = [...h.twilio.messages.values()].find(m => m.body === firstText.body.Body).sid
  const delivered = h.twilio.delivery(sid)
  const invalidDelivery = new Request(delivered.clone(), { headers: { ...Object.fromEntries(delivered.headers), 'x-twilio-signature': 'synthetic-glove-invalid' } })
  const eventsBefore = (await h.state()).events.length
  assert.equal((await postSms(h, invalidDelivery)).status, 401)
  assert.equal((await h.state()).events.length, eventsBefore, 'unauthenticated text callbacks write no business fact')
  assert.equal((await postSms(h, delivered.clone())).status, 200)
  assert.equal((await postSms(h, delivered.clone())).status, 200)
  assert.equal((await h.state()).messageStates[confirmations[0].id].status, 'delivered')
  const otherText = [...h.twilio.messages.values()].find(m => m.sid !== sid)
  assert.ok(otherText, 'the due reminder is a separate text attempt')
  const failed = h.twilio.delivery(otherText.sid, 'failed', { ErrorCode: '30003' })
  assert.equal((await postSms(h, failed.clone())).status, 200)
  assert.equal((await postSms(h, failed.clone())).status, 200)
  const failedMessage = (await h.state()).messages.find(m => m.channel === 'sms' && m.direction === 'outbound' && m.id !== confirmations[0].id)
  assert.equal((await h.state()).messageStates[failedMessage.id].status, 'failed')
  const textStream = (await (await h.request(`/api/glove/conversation?jobId=${smsJob.id}`)).json()).entries
  assert.ok(textStream.some(e => e.channel === 'text message' && e.direction === 'outbound' && e.author && /delivered/i.test(e.delivery)))
  const reschedule = h.twilio.inbound(h.origin, '+13125550123', 'reschedule')
  assert.equal((await postSms(h, reschedule.clone())).status, 200)
  assert.equal((await postSms(h, reschedule.clone())).status, 200)
  const smsState = await h.state()
  assert.equal(smsState.enquiries.filter(e => e.visitId === smsVisit.id && e.source === 'text').length, 1)
  assert.equal(smsState.visits.find(v => v.id === smsVisit.id).startAt, smsVisit.startAt)
  const replyStream = (await (await h.request(`/api/glove/conversation?jobId=${smsJob.id}`)).json()).entries
  assert.ok(replyStream.some(e => e.channel === 'text message' && e.direction === 'inbound' && e.jobId === smsJob.id && e.kind === 'text reply: reschedule' && e.author))
  const stop = h.twilio.inbound(h.origin, '+13125550123', 'STOP')
  assert.equal((await postSms(h, stop.clone())).status, 200)
  assert.equal((await postSms(h, stop.clone())).status, 200)
  const stoppedCustomer = (await h.state()).customers.find(c => c.id === b.customer.id)
  assert.equal(stoppedCustomer.smsOptOut.blocked, true)
  assert.equal(stoppedCustomer.automaticSms.visits.enabled, false)
  const beforeStoppedTick = h.twilio.calls.length
  await tick(h, at(6, '10:00'))
  assert.equal(h.twilio.calls.length, beforeStoppedTick)
  await h.command('marketing.connect', { provider: 'mango', key: 'synthetic-glove-8', url: 'https://mango.example.test' })
  const segment = await h.command('segment.save', { name: 'Synthetic opted-out customers', filter: {} })
  const pushed = await h.command('segment.push', { segmentId: segment.id, provider: 'mango' })
  assert.equal(pushed.skippedDoNotContact, 1)
  assert.equal(h.marketing.length, 0)
  assert.equal((await postSms(h, h.twilio.inbound(h.origin, '+13125550123', 'START'))).status, 200)
  const restarted = (await h.state()).customers.find(c => c.id === b.customer.id)
  assert.equal(restarted.smsOptOut.blocked, false)
  assert.equal(restarted.automaticSms.visits.enabled, false, 'START never manufactures fresh purpose consent')
  const { exported: smsExport } = await assertTrail(h, ['sms.queued', 'sms.accepted', 'sms.delivered', 'sms.failed', 'sms.received.reschedule', 'sms.received.stop', 'sms.received.start'])
  assert.ok(smsExport.timeline.some(e => e.kind === 'sms.delivered'))
  assert.ok(smsExport.timeline.some(e => e.kind === 'visit.customer.reschedule'))
  assert.ok(!JSON.stringify(smsExport).includes(h.twilio.authToken))
  const privacyCustomer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const privacyPreview = await h.command('privacy.preview', { customerId: privacyCustomer.id, version: privacyCustomer.version })
  await h.command('privacy.erase', { customerId: privacyCustomer.id, version: privacyCustomer.version, confirm: 'ERASE', fingerprint: privacyPreview.fingerprint })
  assert.equal((await publicReply('GET', undefined, confirmToken)).status, 404)
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_visit_reply_secrets').first()).n, 0)
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
  assert.equal((await h.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
  assert.equal((await h.request('/api/glove/public/reports', { as: '', headers: { authorization: `Bearer ${reportToken}` } })).status, 404)
  assert.ok(privateExport.timeline.some(e => e.kind === 'email.delivered'))
  }
  await automaticEmailRefusals(t)
})

test('PAY-005 due-date reminders stop after payment or dispute and aging exposes their actual state', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  const first = await paidInvoice(h, b, day(0)), second = await paidInvoice(h, b, day(1))
  await configure(h, { visitHours: [], quoteDays: [], paymentDays: [-14, -13, -12] })
  await consent(h, b.customer.id, 'payments')
  await tick(h, at(0))
  assert.equal(h.email.sent.length, 2)
  assert.ok(h.email.sent.every(m => !/https?:|checkout|token=/i.test(body(m))), 'no checkout link or stored session reused')
  let inv = (await h.state()).invoices.find(i => i.id === first.id)
  await b.office.run('payment.record', { invoiceId: inv.id, version: inv.version, amount: inv.revisions.at(-1).totals.total, method: 'cash', reference: 'Paid in person' })
  await tick(h, at(1))
  assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === first.id).length, 1)
  assert.equal((await messages(h, 'paymentReminder')).filter(m => m.subjectId === second.id).length, 2)
  const report = await h.request(`/api/glove/reports/receivables.json?asOf=${day(1)}`).then(r => r.json())
  assert.match(JSON.stringify(report), /2 reminder steps reserved/)
  inv = (await h.state()).invoices.find(i => i.id === second.id)
  await b.office.run('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Question about work' }, { error: 'FORBIDDEN' })
  await h.command('invoice.dispute', { invoiceId: inv.id, version: inv.version, disputed: true, reason: 'Customer disputes the work' })
  await tick(h, at(2))
  assert.equal(h.email.sent.length, 3)
  const disputed = await h.request(`/api/glove/reports/receivables.json?asOf=${day(2)}`).then(r => r.json())
  assert.match(JSON.stringify(disputed), /Stopped: invoice disputed/)
  await assertTrail(h, ['invoice.dispute', 'email.queued', 'email.accepted'])
})

test('QUOTE-004 three quote sequences stop on day-three answer and day-seven expiry without reusing customer links', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [], paymentDays: [], quoteCallDays: [2, 5, 10], quoteTextDays: [2, 5, 10] })
  await connectSms(h, b.customer.id, 'quotes')
  await consent(h, b.customer.id, 'quotes')
  const quotes = []
  for (let n = 0; n < 3; n++) {
    let q = await h.command('quote.draft', { customerId: b.customer.id, siteId: b.site.id, title: `Service ${n}`, lines: [{ description: 'Repair', quantity: '1', unitPrice: '100.00' }], validUntil: day(n === 2 ? 7 : 30) })
    q = await h.command('quote.approve', { quoteId: q.id, version: q.version, revision: 1 })
    q = await h.command('quote.markSent', { quoteId: q.id, version: q.version, revision: 1, channel: 'email' })
    quotes.push(q)
  }
  await tick(h, at(1)); assert.equal(h.email.sent.length, 0)
  await tick(h, at(2)); assert.equal(h.email.sent.length, 3)
  await clock(h, at(3))
  const answering = (await h.state()).quotes.find(q => q.id === quotes[1].id)
  await h.command('quote.decline', { quoteId: answering.id, version: answering.version, revision: 1, method: 'phone', customerName: 'Customer', reason: 'No longer needed' })
  await tick(h, at(5)); assert.equal(h.email.sent.length, 5)
  await tick(h, at(10)); assert.equal(h.email.sent.length, 6)
  await tick(h, at(10)); assert.equal(h.email.sent.length, 6)
  await clock(h, at(5)) // Return to the live session after the day-ten scheduler observation.
  const sent = await messages(h, 'quoteFollowup')
  assert.deepEqual(quotes.map(q => sent.filter(m => m.subjectId === q.id).length), [3, 1, 2])
  const textSteps = await textMessages(h, 'quoteFollowup')
  assert.deepEqual(quotes.map(q => textSteps.filter(m => m.subjectId === q.id).length), [3, 1, 2])
  assert.ok(h.twilio.calls.every(c => !c.body || c.body.Body.endsWith('Reply STOP to stop texts, HELP for help, START to request texts again.')))
  const taskQuotes = (await h.state()).quotes
  assert.deepEqual(quotes.map(q => taskQuotes.find(r => r.id === q.id).followupTasks.length), [3, 1, 2])
  assert.ok(taskQuotes.find(q => q.id === quotes[1].id).followupTasks.every(t => t.status === 'stopped'))
  assert.ok(taskQuotes.find(q => q.id === quotes[2].id).followupTasks.every(t => t.status === 'stopped'))
  assert.ok((await h.state()).events.some(e => e.kind === 'quote.followupTask'))
  assert.ok(h.email.sent.every(m => /\/email-preferences#token=gle_/.test(body(m)) && body(m).includes('1400 Synthetic Street, Austin TX 78701') && !body(m).includes('/quote#token=')), 'each quote follow-up has the mandatory unsubscribe link and postal address, never a quote bearer')
  const stopToken = /#token=(gle_[A-Za-z0-9_-]{43})/.exec(body(h.email.sent[0]))[1]
  const preference = (method = 'GET', value) => h.request('/api/glove/public/email-preferences', { as: '', method, headers: { authorization: `Bearer ${stopToken}` }, ...(value ? { body: value } : {}) })
  const beforeRead = (await h.state()).events.length
  assert.equal((await preference()).status, 200)
  assert.equal((await h.state()).events.length, beforeRead, 'opening an unsubscribe link never changes consent')
  const withdrawal = await preference('POST', { stop: true })
  assert.equal(withdrawal.status, 200, await withdrawal.clone().text())
  assert.equal((await preference('POST', { stop: true })).status, 200)
  assert.equal((await h.state()).customers.find(c => c.id === b.customer.id).automaticEmail.quotes.enabled, false)
  await configure(h, { visitHours: [], paymentDays: [], quoteDays: [20], quoteCallDays: [], quoteTextDays: [] })
  await tick(h, at(20)); assert.equal(h.email.sent.length, 6, 'withdrawal stops a later still-valid unanswered quote step')
  await tick(h, at(31))
  await clock(h, at(5))
  assert.ok((await h.state()).quotes.find(q => q.id === quotes[0].id).followupTasks.every(t => t.status === 'stopped'), 'expiry retires pending call tasks even when no new message is due')
  // Erasure retires both queued intents and receipts through the existing customer door.
  const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
  await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(exported).includes(customer.email))
  await tick(h, at(11)); assert.equal(h.email.sent.length, 6)
})

async function automaticEmailRefusals(t) {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [24], paymentDays: [], quoteDays: [] })
  await consent(h, b.customer.id, 'visits')
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Access visit' })
  await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(2), start: '12:00', end: '13:00' })
  let customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  customer = await h.command('customer.save', { ...customer, email: 'changed@example.test' })
  await tick(h, at(0)); assert.equal(h.email.sent.length, 0, 'consent is bound to the recorded address')
  await consent(h, b.customer.id, 'visits')
  h.email.status['changed@example.test'] = 500
  await tick(h, at(0)); assert.equal(h.email.sent.length, 1)
  const queued = (await messages(h, 'confirmation'))[0]
  assert.equal((await h.state()).messageStates[queued.id].status, 'uncertain')
  await tick(h, at(0)); assert.equal(h.email.sent.length, 1, 'an uncertain send stays uncertain')
  await h.command('reminder.configure', { version: (await h.state()).business[0].version, enabled: false })
  await tick(h, at(1, '12:00')); assert.equal(h.email.sent.length, 1, 'owner switch stops the pending reminder')
}


test('Erasure during an automatic provider attempt never restores recipient addresses in the outcome', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b } = await setup(h)
  await clock(h, at(0))
  await configure(h, { visitHours: [], paymentDays: [], quoteDays: [] })
  await consent(h, b.customer.id, 'visits')
  const job = await h.command('job.create', { customerId: b.customer.id, siteId: b.site.id, title: 'Visit with pending provider reply' })
  await h.command('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day(1), start: '12:00', end: '13:00' })
  let release, entered
  const pending = new Promise(resolve => { release = resolve })
  const started = new Promise(resolve => { entered = resolve })
  h.email.beforeRespond = () => { entered(); return pending }
  const run = h.scheduled(at(0))
  try {
    await started
    const customer = (await h.state()).customers.find(c => c.id === b.customer.id)
    const preview = await h.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await h.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  } finally { release(); await run }
  assert.equal(h.email.sent.length, 1, 'the already-started provider request cannot be recalled')
  const exported = await h.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(exported).includes(b.customer.email), 'provider response does not restore an erased address')
  assert.equal((await h.state()).messages.length, 0)
  const sms = await installation(); t.after(() => sms.close()); const { b: textBusiness } = await setup(sms)
  await clock(sms, at(0)); await configure(sms, { visitHours: [], paymentDays: [], quoteDays: [] })
  await connectSms(sms, textBusiness.customer.id, 'visits')
  const smsJob = await sms.command('job.create', { customerId: textBusiness.customer.id, siteId: textBusiness.site.id, title: 'Text with pending provider reply' })
  await sms.command('visit.book', { jobId: smsJob.id, technicianId: textBusiness.priya.id, date: day(1), start: '12:00', end: '13:00' })
  let finishText, textEntered
  const textPending = new Promise(resolve => { finishText = resolve }), textStarted = new Promise(resolve => { textEntered = resolve })
  sms.twilio.beforeRespond = () => { textEntered(); return textPending }
  const textRun = sms.scheduled(at(0))
  try {
    await textStarted
    const customer = (await sms.state()).customers.find(c => c.id === textBusiness.customer.id)
    const preview = await sms.command('privacy.preview', { customerId: customer.id, version: customer.version })
    await sms.command('privacy.erase', { customerId: customer.id, version: customer.version, confirm: 'ERASE', fingerprint: preview.fingerprint })
  } finally { finishText(); await textRun }
  const smsExport = await sms.request('/api/glove/export').then(r => r.json())
  assert.ok(!JSON.stringify(smsExport).includes('+13125550123'))
  assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_attempts').first()).n, 0)
  assert.equal((await sms.db.prepare('SELECT COUNT(*) AS n FROM glove_sms_receipts').first()).n, 0)
  assert.equal((await sms.state()).messages.length, 0)
  const lateDelivery = sms.twilio.delivery([...sms.twilio.messages.keys()][0])
  assert.equal((await postSms(sms, lateDelivery)).status, 200)
  assert.equal((await sms.state()).messages.length, 0, 'a late signed callback never restores an erased SMS message')
})

import { smsInboxFlow } from './sms-inbox-flow.mjs'
test('The desk explicitly retains, assigns and answers a customer text on its job; STOP and role withdrawal close the send door', smsInboxFlow)

import { visitStatusFlow } from './visit-status-flow.mjs'
test('COMM-004, COMM-021 owner-approved tap sends first name, photo and live ETA; arrival and completion follow owner settings once', visitStatusFlow)


test('COMM-008, COMM-026, COMM-027 explicit uniform email requests require completed paid jobs, current consent and a per-customer period', async t => {
  const h = await installation(); t.after(() => h.close())
  const { b, signer } = await setup(h)
  const fixed = '2025-11-04T12:00:00.000Z'
  await clock(h, fixed)
  const confirmation = async () => {
    const state = await h.state(), current = state.customers.find(c => c.id === b.customer.id)
    return { businessVersion: state.business[0].version, customerVersion: current.version, address: current.email }
  }
  const request = async jobId => h.command('review.request', { jobId, confirmation: await confirmation() })
  const config = { enabled: true, approved: true, trigger: 'payment', periodDays: 30, postalAddress: '1600 Synthetic Street, Austin TX 78701', template: 'Please share your experience with our service.', url: 'https://g.page/r/synthetic-glove-1/review' }
  await b.office.run('review.configure', { ...config, version: (await h.state()).business[0].version }, { error: 'FORBIDDEN' })
  await h.command('review.configure', { ...config, version: (await h.state()).business[0].version })
  assert.equal((await h.state()).business[0].address, config.postalAddress)
  let customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await b.office.run('review.consent', { customerId: customer.id, version: customer.version, enabled: true, reference: 'Unauthorized permission' }, { error: 'FORBIDDEN' })
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, reference: 'Explicit in-person permission for review email' })
  const first = await paidInvoice(h, b, '2025-11-04'), second = await paidInvoice(h, b, '2025-11-05')
  assert.equal((await request(first.jobId)).sent, false, 'Unpaid job is never asked')
  for (const invoice of [first, second]) {
    const current = (await h.state()).invoices.find(i => i.id === invoice.id)
    await b.office.run('payment.record', { invoiceId: current.id, version: current.version, amount: current.revisions.at(-1).totals.total, method: 'cash', reference: 'synthetic-glove-801' })
  }
  assert.equal(h.email.sent.length, 0, 'No automatic outbound action')
  assert.deepEqual((await h.state()).reviewJobs.filter(j => [first.jobId, second.jobId].includes(j.id)).map(j => ({ workReady: j.workReady, reason: j.reason })), [{ workReady: true, reason: null }, { workReady: true, reason: null }])
  const unfinished = await h.command('job.create', { quoteId: (await acceptedQuote(h, b, 'Unfinished installation')).id })
  await h.command('visit.book', { jobId: unfinished.id, technicianId: b.priya.id, date: '2025-11-06', start: '09:00', end: '10:00' })
  let progress = await b.office.run('invoice.prepare', { jobId: unfinished.id, progress: { name: 'First stage', final: false }, lines: [{ description: 'First stage', quantity: '1', unitPrice: '60.00', tax: 'FREE' }] })
  progress = await b.office.run('invoice.approve', { invoiceId: progress.id, version: progress.version, revision: 1 })
  await b.office.run('payment.record', { invoiceId: progress.id, version: progress.version, amount: '60.00', method: 'cash', reference: 'synthetic-glove-806' })
  assert.deepEqual((await h.state()).reviewJobs.find(j => j.id === unfinished.id), { id: unfinished.id, workReady: false, reason: 'job must be complete and paid' })
  assert.equal((await request(unfinished.id)).reason, 'job must be complete and paid', 'A paid progress invoice does not make unfinished work eligible')
  await h.command('review.configure', { version: (await h.state()).business[0].version, enabled: false })
  assert.equal((await request(first.jobId)).reason, 'disabled')
  await h.command('review.configure', { ...config, version: (await h.state()).business[0].version })
  const beforeConfirmation = h.email.sent.length
  await h.command('review.request', { jobId: first.jobId }, { error: 'STALE' })
  let confirmed = await confirmation()
  await h.command('review.configure', { ...config, template: 'Please share your experience with our whole team.', version: confirmed.businessVersion })
  await h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
  await h.command('review.configure', { ...config, version: (await h.state()).business[0].version })
  confirmed = await confirmation()
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, address: customer.email, reference: 'Customer renewed the recorded permission' })
  await h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
  confirmed = await confirmation()
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('customer.save', { ...customer, email: ['confirmation-review', 'example.test'].join('@') })
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, address: customer.email, reference: 'Permission for the replacement address' })
  await h.command('review.request', { jobId: first.jobId, confirmation: confirmed }, { error: 'STALE' })
  confirmed = await confirmation()
  await h.command('review.request', { jobId: first.jobId, confirmation: { ...confirmed, address: b.customer.email } }, { error: 'STALE' })
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('customer.save', { ...customer, email: b.customer.email })
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, address: customer.email, reference: 'Explicit in-person permission for review email' })
  assert.equal(h.email.sent.length, beforeConfirmation, 'Stale or absent confirmation never reaches the provider')
  assert.equal((await messages(h, 'reviewRequest')).length, 0, 'Stale confirmation creates no message and consumes no customer period')
  const sent = await request(first.jobId)
  assert.equal(sent.sent, true)
  assert.equal((await request(second.jobId)).reason, 'period already requested')
  assert.equal(h.email.sent.length, 1)
  assert.equal((await h.state()).reviewJobs.find(j => j.id === second.jobId).reason, 'period already requested')
  const deliveredText = body(h.email.sent[0])
  assert.ok(deliveredText.startsWith(config.template + '\n' + config.url))
  assert.match(deliveredText, /Stop review requests/)
  assert.ok(deliveredText.includes(config.postalAddress))
  const token = /#token=(gle_[A-Za-z0-9_-]+)/.exec(deliveredText)[1]
  const message = (await messages(h, 'reviewRequest'))[0]
  assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: message.id, email: message.to, event: 'delivered', timestamp: Date.parse(fixed) / 1000, sg_event_id: 'synthetic-glove-802', sg_message_id: 'sg-receipt-1.filter' }], { at: Date.parse(fixed) / 1000 }))).status, 200)
  const { activity: reviewActivity, exported: reviewExport } = await assertTrail(h, ['review.configure', 'review.consent', 'review.skipped', 'email.queued', 'email.accepted', 'email.delivered'])
  assert.ok(reviewActivity.find(e => e.kind === 'review.consent').actorRole === 'owner')
  assert.equal(reviewExport.customers.find(c => c.id === customer.id).automaticEmail.reviews.reference, 'Explicit in-person permission for review email')
  assert.equal(reviewExport.customers.find(c => c.id === customer.id).automaticEmail.reviews.at, fixed)
  const jobHistory = await (await h.request(`/api/glove/jobs/${first.jobId}/timeline`)).text()
  assert.ok(jobHistory.includes(message.id) && jobHistory.includes('email.delivered'))
  assert.equal((await h.state()).messageStates[message.id].status, 'delivered')
  const customerHistory = await (await h.request(`/api/glove/sites/${b.site.id}/history`)).text()
  assert.ok(customerHistory.includes(message.id) && /delivered/i.test(customerHistory))
  // Provider references are retained in the export and authenticated message state.
  const exported = await (await h.request('/api/glove/export')).text()
  assert.ok(exported.includes(message.id))
  assert.ok(exported.includes('sg-receipt-1'))
  assert.ok(!exported.includes(token))
  const stop = await h.request('/api/glove/public/email-preferences', { method: 'POST', headers: { authorization: `Bearer ${token}`, origin: h.origin }, body: { stop: true } })
  assert.equal(stop.status, 200)
  await clock(h, '2025-12-06T12:00:00.000Z')
  assert.equal((await request(second.jobId)).sent, false, 'Opted-out customer is never asked after the period')
  assert.equal(h.email.sent.length, 1)

  // The approved manual boundary consumes the customer period for every attempt.
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, reference: 'Renewed explicit permission for review email' })
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('customer.save', { ...customer, email: 'changed-review@example.test' })
  await h.command('review.consent', { customerId: customer.id, version: (await h.state()).customers.find(c => c.id === customer.id).version, enabled: true, address: customer.email, reference: 'Permission confirmed before the address changed' }, { error: 'STALE' })
  assert.equal(h.email.sent.length, 1, 'Stale address confirmation sends nothing')
  assert.equal((await request(second.jobId)).reason, 'no current review-email consent')
  assert.equal((await h.state()).reviewJobs.find(j => j.id === second.jobId).reason, 'no current review-email consent')
  customer = (await h.state()).customers.find(c => c.id === b.customer.id)
  await h.command('review.consent', { customerId: customer.id, version: customer.version, enabled: true, reference: 'Explicit permission for the changed email' })
  await b.office.run('review.request', { jobId: second.jobId }, { error: 'FORBIDDEN' })
  assert.equal((await h.state(b.office.cookie)).reviewJobs, undefined)
  const limitedOwner = await h.person('Review branch owner', 'owner')
  await h.command('branch.limit', { operatorId: limitedOwner.id, branchId: 'main' })
  await limitedOwner.run('review.request', { jobId: second.jobId }, { error: 'FORBIDDEN' })
  await limitedOwner.run('review.configure', { ...config, version: (await h.state()).business[0].version }, { error: 'FORBIDDEN' })
  await limitedOwner.run('review.consent', { customerId: customer.id, version: (await h.state()).customers.find(c => c.id === customer.id).version, enabled: true, reference: 'Forbidden' }, { error: 'FORBIDDEN' })
  assert.equal((await limitedOwner.state()).reviewJobs, undefined)
  const inspectorRole = await h.command('role.save', { name: 'Review inspector', permissions: ['customer.save'] })
  const inspector = await h.person('Review inspector', `custom:${inspectorRole.id}`)
  const formerOwner = await h.person('Former review owner', 'owner')
  await h.command('role.set', { operatorId: formerOwner.id, role: 'viewer' })
  const currentConfirmation = await confirmation()
  const ownerDoors = [
    ['review.configure', { ...config, version: currentConfirmation.businessVersion }],
    ['review.consent', { customerId: customer.id, version: currentConfirmation.customerVersion, enabled: true, reference: 'synthetic-glove-805' }],
    ['review.request', { jobId: second.jobId, confirmation: currentConfirmation }],
  ]
  for (const person of [b.dispatcher, b.agent, b.priyaPerson, inspector, formerOwner]) {
    for (const [type, payload] of ownerDoors) await person.run(type, payload, { error: 'FORBIDDEN' })
    assert.equal((await person.state()).reviewJobs, undefined)
  }
  const integration = await h.command('token.issue', { name: 'Review integration', role: 'dispatcher' })
  for (const [index, [type, payload]] of ownerDoors.entries()) {
    const refused = await h.request('/api/glove/commands', { method: 'POST', as: '', headers: { authorization: `Bearer ${integration.token}` }, body: { commandId: `synthetic-glove-review-denial-${index}`, type, payload } })
    assert.equal(refused.status, 403)
    assert.equal((await refused.json()).error.code, 'FORBIDDEN')
  }
  const tokenView = await h.request('/api/glove/state', { as: '', headers: { authorization: `Bearer ${integration.token}` } })
  assert.equal(tokenView.status, 200)
  assert.equal((await tokenView.json()).reviewJobs, undefined)
  const signedOut = await h.request('/api/glove/commands', { method: 'POST', as: '', body: { commandId: 'synthetic-glove-review-signed-out', type: 'review.request', payload: ownerDoors[2][1] } })
  assert.equal(signedOut.status, 401)
  assert.equal(h.email.sent.length, 1, 'Address changes and unauthorized requests never reach the provider')
  for (const [index, [http, expected]] of [[400, 'rejected'], [429, 'rate_limited'], [500, 'uncertain'], [202, 'accepted']].entries()) {
    const instant = new Date(Date.parse('2026-01-06T12:00:00.000Z') + index * 31 * 86400000).toISOString()
    await clock(h, instant)
    h.email.status[customer.email] = http
    const before = h.email.sent.length
    const attempt = await request(second.jobId)
    assert.equal(attempt.sent, true, 'Explicit request queues one attempt, not a delivery claim')
    assert.equal((await h.state()).messageStates[attempt.messageId].status, expected)
    if (expected === 'accepted') {
      const message = (await messages(h, 'reviewRequest')).find(m => m.id === attempt.messageId)
      assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: message.id, email: message.to, event: 'bounce', timestamp: Date.parse(instant) / 1000, sg_event_id: 'synthetic-glove-803', sg_message_id: `sg-receipt-${before + 1}.filter` }], { at: Date.parse(instant) / 1000 }))).status, 200)
      assert.equal((await h.state()).messageStates[attempt.messageId].status, 'bounced')
    }
    // Changing both job and configured message must not evade the shared period.
    const failedState = await h.state(), attemptState = failedState.messageStates[attempt.messageId]
    assert.equal(attemptState.status, ['rejected', 'rate_limited', 'uncertain', 'bounced'][index])
    assert.match(attemptState.next, /used the customer review period/); assert.match(attemptState.next, /will not retry/)
    assert.doesNotMatch(attemptState.next, new RegExp('send again|sending again', 'i'))
    await h.command('review.configure', { ...config, template: `Uniform request revision ${index + 1}.`, version: (await h.state()).business[0].version })
    assert.equal((await request(first.jobId)).reason, 'period already requested')
    await h.scheduled(instant)
    assert.equal(h.email.sent.length, before + 1, `${expected} consumes the period and is never automatically retried`)
    const exported = await (await h.request('/api/glove/export')).text()
    assert.ok(exported.includes(attempt.messageId) && exported.includes(`email.${expected}`))
    assert.ok(!exported.includes(JSON.stringify('synthetic-glove-1')) && !/#token=gle_|gle_[A-Za-z0-9_-]{43}/.test(exported), 'Attempt history excludes credentials and unsubscribe bearers')
  }
  const lastReview = (await messages(h, 'reviewRequest')).at(-1)
  const complaintAt = Date.parse(lastReview.createdAt) / 1000 + 1
  assert.equal((await postEvents(h, signer.signed([{ rer_delivery_id: lastReview.id, email: lastReview.to, event: 'spamreport', timestamp: complaintAt, sg_event_id: 'synthetic-glove-804', sg_message_id: `sg-receipt-${h.email.sent.length}.filter` }], { at: complaintAt - 1 }))).status, 200)
  const complaint = (await h.state()).messageStates[lastReview.id]
  assert.equal(complaint.status, 'complained')
  assert.match(complaint.next, /Do not email them again until they ask for it/)
  assert.match(complaint.next, /will not retry/)
})

import { voiceFlow } from './voice-flow.mjs'
test('COMM-009, COMM-028 signed known-customer calls route in order and retain outcomes; Owner explicitly texts one consented booking reply', voiceFlow)
