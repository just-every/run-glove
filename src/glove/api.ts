import { runtimeBindings, type Bindings } from '../auth.server'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { allow, authority, currentActor, fieldRole, grantable, grants, mayRead, type Door } from './access'
import { Problem, fail, type Actor, type Context } from './model'
import { load, saved, commit } from './storage'
import { visible, visibleJobIds } from './view'
import { sourceReport } from './pipeline'
import { dashboard } from './dashboard'
import { propertyHistory } from './history'
import { setup } from './commands/setup'
import { quotes } from './commands/quotes'
import { dispatch } from './commands/dispatch'
import { field } from './commands/field'
import { invoices } from './commands/invoices'
import { equipment } from './commands/equipment'
import { expenses } from './commands/expenses'
import { merge } from './commands/merge'
import { pricebook } from './commands/pricebook'
import { calendar } from './commands/calendar'
import { time } from './commands/time'
import { forms } from './commands/forms'
import { stock } from './commands/stock'
import { purchasing } from './commands/purchasing'
import { series, extendSeries } from './commands/series'
import { assessments } from './commands/assessments'
import { rules, runRules } from './rules'
import { segments } from './commands/segments'
import { marketing } from './commands/marketing'
import { nameplates } from './commands/nameplates'
import { callbacks } from './commands/callbacks'
import { push } from './commands/push'
import { subcontract, necTotals, necCsv } from './subcontract'
import { suggest } from './commands/suggest'
import { notify, ownDevices } from './push'
import { callbackPack } from './callbacks'
import { members, segmentCsv, segmentOf } from './segments'
import { partsCheck } from './stock'
import { jobCosting, costingReport } from './costing'
import { report, reportCsv } from './reports'
import { watchMargins } from './margins'
import { priceBookCsv } from './pricebook'
import { duplicatesOf, mergeReview } from './duplicates'
import { grants as agentGrants, agentActions, useGrant, recordUse } from './commands/grants'
import { equipmentRecord, warrantyReport, refrigerantReport } from './equipment'
import { stage, journal, settle, refuseUndoing } from './movein/kit'
import { customersCsv } from './movein/csv'

// The public doors: GET /api/glove/state (what this role may see, with the
// latest 500 events for Activity), GET /api/glove/jobs/<id>/timeline (one
// job's whole timeline), GET /api/glove/files/<id>, GET /api/glove/exports/<id>.csv,
// GET /api/glove/export (whole business as JSON), GET /api/glove/customers.csv
// (every live customer with its contacts and sites, CUST-003), GET
// /api/glove/pricebook.csv (the price book with costs and markups, MONEY-003), GET /api/glove/reports/sources
// (the request pipeline and conversion and revenue by source), GET
// /api/glove/equipment/<id> (one unit's warranty, service history and refrigerant
// log), GET /api/glove/jobs/<id>/cost (the job's expenses and what they bill at),
// GET /api/glove/sites/<id>/history (one property's records, newest first),
// GET /api/glove/jobs/<id>/callback (a callback's gathered history and prepared
// checklists, AGENT-006), GET /api/glove/customers/<id>/duplicates (the merge review), GET
// /api/glove/technicians/<id>/calendar (the secret calendar address: owner or that technician only),
// GET /api/glove/push (FIELD-004: the VAPID public key and the signed-in person's own subscribed phones),
// GET /api/glove/reports/warranties, GET /api/glove/reports/refrigerant, GET
// /api/glove/dashboard (the owner's today, REPORT-001), GET
// /api/glove/parts?date=&technicianId= (the day's parts check, STOCK-001), and
// POST /api/glove/commands {commandId, type, payload}. Every door checks the
// current session and role itself; a command re-checks both inside the batch
// that commits it. The same commandId and payload replays the first outcome.

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
const families = [setup, pricebook, calendar, quotes, dispatch, series, assessments, rules, segments, marketing, field, time, forms, stock, purchasing, invoices, equipment, nameplates, callbacks, suggest, push, subcontract, expenses, agentGrants, merge]

function readRole(actor: Actor, door: Door) {
  if (!mayRead(actor, door)) fail('FORBIDDEN', `Your role (${actor.custom?.name ?? actor.role}) cannot read this.`, null, 403)
}

/** Reads also confirm the session and role are still current in the database. */
async function current(db: D1Database, actor: Actor) {
  const a = authority(actor)
  const ok = await db.prepare(`SELECT CASE WHEN (${a.sql}) THEN 1 ELSE 0 END AS ok`).bind(...a.params).first<{ ok: number }>()
  if (!ok?.ok) fail('AUTH', 'Your session or role changed. Sign in again.', null, 401)
}

