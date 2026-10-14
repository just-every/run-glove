import { Glyph, type GlyphName } from '../../../ui/glyphs'
import { Stage } from '../parts'

const rows: [GlyphName, string][] = [['records', 'Records'], ['folder', 'Become Glove records'], ['merge', 'Merged'], ['xCircle', 'Rejected']]

/** A ServiceM8 move-in preview, committed exactly as previewed. */
export function MoveInCard() {
  return (
    <Stage className="gl-stage--movein">
      <div className="gl-card gl-movein">
        <p className="gl-movein-title">Preview a move-in</p>
        {rows.map(([glyph, label]) => <p className="gl-movein-row" key={label}><Glyph name={glyph} /><span>{label}</span><Glyph name="chevronRight" /></p>)}
        <span className="gl-fake-button gl-fake-button--full">Commit exactly this preview</span>
      </div>
    </Stage>
  )
}
