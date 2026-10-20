import { COSTING, INVOICE } from '../job'
import { Chip, Copy, d, Done, Drawing, Groups, Section } from '../parts'
import '../../styles/sections/payments.css'

// Page 07 of page-s1: Thursday 10:05 am, the install's balance paid by tap to pay (PAY-003) and synced to QuickBooks
// Online (LEDGER-001); job costing for both visits, estimate against actual (COST-004); the review request (COMM-008).
const LABEL = `Invoice ${INVOICE.number} for Ellen Brooks: ${INVOICE.lines.map(([what, amount]) => `${what} ${amount}`).join(', ')}; balance ${INVOICE.balance}, paid ${INVOICE.balance} by tap to pay at 10:05 am, synced to QuickBooks Online at 10:06 am. Job costing for #4417 and #4418, estimate then actual: ${COSTING.map(([row, est, act]) => `${row} ${est} and ${act}`).join('; ')}. Review request goes out at 6:00 pm.`

export function Payments() {
  return <Section id="payments" className="payments">
    <Copy id="payments" eyebrow="Thursday 10:05 am · Payments" title="Paid on the spot.">
      Card, tap to pay, ACH or financing on site. Each payment lands in QuickBooks Online; the job shows its real margin.
    </Copy>
    <Drawing className="pay-art" label={LABEL}>
      <div className="card pay-invoice">
        <div className="pay-head"><Chip name="doc" tone="orange" size="lg" /><p className="card-title"><Groups stack parts={[`Invoice ${INVOICE.number}`, 'Ellen Brooks']} /></p></div>
        <dl className="pay-lines">{INVOICE.lines.map(([what, amount]) => <div key={what}><dt>{d(what)}</dt><dd>{amount}</dd></div>)}<div className="pay-balance"><dt>Balance</dt><dd>{INVOICE.balance}</dd></div></dl>
        <p className="pay-paid"><Done className="pay-paid-ok" /><Groups parts={[<b>Paid {INVOICE.balance}</b>, INVOICE.paid]} /></p>
        <p className="pay-synced"><Done className="pay-synced-ok" /><span>{d(INVOICE.synced)}</span></p>
      </div>
      <div className="card pay-costing">
        <div className="pay-head"><Chip name="bars" tone="blue" size="lg" /><p className="card-title"><Groups parts={['Job costing', '#4417 + #4418']} /></p></div>
        <table><thead><tr><th /><th>Estimate</th><th>Actual</th></tr></thead>
          <tbody>{COSTING.map(([row, est, act]) => <tr key={row}><th>{row}</th><td>{est}</td><td>{act}</td></tr>)}</tbody></table>
      </div>
      <div className="card pay-review"><Chip name="mail" tone="red" size="lg" /><p><Groups parts={[<b>Review request</b>, 'goes out 6:00 pm']} /></p></div>
    </Drawing>
  </Section>
}
