import { allow } from './access'
import { branchIdOf } from './branches'
import { agreementVisits } from './agreement-due'
import { autoAssign, dispatch, slot, conflicts } from './commands/dispatch'
import { bump, event, expectVersion, fail, find, newId, put, text, type Context, type Row } from './model'
import { sha256 } from '../modules/import-kit/src/d1/index'
import { address, connection, queueEmail } from './mail'
import type { Handler } from './commands/types'

export const bookingHash = (token: string) => sha256(`glove-booking-link:${token}`)
export const bookingHeaders = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }
export const unavailableBooking = (): never => fail('BOOKING_LINK', 'This booking link is unavailable or has expired. Ask the business for a new link.', null, 404)

export function offeredJob(c: Context, link: Row) {
  if (link.serviceBooking) {
    const job = find(c.s, 'jobs', link.jobId)
    if (job.status !== 'open' || c.s.visits.some(v => v.jobId === job.id && v.status !== 'cancelled')) unavailableBooking()
    return job
  }
  const a = find(c.s, 'agreements', link.agreementId)
  const v = agreementVisits(c.s, a).find(v => v.index === link.index)
  if (!v || v.completed || v.declined || v.booked || ('sourceClosed' in v && v.sourceClosed) || v.jobId !== link.jobId) unavailableBooking()
  return find(c.s, 'jobs', link.jobId)
}

/** Customer data is restricted to this included visit and the currently open
 * offers; conflict details about other customers never leave the desk. */
export async function bookingView(c: Context, link: Row, db: D1Database) {
  const job = offeredJob(c, link)
  allow(c.actor, 'visit.book')
  if (link.serviceBooking) {
    const slots = []
    for (const offer of link.slots) {
      const chosen = await availableServiceSlot(c, job, offer, db)
      if (chosen) slots.push({ id: offer.id, ...chosen.local, window: chosen.arrivalWindow })
    }
    return { business: c.s.business[0]?.name, service: link.serviceName, address: find(c.s, 'sites', job.siteId).address, expiresAt: link.expiresAt, serviceBooking: true, slots }
  }
  return {
    business: c.s.business[0]?.name, service: find(c.s, 'agreements', link.agreementId).importedEntitlements?.[link.index]?.name ?? find(c.s, 'agreements', link.agreementId).plan.visitServiceName,
    address: find(c.s, 'sites', job.siteId).address, expiresAt: link.expiresAt,
    slots: link.slots.flatMap((offer: Row) => {
      try { return Date.parse(offer.startAt) > Date.parse(c.now) && !conflicts(c, job, offer as any, null).length ? [{ id: offer.id, ...offer.local }] : [] } catch { return [] }
    }),
  }
}

