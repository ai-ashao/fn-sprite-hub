import { createFileRoute } from '@tanstack/react-router'
import { MasteryGuidePage } from '@/components/sprites/mastery-guide-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/guides/how-to-master-sprites')({
  head: () =>
    localizedPageHead({
      pageId: 'mastery',
      locale: 'en',
      title: 'How to Master Sprites in Fortnite 2026',
      description:
        'Learn what Mastered means for Fortnite Sprite entries and how to track Owned and Mastered status separately.',
    }),
  component: MasteryGuidePage,
})
