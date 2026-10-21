import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { DocumentPage } from '../ui/documents'
export const Route = createFileRoute('/document')({
  head: () => ({ meta: [{ title: 'Customer document' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><DocumentPage /></HydrationUnit>,
})
