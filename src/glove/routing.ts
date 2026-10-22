import { branchIdOf } from './branches'
import { conflicts, slot, type Slot } from './commands/dispatch'
import { driveTimes, mapsKey } from './maps'
import { fail, Problem, type Context, type Row, type State } from './model'
import { canonicalJson, sha256 } from '../modules/import-kit/src/d1/index'
import { load } from './storage'
import { providerEvent } from './timeline'
import { roleSql } from './access'

// A bounded improvement search, using real Routes driving times. It searches
// exchanges of existing appointment starts, retaining each visit's duration
// and arrival promise. It reports the best feasible schedule found, not a
// certificate of a globally optimal vehicle-routing solution.
export type RouteMove = { visitId: string; before: Slot; after: Slot }
export type RoutingScope = { date: string; branchId: string | null; technicianId: string | null }
const MAX_VISITS = 20, MAX_TECHNICIANS = 8, MAX_EVALUATIONS = 1200
const RUN_MS = 20_000, LEASE_MS = 60_000
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
const clock = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
export const visitSlot = (v: Row): Slot => ({ technicianId: v.technicianId, startAt: v.startAt, endAt: v.endAt, local: v.local, ...(v.arrivalWindow ? { arrivalWindow: v.arrivalWindow } : {}) })
export const routeVisits = (s: State, r: RoutingScope) => s.visits.filter(v => v.status !== 'cancelled' && v.local.date === r.date && branchIdOf(s, v) === r.branchId && (!r.technicianId || v.technicianId === r.technicianId)).sort((a, b) => a.id.localeCompare(b.id))
export const movable = (s: State, v: Row) => v.status === 'booked' && !v.arrival && !v.crew && !s.captures.some(c => c.visitId === v.id) && !(v.lateEvidence ?? []).length

/** Include newly booked visits and changed eligibility/evidence, not just the
 * versions of visits being moved. No credential enters this fingerprint. */
export function routeDependencies(s: State, r: RoutingScope) {
  const visits = s.visits.filter(v => v.local.date === r.date && branchIdOf(s, v) === r.branchId)
  const jobIds = new Set(visits.map(v => v.jobId)), jobs = s.jobs.filter(j => jobIds.has(j.id)), siteIds = new Set(jobs.map(j => j.siteId)), ids = new Set(visits.map(v => v.id))
  return sha256(canonicalJson({ business: s.business, branches: s.branches.filter(b => b.id === r.branchId), technicians: s.technicians.filter(t => (t.branchId ?? null) === r.branchId), services: s.services, visits, jobs, sites: s.sites.filter(x => siteIds.has(x.id)), captures: s.captures.filter(x => ids.has(x.visitId)) }))
}

export function routingContext(s: State, row: Row, now: string): Context {
  return { s, actor: { ...row.requestedBy, sessionId: '', operatorVersion: 0 }, now, commandId: row.id, events: [], files: [], sql: [] }
}

type Matrix = Map<string, number>
const pair = (a: string, b: string) => `${a}:${b}`
async function matrix(db: D1Database, s: State, visits: Row[]): Promise<Matrix> {
  const key = await mapsKey(db, s) ?? fail('MAPS', 'The owner connects Google Maps before optimizing routes.')
  const point = (v: Row) => {
    const job = s.jobs.find(j => j.id === v.jobId), site = s.sites.find(x => x.id === job?.siteId)
    const location = site?.location ?? fail('MAP_LOCATION', 'Place every site on the map before optimizing this day.')
    return { lat: location.lat, lng: location.lng }
  }
  const pairs = visits.flatMap(from => visits.filter(to => to.id !== from.id).map(to => ({ from, to })))
  const coordinates = pairs.map(p => ({ from: point(p.from), to: point(p.to) }))
  const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 10_000)
  const times = await driveTimes(key, coordinates, abort.signal).finally(() => clearTimeout(timeout))
  return new Map(pairs.map((p, i) => [pair(p.from.id, p.to.id), times[i]?.seconds ?? Infinity]))
}

/** Validate the complete final schedule together, so a simultaneous exchange
 * never collides with the old placement of a visit that is also moving. */
