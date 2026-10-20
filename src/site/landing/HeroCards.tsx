import type { CSSProperties, ReactNode } from 'react'
import { Avatar, Chevron, Chip, Groups, Icon, Pill, Sparks, StreetMap } from './parts'

// The day's jobs held up in the glove, at the desk's positions on its 1536 x 1024 canvas (centre, size, tilt).
// Tue, Oct 20: Ellen Brooks's leaking water heater is booked for 11:00 with Luis in Van 3 and paid on site ($412.00);
// she accepts the $1,850 quote; the heater is backordered and the install rebooked for Thursday; her Comfort Club
// plan has one visit left. The sections below follow the same job (job.ts).
const Card = ({ x, y, w, h, a, tone = '', children }: { x: number; y: number; w: number; h: number; a: number; tone?: string; children: ReactNode }) =>
  <div className={`hc ${tone}`.trim()} style={{ '--x': x, '--y': y, '--w': w, '--h': h, '--a': `${a}deg` } as CSSProperties}>{children}</div>

export function HeroCards() {
  return <div className="hero-cards" role="img" aria-label="Today in Glove: a new call at 7:42 am about a leaking water heater, booked for 11:00 am; Luis in Van 3 dispatched with an ETA of 10:52 am; a $1,850 quote accepted; a part on backorder rebooked for Thursday, Oct 22 with the customer texted; $412.00 paid on site by card; and a maintenance plan with one visit left, next on Apr 3">
    <div aria-hidden="true">
      <Sparks className="sparks-a" /><Sparks className="sparks-b" /><Sparks className="sparks-c" />
      <Card x={1018.5} y={217.4} w={301} h={131} a={-10.2}>
        <Chip name="phone" tone="solid" size="lg" />
        <div className="hc-text"><p className="hc-title">New call 7:42 am</p><p className="hc-sub">Leaking water heater</p><Pill>Booked 11:00 am</Pill></div>
      </Card>
      <Card x={1212} y={355} w={382} h={111} a={4.4}>
        <Avatar initials="LR" tone="peach" />
        <div className="hc-text"><p className="hc-title">Dispatch <span className="dot">·</span> Luis</p><p className="hc-sub"><Groups parts={['Van 3', 'ETA 10:52 am']} /></p></div>
        <StreetMap className="hc-map" routes={[{ color: '#1f6bff', d: 'M70 104C150 30 250 110 330 70S500 20 560 40', stops: [[70, 104]] }]} />
        <svg className="hc-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.3 7-12.4A7 7 0 1 0 5 9.6C5 15.7 12 22 12 22z" /><circle cx="12" cy="9.6" r="2.7" /></svg>
      </Card>
      <Card x={968.6} y={470.8} w={308} h={115} a={-6.1}>
        <Chip name="doc" tone="blue" size="lg" />
        <div className="hc-text"><p className="hc-title">Quote $1,850</p><Pill>Accepted</Pill></div>
      </Card>
      <Card x={1350} y={543} w={306} h={114} a={5.4} tone="hc-blush">
        <Chip name="box" tone="orange" size="lg" />
        <div className="hc-text"><p className="hc-title">Part on backorder</p><p className="hc-sub">Rebooked Thu, Oct 22</p><p className="hc-sub">Customer texted</p></div>
        <Chevron />
      </Card>
      <Card x={1053} y={612} w={344} h={95} a={4.7}>
        <Chip name="card" tone="green" size="lg" />
        <div className="hc-text"><p className="hc-title">Paid on site</p><p className="hc-sub">$412.00 <span className="dot">·</span> card</p></div>
        <span className="hc-ok"><Icon name="check" /></span>
      </Card>
      <Card x={1154.7} y={743.2} w={348} h={103} a={6.1}>
        <Chip name="calendar" tone="purple" size="lg" />
        <div className="hc-text"><p className="hc-title">Maintenance plan</p><p className="hc-sub">1 visit left <span className="dot">·</span> next Apr 3</p></div>
        <Chevron />
      </Card>
    </div>
  </div>
}
