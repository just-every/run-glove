import { Actions } from '../../shell/Actions'
import { Icon, Painting } from '../parts'

// Page 9 of the desk: the promise again over the shop at dusk with the fleet home, the day's two numbers in the sky.
export function Closing() {
  return <section className="closing" aria-labelledby="closing-title">
    <div className="site-wrap closing-copy">
      <h2 id="closing-title">Every job, done and paid.</h2>
      <p className="closing-sub">Open source field service software for plumbing, HVAC, electrical and home service pros.</p>
      <Actions demo={false} />
      <p className="closing-licence">Free and open source, MIT licensed.</p>
    </div>
    <div className="closing-scene">
      <Painting className="closing-art" name="closing" widths={[768, 1152, 1536]} sizes="min(100vw, 1680px)" phone={{ name: 'closing-phone', widths: [420, 840], media: '(max-width: 900px)' }} />
      <div className="closing-cards" role="img" aria-label="Tuesday's close: 31 jobs done, $14,820 paid today">
        <p className="cc cc-jobs" aria-hidden="true"><span className="chip chip-green chip-md"><Icon name="check" /></span>31 jobs done <Icon name="check" className="cc-tick" /></p>
        <p className="cc cc-paid" aria-hidden="true"><span className="chip chip-green chip-md"><Icon name="card" /></span><span>Paid today <span className="dot">·</span> $14,820</span></p>
      </div>
    </div>
  </section>
}
