import { requestPhotoFixtures } from '../fixtures/request-photos.mjs'
import { business } from './harness.mjs'

export const statusTemplates = { arrival: '{{technician}} has arrived for {{title}}.', onMyWay: '{{technician}} is on my way for {{title}}. ETA {{eta}}.', reportReady: 'Your report for {{title}} is ready.' }

/** Actual owner and technician commands; only Twilio and Google network edges are fake. */
export async function statusFixture(h, { configure = true } = {}) {
  const day = new Date().toISOString().slice(0, 10), at = `${day}T12:00:00.000Z`
  await h.request('/__test/clock', { method: 'POST', body: { at } })
  const b = await business(h, { name: 'Pacheco Plumbing & HVAC', abn: '12-3456789', currency: 'USD', timezone: 'UTC' })
  await h.command('sms.connect', { version: (await h.state()).business[0].version, provider: 'twilio', accountSid: h.twilio.accountSid, authToken: h.twilio.authToken, fromNumber: h.twilio.fromNumber, registration: 'a2p10dlc', registered: true, live: true })
  await h.command('sms.configure', { version: (await h.state()).business[0].version, enabled: true, approved: true })
  let customer = await h.command('customer.save', { ...(await h.state()).customers.find(c => c.id === b.customer.id), phone: '+13125550123' })
  customer = await h.command('sms.consent', { customerId: customer.id, version: customer.version, purpose: 'visits', enabled: true, address: customer.phone, source: 'Customer booking call', wording: 'Please text service notices and my completed report to this number. STOP ends texts.', timezone: 'UTC' })
  await h.command('site.save', { ...b.site, address: '1400 W Madison Street, Chicago IL 60607' })
  b.site = (await h.state()).sites.find(s => s.id === b.site.id)
  await h.command('maps.connect', { key: 'synthetic-glove-104' })
  h.maps.places.set(b.site.address, { lat: 41.9, lng: -87.6 })
  await h.command('site.locate', { siteIds: [b.site.id] })
  if (configure) await h.command('visitNotice.configure', { version: (await h.state()).business[0].version, onMyWay: true, reportReady: true, templates: statusTemplates, approved: true })
  const job = await b.dispatcher.run('job.create', { customerId: customer.id, siteId: b.site.id, title: 'Surgery air conditioner service' })
  const visit = await b.dispatcher.run('visit.book', { jobId: job.id, technicianId: b.priya.id, date: day, start: '13:00', end: '14:00' })
  await b.priyaPerson.run('technician.portrait', { version: (await h.state()).technicians.find(t => t.id === b.priya.id).version, enabled: true, consent: true, photo: requestPhotoFixtures()[1] })
  await b.priyaPerson.run('clock.in', { deviceTime: at })
  await b.priyaPerson.run('timer.start', { visitId: visit.id, kind: 'travel', deviceTime: at })
  await b.priyaPerson.run('location.consent', { enabled: true })
  await b.priyaPerson.run('location.phone', { lat: 41.89, lng: -87.63, observedAt: at })
  return { b, job, visit, customer, day, at }
}
