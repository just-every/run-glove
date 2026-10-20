import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { CustomerBooking } from '../ui/customer-booking'

export const Route = createFileRoute('/book')({
  head: () => ({ meta: [{ title: 'Book your included visit' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><CustomerBooking /></HydrationUnit>,
})
