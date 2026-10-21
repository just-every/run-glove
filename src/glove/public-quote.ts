import type { Bindings } from '../auth.server'
import { roleSql, withRole, allow, authority } from './access'
import { inBranch } from './branch-access'
import { quoteHash, quoteHeaders, unavailableQuote } from './quote-links'
import { quotes } from './commands/quotes'
import { bump, event, fail, find, newId, oneOf, Problem, put, text, type Context, type Row } from './model'
import { load, commit } from './storage'

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: quoteHeaders })

async function context(env: Bindings, hash: string) {
  const hit = await env.DB.prepare('SELECT link_id AS id FROM glove_quote_secrets WHERE hash=?').bind(hash).first<{ id: string }>()
  if (!hit) unavailableQuote()
  const before = await load(env.DB), link = before.quoteLinks.find(l => l.id === hit!.id), now = new Date().toISOString()
  if (!link || link.revokedAt || link.expiresAt <= now) unavailableQuote()
  const id = link!.issuedBy.id
  const operator = await env.DB.prepare(`SELECT display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(id, id, id).first<{ name: string; version: number; role: string }>()
  if (!operator || operator.role !== link!.issuedBy.role) unavailableQuote()
  const limit = before.branchAccess.find(r => r.id === id)
  const actor = await withRole(env.DB, { id, name: operator!.name, operatorVersion: operator!.version, sessionId: '', branchRevision: limit?.version ?? 0, branch: limit && limit.limited !== false ? { id: limit.branchId, version: limit.version } : undefined, quoteLink: { id: link!.id, version: link!.version, hash } }, operator!.role)
  allow(actor, 'quote.link'); allow(actor, 'quote.markSent')
  const c: Context = { s: structuredClone(before), actor, commandId: crypto.randomUUID(), now, events: [], files: [], sql: [] }
  const sent = link!.emailMessageId && await env.DB.prepare("SELECT 1 AS sent FROM glove_events WHERE subject_kind='message' AND subject_id=? AND actor_role='provider' AND kind IN ('email.accepted','email.delivered','email.deferred','email.bounced','email.complained','email.failed') LIMIT 1").bind(link!.emailMessageId).first()
  const delegated: Row = { ...link!, authenticationBasis: sent ? 'link sent by Glove to the address on record' : 'link handed out by staff, recipient unverified' }
  return { before, link: delegated, c }
}

function view(c: Context, link: Row) {
  const q = find(c.s, 'quotes', link.quoteId), r = q.revisions.at(-1)
  if (r.n !== link.revision) return { state: 'superseded', message: 'A newer revision was sent. Ask the business for its current link.' }
  if (!r.approval) unavailableQuote()
  const state = ['accepted', 'declined'].includes(q.status) ? 'decided' : r.validTo <= c.now ? 'expired' : 'open'
  return { state, document: link.document, documentHash: link.documentHash, signingAvailable: false, signingMessage: 'Online signing is unavailable pending the owner’s consent disclosure. Contact the business to accept.', decision: state === 'decided' ? q.status : null, updateRequested: (q.customerRequests ?? []).some((x: Row) => x.revision === r.n && x.action === 'update'), requests: (q.customerRequests ?? []).filter((x: Row) => x.revision === r.n).map((x: Row) => ({ action: x.action, at: x.at, message: x.message })) }
}

/** QUOTE-002 bearer: only one revision, with live issuer and atomic role/branch
 * guards. Signing remains closed in every environment until owner disclosure. */
export async function publicQuote(request: Request, env: Bindings): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/api/glove/public/quote') return null
  try {
    if (!['GET', 'POST'].includes(request.method)) return new Response(null, { status: 405, headers: { ...quoteHeaders, allow: 'GET, POST' } })
    const token = /^Bearer (glq_[A-Za-z0-9_-]{43})$/.exec(request.headers.get('authorization') ?? '')?.[1]
    if (!token || url.search) unavailableQuote()
    const hash = quoteHash(token!)
    let payload: any
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== new URL(env.AUTH_ORIGIN).origin) fail('ORIGIN', 'Use this installation’s quote page.', null, 403)
      if (!request.headers.get('content-type')?.includes('application/json')) fail('INPUT', 'Use application/json.', null, 400)
      const raw = await request.text()
      if (raw.length > 6000) fail('INPUT', 'The response is too long.', null, 400)
      try { payload = JSON.parse(raw) } catch { fail('INPUT', 'Send a quote response.', null, 400) }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).some(k => !['action', 'name', 'capacity', 'message'].includes(k))) fail('INPUT', 'Send only a quote response.', null, 400)
      oneOf(payload.action, ['changes', 'update', 'decline', 'approve'], 'action')
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const { before, link, c } = await context(env, hash)
      const result = await inBranch(c, async () => {
        const current = view(c, link)
        if (request.method === 'GET') return current
        if (current.state === 'superseded') fail('REVISION', current.message!, null, 409)
        if (current.state === 'decided') return current
        if (current.state === 'expired' && payload.action !== 'update') fail('EXPIRED', 'This quote has expired. Ask for an updated quote.', null, 409)
        if (payload.action === 'approve') fail('CONSENT_GATE', current.signingMessage!, null, 409)
        if (payload.action === 'update' && current.updateRequested) return current
        const q = find(c.s, 'quotes', link.quoteId), name = text(payload.name, 'name', { max: 200 })
        const capacity = text(payload.capacity, 'capacity', { optional: true, max: 200 })
        const message = text(payload.message, 'message', { optional: payload.action !== 'changes', max: 2000 })
        const response = { revision: link.revision, action: payload.action, name, capacity, message, at: c.now, linkId: link.id, identity: 'CLAIMED', authenticationBasis: link.authenticationBasis }
        if (payload.action === 'decline') {
          await quotes(c, 'quote.decline', { quoteId: q.id, version: q.version, revision: link.revision, method: 'customer link', customerName: name, note: message }, env.DB)
          const declined = find(c.s, 'quotes', q.id)
          bump(c.s, 'quotes', declined, { declined: { ...declined.declined, method: 'customer link', ...response }, customerRequests: [...(q.customerRequests ?? []), response] })
        } else {
          bump(c.s, 'quotes', q, { customerRequests: [...(q.customerRequests ?? []), response] })
          const enquiry = q.enquiryId && c.s.enquiries.find(e => e.id === q.enquiryId)
          if (payload.action === 'update' && enquiry) bump(c.s, 'enquiries', enquiry, { status: 'contacted', stageAt: c.now, reopenedAt: c.now })
          put(c.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: ['owner', 'dispatcher', 'office'], quoteId: q.id, jobId: null, message: `${q.number} revision ${link.revision}: ${name} (claimed) ${payload.action === 'update' ? 'asked for an updated quote' : `requested changes: ${message}`}` })
        }
        event(c, { jobId: null, subjectKind: 'quote', subjectId: q.id, kind: `quote.customer.${payload.action}`, summary: `${q.number} revision ${link.revision}: ${name} (claimed) ${payload.action === 'decline' ? 'declined' : payload.action === 'update' ? 'asked for an updated quote' : 'requested changes'} through the customer link under ${c.actor.name}'s authority`, data: response })
        return view(c, link)
      })
      if (request.method === 'GET') {
        const a = authority(c.actor)
        const check = await env.DB.prepare(`SELECT CASE WHEN (${a.sql}) AND (SELECT version FROM glove_meta WHERE id=1)=? THEN 1 ELSE 0 END AS ok`).bind(...a.params, before.version).first<{ ok: number }>()
        if (!check?.ok) continue
        return json(result)
      }
      if (!c.events.length) return json(result)
      try { await commit(env.DB, c, before, 'quote.customer', hash, result) }
      catch (error) {
        if ((await load(env.DB)).version !== before.version) continue
        if (/constraint/i.test(String(error))) unavailableQuote()
        throw error
      }
      return json(result)
    }
    return fail('BUSY', 'The quote changed. Reopen the link and try again.')
  } catch (error) {
    if (error instanceof Problem) {
      if (['FORBIDDEN', 'NOT_FOUND'].includes(error.code)) return json({ error: { code: 'QUOTE_LINK', message: 'This quote link is unavailable. Ask the business for a new link.' } }, 404)
      return json({ error: { code: error.code, message: error.message } }, error.status)
    }
    throw error
  }
}
