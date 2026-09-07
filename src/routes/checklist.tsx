import { createFileRoute } from '@tanstack/react-router'
import { SpriteChecklistPage } from '@/components/sprites/checklist-page'
import { localizedPageHead } from '@/lib/seo'

export const Route = createFileRoute('/checklist')({
  head: () =>
    localizedPageHead({
      pageId: 'checklist',
      locale: 'en',
      title: 'Fortnite Sprite Checklist 2026',
      description:
        'Mark all released Fortnite Sprite entries as Owned or Mastered with a free current-season checklist saved in your browser.',
    }),
  component: SpriteChecklistPage,
})
