import { Glyph } from '../../../ui/glyphs'
import { Stage } from '../parts'

/** An approved invoice and the export that carries it, ready to download. */
export function InvoiceCard() {
  return (
    <Stage className="gl-stage--invoice">
      <div className="gl-card gl-invoice">
        <p className="gl-invoice-row"><Glyph name="doc" /><span>INV-0001 · Harbourview Dental · $323.40</span><span className="gl-pill gl-pill--approved">Approved</span></p>
        <p className="gl-invoice-row"><Glyph name="download" /><span>EXP-0001 · 1 invoice · $323.40</span><span className="gl-fake-button gl-fake-button--small">Download CSV</span></p>
      </div>
    </Stage>
  )
}
