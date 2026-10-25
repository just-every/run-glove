import { useEffect, useState, type MouseEvent } from 'react'
import { ampm, type Glove, type Rec, type Run } from './api'
import { Field, Problem, useAction } from './controls'
import { can } from './roles'
import { project, unproject, MAP_HEIGHT, MAP_WIDTH, type LatLng, type MapView } from '../glove/mercator'

// DISP-002: the route-map strip over the day board. Google's base map (drawn
// by the Worker with the owner's key, no markers) under Glove's own pins, the
// legs between each technician's consecutive stops with their drive times,
// and the zones drawn for technicians. The owner draws a zone by clicking its
// corners on the map, or typing them.

type Stop = { visitId: string; number: string; start: string; end: string; status: string; siteId: string | null; address: string; location: LatLng | null }
type Zone = { id: string; name: string; points: LatLng[] }
type Route = { live?: { status: string; position: { lat: number; lng: number; source: string; observedAt: string } | null; eta: { seconds: number; arrivalAt: string } | null } | null; id: string; name: string; zones: Zone[]; stops: Stop[]; legs: { from: string; to: string; seconds: number | null; meters: number | null }[] }
type Board = { connected: boolean; view: MapView | null; technicians: Route[]; unlocated: { siteId: string; address: string; problem: string | null }[] }

const driveLabel = (seconds: number | null, meters: number | null) => seconds === null ? 'No driving route' : `${Math.max(1, Math.round(seconds / 60))} min drive${meters ? ` · ${(meters / 1609.344).toFixed(1)} mi` : ''}`
const corners = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [lat, lng] = l.split(',').map(n => Number(n.trim())); return { lat, lng } })

