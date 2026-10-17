import { Avatar, Chip, d, Done, Feature, Icon, StreetMap } from '../parts'

// Page 3 of the desk: Tuesday's map board, where Okafor's job runs long and Patel moves to Marcus, then Patel's
// install on Marcus's phone: offline in the basement, synced, signed and the balance paid after the $500 deposit.
type Slot = { time: string; name: string; state: 'done' | 'next' | 'late' | 'moved' }
const lanes: { initials: string; tone: 'peach' | 'mint' | 'sky'; tech: string; slots: Slot[] }[] = [
  { initials: 'LR', tone: 'peach', tech: 'Luis · Van 3', slots: [{ time: '8:00', name: 'Okafor', state: 'late' }, { time: '11:00', name: 'Reyes', state: 'next' }, { time: '1:00', name: 'Nguyen', state: 'next' }] },
  { initials: 'MB', tone: 'mint', tech: 'Marcus · Van 5', slots: [{ time: '8:00', name: 'Garcia', state: 'done' }, { time: '10:15', name: 'Patel', state: 'moved' }, { time: '1:30', name: 'Brooks', state: 'next' }] },
  { initials: 'PS', tone: 'sky', tech: 'Priya · Van 2', slots: [{ time: '8:30', name: 'Kim', state: 'done' }, { time: '10:30', name: 'Ellis', state: 'next' }, { time: '2:00', name: 'Ward', state: 'next' }] },
]
const SlotIcon = ({ state }: { state: Slot['state'] }) => state === 'done' ? <Done /> : state === 'moved' ? <Icon name="van" className="ico-van" /> : <Icon name="clock" className={state === 'late' ? 'ico-late' : 'ico-clock'} />

export function Dispatch() {
  return <Feature id="dispatch" size={74} eyebrow="Dispatch" title={<>The right tech,<br /> the shortest route.</>} className="wide-art"
    label="The board for Tuesday, Oct 20: 6 techs and 31 jobs on a live map. Luis in Van 3 has Okafor at 8:00, Reyes at 11:00 and Nguyen at 1:00; Marcus in Van 5 has Garcia at 8:00, Patel at 10:15 and Brooks at 1:30; Priya in Van 2 has Kim at 8:30, Ellis at 10:30 and Ward at 2:00. Okafor ran 40 minutes long, so Patel moved to Marcus and the on-my-way text was sent"
    art={<div className="card board-card">
      <p className="board-day">Tue, Oct 20</p><p className="soft">6 techs <span className="dot">·</span> 31 jobs</p>
      <StreetMap className="board-map" routes={[
        { color: '#fd4b07', d: 'M70 52c-10 30 30 40 70 30s30-50 60-60 40 10 60-5', stops: [[262, 18], [200, 98]], van: [76, 40] },
        { color: '#1f6bff', d: 'M300 80c30 0 40-20 60-22s30-30 50-20 40 20 70 20', stops: [[300, 80], [480, 66]], van: [355, 30] },
        { color: '#6a3df2', d: 'M540 40c10 20 0 50 30 60s40-20 60-30', stops: [[575, 100], [632, 64]], van: [545, 28] },
      ]} />
      {lanes.map(lane => <div className="lane" key={lane.tech}>
        <div className="lane-tech"><Avatar initials={lane.initials} tone={lane.tone} /><p>{d(lane.tech)}</p></div>
        {lane.slots.map(slot => <div className={`slot slot-${slot.state}`} key={slot.time}><SlotIcon state={slot.state} /><p><b>{slot.time}</b><span>{slot.name}</span></p></div>)}
      </div>)}
      <div className="note note-alert"><span className="alert-dot">!</span><p>Okafor ran 40 min long <span className="dot">·</span> Patel moved to Marcus <span className="dot">·</span> on-my-way text sent</p></div>
    </div>}>
    Drag jobs on a live map board. Glove routes every van, shows where each tech is, and reshuffles the day when a job runs long.
  </Feature>
}

export function Technician() {
  return <Feature id="technician" size={74} flip eyebrow="Technician app" title="Built for the job site."
    label="Job 8812 at 14 Elm Ct, Austin, Texas on the technician's phone: offline for 22 minutes in a basement and synced at 12:06 pm; old heater drained and removed, new 50-gallon heater installed, 6 photos and the customer's signature, all done; the $1,350.00 balance paid on site by tap to pay"
    art={<div className="tech">
      <div className="note tech-sync"><Icon name="cloud" className="sync-cloud" /><p>Offline 22 min in a basement <span className="dot">·</span> synced 12:06 pm</p></div>
      <div className="card tech-card">
        <p className="card-title">Job #8812</p><p className="soft">14 Elm Ct, Austin, TX</p>
        <ul className="checks">{['Old heater drained and removed', 'New 50-gal heater installed', 'Photos · 6', 'Customer signature'].map(item => <li key={item}><Done /><span>{d(item)}</span></li>)}</ul>
        <div className="tech-paid"><Icon name="card" /><p>Paid on site <span className="dot">·</span> $1,350.00 <span className="dot">·</span> tap to pay</p></div>
      </div>
    </div>}>
    Techs get the job, the history and the photos on their phone, take signatures and payment on site, and keep working with no signal.
  </Feature>
}
