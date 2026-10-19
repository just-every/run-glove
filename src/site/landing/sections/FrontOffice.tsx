import { Avatar, Chip, Copy, d, Drawing, Pill, Section } from '../parts'
import '../../styles/sections/front-office.css'

// Page 02 of page-s1: 7:42 am, the front office answers Ellen's call, says it is an automated assistant (AGENT-001),
// and books job #4417 into Luis's open slot with the confirmation text (BOOK-002, COMM-003).
const CALL: ['agent' | 'caller', string][] = [
  ['agent', 'Oak Street Plumbing & Air, automated assistant. What’s going on?'],
  ['caller', 'Water heater’s leaking all over the garage.'],
  ['agent', 'Gas or electric? Can you reach the shutoff valve?'],
  ['caller', 'Gas. I turned the valve off.'],
  ['agent', 'Luis can be there at 11. I’ll text you the details.'],
]

export function FrontOffice() {
  return <Section id="front-office" className="front-office">
    <Copy id="front-office" eyebrow="7:42 am · Front office" title={<>Answered on<br /> the first ring.</>}>
      Glove’s front office picks up day or night, asks what a good dispatcher would ask, and books a real open slot.
    </Copy>
    <Drawing className="fo-art" label="An incoming call from (512) 555-0186, 1 minute 48 seconds. The assistant: “Oak Street Plumbing & Air, automated assistant. What’s going on?” Ellen Brooks: “Water heater’s leaking all over the garage.” The assistant: “Gas or electric? Can you reach the shutoff valve?” Ellen: “Gas. I turned the valve off.” The assistant: “Luis can be there at 11. I’ll text you the details.” New job #4417, booked: Ellen Brooks, 418 Cedar Hollow Dr; leaking water heater, 50-gal gas, 12 years old; Tue, Oct 20, 11:00 am to 12:30 pm with Luis in Van 3. Text sent: “You’re booked for 11:00. Luis will text when he’s on his way.”">
      <div className="card fo-call">
        <div className="fo-call-head"><Chip name="phone" tone="solid" size="lg" /><p className="fo-call-title">Incoming call{d(' · (512) 555-0186')}</p><p className="fo-call-time">1:48</p></div>
        <ol className="fo-thread">{CALL.map(([who, text]) => <li key={text} className={`fo-say fo-say-${who}`}>
          {who === 'caller' && <Avatar initials="EB" tone="grey" />}<p>{d(text)}</p>{who === 'agent' && <span className="fo-glove"><img src="/brand/mark.svg" alt="" width="24" height="24" /></span>}
        </li>)}</ol>
      </div>
      <div className="card fo-job">
        <div className="fo-job-head"><Chip name="doc" tone="solid" size="lg" /><p className="card-title">New job #4417</p><Pill>Booked</Pill></div>
        <ul className="fo-rows">
          <li><Chip name="user" tone="blue" /><p>{d('Ellen Brooks · 418 Cedar Hollow Dr')}</p></li>
          <li><Chip name="wrench" tone="orange" /><p>{d('Leaking water heater · 50-gal gas · 12 yrs')}</p></li>
          <li><Chip name="calendar" tone="purple" /><p>{d('Tue, Oct 20 · 11:00 am–12:30 pm · Luis · Van 3')}</p></li>
          <li><Chip name="message" tone="green" /><p className="fo-text">{d('You’re booked for 11:00. Luis will text when he’s on his way.')}</p></li>
        </ul>
      </div>
    </Drawing>
  </Section>
}