export function DispatchMap({ s, run, date, branchId }: { s: Glove; run: Run; date: string; branchId: string }) {
  const query = `date=${date}&branch=${encodeURIComponent(branchId || 'main')}`
  const [board, setBoard] = useState<Board | null>(null), [error, setError] = useState('')
  const [poll, setPoll] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setPoll(n => n + 1), 30_000); return () => window.clearInterval(timer) }, [])
  const [risks, setRisks] = useState<{ visitId: string; number: string; reasons: string[]; options: { note: string }[] }[]>([])
  const [drawing, setDrawing] = useState(false), [draft, setDraft] = useState({ technicianId: '', name: '', corners: '' })
  const place = useAction(), zone = useAction()
  useEffect(() => {
    let live = true
    fetch(`/api/glove/map?${query}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => { const body: any = await r.json(); if (!r.ok) throw new Error(body?.error?.message ?? 'The map could not load.'); return body as Board })
      .then(b => { if (live) { setBoard(b); setError('') } }, (e: Error) => { if (live) setError(e.message) })
    fetch('/api/glove/delays', { cache: 'no-store' }).then(r => r.ok ? r.json() : { risks: [] }).then((b: any) => { if (live) setRisks(b.risks ?? []) }).catch(() => { if (live) setRisks([]) })
    return () => { live = false }
  }, [query, s.version, poll])
  const owner = can(s.actor, 'technician.zones')
  if (error) return <section className="route-map" aria-label="Route map"><p className="problem" role="alert">{error}</p></section>
  if (!board) return null
  const view = board.view, routes = board.technicians.filter(t => t.stops.length || t.zones.length)
  const at = (p: LatLng) => project(view!, p)
  const pending = corners(draft.corners).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  function addCorner(e: MouseEvent<SVGSVGElement>) {
    if (!drawing || !view) return
    const box = e.currentTarget.getBoundingClientRect(), p = unproject(view, (e.clientX - box.left) / box.width * MAP_WIDTH, (e.clientY - box.top) / box.height * MAP_HEIGHT)
    setDraft(d => ({ ...d, corners: `${d.corners.trim() ? `${d.corners.trim()}\n` : ''}${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` }))
  }
  const saveZones = (technicianId: string, zones: Zone[], done?: () => void) => { const t = s.technicians.find(x => x.id === technicianId); if (t) void zone.act(run('technician.zones', { technicianId, version: t.version, zones }), done) }
  return <section className="route-map" aria-labelledby="route-map-title">
    <header><h2 id="route-map-title">Route map</h2>{board.connected && owner && view && <button type="button" aria-pressed={drawing} onClick={() => setDrawing(!drawing)}>{drawing ? 'Stop drawing' : 'Draw a service-area zone'}</button>}</header>
    {!board.connected ? <p className="muted">{s.actor.role === 'owner' ? <>Connect Google Maps under <a href="#team">Team</a> to see the day's stops and drive times on a map.</> : 'The owner connects Google Maps under Team to show the day on a map.'}</p>
      : !view ? <p className="muted">Nothing on this day is on the map yet.</p>
      : <div className="route-map-body">
        <figure className={`map-frame${drawing ? ' drawing' : ''}`}>
          <img src={`/api/glove/map.png?${query}`} alt="" width={MAP_WIDTH} height={MAP_HEIGHT} />
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="group" aria-label={`Stops on the map, ${date}`} onClick={addCorner}>
            {board.technicians.map((t, i) => t.zones.map(z => <polygon key={z.id} className={`zone route-${i % 6}`} points={z.points.map(p => { const q = at(p); return `${q.x},${q.y}` }).join(' ')}><title>{`${t.name}: ${z.name}`}</title></polygon>))}
            {board.technicians.map(t => t.live?.position && <g key={`live-${t.id}`} role="img" aria-label={`${t.name} live ${t.live.position.source} position`} transform={`translate(${at(t.live.position).x} ${at(t.live.position).y})`}><circle r="9" fill="#17684b" stroke="white" strokeWidth="3" /></g>)}
            {pending.length > 1 && <polygon className="zone draft" points={pending.map(p => { const q = at(p); return `${q.x},${q.y}` }).join(' ')} />}
            {pending.map((p, i) => { const q = at(p); return <circle key={i} className="corner" cx={q.x} cy={q.y} r="4" /> })}
            {board.technicians.map((t, i) => t.legs.map(l => { const a = t.stops.find(x => x.visitId === l.from)!.location!, b = t.stops.find(x => x.visitId === l.to)!.location!, p = at(a), q = at(b); return <line key={l.from + l.to} className={`leg route-${i % 6}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} /> }))}
            {board.technicians.map((t, i) => t.stops.map((stop, n) => stop.location && <g key={stop.visitId} className={`pin route-${i % 6}${stop.status === 'completed' ? ' done' : ''}`} transform={`translate(${at(stop.location).x} ${at(stop.location).y})`} role="img" aria-label={`${t.name} stop ${n + 1}: ${stop.number} at ${ampm(stop.start)}, ${stop.address}`}><circle r="11" /><text dy="4">{n + 1}</text></g>))}
          </svg>
          {drawing && <figcaption>Click the map to add each corner of the zone.</figcaption>}
        </figure>
        <ol className="route-list">{routes.map(t => { const i = board.technicians.indexOf(t); return <li key={t.id} aria-label={`${t.name}'s route`}>
          <strong><i className={`route-key route-${i % 6}`} aria-hidden="true" />{t.name}</strong>
          {t.live && <p role="status">{t.live.status}{t.live.position && ` · ${t.live.position.lat.toFixed(5)}, ${t.live.position.lng.toFixed(5)}`}{t.live.eta ? ` · ETA ${Math.ceil(t.live.eta.seconds / 60)} min drive` : ' · ETA unavailable'}</p>}
          {t.stops.length ? <ol>{t.stops.map((stop, n) => { const leg = t.legs.find(l => l.to === stop.visitId); return <li key={stop.visitId}>
            {n > 0 && <span className="drive">{leg ? driveLabel(leg.seconds, leg.meters) : 'Drive time unknown: a stop is not on the map'}</span>}
            <span className="where"><b>{n + 1}</b>{ampm(stop.start)} · {stop.number} · {stop.address.split(',')[0]}</span>
          </li> })}</ol> : <p className="muted">No stops this day.</p>}
          {t.zones.length > 0 && <p className="zones">Zones: {t.zones.map(z => <span key={z.id}>{z.name}{owner && <button type="button" className="quiet" aria-label={`Remove zone ${z.name} for ${t.name}`} onClick={() => saveZones(t.id, t.zones.filter(x => x.id !== z.id))}>Remove</button>}</span>)}</p>}
        </li> })}</ol>
      </div>}
    {risks.some(r => board.technicians.some(t => t.stops.some(x => x.visitId === r.visitId))) && <section aria-label="Location delay watch"><h3>At risk now</h3>{risks.filter(r => board.technicians.some(t => t.stops.some(x => x.visitId === r.visitId))).map(r => <div key={r.visitId}><strong>{r.number}</strong><ul>{r.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>{r.options.map((o, i) => <p key={i}>{o.note}</p>)}</div>)}</section>}
    {board.connected && board.unlocated.length > 0 && <div className="unlocated"><p>{board.unlocated.length} site{board.unlocated.length === 1 ? ' is' : 's are'} not on the map: {board.unlocated.map(u => `${u.address}${u.problem ? ` (${u.problem})` : ''}`).join('; ')}</p>
      {can(s.actor, 'site.locate') && <button type="button" onClick={() => place.act(run('site.locate', { siteIds: board.unlocated.map(u => u.siteId) }))}>Place on the map</button>}<Problem error={place.error} /></div>}
    {drawing && owner && view && <form className="zone-draw" onSubmit={e => { e.preventDefault(); const t = board.technicians.find(x => x.id === draft.technicianId); if (t) saveZones(t.id, [...t.zones, { id: crypto.randomUUID(), name: draft.name, points: pending }], () => { setDraft({ technicianId: draft.technicianId, name: '', corners: '' }); setDrawing(false) }) }}>
      <div className="form-grid">
        <Field label="Zone for">{p => <select {...p} value={draft.technicianId} onChange={e => setDraft({ ...draft, technicianId: e.target.value })} required><option value="">Choose a technician</option>{s.technicians.filter((t: Rec) => t.active).map((t: Rec) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}</Field>
        <Field label="Zone name">{p => <input {...p} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} maxLength={80} required />}</Field>
      </div>
      <Field label="Corners" hint="One “latitude, longitude” per line; clicking the map adds one.">{p => <textarea {...p} rows={4} value={draft.corners} onChange={e => setDraft({ ...draft, corners: e.target.value })} required />}</Field>
      <Problem error={zone.error} />
      <div className="actions"><button className="primary" type="submit" disabled={pending.length < 3}>Save zone</button><button type="button" onClick={() => setDraft({ ...draft, corners: '' })}>Clear corners</button></div>
    </form>}
    {!drawing && <Problem error={zone.error} />}
  </section>
}

/** The owner's Google Maps key, an installation secret (Team). */
export function MapsConnect({ s, run }: { s: Glove; run: Run }) {
  const [key, setKey] = useState(''), action = useAction()
  if (!can(s.actor, 'maps.connect') || !s.business.length) return null
  const connected = !!s.business[0]?.maps
  return <section className="panel"><h2>Google Maps</h2><p className="muted">{connected ? 'Connected. Dispatch shows the day on a map with drive times, and you draw technicians’ service-area zones there.' : 'Connect Google Maps Platform (Geocoding, Routes and Maps Static APIs) to see the day on a map with drive times.'}</p>
    <form onSubmit={e => { e.preventDefault(); void action.act(run('maps.connect', { key }), () => setKey('')) }}>
      <Field label="Google Maps API key" hint="Kept as an installation secret; never included in exports. Google receives site addresses and coordinates only.">{p => <input {...p} type="password" value={key} onChange={e => setKey(e.target.value)} autoComplete="off" required />}</Field>
      <div className="actions"><button type="submit">Save Google Maps key</button>{connected && <button type="button" onClick={() => action.act(run('maps.connect', { key: null }))}>Disconnect Google Maps</button>}</div>
    </form><Problem error={action.error} />
  </section>
}
