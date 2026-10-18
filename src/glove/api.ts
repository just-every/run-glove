import { runtimeBindings, type Bindings } from '../auth.server'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { allow, authority, currentActor, reads } from './access'
import { Problem, fail, type Actor, type Context } from './model'
import { load, saved, commit } from './storage'
import { visible, visibleJobIds } from './view'
import { sourceReport } from './pipeline'
import { setup } from './commands/setup'
import { quotes } from './commands/quotes'
import { dispatch } from './commands/dispatch'
import { field } from './commands/field'
import { invoices } from './commands/invoices'
import { stage, journal, settle, refuseUndoing } from './movein/kit'

// The public doors: GET /api/glove/state (what this role may see, with the
// latest 500 events for Activity), GET /api/glove/jobs/<id>/timeline (one
// job's whole timeline), GET /api/glove/files/<id>, GET /api/glove/exports/<id>.csv,
// GET /api/glove/export (whole business as JSON), GET /api/glove/reports/sources
// (the request pipeline and conversion and revenue by source), and
// POST /api/glove/commands {commandId, type, payload}. Every door checks the
// current session and role itself; a command re-checks both inside the batch
// that commits it. The same commandId and payload replays the first outcome.

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
const families = [setup, quotes, dispatch, field, invoices]

function readRole(actor: Actor, allowed: readonly string[]) {
  if (!allowed.includes(actor.role)) fail('FORBIDDEN', `Your role (${actor.role}) cannot read this.`, null, 403)
}

/** Reads also confirm the session and role are still current in the database. */
async function current(db: D1Database, actor: Actor) {
  const a = authority(actor)
  const ok = await db.prepare(`SELECT CASE WHEN (${a.sql}) THEN 1 ELSE 0 END AS ok`).bind(...a.params).first<{ ok: number }>()
  if (!ok?.ok) fail('AUTH', 'Your session or role changed. Sign in again.', null, 401)
}

const eventColumns = 'id,sequence,at,actor_id AS actorId,actor_name AS actorName,actor_role AS actorRole,command_id AS commandId,job_id AS jobId,subject_kind AS subjectKind,subject_id AS subjectId,kind,summary'
/** A technician reads only the field side of their own jobs' timelines; quotes, proposals and invoices carry prices. */
const fieldKinds = new Set(['job', 'visit', 'capture'])
const readable = (actor: Actor, jobs: Set<string>) => (e: { jobId: string | null; subjectKind: string }) =>
  actor.role !== 'technician' || (!!e.jobId && jobs.has(e.jobId) && fieldKinds.has(e.subjectKind))

async function read(url: URL, env: Bindings, actor: Actor): Promise<Response> {
  const db = env.DB
  await current(db, actor)
  const s = await load(db)
  if (url.pathname === '/api/glove/state') {
    readRole(actor, reads.state)
    const view = visible(s, actor)
    const jobs = visibleJobIds(view)
    const events = (await db.prepare(`SELECT ${eventColumns} FROM glove_events ORDER BY sequence DESC LIMIT 500`).all<any>()).results.filter(readable(actor, jobs))
    const operators = actor.role === 'owner' ? (await db.prepare("SELECT o.id,o.email,o.display_name AS name,o.status,o.role AS nativeRole,r.role FROM oa_operators o LEFT JOIN glove_roles r ON r.operator_id=o.id ORDER BY o.display_name").all()).results : []
    return json({ ...view, actor: { id: actor.id, name: actor.name, role: actor.role }, events, operators })
  }
  const timeline = /^\/api\/glove\/jobs\/([A-Za-z0-9-]{1,80})\/timeline$/.exec(url.pathname)
  if (timeline) {
    readRole(actor, reads.state)
    const jobs = visibleJobIds(visible(s, actor))
    if (!jobs.has(timeline[1])) fail('NOT_FOUND', 'No such job for you.', null, 404)
    const events = (await db.prepare(`SELECT ${eventColumns} FROM glove_events WHERE job_id=? ORDER BY sequence`).bind(timeline[1]).all<any>()).results.filter(readable(actor, jobs))
    return json({ events })
  }
  const file = /^\/api\/glove\/files\/([0-9a-f-]{36})$/.exec(url.pathname)
  if (file) {
    readRole(actor, reads.file)
    const row = await db.prepare('SELECT capture_id AS captureId,media_type AS mediaType,bytes FROM glove_files WHERE id=?').bind(file[1]).first<any>()
    const capture = row && s.captures.find(x => x.id === row.captureId)
    const allowed = capture && (actor.role !== 'technician' || visibleJobIds(visible(s, actor)).has(capture.jobId))
    if (!allowed) fail('NOT_FOUND', 'No such file for you.', null, 404)
    return new Response(new Uint8Array(row.bytes), { headers: { ...headers, 'content-type': row.mediaType, 'content-security-policy': "default-src 'none'" } })
  }
  const csv = /^\/api\/glove\/exports\/([0-9a-f-]{36})\.csv$/.exec(url.pathname)
  if (csv) {
    readRole(actor, reads.export)
    const exported = s.exports.find(x => x.id === csv[1]) ?? fail('NOT_FOUND', 'No such export.', null, 404)
    return new Response(exported.csv, { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${exported.number}.csv"` } })
  }
  if (url.pathname === '/api/glove/reports/sources') {
    readRole(actor, reads.reports)
    return json(sourceReport(s, new Date().toISOString()))
  }
  if (url.pathname === '/api/glove/export') {
    readRole(actor, reads.export)
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
  allow(actor, type)
  const digest = sha256(canonicalJson({ type, payload }))
  const previous = await saved(env.DB, commandId, digest, actor)
  if (previous) return json(previous)
  // A lost optimistic race recomputes from the current records; a stale
  // record version the person saw is still refused by the command itself.
  for (let attempt = 0; attempt < 6; attempt++) {
    let before = await load(env.DB)
    const fresh = (): Context => ({ s: structuredClone(before), actor, commandId, now: new Date().toISOString(), events: [], files: [], sql: [] })
    let c = fresh(), result: unknown
    if (type === 'import.commit' || type === 'import.undo') {
      const outcome = await journal(env.DB, c, type, payload)
      before = await load(env.DB)
      c = fresh()
      result = settle(c, type, outcome)
    } else if (type === 'import.stage') result = await stage(env.DB, c, payload)
    else for (const family of families) if ((result = await family(c, type, payload, env.DB)) !== undefined) break
    if (result === undefined) fail('COMMAND', 'Unknown command type.', { type }, 400)
    await refuseUndoing(env.DB, before, c)
    try { return json(await commit(env.DB, c, before, type, digest, result)) }
    catch (error) {
      const replay = await saved(env.DB, commandId, digest, actor)
      if (replay) return json(replay)
      if ((await load(env.DB)).version !== before.version) continue
      await current(env.DB, actor)
      throw error
    }
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
