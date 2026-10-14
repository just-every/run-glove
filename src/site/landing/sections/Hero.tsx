import { SiteHeader } from '../../shell/SiteHeader'
import { HeroSteps } from '../drawings/HeroSteps'
import { Actions } from '../parts'

/** The hero in daylight: headline, subhead, the free line, the actions and the 1-2-3 on the sandstone ledge. */
export function Hero() {
  return (
    <section className="gl-hero" id="top" aria-labelledby="hero-title">
      <img className="gl-daylight" src="/brand/daylight.svg" alt="" aria-hidden="true" />
      <SiteHeader />
      <div className="gl-wrap gl-hero-copy">
        <h1 id="hero-title">From quote to sign-off.</h1>
        <p className="gl-sub">Book visits, record the work on your techs’ phones, signal or not, and get the invoice ready.</p>
        <p className="gl-alt">100% free, open source alternative to <strong>ServiceM8</strong>, <strong>Jobber</strong> and <strong>Tradify</strong></p>
        <Actions />
        <p className="gl-small">Free and open source, MIT licensed.</p>
      </div>
      <div className="gl-wrap gl-hero-drawing"><HeroSteps /></div>
      <div className="gl-ledge" aria-hidden="true" />
    </section>
  )
}
