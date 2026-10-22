import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { RequestForm } from '../ui/request-form'

export const Route = createFileRoute('/request')({
  head: () => ({ meta: [{ title: 'Request service' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><RequestForm /></HydrationUnit>,
})
