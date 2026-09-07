import { SpriteTrackerHome } from '@/components/sprites/sprite-tracker-home'
import type { Locale } from '@/i18n/config'
import { pageHead } from '@/lib/seo'

export function ProductHome({ locale }: Readonly<{ locale: Locale }>) {
  if (locale !== 'en') return null
  return <SpriteTrackerHome />
}

export function productHomeHead(locale: Locale) {
  if (locale !== 'en') {
    return pageHead({
      title: 'FN Sprite Hub',
      description: 'Fortnite Sprite Tracker.',
      path: '/',
      indexable: false,
    })
  }

  return pageHead({
    title: 'Fortnite Sprite Tracker 2026',
    description:
      'Track Fortnite Sprites in Chapter 7 Season 4. Mark Owned, Missing and Mastered entries with a free browser-based tracker updated for the current patch.',
    path: '/',
    indexable: true,
  })
}
