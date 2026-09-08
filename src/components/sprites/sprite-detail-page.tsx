import {
  currentSeason,
  entriesForFamily,
  finishLabel,
  rarityRank,
  type SpriteFamily,
  spriteFamilies,
} from '@/data/sprites'
import { useSpriteCollection } from '@/lib/sprites/collection'

export function SpriteDetailPage({ family }: Readonly<{ family: SpriteFamily }>) {
  const collection = useSpriteCollection()
  const entries = entriesForFamily(family.id)
  const related = [...spriteFamilies]
    .filter((candidate) => candidate.id !== family.id)
    .sort((a, b) => {
      const sameRarityA = a.rarity === family.rarity ? 1 : 0
      const sameRarityB = b.rarity === family.rarity ? 1 : 0
      return sameRarityB - sameRarityA || rarityRank[b.rarity] - rarityRank[a.rarity]
    })
    .slice(0, 4)

  return (
    <div className="sprite-content-page">
      <nav aria-label="Breadcrumb" className="sprite-container sprite-breadcrumb">
        <a href="/">Tracker</a>
        <span>›</span>
        <a href="/sprites">Sprites</a>
        <span>›</span>
        <span>{family.name}</span>
      </nav>

      <header className="sprite-container sprite-detail-hero">
        <div className="sprite-detail-art">
          <img
            alt={`${family.name} Sprite in Fortnite`}
            height={440}
            src={family.familyImage}
            width={440}
          />
        </div>
        <div>
          <p className="sprite-kicker">Chapter 7 Season 4 · Added {family.patchAdded}</p>
          <h1>{family.name} Sprite in Fortnite</h1>
          <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
            {family.rarity}
          </span>
          <p className="sprite-detail-lede">{family.ability}</p>
          <a className="sprite-primary-link" href="/">
            Open in Sprite Tracker →
          </a>
        </div>
      </header>

      <main className="sprite-container sprite-detail-body">
        <section>
          <h2>{family.name} Sprite variants</h2>
          <p>
            Each released entry is tracked independently. Click a state below once for Owned, again
            for Mastered, and a third time to clear.
          </p>
          <div className="sprite-detail-entries">
            {entries.map((entry) => {
              const state = collection.getEntryState(entry.id)
              return (
                <button
                  data-entry-state={state}
                  data-image-mode={entry.imageMode}
                  key={entry.id}
                  onClick={() => collection.cycleEntry(entry.id)}
                  type="button"
                >
                  <span className="sprite-entry-art">
                    <img
                      alt={`${entry.displayName} Sprite artwork`}
                      height={128}
                      loading="lazy"
                      src={entry.image}
                      width={128}
                    />
                    <strong>{finishLabel(entry.finish)}</strong>
                  </span>
                  <span className="sprite-entry-state">
                    {state === 'missing'
                      ? '○ Missing'
                      : state === 'owned'
                        ? '✓ Owned'
                        : '★ Mastered'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2>Data freshness</h2>
          <p>
            Current-season roster and released finishes were last checked on{' '}
            <time dateTime={currentSeason.lastVerifiedAt}>{currentSeason.lastVerifiedAt}</time> for{' '}
            {currentSeason.patch}. Entry tiles use the family artwork when a separately reviewed
            finish image is not available.
          </p>
        </section>

        <section>
          <h2>How to get {family.name} Sprite</h2>
          <p>{family.acquisitionHint}</p>
          <p>
            Current-season Sprite acquisition can change with live patches. FN Sprite Hub avoids
            presenting one fixed coordinate unless that location is verified for the active patch.
          </p>
        </section>

        <section>
          <h2>Where to find {family.name}</h2>
          <p>{family.locationHint}</p>
          <a href="/locations">See all current Sprite location guidance →</a>
        </section>

        <section>
          <h2>Related Sprites</h2>
          <div className="sprite-related-grid">
            {related.map((candidate) => (
              <a href={`/sprites/${candidate.slug}`} key={candidate.id}>
                <img alt="" height={90} src={candidate.familyImage} width={90} />
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.rarity}</small>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
