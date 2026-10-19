import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { PublicServiceReport } from '../ui/service-report'

export const Route = createFileRoute('/report')({
  head: () => ({ meta: [{ title: 'Service report' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><PublicServiceReport /></HydrationUnit>,
})
