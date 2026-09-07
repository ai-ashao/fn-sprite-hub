import { createFileRoute } from '@tanstack/react-router'
import { AllSpritesPage } from '@/components/sprites/all-sprites-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/sprites/')({
  head: () =>
    localizedPageHead({
      pageId: 'sprites',
      locale: 'en',
      title: 'All Fortnite Sprites 2026',
      description:
        'Browse every current Fortnite Sprite family with rarity, ability, released entries and links to full Sprite guides.',
    }),
  component: AllSpritesPage,
})
