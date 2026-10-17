import { d, Done, Feature, Icon } from '../parts'

// Page 6 of the desk: the job agent readying Nguyen's 1:00 furnace visit on Luis's board, then the move-in from Jobber.
const log: [string, 'blue' | 'orange' | 'green' | 'ok', string][] = [
  ['Mon 4:10 pm', 'blue', 'Igniter HSI-271 reserved at the supply house'],
  ['Mon 4:12 pm', 'blue', 'Gate code confirmed by text'],
  ['Tue 7:05 am', 'orange', 'Supplier delay · pickup now 11:30'],
  ['Tue 7:06 am', 'green', 'Visit moved to 1:00 pm · customer agreed'],
  ['Tue 2:20 pm', 'ok', 'Paid $386.00 · reconciled'],
]
const moved: [string, string][] = [['Customers', '3,418'], ['Jobs', '12,906'], ['Open quotes', '47'], ['Maintenance plans', '214'], ['Open balances', '$38,210.55 · matched']]

export function JobAgent() {
  return <Feature id="job-agent" size={85} eyebrow="Job agent" title={<>Ready before<br /> the van rolls.</>}
    label="Job 8840 for Nguyen, a furnace igniter, worked by the job agent: Monday 4:10 pm igniter HSI-271 reserved at the supply house; 4:12 pm gate code confirmed by text; Tuesday 7:05 am a supplier delay moves the pickup to 11:30; 7:06 am the visit moves to 1:00 pm and the customer agrees; 2:20 pm $386.00 paid and reconciled"
    art={<div className="card agent-card">
      <div className="agent-head"><div><p className="card-title">Job #8840 <span className="dot">·</span> Nguyen</p><p className="soft">Furnace igniter</p></div><p className="agent-badge"><Icon name="clipboard" />Job agent</p></div>
      <ol className="agent-log">{log.map(([time, tone, text]) => <li key={time}><span className="agent-time">{time}</span>{tone === 'ok' ? <Done className="agent-ok" /> : <span className={`tl-dot tl-${tone}`} />}<span>{d(text)}</span></li>)}</ol>
    </div>}>
    The job agent confirms parts and access the day before, rebooks around delays and chases every invoice until it is paid and reconciled.
  </Feature>
}

export function MoveIn() {
  return <Feature id="move-in" size={72} flip eyebrow="Move in" title={<>Bring your<br /> business with you.</>}
    label="Importing from Jobber, 100%: 3,418 customers, 12,906 jobs, 47 open quotes, 214 maintenance plans and $38,210.55 of open balances matched; 9 customers share a phone number and wait for a merge review"
    art={<div className="card import-card">
      <p className="card-title">Importing from Jobber</p>
      <div className="progress"><span /><p>100%</p></div>
      <ul className="import-rows">{moved.map(([what, count]) => <li key={what}><Done /><span>{what}</span><span className="count">{d(count)}</span></li>)}
        <li className="warn"><span className="warn-dot">!</span><span>9 customers share a phone number <span className="dot">·</span> merge review</span></li></ul>
    </div>}>
    Move from Jobber, Housecall Pro or ServiceTitan with your customers, jobs, quotes, maintenance plans and open balances.
  </Feature>
}
