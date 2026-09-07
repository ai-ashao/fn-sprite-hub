import { createFileRoute } from '@tanstack/react-router'
import { LocationsPage } from '@/components/sprites/locations-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/locations')({
  head: () =>
    localizedPageHead({
      pageId: 'locations',
      locale: 'en',
      title: 'Fortnite Sprite Locations 2026',
      description:
        'Find current Fortnite Sprites with current-season location and acquisition guidance for Chapter 7 Season 4.',
    }),
  component: LocationsPage,
})
