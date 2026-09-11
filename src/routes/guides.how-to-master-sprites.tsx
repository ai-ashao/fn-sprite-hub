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
        'Understand Sprite collection XP, extraction and Crown / Klombo leveling rules using patch-sourced guidance. Track Owned and Mastered separately.',
    }),
  component: MasteryGuidePage,
})
