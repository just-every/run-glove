import { Disc, Stage } from '../parts'

/** The MIT licence as a card on a sandstone block. */
export function Licence() {
  return (
    <Stage className="gl-stage--licence">
      <div className="gl-card gl-licence">
        <Disc glyph="doc" size="lg" />
        <div><strong>MIT License</strong><p>Permission is hereby granted, free of charge</p></div>
      </div>
    </Stage>
  )
}