export function validateRoute(c: Context, visits: Row[], plan: Slot[], times: Matrix, checkEligibility = true): number {
  const projected = { ...c.s, visits: [...c.s.visits] }, original = c.s
  projected.visits = projected.visits.map(v => { const i = visits.findIndex(x => x.id === v.id); return i < 0 ? v : { ...v, ...plan[i] } })
  c.s = projected
  try {
    if (checkEligibility) for (let i = 0; i < visits.length; i++) {
      const v = visits[i]
      if (movable(original, v) && conflicts(c, projected.jobs.find(j => j.id === v.jobId)!, plan[i], projected.visits.find(x => x.id === v.id)!).length) fail('ROUTE_CONFLICT', 'The proposed route has a dispatch conflict.')
    }
    let seconds = 0
    for (const id of new Set(plan.map(p => p.technicianId))) {
      const ordered = visits.map((v, i) => ({ v, next: plan[i] })).filter(x => x.next.technicianId === id).sort((a, b) => a.next.startAt.localeCompare(b.next.startAt))
      for (let n = 1; n < ordered.length; n++) {
        const a = ordered[n - 1], b = ordered[n], drive = times.get(pair(a.v.id, b.v.id)) ?? Infinity
        if (!Number.isFinite(drive) || Date.parse(a.next.endAt) + drive * 1000 > Date.parse(b.next.startAt)) fail('ROUTE_TRAVEL', 'There is not enough driving time between the proposed visits.')
        seconds += drive
      }
    }
    return seconds
  } finally { c.s = original }
}

export async function prepareRoute(db: D1Database, s: State, row: Row, at: string) {
  if (routeDependencies(s, row as unknown as RoutingScope) !== row.dependencies) fail('ROUTE_STALE', 'The day changed after this route was requested. Request another optimization.')
  const visits = routeVisits(s, row as unknown as RoutingScope)
  if (visits.length < 2 || visits.length > MAX_VISITS || new Set(visits.map(v => v.technicianId)).size > MAX_TECHNICIANS) fail('ROUTE_LIMIT', 'Optimize a day with 2 to 20 visits and at most 8 technicians.')
  const times = await matrix(db, s, visits), c = routingContext(s, row, at), deadline = Date.now() + RUN_MS
  let best = visits.map(visitSlot), evaluations = 0
  const beforeSeconds = validateRoute(c, visits, best, times), movableIds = visits.map((v, i) => movable(s, v) ? i : -1).filter(i => i >= 0)
  let bestSeconds = beforeSeconds
  // Precompute each visit in each existing appointment position. Eligibility
  // is checked against the full final schedule below, never weakened.
  const options = visits.map(v => visits.map(position => {
    try {
      const start = position.local.start, duration = minutes(v.local.end) - minutes(v.local.start), end = minutes(start) + duration
      if (end >= 1440) return null
      return slot(c, { technicianId: position.technicianId, date: v.local.date, start, end: clock(end), window: v.arrivalWindow })
    } catch { return null }
  }))
  let positions = visits.map((_, i) => i), improved = true
  while (improved && evaluations < MAX_EVALUATIONS && Date.now() < deadline) {
    improved = false
    for (let x = 0; x < movableIds.length; x++) for (let y = x + 1; y < movableIds.length; y++) {
      if (++evaluations > MAX_EVALUATIONS || Date.now() >= deadline) break
      const a = movableIds[x], b = movableIds[y], first = options[a][positions[b]], second = options[b][positions[a]]
      if (!first || !second) continue
      const candidate = [...best]; candidate[a] = first; candidate[b] = second
      try {
        const total = validateRoute(c, visits, candidate, times)
        if (total < bestSeconds) { best = candidate; bestSeconds = total; [positions[a], positions[b]] = [positions[b], positions[a]]; improved = true }
      } catch (error) { if (!(error instanceof Problem)) throw error }
    }
  }
  return { beforeSeconds, afterSeconds: bestSeconds, savedSeconds: beforeSeconds - bestSeconds, evaluations, moves: visits.map((v, i) => ({ visitId: v.id, before: visitSlot(v), after: best[i] })), method: 'Bounded appointment exchanges; driving between visits, no depot legs; global optimum not guaranteed.' }
}

/** Acceptance repeats the provider journey and validates every proposed leg. */
export async function validateAcceptedRoute(db: D1Database, c: Context, row: Row) {
  if (routeDependencies(c.s, row as unknown as RoutingScope) !== row.dependencies) fail('ROUTE_STALE', 'The schedule or eligibility changed. Request another optimization.')
  const visits = routeVisits(c.s, row as unknown as RoutingScope), moves = row.moves as RouteMove[]
  if (!moves || visits.length !== moves.length || visits.some(v => !moves.some(m => m.visitId === v.id))) fail('ROUTE_STALE', 'The route no longer matches this day.')
  const times = await matrix(db, c.s, visits)
  const plan = visits.map(v => { const m = moves.find(m => m.visitId === v.id)!; return slot(c, { technicianId: m.after.technicianId, ...m.after.local, window: v.arrivalWindow }) })
  const seconds = validateRoute(c, visits, plan, times)
  const before = validateRoute(c, visits, visits.map(visitSlot), times)
  if (seconds > before) fail('ROUTE_CHANGED', 'Driving times changed and this proposal would increase driving. Request another optimization.')
  return { visits, plan, seconds }
}