export const bookingOffers: Handler = async (c, type, p, db) => {
  if (type === 'booking.offer') return serviceOffer(c, p, db)
  if (!['agreement.offer', 'agreement.offerRevoke', 'agreement.offerSent'].includes(type)) return undefined
  allow(c.actor, type)
  if (type === 'agreement.offer') {
    // The link delegates a person's current authority, never an integration token.
    if (c.actor.token) fail('FORBIDDEN', 'A person offers these visits while signed in.', null, 403)
    allow(c.actor, 'visit.book')
    const a = find(c.s, 'agreements', p.agreementId)
    const v = agreementVisits(c.s, a).find(v => v.index === p.index) ?? fail('ENTITLEMENT', 'Choose an included visit.')
    if (!v || v.completed || v.declined || v.booked || ('sourceClosed' in v && v.sourceClosed)) fail('ENTITLEMENT', 'Choose an outstanding included visit without a live booking.')
    if (!Array.isArray(p.slots) || !p.slots.length || p.slots.length > 10) fail('INPUT', 'Offer 1 to 10 slots.', null, 400)
    // COMM-001: an emailed link goes only to the customer's own address on record; it is still shown once, as ruled.
    const customer = find(c.s, 'customers', a.customerId)
    const emailTo = p.email === true ? (connection(c.s), customer.email ? address(customer.email, 'the customer\'s email') : fail('EMAIL', `${customer.name} has no email address; add it on the customer first.`)) : null
    const job = v.jobId ? find(c.s, 'jobs', v.jobId) : (allow(c.actor, 'job.create'), await dispatch(c, 'job.create', { customerId: a.customerId, siteId: ('siteId' in v ? v.siteId : null) ?? a.siteId, agreementId: a.id, agreementVisitIndex: v.index, title: `${a.plan.visitServiceName} (${a.plan.name})` }, db) as Row)
    const slots = p.slots.map((value: unknown) => ({ id: newId(), ...slot(c, value) }))
    for (const offer of slots) {
      if (Date.parse(offer.startAt) <= Date.parse(c.now)) fail('TIME', 'Offer a future slot.', null, 400)
      const found = conflicts(c, job, offer, null)
      if (found.length) fail('CONFLICT_REVIEW', 'Offer an open slot; review these conflicts at Dispatch.', { conflicts: found })
    }
    const token = 'glb_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const row = put(c.s, 'bookingOffers', { id: newId(), version: 1, createdAt: c.now, agreementId: a.id, index: v.index, jobId: job.id, siteId: job.siteId, customerId: job.customerId, slots, offeredBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, expiresAt: new Date(Date.parse(c.now) + 14 * 86400000).toISOString(), revokedAt: null, usedAt: null, sentOutside: null })
    c.sql.push({ sql: 'INSERT INTO glove_booking_secrets(link_id,hash) VALUES(?,?)', params: [row.id, bookingHash(token)] })
    event(c, { jobId: job.id, subjectKind: 'bookingOffer', subjectId: row.id, kind: 'agreement.offer.created', summary: `${c.actor.name} offered ${slots.length} slots for included visit ${v.index + 1}; link expires in 14 days; ${emailTo ? `emailed to ${emailTo} by Glove` : 'share outside Glove'}`, data: { agreementId: a.id, index: v.index, expiresAt: row.expiresAt, emailed: !!emailTo } })
    c.reveal = { token }
    if (!emailTo) return row
    const b = c.s.business[0], service = 'service' in v ? v.service : a.plan.visitServiceName
    const choices = slots.map((x: Row) => `- ${x.local.date} ${x.local.start} to ${x.local.end}`).join('\n')
    const message = queueEmail(c, { kind: 'bookingLink', subjectKind: 'bookingOffer', subjectId: row.id, customerId: customer.id, jobId: job.id, to: emailTo, subject: `Choose a time for your ${service} visit`, text: `${b.name} has times for the ${service} visit included in your ${a.plan.name} plan at ${find(c.s, 'sites', job.siteId).address}:\n\n${choices}\n(times are ${slots[0].local.timezone ?? b.timezone})\n\nChoose one here (the link works once and expires ${row.expiresAt.slice(0, 10)}):\n${c.origin}/book#token=${token}\n\nOr reply to this email to ask for another time.\n\n${b.name}${b.address ? `\n${b.address}` : ''}`, label: `the booking link for included visit ${v.index + 1}` })
    return bump(c.s, 'bookingOffers', row, { emailed: { at: c.now, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, messageId: message.id, to: emailTo } })
  }
  const link = find(c.s, 'bookingOffers', p.offerId); expectVersion(link, p.version)
  if (link.serviceBooking && (c.actor.role !== 'owner' || c.actor.token || c.actor.branch)) fail('FORBIDDEN', 'Only the signed-in unscoped owner manages service booking links.', null, 403)
  if (link.revokedAt || Date.parse(link.expiresAt) <= Date.parse(c.now)) fail('BOOKING_LINK', 'This offer is already used, revoked or expired.')
  if (type === 'agreement.offerSent') {
    const method = text(p.method, 'method', { max: 100 })
    const row = bump(c.s, 'bookingOffers', link, { sentOutside: { at: c.now, by: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, method } })
    event(c, { jobId: link.jobId, subjectKind: 'bookingOffer', subjectId: link.id, kind: 'agreement.offer.sentOutside', summary: `${c.actor.name} recorded the booking link as sent outside Glove by ${method}; delivery is not verified`, data: { method, deliveryVerified: false } })
    return row
  }
  const row = bump(c.s, 'bookingOffers', link, { revokedAt: c.now })
  event(c, { jobId: link.jobId, subjectKind: 'bookingOffer', subjectId: link.id, kind: 'agreement.offer.revoked', summary: `${c.actor.name} revoked the booking link`, data: null })
  return row
}


/** BOOK-002: no technician identity or competing customer's conflict leaves
 * the bearer door. Assignment is recomputed again at the committing choice. */
async function availableServiceSlot(c: Context, job: Row, offer: Row, db: D1Database) {
  try {
    const chosen = await autoAssign(c, job, { ...offer, technicianId: 'auto' }, db, true)
    const next = slot(c, chosen.p)
    return Date.parse(next.startAt) > Date.parse(c.now) ? next : null
  } catch (error) {
    // Capacity, calendar and routing failures all close this public offer.
    // The desk can inspect the actual reason through its dispatch doors.
    return null
  }
}

