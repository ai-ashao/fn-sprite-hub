import {
  currentSeason,
  entriesForFamily,
  finishLabel,
  rarityRank,
  type SpriteFamily,
  spriteFamilies,
} from '@/data/sprites'
import { useSpriteCollection } from '@/lib/sprites/collection'

const statusLabel = {
  missing: 'Missing',
  owned: 'Owned',
  mastered: 'Mastered',
} as const

const nextActionLabel = {
  missing: 'Mark owned',
  owned: 'Mark mastered',
  mastered: 'Clear status',
} as const

export function SpriteDetailPage({ family }: Readonly<{ family: SpriteFamily }>) {
  const collection = useSpriteCollection()
  const entries = entriesForFamily(family.id)
  const collected = entries.filter(
    (entry) => collection.getEntryState(entry.id) !== 'missing',
  ).length
  const mastered = entries.filter(
    (entry) => collection.getEntryState(entry.id) === 'mastered',
  ).length

  const related = [...spriteFamilies]
    .filter((candidate) => candidate.id !== family.id)
    .sort((a, b) => {
      const sameRarityA = a.rarity === family.rarity ? 1 : 0
      const sameRarityB = b.rarity === family.rarity ? 1 : 0
      return sameRarityB - sameRarityA || rarityRank[b.rarity] - rarityRank[a.rarity]
    })
    .slice(0, 4)

  return (
    <div className="sprite-content-page" data-collection-mounted={collection.mounted}>
      <nav aria-label="Breadcrumb" className="sprite-container sprite-breadcrumb">
        <a href="/">Tracker</a>
        <span>›</span>
        <a href="/sprites">Sprites</a>
        <span>›</span>
        <span aria-current="page">{family.name}</span>
      </nav>

      <header className="sprite-container sprite-detail-hero sprite-detail-hero-polished">
        <div className="sprite-detail-art">
          <img
            alt={`${family.name} Sprite in Fortnite`}
            height={440}
            src={family.familyImage}
            width={440}
          />
        </div>

        <div className="sprite-detail-copy">
          <p className="sprite-kicker">Chapter 7 Season 4 · Added {family.patchAdded}</p>
          <h1>{family.name} Sprite in Fortnite</h1>
          <p className="sprite-detail-lede">{family.ability}</p>

          <dl className="sprite-detail-stats">
            <div>
              <dt>Rarity</dt>
              <dd>
                <span className={`sprite-rarity rarity-${family.rarity.toLowerCase()}`}>
                  {family.rarity}
                </span>
              </dd>
            </div>
            <div>
              <dt>Variants</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>Collected</dt>
              <dd>
                {collected}/{entries.length}
              </dd>
            </div>
            <div>
              <dt>Mastered</dt>
              <dd>
                {mastered}/{entries.length}
              </dd>
            </div>
            <div>
              <dt>Patch</dt>
              <dd>{family.patchAdded}</dd>
            </div>
          </dl>

          <div className="sprite-detail-actions">
            <a className="sprite-primary-link" href="/">
              Open tracker
            </a>
            <a className="sprite-secondary-link" href="/sprites">
              Browse all Sprites
            </a>
          </div>

          <p className="sprite-detail-storage-note">
            Collection status is saved only in this browser.
          </p>
        </div>
      </header>

      <main className="sprite-container sprite-detail-body sprite-detail-body-polished">
        <section className="sprite-detail-section sprite-detail-variants-section">
          <div className="sprite-detail-section-head">
            <div>
              <p className="sprite-section-eyebrow">COLLECTION</p>
              <h2>{family.name} Sprite variants</h2>
            </div>
            <span>
              {collected}/{entries.length} collected · {mastered} mastered
            </span>
          </div>

          <p className="sprite-detail-section-intro">
            Each released finish is tracked independently. Tap a card to cycle its collection state.
          </p>

          <div className="sprite-detail-entries">
            {entries.map((entry) => {
              const state = collection.getEntryState(entry.id)
              return (
                <button
                  aria-label={`${entry.displayName}: ${statusLabel[state]}. ${nextActionLabel[state]}.`}
                  data-entry-id={entry.id}
                  data-entry-state={state}
                  data-image-mode={entry.imageMode}
                  key={entry.id}
                  onClick={() => collection.cycleEntry(entry.id)}
                  type="button"
                >
                  <span className="sprite-entry-art">
                    <img
                      alt={`${entry.displayName} Sprite artwork`}
                      height={160}
                      loading="lazy"
                      src={entry.image}
                      width={160}
                    />
                  </span>

                  <span className="sprite-detail-entry-copy">
                    <strong>{finishLabel(entry.finish)}</strong>
                    <small className="sprite-entry-state">
                      {state === 'missing'
                        ? '○ Missing'
                        : state === 'owned'
                          ? '✓ Owned'
                          : '★ Mastered'}
                    </small>
                    <span>{nextActionLabel[state]} →</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="sprite-detail-trust-panel">
          <div>
            <small>DATA FRESHNESS</small>
            <strong>Verified for {currentSeason.patch}</strong>
            <p>
              Roster and released finishes were last checked on{' '}
              <time dateTime={currentSeason.lastVerifiedAt}>{currentSeason.lastVerifiedAt}</time>.
            </p>
          </div>
          <a href="/new-sprites">See the current update snapshot →</a>
        </aside>

        <div className="sprite-detail-info-grid">
          <section className="sprite-detail-info-card">
            <p className="sprite-section-eyebrow">ACQUISITION</p>
            <h2>How to get {family.name}</h2>
            <p>{family.acquisitionHint}</p>
            <p className="sprite-detail-note">
              Live-patch availability can change, so FN Sprite Hub avoids presenting one fixed
              method as permanent.
            </p>
          </section>

          <section className="sprite-detail-info-card">
            <p className="sprite-section-eyebrow">LOCATION</p>
            <h2>Where to find {family.name}</h2>
            <p>{family.locationHint}</p>
            <a href="/locations">See all current Sprite location guidance →</a>
          </section>
        </div>

        <section className="sprite-detail-section">
          <div className="sprite-detail-section-head">
            <div>
              <p className="sprite-section-eyebrow">KEEP BROWSING</p>
              <h2>Related Sprites</h2>
            </div>
            <a href="/sprites">View all →</a>
          </div>

          <div className="sprite-related-grid sprite-related-grid-polished">
            {related.map((candidate) => (
              <a href={`/sprites/${candidate.slug}`} key={candidate.id}>
                <img
                  alt={`${candidate.name} Sprite`}
                  height={90}
                  loading="lazy"
                  src={candidate.familyImage}
                  width={90}
                />
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.rarity}</small>
                </span>
                <b aria-hidden="true">→</b>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
