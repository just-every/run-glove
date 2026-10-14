import { DocsFrame } from './DocsFrame'
import { DocsMenu, DocsSidebar } from './DocsNav'
import { DocsPager } from './DocsPager'
import { DocsToc } from './DocsToc'
import { docsNeighbours, getDocsPage } from './pages'

/** One docs page: the sidebar, the article rendered from Markdown at build time, "On this page", previous and next. */
export function DocsArticle({ slug }: { slug: string }) {
  const page = getDocsPage(slug)
  if (!page) throw new Error(`No docs page "${slug}" in docs/site.json.`)
  const { previous, next } = docsNeighbours(slug)
  return (
    <DocsFrame>
      <div className="gl-wrap docs-shell">
        <DocsSidebar current={slug} />
        <main id="main" className="docs-main">
          <DocsMenu current={slug} label={page.title} />
          <article className="docs-article" aria-labelledby="docs-title">
            <header className="docs-page-head"><p className="gl-eyebrow">{page.section}</p><h1 id="docs-title" className="docs-title">{page.title}</h1></header>
            <DocsToc toc={page.toc} compact />
            <div className="docs-prose" dangerouslySetInnerHTML={{ __html: page.html }} />
          </article>
          <DocsPager previous={previous} next={next} />
        </main>
        <DocsToc toc={page.toc} />
      </div>
    </DocsFrame>
  )
}
