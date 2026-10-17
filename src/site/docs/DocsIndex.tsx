import { Brush, Icon } from '../landing/parts'
import { docsPath } from '../shell/links'
import { DocsFrame } from './DocsFrame'
import { DocsSidebar } from './DocsNav'
import { docsLead, docsSections } from './pages'

/** The docs home at /docs: the sidebar, the title and lead, and each section's pages as cards in reading order. */
export function DocsIndex() {
  return (
    <DocsFrame>
      <div className="site-wrap docs-shell docs-shell--index">
        <DocsSidebar />
        <main id="main" className="docs-main">
          <header className="docs-page-head"><p className="eyebrow">Glove</p><h1 className="docs-title"><span className="brushed">Docs<Brush /></span></h1></header>
          <p className="docs-lead">{docsLead}</p>
          {docsSections.map((section, index) => (
            <section className="docs-index-section" aria-labelledby={`docs-section-${index}`} key={section.title}>
              <h2 className="eyebrow docs-index-section-title" id={`docs-section-${index}`}>{section.title}</h2>
              <ul className="docs-index-grid">
                {section.pages.map(page => <li key={page.slug}><a className="card docs-card docs-index-card" href={docsPath(page.slug)}><h3>{page.title}<Icon name="chevron" /></h3><p>{page.summary}</p></a></li>)}
              </ul>
            </section>
          ))}
        </main>
      </div>
    </DocsFrame>
  )
}
