import { rarityRank, spriteFamilies } from '@/data/sprites'
import { SpriteContentLayout } from './content-layout'

export function RarestSpritesPage() {
  const ranked = [...spriteFamilies].sort(
    (a, b) => rarityRank[b.rarity] - rarityRank[a.rarity] || a.name.localeCompare(b.name),
  )

  return (
    <SpriteContentLayout
      description="A transparent current-season rarity comparison. This page ranks verified rarity tiers and does not present estimated drop rates as official Epic probabilities."
      eyebrow="METHODOLOGY · VERIFIED RARITY TIERS"
      title="Rarest Fortnite Sprites 2026"
    >
      <section className="sprite-notice">
        <strong>How this ranking works</strong>
        <p>
          FN Sprite Hub sorts the current roster by verified rarity tier first. It does not claim
          that every Mythic has a lower real-world drop probability than every Legendary unless a
          reliable current source proves that separately.
        </p>
      </section>

      <ol className="sprite-ranking-list">
        {ranked.map((family, index) => (
          <li key={family.id}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <img alt="" height={64} src={family.familyImage} width={64} />
            <div>
              <h2>
                <a href={`/sprites/${family.slug}`}>{family.name} Sprite</a>
              </h2>
              <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
                {family.rarity}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </SpriteContentLayout>
  )
}
