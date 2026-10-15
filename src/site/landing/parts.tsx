import type { ReactNode } from 'react'
import { Glyph, type GlyphName } from '../../ui/glyphs'

/** The dark pill to /run and the underlined docs link, used by the hero and the closing band. */
export function Actions({ demo = false }: { demo?: boolean }) {
  return (
    <div className="gl-actions">
      <a className="gl-run" href="/run">Run Glove<Glyph name="arrow" /></a>
      {demo && <a className="gl-run" href="https://demo.run-glove.com/">Try the demo</a>}
      <a className="gl-docs-link" href="/docs">Read the docs</a>
    </div>
  )
}

/** A drawing in its own daylight: leaf shadow falling across it and a sandstone block beneath. */
export function Stage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`gl-stage ${className}`}>
      <div className="gl-stage-art">{children}</div>
      <div className="gl-plinth" aria-hidden="true" />
    </div>
  )
}

/** A glyph in an apricot-tint circle, as on the app's empty states. */
export const Disc = ({ glyph, size = 'md' }: { glyph: GlyphName; size?: 'md' | 'lg' }) => <span className={`gl-disc gl-disc--${size}`}><Glyph name={glyph} /></span>

/** One feature section: eyebrow, heading, one line and its drawing, text on the `side` given. */
export function Section({ id, eyebrow, heading, body, side, children }: { id: string; eyebrow: string; heading: string; body: string; side: 'left' | 'right'; children: ReactNode }) {
  return (
    <section className={`gl-section gl-section--text-${side}`} id={id} aria-labelledby={`${id}-title`}>
      <div className="gl-wrap gl-section-grid">
        <div className="gl-section-text">
          <p className="gl-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{heading}</h2>
          <p className="gl-section-body">{body}</p>
        </div>
        <div className="gl-section-drawing">{children}</div>
      </div>
    </section>
  )
}

/** The phone the technician holds: a dark bezel, the island, and its screen. */
export function Phone({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`gl-phone ${className}`}>
      <div className="gl-phone-screen">
        <span className="gl-phone-island" aria-hidden="true" />
        {children}
        <span className="gl-phone-home" aria-hidden="true" />
      </div>
    </div>
  )
}

/** "Offline — N items waiting to send." on apricot tint with the signal-off glyph. */
export const OfflineBanner = ({ items }: { items: number }) => <p className="gl-offline"><Glyph name="signalOff" /><span>Offline — {items} items waiting to send.</span></p>

/** A checklist row on the phone with the ink tick on an apricot-tint square. */
export const Tick = ({ label, pill }: { label: string; pill?: string }) => (
  <p className="gl-tick"><span className="gl-tick-box"><Glyph name="check" /></span><span className="gl-tick-label">{label}</span>{pill && <span className="gl-pill gl-pill--waiting">{pill}</span>}</p>
)
