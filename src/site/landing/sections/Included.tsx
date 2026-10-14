import type { GlyphName } from '../../../ui/glyphs'
import { Disc } from '../parts'

const tiles: [GlyphName, string, string][] = [
  ['people', 'Roles for everyone', 'Owner, dispatcher, office and technician. Techs never see prices.'],
  ['clock', 'Job timeline', 'Every step, who did it and in which role.'],
  ['doc', 'Agent prepares, you decide', 'An agent can draft quotes, dispatch and invoices. A person approves each.'],
  ['pin', 'Customers and sites', 'Access notes go with every visit.'],
  ['calculator', 'GST to the cent', '10% of the taxable subtotal, rounded once.'],
  ['download', 'Your data, whole', 'Download the business as JSON, or move the whole installation.'],
]

/** Six white tiles: the rest of the product in one line each. */
export function Included() {
  return (
    <section className="gl-included" id="included" aria-labelledby="included-title">
      <div className="gl-wrap">
        <h2 id="included-title">Also included</h2>
        <ul className="gl-tiles">
          {tiles.map(([glyph, title, line]) => <li className="gl-card gl-tile" key={title}><Disc glyph={glyph} /><div><h3>{title}</h3><p>{line}</p></div></li>)}
        </ul>
      </div>
    </section>
  )
}
