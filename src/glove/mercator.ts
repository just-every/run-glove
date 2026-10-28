// DISP-002, DISP-010: the map board's geometry, shared by the Worker (which asks Google
// for the base map at a center and zoom) and the screen (which draws Glove's
// own pins, legs and zones over that image). Web Mercator in 256-px tiles, as
// Google's Static Maps API renders it.

export type LatLng = { lat: number; lng: number }
export type MapView = { center: LatLng; zoom: number; width: number; height: number }

export const MAP_WIDTH = 640, MAP_HEIGHT = 360
const TILE = 256, PAD = 36, MAX_ZOOM = 16, MIN_ZOOM = 3

function world(p: LatLng, zoom: number) {
  const scale = TILE * 2 ** zoom, sin = Math.min(Math.max(Math.sin(p.lat * Math.PI / 180), -0.9999), 0.9999)
  return { x: (p.lng + 180) / 360 * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale }
}

function fromWorld(x: number, y: number, zoom: number): LatLng {
  const scale = TILE * 2 ** zoom, n = Math.PI - 2 * Math.PI * y / scale
  return { lat: 180 / Math.PI * Math.atan(Math.sinh(n)), lng: x / scale * 360 - 180 }
}

/** The closest view (center and whole zoom) that shows every point inside the map's padding; null without points. */
export function fit(points: LatLng[]): MapView | null {
  if (!points.length) return null
  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom--) {
    const xs = points.map(p => world(p, zoom).x), ys = points.map(p => world(p, zoom).y)
    if (Math.max(...xs) - Math.min(...xs) <= MAP_WIDTH - 2 * PAD && Math.max(...ys) - Math.min(...ys) <= MAP_HEIGHT - 2 * PAD || zoom === MIN_ZOOM) {
      const center = fromWorld((Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2, zoom)
      return { center: { lat: round(center.lat), lng: round(center.lng) }, zoom: points.length === 1 ? Math.min(zoom, 14) : zoom, width: MAP_WIDTH, height: MAP_HEIGHT }
    }
  }
  return null
}

/** Where a point sits on the view's image, in its width × height pixels. */
export function project(view: MapView, p: LatLng) {
  const c = world(view.center, view.zoom), q = world(p, view.zoom)
  return { x: view.width / 2 + q.x - c.x, y: view.height / 2 + q.y - c.y }
}

/** The point under a pixel of the view's image. */
export function unproject(view: MapView, x: number, y: number): LatLng {
  const c = world(view.center, view.zoom), p = fromWorld(c.x + x - view.width / 2, c.y + y - view.height / 2, view.zoom)
  return { lat: round(p.lat), lng: round(p.lng) }
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

/** Whether a point lies inside a drawn zone (ray casting; zones are town-sized, so latitude and longitude are treated as a plane). */
export function inside(p: LatLng, zone: LatLng[]) {
  let hit = false
  for (let i = 0, j = zone.length - 1; i < zone.length; j = i++) {
    const a = zone[i], b = zone[j]
    if ((a.lat > p.lat) !== (b.lat > p.lat) && p.lng < (b.lng - a.lng) * (p.lat - a.lat) / (b.lat - a.lat) + a.lng) hit = !hit
  }
  return hit
}
