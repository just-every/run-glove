import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { CustomerVisit } from '../ui/customer-visit'

export const Route = createFileRoute('/visit')({
  head: () => ({ meta: [{ title: 'Your visit' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><CustomerVisit /></HydrationUnit>,
})
