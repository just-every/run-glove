import { Lockup } from './Lockup'
import { links } from './links'

/** One line: the lockup, then Docs, Source and the licence. */
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-wrap site-footer-row">
      <Lockup />
      <nav aria-label="Footer"><a href={links.docs}>Docs</a><a href={links.source}>Source</a><a href={links.licence}>MIT licensed</a></nav>
    </div>
  </footer>
}
