import type { CSSProperties } from 'react'
import { BOARD, clock, LANES, READY, type Lane, type Tone } from '../job'
import { Avatar, Chip, Copy, d, Done, Drawing, glue, Icon, Pill, Section } from '../parts'
import '../../styles/sections/dispatch.css'

// Page 03 of page-s1: 8:05 am, the day board (DISP-001, DISP-002) and the job agent's ready check for job #4417
// (AGENT-002). Every visit sits at its true start and end on an even 8 am-2 pm grid, with the now line at 8:05. At
// 900 px and under the board becomes one row per tech (the desk's 390 frame): Luis's open, the others folded.
const INK: Record<Tone, string> = { orange: '#fd4b07', blue: '#1f6bff', green: '#22a447', purple: '#6a3df2', red: '#ec4b4b', amber: '#f2b632' }
const SPAN = BOARD.to - BOARD.from
const at = (hour: number) => `${((hour - BOARD.from) / SPAN) * 100}%`
const HOURS = Array.from({ length: SPAN + 1 }, (_, i) => BOARD.from + i)
const hourLabel = (h: number) => h === 8 ? '8 am' : h === 12 ? '12 pm' : String(((h + 11) % 12) + 1)

/** A street map with each tech's route, start pin and last stop, drawn from a fixed seed so it never changes. */
function RouteMap({ w, h, routes, className }: { w: number; h: number; routes: { tone: Tone; d: string; pin: [number, number]; end: [number, number] }[]; className: string }) {
  let seed = 7
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const streets: string[] = []
  for (let x = 10; x < w; x += 26 + rand() * 24) streets.push(`M${x.toFixed(0)} 0 L${(x + (rand() - .5) * 30).toFixed(0)} ${h}`)
  for (let y = 8; y < h; y += 16 + rand() * 14) streets.push(`M0 ${y.toFixed(0)} L${w} ${(y + (rand() - .5) * 16).toFixed(0)}`)
  const parks = Array.from({ length: Math.round(w / 120) }, () => [rand() * w, rand() * h, 18 + rand() * 30, 10 + rand() * 16])
  return <svg className={`route-map ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
    <rect width={w} height={h} className="map-ground" />
    {parks.map(([x, y, pw, ph]) => <rect key={`${x}`} x={x} y={y} width={pw} height={ph} rx="3" className="map-park" />)}
    <path className="map-water" d={`M${w * .9} 0 C${w * .86} ${h * .4} ${w * .97} ${h * .6} ${w * .93} ${h} L${w} ${h} L${w} 0Z`} />
    <path className="map-street" d={streets.join('')} />
    <path className="map-road" d={`M0 ${h * .62} C${w * .3} ${h * .5} ${w * .6} ${h * .78} ${w} ${h * .55}M${w * .18} 0 L${w * .34} ${h}M${w * .62} 0 L${w * .55} ${h}`} />
    {routes.map(route => <g key={route.d} style={{ color: INK[route.tone] }}>
      <path className="map-route" d={route.d} />
      <circle className="map-end" cx={route.end[0]} cy={route.end[1]} r={h > 120 ? 5 : 4} />
      <g transform={`translate(${route.pin[0]} ${route.pin[1]})`}><path className="map-pin" d="M0 0c-4-5.2-6.4-8.4-6.4-11.4a6.4 6.4 0 0 1 12.8 0C6.4-8.4 4-5.2 0 0z" /><circle cx="0" cy="-11.4" r="2.4" className="map-pin-eye" /></g>
    </g>)}
  </svg>
}
// One route per tech, left to right in board order: the wide strip over the board and the phone's taller tile.
const WIDE = LANES.map((lane, i) => { const x = 40 + i * 160, y = i % 2 ? 62 : 26
  return { tone: lane.tone, pin: [x, y] as [number, number], end: [x + 120, 88 - y] as [number, number], d: `M${x} ${y} C${x + 40} ${y + (i % 2 ? -34 : 50)} ${x + 70} ${88 - y + (i % 2 ? 30 : -40)} ${x + 120} ${88 - y}` } })
const TALL = LANES.map((lane, i) => { const x = 22 + i * 66, y = 34 + (i % 3) * 8
  return { tone: lane.tone, pin: [x, y] as [number, number], end: [x + 40, 140 - (i % 2) * 14] as [number, number], d: `M${x} ${y} L${x + 6} ${y + 30} L${x + 30} ${y + 38} L${x + 34} ${y + 70} L${x + 40} ${140 - (i % 2) * 14}` } })

const visitLabel = (lane: Lane) => lane.visits.map(v => `${v.name} ${clock(v.start)} to ${clock(v.end)}`).join(', ')
const LABEL = `The board for ${BOARD.day}: ${BOARD.techs} techs, ${BOARD.jobs} jobs, at 8:05 am, with each van's route on a map. ${LANES.map(l => `${l.tech} in ${l.van}, ${l.jobs} jobs: ${visitLabel(l)}`).join('. ')}. Brooks, the water heater, is Luis's 11:00 to 12:30 visit. The job agent: job #4417 is ready to dispatch. ${READY.join('; ')}.`

export function Dispatch() {
  return <Section id="dispatch" className="dispatch">
    <Copy id="dispatch" eyebrow="8:05 am · Dispatch" title="Checked before the van rolls.">The job agent confirms access, parts and permits before anyone drives.</Copy>
    <Drawing className="dp-art" label={LABEL}>
      <div className="card dp-board">
        <p className="dp-day"><b>{BOARD.day}</b><span className="dp-count">{d(` · ${BOARD.techs} techs · ${BOARD.jobs} jobs`)}</span></p>
        <RouteMap className="dp-map-wide" w={1000} h={88} routes={WIDE} />
        <RouteMap className="dp-map-tall" w={420} h={170} routes={TALL} />
        <div className="dp-grid">
          <div className="dp-axis">{HOURS.map(h => <span key={h} style={{ left: at(h) }}>{hourLabel(h)}</span>)}</div>
          {LANES.map(lane => <div className="dp-lane" key={lane.tech}>
            <p className="dp-tech"><Avatar initials={lane.initials} tone={lane.tint} /><span>{d(`${lane.tech} · ${lane.van}`)}</span></p>
            <div className="dp-track">{lane.visits.map(v => <p key={v.name} className={`dp-visit${v.ours ? ' dp-ours' : ''}`} style={{ left: at(v.start), width: `calc(${at(v.end)} - ${at(v.start)} - 4px)` } as CSSProperties}>
              <span>{clock(v.start)} {v.name}</span>{v.ours && <span>{v.work}</span>}</p>)}</div>
          </div>)}
          <div className="dp-lines" aria-hidden="true">{HOURS.map(h => <i key={h} style={{ left: at(h) }} />)}{HOURS.slice(0, -1).map(h => <i key={`${h}h`} className="dp-half" style={{ left: at(h + .5) }} />)}<b style={{ left: at(BOARD.now) }} /></div>
        </div>
        <ul className="dp-list">{LANES.map((lane, i) => <li key={lane.tech}>
          <details open={i === 0}>
            <summary tabIndex={-1}><Avatar initials={lane.initials} tone={lane.tint} /><span className="dp-who"><b>{lane.tech}</b>{d(` · ${lane.van} · ${lane.jobs} jobs`)}</span><Icon name="chevron" className="dp-fold" /></summary>
            <ol>{lane.visits.map(v => <li key={v.name} className={v.ours ? 'dp-mine' : ''}><span className="dp-when">{clock(v.start)} – {clock(v.end)}</span><span><b>{v.name}</b>{d(` · ${v.work}`)}</span></li>)}</ol>
            <p className="dp-more">{lane.jobs - lane.visits.length} more after 2 pm</p>
          </details>
        </li>)}</ul>
      </div>
      <div className="card dp-agent">
        <div className="dp-agent-head"><Chip name="clipboard" tone="solid" size="lg" /><div><p className="dp-agent-who">Job agent</p><p className="dp-agent-title">{d(`Job #4417 · ${glue('Ready to dispatch')}`)}</p></div><Pill>Ready</Pill></div>
        <ul className="dp-checks">{READY.map(item => <li key={item}><Done /><span>{d(item)}</span></li>)}</ul>
      </div>
    </Drawing>
  </Section>
}
