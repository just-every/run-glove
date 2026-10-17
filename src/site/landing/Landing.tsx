import { SiteFooter } from '../shell/SiteFooter'
import { SiteHeader } from '../shell/SiteHeader'
import { Hero } from './Hero'
import { JobAgent, MoveIn } from './sections/Agent'
import { Closing } from './sections/Closing'
import { Details } from './sections/Details'
import { Dispatch, Technician } from './sections/Field'
import { FrontOffice, Quotes } from './sections/FrontOffice'
import { Interlude } from './sections/Interlude'
import { Payments, Plans } from './sections/Money'
import { Ownership } from './sections/Ownership'
import '../styles/site.css'
import '../styles/hero.css'
import '../styles/landing.css'
import '../styles/cards.css'

/**
 * run-glove.com's homepage, built from the design desk's approved page (17 Oct 2026, hero A, logo 8) in its order:
 * hero; front office and quotes; dispatch and the technician app; the Van 2 interlude; payments and maintenance
 * plans; the job agent and moving in; ownership; the quiet details; the closing with the footer.
 * Painted art appears only in the hero, the interlude and the closing; every other drawing is HTML and CSS.
 */
export function Landing() {
  return <>
    <SiteHeader overArt />
    <main id="main">
      <Hero />
      <div className="pair"><FrontOffice /><Quotes /></div>
      <div className="pair"><Dispatch /><Technician /></div>
      <Interlude />
      <div className="pair"><Payments /><Plans /></div>
      <div className="pair"><JobAgent /><MoveIn /></div>
      <Ownership />
      <Details />
      <Closing />
    </main>
    <SiteFooter />
  </>
}
