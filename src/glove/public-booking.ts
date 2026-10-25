import type { Bindings } from '../auth.server'
import { roleSql, withRole, allow } from './access'
import { inBranch } from './branch-access'
import { bookingHash, bookingHeaders, bookingView, offeredJob, unavailableBooking } from './booking-offers'
import { autoAssign, book, slot } from './commands/dispatch'
import { bump, event, fail, Problem, newId, put, type Context, type Row } from './model'
import { load, commit } from './storage'
import { notify } from './push'

async function context(env: Bindings, hash: string) {
  const hit = await env.DB.prepare("SELECT link_id AS id FROM glove_booking_secrets WHERE hash=?").bind(hash).first<{ id: string }>()
  if (!hit) unavailableBooking()
  const before = await load(env.DB), link = before.bookingOffers.find(l => l.id === hit!.id)
  const now = new Date().toISOString()
  if (!link || link.revokedAt || link.expiresAt <= now) unavailableBooking()
  const id = link!.offeredBy.id
  const operator = await env.DB.prepare(`SELECT display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(id, id, id).first<{ name: string; version: number; role: string }>()
  if (!operator) unavailableBooking()
  const limit = before.branchAccess.find(r => r.id === id)
  const actor = await withRole(env.DB, { id, name: operator!.name, operatorVersion: operator!.version, sessionId: '', branchRevision: limit?.version ?? 0, branch: limit && limit.limited !== false ? { id: limit.branchId, version: limit.version } : undefined, bookingLink: { id: link!.id, version: link!.version, hash } }, operator!.role)
  allow(actor, 'visit.book')
  if (link!.serviceBooking && (actor.role !== 'owner' || actor.branch || actor.token)) unavailableBooking()
  const c: Context = { s: structuredClone(before), actor, commandId: crypto.randomUUID(), now, events: [], files: [], sql: [], local: env.AUTH_LOCAL === 'true' }
  return { before, link: link!, c }
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: bookingHeaders })

/** The bearer grants this single choice only. It does not authenticate a
 * customer account or accept arbitrary job/technician/time payloads. */
export async function publicBooking(request: Request, env: Bindings): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/glove/public/booking') return null
  try {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { ...bookingHeaders, allow: 'GET, POST' } })
    const token = /^Bearer (glb_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token || url.search) unavailableBooking()
    const hash = bookingHash(token!)
    let choice: string | undefined
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== new URL(env.AUTH_ORIGIN).origin) fail('ORIGIN', 'Choose from this installation.', null, 403)
      if (!request.headers.get('content-type')?.includes('application/json')) fail('INPUT', 'Use application/json.', null, 400)
      const raw = await request.text()
      if (raw.length > 2000) fail('INPUT', 'Choose one offered slot.', null, 400)
      let body: any
      try { body = JSON.parse(raw) } catch { fail('INPUT', 'Choose one offered slot.', null, 400) }
      if (!body || typeof body.slotId !== 'string' || Object.keys(body).some(k => k !== 'slotId')) fail('INPUT', 'Choose one offered slot.', null, 400)
      choice = body.slotId
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const { before, link, c } = await context(env, hash)
      const result = await inBranch(c, async () => {
        const view = await bookingView(c, link, env.DB)
        if (request.method === 'GET') return { offer: view }
        const available = view.slots.find((s: any) => s.id === choice)
        if (!available) fail('SLOT_TAKEN', 'That slot is no longer available. Choose one of the remaining offers, or ask the business for more times.', { offer: view })
        const next = link.slots.find((s: Row) => s.id === choice)
        const job = offeredJob(c, link)
        const assigned = link.serviceBooking ? await autoAssign(c, job, { ...next, technicianId: 'auto' }, env.DB) : null
        const visit = book(c, job, assigned ? slot(c, assigned.p) : next, [], assigned ? assigned.reason : 'Customer selected an offered slot using their booking link')
        if (link.serviceBooking) put(c.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: ['owner', 'dispatcher', 'office'], jobId: job.id, visitId: visit.id, message: `${job.number} booked online; arrange the customer confirmation under the configured communication policy.` })
        bump(c.s, 'bookingOffers', link, { revokedAt: c.now, usedAt: c.now, visitId: visit.id })
        event(c, { jobId: link.jobId, subjectKind: 'bookingOffer', subjectId: link.id, kind: link.serviceBooking ? 'booking.offer.used' : 'agreement.offer.used', summary: `Customer chose an offered slot under ${c.actor.name}'s authority; booking link revoked on use`, data: { visitId: visit.id, agreementId: link.agreementId, index: link.index } })
        return { booked: { ...visit.local, ...(visit.arrivalWindow ? { window: visit.arrivalWindow } : {}) }, business: view.business, service: view.service, address: view.address }
      })
      if (request.method === 'GET') return json(result)
      try { await commit(env.DB, c, before, 'agreement.offer.use', hash, result) }
      catch (error) {
        if ((await load(env.DB)).version !== before.version) continue
        // An authority change between load and commit is refused by the batch.
        if (/constraint/i.test(String(error))) unavailableBooking()
        throw error
      }
      await notify(env, before, c)
      return json(result)
    }
    return fail('BUSY', 'The schedule is changing. Refresh the offered times and try again.')
  } catch (error) {
    if (error instanceof Problem) {
      if (['FORBIDDEN', 'NOT_FOUND'].includes(error.code)) return json({ error: { code: 'BOOKING_LINK', message: 'This booking link is unavailable. Ask the business for a new link.' } }, 404)
      return json({ error: { code: error.code, message: error.message, details: error.details } }, error.status)
    }
    throw error
  }
}
