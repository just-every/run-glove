import { bump, event, fail, find, text, type Context, type State, type Row } from './model'
import { driveTimes, mapsKey } from './maps'
import { delayWatch } from './delays'
import type { Actor } from './model'
import type { Handler } from './commands/types'

/** A position is eligible only during a current shift and assigned visit timer. */
export function locationWork(s: State, tech: Row) {
  if (!tech.active || !tech.locationConsent?.enabled || tech.locationConsent.by !== tech.operatorId) return null
  const shift = s.times.find(t => t.technicianId === tech.id && t.kind === 'shift' && !t.endAt)
  const timer = s.times.find(t => t.technicianId === tech.id && t.kind !== 'shift' && !t.endAt)
  const visit = timer && s.visits.find(v => v.id === timer.visitId && v.technicianId === tech.id && ['booked', 'arrived'].includes(v.status))
  return shift && timer && visit ? { shift, timer, visit } : null
}
const coordinates = (lat: unknown, lng: unknown) => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) fail('LOCATION', 'A valid latitude and longitude are required.', null, 400)
  return { lat: lat as number, lng: lng as number }
}
function capture(c: Context, tech: Row, source: string, p: any) {
  const work = locationWork(c.s, tech) ?? fail('LOCATION_STOPPED', 'Location needs your consent, an open shift and a timer on your current assigned visit.', null, 403)
  const point = coordinates(p.lat, p.lng), observed = Date.parse(p.observedAt)
  if (!Number.isFinite(observed) || observed > Date.parse(c.now) + 10_000 || observed < Date.parse(c.now) - 120_000 || observed < Date.parse(work.shift.startAt) || observed < Date.parse(work.timer.startAt) || observed < Date.parse(tech.locationConsent.at)) fail('LOCATION_STALE', 'Use a fresh location captured during this shift and visit.', null, 400)
  c.sql.push({ sql: 'INSERT INTO glove_live_locations VALUES(?,?,?,?,?,?,?) ON CONFLICT(technician_id) DO UPDATE SET visit_id=excluded.visit_id,source=excluded.source,lat=excluded.lat,lng=excluded.lng,observed_at=excluded.observed_at,received_at=excluded.received_at WHERE excluded.observed_at>glove_live_locations.observed_at', params: [tech.id, work.visit.id, source, point.lat, point.lng, new Date(observed).toISOString(), c.now] })
  event(c, { jobId: work.visit.jobId, subjectKind: 'technician', subjectId: tech.id, kind: 'location.received', summary: `${tech.name} shared an on-clock position from ${source}`, data: { source } })
  // Coordinates never enter durable command outcomes, Activity or business records.
  return { accepted: true, source }
}
export const locations: Handler = async (c, type, p, db) => {
  if (!type.startsWith('location.')) return
  if (c.actor.token || c.actor.custom) fail('FORBIDDEN', 'Location requires a person using a built-in role.', null, 403)
  const own = () => c.s.technicians.find(t => t.operatorId === c.actor.id) ?? fail('TECHNICIAN', 'Your sign-in is not linked to a technician.', null, 403)
  if (type === 'location.consent') {
    const tech = own()
    if (typeof p.enabled !== 'boolean') fail('INPUT', 'Choose whether to share location.', null, 400)
    c.sql.push({ sql: 'DELETE FROM glove_live_locations WHERE technician_id=?', params: [tech.id] })
    const row = bump(c.s, 'technicians', tech, { locationConsent: { enabled: p.enabled, at: c.now, by: c.actor.id } })
    event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'location.consent', summary: `${tech.name} ${p.enabled ? 'consented to on-clock location sharing' : 'stopped location sharing'}`, data: { enabled: p.enabled } })
    return { enabled: row.locationConsent.enabled }
  }
  if (type === 'location.phone') return capture(c, own(), 'phone', p)
  if (type === 'location.fleetConnect') {
    const tech = find(c.s, 'technicians', p.technicianId)
    const vehicleId = p.key === null ? null : text(p.vehicleId, 'vehicleId', { max: 100 })
    if (vehicleId && !/^[0-9]+$/.test(vehicleId)) fail('INPUT', 'Use the Samsara vehicle ID.', null, 400)
    c.sql.push({ sql: 'DELETE FROM glove_live_locations WHERE technician_id=?', params: [tech.id] })
    c.sql.push(p.key === null ? { sql: "DELETE FROM glove_fleet_credentials WHERE technician_id=?", params: [tech.id] } : { sql: "INSERT INTO glove_fleet_credentials(technician_id,value,set_by,set_at) VALUES(?,?,?,?) ON CONFLICT(technician_id) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [tech.id, text(p.key, 'key', { max: 1000 }), c.actor.id, c.now] })
    const row = bump(c.s, 'technicians', tech, { fleet: vehicleId ? { provider: 'samsara', vehicleId } : null })
    event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'location.fleetConnected', summary: vehicleId ? 'Samsara vehicle connected' : 'Samsara vehicle disconnected', data: null })
    return { connected: !!row.fleet }
  }
  if (type === 'location.fleetRead') {
    const tech = find(c.s, 'technicians', p.technicianId)
    if (!locationWork(c.s, tech)) fail('LOCATION_STOPPED', 'The technician must consent and be on the clock with a current visit timer.', null, 403)
    const key = await db.prepare("SELECT value FROM glove_fleet_credentials WHERE technician_id=?").bind(tech.id).first<{ value: string }>()
    if (!key || !tech.fleet) fail('FLEET', 'Connect this technician’s Samsara vehicle first.')
    let response: Response
    try { response = await fetch(`https://api.samsara.com/fleet/vehicles/stats?${new URLSearchParams({ vehicleIds: tech.fleet.vehicleId, types: 'gps' })}`, { headers: { Authorization: `Bearer ${key!.value}` }, redirect: 'manual', signal: AbortSignal.timeout(10_000) }) }
    catch { return fail('FLEET', 'Samsara location is unavailable.', null, 502) }
    if (!response.ok) fail('FLEET', 'Samsara location is unavailable. Check the connection.', null, 502)
    const body = await response.json().catch(() => null) as any
    const gps = Array.isArray(body?.data) && body.data.find((v: any) => v.id === tech.fleet.vehicleId)?.gps
    if (!gps) fail('FLEET', 'Samsara returned no position for this vehicle.', null, 502)
    return capture(c, tech, 'Samsara', { lat: gps.latitude, lng: gps.longitude, observedAt: gps.time })
  }
}

