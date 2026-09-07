import { createFileRoute } from '@tanstack/react-router'
import { RarestSpritesPage } from '@/components/sprites/rarest-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/rarest-sprites')({
  head: () =>
    localizedPageHead({
      pageId: 'rarest',
      locale: 'en',
      title: 'Rarest Fortnite Sprites 2026',
      description:
        'Compare current Fortnite Sprites by verified rarity tier with a transparent methodology that separates rarity from estimated drop rates.',
    }),
  component: RarestSpritesPage,
})
