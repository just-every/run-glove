import type { Bindings } from '../auth.server'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { roleSql } from './access'
import { recordBranch } from './branch-access'
import { image } from './commands/field'
import { quotes } from './commands/quotes'
import { setup, siteFields } from './commands/setup'
import { isAddress } from './mail'
import { bump, event, fail, newId, Problem, put, text, type Actor, type Context } from './model'
import { commit, load } from './storage'

const path = '/api/glove/public/intake'
const action = 'glove-request'
const maxBody = 4_100_000
const digits = (v: string) => v.replace(/\D/g, '').slice(-10)
const privateHeaders = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'vary': 'Origin' }

async function bodyOf(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) fail('CONTENT_TYPE', 'Use application/json.', null, 400)
  if (Number(request.headers.get('content-length')) > maxBody) fail('SIZE', 'The request is too large.', null, 413)
  const reader = request.body?.getReader()
  if (!reader) fail('INPUT', 'A request body is required.', null, 400)
  const parts: Uint8Array[] = []
  let length = 0
  for (;;) {
    const next = await reader.read()
    if (next.done) break
    length += next.value.length
    if (length > maxBody) { await reader.cancel(); fail('SIZE', 'The request is too large.', null, 413) }
    parts.push(next.value)
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const part of parts) { bytes.set(part, offset); offset += part.length }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required')
    return value
  } catch { return fail('INPUT', 'Send one JSON request object.', null, 400) }
}

function fields(p: any) {
  if (typeof p.submissionId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.submissionId)) fail('INPUT', 'submissionId is a new UUID.', null, 400)
  if (p.consent !== true) fail('CONSENT', 'Confirm that the business may use this request to contact you about the work.', null, 400)
  const name = text(p.name, 'name', { max: 200 }), phone = text(p.phone, 'phone', { optional: true, max: 50 }), email = text(p.email, 'email', { optional: true, max: 200 }).toLowerCase()
  const phoneDigits = phone.replace(/\D/g, '').length
  if ((!phone && !email) || phone && (!/^[+()\d .-]{7,50}$/.test(phone) || phoneDigits < 7 || phoneDigits > 15) || email && !isAddress(email)) fail('INPUT', 'Give a valid phone number or email address.', null, 400)
  if (p.photos !== undefined && (!Array.isArray(p.photos) || p.photos.length > 2)) fail('FILE', 'Attach at most two photos.', null, 400)
  return { name, phone, email, address: text(p.address, 'address', { max: 500 }), zip: text(p.zip, 'zip', { optional: true, max: 20 }), service: text(p.service, 'service', { max: 200 }), description: text(p.description, 'description', { max: 3000 }), preferredTimes: text(p.preferredTimes, 'preferredTimes', { optional: true, max: 500 }), source: text(p.source, 'source', { optional: true, max: 200 }), photos: (p.photos ?? []).map((photo: any) => ({ mediaType: photo?.mediaType, base64: photo?.base64, caption: text(photo?.caption, 'photo caption', { optional: true, max: 300 }) })) }
}

/** Cloudflare receives only the verification secret and token. Its success
 * must name this form action, this browser origin's hostname and a fresh
 * challenge. Failed/uncertain verification has no local persistence. */
async function verify(secret: string, token: string, origin: string) {
  const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 10_000)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', redirect: 'manual', signal: abort.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret, response: token }) })
    const result = response.ok ? await response.json() as any : null
    const at = Date.parse(result?.challenge_ts), age = Date.now() - at
    if (result?.success === true && result.action === action && result.hostname === new URL(origin).hostname && Number.isFinite(age) && age >= -30_000 && age <= 300_000) return
  } catch { /* A provider failure never admits the request. */ }
  finally { clearTimeout(timer) }
  fail('TURNSTILE', 'Verification failed. Complete the challenge again.', null, 400)
}

/** Dedicated anonymous intake, never the generic command dispatcher. All
 * writes use the configuring owner's current authority and one atomic batch. */
