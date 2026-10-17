import { Avatar, Brush, Chip, d, Done, Feature, Pill } from '../parts'

// Page 5 of the desk: INV-2207 for the Okafor Residence paid by ACH after a declined card, then the Comfort Club
// plan (214 members, the same 214 the Jobber move-in brings) with Jorge Alvarez's two visits a year.
const steps: [string, string][] = [['grey', 'Sent · Oct 2'], ['red', 'Card declined · Oct 9'], ['orange', 'ACH link texted · Oct 9'], ['green', 'Paid by ACH · Oct 12']]

export function Payments() {
  return <Feature id="payments" size={90} eyebrow="Payments" title={<>Every invoice,<br /> <span className="nobr"><span className="brushed">paid<Brush /></span>.</span></>}
    label="Invoice INV-2207 for the Okafor Residence, $1,236.40, paid: sent Oct 2, card declined Oct 9, an ACH link texted Oct 9, paid by ACH Oct 12, synced to QuickBooks Online, with a job margin of 46% against an estimated 41%"
    art={<div className="card invoice-card">
      <p className="card-title">Invoice INV-2207 <span className="dot">·</span> Okafor Residence</p>
      <div className="invoice-total"><p>$1,236.40</p><Pill>Paid</Pill></div>
      <ol className="timeline">{steps.map(([tone, text]) => <li key={text}><span className={`tl-dot tl-${tone}`} /><span>{d(text)}</span></li>)}</ol>
      <div className="row"><Chip name="check" tone="green" /><p>Synced to QuickBooks Online</p></div>
      <div className="row"><Chip name="bars" tone="blue" /><p>Job margin 46% <span className="dot">·</span> estimated 41%</p></div>
    </div>}>
    Card, ACH and tap to pay through Stripe, deposits on quotes and financing on big jobs. Reminders stop when the balance hits zero, and it all syncs to QuickBooks Online.
  </Feature>
}

export function Plans() {
  return <Feature id="plans" size={79} flip eyebrow="Maintenance plans" title={<>Plans that renew<br /> <span className="nobr"><span className="brushed">themselves<Brush /></span>.</span></>}
    label="The Comfort Club plan: 214 members at $179 a year. Jorge Alvarez has 2 visits a year: the fall tune-up on Oct 14 is done, the spring tune-up on Apr 3 is booked, and the plan renews Oct 1, 2027 on auto-pay. His card had expired; an update link was texted and the plan renewed"
    art={<div className="stack">
      <div className="card plan-card">
        <p className="card-title">Comfort Club</p><p className="soft">214 members <span className="dot">·</span> $179 a year</p>
        <div className="row"><Avatar initials="JA" tone="sky" /><p>Jorge Alvarez <span className="dot">·</span> 2 visits a year</p></div>
        <div className="row"><Done className="done-lg" /><p>Fall tune-up <span className="dot">·</span> Oct 14 <span className="dot">·</span> done</p></div>
        <div className="row"><Chip name="calendar" tone="purple" /><p>Spring tune-up <span className="dot">·</span> Apr 3 <span className="dot">·</span> booked</p></div>
        <div className="row"><Chip name="refresh" tone="grey" /><p>Renews Oct 1, 2027 <span className="dot">·</span> auto-pay</p></div>
      </div>
      <div className="note"><Done /><p>Card expired <span className="dot">·</span> update link texted <span className="dot">·</span> renewed</p></div>
    </div>}>
    Sell yearly HVAC and plumbing plans. Glove books every visit, bills on renewal and reminds members before the season starts.
  </Feature>
}
