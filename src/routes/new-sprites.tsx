import { createFileRoute } from '@tanstack/react-router'
import { NewSpritesPage } from '@/components/sprites/new-sprites-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/new-sprites')({
  head: () =>
    localizedPageHead({
      pageId: 'new',
      locale: 'en',
      title: 'New Fortnite Sprites 2026',
      description:
        'See the newest verified Fortnite Sprites and collectible entries by patch, with released and unreleased changes kept separate.',
    }),
  component: NewSpritesPage,
})
