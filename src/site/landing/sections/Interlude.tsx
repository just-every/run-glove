import { BLEED, Done, Groups, Painting } from '../parts'

// Page 06 of page-s1: the shipped plate, Van 3 stocked at Ellen's house with the new heater on a hand truck, and the
// morning's check over it as HTML.
export function Interlude() {
  return <section className="interlude" aria-label="Van 3: Ellen's heater delivered, parts for all 5 jobs">
    <Painting className="interlude-art" name="interlude" widths={BLEED} sizes="100vw" />
    <p className="interlude-badge" aria-hidden="true"><Done className="done-lg" /><Groups parts={['Van 3 · Ellen’s heater delivered', 'parts for all 5 jobs']} /></p>
  </section>
}
