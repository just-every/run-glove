import { Avatar, Chip, Done, Feature, Pill } from '../parts'

// Page 2 of the desk: a night call answered and booked, then Karen Patel's quote with its three options.
export function FrontOffice() {
  return <Feature id="front-office" size={69} eyebrow="Front office" title={<>Every call answered,<br /> day or night.</>}
    label="An incoming call at 9:47 pm from Dana Whitfield of Round Rock, Texas: AC blowing warm air in the upstairs unit, booked for Wednesday, Oct 21, 8 to 10 am with Priya in Van 2, because Marcus was fully booked; the confirmation was texted"
    art={<div className="stack">
      <div className="card call-card">
        <div className="call-head"><Chip name="phone" tone="solid" size="lg" /><p className="strong">Incoming call <span className="dot">·</span> 9:47 pm</p><p className="soft">(512) 555-0148</p></div>
        <div className="row"><Avatar initials="DW" tone="sky" /><div><p className="strong">Dana Whitfield</p><p className="soft">Round Rock, TX</p></div></div>
        <div className="row"><Chip name="doc" tone="orange" /><p>AC blowing warm air <span className="dot">·</span> upstairs unit</p></div>
        <div className="row"><Chip name="calendar" tone="blue" /><p>Wed, Oct 21 <span className="dot">·</span> 8–10 am <span className="dot">·</span> Priya <span className="dot">·</span> Van 2</p><Pill>Booked</Pill></div>
      </div>
      <div className="note note-blush"><Chip name="swap" tone="orange" size="sm" /><p>Marcus fully booked <span className="dot">·</span> Priya assigned, confirmation texted</p></div>
    </div>}>
    Glove picks up calls and texts 24/7, answers like your best dispatcher, and books the job into a real open slot on a tech’s calendar.
  </Feature>
}

export function Quotes() {
  return <Feature id="quotes" size={69} flip eyebrow="Requests and quotes" title={<>Quotes that turn<br /> into jobs.</>}
    label="Quote Q-1042 for Karen Patel, a 50-gallon water heater: good, repair the valve and anode, $480; better, a new 50-gallon gas heater, $1,850, accepted; best, a tankless upgrade, $4,200. Signed Oct 19 at 2:14 pm after a reminder on day 2, with the $500 deposit paid"
    art={<div className="stack">
      <div className="card quote-card">
        <p className="card-title">Quote Q-1042 <span className="dot">·</span> Karen Patel</p><p className="soft">50-gal water heater</p>
        <div className="options">
          <div className="option"><Chip name="wrench" tone="blue" /><p><b>Good</b> <span className="dot">·</span> Repair valve and anode</p><p className="price">$480</p></div>
          <div className="option chosen"><Chip name="star" tone="orange" /><p><b>Better</b> <span className="dot">·</span> New 50-gal gas heater</p><p className="price">$1,850</p><Pill>Accepted</Pill></div>
          <div className="option"><Chip name="bolt" tone="purple" /><p><b>Best</b> <span className="dot">·</span> Tankless upgrade</p><p className="price">$4,200</p></div>
        </div>
        <p className="card-foot">Signed Oct 19 <span className="dot">·</span> 2:14 pm</p>
      </div>
      <div className="note"><Done /><p>Reminder sent day 2 <span className="dot">·</span> $500 deposit paid</p></div>
    </div>}>
    Requests from your website, Google and texts become quotes with good, better and best options. Glove follows up until the customer says yes.
  </Feature>
}
