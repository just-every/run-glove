import { Chip, type IconName } from '../parts'

// Page 8 of the desk: six smaller things, three by two, each on its tinted round icon.
const details: [IconName, 'orange' | 'green' | 'blue' | 'purple' | 'indigo', string, string][] = [
  ['star', 'orange', 'Review requests', 'A five-star ask after every paid job.'],
  ['clock', 'green', 'Time tracking', 'Clock-ins tied to every job and visit.'],
  ['doc', 'blue', 'Job costing', 'Estimate against actual, job by job.'],
  ['users', 'purple', 'Customer hub', 'Quotes, invoices and visits in one link.'],
  ['tag', 'orange', 'Price book', 'Your parts and labor rates, ready to quote.'],
  ['file', 'indigo', 'Activity log', 'Every call, change and payment, recorded.'],
]

export function Details() {
  return <section id="details" className="details" aria-labelledby="details-title">
    <div className="site-wrap">
      <p className="eyebrow">Also included</p>
      <h2 id="details-title">The quiet details.</h2>
      <ul className="detail-grid">{details.map(([icon, tone, title, body]) => <li className="card detail" key={title}>
        <Chip name={icon} tone={tone === 'indigo' ? 'blue' : tone} size="lg" /><h3>{title}</h3><p>{body}</p></li>)}</ul>
    </div>
  </section>
}
