import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { CustomerQuote } from '../ui/customer-quote'

export const Route = createFileRoute('/quote')({
  head: () => ({ meta: [{ title: 'Your quote' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><CustomerQuote /></HydrationUnit>,
})
