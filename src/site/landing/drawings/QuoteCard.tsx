import { Glyph } from '../../../ui/glyphs'
import { Stage } from '../parts'

/** An accepted quote: price-book lines, GST to the cent and the customer's yes. */
export function QuoteCard() {
  return (
    <Stage className="gl-stage--quote">
      <div className="gl-card gl-quote">
        <p className="gl-quote-line"><span>Split system service</span><span>$199.00</span></p>
        <p className="gl-quote-line"><span>R32 refrigerant 0.5 × $95.00</span><span>$47.50</span></p>
        <p className="gl-quote-line"><span>GST</span><span>$24.65</span></p>
        <p className="gl-quote-line gl-quote-total"><span>Total inc GST</span><span>$271.15</span></p>
        <p className="gl-accepted"><Glyph name="check" />Accepted</p>
      </div>
    </Stage>
  )
}
