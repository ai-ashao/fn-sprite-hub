import { currentSeason, spriteFamilies } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

export function LocationsPage() {
  return (
    <SpriteContentLayout
      description="Find current-season Fortnite Sprites using verified acquisition guidance instead of relying on outdated fixed chest maps."
      eyebrow={`Chapter 7 Season 4 · ${currentSeason.patch}`}
      title="Fortnite Sprite Locations 2026"
    >
      <section className="sprite-notice">
        <strong>Current-season location rule</strong>
        <p>
          Season 4 uses live loot, Cheat Code sources and special conditions. A Sprite can be easier
          to encounter in certain situations without having one guaranteed permanent coordinate.
        </p>
      </section>

      <div className="sprite-location-list">
        {spriteFamilies.map((family) => (
          <article key={family.id}>
            <img alt="" height={72} src={family.familyImage} width={72} />
            <div>
              <h2>
                <a href={`/sprites/${family.slug}`}>{family.name} Sprite</a>
              </h2>
              <p>{family.locationHint}</p>
              <small>{family.acquisitionHint}</small>
            </div>
          </article>
        ))}
      </div>
    </SpriteContentLayout>
  )
}
