import { Actions } from '../shell/Actions'
import { HeroCards } from './HeroCards'
import { Brush, Painting, Sparks } from './parts'

/** The tradesperson's work glove holding up the day's jobs over an Austin street, the promise and the action. */
export function Hero() {
  return <section className="hero" aria-labelledby="hero-title">
    <Painting className="hero-art" name="hero" widths={[768, 1152, 1536]} sizes="(max-width: 900px) 100vw, min(100vw, 1680px)" eager phone={{ name: 'hero-phone', widths: [390, 780], media: '(max-width: 900px)' }} />
    <div className="site-wrap hero-copy">
      <h1 id="hero-title">Every call<br /> becomes<br /> a <span className="brushed">paid<Brush /></span> job.<Sparks className="sparks-title" /></h1>
      <p className="hero-sub">Glove answers your calls and texts, books the job, sends the tech, takes payment on site, and keeps every maintenance plan on schedule.</p>
      <p className="hero-alt">100% free, open source alternative to <br /><strong>Jobber</strong>, <strong>Housecall Pro</strong> and <strong>ServiceTitan</strong></p>
      <Actions />
    </div>
    <HeroCards />
  </section>
}
