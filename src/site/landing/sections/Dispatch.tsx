import type { CSSProperties } from 'react'
import { BOARD, clock, LANES, PARTS_CHECK, type Lane, type Tone, type Visit } from '../job'
import { Avatar, Chip, Copy, d, Done, Drawing, Groups, Icon, Pill, Section } from '../parts'
import '../../styles/sections/dispatch.css'

// Page 03 of page-s1: 8:05 am, the day board (DISP-001, DISP-002) and Van 3's parts check for job #4417 (STOCK-001,
// with the shutoff from the 7:42 call, AGENT-001, and the on-my-way text, COMM-004). Every visit sits at its true start
// and end on an even 8 am-2 pm grid, with the now line at 8:05. At 900 px and under the board becomes one row per tech
// (the desk's 390 frame): Luis's open, the others folded.
const INK: Record<Tone, string> = { orange: '#fd4b07', blue: '#1f6bff', green: '#22a447', purple: '#6a3df2', red: '#ec4b4b', amber: '#f2b632' }
const SPAN = BOARD.to - BOARD.from
const at = (hour: number) => `${((hour - BOARD.from) / SPAN) * 100}%`
const HOURS = Array.from({ length: SPAN + 1 }, (_, i) => BOARD.from + i)
const hourLabel = (h: number) => h === 8 ? '8 am' : h === 12 ? '12 pm' : String(((h + 11) % 12) + 1)

/** One city's streets and each tech's route along them: `xs` and `ys` are the streets, a route is the street corners
 * it turns at (column, row), from its start pin to its last stop. Routes share streets and cross, as on one map. */
