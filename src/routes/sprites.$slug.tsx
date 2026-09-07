import { createFileRoute, notFound } from '@tanstack/react-router'
import { SpriteDetailPage } from '@/components/sprites/sprite-detail-page'
import { familyBySlug, spriteSeoRegistry } from '@/data/sprites'
import { pageHead } from '@/lib/seo'

export const Route = createFileRoute('/sprites/$slug')({
  loader: ({ params }) => {
    const family = familyBySlug(params.slug)
    if (!family) throw notFound()

    const seo = spriteSeoRegistry.find((entry) => entry.familyId === family.id)
    return { family, seo }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return pageHead({
        title: 'Fortnite Sprite',
        description: 'Fortnite Sprite guide.',
        path: '/sprites',
        indexable: false,
      })
    }

    const { family, seo } = loaderData
    return pageHead({
      title: `${family.name} Sprite in Fortnite – How to Get & Variants`,
      description: `${family.name} Sprite guide for Fortnite Chapter 7 Season 4: rarity, ability, released variants, location guidance and collection tracking.`,
      path: `/sprites/${family.slug}`,
      indexable: seo?.indexable ?? false,
    })
  },
  component: DetailRoute,
})

function DetailRoute() {
  const { family } = Route.useLoaderData()
  return <SpriteDetailPage family={family} />
}
