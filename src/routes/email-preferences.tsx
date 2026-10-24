import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { EmailPreferences } from '../ui/email-preferences'

export const Route = createFileRoute('/email-preferences')({
  head: () => ({ meta: [{ title: 'Email preferences' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><EmailPreferences /></HydrationUnit>,
})
