import { Glyph } from '../../../ui/glyphs'
import { OfflineBanner, Phone, Tick } from '../parts'
import { Signature } from './Signature'

/** The hero's 1-2-3 on the sandstone ledge: booked, captured on the phone through a lost signal, signed off. */
export function HeroSteps() {
  return (
    <ol className="gl-steps" aria-label="Glove in three steps: booked, on site, signed off">
      <li className="gl-step gl-step--booked">
        <p className="gl-step-label"><span className="gl-step-num" aria-hidden="true">1</span>Booked</p>
        <div className="gl-card gl-booked">
          <span className="gl-booked-icon"><Glyph name="calendar" /></span>
          <span className="gl-booked-text"><strong>J-1002 · Split system service</strong><span>Priya N. · 09:00 – 10:30</span></span>
        </div>
      </li>
      <li className="gl-step gl-step--site">
        <p className="gl-step-label"><span className="gl-step-num" aria-hidden="true">2</span>On site</p>
        <Phone className="gl-phone--hero">
          <div className="gl-phone-list">
            <Tick label="Isolate power" />
            <Tick label="Clean filters" />
          </div>
          <OfflineBanner items={3} />
        </Phone>
      </li>
      <li className="gl-step gl-step--signed">
        <p className="gl-step-label"><span className="gl-step-num" aria-hidden="true">3</span>Signed off</p>
        <div className="gl-card gl-signed">
          <p>Signed off by Dr Mei Lin</p>
          <Signature />
          <span className="gl-fake-button">Prepare invoice</span>
        </div>
      </li>
    </ol>
  )
}
