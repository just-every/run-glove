// A Google Maps Platform network edge (Geocoding API, Routes API route
// matrix, Static Maps API) in Google's published response shapes. The test
// registers the places it knows; drives are timed from straight-line distance
// at 30 mph plus a minute to park. The production client is unchanged.
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = bytes => { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => { const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); out.write(type, 4, 'ascii'); data.copy(out, 8); out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length); return out }

/** A plain map-colored PNG of the requested size, with faint street lines. */
function tile(width, height) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2
  const rows = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const street = x % 64 < 3 || y % 48 < 3, i = y * (width * 3 + 1) + 1 + x * 3
    rows[i] = street ? 255 : 233; rows[i + 1] = street ? 255 : 238; rows[i + 2] = street ? 255 : 228
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}

const meters = (a, b) => {
  const r = Math.PI / 180, x = Math.sin((b.latitude - a.latitude) * r / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin((b.longitude - a.longitude) * r / 2) ** 2
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(x)))
}

export function mapsEdge() {
  const edge = { places: new Map(), calls: [], status: {} }
  edge.answer = async request => {
    const url = new URL(request.url)
    if (url.origin === 'https://maps.googleapis.com' && url.pathname === '/maps/api/geocode/json') {
      const address = url.searchParams.get('address'), place = edge.places.get(address)
      edge.calls.push({ api: 'geocode', key: url.searchParams.get('key'), address })
      if (edge.status.geocode) return Response.json({ status: edge.status.geocode, results: [], error_message: 'The provided API key is invalid.' })
      return Response.json(place ? { status: 'OK', results: [{ formatted_address: `${address}, USA`, geometry: { location: place, location_type: 'ROOFTOP' }, place_id: `place-${edge.places.size}-${address.length}`, types: ['street_address'] }] } : { status: 'ZERO_RESULTS', results: [] })
    }
    if (url.href === 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix') {
      const body = await request.json()
      edge.calls.push({ api: 'routes', key: request.headers.get('x-goog-api-key'), fieldMask: request.headers.get('x-goog-fieldmask'), body })
      if (edge.status.routes) return Response.json({ error: { code: edge.status.routes, status: 'PERMISSION_DENIED' } }, { status: edge.status.routes })
      const point = w => w.waypoint.location.latLng
      // Protocol-buffer JSON leaves out a zero index.
      return Response.json(body.origins.flatMap((o, i) => body.destinations.map((d, j) => { const m = meters(point(o), point(d)); return { ...(i ? { originIndex: i } : {}), ...(j ? { destinationIndex: j } : {}), status: {}, distanceMeters: m, duration: `${m ? Math.round(m / 13.41) + 60 : 0}s`, condition: 'ROUTE_EXISTS' } })))
    }
    if (url.origin === 'https://maps.googleapis.com' && url.pathname === '/maps/api/staticmap') {
      edge.calls.push({ api: 'staticmap', key: url.searchParams.get('key'), query: Object.fromEntries([...url.searchParams].filter(([k]) => k !== 'key')) })
      // scale=2 returns twice the pixels of the requested size, as Google documents.
      const [width, height] = url.searchParams.get('size').split('x').map(Number), scale = Number(url.searchParams.get('scale') || 1)
      return new Response(tile(width * scale, height * scale), { headers: { 'content-type': 'image/png' } })
    }
    return null
  }
  return edge
}