export async function publicIntake(request: Request, env: Bindings): Promise<Response | null> {
  if (new URL(request.url).pathname !== path) return null
  let cors: Record<string, string> = {}
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { ...privateHeaders, ...cors } })
  try {
    const before = await load(env.DB), b = before.business[0], settings = b?.intake
    if (!settings?.enabled) fail('INTAKE_DISABLED', 'Website requests are unavailable.', null, 404)
    const origin = request.headers.get('origin') ?? new URL(env.AUTH_ORIGIN).origin
    if (origin !== new URL(env.AUTH_ORIGIN).origin && !settings.allowedOrigins.includes(origin)) fail('ORIGIN', 'This website is not enabled for requests.', null, 403)
    cors = { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Content-Type' }
    const secret = (await env.DB.prepare("SELECT value FROM glove_provider_keys WHERE provider='turnstile'").first<{ value: string }>())?.value
    if (!secret) fail('INTAKE_DISABLED', 'Website requests are unavailable.', null, 404)
    const owner = await env.DB.prepare(`SELECT id,display_name AS name,version,${roleSql('?')} AS role FROM oa_operators WHERE id=? AND status='active'`).bind(settings.by.id, settings.by.id, settings.by.id).first<{ id: string; name: string; version: number; role: string }>()
    const limit = before.branchAccess.find(r => r.id === settings.by.id)
    if (!owner || owner.role !== 'owner' || limit && limit.limited !== false) fail('INTAKE_DISABLED', 'Website requests are unavailable.', null, 404)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...privateHeaders, ...cors } })
    if (request.method === 'GET') return json({ businessName: b.name, siteKey: settings.siteKey, action })
    if (request.method !== 'POST') fail('METHOD', 'Use GET or POST.', null, 405)
    const p = await bodyOf(request), input = fields(p)
    const token = text(p.turnstileToken, 'turnstileToken', { max: 2048 })
    const commandId = `intake-${p.submissionId}`, digest = sha256(canonicalJson(input))
    const previous = await env.DB.prepare('SELECT digest,result FROM glove_commands WHERE id=? AND type=?').bind(commandId, 'intake.receive').first<{ digest: string; result: string }>()
    if (previous) {
      if (previous.digest !== digest) fail('IDEMPOTENCY', 'That submission identity has already been used.', null, 409)
      return json({ ok: true, receipt: JSON.parse(previous.result).result.receipt })
    }
    await verify(secret, token, origin)
    const actor: Actor = { id: owner.id, name: owner.name, role: 'owner', sessionId: '', operatorVersion: owner.version, branchRevision: limit?.version ?? 0, websiteIntake: { configId: settings.configId } }
    const c: Context = { s: structuredClone(before), actor, commandId, now: new Date().toISOString(), events: [], files: [], sql: [] }
    const phone = digits(input.phone)
    const hits = c.s.customers.filter(r => !r.erasedAt && !r.mergedInto && ((phone.length === 10 && digits(String(r.phone ?? '')) === phone) || input.email && String(r.email ?? '').toLowerCase() === input.email))
    // Ambiguous identity never attaches private photos to an arbitrary person.
    // The same generic refusal is returned without any matching details.
    if (hits.length > 1) fail('INTAKE_CONTACT', 'Please contact the business directly to submit this request.', null, 409)
    const customer = hits[0] ?? await setup(c, 'customer.save', { name: input.name, phone: input.phone, email: input.email }, env.DB) as any
    let site = c.s.sites.find(r => !r.erasedAt && r.customerId === customer.id && r.address.trim().toLowerCase() === input.address.toLowerCase())
    if (!site) {
      // Reuse the site's actual field normalizer without site.save's automatic
      // Maps lookup: intake sends no customer address to an external provider.
      const branchId = customer.branchId ?? c.s.sites.find(r => r.customerId === customer.id)?.branchId ?? null
      site = put(c.s, 'sites', { id: newId(), version: 1, createdAt: c.now, createdBy: owner.id, customerId: customer.id, branchId, ...siteFields({ address: input.address, zip: input.zip }) })
      event(c, { jobId: null, subjectKind: 'site', subjectId: site.id, kind: 'site.saved', summary: 'Website request recorded its service site', data: null })
    }
    const enquiry = await quotes(c, 'enquiry.create', { customerId: customer.id, siteId: site.id, source: 'website', description: `${input.service}: ${input.description}` }, env.DB) as any
    const photos = []
    for (const photo of input.photos) {
      const file = await image(c, photo, enquiry.id, 'photo'), bytes = c.files.at(-1)!.bytes
      const valid = photo.mediaType === 'image/png' ? [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)
        : photo.mediaType === 'image/webp' ? bytes.length >= 16 && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP'
        : bytes.length >= 12 && bytes.at(-2) === 255 && bytes.at(-1) === 217
      if (!valid) fail('FILE', 'The photo does not have a supported image signature.', null, 400)
      photos.push({ file, caption: photo.caption })
    }
    bump(c.s, 'enquiries', enquiry, { photos, intake: { service: input.service, preferredTimes: input.preferredTimes, source: input.source, contact: { name: input.name, phone: input.phone, email: input.email }, consent: { at: c.now, textVersion: 'website-request-v1' } } })
    put(c.s, 'notices', { id: newId(), version: 1, createdAt: c.now, to: ['owner', 'office'], enquiryId: enquiry.id, customerId: customer.id, branchId: recordBranch(c.s, site), jobId: null, message: `New website request: ${input.service}` })
    event(c, { jobId: null, subjectKind: 'enquiry', subjectId: enquiry.id, kind: 'intake.received', summary: 'Consented website request received; office notified in Glove', data: { photos: photos.length, notification: 'in-app', modelPhotos: false } })
    const receipt = newId()
    try { await commit(env.DB, c, before, 'intake.receive', digest, { receipt }) }
    catch {
      const won = await env.DB.prepare('SELECT digest,result FROM glove_commands WHERE id=? AND type=?').bind(commandId, 'intake.receive').first<{ digest: string; result: string }>()
      if (won?.digest === digest) return json({ ok: true, receipt: JSON.parse(won.result).result.receipt })
      return json({ ok: false, error: { code: 'INTAKE_CHANGED', message: 'The request was not confirmed. Refresh the form and complete a new challenge.' } }, 409)
    }
    return json({ ok: true, receipt })
  } catch (error) {
    if (error instanceof Problem) return json({ ok: false, error: { code: error.code, message: error.message } }, error.status)
    return json({ ok: false, error: { code: 'INTAKE_UNAVAILABLE', message: 'Website requests are unavailable. Please contact the business directly.' } }, 503)
  }
}
