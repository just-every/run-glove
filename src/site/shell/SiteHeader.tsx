import { docsPath, repository } from './links'

/** The run site's bar: the sun mark and "Glove" at left, Docs and Source at right, a hairline under it. */
export function SiteHeader({ current }: { current?: 'docs' }) {
  return (
    <header className="gl-bar">
      <a className="gl-brand" href="/"><span className="gl-mark" aria-hidden="true" />Glove</a>
      <nav aria-label="Site">
        <a href={docsPath()} aria-current={current === 'docs' ? 'page' : undefined}>Docs</a>
        <a href={repository}>Source</a>
      </nav>
    </header>
  )
}
