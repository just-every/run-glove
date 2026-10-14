import { licence, repository } from './links'

/** One line: the mark and "Glove" at left, the licence and the source at right. */
export function SiteFooter() {
  return (
    <footer className="gl-footer">
      <a className="gl-brand gl-brand--small" href="/"><span className="gl-mark" aria-hidden="true" />Glove</a>
      <nav aria-label="Project">
        <a href={licence}>MIT licence</a>
        <a href={repository}>Source</a>
      </nav>
    </footer>
  )
}
