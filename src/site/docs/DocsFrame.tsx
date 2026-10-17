import type { ReactNode } from 'react'
import { SiteFooter } from '../shell/SiteFooter'
import { SiteHeader } from '../shell/SiteHeader'
import '../styles/site.css'
import '../styles/cards.css'
import '../styles/docs.css'

/** Every docs page's frame in the landing's look: the header with its hairline, the paper with the orange corner
 * glow, the white footer. */
export function DocsFrame({ children }: { children: ReactNode }) {
  return <div className="docs">
    <SiteHeader current="docs" />
    {children}
    <SiteFooter />
  </div>
}
