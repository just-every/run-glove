import { Actions } from '../parts'

/** The closing band, back in the hero's daylight on the sandstone. */
export function Closing() {
  return (
    <section className="gl-closing" id="run" aria-labelledby="closing-title">
      <img className="gl-daylight gl-daylight--closing" src="/brand/shade.svg" alt="" aria-hidden="true" />
      <div className="gl-wrap gl-closing-copy">
        <h2 id="closing-title">Try it on your next job.</h2>
        <p>Run Glove on your own computer beside what you use today.</p>
        <Actions />
      </div>
      <div className="gl-ledge gl-ledge--closing" aria-hidden="true" />
    </section>
  )
}
