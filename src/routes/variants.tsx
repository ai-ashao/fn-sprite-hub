import { createFileRoute } from '@tanstack/react-router'
import { VariantsPage } from '@/components/sprites/variants-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/variants')({
  head: () =>
    localizedPageHead({
      pageId: 'variants',
      locale: 'en',
      title: 'Fortnite Sprite Variants 2026',
      description:
        'See Base, Gold, Cheat Master and Loot Hacker Fortnite Sprite variants and which entries are verified released this season.',
    }),
  component: VariantsPage,
})
