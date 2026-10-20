import { allow } from './access'
import { agreementVisits } from './agreement-due'
import { dispatch, slot, conflicts } from './commands/dispatch'
import { bump, event, expectVersion, fail, find, newId, put, text, type Context, type Row } from './model'
import { sha256 } from '../modules/import-kit/src/d1/index'
import type { Handler } from './commands/types'

export const bookingHash = (token: string) => sha256(`glove-booking-link:${token}`)
export const bookingHeaders = { 'cache-control': 'no-store, private', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow', vary: 'Authorization' }
export const unavailableBooking = (): never => fail('BOOKING_LINK', 'This booking link is unavailable or has expired. Ask the business for a new link.', null, 404)

export function offeredJob(c: Context, link: Row) {
  const a = find(c.s, 'agreements', link.agreementId)
  const v = agreementVisits(c.s, a).find(v => v.index === link.index)
  if (!v || v.completed || v.declined || v.booked || v.jobId !== link.jobId) unavailableBooking()
  return find(c.s, 'jobs', link.jobId)
}

/** Customer data is restricted to this included visit and the currently open
 * offers; conflict details about other customers never leave the desk. */
export function bookingView(c: Context, link: Row) {
  const job = offeredJob(c, link)
  allow(c.actor, 'visit.book')
  return {
    business: c.s.business[0]?.name, service: find(c.s, 'agreements', link.agreementId).plan.visitServiceName,
    address: find(c.s, 'sites', job.siteId).address, expiresAt: link.expiresAt,
    slots: link.slots.flatMap((offer: Row) => {
      try { return Date.parse(offer.startAt) > Date.parse(c.now) && !conflicts(c, job, offer as any, null).length ? [{ id: offer.id, ...offer.local }] : [] } catch { return [] }
    }),
  }
}

export const bookingOffers: Handler = async (c, type, p, db) => {
  if (!['agreement.offer', 'agreement.offerRevoke', 'agreement.offerSent'].includes(type)) return undefined
  allow(c.actor, type)
  if (type === 'agreement.offer') {
    // The link delegates a person's current authority, never an integration token.
    if (c.actor.token) fail('FORBIDDEN', 'A person offers these visits while signed in.', null, 403)
    allow(c.actor, 'visit.book')
    const a = find(c.s, 'agreements', p.agreementId)
    const v = agreementVisits(c.s, a).find(v => v.index === p.index) ?? fail('ENTITLEMENT', 'Choose an included visit.')
    if (!v || v.completed || v.declined || v.booked) fail('ENTITLEMENT', 'Choose an outstanding included visit without a live booking.')
    if (!Array.isArray(p.slots) || !p.slots.length || p.slots.length > 10) fail('INPUT', 'Offer 1 to 10 slots.', null, 400)
    const job = v.jobId ? find(c.s, 'jobs', v.jobId) : (allow(c.actor, 'job.create'), await dispatch(c, 'job.create', { customerId: a.customerId, siteId: a.siteId, agreementId: a.id, agreementVisitIndex: v.index, title: `${a.plan.visitServiceName} (${a.plan.name})` }, db) as Row)
    const slots = p.slots.map((value: unknown) => ({ id: newId(), ...slot(c, value) }))
    for (const offer of slots) {
      if (Date.parse(offer.startAt) <= Date.parse(c.now)) fail('TIME', 'Offer a future slot.', null, 400)
      const found = conflicts(c, job, offer, null)
      if (found.length) fail('CONFLICT_REVIEW', 'Offer an open slot; review these conflicts at Dispatch.', { conflicts: found })
    }
    const token = 'glb_' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const row = put(c.s, 'bookingOffers', { id: newId(), version: 1, createdAt: c.now, agreementId: a.id, index: v.index, jobId: job.id, siteId: job.siteId, customerId: job.customerId, slots, offeredBy: { id: c.actor.id, name: c.actor.name, role: c.actor.role }, expiresAt: new Date(Date.parse(c.now) + 14 * 86400000).toISOString(), revokedAt: null, usedAt: null, sentOutside: null })
    c.sql.push({ sql: 'INSERT INTO glove_booking_secrets(link_id,hash) VALUES(?,?)', params: [row.id, bookingHash(token)] })
    c.reveal = { token }
    event(c, { jobId: job.id, subjectKind: 'bookingOffer', subjectId: row.id, kind: 'agreement.offer.created', summary: `${c.actor.name} offered ${slots.length} slots for included visit ${v.index + 1}; link expires in 14 days; share outside Glove`, data: { agreementId: a.id, index: v.index, expiresAt: row.expiresAt } })
    return row
  }
  const link = find(c.s, 'bookingOffers', p.offerId); expectVersion(link, p.version)
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
