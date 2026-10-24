import type { Bindings } from '../auth.server'
import { roleSql } from './access'
import { bump, event, fail, find, newId, Problem, put, type Context } from './model'
import { load, commit } from './storage'
import { visitReplyHash, visitReplyHeaders, visitReplyView, unavailableVisitReply } from './visit-responses'

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: visitReplyHeaders })

/** This link answers one current visit. It cannot change its time, assignment,
 * customer, price or job, and reveals no address, contact or other visit. */
export async function publicVisitResponse(request: Request, env: Bindings): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/glove/public/visit-response') return null
  try {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { ...visitReplyHeaders, allow: 'GET, POST' } })
    const token = /^Bearer (glv_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token || url.search) unavailableVisitReply()
    const hash = visitReplyHash(token!)
    let action: string | undefined
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== new URL(env.AUTH_ORIGIN).origin) fail('ORIGIN', 'Respond from this installation.', null, 403)
      if (!request.headers.get('content-type')?.includes('application/json')) fail('INPUT', 'Use a JSON visit response.', null, 400)
      const raw = await request.text()
      if (raw.length > 300) fail('INPUT', 'Choose confirm or reschedule.', null, 400)
      let body: any
      try { body = JSON.parse(raw) } catch { fail('INPUT', 'Choose confirm or reschedule.', null, 400) }
      if (!body || Object.keys(body).length !== 1 || !['confirm', 'reschedule'].includes(body.action)) fail('INPUT', 'Choose confirm or reschedule.', null, 400)
      action = body.action
    }
    const key = await env.DB.prepare('SELECT link_id AS id,visit_id AS visitId,notice_key AS noticeKey,issuer_id AS issuerId,expires_at AS expiresAt FROM glove_visit_reply_secrets WHERE hash=?').bind(hash).first<any>()
    const before = await load(env.DB), now = new Date().toISOString()
    if (!key || key.expiresAt <= now) unavailableVisitReply()
    const visit = before.visits.find(v => v.id === key.visitId) ?? unavailableVisitReply()
    if (!visit || visit.erasedAt || visit.status !== 'booked' || visit.startAt <= now || visit.notice?.key !== key.noticeKey || visit.replyLink?.id !== key.id) unavailableVisitReply()
    const owner = await env.DB.prepare(`SELECT id,display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(key.issuerId, key.issuerId, key.issuerId).first<any>()
    const limit = before.branchAccess.find(r => r.id === key.issuerId)
    if (!owner || owner.role !== 'owner' || limit && limit.limited !== false) unavailableVisitReply()
    const job = before.jobs.find(j => j.id === visit.jobId) ?? unavailableVisitReply(), customer = before.customers.find(c => c.id === job.customerId) ?? unavailableVisitReply()
    const consent = customer?.automaticEmail?.visits
    if (!job || job.erasedAt || !customer || customer.erasedAt || !consent?.enabled || consent.address !== customer.email || customer.doNotContact || customer.marketingOptOut || (customer.tags ?? []).some((t: string) => t.toLowerCase() === 'do not contact')) unavailableVisitReply()
    const c: Context = { s: structuredClone(before), actor: { id: owner.id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: owner.version, branchRevision: limit?.version ?? 0, visitReply: { id: key.id, hash, visitId: visit.id, noticeKey: key.noticeKey } }, commandId: newId(), now, events: [], files: [], sql: [] }
    const current = find(c.s, 'visits', visit.id), view = visitReplyView(c, current, key.id)
    if (request.method === 'GET') return json({ visit: view })
    if (view.response) {
      if (view.response.action !== action) fail('ANSWERED', 'A response is already recorded for this visit. Contact the office to change it.', null, 409)
      return json({ visit: view })
    }
    const result = { noticeKey: key.noticeKey, action, at: now, identity: 'LINK_RECIPIENT_UNVERIFIED' }
    bump(c.s, 'visits', current, { customerResponses: [...(current.customerResponses ?? []), result] })
    let requestId: string | null = null
    if (action === 'reschedule') {
      const enquiry = put(c.s, 'enquiries', { id: newId(), version: 1, createdAt: now, stageAt: now, customerId: job.customerId, siteId: job.siteId, jobId: job.id, visitId: visit.id, status: 'new', source: 'email', description: `Reschedule requested for ${job.number}: ${visit.local.date} ${visit.local.start} to ${visit.local.end}. Existing booking remains in place.`, createdBy: { id: owner.id, name: 'Visit link recipient (unverified)', role: 'customer' }, contacts: [] })
      requestId = enquiry.id
      put(c.s, 'notices', { id: newId(), version: 1, createdAt: now, to: ['owner', 'dispatcher', 'office'], jobId: job.id, visitId: visit.id, customerId: job.customerId, enquiryId: enquiry.id, title: `Reschedule request on ${job.number}`, text: enquiry.description, read: [] })
    }
    event(c, { jobId: job.id, subjectKind: 'visit', subjectId: visit.id, kind: `visit.customer.${action}`, summary: `Visit link recipient (unverified) ${action === 'confirm' ? 'confirmed the current visit' : 'asked the office to reschedule; booking unchanged'}`, data: { visitId: visit.id, noticeKey: key.noticeKey, identity: result.identity, requestId } })
    try { await commit(env.DB, c, before, 'visit.customerResponse', hash, { visitId: visit.id, action, requestId }) }
    catch (error) {
      if (/constraint/i.test(String(error)) || (await load(env.DB)).version !== before.version) fail('VISIT_CHANGED', 'The visit changed. Reopen the link to check its current state.', null, 409)
      throw error
    }
    return json({ visit: visitReplyView(c, find(c.s, 'visits', visit.id), key.id) })
  } catch (error) {
    if (error instanceof Problem) return json({ error: { code: error.code, message: error.message } }, error.status)
    throw error
  }
}
