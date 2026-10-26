import { createFileRoute } from '@tanstack/react-router'
import { HydrationUnit } from '../base/hydration/unit'
import { GloveApp } from '../ui/app'

export const Route = createFileRoute('/app')({
  // FIELD-004: the app installs to the home screen (Android from the manifest, iPhone as a home-screen web app).
  head: () => ({
    meta: [{ title: 'Glove' }, { name: 'mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-capable', content: 'yes' }, { name: 'apple-mobile-web-app-title', content: 'Glove' }],
    links: [{ rel: 'manifest', href: '/manifest.webmanifest' }],
    // Keep the complete loaded shell inventory, including the late app chunk.
    scripts: [{ children: 'performance.setResourceTimingBufferSize(5000)' }],
  }),
  component: () => <HydrationUnit><GloveApp /></HydrationUnit>,
})
