import { IMPORTED, START } from '../job'
import { links } from '../../shell/links'
import { Copy, d, Done, Drawing, Icon, Section } from '../parts'
import '../../styles/sections/move-in.css'

// Page 09 of page-s1: the move from Jobber (MOVE-001): customers, jobs, quotes, recurring jobs and open balances in
// one import, shared phone numbers sent to merge review (CUST-005); then the five lines a stranger can run, and the
// limits, worded as the contract's Honest boundaries.

// "$38,210.55 · matched": the figure in ink, its note soft.
const Count = ({ value }: { value: string }) => { const [figure, note] = value.split(' · ')
  return <span className="mv-count">{figure}{note && <>{'\u00a0'}<span className="dot">·</span> <span className="mv-note">{note}</span></>}</span> }

export function MoveIn() {
  return <Section id="move-in" className="move-in">
    <div className="mv-grid">
      <Copy id="move-in" eyebrow="Moving in" title={<>Bring your shop<br /> from Jobber.</>}>
        Customers, jobs, quotes, recurring jobs and open balances come across in one import, onto your office computer or your own server.
      </Copy>
      <Drawing className="mv-import-wrap" label={`Import from Jobber, 100%: ${IMPORTED.map(([what, count]) => `${what} ${count.replace(' · ', ', ')}`).join('; ')}. 9 customers share a phone number: review merge.`}>
        <div className="card mv-import">
          <p className="mv-title">Import from Jobber</p>
          <div className="mv-progress"><span /><b>100%</b></div>
          <ul className="mv-rows">{IMPORTED.map(([what, count]) => <li key={what}><Done /><span>{what}</span><Count value={count} /></li>)}</ul>
          <p className="mv-warn"><span className="mv-warn-dot">!</span><span>{d('9 customers share a phone number · review merge')}</span></p>
        </div>
      </Drawing>
      <div className="terminal mv-terminal" role="img" aria-label={`Five commands: ${START.join('; ')}`}>
        <div aria-hidden="true"><p className="terminal-dots"><span /><span /><span /></p>
          {START.map(line => <p key={line} className="terminal-line"><span className="prompt">$</span><span>{line}</span></p>)}</div>
      </div>
      <p className="mv-limits"><span className="mv-limits-icon"><Icon name="wrench" /></span><span><b>What it doesn’t do:</b> payroll, GPS hardware or marketing campaigns. <a href={`${links.docs}/limits`}>Read the limits</a></span></p>
    </div>
  </Section>
}
