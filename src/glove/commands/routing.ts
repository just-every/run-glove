import { allow } from '../access'
import { chosenBranch } from '../branches'
import { bump, event, expectVersion, fail, find, newId, put, text, type Row } from '../model'
import { routeDependencies, routeVisits, validateAcceptedRoute, type RoutingScope } from '../routing'
import { dispatch, who } from './dispatch'
import type { Handler } from './types'

export const routing: Handler = async (c, type, p, db) => {
  if (!['route.optimize', 'route.accept', 'route.discard'].includes(type)) return undefined
  // Route optimization is a dispatcher's explicit decision, never a workflow
  // grant, token or agent instruction, including direct handler calls.
  if (c.actor.token || !['owner', 'dispatcher'].includes(c.actor.role)) fail('FORBIDDEN', 'Only the owner or a dispatcher optimizes and accepts routes.', null, 403)
  allow(c.actor, type)
  if (type === 'route.optimize') {
    if (typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || Number.isNaN(Date.parse(`${p.date}T00:00:00Z`)) || new Date(`${p.date}T00:00:00Z`).toISOString().slice(0, 10) !== p.date) fail('INPUT', 'Choose a real date (YYYY-MM-DD).', null, 400)
    const branchId = c.actor.branch && p.branchId === undefined ? c.actor.branch.id : chosenBranch(c.s, p.branchId === 'main' ? null : p.branchId)
    if (c.actor.branch && branchId !== c.actor.branch.id) fail('FORBIDDEN', 'Optimize only your own branch.', null, 403)
    const technician = p.technicianId ? find(c.s, 'technicians', p.technicianId) : null
    if (technician && (technician.branchId ?? null) !== branchId) fail('BRANCH', 'Choose a technician from this branch.', null, 400)
    const scope: RoutingScope = { date: p.date, branchId, technicianId: technician?.id ?? null }, visits = routeVisits(c.s, scope)
    if (visits.length < 2 || visits.length > 20 || new Set(visits.map(v => v.technicianId)).size > 8) fail('ROUTE_LIMIT', 'Optimize a day with 2 to 20 visits and at most 8 technicians.')
    if (!c.s.business[0]?.maps) fail('MAPS', 'The owner connects Google Maps before optimizing routes.')
    if (c.s.routes.some(r => r.branchId === branchId && r.date === p.date && ['queued', 'running'].includes(r.status))) fail('ROUTE_RUNNING', 'This day already has an optimization waiting or running.')
    const row = put(c.s, 'routes', { id: newId(), version: 1, createdAt: c.now, ...scope, status: 'queued', requestedBy: who(c), dependencies: routeDependencies(c.s, scope) })
    event(c, { jobId: null, subjectKind: 'route', subjectId: row.id, kind: 'route.queued', summary: `${c.actor.name} requested route optimization for ${p.date}${technician ? `, ${technician.name}` : ''}; visits stay unchanged until accepted`, data: { date: p.date, technicianId: technician?.id ?? null } })
    return row
  }
  const route = find(c.s, 'routes', p.routeId)
  if (c.actor.branch && route.branchId !== c.actor.branch.id) fail('NOT_FOUND', 'No such route in your branch.', null, 404)
  expectVersion(route, p.version)
  if (type === 'route.discard') {
    if (['accepted', 'discarded'].includes(route.status)) fail('ROUTE_STATE', 'This route has already been decided.')
    const row = bump(c.s, 'routes', route, { status: 'discarded', decidedAt: c.now, decidedBy: who(c) })
    event(c, { jobId: null, subjectKind: 'route', subjectId: row.id, kind: 'route.discarded', summary: `${c.actor.name} discarded the route proposal; visits stayed unchanged`, data: null })
    return row
  }
  if (route.status !== 'ready') fail('ROUTE_STATE', 'Only a finished route proposal can be accepted.')
  const reason = text(p.reason, 'reason', { max: 400 }), { visits, plan, seconds } = await validateAcceptedRoute(db, c, route)
  const changed = visits.map((v, i) => ({ v, next: plan[i] })).filter(({ v, next }) => v.technicianId !== next.technicianId || v.startAt !== next.startAt || v.endAt !== next.endAt)
  // Stage the complete final placement first. For each move restore its own
  // original row and run the ordinary dispatch handler, so assignment history,
  // reason, eligibility and events retain the same public-command semantics.
  for (const { v, next } of changed) put(c.s, 'visits', { ...v, ...next })
  const results: Row[] = []
  for (const { v, next } of changed) {
    put(c.s, 'visits', v)
    results.push(await dispatch(c, 'visit.change', { visitId: v.id, version: v.version, technicianId: next.technicianId, ...next.local, reason: `Accepted route optimization: ${reason}` }, db) as Row)
  }
  const row = bump(c.s, 'routes', route, { status: 'accepted', decidedAt: c.now, decidedBy: who(c), reason, acceptedSeconds: seconds })
  event(c, { jobId: null, subjectKind: 'route', subjectId: row.id, kind: 'route.accepted', summary: `${c.actor.name} accepted ${route.date}'s route optimization and changed ${results.length} visits: ${reason}`, data: { visitIds: results.map(v => v.id), driveSeconds: seconds } })
  return row
}
