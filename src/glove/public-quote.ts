import type { Bindings } from '../auth.server'
import { roleSql, withRole, allow, authority } from './access'
import { inBranch } from './branch-access'
import { quoteHash, quoteHeaders, unavailableQuote } from './quote-links'
import { quotes } from './commands/quotes'
import { bump, event, fail, find, newId, oneOf, Problem, put, text, type Context, type Row } from './model'
import { load, commit } from './storage'
import { deliverMail, messageStates } from './mail'
import { quoteSelection, readSignedQuote, signingDisclosure, signQuote } from './quote-signing'

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
  const disclosure = signingDisclosure(c.s), signed = q.acceptance?.signing
  return { state, document: link.document, documentHash: link.documentHash, signingAvailable: !!disclosure && state === 'open', signingMessage: disclosure ? 'Signing records your name and capacity as claimed. It does not verify your identity or claim legal validity.' : 'Online signing is unavailable pending the owner’s consent disclosure. Contact the business to accept.', disclosure: disclosure ? { version: disclosure.version, text: disclosure.text, hash: disclosure.hash } : null, decision: state === 'decided' ? q.status : null, signed: signed ? { name: signed.name, capacity: signed.capacity, identity: signed.identity, at: signed.at, authenticationBasis: signed.authenticationBasis, signature: signed.signature, consent: signed.consent, document: signed.document, revisionDocumentHash: signed.revisionDocumentHash, chosenDocumentHash: signed.chosenDocumentHash, signedCopy: signed.signedCopy, confirmation: signed.confirmation } : null, updateRequested: (q.customerRequests ?? []).some((x: Row) => x.revision === r.n && x.action === 'update'), requests: (q.customerRequests ?? []).filter((x: Row) => x.revision === r.n).map((x: Row) => ({ action: x.action, at: x.at, message: x.message, choice: x.choice })) }
}

/** QUOTE-002 bearer: only one revision, with live issuer and atomic role/branch
 * guards. Signing remains closed until the owner accepts concrete disclosure. */
export async function publicQuote(request: Request, env: Bindings): Promise<Response | null> {
  const url = new URL(request.url)
  const asset = /^\/api\/glove\/public\/quote\/files\/([0-9a-f-]{36})$/.exec(url.pathname)
  const signedCopy = url.pathname === '/api/glove/public/quote/signed'
  if (url.pathname !== '/api/glove/public/quote' && !asset && !signedCopy) return null
  if ((asset || signedCopy) && request.method !== 'GET') return new Response(null, { status: 405, headers: quoteHeaders })
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
      if (raw.length > 150000) fail('INPUT', 'The response is too long.', null, 400)
      try { payload = JSON.parse(raw) } catch { fail('INPUT', 'Send a quote response.', null, 400) }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).some(k => !['action', 'name', 'capacity', 'message', 'choice', 'documentHash', 'selectionHash', 'signature', 'consent'].includes(k))) fail('INPUT', 'Send only a quote response.', null, 400)
      oneOf(payload.action, ['changes', 'update', 'decline', 'approve', 'choose'], 'action')
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const { before, link, c } = await context(env, hash)
      const result = await inBranch(c, async () => {
        const current = view(c, link)
        if (request.method === 'GET') return current
        if (current.state === 'superseded') fail('REVISION', current.message!, null, 409)
        if (current.state === 'decided') return current
        if (current.state === 'expired' && payload.action !== 'update') fail('EXPIRED', 'This quote has expired. Ask for an updated quote.', null, 409)
        if (payload.action === 'choose') return { ...current, selection: quoteSelection(c, link, payload.choice) }
        if (payload.action === 'approve') {
          await signQuote(c, env.DB, link, payload, request)
          return view(c, link)
        }
        if (payload.action === 'update' && current.updateRequested) return current
        const q = find(c.s, 'quotes', link.quoteId), name = text(payload.name, 'name', { max: 200 })
        const capacity = text(payload.capacity, 'capacity', { optional: true, max: 200 })
        const message = text(payload.message, 'message', { optional: payload.action !== 'changes', max: 2000 })
        const selected = payload.choice ? quoteSelection(c, link, payload.choice) : null
        const response = { revision: link.revision, action: payload.action, name, capacity, message, at: c.now, linkId: link.id, identity: 'CLAIMED', authenticationBasis: link.authenticationBasis, ...(selected ? { choice: selected.choice } : {}) }
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
        let file: any, html: string | undefined
        if (asset) {
          if (!(result as any).document?.files?.includes(asset[1])) unavailableQuote()
          file = await env.DB.prepare('SELECT media_type AS mediaType,bytes FROM glove_files WHERE id=?').bind(asset[1]).first<any>()
          if (!file) unavailableQuote()
        }
        if (signedCopy) {
          const q = c.s.quotes.find(q => q.id === link.quoteId), signed = q?.acceptance?.signing
          if ((result as any).state !== 'decided' || !signed || q?.acceptance?.revision !== link.revision) unavailableQuote()
          html = await readSignedQuote(env.DB, q!.id, link.revision, signed.signedCopy)
        }
        if ((result as any).signed?.confirmation.messageId) {
          const id = (result as any).signed.confirmation.messageId, message = c.s.messages.find(m => m.id === id)
          if (message) (result as any).signed.confirmation = { ...(result as any).signed.confirmation, ...(await messageStates(env.DB, [message])).get(id) }
        }
        const a = authority(c.actor)
        const check = await env.DB.prepare(`SELECT CASE WHEN (${a.sql}) AND (SELECT version FROM glove_meta WHERE id=1)=? THEN 1 ELSE 0 END AS ok`).bind(...a.params, before.version).first<{ ok: number }>()
        if (!check?.ok) continue
        if (signedCopy) return new Response(html, { headers: { ...quoteHeaders, 'content-type': 'text/html; charset=utf-8', 'content-disposition': 'attachment; filename="signed-quote.html"', 'content-security-policy': "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'" } })
        return asset ? new Response(new Uint8Array(file.bytes), { headers: { ...quoteHeaders, 'content-type': file.mediaType, 'content-disposition': 'inline' } }) : json(result)
      }
      if (!c.events.length) {
        if ((result as any).signed?.confirmation.messageId) {
          const id = (result as any).signed.confirmation.messageId, message = c.s.messages.find(m => m.id === id)
          if (message) (result as any).signed.confirmation = { ...(result as any).signed.confirmation, ...(await messageStates(env.DB, [message])).get(id) }
        }
        return json(result)
      }
      try { await commit(env.DB, c, before, 'quote.customer', hash, result) }
      catch (error) {
        if ((await load(env.DB)).version !== before.version) continue
        if (/constraint/i.test(String(error))) unavailableQuote()
        throw error
      }
      await deliverMail(env.DB, c)
      if ((result as any).signed?.confirmation.messageId) {
        const id = (result as any).signed.confirmation.messageId, message = c.s.messages.find(m => m.id === id)
        if (message) (result as any).signed.confirmation = { ...(result as any).signed.confirmation, ...(await messageStates(env.DB, [message])).get(id) }
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
