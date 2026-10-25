import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { PublicTechnicianPortrait } from '../ui/technician-portrait'

export const Route = createFileRoute('/technician-photo')({
  head: () => ({ meta: [{ title: 'Your technician' }, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }),
  component: () => <HydrationUnit><PublicTechnicianPortrait /></HydrationUnit>,
})
