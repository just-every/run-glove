import { fail, event, bump, put, type Context, type Row, type State } from './model'
import { fit, inside, type LatLng, type MapView } from './mercator'

// DISP-002: Google Maps Platform under the owner's own key, kept in
// glove_provider_keys (never in records, exports, logs or the archive). Glove
// sends Google only what each answer needs: a site's street address to place
// it (Geocoding API), the coordinates of consecutive stops to time the drive
// between them (Routes API, traffic-unaware), and the board's center and zoom
// for the base map (Static Maps API; Glove draws its own pins, legs and
// zones, so no customer, job or technician detail goes to Google). A failure
// names the HTTP status or Google's status word only, never the key.

const GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json'
const MATRIX = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
const STATIC = 'https://maps.googleapis.com/maps/api/staticmap'

export async function mapsKey(db: D1Database, s: State): Promise<string | null> {
  if (!s.business[0]?.maps) return null
  return (await db.prepare("SELECT value FROM glove_provider_keys WHERE provider='maps'").first<{ value: string }>())?.value ?? null
}

async function call(url: string, init?: RequestInit) {
  try { return await fetch(url, { ...init, redirect: 'manual' }) }
  catch { return fail('MAPS', 'Google Maps could not be reached.', { status: 0 }, 502) }
}

const coordinate = (v: unknown, limit: number) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : fail('MAPS', 'Google Maps answered outside its documented form.', null, 502)

/** A street address placed by Google's Geocoding API, or null when Google finds no such place. */
export async function geocode(key: string, address: string) {
  const res = await call(`${GEOCODE}?${new URLSearchParams({ address, key })}`)
  if (!res.ok) fail('MAPS', `Google Maps could not place the address (HTTP ${res.status}).`, { status: res.status }, 502)
  const body = await res.json().catch(() => null) as any
  if (body?.status === 'ZERO_RESULTS') return null
  if (body?.status !== 'OK' || !Array.isArray(body.results) || !body.results.length) fail('MAPS', `Google Maps refused the lookup (${typeof body?.status === 'string' ? body.status.slice(0, 40) : 'no status'}).`, null, 502)
  const first = body.results[0], at = first?.geometry?.location
  return { lat: coordinate(at?.lat, 90), lng: coordinate(at?.lng, 180), placeId: typeof first.place_id === 'string' ? first.place_id.slice(0, 300) : null, formatted: typeof first.formatted_address === 'string' ? first.formatted_address.slice(0, 500) : null }
}

async function locationFor(c: Context, key: string, address: string) {
  const found = await geocode(key, address)
  return found ? { location: { lat: found.lat, lng: found.lng, placeId: found.placeId, formatted: found.formatted, at: c.now }, locateError: null } : { location: null, locateError: 'Google Maps found no place for this address.' }
}

const located = (c: Context, site: Row, found: { location: unknown }) => event(c, { jobId: null, subjectKind: 'site', subjectId: site.id, kind: 'site.located', summary: found.location ? `${site.address} placed on the map` : `Google Maps found no place for ${site.address}`, data: { found: !!found.location } })

/** Where a site is on the map: its kept location, else placed now (and kept, with its own event); null when Google finds no such place. */
export async function placed(c: Context, key: string, site: Row): Promise<LatLng | null> {
  const current = c.s.sites.find(x => x.id === site.id)!
  if (current.location) return { lat: current.location.lat, lng: current.location.lng }
  const found = await locationFor(c, key, current.address)
  bump(c.s, 'sites', current, found)
  located(c, current, found)
  return found.location ? { lat: found.location.lat, lng: found.location.lng } : null
}

/** A site just saved: placed again when its address is new or changed (cleared while Google Maps is not connected), in the same version. */
export async function relocate(c: Context, db: D1Database, before: Row | undefined, site: Row) {
  if (before && before.address === site.address) return
  const key = await mapsKey(db, c.s)
  if (!key) { if (site.location || site.locateError) put(c.s, 'sites', { ...site, location: null, locateError: null }); return }
  const found = await locationFor(c, key, site.address)
  put(c.s, 'sites', { ...site, ...found })
  located(c, site, found)
}

const seconds = (v: unknown) => typeof v === 'string' && /^\d+(\.\d+)?s$/.test(v) ? Math.round(Number(v.slice(0, -1))) : fail('MAPS', 'Google Maps answered outside its documented form.', null, 502)

/**
 * Drive time and distance for each pair, from one Routes API route matrix
 * (driving, traffic-unaware); null for a pair Google finds no route for.
 */
export async function driveTimes(key: string, pairs: { from: LatLng; to: LatLng }[], signal?: AbortSignal): Promise<({ seconds: number; meters: number } | null)[]> {
  if (!pairs.length) return []
  const id = (p: LatLng) => `${p.lat},${p.lng}`
  const origins = [...new Map(pairs.map(p => [id(p.from), p.from])).values()], destinations = [...new Map(pairs.map(p => [id(p.to), p.to])).values()]
  const waypoint = (p: LatLng) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } })
  const res = await call(MATRIX, { method: 'POST', signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': key, 'x-goog-fieldmask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition' }, body: JSON.stringify({ origins: origins.map(waypoint), destinations: destinations.map(waypoint), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE' }) })
  if (!res.ok) fail('MAPS', `Google Maps could not time the drives (HTTP ${res.status}).`, { status: res.status }, 502)
  const elements = await res.json().catch(() => null)
  if (!Array.isArray(elements)) fail('MAPS', 'Google Maps answered outside its documented form.', null, 502)
  // JSON leaves out a zero index, as protocol buffers do.
  const cell = new Map((elements as any[]).map(e => [`${e?.originIndex ?? 0}:${e?.destinationIndex ?? 0}`, e]))
  return pairs.map(p => {
    const e = cell.get(`${origins.findIndex(o => id(o) === id(p.from))}:${destinations.findIndex(d => id(d) === id(p.to))}`)
    if (!e || e.condition !== 'ROUTE_EXISTS') return null
    return { seconds: seconds(e.duration), meters: Number.isFinite(e.distanceMeters) ? Math.round(e.distanceMeters) : 0 }
  })
}

