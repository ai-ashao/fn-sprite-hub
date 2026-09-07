import { createFileRoute } from '@tanstack/react-router'
import { RarityPage } from '@/components/sprites/rarity-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/rarity')({
  head: () =>
    localizedPageHead({
      pageId: 'rarity',
      locale: 'en',
      title: 'Fortnite Sprite Rarity 2026',
      description:
        'Browse current Fortnite Sprites by Rare, Epic, Legendary and Mythic rarity tiers with links to each Sprite guide.',
    }),
  component: RarityPage,
})