/** Only proposal records change in cron. A version guard and the installation
 * version serialize claims/results with ordinary commands. Expired work is
 * visibly failed; no hidden retry loop or automatic visit movement. */
async function saveBackground(db: D1Database, before: State, row: Row, changes: Record<string, unknown>, at: string) {
  const next: Row = { ...row, ...changes, version: row.version + 1 }, guard = crypto.randomUUID()
  await db.batch([
    db.prepare('INSERT INTO glove_guard(id,ok) VALUES(?,CASE WHEN (SELECT version FROM glove_meta WHERE id=1)=? AND (SELECT version FROM glove_records WHERE kind=\'routes\' AND id=?)=? THEN 1 ELSE 0 END)').bind(guard, before.version, row.id, row.version),
    db.prepare("UPDATE glove_records SET version=?,data=? WHERE kind='routes' AND id=?").bind(next.version, JSON.stringify(next), row.id),
    providerEvent(db, { id: `route:${row.id}:${next.version}`, at, commandId: row.id, provider: 'Glove routing', subjectKind: 'route', subjectId: row.id, kind: `route.${next.status}`, summary: `Route optimization ${next.status}`, data: { status: next.status, savedSeconds: next.savedSeconds ?? null, recordChanges: [{ kind: 'routes', id: row.id, fromVersion: row.version, toVersion: next.version, fields: Object.keys(changes) }] } }),
    db.prepare('UPDATE glove_meta SET version=version+1 WHERE id=1'), db.prepare('DELETE FROM glove_guard WHERE id=?').bind(guard),
  ])
  return next
}

async function requesterAllowed(db: D1Database, s: State, row: Row) {
  const id = row.requestedBy.id
  const person = await db.prepare(`SELECT status,${roleSql('?')} AS role FROM oa_operators WHERE id=?`).bind(id, id, id).first<{ status: string; role: string }>()
  const limit = s.branchAccess.find(b => b.id === id)
  return !!person && person.status === 'active' && ['owner', 'dispatcher'].includes(person.role) && (!limit || limit.limited === false || (limit.branchId ?? null) === row.branchId)
}

export async function runRoutingJobs(db: D1Database, at = new Date().toISOString()) {
  const initial = await load(db)
  const expired = initial.routes.find(r => r.status === 'running' && Date.parse(r.startedAt) + LEASE_MS <= Date.parse(at))
  if (expired) { await saveBackground(db, initial, expired, { status: 'failed', problem: 'The background run expired. Request another optimization.', finishedAt: at }, at).catch(() => {}); return }
  const row = initial.routes.find(r => r.status === 'queued')
  if (!row) return
  if (!await requesterAllowed(db, initial, row)) { await saveBackground(db, initial, row, { status: 'failed', problem: 'The requester no longer has dispatch authority for this branch.', finishedAt: at }, at).catch(() => {}); return }
  let claimed: Row
  try { claimed = await saveBackground(db, initial, row, { status: 'running', startedAt: at }, at) } catch { return }
  let changes: Record<string, unknown>
  try { changes = { ...await prepareRoute(db, initial, claimed, at), status: 'ready', finishedAt: at } }
  catch (error) { changes = { status: 'failed', problem: error instanceof Problem ? error.message : 'Route optimization could not finish. Request another optimization.', finishedAt: at } }
  const fresh = await load(db), current = fresh.routes.find(r => r.id === row.id)
  if (!current || current.status !== 'running' || current.version !== claimed.version) return
  if (changes.status === 'ready' && !await requesterAllowed(db, fresh, current)) changes = { status: 'failed', problem: 'The requester no longer has dispatch authority for this branch.', finishedAt: at }
  if (changes.status === 'ready' && routeDependencies(fresh, current as unknown as RoutingScope) !== current.dependencies) changes = { status: 'failed', problem: 'The day changed during optimization. Request another optimization.', finishedAt: at }
  await saveBackground(db, fresh, current, changes, at).catch(() => {})
}