/** Today's board for a date: each technician's stops in order, where each sits, and the zones they serve. */
export function mapDay(s: State, date: string, branch: string | null) {
  const technicians = s.technicians.filter(t => branch === null || (t.branchId ?? 'main') === branch).map(t => {
    const stops = s.visits.filter(v => v.technicianId === t.id && v.local.date === date && v.status !== 'cancelled').sort((a, b) => a.startAt.localeCompare(b.startAt)).map(v => {
      const job = s.jobs.find(j => j.id === v.jobId), site = s.sites.find(x => x.id === job?.siteId)
      return { visitId: v.id, jobId: v.jobId, number: job?.number ?? '', start: v.local.start, end: v.local.end, status: v.status, siteId: site?.id ?? null, address: site?.address ?? '', location: site?.location ? { lat: site.location.lat, lng: site.location.lng } as LatLng : null }
    })
    return { id: t.id, name: t.name, active: !!t.active, zones: (t.zones ?? []) as { id: string; name: string; points: LatLng[] }[], stops }
  }).filter(t => t.active || t.stops.length)
  const located = technicians.flatMap(t => t.stops.flatMap(x => x.location ? [x.location] : []))
  const zones = technicians.flatMap(t => t.zones.flatMap(z => z.points))
  const sites = s.sites.flatMap(x => x.location && !x.erasedAt ? [{ lat: x.location.lat, lng: x.location.lng }] : []).slice(0, 200)
  const view: MapView | null = fit(located.length || zones.length ? [...located, ...zones] : sites)
  const unlocated = [...new Map(technicians.flatMap(t => t.stops).filter(x => x.siteId && !x.location).map(x => [x.siteId, { siteId: x.siteId, address: x.address, problem: s.sites.find(y => y.id === x.siteId)?.locateError ?? null }])).values()]
  return { date, view, technicians, unlocated }
}

/** The board with the drive time between each technician's consecutive located stops. */
export async function mapBoard(db: D1Database, s: State, date: string, branch: string | null) {
  const day = mapDay(s, date, branch), key = await mapsKey(db, s)
  const legs = day.technicians.flatMap(t => t.stops.slice(1).map((to, i) => ({ technicianId: t.id, from: t.stops[i], to })).filter(l => l.from.location && l.to.location))
  const times = key ? await driveTimes(key, legs.map(l => ({ from: l.from.location!, to: l.to.location! }))).catch(() => []) : []
  return { ...day, connected: !!key, technicians: day.technicians.map(t => ({ ...t, legs: legs.flatMap((l, i) => l.technicianId === t.id ? [{ from: l.from.visitId, to: l.to.visitId, seconds: times[i]?.seconds ?? null, meters: times[i]?.meters ?? null }] : []) })) }
}

/** The base map image for the board's view, from Google's Static Maps API without markers. */
export async function baseMap(key: string, view: MapView) {
  const res = await call(`${STATIC}?${new URLSearchParams({ center: `${view.center.lat},${view.center.lng}`, zoom: String(view.zoom), size: `${view.width}x${view.height}`, scale: '2', maptype: 'roadmap', key })}`)
  if (!res.ok) fail('MAPS', `Google Maps could not draw the map (HTTP ${res.status}).`, { status: res.status }, 502)
  const type = res.headers.get('content-type') ?? ''
  if (!/^image\/(png|jpeg|gif)/.test(type)) fail('MAPS', 'Google Maps answered outside its documented form.', null, 502)
  return { bytes: await res.arrayBuffer(), type }
}

/** A technician's service-area zones: named polygons of 3 to 100 corners, at most 20. */
export function zonesFrom(v: unknown): { id: string; name: string; points: LatLng[] }[] {
  if (!Array.isArray(v) || v.length > 20) return fail('INPUT', 'zones is a list of at most 20 zones.', { field: 'zones' }, 400)
  return v.map((z: any, i) => {
    const name = typeof z?.name === 'string' && z.name.trim() && z.name.length <= 80 ? z.name.trim() : fail('INPUT', `zones[${i}].name is required (at most 80 characters).`, { field: `zones[${i}].name` }, 400)
    const points = Array.isArray(z?.points) && z.points.length >= 3 && z.points.length <= 100 ? z.points.map((p: any, j: number) => {
      if (typeof p?.lat !== 'number' || typeof p?.lng !== 'number' || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 85 || Math.abs(p.lng) > 180) fail('INPUT', `zones[${i}].points[${j}] is a latitude and longitude.`, { field: `zones[${i}].points` }, 400)
      return { lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 }
    }) : fail('INPUT', `zones[${i}] has 3 to 100 corners.`, { field: `zones[${i}].points` }, 400)
    return { id: typeof z.id === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(z.id) ? z.id : crypto.randomUUID(), name, points }
  })
}

/** DISP-002 beside DISP-004: whether a site is inside one of a technician's drawn zones. */
export const inZones = (site: Row | undefined, zones: { points: LatLng[] }[]) => !!site?.location && zones.some(z => inside(site.location, z.points))

