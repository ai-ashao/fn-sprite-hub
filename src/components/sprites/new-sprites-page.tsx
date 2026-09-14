import { currentReleasedEntryCount, currentSeason, spriteFamilies } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

const newestIds = new Set(['storm-scout', 'x-ray', 'onigiri', 'overshield', 'mega-man'])
const newest = spriteFamilies.filter((family) => newestIds.has(family.id))

export function NewSpritesPage() {
  return (
    <SpriteContentLayout
      description="Track the newest verified Fortnite Sprites and collectible entries by patch. Announced or datamined entries stay clearly separated from released entries."
      eyebrow={`LAST VERIFIED ${currentSeason.lastVerifiedAt}`}
      title="New Fortnite Sprites 2026"
    >
      <section className="sprite-changelog">
        <header>
          <small>September 10, 2026</small>
          <h2>Loot Hacker variants released</h2>
          <p>
            Fourteen more Loot Hacker variants entered the live loot pool, bringing the current
            tracker to {currentReleasedEntryCount} released entries. Mega Man remains single-form.
          </p>
        </header>
      </section>
      <section className="sprite-changelog">
        <header>
          <small>September 3, 2026</small>
          <h2>Patch v42.10</h2>
          <p>Five Sprite families were added to the current collection snapshot.</p>
        </header>
        <div className="sprite-mini-grid">
          {newest.map((family) => (
            <a href={`/sprites/${family.slug}`} key={family.id}>
              <img alt="" height={110} src={family.familyImage} width={110} />
              <strong>{family.name}</strong>
              <small>{family.rarity}</small>
            </a>
          ))}
        </div>
        <p>Loot Hacker Crown was the first released Loot Hacker entry on September 3.</p>
      </section>
    </SpriteContentLayout>
  )
}
