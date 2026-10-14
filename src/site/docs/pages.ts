import { bodies, sections } from 'virtual:glove-docs'
import type { DocsPage, DocsPageMeta, DocsSection } from './types'

// The published docs, parsed from docs/site.json and rendered at build time (build/plugin.ts), and lookups over them.

export const docsSections: DocsSection[] = sections
export const docsPages: DocsPageMeta[] = sections.flatMap(section => section.pages)

/** The page with its body and contents list, or undefined for an unknown slug. */
export function getDocsPage(slug: string): DocsPage | undefined {
  const meta = docsPages.find(page => page.slug === slug)
  return meta && Object.hasOwn(bodies, slug) ? { ...meta, ...bodies[slug] } : undefined
}

/** The pages before and after `slug` in reading order, across sections. */
export function docsNeighbours(slug: string): { previous?: DocsPageMeta; next?: DocsPageMeta } {
  const index = docsPages.findIndex(page => page.slug === slug)
  return index === -1 ? {} : { previous: docsPages[index - 1], next: docsPages[index + 1] }
}

export const docsLead = 'Run Glove on your own computer, set up your business, and follow a job from the first call to the invoice.'

/** Document title and description: the docs home without a slug, a page with one. */
export function docsHead(slug?: string): { title: string; description: string } {
  const page = slug === undefined ? undefined : docsPages.find(entry => entry.slug === slug)
  return page ? { title: `${page.title} · Glove docs`, description: page.summary } : { title: 'Docs · Glove', description: docsLead }
}
