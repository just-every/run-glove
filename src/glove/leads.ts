import type { Bindings } from '../auth.server'
import { basic, hash } from './mail-callbacks'
import { Problem, fail, bump, event, type Actor, type Context, type Row } from './model'
import { load, commit } from './storage'
import { setup } from './commands/setup'
import { quotes } from './commands/quotes'
import { runRules } from './rules'
import { sha256, canonicalJson } from '../modules/import-kit/src/d1/index'

// BOOK-004: leads from Google Local Services Ads, Angi, Thumbtack and Yelp
// land as requests with their source and cost. Angi and Thumbtack post the
// whole lead to Glove; Yelp posts a notice naming the lead, which Glove reads
// from Yelp's Leads API; Google's Local Services leads are read from the
// Google Ads API (no push exists) on every scheduled run and on demand. Each
// lead matches an existing customer by exact phone or email (one match only),
// or becomes a new customer and site, and queues an acknowledgment due within
// the owner's response window. Lead doors authenticate before reading the
// body, as COMM-001's unsigned callbacks do: HTTPS Basic user "glove" with a
// per-provider password shown once and kept only as its SHA-256 hash; every
// failure answers the same 401, writes nothing and counts toward 429.

export const providers = ['google', 'angi', 'thumbtack', 'yelp'] as const
export type Provider = (typeof providers)[number]
export const providerLabel: Record<Provider, string> = { google: 'Google Local Services', angi: 'Angi', thumbtack: 'Thumbtack', yelp: 'Yelp' }
export type Lead = { provider: Provider; providerLeadId: string; at: string | null; name: string; phone: string; email: string; address: string; zip: string; description: string; cost: string | null }

const YELP = 'https://api.yelp.com/v3/leads/'
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token'
// The Google Ads API version Glove reads Local Services leads with.
const GOOGLE_ADS = 'https://googleads.googleapis.com/v24/customers/'
const WEEK = 7 * 86_400_000

