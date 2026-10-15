import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { GloveApp } from '../ui/app'

export const Route = createFileRoute('/app')({
  head: () => ({ meta: [{ title: 'Glove' }] }),
  component: () => <HydrationUnit><GloveApp /></HydrationUnit>,
})