async function serviceOffer(c: Context, p: any, db: D1Database) {
  allow(c.actor, 'booking.offer')
  if (c.actor.role !== 'owner' || c.actor.token || c.actor.branch) fail('FORBIDDEN', 'Only the signed-in unscoped owner issues service booking links.', null, 403)
  const job = find(c.s, 'jobs', p.jobId)
  if (!job.serviceCall || job.agreementId || job.status !== 'open' || c.s.visits.some(v => v.jobId === job.id && v.status !== 'cancelled')) fail('JOB_STATE', 'Choose an open service call without an agreement or live visit.')
  const services = [...new Set(job.lines.map((line: Row) => line.serviceId))]
  if (services.length !== 1 || !services[0]) fail('SERVICE', 'Choose a job for one price-book service.')
  const service = find(c.s, 'services', services[0])
  if (p.deposit || p.lateCancellationFee || p.noShowFee) fail('PAYMENT_POLICY', 'Deposits and fees are unavailable on this booking door.')
  if (p.generate !== undefined && p.slots !== undefined) fail('INPUT', 'Choose generated windows or explicit slots, not both.', null, 400)
  const candidates = p.generate !== undefined ? generatedWindows(p.generate) : p.slots
  if (!Array.isArray(candidates) || !candidates.length || (p.generate === undefined && candidates.length > 10)) fail('INPUT', 'Offer 1 to 10 arrival windows.', null, 400)
  const technician = c.s.technicians.find(t => t.active && branchIdOf(c.s, t) === branchIdOf(c.s, job)) ?? fail('NO_TECHNICIAN', 'Add an active technician first.')
  let slots = candidates.map((value: any) => {
    if (!value?.window) fail('WINDOW', 'Each service booking needs an arrival window.', null, 400)
    const next = slot(c, { ...value, technicianId: technician.id })
    if (Date.parse(next.startAt) <= Date.parse(c.now)) fail('TIME', 'Offer a future arrival window.', null, 400)
    return { id: newId(), ...next.local, window: next.arrivalWindow }
  })
  if (p.generate !== undefined) {
    const available = []
    for (const candidate of slots) {
      if (await availableServiceSlot(c, job, candidate, db)) available.push(candidate)
      if (available.length === 10) break
    }
    if (!available.length) fail('NO_TECHNICIAN', 'No arrival windows are available in that range. Choose another date or range.')
    slots = available
  }
  const token = 'glb_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const row = put(c.s, 'bookingOffers', { id: newId(), version: 1, createdAt: c.now, serviceBooking: true, serviceName: service.name, serviceId: service.id, jobId: job.id, siteId: job.siteId, customerId: job.customerId, slots, offeredBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, expiresAt: new Date(Date.parse(c.now) + 14 * 86400000).toISOString(), revokedAt: null, usedAt: null, sentOutside: null })
  c.sql.push({ sql: 'INSERT INTO glove_booking_secrets(link_id,hash) VALUES(?,?)', params: [row.id, bookingHash(token)] })
  event(c, { jobId: job.id, subjectKind: 'bookingOffer', subjectId: row.id, kind: 'booking.offer.created', summary: `${c.actor.name} offered ${slots.length} arrival windows for ${service.name}; availability and automatic assignment checked at customer choice; share outside Glove`, data: { serviceId: service.id, expiresAt: row.expiresAt } })
  c.reveal = { token }
  return row
}

/** Bounded single-day generation uses the same live capacity door as customer
 * reads and choices. No candidate reserves capacity or grants conflict overrides. */
function generatedWindows(value: any) {
  const clock = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!value || typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || typeof value.start !== 'string' || typeof value.end !== 'string' || !clock.test(value.start) || !clock.test(value.end)) fail('INPUT', 'Choose a date and a same-day start and end as HH:MM.', null, 400)
  const { durationMinutes, stepMinutes } = value
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 480 || !Number.isInteger(stepMinutes) || stepMinutes < 15 || stepMinutes > 480) fail('INPUT', 'Duration and step must be whole minutes from 15 to 480.', null, 400)
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  const start = minutes(value.start), end = minutes(value.end)
  if (end <= start || start + durationMinutes > end) fail('INPUT', 'The range must fit at least one complete visit.', null, 400)
  const hhmm = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
  const windows = []
  for (let at = start; at + durationMinutes <= end; at += stepMinutes) {
    const from = hhmm(at), to = hhmm(at + durationMinutes)
    windows.push({ date: value.date, start: from, end: to, window: { start: from, end: to } })
  }
  return windows
}
