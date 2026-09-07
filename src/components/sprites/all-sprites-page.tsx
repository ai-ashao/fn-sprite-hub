import {
  currentFamilyCount,
  currentReleasedEntryCount,
  currentSeason,
  entriesForFamily,
  spriteFamilies,
} from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

export function AllSpritesPage() {
  return (
    <SpriteContentLayout
      description={`Browse ${currentFamilyCount} current Sprite families and ${currentReleasedEntryCount} released collectible entries, kept separate from legacy seasons.`}
      eyebrow={`Chapter 7 Season 4 · ${currentSeason.patch}`}
      title="All Fortnite Sprites 2026"
    >
      <div className="sprite-database-grid">
        {spriteFamilies.map((family) => (
          <a className="sprite-database-card" href={`/sprites/${family.slug}`} key={family.id}>
            <div>
              <img
                alt={`${family.name} Sprite`}
                height={220}
                src={family.familyImage}
                width={220}
              />
            </div>
            <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
              {family.rarity}
            </span>
            <h2>{family.name} Sprite</h2>
            <p>{family.ability}</p>
            <small>{entriesForFamily(family.id).length} released entries</small>
          </a>
        ))}
      </div>
    </SpriteContentLayout>
  )
}