const eventColumns = 'id,sequence,at,actor_id AS actorId,actor_name AS actorName,actor_role AS actorRole,command_id AS commandId,job_id AS jobId,subject_kind AS subjectKind,subject_id AS subjectId,kind,summary'
/** A technician reads only the field side of their own jobs' timelines; quotes, proposals and invoices carry prices. A custom role without reports.read does not read expense costs. */
const fieldKinds = new Set(['job', 'visit', 'capture', 'time'])
const readable = (actor: Actor, jobs: Set<string>) => (e: { jobId: string | null; subjectKind: string }) =>
  actor.role === 'subcontractor' ? false : actor.role === 'technician' ? !!e.jobId && jobs.has(e.jobId) && fieldKinds.has(e.subjectKind) : !['expense', 'warning', 'purchaseOrder'].includes(e.subjectKind) || mayRead(actor, 'reports')

async function read(url: URL, env: Bindings, actor: Actor): Promise<Response> {
  const db = env.DB
  await current(db, actor)
  const s = await load(db)
  if (url.pathname === '/api/glove/state') {
    readRole(actor, 'state')
    const view = visible(s, actor)
    const jobs = visibleJobIds(view)
    const events = (await db.prepare(`SELECT ${eventColumns} FROM glove_events ORDER BY sequence DESC LIMIT 500`).all<any>()).results.filter(readable(actor, jobs))
    const operators = actor.role === 'owner' ? (await db.prepare("SELECT o.id,o.email,o.display_name AS name,o.status,o.role AS nativeRole,r.role FROM oa_operators o LEFT JOIN glove_roles r ON r.operator_id=o.id ORDER BY o.display_name").all()).results : []
    return json({ ...view, actor: { id: actor.id, name: actor.name, role: actor.role, roleName: actor.custom?.name ?? null, ...grants(actor) }, events, operators, ...(actor.role === 'owner' ? { grantable } : {}) })
  }
  const timeline = /^\/api\/glove\/jobs\/([A-Za-z0-9-]{1,80})\/timeline$/.exec(url.pathname)
  if (timeline) {
    readRole(actor, 'state')
    const jobs = visibleJobIds(visible(s, actor))
    if (!jobs.has(timeline[1])) fail('NOT_FOUND', 'No such job for you.', null, 404)
    const events = (await db.prepare(`SELECT ${eventColumns} FROM glove_events WHERE job_id=? ORDER BY sequence`).bind(timeline[1]).all<any>()).results.filter(readable(actor, jobs))
    return json({ events })
  }
  const file = /^\/api\/glove\/files\/([0-9a-f-]{36})$/.exec(url.pathname)
  if (file) {
    readRole(actor, 'file')
    const row = await db.prepare('SELECT capture_id AS captureId,media_type AS mediaType,bytes FROM glove_files WHERE id=?').bind(file[1]).first<any>()
    // Field files belong to a capture; equipment photos to the unit at a site; receipts to an expense; price-book images to their item.
    const capture = row && s.captures.find(x => x.id === row.captureId), unit = row && s.equipment.find(x => x.id === row.captureId), expense = row && s.expenses.find(x => x.id === row.captureId), item = row && s.services.find(x => x.id === row.captureId)
    // FIELD-006: a nameplate photo belongs to its reading, and to the unit once confirmed.
    const plate = row && s.nameplates.find(x => x.id === row.captureId)
    const view = fieldRole(actor) ? visible(s, actor) : null
    if (plate) {
      if (view && !view.nameplates.some(x => x.id === plate.id) && !view.equipment.some(x => x.id === plate.equipmentId)) fail('NOT_FOUND', 'No such file for you.', null, 404)
      return new Response(new Uint8Array(row.bytes), { headers: { ...headers, 'content-type': row.mediaType, 'content-security-policy': "default-src 'none'" } })
    }
    // MONEY-002: the business logo is for everyone signed in.
    const allowed = row?.captureId === 'business' ? s.business[0]?.logo?.fileId === file[1] : capture ? (!view || (actor.role === 'subcontractor' ? view.captures.some(x => x.id === capture.id) : visibleJobIds(view).has(capture.jobId))) : unit ? (!view || view.equipment.some(x => x.id === unit.id)) : expense ? (!view || view.expenses.some(x => x.id === expense.id)) : !!item
    if (!allowed) fail('NOT_FOUND', 'No such file for you.', null, 404)
    return new Response(new Uint8Array(row.bytes), { headers: { ...headers, 'content-type': row.mediaType, 'content-security-policy': "default-src 'none'" } })
  }
  const csv = /^\/api\/glove\/exports\/([0-9a-f-]{36})\.csv$/.exec(url.pathname)
  if (csv) {
    readRole(actor, 'export')
    const exported = s.exports.find(x => x.id === csv[1]) ?? fail('NOT_FOUND', 'No such export.', null, 404)
    return new Response(exported.csv, { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${exported.number}.csv"` } })
  }
  const cost = /^\/api\/glove\/jobs\/([A-Za-z0-9-]{1,80})\/cost$/.exec(url.pathname)
  if (cost) {
    readRole(actor, 'reports')
    return json(jobCosting(s, s.jobs.find(j => j.id === cost[1]) ?? fail('NOT_FOUND', 'No such job.', null, 404)))
  }
  const history = /^\/api\/glove\/sites\/([A-Za-z0-9-]{1,80})\/history$/.exec(url.pathname)
  if (history) {
    readRole(actor, 'state')
    const view = visible(s, actor)
    const site = view.sites.find(x => x.id === history[1]) ?? fail('NOT_FOUND', 'No such site for you.', null, 404)
    return json({ site, entries: propertyHistory(view, site) })
  }
  const secret = /^\/api\/glove\/technicians\/([A-Za-z0-9-]{1,80})\/calendar$/.exec(url.pathname)
  if (secret) {
    const tech = s.technicians.find(x => x.id === secret[1]) ?? fail('NOT_FOUND', 'No such technician.', null, 404)
    if (actor.role !== 'owner' && tech.operatorId !== actor.id) fail('FORBIDDEN', 'Only the owner and this technician read their calendar address.', null, 403)
    const row = await db.prepare("SELECT value AS url,set_at AS setAt FROM glove_secrets WHERE technician_id=? AND kind='ical'").bind(tech.id).first()
    return json(row ?? { url: null })
  }
  if (url.pathname === '/api/glove/push') {
    readRole(actor, 'state')
    return json({ publicKey: s.business[0]?.webPush?.publicKey ?? null, devices: await ownDevices(db, actor) })
  }
  const review = /^\/api\/glove\/customers\/([A-Za-z0-9-]{1,80})\/duplicates$/.exec(url.pathname)
  if (review) {
    readRole(actor, 'state')
    if (fieldRole(actor)) fail('FORBIDDEN', 'The desk reviews duplicate customers.', null, 403)
    return json(mergeReview(s, s.customers.find(x => x.id === review[1]) ?? fail('NOT_FOUND', 'No such customer.', null, 404)))
  }
  // AGENT-006: a callback job's gathered history and its prepared checklists, for whoever sees the job.
  const callback = /^\/api\/glove\/jobs\/([A-Za-z0-9-]{1,80})\/callback$/.exec(url.pathname)
  if (callback) {
    readRole(actor, 'state')
    const view = visible(s, actor)
    if (actor.role === 'subcontractor') fail('FORBIDDEN', 'Callback history is for technicians and the desk.', null, 403)
    const job = view.jobs.find(j => j.id === callback[1]) ?? fail('NOT_FOUND', 'No such job for you.', null, 404)
    const full = s.jobs.find(j => j.id === job.id)!
    return json({ callback: full.callback ?? null, pack: full.callback ? callbackPack(s, full, new Date().toISOString()) : null, diagnoses: view.diagnoses.filter(d => d.jobId === job.id) })
  }
  const unit = /^\/api\/glove\/equipment\/([A-Za-z0-9-]{1,80})$/.exec(url.pathname)
  if (unit) {
    readRole(actor, 'state')
    const view = visible(s, actor)
    const row = view.equipment.find(x => x.id === unit[1]) ?? fail('NOT_FOUND', 'No such equipment for you.', null, 404)
    return json(equipmentRecord(s, row, view.jobs, new Date().toISOString()))
  }
  if (url.pathname === '/api/glove/reports/warranties') {
    readRole(actor, 'reports')
    return json(warrantyReport(s, new Date().toISOString()))
  }
  if (url.pathname === '/api/glove/reports/refrigerant') {
    readRole(actor, 'reports')
    const from = url.searchParams.get('from') ?? '', to = url.searchParams.get('to') ?? ''
    if (![from, to].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || from > to) fail('INPUT', 'Give the period as from=YYYY-MM-DD&to=YYYY-MM-DD.', null, 400)
    return json(refrigerantReport(s, from, to))
  }
  if (url.pathname === '/api/glove/parts') {
    // STOCK-001: one technician's parts check for a local date; a technician reads only their own.
    readRole(actor, 'state')
    if (actor.role === 'subcontractor') fail('FORBIDDEN', 'Parts checks are for technicians and the desk.', null, 403)
    const date = url.searchParams.get('date') ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('INPUT', 'Give the day as date=YYYY-MM-DD.', null, 400)
    const me = s.technicians.find(t => t.operatorId === actor.id)
    const technicianId = actor.role === 'technician' ? me?.id ?? fail('TECHNICIAN', 'Your sign-in is not linked to a technician yet.', null, 403) : url.searchParams.get('technicianId') ?? ''
    if (!s.technicians.some(t => t.id === technicianId)) fail('NOT_FOUND', 'No such technician.', null, 404)
    return json(partsCheck(s, technicianId, date))
  }
  if (url.pathname === '/api/glove/dashboard') {
    readRole(actor, 'reports')
    return json(dashboard(s, new Date().toISOString()))
  }
  if (url.pathname === '/api/glove/reports/costing') {
    readRole(actor, 'reports')
    const from = url.searchParams.get('from') ?? '', to = url.searchParams.get('to') ?? ''
    if (![from, to].every(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) || from > to) fail('INPUT', 'Give the period as from=YYYY-MM-DD&to=YYYY-MM-DD.', null, 400)
    return json(costingReport(s, from, to))
  }
  // REPORT-002: /api/glove/reports/<revenue|technicians|sources|quotes|margins|tax>.(json|csv)?from&to and one filter.
  const named = /^\/api\/glove\/reports\/(revenue|technicians|sources|quotes|margins|tax)\.(json|csv)$/.exec(url.pathname)
  if (named) {
    readRole(actor, 'reports')
    const q = (k: string) => url.searchParams.get(k) || undefined
    const r = report(s, named[1], url.searchParams.get('from') ?? '', url.searchParams.get('to') ?? '', { jobType: q('jobType'), technicianId: q('technicianId'), source: q('source') })
    if (named[2] === 'json') return json(r)
    return new Response(reportCsv(r), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="glove-${named[1]}-${r.from}-${r.to}.csv"` } })
  }
  // CUST-004: a segment's members (the desk) and their CSV (owner and office, like customers.csv).
  const segment = /^\/api\/glove\/segments\/([A-Za-z0-9-]{1,80})(\.csv)?$/.exec(url.pathname)
  if (segment) {
    if (fieldRole(actor)) fail('FORBIDDEN', 'Segments are the desk\'s.', null, 403)
    readRole(actor, segment[2] ? 'export' : 'state')
    const row = segmentOf(s, segment[1])
    if (segment[2]) return new Response(segmentCsv(s, row), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="glove-segment-${row.id}.csv"` } })
    return json({ segment: row, members: members(s, row).map(c => ({ id: c.id, name: c.name, email: c.email ?? null, tags: c.tags ?? [] })) })
  }
  // DISP-007: a calendar year's 1099-NEC totals for subcontractors (owner and office, like the other exports).
  const nec = /^\/api\/glove\/reports\/1099\.(json|csv)$/.exec(url.pathname)
  if (nec) {
    readRole(actor, 'export')
    const r = necTotals(s, url.searchParams.get('year') ?? '')
    if (nec[1] === 'json') return json(r)
    return new Response(necCsv(r), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="glove-1099-nec-totals-${r.year}.csv"` } })
  }
  if (url.pathname === '/api/glove/reports/sources') {
    readRole(actor, 'reports')
    return json(sourceReport(s, new Date().toISOString()))
  }
  if (url.pathname === '/api/glove/pricebook.csv') {
    readRole(actor, 'export')
    return new Response(priceBookCsv(s), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="glove-price-book.csv"' } })
  }
  if (url.pathname === '/api/glove/customers.csv') {
    readRole(actor, 'export')
    return new Response(customersCsv(s), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="glove-customers.csv"' } })
  }
  if (url.pathname === '/api/glove/export') {
    readRole(actor, 'export')
    const events = (await db.prepare('SELECT * FROM glove_events ORDER BY sequence').all()).results
    const files = (await db.prepare('SELECT id,capture_id AS captureId,media_type AS mediaType,size,sha256,created_at AS createdAt FROM glove_files ORDER BY created_at,id').all()).results
    return json({ format: 'glove-business-v1', currency: 'AUD', exportedAt: new Date().toISOString(), ...s, imports: s.imports.map(({ files: _f, ...rest }) => rest), timeline: events, files })
  }
  return fail('NOT_FOUND', 'Unknown endpoint.', null, 404)
}

async function command(request: Request, env: Bindings, actor: Actor): Promise<Response> {
  if (request.headers.get('origin') !== new URL(env.AUTH_ORIGIN).origin) fail('ORIGIN', 'Send commands from this installation.', null, 403)
  if (!request.headers.get('content-type')?.includes('application/json')) fail('CONTENT_TYPE', 'Use application/json.', null, 400)
  const raw = await request.text()
  if (raw.length > 2_500_000) fail('SIZE', 'A command is at most 2.5 MB.', null, 413)
  let body: any
  try { body = JSON.parse(raw) } catch { return fail('JSON', 'Malformed JSON.', null, 400) }
  const { commandId, type, payload } = body ?? {}
  if (typeof commandId !== 'string' || !/^[-a-zA-Z0-9_]{8,100}$/.test(commandId) || typeof type !== 'string') fail('COMMAND', 'Send a unique commandId and a command type.', null, 400)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('INPUT', 'payload is an object.', null, 400)
  // An agent books or moves visits only under the owner's grant (AGENT-009), checked against the records below.
  const granted = actor.role === 'agent' && (agentActions as readonly string[]).includes(type)
  if (!granted) allow(actor, type)
  const digest = sha256(canonicalJson({ type, payload }))
  const previous = await saved(env.DB, commandId, digest, actor)
  if (previous) return json(previous)
  // A lost optimistic race recomputes from the current records; a stale
  // record version the person saw is still refused by the command itself.
  for (let attempt = 0; attempt < 6; attempt++) {
    let before = await load(env.DB)
    const fresh = (): Context => ({ s: structuredClone(before), actor, commandId, now: new Date().toISOString(), events: [], files: [], sql: [], local: env.AUTH_LOCAL === 'true' })
    let c = fresh(), result: unknown
    if (actor.role === 'agent' && before.business[0]?.agentsPaused) fail('PAUSED', 'The owner has paused every agent.', null, 403)
    if (granted) c.grant = useGrant(c, type, payload)
    if (type === 'import.commit' || type === 'import.undo') {
      const outcome = await journal(env.DB, c, type, payload)
      before = await load(env.DB)
      c = fresh()
      result = settle(c, type, outcome)
    } else if (type === 'import.stage') result = await stage(env.DB, c, payload)
    else for (const family of families) if ((result = await family(c, type, payload, env.DB)) !== undefined) break
    if (result === undefined) fail('COMMAND', 'Unknown command type.', { type }, 400)
    if (c.grant) recordUse(c, (result as { id: string }).id)
    // API-005: rules on the events this command raised, each as its creator.
    await runRules(c, env.DB, async (as, t, p) => { for (const family of families) { const r = await family(as, t, p, env.DB); if (r !== undefined) return r } })
    // PLAN-001: every change rolls recurring jobs' horizons forward.
    extendSeries(c)
    // COST-005: every change re-checks open jobs' costs against the owner's thresholds.
    watchMargins(c)
    await refuseUndoing(env.DB, before, c)
    let committed
    try { committed = await commit(env.DB, c, before, type, digest, result) }
    catch (error) {
      const replay = await saved(env.DB, commandId, digest, actor)
      if (replay) return json(replay)
      if ((await load(env.DB)).version !== before.version) continue
      await current(env.DB, actor)
      throw error
    }
    // FIELD-004: once committed, each technician whose schedule changed gets one push per phone.
    await notify(env, before, c)
    return json(committed)
  }
  return fail('BUSY', 'Records kept changing. Send the same command again.', null, 409)
}

export async function gloveResponse(request: Request, original: Bindings): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/glove/')) return null
  try {
    const env = runtimeBindings(original), actor = await currentActor(request, env)
    if (request.method === 'GET') return await read(url, env, actor)
    if (request.method === 'POST' && url.pathname === '/api/glove/commands') return await command(request, env, actor)
    return fail('METHOD', 'Use GET for reads and POST /api/glove/commands for changes.', null, 405)
  } catch (error) {
    if (error instanceof Problem) return json({ ok: false, error: { code: error.code, message: error.message, details: error.details } }, error.status)
    if (error instanceof Error && /IMPORT_|NATIVE_EDIT|TARGET_REVISION|SOURCE_ID/.test(error.message)) return json({ ok: false, error: { code: error.message.split(':')[0], message: 'The move-in journal refused this step. Records changed in Glove since the move-in conflict with it; review them first.', details: { reason: error.message } } }, 409)
    console.error('glove command failed', error)
    return json({ ok: false, error: { code: 'UNCONFIRMED', message: 'The outcome is not confirmed. Send the same command again to recover its recorded result.' } }, 500)
  }
}
