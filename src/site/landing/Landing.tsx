import { SiteFooter } from '../shell/SiteFooter'
import { SiteHeader } from '../shell/SiteHeader'
import { Hero } from './Hero'
import { Closing } from './sections/Closing'
import { Dispatch } from './sections/Dispatch'
import { FrontOffice } from './sections/FrontOffice'
import { Interlude } from './sections/Interlude'
import { JobAgent } from './sections/JobAgent'
import { MoveIn } from './sections/MoveIn'
import { Payments } from './sections/Payments'
import { Plans } from './sections/Plans'
import { TechApp } from './sections/TechApp'
import '../styles/site.css'
import '../styles/hero.css'
import '../styles/landing.css'
import '../styles/cards.css'

/**
 * run-glove.com's homepage on the owner-approved structure (design desk page-s1, 17 Oct 2026): one real job, Ellen
 * Brooks's water heater, from the call to a year of Comfort Club (job.ts). The hero; the front office at 7:42 am;
 * dispatch at 8:05; the tech app at 10:52; the job agent at 12:40 pm; the Van 3 interlude; payments on Thursday;
 * the maintenance plan's year; moving in from Jobber; the closing with the footer. Painted art appears only in the
 * hero, the interlude, the closing and the tech app's photos; every other drawing is HTML, CSS and inline SVG.
 */
export function Landing() {
  return <>
    <SiteHeader overArt />
    <main id="main">
      <Hero />
      <FrontOffice />
      <Dispatch />
      <TechApp />
      <JobAgent />
      <Interlude />
      <Payments />
      <Plans />
      <MoveIn />
      <Closing />
    </main>
    <SiteFooter />
  </>
}