type City = { w: number; h: number; xs: number[]; ys: number[]; roads: { xs: number[]; ys: number[] }; parks: [number, number][]; routes: { tone: Tone; turns: [number, number][] }[] }
function RouteMap({ city, className }: { city: City; className: string }) {
  const { w, h, xs, ys } = city
  const point = ([c, r]: [number, number]) => [xs[c], ys[r]] as const
  const line = (vertical: boolean, v: number) => vertical ? `M${v} 0V${h}` : `M0 ${v}H${w}`
  return <svg className={`route-map ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice">
    <rect width={w} height={h} className="map-ground" />
    {city.parks.map(([c, r]) => <rect key={`${c}-${r}`} x={xs[c] + 4} y={ys[r] + 4} width={xs[c + 1] - xs[c] - 8} height={ys[r + 1] - ys[r] - 8} rx="3" className="map-park" />)}
    <path className="map-water" d={`M${w * .93} 0 C${w * .9} ${h * .4} ${w * .98} ${h * .6} ${w * .95} ${h} L${w} ${h} L${w} 0Z`} />
    <path className="map-street" d={[...xs.map(x => line(true, x)), ...ys.map(y => line(false, y))].join('')} />
    <path className="map-road" d={[...city.roads.xs.map(c => line(true, xs[c])), ...city.roads.ys.map(r => line(false, ys[r]))].join('')} />
    {city.routes.map(route => { const [start, ...rest] = route.turns.map(point), end = rest.at(-1)!
      return <g key={route.tone} style={{ color: INK[route.tone] }}>
        <path className="map-route" d={`M${start[0]} ${start[1]}${rest.map(([x, y]) => `L${x} ${y}`).join('')}`} />
        <circle className="map-end" cx={end[0]} cy={end[1]} r={h > 120 ? 5 : 4} />
        <g transform={`translate(${start[0]} ${start[1]})`}><path className="map-pin" d="M0 0c-4-5.2-6.4-8.4-6.4-11.4a6.4 6.4 0 0 1 12.8 0C6.4-8.4 4-5.2 0 0z" /><circle cx="0" cy="-11.4" r="2.4" className="map-pin-eye" /></g>
      </g> })}
  </svg>
}
// The wide strip over the board and the phone's taller tile: the same six routes, in board order (Luis first).
const TONES = LANES.map(lane => lane.tone)
const WIDE: City = { w: 1000, h: 88, xs: [24, 86, 150, 214, 282, 348, 414, 482, 548, 614, 680, 748, 814, 880], ys: [16, 40, 64, 84],
  roads: { xs: [3, 9], ys: [1] }, parks: [[1, 2], [6, 0], [11, 1]],
  routes: [[[1, 2], [1, 1], [5, 1], [5, 0], [8, 0]], [[0, 0], [2, 0], [2, 2], [6, 2], [6, 1], [9, 1]], [[3, 3], [3, 1], [4, 1], [4, 0], [7, 0], [7, 2], [10, 2]],
    [[4, 2], [8, 2], [8, 1], [11, 1], [11, 0], [13, 0]], [[6, 3], [6, 2], [9, 2], [9, 0], [12, 0], [12, 2]], [[7, 1], [10, 1], [10, 3], [12, 3], [12, 1], [13, 1]]]
    .map((turns, i) => ({ tone: TONES[i], turns: turns as [number, number][] })) }
const TALL: City = { w: 420, h: 170, xs: [18, 70, 124, 180, 236, 292, 348, 400], ys: [24, 62, 100, 138, 162],
  roads: { xs: [3], ys: [2] }, parks: [[0, 2], [5, 0], [4, 3]],
  routes: [[[0, 1], [2, 1], [2, 3], [4, 3]], [[1, 0], [1, 2], [3, 2], [3, 0], [5, 0]], [[0, 3], [1, 3], [1, 1], [4, 1], [4, 2]],
    [[2, 0], [4, 0], [4, 1], [6, 1], [6, 3]], [[3, 4], [3, 2], [5, 2], [5, 4], [6, 4]], [[5, 1], [5, 0], [7, 0], [7, 2], [6, 2]]]
    .map((turns, i) => ({ tone: TONES[i], turns: turns as [number, number][] })) }

/** A visit the 8:05 now line crosses: its text starts clear of the line (dispatch.css .dp-now). */
const under = (v: Visit) => v.start <= BOARD.now && BOARD.now < v.end
const visitLabel = (lane: Lane) => lane.visits.map(v => `${v.name} ${clock(v.start)} to ${clock(v.end)}`).join(', ')
const LABEL = `The board for ${BOARD.day}: ${BOARD.techs} techs, ${BOARD.jobs} jobs, at 8:05 am, with each van's route on one map. ${LANES.map(l => `${l.tech} in ${l.van}, ${l.jobs} jobs: ${visitLabel(l)}`).join('. ')}. Brooks, the water heater, is Luis's 11:00 to 12:30 visit. The parts check for Van 3: job #4417, parts on board. ${PARTS_CHECK.join('; ')}.`

export function Dispatch() {
  return <Section id="dispatch" className="dispatch">
    <Copy id="dispatch" eyebrow="8:05 am · Dispatch" title="Checked before the van rolls.">Glove checks Luis’s van for every part his jobs need, and Ellen gets the on-my-way text when he leaves Ortiz.</Copy>
    <Drawing className="dp-art" label={LABEL}>
      <div className="card dp-board">
        <p className="dp-day"><b>{BOARD.day}</b><span className="dp-count">{d(` · ${BOARD.techs} techs · ${BOARD.jobs} jobs`)}</span></p>
        <RouteMap className="dp-map-wide" city={WIDE} />
        <RouteMap className="dp-map-tall" city={TALL} />
        <div className="dp-grid">
          <div className="dp-axis">{HOURS.map(h => <span key={h} style={{ left: at(h) }}>{hourLabel(h)}</span>)}</div>
          {LANES.map(lane => <div className="dp-lane" key={lane.tech}>
            <p className="dp-tech"><Avatar initials={lane.initials} tone={lane.tint} /><span>{d(`${lane.tech} · ${lane.van}`)}</span></p>
            <div className="dp-track">{lane.visits.map(v => <p key={v.name} className={`dp-visit${v.ours ? ' dp-ours' : ''}${under(v) ? ' dp-now' : ''}`} style={{ left: at(v.start), width: `calc(${at(v.end)} - ${at(v.start)} - 4px)`, '--clear': under(v) ? (BOARD.now - v.start) / SPAN : undefined } as CSSProperties}>
              <span>{clock(v.start)}{'\u00a0'}{v.name}</span>{v.ours && <span>{v.work}</span>}</p>)}</div>
          </div>)}
          <div className="dp-lines" aria-hidden="true">{HOURS.map(h => <i key={h} style={{ left: at(h) }} />)}{HOURS.slice(0, -1).map(h => <i key={`${h}h`} className="dp-half" style={{ left: at(h + .5) }} />)}<b style={{ left: at(BOARD.now) }} /></div>
        </div>
        <ul className="dp-list">{LANES.map((lane, i) => <li key={lane.tech}>
          <details open={i === 0}>
            <summary tabIndex={-1}><Avatar initials={lane.initials} tone={lane.tint} /><span className="dp-who"><b>{lane.tech}</b>{d(` · ${lane.van} · ${lane.jobs} jobs`)}</span><Icon name="chevron" className="dp-fold" /></summary>
            <ol>{lane.visits.map(v => <li key={v.name} className={v.ours ? 'dp-mine' : ''}><span className="dp-when">{clock(v.start)} – {clock(v.end)}</span><Groups parts={[<b>{v.name}</b>, v.work]} /></li>)}</ol>
            <p className="dp-more">{lane.jobs - lane.visits.length} more after 2 pm</p>
          </details>
        </li>)}</ul>
      </div>
      <div className="card dp-agent">
        <div className="dp-agent-head"><Chip name="clipboard" tone="solid" size="lg" /><div><p className="dp-agent-who">{d('Parts check · Van 3')}</p><p className="dp-agent-title"><Groups stack parts={['Job #4417', 'Parts on board']} /></p></div><Pill>On board</Pill></div>
        <ul className="dp-checks">{PARTS_CHECK.map(item => <li key={item}><Done /><span>{d(item)}</span></li>)}</ul>
      </div>
    </Drawing>
  </Section>
}
