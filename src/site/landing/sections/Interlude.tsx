import { Done, Painting } from '../parts'

// Page 4 of the desk: Van 2's open doors with stocked shelves, and the morning's check over it.
export function Interlude() {
  return <section className="interlude" aria-label="Van 2 stocked, parts for all 5 jobs on board">
    <Painting className="interlude-art" name="interlude" widths={[768, 1152, 1536]} sizes="100vw" />
    <p className="interlude-badge" aria-hidden="true"><Done className="done-lg" /><span>Van 2 stocked <span className="dot">·</span> parts for all 5 jobs on board</span></p>
  </section>
}
