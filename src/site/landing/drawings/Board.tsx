import { Glyph } from '../../../ui/glyphs'
import { Stage } from '../parts'

const hours = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00']
/** The board's grid line for a clock time: the technician column, then one column per half hour from 8:00. */
const line = (hhmm: string) => 2 + (Number(hhmm.slice(0, 2)) - 8) * 2 + Number(hhmm.slice(3)) / 30
const span = (start: string, end: string) => ({ gridColumn: `${line(start)} / ${line(end)}` })

/** A morning of the dispatch board, with accepted work waiting to book on a card over it. */
export function Board() {
  return (
    <Stage className="gl-stage--board">
      <div className="gl-card gl-board">
        <div className="gl-board-hours"><span />{hours.map(h => <span key={h}>{h}</span>)}</div>
        <div className="gl-board-row">
          <span className="gl-board-tech">Priya N.</span>
          <span className="gl-board-visit gl-board-visit--booked" style={span('09:00', '10:30')}><span className="gl-board-visit-head"><b>J-1002</b><span className="gl-pill gl-pill--booked">Booked</span></span><span>09:00 – 10:30</span></span>
        </div>
        <div className="gl-board-row">
          <span className="gl-board-tech">Tom B.</span>
          <span className="gl-board-visit gl-board-visit--done" style={span('11:00', '12:30')}><span className="gl-board-visit-head"><b>J-1003</b><span className="gl-pill gl-pill--done">Completed</span></span><span>11:00 – 12:30</span></span>
        </div>
      </div>
      <div className="gl-card gl-waiting">
        <p className="gl-waiting-title">Waiting to book <span className="gl-count">1</span></p>
        <p className="gl-waiting-item"><span>Harbourview Dental</span><span>$271.15</span></p>
        <span className="gl-create">Create job<Glyph name="arrow" /></span>
      </div>
    </Stage>
  )
}