const requireThat: (ok: unknown) => asserts ok = ok => { if (!ok) throw new Error('Invalid lead') }
const str = (v: unknown, max = 2000) => typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : ''
const id = (v: unknown) => { const s = str(v, 200); requireThat(s.length > 0 && !/[\x00-\x1f]/.test(s)); return s }
const money = (v: unknown) => { const s = str(v, 20).replace(/^\$/, ''); return /^\d{1,7}(\.\d{1,2})?$/.test(s) ? (Number(s) > 0 ? Number(s).toFixed(2) : null) : null }
const when = (v: unknown) => { const s = str(v, 40).replace(' ', 'T'); const ms = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`); return s && Number.isFinite(ms) ? new Date(ms).toISOString() : null }
const zipOf = (v: unknown) => /^\d{5}/.exec(str(v, 20))?.[0] ?? ''

/** Thumbtack Partner API v4 NegotiationCreatedV4 webhook body. */
function thumbtack(body: any): Lead {
  const d = body?.data, c = d?.customer, r = d?.request, l = r?.location ?? {}
  requireThat(d && typeof d === 'object' && c && r)
  return { provider: 'thumbtack', providerLeadId: id(d.negotiationID), at: when(d.createTimestamp), name: [str(c.firstName, 100), str(c.lastName, 100)].filter(Boolean).join(' ') || 'Thumbtack customer', phone: str(c.phone, 40), email: '', address: [str(l.address1, 200), str(l.address2, 100), str(l.city, 100), [str(l.state, 20), str(l.zipCode, 20)].filter(Boolean).join(' ')].filter(Boolean).join(', '), zip: zipOf(l.zipCode), description: [str(r.category?.name, 200), str(r.description, 3000)].filter(Boolean).join(': ') || 'Thumbtack request', cost: money(d.leadPrice) }
}

/** Angi (HomeAdvisor) lead delivery body, as Angi's CRM integration posts it. */
function angi(body: any): Lead {
  requireThat(body && typeof body === 'object' && !Array.isArray(body))
  const zip = zipOf(body.postalCode)
  return { provider: 'angi', providerLeadId: id(body.leadOid ?? body.srOid), at: when(body.createDate), name: [str(body.firstName, 100), str(body.lastName, 100)].filter(Boolean).join(' ') || 'Angi customer', phone: str(body.primaryPhone ?? body.secondaryPhone, 40), email: str(body.email, 200), address: [str(body.address, 200), str(body.city, 100), [str(body.stateProvince, 20), str(body.postalCode, 20)].filter(Boolean).join(' ')].filter(Boolean).join(', '), zip, description: [str(body.taskName, 200), str(body.comments, 3000)].filter(Boolean).join(': ') || 'Angi request', cost: null }
}

/** One lead read from Yelp's Leads API (GET /v3/leads/{id}). */
function yelp(body: any): Lead {
  requireThat(body && typeof body === 'object')
  const p = body.project ?? {}, answers = Array.isArray(p.survey_answers) ? p.survey_answers.map((a: any) => `${str(a.question_text, 200)} ${[].concat(a.answer_text ?? []).map(x => str(x, 200)).join(', ')}`.trim()) : []
  return { provider: 'yelp', providerLeadId: id(body.id), at: when(body.time_created), name: str(body.user?.display_name, 100) || 'Yelp customer', phone: str(body.phone_number, 40), email: str(body.temporary_email_address, 200), address: zipOf(p.location?.postal_code), zip: zipOf(p.location?.postal_code), description: [[].concat(p.job_names ?? []).map(x => str(x, 200)).join(', '), ...answers, str(p.additional_info, 2000)].filter(Boolean).join('; ') || 'Yelp request', cost: null }
}

/** One Local Services lead from a Google Ads API search row. */
function google(row: any): Lead {
  const l = row?.localServicesLead, contact = l?.contactDetails ?? {}
  requireThat(l && typeof l === 'object')
  const category = str(l.categoryId, 200).replace(/^xcat:(service_area_business_)?/, '').replace(/_/g, ' ')
  return { provider: 'google', providerLeadId: id(l.id), at: when(l.creationDateTime), name: str(contact.consumerName, 100) || 'Google customer', phone: str(contact.phoneNumber, 40), email: str(contact.email, 200), address: '', zip: '', description: `${category || 'Local Services'} ${str(l.leadType, 40).toLowerCase().replace('_', ' ') || 'lead'} from Google Local Services`, cost: null }
}

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '').slice(-10)

/** An existing customer with exactly this phone or email, when exactly one has it. */
function match(c: Context, lead: Lead) {
  const phone = digits(lead.phone), email = lead.email.toLowerCase()
  const hits = c.s.customers.filter(x => !x.erasedAt && !x.mergedInto && ((phone.length === 10 && digits(x.phone) === phone) || (email && String(x.email ?? '').toLowerCase() === email)))
  return hits.length === 1 ? hits[0] : null
}

/** A lead becomes a request from its source, for a matched or new customer, with its acknowledgment queued. */
export async function land(c: Context, db: D1Database, lead: Lead) {
  const b = c.s.business[0] ?? fail('BUSINESS', 'The owner sets up the business first.')
  const settings = b.leads?.[lead.provider] ?? fail('LEADS', `${providerLabel[lead.provider]} is not connected.`, null, 404)
  // The same lead arriving again (a retried post, a scheduled and an on-demand read) lands once.
  if (c.s.enquiries.some(e => e.lead?.provider === lead.provider && e.lead.providerLeadId === lead.providerLeadId)) return null
  const existing = match(c, lead)
  const customer = existing ?? await setup(c, 'customer.save', { name: lead.name, ...(lead.phone ? { phone: lead.phone } : {}), ...(lead.email ? { email: lead.email } : {}) }, db) as Row
  const sameSite = lead.address ? c.s.sites.find(x => x.customerId === customer.id && x.address.toLowerCase() === lead.address.toLowerCase()) : null
  const site = sameSite ?? (lead.address ? await setup(c, 'site.save', { customerId: customer.id, address: lead.address, ...(lead.zip ? { zip: lead.zip } : {}) }, db) as Row : null)
  const request = await quotes(c, 'enquiry.create', { customerId: customer.id, ...(site ? { siteId: site.id } : {}), description: lead.description, source: lead.provider }, db) as Row
  const receivedAt = c.now, dueBy = new Date(Date.parse(receivedAt) + settings.respondWithinMinutes * 60_000).toISOString()
  const row = bump(c.s, 'enquiries', c.s.enquiries.find(e => e.id === request.id)!, {
    lead: { provider: lead.provider, providerLeadId: lead.providerLeadId, providerTime: lead.at, receivedAt, matched: existing ? 'existing' : 'new' },
    ...(lead.cost ? { leadCost: { amount: lead.cost, by: 'provider', at: c.now } } : {}),
    acknowledgment: { status: 'queued', channel: providerLabel[lead.provider], text: settings.acknowledgment.replace(/\{business\}/g, b.name), dueBy },
  })
  event(c, { jobId: null, subjectKind: 'enquiry', subjectId: row.id, kind: 'lead.received', summary: `${providerLabel[lead.provider]} lead ${existing ? `matched to ${customer.name}` : `from new customer ${customer.name}`}${lead.cost ? ` at $${lead.cost}` : ''}; acknowledgment queued, due ${dueBy}`, data: { provider: lead.provider, providerLeadId: lead.providerLeadId, matched: existing ? 'existing' : 'new', cost: lead.cost } })
  return row
}

/** A lead feed acts only while its provider stays connected (storage re-checks this inside the commit). */
const feed = (provider: Provider): Actor => ({ id: `lead:${provider}`, name: `${providerLabel[provider]} lead feed`, role: 'provider' as Actor['role'], sessionId: '', operatorVersion: 0, leadFeed: provider })

/** Land each new lead once, under the feed's authority, with workflow rules on the requests it made. */
export async function receive(db: D1Database, provider: Provider, leads: Lead[]) {
  let landed = 0
  for (const lead of leads) {
    if (lead.at && Date.parse(lead.at) < Date.now() - WEEK) continue
    const commandId = `lead-${provider}-${(await hash(lead.providerLeadId)).slice(0, 40)}`
    if (await db.prepare('SELECT 1 FROM glove_commands WHERE id=?').bind(commandId).first()) continue
    for (let attempt = 0; attempt < 6; attempt++) {
      const before = await load(db)
      const c: Context = { s: structuredClone(before), actor: feed(provider), commandId, now: new Date().toISOString(), events: [], files: [], sql: [] }
      const row = await land(c, db, lead)
      if (!row) break
      await runRules(c, db, async () => fail('RULE', 'A lead runs no booking rules.'))
      try { await commit(db, c, before, 'lead.receive', sha256(canonicalJson(lead)), { id: row.id, provider }); landed++; break }
      catch (error) {
        if (await db.prepare('SELECT 1 FROM glove_commands WHERE id=?').bind(commandId).first()) break
        if ((await load(db)).version !== before.version) continue
        throw error
      }
    }
  }
  return landed
}

async function call(url: string, init: RequestInit, what: string) {
  let res: Response
  try { res = await fetch(url, { ...init, redirect: 'manual' }) } catch { return fail('LEADS', `${what} could not be reached.`, { status: 0 }, 502) }
  if (!res.ok) fail('LEADS', `${what} refused the request (HTTP ${res.status}).`, { status: res.status }, 502)
  return res.json().catch(() => fail('LEADS', `${what} answered outside its documented form.`, null, 502)) as Promise<any>
}

const key = async (db: D1Database, provider: string) => (await db.prepare('SELECT value FROM glove_provider_keys WHERE provider=?').bind(`leads-${provider}`).first<{ value: string }>())?.value ?? null

/** Google's Local Services leads created in the last week, from the Google Ads API; those already landed are skipped. */
export async function googleLeads(db: D1Database): Promise<Lead[]> {
  const secret = await key(db, 'google')
  if (!secret) return []
  const g = JSON.parse(secret) as { customerId: string; developerToken: string; clientId: string; clientSecret: string; refreshToken: string }
  const token = await call(GOOGLE_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: g.clientId, client_secret: g.clientSecret, refresh_token: g.refreshToken, grant_type: 'refresh_token' }) }, 'Google sign-in')
  if (typeof token?.access_token !== 'string') fail('LEADS', 'Google sign-in answered outside its documented form.', null, 502)
  const from = new Date(Date.now() - WEEK).toISOString().slice(0, 19).replace('T', ' ')
  const query = `SELECT local_services_lead.id, local_services_lead.category_id, local_services_lead.contact_details, local_services_lead.lead_type, local_services_lead.lead_status, local_services_lead.creation_date_time, local_services_lead.lead_charged FROM local_services_lead WHERE local_services_lead.creation_date_time >= '${from}' ORDER BY local_services_lead.creation_date_time`
  const page = await call(`${GOOGLE_ADS}${g.customerId}/googleAds:search`, { method: 'POST', headers: { authorization: `Bearer ${token.access_token}`, 'developer-token': g.developerToken, 'login-customer-id': g.customerId, 'content-type': 'application/json' }, body: JSON.stringify({ query }) }, 'The Google Ads API')
  return (Array.isArray(page?.results) ? page.results : []).flatMap((row: any) => { try { return [google(row)] } catch { return [] } })
}

/** The scheduled run reads Google's new leads while Google is connected. */
export async function pullGoogle(db: D1Database) {
  const s = await load(db)
  if (!s.business[0]?.leads?.google) return 0
  return receive(db, 'google', await googleLeads(db))
}

const doorHeaders = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const answer = (body: unknown, status = 200) => Response.json(body, { status, headers: doorHeaders })
// Rejections never write to D1: a bounded Worker-local allowance per address, as COMM-001's callbacks keep.
const failures = new WeakMap<D1Database, Map<string, { minute: number; count: number }>>()
function reject(request: Request, db: D1Database) {
  let ips = failures.get(db); if (!ips) failures.set(db, ips = new Map())
  const minute = Math.floor(Date.now() / 60_000), ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  for (const [k, v] of ips) if (v.minute !== minute) ips.delete(k)
  if (ips.size >= 4096 && !ips.has(ip)) ips.delete(ips.keys().next().value!)
  const entry = ips.get(ip) ?? { minute, count: 0 }; entry.count++; ips.set(ip, entry)
  console.warn('Lead post rejected')
  return answer({ ok: false, error: { code: 'LEAD', message: 'Not accepted: the credentials or the lead did not match.' } }, entry.count > 20 ? 429 : 401)
}

/** POST /api/glove/leads/<angi|thumbtack|yelp>: a provider posts a lead (Yelp: a notice naming leads). */
export async function leadDoor(request: Request, env: Bindings): Promise<Response | null> {
  const path = /^\/api\/glove\/leads\/(angi|thumbtack|yelp)$/.exec(new URL(request.url).pathname)
  if (!path) return null
  const provider = path[1] as Provider, db = env.DB
  if (request.method !== 'POST') return answer({ ok: false, error: { code: 'METHOD', message: 'Providers post leads here.' } }, 405)
  const secret = await db.prepare('SELECT hash FROM glove_lead_secrets WHERE provider=?').bind(provider).first<{ hash: string }>()
  if (!secret) return answer({ ok: false, error: { code: 'LEADS', message: 'This lead source is not connected here.' } }, 404)
  let leads: Lead[]
  try {
    await basic(request, { current_hash: secret.hash, previous_hash: null, previous_until: null, verified_at: null }, false, Date.now())
    if (Number(request.headers.get('content-length') ?? 0) > 262_144) return reject(request, db)
    const raw = await request.text(); if (raw.length > 262_144) return reject(request, db)
    const body = JSON.parse(raw)
    if (provider === 'yelp') {
      const updates = body?.data?.updates
      requireThat(Array.isArray(updates) && updates.length > 0 && updates.length <= 50)
      leads = []
      for (const u of updates.filter((x: any) => x?.event_type === 'NEW_EVENT')) leads.push(yelp(await yelpLead(db, id(u.lead_id))))
    } else leads = [(provider === 'thumbtack' ? thumbtack : angi)(body)]
    for (const lead of leads) requireThat(!lead.at || Date.parse(lead.at) >= Date.now() - WEEK)
  } catch (error) {
    if (error instanceof Problem) return answer({ ok: false, error: { code: error.code, message: error.message } }, error.status)
    return reject(request, db)
  }
  await receive(db, provider, leads)
  return answer({ ok: true })
}

async function yelpLead(db: D1Database, leadId: string) {
  const token = await key(db, 'yelp') ?? fail('LEADS', 'The owner connects Yelp\'s Leads API key first.', null, 404)
  return call(`${YELP}${encodeURIComponent(leadId)}`, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } }, 'Yelp\'s Leads API')
}
