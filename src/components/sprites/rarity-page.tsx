import { type SpriteRarity, spriteFamilies } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

const order: SpriteRarity[] = ['Mythic', 'Legendary', 'Epic', 'Rare']

export function RarityPage() {
  return (
    <SpriteContentLayout
      description="Browse current Fortnite Sprites by rarity without confusing rarity tier with how hard a specific collectible entry is to obtain."
      eyebrow="CURRENT SEASON DATABASE"
      title="Fortnite Sprite Rarity 2026"
    >
      {order.map((rarity) => {
        const families = spriteFamilies.filter((family) => family.rarity === rarity)
        return (
          <section className="sprite-rarity-section" key={rarity}>
            <div>
              <span className={`sprite-rarity rarity-${rarity.toLowerCase()}`}>{rarity}</span>
              <h2>{rarity} Sprites</h2>
              <p>
                {families.length} current Sprite {families.length === 1 ? 'family' : 'families'}.
              </p>
            </div>
            <div className="sprite-name-links">
              {families.map((family) => (
                <a href={`/sprites/${family.slug}`} key={family.id}>
                  {family.name}
                </a>
              ))}
            </div>
          </section>
        )
      })}
    </SpriteContentLayout>
  )
}
