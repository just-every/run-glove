import type { ReactNode } from 'react'
import { SiteFooter } from '../shell/SiteFooter'
import { SiteHeader } from '../shell/SiteHeader'
import './styles/index'

/** Every docs page's frame in the landing's look: paper, the leaf shadow in the top-right corner, the ledge at the foot. */
export function DocsFrame({ children }: { children: ReactNode }) {
  return (
    <div className="gl-site gl-docs">
      <img className="docs-shade" src="/brand/shade.svg" alt="" aria-hidden="true" />
      <SiteHeader current="docs" />
      {children}
      <div className="docs-ledge" aria-hidden="true" />
      <SiteFooter />
    </div>
  )
}