/** Latest positions are read only by the owner and dispatcher, under branch scope. */
export async function livePositions(db: D1Database, s: State, date: string, now = new Date().toISOString()) {
  const rows = (await db.prepare('SELECT * FROM glove_live_locations').all<any>()).results
  const key = await mapsKey(db, s)
  return Promise.all(s.technicians.map(async tech => {
    const row = rows.find(r => r.technician_id === tech.id), work = locationWork(s, tech)
    if (!row || !work || work.visit.local.date !== date || row.visit_id !== work.visit.id) return { technicianId: tech.id, status: 'Location stopped or unavailable', position: null, eta: null }
    if (Date.parse(now) - Date.parse(row.observed_at) > 120_000 || Date.parse(row.observed_at) > Date.parse(now) + 10_000) return { technicianId: tech.id, status: 'Location stale', position: null, eta: null }
    if (row.observed_at < work.timer.startReceivedAt || row.observed_at < work.shift.startReceivedAt || row.observed_at < tech.locationConsent.at) return { technicianId: tech.id, status: 'Location stopped or unavailable', position: null, eta: null }
    const position = { lat: row.lat, lng: row.lng, source: row.source, observedAt: row.observed_at }
    const next = s.visits.filter(v => v.technicianId === tech.id && v.local.date === date && v.status === 'booked' && !v.arrival && v.id !== work.visit.id && v.startAt >= work.visit.endAt).sort((a,b) => a.startAt.localeCompare(b.startAt))[0]
    const job = next && s.jobs.find(j => j.id === next.jobId), site = job && s.sites.find(x => x.id === job.siteId)
    let drive = null
    if (key && site?.location) { try { drive = (await driveTimes(key, [{ from: position, to: site.location }]))[0] } catch {} }
    return { technicianId: tech.id, status: `${row.source} location`, position, eta: drive && next ? { visitId: next.id, seconds: drive.seconds, arrivalAt: new Date(Date.parse(now) + drive.seconds * 1000).toISOString() } : null }
  }))
}

/** Existing delay proposals keep their approval bounds; location only explains them. */
export async function locationDelayWatch(db: D1Database, s: State, actor: Actor, at: string) {
  const risks = delayWatch(s, actor, at)
  if (!['owner', 'dispatcher'].includes(actor.role) || actor.token) return risks
  const dates = [...new Set(risks.map(r => s.visits.find(v => v.id === r.visitId)!.local.date))]
  const byDate = new Map(await Promise.all(dates.map(async date => [date, await livePositions(db, s, date)] as const)))
  const describe = (live: Awaited<ReturnType<typeof livePositions>>[number] | undefined) => live?.position ? `${live.position.source} position ${live.position.lat.toFixed(5)}, ${live.position.lng.toFixed(5)}; ${live.eta ? `ETA ${Math.ceil(live.eta.seconds / 60)} min drive` : 'ETA unavailable'}` : 'Location and ETA unavailable'
  return risks.map(r => {
    const date = s.visits.find(v => v.id === r.visitId)!.local.date, positions = byDate.get(date)!
    const current = positions.find(p => p.technicianId === r.technicianId)
    return { ...r, reasons: [...r.reasons, describe(current)], options: r.options.map(o => ({ ...o, note: `${o.note} Delayed technician: ${describe(current)}. Alternative: ${describe(positions.find(p => p.technicianId === o.technicianId))}.` })) }
  })
}
